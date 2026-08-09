"use client";

import Link from "next/link";
import { useState } from "react";
import { trackPublicEvent } from "@/lib/analytics-client";

const pathways = {
  jesus: {
    label: "I want to know Jesus",
    title: "Begin with honest questions about Jesus.",
    body: "Explore who Jesus is, what the Gospel means, and how to begin reading Scripture without pretending you already have everything figured out.",
    href: "/questions-about-jesus",
    action: "Explore questions about Jesus",
  },
  community: {
    label: "I am looking for community",
    title: "Find relationships that move beyond Sunday morning.",
    body: "Learn about family groups, meals, Bible conversations, service, and the member fellowship tools that help ordinary plans become open invitations.",
    href: "/how-to-find-a-church-community",
    action: "See how community works",
  },
  family: {
    label: "I am looking for my family",
    title: "Prepare your household before you arrive.",
    body: "See the current children’s and teen ministry information, first-visit expectations, and the questions guardians may want answered before Sunday.",
    href: "/church-for-families-lowell",
    action: "Explore the family pathway",
  },
  serve: {
    label: "I want to serve Lowell",
    title: "Put faith into practice beside other people.",
    body: "Discover how approved community partnerships and public service opportunities can help members and visitors love their neighbors together.",
    href: "/serve-lowell",
    action: "Explore service",
  },
  online: {
    label: "I need an online option",
    title: "Start with a conversation from home.",
    body: "Learn how to request an approved online Bible conversation or ask when a leader-reviewed Zoom discussion is available.",
    href: "/online-bible-study",
    action: "Explore online options",
  },
} as const;

type PathwayKey = keyof typeof pathways;

export function VisitorPathways() {
  const [selected, setSelected] = useState<PathwayKey>("jesus");
  const pathway = pathways[selected];

  return (
    <section className="visitor-pathways" aria-labelledby="visitor-pathways-title">
      <div className="section-intro">
        <p className="eyebrow">Choose what brought you here</p>
        <h2 id="visitor-pathways-title">Start with the question that is already on your mind.</h2>
        <p>
          Your choice changes only what this page shows next. It does not create a profile, infer a
          belief, or place you into an advertising audience.
        </p>
      </div>
      <div className="pathway-tabs" aria-label="Visitor pathways">
        {(Object.entries(pathways) as Array<[PathwayKey, (typeof pathways)[PathwayKey]]>).map(
          ([key, item]) => (
            <button
              key={key}
              type="button"
              className={selected === key ? "active" : ""}
              aria-pressed={selected === key}
              onClick={() => {
                setSelected(key);
                trackPublicEvent("visitor_pathway_selected", { path: "/", pathway: key });
              }}
            >
              {item.label}
            </button>
          ),
        )}
      </div>
      <div className="pathway-answer" aria-live="polite">
        <div>
          <span>Selected pathway</span>
          <h3>{pathway.title}</h3>
          <p>{pathway.body}</p>
        </div>
        <Link className="button button--gold" href={pathway.href}>
          {pathway.action}
        </Link>
      </div>
    </section>
  );
}
