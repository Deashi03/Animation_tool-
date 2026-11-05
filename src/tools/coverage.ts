/**
 * anim:coverage – how much of Swechan's dictionary the tool can animate today.
 * For every sense that needs an animation (verbs, phrases, adjectives, adverbs,
 * prepositions, activity nouns) it finds the recipe (registry/recipes.json by
 * lemma, else the planner's default by part of speech), checks that every
 * building block the recipe names exists (prop assets, actions, template),
 * and reports the state: scene done (blind-tested or not), ready (blocks exist,
 * no scene yet), blocked (a block is missing) or no recipe.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadSwechan, stripFurigana } from './plan';
import { TEMPLATES } from '../compiler/templates';
import { isPropAsset } from '../assets/catalog';
import { ACTION_NAMES } from '../schema/scene';
import { registryDir, blindResults } from './registry';

export type Recipe = { template: string; actions: string[]; props: string[]; note?: string };
export type CoverageRow = { senseId: string; lemma: string; pos: string; template: string; state: 'done-blind' | 'done' | 'ready' | 'blocked' | 'no-recipe' | 'image'; missing: string[]; note: string; animationId?: string };
export type Coverage = { generatedAt: string; rows: CoverageRow[]; totals: Record<string, number>; byTemplate: Record<string, number>; missingBlocks: Record<string, number> };

const ACTIVITY_NOUN = /(ning|ande|else|flytt|fest|möte|match|lek|resa|städ|tvätt|fika|middag|frukost|lunch)$/u;
const STATIC_ADJ = /^(randig|rutig|prickig|blommig|enfärgad|mönstrad|lila|beige|turkos|röd|blå|grön|gul|svart|vit|grå|brun|rosa|orange|knälång|kortärmad|långärmad|högklackad|ribbad|fransk|grekisk|italiensk|mexikansk|thailändsk|japansk|svensk|utländsk|medeltida|inbyggd)$/u;

export function loadRecipes(): Record<string, Recipe> {
  const f = path.join(registryDir(), 'recipes.json');
  if (!fs.existsSync(f)) return {};
  return (JSON.parse(fs.readFileSync(f, 'utf8')) as { recipes: Record<string, Recipe> }).recipes;
}

export function buildCoverage(swechanDir: string, scenesBySense: Map<string, string>): Coverage {
  const { entries } = loadSwechan(swechanDir);
  const recipes = loadRecipes();
  const blind = blindResults();
  const rows: CoverageRow[] = [];
  for (const e of entries.values()) {
    for (const s of e.senses) {
      const pos = e.pos; const lemma = e.lemma;
      let needs = pos === 'verb' || pos === 'phrase' || pos === 'adjective' || pos === 'adverb' || pos === 'preposition';
      if (pos === 'noun' && (ACTIVITY_NOUN.test(lemma) || /^Att /.test(s.defSv ?? ''))) needs = true;
      if (!needs) continue;
      if (pos === 'adjective' && STATIC_ADJ.test(lemma)) { rows.push({ senseId: s.id, lemma, pos, template: '–', state: 'image', missing: [], note: 'statisk egenskap → bild' }); continue; }
      const rec = recipes[lemma] ?? defaultRecipe(pos, lemma);
      const missing: string[] = [];
      if (!rec) { rows.push({ senseId: s.id, lemma, pos, template: '–', state: 'no-recipe', missing: [], note: '' }); continue; }
      if (!TEMPLATES[rec.template]) missing.push(`mall:${rec.template}`);
      for (const a of rec.actions) if (!(ACTION_NAMES as readonly string[]).includes(a)) missing.push(`handling:${a}`);
      for (const p of rec.props) if (!isPropAsset(p)) missing.push(`föremål:${p}`);
      const weak = /saknas|svag/.test(rec.note ?? '');
      const animationId = scenesBySense.get(s.id);
      const passed = animationId ? (blind[animationId] ?? []).some((r) => r.passed) : false;
      const state: CoverageRow['state'] = animationId ? (passed ? 'done-blind' : 'done') : missing.length || weak ? 'blocked' : 'ready';
      if (weak && !missing.length) missing.push('svagt recept');
      rows.push({ senseId: s.id, lemma, pos, template: rec.template, state, missing, note: rec.note ?? '', animationId });
    }
  }
  const totals: Record<string, number> = {}; const byTemplate: Record<string, number> = {}; const missingBlocks: Record<string, number> = {};
  for (const r of rows) { totals[r.state] = (totals[r.state] ?? 0) + 1; byTemplate[r.template] = (byTemplate[r.template] ?? 0) + 1; for (const m of r.missing) missingBlocks[m] = (missingBlocks[m] ?? 0) + 1; }
  return { generatedAt: new Date().toISOString().slice(0, 10), rows, totals, byTemplate, missingBlocks };
}

function defaultRecipe(pos: string, lemma: string): Recipe | null {
  if (pos === 'adjective') return { template: 'attribute-gloss', actions: ['idle', 'set', 'tween'], props: [], note: 'standard: egenskap buren av utseende + gloss' };
  if (pos === 'preposition') return { template: 'relation-arrow', actions: ['set', 'tween', 'emphasis'], props: ['box', 'ball'], note: 'standard: två föremål, pil, gloss' };
  if (pos === 'adverb') return { template: 'attribute-gloss', actions: ['walk', 'set'], props: [], note: 'standard: sätt/grad som kontrast + gloss' };
  if (pos === 'noun') return { template: 'event', actions: ['walk', 'say', 'idle'], props: [], note: 'aktivitetssubstantiv: händelse med flera figurer – avgör per ord' };
  if (pos === 'phrase') return { template: 'communicate', actions: ['say'], props: [], note: 'fras utan recept: pratbubbla + gloss – avgör per ord' };
  void lemma; return null;
}

export function coverageMarkdown(c: Coverage): string {
  const t = c.totals; const n = c.rows.length;
  const pct = (k: string) => `${t[k] ?? 0} (${Math.round(((t[k] ?? 0) / Math.max(1, n)) * 100)} %)`;
  const lines = [`# Täckning av Swechans ordbok (${c.generatedAt})`, '', `${n} betydelser behöver animation (verb, fraser, adjektiv, adverb, prepositioner, aktivitetssubstantiv; statiska adjektiv räknas som bild).`, '',
    `| Läge | Antal |`, `|---|---|`, `| Klar med godkänt blindtest | ${pct('done-blind')} |`, `| Scen finns, blindtest saknas | ${pct('done')} |`, `| Redo: recept och byggstenar finns | ${pct('ready')} |`, `| Blockerad: byggsten saknas eller svagt recept | ${pct('blocked')} |`, `| Utan recept | ${pct('no-recipe')} |`, `| Bild (statisk egenskap) | ${pct('image')} |`, '',
    '## Saknade byggstenar (antal betydelser)', '', ...Object.entries(c.missingBlocks).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`), '',
    '## Per mall', '', ...Object.entries(c.byTemplate).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`), '',
    '## Blockerade och receptlösa', '', '| Ord | Ordklass | Mall | Saknas | Anm. |', '|---|---|---|---|---|',
    ...c.rows.filter((r) => r.state === 'blocked' || r.state === 'no-recipe').map((r) => `| ${r.lemma} | ${r.pos} | ${r.template} | ${r.missing.join(', ')} | ${r.note} |`), ''];
  return lines.join('\n');
}
void stripFurigana;
