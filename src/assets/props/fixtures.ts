/**
 * Fixtures and things that change by themselves (processes). Base point =
 * bottom centre on the floor or on a surface. Most states are 0..1 so they can
 * be tweened: `on`, `flow`, `burn`, `melt`, `grow`, `level`, `spin`, `open`,
 * `rust`, `flake`, `wet`, `drip` (+ `phase` for cycles).
 * Asset ids: `fixture.<shape>`.
 */
import { circle, ellipse, g, line, path, rect, type FrameNode, r1 } from '../../engine/frame';
import { palette as C, color } from '../palette';
import { type PropSpec, n, clamp01, mix, str } from '../propSpec';

const INK = C.ink;
export const FIXTURE_SHAPES = ['lamp', 'candle', 'tap', 'sink', 'shower', 'ice', 'fire', 'plant', 'flower', 'puddle', 'drip', 'washingmachine', 'oven', 'fridge', 'microwave', 'radiator', 'clothesline', 'hanger', 'ironingboard', 'chair', 'shelf', 'wall', 'bike', 'cart', 'tent', 'tree', 'bush', 'cloud', 'sun', 'clock', 'scale', 'mirror', 'toilet', 'cow', 'hen', 'nest'] as const;
export type FixtureShape = (typeof FIXTURE_SHAPES)[number];

function flame(x: number, y: number, size: number, ph: number, col = C.orange): FrameNode[] {
  const w = Math.sin(ph * 2 * Math.PI) * size * 0.15;
  return [path(`M${r1(x - size * 0.5)} ${r1(y)} q${r1(-size * 0.2 + w)} ${r1(-size * 1.1)} ${r1(size * 0.5)} ${r1(-size * 1.8)} q${r1(size * 0.7 + w)} ${r1(size * 0.7)} 0 ${r1(size * 1.8)} Z`, { fill: col, stroke: INK, sw: 1.2 }), path(`M${r1(x - size * 0.22)} ${r1(y)} q0 ${r1(-size * 0.7)} ${r1(size * 0.22 + w * 0.5)} ${r1(-size)} q${r1(size * 0.3)} ${r1(size * 0.4)} 0 ${r1(size)} Z`, { fill: C.yellow })];
}
function smoke(x: number, y: number, amount: number, ph: number): FrameNode[] {
  const out: FrameNode[] = []; if (amount < 0.05) return out;
  for (let i = 0; i < 3; i++) { const u = (ph * 0.5 + i * 0.33) % 1; out.push(circle(x + Math.sin(u * 5 + i) * 3, y - 4 - u * 20, 2 + u * 4, { fill: '#8a8f99', opacity: amount * 0.5 * (1 - u) })); }
  return out;
}
function drops(x: number, y0: number, len: number, flow: number, ph: number, col = C.water2): FrameNode[] {
  const out: FrameNode[] = []; if (flow < 0.05) return out;
  if (flow > 0.6) { out.push(rect(x - 1.2 * flow, y0, 2.4 * flow, len, { fill: col, opacity: 0.9 })); return out; }
  for (let i = 0; i < 3; i++) { const u = (ph * 0.9 + i * 0.33) % 1; if (u < flow * 1.6) out.push(ellipse(x, y0 + u * len, 1, 1.6, { fill: col })); }
  return out;
}

