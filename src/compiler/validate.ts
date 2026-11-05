import { Scene, formatIssues, type Scene as SceneT } from '../schema/scene';
import { migrateScene } from '../schema/migrate';
import { compileScene, type CompiledScene } from './compile';
import { checkLayout } from './layout';
import { checkContrast } from './contrast';

export type Problem = { level: 'error' | 'warning'; message: string };
export type ValidationResult = { ok: boolean; scene?: SceneT; compiled?: CompiledScene; problems: Problem[] };

/**
 * Full validation: schema → compile → layout checks → contrast claims.
 * `others` lets contrast claims be checked against the referenced scenes.
 */
export function validateScene(raw: unknown, others: Map<string, SceneT> = new Map()): ValidationResult {
  const parsed = Scene.safeParse(migrateScene(raw));
  if (!parsed.success) return { ok: false, problems: formatIssues(parsed.error).map((m) => ({ level: 'error', message: m })) };
  const scene = parsed.data;
  const problems: Problem[] = [];
  let compiled: CompiledScene;
  try { compiled = compileScene(scene); } catch (e) { return { ok: false, scene, problems: [{ level: 'error', message: `compile failed: ${(e as Error).message}` }] }; }
  for (const w of compiled.warnings) problems.push({ level: 'warning', message: w });
  for (const p of checkLayout(compiled)) problems.push(p);
  if (scene.contrast) for (const p of checkContrast(compiled, others)) problems.push(p);
  if (scene.kind === 'word' && !scene.contrast) problems.push({ level: 'warning', message: 'no contrast pair declared – add contrast.with if a neighbouring word exists' });
  return { ok: !problems.some((p) => p.level === 'error'), scene, compiled, problems };
}
