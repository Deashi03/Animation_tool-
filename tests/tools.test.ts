import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadScenes } from '../src/tools/scenes';
import { buildReport } from '../src/tools/report';
import { exportPackage } from '../src/tools/export';
import { TEMPLATES } from '../src/tools/templates';
import { validateScene } from '../src/compiler/validate';
import { posterSvg, stripHtml, compareHtml } from '../src/tools/render';

const { scenes } = loadScenes();
describe('tools', () => {
  it('report counts statuses and kinds', () => {
    const r = buildReport(scenes);
    expect(r.total).toBe(scenes.size); expect(r.byKind.word).toBeGreaterThan(5); expect(r.byKind.ui).toBeGreaterThanOrEqual(2); expect(r.invalid).toEqual([]);
  });
  it('every template produces a valid scene', () => {
    for (const [name, make] of Object.entries(TEMPLATES)) {
      const v = validateScene(make('s.test.1', 'test', '1'));
      expect(v.problems.filter((p) => p.level === 'error'), name).toEqual([]);
    }
  });
  it('export writes an index, one file per animation and posters; re-export is identical', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'anim-export-'));
    const r = exportPackage(scenes, dir);
    expect(r.files).toBe(scenes.size);
    const idx = JSON.parse(fs.readFileSync(path.join(dir, 'animations.index.json'), 'utf8')) as { animations: { animationId: string; file: string; poster: string; bytes: number }[] };
    for (const e of idx.animations) { expect(fs.existsSync(path.join(dir, e.file))).toBe(true); expect(fs.existsSync(path.join(dir, e.poster))).toBe(true); expect(e.bytes).toBeLessThan(6000); }
    const first = fs.readFileSync(path.join(dir, 'animations.index.json'), 'utf8');
    exportPackage(scenes, dir);
    expect(fs.readFileSync(path.join(dir, 'animations.index.json'), 'utf8')).toBe(first);
    fs.rmSync(dir, { recursive: true, force: true });
  });
  it('review html contains the frames', () => {
    const s = scenes.get('anim.springa.1')!;
    expect(posterSvg(s)).toMatch(/^<svg/);
    expect((stripHtml(s, { frames: 6 }).match(/<svg/g) ?? []).length).toBe(6);
    expect(compareHtml(s, scenes.get('anim.gå.1')!, { frames: 4 })).toContain('anim.gå.1');
  });
});
