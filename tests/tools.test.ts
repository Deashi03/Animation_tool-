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

describe('gestures and manner (after the ursäkta/försiktig review)', () => {
  it('a gesture icon in a bubble without a bodily action is rejected; with a bow it passes', async () => {
    const { validateScene } = await import('../src/compiler/validate');
    const base = { schemaVersion: 1, animationId: 'anim.ursäkta.9', senseId: 's.ursäkta.9', titleSv: 'ursäkta', template: 'communicate', meaningHint: 'x', category: 'action', durationMs: 3000, loop: true, holdMs: 300, posterMs: 1500, environment: { id: 'room', time: 'day' },
      actors: [{ id: 'p', variant: 'a', at: { x: 30, y: 100 }, facing: 'right' }, { id: 'q', variant: 'b', at: { x: 88, y: 100 }, facing: 'left' }], props: [], timeline: [{ t: 200, action: 'say', actor: 'p', icon: 'palms', mood: 'sad', to: 'q', durationMs: 1500 }], focus: { targets: ['p'] }, pedagogy: { quizEligible: false, group: 'x', confusableWith: [] } };
    expect(validateScene(base as unknown).problems.some((p) => p.level === 'error' && /gest/.test(p.message))).toBe(true);
    const withBow = { ...base, timeline: [{ t: 100, action: 'bow', actor: 'p', depth: 'deep', hands: 'together', to: 'q', durationMs: 2000 }, ...base.timeline] };
    expect(validateScene(withBow as unknown).problems.filter((p) => p.level === 'error')).toEqual([]);
  });
  it('bow bends torso and head forward and straightens again; careful walk is slower than a normal walk', async () => {
    const { compileScene } = await import('../src/compiler/compile');
    const { sampleNumber } = await import('../src/engine/track');
    const { GAITS, gaitSpeed } = await import('../src/motions/index');
    const sc = { schemaVersion: 1, animationId: 'ui.test.bow', senseId: 's.x.1', titleSv: 'x', kind: 'word', template: 'communicate', meaningHint: 'x', category: 'action', durationMs: 3000, loop: false, holdMs: 0, posterMs: 1000, environment: { id: 'room', time: 'day' },
      actors: [{ id: 'p', variant: 'a', at: { x: 40, y: 100 }, facing: 'right' }], props: [], timeline: [{ t: 0, action: 'bow', actor: 'p', depth: 'deep', hands: 'together', durationMs: 2000 }], focus: { targets: ['p'] }, pedagogy: { quizEligible: false, group: 'x', confusableWith: [] } };
    const { Scene } = await import('../src/schema/scene');
    const c = compileScene(Scene.parse(sc));
    expect(sampleNumber(c.tracks, 'p.j.torso', 1000, 0)).toBeGreaterThan(40);
    expect(sampleNumber(c.tracks, 'p.j.head', 1000, 0)).toBeGreaterThan(10);
    expect(Math.abs(sampleNumber(c.tracks, 'p.j.torso', 2100, 0))).toBeLessThan(2);
    expect(gaitSpeed(GAITS.careful)).toBeLessThan(gaitSpeed(GAITS.walk) * 0.5);
  });
  it('batch writes no draft for a recipe marked TODO/weak', async () => {
    const { runBatch } = await import('../src/tools/batch');
    const plan = { moduleId: 'm.test', titleSv: 'Test', rows: [{ senseId: 's.sjunka.1', lemma: 'sjunka', pos: 'verb', defSv: 'x', kind: 'animation' as const, confidence: 'high' as const, contrast: [], jaGloss: '沈む', note: '' }] };
    const res = runBatch(plan as never, 'Test', new Map(), { write: false });
    expect(res[0]!.status).toBe('blocked');
  });
});

describe('recipe generator (anim:recipe)', () => {
  it('reads tool, target and bow out of a definition, respects Swedish word boundaries, and says "manual" honestly', async () => {
    const { inferRecipe, assetsIn } = await import('../src/tools/recipe');
    const skära = inferRecipe({ senseId: 's.skära.1', lemma: 'skära', pos: 'verb', defSv: 'Dela något i bitar med en kniv.', examples: ['Skär tomaten i skivor.'] });
    expect(skära.ok && skära.recipe.template).toBe('tool-rhythm');
    expect(skära.ok && skära.recipe.target).toBe('food.tomato'); // the example names the food
    expect(assetsIn('lägga något på bordet')).not.toContain('food.egg'); // "lägga" must not match ägg
    const urs = inferRecipe({ senseId: 's.ursäkta.1', lemma: 'ursäkta', pos: 'verb', defSv: 'Säga förlåt när man har gjort något fel.' });
    expect(urs.ok && (urs.recipe.say as { icon: string; bow?: string })).toMatchObject({ icon: 'palms', bow: 'deep' });
    const praktisk = inferRecipe({ senseId: 's.praktisk.1', lemma: 'praktisk', pos: 'adjective', defSv: 'Lätt och bra att använda.' });
    expect(praktisk.ok).toBe(false); expect(!praktisk.ok && praktisk.reason).toMatch(/ingen bärare/);
    const mysig = inferRecipe({ senseId: 's.mysig.1', lemma: 'mysig', pos: 'adjective', defSv: 'Skön, varm och trevlig att vara i.' }); // solved 2026-11-06: a room's atmosphere as an arrangement
    expect(mysig.ok && (mysig.recipe.bearer as { extra?: unknown[] }).extra?.length).toBeGreaterThan(1);
    const randig = inferRecipe({ senseId: 's.randig.1', lemma: 'randig', pos: 'adjective', defSv: 'Med ränder.' });
    expect(randig.ok && (randig.recipe.bearer as { kind: string }).kind).toBe('wardrobe');
  });
  it('batch falls back to the generator and hands off manual words with a reason', async () => {
    const { runBatch } = await import('../src/tools/batch');
    const rows = [
      { senseId: 's.testskära.1', lemma: 'testskära', pos: 'verb', defSv: 'Dela något i bitar med en kniv.', examples: ['Skär moroten.'], kind: 'animation' as const, confidence: 'high' as const, contrast: [], jaGloss: '切る', note: '' },
      { senseId: 's.testmysig.1', lemma: 'testmysig', pos: 'adjective', defSv: 'Skön, varm och trevlig att vara i.', kind: 'animation' as const, confidence: 'high' as const, contrast: [], jaGloss: '居心地がいい', note: '' },
    ];
    const res = runBatch({ moduleId: 'm.test', titleSv: 'Test', generatedAt: '2026-11-06', rows } as never, 'Test', new Map(), { write: false });
    expect(res[0]!.status).toBe('created'); expect(res[0]!.note).toMatch(/genererat/);
    expect(res[1]!.status).toBe('manual'); expect(res[1]!.note).toMatch(/MANUELLT/); expect(res[1]!.note).toMatch(/MANUAL_SCENES/);
  });
});

