import path from 'node:path';
const FLAGS = new Set(['all', 'label', 'json', 'strips', 'force']);
/** Positional arguments: everything that is not an option or an option's value. */
export const args = (): string[] => { const out: string[] = []; const av = process.argv.slice(2); for (let i = 0; i < av.length; i++) { const a = av[i]!; if (a === '--') continue; if (a.startsWith('--')) { if (!FLAGS.has(a.slice(2))) i++; continue; } out.push(a); } return out; };
export const flag = (name: string): boolean => process.argv.includes(`--${name}`);
export const opt = (name: string, d?: string): string | undefined => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : d; };
export const rel = (p: string | null): string => (p ? path.relative(process.cwd(), p) : '(ingen PNG – Playwright saknas)');
export function fail(msg: string): never { console.error(msg); process.exit(1); }
