/** Filmstrip PNG for review: `npm run anim:strip -- anim.springa.1 [--frames 8] [--size 150] [--label]` (or `--all`) */
import path from 'node:path';
import { loadScenes } from '../../src/tools/scenes';
import { stripHtml, writeReview } from '../../src/tools/render';
import { args, flag, opt, rel, fail } from './_shared';

const { scenes } = loadScenes(opt('scenes') ? path.resolve(opt('scenes')!) : undefined); // --scenes <dir>: a measurement library outside scenes/
const ids = flag('all') ? [...scenes.keys()] : args();
if (!ids.length) fail('Ange animationId (eller --all)');
const frames = Number(opt('frames', '8')), size = Number(opt('size', '150'));
for (const id of ids) {
  const s = scenes.get(id) ?? fail(`Okänd animation: ${id}`);
  const r = await writeReview('strips', id, stripHtml(s, { frames, size, label: flag('label') }), Math.min(1600, frames * (size + 8) + 40));
  console.log(`${id}: ${rel(r.png)}`);
}
