import { useState } from 'react';

export function SemanticGroundMoment() {
  const [activeClass, setActiveClass] = useState<'all' | 'ground' | 'canopy' | 'water' | 'structures'>('ground');
  const [showAnchors, setShowAnchors] = useState(true);

  const classes = [
    {
      id: 'ground',
      name: 'GROUND & BEDROCK',
      coverage: '64.2%',
      color: '#B58A4A',
      desc: 'Bare earth, rock faces, and ridgelines. Selected as calibration control surfaces.',
      anchorCount: '2,410 GCPs'
    },
    {
      id: 'canopy',
      name: 'VEGETATION & FOREST',
      coverage: '18.5%',
      color: '#386641',
      desc: 'Canopy height offset filtered to prevent elevation distortion over tree crowns.',
      anchorCount: 'Filtered'
    },
    {
      id: 'water',
      name: 'WATER & DRAINAGE',
      coverage: '13.2%',
      color: '#2A6F97',
      desc: 'Glacial lakes and rivers enforced to monotonic downstream gradients.',
      anchorCount: 'Hydro-Enforced'
    },
    {
      id: 'structures',
      name: 'BUILT INFRASTRUCTURE',
      coverage: '4.1%',
      color: '#BC4749',
      desc: 'Roads, tunnels, and structures isolated from bare earth terrain interpolation.',
      anchorCount: 'Isolated'
    }
  ];

  return (
    <section id="semantic-ground" className="semantic-ground-section">
      <div className="animate-on-scroll">
        <p className="kicker">
          THE CORE DIFFERENTIATOR
        </p>
        <h2 style={{ font: '600 clamp(2.4rem, 4.5vw, 4.8rem)/0.96 var(--font-ui)', letterSpacing: '-2px', margin: 0 }}>
          Semantic ground isolation.<br/>
          <i style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-glow)', fontWeight: 500, fontStyle: 'italic' }}>
            Where calibration begins.
          </i>
        </h2>
        <p style={{ maxWidth: '640px', color: 'var(--stone)', fontSize: '1.05rem', lineHeight: 1.7, margin: '24px 0 0 0' }}>
          Generic depth estimation fits pixels blindly. Bhudarpan separates bare ground from tree canopies and built structures before computing scale, eliminating severe vertical offsets.
        </p>
      </div>

      <div className="semantic-interactive-grid animate-on-scroll">
        {/* Viewport Simulation Box */}
        <div className="semantic-viewport-box">
          <img src="/assets/hero-earth-himalaya.png" alt="Semantic Landcover Scene" style={{ objectPosition: '65% center' }} />

          {/* Semantic Class Highlight Tint */}
          <div 
            className="semantic-mask-overlay"
            style={{
              background: 
                activeClass === 'ground' ? 'radial-gradient(ellipse at 60% 60%, rgba(181, 138, 74, 0.45) 0%, transparent 70%)' :
                activeClass === 'canopy' ? 'radial-gradient(ellipse at 35% 40%, rgba(56, 102, 65, 0.6) 0%, transparent 60%)' :
                activeClass === 'water' ? 'radial-gradient(ellipse at 80% 80%, rgba(42, 111, 151, 0.6) 0%, transparent 50%)' :
                activeClass === 'structures' ? 'radial-gradient(circle at 45% 70%, rgba(188, 71, 73, 0.65) 0%, transparent 35%)' :
                'transparent'
            }}
          />

          {/* Reference Ground Control Points Overlay */}
          {showAnchors && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {[
                { x: '35%', y: '58%', label: 'GCP #104' },
                { x: '52%', y: '68%', label: 'GCP #219' },
                { x: '68%', y: '45%', label: 'GCP #312' },
                { x: '78%', y: '34%', label: 'GCP #405' },
              ].map((pt, idx) => (
                <div key={idx} style={{
                  position: 'absolute',
                  left: pt.x,
                  top: pt.y,
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--gold-glow)',
                    boxShadow: '0 0 10px var(--gold-glow)'
                  }} />
                  <span style={{
                    font: '500 8px var(--font-mono)',
                    color: 'var(--text)',
                    background: 'rgba(7, 10, 9, 0.85)',
                    padding: '2px 6px',
                    borderRadius: 2,
                    border: '1px solid rgba(181, 138, 74, 0.4)'
                  }}>
                    {pt.label} (BARE EARTH)
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Status bar inside viewport */}
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(7, 10, 9, 0.85)',
            border: '1px solid var(--smoked-border)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            font: '500 9px var(--font-mono)',
            color: 'var(--stone)'
          }}>
            <span>ACTIVE FILTER: <b style={{ color: 'var(--gold-glow)' }}>{activeClass.toUpperCase()}</b></span>
            <button
              onClick={() => setShowAnchors(!showAnchors)}
              style={{
                background: 'transparent',
                border: 'none',
                color: showAnchors ? 'var(--gold-glow)' : 'var(--stone)',
                cursor: 'pointer',
                font: '500 9px var(--font-mono)'
              }}
            >
              {showAnchors ? '● GCP ANCHORS VISIBLE' : '○ SHOW ANCHORS'}
            </button>
          </div>
        </div>

        {/* Semantic Category Selectors */}
        <div className="semantic-legend-strip">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ font: '500 9px var(--font-mono)', color: 'var(--ash)', letterSpacing: 1.5 }}>
              SELECT LANDCOVER LAYER TO INSPECT
            </span>
            <button
              onClick={() => setActiveClass('all')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--gold-glow)',
                font: '500 9px var(--font-mono)',
                cursor: 'pointer'
              }}
            >
              Reset View
            </button>
          </div>

          {classes.map((cls) => (
            <div
              key={cls.id}
              className={`semantic-class-card ${activeClass === cls.id ? 'active' : ''}`}
              onClick={() => setActiveClass(cls.id as any)}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="badge" style={{ background: cls.color }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '13px', fontWeight: 600 }}>{cls.name}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--stone)', maxWidth: '280px', lineHeight: 1.4 }}>
                    {cls.desc}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <b style={{ display: 'block', font: '500 14px var(--font-mono)', color: 'var(--gold-glow)' }}>
                  {cls.coverage}
                </b>
                <small style={{ font: '500 8px var(--font-mono)', color: 'var(--stone)' }}>
                  {cls.anchorCount}
                </small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
