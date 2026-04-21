import React from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { Droplets, Leaf, Scissors, ArrowUpDown, Search, MoreHorizontal } from 'lucide-react';

const typeIcons = {
  water: Droplets,
  feed: Leaf,
  prune: Scissors,
  transplant: ArrowUpDown,
  inspect: Search,
  harvest: Leaf,
  other: MoreHorizontal,
};

export default function UpcomingTasks({ tasks, plants, onToggle }) {
  const getPlantName = (id) => plants.find(p => p.id === id)?.name || 'General';

  return (
    <Card className="p-5">
      <h3 className="font-display text-lg font-semibold mb-4">Prossime Attività</h3>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Nessuna attività in sospeso</p>
      ) : (
        <div className="space-y-3">
          {tasks.slice(0, 5).map((task) => {
            const Icon = typeIcons[task.type] || MoreHorizontal;
            return (
              <div key={task.id} className="flex items-center gap-3 group">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => onToggle(task)}
                  className="data-[state=checked]:bg-primary"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{getPlantName(task.plant_id)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  {task.due_date && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(task.due_date), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
