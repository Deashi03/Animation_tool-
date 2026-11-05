import { Scene, formatIssues } from '../src/schema/scene';
import { validateScene } from '../src/compiler/validate';
import { loadScenes } from '../src/tools/scenes';
import { migrateScene } from '../src/schema/migrate';

const base = { schemaVersion: 1, animationId: 'anim.test.1', senseId: 's.test.1', titleSv: 'test', durationMs: 1000, actors: [{ id: 'p', at: { x: 60, y: 100 } }] };

describe('scene schema', () => {
  it('accepts a minimal word scene and fills defaults', () => {
    const s = Scene.parse(base);
    expect(s.kind).toBe('word'); expect(s.loop).toBe(true); expect(s.canvas).toEqual({ w: 120, h: 120 }); expect(s.pedagogy.reviewStatus).toBe('ai-draft');
  });
  it('rejects unknown actions, actors, props and fields with readable messages', () => {
    const r = Scene.safeParse({ ...base, timeline: [{ t: 0, action: 'teleport', actor: 'p' }], extra: 1 });
    expect(r.success).toBe(false);
    const msgs = formatIssues(r.success ? (null as never) : r.error).join('\n');
    expect(msgs).toMatch(/timeline\[0\]/); expect(msgs).toMatch(/Unrecognized key|extra/);
    const r2 = Scene.safeParse({ ...base, timeline: [{ t: 0, action: 'walk', actor: 'ghost', to: { x: 1, y: 1 } }, { t: 0, action: 'open', actor: 'p', prop: 'nope' }] });
    expect(r2.success).toBe(false);
    const m2 = r2.success ? '' : formatIssues(r2.error).join('\n');
    expect(m2).toMatch(/unknown actor "ghost"/); expect(m2).toMatch(/unknown prop "nope"/);
  });
  it('rejects times beyond the scene, duplicate ids, code and markup', () => {
    expect(Scene.safeParse({ ...base, timeline: [{ t: 2000, action: 'idle', actor: 'p', durationMs: 100 }] }).success).toBe(false);
    expect(Scene.safeParse({ ...base, actors: [{ id: 'p', at: { x: 1, y: 1 } }, { id: 'p', at: { x: 2, y: 2 } }] }).success).toBe(false);
    expect(Scene.safeParse({ ...base, shapes: [{ type: 'text', id: 't', x: 0, y: 0, text: '<script>alert(1)</script>'.repeat(3), size: 10 }] }).success).toBe(false);
    expect(Scene.safeParse({ ...base, posterMs: 5000 }).success).toBe(false);
  });
  it('reviewed status needs reviewer and date (never set by AI)', () => {
    expect(Scene.safeParse({ ...base, pedagogy: { reviewStatus: 'reviewed' } }).success).toBe(false);
    expect(Scene.safeParse({ ...base, pedagogy: { reviewStatus: 'reviewed', reviewer: 'J', date: '2026-11-05' } }).success).toBe(true);
  });
  it('migrates a version-less scene forward without changing a current one', () => {
    const s = Scene.parse(base);
    expect(migrateScene(s)).toEqual(s);
  });
  it('every bundled scene is technically valid', () => {
    const { scenes, invalid } = loadScenes();
    expect(invalid).toEqual([]);
    expect(scenes.size).toBeGreaterThanOrEqual(12);
    for (const [id, s] of scenes) {
      const v = validateScene(s, scenes);
      expect(v.problems.filter((p) => p.level === 'error'), id).toEqual([]);
    }
  });
  it('the seven phase-1 words and their contrast partners exist', () => {
    const { scenes } = loadScenes();
    for (const id of ['anim.springa.1', 'anim.hoppa.1', 'anim.öppna.1', 'anim.hälla.1', 'anim.bakom.1', 'anim.slappa.1', 'anim.sportig.1', 'anim.sova.1', 'anim.gå.1', 'anim.stänga.1']) expect(scenes.has(id), id).toBe(true);
  });
});
