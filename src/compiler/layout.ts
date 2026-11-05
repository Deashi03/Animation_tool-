/** Layout checks on the rendered frames: focus entities inside the canvas, feet on the ground, non-empty frames. */
import { renderFrame } from '../engine/render';
import { bboxOfId, findNode } from '../engine/frame';
import type { CompiledScene } from './compile';
import type { Problem } from './validate';
import { sampleNumber } from '../engine/track';

export function checkLayout(c: CompiledScene): Problem[] {
  const out: Problem[] = [];
  const { w, h } = c.scene.canvas;
  const samples = [0, 0.25, 0.5, 0.75, 1].map((u) => Math.round(c.durationMs * u));
  const focus = c.scene.focus?.targets.length ? c.scene.focus.targets : c.scene.actors.map((a) => a.id);
  for (const t of samples) {
    const frame = renderFrame(c, t);
    for (const id of focus) {
      const node = findNode(frame.root, `entity.${id}`);
      if (!node) { out.push({ level: 'error', message: `t=${t}: focus entity "${id}" is not rendered` }); continue; }
      const b = bboxOfId(frame.root, `entity.${id}`);
      if (!b) continue;
      const m = 4;
      if (b.x1 < -m || b.y1 < -m || b.x2 > w + m || b.y2 > h + m) out.push({ level: 'error', message: `t=${t}: "${id}" is cut off (bbox ${[b.x1, b.y1, b.x2, b.y2].map((n) => n.toFixed(0)).join(',')} vs canvas ${w}×${h})` });
    }
  }
  for (const a of c.scene.actors) {
    for (const t of samples) {
      const lift = sampleNumber(c.tracks, `${a.id}.lift`, t, 0), rot = sampleNumber(c.tracks, `${a.id}.bodyRotate`, t, 0), y = sampleNumber(c.tracks, `${a.id}.y`, t, c.ground), thigh = sampleNumber(c.tracks, `${a.id}.j.thighL`, t, 0);
      if (Math.abs(rot) < 1 && Math.abs(lift) < 0.01 && thigh < 45 && y > c.ground + 12 && c.scene.environment.id !== 'neutral') out.push({ level: 'warning', message: `t=${t}: actor "${a.id}" stands below the ground line (y=${y.toFixed(0)}, ground=${c.ground})` });
    }
  }
  return out;
}
