"use client";

import Image from "next/image";

/**
 * A private-media presentation control. The watermark, context-menu block, and
 * short-lived URL discourage casual redistribution but cannot prevent a user
 * from taking a screenshot or photographing the screen.
 */
export function ProtectedMediaFrame({
  src,
  alt,
  viewerMark,
  expiresLabel,
}: {
  src: string;
  alt: string;
  viewerMark: string;
  expiresLabel: string;
}) {
  const mark = viewerMark.trim().slice(0, 48) || "Authorized viewer";
  return (
    <figure
      className="protected-media"
      onContextMenu={(event: { preventDefault(): void }) => event.preventDefault()}
    >
      <div className="protected-media__canvas">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 700px) 100vw, 600px"
          unoptimized
          draggable={false}
        />
        <div className="protected-media__watermark" aria-hidden="true">
          {Array.from({ length: 9 }, (_, index) => (
            <span key={index}>{mark}</span>
          ))}
        </div>
      </div>
      <figcaption>
        <strong>Private, consent-scoped media</strong>
        <span>
          {expiresLabel} · Redistribution controls are deterrents, not screenshot prevention.
        </span>
      </figcaption>
    </figure>
  );
}
