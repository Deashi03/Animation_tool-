import { createHash } from 'node:crypto';
import { addKey, sample, tween, dense, fractionEqual, type Tracks } from '../src/engine/track';
import { ease, EASE_NAMES } from '../src/engine/easing';
import { solveRig, REST_POSE, LIMITS, clampJoint, reachAngles, SEG } from '../src/engine/rig';
import { compileScene } from '../src/compiler/compile';
import { renderFrame } from '../src/engine/render';
import { frameToSvg } from '../src/engine/svgString';
import { bboxOfId } from '../src/engine/frame';
import { loadScenes } from '../src/tools/scenes';
import { Scene } from '../src/schema/scene';
import { validateScene } from '../src/compiler/validate';

describe('tracks and easing', () => {
  it('interpolates numbers, steps strings, holds outside the range', () => {
    const tr: Tracks = new Map();
    addKey(tr, 'x', { t: 0, v: 0 }); addKey(tr, 'x', { t: 1000, v: 100, e: 'linear' });
    expect(sample(tr, 'x', 500)).toBe(50); expect(sample(tr, 'x', -5)).toBe(0); expect(sample(tr, 'x', 5000)).toBe(100);
    addKey(tr, 'eyes', { t: 0, v: 'open' }); addKey(tr, 'eyes', { t: 1000, v: 'closed' });
    expect(sample(tr, 'eyes', 999)).toBe('open'); expect(sample(tr, 'eyes', 1000)).toBe('closed');
    expect(fractionEqual(tr, 'eyes', 0, 2000, 'closed')).toBeGreaterThan(0.45);
  });
  it('keys stay sorted and tween starts from the current value', () => {
    const tr: Tracks = new Map();
    addKey(tr, 'x', { t: 500, v: 5 }); addKey(tr, 'x', { t: 100, v: 1 }); addKey(tr, 'x', { t: 300, v: 3 });
    expect(tr.get('x')!.keys.map((k) => k.t)).toEqual([100, 300, 500]);
    tween(tr, 'x', 700, 900, 9);
    expect(sample(tr, 'x', 700)).toBe(5); expect(sample(tr, 'x', 900)).toBe(9);
    dense(tr, 'y', 0, 400, (_t, u) => u * 10);
    expect(sample(tr, 'y', 200)).toBeCloseTo(5, 5);
  });
  it('every easing maps 0→0 and 1→1', () => { for (const n of EASE_NAMES) { expect(ease[n](0)).toBeCloseTo(0, 6); expect(ease[n](1)).toBeCloseTo(1, 6); } });
});

describe('rig', () => {
  it('clamps joints to natural limits (elbows forward, knees backward)', () => {
    expect(clampJoint('fArmL', -40)).toBe(0); expect(clampJoint('shinL', 40)).toBe(0); expect(clampJoint('head', 200)).toBe(LIMITS.head[1]);
  });
  it('stands with feet on the ground and the head above the hips; facing mirrors x', () => {
    const r = solveRig(REST_POSE, 1), l = solveRig(REST_POSE, -1);
    expect(r.ankleL[1]).toBeCloseTo(-SEG.hipH + SEG.thigh + SEG.shin, 1);
    expect(r.head[1]).toBeLessThan(r.hip[1]);
    expect(l.toeL[0] - l.ankleL[0]).toBeCloseTo(-(r.toeL[0] - r.ankleL[0]), 5); // feet point the way the figure faces
  });
  it('two-bone IK reaches a target within arm length', () => {
    const sh: [number, number] = [0, 0], target: [number, number] = [15, -10];
    const { u, f } = reachAngles(sh, target, SEG.uArm, SEG.fArm);
    const rad = (d: number) => (d * Math.PI) / 180;
    const elbow = [SEG.uArm * Math.sin(rad(u)), SEG.uArm * Math.cos(rad(u))];
    const hand = [elbow[0]! + SEG.fArm * Math.sin(rad(u + f)), elbow[1]! + SEG.fArm * Math.cos(rad(u + f))];
    expect(hand[0]).toBeCloseTo(15, 0); expect(hand[1]).toBeCloseTo(-10, 0);
  });
});

