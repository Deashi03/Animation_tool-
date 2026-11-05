/** Status report: `npm run anim:report [--json]` */
import { loadScenes } from '../../src/tools/scenes';
import { buildReport } from '../../src/tools/report';
import { flag } from './_shared';
import { approvedTemplates, blindResults } from '../../src/tools/registry';
import { TEMPLATES } from '../../src/compiler/templates';
const { scenes, invalid } = loadScenes();
const r = buildReport(scenes);
if (flag('json')) { console.log(JSON.stringify({ ...r, unparsable: invalid }, null, 2)); process.exit(0); }
console.log(`Scener: ${r.total} (${Object.entries(r.byKind).map(([k, v]) => `${k} ${v}`).join(', ')})`);
console.log(`Status: ${Object.entries(r.byStatus).map(([k, v]) => `${k} ${v}`).join(', ') || '–'}`);
console.log(`Utan kontrastpar: ${r.withoutContrast.length ? r.withoutContrast.join(', ') : 'inga'}`);
const approved = approvedTemplates();
console.log(`Mallar: ${Object.keys(TEMPLATES).map((t) => `${t}${approved.has(t) ? ' ✓' : ' (ej godkänd)'} ${r.byTemplate[t] ?? 0}`).join(' · ')}`);
const blind = blindResults(); const word = [...scenes.values()].filter((s) => s.kind === 'word');
const passed = word.filter((s) => blind[s.animationId]?.at(-1)?.passed).length, failed = word.filter((s) => blind[s.animationId] && !blind[s.animationId]!.at(-1)!.passed).length;
console.log(`Blindtest: ${passed} godkända, ${failed} underkända, ${word.length - passed - failed} otestade av ${word.length} ordscener`);
console.log(`Tekniskt ogiltiga: ${r.invalid.length ? r.invalid.map((i) => `${i.id} (${i.problems.join('; ')})`).join('\n  ') : 'inga'}`);
if (invalid.length) console.log(`Filer som inte kan läsas: ${invalid.map((i) => i.file).join(', ')}`);
