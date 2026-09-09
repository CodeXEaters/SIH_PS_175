interface HeroProps {
  onEnter: () => void;
}

export function Hero({ onEnter }: HeroProps) {
  return (
    <section id="top" className="hero-v2" aria-label="Hero">
      {/* Full environmental background image */}
      <div className="hero-bg" aria-hidden="true">
        <img
          src="/assets/hero-earth-himalaya.png"
          alt=""
          fetchPriority="high"
          decoding="async"
        />
      </div>

      <div className="container">
        {/* Left: text content & primary narrative */}
        <div className="hero-content">
          <p className="hero-eyebrow reveal">
            SATELLITE IMAGERY × AI × 3D TERRAIN
          </p>

          <h1 className="hero-headline reveal reveal-d1">
            FROM PIXELS<br />
            TO <span className="accent">TERRAIN.</span>
          </h1>

          <p className="hero-description reveal reveal-d2">
            Transforming a single image into measurable,<br />
            geospatial 3D terrain.
          </p>

          <div className="hero-buttons reveal reveal-d3">
            <button
              id="hero-explore-btn"
              className="btn-primary"
              onClick={onEnter}
              aria-label="Explore the technology"
            >
              Explore the Technology →
            </button>
            <a
              href="#interactive"
              id="hero-demo-btn"
              className="btn-secondary"
              aria-label="See it in action"
            >
              See it in Action
            </a>
          </div>

          {/* Bottom Information */}
          <div className="hero-stats reveal reveal-d4" aria-label="Key pipeline metrics">
            <div className="hero-stat">
              <span className="hero-stat-value">1 IMAGE</span>
              <span className="hero-stat-label">Input</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">7 LAYERS</span>
              <span className="hero-stat-label">AI + Geometry</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">3D TERRAIN</span>
              <span className="hero-stat-label">Output</span>
            </div>
          </div>
        </div>

        {/* Live View Panel — overlaid on terrain image */}
        <aside
          className="live-card reveal reveal-d2"
          aria-label="Scene telemetry"
        >
          <div className="live-card-header">
            <div className="live-dot" aria-hidden="true" />
            <span className="live-label">LIVE VIEW</span>
          </div>
          <div className="live-data">
            <span className="live-key">LAT</span>
            <span className="live-val">27.9881° N</span>
            <span className="live-key">LON</span>
            <span className="live-val">86.9250° E</span>
            <span className="live-key">ELEV</span>
            <span className="live-val">4,832 m</span>
            <span className="live-key">GSD</span>
            <span className="live-val">0.5 m/px</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
