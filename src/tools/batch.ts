/**
 * anim:batch – complete draft scenes from recipes (registry/recipes.json).
 * A recipe names the word's *bearer* (the thing that IS the word) and, for
 * verbs, the tool, the target and the change that IS the verb. The builders
 * here compose a full scene from that: layout, actions, Japanese gloss on white,
 * contrast claims. Drafts validate against the template contract (which now
 * requires a bearer) and the batch report lists what each still needs.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Plan, PlanRow } from './plan';
import { TEMPLATES } from '../compiler/templates';
import { validateScene } from '../compiler/validate';
import { Scene, type SceneInput, type Scene as SceneT } from '../schema/scene';
import { loadRecipes, type Recipe } from './coverage';
import { sceneFilePath, writeScene } from './scenes';
import { inferRecipe } from './recipe';
import { synonymsOf } from './lexicon';
import { registryDir } from './registry';
import { PROPS } from '../assets/props';

export type BatchResult = { senseId: string; lemma: string; animationId?: string; template?: string; status: 'created' | 'exists' | 'skipped' | 'invalid' | 'no-recipe' | 'image' | 'blocked' | 'manual'; file?: string; note: string; problems?: string[] };
type J = Record<string, unknown>;
type Pt = { x: number; y: number };

const SAY_ICON: Record<string, [string, string]> = { beställa: ['fork-knife', 'neutral'], klaga: ['cross', 'angry'], förklara: ['ellipsis', 'neutral'], varna: ['exclaim', 'surprised'], skämta: ['smile', 'happy'], ursäkta: ['palms', 'sad'], 'be om ursäkt': ['palms', 'sad'], tacka: ['palms', 'happy'], hälsa: ['smile', 'happy'], buga: ['palms', 'neutral'], rekommendera: ['star', 'happy'], fråga: ['question', 'question'], svara: ['check', 'neutral'], hota: ['lightning', 'angry'], avbryta: ['no', 'angry'], boka: ['calendar', 'neutral'], ansöka: ['document', 'neutral'], 'skriva under': ['pen', 'neutral'], godkänna: ['check', 'happy'], reklamera: ['cross', 'neutral'], felanmäla: ['phone', 'neutral'], översätta: ['swap', 'neutral'], påminna: ['bell', 'neutral'], inspirera: ['bulb', 'happy'], beskriva: ['eye', 'neutral'], uttrycka: ['heart', 'neutral'], störa: ['bell', 'angry'], 'säga upp': ['document', 'sad'], köa: ['hourglass', 'neutral'], 'vänta in': ['hourglass', 'neutral'] };
/** verbs whose meaning the body carries as a bow: deep = apology, light = thanks/greeting */
const BOW: Record<string, 'light' | 'deep'> = { ursäkta: 'deep', 'be om ursäkt': 'deep', tacka: 'light', buga: 'deep', hälsa: 'light', 'säga hej': 'light' };
/** what the apology is for: a visible cause on the floor between the two */
const BOW_CAUSE: Record<string, { asset: string; rotate?: number; state: J }> = { ursäkta: { asset: 'container.cup', rotate: 90, state: { fill: 0 } }, 'be om ursäkt': { asset: 'container.cup', rotate: 90, state: { fill: 0 } } };
const DRESS: Record<string, { garment: string; on: boolean; value?: string; start: J }> = { 'ta på sig': { garment: 'top', on: true, value: 'green', start: { top: '#f7f3ea', sleeves: 'short' } }, 'ta av sig': { garment: 'top', on: false, start: { top: 'green' } }, 'klä på sig': { garment: 'top', on: true, value: 'denim', start: { top: '#f7f3ea', sleeves: 'short', bottom: '#efe7d6', shorts: true, shoes: 'skin' } }, 'klä av sig': { garment: 'top', on: false, start: { top: 'denim', bottom: 'navy', shoes: 'brown' } }, 'sätta på sig': { garment: 'hat', on: true, value: 'red', start: {} }, 'byta om': { garment: 'top', on: true, value: 'green', start: { top: 'red' } }, 'klä upp sig': { garment: 'scarf', on: true, value: 'red', start: { top: 'navy', buttons: 1 } }, 'stoppa in': { garment: 'apron', on: true, value: 'white', start: {} } };
const FASTEN: Record<string, { what: string; on: boolean; start: J }> = { knäppa: { what: 'buttons', on: true, start: { top: 'sky', buttons: 0 } }, 'knäppa upp': { what: 'buttons', on: false, start: { top: 'sky', buttons: 1 } }, 'dra upp': { what: 'zipper', on: true, start: { top: 'orange', zipper: 0 } }, 'dra ner': { what: 'zipper', on: false, start: { top: 'orange', zipper: 1 } }, 'kavla upp': { what: 'sleeves', on: true, start: { top: 'navy', sleeves: 'long', bottom: 'tan' } }, knyta: { what: 'laces', on: true, start: { shoes: 'white' } } };
const FLOOR_ASSETS = /^(fixture\.(sink|shower|washingmachine|oven|fridge|radiator|clothesline|ironingboard|chair|shelf|wall|bike|cart|tent|tree|bush|toilet|cow|hen|lamp|mirror|puddle|fire|plant|flower|nest)|container\.(bin|crate|suitcase|bucket|basket)|stove|table|sofa|bed|door|castle|ladder|window)$/;
const onFloor = (asset: string) => FLOOR_ASSETS.test(asset);
/** default scale for a thing shown as the bearer: big enough to read at 140 px, small enough to stay inside the canvas */
const bearerScale = (asset: string): number => asset === 'fixture.lamp' ? 0.75 : asset === 'fixture.flower' ? 1.7 : asset === 'fixture.plant' ? 1.3 : asset === 'fixture.candle' || asset === 'fixture.drip' ? 1.2 : onFloor(asset) ? 1 : asset.startsWith('food.') ? 1.6 : asset.startsWith('tool.') ? 1.6 : 1.3;

