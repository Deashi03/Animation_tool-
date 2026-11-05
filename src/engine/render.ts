/**
 * renderFrame(compiled, t) → Frame. Pure: same inputs, same tree. Samples the
 * tracks, solves rigs, draws environment, entities in z-order, attached props,
 * effects (pour stream, zzz, emphasis) and the optional label.
 */
import { sampleBool, sampleNumber, sampleString } from '../engine/track';
import type { CompiledScene } from '../compiler/compile';
import { circle, g, line, path, rect, text, type Frame, type FrameNode, r1 } from './frame';
import { drawCharacter, VARIANTS, type CharacterState } from '../assets/character';
import { PROPS, drawProp, HELD_TILT_DEG, type PropState } from '../assets/props';
import { ENVS } from '../assets/environments';
import { palette as C, color } from '../assets/palette';
import { solveRig, type P, type Pose } from './rig';
import { JOINTS, type ShapeDef } from '../schema/scene';
import { drawIcon } from '../assets/icons';

export type RenderOptions = { showLabel?: boolean };

export function renderFrame(c: CompiledScene, tIn: number, opts: RenderOptions = {}): Frame {
  const { scene, tracks } = c;
  const t = Math.max(0, Math.min(c.durationMs, tIn));
  const { w, h } = scene.canvas;
  const env = ENVS[scene.environment.id] ?? ENVS.neutral!;
  const time = scene.environment.time;
  const bg = scene.background ? color(scene.background) : scene.kind === 'ui' ? 'transparent' : env.paper(time);
  const layers: { z: number; order: number; node: FrameNode }[] = [];
  let order = 0;
  // --- actors: solve first so attached props can find hands
  const actorWorld = new Map<string, { pos: P; scale: number; facing: 1 | -1; rig: ReturnType<typeof solveRig>; rot: number }>();
  const holding = new Map<string, { left?: FrameNode; right?: FrameNode }>();
  for (const a of scene.actors) holding.set(a.id, {});
  // --- props (attached ones are drawn inside the hand)
  for (const p of scene.props) {
    const attach = sampleString<string>(tracks, `${p.id}.attach`, t, '');
    const state: PropState = {};
    for (const key of Object.keys({ ...(PROPS[p.asset]?.defaults ?? {}), ...p.state })) {
      const v = tracks.get(`${p.id}.s.${key}`) ? (sampleNumber(tracks, `${p.id}.s.${key}`, t, NaN)) : NaN;
      state[key] = Number.isNaN(v) ? (sampleString(tracks, `${p.id}.s.${key}`, t, String(p.state[key] ?? '')) as string) : v;
      if (typeof tracks.get(`${p.id}.s.${key}`)?.keys[0]?.v === 'boolean') state[key] = sampleBool(tracks, `${p.id}.s.${key}`, t, true);
    }
    if (p.asset === 'window') state.time = time;
    const node = drawProp(p.asset, state, p.color);
    const scale = sampleNumber(tracks, `${p.id}.scale`, t, p.scale);
    if (attach) {
      const [actorId, hand] = attach.split(':') as [string, 'left' | 'right'];
      const spec = PROPS[p.asset];
      const tilt = typeof state.tilt === 'number' ? state.tilt : 0;
      const facing = sampleString<string>(tracks, `${actorId}.facing`, t, 'right') === 'left' ? -1 : 1;
      // held props stay upright in the hand (no arm rotation); `tilt` rotates them forward around the grip
      const held = g([g([node], { x: -(spec?.grip[0] ?? 0), y: -(spec?.grip[1] ?? 0) })], { rotate: tilt * HELD_TILT_DEG, scale }, { id: `entity.${p.id}` });
      const hset = holding.get(actorId); if (hset) hset[hand] = held;
      void facing;
      continue;
    }
    const x = sampleNumber(tracks, `${p.id}.x`, t, p.at?.x ?? 0), y = sampleNumber(tracks, `${p.id}.y`, t, p.at?.y ?? c.ground);
    layers.push({ z: sampleNumber(tracks, `${p.id}.z`, t, p.z), order: order++, node: g([node], { x, y, scale, rotate: sampleNumber(tracks, `${p.id}.rotate`, t, p.rotate) }, { id: `entity.${p.id}`, opacity: sampleNumber(tracks, `${p.id}.opacity`, t, 1) }) });
  }
  for (const a of scene.actors) {
    const pose = {} as Pose;
    for (const j of JOINTS) pose[j] = sampleNumber(tracks, `${a.id}.j.${j}`, t, 0);
    const facing: 1 | -1 = sampleString<string>(tracks, `${a.id}.facing`, t, a.facing) === 'left' ? -1 : 1;
    const lift = sampleNumber(tracks, `${a.id}.lift`, t, 0), rot = sampleNumber(tracks, `${a.id}.bodyRotate`, t, 0);
    const pos: P = [sampleNumber(tracks, `${a.id}.x`, t, a.at.x), sampleNumber(tracks, `${a.id}.y`, t, a.at.y)];
    const scale = sampleNumber(tracks, `${a.id}.scale`, t, a.scale);
    const base = VARIANTS[a.variant];
    const wardrobe = { ...base, ...(a.wardrobe ? Object.fromEntries(Object.entries(a.wardrobe).filter(([, v]) => v !== undefined).map(([k, v]) => [k, typeof v === 'string' && k !== 'hairStyle' ? color(v) : v])) : {}) } as CharacterState['wardrobe'];
    const st: CharacterState = {
      pose, facing, lift, bodyRotate: rot, wardrobe,
      face: { eyes: sampleString(tracks, `${a.id}.eyes`, t, 'open'), brows: sampleString(tracks, `${a.id}.brows`, t, 'neutral'), mouth: sampleString(tracks, `${a.id}.mouth`, t, 'smile'), gaze: sampleNumber(tracks, `${a.id}.gaze`, t, 0), blush: sampleBool(tracks, `${a.id}.blush`, t, false), blink: sampleBool(tracks, `${a.id}.blink`, t, false) },
      holding: holding.get(a.id) ?? {},
    };
    const rig = solveRig(pose, facing, lift);
    actorWorld.set(a.id, { pos, scale, facing, rig, rot });
    const body = drawCharacter(st);
    // the character is drawn facing right in local space; flip for left
    const flipped = facing === -1 ? g([body], { scaleX: -1 }) : body;
    layers.push({ z: sampleNumber(tracks, `${a.id}.z`, t, 0), order: order++, node: g([flipped], { x: pos[0], y: pos[1], scale }, { id: `entity.${a.id}`, opacity: sampleNumber(tracks, `${a.id}.opacity`, t, 1) }) });
  }
  for (const s of scene.shapes) layers.push({ z: sampleNumber(tracks, `${s.id}.z`, t, s.z), order: order++, node: drawShape(c, s, t) });
  layers.sort((p, q) => p.z - q.z || p.order - q.order);

  // --- effects
  const fx: FrameNode[] = [];
  for (const p of scene.props) {
    const into = sampleString<string>(tracks, `fx.pour.${p.id}`, t, '');
    if (into) {
      const from = worldAnchor(c, actorWorld, p.id, 'mouth', t), to = worldAnchor(c, actorWorld, into, 'mouth', t);
      if (from && to) fx.push(path(`M${r1(from[0])} ${r1(from[1])} C${r1(from[0])} ${r1(from[1] + (to[1] - from[1]) * 0.5)} ${r1(to[0])} ${r1(from[1] + (to[1] - from[1]) * 0.4)} ${r1(to[0])} ${r1(to[1])}`, { stroke: C.water2, sw: 3, fill: 'none', linecap: 'round' }));
    }
  }
  for (const a of scene.actors) {
    // speed lines behind a fast-moving actor (treadmill): short, few, fading
    const sp = sampleNumber(tracks, `fx.${a.id}.speed`, t, 0);
    const aw0 = actorWorld.get(a.id);
    if (Math.abs(sp) > 60 && aw0) {
      const back = -Math.sign(sp), hipY = aw0.pos[1] - 34 * aw0.scale, phase = (t % 180) / 180;
      for (let i = 0; i < 3; i++) { const y = hipY - 16 + i * 10, len = 8 + (i % 2) * 4, x0 = aw0.pos[0] + back * (16 + i * 3 + phase * 6); fx.push(line([[x0, y], [x0 + back * len, y]], { stroke: C.ink, sw: 1.6, opacity: 0.35 * (1 - phase * 0.5) })); }
    }
    const z = sampleNumber(tracks, `fx.${a.id}.zzz`, t, -1);
    const aw = actorWorld.get(a.id);
    if (z >= 0 && aw) {
      const head: P = worldPoint(aw, aw.rig.head);
      for (let i = 0; i < 2; i++) { const u = (z + i * 0.45) % 1; fx.push(text(head[0] + 16 + i * 6 + u * 6, head[1] - 10 - u * 22, 'z', 7 + i * 3, { fill: C.navy, weight: 700, opacity: Math.max(0, 1 - u) })); }
    }
  }
  for (const id of [...scene.actors.map((a) => a.id), ...scene.props.map((p) => p.id), ...scene.shapes.map((s) => s.id)]) {
    for (const kind of ['ring', 'glow', 'arrowDown'] as const) {
      const u = sampleNumber(tracks, `fx.${id}.${kind}`, t, -1);
      if (u < 0 || u > 1) continue;
      const node = layers.find((l) => (l.node as { id?: string }).id === `entity.${id}`)?.node;
      const b = node ? bboxOf(node) : null;
      if (!b) continue;
      const cx = (b.x1 + b.x2) / 2, cy = (b.y1 + b.y2) / 2, rad = Math.max(b.x2 - b.x1, b.y2 - b.y1) / 2 + 4;
      if (kind === 'ring') fx.push(circle(cx, cy, rad + u * 10, { stroke: C.accent, sw: 2.5 - u * 2, fill: 'none', opacity: 1 - u }));
      if (kind === 'glow') fx.push(circle(cx, cy, rad + 2, { fill: C.yellow, opacity: 0.25 * Math.sin(u * Math.PI) }));
      if (kind === 'arrowDown') fx.push(g([path('M0 0 l0 10 M-4 6 l4 4 l4 -4', { stroke: C.accent, sw: 2.6, fill: 'none', linecap: 'round' })], { x: cx, y: b.y1 - 16 + Math.sin(u * Math.PI * 2) * 2 }));
    }
  }
  const children: FrameNode[] = [];
  if (scene.kind === 'word') children.push(env.background(w, h, c.ground, time, sampleNumber(tracks, 'env.scrollX', t, 0)));
  children.push(...layers.map((l) => l.node), ...fx);
  const showLabel = scene.label.show === 'always' || (scene.label.show === 'optional' && !!opts.showLabel);
  if (showLabel) {
    const txt = scene.label.sv ?? scene.titleSv;
    const tw = txt.length * 5.6 + 12;
    children.push(g([rect(-tw / 2, -8, tw, 15, { rx: 7.5, fill: 'rgba(255,255,255,0.85)', stroke: C.ink, sw: 1 }), text(0, 3.4, txt, 9, { fill: C.ink, weight: 700, anchor: 'middle' })], { x: w / 2, y: h - 10 }));
  }
  return { w, h, bg, rx: scene.kind === 'ui' ? 0 : 18, root: g(children, undefined, { id: 'root' }) };
}

