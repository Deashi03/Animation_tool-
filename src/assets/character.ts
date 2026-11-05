/**
 * Base character ("level B"): outlined limbs, readable face, mitten hands,
 * shoes. Drawn from a solved rig + face/wardrobe state into a FrameTree.
 * Feet at (0,0) in local space; the caller positions, scales and flips.
 */
import { circle, ellipse, g, line, path, rect, type FrameNode, type Paint, r1 } from '../engine/frame';
import { palette as C, color } from './palette';
import { SEG, solveRig, type P, type Pose } from '../engine/rig';
import type { EYES, BROWS, MOUTHS } from '../schema/scene';

export type Eyes = (typeof EYES)[number];
export type Brows = (typeof BROWS)[number];
export type Mouth = (typeof MOUTHS)[number];
export type Wardrobe = { top: string; bottom: string; shoes: string; hair: string; skin: string; hairStyle: 'short' | 'long' | 'bun' | 'curly'; headband?: string };
export type Face = { eyes: Eyes; brows: Brows; mouth: Mouth; gaze: number; blush: boolean; blink: boolean };
export type CharacterState = { pose: Pose; facing: 1 | -1; lift: number; bodyRotate: number; face: Face; wardrobe: Wardrobe; holding: { left?: FrameNode; right?: FrameNode } };

/** Variants: three recurring, deliberately unremarkable people. */
export const VARIANTS: Record<'a' | 'b' | 'c', Wardrobe> = {
  a: { top: C.green, bottom: C.navy, shoes: C.dark, hair: C.hair, skin: C.skin, hairStyle: 'short' },
  b: { top: C.sky, bottom: C.denim2, shoes: C.brown, hair: '#1f1a1a', skin: '#c68642', hairStyle: 'curly' },
  c: { top: C.red, bottom: C.dark, shoes: C.black, hair: '#8a5a2b', skin: '#f6d7b8', hairStyle: 'long' },
};

const INK = C.ink;
const outlinedLimb = (pts: P[], col: string, sw: number): FrameNode[] => [
  line(pts, { stroke: INK, sw: sw + 2.4 }),
  line(pts, { stroke: col, sw }),
];
const hand = (p: P, skin: string, gripping: boolean): FrameNode => gripping
  ? circle(p[0], p[1], 3.2, { fill: skin, stroke: INK, sw: 1.6 })
  : ellipse(p[0], p[1] + 0.6, 3.1, 3.6, { fill: skin, stroke: INK, sw: 1.6 });
const shoe = (ankle: P, toe: P, col: string): FrameNode => {
  // a rounded shoe from ankle toward toe
  const dx = toe[0] - ankle[0], dy = toe[1] - ankle[1];
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  return g([rect(-3.5, -2.2, 10.5, 4.8, { rx: 2.4, fill: col, stroke: INK, sw: 1.6 })], { x: ankle[0], y: ankle[1] + 0.6, rotate: ang });
};

function hairNode(head: P, w: Wardrobe): FrameNode[] {
  const [hx, hy] = head, r = SEG.headR, col = w.hair;
  const paint: Paint = { fill: col, stroke: INK, sw: 2.2 };
  const out: FrameNode[] = [];
  if (w.hairStyle === 'long') out.push(path(`M${r1(hx - r)} ${r1(hy - 1)} c0 -15 ${2 * r} -15 ${2 * r} 0 c0 10 1 16 1 20 l-4 0 c0 -6 -1 -10 -3 -14 c-3 -6 -11 -6 -14 0 c-2 4 -3 8 -3 14 l-4 0 c0 -4 1 -10 1 -20 Z`, paint));
  else if (w.hairStyle === 'curly') out.push(path(`M${r1(hx - r - 1)} ${r1(hy)} c-2 -6 2 -10 4 -9 c0 -6 6 -9 9 -6 c3 -4 9 -3 10 2 c4 -1 7 4 5 8 c3 3 1 8 -3 7 c-3 -5 -19 -5 -25 0 Z`, paint));
  else out.push(path(`M${r1(hx - r)} ${r1(hy - 1)} c0 -14 ${2 * r} -14 ${2 * r} 0 c-3 -5 -${2 * r - 3} -5 -${2 * r} 0 Z`, paint));
  if (w.hairStyle === 'bun') out.push(circle(hx, hy - r - 3, 4.5, paint));
  if (w.headband) out.push(path(`M${r1(hx - r - 0.5)} ${r1(hy - 2)} q${r} -5 ${2 * r + 1} 0 l0 3.5 q-${r} -5 -${2 * r + 1} 0 Z`, { fill: color(w.headband), stroke: INK, sw: 1.4 }));
  return out;
}

