import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import CollapsibleCard from '@/components/shared/CollapsibleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Info } from 'lucide-react';

// ─── Built-in nutrient DB (expanded) ────────────────────────────────────────
const NUTRIENT_DB = {
  soil: {
    seedling: {
      description: 'Germinazione su terra: evitare nutrienti forti, il seme ha riserve proprie.',
      tips: ['Innaffia con acqua pura le prime 2 settimane', 'pH 6.0–6.5', 'Alta umidità (70–80%)'],
      lines: {
        BioBizz: [
          { name: 'Root·Juice', dose: '1–2 ml/L', note: 'Stimolante radicale organico' },
          { name: 'Bio·Grow', dose: '0.5 ml/L', note: 'Solo dalla 2ª settimana' },
        ],
        Plagron: [
          { name: 'Alga Grow', dose: '0.5 ml/L', note: 'Base leggera, alghe marine' },
          { name: 'Power Roots', dose: '1 ml/L', note: 'Stimolante radici' },
        ],
        'Advanced Nutrients': [
          { name: 'Voodoo Juice', dose: '2 ml/L', note: 'Batteri benefici per radici' },
          { name: 'Tarantula', dose: '1 ml/L', note: 'Funghi micorrizici' },
        ],
      }
    },
    vegetative: {
      description: 'Fase vegetativa su terra: azoto (N) elevato per crescita fogliare e struttura robusta.',
      tips: ['pH 6.2–6.5', 'EC 1.0–1.6', 'Innaffia quando i primi 2–3 cm di terra sono asciutti'],
      lines: {
        BioBizz: [
          { name: 'Bio·Grow', dose: '2–4 ml/L', note: 'Base vegetativo — N organico' },
          { name: 'Alg·A·Mic', dose: '1–2 ml/L', note: 'Vitamine e aminoacidi naturali' },
          { name: 'Top·Max', dose: '1 ml/L', note: 'Enzimi, migliora assorbimento' },
          { name: 'Fish·Mix', dose: '1–2 ml/L', note: 'Aminoacidi da pesce, N extra' },
        ],
        Plagron: [
          { name: 'Alga Grow', dose: '2–3 ml/L', note: 'Base N da alghe marine' },
          { name: 'Green Sensation', dose: '1 ml/L', note: 'Booster multifase' },
          { name: 'Mega Worm', dose: '1–2 ml/L', note: 'Humus lombrico, microbioma' },
          { name: 'Power Roots', dose: '1 ml/L', note: 'Radici forti' },
        ],
        'Advanced Nutrients': [
          { name: 'Grow (pH Perfect)', dose: '4 ml/L', note: 'Stabilizza pH automaticamente' },
          { name: 'Micro (pH Perfect)', dose: '4 ml/L', note: 'Micronutrienti chelati' },
          { name: 'Voodoo Juice', dose: '2 ml/L', note: 'Batteri PGPR benefici' },
          { name: 'B-52', dose: '2 ml/L', note: 'Vitamine B, stress relief' },
          { name: 'Revive', dose: '5 ml/L', note: 'Recovery rapido carenze' },
        ],
      }
    },
    flowering: {
      description: 'Fioritura su terra: ridurre N, aumentare P e K. Fondamentale per gemme dense.',
      tips: ['pH 6.0–6.5', 'EC 1.6–2.2', 'Ultime 2 settimane: solo acqua (flush)'],
      lines: {
        BioBizz: [
          { name: 'Bio·Bloom', dose: '2–4 ml/L', note: 'Base fioritura — P/K biologici' },
          { name: 'Top·Max', dose: '1–2 ml/L', note: 'Booster fiori organico' },
          { name: 'Bio·Heaven', dose: '2 ml/L', note: 'Aminoacidi, migliora THC/CBD' },
          { name: 'Alg·A·Mic', dose: '1 ml/L', note: 'Vitalità in fioritura avanzata' },
        ],
        Plagron: [
          { name: 'Alga Bloom', dose: '2–4 ml/L', note: 'Base fioritura organica' },
          { name: 'Green Sensation', dose: '1 ml/L', note: 'Fioritura + aromi' },
          { name: 'Pure Zym', dose: '1 ml/L', note: 'Enzimi degradano sostanza organica' },
          { name: 'Liquid Force', dose: '0.5 ml/L', note: 'PK booster settimane 4–6' },
        ],
        'Advanced Nutrients': [
          { name: 'Bloom (pH Perfect)', dose: '4 ml/L', note: 'Base fioritura autopH' },
          { name: 'Micro (pH Perfect)', dose: '4 ml/L', note: 'Micronutrienti chelati' },
          { name: 'Big Bud', dose: '2 ml/L', note: 'Ingrandisce gemme settimane 2–5' },
          { name: 'Overdrive', dose: '2 ml/L', note: 'Ultime 2 settimane di fioritura' },
          { name: 'Flawless Finish', dose: '2 ml/L', note: 'Flush pulito ultima settimana' },
          { name: 'Bud Candy', dose: '2 ml/L', note: 'Carboidrati, aromi, resa' },
        ],
      }
    },
    harvesting: {
      description: 'Pre-raccolta: flush con acqua pura per eliminare residui.',
      tips: ['Solo acqua pura per 7–14 giorni', 'pH 6.0', 'Riduci umidità a 45–50%'],
      lines: {}
    },
  },
  coco_coir: {
    seedling: {
      description: 'Cocco in germinazione: substrato inerte, nutrienti subito a basse dosi.',
      tips: ['pH 5.8–6.0', 'EC 0.6–0.9', 'Innaffia frequentemente'],
      lines: {
        'Canna Coco': [
          { name: 'Canna Coco A', dose: '0.5–1 ml/L', note: 'Parte A bicomponente' },
          { name: 'Canna Coco B', dose: '0.5–1 ml/L', note: 'Parte B bicomponente' },
          { name: 'Rhizotonic', dose: '1–2 ml/L', note: 'Radicante biologico' },
        ],
        BioBizz: [
          { name: 'Root·Juice', dose: '1 ml/L', note: 'Radici in substrato inerte' },
        ],
        'Advanced Nutrients': [
          { name: 'Tarantula', dose: '1 ml/L', note: 'Micorrize per cocco' },
        ],
      }
    },
    vegetative: {
      description: 'Cocco vegetativo: nutrienti ad ogni innaffiatura, frequenza alta.',
      tips: ['pH 5.8–6.0', 'EC 1.2–2.0', 'Innaffia ogni 1–2 giorni, 20% run-off'],
      lines: {
        'Canna Coco': [
          { name: 'Canna Coco A', dose: '3–4 ml/L', note: 'Parte A' },
          { name: 'Canna Coco B', dose: '3–4 ml/L', note: 'Parte B' },
          { name: 'Cannazym', dose: '1 ml/L', note: 'Enzimi per substrato sano' },
          { name: 'Boost Accelerator', dose: '0.5 ml/L', note: 'Acceleratore vegetativo' },
        ],
        BioBizz: [
          { name: 'Bio·Grow', dose: '2 ml/L', note: 'N in cocco (ridurre vs terra)' },
          { name: 'CalMag', dose: '1 ml/L', note: 'Calcio e Magnesio essenziali in cocco' },
        ],
        Plagron: [
          { name: 'Cocos A', dose: '3 ml/L', note: 'Formulato per cocco — parte A' },
          { name: 'Cocos B', dose: '3 ml/L', note: 'Formulato per cocco — parte B' },
          { name: 'Green Sensation', dose: '1 ml/L', note: 'Booster vegetativo' },
        ],
        'Advanced Nutrients': [
          { name: 'Grow (pH Perfect)', dose: '4 ml/L', note: 'Vegetativo cocco' },
          { name: 'Micro (pH Perfect)', dose: '4 ml/L', note: 'Micronutrienti' },
          { name: 'Sensi Cal-Mag Xtra', dose: '2 ml/L', note: 'Calcium/Magnesium essenziale in cocco' },
        ],
      }
    },
    flowering: {
      description: 'Fioritura in cocco: aumenta PK, mantieni frequenza irrigazione.',
      tips: ['pH 5.8–6.2', 'EC 1.8–2.5', 'Flush 5–7 giorni pre-raccolta'],
      lines: {
        'Canna Coco': [
          { name: 'Canna Coco A', dose: '3–5 ml/L', note: 'Parte A' },
          { name: 'Canna Coco B', dose: '3–5 ml/L', note: 'Parte B' },
          { name: 'PK 13/14', dose: '1–1.5 ml/L', note: 'Settimane 3–5 di fioritura' },
          { name: 'Boost Accelerator', dose: '1 ml/L', note: 'Booster fiori' },
          { name: 'Cannazym', dose: '1 ml/L', note: 'Enzimi degradativi' },
        ],
        Plagron: [
          { name: 'Cocos A', dose: '3–5 ml/L', note: '' },
          { name: 'Cocos B', dose: '3–5 ml/L', note: '' },
          { name: 'Liquid Force', dose: '0.5–1 ml/L', note: 'PK booster' },
          { name: 'Pure Zym', dose: '1 ml/L', note: 'Enzimi' },
        ],
        'Advanced Nutrients': [
          { name: 'Bloom (pH Perfect)', dose: '4 ml/L', note: '' },
          { name: 'Micro (pH Perfect)', dose: '4 ml/L', note: '' },
          { name: 'Big Bud', dose: '2 ml/L', note: 'Ingrandisce fiori' },
          { name: 'Bud Candy', dose: '2 ml/L', note: 'Aromi e zuccheri' },
          { name: 'Sensi Cal-Mag Xtra', dose: '1–2 ml/L', note: 'Evita carenze' },
        ],
      }
    },
    harvesting: { description: 'Flush cocco.', tips: ['Acqua pura pH 5.8 per 5–7 giorni'], lines: {} },
  },
  hydroponics: {
    seedling: {
      description: 'Idroponica germinazione: soluzione molto leggera.',
      tips: ['pH 5.5–5.8', 'EC 0.4–0.6', 'Temperatura soluzione 18–21°C'],
      lines: {
        'General Hydroponics': [
          { name: 'Flora Grow', dose: '1 ml/L', note: 'N elevato' },
          { name: 'Flora Micro', dose: '1 ml/L', note: 'Micronutrienti' },
          { name: 'Flora Bloom', dose: '0.5 ml/L', note: 'PK base' },
        ],
      }
    },
    vegetative: {
      description: 'Idroponica vegetativo: alta frequenza, soluzione ricca.',
      tips: ['pH 5.5–6.0', 'EC 1.4–2.0', 'Cambia soluzione ogni 7 giorni'],
      lines: {
        'General Hydroponics': [
          { name: 'FloraNova Grow', dose: '6–8 ml/L', note: 'Mono-componente semplice' },
          { name: 'Rapid Start', dose: '0.5 ml/L', note: 'Radici idroponiche' },
        ],
        'Canna Aqua': [
          { name: 'Aqua Vega A', dose: '3 ml/L', note: '' },
          { name: 'Aqua Vega B', dose: '3 ml/L', note: '' },
          { name: 'Rhizotonic', dose: '1 ml/L', note: '' },
        ],
        'Advanced Nutrients': [
          { name: 'Grow (pH Perfect)', dose: '4 ml/L', note: '' },
          { name: 'Micro (pH Perfect)', dose: '4 ml/L', note: '' },
          { name: 'Piranha', dose: '2 ml/L', note: 'Funghi benefici in idro' },
        ],
      }
    },
    flowering: {
      description: 'Idroponica fioritura: inverti rapporto Grow/Bloom.',
      tips: ['pH 5.8–6.2', 'EC 1.8–2.5', 'Flush con acqua 5–7 giorni prima'],
      lines: {
        'General Hydroponics': [
          { name: 'FloraNova Bloom', dose: '6–8 ml/L', note: 'Switch a bloom' },
          { name: 'Liquid Kool Bloom', dose: '1–2 ml/L', note: 'Settimane 3–6' },
          { name: 'Dry Kool Bloom', dose: '0.5 g/L', note: 'Ultima settimana' },
        ],
        'Advanced Nutrients': [
          { name: 'Bloom (pH Perfect)', dose: '4 ml/L', note: '' },
          { name: 'Big Bud', dose: '2 ml/L', note: '' },
          { name: 'Overdrive', dose: '2 ml/L', note: 'Ultime 2 settimane' },
          { name: 'Bud Ignitor', dose: '2 ml/L', note: 'Prima settimana fioritura' },
        ],
      }
    },
    harvesting: { description: 'Flush idroponico.', tips: ['Acqua pura pH 5.8 per 5 giorni'], lines: {} },
  },
  dwc: {
    seedling: { description: 'DWC germinazione: soluzione leggera, radici sospese.', tips: ['pH 5.5–5.8', 'EC 0.4–0.7', 'Ossigenazione 24h'], lines: { 'General Hydroponics': [{ name: 'Flora Series (3 part)', dose: '0.5–1 ml/L cad.', note: '' }] } },
    vegetative: { description: 'DWC vegetativo: alta ossigenazione, cambio soluzione settimanale.', tips: ['pH 5.5–6.0', 'EC 1.5–2.0', 'Temp acqua <22°C', 'Pompa aria 24/7'], lines: { 'General Hydroponics': [{ name: 'FloraNova Grow', dose: '6–8 ml/L', note: '' }, { name: 'Hydroguard', dose: '2 ml/L', note: 'Bacillus per radici DWC' }], 'Advanced Nutrients': [{ name: 'Sensi Grow A+B', dose: '4+4 ml/L', note: '' }] } },
    flowering: { description: 'DWC fioritura: EC può salire, controlla radici.', tips: ['pH 5.8–6.2', 'EC 2.0–2.8', 'Flush 5 giorni pre-raccolto'], lines: { 'General Hydroponics': [{ name: 'FloraNova Bloom', dose: '6–8 ml/L', note: '' }, { name: 'Liquid Kool Bloom', dose: '1–2 ml/L', note: '' }], 'Advanced Nutrients': [{ name: 'Sensi Bloom A+B', dose: '4+4 ml/L', note: '' }, { name: 'Big Bud', dose: '2 ml/L', note: '' }] } },
    harvesting: { description: 'Flush DWC.', tips: ['Acqua pura 5 giorni'], lines: {} },
  },
  aeroponics: {
    seedling: { description: 'Aeroponica germinazione: nebulizzazione leggera.', tips: ['pH 5.5–5.8', 'EC < 0.5', 'Cicli 1 min ogni 5 min'], lines: {} },
    vegetative: { description: 'Aeroponica vegetativo: assorbimento molto efficiente, dosi ridotte.', tips: ['pH 5.5–6.0', 'EC 1.2–1.8', 'Ridurre dosi del 20% vs idro'], lines: { 'General Hydroponics': [{ name: 'Flora Series', dose: 'come DWC −20%', note: '' }] } },
    flowering: { description: 'Aeroponica fioritura.', tips: ['pH 5.8–6.2', 'EC 1.6–2.2'], lines: { 'General Hydroponics': [{ name: 'Flora Series (bloom)', dose: 'come DWC −20%', note: '' }] } },
    harvesting: { description: 'Flush aeroponica.', tips: ['Acqua pura 3–5 giorni'], lines: {} },
  },
  other: {
    seedling: { description: 'Substrato generico germinazione.', tips: ['Inizia con acqua pura, niente nutrienti'], lines: {} },
    vegetative: { description: 'Substrato generico vegetativo.', tips: ['N elevato, pH 6.0–6.5', 'EC 1.0–1.6'], lines: {} },
    flowering: { description: 'Substrato generico fioritura.', tips: ['P e K elevati, flush finale'], lines: {} },
    harvesting: { description: 'Flush pre-raccolta.', tips: ['Solo acqua pura 7–14 giorni'], lines: {} },
  }
};

