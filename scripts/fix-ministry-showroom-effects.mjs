import { readFileSync, writeFileSync } from "node:fs";
import ts from "typescript";

const targets = [
  {
    path: "apps/church-hub/components/family-showcase.tsx",
    removeReactImports: ["useMemo"],
    effectDeps: "",
    sourceReplacements: [
      [
        "return String(100000 + (values[0] % 900000));",
        "return String(100000 + ((values[0] ?? 0) % 900000));",
      ],
      [
        "const [selectedService, setSelectedService] = useState(services[0].id);",
        'const [selectedService, setSelectedService] = useState<(typeof services)[number]["id"]>(\n    services[0]!.id,\n  );',
      ],
      [
        "const [selectedConsentChild, setSelectedConsentChild] = useState(initialState.children[0].id);",
        "const [selectedConsentChild, setSelectedConsentChild] = useState<string>(\n    initialState.children[0]!.id,\n  );",
      ],
      ["?? services[0];", "?? services[0]!;"],
      [
        "setSelectedConsentChild(initialState.children[0].id);",
        "setSelectedConsentChild(initialState.children[0]!.id);",
      ],
    ],
  },
  {
    path: "apps/church-hub/components/gift-moderation-console.tsx",
    loader: "loadLive",
    loaderDeps: "status",
    effectDeps: "loadLive, mode",
  },
  {
    path: "apps/church-hub/components/gifts-of-church.tsx",
    loader: "refreshLive",
    loaderDeps: "",
    effectDeps: "mode, refreshLive",
  },
  {
    path: "apps/church-hub/components/prayer-leader-console.tsx",
    loader: "loadLive",
    loaderDeps: "filter",
    effectDeps: "loadLive, mode",
  },
  {
    path: "apps/church-hub/components/prayer-well-complete.tsx",
    loader: "refreshLive",
    loaderDeps: "",
    effectDeps: "mode, refreshLive",
  },
  {
    path: "apps/church-hub/components/prayer-well.tsx",
    loader: "refreshLive",
    loaderDeps: "",
    effectDeps: "mode, refreshLive",
  },
  {
    path: "apps/church-hub/components/recovery-admin-console.tsx",
    loader: "load",
    loaderDeps: "",
    effectDeps: "load, mode",
  },
  {
    path: "apps/church-hub/components/recovery-ministry-gate.tsx",
    loader: "load",
    loaderDeps: "mode",
    effectDeps: "load",
  },
  {
    path: "apps/church-hub/components/recovery-ministry.tsx",
    loader: "refreshLive",
    loaderDeps: "",
    effectDeps: "canLead, mode, previewRole, refreshLive",
    removeLines: [
      '  const pendingOwnRequest = membershipRequests.find((request) => request.status === "pending");\n',
    ],
  },
  {
    path: "apps/church-hub/components/service-admin.tsx",
    loader: "refreshLive",
    loaderDeps: "",
    effectDeps: "mode, refreshLive",
  },
  {
    path: "apps/church-hub/components/service-hub.tsx",
    loader: "refreshLive",
    loaderDeps: "",
    effectDeps: "defaultPostalCode, mode, refreshLive",
    effectReplacements: [
      ["void refreshLive(postalCode, radius);", "void refreshLive(defaultPostalCode, 15);"],
      [
        "    // The initial load is intentionally controlled here rather than on every keystroke.\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n",
        "",
      ],
    ],
    componentReplacement: [
      "  function guide() {\n    const question = guideQuestion.toLowerCase();",
      '  function guide() {\n    const question = guideQuestion.toLowerCase();\n    if (canLead && /approve|review|admin|publish/.test(question)) {\n      setNotice("Leader review and publishing controls are available in Ministry Admin → Service.");\n      return;\n    }',
    ],
  },
];

const requiredTextRoutes = [
  "apps/church-hub/app/api/admin/gifts/route.ts",
  "apps/church-hub/app/api/admin/prayer/route.ts",
  "apps/church-hub/app/api/admin/recovery/route.ts",
  "apps/church-hub/app/api/admin/service/route.ts",
  "apps/church-hub/app/api/gifts/route.ts",
  "apps/church-hub/app/api/prayer-well-complete/route.ts",
  "apps/church-hub/app/api/prayer-well/route.ts",
  "apps/church-hub/app/api/recovery/route.ts",
  "apps/church-hub/app/api/service/route.ts",
];

