import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PublicTelemetry } from "@/components/public-telemetry";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";
import "./journey.css";

export const revalidate = 300;

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "Boston Church Lowell | Meet Jesus, Find Community, Serve Lowell",
    template: "%s | Boston Church Lowell",
  },
  description:
    "Meet Jesus, find genuine community, plan a Sunday visit, explore Bible conversations, family groups, Kids Kingdom, teen ministry, service, sermons, and public events in Lowell, Massachusetts.",
  applicationName: "Boston Church Lowell",
  openGraph: {
    title: "Boston Church Lowell",
    description: "Meet Jesus, find your people, and serve Lowell together.",
    type: "website",
    locale: "en_US",
    url: "/",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <PublicTelemetry />
      </body>
    </html>
  );
}