const MEDIUM_LABELS = { soil: 'Terra', coco_coir: 'Cocco', hydroponics: 'Idroponica', aeroponics: 'Aeroponica', dwc: 'DWC', other: 'Altro' };
const STAGE_LABELS = { seedling: 'Germinazione', vegetative: 'Vegetativo', flowering: 'Fioritura', harvesting: 'Pre-Raccolta' };

export default function NutrientAdvisor({ plant }) {
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [customBrand, setCustomBrand] = useState('');
  const [customResult, setCustomResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [useCustom, setUseCustom] = useState(false);

  const medium = plant?.medium || 'other';
  const stage = ['seedling', 'vegetative', 'flowering', 'harvesting'].includes(plant?.stage) ? plant.stage : 'vegetative';
  const data = NUTRIENT_DB[medium]?.[stage] || NUTRIENT_DB.other[stage];

  const brands = Object.keys(data.lines);
  const filteredLines = selectedBrand === 'all'
    ? Object.entries(data.lines).map(([brand, products]) => ({ brand, products }))
    : Object.entries(data.lines).filter(([b]) => b === selectedBrand).map(([brand, products]) => ({ brand, products }));

  const handleSearchCustom = async () => {
    if (!customBrand.trim()) return;
    setSearching(true);
    setCustomResult(null);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Sei un esperto di coltivazione. Fornisci un piano di nutrienti completo per la marca "${customBrand}" per substrato "${MEDIUM_LABELS[medium]}" in fase "${STAGE_LABELS[stage]}". Includi ogni prodotto con nome, dosaggio in ml/L o g/L, e quando usarlo nel ciclo. Rispondi in italiano.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          brand: { type: 'string' },
          summary: { type: 'string' },
          products: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                dose: { type: 'string' },
                note: { type: 'string' }
              }
            }
          },
          tips: { type: 'array', items: { type: 'string' } }
        }
      }
    });
    setCustomResult(result);
    setSearching(false);
  };

  if (!plant) return null;

  return (
    <CollapsibleCard title="Consigli Nutrienti" icon="🧪" badge={`${MEDIUM_LABELS[medium]} · ${STAGE_LABELS[stage]}`} defaultOpen={false}>
      <div className="space-y-4">
        {/* Mode toggle */}
        <div className="flex gap-2">
          <button onClick={() => setUseCustom(false)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${!useCustom ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
            Database integrato
          </button>
          <button onClick={() => setUseCustom(true)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${useCustom ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
            Cerca marca custom
          </button>
        </div>

        {/* Description */}
        <div className="flex gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <p>{data.description}</p>
        </div>

        {/* Tips */}
        {data.tips.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">📋 Parametri target:</p>
            <ul className="space-y-1">
              {data.tips.map((tip, i) => (
                <li key={i} className="text-xs flex gap-1.5">
                  <span className="text-primary mt-0.5">•</span><span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!useCustom ? (
          <>
            {/* Brand filter */}
            {brands.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">Linea:</span>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le marche</SelectItem>
                    {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {filteredLines.length > 0 ? (
              <div className="space-y-3">
                {filteredLines.map(({ brand, products }) => (
                  <div key={brand} className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-3 py-1.5 text-xs font-semibold border-b border-border">{brand}</div>
                    <div className="divide-y divide-border">
                      {products.map((p) => (
                        <div key={p.name} className="flex items-center px-3 py-2 gap-3 text-xs">
                          <div className="flex-1 font-medium">{p.name}</div>
                          <div className="text-primary font-bold shrink-0">{p.dose}</div>
                          {p.note && <div className="text-muted-foreground italic shrink-0 hidden sm:block">{p.note}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-2">Solo acqua in questa fase.</p>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={customBrand}
                onChange={e => setCustomBrand(e.target.value)}
                placeholder="Es. Hesi, Canna, Plagron Terra..."
                className="text-sm"
                onKeyDown={e => e.key === 'Enter' && handleSearchCustom()}
              />
              <Button size="sm" onClick={handleSearchCustom} disabled={searching || !customBrand.trim()}>
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            {searching && <p className="text-xs text-muted-foreground text-center py-2">Ricerca in corso...</p>}
            {customResult && (
              <div className="space-y-2">
                {customResult.summary && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">{customResult.summary}</div>
                )}
                {customResult.products?.length > 0 && (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-3 py-1.5 text-xs font-semibold border-b border-border">{customResult.brand}</div>
                    <div className="divide-y divide-border">
                      {customResult.products.map((p, i) => (
                        <div key={i} className="flex items-center px-3 py-2 gap-3 text-xs">
                          <div className="flex-1 font-medium">{p.name}</div>
                          <div className="text-primary font-bold shrink-0">{p.dose}</div>
                          {p.note && <div className="text-muted-foreground italic shrink-0 hidden sm:block">{p.note}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {customResult.tips?.length > 0 && (
                  <ul className="space-y-1">
                    {customResult.tips.map((t, i) => <li key={i} className="text-xs flex gap-1.5"><span className="text-primary">•</span><span>{t}</span></li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground border-t border-border pt-2">
          ⚠️ Dosaggi indicativi. Seguire sempre le istruzioni del produttore e adattare in base alla risposta della pianta.
        </p>
      </div>
    </CollapsibleCard>
  );
}
