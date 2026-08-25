export function HeroCinematic({ enter }: { enter: () => void }) {
  return (
    <section id="top" className="hero animate-on-scroll" style={{ 
      minHeight: '100svh', 
      position: 'relative', 
      display: 'flex', 
      alignItems: 'center', 
      padding: '0 clamp(24px, 5vw, 64px)' 
    }}>
      <div className="hero-image" />
      
      <div className="hero-content" style={{ position: 'relative', zIndex: 2, maxWidth: '900px' }}>
        <p className="kicker" style={{ font: '500 11px "DM Mono"', letterSpacing: '2px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '24px' }}>
          REMOTE SENSING × AI × 3D
        </p>
        <h1 style={{ font: '500 clamp(70px, 8vw, 130px)/1.05 Manrope', letterSpacing: '-4px', margin: 0, textTransform: 'uppercase' }}>
          From pixels<br/>to <i style={{ fontFamily: '"Playfair Display"', color: 'var(--gold-glow)', fontWeight: 500, fontStyle: 'italic', textTransform: 'none' }}>terrain.</i>
        </h1>
        <p style={{ maxWidth: '500px', color: 'var(--muted)', fontSize: '16px', lineHeight: 1.8, margin: '32px 0' }}>
          DepthWizard reconstructs spatial structure from optical imagery and turns it into an explorable representation of the Earth's surface.
        </p>
        
        <div className="buttons" style={{ display: 'flex', gap: '16px', marginTop: '48px' }}>
          <button onClick={enter} style={{
            background: 'linear-gradient(135deg, var(--gold-glow), var(--gold))', border: 0, color: 'var(--basalt)',
            padding: '16px 32px', borderRadius: '2px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
            boxShadow: '0 4px 20px rgba(181, 150, 88, 0.2)', transition: 'filter 0.2s', cursor: 'pointer'
          }} onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}>
            Explore the reconstruction →
          </button>
          <a href="#workflow" style={{
            border: '1px solid rgba(241, 239, 232, 0.2)', color: 'var(--text)', textDecoration: 'none',
            padding: '16px 32px', borderRadius: '2px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
            transition: 'background 0.2s', display: 'flex', alignItems: 'center'
          }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(241, 239, 232, 0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            See how it works
          </a>
        </div>
      </div>

      <aside style={{
        position: 'absolute', right: '5%', top: '30%', width: '220px',
        background: 'linear-gradient(var(--smoked-glass), var(--smoked-glass)) padding-box, linear-gradient(135deg, rgba(181,150,88,0.2) 0%, transparent 100%) border-box',
        border: '1px solid transparent', backdropFilter: 'blur(10px)', padding: '32px 24px',
        font: '10px "DM Mono"', letterSpacing: '1px'
      }}>
        <small style={{ fontSize: '9px', letterSpacing: '2px', color: 'var(--gold)', display: 'block', marginBottom: '24px' }}>● LIVE SCENE</small>
        <dl style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px 8px', margin: 0 }}>
          <dt style={{ color: 'var(--muted)', fontSize: '9px' }}>LAT</dt><dd style={{ margin: 0, color: 'var(--text)', fontSize: '10px', textAlign: 'right' }}>19.0760° N</dd>
          <dt style={{ color: 'var(--muted)', fontSize: '9px' }}>LON</dt><dd style={{ margin: 0, color: 'var(--text)', fontSize: '10px', textAlign: 'right' }}>72.8777° E</dd>
          <dt style={{ color: 'var(--muted)', fontSize: '9px' }}>ELEV</dt><dd style={{ margin: 0, color: 'var(--text)', fontSize: '10px', textAlign: 'right' }}>124.7 M</dd>
          <dt style={{ color: 'var(--muted)', fontSize: '9px' }}>SLOPE</dt><dd style={{ margin: 0, color: 'var(--text)', fontSize: '10px', textAlign: 'right' }}>8.2°</dd>
          <dt style={{ color: 'var(--muted)', fontSize: '9px' }}>CONF</dt><dd style={{ margin: 0, color: 'var(--gold)', fontSize: '10px', textAlign: 'right' }}>93.8%</dd>
        </dl>
      </aside>

      <div style={{ position: 'absolute', bottom: '48px', left: 'clamp(24px, 5vw, 64px)', display: 'flex', gap: '48px', font: '10px "DM Mono"', letterSpacing: '1.5px', color: 'var(--muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><i style={{width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)'}}/> AI DEPTH ENGINE READY</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><i style={{width: 6, height: 6, borderRadius: '50%', background: '#8B8B80'}}/> SCIENTIFIC VISUALIZATION ONLINE</span>
      </div>

      <div style={{ position: 'absolute', bottom: '48px', right: 'clamp(24px, 5vw, 64px)', font: '10px "DM Mono"', letterSpacing: '1.5px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ border: '1px solid var(--muted)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↓</span>
        SCROLL TO EXPLORE
      </div>
    </section>
  );
}
