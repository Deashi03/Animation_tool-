/**
 * Semantic actions → tracks. This is the layer Claude writes against. Each
 * action produces motion, prop state changes and consequences together, so a
 * scene can say `pour` instead of describing rotations.
 */
import { addKey, dense, sample, sampleNumber, sampleString, tween, type Tracks } from '../engine/track';
import { reachAngles, SEG, solveRig, type Pose, REST_POSE, type P } from '../engine/rig';
import { PROPS, HELD_TILT_DEG } from '../assets/props';
import type { Action, ActionOf, Joint, Scene, ActorDef, PropDef } from '../schema/scene';
import { JOINTS } from '../schema/scene';
import * as M from '../motions';
import type { EaseName } from '../engine/easing';

export type Ctx = { scene: Scene; tracks: Tracks; actors: Map<string, ActorDef>; props: Map<string, PropDef>; ground: number; warnings: string[] };

/** Effect tracks must be "off" before they start; otherwise sampling before the first key would show them. */
function fxStart(tracks: Tracks, id: string, t: number, off: number | string): void { if (!tracks.get(id)) addKey(tracks, id, { t: Math.max(0, t - 1), v: off }); }

/** Current actor pose at t from the tracks. */
export function poseAt(ctx: Ctx, a: string, t: number): Pose {
  const p = { ...REST_POSE };
  for (const j of JOINTS) p[j] = sampleNumber(ctx.tracks, M.J(a, j), t, REST_POSE[j]);
  return p;
}
export const facingAt = (ctx: Ctx, a: string, t: number): 1 | -1 => (sampleString<string>(ctx.tracks, `${a}.facing`, t, 'right') === 'left' ? -1 : 1);
export const actorPos = (ctx: Ctx, a: string, t: number): P => [sampleNumber(ctx.tracks, `${a}.x`, t, 60), sampleNumber(ctx.tracks, `${a}.y`, t, ctx.ground)];
export const actorScale = (ctx: Ctx, a: string, t: number): number => sampleNumber(ctx.tracks, `${a}.scale`, t, 1);
/** World position of a prop's anchor (ignores attachment – used for targets). */
export function propWorld(ctx: Ctx, p: string, t: number, anchor: 'grip' | 'mouth' | 'base' = 'base'): P {
  const def = ctx.props.get(p);
  const spec = def ? PROPS[def.asset] : undefined;
  const x = sampleNumber(ctx.tracks, `${p}.x`, t, def?.at?.x ?? 60), y = sampleNumber(ctx.tracks, `${p}.y`, t, def?.at?.y ?? ctx.ground);
  const s = sampleNumber(ctx.tracks, `${p}.scale`, t, def?.scale ?? 1);
  const a = anchor === 'grip' ? spec?.grip : anchor === 'mouth' ? spec?.mouth ?? spec?.grip : [0, 0];
  return [x + (a?.[0] ?? 0) * s, y + (a?.[1] ?? 0) * s];
}
const targetPoint = (ctx: Ctx, target: string | { x: number; y: number }, t: number): P =>
  typeof target === 'string' ? (ctx.props.has(target) ? propWorld(ctx, target, t, 'grip') : ctx.actors.has(target) ? [actorPos(ctx, target, t)[0], actorPos(ctx, target, t)[1] - 60] : [60, 60]) : [target.x, target.y];

/** Make the actor face a world x. */
function faceToward(ctx: Ctx, a: string, t: number, x: number): void {
  const [ax] = actorPos(ctx, a, t);
  if (Math.abs(x - ax) > 2) addKey(ctx.tracks, `${a}.facing`, { t, v: x > ax ? 'right' : 'left' });
}
/** Joint angles that bring a hand to a world point (two-bone IK, clamped by the rig). */
function reachJoints(ctx: Ctx, a: string, hand: 'left' | 'right', target: P, t: number): Partial<Record<Joint, number>> {
  const f = facingAt(ctx, a, t), [ax, ay] = actorPos(ctx, a, t), sc = actorScale(ctx, a, t);
  const rig = solveRig(poseAt(ctx, a, t), f, sampleNumber(ctx.tracks, `${a}.lift`, t, 0));
  const sh = hand === 'left' ? rig.shL : rig.shR;
  // target in rig space (unflipped): x mirrored by facing
  const lx = ((target[0] - ax) / sc) * f, ly = (target[1] - ay) / sc;
  const { u, f: fa } = reachAngles([sh[0] * f, sh[1]], [lx, ly], SEG.uArm, SEG.fArm);
  const torso = rig.angles.torso * f;
  return hand === 'left' ? { uArmL: u - torso, fArmL: fa } : { uArmR: u - torso, fArmR: fa };
}

