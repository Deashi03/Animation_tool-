/**
 * Scene schema v1 – the contract that Claude writes against. Pure data, no
 * code. Zod validates; TypeScript types are inferred from the schema so that
 * the two cannot drift apart. See docs/SCENE_FORMAT.md.
 */
import { z } from 'zod';
import { EASE_NAMES } from '../engine/easing';

export const SCHEMA_VERSION = 1;
export const ASSETS_VERSION = 1;
export const MOTIONS_VERSION = 1;

const Id = z.string().regex(/^[a-z][a-z0-9_-]*$/i, 'id: letters, digits, _ or -');
const AnimationId = z.string().regex(/^(anim|ui)\.[a-zåäö0-9-]+(\.[a-z0-9-]+)*$/u, 'animationId like anim.springa.1 or ui.feedback.correct');
const SenseId = z.string().regex(/^s\.[^\s.]+\.\d+$/u, 'senseId like s.springa.1');
const Pt = z.object({ x: z.number().min(-60).max(480), y: z.number().min(-60).max(240) });
const Ease = z.enum(EASE_NAMES as [string, ...string[]]);
const Ms = z.number().int().min(0).max(60_000);
const Dur = z.number().int().min(1).max(60_000);

export const CHARACTER_ASSETS = ['character.base'] as const;
export const CHARACTER_VARIANTS = ['a', 'b', 'c'] as const;
export const PROP_ASSETS = ['glass', 'jug', 'door', 'box', 'ball', 'football', 'sofa', 'bed', 'blanket', 'mug', 'phone', 'table', 'window', 'mat', 'ladder', 'castle', 'brawl'] as const;
export const ENVIRONMENTS = ['neutral', 'room', 'bedroom', 'kitchen', 'outdoors.park', 'street'] as const;
export const TIMES = ['day', 'evening', 'night'] as const;
export const EYES = ['open', 'half', 'closed', 'wide'] as const;
export const BROWS = ['neutral', 'up', 'down', 'worried'] as const;
export const MOUTHS = ['smile', 'neutral', 'open', 'o', 'calm', 'frown'] as const;
export const JOINTS = ['torso', 'head', 'uArmL', 'fArmL', 'uArmR', 'fArmR', 'thighL', 'shinL', 'thighR', 'shinR', 'footL', 'footR'] as const;
export type Joint = (typeof JOINTS)[number];

const Wardrobe = z.object({
  top: z.string().optional(), bottom: z.string().optional(), shoes: z.string().optional(), hair: z.string().optional(), skin: z.string().optional(),
  hairStyle: z.enum(['short', 'long', 'bun', 'curly']).optional(), headband: z.string().optional(),
}).strict();

export const Actor = z.object({
  id: Id,
  asset: z.enum(CHARACTER_ASSETS).default('character.base'),
  variant: z.enum(CHARACTER_VARIANTS).default('a'),
  at: Pt,
  facing: z.enum(['left', 'right']).default('right'),
  scale: z.number().min(0.3).max(2).default(1),
  wardrobe: Wardrobe.optional(),
  face: z.object({ eyes: z.enum(EYES).optional(), brows: z.enum(BROWS).optional(), mouth: z.enum(MOUTHS).optional(), gaze: z.number().min(-2).max(2).optional() }).strict().optional(),
}).strict();

export const Prop = z.object({
  id: Id,
  asset: z.enum(PROP_ASSETS),
  at: Pt.optional(),
  scale: z.number().min(0.2).max(4).default(1),
  rotate: z.number().min(-360).max(360).default(0),
  z: z.number().int().min(-10).max(10).default(0),
  state: z.record(z.union([z.number(), z.string(), z.boolean()])).default({}),
  color: z.string().optional(),
  attachTo: z.object({ actor: Id, hand: z.enum(['left', 'right']) }).strict().optional(),
}).strict();

