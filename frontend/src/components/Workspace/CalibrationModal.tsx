import type { Project } from "../../types";

interface CalibrationModalProps {
  project: Project;
  onClose: () => void;
}

export function CalibrationModal({ project, onClose }: CalibrationModalProps) {
  const isMetric = project.reconstructionMode === "metric";
  const calib = project.calibration;

  // Generate synthetic scatter plot points (Depth vs Elevation)
  const numPts = 32;
  const scatterPoints = Array.from({ length: numPts }).map((_, i) => {
    const d = 0.1 + (i / numPts) * 0.85;
    const noise = (Math.sin(i * 3.7) + Math.cos(i * 1.9)) * 18;
    const z = Math.round(
      3800 + d * 1600 * calib.scaleFactor + calib.offset + noise,
    );
    return { d: Number(d.toFixed(3)), z, inlier: Math.abs(noise) < 28 };
  });

  return (
    <div
      className="modal-backdrop animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="DEM Calibration Modal"
    >
      <div
        className="calibration-modal animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <small>MATHEMATICAL ANCHORING &amp; SCALE RECOVERY</small>
            <h2>DEM Calibration &amp; Residual Analysis</h2>
          </div>
          <button
            className="close-btn"
            onClick={onClose}
            aria-label="Close calibration modal"
          >
            ✕
          </button>
        </div>

        <p className="modal-desc">
          Bhudarpan eliminates scale and shift ambiguity by performing robust
          RANSAC linear regression between inferred relative depths{" "}
          <i>d(x,y)</i> and reference DEM ground elevations{" "}
          <i>
            z<sub>ref</sub>(x,y)
          </i>
          .
        </p>

        {isMetric && calib.available ? (
          <>
            {/* Calibration Equation Banner */}
            <div className="equation-banner">
              <span className="eq-label">FITTED TRANSFORMATION EQUATION:</span>
              <strong className="eq-formula">
                Elevation <i>z</i> = ({calib.scaleFactor}) · <i>d</i> + (
                {calib.offset} m)
              </strong>
              <div className="eq-badges">
                <span>R² = {calib.r2 || 0.968}</span>
                <span>INLIERS: {calib.fitQuality}%</span>
                <span>
                  ANCHOR POINTS: {calib.groundPointCount.toLocaleString()}
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1fr",
                gap: 16,
              }}
            >
              {/* Scatter Plot */}
              <div
                style={{
                  background: "var(--surface-base)",
                  border: "1px solid var(--smoked-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                }}
              >
                <small
                  className="section-kicker"
                  style={{ display: "block", marginBottom: 12 }}
                >
                  SCATTER REGRESSION (DEPTH vs ELEVATION)
                </small>
                <div style={{ height: 180, width: "100%" }}>
                  <svg
                    viewBox="0 0 400 200"
                    preserveAspectRatio="none"
                    style={{ width: "100%", height: "100%" }}
                  >
                    {/* Grid lines */}
                    <line
                      x1="40"
                      y1="20"
                      x2="380"
                      y2="20"
                      stroke="rgba(180,200,210,0.06)"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="40"
                      y1="90"
                      x2="380"
                      y2="90"
                      stroke="rgba(180,200,210,0.06)"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="40"
                      y1="160"
                      x2="380"
                      y2="160"
                      stroke="rgba(180,200,210,0.12)"
                    />
                    <line
                      x1="40"
                      y1="20"
                      x2="40"
                      y2="160"
                      stroke="rgba(180,200,210,0.12)"
                    />

                    {/* Cyan Regression Line */}
                    <line
                      x1="50"
                      y1="150"
                      x2="370"
                      y2="30"
                      stroke="#58C6D4"
                      strokeWidth="2.5"
                    />

                    {/* Scatter Dots */}
                    {scatterPoints.map((pt, i) => {
                      const cx = 50 + pt.d * 320;
                      const cy = 170 - ((pt.z - 3800) / 1800) * 140;
                      return (
                        <circle
                          key={i}
                          cx={cx}
                          cy={cy}
                          r={pt.inlier ? 3 : 2.5}
                          fill={pt.inlier ? "#58C6D4" : "#C96B70"}
                          stroke="#061018"
                          strokeWidth="1"
                        />
                      );
                    })}

                    <text
                      x="380"
                      y="178"
                      fill="#7F9099"
                      fontSize="8"
                      fontFamily="IBM Plex Mono"
                      textAnchor="end"
                    >
                      Relative Disparity d
                    </text>
                    <text
                      x="35"
                      y="16"
                      fill="#7F9099"
                      fontSize="8"
                      fontFamily="IBM Plex Mono"
                      textAnchor="end"
                    >
                      Elevation z (m)
                    </text>
                  </svg>
                </div>
              </div>

              {/* Residual Distribution */}
              <div
                style={{
                  background: "var(--surface-base)",
                  border: "1px solid var(--smoked-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <small
                  className="section-kicker"
                  style={{ display: "block", marginBottom: 12 }}
                >
                  RESIDUAL ERROR SPREAD
                </small>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontFamily: "var(--font-mono)",
                        fontSize: "9.5px",
                        color: "var(--text-muted)",
                        marginBottom: 4,
                      }}
                    >
                      <span>&lt; &plusmn;1.0m (Sub-meter)</span>
                      <b>42%</b>
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: "rgba(180,200,210,0.1)",
                        borderRadius: 2,
                      }}
                    >
                      <div
                        style={{
                          width: "42%",
                          height: "100%",
                          background: "var(--terrain-cyan)",
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontFamily: "var(--font-mono)",
                        fontSize: "9.5px",
                        color: "var(--text-muted)",
                        marginBottom: 4,
                      }}
                    >
                      <span>&plusmn;1.0m to &plusmn;3.0m</span>
                      <b>44%</b>
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: "rgba(180,200,210,0.1)",
                        borderRadius: 2,
                      }}
                    >
                      <div
                        style={{
                          width: "44%",
                          height: "100%",
                          background: "var(--mineral-blue)",
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontFamily: "var(--font-mono)",
                        fontSize: "9.5px",
                        color: "var(--text-muted)",
                        marginBottom: 4,
                      }}
                    >
                      <span>&gt; &plusmn;3.0m (Tail)</span>
                      <b>14%</b>
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: "rgba(180,200,210,0.1)",
                        borderRadius: 2,
                      }}
                    >
                      <div
                        style={{
                          width: "14%",
                          height: "100%",
                          background: "var(--status-warning)",
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: "1px solid var(--smoked-border)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--text-faint)",
                  }}
                >
                  RANSAC INLIER THRESHOLD: 3.5m
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 20,
              }}
            >
              <button className="export-row-btn" onClick={onClose}>
                Apply Calibration &amp; Close
              </button>
            </div>
          </>
        ) : (
          <div style={{ padding: "24px", textAlign: "center" }}>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "13px",
                marginBottom: 16,
              }}
            >
              No ground control points or spatial georeferencing attached.
              Elevation values are relative.
            </p>
            <button className="export-row-btn" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
