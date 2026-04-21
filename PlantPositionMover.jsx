import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, MoveRight } from 'lucide-react';

function parseLocation(loc) {
  if (!loc) return null;
  const parts = loc.split('-');
  if (parts.length !== 2) return null;
  const pos = parts[1];
  if (!pos || pos.length < 2) return null;
  const col = pos.charCodeAt(0) - 65;
  const row = parseInt(pos.slice(1)) - 1;
  return { col, row, layoutStr: parts[0] };
}

function buildLocation(room, col, row) {
  const layout = room.layout === 'custom'
    ? `${room.custom_cols || 2}x${room.custom_rows || 2}`
    : (room.layout || '2x2');
  return `${layout}-${String.fromCharCode(65 + col)}${row + 1}`;
}

function getColsRows(room) {
  if (!room) return { cols: 2, rows: 2 };
  if (room.layout === 'custom') return { cols: parseInt(room.custom_cols) || 2, rows: parseInt(room.custom_rows) || 2 };
  const [c, r] = (room.layout || '2x2').split('x').map(Number);
  return { cols: c || 2, rows: r || 2 };
}

export default function PlantPositionMover({ plant, room, allPlants, open, onOpenChange }) {
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  if (!plant || !room) return null;

  const { cols, rows } = getColsRows(room);
  const currentParsed = parseLocation(plant.location);

  // Occupied positions (excluding current plant)
  const occupiedSet = new Set(
    (allPlants || [])
      .filter(p => p.id !== plant.id && p.status === 'active' && p.grow_room_id === room.id && p.location)
      .map(p => {
        const parsed = parseLocation(p.location);
        return parsed ? `${parsed.col}_${parsed.row}` : null;
      })
      .filter(Boolean)
  );

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const newLoc = buildLocation(room, selected.col, selected.row);
    await base44.entities.Plant.update(plant.id, { location: newLoc });
    queryClient.invalidateQueries({ queryKey: ['plants'] });
    queryClient.invalidateQueries({ queryKey: ['plant', plant.id] });
    setSaving(false);
    setSelected(null);
    onOpenChange(false);
  };

  const cellSize = 54;
  const pad = 10;
  const svgW = cols * cellSize + pad * 2;
  const svgH = rows * cellSize + pad * 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sposta {plant.name}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground mb-2">
          Clicca su una cella vuota per spostare la pianta.
        </p>
        <div className="flex justify-center">
          <svg width={svgW} height={svgH} className="rounded-xl border border-border bg-stone-50">
            {Array.from({ length: rows }).map((_, row) =>
              Array.from({ length: cols }).map((_, col) => {
                const x = pad + col * cellSize;
                const y = pad + row * cellSize;
                const key = `${col}_${row}`;
                const label = `${String.fromCharCode(65 + col)}${row + 1}`;
                const isCurrentPlant = currentParsed && currentParsed.col === col && currentParsed.row === row;
                const isOccupied = occupiedSet.has(key);
                const isSelected = selected?.col === col && selected?.row === row;

                let fill = '#e7e5e4';
                let stroke = '#d6d3d1';
                let textFill = '#a8a29e';
                let cursor = 'pointer';

                if (isCurrentPlant) { fill = '#bbf7d0'; stroke = '#16a34a'; textFill = '#166534'; }
                else if (isOccupied) { fill = '#fecdd3'; stroke = '#f43f5e'; textFill = '#9f1239'; cursor = 'not-allowed'; }
                else if (isSelected) { fill = 'hsl(var(--primary))'; stroke = 'hsl(var(--primary))'; textFill = 'white'; }

                return (
                  <g key={key}
                    onClick={() => { if (!isOccupied && !isCurrentPlant) setSelected({ col, row }); }}
                    style={{ cursor }}
                  >
                    <rect
                      x={x + 3} y={y + 3}
                      width={cellSize - 6} height={cellSize - 6}
                      rx="8"
                      fill={fill}
                      stroke={stroke}
                      strokeWidth="1.5"
                    />
                    <text
                      x={x + cellSize / 2} y={y + cellSize / 2 + 1}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize="10" fill={textFill} fontWeight="600"
                    >
                      {isCurrentPlant ? '🌿' : isOccupied ? '🪴' : label}
                    </text>
                    {isCurrentPlant && (
                      <text x={x + cellSize / 2} y={y + cellSize - 6} textAnchor="middle" fontSize="7" fill="#166534">qui</text>
                    )}
                    {isSelected && (
                      <text x={x + cellSize / 2} y={y + cellSize - 6} textAnchor="middle" fontSize="7" fill="white">→ qui</text>
                    )}
                  </g>
                );
              })
            )}
          </svg>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground mt-2 justify-center">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 inline-block" /> Posizione attuale</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-200 inline-block" /> Occupata</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-stone-200 inline-block" /> Libera</span>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button disabled={!selected || saving} onClick={handleSave}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <MoveRight className="w-4 h-4 mr-1" />}
            Sposta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
