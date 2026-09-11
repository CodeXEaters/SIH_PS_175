import { useState } from "react";
import type { Project, Tool, ViewMode } from "../../types";

interface InspectorProps {
  project: Project;
  tool: Tool;
  view: ViewMode;
  sunAzimuth: number;
  setSunAzimuth: (v: number) => void;
  sunAltitude: number;
  setSunAltitude: (v: number) => void;
  contourInterval: number;
  setContourInterval: (v: number) => void;
  activeSemanticClass: string | null;
  setActiveSemanticClass: (c: string | null) => void;
  onOpenCalibration: () => void;
  onOpenValidation: () => void;
  onDeleteAnnotation: (id: string) => void;
}

export function Inspector({
  project,
  tool,
  view,
  sunAzimuth,
  setSunAzimuth,
  sunAltitude,
  setSunAltitude,
  contourInterval,
  setContourInterval,
  activeSemanticClass,
  setActiveSemanticClass,
  onOpenCalibration,
  onOpenValidation,
  onDeleteAnnotation,
}: InspectorProps) {
  const [activeTab, setActiveTab] = useState<
    "OVERVIEW" | "ANALYSIS" | "METADATA"
  >("OVERVIEW");
  const [terrainExaggeration, setTerrainExaggeration] = useState(1.0);
  const [baseLayer, setBaseLayer] = useState("satellite");
  const [overlayLayer, setOverlayLayer] = useState("mesh");
  const [colorMap, setColorMap] = useState("elevation");

  const isMetric = project.reconstructionMode === "metric";
  const hasValidation = isMetric && project.validation.available;
  const sem = project.semanticStats;

  return (
    <aside
      className="inspector animate-slide-left"
      aria-label="Contextual Project Inspector"
    >
      {/* 1. Header with Scientific Hierarchy */}
      <div className="inspector-head">
        <p className="panel-title">PROJECT INSPECTOR</p>
        <h2>{project.name.toUpperCase()}</h2>

        {/* Tab switchers if on Project tool */}
        {tool === "PROJECT" && (
          <div
            style={{ display: "flex", gap: 4, marginTop: 12 }}
            role="tablist"
          >
            {(["OVERVIEW", "ANALYSIS", "METADATA"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  background:
                    activeTab === tab ? "var(--mineral-blue)" : "transparent",
                  color: activeTab === tab ? "#F3F7F8" : "var(--text-muted)",
                  border: "none",
                  borderRadius: 4,
                  fontFamily: "var(--font-mono)",
                  fontSize: "9.5px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                  transition: "all 160ms ease",
                }}
                role="tab"
                aria-selected={activeTab === tab}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Relative Mode Warning */}
      {!isMetric && (tool === "PROJECT" || tool === "VALIDATE") && (
        <div className="uncalibrated-notice">
          <div className="notice-badge">⚠️ RELATIVE RECONSTRUCTION</div>
          <p>
            No spatial georeference or GCPs detected. Metric scale cannot be
            anchored. Elevation is expressed in relative disparity units.
          </p>
          <button onClick={onOpenCalibration}>
            + ADD GROUND CONTROL POINTS
          </button>
        </div>
      )}

      {/* === TAB 1: OVERVIEW (High-Value Validation Metrics) === */}
      {tool === "PROJECT" && activeTab === "OVERVIEW" && (
        <>
          {hasValidation ? (
            <div className="inspector-section">
              <div className="section-title-row">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <small>VALIDATION METRICS</small>
                </div>
                <button className="text-link-btn" onClick={onOpenValidation}>
                  View Full Audit ↗
                </button>
              </div>

              {/* Compact 2x2 Information Grid */}
              <div className="validation-grid">
                <div className="val-card">
                  <small>RMSE</small>
                  <b>
                    {project.validation.rmse} <span className="unit">m</span>
                  </b>
                </div>
                <div className="val-card">
                  <small>MAE</small>
                  <b>
                    {project.validation.mae} <span className="unit">m</span>
                  </b>
                </div>
                <div className="val-card">
                  <small>R² COEFF</small>
                  <b>{project.validation.r2}</b>
                </div>
                <div className="val-card">
                  <small>95% CONF</small>
                  <b>
                    &plusmn;{project.validation.percentile95}{" "}
                    <span className="unit">m</span>
                  </b>
                </div>
              </div>
            </div>
          ) : (
            <div className="inspector-section">
              <small className="section-kicker">
                RELATIVE GEOMETRY METRICS
              </small>
              <p className="empty-hint" style={{ marginTop: 10 }}>
                Relative reconstruction metrics are unavailable until an input
                is processed.
              </p>
            </div>
          )}

          {/* Visualization Controls (Sliders) */}
          <div className="inspector-section">
            <small className="section-kicker">VISUALIZATION CONTROLS</small>

            {/* Terrain Exaggeration */}
            <div className="slider-group">
              <div className="slider-label">
                <span>TERRAIN EXAGGERATION</span>
                <b>{terrainExaggeration.toFixed(1)}x</b>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={terrainExaggeration}
                onChange={(e) => setTerrainExaggeration(Number(e.target.value))}
                className="range-input"
              />
            </div>

            {/* Sun Azimuth */}
            <div className="slider-group">
              <div className="slider-label">
                <span>SUN AZIMUTH</span>
                <b>{sunAzimuth}°</b>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={sunAzimuth}
                onChange={(e) => setSunAzimuth(Number(e.target.value))}
                className="range-input"
              />
            </div>

            {/* Sun Elevation / Altitude */}
            <div className="slider-group">
              <div className="slider-label">
                <span>SUN ELEVATION</span>
                <b>{sunAltitude}°</b>
              </div>
              <input
                type="range"
                min="10"
                max="85"
                value={sunAltitude}
                onChange={(e) => setSunAltitude(Number(e.target.value))}
                className="range-input"
              />
            </div>
          </div>

          {/* Layer Controls (Native Selects) */}
          <div className="inspector-section">
            <small className="section-kicker">LAYER SELECTION</small>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginTop: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                >
                  Base Layer
                </span>
                <select
                  value={baseLayer}
                  onChange={(e) => setBaseLayer(e.target.value)}
                  style={{
                    background: "var(--surface-base)",
                    border: "1px solid var(--smoked-border)",
                    color: "var(--text-primary)",
                    padding: "4px 8px",
                    borderRadius: 4,
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <option value="satellite">Satellite (Natural Color)</option>
                  <option value="grayscale">Grayscale Panchromatic</option>
                  <option value="falsecolor">False-Color Infrared</option>
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                >
                  Overlay
                </span>
                <select
                  value={overlayLayer}
                  onChange={(e) => setOverlayLayer(e.target.value)}
                  style={{
                    background: "var(--surface-base)",
                    border: "1px solid var(--smoked-border)",
                    color: "var(--text-primary)",
                    padding: "4px 8px",
                    borderRadius: 4,
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <option value="mesh">Terrain Mesh</option>
                  <option value="contours">Contour Isolines</option>
                  <option value="none">None</option>
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                >
                  Color Map
                </span>
                <select
                  value={colorMap}
                  onChange={(e) => setColorMap(e.target.value)}
                  style={{
                    background: "var(--surface-base)",
                    border: "1px solid var(--smoked-border)",
                    color: "var(--text-primary)",
                    padding: "4px 8px",
                    borderRadius: 4,
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <option value="elevation">
                    Elevation (Cyan → Deep Navy)
                  </option>
                  <option value="slope">Slope Angle</option>
                  <option value="uncertainty">Confidence Variance</option>
                </select>
              </div>
            </div>
          </div>
        </>
      )}

      {/* === TAB 2: ANALYSIS (Confidence & Progress Bars) === */}
      {tool === "PROJECT" && activeTab === "ANALYSIS" && (
        <div className="inspector-section">
          <small className="section-kicker">CONFIDENCE &amp; INLIER FIT</small>
          <div className="data-bar-group" style={{ marginTop: 14 }}>
            <div
              className="bar-labels"
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                marginBottom: 6,
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>
                RANSAC INLIER FIT
              </span>
              <span style={{ color: "var(--terrain-cyan)" }}>
                {project.calibration.fitQuality}%
              </span>
            </div>
            <div
              className="bar-track"
              style={{
                height: 4,
                background: "rgba(180,200,210,0.1)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                className="bar-fill"
                style={{
                  width: `${project.calibration.fitQuality}%`,
                  height: "100%",
                  background: "var(--mineral-blue)",
                }}
              />
            </div>
          </div>

          <div className="data-bar-group" style={{ marginTop: 18 }}>
            <div
              className="bar-labels"
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                marginBottom: 6,
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>
                SPATIAL CONFIDENCE
              </span>
              <span style={{ color: "var(--terrain-cyan)" }}>
                95% (&plusmn;{project.validation.percentile95}m)
              </span>
            </div>
            <div
              className="bar-track"
              style={{
                height: 4,
                background: "rgba(180,200,210,0.1)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                className="bar-fill"
                style={{
                  width: "92%",
                  height: "100%",
                  background: "var(--terrain-cyan)",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* === TAB 3: METADATA === */}
      {tool === "PROJECT" && activeTab === "METADATA" && (
        <div className="inspector-section">
          <small className="section-kicker">SPATIAL METADATA</small>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginTop: 12,
            }}
          >
            <div className="val-card">
              <small>COORDINATE REFERENCE</small>
              <b>{project.location.crs}</b>
            </div>
            <div className="val-card">
              <small>SPATIAL RESOLUTION</small>
              <b>
                {project.location.gsd
                  ? `${project.location.gsd} m/px`
                  : "Relative"}
              </b>
            </div>
            <div className="val-card">
              <small>VERTICAL DATUM</small>
              <b>{project.location.elevationDatum}</b>
            </div>
            <div className="val-card">
              <small>PROCESSING ENGINE</small>
              <b>Reported by API job</b>
            </div>
          </div>
        </div>
      )}

      {/* === CONTEXTUAL: LOCATION === */}
      {tool === "LOCATION" && (
        <div className="inspector-section">
          <small className="section-kicker">GEOSPATIAL COORDINATES</small>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginTop: 12,
            }}
          >
            <div className="val-card">
              <small>LATITUDE</small>
              <b>{project.location.latitude ?? "Unavailable"}</b>
            </div>
            <div className="val-card">
              <small>LONGITUDE</small>
              <b>{project.location.longitude ?? "Unavailable"}</b>
            </div>
            <div className="val-card">
              <small>SPATIAL CRS</small>
              <b>{project.location.crs}</b>
            </div>
            <div className="val-card">
              <small>GSD RESOLUTION</small>
              <b>
                {project.location.gsd
                  ? `${project.location.gsd} m/px`
                  : "Unavailable"}
              </b>
            </div>
            <div className="val-card">
              <small>ELEVATION DATUM</small>
              <b>{project.location.elevationDatum}</b>
            </div>
          </div>
        </div>
      )}

      {/* === CONTEXTUAL: AOI === */}
      {tool === "AOI" && (
        <div className="inspector-section">
          <small className="section-kicker">BOUNDING BOX &amp; COVERAGE</small>
          <div className="validation-grid" style={{ marginTop: 12 }}>
            <div className="val-card">
              <small>BOUNDING EXTENT</small>
              <b>
                {project.dsmMetadata?.bounds
                  ? JSON.stringify(project.dsmMetadata.bounds)
                  : "Unavailable"}
              </b>
            </div>
            <div className="val-card">
              <small>VALID PIXELS</small>
              <b>
                {String(project.dsmMetadata?.valid_pixels ?? "Unavailable")}
              </b>
            </div>
            <div className="val-card">
              <small>DIMENSIONS</small>
              <b>
                {project.dsmMetadata?.dimensions
                  ? JSON.stringify(project.dsmMetadata.dimensions)
                  : "Unavailable"}
              </b>
            </div>
            <div className="val-card">
              <small>CRS</small>
              <b>{String(project.dsmMetadata?.crs ?? "Unavailable")}</b>
            </div>
          </div>
        </div>
      )}

      {/* === CONTEXTUAL: LAYERS (SEMANTIC CLASSES) === */}
      {(tool === "LAYERS" || view === "SEMANTIC") && (
        <div className="inspector-section">
          <div className="section-title-row">
            <small>SEMANTIC LANDCOVER CLASSES</small>
            <button
              className="text-link-btn"
              onClick={() => setActiveSemanticClass(null)}
            >
              Show All
            </button>
          </div>
          <div className="semantic-class-list">
            <div
              className={`sem-item ${activeSemanticClass === "ground" ? "active" : ""}`}
              onClick={() =>
                setActiveSemanticClass(
                  activeSemanticClass === "ground" ? null : "ground",
                )
              }
            >
              <span className="sem-color ground" />
              <div className="sem-info">
                <strong>Ground &amp; Bedrock</strong>
                <small>Anchored to Reference DEM</small>
              </div>
              <b>{sem.ground}%</b>
            </div>

            <div
              className={`sem-item ${activeSemanticClass === "canopy" ? "active" : ""}`}
              onClick={() =>
                setActiveSemanticClass(
                  activeSemanticClass === "canopy" ? null : "canopy",
                )
              }
            >
              <span className="sem-color canopy" />
              <div className="sem-info">
                <strong>Tree Canopy &amp; Forest</strong>
                <small>Vegetation offset applied</small>
              </div>
              <b>{sem.canopy}%</b>
            </div>

            <div
              className={`sem-item ${activeSemanticClass === "structures" ? "active" : ""}`}
              onClick={() =>
                setActiveSemanticClass(
                  activeSemanticClass === "structures" ? null : "structures",
                )
              }
            >
              <span className="sem-color structures" />
              <div className="sem-info">
                <strong>Built Structures &amp; Roads</strong>
                <small>Preserved in DSM</small>
              </div>
              <b>{sem.structures}%</b>
            </div>

            <div
              className={`sem-item ${activeSemanticClass === "water" ? "active" : ""}`}
              onClick={() =>
                setActiveSemanticClass(
                  activeSemanticClass === "water" ? null : "water",
                )
              }
            >
              <span className="sem-color water" />
              <div className="sem-info">
                <strong>Water Bodies</strong>
                <small>Hydro-flattened zero datum</small>
              </div>
              <b>{sem.water}%</b>
            </div>
          </div>
        </div>
      )}

      {/* === CONTEXTUAL: MEASURE === */}
      {tool === "MEASURE" && (
        <div className="inspector-section">
          <small className="section-kicker">MEASUREMENT OUTPUT</small>
          {project.measurement ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginTop: 12,
              }}
            >
              <div className="val-card">
                <small>SURFACE DISTANCE</small>
                <b>
                  {project.measurement.distanceMeters}{" "}
                  {isMetric ? "m" : "units"}
                </b>
              </div>
              <div className="val-card">
                <small>ELEVATION DELTA</small>
                <b>
                  +{project.measurement.elevationDelta}{" "}
                  {isMetric ? "m" : "units"}
                </b>
              </div>
              <div className="val-card">
                <small>SLOPE ANGLE</small>
                <b>{project.measurement.slopeDegrees}°</b>
              </div>
              <div className="val-card">
                <small>MAX ELEVATION</small>
                <b>
                  {project.measurement.maxElevation} {isMetric ? "m" : "units"}
                </b>
              </div>
              <div className="val-card">
                <small>MIN ELEVATION</small>
                <b>
                  {project.measurement.minElevation} {isMetric ? "m" : "units"}
                </b>
              </div>
            </div>
          ) : (
            <p className="empty-hint" style={{ marginTop: "12px" }}>
              Click two points on the terrain to calculate a longitudinal
              cross-section and measure surface distance.
            </p>
          )}
        </div>
      )}

      {/* === CONTEXTUAL: ANNOTATE === */}
      {tool === "ANNOTATE" && (
        <div className="inspector-section">
          <small className="section-kicker">
            SURVEY MARKERS ({project.annotations.length})
          </small>
          <div className="annotation-list">
            {project.annotations.map((a) => (
              <div key={a.id} className="ann-item">
                <span className="ann-dot">✦</span>
                <div className="ann-text">
                  <strong>{a.label}</strong>
                  <small>
                    Coords: {a.x}%, {a.y}% · {a.elevation || 4832}m
                  </small>
                </div>
                <button
                  className="del-btn"
                  onClick={() => onDeleteAnnotation(a.id)}
                  aria-label="Delete survey marker"
                >
                  ✕
                </button>
              </div>
            ))}
            {project.annotations.length === 0 && (
              <p className="empty-hint">
                Click anywhere on the terrain surface to place a survey point
                marker.
              </p>
            )}
          </div>
        </div>
      )}

      {/* === CONTEXTUAL: VALIDATE === */}
      {tool === "VALIDATE" && hasValidation && (
        <div className="inspector-section">
          <div className="section-title-row">
            <small>BENCHMARK ACCURACY</small>
            <button className="text-link-btn" onClick={onOpenValidation}>
              Open Modal ↗
            </button>
          </div>
          <div className="validation-grid">
            <div className="val-card">
              <small>RMSE</small>
              <b>
                {project.validation.rmse} <span className="unit">m</span>
              </b>
            </div>
            <div className="val-card">
              <small>MAE</small>
              <b>
                {project.validation.mae} <span className="unit">m</span>
              </b>
            </div>
            <div className="val-card">
              <small>R² COEFF</small>
              <b>{project.validation.r2}</b>
            </div>
            <div className="val-card">
              <small>95% CONF</small>
              <b>
                &plusmn;{project.validation.percentile95}{" "}
                <span className="unit">m</span>
              </b>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
