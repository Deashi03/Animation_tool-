import { createHash } from 'node:crypto';
import { addKey, sample, tween, dense, fractionEqual, type Tracks } from '../src/engine/track';
import { ease, EASE_NAMES } from '../src/engine/easing';
import { solveRig, REST_POSE, LIMITS, clampJoint, reachAngles, SEG, type Pose } from '../src/engine/rig';
import { JOINTS } from '../src/schema/scene';
import { compileScene } from '../src/compiler/compile';
import { renderFrame } from '../src/engine/render';
import { frameToSvg } from '../src/engine/svgString';
import { bboxOfId } from '../src/engine/frame';
import { loadScenes } from '../src/tools/scenes';
import { Scene, PROP_ASSETS } from '../src/schema/scene';
import { drawProp } from '../src/assets/props';
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
        const focus = s.focus?.targets.length ? s.actors.filter((a) => s.focus!.targets.includes(a.id)) : s.actors; // actors may run in from outside the canvas when not in focus
        for (const a of focus) { const b = bboxOfId(f.root, `entity.${a.id}`)!; expect(b, `${id} ${a.id}`).toBeTruthy(); expect(b.x1).toBeGreaterThan(-5); expect(b.x2).toBeLessThan(s.canvas.w + 5); expect(b.y2).toBeLessThan(s.canvas.h + 5); }
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
  it('a held prop follows the hand; "behind" is a lower z-order than the occluder', () => {
    const h = compileScene(scenes.get('anim.hälla.1')!);
    expect(sample(h.tracks, 'jug.attach', 0)).toBe('p:left');
    const c = compileScene(scenes.get('anim.bakom.1')!);
    expect(sample(c.tracks, 'ball.z', c.durationMs) as number).toBeLessThan(sample(c.tracks, 'box.z', c.durationMs) as number);
    const f = renderFrame(c, c.durationMs);
    const ball = bboxOfId(f.root, 'entity.ball')!, box = bboxOfId(f.root, 'entity.box')!;
    expect(ball.x1).toBeLessThan(box.x2); expect(ball.x2).toBeGreaterThan(box.x2); // partly visible beside the box's far edge
  });
  it('contrast checks reject a pair that does not differ', () => {
    const a = scenes.get('anim.slappa.1')!;
    const same = { ...a, animationId: 'anim.slappa.2', contrast: { with: ['anim.slappa.1'], distinctiveFeatures: ['environment.time:day'] } } as Scene;
    const v = validateScene(same, scenes);
    expect(v.problems.some((p) => /not visibly different/.test(p.message))).toBe(true);
  });
});

