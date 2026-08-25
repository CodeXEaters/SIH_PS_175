import { useEffect, useMemo, useRef, useState } from 'react';
import type { Annotation, Project, Tool, ViewMode } from '../../types';
import { reconstructionService } from '../../services/reconstructionService';
import { Inspector } from './Inspector';
import { ToolRail } from './ToolRail';

const modes: ViewMode[] = ['RGB','DEPTH','ELEVATION','CONTOURS','TERRAIN'];

export function Workspace({goHome}:{goHome:()=>void}) {
  const [project,setProject]=useState(()=>reconstructionService.createProject());
  const [tool,setTool]=useState<Tool>('PROJECT');
  const [view,setView]=useState<ViewMode>('TERRAIN');
  const [progress,setProgress]=useState(0);
  const [uploading,setUploading]=useState(false);
  const input=useRef<HTMLInputElement>(null);
  
  const running=project.status!=='idle'&&project.status!=='ready';
  const start=async()=>{setProject(p=>({...p,status:'input'}));await reconstructionService.startProject((status,p)=>{setProject(old=>({...old,status}));setProgress(p)});};
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      switch(e.key.toLowerCase()) {
        case 'm': setTool('MEASURE'); break;
        case 'a': setTool('ANNOTATE'); break;
        case 'l': setTool('LOCATION'); break;
        case 'p': setTool('PROJECT'); break;
        case 'escape': setUploading(false); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const addAnnotation=(e:React.MouseEvent)=>{
    if(tool!=='ANNOTATE')return;
    const r=(e.currentTarget as HTMLElement).getBoundingClientRect();
    const a:Annotation={id:crypto.randomUUID(),label:`Observation ${project.annotations.length+1}`,x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100};
    setProject(p=>({...p,annotations:[...p.annotations,a]}));
  };
  
  const upload=(file?:File)=>{if(!file)return;setProject(reconstructionService.createProject(file));setUploading(false);setTool('PROJECT');};
  const viewportStyle=useMemo(()=>({backgroundImage:`linear-gradient(0deg,rgba(6,12,13,.2),rgba(6,12,13,.2)), url(${project.source.url})`}),[project.source.url]);

  return (
    <main className="workspace">
      <header className="workspace-head animate-fade-down">
        <button className="wordmark" onClick={goHome}><b>D</b> DEPTHWIZARD</button>
        <div className="project-title"><small>PROJECT</small><strong>{project.name}</strong></div>
        <div className="run-status"><i className={running?'pulse':''}/>{running?`PROCESSING · ${progress}%`:project.status==='ready'?'RECONSTRUCTION READY':'AWAITING INPUT'}</div>
        <div className="head-actions">
          <button onClick={()=>{setProject(reconstructionService.createProject());setProgress(0)}}>New project</button>
          <button>Save</button>
          <button className="gold">Export ↗</button>
        </div>
      </header>

      <div className="workspace-body">
        <ToolRail tool={tool} setTool={setTool} setUploading={setUploading} />

        <section className="observation">
          <div className="viewport-head animate-fade-down">
            <div className="view-switch">
              {modes.map(m=><button className={view===m?'selected':''} onClick={()=>setView(m)} key={m}>{m}</button>)}
            </div>
            <span>{view==='TERRAIN'?'3D perspective':view.toLowerCase()+' model'} · WGS 84</span>
          </div>
          
          <div className={'terrain-view animate-fade-in tool-'+tool.toLowerCase()+' '+view.toLowerCase()} style={viewportStyle} onClick={addAnnotation}>
            <div className="grid-overlay"/>
            <div className="spotlight-overlay"/>
            <div className="terrain-label"><small>ACTIVE LAYER</small><b>{view} MODEL</b></div>
            {project.annotations.map(a=><span className="pin" key={a.id} style={{left:`${a.x}%`,top:`${a.y}%`}} title={a.label}>✦</span>)}
            
            {running&&<div className="processing">
              <p>RECONSTRUCTION IN PROGRESS</p>
              <b>{progress}%</b>
              <span><i style={{width:`${progress}%`}}/></span>
              <small>{reconstructionService.stages.find(s=>s.key===project.status)?.detail}</small>
            </div>}
            
            <div className="scale">0 <i/> 250 M</div>
          </div>

          <div className="viewport-actions animate-fade-up">
            <button onClick={start} disabled={running}>{project.status==='ready'?'Run again':running?'Processing…':'Start reconstruction'}</button>
            <button onClick={()=>setTool('MEASURE')}>⌁ Measure</button>
            <button onClick={()=>setTool('ANNOTATE')}>✦ Annotate</button>
          </div>
        </section>

        {!uploading && <Inspector project={project} tool={tool}/>}

        {tool==='UPLOAD'&&uploading&&<div className="upload-sheet animate-fade-in">
          <input ref={input} type="file" accept="image/*,.tif,.tiff" onChange={e=>upload(e.target.files?.[0])}/>
          <div onClick={()=>input.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();upload(e.dataTransfer.files[0])}}>
            <span>↥</span>
            <h2>Bring the Earth into view.</h2>
            <p>Drop an RGB image, GeoTIFF or orthophoto here.</p>
            <button className="gold">Select source image</button>
            <small>RGB IMAGE · GEOTIFF · ORTHOPHOTO</small>
          </div>
        </div>}
      </div>

      <footer className="statusbar animate-fade-up">
        <span>LAT {project.location.latitude}° N</span>
        <span>LON {project.location.longitude}° E</span>
        <span>GSD {project.location.gsd} M</span>
        <span>CONFIDENCE {project.result.confidence}%</span>
        <b>● {project.status==='ready'?'STATUS READY':running?'STATUS PROCESSING':'STATUS STANDBY'}</b>
      </footer>
    </main>
  );
}