describe('renderFrame determinism', () => {
  const { scenes } = loadScenes();
  const hash = (s: string) => createHash('sha1').update(s).digest('hex').slice(0, 12);
  it('same scene + same t ⇒ identical SVG, across separate compilations', () => {
    for (const [, s] of scenes) {
      const a = compileScene(s), b = compileScene(JSON.parse(JSON.stringify(s)) as Scene);
      for (const u of [0, 0.25, 0.5, 0.75, 1]) {
        const t = Math.round(s.durationMs * u);
        expect(frameToSvg(renderFrame(a, t))).toBe(frameToSvg(renderFrame(b, t)));
      }
    }
  });
  it('snapshot of frame hashes (update deliberately when the look changes)', () => {
    const out: Record<string, string[]> = {};
    for (const [id, s] of [...scenes].sort(([a], [b]) => a.localeCompare(b))) { const c = compileScene(s); out[id] = [0, 0.5, 1].map((u) => hash(frameToSvg(renderFrame(c, Math.round(s.durationMs * u))))); }
    expect(out).toMatchSnapshot();
  });
  it('focus entities stay inside the canvas and actors keep their feet on the ground', () => {
    for (const [id, s] of scenes) {
      const c = compileScene(s);
      for (const u of [0, 0.3, 0.6, 1]) {
        const f = renderFrame(c, Math.round(s.durationMs * u));
        for (const a of s.actors) { const b = bboxOfId(f.root, `entity.${a.id}`)!; expect(b, `${id} ${a.id}`).toBeTruthy(); expect(b.x1).toBeGreaterThan(-5); expect(b.x2).toBeLessThan(s.canvas.w + 5); expect(b.y2).toBeLessThan(s.canvas.h + 5); }
      }
    }
  });
  it('the string renderer escapes text', () => {
    const s = Scene.parse({ schemaVersion: 1, animationId: 'ui.x.1', kind: 'ui', titleSv: 'x', durationMs: 100, canvas: { w: 100, h: 60 }, shapes: [{ type: 'text', id: 't', x: 10, y: 10, text: '<b>&"', size: 10 }], label: { show: 'never' } });
    const svg = frameToSvg(renderFrame(compileScene(s), 0));
    expect(svg).not.toContain('<b>'); expect(svg).toContain('&lt;b&gt;&amp;&quot;');
  });
});

describe('semantics', () => {
  const { scenes } = loadScenes();
  it('pour: the jug tilts, the stream shows, the glass fills and the jug empties', () => {
    const c = compileScene(scenes.get('anim.hälla.1')!);
    const n = (id: string, t: number) => sample(c.tracks, id, t) as number;
    expect(n('glass.s.fill', 0)).toBe(0); expect(n('glass.s.fill', c.durationMs)).toBeCloseTo(0.75, 2);
    expect(n('jug.s.tilt', 1200)).toBeGreaterThan(0.9); expect(n('jug.s.tilt', c.durationMs)).toBeLessThan(0.05);
    expect(sample(c.tracks, 'fx.pour.jug', 1500)).toBe('glass'); expect(sample(c.tracks, 'fx.pour.jug', 0)).toBe('');
    expect(n('jug.s.level', c.durationMs)).toBeLessThan(n('jug.s.level', 0));
  });
  it('slappa vs sova differ in eyes, light and posture; both validate', () => {
    const a = compileScene(scenes.get('anim.slappa.1')!), b = compileScene(scenes.get('anim.sova.1')!);
    expect(fractionEqual(a.tracks, 'p.eyes', 0, a.durationMs, 'half')).toBeGreaterThan(0.7);
    expect(fractionEqual(b.tracks, 'p.eyes', 0, b.durationMs, 'closed')).toBeGreaterThan(0.9);
    expect(a.scene.environment.time).toBe('day'); expect(b.scene.environment.time).toBe('night');
    expect(sample(b.tracks, 'p.bodyRotate', 1000)).toBe(-90); expect(sample(a.tracks, 'p.bodyRotate', 1000)).toBe(0);
  });
  it('open/close end with the door open/closed; run is airborne, walk is not', () => {
    const o = compileScene(scenes.get('anim.öppna.1')!), s = compileScene(scenes.get('anim.stänga.1')!);
    expect(sample(o.tracks, 'door.s.angle', o.durationMs)).toBeCloseTo(1, 2); expect(sample(s.tracks, 'door.s.angle', s.durationMs)).toBeCloseTo(0, 2);
    const run = compileScene(scenes.get('anim.springa.1')!), walk = compileScene(scenes.get('anim.gå.1')!);
    const peak = (c: typeof run) => Math.max(...Array.from({ length: 50 }, (_, i) => sample(c.tracks, 'p.lift', (c.durationMs * i) / 49) as number));
    expect(peak(run)).toBeGreaterThan(3); expect(peak(walk)).toBeLessThan(2);
  });
  it('a held prop follows the hand and "behind" lowers the z-order', () => {
    const c = compileScene(scenes.get('anim.bakom.1')!);
    expect(sample(c.tracks, 'ball.attach', 0)).toBe('p:right');
    expect(sample(c.tracks, 'ball.attach', c.durationMs)).toBe('');
    expect(sample(c.tracks, 'ball.z', c.durationMs)).toBe(1);
    const f = renderFrame(c, c.durationMs);
    const ball = bboxOfId(f.root, 'entity.ball')!, box = bboxOfId(f.root, 'entity.box')!;
    expect(ball.x2).toBeGreaterThan(box.x1); expect(ball.y1).toBeLessThan(box.y1); // partly visible behind the box
  });
  it('contrast checks reject a pair that does not differ', () => {
    const a = scenes.get('anim.slappa.1')!;
    const same = { ...a, animationId: 'anim.slappa.2', contrast: { with: ['anim.slappa.1'], distinctiveFeatures: ['environment.time:day'] } } as Scene;
    const v = validateScene(same, scenes);
    expect(v.problems.some((p) => /not visibly different/.test(p.message))).toBe(true);
  });
});
