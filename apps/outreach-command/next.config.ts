import type { NextConfig } from "next";

if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_ENABLE_DEMO === "true") {
  throw new Error("NEXT_PUBLIC_ENABLE_DEMO must be false for a production Outreach OS build");
}

const productionCsp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@church/authorization", "@church/outreach"],
  async headers() {
    const headers = [
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Frame-Options", value: "DENY" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
      },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
      { key: "Cache-Control", value: "private, no-store" },
    ];
    if (process.env.NODE_ENV === "production") {
      headers.push({ key: "Content-Security-Policy", value: productionCsp });
    }
    return [{ source: "/(.*)", headers }];
  },
};

export default nextConfig;
