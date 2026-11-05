/**
 * anim:batch – drafts for every word in a plan that has a recipe. The draft is
 * the recipe's template starter with the slots filled from the recipe and the
 * dictionary: sense, title, meaning, Japanese gloss, contrast partners, the
 * tool/target/contents/garment the recipe names. Drafts validate; they are a
 * running start for Claude, not finished scenes – the report says what each
 * draft still needs by hand (the recipe note), and `anim:strip` must follow.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Plan, PlanRow } from './plan';
import { TEMPLATES } from '../compiler/templates';
import { validateScene } from '../compiler/validate';
import { Scene, type SceneInput, type Scene as SceneT } from '../schema/scene';
import { loadRecipes, type Recipe } from './coverage';
import { sceneFilePath, writeScene } from './scenes';
import { registryDir } from './registry';
import { PROPS } from '../assets/props';

export type BatchResult = { senseId: string; lemma: string; animationId?: string; template?: string; status: 'created' | 'exists' | 'skipped' | 'invalid' | 'no-recipe'; file?: string; note: string; problems?: string[] };

const MOTION_BY_TOOL: Record<string, string> = { knife: 'chop', masher: 'press', spoon: 'stir', ladle: 'stir', fork: 'press', whisk: 'whisk', peeler: 'peel', grater: 'grate', rollingpin: 'roll', brush: 'brush', toothbrush: 'brush', cloth: 'wipe', sponge: 'scrub', broom: 'sweep', mop: 'sweep', hammer: 'tap', saw: 'saw', drill: 'press', screwdriver: 'tap', pen: 'spread', iron: 'wipe', shaker: 'sprinkle', scraper: 'pull', razor: 'brush', scissors: 'tap', needle: 'tap', paintbrush: 'spread', roller: 'spread', tongs: 'pull', nozzle: 'sweep' };
const EFFECT_BY_TARGET: Record<string, { key: string; to: number }> = { 'food.carrot': { key: 'pieces', to: 1 }, 'food.onion': { key: 'pieces', to: 1 }, 'food.tomato': { key: 'pieces', to: 1 }, 'food.apple': { key: 'pieces', to: 1 }, 'food.bread': { key: 'pieces', to: 1 }, 'food.potato': { key: 'peeled', to: 1 }, 'food.cheese': { key: 'grated', to: 1 }, 'food.dough': { key: 'flat', to: 1 }, 'container.bowl': { key: 'mixed', to: 1 }, 'container.plate': { key: 'dirty', to: 0 }, 'garment.shirt': { key: 'wrinkled', to: 0 }, 'fixture.wall': { key: 'paint', to: 1 }, 'fixture.puddle': { key: 'size', to: 0 }, 'food.pile': { key: 'amount', to: 0 }, 'food.cake': { key: 'decorated', to: 1 } };
const COOK_KIND: Record<string, string> = { steka: 'fry', bryna: 'brown', fräsa: 'sear', bränna: 'burn', smälta: 'melt', grilla: 'fry', fritera: 'fry', laga: 'fry' };
const SAY_ICON: Record<string, [string, string]> = { beställa: ['fork-knife', 'neutral'], klaga: ['cross', 'angry'], förklara: ['ellipsis', 'neutral'], varna: ['exclaim', 'surprised'], skämta: ['smile', 'happy'], ursäkta: ['hand', 'sad'], rekommendera: ['star', 'happy'], fråga: ['question', 'question'], svara: ['check', 'neutral'], hota: ['lightning', 'angry'], avbryta: ['hand', 'angry'], boka: ['calendar', 'neutral'], ansöka: ['document', 'neutral'], 'skriva under': ['pen', 'neutral'], godkänna: ['check', 'happy'], reklamera: ['cross', 'neutral'], felanmäla: ['phone', 'neutral'], översätta: ['swap', 'neutral'], påminna: ['bell', 'neutral'], inspirera: ['bulb', 'happy'], beskriva: ['eye', 'neutral'], uttrycka: ['heart', 'neutral'], störa: ['bell', 'angry'], 'säga upp': ['document', 'sad'] };
const DRESS: Record<string, { garment: string; on: boolean; value?: string }> = { 'ta på sig': { garment: 'top', on: true, value: 'green' }, 'ta av sig': { garment: 'top', on: false }, 'klä på sig': { garment: 'top', on: true, value: 'denim' }, 'klä av sig': { garment: 'top', on: false }, 'sätta på sig': { garment: 'hat', on: true, value: 'red' }, 'byta om': { garment: 'top', on: true, value: 'green' }, 'klä upp sig': { garment: 'scarf', on: true, value: 'red' } };
const FASTEN: Record<string, { what: string; on: boolean }> = { knäppa: { what: 'buttons', on: true }, 'knäppa upp': { what: 'buttons', on: false }, 'dra upp': { what: 'zipper', on: true }, 'dra ner': { what: 'zipper', on: false }, 'kavla upp': { what: 'sleeves', on: true }, knyta: { what: 'laces', on: true } };

export function draftScene(row: PlanRow, recipe: Recipe, moduleTitle: string, existingBySense: Map<string, string>): SceneInput | null {
  const tpl = TEMPLATES[recipe.template]; if (!tpl) return null;
  const m = /^s\.([^.]+)\.(\d+)$/.exec(row.senseId); if (!m) return null;
  const lemmaSlug = m[1]!, n = m[2]!;
  const s = tpl.make(row.senseId, lemmaSlug, n) as SceneInput & Record<string, unknown>;
  s.titleSv = row.lemma; s.meaningHint = row.defSv ?? `TODO: ${row.lemma}`;
  const ped = (s.pedagogy ?? {}) as Record<string, unknown>; ped.group = moduleTitle.toLowerCase(); ped.confusableWith = row.contrast.slice(0, 4); ped.note = `Utkast från recept (${recipe.template}). ${recipe.note ?? ''}`.trim(); s.pedagogy = ped as SceneInput['pedagogy'];
  const partners = row.contrast.map((c) => existingBySense.get(c)).filter((x): x is string => !!x);
  if (partners.length) s.contrast = { with: partners, distinctiveFeatures: (s.contrast as { distinctiveFeatures?: string[] } | undefined)?.distinctiveFeatures ?? ['has:contrast'] };
  else if (s.contrast && (s.contrast as { with: string[] }).with.some((w) => w.includes('todo'))) delete s.contrast;
  const props = (s.props ?? []) as Array<Record<string, unknown>>; const timeline = (s.timeline ?? []) as Array<Record<string, unknown>>; const shapes = (s.shapes ?? []) as Array<Record<string, unknown>>;
  const tool = recipe.props.find((p) => p.startsWith('tool.'));
  const surface = recipe.props.find((p) => /^(container|fixture)\./.test(p));
  const target = recipe.props.find((p) => /^(food|garment)\./.test(p)) ?? surface;
  switch (recipe.template) {
    case 'tool-rhythm': {
      const toolProp = props.find((p) => p.id === 'knife'), foodProp = props.find((p) => p.id === 'food');
      if (tool && toolProp) { toolProp.asset = tool; } else if (!tool && toolProp) { props.splice(props.indexOf(toolProp), 1); }
      const boardIdx = props.findIndex((p) => p.id === 'board');
      if (surface && surface !== target && boardIdx >= 0) { props[boardIdx]!.asset = surface; const mouth = PROPS[surface]?.mouth ?? [0, -4]; if (foodProp) foodProp.at = { x: 76 + mouth[0], y: 70 + mouth[1] }; }
      else if (target && (target.startsWith('container.') || target.startsWith('garment.') || target.startsWith('fixture.')) && boardIdx >= 0) props.splice(boardIdx, 1);
      if (target && foodProp) { foodProp.asset = target; delete foodProp.state; if (!target.startsWith('food.')) foodProp.at = { x: 76, y: 70 }; }
      const use = timeline.find((a) => a.action === 'use'); if (use) { if (tool) { use.tool = 'knife'; use.motion = MOTION_BY_TOOL[tool.split('.')[1]!] ?? 'chop'; } else { delete use.tool; use.motion = 'knead'; use.bothHands = true; } const eff = target ? EFFECT_BY_TARGET[target] : undefined; use.effect = eff ? [eff] : []; }
      if (target) s.contrast = s.contrast ?? { with: [], distinctiveFeatures: [] };
      if (s.contrast) (s.contrast as { distinctiveFeatures: string[] }).distinctiveFeatures = target && EFFECT_BY_TARGET[target] ? [`end:food.${EFFECT_BY_TARGET[target]!.key}${EFFECT_BY_TARGET[target]!.to >= 0.5 ? '>=0.9' : '<=0.1'}`, 'has:action:use'] : ['has:action:use', ...(tool ? [`has:prop:${tool}`] : [])];
      if (s.contrast && !(s.contrast as { with: string[] }).with.length) delete s.contrast;
      break; }
    case 'cook-rhythm': { const cook = timeline.find((a) => a.action === 'cook'); if (cook) cook.kind = COOK_KIND[row.lemma] ?? 'fry'; const pan = props.find((p) => p.id === 'pan'); if (pan && recipe.note?.includes('kött')) pan.state = { contents: 'steak' }; break; }
    case 'communicate': { const [icon, mood] = SAY_ICON[row.lemma] ?? ['question', 'question']; const say = timeline.find((a) => a.action === 'say'); if (say) { say.icon = icon; say.mood = mood; } break; }
    case 'dress-self': { const d = DRESS[row.lemma], f = FASTEN[row.lemma]; const act = timeline.find((a) => a.action === 'dress'); if (act && f) { Object.assign(act, { action: 'fasten', what: f.what, on: f.on }); delete act.garment; delete act.value; const actor = ((s.actors ?? []) as Array<Record<string, unknown>>)[0]; if (actor) actor.wardrobe = f.what === 'buttons' ? { top: 'sky', buttons: f.on ? 0 : 1 } : f.what === 'zipper' ? { top: 'orange', zipper: f.on ? 0 : 1 } : f.what === 'sleeves' ? { top: 'navy', sleeves: 'long' } : { shoes: 'white' }; }
      else if (act && d) { act.garment = d.garment; act.on = d.on; if (d.value) act.value = d.value; else delete act.value; const actor = ((s.actors ?? []) as Array<Record<string, unknown>>)[0]; if (actor && !d.on) actor.wardrobe = { top: 'green' }; if (actor && d.garment === 'hat') actor.wardrobe = {}; } break; }
    case 'attribute-gloss': case 'relation-arrow': { const ja = shapes.find((x) => x.type === 'text'); if (ja && row.jaGloss) ja.text = row.jaGloss.slice(0, 12); break; }
    case 'process': { if (target && target !== 'container.pot') { const pot = props.find((p) => p.id === 'pot'); if (pot) { pot.asset = target; pot.id = 'thing'; pot.state = {}; delete pot.scale; } const stove = props.findIndex((p) => p.id === 'stove'); if (stove >= 0 && !target.startsWith('container.')) props.splice(stove, 1); timeline.length = 0; const eff = EFFECT_BY_TARGET[target]; timeline.push({ t: 300, action: 'tween', target: 'thing', prop: eff?.key ?? 'phase', to: eff?.to ?? 1, durationMs: 3000, ease: 'easeInOut' }); (s.focus as { targets: string[] }).targets = ['thing']; delete s.contrast; } break; }
    default: break;
  }
  return s as SceneInput;
}

export function runBatch(plan: Plan, moduleTitle: string, existingBySense: Map<string, string>, opts: { write?: boolean; force?: boolean } = {}): BatchResult[] {
  const recipes = loadRecipes(); const out: BatchResult[] = [];
  for (const row of plan.rows) {
    if (row.kind !== 'animation') { out.push({ senseId: row.senseId, lemma: row.lemma, status: 'skipped', note: `${row.kind} – ingen animation` }); continue; }
    if (existingBySense.has(row.senseId) && !opts.force) { out.push({ senseId: row.senseId, lemma: row.lemma, animationId: existingBySense.get(row.senseId), status: 'exists', note: 'scen finns' }); continue; }
    const recipe = recipes[row.lemma] ?? (row.template ? { template: row.template, actions: [], props: [], note: 'standardrecept från planen' } : null);
    if (!recipe) { out.push({ senseId: row.senseId, lemma: row.lemma, status: 'no-recipe', note: 'inget recept – avgör mall för hand' }); continue; }
    const draft = draftScene(row, recipe, moduleTitle, existingBySense);
    if (!draft) { out.push({ senseId: row.senseId, lemma: row.lemma, template: recipe.template, status: 'no-recipe', note: `mall ${recipe.template} saknas` }); continue; }
    const v = validateScene(draft as unknown);
    const errors = v.problems.filter((p) => p.level === 'error').map((p) => p.message);
    const file = sceneFilePath(draft.animationId);
    if (errors.length) { out.push({ senseId: row.senseId, lemma: row.lemma, animationId: draft.animationId, template: recipe.template, status: 'invalid', note: recipe.note ?? '', problems: errors }); continue; }
    if (opts.write) { fs.mkdirSync(path.dirname(file), { recursive: true }); writeScene(file, Scene.parse(draft)); }
    out.push({ senseId: row.senseId, lemma: row.lemma, animationId: draft.animationId, template: recipe.template, status: 'created', file, note: recipe.note ?? '' });
  }
  return out;
}

export function batchMarkdown(plan: Plan, results: BatchResult[]): string {
  const count = (k: BatchResult['status']) => results.filter((r) => r.status === k).length;
  return [`# Batch: ${plan.titleSv} (${plan.moduleId})`, '', `Skapade ${count('created')} utkast, ${count('exists')} fanns, ${count('skipped')} ej animation, ${count('invalid')} ogiltiga, ${count('no-recipe')} utan recept.`, '',
    '**Nästa steg för varje utkast:** läs anmärkningen, justera scenen, `anim:validate`, `anim:strip`, titta, `anim:blindtest`. Ett utkast är inte en färdig scen.', '',
    '| Ord | Status | Scen | Mall | Anmärkning |', '|---|---|---|---|---|',
    ...results.map((r) => `| ${r.lemma} | ${r.status} | ${r.animationId ?? '–'} | ${r.template ?? '–'} | ${[r.note, ...(r.problems ?? [])].filter(Boolean).join('; ')} |`), ''].join('\n');
}
export const batchDir = (): string => path.join(registryDir(), 'batch');
export type { SceneT };
