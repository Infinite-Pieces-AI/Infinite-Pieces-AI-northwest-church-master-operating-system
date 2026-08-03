import { z } from "zod";

const booleanString = z.enum(["true", "false"]);

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_HUB_URL: z.string().url().default("http://localhost:3001"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(10).optional(),
  NEXT_PUBLIC_ENABLE_DEMO: booleanString.default("false"),
  NEXT_PUBLIC_PWA_ENABLED: booleanString.default("false"),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(32).optional(),
  NEXT_PUBLIC_PUBLIC_ANALYTICS_PROVIDER: z.enum(["disabled", "vercel"]).default("disabled")
});

const serverSchema = publicSchema.extend({
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(10).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  INVITATION_TOKEN_PEPPER: z.string().min(32).optional(),
  WEBHOOK_SIGNING_SECRET: z.string().min(32).optional(),
  CRON_SECRET: z.string().min(32).optional(),
  PUBLIC_REVALIDATION_SECRET: z.string().min(32).optional(),
  VAPID_PRIVATE_KEY: z.string().min(32).optional(),
  VAPID_SUBJECT: z.string().min(8).optional(),
  WORKER_DRY_RUN: booleanString.default("true"),
  ALLOW_REAL_CHILD_DATA: booleanString.default("false"),
  ALLOW_AUTOMATIC_SOCIAL_PUBLISHING: booleanString.default("false"),
  SOCIAL_AUTO_PUBLISH_ENABLED: booleanString.default("false"),
  ALLOW_AI_PRIVATE_DATA_ACCESS: booleanString.default("false"),
  ALLOW_CUSTOM_CHILD_RELEASE: booleanString.default("false"),
  CHILD_RELEASE_SAFETY_REVIEW_ID: z.string().min(6).optional()
});

export function getPublicEnv(source: NodeJS.ProcessEnv = process.env) {
  return publicSchema.parse(source);
}

export function getServerEnv(source: NodeJS.ProcessEnv = process.env) {
  return serverSchema.parse(source);
}

export function assertProductionSafety(source: NodeJS.ProcessEnv = process.env): void {
  const env = getServerEnv(source);
  if (source.NODE_ENV !== "production") return;

  if (env.NEXT_PUBLIC_ENABLE_DEMO === "true") {
    throw new Error("Demo mode must be disabled in production");
  }
  if (env.WORKER_DRY_RUN !== "false") {
    throw new Error("Production workers require an explicit WORKER_DRY_RUN=false setting");
  }
  if (env.ALLOW_AUTOMATIC_SOCIAL_PUBLISHING === "true" || env.SOCIAL_AUTO_PUBLISH_ENABLED === "true") {
    throw new Error("Automatic social publishing is prohibited");
  }
  if (env.ALLOW_AI_PRIVATE_DATA_ACCESS === "true") {
    throw new Error("AI access to private data is prohibited");
  }
  if (env.ALLOW_REAL_CHILD_DATA === "true" && !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Real child data requires configured server security controls");
  }
  if (env.ALLOW_CUSTOM_CHILD_RELEASE === "true" && !env.CHILD_RELEASE_SAFETY_REVIEW_ID) {
    throw new Error("Custom child release requires a documented safety review identifier");
  }

  const pushValues = [env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY, env.VAPID_SUBJECT];
  if (pushValues.some(Boolean) && !pushValues.every(Boolean)) {
    throw new Error("VAPID push configuration must provide public key, private key, and subject together");
  }
}
