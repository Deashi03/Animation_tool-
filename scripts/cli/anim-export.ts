/** Swechan package → dist/swechan: `npm run anim:export [-- --out dir]` */
import path from 'node:path';
import { loadScenes } from '../../src/tools/scenes';
import { exportPackage } from '../../src/tools/export';
import { opt } from './_shared';
const { scenes } = loadScenes();
const out = path.resolve(opt('out', 'dist/swechan')!);
const r = exportPackage(scenes, out);
console.log(`Exporterade ${r.files} animationer till ${path.relative(process.cwd(), out)}/ (animations.index.json + anim/ + poster/)`);