describe('recipe generator rules (regression)', () => {
  it('resolves common word functions and hands off the rest with the right reason', async () => {
    const { inferRecipe } = await import('../src/tools/recipe');
    const v = (lemma: string, pos: string, defSv: string, examples: string[] = []) => inferRecipe({ senseId: `s.${lemma}.1`, lemma, pos, defSv, examples });
    const t = (r: ReturnType<typeof v>) => (r.ok ? `${r.recipe.template}:${r.confidence}` : `manual:${r.reason.split(':')[0]}`);
    expect(t(v('puttra', 'verb', 'Sjuda lugnt och göra ett litet ljud.'))).toBe('process:high');
    expect(t(v('städning', 'noun', 'Att göra rent i ett rum.'))).toBe('tool-rhythm:medium'); // the verb behind the noun
    expect(t(v('märka', 'verb', 'Skriva på något vad det är.'))).toBe('tool-rhythm:low'); // no visible consequence → proposal only
    expect(t(v('möglig', 'adjective', 'Med mögel på.'))).toBe('attribute-gloss:medium');
    expect(t(v('vissen', 'adjective', 'Om växter: torr och svag.', ['Blomman är vissen.']))).toBe('attribute-gloss:high');
    expect(t(v('dela på notan', 'phrase', 'Betala lika mycket var.'))).toBe('communicate:medium');
    expect(t(v('packa upp', 'verb', 'Ta ut sakerna ur lådor eller väskor.'))).toBe('arrange:high');
    expect(t(v('praktisk', 'adjective', 'Lätt och bra att använda.'))).toMatch(/^manual:egenskapen praktisk har ingen bärare/);
    expect(t(v('dammsuga', 'verb', 'Göra rent golvet med en dammsugare.'))).toBe('tool-rhythm:high'); // solved in the hand-off test: tool.vacuum
    expect(t(v('dela', 'verb', 'Ta delar av något och ge till flera.'))).toBe('social:high'); // solved in the hand-off test: split + give
    expect(t(v('skåla', 'verb', 'Höja glasen mot varandra.'))).toMatch(/^manual:skåla/);
  });
});

describe('generated recipes build valid scenes', () => {
  it('every recipe the generator produces for the Swechan dictionary builds a scene that validates (skipped when the clone is absent)', async () => {
    const fs = await import('node:fs');
    const sw = ['/home/user/deashi03/swechan', '../swechan', '../Swechan'].find((d) => fs.existsSync(`${d}/src/content/data/dictionary`));
    if (!sw) return;
    const { inferRecipe, wordsFromSwechan } = await import('../src/tools/recipe');
    const { draftScene } = await import('../src/tools/batch');
    const { validateScene } = await import('../src/compiler/validate');
    const { words } = wordsFromSwechan(sw);
    const bad: string[] = []; let n = 0;
    for (const w of words) {
      if (!['verb', 'phrase', 'adjective', 'adverb', 'preposition', 'noun'].includes(w.pos)) continue;
      const inf = inferRecipe(w, {}); if (!inf.ok || inf.recipe.template === 'image') continue;
      const row = { senseId: w.senseId, lemma: w.lemma, pos: w.pos, defSv: w.defSv, kind: 'animation' as const, confidence: 'high' as const, contrast: [], jaGloss: w.jaGloss || 'テスト', note: '' };
      const d = draftScene(row, inf.recipe, 'test', new Map());
      if (!d) { bad.push(`${w.lemma}: cannot be built (${inf.recipe.template})`); continue; }
      const errs = validateScene(d as unknown).problems.filter((p) => p.level === 'error').map((p) => p.message);
      if (errs.length) bad.push(`${w.lemma}: ${errs[0]}`); else n++;
    }
    expect(bad).toEqual([]); expect(n).toBeGreaterThan(200);
  }, 300_000);
});