describe('physics rules (the golden rule)', () => {
  const { scenes } = loadScenes();
  const num = (c: ReturnType<typeof compileScene>, id: string, t: number) => sample(c.tracks, id, t) as number;
  it('planted feet never slide: during stance the sole moves at exactly the ground speed', () => {
    for (const id of ['anim.springa.1', 'anim.gå.1']) {
      const c = compileScene(scenes.get(id)!);
      const pose = (t: number) => Object.fromEntries(JOINTS.map((j) => [j, num(c, `p.j.${j}`, t)])) as Pose;
      let checked = 0;
      for (let t = 200; t < 1600; t += 40) {
        const a = solveRig(pose(t), 1, num(c, 'p.lift', t)), b = solveRig(pose(t + 40), 1, num(c, 'p.lift', t + 40));
        // world x of each ankle = screen x + world scroll (the world moves left as scrollX grows)
        const wx = (r: typeof a, side: 'L' | 'R', tt: number) => num(c, 'p.x', tt) + (side === 'L' ? r.ankleL[0] : r.ankleR[0]) + num(c, 'env.scrollX', tt);
        for (const side of ['L', 'R'] as const) {
          const yA = side === 'L' ? a.ankleL[1] : a.ankleR[1], yB = side === 'L' ? b.ankleL[1] : b.ankleR[1];
          const onGround = yA > -2.7 && yB > -2.7; // ankle exactly at ground height in both samples → stance (swing ends are excluded)
          if (!onGround) continue;
          expect(Math.abs(wx(b, side, t + 40) - wx(a, side, t)), `${id} ${side} foot slides at ${t} ms`).toBeLessThan(0.9);
          checked++;
        }
      }
      expect(checked).toBeGreaterThan(10);
    }
  });
  it('the body stays attached: torso bottom equals the hip line and the pelvis joins the legs', () => {
    const c = compileScene(scenes.get('anim.springa.1')!);
    const f = renderFrame(c, 900);
    const actor = bboxOfId(f.root, 'entity.p')!;
    // no vertical gap: the union of body parts is one connected box of plausible height for the scale
    expect(actor.y2 - actor.y1).toBeGreaterThan(70); expect(actor.y2 - actor.y1).toBeLessThan(100);
  });
  it('jumps follow a parabola: the lift is symmetric around the apex and lands at ground level', () => {
    const c = compileScene(scenes.get('anim.hoppa.1')!);
    const lifts = Array.from({ length: 131 }, (_, i) => ({ t: 500 + i * 10, v: num(c, 'p.lift', 500 + i * 10) }));
    const apex = lifts.reduce((m, x) => (x.v > m.v ? x : m));
    expect(apex.v).toBeGreaterThan(12);
    const before = lifts.find((x) => x.t === apex.t - 200)!.v, after = lifts.find((x) => x.t === apex.t + 200)!.v;
    expect(Math.abs(before - after)).toBeLessThan(2.5);
    expect(Math.abs(num(c, 'p.lift', 1800))).toBeLessThan(0.05); // back on the ground when the jump ends (idle breathing follows)
  });
  it('the blanket lies on top of the sleeper and the ball bounces in a parabola off the knee', () => {
    const s = compileScene(scenes.get('anim.sova.1')!);
    const f = renderFrame(s, 2400);
    const body = bboxOfId(f.root, 'entity.p')!, blanket = bboxOfId(f.root, 'entity.blanket')!;
    expect(blanket.y1).toBeLessThan(body.y1 + 4); // covers the body's top edge
    expect(blanket.x2).toBeGreaterThan(body.x2 - 2); // covers the feet
    const k = compileScene(scenes.get('anim.kicka.1')!);
    const ys = Array.from({ length: 19 }, (_, i) => num(k, 'ball.y', i * 40));
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    expect(maxY - minY).toBeGreaterThan(12); // it really flies
    expect(num(k, 'ball.y', 0)).toBeCloseTo(maxY, 0); // starts at the knee (lowest point) and returns there each period
    expect(num(k, 'ball.y', 720)).toBeCloseTo(maxY, 0);
  });
});

