/** FrameTree → SVG markup string (Node and browser). Escapes all text. */
import { transformAttr, type Frame, type FrameNode, r2 } from './frame';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const paint = (n: { fill?: string; stroke?: string; sw?: number; opacity?: number; dash?: string; linecap?: string }, defaultFill = 'none'): string => {
  let s = ` fill="${esc(n.fill ?? defaultFill)}"`;
  if (n.stroke) s += ` stroke="${esc(n.stroke)}" stroke-width="${r2(n.sw ?? 1)}" stroke-linejoin="round" stroke-linecap="${n.linecap ?? 'round'}"`;
  if (n.opacity !== undefined && n.opacity !== 1) s += ` opacity="${r2(n.opacity)}"`;
  if (n.dash) s += ` stroke-dasharray="${esc(n.dash)}"`;
  return s;
};
export function nodeToSvg(n: FrameNode): string {
  switch (n.type) {
    case 'g': {
      const tr = transformAttr(n.t);
      const attrs = `${tr ? ` transform="${tr}"` : ''}${n.opacity !== undefined && n.opacity !== 1 ? ` opacity="${r2(n.opacity)}"` : ''}${n.id ? ` data-id="${esc(n.id)}"` : ''}`;
      return `<g${attrs}>${n.children.map(nodeToSvg).join('')}</g>`;
    }
    case 'path': return `<path d="${esc(n.d)}"${paint(n)}/>`;
    case 'circle': return `<circle cx="${r2(n.cx)}" cy="${r2(n.cy)}" r="${r2(n.r)}"${paint(n)}/>`;
    case 'ellipse': return `<ellipse cx="${r2(n.cx)}" cy="${r2(n.cy)}" rx="${r2(n.rx)}" ry="${r2(n.ry)}"${paint(n)}/>`;
    case 'rect': return `<rect x="${r2(n.x)}" y="${r2(n.y)}" width="${r2(n.w)}" height="${r2(n.h)}"${n.rx ? ` rx="${r2(n.rx)}"` : ''}${paint(n)}/>`;
    case 'line': return `<path d="M${n.points.map((p) => `${r2(p[0])} ${r2(p[1])}`).join(' L')}"${paint({ ...n, fill: 'none' })}/>`;
    case 'text': return `<text x="${r2(n.x)}" y="${r2(n.y)}" font-family="system-ui, -apple-system, 'Hiragino Sans', sans-serif" font-size="${r2(n.size)}" font-weight="${n.weight ?? 600}" text-anchor="${n.anchor ?? 'start'}"${paint(n, '#2b2a33')}>${esc(n.text)}</text>`;
  }
}
export function frameToSvg(f: Frame, opts: { width?: number; height?: number; ariaLabel?: string } = {}): string {
  const size = opts.width ? ` width="${opts.width}" height="${opts.height ?? Math.round((opts.width * f.h) / f.w)}"` : '';
  const bg = f.bg === 'transparent' ? '' : `<rect width="${f.w}" height="${f.h}" rx="${f.rx}" fill="${esc(f.bg)}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f.w} ${f.h}"${size} role="img"${opts.ariaLabel ? ` aria-label="${esc(opts.ariaLabel)}"` : ' aria-hidden="true"'}>${bg}${nodeToSvg(f.root)}</svg>`;
}
