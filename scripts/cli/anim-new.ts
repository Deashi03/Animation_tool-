/** New scene from a template: `npm run anim:new -- s.slappa.1 --template relax [--contrast anim.sova.1] [--title slappa]` */
import fs from 'node:fs';
import { sceneFilePath, writeScene } from '../../src/tools/scenes';
import { TEMPLATES } from '../../src/tools/templates';
import { validateScene } from '../../src/compiler/validate';
import { args, opt, fail } from './_shared';

const senseId = args()[0] ?? fail('Ange senseId, t.ex. s.slappa.1');
const m = /^s\.([^.]+)\.(\d+)$/.exec(senseId) ?? fail('senseId ska se ut som s.<lemma>.<n>');
const lemma = m[1]!, n = m[2]!;
const tpl = opt('template', 'locomotion')!;
const make = TEMPLATES[tpl] ?? fail(`Okänd mall "${tpl}". Finns: ${Object.keys(TEMPLATES).join(', ')}`);
const scene = make(senseId, lemma, n);
if (opt('title')) scene.titleSv = opt('title')!;
if (opt('contrast')) scene.contrast = { with: [opt('contrast')!], distinctiveFeatures: ['motion:p'] };
const file = sceneFilePath(scene.animationId);
if (fs.existsSync(file) && !process.argv.includes('--force')) fail(`${file} finns redan (använd --force för att skriva över)`);
const v = validateScene(scene);
if (!v.scene) fail(`Mallen gav en ogiltig scen: ${v.problems.map((p) => p.message).join('; ')}`);
writeScene(file, scene);
console.log(`Skrev ${file}\nNästa: redigera, kör npm run anim:validate -- ${file} och npm run anim:strip -- ${scene.animationId}`);
