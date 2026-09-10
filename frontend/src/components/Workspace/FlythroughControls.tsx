import type { FlythroughState, ReconstructionMode } from '../../types';

interface FlythroughControlsProps {
  flight: FlythroughState;
  setFlight: React.Dispatch<React.SetStateAction<FlythroughState>>;
  mode: ReconstructionMode;
  onExit: () => void;
  onReset: () => void;
  onToggleGuided: () => void;
}

export function FlythroughControls({
  flight,
  setFlight,
  mode,
  onExit,
  onReset,
  onToggleGuided
}: FlythroughControlsProps) {
  return (
    <div className="flythrough-hud-panel animate-fade-down" role="region" aria-label="3D Flythrough Navigation HUD">
      {/* Primary Telemetry & Actions Row */}
      <div className="flythrough-hud-row">
        <div className="flythrough-hud-group">
          <span>MODE: <b>{flight.mode === 'guided' ? 'GUIDED FLIGHT' : 'MANUAL PILOT'}</b></span>
          <span>ALT: <b>{Math.round(flight.altitude)} {mode === 'metric' ? 'M MSL' : 'REL'}</b></span>
          <span>HDG: <b>{Math.round(flight.heading)}° N</b></span>
          <span>SPD: <b>{flight.speed}x</b></span>
        </div>

        <div className="flythrough-hud-actions">
          <button
            onClick={onToggleGuided}
            className={`hud-btn ${flight.mode === 'guided' ? 'primary' : ''}`}
            aria-label={flight.mode === 'guided' ? 'Pause guided flight' : 'Run guided flight'}
          >
            {flight.mode === 'guided' ? '■ PAUSE' : '▶ RUN FLIGHT'}
          </button>
          <button onClick={onReset} className="hud-btn" aria-label="Reset flight position">
            ↺ RESET POS
          </button>
          <button onClick={onExit} className="hud-btn danger" aria-label="Exit flight mode">
            ✕ EXIT
          </button>
        </div>
      </div>

      {/* Flight Keybindings & Speed Multipliers */}
      <div className="flythrough-hud-row sub">
        <div className="flythrough-key-group">
          <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
          <small>FLIGHT THRUST</small>
        </div>

        <div className="flythrough-key-group">
          <kbd>SPACE</kbd><kbd>SHIFT</kbd>
          <small>ALTITUDE</small>
        </div>

        <div className="flythrough-speed-group">
          <small>RATE:</small>
          {[1, 2, 4].map(s => (
            <button
              key={s}
              onClick={() => setFlight(f => ({ ...f, speed: s }))}
              className={flight.speed === s ? 'active' : ''}
              aria-label={`Flight speed ${s}x`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
