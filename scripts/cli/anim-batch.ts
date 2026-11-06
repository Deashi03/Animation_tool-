/**
 * anim:batch – drafts for a module from recipes.
 *   npm run anim:batch -- registry/plan/steka-och-bryna.json [--write] [--force] [--strips]
 *   npm run anim:batch -- --swechan ../swechan --module m.steka-och-bryna --write
 * Without --write it only reports what would be created. With --strips it renders a strip per new draft.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadScenes } from '../../src/tools/scenes';
import { buildPlan, type Plan } from '../../src/tools/plan';
import { runBatch, batchMarkdown, batchDir } from '../../src/tools/batch';
import { stripHtml, writeReview } from '../../src/tools/render';
import { args, opt, flag, fail } from './_shared';

const { scenes, files } = loadScenes();
const bySense = new Map<string, string>();
for (const s of scenes.values()) if (s.senseId && !bySense.has(s.senseId)) bySense.set(s.senseId, s.animationId);
let plan: Plan;
if (opt('module')) { const sw = opt('swechan') ?? fail('Ange --swechan'); plan = buildPlan(path.resolve(sw), opt('module')!, bySense); }
else { const f = args()[0] ?? fail('Ange en planfil eller --swechan + --module'); plan = JSON.parse(fs.readFileSync(f, 'utf8')) as Plan; }
const results = runBatch(plan, plan.titleSv, bySense, { write: flag('write'), force: flag('force'), files });
fs.mkdirSync(batchDir(), { recursive: true });
const report = path.join(batchDir(), `${plan.moduleId.replace(/^m\./, '')}.md`);
fs.writeFileSync(report, batchMarkdown(plan, results));
for (const r of results) console.log(`${r.status.padEnd(9)} ${r.lemma}${r.animationId ? ` → ${r.animationId}` : ''}${r.note ? `  (${r.note})` : ''}${r.problems ? `\n          ${r.problems.join('\n          ')}` : ''}`);
console.log(`\nRapport: ${path.relative(process.cwd(), report)}${flag('write') ? '' : '\n(torrkörning – lägg till --write för att skriva utkasten)'}`);
if (flag('strips') && flag('write')) {
  const fresh = loadScenes().scenes;
  for (const r of results) if (r.status === 'created' && r.animationId && fresh.get(r.animationId)) { const sc = fresh.get(r.animationId)!; const out = await writeReview('strips', r.animationId, stripHtml(sc, { frames: 8, size: 150 })); console.log(`remsa: ${path.relative(process.cwd(), out.png ?? out.html)}`); }
}
