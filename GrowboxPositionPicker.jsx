import React, { useState } from 'react';
import { cn } from '@/lib/utils';

function buildPositions(cols, rows) {
  const positions = [];
  for (let r = 1; r <= rows; r++) {
    for (let c = 0; c < cols; c++) {
      const colLetter = String.fromCharCode(65 + c); // A, B, C...
      positions.push({ id: `${colLetter}${r}`, label: `${colLetter}${r}`, col: c, row: r - 1 });
    }
  }
  return positions;
}

export default function GrowboxPositionPicker({ room, value, onChange, occupiedPositions = new Set() }) {
  // Determine cols/rows from room
  const getColsRows = () => {
    if (!room) return { cols: 2, rows: 2, layoutKey: '2x2' };
    if (room.layout === 'custom') {
      const cols = parseInt(room.custom_cols) || 2;
      const rows = parseInt(room.custom_rows) || 2;
      return { cols, rows, layoutKey: `${cols}x${rows}` };
    }
    const [c, r] = (room.layout || '2x2').split('x').map(Number);
    return { cols: c || 2, rows: r || 2, layoutKey: room.layout || '2x2' };
  };

  const { cols, rows, layoutKey } = getColsRows();
  const positions = buildPositions(cols, rows);

  // Parse current value "layoutKey-PosId"
  const parseValue = (v) => {
    if (!v) return null;
    const parts = v.split('-');
    return parts.length === 2 ? parts[1] : null;
  };

  const [selectedPos, setSelectedPos] = useState(parseValue(value));

  const handlePosSelect = (posId) => {
    const fullKey = `${layoutKey}-${posId}`;
    if (occupiedPositions.has(fullKey)) return; // blocked
    setSelectedPos(posId);
    onChange(fullKey);
  };

  return (
    <div className="border-2 border-dashed border-border rounded-xl p-3 bg-muted/30">
      <div className="flex justify-center mb-2">
        <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Vista dall'alto — {room?.name}</span>
      </div>
      <div className="flex justify-center mb-3">
        <div className="w-8 h-8 rounded-full bg-yellow-200 border-2 border-yellow-400 flex items-center justify-center">
          <span className="text-xs">💡</span>
        </div>
      </div>
      <div
        className="grid gap-2 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          maxWidth: cols * 64 + (cols - 1) * 8,
        }}
      >
        {positions.map(pos => {
          const fullKey = `${layoutKey}-${pos.id}`;
          const isOccupied = occupiedPositions.has(fullKey);
          const isSelected = selectedPos === pos.id;
          return (
            <button
              key={pos.id}
              type="button"
              onClick={() => handlePosSelect(pos.id)}
              disabled={isOccupied}
              title={isOccupied ? 'Posizione occupata' : pos.label}
              className={cn(
                'aspect-square rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all',
                isSelected
                  ? 'bg-primary border-primary text-primary-foreground shadow-md scale-110'
                  : isOccupied
                    ? 'bg-red-50 border-red-300 text-red-400 cursor-not-allowed opacity-60'
                    : 'bg-card border-border hover:border-primary/60 hover:bg-primary/5 text-muted-foreground'
              )}
            >
              <div className="flex flex-col items-center gap-0.5">
                <div className={cn(
                  'w-5 h-5 rounded-full border-2',
                  isSelected ? 'border-primary-foreground bg-primary-foreground/20'
                  : isOccupied ? 'border-red-300 bg-red-100'
                  : 'border-muted-foreground bg-muted/40'
                )} />
                <span className="text-[9px] leading-none">{isOccupied ? '🚫' : pos.label}</span>
              </div>
            </button>
          );
        })}
      </div>
      {selectedPos && (
        <p className="text-center text-xs text-primary font-medium mt-3">
          Selezionato: {layoutKey} — Vaso {selectedPos}
        </p>
      )}
    </div>
  );
}
