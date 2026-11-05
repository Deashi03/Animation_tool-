/**
 * anim:plan – reads a Swechan module and its dictionary entries from a local
 * clone and proposes, per word sense: visualization type (animation / image /
 * symbol / none), concept family (template), contrast candidates, the Japanese
 * gloss for a panel, and a confidence. Heuristics mark their own uncertainty;
 * the plan is meant to be read (and corrected) before scenes are produced.
 */
import fs from 'node:fs';
import path from 'node:path';
import { TEMPLATES } from '../compiler/templates';

type Sense = { id: string; ja?: string; defSv?: string; labelSv?: string; tags?: string[]; synonyms?: { senseId: string; relation: string }[] };
type Entry = { id: string; lemma: string; pos: string; senses: Sense[] };
type ModuleFile = { id: string; titleSv: string; words: { senseId: string; active: boolean }[] };
type ImageRow = { senseId: string; kind: string; group?: string; quiz?: boolean; confusableWith?: string[]; symbol?: boolean };

export type PlanRow = {
  senseId: string; lemma: string; pos: string; labelSv?: string; defSv?: string;
  kind: 'animation' | 'image' | 'symbol' | 'none';
  template?: string; confidence: 'high' | 'medium' | 'low';
  contrast: string[]; jaGloss: string; existingImage?: string; existingAnimation?: string; note: string;
};
export type Plan = { moduleId: string; titleSv: string; generatedAt: string; rows: PlanRow[] };

const LOCOMOTION = new Set(['gå', 'springa', 'hoppa', 'smyga', 'jogga', 'promenera', 'klättra', 'simma', 'cykla', 'åka', 'resa', 'flytta', 'halka', 'vingla', 'kretsa', 'rymma', 'gå in', 'gå ut', 'komma', 'lämna']);
const COOKING = new Set(['skära', 'hacka', 'vispa', 'röra', 'knåda', 'skala', 'riva', 'steka', 'bryna', 'koka', 'sjuda', 'grädda', 'baka', 'grilla', 'fräsa', 'fritera', 'mala', 'mosa', 'blanda', 'krydda', 'salta', 'peppra', 'sila', 'servera', 'duka', 'diska', 'smaka av', 'provsmaka', 'tina', 'frysa in', 'marinera', 'panera', 'kavla']);
const CLEANING = new Set(['städa', 'dammsuga', 'moppa', 'sopa', 'torka av', 'våttorka', 'tvätta', 'hänga upp', 'vika', 'stryka', 'skölja', 'damma', 'putsa', 'sortera', 'slänga', 'källsortera', 'bädda', 'vädra']);
const STATE = new Set(['slappa', 'sova', 'vila', 'vänta', 'slappna av', 'sitta', 'ligga', 'stå', 'drömma']);
const EMOTION_ADJ = new Set(['arg', 'glad', 'ledsen', 'rädd', 'förvånad', 'trött', 'irriterad', 'upprörd', 'rasande', 'nöjd', 'morgonpigg', 'morgontrött', 'mätt', 'hungrig', 'stressig', 'intresserad']);
const STATIC_ADJ_HINTS = /^(randig|rutig|prickig|blommig|enfärgad|mönstrad|lila|beige|turkos|röd|blå|grön|gul|svart|vit|grå|brun|rosa|orange|knälång|kortärmad|långärmad|högklackad|ribbad|fransk|grekisk|italiensk|mexikansk|thailändsk|japansk|svensk|utländsk|medeltida|inbyggd)$/u;
const ACTIVITY_NOUN = /(ning|ande|else|flytt|fest|möte|match|lek|resa|städ|tvätt|fika|middag|frukost|lunch)$/u;

export const stripFurigana = (s: string): string => s.replace(/\{([^|}]+)\|[^}]*\}/g, '$1').replace(/[（(][^）)]*[）)]/g, '').trim();

export function loadSwechan(swechanDir: string): { entries: Map<string, Entry>; senses: Map<string, { entry: Entry; sense: Sense }>; modules: Map<string, ModuleFile>; images: Map<string, ImageRow> } {
  const dictDir = path.join(swechanDir, 'src/content/data/dictionary');
  const entries = new Map<string, Entry>(), senses = new Map<string, { entry: Entry; sense: Sense }>();
  for (const f of fs.readdirSync(dictDir).filter((x) => x.endsWith('.json'))) {
    const d = JSON.parse(fs.readFileSync(path.join(dictDir, f), 'utf8')) as { entries: Entry[] };
    for (const e of d.entries) { entries.set(e.id, e); for (const s of e.senses) senses.set(s.id, { entry: e, sense: s }); }
  }
  const modDir = path.join(swechanDir, 'src/content/data/modules');
  const modules = new Map<string, ModuleFile>();
  for (const f of fs.readdirSync(modDir).filter((x) => x.endsWith('.json'))) { const m = JSON.parse(fs.readFileSync(path.join(modDir, f), 'utf8')) as ModuleFile; modules.set(m.id, m); }
  const images = new Map<string, ImageRow>();
  const imgFile = path.join(swechanDir, 'src/content/data/images/wordImages.json');
  if (fs.existsSync(imgFile)) for (const r of (JSON.parse(fs.readFileSync(imgFile, 'utf8')) as { images: ImageRow[] }).images) images.set(r.senseId, r);
  return { entries, senses, modules, images };
}

