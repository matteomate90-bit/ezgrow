import React, { useRef, useState, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

const STAGE_COLORS = {
  seedling:   { body: '#86efac', stem: '#4ade80', pot: '#78716c' },
  vegetative: { body: '#22c55e', stem: '#16a34a', pot: '#57534e' },
  flowering:  { body: '#c084fc', stem: '#16a34a', pot: '#57534e' },
  harvesting: { body: '#fbbf24', stem: '#92400e', pot: '#44403c' },
  drying:     { body: '#fb923c', stem: '#92400e', pot: '#44403c' },
  curing:     { body: '#facc15', stem: '#92400e', pot: '#44403c' },
};

const STAGE_HEIGHT = {
  seedling: 0.14, vegetative: 0.28, flowering: 0.40,
  harvesting: 0.42, drying: 0.30, curing: 0.22,
};

function parseLocation(loc) {
  if (!loc) return null;
  const parts = loc.split('-');
  if (parts.length !== 2) return null;
  const pos = parts[1];
  if (!pos || pos.length < 2) return null;
  return { col: pos.charCodeAt(0) - 65, row: parseInt(pos.slice(1)) - 1 };
}

function buildLocation(room, col, row) {
  const layout = room.layout === 'custom'
    ? `${room.custom_cols || 2}x${room.custom_rows || 2}`
    : (room.layout || '2x2');
  return `${layout}-${String.fromCharCode(65 + col)}${row + 1}`;
}

function PlantSVG({ plant, x, y, cellSize, isDragging, isDropTarget }) {
  const stage = plant?.stage || 'seedling';
  const colors = STAGE_COLORS[stage] || STAGE_COLORS.seedling;
  const heightFactor = STAGE_HEIGHT[stage] || 0.20;

  const plantH = cellSize * heightFactor * 2.2;
  const potW = cellSize * 0.44;
  const potH = cellSize * 0.22;
  const cx = x + cellSize / 2;
  const baseY = y + cellSize * 0.85;
  const topY = baseY - potH - plantH;
  const clampedTopY = Math.max(y + 4, topY);
  const actualPlantH = baseY - potH - clampedTopY;
  const maxNameLen = Math.floor(cellSize / 7);
  const displayName = plant.name.length > maxNameLen ? plant.name.slice(0, maxNameLen - 1) + '…' : plant.name;

  return (
    <g style={{ opacity: isDragging ? 0.4 : 1, pointerEvents: 'none' }}>
      {isDropTarget && (
        <rect x={x + 2} y={y + 2} width={cellSize - 4} height={cellSize - 4} rx="8" fill="hsl(var(--primary)/0.15)" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="4 2" />
      )}
      <path d={`M ${cx - potW * 0.38} ${baseY - potH} Q ${cx - potW * 0.48} ${baseY} ${cx - potW * 0.35} ${baseY} L ${cx + potW * 0.35} ${baseY} Q ${cx + potW * 0.48} ${baseY} ${cx + potW * 0.38} ${baseY - potH} Z`}
        fill={colors.pot} stroke="#292524" strokeWidth="1" strokeLinejoin="round" />
      <ellipse cx={cx} cy={baseY - potH} rx={potW * 0.40} ry={3} fill="#57534e" />
      <line x1={cx} y1={baseY - potH - 1} x2={cx} y2={clampedTopY + actualPlantH * 0.45}
        stroke={colors.stem} strokeWidth="2.5" strokeLinecap="round" />
      {actualPlantH > 15 && (
        <>
          <ellipse cx={cx - cellSize * 0.11} cy={clampedTopY + actualPlantH * 0.7} rx={cellSize * 0.10} ry={cellSize * 0.055} fill={colors.body} opacity="0.85" transform={`rotate(-25 ${cx - cellSize * 0.11} ${clampedTopY + actualPlantH * 0.7})`} />
          <ellipse cx={cx + cellSize * 0.11} cy={clampedTopY + actualPlantH * 0.65} rx={cellSize * 0.10} ry={cellSize * 0.055} fill={colors.body} opacity="0.85" transform={`rotate(25 ${cx + cellSize * 0.11} ${clampedTopY + actualPlantH * 0.65})`} />
        </>
      )}
      {stage === 'seedling' ? (
        <ellipse cx={cx} cy={clampedTopY + actualPlantH * 0.25} rx={cellSize * 0.13} ry={cellSize * 0.10} fill={colors.body} stroke={colors.stem} strokeWidth="1" />
      ) : stage === 'flowering' || stage === 'harvesting' ? (
        <>
          <circle cx={cx} cy={clampedTopY + actualPlantH * 0.15} r={cellSize * 0.15} fill={colors.body} stroke="#7c3aed" strokeWidth="1.2" />
          {[0, 72, 144, 216, 288].map(a => (
            <circle key={a} cx={cx + Math.cos(a * Math.PI / 180) * cellSize * 0.13}
              cy={clampedTopY + actualPlantH * 0.15 + Math.sin(a * Math.PI / 180) * cellSize * 0.13}
              r={cellSize * 0.055} fill="#f9a8d4" stroke="#ec4899" strokeWidth="0.8" />
          ))}
        </>
      ) : (
        <>
          <polygon points={`${cx},${clampedTopY + 2} ${cx - cellSize * 0.16},${clampedTopY + actualPlantH * 0.45} ${cx + cellSize * 0.16},${clampedTopY + actualPlantH * 0.45}`}
            fill={colors.body} stroke={colors.stem} strokeWidth="1" strokeLinejoin="round" />
          <polygon points={`${cx},${clampedTopY + actualPlantH * 0.18} ${cx - cellSize * 0.12},${clampedTopY + actualPlantH * 0.55} ${cx + cellSize * 0.12},${clampedTopY + actualPlantH * 0.55}`}
            fill={colors.body} stroke={colors.stem} strokeWidth="0.8" strokeLinejoin="round" />
        </>
      )}
      <text x={cx} y={baseY + 11} textAnchor="middle" fontSize="8" fill="#44403c" fontFamily="sans-serif" fontWeight="600">
        {displayName}
      </text>
    </g>
  );
}

export default function CartoonGrowRoom({ room, plants, onPlantClick, allPlants }) {
  const svgRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Drag state
  const [draggingPlant, setDraggingPlant] = useState(null); // plant object
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 }); // screen coords
  const [dropTarget, setDropTarget] = useState(null); // { col, row }
  const longPressTimer = useRef(null);
  const isDraggingRef = useRef(false);
  const queryClient = useQueryClient();

  const getColsRows = () => {
    if (!room) return { cols: 2, rows: 2 };
    if (room.layout === 'custom') return { cols: parseInt(room.custom_cols) || 2, rows: parseInt(room.custom_rows) || 2 };
    const [c, r] = (room.layout || '2x2').split('x').map(Number);
    return { cols: c || 2, rows: r || 2 };
  };
  const { cols, rows } = getColsRows();

  const cellSize = 80;
  const padding = 20;
  const svgW = cols * cellSize + padding * 2;
  const svgH = rows * cellSize + padding * 2 + 30;

  const plantMap = {};
  plants.forEach(p => {
    const parsed = parseLocation(p.location);
    if (parsed) plantMap[`${parsed.col}_${parsed.row}`] = p;
  });

  const canPan = scale > 1.05 && !draggingPlant;

  // Convert screen coords to SVG grid cell
  const screenToCell = useCallback((screenX, screenY) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const svgX = (screenX - rect.left - pan.x) / scale;
    const svgY = (screenY - rect.top - pan.y) / scale;
    // adjust for viewBox scaling
    const vbScaleX = svgW / rect.width * scale;
    const vbScaleY = svgH / rect.height * scale;
    const gx = (screenX - rect.left) / rect.width * svgW - pan.x / rect.width * svgW;
    const gy = (screenY - rect.top) / rect.height * svgH - pan.y / rect.height * svgH;
    const col = Math.floor((gx - padding) / cellSize);
    const row = Math.floor((gy - padding) / cellSize);
    if (col < 0 || col >= cols || row < 0 || row >= rows) return null;
    return { col, row };
  }, [scale, pan, svgW, svgH, cols, rows, cellSize, padding]);

  const handlePointerDownOnPlant = useCallback((e, plant) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    longPressTimer.current = setTimeout(() => {
      isDraggingRef.current = true;
      setDraggingPlant(plant);
      setDragPos({ x: startX, y: startY });
    }, 500);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (isDraggingRef.current && draggingPlant) {
      setDragPos({ x: e.clientX, y: e.clientY });
      const cell = screenToCell(e.clientX, e.clientY);
      setDropTarget(cell);
    } else if (isPanning.current && canPan) {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    }
  }, [draggingPlant, canPan, screenToCell]);

  const handlePointerUp = useCallback(async (e) => {
    clearTimeout(longPressTimer.current);

    if (isDraggingRef.current && draggingPlant && dropTarget) {
      const targetKey = `${dropTarget.col}_${dropTarget.row}`;
      const targetPlant = plantMap[targetKey];
      const newLocA = buildLocation(room, dropTarget.col, dropTarget.row);

      if (targetPlant && targetPlant.id !== draggingPlant.id) {
        // Swap positions
        const oldLocA = draggingPlant.location;
        await Promise.all([
          base44.entities.Plant.update(draggingPlant.id, { location: newLocA }),
          base44.entities.Plant.update(targetPlant.id, { location: oldLocA }),
        ]);
      } else if (!targetPlant) {
        await base44.entities.Plant.update(draggingPlant.id, { location: newLocA });
      }
      queryClient.invalidateQueries({ queryKey: ['plants'] });
    }

    isDraggingRef.current = false;
    setDraggingPlant(null);
    setDropTarget(null);
    isPanning.current = false;
  }, [draggingPlant, dropTarget, plantMap, room, queryClient]);

  const handlePointerDownOnBackground = useCallback((e) => {
    if (canPan) {
      isPanning.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  }, [canPan]);

  const handlePointerCancel = useCallback(() => {
    clearTimeout(longPressTimer.current);
    isDraggingRef.current = false;
    setDraggingPlant(null);
    setDropTarget(null);
    isPanning.current = false;
  }, []);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.85 : 1.15;
    setScale(s => {
      const next = Math.min(3, Math.max(1, s * delta));
      if (next <= 1.05) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const resetView = () => { setScale(1); setPan({ x: 0, y: 0 }); };

  // SVG container rect for drag ghost positioning
  const svgContainerRef = useRef(null);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-stone-100 to-green-50 border border-border" style={{ height: 320 }}>
      {/* Drag ghost overlay */}
      {draggingPlant && (
        <div
          style={{
            position: 'fixed',
            left: dragPos.x - 30,
            top: dragPos.y - 50,
            pointerEvents: 'none',
            zIndex: 9999,
            fontSize: 48,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
            transform: 'scale(1.2)',
          }}
        >
          🌿
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        <button onClick={() => setScale(s => Math.min(3, s * 1.2))}
          className="w-7 h-7 rounded-lg bg-white/80 backdrop-blur border border-border text-sm font-bold flex items-center justify-center hover:bg-white shadow-sm">+</button>
        <button onClick={() => { setScale(s => { const n = Math.max(1, s * 0.8); if (n <= 1.05) setPan({ x: 0, y: 0 }); return n; }); }}
          className="w-7 h-7 rounded-lg bg-white/80 backdrop-blur border border-border text-sm font-bold flex items-center justify-center hover:bg-white shadow-sm">−</button>
        {scale > 1.05 && (
          <button onClick={resetView} className="px-2 h-7 rounded-lg bg-white/80 backdrop-blur border border-border text-xs flex items-center justify-center hover:bg-white shadow-sm">Reset</button>
        )}
      </div>

      {/* Room label */}
      <div className="absolute top-2 left-2 z-10">
        <span className="bg-white/80 backdrop-blur border border-border text-xs font-semibold px-2 py-1 rounded-full text-foreground">
          🌿 {room?.name} · {cols}×{rows}
        </span>
      </div>

      {draggingPlant && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 bg-black/60 text-white text-xs px-3 py-1 rounded-full pointer-events-none">
          Trascina su una cella per spostare
        </div>
      )}

      {/* Canvas */}
      <div
        ref={svgContainerRef}
        className={`w-full h-full select-none ${canPan ? 'cursor-grab active:cursor-grabbing' : draggingPlant ? 'cursor-grabbing' : 'cursor-default'}`}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDownOnBackground}
        onWheel={onWheel}
        style={{ touchAction: 'none' }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: 'center',
            transition: isPanning.current ? 'none' : 'transform 0.15s ease',
          }}
        >
          {/* Floor */}
          <rect x={padding - 6} y={padding - 6} width={cols * cellSize + 12} height={rows * cellSize + 12}
            rx="10" fill="#f5f0e8" stroke="#d6d3d1" strokeWidth="2" />

          {/* Grid lines */}
          {Array.from({ length: cols + 1 }).map((_, i) => (
            <line key={`v${i}`} x1={padding + i * cellSize} y1={padding} x2={padding + i * cellSize} y2={padding + rows * cellSize} stroke="#e7e5e4" strokeWidth="1" strokeDasharray="3 3" />
          ))}
          {Array.from({ length: rows + 1 }).map((_, i) => (
            <line key={`h${i}`} x1={padding} y1={padding + i * cellSize} x2={padding + cols * cellSize} y2={padding + i * cellSize} stroke="#e7e5e4" strokeWidth="1" strokeDasharray="3 3" />
          ))}

          {/* Cells */}
          {Array.from({ length: rows }).map((_, row) =>
            Array.from({ length: cols }).map((_, col) => {
              const x = padding + col * cellSize;
              const y = padding + row * cellSize;
              const posKey = `${col}_${row}`;
              const colLetter = String.fromCharCode(65 + col);
              const label = `${colLetter}${row + 1}`;
              const plant = plantMap[posKey];
              const isDropTarget = dropTarget?.col === col && dropTarget?.row === row;

              return (
                <g key={posKey}>
                  {/* Drop target highlight */}
                  {isDropTarget && draggingPlant && (
                    <rect x={x + 2} y={y + 2} width={cellSize - 4} height={cellSize - 4} rx="8"
                      fill={plant ? 'hsl(42 70% 55% / 0.25)' : 'hsl(152 55% 28% / 0.2)'}
                      stroke={plant ? '#f59e0b' : 'hsl(var(--primary))'}
                      strokeWidth="2" strokeDasharray="5 3" />
                  )}

                  {plant ? (
                    <g
                      onPointerDown={(e) => handlePointerDownOnPlant(e, plant)}
                      onPointerUp={(e) => {
                        clearTimeout(longPressTimer.current);
                        if (!isDraggingRef.current && onPlantClick) onPlantClick(plant);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Hover highlight */}
                      <rect x={x + 2} y={y + 2} width={cellSize - 4} height={cellSize - 4} rx="8"
                        fill="transparent" stroke="transparent" strokeWidth="2"
                        onMouseEnter={e => { if (!draggingPlant) e.currentTarget.setAttribute('stroke', 'hsl(var(--primary))'); }}
                        onMouseLeave={e => e.currentTarget.setAttribute('stroke', 'transparent')}
                      />
                      <PlantSVG plant={plant} x={x} y={y} cellSize={cellSize}
                        isDragging={draggingPlant?.id === plant.id}
                        isDropTarget={false} />
                    </g>
                  ) : (
                    <>
                      <path d={`M ${x + cellSize * 0.32} ${y + cellSize * 0.6} Q ${x + cellSize * 0.27} ${y + cellSize * 0.8} ${x + cellSize * 0.32} ${y + cellSize * 0.8} L ${x + cellSize * 0.68} ${y + cellSize * 0.8} Q ${x + cellSize * 0.73} ${y + cellSize * 0.8} ${x + cellSize * 0.68} ${y + cellSize * 0.6} Z`}
                        fill="#d6d3d1" stroke="#a8a29e" strokeWidth="1" />
                      <text x={x + cellSize / 2} y={y + cellSize * 0.5} textAnchor="middle" fontSize="9" fill="#a8a29e">{label}</text>
                    </>
                  )}
                </g>
              );
            })
          )}

          {/* Wall frame */}
          <rect x={padding - 6} y={padding - 6} width={cols * cellSize + 12} height={rows * cellSize + 12}
            rx="10" fill="none" stroke="#78716c" strokeWidth="2.5" strokeDasharray="6 3" />

          {/* Legend */}
          {[
            { stage: 'seedling', label: 'Germinaz.' },
            { stage: 'vegetative', label: 'Vegetativo' },
            { stage: 'flowering', label: 'Fioritura' },
            { stage: 'harvesting', label: 'Raccolta' },
          ].map((item, i) => (
            <g key={item.stage} transform={`translate(${padding + i * (cols * cellSize / 4 + 4)}, ${padding + rows * cellSize + 14})`}>
              <rect width={8} height={8} rx="2" fill={STAGE_COLORS[item.stage].body} />
              <text x={11} y={7.5} fontSize="7.5" fill="#57534e" fontFamily="sans-serif">{item.label}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
