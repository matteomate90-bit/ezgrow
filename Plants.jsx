import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/shared/PageHeader';
import PlantCard from '../components/plants/PlantCard';
import PlantForm from '../components/plants/PlantForm';
import EmptyState from '../components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Plus, Sprout } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import usePlantStageScheduler from '../hooks/usePlantStageScheduler';

export default function Plants() {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('active');
  const queryClient = useQueryClient();

  const { data: plants = [], isLoading } = useQuery({
    queryKey: ['plants'],
    queryFn: () => base44.entities.Plant.list('-created_date'),
  });

  const { data: growRooms = [] } = useQuery({
    queryKey: ['growRooms'],
    queryFn: () => base44.entities.GrowRoom.list('created_date'),
  });

  // Auto-advance plant stages based on dates
  usePlantStageScheduler(plants, () => queryClient.invalidateQueries({ queryKey: ['plants'] }));

  const filtered = filter === 'all' ? plants : plants.filter(p => p.status === filter);

  return (
    <div>
      <PageHeader
        title="Piante"
        description="Gestisci il tuo giardino indoor"
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Aggiungi Pianta
          </Button>
        }
      />

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="active">Attive</TabsTrigger>
          <TabsTrigger value="harvested">Raccolte</TabsTrigger>
          <TabsTrigger value="all">Tutte</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="Nessuna pianta"
          description="Inizia il tuo giardino indoor aggiungendo la prima pianta."
          action={<Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" /> Aggiungi Pianta</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(plant => <PlantCard key={plant.id} plant={plant} />)}
        </div>
      )}

      <PlantForm
        open={showForm}
        onOpenChange={setShowForm}
        growRooms={growRooms}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['plants'] })}
      />
    </div>
  );
}
