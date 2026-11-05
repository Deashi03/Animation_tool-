/** Contact sheet of all posters (+ strips with --strips): `npm run anim:sheet` */
import { loadScenes } from '../../src/tools/scenes';
import { sheetHtml, stripHtml, writeReview } from '../../src/tools/render';
import { flag, rel } from './_shared';
const { scenes, invalid } = loadScenes();
const list = [...scenes.values()];
let html = sheetHtml(list, 6);
if (flag('strips')) html += list.map((s) => stripHtml(s, { frames: 8, size: 140 })).join('');
const r = await writeReview('sheet', 'sheet', html, 1240);
console.log(`${list.length} scener → ${rel(r.png)}`);
for (const i of invalid) console.log(`ogiltig: ${i.file}: ${i.errors.join('; ')}`);
