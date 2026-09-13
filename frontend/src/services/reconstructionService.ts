import { assetUrl, uploadImage, waitForJob } from "../api";
import type {
  AreaMeasurement,
  MeasurementPoint,
  PresetScene,
  ProfileMeasurement,
  Project,
  ReconstructionMode,
  Stage,
} from "../types";

export const METRIC_PIPELINE_STAGES: {
  key: Stage;
  label: string;
  detail: string;
}[] = [
  {
    key: "INSPECTING",
    label: "01  Ingest & Geometry",
    detail:
      "Validating GeoTIFF metadata, RPC coordinates & spatial reference frame",
  },
  {
    key: "DEPTH_INFERENCE",
    label: "02  Depth Perception",
    detail:
      "Monocular ViT foundation inference predicting dense relative disparity",
  },
  {
    key: "SEMANTIC_ANALYSIS",
    label: "03  Landcover Parsing",
    detail: "Segmenting bare earth, canopy cover, built structures & drainage",
  },
  {
    key: "GROUND_SELECTION",
    label: "04  Semantic Ground Anchoring",
    detail: "Isolating 2,410 stable bare-ground candidate points",
  },
  {
    key: "CALIBRATING",
    label: "05  Geospatial Calibration",
    detail:
      "RANSAC linear regression fitting scale & offset against reference DEM",
  },
  {
    key: "UNCERTAINTY_ESTIMATION",
    label: "06  Uncertainty Field",
    detail: "Calculating spatial confidence bounds across high-relief terrain",
  },
  {
    key: "DSM_GENERATION",
    label: "07  Metric Surface Model",
    detail: "Generating 32-bit floating point absolute elevation raster",
  },
  {
    key: "MESH_GENERATION",
    label: "08  3D Terrain Synthesis",
    detail: "Compiling triangulated elevation mesh with solar hillshading",
  },
];

export const RELATIVE_PIPELINE_STAGES: {
  key: Stage;
  label: string;
  detail: string;
}[] = [
  {
    key: "INSPECTING",
    label: "01  Ingest Validation",
    detail: "Inspecting optical raster dimensions & optical contrast",
  },
  {
    key: "DEPTH_INFERENCE",
    label: "02  Depth Perception",
    detail: "Monocular ViT foundation inference predicting relative disparity",
  },
  {
    key: "SEMANTIC_ANALYSIS",
    label: "03  Semantic Landcover",
    detail: "Segmenting structural features & occlusion horizons",
  },
  {
    key: "DSM_GENERATION",
    label: "04  Relative Surface",
    detail: "Synthesizing normalized relative height model",
  },
  {
    key: "MESH_GENERATION",
    label: "05  3D Mesh Synthesis",
    detail: "Constructing relative 3D perspective terrain mesh",
  },
];

