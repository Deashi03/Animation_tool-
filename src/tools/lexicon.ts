/**
 * Lexicon for the recipe generator: how Swedish words in a dictionary entry
 * (lemma, definition, example sentences) map onto the tool's building blocks.
 *
 * Everything here is data. When a word is not covered the generator says so
 * ("manual") instead of guessing – see docs/MANUAL_SCENES.md for what Claude
 * does then, and extend these tables when a new word family is solved.
 */


/** JS `\b` treats å, ä and ö as non-letters, so /\bägg/ would match inside "lägga". `sv` rewrites a pattern so word boundaries respect Swedish letters. */
export const sv = (re: RegExp): RegExp => new RegExp(re.source.replace(/\\b/g, '(?:(?<![a-zåäö])|(?![a-zåäö]))'), re.flags);
const B = (rows: [RegExp, string][]): [RegExp, string][] => rows.map(([re, v]) => [sv(re), v]);

/** Swedish noun stems (regex, matched against definition + examples, lower-case) → catalogue asset. Order matters: first match wins. */
export const NOUN_ASSET: [RegExp, string][] = B([
  // kitchen tools
  [/\bkniv/, 'tool.knife'], [/\bvisp/, 'tool.whisk'], [/\bsked|\bslev/, 'tool.spoon'], [/\bgaffel/, 'tool.fork'], [/\bskalare/, 'tool.peeler'], [/\brivjärn/, 'tool.grater'],
  [/\bkavel/, 'tool.rollingpin'], [/\bstekspade|\bspade\b/, 'spatula'], [/\bpotatisstöt|\bstöt\b/, 'tool.masher'], [/\btång/, 'tool.tongs'], [/\bsax/, 'tool.scissors'], [/\bnål/, 'tool.needle'],
  // cleaning & household tools
  [/\bborste|\bborsta/, 'tool.brush'], [/\btandborste/, 'tool.toothbrush'], [/\btrasa|\bduk\b/, 'tool.cloth'], [/\bsvamp/, 'tool.sponge'], [/\bkvast|\bsopa/, 'tool.broom'], [/\bmopp/, 'tool.mop'],
  [/\bhammare/, 'tool.hammer'], [/\bsåg/, 'tool.saw'], [/\bborr/, 'tool.drill'], [/\bskruvmejsel/, 'tool.screwdriver'], [/\bpenna/, 'tool.pen'], [/\bstrykjärn/, 'tool.iron'], [/\bpensel/, 'tool.paintbrush'], [/\broller|\brulle\b/, 'tool.roller'],
  [/\bsaltkar|\bkrydd|\bsalt\b|\bpeppar/, 'tool.shaker'], [/\brakhyvel|\braka\b/, 'tool.razor'], [/\bskrapa/, 'tool.scraper'], [/\bmunstycke|\bslang/, 'tool.nozzle'],
  // containers
  [/\bskål/, 'container.bowl'], [/\bgryta|\bkastrull/, 'container.pot'], [/\bstekpanna|\bpanna\b/, 'pan'], [/\btallrik/, 'container.plate'], [/\bskärbräda|\bbräda/, 'container.board'],
  [/\bhink/, 'container.bucket'], [/\bsoptunna|\bsopor|\bpapperskorg/, 'container.bin'], [/\bpåse|\bkasse/, 'container.bag'], [/\bkorg/, 'container.basket'], [/\bkopp|\bmugg/, 'container.cup'],
  [/\bflaska/, 'container.bottle'], [/\bburk/, 'container.jar'], [/\bbricka/, 'container.tray'], [/\bbalja|\bbadkar/, 'container.tub'], [/\bresväska|\bväska/, 'container.suitcase'], [/\blåda|\bkartong|\bback\b/, 'container.crate'],
  [/\bglas/, 'glass'], [/\bkanna|\btillbringare/, 'jug'],
  // food
  [/\bäpple/, 'food.apple'], [/\bbanan/, 'food.banana'], [/\bmorot|\bmorötter/, 'food.carrot'], [/\btomat/, 'food.tomato'], [/\blök/, 'food.onion'], [/\bpotatis/, 'food.potato'],
  [/\bbröd|\bmacka|\bsmörgås|\brostbröd|\bskiva\b|\bbak(a|at|ad|ar|ning|verk)\b|\bbulle/, 'food.bread'], [/\bdeg/, 'food.dough'], [/\bägg/, 'food.egg'], [/\bost/, 'food.cheese'], [/\bfisk/, 'food.fish'], [/\bpannkaka/, 'food.pancake'], [/\btårta|\bkaka/, 'food.cake'],
  [/\bgrönsak|\bsallad|\bfrukt|\bråvar|\bingrediens/, 'food.carrot'],
  // garments
  [/\btröja|\bskjorta|\bblus|\bt-shirt|\bplagg|\bkläder|\btyg\b|\btyget/, 'garment.shirt'], [/\bbyxor|\bjeans/, 'garment.trousers'], [/\bstrump|\bsocka/, 'garment.sock'], [/\bhandduk/, 'garment.towel'], [/\bklänning|\bkjol/, 'garment.dress'], [/\bjacka|\bkappa|\brock\b/, 'garment.jacket'],
  // fixtures and furniture
  [/\blampa|\bljuset\b|\blyse/, 'fixture.lamp'], [/\bstearinljus|\bljus\b/, 'fixture.candle'], [/\bkran/, 'fixture.tap'], [/\bdiskho|\bvask|\bdisk\b|\bdiska/, 'fixture.sink'], [/\bdusch/, 'fixture.shower'],
  [/\bis\b|\bisen\b|\bisbit/, 'fixture.ice'], [/\beld|\bbrasa|\blåga/, 'fixture.fire'], [/\bväxt|\bplanta|\bkruka/, 'fixture.plant'], [/\bblomma|\bblommor/, 'fixture.flower'], [/\bpöl|\bvattenpöl/, 'fixture.puddle'],
  [/\bdropp|\bläck/, 'fixture.drip'], [/\btvättmaskin/, 'fixture.washingmachine'], [/\bugn/, 'fixture.oven'], [/\bkylskåp|\bkyl\b/, 'fixture.fridge'], [/\bmikro/, 'fixture.microwave'], [/\belement\b|\bvärme/, 'fixture.radiator'],
  [/\btvättlina|\bklädstreck/, 'fixture.clothesline'], [/\bgalge/, 'fixture.hanger'], [/\bstrykbräda/, 'fixture.ironingboard'], [/\bstol/, 'fixture.chair'], [/\bhylla/, 'fixture.shelf'], [/\bvägg|\btapet/, 'fixture.wall'],
  [/\bcykel/, 'fixture.bike'], [/\bvagn/, 'fixture.cart'], [/\btält/, 'fixture.tent'], [/\bträd/, 'fixture.tree'], [/\bbuske|\bhäck/, 'fixture.bush'], [/\bmoln|\bregn/, 'fixture.cloud'], [/\bsol\b|\bsolen/, 'fixture.sun'],
  [/\bklocka|\btid\b|\btiden\b/, 'fixture.clock'], [/\bvåg\b|\bvåg(en|ar)/, 'fixture.scale'], [/\bspegel/, 'fixture.mirror'], [/\btoalett/, 'fixture.toilet'], [/\bko\b|\bkon\b|\bkor\b/, 'fixture.cow'], [/\bhöna|\bhöns/, 'fixture.hen'],
  [/\bsoffa/, 'sofa'], [/\bsäng/, 'bed'], [/\btäcke|\bfilt/, 'blanket'], [/\bbord/, 'table'], [/\bdörr/, 'door'], [/\bfönster/, 'window'], [/\btelefon|\bmobil/, 'phone'], [/\bboll/, 'ball'], [/\bfotboll/, 'football'], [/\bstege/, 'ladder'],
]);

/** Things that stand on the floor (anything else is placed on a table). Mirrors FLOOR_ASSETS in batch.ts. */
export const SURFACE_OF: [RegExp, string][] = B([[/\bskärbräda|\bbräda/, 'container.board'], [/\bdiskho|\bvask|\bunder kranen|\bvatten/, 'fixture.sink'], [/\bskål/, 'container.bowl'], [/\bgryta|\bkastrull/, 'container.pot']]);

