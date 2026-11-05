/** Small UI icons with a draw-on `progress` (0..1) for feedback animations. Centered at the origin. */
import { g, path, circle, type FrameNode, r1 } from '../engine/frame';
import { palette as C } from './palette';

export type IconName = 'check' | 'cross' | 'star' | 'arrow-right' | 'arrow-up' | 'arrow-down' | 'arc-arrow' | 'flag' | 'heart' | 'exclaim';
export function drawIcon(name: IconName, size: number, progress = 1, fill?: string, stroke?: string): FrameNode {
  const s = size / 24, u = Math.max(0, Math.min(1, progress));
  const sw = 3;
  const ink = stroke ?? fill ?? C.uiSuccess;
  const partial = (pts: [number, number][]): string => {
    // polyline cut at fraction u of its length
    let total = 0; const segs: number[] = [];
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]); segs.push(d); total += d; }
    let left = total * u; const out = [`M${r1(pts[0]![0])} ${r1(pts[0]![1])}`];
    for (let i = 1; i < pts.length; i++) { const d = segs[i - 1]!; if (left <= 0) break; const k = Math.min(1, left / d); out.push(`L${r1(pts[i - 1]![0] + (pts[i]![0] - pts[i - 1]![0]) * k)} ${r1(pts[i - 1]![1] + (pts[i]![1] - pts[i - 1]![1]) * k)}`); left -= d; }
    return out.join(' ');
  };
  let node: FrameNode;
  switch (name) {
    case 'check': node = path(partial([[-8, 0], [-2.5, 5.5], [8, -6]]), { stroke: ink, sw, fill: 'none', linecap: 'round' }); break;
    case 'cross': node = g([path(partial([[-7, -7], [7, 7]]), { stroke: ink, sw, fill: 'none', linecap: 'round' }), path(partial([[7, -7], [-7, 7]]), { stroke: ink, sw, fill: 'none', linecap: 'round' })]); break;
    case 'arrow-right': node = path(partial([[-8, 0], [8, 0], [2, -6], [8, 0], [2, 6]]), { stroke: ink, sw, fill: 'none', linecap: 'round' }); break;
    case 'arrow-up': node = path(partial([[0, 8], [0, -8], [-6, -2], [0, -8], [6, -2]]), { stroke: ink, sw, fill: 'none', linecap: 'round' }); break;
    case 'arrow-down': node = path(partial([[0, -8], [0, 8], [-6, 2], [0, 8], [6, 2]]), { stroke: ink, sw, fill: 'none', linecap: 'round' }); break;
    case 'arc-arrow': { // "goes over and behind": an arc from the lower left up and over to the right, with a head at the end
      const pts: [number, number][] = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * (1 - i / 16); pts.push([Math.cos(a) * 10, -Math.sin(a) * 10 + 2]); }
      const end = pts[pts.length - 1]!, prev = pts[pts.length - 3]!; const ang = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
      const h1: [number, number] = [end[0] - 5 * Math.cos(ang - 0.6), end[1] - 5 * Math.sin(ang - 0.6)], h2: [number, number] = [end[0] - 5 * Math.cos(ang + 0.6), end[1] - 5 * Math.sin(ang + 0.6)];
      node = g([path(partial(pts), { stroke: ink, sw: 2, fill: 'none', linecap: 'round' }), ...(u >= 0.98 ? [path(`M${r1(h1[0])} ${r1(h1[1])} L${r1(end[0])} ${r1(end[1])} L${r1(h2[0])} ${r1(h2[1])}`, { stroke: ink, sw: 2, fill: 'none', linecap: 'round' })] : [])]);
      break; }
    case 'exclaim': node = g([path(partial([[0, -9], [0, 3]]), { stroke: ink, sw: sw + 1, fill: 'none', linecap: 'round' }), circle(0, 8, 2.2 * u, { fill: ink })]); break;
    case 'flag': node = g([path(partial([[-6, 9], [-6, -9]]), { stroke: ink, sw, fill: 'none', linecap: 'round' }), path('M-6 -9 h13 l-3 4 l3 4 h-13 Z', { fill: fill ?? C.uiAccent, stroke: ink, sw: 1.6, opacity: u })]); break;
    case 'heart': node = g([path('M0 7 C-9 1 -8 -6 -3 -6 C-1 -6 0 -4 0 -3 C0 -4 1 -6 3 -6 C8 -6 9 1 0 7 Z', { fill: fill ?? C.red, stroke: stroke ?? C.ink, sw: 1.6 })], { scale: 0.6 + 0.4 * u }); break;
    case 'star': { const pts: string[] = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? 4 : 9; pts.push(`${r1(rr * Math.cos(a))} ${r1(rr * Math.sin(a))}`); } node = g([path(`M${pts.join(' L')} Z`, { fill: fill ?? C.uiAccent, stroke: stroke ?? C.ink, sw: 1.4 })], { scale: 0.5 + 0.5 * u }); break; }
  }
  return g([node], { scale: s });
}
