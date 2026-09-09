import { useEffect } from 'react';

export function TransformationSequence() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const stages = [
    { name: 'IMAGE', desc: 'Optical imagery capturing 2D surface data.', color: 'rgba(255,255,255,0.8)' },
    { name: 'DEPTH', desc: 'AI-driven monocular depth estimation.', color: 'rgba(208, 183, 124, 0.6)' }, // Weathered Sandstone
    { name: 'ELEVATION', desc: 'Calibrated metric scale and topographic mapping.', color: 'rgba(181, 150, 88, 0.8)' }, // Mineral Gold
    { name: 'TERRAIN', desc: 'Fully navigable 3D reconstruction.', color: 'rgba(241, 239, 232, 1)' } // Warm Ivory
  ];

  return (
    <section id="workflow" style={{
      padding: '160px clamp(24px, 6vw, 96px)',
      position: 'relative',
      zIndex: 2,
    }}>
      <p className="kicker animate-on-scroll" style={{ font: '500 11px "DM Mono"', letterSpacing: '2px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '24px' }}>
        THE TRANSFORMATION
      </p>
      <h2 className="animate-on-scroll" style={{ font: '500 clamp(50px, 6vw, 90px)/1.05 Manrope', letterSpacing: '-3px', margin: 0 }}>
        A photograph is flat.<br/>
        <i style={{ fontFamily: '"Playfair Display"', color: 'var(--gold-glow)', fontWeight: 500, fontStyle: 'italic' }}>The terrain isn’t.</i>
      </h2>
      <p className="animate-on-scroll" style={{ maxWidth: '500px', color: 'var(--muted)', fontSize: '18px', lineHeight: 1.7, margin: '32px 0 0 0' }}>
        One image passes through perception, calibration, and reconstruction to become a measurable world.
      </p>

      <div className="landing-stages" style={{
        display: 'flex', flexDirection: 'column', gap: 0, marginTop: '120px', position: 'relative'
      }}>
        {/* The connecting vertical line - uses Deep Earth token */}
        <div style={{ position: 'absolute', left: '50px', top: 0, bottom: 0, width: '1px', background: 'linear-gradient(to bottom, transparent, var(--gold), transparent)', opacity: 0.3 }} />

        {stages.map((item, i) => (
          <div key={item.name} className="animate-on-scroll" style={{
            display: 'flex', alignItems: 'center', gap: '64px', padding: '64px 0', position: 'relative', transitionDelay: `${i * 100}ms`
          }}>
            <b style={{
              font: '12px "DM Mono"', color: 'var(--text)', background: 'var(--void)', padding: '12px', border: '1px solid var(--smoked-border)',
              position: 'relative', zIndex: 2, width: '100px', textAlign: 'center', borderRadius: '2px'
            }}>
              0{i + 1}
            </b>
            
            <div className={`mini ${item.name.toLowerCase()}`} style={{
              height: '300px', width: '480px', backgroundImage: 'url("/assets/terrain-hero.png")', backgroundSize: 'cover', backgroundPosition: 'center',
              borderRadius: '2px', filter: i === 1 ? 'grayscale(1) contrast(1.2)' : i === 2 ? 'sepia(0.4) saturate(1.5)' : i === 3 ? 'saturate(0.6) brightness(1.2)' : 'saturate(0.4)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)', position: 'relative'
            }}>
              <div style={{ position: 'absolute', inset: 0, border: `1px solid ${item.color}`, opacity: 0.3, borderRadius: '2px' }} />
            </div>

            <div>
              <h3 style={{ fontSize: '32px', margin: '0 0 16px', fontFamily: '"Playfair Display"', letterSpacing: '-1px' }}>{item.name}</h3>
              <p style={{ fontSize: '16px', color: 'var(--muted)', margin: 0, maxWidth: '300px', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
