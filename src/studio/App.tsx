import { useEffect, useMemo, useRef, useState } from 'react';
import { ScenePlayer, ScenePoster, type ScenePlayerHandle } from '../player/ScenePlayer';
import { FrameView } from '../player/FrameView';
import { compileScene } from '../compiler/compile';
import { renderFrame } from '../engine/render';
import { validateScene } from '../compiler/validate';
import { frameToSvg } from '../engine/svgString';
import type { Scene } from '../schema/scene';
import { download, useScenes, type Entry } from './store';

type Route = { page: 'gallery' } | { page: 'scene'; id: string };
function useRoute(): Route {
  const parse = (): Route => { const m = /^#\/scene\/(.+)$/.exec(decodeURIComponent(location.hash)); return m ? { page: 'scene', id: m[1]! } : { page: 'gallery' }; };
  const [r, setR] = useState<Route>(parse);
  useEffect(() => { const on = () => setR(parse()); window.addEventListener('hashchange', on); return () => window.removeEventListener('hashchange', on); }, []);
  return r;
}
const STATUS_SV: Record<string, string> = { 'ai-draft': 'utkast', validated: 'validerad', reviewed: 'granskad' };

export function App() {
  const route = useRoute();
  const store = useScenes();
  return (
    <div className="app">
      <header className="top">
        <a href="#/" className="brand">Animationsstudio</a>
        <span className="muted">{store.scenes.size} scener · {store.localIds.size} lokala ändringar</span>
      </header>
      {store.loading ? <p className="muted">Laddar scener …</p>
        : route.page === 'gallery' ? <Gallery store={store} />
        : <SceneView id={route.id} store={store} />}
    </div>
  );
}

function Gallery({ store }: { store: ReturnType<typeof useScenes> }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('alla');
  const [kind, setKind] = useState('alla');
  const [onlyNoContrast, setOnlyNoContrast] = useState(false);
  const list = useMemo(() => [...store.scenes.values()].filter(({ scene }) => {
    const hay = `${scene.animationId} ${scene.senseId ?? ''} ${scene.titleSv} ${scene.category}`.toLowerCase();
    return (!q || hay.includes(q.toLowerCase())) && (status === 'alla' || scene.pedagogy.reviewStatus === status) && (kind === 'alla' || scene.kind === kind) && (!onlyNoContrast || (scene.kind === 'word' && !scene.contrast));
  }).sort((a, b) => a.scene.titleSv.localeCompare(b.scene.titleSv, 'sv')), [store.scenes, q, status, kind, onlyNoContrast]);
  const fileInput = useRef<HTMLInputElement>(null);
  const importFiles = async (files: FileList | null) => {
    if (!files) return;
    let ok = 0; const errors: string[] = [];
    for (const f of Array.from(files)) {
      try {
        const raw = JSON.parse(await f.text()) as unknown;
        const items = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' && 'animations' in (raw as object)) ? (raw as { animations: unknown[] }).animations : [raw];
        for (const item of items) { const v = validateScene(item); if (v.scene) { store.saveLocal(v.scene.animationId, item); ok++; } else errors.push(`${f.name}: ${v.problems[0]?.message ?? 'ogiltig'}`); }
      } catch (e) { errors.push(`${f.name}: ${(e as Error).message}`); }
    }
    alert(`${ok} scener importerade som lokala arbetskopior.${errors.length ? `\n\nFel:\n${errors.join('\n')}` : ''}`);
  };
  return (
    <main>
      <div className="toolbar">
        <input className="input" placeholder="Sök id, senseId, titel, kategori" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Sök" />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="alla">Alla statusar</option><option value="ai-draft">Utkast</option><option value="validated">Validerade</option><option value="reviewed">Granskade</option></select>
        <select className="input" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Typ"><option value="alla">Ord + UI</option><option value="word">Ordanimationer</option><option value="ui">Gränssnitt</option></select>
        <label className="check"><input type="checkbox" checked={onlyNoContrast} onChange={(e) => setOnlyNoContrast(e.target.checked)} /> saknar kontrastpar</label>
        <span className="spacer" />
        <button className="btn" onClick={() => fileInput.current?.click()}>Importera …</button>
        <input ref={fileInput} type="file" accept="application/json" multiple hidden onChange={(e) => void importFiles(e.target.files)} />
        <button className="btn" onClick={() => download('animation-tool-scener.json', JSON.stringify([...store.scenes.values()].map((e) => e.scene), null, 2))}>Exportera alla</button>
        {store.localIds.size > 0 && <>
          <button className="btn" onClick={() => download('animation-tool-arbetskopior.json', JSON.stringify(Object.values(store.localRaw), null, 2))}>Säkerhetskopia av lokala ({store.localIds.size})</button>
          <button className="btn danger" onClick={() => { if (confirm('Ta bort alla lokala arbetskopior? Exportera dem först om du vill behålla dem.')) store.clearLocal(); }}>Rensa lokala</button>
        </>}
      </div>
      <p className="muted small">Lokala arbetskopior sparas bara i den här webbläsaren. Exportera en fil och lägg den i repot för att behålla ändringar.</p>
      <div className="grid">
        {list.map(({ scene, source }) => (
          <a key={scene.animationId} className="card" href={`#/scene/${encodeURIComponent(scene.animationId)}`}>
            <ScenePoster scene={scene} size={140} />
            <div className="card-title">{scene.titleSv}</div>
            <div className="card-sub">{scene.animationId}</div>
            <div className="badges"><span className={`badge s-${scene.pedagogy.reviewStatus}`}>{STATUS_SV[scene.pedagogy.reviewStatus]}</span>{scene.kind === 'ui' && <span className="badge">UI</span>}{source === 'local' && <span className="badge local">lokal ändring</span>}{scene.kind === 'word' && !scene.contrast && <span className="badge warn">inget kontrastpar</span>}</div>
          </a>
        ))}
      </div>
      {!list.length && <p className="muted">Inga scener matchar.</p>}
    </main>
  );
}

function SceneView({ id, store }: { id: string; store: ReturnType<typeof useScenes> }) {
  const entry: Entry | undefined = store.scenes.get(id);
  const [json, setJson] = useState('');
  const [dirty, setDirty] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [size, setSize] = useState(180);
  const [showLabel, setShowLabel] = useState(false);
  const [phone, setPhone] = useState(false);
  const [compareId, setCompareId] = useState(() => entry?.scene.contrast?.with[0] ?? '');
  const [time, setTime] = useState<number | undefined>(undefined);
  const [tick, setTick] = useState(0);
  const player = useRef<ScenePlayerHandle>(null);
  useEffect(() => { if (entry) { setJson(JSON.stringify(entry.scene, null, 2)); setDirty(false); setCompareId(entry.scene.contrast?.with[0] ?? ''); } }, [entry?.scene]);
  // follow playback time for the strip highlight
  useEffect(() => { const h = setInterval(() => setTick((n) => n + 1), 250); return () => clearInterval(h); }, []);
  const validation = useMemo(() => { try { return validateScene(JSON.parse(json), new Map([...store.scenes].map(([k, e]) => [k, e.scene]))); } catch (e) { return { ok: false, problems: [{ level: 'error' as const, message: `JSON: ${(e as Error).message}` }] }; } }, [json, store.scenes]);
  if (!entry) return <main><p>Okänd scen: {id}. <a href="#/">Till galleriet</a></p></main>;
  const scene = entry.scene;
  const compiled = compileScene(scene);
  const other = compareId ? store.scenes.get(compareId)?.scene : undefined;
  const stripTimes = Array.from({ length: 8 }, (_, i) => Math.round((compiled.durationMs * i) / 7));
  const now = player.current?.timeMs ?? 0; void tick;
  const apply = () => { if (!validation.ok || !('scene' in validation) || !validation.scene) return; store.saveLocal(scene.animationId, JSON.parse(json)); setDirty(false); };
  const markReviewed = () => {
    const reviewer = prompt('Granskarens namn (en människa som har tittat på animationen):'); if (!reviewer) return;
    const next: Scene = { ...scene, pedagogy: { ...scene.pedagogy, reviewStatus: 'reviewed', reviewer, date: new Date().toISOString().slice(0, 10) } };
    store.saveLocal(scene.animationId, next); setJson(JSON.stringify(next, null, 2));
  };
  const exportOne = () => download(`${scene.animationId}.json`, JSON.stringify(scene, null, 2));
  const exportSvg = () => download(`${scene.animationId}.poster.svg`, frameToSvg(renderFrame(compiled, compiled.posterMs), { width: 180, ariaLabel: scene.titleSv }), 'image/svg+xml');
  return (
    <main className="scene-view">
      <nav className="crumbs"><a href="#/">Galleri</a> › {scene.titleSv} <span className={`badge s-${scene.pedagogy.reviewStatus}`}>{STATUS_SV[scene.pedagogy.reviewStatus]}</span>{entry.source === 'local' && <span className="badge local">lokal ändring</span>}</nav>
      <div className="columns">
        <section className="panel">
          <h2>{scene.titleSv} <small className="muted">{scene.animationId}{scene.senseId ? ` · ${scene.senseId}` : ''}</small></h2>
          {scene.meaningHint && <p className="muted">{scene.meaningHint}</p>}
          <div className={`stage${phone ? ' phone' : ''}`}>
            <ScenePlayer key={`${scene.animationId}-${entry.source}-${speed}`} ref={player} scene={compiled} size={size} autoplay speed={speed} showLabel={showLabel} controls time={time} onTime={undefined} ariaLabel={scene.titleSv} />
          </div>
          <div className="controls">
            <label>Hastighet <select className="input" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>{[0.25, 0.5, 1, 1.5, 2].map((v) => <option key={v} value={v}>{v}×</option>)}</select></label>
            <label>Storlek <select className="input" value={size} onChange={(e) => setSize(Number(e.target.value))}><option value={140}>140 px (bildalternativ)</option><option value={180}>180 px (ordintro)</option><option value={240}>240 px</option></select></label>
            <label className="check"><input type="checkbox" checked={showLabel} onChange={(e) => setShowLabel(e.target.checked)} /> etikett</label>
            <label className="check"><input type="checkbox" checked={phone} onChange={(e) => setPhone(e.target.checked)} /> iPhone-ram</label>
            <button className="btn" onClick={() => { setTime(compiled.posterMs); setTimeout(() => setTime(undefined), 0); player.current?.pause(); player.current?.seek(compiled.posterMs); }}>Till posterbild ({compiled.posterMs} ms)</button>
          </div>
          <h3>Bildremsa</h3>
          <div className="strip">
            {stripTimes.map((t) => <figure key={t} className={Math.abs(t - compiled.posterMs) <= compiled.durationMs / 14 ? 'poster' : Math.abs(t - now) <= compiled.durationMs / 14 ? 'now' : ''} onClick={() => { player.current?.pause(); player.current?.seek(t); }}><FrameView frame={renderFrame(compiled, t, { showLabel })} size={78} /><figcaption>{t}</figcaption></figure>)}
          </div>
          <h3>Jämför med kontrastpar</h3>
          <div className="controls">
            <select className="input" value={compareId} onChange={(e) => setCompareId(e.target.value)} aria-label="Jämför med"><option value="">– välj scen –</option>{[...store.scenes.keys()].filter((k) => k !== id).sort().map((k) => <option key={k} value={k}>{k}</option>)}</select>
            {scene.contrast && <span className="muted small">deklarerat: {scene.contrast.with.join(', ')}</span>}
          </div>
          {other && <div className="compare"><div><ScenePlayer scene={other} size={160} autoplay speed={speed} showLabel={showLabel} controls ariaLabel={other.titleSv} /><div className="muted small">{other.titleSv}</div></div><div><ScenePlayer scene={compiled} size={160} autoplay speed={speed} showLabel={showLabel} controls ariaLabel={scene.titleSv} /><div className="muted small">{scene.titleSv}</div></div></div>}
          {scene.contrast && <ul className="small muted">{scene.contrast.distinctiveFeatures.map((f) => <li key={f}><code>{f}</code></li>)}</ul>}
        </section>
        <section className="panel">
          <h3>Scen-JSON <span className={`badge ${validation.ok ? 's-validated' : 'err'}`}>{validation.ok ? 'giltig' : 'fel'}</span>{dirty && <span className="badge warn">osparad</span>}</h3>
          <textarea className="editor" value={json} onChange={(e) => { setJson(e.target.value); setDirty(true); }} spellCheck={false} aria-label="Scen-JSON" />
          <ul className="problems">{validation.problems.map((p, i) => <li key={i} className={p.level}>{p.level === 'error' ? '✗' : '!'} {p.message}</li>)}{!validation.problems.length && <li className="ok">Inga anmärkningar.</li>}</ul>
          <div className="controls">
            <button className="btn primary" disabled={!validation.ok || !dirty} onClick={apply}>Använd ändringen (lokalt)</button>
            {entry.source === 'local' && <button className="btn" onClick={() => store.dropLocal(scene.animationId)}>Återställ till repots version</button>}
            <button className="btn" onClick={exportOne}>Exportera JSON</button>
            <button className="btn" onClick={exportSvg}>Exportera poster-SVG</button>
            {scene.pedagogy.reviewStatus !== 'reviewed' && <button className="btn" onClick={markReviewed}>Markera som granskad …</button>}
          </div>
          <p className="muted small">Status <em>granskad</em> sätts bara av en människa som har sett animationen. Exportera filen och lägg den i <code>scenes/</code> i repot för att publicera ändringen.</p>
          <details><summary className="muted small">Kompilerade spår ({compiled.tracks.size})</summary><pre className="tracks">{[...compiled.tracks.keys()].sort().join('\n')}</pre></details>
        </section>
      </div>
    </main>
  );
}
