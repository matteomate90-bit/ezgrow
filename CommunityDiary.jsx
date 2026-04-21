import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Plus, Heart, MessageCircle, Upload, Loader2, Send } from 'lucide-react';

const STAGE_LABELS = { seedling: 'Germinazione', vegetative: 'Vegetativo', flowering: 'Fioritura', harvesting: 'Raccolta', drying: 'Essiccazione', curing: 'Stagionatura' };
const STAGE_COLORS = { seedling: 'bg-emerald-100 text-emerald-700', vegetative: 'bg-green-100 text-green-700', flowering: 'bg-purple-100 text-purple-700', harvesting: 'bg-amber-100 text-amber-700', drying: 'bg-orange-100 text-orange-700', curing: 'bg-yellow-100 text-yellow-700' };
const TECHNIQUE_OPTIONS = ['LST', 'SCROG', 'SOG', 'Topping', 'FIM', 'Lollipopping', 'Manifolding', 'Defoliazione', 'STS'];

function CommentSection({ logId }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [alias, setAlias] = useState(() => localStorage.getItem('cultivapp_alias') || '');
  const [saving, setSaving] = useState(false);

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', logId],
    queryFn: () => base44.entities.GrowComment.filter({ log_id: logId }, 'entry_date'),
  });

  const handleSubmit = async () => {
    if (!text.trim() || !alias.trim()) return;
    setSaving(true);
    localStorage.setItem('cultivapp_alias', alias);
    await base44.entities.GrowComment.create({
      log_id: logId,
      author_alias: alias,
      content: text,
      entry_date: format(new Date(), 'yyyy-MM-dd'),
    });
    queryClient.invalidateQueries({ queryKey: ['comments', logId] });
    setText('');
    setSaving(false);
  };

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-2">
      {comments.map(c => (
        <div key={c.id} className="text-xs bg-muted/40 rounded-lg px-3 py-2">
          <span className="font-semibold text-primary">{c.author_alias || 'Anonimo'}</span>
          <span className="text-muted-foreground ml-1">{format(new Date(c.entry_date), 'dd MMM', { locale: it })}</span>
          <p className="mt-0.5 text-foreground">{c.content}</p>
        </div>
      ))}
      <div className="flex gap-2 items-end">
        <div className="flex flex-col gap-1 flex-1">
          {!localStorage.getItem('cultivapp_alias') && (
            <Input value={alias} onChange={e => setAlias(e.target.value)} placeholder="Il tuo alias (anonimo)" className="text-xs h-7" />
          )}
          <Input value={text} onChange={e => setText(e.target.value)} placeholder="Scrivi un commento..." className="text-xs h-7"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>
        <Button size="sm" className="h-7 px-2" onClick={handleSubmit} disabled={saving || !text.trim()}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
        </Button>
      </div>
    </div>
  );
}

