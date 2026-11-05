/**
 * Containers and work surfaces. Base point = bottom centre (stands on a table
 * or the floor). `mouth` = where contents sit / where a tool works. States are
 * 0..1 numbers so actions can tween them: `fill`, `mixed`, `foam`, `boil`,
 * `steam`, `lid`, `dirty`, `food`, `pieces`, `open`, `full`.
 * Asset ids: `container.<shape>`.
 */
import { circle, ellipse, g, line, path, rect, type FrameNode, r1 } from '../../engine/frame';
import { palette as C, color } from '../palette';
import { type PropSpec, type PropState, n, str, clamp01, mix } from '../propSpec';

const INK = C.ink;
export const CONTAINER_SHAPES = ['bowl', 'pot', 'plate', 'board', 'bucket', 'bin', 'bag', 'basket', 'cup', 'bottle', 'jar', 'tray', 'tub', 'suitcase', 'crate'] as const;
export type ContainerShape = (typeof CONTAINER_SHAPES)[number];

const contentsCol = (s: PropState, d: string) => color(str(s, 'contents', d));
/** bubbles for boiling: `boil` 0 none, 0.4 small (sjuda), 1 big (koka); `phase` cycles them */
function bubbles(cx: number, top: number, w: number, boil: number, phase: number): FrameNode[] {
  const out: FrameNode[] = []; if (boil < 0.05) return out;
  const nB = boil < 0.5 ? 3 : 6;
  for (let i = 0; i < nB; i++) { const u = (phase * (0.6 + boil) + i * 0.37) % 1; const x = cx - w / 2 + 2 + ((i * 7.3) % (w - 4)); const r = (boil < 0.5 ? 0.8 : 1.4) + u * (boil < 0.5 ? 0.6 : 1.6); out.push(circle(x, top + 1 - u * 3, r, { fill: 'none', stroke: C.white, sw: 1, opacity: 0.9 * (1 - u * 0.5) })); }
  return out;
}
function steam(cx: number, top: number, amount: number, phase: number): FrameNode[] {
  const out: FrameNode[] = []; if (amount < 0.05) return out;
  for (let i = 0; i < 3; i++) { const u = (phase * 0.8 + i * 0.33) % 1; const x = cx - 6 + i * 6 + Math.sin(u * 6) * 1.5, y = top - 4 - u * 14; out.push(path(`M${r1(x)} ${r1(y)} q-1.5 -2.5 0 -5 q1.5 -2.5 0 -5`, { fill: 'none', stroke: INK, sw: 1.4, linecap: 'round', opacity: amount * 0.7 * (1 - u) })); }
  return out;
}

