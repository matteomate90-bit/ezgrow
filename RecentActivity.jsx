import React from 'react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { BookOpen } from 'lucide-react';

export default function RecentActivity({ entries, plants }) {
  const getPlantName = (id) => plants.find(p => p.id === id)?.name || 'General';

  return (
    <Card className="p-5">
      <h3 className="font-display text-lg font-semibold mb-4">Diario Recente</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Nessuna nota nel diario</p>
      ) : (
        <div className="space-y-4">
          {entries.slice(0, 4).map((entry) => (
            <div key={entry.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{entry.title}</p>
                <p className="text-xs text-muted-foreground">
                  {getPlantName(entry.plant_id)} · {format(new Date(entry.entry_date), 'MMM d')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
