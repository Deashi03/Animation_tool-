/** Validate every scene (or the given files): `npm run anim:validate [-- scenes/x/*.json] [--json]` */
import path from 'node:path';
import { loadScenes, readRaw, sceneFiles } from '../../src/tools/scenes';
import { validateScene } from '../../src/compiler/validate';
import { args, flag } from './_shared';

const { scenes } = loadScenes();
const files = args().length ? args().map((f) => path.resolve(f)) : sceneFiles();
const results = files.map((file) => ({ file: path.relative(process.cwd(), file), ...validateScene(readRaw(file), scenes) }));
if (flag('json')) console.log(JSON.stringify(results.map((r) => ({ file: r.file, ok: r.ok, animationId: r.scene?.animationId, problems: r.problems })), null, 2));
else for (const r of results) {
  console.log(`${r.ok ? 'OK ' : 'FEL'} ${r.file}${r.scene ? ` (${r.scene.animationId})` : ''}`);
  for (const p of r.problems) console.log(`     ${p.level === 'error' ? '✗' : '!'} ${p.message}`);
}
const bad = results.filter((r) => !r.ok).length;
console.log(`${results.length - bad}/${results.length} scener tekniskt giltiga`);
process.exit(bad ? 1 : 0);
