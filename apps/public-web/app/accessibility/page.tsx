import { ContentPage } from "@/components/content-page";

export default function Page() {
  return (
    <ContentPage
      eyebrow="Access for everyone"
      title="Accessibility commitment"
      intro="The website and member hub are designed toward WCAG 2.2 AA, with keyboard access, visible focus, readable contrast, captions, and plain language."
    >
      <h2>Target</h2>
      <p>
        Both web experiences target WCAG 2.2 Level AA. Accessibility tests are included in the
        repository, but human testing with keyboard, screen reader, zoom, reduced motion, and mobile
        devices remains required.
      </p>
      <h2>Practical commitments</h2>
      <ul>
        <li>Visible focus and skip links</li>
        <li>Large touch targets</li>
        <li>Captions and transcripts</li>
        <li>Plain-language errors</li>
        <li>No essential information by color alone</li>
        <li>Reduced-motion support</li>
      </ul>
    </ContentPage>
  );
}
