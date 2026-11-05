/**
 * FrameTree – the renderer-independent description of one picture. Pure data,
 * serialisable, produced by `renderFrame` and consumed by the React player and
 * the SVG string renderer (and by layout checks in tests).
 */
export type Transform = { x?: number; y?: number; rotate?: number; scale?: number; scaleX?: number; scaleY?: number; px?: number; py?: number };
export type Paint = { fill?: string; stroke?: string; sw?: number; opacity?: number; dash?: string; linecap?: 'round' | 'butt' };
export type FrameNode =
  | ({ type: 'g'; id?: string; t?: Transform; opacity?: number; children: FrameNode[]; clip?: { x: number; y: number; w: number; h: number; rx?: number } })
  | ({ type: 'path'; d: string } & Paint)
  | ({ type: 'circle'; cx: number; cy: number; r: number } & Paint)
  | ({ type: 'ellipse'; cx: number; cy: number; rx: number; ry: number } & Paint)
  | ({ type: 'rect'; x: number; y: number; w: number; h: number; rx?: number } & Paint)
  | ({ type: 'line'; points: [number, number][] } & Paint)
  | ({ type: 'text'; x: number; y: number; text: string; size: number; weight?: number; anchor?: 'start' | 'middle' | 'end' } & Paint);

export type Frame = { w: number; h: number; bg: string; rx: number; root: FrameNode };

export const g = (children: FrameNode[], t?: Transform, extra?: { id?: string; opacity?: number; clip?: { x: number; y: number; w: number; h: number; rx?: number } }): FrameNode => ({ type: 'g', children, ...(t ? { t } : {}), ...extra });
export const path = (d: string, p: Paint = {}): FrameNode => ({ type: 'path', d, ...p });
export const circle = (cx: number, cy: number, r: number, p: Paint = {}): FrameNode => ({ type: 'circle', cx, cy, r, ...p });
export const ellipse = (cx: number, cy: number, rx: number, ry: number, p: Paint = {}): FrameNode => ({ type: 'ellipse', cx, cy, rx, ry, ...p });
export const rect = (x: number, y: number, w: number, h: number, p: Paint & { rx?: number } = {}): FrameNode => ({ type: 'rect', x, y, w, h, ...p });
export const line = (points: [number, number][], p: Paint = {}): FrameNode => ({ type: 'line', points, linecap: 'round', ...p });
export const text = (x: number, y: number, s: string, size: number, p: Paint & { weight?: number; anchor?: 'start' | 'middle' | 'end' } = {}): FrameNode => ({ type: 'text', x, y, text: s, size, ...p });

export const r1 = (n: number): number => Math.round(n * 10) / 10;
export const r2 = (n: number): number => Math.round(n * 100) / 100;

/** Transform as an SVG attribute string. Rounded so that output is stable. */
export function transformAttr(t?: Transform): string {
  if (!t) return '';
  const parts: string[] = [];
  if (t.x || t.y) parts.push(`translate(${r2(t.x ?? 0)} ${r2(t.y ?? 0)})`);
  if (t.rotate) parts.push(t.px !== undefined || t.py !== undefined ? `rotate(${r2(t.rotate)} ${r2(t.px ?? 0)} ${r2(t.py ?? 0)})` : `rotate(${r2(t.rotate)})`);
  if (t.scale !== undefined && t.scale !== 1) parts.push(`scale(${r2(t.scale)})`);
  if (t.scaleX !== undefined || t.scaleY !== undefined) parts.push(`scale(${r2(t.scaleX ?? 1)} ${r2(t.scaleY ?? 1)})`);
  return parts.join(' ');
}

/** Approximate axis-aligned bounding box of a node (ignores stroke width), in parent coordinates. */
export function bbox(node: FrameNode): { x1: number; y1: number; x2: number; y2: number } | null {
  const pts: [number, number][] = [];
  const push = (x: number, y: number) => pts.push([x, y]);
  switch (node.type) {
    case 'g': {
      for (const c of node.children) {
        const b = bbox(c);
        if (!b) continue;
        for (const [x, y] of [[b.x1, b.y1], [b.x2, b.y1], [b.x1, b.y2], [b.x2, b.y2]] as [number, number][]) {
          const [tx, ty] = applyTransform(node.t, x, y);
          push(tx, ty);
        }
      }
      break;
    }
    case 'circle': push(node.cx - node.r, node.cy - node.r); push(node.cx + node.r, node.cy + node.r); break;
    case 'ellipse': push(node.cx - node.rx, node.cy - node.ry); push(node.cx + node.rx, node.cy + node.ry); break;
    case 'rect': push(node.x, node.y); push(node.x + node.w, node.y + node.h); break;
    case 'line': for (const p of node.points) push(p[0], p[1]); break;
    case 'text': push(node.x - node.size * node.text.length * 0.3, node.y - node.size); push(node.x + node.size * node.text.length * 0.3, node.y); break;
    case 'path': for (const p of pathPoints(node.d)) push(p[0], p[1]); break;
  }
  if (!pts.length) return null;
  return { x1: Math.min(...pts.map((p) => p[0])), y1: Math.min(...pts.map((p) => p[1])), x2: Math.max(...pts.map((p) => p[0])), y2: Math.max(...pts.map((p) => p[1])) };
}

