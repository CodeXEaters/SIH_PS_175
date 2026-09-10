import { useEffect, useState, useRef } from 'react';
import type { Annotation, FlythroughState, ProfileMeasurement, Project, Tool, ViewMode } from '../../types';
import { reconstructionService, PRESET_SCENES, METRIC_PIPELINE_STAGES, RELATIVE_PIPELINE_STAGES } from '../../services/reconstructionService';
import { Inspector } from './Inspector';
import { ToolRail } from './ToolRail';
import { TerrainCanvas } from './TerrainCanvas';
import { ElevationProfile } from './ElevationProfile';
import { ExportModal } from './ExportModal';
import { CalibrationModal } from './CalibrationModal';
import { ValidationPanel } from './ValidationPanel';
import { FlythroughControls } from './FlythroughControls';
import { DemoController, DEMO_STEPS } from './DemoController';

const modes: ViewMode[] = ['TERRAIN', 'RGB', 'DEPTH', 'SEMANTIC', 'ELEVATION', 'UNCERTAINTY', 'SLOPE', 'CONTOURS', 'MESH'];

export function Workspace({ goHome }: { goHome: () => void }) {
  const [project, setProject] = useState<Project>(() => reconstructionService.createProject());
  const [tool, setTool] = useState<Tool>('PROJECT');
  const [view, setView] = useState<ViewMode>('TERRAIN');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Modals & Panels
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  // Judge Demo Mode State
  const [demoActive, setDemoActive] = useState(false);
  const [demoStepIndex, setDemoStepIndex] = useState(0);

  // 3D Flythrough State
  const [flightState, setFlightState] = useState<FlythroughState>({
    active: false,
    mode: 'manual',
    speed: 1,
    altitude: 4832,
    heading: 45,
    pitch: -20
  });

  // Shader & View Settings
  const [sunAzimuth, setSunAzimuth] = useState(315);
  const [sunAltitude, setSunAltitude] = useState(45);
  const [contourInterval, setContourInterval] = useState(25);
  const [splitCompare, setSplitCompare] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50);
  const [activeSemanticClass, setActiveSemanticClass] = useState<string | null>(null);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [resetCameraTrigger, setResetCameraTrigger] = useState(0);
  const [showInspector, setShowInspector] = useState(true);

  const input = useRef<HTMLInputElement>(null);

  const isReady = project.status === 'READY_METRIC' || project.status === 'READY_RELATIVE';
  const running = project.status !== 'EMPTY' && !isReady;

  const startReconstruction = async () => {
    setProject(p => ({ ...p, status: 'INSPECTING' }));
    setProgress(0);
    await reconstructionService.startProject(project, (status, p, updatedProject) => {
      setProject(updatedProject);
      setProgress(p);
    });
  };

  const handleSelectPreset = (presetId: string) => {
    const newProj = reconstructionService.createProject(undefined, presetId);
    setProject(newProj);
    setProgress(0);
  };

  const handleFileUpload = (file?: File) => {
    if (!file) return;
    const newProj = reconstructionService.createProject(file);
    setProject(newProj);
    setUploading(false);
    setTool('PROJECT');
    setProgress(0);
  };

  const handleAddAnnotation = (a: Annotation) => {
    setProject(p => ({ ...p, annotations: [...p.annotations, a] }));
  };

  const handleDeleteAnnotation = (id: string) => {
    setProject(p => ({ ...p, annotations: p.annotations.filter(a => a.id !== id) }));
  };

  // Cross-section measurement with mutual exclusion against flythrough
  const handleUpdateMeasurement = (m: ProfileMeasurement) => {
    setProject(p => ({ ...p, measurement: m }));
    setFlightState(f => ({ ...f, active: false }));
    setShowProfileDrawer(true);
  };

  const handleToggleFlythrough = () => {
    setFlightState(f => {
      const nextActive = !f.active;
      if (nextActive) {
        setShowProfileDrawer(false);
      }
      return { ...f, active: nextActive };
    });
  };

  // Synchronize Demo Step changes
  const handleSelectDemoStep = (stepIdx: number) => {
    setDemoStepIndex(stepIdx);
    const step = DEMO_STEPS[stepIdx];
    if (step) {
      setView(step.viewMode);
      if (step.tool) setTool(step.tool);
      if (step.triggerFlythrough) {
        setShowProfileDrawer(false);
        setFlightState(f => ({ ...f, active: true, mode: 'guided' }));
      }
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') return;
      switch (e.key.toLowerCase()) {
        case 'm': setTool('MEASURE'); break;
        case 'a': setTool('ANNOTATE'); break;
        case 'l': setTool('LOCATION'); break;
        case 'p': setTool('PROJECT'); break;
        case 'c': setSplitCompare(v => !v); break;
        case 'w': setWireframeMode(v => !v); break;
        case 'i': setShowInspector(v => !v); break;
        case 'f': handleToggleFlythrough(); break;
        case 'escape': 
          setUploading(false); 
          setShowExportModal(false);
          setShowCalibrationModal(false);
          setShowValidationModal(false);
          setShowProfileDrawer(false);
          setFlightState(f => ({ ...f, active: false }));
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeStages = project.reconstructionMode === 'metric' ? METRIC_PIPELINE_STAGES : RELATIVE_PIPELINE_STAGES;
  const currentStageDetail = activeStages.find(s => s.key === project.status)?.detail || 'Synthesizing 3D topography';

  return (
    <main className={`workspace ${!showInspector ? 'inspector-collapsed' : ''}`}>
      {/* 1. Grid Row 1 (Cols 1 to -1): Top Navigation Header */}
      <header className="workspace-head animate-fade-down" role="banner">
        <div className="head-brand">
          <button className="wordmark" onClick={goHome} aria-label="Bhudarpan Home">
            <b>B</b> BHUDARPAN
          </button>
          <span className="version-tag">PRO · v2.4</span>
        </div>

        {/* Preset Scene Selector */}
        <div className="preset-selector-group">
          <small>SCENE PRESET</small>
          <select 
            value={project.source.presetId || 'custom'} 
            onChange={e => handleSelectPreset(e.target.value)}
            className="preset-select"
            aria-label="Scene preset selection"
          >
            {PRESET_SCENES.map(scene => (
              <option key={scene.id} value={scene.id}>
                {scene.name} ({scene.type === 'GEOTIFF' ? 'METRIC' : 'RELATIVE'})
              </option>
            ))}
          </select>
        </div>

        {/* System Pipeline Status */}
        <div className="run-status" aria-live="polite">
          <i className={running ? 'pulse' : isReady ? 'ready' : ''} aria-hidden="true" />
          <span>
            {running 
              ? `PROCESSING · ${progress}%` 
              : isReady 
                ? (project.reconstructionMode === 'metric' ? 'METRIC TERRAIN READY' : 'RELATIVE TERRAIN READY') 
                : 'STANDBY · READY TO PROCESS'}
          </span>
        </div>

        {/* Header Right Actions */}
        <div className="head-actions">
          <button
            onClick={() => {
              setDemoActive(!demoActive);
              if (!demoActive) handleSelectDemoStep(0);
            }}
            className={demoActive ? 'active-demo' : ''}
            aria-label="Toggle guided demonstration"
          >
            {demoActive ? '■ Exit Demo' : '✦ Guided Demo'}
          </button>
          <button onClick={() => { handleSelectPreset('himalayas'); setProgress(0); }}>
            Reset View
          </button>
          <button onClick={() => setUploading(true)}>
            Ingest File
          </button>
          <button 
            className={`inspector-toggle-btn ${showInspector ? 'active' : ''}`}
            onClick={() => setShowInspector(!showInspector)}
            title="Toggle Inspector Visibility"
            aria-label="Toggle Inspector"
          >
            ◫ Inspector
          </button>
          <button className="primary-btn" onClick={() => setShowExportModal(true)}>
            Export ↗
          </button>
        </div>
      </header>

      {/* 2. Grid Row 2, Col 1: Left Tool Rail */}
      <ToolRail
        tool={tool}
        setTool={setTool}
        setUploading={setUploading}
        onOpenExport={() => setShowExportModal(true)}
        onOpenValidation={() => setShowValidationModal(true)}
      />

      {/* 3. Grid Row 2, Col 2: Main Terrain Canvas (Bounded Coordinate System) */}
      <section className="observation" aria-label="3D Terrain Observation Viewport">
        {/* Top Viewport Layer Switcher & Utility Controls Header */}
        <div className="viewport-head animate-fade-down">
          <div className="view-switch" role="tablist" aria-label="Terrain layer modes">
            {modes.map(m => {
              if (project.reconstructionMode === 'relative' && (m === 'SLOPE' || m === 'UNCERTAINTY')) return null;
              return (
                <button 
                  className={view === m ? 'selected' : ''} 
                  onClick={() => setView(m)} 
                  key={m}
                  role="tab"
                  aria-selected={view === m}
                >
                  {m}
                </button>
              );
            })}
          </div>

          <div className="viewport-meta">
            <button
              className={`compare-toggle-btn ${wireframeMode ? 'active' : ''}`}
              onClick={() => setWireframeMode(!wireframeMode)}
              title="Toggle 3D Triangulated Mesh Wireframe"
            >
              # WIREFRAME {wireframeMode ? 'ON' : 'OFF'}
            </button>
            <button 
              className={`compare-toggle-btn ${splitCompare ? 'active' : ''}`}
              onClick={() => setSplitCompare(!splitCompare)}
              aria-label="Toggle split-screen lens comparison"
            >
              ◐ SPLIT LENS {splitCompare ? 'ON' : 'OFF'}
            </button>
            <button
              className="compare-toggle-btn"
              onClick={() => setResetCameraTrigger(t => t + 1)}
              title="Reset Orbit Camera"
            >
              ↺ RESET
            </button>
            <span className="meta-crs-badge">
              {project.reconstructionMode === 'metric' 
                ? `EPSG:32645 · GSD ${project.location.gsd || 0.5}m` 
                : 'RELATIVE DISPARITY · UNCALIBRATED'}
            </span>
          </div>
        </div>

        {/* Interactive Three.js Terrain Canvas */}
        <TerrainCanvas
          project={project}
          view={view}
          tool={tool}
          sunAzimuth={sunAzimuth}
          sunAltitude={sunAltitude}
          contourInterval={contourInterval}
          splitCompare={splitCompare}
          splitPosition={splitPosition}
          setSplitPosition={setSplitPosition}
          activeSemanticClass={activeSemanticClass}
          flightState={flightState}
          setFlightState={setFlightState}
          onUpdateMeasurement={handleUpdateMeasurement}
          onAddAnnotation={handleAddAnnotation}
          wireframeMode={wireframeMode}
          resetCameraTrigger={resetCameraTrigger}
          isProfileOpen={Boolean(project.measurement && showProfileDrawer)}
        />

        {/* In-Canvas Processing Progress Overlay */}
        {running && (
          <div className="processing animate-fade-in" role="status">
            <p>RECONSTRUCTION PIPELINE RUNNING</p>
            <b>{progress}%</b>
            <span><i style={{ width: `${progress}%` }} /></span>
            <small>{currentStageDetail}</small>
          </div>
        )}

        {/* Bottom Scale & Orientation Overlay */}
        <div className="scale-overlay" aria-hidden="true">
          <div className="compass-rose">N</div>
          <span>0 <i /> {project.reconstructionMode === 'metric' ? '500 M' : '100 UNITS'}</span>
        </div>

        {/* Flythrough Dedicated HUD (Zone: top 76px, below canvas controls) */}
        {flightState.active && (
          <FlythroughControls
            flight={flightState}
            setFlight={setFlightState}
            mode={project.reconstructionMode}
            onExit={() => setFlightState(f => ({ ...f, active: false }))}
            onReset={() => setFlightState(f => ({ ...f, altitude: 4832, heading: 45 }))}
            onToggleGuided={() => setFlightState(f => ({ ...f, mode: f.mode === 'guided' ? 'manual' : 'guided' }))}
          />
        )}

        {/* Elevation Cross-Section Drawer (Zone: bottom 74px, above action toolbar) */}
        {project.measurement && showProfileDrawer && (
          <ElevationProfile 
            measurement={project.measurement} 
            mode={project.reconstructionMode} 
            onClose={() => setShowProfileDrawer(false)} 
          />
        )}

        {/* Judge Demo Controller Overlay */}
        {demoActive && (
          <DemoController
            currentStepIndex={demoStepIndex}
            onSelectStep={handleSelectDemoStep}
            onClose={() => setDemoActive(false)}
            onToggleFlythrough={handleToggleFlythrough}
          />
        )}

        {/* Bottom Floating Action Toolbar (Zone: bottom 16px, centered in canvas) */}
        <div className="viewport-actions animate-fade-up" role="toolbar" aria-label="Workspace primary actions">
          <button 
            className="start-reconstruct-btn"
            onClick={startReconstruction} 
            disabled={running}
          >
            {running ? 'Processing…' : isReady ? 'Explore Terrain' : 'Start Reconstruction'}
          </button>

          <button
            className={flightState.active ? 'active' : ''}
            onClick={handleToggleFlythrough}
          >
            {flightState.active ? '■ Exit Flythrough' : '3D Flythrough'}
          </button>

          <button 
            className={tool === 'MEASURE' ? 'active' : ''} 
            onClick={() => {
              setTool(t => t === 'MEASURE' ? 'PROJECT' : 'MEASURE');
              if (project.measurement) {
                setFlightState(f => ({ ...f, active: false }));
                setShowProfileDrawer(true);
              }
            }}
          >
            Measure Cross-Section
          </button>

          <button className={tool === 'ANNOTATE' ? 'active' : ''} onClick={() => setTool('ANNOTATE')}>
            Add Survey Marker
          </button>

          {project.reconstructionMode === 'metric' && (
            <>
              <button onClick={() => setShowCalibrationModal(true)}>
                DEM Calibration
              </button>
              <button onClick={() => setShowValidationModal(true)}>
                Benchmark Accuracy
              </button>
            </>
          )}
        </div>
      </section>

      {/* 4. Grid Row 2, Col 3: Right Inspector Panel */}
      <Inspector 
        project={project} 
        tool={tool} 
        view={view}
        sunAzimuth={sunAzimuth}
        setSunAzimuth={setSunAzimuth}
        sunAltitude={sunAltitude}
        setSunAltitude={setSunAltitude}
        contourInterval={contourInterval}
        setContourInterval={setContourInterval}
        activeSemanticClass={activeSemanticClass}
        setActiveSemanticClass={setActiveSemanticClass}
        onOpenCalibration={() => setShowCalibrationModal(true)}
        onOpenValidation={() => setShowValidationModal(true)}
        onDeleteAnnotation={handleDeleteAnnotation}
      />

      {/* 5. Grid Row 3 (Cols 1 to -1): Bottom Status Bar */}
      <footer className="statusbar animate-fade-up" role="contentinfo">
        {project.reconstructionMode === 'metric' ? (
          <>
            <span>LAT: 27.9881° N</span>
            <span>LON: 86.9250° E</span>
            <span>ELEV: 4,832 m</span>
            <span>GSD: 0.5 m/px</span>
            <span>CRS: EPSG:32645</span>
            <span>DATUM: EGM96 Orthometric</span>
          </>
        ) : (
          <span>GEOREFERENCE NOT ATTACHED · RELATIVE DISPARITY ONLY</span>
        )}
        <b>
          ● {isReady 
              ? (project.reconstructionMode === 'metric' ? 'READY · METRIC' : 'READY · RELATIVE') 
              : running 
                ? 'PROCESSING' 
                : 'READY'}
        </b>
      </footer>

      {/* 6. Root-Level Dialogs (Fixed Portaled Overlays with High Z-Index) */}
      {uploading && (
        <div className="upload-sheet animate-fade-in" onClick={() => setUploading(false)}>
          <div className="upload-box" onClick={e => e.stopPropagation()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFileUpload(e.dataTransfer.files[0]); }}>
            <input ref={input} type="file" accept="image/*,.tif,.tiff" onChange={e => handleFileUpload(e.target.files?.[0])} style={{ display: 'none' }} />
            <div className="upload-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h2 style={{ fontSize: '20px', margin: '8px 0', color: 'var(--text-primary)' }}>Ingest Earth Observation Imagery</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 16px' }}>
              Drag and drop a GeoTIFF, orthophoto, or standard RGB aerial photograph.
            </p>
            
            <div className="upload-branch-hint">
              <div className="branch-col">
                <strong>GeoTIFF with CRS</strong>
                <small>→ Metric reconstruction + calibration</small>
              </div>
              <div className="branch-col">
                <strong>Standard optical image</strong>
                <small>→ Relative reconstruction + interactive topography</small>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
              <button className="export-row-btn" onClick={() => input.current?.click()}>
                SELECT LOCAL FILE
              </button>
              <button className="close-btn" style={{ width: 'auto', padding: '0 16px', height: 36 }} onClick={() => setUploading(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <ExportModal project={project} onClose={() => setShowExportModal(false)} />
      )}

      {showCalibrationModal && (
        <CalibrationModal project={project} onClose={() => setShowCalibrationModal(false)} />
      )}

      {showValidationModal && (
        <ValidationPanel project={project} onClose={() => setShowValidationModal(false)} />
      )}
    </main>
  );
}
