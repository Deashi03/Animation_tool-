/** Validate every scene (or the given files): `npm run anim:validate [-- scenes/x/*.json] [--json]` */
import path from 'node:path';
import { loadScenes, readRaw, sceneFiles } from '../../src/tools/scenes';
import { validateScene } from '../../src/compiler/validate';
import { args, flag } from './_shared';
import { approvedTemplates, blindStatus } from '../../src/tools/registry';

const { scenes } = loadScenes();
const files = args().length ? args().map((f) => path.resolve(f)) : sceneFiles();
const approved = approvedTemplates();
const results = files.map((file) => {
  const v = validateScene(readRaw(file), scenes, { approvedTemplates: approved });
  if (v.scene && v.scene.kind === 'word') {
    const b = blindStatus(v.scene.animationId);
    if (!b) v.problems.push({ level: 'warning', message: 'inget blindtest registrerat – kör anim:blindtest innan scenen räknas som klar' });
    else if (!b.passed) v.problems.push({ level: 'error', message: `blindtestet ${b.date} (${b.batch}) misslyckades: granskaren svarade "${b.choice}"` });
    if (v.scene.pedagogy.reviewStatus !== 'ai-draft' && !(b && b.passed)) v.problems.push({ level: 'error', message: 'status validated/reviewed kräver ett godkänt blindtest' });
  }
  return { file: path.relative(process.cwd(), file), ...v, ok: v.ok && !v.problems.some((p) => p.level === 'error') };
});
if (flag('json')) console.log(JSON.stringify(results.map((r) => ({ file: r.file, ok: r.ok, animationId: r.scene?.animationId, problems: r.problems })), null, 2));
else for (const r of results) {
  console.log(`${r.ok ? 'OK ' : 'FEL'} ${r.file}${r.scene ? ` (${r.scene.animationId})` : ''}`);
  for (const p of r.problems) console.log(`     ${p.level === 'error' ? '✗' : '!'} ${p.message}`);
}
const bad = results.filter((r) => !r.ok).length;
console.log(`${results.length - bad}/${results.length} scener tekniskt giltiga`);
process.exit(bad ? 1 : 0);