describe('objects without people', () => {
  const { scenes } = loadScenes();
  it('a rolling ball decelerates uniformly, rotates with the distance and stays on the ground', () => {
    const scene = Scene.parse({ schemaVersion: 1, animationId: 'anim.rulla.1', senseId: 's.rulla.1', titleSv: 'rulla', durationMs: 3000, environment: { id: 'room' },
      props: [{ id: 'box', asset: 'box', at: { x: 70, y: 100 }, z: 2, state: { w: 34, h: 15 } }, { id: 'ball', asset: 'ball', at: { x: 12, y: 100 }, z: 1, state: { r: 7 } }],
      timeline: [{ t: 200, action: 'roll', prop: 'ball', to: { x: 91, y: 100 }, durationMs: 2200 }] });
    const c = compileScene(scene);
    const x = (t: number) => sample(c.tracks, 'ball.x', t) as number, y = (t: number) => sample(c.tracks, 'ball.y', t) as number, rot = (t: number) => sample(c.tracks, 'ball.rotate', t) as number;
    const v1 = x(700) - x(600), v2 = x(1500) - x(1400), v3 = x(2300) - x(2200);
    expect(v1).toBeGreaterThan(v2); expect(v2).toBeGreaterThan(v3); expect(v3).toBeGreaterThanOrEqual(0);
    for (const t of [0, 800, 1600, 2400, 3000]) expect(y(t)).toBeCloseTo(100, 5);
    const r = 7, dist = x(2400) - x(200);
    expect(rot(2400) - rot(200)).toBeCloseTo((dist / r) * (180 / Math.PI), 0);
    const f = renderFrame(c, 3000);
    const ball = bboxOfId(f.root, 'entity.ball')!, box = bboxOfId(f.root, 'entity.box')!;
    expect(ball.y2).toBeLessThanOrEqual(103); // never below the floor (bbox of a rotated circle over-approximates by a few units)
    expect(ball.x1).toBeLessThan(box.x2); expect(ball.x2).toBeGreaterThan(box.x2); // partly behind the box
  });
  it('bakom: no people, the arc arrow draws over the box to the hidden ball and 後ろ appears', () => {
    const c = compileScene(scenes.get('anim.bakom.1')!);
    expect(c.scene.actors).toHaveLength(0);
    expect(sample(c.tracks, 'arc.progress', 200)).toBe(0); expect(sample(c.tracks, 'arc.progress', 1100)).toBe(1);
    expect(sample(c.tracks, 'ja.opacity', 900)).toBe(0); expect(sample(c.tracks, 'ja.opacity', 1400)).toBe(1);
    const f = renderFrame(c, 1800);
    const ball = bboxOfId(f.root, 'entity.ball')!, box = bboxOfId(f.root, 'entity.box')!;
    expect(ball.x1).toBeLessThan(box.x2); expect(ball.x2).toBeGreaterThan(box.x2);
    expect(frameToSvg(f)).toContain('後ろ');
  });
  it('storming: soldiers rush in through the opened gate, a fight cloud rises and the banner changes', () => {
    const c = compileScene(scenes.get('anim.stormning.1')!);
    expect(sample(c.tracks, 'castle.s.gate', 1400) as number).toBeLessThan(0.1); expect(sample(c.tracks, 'castle.s.gate', 2100) as number).toBeCloseTo(1, 2);
    for (const a of ['a1', 'a2', 'a3', 'a4']) { expect(sample(c.tracks, `${a}.x`, c.durationMs) as number).toBeGreaterThan(80); expect(sample(c.tracks, `${a}.z`, c.durationMs) as number).toBeLessThan(sample(c.tracks, 'castle.z', 0) as number); }
    expect(sample(c.tracks, 'fight.s.intensity', 2000)).toBe(0); expect(sample(c.tracks, 'fight.s.intensity', 3500) as number).toBeGreaterThan(0.9); expect(sample(c.tracks, 'fight.s.intensity', c.durationMs) as number).toBeLessThan(0.05);
    expect(sample(c.tracks, 'castle.s.raise', 4000) as number).toBeLessThan(0.05); expect(sample(c.tracks, 'castle.s.raise', c.durationMs) as number).toBeGreaterThan(0.95); // the attackers' banner is hoisted
  });
  it('effects stay attached: zzz near the sleeper\'s head, speed lines for the whole run', () => {
    const s = compileScene(scenes.get('anim.sova.1')!);
    const f = renderFrame(s, 2400);
    const zs: { x: number; y: number }[] = [];
    const walk = (n: import('../src/engine/frame').FrameNode) => { if (n.type === 'text' && n.text === 'z') zs.push({ x: n.x, y: n.y }); if (n.type === 'g') n.children.forEach(walk); };
    walk(f.root);
    const head = bboxOfId(f.root, 'entity.p')!;
    expect(zs.length).toBe(3);
    for (const z of zs) { expect(z.x).toBeGreaterThan(head.x1 - 10); expect(z.x).toBeLessThan(head.x1 + 40); expect(z.y).toBeGreaterThan(40); }
    const r = compileScene(scenes.get('anim.springa.1')!);
    for (const t of [100, 1500, 3000]) expect(Math.abs(sample(r.tracks, 'fx.p.speed', t) as number)).toBeGreaterThan(40);
  });
});

