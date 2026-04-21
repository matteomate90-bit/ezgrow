import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Parse location string like "2x2-B2" -> { layout, col, row }
function parseLocation(loc) {
  if (!loc) return null;
  const parts = loc.split('-');
  if (parts.length !== 2) return null;
  const layout = parts[0];
  const pos = parts[1];
  if (!pos || pos.length < 2) return null;
  const col = pos.charCodeAt(0) - 65; // A=0, B=1
  const row = parseInt(pos[1]) - 1;   // 1-based -> 0-based
  return { layout, col, row };
}

const STAGE_COLORS = {
  seedling:   0x86efac,
  vegetative: 0x22c55e,
  flowering:  0xa855f7,
  harvesting: 0xf59e0b,
  drying:     0xf97316,
  curing:     0xeab308,
};

const STAGE_HEIGHTS = {
  seedling:   0.15,
  vegetative: 0.35,
  flowering:  0.55,
  harvesting: 0.65,
  drying:     0.4,
  curing:     0.3,
};

function buildSingleRoom(scene, room, plants) {
  while (scene.children.length > 0) scene.remove(scene.children[0]);

  // Lighting
  scene.add(Object.assign(new THREE.AmbientLight(0xffffff, 0.7)));
  const dir = new THREE.DirectionalLight(0xfff9e0, 1.2);
  dir.position.set(5, 10, 7);
  scene.add(dir);
  const fill = new THREE.DirectionalLight(0xe0f2fe, 0.4);
  fill.position.set(-5, 3, -3);
  scene.add(fill);

  const layoutStr = room?.layout || '2x2';
  const [colsS, rowsS] = layoutStr.split('x');
  const cols = parseInt(colsS) || 2;
  const rows = parseInt(rowsS) || 2;

  // Build a lookup: "col_row" -> plant
  const plantMap = {};
  plants.forEach(p => {
    const parsed = parseLocation(p.location);
    if (parsed && parsed.layout === layoutStr) {
      plantMap[parsed.col + '_' + parsed.row] = p;
    }
  });

  const cellSize = 0.8;
  const boxW = cols * cellSize + 0.2;
  const boxD = rows * cellSize + 0.2;
  const boxH = 0.08;
  const wallH = 1.2;

  // Floor
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(boxW, boxH, boxD),
    new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 })
  );
  floor.position.set(0, 0, 0);
  scene.add(floor);

  // Walls (transparent)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
  [-(boxD / 2), boxD / 2].forEach(z => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(boxW, wallH, 0.02), wallMat);
    w.position.set(0, wallH / 2 + boxH / 2, z);
    scene.add(w);
  });
  [-(boxW / 2), boxW / 2].forEach(x => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.02, wallH, boxD), wallMat);
    w.position.set(x, wallH / 2 + boxH / 2, 0);
    scene.add(w);
  });

  // Lamp
  const lamp = new THREE.Mesh(
    new THREE.CylinderGeometry(boxW * 0.3, boxW * 0.35, 0.06, 16),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfde047, emissiveIntensity: 0.8 })
  );
  lamp.position.set(0, wallH + boxH / 2 - 0.02, 0);
  scene.add(lamp);
  const lampLight = new THREE.PointLight(0xfff9c4, 1.5, Math.max(cols, rows) * 2);
  lampLight.position.set(0, wallH + boxH / 2 - 0.1, 0);
  scene.add(lampLight);

  // Pots + Plants
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = (c - (cols - 1) / 2) * cellSize;
      const pz = (r - (rows - 1) / 2) * cellSize;
      const py = boxH / 2;

      // Pot
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.13, 0.22, 12),
        new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.8 })
      );
      pot.position.set(px, py + 0.11, pz);
      scene.add(pot);

      // Soil
      const soil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17, 0.17, 0.02, 12),
        new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 1 })
      );
      soil.position.set(px, py + 0.23, pz);
      scene.add(soil);

      const plant = plantMap[c + '_' + r];
      if (plant) {
        const stage = plant.stage || 'seedling';
        const plantH = STAGE_HEIGHTS[stage] || 0.25;
        const plantColor = STAGE_COLORS[stage] || 0x22c55e;

        // Stem
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.025, 0.03, plantH * 0.6, 6),
          new THREE.MeshStandardMaterial({ color: 0x65a30d })
        );
        stem.position.set(px, py + 0.24 + plantH * 0.3, pz);
        scene.add(stem);

        // Foliage
        let fGeo;
        if (stage === 'flowering' || stage === 'harvesting') {
          fGeo = new THREE.SphereGeometry(plantH * 0.45, 10, 8);
        } else if (stage === 'seedling') {
          fGeo = new THREE.SphereGeometry(plantH * 0.5, 8, 6);
        } else {
          fGeo = new THREE.ConeGeometry(plantH * 0.38, plantH * 0.9, 8);
        }
        const foliage = new THREE.Mesh(fGeo, new THREE.MeshStandardMaterial({ color: plantColor, roughness: 0.6 }));
        foliage.position.set(px, py + 0.24 + plantH * 0.75, pz);
        scene.add(foliage);

        // Flowers
        if (stage === 'flowering' || stage === 'harvesting') {
          for (let f = 0; f < 5; f++) {
            const angle = (f / 5) * Math.PI * 2;
            const flower = new THREE.Mesh(
              new THREE.SphereGeometry(0.04, 6, 6),
              new THREE.MeshStandardMaterial({ color: 0xf9a8d4, emissive: 0xfb7185, emissiveIntensity: 0.3 })
            );
            flower.position.set(
              px + Math.cos(angle) * plantH * 0.3,
              py + 0.24 + plantH * 0.85,
              pz + Math.sin(angle) * plantH * 0.3
            );
            scene.add(flower);
          }
        }
      }
    }
  }
}