function base(row: PlanRow, template: string, moduleTitle: string, recipe: Recipe, partners: string[], env: string, time = 'day'): J {
  const m = /^s\.([^.]+)\.(\d+)$/.exec(row.senseId)!;
  const category = template === 'attribute-gloss' || template === 'property-contrast' ? 'property' : template === 'emotion' ? 'emotion' : template === 'state' ? 'state' : template === 'relation-arrow' ? 'relation' : 'action';
  return { schemaVersion: 1, animationId: `anim.${m[1]}.${m[2]}`, template, senseId: row.senseId, titleSv: row.lemma, meaningHint: row.defSv ?? `TODO: ${row.lemma}`, category,
    durationMs: 3600, loop: true, holdMs: 800, posterMs: 2600, environment: { id: env, time }, actors: [], props: [], shapes: [], timeline: [],
    focus: { targets: [] as string[], feature: '' }, ...(partners.length ? { contrast: { with: partners, distinctiveFeatures: ['has:bearer'] } } : {}),
    pedagogy: { quizEligible: false, group: moduleTitle.toLowerCase(), confusableWith: row.contrast.slice(0, 4), reviewStatus: 'ai-draft', note: `Utkast från recept (${template}). ${recipe.note ?? ''}`.trim() } };
}
const gloss = (text: string, x: number, y: number, bg: 'panel' | 'bubble', tail?: Pt): J => ({ type: 'text', id: 'ja', x, y: -20, text: text.slice(0, 12) || '…', size: 11, weight: 800, fill: 'ink', anchor: 'middle', bg, pad: 6, opacity: 0, z: 5, ...(bg === 'bubble' && tail ? { tail } : {}), _y: y });
function addGloss(s: J, text: string, at: number, x: number, y: number, bg: 'panel' | 'bubble', tail?: Pt): void {
  if (!text) return;
  const shown = text.slice(0, 12); const w = shown.length * 11 + 14; const cx = Math.max(w / 2 + 2, Math.min(118 - w / 2, x)); // long Japanese glosses must not run off the right edge
  const g = gloss(text, cx, y, bg, tail ? { x: tail.x + (x - cx), y: tail.y } : undefined); const yEnd = g._y as number; delete g._y;
  (s.shapes as J[]).push(g);
  // fade + a short slide: the text never sits half outside the canvas in any frame
  (s.timeline as J[]).push({ t: at, action: 'tween', target: 'ja', prop: 'opacity', from: 0, to: 1, durationMs: 350, ease: 'easeOut' }, { t: at, action: 'tween', target: 'ja', prop: 'y', from: yEnd - 6, to: yEnd, durationMs: 450, ease: 'easeOut' });
}
const propAt = (id: string, asset: string, at: Pt, extra: J = {}): J => ({ id, asset, at, z: 1, ...extra });
/** Place a thing: fixtures and furniture stand on the floor; small things stand on a table at y 70 (or on the given surface's mouth). */
function placeThing(s: J, id: string, asset: string, x: number, extra: J = {}, surface?: string | null): Pt {
  const props = s.props as J[];
  if (/^fixture\.(sun|cloud)$/.test(asset)) { props.push(propAt(id, asset, { x, y: 26 }, extra)); return { x, y: 26 }; } // sky things hang in the sky, never on a table
  if (asset === 'fixture.drip') { props.push(propAt(id, asset, { x, y: 62 }, extra)); return { x, y: 62 }; } // a drip hangs from above and falls towards the floor
  if (onFloor(asset)) { props.push(propAt(id, asset, { x, y: 100 }, extra)); return { x, y: 100 }; }
  if (surface === null) { props.push(propAt(id, asset, { x, y: 100 }, extra)); return { x, y: 100 }; }
  const surf = surface ?? 'table';
  if (surf === 'table') { if (!props.some((p) => p.id === 'table')) props.push({ id: 'table', asset: 'table', at: { x, y: 100 }, z: -1 }); props.push(propAt(id, asset, { x, y: 70 }, extra)); return { x, y: 70 }; }
  // a named surface prop (board, bowl, sink …) with its own id 'surface'
  if (!props.some((p) => p.id === 'surface')) {
    if (onFloor(surf)) props.push({ id: 'surface', asset: surf, at: { x, y: 100 }, z: 0 });
    else { if (!props.some((p) => p.id === 'table')) props.push({ id: 'table', asset: 'table', at: { x, y: 100 }, z: -1 }); props.push({ id: 'surface', asset: surf, at: { x, y: 70 }, z: 0 }); }
  }
  const mouth = PROPS[surf]?.mouth ?? [0, -4]; const sy = onFloor(surf) ? 100 : 70;
  const at = { x: x + mouth[0], y: sy + mouth[1] }; props.push(propAt(id, asset, at, extra)); return at;
}
const stateOf = (st: unknown): { state?: J; rotate?: number; color?: string } => { if (!st || typeof st !== 'object') return {}; const o = { ...(st as J) }; const out: { state?: J; rotate?: number; color?: string } = {}; if (typeof o.rotate === 'number') { out.rotate = o.rotate; delete o.rotate; } if (typeof o.color === 'string') { out.color = o.color; delete o.color; } if (Object.keys(o).length) out.state = o; return out; };

