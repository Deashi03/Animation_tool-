/**
 * End-to-end smoke test in Chromium with iPhone emulation.
 *   npm run build && npm run e2e            (E2E_SHOTS=dir for screenshots)
 * Uses the globally installed `playwright` (same approach as Swechan).
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(`${process.env.NODE_PATH ?? '/opt/node22/lib/node_modules'}/playwright`); }
const { chromium, devices } = playwright;
const PORT = 4181, BASE = `http://localhost:${PORT}/`;
const SHOTS = process.env.E2E_SHOTS;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const log = (...a) => console.log('•', ...a);
function assert(cond, msg) { if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`); log('ok –', msg); }

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
await new Promise((resolve, reject) => {
  server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) resolve(); });
  server.on('exit', (c) => reject(new Error(`preview exited ${c}`)));
  setTimeout(() => reject(new Error('preview timeout')), 20000);
});
const browser = await chromium.launch();
let failed = false;
try {
  for (const reduced of [false, true]) {
    const context = await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1, locale: 'sv-SE', reducedMotion: reduced ? 'reduce' : 'no-preference' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(BASE);
    await page.getByText('scener ·').waitFor();
    const cards = page.locator('.card');
    await cards.first().waitFor({ timeout: 10000 });
    assert((await cards.count()) >= 10, `gallery shows the bundled scenes (${await cards.count()})${reduced ? ' [reduced motion]' : ''}`);
    if (SHOTS && !reduced) await page.screenshot({ path: `${SHOTS}/gallery.png`, fullPage: true });
    await page.getByLabel('Sök').fill('slappa');
    assert((await cards.count()) === 1, 'search narrows the gallery');
    await cards.first().click();
    await page.getByRole('heading', { name: /slappa/ }).waitFor();
    const svg = page.locator('.stage svg').first();
    assert(await svg.isVisible(), 'scene page renders the player');
    const timeText = page.locator('.scene-player-controls span').first();
    const t1 = await timeText.innerText();
    await page.waitForTimeout(700);
    const t2 = await timeText.innerText();
    if (reduced) assert(t1 === t2 && !(await page.getByLabel('Spela', { exact: true }).first().isHidden()), 'reduced motion: the player starts paused on the poster');
    else assert(t1 !== t2, `the animation advances (${t1} → ${t2})`);
    await page.getByLabel('Pausa').first().click().catch(() => undefined);
    const slider = page.getByLabel('Tidslinje').first();
    await slider.fill('100');
    assert((await timeText.innerText()).startsWith('100'), 'scrubbing the timeline sets the time');
    await page.getByRole('button', { name: /Till posterbild/ }).click();
    assert((await timeText.innerText()).includes('2600'), 'jump to the poster frame');
    // edit JSON: change the title and apply
    const editor = page.getByLabel('Scen-JSON');
    const json = JSON.parse(await editor.inputValue());
    json.titleSv = 'slappa (test)';
    await editor.fill(JSON.stringify(json, null, 2));
    await page.getByRole('button', { name: 'Använd ändringen (lokalt)' }).click();
    assert(await page.getByRole('heading', { name: /slappa \(test\)/ }).isVisible(), 'a validated JSON edit is applied as a local working copy');
    // invalid JSON is rejected with a readable message
    json.timeline.push({ t: 0, action: 'pour', actor: 'p', from: 'nope', into: 'phone' });
    await editor.fill(JSON.stringify(json, null, 2));
    assert(await page.getByText(/unknown prop "nope"/).isVisible(), 'an invalid edit shows a readable error');
    assert(await page.getByRole('button', { name: 'Använd ändringen (lokalt)' }).isDisabled(), 'the apply button is disabled while the JSON is invalid');
    // export
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportera JSON' }).click()]);
    assert(dl.suggestedFilename() === 'anim.slappa.1.json', 'export downloads the scene file');
    if (SHOTS && !reduced) await page.screenshot({ path: `${SHOTS}/scene.png`, fullPage: true });
    await page.getByRole('button', { name: 'Återställ till repots version' }).click();
    assert(await page.getByRole('heading', { name: /^slappa / }).isVisible(), 'local copy can be dropped');
    assert(errors.length === 0, `no console/page errors (${errors.join(' | ')})`);
    await context.close();
  }
  console.log('\nE2E SMOKE PASSED');
} catch (e) { failed = true; console.error('\nE2E FAILED:', e.message); }
finally { await browser.close(); server.kill(); }
process.exit(failed ? 1 : 0);