const F: Record<FixtureShape, PropSpec> = {
  lamp: {
    defaults: { on: 0 }, grip: [0, -52], mouth: [0, -56],
    draw: (s, col) => { const on = clamp01(n(s, 'on', 0));
      return g([on > 0.05 ? circle(0, -56, 22, { fill: C.yellow, opacity: 0.18 * on }) : g([]), line([[0, 0], [0, -46]], { stroke: INK, sw: 2.6 }), path('M-14 -2 h28 l-2 -4 h-24 Z', { fill: color(col ?? C.dark), stroke: INK, sw: 1.8 }), path('M-12 -46 h24 l6 -18 h-36 Z', { fill: mix(color(col ?? C.beige), C.yellow, on * 0.5), stroke: INK, sw: 2 }), on > 0.05 ? circle(0, -56, 3.5, { fill: C.yellow, opacity: on }) : g([])]); },
  },
  candle: {
    defaults: { lit: 0, length: 1, phase: 0 }, grip: [0, -8], mouth: [0, -20],
    draw: (s, col) => { const lit = clamp01(n(s, 'lit', 0)), L = 16 * clamp01(n(s, 'length', 1)) + 3;
      return g([rect(-3, -L, 6, L, { rx: 1, fill: color(col ?? C.white), stroke: INK, sw: 1.6 }), line([[0, -L], [0, -L - 3]], { stroke: INK, sw: 1 }), ...(lit > 0.05 ? flame(0, -L - 3, 4 * (0.6 + 0.4 * lit), n(s, 'phase', 0)) : []), ...smoke(0, -L - 6, lit < 0.05 && n(s, 'smoke', 0) > 0 ? n(s, 'smoke', 0) : 0, n(s, 'phase', 0))]); },
  },
  tap: {
    defaults: { flow: 0, phase: 0 }, grip: [0, -16], mouth: [8, -8],
    draw: (s) => { const flow = clamp01(n(s, 'flow', 0));
      return g([rect(-3, -18, 6, 18, { rx: 2, fill: C.silver, stroke: INK, sw: 1.8 }), path('M0 -16 q10 0 10 8 v2', { fill: 'none', stroke: INK, sw: 5 }), path('M0 -16 q10 0 10 8 v2', { fill: 'none', stroke: C.silver, sw: 3 }), rect(-5, -21, 10, 3, { rx: 1.5, fill: C.dark, stroke: INK, sw: 1.2 }), ...drops(10, -5, 22, flow, n(s, 'phase', 0))]); },
  },
  sink: {
    defaults: { fill: 0, flow: 0, phase: 0, foam: 0 }, grip: [0, -26], mouth: [0, -18],
    draw: (s) => { const f = clamp01(n(s, 'fill', 0)), flow = clamp01(n(s, 'flow', 0)), foam = clamp01(n(s, 'foam', 0));
      return g([rect(-22, -20, 44, 20, { rx: 2, fill: C.white, stroke: INK, sw: 2 }), path('M-16 -18 h32 l-2 10 h-28 Z', { fill: '#d9e3ea', stroke: INK, sw: 1.6 }), f > 0.05 ? path(`M${r1(-16 + (1 - f) * 1.5)} ${r1(-18 + (1 - f) * 8)} h${r1(32 - (1 - f) * 3)} l${r1(-f * 2)} ${r1(f * 10 - 1)} h${r1(-28 + (1 - f) * 2 + 1)} Z`, { fill: C.water }) : g([]), ...(foam > 0.1 ? [0, 1, 2, 3].map((i) => circle(-9 + i * 6, -18 + (1 - f) * 8 - 1, 2, { fill: C.white, stroke: INK, sw: 0.8, opacity: foam })) : []), rect(-2, -34, 4, 16, { rx: 1.5, fill: C.silver, stroke: INK, sw: 1.4 }), path('M0 -33 q8 0 8 6 v2', { fill: 'none', stroke: INK, sw: 4 }), path('M0 -33 q8 0 8 6 v2', { fill: 'none', stroke: C.silver, sw: 2.4 }), ...drops(8, -24, 8 + (1 - f) * 6, flow, n(s, 'phase', 0))]); },
  },
  shower: {
    defaults: { flow: 0, phase: 0 }, grip: [0, -70], mouth: [0, -40],
    draw: (s) => { const flow = clamp01(n(s, 'flow', 0)), ph = n(s, 'phase', 0); const jets: FrameNode[] = [];
      if (flow > 0.05) for (let i = -2; i <= 2; i++) for (let k = 0; k < 3; k++) { const u = (ph * 1.3 + k * 0.33 + i * 0.1) % 1; jets.push(line([[i * 3 + u * i * 2, -72 + u * 64], [i * 3 + u * i * 2, -72 + u * 64 + 4]], { stroke: C.water2, sw: 1.4, opacity: flow * (0.9 - u * 0.4) })); }
      return g([line([[0, -78], [0, -90]], { stroke: INK, sw: 3 }), line([[0, -90], [-12, -90]], { stroke: INK, sw: 3 }), path('M-9 -76 h18 l-3 4 h-12 Z', { fill: C.silver, stroke: INK, sw: 1.6 }), ...jets, ellipse(0, 0, 18, 3, { fill: '#d9e3ea', stroke: INK, sw: 1.4 })]); },
  },
  ice: {
    defaults: { melt: 0 }, grip: [0, -6], mouth: [0, -12],
    draw: (s) => { const m = clamp01(n(s, 'melt', 0)); const h = 12 * (1 - m * 0.95), w = 12 * (1 - m * 0.6);
      return g([m > 0.08 ? ellipse(0, 0, 5 + 10 * m, 1.4 + 1.2 * m, { fill: C.water, stroke: INK, sw: 1.2, opacity: 0.9 }) : g([]), h > 1 ? rect(-w / 2, -h, w, h, { rx: 2, fill: 'rgba(200,235,250,0.85)', stroke: INK, sw: 1.6 }) : g([]), h > 3 ? line([[-w / 2 + 2, -h + 3], [-w / 2 + 2, -3]], { stroke: C.white, sw: 1.4 }) : g([])]); },
  },
  fire: {
    defaults: { burn: 1, phase: 0, smoke: 0 }, grip: [0, -10], mouth: [0, -14],
    draw: (s) => { const b = clamp01(n(s, 'burn', 1)), ph = n(s, 'phase', 0);
      return g([line([[-10, -2], [10, -4]], { stroke: C.brown, sw: 3.5 }), line([[-9, -5], [9, -1]], { stroke: C.brown, sw: 3.5 }), ...(b > 0.05 ? [...flame(-4, -4, 7 * b, ph), ...flame(4, -4, 9 * b, ph + 0.3), ...flame(0, -4, 6 * b, ph + 0.6)] : []), ...smoke(0, -6, n(s, 'smoke', b < 0.3 ? 1 - b : 0), ph)]); },
  },
  plant: {
    defaults: { grow: 1, wilt: 0, phase: 0 }, grip: [0, -10], mouth: [0, -14],
    draw: (s, col) => { const gr = clamp01(n(s, 'grow', 1)), wilt = clamp01(n(s, 'wilt', 0)); const H = 4 + 22 * gr; const green = mix(color(col ?? C.green), '#a08a4a', wilt);
      const leaf = (y: number, dir: number, sz: number) => path(`M0 ${r1(-y)} q${r1(dir * sz)} ${r1(-sz * 0.4 + wilt * sz * 0.8)} ${r1(dir * sz * 1.6)} ${r1(wilt * sz * 1.2)} q${r1(-dir * sz * 0.6)} ${r1(-sz * 0.2 - wilt * sz * 0.3)} ${r1(-dir * sz * 1.6)} ${r1(-wilt * sz * 1.2)} Z`, { fill: green, stroke: INK, sw: 1.2 });
      return g([path('M-9 -8 h18 l-2 8 h-14 Z', { fill: C.tan, stroke: INK, sw: 1.8 }), path(`M0 -8 q${r1(wilt * 6)} ${r1(-H / 2)} ${r1(wilt * 10)} ${r1(-H + wilt * 10)}`, { fill: 'none', stroke: green, sw: 2.2 }), ...(gr > 0.25 ? [leaf(8 + H * 0.3, -1, 4 + 3 * gr), leaf(8 + H * 0.55, 1, 4 + 3 * gr)] : []), ...(gr > 0.6 ? [leaf(8 + H * 0.8, -1, 3 + 2 * gr)] : [])]); },
  },
  flower: {
    defaults: { bloom: 1, wilt: 0 }, grip: [0, -14], mouth: [0, -24],
    draw: (s, col) => { const bl = clamp01(n(s, 'bloom', 1)), wilt = clamp01(n(s, 'wilt', 0)); const c = color(col ?? C.pink); const petals: FrameNode[] = [];
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; petals.push(ellipse(Math.cos(a) * 3.5 * bl, -24 + Math.sin(a) * 3.5 * bl + wilt * 6, 2.6 * bl + 0.4, 1.8 * bl + 0.3, { fill: mix(c, '#a08a4a', wilt), stroke: INK, sw: 1 })); }
      return g([path(`M0 0 q${r1(wilt * 4)} -12 ${r1(wilt * 8)} -22`, { fill: 'none', stroke: C.green, sw: 2 }), path('M0 -10 q-6 -2 -7 -7 q6 1 7 7 Z', { fill: C.green, stroke: INK, sw: 1 }), ...petals, circle(wilt * 8, -24 + wilt * 6, 2.2 * bl + 0.3, { fill: C.yellow, stroke: INK, sw: 1 })]); },
  },
  puddle: {
    defaults: { size: 1 }, grip: [0, -2], mouth: [0, -1],
    draw: (s, col) => { const sz = clamp01(n(s, 'size', 1)); if (sz < 0.03) return g([]); return g([ellipse(0, 0, 4 + 16 * sz, 1.2 + 2.2 * sz, { fill: color(col ?? C.water), stroke: INK, sw: 1.2, opacity: 0.9 }), ellipse(-3 * sz, -0.6, 3 * sz, 0.6, { fill: 'rgba(255,255,255,0.6)' })]); },
  },
  drip: {
    defaults: { flow: 0.3, length: 30, phase: 0 }, grip: [0, 0], mouth: [0, 0],
    draw: (s) => g(drops(0, 0, n(s, 'length', 30), clamp01(n(s, 'flow', 0.3)), n(s, 'phase', 0))),
  },
  washingmachine: {
    defaults: { spin: 0, open: 0, phase: 0, full: 0.6 }, grip: [0, -20], mouth: [0, -20],
    draw: (s) => { const spin = clamp01(n(s, 'spin', 0)), open = clamp01(n(s, 'open', 0)), ph = n(s, 'phase', 0), full = clamp01(n(s, 'full', 0.6));
      const ang = ph * 360 * spin;
      return g([rect(-20, -40, 40, 40, { rx: 3, fill: C.white, stroke: INK, sw: 2.2 }), rect(-18, -38, 36, 7, { rx: 1, fill: C.grey2, stroke: INK, sw: 1.2 }), circle(12, -34.5, 1.8, { fill: C.dark }), circle(0, -17, 13, { fill: C.dark, stroke: INK, sw: 2 }), g([full > 0.1 ? path('M-8 -12 q4 -10 10 -4 q4 4 -2 7 q-6 2 -8 -3 Z', { fill: C.sky, stroke: INK, sw: 1.2 }) : g([]), full > 0.3 ? path('M-2 -20 q6 -4 8 2 q-3 4 -8 0 Z', { fill: C.red, stroke: INK, sw: 1.2 }) : g([])], { rotate: ang, px: 0, py: -17 }), g([circle(0, -17, 13, { fill: 'rgba(200,230,245,0.35)', stroke: INK, sw: 2.4 })], { rotate: -100 * open, px: -13, py: -17 }), ...(spin > 0.3 ? [path('M-16 -30 q-3 2 -2 5 M16 -30 q3 2 2 5', { fill: 'none', stroke: INK, sw: 1.2, opacity: spin * 0.6 })] : [])]); },
  },
  oven: {
    defaults: { on: 0, open: 0 }, grip: [0, -20], mouth: [0, -20],
    draw: (s) => { const on = clamp01(n(s, 'on', 0)), open = clamp01(n(s, 'open', 0));
      return g([rect(-22, -38, 44, 38, { rx: 2, fill: '#eef0f2', stroke: INK, sw: 2.2 }), g([rect(-16, -28, 32, 20, { rx: 2, fill: mix(C.dark, C.orange, on * 0.5), stroke: INK, sw: 1.6 }), rect(-13, -25, 26, 14, { rx: 1, fill: mix('#4a4f5c', '#ffb36b', on * 0.7) }), line([[-14, -31], [14, -31]], { stroke: INK, sw: 2.4, linecap: 'round' })], { scaleY: 1 - open * 0.75, py: -8 }), circle(-17, -34, 1.8, { fill: C.dark }), circle(17, -34, 1.8, { fill: on > 0.5 ? C.red : C.dark })]); },
  },
  fridge: {
    defaults: { open: 0 }, grip: [0, -40], mouth: [10, -36],
    draw: (s) => { const open = clamp01(n(s, 'open', 0));
      return g([rect(-16, -70, 32, 70, { rx: 3, fill: '#eef0f2', stroke: INK, sw: 2.2 }), ...(open > 0.3 ? [rect(-14, -46, 28, 44, { fill: '#dfe8ee' }), line([[-14, -30], [14, -30]], { stroke: INK, sw: 1 }), line([[-14, -16], [14, -16]], { stroke: INK, sw: 1 }), rect(-8, -36, 6, 6, { fill: C.white, stroke: INK, sw: 1 }), circle(4, -19, 3, { fill: C.red, stroke: INK, sw: 1 })] : []), g([rect(-16, -48, 32, 48, { rx: 2, fill: '#eef0f2', stroke: INK, sw: 2.2 }), line([[12, -40], [12, -28]], { stroke: INK, sw: 2.6 })], { scaleX: 1 - open * 0.85, px: -16 }), line([[-16, -48], [16, -48]], { stroke: INK, sw: 1.6 }), line([[12, -62], [12, -54]], { stroke: INK, sw: 2.6 })]); },
  },
  microwave: {
    defaults: { on: 0, phase: 0 }, grip: [0, -10], mouth: [0, -10],
    draw: (s) => { const on = clamp01(n(s, 'on', 0)); return g([rect(-18, -20, 36, 20, { rx: 2, fill: C.grey2, stroke: INK, sw: 2 }), rect(-15, -17, 22, 14, { rx: 1, fill: mix(C.dark, C.yellow, on * 0.5), stroke: INK, sw: 1.4 }), circle(12, -13, 2, { fill: C.dark }), rect(10, -8, 4, 3, { fill: on > 0.5 ? C.green : C.dark }), ...(on > 0.5 ? [circle(-4, -10, 3, { fill: C.orange, stroke: INK, sw: 1 })] : [])]); },
  },
  radiator: { defaults: { on: 0 }, grip: [0, -10], mouth: [0, -20], draw: (s) => { const on = clamp01(n(s, 'on', 0)); const ribs: FrameNode[] = []; for (let x = -14; x <= 14; x += 7) ribs.push(rect(x - 2.5, -18, 5, 16, { rx: 1.5, fill: mix(C.white, '#f4b6a0', on), stroke: INK, sw: 1.4 })); return g([...ribs, line([[-16, -14], [16, -14]], { stroke: INK, sw: 1 }), line([[-16, -6], [16, -6]], { stroke: INK, sw: 1 })]); } },
  clothesline: {
    defaults: { items: 0 }, grip: [0, -60], mouth: [0, -58],
    draw: (s) => { const items = clamp01(n(s, 'items', 0)); const k = Math.round(items * 3);
      return g([line([[-40, 0], [-40, -62]], { stroke: INK, sw: 2.6 }), line([[40, 0], [40, -62]], { stroke: INK, sw: 2.6 }), path('M-40 -60 q40 6 80 0', { fill: 'none', stroke: INK, sw: 1.6 }), ...[-20, 0, 20].slice(0, k).map((x, i) => g([rect(-6, 0, 12, 14, { rx: 1, fill: [C.sky, C.red, C.yellow][i]!, stroke: INK, sw: 1.4 }), rect(-7, -1, 2, 3, { fill: C.tan }), rect(5, -1, 2, 3, { fill: C.tan })], { x, y: -58 + Math.abs(x) * -0.05 + 3 }))]); },
  },
  hanger: { defaults: {}, grip: [0, -12], mouth: [0, -8], draw: (s) => g([path('M0 -12 q3 0 3 -3 q0 -3 -3 -3', { fill: 'none', stroke: INK, sw: 1.4 }), path('M0 -12 l-10 8 h20 Z', { fill: 'none', stroke: color(str(s, 'col', C.tan)), sw: 2.4 }), path('M0 -12 l-10 8 h20 Z', { fill: 'none', stroke: INK, sw: 1 })]) },
  ironingboard: { defaults: {}, grip: [0, -26], mouth: [0, -26], draw: () => g([line([[-14, 0], [10, -24]], { stroke: INK, sw: 2.4 }), line([[14, 0], [-10, -24]], { stroke: INK, sw: 2.4 }), path('M-22 -26 h40 q6 0 6 2 q0 2 -6 2 h-40 Z', { fill: C.sky, stroke: INK, sw: 1.8 })]) },
  chair: { defaults: {}, grip: [0, -20], mouth: [0, -20], seat: { x: 0, y: -20, reclineDeg: 4 }, draw: (_s, col) => g([rect(-10, -22, 20, 3, { rx: 1, fill: color(col ?? C.tan), stroke: INK, sw: 1.8 }), rect(-10, -40, 3, 18, { fill: color(col ?? C.tan), stroke: INK, sw: 1.6 }), rect(-10, -40, 20, 3, { rx: 1, fill: color(col ?? C.tan), stroke: INK, sw: 1.6 }), line([[-8, -19], [-8, 0]], { stroke: C.brown, sw: 2.6 }), line([[8, -19], [8, 0]], { stroke: C.brown, sw: 2.6 })]) },
  shelf: { defaults: { items: 1 }, grip: [0, -40], mouth: [0, -42], draw: (s) => { const it = clamp01(n(s, 'items', 1)); return g([rect(-20, -42, 40, 3, { fill: C.tan, stroke: INK, sw: 1.6 }), rect(-20, -26, 40, 3, { fill: C.tan, stroke: INK, sw: 1.6 }), ...(it > 0.2 ? [rect(-14, -41 - 10, 5, 10, { fill: C.red, stroke: INK, sw: 1 }), rect(-8, -41 - 12, 5, 12, { fill: C.sky, stroke: INK, sw: 1 })] : []), ...(it > 0.6 ? [rect(-2, -41 - 9, 5, 9, { fill: C.green, stroke: INK, sw: 1 }), rect(6, -25 - 8, 8, 8, { fill: C.yellow, stroke: INK, sw: 1 })] : [])]); } },
  wall: {
    defaults: { paint: 0, paper: 0, flake: 0, col: '#8cc7e8' }, grip: [0, -30], mouth: [0, -30],
    draw: (s) => { const paint = clamp01(n(s, 'paint', 0)), paper = clamp01(n(s, 'paper', 0)), flake = clamp01(n(s, 'flake', 0)); const c = color(str(s, 'col', '#8cc7e8'));
      const flakes: FrameNode[] = []; if (flake > 0.05) for (let i = 0; i < 6; i++) { const on = clamp01(flake * 6 - i); if (on <= 0) continue; const x = -16 + (i * 7) % 36, y = -50 + ((i * 13) % 40);
        flakes.push(path(`M${r1(x)} ${r1(y)} l5 -4 l4 6 l-6 3 Z`, { fill: '#f1ebe0', stroke: INK, sw: 0.8, opacity: 0.9 })); // bare patch
        flakes.push(g([path('M0 0 l5 -4 l4 6 l-6 3 Z', { fill: c, stroke: INK, sw: 0.8 })], { x: x + 2 * on, y: y + on * (-4 - y), rotate: 40 * on })); } // the chip falls to the foot of the wall
      const dots: FrameNode[] = []; if (paper > 0.05) for (let y = -54; y < -4; y += 10) for (let x = -16; x < 20; x += 10) if (y > -60 + 56 * (1 - paper)) dots.push(circle(x, y, 1.6, { fill: C.pink, opacity: 0.8 }));
      return g([rect(-24, -60, 48, 60, { fill: '#f1ebe0', stroke: INK, sw: 1.8 }), paint > 0.02 ? rect(-24, -60, 48 * paint, 60, { fill: c, opacity: 0.95 }) : g([]), paper > 0.02 ? rect(-24, -60 + 60 * (1 - paper), 48, 60 * paper, { fill: '#fdf6e8', opacity: 0.95 }) : g([]), ...dots, ...flakes]); },
  },
  bike: { defaults: {}, grip: [0, -30], mouth: [0, -30], draw: (_s, col) => g([circle(-14, -8, 8, { fill: 'none', stroke: INK, sw: 2.2 }), circle(14, -8, 8, { fill: 'none', stroke: INK, sw: 2.2 }), path('M-14 -8 l8 -14 h12 l8 14 M-6 -22 l8 14 l-8 0 M6 -22 l-2 -4 M-6 -22 l-3 -3', { fill: 'none', stroke: color(col ?? C.red), sw: 2.4 }), path('M-11 -26 h6', { stroke: INK, sw: 2.4 })]) },
  cart: { defaults: { full: 0 }, grip: [-14, -22], mouth: [0, -20], draw: (s, col) => { const full = clamp01(n(s, 'full', 0)); return g([path('M-16 -20 h32 l-3 14 h-26 Z', { fill: color(col ?? C.grey), stroke: INK, sw: 2 }), line([[-16, -20], [-24, -26]], { stroke: INK, sw: 2.4 }), circle(-8, -3, 3, { fill: C.dark, stroke: INK, sw: 1.2 }), circle(10, -3, 3, { fill: C.dark, stroke: INK, sw: 1.2 }), ...(full > 0.2 ? [rect(-10, -30, 9, 10, { fill: C.tan, stroke: INK, sw: 1.2 }), rect(1, -28, 9, 8, { fill: C.sky, stroke: INK, sw: 1.2 })] : [])]); } },
  tent: { defaults: {}, grip: [0, -16], mouth: [0, -16], draw: (_s, col) => g([path('M-18 0 l18 -26 l18 26 Z', { fill: color(col ?? C.beige), stroke: INK, sw: 2 }), path('M-6 0 l6 -12 l6 12 Z', { fill: C.dark, stroke: INK, sw: 1.4 })]) },
  tree: { defaults: { leaves: 1 }, grip: [0, -30], mouth: [0, -40], draw: (s) => { const lv = clamp01(n(s, 'leaves', 1)); return g([rect(-3, -22, 6, 22, { fill: C.brown, stroke: INK, sw: 1.6 }), path('M-16 -22 q4 -26 16 -30 q12 4 16 30 Z', { fill: mix('#c9b89a', '#8fd08a', lv), stroke: INK, sw: 1.8 })]); } },
  bush: { defaults: {}, grip: [0, -8], mouth: [0, -12], draw: () => g([path('M-14 0 q-4 -14 6 -16 q4 -8 12 -2 q10 2 8 18 Z', { fill: '#8fd08a', stroke: INK, sw: 1.6 })]) },
  cloud: { defaults: { rain: 0, dark: 0, phase: 0 }, grip: [0, -8], mouth: [0, 0], draw: (s) => { const rain = clamp01(n(s, 'rain', 0)), dark = clamp01(n(s, 'dark', 0)), ph = n(s, 'phase', 0); const dr: FrameNode[] = []; if (rain > 0.05) for (let i = -2; i <= 2; i++) { const u = (ph + i * 0.2 + 1) % 1; dr.push(line([[i * 6, 2 + u * 18], [i * 6 - 1, 5 + u * 18]], { stroke: C.water2, sw: 1.6, opacity: rain })); } return g([path('M-16 0 q-6 -10 4 -10 q2 -8 12 -6 q10 -2 10 8 q6 0 4 8 Z', { fill: mix(C.white, '#7f8793', dark), stroke: INK, sw: 1.8 }), ...dr]); } },
  sun: { defaults: { phase: 0 }, grip: [0, 0], mouth: [0, 0], draw: () => g([circle(0, 0, 7, { fill: C.yellow, stroke: INK, sw: 1.4 }), ...[0, 45, 90, 135, 180, 225, 270, 315].map((a) => line([[Math.cos((a * Math.PI) / 180) * 10, Math.sin((a * Math.PI) / 180) * 10], [Math.cos((a * Math.PI) / 180) * 13, Math.sin((a * Math.PI) / 180) * 13]], { stroke: C.yellow, sw: 2 }))]) },
  clock: { defaults: { hour: 3, minute: 0 }, grip: [0, -12], mouth: [0, -12], draw: (s) => { const h = n(s, 'hour', 3), m = n(s, 'minute', 0); const ah = ((h % 12) / 12 + m / 720) * 2 * Math.PI, am = (m / 60) * 2 * Math.PI; return g([circle(0, -12, 11, { fill: C.white, stroke: INK, sw: 2 }), ...[0, 1, 2, 3].map((i) => circle(Math.sin((i * Math.PI) / 2) * 8.5, -12 - Math.cos((i * Math.PI) / 2) * 8.5, 0.9, { fill: INK })), line([[0, -12], [Math.sin(ah) * 5, -12 - Math.cos(ah) * 5]], { stroke: INK, sw: 2 }), line([[0, -12], [Math.sin(am) * 8, -12 - Math.cos(am) * 8]], { stroke: INK, sw: 1.4 })]); } },
  scale: { defaults: { weight: 0 }, grip: [0, -8], mouth: [0, -8], draw: (s) => { const w = clamp01(n(s, 'weight', 0)); return g([rect(-14, -6, 28, 6, { rx: 2, fill: C.white, stroke: INK, sw: 1.8 }), rect(-16, -9, 32, 3, { rx: 1, fill: C.silver, stroke: INK, sw: 1.4 }), path('M-6 -3 a6 6 0 0 1 12 0', { fill: C.white, stroke: INK, sw: 1.2 }), line([[0, -3], [Math.sin(-1.2 + 2.4 * w) * 4.5, -3 - Math.cos(-1.2 + 2.4 * w) * 4.5]], { stroke: C.red, sw: 1.2 })]); } },
  mirror: { defaults: {}, grip: [0, -30], mouth: [0, -30], draw: () => g([rect(-12, -52, 24, 40, { rx: 10, fill: '#dfeaf2', stroke: INK, sw: 2 }), line([[-6, -46], [-8, -36]], { stroke: C.white, sw: 2 }), rect(-3, -12, 6, 12, { fill: C.tan, stroke: INK, sw: 1.4 })]) },
  toilet: { defaults: { flush: 0, phase: 0 }, grip: [0, -20], mouth: [0, -16], draw: (s) => { const fl = clamp01(n(s, 'flush', 0)), ph = n(s, 'phase', 0); return g([rect(-6, -40, 14, 22, { rx: 2, fill: C.white, stroke: INK, sw: 1.8 }), path('M-14 -18 h26 q2 10 -8 16 h-10 q-10 -6 -8 -16 Z', { fill: C.white, stroke: INK, sw: 1.8 }), ellipse(-1, -17, 10, 3, { fill: mix('#d9e3ea', C.water2, fl), stroke: INK, sw: 1.2 }), ...(fl > 0.3 ? [path(`M-7 -17 q${r1(Math.sin(ph * 6) * 3)} -2 6 0 q4 2 7 0`, { fill: 'none', stroke: C.white, sw: 1 })] : []), rect(3, -43, 3, 3, { fill: C.silver, stroke: INK, sw: 1 })]); } },
  cow: { defaults: { milk: 0 }, grip: [0, -20], mouth: [10, -14], draw: (s) => g([ellipse(0, -18, 16, 10, { fill: C.white, stroke: INK, sw: 2 }), ellipse(-4, -20, 5, 3.5, { fill: C.dark }), ellipse(7, -14, 4, 3, { fill: C.dark }), circle(16, -24, 6, { fill: C.white, stroke: INK, sw: 1.8 }), circle(18, -25, 1, { fill: INK }), path('M14 -29 l-2 -4 M19 -29 l2 -4', { stroke: INK, sw: 1.4 }), ellipse(4, -8, 5, 3, { fill: C.pink, stroke: INK, sw: 1.2 }), ...[-10, -4, 4, 10].map((x) => rect(x - 1.5, -10, 3, 10, { fill: C.white, stroke: INK, sw: 1.2 })), ...(n(s, 'milk', 0) > 0.1 ? [line([[4, -5], [4, 2]], { stroke: C.white, sw: 1.6 })] : [])]) },
  hen: { defaults: {}, grip: [0, -8], mouth: [0, -10], draw: () => g([ellipse(0, -7, 8, 6, { fill: C.beige, stroke: INK, sw: 1.8 }), circle(7, -13, 3.5, { fill: C.beige, stroke: INK, sw: 1.6 }), path('M10 -13 l3 1 l-3 1 Z', { fill: C.orange, stroke: INK, sw: 1 }), path('M6 -17 q1 -3 3 -1 q1 -2 2 0', { fill: C.red, stroke: INK, sw: 1 }), circle(8, -14, 0.8, { fill: INK }), line([[-2, -1], [-2, 1]], { stroke: C.orange, sw: 1.6 }), line([[2, -1], [2, 1]], { stroke: C.orange, sw: 1.6 })]) },
  nest: { defaults: { eggs: 1 }, grip: [0, -4], mouth: [0, -6], draw: (s) => { const e = Math.round(clamp01(n(s, 'eggs', 1)) * 3); return g([path('M-12 -4 q0 6 12 6 q12 0 12 -6 Z', { fill: C.tan, stroke: INK, sw: 1.6 }), ...[-5, 0, 5].slice(0, e).map((x) => ellipse(x, -5, 2.6, 3.2, { fill: C.white, stroke: INK, sw: 1.2 }))]); } },
};

export const FIXTURES: Record<string, PropSpec> = Object.fromEntries(Object.entries(F).map(([k, v]) => [`fixture.${k}`, v]));
