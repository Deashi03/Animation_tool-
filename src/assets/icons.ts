/**
 * Small icons with a draw-on `progress` (0..1). Centered at the origin on a
 * 24-unit design grid, scaled by `size`. Used by UI scenes, speech bubbles
 * (`say { icon }`) and attribute-gloss scenes. Culturally neutral shapes only
 * (no thumbs-up, no animals as metaphors).
 */
import { g, path, circle, rect, line, type FrameNode, r1 } from '../engine/frame';
import { palette as C } from './palette';

export const ICON_NAMES = ['check', 'cross', 'star', 'arrow-right', 'arrow-left', 'arrow-up', 'arrow-down', 'arc-arrow', 'swap', 'flag', 'heart', 'exclaim', 'question', 'ellipsis', 'coin', 'banknote', 'clock', 'calendar', 'magnifier', 'scale', 'house', 'key', 'document', 'pen', 'music', 'thermometer', 'droplet', 'flame', 'snowflake', 'sun', 'cloud', 'leaf', 'recycle', 'bin', 'phone', 'plate', 'bed', 'speech', 'lightning', 'lock', 'shield', 'swords', 'crown', 'hand', 'eye', 'ear', 'nose', 'footprints', 'equals', 'plus', 'minus', 'no', 'hourglass', 'gift', 'cart', 'book', 'smile', 'frown', 'bell', 'tshirt', 'trousers', 'shoe', 'hat', 'cup', 'fork-knife', 'wave', 'zzz', 'bulb'] as const;
export type IconName = (typeof ICON_NAMES)[number];

