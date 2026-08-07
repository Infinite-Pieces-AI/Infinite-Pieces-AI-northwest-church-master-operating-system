import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PublicTelemetry } from "@/components/public-telemetry";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

export const revalidate = 300;

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "Boston Church Lowell | Sunday Worship in Lowell, MA",
    template: "%s | Boston Church Lowell",
  },
  description:
    "Meet the Boston Church Lowell / Northwest community, plan a Sunday visit, explore Bible studies, family groups, Kids Kingdom, teen ministry, sermons, and public events.",
  applicationName: "Boston Church Lowell",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Boston Church Lowell",
    description: "A community seeking to love God, love one another, and serve Lowell.",
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