/** Tool verbs: lemma → how the tool works and what visibly changes. `target` is the default food/surface when the definition names none. */
export type ToolRule = { tool?: string; motion: string; target?: string; surface?: string | null; effects: { role?: 'target' | 'surface' | 'extra'; key: string; to: number | string; at?: number }[]; period?: number; targetState?: Record<string, number | string>; bothHands?: boolean; note?: string };
export const TOOL_VERBS: Record<string, ToolRule> = {
  skära: { tool: 'tool.knife', motion: 'chop', target: 'food.carrot', surface: 'container.board', effects: [{ key: 'pieces', to: 1 }] },
  hacka: { tool: 'tool.knife', motion: 'chop', target: 'food.onion', surface: 'container.board', effects: [{ key: 'pieces', to: 1 }], period: 210 },
  skiva: { tool: 'tool.knife', motion: 'chop', target: 'food.bread', surface: 'container.board', effects: [{ key: 'pieces', to: 1 }], targetState: { parts: 6 } },
  halvera: { tool: 'tool.knife', motion: 'chop', target: 'food.apple', surface: 'container.board', effects: [{ key: 'pieces', to: 1, at: 0.5 }], targetState: { parts: 2 }, period: 900 },
  tärna: { tool: 'tool.knife', motion: 'chop', target: 'food.potato', surface: 'container.board', effects: [{ key: 'pieces', to: 1 }], targetState: { parts: 6 }, period: 300 },
  strimla: { tool: 'tool.knife', motion: 'chop', target: 'food.carrot', surface: 'container.board', effects: [{ key: 'pieces', to: 1 }], targetState: { parts: 8 }, period: 260 },
  skala: { tool: 'tool.peeler', motion: 'peel', target: 'food.potato', surface: 'container.board', effects: [{ key: 'peeled', to: 1 }] },
  riva: { tool: 'tool.grater', motion: 'grate', target: 'food.cheese', surface: 'container.board', effects: [{ key: 'grated', to: 1 }] },
  mosa: { tool: 'tool.masher', motion: 'press', target: 'food.potato', surface: 'container.bowl', effects: [{ key: 'mashed', to: 1 }] },
  vispa: { tool: 'tool.whisk', motion: 'whisk', target: 'container.bowl', surface: null, effects: [{ key: 'foam', to: 1 }, { key: 'mixed', to: 1 }] },
  röra: { tool: 'tool.spoon', motion: 'stir', target: 'container.bowl', surface: null, effects: [{ key: 'mixed', to: 1 }] },
  blanda: { tool: 'tool.spoon', motion: 'stir', target: 'container.bowl', surface: null, effects: [{ key: 'mixed', to: 1 }] },
  knåda: { motion: 'knead', target: 'food.dough', surface: 'container.board', effects: [{ key: 'rise', to: 0.3 }], bothHands: true },
  kavla: { tool: 'tool.rollingpin', motion: 'roll', target: 'food.dough', surface: 'container.board', effects: [{ key: 'flat', to: 1 }], bothHands: true },
  salta: { tool: 'tool.shaker', motion: 'sprinkle', target: 'container.plate', surface: null, effects: [{ key: 'food', to: 1 }] },
  peppra: { tool: 'tool.shaker', motion: 'sprinkle', target: 'container.plate', surface: null, effects: [{ key: 'food', to: 1 }] },
  krydda: { tool: 'tool.shaker', motion: 'sprinkle', target: 'container.pot', surface: null, effects: [{ key: 'fill', to: 0.8 }] },
  bre: { tool: 'tool.knife', motion: 'spread', target: 'food.bread', surface: 'container.board', effects: [{ key: 'butter', to: 1 }] },
  breda: { tool: 'tool.knife', motion: 'spread', target: 'food.bread', surface: 'container.board', effects: [{ key: 'butter', to: 1 }] },
  rosta: { motion: 'hold', target: 'food.bread', surface: 'container.board', effects: [{ key: 'toast', to: 1 }] },
  knäcka: { motion: 'tap', target: 'food.egg', surface: 'container.bowl', effects: [{ key: 'cracked', to: 1 }] },
  pressa: { motion: 'squeeze', target: 'food.tomato', surface: 'container.bowl', effects: [{ key: 'pieces', to: 0.5 }] },
  krama: { motion: 'squeeze', target: 'food.tomato', surface: 'container.bowl', effects: [{ key: 'pieces', to: 0.5 }] },
  diska: { tool: 'tool.sponge', motion: 'scrub', target: 'container.plate', surface: 'fixture.sink', effects: [{ key: 'dirty', to: 0 }, { role: 'surface', key: 'foam', to: 1 }], targetState: { dirty: 1 } },
  skölja: { motion: 'hold', target: 'food.carrot', surface: 'fixture.sink', effects: [{ role: 'surface', key: 'flow', to: 1, at: 0.1 }], period: 700 },
  tvätta: { tool: 'tool.sponge', motion: 'scrub', target: 'garment.shirt', surface: 'container.tub', effects: [{ key: 'stain', to: 0 }, { role: 'surface', key: 'foam', to: 1 }], targetState: { stain: 1 } },
  skrubba: { tool: 'tool.brush', motion: 'scrub', target: 'container.pot', surface: 'fixture.sink', effects: [{ role: 'surface', key: 'foam', to: 1 }] },
  'torka av': { tool: 'tool.cloth', motion: 'wipe', target: 'table', surface: null, effects: [] },
  torka: { tool: 'tool.cloth', motion: 'wipe', target: 'container.plate', surface: null, effects: [{ key: 'dirty', to: 0 }], targetState: { dirty: 0.6 } },
  damma: { tool: 'tool.cloth', motion: 'wipe', target: 'fixture.shelf', surface: null, effects: [] },
  putsa: { tool: 'tool.cloth', motion: 'wipe', target: 'fixture.mirror', surface: null, effects: [] },
  sopa: { tool: 'tool.broom', motion: 'sweep', target: 'food.pile', surface: null, effects: [{ key: 'amount', to: 0 }], targetState: { amount: 1, size: 0.6 } },
  städa: { tool: 'tool.broom', motion: 'sweep', target: 'food.pile', surface: null, effects: [{ key: 'amount', to: 0 }], targetState: { amount: 1, size: 0.6 } },
  moppa: { tool: 'tool.mop', motion: 'sweep', target: 'fixture.puddle', surface: null, effects: [{ key: 'size', to: 0 }], targetState: { size: 0.6 } },
  borsta: { tool: 'tool.brush', motion: 'brush', target: 'garment.jacket', surface: null, effects: [{ key: 'stain', to: 0 }], targetState: { stain: 0.8 } },
  stryka: { tool: 'tool.iron', motion: 'wipe', target: 'garment.shirt', surface: 'fixture.ironingboard', effects: [{ key: 'wrinkled', to: 0 }], targetState: { wrinkled: 1 } },
  vika: { motion: 'press', target: 'garment.shirt', surface: null, effects: [{ key: 'folded', to: 1 }], bothHands: true },
  såga: { tool: 'tool.saw', motion: 'saw', target: 'container.board', surface: null, effects: [] },
  hamra: { tool: 'tool.hammer', motion: 'tap', target: 'container.board', surface: null, effects: [] },
  spika: { tool: 'tool.hammer', motion: 'tap', target: 'container.board', surface: null, effects: [] },
  skruva: { tool: 'tool.screwdriver', motion: 'stir', target: 'fixture.shelf', surface: null, effects: [], period: 500 },
  borra: { tool: 'tool.drill', motion: 'press', target: 'fixture.wall', surface: null, effects: [] },
  måla: { tool: 'tool.paintbrush', motion: 'brush', target: 'fixture.wall', surface: null, effects: [{ key: 'paint', to: 1 }] },
  tapetsera: { tool: 'tool.roller', motion: 'brush', target: 'fixture.wall', surface: null, effects: [{ key: 'paper', to: 1 }] },
  klippa: { tool: 'tool.scissors', motion: 'tap', target: 'garment.shirt', surface: null, effects: [], period: 500 },
  sy: { tool: 'tool.needle', motion: 'pull', target: 'garment.shirt', surface: null, effects: [] },
  skriva: { tool: 'tool.pen', motion: 'wipe', target: 'container.board', surface: null, effects: [], period: 500 },
  märka: { tool: 'tool.pen', motion: 'wipe', target: 'container.crate', surface: null, effects: [], period: 500 }, flyttstäda: { tool: 'tool.broom', motion: 'sweep', target: 'food.pile', surface: null, effects: [{ key: 'amount', to: 0 }], targetState: { amount: 1, size: 0.6 } },
  'borsta tänderna': { tool: 'tool.toothbrush', motion: 'brush', target: 'fixture.mirror', surface: null, effects: [], period: 300 },
  raka: { tool: 'tool.razor', motion: 'wipe', target: 'fixture.mirror', surface: null, effects: [], period: 700 },
  vattna: { tool: 'jug', motion: 'hold', target: 'fixture.plant', surface: null, effects: [{ key: 'wilt', to: 0 }], targetState: { wilt: 1 } },
  plocka: { motion: 'pull', target: 'fixture.bush', surface: null, effects: [] },
  skörda: { motion: 'pull', target: 'fixture.plant', surface: null, effects: [{ key: 'grow', to: 0.3 }], targetState: { grow: 1 } },
  mjölka: { motion: 'pull', target: 'fixture.cow', surface: null, effects: [{ key: 'milk', to: 1 }] },
  bädda: { motion: 'press', target: 'bed', surface: null, effects: [], bothHands: true },
  reparera: { tool: 'tool.hammer', motion: 'tap', target: 'fixture.wall', surface: null, effects: [{ key: 'flake', to: 0 }], targetState: { flake: 1 } },
  åtgärda: { tool: 'tool.hammer', motion: 'tap', target: 'fixture.wall', surface: null, effects: [{ key: 'flake', to: 0 }], targetState: { flake: 1 } },
  renovera: { tool: 'tool.roller', motion: 'brush', target: 'fixture.wall', surface: null, effects: [{ key: 'paint', to: 1 }, { key: 'flake', to: 0 }], targetState: { flake: 1, paint: 0 } },
  'suga upp': { tool: 'tool.cloth', motion: 'press', target: 'fixture.puddle', surface: null, effects: [{ key: 'size', to: 0 }], targetState: { size: 0.8 } },
  'torka upp': { tool: 'tool.cloth', motion: 'wipe', target: 'fixture.puddle', surface: null, effects: [{ key: 'size', to: 0 }], targetState: { size: 0.8 } },
  fritera: { tool: 'tool.tongs', motion: 'hold', target: 'container.pot', surface: null, effects: [{ key: 'boil', to: 1 }], targetState: { fill: 0.6, contents: '#e8c060' } },
  panera: { motion: 'press', target: 'food.fish', surface: 'container.plate', effects: [], bothHands: true },
};

