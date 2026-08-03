import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const migrationsDirectory = new URL("../supabase/migrations/", import.meta.url);
const migrationFiles = readdirSync(migrationsDirectory)
  .filter((file) => /^\d{4}_.+\.sql$/.test(file))
  .sort();

const failures = [];
const expectedNumbers = migrationFiles.map((_, index) => index + 1);
const actualNumbers = migrationFiles.map((file) => Number(file.slice(0, 4)));
if (JSON.stringify(actualNumbers) !== JSON.stringify(expectedNumbers)) {
  failures.push(`Migration sequence is not contiguous: ${actualNumbers.join(", ")}`);
}

const sources = migrationFiles.map((file) => ({
  file,
  sql: readFileSync(join(migrationsDirectory.pathname, file), "utf8")
}));
const combined = sources.map(({ sql }) => sql).join("\n");
const withoutLineComments = combined.replace(/--.*$/gm, "");

const dollarTags = withoutLineComments.match(/\$[A-Za-z_0-9]*\$/g) ?? [];
const dollarCounts = new Map();
for (const tag of dollarTags) dollarCounts.set(tag, (dollarCounts.get(tag) ?? 0) + 1);
for (const [tag, count] of dollarCounts) {
  if (count % 2 !== 0) failures.push(`Unbalanced SQL dollar quote ${tag}: ${count} occurrences`);
}

for (const { file, sql } of sources) {
  const cleaned = sql.replace(/--.*$/gm, "");
  const beginCount = (cleaned.match(/\bbegin\s*;/gi) ?? []).length;
  const commitCount = (cleaned.match(/\bcommit\s*;/gi) ?? []).length;
  if (beginCount !== commitCount) {
    failures.push(`${file}: BEGIN count ${beginCount} does not match COMMIT count ${commitCount}`);
  }
}

const createdTables = [];
for (const { file, sql } of sources) {
  for (const match of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-zA-Z_][\w]*)/gi)) {
    createdTables.push({ table: match[1].toLowerCase(), file });
  }
}
const tableCounts = new Map();
for (const { table } of createdTables) tableCounts.set(table, (tableCounts.get(table) ?? 0) + 1);
for (const [table, count] of tableCounts) {
  if (count > 1) failures.push(`Table public.${table} is created ${count} times`);
}

const rlsTables = new Set();
for (const match of withoutLineComments.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?public\.([a-zA-Z_][\w]*)\s+enable\s+row\s+level\s+security/gi)) {
  rlsTables.add(match[1].toLowerCase());
}
for (const match of withoutLineComments.matchAll(/foreach\s+\w+\s+in\s+array\s+array\[([\s\S]*?)\]\s*loop\s*execute\s+format\(\s*'alter table public\.%I enable row level security'/gi)) {
  for (const identifier of match[1].matchAll(/'([a-zA-Z_][\w]*)'/g)) {
    rlsTables.add(identifier[1].toLowerCase());
  }
}
const missingRls = [...tableCounts.keys()].filter((table) => !rlsTables.has(table)).sort();
if (missingRls.length) failures.push(`Tables missing explicit RLS enablement: ${missingRls.join(", ")}`);

for (const { file, sql } of sources) {
  for (const line of sql.split("\n")) {
    const broadGrant = /grant\s+all\s+on\s+(?:all\s+tables|table\s+public\.)/i.test(line);
    const browserRole = /\b(?:anon|authenticated)\b/i.test(line);
    if (broadGrant && browserRole) failures.push(`${file}: broad browser-role grant: ${line.trim()}`);
  }

  for (const match of sql.matchAll(/\bsecurity\s+definer\b/gi)) {
    const start = Math.max(0, match.index - 900);
    const end = Math.min(sql.length, match.index + match[0].length + 450);
    const context = sql.slice(start, end);
    if (!/\bset\s+search_path\b/i.test(context)) {
      const names = [...sql.slice(start, match.index).matchAll(/function\s+(?:public\.)?([\w]+)/gi)];
      const functionName = names.at(-1)?.[1] ?? "unknown function";
      failures.push(`${file}: SECURITY DEFINER function ${functionName} lacks nearby SET search_path`);
    }
  }
}

if (failures.length) {
  console.error("Static SQL validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Static SQL validation passed: ${migrationFiles.length} migrations, ${createdTables.length} public tables, contiguous numbering, balanced transaction/dollar delimiters, and RLS enablement coverage.`
);
