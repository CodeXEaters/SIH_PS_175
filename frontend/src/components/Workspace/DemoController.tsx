import type { DemoStep, ViewMode, Tool } from '../../types';

export const DEMO_STEPS: DemoStep[] = [
  {
    id: 1,
    title: '1 / 12 · Scene Overview',
    subtitle: 'High-Relief Alpine Himalayan Ridge',
    description: 'Welcome to the Bhudarpan guided evaluation. This scene captures a 12.5 km² high-relief alpine pass in the Himalayas (27.98° N, 86.92° E) with extreme elevation variance.',
    viewMode: 'RGB',
    tool: 'PROJECT'
  },
  {
    id: 2,
    title: '2 / 12 · Optical RGB Input',
    subtitle: 'High-Resolution Satellite Pass',
    description: 'The foundation input is an uncalibrated optical RGB pass. Monocular photographs alone lack metric height information and physical scale.',
    viewMode: 'RGB',
    tool: 'LAYERS'
  },
  {
    id: 3,
    title: '3 / 12 · Depth Inference',
    subtitle: 'ViT Monocular Relative Disparity',
    description: 'Depth Anything ViT-Large infers relative disparity across every pixel. Notice relative ridgelines and valley depths are resolved, but vertical units are dimensionless.',
    viewMode: 'DEPTH',
    tool: 'LAYERS'
  },
  {
    id: 4,
    title: '4 / 12 · Semantic Ground Isolation',
    subtitle: 'Bare Earth vs Canopy & Infrastructure',
    description: 'Bhudarpan separates bare ground (64.2%) from non-ground occlusions (tree canopy 18.5%, glacial water 13.2%). Only bare ground pixels are fed into elevation calibration.',
    viewMode: 'SEMANTIC',
    tool: 'LAYERS'
  },
  {
    id: 5,
    title: '5 / 12 · Geospatial Anchoring',
    subtitle: '2,410 Bare-Earth Reference Points',
    description: 'Identified bare-ground pixels are matched against sparse reference points (SRTM GL1 30m) to prepare linear regression equations.',
    viewMode: 'SEMANTIC',
    tool: 'LOCATION'
  },
  {
    id: 6,
    title: '6 / 12 · Calibration Solver',
    subtitle: 'RANSAC Linear Fit (Scale & Offset)',
    description: 'The solver calculates scale factor (1.042) and vertical offset (14.8m) with R² = 0.968, converting relative disparity into true physical elevations above sea level.',
    viewMode: 'ELEVATION',
    tool: 'LAYERS'
  },
  {
    id: 7,
    title: '7 / 12 · Spatial Uncertainty Map',
    subtitle: 'Per-Pixel Confidence Variance',
    description: 'Not every pixel deserves equal confidence. Bhudarpan maps 95% spatial confidence bounds. Steep shadowed escarpments exhibit wider variance than bare plateaus.',
    viewMode: 'UNCERTAINTY',
    tool: 'LAYERS'
  },
  {
    id: 8,
    title: '8 / 12 · Calibrated Metric DSM',
    subtitle: '32-bit Floating Point Elevation Raster',
    description: 'The resulting Digital Surface Model provides continuous absolute elevations from 3,820m in the basal gorge to 5,460m at the glaciated peak (1,640m total relief).',
    viewMode: 'ELEVATION',
    tool: 'LAYERS'
  },
  {
    id: 9,
    title: '9 / 12 · 3D Topography & Contours',
    subtitle: 'Solar Hillshading & Triangulated Mesh',
    description: 'Inspect the synthesized 3D surface with directional sun illumination (315° Azimuth, 45° Altitude) and 25m topographic contour intervals.',
    viewMode: 'TERRAIN',
    tool: 'LAYERS'
  },
  {
    id: 10,
    title: '10 / 12 · Cross-Section Profile',
    subtitle: 'Interactive Terrain Measurement',
    description: 'Surveyors can measure point elevations, distances, and slice longitudinal cross-sections to evaluate slope steepness (28.4°) and vertical elevation profiles.',
    viewMode: 'TERRAIN',
    tool: 'MEASURE'
  },
  {
    id: 11,
    title: '11 / 12 · Benchmark Validation',
    subtitle: 'Evaluated vs Airborne LiDAR (1m)',
    description: 'Bhudarpan provides honest scientific metrics evaluated against independent airborne LiDAR: RMSE = 3.42m, MAE = 2.65m, R² = 0.941, and 95th percentile error = ±7.2m.',
    viewMode: 'TERRAIN',
    tool: 'VALIDATE'
  },
  {
    id: 12,
    title: '12 / 12 · 3D Terrain Flythrough & Export',
    subtitle: 'Navigable Synthesis & Open Geospatial Deliverables',
    description: 'Engage 3D flythrough to pilot an aerial drone perspective through the reconstructed alpine ridge, or export GeoTIFF DSM rasters, Wavefront OBJ meshes, and GeoJSON markers.',
    viewMode: 'TERRAIN',
    tool: 'EXPORT',
    triggerFlythrough: true
  }
];

interface DemoControllerProps {
  currentStepIndex: number;
  onSelectStep: (stepIndex: number) => void;
  onClose: () => void;
  onToggleFlythrough: () => void;
}

export function DemoController({
  currentStepIndex,
  onSelectStep,
  onClose,
  onToggleFlythrough
}: DemoControllerProps) {
  const step = DEMO_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < DEMO_STEPS.length - 1) {
      onSelectStep(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      onSelectStep(currentStepIndex - 1);
    }
  };

  return (
    <aside className="demo-controller-strip animate-fade-down">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="demo-badge">DEMO DATA · JUDGE WALKTHROUGH</span>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--ash)', cursor: 'pointer', fontSize: 14 }}
        >
          ✕
        </button>
      </div>

      <h4>{step.title}</h4>
      <small style={{ font: '600 10px var(--font-mono)', color: 'var(--terrain-cyan)', display: 'block', marginBottom: 8 }}>
        {step.subtitle}
      </small>
      <p>{step.description}</p>

      <div className="demo-controls-row">
        <div style={{ font: '500 9px var(--font-mono)', color: 'var(--ash)' }}>
          STEP {step.id} OF 12
        </div>

        <div className="demo-btn-group">
          {step.triggerFlythrough && (
            <button
              className="primary"
              onClick={onToggleFlythrough}
              style={{ marginRight: 6 }}
            >
              ◬ Launch Flythrough
            </button>
          )}

          <button onClick={handlePrev} disabled={currentStepIndex === 0}>
            ◀ Prev
          </button>
          <button
            className="primary"
            onClick={handleNext}
            disabled={currentStepIndex === DEMO_STEPS.length - 1}
          >
            {currentStepIndex === DEMO_STEPS.length - 1 ? 'Finish' : 'Next ▶'}
          </button>
        </div>
      </div>
    </aside>
  );
}
