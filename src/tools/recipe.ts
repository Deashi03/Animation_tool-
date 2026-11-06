/**
 * Recipe generator: from a Swechan dictionary entry (lemma, part of speech,
 * definition, examples, antonyms) to a recipe the batch builders can turn into
 * a complete scene – or an honest "manual" verdict that says what is missing.
 *
 * Rules, in order: lemma tables in lexicon.ts (tool verbs, process verbs,
 * properties, dress phrases …), then definition keywords (DEF_CATEGORY) with
 * nouns mapped to catalogue assets, then "manual". Confidence says how the
 * recipe was found: high = lemma table, medium = definition rule with a
 * matching noun, low = family only. A manual verdict carries the reason, what
 * would be needed, and the nearest solved words to imitate
 * (docs/MANUAL_SCENES.md explains the hand-off).
 */
import { isPropAsset } from '../assets/catalog';
import type { Recipe } from './coverage';
import { loadSwechan, stripFurigana } from './plan';
import { NOUN_ASSET, SURFACE_OF, TOOL_VERBS, PROCESS_VERBS, PROPERTIES, ABSTRACT_ICON, SAY_BY_DEF, BOW_BY_DEF, DEF_CATEGORY, DRESS_LEMMAS, LOCOMOTION_LEMMAS, STATE_LEMMAS, PATTERNS, COLOURS, ARRANGE_VERBS, SOCIAL_VERBS, COOK_VERBS, MISSING_ASSET, HARD_WORDS } from './lexicon';

export type Word = { senseId: string; lemma: string; pos: string; defSv?: string; examples?: string[]; jaGloss?: string; antonyms?: string[]; tags?: string[] };
export type Inferred =
  | { ok: true; recipe: Recipe; confidence: 'high' | 'medium' | 'low'; why: string[] }
  | { ok: false; reason: string; hints: string[]; nearest: string[]; family?: string };

const STATIC_ADJ = /^(randig|rutig|prickig|blommig|enfärgad|mönstrad|lila|beige|turkos|röd|blå|grön|gul|svart|vit|grå|brun|rosa|orange|knälång|kortärmad|långärmad|högklackad|ribbad|fransk|grekisk|italiensk|mexikansk|thailändsk|japansk|svensk|utländsk|medeltida|inbyggd)$/u;
const ACTIVITY_NOUN = /(ning|ande|else|flytt|fest|möte|match|lek|resa|städ|tvätt|fika|middag|frukost|lunch)$/u;

/** All catalogue assets named in a text, in order of appearance, without duplicates. */
export function assetsIn(text: string): string[] {
  const hits: { i: number; asset: string }[] = [];
  for (const [re, asset] of NOUN_ASSET) { const m = re.exec(text); if (m && isPropAsset(asset)) hits.push({ i: m.index, asset }); }
  hits.sort((a, b) => a.i - b.i);
  return [...new Set(hits.map((h) => h.asset))];
}
const isTool = (a: string) => a.startsWith('tool.') || a === 'spatula' || a === 'jug';
const isFood = (a: string) => a.startsWith('food.');
const isGarment = (a: string) => a.startsWith('garment.');
const isFixture = (a: string) => /^(fixture\.|stove|table|sofa|bed|door|window|ladder)/.test(a);
const isContainer = (a: string) => a.startsWith('container.') || a === 'glass' || a === 'mug';

function textOf(w: Word): string { return `${w.defSv ?? ''} ${(w.examples ?? []).join(' ')}`.toLowerCase(); }

/** Three solved words with the same template – examples to imitate when a word must be done by hand. */
export function nearest(hand: Record<string, Recipe>, template: string, bearerKind?: string): string[] {
  return Object.entries(hand)
    .filter(([, r]) => r.template === template && (!bearerKind || (r.bearer as { kind?: string } | undefined)?.kind === bearerKind) && !/TODO|SVAGT|svag|saknas/i.test(r.note ?? ''))
    .slice(0, 3).map(([k]) => k);
}