/** Process verbs (no person): lemma → the thing and what changes. */
export type ProcessRule = { asset: string; change: { key: string; from?: number; to: number; at?: number }[]; state?: Record<string, number | string>; extra?: { asset: string; at?: { x: number; y: number }; change?: { key: string; from?: number; to: number } }[]; sound?: string; env?: string; time?: string };
export const PROCESS_VERBS: Record<string, ProcessRule> = {
  koka: { asset: 'container.pot', change: [{ key: 'boil', to: 1 }, { key: 'steam', to: 1 }], state: { fill: 0.7 }, extra: [{ asset: 'stove', change: { key: 'heat', to: 1 } }] },
  sjuda: { asset: 'container.pot', change: [{ key: 'boil', to: 0.35 }, { key: 'steam', to: 0.5 }], state: { fill: 0.7 }, extra: [{ asset: 'stove', change: { key: 'heat', to: 0.5 } }] },
  'koka över': { asset: 'container.pot', change: [{ key: 'boil', to: 1 }, { key: 'fill', from: 0.8, to: 1.1 }], extra: [{ asset: 'stove', change: { key: 'heat', to: 1 } }] },
  smälta: { asset: 'fixture.ice', change: [{ key: 'melt', to: 1 }], extra: [{ asset: 'fixture.sun', at: { x: 22, y: 22 } }] },
  frysa: { asset: 'fixture.ice', change: [{ key: 'melt', from: 1, to: 0 }] },
  brinna: { asset: 'fixture.fire', change: [{ key: 'burn', to: 1 }] },
  slockna: { asset: 'fixture.candle', change: [{ key: 'lit', from: 1, to: 0, at: 0.5 }] },
  tändas: { asset: 'fixture.candle', change: [{ key: 'lit', from: 0, to: 1, at: 0.5 }] },
  droppa: { asset: 'fixture.drip', change: [{ key: 'flow', to: 0.3 }] },
  rinna: { asset: 'fixture.drip', change: [{ key: 'flow', to: 1 }] },
  läcka: { asset: 'fixture.drip', change: [{ key: 'flow', to: 0.5 }], extra: [{ asset: 'fixture.puddle', change: { key: 'size', from: 0, to: 0.8 } }] },
  jäsa: { asset: 'food.dough', change: [{ key: 'rise', to: 1 }] },
  växa: { asset: 'fixture.plant', change: [{ key: 'grow', from: 0.2, to: 1 }] },
  vissna: { asset: 'fixture.flower', change: [{ key: 'wilt', to: 1 }] },
  blomma: { asset: 'fixture.flower', change: [{ key: 'bloom', from: 0, to: 1 }] },
  mogna: { asset: 'food.banana', change: [{ key: 'ripeness', from: 0.1, to: 1 }] },
  ruttna: { asset: 'food.apple', change: [{ key: 'rot', to: 1 }] },
  mögla: { asset: 'food.bread', change: [{ key: 'toast', to: 0 }], state: {}, sound: undefined },
  krympa: { asset: 'garment.shirt', change: [{ key: 'shrink', to: 1 }], extra: [{ asset: 'fixture.washingmachine' }] },
  blekna: { asset: 'garment.shirt', change: [{ key: 'faded', to: 1 }], extra: [{ asset: 'fixture.sun', at: { x: 22, y: 22 } }], env: 'outdoors.park' },
  flagna: { asset: 'fixture.wall', change: [{ key: 'flake', to: 1 }] },
  regna: { asset: 'fixture.cloud', change: [{ key: 'rain', to: 1 }], env: 'outdoors.park' },
  snurra: { asset: 'fixture.washingmachine', change: [{ key: 'spin', to: 1 }] },
  centrifugera: { asset: 'fixture.washingmachine', change: [{ key: 'spin', to: 1 }] },
  spola: { asset: 'fixture.toilet', change: [{ key: 'flush', to: 1 }] },
  ringa: { asset: 'phone', change: [{ key: 'on', to: 1 }], sound: 'ring' },
  brumma: { asset: 'fixture.fridge', change: [], sound: 'hum' },
  dunka: { asset: 'fixture.washingmachine', change: [{ key: 'spin', to: 1 }], sound: 'thump' },
  ånga: { asset: 'container.pot', change: [{ key: 'steam', to: 1 }], state: { fill: 0.7 } },
  svalna: { asset: 'container.cup', change: [{ key: 'steam', from: 1, to: 0 }], state: { fill: 0.8 } },
  puttra: { asset: 'container.pot', change: [{ key: 'boil', to: 0.4 }, { key: 'steam', to: 0.6 }], state: { fill: 0.7 }, extra: [{ asset: 'stove', change: { key: 'heat', to: 0.6 } }], sound: 'hum' },
  grädda: { asset: 'fixture.oven', change: [{ key: 'on', to: 1 }], extra: [{ asset: 'food.bread', change: { key: 'toast', from: 0, to: 0.6 } }] },
  baka: { asset: 'fixture.oven', change: [{ key: 'on', to: 1 }], extra: [{ asset: 'food.bread', change: { key: 'toast', from: 0, to: 0.6 } }] },
  tina: { asset: 'fixture.ice', change: [{ key: 'melt', from: 0, to: 0.7 }] },
  svälla: { asset: 'food.dough', change: [{ key: 'rise', from: 0, to: 1 }] },
  nöta: { asset: 'garment.shirt', change: [{ key: 'faded', from: 0, to: 0.9 }, { key: 'wrinkled', from: 0, to: 0.5 }] },
  'nöta ut': { asset: 'garment.shirt', change: [{ key: 'faded', from: 0, to: 0.9 }, { key: 'wrinkled', from: 0, to: 0.5 }] },
  sylta: { asset: 'container.pot', change: [{ key: 'boil', to: 0.5 }, { key: 'steam', to: 0.6 }], state: { fill: 0.6, contents: '#b23a5a' }, extra: [{ asset: 'stove', change: { key: 'heat', to: 0.8 } }, { asset: 'container.jar', change: { key: 'fill', from: 0, to: 0.9 } }] },
  konservera: { asset: 'container.jar', change: [{ key: 'fill', from: 0, to: 0.9 }, { key: 'lid', from: 0, to: 1, at: 0.9 }] },
  värpa: { asset: 'fixture.nest', change: [{ key: 'eggs', from: 0, to: 1 }], extra: [{ asset: 'fixture.hen' }], env: 'outdoors.park' },
  kläcka: { asset: 'food.egg', change: [{ key: 'cracked', from: 0, to: 1 }], extra: [{ asset: 'fixture.nest' }], env: 'outdoors.park' },
  kläckas: { asset: 'food.egg', change: [{ key: 'cracked', from: 0, to: 1 }], extra: [{ asset: 'fixture.nest' }], env: 'outdoors.park' },
  stinka: { asset: 'container.bin', change: [{ key: 'open', to: 1 }, { key: 'full', to: 1 }], sound: 'hum' },
  'värma upp': { asset: 'container.pot', change: [{ key: 'steam', from: 0, to: 1 }], state: { fill: 0.7 }, extra: [{ asset: 'stove', change: { key: 'heat', to: 1 } }] }, värma: { asset: 'container.pot', change: [{ key: 'steam', to: 1 }], state: { fill: 0.7 }, extra: [{ asset: 'stove', change: { key: 'heat', to: 1 } }] },
  torka: { asset: 'garment.shirt', change: [{ key: 'wet', from: 1, to: 0 }], extra: [{ asset: 'fixture.clothesline' }], env: 'outdoors.park' },
};

