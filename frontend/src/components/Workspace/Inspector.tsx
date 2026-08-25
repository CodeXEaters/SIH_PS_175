import type { Project, Tool } from '../types';

export function Inspector({project, tool}:{project:Project;tool:Tool}) {
  const renderDataBars = () => {
    if (tool === 'PROJECT') {
      return (
        <div className="data-bars">
          <div className="data-bar-group">
            <div className="bar-labels"><small>CONFIDENCE</small><span>{project.result.confidence}%</span></div>
            <div className="bar-track"><div className="bar-fill" style={{width: `${project.result.confidence}%`}}/></div>
          </div>
          <div className="data-bar-group">
            <div className="bar-labels"><small>RESOLUTION</small><span>{project.location.gsd} m/px</span></div>
            <div className="bar-track"><div className="bar-fill" style={{width: '75%'}}/></div>
          </div>
        </div>
      );
    }
    return null;
  };

  const rows = tool==='LOCATION'?
    [['Latitude',`${project.location.latitude}° N`],['Longitude',`${project.location.longitude}° E`],['Coordinate ref.',project.location.crs]]:
    tool==='MEASURE'?
    [['Distance','1.24 km'],['Elevation Δ','86.4 m'],['Slope','8.2°']]:
    tool==='ANNOTATE'?
    [['Markers',String(project.annotations.length)],['Active layer','Terrain notes'],['Visibility','Visible']]:
    [['Source',project.source.name],['Created',project.createdAt],['Status',project.status==='ready'?'Ready':project.status]];

  return (
    <aside className="inspector animate-slide-left">
      <p className="panel-title">{tool} INSPECTOR</p>
      <h2>{tool==='PROJECT'?project.name:tool==='LOCATION'?'Geographic context':tool==='MEASURE'?'Terrain measurement':tool==='ANNOTATE'?'Field annotations':'Reconstruction settings'}</h2>
      <div className="readouts">
        {rows.map(([k,v])=><div key={k}><small>{k}</small><b>{v}</b></div>)}
      </div>
      
      {renderDataBars()}

      {tool==='PROJECT'&&<><div className="source-preview" style={{backgroundImage:`url(${project.source.url})`}}/><button className="text-button">View source metadata →</button></>}
      {tool==='LOCATION'&&<button className="outline wide">Update coordinates</button>}
      {tool==='AOI'&&<><p className="body-copy">Draw a boundary directly on the observation plane to limit the reconstruction area.</p><button className="gold wide">Define area of interest</button></>}
    </aside>
  );
}