export function applyTransform(t: Transform | undefined, x: number, y: number): [number, number] {
  if (!t) return [x, y];
  let px = x, py = y;
  const sx = t.scale ?? t.scaleX ?? 1, sy = t.scale ?? t.scaleY ?? 1;
  px *= sx; py *= sy;
  if (t.rotate) {
    const a = (t.rotate * Math.PI) / 180, ox = t.px ?? 0, oy = t.py ?? 0;
    const dx = px - ox, dy = py - oy;
    px = ox + dx * Math.cos(a) - dy * Math.sin(a);
    py = oy + dx * Math.sin(a) + dy * Math.cos(a);
  }
  return [px + (t.x ?? 0), py + (t.y ?? 0)];
}

/** Find a node by id (depth first). */
export function findNode(node: FrameNode, id: string): FrameNode | null {
  if (node.type === 'g') {
    if (node.id === id) return node;
    for (const c of node.children) { const f = findNode(c, id); if (f) return f; }
  }
  return null;
}

/** World-space bbox of the node with the given id (ancestor transforms applied). */
export function bboxOfId(root: FrameNode, id: string): { x1: number; y1: number; x2: number; y2: number } | null {
  const walk = (node: FrameNode, chain: Transform[]): { x1: number; y1: number; x2: number; y2: number } | null => {
    if (node.type !== 'g') return null;
    if (node.id === id) {
      const b = bbox(node); if (!b) return null;
      let pts: [number, number][] = [[b.x1, b.y1], [b.x2, b.y1], [b.x1, b.y2], [b.x2, b.y2]];
      for (let i = chain.length - 1; i >= 0; i--) pts = pts.map(([x, y]) => applyTransform(chain[i], x, y));
      return { x1: Math.min(...pts.map((p) => p[0])), y1: Math.min(...pts.map((p) => p[1])), x2: Math.max(...pts.map((p) => p[0])), y2: Math.max(...pts.map((p) => p[1])) };
    }
    for (const c of node.children) { const f = walk(c, [...chain, ...(node.t ? [node.t] : [])]); if (f) return f; }
    return null;
  };
  return walk(root, []);
}

/** Points touched by an SVG path (end points and control points), with relative commands resolved. */
export function pathPoints(d: string): [number, number][] {
  const out: [number, number][] = [];
  const tokens = d.match(/[MmLlHhVvCcQqZzAaSsTt]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  let cmd = 'M', x = 0, y = 0, sx = 0, sy = 0, i = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    const tok = tokens[i]!;
    if (/[A-Za-z]/.test(tok)) { cmd = tok; i++; if (cmd === 'Z' || cmd === 'z') { x = sx; y = sy; } continue; }
    const rel = cmd === cmd.toLowerCase();
    switch (cmd.toUpperCase()) {
      case 'M': case 'L': case 'T': { const nx = num(), ny = num(); x = rel ? x + nx : nx; y = rel ? y + ny : ny; out.push([x, y]); if (cmd.toUpperCase() === 'M') { sx = x; sy = y; cmd = rel ? 'l' : 'L'; } break; }
      case 'H': { const nx = num(); x = rel ? x + nx : nx; out.push([x, y]); break; }
      case 'V': { const ny = num(); y = rel ? y + ny : ny; out.push([x, y]); break; }
      case 'C': { const pts = [num(), num(), num(), num(), num(), num()]; for (let k = 0; k < 6; k += 2) out.push([rel ? x + pts[k]! : pts[k]!, rel ? y + pts[k + 1]! : pts[k + 1]!]); x = out[out.length - 1]![0]; y = out[out.length - 1]![1]; break; }
      case 'Q': case 'S': { const pts = [num(), num(), num(), num()]; for (let k = 0; k < 4; k += 2) out.push([rel ? x + pts[k]! : pts[k]!, rel ? y + pts[k + 1]! : pts[k + 1]!]); x = out[out.length - 1]![0]; y = out[out.length - 1]![1]; break; }
      case 'A': { num(); num(); num(); num(); num(); const nx = num(), ny = num(); x = rel ? x + nx : nx; y = rel ? y + ny : ny; out.push([x, y]); break; }
      default: i++;
    }
  }
  return out;
}
