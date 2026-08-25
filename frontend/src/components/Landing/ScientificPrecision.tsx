export function ScientificPrecision() {
  const stats = [
    ['MIN ELEVATION', '42.3 m'],
    ['MAX ELEVATION', '187.6 m'],
    ['TOTAL RELIEF', '145.3 m'],
    ['CONFIDENCE', '91.7%']
  ];

  return (
    <section id="product" style={{
      padding: '160px clamp(24px, 6vw, 96px)',
      position: 'relative',
      zIndex: 2,
      display: 'flex',
      gap: '64px',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap'
    }}>
      <div style={{ flex: 1, minWidth: '300px' }}>
        <p className="kicker animate-on-scroll" style={{ font: '500 11px "DM Mono"', letterSpacing: '2px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '24px' }}>
          SCIENTIFIC PRECISION
        </p>
        <h2 className="animate-on-scroll" style={{ font: '500 clamp(50px, 6vw, 90px)/1.05 Manrope', letterSpacing: '-3px', margin: 0 }}>
          Measure what the<br/>
          <i style={{ fontFamily: '"Playfair Display"', color: 'var(--gold-glow)', fontWeight: 500, fontStyle: 'italic' }}>image cannot show.</i>
        </h2>
        <p className="animate-on-scroll" style={{ maxWidth: '450px', color: 'var(--muted)', fontSize: '18px', lineHeight: 1.7, margin: '32px 0 0 0' }}>
          Calibrated terrain intelligence for resilient infrastructure, disaster planning, and environmental monitoring.
        </p>
      </div>

      <div className="statboard" style={{
        flex: 1.5, minWidth: '400px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px',
        background: 'var(--smoked-border)', // Acts as the 1px grid border
        border: '1px solid var(--smoked-border)'
      }}>
        {stats.map((x, i) => (
          <div key={x[0]} className="animate-on-scroll" style={{
            background: 'var(--smoked-glass)',
            backdropFilter: 'blur(10px)',
            padding: '48px 32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            transitionDelay: `${i * 100}ms`
          }}>
            <small style={{ font: '10px "DM Mono"', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{x[0]}</small>
            <b style={{ display: 'block', font: '48px "DM Mono"', color: 'var(--text)', marginTop: '16px', letterSpacing: '-1px' }}>{x[1]}</b>
          </div>
        ))}
      </div>
    </section>
  );
}
