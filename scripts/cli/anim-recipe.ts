/**
 * anim:recipe – generate recipes from Swechan's dictionary and say honestly where the tool cannot.
 *   npm run anim:recipe -- --swechan ../swechan --module m.x [--write registry/recipes.generated.json]
 *   npm run anim:recipe -- --swechan ../swechan --all --compare        → agreement with the hand-written recipes
 */
import fs from 'node:fs';
import path from 'node:path';
import { inferRecipe, compareRecipes, wordsFromSwechan } from '../../src/tools/recipe';
import { loadRecipes, type Recipe } from "../../src/tools/coverage";
import { registryDir } from '../../src/tools/registry';
import { opt, flag, fail } from './_shared';

const sw = opt('swechan') ?? fail('Ange --swechan <klon>');
const { words, title } = wordsFromSwechan(path.resolve(sw), flag('all') ? undefined : (opt('module') ?? fail('Ange --module m.x eller --all')));
const hand = loadRecipes();
const NEEDS = new Set(['verb', 'phrase', 'adjective', 'adverb', 'preposition']);
const rows = words.filter((w) => NEEDS.has(w.pos) || /(ning|ande|else|flytt|fest|möte|match|lek|resa|städ|tvätt|fika|middag|frukost|lunch)$/u.test(w.lemma)).map((w) => ({ w, inf: inferRecipe(w, hand), hand: hand[w.senseId] ?? hand[w.lemma] }));
const ok = rows.filter((r) => r.inf.ok), manual = rows.filter((r) => !r.inf.ok);
const byConf = { high: ok.filter((r) => r.inf.ok && r.inf.confidence === 'high').length, medium: ok.filter((r) => r.inf.ok && r.inf.confidence === 'medium').length, low: ok.filter((r) => r.inf.ok && r.inf.confidence === 'low').length };
console.log(`${title}: ${rows.length} ord · recept ${ok.length} (hög ${byConf.high}, medel ${byConf.medium}, låg ${byConf.low}) · manuellt ${manual.length}`);
if (flag('compare')) {
  const cmp = rows.filter((r) => r.inf.ok && r.hand && r.hand.template !== 'image' && !/TODO|SVAGT|svag|saknas/i.test(r.hand.note ?? ''));
  const res = cmp.map((r) => ({ r, c: compareRecipes((r.inf as unknown as { recipe: Recipe }).recipe, r.hand!) }));
  const tpl = res.filter((x) => x.c.template).length; const score = res.reduce((s, x) => s + x.c.score, 0) / Math.max(1, res.length);
  console.log(`Jämfört med handskrivna recept (${res.length}): samma mall ${tpl} (${Math.round((100 * tpl) / Math.max(1, res.length))} %), medelpoäng ${score.toFixed(2)}`);
  const handManual = manual.filter((r) => r.hand && r.hand.template !== 'image' && !/TODO|SVAGT|svag|saknas/i.test(r.hand.note ?? ''));
  console.log(`Manuellt trots handrecept: ${handManual.length}`);
  if (flag('verbose')) { for (const x of res.filter((x) => !x.c.template || x.c.score < 0.75)) console.log(`  ≠ ${x.r.w.lemma}: gen ${(x.r.inf as { recipe: { template: string } }).recipe.template} / hand ${x.r.hand!.template} · ${x.c.slots.filter((s) => !s.same).map((s) => `${s.name}: ${JSON.stringify(s.gen)}≠${JSON.stringify(s.hand)}`).join(', ')}`); for (const r of handManual) console.log(`  ✗ ${r.w.lemma} (${r.hand!.template}): ${(r.inf as { reason: string }).reason}`); }
}
if (flag('list')) for (const r of rows) console.log(r.inf.ok ? `  ${r.inf.confidence.padEnd(6)} ${r.w.lemma} → ${JSON.stringify(r.inf.recipe)}` : `  MANUAL ${r.w.lemma}: ${r.inf.reason}`);
const out = opt('write');
if (out) {
  const file = path.isAbsolute(out) ? out : path.resolve(out);
  const existing = fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as { recipes: Record<string, unknown>; manual: Record<string, unknown> }) : { recipes: {}, manual: {} };
  for (const r of rows) { if (r.inf.ok) { existing.recipes[r.w.senseId] = { ...r.inf.recipe, generated: { confidence: r.inf.confidence, why: r.inf.why } }; delete existing.manual[r.w.senseId]; } else { existing.manual[r.w.senseId] = { lemma: r.w.lemma, reason: r.inf.reason, hints: r.inf.hints, nearest: r.inf.nearest, family: r.inf.family }; delete existing.recipes[r.w.senseId]; } }
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(existing, null, 1)}\n`);
  console.log(`Skrev ${file} (${Object.keys(existing.recipes).length} recept, ${Object.keys(existing.manual).length} manuella)`);
}
void registryDir;
