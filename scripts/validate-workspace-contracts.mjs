import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const root = process.cwd();
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const ignoredDirectories = new Set(["node_modules", ".next", "dist", "coverage", ".turbo", ".git"]);
const dependencySections = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
const failures = [];

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    failures.push(`${relative(root, file)} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function packageJsonFiles() {
  const files = [];
  const patterns = [
    ["apps", 1],
    [join("apps", "workers"), 1],
    ["packages", 1]
  ];

  for (const [base, depth] of patterns) {
    const basePath = resolve(root, base);
    if (!existsSync(basePath)) continue;
    for (const entry of readdirSync(basePath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const packageFile = join(basePath, entry.name, "package.json");
      if (depth === 1 && existsSync(packageFile)) files.push(packageFile);
    }
  }
  return files.sort();
}

function walkSourceFiles(directory, output = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      walkSourceFiles(absolute, output);
      continue;
    }
    const extension = entry.name.slice(entry.name.lastIndexOf("."));
    if (sourceExtensions.has(extension)) output.push(absolute);
  }
  return output;
}

function collectInternalImports(directory) {
  const imports = new Set();
  const pattern = /(?:from\s+|import\s*\(|require\s*\()\s*["'](@church\/[^/"']+)/g;
  for (const file of walkSourceFiles(directory)) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(pattern)) imports.add(match[1]);
  }
  return imports;
}

function allDependencies(pkg) {
  return Object.assign({}, ...dependencySections.map((section) => pkg[section] ?? {}));
}

function effectivePaths(packageDirectory, basePaths) {
  const configFile = join(packageDirectory, "tsconfig.json");
  if (!existsSync(configFile)) return basePaths;
  const config = readJson(configFile);
  if (!config) return {};
  return config.compilerOptions?.paths ?? basePaths;
}

function resolveAliasTarget(alias, target, packageDirectory, configHasOwnPaths) {
  const baseDirectory = configHasOwnPaths ? packageDirectory : root;
  return resolve(baseDirectory, target);
}

const packageFiles = packageJsonFiles();
const packages = new Map();

for (const file of packageFiles) {
  const pkg = readJson(file);
  if (!pkg?.name) {
    failures.push(`${relative(root, file)} must define a package name.`);
    continue;
  }
  if (packages.has(pkg.name)) {
    failures.push(`Duplicate workspace package name ${pkg.name}.`);
    continue;
  }
  packages.set(pkg.name, { file, directory: dirname(file), pkg });
}

const rootConfig = readJson(resolve(root, "tsconfig.base.json"));
const basePaths = rootConfig?.compilerOptions?.paths ?? {};
const rootPackage = readJson(resolve(root, "package.json"));

for (const [alias, targets] of Object.entries(basePaths)) {
  if (!alias.startsWith("@church/")) continue;
  if (!packages.has(alias)) failures.push(`tsconfig.base.json alias ${alias} has no workspace package.`);
  if (!Array.isArray(targets) || targets.length === 0) {
    failures.push(`tsconfig.base.json alias ${alias} must have at least one target.`);
    continue;
  }
  for (const target of targets) {
    if (!existsSync(resolve(root, target))) failures.push(`tsconfig.base.json alias ${alias} points to missing file ${target}.`);
  }
}

for (const [name, workspace] of packages) {
  const dependencies = allDependencies(workspace.pkg);
  const internalDependencies = Object.entries(dependencies).filter(([dependency]) => dependency.startsWith("@church/"));
  const imports = collectInternalImports(workspace.directory);
  const configFile = join(workspace.directory, "tsconfig.json");
  const packageConfig = existsSync(configFile) ? readJson(configFile) : null;
  const hasOwnPaths = Boolean(packageConfig?.compilerOptions?.paths);
  const paths = effectivePaths(workspace.directory, basePaths);

  for (const [dependency, version] of internalDependencies) {
    if (!packages.has(dependency)) failures.push(`${name} declares unknown workspace dependency ${dependency}.`);
    if (typeof version !== "string" || !version.startsWith("workspace:")) {
      failures.push(`${name} must reference ${dependency} with the workspace: protocol, not ${String(version)}.`);
    }
  }

  for (const imported of imports) {
    if (!packages.has(imported)) {
      failures.push(`${name} imports unknown workspace package ${imported}.`);
      continue;
    }
    if (imported !== name && !(imported in dependencies)) {
      failures.push(`${name} imports ${imported} but does not declare it in package.json.`);
    }
    const targets = paths[imported];
    if (!Array.isArray(targets) || targets.length === 0) {
      failures.push(`${name} imports ${imported}, but its effective tsconfig paths do not define that alias.`);
      continue;
    }
    for (const target of targets) {
      const resolved = resolveAliasTarget(imported, target, workspace.directory, hasOwnPaths);
      if (!existsSync(resolved)) {
        failures.push(`${name} alias ${imported} points to missing target ${relative(root, resolved)}.`);
      }
    }
  }

  if (workspace.directory.startsWith(resolve(root, "apps")) && !workspace.directory.includes(`${join("apps", "workers")}`)) {
    const nextConfig = join(workspace.directory, "next.config.ts");
    if (existsSync(nextConfig)) {
      const nextSource = readFileSync(nextConfig, "utf8");
      for (const imported of imports) {
        if (imported === name) continue;
        if (!nextSource.includes(`"${imported}"`) && !nextSource.includes(`'${imported}'`)) {
          failures.push(`${name} imports ${imported}, but next.config.ts does not list it in transpilePackages.`);
        }
      }
    }
  }
}

if (rootPackage?.version) {
  for (const [name, workspace] of packages) {
    if (workspace.pkg.version !== rootPackage.version) {
      failures.push(`${name} is version ${workspace.pkg.version}; expected workspace version ${rootPackage.version}.`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Workspace contract validation failed (${failures.length} issue${failures.length === 1 ? "" : "s"}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Workspace contracts verified: ${packages.size} packages, ${Object.keys(basePaths).length} TypeScript aliases, declared internal dependencies, and Next.js transpilation boundaries.`
);
