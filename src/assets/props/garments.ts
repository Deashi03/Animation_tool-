/**
 * Garments as props (not worn): lying flat on a surface, hanging, folded.
 * States: `folded` 0..1 (flat → neat small stack), `hanging` 0..1 (hangs from
 * the top anchor), `wrinkled` 0..1, `wet` 0..1 (darker, drips), `stain` 0..1,
 * `shrink` 0..1 (smaller), `faded` 0..1 (paler), `holes` 0..1.
 * Base point = bottom centre when lying; `mouth` = top centre (hook point when hanging).
 * Asset ids: `garment.<shape>`.
 */
import { circle, ellipse, g, line, path, rect, type FrameNode, r1 } from '../../engine/frame';
import { palette as C, color } from '../palette';
import { type PropSpec, type PropState, n, clamp01, mix } from '../propSpec';

const INK = C.ink;
export const GARMENT_SHAPES = ['shirt', 'trousers', 'sock', 'towel', 'dress', 'jacket'] as const;
export type GarmentShape = (typeof GARMENT_SHAPES)[number];

function common(s: PropState, base: string) {
  const wet = clamp01(n(s, 'wet', 0)), faded = clamp01(n(s, 'faded', 0)), shrink = clamp01(n(s, 'shrink', 0)), folded = clamp01(n(s, 'folded', 0)), wr = clamp01(n(s, 'wrinkled', 0)), stain = clamp01(n(s, 'stain', 0)), hanging = clamp01(n(s, 'hanging', 0));
  const col = mix(mix(base, '#ffffff', faded * 0.6), '#2a3a55', wet * 0.35);
  return { wet, faded, shrink, folded, wr, stain, hanging, col, scale: 1 - shrink * 0.4 };
}
function wrinkles(w: number, h: number, amount: number): FrameNode[] {
  const out: FrameNode[] = []; if (amount < 0.05) return out;
  for (let i = 0; i < 5; i++) { const x = -w / 2 + 3 + ((i * 7.1) % (w - 6)), y = -h + 3 + ((i * 5.3) % (h - 6)); out.push(path(`M${r1(x)} ${r1(y)} q2 ${r1(-1.5 * amount)} 4 0 q1 ${r1(1.5 * amount)} 3 0`, { fill: 'none', stroke: INK, sw: 0.8, opacity: 0.45 * amount })); }
  return out;
}
function stains(w: number, h: number, amount: number): FrameNode[] {
  if (amount < 0.05) return [];
  return [ellipse(-w * 0.15, -h * 0.5, 3 * amount + 0.5, 2 * amount + 0.4, { fill: C.brown, opacity: 0.75 }), ellipse(w * 0.2, -h * 0.3, 2 * amount + 0.4, 1.6 * amount + 0.3, { fill: C.brown, opacity: 0.7 })];
}
function drips(w: number, wet: number, phase: number): FrameNode[] {
  if (wet < 0.3) return [];
  const out: FrameNode[] = []; for (let i = 0; i < 3; i++) { const u = (phase * 0.7 + i * 0.33) % 1; out.push(ellipse(-w / 3 + i * (w / 3), u * 10, 0.9, 1.4, { fill: C.water2, opacity: wet * (1 - u) })); }
  return out;
}
/** Shirt silhouette lying flat (width w, height h, origin at bottom centre). */
const shirtPath = (w: number, h: number) => `M${r1(-w * 0.28)} 0 v${r1(-h * 0.55)} l${r1(-w * 0.22)} ${r1(h * 0.1)} l${r1(-w * 0.08)} ${r1(-h * 0.22)} l${r1(w * 0.3)} ${r1(-h * 0.2)} q${r1(w * 0.28)} ${r1(h * 0.12)} ${r1(w * 0.56)} 0 l${r1(w * 0.3)} ${r1(h * 0.2)} l${r1(-w * 0.08)} ${r1(h * 0.22)} l${r1(-w * 0.22)} ${r1(-h * 0.1)} v${r1(h * 0.55)} Z`;

function foldedStack(col: string, w: number, folded: number): FrameNode {
  const k = folded; const fw = w * (1 - 0.45 * k), fh = 4 + 6 * k;
  return g([rect(-fw / 2, -fh, fw, fh, { rx: 1.5, fill: col, stroke: INK, sw: 1.8 }), ...(k > 0.5 ? [line([[-fw / 2 + 1, -fh / 2], [fw / 2 - 1, -fh / 2]], { stroke: INK, sw: 0.8, opacity: 0.4 })] : [])]);
}

