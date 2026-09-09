export function ScientificPrecision() {
  const stats = [
    { label: 'MIN ELEVATION', val: '3,820.0 m', desc: 'Basal valley floor' },
    { label: 'MAX ELEVATION', val: '5,460.0 m', desc: 'Glaciated ridge crest' },
    { label: 'TOTAL RELIEF', val: '1,640.0 m', desc: 'Vertical topographic range' },
    { label: 'R² CALIBRATION FIT', val: '0.968', desc: 'RANSAC vs SRTM GL1' },
    { label: 'BENCHMARK RMSE', val: '3.42 m', desc: 'LiDAR ground truth' },
    { label: '95% CONFIDENCE', val: '±7.2 m', desc: 'Spatial error ceiling' }
  ];

  return (
    <section id="science" style={{
      padding: 'var(--space-160) clamp(var(--space-24), 6vw, var(--space-96))',
      position: 'relative',
      zIndex: 2,
      background: 'var(--void)',
      borderTop: '1px solid var(--smoked-border)',
      borderBottom: '1px solid var(--smoked-border)'
    }}>
      <div className="animate-on-scroll">
        <p className="kicker">
          SCIENTIFIC OBSERVATION
        </p>
        <h2 style={{ font: '600 clamp(2.4rem, 4.5vw, 4.8rem)/0.96 var(--font-ui)', letterSpacing: '-2px', margin: 0 }}>
          Measure what the image<br/>
          <i style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-glow)', fontWeight: 500, fontStyle: 'italic' }}>
            cannot directly show.
          </i>
        </h2>
        <p style={{ maxWidth: '640px', color: 'var(--stone)', fontSize: '1.05rem', lineHeight: 1.7, margin: '24px 0 0 0' }}>
          Real geospatial metrics evaluated against airborne LiDAR ground-truth data in high-relief alpine environments. Every number traces back to a verified reference surface.
        </p>
      </div>

      <div className="statboard animate-on-scroll">
        {stats.map((item) => (
          <div key={item.label}>
            <small>{item.label}</small>
            <b>{item.val}</b>
            <span style={{ font: '500 9px var(--font-mono)', color: 'var(--ash)', display: 'block', marginTop: 8 }}>
              {item.desc}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
