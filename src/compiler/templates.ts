/**
 * Scene templates = concept families. Every word scene should instantiate one.
 * A template has a human-readable description, a machine-checkable contract
 * (feature expressions, see contrast.ts – with `has:` forms added) and an
 * approval flag that only the product owner changes (registry/templates.json).
 * Scaling happens by filling approved templates with new parameters, not by
 * inventing a new composition per word.
 */
import type { SceneInput } from '../schema/scene';

export type Template = {
  id: string;
  titleSv: string;
  /** when to use it */
  describes: string;
  /** feature expressions that must hold (see compiler/contrast.ts evaluateFeature) */
  contract: string[];
  make: (senseId: string, lemma: string, n: string) => SceneInput;
};

export const TEMPLATES: Record<string, Template> = {
  locomotion: {
    id: 'locomotion', titleSv: 'Förflyttning',
    describes: 'Verb där kroppen förflyttar sig: gå, springa, hoppa, smyga. Kontrast genom tempo, flygfas och lutning. Världen rullar om duken inte räcker.',
    contract: ['has:actors>=1', 'has:action:walk|run|jump', 'motion:p>=0.4'],
    make: (senseId, lemma, n) => ({
      schemaVersion: 1, animationId: `anim.${lemma}.${n}`, senseId, titleSv: lemma, template: 'locomotion', meaningHint: 'TODO: en mening om betydelsen', category: 'action',
      durationMs: 3300, loop: true, holdMs: 0, posterMs: 1600, environment: { id: 'outdoors.park', time: 'day' },
      actors: [{ id: 'p', at: { x: 46, y: 100 }, facing: 'right' }],
      timeline: [{ t: 0, action: 'walk', actor: 'p', to: { x: 70, y: 100 }, durationMs: 3300 }],
      focus: { targets: ['p'] }, pedagogy: { quizEligible: false, group: 'rörelse', confusableWith: [] },
    }),
  },
  'manipulate-prop': {
    id: 'manipulate-prop', titleSv: 'Hantera föremål med synlig följd',
    describes: 'Verb där en person gör något med ett föremål och föremålet förändras: öppna, stänga, hälla, knäppa, tända. Följden måste synas på föremålet.',
    contract: ['has:actors>=1', 'has:props>=1', 'has:action:open|close|pour|grab|release|sip|tween|set|exercise'],
    make: (senseId, lemma, n) => ({
      schemaVersion: 1, animationId: `anim.${lemma}.${n}`, senseId, titleSv: lemma, template: 'manipulate-prop', meaningHint: 'TODO', category: 'action',
      durationMs: 3200, loop: true, posterMs: 2000, environment: { id: 'room', time: 'day' },
      actors: [{ id: 'p', at: { x: 40, y: 100 }, facing: 'right' }],
      props: [{ id: 'thing', asset: 'door', at: { x: 86, y: 100 }, z: -1 }],
      timeline: [{ t: 0, action: 'idle', actor: 'p', durationMs: 400 }, { t: 400, action: 'open', actor: 'p', prop: 'thing', durationMs: 1400 }, { t: 2000, action: 'idle', actor: 'p', durationMs: 1200 }],
      focus: { targets: ['p', 'thing'] }, pedagogy: { quizEligible: false, confusableWith: [] },
    }),
  },
  'relation-arrow': {
    id: 'relation-arrow', titleSv: 'Rumsrelation med pil och japanskt ord',
    describes: 'Prepositioner och lägesord: bakom, framför, under, på, i, bredvid. Två föremål, ingen människa, en pil som visar relationen och det japanska ordet på en vit panel som glider in. Ingen rörelse som kan läsas som ett verb.',
    contract: ['has:actors==0', 'has:props>=2', 'has:icon:arc-arrow|arrow-down|arrow-up|arrow-right', 'has:cjk-text'],
    make: (senseId, lemma, n) => ({
      schemaVersion: 1, animationId: `anim.${lemma}.${n}`, senseId, titleSv: lemma, template: 'relation-arrow', meaningHint: 'TODO', category: 'relation',
      durationMs: 3000, loop: true, holdMs: 600, posterMs: 1800, environment: { id: 'room', time: 'day' },
      props: [{ id: 'box', asset: 'box', at: { x: 62, y: 100 }, z: 2, state: { w: 36, h: 24 } as Record<string, number> }, { id: 'ball', asset: 'ball', at: { x: 85, y: 100 }, z: 1, state: { r: 9 } as Record<string, number> }],
      shapes: [
        { type: 'icon', id: 'arc', icon: 'arc-arrow', x: 62, y: 62, size: 44, stroke: 'accent', opacity: 0, z: 5 },
        { type: 'text', id: 'ja', x: 144, y: 40, text: 'TODO 日本語', size: 12, weight: 800, fill: 'ink', anchor: 'middle', bg: 'panel', pad: 6, opacity: 0, z: 5 },
      ],
      timeline: [
        { t: 200, action: 'set', target: 'arc', prop: 'opacity', value: 1 },
        { t: 200, action: 'tween', target: 'arc', prop: 'progress', from: 0, to: 1, durationMs: 900, ease: 'easeInOut' },
        { t: 1000, action: 'set', target: 'ja', prop: 'opacity', value: 1 },
        { t: 1000, action: 'tween', target: 'ja', prop: 'x', from: 144, to: 99, durationMs: 450, ease: 'easeOut' },
        { t: 1300, action: 'emphasis', target: 'ball', kind: 'arrowDown', durationMs: 1400 },
      ],
      focus: { targets: ['ball', 'box'] }, pedagogy: { quizEligible: false, group: 'läge', confusableWith: [] },
    }),
  },
  'property-contrast': {
    id: 'property-contrast', titleSv: 'Egenskap som kontrast i samma bild',
    describes: 'Adjektiv som syns bäst mot sin motsats eller mot det vanliga: sportig/vardaglig, tung/lätt, ren/smutsig. Två figurer eller två föremål sida vid sida; den som bär ordet markeras.',
    contract: ['has:entities>=2', 'has:contrast'],
    make: (senseId, lemma, n) => ({
      schemaVersion: 1, animationId: `anim.${lemma}.${n}`, senseId, titleSv: lemma, template: 'property-contrast', meaningHint: 'TODO', category: 'property',
      durationMs: 4000, loop: true, posterMs: 1500, environment: { id: 'outdoors.park', time: 'day' },
      actors: [{ id: 'q', variant: 'a', at: { x: 30, y: 100 }, facing: 'right' }, { id: 'p', variant: 'b', at: { x: 80, y: 100 }, facing: 'left' }],
      timeline: [{ t: 0, action: 'idle', actor: 'q', durationMs: 4000 }, { t: 0, action: 'exercise', actor: 'p', kind: 'jog', durationMs: 4000 }, { t: 200, action: 'emphasis', target: 'p', kind: 'ring', durationMs: 900 }],
      focus: { targets: ['p'] }, contrast: { with: ['anim.todo.1'], distinctiveFeatures: ['motion:p>=0.5'] }, pedagogy: { quizEligible: false, confusableWith: [] },
    }),
  },
  emotion: {
    id: 'emotion', titleSv: 'Känsla med utlösare',
    describes: 'Känsloord: arg, glad, förvånad, trött. Ansikte + hållning + något i bilden som utlöser känslan. Aldrig i bildfrågor.',
    contract: ['has:actors>=1', 'has:action:express'],
    make: (senseId, lemma, n) => ({
      schemaVersion: 1, animationId: `anim.${lemma}.${n}`, senseId, titleSv: lemma, template: 'emotion', meaningHint: 'TODO', category: 'emotion',
      durationMs: 2600, loop: true, posterMs: 1400, environment: { id: 'neutral', time: 'day' },
      actors: [{ id: 'p', at: { x: 60, y: 100 }, facing: 'right' }],
      timeline: [{ t: 0, action: 'idle', actor: 'p', durationMs: 600 }, { t: 600, action: 'express', actor: 'p', emotion: 'surprised', durationMs: 500 }, { t: 1100, action: 'idle', actor: 'p', durationMs: 1500 }],
      focus: { targets: ['p'] }, pedagogy: { quizEligible: false, confusableWith: [] },
    }),
  },
  state: {
    id: 'state', titleSv: 'Tillstånd över tid',
    describes: 'Verb/adjektiv för tillstånd: slappa, sova, vila, vänta. Hållning, ögon och miljöns ljus bär skillnaden; alltid med kontrastpar.',
    contract: ['has:actors>=1', 'has:action:relax|sleep|idle', 'has:contrast'],
    make: (senseId, lemma, n) => ({
      schemaVersion: 1, animationId: `anim.${lemma}.${n}`, senseId, titleSv: lemma, template: 'state', meaningHint: 'TODO', category: 'state',
      durationMs: 4400, loop: true, posterMs: 2600, environment: { id: 'room', time: 'day' },
      actors: [{ id: 'p', at: { x: 60, y: 100 }, facing: 'right' }],
      props: [{ id: 'sofa', asset: 'sofa', at: { x: 60, y: 100 }, z: -1 }, { id: 'phone', asset: 'phone', attachTo: { actor: 'p', hand: 'left' } }],
      timeline: [{ t: 0, action: 'relax', actor: 'p', on: 'sofa', durationMs: 4400 }],
      focus: { targets: ['p'] }, contrast: { with: ['anim.sova.1'], distinctiveFeatures: ['actor.p.eyes:half>=0.7', 'environment.time:day'] }, pedagogy: { quizEligible: false, confusableWith: [] },
    }),
  },
  event: {
    id: 'event', titleSv: 'Händelse med flera aktörer',
    describes: 'Substantiv och verb för händelser: stormning, flytt, fest, möte. Flera figurer, en plats, ett tydligt förlopp med början och slut; tecknade effekter får bära stämningen.',
    contract: ['has:actors>=2', 'has:props>=1'],
    make: (senseId, lemma, n) => ({
      schemaVersion: 1, animationId: `anim.${lemma}.${n}`, senseId, titleSv: lemma, template: 'event', meaningHint: 'TODO', category: 'action',
      durationMs: 5000, loop: true, holdMs: 800, posterMs: 3500, environment: { id: 'neutral', time: 'day' },
      actors: [{ id: 'a1', variant: 'a', at: { x: 4, y: 100 }, facing: 'right', scale: 0.5 }, { id: 'a2', variant: 'b', at: { x: -10, y: 100 }, facing: 'right', scale: 0.5 }],
      props: [{ id: 'castle', asset: 'castle', at: { x: 80, y: 100 }, z: 1, state: { w: 44, h: 38 } }],
      timeline: [{ t: 0, action: 'run', actor: 'a1', to: { x: 72, y: 100 }, durationMs: 1300 }, { t: 200, action: 'run', actor: 'a2', to: { x: 60, y: 100 }, durationMs: 1300 }],
      focus: { targets: ['castle'] }, pedagogy: { quizEligible: false, confusableWith: [] },
    }),
  },
  'dress-self': {
    id: 'dress-self', titleSv: 'Klä sig: plagg på och av',
    describes: 'Klädverb på den egna kroppen: ta på sig, ta av sig, klä på/av sig, byta om, knäppa, knäppa upp, dra upp/ner, knyta, kavla upp, sätta på sig (mössa, glasögon). Handlingarna `dress` och `fasten` gör koreografin; garderoben ändras mitt i. Före/efter-skillnaden på kroppen bär betydelsen.',
    contract: ['has:actors>=1', 'has:action:dress|fasten'],
    make: (senseId, lemma, n) => ({
      schemaVersion: 1, animationId: `anim.${lemma}.${n}`, senseId, titleSv: lemma, template: 'dress-self', meaningHint: 'TODO', category: 'action',
      durationMs: 3200, loop: true, holdMs: 800, posterMs: 2600, environment: { id: 'bedroom', time: 'day' },
      actors: [{ id: 'p', at: { x: 60, y: 100 }, facing: 'right', wardrobe: { top: '#f7f3ea', sleeves: 'short' } }],
      timeline: [{ t: 0, action: 'idle', actor: 'p', durationMs: 400 }, { t: 400, action: 'dress', actor: 'p', garment: 'top', on: true, value: 'green', durationMs: 1800 }, { t: 2200, action: 'idle', actor: 'p', durationMs: 1000 }],
      focus: { targets: ['p'] }, pedagogy: { quizEligible: false, group: 'kläder', confusableWith: [] },
    }),
  },
  communicate: {
    id: 'communicate', titleSv: 'Säga något till någon',
    describes: 'Kommunikationsverb: beställa, klaga, förklara, varna, skämta, ursäkta, rekommendera, fråga, svara. En talare med pratbubbla (ikon eller kort text, alltid på vitt) och oftast en lyssnare som reagerar. Stämningen (mood) och ikonen bär skillnaden; lyssnarens reaktion förstärker.',
    contract: ['has:actors>=1', 'has:action:say'],
    make: (senseId, lemma, n) => ({
      schemaVersion: 1, animationId: `anim.${lemma}.${n}`, senseId, titleSv: lemma, template: 'communicate', meaningHint: 'TODO', category: 'action',
      durationMs: 3600, loop: true, holdMs: 600, posterMs: 1800, environment: { id: 'room', time: 'day' },
      actors: [{ id: 'p', variant: 'a', at: { x: 38, y: 100 }, facing: 'right', scale: 0.85 }, { id: 'q', variant: 'b', at: { x: 84, y: 100 }, facing: 'left', scale: 0.85 }],
      timeline: [{ t: 0, action: 'idle', actor: 'q', durationMs: 3600 }, { t: 400, action: 'say', actor: 'p', icon: 'question', mood: 'question', to: 'q', durationMs: 1800 }, { t: 2400, action: 'say', actor: 'q', icon: 'check', mood: 'happy', to: 'p', durationMs: 1000 }],
      focus: { targets: ['p'] }, pedagogy: { quizEligible: false, group: 'samtal', confusableWith: [] },
    }),
  },
  social: {
    id: 'social', titleSv: 'Två personer och ett föremål',
    describes: 'Verb mellan människor med ett föremål: ge, servera, lämna över, skicka, bjuda på, dela, låna. En ger, en tar emot; föremålet byter hand mitt i rörelsen.',
    contract: ['has:actors>=2', 'has:props>=1', 'has:action:give|put|take'],
    make: (senseId, lemma, n) => ({
      schemaVersion: 1, animationId: `anim.${lemma}.${n}`, senseId, titleSv: lemma, template: 'social', meaningHint: 'TODO', category: 'action',
      durationMs: 3200, loop: true, holdMs: 700, posterMs: 1700, environment: { id: 'room', time: 'day' },
      actors: [{ id: 'p', variant: 'a', at: { x: 40, y: 100 }, facing: 'right' }, { id: 'q', variant: 'c', at: { x: 80, y: 100 }, facing: 'left' }],
      props: [{ id: 'thing', asset: 'container.bag', attachTo: { actor: 'p', hand: 'left' }, scale: 0.8 }],
      timeline: [{ t: 0, action: 'idle', actor: 'q', durationMs: 400 }, { t: 400, action: 'give', from: 'p', to: 'q', prop: 'thing', durationMs: 1600 }, { t: 2000, action: 'idle', actor: 'p', durationMs: 1200 }],
      focus: { targets: ['thing'] }, pedagogy: { quizEligible: false, group: 'mellan människor', confusableWith: [] },
    }),
  },
  process: {
    id: 'process', titleSv: 'Föremål som förändras av sig självt',
    describes: 'Verb för processer utan en handlande person: koka, sjuda, smälta, mogna, ruttna, brinna, slockna, droppa, rinna, läcka, jäsa, växa, vissna, flagna, regna. Ett eller två föremål i närbild, tillståndet tweenas, effekter (bubblor, ånga, droppar, rök) bär förloppet. Kontrastpar skiljer grad och tempo (koka/sjuda, droppa/rinna).',
    contract: ['has:actors==0', 'has:props>=1', 'has:action:tween|set|sound'],
    make: (senseId, lemma, n) => ({
      schemaVersion: 1, animationId: `anim.${lemma}.${n}`, senseId, titleSv: lemma, template: 'process', meaningHint: 'TODO', category: 'action',
      durationMs: 4000, loop: true, holdMs: 800, posterMs: 3000, environment: { id: 'kitchen', time: 'day' },
      props: [{ id: 'stove', asset: 'stove', at: { x: 60, y: 100 }, z: 0 }, { id: 'pot', asset: 'container.pot', at: { x: 60, y: 70 }, z: 1, scale: 1.4, state: { fill: 0.7, boil: 0 } }],
      timeline: [{ t: 0, action: 'set', target: 'stove', prop: 'heat', value: 1 }, { t: 300, action: 'tween', target: 'pot', prop: 'boil', to: 1, durationMs: 1800, ease: 'easeInOut' }, { t: 300, action: 'tween', target: 'pot', prop: 'phase', from: 0, to: 4, durationMs: 3700, ease: 'linear' }],
      focus: { targets: ['pot'] }, contrast: { with: ['anim.todo.1'], distinctiveFeatures: ['end:pot.boil>=0.9'] }, pedagogy: { quizEligible: false, group: 'process', confusableWith: [] },
    }),
  },
  'tool-rhythm': {
    id: 'tool-rhythm', titleSv: 'Verktyg mot föremål med synlig förändring',
    describes: 'Verb där en person bearbetar något med ett verktyg eller händerna i en rytm och föremålet förändras: skära, hacka, vispa, röra, knåda, skala, riva, kavla, mosa, salta, borsta, torka av, putsa, stryka, såga, spika. Handlingen `use` med ett rörelsemönster (motion) och en följd (effect) på föremålet. Verben skiljs genom verktyg, mönster, tempo och vad som händer med föremålet.',
    contract: ['has:actors>=1', 'has:props>=2', 'has:action:use'],
    make: (senseId, lemma, n) => ({
      schemaVersion: 1, animationId: `anim.${lemma}.${n}`, senseId, titleSv: lemma, template: 'tool-rhythm', meaningHint: 'TODO', category: 'action',
      durationMs: 4200, loop: true, holdMs: 600, posterMs: 3200, environment: { id: 'kitchen', time: 'day' },
      actors: [{ id: 'p', at: { x: 48, y: 100 }, facing: 'right' }],
      props: [{ id: 'table', asset: 'table', at: { x: 76, y: 100 }, z: -1 }, { id: 'board', asset: 'container.board', at: { x: 76, y: 70 }, z: 0 }, { id: 'food', asset: 'food.carrot', at: { x: 76, y: 66 }, z: 1 }, { id: 'knife', asset: 'tool.knife', attachTo: { actor: 'p', hand: 'right' } }],
      timeline: [{ t: 0, action: 'use', actor: 'p', on: 'food', tool: 'knife', motion: 'chop', durationMs: 3800, effect: [{ key: 'pieces', to: 1 }] }],
      focus: { targets: ['food'] }, contrast: { with: ['anim.todo.1'], distinctiveFeatures: ['end:food.pieces>=0.9'] }, pedagogy: { quizEligible: false, group: 'matlagning', confusableWith: [] },
    }),
  },
  'cook-rhythm': {
    id: 'cook-rhythm', titleSv: 'Matlagning i panna med synlig förändring',
    describes: 'Matlagningsverb där råvaran förändras i en panna på en spis: steka, bryna, fräsa, smälta, vända, bränna, skvätta. En figur vid spisen, handen på handtaget, plattan glöder, maten fräser och byter färg. Vad som skiljer verben är hur långt färgen går, tempot och följden (vänd, bränd, stänk).',
    contract: ['has:actors>=1', 'prop:pan', 'prop:stove', 'has:action:cook|flip|splash'],
    make: (senseId, lemma, n) => ({
      schemaVersion: 1, animationId: `anim.${lemma}.${n}`, senseId, titleSv: lemma, template: 'cook-rhythm', meaningHint: 'TODO', category: 'action',
      durationMs: 4200, loop: true, holdMs: 600, posterMs: 3400, environment: { id: 'kitchen', time: 'day' },
      actors: [{ id: 'p', at: { x: 74, y: 100 }, facing: 'left' }],
      props: [{ id: 'stove', asset: 'stove', at: { x: 42, y: 100 }, z: 0 }, { id: 'pan', asset: 'pan', at: { x: 42, y: 70 }, z: 1, state: { contents: 'egg' } }],
      timeline: [{ t: 0, action: 'cook', actor: 'p', pan: 'pan', kind: 'fry', durationMs: 4200 }],
      focus: { targets: ['pan'] }, contrast: { with: ['anim.todo.1'], distinctiveFeatures: ['end:pan.browning>=0.5'] }, pedagogy: { quizEligible: false, group: 'matlagning', confusableWith: [] },
    }),
  },
  'attribute-gloss': {
    id: 'attribute-gloss', titleSv: 'Egenskap buren av utseende + japanskt ord',
    describes: 'Adjektiv och abstraktioner där egenskapen syns på kläder, föremål eller utseende utan att någon utför en aktivitet: sportig, elegant, randig. En figur eller ett föremål bär egenskapen, lugn andning, och det japanska ordet glider in på vitt. Ingen handling som kan läsas som ett verb. Normativ sedan 2026-11-05 (produktägaren valde den framför sportutövande för *sportig*): egenskaper bärs av utseende, föremål eller läge – inte av en aktivitet som själv är ett verb.',
    contract: ['has:entities>=1', 'has:cjk-text'],
    make: (senseId, lemma, n) => ({
      schemaVersion: 1, animationId: `anim.${lemma}.${n}`, senseId, titleSv: lemma, template: 'attribute-gloss', meaningHint: 'TODO', category: 'property',
      durationMs: 3200, loop: true, holdMs: 800, posterMs: 2400, environment: { id: 'neutral', time: 'day' },
      actors: [{ id: 'p', at: { x: 56, y: 100 }, facing: 'right' }],
      shapes: [{ type: 'text', id: 'ja', x: 60, y: -20, text: 'TODO 日本語', size: 12, weight: 800, fill: 'ink', anchor: 'middle', bg: 'panel', pad: 6, opacity: 0, z: 5 }],
      timeline: [{ t: 0, action: 'idle', actor: 'p', durationMs: 3200 }, { t: 700, action: 'set', target: 'ja', prop: 'opacity', value: 1 }, { t: 700, action: 'tween', target: 'ja', prop: 'y', from: -20, to: 22, durationMs: 450, ease: 'easeOut' }],
      focus: { targets: ['p'] }, pedagogy: { quizEligible: false, confusableWith: [] },
    }),
  },
  ui: {
    id: 'ui', titleSv: 'Gränssnittsanimation',
    describes: 'Paneler, bockar, stjärnor: feedback och övergångar i appen. Egen duk, transparent bakgrund, Fjord-färger.',
    contract: [],
    make: (_senseId, lemma, n) => ({
      schemaVersion: 1, animationId: `ui.${lemma}.${n}`, kind: 'ui', titleSv: lemma, template: 'ui', category: 'ui', durationMs: 1200, loop: false, holdMs: 600, posterMs: 1200,
      canvas: { w: 360, h: 120 },
      shapes: [{ type: 'rect', id: 'bar', x: 0, y: 120, w: 360, h: 72, rx: 16, fill: 'uiSuccess' }],
      timeline: [{ t: 0, action: 'tween', target: 'bar', prop: 'y', to: 48, durationMs: 420, ease: 'easeOut' }],
      pedagogy: { quizEligible: false, confusableWith: [] },
    }),
  },
};
export const TEMPLATE_IDS = Object.keys(TEMPLATES);
