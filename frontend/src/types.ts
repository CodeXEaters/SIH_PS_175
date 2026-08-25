export type ViewMode = 'RGB' | 'DEPTH' | 'ELEVATION' | 'CONTOURS' | 'TERRAIN';
export type Tool = 'PROJECT' | 'UPLOAD' | 'LOCATION' | 'AOI' | 'LAYERS' | 'MEASURE' | 'ANNOTATE';
export type Stage = 'idle' | 'input' | 'depth' | 'calibration' | 'elevation' | 'reconstruction' | 'ready';
export interface LocationMetadata { latitude: number; longitude: number; crs: string; gsd: number }
export interface Calibration { reference: string; scaleFactor: number; confidence: number }
export interface SourceImage { name: string; type: 'RGB IMAGE' | 'GEOTIFF' | 'ORTHOPHOTO'; url: string; georeferenced: boolean }
export interface ReconstructionResult { minElevation: number; maxElevation: number; confidence: number }
export interface Annotation { id: string; label: string; x: number; y: number }
export interface Measurement { id: string; label: string; value: string }
export interface Project { id: string; name: string; createdAt: string; source: SourceImage; location: LocationMetadata; calibration: Calibration; result: ReconstructionResult; status: Stage; annotations: Annotation[]; measurements: Measurement[] }
