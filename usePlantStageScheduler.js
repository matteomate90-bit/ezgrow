import { differenceInDays, parseISO } from 'date-fns';
import { base44 } from '@/api/base44Client';

const STAGES_ORDER = ['seedling', 'vegetative', 'flowering', 'harvesting', 'drying', 'curing'];

/**
 * Returns stage alerts for UI display.
 * Auto-advances: autofiorente vegetative→flowering after (vegDay + 20) days from plant_date.
 *
 * Seedling→Vegetative: alert only (both strains), user confirms.
 * Vegetative→Flowering (autofiorente): auto-advance after vegDay+20 days.
 * Fotoperiodica flowering: manual only.
 */
export function computeStageAlerts(plants) {
  const alerts = [];
  if (!plants?.length) return alerts;
  const today = new Date();

  plants.forEach((plant) => {
    if (!plant.plant_date || plant.status !== 'active') return;
    if (!['fotoperiodica', 'autofiorente'].includes(plant.strain_type)) return;

    const days = differenceInDays(today, parseISO(plant.plant_date));
    const vegDay = plant.custom_veg_day ?? 10;

    if (plant.stage === 'seedling' && days >= vegDay) {
      alerts.push({ plant, suggestedStage: 'vegetative', daysOverdue: days - vegDay });
    }
    // fotoperiodica: alert for veg only, flowering is always manual
    if (plant.strain_type === 'fotoperiodica' && plant.stage === 'vegetative') {
      // no auto alert for flowering, handled by manual button
    }
  });

  return alerts;
}

/**
 * Auto-advances autofiorente vegetative→flowering after (vegDay + 20) days from plant_date.
 * Called from useEffect in pages that have all plants loaded.
 */
export async function autoAdvanceAutoflowering(plants, onUpdated) {
  if (!plants?.length) return;
  const today = new Date();

  for (const plant of plants) {
    if (!plant.plant_date || plant.status !== 'active') continue;
    if (plant.strain_type !== 'autofiorente') continue;
    if (plant.stage !== 'vegetative') continue;

    const days = differenceInDays(today, parseISO(plant.plant_date));
    const vegDay = plant.custom_veg_day ?? 10;
    const autoFlowerDay = vegDay + 20; // 20 days of vegetative

    if (days >= autoFlowerDay) {
      const today_str = new Date().toISOString().split('T')[0];
      await base44.entities.Plant.update(plant.id, {
        stage: 'flowering',
        flowering_start_date: plant.flowering_start_date || today_str,
      });
      if (onUpdated) onUpdated();
    }
  }
}

export default function usePlantStageScheduler(plants) {
  return computeStageAlerts(plants);
}

export { STAGES_ORDER };
