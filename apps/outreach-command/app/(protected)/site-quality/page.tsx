import Link from "next/link";
import { EmptyLiveData, LiveDataNotice } from "@/components/live-data-ui";
import { PageHeading } from "@/components/page-heading";
import {
  loadConnectorRows,
  loadSearchRows,
  outreachBackendConfigured,
} from "@/lib/live-intelligence";

export default async function SiteQualityPage() {
  const [connectors, search] = await Promise.all([loadConnectorRows(), loadSearchRows()]);
  const crawler = connectors.find((row) =>
    String(row.key ?? row.display_name ?? "")
      .toLowerCase()
      .includes("crawl"),
  );
  return (
    <>
      <PageHeading
        eyebrow="First-party public website audit"
        title="Site Quality"
        description="Monitor broken links, metadata, canonical conflicts, stale facts, missing structured data, image accessibility, orphan pages, redirect chains, and thin local content through an approved crawler."
      />
      <LiveDataNotice title="Only the church-owned public site is crawled">
        <p>
          The crawler must not discover or index Church Hub, Outreach OS, private media, preview
          deployments, or authenticated routes.
        </p>
      </LiveDataNotice>
      {!outreachBackendConfigured() ? (
        <EmptyLiveData
          title="Site-quality storage is not connected"
          description="Connect the production database and approved first-party crawler before presenting crawl results."
        />
      ) : !crawler ? (
        <EmptyLiveData
          title="No approved crawler connector is registered"
          description="Register a church-owned, public-site-only crawler with an allowlisted hostname, retention rule, owner, and emergency shutoff."
          href="/source-control"
          action="Open Source Control"
        />
      ) : (
        <section className="panel" style={{ marginTop: 18 }}>
          <div className="panel__header">
            <div>
              <h2>Crawler connector is registered</h2>
              <p>Run evidence and issue records must come from the approved worker.</p>
            </div>
            <Link href="/source-control">Review connector →</Link>
          </div>
          <div className="panel__body">
            <p>
              Current connector status: <strong>{String(crawler.status ?? "unknown")}</strong>. The
              search inventory contains <strong>{search.snapshots.length}</strong> imported
              page/query rows that can help identify missing and competing pages.
            </p>
            <p>
              This screen intentionally does not display invented broken links or performance
              scores. Connect the crawler’s real finding table and worker output before launch.
            </p>
          </div>
        </section>
      )}
    </>
  );
}
