import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import StageBadge from '../components/shared/StageBadge';
import PlantForm from '../components/plants/PlantForm';
import PlantStageCalendar from '../components/plants/PlantStageCalendar';
import PlantLocationMiniMap from '../components/plants/PlantLocationMiniMap';
import PlantPhotoCarousel from '../components/plants/PlantPhotoCarousel';
import FloweringTimer from '../components/plants/FloweringTimer';
import GeneticsInfoCard from '../components/plants/GeneticsInfoCard';
import NutrientAdvisor from '../components/plants/NutrientAdvisor';
import StageCalendarEditor from '../components/plants/StageCalendarEditor';
import CollapsibleCard from '../components/shared/CollapsibleCard';
import { computeStageAlerts, autoAdvanceAutoflowering, STAGES_ORDER } from '../hooks/usePlantStageScheduler';
import { differenceInDays, format, addDays, parseISO } from 'date-fns';
import { ArrowLeft, Pencil, Trash2, Beaker, Flower2, ChevronRight, ChevronLeft, CalendarDays, AlertTriangle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const STAGE_LABELS = { seedling: 'Germinazione', vegetative: 'Vegetativo', flowering: 'Fioritura', harvesting: 'Raccolta', drying: 'Essiccazione', curing: 'Stagionatura' };
const MEDIUM_LABELS = { soil: 'Terra', coco_coir: 'Cocco', hydroponics: 'Idroponica', aeroponics: 'Aeroponica', dwc: 'DWC', other: 'Altro' };

export default function PlantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [showCalendarEditor, setShowCalendarEditor] = useState(false);
  const [editingDay, setEditingDay] = useState(false);
  const [dayInput, setDayInput] = useState('');
  const [stageChanging, setStageChanging] = useState(false);

  const { data: plant, isLoading } = useQuery({
    queryKey: ['plant', id],
    queryFn: async () => {
      const plants = await base44.entities.Plant.filter({ id });
      return plants[0];
    },
  });

  const { data: journals = [] } = useQuery({
    queryKey: ['plant-journals', id],
    queryFn: () => base44.entities.JournalEntry.filter({ plant_id: id }, '-entry_date'),
  });

  const { data: growRooms = [] } = useQuery({
    queryKey: ['growRooms'],
    queryFn: () => base44.entities.GrowRoom.list('created_date'),
  });

  const { data: allPlants = [] } = useQuery({
    queryKey: ['plants'],
    queryFn: () => base44.entities.Plant.list(),
  });

  const { data: allEnvLogs = [] } = useQuery({
    queryKey: ['envLogs'],
    queryFn: () => base44.entities.EnvironmentLog.list('-log_date', 200),
  });

  const growRoom = growRooms.find(r => r.id === plant?.grow_room_id);
  const envLogs = plant?.grow_room_id
    ? allEnvLogs.filter(l => l.grow_room_id === plant.grow_room_id).slice(0, 20)
    : allEnvLogs.filter(l => l.plant_id === id).slice(0, 20);

  const toC = (f) => f != null ? Math.round((f - 32) * 5 / 9 * 10) / 10 : null;
  const chartData = [...envLogs].reverse().slice(-14).map(log => ({
    date: format(new Date(log.log_date), 'dd/MM') + (log.log_time ? ` ${log.log_time}` : ''),
    temp: toC(log.temperature),
    humidity: log.humidity,
    ph: log.ph,
  }));

  // Auto-advance autofiorente vegetative→flowering after vegDay+20 days
  useEffect(() => {
    if (plant && allPlants.length > 0) {
      autoAdvanceAutoflowering([plant], () => {
        queryClient.invalidateQueries({ queryKey: ['plant', id] });
        queryClient.invalidateQueries({ queryKey: ['plants'] });
      });
    }
  }, [plant?.id, plant?.stage, plant?.plant_date, plant?.custom_veg_day]);

  // Also update stage based on calendar whenever plant_date or custom days change
  useEffect(() => {
    if (!plant?.plant_date || plant.status !== 'active') return;
    if (!['fotoperiodica', 'autofiorente'].includes(plant.strain_type)) return;

    const today = new Date();
    const days = differenceInDays(today, parseISO(plant.plant_date));
    const vegDay = plant.custom_veg_day ?? 10;

    // If plant_date pushed forward and plant is in wrong early stage, correct it
    if (plant.stage === 'vegetative' && days < vegDay) {
      base44.entities.Plant.update(plant.id, { stage: 'seedling' })
        .then(() => queryClient.invalidateQueries({ queryKey: ['plant', id] }));
    }
  }, [plant?.plant_date, plant?.custom_veg_day]);

  // Set flowering_start_date when plant enters flowering
  useEffect(() => {
    if (plant && plant.stage === 'flowering' && !plant.flowering_start_date) {
      base44.entities.Plant.update(plant.id, {
        flowering_start_date: format(new Date(), 'yyyy-MM-dd')
      }).then(() => queryClient.invalidateQueries({ queryKey: ['plant', id] }));
    }
  }, [plant?.stage, plant?.id]);

  const handleDelete = async () => {
    await base44.entities.Plant.delete(plant.id);
    queryClient.invalidateQueries({ queryKey: ['plants'] });
    navigate('/plants');
  };

  const handleSetStage = async (newStage) => {
    setStageChanging(true);
    const updateData = { stage: newStage };
    if (newStage === 'flowering' && !plant.flowering_start_date) {
      updateData.flowering_start_date = format(new Date(), 'yyyy-MM-dd');
    }
    await base44.entities.Plant.update(plant.id, updateData);
    queryClient.invalidateQueries({ queryKey: ['plant', id] });
    queryClient.invalidateQueries({ queryKey: ['plants'] });
    setStageChanging(false);
  };

  // "Giorno X" editable: user sets day number → recalculate plant_date
  const handleSaveDay = async () => {
    const day = parseInt(dayInput);
    if (isNaN(day) || day < 0) return;
    const newDate = addDays(new Date(), -day);
    await base44.entities.Plant.update(plant.id, {
      plant_date: format(newDate, 'yyyy-MM-dd'),
    });
    queryClient.invalidateQueries({ queryKey: ['plant', id] });
    queryClient.invalidateQueries({ queryKey: ['plants'] });
    setEditingDay(false);
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-64" /><Skeleton className="h-32" /></div>;
  if (!plant) return <p className="text-center py-12 text-muted-foreground">Pianta non trovata</p>;

  const daysOld = plant.plant_date ? differenceInDays(new Date(), new Date(plant.plant_date)) : null;
  const floweringDays = plant.flowering_days_manual
    || (plant.genetics_info?.flowering_weeks_max ? Math.round(plant.genetics_info.flowering_weeks_max * 7) : null);

  // Stage navigation
  const currentStageIdx = STAGES_ORDER.indexOf(plant.stage);
  const prevStage = currentStageIdx > 0 ? STAGES_ORDER[currentStageIdx - 1] : null;
  const nextStage = currentStageIdx < STAGES_ORDER.length - 1 ? STAGES_ORDER[currentStageIdx + 1] : null;

  // Stage alerts for this single plant
  const stageAlerts = computeStageAlerts([plant]);
  const myAlert = stageAlerts[0]; // at most 1 for this plant

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate('/plants')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Indietro
      </Button>

      {/* Stage alert inline */}
      {myAlert && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border bg-green-50 border-green-200 text-green-800 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <div className="flex-1">
            La fase di <b>Germinazione</b> è terminata da <b>{myAlert.daysOverdue}</b> giorni.
            Valuta di avanzare a <b>{STAGE_LABELS[myAlert.suggestedStage]}</b>.
          </div>
          <button
            onClick={() => handleSetStage(myAlert.suggestedStage)}
            disabled={stageChanging}
            className="shrink-0 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
          >
            Avanza <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ===== MAIN COLUMN ===== */}
        <div className="lg:col-span-2 space-y-6">

          {/* Header Card */}
          <Card className="overflow-hidden">
            {plant.photo_url && (
              <div className="aspect-video bg-muted">
                <img src={plant.photo_url} alt={plant.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="font-display text-2xl font-semibold">{plant.name}</h1>
                    <StageBadge stage={plant.stage} />
                  </div>
                  {plant.genetics && (
                    <p className="text-muted-foreground text-sm">{plant.genetics}{plant.seed_bank ? ` · ${plant.seed_bank}` : ''}</p>
                  )}
                  {plant.strain_type && (
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{plant.strain_type === 'autofiorente' ? '🌀 Autofiorente' : '☀️ Fotoperiodica'}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Modifica
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eliminare la pianta?</AlertDialogTitle>
                        <AlertDialogDescription>Questa azione eliminerà definitivamente la pianta.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Elimina</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t">
                {/* Age — clickable to edit day */}
                {daysOld !== null && (
                  <div>
                    <PlantStageCalendar plant={plant} daysOld={daysOld} />
                    {editingDay ? (
                      <div className="mt-1.5 flex items-center gap-1">
                        <Input
                          type="number"
                          value={dayInput}
                          onChange={e => setDayInput(e.target.value)}
                          className="h-6 w-16 text-xs px-1"
                          placeholder="gg"
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveDay(); if (e.key === 'Escape') setEditingDay(false); }}
                        />
                        <button onClick={handleSaveDay} className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">✓</button>
                        <button onClick={() => setEditingDay(false)} className="text-xs text-muted-foreground">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingDay(true); setDayInput(String(daysOld)); }}
                        className="mt-1 text-xs text-primary hover:underline flex items-center gap-0.5"
                      >
                        ✏️ Giorno {daysOld}
                      </button>
                    )}
                    <button
                      onClick={() => setShowCalendarEditor(true)}
                      className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      <CalendarDays className="w-3 h-3" /> Modifica calendario
                    </button>
                  </div>
                )}

                {/* Medium */}
                {plant.medium && (
                  <div className="flex items-center gap-2">
                    <Beaker className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Substrato</p>
                      <p className="text-sm font-medium">{MEDIUM_LABELS[plant.medium] || plant.medium}</p>
                    </div>
                  </div>
                )}

                {/* Location mini map */}
                {plant.location && (
                  <div className="flex items-start gap-2 col-span-2">
                    <div className="mt-0.5">
                      <p className="text-xs text-muted-foreground mb-1">Posizione</p>
                      <PlantLocationMiniMap plant={plant} room={growRoom} />
                    </div>
                  </div>
                )}
              </div>

              {/* Stage navigation buttons */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Avanza / Torna di fase:</p>
                <div className="flex gap-2 flex-wrap">
                  {prevStage && (
                    <button
                      onClick={() => handleSetStage(prevStage)}
                      disabled={stageChanging}
                      className="flex items-center gap-1 text-xs border border-border rounded-lg px-2.5 py-1.5 text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <ChevronLeft className="w-3 h-3" /> {STAGE_LABELS[prevStage]}
                    </button>
                  )}
                  {/* Fotoperiodica vegetative→flowering manual */}
                  {plant.strain_type === 'fotoperiodica' && plant.stage === 'vegetative' && (
                    <button
                      onClick={() => handleSetStage('flowering')}
                      disabled={stageChanging}
                      className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg px-2.5 py-1.5 transition-colors"
                    >
                      <Flower2 className="w-3.5 h-3.5" /> Avanza a Fioritura <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                  {nextStage && !(plant.strain_type === 'fotoperiodica' && plant.stage === 'vegetative') && (
                    <button
                      onClick={() => handleSetStage(nextStage)}
                      disabled={stageChanging}
                      className="flex items-center gap-1 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-lg px-2.5 py-1.5 transition-colors"
                    >
                      {STAGE_LABELS[nextStage]} <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {plant.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">{plant.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Flowering Timer */}
          <FloweringTimer plant={plant} />

          {/* Nutrient Advisor */}
          <NutrientAdvisor plant={plant} />

          {/* Photo Carousel */}
          <CollapsibleCard title="Foto Diario" icon="📸">
            <PlantPhotoCarousel plant={plant} daysOld={daysOld} />
          </CollapsibleCard>

          {/* Env Chart */}
          {chartData.length > 1 && (
            <CollapsibleCard title={`Log Ambientali — ${growRoom?.name || 'Grow Room'}`} icon="🌡" defaultOpen={false}>
              <p className="text-xs text-muted-foreground mb-4">Ultime 14 rilevazioni della grow room</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                    <Line type="monotone" dataKey="temp" stroke="hsl(var(--chart-1))" name="Temp °C" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="humidity" stroke="hsl(var(--chart-3))" name="Umidità %" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ph" stroke="hsl(var(--chart-4))" name="pH" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CollapsibleCard>
          )}
        </div>

        {/* ===== SIDEBAR ===== */}
        <div className="space-y-5">
          <GeneticsInfoCard plant={plant} />

          <CollapsibleCard title="Diario" icon="📓" badge={journals.length > 0 ? String(journals.length) : undefined}>
            {journals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nessuna voce ancora</p>
            ) : (
              <div className="space-y-3">
                {journals.slice(0, 6).map(entry => (
                  <div key={entry.id} className="border-b border-border last:border-0 pb-2 last:pb-0">
                    <p className="text-sm font-medium">{entry.title}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(entry.entry_date), 'dd MMM yyyy')}</p>
                    {entry.content && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{entry.content}</p>}
                  </div>
                ))}
              </div>
            )}
          </CollapsibleCard>

          {envLogs.length > 0 && (
            <CollapsibleCard title="Ultime Rilevazioni" icon="🌡" defaultOpen={false}>
              <div className="space-y-2">
                {envLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="text-xs border-b border-border last:border-0 pb-2 last:pb-0">
                    <p className="text-muted-foreground">{format(new Date(log.log_date), 'dd/MM/yy')}{log.log_time ? ` ${log.log_time}` : ''}</p>
                    <div className="flex gap-2 mt-0.5 font-medium">
                      {log.temperature && <span>{toC(log.temperature)}°C</span>}
                      {log.humidity && <span>{log.humidity}%UR</span>}
                      {log.ph && <span>pH {log.ph}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleCard>
          )}
        </div>
      </div>

      {showEdit && (
        <PlantForm
          open={showEdit}
          onOpenChange={setShowEdit}
          plant={plant}
          growRooms={growRooms}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['plant', id] });
            queryClient.invalidateQueries({ queryKey: ['plants'] });
          }}
        />
      )}

      <StageCalendarEditor
        plant={plant}
        open={showCalendarEditor}
        onOpenChange={setShowCalendarEditor}
      />
    </div>
  );
}
