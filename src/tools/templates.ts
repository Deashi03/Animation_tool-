/** Scene templates: complete, valid scenes with placeholders that `anim:new` fills in. */
import type { SceneInput } from '../schema/scene';

export const TEMPLATES: Record<string, (senseId: string, lemma: string, n: string) => SceneInput> = {
  locomotion: (senseId, lemma, n) => ({
    schemaVersion: 1, animationId: `anim.${lemma}.${n}`, senseId, titleSv: lemma, meaningHint: 'TODO: en mening om betydelsen', category: 'action',
    durationMs: 3200, loop: true, posterMs: 1600, environment: { id: 'outdoors.park', time: 'day' },
    actors: [{ id: 'p', at: { x: 22, y: 100 }, facing: 'right' }],
    timeline: [{ t: 0, action: 'walk', actor: 'p', to: { x: 96, y: 100 }, durationMs: 2800 }],
    focus: { targets: ['p'] }, pedagogy: { quizEligible: false, group: 'rörelse', confusableWith: [] },
  }),
  'manipulate-prop': (senseId, lemma, n) => ({
    schemaVersion: 1, animationId: `anim.${lemma}.${n}`, senseId, titleSv: lemma, meaningHint: 'TODO', category: 'action',
    durationMs: 3000, loop: true, posterMs: 1800, environment: { id: 'room', time: 'day' },
    actors: [{ id: 'p', at: { x: 44, y: 100 }, facing: 'right' }],
    props: [{ id: 'thing', asset: 'box', at: { x: 84, y: 100 } }],
    timeline: [{ t: 200, action: 'open', actor: 'p', prop: 'thing', durationMs: 1200 }],
    focus: { targets: ['p', 'thing'] }, pedagogy: { quizEligible: false, confusableWith: [] },
  }),
  relax: (senseId, lemma, n) => ({
    schemaVersion: 1, animationId: `anim.${lemma}.${n}`, senseId, titleSv: lemma, meaningHint: 'TODO', category: 'state',
    durationMs: 4000, loop: true, posterMs: 2200, environment: { id: 'room', time: 'day' },
    actors: [{ id: 'p', at: { x: 60, y: 100 }, facing: 'right' }],
    props: [{ id: 'sofa', asset: 'sofa', at: { x: 60, y: 100 }, z: -1 }, { id: 'phone', asset: 'phone', attachTo: { actor: 'p', hand: 'left' } }],
    timeline: [{ t: 0, action: 'relax', actor: 'p', on: 'sofa', durationMs: 4000 }],
    focus: { targets: ['p'] }, pedagogy: { quizEligible: false, confusableWith: [] },
  }),
  emotion: (senseId, lemma, n) => ({
    schemaVersion: 1, animationId: `anim.${lemma}.${n}`, senseId, titleSv: lemma, meaningHint: 'TODO', category: 'emotion',
    durationMs: 2600, loop: true, posterMs: 1400, environment: { id: 'neutral', time: 'day' },
    actors: [{ id: 'p', at: { x: 60, y: 100 }, facing: 'right' }],
    timeline: [{ t: 0, action: 'idle', actor: 'p', durationMs: 600 }, { t: 600, action: 'express', actor: 'p', emotion: 'surprised', durationMs: 500 }, { t: 1100, action: 'idle', actor: 'p', durationMs: 1500 }],
    focus: { targets: ['p'] }, pedagogy: { quizEligible: false, confusableWith: [] },
  }),
  ui: (_senseId, lemma, n) => ({
    schemaVersion: 1, animationId: `ui.${lemma}.${n}`, kind: 'ui', titleSv: lemma, category: 'ui', durationMs: 1200, loop: false, holdMs: 600, posterMs: 1200,
    canvas: { w: 360, h: 120 },
    shapes: [{ type: 'rect', id: 'bar', x: 0, y: 120, w: 360, h: 72, rx: 16, fill: 'uiSuccess' }],
    timeline: [{ t: 0, action: 'tween', target: 'bar', prop: 'y', to: 48, durationMs: 420, ease: 'easeOut' }],
    pedagogy: { quizEligible: false, confusableWith: [] },
  }),
};
