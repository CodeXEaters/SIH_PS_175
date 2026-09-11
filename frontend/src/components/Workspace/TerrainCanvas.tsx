import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { reconstructionService } from "../../services/reconstructionService";
import type {
  Annotation,
  FlythroughState,
  ProfileMeasurement,
  Project,
  Tool,
  ViewMode,
} from "../../types";

interface TerrainCanvasProps {
  project: Project;
  view: ViewMode;
  tool: Tool;
  sunAzimuth: number;
  sunAltitude: number;
  contourInterval: number;
  splitCompare: boolean;
  splitPosition: number;
  setSplitPosition: (v: number) => void;
  activeSemanticClass: string | null;
  flightState: FlythroughState;
  setFlightState: React.Dispatch<React.SetStateAction<FlythroughState>>;
  onUpdateMeasurement: (m: ProfileMeasurement) => void;
  onAddAnnotation: (a: Annotation) => void;
  wireframeMode?: boolean;
  resetCameraTrigger?: number;
  isProfileOpen?: boolean;
}

export function TerrainCanvas({
  project,
  view,
  tool,
  sunAzimuth,
  sunAltitude,
  contourInterval,
  splitCompare,
  splitPosition,
  setSplitPosition,
  activeSemanticClass,
  flightState,
  setFlightState,
  onUpdateMeasurement,
  onAddAnnotation,
  wireframeMode = false,
  resetCameraTrigger = 0,
  isProfileOpen = false,
}: TerrainCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoverCoord, setHoverCoord] = useState<{
    x: number;
    y: number;
    elevation: number;
    slope: number;
    lat: string;
    lon: string;
  } | null>(null);
  const [measurePointA, setMeasurePointA] = useState<{
    x: number;
    y: number;
    elevation: number;
  } | null>(null);
  const [isSplitting, setIsSplitting] = useState(false);
  const [terrainRevision, setTerrainRevision] = useState(0);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const terrainGroupRef = useRef<THREE.Group | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const terrainBoundsRef = useRef<THREE.Box3 | null>(null);
  const originalMaterialsRef = useRef<Map<THREE.Mesh, THREE.Material>>(
    new Map(),
  );
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const markerGroupRef = useRef<THREE.Group | null>(null);
  const vectorGroupRef = useRef<THREE.Group | null>(null);

  // Flight camera state refs to prevent re-renders on every animation frame
  const flightPosRef = useRef(new THREE.Vector3(0, 35, 60));
  const flightEulerRef = useRef(new THREE.Euler(-0.4, 0, 0, "YXZ"));
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  const guidedProgressRef = useRef(0);
  const flightStateRef = useRef(flightState);

  // Orbit controls state refs
  const isOrbitingRef = useRef(false);
  const orbitStartRef = useRef({ x: 0, y: 0 });
  const orbitSphericalRef = useRef({
    radius: 85,
    theta: Math.PI * 0.1,
    phi: Math.PI * 0.32,
  });
  const orbitTargetRef = useRef(new THREE.Vector3(0, 5, 0));

  useEffect(() => {
    flightStateRef.current = flightState;
  }, [flightState]);

  // 1. Initialize Three.js WebGL Scene (Only on Mount / Flight Mode Change)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Scene with Deep Navy Void background (#061018)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x061018);
    scene.fog = new THREE.FogExp2(0x061018, 0.002);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 5000);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Atmospheric lighting
    const ambientLight = new THREE.AmbientLight(0xdde5ea, 0.8);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334455, 0.7);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff6e6, 1.5);
    sunLight.position.set(50, 80, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Terrain Group (Root for 3D elevation mesh)
    const terrainGroup = new THREE.Group();
    scene.add(terrainGroup);
    terrainGroupRef.current = terrainGroup;

    // Groups for markers & vectors
    const markerGroup = new THREE.Group();
    scene.add(markerGroup);
    markerGroupRef.current = markerGroup;

    const vectorGroup = new THREE.Group();
    scene.add(vectorGroup);
    vectorGroupRef.current = vectorGroup;

    // Resize listener
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const currentFlight = flightStateRef.current;

      if (currentFlight.active) {
        // === FLIGHT MODE ===
        if (currentFlight.mode === "guided") {
          guidedProgressRef.current += delta * 0.05 * currentFlight.speed;
          if (guidedProgressRef.current > 1) guidedProgressRef.current = 0;
          const t = guidedProgressRef.current;

          const cx = Math.sin(t * Math.PI * 2) * 35;
          const cz = Math.cos(t * Math.PI * 2) * 30;
          const cy = 24 + Math.sin(t * Math.PI * 4) * 8;

          flightPosRef.current.set(cx, cy, cz);
          camera.position.copy(flightPosRef.current);
          camera.lookAt(0, 8, 0);

          const headingDeg = (t * 360) % 360;
          const elevM = Math.round(3800 + cy * 55);
          setFlightState((f) => ({
            ...f,
            altitude: elevM,
            heading: headingDeg,
          }));
        } else {
          // Manual pilot
          const moveSpeed = 24 * currentFlight.speed * delta;
          const keys = keysPressedRef.current;
          const forward = new THREE.Vector3();
          camera.getWorldDirection(forward);
          const right = new THREE.Vector3()
            .crossVectors(forward, new THREE.Vector3(0, 1, 0))
            .normalize();

          if (keys["w"] || keys["W"])
            flightPosRef.current.addScaledVector(forward, moveSpeed);
          if (keys["s"] || keys["S"])
            flightPosRef.current.addScaledVector(forward, -moveSpeed);
          if (keys["a"] || keys["A"])
            flightPosRef.current.addScaledVector(right, -moveSpeed);
          if (keys["d"] || keys["D"])
            flightPosRef.current.addScaledVector(right, moveSpeed);
          if (keys[" "]) flightPosRef.current.y += moveSpeed * 0.8;
          if (keys["Shift"])
            flightPosRef.current.y = Math.max(
              4,
              flightPosRef.current.y - moveSpeed * 0.8,
            );

          camera.position.copy(flightPosRef.current);
          camera.rotation.copy(flightEulerRef.current);

          const headingDeg =
            Math.round((-flightEulerRef.current.y * 180) / Math.PI + 360) % 360;
          const elevM = Math.round(3800 + flightPosRef.current.y * 55);
          setFlightState((f) => ({
            ...f,
            altitude: elevM,
            heading: headingDeg,
          }));
        }
      } else {
        // === ORBIT MODE ===
        const sp = orbitSphericalRef.current;
        const target = orbitTargetRef.current;
        const x = target.x + sp.radius * Math.sin(sp.phi) * Math.sin(sp.theta);
        const y = target.y + sp.radius * Math.cos(sp.phi);
        const z = target.z + sp.radius * Math.sin(sp.phi) * Math.cos(sp.theta);

        camera.position.set(x, y, z);
        camera.lookAt(target);
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 2. Load or Build 3D Terrain Mesh whenever visualization.mesh, source.url, or status changes
  useEffect(() => {
    const terrainGroup = terrainGroupRef.current;
    const camera = cameraRef.current;
    if (!terrainGroup || !camera) return;

    // Clear existing terrain children
    while (terrainGroup.children.length > 0) {
      const child = terrainGroup.children[0];
      terrainGroup.remove(child);
      child.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material))
              obj.material.forEach((m) => m.dispose());
            else obj.material.dispose();
          }
        }
      });
    }
    terrainMeshRef.current = null;
    terrainBoundsRef.current = null;
    originalMaterialsRef.current.clear();

    const fitCameraToObject = (object: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 20);

      // Re-center object so its center is directly at (0, 0, 0)
      object.position.x = -center.x;
      object.position.y = -center.y;
      object.position.z = -center.z;

      // Adjust camera frustum bounds
      camera.near = Math.max(0.1, maxDim * 0.001);
      camera.far = Math.max(5000, maxDim * 40);
      camera.updateProjectionMatrix();

      // Reset orbit target to center and adjust distance
      orbitTargetRef.current.set(0, 0, 0);
      orbitSphericalRef.current.radius = Math.max(45, maxDim * 1.4);
      orbitSphericalRef.current.theta = Math.PI * 0.15;
      orbitSphericalRef.current.phi = Math.PI * 0.32;
    };

    if (project.visualization?.mesh) {
      const loader = new GLTFLoader();
      loader.load(
        project.visualization.mesh,
        (gltf) => {
          const root = gltf.scene;
          let firstMesh: THREE.Mesh | null = null;
          root.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              if (!firstMesh) firstMesh = child;
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.side = THREE.DoubleSide;
                child.material.needsUpdate = true;
                originalMaterialsRef.current.set(child, child.material.clone());
              }
              if (child.geometry) {
                child.geometry.computeVertexNormals();
              }
            }
          });
          // GLB heightfield export uses X=column, Y=row, Z=elevation.
          // In Three.js, ground is X-Z and Y is UP. Rotate -90° on X to lie horizontally.
          root.rotation.x = -Math.PI / 2;
          root.updateMatrixWorld(true);

          // Check elevation relief bounds after rotation
          const initialBox = new THREE.Box3().setFromObject(root);
          const initialSize = initialBox.getSize(new THREE.Vector3());
          const horizontalDim = Math.max(initialSize.x, initialSize.z, 20);

          // If terrain relief (Y) is very flat compared to horizontal extent
          // (common in relative/uncalibrated disparity e.g. ~3.5 units over 1024 units),
          // auto-scale elevation so 3D topology is clearly visible.
          if (initialSize.y < horizontalDim * 0.06) {
            const desiredRelief = horizontalDim * 0.22;
            const elevationScale =
              desiredRelief / Math.max(initialSize.y, 0.01);
            // In local space before -PI/2 X rotation, elevation is Z:
            root.scale.set(1, 1, elevationScale);
            root.updateMatrixWorld(true);
          }

          terrainGroup.add(root);
          terrainMeshRef.current = firstMesh;
          terrainBoundsRef.current = new THREE.Box3().setFromObject(root);
          fitCameraToObject(root);
          setTerrainRevision((revision) => revision + 1);
        },
        undefined,
        (err) => {
          console.error("Failed to load GLB terrain mesh:", err);
          createFallbackMesh();
        },
      );
    } else {
      createFallbackMesh();
    }

    function createFallbackMesh() {
      // Build a responsive 3D terrain preview from the source image or elevation grid
      const size = 60;
      const segments = 64;
      const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
      geometry.rotateX(-Math.PI / 2);

      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const y =
          Math.sin(x * 0.08) * Math.cos(z * 0.08) * 4.5 +
          Math.sin(Math.sqrt(x * x + z * z) * 0.15) * 2.0;
        pos.setY(i, y);
      }
      geometry.computeVertexNormals();

      let material: THREE.MeshStandardMaterial;
      const isH5 = Boolean(project.source?.name?.match(/\.(h5|hdf5)$/i));
      const effectiveTexture =
        project.visualization?.rgb_texture ||
        (project.source?.url && !isH5 ? project.source.url : null);
      if (effectiveTexture) {
        const texture = new THREE.TextureLoader().load(effectiveTexture);
        material = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.85,
          metalness: 0.1,
          side: THREE.DoubleSide,
        });
      } else {
        material = new THREE.MeshStandardMaterial({
          color: 0x3d758f,
          roughness: 0.75,
          metalness: 0.15,
          side: THREE.DoubleSide,
        });
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      originalMaterialsRef.current.set(mesh, material.clone());
      terrainGroup?.add(mesh);
      terrainMeshRef.current = mesh;
      terrainBoundsRef.current = new THREE.Box3().setFromObject(mesh);
      fitCameraToObject(mesh);
      setTerrainRevision((revision) => revision + 1);
    }
  }, [
    project.visualization?.mesh,
    project.visualization?.rgb_texture,
    project.source.url,
    project.status,
    resetCameraTrigger,
  ]);

  // 3. Update Sun Position
  useEffect(() => {
    if (!sunLightRef.current) return;
    const radAz = (sunAzimuth * Math.PI) / 180;
    const radAlt = (sunAltitude * Math.PI) / 180;
    const dist = 80;
    const lx = Math.cos(radAz) * Math.cos(radAlt) * dist;
    const ly = Math.sin(radAlt) * dist;
    const lz = Math.sin(radAz) * Math.cos(radAlt) * dist;
    sunLightRef.current.position.set(lx, ly, lz);
  }, [sunAzimuth, sunAltitude]);

  // 4. Update Wireframe / Shader Materials on View Change
  useEffect(() => {
    const terrainGroup = terrainGroupRef.current;
    if (!terrainGroup) return;

    terrainGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const orig = originalMaterialsRef.current.get(child) as
          | THREE.MeshStandardMaterial
          | undefined;
        const analyticalColor =
          view === "DEPTH"
            ? 0x58c6d4
            : view === "ELEVATION"
              ? 0x4386b6
              : view === "UNCERTAINTY"
                ? 0xc96b70
                : view === "SLOPE"
                  ? 0x356b82
                  : view === "SEMANTIC"
                    ? activeSemanticClass === "canopy"
                      ? 0x3d7547
                      : activeSemanticClass === "water"
                        ? 0x2a6f97
                        : activeSemanticClass === "structures"
                          ? 0xbc4749
                          : 0x58c6d4
                    : null;

        if (analyticalColor !== null || view === "MESH") {
          if (child.material !== orig) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => material.dispose());
            } else {
              child.material.dispose();
            }
          }
          child.material = new THREE.MeshStandardMaterial({
            color: analyticalColor ?? 0x4386b6,
            roughness: 0.8,
            metalness: 0.05,
            side: THREE.DoubleSide,
            wireframe: view === "MESH" || wireframeMode,
            vertexColors: false,
          });
        } else if (orig) {
          child.material = orig.clone();
          child.material.side = THREE.DoubleSide;
          child.material.wireframe = wireframeMode;
        }
      }
    });
  }, [view, wireframeMode, activeSemanticClass, terrainRevision]);

  // 4. Update 3D Survey Annotations (Cyan & Mineral Blue Pins)
  useEffect(() => {
    if (!markerGroupRef.current) return;
    const group = markerGroupRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    project.annotations.forEach((a) => {
      const wx = ((a.x - 50) / 50) * 45;
      const wz = ((a.y - 50) / 50) * 35;
      const wy = a.elevation ? (a.elevation - 3800) / 65 : 12;

      const pinGeo = new THREE.CylinderGeometry(0.25, 0.04, 5, 8);
      pinGeo.translate(0, 2.5, 0);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0x58c6d4 });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);

      const headGeo = new THREE.SphereGeometry(0.9, 12, 12);
      headGeo.translate(0, 5, 0);
      const headMat = new THREE.MeshBasicMaterial({ color: 0x356b82 });
      const headMesh = new THREE.Mesh(headGeo, headMat);

      const marker = new THREE.Group();
      marker.add(pinMesh);
      marker.add(headMesh);
      marker.position.set(wx, wy, wz);
      group.add(marker);
    });
  }, [project.annotations]);

  // 5. Update 3D Profile Measurement Line (Cyan Dashed Line)
  useEffect(() => {
    if (!vectorGroupRef.current) return;
    const group = vectorGroupRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    if (project.measurement) {
      const pA = project.measurement.pointA;
      const pB = project.measurement.pointB;
      const bounds = terrainBoundsRef.current;
      if (!bounds) return;
      const size = bounds.getSize(new THREE.Vector3());

      const ax = bounds.min.x + (pA.x / 100) * size.x;
      const az = bounds.min.z + (pA.y / 100) * size.z;
      const ay = project.measurement.minElevation;

      const bx = bounds.min.x + (pB.x / 100) * size.x;
      const bz = bounds.min.z + (pB.y / 100) * size.z;
      const by = project.measurement.maxElevation;

      const points = [
        new THREE.Vector3(ax, ay, az),
        new THREE.Vector3(bx, by, bz),
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineDashedMaterial({
        color: 0x58c6d4,
        dashSize: 2,
        gapSize: 1,
        linewidth: 2,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      group.add(line);

      // Start and End nodes
      const nodeGeo = new THREE.SphereGeometry(0.7, 12, 12);
      const nodeMat = new THREE.MeshBasicMaterial({ color: 0x58c6d4 });
      const nodeA = new THREE.Mesh(nodeGeo, nodeMat);
      nodeA.position.copy(points[0]);
      const nodeB = new THREE.Mesh(nodeGeo, nodeMat);
      nodeB.position.copy(points[1]);
      group.add(nodeA);
      group.add(nodeB);
    }
  }, [project.measurement]);

  // 6. Keyboard input for Flythrough
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // 7. Raycasting & Mouse Interaction
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current || !terrainMeshRef.current) return;

    if (splitCompare) {
      const rect = container.getBoundingClientRect();
      const splitPx = (splitPosition / 100) * rect.width;
      if (Math.abs(e.clientX - rect.left - splitPx) < 24) {
        setIsSplitting(true);
        return;
      }
    }

    if (tool === "MEASURE" || tool === "ANNOTATE") {
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObject(terrainMeshRef.current);

      if (intersects.length > 0) {
        const pt = intersects[0].point;
        const bounds =
          terrainBoundsRef.current ??
          new THREE.Box3().setFromObject(terrainMeshRef.current);
        const size = bounds.getSize(new THREE.Vector3());
        const pctX = Math.round(
          Math.max(
            0,
            Math.min(
              100,
              ((pt.x - bounds.min.x) / Math.max(size.x, 1e-6)) * 100,
            ),
          ),
        );
        const pctY = Math.round(
          Math.max(
            0,
            Math.min(
              100,
              ((pt.z - bounds.min.z) / Math.max(size.z, 1e-6)) * 100,
            ),
          ),
        );
        const elev = pt.y;

        if (tool === "MEASURE") {
          if (!measurePointA) {
            setMeasurePointA({ x: pctX, y: pctY, elevation: elev });
          } else {
            const horizontalScale = (size.x + size.z) / 2 / 100;
            const profile = reconstructionService.calculateProfile(
              measurePointA,
              { x: pctX, y: pctY },
              project.reconstructionMode === "metric",
              measurePointA.elevation,
              elev,
              horizontalScale,
            );
            onUpdateMeasurement(profile);
            setMeasurePointA(null);
          }
          return;
        }

        if (tool === "ANNOTATE") {
          const newAnn: Annotation = {
            id: crypto.randomUUID(),
            label: `Survey Anchor #${project.annotations.length + 1}`,
            x: pctX,
            y: pctY,
            elevation:
              project.reconstructionMode === "metric"
                ? elev
                : Math.round(pt.y * 4),
          };
          onAddAnnotation(newAnn);
          return;
        }
      }
    }

    isOrbitingRef.current = true;
    orbitStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    if (!container) return;

    if (isSplitting) {
      const rect = container.getBoundingClientRect();
      const newPct = Math.max(
        5,
        Math.min(95, ((e.clientX - rect.left) / rect.width) * 100),
      );
      setSplitPosition(newPct);
      return;
    }

    if (cameraRef.current && terrainMeshRef.current) {
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObject(terrainMeshRef.current);
      if (intersects.length > 0) {
        const pt = intersects[0].point;
        const bounds =
          terrainBoundsRef.current ??
          new THREE.Box3().setFromObject(terrainMeshRef.current);
        const size = bounds.getSize(new THREE.Vector3());
        const pctX = Math.round(
          Math.max(
            0,
            Math.min(
              100,
              ((pt.x - bounds.min.x) / Math.max(size.x, 1e-6)) * 100,
            ),
          ),
        );
        const pctY = Math.round(
          Math.max(
            0,
            Math.min(
              100,
              ((pt.z - bounds.min.z) / Math.max(size.z, 1e-6)) * 100,
            ),
          ),
        );
        const elev = pt.y;
        const slope = project.measurement?.slopeDegrees ?? 0;
        const lat =
          project.location.latitude === null
            ? "Unavailable"
            : `${project.location.latitude.toFixed(4)}°`;
        const lon =
          project.location.longitude === null
            ? "Unavailable"
            : `${project.location.longitude.toFixed(4)}°`;

        setHoverCoord({ x: pctX, y: pctY, elevation: elev, slope, lat, lon });
      }
    }

    if (isOrbitingRef.current) {
      const dx = e.clientX - orbitStartRef.current.x;
      const dy = e.clientY - orbitStartRef.current.y;
      orbitStartRef.current = { x: e.clientX, y: e.clientY };

      if (flightState.active && flightState.mode === "manual") {
        flightEulerRef.current.y -= dx * 0.004;
        flightEulerRef.current.x = Math.max(
          -1.4,
          Math.min(1.4, flightEulerRef.current.x - dy * 0.004),
        );
      } else {
        orbitSphericalRef.current.theta -= dx * 0.008;
        orbitSphericalRef.current.phi = Math.max(
          0.1,
          Math.min(Math.PI / 2.05, orbitSphericalRef.current.phi - dy * 0.008),
        );
      }
    }
  };

  const handleMouseUp = () => {
    isOrbitingRef.current = false;
    setIsSplitting(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (flightState.active) return;
    orbitSphericalRef.current.radius = Math.max(
      10,
      Math.min(1500, orbitSphericalRef.current.radius + e.deltaY * 0.08),
    );
  };

  const resetOrbitCamera = () => {
    orbitSphericalRef.current = {
      radius: 85,
      theta: Math.PI * 0.15,
      phi: Math.PI * 0.32,
    };
    orbitTargetRef.current.set(0, 0, 0);
  };

  useEffect(() => {
    if (resetCameraTrigger > 0) {
      resetOrbitCamera();
    }
  }, [resetCameraTrigger]);

  useEffect(() => {
    if (!terrainMeshRef.current) return;
    const isWire = wireframeMode || view === "MESH";
    (terrainMeshRef.current.material as THREE.MeshStandardMaterial).wireframe =
      isWire;
  }, [wireframeMode, view]);

  return (
    <div
      ref={mountRef}
      className="canvas-wrapper"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{
        width: "100%",
        height: "100%",
        cursor:
          tool === "MEASURE"
            ? "crosshair"
            : tool === "ANNOTATE"
              ? "cell"
              : isSplitting
                ? "ew-resize"
                : "grab",
      }}
    >
      {/* Split Lens Draggable Divider Line */}
      {splitCompare && (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${splitPosition}%`,
            width: 2,
            background: "var(--terrain-cyan)",
            boxShadow: "0 0 10px rgba(88, 198, 212, 0.6)",
            zIndex: 30,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: -14,
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "var(--bg-surface)",
              border: "1.5px solid var(--terrain-cyan)",
              display: "grid",
              placeItems: "center",
              color: "var(--terrain-cyan)",
              font: "700 9px var(--font-mono)",
              boxShadow: "0 4px 15px rgba(0,0,0,0.6)",
            }}
          >
            ◀▶
          </div>
        </div>
      )}

      {/* Contextual Geospatial Query Marker Badge */}
      {hoverCoord && (
        <div
          className={`cursor-telemetry ${isProfileOpen ? "dock-top" : ""}`}
          aria-live="polite"
        >
          <span>LAT: {hoverCoord.lat}</span>
          <span>LON: {hoverCoord.lon}</span>
          <span>SLOPE: {hoverCoord.slope}°</span>
          <b>
            ELEV: {hoverCoord.elevation}{" "}
            {project.reconstructionMode === "metric" ? "m" : "units"}
          </b>
        </div>
      )}
    </div>
  );
}
