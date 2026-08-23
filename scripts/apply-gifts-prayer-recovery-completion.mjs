import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const write = (path, content) => writeFileSync(resolve(root, path), content, "utf8");
const appendOnce = (path, marker, content) => {
  const current = read(path);
  if (!current.includes(marker)) write(path, `${current.trimEnd()}\n\n${content.trim()}\n`);
};

write(
  "apps/church-hub/components/mobile-nav.tsx",
  `import Link from "next/link";

const items = [
  ["This Week", "/this-week", "⌂"],
  ["Fellowship", "/fellowship", "∞"],
  ["Gifts", "/gifts", "✧"],
  ["Prayer", "/prayer", "◉"],
  ["More", "/more", "•••"],
] as const;

export function MobileNav({ canAdmin: _canAdmin }: { canAdmin: boolean }) {
  return (
    <nav className="bottom-nav" aria-label="Mobile member navigation">
      {items.map(([label, href, icon]) => (
        <Link key={href} href={href}>
          <span aria-hidden="true">{icon}</span>
          <small>{label}</small>
        </Link>
      ))}
    </nav>
  );
}
`,
);

write(
  "apps/church-hub/components/ministry-navigator.tsx",
  `"use client";

import Link from "next/link";
import { useState } from "react";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  href: string;
  reason: string;
}

const quickPrompts = [
  "Where can I find this week’s Scripture?",
  "I want to meet people or join a meal",
  "Where can I offer a skill or ask for help?",
  "How do I add a prayer request?",
  "Where is private recovery support?",
  "How do I manage Kids Kingdom check-in?",
];

export function MinistryNavigator() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  async function ask(value = question) {
    const normalized = value.trim();
    if (!normalized) return;
    setQuestion(normalized);
    setLoading(true);
    setNotice("");
    try {
      const response = await fetch("/api/ai/navigation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: normalized }),
      });
      const payload = (await response.json()) as {
        recommendations?: Recommendation[];
        notice?: string;
        message?: string;
      };
      if (!response.ok) throw new Error(payload.message ?? "Church Hub could not route that question.");
      setRecommendations(payload.recommendations ?? []);
      setNotice(payload.notice ?? "Suggestions use your question only and do not inspect private ministry content.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Church Hub could not route that question.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={\`ministry-navigator \${open ? "ministry-navigator--open" : ""}\`}>
      <button className="ministry-navigator__toggle" type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
        <span aria-hidden="true">✦</span>
        <span><strong>Ask Church Hub</strong><small>Find Scripture, fellowship, gifts, prayer, service, recovery, family tools, or your next step</small></span>
        <b aria-hidden="true">{open ? "−" : "+"}</b>
      </button>
      {open ? (
        <div className="ministry-navigator__panel">
          <div className="ministry-navigator__input">
            <input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void ask(); }} placeholder="What are you looking for inside Church Hub?" aria-label="Ask Church Hub where to go" />
            <button type="button" disabled={loading || !question.trim()} onClick={() => void ask()}>{loading ? "Finding…" : "Guide me"}</button>
          </div>
          <div className="ministry-navigator__prompts">
            {quickPrompts.map((prompt) => <button type="button" key={prompt} onClick={() => void ask(prompt)}>{prompt}</button>)}
          </div>
          {notice ? <p className="ministry-navigator__notice" role="status">{notice}</p> : null}
          {recommendations.length ? (
            <div className="ministry-navigator__results">
              {recommendations.map((recommendation) => (
                <Link href={recommendation.href} key={recommendation.id}>
                  <span>∞</span><div><strong>{recommendation.title}</strong><p>{recommendation.description}</p><small>{recommendation.reason}</small></div><b aria-hidden="true">›</b>
                </Link>
              ))}
            </div>
          ) : null}
          <p className="ministry-navigator__boundary">Navigation uses the question you type. By default it does not inspect prayer text, private messages, children’s records, counseling, recovery participation, or hidden engagement scores. Gemini enhancement is allowed only when the church explicitly enables private-data AI processing.</p>
        </div>
      ) : null}
    </section>
  );
}
`,
);

