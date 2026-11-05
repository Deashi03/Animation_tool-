/** Plan a Swechan module: `npm run anim:plan -- --swechan ../swechan --module m.steka-och-bryna` → registry/plan/<module>.json + .md */
import fs from 'node:fs';
import path from 'node:path';
import { buildPlan, planMarkdown } from '../../src/tools/plan';
import { loadScenes } from '../../src/tools/scenes';
import { opt, fail } from './_shared';
const swechan = opt('swechan') ?? fail('Ange --swechan <sökväg till lokal Swechan-klon>');
const moduleId = opt('module') ?? fail('Ange --module m.…');
const { scenes } = loadScenes();
const existing = new Map<string, string>(); for (const s of scenes.values()) if (s.senseId) existing.set(s.senseId, s.animationId);
const plan = buildPlan(path.resolve(swechan), moduleId, existing);
const dir = path.resolve('registry/plan'); fs.mkdirSync(dir, { recursive: true });
const base = path.join(dir, moduleId.replace(/^m\./, '').replace(/[^a-z0-9åäö-]/gi, '-'));
fs.writeFileSync(`${base}.json`, JSON.stringify(plan, null, 2) + '\n'); fs.writeFileSync(`${base}.md`, planMarkdown(plan));
console.log(planMarkdown(plan)); console.log(`Skrev ${path.relative(process.cwd(), base)}.json/.md`);
