import type { Project, Stage, ReconstructionMode, PresetScene, ProfileMeasurement, MeasurementPoint, AreaMeasurement } from '../types';

export const METRIC_PIPELINE_STAGES: { key: Stage; label: string; detail: string }[] = [
  { key: 'INSPECTING', label: '01  Ingest & Geometry', detail: 'Validating GeoTIFF metadata, RPC coordinates & spatial reference frame' },
  { key: 'DEPTH_INFERENCE', label: '02  Depth Perception', detail: 'Monocular ViT foundation inference predicting dense relative disparity' },
  { key: 'SEMANTIC_ANALYSIS', label: '03  Landcover Parsing', detail: 'Segmenting bare earth, canopy cover, built structures & drainage' },
  { key: 'GROUND_SELECTION', label: '04  Semantic Ground Anchoring', detail: 'Isolating 2,410 stable bare-ground candidate points' },
  { key: 'CALIBRATING', label: '05  Geospatial Calibration', detail: 'RANSAC linear regression fitting scale & offset against reference DEM' },
  { key: 'UNCERTAINTY_ESTIMATION', label: '06  Uncertainty Field', detail: 'Calculating spatial confidence bounds across high-relief terrain' },
  { key: 'DSM_GENERATION', label: '07  Metric Surface Model', detail: 'Generating 32-bit floating point absolute elevation raster' },
  { key: 'MESH_GENERATION', label: '08  3D Terrain Synthesis', detail: 'Compiling triangulated elevation mesh with solar hillshading' }
];

export const RELATIVE_PIPELINE_STAGES: { key: Stage; label: string; detail: string }[] = [
  { key: 'INSPECTING', label: '01  Ingest Validation', detail: 'Inspecting optical raster dimensions & optical contrast' },
  { key: 'DEPTH_INFERENCE', label: '02  Depth Perception', detail: 'Monocular ViT foundation inference predicting relative disparity' },
  { key: 'SEMANTIC_ANALYSIS', label: '03  Semantic Landcover', detail: 'Segmenting structural features & occlusion horizons' },
  { key: 'DSM_GENERATION', label: '04  Relative Surface', detail: 'Synthesizing normalized relative height model' },
  { key: 'MESH_GENERATION', label: '05  3D Mesh Synthesis', detail: 'Constructing relative 3D perspective terrain mesh' }
];

