/** Swechan package: a small index + one file per animation + poster SVGs. */
import fs from 'node:fs';
import path from 'node:path';
import type { Scene } from '../schema/scene';
import { posterSvg } from './render';
import { compileScene } from '../compiler/compile';

export function exportPackage(scenes: Map<string, Scene>, outDir: string): { index: unknown; files: number } {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, 'anim'), { recursive: true }); fs.mkdirSync(path.join(outDir, 'poster'), { recursive: true });
  const entries = [];
  for (const [id, s] of [...scenes].sort(([a], [b]) => a.localeCompare(b))) {
    const file = path.join(outDir, 'anim', `${id}.json`);
    fs.writeFileSync(file, JSON.stringify(s));
    const poster = posterSvg(s, 180);
    fs.writeFileSync(path.join(outDir, 'poster', `${id}.svg`), poster);
    const c = compileScene(s);
    entries.push({ animationId: id, kind: s.kind, senseId: s.senseId ?? null, titleSv: s.titleSv, category: s.category, quiz: s.pedagogy.quizEligible, group: s.pedagogy.group ?? null, confusableWith: s.pedagogy.confusableWith, reviewStatus: s.pedagogy.reviewStatus, durationMs: s.durationMs, posterMs: c.posterMs, canvas: s.canvas, bytes: fs.statSync(file).size, file: `anim/${id}.json`, poster: `poster/${id}.svg` });
  }
  const index = { format: 'animation-tool-package', version: 1, generatedAt: '', count: entries.length, animations: entries };
  fs.writeFileSync(path.join(outDir, 'animations.index.json'), JSON.stringify(index, null, 2));
  return { index, files: entries.length };
}
