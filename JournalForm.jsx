import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function JournalForm({ open, onOpenChange, plants, onSaved }) {
  const [form, setForm] = useState({
    title: '', content: '', plant_id: '', entry_date: format(new Date(), 'yyyy-MM-dd'), photo_url: ''
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    handleChange('photo_url', file_url);
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.JournalEntry.create(form);
    setSaving(false);
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Nuova Voce nel Diario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Titolo *</Label>
            <Input value={form.title} onChange={e => handleChange('title', e.target.value)} required placeholder="Aggiornamento settimana 3" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data *</Label>
              <Input type="date" value={form.entry_date} onChange={e => handleChange('entry_date', e.target.value)} required />
            </div>
            <div>
              <Label>Plant</Label>
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
            <Label>Contenuto</Label>
            <Textarea value={form.content} onChange={e => handleChange('content', e.target.value)} rows={4} placeholder="Come stanno andando le cose..." />
          </div>
          <div>
            <Label>Foto</Label>
            <label className="flex items-center gap-2 cursor-pointer border border-input rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {form.photo_url ? 'Cambia foto' : 'Carica foto'}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit" disabled={saving || !form.title}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salva
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