export function inferRecipe(w: Word, hand: Record<string, Recipe> = {}): Inferred {
  const lemma = w.lemma.toLowerCase(); const text = textOf(w); const found = assetsIn(text).filter((a) => !new RegExp(`\\b${lemma.split(' ')[0]}`).test(a));
  const manual = (reason: string, family: string | undefined, hints: string[]): Inferred => ({ ok: false, reason, hints, nearest: family ? nearest(hand, family) : [], family });

  if (HARD_WORDS[lemma]) return manual(`${lemma}: ${HARD_WORDS[lemma]}`, undefined, ['bygg byggstenen eller skriv en handscen enligt docs/MANUAL_SCENES.md']);
  if (w.pos === 'verb' || w.pos === 'phrase') return inferVerb(w, lemma, text, found, hand, manual);
  if (w.pos === 'adjective') return inferAdjective(w, lemma, text, found, hand, manual);
  if (w.pos === 'adverb') {
    const p = PROPERTIES[lemma]; if (p?.manner) return { ok: true, recipe: { template: 'attribute-gloss', bearer: { kind: 'manner', ...p.manner, env: 'room' } }, confidence: 'high', why: ['adverb i egenskapstabellen (sätt)'] };
    if (/\bsnabbt|\bfort\b/.test(lemma)) return { ok: true, recipe: { template: 'attribute-gloss', bearer: { kind: 'icon', icon: 'lightning', env: 'neutral' } }, confidence: 'low', why: ['adverb för hastighet → blixt-ikon'] };
    if (/\blångsamt|\bsakta/.test(lemma)) return { ok: true, recipe: { template: 'attribute-gloss', bearer: { kind: 'manner', manner: 'careful', prop: 'container.bowl', env: 'room' } }, confidence: 'low', why: ['adverb för långsamhet → försiktig gång'] };
    return manual('adverb utan sätt-regel: hur ser det ut när någon gör något på detta sätt?', 'attribute-gloss', ['lägg till ordet i PROPERTIES med manner eller icon i src/tools/lexicon.ts']);
  }
  if (w.pos === 'preposition') return { ok: true, recipe: { template: 'relation-arrow', note: `relation: ${lemma} – kontrollera pilens riktning och gloss` }, confidence: 'low', why: ['preposition → relation-arrow (två föremål + pil + japanskt ord)'] };
  if (w.pos === 'noun') {
    if (ACTIVITY_NOUN.test(lemma) || /^att /.test(text)) return manual('aktivitetssubstantiv: en händelse med flera figurer måste komponeras per ord', 'event', ['välj verbet bakom substantivet och använd dess recept (t.ex. "tvätt" → tvätta), eller skriv en event-scen']);
    return { ok: true, recipe: { template: 'image', note: 'konkret ting → bild' }, confidence: 'high', why: ['substantiv för konkret ting → bild'] };
  }
  return manual(`okänd ordklass ${w.pos}`, undefined, []);
}