function faceNodes(head: P, f: Face, facing: 1 | -1, skin: string): FrameNode[] {
  const [hx, hy] = head;
  const out: FrameNode[] = [];
  const gaze = f.gaze * facing;
  const eyes = f.blink ? 'closed' : f.eyes;
  const ex = [hx - 4 + gaze * 0.8, hx + 4 + gaze * 0.8], ey = hy + 1.5;
  for (const x0 of ex) {
    if (eyes === 'closed') { out.push(path(`M${r1(x0 - 2.4)} ${r1(ey)} q2.4 2.2 4.8 0`, { stroke: INK, sw: 1.6, fill: 'none' })); continue; }
    const ry = eyes === 'wide' ? 3.4 : eyes === 'half' ? 1.7 : 2.6;
    out.push(ellipse(x0, ey, 2.4, ry, { fill: C.white, stroke: INK, sw: 1.2 }));
    out.push(circle(x0 + gaze * 0.7, ey + (eyes === 'half' ? 0.3 : 0.5), eyes === 'half' ? 1.1 : 1.3, { fill: INK }));
    if (eyes === 'half') out.push(path(`M${r1(x0 - 2.6)} ${r1(ey - 1.1)} q2.6 -1.4 5.2 0`, { stroke: INK, sw: 1.6, fill: 'none' }));
  }
  const by = hy - 3.6 + (f.brows === 'up' ? -1.2 : f.brows === 'down' ? 0.6 : 0);
  const browD = f.brows === 'up' ? 'q2.4 -2.2 4.8 0' : f.brows === 'down' ? 'q2.4 1.6 4.8 0' : f.brows === 'worried' ? 'q2.4 -1.6 4.8 -0.4' : 'q2.4 -0.9 4.8 0';
  const browD2 = f.brows === 'down' ? 'q2.4 1.6 4.8 0' : f.brows === 'worried' ? 'q2.4 -1.2 4.8 0.4' : browD;
  out.push(path(`M${r1(ex[0]! - 2.4)} ${r1(by)} ${browD}`, { stroke: INK, sw: 1.4, fill: 'none' }));
  out.push(path(`M${r1(ex[1]! - 2.4)} ${r1(by)} ${browD2}`, { stroke: INK, sw: 1.4, fill: 'none' }));
  if (f.brows === 'down') { // angled inner ends for anger
    out.push(path(`M${r1(ex[0]! + 2.4)} ${r1(by + 1.2)} l-4.8 -1.8 M${r1(ex[1]! - 2.4)} ${r1(by + 1.2)} l4.8 -1.8`, { stroke: INK, sw: 1.4, fill: 'none' }));
  }
  if (f.blush) out.push(circle(hx - 6.5, hy + 5, 1.8, { fill: C.blush }), circle(hx + 6.5, hy + 5, 1.8, { fill: C.blush }));
  const my = hy + 6.6;
  const mouth: Record<Mouth, FrameNode> = {
    smile: path(`M${r1(hx - 3)} ${r1(my)} q3 2.8 6 0`, { stroke: INK, sw: 1.5, fill: 'none' }),
    calm: path(`M${r1(hx - 2.4)} ${r1(my)} q2.4 1.5 4.8 0`, { stroke: INK, sw: 1.5, fill: 'none' }),
    neutral: path(`M${r1(hx - 2.5)} ${r1(my + 0.4)} l5 0`, { stroke: INK, sw: 1.5, fill: 'none' }),
    open: path(`M${r1(hx - 2.6)} ${r1(my - 0.6)} q2.6 5 5.2 0 Z`, { stroke: INK, sw: 1.3, fill: INK }),
    o: ellipse(hx, my + 0.4, 1.7, 2.1, { stroke: INK, sw: 1.3, fill: INK }),
    frown: path(`M${r1(hx - 3)} ${r1(my + 1.5)} q3 -2.6 6 0`, { stroke: INK, sw: 1.5, fill: 'none' }),
  };
  out.push(mouth[f.mouth]);
  void skin;
  return out;
}

