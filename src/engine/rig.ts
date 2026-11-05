/**
 * Character rig: joint angles → world positions (forward kinematics) with
 * per-joint limits so that poses stay natural by construction. Angles are in
 * degrees, 0 = hanging straight down, positive = forward (toward `facing`).
 * The rig is unit-scaled for a ~4-heads-tall picture-book figure whose feet
 * stand at (0,0) and whose head top is at about y = -82.
 */
import type { Joint } from '../schema/scene';

export type Pose = Record<Joint, number>;
export const REST_POSE: Pose = { torso: 0, head: 0, uArmL: 6, fArmL: 8, uArmR: -6, fArmR: 8, thighL: 0, shinL: 0, thighR: 0, shinR: 0, footL: 0, footR: 0 };
/** Joint limits (min, max) in degrees – elbows bend forward only, knees backward only. */
export const LIMITS: Record<Joint, [number, number]> = {
  torso: [-95, 95], head: [-45, 45],
  uArmL: [-170, 170], uArmR: [-170, 170], fArmL: [0, 150], fArmR: [0, 150],
  thighL: [-70, 120], thighR: [-70, 120], shinL: [-150, 0], shinR: [-150, 0], footL: [-40, 40], footR: [-40, 40],
};
export const SEG = { hipH: 34, torso: 22, neck: 4, headR: 11, uArm: 12, fArm: 11, thigh: 16, shin: 16, foot: 6, shoulderW: 7, hipW: 4 } as const;

export const clampJoint = (j: Joint, v: number): number => Math.max(LIMITS[j][0], Math.min(LIMITS[j][1], v));
const rad = (d: number) => (d * Math.PI) / 180;
export type P = [number, number];
/** Point `len` away from (x,y) at angle a (0 = down, 90 = +x). */
export const polar = (p: P, len: number, a: number): P => [p[0] + len * Math.sin(rad(a)), p[1] + len * Math.cos(rad(a))];

export type RigPoints = {
  hip: P; hipL: P; hipR: P; shoulder: P; shL: P; shR: P; neck: P; head: P;
  elbowL: P; handL: P; elbowR: P; handR: P; kneeL: P; ankleL: P; kneeR: P; ankleR: P; toeL: P; toeR: P;
  angles: { uArmL: number; fArmL: number; uArmR: number; fArmR: number; thighL: number; shinL: number; thighR: number; shinR: number; torso: number; head: number; footL: number; footR: number };
};

/**
 * Solve the rig. `facing` is +1 (right) or −1 (left); `lift` raises the hips
 * (jump); `bodyRotate` rotates the whole body about the hips (lying down).
 */
export function solveRig(pose: Pose, facing: 1 | -1, lift = 0): RigPoints {
  const f = facing;
  const a = (j: Joint) => clampJoint(j, pose[j]) * f;
  const hip: P = [0, -SEG.hipH - lift];
  const torsoA = 180 - a('torso');
  const shoulder = polar(hip, SEG.torso, torsoA);
  const neck = polar(shoulder, SEG.neck, torsoA);
  const head = polar(neck, SEG.headR, 180 - a('torso') - a('head'));
  // shoulders / hips are offset perpendicular to the torso direction (lateral in picture space)
  const shL: P = [shoulder[0] - SEG.shoulderW, shoulder[1] + 2], shR: P = [shoulder[0] + SEG.shoulderW, shoulder[1] + 2];
  const hipL: P = [hip[0] - SEG.hipW, hip[1]], hipR: P = [hip[0] + SEG.hipW, hip[1]];
  const armBase = a('torso');
  const elbowL = polar(shL, SEG.uArm, armBase + a('uArmL'));
  const handL = polar(elbowL, SEG.fArm, armBase + a('uArmL') + a('fArmL'));
  const elbowR = polar(shR, SEG.uArm, armBase + a('uArmR'));
  const handR = polar(elbowR, SEG.fArm, armBase + a('uArmR') + a('fArmR'));
  const kneeL = polar(hipL, SEG.thigh, a('thighL'));
  const ankleL = polar(kneeL, SEG.shin, a('thighL') + a('shinL'));
  const kneeR = polar(hipR, SEG.thigh, a('thighR'));
  const ankleR = polar(kneeR, SEG.shin, a('thighR') + a('shinR'));
  const toeL = polar(ankleL, SEG.foot, 90 * f + a('footL'));
  const toeR = polar(ankleR, SEG.foot, 90 * f + a('footR'));
  return { hip, hipL, hipR, shoulder, shL, shR, neck, head, elbowL, handL, elbowR, handR, kneeL, ankleL, kneeR, ankleR, toeL, toeR,
    angles: { uArmL: a('uArmL'), fArmL: a('fArmL'), uArmR: a('uArmR'), fArmR: a('fArmR'), thighL: a('thighL'), shinL: a('shinL'), thighR: a('thighR'), shinR: a('shinR'), torso: a('torso'), head: a('head'), footL: a('footL'), footR: a('footR') } };
}

/** Rough two-bone IK: joint angles so that the hand reaches `target` (rig space, before facing). */
export function reachAngles(shoulder: P, target: P, upper: number, lower: number): { u: number; f: number } {
  const dx = target[0] - shoulder[0], dy = target[1] - shoulder[1];
  const d = Math.min(Math.hypot(dx, dy), upper + lower - 0.01);
  const base = (Math.atan2(dx, dy) * 180) / Math.PI; // 0 = down
  const cosE = (upper * upper + lower * lower - d * d) / (2 * upper * lower);
  const elbow = 180 - (Math.acos(Math.max(-1, Math.min(1, cosE))) * 180) / Math.PI; // bend amount
  const cosS = (upper * upper + d * d - lower * lower) / (2 * upper * d);
  const shoulderOff = (Math.acos(Math.max(-1, Math.min(1, cosS))) * 180) / Math.PI;
  return { u: base - shoulderOff, f: elbow };
}
