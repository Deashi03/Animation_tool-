/**
 * Props with state. Each prop is a draw function of its state (numbers 0..1,
 * booleans, strings) and exposes anchors (where a hand grips, where content
 * sits). Local space: the prop's `at` is its ground/base point.
 */
import { circle, ellipse, g, line, path, rect, text, type FrameNode, r1 } from '../engine/frame';
import { palette as C, color } from './palette';

export type PropState = Record<string, number | string | boolean>;
/** How far (degrees) a held prop rotates forward around its grip when `tilt` = 1. */
export const HELD_TILT_DEG = 55;
export type PropSpec = {
  draw: (s: PropState, col?: string) => FrameNode;
  /** grip point in local space (for attach) */
  grip: [number, number];
  /** where poured liquid lands / content top, local */
  mouth?: [number, number];
  /** default state */
  defaults: PropState;
  /** rotation pivot in local space (default: the base point) */
  pivot?: (s: PropState) => [number, number];
  /** seat/lying anchor for actors (local), and body rotation when lying */
  seat?: { x: number; y: number; reclineDeg?: number };
};
const n = (s: PropState, k: string, d: number) => (typeof s[k] === 'number' ? (s[k] as number) : d);
const b = (s: PropState, k: string, d: boolean) => (typeof s[k] === 'boolean' ? (s[k] as boolean) : d);
const INK = C.ink;

