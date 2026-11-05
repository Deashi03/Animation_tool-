# Animation_tool- · Animationsstudio för Swechan

Ett kostnadsfritt, statiskt verktyg (TypeScript · React · Vite · SVG) som renderar **pedagogiska 2D-animationer från strukturerad scendata**. Byggt för att en AI (Claude) ska kunna producera många enhetliga animationer snabbt, och för att produktägaren ska kunna granska dem i en enkel webbstudio. Konsument: språkinlärningsappen [Swechan](https://github.com/Deashi03/Swechan).

Läs `CLAUDE.md` för uppdraget och policyn, `docs/SCENE_FORMAT.md` för scenformatet, `docs/STYLE_GUIDE.md` för stilen, `docs/ARCHITECTURE.md` för besluten.

## Snabbstart

```bash
npm ci
npm run dev            # studion på http://localhost:5173
npm run typecheck && npm test && npm run build
npm run e2e            # kräver globalt installerad Playwright (se nedan)
```

Publicerad studio: `https://deashi03.github.io/Animation_tool-/` när GitHub Pages är aktiverat (Settings → Pages → Build and deployment → Source: **GitHub Actions**). Byggs och publiceras från `main` av `.github/workflows/ci.yml`.

## Arbetsflöde för en ny animation (Claude eller människa)

```bash
npm run anim:new -- s.slappa.1 --template relax --contrast anim.sova.1   # scenes/slappa/anim.slappa.1.json från mall
# redigera JSON: miljö, aktörer, föremål, tidslinje med semantiska handlingar
npm run anim:validate -- scenes/slappa/anim.slappa.1.json                 # schema, referenser, tider, utsnitt, kontrastkrav
npm run anim:strip -- anim.slappa.1                                       # review/strips/anim.slappa.1.png – TITTA på den
npm run anim:compare -- anim.slappa.1 anim.sova.1                         # kontrastparet sida vid sida
npm run anim:poster -- anim.slappa.1                                      # posterbild i 180/140 px och med etikett
npm run anim:sheet -- --strips                                            # kontaktark med alla scener
npm run anim:report                                                       # status per scen
npm run anim:export                                                       # Swechan-paket i dist/swechan/
```

Regel: **ingen scen rapporteras klar utan att bildremsan har granskats.** Mallar finns i `src/tools/templates.ts` (`locomotion`, `manipulate-prop`, `relax`, `emotion`, `ui`).

Bildremsor och kontaktark renderas till PNG med den globalt installerade Playwright-paketet (`/opt/node22/lib/node_modules/playwright` i molnmiljön, `npm install -g playwright@1.63.0 && playwright install chromium` lokalt). Saknas Playwright skrivs bara HTML-filen.

## Struktur

```
scenes/<lemma>/<animationId>.json   scendata – källan till allt
src/schema      Zod-schema + typer (SCENE_FORMAT.md)        src/player    React-spelare → flyttas till Swechan
src/engine      spår, easing, rigg, renderFrame, SVG-sträng   src/studio    galleri, spelare, editor, jämförelse
src/assets      palett, figur, föremål, miljöer, ikoner      src/export    Swechan-paket
src/motions     gå, springa, hoppa, andas, stretcha …        src/tools     logiken bakom CLI-kommandona
src/actions     semantiska handlingar → spår                 scripts/cli   tunna vite-node-skript
src/compiler    compile, validate, layout, contrast          tests/        Vitest; scripts/e2e-smoke.mjs (Chromium, iPhone 13)
review/         genererat granskningsmaterial (ej i git)     docs/         dokumentation
```

## Status

Fas 1 (2026-11-05): motor, rigg, scenformat v1, studio, CLI, tio ordanimationer (sju mål + tre kontrastpartner) och två gränssnittsanimationer. Allt innehåll är `ai-draft`. Se `docs/CHANGELOG.md` och `docs/REVIEW_LOG.md`.
