import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ChevronRight, Leaf, Flower2, X, Clock } from 'lucide-react';

const STAGE_LABELS = {
  vegetative: 'Vegetativo',
  flowering: 'Fioritura',
};

const STAGE_ICONS = {
  vegetative: Leaf,
  flowering: Flower2,
};

const STAGE_COLORS = {
  vegetative: 'bg-green-50 border-green-200 text-green-800',
  flowering: 'bg-purple-50 border-purple-200 text-purple-800',
};

const STAGE_BTN = {
  vegetative: 'bg-green-600 hover:bg-green-700 text-white',
  flowering: 'bg-purple-600 hover:bg-purple-700 text-white',
};

export default function StageAdvanceAlerts({ stageAlerts, onAdvanced }) {
  const [dismissed, setDismissed] = useState([]);
  const [advancing, setAdvancing] = useState(null);
  const queryClient = useQueryClient();

  const visible = stageAlerts.filter(a => !dismissed.includes(a.plant.id + '_' + a.suggestedStage));
  if (!visible.length) return null;

  const handleAdvance = async (alert) => {
    setAdvancing(alert.plant.id);
    const updateData = { stage: alert.suggestedStage };
    if (alert.suggestedStage === 'flowering' && !alert.plant.flowering_start_date) {
      updateData.flowering_start_date = format(new Date(), 'yyyy-MM-dd');
    }
    await base44.entities.Plant.update(alert.plant.id, updateData);
    queryClient.invalidateQueries({ queryKey: ['plants'] });
    queryClient.invalidateQueries({ queryKey: ['plant', alert.plant.id] });
    setAdvancing(null);
    if (onAdvanced) onAdvanced();
  };

  const dismiss = (plant, stage) => {
    setDismissed(d => [...d, plant.id + '_' + stage]);
  };

  return (
    <div className="space-y-2 mb-5">
      {visible.map((alert) => {
        const Icon = STAGE_ICONS[alert.suggestedStage] || Leaf;
        const colors = STAGE_COLORS[alert.suggestedStage] || STAGE_COLORS.vegetative;
        const btnColors = STAGE_BTN[alert.suggestedStage] || STAGE_BTN.vegetative;
        return (
          <div key={alert.plant.id + alert.suggestedStage}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colors} text-sm`}>
            <Icon className="w-4 h-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-semibold">{alert.plant.name}</span>
              {' '}è pronta per avanzare a{' '}
              <span className="font-semibold">{STAGE_LABELS[alert.suggestedStage]}</span>
              {alert.daysOverdue > 0 && (
                <span className="ml-1 text-xs opacity-70 inline-flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />+{alert.daysOverdue} giorni
                </span>
              )}
            </div>
            <button
              onClick={() => handleAdvance(alert)}
              disabled={advancing === alert.plant.id}
              className={`shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${btnColors}`}
            >
              {advancing === alert.plant.id ? 'Aggiorno...' : `Avanza`}
              <ChevronRight className="w-3 h-3" />
            </button>
            <button onClick={() => dismiss(alert.plant, alert.suggestedStage)}
              className="shrink-0 opacity-50 hover:opacity-80 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