const H: { [K in Action['action']]: (ctx: Ctx, a: ActionOf<K>) => void } = {
  walk(ctx, a) { locomote(ctx, a.actor, a.t, a.to, a.durationMs, 'walk'); },
  run(ctx, a) { locomote(ctx, a.actor, a.t, a.to, a.durationMs, 'run'); },
  jump(ctx, a) {
    M.jump(ctx.tracks, a.actor, a.t, a.durationMs, a.height);
    if (a.to) { const [x0, y0] = actorPos(ctx, a.actor, a.t); faceToward(ctx, a.actor, a.t, a.to.x);
      tween(ctx.tracks, `${a.actor}.x`, a.t + a.durationMs * 0.3, a.t + a.durationMs * 0.86, a.to.x, 'linear', 0, x0);
      tween(ctx.tracks, `${a.actor}.y`, a.t + a.durationMs * 0.3, a.t + a.durationMs * 0.86, a.to.y, 'linear', 0, y0); }
  },
  turn(ctx, a) { addKey(ctx.tracks, `${a.actor}.facing`, { t: a.t, v: a.facing }); },
  idle(ctx, a) {
    if (a.style === 'breathe') M.idleBreathe(ctx.tracks, a.actor, a.t, a.t + a.durationMs);
    else if (a.style === 'footWiggle') { M.footWiggle(ctx.tracks, a.actor, a.t, a.t + a.durationMs); M.blinks(ctx.tracks, a.actor, a.t, a.t + a.durationMs); }
  },
  reach(ctx, a) {
    const tp = targetPoint(ctx, a.target, a.t); faceToward(ctx, a.actor, a.t, tp[0]);
    M.poseTo(ctx.tracks, a.actor, a.t, a.t + a.durationMs, reachJoints(ctx, a.actor, a.hand, tp, a.t), 'easeOut');
    addKey(ctx.tracks, `${a.actor}.gaze`, { t: a.t, v: tp[0] > actorPos(ctx, a.actor, a.t)[0] ? 1 : -1 });
  },
  grab(ctx, a) {
    const tp = propWorld(ctx, a.prop, a.t, 'grip'); faceToward(ctx, a.actor, a.t, tp[0]);
    const end = a.t + a.durationMs;
    M.poseTo(ctx.tracks, a.actor, a.t, end - 80, reachJoints(ctx, a.actor, a.hand, tp, a.t), 'easeOut');
    addKey(ctx.tracks, `${a.prop}.attach`, { t: end - 80, v: `${a.actor}:${a.hand}` });
    // carry position: elbow bent, hand in front at waist height
    M.poseTo(ctx.tracks, a.actor, end - 80, end + 300, a.hand === 'left' ? { uArmL: 30, fArmL: 70 } : { uArmR: 30, fArmR: 70 }, 'easeInOut');
  },
  release(ctx, a) {
    const owner = sampleString(ctx.tracks, `${a.prop}.attach`, a.t, '');
    const hand = owner.endsWith(':left') ? 'left' : 'right';
    const at: P = a.at ? [a.at.x, a.at.y] : propWorld(ctx, a.prop, a.t, 'base');
    if (owner) {
      M.poseTo(ctx.tracks, a.actor, a.t, a.t + a.durationMs * 0.6, reachJoints(ctx, a.actor, hand, [at[0] + (PROPS[ctx.props.get(a.prop)!.asset]?.grip[0] ?? 0), at[1] + (PROPS[ctx.props.get(a.prop)!.asset]?.grip[1] ?? 0)], a.t), 'easeInOut');
    }
    const drop = a.t + a.durationMs * 0.6;
    addKey(ctx.tracks, `${a.prop}.attach`, { t: drop, v: '' });
    addKey(ctx.tracks, `${a.prop}.x`, { t: drop, v: at[0] }); addKey(ctx.tracks, `${a.prop}.y`, { t: drop, v: at[1] });
    if (a.z !== undefined) addKey(ctx.tracks, `${a.prop}.z`, { t: drop, v: a.z });
    M.poseTo(ctx.tracks, a.actor, drop, a.t + a.durationMs + 300, { uArmL: REST_POSE.uArmL, fArmL: REST_POSE.fArmL, uArmR: REST_POSE.uArmR, fArmR: REST_POSE.fArmR }, 'easeInOut');
  },
  pour(ctx, a) {
    const end = a.t + a.durationMs, into = propWorld(ctx, a.into, a.t, 'mouth');
    const owner = sampleString(ctx.tracks, `${a.from}.attach`, a.t, '');
    if (!owner) ctx.warnings.push(`pour at ${a.t} ms: "${a.from}" is not held – add a grab first`);
    const hand = owner.endsWith(':left') ? 'left' : 'right';
    faceToward(ctx, a.actor, a.t, into[0]);
    // bring the jug above the glass: hand ~ 14 units above and slightly beside the mouth
    const f = facingAt(ctx, a.actor, a.t);
    // place the hand so that the tilted spout ends up just above the target's rim
    const fromDef = ctx.props.get(a.from)!, fromSpec = PROPS[fromDef.asset];
    const sc = sampleNumber(ctx.tracks, `${a.from}.scale`, a.t, fromDef.scale);
    const lx = ((fromSpec?.mouth?.[0] ?? 0) - (fromSpec?.grip[0] ?? 0)) * sc, ly = ((fromSpec?.mouth?.[1] ?? 0) - (fromSpec?.grip[1] ?? 0)) * sc;
    const ang = (HELD_TILT_DEG * Math.PI) / 180, rx = lx * Math.cos(ang) - ly * Math.sin(ang), ry = lx * Math.sin(ang) + ly * Math.cos(ang);
    const handTarget: P = [into[0] - f * rx, into[1] - 5 - ry];
    tween(ctx.tracks, M.J(a.actor, 'torso'), a.t, a.t + 400, 12, 'easeInOut');
    M.poseTo(ctx.tracks, a.actor, a.t, a.t + 400, reachJoints(ctx, a.actor, hand, handTarget, a.t), 'easeInOut');
    addKey(ctx.tracks, `${a.actor}.gaze`, { t: a.t, v: f }); tween(ctx.tracks, M.J(a.actor, 'head'), a.t, a.t + 400, -14, 'easeInOut');
    const t1 = a.t + 400, t2 = a.t + 700, t3 = end - 500, t4 = end - 100;
    tween(ctx.tracks, `${a.from}.s.tilt`, t1, t2, 1, 'easeInOut', 0, 0);
    addKey(ctx.tracks, `${a.from}.s.stream`, { t: t2 - 60, v: 0 }); addKey(ctx.tracks, `${a.from}.s.stream`, { t: t2, v: 1 }); addKey(ctx.tracks, `${a.from}.s.stream`, { t: t3, v: 1 }); addKey(ctx.tracks, `${a.from}.s.stream`, { t: t3 + 120, v: 0 });
    fxStart(ctx.tracks, `fx.pour.${a.from}`, t2, ''); addKey(ctx.tracks, `fx.pour.${a.from}`, { t: t2, v: a.into }); addKey(ctx.tracks, `fx.pour.${a.from}`, { t: t3 + 120, v: '' });
    const fill0 = sampleNumber(ctx.tracks, `${a.into}.s.fill`, a.t, 0), lvl0 = sampleNumber(ctx.tracks, `${a.from}.s.level`, a.t, 1);
    tween(ctx.tracks, `${a.into}.s.fill`, t2 + 150, t3, Math.min(1, fill0 + a.amount), 'linear', 0, fill0);
    tween(ctx.tracks, `${a.from}.s.level`, t2, t3, Math.max(0, lvl0 - a.amount), 'linear', 0, lvl0);
    tween(ctx.tracks, `${a.from}.s.tilt`, t3, t4, 0, 'easeInOut');
    tween(ctx.tracks, M.J(a.actor, 'head'), t3, end, -4, 'easeInOut');
    tween(ctx.tracks, M.J(a.actor, 'torso'), t4, end, 0, 'easeInOut');
    M.poseTo(ctx.tracks, a.actor, t4, end, hand === 'left' ? { uArmL: 30, fArmL: 70 } : { uArmR: 30, fArmR: 70 }, 'easeInOut');
  },
  open(ctx, a) { swing(ctx, a.actor, a.prop, a.t, a.durationMs, 1); },
  close(ctx, a) { swing(ctx, a.actor, a.prop, a.t, a.durationMs, 0); },
  sip(ctx, a) {
    const owner = sampleString(ctx.tracks, `${a.prop}.attach`, a.t, '');
    const hand = owner.endsWith(':left') ? 'left' : 'right';
    const pose = poseAt(ctx, a.actor, a.t);
    const mid = a.t + a.durationMs * 0.45;
    const up = hand === 'left' ? { uArmL: 55, fArmL: 135 } : { uArmR: 55, fArmR: 135 };
    M.poseTo(ctx.tracks, a.actor, a.t, mid, { ...up, head: 6 }, 'easeInOut');
    addKey(ctx.tracks, `${a.actor}.eyes`, { t: mid - 100, v: 'closed' }); addKey(ctx.tracks, `${a.actor}.eyes`, { t: mid + 250, v: sampleString(ctx.tracks, `${a.actor}.eyes`, a.t, 'open') });
    M.poseTo(ctx.tracks, a.actor, mid + 250, a.t + a.durationMs, hand === 'left' ? { uArmL: pose.uArmL, fArmL: pose.fArmL, head: pose.head } : { uArmR: pose.uArmR, fArmR: pose.fArmR, head: pose.head }, 'easeInOut');
  },
  lookAt(ctx, a) {
    const tp = targetPoint(ctx, a.target, a.t), [ax, ay] = actorPos(ctx, a.actor, a.t);
    const f = facingAt(ctx, a.actor, a.t);
    addKey(ctx.tracks, `${a.actor}.gaze`, { t: a.t, v: Math.sign(tp[0] - ax) * f || 0 });
    const vertical = tp[1] - (ay - 60);
    tween(ctx.tracks, M.J(a.actor, 'head'), a.t, a.t + a.durationMs, Math.max(-20, Math.min(20, vertical * -0.35)) * -1, 'easeInOut');
  },
  relax(ctx, a) {
    const sofa = ctx.props.get(a.on), spec = sofa ? PROPS[sofa.asset] : undefined;
    const seat = spec?.seat ?? { x: 0, y: -14, reclineDeg: 28 };
    const sx = sampleNumber(ctx.tracks, `${a.on}.x`, a.t, sofa?.at?.x ?? 60), sy = sampleNumber(ctx.tracks, `${a.on}.y`, a.t, sofa?.at?.y ?? ctx.ground);
    const f = facingAt(ctx, a.actor, a.t);
    // sit: hips on the seat, legs forward (up on the sofa), torso reclined
    const hipY = sy + seat.y;
    addKey(ctx.tracks, `${a.actor}.x`, { t: a.t, v: sx + seat.x - f * 16 });
    addKey(ctx.tracks, `${a.actor}.y`, { t: a.t, v: hipY + SEG.hipH });
    addKey(ctx.tracks, `${a.actor}.z`, { t: a.t, v: (sofa?.z ?? 0) + 1 });
    const legsUp: Partial<Record<Joint, number>> = a.legsUp ? { thighL: 84, thighR: 78, shinL: -10, shinR: -6, footL: 22, footR: 18 } : { thighL: 82, thighR: 78, shinL: -90, shinR: -86 };
    const seated: Partial<Record<Joint, number>> = { ...legsUp, torso: -(seat.reclineDeg ?? 18), head: 12, uArmL: 58, fArmL: 96, uArmR: -14, fArmR: 30 };
    if (a.t === 0) for (const [j, v] of Object.entries(seated) as [Joint, number][]) addKey(ctx.tracks, M.J(a.actor, j), { t: 0, v });
    else M.poseTo(ctx.tracks, a.actor, a.t, a.t + 500, seated, 'easeOut');
    for (const [k, v] of [['eyes', 'half'], ['mouth', 'calm'], ['brows', 'neutral']] as const) addKey(ctx.tracks, `${a.actor}.${k}`, { t: a.t + 300, v });
    addKey(ctx.tracks, `${a.actor}.gaze`, { t: a.t + 300, v: 1 });
    M.footWiggle(ctx.tracks, a.actor, a.t + 500, a.t + a.durationMs, 'footL');
    M.blinks(ctx.tracks, a.actor, a.t + 600, a.t + a.durationMs, 2400);
    // small "scrolling" thumb movement on the phone hand
    for (let t = a.t + 900; t + 600 < a.t + a.durationMs; t += 1400) tween(ctx.tracks, M.J(a.actor, 'fArmL'), t, t + 300, 98, 'easeInOut'), tween(ctx.tracks, M.J(a.actor, 'fArmL'), t + 300, t + 600, 92, 'easeInOut');
  },
  sleep(ctx, a) {
    const bed = ctx.props.get(a.on), spec = bed ? PROPS[bed.asset] : undefined;
    const seat = spec?.seat ?? { x: 10, y: -14, reclineDeg: 84 };
    const bx = sampleNumber(ctx.tracks, `${a.on}.x`, a.t, bed?.at?.x ?? 60), by = sampleNumber(ctx.tracks, `${a.on}.y`, a.t, bed?.at?.y ?? ctx.ground);
    addKey(ctx.tracks, `${a.actor}.facing`, { t: a.t, v: 'right' });
    addKey(ctx.tracks, `${a.actor}.x`, { t: a.t, v: bx + seat.x });
    addKey(ctx.tracks, `${a.actor}.y`, { t: a.t, v: by + seat.y + SEG.hipH - 9 });
    addKey(ctx.tracks, `${a.actor}.z`, { t: a.t, v: (bed?.z ?? 0) + 1 });
    addKey(ctx.tracks, `${a.actor}.bodyRotate`, { t: a.t, v: -90 });
    M.poseTo(ctx.tracks, a.actor, a.t, a.t + 300, { torso: 0, head: 16, uArmL: 10, fArmL: 14, uArmR: 6, fArmR: 8, thighL: 10, thighR: 6, shinL: -14, shinR: -8 }, 'easeOut');
    for (const [k, v] of [['eyes', 'closed'], ['mouth', 'calm'], ['brows', 'neutral']] as const) addKey(ctx.tracks, `${a.actor}.${k}`, { t: a.t, v });
    // slow breathing: chest/torso rise
    const end = a.t + a.durationMs;
    tween(ctx.tracks, M.J(a.actor, 'torso'), a.t + 300, a.t + 300, 0, 'linear');
    for (let t = a.t + 300; t + 2400 <= end + 1; t += 2400) { tween(ctx.tracks, M.J(a.actor, 'torso'), t, t + 1200, 3, 'easeInOut'); tween(ctx.tracks, M.J(a.actor, 'torso'), t + 1200, t + 2400, 0, 'easeInOut'); }
    if (a.zzz) { fxStart(ctx.tracks, `fx.${a.actor}.zzz`, a.t + 400, -1); for (let t = a.t + 400; t < end; t += 1800) { addKey(ctx.tracks, `fx.${a.actor}.zzz`, { t, v: 0 }); addKey(ctx.tracks, `fx.${a.actor}.zzz`, { t: Math.min(end, t + 1700), v: 1, e: 'linear' }); } }
  },
  exercise(ctx, a) {
    const end = a.t + a.durationMs;
    if (a.kind === 'jog') { M.jogInPlace(ctx.tracks, a.actor, a.t, end); addKey(ctx.tracks, `${a.actor}.mouth`, { t: a.t, v: 'open' }); }
    else if (a.kind === 'kickups') {
      if (!a.ball) ctx.warnings.push(`exercise kickups at ${a.t} ms needs "ball"`);
      else {
        const f = facingAt(ctx, a.actor, a.t), [ax, ay] = actorPos(ctx, a.actor, a.t), sc = actorScale(ctx, a.actor, a.t);
        // knee position when the thigh is raised to ~86°: hip + thigh·(sin, cos)
        const knee: P = [ax + f * (-SEG.hipW + SEG.thigh * Math.sin((86 * Math.PI) / 180) + 3) * sc, ay - (SEG.hipH - SEG.thigh * Math.cos((86 * Math.PI) / 180)) * sc];
        addKey(ctx.tracks, `${a.ball}.attach`, { t: a.t, v: '' });
        M.kickUps(ctx.tracks, a.actor, a.ball, a.t, end, knee, f);
        addKey(ctx.tracks, `${a.actor}.gaze`, { t: a.t, v: f }); tween(ctx.tracks, M.J(a.actor, 'head'), a.t, a.t + 200, 14, 'easeOut');
        addKey(ctx.tracks, `${a.actor}.mouth`, { t: a.t, v: 'smile' });
      }
    } else M.stretch(ctx.tracks, a.actor, a.t, end);
    M.blinks(ctx.tracks, a.actor, a.t, end);
  },
  express(ctx, a) {
    const tr = ctx.tracks, A = a.actor, t = a.t, d = a.durationMs;
    const face = (eyes: string, brows: string, mouth: string, blush = false) => { addKey(tr, `${A}.eyes`, { t, v: eyes }); addKey(tr, `${A}.brows`, { t, v: brows }); addKey(tr, `${A}.mouth`, { t, v: mouth }); addKey(tr, `${A}.blush`, { t, v: blush }); };
    switch (a.emotion) {
      case 'happy': face('open', 'up', 'smile', true); M.poseTo(tr, A, t, t + d, { uArmL: 40, uArmR: -40, fArmL: 60, fArmR: 60, head: 4 }, 'easeOut'); break;
      case 'surprised': face('wide', 'up', 'o'); M.poseTo(tr, A, t, t + d * 0.5, { torso: -10, head: -6, uArmL: 60, uArmR: -60, fArmL: 80, fArmR: 80 }, 'easeOut'); tween(tr, `${A}.lift`, t, t + d * 0.3, 3, 'easeOut'); tween(tr, `${A}.lift`, t + d * 0.3, t + d, 0, 'easeInOut'); break;
      case 'angry': face('open', 'down', 'frown'); M.poseTo(tr, A, t, t + d, { torso: 6, head: -4, uArmL: 36, uArmR: -36, fArmL: 120, fArmR: 120 }, 'easeOut'); break;
      case 'sad': face('half', 'worried', 'frown'); M.poseTo(tr, A, t, t + d, { torso: 10, head: 16, uArmL: 4, uArmR: -4, fArmL: 4, fArmR: 4 }, 'easeInOut'); break;
      case 'tired': face('half', 'worried', 'neutral'); M.poseTo(tr, A, t, t + d, { torso: 14, head: 18, uArmL: 2, uArmR: -2, fArmL: 2, fArmR: 2 }, 'easeInOut'); break;
      case 'content': face('half', 'neutral', 'calm'); break;
    }
  },
  face(ctx, a) { for (const k of ['eyes', 'brows', 'mouth', 'gaze'] as const) if (a[k] !== undefined) addKey(ctx.tracks, `${a.actor}.${k}`, { t: a.t, v: a[k]! }); },
  pose(ctx, a) {
    M.poseTo(ctx.tracks, a.actor, a.t, a.t + a.durationMs, a.joints, a.ease as EaseName);
    if (a.lift !== undefined) tween(ctx.tracks, `${a.actor}.lift`, a.t, a.t + a.durationMs, a.lift);
    if (a.bodyRotate !== undefined) tween(ctx.tracks, `${a.actor}.bodyRotate`, a.t, a.t + a.durationMs, a.bodyRotate);
  },
  set(ctx, a) { addKey(ctx.tracks, trackId(ctx, a.target, a.prop), { t: a.t, v: a.value, e: 'step' }); },
  tween(ctx, a) {
    const id = trackId(ctx, a.target, a.prop);
    const cur = sample(ctx.tracks, id, a.t);
    tween(ctx.tracks, id, a.t, a.t + a.durationMs, a.to, a.ease as EaseName, 0, a.from ?? (typeof cur === 'number' ? cur : undefined));
  },
  /** A ball rolls along the ground: constant deceleration (friction) and a rotation that matches the distance travelled. */
  roll(ctx, a) {
    const def = ctx.props.get(a.prop)!;
    const x0 = sampleNumber(ctx.tracks, `${a.prop}.x`, a.t, def.at?.x ?? 0), y0 = sampleNumber(ctx.tracks, `${a.prop}.y`, a.t, def.at?.y ?? ctx.ground);
    const r = (typeof def.state.r === 'number' ? def.state.r : (PROPS[def.asset]?.defaults.r as number | undefined) ?? 6) * def.scale;
    const dist = a.to.x - x0;
    const rot0 = sampleNumber(ctx.tracks, `${a.prop}.rotate`, a.t, def.rotate);
    dense(ctx.tracks, `${a.prop}.x`, a.t, a.t + a.durationMs, (_t, u) => x0 + dist * (1 - (1 - u) * (1 - u)), 0, 30); // easeOut quadratic = constant braking
    dense(ctx.tracks, `${a.prop}.rotate`, a.t, a.t + a.durationMs, (_t, u) => rot0 + ((dist * (1 - (1 - u) * (1 - u))) / r) * (180 / Math.PI), 0, 30);
    tween(ctx.tracks, `${a.prop}.y`, a.t, a.t + a.durationMs, a.to.y, 'linear', 0, y0);
    if (a.z !== undefined) addKey(ctx.tracks, `${a.prop}.z`, { t: a.t, v: a.z });
  },
  /** Climb a raised ladder: the actor moves along it with alternating arm/leg reaches and leans into it. */
  climb(ctx, a) {
    const lad = ctx.props.get(a.prop)!, L = (typeof lad.state.length === 'number' ? lad.state.length : 70) * lad.scale;
    const lean = sampleNumber(ctx.tracks, `${a.prop}.s.lean`, a.t, 1);
    const ang = ((90 - 72 * lean) * Math.PI) / 180; // 0 = up, positive leans toward +x
    const bx = sampleNumber(ctx.tracks, `${a.prop}.x`, a.t, lad.at?.x ?? 60), by = sampleNumber(ctx.tracks, `${a.prop}.y`, a.t, lad.at?.y ?? ctx.ground);
    const topX = bx + Math.sin(ang) * L, topY = by - Math.cos(ang) * L;
    const f: 1 | -1 = topX >= bx ? 1 : -1;
    addKey(ctx.tracks, `${a.actor}.facing`, { t: a.t, v: f === 1 ? 'right' : 'left' });
    const end = a.t + a.durationMs, sc = actorScale(ctx, a.actor, a.t);
    // feet follow the ladder line (slightly behind it, as the body hangs off the rungs)
    dense(ctx.tracks, `${a.actor}.x`, a.t, end, (_t, u) => bx + (topX - bx) * u - f * 6 * sc, 0, 40);
    dense(ctx.tracks, `${a.actor}.y`, a.t, end, (_t, u) => by + (topY - by) * u, 0, 40);
    tween(ctx.tracks, `${a.actor}.bodyRotate`, a.t, a.t + 200, f * (18 * lean), 'easeOut');
    const T = 640;
    dense(ctx.tracks, M.J(a.actor, 'uArmL'), a.t, end, (t) => 140 + 25 * Math.sin((2 * Math.PI * (t - a.t)) / T), 0, 40);
    dense(ctx.tracks, M.J(a.actor, 'uArmR'), a.t, end, (t) => 140 - 25 * Math.sin((2 * Math.PI * (t - a.t)) / T), 0, 40);
    dense(ctx.tracks, M.J(a.actor, 'fArmL'), a.t, end, () => 20, 0, 40); dense(ctx.tracks, M.J(a.actor, 'fArmR'), a.t, end, () => 20, 0, 40);
    dense(ctx.tracks, M.J(a.actor, 'thighL'), a.t, end, (t) => 50 + 35 * Math.sin((2 * Math.PI * (t - a.t)) / T), 0, 40);
    dense(ctx.tracks, M.J(a.actor, 'thighR'), a.t, end, (t) => 50 - 35 * Math.sin((2 * Math.PI * (t - a.t)) / T), 0, 40);
    dense(ctx.tracks, M.J(a.actor, 'shinL'), a.t, end, (t) => -60 - 30 * Math.sin((2 * Math.PI * (t - a.t)) / T), 0, 40);
    dense(ctx.tracks, M.J(a.actor, 'shinR'), a.t, end, (t) => -60 + 30 * Math.sin((2 * Math.PI * (t - a.t)) / T), 0, 40);
    dense(ctx.tracks, M.J(a.actor, 'torso'), a.t, end, () => 10, 0, 40); dense(ctx.tracks, M.J(a.actor, 'head'), a.t, end, () => -18, 0, 40);
  },
  cook(ctx, a) { cookIn(ctx, a.actor, a.pan, a.kind, a.hand, a.t, a.durationMs, a.tool); },
  flip(ctx, a) {
    const d = a.durationMs, t0 = a.t, t1 = t0 + d * 0.3, t2 = t1 + d * 0.5, end = t0 + d;
    const br = sampleNumber(ctx.tracks, `${a.pan}.s.browning`, t0, 0);
    const owner = a.tool ? sampleString<string>(ctx.tracks, `${a.tool}.attach`, t0, '') : '';
    const toolHand: 'left' | 'right' | null = owner.startsWith(`${a.actor}:`) ? (owner.endsWith(':left') ? 'left' : 'right') : null;
    const mouth = propWorld(ctx, a.pan, t0, 'mouth');
    faceToward(ctx, a.actor, t0, mouth[0]);
    const f = facingAt(ctx, a.actor, t0);
    addKey(ctx.tracks, `${a.actor}.gaze`, { t: t0, v: f }); tween(ctx.tracks, M.J(a.actor, 'head'), t0, t1, -14, 'easeInOut');
    if (toolHand) {
      // the spatula slides under the food (anticipation), lifts it quickly, comes back down
      tween(ctx.tracks, M.J(a.actor, 'torso'), t0, t1, 24, 'easeInOut');
      const under: P = [mouth[0] - f * 2, mouth[1] - 4];
      M.poseTo(ctx.tracks, a.actor, t0, t1, reachJoints(ctx, a.actor, toolHand, under, t0), 'easeInOut');
      tween(ctx.tracks, `${a.tool}.s.tilt`, t0, t1, 1, 'easeInOut');
      M.poseTo(ctx.tracks, a.actor, t1, t1 + (t2 - t1) * 0.45, reachJoints(ctx, a.actor, toolHand, [under[0] - f * 2, under[1] - 18], t0), 'easeOut');
      M.poseTo(ctx.tracks, a.actor, t1 + (t2 - t1) * 0.45, t2, reachJoints(ctx, a.actor, toolHand, under, t0), 'easeIn');
      M.poseTo(ctx.tracks, a.actor, t2, end, toolHand === 'left' ? { uArmL: 30, fArmL: 60 } : { uArmR: 30, fArmR: 60 }, 'easeInOut');
      tween(ctx.tracks, `${a.tool}.s.tilt`, t2, end, 0.4, 'easeInOut');
    } else {
      // the pan itself dips and jerks up: the food flies and turns over
      const y0 = sampleNumber(ctx.tracks, `${a.pan}.y`, t0, ctx.props.get(a.pan)?.at?.y ?? ctx.ground);
      tween(ctx.tracks, `${a.pan}.y`, t0, t1, y0 + 1.5, 'easeInOut', 0, y0);
      tween(ctx.tracks, `${a.pan}.y`, t1, t1 + 120, y0 - 4, 'easeOut'); tween(ctx.tracks, `${a.pan}.y`, t1 + 120, t2, y0, 'easeInOut');
      tween(ctx.tracks, `${a.pan}.rotate`, t0, t1, 3, 'easeInOut', 0, 0); tween(ctx.tracks, `${a.pan}.rotate`, t1, t1 + 120, -8, 'easeOut'); tween(ctx.tracks, `${a.pan}.rotate`, t1 + 120, t2, 0, 'easeInOut');
      followGrip(ctx, a.actor, a.pan, 'right', t0, t2);
    }
    addKey(ctx.tracks, `${a.pan}.s.toss`, { t: t1, v: 0 }); addKey(ctx.tracks, `${a.pan}.s.toss`, { t: t2, v: 1, e: 'linear' }); addKey(ctx.tracks, `${a.pan}.s.toss`, { t: t2 + 1, v: 0 });
    addKey(ctx.tracks, `${a.pan}.s.top`, { t: (t1 + t2) / 2, v: br, e: 'step' });
    tween(ctx.tracks, M.J(a.actor, 'head'), t2, end, -8, 'easeInOut');
  },
  splash(ctx, a) {
    const d = a.durationMs, id = `${a.pan}.s.splash`;
    addKey(ctx.tracks, id, { t: Math.max(0, a.t - 1), v: -1 });
    addKey(ctx.tracks, id, { t: a.t, v: 0 }); addKey(ctx.tracks, id, { t: a.t + d * 0.55, v: 1, e: 'linear' });
    addKey(ctx.tracks, id, { t: a.t + d * 0.55 + 1, v: 0 }); addKey(ctx.tracks, id, { t: a.t + d, v: 1, e: 'linear' }); addKey(ctx.tracks, id, { t: a.t + d + 1, v: -1 });
    if (a.actor) {
      const A = a.actor, t0 = a.t + 80;
      const held = [...ctx.props.values()].some((p) => sampleString<string>(ctx.tracks, `${p.id}.attach`, a.t, '') === `${A}:left`);
      addKey(ctx.tracks, `${A}.eyes`, { t: t0, v: 'wide' }); addKey(ctx.tracks, `${A}.brows`, { t: t0, v: 'up' }); addKey(ctx.tracks, `${A}.mouth`, { t: t0, v: 'o' });
      // flinch back, free hand up to shield the face, then relax
      M.poseTo(ctx.tracks, A, t0, t0 + 180, { torso: -14, head: -8, ...(held ? {} : { uArmL: 70, fArmL: 95 }) }, 'easeOut');
      tween(ctx.tracks, `${A}.lift`, t0, t0 + 120, 2, 'easeOut'); tween(ctx.tracks, `${A}.lift`, t0 + 120, t0 + 400, 0, 'easeInOut');
      M.poseTo(ctx.tracks, A, a.t + d, a.t + d + 500, { torso: 4, head: -10, ...(held ? {} : { uArmL: 30, fArmL: 60 }) }, 'easeInOut');
      addKey(ctx.tracks, `${A}.mouth`, { t: a.t + d + 400, v: 'neutral' }); addKey(ctx.tracks, `${A}.brows`, { t: a.t + d + 400, v: 'worried' });
    }
  },
  emphasis(ctx, a) { fxStart(ctx.tracks, `fx.${a.target}.${a.kind}`, a.t, -1); addKey(ctx.tracks, `fx.${a.target}.${a.kind}`, { t: a.t, v: 0 }); addKey(ctx.tracks, `fx.${a.target}.${a.kind}`, { t: a.t + a.durationMs, v: 1, e: 'linear' }); addKey(ctx.tracks, `fx.${a.target}.${a.kind}`, { t: a.t + a.durationMs + 1, v: -1 }); },
};

