import type { ProfileMeasurement, ReconstructionMode } from '../../types';

interface ElevationProfileProps {
  measurement: ProfileMeasurement;
  mode: ReconstructionMode;
  onClose: () => void;
}

export function ElevationProfile({ measurement, mode, onClose }: ElevationProfileProps) {
  const isMetric = mode === 'metric';
  const unit = isMetric ? 'm' : 'units';
  const samples = measurement.profileSamples;
  const count = samples.length;

  const minZ = measurement.minElevation;
  const maxZ = measurement.maxElevation;
  const rangeZ = Math.max(1, maxZ - minZ);

  const svgWidth = 460;
  const svgHeight = 90;
  const paddingX = 36;
  const paddingY = 16;

  // Build SVG path points
  const points = samples.map((z, idx) => {
    const x = paddingX + (idx / (count - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - ((z - minZ) / rangeZ) * (svgHeight - paddingY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polylineStr = points.join(' ');
  const areaStr = `${paddingX},${svgHeight - paddingY} ` + polylineStr + ` ${svgWidth - paddingX},${svgHeight - paddingY}`;

  return (
    <div className="elevation-profile-drawer animate-fade-up" role="region" aria-label="Elevation cross section drawer">
      <div className="profile-header">
        <div className="profile-title">
          <small>⌁ TOPOGRAPHIC CROSS-SECTION</small>
          <strong>A ({measurement.pointA.x}%, {measurement.pointA.y}%) ➔ B ({measurement.pointB.x}%, {measurement.pointB.y}%)</strong>
        </div>

        <button className="close-btn" onClick={onClose} aria-label="Close Profile">
          ✕
        </button>
      </div>

      <div className="profile-metrics-strip">
        <div>
          <small>SURFACE DISTANCE</small>
          <b>{measurement.distanceMeters} <span className="unit">{unit}</span></b>
        </div>
        <div>
          <small>ELEVATION Δ</small>
          <b>+{measurement.elevationDelta} <span className="unit">{unit}</span></b>
        </div>
        <div>
          <small>SLOPE ANGLE</small>
          <b>{measurement.slopeDegrees}°</b>
        </div>
        <div>
          <small>ELEV RANGE</small>
          <b>{minZ}–{maxZ} <span className="unit">{unit}</span></b>
        </div>
      </div>

      <div className="profile-chart-container">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" className="profile-svg">
          <defs>
            <linearGradient id="profileGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#58C6D4" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#58C6D4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="rgba(180,200,210,0.06)" strokeDasharray="2 3" />
          <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="rgba(88,198,212,0.2)" />

          {/* Profile Area & Line */}
          <polygon points={areaStr} fill="url(#profileGrad)" />
          <polyline points={polylineStr} fill="none" stroke="#58C6D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Min & Max Labels */}
          <text x={paddingX} y={svgHeight - 4} fill="#7F9099" fontSize="8" fontFamily="IBM Plex Mono">A ({minZ}{unit})</text>
          <text x={svgWidth - paddingX} y={svgHeight - 4} fill="#7F9099" fontSize="8" fontFamily="IBM Plex Mono" textAnchor="end">B ({maxZ}{unit})</text>
        </svg>
      </div>
    </div>
  );
}
