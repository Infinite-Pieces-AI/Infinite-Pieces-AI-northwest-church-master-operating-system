import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Boston Church Lowell Member Hub",
    short_name: "Church Hub",
    description: "Invite-only weekly church companion",
    start_url: "/this-week",
    display: "standalone",
    background_color: "#f3f6f8",
    theme_color: "#07192b",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
