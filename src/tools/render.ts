/** Review material: posters, filmstrips, comparison sheets and contact sheets (HTML + PNG via Playwright). */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { compileScene, type CompiledScene } from '../compiler/compile';
import { renderFrame } from '../engine/render';
import { frameToSvg } from '../engine/svgString';
import type { Scene } from '../schema/scene';
import { reviewDir } from './scenes';

export function posterSvg(scene: Scene, size = 180, showLabel = false): string {
  const c = compileScene(scene);
  return frameToSvg(renderFrame(c, c.posterMs, { showLabel }), { width: size, ariaLabel: scene.titleSv });
}
export function frameTimes(c: CompiledScene, frames: number): number[] {
  return Array.from({ length: frames }, (_, i) => Math.round((c.durationMs * i) / Math.max(1, frames - 1)));
}
/** Filmstrip as HTML: `frames` evenly spaced frames, the poster frame marked. */
export function stripHtml(scene: Scene, opts: { frames?: number; size?: number; label?: boolean; title?: string } = {}): string {
  const c = compileScene(scene);
  const frames = opts.frames ?? 8, size = opts.size ?? 150;
  const cells = frameTimes(c, frames).map((t) => `<figure class="${Math.abs(t - c.posterMs) <= c.durationMs / frames / 2 ? 'poster' : ''}">${frameToSvg(renderFrame(c, t, { showLabel: opts.label }), { width: size })}<figcaption>${t} ms</figcaption></figure>`);
  return `<section class="strip"><h3>${esc(opts.title ?? `${scene.animationId} · ${scene.titleSv}`)}<small>${esc(scene.meaningHint ?? '')} · ${c.durationMs} ms${scene.loop ? ' · loop' : ''}</small></h3><div class="row">${cells.join('')}</div></section>`;
}
export function compareHtml(a: Scene, b: Scene, opts: { frames?: number; size?: number } = {}): string {
  const size = opts.size ?? 140;
  const posters = `<section class="posters"><figure>${posterSvg(a, 180)}<figcaption>${esc(a.titleSv)}</figcaption></figure><figure>${posterSvg(b, 180)}<figcaption>${esc(b.titleSv)}</figcaption></figure></section>`;
  return posters + stripHtml(a, { ...opts, size }) + stripHtml(b, { ...opts, size });
}
export function sheetHtml(scenes: Scene[], cols = 5): string {
  const cells = scenes.map((s) => `<figure>${posterSvg(s, 140)}<figcaption>${esc(s.titleSv)}<small>${esc(s.animationId)} · ${s.pedagogy.reviewStatus}</small></figcaption></figure>`);
  return `<section class="sheet" style="grid-template-columns:repeat(${cols},1fr)">${cells.join('')}</section>`;
}
export function page(body: string, width = 1240): string {
  return `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:14px;background:#e9ecef;font-family:system-ui,sans-serif;color:#14213d;width:${width}px}
h3{font-size:15px;margin:0 0 6px}h3 small{display:block;font-weight:500;color:#6b7488;font-size:12px}
.strip{background:#fff;border-radius:12px;padding:10px;margin-bottom:12px}.row{display:flex;gap:6px;flex-wrap:wrap}
figure{margin:0;text-align:center}figcaption{font-size:11px;color:#6b7488;margin-top:2px;font-weight:600}
figure.poster svg{outline:3px solid #e4572e;border-radius:18px}
.posters{display:flex;gap:24px;justify-content:center;background:#fff;border-radius:12px;padding:12px;margin-bottom:12px}
.posters figcaption{font-size:14px;color:#14213d;font-weight:700}
.sheet{display:grid;gap:10px;background:#fff;border-radius:12px;padding:10px}.sheet figcaption{font-size:12px;color:#14213d}.sheet small{display:block;color:#6b7488;font-weight:500}
</style><body>${body}</body>`;
}
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);

/** Screenshot an HTML file with the globally installed Playwright (same approach as Swechan's e2e). */
export async function htmlToPng(htmlFile: string, pngFile: string, width = 1240): Promise<boolean> {
  type PW = { chromium: { launch(): Promise<{ newPage(o: { viewport: { width: number; height: number }; deviceScaleFactor: number }): Promise<{ goto(u: string): Promise<unknown>; screenshot(o: { path: string; fullPage: boolean }): Promise<unknown> }>; close(): Promise<void> }> } };
  let pw: PW | null = null;
  const req = createRequire(import.meta.url);
  for (const spec of ['playwright', `${process.env.NODE_PATH ?? '/opt/node22/lib/node_modules'}/playwright`]) { try { pw = req(spec) as PW; break; } catch { /* try next */ } }
  if (!pw) return false;
  const browser = await pw.chromium.launch();
  try {
    const pg = await browser.newPage({ viewport: { width, height: 800 }, deviceScaleFactor: 2 });
    await pg.goto('file://' + path.resolve(htmlFile));
    await pg.screenshot({ path: pngFile, fullPage: true });
  } finally { await browser.close(); }
  return true;
}
export async function writeReview(kind: 'strips' | 'compare' | 'posters' | 'sheet', name: string, html: string, width = 1240): Promise<{ html: string; png: string | null }> {
  const dir = path.join(reviewDir(), kind); fs.mkdirSync(dir, { recursive: true });
  const h = path.join(dir, `${name}.html`), p = path.join(dir, `${name}.png`);
  fs.writeFileSync(h, page(html, width));
  const ok = await htmlToPng(h, p, width);
  return { html: h, png: ok ? p : null };
}
