import type { Scene } from '../schema/scene';
import { validateScene } from '../compiler/validate';

export type Report = { total: number; byStatus: Record<string, number>; byKind: Record<string, number>; withoutContrast: string[]; invalid: { id: string; problems: string[] }[]; bySense: Record<string, string[]> };
export function buildReport(scenes: Map<string, Scene>): Report {
  const r: Report = { total: scenes.size, byStatus: {}, byKind: {}, withoutContrast: [], invalid: [], bySense: {} };
  for (const [id, s] of scenes) {
    r.byStatus[s.pedagogy.reviewStatus] = (r.byStatus[s.pedagogy.reviewStatus] ?? 0) + 1;
    r.byKind[s.kind] = (r.byKind[s.kind] ?? 0) + 1;
    if (s.kind === 'word' && !s.contrast) r.withoutContrast.push(id);
    if (s.senseId) (r.bySense[s.senseId] ??= []).push(id);
    const v = validateScene(s, scenes);
    if (!v.ok) r.invalid.push({ id, problems: v.problems.filter((p) => p.level === 'error').map((p) => p.message) });
  }
  return r;
}
