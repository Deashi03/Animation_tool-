/**
 * Colour palette. Copied from Swechan's `src/ui/wordArt/kit.ts` (0.6) so that
 * animations and existing word illustrations share one look. Change it only
 * through a STYLE_GUIDE decision.
 */
export const palette = {
  ink: '#2b2a33', paper: '#f6f2ea', white: '#fbfbf8', skin: '#f1c7a1', skin2: '#d9a57c', hair: '#3b2f2f',
  navy: '#2f4a7a', denim: '#3f6fb5', denim2: '#2e5590', sky: '#8cc7e8', red: '#d64545', pink: '#ef9fb5', rose: '#f6c9d4',
  green: '#4f9d69', mint: '#a8dcc0', yellow: '#f2c14e', orange: '#ef8a3c', brown: '#a0673d', tan: '#d4a373', beige: '#e6d3b3',
  grey: '#9aa3ad', grey2: '#c9ced4', dark: '#3d3f4a', black: '#2e2e36', purple: '#8a6bbf', lilac: '#c7b3e6', reflex: '#d7f23a',
  accent: '#e4572e', gold: '#e0b23c', silver: '#c0c6cc',
  // additions for animation (night light, water, highlights)
  night: '#2f3a5a', nightPaper: '#dcdfec', water: '#8cc7e8', water2: '#5aa9d6', blush: '#f2a1a1', shadow: 'rgba(43,42,51,0.10)',
  // Swechan UI tokens ("Fjord") for ui scenes
  uiPrimary: '#2a5bd7', uiSuccess: '#1f9d6a', uiSuccessTint: '#e9f8f1', uiError: '#d0453b', uiText: '#14213a', uiSurface: '#ffffff', uiAccent: '#ffd54a',
} as const;
export type PaletteKey = keyof typeof palette;
/** Resolve a colour: a palette key or a literal CSS colour. */
export function color(c: string): string {
  return (palette as Record<string, string>)[c] ?? c;
}