const S: Record<ContainerShape, PropSpec> = {
  bowl: {
    defaults: { fill: 0.5, mixed: 0, foam: 0, contents: '#f7e6b8', phase: 0 }, grip: [12, -8], mouth: [0, -9],
    draw: (s, col) => { const f = clamp01(n(s, 'fill', 0.5)), mixed = clamp01(n(s, 'mixed', 0)), foam = clamp01(n(s, 'foam', 0)), ph = n(s, 'phase', 0); const c = color(col ?? C.white); const cc = mix(contentsCol(s, '#f7e6b8'), '#ffffff', foam * 0.5);
      const lumps: FrameNode[] = []; if (f > 0.05 && mixed < 0.9) for (let i = 0; i < 4; i++) lumps.push(circle(-7 + i * 4.6, -10 + f * 1.5 + (i % 2) * 1.2, 1.8 * (1 - mixed), { fill: i % 2 ? C.yellow : C.white, stroke: INK, sw: 0.8, opacity: 1 - mixed }));
      const swirl = f > 0.05 && mixed > 0.2 ? path(`M-6 ${r1(-9.5)} q3 ${r1(Math.sin(ph * 6) * 1.2 - 1)} 6 0 q3 1 6 0`, { fill: 'none', stroke: 'rgba(0,0,0,0.18)', sw: 1.2, opacity: mixed }) : g([]);
      const foamDots: FrameNode[] = []; if (foam > 0.1) for (let i = 0; i < 5; i++) foamDots.push(circle(-8 + i * 4, -10.5, 0.9, { fill: C.white, opacity: foam }));
      return g([
        path('M-15 -10 q0 10 15 10 q15 0 15 -10 Z', { fill: c, stroke: INK, sw: 2 }),
        f > 0.05 ? ellipse(0, -10 + (1 - f) * 2.5, 13 - (1 - f) * 2, 2.8, { fill: cc, stroke: INK, sw: 1.2 }) : ellipse(0, -10, 13, 2.8, { fill: 'rgba(0,0,0,0.08)' }),
        ...lumps, swirl, ...foamDots,
        ellipse(0, -10, 15, 3.2, { fill: 'none', stroke: INK, sw: 2 }),
      ]); },
  },
  pot: {
    defaults: { fill: 0.6, boil: 0, steam: 0, lid: 0, contents: '#9fd0ea', phase: 0 }, grip: [20, -12], mouth: [0, -16],
    draw: (s, col) => { const f = clamp01(n(s, 'fill', 0.6)), boil = clamp01(n(s, 'boil', 0)), st = clamp01(n(s, 'steam', boil)), lid = clamp01(n(s, 'lid', 0)), ph = n(s, 'phase', 0); const c = color(col ?? C.grey2); const top = -16 + (1 - f) * 10;
      return g([
        rect(-15, -16, 30, 16, { rx: 1.5, fill: c, stroke: INK, sw: 2 }),
        line([[-15, -13], [-21, -13]], { stroke: INK, sw: 3.4, linecap: 'round' }), line([[15, -13], [21, -13]], { stroke: INK, sw: 3.4, linecap: 'round' }),
        f > 0.05 ? rect(-13.5, top, 27, Math.max(0, -1.5 - top), { fill: contentsCol(s, '#9fd0ea') }) : g([]),
        f > 0.05 ? ellipse(0, top, 13.5, 2.4, { fill: mix(contentsCol(s, '#9fd0ea'), '#ffffff', 0.25), stroke: INK, sw: 1 }) : g([]),
        ...bubbles(0, top, 27, boil, ph),
        ellipse(0, -16, 15, 3, { fill: 'none', stroke: INK, sw: 2 }),
        lid > 0.05 ? g([ellipse(0, -17, 15.5, 3.2, { fill: C.grey, stroke: INK, sw: 1.8 }), circle(0, -19.5, 1.8, { fill: C.dark, stroke: INK, sw: 1 })], { y: -(1 - lid) * 14 }, { opacity: lid }) : g([]),
        ...steam(0, -16, st * (lid > 0.5 ? 0.3 : 1), ph),
      ]); },
  },
  plate: {
    defaults: { food: 0, dirty: 0, contents: '#e0a243' }, grip: [12, -2], mouth: [0, -3],
    draw: (s, col) => { const food = clamp01(n(s, 'food', 0)), dirty = clamp01(n(s, 'dirty', 0)); const c = color(col ?? C.white);
      const smudges: FrameNode[] = []; if (dirty > 0.05) for (let i = 0; i < 4; i++) smudges.push(ellipse(-7 + i * 4.5, -2.5 + (i % 2), 2.2, 0.9, { fill: C.brown, opacity: 0.55 * dirty }));
      return g([
        ellipse(0, -2, 17, 4, { fill: c, stroke: INK, sw: 2 }), ellipse(0, -2.4, 11, 2.2, { fill: 'rgba(0,0,0,0.06)' }), ...smudges,
        food > 0.05 ? g([ellipse(0, -4, 8 * food + 1, 3 * food + 0.5, { fill: contentsCol(s, '#e0a243'), stroke: INK, sw: 1.3 }), ellipse(-2, -5 - food, 3 * food, 1.5 * food, { fill: C.green, stroke: INK, sw: 1 })]) : g([]),
      ]); },
  },
  board: {
    defaults: {}, grip: [16, -2], mouth: [0, -4],
    draw: (_s, col) => g([rect(-18, -4, 36, 4, { rx: 1.5, fill: color(col ?? C.tan), stroke: INK, sw: 1.8 }), line([[-14, -2], [12, -2]], { stroke: 'rgba(0,0,0,0.12)', sw: 1 }), circle(15, -2, 1, { fill: INK, opacity: 0.5 })]),
  },
  bucket: {
    defaults: { fill: 0.5, contents: '#9fd0ea' }, grip: [0, -26], mouth: [0, -18],
    draw: (s, col) => { const f = clamp01(n(s, 'fill', 0.5)); const c = color(col ?? C.grey);
      return g([
        path('M-11 -18 h22 l-2 18 h-18 Z', { fill: c, stroke: INK, sw: 2 }),
        f > 0.05 ? ellipse(0, -18 + (1 - f) * 10, 10 - (1 - f) * 1, 2.2, { fill: contentsCol(s, '#9fd0ea'), stroke: INK, sw: 1 }) : g([]),
        ellipse(0, -18, 11, 2.6, { fill: 'none', stroke: INK, sw: 2 }),
        path('M-11 -18 q0 -10 11 -10 q11 0 11 10', { fill: 'none', stroke: INK, sw: 2 }),
      ]); },
  },
  bin: {
    defaults: { open: 0, full: 0 }, grip: [0, -34], mouth: [0, -30],
    draw: (s, col) => { const open = clamp01(n(s, 'open', 0)), full = clamp01(n(s, 'full', 0)); const c = color(col ?? C.green);
      return g([
        path('M-11 -30 h22 l-2 30 h-18 Z', { fill: c, stroke: INK, sw: 2 }), line([[-5, -24], [-4, -5]], { stroke: INK, sw: 1, opacity: 0.3 }), line([[5, -24], [4, -5]], { stroke: INK, sw: 1, opacity: 0.3 }),
        full > 0.1 ? g([path('M-7 -30 q3 -4 7 -2 q4 -3 7 2 Z', { fill: C.beige, stroke: INK, sw: 1.2 })], undefined, { opacity: full }) : g([]),
        g([rect(-12.5, -33, 25, 4, { rx: 1.5, fill: mix(c, '#000000', 0.15), stroke: INK, sw: 1.8 }), rect(-3, -35.5, 6, 2.5, { rx: 1, fill: C.dark })], { rotate: -70 * open, px: -12.5, py: -31 }),
      ]); },
  },
  bag: {
    defaults: { open: 1, full: 0.4 }, grip: [0, -22], mouth: [0, -22],
    draw: (s, col) => { const full = clamp01(n(s, 'full', 0.4)); const c = color(col ?? C.beige);
      return g([
        path('M-10 -22 h20 l1 22 h-22 Z', { fill: c, stroke: INK, sw: 2 }), line([[-10, -22], [-7, -19]], { stroke: INK, sw: 1, opacity: 0.4 }), line([[10, -22], [7, -19]], { stroke: INK, sw: 1, opacity: 0.4 }),
        full > 0.1 ? g([circle(-4, -22 - full * 3, 3, { fill: C.green, stroke: INK, sw: 1.2 }), circle(3, -23 - full * 3, 3.4, { fill: C.red, stroke: INK, sw: 1.2 })]) : g([]),
        path('M-5 -22 q0 -6 5 -6 q5 0 5 6', { fill: 'none', stroke: INK, sw: 1.8 }),
      ]); },
  },
  basket: {
    defaults: { full: 0.5 }, grip: [0, -22], mouth: [0, -14],
    draw: (s, col) => { const full = clamp01(n(s, 'full', 0.5)); const c = color(col ?? C.tan);
      const weave: FrameNode[] = []; for (let y = -11; y < -2; y += 3) weave.push(line([[-12 + (y % 2 ? 1 : 0), y], [12, y]], { stroke: INK, sw: 0.7, opacity: 0.25 }));
      return g([path('M-14 -14 h28 l-3 14 h-22 Z', { fill: c, stroke: INK, sw: 2 }), ...weave, full > 0.1 ? g([path('M-10 -14 q4 -5 10 -3 q6 -4 10 3 Z', { fill: C.sky, stroke: INK, sw: 1.2 })], undefined, { opacity: full }) : g([]), path('M-9 -14 q0 -9 9 -9 q9 0 9 9', { fill: 'none', stroke: INK, sw: 2 })]); },
  },
  cup: {
    defaults: { fill: 0.6, contents: '#8a5a3a', steam: 0, phase: 0 }, grip: [8, -8], mouth: [0, -14],
    draw: (s, col) => { const f = clamp01(n(s, 'fill', 0.6)), st = clamp01(n(s, 'steam', 0)); const c = color(col ?? C.white);
      return g([path('M-8 -14 h16 l-2 14 h-12 Z', { fill: c, stroke: INK, sw: 2 }), path('M8 -11 q6 0 5 5 q-1 4 -6 3', { fill: 'none', stroke: INK, sw: 2.2 }), f > 0.05 ? ellipse(0, -14 + (1 - f) * 8, 7.5 - (1 - f) * 1, 1.8, { fill: contentsCol(s, '#8a5a3a'), stroke: INK, sw: 1 }) : g([]), ellipse(0, -14, 8, 2.2, { fill: 'none', stroke: INK, sw: 2 }), ...steam(0, -14, st, n(s, 'phase', 0))]); },
  },
  bottle: {
    defaults: { fill: 0.7, contents: '#9fd0ea', cap: 1 }, grip: [0, -14], mouth: [0, -28],
    draw: (s, col) => { const f = clamp01(n(s, 'fill', 0.7)); const c = color(col ?? 'rgba(200,230,245,0.7)');
      return g([path('M-6 -20 q0 -3 3 -5 v-3 h6 v3 q3 2 3 5 v20 h-12 Z', { fill: c, stroke: INK, sw: 1.8 }), f > 0.05 ? rect(-5, -19 * f, 10, 19 * f - 1, { fill: contentsCol(s, '#9fd0ea'), opacity: 0.9 }) : g([]), n(s, 'cap', 1) > 0.5 ? rect(-3.5, -29.5, 7, 3, { rx: 1, fill: C.red, stroke: INK, sw: 1.2 }) : g([])]); },
  },
  jar: {
    defaults: { fill: 0.6, contents: '#d64545', lid: 1 }, grip: [0, -10], mouth: [0, -18],
    draw: (s, col) => { const f = clamp01(n(s, 'fill', 0.6)); const c = color(col ?? 'rgba(220,235,245,0.6)');
      return g([rect(-8, -18, 16, 18, { rx: 2, fill: c, stroke: INK, sw: 1.8 }), f > 0.05 ? rect(-7, -16 * f - 1, 14, 16 * f, { rx: 1, fill: contentsCol(s, '#d64545') }) : g([]), n(s, 'lid', 1) > 0.5 ? rect(-8.5, -20.5, 17, 3.5, { rx: 1, fill: C.gold, stroke: INK, sw: 1.4 }) : g([])]); },
  },
  tray: { defaults: {}, grip: [16, -3], mouth: [0, -3], draw: (_s, col) => g([rect(-20, -3, 40, 3, { rx: 1, fill: color(col ?? C.dark), stroke: INK, sw: 1.6 }), rect(-20, -5, 2.5, 5, { fill: color(col ?? C.dark), stroke: INK, sw: 1.2 }), rect(17.5, -5, 2.5, 5, { fill: color(col ?? C.dark), stroke: INK, sw: 1.2 })]) },
  tub: {
    defaults: { fill: 0.6, contents: '#9fd0ea', foam: 0 }, grip: [0, -20], mouth: [0, -16],
    draw: (s, col) => { const f = clamp01(n(s, 'fill', 0.6)), foam = clamp01(n(s, 'foam', 0)); const c = color(col ?? C.white);
      const bub: FrameNode[] = []; if (foam > 0.1) for (let i = 0; i < 6; i++) bub.push(circle(-14 + i * 5.6, -17 - (i % 2) * 1.5, 1.6 + (i % 3) * 0.5, { fill: C.white, stroke: INK, sw: 0.8, opacity: foam }));
      return g([path('M-20 -16 h40 l-3 16 h-34 Z', { fill: c, stroke: INK, sw: 2 }), f > 0.05 ? ellipse(0, -16 + (1 - f) * 8, 18 - (1 - f) * 2, 2.4, { fill: contentsCol(s, '#9fd0ea'), stroke: INK, sw: 1 }) : g([]), ...bub, ellipse(0, -16, 20, 3, { fill: 'none', stroke: INK, sw: 2 })]); },
  },
  suitcase: {
    defaults: { open: 0, full: 0 }, grip: [0, -26], mouth: [0, -22],
    draw: (s, col) => { const open = clamp01(n(s, 'open', 0)), full = clamp01(n(s, 'full', 0)); const c = color(col ?? C.navy);
      return g([rect(-16, -22, 32, 22, { rx: 3, fill: c, stroke: INK, sw: 2 }), full > 0.1 ? g([rect(-12, -21, 10, 6, { rx: 1, fill: C.red, stroke: INK, sw: 1 }), rect(0, -21, 11, 6, { rx: 1, fill: C.sky, stroke: INK, sw: 1 })], undefined, { opacity: full }) : g([]), g([rect(-16, -22, 32, 10, { rx: 3, fill: mix(c, '#000000', 0.12), stroke: INK, sw: 2 })], { rotate: -110 * open, px: -16, py: -22 }), path('M-5 -22 q0 -5 5 -5 q5 0 5 5', { fill: 'none', stroke: INK, sw: 2.2, opacity: 1 - open })]); },
  },
  crate: {
    defaults: { full: 0 }, grip: [0, -16], mouth: [0, -16],
    draw: (s, col) => { const full = clamp01(n(s, 'full', 0)); const c = color(col ?? C.tan);
      return g([rect(-16, -16, 32, 16, { rx: 1, fill: c, stroke: INK, sw: 2 }), line([[-16, -10], [16, -10]], { stroke: INK, sw: 1, opacity: 0.3 }), line([[-16, -5], [16, -5]], { stroke: INK, sw: 1, opacity: 0.3 }), full > 0.1 ? g([circle(-8, -18, 3.5, { fill: C.red, stroke: INK, sw: 1.2 }), circle(0, -19, 3.5, { fill: C.green, stroke: INK, sw: 1.2 }), circle(8, -18, 3.5, { fill: C.red, stroke: INK, sw: 1.2 })], undefined, { opacity: full }) : g([])]); },
  },
};

export const CONTAINERS: Record<string, PropSpec> = Object.fromEntries(Object.entries(S).map(([k, v]) => [`container.${k}`, v]));
