/**
 * Machine-checkable contrast claims. Supported forms:
 *   actor.<id>.eyes:<open|half|closed|wide>[>=fraction]   (fraction of the scene, default 0.6)
 *   actor.<id>.posture:<standing|reclined|lying>[>=fraction]
 *   environment.time:<day|evening|night>
 *   prop:<asset>                                           (scene contains a prop of that asset)
 *   motion:<actor>[>=fraction|<=fraction]                  (actor travels or any joint moves)
 *   speed:<actor>>=<units/s> | speed:<actor><=<units/s>    (ground speed while moving, incl. world scroll)
 *   airborne:<actor>[>=fraction|<=fraction]                (both feet off the ground: hips lifted > 1 unit)
 *   end:<prop>.<stateKey>>=value | <=value                 (prop state at the end of the scene)
 *   wear:<actor>.<key>>=v | <=v | ==str  (wardrobe at the end; wear-start: at the start)
 *   peaklift:<actor>>=units | <=units                       (highest point the hips reach above standing)
 *   has:actors>=N | has:actors==N | has:props>=N | has:entities>=N   (structure)
 *   has:action:<a|b|c>                                     (timeline contains one of these actions)
 *   has:icon:<a|b>                                         (a shape icon of one of these kinds)
 *   has:cjk-text                                           (a text shape with Japanese characters)
 *   has:contrast                                           (a contrast pair is declared)
 *   has:say-icon:<a|b> | has:say-mood:<a|b> | has:sound:<a|b> | has:prop:<asset|asset>
 *   has:emphasis:<glint|ring|…> | has:express:<emotion|emotion> | has:walk-manner:<normal|careful> | has:bow:<light|deep>
 */
import { JOINTS } from '../schema/scene';
import { fractionEqual, sample, sampleNumber, sampleBool, sampleString } from '../engine/track';
import { color } from '../assets/palette';
import type { CompiledScene } from './compile';
import type { Problem } from './validate';
import type { Scene } from '../schema/scene';
import { compileScene } from './compile';