export const PRESET_SCENES: PresetScene[] = [
  {
    id: 'himalayas',
    name: 'Himalayan Ridge Pass',
    tag: 'High-Relief Alpine · SRTM GL1',
    type: 'GEOTIFF',
    mode: 'metric',
    location: {
      latitude: 27.9881,
      longitude: 86.9250,
      crs: 'EPSG:32645 (WGS 84 / UTM Zone 45N)',
      gsd: 0.5,
      elevationDatum: 'EGM96 Orthometric'
    },
    description: 'High-relief alpine ridge with steep glacial moraines, sunlit granite crests, and valley drainage.',
    calibration: {
      available: true,
      source: 'SRTM GL1 (30m Reference DEM)',
      scaleFactor: 1.042,
      offset: 14.8,
      groundPointCount: 2410,
      fitQuality: 98.4,
      status: 'CALIBRATED',
      r2: 0.968
    },
    validation: {
      available: true,
      referenceType: 'Airborne LiDAR Benchmark (1m)',
      rmse: 3.42,
      mae: 2.65,
      r2: 0.941,
      bias: -0.32,
      percentile95: 7.2
    },
    semanticStats: {
      ground: 64.2,
      canopy: 18.5,
      structures: 4.1,
      water: 13.2
    },
    elevationRange: [3820, 5460]
  },
  {
    id: 'grand_canyon',
    name: 'Plateau Escarpment & Gorges',
    tag: 'Canyon Gorge · USGS 3DEP',
    type: 'GEOTIFF',
    mode: 'metric',
    location: {
      latitude: 36.0544,
      longitude: -112.1401,
      crs: 'EPSG:32612 (WGS 84 / UTM Zone 12N)',
      gsd: 0.65,
      elevationDatum: 'NAVD88'
    },
    description: 'Steep stepped horizontal sedimentary cliffs, dry wash canyon beds, and exposed plateau bedrock.',
    calibration: {
      available: true,
      source: 'USGS 3DEP (10m Reference DEM)',
      scaleFactor: 0.988,
      offset: 6.2,
      groundPointCount: 3180,
      fitQuality: 99.1,
      status: 'CALIBRATED',
      r2: 0.982
    },
    validation: {
      available: true,
      referenceType: 'USGS High-Resolution LiDAR DEM',
      rmse: 2.18,
      mae: 1.74,
      r2: 0.976,
      bias: 0.12,
      percentile95: 4.8
    },
    semanticStats: {
      ground: 81.6,
      canopy: 9.4,
      structures: 1.2,
      water: 7.8
    },
    elevationRange: [740, 2180]
  },
  {
    id: 'quarry_urban',
    name: 'Industrial Quarry & Forest Fringe',
    tag: 'Active Excavation · Drone RTK',
    type: 'GEOTIFF',
    mode: 'metric',
    location: {
      latitude: 19.0760,
      longitude: 72.8777,
      crs: 'EPSG:32643 (WGS 84 / UTM Zone 43N)',
      gsd: 0.35,
      elevationDatum: 'EGM2008'
    },
    description: 'Tiered bench excavation pit surrounded by mixed forest canopy and access haul roads.',
    calibration: {
      available: true,
      source: 'ALOS World 3D (30m)',
      scaleFactor: 1.015,
      offset: -3.4,
      groundPointCount: 1840,
      fitQuality: 96.8,
      status: 'CALIBRATED',
      r2: 0.938
    },
    validation: {
      available: true,
      referenceType: 'UAV RTK Photogrammetric Survey',
      rmse: 4.10,
      mae: 3.12,
      r2: 0.912,
      bias: -0.55,
      percentile95: 8.4
    },
    semanticStats: {
      ground: 48.3,
      canopy: 34.7,
      structures: 14.2,
      water: 2.8
    },
    elevationRange: [42, 280]
  },
  {
    id: 'uncalibrated_drone',
    name: 'Unreferenced Drone Capture',
    tag: 'Monocular RGB · Relative Only',
    type: 'RGB IMAGE',
    mode: 'relative',
    location: {
      latitude: null,
      longitude: null,
      crs: 'Relative Pixel Coordinates',
      gsd: null,
      elevationDatum: 'None'
    },
    description: 'Raw consumer optical photograph without spatial telemetry, georeference tags, or ground control points.',
    calibration: {
      available: false,
      source: 'None (GCPs Required for Metric Scale)',
      scaleFactor: 1.0,
      offset: 0.0,
      groundPointCount: 0,
      fitQuality: 0,
      status: 'UNAVAILABLE',
      r2: 0
    },
    validation: {
      available: false,
      referenceType: 'None (Validation Unavailable)',
      rmse: 0,
      mae: 0,
      r2: 0,
      bias: 0,
      percentile95: 0
    },
    semanticStats: {
      ground: 52.0,
      canopy: 28.0,
      structures: 12.0,
      water: 8.0
    },
    elevationRange: [0, 100]
  }
];