export function drawIcon(name: IconName, size: number, progress = 1, fill?: string, stroke?: string): FrameNode {
  const s = size / 24, u = Math.max(0, Math.min(1, progress));
  const sw = 3;
  const ink = stroke ?? fill ?? C.uiSuccess;
  const partial = (pts: [number, number][]): string => {
    let total = 0; const segs: number[] = [];
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]); segs.push(d); total += d; }
    let left = total * u; const out = [`M${r1(pts[0]![0])} ${r1(pts[0]![1])}`];
    for (let i = 1; i < pts.length; i++) { const d = segs[i - 1]!; if (left <= 0) break; const k = Math.min(1, left / d); out.push(`L${r1(pts[i - 1]![0] + (pts[i]![0] - pts[i - 1]![0]) * k)} ${r1(pts[i - 1]![1] + (pts[i]![1] - pts[i - 1]![1]) * k)}`); left -= d; }
    return out.join(' ');
  };
  const stroked = (d: string, w = sw): FrameNode => path(d, { stroke: ink, sw: w, fill: 'none', linecap: 'round' });
  const pop = (node: FrameNode): FrameNode => g([node], { scale: 0.5 + 0.5 * u });
  let node: FrameNode;
  switch (name) {
    case 'check': node = path(partial([[-8, 0], [-2.5, 5.5], [8, -6]]), { stroke: ink, sw, fill: 'none', linecap: 'round' }); break;
    case 'cross': node = g([path(partial([[-7, -7], [7, 7]]), { stroke: ink, sw, fill: 'none', linecap: 'round' }), path(partial([[7, -7], [-7, 7]]), { stroke: ink, sw, fill: 'none', linecap: 'round' })]); break;
    case 'arrow-right': node = path(partial([[-8, 0], [8, 0], [2, -6], [8, 0], [2, 6]]), { stroke: ink, sw, fill: 'none', linecap: 'round' }); break;
    case 'arrow-left': node = path(partial([[8, 0], [-8, 0], [-2, -6], [-8, 0], [-2, 6]]), { stroke: ink, sw, fill: 'none', linecap: 'round' }); break;
    case 'arrow-up': node = path(partial([[0, 8], [0, -8], [-6, -2], [0, -8], [6, -2]]), { stroke: ink, sw, fill: 'none', linecap: 'round' }); break;
    case 'arrow-down': node = path(partial([[0, -8], [0, 8], [-6, 2], [0, 8], [6, 2]]), { stroke: ink, sw, fill: 'none', linecap: 'round' }); break;
    case 'swap': node = g([path(partial([[-8, -4], [8, -4], [3, -8]]), { stroke: ink, sw: 2.4, fill: 'none', linecap: 'round' }), path(partial([[8, 4], [-8, 4], [-3, 8]]), { stroke: ink, sw: 2.4, fill: 'none', linecap: 'round' })]); break;
    case 'arc-arrow': {
      const pts: [number, number][] = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * (1 - i / 16); pts.push([Math.cos(a) * 10, -Math.sin(a) * 10 + 2]); }
      const end = pts[pts.length - 1]!, prev = pts[pts.length - 3]!; const ang = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
      const h1: [number, number] = [end[0] - 5 * Math.cos(ang - 0.6), end[1] - 5 * Math.sin(ang - 0.6)], h2: [number, number] = [end[0] - 5 * Math.cos(ang + 0.6), end[1] - 5 * Math.sin(ang + 0.6)];
      node = g([path(partial(pts), { stroke: ink, sw: 2, fill: 'none', linecap: 'round' }), ...(u >= 0.98 ? [path(`M${r1(h1[0])} ${r1(h1[1])} L${r1(end[0])} ${r1(end[1])} L${r1(h2[0])} ${r1(h2[1])}`, { stroke: ink, sw: 2, fill: 'none', linecap: 'round' })] : [])]);
      break; }
    case 'exclaim': node = g([path(partial([[0, -9], [0, 3]]), { stroke: ink, sw: sw + 1, fill: 'none', linecap: 'round' }), circle(0, 8, 2.2 * u, { fill: ink })]); break;
    case 'question': node = g([stroked('M-5 -4 q0 -6 5 -6 q6 0 5 6 q-1 3 -5 5 v2', 3.2), circle(0, 8, 2.2 * u, { fill: ink })]); break;
    case 'ellipsis': node = g([circle(-7, 0, 2.2, { fill: ink }), circle(0, 0, 2.2, { fill: ink, opacity: u > 0.4 ? 1 : 0.3 }), circle(7, 0, 2.2, { fill: ink, opacity: u > 0.8 ? 1 : 0.3 })]); break;
    case 'flag': node = g([path(partial([[-6, 9], [-6, -9]]), { stroke: ink, sw, fill: 'none', linecap: 'round' }), path('M-6 -9 h13 l-3 4 l3 4 h-13 Z', { fill: fill ?? C.uiAccent, stroke: ink, sw: 1.6, opacity: u })]); break;
    case 'heart': node = pop(path('M0 7 C-9 1 -8 -6 -3 -6 C-1 -6 0 -4 0 -3 C0 -4 1 -6 3 -6 C8 -6 9 1 0 7 Z', { fill: fill ?? C.red, stroke: stroke ?? C.ink, sw: 1.6 })); break;
    case 'star': { const pts: string[] = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? 4 : 9; pts.push(`${r1(rr * Math.cos(a))} ${r1(rr * Math.sin(a))}`); } node = pop(path(`M${pts.join(' L')} Z`, { fill: fill ?? C.uiAccent, stroke: stroke ?? C.ink, sw: 1.4 })); break; }
    case 'coin': node = pop(g([circle(0, 0, 9, { fill: fill ?? C.gold, stroke: stroke ?? C.ink, sw: 1.6 }), circle(0, 0, 6, { fill: 'none', stroke: stroke ?? C.ink, sw: 1, opacity: 0.5 }), stroked('M-2 -4 h4 M0 -4 v8 M-2 4 h4', 1.6)])); break;
    case 'banknote': node = pop(g([rect(-11, -6, 22, 12, { rx: 1.5, fill: fill ?? C.green, stroke: stroke ?? C.ink, sw: 1.6 }), circle(0, 0, 3.2, { fill: 'none', stroke: stroke ?? C.ink, sw: 1.2 }), rect(-9, -4, 18, 8, { fill: 'none', stroke: stroke ?? C.ink, sw: 0.8, opacity: 0.5 })])); break;
    case 'clock': node = g([circle(0, 0, 9, { fill: fill ?? C.white, stroke: stroke ?? C.ink, sw: 1.8 }), stroked(`M0 0 v-6`, 2), stroked(`M0 0 l${r1(5 * Math.sin(u * Math.PI * 2))} ${r1(-5 * Math.cos(u * Math.PI * 2))}`, 1.6)]); break;
    case 'calendar': node = g([rect(-9, -7, 18, 16, { rx: 2, fill: fill ?? C.white, stroke: stroke ?? C.ink, sw: 1.6 }), rect(-9, -7, 18, 4, { fill: C.red, stroke: stroke ?? C.ink, sw: 1.2 }), stroked('M-5 -10 v4 M5 -10 v4', 1.8), ...(u > 0.5 ? [stroked('M-5 0 h3 M0 0 h3 M-5 4 h3 M0 4 h3', 1.4)] : [])]); break;
    case 'magnifier': node = g([circle(-2, -2, 6.5, { fill: 'rgba(255,255,255,0.6)', stroke: stroke ?? C.ink, sw: 2 }), stroked('M3 3 l6 6', 3)]); break;
    case 'scale': node = g([stroked('M0 -8 v16 M-8 8 h16 M-9 -5 h18', 2), stroked(`M-9 -5 l${r1(-3 + u * 0)} 7 h8 l-5 -7 M9 -5 l3 7 h-8 l5 -7`, 1.4)]); break;
    case 'house': node = pop(g([path('M-9 0 l9 -8 l9 8 v9 h-18 Z', { fill: fill ?? C.beige, stroke: stroke ?? C.ink, sw: 1.6 }), rect(-2.5, 3, 5, 6, { fill: C.brown, stroke: stroke ?? C.ink, sw: 1 })])); break;
    case 'key': node = g([circle(-5, 0, 4, { fill: fill ?? C.gold, stroke: stroke ?? C.ink, sw: 1.6 }), stroked('M-1 0 h10 M6 0 v3 M9 0 v3', 2)]); break;
    case 'document': node = g([path('M-7 -9 h10 l4 4 v14 h-14 Z', { fill: fill ?? C.white, stroke: stroke ?? C.ink, sw: 1.6 }), stroked('M-4 -1 h8 M-4 3 h8 M-4 7 h5', 1.2)]); break;
    case 'pen': node = g([path('M-7 7 l11 -11 l3 3 l-11 11 l-4 1 Z', { fill: fill ?? C.navy, stroke: stroke ?? C.ink, sw: 1.4 }), ...(u > 0.3 ? [stroked('M-9 10 h16', 1.4)] : [])]); break;
    case 'music': node = g([stroked('M-2 6 v-13 l9 -2 v12', 2.2), circle(-5, 6, 3, { fill: ink }), circle(4, 4, 3, { fill: ink })]); break;
    case 'thermometer': node = g([path('M-3 -9 a3 3 0 0 1 6 0 v11 a5 5 0 1 1 -6 0 Z', { fill: fill ?? C.white, stroke: stroke ?? C.ink, sw: 1.6 }), rect(-1.2, -2 - 8 * u + 2, 2.4, 6 + 8 * u, { fill: C.red }), circle(0, 6, 3, { fill: C.red })]); break;
    case 'droplet': node = pop(path('M0 -9 q7 9 7 13 a7 7 0 0 1 -14 0 q0 -4 7 -13 Z', { fill: fill ?? C.water2, stroke: stroke ?? C.ink, sw: 1.6 })); break;
    case 'flame': node = pop(g([path('M0 -10 q8 8 4 16 a6 6 0 0 1 -8 0 q-4 -8 4 -16 Z', { fill: fill ?? C.orange, stroke: stroke ?? C.ink, sw: 1.6 }), path('M0 -2 q3 4 1 7 a2 2 0 0 1 -2 0 q-2 -3 1 -7 Z', { fill: C.yellow })])); break;
    case 'snowflake': node = g([stroked('M0 -9 v18 M-8 -4.5 l16 9 M-8 4.5 l16 -9', 2), stroked('M-2 -6 l2 -2 l2 2 M-2 6 l2 2 l2 -2', 1.4)]); break;
    case 'sun': node = g([circle(0, 0, 5, { fill: fill ?? C.yellow, stroke: stroke ?? C.ink, sw: 1.4 }), ...[0, 45, 90, 135, 180, 225, 270, 315].map((a) => line([[Math.cos((a * Math.PI) / 180) * 7, Math.sin((a * Math.PI) / 180) * 7], [Math.cos((a * Math.PI) / 180) * 10 * u, Math.sin((a * Math.PI) / 180) * 10 * u]], { stroke: ink, sw: 1.8 }))]); break;
    case 'cloud': node = pop(path('M-8 4 q-5 0 -4 -5 q1 -4 5 -3 q2 -6 8 -4 q6 2 5 7 q4 0 3 5 Z', { fill: fill ?? C.white, stroke: stroke ?? C.ink, sw: 1.6 })); break;
    case 'leaf': node = pop(g([path('M-8 8 q-2 -14 16 -16 q2 14 -16 16 Z', { fill: fill ?? C.green, stroke: stroke ?? C.ink, sw: 1.6 }), stroked('M-7 7 q6 -8 13 -13', 1.2)])); break;
    case 'recycle': node = g([stroked(partial([[-7, 6], [0, -8], [7, 6], [-7, 6]]), 2.2), stroked('M-3 -2 l3 -1 l1 3', 1.4)]); break;
    case 'bin': node = g([path('M-7 -6 h14 l-1.5 15 h-11 Z', { fill: fill ?? C.grey, stroke: stroke ?? C.ink, sw: 1.6 }), rect(-8.5, -8.5, 17, 2.6, { rx: 1, fill: C.dark }), stroked('M-3 -2 v8 M3 -2 v8', 1.2)]); break;
    case 'phone': node = g([rect(-5, -9, 10, 18, { rx: 2, fill: fill ?? C.dark, stroke: stroke ?? C.ink, sw: 1.6 }), rect(-3.5, -7, 7, 12, { fill: C.sky }), circle(0, 7, 1, { fill: C.white })]); break;
    case 'plate': node = g([circle(0, 0, 9, { fill: fill ?? C.white, stroke: stroke ?? C.ink, sw: 1.6 }), circle(0, 0, 5.5, { fill: 'none', stroke: stroke ?? C.ink, sw: 1, opacity: 0.5 })]); break;
    case 'bed': node = g([rect(-10, -2, 20, 7, { rx: 1.5, fill: fill ?? C.sky, stroke: stroke ?? C.ink, sw: 1.6 }), rect(-8, -6, 7, 4, { rx: 1.5, fill: C.white, stroke: stroke ?? C.ink, sw: 1.2 }), stroked('M-10 5 v4 M10 5 v4', 2)]); break;
    case 'speech': node = pop(path('M-9 -7 h18 v11 h-10 l-4 4 v-4 h-4 Z', { fill: fill ?? C.white, stroke: stroke ?? C.ink, sw: 1.6 })); break;
    case 'lightning': node = pop(path('M2 -10 l-8 11 h6 l-2 9 l8 -11 h-6 Z', { fill: fill ?? C.yellow, stroke: stroke ?? C.ink, sw: 1.4 })); break;
    case 'lock': node = g([rect(-7, -2, 14, 11, { rx: 2, fill: fill ?? C.gold, stroke: stroke ?? C.ink, sw: 1.6 }), stroked(`M-4 -2 v-3 a4 4 0 0 1 8 0 v${r1(-3 + 4 * (1 - u))}`, 2), circle(0, 3, 1.6, { fill: C.ink })]); break;
    case 'shield': node = pop(path('M0 -10 l9 3 v6 q0 7 -9 11 q-9 -4 -9 -11 v-6 Z', { fill: fill ?? C.navy, stroke: stroke ?? C.ink, sw: 1.6 })); break;
    case 'swords': node = g([stroked('M-8 8 l14 -14 M8 8 l-14 -14', 2.4), stroked('M-5 7 l-3 -3 M5 7 l3 -3', 2.4), stroked('M-9 -6 l3 0 l0 -3 M9 -6 l-3 0 l0 -3', 1.4)]); break;
    case 'crown': node = pop(path('M-9 6 l-1 -12 l6 5 l4 -8 l4 8 l6 -5 l-1 12 Z', { fill: fill ?? C.gold, stroke: stroke ?? C.ink, sw: 1.6 })); break;
    case 'hand': node = pop(path('M-6 9 v-9 q0 -2 2 -2 q2 0 2 2 v-7 q0 -2 2 -2 q2 0 2 2 v6 q0 -2 2 -2 q2 0 2 2 v3 q0 -2 2 -2 q1.5 0 1.5 2 v6 q0 6 -7 6 h-3 q-4 0 -5.5 -5 Z', { fill: fill ?? C.skin, stroke: stroke ?? C.ink, sw: 1.4 })); break;
    case 'eye': node = g([path('M-10 0 q10 -10 20 0 q-10 10 -20 0 Z', { fill: fill ?? C.white, stroke: stroke ?? C.ink, sw: 1.6 }), circle(0, 0, 3.2 * u + 0.5, { fill: C.ink })]); break;
    case 'ear': node = pop(path('M-3 8 q-6 -4 -5 -12 q2 -6 8 -5 q6 2 4 9 q-1 3 -4 4 q-2 3 -3 4 Z', { fill: fill ?? C.skin, stroke: stroke ?? C.ink, sw: 1.4 })); break;
    case 'nose': node = pop(path('M1 -9 q-2 8 -5 12 q0 3 4 3 q4 0 4 -3', { fill: 'none', stroke: stroke ?? C.ink, sw: 1.8 })); break;
    case 'footprints': node = g([path('M-6 2 q-3 -8 1 -9 q4 0 3 8 q-1 3 -4 1 Z', { fill: fill ?? C.dark, opacity: 0.9 }), ...(u > 0.5 ? [path('M4 8 q-3 -8 1 -9 q4 0 3 8 q-1 3 -4 1 Z', { fill: fill ?? C.dark, opacity: 0.9 })] : [])]); break;
    case 'equals': node = stroked('M-8 -3 h16 M-8 3 h16', 3); break;
    case 'plus': node = stroked('M-8 0 h16 M0 -8 v16', 3); break;
    case 'minus': node = stroked('M-8 0 h16', 3); break;
    case 'no': node = g([circle(0, 0, 9, { fill: 'none', stroke: fill ?? C.red, sw: 2.6 }), stroked(partial([[-6, -6], [6, 6]]), 2.6)]); break;
    case 'hourglass': node = g([path('M-7 -9 h14 l-6 9 l6 9 h-14 l6 -9 Z', { fill: fill ?? C.white, stroke: stroke ?? C.ink, sw: 1.6 }), path(`M-5 ${r1(8)} h10 l-5 ${r1(-6 * u)} Z`, { fill: C.gold })]); break;
    case 'gift': node = pop(g([rect(-9, -3, 18, 12, { rx: 1.5, fill: fill ?? C.red, stroke: stroke ?? C.ink, sw: 1.6 }), stroked('M0 -3 v12 M-9 -3 h18', 1.6), stroked('M0 -3 q-6 -2 -5 -6 q4 -1 5 6 q1 -7 5 -6 q1 4 -5 6', 1.4)])); break;
    case 'cart': node = g([stroked('M-10 -7 h3 l3 11 h11 l2 -8 h-15', 2), circle(-2, 7, 1.8, { fill: ink }), circle(6, 7, 1.8, { fill: ink })]); break;
    case 'book': node = g([path('M-9 -8 h8 q1 0 1 2 v14 q0 -2 -1 -2 h-8 Z', { fill: fill ?? C.sky, stroke: stroke ?? C.ink, sw: 1.4 }), path('M9 -8 h-8 q-1 0 -1 2 v14 q0 -2 1 -2 h8 Z', { fill: fill ?? C.sky, stroke: stroke ?? C.ink, sw: 1.4 })]); break;
    case 'smile': node = g([circle(0, 0, 9, { fill: fill ?? C.yellow, stroke: stroke ?? C.ink, sw: 1.6 }), circle(-3, -2.5, 1.2, { fill: C.ink }), circle(3, -2.5, 1.2, { fill: C.ink }), stroked('M-4 2.5 q4 4 8 0', 1.6)]); break;
    case 'frown': node = g([circle(0, 0, 9, { fill: fill ?? C.yellow, stroke: stroke ?? C.ink, sw: 1.6 }), circle(-3, -2.5, 1.2, { fill: C.ink }), circle(3, -2.5, 1.2, { fill: C.ink }), stroked('M-4 5 q4 -4 8 0', 1.6)]); break;
    case 'bell': node = g([path('M-7 5 q0 -12 7 -12 q7 0 7 12 Z', { fill: fill ?? C.gold, stroke: stroke ?? C.ink, sw: 1.6 }), stroked('M-9 5 h18', 1.8), circle(0, 8, 2, { fill: C.ink })], { rotate: Math.sin(u * Math.PI * 4) * 12 }); break;
    case 'tshirt': node = pop(path('M-4 -9 q4 3 8 0 l6 3 l-2 5 l-3 -1 v11 h-14 v-11 l-3 1 l-2 -5 Z', { fill: fill ?? C.sky, stroke: stroke ?? C.ink, sw: 1.6 })); break;
    case 'trousers': node = pop(path('M-7 -9 h14 v18 h-5 l-2 -9 l-2 9 h-5 Z', { fill: fill ?? C.navy, stroke: stroke ?? C.ink, sw: 1.6 })); break;
    case 'shoe': node = pop(path('M-9 4 h4 l3 -6 l5 3 q6 0 6 3 v2 h-18 Z', { fill: fill ?? C.brown, stroke: stroke ?? C.ink, sw: 1.6 })); break;
    case 'hat': node = pop(g([path('M-8 2 q0 -10 8 -10 q8 0 8 10 Z', { fill: fill ?? C.red, stroke: stroke ?? C.ink, sw: 1.6 }), rect(-10, 2, 20, 3, { rx: 1.5, fill: fill ?? C.red, stroke: stroke ?? C.ink, sw: 1.4 })])); break;
    case 'cup': node = g([path('M-6 -6 h12 l-1.5 13 h-9 Z', { fill: fill ?? C.white, stroke: stroke ?? C.ink, sw: 1.6 }), stroked('M6 -3 q5 0 4 4 q-1 3 -5 2', 1.6), ...(u > 0.5 ? [stroked('M-2 -10 q-1 -2 0 -4 M2 -10 q-1 -2 0 -4', 1.2)] : [])]); break;
    case 'fork-knife': node = g([stroked('M-5 -9 v18 M-7 -9 v5 q0 3 2 3 q2 0 2 -3 v-5', 1.8), stroked('M5 -9 v18 M5 -9 q4 4 2 9 h-2', 1.8)]); break;
    case 'wave': node = stroked(partial([[-9, 0], [-6, -4], [-3, 0], [0, 4], [3, 0], [6, -4], [9, 0]]), 2.2); break;
    case 'bulb': node = g([circle(0, -2, 7, { fill: fill ?? C.yellow, stroke: stroke ?? C.ink, sw: 1.6, opacity: 0.4 + 0.6 * u }), rect(-3, 5, 6, 4, { rx: 1, fill: C.grey, stroke: stroke ?? C.ink, sw: 1.2 }), ...(u > 0.6 ? [stroked('M-10 -8 l2 2 M10 -8 l-2 2 M0 -12 v2', 1.4)] : [])]); break;
    case 'zzz': node = g([stroked('M-8 6 h5 l-5 5 h5', 1.8), stroked('M-1 -1 h5 l-5 5 h5', 2), ...(u > 0.5 ? [stroked('M5 -9 h5 l-5 5 h5', 2.2)] : [])]); break;
  }
  return g([node], { scale: s });
}
