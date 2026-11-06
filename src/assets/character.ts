/**
 * Base character ("level B"): outlined limbs, readable face, mitten hands,
 * shoes. Drawn from a solved rig + face/wardrobe state into a FrameTree.
 * Feet at (0,0) in local space; the caller positions, scales and flips.
 */
import { circle, ellipse, g, line, path, rect, text, type FrameNode, type Paint, r1 } from '../engine/frame';
import { palette as C, color } from './palette';
import { SEG, solveRig, type P, type Pose } from '../engine/rig';
import type { EYES, BROWS, MOUTHS } from '../schema/scene';

export type Eyes = (typeof EYES)[number];
export type Brows = (typeof BROWS)[number];
export type Mouth = (typeof MOUTHS)[number];
export type Wardrobe = { top: string; bottom: string; shoes: string; hair: string; skin: string; hairStyle: 'short' | 'long' | 'bun' | 'curly'; headband?: string; shorts?: boolean; number?: string; hat?: string; glasses?: boolean; scarf?: string; buttons?: number; zipper?: number; sleeves?: 'long' | 'short' | 'rolled'; apron?: string; laces?: number; pattern?: 'none' | 'striped' | 'dotted' | 'checked' | 'floral'; pattern2?: string; topLength?: 'normal' | 'long' };
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
/** An arm: sleeve all the way, or short/rolled sleeve (forearm in skin, a cuff at the elbow when rolled). */
const arm = (pts: P[], w: Wardrobe, sw: number): FrameNode[] => w.sleeves && w.sleeves !== 'long'
  ? [...outlinedLimb([pts[0]!, pts[1]!], w.top, sw), ...outlinedLimb([pts[1]!, pts[2]!], w.skin, sw - 1.2), ...(w.sleeves === 'rolled' ? [circle(pts[1]![0], pts[1]![1], sw / 2 + 1.4, { fill: w.top, stroke: INK, sw: 1.8 })] : [])]
  : outlinedLimb(pts, w.top, sw);
/** A leg: trousers all the way, or shorts (thigh in cloth, shin in skin, a little thinner). */
const leg = (pts: P[], w: Wardrobe, sw: number): FrameNode[] => w.shorts
  ? [...outlinedLimb([pts[0]!, pts[1]!], w.bottom, sw), ...outlinedLimb([pts[1]!, pts[2]!], w.skin, sw - 1.2), circle(pts[1]![0], pts[1]![1], sw / 2, { fill: w.bottom, stroke: INK, sw: 2 })]
  : outlinedLimb(pts, w.bottom, sw);
const hand = (p: P, skin: string, gripping: boolean): FrameNode => gripping
  ? circle(p[0], p[1], 3.2, { fill: skin, stroke: INK, sw: 1.6 })
  : ellipse(p[0], p[1] + 0.6, 3.1, 3.6, { fill: skin, stroke: INK, sw: 1.6 });