write(
  "apps/church-hub/app/api/ai/navigation/route.ts",
  `import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth/viewer";
import {
  ministryRouteCatalog,
  recommendationById,
  resolveMinistryNavigation,
} from "@/lib/ministry-navigation";

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

function questionFrom(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 1000) : "";
}

async function geminiRoute(question: string): Promise<string[]> {
  const key = process.env.GEMINI_API_KEY ?? process.env.AI_API_KEY;
  const enabled =
    process.env.AI_PROVIDER === "gemini" &&
    process.env.ALLOW_AI_PRIVATE_DATA_ACCESS === "true" &&
    Boolean(key);
  if (!enabled || !key) return [];
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const catalog = ministryRouteCatalog
    .map((route) => \`\${route.id}: \${route.title} — \${route.description}\`)
    .join("\\n");
  const response = await fetch(
    \`https://generativelanguage.googleapis.com/v1beta/models/\${encodeURIComponent(model)}:generateContent?key=\${encodeURIComponent(key)}\`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: \`You route an authenticated church member to existing Church Hub pages. Never infer spiritual maturity, loneliness, addiction, diagnosis, child safety, or private beliefs. Never provide pastoral, medical, legal, safeguarding, or emergency decisions. Return JSON exactly as {"routeIds":["id"]} with one to three IDs from the catalog.\\n\\nCATALOG\\n\${catalog}\\n\\nMEMBER QUESTION\\n\${question}\`,
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(12_000),
    },
  );
  if (!response.ok) return [];
  const payload = (await response.json()) as GeminiResponse;
  const raw = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  try {
    const parsed = JSON.parse(raw) as { routeIds?: unknown };
    return Array.isArray(parsed.routeIds)
      ? parsed.routeIds.filter((id): id is string => typeof id === "string").slice(0, 3)
      : [];
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ message: "Sign in to use Church Hub navigation." }, { status: 401 });
  const body: unknown = await request.json().catch(() => null);
  const question = questionFrom(body && typeof body === "object" ? (body as { question?: unknown }).question : null);
  if (!question) return NextResponse.json({ message: "Ask a question about where you need to go." }, { status: 400 });

  const deterministic = resolveMinistryNavigation(question, 3);
  let ids: string[] = [];
  try { ids = await geminiRoute(question); } catch { ids = []; }
  const aiRoutes = ids.flatMap((id) => {
    const route = recommendationById(id);
    return route ? [route] : [];
  });
  const recommendations = (aiRoutes.length ? aiRoutes : deterministic).map(({ keywords: _keywords, protected: _protected, ...route }) => route);
  return NextResponse.json({
    recommendations,
    provider: aiRoutes.length ? "gemini" : "deterministic",
    notice: aiRoutes.length
      ? "Gemini improved route selection using only the question you typed. The answer was constrained to approved Hub destinations."
      : "Church Hub used its local, explainable route map. No external AI provider received your question.",
  });
}
`,
);

write(
  "apps/church-hub/components/mobile-nav.tsx",
  read("apps/church-hub/components/mobile-nav.tsx"),
);

write(
  "apps/church-hub/app/(protected)/prayer/page.tsx",
  `import Link from "next/link";
import { hasPermission } from "@church/authorization";
import { PageHeading } from "@/components/page-heading";
import { PrayerWellComplete } from "@/components/prayer-well-complete";
import { requireViewer } from "@/lib/auth/viewer";

export default async function PrayerPage() {
  const viewer = await requireViewer();
  const canLead =
    hasPermission(viewer.roles, "moderation.review") ||
    hasPermission(viewer.roles, "safeguarding.review") ||
    hasPermission(viewer.roles, "content.publish");
  return (
    <>
      <PageHeading eyebrow="Prayer Well" title="Carry one another in prayer" description="Share requests with the audience you choose, mark when you prayed, offer encouragement, post updates, and remember answered prayers." />
      {canLead ? <div className="module-admin-link"><Link href="/admin/prayer">Open restricted prayer routing →</Link></div> : null}
      <PrayerWellComplete mode={viewer.demo ? "showcase" : "live"} canLead={canLead} />
    </>
  );
}
`,
);