// ---------------------------------------------------------------- builders per template
/** machine-checkable features that pin down a bearer: its asset, every numeric/string start state, its emphasis */
function bearerFeatures(id: string, asset: string, state: J | undefined, extra: string[] = []): string[] {
  const out = [`has:prop:${asset}`, ...extra];
  for (const [k, v] of Object.entries(state ?? {})) { if (typeof v === 'number') out.push(`start:${id}.${k}${v >= 0.5 ? `>=${v}` : `<=${v}`}`); else if (typeof v === 'string') out.push(`start:${id}.${k}==${v}`); }
  return out;
}
function buildAttribute(row: PlanRow, r: Recipe, s: J): J | null {
  const b = r.bearer as J | undefined; if (!b) return null;
  const tl = s.timeline as J[]; const ja = row.jaGloss;
  switch (b.kind) {
    case 'prop': {
      const asset = b.asset as string; const st = stateOf(b.state); const scale = Math.min((b.scale as number) ?? bearerScale(asset), asset === 'fixture.lamp' ? 0.75 : 9);
      s.environment = { id: (b.env as string) ?? 'room', time: (b.time as string) ?? 'day' };
      const tallFloor = /^fixture\.(lamp|plant|clothesline|shelf|mirror|fridge|shower)$/.test(asset);
      const at = placeThing(s, 'bearer', asset, tallFloor ? 40 : /^fixture\.(sun|cloud)$/.test(asset) ? 60 : onFloor(asset) ? 60 : 50, { scale, ...(st.state ? { state: st.state } : {}), ...(st.rotate !== undefined ? { rotate: st.rotate } : {}), ...(b.color ? { color: b.color } : st.color ? { color: st.color } : {}) }, b.surface === undefined ? 'table' : (b.surface as string | null));
      // a room's atmosphere is borne by a small arrangement rather than one object: extra things at their own x (floor or the bearer's table)
      const extras = (b.extra as J[] | undefined) ?? [];
      extras.forEach((ex, i) => { const est = stateOf(ex.state); const o = { scale: (ex.scale as number) ?? (onFloor(ex.asset as string) ? 1 : 1.2), ...(est.state ? { state: est.state } : {}), ...(ex.color ? { color: ex.color } : {}), ...(ex.z !== undefined ? { z: ex.z } : {}) }; if (typeof ex.y === 'number') (s.props as J[]).push(propAt(`extra${i + 1}`, ex.asset as string, { x: ex.x as number, y: ex.y }, o)); /* an explicit y: a throw on a seat, a cushion on a sofa */ else placeThing(s, `extra${i + 1}`, ex.asset as string, ex.x as number, o, ex.surface === undefined ? 'table' : (ex.surface as string | null)); });
      // things that live (flames, steam) keep their phase running – a still scene, not a frozen one
      for (const p of s.props as J[]) if (PROPS[p.asset as string]?.defaults.phase !== undefined && (p.id === 'bearer' || String(p.id).startsWith('extra'))) tl.push({ t: 0, action: 'tween', target: p.id, prop: 'phase', from: 0, to: 4, durationMs: s.durationMs as number, ease: 'linear' });
      const change = b.change as J | undefined;
      if (change) tl.push({ t: 400, action: 'tween', target: 'bearer', prop: change.key, ...(change.from !== undefined ? { from: change.from } : {}), to: change.to, durationMs: 2000, ease: 'easeInOut' });
      if (b.glint) tl.push({ t: 300, action: 'emphasis', target: 'bearer', kind: 'glint', durationMs: 900 }, { t: 1700, action: 'emphasis', target: 'bearer', kind: 'glint', durationMs: 900 });
      if (asset === 'fixture.sun') tl.push({ t: 200, action: 'emphasis', target: 'bearer', kind: 'glow', durationMs: 1400 }, { t: 1800, action: 'emphasis', target: 'bearer', kind: 'glow', durationMs: 1400 });
      const top = at.y - (onFloor(asset) ? 40 : 12) * scale;
      if (extras.length) addGloss(s, ja, change ? 2400 : 1200, 60, 16, 'panel'); // an arrangement: the word names the whole picture, so a panel at the top, not a tail to one thing
      else if (/^fixture\.(sun|cloud)$/.test(asset)) addGloss(s, ja, change ? 2400 : 1200, 60, 66, 'panel'); // sky bearers: the text goes below, never over the sun
      else if (tallFloor) addGloss(s, ja, change ? 2400 : 1200, 84, 34, 'bubble', { x: -26, y: 14 }); // beside the thing, tail towards it
      else if (!onFloor(asset)) addGloss(s, ja, change ? 2400 : 1200, 88, Math.max(14, top - 10), 'bubble', { x: -24, y: 18 }); // beside the thing on the table, tail towards it: the text never covers the bearer
      else addGloss(s, ja, change ? 2400 : 1200, 60, Math.max(16, top - 14), 'bubble', { x: 0, y: 30 });
      (s.focus as J).targets = ['bearer', ...extras.map((_, i) => `extra${i + 1}`)]; (s.focus as J).feature = extras.length ? `${asset} with ${extras.map((e) => e.asset).join(', ')} bear the property together (${(b.time as string) ?? 'day'}); gloss on a panel` : `${asset} bears the property; gloss in a bubble`;
      (s.contrast as J | undefined) && ((s.contrast as J).distinctiveFeatures = bearerFeatures('bearer', asset, st.state as J | undefined, [...(change ? [`end:bearer.${change.key}${(change.to as number) >= 0.5 ? '>=0.5' : '<=0.5'}`] : []), ...(b.glint ? ['has:emphasis:glint'] : []), ...(b.time ? [`environment.time:${b.time}`] : []), ...extras.map((e) => `has:prop:${e.asset}`)]));
      return s; }
    case 'wardrobe': {
      s.environment = { id: (b.env as string) ?? 'room', time: 'day' };
      (s.actors as J[]).push({ id: 'p', variant: 'b', at: { x: 56, y: 100 }, facing: 'right', wardrobe: b.wardrobe });
      tl.push({ t: 0, action: 'idle', actor: 'p', durationMs: 3600, style: 'breathe' });
      const tail = b.tail as string; const ty = tail === 'feet' ? 98 : tail === 'arm' ? 52 : tail === 'scarf' ? 40 : tail === 'head' ? 30 : 56;
      addGloss(s, ja, 900, 88, 34, 'bubble', { x: -28, y: ty - 34 });
      (s.focus as J).targets = ['p']; (s.focus as J).feature = `the clothes bear the property (${Object.keys(b.wardrobe as J).join(', ')})`;
      if (s.contrast) (s.contrast as J).distinctiveFeatures = Object.entries(b.wardrobe as J).map(([k, v]) => typeof v === 'number' ? `wear:p.${k}${v >= 0.5 ? `>=${v}` : `<=${v}`}` : `wear:p.${k}==${v}`);
      return s; }
    case 'icon': {
      s.environment = { id: (b.env as string) ?? 'neutral', time: 'day' };
      let cx = 60, cy = b.asset ? 52 : 56;
      if (b.asset === 'window') { cx = 44; cy = 44; } // the room already has a window top-left: put the symbol beside it instead of a second window on the floor
      else if (b.asset) { const st = stateOf(b.state); placeThing(s, 'bearer', b.asset as string, 46, { scale: onFloor(b.asset as string) ? 1 : 1.4, ...(st.state ? { state: st.state } : {}) }, onFloor(b.asset as string) ? null : 'table'); cx = 84; }
      const ICON_COLOUR: Record<string, string> = { droplet: 'sky', snowflake: 'sky', wind: 'sky', cloud: 'sky', flame: 'red', sun: 'yellow', leaf: 'green', heart: 'red', coin: 'yellow', banknote: 'green', thermometer: 'red', bulb: 'yellow' }; // a water drop is blue, never the orange accent – the colour is part of the meaning
      const col = ICON_COLOUR[b.icon as string] ?? 'accent';
      (s.shapes as J[]).push({ type: 'icon', id: 'sym', icon: b.icon, x: cx, y: cy, size: b.asset && b.asset !== 'window' ? 30 : 40, stroke: col, fill: col, opacity: 0, z: 4 });
      tl.push({ t: 300, action: 'set', target: 'sym', prop: 'opacity', value: 1 }, { t: 300, action: 'tween', target: 'sym', prop: 'progress', from: 0, to: 1, durationMs: 900, ease: 'easeInOut' });
      addGloss(s, ja, 1400, 60, 20, 'panel');
      (s.focus as J).targets = b.asset && b.asset !== 'window' ? ['bearer'] : []; (s.focus as J).feature = `symbol ${b.icon}${b.asset ? ` with ${b.asset}` : ''} + gloss`;
      if (s.contrast) (s.contrast as J).distinctiveFeatures = [`has:icon:${b.icon}`, ...(b.asset && b.asset !== 'window' ? bearerFeatures('bearer', b.asset as string, stateOf(b.state).state as J | undefined) : [])];
      return s; }
    case 'contrast': {
      s.template = 'property-contrast'; s.environment = { id: (b.env as string) ?? 'room', time: 'day' };
      const A = b.a as J, B = b.b as J; const mark = (b.mark as string) ?? 'b';
      for (const [id, spec, x] of [['a', A, onFloor(A.asset as string) ? 30 : 40], ['b', B, onFloor(B.asset as string) ? 88 : 78]] as [string, J, number][]) { const st = stateOf(spec.state); placeThing(s, id, spec.asset as string, x, { scale: (spec.scale as number) ?? (onFloor(spec.asset as string) ? 1 : 1.3), ...(st.state ? { state: st.state } : {}), ...(spec.color ? { color: spec.color } : {}) }, onFloor(spec.asset as string) ? null : 'table'); }
      // one table under both when both stand on a table
      const props = s.props as J[]; const table = props.find((p) => p.id === 'table'); if (table) table.at = { x: 59, y: 100 };
      tl.push({ t: 900, action: 'emphasis', target: mark, kind: 'ring', durationMs: 900 }, { t: 1900, action: 'emphasis', target: mark, kind: 'arrowDown', durationMs: 1400 });
      addGloss(s, ja, 1300, 60, 18, 'panel');
      (s.focus as J).targets = [mark]; (s.focus as J).feature = `two bearers side by side; ${mark} is the word`;
      const M = mark === 'a' ? A : B; s.contrast = { with: (s.contrast as J | undefined)?.with ?? [], distinctiveFeatures: [...bearerFeatures(mark, M.asset as string, stateOf(M.state).state as J | undefined), 'has:actors==0'] };
      if (!((s.contrast as J).with as string[]).length) delete s.contrast;
      return s; }
    case 'emotion': {
      s.template = 'emotion'; s.environment = { id: (b.env as string) ?? 'room', time: 'day' };
      (s.actors as J[]).push({ id: 'p', variant: 'a', at: { x: 50, y: 100 }, facing: 'right' });
      if (b.cause) placeThing(s, 'cause', b.cause as string, 90, { scale: onFloor(b.cause as string) ? 1 : 1.2 }, onFloor(b.cause as string) ? null : 'table');
      tl.push({ t: 0, action: 'idle', actor: 'p', durationMs: 500 }, ...(b.cause ? [{ t: 300, action: 'lookAt', actor: 'p', target: 'cause' }] : []), { t: 600, action: 'express', actor: 'p', emotion: b.emotion, durationMs: 500 }, { t: 1100, action: 'idle', actor: 'p', durationMs: 2500, style: 'none' });
      addGloss(s, ja, 1600, 60, 18, 'panel');
      (s.focus as J).targets = ['p']; (s.focus as J).feature = `face and posture: ${b.emotion}${b.cause ? ` caused by ${b.cause}` : ''}`;
      if (s.contrast) (s.contrast as J).distinctiveFeatures = [`has:express:${b.emotion}`, ...(b.cause ? [`has:prop:${b.cause}`] : [])];
      return s; }
    case 'taste': {
      s.environment = { id: (b.env as string) ?? 'kitchen', time: 'day' }; s.durationMs = 4200; s.posterMs = 3000;
      (s.actors as J[]).push({ id: 'p', variant: 'c', at: { x: 50, y: 100 }, facing: 'right' });
      (s.props as J[]).push({ id: 'food', asset: b.food, attachTo: { actor: 'p', hand: 'left' }, scale: 0.9 });
      tl.push({ t: 300, action: 'eat', actor: 'p', prop: 'food', durationMs: 1800, reaction: b.reaction, sound: 'none' }, { t: 2300, action: 'say', actor: 'p', icon: b.icon, mood: b.reaction === 'disgusted' ? 'sad' : b.reaction === 'hot' ? 'surprised' : 'happy', durationMs: 1400, gesture: false });
      addGloss(s, ja, 2600, 60, 18, 'panel');
      (s.focus as J).targets = ['p', 'food']; (s.focus as J).feature = `tastes ${b.food}, reacts ${b.reaction}, icon ${b.icon}`;
      if (s.contrast) (s.contrast as J).distinctiveFeatures = [`has:say-icon:${b.icon}`, `has:prop:${b.food}`];
      return s; }
    case 'motion': {
      s.environment = { id: (b.env as string) ?? 'room', time: 'day' };
      const st = stateOf(b.state); placeThing(s, 'bearer', b.asset as string, 60, { scale: onFloor(b.asset as string) ? (/^fixture\.(lamp|plant|shelf)/.test(b.asset as string) ? 0.9 : 1.4) : 1.4, ...(st.state ? { state: st.state } : {}) }, onFloor(b.asset as string) ? null : 'table'); // small floor things (crates) are drawn larger so the motion reads
      for (let t = 300; t + 1000 <= 3400; t += 1100) tl.push({ t, action: 'emphasis', target: 'bearer', kind: b.motion, durationMs: 1000 });
      addGloss(s, ja, 1400, 60, 18, 'panel');
      (s.focus as J).targets = ['bearer']; (s.focus as J).feature = `${b.asset} ${b.motion}s`;
      if (s.contrast) (s.contrast as J).distinctiveFeatures = [`has:emphasis:${b.motion}`, ...bearerFeatures('bearer', b.asset as string, st.state as J | undefined)];
      return s; }
    case 'manner': {
      // a property seen only in how someone moves: the walk itself changes (careful = short slow steps, eyes on a full glass), gloss on a panel
      s.environment = { id: (b.env as string) ?? 'room', time: 'day' }; s.durationMs = 4600; s.posterMs = 2400;
      (s.actors as J[]).push({ id: 'p', variant: 'a', at: { x: 28, y: 100 }, facing: 'right' });
      const held = (b.prop as string | undefined) ?? 'container.bowl';
      (s.props as J[]).push({ id: 'held', asset: held, attachTo: { actor: 'p', hand: 'left' }, scale: held === 'glass' ? 0.6 : 0.8, ...(held === 'glass' ? { state: { fill: 0.95 } } : held === 'container.bowl' ? { state: { fill: 0.95, contents: '#e8a33c' } } : {}) });
      tl.push({ t: 200, action: 'walk', actor: 'p', to: { x: 84, y: 100 }, durationMs: 4000, manner: (b.manner as string) ?? 'careful' });
      addGloss(s, ja, 1500, 60, 12, 'panel');
      (s.focus as J).targets = ['p', 'held']; (s.focus as J).feature = `walks ${b.manner ?? 'careful'} with ${held}`;
      if (s.contrast) (s.contrast as J).distinctiveFeatures = [`has:walk-manner:${(b.manner as string) ?? 'careful'}`, `has:prop:${held}`];
      return s; }
    case 'person': {
      s.environment = { id: (b.env as string) ?? 'room', time: 'day' }; s.durationMs = 4200;
      (s.actors as J[]).push({ id: 'p', variant: 'a', at: { x: 30, y: 100 }, facing: 'right' });
      if (b.prop) (s.props as J[]).push({ id: 'held', asset: b.prop, attachTo: { actor: 'p', hand: 'left' }, scale: 0.8 });
      tl.push({ t: 200, action: 'walk', actor: 'p', to: { x: 84, y: 100 }, durationMs: 3600 });
      addGloss(s, ja, 1500, 60, 18, 'panel');
      (s.focus as J).targets = ['p']; (s.focus as J).feature = `${b.action}${b.prop ? ` with ${b.prop}` : ''}`;
      if (s.contrast) (s.contrast as J).distinctiveFeatures = ['has:action:walk', ...(b.prop ? [`has:prop:${b.prop}`] : [])];
      return s; }
    default: return null;
  }
}

