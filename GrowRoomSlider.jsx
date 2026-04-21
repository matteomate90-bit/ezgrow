import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import CartoonGrowRoom from '../environment/CartoonGrowRoom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function GrowRoomSlider({ growRooms, plants, allPlants }) {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  if (!growRooms.length) return null;

  const room = growRooms[current];
  const roomPlants = plants.filter(p => p.grow_room_id === room.id && p.status === 'active');

  return (
    <Card className="mb-6 p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Vista Grow Room
        </h2>
        {growRooms.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrent(c => Math.max(0, c - 1))}
              disabled={current === 0}
              className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground font-medium">{current + 1} / {growRooms.length}</span>
            <button
              onClick={() => setCurrent(c => Math.min(growRooms.length - 1, c + 1))}
              disabled={current === growRooms.length - 1}
              className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="flex gap-1 ml-1">
              {growRooms.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-primary' : 'bg-border'}`} />
              ))}
            </div>
          </div>
        )}
      </div>

      <CartoonGrowRoom
        room={room}
        plants={roomPlants}
        allPlants={allPlants || plants}
        onPlantClick={(plant) => navigate(`/plants/${plant.id}`)}
      />

      {roomPlants.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Clicca per i dettagli · Tieni premuto e trascina per spostare una pianta
        </p>
      )}
    </Card>
  );
}