function inferVerb(w: Word, lemma: string, text: string, found: string[], _hand: Record<string, Recipe>, manual: (r: string, f: string | undefined, h: string[]) => Inferred): Inferred {
  if (DRESS_LEMMAS.includes(lemma)) return { ok: true, recipe: { template: 'dress-self' }, confidence: 'high', why: ['klädfras i tabellen'] };
  const cv = COOK_VERBS[lemma]; if (cv) return { ok: true, recipe: { template: 'cook-rhythm', ...cv }, confidence: 'high', why: ['matlagning i panna (tabell)'] };
  const av = ARRANGE_VERBS[lemma]; if (av) return { ok: true, recipe: { template: 'arrange', ...av }, confidence: 'high', why: ['ställa/ta-verb i tabellen'] };
  const sv2 = SOCIAL_VERBS[lemma]; if (sv2) return { ok: true, recipe: { template: 'social', give: sv2 }, confidence: 'high', why: ['verb mellan människor i tabellen'] };
  const missing = MISSING_ASSET.find(([re]) => re.test(`${lemma} ${text}`))?.[1];
  const tv = TOOL_VERBS[lemma];
  if (tv) {
    const r: Recipe = { template: 'tool-rhythm', motion: tv.motion, effects: tv.effects, env: 'kitchen' } as Recipe;
    if (tv.tool) r.tool = tv.tool;
    // the definition may name the thing worked on: prefer it when it is the same family as the rule's default
    const named = found.find((a) => !isTool(a) && tv.target && ((isFood(tv.target) && isFood(a)) || (isGarment(tv.target) && isGarment(a)) || (isContainer(tv.target) && isContainer(a))));
    r.target = named ?? tv.target; if (tv.surface !== undefined) r.surface = tv.surface; if (tv.period) r.period = tv.period; if (tv.targetState) r.targetState = tv.targetState; if (tv.bothHands) r.bothHands = true; if (tv.sound) r.sound = tv.sound;
    if (tv.effects.length) r.claim = tv.effects.filter((e) => typeof e.to === 'number' && (!e.role || e.role === 'target')).map((e) => `end:target.${e.key}${(e.to as number) >= 0.5 ? '>=' : '<='}${e.to}`);
    if (!r.target || !isPropAsset(r.target as string)) return manual(`verktygsverbet ${lemma} saknar råvara/yta i katalogen`, 'tool-rhythm', [`lägg till föremålet i assets/props/ eller välj närmaste (hittade: ${found.join(', ') || 'inget'})`]);
    return { ok: true, recipe: r, confidence: named ? 'high' : 'high', why: [`verktygsverb i tabellen${named ? `, råvara från definitionen: ${named}` : ''}`] };
  }
  const pv = PROCESS_VERBS[lemma];
  if (pv) { const r: Recipe = { template: 'process', asset: pv.asset, change: pv.change, ...(pv.state ? { state: pv.state } : {}), ...(pv.extra ? { extra: pv.extra } : {}), ...(pv.sound ? { sound: pv.sound } : {}), env: pv.env ?? 'kitchen' } as Recipe; if (pv.change[0]) r.claim = [`end:thing.${pv.change[0].key}${pv.change[0].to >= 0.5 ? '>=' : '<='}${pv.change[0].to}`]; return { ok: true, recipe: r, confidence: 'high', why: ['processverb i tabellen'] }; }
  if (LOCOMOTION_LEMMAS.includes(lemma)) return { ok: true, recipe: { template: 'locomotion' }, confidence: 'high', why: ['förflyttningsverb'] };
  if (STATE_LEMMAS.includes(lemma)) return { ok: true, recipe: { template: 'state', note: `tillstånd: ${lemma} – kontrollera hållning, ögon och ljus mot grannordet` }, confidence: 'medium', why: ['tillståndsverb'] };
  // bows and speech by definition
  const bow = BOW_BY_DEF.find(([re]) => re.test(`${lemma} ${text}`));
  const say = SAY_BY_DEF.find(([re]) => re.test(`${lemma} ${text}`));
  const cat = DEF_CATEGORY.find(([re]) => re.test(`${lemma} ${text}`))?.[1];
  if (bow || cat === 'communicate') {
    if (!say) return manual(`kommunikationsverbet ${lemma} har ingen ikon för innehållet`, 'communicate', ['välj en ikon ur ikonbiblioteket som visar VAD som sägs (inte en gest) och lägg till i SAY_BY_DEF', 'kroppen måste bära betydelsen om innehållet är en artighet (bow)']);
    return { ok: true, recipe: { template: 'communicate', say: { icon: say[1], mood: say[2], ...(bow ? { bow: bow[1] } : {}) } }, confidence: bow ? 'high' : 'medium', why: [`kommunikation: ikon ${say[1]} ur definitionen${bow ? `, bugning ${bow[1]}` : ''}`] };
  }
  const nonTools = found.filter((a) => !isTool(a));
  if (cat === 'tool') {
    const tool = found.find(isTool) ?? (/\bkniv|\bskär/.test(text) ? 'tool.knife' : /\bskölj|\bvatten|\btvätt|\bdisk/.test(text) ? undefined : undefined);
    const target = nonTools.find((a) => isFood(a) || isGarment(a) || isContainer(a) || isFixture(a));
    if (!target) return manual(missing ? `${lemma}: byggsten saknas i katalogen – ${missing}` : `${lemma}: verktygsarbete men ingen råvara/yta hittades i definitionen`, 'tool-rhythm', [`skriv ett TOOL_VERBS-recept: tool, motion (${['chop', 'wipe', 'scrub', 'brush', 'stir', 'press', 'pull'].join('|')}), target och vad som ändras (effects)`]);
    const surface = SURFACE_OF.find(([re]) => re.test(text))?.[1];
    const motion = /\bskär|\bkniv|\bhack/.test(text) ? 'chop' : /\bskrubb|\bgnugg/.test(text) ? 'scrub' : /\bborst/.test(text) ? 'brush' : /\brör|\bbland/.test(text) ? 'stir' : /\btork|\bputs/.test(text) ? 'wipe' : 'wipe';
    const effects = isFood(target) && motion === 'chop' ? [{ key: 'pieces', to: 1 }] : /\bskölj|\bvatten/.test(text) && surface === 'fixture.sink' ? [{ role: 'surface', key: 'flow', to: 1, at: 0.1 }] : [];
    if (!effects.length) return manual(`${lemma}: verktyg och råvara hittades (${tool ?? 'händer'}, ${target}) men ingen synlig följd – vad ändras?`, 'tool-rhythm', [`välj en tillståndsnyckel på ${target} som ändras och skriv effects`]);
    return { ok: true, recipe: { template: 'tool-rhythm', ...(tool ? { tool } : {}), motion, target, ...(surface ? { surface } : {}), effects, env: 'kitchen' }, confidence: 'medium', why: [`definitionen: ${tool ?? 'händer'} + ${target} + ${motion}`] };
  }
  if (cat === 'arrange') {
    const prop = nonTools.find((a) => !isFixture(a)); const on = nonTools.find(isFixture);
    if (!prop) return manual(missing ? `${lemma}: byggsten saknas i katalogen – ${missing}` : `${lemma}: att ställa/ta något – men vilket föremål? Inget hittades i definitionen`, 'arrange', missing ? ['lägg till föremålet i src/assets/props/ och ett ARRANGE_VERBS-recept'] : ['ange put.prop (och on) i ARRANGE_VERBS eller receptet']);
    const take = /\bta (bort|ut|fram|ner)|\bplocka (undan|bort)|\bpacka upp|\bduka av|\blasta av/.test(`${lemma} ${text}`);
    return { ok: true, recipe: { template: 'arrange', ...(take ? { take: { prop } } : { put: { prop, ...(on ? { on } : {}) } }) }, confidence: 'medium', why: [`ordna: ${take ? 'tar' : 'ställer'} ${prop}${on ? ` på ${on}` : ''}`] };
  }
  if (cat === 'social') return { ok: true, recipe: { template: 'social', give: { prop: nonTools.find((a) => !isFixture(a)) ?? 'container.plate' } }, confidence: nonTools.length ? 'medium' : 'low', why: ['mellan människor: föremålet byter hand'] };
  if (cat === 'pour') { const into = nonTools.find(isContainer) ?? 'glass'; return { ok: true, recipe: { template: 'manipulate-prop', pour: { from: 'jug', into } }, confidence: 'medium', why: [`hälla i ${into}`] }; }
  if (cat === 'eat') { const prop = nonTools.find(isFood) ?? (/\bdrick|\bsmutt/.test(text) ? 'container.cup' : 'food.apple'); return { ok: true, recipe: { template: 'manipulate-prop', eat: { prop, sound: /\bknapr|\bfras|\bkrasa/.test(text) ? 'crunch' : 'none' } }, confidence: 'medium', why: [`äter/dricker ${prop}`] }; }
  if (cat === 'locomotion') return { ok: true, recipe: { template: 'locomotion', note: `förflyttning: ${lemma} – kontrollera tempo och hållning` }, confidence: 'low', why: ['definitionen beskriver förflyttning'] };
  if (cat === 'state') return { ok: true, recipe: { template: 'state', note: `tillstånd: ${lemma}` }, confidence: 'low', why: ['definitionen beskriver ett tillstånd'] };
  if (cat === 'dress') return { ok: true, recipe: { template: 'dress-self' }, confidence: 'low', why: ['definitionen beskriver att klä sig'] };
  if (cat === 'process') {
    const asset = nonTools[0];
    return manual(`${lemma} är en process${asset ? ` på ${asset}` : ''} – vilken tillståndsnyckel ändras och åt vilket håll?`, 'process', [asset ? `skriv PROCESS_VERBS[${lemma}] = { asset: '${asset}', change: [{ key, to }] }` : 'definitionen nämner inget föremål i katalogen – lägg till ett eller välj det närmaste']);
  }
  if (cat === 'emotion') { const p = PROPERTIES[lemma]; if (p?.emotion) return { ok: true, recipe: { template: 'emotion', bearer: { kind: 'emotion', ...p.emotion, env: 'room' } }, confidence: 'high', why: ['känsloverb i tabellen'] }; return manual(`${lemma}: känsla utan uttryck i tabellen`, 'emotion', ['välj emotion (happy|surprised|angry|sad|tired|content|cold|hot|disgusted|proud|curious|full) och en synlig orsak']); }
  if (missing) return manual(`${lemma}: byggsten saknas i katalogen – ${missing}`, cat === 'tool' ? 'tool-rhythm' : cat === 'arrange' ? 'arrange' : undefined, [`lägg till föremålet i src/assets/props/ (med tillstånd som visar följden) och ett recept i lexicon.ts`]);
  return manual(`verbet ${lemma} passar ingen känd familj utifrån definitionen "${w.defSv ?? ''}"`, undefined, [`hittade föremål: ${found.join(', ') || 'inga'}`, 'avgör familj (verktygsarbete, process, ordna, kommunikation, förflyttning …) och skriv ett recept enligt docs/WORD_FUNCTIONS.md – eller "ingen visualisering"']);
}