function buildTool(_row: PlanRow, r: Recipe, s: J): J {
  const tl = s.timeline as J[]; const props = s.props as J[];
  s.environment = { id: (r.env as string) ?? 'kitchen', time: 'day' }; s.durationMs = 4400; s.posterMs = 3600;
  const target = r.target as string | undefined, tool = r.tool as string | undefined, surface = r.surface === null ? null : ((r.surface as string | undefined) ?? 'container.board');
  (s.actors as J[]).push({ id: 'p', variant: 'a', at: { x: 48, y: 100 }, facing: 'right', wardrobe: { top: 'navy' } });
  let targetId = 'target';
  // round, tall foods (apple, onion, potato, tomato) are drawn large for readability; on a board they reach the figure's chest, so shrink them for hand work
  const tall = target ? /^food\.(apple|onion|potato|tomato)$/.test(target) : false;
  const nearX = surface === 'container.tub' || surface === 'fixture.sink' ? 72 : 76;
  if (target) { const st = stateOf(r.targetState); placeThing(s, 'target', target, nearX, { ...(st.state ? { state: st.state } : {}), ...(tall ? { scale: 0.75 } : {}) }, onFloor(target) ? null : surface); }
  else if (surface) { placeThing(s, 'surface', surface, 76, {}, null); targetId = 'surface'; }
  const extra = r.extra as J | undefined; if (extra) { const st = stateOf(extra.state); props.push(propAt('extra', extra.asset as string, { x: 92, y: (props.find((p) => p.id === 'target')?.at as Pt | undefined)?.y ?? 70 }, { ...(st.state ? { state: st.state } : {}) })); }
  if (tool) props.push({ id: 'tool', asset: tool, attachTo: { actor: 'p', hand: 'left' }, ...(tool === 'tool.grater' ? { scale: 0.75 } : {}) });
  const effects = ((r.effects as J[] | undefined) ?? []).map((e) => ({ ...(e.role && e.role !== 'target' ? { prop: e.role === 'surface' ? 'surface' : e.role === 'extra' ? 'extra' : (e.role as string) } : {}), key: e.key, to: e.to, ...(e.from !== undefined ? { from: e.from } : {}), ...(e.at !== undefined ? { at: e.at } : {}) }));
  tl.push({ t: 0, action: 'use', actor: 'p', on: targetId, ...(tool ? { tool: 'tool' } : {}), motion: (r.motion as string) ?? 'chop', ...(r.period ? { periodMs: r.period } : {}), ...(r.bothHands ? { bothHands: true } : {}), ...(r.offset ? { offset: r.offset } : {}), durationMs: 4000, effect: effects });
  if (r.sound) tl.push({ t: 350, action: 'sound', target: tool ? 'tool' : targetId, kind: r.sound, durationMs: 3650 }); // a machine at work is heard: arcs beside it the whole time
  (s.focus as J).targets = [targetId]; (s.focus as J).feature = `${tool ?? 'hands'} ${r.motion ?? ''} on ${target ?? surface}; effects: ${effects.map((e) => `${(e as J).prop ?? targetId}.${e.key}→${e.to}`).join(', ') || 'none'}`;
  const claims = ((r.claim as string[] | undefined) ?? []).map((c) => c.replace(/\btarget\b/g, targetId));
  if (s.contrast) (s.contrast as J).distinctiveFeatures = [...(claims.length ? claims : ['has:action:use']), ...(tool ? [`has:prop:${tool}`] : []), ...(r.sound ? [`has:sound:${r.sound}`] : [])];
  return s;
}
function buildProcess(_row: PlanRow, r: Recipe, s: J): J {
  const tl = s.timeline as J[]; const props = s.props as J[];
  s.environment = { id: (r.env as string) ?? 'kitchen', time: 'day' }; s.durationMs = 4200; s.posterMs = 3400; s.template = 'process';
  const asset = r.asset as string; const st = stateOf(r.state);
  const needsStove = asset === 'container.pot' || asset === 'pan';
  if (needsStove) { props.push({ id: 'stove', asset: 'stove', at: { x: 60, y: 100 }, z: 0 }); props.push(propAt('thing', asset, { x: 60, y: 70 }, { scale: 1.4, ...(st.state ? { state: st.state } : {}) })); }
  else placeThing(s, 'thing', asset, 60, { scale: bearerScale(asset), ...(st.state ? { state: st.state } : {}), ...(st.rotate !== undefined ? { rotate: st.rotate } : {}) }, onFloor(asset) ? null : 'table');
  for (const [i, ex] of (((r.extra as J[] | undefined) ?? [])).entries()) {
    const exAsset = ex.asset as string; if (exAsset === 'stove' && props.some((p) => p.id === 'stove')) { const stove = props.find((p) => p.id === 'stove')!; if (ex.state) stove.state = ex.state; continue; }
    const id = i === 0 ? 'extra' : `extra${i + 1}`; const est = stateOf(ex.state);
    if (ex.at) props.push(propAt(id, exAsset, ex.at as Pt, { ...(ex.scale ? { scale: ex.scale } : {}), ...(est.state ? { state: est.state } : {}), z: exAsset === 'fixture.sun' || exAsset === 'fixture.tree' || exAsset === 'fixture.clothesline' ? 0 : 1 }));
    else placeThing(s, id, exAsset, 26, { ...(est.state ? { state: est.state } : {}) }, onFloor(exAsset) ? null : 'table');
    const ch = ex.change as J | undefined; if (ch) tl.push({ t: 300, action: 'tween', target: id, prop: ch.key, ...(ch.from !== undefined ? { from: ch.from } : {}), to: ch.to, durationMs: Math.min(3600, (s.durationMs as number) - 300), ease: 'linear' });
  }
  const changes = (r.change as J[] | undefined) ?? [];
  const D = s.durationMs as number;
  for (const ch of changes) { const at = (ch.at as number | undefined); const t0 = at ? 300 + 3600 * at * 0.5 : 300; const dur = Math.min(D - t0, at ? 1200 : (ch.key === 'phase' ? D : 3200)); tl.push({ t: Math.round(t0), action: 'tween', target: 'thing', prop: ch.key, ...(ch.from !== undefined ? { from: ch.from } : {}), to: ch.to, durationMs: Math.round(dur), ease: ch.key === 'phase' ? 'linear' : 'easeInOut' }); }
  if (needsStove && !props.find((p) => p.id === 'stove')!.state) tl.push({ t: 0, action: 'set', target: 'stove', prop: 'heat', value: 1 });
  if (!changes.some((c) => c.key === 'phase') && PROPS[asset]?.defaults.phase !== undefined) tl.push({ t: 0, action: 'tween', target: 'thing', prop: 'phase', from: 0, to: 4, durationMs: D, ease: 'linear' });
  if (r.sound) tl.push({ t: 0, action: 'sound', target: 'thing', kind: r.sound, durationMs: D });
  (s.focus as J).targets = ['thing']; (s.focus as J).feature = `${asset} changes by itself: ${changes.map((c) => `${c.key}→${c.to}`).join(', ') || r.sound || ''}`;
  const claims = ((r.claim as string[] | undefined) ?? []);
  if (s.contrast) (s.contrast as J).distinctiveFeatures = claims.length ? claims : ['has:action:tween'];
  return s;
}
function buildCommunicate(row: PlanRow, r: Recipe, s: J): J {
  const tl = s.timeline as J[]; const say = (r.say as J | undefined) ?? { icon: SAY_ICON[row.lemma]?.[0] ?? 'question', mood: SAY_ICON[row.lemma]?.[1] ?? 'question' };
  s.environment = { id: 'room', time: 'day' }; s.durationMs = 3800; s.posterMs = 1600;
  (s.actors as J[]).push({ id: 'p', variant: 'a', at: { x: 38, y: 100 }, facing: 'right', scale: 0.85 }, { id: 'q', variant: 'b', at: { x: 84, y: 100 }, facing: 'left', scale: 0.85 });
  // the body carries apology, thanks and greeting: a bow (deep for sorry, light for thanks) with the palms icon; a cause on the floor makes the apology readable
  const bow = (say.bow as string | undefined) ?? BOW[row.lemma];
  if (bow) {
    (s.actors as J[])[0]!.at = { x: 30, y: 100 }; (s.actors as J[])[1]!.at = { x: 88, y: 100 }; // room for a deep bow between them
    if (BOW_CAUSE[row.lemma]) (s.props as J[]).push({ id: 'cause', asset: BOW_CAUSE[row.lemma]!.asset, at: { x: 56, y: 100 }, z: 1, ...(BOW_CAUSE[row.lemma]!.rotate ? { rotate: BOW_CAUSE[row.lemma]!.rotate } : {}), state: BOW_CAUSE[row.lemma]!.state }, { id: 'puddle', asset: 'fixture.puddle', at: { x: 61, y: 100 }, z: 0, state: { size: 0.4, col: '#8a5a3a' } });
    if (BOW_CAUSE[row.lemma]) { tl.push({ t: 0, action: 'lookAt', actor: 'p', target: 'cause' }, { t: 0, action: 'lookAt', actor: 'q', target: 'cause' }); s.durationMs = 4200; }
    tl.push({ t: 0, action: 'idle', actor: 'q', durationMs: 3800 }, { t: BOW_CAUSE[row.lemma] ? 700 : 300, action: 'bow', actor: 'p', depth: bow, hands: 'together', to: 'q', durationMs: 2200 }, { t: 700, action: 'say', actor: 'p', icon: say.icon, mood: say.mood, to: 'q', durationMs: 1500, gesture: false }, { t: 2600, action: 'express', actor: 'q', emotion: say.mood === 'sad' ? 'content' : 'happy', durationMs: 400 });
    s.posterMs = 1500;
  } else tl.push({ t: 0, action: 'idle', actor: 'q', durationMs: 3800 }, { t: 400, action: 'say', actor: 'p', icon: say.icon, mood: say.mood, to: 'q', durationMs: 1800 }, { t: 2400, action: 'say', actor: 'q', icon: say.mood === 'angry' ? 'ellipsis' : 'check', mood: say.mood === 'angry' ? 'sad' : 'happy', to: 'p', durationMs: 1000, gesture: false });
  (s.focus as J).targets = ['p']; (s.focus as J).feature = `says ${say.icon} (${say.mood}) to q, q reacts`;
  if (s.contrast) (s.contrast as J).distinctiveFeatures = [`has:say-icon:${say.icon}`, `has:say-mood:${say.mood}`, ...(bow ? [`has:bow:${bow}`] : [])];
  return s;
}
function buildSocial(_row: PlanRow, r: Recipe, s: J): J | null {
  const tl = s.timeline as J[]; const props = s.props as J[];
  s.environment = { id: 'room', time: 'day' }; s.durationMs = 3600; s.posterMs = 1900;
  (s.actors as J[]).push({ id: 'p', variant: 'a', at: { x: 40, y: 100 }, facing: 'right', scale: 0.9 });
  const give = r.give as J | undefined, put = r.put as J | undefined, take = r.take as J | undefined;
  if (!give && !put && !take) return null;
  s.template = give ? 'social' : 'arrange';
  if (give && give.split) {
    // dela: one thing, broken in two in front of the body, then one half changes hands – the whole thing never leaves the giver (that would be ge/lämna över)
    (s.actors as J[]).push({ id: 'q', variant: 'c', at: { x: 82, y: 100 }, facing: 'left', scale: 0.9 }); (s.actors as J[])[0]!.at = { x: 38, y: 100 };
    const sc = (give.scale as number) ?? 1.3; // big enough that a half reads as a half at 140 px (blind h1: 1.15 read as two small boxes; 1.5 covered the torso like a sign, blind h3)
    props.push({ id: 'thing', asset: give.prop, attachTo: { actor: 'p', hand: 'left' }, scale: sc, ...(give.state ? { state: give.state } : {}) }, { id: 'piece', asset: give.prop, attachTo: { actor: 'p', hand: 'right' }, scale: sc, ...(give.state ? { state: give.state } : {}) });
    s.durationMs = 5200; s.posterMs = 4700; // the end tableau; on a 12-frame strip this lands on a sampled frame so the poster is marked (blind h4 noted it was not)
    tl.push({ t: 0, action: 'idle', actor: 'q', durationMs: 400 }, { t: 400, action: 'split', actor: 'p', prop: 'thing', into: 'piece', durationMs: 1800 }, // the break is held: both halves up, close together, before anything moves away
      { t: 2300, action: 'give', from: 'p', to: 'q', prop: 'piece', durationMs: 1500 },
      { t: 3125, action: 'set', target: 'piece', prop: 'half', value: 1 }, // the receiver faces the giver (mirrored), so its half flips: the cut faces end up towards each other
      { t: 3900, action: 'pose', actor: 'q', joints: { uArmL: 34, fArmL: 78 }, durationMs: 500, ease: 'easeInOut' }, { t: 3900, action: 'pose', actor: 'p', joints: { uArmL: 34, fArmL: 78 }, durationMs: 500, ease: 'easeInOut' }, // end tableau: each holds a half at chest height (below the face – blind h3), one thing in two
      { t: 4400, action: 'idle', actor: 'p', durationMs: 800, style: 'none' });
    (s.focus as J).targets = ['thing', 'piece']; (s.focus as J).feature = `breaks ${give.prop} in two, gives one half to q, keeps the other`;
    if (s.contrast) (s.contrast as J).distinctiveFeatures = ['has:action:split', 'has:action:give'];
    return s;
  }
  if (give) { (s.actors as J[]).push({ id: 'q', variant: 'c', at: { x: 80, y: 100 }, facing: 'left', scale: 0.9 }); props.push({ id: 'thing', asset: give.prop, attachTo: { actor: 'p', hand: 'left' }, scale: 0.8, ...(give.state ? { state: give.state } : {}) }); tl.push({ t: 0, action: 'idle', actor: 'q', durationMs: 400 }, { t: 400, action: 'give', from: 'p', to: 'q', prop: 'thing', durationMs: 1600 }, { t: 2000, action: 'idle', actor: 'p', durationMs: 1200 }); (s.focus as J).targets = ['thing']; }
  else if (put) {
    const on = put.on as string | undefined; const wide = on === 'fixture.clothesline'; const placeX = wide ? 92 : 92; // clothesline poles stand at ±40: centre 92 puts the near pole at 52, clear of the figure
    const intoOpen = on ? PROPS[on]?.defaults.open !== undefined : false; // bins, bags, suitcases: the lid opens and the thing goes in
    const onAt = on ? placeThing(s, 'place', on, placeX, { scale: onFloor(on) ? 1 : 1.2, ...(intoOpen ? { state: { open: 1 } } : {}) }, onFloor(on) ? null : 'table') : null;
    props.push({ id: 'thing', asset: put.prop, attachTo: { actor: 'p', hand: 'left' }, scale: 0.8, ...(put.state ? { state: put.state } : {}) });
    const floorThing = onFloor(put.prop as string);
    const target = wide && onAt ? { x: 66, y: onAt.y - 56 } : onAt ? { x: onAt.x + (PROPS[on!]?.mouth?.[0] ?? 0), y: onAt.y + (PROPS[on!]?.mouth?.[1] ?? -4) } : floorThing ? { x: 94, y: 100 } : { x: 92, y: 70 }; if (!onAt && !floorThing) props.push({ id: 'table', asset: 'table', at: { x: 92, y: 100 }, z: -1 }); // furniture goes on the floor, never on a table
    tl.push({ t: 200, action: 'walk', actor: 'p', to: { x: wide ? 28 : on && onFloor(on) ? 54 : 62, y: 100 } }, /* floor containers (suitcases, bins) have lids and bulk: stand further back */ { t: 1500, action: 'put', actor: 'p', prop: 'thing', at: target, durationMs: 800 }, { t: 2400, action: 'idle', actor: 'p', durationMs: 1200 });
    if (intoOpen) tl.push({ t: 2300, action: 'tween', target: 'thing', prop: 'opacity', from: 1, to: 0, durationMs: 250 }, { t: 2600, action: 'set', target: 'place', prop: 'full', value: 1 }); // it is inside now
    (s.focus as J).targets = ['thing']; }
  else if (take) {
    const from = take.from as string | undefined;
    if (from) { // the thing comes OUT of an open container or cupboard
      const fromAt = placeThing(s, 'place', from, 92, { scale: 1, ...(PROPS[from]?.defaults.open !== undefined ? { state: { open: 1 } } : {}) }, onFloor(from) ? null : 'table');
      props.push({ id: 'thing', asset: take.prop, at: { x: fromAt.x + (PROPS[from]?.mouth?.[0] ?? 0), y: fromAt.y + (PROPS[from]?.mouth?.[1] ?? -4) + 2 }, z: 2, scale: 0.75, ...(take.state ? { state: take.state } : {}) });
    } else placeThing(s, 'thing', take.prop as string, 90, { scale: 0.9, ...(take.state ? { state: take.state } : {}) }, onFloor(take.prop as string) ? null : 'table');
    tl.push({ t: 200, action: 'walk', actor: 'p', to: { x: from && onFloor(from) ? 56 : 64, y: 100 } }, { t: 1500, action: 'take', actor: 'p', prop: 'thing', hand: 'left', durationMs: 700 }, { t: 2300, action: 'walk', actor: 'p', to: { x: 30, y: 100 } }); (s.focus as J).targets = ['thing']; }
  (s.focus as J).feature = `${give ? 'gives' : put ? 'puts down' : 'takes'} ${(give ?? put ?? take)?.prop}`;
  if (s.contrast) (s.contrast as J).distinctiveFeatures = [`has:action:${give ? 'give' : put ? 'put' : 'take'}`];
  return s;
}
function buildDress(row: PlanRow, s: J): J | null {
  const tl = s.timeline as J[]; const d = DRESS[row.lemma], f = FASTEN[row.lemma]; if (!d && !f) return null;
  s.environment = { id: 'bedroom', time: 'day' }; s.durationMs = 3600; s.posterMs = 3000;
  (s.actors as J[]).push({ id: 'p', variant: 'a', at: { x: 60, y: 100 }, facing: 'right', wardrobe: (d ?? f)!.start });
  tl.push({ t: 0, action: 'idle', actor: 'p', durationMs: 300 }, f ? { t: 300, action: 'fasten', actor: 'p', what: f.what, on: f.on, durationMs: 2200 } : { t: 300, action: 'dress', actor: 'p', garment: d!.garment, on: d!.on, ...(d!.value ? { value: d!.value } : {}), durationMs: 1800 }, { t: 2500, action: 'idle', actor: 'p', durationMs: 1100 });
  (s.focus as J).targets = ['p']; (s.focus as J).feature = f ? `${f.what} ${f.on ? 'fastened' : 'opened'}` : `${d!.garment} ${d!.on ? 'on' : 'off'}`;
  if (s.contrast) (s.contrast as J).distinctiveFeatures = [`has:action:${f ? 'fasten' : 'dress'}`];
  return s;
}
function buildCook(_row: PlanRow, r: Recipe, s: J): J {
  const tl = s.timeline as J[]; const props = s.props as J[];
  s.environment = { id: 'kitchen', time: 'day' }; s.durationMs = 4600; s.posterMs = 3800; s.template = 'cook-rhythm';
  (s.actors as J[]).push({ id: 'p', variant: 'b', at: { x: 74, y: 100 }, facing: 'left', wardrobe: { top: 'green' } });
  props.push({ id: 'stove', asset: 'stove', at: { x: 42, y: 100 }, z: 0 }, { id: 'pan', asset: 'pan', at: { x: 42, y: 70 }, z: 1, state: { contents: (r.contents as string) ?? 'egg' } });
  if (r.flip) { props.push({ id: 'spatula', asset: 'spatula', attachTo: { actor: 'p', hand: 'left' } }); tl.push({ t: 0, action: 'cook', actor: 'p', pan: 'pan', kind: 'fry', tool: 'spatula', durationMs: 2400 }, { t: 2500, action: 'flip', actor: 'p', pan: 'pan', tool: 'spatula', durationMs: 1500 }, { t: 4000, action: 'cook', actor: 'p', pan: 'pan', kind: 'fry', tool: 'spatula', durationMs: 600 }); s.durationMs = 5200; s.posterMs = 4400; }
  else if (r.splash) tl.push({ t: 0, action: 'cook', actor: 'p', pan: 'pan', kind: 'fry', durationMs: 1600 }, { t: 1700, action: 'splash', pan: 'pan', actor: 'p', durationMs: 900 }, { t: 2800, action: 'cook', actor: 'p', pan: 'pan', kind: 'fry', durationMs: 1200 });
  else tl.push({ t: 0, action: 'idle', actor: 'p', durationMs: 300 }, { t: 300, action: 'cook', actor: 'p', pan: 'pan', kind: (r.kind as string) ?? 'fry', durationMs: 4300 });
  (s.focus as J).targets = ['pan']; (s.focus as J).feature = `${r.kind ?? 'fry'} ${r.contents ?? 'egg'}${r.flip ? ', flip' : r.splash ? ', splash' : ''}`;
  if (s.contrast) (s.contrast as J).distinctiveFeatures = r.flip ? ['has:action:flip'] : r.splash ? ['has:action:splash'] : [{ fry: 'end:pan.browning>=0.5', brown: 'end:pan.browning>=0.9', sear: 'end:pan.sizzle>=0.9', burn: 'end:pan.burnt>=0.9', melt: 'end:pan.melt>=0.9' }[(r.kind as string) ?? 'fry'] ?? 'has:action:cook'];
  return s;
}
function buildManipulate(_row: PlanRow, r: Recipe, s: J): J | null {
  const tl = s.timeline as J[]; const props = s.props as J[];
  s.environment = { id: 'kitchen', time: 'day' }; s.durationMs = 4000; s.posterMs = 2200;
  const eat = r.eat as J | undefined, pour = r.pour as J | undefined;
  (s.actors as J[]).push({ id: 'p', variant: 'c', at: { x: 50, y: 100 }, facing: 'right' });
  if (eat) { props.push({ id: 'food', asset: eat.prop, attachTo: { actor: 'p', hand: 'left' }, scale: 0.9 }); tl.push({ t: 300, action: 'eat', actor: 'p', prop: 'food', durationMs: 2200, reaction: 'happy', sound: (eat.sound as string) ?? 'none' }, { t: 2600, action: 'idle', actor: 'p', durationMs: 1400 }); (s.focus as J).targets = ['p', 'food']; (s.focus as J).feature = `eats ${eat.prop}${eat.sound && eat.sound !== 'none' ? ` with ${eat.sound} sound` : ''}`; if (s.contrast) (s.contrast as J).distinctiveFeatures = eat.sound && eat.sound !== 'none' ? [`has:sound:${eat.sound}`, 'has:action:eat'] : ['has:action:eat']; return s; }
  if (pour) { props.push({ id: 'jug', asset: pour.from, attachTo: { actor: 'p', hand: 'right' } }); placeThing(s, 'into', pour.into as string, 86, { scale: onFloor(pour.into as string) ? 1 : 1.2 }, onFloor(pour.into as string) ? null : 'table'); tl.push({ t: 300, action: 'pour', actor: 'p', from: 'jug', into: 'into', amount: 0.7, durationMs: 2400 }); (s.focus as J).targets = ['into']; (s.focus as J).feature = `pours from ${pour.from} into ${pour.into}`; if (s.contrast) (s.contrast as J).distinctiveFeatures = ['has:action:pour']; return s; }
  return null;
}

