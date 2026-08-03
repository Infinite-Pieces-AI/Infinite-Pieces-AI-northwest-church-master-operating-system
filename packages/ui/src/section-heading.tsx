import type { ReactNode } from "react";

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  align?: "left" | "center";
}

export function SectionHeading({ eyebrow, title, description, align = "left" }: SectionHeadingProps) {
  return (
    <header className={`section-heading section-heading--${align}`}>
      {eyebrow ? <p className="section-heading__eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {description ? <div className="section-heading__description">{description}</div> : null}
    </header>
  );
}
