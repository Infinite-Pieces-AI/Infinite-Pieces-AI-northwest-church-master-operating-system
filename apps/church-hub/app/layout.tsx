import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./experience-core.css";
import "./experience-fellowship.css";
import "./experience-bible.css";
import "./experience-responsive.css";
import "./hub-journey.css";
import "./hub-fellowship-live.css";
import "./gemini-assistants.css";
import "./production-ready.css";
import "./family-showcase.css";

export const metadata: Metadata = {
  title: { default: "Church Hub", template: "%s | Church Hub" },
  description: "Invite-only Boston Church Lowell member hub",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
  applicationName: "Church Hub",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#07192b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