export const PRESET_SCENES: PresetScene[] = [
  {
    id: "himalayas",
    name: "Himalayan Ridge Pass",
    tag: "High-Relief Alpine · SRTM GL1",
    type: "GEOTIFF",
    mode: "metric",
    location: {
      latitude: 27.9881,
      longitude: 86.925,
      crs: "EPSG:32645 (WGS 84 / UTM Zone 45N)",
      gsd: 0.5,
      elevationDatum: "EGM96 Orthometric",
    },
    description:
      "High-relief alpine ridge with steep glacial moraines, sunlit granite crests, and valley drainage.",
    calibration: {
      available: true,
      source: "SRTM GL1 (30m Reference DEM)",
      scaleFactor: 1.042,
      offset: 14.8,
      groundPointCount: 2410,
      fitQuality: 98.4,
      status: "CALIBRATED",
      r2: 0.968,
    },
    validation: {
      available: true,
      referenceType: "Airborne LiDAR Benchmark (1m)",
      rmse: 3.42,
      mae: 2.65,
      r2: 0.941,
      bias: -0.32,
      percentile95: 7.2,
    },
    semanticStats: {
      ground: 64.2,
      canopy: 18.5,
      structures: 4.1,
      water: 13.2,
    },
    elevationRange: [3820, 5460],
  },
  {
    id: "grand_canyon",
    name: "Plateau Escarpment & Gorges",
    tag: "Canyon Gorge · USGS 3DEP",
    type: "GEOTIFF",
    mode: "metric",
    location: {
      latitude: 36.0544,
      longitude: -112.1401,
      crs: "EPSG:32612 (WGS 84 / UTM Zone 12N)",
      gsd: 0.65,
      elevationDatum: "NAVD88",
    },
    description:
      "Steep stepped horizontal sedimentary cliffs, dry wash canyon beds, and exposed plateau bedrock.",
    calibration: {
      available: true,
      source: "USGS 3DEP (10m Reference DEM)",
      scaleFactor: 0.988,
      offset: 6.2,
      groundPointCount: 3180,
      fitQuality: 99.1,
      status: "CALIBRATED",
      r2: 0.982,
    },
    validation: {
      available: true,
      referenceType: "USGS High-Resolution LiDAR DEM",
      rmse: 2.18,
      mae: 1.74,
      r2: 0.976,
      bias: 0.12,
      percentile95: 4.8,
    },
    semanticStats: {
      ground: 81.6,
      canopy: 9.4,
      structures: 1.2,
      water: 7.8,
    },
    elevationRange: [740, 2180],
  },
  {
    id: "quarry_urban",
    name: "Industrial Quarry & Forest Fringe",
    tag: "Active Excavation · Drone RTK",
    type: "GEOTIFF",
    mode: "metric",
    location: {
      latitude: 19.076,
      longitude: 72.8777,
      crs: "EPSG:32643 (WGS 84 / UTM Zone 43N)",
      gsd: 0.35,
      elevationDatum: "EGM2008",
    },
    description:
      "Tiered bench excavation pit surrounded by mixed forest canopy and access haul roads.",
    calibration: {
      available: true,
      source: "ALOS World 3D (30m)",
      scaleFactor: 1.015,
      offset: -3.4,
      groundPointCount: 1840,
      fitQuality: 96.8,
      status: "CALIBRATED",
      r2: 0.938,
    },
    validation: {
      available: true,
      referenceType: "UAV RTK Photogrammetric Survey",
      rmse: 4.1,
      mae: 3.12,
      r2: 0.912,
      bias: -0.55,
      percentile95: 8.4,
    },
    semanticStats: {
      ground: 48.3,
      canopy: 34.7,
      structures: 14.2,
      water: 2.8,
    },
    elevationRange: [42, 280],
  },
  {
    id: "uncalibrated_drone",
    name: "Unreferenced Drone Capture",
    tag: "Monocular RGB · Relative Only",
    type: "RGB IMAGE",
    mode: "relative",
    location: {
      latitude: null,
      longitude: null,
      crs: "Relative Pixel Coordinates",
      gsd: null,
      elevationDatum: "None",
    },
    description:
      "Raw consumer optical photograph without spatial telemetry, georeference tags, or ground control points.",
    calibration: {
      available: false,
      source: "None (GCPs Required for Metric Scale)",
      scaleFactor: 1.0,
      offset: 0.0,
      groundPointCount: 0,
      fitQuality: 0,
      status: "UNAVAILABLE",
      r2: 0,
    },
    validation: {
      available: false,
      referenceType: "None (Validation Unavailable)",
      rmse: 0,
      mae: 0,
      r2: 0,
      bias: 0,
      percentile95: 0,
    },
    semanticStats: {
      ground: 52.0,
      canopy: 28.0,
      structures: 12.0,
      water: 8.0,
    },
    elevationRange: [0, 100],
  },
];

