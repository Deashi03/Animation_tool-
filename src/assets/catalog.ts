/**
 * Asset catalogue: every prop id the schema accepts. Kept free of drawing code
 * so the schema can import it. Families: `tool.<shape>`, `container.<shape>`, `food.<shape>`, `fixture.<shape>`.
 */
import { TOOL_SHAPES } from './props/tools';
import { CONTAINER_SHAPES } from './props/containers';
import { FOOD_SHAPES } from './props/food';
import { FIXTURE_SHAPES } from './props/fixtures';

export const BASE_PROP_ASSETS = ['glass', 'jug', 'door', 'box', 'ball', 'football', 'sofa', 'bed', 'blanket', 'mug', 'phone', 'table', 'window', 'mat', 'ladder', 'castle', 'brawl', 'stove', 'pan', 'spatula'] as const;
export const PROP_ASSET_IDS: readonly string[] = [
  ...BASE_PROP_ASSETS,
  ...TOOL_SHAPES.map((s) => `tool.${s}`),
  ...CONTAINER_SHAPES.map((s) => `container.${s}`),
  ...FOOD_SHAPES.map((s) => `food.${s}`),
  ...FIXTURE_SHAPES.map((s) => `fixture.${s}`),
];
const SET = new Set(PROP_ASSET_IDS);
export const isPropAsset = (id: string): boolean => SET.has(id);
/** Closest known ids for an error message: same family, or a short edit distance on the last segment. */
function dist(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0]![j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length]![b.length]!;
}
export const suggestAsset = (id: string): string[] => {
  const last = id.split('.').pop() ?? id;
  return PROP_ASSET_IDS.map((a) => ({ a, d: dist(last, a.split('.').pop() ?? a) })).filter((x) => x.d <= 2 || x.a.includes(last) || last.includes(x.a.split('.').pop() ?? '')).sort((x, y) => x.d - y.d).slice(0, 4).map((x) => x.a);
};