/** Properties: lemma → bearer. `pair` names the antonym whose scene is the same picture with the opposite state. */
export type PropertyRule = { asset?: string; state?: Record<string, number | string>; glint?: boolean; surface?: string | null; env?: string; wardrobe?: Record<string, string | number | boolean>; icon?: string; contrast?: { a: Record<string, unknown>; b: Record<string, unknown>; mark?: 'a' | 'b' }; taste?: { food: string; reaction: string; icon: string }; emotion?: { emotion: string; cause?: string }; manner?: { manner: string; prop: string }; /** a looped small motion of a thing that is not a verb of its own: stretch, wobble, bounce */ motion?: { asset: string; motion: 'stretch' | 'wobble' | 'bounce' | 'glow' }; /** a change over time that establishes the property (the towel dries fast) */ change?: { key: string; from?: number; to: number }; note?: string };
export const PROPERTIES: Record<string, PropertyRule> = {
  vass: { asset: 'tool.knife', state: { rotate: 90 }, glint: true, surface: 'container.board', env: 'kitchen' },
  slö: { asset: 'tool.knife', state: { rotate: 90, dull: 1 }, surface: 'container.board', env: 'kitchen' },
  mogen: { asset: 'food.banana', state: { ripeness: 1 }, env: 'kitchen' }, omogen: { asset: 'food.banana', state: { ripeness: 0.1 }, env: 'kitchen' },
  rutten: { asset: 'food.apple', state: { rot: 1 }, env: 'kitchen' }, färsk: { asset: 'food.apple', state: { ripeness: 0.9 }, glint: true, env: 'kitchen' },
  skrynklig: { asset: 'garment.shirt', state: { wrinkled: 1 }, env: 'room' }, slät: { asset: 'garment.shirt', state: { wrinkled: 0 }, env: 'room' },
  ren: { asset: 'garment.shirt', state: { stain: 0 }, env: 'room', contrast: { a: { asset: 'garment.shirt', state: { stain: 1 } }, b: { asset: 'garment.shirt', state: { stain: 0 } } } },
  smutsig: { asset: 'garment.shirt', state: { stain: 1 }, env: 'room', contrast: { a: { asset: 'garment.shirt', state: { stain: 0 } }, b: { asset: 'garment.shirt', state: { stain: 1 } } } },
  blöt: { asset: 'garment.towel', state: { wet: 1 }, env: 'bathroom' }, torr: { asset: 'garment.towel', state: { wet: 0 }, env: 'bathroom' },
  full: { asset: 'glass', state: { fill: 1 }, env: 'kitchen', contrast: { a: { asset: 'glass', state: { fill: 0.05 } }, b: { asset: 'glass', state: { fill: 1 } } } },
  tom: { asset: 'glass', state: { fill: 0 }, env: 'kitchen', contrast: { a: { asset: 'glass', state: { fill: 1 } }, b: { asset: 'glass', state: { fill: 0 } } } },
  varm: { asset: 'container.cup', state: { fill: 0.8, steam: 1 }, env: 'kitchen' }, kall: { asset: 'glass', state: { fill: 0.8 }, icon: 'snowflake', env: 'kitchen' }, het: { asset: 'container.pot', state: { fill: 0.7, boil: 1, steam: 1 }, env: 'kitchen' },
  tung: { contrast: { a: { asset: 'container.crate', state: { full: 0 } }, b: { asset: 'container.crate', state: { full: 1 } } }, env: 'room' }, lätt: { contrast: { a: { asset: 'container.crate', state: { full: 1 } }, b: { asset: 'container.crate', state: { full: 0 } } }, env: 'room' },
  stor: { contrast: { a: { asset: 'ball', state: { r: 4 } }, b: { asset: 'ball', state: { r: 12 } } }, env: 'neutral' }, liten: { contrast: { a: { asset: 'ball', state: { r: 12 } }, b: { asset: 'ball', state: { r: 4 } } }, env: 'neutral' },
  grov: { contrast: { a: { asset: 'food.pile', state: { size: 0.7, amount: 1, contents: '#e0a243' } }, b: { asset: 'food.pile', state: { size: 2.4, amount: 1, contents: '#e0a243' } } }, env: 'kitchen' },
  fin: { contrast: { a: { asset: 'food.pile', state: { size: 2.4, amount: 1, contents: '#e0a243' } }, b: { asset: 'food.pile', state: { size: 0.7, amount: 1, contents: '#e0a243' } } }, env: 'kitchen' },
  trasig: { asset: 'fixture.wall', state: { flake: 1 }, env: 'room' }, hel: { asset: 'fixture.wall', state: { flake: 0 }, env: 'room' },
  tänd: { asset: 'fixture.lamp', state: { on: 1 }, env: 'room', surface: null }, släckt: { asset: 'fixture.lamp', state: { on: 0 }, env: 'room', surface: null },
  öppen: { asset: 'door', state: { angle: 70 }, env: 'room', surface: null }, stängd: { asset: 'door', state: { angle: 0 }, env: 'room', surface: null },
  dyr: { asset: 'garment.jacket', icon: 'banknote', env: 'room' }, billig: { asset: 'garment.sock', icon: 'coin', env: 'room' },
  sliten: { asset: 'garment.shirt', state: { faded: 0.8, wrinkled: 0.7, stain: 0.3 }, env: 'room' }, nött: { asset: 'garment.shirt', state: { faded: 0.8, wrinkled: 0.4 }, env: 'room' },
  ny: { asset: 'garment.shirt', state: { faded: 0 }, glint: true, env: 'room' }, gammal: { asset: 'garment.shirt', state: { faded: 1, wrinkled: 0.6 }, env: 'room' },
  salt: { taste: { food: 'food.bread', reaction: 'surprised', icon: 'droplet' } }, söt: { taste: { food: 'food.cake', reaction: 'happy', icon: 'heart' } }, sur: { taste: { food: 'food.apple', reaction: 'disgusted', icon: 'lightning' } },
  bitter: { taste: { food: 'food.bread', reaction: 'disgusted', icon: 'frown' } }, god: { taste: { food: 'food.cake', reaction: 'happy', icon: 'star' } }, äcklig: { taste: { food: 'food.fish', reaction: 'disgusted', icon: 'cross' } },
  stark: { taste: { food: 'food.pancake', reaction: 'hot', icon: 'flame' } }, mild: { taste: { food: 'food.pancake', reaction: 'neutral', icon: 'leaf' } },
  frasig: { taste: { food: 'food.bread', reaction: 'happy', icon: 'wave' } }, knaprig: { taste: { food: 'food.bread', reaction: 'happy', icon: 'wave' } }, mjuk: { taste: { food: 'food.cake', reaction: 'happy', icon: 'heart' } }, seg: { taste: { food: 'food.bread', reaction: 'neutral', icon: 'ellipsis' } },
  arg: { emotion: { emotion: 'angry' } }, glad: { emotion: { emotion: 'happy' } }, ledsen: { emotion: { emotion: 'sad' } }, trött: { emotion: { emotion: 'tired', cause: 'fixture.clock' } }, rädd: { emotion: { emotion: 'surprised' } },
  förvånad: { emotion: { emotion: 'surprised', cause: 'container.crate' } }, mätt: { emotion: { emotion: 'full', cause: 'container.plate' } }, hungrig: { emotion: { emotion: 'sad', cause: 'container.plate' } }, nöjd: { emotion: { emotion: 'content', cause: 'container.plate' } },
  stolt: { emotion: { emotion: 'proud', cause: 'food.cake' } }, sakna: { emotion: { emotion: 'sad', cause: 'phone' } }, längta: { emotion: { emotion: 'sad', cause: 'phone' } }, orolig: { emotion: { emotion: 'surprised', cause: 'fixture.clock' } }, lugn: { emotion: { emotion: 'content' } }, generad: { emotion: { emotion: 'surprised' } }, uttråkad: { emotion: { emotion: 'tired', cause: 'fixture.clock' } }, nyfiken: { emotion: { emotion: 'curious', cause: 'container.crate' } }, äcklad: { emotion: { emotion: 'disgusted', cause: 'food.fish' } }, kall_person: { emotion: { emotion: 'cold' } },
  försiktig: { manner: { manner: 'careful', prop: 'container.bowl' } }, varsam: { manner: { manner: 'careful', prop: 'container.bowl' } },
  tålig: { motion: { asset: 'container.crate', motion: 'bounce' } }, slitstark: { motion: { asset: 'garment.trousers', motion: 'bounce' } }, hållbar: { motion: { asset: 'container.crate', motion: 'bounce' } },
  elastisk: { motion: { asset: 'garment.sock', motion: 'stretch' } }, töjbar: { motion: { asset: 'garment.sock', motion: 'stretch' } }, stretchig: { motion: { asset: 'garment.trousers', motion: 'stretch' } }, mjuk_tyg: { motion: { asset: 'garment.towel', motion: 'wobble' } },
  vinglig: { motion: { asset: 'fixture.lamp', motion: 'wobble' } }, ostadig: { motion: { asset: 'fixture.chair', motion: 'wobble' } }, stadig: { asset: 'fixture.chair', surface: null, glint: true },
  snabbtorkande: { asset: 'garment.towel', state: { wet: 1 }, change: { key: 'wet', from: 1, to: 0 }, env: 'room' }, vattentät: { asset: 'garment.jacket', icon: 'droplet', env: 'outdoors.park' }, vindtät: { asset: 'garment.jacket', icon: 'wind', env: 'outdoors.park' }, varmhållande: { asset: 'garment.jacket', icon: 'thermometer', env: 'outdoors.park' }, luftig: { asset: 'garment.shirt', icon: 'wind', env: 'room' },
  varm_kläder: { asset: 'garment.jacket', icon: 'thermometer' }, genomskinlig: { asset: 'glass', state: { fill: 0.6 }, glint: true, env: 'kitchen' },
  snabb: { icon: 'lightning', note: 'hastighet som egenskap: blixt-ikon; kontrastera mot långsam' }, långsam: { icon: 'hourglass' },
  billig_: { icon: 'coin' }, gratis: { icon: 'coin', asset: 'container.bag' }, sen: { icon: 'clock' }, tidig: { icon: 'sun' }, farlig: { icon: 'exclaim' }, säker: { icon: 'shield' }, låst: { asset: 'door', icon: 'lock', surface: null },
  ledig: { asset: 'fixture.chair', icon: 'check', surface: null }, upptagen: { asset: 'fixture.chair', icon: 'cross', surface: null }, modern: { asset: 'fixture.lamp', state: { on: 1 }, surface: null }, gammaldags: { asset: 'fixture.candle', state: { lit: 1 } },
};