/** Map a user-facing property name to a track id: joints → `.j.`, prop state → `.s.`, else direct. */
function trackId(ctx: Ctx, target: string, prop: string): string {
  if (ctx.actors.has(target) && (JOINTS as readonly string[]).includes(prop)) return `${target}.j.${prop}`;
  if (ctx.props.has(target) && !['x', 'y', 'z', 'scale', 'rotate', 'opacity', 'attach'].includes(prop)) return `${target}.s.${prop}`;
  return `${target}.${prop}`;
}

/**
 * Locomotion with no foot sliding. The gait fixes the ground speed. If the
 * scene has room, the actor travels; otherwise the actor stays near its spot
 * and the environment scrolls at the remaining speed (treadmill). Either way
 * planted feet move at exactly the ground speed.
 */
function locomote(ctx: Ctx, a: string, t: number, to: { x: number; y: number }, durationMs: number | undefined, gaitKind: 'walk' | 'run'): void {
  const [x0, y0] = actorPos(ctx, a, t);
  const g = M.GAITS[gaitKind];
  const v = M.gaitSpeed(g); // units per second the feet demand
  const dist = Math.abs(to.x - x0);
  const dir = to.x >= x0 ? 1 : -1;
  const d = durationMs ?? Math.max(g.cycleMs, Math.round((dist / v) * 1000 / g.cycleMs) * g.cycleMs);
  faceToward(ctx, a, t, to.x);
  const travel = (v * d) / 1000; // ground the feet cover during the action
  const bodyDx = Math.min(dist, travel) * dir; // the body moves at most to `to`
  tween(ctx.tracks, `${a}.x`, t, t + d, x0 + bodyDx, 'linear', 0, x0);
  tween(ctx.tracks, `${a}.y`, t, t + d, to.y, 'linear', 0, y0);
  M.gait(ctx.tracks, a, t, t + d, g);
  M.blinks(ctx.tracks, a, t, t + d);
  const remaining = travel - Math.abs(bodyDx); // ground that must scroll past instead
  if (remaining > 0.5) {
    const s0 = sampleNumber(ctx.tracks, 'env.scrollX', t, 0);
    tween(ctx.tracks, 'env.scrollX', t, t + d, s0 + remaining * dir, 'linear', 0, s0);
    fxStart(ctx.tracks, `fx.${a}.speed`, t, 0);
    addKey(ctx.tracks, `fx.${a}.speed`, { t, v: (remaining / d) * 1000 * dir }); addKey(ctx.tracks, `fx.${a}.speed`, { t: t + d, v: 0, e: 'step' }); // constant while running, off afterwards
  }
  // settle into rest at the end
  M.restPose(ctx.tracks, a, t + d, t + d + 260);
  tween(ctx.tracks, `${a}.lift`, t + d, t + d + 260, 0, 'easeOut');
}

