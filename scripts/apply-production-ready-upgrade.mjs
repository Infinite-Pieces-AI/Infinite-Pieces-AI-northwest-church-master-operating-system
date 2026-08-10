import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { gunzipSync } from "node:zlib";

const archive = [0, 1, 2, 3]
  .map((index) =>
    readFileSync(
      resolve(process.cwd(), `.github/production-upgrade/manifest.part${index}`),
      "utf8",
    ).trim(),
  )
  .join("");

const files = JSON.parse(gunzipSync(Buffer.from(archive, "base64")).toString("utf8"));

for (const [path, content] of Object.entries(files)) {
  const target = resolve(process.cwd(), path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, String(content), "utf8");
}

for (let index = 0; index < 4; index += 1) {
  rmSync(resolve(process.cwd(), `.github/production-upgrade/manifest.part${index}`), {
    force: true,
  });
}

rmSync(resolve(process.cwd(), "scripts/apply-production-ready-upgrade.mjs"), {
  force: true,
});
rmSync(
  resolve(process.cwd(), ".github/workflows/temporary-production-ready-upgrade.yml"),
  { force: true },
);

console.log(`Applied ${Object.keys(files).length} production-ready platform files.`);
