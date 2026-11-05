/**
 * Scene store for the studio: scenes bundled from scenes/**.json (each as its
 * own lazy chunk) plus local working copies in localStorage. Pages is not a
 * database – the user exports files; the local copy is a convenience only.
 */
import { useCallback, useEffect, useState } from 'react';
import { Scene, type Scene as SceneT } from '../schema/scene';
import { migrateScene } from '../schema/migrate';

const modules = import.meta.glob('../../scenes/**/*.json');
const LS_KEY = 'animation-tool.working-copies.v1';

export type Entry = { scene: SceneT; source: 'bundled' | 'local'; file?: string; error?: string };

async function loadBundled(): Promise<Map<string, Entry>> {
  const out = new Map<string, Entry>();
  for (const [file, load] of Object.entries(modules)) {
    try {
      const mod = (await load()) as { default: unknown };
      const r = Scene.safeParse(migrateScene(mod.default));
      if (r.success) out.set(r.data.animationId, { scene: r.data, source: 'bundled', file: file.replace('../../', '') });
    } catch { /* skip broken file */ }
  }
  return out;
}
function readLocal(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Record<string, unknown>; } catch { return {}; }
}
function writeLocal(data: Record<string, unknown>): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { /* storage may be unavailable */ }
}

export function useScenes() {
  const [bundled, setBundled] = useState<Map<string, Entry> | null>(null);
  const [local, setLocal] = useState<Record<string, unknown>>(() => readLocal());
  useEffect(() => { void loadBundled().then(setBundled); }, []);
  const all = new Map<string, Entry>(bundled ?? []);
  for (const [id, raw] of Object.entries(local)) {
    const r = Scene.safeParse(migrateScene(raw));
    if (r.success) all.set(id, { scene: r.data, source: 'local', file: bundled?.get(id)?.file });
  }
  const saveLocal = useCallback((id: string, raw: unknown) => { const next = { ...readLocal(), [id]: raw }; writeLocal(next); setLocal(next); }, []);
  const dropLocal = useCallback((id: string) => { const next = readLocal(); delete next[id]; writeLocal(next); setLocal(next); }, []);
  const clearLocal = useCallback(() => { writeLocal({}); setLocal({}); }, []);
  return { loading: bundled === null, scenes: all, localIds: new Set(Object.keys(local)), saveLocal, dropLocal, clearLocal, localRaw: local };
}

export function download(name: string, text: string, type = 'application/json'): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
