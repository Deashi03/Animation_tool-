/**
 * Food and raw ingredients that change under cooking verbs. Base point =
 * bottom centre (lies on a board/plate/table). Shared states:
 *   pieces 0..1   whole → cut into slices that spread apart (skära, hacka)
 *   peeled 0..1   skin removed (skala)
 *   ripeness 0..1 unripe colour → ripe colour (mogna)
 *   rot 0..1      brown spots, sagging (ruttna, mögla)
 *   mashed 0..1   collapses into a soft heap (mosa)
 * Asset ids: `food.<shape>`.
 */
import { circle, ellipse, g, line, path, type FrameNode, r1 } from '../../engine/frame';
import { palette as C, color } from '../palette';
import { type PropSpec, n, clamp01, mix, str } from '../propSpec';

const INK = C.ink;
export const FOOD_SHAPES = ['apple', 'banana', 'carrot', 'tomato', 'onion', 'potato', 'bread', 'dough', 'egg', 'cheese', 'pile', 'fish', 'pancake', 'cake'] as const;
export type FoodShape = (typeof FOOD_SHAPES)[number];

/** Draw `body` whole or as `k` vertical slices that spread apart as `pieces` grows (cuts come one by one from the right). */
function sliced(body: FrameNode, w: number, h: number, pieces: number, k = 4): FrameNode {
  const p = clamp01(pieces); if (p < 0.02) return body;
  const out: FrameNode[] = []; const sw = w / k;
  for (let i = 0; i < k; i++) {
    const cutIndex = k - 1 - i; // rightmost slice is cut first
    const cutProgress = clamp01(p * k - cutIndex); // 0 = not yet cut, 1 = fully separated
    const dx = cutProgress * (i - (k - 1) / 2) * 2.2 + cutProgress * (i === k - 1 ? 2 : 0);
    out.push(g([body], { x: dx }, { clip: { x: -w / 2 + i * sw - (i === 0 ? 2 : 0), y: -h - 2, w: sw + (i === 0 || i === k - 1 ? 2 : 0) + 0.3, h: h + 4 } }));
    if (cutProgress > 0.05 && i < k - 1) out.push(line([[-w / 2 + (i + 1) * sw + dx, -h + 1], [-w / 2 + (i + 1) * sw + dx, -1]], { stroke: INK, sw: 1, opacity: 0.6 * cutProgress }));
  }
  return g(out);
}
function rotSpots(cx: number, cy: number, r: number, rot: number): FrameNode[] {
  if (rot < 0.05) return [];
  const out: FrameNode[] = []; const spots: [number, number, number][] = [[-0.4, -0.2, 0.25], [0.35, 0.1, 0.3], [0, 0.45, 0.2], [-0.2, 0.5, 0.15]];
  for (const [x, y, k] of spots) out.push(circle(cx + x * r, cy + y * r, r * k * Math.min(1, rot * 1.6), { fill: '#6b4a2b', opacity: 0.8 * rot }));
  if (rot > 0.6) out.push(circle(cx - r * 0.3, cy - r * 0.4, r * 0.18 * rot, { fill: '#9ab08a', stroke: INK, sw: 0.6 }), circle(cx + r * 0.2, cy - r * 0.2, r * 0.12 * rot, { fill: '#c3d1b5', stroke: INK, sw: 0.6 })); // mould
  return out;
}
const mashedHeap = (c: string, w: number): FrameNode => path(`M${r1(-w / 2)} 0 q${r1(w * 0.1)} -8 ${r1(w / 2)} -8 q${r1(w * 0.4)} 0 ${r1(w / 2)} 8 Z`, { fill: c, stroke: INK, sw: 1.6 });

