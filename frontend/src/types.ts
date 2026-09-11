export type ViewMode =
  | "RGB"
  | "DEPTH"
  | "SEMANTIC"
  | "ELEVATION"
  | "UNCERTAINTY"
  | "SLOPE"
  | "CONTOURS"
  | "TERRAIN"
  | "MESH";

export type Tool =
  | "PROJECT"
  | "INGEST"
  | "LOCATION"
  | "AOI"
  | "LAYERS"
  | "MEASURE"
  | "ANNOTATE"
  | "VALIDATE"
  | "EXPORT";

export type Stage =
  | "EMPTY"
  | "UPLOADED"
  | "INSPECTING"
  | "DEPTH_INFERENCE"
  | "SEMANTIC_ANALYSIS"
  | "GROUND_SELECTION"
  | "CALIBRATION_PENDING"
  | "CALIBRATING"
  | "UNCERTAINTY_ESTIMATION"
  | "DSM_GENERATION"
  | "MESH_GENERATION"
  | "READY_RELATIVE"
  | "READY_METRIC"
  | "VALIDATION_READY"
  | "FAILED";

export type ReconstructionMode = "relative" | "metric";

export interface LocationMetadata {
  latitude: number | null;
  longitude: number | null;
  crs: string;
  gsd: number | null;
  elevationDatum: string;
}

export interface Calibration {
  available: boolean;
  source: string;
  scaleFactor: number;
  offset: number;
  groundPointCount: number;
  fitQuality: number;
  status: "PENDING" | "CALIBRATED" | "UNAVAILABLE" | "FAILED";
  r2: number;
}

export interface Validation {
  available: boolean;
  referenceType: string;
  rmse: number;
  mae: number;
  r2: number;
  bias: number;
  percentile95: number;
}

export interface SemanticStats {
  ground: number; // percentage
  canopy: number;
  structures: number;
  water: number;
}

export interface SourceImage {
  name: string;
  type: "RGB IMAGE" | "GEOTIFF" | "ORTHOPHOTO" | "HDF5 DATASET";
  url: string;
  georeferenced: boolean;
  presetId?: string;
  dimensions?: { width: number; height: number };
}

export interface VisualizationAssets {
  mesh: string | null;
  dsm: string | null;
  rgb_texture: string | null;
}

export interface Annotation {
  id: string;
  label: string;
  x: number;
  y: number;
  elevation?: number;
  notes?: string;
}

export interface MeasurementPoint {
  x: number;
  y: number;
}

export type MeasureSubTool =
  | "POINT"
  | "DISTANCE"
  | "PROFILE"
  | "AREA"
  | "SLOPE";

export interface ProfileMeasurement {
  pointA: MeasurementPoint;
  pointB: MeasurementPoint;
  distanceMeters: number;
  minElevation: number;
  maxElevation: number;
  elevationDelta: number;
  slopeDegrees: number;
  profileSamples: number[];
}

export interface AreaMeasurement {
  points: MeasurementPoint[];
  areaSqKm: number;
}

export interface FlythroughState {
  active: boolean;
  mode: "manual" | "guided";
  speed: number;
  altitude: number;
  heading: number;
  pitch: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  source: SourceImage;
  location: LocationMetadata;
  reconstructionMode: ReconstructionMode;
  calibration: Calibration;
  validation: Validation;
  semanticStats: SemanticStats;
  status: Stage;
  annotations: Annotation[];
  measurement?: ProfileMeasurement;
  areaMeasurement?: AreaMeasurement;
  jobId?: string;
  visualization?: VisualizationAssets;
  dsmMetadata?: Record<string, unknown>;
}

export interface PresetScene {
  id: string;
  name: string;
  tag: string;
  type: "GEOTIFF" | "RGB IMAGE";
  mode: ReconstructionMode;
  location: LocationMetadata;
  description: string;
  validation: Validation;
  calibration: Calibration;
  semanticStats: SemanticStats;
  elevationRange: [number, number];
}

export interface DemoStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  viewMode: ViewMode;
  tool?: Tool;
  triggerFlythrough?: boolean;
}
