import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/shared/PageHeader';
import TaskForm from '../components/tasks/TaskForm';
import EmptyState from '../components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ClipboardList, Droplets, Leaf, Scissors, ArrowUpDown, Search, MoreHorizontal, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const typeIcons = {
  water: Droplets, feed: Leaf, prune: Scissors,
  transplant: ArrowUpDown, inspect: Search, harvest: Leaf, other: MoreHorizontal,
};

const typeColors = {
  water: 'bg-blue-100 text-blue-700',
  feed: 'bg-green-100 text-green-700',
  prune: 'bg-amber-100 text-amber-700',
  transplant: 'bg-purple-100 text-purple-700',
  inspect: 'bg-slate-100 text-slate-700',
  harvest: 'bg-emerald-100 text-emerald-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function Tasks() {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('pending');
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.GrowTask.list('-created_date'),
  });

  const { data: plants = [] } = useQuery({
    queryKey: ['plants'],
    queryFn: () => base44.entities.Plant.list(),
  });

  const toggleTask = useMutation({
    mutationFn: (task) => base44.entities.GrowTask.update(task.id, { completed: !task.completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteTask = useMutation({
    mutationFn: (id) => base44.entities.GrowTask.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const typeLabels = { water: 'Acqua', feed: 'Nutrimento', prune: 'Potatura', transplant: 'Trapianto', inspect: 'Ispezione', harvest: 'Raccolta', other: 'Altro' };
  const getPlantName = (id) => plants.find(p => p.id === id)?.name || 'Generale';

  const filtered = filter === 'all' ? tasks
    : filter === 'pending' ? tasks.filter(t => !t.completed)
    : tasks.filter(t => t.completed);

  return (
    <div>
      <PageHeader
        title="Attività"
        description="Tieni traccia di irrigazione, nutrimento e altro"
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nuova Attività
          </Button>
        }
      />

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="pending">In Sospeso</TabsTrigger>
          <TabsTrigger value="completed">Completate</TabsTrigger>
          <TabsTrigger value="all">Tutte</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={filter === 'pending' ? 'Tutto in ordine!' : 'Nessuna attività'}
          description="Crea attività per tenere il ritmo della tua coltivazione."
          action={<Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" /> Nuova Attività</Button>}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const Icon = typeIcons[task.type] || MoreHorizontal;
            return (
              <Card key={task.id} className="p-4 flex items-center gap-4">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTask.mutate(task)}
                  className="data-[state=checked]:bg-primary"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{getPlantName(task.plant_id)}</p>
                </div>
                <Badge variant="outline" className={`${typeColors[task.type] || ''} text-xs border-0`}>
                  <Icon className="w-3 h-3 mr-1" />
                  {typeLabels[task.type] || task.type}
                </Badge>
                {task.due_date && (
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {format(new Date(task.due_date), 'MMM d')}
                  </span>
                )}
                <Button
                  variant="ghost" size="icon"
                  onClick={() => deleteTask.mutate(task.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      <TaskForm
        open={showForm}
        onOpenChange={setShowForm}
        plants={plants}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
      />
    </div>
  );
}
