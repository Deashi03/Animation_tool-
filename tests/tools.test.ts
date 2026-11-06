import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadScenes } from '../src/tools/scenes';
import { buildReport } from '../src/tools/report';
import { exportPackage } from '../src/tools/export';
import { TEMPLATES } from '../src/compiler/templates';
import { validateScene } from '../src/compiler/validate';
import { posterSvg, stripHtml, compareHtml } from '../src/tools/render';

const { scenes } = loadScenes();
describe('tools', () => {
  it('report counts statuses and kinds', () => {
    const r = buildReport(scenes);
    expect(r.total).toBe(scenes.size); expect(r.byKind.word).toBeGreaterThan(5); expect(r.byKind.ui).toBeGreaterThanOrEqual(2); expect(r.invalid).toEqual([]);
  });
  it('every template produces a valid scene', () => {
    for (const [name, tpl] of Object.entries(TEMPLATES)) {
      const v = validateScene(tpl.make('s.test.1', 'test', '1'));
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

describe('reliability machinery', () => {
  it('template contracts: a scene must satisfy its family; has-features parse actions, icons, counts and CJK text', () => {
    const base = { schemaVersion: 1, animationId: 'anim.t.1', senseId: 's.t.1', titleSv: 't', durationMs: 1000, actors: [{ id: 'p', at: { x: 60, y: 100 } }] };
    const loco = validateScene({ ...base, template: 'locomotion', timeline: [{ t: 0, action: 'idle', actor: 'p', durationMs: 900 }] });
    expect(loco.problems.some((p) => p.level === 'error' && /template "locomotion" requires has:action/.test(p.message))).toBe(true);
    const ok = validateScene({ ...base, template: 'locomotion', timeline: [{ t: 0, action: 'walk', actor: 'p', to: { x: 90, y: 100 }, durationMs: 1000 }] });
    expect(ok.problems.filter((p) => p.level === 'error')).toEqual([]);
    expect(validateScene({ ...base, template: 'nope' }).problems.some((p) => /unknown template/.test(p.message))).toBe(true);
    expect(validateScene({ ...base }).problems.some((p) => /no template/.test(p.message))).toBe(true);
    const approved = validateScene({ ...base, template: 'locomotion', timeline: [{ t: 0, action: 'walk', actor: 'p', to: { x: 90, y: 100 }, durationMs: 1000 }] }, new Map(), { approvedTemplates: new Set(['emotion']) });
    expect(approved.problems.some((p) => /not yet approved/.test(p.message))).toBe(true);
  });
  it('a quiz poster must not show the Japanese word', () => {
    const base = { schemaVersion: 1, animationId: 'anim.t.1', senseId: 's.t.1', titleSv: 't', durationMs: 2000, template: 'relation-arrow',
      props: [{ id: 'box', asset: 'box', at: { x: 62, y: 100 }, z: 2 }, { id: 'ball', asset: 'ball', at: { x: 85, y: 100 }, z: 1 }],
      shapes: [{ type: 'icon', id: 'arc', icon: 'arc-arrow', x: 62, y: 62, size: 44 }, { type: 'text', id: 'ja', x: 100, y: 40, text: '後ろ', size: 12, bg: 'panel', opacity: 0 }],
      timeline: [{ t: 1000, action: 'set', target: 'ja', prop: 'opacity', value: 1 }] };
    const bad = validateScene({ ...base, posterMs: 1500, pedagogy: { quizEligible: true } });
    expect(bad.problems.some((p) => p.level === 'error' && /Japanese text/.test(p.message))).toBe(true);
    const good = validateScene({ ...base, posterMs: 500, pedagogy: { quizEligible: true } });
    expect(good.problems.filter((p) => /Japanese text/.test(p.message))).toEqual([]);
    const notQuiz = validateScene({ ...base, posterMs: 1500, pedagogy: { quizEligible: false } });
    expect(notQuiz.problems.filter((p) => /Japanese text/.test(p.message))).toEqual([]);
  });
  it('the planner classifies a module from a Swechan-shaped fixture and strips furigana', async () => {
    const { buildPlan, stripFurigana } = await import('../src/tools/plan');
    expect(stripFurigana('{栽培|さいばい}する、{育|そだ}てる')).toBe('栽培する、育てる');
    expect(stripFurigana('（フライパンで）{焼|や}く')).toBe('焼く');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'swechan-fixture-'));
    fs.mkdirSync(path.join(dir, 'src/content/data/dictionary'), { recursive: true }); fs.mkdirSync(path.join(dir, 'src/content/data/modules'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'src/content/data/dictionary/x.json'), JSON.stringify({ entries: [
      { id: 'e.springa', lemma: 'springa', pos: 'verb', senses: [{ id: 's.springa.1', ja: '{走|はし}る', synonyms: [{ senseId: 's.gå.1', relation: 'antonym' }] }] },
      { id: 'e.gå', lemma: 'gå', pos: 'verb', senses: [{ id: 's.gå.1', ja: '{歩|ある}く' }] },
      { id: 'e.kofta', lemma: 'kofta', pos: 'noun', senses: [{ id: 's.kofta.1', ja: 'カーディガン' }] },
      { id: 'e.randig', lemma: 'randig', pos: 'adjective', senses: [{ id: 's.randig.1', ja: '{縞|しま}の' }] },
      { id: 'e.arg', lemma: 'arg', pos: 'adjective', senses: [{ id: 's.arg.1', ja: '{怒|おこ}った' }] },
      { id: 'e.flyttning', lemma: 'flyttning', pos: 'noun', senses: [{ id: 's.flyttning.1', ja: '{引|ひ}っ{越|こ}し' }] },
    ] }));
    fs.writeFileSync(path.join(dir, 'src/content/data/modules/m.json'), JSON.stringify({ id: 'm.test', titleSv: 'Test', words: ['s.springa.1', 's.gå.1', 's.kofta.1', 's.randig.1', 's.arg.1', 's.flyttning.1'].map((senseId) => ({ senseId, active: true })) }));
    const plan = buildPlan(dir, 'm.test', new Map([['s.springa.1', 'anim.springa.1']]));
    const by = Object.fromEntries(plan.rows.map((r) => [r.lemma, r]));
    expect(by.springa).toMatchObject({ kind: 'animation', template: 'locomotion', existingAnimation: 'anim.springa.1', jaGloss: '走る' });
    expect(by.springa!.contrast).toContain('s.gå.1');
    expect(by.kofta).toMatchObject({ kind: 'image' }); expect(by.randig).toMatchObject({ kind: 'image' });
    expect(by.arg).toMatchObject({ kind: 'animation', template: 'emotion' });
    expect(by.flyttning).toMatchObject({ kind: 'animation', template: 'event', confidence: 'low' });
    fs.rmSync(dir, { recursive: true, force: true });
  });
  it('blind test: key is hidden from the questions, grading is exact and recorded', async () => {
    const { makeBlindBatch, gradeBlind } = await import('../src/tools/blind');
    const reg = await import('../src/tools/registry');
    const cwd = process.cwd(); const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'blind-')); process.chdir(tmp);
    try {
      const { questions, key } = await makeBlindBatch(scenes, ['anim.slappa.1', 'anim.sova.1'], 'test');
      const q = fs.readFileSync(questions, 'utf8'); expect(q).not.toMatch(/anim\./); expect(q).toMatch(/slappa/); expect(q).toMatch(/sova/);
      const k = JSON.parse(fs.readFileSync(key, 'utf8')) as import('../src/tools/blind').BlindKey;
      const answers = Object.fromEntries(k.items.map((it) => [it.letter, { choice: it.animationId === 'anim.sova.1' ? 'sova' : 'vila', description: 'x' }]));
      const g = gradeBlind(k, answers, 'test');
      expect(g.total).toBe(2); expect(g.passed).toBe(1);
      expect(reg.blindStatus('anim.sova.1')?.passed).toBe(true); expect(reg.blindStatus('anim.slappa.1')?.passed).toBe(false);
    } finally { process.chdir(cwd); fs.rmSync(tmp, { recursive: true, force: true }); }
  });
});

describe('recipes and the bearer rule', () => {
  it('every recipe in registry/recipes.json builds a scene that validates (the word-function presets are complete)', async () => {
    const { loadRecipes } = await import('../src/tools/coverage');
    const { draftScene } = await import('../src/tools/batch');
    const { validateScene } = await import('../src/compiler/validate');
    const R = loadRecipes(); const bad: string[] = []; let n = 0;
    for (const [key, rec] of Object.entries(R)) {
      if (rec.template === 'image') continue;
      const lemma = key.startsWith('s.') ? key.split('.')[1]! : key; const senseId = key.startsWith('s.') ? key : `s.${lemma.replace(/ /g, '-')}.1`;
      const row = { senseId, lemma, pos: 'verb', defSv: 'def', kind: 'animation' as const, confidence: 'high' as const, contrast: [], jaGloss: 'テスト', note: '' };
      const d = draftScene(row, rec, 'test', new Map());
      if (!d) { bad.push(`${key}: cannot be built (${rec.template})`); continue; }
      const errs = validateScene(d as unknown).problems.filter((p) => p.level === 'error').map((p) => p.message);
      if (errs.length) bad.push(`${key}: ${errs[0]}`); else n++;
    }
    expect(bad).toEqual([]); expect(n).toBeGreaterThan(500);
  }, 120_000);

  it('a word scene where a person only says the word has no bearer and is rejected', async () => {
    const { validateScene } = await import('../src/compiler/validate');
    const base = { schemaVersion: 1, animationId: 'anim.vass.1', senseId: 's.vass.1', titleSv: 'vass', template: 'attribute-gloss', meaningHint: 'x', category: 'property', durationMs: 2000, loop: true, holdMs: 300, posterMs: 1500, environment: { id: 'room', time: 'day' },
      actors: [{ id: 'p', variant: 'a', at: { x: 60, y: 100 }, facing: 'right' }], props: [], timeline: [{ t: 0, action: 'say', actor: 'p', text: '鋭い', durationMs: 1800 }], focus: { targets: ['p'] }, pedagogy: { quizEligible: false, group: 'x', confusableWith: [] } };
    const v = validateScene(base as unknown);
    expect(v.problems.some((p) => p.level === 'error' && /saknar bärare/.test(p.message))).toBe(true);
    const withKnife = { ...base, props: [{ id: 'k', asset: 'tool.knife', at: { x: 60, y: 60 }, rotate: 90, scale: 1.5 }], timeline: [...base.timeline, { t: 200, action: 'emphasis', target: 'k', kind: 'glint', durationMs: 900 }] };
    expect(validateScene(withKnife as unknown).problems.some((p) => p.level === 'error' && /saknar bärare/.test(p.message))).toBe(false);
  });
});
