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
import { drawIcon, type IconName } from '../assets/icons';

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
    const keys = new Set(Object.keys({ ...(PROPS[p.asset]?.defaults ?? {}), ...p.state })); const pre = `${p.id}.s.`; for (const id of tracks.keys()) if (id.startsWith(pre)) keys.add(id.slice(pre.length));
    for (const key of keys) {
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
      // a held prop can still be hidden (opacity track): the other half of a split thing waits unseen in the hand
      const held = g([g([node], { x: -(spec?.grip[0] ?? 0), y: -(spec?.grip[1] ?? 0) })], { rotate: tilt * HELD_TILT_DEG, scale }, { id: `entity.${p.id}`, opacity: sampleNumber(tracks, `${p.id}.opacity`, t, 1) });
      const hset = holding.get(actorId); if (hset) hset[hand] = held;
      void facing;
      continue;
    }
    const x = sampleNumber(tracks, `${p.id}.x`, t, p.at?.x ?? 0), y = sampleNumber(tracks, `${p.id}.y`, t, p.at?.y ?? c.ground);
    const rot = sampleNumber(tracks, `${p.id}.rotate`, t, p.rotate);
    const pv = PROPS[p.asset]?.pivot?.(state);
    layers.push({ z: sampleNumber(tracks, `${p.id}.z`, t, p.z), order: order++, node: g([node], { x, y, scale, rotate: rot, ...(pv && rot ? { px: pv[0] * scale, py: pv[1] * scale } : {}) }, { id: `entity.${p.id}`, opacity: sampleNumber(tracks, `${p.id}.opacity`, t, 1) }) });
  }
  for (const a of scene.actors) {
    const pose = {} as Pose;
    for (const j of JOINTS) pose[j] = sampleNumber(tracks, `${a.id}.j.${j}`, t, 0);
    const facing: 1 | -1 = sampleString<string>(tracks, `${a.id}.facing`, t, a.facing) === 'left' ? -1 : 1;
    const lift = sampleNumber(tracks, `${a.id}.lift`, t, 0), rot = sampleNumber(tracks, `${a.id}.bodyRotate`, t, 0);
    const pos: P = [sampleNumber(tracks, `${a.id}.x`, t, a.at.x), sampleNumber(tracks, `${a.id}.y`, t, a.at.y)];
    const scale = sampleNumber(tracks, `${a.id}.scale`, t, a.scale);
    const base = VARIANTS[a.variant];
    const wardrobe = { ...base, ...(a.wardrobe ? Object.fromEntries(Object.entries(a.wardrobe).filter(([, v]) => v !== undefined).map(([k, v]) => [k, typeof v === 'string' && k !== 'hairStyle' && k !== 'sleeves' ? color(v) : v])) : {}) } as CharacterState['wardrobe'];
    // animated wardrobe: `<actor>.w.<key>` tracks override the static values (dress/fasten actions)
    const wpre = `${a.id}.w.`;
    for (const id of tracks.keys()) {
      if (!id.startsWith(wpre)) continue;
      const key = id.slice(wpre.length) as keyof CharacterState['wardrobe']; const first = tracks.get(id)!.keys[0]?.v;
      const w0 = wardrobe as unknown as Record<string, unknown>;
      if (typeof first === 'number') w0[key] = sampleNumber(tracks, id, t, 0);
      else if (typeof first === 'boolean') w0[key] = sampleBool(tracks, id, t, false);
      else { const v = sampleString<string>(tracks, id, t, ''); w0[key] = key === 'sleeves' || key === 'hairStyle' ? v : v === 'none' ? (key === 'hat' ? 'none' : undefined) : color(v); }
    }
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
    if (Math.abs(sp) > 40 && aw0) {
      // speed lines: trail behind the body, longer and more of them the faster the world rushes past; they stream with the ground
      const back = -Math.sign(sp), hipY = aw0.pos[1] - 34 * aw0.scale, strength = Math.min(1, Math.abs(sp) / 120);
      const n = 3 + Math.round(strength * 2), period = 260;
      for (let i = 0; i < n; i++) {
        const ph = ((t + i * 97) % period) / period;
        const y = hipY - 24 + i * (36 / n) * aw0.scale, len = (8 + strength * 10) * (0.6 + 0.4 * ((i * 7) % 3) / 2);
        const x0 = aw0.pos[0] + back * (14 + ph * 26 + (i % 2) * 5) * aw0.scale;
        fx.push(line([[x0, y], [x0 + back * len, y]], { stroke: C.ink, sw: 1.8, opacity: 0.45 * (1 - ph) }));
      }
    }
    const dust = sampleNumber(tracks, `fx.${a.id}.dust`, t, -1);
    if (dust >= 0 && dust <= 1 && aw0) {
      const gy = aw0.pos[1] - 1;
      for (let i = 0; i < 4; i++) { const dir = i < 2 ? -1 : 1, k = i % 2; fx.push(circle(aw0.pos[0] + dir * (6 + k * 6 + dust * 12), gy - 2 - dust * (4 + k * 3), 2.2 + dust * 2.5 - k * 0.6, { fill: C.beige, stroke: C.ink, sw: 1, opacity: 0.7 * (1 - dust) })); }
    }
    const sw = sampleNumber(tracks, `fx.${a.id}.sweat`, t, -1);
    if (sw >= 0 && sw <= 1 && aw0) { const head = worldPoint(aw0, aw0.rig.head); for (let i = 0; i < 2; i++) { const u = ((t / 700) + i * 0.5) % 1; fx.push(path(`M${r1(head[0] + aw0.facing * (10 + i * 3) * aw0.scale)} ${r1(head[1] - 6 + u * 10)} q2 3 0 4 q-2 -1 0 -4 Z`, { fill: C.water2, stroke: C.ink, sw: 0.8, opacity: 1 - u })); } }
    const z = sampleNumber(tracks, `fx.${a.id}.zzz`, t, -1);
    const aw = actorWorld.get(a.id);
    if (z >= 0 && aw) {
      // three z's drift up from just beside the mouth, growing and fading, and stay close to the head
      const head: P = worldPoint(aw, aw.rig.head);
      const side = aw.rot ? -1 : aw.facing; // a lying figure's face points up – let the z's rise above the pillow side
      for (let i = 0; i < 3; i++) {
        const u = (z + i * 0.33) % 1;
        const x = head[0] + side * (9 + i * 2 + u * 7) * aw.scale, y = head[1] - (6 + u * 16) * aw.scale;
        fx.push(text(Math.max(8, Math.min(w - 8, x)), Math.max(10, y), 'z', (6 + u * 5) * aw.scale, { fill: C.navy, weight: 800, opacity: Math.max(0, 0.9 - u * 0.9) }));
      }
    }
  }
  // speech bubbles: icon or short text on white, with a tail to the mouth; drawn last so they stay on top
  for (const a of scene.actors) {
    const say = sampleString<string>(tracks, `fx.${a.id}.say`, t, '');
    const aw = actorWorld.get(a.id);
    if (!say || !aw) continue;
    const [content, mood] = say.split('|') as [string, string];
    const head = worldPoint(aw, aw.rig.head);
    const mouth: P = [head[0] + aw.facing * 5 * aw.scale, head[1] + 4 * aw.scale];
    const isIcon = content.startsWith('icon:');
    const body = isIcon ? content.slice(5) : content.slice(5);
    const bw = isIcon ? 28 : Math.min(60, textWidth(body, 8) + 10), bh = isIcon ? 26 : 15; // icon bubbles are large enough for the icon to read at 140 px
    // the bubble sits above and in front of the head, clamped inside the canvas
    let bx = head[0] + aw.facing * (9 + bw / 2) * Math.min(1, aw.scale), by = head[1] - 20 * aw.scale - bh / 2;
    bx = Math.max(bw / 2 + 2, Math.min(w - bw / 2 - 2, bx)); by = Math.max(bh / 2 + 2, by);
    const pop = Math.min(1, (t - (tracks.get(`fx.${a.id}.say`)?.keys.filter((k) => k.t <= t && k.v === say).pop()?.t ?? t)) / 180);
    const tailBase = 5, dx = mouth[0] - bx, dy = mouth[1] - by, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    const ex = bx + (dx / len) * Math.min(bw / 2, bh / 2) * 0.9, ey = by + (dy / len) * Math.min(bw / 2, bh / 2) * 0.9;
    const bubble = g([
      path(`M${r1(ex + nx * tailBase)} ${r1(ey + ny * tailBase)} L${r1(mouth[0])} ${r1(mouth[1])} L${r1(ex - nx * tailBase)} ${r1(ey - ny * tailBase)} Z`, { fill: C.white, stroke: C.ink, sw: 1.4 }),
      rect(bx - bw / 2, by - bh / 2, bw, bh, { rx: mood === 'angry' ? 2 : bh / 2, fill: C.white, stroke: C.ink, sw: mood === 'angry' ? 2 : 1.4 }),
      path(`M${r1(ex + nx * tailBase * 0.8)} ${r1(ey + ny * tailBase * 0.8)} L${r1(mouth[0])} ${r1(mouth[1])} L${r1(ex - nx * tailBase * 0.8)} ${r1(ey - ny * tailBase * 0.8)}`, { fill: C.white, stroke: 'none' }),
      isIcon ? g([drawIcon(body as IconName, 19, pop, undefined, C.ink)], { x: bx, y: by }) : text(bx, by + 3, body, 8, { fill: C.ink, weight: 800, anchor: 'middle' }),
    ], { scale: 0.6 + 0.4 * pop, px: mouth[0], py: mouth[1] });
    fx.push(bubble);
  }
  // sound marks beside a source: arcs for continuous sounds, spikes for impacts
  for (const id of [...scene.actors.map((a) => a.id), ...scene.props.map((p) => p.id)]) {
    const kind = sampleString<string>(tracks, `fx.${id}.sound`, t, '');
    if (!kind) continue;
    // the source may be a held prop drawn inside an actor's layer: search every layer for the entity
    let b: { x1: number; y1: number; x2: number; y2: number } | null = null; for (const l of layers) { b = bboxOfId(l.node, `entity.${id}`); if (b) break; } if (!b) continue;
    const owner = sampleString<string>(tracks, `${id}.attach`, t, '').split(':')[0]; const f = (actorWorld.get(owner || id)?.facing ?? 1) as 1 | -1; // held things and people: the mark sits in front of the face, not behind
    const cx = f === 1 ? b.x2 + 3 : b.x1 - 3, cy = (b.y1 + b.y2) / 2, u = (t % 600) / 600;
    if (kind === 'thump' || kind === 'crunch') { for (let i = 0; i < 5; i++) { const ang = -1.1 + i * 0.55 + (kind === 'crunch' ? Math.sin(t) * 0.1 : 0); const r0 = 4 + ((u + i * 0.2) % 1) * 6; fx.push(line([[cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0], [cx + Math.cos(ang) * (r0 + 4), cy + Math.sin(ang) * (r0 + 4)]], { stroke: C.ink, sw: kind === 'crunch' ? 1.4 : 2.2, opacity: 0.8 })); } }
    else for (let i = 0; i < 3; i++) { const ph = (u + i * 0.33) % 1; const rr = 5 + ph * 10; fx.push(path(`M${r1(cx + rr * 0.5)} ${r1(cy - rr * 0.85)} q${r1(rr * 0.9)} ${r1(rr * 0.85)} 0 ${r1(rr * 1.7)}`, { fill: 'none', stroke: kind === 'bark' ? C.red : C.ink, sw: 1.8, linecap: 'round', opacity: 0.85 * (1 - ph) })); }
  }
  // sprinkle: small grains falling from a held tool's mouth onto the target
  for (const key of [...scene.props.map((p) => p.id), ...scene.actors.map((a) => a.id)]) {
    const target = sampleString<string>(tracks, `fx.sprinkle.${key}`, t, '');
    if (!target) continue;
    const from = worldAnchor(c, actorWorld, key, 'mouth', t) ?? (actorWorld.get(key) ? worldPoint(actorWorld.get(key)!, actorWorld.get(key)!.rig.handR) : null);
    const to = worldAnchor(c, actorWorld, target, 'mouth', t);
    if (!from || !to) continue;
    for (let i = 0; i < 5; i++) { const u = ((t / 420) + i * 0.2) % 1; const x = from[0] + (to[0] - from[0]) * u + Math.sin(i * 2.1) * 2.5, y = from[1] + (to[1] - from[1]) * u * u; fx.push(circle(x, y, 0.95, { fill: C.white, stroke: C.ink, sw: 0.6, opacity: 0.9 * (1 - u * 0.5) })); }
  }
  // shake: a struck prop jitters for a moment (chop/tap)
  for (const p of scene.props) {
    const sh = sampleNumber(tracks, `fx.${p.id}.shake`, t, 0);
    if (sh > 0.5) { const l = layers.find((l) => (l.node as { id?: string }).id === `entity.${p.id}`); if (l) l.node = g([l.node], { x: Math.sin(t * 0.9) * 0.8, y: -0.6 }); }
  }
  for (const p of scene.props) {
    for (const kind of ['wobble', 'stretch', 'bounce'] as const) {
      const u = sampleNumber(tracks, `fx.${p.id}.${kind}`, t, -1); if (u < 0 || u > 1) continue;
      const l = layers.find((l) => (l.node as { id?: string }).id === `entity.${p.id}`); if (!l) continue;
      const bb = bboxOf(l.node); if (!bb) continue; const cx = (bb.x1 + bb.x2) / 2, by = bb.y2;
      if (kind === 'wobble') l.node = g([l.node], { rotate: Math.sin(u * Math.PI * 6) * 9 * (1 - u * 0.3), px: cx, py: by });
      if (kind === 'stretch') { const k = Math.sin(u * Math.PI); l.node = g([l.node], { scaleX: 1 + 0.5 * k, scaleY: 1 - 0.18 * k, px: cx, py: by }); }
      if (kind === 'bounce') { const k = Math.abs(Math.sin(u * Math.PI * 3)); l.node = g([l.node], { y: -6 * k, scaleY: 1 - 0.1 * (1 - k), px: cx, py: by }); }
    }
  }
  for (const id of [...scene.actors.map((a) => a.id), ...scene.props.map((p) => p.id), ...scene.shapes.map((s) => s.id)]) {
    for (const kind of ['ring', 'glow', 'arrowDown', 'glint', 'crumbs'] as const) {
      const u = sampleNumber(tracks, `fx.${id}.${kind}`, t, -1);
      if (u < 0 || u > 1) continue;
      // the entity may be a held prop drawn inside an actor's layer
      let b: { x1: number; y1: number; x2: number; y2: number } | null = null; for (const l of layers) { b = bboxOfId(l.node, `entity.${id}`); if (b) break; }
      if (!b) continue;
      const cx = (b.x1 + b.x2) / 2, cy = (b.y1 + b.y2) / 2, rad = Math.max(b.x2 - b.x1, b.y2 - b.y1) / 2 + 4;
      if (kind === 'ring') fx.push(circle(cx, cy, rad + u * 10, { stroke: C.accent, sw: 2.5 - u * 2, fill: 'none', opacity: 1 - u }));
      if (kind === 'glow') fx.push(circle(cx, cy, rad + 2, { fill: C.yellow, opacity: 0.25 * Math.sin(u * Math.PI) }));
      if (kind === 'arrowDown') fx.push(g([path('M0 0 l0 10 M-4 6 l4 4 l4 -4', { stroke: C.accent, sw: 2.6, fill: 'none', linecap: 'round' })], { x: cx, y: b.y1 - 16 + Math.sin(u * Math.PI * 2) * 2 }));
      if (kind === 'crumbs') { // small pieces fly out of the thing and fall: a break (split), a crack, a bite
        for (let i = 0; i < 6; i++) { const ang = -2.6 + i * 0.44, sp = 14 + (i % 3) * 5; const x = cx + Math.cos(ang) * sp * u, y = cy + Math.sin(ang) * sp * u + 26 * u * u; fx.push(circle(x, y, 1.1 + (i % 2) * 0.5, { fill: C.beige, stroke: C.ink, sw: 0.7, opacity: 0.95 * (1 - u * u) })); } }
      if (kind === 'glint') { // a four-point sparkle travelling along the top edge, plus a small second one: "blank, ny, vass"
        const star = (x: number, y: number, r: number, o: number) => path(`M${r1(x)} ${r1(y - r)} q${r1(r * 0.2)} ${r1(r * 0.8)} ${r1(r)} ${r1(r)} q${r1(-r * 0.8)} ${r1(r * 0.2)} ${r1(-r)} ${r1(r)} q${r1(-r * 0.2)} ${r1(-r * 0.8)} ${r1(-r)} ${r1(-r)} q${r1(r * 0.8)} ${r1(-r * 0.2)} ${r1(r)} ${r1(-r)} Z`, { fill: C.white, stroke: C.ink, sw: 1, opacity: o });
        const k = Math.sin(u * Math.PI); fx.push(star(b.x1 + (b.x2 - b.x1) * (0.2 + 0.6 * u), b.y1 + 1, 2 + 3.5 * k, 0.95), star(b.x2 - 3, b.y1 + (b.y2 - b.y1) * 0.4, 1.2 + 1.8 * Math.sin(u * Math.PI * 2 + 1), 0.8)); }
    }
  }
  const children: FrameNode[] = [];
  if (scene.kind === 'word') children.push(env.background(w, h, c.ground, time, sampleNumber(tracks, 'env.scrollX', t, 0)));
  children.push(...layers.map((l) => l.node), ...fx);
  const showLabel = scene.label.show === 'always' || (scene.label.show === 'optional' && !!opts.showLabel);
  if (showLabel) {
    const txt = scene.label.sv ?? scene.titleSv;
    const tw = txt.length * 5.6 + 12;
    children.push(g([rect(-tw / 2, -8, tw, 15, { rx: 7.5, fill: C.white, stroke: C.ink, sw: 1 }), text(0, 3.4, txt, 9, { fill: C.ink, weight: 700, anchor: 'middle' })], { x: w / 2, y: h - 10 }));
  }
  return { w, h, bg, rx: scene.kind === 'ui' ? 0 : 18, root: g(children, undefined, { id: 'root' }) };
}

