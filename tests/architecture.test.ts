import fs from 'node:fs';
import path from 'node:path';
/** The player (what moves into Swechan) must not depend on the studio, export or tools. */
const ALLOWED_FOR_PLAYER = ['schema', 'engine', 'assets', 'motions', 'actions', 'compiler', 'player'];
function imports(file: string): string[] { return [...fs.readFileSync(file, 'utf8').matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]!); }
function walk(dir: string): string[] { return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(dir, e.name)] : [])); }
describe('dependency direction', () => {
  it('player, engine, actions and compiler never import studio/export/tools', () => {
    for (const dir of ALLOWED_FOR_PLAYER) for (const f of walk(path.join('src', dir))) for (const imp of imports(f)) {
      if (!imp.startsWith('.')) continue;
      const target = path.normalize(path.join(path.dirname(f), imp));
      const top = target.split(path.sep)[1]!;
      expect(ALLOWED_FOR_PLAYER, `${f} imports ${imp}`).toContain(top);
    }
  });
  it('engine does not import React', () => {
    for (const f of walk('src/engine')) expect(imports(f).some((i) => i === 'react' || i === 'react-dom'), f).toBe(false);
  });
  it('no innerHTML of scene data in player or studio', () => {
    for (const f of [...walk('src/player'), ...walk('src/studio')]) expect(fs.readFileSync(f, 'utf8')).not.toMatch(/dangerouslySetInnerHTML/);
  });
});
