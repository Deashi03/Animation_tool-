/**
 * anim:coverage – coverage of Swechan's dictionary by recipes and building blocks.
 *   npm run anim:coverage -- --swechan ../swechan [--json]
 * Writes registry/coverage.md (+ .json) and prints the totals.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadScenes } from '../../src/tools/scenes';
import { registryDir } from '../../src/tools/registry';
import { buildCoverage, coverageMarkdown } from '../../src/tools/coverage';
import { opt, flag, fail } from './_shared';

const swechan = opt('swechan', '');
if (!swechan) fail('Ange --swechan <lokal klon av Deashi03/Swechan>');
const { scenes } = loadScenes();
const bySense = new Map<string, string>();
for (const s of scenes.values()) if (s.senseId && !bySense.has(s.senseId)) bySense.set(s.senseId, s.animationId);
const c = buildCoverage(path.resolve(swechan!), bySense);
fs.writeFileSync(path.join(registryDir(), 'coverage.md'), coverageMarkdown(c));
fs.writeFileSync(path.join(registryDir(), 'coverage.json'), JSON.stringify(c, null, 1) + '\n');
if (flag('json')) console.log(JSON.stringify({ totals: c.totals, missingBlocks: c.missingBlocks }, null, 2));
else { console.log(`Betydelser som behöver animation: ${c.rows.length}`); for (const [k, v] of Object.entries(c.totals)) console.log(`  ${k}: ${v}`); console.log(`Saknade byggstenar: ${Object.entries(c.missingBlocks).map(([k, v]) => `${k} (${v})`).join(', ') || 'inga'}`); console.log('registry/coverage.md'); }
