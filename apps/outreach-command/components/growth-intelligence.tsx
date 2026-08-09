"use client";

import { useMemo, useState } from "react";
import { channelAttribution, localFunnel, onlineFunnel, trafficSeries } from "@/lib/demo-data";

type FunnelMode = "local" | "online";

export function GrowthIntelligence() {
  const [mode, setMode] = useState<FunnelMode>("local");
  const maxVisits = Math.max(...trafficSeries.map((point) => point.visits));
  const funnel = mode === "local" ? localFunnel : onlineFunnel;
  const maxFunnel = Math.max(...funnel.map((stage) => stage.value));
  const conversionRate = useMemo(() => {
    const first = funnel[0]?.value ?? 0;
    const last = funnel.at(-1)?.value ?? 0;
    return first > 0 ? ((last / first) * 100).toFixed(1) : "0.0";
  }, [funnel]);

  return (
    <>
      <div className="growth-layout">
        <section className="panel">
          <div className="panel__header"><div><h2>Public website momentum</h2><p>Synthetic visits and meaningful conversions over the last several weeks.</p></div><span className="status-pill status-pill--demo">DEMO ANALYTICS</span></div>
          <div className="panel__body">
            <div className="traffic-chart" aria-label="Synthetic website visits chart">
              {trafficSeries.map((point) => (
                <div className="traffic-column" key={point.label}>
                  <strong>{point.visits}</strong>
                  <div className="traffic-column__bar" style={{ height: `${Math.max(16, (point.visits / maxVisits) * 210)}px` }} />
                  <small>{point.label}<br />{point.conversions} actions</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header"><div><h2>Voluntary conversion funnel</h2><p>{conversionRate}% illustrative end-to-end completion.</p></div></div>
          <div className="search-toolbar">
            <button className={`filter-chip${mode === "local" ? " active" : ""}`} type="button" onClick={() => setMode("local")}>Local visit</button>
            <button className={`filter-chip${mode === "online" ? " active" : ""}`} type="button" onClick={() => setMode("online")}>Online / Zoom</button>
          </div>
          <div className="panel__body funnel-list">
            {funnel.map((stage) => (
              <div className="funnel-row" key={stage.stage}>
                <strong>{stage.stage}</strong>
                <div className="funnel-bar"><span style={{ width: `${Math.max(4, (stage.value / maxFunnel) * 100)}%` }} /></div>
                <span>{stage.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel__header"><div><h2>Channel attribution</h2><p>Aggregate public traffic and consented conversion actions only.</p></div></div>
        <div className="search-table-wrap">
          <table className="data-table">
            <thead><tr><th>Channel</th><th>Visits</th><th>Conversions</th><th>Rate</th><th>Interpretation</th></tr></thead>
            <tbody>
              {channelAttribution.map((channel) => (
                <tr key={channel.channel}>
                  <td><strong>{channel.channel}</strong></td>
                  <td>{channel.visits}</td>
                  <td>{channel.conversions}</td>
                  <td>{channel.rate}%</td>
                  <td>{channel.rate >= 10 ? "Strong next-step fit" : channel.rate >= 7 ? "Healthy qualified traffic" : "Improve relevance and landing-page clarity"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="section-grid" style={{ marginTop: 18 }}>
        <section className="panel"><div className="panel__header"><div><h2>Measurement policy</h2><p>What the OS considers success.</p></div></div><div className="panel__body action-list"><li><span>1</span>Plan a Visit submission</li><li><span>2</span>Directions click or public event registration</li><li><span>3</span>Online conversation or Bible-study request</li><li><span>4</span>Consented human follow-up</li></div></section>
        <section className="panel"><div className="panel__header"><div><h2>Excluded from marketing analytics</h2><p>Sensitive ministry areas remain outside campaign profiling.</p></div></div><div className="panel__body action-list"><li><span>×</span>Private prayer content</li><li><span>×</span>Child, counseling, or safeguarding records</li><li><span>×</span>Private Hub messages and group behavior</li><li><span>×</span>Inferred religious intensity or vulnerability</li></div></section>
      </div>
    </>
  );
}