/** Local rig point → world, including the whole-body rotation about the hips (lying down). */
function worldPoint(aw: { pos: P; scale: number; facing: 1 | -1; rot?: number }, local: P): P {
  let [x, y] = local;
  if (aw.rot) { const a = (aw.rot * Math.PI) / 180, px = 0, py = -34; const dx = x - px, dy = y - py; x = px + dx * Math.cos(a) - dy * Math.sin(a); y = py + dx * Math.sin(a) + dy * Math.cos(a); }
  return [aw.pos[0] + x * aw.scale * aw.facing, aw.pos[1] + y * aw.scale];
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
    // the rig is already solved in screen orientation; only the held prop's local offset is mirrored for facing left
    return [aw.pos[0] + (handP[0] + rx * aw.facing) * aw.scale, aw.pos[1] + (handP[1] + ry) * aw.scale];
  }
  const x = sampleNumber(c.tracks, `${propId}.x`, t, def.at?.x ?? 0), y = sampleNumber(c.tracks, `${propId}.y`, t, def.at?.y ?? 0);
  return [x + a[0] * scale, y + a[1] * scale];
}
import { bbox as bboxOf, bboxOfId } from './frame';

/** Approximate rendered text width: CJK glyphs are square, Latin ≈ 0.58 em. */
export function textWidth(txt: string, size: number): number {
  let w = 0; for (const ch of txt) w += /[\u3000-\u9fff\uf900-\ufaff\uff00-\uffef]/.test(ch) ? size * 1.0 : size * 0.58; return w;
}
/**
 * White backing for text (product-owner rule: text never sits directly on the scene).
 * pill = rounded capsule; bubble = pill with a tail toward `tail` (relative to the text origin);
 * panel = flat card with square-ish corners – slide it in from an edge by tweening the shape's x/y.
 */
