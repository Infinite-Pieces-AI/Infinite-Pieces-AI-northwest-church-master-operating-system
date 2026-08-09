import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./features.css";

export const metadata: Metadata = {
  title: { default: "Outreach Intelligence OS", template: "%s | Outreach Intelligence OS" },
  description:
    "Private Boston Church Lowell public-discovery, SEO, AIO, campaign, and visitor intelligence workspace.",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
  applicationName: "Outreach Intelligence OS",
};

export const viewport: Viewport = {
  themeColor: "#06131f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
