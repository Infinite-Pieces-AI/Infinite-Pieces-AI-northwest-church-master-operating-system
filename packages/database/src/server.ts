import { createClient } from "@supabase/supabase-js";

function assertServerOnly(): void {
  if (typeof window !== "undefined") {
    throw new Error("Database secret client may only be created on the server");
  }
}

export function createAdminClient(environment: NodeJS.ProcessEnv = process.env) {
  assertServerOnly();
  const url = environment.SUPABASE_URL ?? environment.NEXT_PUBLIC_SUPABASE_URL;
  const secret = environment.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) throw new Error("Missing server Supabase configuration");
  if (environment.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Service-role credentials must never be public");
  }

  // Deliberately untyped until `pnpm supabase:types` replaces generated.types.ts
  // from a running local schema. This prevents a hand-written placeholder from
  // creating false confidence about database contracts.
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function createAnonymousServerClient(environment: NodeJS.ProcessEnv = process.env) {
  assertServerOnly();
  const url = environment.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new Error("Missing public Supabase configuration");

  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
