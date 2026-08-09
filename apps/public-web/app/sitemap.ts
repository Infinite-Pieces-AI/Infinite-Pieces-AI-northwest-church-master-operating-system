import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

const paths = [
  "/",
  "/plan-a-visit",
  "/what-to-expect",
  "/ask-a-question",
  "/request-prayer",
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
  "/online-bible-study",
  "/young-adults-lowell",
  "/serve-lowell",
  "/can-i-come-to-church-alone",
  "/what-happens-at-a-church-service",
  "/how-to-start-reading-the-bible",
  "/how-to-find-a-church-community",
  "/questions-about-jesus",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return paths.map((path) => ({
    url: siteUrl(path).toString(),
    lastModified: now,
    changeFrequency:
      path === "/" || path === "/events" || path === "/sermons" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/plan-a-visit" || path === "/what-to-expect" ? 0.9 : 0.7,
  }));
}