function textBacking(txt: string, size: number, anchor: 'start' | 'middle' | 'end', bg: 'pill' | 'bubble' | 'panel', pad: number, tail?: { x: number; y: number }): FrameNode[] {
  const w = textWidth(txt, size) + pad * 2, h = size * 1.3 + pad * 1.2;
  const x0 = anchor === 'start' ? -pad : anchor === 'end' ? -w + pad : -w / 2, y0 = -size * 0.95 - pad * 0.6;
  const rx = bg === 'panel' ? Math.min(6, h / 4) : h / 2;
  const out: FrameNode[] = [];
  if (bg === 'bubble' && tail) {
    const cx = x0 + w / 2, cy = y0 + h / 2;
    const dx = tail.x - cx, dy = tail.y - cy, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, base = Math.min(8, w / 4);
    // tail base sits on the bubble edge toward the target
    const ex = cx + (dx / len) * Math.min(w / 2, h / 2) * 0.9, ey = cy + (dy / len) * Math.min(w / 2, h / 2) * 0.9;
    out.push(path(`M${r1(ex + nx * base)} ${r1(ey + ny * base)} L${r1(tail.x)} ${r1(tail.y)} L${r1(ex - nx * base)} ${r1(ey - ny * base)} Z`, { fill: C.white, stroke: C.ink, sw: 1.4 }));
  }
  out.push(rect(x0, y0, w, h, { rx, fill: C.white, stroke: C.ink, sw: bg === 'panel' ? 1.6 : 1.2 }));
  if (bg === 'bubble' && tail) { const cx = x0 + w / 2, cy = y0 + h / 2; const dx = tail.x - cx, dy = tail.y - cy, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, base = Math.min(8, w / 4); const ex = cx + (dx / len) * Math.min(w / 2, h / 2) * 0.9, ey = cy + (dy / len) * Math.min(w / 2, h / 2) * 0.9; out.push(path(`M${r1(ex + nx * base * 0.8)} ${r1(ey + ny * base * 0.8)} L${r1(tail.x)} ${r1(tail.y)} L${r1(ex - nx * base * 0.8)} ${r1(ey - ny * base * 0.8)}`, { fill: C.white, stroke: 'none' })); }
  return out;
}