function worldPoint(aw: { pos: P; scale: number; facing: 1 | -1 }, local: P): P {
  return [aw.pos[0] + local[0] * aw.scale * aw.facing, aw.pos[1] + local[1] * aw.scale];
}
/** World position of a prop anchor, following attachment to a hand. */
function worldAnchor(c: CompiledScene, actors: Map<string, { pos: P; scale: number; facing: 1 | -1; rig: ReturnType<typeof solveRig> }>, propId: string, anchor: 'mouth' | 'grip', t: number): P | null {
  const def = c.scene.props.find((p) => p.id === propId); if (!def) return null;
  const spec = PROPS[def.asset]; const a = (anchor === 'mouth' ? spec?.mouth : undefined) ?? spec?.grip ?? [0, 0];
  const attach = sampleString<string>(c.tracks, `${propId}.attach`, t, '');
  const scale = sampleNumber(c.tracks, `${propId}.scale`, t, def.scale);
  if (attach) {
    const [actorId, hand] = attach.split(':') as [string, 'left' | 'right'];
    const aw = actors.get(actorId); if (!aw) return null;
    const handP = hand === 'left' ? aw.rig.handL : aw.rig.handR;
    const tilt = sampleNumber(c.tracks, `${propId}.s.tilt`, t, 0);
    const ang = (tilt * HELD_TILT_DEG * Math.PI) / 180;
    const grip = spec?.grip ?? [0, 0];
    const lx = (a[0] - grip[0]) * scale, ly = (a[1] - grip[1]) * scale;
    const rx = lx * Math.cos(ang) - ly * Math.sin(ang), ry = lx * Math.sin(ang) + ly * Math.cos(ang);
    // the character (and everything in its hands) is mirrored for facing left
    return [aw.pos[0] + (handP[0] + rx) * aw.scale * aw.facing, aw.pos[1] + (handP[1] + ry) * aw.scale];
  }
  const x = sampleNumber(c.tracks, `${propId}.x`, t, def.at?.x ?? 0), y = sampleNumber(c.tracks, `${propId}.y`, t, def.at?.y ?? 0);
  return [x + a[0] * scale, y + a[1] * scale];
}
import { bbox as bboxOf } from './frame';

