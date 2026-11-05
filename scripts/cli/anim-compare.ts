/** Side-by-side comparison of two animations (contrast pair): `npm run anim:compare -- anim.slappa.1 anim.sova.1` */
import { loadScenes } from '../../src/tools/scenes';
import { compareHtml, writeReview } from '../../src/tools/render';
import { args, rel, fail } from './_shared';
const { scenes } = loadScenes();
const [a, b] = args();
if (!a || !b) fail('Ange två animationId');
const sa = scenes.get(a) ?? fail(`Okänd: ${a}`), sb = scenes.get(b) ?? fail(`Okänd: ${b}`);
const r = await writeReview('compare', `${a}__${b}`, compareHtml(sa, sb, { frames: 8, size: 140 }), 1240);
console.log(rel(r.png));