function drawShape(c: CompiledScene, s: ShapeDef, t: number): FrameNode {
  const tr = c.tracks;
  const x = sampleNumber(tr, `${s.id}.x`, t, 0), y = sampleNumber(tr, `${s.id}.y`, t, 0);
  const opacity = sampleNumber(tr, `${s.id}.opacity`, t, 1), scale = sampleNumber(tr, `${s.id}.scale`, t, 1), rotate = sampleNumber(tr, `${s.id}.rotate`, t, 0);
  const progress = sampleNumber(tr, `${s.id}.progress`, t, 1);
  let inner: FrameNode;
  if (s.type === 'rect') { const w = sampleNumber(tr, `${s.id}.w`, t, s.w), h = sampleNumber(tr, `${s.id}.h`, t, s.h); inner = g([rect(-w / 2, -h / 2, w, h, { rx: s.rx, fill: s.fill ? color(s.fill) : 'none', stroke: s.stroke ? color(s.stroke) : undefined, sw: s.sw })], { x: w / 2, y: h / 2 }); }
  else if (s.type === 'circle') inner = circle(0, 0, sampleNumber(tr, `${s.id}.r`, t, s.r), { fill: s.fill ? color(s.fill) : 'none', stroke: s.stroke ? color(s.stroke) : undefined, sw: s.sw });
  else if (s.type === 'text') {
    const txt = sampleString(tr, `${s.id}.text`, t, s.text);
    const label = text(0, 0, txt, s.size, { fill: color(s.fill ?? C.uiText), weight: s.weight ?? 700, anchor: s.anchor ?? 'middle' });
    inner = s.bg === 'none' ? label : g([...textBacking(txt, s.size, s.anchor ?? 'middle', s.bg, s.pad ?? Math.round(s.size * 0.45), s.tail), label]);
  }
  else inner = drawIcon(s.icon, s.size, progress, s.fill ? color(s.fill) : undefined, s.stroke ? color(s.stroke) : undefined);
  const pivot = s.type === 'rect' ? { px: sampleNumber(tr, `${s.id}.w`, t, s.w) / 2, py: sampleNumber(tr, `${s.id}.h`, t, s.h) / 2 } : {};
  return g([g([inner], { scale, rotate, ...pivot })], { x, y }, { id: `entity.${s.id}`, opacity });
}
void line;
