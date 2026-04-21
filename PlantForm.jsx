import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2, Search, AlertCircle, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import GrowboxPositionPicker from './GrowboxPositionPicker';

const stages = [
  { value: 'seedling', label: 'Germinazione' },
  { value: 'vegetative', label: 'Vegetativo' },
  { value: 'flowering', label: 'Fioritura' },
  { value: 'harvesting', label: 'Raccolta' },
  { value: 'drying', label: 'Essiccazione' },
  { value: 'curing', label: 'Stagionatura' },
];
const mediums = [
  { value: 'soil', label: 'Terra' },
  { value: 'coco_coir', label: 'Cocco' },
  { value: 'hydroponics', label: 'Idroponica' },
  { value: 'aeroponics', label: 'Aeroponica' },
  { value: 'dwc', label: 'DWC' },
  { value: 'other', label: 'Altro' },
];

export default function PlantForm({ open, onOpenChange, plant, growRooms = [], onSaved }) {
  const { data: allPlants = [] } = useQuery({
    queryKey: ['plants'],
    queryFn: () => base44.entities.Plant.list(),
  });

  const [form, setForm] = useState(plant || {
    name: '', strain_type: '', genetics: '', seed_bank: '', genetics_info: null,
    stage: 'seedling', plant_date: '', grow_room_id: '', location: '', medium: 'soil', notes: '', status: 'active'
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingGenetics, setFetchingGenetics] = useState(false);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    handleChange('photo_url', file_url);
    setUploading(false);
  };

  const handleFetchGenetics = async () => {
    if (!form.genetics) return;
    setFetchingGenetics(true);
    const prompt = `Trova le informazioni di coltivazione per la varietà di cannabis "${form.genetics}"${form.seed_bank ? ` della banca semi "${form.seed_bank}"` : ''}. Rispondi SOLO con JSON valido.`;
    const info = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          sativa_pct: { type: 'number', description: 'Percentuale sativa (0-100)' },
          indica_pct: { type: 'number', description: 'Percentuale indica (0-100)' },
          flowering_weeks_min: { type: 'number' },
          flowering_weeks_max: { type: 'number' },
          height_cm_min: { type: 'number' },
          height_cm_max: { type: 'number' },
          thc_pct: { type: 'number' },
          cbd_pct: { type: 'number' },
          yield_indoor_g_m2: { type: 'number' },
          description: { type: 'string' },
        }
      }
    });
    handleChange('genetics_info', info);
    setFetchingGenetics(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (plant?.id) {
      await base44.entities.Plant.update(plant.id, form);
    } else {
      await base44.entities.Plant.create(form);
    }
    setSaving(false);
    onSaved();
    onOpenChange(false);
  };

  const selectedRoom = growRooms.find(r => r.id === form.grow_room_id);

  // Build set of occupied positions in selected room (excluding current plant)
  const occupiedPositions = new Set(
    allPlants
      .filter(p => p.grow_room_id === form.grow_room_id && p.id !== plant?.id && p.status === 'active' && p.location)
      .map(p => p.location)
  );
  const gi = form.genetics_info;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{plant?.id ? 'Modifica Pianta' : 'Aggiungi Nuova Pianta'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* BASE */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => handleChange('name', e.target.value)} required placeholder="La mia pianta" />
            </div>

            {/* Strain type */}
            <div>
              <Label>Tipo</Label>
              <Select value={form.strain_type || ''} onValueChange={v => handleChange('strain_type', v)}>
                <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fotoperiodica">Fotoperiodica</SelectItem>
                  <SelectItem value="autofiorente">Autofiorente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stage */}
            <div>
              <Label>Stadio</Label>
              <Select value={form.stage} onValueChange={v => handleChange('stage', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {stages.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Auto-schedule info */}
            {form.strain_type && (
              <div className="col-span-2 flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-xs text-muted-foreground">
                <Info className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                {form.strain_type === 'autofiorente'
                  ? 'Autofiorente: vegetativo automatico dopo 10gg, fioritura dopo 40gg dalla semina.'
                  : 'Fotoperiodica: vegetativo automatico dopo 10gg dalla semina. La fioritura va gestita manualmente.'}
              </div>
            )}

            {/* Genetics */}
            <div>
              <Label>Genetica (strain)</Label>
              <Input value={form.genetics} onChange={e => handleChange('genetics', e.target.value)} placeholder="Es. White Widow" />
            </div>
            <div>
              <Label>Banca semi</Label>
              <Input value={form.seed_bank} onChange={e => handleChange('seed_bank', e.target.value)} placeholder="Es. Royal Queen Seeds" />
            </div>

            {/* Fetch genetics button */}
            {form.genetics && (
              <div className="col-span-2">
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleFetchGenetics} disabled={fetchingGenetics}>
                  {fetchingGenetics ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                  {fetchingGenetics ? 'Ricerca in corso...' : 'Recupera info genetica automaticamente'}
                </Button>
              </div>
            )}

            {/* Genetics info display */}
            {gi && (
              <div className="col-span-2 bg-muted/50 rounded-xl p-3 text-xs space-y-1.5">
                <p className="font-semibold text-sm text-foreground mb-1">📊 Info genetica</p>
                {(gi.sativa_pct != null || gi.indica_pct != null) && (
                  <p>🌿 <b>Sativa</b> {gi.sativa_pct}% · <b>Indica</b> {gi.indica_pct}%</p>
                )}
                {(gi.flowering_weeks_min != null) && (
                  <p>🌸 <b>Fioritura:</b> {gi.flowering_weeks_min}–{gi.flowering_weeks_max} settimane</p>
                )}
                {(gi.height_cm_min != null) && (
                  <p>📏 <b>Altezza:</b> {gi.height_cm_min}–{gi.height_cm_max} cm</p>
                )}
                {gi.thc_pct != null && (
                  <p>🧪 <b>THC:</b> {gi.thc_pct}% · <b>CBD:</b> {gi.cbd_pct}%</p>
                )}
                {gi.yield_indoor_g_m2 != null && (
                  <p>⚖️ <b>Resa indoor:</b> ~{gi.yield_indoor_g_m2} g/m²</p>
                )}
                {gi.description && <p className="text-muted-foreground mt-1 italic">{gi.description}</p>}
              </div>
            )}

            {/* Substrato + Data semina */}
            <div>
              <Label>Substrato</Label>
              <Select value={form.medium} onValueChange={v => handleChange('medium', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {mediums.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data di Semina</Label>
              <Input type="date" value={form.plant_date} onChange={e => handleChange('plant_date', e.target.value)} />
            </div>

            {/* Foto */}
            <div>
              <Label>Foto</Label>
              <label className="flex items-center gap-2 cursor-pointer border border-input rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {form.photo_url ? 'Cambia' : 'Carica'}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
            </div>
          </div>

          {/* GROW ROOM */}
          <div>
            <Label>Grow Room</Label>
            {growRooms.length === 0 ? (
              <div className="flex items-center gap-2 mt-1 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Nessuna grow room creata. Vai in "Ambiente" per crearne una prima.
              </div>
            ) : (
              <Select value={form.grow_room_id || 'none'} onValueChange={v => {
                handleChange('grow_room_id', v === 'none' ? '' : v);
                handleChange('location', '');
              }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleziona grow room..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Nessuna —</SelectItem>
                  {growRooms.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} ({r.layout === 'custom' ? `${r.custom_cols || 2}×${r.custom_rows || 2}` : r.layout})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* POSITION PICKER — only if a room is selected */}
          {selectedRoom && (
            <div>
              <Label>Posizione nella Grow Box</Label>
              <div className="mt-2">
                <GrowboxPositionPicker
                  room={selectedRoom}
                  value={form.location}
                  onChange={v => handleChange('location', v)}
                  occupiedPositions={occupiedPositions}
                />
              </div>
            </div>
          )}

          <div>
            <Label>Note</Label>
            <Textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)} rows={2} placeholder="Eventuali note..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit" disabled={saving || !form.name}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {plant?.id ? 'Aggiorna' : 'Crea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
