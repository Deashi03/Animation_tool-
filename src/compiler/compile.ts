/**
 * Scene → CompiledScene: initial keyframes from the static definitions, then
 * every timeline action in time order. The result is plain data (tracks) that
 * `renderFrame` samples. Compilation is deterministic.
 */
import { addKey, type Tracks } from '../engine/track';
import { REST_POSE } from '../engine/rig';
import { JOINTS, type Scene, type ActorDef, type PropDef } from '../schema/scene';
import { PROPS } from '../assets/props';
import { ENVS } from '../assets/environments';
import { compileAction, type Ctx } from '../actions';

export type CompiledScene = {
  scene: Scene;
  tracks: Tracks;
  durationMs: number;
  /** total loop length including the end hold */
  cycleMs: number;
  ground: number;
  posterMs: number;
  warnings: string[];
};

export function compileScene(scene: Scene): CompiledScene {
  const tracks: Tracks = new Map();
  const env = ENVS[scene.environment.id] ?? ENVS.neutral!;
  const ground = scene.environment.ground ?? env.ground;
  const actors = new Map<string, ActorDef>(scene.actors.map((a) => [a.id, a]));
  const props = new Map<string, PropDef>(scene.props.map((p) => [p.id, p]));
  const ctx: Ctx = { scene, tracks, actors, props, ground, warnings: [] };
  for (const a of scene.actors) {
    addKey(tracks, `${a.id}.x`, { t: 0, v: a.at.x }); addKey(tracks, `${a.id}.y`, { t: 0, v: a.at.y });
    addKey(tracks, `${a.id}.facing`, { t: 0, v: a.facing }); addKey(tracks, `${a.id}.scale`, { t: 0, v: a.scale });
    addKey(tracks, `${a.id}.lift`, { t: 0, v: 0 }); addKey(tracks, `${a.id}.bodyRotate`, { t: 0, v: 0 }); addKey(tracks, `${a.id}.z`, { t: 0, v: 0 });
    for (const j of JOINTS) addKey(tracks, `${a.id}.j.${j}`, { t: 0, v: REST_POSE[j] });
    addKey(tracks, `${a.id}.eyes`, { t: 0, v: a.face?.eyes ?? 'open' }); addKey(tracks, `${a.id}.brows`, { t: 0, v: a.face?.brows ?? 'neutral' });
    addKey(tracks, `${a.id}.mouth`, { t: 0, v: a.face?.mouth ?? 'smile' }); addKey(tracks, `${a.id}.gaze`, { t: 0, v: a.face?.gaze ?? 0 });
    addKey(tracks, `${a.id}.blush`, { t: 0, v: false }); addKey(tracks, `${a.id}.blink`, { t: 0, v: false });
  }
  for (const p of scene.props) {
    const spec = PROPS[p.asset];
    if (p.at) { addKey(tracks, `${p.id}.x`, { t: 0, v: p.at.x }); addKey(tracks, `${p.id}.y`, { t: 0, v: p.at.y }); }
    addKey(tracks, `${p.id}.scale`, { t: 0, v: p.scale }); addKey(tracks, `${p.id}.rotate`, { t: 0, v: p.rotate }); addKey(tracks, `${p.id}.z`, { t: 0, v: p.z });
    addKey(tracks, `${p.id}.opacity`, { t: 0, v: 1 });
    addKey(tracks, `${p.id}.attach`, { t: 0, v: p.attachTo ? `${p.attachTo.actor}:${p.attachTo.hand}` : '' });
    for (const [k, v] of Object.entries({ ...(spec?.defaults ?? {}), ...p.state })) addKey(tracks, `${p.id}.s.${k}`, { t: 0, v });
  }
  for (const s of scene.shapes) {
    addKey(tracks, `${s.id}.opacity`, { t: 0, v: s.opacity ?? 1 }); addKey(tracks, `${s.id}.scale`, { t: 0, v: 1 }); addKey(tracks, `${s.id}.rotate`, { t: 0, v: 0 });
    addKey(tracks, `${s.id}.z`, { t: 0, v: s.z }); addKey(tracks, `${s.id}.progress`, { t: 0, v: 1 });
    if (s.type === 'rect') { addKey(tracks, `${s.id}.x`, { t: 0, v: s.x }); addKey(tracks, `${s.id}.y`, { t: 0, v: s.y }); addKey(tracks, `${s.id}.w`, { t: 0, v: s.w }); addKey(tracks, `${s.id}.h`, { t: 0, v: s.h }); }
    else if (s.type === 'circle') { addKey(tracks, `${s.id}.x`, { t: 0, v: s.cx }); addKey(tracks, `${s.id}.y`, { t: 0, v: s.cy }); addKey(tracks, `${s.id}.r`, { t: 0, v: s.r }); }
    else { addKey(tracks, `${s.id}.x`, { t: 0, v: s.x }); addKey(tracks, `${s.id}.y`, { t: 0, v: s.y }); }
  }
  const sorted = [...scene.timeline].map((a, i) => ({ a, i })).sort((p, q) => p.a.t - q.a.t || p.i - q.i);
  for (const { a } of sorted) compileAction(ctx, a);
  const posterMs = scene.posterMs ?? Math.round(scene.durationMs * 0.6);
  return { scene, tracks, durationMs: scene.durationMs, cycleMs: scene.durationMs + scene.holdMs, ground, posterMs, warnings: ctx.warnings };
}
