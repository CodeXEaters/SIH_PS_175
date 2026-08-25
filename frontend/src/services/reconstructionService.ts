import type { Project, Stage } from '../types';
const stages: { key: Stage; label: string; detail: string }[] = [
  { key:'input', label:'01  Input', detail:'Analyzing optical imagery' }, { key:'depth', label:'02  Depth', detail:'Inferring relative spatial structure' }, { key:'calibration', label:'03  Calibration', detail:'Recovering real-world scale' }, { key:'elevation', label:'04  Elevation', detail:'Generating metric terrain model' }, { key:'reconstruction', label:'05  Reconstruction', detail:'Building navigable terrain' }
];
export const reconstructionService = {
  stages,
  createProject(file?: File): Project { const sourceUrl = file ? URL.createObjectURL(file) : '/assets/terrain-hero.png'; return { id:crypto.randomUUID(), name:file ? file.name.replace(/\.[^.]+$/, '') : 'UNTITLED RECONSTRUCTION', createdAt:new Date().toLocaleString(), source:{name:file?.name ?? 'Himalayan_approach_rgb.tif', type:file?.name.match(/tif|geo/i)?'GEOTIFF':'RGB IMAGE', url:sourceUrl, georeferenced:!!file?.name.match(/tif|geo/i)}, location:{latitude:19.0760,longitude:72.8777,crs:'WGS 84 / UTM 43N',gsd:.8},calibration:{reference:'Satellite metadata',scaleFactor:1.000,confidence:91.7},result:{minElevation:42.3,maxElevation:187.6,confidence:91.7},status:'idle',annotations:[],measurements:[] }; },
  async startProject(onStage:(stage:Stage, progress:number)=>void) { for (const stage of stages) { for (let progress=0;progress<=100;progress+=5) { onStage(stage.key,progress); await new Promise(r=>setTimeout(r,45)); } } onStage('ready',100); }
};
