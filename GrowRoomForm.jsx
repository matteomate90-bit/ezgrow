import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, Trash2, Lightbulb, Wrench, LayoutGrid } from 'lucide-react';

const DEFAULT_KWH_COST = 0.26; // media nazionale italiana €/kWh

const APPLIANCE_PRESETS = [
  { name: 'Deumidificatore', watt: 300 },
  { name: 'Estrazione aria', watt: 150 },
  { name: 'Riscaldatore', watt: 1000 },
  { name: 'Ventilatore', watt: 50 },
  { name: 'Umidificatore', watt: 200 },
  { name: 'Filtro carbone', watt: 100 },
  { name: 'Pompa acqua', watt: 30 },
  { name: 'CO2 controller', watt: 20 },
];

const LIGHT_TYPES = [
  { value: 'led', label: 'LED' },
  { value: 'hps', label: 'HPS / Sodio' },
  { value: 'cmh', label: 'CMH / LEC' },
  { value: 't5', label: 'T5 Fluorescente' },
  { value: 'other', label: 'Altro' },
];

function SectionTitle({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1 border-b border-border">
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </div>
  );
}

export default function GrowRoomForm({ open, onOpenChange, room, onSaved }) {
  const defaultForm = {
    name: '', layout: '2x2', custom_cols: 2, custom_rows: 2,
    width_cm: '', depth_cm: '', height_cm: '', max_plants: '',
    light_watt: '', light_type: 'led', light_hours_per_day: 18,
    appliances: [], kwh_cost: DEFAULT_KWH_COST, description: ''
  };

  const [form, setForm] = useState(room ? { ...defaultForm, ...room } : defaultForm);
  const [saving, setSaving] = useState(false);
  const [newAppliance, setNewAppliance] = useState({ name: '', watt: '', hours_per_day: 24 });
  const [appliancePreset, setAppliancePreset] = useState('');

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleAddAppliance = () => {
    if (!newAppliance.name || !newAppliance.watt) return;
    setForm(prev => ({
      ...prev,
      appliances: [...(prev.appliances || []), {
        name: newAppliance.name,
        watt: parseFloat(newAppliance.watt),
        hours_per_day: parseFloat(newAppliance.hours_per_day) || 24
      }]
    }));
    setNewAppliance({ name: '', watt: '', hours_per_day: 24 });
    setAppliancePreset('');
  };

  const handlePresetSelect = (presetName) => {
    const preset = APPLIANCE_PRESETS.find(p => p.name === presetName);
    if (preset) {
      setNewAppliance(prev => ({ ...prev, name: preset.name, watt: preset.watt }));
      setAppliancePreset(presetName);
    }
  };

  const handleRemoveAppliance = (idx) => {
    setForm(prev => ({ ...prev, appliances: prev.appliances.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = {
      ...form,
      custom_cols: form.custom_cols ? parseInt(form.custom_cols) : undefined,
      custom_rows: form.custom_rows ? parseInt(form.custom_rows) : undefined,
      width_cm: form.width_cm ? parseFloat(form.width_cm) : undefined,
      depth_cm: form.depth_cm ? parseFloat(form.depth_cm) : undefined,
      height_cm: form.height_cm ? parseFloat(form.height_cm) : undefined,
      max_plants: form.max_plants ? parseInt(form.max_plants) : undefined,
      light_watt: form.light_watt ? parseFloat(form.light_watt) : undefined,
      light_hours_per_day: form.light_hours_per_day ? parseFloat(form.light_hours_per_day) : undefined,
      kwh_cost: form.kwh_cost ? parseFloat(form.kwh_cost) : DEFAULT_KWH_COST,
    };
    if (room?.id) {
      await base44.entities.GrowRoom.update(room.id, data);
    } else {
      await base44.entities.GrowRoom.create(data);
    }
    setSaving(false);
    onSaved();
    onOpenChange(false);
  };

  const effectiveLayout = form.layout === 'custom'
    ? `${form.custom_cols || 2}x${form.custom_rows || 2}`
    : form.layout;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{room?.id ? 'Modifica Grow Room' : 'Nuova Grow Room'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* BASE INFO */}
          <SectionTitle icon={LayoutGrid} label="Impostazioni generali" />
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => handleChange('name', e.target.value)} required placeholder="Grow Room 1" />
            </div>
            <div className="col-span-2">
              <Label>Layout griglia piante</Label>
              <Select value={form.layout} onValueChange={v => handleChange('layout', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1x2">1×2 — 2 piante</SelectItem>
                  <SelectItem value="2x2">2×2 — 4 piante</SelectItem>
                  <SelectItem value="3x3">3×3 — 9 piante</SelectItem>
                  <SelectItem value="custom">Personalizzato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.layout === 'custom' && (
              <>
                <div>
                  <Label>Colonne</Label>
                  <Input type="number" min={1} max={6} value={form.custom_cols} onChange={e => handleChange('custom_cols', e.target.value)} placeholder="2" />
                </div>
                <div>
                  <Label>Righe</Label>
                  <Input type="number" min={1} max={6} value={form.custom_rows} onChange={e => handleChange('custom_rows', e.target.value)} placeholder="2" />
                </div>
              </>
            )}
            <div>
              <Label>Max piante</Label>
              <Input type="number" min={1} value={form.max_plants} onChange={e => handleChange('max_plants', e.target.value)} placeholder="Auto" />
            </div>
            <div>
              <Label>Costo kWh (€)</Label>
              <Input type="number" step="0.001" value={form.kwh_cost} onChange={e => handleChange('kwh_cost', e.target.value)} placeholder="0.26" />
            </div>
            <div>
              <Label>Larghezza (cm)</Label>
              <Input type="number" value={form.width_cm} onChange={e => handleChange('width_cm', e.target.value)} placeholder="120" />
            </div>
            <div>
              <Label>Profondità (cm)</Label>
              <Input type="number" value={form.depth_cm} onChange={e => handleChange('depth_cm', e.target.value)} placeholder="60" />
            </div>
            <div>
              <Label>Altezza (cm)</Label>
              <Input type="number" value={form.height_cm} onChange={e => handleChange('height_cm', e.target.value)} placeholder="180" />
            </div>
          </div>

          {/* ILLUMINAZIONE */}
          <SectionTitle icon={Lightbulb} label="Illuminazione" />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Tipo lampada</Label>
              <Select value={form.light_type} onValueChange={v => handleChange('light_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LIGHT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Potenza (W)</Label>
              <Input type="number" value={form.light_watt} onChange={e => handleChange('light_watt', e.target.value)} placeholder="400" />
            </div>
            <div>
              <Label>Ore/giorno</Label>
              <Input type="number" step="0.5" max={24} value={form.light_hours_per_day} onChange={e => handleChange('light_hours_per_day', e.target.value)} placeholder="18" />
            </div>
          </div>

          {/* STRUMENTI */}
          <SectionTitle icon={Wrench} label="Altri strumenti" />
          <div className="space-y-2">
            {(form.appliances || []).map((a, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-sm">
                <span className="flex-1 font-medium">{a.name}</span>
                <span className="text-muted-foreground">{a.watt}W · {a.hours_per_day}h/g</span>
                <button type="button" onClick={() => handleRemoveAppliance(idx)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Add new appliance */}
            <div className="border border-dashed border-border rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Preset</Label>
                  <Select value={appliancePreset} onValueChange={handlePresetSelect}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Scegli..." /></SelectTrigger>
                    <SelectContent>
                      {APPLIANCE_PRESETS.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Nome strumento</Label>
                  <Input className="h-8 text-xs" value={newAppliance.name} onChange={e => setNewAppliance(p => ({ ...p, name: e.target.value }))} placeholder="Es. Deumidificatore" />
                </div>
                <div>
                  <Label className="text-xs">Potenza (W)</Label>
                  <Input className="h-8 text-xs" type="number" value={newAppliance.watt} onChange={e => setNewAppliance(p => ({ ...p, watt: e.target.value }))} placeholder="300" />
                </div>
                <div>
                  <Label className="text-xs">Ore/giorno</Label>
                  <Input className="h-8 text-xs" type="number" max={24} value={newAppliance.hours_per_day} onChange={e => setNewAppliance(p => ({ ...p, hours_per_day: e.target.value }))} placeholder="24" />
                </div>
              </div>
              <Button type="button" size="sm" variant="outline" className="w-full h-7 text-xs" onClick={handleAddAppliance} disabled={!newAppliance.name || !newAppliance.watt}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Aggiungi strumento
              </Button>
            </div>
          </div>

          {/* NOTE */}
          <div>
            <Label>Note</Label>
            <Textarea value={form.description} onChange={e => handleChange('description', e.target.value)} rows={2} placeholder="Annotazioni libere..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit" disabled={saving || !form.name}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {room?.id ? 'Aggiorna' : 'Crea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
