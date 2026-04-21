import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

const taskTypes = [
  { value: 'water', label: 'Acqua' },
  { value: 'feed', label: 'Nutrimento' },
  { value: 'prune', label: 'Potatura' },
  { value: 'transplant', label: 'Trapianto' },
  { value: 'inspect', label: 'Ispezione' },
  { value: 'harvest', label: 'Raccolta' },
  { value: 'other', label: 'Altro' },
];

export default function TaskForm({ open, onOpenChange, task, plants, onSaved }) {
  const [form, setForm] = useState(task || {
    title: '', type: 'water', plant_id: '', due_date: '', notes: '', completed: false
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (task?.id) {
      await base44.entities.GrowTask.update(task.id, form);
    } else {
      await base44.entities.GrowTask.create(form);
    }
    setSaving(false);
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{task?.id ? 'Modifica Attività' : 'Nuova Attività'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Titolo *</Label>
            <Input value={form.title} onChange={e => handleChange('title', e.target.value)} required placeholder="Annaffia le piante" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={v => handleChange('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {taskTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pianta</Label>
              <Select value={form.plant_id || 'none'} onValueChange={v => handleChange('plant_id', v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Generale</SelectItem>
                  {plants.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Scadenza</Label>
            <Input type="date" value={form.due_date} onChange={e => handleChange('due_date', e.target.value)} />
          </div>
          <div>
            <Label>Note</Label>
            <Textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit" disabled={saving || !form.title}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {task?.id ? 'Aggiorna' : 'Crea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
