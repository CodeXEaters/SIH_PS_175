export function ProblemStatement() {
  return (
    <section
      id="problem"
      className="problem-statement-section animate-on-scroll"
      aria-label="The problem with flat imagery"
    >
      {/* Large editorial statement */}
      <div className="problem-statement-body">
        <p className="kicker">THE PROBLEM</p>

        <h2 className="problem-headline">
          A photograph is flat.
        </h2>
        <h2 className="problem-headline problem-serif">
          <i>The Earth isn't.</i>
        </h2>

        <p className="problem-explanation">
          Optical imagery captures appearance — reflectance, color, texture.
          It does not capture geometry. The third dimension — depth, slope,
          and elevation — is hidden inside the image, waiting to be recovered.
          BHUDARPAN reconstructs spatial structure from what the image already contains.
        </p>

        {/* Minimal visual distinction — relative vs metric */}
        <div className="problem-distinction">
          <div className="problem-distinction-item">
            <span className="distinction-mode">RELATIVE</span>
            <p className="distinction-desc">
              Depth inferred from pixel appearance alone.
              Shape preserved. Scale unknown.
            </p>
            <code>PNG / JPG → Relative DSM</code>
          </div>

          <div className="problem-distinction-divider" aria-hidden="true">
            <span>→</span>
          </div>

          <div className="problem-distinction-item active">
            <span className="distinction-mode active">METRIC</span>
            <p className="distinction-desc">
              Depth anchored to physical scale using
              ground reference data. Elevation measurable.
            </p>
            <code>GeoTIFF + Reference → Metric DSM</code>
          </div>
        </div>
      </div>
    </section>
  );
}