export function evaluateFeature(c: CompiledScene, feature: string): { ok: boolean; detail: string } {
  const colon = feature.indexOf(':');
  if (colon <= 0) return { ok: false, detail: `cannot parse "${feature}"` };
  const lhs = feature.slice(0, colon), rhsRaw = feature.slice(colon + 1);
  const le = rhsRaw.includes('<=');
  const eq = rhsRaw.includes('==') && !rhsRaw.startsWith('actors') && !rhsRaw.startsWith('props') && !rhsRaw.startsWith('entities');
  const [rhs, fracRaw] = eq ? rhsRaw.split('==') : le ? rhsRaw.split('<=') : rhsRaw.split('>=');
  const eqStr = eq ? fracRaw : undefined;
  const minFrac = fracRaw && !eq ? Number(fracRaw) : 0.6;
  const D = c.durationMs;
  if (lhs === 'has') {
    const sc = c.scene;
    const m2 = /^(actors|props|entities)(>=|==)(\d+)$/.exec(rhsRaw);
    if (m2) { const n = m2[1] === 'actors' ? sc.actors.length : m2[1] === 'props' ? sc.props.length : sc.actors.length + sc.props.length + sc.shapes.length; const want = Number(m2[3]); const ok = m2[2] === '>=' ? n >= want : n === want; return { ok, detail: `${m2[1]} = ${n}` }; }
    if (rhsRaw.startsWith('action:')) { const names = rhsRaw.slice(7).split('|'); const have = new Set(sc.timeline.map((a) => a.action)); return { ok: names.some((x) => have.has(x as never)), detail: `actions: ${[...have].join(', ') || 'none'}` }; }
    if (rhsRaw.startsWith('icon:')) { const names = rhsRaw.slice(5).split('|'); const have = sc.shapes.filter((x) => x.type === 'icon').map((x) => (x as { icon: string }).icon); return { ok: names.some((x) => have.includes(x)), detail: `icons: ${have.join(', ') || 'none'}` }; }
    if (rhsRaw === 'cjk-text') { const ok = sc.shapes.some((x) => x.type === 'text' && /[\u3000-\u9fff\uf900-\ufaff\uff00-\uffef]/.test((x as { text: string }).text)); return { ok, detail: ok ? 'has Japanese text' : 'no Japanese text shape' }; }
    if (rhsRaw === 'contrast') return { ok: !!sc.contrast, detail: sc.contrast ? `contrast with ${sc.contrast.with.join(', ')}` : 'no contrast pair' };
    if (rhsRaw === 'bearer') { const r = bearerOf(sc); return { ok: !!r, detail: r ? `bearer: ${r}` : 'no bearer: no prop, no wardrobe detail, no icon and no bodily action shows the word' }; }
    if (rhsRaw.startsWith('say-icon:')) { const names = rhsRaw.slice(9).split('|'); const have = sc.timeline.filter((x) => x.action === 'say').map((x) => (x as { icon?: string }).icon ?? ''); return { ok: names.some((x) => have.includes(x)), detail: `say icons: ${have.filter(Boolean).join(', ') || 'none'}` }; }
    if (rhsRaw.startsWith('say-mood:')) { const names = rhsRaw.slice(9).split('|'); const have = sc.timeline.filter((x) => x.action === 'say').map((x) => (x as { mood: string }).mood); return { ok: names.some((x) => have.includes(x)), detail: `say moods: ${have.join(', ') || 'none'}` }; }
    if (rhsRaw.startsWith('sound:')) { const names = rhsRaw.slice(6).split('|'); const have = sc.timeline.filter((x) => x.action === 'sound').map((x) => (x as { kind: string }).kind); return { ok: names.some((x) => have.includes(x)), detail: `sounds: ${have.join(', ') || 'none'}` }; }
    if (rhsRaw.startsWith('walk-manner:')) { const names = rhsRaw.slice(12).split('|'); const have = sc.timeline.filter((x) => x.action === 'walk').map((x) => (x as { manner?: string }).manner ?? 'normal'); return { ok: names.some((x) => have.includes(x)), detail: `walk manners: ${have.join(', ') || 'none'}` }; }
    if (rhsRaw.startsWith('bow:')) { const names = rhsRaw.slice(4).split('|'); const have = sc.timeline.filter((x) => x.action === 'bow').map((x) => (x as { depth?: string }).depth ?? 'light'); return { ok: names.some((x) => have.includes(x)), detail: `bows: ${have.join(', ') || 'none'}` }; }
    if (rhsRaw.startsWith('emphasis:')) { const names = rhsRaw.slice(9).split('|'); const have = sc.timeline.filter((x) => x.action === 'emphasis').map((x) => (x as { kind: string }).kind); return { ok: names.some((x) => have.includes(x)), detail: `emphasis: ${have.join(', ') || 'none'}` }; }
    if (rhsRaw.startsWith('express:')) { const names = rhsRaw.slice(8).split('|'); const have = sc.timeline.filter((x) => x.action === 'express').map((x) => (x as { emotion: string }).emotion); return { ok: names.some((x) => have.includes(x)), detail: `expressions: ${have.join(', ') || 'none'}` }; }
    if (rhsRaw.startsWith('prop:')) { const names = rhsRaw.slice(5).split('|'); const have = sc.props.map((x) => x.asset); return { ok: names.some((x) => have.includes(x)), detail: `props: ${have.join(', ') || 'none'}` }; }
    return { ok: false, detail: `unknown has-feature "${rhsRaw}"` };
  }
  if (lhs === 'speed') {
    const a = rhs!; let dist = 0, moving = 0;
    for (let t = 0; t < D; t += 80) { const dx = Math.abs((sampleNumber(c.tracks, `${a}.x`, t + 80, 0) - sampleNumber(c.tracks, `${a}.x`, t, 0)) + (sampleNumber(c.tracks, 'env.scrollX', t + 80, 0) - sampleNumber(c.tracks, 'env.scrollX', t, 0))); if (dx > 0.2) { dist += dx; moving += 80; } }
    const v = moving ? dist / (moving / 1000) : 0;
    return { ok: le ? v <= minFrac : v >= minFrac, detail: `${a} travels at ${v.toFixed(0)} units/s` };
  }
  if (lhs === 'airborne') {
    const a = rhs!; let n = 0, hit = 0;
    for (let t = 0; t <= D; t += 40) { n++; if (sampleNumber(c.tracks, `${a}.lift`, t, 0) > 1) hit++; }
    return { ok: le ? hit / n <= minFrac : hit / n >= minFrac, detail: `${a} is airborne ${((hit / n) * 100).toFixed(0)}% of the time` };
  }
  if (lhs === 'peaklift') {
    const a = rhs!; let peak = 0; for (let t = 0; t <= D; t += 40) peak = Math.max(peak, sampleNumber(c.tracks, `${a}.lift`, t, 0));
    return { ok: le ? peak <= minFrac : peak >= minFrac, detail: `${a} peak lift is ${peak.toFixed(1)}` };
  }
  if (lhs === 'start') {
    const [prop, key] = rhs!.split('.'); const def = c.scene.props.find((p) => p.id === prop); const stat = def?.state?.[key!];
    const tr = c.tracks.get(`${prop}.s.${key}`); const v = tr && (tr.keys[0]?.t ?? 1) <= 0 ? sampleNumber(c.tracks, `${prop}.s.${key}`, 0, NaN) : typeof stat === 'number' ? stat : NaN;
    if (eqStr !== undefined) return { ok: String(tr ? sample(c.tracks, `${prop}.s.${key}`, 0) : stat) === eqStr, detail: `${prop}.${key} starts as ${String(stat)}` };
    return { ok: Number.isNaN(v) ? false : le ? v <= minFrac : v >= minFrac, detail: `${prop}.${key} starts at ${Number.isNaN(v) ? 'undefined' : v.toFixed(2)}` };
  }
  if (lhs === 'end') {
    const [prop, key] = rhs!.split('.'); const v = sampleNumber(c.tracks, `${prop}.s.${key}`, D, NaN);
    return { ok: Number.isNaN(v) ? false : le ? v <= minFrac : v >= minFrac, detail: `${prop}.${key} ends at ${Number.isNaN(v) ? 'undefined' : v.toFixed(2)}` };
  }
  if (lhs === 'wear' || lhs === 'wear-start') {
    // wardrobe value at the end (or start) of the scene: numeric >=/<= or string ==
    const [actor, key] = rhs!.split('.') as [string, string];
    const def = c.scene.actors.find((x) => x.id === actor)?.wardrobe as Record<string, unknown> | undefined;
    const tAt = lhs === 'wear' ? D : 0; const id = `${actor}.w.${key}`;
    const tr = c.tracks.get(id); const first = tr?.keys[0]?.v;
    // at the start, a track whose first key lies later has not changed anything yet → the static wardrobe applies
    const useTrack = !!tr && (lhs === 'wear' || (tr.keys[0]?.t ?? 1) <= 0);
    const v: unknown = useTrack ? (typeof first === 'number' ? sampleNumber(c.tracks, id, tAt, 0) : typeof first === 'boolean' ? sampleBool(c.tracks, id, tAt, false) : sampleString(c.tracks, id, tAt, '')) : def?.[key];
    if (eqStr !== undefined) { const norm = (x: unknown) => color(String(x)).toLowerCase(); return { ok: norm(v) === norm(eqStr), detail: `${actor}.${key} is ${String(v)}` }; }
    const num = typeof v === 'number' ? v : typeof v === 'boolean' ? (v ? 1 : 0) : NaN;
    return { ok: Number.isNaN(num) ? false : le ? num <= minFrac : num >= minFrac, detail: `${actor}.${key} is ${String(v)}` };
  }
  if (lhs === 'environment.time') return { ok: c.scene.environment.time === rhs, detail: `environment.time is ${c.scene.environment.time}` };
  if (lhs === 'prop') return { ok: c.scene.props.some((p) => p.asset === rhs), detail: `props: ${c.scene.props.map((p) => p.asset).join(', ') || 'none'}` };
  if (lhs === 'motion') {
    const a = rhs!; let moved = 0;
    for (let t = 0; t <= D; t += 80) { const x = sampleNumber(c.tracks, `${a}.x`, t, 0), x2 = sampleNumber(c.tracks, `${a}.x`, t + 80, 0); const jointMoved = JOINTS.some((j) => Math.abs(sampleNumber(c.tracks, `${a}.j.${j}`, t, 0) - sampleNumber(c.tracks, `${a}.j.${j}`, t + 80, 0)) > 1); if (Math.abs(x - x2) > 0.5 || jointMoved) moved++; }
    const frac = moved / Math.max(1, Math.floor(D / 80));
    return { ok: le ? frac <= minFrac : frac >= minFrac, detail: `${a} moves during ${(frac * 100).toFixed(0)}% of the scene` };
  }
  const m = /^actor\.([^.]+)\.(eyes|posture)$/.exec(lhs);
  if (m) {
    const [, a, what] = m;
    if (what === 'eyes') { const frac = fractionEqual(c.tracks, `${a}.eyes`, 0, D, rhs!); return { ok: frac >= minFrac, detail: `${a}.eyes is "${rhs}" ${(frac * 100).toFixed(0)}% of the time` }; }
    let hit = 0, n = 0;
    for (let t = 0; t <= D; t += 80) { n++; const rot = Math.abs(sampleNumber(c.tracks, `${a}.bodyRotate`, t, 0)), torso = sampleNumber(c.tracks, `${a}.j.torso`, t, 0); const posture = rot > 60 ? 'lying' : torso < -12 ? 'reclined' : 'standing'; if (posture === rhs) hit++; }
    return { ok: hit / n >= minFrac, detail: `${a} posture is "${rhs}" ${((hit / n) * 100).toFixed(0)}% of the time` };
  }
  void sample;
  return { ok: false, detail: `unknown feature "${feature}"` };
}