export function draftScene(row: PlanRow, recipe: Recipe, moduleTitle: string, existingBySense: Map<string, string>): SceneInput | null {
  // near-synonyms are never contrast partners: the same picture covers them, so they go to confusableWith instead
  const syn = synonymsOf(row.lemma); const lemmaOf = (senseId: string) => (senseId.split('.')[1] ?? '').replace(/-/g, ' ');
  const synIds = row.contrast.filter((c) => syn.includes(lemmaOf(c)));
  const partners = row.contrast.filter((c) => !syn.includes(lemmaOf(c))).map((c) => existingBySense.get(c)).filter((x): x is string => !!x);
  const env = (recipe.env as string) ?? ((recipe.bearer as J | undefined)?.env as string | undefined) ?? 'room';
  const s = base(row, recipe.template, moduleTitle, recipe, partners, env);
  if (synIds.length) (s.pedagogy as J).confusableWith = synIds;
  let out: J | null = null;
  switch (recipe.template) {
    case 'attribute-gloss': case 'property-contrast': case 'emotion': out = buildAttribute(row, recipe, s); break;
    case 'tool-rhythm': out = buildTool(row, recipe, s); break;
    case 'process': out = buildProcess(row, recipe, s); break;
    case 'communicate': out = buildCommunicate(row, recipe, s); break;
    case 'social': case 'arrange': out = buildSocial(row, recipe, s); break;
    case 'dress-self': out = buildDress(row, s); break;
    case 'cook-rhythm': out = buildCook(row, recipe, s); break;
    case 'manipulate-prop': out = buildManipulate(row, recipe, s); break;
    default: { const tpl = TEMPLATES[recipe.template]; if (!tpl) return null; const m = /^s\.([^.]+)\.(\d+)$/.exec(row.senseId)!; const st = tpl.make(row.senseId, m[1]!, m[2]!) as unknown as J; st.titleSv = row.lemma; st.meaningHint = row.defSv ?? st.meaningHint; out = st; }
  }
  if (!out) return null;
  if (Array.isArray(out.shapes) && !(out.shapes as J[]).length) delete out.shapes;
  return out as unknown as SceneInput;
}

