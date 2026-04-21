import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar, Info } from 'lucide-react';
import { format, addDays, parseISO, differenceInDays } from 'date-fns';

export default function StageCalendarEditor({ plant, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    plant_date: plant?.plant_date || '',
    veg_day: plant?.custom_veg_day ?? 10,
    flower_day: plant?.custom_flower_day ?? 40, // autofiorente only
    flowering_days_manual: plant?.flowering_days_manual ?? '',
    flowering_start_date: plant?.flowering_start_date || '',
  });

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    const updateData = {
      plant_date: form.plant_date || undefined,
      flowering_days_manual: form.flowering_days_manual ? parseInt(form.flowering_days_manual) : undefined,
      flowering_start_date: form.flowering_start_date || undefined,
      custom_veg_day: form.veg_day !== '' ? parseInt(form.veg_day) : undefined,
    };
    if (plant?.strain_type === 'autofiorente') {
      updateData.custom_flower_day = form.flower_day !== '' ? parseInt(form.flower_day) : undefined;
    }

    // Auto-update stage based on new calendar values
    if (form.plant_date && plant?.strain_type) {
      const today = new Date();
      const days = differenceInDays(today, parseISO(form.plant_date));
      const vegDay = updateData.custom_veg_day ?? plant.custom_veg_day ?? 10;
      const flowerDay = updateData.custom_flower_day ?? plant.custom_flower_day ?? 40;

      if (plant.strain_type === 'autofiorente') {
        const autoFlowerDay = vegDay + 20;
        if (days >= autoFlowerDay) {
          updateData.stage = 'flowering';
          if (!form.flowering_start_date && !plant.flowering_start_date) {
            updateData.flowering_start_date = format(today, 'yyyy-MM-dd');
          }
        } else if (days >= vegDay) {
          updateData.stage = 'vegetative';
        } else {
          updateData.stage = 'seedling';
        }
      } else if (plant.strain_type === 'fotoperiodica') {
        if (plant.stage !== 'flowering' && plant.stage !== 'harvesting' && plant.stage !== 'drying' && plant.stage !== 'curing') {
          if (days >= vegDay) {
            // Only auto-set to vegetative from seedling; don't regress from flowering
            if (plant.stage === 'seedling') updateData.stage = 'vegetative';
          } else {
            updateData.stage = 'seedling';
          }
        }
      }
    }

    await base44.entities.Plant.update(plant.id, updateData);
    queryClient.invalidateQueries({ queryKey: ['plant', plant.id] });
    queryClient.invalidateQueries({ queryKey: ['plants'] });
    setSaving(false);
    onOpenChange(false);
  };

  // Preview computed dates
  const plantDate = form.plant_date ? parseISO(form.plant_date) : null;
  const vegDate = plantDate && form.veg_day !== '' ? addDays(plantDate, parseInt(form.veg_day) || 10) : null;
  const flowerDate = plant?.strain_type === 'autofiorente' && plantDate && form.flower_day !== ''
    ? addDays(plantDate, parseInt(form.flower_day) || 40) : null;
  const fotoFlowerDate = plant?.strain_type === 'fotoperiodica' && form.flowering_start_date
    ? parseISO(form.flowering_start_date) : null;
  const floweringDays = form.flowering_days_manual ? parseInt(form.flowering_days_manual) : (plant?.genetics_info?.flowering_weeks_max ? plant.genetics_info.flowering_weeks_max * 7 : 63);
  const harvestDate = (flowerDate || fotoFlowerDate) ? addDays(flowerDate || fotoFlowerDate, floweringDays) : null;

  if (!plant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Modifica Calendario Fasi — {plant.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Data semina */}
          <div>
            <Label>📅 Data di Semina / Inizio Coltivazione</Label>
            <Input type="date" value={form.plant_date} onChange={e => handleChange('plant_date', e.target.value)} className="mt-1" />
          </div>

          {/* Giorno passaggio vegetativo */}
          <div>
            <Label>🌱 Giorno Inizio Vegetativo (da semina)</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input type="number" min="1" max="60" value={form.veg_day}
                onChange={e => handleChange('veg_day', e.target.value)}
                className="w-24" placeholder="10" />
              <span className="text-xs text-muted-foreground">
                {vegDate ? `→ ${format(vegDate, 'dd/MM/yyyy')}` : ''}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Default: 10 giorni dalla semina</p>
          </div>

          {/* Autofiorente: giorno fioritura */}
          {plant.strain_type === 'autofiorente' && (
            <div>
              <Label>🌸 Giorno Inizio Fioritura Automatica (da semina)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input type="number" min="20" max="120" value={form.flower_day}
                  onChange={e => handleChange('flower_day', e.target.value)}
                  className="w-24" placeholder="40" />
                <span className="text-xs text-muted-foreground">
                  {flowerDate ? `→ ${format(flowerDate, 'dd/MM/yyyy')}` : ''}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Default: 40 giorni dalla semina</p>
            </div>
          )}

          {/* Fotoperiodica: data inizio fioritura manuale */}
          {plant.strain_type === 'fotoperiodica' && (
            <div>
              <Label>🌸 Data Inizio Fioritura (cambio luci)</Label>
              <Input type="date" value={form.flowering_start_date}
                onChange={e => handleChange('flowering_start_date', e.target.value)} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Imposta quando hai cambiato il fotoperiodo a 12/12h</p>
            </div>
          )}

          {/* Giorni di fioritura */}
          <div>
            <Label>⏱ Durata Fioritura (giorni)</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input type="number" min="30" max="150" value={form.flowering_days_manual}
                onChange={e => handleChange('flowering_days_manual', e.target.value)}
                className="w-24" placeholder={plant.genetics_info?.flowering_weeks_max
                  ? `${Math.round(plant.genetics_info.flowering_weeks_max * 7)}`
                  : '63'} />
              <span className="text-xs text-muted-foreground">
                {harvestDate ? `→ Raccolta: ${format(harvestDate, 'dd/MM/yyyy')}` : ''}
              </span>
            </div>
            {plant.genetics_info?.flowering_weeks_max && (
              <p className="text-xs text-muted-foreground mt-1">
                Da genetica: ~{Math.round(plant.genetics_info.flowering_weeks_max * 7)} giorni ({plant.genetics_info.flowering_weeks_max} settimane)
              </p>
            )}
          </div>

          {/* Preview timeline */}
          {plantDate && (
            <div className="bg-muted/40 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground mb-2">📅 Anteprima Calendario:</p>
              {[
                { label: '🌱 Semina', date: plantDate, day: 0 },
                { label: '🍃 Vegetativo', date: vegDate, day: parseInt(form.veg_day) || 10 },
                ...(plant.strain_type === 'autofiorente' && flowerDate ? [{ label: '🌸 Fioritura (auto)', date: flowerDate, day: parseInt(form.flower_day) || 40 }] : []),
                ...(plant.strain_type === 'fotoperiodica' && fotoFlowerDate ? [{ label: '🌸 Fioritura (manuale)', date: fotoFlowerDate, day: null }] : []),
                ...(harvestDate ? [{ label: '🌾 Raccolta prevista', date: harvestDate, day: null }] : []),
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span>{item.label}</span>
                  <span className="text-muted-foreground">
                    {item.date ? format(item.date, 'dd/MM/yyyy') : '—'}
                    {item.day !== null && item.day !== undefined ? ` (gg ${item.day})` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-700">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>Salvando, la fase attuale verrà aggiornata automaticamente in base al calendario ricalcolato.</span>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Salva Calendario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