function inferAdjective(w: Word, lemma: string, text: string, found: string[], _hand: Record<string, Recipe>, manual: (r: string, f: string | undefined, h: string[]) => Inferred): Inferred {
  if (PATTERNS[lemma]) return { ok: true, recipe: { template: 'attribute-gloss', bearer: { kind: 'wardrobe', wardrobe: PATTERNS[lemma], tail: 'torso', env: 'room' } }, confidence: 'high', why: ['mönster/snitt buret av kläderna'] };
  if (COLOURS[lemma]) return { ok: true, recipe: { template: 'attribute-gloss', bearer: { kind: 'prop', asset: 'garment.shirt', color: COLOURS[lemma], env: 'room', surface: 'table', scale: 1.3 } }, confidence: 'high', why: ['färg: en tröja i färgen'] };
  if (STATIC_ADJ.test(lemma)) return { ok: true, recipe: { template: 'image', note: 'nationalitet/epok → bild' }, confidence: 'high', why: ['statisk egenskap'] };
  const p = PROPERTIES[lemma];
  if (p) return { ok: true, recipe: recipeFromProperty(p), confidence: 'high', why: ['egenskap i tabellen'] };
  // an antonym in the table whose picture is a contrast: mirror it
  for (const ant of w.antonyms ?? []) { const q = PROPERTIES[ant]; if (q?.contrast) return { ok: true, recipe: { template: 'attribute-gloss', bearer: { kind: 'contrast', a: q.contrast.b, b: q.contrast.a, mark: 'b', env: q.env ?? 'room' } }, confidence: 'medium', why: [`motsatsen ${ant} finns som kontrast – speglad`] }; }
  const icon = ABSTRACT_ICON.find(([re]) => re.test(`${lemma} ${text}`))?.[1];
  const thing = found.find((a) => !isTool(a));
  // when the icon just repeats the thing (sun + sun), the thing itself is the bearer
  const ICON_OF_ASSET: Record<string, string> = { 'fixture.sun': 'sun', 'fixture.cloud': 'cloud', 'fixture.clock': 'clock', phone: 'phone', 'fixture.scale': 'scale', 'fixture.fire': 'flame', 'fixture.ice': 'snowflake', bed: 'bed', 'container.cup': 'cup', 'container.plate': 'plate', 'container.bin': 'bin', 'garment.shirt': 'tshirt', 'garment.trousers': 'trousers', 'fixture.lamp': 'bulb' };
  if (icon && thing && ICON_OF_ASSET[thing] === icon) return { ok: true, recipe: { template: 'attribute-gloss', bearer: { kind: 'prop', asset: thing, env: isFixture(thing) ? 'room' : 'kitchen', ...(thing === 'fixture.sun' ? { surface: null } : {}) } }, confidence: 'medium', why: [`föremålet ${thing} ur definitionen bär egenskapen`] };
  if (icon && thing) return { ok: true, recipe: { template: 'attribute-gloss', bearer: { kind: 'icon', icon, asset: thing, env: isFixture(thing) ? 'room' : 'kitchen' } }, confidence: 'medium', why: [`ikon ${icon} ur definitionen + föremål ${thing}`] };
  if (icon) return { ok: true, recipe: { template: 'attribute-gloss', bearer: { kind: 'icon', icon, env: 'neutral' } }, confidence: 'low', why: [`abstrakt: ikon ${icon} ur definitionen`] };
  if (thing) return manual(`${lemma}: föremålet ${thing} hittades men inget tillstånd visar egenskapen`, 'attribute-gloss', [`välj ett tillstånd på ${thing} som visar ${lemma} (eller en kontrast a/b) och lägg till i PROPERTIES`, 'en figur som bara säger ordet är inte en bärare']);
  return manual(`egenskapen ${lemma} har ingen bärare: definitionen "${w.defSv ?? ''}" nämner inget föremål i katalogen och ingen känd symbol`, 'attribute-gloss', ['hitta ett typexempel: föremål med tillstånd, klädseldetalj, kontrastpar eller kulturneutral ikon – annars "ingen visualisering"']);
}

