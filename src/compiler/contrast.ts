/**
 * Machine-checkable contrast claims. Supported forms:
 *   actor.<id>.eyes:<open|half|closed|wide>[>=fraction]   (fraction of the scene, default 0.6)
 *   actor.<id>.posture:<standing|reclined|lying>[>=fraction]
 *   environment.time:<day|evening|night>
 *   prop:<asset>                                           (scene contains a prop of that asset)
 *   motion:<actor>[>=fraction]                             (actor travels or any joint moves)
 *   speed:<actor>>=<units/s> | speed:<actor><=<units/s>    (ground speed while moving, incl. world scroll)
 *   airborne:<actor>[>=fraction|<=fraction]                (both feet off the ground: hips lifted > 1 unit)
 *   end:<prop>.<stateKey>>=value | <=value                 (prop state at the end of the scene)
 *   peaklift:<actor>>=units | <=units                       (highest point the hips reach above standing)
 *   has:actors>=N | has:actors==N | has:props>=N | has:entities>=N   (structure)
 *   has:action:<a|b|c>                                     (timeline contains one of these actions)
 *   has:icon:<a|b>                                         (a shape icon of one of these kinds)
 *   has:cjk-text                                           (a text shape with Japanese characters)
 *   has:contrast                                           (a contrast pair is declared)
 */
import { JOINTS } from '../schema/scene';
import { fractionEqual, sample, sampleNumber } from '../engine/track';
import type { CompiledScene } from './compile';
import type { Problem } from './validate';
import type { Scene } from '../schema/scene';
import { compileScene } from './compile';

export function evaluateFeature(c: CompiledScene, feature: string): { ok: boolean; detail: string } {
  const colon = feature.indexOf(':');
  if (colon <= 0) return { ok: false, detail: `cannot parse "${feature}"` };
  const lhs = feature.slice(0, colon), rhsRaw = feature.slice(colon + 1);
  const le = rhsRaw.includes('<=');
  const [rhs, fracRaw] = le ? rhsRaw.split('<=') : rhsRaw.split('>=');
  const minFrac = fracRaw ? Number(fracRaw) : 0.6;
  const D = c.durationMs;
  if (lhs === 'has') {
    const sc = c.scene;
    const m2 = /^(actors|props|entities)(>=|==)(\d+)$/.exec(rhsRaw);
    if (m2) { const n = m2[1] === 'actors' ? sc.actors.length : m2[1] === 'props' ? sc.props.length : sc.actors.length + sc.props.length + sc.shapes.length; const want = Number(m2[3]); const ok = m2[2] === '>=' ? n >= want : n === want; return { ok, detail: `${m2[1]} = ${n}` }; }
    if (rhsRaw.startsWith('action:')) { const names = rhsRaw.slice(7).split('|'); const have = new Set(sc.timeline.map((a) => a.action)); return { ok: names.some((x) => have.has(x as never)), detail: `actions: ${[...have].join(', ') || 'none'}` }; }
    if (rhsRaw.startsWith('icon:')) { const names = rhsRaw.slice(5).split('|'); const have = sc.shapes.filter((x) => x.type === 'icon').map((x) => (x as { icon: string }).icon); return { ok: names.some((x) => have.includes(x)), detail: `icons: ${have.join(', ') || 'none'}` }; }
    if (rhsRaw === 'cjk-text') { const ok = sc.shapes.some((x) => x.type === 'text' && /[\u3000-\u9fff\uf900-\ufaff\uff00-\uffef]/.test((x as { text: string }).text)); return { ok, detail: ok ? 'has Japanese text' : 'no Japanese text shape' }; }
    if (rhsRaw === 'contrast') return { ok: !!sc.contrast, detail: sc.contrast ? `contrast with ${sc.contrast.with.join(', ')}` : 'no contrast pair' };
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
  if (lhs === 'end') {
    const [prop, key] = rhs!.split('.'); const v = sampleNumber(c.tracks, `${prop}.s.${key}`, D, NaN);
    return { ok: Number.isNaN(v) ? false : le ? v <= minFrac : v >= minFrac, detail: `${prop}.${key} ends at ${Number.isNaN(v) ? 'undefined' : v.toFixed(2)}` };
  }
  if (lhs === 'environment.time') return { ok: c.scene.environment.time === rhs, detail: `environment.time is ${c.scene.environment.time}` };
  if (lhs === 'prop') return { ok: c.scene.props.some((p) => p.asset === rhs), detail: `props: ${c.scene.props.map((p) => p.asset).join(', ') || 'none'}` };
  if (lhs === 'motion') {
    const a = rhs!; let moved = 0;
    for (let t = 0; t <= D; t += 80) { const x = sampleNumber(c.tracks, `${a}.x`, t, 0), x2 = sampleNumber(c.tracks, `${a}.x`, t + 80, 0); const jointMoved = JOINTS.some((j) => Math.abs(sampleNumber(c.tracks, `${a}.j.${j}`, t, 0) - sampleNumber(c.tracks, `${a}.j.${j}`, t + 80, 0)) > 1); if (Math.abs(x - x2) > 0.5 || jointMoved) moved++; }
    const frac = moved / Math.max(1, Math.floor(D / 80));
    return { ok: frac >= minFrac, detail: `${a} moves during ${(frac * 100).toFixed(0)}% of the scene` };
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
