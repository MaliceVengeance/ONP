type Props = {
  videoUrl?: string;
};

/**
 * Fixed 16:9 slot so page layout never shifts once a real video is wired
 * in. Until videoUrl is supplied, this renders a static "coming soon"
 * placeholder and fires no video analytics at all — no fabricated events
 * for content that doesn't exist yet. This component is the only place
 * that needs to change when the video asset is finally identified; the
 * rest of ComingSoonPage is unaffected. No video-hosting dependency or
 * fabricated URL is introduced here.
 */
export default function VideoSection({ videoUrl }: Props) {
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: "10px",
          overflow: "hidden",
          background: "var(--camo-charcoal)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {videoUrl ? (
          // Future checkpoint: real embed here, wired to fire
          // trackEvent("landing_video_start") on first play and
          // trackEvent("landing_video_progress", { video_percent }) at
          // each quartile via the chosen player's progress events.
          <div style={{ color: "var(--camo-steel)" }}>Video embed goes here.</div>
        ) : (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }} aria-hidden="true">🎬</div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "var(--camo-concrete)",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
              }}
            >
              Our walkthrough video will be here soon
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
