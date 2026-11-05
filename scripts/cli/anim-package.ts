/**
 * anim:package – the player package for Swechan: the exact source folders the
 * player needs (schema, engine, assets, motions, actions, compiler/compile) plus
 * player/, a WordVisual reference component, a manifest and a README, copied to
 * dist/player-package/anim/ so it can be dropped into Swechan as src/ui/anim/.
 * Also measures the player-only bundle size with esbuild (no React).
 *   npm run anim:package [-- --out dist/player-package]
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { opt } from './_shared';

const out = path.resolve(opt('out', 'dist/player-package')!);
const root = path.join(out, 'anim');
fs.rmSync(out, { recursive: true, force: true });
const copyDir = (from: string, to: string, filter: (f: string) => boolean = () => true) => { fs.mkdirSync(to, { recursive: true }); for (const f of fs.readdirSync(from)) { const p = path.join(from, f); if (fs.statSync(p).isDirectory()) copyDir(p, path.join(to, f), filter); else if (filter(f)) fs.copyFileSync(p, path.join(to, f)); } };
const notTest = (f: string) => !f.endsWith('.test.ts') && !f.endsWith('.test.tsx');
for (const d of ['schema', 'engine', 'assets', 'motions', 'actions', 'player']) copyDir(path.join('src', d), path.join(root, d), notTest);
fs.mkdirSync(path.join(root, 'compiler'), { recursive: true });
for (const f of ['compile.ts']) fs.copyFileSync(path.join('src/compiler', f), path.join(root, 'compiler', f));
// a reference component for Swechan: senseId → registry → animation (lazy) or image fallback
fs.writeFileSync(path.join(root, 'WordVisual.tsx'), `/**
 * <WordVisual> – reference wiring for Swechan. Looks up the sense in the visuals
 * registry, lazy-loads the animation JSON and plays it (autoplay once in the
 * word introduction; poster only in quizzes). Falls back to \`renderImage\`
 * (Swechan's wordArt) when there is no animation. Copy and adapt; the player
 * itself (ScenePlayer/ScenePoster) is the stable part.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { ScenePlayer, ScenePoster } from './player';
import { Scene, type Scene as SceneT } from './schema/scene';
import { migrateScene } from './schema/migrate';

export type VisualEntry = { senseId: string; kind: 'animation' | 'illustration' | 'symbol' | 'photo'; animationId?: string; motif?: string; quiz?: boolean; group?: string; confusableWith?: string[] };
export type WordVisualProps = {
  senseId: string; size?: number; mode?: 'intro' | 'quiz' | 'spelling';
  registry: Record<string, VisualEntry>;
  /** returns the raw scene JSON for an animationId (fetch of a static file, or import.meta.glob) */
  loadScene: (animationId: string) => Promise<unknown>;
  /** Swechan's existing still image for a sense (wordArt), or null */
  renderImage?: (entry: VisualEntry, size: number) => ReactElement | null;
};
export function WordVisual({ senseId, size = 180, mode = 'intro', registry, loadScene, renderImage }: WordVisualProps): ReactElement | null {
  const entry = registry[senseId];
  const [scene, setScene] = useState<SceneT | null>(null);
  useEffect(() => { let on = true; setScene(null); if (entry?.kind === 'animation' && entry.animationId) loadScene(entry.animationId).then((raw) => { const p = Scene.safeParse(migrateScene(raw)); if (on && p.success) setScene(p.data); }).catch(() => undefined); return () => { on = false; }; }, [entry?.animationId, entry?.kind, loadScene]);
  if (!entry) return null;
  if (entry.kind === 'animation') {
    if (!scene) return <div style={{ width: size, height: size, borderRadius: 16, background: '#f6f2ea' }} aria-hidden />;
    // quizzes and spelling show the poster frame only: equal terms for every alternative, no moving image
    if (mode !== 'intro') return <ScenePoster scene={scene} size={size} ariaLabel={scene.titleSv} />;
    return <ScenePlayer scene={scene} size={size} autoplay loop={false} controls ariaLabel={scene.titleSv} />;
  }
  return renderImage ? renderImage(entry, size) : null;
}
`);
fs.writeFileSync(path.join(root, 'README.md'), `# anim – spelarpaket från Animation_tool-

Kopiera hela denna mapp till Swechan som \`src/ui/anim/\`. Beroenden: React 19 och Zod 3 (båda finns i Swechan). Ingen Swechan-specifik kod här.

- \`player/index.ts\` – \`ScenePlayer\`, \`ScenePoster\`, \`useReducedMotion\`, \`compileScene\`, \`renderFrame\`, \`frameToSvg\`, \`Scene\`, \`migrateScene\`.
- \`WordVisual.tsx\` – referenskoppling senseId → register → animation eller befintlig bild.
- Allt annat är motorn: \`schema/\`, \`engine/\`, \`assets/\`, \`motions/\`, \`actions/\`, \`compiler/compile.ts\`.

Animationerna själva kommer från \`npm run anim:export\` (\`animations.index.json\` + \`anim/<id>.json\` + \`poster/<id>.svg\`). Se \`docs/SWECHAN_INTEGRATION.md\` i Animation_tool- för stegen.
`);
// bundle size of the player entry alone (React external)
const entry = path.join(root, 'player', 'index.ts');
const bundle = path.join(out, 'player.bundle.js');
execFileSync(path.join('node_modules', '.bin', 'esbuild'), [entry, '--bundle', '--minify', '--format=esm', '--platform=browser', '--external:react', '--external:react/jsx-runtime', `--outfile=${bundle}`, '--log-level=warning', '--jsx=automatic'], { stdio: 'inherit' });
const raw = fs.readFileSync(bundle); const gz = gzipSync(raw).length;
const files = (dir: string): number => fs.readdirSync(dir).reduce((n, f) => { const p = path.join(dir, f); return n + (fs.statSync(p).isDirectory() ? files(p) : 1); }, 0);
const manifest = { format: 'animation-tool-player', version: JSON.parse(fs.readFileSync('package.json', 'utf8')).version, generatedAt: new Date().toISOString().slice(0, 10), files: files(root), bundleBytes: raw.length, bundleGzipBytes: gz, peerDependencies: { react: '^19.1.0', zod: '^3.25.0' } };
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Spelarpaket: ${path.relative(process.cwd(), root)}/ (${manifest.files} filer). Spelare + motor utan React: ${(raw.length / 1024).toFixed(0)} kB minifierat, ${(gz / 1024).toFixed(0)} kB gzip.`);
