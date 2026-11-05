/** Human-owned registries: template approvals and blind-test results. */
import fs from 'node:fs';
import path from 'node:path';
export const registryDir = (): string => path.resolve(process.cwd(), 'registry');
export function readJson<T>(file: string, fallback: T): T { try { return JSON.parse(fs.readFileSync(file, 'utf8')) as T; } catch { return fallback; } }
export function approvedTemplates(): Set<string> {
  const r = readJson<{ templates: Record<string, { approved: boolean }> }>(path.join(registryDir(), 'templates.json'), { templates: {} });
  return new Set(Object.entries(r.templates).filter(([, v]) => v.approved).map(([k]) => k));
}
export type BlindResult = { date: string; batch: string; passed: boolean; choice: string; expected: string; description?: string; reviewer?: string };
export function blindResults(): Record<string, BlindResult[]> { return readJson(path.join(registryDir(), 'blind.json'), {}); }
export function writeBlindResults(r: Record<string, BlindResult[]>): void { fs.mkdirSync(registryDir(), { recursive: true }); fs.writeFileSync(path.join(registryDir(), 'blind.json'), JSON.stringify(r, null, 2) + '\n'); }
/** Latest blind result for a scene, if any. */
export function blindStatus(animationId: string): BlindResult | undefined { const all = blindResults()[animationId]; return all?.[all.length - 1]; }
