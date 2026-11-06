/**
 * Blind test – the semantic gate.
 *   npm run anim:blindtest -- make [ids…|--all] --batch b1     → review/strips/blind-b1.png + review/blind/b1.questions.md (+ hidden key)
 *   npm run anim:blindtest -- grade b1 answers.json [--reviewer name] → registry/blind.json, printed results
 * The reviewer must be a separate session/subagent that only sees the PNG and the questions, never the scene files or the key.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadScenes, reviewDir } from '../../src/tools/scenes';
import { makeBlindBatch, gradeBlind, type BlindKey, type BlindAnswers } from '../../src/tools/blind';
import { args, flag, opt, rel, fail } from './_shared';

const [cmd, ...rest] = args();
const { scenes } = loadScenes();
if (cmd === 'make') {
  const batch = opt('batch', new Date().toISOString().slice(0, 10))!;
  const ids = flag('all') ? [...scenes.values()].filter((s) => s.kind === 'word').map((s) => s.animationId) : rest;
  if (!ids.length) fail('Ange animationId (eller --all)');
  for (const id of ids) if (!scenes.has(id)) fail(`Okänd: ${id}`);
  const r = await makeBlindBatch(scenes, ids, batch);
  console.log(`Remsor: ${rel(r.png)}\nFrågor: ${path.relative(process.cwd(), r.questions)}\nFacit (visa inte för granskaren): ${path.relative(process.cwd(), r.key)}`);
} else if (cmd === 'grade') {
  const [batch, answersFile] = rest;
  if (!batch || !answersFile) fail('Ange batch och svarsfil');
  const key = JSON.parse(fs.readFileSync(path.join(reviewDir(), 'blind', `${batch}.key.json`), 'utf8')) as BlindKey;
  const answers = JSON.parse(fs.readFileSync(answersFile, 'utf8')) as BlindAnswers;
  const g = gradeBlind(key, answers, opt('reviewer', 'claude-blind'));
  for (const r of g.results) console.log(`${r.passed ? (r.flag ? 'FLAGG' : 'RÄTT') : 'FEL '} ${r.letter} ${r.animationId}: svar "${r.choice}" (facit "${r.expected}")${r.description ? ` – ${r.description}` : ''}${r.flag ? `\n      ⚠ ${r.flag}` : ''}`);
  console.log(`${g.passed}/${g.total} godkända (rätt val och ingen flagga). Resultat sparade i registry/blind.json`);
  process.exit(g.passed === g.total ? 0 : 1);
} else fail('Använd: make … | grade <batch> <answers.json>');