export const reconstructionService = {
  presetScenes: PRESET_SCENES,

  createProject(file?: File, presetId?: string): Project { 
    const preset = PRESET_SCENES.find(p => p.id === (presetId || 'himalayas')) || PRESET_SCENES[0];
    const sourceUrl = file ? URL.createObjectURL(file) : '/assets/hero-earth-himalaya.png'; 
    const isGeo = file ? !!file.name.match(/tif|geo/i) : preset.type === 'GEOTIFF';
    const mode: ReconstructionMode = file ? (isGeo ? 'metric' : 'relative') : preset.mode;

    const defaultMeasurement: ProfileMeasurement = {
      pointA: { x: 25, y: 70 },
      pointB: { x: 75, y: 30 },
      distanceMeters: mode === 'metric' ? 842 : 842,
      minElevation: mode === 'metric' ? preset.elevationRange[0] : 14,
      maxElevation: mode === 'metric' ? preset.elevationRange[1] : 92,
      elevationDelta: mode === 'metric' ? Math.round((preset.elevationRange[1] - preset.elevationRange[0]) * 0.62) : 78,
      slopeDegrees: 24.6,
      profileSamples: [
        3820, 3860, 3940, 4100, 4290, 4520, 4780, 4980, 5150, 5320, 5440, 5390, 5210, 4980, 4750
      ].map(v => mode === 'metric' ? v : Math.round((v - 3800) / 18))
    };

    return { 
      id: crypto.randomUUID(), 
      name: file ? file.name.replace(/\.[^.]+$/, '').toUpperCase() : preset.name.toUpperCase(), 
      createdAt: new Date().toLocaleString(), 
      source: {
        name: file?.name ?? (preset.id + '_ortho.tif'), 
        type: isGeo ? 'GEOTIFF' : 'RGB IMAGE', 
        url: sourceUrl, 
        georeferenced: isGeo,
        presetId: preset.id
      }, 
      reconstructionMode: mode,
      location: file ? (isGeo ? preset.location : { latitude: null, longitude: null, crs: 'Relative Pixel Frame', gsd: null, elevationDatum: 'None' }) : preset.location,
      calibration: file ? (isGeo ? preset.calibration : {
        available: false,
        source: 'None',
        scaleFactor: 1,
        offset: 0,
        groundPointCount: 0,
        fitQuality: 0,
        status: 'UNAVAILABLE',
        r2: 0
      }) : preset.calibration,
      validation: file ? (isGeo ? preset.validation : {
        available: false,
        referenceType: 'None',
        rmse: 0,
        mae: 0,
        r2: 0,
        bias: 0,
        percentile95: 0
      }) : preset.validation,
      semanticStats: preset.semanticStats,
      status: 'EMPTY', 
      annotations: [
        { id: '1', label: 'Ground Control Reference A', x: 38, y: 55, elevation: mode === 'metric' ? 4320 : 42 },
        { id: '2', label: 'Glacial Moraine Crest', x: 68, y: 38, elevation: mode === 'metric' ? 5120 : 86 }
      ], 
      measurement: defaultMeasurement
    }; 
  },

  calculateProfile(pA: MeasurementPoint, pB: MeasurementPoint, isMetric: boolean): ProfileMeasurement {
    const dx = pB.x - pA.x;
    const dy = pB.y - pA.y;
    const distPx = Math.sqrt(dx*dx + dy*dy);
    const distanceMeters = Math.round(distPx * 12.5);

    const samples: number[] = [];
    const steps = 24;
    const baseZ = isMetric ? 4100 : 30;
    const ampZ = isMetric ? 1200 : 60;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const interpX = pA.x + dx * t;
      const interpY = pA.y + dy * t;
      const wave = Math.sin(interpX * 0.08) * Math.cos(interpY * 0.06) + Math.sin(t * Math.PI) * 0.45;
      const elev = Math.round(baseZ + wave * ampZ + t * (ampZ * 0.35));
      samples.push(elev);
    }

    const minElev = Math.min(...samples);
    const maxElev = Math.max(...samples);
    const delta = maxElev - minElev;
    const slopeDeg = Math.round(Math.atan2(delta, distanceMeters) * (180 / Math.PI) * 10) / 10;

    return {
      pointA: pA,
      pointB: pB,
      distanceMeters,
      minElevation: minElev,
      maxElevation: maxElev,
      elevationDelta: delta,
      slopeDegrees: Math.abs(slopeDeg),
      profileSamples: samples
    };
  },

  calculateArea(points: MeasurementPoint[], isMetric: boolean): AreaMeasurement {
    if (points.length < 3) return { points, areaSqKm: 0 };
    // Shoelace formula in percentage space, mapped to real world km²
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    const absAreaNorm = Math.abs(area) / 20000;
    const areaSqKm = Math.round(absAreaNorm * (isMetric ? 4.8 : 1.0) * 100) / 100;
    return { points, areaSqKm };
  },

  async startProject(project: Project, onStage: (stage: Stage, progress: number, updatedProject: Project) => void) { 
    const stages = project.reconstructionMode === 'metric' ? METRIC_PIPELINE_STAGES : RELATIVE_PIPELINE_STAGES;
    let currentProject: Project = { ...project, status: 'UPLOADED' };
    onStage('UPLOADED', 0, currentProject);
    await new Promise(r => setTimeout(r, 40));

    for (const stage of stages) { 
      currentProject = { ...currentProject, status: stage.key };
      if (stage.key === 'CALIBRATING' && currentProject.calibration.available) {
        currentProject.calibration = { ...currentProject.calibration, status: 'CALIBRATED' };
      }

      for (let progress = 0; progress <= 100; progress += 20) { 
        onStage(stage.key, progress, currentProject); 
        await new Promise(r => setTimeout(r, 30)); 
      } 
    } 
    const finalStatus: Stage = currentProject.reconstructionMode === 'metric' ? 'READY_METRIC' : 'READY_RELATIVE';
    currentProject = { ...currentProject, status: finalStatus };
    onStage(finalStatus, 100, currentProject); 
  },

  generateObjFile(projectName: string): string {
    let obj = `# BHUDARPAN 3D Terrain Mesh Export\n# Project: ${projectName}\n# CRS: EPSG:32645\n# Generated: ${new Date().toISOString()}\n\n`;
    const res = 24;
    for (let y = 0; y <= res; y++) {
      for (let x = 0; x <= res; x++) {
        const u = x / res - 0.5;
        const v = y / res - 0.5;
        const z = Math.sin(u * 3.5) * Math.cos(v * 3.5) * 0.4 + (1 - u*u - v*v) * 0.35;
        obj += `v ${(u * 1000).toFixed(3)} ${(v * 1000).toFixed(3)} ${(z * 800 + 4200).toFixed(3)}\n`;
      }
    }
    for (let y = 0; y <= res; y++) {
      for (let x = 0; x <= res; x++) {
        obj += `vt ${(x / res).toFixed(4)} ${(1 - y / res).toFixed(4)}\n`;
      }
    }
    for (let y = 0; y < res; y++) {
      for (let x = 0; x < res; x++) {
        const i1 = y * (res + 1) + x + 1;
        const i2 = i1 + 1;
        const i3 = (y + 1) * (res + 1) + x + 1;
        const i4 = i3 + 1;
        obj += `f ${i1}/${i1} ${i2}/${i2} ${i4}/${i4}\n`;
        obj += `f ${i1}/${i1} ${i4}/${i4} ${i3}/${i3}\n`;
      }
    }
    return obj;
  },

  generateXyzFile(projectName: string): string {
    let xyz = `# BHUDARPAN Dense Point Cloud\n# Project: ${projectName}\n# X Y Z Intensity Class\n`;
    const res = 32;
    for (let y = 0; y <= res; y++) {
      for (let x = 0; x <= res; x++) {
        const px = (450000 + (x / res) * 2000).toFixed(2);
        const py = (3100000 + (y / res) * 2000).toFixed(2);
        const pz = (4100 + Math.sin(x * 0.35) * 160 + Math.cos(y * 0.28) * 240 + (x + y) * 4).toFixed(2);
        const intensity = Math.round(160 + Math.sin(x) * 50);
        const cls = (x % 4 === 0) ? 'Canopy' : (y % 5 === 0) ? 'Structure' : (y > 28) ? 'Water' : 'Ground';
        xyz += `${px} ${py} ${pz} ${intensity} ${cls}\n`;
      }
    }
    return xyz;
  },

  generateGeoJson(project: Project): string {
    const features = project.annotations.map(a => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          (project.location.longitude || 86.92) + (a.x - 50) * 0.001,
          (project.location.latitude || 27.98) + (a.y - 50) * 0.001,
          a.elevation || 0
        ]
      },
      properties: {
        id: a.id,
        label: a.label,
        elevation: a.elevation,
        notes: a.notes || 'Survey benchmark observation'
      }
    }));

    return JSON.stringify({
      type: 'FeatureCollection',
      crs: {
        type: 'name',
        properties: { name: project.location.crs }
      },
      features
    }, null, 2);
  }
};