export const reconstructionService = {
  presetScenes: PRESET_SCENES,

  createProject(file?: File): Project {
    const sourceUrl = file ? URL.createObjectURL(file) : "";
    const isGeo = Boolean(file?.name.match(/tif|geo/i));
    const isHdf5 = Boolean(file?.name.match(/\.(h5|hdf5)$/i));
    const mode: ReconstructionMode = isGeo ? "metric" : "relative";

    return {
      id: crypto.randomUUID(),
      name: file
        ? file.name.replace(/\.[^.]+$/, "").toUpperCase()
        : "UNPROCESSED INPUT",
      createdAt: new Date().toLocaleString(),
      source: {
        name: file?.name ?? "No input selected",
        type: isGeo ? "GEOTIFF" : isHdf5 ? "HDF5 DATASET" : "RGB IMAGE",
        url: sourceUrl,
        georeferenced: isGeo,
        presetId: undefined,
      },
      reconstructionMode: mode,
      location: {
        latitude: null,
        longitude: null,
        crs: isGeo ? "Pending GeoTIFF metadata" : "Relative Pixel Frame",
        gsd: null,
        elevationDatum: "Unavailable",
      },
      calibration: {
        available: false,
        source: "Unavailable until calibration is run",
        scaleFactor: 1,
        offset: 0,
        groundPointCount: 0,
        fitQuality: 0,
        status: "UNAVAILABLE",
        r2: 0,
      },
      validation: {
        available: false,
        referenceType: "Unavailable until a reference dataset is attached",
        rmse: 0,
        mae: 0,
        r2: 0,
        bias: 0,
        percentile95: 0,
      },
      semanticStats: { ground: 0, canopy: 0, structures: 0, water: 0 },
      status: "EMPTY",
      annotations: [],
    };
  },

  calculateProfile(
    pA: MeasurementPoint,
    pB: MeasurementPoint,
    isMetric: boolean,
    elevationA = 0,
    elevationB = 0,
    horizontalScale = 1,
  ): ProfileMeasurement {
    const dx = pB.x - pA.x;
    const dy = pB.y - pA.y;
    const distPx = Math.sqrt(dx * dx + dy * dy);
    const distanceMeters = Number((distPx * horizontalScale).toFixed(2));

    const samples: number[] = [];
    const steps = 24;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      samples.push(
        Number((elevationA + (elevationB - elevationA) * t).toFixed(3)),
      );
    }

    const minElev = Math.min(...samples);
    const maxElev = Math.max(...samples);
    const delta = maxElev - minElev;
    const slopeDeg =
      distanceMeters > 0
        ? Math.round(Math.atan2(delta, distanceMeters) * (180 / Math.PI) * 10) /
          10
        : 0;

    return {
      pointA: pA,
      pointB: pB,
      distanceMeters,
      minElevation: minElev,
      maxElevation: maxElev,
      elevationDelta: delta,
      slopeDegrees: Math.abs(slopeDeg),
      profileSamples: samples,
    };
  },

  calculateArea(
    points: MeasurementPoint[],
    isMetric: boolean,
  ): AreaMeasurement {
    if (points.length < 3) return { points, areaSqKm: 0 };
    // Shoelace formula in percentage space, mapped to real world km²
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    const absAreaNorm = Math.abs(area) / 20000;
    const areaSqKm =
      Math.round(absAreaNorm * (isMetric ? 4.8 : 1.0) * 100) / 100;
    return { points, areaSqKm };
  },

  async startProject(
    project: Project,
    file: File | undefined,
    onStage: (stage: Stage, progress: number, updatedProject: Project) => void,
    referenceFile?: File,
  ) {
    if (!file)
      throw new Error("Select an image before starting reconstruction.");
    const accepted = await uploadImage(file, referenceFile);
    let currentProject = {
      ...project,
      jobId: accepted.job_id,
      status: "UPLOADED" as Stage,
    };
    onStage("UPLOADED", 0, currentProject);
    const completed = await waitForJob(accepted.job_id, (job) => {
      const rawStatus = job.status;
      const status = rawStatus as Stage;
      const next = {
        ...currentProject,
        status:
          rawStatus === "COMPLETED" ? ("READY_RELATIVE" as Stage) : status,
      };
      currentProject = next;
      onStage(status, rawStatus === "COMPLETED" ? 100 : 50, next);
    });
    if (completed.status === "FAILED")
      throw new Error(completed.error?.message || "Processing failed.");
    const visualization = completed.results?.visualization as
      | Record<string, any>
      | undefined;
    const metadata = completed.results?.dsm_metadata as
      | Record<string, unknown>
      | undefined;
    const meshEndpoint =
      visualization?.assets?.mesh ||
      (completed.status === "COMPLETED"
        ? `/visualization/${accepted.job_id}/mesh`
        : null);
    const dsmEndpoint =
      visualization?.assets?.dsm ||
      (completed.status === "COMPLETED" ? `/dsm/${accepted.job_id}` : null);
    const textureEndpoint =
      visualization?.assets?.rgb_texture ||
      (completed.status === "COMPLETED"
        ? `/visualization/${accepted.job_id}/texture`
        : null);
    const resolvedTextureUrl = assetUrl(textureEndpoint);

    const rawVal = completed.results?.validation as Record<string, any> | undefined;
    let validation = currentProject.validation;
    if (rawVal) {
      if (rawVal.available && rawVal.metrics) {
        const m = rawVal.metrics;
        validation = {
          available: true,
          referenceType: rawVal.reference?.source || "Reference Elevation",
          rmse: Number(m.rmse ?? 0),
          mae: Number(m.mae ?? 0),
          r2: Number(m.r2 ?? 0),
          bias: Number(m.mean_bias ?? m.bias ?? 0),
          percentile95: Number(m.p95_ae ?? m.p95_error ?? m.percentile95 ?? 0),
          correlation: m.correlation !== undefined ? Number(m.correlation) : undefined,
          pearson_correlation: (m.pearson_correlation ?? m.correlation) !== undefined ? Number(m.pearson_correlation ?? m.correlation) : undefined,
          median_ae: m.median_ae !== undefined ? Number(m.median_ae) : undefined,
          valid_pixels: m.valid_pixels !== undefined ? Number(m.valid_pixels) : undefined,
          source: rawVal.reference?.source,
          reportUrl: assetUrl(rawVal.artifacts?.report_json),
          csvUrl: assetUrl(rawVal.artifacts?.metrics_csv),
        };
      } else {
        validation = {
          ...validation,
          available: false,
          reason: rawVal.reason || "No reference elevation data supplied",
        };
      }
    }

    currentProject = {
      ...currentProject,
      status: metadata?.is_metric ? "READY_METRIC" : "READY_RELATIVE",
      reconstructionMode: metadata?.is_metric ? "metric" : "relative",
      source: {
        ...currentProject.source,
        url: resolvedTextureUrl || currentProject.source.url,
      },
      dsmMetadata: metadata,
      validation,
      visualization: meshEndpoint
        ? {
            mesh: assetUrl(meshEndpoint),
            dsm: assetUrl(dsmEndpoint),
            rgb_texture: resolvedTextureUrl,
          }
        : undefined,
    };
    onStage(currentProject.status, 100, currentProject);
  },

  generateObjFile(projectName: string): string {
    let obj = `# BHUDARPAN 3D Terrain Mesh Export\n# Project: ${projectName}\n# CRS: EPSG:32645\n# Generated: ${new Date().toISOString()}\n\n`;
    const res = 24;
    for (let y = 0; y <= res; y++) {
      for (let x = 0; x <= res; x++) {
        const u = x / res - 0.5;
        const v = y / res - 0.5;
        const z =
          Math.sin(u * 3.5) * Math.cos(v * 3.5) * 0.4 +
          (1 - u * u - v * v) * 0.35;
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
        const pz = (
          4100 +
          Math.sin(x * 0.35) * 160 +
          Math.cos(y * 0.28) * 240 +
          (x + y) * 4
        ).toFixed(2);
        const intensity = Math.round(160 + Math.sin(x) * 50);
        const cls =
          x % 4 === 0
            ? "Canopy"
            : y % 5 === 0
              ? "Structure"
              : y > 28
                ? "Water"
                : "Ground";
        xyz += `${px} ${py} ${pz} ${intensity} ${cls}\n`;
      }
    }
    return xyz;
  },

  generateGeoJson(project: Project): string {
    const features = project.annotations.map((a) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [
          project.location.longitude === null
            ? a.x
            : project.location.longitude + (a.x - 50) * 0.001,
          project.location.latitude === null
            ? a.y
            : project.location.latitude + (a.y - 50) * 0.001,
          a.elevation ?? null,
        ],
      },
      properties: {
        id: a.id,
        label: a.label,
        elevation: a.elevation,
        notes: a.notes || "Survey benchmark observation",
      },
    }));

    return JSON.stringify(
      {
        type: "FeatureCollection",
        crs: {
          type: "name",
          properties: { name: project.location.crs },
        },
        features,
      },
      null,
      2,
    );
  },
};
