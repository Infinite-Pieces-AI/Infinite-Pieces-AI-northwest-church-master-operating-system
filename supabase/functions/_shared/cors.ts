export const corsHeaders = {
  "access-control-allow-origin": Deno.env.get("ALLOWED_APP_ORIGIN") ?? "http://localhost:3001",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
  "vary": "Origin"
};
