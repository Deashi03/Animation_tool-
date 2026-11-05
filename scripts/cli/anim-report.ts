/** Status report: `npm run anim:report [--json]` */
import { loadScenes } from '../../src/tools/scenes';
import { buildReport } from '../../src/tools/report';
import { flag } from './_shared';
const { scenes, invalid } = loadScenes();
const r = buildReport(scenes);
if (flag('json')) { console.log(JSON.stringify({ ...r, unparsable: invalid }, null, 2)); process.exit(0); }
console.log(`Scener: ${r.total} (${Object.entries(r.byKind).map(([k, v]) => `${k} ${v}`).join(', ')})`);
console.log(`Status: ${Object.entries(r.byStatus).map(([k, v]) => `${k} ${v}`).join(', ') || '–'}`);
console.log(`Utan kontrastpar: ${r.withoutContrast.length ? r.withoutContrast.join(', ') : 'inga'}`);
console.log(`Tekniskt ogiltiga: ${r.invalid.length ? r.invalid.map((i) => `${i.id} (${i.problems.join('; ')})`).join('\n  ') : 'inga'}`);
if (invalid.length) console.log(`Filer som inte kan läsas: ${invalid.map((i) => i.file).join(', ')}`);
