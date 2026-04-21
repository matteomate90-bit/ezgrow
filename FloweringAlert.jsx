import React, { useEffect, useState } from 'react';
import { differenceInDays, parseISO, addDays } from 'date-fns';
import { AlertTriangle, X, Flower2 } from 'lucide-react';
import { Link } from 'react-router-dom';

function getHarvestDate(plant) {
  const floweringDays = plant.flowering_days_manual
    || (plant.genetics_info?.flowering_weeks_max ? Math.round(plant.genetics_info.flowering_weeks_max * 7) : null)
    || 63;

  if (plant.flowering_start_date) {
    return addDays(parseISO(plant.flowering_start_date), floweringDays);
  }
  if (plant.plant_date && plant.strain_type === 'autofiorente') {
    return addDays(parseISO(plant.plant_date), 40 + floweringDays);
  }
  return null;
}

export default function FloweringAlert({ plants }) {
  const [dismissed, setDismissed] = useState([]);

  const today = new Date();
  const urgentPlants = plants.filter(p => {
    if (p.status !== 'active') return false;
    if (p.stage !== 'flowering') return false;
    if (dismissed.includes(p.id)) return false;
    const harvestDate = getHarvestDate(p);
    if (!harvestDate) return false;
    const daysLeft = differenceInDays(harvestDate, today);
    return daysLeft >= 0 && daysLeft <= 7;
  });

  if (urgentPlants.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {urgentPlants.map(plant => {
        const harvestDate = getHarvestDate(plant);
        const daysLeft = differenceInDays(harvestDate, today);
        return (
          <div key={plant.id} className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Flower2 className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">
                ⚠️ {plant.name} — raccolta tra {daysLeft === 0 ? 'oggi!' : `${daysLeft} ${daysLeft === 1 ? 'giorno' : 'giorni'}!`}
              </p>
              <p className="text-xs text-amber-600">La fioritura sta per terminare. Controlla la pianta.</p>
            </div>
            <Link to={`/plants/${plant.id}`} className="text-xs font-medium text-amber-700 underline shrink-0">Vedi</Link>
            <button onClick={() => setDismissed(d => [...d, plant.id])} className="text-amber-500 hover:text-amber-700 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
