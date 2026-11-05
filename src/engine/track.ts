/**
 * Tracks: keyframe lists per animated parameter. A compiled scene is a map of
 * `"<node>.<param>"` → Track. Numbers interpolate with the keyframe's easing;
 * strings/booleans step. Dense keyframes (every ~40 ms) are used for cycles so
 * that smooth procedural motion stays plain data.
 */
import { ease, type EaseName, clamp01 } from './easing';

export type TrackValue = number | string | boolean;
export type Key<V extends TrackValue = TrackValue> = { t: number; v: V; e?: EaseName };
export type Track = { keys: Key[]; priority: number };
export type Tracks = Map<string, Track>;

export const DENSE_STEP_MS = 40;

export function addKey(tracks: Tracks, id: string, key: Key, priority = 0): void {
  let tr = tracks.get(id);
  if (!tr) { tr = { keys: [], priority }; tracks.set(id, tr); }
  // Higher-priority writers own the track; equal priority merges by time.
  if (priority < tr.priority) return;
  if (priority > tr.priority) { tr.keys = []; tr.priority = priority; }
  const i = tr.keys.findIndex((k) => k.t >= key.t);
  if (i === -1) tr.keys.push(key);
  else if (tr.keys[i]!.t === key.t) tr.keys[i] = key;
  else tr.keys.splice(i, 0, key);
}

/** Add a smooth segment from the current value at `from` to `v` at `to`. */
export function tween(tracks: Tracks, id: string, from: number, to: number, v: number, e: EaseName = 'easeInOut', priority = 0, startValue?: number): void {
  if (startValue !== undefined) addKey(tracks, id, { t: from, v: startValue, e: 'linear' }, priority);
  else {
    const cur = sample(tracks, id, from);
    if (cur !== undefined) addKey(tracks, id, { t: from, v: cur, e: 'linear' }, priority);
  }
  addKey(tracks, id, { t: to, v, e }, priority);
}

/** Dense sampling of a function of time into keyframes (for cycles). */
export function dense(tracks: Tracks, id: string, from: number, to: number, f: (tMs: number, u: number) => number, priority = 0, step = DENSE_STEP_MS): void {
  const n = Math.max(1, Math.round((to - from) / step));
  for (let i = 0; i <= n; i++) {
    const t = from + ((to - from) * i) / n;
    addKey(tracks, id, { t: Math.round(t), v: f(t, i / n), e: 'linear' }, priority);
  }
}

/** Value of a track at time t (ms). Holds first/last values outside the key range. */
export function sample(tracks: Tracks, id: string, t: number): TrackValue | undefined {
  const tr = tracks.get(id);
  if (!tr || tr.keys.length === 0) return undefined;
  const keys = tr.keys;
  if (t <= keys[0]!.t) return keys[0]!.v;
  const last = keys[keys.length - 1]!;
  if (t >= last.t) return last.v;
  // binary search for the segment
  let lo = 0, hi = keys.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (keys[mid]!.t <= t) lo = mid; else hi = mid; }
  const a = keys[lo]!, b = keys[hi]!;
  if (typeof a.v !== 'number' || typeof b.v !== 'number') return a.v; // step for discrete values
  const u = clamp01((t - a.t) / (b.t - a.t));
  const w = ease[b.e ?? 'linear'](u);
  return a.v + (b.v - a.v) * w;
}

export function sampleNumber(tracks: Tracks, id: string, t: number, fallback: number): number {
  const v = sample(tracks, id, t);
  return typeof v === 'number' ? v : fallback;
}
export function sampleString<T extends string>(tracks: Tracks, id: string, t: number, fallback: T): T {
  const v = sample(tracks, id, t);
  return (typeof v === 'string' ? v : fallback) as T;
}
export function sampleBool(tracks: Tracks, id: string, t: number, fallback: boolean): boolean {
  const v = sample(tracks, id, t);
  return typeof v === 'boolean' ? v : fallback;
}
/** Fraction of [from,to] during which a discrete track equals `value`. */
export function fractionEqual(tracks: Tracks, id: string, from: number, to: number, value: TrackValue, step = DENSE_STEP_MS): number {
  let hit = 0, n = 0;
  for (let t = from; t <= to; t += step) { n++; if (sample(tracks, id, t) === value) hit++; }
  return n ? hit / n : 0;
}
