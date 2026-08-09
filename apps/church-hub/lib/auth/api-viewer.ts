import { createClient } from "@/lib/supabase/server";

export interface ApiViewer {
  id: string;
  email: string;
  demo: boolean;
}

export async function getApiViewer(): Promise<ApiViewer | null> {
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO === "true") {
    return {
      id: "00000000-0000-4000-8000-000000000001",
      email: "jordan.member@example.invalid",
      demo: true,
    };
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const id = typeof claims?.sub === "string" ? claims.sub : null;
  if (error || !claims || !id) return null;
  return { id, email: String(claims.email ?? ""), demo: false };
}
