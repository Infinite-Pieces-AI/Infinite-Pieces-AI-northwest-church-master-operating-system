import Link from "next/link";
export default function NotFound() {
  return (
    <section className="page-hero">
      <div className="page-shell narrow">
        <p className="eyebrow">Page not found</p>
        <h1>We could not find that page.</h1>
        <p className="lead">The link may be old or the content may not be published yet.</p>
        <Link className="button button--gold" href="/">
          Return home
        </Link>
      </div>
    </section>
  );
}