export const PROPS: Record<string, PropSpec> = {
  glass: {
    defaults: { fill: 0 }, grip: [0, -10], mouth: [0, -22],
    draw: (s) => { const f = Math.max(0, Math.min(1, n(s, 'fill', 0))); const h = 22, w = 16; const lvl = -h * f * 0.9;
      return g([
        f > 0 ? path(`M${-w / 2 + 1.5} ${lvl} h${w - 3} v${-lvl - 1.5} q0 1.5 -1.5 1.5 h${-(w - 6)} q-1.5 0 -1.5 -1.5 Z`, { fill: C.water }) : g([]),
        path(`M${-w / 2} ${-h} h${w} v${h - 2} q0 2 -2 2 h${-(w - 4)} q-2 0 -2 -2 Z`, { fill: 'rgba(255,255,255,0.45)', stroke: INK, sw: 2 }),
        line([[-w / 2 + 3, -h + 4], [-w / 2 + 3, -6]], { stroke: 'rgba(255,255,255,0.8)', sw: 1.4 }),
      ]); },
  },
  jug: {
    defaults: { tilt: 0, stream: 0, level: 1 }, grip: [-10, -12], mouth: [12, -22],
    draw: (s, col) => { const c = color(col ?? C.yellow); const lvl = Math.max(0, Math.min(1, n(s, 'level', 1)));
      return g([
        path(`M-8 -22 h18 l2 22 h-22 Z`, { fill: c, stroke: INK, sw: 2.2 }),
        lvl > 0.05 ? path(`M${-7} ${-20 * lvl - 1} h${16} l${1.5} ${20 * lvl - 0.5} h${-19} Z`, { fill: 'rgba(0,0,0,0.08)' }) : g([]),
        path(`M10 -22 l4 -4 l-6 1 Z`, { fill: c, stroke: INK, sw: 2 }), // spout (forward)
        path(`M-8 -18 q-9 2 -7 12 q1 4 5 5`, { fill: 'none', stroke: INK, sw: 2.8 }), // handle (back)
      ]); },
  },
  door: {
    defaults: { angle: 0 }, grip: [26, -34], mouth: undefined,
    seat: undefined,
    draw: (s, col) => { const a = Math.max(0, Math.min(1, n(s, 'angle', 0))); const c = color(col ?? C.tan); const w = 34, h = 74;
      // frame + door that swings open toward the viewer (foreshortened width)
      const dw = w * (1 - a * 0.78);
      return g([
        rect(-w / 2 - 4, -h - 4, w + 8, h + 4, { rx: 2, fill: C.grey2, stroke: INK, sw: 2.2 }),
        rect(-w / 2, -h, w, h, { fill: a > 0.1 ? C.sky : c, stroke: INK, sw: 1.5 }),
        g([
          rect(0, -h, dw, h, { fill: c, stroke: INK, sw: 2.2 }),
          rect(dw * 0.18, -h + 8, dw * 0.64, 26, { fill: 'rgba(0,0,0,0.08)', stroke: INK, sw: 1.2 }),
          rect(dw * 0.18, -h + 42, dw * 0.64, 26, { fill: 'rgba(0,0,0,0.08)', stroke: INK, sw: 1.2 }),
          circle(dw * 0.82, -h / 2 - 2, 2.2, { fill: C.gold, stroke: INK, sw: 1.2 }),
        ], { x: -w / 2 }),
      ]); },
  },
  box: {
    defaults: { lidOpen: 0, w: 30, h: 20 }, grip: [0, -14],
    draw: (s, col) => { const c = color(col ?? C.tan); const w = n(s, 'w', 30), h = n(s, 'h', 20);
      return g([
        rect(-w / 2, -h, w, h, { rx: 2, fill: c, stroke: INK, sw: 2.2 }),
        line([[-w / 2, -h + 6], [w / 2, -h + 6]], { stroke: INK, sw: 1.4 }),
      ]); },
  },
  ball: {
    defaults: { r: 6 }, grip: [0, -6], pivot: (s) => [0, -n(s, 'r', 6)],
    /** A spot and a seam make rotation visible when the ball rolls. */
    draw: (s, col) => { const r = n(s, 'r', 6); return g([circle(0, -r, r, { fill: color(col ?? C.red), stroke: INK, sw: 2 }), path(`M${r1(-r * 0.8)} ${r1(-r - r * 0.2)} q${r1(r * 0.8)} ${r1(-r * 0.7)} ${r1(r * 1.6)} 0`, { fill: 'none', stroke: INK, sw: 1.4 }), circle(r * 0.35, -r - r * 0.45, r * 0.22, { fill: C.white, opacity: 0.8 })]); },
  },
  mug: {
    defaults: { level: 0.8 }, grip: [0, -4], mouth: [0, -10],
    draw: (_s, col) => g([
      path('M-5 -10 h10 v9 q0 1.5 -1.5 1.5 h-7 q-1.5 0 -1.5 -1.5 Z', { fill: color(col ?? C.white), stroke: INK, sw: 1.8 }),
      path('M5 -8 q4 0 4 3 q0 3 -4 3', { fill: 'none', stroke: INK, sw: 1.8 }),
      path('M-3 -13 q1 -2 0 -4 M1 -13 q1 -2 0 -4', { fill: 'none', stroke: C.grey, sw: 1 }),
    ]),
  },
  phone: {
    defaults: { on: true }, grip: [0, -6],
    draw: (s) => g([rect(-4, -12, 8, 14, { rx: 1.6, fill: C.dark, stroke: INK, sw: 1.6 }), rect(-2.8, -10.6, 5.6, 10, { rx: 0.6, fill: b(s, 'on', true) ? C.sky : C.grey })]),
  },
  sofa: {
    defaults: {}, grip: [0, -20], seat: { x: 0, y: -18, reclineDeg: 18 },
    draw: (_s, col) => { const c = color(col ?? C.green);
      return g([
        rect(-42, -34, 12, 30, { rx: 5, fill: c, stroke: INK, sw: 2.2 }), rect(30, -34, 12, 30, { rx: 5, fill: c, stroke: INK, sw: 2.2 }),
        rect(-36, -36, 72, 18, { rx: 5, fill: c, stroke: INK, sw: 2.2 }),
        rect(-32, -18, 64, 14, { rx: 5, fill: c, stroke: INK, sw: 2.2 }),
        line([[-26, -26], [-26, -20]], { stroke: 'rgba(0,0,0,0.15)', sw: 1.4 }), line([[26, -26], [26, -20]], { stroke: 'rgba(0,0,0,0.15)', sw: 1.4 }),
        rect(-38, -4, 5, 5, { fill: C.brown, stroke: INK, sw: 1.2 }), rect(33, -4, 5, 5, { fill: C.brown, stroke: INK, sw: 1.2 }),
      ]); },
  },
  bed: {
    defaults: {}, grip: [0, -20], seat: { x: 12, y: -14, reclineDeg: 84 },
    draw: (_s, col) => { const c = color(col ?? C.tan);
      return g([
        rect(-48, -30, 10, 32, { rx: 3, fill: C.brown, stroke: INK, sw: 2.2 }),
        rect(-44, -14, 92, 14, { rx: 3, fill: c, stroke: INK, sw: 2.2 }),
        rect(-40, -22, 20, 10, { rx: 4, fill: C.white, stroke: INK, sw: 1.8 }),
        rect(42, -4, 5, 6, { fill: C.brown, stroke: INK, sw: 1.2 }), rect(-46, -4, 5, 6, { fill: C.brown, stroke: INK, sw: 1.2 }),
      ]); },
  },
  blanket: {
    defaults: { cover: 1, length: 66, bulge: 22 }, grip: [0, -10],
    /** Anchored at the foot end on the mattress top; a hump follows the body underneath and tucks at the chest. */
    draw: (s, col) => { const cv = Math.max(0, Math.min(1, n(s, 'cover', 1))); const L = n(s, 'length', 66) * cv, B = n(s, 'bulge', 22);
      if (cv <= 0) return g([]);
      return g([
        path(`M0 1 L${r1(-L)} 1 L${r1(-L)} ${r1(-B * 0.95)} Q${r1(-L + 4)} ${r1(-B - 1)} ${r1(-L + 10)} ${r1(-B)} L${r1(-L * 0.45)} ${r1(-B)} Q${r1(-L * 0.25)} ${r1(-B * 0.92)} ${r1(-L * 0.12)} ${r1(-B * 0.55)} Q-2 ${r1(-B * 0.38)} 0 ${r1(-B * 0.3)} Z`, { fill: color(col ?? C.lilac), stroke: INK, sw: 2.2 }),
        path(`M${r1(-L + 3)} ${r1(-B * 0.5)} L${r1(-L + 9)} ${r1(-B * 0.5)}`, { stroke: 'rgba(0,0,0,0.15)', sw: 1.6, fill: 'none' }),
        path(`M${r1(-L * 0.6)} ${r1(-B * 0.72)} Q${r1(-L * 0.5)} ${r1(-B * 0.42)} ${r1(-L * 0.42)} ${r1(-B * 0.2)}`, { stroke: 'rgba(0,0,0,0.12)', sw: 1.4, fill: 'none' }),
      ]); },
  },
  football: {
    defaults: {}, grip: [0, -6],
    draw: (_s, col) => g([circle(0, -6, 6, { fill: color(col ?? C.white), stroke: INK, sw: 2 }), path('M0 -8.5 l2.2 1.6 -0.8 2.6 h-2.8 l-0.8 -2.6 Z', { fill: C.dark }), path('M-5.5 -4 l2 -1.2 M5.5 -4 l-2 -1.2 M-2 -0.6 l1 -2 M2 -0.6 l-1 -2', { stroke: C.dark, sw: 1.2, fill: 'none' })]),
  },
  table: {
    defaults: {}, grip: [0, -30],
    draw: (_s, col) => g([rect(-26, -30, 52, 5, { rx: 2, fill: color(col ?? C.tan), stroke: INK, sw: 2.2 }), rect(-22, -25, 4, 25, { fill: C.brown, stroke: INK, sw: 1.6 }), rect(18, -25, 4, 25, { fill: C.brown, stroke: INK, sw: 1.6 })]),
  },
  window: {
    defaults: { time: 'day' }, grip: [0, 0],
    draw: (s) => { const night = s.time === 'night', evening = s.time === 'evening';
      return g([
        rect(-15, -15, 30, 30, { rx: 3, fill: night ? C.night : evening ? '#f1b36b' : C.sky, stroke: INK, sw: 2 }),
        night ? circle(7, -7, 4, { fill: C.yellow }) : circle(-6, -6, 4.5, { fill: C.yellow, opacity: evening ? 0.9 : 0.75 }),
        line([[0, -15], [0, 15]], { stroke: INK, sw: 1.6 }), line([[-15, 0], [15, 0]], { stroke: INK, sw: 1.6 }),
      ]); },
  },
  mat: {
    defaults: {}, grip: [0, 0],
    draw: (_s, col) => ellipse(0, 0, 30, 4, { fill: color(col ?? C.lilac), stroke: INK, sw: 1.6 }),
  },
  ladder: {
    defaults: { length: 70, lean: 0 }, grip: [0, -20],
    /** Stands on the ground at its base; `lean` 0 = flat on the ground pointing +x, 1 = raised against a wall (≈ 72°). */
    draw: (s, col) => { const L = n(s, 'length', 70), lean = Math.max(0, Math.min(1, n(s, 'lean', 0))); const ang = 90 - 72 * lean; const c = color(col ?? C.brown);
      const rungs: FrameNode[] = []; for (let y = 8; y < L - 4; y += 8) rungs.push(line([[-4, -y], [4, -y]], { stroke: c, sw: 2.6 }));
      return g([line([[-4, 0], [-4, -L]], { stroke: c, sw: 3 }), line([[4, 0], [4, -L]], { stroke: c, sw: 3 }), ...rungs, line([[-4, 0], [-4, -L]], { stroke: INK, sw: 0.8, opacity: 0.6 }), line([[4, 0], [4, -L]], { stroke: INK, sw: 0.8, opacity: 0.6 })], { rotate: ang }); },
  },
  castle: {
    defaults: { flag: 'red', gate: 0, w: 56, h: 52 }, grip: [0, -20],
    /** Wall with battlements and a tower; `flag` colour is the holder's banner, `gate` 0..1 opens the gate. */
    draw: (s, col) => { const c = color(col ?? C.grey2); const w = n(s, 'w', 56), h = n(s, 'h', 52); const gate = Math.max(0, Math.min(1, n(s, 'gate', 0)));
      const merlons: FrameNode[] = []; for (let x = -w / 2; x < w / 2; x += 10) merlons.push(rect(x, -h - 6, 5, 7, { fill: c, stroke: INK, sw: 1.6 }));
      const stones: FrameNode[] = []; for (let y = -h + 10; y < -6; y += 10) for (let x = -w / 2 + ((y / 10) % 2 ? 4 : 0); x < w / 2 - 6; x += 12) stones.push(rect(x + 2, y, 8, 4, { rx: 1, fill: 'rgba(0,0,0,0.07)' }));
      const tw = 18, th = h + 22;
      return g([
        rect(-w / 2, -h, w, h, { fill: c, stroke: INK, sw: 2.2 }), ...stones, ...merlons,
        rect(w / 2 - 6, -th, tw, th, { fill: c, stroke: INK, sw: 2.2 }),
        ...[0, 1].map((k) => rect(w / 2 - 5 + k * 9, -th - 6, 5, 7, { fill: c, stroke: INK, sw: 1.6 })),
        line([[w / 2 + 3, -th - 4], [w / 2 + 3, -th - 24]], { stroke: INK, sw: 1.8 }),
        path(`M${r1(w / 2 + 3)} ${r1(-th - 24)} l14 4 l-14 4 Z`, { fill: color(s.flag as string), stroke: INK, sw: 1.4 }),
        rect(w / 2 + 1, -th + 10, 4, 7, { rx: 2, fill: C.night }),
        // gate: an arch that opens (dark opening grows)
        path(`M-10 0 v-16 a10 10 0 0 1 20 0 v16 Z`, { fill: gate > 0.5 ? C.night : C.brown, stroke: INK, sw: 2 }),
        gate > 0 ? path(`M-10 0 v-16 a10 10 0 0 1 20 0 v16 Z`, { fill: C.night, opacity: gate }) : g([]),
        line([[-6, -2], [-6, -20]], { stroke: INK, sw: 1, opacity: gate > 0.5 ? 0 : 0.5 }), line([[0, -2], [0, -24]], { stroke: INK, sw: 1, opacity: gate > 0.5 ? 0 : 0.5 }), line([[6, -2], [6, -20]], { stroke: INK, sw: 1, opacity: gate > 0.5 ? 0 : 0.5 }),
      ]); },
  },
};

export function drawProp(asset: string, state: PropState, col?: string): FrameNode {
  const spec = PROPS[asset];
  if (!spec) return text(0, 0, '?', 10, { fill: C.red });
  return spec.draw({ ...spec.defaults, ...state }, col);
}