const F: Record<FoodShape, PropSpec> = {
  apple: {
    defaults: { pieces: 0, peeled: 0, ripeness: 1, rot: 0, bite: 0, mashed: 0 }, grip: [0, -7], mouth: [0, -14],
    draw: (s) => { const rip = clamp01(n(s, 'ripeness', 1)), rot = clamp01(n(s, 'rot', 0)), peeled = clamp01(n(s, 'peeled', 0)), bite = clamp01(n(s, 'bite', 0)), mashed = clamp01(n(s, 'mashed', 0));
      const skin = mix(rip < 0.5 ? mix('#7bb661', '#e9c93a', rip * 2) : mix('#e9c93a', C.red, (rip - 0.5) * 2), '#8a6a4a', rot * 0.6), flesh = '#f7edc8';
      const r = 7 * (1 - rot * 0.12), cy = -r;
      if (mashed > 0.5) return mashedHeap(mix(flesh, skin, 0.3), 16);
      const body = g([
        circle(0, cy, r, { fill: mix(skin, flesh, peeled), stroke: INK, sw: 1.8 }),
        bite > 0.3 ? circle(r * 0.7, cy - r * 0.4, r * 0.45, { fill: C.paper, stroke: INK, sw: 1.2 }) : g([]),
        bite > 0.3 ? circle(r * 0.7, cy - r * 0.4, r * 0.32, { fill: flesh }) : g([]),
        ...rotSpots(0, cy, r, rot),
        line([[0, cy - r + 1], [1, cy - r - 4]], { stroke: C.brown, sw: 1.6 }), path(`M1 ${r1(cy - r - 2)} q4 -4 7 -1 q-4 3 -7 1 Z`, { fill: C.green, stroke: INK, sw: 1 }),
        peeled > 0.3 ? path(`M${r1(r * 0.8)} ${r1(cy + r * 0.3)} q6 2 4 7 q-3 2 -2 5`, { fill: 'none', stroke: skin, sw: 1.8, opacity: peeled }) : g([]),
      ]);
      return sliced(body, 2 * r, 2 * r + 5, n(s, 'pieces', 0)); },
  },
  banana: {
    defaults: { ripeness: 0.6, rot: 0, peeled: 0, pieces: 0 }, grip: [0, -5], mouth: [0, -8],
    draw: (s) => { const rip = clamp01(n(s, 'ripeness', 0.6)), rot = clamp01(n(s, 'rot', 0)), peeled = clamp01(n(s, 'peeled', 0));
      const skin = mix(mix('#8fbf5a', C.yellow, Math.min(1, rip * 1.4)), '#5b3d2a', rot * 0.8);
      const body = g([
        path('M-12 -3 q12 -12 24 -2 q-2 3 -4 2 q-10 -7 -18 2 q-1 -1 -2 -2 Z', { fill: peeled > 0.5 ? '#f3e6a8' : skin, stroke: INK, sw: 1.8 }),
        path('M-12 -3 l-2 -1.5 l1.5 -1', { fill: 'none', stroke: INK, sw: 1.4 }),
        ...(rot > 0.1 ? [circle(-4, -6, 1.3 * rot, { fill: '#4a2f1f', opacity: 0.9 }), circle(3, -7, 1.1 * rot, { fill: '#4a2f1f', opacity: 0.9 }), circle(8, -5, 0.9 * rot, { fill: '#4a2f1f', opacity: 0.9 })] : []),
      ]);
      return sliced(body, 26, 10, n(s, 'pieces', 0), 5); },
  },
  carrot: {
    defaults: { pieces: 0, peeled: 0 }, grip: [0, -3], mouth: [0, -6],
    draw: (s) => { const peeled = clamp01(n(s, 'peeled', 0));
      const body = g([path('M-14 -2 q0 -5 5 -5 h20 q4 1 4 3.5 q0 2.5 -4 3.5 h-20 q-5 0 -5 -2 Z', { fill: mix(C.orange, '#f6b26b', peeled), stroke: INK, sw: 1.8 }), ...(peeled < 0.5 ? [line([[-6, -4], [-4, -4]], { stroke: INK, sw: 0.8, opacity: 0.5 }), line([[2, -2], [4, -2]], { stroke: INK, sw: 0.8, opacity: 0.5 })] : []), path('M15 -3.5 l5 -4 M15 -3.5 l6 -1', { fill: 'none', stroke: C.green, sw: 1.8 })]);
      return sliced(body, 30, 8, n(s, 'pieces', 0), 5); },
  },
  tomato: {
    defaults: { pieces: 0, ripeness: 1, rot: 0 }, grip: [0, -6], mouth: [0, -12],
    draw: (s) => { const rip = clamp01(n(s, 'ripeness', 1)), rot = clamp01(n(s, 'rot', 0)); const r = 6.5;
      const body = g([circle(0, -r, r, { fill: mix(mix('#8fbf5a', C.red, rip), '#6b4a2b', rot * 0.5), stroke: INK, sw: 1.8 }), ...rotSpots(0, -r, r, rot), path(`M-3 ${r1(-2 * r + 1)} l3 -3 l3 3 M0 ${r1(-2 * r - 2)} v3`, { fill: 'none', stroke: C.green, sw: 1.4 })]);
      return sliced(body, 2 * r, 2 * r + 3, n(s, 'pieces', 0)); },
  },
  onion: {
    defaults: { pieces: 0, peeled: 0 }, grip: [0, -6], mouth: [0, -12],
    draw: (s) => { const peeled = clamp01(n(s, 'peeled', 0)); const r = 6.5;
      const body = g([circle(0, -r, r, { fill: mix('#d9b06a', '#f6efd8', peeled), stroke: INK, sw: 1.8 }), path(`M-3.5 ${r1(-r)} q0 -4 3.5 -4 q3.5 0 3.5 4`, { fill: 'none', stroke: INK, sw: 0.8, opacity: 0.4 }), path(`M-5.5 ${r1(-r)} q0 -6 5.5 -6 q5.5 0 5.5 6`, { fill: 'none', stroke: INK, sw: 0.8, opacity: 0.4 }), line([[0, -2 * r + 1], [1, -2 * r - 3]], { stroke: C.brown, sw: 1.4 })]);
      return sliced(body, 2 * r, 2 * r + 3, n(s, 'pieces', 0), 5); },
  },
  potato: {
    defaults: { pieces: 0, peeled: 0, mashed: 0 }, grip: [0, -5], mouth: [0, -10],
    draw: (s) => { const peeled = clamp01(n(s, 'peeled', 0)), mashed = clamp01(n(s, 'mashed', 0));
      if (mashed > 0.5) return mashedHeap('#f3e3a8', 16);
      const sq = clamp01(n(s, 'squash', 0));
      const body = g([ellipse(0, -5 + sq * 1.2, 9 + sq * 1.5, 5.5 - sq * 1.2, { fill: mix('#b58a5a', '#f3e3a8', peeled), stroke: INK, sw: 1.8 }), ...(peeled < 0.5 ? [circle(-3, -6, 0.7, { fill: INK, opacity: 0.4 }), circle(2, -4, 0.7, { fill: INK, opacity: 0.4 }), circle(4, -7, 0.6, { fill: INK, opacity: 0.4 })] : []), ...(peeled > 0.08 ? [path(`M9 -3 q${r1(3 + 5 * peeled)} 1 ${r1(2 + 4 * peeled)} ${r1(4 + 3 * peeled)} q-2 2 ${r1(-3 * peeled)} 2`, { fill: 'none', stroke: '#b58a5a', sw: 2, opacity: Math.min(1, peeled * 3) }), path(`M-9 -4 q${r1(-4 * peeled)} 3 -2 ${r1(5 + 3 * peeled)}`, { fill: 'none', stroke: '#b58a5a', sw: 2, opacity: Math.max(0, peeled - 0.4) * 1.6 })] : [])]);
      return sliced(body, 18, 11, n(s, 'pieces', 0)); },
  },
  bread: {
    defaults: { pieces: 0, toast: 0 }, grip: [0, -6], mouth: [0, -12],
    draw: (s) => { const toast = clamp01(n(s, 'toast', 0));
      const body = g([path('M-14 0 v-7 q0 -6 7 -6 h14 q7 0 7 6 v7 Z', { fill: mix('#e9c791', '#8d4a1c', toast), stroke: INK, sw: 1.8 }), path('M-8 -11 q3 -3 6 0 q3 -3 6 0', { fill: 'none', stroke: INK, sw: 0.8, opacity: 0.4 })]);
      return sliced(body, 28, 13, n(s, 'pieces', 0), 5); },
  },
  dough: {
    defaults: { rise: 0, flat: 0, phase: 0 }, grip: [0, -5], mouth: [0, -8],
    draw: (s) => { const rise = clamp01(n(s, 'rise', 0)), flat = clamp01(n(s, 'flat', 0)), ph = n(s, 'phase', 0);
      const sq = clamp01(n(s, 'squash', 0));
      const w = (9 + rise * 4 + flat * 13) * (1 + 0.22 * sq), h = Math.max(2.6, (10 + rise * 6) * (1 - flat * 0.82) + 1.2) * (1 - 0.35 * sq);
      const wob = Math.sin(ph * 2 * Math.PI) * 0.6;
      return g([ellipse(0, -h / 2, w + wob, h / 2, { fill: '#f3e6c8', stroke: INK, sw: 1.8 }), flat < 0.5 ? ellipse(-w * 0.3, -h * 0.75, w * 0.25, h * 0.12, { fill: 'rgba(255,255,255,0.6)' }) : g([]), sq > 0.3 ? path(`M${r1(-w * 0.45)} ${r1(-h * 0.9)} q${r1(w * 0.2)} 2 ${r1(w * 0.4)} 0`, { fill: 'none', stroke: INK, sw: 0.8, opacity: 0.4 * sq }) : g([])]); },
  },
  egg: {
    defaults: { cracked: 0, boiled: 0 }, grip: [0, -5], mouth: [0, -10],
    draw: (s) => { const cr = clamp01(n(s, 'cracked', 0));
      if (cr > 0.5) return g([path('M-7 0 q-1 -7 3 -8 l1 2 l1.5 -2 l1.5 2 l1 -2 q4 2 3 8 Z', { fill: C.white, stroke: INK, sw: 1.5 }), ellipse(9, -1, 6, 2, { fill: C.white, stroke: INK, sw: 1.2 }), circle(9, -2, 2.4, { fill: C.yellow, stroke: INK, sw: 1.1 })]);
      return g([ellipse(0, -5.5, 4.5, 5.5, { fill: mix('#fbf3e0', '#f0e2c0', clamp01(n(s, 'boiled', 0))), stroke: INK, sw: 1.6 }), cr > 0.1 ? path('M-1 -9 l1.5 2 l-1 2 l1.5 2', { fill: 'none', stroke: INK, sw: 1, opacity: cr * 2 }) : g([])]); },
  },
  cheese: {
    defaults: { grated: 0 }, grip: [0, -5], mouth: [0, -9],
    draw: (s) => { const gr = clamp01(n(s, 'grated', 0)); const w = 16 * (1 - gr * 0.7);
      const pile: FrameNode[] = []; if (gr > 0.05) for (let i = 0; i < 7; i++) pile.push(line([[10 + (i % 3) * 2 - gr * 2, -1 - Math.floor(i / 3) * 1.8 * gr], [13 + (i % 3) * 2, -1 - Math.floor(i / 3) * 1.8 * gr - 1]], { stroke: C.yellow, sw: 1.4, opacity: gr }));
      return g([path(`M${r1(-w / 2)} 0 h${r1(w)} v-9 l${r1(-w)} 4 Z`, { fill: C.yellow, stroke: INK, sw: 1.8 }), circle(-w * 0.2, -3, 1.2, { fill: '#e0b23c' }), circle(w * 0.2, -4.5, 0.9, { fill: '#e0b23c' }), ...pile]); },
  },
  pile: {
    defaults: { amount: 1, contents: '#e9c791' }, grip: [0, -3], mouth: [0, -5],
    draw: (s) => { const a = clamp01(n(s, 'amount', 1)); const c = color(str(s, 'contents', '#e9c791')); if (a < 0.03) return g([]);
      const bits: FrameNode[] = []; const nb = Math.round(3 + a * 9), w = 6 + 12 * a; for (let i = 0; i < nb; i++) { const row = i % 3, col = Math.floor(i / 3); const x = -w / 2 + ((col * 4.6 + row * 1.7) % w), y = -1.2 - row * 1.7; bits.push(circle(x, y, 1.3, { fill: c, stroke: INK, sw: 0.8 })); }
      return g(bits); },
  },
  fish: {
    defaults: { pieces: 0 }, grip: [0, -4], mouth: [0, -8],
    draw: (s) => { const body = g([path('M-12 -4 q8 -8 20 -4 q4 2 4 4 l6 -4 v8 l-6 -4 q0 2 -4 4 q-12 4 -20 -4 Z', { fill: C.sky, stroke: INK, sw: 1.8 }), circle(-7, -5, 1, { fill: INK }), path('M-2 -8 q2 -2 4 0', { fill: 'none', stroke: INK, sw: 0.8, opacity: 0.5 })]);
      return sliced(body, 36, 10, n(s, 'pieces', 0), 5); },
  },
  pancake: {
    defaults: { browning: 0.6, pieces: 0 }, grip: [0, -2], mouth: [0, -4],
    draw: (s) => { const br = clamp01(n(s, 'browning', 0.6)); const body = ellipse(0, -1.5, 11, 2.2, { fill: mix('#f7e6b8', '#8d4a1c', br * 0.8), stroke: INK, sw: 1.5 }); return sliced(body, 22, 4, n(s, 'pieces', 0), 4); },
  },
  cake: {
    defaults: { pieces: 0, decorated: 0 }, grip: [0, -6], mouth: [0, -14],
    draw: (s) => { const dec = clamp01(n(s, 'decorated', 0));
      const body = g([path('M-12 0 v-9 h24 v9 Z', { fill: '#f3d9a4', stroke: INK, sw: 1.8 }), path('M-12 -9 q6 -3 12 0 q6 -3 12 0 v-2 h-24 Z', { fill: C.rose, stroke: INK, sw: 1.4 }), ...(dec > 0.3 ? [circle(-6, -11, 1.6 * dec, { fill: C.red, stroke: INK, sw: 0.8 }), circle(0, -12, 1.6 * dec, { fill: C.red, stroke: INK, sw: 0.8 }), circle(6, -11, 1.6 * dec, { fill: C.red, stroke: INK, sw: 0.8 })] : [])]);
      return sliced(body, 24, 14, n(s, 'pieces', 0), 4); },
  },
};
void color;

export const FOODS: Record<string, PropSpec> = Object.fromEntries(Object.entries(F).map(([k, v]) => [`food.${k}`, v]));
