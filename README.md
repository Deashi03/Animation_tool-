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

## Arbetsflöde för en modul (Claude eller människa)

```bash
npm run anim:coverage -- --swechan ../swechan                             # hur mycket av ordboken recepten och byggstenarna täcker → registry/coverage.md
npm run anim:plan -- --swechan ../swechan --module m.skara-och-hacka      # plan per ord: typ, mall, kontrast, japanskt ord → registry/plan/<modul>.md
npm run anim:recipe -- --swechan ../swechan --module m.skara-och-hacka    # recept ur ordboken per ord, eller MANUELLT med skäl (--all --compare: mätning mot handrecepten)
npm run anim:batch -- --swechan ../swechan --module m.skara-och-hacka --write --strips   # utkast från recepten + remsor + rapport i registry/batch/
# per utkast: läs anmärkningen i rapporten, justera JSON, validera, titta på remsan
npm run anim:validate -- scenes/skära/anim.skära.1.json                   # schema, referenser, tider, utsnitt, kontrastkrav, mallkontrakt
npm run anim:strip -- anim.skära.1                                        # review/strips/anim.skära.1.png – TITTA på den
npm run anim:compare -- anim.skära.1 anim.hacka.1                         # kontrastparet sida vid sida
npm run anim:blindtest -- make anim.skära.1 anim.hacka.1 --batch b9       # omärkta remsor + frågor till en oberoende granskare
npm run anim:blindtest -- grade b9 review/blind/b9.answers.json           # registrerar resultatet; utan godkänt blindtest är scenen inte klar
npm run anim:props -- --filter food                                       # katalogblad över byggstenar (tool, container, food, fixture, garment)
npm run anim:new -- s.ordet.1 --template tool-rhythm                      # en enskild scen från en mall
npm run anim:poster -- anim.skära.1 · anim:sheet · anim:report · anim:export
```

Regel: **ingen scen rapporteras klar utan att bildremsan har granskats och blindtestet är godkänt.** Vilken förinställd lösning varje ordfunktion har (och vad som räknas som bärare) står i `docs/WORD_FUNCTIONS.md`. Saknas handrecept genererar `anim:batch` ett ur ordboken; kan det inte, får raden status *manual* med skäl – då gäller `docs/MANUAL_SCENES.md`. Mätningar körs med `--generated --out <dir>` så att biblioteket i `scenes/` aldrig rörs. Mallar (begreppsfamiljer) finns i `src/compiler/templates.ts`; recepten per ord i `registry/recipes.json`; vilka mallar produktägaren godkänt i `registry/templates.json`.

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

0.4.0 (2026-11-05): motor, rigg, scenformat v1, studio, CLI, 101 föremål i fem familjer, 34 handlingar, 14 mallar, 75 ordscener (alla tekniskt giltiga, 59 med godkänt blindtest) och två gränssnittsanimationer. Täckning av Swechans ordbok: 606 betydelser behöver animation, 502 har recept och byggstenar, 21 är blockerade. Allt innehåll är `ai-draft`. Se `docs/CHANGELOG.md`, `docs/REVIEW_LOG.md` och `registry/coverage.md`.