/** Abstract nouns/adjectives → a culturally neutral icon. */
export const ABSTRACT_ICON: [RegExp, string][] = B([
  [/\bdrag\b|\bdragig|\bluft kommer|\bblås|\bvind\b|\bvinden\b|\bluftig/, 'wind'], [/\btid|\bklock|\bsen\b|\bförsen/, 'clock'], [/\bpris|\bkosta|\bpengar|\bbetal/, 'banknote'], [/\bbillig|\bmynt|\brabatt/, 'coin'], [/\bdatum|\bvecka|\bmånad|\bdag\b/, 'calendar'],
  [/\bsök|\bleta|\bhitta/, 'magnifier'], [/\bvikt|\bväg(er|a)\b|\bbalans/, 'scale'], [/\bhem\b|\bbostad|\bhus\b/, 'house'], [/\bnyckel|\blås/, 'key'], [/\bidé|\btanke|\bkom på/, 'bulb'],
  [/\bkärlek|\bälsk|\btycka om/, 'heart'], [/\bfara|\bfarlig|\bvarning|\bobs\b/, 'exclaim'], [/\bfråga|\bundra/, 'question'], [/\bmusik|\bsång|\bsjung/, 'music'], [/\bgrad|\btemperatur|\bfeber/, 'thermometer'],
  [/\bvatten|\bvåt|\bfukt/, 'droplet'], [/\beld|\bbrand|\bhet\b/, 'flame'], [/\bkall|\bkyla|\bfrys/, 'snowflake'], [/\bsol\b|\bsommar/, 'sun'], [/\bmoln|\bregn|\bväder/, 'cloud'], [/\bnatur|\bmiljö|\bgrön/, 'leaf'],
  [/\båtervinn|\bsorter/, 'recycle'], [/\bsop|\bskräp|\bslänga/, 'bin'], [/\btelefon|\bring/, 'phone'], [/\bsova|\bsömn|\btrött/, 'zzz'], [/\bgåva|\bpresent/, 'gift'], [/\bhandla|\bbutik|\bköp/, 'cart'], [/\bbok\b|\bläs/, 'book'],
  [/\bförbjud|\binte tillåt|\bnej\b/, 'no'], [/\bvänta|\btålamod/, 'hourglass'], [/\bskydd|\bsäker/, 'shield'], [/\bkrig|\bstrid|\bslåss/, 'swords'], [/\bkung|\bdrottning|\bkrona/, 'crown'], [/\bbyta|\bväxla/, 'swap'],
]);

