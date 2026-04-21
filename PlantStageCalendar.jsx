import React, { useState } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from 'lucide-react';

const STAGE_COLORS = {
  seedling:   'bg-emerald-100 text-emerald-700 border-emerald-300',
  vegetative: 'bg-green-100 text-green-700 border-green-300',
  flowering:  'bg-purple-100 text-purple-700 border-purple-300',
  harvesting: 'bg-amber-100 text-amber-700 border-amber-300',
};

const STAGE_LABELS = {
  seedling:   'Germinazione',
  vegetative: 'Vegetativo',
  flowering:  'Fioritura',
  harvesting: 'Raccolta (prevista)',
};

export default function PlantStageCalendar({ plant, daysOld }) {
  const [open, setOpen] = useState(false);

  if (!plant.plant_date) return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">Età</p>
        <p className="text-sm font-medium">—</p>
      </div>
    </div>
  );

  const plantDate = parseISO(plant.plant_date);

  // Build stage timeline
  const phases = [];
  phases.push({ stage: 'seedling', label: STAGE_LABELS.seedling, date: plantDate, day: 0 });

  if (plant.strain_type === 'autofiorente' || plant.strain_type === 'fotoperiodica') {
    const vegDay = plant.custom_veg_day ?? 10;
    phases.push({ stage: 'vegetative', label: STAGE_LABELS.vegetative, date: addDays(plantDate, vegDay), day: vegDay });
  }

  if (plant.strain_type === 'autofiorente') {
    const flowerDay = plant.custom_flower_day ?? 40;
    phases.push({ stage: 'flowering', label: STAGE_LABELS.flowering, date: addDays(plantDate, flowerDay), day: flowerDay });
    const floweringDays = plant.flowering_days_manual || (plant.genetics_info?.flowering_weeks_max ? plant.genetics_info.flowering_weeks_max * 7 : 63);
    const harvestDay = flowerDay + floweringDays;
    phases.push({ stage: 'harvesting', label: STAGE_LABELS.harvesting, date: addDays(plantDate, harvestDay), day: harvestDay });
  } else if (plant.strain_type === 'fotoperiodica') {
    // For photoperiod, flowering starts when user triggers it
    if (plant.flowering_start_date) {
      const flowerDate = parseISO(plant.flowering_start_date);
      phases.push({ stage: 'flowering', label: STAGE_LABELS.flowering, date: flowerDate, day: null });
      const floweringDays = plant.flowering_days_manual || (plant.genetics_info?.flowering_weeks_max ? plant.genetics_info.flowering_weeks_max * 7 : 63);
      phases.push({ stage: 'harvesting', label: STAGE_LABELS.harvesting, date: addDays(flowerDate, floweringDays), day: null });
    } else {
      // Placeholder: not yet in flowering
      phases.push({ stage: 'flowering', label: 'Fioritura (da avviare)', date: null, day: null });
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 hover:opacity-70 transition-opacity text-left">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Età</p>
            <p className="text-sm font-medium underline decoration-dotted cursor-pointer">Giorno {daysOld}</p>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start">
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Calendario Fasi — {plant.name}
        </h4>
        <div className="space-y-2">
          {phases.map((phase, i) => {
            const isPast = phase.date ? phase.date <= new Date() : false;
            const isCurrent = plant.stage === phase.stage;
            const isPending = !phase.date;
            return (
              <div key={i} className={`flex items-start gap-3 p-2 rounded-lg border ${isCurrent ? (STAGE_COLORS[phase.stage] || 'bg-purple-100 text-purple-700 border-purple-300') : isPast ? 'bg-muted/40 border-border text-muted-foreground' : 'bg-card border-dashed border-border text-muted-foreground'}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isCurrent ? 'bg-current' : isPast ? 'bg-muted-foreground' : 'bg-muted-foreground/40'}`} />
                <div>
                  <p className="text-xs font-semibold">{phase.label}</p>
                  <p className="text-xs opacity-75">
                    {phase.date
                      ? `${format(phase.date, 'dd MMM yyyy', { locale: it })}${phase.day !== null ? ` · Giorno ${phase.day}` : ''}`
                      : '—'}
                  </p>
                </div>
                {isCurrent && <span className="ml-auto text-[10px] font-bold">ATTUALE</span>}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