function recipeFromProperty(p: NonNullable<(typeof PROPERTIES)[string]>): Recipe {
  if (p.taste) return { template: 'attribute-gloss', bearer: { kind: 'taste', ...p.taste, env: 'kitchen' } };
  if (p.emotion) return { template: 'emotion', bearer: { kind: 'emotion', ...p.emotion, env: 'room' } };
  if (p.manner) return { template: 'attribute-gloss', bearer: { kind: 'manner', ...p.manner, env: 'room' } };
  if (p.contrast) return { template: 'attribute-gloss', bearer: { kind: 'contrast', ...p.contrast, mark: p.contrast.mark ?? 'b', env: p.env ?? 'room' } };
  if (p.wardrobe) return { template: 'attribute-gloss', bearer: { kind: 'wardrobe', wardrobe: p.wardrobe, tail: 'torso', env: 'room' } };
  if (p.icon) return { template: 'attribute-gloss', bearer: { kind: 'icon', icon: p.icon, ...(p.asset ? { asset: p.asset, ...(p.state ? { state: p.state } : {}) } : {}), env: p.env ?? 'neutral' }, ...(p.note ? { note: p.note } : {}) };
  return { template: 'attribute-gloss', bearer: { kind: 'prop', asset: p.asset, ...(p.state ? { state: p.state } : {}), ...(p.glint ? { glint: true } : {}), ...(p.surface !== undefined ? { surface: p.surface } : {}), ...(p.time ? { time: p.time } : {}), ...(p.extra ? { extra: p.extra } : {}), env: p.env ?? 'room' }, ...(p.note ? { note: p.note } : {}) };
}