/** Communication verbs: keywords in the definition → bubble icon + mood. */
export const SAY_BY_DEF: [RegExp, string, string][] = ([
  [/\bförlåt|\bursäkt/, 'palms', 'sad'], [/\btack/, 'palms', 'happy'], [/\bavbryt|\bstör(a|ande)?\b|\bsluta\b/, 'no', 'angry'],
  [/\bmat\b|\bbeställ|\brestaurang|\bmeny/, 'fork-knife', 'neutral'], [/\bbetal|\bpris|\bnota|\bkvitto|\bpengar/, 'banknote', 'neutral'], [/\bklaga|\bmissnöjd|\bfel\b|\bdåligt/, 'cross', 'angry'],
  [/\bvarna|\bfara|\bakta/, 'exclaim', 'surprised'], [/\bskämt|\brolig|\bskratt/, 'smile', 'happy'], [/\bfråg|\bundra/, 'question', 'question'], [/\bsvar/, 'check', 'neutral'], [/\brekommend|\btips|\bföreslå/, 'star', 'happy'],
  [/\bförklar|\bberätt|\bbeskriv/, 'ellipsis', 'neutral'], [/\bhot|\barg\b/, 'lightning', 'angry'], [/\bbok(a|ning)|\breserv/, 'calendar', 'neutral'], [/\bansök|\bblankett|\bskriv(a)? under|\bkontrakt|\bnamn på ett papper/, 'document', 'neutral'],
  [/\bringa|\btelefon/, 'phone', 'neutral'], [/\bpåminn|\bglöm/, 'bell', 'neutral'], [/\bhälsa|\bhej\b|\bvälkomm/, 'smile', 'happy'], [/\bbjud|\binbjud/, 'gift', 'happy'],
] as [RegExp, string, string][]).map(([re, a, b]) => [sv(re), a, b]);
/** Communication verbs where the body bows. */
export const BOW_BY_DEF: [RegExp, 'light' | 'deep'][] = ([[/\bförlåt|\bursäkt/, 'deep'], [/\btack/, 'light'], [/\bhälsa|\bbuga|\bhej\b/, 'light']] as [RegExp, 'light' | 'deep'][]).map(([re, d]) => [sv(re), d]);

/** Verb categories by definition keywords, tried in this order when the lemma itself is unknown. */
type Family = 'tool' | 'process' | 'communicate' | 'arrange' | 'social' | 'locomotion' | 'state' | 'emotion' | 'pour' | 'eat' | 'dress';
export const DEF_CATEGORY: [RegExp, Family][] = ([
  [/\bta på sig|\bklä (på|av)|\bknäpp|\bdra (upp|ner) blixt|\bsätta på sig|\bta av sig/, 'dress'],
  [/^(äta|tugga|bita|smaka|dricka|smutta)\b|\bstoppa .* i munnen/, 'eat'],
  [/\bhälla|\bfylla på|\bslå upp/, 'pour'],
  [/\bsäga|\bsäger|\bprata|\btala|\bfråga|\bsvara|\bberätta|\bförklara|\bbe om|\bbeställa|\bklaga|\bvarna|\btacka|\bhälsa|\bringa|\bbetala|\bnotan|\bstöra|\bskriva under|\bkontrakt/, 'communicate'],
  [/\bge\b|\bger\b|\blämna över|\bräcka|\bservera|\bbjuda|\bdela ut|\bskicka/, 'social'],
  [/\blägga|\bställa|\bplacera|\bhänga upp|\bpacka|\bstapla|\bsortera|\bslänga|\bplocka undan|\bflytta|\bsätta in|\bta fram|\bta bort|\bta ut/, 'arrange'],
  [/\bgå\b|\bgår\b|\bspringa|\bhoppa|\bröra sig|\bklättra|\bsmyga|\bpromenera|\bjogga|\bcykla|\bhalka|\bsnubbla|\bkomma in|\bgå ut/, 'locomotion'],
  [/\bsova|\bvila|\bvänta|\bsitta|\bligga|\bslappna/, 'state'],
  [/\bkniv|\bskära|\bhacka|\bvispa|\bröra om|\bknåda|\bskala|\briva|\bmed (en|ett) \w+ (verktyg|redskap)|\bborsta|\btorka|\bskrubba|\bsopa|\bmoppa|\bstryka|\bgnugga|\bskölja|\btvätta|\bdiska/, 'tool'],
  [/^(bli|blir|börja|få|växa|minska|öka|komma att)\b|\bav sig själv|\blångsamt bli/, 'process'],
  [/\bkänna sig|\bkänsla|\bvara (arg|glad|ledsen|rädd)/, 'emotion'],
] as [RegExp, Family][]).map(([re, f]) => [sv(re), f]);

/** Dress phrases that batch.ts already knows how to build. */
export const DRESS_LEMMAS = ['ta på sig', 'ta av sig', 'klä på sig', 'klä av sig', 'sätta på sig', 'byta om', 'klä upp sig', 'stoppa in', 'knäppa', 'knäppa upp', 'dra upp', 'dra ner', 'kavla upp', 'knyta'];
export const LOCOMOTION_LEMMAS = ['gå', 'springa', 'hoppa', 'smyga', 'jogga', 'promenera', 'klättra', 'halka', 'vingla', 'rymma', 'gå in', 'gå ut', 'komma', 'lämna', 'springa iväg', 'hoppa över'];
export const STATE_LEMMAS = ['slappa', 'sova', 'vila', 'vänta', 'slappna av', 'sitta', 'ligga', 'stå', 'drömma', 'duscha', 'bada'];

/** Patterns and colours: not images but a garment that has the property (product owner 2026-11-05). */
export const PATTERNS: Record<string, Record<string, string>> = { randig: { top: 'white', pattern: 'striped', pattern2: 'navy' }, rutig: { top: 'white', pattern: 'checked', pattern2: 'red' }, prickig: { top: 'white', pattern: 'dotted', pattern2: 'navy' }, blommig: { top: 'white', pattern: 'floral', pattern2: 'red' }, mönstrad: { top: 'white', pattern: 'checked', pattern2: 'green' }, enfärgad: { top: 'green', pattern: 'none' }, kortärmad: { top: 'sky', sleeves: 'short' }, långärmad: { top: 'sky', sleeves: 'long' }, knälång: { top: 'red', topLength: 'long' } };
export const COLOURS: Record<string, string> = { beige: 'beige', lila: 'purple', turkos: '#4fb8c4', röd: 'red', blå: 'denim', grön: 'green', gul: 'yellow', svart: 'black', vit: 'white', grå: 'grey', brun: 'brown', rosa: 'pink', orange: 'orange' };

