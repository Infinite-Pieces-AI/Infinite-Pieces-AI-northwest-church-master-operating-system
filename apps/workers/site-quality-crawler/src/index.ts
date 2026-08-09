import { evaluatePageQuality, type SiteQualityFinding } from "@church/outreach";
import {
  claimOutboxEvents,
  completeOutboxEvent,
  failOutboxEvent,
  runWorker,
} from "@church/worker-runtime";

interface CrawlPageResult {
  url: string;
  links: string[];
  findings: SiteQualityFinding[];
}

function allowedBaseUrl(rawUrl: string, allowedHosts: string): URL {
  const url = new URL(rawUrl);
  const hosts = allowedHosts
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (url.protocol !== "https:") throw new Error("Site crawler requires HTTPS");
  if (!hosts.includes(url.hostname.toLowerCase())) {
    throw new Error("Site crawler host is not in SITE_CRAWLER_ALLOWED_HOSTS");
  }
  url.pathname = url.pathname || "/";
  url.search = "";
  url.hash = "";
  return url;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function firstMatch(html: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    const value = match?.[1]?.trim();
    if (value) return decodeHtml(value);
  }
  return undefined;
}

function extractLinks(html: string, pageUrl: URL): string[] {
  const output = new Set<string>();
  const pattern = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi;
  for (const match of html.matchAll(pattern)) {
    const rawHref = match[1]?.trim();
    if (!rawHref || rawHref.startsWith("#") || /^(mailto|tel|javascript):/i.test(rawHref)) continue;
    try {
      const url = new URL(rawHref, pageUrl);
      if (url.origin !== pageUrl.origin) continue;
      if (/\.(?:pdf|zip|png|jpe?g|gif|webp|svg|mp4|mp3|ics)$/i.test(url.pathname)) continue;
      url.hash = "";
      url.search = "";
      output.add(url.toString());
    } catch {
      // Invalid links are reported through a synthetic broken-link finding below.
    }
  }
  return [...output].slice(0, 1000);
}

