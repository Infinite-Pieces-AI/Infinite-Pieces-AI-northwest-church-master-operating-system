export function WelcomeVideo() {
  const embedUrl = process.env.NEXT_PUBLIC_WELCOME_VIDEO_EMBED_URL;
  if (!embedUrl) return null;

  return (
    <section className="page-section welcome-media-section">
      <div className="page-shell split">
        <div>
          <p className="eyebrow">A short welcome</p>
          <h2>Meet people who can help your first Sunday feel familiar.</h2>
          <p>
            This leadership-approved video introduces the community, explains what a first visit is
            like, and shows how worship, fellowship, Bible study, and service fit together.
          </p>
        </div>
        <div className="welcome-media">
          <iframe
            src={embedUrl}
            title="Boston Church Lowell welcome video"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
