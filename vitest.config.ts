import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@church/ai": `${root}packages/ai/src/index.ts`,
      "@church/analytics": `${root}packages/analytics/src/index.ts`,
      "@church/authentication": `${root}packages/authentication/src/index.ts`,
      "@church/authorization": `${root}packages/authorization/src/index.ts`,
      "@church/bible": `${root}packages/bible/src/index.ts`,
      "@church/church-content": `${root}packages/church-content/src/index.ts`,
      "@church/group-rotation": `${root}packages/group-rotation/src/index.ts`,
      "@church/notifications": `${root}packages/notifications/src/index.ts`,
      "@church/validation": `${root}packages/validation/src/index.ts`
    }
  },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts", "packages/*/test/**/*.test.ts"],
    environment: "node",
    coverage: { reporter: ["text", "json", "html"] }
  }
});
