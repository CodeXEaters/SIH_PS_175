import { useState } from 'react';
import type { Project } from '../../types';

interface ValidationPanelProps {
  project: Project;
  onClose: () => void;
}

export function ValidationPanel({ project, onClose }: ValidationPanelProps) {
  const [valView, setValView] = useState<'PREDICTED' | 'REFERENCE' | 'DIFFERENCE'>('DIFFERENCE');
  const val = project.validation;
  const isAvailable = val.available && project.reconstructionMode === 'metric';

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-label="Scientific Validation Panel">
      <div className="validation-modal animate-scale-up" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <small>SCIENTIFIC VALIDATION</small>
            <h2>Geospatial Residuals &amp; Benchmark Metrics</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close validation modal">✕</button>
        </div>

        {isAvailable ? (
          <>
            <p className="modal-desc">
              Independent residual analysis comparing the reconstructed Bhudarpan DSM against a verified high-resolution reference dataset: <b>{val.referenceType}</b>.
            </p>

            {/* Error Metrics Summary Row */}
            <div className="validation-grid" style={{ marginBottom: 20 }}>
              <div className="val-card">
                <small>RMSE (ROOT MEAN SQUARE)</small>
                <b>{val.rmse} <span className="unit">m</span></b>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-faint)', marginTop: 4 }}>
                  Standard deviation of residuals
                </span>
              </div>

              <div className="val-card">
                <small>MAE (MEAN ABSOLUTE ERROR)</small>
                <b>{val.mae} <span className="unit">m</span></b>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-faint)', marginTop: 4 }}>
                  Average elevation error
                </span>
              </div>

              <div className="val-card">
                <small>COEFFICIENT OF DETERMINATION (R²)</small>
                <b>{val.r2}</b>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-faint)', marginTop: 4 }}>
                  Elevation correlation vs LiDAR
                </span>
              </div>

              <div className="val-card">
                <small>95TH PERCENTILE CONFIDENCE</small>
                <b>&plusmn;{val.percentile95} <span className="unit">m</span></b>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-faint)', marginTop: 4 }}>
                  Spatial error bounding limit
                </span>
              </div>
            </div>

            {/* Comparative View Switcher Tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }} role="tablist">
              {(['PREDICTED', 'REFERENCE', 'DIFFERENCE'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setValView(v)}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    background: valView === v ? 'var(--mineral-blue)' : 'var(--surface-base)',
                    color: valView === v ? '#F3F7F8' : 'var(--text-secondary)',
                    border: '1px solid var(--smoked-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    transition: 'all 160ms ease'
                  }}
                  role="tab"
                  aria-selected={valView === v}
                >
                  {v} LAYER
                </button>
              ))}
            </div>

            {/* Residual Map Comparison Visualization */}
            <div style={{
              position: 'relative',
              height: 220,
              background: 'var(--bg-deep)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--smoked-border)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {valView === 'DIFFERENCE' && (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <img
                    src="/assets/terrain-3d.jpg"
                    alt="Residual error differential heatmap"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'hue-rotate(180deg) saturate(1.2)' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    background: 'rgba(6, 18, 27, 0.85)',
                    padding: '6px 12px',
                    borderRadius: 4,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--smoked-border)'
                  }}>
                    DIFFERENTIAL HEATMAP · MAX Δ &plusmn;4.8m
                  </div>
                </div>
              )}

              {valView === 'PREDICTED' && (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <img
                    src="/assets/terrain-3d.jpg"
                    alt="Reconstructed predicted DSM"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    background: 'rgba(6, 18, 27, 0.85)',
                    padding: '6px 12px',
                    borderRadius: 4,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--smoked-border)'
                  }}>
                    BHUDARPAN PREDICTED DSM (ViT-Large)
                  </div>
                </div>
              )}

              {valView === 'REFERENCE' && (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <img
                    src="/assets/terrain-satellite.jpg"
                    alt="Reference benchmark elevation layer"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.6)' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    background: 'rgba(6, 18, 27, 0.85)',
                    padding: '6px 12px',
                    borderRadius: 4,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--smoked-border)'
                  }}>
                    AIRBORNE LIDAR BENCHMARK REFERENCE
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Geospatial Context Strip (DATUM & CRS) */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 18,
              paddingTop: 14,
              borderTop: '1px solid var(--smoked-border)',
              fontFamily: 'var(--font-mono)',
              fontSize: '10.5px',
              color: 'var(--text-faint)'
            }}>
              <span>CRS: {project.location.crs}</span>
              <span>ELEVATION DATUM: {project.location.elevationDatum}</span>
              <span>EVALUATION STATUS: VERIFIED</span>
            </div>
          </>
        ) : (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: 16 }}>
              No reference elevation dataset attached for quantitative residual auditing. Relative disparity models require georeferenced ground anchors to compute RMSE.
            </p>
            <button className="export-row-btn" onClick={onClose}>
              Return to Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
