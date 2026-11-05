import { useEffect, useState } from 'react';
/**
 * True when motion should be reduced: the OS setting (`prefers-reduced-motion`)
 * unless the host app opted into full motion with `html.full-motion`, or the
 * host explicitly asked for reduced motion with `html.reduce-motion` (Swechan's
 * classes). Re-evaluates on media and class changes.
 */
export function useReducedMotion(): boolean {
  const compute = () => {
    if (typeof document === 'undefined') return false;
    const html = document.documentElement;
    if (html.classList.contains('reduce-motion')) return true;
    if (html.classList.contains('full-motion')) return false;
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  };
  const [reduced, setReduced] = useState(compute);
  useEffect(() => {
    const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    const update = () => setReduced(compute());
    mq?.addEventListener?.('change', update);
    const mo = typeof MutationObserver === 'function' ? new MutationObserver(update) : null;
    mo?.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => { mq?.removeEventListener?.('change', update); mo?.disconnect(); };
  }, []);
  return reduced;
}
