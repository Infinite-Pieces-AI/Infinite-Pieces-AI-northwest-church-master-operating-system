import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";
const paths = [
  "/",
  "/plan-a-visit",
  "/what-to-expect",
  "/about",
  "/ministries",
  "/kids-kingdom",
  "/teens",
  "/family-groups",
  "/events",
  "/sermons",
  "/bible-studies",
  "/lowell-community",
  "/contact",
  "/privacy",
  "/accessibility",
  "/church-in-lowell",
  "/sunday-service-lowell",
  "/church-for-families-lowell",
  "/kids-ministry-lowell",
  "/teen-ministry-lowell",
  "/bible-study-lowell",
];
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return paths.map((path) => ({
    url: siteUrl(path).toString(),
    lastModified: now,
    changeFrequency:
      path === "/" || path === "/events" || path === "/sermons" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