function LogCard({ log, currentUserEmail }) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const isOwn = log.created_by === currentUserEmail;
  const { data: comments = [] } = useQuery({
    queryKey: ['comments', log.id],
    queryFn: () => base44.entities.GrowComment.filter({ log_id: log.id }, 'entry_date'),
  });

  const handleLike = async () => {
    await base44.entities.PublicGrowLog.update(log.id, { likes: (log.likes || 0) + 1 });
    queryClient.invalidateQueries({ queryKey: ['public-logs'] });
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {log.photo_url && (
        <div className="aspect-video bg-muted">
          <img src={log.photo_url} alt={log.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-semibold text-sm">{log.title}</p>
            <p className="text-xs text-muted-foreground">
              🌿 {log.author_alias || 'Anonimo'} · {format(new Date(log.entry_date), 'dd MMM yyyy', { locale: it })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {log.stage && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[log.stage] || 'bg-muted text-muted-foreground'}`}>
                {STAGE_LABELS[log.stage]}
              </span>
            )}
            {log.day_number && <span className="text-[10px] text-muted-foreground">Giorno {log.day_number}</span>}
          </div>
        </div>

        {(log.genetics || log.strain_type || log.medium) && (
          <div className="flex flex-wrap gap-1 mb-2">
            {log.genetics && <Badge variant="outline" className="text-[10px]">{log.genetics}</Badge>}
            {log.strain_type && <Badge variant="outline" className="text-[10px]">{log.strain_type === 'autofiorente' ? '🌀 Auto' : '☀️ Foto'}</Badge>}
            {log.medium && <Badge variant="outline" className="text-[10px]">{log.medium}</Badge>}
          </div>
        )}

        {log.technique_tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {log.technique_tags.map(t => <Badge key={t} className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">{t}</Badge>)}
          </div>
        )}

        <p className="text-sm text-muted-foreground leading-relaxed">{log.content}</p>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
          <button onClick={handleLike} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-500 transition-colors">
            <Heart className="w-3.5 h-3.5" /> {log.likes || 0}
          </button>
          <button onClick={() => setShowComments(o => !o)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
            <MessageCircle className="w-3.5 h-3.5" /> {comments.length} commenti
          </button>
          {isOwn && <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Il tuo post</span>}
        </div>

        {showComments && <CommentSection logId={log.id} />}
      </div>
    </div>
  );
}

function NewLogForm({ open, onOpenChange, plants }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [form, setForm] = useState({
    author_alias: localStorage.getItem('cultivapp_alias') || '',
    title: '',
    content: '',
    photo_url: '',
    stage: '',
    strain_type: '',
    genetics: '',
    medium: '',
    day_number: '',
    entry_date: format(new Date(), 'yyyy-MM-dd'),
  });

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, photo_url: file_url }));
    setUploading(false);
  };

  const toggleTag = (tag) => setSelectedTags(t => t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag]);

  const handleSubmit = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    localStorage.setItem('cultivapp_alias', form.author_alias);
    await base44.entities.PublicGrowLog.create({
      ...form,
      day_number: form.day_number ? parseInt(form.day_number) : undefined,
      technique_tags: selectedTags,
      likes: 0,
    });
    queryClient.invalidateQueries({ queryKey: ['public-logs'] });
    setSaving(false);
    onOpenChange(false);
  };

  // Auto-fill from plant data
  const handlePlantSelect = (plant) => {
    if (!plant) return;
    setForm(f => ({
      ...f,
      stage: plant.stage || '',
      strain_type: plant.strain_type || '',
      genetics: plant.genetics || '',
      medium: plant.medium || '',
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>📢 Condividi con la Community</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Il tuo alias (anonimo)</Label>
            <Input value={form.author_alias} onChange={e => setForm(f => ({ ...f, author_alias: e.target.value }))} placeholder="Es. GreenThumb_42" className="mt-1" />
          </div>
          {plants?.length > 0 && (
            <div>
              <Label className="text-xs">Importa dati da una tua pianta (opzionale)</Label>
              <Select onValueChange={v => { const p = plants.find(x => x.id === v); handlePlantSelect(p); }}>
                <SelectTrigger className="mt-1 text-xs h-8"><SelectValue placeholder="Seleziona pianta..." /></SelectTrigger>
                <SelectContent>
                  {plants.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-xs">Titolo *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Es. Settimana 3 di fioritura — ottimi progressi!" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Contenuto *</Label>
            <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} placeholder="Racconta la tua esperienza, i progressi, i consigli..." className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Fase</Label>
              <Select value={form.stage} onValueChange={v => setForm(f => ({ ...f, stage: v }))}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Fase..." /></SelectTrigger>
                <SelectContent>{Object.entries(STAGE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Giorno</Label>
              <Input type="number" value={form.day_number} onChange={e => setForm(f => ({ ...f, day_number: e.target.value }))} placeholder="Es. 21" className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Strain</Label>
              <Input value={form.genetics} onChange={e => setForm(f => ({ ...f, genetics: e.target.value }))} placeholder="Es. OG Kush" className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={form.strain_type} onValueChange={v => setForm(f => ({ ...f, strain_type: v }))}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Tipo..." /></SelectTrigger>
                <SelectContent><SelectItem value="autofiorente">🌀 Autofiorente</SelectItem><SelectItem value="fotoperiodica">☀️ Fotoperiodica</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Tecniche usate</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {TECHNIQUE_OPTIONS.map(t => (
                <button key={t} onClick={() => toggleTag(t)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${selectedTags.includes(t) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Foto (opzionale)</Label>
            <label className="mt-1 flex items-center gap-2 cursor-pointer border border-input rounded-lg px-3 py-2 text-xs hover:bg-muted transition-colors">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {form.photo_url ? '✓ Foto caricata' : 'Carica foto'}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.title || !form.content}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Pubblica
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CommunityDiary() {
  const [showNew, setShowNew] = useState(false);
  const [filterStage, setFilterStage] = useState('all');
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['public-logs'],
    queryFn: () => base44.entities.PublicGrowLog.list('-entry_date', 50),
  });

  const { data: myPlants = [] } = useQuery({
    queryKey: ['plants'],
    queryFn: () => base44.entities.Plant.list(),
  });

  const user = base44.auth.me?.() || {};

  const filtered = logs.filter(l => {
    const stageOk = filterStage === 'all' || l.stage === filterStage;
    const searchOk = !search || l.title?.toLowerCase().includes(search.toLowerCase())
      || l.genetics?.toLowerCase().includes(search.toLowerCase())
      || l.content?.toLowerCase().includes(search.toLowerCase())
      || l.author_alias?.toLowerCase().includes(search.toLowerCase());
    return stageOk && searchOk;
  });

  return (
    <div>
      <PageHeader
        title="🌍 Diario Pubblico"
        description="Condividi i tuoi progressi con la community in modo anonimo"
        action={
          <Button onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4 mr-1" /> Condividi
          </Button>
        }
      />

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 mb-5 flex gap-2">
        <span>🔒</span>
        <span>La tua identità è protetta: i post vengono pubblicati sotto il tuo alias anonimo. Non viene mai condiviso il tuo nome reale o email.</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca strain, tecnica, autore..." className="max-w-64 h-8 text-sm" />
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le fasi</SelectItem>
            {Object.entries(STAGE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">🌱</p>
          <p className="font-semibold">Nessun post ancora</p>
          <p className="text-sm mt-1">Sii il primo a condividere la tua coltivazione!</p>
          <Button className="mt-4" onClick={() => setShowNew(true)}>Pubblica il tuo primo log</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(log => <LogCard key={log.id} log={log} currentUserEmail={user?.email} />)}
        </div>
      )}

      <NewLogForm open={showNew} onOpenChange={setShowNew} plants={myPlants} />
    </div>
  );
}
