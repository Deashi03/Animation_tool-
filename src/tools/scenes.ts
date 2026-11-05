/** Scene files on disk (Node only). One file per animation: scenes/<lemma>/<animationId>.json */
import fs from 'node:fs';
import path from 'node:path';
import { Scene, type Scene as SceneT } from '../schema/scene';
import { migrateScene } from '../schema/migrate';

export const SCENES_DIR = path.resolve(process.cwd(), 'scenes');
export const REVIEW_DIR = path.resolve(process.cwd(), 'review');

export function sceneFiles(dir = SCENES_DIR): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...sceneFiles(p)); else if (e.name.endsWith('.json')) out.push(p);
  }
  return out.sort();
}
export function readRaw(file: string): unknown { return JSON.parse(fs.readFileSync(file, 'utf8')); }
/** All scenes that parse, keyed by animationId (invalid files are skipped and reported). */
export function loadScenes(dir = SCENES_DIR): { scenes: Map<string, SceneT>; files: Map<string, string>; invalid: { file: string; errors: string[] }[] } {
  const scenes = new Map<string, SceneT>(), files = new Map<string, string>(), invalid: { file: string; errors: string[] }[] = [];
  for (const f of sceneFiles(dir)) {
    const r = Scene.safeParse(migrateScene(readRaw(f)));
    if (r.success) { scenes.set(r.data.animationId, r.data); files.set(r.data.animationId, f); }
    else invalid.push({ file: f, errors: r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) });
  }
  return { scenes, files, invalid };
}
export function sceneFilePath(animationId: string): string {
  const lemma = animationId.split('.')[1] ?? 'misc';
  return path.join(SCENES_DIR, lemma, `${animationId}.json`);
}
export function writeScene(file: string, scene: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(scene, null, 2) + '\n');
}