function widenOptionalProperties(source) {
  return source.replace(
    /(\b[A-Za-z_$][\w$]*\?)\s*:\s*([^;\n]+);/g,
    (match, property, valueType) =>
      /\bundefined\b/.test(valueType)
        ? match
        : `${property}: ${valueType.trim()} | undefined;`,
  );
}

function applySourceReplacements(source, replacements, path) {
  for (const [before, after] of replacements ?? []) {
    if (!source.includes(before)) {
      throw new Error(`${path}: source replacement anchor not found: ${before}`);
    }
    source = source.replace(before, after);
  }
  return source;
}

function updateReactImport(source, addUseCallback, removals = []) {
  const pattern = /import \{([^}]+)\} from "react";/;
  const match = source.match(pattern);
  if (!match) throw new Error("React named import not found");
  const values = match[1]
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => !removals.includes(value));
  if (addUseCallback && !values.includes("useCallback")) values.push("useCallback");
  return source.replace(pattern, `import { ${values.join(", ")} } from "react";`);
}

function findFirstEffect(sourceFile) {
  let result;
  const visit = (node) => {
    if (result) return;
    if (
      ts.isExpressionStatement(node) &&
      ts.isCallExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "useEffect"
    ) {
      result = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return result;
}

function findLoader(sourceFile, name) {
  let result;
  const visit = (node) => {
    if (result) return;
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) {
      result = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return result;
}

function findFunction(sourceFile, name) {
  let result;
  const visit = (node) => {
    if (result) return;
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) {
      result = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return result;
}

function dedent(text) {
  const lines = text.replace(/^\n/, "").replace(/\s+$/, "").split("\n");
  const indents = lines
    .filter((line) => line.trim())
    .map((line) => line.match(/^\s*/)?.[0].length ?? 0);
  const minimum = indents.length ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(minimum)).join("\n");
}

function indent(text, spaces) {
  const prefix = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => (line ? `${prefix}${line}` : ""))
    .join("\n");
}

function transformTarget(target) {
  let source = readFileSync(target.path, "utf8");
  source = widenOptionalProperties(source);
  source = applySourceReplacements(source, target.sourceReplacements, target.path);
  for (const line of target.removeLines ?? []) source = source.replace(line, "");
  if (target.componentReplacement) {
    const [before, after] = target.componentReplacement;
    if (!source.includes(before)) {
      throw new Error(`${target.path}: component replacement anchor not found`);
    }
    source = source.replace(before, after);
  }

  const sourceFile = ts.createSourceFile(
    target.path,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const effect = findFirstEffect(sourceFile);
  if (!effect) throw new Error(`${target.path}: first useEffect not found`);
  const effectCall = effect.expression;
  const callback = effectCall.arguments[0];
  if (!callback || (!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback))) {
    throw new Error(`${target.path}: unsupported effect callback`);
  }
  if (!ts.isBlock(callback.body)) throw new Error(`${target.path}: effect body must be a block`);

  let effectBody = dedent(
    source.slice(callback.body.getStart(sourceFile) + 1, callback.body.getEnd() - 1),
  );
  for (const [before, after] of target.effectReplacements ?? []) {
    effectBody = effectBody.replace(before, after);
  }
  effectBody = effectBody
    .split("\n")
    .filter((line) => !line.includes("eslint-disable-next-line react-hooks/exhaustive-deps"))
    .join("\n")
    .replace(/\s+$/, "");

  const scheduledEffect = `  useEffect(() => {\n    const frame = window.requestAnimationFrame(() => {\n${indent(effectBody, 6)}\n    });\n    return () => window.cancelAnimationFrame(frame);\n  }, [${target.effectDeps}]);`;

  let replacement = scheduledEffect;
  let loaderStart;
  let loaderEnd;
  if (target.loader) {
    const loader = findLoader(sourceFile, target.loader);
    if (!loader || !loader.body) throw new Error(`${target.path}: loader ${target.loader} not found`);
    const params = loader.parameters.map((parameter) => parameter.getText(sourceFile)).join(", ");
    const type = loader.type ? `: ${loader.type.getText(sourceFile)}` : "";
    const body = loader.body.getText(sourceFile);
    const stableLoader = `  const ${target.loader} = useCallback(async (${params})${type} => ${body}, [${target.loaderDeps}]);`;
    replacement = `${stableLoader}\n\n${scheduledEffect}`;
    loaderStart = loader.getStart(sourceFile);
    loaderEnd = loader.getEnd();
  }

  const edits = [{ start: effect.getStart(sourceFile), end: effect.getEnd(), text: replacement }];
  if (loaderStart != null && loaderEnd != null) {
    edits.push({ start: loaderStart, end: loaderEnd, text: "" });
  }
  edits.sort((a, b) => b.start - a.start);
  for (const edit of edits) {
    source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
  }

  source = updateReactImport(source, Boolean(target.loader), target.removeReactImports ?? []);
  writeFileSync(target.path, source, "utf8");
  console.log(`Updated ${target.path}`);
}

function upgradeRequiredTextRoute(path) {
  let source = readFileSync(path, "utf8");
  let sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const edits = [];
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "text" &&
      node.arguments.length >= 3 &&
      node.arguments[2].kind === ts.SyntaxKind.TrueKeyword
    ) {
      edits.push({
        start: node.getStart(sourceFile),
        end: node.getEnd(),
        text: `requiredText(${node.arguments[0].getText(sourceFile)}, ${node.arguments[1].getText(sourceFile)})`,
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  edits.sort((a, b) => b.start - a.start);
  for (const edit of edits) source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);

  if (!source.includes("function requiredText(")) {
    sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const textFunction = findFunction(sourceFile, "text");
    if (!textFunction) throw new Error(`${path}: text helper not found`);
    const helper = `\n\nfunction requiredText(value: unknown, maximum: number): string {\n  const normalized = text(value, maximum, true);\n  if (!normalized) throw new Error("Complete the required information.");\n  return normalized;\n}`;
    source = `${source.slice(0, textFunction.getEnd())}${helper}${source.slice(textFunction.getEnd())}`;
  }

  writeFileSync(path, source, "utf8");
  console.log(`Hardened required text handling in ${path}`);
}

for (const target of targets) transformTarget(target);
for (const path of requiredTextRoutes) upgradeRequiredTextRoute(path);

const giftsPagePath = "apps/church-hub/app/(protected)/gifts/page.tsx";
let giftsPage = readFileSync(giftsPagePath, "utf8");
giftsPage = giftsPage.replace(
  "        assessmentUrl={process.env.NEXT_PUBLIC_SPIRITUAL_GIFTS_ASSESSMENT_URL}\n",
  "        {...(process.env.NEXT_PUBLIC_SPIRITUAL_GIFTS_ASSESSMENT_URL\n          ? { assessmentUrl: process.env.NEXT_PUBLIC_SPIRITUAL_GIFTS_ASSESSMENT_URL }\n          : {})}\n",
);
writeFileSync(giftsPagePath, giftsPage, "utf8");
console.log(`Updated ${giftsPagePath}`);

const navigationPath = "apps/church-hub/lib/ministry-navigation.ts";
let navigation = readFileSync(navigationPath, "utf8");
navigation = navigation.replace(
  "    return [ministryRouteCatalog[0], ministryRouteCatalog[2], ministryRouteCatalog[1]];",
  "    return [ministryRouteCatalog[0]!, ministryRouteCatalog[2]!, ministryRouteCatalog[1]!];",
);
writeFileSync(navigationPath, navigation, "utf8");
console.log(`Updated ${navigationPath}`);

const migrationPath = "supabase/migrations/0039_service_hub_completion.sql";
let migration = readFileSync(migrationPath, "utf8");
const ambiguousOrder =
  "  order by next_shift_starts_at nulls last, so.published_at desc nulls last";
const safeOrder = "  order by 15 nulls last, so.published_at desc nulls last";
if (!migration.includes(ambiguousOrder)) {
  throw new Error("Service public-listing order expression was not found");
}
migration = migration.replace(ambiguousOrder, safeOrder);
writeFileSync(migrationPath, migration, "utf8");
console.log(`Updated ${migrationPath}`);