const G: Record<GarmentShape, PropSpec> = {
  shirt: {
    defaults: { folded: 0, hanging: 0, wrinkled: 0, wet: 0, stain: 0, shrink: 0, faded: 0, phase: 0 }, grip: [0, -14], mouth: [0, -28],
    draw: (s, col) => { const c = common(s, color(col ?? C.sky)); const w = 30, h = 28;
      if (c.folded > 0.6) return g([foldedStack(c.col, w, (c.folded - 0.6) / 0.4)], { scale: c.scale });
      const body = g([path(shirtPath(w, h), { fill: c.col, stroke: INK, sw: 1.8 }), path(`M-4 ${r1(-h + 1)} q4 4 8 0`, { fill: 'none', stroke: INK, sw: 1 }), ...wrinkles(w * 0.55, h, c.wr), ...stains(w * 0.55, h, c.stain), ...drips(w * 0.55, c.wet, n(s, 'phase', 0))]);
      // partial fold: the sleeves tuck in (narrower), then the bottom comes up
      const fold = c.folded / 0.6;
      return g([body], { scale: c.scale, scaleX: 1 - 0.3 * fold, scaleY: 1 - 0.25 * fold, py: 0 }); },
  },
  trousers: {
    defaults: { folded: 0, hanging: 0, wrinkled: 0, wet: 0, stain: 0, shrink: 0, faded: 0, phase: 0 }, grip: [0, -14], mouth: [0, -30],
    draw: (s, col) => { const c = common(s, color(col ?? C.navy)); const w = 18, h = 30;
      if (c.folded > 0.6) return g([foldedStack(c.col, w + 6, (c.folded - 0.6) / 0.4)], { scale: c.scale });
      const body = g([path(`M${r1(-w / 2)} 0 v${r1(-h)} h${r1(w)} v${r1(h)} h${r1(-w * 0.36)} l${r1(-w * 0.14)} ${r1(-h * 0.55)} l${r1(-w * 0.14)} ${r1(h * 0.55)} Z`, { fill: c.col, stroke: INK, sw: 1.8 }), ...wrinkles(w, h, c.wr), ...stains(w, h, c.stain), ...drips(w, c.wet, n(s, 'phase', 0))]);
      const fold = c.folded / 0.6; return g([body], { scale: c.scale, scaleY: 1 - 0.3 * fold }); },
  },
  sock: {
    defaults: { folded: 0, hanging: 0, wet: 0, stain: 0, shrink: 0, faded: 0, phase: 0 }, grip: [0, -8], mouth: [0, -16],
    draw: (s, col) => { const c = common(s, color(col ?? C.red)); return g([path('M-4 -16 h8 v9 q6 1 6 6 q0 2 -3 2 h-11 Z', { fill: c.col, stroke: INK, sw: 1.6 }), rect(-4, -16, 8, 3, { fill: 'rgba(255,255,255,0.4)' }), ...stains(8, 14, c.stain), ...drips(8, c.wet, n(s, 'phase', 0))], { scale: c.scale }); },
  },
  towel: {
    defaults: { folded: 0, hanging: 0, wet: 0, stain: 0, shrink: 0, faded: 0, phase: 0 }, grip: [0, -12], mouth: [0, -24],
    draw: (s, col) => { const c = common(s, color(col ?? C.mint)); const w = 20, h = 24;
      if (c.folded > 0.6) return g([foldedStack(c.col, w, (c.folded - 0.6) / 0.4)], { scale: c.scale });
      const fold = c.folded / 0.6;
      return g([rect(-w / 2, -h, w, h, { rx: 1, fill: c.col, stroke: INK, sw: 1.8 }), line([[-w / 2, -h + 4], [w / 2, -h + 4]], { stroke: INK, sw: 0.8, opacity: 0.4 }), line([[-w / 2, -4], [w / 2, -4]], { stroke: INK, sw: 0.8, opacity: 0.4 }), ...stains(w, h, c.stain), ...drips(w, c.wet, n(s, 'phase', 0))], { scale: c.scale, scaleY: 1 - 0.3 * fold }); },
  },
  dress: {
    defaults: { folded: 0, hanging: 0, wrinkled: 0, wet: 0, stain: 0, shrink: 0, faded: 0, phase: 0 }, grip: [0, -16], mouth: [0, -34],
    draw: (s, col) => { const c = common(s, color(col ?? C.pink)); const w = 28, h = 34;
      if (c.folded > 0.6) return g([foldedStack(c.col, w, (c.folded - 0.6) / 0.4)], { scale: c.scale });
      const fold = c.folded / 0.6;
      return g([path(`M-8 ${r1(-h)} h16 l2 10 l${r1(w / 2 - 10)} ${r1(h - 10)} h${r1(-w)} l${r1(w / 2 - 10)} ${r1(-(h - 10))} Z`, { fill: c.col, stroke: INK, sw: 1.8 }), path(`M-4 ${r1(-h + 1)} q4 4 8 0`, { fill: 'none', stroke: INK, sw: 1 }), ...wrinkles(w * 0.6, h, c.wr), ...stains(w * 0.6, h, c.stain), ...drips(w * 0.6, c.wet, n(s, 'phase', 0))], { scale: c.scale, scaleY: 1 - 0.3 * fold }); },
  },
  jacket: {
    defaults: { folded: 0, hanging: 0, wrinkled: 0, wet: 0, stain: 0, shrink: 0, faded: 0, phase: 0 }, grip: [0, -14], mouth: [0, -30],
    draw: (s, col) => { const c = common(s, color(col ?? C.orange)); const w = 32, h = 30;
      if (c.folded > 0.6) return g([foldedStack(c.col, w, (c.folded - 0.6) / 0.4)], { scale: c.scale });
      const fold = c.folded / 0.6;
      return g([path(shirtPath(w, h), { fill: c.col, stroke: INK, sw: 1.8 }), line([[0, -h + 4], [0, -2]], { stroke: INK, sw: 1.2 }), circle(0, -h + 10, 1, { fill: INK }), circle(0, -h + 17, 1, { fill: INK }), ...wrinkles(w * 0.55, h, c.wr), ...stains(w * 0.55, h, c.stain)], { scale: c.scale, scaleX: 1 - 0.3 * fold, scaleY: 1 - 0.25 * fold }); },
  },
};
void ellipse;

export const GARMENTS: Record<string, PropSpec> = Object.fromEntries(Object.entries(G).map(([k, v]) => [`garment.${k}`, v]));