/** How close a generated recipe is to a hand-written one: template, then the slots that decide the picture. */
export function compareRecipes(gen: Recipe, hand: Recipe): { template: boolean; slots: { name: string; gen: unknown; hand: unknown; same: boolean }[]; score: number } {
  const pick = (r: Recipe) => {
    const b = r.bearer as Record<string, unknown> | undefined;
    return { tool: r.tool, target: r.target, asset: r.asset, bearerKind: b?.kind, bearerAsset: b?.asset ?? b?.icon ?? b?.food ?? b?.emotion ?? b?.manner, sayIcon: (r.say as { icon?: string } | undefined)?.icon, prop: (r.put as { prop?: string } | undefined)?.prop ?? (r.take as { prop?: string } | undefined)?.prop ?? (r.give as { prop?: string } | undefined)?.prop ?? (r.eat as { prop?: string } | undefined)?.prop, kind: r.kind };
  };
  const g = pick(gen), h = pick(hand);
  const names = (Object.keys(h) as (keyof typeof h)[]).filter((k) => h[k] !== undefined);
  const slots = names.map((k) => ({ name: k, gen: g[k], hand: h[k], same: JSON.stringify(g[k]) === JSON.stringify(h[k]) }));
  const template = gen.template === hand.template || (gen.template === 'attribute-gloss' && hand.template === 'property-contrast') || (gen.template === 'property-contrast' && hand.template === 'attribute-gloss');
  const score = (template ? 0.5 : 0) + (slots.length ? 0.5 * slots.filter((s) => s.same).length / slots.length : 0.5);
  return { template, slots, score };
}

/** Words of one module (or the whole dictionary) as generator input. */
export function wordsFromSwechan(swechanDir: string, moduleId?: string): { words: Word[]; title: string } {
  const { entries, senses, modules } = loadSwechan(swechanDir);
  const toWord = (entry: { lemma: string; pos: string }, sense: { id: string; ja?: string; defSv?: string; examples?: { sv: string }[]; synonyms?: { senseId: string; relation: string }[]; tags?: string[] }): Word => ({
    senseId: sense.id, lemma: entry.lemma, pos: entry.pos, defSv: sense.defSv, examples: (sense.examples ?? []).map((e) => e.sv), jaGloss: sense.ja ? stripFurigana(sense.ja).split(/[、,]/)[0]!.trim() : '',
    antonyms: (sense.synonyms ?? []).filter((s) => s.relation === 'antonym').map((s) => s.senseId.split('.')[1]!.replace(/-/g, ' ')), tags: sense.tags,
  });
  if (moduleId) {
    const mod = modules.get(moduleId); if (!mod) throw new Error(`Okänd modul ${moduleId}`);
    return { title: mod.titleSv, words: mod.words.map((w) => senses.get(w.senseId)).filter((x): x is NonNullable<typeof x> => !!x).map((x) => toWord(x.entry, x.sense as never)) };
  }
  const words: Word[] = []; for (const e of entries.values()) for (const s of e.senses) words.push(toWord(e, s as never));
  return { title: 'hela ordboken', words };
}
