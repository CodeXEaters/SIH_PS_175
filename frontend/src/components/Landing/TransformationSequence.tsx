export function TransformationSequence() {
  const stages = [
    {
      num: '01',
      name: 'IMAGE',
      desc: 'High-resolution optical RGB imagery capturing 2D surface reflectance without spatial geometry.',
      bgClass: 'rgb',
      badge: 'OPTICAL SENSOR'
    },
    {
      num: '02',
      name: 'DEPTH',
      desc: 'Foundation monocular vision model predicting dense relative disparity and depth boundaries across all pixels.',
      bgClass: 'depth',
      badge: 'RELATIVE DISPARITY'
    },
    {
      num: '03',
      name: 'SEMANTIC GROUND',
      desc: 'Semantic decomposition isolating bare ground from non-ground occlusions: canopy, buildings, and water bodies.',
      bgClass: 'semantic',
      badge: 'LANDCOVER PARSING'
    },
    {
      num: '04',
      name: 'CALIBRATION',
      desc: 'RANSAC regression anchoring bare ground against sparse reference DEMs to solve for true physical scale and vertical offset.',
      bgClass: 'elevation',
      badge: 'METRIC ANCHORING'
    },
    {
      num: '05',
      name: 'TERRAIN',
      desc: 'An explorable, geometrically consistent Digital Surface Model (DSM) with real-world elevations and slopes.',
      bgClass: 'contours',
      badge: '32-BIT METRIC DSM'
    },
    {
      num: '06',
      name: 'UNCERTAINTY',
      desc: 'Per-pixel spatial confidence bounds identifying steep shadowed escarpments and ambiguous surface features.',
      bgClass: 'uncertainty',
      badge: '95% CONFIDENCE'
    }
  ];

  return (
    <section id="story" className="transformation-section">
      <div className="animate-on-scroll">
        <p className="kicker">
          THE PIPELINE
        </p>
        <h2 style={{ font: '600 clamp(2.6rem, 5vw, 5.5rem)/0.96 var(--font-ui)', letterSpacing: '-2px', margin: 0 }}>
          One image passes through<br/>
          <i style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-glow)', fontWeight: 500, fontStyle: 'italic' }}>six transformations.</i>
        </h2>
        <p style={{ maxWidth: '620px', color: 'var(--stone)', fontSize: '1.1rem', lineHeight: 1.7, margin: '28px 0 0 0' }}>
          From optical reflectance through semantic perception, geospatial anchoring,
          and calibration — to a measurable, explorable terrain surface.
        </p>
      </div>

      <div className="landing-stages">
        {stages.map((item, i) => (
          <div key={item.name} className="animate-on-scroll" style={{ transitionDelay: `${Math.min(i * 60, 240)}ms` }}>
            <b>{item.num}</b>
            
            <div className={`stage-view-card ${item.bgClass}`}>
              <div style={{
                position: 'absolute',
                top: 12,
                left: 12,
                font: '500 8px var(--font-mono)',
                color: 'var(--gold-glow)',
                background: 'rgba(7, 10, 9, 0.85)',
                padding: '3px 8px',
                borderRadius: 2,
                border: '1px solid var(--smoked-border)',
                letterSpacing: 1
              }}>
                {item.badge}
              </div>
            </div>

            <div>
              <small style={{ font: '500 9px var(--font-mono)', color: 'var(--gold-glow)', letterSpacing: 1.5, display: 'block', marginBottom: 6 }}>
                STAGE {item.num}
              </small>
              <h3 style={{ fontSize: '1.6rem', margin: '0 0 10px', fontWeight: 600, letterSpacing: '-0.5px' }}>
                {item.name}
              </h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--stone)', margin: 0, maxWidth: '380px', lineHeight: 1.65 }}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
