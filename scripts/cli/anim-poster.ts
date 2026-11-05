/** Poster frame as SVG (+PNG at 180 and 140 px): `npm run anim:poster -- anim.springa.1` */
import fs from 'node:fs';
import path from 'node:path';
import { loadScenes, REVIEW_DIR } from '../../src/tools/scenes';
import { posterSvg, writeReview } from '../../src/tools/render';
import { args, rel, fail } from './_shared';
const { scenes } = loadScenes();
const id = args()[0] ?? fail('Ange animationId');
const s = scenes.get(id) ?? fail(`Okänd: ${id}`);
fs.mkdirSync(path.join(REVIEW_DIR, 'posters'), { recursive: true });
fs.writeFileSync(path.join(REVIEW_DIR, 'posters', `${id}.svg`), posterSvg(s, 180));
const r = await writeReview('posters', id, `<section class="posters"><figure>${posterSvg(s, 180)}<figcaption>180 px</figcaption></figure><figure>${posterSvg(s, 140)}<figcaption>140 px</figcaption></figure><figure>${posterSvg(s, 180, true)}<figcaption>med etikett</figcaption></figure></section>`, 700);
console.log(rel(r.png));