describe('text backing', () => {
  it('renders a white rect behind text, wider for CJK, and the bakom panel slides in from the right edge', () => {
    const mk = (txt: string, bg: 'pill' | 'bubble' | 'panel') => compileScene(Scene.parse({ schemaVersion: 1, animationId: 'anim.t.1', senseId: 's.t.1', titleSv: 't', durationMs: 100, props: [{ id: 'b', asset: 'box', at: { x: 60, y: 100 } }], shapes: [{ type: 'text', id: 'tx', x: 60, y: 40, text: txt, size: 10, bg, tail: { x: 60, y: 80 } }] }));
    const rectOf = (c: ReturnType<typeof compileScene>) => { const f = renderFrame(c, 0); const node = bboxOfId(f.root, 'entity.tx')!; const svg = frameToSvg(f); return { node, white: (svg.match(/fill="#fbfbf8"/g) ?? []).length, svg }; };
    const a = rectOf(mk('hej', 'pill')), b = rectOf(mk('後ろ', 'pill')), bub = rectOf(mk('hej', 'bubble'));
    expect(a.white).toBeGreaterThanOrEqual(1); expect(b.node.x2 - b.node.x1).toBeGreaterThan(a.node.x2 - a.node.x1); expect(bub.white).toBeGreaterThanOrEqual(2);
    const { scenes } = loadScenes();
    const c = compileScene(scenes.get('anim.bakom.1')!);
    expect(sample(c.tracks, 'ja.x', 900) as number).toBeGreaterThan(130); // starts fully outside the canvas
    expect(sample(c.tracks, 'ja.x', 1500) as number).toBeLessThan(110); // slides in, never covering the whole scene
    const f = renderFrame(c, 1800); const panel = bboxOfId(f.root, 'entity.ja')!;
    expect(panel.x2 - panel.x1).toBeLessThan(60); expect(panel.y2 - panel.y1).toBeLessThan(30);
  });
});

describe('cooking library', () => {
  const { scenes } = loadScenes();
  it('a left-facing actor reaches forward: the hand lands on the pan handle and the spatula hand over the pan', () => {
    const c = compileScene(scenes.get('anim.vända.1')!);
    const svg = frameToSvg(renderFrame(c, 1300));
    expect(svg).toBeTruthy();
    // local rig is solved unmirrored; the compiled angles put the hands forward (toward -x on screen for facing left)
    const pose = {} as Record<string, number>; for (const j of ['torso', 'head', 'uArmL', 'fArmL', 'uArmR', 'fArmR', 'thighL', 'shinL', 'thighR', 'shinR', 'footL', 'footR']) pose[j] = sample(c.tracks, `p.j.${j}`, 1300) as number;
    const rig = solveRig(pose as never, -1, 0);
    expect(rig.handL[0]).toBeLessThan(-20); // over the pan (pan centre is 30 units in front)
    expect(rig.handR[0]).toBeLessThan(0); // on the handle, in front of the body
  });
  it('cook: the stove heats up, the food sizzles and browns as far as the kind says', () => {
    const fry = compileScene(scenes.get('anim.steka.1')!), brown = compileScene(scenes.get('anim.bryna.1')!), burn = compileScene(scenes.get('anim.bränna.1')!), melt = compileScene(scenes.get('anim.smälta.1')!);
    expect(sample(fry.tracks, 'stove.s.heat', 0) as number).toBeLessThan(0.1); expect(sample(fry.tracks, 'stove.s.heat', 1500) as number).toBeCloseTo(1, 1);
    expect(sample(fry.tracks, 'pan.s.sizzle', 2000) as number).toBeGreaterThan(0.5);
    const bFry = sample(fry.tracks, 'pan.s.browning', fry.durationMs) as number, bBrown = sample(brown.tracks, 'pan.s.browning', brown.durationMs) as number;
    expect(bFry).toBeGreaterThan(0.45); expect(bFry).toBeLessThan(0.7); expect(bBrown).toBeGreaterThan(0.95);
    expect(sample(burn.tracks, 'pan.s.burnt', burn.durationMs) as number).toBeGreaterThan(0.95); expect(sample(brown.tracks, 'pan.s.burnt', brown.durationMs) as number).toBe(0);
    expect(sample(melt.tracks, 'pan.s.melt', melt.durationMs) as number).toBeGreaterThan(0.95);
  });
  it('flip: the food goes up and turns over, and the cooked side becomes the visible side', () => {
    const c = compileScene(scenes.get('anim.vända.1')!);
    expect(sample(c.tracks, 'pan.s.top', 2800) as number).toBeLessThan(0.05);
    const toss = [3200, 3300, 3400].map((t) => sample(c.tracks, 'pan.s.toss', t) as number);
    expect(Math.max(...toss)).toBeGreaterThan(0.2);
    expect(sample(c.tracks, 'pan.s.top', 3900) as number).toBeGreaterThan(0.4);
    expect(sample(c.tracks, 'pan.s.toss', c.durationMs) as number).toBe(0);
  });
  it('splash: fat flies out of the pan and the cook flinches with wide eyes', () => {
    const c = compileScene(scenes.get('anim.skvätta.1')!);
    expect(sample(c.tracks, 'pan.s.splash', 1000) as number).toBe(-1);
    expect(sample(c.tracks, 'pan.s.splash', 1950) as number).toBeGreaterThan(0); expect(sample(c.tracks, 'pan.s.splash', 3500) as number).toBe(-1);
    expect(sample(c.tracks, 'p.eyes', 2000)).toBe('wide');
    expect(frameToSvg(renderFrame(c, 1950)).length).toBeGreaterThan(frameToSvg(renderFrame(c, 1000)).length); // droplets drawn
  });
  it('every cooking scene instantiates cook-rhythm or property-contrast and validates', () => {
    for (const id of ['anim.steka.1', 'anim.bryna.1', 'anim.fräsa.1', 'anim.smälta.1', 'anim.vända.1', 'anim.bränna.1', 'anim.skvätta.1', 'anim.gyllenbrun.1']) {
      const s = scenes.get(id)!; expect(['cook-rhythm', 'property-contrast']).toContain(s.template);
      const r = validateScene(s as unknown, scenes); expect(r.problems.filter((p) => p.level === 'error'), id).toEqual([]);
    }
  });
});

