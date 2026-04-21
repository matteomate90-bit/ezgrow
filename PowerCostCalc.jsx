import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Lightbulb, Wrench } from 'lucide-react';

const DEFAULT_KWH = 0.26;

function calcWh(watt, hoursPerDay) {
  return (watt || 0) * (hoursPerDay || 0);
}

export default function PowerCostCalc({ room }) {
  const [kwhCost, setKwhCost] = useState(room?.kwh_cost || DEFAULT_KWH);

  if (!room) return null;

  const lightWh = calcWh(room.light_watt, room.light_hours_per_day);
  const appliancesWh = (room.appliances || []).reduce((sum, a) => sum + calcWh(a.watt, a.hours_per_day), 0);
  const totalWhDay = lightWh + appliancesWh;
  const totalKwhDay = totalWhDay / 1000;
  const costDay = totalKwhDay * kwhCost;
  const costMonth = costDay * 30;
  const costYear = costDay * 365;

  const rows = [];
  if (room.light_watt) {
    rows.push({
      icon: <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />,
      name: `Illuminazione (${room.light_type?.toUpperCase() || 'Lampada'})`,
      watt: room.light_watt,
      hours: room.light_hours_per_day,
      wh: lightWh,
    });
  }
  (room.appliances || []).forEach(a => {
    rows.push({
      icon: <Wrench className="w-3.5 h-3.5 text-muted-foreground" />,
      name: a.name,
      watt: a.watt,
      hours: a.hours_per_day,
      wh: calcWh(a.watt, a.hours_per_day),
    });
  });

  if (rows.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Calcolo Bolletta — {room.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">€/kWh</Label>
          <Input
            type="number"
            step="0.001"
            value={kwhCost}
            onChange={e => setKwhCost(parseFloat(e.target.value) || DEFAULT_KWH)}
            className="w-24 h-7 text-xs"
          />
        </div>
      </div>

      {/* Device breakdown */}
      <div className="space-y-1.5 mb-4">
        <div className="grid grid-cols-4 text-[10px] text-muted-foreground font-medium uppercase tracking-wide px-1 mb-1">
          <span className="col-span-2">Strumento</span>
          <span className="text-right">W · h/g</span>
          <span className="text-right">Wh/g</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-4 items-center bg-muted/40 rounded-lg px-3 py-1.5 text-sm">
            <div className="col-span-2 flex items-center gap-1.5">
              {r.icon}
              <span className="truncate">{r.name}</span>
            </div>
            <span className="text-right text-xs text-muted-foreground">{r.watt}W · {r.hours}h</span>
            <span className="text-right text-xs font-medium">{r.wh.toLocaleString('it-IT')} Wh</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-border pt-3 grid grid-cols-3 gap-3 text-center">
        <div className="bg-primary/5 rounded-xl p-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Al giorno</p>
          <p className="text-base font-bold text-primary">{costDay.toFixed(2)} €</p>
          <p className="text-[10px] text-muted-foreground">{totalKwhDay.toFixed(2)} kWh</p>
        </div>
        <div className="bg-primary/5 rounded-xl p-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Al mese</p>
          <p className="text-base font-bold text-primary">{costMonth.toFixed(2)} €</p>
          <p className="text-[10px] text-muted-foreground">{(totalKwhDay * 30).toFixed(1)} kWh</p>
        </div>
        <div className="bg-primary/5 rounded-xl p-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">All'anno</p>
          <p className="text-base font-bold text-primary">{costYear.toFixed(0)} €</p>
          <p className="text-[10px] text-muted-foreground">{(totalKwhDay * 365).toFixed(0)} kWh</p>
        </div>
      </div>
    </Card>
  );
}
