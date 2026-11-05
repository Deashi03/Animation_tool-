/**
 * Props with state. Each prop is a draw function of its state (numbers 0..1,
 * booleans, strings) and exposes anchors (where a hand grips, where content
 * sits). Local space: the prop's `at` is its ground/base point.
 */
import { circle, ellipse, g, line, path, rect, text, type FrameNode, r1 } from '../engine/frame';
import { palette as C, color } from './palette';

import { type PropSpec, type PropState, n, b } from './propSpec';
import { TOOLS } from './props/tools';
import { CONTAINERS } from './props/containers';
import { FOODS } from './props/food';
import { FIXTURES } from './props/fixtures';
export type { PropSpec, PropState } from './propSpec';
/** How far (degrees) a held prop rotates forward around its grip when `tilt` = 1. */
export const HELD_TILT_DEG = 55;
const INK = C.ink;

const BASE: Record<string, PropSpec> = {
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
  brawl: {
    defaults: { intensity: 1, phase: 0 }, grip: [0, -10],
    /** Anime/Asterix-style fight cloud: jittering puffs, stars and a fist or two poking out. `phase` 0..1 drives the jitter, `intensity` the size. */
    draw: (s) => { const k = Math.max(0, Math.min(1, n(s, 'intensity', 1))), ph = n(s, 'phase', 0) * Math.PI * 2;
      if (k <= 0.01) return g([]);
      const puffs: [number, number, number][] = [[-12, -10, 9], [0, -16, 11], [12, -9, 9], [-5, -4, 8], [7, -3, 8], [-16, -2, 6], [16, -3, 6]];
      const nodes: FrameNode[] = puffs.map(([x, y, r], i) => circle(x + Math.sin(ph * 2 + i) * 1.6, y + Math.cos(ph * 3 + i * 1.3) * 1.4, r, { fill: '#f3f0ea', stroke: INK, sw: 2 }));
      nodes.push(...puffs.map(([x, y, r], i) => circle(x + Math.sin(ph * 2 + i) * 1.6, y + Math.cos(ph * 3 + i * 1.3) * 1.4, r - 1.2, { fill: '#f3f0ea' })));
      // fists / feet poking out, alternating
      const pokes: [number, number, number][] = [[-20, -12, ph], [21, -16, ph + 2], [4, -28, ph + 4], [-9, 4, ph + 1]];
      for (const [x, y, p] of pokes) { const out = Math.max(0, Math.sin(p)); if (out > 0.3) nodes.push(circle(x * (0.9 + out * 0.25), y * (0.9 + out * 0.25), 3.2, { fill: C.skin, stroke: INK, sw: 1.6 })); }
      // stars and impact ticks
      const starAt = (cx: number, cy: number, r: number) => { const pts: string[] = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5 + ph * 0.5, rr = i % 2 ? r * 0.45 : r; pts.push(`${r1(cx + rr * Math.cos(a))} ${r1(cy + rr * Math.sin(a))}`); } return path(`M${pts.join(' L')} Z`, { fill: C.yellow, stroke: INK, sw: 1.2 }); };
      nodes.push(starAt(-22 + Math.sin(ph) * 2, -24, 4), starAt(22, -26 + Math.cos(ph) * 2, 3.4), starAt(0, -34 + Math.sin(ph * 1.7) * 2, 3));
      nodes.push(line([[-28, -20], [-32, -24]], { stroke: INK, sw: 1.8 }), line([[28, -22], [32, -27]], { stroke: INK, sw: 1.8 }), line([[-26, -4], [-31, -3]], { stroke: INK, sw: 1.8 }), line([[27, -6], [32, -5]], { stroke: INK, sw: 1.8 }));
      return g(nodes, { scale: 0.4 + 0.6 * k }); },
  },
  /** Stove (spis) standing on the floor with one hob plate on top. `heat` 0..1 makes the plate glow. The pan sits at `mouth`. */
  stove: {
    defaults: { heat: 0 }, grip: [0, -30], mouth: [0, -30],
    draw: (s, col) => { const heat = Math.max(0, Math.min(1, n(s, 'heat', 0))); const c = color(col ?? '#eef0f2');
      return g([
        rect(-22, -28, 44, 28, { rx: 2, fill: c, stroke: INK, sw: 2.2 }),
        rect(-16, -19, 32, 15, { rx: 2, fill: C.dark, stroke: INK, sw: 1.6 }), rect(-13, -16, 26, 10, { rx: 1, fill: '#4a4f5c' }),
        line([[-14, -23], [14, -23]], { stroke: INK, sw: 2.4, linecap: 'round' }),
        circle(-18, -24, 1.6, { fill: C.dark }), circle(18, -24, 1.6, { fill: C.dark }),
        ellipse(0, -29, 15, 3.2, { fill: '#5a5f6a', stroke: INK, sw: 1.8 }),
        heat > 0.02 ? ellipse(0, -29, 12, 2.3, { fill: '#e2452b', opacity: 0.35 + 0.65 * heat }) : g([]),
        heat > 0.02 ? ellipse(0, -29, 7, 1.3, { fill: '#ff9a3c', opacity: heat }) : g([]),
      ]); },
  },
  /** Frying pan (stekpanna) in a readable three-quarter view. Base = the pan bottom (put it on a stove's `mouth`). Handle points to +x; `grip` is the handle end.
   * State: `contents` none|egg|pancake|butter|onion|steak, `browning` 0..1 (pale → golden → brown), `top` 0..1 browning of the visible side (pancake/steak after a flip),
   * `burnt` 0..1 (→ black + smoke), `melt` 0..1 (butter block → pool), `toss` 0..1 (contents fly up and turn over), `sizzle` 0..1 + `phase` (steam/sizzle marks), `splash` 0..1 (fat spatters; <0 = off). */
  pan: {
    defaults: { contents: 'none', browning: 0, top: 0, burnt: 0, melt: 0, toss: 0, sizzle: 0, phase: 0, splash: -1 }, grip: [27, -11], mouth: [0, -8],
    draw: (s, col) => {
      const c = color(col ?? C.dark);
      const br = Math.max(0, Math.min(1, n(s, 'browning', 0))), top = Math.max(0, Math.min(1, n(s, 'top', 0))), burnt = Math.max(0, Math.min(1, n(s, 'burnt', 0)));
      const melt = Math.max(0, Math.min(1, n(s, 'melt', 0))), toss = Math.max(0, Math.min(1, n(s, 'toss', 0))), sizzle = Math.max(0, Math.min(1, n(s, 'sizzle', 0)));
      const phase = n(s, 'phase', 0), splash = n(s, 'splash', -1), contents = typeof s.contents === 'string' ? s.contents : 'none';
      const hex = (h: string): [number, number, number] => { if (h.startsWith('rgb')) { const m = (h.match(/\d+/g) ?? []).map(Number); return [m[0] ?? 0, m[1] ?? 0, m[2] ?? 0]; } return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; };
      const mix = (a: string, b: string, u: number) => { const A = hex(a), B = hex(b); return `rgb(${Math.round(A[0] + (B[0] - A[0]) * u)},${Math.round(A[1] + (B[1] - A[1]) * u)},${Math.round(A[2] + (B[2] - A[2]) * u)})`; };
      const PALE = '#f7e6b8', GOLD = '#e0a243', BROWN = '#8d4a1c', BLACK = '#2b2a33';
      const cookCol = (raw: string, u: number) => mix(u < 0.5 ? mix(raw, GOLD, u * 2) : mix(GOLD, BROWN, (u - 0.5) * 2), BLACK, burnt);
      // contents lift + turn when tossed (parabola, the disc foreshortens as it turns over)
      const lift = 24 * 4 * toss * (1 - toss), turn = Math.cos(Math.PI * toss);
      const food: FrameNode[] = [];
      const cy = -8 - lift;
      if (contents === 'egg') {
        const set = Math.min(1, br * 2); food.push(ellipse(0, cy, 8 + 4.5 * set, (2.6 + 1.6 * set) * Math.abs(turn) + 0.4, { fill: mix('#f6f3ea', '#ffffff', set), stroke: cookCol('#f0e6cf', Math.max(br, 0.15)), sw: 1.8, opacity: 0.3 + 0.7 * set }));
        food.push(circle(-1.5, cy - 1.2, 3.4, { fill: mix('#f6b63b', '#e59a2a', br), stroke: INK, sw: 1.2 }));
      } else if (contents === 'pancake' || contents === 'steak') {
        const raw = contents === 'steak' ? '#e39a97' : PALE, rx = contents === 'steak' ? 12 : 12, ry = (contents === 'steak' ? 4.2 : 3.6) * Math.max(0.25, Math.abs(turn));
        const side = cookCol(raw, br), face = cookCol(raw, turn >= 0 ? top : br);
        food.push(ellipse(0, cy + 1.6, rx, ry, { fill: side, stroke: INK, sw: 1.4 }));
        food.push(ellipse(0, cy, rx, ry, { fill: face, stroke: INK, sw: 1.4 }));
        if (contents === 'steak' && burnt < 0.5) food.push(path(`M-5 ${r1(cy - 0.4)} h3 M1 ${r1(cy + 0.4)} h3`, { stroke: 'rgba(0,0,0,0.25)', sw: 1 }));
      } else if (contents === 'butter') {
        const bh = 7 * (1 - melt), bw = 9 + 4 * melt;
        if (melt < 0.98) food.push(rect(-bw / 2, cy + 1 - bh, bw, bh, { rx: 1, fill: C.yellow, stroke: INK, sw: 1.4 }));
        if (melt > 0.05) food.push(ellipse(0, cy + 1.2, 4 + 9 * melt, 1 + 1.4 * melt, { fill: mix(C.yellow, '#f4d26a', melt), stroke: INK, sw: 1.2, opacity: 0.95 }));
        if (melt > 0.3) food.push(ellipse(-3, cy + 0.9, 2.2 * melt, 0.5, { fill: 'rgba(255,255,255,0.7)' }));
      } else if (contents === 'onion') {
        const col2 = cookCol('#fbf6ea', br);
        const bits: [number, number, number][] = [[-7, 0, 0], [-2, -1, 1], [3, 0.5, 2], [7, -0.5, 3]];
        for (const [x, y, i] of bits) { const l = 16 * 4 * toss * (1 - toss) * (0.6 + 0.4 * ((i * 7) % 3) / 2); food.push(path(`M${r1(x - 3)} ${r1(-8 + y - l)} q3 -3 6 0`, { fill: 'none', stroke: col2, sw: 2.2, linecap: 'round' }), path(`M${r1(x - 3)} ${r1(-8 + y - l)} q3 -3 6 0`, { fill: 'none', stroke: INK, sw: 0.8, opacity: 0.5 })); }
      }
      // sizzle: short wavy steam lines rising from the food, cycling with `phase`
      const fx: FrameNode[] = [];
      if (sizzle > 0.02 && contents !== 'none') {
        for (let i = 0; i < 3; i++) { const u = (phase * 0.9 + i * 0.33) % 1; const x = -6 + i * 6 + Math.sin(u * 6) * 1.2, y = -12 - u * 12 - lift; fx.push(path(`M${r1(x)} ${r1(y)} q-1.5 -2.5 0 -5 q1.5 -2.5 0 -5`, { fill: 'none', stroke: INK, sw: 1.4, linecap: 'round', opacity: sizzle * 0.75 * (1 - u) })); }
        if (sizzle > 0.7) for (let i = 0; i < 3; i++) { const u = (phase * 1.7 + i * 0.37) % 1; const x = -10 + i * 10 + Math.sin(i + phase) * 2, y = -11 - u * 6; fx.push(line([[x, y], [x + 1.5, y - 2.4]], { stroke: C.orange, sw: 1.6, linecap: 'round', opacity: (sizzle - 0.7) / 0.3 * (1 - u) })); }
      }
      if (burnt > 0.05) for (let i = 0; i < 3; i++) { const u = (phase * 0.5 + i * 0.33) % 1; fx.push(circle(-5 + i * 5 + Math.sin(u * 5 + i) * 3, -14 - u * 22, 2.5 + u * 4, { fill: '#6b6f78', opacity: burnt * 0.55 * (1 - u) })); }
      if (splash >= 0 && splash <= 1) { const drops: [number, number][] = [[-1, 1], [1, 1.2], [-0.6, 1.5], [1.3, 0.8], [0.3, 1.6], [-1.4, 0.7], [0.8, 1.9]]; for (const [dx, k] of drops) { const u = splash; const x = -2 + dx * 26 * u, y = -10 - 34 * k * u + 36 * k * u * u; fx.push(circle(x, y, 2 + 0.5 * k, { fill: '#fff3c4', stroke: C.orange, sw: 1.4, opacity: 1 - u * u * u })); fx.push(line([[x - dx * 2.5, y + 2 * k * (1 - 2 * u)], [x, y]], { stroke: C.orange, sw: 1.2, opacity: 0.6 * (1 - u) })); } }
      return g([
        line([[17, -7], [29, -12]], { stroke: INK, sw: 5.2, linecap: 'round' }), line([[17, -7], [29, -12]], { stroke: c, sw: 3, linecap: 'round' }),
        path('M-18 -8 l2 8 h32 l2 -8 Z', { fill: c, stroke: INK, sw: 2.2 }),
        ellipse(0, -8, 18, 6, { fill: '#52565f', stroke: INK, sw: 2 }),
        ellipse(0, -8, 15, 4.4, { fill: '#3e424b' }),
        ...food, ...fx,
      ]); },
  },
  /** Spatula (stekspade): held upright, blade down. `grip` is mid-handle. */
  spatula: {
    defaults: {}, grip: [0, -19],
    draw: (_s, col) => g([
      line([[0, -2], [0, -22]], { stroke: INK, sw: 4, linecap: 'round' }), line([[0, -2], [0, -22]], { stroke: color(col ?? C.brown), sw: 2.2, linecap: 'round' }),
      path('M-4 -3 h8 l1 8 h-10 Z', { fill: '#b9bec8', stroke: INK, sw: 1.6 }), line([[-1.5, -1], [-1.5, 3]], { stroke: INK, sw: 0.8 }), line([[1.5, -1], [1.5, 3]], { stroke: INK, sw: 0.8 }),
    ]),
  },
  castle: {
    defaults: { flag: 'red', gate: 0, w: 56, h: 52, raise: 0, banner: 'navy', broken: 0 }, grip: [0, -20],
    /** Wall with battlements and a tower. `flag` = defender's small flag, `raise` 0..1 hoists the attackers' big `banner` and lowers the small flag, `gate` opens the gate, `broken` 0..1 breaks it. */
    draw: (s, col) => { const c = color(col ?? C.grey2); const w = n(s, 'w', 56), h = n(s, 'h', 52); const gate = Math.max(0, Math.min(1, n(s, 'gate', 0))), raise = Math.max(0, Math.min(1, n(s, 'raise', 0))), broken = Math.max(0, Math.min(1, n(s, 'broken', 0)));
      const merlons: FrameNode[] = []; for (let x = -w / 2; x < w / 2; x += 10) merlons.push(rect(x, -h - 6, 5, 7, { fill: c, stroke: INK, sw: 1.6 }));
      const stones: FrameNode[] = []; for (let y = -h + 10; y < -6; y += 10) for (let x = -w / 2 + ((y / 10) % 2 ? 4 : 0); x < w / 2 - 6; x += 12) stones.push(rect(x + 2, y, 8, 4, { rx: 1, fill: 'rgba(0,0,0,0.07)' }));
      const tw = 18, th = h + 22, px = w / 2 + 3, poleTop = -th - 30; const dir = n(s, 'bannerDir', -1);
      const smallY = -th - 24 + raise * 22; // the defenders' flag slides down as the banner goes up
      const bannerH = 14 * raise, bannerW = 20 * raise;
      return g([
        rect(-w / 2, -h, w, h, { fill: c, stroke: INK, sw: 2.2 }), ...stones, ...merlons,
        rect(w / 2 - 6, -th, tw, th, { fill: c, stroke: INK, sw: 2.2 }),
        ...[0, 1].map((k) => rect(w / 2 - 5 + k * 9, -th - 6, 5, 7, { fill: c, stroke: INK, sw: 1.6 })),
        line([[px, -th - 4], [px, poleTop]], { stroke: INK, sw: 1.8 }),
        raise < 0.95 ? path(`M${r1(px)} ${r1(smallY)} l${r1(12 * dir)} 3 l${r1(-12 * dir)} 3 Z`, { fill: color(s.flag as string), stroke: INK, sw: 1.2, opacity: 1 - raise }) : g([]),
        raise > 0.02 ? path(`M${r1(px)} ${r1(poleTop)} l${r1(bannerW * dir)} ${r1(bannerH * 0.3)} l${r1(-bannerW * 0.3 * dir)} ${r1(bannerH * 0.3)} l${r1(bannerW * 0.3 * dir)} ${r1(bannerH * 0.4)} l${r1(-bannerW * dir)} ${r1(bannerH * 0.25)} Z`, { fill: color(s.banner as string), stroke: INK, sw: 1.6 }) : g([]),
        rect(w / 2 + 1, -th + 10, 4, 7, { rx: 2, fill: C.night }),
        path(`M-10 0 v-16 a10 10 0 0 1 20 0 v16 Z`, { fill: gate > 0.5 || broken > 0.5 ? C.night : C.brown, stroke: INK, sw: 2 }),
        gate > 0 ? path(`M-10 0 v-16 a10 10 0 0 1 20 0 v16 Z`, { fill: C.night, opacity: gate }) : g([]),
        broken > 0 ? g([path('M-9 -2 l6 -8 l-2 -6 l5 -4', { fill: 'none', stroke: INK, sw: 1.6 }), path('M-14 -1 l-4 -3 l1 3 Z', { fill: C.brown, stroke: INK, sw: 1.2 }), path('M12 -2 l5 -3 l-2 4 Z', { fill: C.brown, stroke: INK, sw: 1.2 })], undefined, { opacity: broken }) : g([]),
        line([[-6, -2], [-6, -20]], { stroke: INK, sw: 1, opacity: gate > 0.5 || broken > 0.5 ? 0 : 0.5 }), line([[0, -2], [0, -24]], { stroke: INK, sw: 1, opacity: gate > 0.5 || broken > 0.5 ? 0 : 0.5 }), line([[6, -2], [6, -20]], { stroke: INK, sw: 1, opacity: gate > 0.5 || broken > 0.5 ? 0 : 0.5 }),
      ]); },
  },
};

export const PROPS: Record<string, PropSpec> = { ...BASE, ...TOOLS, ...CONTAINERS, ...FOODS, ...FIXTURES };

export function drawProp(asset: string, state: PropState, col?: string): FrameNode {
  const spec = PROPS[asset];
  if (!spec) return text(0, 0, '?', 10, { fill: C.red });
  return spec.draw({ ...spec.defaults, ...state }, col);
}
