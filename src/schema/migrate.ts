import { SCHEMA_VERSION } from './scene';
/**
 * Schema migrations. Each step upgrades a raw scene object by one version.
 * Old scenes must keep compiling – add a step here, never edit old scenes by
 * hand in bulk without one.
 */
const steps: Record<number, (raw: Record<string, unknown>) => Record<string, unknown>> = {
  // 0 → 1: the pre-release format used `scene.actors[].actions`; nothing shipped with it.
};
export function migrateScene(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  let obj = raw as Record<string, unknown>;
  let v = typeof obj.schemaVersion === 'number' ? obj.schemaVersion : 0;
  while (v < SCHEMA_VERSION) {
    const step = steps[v];
    if (!step) break;
    obj = { ...step(obj), schemaVersion: v + 1 };
    v++;
  }
  return obj;
}
