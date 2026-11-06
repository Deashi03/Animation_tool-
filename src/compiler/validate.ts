import { Scene, formatIssues, type Scene as SceneT } from '../schema/scene';
import { migrateScene } from '../schema/migrate';
import { compileScene, type CompiledScene } from './compile';
import { checkLayout } from './layout';
import { checkContrast, evaluateFeature } from './contrast';
import { TEMPLATES } from './templates';
import { bearerOf } from './contrast';
import { renderFrame } from '../engine/render';
import { bboxOfId } from '../engine/frame';

import { sampleNumber } from '../engine/track';
function sampleOpacity(c: CompiledScene, id: string): number { return sampleNumber(c.tracks, `${id}.opacity`, c.posterMs, 1); }
export type Problem = { level: 'error' | 'warning'; message: string };
export type ValidationResult = { ok: boolean; scene?: SceneT; compiled?: CompiledScene; problems: Problem[] };

/**
 * Full validation: schema → compile → layout checks → contrast claims.
 * `others` lets contrast claims be checked against the referenced scenes.
 */
export type ValidateOptions = { approvedTemplates?: Set<string> };
export function validateScene(raw: unknown, others: Map<string, SceneT> = new Map(), opts: ValidateOptions = {}): ValidationResult {
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
  // the word must be borne by something: a prop, a wardrobe detail, an icon or a bodily action – never a person with text only
  if (scene.kind === 'word' && !bearerOf(scene)) problems.push({ level: 'error', message: 'scenen saknar bärare: inget föremål, ingen klädseldetalj, ingen ikon och ingen kroppslig handling visar ordet (en figur som bara säger ordet är inte ett typexempel)' });
  // template contract: every word scene should instantiate an approved concept family
  if (scene.kind === 'word') {
    if (!scene.template) problems.push({ level: 'warning', message: 'no template – choose a concept family (anim:new --template …) so the scene follows an approved pattern' });
    else {
      const tpl = TEMPLATES[scene.template];
      if (!tpl) problems.push({ level: 'error', message: `unknown template "${scene.template}" (known: ${Object.keys(TEMPLATES).join(', ')})` });
      else {
        for (const f of tpl.contract) { const r = evaluateFeature(compiled, f); if (!r.ok) problems.push({ level: 'error', message: `template "${tpl.id}" requires ${f} (${r.detail})` }); }
        if (opts.approvedTemplates && !opts.approvedTemplates.has(tpl.id)) problems.push({ level: 'warning', message: `template "${tpl.id}" is not yet approved by the product owner` });
      }
    }
    // a quiz poster must not show the Japanese word (it would give the answer away in picture exercises)
    if (scene.pedagogy.quizEligible && scene.shapes.some((sh) => sh.type === 'text' && /[\u3000-\u9fff\uf900-\ufaff\uff00-\uffef]/.test(sh.text))) {
      const frame = renderFrame(compiled, compiled.posterMs);
      for (const sh of scene.shapes) {
        if (sh.type !== 'text' || !/[\u3000-\u9fff\uf900-\ufaff\uff00-\uffef]/.test(sh.text)) continue;
        const b = bboxOfId(frame.root, `entity.${sh.id}`);
        const visible = b && b.x2 > 0 && b.x1 < scene.canvas.w && b.y2 > 0 && b.y1 < scene.canvas.h && (compiled.tracks.get(`${sh.id}.opacity`) ? (sampleOpacity(compiled, sh.id) > 0.05) : true);
        if (visible) problems.push({ level: 'error', message: `quizEligible scene shows Japanese text "${sh.text}" in the poster frame (posterMs=${compiled.posterMs}); move posterMs before it appears or set quizEligible false` });
      }
    }
  }
  return { ok: !problems.some((p) => p.level === 'error'), scene, compiled, problems };
}
