/**
 * Motion library: parametric generators that write joint tracks for one actor
 * over [from, to]. All cycles are written as dense keyframes so the result is
 * plain data. Angles: 0 = down, + = forward.
 */
import { addKey, dense, tween, type Tracks } from '../engine/track';
import { REST_POSE } from '../engine/rig';
import type { Joint } from '../schema/scene';
import type { EaseName } from '../engine/easing';

export const J = (actor: string, j: Joint) => `${actor}.j.${j}`;
const TAU = Math.PI * 2;

/** Set every joint to a pose at time t with an eased transition from the current value. */
export function poseTo(tr: Tracks, a: string, from: number, to: number, pose: Partial<Record<Joint, number>>, e: EaseName = 'easeInOut'): void {
  for (const [j, v] of Object.entries(pose) as [Joint, number][]) tween(tr, J(a, j), from, to, v, e);
}
export function restPose(tr: Tracks, a: string, from: number, to: number): void { poseTo(tr, a, from, to, REST_POSE); }

/** Walking cycle. stride ~ 1.0 for a normal walk; cadence in cycles per second. */
export function walkCycle(tr: Tracks, a: string, from: number, to: number, cadence = 1.6, stride = 1): void {
  const ph = (t: number) => ((t - from) / 1000) * cadence * TAU;
  dense(tr, J(a, 'thighL'), from, to, (t) => 28 * stride * Math.sin(ph(t)));
  dense(tr, J(a, 'thighR'), from, to, (t) => 28 * stride * Math.sin(ph(t) + Math.PI));
  dense(tr, J(a, 'shinL'), from, to, (t) => -22 * stride * Math.max(0, Math.sin(ph(t) + Math.PI * 0.75)));
  dense(tr, J(a, 'shinR'), from, to, (t) => -22 * stride * Math.max(0, Math.sin(ph(t) + Math.PI * 1.75)));
  dense(tr, J(a, 'uArmL'), from, to, (t) => -22 * stride * Math.sin(ph(t)) + 2);
  dense(tr, J(a, 'uArmR'), from, to, (t) => -22 * stride * Math.sin(ph(t) + Math.PI) + 2);
  dense(tr, J(a, 'fArmL'), from, to, () => 18);
  dense(tr, J(a, 'fArmR'), from, to, () => 18);
  dense(tr, J(a, 'torso'), from, to, () => 4);
  dense(tr, J(a, 'head'), from, to, () => -2);
  dense(tr, `${a}.lift`, from, to, (t) => 1.2 * Math.abs(Math.sin(ph(t))));
}
/** Running cycle: longer stride, bent arms, forward lean, flight bob. */
export function runCycle(tr: Tracks, a: string, from: number, to: number, cadence = 2.6): void {
  const ph = (t: number) => ((t - from) / 1000) * cadence * TAU;
  dense(tr, J(a, 'thighL'), from, to, (t) => 10 + 48 * Math.sin(ph(t)));
  dense(tr, J(a, 'thighR'), from, to, (t) => 10 + 48 * Math.sin(ph(t) + Math.PI));
  dense(tr, J(a, 'shinL'), from, to, (t) => -30 - 70 * Math.max(0, Math.sin(ph(t) + Math.PI * 0.9)));
  dense(tr, J(a, 'shinR'), from, to, (t) => -30 - 70 * Math.max(0, Math.sin(ph(t) + Math.PI * 1.9)));
  dense(tr, J(a, 'uArmL'), from, to, (t) => -40 * Math.sin(ph(t)) - 20);
  dense(tr, J(a, 'uArmR'), from, to, (t) => -40 * Math.sin(ph(t) + Math.PI) - 20);
  dense(tr, J(a, 'fArmL'), from, to, (t) => 95 + 10 * Math.sin(ph(t)));
  dense(tr, J(a, 'fArmR'), from, to, (t) => 95 + 10 * Math.sin(ph(t) + Math.PI));
  dense(tr, J(a, 'torso'), from, to, () => 16);
  dense(tr, J(a, 'head'), from, to, () => -10);
  dense(tr, `${a}.lift`, from, to, (t) => 2.5 + 3.5 * Math.abs(Math.sin(ph(t))));
}
/** Jump: anticipation crouch → launch → flight → landing crouch → recover. Writes lift and joints. */
export function jump(tr: Tracks, a: string, from: number, durationMs: number, height: number): void {
  const t1 = from + durationMs * 0.28, t2 = from + durationMs * 0.36, apex = from + durationMs * 0.62, t3 = from + durationMs * 0.86, end = from + durationMs;
  poseTo(tr, a, from, t1, { thighL: 48, thighR: 44, shinL: -80, shinR: -76, torso: 24, uArmL: -60, uArmR: -56, fArmL: 10, fArmR: 10, head: -12 }, 'easeInOut');
  tween(tr, `${a}.lift`, from, t1, -7, 'easeInOut');
  poseTo(tr, a, t1, t2, { thighL: 6, thighR: 2, shinL: -6, shinR: -4, torso: 4, uArmL: 150, uArmR: 146, fArmL: 20, fArmR: 20, head: 4 }, 'easeOut');
  tween(tr, `${a}.lift`, t1, apex, height, 'easeOut');
  poseTo(tr, a, t2, apex, { thighL: 30, thighR: 20, shinL: -40, shinR: -30 }, 'easeInOut');
  tween(tr, `${a}.lift`, apex, t3, -5, 'easeIn');
  poseTo(tr, a, apex, t3, { thighL: 44, thighR: 40, shinL: -70, shinR: -66, torso: 20, uArmL: 30, uArmR: 26, fArmL: 20, fArmR: 20, head: -8 }, 'easeIn');
  tween(tr, `${a}.lift`, t3, end, 0, 'easeOut');
  poseTo(tr, a, t3, end, { ...REST_POSE }, 'easeOut');
}
/** Breathing idle with periodic blinks. */
export function idleBreathe(tr: Tracks, a: string, from: number, to: number): void {
  dense(tr, J(a, 'torso'), from, to, (t) => 1.5 * Math.sin(((t - from) / 1000) * TAU * 0.35), 0, 80);
  dense(tr, `${a}.lift`, from, to, (t) => 0.4 * Math.sin(((t - from) / 1000) * TAU * 0.35), 0, 80);
  blinks(tr, a, from, to);
}
export function blinks(tr: Tracks, a: string, from: number, to: number, every = 2800): void {
  for (let t = from + 900; t + 160 < to; t += every) {
    addKey(tr, `${a}.blink`, { t, v: true }); addKey(tr, `${a}.blink`, { t: t + 140, v: false });
  }
}
export function footWiggle(tr: Tracks, a: string, from: number, to: number, joint: Joint = 'footL'): void {
  dense(tr, J(a, joint), from, to, (t) => 14 * Math.sin(((t - from) / 1000) * TAU * 0.9), 0, 60);
}
/** Jog on the spot (run cycle without travel, smaller lean). */
export function jogInPlace(tr: Tracks, a: string, from: number, to: number): void {
  runCycle(tr, a, from, to, 2.4);
  dense(tr, J(a, 'torso'), from, to, () => 8);
}
/** Stretch: arms up, side lean, then forward bend toward the toes, back up. */
export function stretch(tr: Tracks, a: string, from: number, to: number): void {
  const d = to - from, k = (u: number) => from + d * u;
  poseTo(tr, a, from, k(0.2), { uArmL: 168, uArmR: 164, fArmL: 6, fArmR: 6, torso: -8, head: 10, thighL: 0, thighR: 0, shinL: 0, shinR: 0 });
  poseTo(tr, a, k(0.2), k(0.38), { torso: -14, head: 14 });
  poseTo(tr, a, k(0.38), k(0.52), { torso: 4, head: 2, uArmL: 40, uArmR: 36, fArmL: 30, fArmR: 30 });
  // lunge: front leg bent, back leg stretched, hands on the front thigh
  poseTo(tr, a, k(0.52), k(0.72), { thighL: 62, shinL: -72, thighR: -34, shinR: -4, torso: 12, head: -2, uArmL: 48, fArmL: 44, uArmR: 44, fArmR: 48 });
  tween(tr, `${a}.lift`, k(0.52), k(0.72), -8, 'easeInOut');
  tween(tr, `${a}.lift`, k(0.78), k(1), 0, 'easeInOut');
  poseTo(tr, a, k(0.78), k(1), { ...REST_POSE });
}
