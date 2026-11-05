/** Low-contrast environments: background, ground, optional foreground. */
import { circle, g, line, path, rect, type FrameNode } from '../engine/frame';
import { palette as C } from './palette';

export type EnvTime = 'day' | 'evening' | 'night';
export type Env = { background: (w: number, h: number, ground: number, time: EnvTime, scroll?: number) => FrameNode; paper: (time: EnvTime) => string; ground: number };
/** Position of a repeating feature (period `p`) after the world has scrolled by `s` (positive = the actor moves right). */
const rep = (base: number, p: number, s: number, w: number): number[] => { const out: number[] = []; const o = ((base - s) % p + p) % p; for (let x = o - p; x < w + p; x += p) out.push(x); return out; };
const sky = (time: EnvTime) => (time === 'night' ? C.night : time === 'evening' ? '#f4c08a' : '#dff0fa');
const paperFor = (time: EnvTime) => (time === 'night' ? C.nightPaper : C.paper);

export const ENVS: Record<string, Env> = {
  neutral: { ground: 100, paper: paperFor, background: (w, _h, ground) => g([line([[8, ground], [w - 8, ground]], { stroke: C.grey2, sw: 2 })]) },
  room: { ground: 100, paper: paperFor, background: (w, _h, ground, time, scroll = 0) => g([
    rect(0, ground, w, 120 - ground, { fill: time === 'night' ? '#c9c3b6' : '#e8dfd0' }),
    line([[0, ground], [w, ground]], { stroke: C.ink, sw: 1.2, opacity: 0.25 }),
    ...rep(26, 160, scroll, w).map((x) => g([rect(-15, -15, 30, 30, { rx: 3, fill: sky(time), stroke: C.ink, sw: 2 }), time === 'night' ? circle(7, -7, 4, { fill: C.yellow }) : circle(-6, -6, 4.5, { fill: C.yellow, opacity: 0.8 }), line([[0, -15], [0, 15]], { stroke: C.ink, sw: 1.6 }), line([[-15, 0], [15, 0]], { stroke: C.ink, sw: 1.6 })], { x, y: 30 })),
  ]) },
  bedroom: { ground: 100, paper: paperFor, background: (w, _h, ground, time) => g([
    rect(0, ground, w, 120 - ground, { fill: time === 'night' ? '#b9b6c4' : '#e3dcd0' }),
    g([rect(-15, -15, 30, 30, { rx: 3, fill: sky(time), stroke: C.ink, sw: 2 }), time === 'night' ? circle(7, -7, 4, { fill: C.yellow }) : circle(-6, -6, 4.5, { fill: C.yellow, opacity: 0.8 }), line([[0, -15], [0, 15]], { stroke: C.ink, sw: 1.6 }), line([[-15, 0], [15, 0]], { stroke: C.ink, sw: 1.6 })], { x: 26, y: 30 }),
  ]) },
  kitchen: { ground: 100, paper: paperFor, background: (w, _h, ground, time) => g([
    rect(0, ground, w, 120 - ground, { fill: time === 'night' ? '#c0c4c9' : '#e4e8ea' }),
    rect(10, 60, 28, 40, { rx: 2, fill: '#dcd2c2', stroke: C.ink, sw: 1.6, opacity: 0.8 }), line([[12, 70], [36, 70]], { stroke: C.ink, sw: 1, opacity: 0.4 }),
  ]) },
  'outdoors.park': { ground: 100, paper: paperFor, background: (w, _h, ground, time, scroll = 0) => g([
    rect(0, 0, w, ground, { fill: sky(time), opacity: 0.55 }),
    rect(0, ground - 2, w, 120 - ground + 2, { fill: time === 'night' ? '#4d6b4e' : '#bfe2b4' }),
    // far trees move slower than the ground (parallax), bushes at ground speed
    ...rep(30, 150, scroll * 0.35, w).map((x) => g([path('M-6 0 q-10 -30 6 -44 q16 14 6 44 Z', { fill: time === 'night' ? '#35553c' : '#a9d8a0', stroke: C.ink, sw: 1.2, opacity: 0.7 }), rect(-1.5, -2, 3, 2, { fill: C.brown })], { x, y: ground })),
    ...rep(w - 36, 170, scroll, w).map((x) => g([path(`M0 0 q-4 -22 10 -30 q-4 -14 10 -16 q14 2 10 16 q14 8 10 30 Z`, { fill: time === 'night' ? '#3f6a45' : '#8fd08a', stroke: C.ink, sw: 1.4, opacity: 0.9 }), rect(16, -2, 4, 2, { fill: C.brown })], { x, y: ground })),
    ...rep(12, 61, scroll, w).map((x) => line([[x, ground + 9], [x + 10, ground + 9]], { stroke: 'rgba(43,42,51,0.18)', sw: 1.4 })),
    time === 'day' ? circle(18, 18, 7, { fill: C.yellow, opacity: 0.9 }) : circle(18, 18, 6, { fill: C.yellow }),
  ]) },
  street: { ground: 100, paper: paperFor, background: (w, _h, ground, time, scroll = 0) => g([
    rect(0, 0, w, ground, { fill: sky(time), opacity: 0.5 }),
    rect(0, ground - 2, w, 120 - ground + 2, { fill: '#cfd3d8' }),
    ...rep(0, 12, scroll, w).map((x) => line([[x, ground + 8], [x + 6, ground + 8]], { stroke: C.white, sw: 1.6 })),
    ...rep(10, 140, scroll * 0.5, w).map((x) => rect(x, 40, 22, 60, { fill: '#e8e2d6', stroke: C.ink, sw: 1.4, opacity: 0.8 })),
    ...rep(70, 95, scroll, w).map((x) => g([line([[0, 0], [0, -46]], { stroke: C.dark, sw: 2.4 }), circle(0, -48, 3, { fill: C.yellow, stroke: C.ink, sw: 1.2 })], { x, y: ground })),
  ]) },
};