/** Draw the character in local space (feet at origin). */
export function drawCharacter(s: CharacterState): FrameNode {
  const w = s.wardrobe;
  // local space always faces +x; the renderer mirrors the whole figure for `facing: left`, so the rig must not mirror again
  const rig = solveRig(s.pose, 1, s.lift);
  const gripL = !!s.holding.left, gripR = !!s.holding.right;
  const nodes: FrameNode[] = [];
  const armSw = 5.4, legSw = 6.4;
  // back limbs (the side away from the viewer is the "R" side when facing right)
  const backArm: P[] = [rig.shR, rig.elbowR, rig.handR], frontArm: P[] = [rig.shL, rig.elbowL, rig.handL];
  const backLeg: P[] = [rig.hipR, rig.kneeR, rig.ankleR], frontLeg: P[] = [rig.hipL, rig.kneeL, rig.ankleL];
  nodes.push(...outlinedLimb(backArm, w.top, armSw), hand(rig.handR, w.skin, gripR));
  if (s.holding.right) nodes.push(g([s.holding.right], { x: rig.handR[0], y: rig.handR[1] }));
  nodes.push(...outlinedLimb(backLeg, w.bottom, legSw), shoe(rig.ankleR, rig.toeR, w.shoes));
  // pelvis: trousers block that joins the legs to the torso so the body never "detaches"
  const hw = SEG.hipW + 2.6;
  nodes.push(path(`M${r1(rig.hip[0] - hw)} ${r1(rig.hip[1] - 6)} L${r1(rig.hip[0] + hw)} ${r1(rig.hip[1] - 6)} L${r1(rig.hip[0] + hw)} ${r1(rig.hip[1] + 4)} Q${r1(rig.hip[0])} ${r1(rig.hip[1] + 7)} ${r1(rig.hip[0] - hw)} ${r1(rig.hip[1] + 4)} Z`, { fill: w.bottom, stroke: INK, sw: 2.2 }));
  // torso: a quad between the real shoulder line and the real hip line (follows the torso angle, stays attached)
  const sw = SEG.shoulderW + 3, hwT = SEG.hipW + 3.4;
  const [sx, sy] = rig.shoulder, [hx0, hy0] = rig.hip;
  const ux = Math.sin(((rig.angles.torso) * Math.PI) / 180), uy = -Math.cos(((rig.angles.torso) * Math.PI) / 180); // torso up-vector
  const px = -uy, py = ux; // perpendicular (lateral)
  const P4 = (x: number, y: number) => `${r1(x)} ${r1(y)}`;
  nodes.push(path(`M${P4(sx - px * sw - ux * 1.5, sy - py * sw - uy * 1.5)} Q${P4(sx - ux * 5, sy - uy * 5)} ${P4(sx + px * sw - ux * 1.5, sy + py * sw - uy * 1.5)} L${P4(hx0 + px * hwT, hy0 + py * hwT)} Q${P4(hx0 + ux * -2, hy0 + uy * -2)} ${P4(hx0 - px * hwT, hy0 - py * hwT)} Z`, { fill: w.top, stroke: INK, sw: 2.2 }));
  nodes.push(path(`M${P4(hx0 - px * 5 - ux * 5, hy0 - py * 5 - uy * 5)} Q${P4(hx0 - ux * 3, hy0 - uy * 3)} ${P4(hx0 + px * 5 - ux * 5, hy0 + py * 5 - uy * 5)}`, { stroke: 'rgba(0,0,0,0.12)', sw: 1.6, fill: 'none' }));
  nodes.push(...outlinedLimb(frontLeg, w.bottom, legSw), shoe(rig.ankleL, rig.toeL, w.shoes));
  // neck + head
  nodes.push(line([rig.shoulder, [rig.head[0], rig.head[1] + 6]], { stroke: w.skin, sw: 4.6 }));
  const headA = -(rig.angles.torso + rig.angles.head);
  nodes.push(g([
    circle(0, 0, SEG.headR, { fill: w.skin, stroke: INK, sw: 2.2 }),
    ...hairNode([0, 0], w),
    ...faceNodes([0, 0], s.face, s.facing, w.skin),
  ], { x: rig.head[0], y: rig.head[1], rotate: headA }));
  // the near arm is drawn last so that a raised hand (and what it holds) passes in front of the face
  nodes.push(...outlinedLimb(frontArm, w.top, armSw), hand(rig.handL, w.skin, gripL));
  if (s.holding.left) nodes.push(g([s.holding.left], { x: rig.handL[0], y: rig.handL[1] }));
  // whole-body rotation (lying down) happens around the feet/hip pivot
  return g(nodes, s.bodyRotate ? { rotate: s.bodyRotate, px: 0, py: -SEG.hipH } : undefined);
}

export const defaultFace = (): Face => ({ eyes: 'open', brows: 'neutral', mouth: 'smile', gaze: 0, blush: false, blink: false });
