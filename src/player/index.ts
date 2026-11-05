/**
 * Public player API – the part that can be copied into Swechan (src/ui/anim/).
 * Depends only on React and on schema/engine/assets/motions/actions/compiler.
 */
export { ScenePlayer, ScenePoster, type ScenePlayerHandle, type ScenePlayerProps } from './ScenePlayer';
export { FrameView } from './FrameView';
export { useReducedMotion } from './useReducedMotion';
export { compileScene, type CompiledScene } from '../compiler/compile';
export { renderFrame } from '../engine/render';
export { frameToSvg } from '../engine/svgString';
export { Scene, SCHEMA_VERSION, type Scene as SceneT, type SceneInput } from '../schema/scene';
export { migrateScene } from '../schema/migrate';