write(
  "apps/church-hub/app/(protected)/recovery/page.tsx",
  `import Link from "next/link";
import { hasPermission } from "@church/authorization";
import { PageHeading } from "@/components/page-heading";
import { RecoveryMinistryGate } from "@/components/recovery-ministry-gate";
import { requireViewer } from "@/lib/auth/viewer";

export default async function RecoveryPage() {
  const viewer = await requireViewer();
  const canLead =
    hasPermission(viewer.roles, "content.draft") ||
    hasPermission(viewer.roles, "moderation.review") ||
    hasPermission(viewer.roles, "safeguarding.review");
  const programName = process.env.NEXT_PUBLIC_RECOVERY_MINISTRY_NAME ?? "Recovery Ministry";
  const officialProgramConfirmed = process.env.RECOVERY_OFFICIAL_PROGRAM_CONFIRMED === "true";
  return (
    <>
      <PageHeading eyebrow="Private recovery ministry" title={programName} description="A confidential adult church peer ministry with weekly Scripture, approved curriculum links, participant connection, leader planning, and clear treatment boundaries." />
      {canLead ? <div className="module-admin-link"><Link href="/admin/recovery">Open recovery administration →</Link></div> : null}
      <RecoveryMinistryGate mode={viewer.demo ? "showcase" : "live"} canLead={canLead} programName={programName} officialProgramConfirmed={officialProgramConfirmed} />
    </>
  );
}
`,
);

write(
  "apps/church-hub/app/(protected)/gifts/page.tsx",
  `import Link from "next/link";
import { hasPermission } from "@church/authorization";
import { GiftsOfChurch } from "@/components/gifts-of-church";
import { PageHeading } from "@/components/page-heading";
import { requireViewer } from "@/lib/auth/viewer";

export default async function GiftsPage() {
  const viewer = await requireViewer();
  const canLead = hasPermission(viewer.roles, "content.draft") || hasPermission(viewer.roles, "group.manage_assigned") || hasPermission(viewer.roles, "outreach.manage");
  const canModerate = hasPermission(viewer.roles, "moderation.review");
  return (
    <>
      <PageHeading eyebrow="Gifts of the Church" title="Use what God has given you" description="Discover strengths, offer practical skills, share useful items, respond to member needs, and help leaders fill real ministry opportunities." />
      {canModerate ? <div className="module-admin-link"><Link href="/admin/gifts">Open gift marketplace moderation →</Link></div> : null}
      <GiftsOfChurch mode={viewer.demo ? "showcase" : "live"} canLead={canLead} assessmentUrl={process.env.NEXT_PUBLIC_SPIRITUAL_GIFTS_ASSESSMENT_URL} />
    </>
  );
}
`,
);

