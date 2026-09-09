import { useState } from 'react';

export function CalibrationEquation() {
  const [activeMode, setActiveMode] = useState<'metric' | 'relative'>('metric');

  return (
    <section id="calibration" className="calibration-equation-section">
      <div className="animate-on-scroll">
        <p className="kicker">
          SCIENTIFIC CALIBRATION
        </p>
        <h2 style={{ font: '600 clamp(2.4rem, 4.5vw, 4.8rem)/0.96 var(--font-ui)', letterSpacing: '-2px', margin: 0 }}>
          The calibration equation.<br/>
          <i style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-glow)', fontWeight: 500, fontStyle: 'italic' }}>
            Scale without illusion.
          </i>
        </h2>
        <p style={{ maxWidth: '640px', color: 'var(--stone)', fontSize: '1.05rem', lineHeight: 1.7, margin: '24px 0 0 0' }}>
          Monocular models output scale-ambiguous relative disparity. Bhudarpan strictly separates relative disparity from metric physical scale—only claiming absolute meters when verified against reference data.
        </p>

        {/* Mode Selector Pill */}
        <div style={{ display: 'inline-flex', background: 'var(--basalt)', padding: 4, borderRadius: 'var(--radius-sm)', border: '1px solid var(--smoked-border)', marginTop: 24 }}>
          <button
            onClick={() => setActiveMode('metric')}
            style={{
              padding: '8px 20px',
              border: 'none',
              background: activeMode === 'metric' ? 'var(--gold)' : 'transparent',
              color: activeMode === 'metric' ? '#0c0f0e' : 'var(--stone)',
              fontWeight: 700,
              font: '500 10px var(--font-mono)',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            METRIC MODE (GEOREFERENCED)
          </button>
          <button
            onClick={() => setActiveMode('relative')}
            style={{
              padding: '8px 20px',
              border: 'none',
              background: activeMode === 'relative' ? 'var(--gold)' : 'transparent',
              color: activeMode === 'relative' ? '#0c0f0e' : 'var(--stone)',
              fontWeight: 700,
              font: '500 10px var(--font-mono)',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            RELATIVE MODE (RAW OPTICAL)
          </button>
        </div>
      </div>

      {activeMode === 'metric' ? (
        <div className="equation-flow-strip animate-on-scroll">
          <div className="equation-node">
            <small>INPUT 01</small>
            <h3>Relative Depth</h3>
            <p>Dense normalized disparity field (0.00 – 1.00) from ViT foundation inference.</p>
            <div style={{ font: '500 12px var(--font-mono)', color: 'var(--stone)', marginTop: 12 }}>
              D<sub>norm</sub>(x, y)
            </div>
          </div>

          <div className="equation-symbol">+</div>

          <div className="equation-node">
            <small>INPUT 02</small>
            <h3>Ground Reference</h3>
            <p>Sparse reference elevations from SRTM, TanDEM-X, or survey GCPs on bare ground.</p>
            <div style={{ font: '500 12px var(--font-mono)', color: 'var(--stone)', marginTop: 12 }}>
              Z<sub>ref</sub>(x<sub>g</sub>, y<sub>g</sub>)
            </div>
          </div>

          <div className="equation-symbol">→</div>

          <div className="equation-node">
            <small>SOLVER</small>
            <h3>Scale &amp; Offset</h3>
            <p>RANSAC robust regression fitting physical slope gradient (s) and vertical datum bias (b).</p>
            <div style={{ font: '500 12px var(--font-mono)', color: 'var(--gold-glow)', marginTop: 12 }}>
              Z = s · D + b (R²: 0.968)
            </div>
          </div>

          <div className="equation-symbol">→</div>

          <div className="equation-node" style={{ borderColor: 'var(--border-strong)' }}>
            <small style={{ color: 'var(--gold)' }}>OUTPUT</small>
            <h3 style={{ color: 'var(--gold-glow)' }}>Metric Terrain</h3>
            <p>Calibrated DSM with true elevations above sea level, slope angles, and physical profiles.</p>
            <div style={{ font: '500 12px var(--font-mono)', color: 'var(--gold-glow)', marginTop: 12 }}>
              ELEVATION (METERS MSL)
            </div>
          </div>
        </div>
      ) : (
        <div className="equation-flow-strip animate-on-scroll">
          <div className="equation-node" style={{ flex: 1.5, borderColor: 'rgba(239, 83, 80, 0.4)' }}>
            <small style={{ color: '#ef5350' }}>MODE NOTICE</small>
            <h3 style={{ color: '#ef5350' }}>Relative Reconstruction Only</h3>
            <p>
              Standard optical photography lacks embedded geospatial telemetry or ground control points. Elevation is maintained in normalized disparity units.
            </p>
            <p style={{ marginTop: 12, color: 'var(--stone)', fontSize: '12px' }}>
              ✦ Add geospatial reference information to recover metric scale. Absolute elevations and LiDAR benchmark validation are disabled to maintain scientific integrity.
            </p>
          </div>

          <div className="equation-symbol">→</div>

          <div className="equation-node" style={{ flex: 1 }}>
            <small>AVAILABLE CAPABILITIES</small>
            <h3 style={{ color: 'var(--text)' }}>Topographic Exploration</h3>
            <ul style={{ margin: '8px 0 0', paddingLeft: 16, color: 'var(--stone)', fontSize: '12px', lineHeight: 1.8 }}>
              <li>Relative 3D terrain shape</li>
              <li>Interactive flythrough navigation</li>
              <li>Disparity contour intervals</li>
              <li>Relative relief ratio queries</li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
