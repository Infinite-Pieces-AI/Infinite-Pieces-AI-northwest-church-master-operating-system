import Link from "next/link";
import { scoreMinistryOpportunity } from "@church/outreach";
import { aiVisibilityChecks, localPresenceChecks, publicOpportunities, searchOpportunities, visitorRecords } from "@/lib/demo-data";

export function MorningBrief() {
  const query = searchOpportunities[0];
  const assessment = scoreMinistryOpportunity({
    topic: query?.query ?? "family-friendly church in Lowell",
    churchVisitIntent: 96,
    localRelevance: 100,
    demandGrowth: query?.trend ?? 70,
    rankingOpportunity: query?.position && query.position > 3 ? 88 : 45,
    contentGap: query?.page ? 58 : 95,
    conversionFit: 91,
    freshness: 86,
    sensitivityRisk: 4,
    confidence: 78,
    source: "Synthetic Search Console + public-page inventory",
    dateRange: { start: "2026-07-10", end: "2026-08-08" },
  });
  const publicQuestion = publicOpportunities[0];
  const weakFacts = localPresenceChecks.filter((item) => item.status !== "ready").length;
  const inaccurateAi = aiVisibilityChecks.filter((item) => !item.churchMentioned || item.factsAccurate !== true).length;
  const unassigned = visitorRecords.filter((item) => item.owner === "Unassigned").length;

  const questions = [
    { title: "What are people publicly asking?", answer: publicQuestion?.title ?? "No approved public source has produced a live signal yet.", detail: publicQuestion ? `${publicQuestion.sourceLabel} · priority ${publicQuestion.scores.priority}` : "Connect an approved public source before treating this as live intelligence.", href: "/radar", action: "Open Command Radar" },
    { title: "Where is the church missing from search?", answer: `${searchOpportunities.filter((item) => !item.page).length} synthetic high-intent topics lack a dedicated page.`, detail: `Top explainable opportunity: ${assessment.topic} · priority ${assessment.priority} · confidence ${assessment.confidence}.`, href: "/search-intelligence", action: "Review search gaps" },
    { title: "Which facts or pages are weak?", answer: `${weakFacts} local-presence checks and ${inaccurateAi} AI visibility checks need evidence or correction.`, detail: "The OS separates missing evidence from an actual factual error and never guarantees search placement.", href: "/local-presence", action: "Review public truth" },
    { title: "What respectful action needs approval today?", answer: unassigned ? `${unassigned} consented visitor request is waiting for a human owner.` : "No consented request is currently unassigned in the synthetic queue.", detail: "Public replies, content, budgets, meetings, and publication remain human-approved.", href: "/visitor-crm", action: "Open the welcome queue" },
  ];

  return <>
    <section className="morning-brief-hero"><div><p className="eyebrow">One connected ministry journey</p><h2>Turn public curiosity into a trustworthy answer, a voluntary next step, and real human belonging.</h2><p>Every recommendation shows its source, date range, confidence, score inputs, risk deduction, and required human approval.</p></div><div className="brief-score"><span>Top priority</span><strong>{assessment.priority}</strong><small>{assessment.confidence}% confidence</small></div></section>
    <div className="morning-question-grid">{questions.map((item, index) => <article key={item.title}><span>0{index + 1}</span><h3>{item.title}</h3><strong>{item.answer}</strong><p>{item.detail}</p><Link href={item.href}>{item.action} →</Link></article>)}</div>
    <section className="panel explainable-score-panel"><div className="panel__header"><div><h2>Explainable opportunity score</h2><p>{assessment.topic} · {assessment.source} · {assessment.dateRange.start} through {assessment.dateRange.end}</p></div><span className="status-pill status-pill--review">SYNTHETIC EVIDENCE</span></div><div className="panel__body"><div className="score-contribution-grid">{assessment.contributions.map((item) => <article key={item.key}><strong>{item.input}</strong><span>{item.label}</span><small>{Math.round(item.weight * 100)}% weight · {item.contribution.toFixed(1)} points</small></article>)}<article className="score-risk-cell"><strong>−{assessment.riskPenalty.toFixed(1)}</strong><span>Sensitivity / policy deduction</span><small>No person or inferred belief is scored.</small></article></div><div className="explanation-actions"><div><h3>Why it matters</h3><ul>{assessment.explanation.map((reason) => <li key={reason}>{reason}</li>)}</ul></div><div><h3>Recommended human actions</h3><ol>{assessment.recommendedActions.map((action) => <li key={action}>{action}</li>)}</ol></div></div></div></section>
  </>;
}
