/**
 * Blind test: a reviewer who has not seen the scene files looks at unlabeled
 * filmstrips and says what each one means, choosing among the word, its
 * declared confusables and distractors. This reproduces the product owner's
 * own test ("say what it means without the label") and is the semantic gate
 * that validation cannot provide.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Scene } from '../schema/scene';
import { stripHtml, writeReview } from './render';
import { blindResults, writeBlindResults, type BlindResult } from './registry';
import { REVIEW_DIR } from './scenes';

export type BlindKey = { batch: string; createdAt: string; items: { letter: string; animationId: string; expected: string; options: string[] }[] };
export type BlindAnswers = Record<string, { choice: string; description?: string }>;

/** deterministic shuffle (mulberry32 seeded from a string) */
function shuffled<T>(arr: T[], seed: string): T[] {
  let h = 1779033703 ^ seed.length; for (const ch of seed) { h = Math.imul(h ^ ch.charCodeAt(0), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0; const rnd = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const out = [...arr]; for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j]!, out[i]!]; } return out;
}
const lemmaOf = (senseId: string) => senseId.split('.')[1]?.replace(/-/g, ' ') ?? senseId;

/** Build the batch: unlabeled strips (letters), a questions file for the reviewer and a hidden key. */
export async function makeBlindBatch(scenes: Map<string, Scene>, ids: string[], batch: string): Promise<{ png: string | null; questions: string; key: string }> {
  const order = shuffled(ids, batch);
  const letters = order.map((_, i) => String.fromCharCode(65 + i));
  const all = [...scenes.values()].filter((s) => s.kind === 'word');
  const items: BlindKey['items'] = order.map((id, i) => {
    const s = scenes.get(id)!;
    const confusables = s.pedagogy.confusableWith.map(lemmaOf);
    const partners = (s.contrast?.with ?? []).map((w) => scenes.get(w)?.titleSv).filter((x): x is string => !!x);
    const pool = shuffled(all.filter((o) => o.animationId !== id && o.titleSv !== s.titleSv).map((o) => o.titleSv), batch + id);
    const options = [...new Set([s.titleSv, ...partners, ...confusables, ...pool])].slice(0, 5);
    return { letter: letters[i]!, animationId: id, expected: s.titleSv, options: shuffled(options, batch + id + 'opt') };
  });
  // strips without titles, labels or ids
  const html = items.map((it) => stripHtml(scenes.get(it.animationId)!, { frames: 8, size: 140, label: false, title: `Remsa ${it.letter}` })).join('');
  const sheet = await writeReview('strips', `blind-${batch}`, html.replace(/<small>.*?<\/small>/g, '<small></small>'), 1240);
  const dir = path.join(REVIEW_DIR, 'blind'); fs.mkdirSync(dir, { recursive: true });
  const key: BlindKey = { batch, createdAt: new Date().toISOString().slice(0, 10), items };
  const keyFile = path.join(dir, `${batch}.key.json`); fs.writeFileSync(keyFile, JSON.stringify(key, null, 2) + '\n');
  const q = [`# Blindtest ${batch}`, '', 'Du ser bildremsor av korta animationer för svenska ord, utan etiketter. För varje remsa:', '1. Beskriv med en mening vad som händer och vad animationen betyder.', '2. Välj det alternativ som passar bäst. Om inget passar, skriv "inget".', '', 'Svara som JSON: `{ "A": { "description": "...", "choice": "ordet" }, ... }`', '',
    ...items.map((it) => `- **${it.letter}**: ${it.options.join(' · ')}`), ''].join('\n');
  const qFile = path.join(dir, `${batch}.questions.md`); fs.writeFileSync(qFile, q);
  return { png: sheet.png, questions: qFile, key: keyFile };
}

/** Grade answers against the key and record the result per scene. */
export function gradeBlind(key: BlindKey, answers: BlindAnswers, reviewer = 'claude-blind'): { results: (BlindResult & { animationId: string; letter: string })[]; passed: number; total: number } {
  const store = blindResults();
  const results = key.items.map((it) => {
    const a = answers[it.letter];
    const norm = (s: string) => s.trim().toLowerCase();
    const passed = !!a && norm(a.choice) === norm(it.expected);
    const r: BlindResult & { animationId: string; letter: string } = { animationId: it.animationId, letter: it.letter, date: new Date().toISOString().slice(0, 10), batch: key.batch, passed, choice: a?.choice ?? '', expected: it.expected, description: a?.description, reviewer };
    (store[it.animationId] ??= []).push({ date: r.date, batch: r.batch, passed: r.passed, choice: r.choice, expected: r.expected, description: r.description, reviewer });
    return r;
  });
  writeBlindResults(store);
  return { results, passed: results.filter((r) => r.passed).length, total: results.length };
}