const shoe = (ankle: P, toe: P, col: string, laces = 0): FrameNode => {
  // a rounded shoe from ankle toward toe
  const dx = toe[0] - ankle[0], dy = toe[1] - ankle[1];
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  return g([rect(-3.5, -2.2, 10.5, 4.8, { rx: 2.4, fill: col, stroke: INK, sw: 1.6 }), ...(laces >= 0.5 ? [path('M1 -2.4 l-2 -2 l2 1 l2 -1 Z', { fill: C.white, stroke: INK, sw: 0.8 })] : [])], { x: ankle[0], y: ankle[1] + 0.6, rotate: ang });
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
  if (w.hat && w.hat !== 'none') out.push(path(`M${r1(hx - r - 1.5)} ${r1(hy - 3)} q0 -12 ${r + 1.5} -12 q${r + 1.5} 0 ${r + 1.5} 12 Z`, { fill: color(w.hat), stroke: INK, sw: 2 }), path(`M${r1(hx - r - 2)} ${r1(hy - 3)} h${2 * r + 4} q0 3 -2 3 h${-(2 * r)} q-2 0 -2 -3 Z`, { fill: color(w.hat), stroke: INK, sw: 1.6 }));
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
  nodes.push(...arm(backArm, w, armSw), hand(rig.handR, w.skin, gripR));
  if (s.holding.right) nodes.push(g([s.holding.right], { x: rig.handR[0], y: rig.handR[1] }));
  nodes.push(...leg(backLeg, w, legSw), shoe(rig.ankleR, rig.toeR, w.shoes, w.laces ?? 0));
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
  if (w.pattern && w.pattern !== 'none') {
    // pattern drawn in torso space (u along the torso from hip to shoulder, v lateral), clipped by a rounded quad approximation
    const c2 = w.pattern2 ? color(w.pattern2) : '#ffffff';
    const pat: FrameNode[] = [];
    const at = (u: number, v: number): [number, number] => [hx0 + ux * u + px * v, hy0 + uy * u + py * v];
    if (w.pattern === 'striped') for (let u = 3; u < SEG.torso - 1; u += 5) { const [x1, y1] = at(u, -sw + 0.5), [x2, y2] = at(u, sw - 0.5); pat.push(line([[x1, y1], [x2, y2]], { stroke: c2, sw: 2.2, opacity: 0.9 })); }
    if (w.pattern === 'dotted') for (let u = 3; u < SEG.torso - 1; u += 5) for (let v = -sw + 2.5; v < sw - 1; v += 5) { const [x, y] = at(u + ((v / 5) % 2 ? 2 : 0), v); pat.push(circle(x, y, 1.3, { fill: c2, opacity: 0.9 })); }
    if (w.pattern === 'checked') { for (let u = 1; u < SEG.torso; u += 6) { const [x1, y1] = at(u, -sw + 0.5), [x2, y2] = at(u, sw - 0.5); pat.push(line([[x1, y1], [x2, y2]], { stroke: c2, sw: 2, opacity: 0.7 })); } for (let v = -sw + 3; v < sw; v += 6) { const [x1, y1] = at(1, v), [x2, y2] = at(SEG.torso - 1, v); pat.push(line([[x1, y1], [x2, y2]], { stroke: c2, sw: 2, opacity: 0.7 })); } }
    if (w.pattern === 'floral') for (let u = 4; u < SEG.torso - 2; u += 7) for (let v = -sw + 3; v < sw - 1; v += 7) { const [x, y] = at(u, v); pat.push(circle(x, y, 1.1, { fill: C.yellow }), circle(x - 1.6, y, 1, { fill: c2, opacity: 0.9 }), circle(x + 1.6, y, 1, { fill: c2, opacity: 0.9 }), circle(x, y - 1.6, 1, { fill: c2, opacity: 0.9 }), circle(x, y + 1.6, 1, { fill: c2, opacity: 0.9 })); }
    nodes.push(g(pat, undefined, { clip: { x: Math.min(sx, hx0) - sw - 2, y: Math.min(sy, hy0) - 2, w: Math.abs(sx - hx0) + 2 * sw + 4, h: Math.abs(sy - hy0) + 6 } }));
  }
  if (w.topLength === 'long') nodes.push(path(`M${P4(hx0 - px * hwT - px * 1, hy0 - py * hwT)} L${P4(hx0 + px * hwT + px * 1, hy0 + py * hwT)} L${P4(hx0 + px * (hwT + 1.5) - ux * 10, hy0 + py * (hwT + 1.5) - uy * 10)} L${P4(hx0 - px * (hwT + 1.5) - ux * 10, hy0 - py * (hwT + 1.5) - uy * 10)} Z`, { fill: w.top, stroke: INK, sw: 2 }));
  if (w.number) { const cx = (sx + hx0) / 2 - ux * 2 + 3.5, cy = (sy + hy0) / 2 - uy * 2; nodes.push(text(cx, cy + 3, w.number, 8, { fill: '#ffffff', weight: 800, anchor: 'middle' })); }
  // front opening: buttons (fraction closed) or a zipper; open part shows a lighter undershirt in a V
  const front = (k: number): [number, number] => [sx + ux * -(SEG.torso * k) + px * 1.5, sy + uy * -(SEG.torso * k) + py * 1.5]; // k = 0 at the shoulder line, 1 at the hip
  if (typeof w.buttons === 'number') {
    const closed = Math.max(0, Math.min(1, w.buttons));
    if (closed < 0.98) { const [ox, oy] = front(0.0), [bx, by] = front(0.1 + 0.75 * (1 - closed)); nodes.push(path(`M${r1(ox - px * 5.5)} ${r1(oy - py * 5.5)} L${r1(bx)} ${r1(by)} L${r1(ox + px * 5.5)} ${r1(oy + py * 5.5)} Z`, { fill: '#fbf8f1', stroke: INK, sw: 1.4 })); }
    for (let i = 0; i < 3; i++) { const k = 0.2 + i * 0.3; if (k <= 0.1 + 0.75 * (1 - closed) && closed < 0.98) continue; const [bx, by] = front(k); nodes.push(circle(bx, by, 1.2, { fill: INK })); }
  }
  if (typeof w.zipper === 'number') { const z = Math.max(0, Math.min(1, w.zipper)); const [ax, ay] = front(0.9), [bx, by] = front(0.9 - 0.85 * z); nodes.push(line([[ax, ay], [bx, by]], { stroke: C.silver, sw: 1.6 }), line([[ax, ay], [bx, by]], { stroke: INK, sw: 0.6 }), circle(bx, by, 1.3, { fill: C.silver, stroke: INK, sw: 0.8 })); if (z < 0.98) { const [tx, ty] = front(0.0); nodes.push(path(`M${r1(tx - px * 5.5)} ${r1(ty - py * 5.5)} L${r1(bx)} ${r1(by)} L${r1(tx + px * 5.5)} ${r1(ty + py * 5.5)} Z`, { fill: '#fbf8f1', stroke: INK, sw: 1.2 })); } }
  if (w.apron) { const [ax, ay] = front(0.25), [bx, by] = front(1.0); nodes.push(path(`M${r1(ax - px * 6)} ${r1(ay - py * 6)} L${r1(ax + px * 6)} ${r1(ay + py * 6)} L${r1(bx + px * 7)} ${r1(by + py * 7 + 6)} L${r1(bx - px * 7)} ${r1(by - py * 7 + 6)} Z`, { fill: color(w.apron), stroke: INK, sw: 1.6 })); }
  nodes.push(...leg(frontLeg, w, legSw), shoe(rig.ankleL, rig.toeL, w.shoes, w.laces ?? 0));
  // neck + head
  nodes.push(line([rig.shoulder, [rig.head[0], rig.head[1] + 6]], { stroke: w.skin, sw: 4.6 }));
  const headA = -(rig.angles.torso + rig.angles.head);
  nodes.push(g([
    circle(0, 0, SEG.headR, { fill: w.skin, stroke: INK, sw: 2.2 }),
    ...hairNode([0, 0], w),
    ...faceNodes([0, 0], s.face, s.facing, w.skin),
  ], { x: rig.head[0], y: rig.head[1], rotate: headA }));
  if (w.scarf) { const [nx, ny] = rig.neck; nodes.push(path(`M${r1(nx - 8)} ${r1(ny)} q8 -3 16 0 q0 4 -3 5 q-5 -2 -10 0 q-3 -1 -3 -5 Z`, { fill: color(w.scarf), stroke: INK, sw: 1.6 }), path(`M${r1(nx + 2)} ${r1(ny + 3)} q2 6 0 12 q-3 -1 -3 -4 q1 -4 3 -8 Z`, { fill: color(w.scarf), stroke: INK, sw: 1.4 })); }
  if (w.glasses) { const hr = SEG.headR; nodes.push(g([circle(-3.2, -0.5, 3.4, { fill: 'rgba(255,255,255,0.4)', stroke: INK, sw: 1.4 }), circle(4.6, -0.5, 3.4, { fill: 'rgba(255,255,255,0.4)', stroke: INK, sw: 1.4 }), line([[0.2, -0.5], [1.2, -0.5]], { stroke: INK, sw: 1.2 }), line([[-6.6, -0.5], [-hr + 1, -2]], { stroke: INK, sw: 1.2 })], { x: rig.head[0], y: rig.head[1], rotate: headA })); }
  // the near arm is drawn last so that a raised hand (and what it holds) passes in front of the face
  nodes.push(...arm(frontArm, w, armSw), hand(rig.handL, w.skin, gripL));
  if (s.holding.left) nodes.push(g([s.holding.left], { x: rig.handL[0], y: rig.handL[1] }));
  // whole-body rotation (lying down) happens around the feet/hip pivot
  return g(nodes, s.bodyRotate ? { rotate: s.bodyRotate, px: 0, py: -SEG.hipH } : undefined);
}

export const defaultFace = (): Face => ({ eyes: 'open', brows: 'neutral', mouth: 'smile', gaze: 0, blush: false, blink: false });
