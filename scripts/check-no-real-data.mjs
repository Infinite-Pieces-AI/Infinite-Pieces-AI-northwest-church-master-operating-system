import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const ignored = new Set([".git", ".next", "node_modules", ".turbo", "dist", "coverage"]);
const textExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".md",
  ".sql",
  ".toml",
  ".yaml",
  ".yml",
  ".env",
  ".example",
]);
const prohibitedNames = [
  /real[-_ ]?children/i,
  /production[-_ ]?export/i,
  /member[-_ ]?directory/i,
  /prayer[-_ ]?requests?\.csv/i,
];
const unsafeFlags = [
  /ALLOW_REAL_CHILD_DATA\s*=\s*true/i,
  /ALLOW_AI_PRIVATE_DATA_ACCESS\s*=\s*true/i,
  /ALLOW_AUTOMATIC_SOCIAL_PUBLISHING\s*=\s*true/i,
  /SOCIAL_AUTO_PUBLISH_ENABLED\s*=\s*true/i,
  /ALLOW_CUSTOM_CHILD_RELEASE\s*=\s*true/i,
];
const secretPatterns = [
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*(?!replace-|$)[^\s]+/i,
  /INVITATION_TOKEN_PEPPER\s*=\s*(?!replace-|$)[^\s]+/i,
  /\b(?:sk|sb_secret)_[A-Za-z0-9_-]{20,}\b/,
];

const violations = [];

function walk(directory) {
  for (const name of readdirSync(directory)) {
    if (ignored.has(name)) continue;
    const full = join(directory, name);
    const rel = relative(root, full);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full);
      continue;
    }
    if (prohibitedNames.some((pattern) => pattern.test(name)))
      violations.push(`${rel}: prohibited data-like filename`);
    if (textExtensions.has(extname(name)) || name.includes(".env")) {
      const text = readFileSync(full, "utf8");
      if (rel !== "scripts/check-no-real-data.mjs") {
        for (const pattern of unsafeFlags)
          if (pattern.test(text)) violations.push(`${rel}: unsafe production flag enabled`);
        for (const pattern of secretPatterns)
          if (pattern.test(text)) violations.push(`${rel}: possible committed secret`);
      }
    }
  }
}

walk(root);
if (violations.length) {
  console.error(
    `Sensitive-data safety check failed:\n${violations.map((value) => `- ${value}`).join("\n")}`,
  );
  process.exit(1);
}
console.log("Sensitive-data safety check passed.");
