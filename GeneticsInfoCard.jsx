import React from 'react';
import { Card } from '@/components/ui/card';

export default function GeneticsInfoCard({ plant }) {
  const gi = plant?.genetics_info;
  if (!gi) return null;

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-3">🧬 Info Genetica</h3>
      <div className="space-y-2 text-sm">
        {(gi.sativa_pct != null || gi.indica_pct != null) && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Composizione</p>
            <div className="flex rounded-full overflow-hidden h-4 w-full">
              <div className="bg-green-400 flex items-center justify-center text-[9px] text-white font-bold" style={{ width: `${gi.sativa_pct || 0}%` }}>
                {gi.sativa_pct > 15 ? `${gi.sativa_pct}%` : ''}
              </div>
              <div className="bg-purple-400 flex items-center justify-center text-[9px] text-white font-bold" style={{ width: `${gi.indica_pct || 0}%` }}>
                {gi.indica_pct > 15 ? `${gi.indica_pct}%` : ''}
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Sativa {gi.sativa_pct}%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> Indica {gi.indica_pct}%</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          {gi.flowering_weeks_min != null && (
            <div className="bg-purple-50 rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground">🌸 Fioritura</p>
              <p className="text-sm font-semibold text-purple-700">{gi.flowering_weeks_min}–{gi.flowering_weeks_max} sett.</p>
            </div>
          )}
          {gi.thc_pct != null && (
            <div className="bg-green-50 rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground">🧪 THC</p>
              <p className="text-sm font-semibold text-green-700">{gi.thc_pct}%</p>
            </div>
          )}
          {gi.cbd_pct != null && (
            <div className="bg-blue-50 rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground">💊 CBD</p>
              <p className="text-sm font-semibold text-blue-700">{gi.cbd_pct}%</p>
            </div>
          )}
          {gi.height_cm_min != null && (
            <div className="bg-amber-50 rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground">📏 Altezza</p>
              <p className="text-sm font-semibold text-amber-700">{gi.height_cm_min}–{gi.height_cm_max} cm</p>
            </div>
          )}
          {gi.yield_indoor_g_m2 != null && (
            <div className="bg-orange-50 rounded-lg p-2 col-span-2">
              <p className="text-[10px] text-muted-foreground">⚖️ Resa indoor</p>
              <p className="text-sm font-semibold text-orange-700">~{gi.yield_indoor_g_m2} g/m²</p>
            </div>
          )}
        </div>

        {gi.description && (
          <p className="text-xs text-muted-foreground italic border-t border-border pt-2 mt-1">{gi.description}</p>
        )}
      </div>
    </Card>
  );
}
