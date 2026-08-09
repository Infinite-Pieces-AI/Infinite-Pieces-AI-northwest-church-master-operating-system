import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = { title: "How to Find a Church Community", description: "Look for clear beliefs, trustworthy leadership, healthy relationships, responsible child safety, room for questions, service, and community beyond Sunday.", alternates: { canonical: "/how-to-find-a-church-community" } };

export default function Page() {
  return <ContentPage eyebrow="Choosing community thoughtfully" title="How to find a church community" intro="A church should be evaluated by more than a homepage. Take time to observe its teaching, leadership, relationships, boundaries, service, and whether its real practices match its public promises." canonicalPath="/how-to-find-a-church-community">
    <div className="guide-grid"><article><h2>Clear beliefs</h2><p>Can leaders explain what the church teaches and show how Scripture is being used?</p></article><article><h2>Trustworthy leadership</h2><p>Are authority, accountability, safeguarding, and decision-making handled responsibly?</p></article><article><h2>Healthy relationships</h2><p>Can people form friendships beyond formal events, and is there room for different life stages?</p></article><article><h2>Room for questions</h2><p>Can a visitor ask something difficult without being pressured, embarrassed, or treated as a project?</p></article><article><h2>Responsible family care</h2><p>Are children and teens protected through clear guardian, communication, and volunteer boundaries?</p></article><article><h2>Service with integrity</h2><p>Does service respond to real needs and respect the dignity of neighbors and community partners?</p></article></div>
    <h2>Take more than one step</h2><p>Read, ask questions, attend more than once if helpful, and speak with several people. You are allowed to move carefully.</p><div className="page-actions"><Link className="button button--gold" href="/about">Explore beliefs and identity</Link><Link className="button button--outline-dark" href="/plan-a-visit">Plan a first Sunday</Link></div>
  </ContentPage>;
}