write(
  "apps/church-hub/components/app-shell.tsx",
  `import type { ReactNode } from "react";
import Link from "next/link";
import { hasPermission, type Permission } from "@church/authorization";
import type { Viewer } from "@/lib/auth/viewer";
import { MinistryNavigator } from "./ministry-navigator";
import { MobileNav } from "./mobile-nav";
import { ServiceWorkerRegistration } from "./service-worker-registration";

const sideItems = [
  ["This Week", "/this-week", "⌂"], ["Bible Journey", "/bible", "✦"], ["Fellowship", "/fellowship", "∞"],
  ["Gifts of the Church", "/gifts", "✧"], ["Prayer Well", "/prayer", "◉"], ["Serve", "/serve", "◇"],
  ["Recovery Ministry", "/recovery", "↺"], ["Community", "/community", "◌"], ["Events", "/events", "□"],
  ["Connection Path", "/connection-path", "↗"], ["Family", "/family", "⌁"],
] as const;
const adminPermissions: readonly Permission[] = ["content.draft","access.approve","group.manage_assigned","safeguarding.review","moderation.review","outreach.manage","audit.read","system.health.read"];

export function AppShell({ viewer, children }: { viewer: Viewer; children: ReactNode }) {
  const canAdmin = adminPermissions.some((permission) => hasPermission(viewer.roles, permission));
  const canOutreach = hasPermission(viewer.roles, "outreach.manage");
  const canModerateGifts = hasPermission(viewer.roles, "moderation.review");
  const canReviewPrayer = hasPermission(viewer.roles, "moderation.review") || hasPermission(viewer.roles, "safeguarding.review") || hasPermission(viewer.roles, "content.publish");
  const canManageRecovery = hasPermission(viewer.roles, "content.draft") || hasPermission(viewer.roles, "moderation.review") || hasPermission(viewer.roles, "safeguarding.review");
  const outreachUrl = process.env.NEXT_PUBLIC_OUTREACH_URL ?? process.env.NEXT_PUBLIC_OUTREACH_COMMAND_URL ?? "http://localhost:3002";
  return (
    <div className="hub-shell"><ServiceWorkerRegistration /><aside className="hub-sidebar"><Link className="hub-brand" href="/this-week"><span aria-hidden="true">∞</span><strong>Church Hub</strong><small>Lowell · Northwest</small></Link><nav aria-label="Member navigation">{sideItems.map(([label,href,icon]) => <Link key={href} href={href}><span aria-hidden="true">{icon}</span>{label}</Link>)}{canAdmin ? <Link href="/admin"><span aria-hidden="true">⚙</span>Ministry Admin</Link> : null}{canModerateGifts ? <Link className="sidebar-subitem" href="/admin/gifts"><span>·</span>Gift Moderation</Link> : null}{canReviewPrayer ? <Link className="sidebar-subitem" href="/admin/prayer"><span>·</span>Prayer Routing</Link> : null}{canManageRecovery ? <Link className="sidebar-subitem" href="/admin/recovery"><span>·</span>Recovery Access</Link> : null}{canOutreach ? <a href={outreachUrl}><span aria-hidden="true">⌕</span>Outreach OS ↗</a> : null}</nav><div className="sidebar-safety"><strong>Belonging with boundaries</strong><span>Use public meeting places for open invitations. Keep child, prayer, recovery, counseling, safeguarding, and private-group information inside approved workflows.</span></div></aside><div className="hub-main"><header className="hub-topbar"><div><p>Boston Church Lowell</p><span>Belong · Grow · Follow Jesus together</span></div><div className="viewer-chip"><span>{viewer.displayName.slice(0,1)}</span><div><strong>{viewer.displayName}</strong><small>{viewer.demo ? "Interactive showcase member" : viewer.email}</small></div><Link href="/profile" aria-label="Open profile settings">›</Link></div></header>{viewer.demo ? <div className="preview-banner"><strong>Interactive showcase mode:</strong> the finished workflows are clickable and save only inside this browser. Nothing changes real church records.</div> : null}<main className="hub-content"><MinistryNavigator />{children}</main><MobileNav canAdmin={canAdmin} /></div></div>
  );
}
`,
);

write(
  "apps/outreach-command/components/outreach-nav.tsx",
  `"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const items = [
  ["Command Radar", "/radar", "⌁"], ["Search Intelligence", "/search-intelligence", "⌕"], ["Growth", "/growth", "↗"],
  ["Content Command", "/content-command", "✦"], ["Local Presence", "/local-presence", "◎"], ["Recovery Outreach", "/recovery-outreach", "↺"],
  ["Campaigns", "/campaigns", "◫"], ["Visitor CRM", "/visitor-crm", "◇"], ["Source Control", "/source-control", "⚙"],
] as const;
export function OutreachNav() { const pathname = usePathname(); return <nav className="os-nav" aria-label="Outreach Intelligence navigation">{items.map(([label,href,icon]) => <Link className={pathname.startsWith(href) ? "active" : ""} href={href} key={href}><span aria-hidden="true">{icon}</span><strong>{label}</strong></Link>)}</nav>; }
`,
);