export function checkContrast(c: CompiledScene, others: Map<string, Scene>): Problem[] {
  const out: Problem[] = [];
  const contrast = c.scene.contrast!;
  for (const f of contrast.distinctiveFeatures) {
    const r = evaluateFeature(c, f);
    if (!r.ok) out.push({ level: 'error', message: `contrast feature "${f}" does not hold in this scene (${r.detail})` });
  }
  for (const otherId of contrast.with) {
    const other = others.get(otherId);
    if (!other) { out.push({ level: 'warning', message: `contrast partner "${otherId}" not found – cannot verify the difference` }); continue; }
    const oc = compileScene(other);
    const differs = contrast.distinctiveFeatures.some((f) => !evaluateFeature(oc, f).ok);
    if (!differs) out.push({ level: 'error', message: `every distinctive feature also holds in "${otherId}" – the pair is not visibly different` });
  }
  return out;
}

/** The entity that bears the word: a prop, a wardrobe detail, an icon, or a bodily action. Null when the scene is only a person (and text). */
export const WARDROBE_DETAILS = ['hat', 'glasses', 'scarf', 'buttons', 'zipper', 'sleeves', 'apron', 'laces', 'pattern', 'headband', 'number', 'shorts', 'topLength', 'top', 'bottom', 'shoes'];
export const BODY_ACTIONS = ['walk', 'run', 'jump', 'exercise', 'express', 'dress', 'fasten', 'climb', 'roll', 'relax', 'sleep', 'eat', 'give', 'use', 'cook', 'flip', 'pour', 'open', 'close', 'bow', 'split'];
/** icons that depict a gesture: never the sole bearer (CLAUDE.md §8) – a bodily action must accompany them */
export const GESTURE_ICONS = ['hand', 'palms', 'wave'];
export function bearerOf(sc: { props: { asset: string }[]; shapes: { type: string }[]; actors: { wardrobe?: Record<string, unknown> }[]; timeline: { action: string }[] }): string | null {
  if (sc.props.length) return `prop ${sc.props[0]!.asset}`;
  const icon = sc.shapes.find((x) => x.type === 'icon'); if (icon) return 'icon';
  for (const a of sc.actors) { const w = a.wardrobe ?? {}; const d = WARDROBE_DETAILS.find((k) => w[k] !== undefined && w[k] !== 'none' && w[k] !== false); if (d) return `wardrobe ${d}`; }
  const act = sc.timeline.find((x) => BODY_ACTIONS.includes(x.action)); if (act) return `action ${act.action}`;
  const say = sc.timeline.find((x) => x.action === 'say' && (x as { icon?: string }).icon); if (say) return `say icon ${(say as { icon?: string }).icon}`;
  return null;
}