/** Free shapes for ui scenes (and decorations). */
export const Shape = z.discriminatedUnion('type', [
  z.object({ type: z.literal('rect'), id: Id, x: z.number(), y: z.number(), w: z.number().min(0), h: z.number().min(0), rx: z.number().min(0).optional(), fill: z.string().optional(), stroke: z.string().optional(), sw: z.number().min(0).optional(), opacity: z.number().min(0).max(1).optional(), z: z.number().int().default(0) }).strict(),
  z.object({ type: z.literal('circle'), id: Id, cx: z.number(), cy: z.number(), r: z.number().min(0), fill: z.string().optional(), stroke: z.string().optional(), sw: z.number().min(0).optional(), opacity: z.number().min(0).max(1).optional(), z: z.number().int().default(0) }).strict(),
  z.object({ type: z.literal('text'), id: Id, x: z.number(), y: z.number(), text: z.string().max(40), size: z.number().min(4).max(60), weight: z.number().min(100).max(900).optional(), fill: z.string().optional(), anchor: z.enum(['start', 'middle', 'end']).optional(), opacity: z.number().min(0).max(1).optional(), z: z.number().int().default(0),
    /** Text in a word scene always sits on white: a pill, a speech bubble (with `tail` pointing at something) or a panel that can slide in from an edge. `none` is allowed only in ui scenes. */
    bg: z.enum(['pill', 'bubble', 'panel', 'none']).default('pill'), tail: z.object({ x: z.number(), y: z.number() }).strict().optional(), pad: z.number().min(0).max(30).optional() }).strict(),
  z.object({ type: z.literal('icon'), id: Id, icon: z.enum(['check', 'cross', 'star', 'arrow-right', 'arrow-up', 'arrow-down', 'arc-arrow', 'flag', 'heart', 'exclaim']), x: z.number(), y: z.number(), size: z.number().min(4).max(120), fill: z.string().optional(), stroke: z.string().optional(), opacity: z.number().min(0).max(1).optional(), z: z.number().int().default(0) }).strict(),
]);

const Target = z.string().min(1); // actor / prop / shape id
const Base = { t: Ms };

/** Semantic actions (closed set). Each compiles to tracks – see src/actions. */
export const Action = z.discriminatedUnion('action', [
  // locomotion
  z.object({ ...Base, action: z.literal('walk'), actor: Id, to: Pt, durationMs: Dur.optional() }).strict(),
  z.object({ ...Base, action: z.literal('run'), actor: Id, to: Pt, durationMs: Dur.optional() }).strict(),
  z.object({ ...Base, action: z.literal('jump'), actor: Id, height: z.number().min(4).max(60).default(22), to: Pt.optional(), durationMs: Dur.default(900) }).strict(),
  z.object({ ...Base, action: z.literal('turn'), actor: Id, facing: z.enum(['left', 'right']) }).strict(),
  z.object({ ...Base, action: z.literal('idle'), actor: Id, durationMs: Dur, style: z.enum(['breathe', 'footWiggle', 'none']).default('breathe') }).strict(),
  // manipulation
  z.object({ ...Base, action: z.literal('reach'), actor: Id, hand: z.enum(['left', 'right']).default('right'), target: Id, durationMs: Dur.default(500) }).strict(),
  z.object({ ...Base, action: z.literal('grab'), actor: Id, hand: z.enum(['left', 'right']).default('right'), prop: Id, durationMs: Dur.default(500) }).strict(),
  z.object({ ...Base, action: z.literal('release'), actor: Id, prop: Id, at: Pt.optional(), z: z.number().int().optional(), durationMs: Dur.default(400) }).strict(),
  z.object({ ...Base, action: z.literal('pour'), actor: Id, from: Id, into: Id, amount: z.number().min(0.1).max(1).default(0.7), durationMs: Dur.default(1800) }).strict(),
  z.object({ ...Base, action: z.literal('open'), actor: Id, prop: Id, durationMs: Dur.default(900) }).strict(),
  z.object({ ...Base, action: z.literal('close'), actor: Id, prop: Id, durationMs: Dur.default(900) }).strict(),
  z.object({ ...Base, action: z.literal('sip'), actor: Id, prop: Id, durationMs: Dur.default(1200) }).strict(),
  z.object({ ...Base, action: z.literal('lookAt'), actor: Id, target: z.union([Id, Pt]), durationMs: Dur.default(300) }).strict(),
  // states
  z.object({ ...Base, action: z.literal('relax'), actor: Id, on: Id, durationMs: Dur, legsUp: z.boolean().default(true) }).strict(),
  z.object({ ...Base, action: z.literal('sleep'), actor: Id, on: Id, durationMs: Dur, zzz: z.boolean().default(true) }).strict(),
  z.object({ ...Base, action: z.literal('exercise'), actor: Id, kind: z.enum(['jog', 'stretch', 'kickups']).default('jog'), durationMs: Dur, ball: Id.optional() }).strict(),
  z.object({ ...Base, action: z.literal('express'), actor: Id, emotion: z.enum(['happy', 'surprised', 'angry', 'sad', 'tired', 'content']), durationMs: Dur.default(400) }).strict(),
  z.object({ ...Base, action: z.literal('face'), actor: Id, eyes: z.enum(EYES).optional(), brows: z.enum(BROWS).optional(), mouth: z.enum(MOUTHS).optional(), gaze: z.number().min(-2).max(2).optional() }).strict(),
  // low level
  z.object({ ...Base, action: z.literal('pose'), actor: Id, joints: z.record(z.enum(JOINTS), z.number().min(-180).max(180)), durationMs: Dur.default(400), ease: Ease.default('easeInOut'), lift: z.number().optional(), bodyRotate: z.number().optional() }).strict(),
  z.object({ ...Base, action: z.literal('set'), target: Target, prop: z.string(), value: z.union([z.number(), z.string(), z.boolean()]) }).strict(),
  z.object({ ...Base, action: z.literal('tween'), target: Target, prop: z.string(), to: z.number(), from: z.number().optional(), durationMs: Dur, ease: Ease.default('easeInOut') }).strict(),
  z.object({ ...Base, action: z.literal('emphasis'), target: Target, kind: z.enum(['ring', 'glow', 'arrowDown']).default('ring'), durationMs: Dur.default(800) }).strict(),
  // objects without people
  z.object({ ...Base, action: z.literal('roll'), prop: Id, to: Pt, durationMs: Dur, z: z.number().int().optional() }).strict(),
  z.object({ ...Base, action: z.literal('climb'), actor: Id, prop: Id, durationMs: Dur }).strict(),
]);
export type Action = z.infer<typeof Action>;
export type ActionOf<K extends Action['action']> = Extract<Action, { action: K }>;

