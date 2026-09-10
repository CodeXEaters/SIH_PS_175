import { useState } from 'react';

export function UncertaintySection() {
  const [showHeatmap, setShowHeatmap] = useState(true);

  return (
    <section id="uncertainty" className="uncertainty-section">
      <div className="animate-on-scroll">
        <p className="kicker">
          SPATIAL CONFIDENCE
        </p>
        <h2 style={{ font: '600 clamp(2.4rem, 4.5vw, 4.8rem)/0.96 var(--font-ui)', letterSpacing: '-2px', margin: 0 }}>
          Not every pixel deserves<br/>
          <i style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-glow)', fontWeight: 500, fontStyle: 'italic' }}>
            equal confidence.
          </i>
        </h2>
        <p style={{ maxWidth: '640px', color: 'var(--stone)', fontSize: '1.05rem', lineHeight: 1.7, margin: '24px 0 0 0' }}>
          Steep cliff faces cast shadow occlusions. Forest canopies obscure bare ground. Bhudarpan maps spatial uncertainty across the entire raster, alerting analysts where predictions are robust and where survey verification is required.
        </p>
      </div>

      <div className="uncertainty-visual-grid animate-on-scroll">
        {/* Interactive Viewport Box */}
        <div style={{
          position: 'relative',
          height: 380,
          background: 'var(--graphite)',
          border: '1px solid var(--smoked-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)'
        }}>
          <img 
            src="/assets/hero-earth-himalaya.png" 
            alt="Terrain Reconstruction"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '60% center' }}
          />

          {/* Uncertainty Heatmap Overlay */}
          {showHeatmap && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(ellipse at 78% 30%, rgba(186, 58, 46, 0.75) 0%, transparent 45%),
                radial-gradient(ellipse at 42% 65%, rgba(196, 146, 56, 0.6) 0%, transparent 40%),
                radial-gradient(ellipse at 50% 50%, rgba(56, 102, 65, 0.35) 0%, transparent 80%)
              `,
              mixBlendMode: 'screen',
              transition: 'opacity 0.3s ease'
            }} />
          )}

          {/* Callout Marker on Ridge Shadow */}
          <div style={{
            position: 'absolute',
            top: '30%',
            right: '22%',
            background: 'rgba(12, 15, 14, 0.9)',
            border: '1px solid var(--uncert-high)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            font: '500 9px var(--font-mono)',
            color: '#ff8a80'
          }}>
            ▲ HIGH RELIEF SHADOW (±14.2m σ)
          </div>

          <div style={{
            position: 'absolute',
            bottom: '35%',
            left: '35%',
            background: 'rgba(12, 15, 14, 0.9)',
            border: '1px solid var(--uncert-low)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            font: '500 9px var(--font-mono)',
            color: '#81c784'
          }}>
            ✓ BARE BEDROCK PLATEAU (±1.8m σ)
          </div>

          {/* Bottom Bar */}
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
            <span>SPATIAL VARIANCE HEATMAP: <b style={{ color: showHeatmap ? 'var(--gold-glow)' : 'var(--ash)' }}>{showHeatmap ? 'ACTIVE' : 'MUTED'}</b></span>
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--gold-glow)',
                cursor: 'pointer',
                font: '500 9px var(--font-mono)'
              }}
            >
              {showHeatmap ? 'Hide Overlay' : 'Reveal Heatmap'}
            </button>
          </div>
        </div>

        {/* Legend and Technical Explanation */}
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 600, margin: '0 0 12px', letterSpacing: '-0.5px' }}>
            Spatial Confidence Legend
          </h3>
          <p style={{ color: 'var(--stone)', fontSize: '0.95rem', lineHeight: 1.65, margin: '0 0 24px' }}>
            Uncertainty is not a single summary percentage. It is a dense, spatial metric calculated from ViT feature variance, local relief gradients, and semantic landcover class.
          </p>

          <div className="uncertainty-legend-bar">
            <div className="legend-chip low">
              <i />
              <div>
                <strong>LOW UNCERTAINTY</strong>
                <small style={{ display: 'block', color: 'var(--ash)', marginTop: 2 }}>Bare bedrock &amp; open terrain (±1–3m)</small>
              </div>
            </div>

            <div className="legend-chip med">
              <i />
              <div>
                <strong>MEDIUM UNCERTAINTY</strong>
                <small style={{ display: 'block', color: 'var(--ash)', marginTop: 2 }}>Canopy margins &amp; rolling slopes (±4–8m)</small>
              </div>
            </div>

            <div className="legend-chip high">
              <i />
              <div>
                <strong>HIGH UNCERTAINTY</strong>
                <small style={{ display: 'block', color: 'var(--ash)', marginTop: 2 }}>Occluded shadows &amp; steep cliffs (&gt;±10m)</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
