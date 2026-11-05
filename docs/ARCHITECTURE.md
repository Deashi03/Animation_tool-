# Arkitektur

Statisk Vite/React/TypeScript-app utan backend. All animation är **data** (scen-JSON) som kompileras till **spår** (nyckelbilder per egenskap) och renderas av en ren funktion `renderFrame(compiled, t)` till ett `FrameTree`, som ritas av React (spelaren) eller till en SVG-sträng (Node: posterbilder, bildremsor, export).

```
scene.json ─validate─► Scene ─compile─► { tracks, durationMs, cycleMs, posterMs } ─renderFrame(t)─► FrameTree
                                                                                   ├─ <FrameView> (React, spelare/studio)
                                                                                   ├─ frameToSvg (Node, review/export)
                                                                                   └─ layout-/kontrastkontroller (tester, validate)
```

| Mapp | Ansvar | Får bero på |
|---|---|---|
| `schema/` | Zod-schema, typer, migreringar | engine (easing-namn) |
| `engine/` | spår, easing, rigg (FK + IK), `renderFrame`, SVG-sträng | assets |
| `assets/` | palett, figur, föremål, miljöer, ikoner | engine/frame, engine/rig |
| `motions/` | parametriska rörelsegeneratorer → spår | engine |
| `actions/` | semantiska handlingar → rörelser + föremålstillstånd + effekter | motions, assets, engine |
| `compiler/` | compile, validate, layout, contrast | actions, engine, schema |
| `player/` | `<ScenePlayer>`, `<ScenePoster>`, `<FrameView>`, reduce-motion | allt ovan + React |
| `studio/` | galleri, editor, jämförelse, import/export, lokala arbetskopior | player |
| `export/`, `tools/`, `scripts/cli/` | Node-verktyg för Claude | allt |

Ett test (`tests/architecture.test.ts`) bevakar att `player/` och allt under den aldrig importerar `studio/`, `export/` eller `tools/`, att `engine/` är React-fri och att ingen `innerHTML` används för scendata.

## Beslut (ADR)

1. **Egen liten motor, inte PixiJS/Rive/GSAP.** Spår + easing + FK är ~500 rader, deterministiska och testbara i Node. Renderaren kan bytas bakom `FrameTree`.
2. **Semantiska handlingar i scenen, geometri i koden.** `pour` kompileras till arm-IK, luta kärl, stråle, nivå. Scener blir korta och konsekventa; `set`/`tween`/`pose` finns som lågnivåväg.
3. **Riggad figur med ledgränser** i stället för stela helbilder (Swechans `person()`); naturliga poser garanteras av gränserna, ansiktet är en förstaklassens kanal.
4. **Täta nyckelbilder för cykler** (40 ms) i stället för funktioner i datat – allt förblir serialiserbart och versionerbart.
5. **Determinism:** inga slumptal, heltalsmillisekunder, avrundade attribut. Snapshot-test av bildhashar.
6. **Kontrastpar som primitiv** med maskinläsbara `distinctiveFeatures` som valideras i båda scenerna.
7. **Generell motor:** `kind: ui` + `shapes` + `tween/set` gör samma motor användbar för Swechans gränssnittsanimationer (rätt svar, modul klar) och för andra program. Ingen Swechan-specifik kod i `engine/`.
8. **Spelare utan beroenden** (bara React), ~33 kB gzip (116 kB minifierad) inkl. motor, kompilator, figur och föremål (mätt 2026-11-05 med esbuild). Flyttas till Swechan som `src/ui/anim/`.
9. **Reduce motion:** OS-inställning + Swechans `html.reduce-motion`/`html.full-motion` → posterbild + spela-knapp. Spelaren pausar utom synhåll och i dold flik.
10. **GitHub Pages är ingen databas:** studion sparar lokala arbetskopior i `localStorage`, exporterar filer; publicering sker genom att lägga filer i `scenes/`.
11. **Granskningsmaterial som PNG** via den globalt installerade Playwright (samma som Swechans e2e) – Claude måste kunna se resultatet.
12. **Versioner:** `schemaVersion`, `assetsVersion`, `motionsVersion` i varje scen; migreringar i `schema/migrate.ts`.

## Prestanda (uppmätt 2026-11-05)
- Byggd studio: app 76 kB (26 kB gzip), vendor React 242 kB (71 kB gzip), varje scen egen del ~1,2 kB.
- Spelaren ensam (esbuild, minifierad, utan React): 116 kB / 33 kB gzip. Målet i CLAUDE.md (≤ ~15 kB) nås inte ännu; mest är figur/föremål. Kan delas upp (föremål lat per scen) i fas 3. En bildruta = ~120–160 SVG-noder; React uppdaterar attribut via rAF. Bildfrekvens på iPhone **ej uppmätt** – `anim:perf` är fas 2.
