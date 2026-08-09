export interface SiteFinding { pageUrl: string; ruleKey: string; severity: "critical" | "high" | "medium" | "low"; detail: string; evidence?: Record<string, unknown>; }
export interface SiteCrawlResult { pagesChecked: number; linksChecked: number; findings: SiteFinding[]; }

function matches(html: string, pattern: RegExp): string | null { return pattern.exec(html)?.[1]?.trim() ?? null; }
function sameOriginUrl(value: string, origin: URL): URL | null { try { const url = new URL(value, origin); return url.origin === origin.origin ? url : null; } catch { return null; } }

export async function crawlPublicSite(baseUrl: string, maximumPages = 100): Promise<SiteCrawlResult> {
  const origin = new URL(baseUrl);
  if (origin.protocol !== "https:" && origin.hostname !== "localhost" && origin.hostname !== "127.0.0.1") throw new Error("Site crawler requires an HTTPS church-owned origin");
  const sitemapResponse = await fetch(new URL("/sitemap.xml", origin), { signal: AbortSignal.timeout(10_000) });
  if (!sitemapResponse.ok) throw new Error(`Sitemap returned ${sitemapResponse.status}`);
  const sitemap = await sitemapResponse.text();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => sameOriginUrl(match[1] ?? "", origin)).filter((url): url is URL => Boolean(url)).slice(0, Math.min(250, Math.max(1, maximumPages)));
  const findings: SiteFinding[] = [];
  const titleMap = new Map<string, string[]>();
  const internalLinks = new Set<string>();

  for (const url of urls) {
    let response: Response;
    try { response = await fetch(url, { headers: { "user-agent": "BostonChurchLowellSiteQuality/1.0" }, signal: AbortSignal.timeout(10_000) }); }
    catch { findings.push({ pageUrl: url.toString(), ruleKey: "unreachable_page", severity: "critical", detail: "The crawler could not reach this sitemap URL." }); continue; }
    if (!response.ok) { findings.push({ pageUrl: url.toString(), ruleKey: "http_error", severity: response.status >= 500 ? "critical" : "high", detail: `Page returned HTTP ${response.status}.` }); continue; }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) continue;
    const html = await response.text();
    const title = matches(html, /<title[^>]*>([^<]*)<\/title>/i);
    const description = matches(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ?? matches(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
    const canonical = matches(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ?? matches(html, /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
    const h1Count = (html.match(/<h1\b/gi) ?? []).length;
    const jsonLdCount = (html.match(/application\/ld\+json/gi) ?? []).length;
    const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
    const missingAlt = images.filter((tag) => !/\balt=["'][^"']*["']/i.test(tag)).length;
    const missingDimensions = images.filter((tag) => !/\bwidth=["']?\d+/i.test(tag) || !/\bheight=["']?\d+/i.test(tag)).length;
    if (!title) findings.push({ pageUrl: url.toString(), ruleKey: "missing_title", severity: "high", detail: "Page is missing a document title." });
    else { const pages = titleMap.get(title) ?? []; pages.push(url.toString()); titleMap.set(title, pages); }
    if (!description) findings.push({ pageUrl: url.toString(), ruleKey: "missing_description", severity: "medium", detail: "Page is missing a meta description." });
    if (!canonical) findings.push({ pageUrl: url.toString(), ruleKey: "missing_canonical", severity: "medium", detail: "Page is missing a canonical URL." });
    else { const canonicalUrl = sameOriginUrl(canonical, origin); if (!canonicalUrl || canonicalUrl.pathname !== url.pathname) findings.push({ pageUrl: url.toString(), ruleKey: "canonical_conflict", severity: "high", detail: `Canonical does not match this page: ${canonical}` }); }
    if (h1Count !== 1) findings.push({ pageUrl: url.toString(), ruleKey: "h1_count", severity: h1Count === 0 ? "high" : "medium", detail: `Expected one visible H1; found ${h1Count}.` });
    if (jsonLdCount === 0) findings.push({ pageUrl: url.toString(), ruleKey: "missing_structured_data", severity: "low", detail: "No JSON-LD block was detected. Review whether this page needs Breadcrumb, Event, Video, or organization markup." });
    if (missingAlt) findings.push({ pageUrl: url.toString(), ruleKey: "image_alt", severity: "high", detail: `${missingAlt} image elements lack an alt attribute.` });
    if (missingDimensions) findings.push({ pageUrl: url.toString(), ruleKey: "image_dimensions", severity: "medium", detail: `${missingDimensions} image elements lack explicit width or height.` });
    for (const match of html.matchAll(/<a\b[^>]+href=["']([^"'#]+)["']/gi)) { const link = sameOriginUrl(match[1] ?? "", origin); if (link) internalLinks.add(link.toString()); }
  }

  for (const [title, pages] of titleMap) if (pages.length > 1) for (const page of pages) findings.push({ pageUrl: page, ruleKey: "duplicate_title", severity: "high", detail: `Duplicate title shared by ${pages.length} pages: ${title}` });
  let linksChecked = 0;
  for (const link of [...internalLinks].slice(0, 100)) {
    linksChecked += 1;
    try { const response = await fetch(link, { method: "HEAD", signal: AbortSignal.timeout(7_000) }); if (response.status >= 400) findings.push({ pageUrl: link, ruleKey: "broken_internal_link", severity: "high", detail: `Internal destination returned HTTP ${response.status}.` }); }
    catch { findings.push({ pageUrl: link, ruleKey: "broken_internal_link", severity: "high", detail: "Internal destination could not be reached." }); }
  }
  return { pagesChecked: urls.length, linksChecked, findings };
}