/** Keep a hand on a prop's grip while the prop moves (dense IK follow). */
function followGrip(ctx: Ctx, actor: string, prop: string, hand: 'left' | 'right', from: number, to: number, dx: (t: number) => number = () => 0): void {
  const joints = hand === 'left' ? (['uArmL', 'fArmL'] as const) : (['uArmR', 'fArmR'] as const);
  const vals = new Map<string, (t: number) => number>();
  for (const j of joints) vals.set(j, (t) => { const gp = propWorld(ctx, prop, t, 'grip'); const r = reachJoints(ctx, actor, hand, [gp[0] + dx(t), gp[1]], from); return r[j] ?? 0; });
  for (const j of joints) dense(ctx.tracks, M.J(actor, j), from, to, (t) => vals.get(j)!(t), 0, 40);
}

/**
 * Cooking in a pan: the actor stands at the stove with a hand on the handle,
 * the plate glows, the food sizzles and changes colour. The colour change is
 * the pedagogical core – the kind decides how far it goes.
 */
function cookIn(ctx: Ctx, actor: string, pan: string, kind: 'fry' | 'brown' | 'sear' | 'burn' | 'melt', hand: 'left' | 'right', t: number, d: number, tool?: string): void {
  const end = t + d, tr = ctx.tracks;
  const grip = propWorld(ctx, pan, t, 'grip');
  faceToward(ctx, actor, t, grip[0]);
  const f = facingAt(ctx, actor, t);
  // the stove under the pan heats up
  const [px, py] = propWorld(ctx, pan, t, 'base');
  for (const p of ctx.props.values()) {
    if (p.asset !== 'stove') continue;
    const top = propWorld(ctx, p.id, t, 'mouth');
    if (Math.abs(top[0] - px) < 10 && Math.abs(top[1] - py) < 6) tween(tr, `${p.id}.s.heat`, t, t + 500, 1, 'easeOut', 0, sampleNumber(tr, `${p.id}.s.heat`, t, 0));
  }
  // posture: lean in a little, look down at the pan
  const other = hand === 'left' ? 'right' : 'left';
  const toolHeld = tool && sampleString<string>(tr, `${tool}.attach`, t, '') === `${actor}:${other}`;
  tween(tr, M.J(actor, 'torso'), t, t + 400, toolHeld ? 22 : 10, 'easeInOut'); tween(tr, M.J(actor, 'head'), t, t + 400, -14, 'easeInOut');
  addKey(tr, `${actor}.gaze`, { t, v: f }); addKey(tr, `${actor}.eyes`, { t, v: 'open' }); addKey(tr, `${actor}.mouth`, { t, v: 'smile' });
  // hand on the handle; the pan is shaken in short bursts (sear: tossed continuously)
  const amp = kind === 'sear' ? 2.6 : kind === 'melt' ? 0 : 1.4, T = kind === 'sear' ? 380 : 1000, burstEvery = 2400, burstLen = 760;
  const shake = (tt: number): number => { if (amp === 0 || tt < t + 400) return 0; const u = tt - t - 400; const env = kind === 'sear' ? 1 : Math.max(0, Math.sin((Math.PI * (u % burstEvery)) / burstLen)) * ((u % burstEvery) < burstLen ? 1 : 0); return amp * env * Math.sin((2 * Math.PI * u) / T); };
  const x0 = sampleNumber(tr, `${pan}.x`, t, ctx.props.get(pan)?.at?.x ?? 60);
  dense(tr, `${pan}.x`, t, end, (tt) => x0 + shake(tt), 0, 40);
  M.poseTo(tr, actor, t, t + 400, reachJoints(ctx, actor, hand, grip, t + 400), 'easeInOut');
  followGrip(ctx, actor, pan, hand, t + 400, end);
  if (kind === 'sear') { addKey(tr, `${pan}.s.toss`, { t: t + 400, v: 0 }); dense(tr, `${pan}.s.toss`, t + 400, end, (tt) => { const u = ((tt - t - 400) % 1500) / 1500; return u < 0.5 ? u * 2 * 0.35 : 0; }, 0, 40); addKey(tr, `${pan}.s.toss`, { t: end + 1, v: 0 }); }
  // the other hand: a held tool presses/pokes now and then, otherwise it rests at the hip
  if (toolHeld) {
    const mouth = propWorld(ctx, pan, t, 'mouth');
    tween(tr, `${tool}.s.tilt`, t, t + 400, 1, 'easeInOut');
    M.poseTo(tr, actor, t, t + 400, reachJoints(ctx, actor, other, [mouth[0] - f * 11, mouth[1] - 3], t + 400), 'easeInOut'); // ready at the near rim
    for (let k = t + 400; k + 1200 <= end; k += 1800) {
      M.poseTo(tr, actor, k, k + 350, reachJoints(ctx, actor, other, [mouth[0] - f * 3, mouth[1] - 6], t + 400), 'easeInOut');
      M.poseTo(tr, actor, k + 350, k + 700, reachJoints(ctx, actor, other, [mouth[0] + f * 3, mouth[1] - 5], t + 400), 'easeInOut');
      M.poseTo(tr, actor, k + 700, k + 1200, reachJoints(ctx, actor, other, [mouth[0] - f * 2, mouth[1] - 12], t + 400), 'easeInOut');
    }
  }
  // food: sizzle marks + colour change
  const level = { fry: 0.6, brown: 0.85, sear: 1, burn: 0.9, melt: 0.3 }[kind];
  tween(tr, `${pan}.s.sizzle`, t + 200, t + 800, level, 'easeOut', 0, sampleNumber(tr, `${pan}.s.sizzle`, t, 0));
  const ph0 = sampleNumber(tr, `${pan}.s.phase`, t, 0);
  dense(tr, `${pan}.s.phase`, t, end, (tt) => ph0 + (tt - t) / 1000, 0, 60);
  const br0 = sampleNumber(tr, `${pan}.s.browning`, t, 0);
  if (kind === 'melt') { tween(tr, `${pan}.s.melt`, t + 300, t + d * 0.8, 1, 'easeInOut', 0, sampleNumber(tr, `${pan}.s.melt`, t, 0)); }
  else if (kind === 'burn') {
    tween(tr, `${pan}.s.browning`, t + 300, t + d * 0.5, 1, 'linear', 0, br0);
    tween(tr, `${pan}.s.top`, t + 300, t + d * 0.5, 1, 'linear', 0, sampleNumber(tr, `${pan}.s.top`, t, 0));
    tween(tr, `${pan}.s.burnt`, t + d * 0.45, t + d * 0.85, 1, 'linear', 0, sampleNumber(tr, `${pan}.s.burnt`, t, 0));
  } else {
    const target = { fry: 0.55, brown: 1, sear: 0.6 }[kind];
    tween(tr, `${pan}.s.browning`, t + 300, end - 200, Math.max(br0, target), 'linear', 0, br0);
    if (kind !== 'fry') tween(tr, `${pan}.s.top`, t + 300, end - 200, Math.max(sampleNumber(tr, `${pan}.s.top`, t, 0), target * 0.9), 'linear', 0, sampleNumber(tr, `${pan}.s.top`, t, 0)); // tossed/thin food colours on the visible side too
  }
  M.blinks(tr, actor, t, end);
}