function extractImages(html: string, pageUrl: URL) {
  const images: Array<{ src: string; alt?: string; width?: number; height?: number }> = [];
  const pattern = /<img\b([^>]*)>/gi;
  for (const match of html.matchAll(pattern)) {
    const attributes = match[1] ?? "";
    const src = firstMatch(attributes, [/\bsrc\s*=\s*["']([^"']+)["']/i]);
    if (!src) continue;
    let normalized = src;
    try {
      normalized = new URL(src, pageUrl).toString();
    } catch {
      // Keep the raw value so the finding is still actionable.
    }
    const alt = firstMatch(attributes, [/\balt\s*=\s*["']([^"']*)["']/i]);
    const widthText = firstMatch(attributes, [/\bwidth\s*=\s*["']?(\d+)["']?/i]);
    const heightText = firstMatch(attributes, [/\bheight\s*=\s*["']?(\d+)["']?/i]);
    images.push({
      src: normalized,
      ...(alt !== undefined ? { alt } : {}),
      ...(widthText ? { width: Number(widthText) } : {}),
      ...(heightText ? { height: Number(heightText) } : {}),
    });
  }
  return images.slice(0, 500);
}

function structuredDataTypes(html: string): string[] {
  const output = new Set<string>();
  const scriptPattern = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      const parsed: unknown = JSON.parse(raw);
      const queue: unknown[] = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length) {
        const value = queue.shift();
        if (!value || typeof value !== "object" || Array.isArray(value)) continue;
        const record = value as Record<string, unknown>;
        const type = record["@type"];
        if (typeof type === "string") output.add(type);
        else if (Array.isArray(type)) {
          type.filter((item): item is string => typeof item === "string").forEach((item) => output.add(item));
        }
        const graph = record["@graph"];
        if (Array.isArray(graph)) queue.push(...graph);
      }
    } catch {
      // Invalid JSON-LD is represented as no supported structured data for this crawl.
    }
  }
  return [...output];
}

function visibleWordCount(html: string): number {
  const text = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.split(" ").length : 0;
}

function parseRobotsDisallow(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const disallow: string[] = [];
  let applies = false;
  for (const rawLine of lines) {
    const line = rawLine.split("#")[0]?.trim() ?? "";
    if (!line) continue;
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey?.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (key === "user-agent") applies = value === "*";
    if (applies && key === "disallow" && value) disallow.push(value);
  }
  return disallow;
}

function allowedByRobots(url: URL, disallow: string[]): boolean {
  return !disallow.some((path) => path !== "/" && url.pathname.startsWith(path));
}

async function fetchRobots(base: URL): Promise<string[]> {
  try {
    const response = await fetch(new URL("/robots.txt", base), {
      headers: { "user-agent": "BostonChurchLowellSiteQualityBot/1.0" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return [];
    return parseRobotsDisallow(await response.text());
  } catch {
    return [];
  }
}

async function crawlPage(url: URL): Promise<CrawlPageResult> {
  const started = Date.now();
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "BostonChurchLowellSiteQualityBot/1.0",
      accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(12_000),
  });
  const responseMilliseconds = Date.now() - started;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    return {
      url: url.toString(),
      links: [],
      findings: [
        {
          findingType: "indexability_conflict",
          severity: response.ok ? "warning" : "critical",
          summary: `Expected HTML but received ${contentType || "an unknown content type"}.`,
          evidence: { statusCode: response.status, contentType },
        },
      ],
    };
  }

  const html = (await response.text()).slice(0, 5_000_000);
  const title = firstMatch(html, [/<title[^>]*>([\s\S]*?)<\/title>/i]);
  const description = firstMatch(html, [
    /<meta\b[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*>/i,
    /<meta\b[^>]*content\s*=\s*["']([^"']*)["'][^>]*name\s*=\s*["']description["'][^>]*>/i,
  ]);
  const canonical = firstMatch(html, [
    /<link\b[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']+)["'][^>]*>/i,
    /<link\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*rel\s*=\s*["']canonical["'][^>]*>/i,
  ]);
  const robots = firstMatch(html, [
    /<meta\b[^>]*name\s*=\s*["']robots["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*>/i,
    /<meta\b[^>]*content\s*=\s*["']([^"']*)["'][^>]*name\s*=\s*["']robots["'][^>]*>/i,
  ]);
  const links = extractLinks(html, url);
  const images = extractImages(html, url);
  const findings = evaluatePageQuality({
    pageUrl: url.toString(),
    statusCode: response.status,
    title,
    description,
    canonical,
    links: links.map((href) => ({ href })),
    images,
    structuredDataTypes: structuredDataTypes(html),
    responseMilliseconds,
    wordCount: visibleWordCount(html),
    indexable: !/noindex/i.test(robots ?? "") && response.status < 400,
  });

  return { url: url.toString(), links, findings };
}

await runWorker("site-quality-crawler", async (context) => {
  const events = await claimOutboxEvents(context, ["outreach.site_crawl_requested"]);
  const allowedHosts = process.env.SITE_CRAWLER_ALLOWED_HOSTS ?? "";
  let pagesCrawled = 0;
  let findingsCreated = 0;

  for (const event of events) {
    let runId: string | null = null;
    try {
      const baseUrl = allowedBaseUrl(
        typeof event.payload.base_url === "string"
          ? event.payload.base_url
          : process.env.PUBLIC_SITE_URL ?? "",
        allowedHosts,
      );
      const pageLimit = Math.max(1, Math.min(500, Number(event.payload.page_limit ?? 100)));
      const robotsDisallow = await fetchRobots(baseUrl);

      if (!context.dryRun) {
        const { data, error } = await context.supabase
          .from("site_crawl_runs")
          .insert({
            base_url: baseUrl.toString(),
            status: "running",
            page_limit: pageLimit,
            requested_by:
              typeof event.payload.requested_by === "string" ? event.payload.requested_by : null,
            started_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        if (error) throw error;
        runId = String(data.id);
      }

      const queue = [baseUrl.toString()];
      const seen = new Set<string>();
      const findings: Array<{
        run_id: string;
        page_url: string;
        finding_type: string;
        severity: string;
        summary: string;
        evidence: Record<string, unknown>;
      }> = [];

      while (queue.length && seen.size < pageLimit) {
        const next = queue.shift();
        if (!next || seen.has(next)) continue;
        const url = new URL(next);
        if (url.origin !== baseUrl.origin || !allowedByRobots(url, robotsDisallow)) continue;
        seen.add(next);
        try {
          const result = await crawlPage(url);
          pagesCrawled += 1;
          for (const finding of result.findings) {
            if (runId) {
              findings.push({
                run_id: runId,
                page_url: result.url,
                finding_type: finding.findingType,
                severity: finding.severity,
                summary: finding.summary,
                evidence: finding.evidence,
              });
            }
          }
          for (const href of result.links) {
            if (!seen.has(href) && queue.length < pageLimit * 5) queue.push(href);
          }
        } catch (error) {
          pagesCrawled += 1;
          if (runId) {
            findings.push({
              run_id: runId,
              page_url: url.toString(),
              finding_type: "indexability_conflict",
              severity: "critical",
              summary: error instanceof Error ? error.message.slice(0, 1000) : "Page crawl failed.",
              evidence: {},
            });
          }
        }
      }

      if (!context.dryRun && runId) {
        if (findings.length) {
          const { error: findingError } = await context.supabase
            .from("site_crawl_findings")
            .insert(findings);
          if (findingError) throw findingError;
        }
        findingsCreated += findings.length;
        const { error: runError } = await context.supabase
          .from("site_crawl_runs")
          .update({
            status: "completed",
            pages_crawled: seen.size,
            completed_at: new Date().toISOString(),
          })
          .eq("id", runId);
        if (runError) throw runError;
      }

      context.log("site_crawl.completed", {
        eventId: event.id,
        baseUrl: baseUrl.toString(),
        pageCount: seen.size,
        findingCount: findings.length,
        dryRun: context.dryRun,
      });
      await completeOutboxEvent(context, event.id);
    } catch (error) {
      if (!context.dryRun && runId) {
        await context.supabase
          .from("site_crawl_runs")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_summary:
              error instanceof Error ? error.message.slice(0, 2000) : "Site crawl failed",
          })
          .eq("id", runId);
      }
      await failOutboxEvent(
        context,
        event.id,
        error instanceof Error ? error.message : "Site crawl failed",
      );
    }
  }

  return { claimed: events.length, pagesCrawled, findingsCreated };
});