/** Hand-off text for a word the tool cannot do on its own: what is missing, what to imitate, where the rules are. */
export function handoffNote(reason: string, hints: string[], nearest: string[]): string {
  return [`MANUELLT – ${reason}`, ...hints.map((h) => `• ${h}`), nearest.length ? `• liknande lösta ord: ${nearest.join(', ')} (registry/recipes.json)` : '', '• läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut'].filter(Boolean).join(' ');
}

export function runBatch(plan: Plan, moduleTitle: string, existingBySense: Map<string, string>, opts: { write?: boolean; force?: boolean; files?: Map<string, string>; /** 'fallback': generate when no hand recipe exists (default); 'only': ignore hand recipes – for measuring the generator */ generate?: 'fallback' | 'only' | 'off'; /** build low-confidence generated recipes too (default: they are handed off as proposals) */ allowLow?: boolean; /** write scenes under this directory instead of scenes/ (measurements never touch the library) */ outDir?: string } = {}): BatchResult[] {
  const hand = loadRecipes(); const out: BatchResult[] = [];
  const generate = opts.generate ?? 'fallback'; const seen = new Map<string, string>();
  const recipeFor = (row: PlanRow): { recipe?: Recipe; manual?: { reason: string; hints: string[]; nearest: string[] }; generated?: string } => {
    const h = generate === 'only' ? undefined : hand[row.senseId] ?? hand[row.lemma];
    if (h) return { recipe: h };
    if (generate === 'off') return {};
    const inf = inferRecipe({ senseId: row.senseId, lemma: row.lemma, pos: row.pos, defSv: row.defSv, examples: row.examples, jaGloss: row.jaGloss, antonyms: row.antonyms }, hand);
    if (inf.ok && inf.confidence === 'low' && !opts.allowLow) return { manual: { reason: `bara familjen är säker (${inf.why.join('; ')}) – förslag: ${JSON.stringify(inf.recipe)}`, hints: ['bekräfta eller ändra förslaget och skriv det som regel i lexicon.ts eller recept i recipes.json'], nearest: [] } };
    return inf.ok ? { recipe: inf.recipe, generated: `${inf.confidence}: ${inf.why.join('; ')}` } : { manual: { reason: inf.reason, hints: inf.hints, nearest: inf.nearest } };
  };
  const recipes = new Proxy({} as Record<string, Recipe>, { get: () => undefined }); void recipes;
  // contrast partners may be created in this same run: every row that has a buildable recipe will exist afterwards
  const willExist = new Map(existingBySense);
  for (const row of plan.rows) { if (row.kind !== 'animation' || willExist.has(row.senseId)) continue; const rec = recipes[row.senseId] ?? recipes[row.lemma]; if (!rec || rec.template === 'image') continue; const m = /^s\.([^.]+)\.(\d+)$/.exec(row.senseId); if (m) willExist.set(row.senseId, `anim.${m[1]}.${m[2]}`); }
  for (const row of plan.rows) {
    if (row.kind !== 'animation') { out.push({ senseId: row.senseId, lemma: row.lemma, status: 'skipped', note: `${row.kind} – ingen animation` }); continue; }
    if (existingBySense.has(row.senseId) && !opts.force && !opts.outDir) { out.push({ senseId: row.senseId, lemma: row.lemma, animationId: existingBySense.get(row.senseId), status: 'exists', note: 'scen finns' }); continue; }
    const pick = recipeFor(row);
    if (pick.recipe && !pick.manual) {
      const sig = JSON.stringify({ ...pick.recipe, note: undefined, generated: undefined });
      const twin = seen.get(sig); if (twin && !synonymsOf(row.lemma).includes(twin)) { out.push({ senseId: row.senseId, lemma: row.lemma, status: 'manual', note: handoffNote(`samma bild som *${twin}* – två ord får inte ha identiska scener`, [`skilj dem åt (föremål, tillstånd, tempo, slutläge) eller markera det ena som synonym i receptet`], []) }); continue; }
      if (!twin) seen.set(sig, row.lemma); // declared synonyms may share the picture (they are confusableWith, never quizzed against each other)
    }
    if (pick.manual) { out.push({ senseId: row.senseId, lemma: row.lemma, status: 'manual', note: handoffNote(pick.manual.reason, pick.manual.hints, pick.manual.nearest) }); continue; }
    const recipe = pick.recipe;
    if (!recipe) { out.push({ senseId: row.senseId, lemma: row.lemma, status: 'no-recipe', note: 'inget recept – skriv ett recept med bärare/följd i registry/recipes.json innan scenen görs' }); continue; }
    const genNote = pick.generated ? ` [genererat ${pick.generated}]` : '';
    if (recipe.template === 'image') { out.push({ senseId: row.senseId, lemma: row.lemma, status: 'image', note: recipe.note ?? 'bild' }); continue; }
    // a recipe marked TODO/SVAGT/saknas is a known gap: no draft is written, so the product owner never sees a scene the tool itself knows is wrong
    if (/TODO|SVAGT|svag|saknas/i.test(recipe.note ?? '')) { out.push({ senseId: row.senseId, lemma: row.lemma, template: recipe.template, status: 'blocked', note: `receptet är märkt som svagt – ingen scen skapas: ${recipe.note}` }); continue; }
    const draft = draftScene(row, recipe, moduleTitle, willExist);
    if (!draft) { out.push({ senseId: row.senseId, lemma: row.lemma, template: recipe.template, status: 'no-recipe', note: `receptet kan inte byggas (${recipe.template}${recipe.bearer ? '' : ', ingen bärare'})` }); continue; }
    const v = validateScene(draft as unknown);
    const errors = v.problems.filter((p) => p.level === 'error').map((p) => p.message);
    const file = opts.outDir ? path.join(opts.outDir, draft.animationId.split('.')[1] ?? 'misc', `${draft.animationId}.json`) : (opts.files?.get(draft.animationId) ?? sceneFilePath(draft.animationId)); // --force updates the scene where it already lives
    const weak = (/TODO|SVAGT|svag|saknas/i.test(recipe.note ?? '') ? ` ⚠ ${recipe.note}` : (recipe.note ?? '')) + genNote;
    if (errors.length) { out.push({ senseId: row.senseId, lemma: row.lemma, animationId: draft.animationId, template: recipe.template, status: 'invalid', note: weak, problems: errors }); continue; }
    if (opts.write) { fs.mkdirSync(path.dirname(file), { recursive: true }); writeScene(file, Scene.parse(draft)); }
    out.push({ senseId: row.senseId, lemma: row.lemma, animationId: draft.animationId, template: recipe.template, status: 'created', file, note: weak });
  }
  return out;
}