function swing(ctx: Ctx, actor: string, prop: string, t: number, d: number, target: 0 | 1): void {
  const grip = propWorld(ctx, prop, t, 'grip');
  faceToward(ctx, actor, t, grip[0]);
  const f = facingAt(ctx, actor, t);
  const reach = reachJoints(ctx, actor, 'right', grip, t);
  M.poseTo(ctx.tracks, actor, t, t + d * 0.35, reach, 'easeOut');
  addKey(ctx.tracks, `${actor}.gaze`, { t, v: 1 });
  const key = ctx.props.get(prop)?.asset === 'box' ? 'lidOpen' : 'angle';
  const cur = sampleNumber(ctx.tracks, `${prop}.s.${key}`, t, 1 - target);
  tween(ctx.tracks, `${prop}.s.${key}`, t + d * 0.35, t + d, target, target ? 'easeOut' : 'easeInOut', 0, cur);
  // the arm follows the handle a little (pull back when opening toward the viewer / push when closing)
  const u = (reach.uArmR ?? 40), fa = (reach.fArmR ?? 20);
  M.poseTo(ctx.tracks, actor, t + d * 0.35, t + d, { uArmR: u - (target ? 18 : -10), fArmR: fa + (target ? 28 : -6), torso: target ? -4 : 6 }, 'easeInOut');
  M.poseTo(ctx.tracks, actor, t + d, t + d + 350, { uArmR: REST_POSE.uArmR, fArmR: REST_POSE.fArmR, torso: 0 }, 'easeInOut');
  void f;
}

export function compileAction(ctx: Ctx, a: Action): void {
  (H[a.action] as (ctx: Ctx, a: Action) => void)(ctx, a);
}
