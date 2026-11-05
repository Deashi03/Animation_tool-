/** Shared prop contract (kept free of drawing code so prop families can live in separate files). */
import type { FrameNode } from '../engine/frame';

export type PropState = Record<string, number | string | boolean>;
export type PropSpec = {
  draw: (s: PropState, col?: string) => FrameNode;
  /** grip point in local space (for attach) */
  grip: [number, number];
  /** where poured liquid lands / content top / where a tool works, local */
  mouth?: [number, number];
  /** default state */
  defaults: PropState;
  /** rotation pivot in local space (default: the base point) */
  pivot?: (s: PropState) => [number, number];
  /** seat/lying anchor for actors (local), and body rotation when lying */
  seat?: { x: number; y: number; reclineDeg?: number };
  /** held tools: how the tool is oriented in the hand by default (degrees forward around the grip) */
  heldTilt?: number;
};
export const n = (s: PropState, k: string, d: number): number => (typeof s[k] === 'number' ? (s[k] as number) : d);
export const b = (s: PropState, k: string, d: boolean): boolean => (typeof s[k] === 'boolean' ? (s[k] as boolean) : d);
export const str = (s: PropState, k: string, d: string): string => (typeof s[k] === 'string' ? (s[k] as string) : d);
export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
/** Blend two colours given as #rrggbb or rgb(); returns rgb(). */
export function mix(a: string, b: string, u: number): string {
  const hex = (h: string): [number, number, number] => { if (h.startsWith('rgb')) { const m = (h.match(/\d+/g) ?? []).map(Number); return [m[0] ?? 0, m[1] ?? 0, m[2] ?? 0]; } return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; };
  const A = hex(a), B = hex(b), k = clamp01(u);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * k)},${Math.round(A[1] + (B[1] - A[1]) * k)},${Math.round(A[2] + (B[2] - A[2]) * k)})`;
}
