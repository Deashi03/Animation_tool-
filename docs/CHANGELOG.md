# Changelog

## 0.1.0 – 2026-11-05 (fas 1)
- Projekt: Vite 6, React 19, TypeScript 5.8, Zod 3.25, Vitest 3.2 (samma versioner som Swechan). CI med typecheck, test, `anim:validate`, build, Pages-deploy från `main`; separat e2e-jobb med Chromium/iPhone-emulering som även laddar upp kontaktarket.
- Motor: spår med nyckelbilder och easing, rigg med forward kinematics, ledgränser och två-bens-IK, `renderFrame` → `FrameTree`, React- och strängrenderare, determinism.
- Figur nivå B med tre varianter, ansikte, händer, skor, frisyrer, pannband. Föremål: glas, kanna, dörr, låda, boll, soffa, säng, täcke, mugg, telefon, bord, fönster, matta. Miljöer: neutral, rum, sovrum, kök, park, gata; dag/kväll/natt.
- Handlingar: walk, run, jump, turn, idle, reach, grab, release, pour, open, close, sip, lookAt, relax, sleep, exercise (jog, stretch), express, face, pose, set, tween, emphasis.
- Scenformat v1 med kontrastpar och maskinläsbara skillnader (`eyes`, `posture`, `environment.time`, `prop`, `motion`, `speed`, `airborne`, `peaklift`, `end`).
- Scener: springa (mot gå), hoppa, öppna (mot stänga), hälla, bakom, slappa (mot sova), sportig; UI: `ui.feedback.correct` (resultatpanel glider upp, bock ritas), `ui.module.complete` (flagga + stjärnor).
- Studio: galleri med sökning/filter, spelare (spela/pausa/repris/hastighet/skrubbning/posterbild/etikett/140–240 px/iPhone-ram), bildremsa, jämförelse av kontrastpar, JSON-editor med live-validering, lokala arbetskopior, import/export, "markera som granskad" (människa), export av poster-SVG.
- CLI: `anim:new`, `anim:validate`, `anim:strip`, `anim:compare`, `anim:poster`, `anim:sheet`, `anim:report`, `anim:export`.
- Tester: 33 enhets-/komponenttester (schema, spår, rigg, determinism-snapshot, layout, semantik, spelare, beroenderiktning, verktyg) + e2e-flöde (galleri → scen → spela → skrubba → redigera → fel → exportera → reduce-motion).
- Mätt: studio-app 76 kB (26 kB gzip) + React 71 kB gzip; spelaren ensam 116 kB minifierad / 33 kB gzip (esbuild, utan React) – under Swechans vendor-del men över målet 15 kB; figur- och föremålsritningen är det mesta.
- Inte gjort: fysisk iPhone/WebKit, bildfrekvensmätning, mänsklig granskning (allt `ai-draft`).
