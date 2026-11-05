/**
 * anim:props – a catalogue sheet of every prop with its default state and a
 * few state variants, so Claude can see the building blocks before using them.
 *   npm run anim:props [-- --filter food]
 */
import { PROPS, drawProp } from '../../src/assets/props';
import { g, rect } from '../../src/engine/frame';
import { frameToSvg } from '../../src/engine/svgString';
import { writeReview } from '../../src/tools/render';
import { opt, rel } from './_shared';

const VARIANTS: Record<string, Record<string, number | string | boolean>[]> = {
  'food.apple': [{ pieces: 0.6 }, { peeled: 1 }, { ripeness: 0 }, { rot: 1 }, { bite: 1 }],
  'food.banana': [{ ripeness: 0 }, { rot: 1 }, { pieces: 1 }],
  'food.carrot': [{ pieces: 1 }, { peeled: 1 }], 'food.tomato': [{ pieces: 0.5 }], 'food.onion': [{ pieces: 1 }, { peeled: 1 }],
  'food.potato': [{ peeled: 1 }, { mashed: 1 }, { pieces: 1 }], 'food.bread': [{ pieces: 1 }, { toast: 1 }], 'food.dough': [{ rise: 1 }, { flat: 1 }],
  'food.egg': [{ cracked: 1 }], 'food.cheese': [{ grated: 1 }], 'food.pile': [{ amount: 0.3 }], 'food.fish': [{ pieces: 1 }], 'food.cake': [{ decorated: 1, pieces: 0.5 }],
  'container.bowl': [{ mixed: 1 }, { foam: 1, mixed: 1 }, { fill: 0 }], 'container.pot': [{ boil: 0.4 }, { boil: 1, steam: 1 }, { lid: 1 }], 'container.plate': [{ food: 1 }, { dirty: 1 }],
  'container.bucket': [{ fill: 1 }], 'container.bin': [{ open: 1, full: 1 }], 'container.bag': [{ full: 1 }], 'container.cup': [{ steam: 1 }], 'container.suitcase': [{ open: 1, full: 1 }], 'container.crate': [{ full: 1 }], 'container.tub': [{ foam: 1 }],
  'tool.shaker': [{ flow: 1 }], pan: [{ contents: 'egg', browning: 0.6 }, { contents: 'steak', burnt: 1 }], castle: [{ raise: 1 }, { gate: 1 }],
};
const filter = opt('filter', '');
const cells: string[] = [];
for (const id of Object.keys(PROPS).sort()) {
  if (filter && !id.includes(filter)) continue;
  const variants = [{}, ...(VARIANTS[id] ?? [])];
  for (const v of variants) {
    const node = g([rect(0, 0, 80, 80, { fill: '#f6f2ea', rx: 8 }), g([drawProp(id, v)], { x: 40, y: 66 })]);
    cells.push(`<figure>${frameToSvg({ w: 80, h: 80, bg: 'transparent', rx: 0, root: node }, { width: 120 })}<figcaption>${id}${Object.keys(v).length ? `<br><small>${Object.entries(v).map(([k, x]) => `${k}=${x}`).join(' ')}</small>` : ''}</figcaption></figure>`);
  }
}
const html = `<section class="strip"><h2>Föremålskatalog (${cells.length} rutor)</h2><div style="display:grid;grid-template-columns:repeat(8,1fr);gap:10px">${cells.join("")}</div></section>`;
const r = await writeReview('sheet', `props${filter ? `-${filter}` : ''}`, html, 1240);
console.log(rel(r.png ?? r.html));
