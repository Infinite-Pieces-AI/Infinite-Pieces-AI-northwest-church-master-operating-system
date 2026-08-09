import Link from "next/link";
import { ContentPage } from "@/components/content-page";

export interface GuideSection {
  heading: string;
  body: string;
  points?: readonly string[];
}

export interface PeopleFirstGuideContent {
  eyebrow: string;
  title: string;
  intro: string;
  sections: readonly GuideSection[];
  nextSteps: readonly { label: string; href: string; description: string }[];
  ctaLabel?: string;
  ctaHref?: string;
}

export function PeopleFirstGuide({ content }: { content: PeopleFirstGuideContent }) {
  return (
    <ContentPage
      eyebrow={content.eyebrow}
      title={content.title}
      intro={content.intro}
      ctaLabel={content.ctaLabel}
      ctaHref={content.ctaHref}
    >
      <div className="expectation-grid">
        {content.sections.map((section) => (
          <article className="expectation-card" key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
            {section.points?.length ? (
              <ul>
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>

      <h2>Choose a next step</h2>
      <div className="next-step-grid">
        {content.nextSteps.map((step) => (
          <Link className="next-step-card" href={step.href} key={step.href}>
            <strong>{step.label}</strong>
            <span>{step.description}</span>
          </Link>
        ))}
      </div>
    </ContentPage>
  );
}
