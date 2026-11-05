/** Named easing functions. Every function maps [0,1] → ~[0,1] and is deterministic. */
export type EaseName = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'anticipate' | 'overshoot' | 'bounce' | 'step';
export const EASE_NAMES: EaseName[] = ['linear', 'easeIn', 'easeOut', 'easeInOut', 'anticipate', 'overshoot', 'bounce', 'step'];

export const ease: Record<EaseName, (u: number) => number> = {
  linear: (u) => u,
  easeIn: (u) => u * u,
  easeOut: (u) => 1 - (1 - u) * (1 - u),
  easeInOut: (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2),
  // small pull-back before the move (classic animation anticipation)
  anticipate: (u) => { const s = 1.4; return u * u * ((s + 1) * u - s); },
  // ends slightly past the target and settles
  overshoot: (u) => { const s = 1.3; const v = u - 1; return v * v * ((s + 1) * v + s) + 1; },
  bounce: (u) => {
    const n1 = 7.5625, d1 = 2.75;
    if (u < 1 / d1) return n1 * u * u;
    if (u < 2 / d1) return n1 * (u -= 1.5 / d1) * u + 0.75;
    if (u < 2.5 / d1) return n1 * (u -= 2.25 / d1) * u + 0.9375;
    return n1 * (u -= 2.625 / d1) * u + 0.984375;
  },
  step: (u) => (u >= 1 ? 1 : 0),
};
export const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