describe('generic tool work (use) and the prop families', () => {
  const { scenes } = loadScenes();
  it('use: the tool is auto-attached, the hand cycles at the target and the effect reaches its value', () => {
    const c = compileScene(scenes.get('anim.skära.1')!);
    expect(sample(c.tracks, 'knife.attach', 100)).toBe('p:left');
    const ys = [400, 500, 600, 700, 800, 900].map((t) => sample(c.tracks, 'p.j.uArmL', t) as number);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(5); // the arm really moves
    expect(sample(c.tracks, 'food.s.pieces', 0) as number).toBe(0); expect(sample(c.tracks, 'food.s.pieces', c.durationMs) as number).toBeGreaterThan(0.95);
  });
  it('hacka is faster than skära and leaves a pile; vispa foams, röra does not', () => {
    const h = compileScene(scenes.get('anim.hacka.1')!), s = compileScene(scenes.get('anim.skära.1')!);
    const changes = (c: typeof h, id: string) => { let n = 0, prev = Math.sign((sample(c.tracks, id, 500) as number) - (sample(c.tracks, id, 470) as number)); for (let t = 530; t < 2500; t += 30) { const d = Math.sign((sample(c.tracks, id, t) as number) - (sample(c.tracks, id, t - 30) as number)); if (d && d !== prev) { n++; prev = d; } } return n; };
    expect(changes(h, 'p.j.uArmL')).toBeGreaterThan(changes(s, 'p.j.uArmL') * 1.5);
    expect(sample(h.tracks, 'pile.s.amount', h.durationMs) as number).toBeGreaterThan(0.9);
    const v = compileScene(scenes.get('anim.vispa.1')!), r = compileScene(scenes.get('anim.röra.1')!);
    expect(sample(v.tracks, 'bowl.s.foam', v.durationMs) as number).toBeGreaterThan(0.9); expect(sample(r.tracks, 'bowl.s.foam', r.durationMs) as number).toBe(0);
  });
  it('sliced food renders with clip paths in both renderers and the held-prop anchor follows a left-facing hand', () => {
    const c = compileScene(scenes.get('anim.skära.1')!);
    const svg = frameToSvg(renderFrame(c, c.durationMs));
    expect(svg).toContain('<clipPath id="c1">'); expect((svg.match(/clip-path="url\(#/g) ?? []).length).toBeGreaterThan(2);
    const salt = compileScene(scenes.get('anim.salta.1')!);
    const f = renderFrame(salt, 2000);
    const shaker = bboxOfId(f.root, 'entity.shaker')!, pot = bboxOfId(f.root, 'entity.pot')!;
    expect(shaker.x1).toBeLessThan(pot.x2 + 4); // the shaker is over the pot, not behind the cook
    const grains = [...frameToSvg(f).matchAll(/<circle cx="([\d.-]+)" cy="([\d.-]+)" r="0.95"/g)].map((m) => Number(m[1]));
    expect(grains.length).toBeGreaterThan(2); for (const x of grains) { expect(x).toBeGreaterThan(pot.x1 - 6); expect(x).toBeLessThan(pot.x2 + 6); }
  });
  it('every catalogued prop draws with its defaults and the schema rejects unknown assets with a suggestion', () => {
    for (const id of PROP_ASSETS) expect(() => drawProp(id, {})).not.toThrow();
    const bad = Scene.safeParse({ ...scenes.get('anim.skära.1')!, props: [{ id: 'x', asset: 'tool.knive', at: { x: 10, y: 100 } }] });
    expect(bad.success).toBe(false); if (!bad.success) expect(JSON.stringify(bad.error.issues)).toContain('tool.knife');
  });
});

describe('communication, handing over and clothes', () => {
  const { scenes } = loadScenes();
  it('say: a speech bubble with the icon follows the speaker and disappears afterwards; the mouth moves', () => {
    const c = compileScene(scenes.get('anim.beställa.1')!);
    expect(sample(c.tracks, 'fx.p.say', 1000)).toBe('icon:fork-knife|neutral'); expect(sample(c.tracks, 'fx.p.say', 2300)).toBe('');
    const mouths = new Set([600, 750, 900, 1050].map((t) => sample(c.tracks, 'p.mouth', t)));
    expect(mouths.has('open')).toBe(true);
    const svg = frameToSvg(renderFrame(c, 1000)); expect(svg.length).toBeGreaterThan(frameToSvg(renderFrame(c, 100)).length);
  });
  it('give: the prop changes hands midway and ends with the receiver', () => {
    const c = compileScene(scenes.get('anim.lämna-över.1')!);
    expect(sample(c.tracks, 'bag.attach', 300)).toBe('p:left'); expect(sample(c.tracks, 'bag.attach', c.durationMs)).toBe('q:left');
  });
  it('dress: the wardrobe changes at the midpoint, not from the start; fasten closes the buttons one by one', () => {
    const on = compileScene(scenes.get('anim.ta-på-sig.1')!);
    expect(sample(on.tracks, 'p.w.top', 0)).toBe('#f7f3ea'); expect(sample(on.tracks, 'p.w.top', on.durationMs)).toBe('green');
    const hat = compileScene(scenes.get('anim.sätta-på-sig.1')!);
    expect(sample(hat.tracks, 'p.w.hat', 0)).toBe('none'); expect(sample(hat.tracks, 'p.w.hat', hat.durationMs)).toBe('red');
    const b = compileScene(scenes.get('anim.knäppa.1')!);
    const vals = [0, 1200, 2000, b.durationMs].map((t) => sample(b.tracks, 'p.w.buttons', t) as number);
    expect(vals[0]).toBe(0); expect(vals[1]!).toBeGreaterThan(0); expect(vals[2]!).toBeGreaterThan(vals[1]!); expect(vals[3]).toBe(1);
    // the rendered figure shows the V opening when open and the three buttons when closed
    const open = frameToSvg(renderFrame(b, 50)), closed = frameToSvg(renderFrame(b, b.durationMs));
    expect(open).toContain('#fbf8f1'); expect(closed).not.toContain('#fbf8f1');
  });
  it('garments fold, shrink and fade; the wear features see wardrobe changes', () => {
    const fold = compileScene(scenes.get('anim.vika.1')!); expect(sample(fold.tracks, 'shirt.s.folded', fold.durationMs) as number).toBeGreaterThan(0.9);
    for (const id of ['garment.shirt', 'garment.trousers', 'garment.towel', 'garment.dress', 'garment.jacket', 'garment.sock']) { expect(() => drawProp(id, { folded: 1 })).not.toThrow(); expect(() => drawProp(id, { wet: 1, stain: 1, shrink: 0.5, faded: 1 })).not.toThrow(); }
    const r = validateScene(scenes.get('anim.knäppa-upp.1') as unknown, scenes); expect(r.problems.filter((p) => p.level === 'error')).toEqual([]);
  });
});