function drawShape(c: CompiledScene, s: ShapeDef, t: number): FrameNode {
  const tr = c.tracks;
  const x = sampleNumber(tr, `${s.id}.x`, t, 0), y = sampleNumber(tr, `${s.id}.y`, t, 0);
  const opacity = sampleNumber(tr, `${s.id}.opacity`, t, 1), scale = sampleNumber(tr, `${s.id}.scale`, t, 1), rotate = sampleNumber(tr, `${s.id}.rotate`, t, 0);
  const progress = sampleNumber(tr, `${s.id}.progress`, t, 1);
  let inner: FrameNode;
  if (s.type === 'rect') { const w = sampleNumber(tr, `${s.id}.w`, t, s.w), h = sampleNumber(tr, `${s.id}.h`, t, s.h); inner = g([rect(-w / 2, -h / 2, w, h, { rx: s.rx, fill: s.fill ? color(s.fill) : 'none', stroke: s.stroke ? color(s.stroke) : undefined, sw: s.sw })], { x: w / 2, y: h / 2 }); }
  else if (s.type === 'circle') inner = circle(0, 0, sampleNumber(tr, `${s.id}.r`, t, s.r), { fill: s.fill ? color(s.fill) : 'none', stroke: s.stroke ? color(s.stroke) : undefined, sw: s.sw });
  else if (s.type === 'text') inner = text(0, 0, sampleString(tr, `${s.id}.text`, t, s.text), s.size, { fill: color(s.fill ?? C.uiText), weight: s.weight ?? 700, anchor: s.anchor ?? 'middle' });
  else inner = drawIcon(s.icon, s.size, progress, s.fill ? color(s.fill) : undefined, s.stroke ? color(s.stroke) : undefined);
  const pivot = s.type === 'rect' ? { px: sampleNumber(tr, `${s.id}.w`, t, s.w) / 2, py: sampleNumber(tr, `${s.id}.h`, t, s.h) / 2 } : {};
  return g([g([inner], { scale, rotate, ...pivot })], { x, y }, { id: `entity.${s.id}`, opacity });
}
void line;
