/**
 * <ScenePlayer> – plays a compiled scene with requestAnimationFrame. Pauses
 * when off-screen or when the tab is hidden, honours reduced motion (shows the
 * poster with a play button), and exposes play/pause/seek through props and an
 * imperative handle. Zero dependencies beyond React; this folder is what moves
 * into Swechan.
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { compileScene, type CompiledScene } from '../compiler/compile';
import { renderFrame } from '../engine/render';
import type { Scene } from '../schema/scene';
import { FrameView } from './FrameView';
import { useReducedMotion } from './useReducedMotion';

export type ScenePlayerHandle = { play(): void; pause(): void; replay(): void; seek(ms: number): void; readonly timeMs: number };
export type ScenePlayerProps = {
  scene: Scene | CompiledScene;
  size?: number;
  autoplay?: boolean;
  /** overrides the scene's loop setting */
  loop?: boolean;
  speed?: number;
  showLabel?: boolean;
  /** show built-in play/pause/replay buttons under the picture */
  controls?: boolean;
  /** controlled time (ms); when set, the player does not animate on its own */
  time?: number;
  onTime?: (ms: number) => void;
  onEnd?: () => void;
  className?: string;
  ariaLabel?: string;
};

const isCompiled = (s: Scene | CompiledScene): s is CompiledScene => 'tracks' in s;

export const ScenePlayer = forwardRef<ScenePlayerHandle, ScenePlayerProps>(function ScenePlayer(
  { scene, size, autoplay = false, loop, speed = 1, showLabel = false, controls = false, time, onTime, onEnd, className, ariaLabel }, ref) {
  const compiled = useMemo(() => (isCompiled(scene) ? scene : compileScene(scene)), [scene]);
  const reduced = useReducedMotion();
  const doLoop = loop ?? compiled.scene.loop;
  const [t, setT] = useState(() => (time ?? (autoplay && !reduced ? 0 : compiled.posterMs)));
  const [playing, setPlaying] = useState(autoplay && !reduced && time === undefined);
  const [visible, setVisible] = useState(true);
  const wrap = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);
  const last = useRef<number | null>(null);
  const tRef = useRef(t);
  tRef.current = t;

  // pause when scrolled out of view or the tab is hidden
  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof IntersectionObserver !== 'function') return;
    const io = new IntersectionObserver((es) => setVisible(es.some((e) => e.isIntersecting)), { threshold: 0.05 });
    io.observe(el);
    const vis = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', vis);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', vis); };
  }, []);

  const step = useCallback((now: number) => {
    const prev = last.current ?? now;
    last.current = now;
    let next = tRef.current + (now - prev) * speed;
    if (next >= compiled.cycleMs) {
      if (doLoop) next = next % compiled.cycleMs;
      else { next = compiled.durationMs; setPlaying(false); onEnd?.(); }
    }
    setT(next); onTime?.(next);
    raf.current = requestAnimationFrame(step);
  }, [compiled, doLoop, onEnd, onTime, speed]);

  useEffect(() => {
    if (playing && visible && time === undefined) { last.current = null; raf.current = requestAnimationFrame(step); }
    return () => { if (raf.current !== null) cancelAnimationFrame(raf.current); raf.current = null; };
  }, [playing, visible, step, time]);
  useEffect(() => { if (time !== undefined) setT(time); }, [time]);

  const api: ScenePlayerHandle = useMemo(() => ({
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    replay: () => { setT(0); setPlaying(true); },
    seek: (ms) => { setT(Math.max(0, Math.min(compiled.cycleMs, ms))); },
    get timeMs() { return tRef.current; },
  }), [compiled.cycleMs]);
  useImperativeHandle(ref, () => api, [api]);

  const frame = useMemo(() => renderFrame(compiled, Math.min(t, compiled.durationMs), { showLabel }), [compiled, t, showLabel]);
  const label = ariaLabel ?? compiled.scene.titleSv;
  const showPlayOverlay = !playing && !controls && time === undefined;
  return (
    <div ref={wrap} className={`scene-player${className ? ` ${className}` : ''}`} style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
      <FrameView frame={frame} size={size} label={label} />
      {showPlayOverlay && (
        <button type="button" aria-label={reduced ? `Spela upp animationen ${label} (rörelse är avstängd i inställningarna)` : `Spela upp ${label}`} onClick={() => api.replay()}
          style={{ position: 'absolute', right: 6, bottom: 6, width: 34, height: 34, borderRadius: 17, border: 'none', background: 'rgba(43,42,51,0.78)', color: '#fff', fontSize: 16, cursor: 'pointer' }}>▶</button>
      )}
      {controls && (
        <div className="scene-player-controls" style={{ display: 'flex', gap: 6, marginTop: 6, lineHeight: 1.2 }}>
          <button type="button" onClick={() => (playing ? api.pause() : api.play())} aria-label={playing ? 'Pausa' : 'Spela'}>{playing ? '❚❚' : '▶'}</button>
          <button type="button" onClick={() => api.replay()} aria-label="Repris">↺</button>
          <input type="range" min={0} max={compiled.cycleMs} value={Math.round(t)} onChange={(e) => { api.pause(); api.seek(Number(e.target.value)); }} aria-label="Tidslinje" style={{ flex: 1 }} />
          <span style={{ fontSize: 12, minWidth: 54, textAlign: 'right' }}>{Math.round(Math.min(t, compiled.durationMs))} ms</span>
        </div>
      )}
    </div>
  );
});

/** Static poster frame (what quizzes and reduced motion show). */
export function ScenePoster({ scene, size, showLabel, ariaLabel }: { scene: Scene | CompiledScene; size?: number; showLabel?: boolean; ariaLabel?: string }) {
  const compiled = useMemo(() => (isCompiled(scene) ? scene : compileScene(scene)), [scene]);
  const frame = useMemo(() => renderFrame(compiled, compiled.posterMs, { showLabel }), [compiled, showLabel]);
  return <FrameView frame={frame} size={size} label={ariaLabel ?? compiled.scene.titleSv} />;
}
