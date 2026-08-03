import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

const allowedPathPrefixes = [
  "/",
  "/events",
  "/sermons",
  "/plan-a-visit",
  "/ministries",
  "/kids-kingdom",
  "/teens",
  "/family-groups",
  "/bible-studies",
  "/lowell-community"
] as const;

function equalSecret(supplied: string, expected: string): boolean {
  const suppliedDigest = createHash("sha256").update(supplied).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(suppliedDigest, expectedDigest);
}

function allowedPath(path: string): boolean {
  if (!path.startsWith("/") || path.includes("..") || path.length > 300) return false;
  return allowedPathPrefixes.some((prefix) => prefix === "/" ? path === "/" : path === prefix || path.startsWith(`${prefix}/`));
}

export async function POST(request: Request) {
  const expected = process.env.PUBLIC_REVALIDATION_SECRET;
  const supplied = request.headers.get("x-revalidation-secret") ?? "";
  if (!expected || expected.length < 32 || !equalSecret(supplied, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as { paths?: unknown; tags?: unknown };
  const paths = Array.isArray(body.paths)
    ? [...new Set(body.paths.filter((value): value is string => typeof value === "string" && allowedPath(value)))].slice(0, 25)
    : ["/"];
  const tags = Array.isArray(body.tags)
    ? [...new Set(body.tags.filter((value): value is string => typeof value === "string" && /^[a-z0-9:_-]{1,100}$/i.test(value)))].slice(0, 25)
    : [];
  for (const path of paths) revalidatePath(path);
  for (const tag of tags) revalidateTag(tag, "max");
  return NextResponse.json({ revalidated: true, paths, tags, at: new Date().toISOString() });
}
