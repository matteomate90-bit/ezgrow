import React from 'react';
import { differenceInDays, parseISO, addDays, format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Flower2, Clock } from 'lucide-react';

export default function FloweringTimer({ plant }) {
  if (plant.stage !== 'flowering' && plant.stage !== 'harvesting') return null;

  const floweringDays = plant.flowering_days_manual
    || (plant.genetics_info?.flowering_weeks_max ? Math.round(plant.genetics_info.flowering_weeks_max * 7) : null)
    || (plant.genetics_info?.flowering_weeks_min ? Math.round(plant.genetics_info.flowering_weeks_min * 7) + 7 : null)
    || 63;

  // Start date: use flowering_start_date if available, else estimate from plant_date + 40 days (auto) or manual
  let startDate = null;
  if (plant.flowering_start_date) {
    startDate = parseISO(plant.flowering_start_date);
  } else if (plant.plant_date && plant.strain_type === 'autofiorente') {
    startDate = addDays(parseISO(plant.plant_date), 40);
  } else if (plant.plant_date) {
    startDate = parseISO(plant.plant_date); // fallback
  }

  if (!startDate) return null;

  const today = new Date();
  const harvestDate = addDays(startDate, floweringDays);
  const daysElapsed = differenceInDays(today, startDate);
  const daysLeft = differenceInDays(harvestDate, today);
  const progress = Math.min(100, Math.max(0, (daysElapsed / floweringDays) * 100));
  const isLate = daysLeft < 0;
  const isUrgent = daysLeft >= 0 && daysLeft <= 7;

  return (
    <div className={`rounded-xl border p-4 ${isUrgent ? 'border-amber-400 bg-amber-50' : isLate ? 'border-red-300 bg-red-50' : 'border-purple-200 bg-purple-50'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Flower2 className={`w-4 h-4 ${isUrgent ? 'text-amber-600' : isLate ? 'text-red-600' : 'text-purple-600'}`} />
        <span className="text-sm font-semibold text-foreground">Timer Fioritura</span>
        {isUrgent && <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">⚠️ Raccolta vicina!</span>}
        {isLate && <span className="ml-auto text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Raccolta in ritardo</span>}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-purple-100 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all ${isUrgent ? 'bg-amber-500' : isLate ? 'bg-red-500' : 'bg-purple-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Giorno {Math.max(0, daysElapsed)} / {floweringDays}
        </span>
        <span>
          {isLate
            ? `${Math.abs(daysLeft)}gg oltre il previsto`
            : `${daysLeft}gg alla raccolta`}
        </span>
      </div>

      <p className="text-xs text-muted-foreground mt-1">
        Raccolta prevista: <b>{format(harvestDate, 'dd MMM yyyy', { locale: it })}</b>
      </p>
    </div>
  );
}