export const Contrast = z.object({
  with: z.array(AnimationId).min(1),
  /** machine-checkable claims, e.g. "actor.p.eyes:open>=0.8", "environment.time:day", "prop:mug" */
  distinctiveFeatures: z.array(z.string().min(3)).min(1),
}).strict();

export const Pedagogy = z.object({
  quizEligible: z.boolean().default(false),
  group: z.string().optional(),
  confusableWith: z.array(SenseId).default([]),
  reviewStatus: z.enum(['ai-draft', 'validated', 'reviewed']).default('ai-draft'),
  reviewer: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note: z.string().max(400).optional(),
}).strict().superRefine((p, ctx) => {
  if (p.reviewStatus === 'reviewed' && (!p.reviewer || !p.date)) ctx.addIssue({ code: 'custom', message: 'reviewStatus "reviewed" requires reviewer and date (set by a human)' });
});

export const Scene = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  assetsVersion: z.number().int().min(1).default(ASSETS_VERSION),
  motionsVersion: z.number().int().min(1).default(MOTIONS_VERSION),
  animationId: AnimationId,
  kind: z.enum(['word', 'ui']).default('word'),
  /** concept family (see compiler/templates.ts); its contract is validated */
  template: z.string().regex(/^[a-z][a-z0-9-]*$/).optional(),
  senseId: SenseId.optional(),
  titleSv: z.string().min(1).max(60),
  meaningHint: z.string().max(200).optional(),
  category: z.enum(['action', 'state', 'property', 'relation', 'emotion', 'abstract', 'ui']).default('action'),
  durationMs: Ms,
  loop: z.boolean().default(true),
  holdMs: Ms.default(300),
  posterMs: Ms.optional(),
  canvas: z.object({ w: z.number().int().min(60).max(480), h: z.number().int().min(60).max(240) }).default({ w: 120, h: 120 }),
  background: z.string().optional(),
  environment: z.object({ id: z.enum(ENVIRONMENTS).default('neutral'), time: z.enum(TIMES).default('day'), ground: z.number().optional() }).strict().default({ id: 'neutral', time: 'day' }),
  actors: z.array(Actor).default([]),
  props: z.array(Prop).default([]),
  shapes: z.array(Shape).default([]),
  timeline: z.array(Action).default([]),
  focus: z.object({ targets: z.array(Id).default([]), feature: z.string().optional() }).strict().optional(),
  contrast: Contrast.optional(),
  pedagogy: Pedagogy.default({}),
  label: z.object({ sv: z.string().max(30).optional(), show: z.enum(['never', 'optional', 'always']).default('optional') }).strict().default({ show: 'optional' }),
}).strict().superRefine((s, ctx) => {
  const ids = new Set<string>();
  for (const e of [...s.actors, ...s.props, ...s.shapes]) {
    if (ids.has(e.id)) ctx.addIssue({ code: 'custom', message: `duplicate entity id "${e.id}"`, path: ['actors'] });
    ids.add(e.id);
  }
  const actorIds = new Set(s.actors.map((a) => a.id)), propIds = new Set(s.props.map((p) => p.id));
  for (const p of s.props) {
    if (p.attachTo && !actorIds.has(p.attachTo.actor)) ctx.addIssue({ code: 'custom', message: `prop "${p.id}" attaches to unknown actor "${p.attachTo.actor}"`, path: ['props'] });
    if (!p.at && !p.attachTo) ctx.addIssue({ code: 'custom', message: `prop "${p.id}" needs "at" or "attachTo"`, path: ['props'] });
  }
  s.timeline.forEach((a, i) => {
    const path = ['timeline', i];
    if ('actor' in a && !actorIds.has(a.actor)) ctx.addIssue({ code: 'custom', message: `${a.action}: unknown actor "${a.actor}"`, path });
    const rec = a as unknown as Record<string, unknown>;
    for (const k of ['prop', 'from', 'into', 'on', 'ball'] as const) if (a.action !== 'set' && a.action !== 'tween' && typeof rec[k] === 'string' && !propIds.has(rec[k] as string)) ctx.addIssue({ code: 'custom', message: `${a.action}: unknown prop "${rec[k]}"`, path });
    if ('target' in a && typeof a.target === 'string' && !ids.has(a.target)) ctx.addIssue({ code: 'custom', message: `${a.action}: unknown target "${a.target}"`, path });
    if (a.t > s.durationMs) ctx.addIssue({ code: 'custom', message: `${a.action} starts at ${a.t} ms, after the scene ends (${s.durationMs} ms)`, path });
    const d = 'durationMs' in a ? a.durationMs : 0;
    if (d && a.t + d > s.durationMs + 1) ctx.addIssue({ code: 'custom', message: `${a.action} ends at ${a.t + d} ms, after the scene ends (${s.durationMs} ms)`, path });
  });
  if (s.posterMs !== undefined && s.posterMs > s.durationMs) ctx.addIssue({ code: 'custom', message: 'posterMs must be ≤ durationMs', path: ['posterMs'] });
  if (s.kind === 'word' && !s.senseId) ctx.addIssue({ code: 'custom', message: 'word scenes need a senseId', path: ['senseId'] });
  s.shapes.forEach((sh, i) => { if (s.kind === 'word' && sh.type === 'text' && sh.bg === 'none') ctx.addIssue({ code: 'custom', message: `text "${sh.id}" must have a white background (bg: pill | bubble | panel) – text never sits directly on the scene`, path: ['shapes', i] }); });
  if (s.kind === 'word' && s.actors.length === 0 && s.props.length === 0) ctx.addIssue({ code: 'custom', message: 'a word scene needs at least one actor or prop', path: ['actors'] });
});
export type Scene = z.infer<typeof Scene>;
export type SceneInput = z.input<typeof Scene>;
export type ActorDef = z.infer<typeof Actor>;
export type PropDef = z.infer<typeof Prop>;
export type ShapeDef = z.infer<typeof Shape>;

/** Human-readable issues ("timeline[2]: pour: unknown prop …"). */
export function formatIssues(err: z.ZodError): string[] {
  return err.issues.map((i) => `${i.path.length ? i.path.map((p) => (typeof p === 'number' ? `[${p}]` : p)).join('.').replace(/\.\[/g, '[') + ': ' : ''}${i.message}`);
}
