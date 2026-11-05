/**
 * anim:perf – playback cost in Chromium with iPhone 13 emulation (CPU throttled 4×
 * to approximate a phone). For a set of scenes: frames per second the player
 * actually achieves over 3 s, average main-thread time per animation frame,
 * long tasks, SVG node count and raw scene bytes. Writes docs/perf.md.
 *   npm run build && npm run anim:perf [-- anim.steka.1 anim.springa.1 …]
 * Chromium on a build machine is not an iPhone; the numbers are relative, not promises.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(`${process.env.NODE_PATH ?? '/opt/node22/lib/node_modules'}/playwright`); }
const { chromium, devices } = playwright;
const PORT = 4182, BASE = `http://localhost:${PORT}/`;
const wanted = process.argv.slice(2).filter((a) => a.startsWith('anim.') || a.startsWith('ui.'));
const ids = wanted.length ? wanted : ['anim.springa.1', 'anim.steka.1', 'anim.vända.1', 'anim.stormning.1', 'anim.koka.1', 'anim.beställa.1', 'anim.klä-på-sig.1', 'anim.hacka.1', 'anim.bakom.1', 'ui.module.complete'];

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
await new Promise((resolve, reject) => { server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) resolve(); }); server.on('exit', (c) => reject(new Error(`preview exited ${c}`))); setTimeout(() => reject(new Error('preview timeout')), 20000); });
const browser = await chromium.launch();
const rows = [];
try {
  const context = await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1, locale: 'sv-SE' });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  for (const id of ids) {
    await page.goto(`${BASE}#/scene/${encodeURIComponent(id)}`);
    await page.locator('.stage svg').first().waitFor({ timeout: 15000 });
    await page.waitForTimeout(400);
    const m = await page.evaluate(() => new Promise((resolve) => {
      const frames = []; let longTasks = 0, longMs = 0; let last = performance.now(); const t0 = last;
      const obs = 'PerformanceObserver' in window ? new PerformanceObserver((l) => { for (const e of l.getEntries()) { longTasks++; longMs += e.duration; } }) : null;
      try { obs && obs.observe({ type: 'longtask', buffered: false }); } catch { /* not supported */ }
      const tick = (now) => { frames.push(now - last); last = now; if (now - t0 < 3000) requestAnimationFrame(tick); else { obs && obs.disconnect(); const svg = document.querySelector('.stage svg'); resolve({ frames: frames.length, ms: now - t0, maxGap: Math.max(...frames), p95: frames.sort((a, b) => a - b)[Math.floor(frames.length * 0.95)], longTasks, longMs, nodes: svg ? svg.querySelectorAll('*').length : 0 }); } };
      requestAnimationFrame(tick);
    }));
    const metrics = await cdp.send('Performance.getMetrics').catch(() => ({ metrics: [] }));
    const task = metrics.metrics?.find((x) => x.name === 'TaskDuration')?.value;
    const file = (() => { const lemma = id.split('.')[1]; const dir = path.join('scenes', lemma); if (fs.existsSync(dir)) { const f = fs.readdirSync(dir).find((x) => x.startsWith(id)); if (f) return path.join(dir, f); } for (const d of fs.readdirSync('scenes')) { const f = path.join('scenes', d, `${id}.json`); if (fs.existsSync(f)) return f; } return null; })();
    const bytes = file ? fs.statSync(file).size : 0;
    rows.push({ id, fps: (m.frames / (m.ms / 1000)).toFixed(1), p95: m.p95.toFixed(1), maxGap: m.maxGap.toFixed(0), longTasks: m.longTasks, longMs: m.longMs.toFixed(0), nodes: m.nodes, bytes, task: task !== undefined ? task.toFixed(2) : '–' });
    console.log(`${id.padEnd(24)} ${rows.at(-1).fps} fps  p95 ${rows.at(-1).p95} ms  max ${rows.at(-1).maxGap} ms  longtasks ${m.longTasks}  nodes ${m.nodes}  ${bytes} B`);
  }
} finally { await browser.close(); server.kill(); }
const md = [`# Prestanda (${new Date().toISOString().slice(0, 10)})`, '', 'Mätt i Chromium (Playwright) med iPhone 13-emulering och **4× CPU-strypning** på byggmaskinen, 3 s uppspelning per scen i studions spelare. Det är inte en fysisk iPhone; siffrorna visar relativ kostnad och var det finns risk, inte en garanti.', '',
  '| Scen | fps | p95 ruta (ms) | längsta lucka (ms) | långa uppgifter | SVG-noder | scenfil (B) |', '|---|---|---|---|---|---|---|', ...rows.map((r) => `| ${r.id} | ${r.fps} | ${r.p95} | ${r.maxGap} | ${r.longTasks} (${r.longMs} ms) | ${r.nodes} | ${r.bytes} |`), '',
  `Riktvärden: ≤ 150 SVG-noder per scen (6.3 i CLAUDE.md), inga långa uppgifter under uppspelning, p95 under 33 ms (30 fps) på strypt CPU. Spelaren renderar hela bildträdet per ruta (ingen diff av transformer); om p95 överskrids är nästa steg att bara uppdatera transformer för aktörer och föremål.`, ''].join('\n');
fs.mkdirSync('docs', { recursive: true }); fs.writeFileSync('docs/perf.md', md);
console.log('docs/perf.md');
