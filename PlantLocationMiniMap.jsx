import React from 'react';

function parseLocation(loc) {
  if (!loc) return null;
  const parts = loc.split('-');
  if (parts.length !== 2) return null;
  const layoutStr = parts[0];
  const pos = parts[1];
  if (!pos || pos.length < 2) return null;
  const col = pos.charCodeAt(0) - 65;
  const row = parseInt(pos.slice(1)) - 1;
  return { layoutStr, col, row };
}

function getColsRows(room, layoutStr) {
  if (room) {
    if (room.layout === 'custom') return { cols: parseInt(room.custom_cols) || 2, rows: parseInt(room.custom_rows) || 2 };
    const [c, r] = (room.layout || '2x2').split('x').map(Number);
    return { cols: c || 2, rows: r || 2 };
  }
  if (layoutStr) {
    const [c, r] = layoutStr.split('x').map(Number);
    return { cols: c || 2, rows: r || 2 };
  }
  return { cols: 2, rows: 2 };
}

export default function PlantLocationMiniMap({ plant, room }) {
  const parsed = parseLocation(plant?.location);
  if (!parsed) return <p className="text-sm font-medium text-muted-foreground">—</p>;

  const { col: plantCol, row: plantRow, layoutStr } = parsed;
  const { cols, rows } = getColsRows(room, layoutStr);

  const cellSize = 22;
  const pad = 8;
  const W = cols * cellSize + pad * 2;
  const H = rows * cellSize + pad * 2;

  return (
    <div className="flex flex-col items-start gap-1">
      <svg width={W} height={H} className="rounded-lg border border-border bg-stone-50 shadow-sm">
        {/* Grid */}
        {Array.from({ length: rows }).map((_, row) =>
          Array.from({ length: cols }).map((_, col) => {
            const isPlant = col === plantCol && row === plantRow;
            const x = pad + col * cellSize;
            const y = pad + row * cellSize;
            const label = `${String.fromCharCode(65 + col)}${row + 1}`;
            return (
              <g key={`${col}_${row}`}>
                <rect
                  x={x + 2} y={y + 2}
                  width={cellSize - 4} height={cellSize - 4}
                  rx="4"
                  fill={isPlant ? 'hsl(var(--primary))' : '#e7e5e4'}
                  stroke={isPlant ? 'hsl(var(--primary))' : '#d6d3d1'}
                  strokeWidth="1"
                />
                {isPlant ? (
                  <text x={x + cellSize / 2} y={y + cellSize / 2 + 1} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="white" fontWeight="bold">🌿</text>
                ) : (
                  <text x={x + cellSize / 2} y={y + cellSize / 2 + 1} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="#a8a29e">{label}</text>
                )}
              </g>
            );
          })
        )}
      </svg>
      <p className="text-[10px] text-muted-foreground">{plant.location}</p>
    </div>
  );
}
