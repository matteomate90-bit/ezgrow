import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Upload, Loader2, ChevronLeft, ChevronRight, Camera, X } from 'lucide-react';

import { format } from 'date-fns';

const STAGES = [
  { value: 'seedling', label: 'Germinazione' },
  { value: 'vegetative', label: 'Vegetativo' },
  { value: 'flowering', label: 'Fioritura' },
  { value: 'harvesting', label: 'Raccolta' },
  { value: 'drying', label: 'Essiccazione' },
  { value: 'curing', label: 'Stagionatura' },
];

function PhotoForm({ open, onOpenChange, plantId, currentDayOld, currentStage, onSaved }) {
  const now = new Date();
  const [form, setForm] = useState({
    day_number: currentDayOld || '',
    stage: currentStage || 'seedling',
    photo_date: format(now, 'yyyy-MM-dd'),
    notes: '',
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setSaving(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.PlantPhoto.create({ ...form, plant_id: plantId, photo_url: file_url });
    setSaving(false);
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Aggiungi Foto</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Photo upload */}
          {/* Photo input — gallery or camera */}
          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer">
              <div className={`w-full h-40 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden ${preview ? '' : 'hover:bg-muted/50'}`}>
                {preview ? <img src={preview} className="w-full h-full object-cover rounded-xl" /> : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="w-8 h-8" />
                    <span className="text-sm text-center">Galleria / File</span>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
            <label className="cursor-pointer flex flex-col items-center justify-center gap-2 w-20 rounded-xl border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 text-muted-foreground transition-colors">
              <Camera className="w-6 h-6" />
              <span className="text-xs text-center">Fotocamera</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Giorno</Label>
              <Input type="number" value={form.day_number} onChange={e => setForm(f => ({ ...f, day_number: e.target.value }))} placeholder="Es. 14" />
            </div>
            <div>
              <Label>Fase</Label>
              <Select value={form.stage} onValueChange={v => setForm(f => ({ ...f, stage: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Data</Label>
              <Input type="date" value={form.photo_date} onChange={e => setForm(f => ({ ...f, photo_date: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Note</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Osservazioni..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit" disabled={saving || !file}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salva
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PlantPhotoCarousel({ plant, daysOld }) {
  const [current, setCurrent] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: photos = [] } = useQuery({
    queryKey: ['plant-photos', plant.id],
    queryFn: () => base44.entities.PlantPhoto.filter({ plant_id: plant.id }, '-photo_date'),
  });

  const handleDelete = async (photo) => {
    await base44.entities.PlantPhoto.delete(photo.id);
    queryClient.invalidateQueries({ queryKey: ['plant-photos', plant.id] });
    setCurrent(c => Math.max(0, c - 1));
  };

  const STAGE_LABELS = { seedling: 'Germinazione', vegetative: 'Vegetativo', flowering: 'Fioritura', harvesting: 'Raccolta', drying: 'Essiccazione', curing: 'Stagionatura' };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">📸 Foto Diario ({photos.length})</h3>
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
          <Camera className="w-3.5 h-3.5 mr-1" /> Aggiungi
        </Button>
      </div>

      {photos.length === 0 ? (
        <div className="h-40 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/20">
          <Camera className="w-8 h-8 opacity-40" />
          <p className="text-sm">Nessuna foto ancora</p>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
          <img
            src={photos[current]?.photo_url}
            alt={`Foto ${current + 1}`}
            className="w-full h-full object-contain"
          />
          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <div className="flex items-end justify-between">
              <div className="text-white text-xs space-y-0.5">
                {photos[current]?.day_number && <p className="font-semibold">Giorno {photos[current].day_number}</p>}
                {photos[current]?.stage && <p className="opacity-80">{STAGE_LABELS[photos[current].stage]}</p>}
                {photos[current]?.photo_date && (
                  <p className="opacity-70">
                    {photos[current].photo_date}
                    {photos[current].photo_time && ` · ${photos[current].photo_time}`}
                  </p>
                )}
                {photos[current]?.notes && <p className="opacity-70 italic">{photos[current].notes}</p>}
              </div>
              <button onClick={() => handleDelete(photos[current])} className="text-white/60 hover:text-white/90">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setCurrent(c => Math.max(0, c - 1))}
                disabled={current === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-20 flex items-center justify-center text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrent(c => Math.min(photos.length - 1, c + 1))}
                disabled={current === photos.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-20 flex items-center justify-center text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {/* Dots */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1">
                {photos.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-white' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <PhotoForm
        open={showForm}
        onOpenChange={setShowForm}
        plantId={plant.id}
        currentDayOld={daysOld}
        currentStage={plant.stage}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['plant-photos', plant.id] });
          setCurrent(0);
        }}
      />
    </div>
  );
}
