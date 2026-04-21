import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/shared/PageHeader';
import JournalForm from '../components/journal/JournalForm';
import EmptyState from '../components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, BookOpen, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Journal() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journals'],
    queryFn: () => base44.entities.JournalEntry.list('-entry_date'),
  });

  const { data: plants = [] } = useQuery({
    queryKey: ['plants'],
    queryFn: () => base44.entities.Plant.list(),
  });

  const getPlantName = (id) => plants.find(p => p.id === id)?.name || 'General';

  const handleDelete = async (id) => {
    await base44.entities.JournalEntry.delete(id);
    queryClient.invalidateQueries({ queryKey: ['journals'] });
  };

  return (
    <div>
      <PageHeader
        title="Diario di Coltivazione"
        description="Documenta il tuo percorso di crescita"
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nuova Voce
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nessuna voce nel diario"
          description="Inizia a documentare la tua coltivazione con foto e note."
          action={<Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" /> Nuova Voce</Button>}
        />
      ) : (
        <div className="space-y-4">
          {entries.map(entry => (
            <Card key={entry.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {entry.photo_url && (
                  <div className="sm:w-48 h-40 sm:h-auto bg-muted flex-shrink-0">
                    <img src={entry.photo_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{entry.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getPlantName(entry.plant_id)} · {format(new Date(entry.entry_date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => handleDelete(entry.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {entry.content && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{entry.content}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <JournalForm
        open={showForm}
        onOpenChange={setShowForm}
        plants={plants}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['journals'] })}
      />
    </div>
  );
}
