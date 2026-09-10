import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Annotation, FlythroughState, ProfileMeasurement, Project, Tool, ViewMode } from '../../types';
import { reconstructionService } from '../../services/reconstructionService';

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
  isProfileOpen = false
}: TerrainCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number; elevation: number; slope: number; lat: string; lon: string } | null>(null);
  const [measurePointA, setMeasurePointA] = useState<{ x: number; y: number } | null>(null);
  const [isSplitting, setIsSplitting] = useState(false);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const markerGroupRef = useRef<THREE.Group | null>(null);
  const vectorGroupRef = useRef<THREE.Group | null>(null);

  // Flight camera state refs to prevent re-renders on every animation frame
  const flightPosRef = useRef(new THREE.Vector3(0, 35, 60));
  const flightEulerRef = useRef(new THREE.Euler(-0.4, 0, 0, 'YXZ'));
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  const guidedProgressRef = useRef(0);

  // Orbit controls state refs
  const isOrbitingRef = useRef(false);
  const orbitStartRef = useRef({ x: 0, y: 0 });
  const orbitSphericalRef = useRef({ radius: 85, theta: Math.PI * 0.1, phi: Math.PI * 0.32 });
  const orbitTargetRef = useRef(new THREE.Vector3(0, 5, 0));

  // 1. Initialize Three.js WebGL Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Scene with Deep Navy Void background (#061018)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x061018);
    scene.fog = new THREE.FogExp2(0x061018, 0.004);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 1000);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Atmospheric lighting
    const ambientLight = new THREE.AmbientLight(0xdde5ea, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff6e6, 1.4);
    sunLight.position.set(50, 60, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Terrain Groups for markers & vectors
    const markerGroup = new THREE.Group();
    scene.add(markerGroup);
    markerGroupRef.current = markerGroup;

    const vectorGroup = new THREE.Group();
    scene.add(vectorGroup);
    vectorGroupRef.current = vectorGroup;

    // Build 3D Terrain Heightfield Geometry
    const gridRes = 120;
    const planeGeo = new THREE.PlaneGeometry(90, 70, gridRes, gridRes);
    planeGeo.rotateX(-Math.PI / 2);

    // Displace vertices with high-relief alpine elevation
    const posAttr = planeGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);

      // Procedural alpine relief matching the Himalayan hero image
      const nx = vx / 45;
      const nz = vz / 35;
      const wave1 = Math.sin(nx * 3.2) * Math.cos(nz * 2.8) * 9;
      const wave2 = Math.sin(nx * 7.5 + nz * 4.2) * 4;
      const ridge = (1 - Math.abs(Math.sin(nx * 2.5 + nz * 1.8))) * 12;
      const edgeFalloff = Math.cos((vx / 45) * (Math.PI / 2)) * Math.cos((vz / 35) * (Math.PI / 2));

      const vy = Math.max(0, (wave1 + wave2 + ridge) * Math.max(0, edgeFalloff));
      posAttr.setY(i, vy);
    }
    planeGeo.computeVertexNormals();

    // Texture loading
    const textureLoader = new THREE.TextureLoader();
    const terrainTexture = textureLoader.load(project.source.url || '/assets/hero-earth-himalaya.png');
    terrainTexture.wrapS = THREE.ClampToEdgeWrapping;
    terrainTexture.wrapT = THREE.ClampToEdgeWrapping;

    const material = new THREE.MeshStandardMaterial({
      map: terrainTexture,
      roughness: 0.85,
      metalness: 0.08,
      wireframe: false,
      flatShading: false
    });

    const terrainMesh = new THREE.Mesh(planeGeo, material);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // Resize listener
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();

      if (flightState.active) {
        // === FLIGHT MODE ===
        if (flightState.mode === 'guided') {
          guidedProgressRef.current += delta * 0.05 * flightState.speed;
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
          setFlightState(f => ({ ...f, altitude: elevM, heading: headingDeg }));
        } else {
          // Manual pilot
          const moveSpeed = 24 * flightState.speed * delta;
          const keys = keysPressedRef.current;
          const forward = new THREE.Vector3();
          camera.getWorldDirection(forward);
          const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

          if (keys['w'] || keys['W']) flightPosRef.current.addScaledVector(forward, moveSpeed);
          if (keys['s'] || keys['S']) flightPosRef.current.addScaledVector(forward, -moveSpeed);
          if (keys['a'] || keys['A']) flightPosRef.current.addScaledVector(right, -moveSpeed);
          if (keys['d'] || keys['D']) flightPosRef.current.addScaledVector(right, moveSpeed);
          if (keys[' ']) flightPosRef.current.y += moveSpeed * 0.8;
          if (keys['Shift']) flightPosRef.current.y = Math.max(4, flightPosRef.current.y - moveSpeed * 0.8);

          camera.position.copy(flightPosRef.current);
          camera.rotation.copy(flightEulerRef.current);

          const headingDeg = Math.round((-flightEulerRef.current.y * 180) / Math.PI + 360) % 360;
          const elevM = Math.round(3800 + flightPosRef.current.y * 55);
          setFlightState(f => ({ ...f, altitude: elevM, heading: headingDeg }));
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
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
      planeGeo.dispose();
      material.dispose();
      terrainTexture.dispose();
    };
  }, [project.source.url, flightState.active]);

  // 2. Update Sun Position
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

  // 3. Update Wireframe / Shader Materials on View Change
  useEffect(() => {
    if (!terrainMeshRef.current) return;
    const mat = terrainMeshRef.current.material as THREE.MeshStandardMaterial;
    mat.wireframe = view === 'MESH' || wireframeMode;

    switch (view) {
      case 'DEPTH':
        mat.color.setHex(0x58c6d4); // Terrain Cyan
        break;
      case 'ELEVATION':
        mat.color.setHex(0x4386b6); // Terrain Blue
        break;
      case 'SEMANTIC':
        if (activeSemanticClass === 'canopy') mat.color.setHex(0x3d7547);
        else if (activeSemanticClass === 'water') mat.color.setHex(0x2a6f97);
        else if (activeSemanticClass === 'structures') mat.color.setHex(0xbc4749);
        else mat.color.setHex(0x58c6d4);
        break;
      case 'UNCERTAINTY':
        mat.color.setHex(0xc96b70);
        break;
      case 'SLOPE':
        mat.color.setHex(0x356b82);
        break;
      case 'RGB':
      case 'TERRAIN':
      default:
        mat.color.setHex(0xffffff);
        break;
    }
    mat.needsUpdate = true;
  }, [view, wireframeMode, activeSemanticClass]);

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
      const wy = (a.elevation ? (a.elevation - 3800) / 65 : 12);

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

      const ax = ((pA.x - 50) / 50) * 45;
      const az = ((pA.y - 50) / 50) * 35;
      const ay = (project.measurement.minElevation - 3800) / 65 + 3;

      const bx = ((pB.x - 50) / 50) * 45;
      const bz = ((pB.y - 50) / 50) * 35;
      const by = (project.measurement.maxElevation - 3800) / 65 + 3;

      const points = [new THREE.Vector3(ax, ay, az), new THREE.Vector3(bx, by, bz)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineDashedMaterial({
        color: 0x58c6d4,
        dashSize: 2,
        gapSize: 1,
        linewidth: 2
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
    const onKeyDown = (e: KeyboardEvent) => { keysPressedRef.current[e.key] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keysPressedRef.current[e.key] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
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

    if (tool === 'MEASURE' || tool === 'ANNOTATE') {
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObject(terrainMeshRef.current);

      if (intersects.length > 0) {
        const pt = intersects[0].point;
        const pctX = Math.round(Math.max(0, Math.min(100, ((pt.x + 45) / 90) * 100)));
        const pctY = Math.round(Math.max(0, Math.min(100, ((pt.z + 35) / 70) * 100)));
        const elev = Math.round(3800 + pt.y * 55);

        if (tool === 'MEASURE') {
          if (!measurePointA) {
            setMeasurePointA({ x: pctX, y: pctY });
          } else {
            const profile = reconstructionService.calculateProfile(
              measurePointA,
              { x: pctX, y: pctY },
              project.reconstructionMode === 'metric'
            );
            onUpdateMeasurement(profile);
            setMeasurePointA(null);
          }
          return;
        }

        if (tool === 'ANNOTATE') {
          const newAnn: Annotation = {
            id: crypto.randomUUID(),
            label: `Survey Anchor #${project.annotations.length + 1}`,
            x: pctX,
            y: pctY,
            elevation: project.reconstructionMode === 'metric' ? elev : Math.round(pt.y * 4)
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
      const newPct = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
      setSplitPosition(newPct);
      return;
    }

    if (cameraRef.current && terrainMeshRef.current) {
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObject(terrainMeshRef.current);
      if (intersects.length > 0) {
        const pt = intersects[0].point;
        const pctX = Math.round(((pt.x + 45) / 90) * 100);
        const pctY = Math.round(((pt.z + 35) / 70) * 100);
        const elev = Math.round(3800 + pt.y * 55);
        const slope = Number((12 + Math.sin(pctX * 0.1) * 8).toFixed(1));
        const lat = `${(27.9881 + (pctY - 50) * 0.001).toFixed(4)}° N`;
        const lon = `${(86.9250 + (pctX - 50) * 0.001).toFixed(4)}° E`;

        setHoverCoord({ x: pctX, y: pctY, elevation: elev, slope, lat, lon });
      }
    }

    if (isOrbitingRef.current) {
      const dx = e.clientX - orbitStartRef.current.x;
      const dy = e.clientY - orbitStartRef.current.y;
      orbitStartRef.current = { x: e.clientX, y: e.clientY };

      if (flightState.active && flightState.mode === 'manual') {
        flightEulerRef.current.y -= dx * 0.004;
        flightEulerRef.current.x = Math.max(-1.4, Math.min(1.4, flightEulerRef.current.x - dy * 0.004));
      } else {
        orbitSphericalRef.current.theta -= dx * 0.008;
        orbitSphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2.05, orbitSphericalRef.current.phi - dy * 0.008));
      }
    }
  };

  const handleMouseUp = () => {
    isOrbitingRef.current = false;
    setIsSplitting(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (flightState.active) return;
    orbitSphericalRef.current.radius = Math.max(25, Math.min(220, orbitSphericalRef.current.radius + e.deltaY * 0.08));
  };

  const resetOrbitCamera = () => {
    orbitSphericalRef.current = { radius: 85, theta: Math.PI * 0.1, phi: Math.PI * 0.32 };
    orbitTargetRef.current.set(0, 5, 0);
  };

  useEffect(() => {
    if (resetCameraTrigger > 0) {
      resetOrbitCamera();
    }
  }, [resetCameraTrigger]);

  useEffect(() => {
    if (!terrainMeshRef.current) return;
    const isWire = wireframeMode || view === 'MESH';
    (terrainMeshRef.current.material as THREE.MeshStandardMaterial).wireframe = isWire;
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
        width: '100%',
        height: '100%',
        cursor: tool === 'MEASURE' ? 'crosshair' : tool === 'ANNOTATE' ? 'cell' : isSplitting ? 'ew-resize' : 'grab'
      }}
    >
      {/* Split Lens Draggable Divider Line */}
      {splitCompare && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${splitPosition}%`,
            width: 2,
            background: 'var(--terrain-cyan)',
            boxShadow: '0 0 10px rgba(88, 198, 212, 0.6)',
            zIndex: 30,
            pointerEvents: 'none'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: -14,
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'var(--bg-surface)',
              border: '1.5px solid var(--terrain-cyan)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--terrain-cyan)',
              font: '700 9px var(--font-mono)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.6)'
            }}
          >
            ◀▶
          </div>
        </div>
      )}

      {/* Contextual Geospatial Query Marker Badge */}
      {hoverCoord && (
        <div className={`cursor-telemetry ${isProfileOpen ? 'dock-top' : ''}`} aria-live="polite">
          <span>LAT: {hoverCoord.lat}</span>
          <span>LON: {hoverCoord.lon}</span>
          <span>SLOPE: {hoverCoord.slope}°</span>
          <b>
            ELEV: {hoverCoord.elevation} {project.reconstructionMode === 'metric' ? 'm' : 'units'}
          </b>
        </div>
      )}
    </div>
  );
}
