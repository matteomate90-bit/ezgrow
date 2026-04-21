import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function EnvLogForm({ open, onOpenChange, growRooms, defaultRoomId, onSaved }) {
  const now = new Date();
  const [form, setForm] = useState({
    grow_room_id: defaultRoomId || '',
    temperature: '', humidity: '', ph: '', light_hours: '',
    notes: '',
    log_date: format(now, 'yyyy-MM-dd'),
    log_time: format(now, 'HH:mm'),
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const tempC = form.temperature ? parseFloat(form.temperature) : undefined;
    const data = {
      ...form,
      temperature: tempC != null ? Math.round((tempC * 9 / 5 + 32) * 10) / 10 : undefined,
      humidity: form.humidity ? parseFloat(form.humidity) : undefined,
      ph: form.ph ? parseFloat(form.ph) : undefined,
      light_hours: form.light_hours ? parseFloat(form.light_hours) : undefined,
    };
    await base44.entities.EnvironmentLog.create(data);
    setSaving(false);
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Registra Ambiente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data *</Label>
              <Input type="date" value={form.log_date} onChange={e => handleChange('log_date', e.target.value)} required />
            </div>
            <div>
              <Label>Orario</Label>
              <Input type="time" value={form.log_time} onChange={e => handleChange('log_time', e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Grow Room</Label>
              <Select value={form.grow_room_id || 'none'} onValueChange={v => handleChange('grow_room_id', v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Generale</SelectItem>
                  {growRooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Temperatura (°C)</Label>
              <Input type="number" step="0.1" value={form.temperature} onChange={e => handleChange('temperature', e.target.value)} placeholder="24" />
            </div>
            <div>
              <Label>Umidità (%)</Label>
              <Input type="number" step="0.1" value={form.humidity} onChange={e => handleChange('humidity', e.target.value)} placeholder="55" />
            </div>
            <div>
              <Label>pH</Label>
              <Input type="number" step="0.1" value={form.ph} onChange={e => handleChange('ph', e.target.value)} placeholder="6.5" />
            </div>
            <div>
              <Label>Luce (ore/giorno)</Label>
              <Input type="number" step="0.5" value={form.light_hours} onChange={e => handleChange('light_hours', e.target.value)} placeholder="18" />
            </div>
          </div>
          <div>
            <Label>Note</Label>
            <Textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salva
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