let outreachLayout = read("apps/outreach-command/app/layout.tsx");
if (!outreachLayout.includes('import "./recovery-outreach.css";')) {
  outreachLayout = outreachLayout.replace('import "./features.css";', 'import "./features.css";\nimport "./recovery-outreach.css";');
  write("apps/outreach-command/app/layout.tsx", outreachLayout);
}

let publicHome = read("apps/public-web/app/page.tsx");
if (!publicHome.includes("RecoverySupportFeature")) {
  const firstImportEnd = publicHome.indexOf("\n", publicHome.indexOf("import "));
  publicHome = `${publicHome.slice(0, firstImportEnd + 1)}import { RecoverySupportFeature } from "@/components/recovery-support-feature";\n${publicHome.slice(firstImportEnd + 1)}`;
  const closingMain = publicHome.lastIndexOf("</main>");
  if (closingMain !== -1) publicHome = `${publicHome.slice(0, closingMain)}  <RecoverySupportFeature />\n      ${publicHome.slice(closingMain)}`;
  write("apps/public-web/app/page.tsx", publicHome);
}

let sitemap = read("apps/public-web/app/sitemap.ts");
if (!sitemap.includes("/recovery-support-lowell")) {
  if (sitemap.includes('"/plan-a-visit",')) sitemap = sitemap.replace('"/plan-a-visit",', '"/plan-a-visit",\n    "/recovery-support-lowell",');
  else if (sitemap.includes("'/plan-a-visit',")) sitemap = sitemap.replace("'/plan-a-visit',", "'/plan-a-visit',\n    '/recovery-support-lowell',");
  else sitemap = sitemap.replace(/\n\];/, '\n  "/recovery-support-lowell",\n];');
  write("apps/public-web/app/sitemap.ts", sitemap);
}

let giftApi = read("apps/church-hub/app/api/gifts/route.ts");
giftApi = giftApi.replace("moderation_status: \"approved\"", "moderation_status: \"pending\"");
if (!giftApi.includes("moderation_status,risk_level")) {
  giftApi = giftApi.replace("availability_text,status,created_at", "availability_text,status,moderation_status,risk_level,created_at");
  giftApi = giftApi.replace("status: String(row.status),\n      responses:", "status: String(row.status),\n      moderationStatus: String(row.moderation_status ?? \"pending\"),\n      riskLevel: String(row.risk_level ?? \"standard\"),\n      responses:");
}
write("apps/church-hub/app/api/gifts/route.ts", giftApi);

let giftsComponent = read("apps/church-hub/components/gifts-of-church.tsx");
if (!giftsComponent.includes("moderationStatus?:")) {
  giftsComponent = giftsComponent.replace('status: "open" | "matched" | "fulfilled" | "closed";\n  responses:', 'status: "open" | "matched" | "fulfilled" | "closed";\n  moderationStatus?: "pending" | "approved" | "rejected" | "removed";\n  riskLevel?: "standard" | "review" | "restricted";\n  responses:');
  giftsComponent = giftsComponent.replace('status: "open",\n      responses: [],', 'status: "open",\n      moderationStatus: mode === "showcase" ? "approved" : "pending",\n      riskLevel: exchangeType === "paid" || type === "item_share" ? "review" : "standard",\n      responses: [],');
  giftsComponent = giftsComponent.replace('setNotice("Your post is now available in the approved church gift board.");', 'setNotice(mode === "showcase" ? "Your post is now available in the interactive gift board." : "Your post was submitted for church moderation. It becomes visible to other members only after approval.");');
  giftsComponent = giftsComponent.replace('<b>{post.exchangeType}</b>', '<b>{post.moderationStatus === "pending" ? "pending review" : post.exchangeType}</b>');
}
write("apps/church-hub/components/gifts-of-church.tsx", giftsComponent);

