import type { Tool } from '../../types';

interface ToolRailProps {
  tool: Tool;
  setTool: (t: Tool) => void;
  setUploading: (v: boolean) => void;
  onOpenExport: () => void;
  onOpenValidation: () => void;
}

// Coherent Lucide-style stroke icons (stroke-width: 1.75, 20px)
const IconProject = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IconIngest = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconLocation = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconAOI = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3H3v3" />
    <path d="M18 3h3v3" />
    <path d="M6 21H3v-3" />
    <path d="M18 21h3v-3" />
    <rect x="7" y="7" width="10" height="10" strokeDasharray="2 2" />
  </svg>
);

const IconLayers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const IconMeasure = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 22l20-20" />
    <path d="M5 19l2-2" />
    <path d="M9 15l2-2" />
    <path d="M13 11l2-2" />
    <path d="M17 7l2-2" />
  </svg>
);

const IconAnnotate = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconValidate = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const IconExport = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const toolConfig: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: 'PROJECT',  icon: <IconProject />,  label: 'Project' },
  { id: 'INGEST',   icon: <IconIngest />,   label: 'Ingest' },
  { id: 'LOCATION', icon: <IconLocation />, label: 'Location' },
  { id: 'AOI',      icon: <IconAOI />,      label: 'AOI' },
  { id: 'LAYERS',   icon: <IconLayers />,   label: 'Layers' },
  { id: 'MEASURE',  icon: <IconMeasure />,  label: 'Measure' },
  { id: 'ANNOTATE', icon: <IconAnnotate />, label: 'Annotate' },
  { id: 'VALIDATE', icon: <IconValidate />, label: 'Validate' },
  { id: 'EXPORT',   icon: <IconExport />,   label: 'Export' }
];

export function ToolRail({ tool, setTool, setUploading, onOpenExport, onOpenValidation }: ToolRailProps) {
  const handleClick = (t: Tool) => {
    if (t === 'INGEST') {
      setUploading(true);
      return;
    }
    if (t === 'EXPORT') {
      onOpenExport();
      return;
    }
    if (t === 'VALIDATE') {
      onOpenValidation();
      return;
    }
    setTool(t);
  };

  return (
    <nav className="tool-rail" aria-label="Tool suite navigation">
      {toolConfig.map(t => (
        <button
          key={t.id}
          className={tool === t.id ? 'active' : ''}
          onClick={() => handleClick(t.id)}
          title={t.label}
          aria-label={t.label}
        >
          <span className="rail-icon" aria-hidden="true">
            {t.icon}
          </span>
          <small>{t.label}</small>
        </button>
      ))}
    </nav>
  );
}
