import type { Tool } from '../../types';

const icons: Record<Tool,string> = { PROJECT:'◫', UPLOAD:'↥', LOCATION:'◎', AOI:'⌗', LAYERS:'≋', MEASURE:'⌁', ANNOTATE:'✦' };

export function ToolRail({ tool, setTool, setUploading }: { tool: Tool, setTool: (t: Tool) => void, setUploading: (v: boolean) => void }) {
  return (
    <nav className="tool-rail animate-slide-right">
      {(Object.keys(icons) as Tool[]).map(t=>(
        <button className={tool===t?'active':''} onClick={()=>{setTool(t);if(t==='UPLOAD')setUploading(true)}} data-tooltip={t} key={t}>
          <b>{icons[t]}</b><small>{t}</small>
        </button>
      ))}
    </nav>
  );
}