let gate = read("apps/church-hub/components/recovery-ministry-gate.tsx");
if (!gate.includes("publicSiteUrl")) {
  gate = gate.replace('const [notice, setNotice] = useState("");', 'const [notice, setNotice] = useState("");\n  const publicSiteUrl = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "http://localhost:3000";');
  gate = gate.replace('href="http://localhost:3000/recovery-support-lowell"', 'href={`${publicSiteUrl}/recovery-support-lowell`}');
  write("apps/church-hub/components/recovery-ministry-gate.tsx", gate);
}

let more = read("apps/church-hub/app/(protected)/more/page.tsx");
more = more.replace('import { hasPermission } from "@church/authorization";', 'import { hasPermission, type Permission } from "@church/authorization";');
more = more.replace('  const canAdmin = [', '  const adminPermissions: Permission[] = [');
more = more.replace('  ].some((permission) => hasPermission(viewer.roles, permission as never));', '  ];\n  const canAdmin = adminPermissions.some((permission) => hasPermission(viewer.roles, permission));');
write("apps/church-hub/app/(protected)/more/page.tsx", more);

appendOnce(
  "apps/church-hub/app/ministry-expansion.css",
  ".ministry-navigator__toggle",
  `
.ministry-navigator { margin-bottom: 8px; border: 1px solid #c8dce6; border-radius: 20px; background: linear-gradient(135deg,#fff,#f2f8fa); box-shadow: 0 12px 34px rgba(7,25,43,.06); overflow: hidden; }
.ministry-navigator__toggle { width:100%; display:grid; grid-template-columns:48px 1fr 30px; gap:12px; align-items:center; padding:16px 20px; border:0; color:var(--ink); background:transparent; cursor:pointer; text-align:left; }
.ministry-navigator__toggle>span:first-child { width:44px; height:44px; display:grid; place-items:center; border-radius:13px; color:var(--navy); background:#ffe39a; font-size:1.2rem; }
.ministry-navigator__toggle strong,.ministry-navigator__toggle small { display:block; }
.ministry-navigator__toggle small { margin-top:3px; color:var(--muted); }
.ministry-navigator__toggle>b { color:var(--blue); font-size:1.4rem; }
.ministry-navigator__panel { padding:0 20px 20px; border-top:1px solid #dbe7eb; }
.ministry-navigator__input { display:grid; grid-template-columns:1fr auto; gap:10px; margin-top:16px; }
.ministry-navigator__input input { min-height:46px; padding:10px 12px; border:1px solid #bcd0d9; border-radius:12px; background:white; }
.ministry-navigator__input button { min-height:46px; padding:9px 16px; border:0; border-radius:12px; color:white; background:var(--blue); font-weight:900; }
.ministry-navigator__prompts { display:flex; flex-wrap:wrap; gap:7px; margin-top:10px; }
.ministry-navigator__prompts button { padding:7px 10px; border:1px solid #c8dce6; border-radius:999px; color:#315b70; background:white; cursor:pointer; font-size:.68rem; }
.ministry-navigator__results { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-top:14px; }
.ministry-navigator__results a { display:grid; grid-template-columns:34px 1fr 18px; gap:9px; padding:13px; border:1px solid #c8dce6; border-radius:14px; color:inherit; background:white; text-decoration:none; }
.ministry-navigator__results a>span { width:32px; height:32px; display:grid; place-items:center; border-radius:10px; color:var(--blue); background:var(--sky); }
.ministry-navigator__results p,.ministry-navigator__results small { margin:4px 0 0; color:var(--muted); font-size:.68rem; line-height:1.45; }
.ministry-navigator__notice,.ministry-navigator__boundary { margin:11px 0 0; color:var(--muted); font-size:.68rem; line-height:1.5; }
.module-admin-link { display:flex; justify-content:flex-end; margin:-8px 0 12px; }
.module-admin-link a { padding:8px 12px; border:1px solid #bfd0d9; border-radius:10px; color:var(--blue); background:white; font-size:.72rem; font-weight:850; text-decoration:none; }
.sidebar-subitem { padding-left:24px !important; font-size:.72rem; opacity:.86; }
.more-destination-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
.more-destination-grid>a { display:grid; grid-template-columns:44px 1fr 18px; gap:12px; align-items:center; min-height:120px; padding:18px; border:1px solid var(--border); border-radius:18px; color:inherit; background:white; text-decoration:none; box-shadow:0 8px 28px rgba(7,25,43,.04); }
.more-destination-grid>a>span { width:42px; height:42px; display:grid; place-items:center; border-radius:13px; color:var(--blue); background:var(--sky); }
.more-destination-grid p { margin:6px 0 0; color:var(--muted); font-size:.72rem; line-height:1.5; }
.recovery-access-options { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
.recovery-access-options>article,.recovery-membership-controls { padding:22px; border:1px solid var(--border); border-radius:19px; background:white; }
.recovery-access-options header { display:flex; justify-content:space-between; gap:10px; }
.recovery-access-options header span,.recovery-access-options header b { padding:5px 8px; border-radius:999px; font-size:.63rem; background:var(--sky); }
.recovery-access-options p,.recovery-access-options small,.recovery-membership-controls p { color:var(--muted); line-height:1.6; }
.recovery-access-options label { display:grid; gap:6px; margin:12px 0; font-size:.73rem; font-weight:800; }
.recovery-access-options textarea { width:100%; padding:10px; border:1px solid #bfd0d9; border-radius:11px; resize:vertical; }
.recovery-access-options button,.recovery-membership-controls button { min-height:42px; padding:8px 13px; border:0; border-radius:10px; color:white; background:#21735f; font-weight:900; }
.gift-moderation-list,.prayer-leader-list,.recovery-admin-programs,.recovery-access-queue { display:grid; gap:13px; }
.gift-moderation-list>article,.prayer-leader-list>article,.recovery-admin-programs>article,.recovery-access-queue>article { padding:18px; border:1px solid var(--border); border-radius:16px; background:#fbfdfe; }
.gift-moderation-list header,.prayer-leader-list header,.recovery-admin-programs header,.recovery-access-queue header { display:flex; justify-content:space-between; gap:12px; }
.gift-moderation-list header div,.prayer-leader-list header div { display:flex; flex-wrap:wrap; gap:6px; }
.gift-moderation-list header span,.prayer-leader-list header span,.recovery-admin-programs header span,.recovery-admin-programs header b,.recovery-access-queue header span { padding:5px 8px; border-radius:999px; color:var(--blue); background:var(--sky); font-size:.62rem; font-weight:850; text-transform:capitalize; }
.gift-moderation-list>article>div:last-child,.prayer-leader-list>article>div:last-child,.recovery-access-queue>article>div:last-child { display:flex; flex-wrap:wrap; gap:8px; margin-top:13px; }
.gift-moderation-list button,.prayer-leader-list button,.recovery-access-queue button { min-height:39px; padding:7px 11px; border:0; border-radius:9px; color:white; background:var(--blue); font-weight:850; }
.prayer-leader-list dl,.recovery-admin-programs dl { display:grid; gap:6px; }
.prayer-leader-list dl>div,.recovery-admin-programs dl>div { display:grid; grid-template-columns:130px 1fr; gap:8px; padding:8px; border-radius:9px; background:#f1f5f6; }
.prayer-leader-list dt,.prayer-leader-list dd,.recovery-admin-programs dt,.recovery-admin-programs dd { margin:0; font-size:.72rem; }
.prayer-leader-list dt,.recovery-admin-programs dt { color:var(--muted); }
.recovery-admin-programs { grid-template-columns:repeat(2,minmax(0,1fr)); }
.recovery-admin-programs select { width:100%; min-height:40px; padding:8px; border:1px solid #bfd0d9; border-radius:10px; }
@media(max-width:900px){.ministry-navigator__results,.more-destination-grid,.recovery-access-options,.recovery-admin-programs{grid-template-columns:1fr}.ministry-navigator__input{grid-template-columns:1fr}}
`,
);

