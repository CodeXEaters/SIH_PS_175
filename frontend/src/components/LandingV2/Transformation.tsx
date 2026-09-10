const layers = [
  { name: 'IMAGE', desc: 'Optical 2D satellite imagery' },
  { name: 'DEPTH', desc: 'Monocular depth estimation' },
  { name: 'SEMANTIC', desc: 'Ground, vegetation & surface context' },
  { name: '3D TERRAIN', desc: 'Calibrated digital surface model' },
];

export function Transformation() {
  return (
    <section id="transformation" className="transform-section" aria-label="Transformation pipeline">
      <div className="container">
        {/* Left: Narrative */}
        <div className="transform-left">
          <p className="eyebrow reveal">THE TRANSFORMATION</p>
          <h2 className="section-title reveal reveal-d1">
            A photograph is flat.<br />
            <span className="transform-title-cyan">The terrain isn't.</span>
          </h2>
          <p className="section-body reveal reveal-d2" style={{ marginTop: '20px' }}>
            We combine semantic understanding, geospatial anchoring
            and AI depth estimation to reconstruct real-world 3D terrain
            from a single 2D image.
          </p>
        </div>

        {/* Right: Floating stacked-layer visualization */}
        <div className="transform-right reveal reveal-d1">
          <div className="layer-stack">
            <img
              src="/assets/transformation-stack.jpg"
              alt="Four progressive layers: Image, Depth, Semantic context, and 3D Terrain"
              loading="lazy"
            />
          </div>

          <div className="layer-legend" aria-label="Sequential pipeline layers">
            {layers.map((l, idx) => (
              <div
                key={l.name}
                className={`layer-legend-item reveal reveal-d${idx + 1}`}
              >
                <div className="layer-dot" aria-hidden="true" />
                <div>
                  <span className="layer-legend-name">{l.name}</span>
                  <span className="layer-legend-desc">{l.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