function RoomCanvas({ room, plants }) {
  const mountRef = useRef(null);
  const frameRef = useRef(null);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const spherical = useRef({ theta: Math.PI / 4, phi: Math.PI / 3.5 });

  const layoutStr = room?.layout || '2x2';
  const [colsS, rowsS] = layoutStr.split('x');
  const cols = parseInt(colsS) || 2;

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth;
    const H = el.clientHeight;
    const camDist = Math.max(4, cols * 1.5 + 2.5);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f4e8);

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);

    const updateCamera = () => {
      const { theta, phi } = spherical.current;
      camera.position.set(
        camDist * Math.sin(phi) * Math.cos(theta),
        camDist * Math.cos(phi),
        camDist * Math.sin(phi) * Math.sin(theta)
      );
      camera.lookAt(0, 0.5, 0);
    };
    updateCamera();

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    buildSingleRoom(scene, room, plants);
    renderer.render(scene, camera);

    let dirty = false;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      if (dirty) { updateCamera(); renderer.render(scene, camera); dirty = false; }
    };
    animate();

    const onMouseDown = (e) => { isDragging.current = true; lastMouse.current = { x: e.clientX, y: e.clientY }; };
    const onMouseMove = (e) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      spherical.current.theta -= dx * 0.008;
      spherical.current.phi = Math.max(0.15, Math.min(Math.PI / 2.1, spherical.current.phi + dy * 0.006));
      dirty = true;
    };
    const onMouseUp = () => { isDragging.current = false; };
    const onTouchStart = (e) => { if (e.touches.length === 1) { isDragging.current = true; lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } };
    const onTouchMove = (e) => {
      if (!isDragging.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastMouse.current.x;
      const dy = e.touches[0].clientY - lastMouse.current.y;
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      spherical.current.theta -= dx * 0.008;
      spherical.current.phi = Math.max(0.15, Math.min(Math.PI / 2.1, spherical.current.phi + dy * 0.006));
      dirty = true;
    };
    const onTouchEnd = () => { isDragging.current = false; };
    const handleResize = () => {
      const W2 = el.clientWidth; const H2 = el.clientHeight;
      camera.aspect = W2 / H2; camera.updateProjectionMatrix();
      renderer.setSize(W2, H2); dirty = true;
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (el.contains(canvas)) el.removeChild(canvas);
    };
  }, [room, plants]);

  return <div ref={mountRef} className="w-full h-full rounded-xl overflow-hidden cursor-grab active:cursor-grabbing" />;
}

export default function GrowboxScene({ plants, growRooms }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const rooms = useMemo(() => {
    if (growRooms && growRooms.length > 0) return growRooms;
    // Fallback: infer rooms from plant locations if no growRooms provided
    const layouts = {};
    plants.filter(p => p.status === 'active').forEach(p => {
      const parsed = parseLocation(p.location);
      const key = parsed?.layout || 'other';
      if (!layouts[key]) layouts[key] = { id: key, name: `Grow ${key}`, layout: key };
    });
    return Object.values(layouts);
  }, [growRooms, plants]);

  const activePlants = useMemo(() => plants.filter(p => p.status === 'active'), [plants]);

  const safeIndex = Math.min(currentIndex, Math.max(0, rooms.length - 1));
  const currentRoom = rooms[safeIndex];

  if (rooms.length === 0) return null;

  return (
    <div className="relative w-full" style={{ height: 320 }}>
      <RoomCanvas key={currentRoom?.id} room={currentRoom} plants={activePlants} />

      {/* Navigation */}
      {rooms.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={safeIndex === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 disabled:opacity-30 text-white rounded-full p-1.5 backdrop-blur-sm transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentIndex(i => Math.min(rooms.length - 1, i + 1))}
            disabled={safeIndex === rooms.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 disabled:opacity-30 text-white rounded-full p-1.5 backdrop-blur-sm transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {/* Dots */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5">
            {rooms.map((_, i) => (
              <button key={i} onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === safeIndex ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Room name + plant count */}
      <div className="absolute bottom-3 left-3">
        <span className="bg-black/30 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
          {currentRoom?.name} · {currentRoom?.layout} · {activePlants.filter(p => parseLocation(p.location)?.layout === currentRoom?.layout).length} piante
        </span>
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-3 flex flex-col gap-1">
        {[
          { label: 'Germinazione', color: '#86efac' },
          { label: 'Vegetativo',   color: '#22c55e' },
          { label: 'Fioritura',    color: '#a855f7' },
          { label: 'Raccolta',     color: '#f59e0b' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5 bg-black/25 backdrop-blur-sm rounded-full px-2 py-0.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
            <span className="text-white text-[10px]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