appendOnce(
  ".env.example",
  "NEXT_PUBLIC_RECOVERY_MINISTRY_NAME",
  `# Gifts, Prayer Well, and Recovery Ministry\nNEXT_PUBLIC_SPIRITUAL_GIFTS_ASSESSMENT_URL=\nNEXT_PUBLIC_RECOVERY_MINISTRY_NAME=Recovery Ministry\nRECOVERY_OFFICIAL_PROGRAM_CONFIRMED=false\nNEXT_PUBLIC_RECOVERY_MEETING_DAY=Sunday\nNEXT_PUBLIC_RECOVERY_MEETING_TIME=\nNEXT_PUBLIC_RECOVERY_PUBLIC_LOCATION=Lowell, Massachusetts\n`,
);

let verify = read("scripts/verify-structure.mjs");
const requiredExpansionFiles = [
  "apps/church-hub/app/(protected)/gifts/page.tsx",
  "apps/church-hub/app/(protected)/prayer/page.tsx",
  "apps/church-hub/app/(protected)/recovery/page.tsx",
  "apps/church-hub/app/(protected)/more/page.tsx",
  "apps/church-hub/app/(protected)/admin/gifts/page.tsx",
  "apps/church-hub/app/(protected)/admin/prayer/page.tsx",
  "apps/church-hub/app/(protected)/admin/recovery/page.tsx",
  "apps/outreach-command/app/(protected)/recovery-outreach/page.tsx",
  "apps/public-web/app/recovery-support-lowell/page.tsx",
  "supabase/migrations/0027_gifts_prayer_recovery_ministries.sql",
  "supabase/migrations/0028_recovery_access_moderation_and_public_interest.sql",
  "supabase/migrations/0029_ministry_operational_indexes_and_prayer_routing.sql",
  "supabase/migrations/0030_recovery_access_option_rpc.sql",
  "supabase/migrations/0031_fix_gift_risk_classification.sql",
  "docs/GIFTS_PRAYER_RECOVERY_MINISTRIES.md",
];
if (!verify.includes("0027_gifts_prayer_recovery_ministries")) {
  const insertion = requiredExpansionFiles.map((path) => `  ${JSON.stringify(path)},`).join("\n");
  verify = verify.replace("const required = [", `const required = [\n${insertion}`);
  write("scripts/verify-structure.mjs", verify);
}

appendOnce(
  "README.md",
  "## Gifts, Prayer Well, and Recovery Ministry",
  `## Gifts, Prayer Well, and Recovery Ministry\n\nThe Church Hub includes three privacy-aware ministry systems:\n\n- **Gifts of the Church** — member-controlled spiritual-gift summaries, practical skills, moderated offers/needs/item sharing, private responses, and explainable matching.\n- **Prayer Well** — audience-controlled prayer requests, anonymous display, prayed/encouragement/update events, answered-prayer records, and separate pastoral/safeguarding routing.\n- **Recovery Ministry** — leader-approved private access, participant weekly journey, private group communication, curriculum links, leader operations, public treatment resources, and a separate public/aggregate Recovery Outreach workstation.\n\nSee \\`docs/GIFTS_PRAYER_RECOVERY_MINISTRIES.md\\` for data boundaries, deployment gates, and operational ownership.\n`,
);

write(
  "apps/church-hub/app/(protected)/more/page.tsx",
  read("apps/church-hub/app/(protected)/more/page.tsx"),
);

console.log("Applied Gifts, Prayer Well, Recovery Ministry, public recovery, mobile, AI navigation, and Outreach completion patches.");
`,
);
