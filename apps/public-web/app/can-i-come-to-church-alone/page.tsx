import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = { title: "Can I Come to Church Alone?", description: "Yes. See how to arrive, participate at your own pace, sit where you are comfortable, and choose whether to talk with anyone afterward.", alternates: { canonical: "/can-i-come-to-church-alone" } };

export default function Page() {
  return <ContentPage eyebrow="Coming by yourself" title="Yes—you can come to church alone" intro="You do not need to arrive with a friend, know the songs, understand every belief, or speak to anyone beyond what feels comfortable." canonicalPath="/can-i-come-to-church-alone">
    <h2>Before you arrive</h2><p>Open the current directions, review the entrance information, and arrive early only if that would make the visit feel easier.</p>
    <h2>When you enter</h2><p>A welcome volunteer may offer practical help. You can simply say that you would like to find a seat, or ask to meet someone if you prefer more support.</p>
    <h2>During worship</h2><p>Sit where you are comfortable and participate at your own pace. You are not required to create an account or make a public commitment in order to attend.</p>
    <h2>Afterward</h2><p>You may leave, ask a question, or stay for an optional conversation. When you are ready, the Church Hub helps approved members find low-pressure meals, walks, Bible conversations, and service opportunities.</p>
    <div className="page-actions"><Link className="button button--gold" href="/plan-a-visit">See Sunday details</Link><Link className="button button--outline-dark" href="/ask-a-question">Ask for a welcome contact</Link></div>
  </ContentPage>;
}