/** Verbs where a person puts or takes a thing (template arrange) – ported from the hand recipes so every sense of the lemma gets the same picture. */
export const ARRANGE_VERBS: Record<string, { put?: { prop: string; on?: string; state?: Record<string, number | string> }; take?: { prop: string; from?: string; state?: Record<string, number | string> } }> = {
  duka: { put: { prop: 'container.plate' } }, 'lägga upp': { put: { prop: 'container.plate', state: { food: 1 } } }, 'duka av': { take: { prop: 'container.plate', state: { dirty: 0.7 } } }, 'plocka undan': { take: { prop: 'container.plate', state: { dirty: 0.7 } } },
  packa: { put: { prop: 'container.crate', on: 'container.suitcase' } }, lasta: { put: { prop: 'container.crate', on: 'container.suitcase' } }, 'packa upp': { take: { prop: 'container.bag', from: 'container.suitcase' } }, 'lasta av': { take: { prop: 'container.crate', from: 'fixture.cart' } }, stapla: { put: { prop: 'container.crate', on: 'container.crate' } },
  placera: { put: { prop: 'container.jar', on: 'fixture.shelf' } }, förvara: { put: { prop: 'container.jar', on: 'fixture.shelf' } }, ersätta: { put: { prop: 'container.jar', on: 'fixture.shelf' } }, 'byta ut': { put: { prop: 'container.jar', on: 'fixture.shelf' } },
  'hänga upp': { put: { prop: 'garment.shirt', on: 'fixture.clothesline' } }, hänga: { put: { prop: 'garment.shirt', on: 'fixture.clothesline' } }, möblera: { put: { prop: 'fixture.chair' } }, ommöblera: { put: { prop: 'fixture.chair' } }, flytta: { put: { prop: 'fixture.chair' } },
  kompostera: { put: { prop: 'container.bottle', on: 'container.bin' } }, källsortera: { put: { prop: 'container.bottle', on: 'container.bin' } }, sortera: { put: { prop: 'container.bottle', on: 'container.bin' } }, slänga: { put: { prop: 'container.bottle', on: 'container.bin' } }, panta: { put: { prop: 'container.bottle', on: 'container.bin' } }, återvinna: { put: { prop: 'container.bottle', on: 'container.bin' } },
  'ta för sig': { take: { prop: 'container.plate', state: { food: 1 } } }, 'ta fram': { take: { prop: 'container.jar', from: 'fixture.fridge' } }, 'ställa in': { put: { prop: 'container.jar', on: 'fixture.fridge' } }, 'sätta in': { put: { prop: 'container.jar', on: 'fixture.fridge' } }, 'ta ut': { take: { prop: 'container.jar', from: 'fixture.fridge' } }, 'ställa undan': { put: { prop: 'container.jar', on: 'fixture.shelf' } },
};
/** Verbs between people with a thing changing hands (template social). */
export const SOCIAL_VERBS: Record<string, { prop: string; state?: Record<string, number | string> }> = { servera: { prop: 'container.plate', state: { food: 1 } }, 'ta om': { prop: 'container.plate', state: { food: 1 } }, 'turas om': { prop: 'tool.spoon' }, ge: { prop: 'container.bag' }, skicka: { prop: 'container.bag' }, 'lämna över': { prop: 'container.bag' }, 'bjuda på': { prop: 'container.bag' }, räcka: { prop: 'container.bag' }, låna: { prop: 'book' }, 'låna ut': { prop: 'container.bag' } };
/** Cooking in a pan (template cook-rhythm). */
export const COOK_VERBS: Record<string, { kind: 'fry' | 'brown' | 'sear' | 'burn' | 'melt'; contents: string; flip?: boolean; splash?: boolean }> = { steka: { kind: 'fry', contents: 'egg' }, bryna: { kind: 'brown', contents: 'onion' }, fräsa: { kind: 'sear', contents: 'onion' }, bränna: { kind: 'burn', contents: 'pancake' }, 'bränna vid': { kind: 'burn', contents: 'pancake' }, smälta: { kind: 'melt', contents: 'butter' }, vända: { kind: 'fry', contents: 'pancake', flip: true }, 'vända på': { kind: 'fry', contents: 'pancake', flip: true }, skvätta: { kind: 'fry', contents: 'steak', splash: true }, laga: { kind: 'fry', contents: 'egg' }, 'laga mat': { kind: 'fry', contents: 'egg' }, tillaga: { kind: 'fry', contents: 'steak' }, grilla: { kind: 'sear', contents: 'steak' }, 'steka på': { kind: 'fry', contents: 'egg' } };
/** Things people name that the catalogue does not have yet – the generator says exactly what is missing instead of picking a wrong one. */
export const MISSING_ASSET: [RegExp, string][] = ([[/\bdammsug/, 'dammsugare'], [/\btejp/, 'tejp'], [/\bhund/, 'hund'], [/\bkatt\b|\bkatten/, 'katt'], [/\bfågel/, 'fågel (finns: fixture.hen)'], [/\bflyttlåda/, 'flyttlåda (finns: container.crate)'], [/\bparaply/, 'paraply'], [/\bbil\b|\bbilen\b/, 'bil'], [/\bbuss/, 'buss'], [/\btåg/, 'tåg'], [/\bdator/, 'dator'], [/\btv\b|\bteve/, 'tv'], [/\bkudde/, 'kudde'], [/\bgardin/, 'gardin'], [/\btavla/, 'tavla'], [/\btrapp/, 'trappa'], [/\bhiss/, 'hiss'], [/\bplånbok/, 'plånbok'], [/\bgrill\b|\bgrillen/, 'grill'], [/\bfritös/, 'fritös'], [/\bmatta/, 'matta'], [/\bsoptunn/, 'soptunna (finns: container.bin)'], [/\bvas\b|\bvasen/, 'vas'], [/\bbesticks?\b/, 'bestick (finns: tool.fork, tool.knife, tool.spoon)']] as [RegExp, string][]).map(([re, n]) => [sv(re), n]);

/** Words the tool knows it cannot do yet, with the honest reason – the generator hands these off instead of building something misleading. */
export const HARD_WORDS: Record<string, string> = {
  dela: 'delning kräver att ett föremål delas i två och ena halvan ges bort – ingen byggsten bryter ett bröd ännu',
  'dela upp': 'kräver att något delas i delar – ingen byggsten bryter ett bröd ännu',
  skåla: 'två glas som höjs mot varandra saknas som pose',
  styv: 'styvhet syns bara mot något som böjer sig – en kontrastbyggsten (böjd mot rak) saknas',
  sjunka: 'vatten/bassäng saknas i katalogen',
  fika: 'händelse med flera figurer, kaffe och bulle – kräver en event-scen',
  tvätt: 'aktivitetssubstantiv – använd verbet tvätta eller en event-scen',
};

/** Near-synonyms that the same picture legitimately covers: never offered against each other in blind tests or picture quizzes (declared as confusableWith). */
export const SYNONYM_GROUPS: string[][] = [['rutten', 'skämd', 'dålig'], ['färsk', 'fräsch', 'nybakad', 'dagsfärsk', 'nyplockad'], ['vissen', 'slokig'], ['mogen', 'mogna'], ['laga', 'tillaga', 'laga mat', 'steka'], ['servera', 'lägga upp', 'duka', 'ställa fram'], ['värma upp', 'värma', 'koka'], ['städa', 'sopa'], ['plocka undan', 'duka av'], ['slänga', 'kasta', 'återvinna', 'källsortera', 'sortera'], ['tvätta', 'diska', 'skölja'], ['ta av sig', 'klä av sig'], ['ta på sig', 'klä på sig', 'sätta på sig']];
export const synonymsOf = (lemma: string): string[] => SYNONYM_GROUPS.find((g) => g.includes(lemma))?.filter((x) => x !== lemma) ?? [];

/** Adjective keywords → a state that shows the property on whatever thing the definition names (applied only when the thing has that key; otherwise the fallback asset is used). */
export const STATE_BY_ADJ: [RegExp, { key: string; to: number; fallback: string; glint?: boolean }][] = ([
  [/^övermog|\bövermogen/, { key: 'rot', to: 0.45, fallback: 'food.banana' }],
  [/^mog(en|na)\b/, { key: 'ripeness', to: 1, fallback: 'food.banana' }],
  [/^omog/, { key: 'ripeness', to: 0.1, fallback: 'food.banana' }],
  [/^möglig\b|\bmögel/, { key: 'mold', to: 1, fallback: 'food.apple' }],
  [/^(rutten|dålig)\b|\bruttn/, { key: 'rot', to: 1, fallback: 'food.apple' }],
  [/^skämd\b/, { key: 'rot', to: 0.65, fallback: 'food.apple' }],
  [/^(vissen|slokig|slak)\b|\bvissn|\bslokar/, { key: 'wilt', to: 1, fallback: 'fixture.flower' }],
  [/^(nybakad|nygräddad|färskbakad)\b/, { key: 'toast', to: 0, fallback: 'food.bread', glint: true }],
  [/^(färsk|fräsch|nyplockad|dagsfärsk|krispig|spänstig)\b/, { key: 'ripeness', to: 0.9, fallback: 'food.apple', glint: true }],
  [/^(blöt|våt|fuktig|genomblöt)\b/, { key: 'wet', to: 1, fallback: 'garment.towel' }],
  [/^(torr|torkad)\b/, { key: 'wet', to: 0, fallback: 'garment.towel' }],
  [/^(skrynklig|ostruken)\b/, { key: 'wrinkled', to: 1, fallback: 'garment.shirt' }],
  [/^(struken|slät)\b/, { key: 'wrinkled', to: 0, fallback: 'garment.shirt' }],
  [/^(fläckig|smutsig|kladdig|flottig)\b/, { key: 'stain', to: 1, fallback: 'garment.shirt' }],
  [/^(urtvättad|blekt|sliten|nött)\b/, { key: 'faded', to: 0.9, fallback: 'garment.shirt' }],
  [/^(krympt|för liten)\b/, { key: 'shrink', to: 1, fallback: 'garment.shirt' }],
  [/^(vikt|hopvikt)\b/, { key: 'folded', to: 1, fallback: 'garment.shirt' }],
  [/^(tänd|påslagen|upplyst)\b/, { key: 'on', to: 1, fallback: 'fixture.lamp' }],
  [/^(släckt|avstängd)\b/, { key: 'on', to: 0, fallback: 'fixture.lamp' }],
  [/^(full|fylld)\b/, { key: 'fill', to: 1, fallback: 'glass' }],
  [/^tom\b/, { key: 'fill', to: 0, fallback: 'glass' }],
  [/^(kokt|hårdkokt)\b/, { key: 'boiled', to: 1, fallback: 'food.egg' }],
  [/^(rostad|bränd)\b/, { key: 'toast', to: 1, fallback: 'food.bread' }],
  [/^(riven)\b/, { key: 'grated', to: 1, fallback: 'food.cheese' }],
  [/^(skalad)\b/, { key: 'peeled', to: 1, fallback: 'food.potato' }],
  [/^(mosad)\b/, { key: 'mashed', to: 1, fallback: 'food.potato' }],
  [/^(skivad|hackad|skuren|tärnad)\b/, { key: 'pieces', to: 1, fallback: 'food.carrot' }],
  [/^(öppen|uppslagen)\b/, { key: 'angle', to: 70, fallback: 'door' }],
  [/^(stängd)\b/, { key: 'angle', to: 0, fallback: 'door' }],
  [/^(smält)\b/, { key: 'melt', to: 1, fallback: 'fixture.ice' }],
  [/^(fryst|frusen)\b/, { key: 'melt', to: 0, fallback: 'fixture.ice' }],
] as [RegExp, { key: string; to: number; fallback: string; glint?: boolean }][]).map(([re, v]) => [sv(re), v]);

