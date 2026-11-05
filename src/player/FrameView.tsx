/** FrameTree → React SVG elements. No innerHTML: scene data never becomes markup. */
import { memo, type ReactElement } from 'react';
import { transformAttr, type Frame, type FrameNode } from '../engine/frame';

function paintProps(n: { fill?: string; stroke?: string; sw?: number; opacity?: number; dash?: string; linecap?: string }, defaultFill = 'none') {
  return {
    fill: n.fill ?? defaultFill,
    ...(n.stroke ? { stroke: n.stroke, strokeWidth: n.sw ?? 1, strokeLinejoin: 'round' as const, strokeLinecap: (n.linecap ?? 'round') as 'round' | 'butt' } : {}),
    ...(n.opacity !== undefined && n.opacity !== 1 ? { opacity: n.opacity } : {}),
    ...(n.dash ? { strokeDasharray: n.dash } : {}),
  };
}
function Node({ n, k }: { n: FrameNode; k: string }): ReactElement {
  switch (n.type) {
    case 'g': {
      const tr = transformAttr(n.t);
      return <g transform={tr || undefined} opacity={n.opacity !== undefined && n.opacity !== 1 ? n.opacity : undefined} data-id={n.id}>{n.children.map((c, i) => <Node n={c} k={`${k}.${i}`} key={i} />)}</g>;
    }
    case 'path': return <path d={n.d} {...paintProps(n)} />;
    case 'circle': return <circle cx={n.cx} cy={n.cy} r={n.r} {...paintProps(n)} />;
    case 'ellipse': return <ellipse cx={n.cx} cy={n.cy} rx={n.rx} ry={n.ry} {...paintProps(n)} />;
    case 'rect': return <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={n.rx} {...paintProps(n)} />;
    case 'line': return <path d={`M${n.points.map((p) => `${p[0]} ${p[1]}`).join(' L')}`} {...paintProps({ ...n, fill: 'none' })} />;
    case 'text': return <text x={n.x} y={n.y} fontFamily="system-ui, -apple-system, 'Hiragino Sans', sans-serif" fontSize={n.size} fontWeight={n.weight ?? 600} textAnchor={n.anchor ?? 'start'} {...paintProps(n, '#2b2a33')}>{n.text}</text>;
  }
}

export const FrameView = memo(function FrameView({ frame, size, label, className, style }: { frame: Frame; size?: number; label?: string; className?: string; style?: React.CSSProperties }) {
  const w = size ?? frame.w, h = size ? Math.round((size * frame.h) / frame.w) : frame.h;
  return (
    <svg viewBox={`0 0 ${frame.w} ${frame.h}`} width={w} height={h} role="img" aria-label={label} aria-hidden={label ? undefined : true} className={className} style={{ display: 'block', ...style }}>
      {frame.bg !== 'transparent' && <rect width={frame.w} height={frame.h} rx={frame.rx} fill={frame.bg} />}
      <Node n={frame.root} k="r" />
    </svg>
  );
});
