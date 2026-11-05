# Swechan-integration – kontrakt och steg

Status 2026-11-05: **kontrakt och paket klara i Animation_tool-; ingenting är ändrat i Swechan.** Införandet i Swechan är ett separat uppdrag som Swechan-sessionen gör med denna fil som instruktion.

## Vad Animation_tool- levererar

| Leverans | Kommando | Innehåll |
|---|---|---|
| Spelarpaket | `npm run anim:package` → `dist/player-package/anim/` | 30 källfiler (TypeScript/TSX): `player/` (`ScenePlayer`, `ScenePoster`, `useReducedMotion`, `FrameView`), motorn (`schema/`, `engine/`, `assets/`, `motions/`, `actions/`, `compiler/compile.ts`), referenskomponenten `WordVisual.tsx`, `README.md`, `manifest.json`. Beroenden: React 19, Zod 3. Mätt 2026-11-05: 206 kB minifierat / **61 kB gzip** utan React (målet i CLAUDE.md var ~15 kB; föremålsbiblioteket står för det mesta – se "Storlek" nedan). |
| Animationspaket | `npm run anim:export` → `dist/swechan/` | `animations.index.json` (en post per animation: `animationId`, `senseId`, `kind`, `quiz`, `group`, `confusableWith`, `reviewStatus`, `durationMs`, `posterMs`, `bytes`, `file`, `poster`), `anim/<animationId>.json` (rå scen, median 1,3 kB), `poster/<animationId>.svg` (posterbild 180 px). 75 animationer i dag, 952 kB totalt inkl. posterbilder. |

Rå scen exporteras (inte kompilerad): kompilatorn följer med spelaren och en scen är ~1 kB mot tiotals kB kompilerade spår. Kompilering sker vid laddning (< 5 ms per scen i Node).

## Steg i Swechan (gör i denna ordning, varje steg med gröna tester)

1. **Kopiera spelarpaketet** till `src/ui/anim/` (hela mappen `dist/player-package/anim/`). Lägg till ett test som importerar `src/ui/anim/player` och kompilerar + renderar en inbäddad testscen (`frameToSvg(renderFrame(compileScene(scene), 0))` innehåller `<svg`). Vite behöver ingen ny konfiguration; `manualChunks` bör ge `anim` en egen vendor-del (`src/ui/anim/**` → chunk `anim`) så att den laddas lat.
2. **Lägg animationspaketet** under `public/anim/` (eller `src/content/data/anim/` med `import.meta.glob('./anim/*.json', { eager: false })`). Index `animations.index.json` laddas ivrigt (40 kB för 75; ~0,5 kB per post – vid tusentals animationer: dela indexet per modul, se nedan).
3. **Register:** utveckla `src/content/data/images/wordImages.json` till `wordVisuals.json`. Varje post får `kind: 'animation' | 'illustration' | 'symbol' | 'photo'` och, för animationer, `animationId`. Befintliga fält (`senseId`, `motif`, `group`, `quiz`, `confusableWith`, `symbol`) är oförändrade; `illustration` = dagens kodritade bilder, `photo` fasas ut. Migrering: en engångsskript som läser `animations.index.json` och skriver in `animation`-poster för de `senseId` som har en animation med `reviewStatus` ≥ `validated` (eller alla `ai-draft` i en pilot bakom flagga). **Inga `senseId` eller motiv-ID ändras.**
4. **`imageFor` → `visualFor`** i `src/content/images.ts` (behåll `imageFor` som alias). `imageDistractorAllowed` oförändrad: den gäller posterbilden, och animationens `quiz`/`group`/`confusableWith` kommer från indexet. Testerna i `images.test.ts` ska gå igenom oförändrade plus nya fall där en betydelse är `animation`.
5. **Komponent:** `<WordVisual senseId size mode>` enligt `src/ui/anim/WordVisual.tsx` (anpassa `registry`, `loadScene`, `renderImage`). Var den används:
   - Ordintroduktion (`WordIntro.tsx`, 180 px): `mode="intro"` – autoplay **en gång**, sedan repris-knapp (spelaren har `controls`). Under `reduce-motion` (mediefrågan eller `html.reduce-motion`) startar spelaren pausad på posterbilden med Spela-knapp – inbyggt i `ScenePlayer`.
   - Bildfråga (200 px), bildalternativ (140 px), stavning (150 px): `mode="quiz"` / `"spelling"` → **bara posterbilden** (`ScenePoster`). Aldrig uppspelning i flerval – lika villkor för alternativen.
   - Aldrig i luckmeningar, böjning eller japanska → svenska (som i 0.6).
6. **Fallback:** finns ingen animation används befintlig wordArt-bild; finns ingen bild visas inget. Ingen påverkan på FSRS, streak, daglig session eller sparad progression – animationer är rena visningsresurser.
7. **Offline:** lägg `anim/*.json` som laddas för en modul i service workerns förladdning tillsammans med modulens lektion; bumpa cache-namnet (`swechan-v8`). Posterbilderna är små SVG:er och kan ligga i samma cache.
8. **Tester att lägga till i Swechan:** (a) spelarpaketet kompilerar och renderar; (b) registret: varje `animation`-post pekar på en fil som finns i indexet; (c) `visualFor` ger animation före bild när båda finns och `kind` är `animation`; (d) bildövningar genereras med flera slumpfrön även när alternativen är posterbilder (samma regler); (e) e2e: ordintroduktion spelar och pausar under `prefers-reduced-motion`.

## Laddning vid tusentals animationer

- Index per modul: `anim/index/<moduleId>.json` med bara modulens poster (≈ 20 × 0,5 kB), genererat av `anim:export -- --by-module` (planerat; dagens export skriver ett index).
- En animation per fil (1–6 kB). Förladda modulens filer med lektionen. Kompilering vid första visning, cache i minnet per `animationId`.
- Spelaren stoppar `requestAnimationFrame` när elementet är utom synhåll och när fliken är dold.

## Storlek – ärlig lägesbild

| Del | Mätt | Kommentar |
|---|---|---|
| Spelare + motor (utan React), gzip | 61 kB | Målet var ~15 kB. Figur- och föremålsbiblioteket (101 föremål) är det mesta. Laddas en gång, cachas. Nästa steg om det behövs: ladda föremålsfamiljer lat per scen (schemat vet vilka assets en scen använder). |
| En scen | median 1,3 kB | rå JSON |
| Index, 75 animationer | 40 kB | 0,5 kB per post; dela per modul vid skala |
| Uppspelning | 60 fps vid 4× CPU-strypning, inga långa uppgifter | `docs/perf.md`; Chromium med iPhone 13-emulering, inte fysisk iPhone |

## Vad Swechan-sessionen behöver från produktägaren

- Godkännande av mallarna i `registry/templates.json` (ogodkänd mall = varning, inte fel).
- Besked om animationer med `reviewStatus: ai-draft` får visas i appen under piloten, eller bara `validated` (= godkänt blindtest).