export function buildPlan(swechanDir: string, moduleId: string, existingAnimations: Map<string, string> = new Map()): Plan {
  const { senses, modules, images } = loadSwechan(swechanDir);
  const mod = modules.get(moduleId);
  if (!mod) throw new Error(`Okänd modul ${moduleId}. Finns: ${[...modules.keys()].slice(0, 8).join(', ')} …`);
  const rows: PlanRow[] = mod.words.map((w) => {
    const hit = senses.get(w.senseId);
    const lemma = hit?.entry.lemma ?? w.senseId.split('.')[1] ?? w.senseId, pos = hit?.entry.pos ?? '?';
    const sense = hit?.sense;
    const jaGloss = sense?.ja ? stripFurigana(sense.ja).split(/[、,]/)[0]!.trim() : '';
    const sameModule = mod.words.filter((o) => o.senseId !== w.senseId).map((o) => senses.get(o.senseId)).filter((x): x is { entry: Entry; sense: Sense } => !!x && x.entry.pos === pos).map((x) => x.sense.id);
    const rel = (sense?.synonyms ?? []).filter((r) => ['antonym', 'near', 'synonym'].includes(r.relation)).map((r) => r.senseId);
    const img = images.get(w.senseId);
    const contrast = [...new Set([...rel, ...(img?.confusableWith ?? []), ...sameModule.slice(0, 3)])];
    const row: PlanRow = { senseId: w.senseId, lemma, pos, labelSv: sense?.labelSv, defSv: sense?.defSv, kind: 'image', confidence: 'medium', contrast, jaGloss, existingImage: img ? `${img.kind}${img.quiz ? ' (quiz)' : ''}` : undefined, existingAnimation: existingAnimations.get(w.senseId), note: '' };
    const antonym = (sense?.synonyms ?? []).some((r) => r.relation === 'antonym');
    if (pos === 'verb' || pos === 'phrase') {
      row.kind = 'animation';
      if (LOCOMOTION.has(lemma)) { row.template = 'locomotion'; row.confidence = 'high'; }
      else if (COOKING.has(lemma) || CLEANING.has(lemma)) { row.template = 'manipulate-prop'; row.confidence = 'medium'; row.note = 'rytmisk handling med synlig förändring av råvara/yta – kontrollera att föremålet finns i biblioteket'; }
      else if (STATE.has(lemma)) { row.template = 'state'; row.confidence = 'high'; }
      else { row.template = 'manipulate-prop'; row.confidence = 'low'; row.note = 'verb utan känd familj – avgör: föremål med synlig följd, händelse, eller ingen visualisering'; }
    } else if (pos === 'adjective') {
      if (EMOTION_ADJ.has(lemma)) { row.kind = 'animation'; row.template = 'emotion'; row.confidence = 'high'; }
      else if (STATIC_ADJ_HINTS.test(lemma)) { row.kind = 'image'; row.confidence = 'high'; row.note = 'statisk synlig egenskap → bild (Swechan wordArt)'; }
      else { row.kind = 'animation'; row.template = 'property-contrast'; row.confidence = antonym ? 'medium' : 'low'; row.note = antonym ? 'kontrast mot antonymen i samma bild' : 'egenskap utan antonym i ordboken – kontrast mot "det vanliga" eller ingen visualisering'; }
    } else if (pos === 'noun') {
      if (ACTIVITY_NOUN.test(lemma) || /^Att /.test(sense?.defSv ?? '')) { row.kind = 'animation'; row.template = 'event'; row.confidence = 'low'; row.note = 'substantiv som kan vara en händelse – avgör animation eller bild'; }
      else { row.kind = 'image'; row.confidence = 'high'; row.note = img ? 'bild finns i Swechan' : 'konkret ting → bild (Swechan wordArt)'; }
    } else if (pos === 'adverb' || pos === 'preposition') { row.kind = 'animation'; row.template = pos === 'preposition' ? 'relation-arrow' : 'property-contrast'; row.confidence = 'medium'; }
    else { row.kind = 'none'; row.confidence = 'low'; row.note = `okänd ordklass ${pos}`; }
    if (row.template && !TEMPLATES[row.template]) row.note += ` (mall ${row.template} saknas)`;
    return row;
  });
  return { moduleId, titleSv: mod.titleSv, generatedAt: new Date().toISOString().slice(0, 10), rows };
}

export function planMarkdown(p: Plan): string {
  const lines = [`# Plan: ${p.titleSv} (${p.moduleId})`, '', `Genererad ${p.generatedAt}. En rad per ord: typ, mall, kontrastkandidater, japanskt ord för panel, säkerhet. Låg säkerhet = läs och besluta innan produktion.`, '',
    '| Ord | Ordklass | Typ | Mall | Kontrast | 日本語 | Säkerhet | Finns | Anm. |', '|---|---|---|---|---|---|---|---|---|'];
  for (const r of p.rows) lines.push(`| ${r.lemma}${r.labelSv ? ` (${r.labelSv})` : ''} | ${r.pos} | ${r.kind} | ${r.template ?? '–'} | ${r.contrast.map((c) => c.split('.')[1]).join(', ') || '–'} | ${r.jaGloss || '–'} | ${r.confidence} | ${[r.existingAnimation, r.existingImage].filter(Boolean).join(', ') || '–'} | ${r.note} |`);
  const counts = p.rows.reduce<Record<string, number>>((m, r) => ((m[r.kind] = (m[r.kind] ?? 0) + 1), m), {});
  lines.push('', `Summering: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')}; låg säkerhet: ${p.rows.filter((r) => r.confidence === 'low').length}.`, '');
  return lines.join('\n');
}