/** Eating verbs that differ by sound or manner. */
export const EAT_VERBS: Record<string, { prop: string; sound: 'crunch' | 'splash' | 'none'; reaction?: string }> = { äta: { prop: 'food.apple', sound: 'none' }, tugga: { prop: 'food.bread', sound: 'none' }, bita: { prop: 'food.apple', sound: 'crunch' }, knapra: { prop: 'food.carrot', sound: 'crunch' }, krasa: { prop: 'food.apple', sound: 'crunch' }, smaska: { prop: 'food.apple', sound: 'splash' }, sörpla: { prop: 'container.cup', sound: 'splash' }, dricka: { prop: 'container.cup', sound: 'none' }, smutta: { prop: 'container.cup', sound: 'none' }, smaka: { prop: 'tool.spoon', sound: 'none' }, 'smaka av': { prop: 'tool.spoon', sound: 'none' }, provsmaka: { prop: 'tool.spoon', sound: 'none' }, mumsa: { prop: 'food.cake', sound: 'none', reaction: 'happy' } };

/** Activity nouns whose picture is the verb's picture (tvätt → tvätta). Checked before the generic -ning/-ande stemming. */
export const NOUN_VERB: Record<string, string> = { tvätt: 'tvätta', disk: 'diska', flytt: 'flytta', städ: 'städa', bak: 'baka', städning: 'städa', tvättning: 'tvätta', matlagning: 'laga mat', packning: 'packa', målning: 'måla', strykning: 'stryka', dammsugning: 'dammsuga', diskning: 'diska', skalning: 'skala', vispning: 'vispa', servering: 'servera', dukning: 'duka', sortering: 'sortera', återvinning: 'återvinna', renovering: 'renovera', reparation: 'reparera', tvättstuga: '' };
/** Try to find the verb a Swedish activity noun is built on: -ning → -a, -ande → -a, -else → -a. */
export const verbBehindNoun = (lemma: string): string | undefined => {
  if (NOUN_VERB[lemma] !== undefined) return NOUN_VERB[lemma] || undefined;
  const m = /^(.+?)(ning|ande|else|ande)$/.exec(lemma); if (!m) return undefined;
  const stem = m[1]!; return `${stem.endsWith('n') && m[2] === 'ning' ? stem.slice(0, -1) : stem}a`;
};

/** Taste and texture adjectives recognised from the definition: what is eaten, how the face reacts, which icon says it. */
export const TASTE_BY_DEF: [RegExp, { food: string; reaction: string; icon: string }][] = ([
  [/\bbränner|\bchili|\bkryddstark|\bstark(a)? smak|\bpikant/, { food: 'food.pancake', reaction: 'hot', icon: 'flame' }],
  [/\bsötsur|\bsöt och sur/, { food: 'food.apple', reaction: 'surprised', icon: 'lightning' }],
  [/\bbesk|\bbitter|\bkaffe utan socker/, { food: 'container.cup', reaction: 'disgusted', icon: 'frown' }],
  [/\bsur(t)?\b|\bsyrlig/, { food: 'food.apple', reaction: 'disgusted', icon: 'lightning' }],
  [/\bsalt/, { food: 'food.bread', reaction: 'surprised', icon: 'droplet' }],
  [/\bsöt\b|\bsocker|\bhonung/, { food: 'food.cake', reaction: 'happy', icon: 'heart' }],
  [/\bspröd|\bknaprig|\bkrispig|\bfrasig|\bgår sönder när man biter/, { food: 'food.bread', reaction: 'happy', icon: 'wave' }],
  [/\bmör\b|\blen\b|\bsaftig|\bfluffig|\bmjuk och|\bkrämig|\bsmält(er)? i munnen/, { food: 'food.cake', reaction: 'happy', icon: 'heart' }],
  [/\bseg\b|\btorr(t)? (i|mot) munnen|\bsvår att tugga/, { food: 'food.bread', reaction: 'neutral', icon: 'ellipsis' }],
  [/\bmycket god|\bsmakar gott|\bser god ut|\bvill äta|\butsökt|\bvälsmakande|\baptitlig/, { food: 'food.cake', reaction: 'happy', icon: 'star' }],
  [/\bäcklig|\bsmakar illa|\bluktar illa/, { food: 'food.fish', reaction: 'disgusted', icon: 'cross' }],
] as [RegExp, { food: string; reaction: string; icon: string }][]).map(([re, v]) => [sv(re), v]);

/** Feelings recognised from the definition of an adjective or verb. */
export const EMOTION_BY_DEF: [RegExp, { emotion: string; cause?: string }][] = ([
  [/\barg\b|\bilsken|\brasande|\bförbannad|\birriterad/, { emotion: 'angry' }],
  [/\bglad\b|\blycklig|\bnöjd och glad|\bvaknar lätt/, { emotion: 'happy' }],
  [/\bledsen|\bsorgsen|\bnedstämd|\bsaknar/, { emotion: 'sad' }],
  [/\brädd|\bskrämd|\bförskräckt|\bchockad/, { emotion: 'surprised' }],
  [/\btrött|\bsömnig|\borkar inte/, { emotion: 'tired', cause: 'fixture.clock' }],
  [/\bförvånad|\böverraskad/, { emotion: 'surprised', cause: 'container.crate' }],
  [/\bvill veta mer|\bnyfiken|\bintresserad/, { emotion: 'curious', cause: 'container.crate' }],
  [/\bstolt/, { emotion: 'proud', cause: 'food.cake' }],
  [/\bäcklad|\bavsky/, { emotion: 'disgusted', cause: 'food.fish' }],
  [/\bfryser|\bkall om/, { emotion: 'cold' }],
  [/\bsvettig|\bvarm om|\bför varmt/, { emotion: 'hot' }],
  [/\bmätt\b|\bätit för mycket/, { emotion: 'full', cause: 'container.plate' }],
  [/\blugn\b|\bavslappnad|\btrevlig och snäll|\bvänlig/, { emotion: 'content' }],
] as [RegExp, { emotion: string; cause?: string }][]).map(([re, v]) => [sv(re), v]);