export function batchMarkdown(plan: Plan, results: BatchResult[]): string {
  const count = (k: BatchResult['status']) => results.filter((r) => r.status === k).length;
  return [`# Batch: ${plan.titleSv} (${plan.moduleId})`, '', `Skapade ${count('created')} utkast, ${count('exists')} fanns, ${count('skipped')} ej animation, ${count('image')} bild, ${count('blocked')} blockerade (svagt recept, ingen scen), ${count('manual')} manuella (verktyget säger ifrån – se anmärkningen), ${count('invalid')} ogiltiga, ${count('no-recipe')} utan recept.`, '',
    '**Regel:** ett utkast är klart först när remsan är granskad och blindtestet godkänt (`anim:blindtest`). Rader märkta ⚠ har ett recept med känd svaghet – läs anmärkningen och förbättra scenen eller receptet innan blindtest. Rader med status *manual* kan verktyget inte göra själv: följ anmärkningen och `docs/MANUAL_SCENES.md`, och lägg det du lär dig i `src/tools/lexicon.ts` så att nästa liknande ord går automatiskt.', '',
    '| Ord | Status | Scen | Mall | Anmärkning |', '|---|---|---|---|---|',
    ...results.map((r) => `| ${r.lemma} | ${r.status} | ${r.animationId ?? '–'} | ${r.template ?? '–'} | ${[r.note, ...(r.problems ?? [])].filter(Boolean).join('; ')} |`), ''].join('\n');
}
export const batchDir = (): string => path.join(registryDir(), 'batch');
export type { SceneT };
