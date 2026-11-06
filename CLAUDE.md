# CLAUDE.md — Utvecklingsinstruktion för Animation_tool-

**Version 2 · 2026-11-05.** Ersätter den första specifikationen (bevarad som bilaga A längst ner – den gäller fortfarande där inget här säger annat). Version 2 är skriven av Claude till Claude efter produktägarens utvärdering av Swechans bildpilot 0.6 och innehåller tre saker som saknades: *varför* verktyget behövs (vad som gick fel med stillbilderna), den nya **visualiseringspolicyn med tre typer**, och en konkret, kodnära plan för ett verktyg som gör att Claude kan producera **många, begripliga, enhetliga animationer snabbt** – utan löpande kostnader.

Läs hela dokumentet innan du skriver kod. Läs därefter Swechans repository enligt avsnitt 4. **Känd fälla (rättad 2026-11-05):** ledvinklar är "framåt-positiva" i figurens lokala rum; `drawCharacter` löser riggen ospeglad och renderaren speglar hela figuren för `facing: left` – spegla aldrig på två ställen. **Arbetar du med scener (inte motorn):** läs `README.md` (arbetsflödet), `docs/WORD_FUNCTIONS.md` (ordfunktion → förinställd lösning, bärar-regeln, receptformat), `docs/SCENE_FORMAT.md` och `docs/STYLE_GUIDE.md`, titta på bildremsorna, och lägg aldrig till TypeScript för ett enskilt ord – saknas en byggsten, lägg till den i `assets/`, `motions/` eller `actions/` med test och remsa.

---

## 0. Uppdraget i en mening

Bygg ett kostnadsfritt, statiskt, AI-styrt verktyg (TypeScript/React/Vite/SVG) som från **strukturerad scendata** renderar **deterministiska, pedagogiska 2D-animationer** för språkinlärningsappen Swechan, med en arbetsgång där Claude kan skapa, **se**, jämföra, validera och exportera animationer i stor skala, och där produktägaren kan granska dem i en enkel webbstudio.

- **Repository:** `Deashi03/Animation_tool-` (detta repo). **Status 2026-11-05: fas 1 levererad** – se `README.md`, `docs/CHANGELOG.md`, `docs/REVIEW_LOG.md`. Nästa steg: fas 2 enligt avsnitt 12 och `docs/ROADMAP.md`.
- **Konsument:** `Deashi03/Swechan` (React 19, TypeScript, Vite, Zod, GitHub Pages, local-first-PWA). Ändras **inte** i detta uppdrag.
- **Publicering:** GitHub Pages på `https://deashi03.github.io/Animation_tool-/` (kräver engångsinställning, se avsnitt 12).

---

## 1. Bakgrund: vad Swechan-piloten lärde oss

### 1.1 Vad som gjordes i Swechan 0.5–0.6 (2026-11-05)

- 0.5 införde kodritade SVG-motiv per modul (stil "Platt", `src/ui/art/`).
- Produktägaren gjorde stickprov och beslutade: **en bild per ord**, visad vid ordintroduktionen och i vissa övningar; bildfrågor där alternativen inte går att blanda ihop (*bryna* får aldrig ha *steka* som alternativ). Abstrakta ord får **symbol** om det finns en kulturellt överförbar scen (Sverige ↔ Japan), gärna kopplad till exempelmeningen. Claude ansvarar för hela bildflödet; produktägaren ska inte generera bilder själv.
- 0.6 (pilot *Vardagskläder*, 107 ord i 7 moduler + 3 foton) levererade: en bilderboksverktygslåda i `src/ui/wordArt/kit.ts` (plagg, person, pilar, händer på en 120×120-duk), 100+ motiv i `motifs.ts`, bildregistret `src/content/data/images/wordImages.json` (`kind`, `group`, `quiz`, `confusableWith`, `symbol`), nya övningstyper `image_choice`/`image_pick`, distraktorregeln `imageDistractorAllowed`, foton från Openverse (CC0/CC BY, 400×400 webp) för *bryna*, *mocka*, *manchester*, och kontaktarket `npm run art:words`.

### 1.2 Produktägarens dom över piloten (det här uppdragets utgångspunkt)

> "Jag tycker inte att det här med bilder håller måttet. Slappa är alldeles för lätt att blanda ihop med 'sova'. De sportiga kläderna ser inte så sportiga ut. Fotona var inte heller bra."

Konkret, i koden som den ser ut nu:

| Ord | Vad bilden visar | Varför den misslyckas |
|---|---|---|
| *slappa* (`WORD_MOTIFS.slappa`) | En soffa, ett huvud med slutna drag, texten "z z" | Allt i bilden signalerar *sova*. Det som skiljer *slappa* från *sova* – vaken, avslappnad, aktiv i lugnt tempo, dagtid – finns inte i bilden. En **stillbild saknar tiden** som skulle visa skillnaden (titta på telefonen, dricka något, vicka på foten). |
| *sportig* (`WORD_MOTIFS.sportig`) | En stående person i orange tröja, svarta byxor, vita skor, uppsatt hår | Egenskapen *sportig* bärs av **rörelse och sammanhang** (joggar, stretchar, svettband, löparskor i steg). En stillastående figur i färgade kläder läses som "person i kläder". |
| Fotona (*bryna*, *mocka*, *manchester*) | Fritt licensierade foton i 400×400 | Stilbrott mot resten av appen, osäker kvalitet och beskärning, kräver licenshantering och nätverkskällor. Förkastade av produktägaren. |

Generella lärdomar som verktyget ska bygga in:

1. **Verb, adjektiv och abstraktioner är ofta tidsliga.** En stillbild tvingar fram symboler (zzz, pilar, stjärnor) som är kulturellt osäkra och lätt feltolkas. En kort animation visar handlingen, följden och tempot.
2. **Skillnaden mot grannordet måste vara en designparameter**, inte något som kontrolleras efteråt. *slappa* ska designas *mot* *sova*; *sportig* *mot* *vardaglig/välklädd*; *springa* *mot* *gå*; *hälla* *mot* *droppa/spilla*.
3. **Claude kunde inte se vad den gjorde.** I 0.6 granskades bilderna via ett kontaktark först i efterhand. Verktyget måste ge Claude en **visuell återkopplingsslinga under produktionen**: bildremsor (filmstrips) av varje animation och sida-vid-sida-jämförelser av förväxlingsbara ord, som PNG som Claude kan titta på i sessionen.
4. **Foton utgår.** Den nya policyn (avsnitt 2) har inga foton. De tre befintliga fotona i Swechan får ligga kvar tills de ersätts; verktyget hanterar inte foton.
5. **Enhetlighet slår variation.** En figur, en palett, ett linjespråk, ett tempo. Tiotusentals animationer blir bara möjliga om varje ny scen är en *kombination* av färdiga, kvalitetssäkrade byggblock.

---

## 2. Visualiseringspolicyn: tre typer

Produktägarens beslut 2026-11-05. Detta ersätter 0.6-pilotens "illustration eller foto".

| Typ | Används för | Producerad av |
|---|---|---|
| **1. Animation** | Verb, adjektiv och abstraktioner (även substantiv som betecknar aktiviteter eller abstraktioner, t.ex. *tvätt*, *flytt*, *fika* som händelse) | **Detta verktyg** |
| **2. Bild** (stillbild) | Substantiv för konkreta ting (plagg, redskap, möbler, livsmedel, rum …) – om inte en animation eller symbol är mer lämplig | Swechans `wordArt` i dag; på sikt kan verktygets stillbildsläge (avsnitt 6.7) ta över |
| **3. Symbol** | Abstraktioner som inte har en entydig scen men en kulturellt överförbar symbol (t.ex. *mod*, *vis*), gärna kopplad till exempelmeningen – om inte animation eller bild är mer lämplig | Swechans `wordArt` i dag; samma pipeline som typ 2 på sikt |

### 2.1 Beslutsregler (används av `anim:plan`, se 9.2, och dokumenteras per ord)

**Grundprincip (produktägaren 2026-11-05):** *handlingar och processer visas som rörelse utan text; egenskaper, relationer och abstraktioner visas som en symbolisk, nästan stilla scen tillsammans med den japanska översättningen på vitt.* Rörelsen bär verbet; utseende + gloss bär egenskapen.

1. **Är ordet ett konkret ting som kan kännas igen på formen?** → Bild. (*kofta*, *stekpanna*, *soffa*.) Undantag: om det som skiljer ordet från grannorden är en *användning* eller *förändring* (t.ex. *visp* vs *slev* kan vara bild, men *vispa* är animation).
2. **Är ordet en handling, process, förändring eller rörelse?** → Animation. (Alla verb; substantiv som *tvätt*, *städning*, *flytt*; adverb som *långsamt*.)
3. **Är ordet en egenskap?** → **Regel (produktägaren 2026-11-05, efter *sportig*): egenskapen bärs av utseende, föremål eller läge – aldrig av en aktivitet som själv är ett verb – och visas tillsammans med det japanska ordet på vitt.** Mall `attribute-gloss`: en figur eller ett föremål som *har* egenskapen (fotbollskläder för *sportig*, randig tröja för *randig*, skrynklig skjorta för *skrynklig*), lugn andning eller en liten förändring som etablerar egenskapen (frukten mognar, skjortan skrynklas), och det japanska ordet i en pratbubbla med svans mot det som bär egenskapen eller på en panel som glider in. Ingen handling som läses som ett verb: en figur som kickar boll betyder *kicka*, inte *sportig*. Kontrastpar i samma bild (`property-contrast`) används bara när motsatsen är själva poängen (*tung/lätt*, *ren/smutsig*) – och även då med glossen. Egenskaper som bara syns i rörelse (*vinglig*, *seg*) får en liten, loopad rörelse som inte är ett eget verb, plus gloss.
4. **Är ordet en relation i rummet?** → Mall `relation-arrow`: två föremål i stillhet, en pil som pekar ut relationen och det japanska ordet på vitt (*bakom* = boll bakom låda + bågpil + 後ろ). Ingen människa, ingen rörelse som kan läsas som ett verb. Posterbilden är slutläget.
5. **Är ordet abstrakt?** → Samma princip som 3 och 4: en **symbolisk minischen** som visualiserar begreppet, alltid tillsammans med det japanska ordet på vitt (*mod* = liten figur ställer sig framför något stort + 勇気; *vis* = äldre figur som lyssnar och pekar ut vägen + 賢い). Översättningen gör att scenen får vara symbolisk utan att bli gåtfull. Om ingen kulturellt överförbar scen finns: **ingen visualisering** (bättre än en vilseledande).
6. **Känslor** → Animation (ansiktsuttryck + kroppshållning + utlösande situation), utan kulturellt specifika stereotyper. Aldrig i bildfrågor om två känslor kan förväxlas.
8. **Bärar-regeln (produktägaren 2026-11-05, efter batch-utkasten för *vass*, *grov*, *halvera*, *skölja*):** varje ordscen visar ett typexempel – ett föremål, en förändring, en rörelse, en klädseldetalj eller en ikon som i sig pekar på ordet. Text förklarar, bär aldrig ensam; en figur som bara säger ordet är ett valideringsfel. Den fullständiga tabellen *ordfunktion → mall → bärare → text* är `docs/WORD_FUNCTIONS.md`; alla recept följer den.
7. **Allt som är kulturbundet till Sverige** (fika, midsommar, allemansrätt) får visas, men symbolen får inte kräva västerländsk metaforkunskap (uggla = visdom, lejon = mod, fyrklöver = tur är förbjudna som ensamma bärare).

### 2.2 Metadata som varje visualisering ska ha (oavsett typ)

- `senseId` (Swechans `s.<lemma>.<n>`), `kind` (`animation | image | symbol`), `quiz` (entydig nog för bildfrågor), `group` (visuell grupp; distraktorer tas aldrig från samma grupp), `confusableWith` (betydelser som får aldrig bli alternativ), `reviewStatus` (`ai-draft | validated | reviewed`), `posterMs` (vilken bildruta som representerar animationen som stillbild).
- **Symboler och känslor är aldrig `quiz: true`.** Animationer är `quiz: true` bara om posterbilden *ensam* är entydig (regeln i Swechan gäller stillbilden i övningen, inte uppspelningen).

### 2.3 Rörelsekvalitet (produktägaren 2026-11-05)

Animationerna ska vara **snygga, mjuka och proffsiga – aldrig kusliga**. Produktägaren såg i de första skisserna att armarna ibland hamnade onaturligt. Därför: ledgränser i riggen (armbågar bara framåt, knän bara bakåt), eased övergångar, cykler från sinusfunktioner, anticipation före varje rörelse och ett lugnt slutläge. En pose som ser fel ut i bildremsan är ett fel, även om den validerar. Nivå B valdes som detaljnivå (bläckkontur, läsbart ansikte, vanthänder, skor) – tillräcklig för att allt pedagogiskt syns utan att bli svår att animera konsekvent.

### 2.4 Den gyllene regeln: fysiken (produktägaren 2026-11-05)

> "En gyllene regel är att animationen ska se ut att inte helt strida mot fysikens lagar."

Allt behöver inte vara perfekt, men inget får bryta mot fysiken på ett sätt som ögat ser. Konkreta regler som motorn upprätthåller (inte scenerna):
- **Planterade fötter glider aldrig.** Benen styrs av fotplacering + IK (`motions/gait`): under stödfasen rör sig foten bakåt under höften i exakt markhastigheten; under svängfasen i en båge framåt. Går figuren fortare än duken räcker till rullar världen (`env.scrollX`) i resterande hastighet – träd långsammare än buskar (parallax).
- **Kroppen hänger ihop.** Bålen ritas mellan den verkliga axellinjen och den verkliga höftlinjen, med ett bäcken som binder ihop benen; lutning flyttar aldrig magen från höfterna.
- **Tyngdlagen.** Hopp och bollar följer parabler (konstant nedåtacceleration), vågrät hastighet är konstant i luften, landningar har nedsjunkning (squash) och återhämtning. Höfterna är lägst strax efter fotisättning ("down") och högst i flykt ("up").
- **Löpning är mer än ben:** framåtlutning, motsatt armpendling med böjda armbågar, flygfas, huvud som hålls plant, sparsamma fartstreck.
- **Föremål respekterar volym.** Ett täcke ligger *ovanpå* kroppen med en puckel som följer den, en hållen kanna sitter upprätt i handen tills den lutas.
- **Kontrollera i remsan** med tider som inte är multiplar av cykeln, annars ser varje ruta likadan ut.
- **Inte alla scener behöver människor.** Relationer och många handlingar visas tydligast mellan föremål (`roll`, `tween`, `set`): *bakom* är en boll som rullar in bakom en låda. En person som "lägger" något är en extra handling som kan missförstås.
- **Text ligger alltid på vitt** (produktägaren 2026-11-05): en pill, en pratbubbla (`bg: bubble` med `tail` mot det den gäller) eller en vit panel (`bg: panel`) som glider in från en kant och aldrig täcker hela bilden. Motorn ritar bakgrunden automatiskt och validatorn avvisar text utan bakgrund i ordscener. Etiketten längst ner är också en vit pill.
- **Relationer och abstraktioner får visas med pil och japanskt ord** (produktägaren 2026-11-05): *bakom* = bågpil över lådan till den dolda bollen + 後ろ. Rörelse som kan misstas för ett verb undviks i rumsord. Anime/serie-konventioner (slagsmålsmoln, stjärnor, fartstreck) är tillåtna och begripliga för målgruppen.
- **Effekter är välkomna och ska sitta fast vid det de tillhör:** zzz vid munnen, fartstreck bakom kroppen under hela rörelsen, damm vid fötterna. De förstärker, bär aldrig betydelsen ensamma.

### 2.5 Motorn är generell (produktägaren 2026-11-05)

Samma motor ska även göra **gränssnittsanimationer** för Swechan – t.ex. den gröna resultatpanelen som glider upp vid rätt svar, start och avslut av en modul – och vara användbar i andra program. Därför: `kind: "ui"`-scener med fria former (`shapes`), ikoner och `tween`/`set`, valfri dukstorlek, transparent bakgrund, Fjord-färger som palettnycklar, och **ingen Swechan-specifik kod i `engine/`**. Två referensscener finns: `ui.feedback.correct` och `ui.module.complete`.

### 2.6 Vad policyn betyder för Swechan (senare, separat uppdrag)

Swechans `wordImages.json` (en bild per betydelse, `illustration | photo`) ska på sikt bli ett register över **visualiseringar** (`animation | image | symbol`). Förslag i avsnitt 11. **Rör inte Swechan nu.**

---

## 3. Hårda krav (oförändrade från v1, förtydligade)

1. **Inga nya löpande kostnader.** Ingen betald AI-API, bild-/videogenerering, molnserver, prenumeration eller licens. Endast fritt licensierade open-source-beroenden med redovisad licens. Målet är uttryckligen att tiotusentals animationer ska kunna produceras **utan ytterligare ekonomiska kostnader** utöver Claude-sessionerna.
2. **Statisk webbapp** på GitHub Pages: ingen backend, inga API-nycklar, inga hemligheter i klienten, ingen falsk "Spara till GitHub"-knapp.
3. **Lokal användning:** redigera och förhandsgranska i webbläsaren, import/export som filer.
4. **Separat från Swechan.** Verktyget får läsa Swechans publika repo för att hämta `senseId` och ordlistor, men ändrar inget där.
5. **Förutsägbarhet:** samma scen + samma `t` + samma resursversion ⇒ samma bild. Ingen `Math.random()` utan seed, inget externt innehåll vid uppspelning, inga typsnittsberoenden i själva animationen (text i scener bara som valfri etikett ovanpå).
6. **Mobil först:** iPhone Safari, `prefers-reduced-motion`, paus/repris, meningsfull stillbild.
7. **Inga vilseledande kvalitetslöften:** automatiska tester hittar tekniska fel, inte betydelsefel. `reviewStatus: reviewed` sätts bara av en människa.
8. **Nytt:** **Claude ska kunna se resultatet.** Varje kommando som skapar eller ändrar en scen ska kunna producera en bildremsa (PNG) som Claude granskar innan scenen rapporteras som klar.

---

## 4. Swechan-fakta som styr designen (kontrollerade i koden 2026-11-05)

Läs i Swechan, i denna ordning: `PROJECT_STATUS.md`, `ARCHITECTURE.md`, `CONTENT_GUIDELINES.md` (särskilt "Bilder på orden (0.6)"), `DATA_MODEL.md`, `CLAUDE.md`, `CHANGELOG.md` (0.5–0.6). Verifiera nedanstående mot aktuell `main` – Swechan utvecklas snabbt.

**Teknik och versioner (matcha dem, så att spelaren kan flyttas in utan friktion):** React 19.1, TypeScript 5.8, Vite 6.3 (`base: './'`, hash-router, `manualChunks` för vendor/content), Zod 3.25, Vitest 3.2 (jsdom), Node 22 i CI, Playwright 1.63 installerad globalt i CI och i molnmiljön (`/opt/node22/lib/node_modules/playwright`), e2e med iPhone 13-emulering i Chromium. CLI-skript körs med `vite-node` från `scripts/cli/`, logiken ligger testbar i `src/.../tools/`. CI: `typecheck`, `test`, `build`, Pages-deploy från `main`; e2e som separat, icke-blockerande jobb.

**Grafik i dag:** `src/ui/wordArt/kit.ts` – SVG-strängar på en `viewBox="0 0 120 120"`, pappersbakgrund `#f6f2ea` med `rx=18`, en bläckfärg `#2b2a33`, linjebredd 2.2, runda linjeavslut, paletten `C` (skin `#f1c7a1`, navy `#2f4a7a`, denim `#3f6fb5`, sky `#8cc7e8`, red `#d64545`, green `#4f9d69`, yellow `#f2c14e`, orange `#ef8a3c`, accent `#e4572e` …). `person()` är en **stel helbild** (inga leder) – det är just det som ska ersättas. Designsystemet "Fjord" i `src/ui/styles/tokens.css` (Manrope, `--c-primary #2a5bd7`, `--c-accent #ffd54a`, 4 px-skala) gäller för studions eget UI om du vill likna Swechan, men **animationernas palett är wordArt-paletten**, inte Fjord.

**Hur bilder visas i Swechan:** `src/ui/components/WordImage.tsx` renderar inline-SVG (lat laddad egen chunk via `import('../wordArt/render')`) i en kvadrat: ordintroduktion 180 px (`WordIntro.tsx`), bildfråga 200 px, bildalternativ 140 px, stavning 150 px (`ExerciseView.tsx`). CSS: `.word-image { border-radius:16px; background:#f6f2ea }`. **Spelaren ska passa i exakt den platsen** (kvadrat, 120×120-koordinater, samma hörnradie och bakgrund).

**Rörelseinställning:** `settings.reducedMotion: 'system' | 'reduce' | 'full'` sätter klasserna `html.reduce-motion` / `html.full-motion`; `global.css` stänger av alla CSS-animationer under `prefers-reduced-motion` om inte `full-motion`. Spelaren ska respektera både mediefrågan och dessa klasser (visa posterbild + "Spela"-knapp).

**Bildregister och övningsregler:** `src/content/images.ts` – `imageFor`, `quizImageFor`, `imageDistractorAllowed(target, candidate)` (båda `quiz`, olika `group`, ingen deklarerad förväxling åt något håll). Testerna i `src/content/images.test.ts` genererar varje bildövning med flera slumpfrön. Alla dessa regler ska gälla oförändrat för animationers posterbilder.

**Identiteter:** `senseId = s.<lemma>.<n>` (mellanslag → bindestreck, t.ex. `s.ta-på-sig.1`), permanenta. Ordboken 2026-11-05: 1 695 uppslagsord, varav **1 168 substantiv, 273 verb, 229 adjektiv**, 22 fraser, 2 adverb, 1 preposition; allt `ai-draft`. Moduler har 15–20 ord; 110 publicerade moduler i Mat & måltider, Hem & boende och Kläder & personlig stil; katalogen planerar 2 016 moduler. Räkna alltså med i storleksordningen **5 000–8 000 verb/adjektiv/abstraktioner** på sikt – det är "tiotusentals" när varianter och kontrastpar räknas in.

**Laddning:** Swechan laddar lektioner lat per modul (`moduleIndex.json` + `loadModuleBody`), förladdar för offline via service worker (cache-namn versioneras, `swechan-v7` i 0.6). Animationer måste kunna följa samma mönster: ett litet index ivrigt, varje animation (eller modulens animationer) som egen lat del.

---

## 5. Designprinciper för verktyget

1. **Data, inte kod, per ord.** Ett ord = en JSON-scen som kombinerar byggblock. Ingen ny TypeScript-fil per ord (0.6:s `motifs.ts` med en handskriven SVG per ord skalar inte och går inte att validera).
2. **Semantiska handlingar.** Scenen säger `pour`, inte "rotera 40°, flytta ellips". Kompilatorn översätter till rörelser, föremålstillstånd och orsak–verkan. Det gör scener korta, läsbara för Claude och konsekventa mellan ord.
3. **Riggad figur med leder.** Huvud, bål, överarm/underarm/hand ×2, lår/underben/fot ×2, med pivotpunkter och begränsade vinklar. Ansiktet (ögon öppna/slutna/halvslutna, ögonbryn, mun) är en förstaklassens kanal – det är skillnaden mellan *slappa* och *sova*.
4. **Ren renderingsfunktion.** `renderFrame(compiledScene, tMs) → FrameTree` är en ren funktion utan DOM, körbar i Node/Vitest. React-spelaren och Node-exporten ritar samma träd. Determinism och tester följer av det.
5. **Kontrastpar är en primitiv.** En scen kan deklarera `contrastWith: "anim.sova.1"`; studion och CLI visar paren sida vid sida; testet kräver att de skiljer sig i minst en deklarerad "distinctive feature".
6. **Claude ser vad den gör.** Bildremsor, jämförelseark och posterbilder genereras som PNG med Playwright (redan tillgängligt) och granskas i sessionen innan något rapporteras klart.
7. **Liten egen motor, utbytbar renderare.** Ingen PixiJS/Rive/GSAP i första versionen. Tidslinje och easing skrivs själva (några hundra rader), renderas till SVG. Om mätningar visar behov kan Canvas läggas bakom samma `FrameTree`.
8. **Allt versioneras:** schema (`schemaVersion`), resursbibliotek (`assetsVersion`), rörelsebibliotek (`motionsVersion`). En scen refererar versioner; migreringar är kod med tester.

---

## 6. Arkitektur

### 6.1 Moduler

```
src/
  schema/      Zod-scheman + TS-typer för scen, resurser, rörelser, register; migreringar
  engine/      tidslinje, easing, interpolation, rigg (forward kinematics), renderFrame, FrameTree
  assets/      figurer (rigg + utseendevarianter), föremål med tillstånd, miljöer, palett
  motions/     parametriska rörelsegeneratorer (gå, springa, hoppa, sträcka, gripa, hälla, …)
  actions/     semantiska handlingar → rörelser + föremålsändringar + följder (compileAction)
  compiler/    validateScene, compileScene (scen → tidslinjer), layoutkontroller (utsnitt, överlapp)
  player/      React: <ScenePlayer>, <Poster>, kontroller, reduce-motion, lazy loading   ← flyttas till Swechan
  studio/      React: galleri, editor, filmstrip, jämförelse, granskningskö, import/export
  export/      SVG-sträng per bildruta, bildremsor, Swechan-paket (index + per-animation-filer)
  tools/       logik bakom CLI-kommandona (testbar, importeras aldrig av player/studio)
scenes/        scen-JSON, en fil per animation: scenes/<lemma>/<animationId>.json
registry/      senseId → animationId-mappning, granskningsstatus, kontrastpar
scripts/cli/   tunna vite-node-skript (som i Swechan)
tests/         enhets-, determinism-, layout- och skärmbildstester
docs/          STYLE_GUIDE.md, SCENE_FORMAT.md, ARCHITECTURE.md, ROADMAP.md, CHANGELOG.md, REVIEW_LOG.md
```

`player/` får bara bero på `schema/`, `engine/`, `assets/`, `motions/`, `actions/`, `compiler/` och React – ingenting från `studio/`, `export/` eller `tools/`. Ett test ska bevaka beroenderiktningen.

### 6.2 Dataflöde

```
scene.json ──validate──► Scene ──compile──► CompiledScene { tracks, duration, poster, layers }
                                               │
                        renderFrame(compiled, t) ─► FrameTree (noder: group/path/circle/… med transform, fill, opacity)
                                               │
                  ┌────────────────────────────┼─────────────────────────────┐
             React-spelare (SVG-DOM,      SVG-sträng (Node: poster,    Layoutkontroller (bbox, utsnitt,
             rAF, paus, scrub)            kontaktark, bildremsor)      markövergång, överlapp)
```

### 6.3 Motor (`engine/`)

- **Tid:** millisekunder, heltal. Scenens `durationMs`; `loop: true|false`; `holdMs` i slutet innan omstart.
- **Spår (tracks):** varje animerbar egenskap (ledvinkel, position, skala, opacitet, föremålsparameter som `fill 0..1`) har en lista nyckelbilder `{ t, value, ease }`. Interpolation linjär/kubisk med namngivna easings (`linear`, `easeInOut`, `easeOut`, `bounce`, `anticipate`). Stegvisa värden för diskreta tillstånd (`eyes: open|closed`).
- **Rigg:** träd av leder med pivot i föräldrakoordinater; forward kinematics ger världsmatriser. Vinkelgränser per led (ingen arm genom kroppen). Spegling (`facing: left|right`) sker på riggnivå, inte genom att rita om.
- **Sekvensering:** `seq([...])`, `par([...])`, `wait(ms)`, `repeat(n)`, `hold()` – kompileras till absoluta nyckelbilder. Inga callbacks eller körbar kod i scenen.
- **FrameTree:** ett litet, serialiserbart träd. Renderaren (React/SVG-sträng) är ~100 rader var.
- **Prestanda:** React-spelaren uppdaterar transformer via `requestAnimationFrame`, pausar när `IntersectionObserver` säger att elementet är utom synhåll, och när fliken är dold. Mål: en animation ≤ ~150 SVG-noder; mät på iPhone-emulering (`npm run anim:perf`), lova inte 60 fps.

### 6.4 Figur och resurser (`assets/`)

- **En grundfigur** (`character.base`) i bilderboksproportioner (≈ 4 huvuden hög på 120-duken, stora ögon, mjuka former) med varianter för hår, hud- och klädfärg. Högst 3–4 återkommande "personer" med neutrala namnlösa ID:n (`character.base.a/b/c`). Inga stereotyper; variation i hudton och hår ska vara självklar och odramatisk.
- **Ansikte:** ögon (`open | half | closed | wide`), ögonbryn (`neutral | up | down | asym`), mun (`neutral | smile | open | o | line`), kinder (rodnad på/av), blickriktning. Allt som spår.
- **Händer:** öppen, greppande, pekande; kan fästa föremål (`attach: { prop: 'glass', hand: 'right' }`).
- **Föremål med tillstånd:** glas (`fill`), kanna (`tilt`, `stream`), dörr (`angle`), låda (`lidOpen`), lampa (`on`), kran (`flow`), kastrull (`bubbles`), stekpanna (`sizzle`, `browning 0..1`), tyg (`wrinkles`), äpple (`ripeness`), soffa, säng, bord, stol, väska, telefon, kopp. Varje föremål = ritfunktion av sina parametrar + ankare (var en hand greppar, var innehåll syns).
- **Miljöer:** några lager (bakgrund, markplan, förgrund) i låg kontrast: `room`, `kitchen`, `bedroom`, `outdoors.park`, `street`, `bathroom`, `neutral`. Tid på dygnet (`day | evening | night`) som ljusvariant – viktigt för *slappa* (dag) vs *sova* (natt).
- **Palett:** importera wordArt-paletten som `palette.ts`; ändra den bara via STYLE_GUIDE-beslut.

### 6.5 Rörelser (`motions/`)

Parametriska generatorer som returnerar spår för en rigg: `idle(breath)`, `walk(speed, strideLen)`, `run(speed)`, `jump(height, anticipationMs)`, `sitDown`, `lieDown`, `reach(target)`, `grasp/release`, `carry(prop)`, `pour(from, to, amount)`, `open/close(prop)`, `push/pull`, `lookAt(target)`, `nod`, `shake`, `shiver`, `stretch`, `wipe`, `stir`, `whisk`, `chop(rhythm)`, `fold`, `turn(facing)`, `fall`, `react(emotion)`. Varje rörelse har en dokumenterad parameteryta, standardvärden och en **testbild** (bildremsa) i `docs/motions/`.

Rörelser ska gå att **blanda** (gå + bära; stå + röra i gryta + titta ner) och **kedja** med övergångar som motorn interpolerar.

### 6.6 Semantiska handlingar (`actions/`)

En handling är det Claude skriver i scenen. Kompilatorn omsätter den till rörelser + föremålstillstånd + följd:

| Handling | Rörelse | Föremål/följd | Pedagogisk kärna |
|---|---|---|---|
| `pour { from, into, amount }` | `reach`, `grasp`, `pour` | `from.tilt↑`, `stream` synlig, `into.fill↑` | kärl lutar → vätska → glaset fylls |
| `open { prop }` | `reach`, `pull/turn` | `prop.angle/lidOpen` | handen orsakar öppningen |
| `run { from, to }` | `run` | markdamm/rörelsestreck sparsamt | tempo och steglängd skiljer från `walk` |
| `jump { over? }` | `jump` | föremål under | anticipation, luft, landning |
| `placeBehind { prop, ref }` | `carry`, `release` | djupordning byts, delvis skymning | relationen etableras i tid, slutläget hålls |
| `relax { on }` | `sitDown/lieDown` + `idle`, ögon öppna, fot vickar, telefon/kopp | dagsljus | vaken, lugn, aktiv i låg grad |
| `sleep { on }` | `lieDown`, ögon slutna, långsam andning | nattljus, täcke | sovande – kontrast till `relax` |
| `exercise { kind: jog|stretch|kickups }` | motsvarande cykler; kickups = boll i parabel mot knät | sportkläder, svettband, boll | *sportig* som aktivitet, helst i kontrast mot en vardaglig figur i samma scen |
| `chop`, `stir`, `whisk`, `knead`, `peel`, `grate` | rytmiska cykler | råvaran ändrar form | matlagningsverben i Swechan |
| `express { emotion, cause? }` | `react`, hållning, blick | utlösaren visas | känsla med orsak |

Listan växer ämnesvis (avsnitt 12). En handling ska aldrig implementeras som en ren förflyttning av en stel figur.

### 6.7 Stillbildsläge

En scen med `durationMs: 0` (eller en begäran om `posterMs`) renderas som stillbild via exakt samma pipeline. Det gör att **bilder (typ 2) och symboler (typ 3)** senare kan produceras av samma verktyg med samma figur och palett, och att en animations posterbild automatiskt är konsekvent med uppspelningen. Prioritera inte stillbilder förrän fas 3, men bygg inget som hindrar dem.

### 6.8 Export (`export/`)

- **Scen-JSON** är källan (versionerad i git).
- **Swechan-paket:** `dist/swechan/animations.index.json` (animationId, senseId, kind, quiz, group, confusableWith, posterMs, bytes, hash) + `dist/swechan/anim/<animationId>.json` (kompilerad eller rå scen – välj rå scen + kompilera i klienten om kompilatorn är liten; mät). Posterbild som SVG-sträng i indexet eller separat fil.
- **Granskningsmaterial:** bildremsa PNG per animation (`review/strips/`), jämförelseark för kontrastpar, kontaktark HTML.
- Ingen GIF/video-export (kräver beroenden, inte nödvändigt för Swechan).

---

## 7. Scenformat (kontrakt för AI-produktion)

Definiera `scene.schema.json` + Zod + TS-typer och dokumentera i `SCENE_FORMAT.md`. Utgå från detta och färdigställ innan storskalig produktion:

```json
{
  "schemaVersion": 1,
  "assetsVersion": 1,
  "motionsVersion": 1,
  "animationId": "anim.slappa.1",
  "senseId": "s.slappa.1",
  "titleSv": "slappa",
  "meaningHint": "Vila vaken och avslappnat utan att göra något särskilt",
  "category": "state",
  "visualType": "animation",
  "durationMs": 4000,
  "loop": true,
  "holdMs": 400,
  "posterMs": 2200,
  "canvas": { "w": 120, "h": 120 },
  "environment": { "id": "room", "time": "day" },
  "actors": [
    { "id": "p", "asset": "character.base.a", "at": { "x": 60, "y": 96 }, "facing": "left",
      "wardrobe": { "top": "tshirt.green", "bottom": "sweatpants.grey" } }
  ],
  "props": [
    { "id": "sofa", "asset": "sofa.basic", "at": { "x": 60, "y": 100 } },
    { "id": "mug", "asset": "mug", "attachTo": { "actor": "p", "hand": "right" } }
  ],
  "timeline": [
    { "t": 0, "action": "relax", "actor": "p", "on": "sofa", "legsUp": true },
    { "t": 600, "action": "lookAt", "actor": "p", "target": "mug" },
    { "t": 1200, "action": "sip", "actor": "p", "prop": "mug" },
    { "t": 2400, "action": "idleFootWiggle", "actor": "p", "until": 4000 }
  ],
  "focus": { "actors": ["p"], "feature": "eyes-open-relaxed" },
  "contrast": {
    "with": ["anim.sova.1"],
    "distinctiveFeatures": ["eyes:open", "environment.time:day", "prop:mug", "posture:reclined-not-lying"]
  },
  "pedagogy": { "quizEligible": false, "group": "vila", "confusableWith": ["s.sova.1", "s.slappna-av.1"], "reviewStatus": "ai-draft" },
  "label": { "showSv": "optional" }
}
```

Krav på formatet:

- Separera **betydelse** (`senseId`, `meaningHint`, `category`), **scen** (aktörer, föremål, miljö), **tidslinje** (handlingar) och **pedagogik/granskning**.
- Koordinater i dukens enheter (0–120, origo uppe till vänster, markplan ≈ y 96–104). Validera rimlighet (inom duken + marginal, inga negativa tider, `posterMs ≤ durationMs`).
- Handlingarna är en **sluten uppsättning** (Zod discriminated union) med typade parametrar. Okänd handling/resurs/aktör = fel med radnummer och förslag.
- `contrast.distinctiveFeatures` är **maskinläsbara** påståenden som kompilatorn kan kontrollera mot den kompilerade scenen (t.ex. att ögonspåret är `open` under ≥ 80 % av tiden, att miljön har `time: day`). Minst en skillnad per kontrastpar är ett testkrav.
- `reviewStatus: reviewed` kräver `reviewer` och `date` (som i Swechan) och sätts aldrig av AI.
- Ingen `eval`, ingen fri SVG/HTML i scener, inga URL:er. Text bara via `label`.
- Versionsfält + `migrations/` med tester; gamla scener måste fortsätta kompilera.
- ID-konvention: `anim.<lemma-slug>.<n>` där `<n>` följer `senseId`:s nummer; varianter av samma betydelse `anim.<lemma>.<n>.v2`. Aldrig återanvänd ett ID för ett annat innehåll.

---

## 8. Visuell och pedagogisk kvalitetsstandard

Skriv `STYLE_GUIDE.md` med skärmbilder. Minimum:

- **Stil:** vänlig modern bilderbok, en bläckkontur (2.2 på 120-duken), mjuka runda former, platta färger med högst en skuggton per yta, pappersbakgrund. Samma figur, samma linje, samma tempo i hela biblioteket.
- **Tempo:** en handling ska gå att läsa på 2–4 s; loopar 3–6 s; alltid en kort anticipation före en rörelse och ett tydligt slutläge med `hold`. Inget blinkande, inga partiklar annat än sparsamma rörelsestreck.
- **Läsbarhet på 180 px:** detaljer som bär betydelsen ska vara ≥ 6 dukenheter. Testa posterbilden i 140 px (bildalternativ).
- **Fokus:** ett motiv, en handling, ett föremål som förändras. Miljöer i låg kontrast. Ingen dekor som inte bidrar.
- **Ansikte och hållning** bär tillstånd och känslor; symboler (zzz, hjärtan, stjärnor, pilar) används bara som *förstärkning* av något som redan syns, aldrig som ensam bärare.
- **Kontrastpar:** varje verb/adjektiv/abstraktion med en uppenbar granne (*slappa/sova*, *springa/gå*, *hälla/spilla*, *öppna/stänga*, *bakom/framför*, *koka/sjuda/steka*, *vispa/röra*, *mätt/hungrig*) designas mot grannen och granskas sida vid sida. Testa **utan etikett**: kan en betraktare som inte kan svenska säga vilket av paren som visas?
- **Kulturell överförbarhet Sverige ↔ Japan:** inga gester, matvaror eller symboler som bara en av kulturerna läser rätt (undvik t.ex. tummen upp som enda budskapsbärare, avoid västerländska djurmetaforer).
- **Känslor:** uttryck via ögon, bryn, mun, axlar och tempo; alltid med en utlösare i bild; inga överdrivna stereotyper.

**Första acceptanstest (byggs i fas 1):** de tre fallen från 1.2 – *slappa* (mot *sova*), *sportig* (som rörelse) – plus v1-orden *springa, hoppa, öppna, hälla, bakom*. Produktägaren ska kunna säga vad varje animation betyder utan etikett.

---

## 9. Claude-arbetsflöde och CLI

### 9.1 Principer

- Allt som en människa gör med musen i studion ska gå att göra som kommando. Kommandona är idempotenta, ger maskinläsbara fel (JSON med `--json`) och kräver inget nätverk.
- **Inget rapporteras klart utan bildremsa.** Rutinen för varje ny scen: `anim:new --template <familj>` → redigera JSON → `anim:validate` → `anim:strip` → **titta på PNG:n** → vid kontrastpar `anim:compare` → justera → `anim:validate` → uppdatera `REVIEW_LOG.md`.
- **Tre grindar som gör rätt utan produktägaren** (införda 2026-11-05 efter att fyra av åtta första scener var semantiskt fel trots grön validering):
  1. **Mall med kontrakt.** Varje ordscen anger `template` (en begreppsfamilj i `src/compiler/templates.ts`: locomotion, manipulate-prop, relation-arrow, property-contrast, emotion, state, event, ui). Validatorn kontrollerar mallens kontrakt (t.ex. att relation-arrow saknar människor, har pil och japanskt ord). Produktägaren godkänner mallar, inte ord, i `registry/templates.json`; ogodkänd mall ger varning. Ett ord som inte passar någon mall får **ingen visualisering** tills en mall finns och är godkänd – hitta inte på en egen komposition.
  2. **Plan före produktion.** `anim:plan --swechan <klon> --module m.x` skriver `registry/plan/<modul>.md`: en rad per ord med typ, mall, kontrastkandidater, japanskt ord och säkerhet. Rader med låg säkerhet beslutas (av Claude med motivering i planen, eller av produktägaren) innan scener skapas.
  3. **Blindtest.** `anim:blindtest make <ids|--all> --batch <namn>` skriver omärkta remsor + frågor; **en separat granskare** (ny session eller subagent som bara får PNG:n och frågefilen, aldrig scenfilerna eller facit) svarar vad varje remsa betyder och väljer bland ordet, dess kontrastpartner och distraktorer (deklarerade `confusableWith`-synonymer erbjuds inte – bildfrågorna gör det inte heller); `anim:blindtest grade <batch> <svar.json>` registrerar resultatet i `registry/blind.json`. En scen utan godkänt blindtest räknas inte som klar; `reviewStatus: validated` kräver det. Blindtestet upprepas efter varje ändring som påverkar betydelsen.
- **Japanskt ord i posterbilden:** om en scen är `quizEligible` får posterbilden inte visa japansk text (det avslöjar svaret i bildfrågor) – validatorn stoppar det. Välj `posterMs` före panelen eller sätt `quizEligible: false`.
- Batchar arbetar ämnesvis (en Swechan-modul eller ämnesgrupp åt gången), med en rapport över utkast / tekniskt validerade / mänskligt granskade.

### 9.2 Kommandon (npm-skript; namn får justeras om de dokumenteras)

```bash
npm run anim:plan -- --swechan ../swechan --module m.steka-och-bryna   # typ (animation/bild/symbol/none), mall, kontrastkandidater, japanskt ord, säkerhet per ord → registry/plan/<modul>.json + .md
npm run anim:blindtest -- make --all --batch b1                         # omärkta remsor + frågor för en oberoende granskare (facit göms i review/blind/)
npm run anim:blindtest -- grade b1 svar.json                            # rättar och registrerar i registry/blind.json
npm run anim:new -- s.slappa.1 --template relax --contrast anim.sova.1  # skapar scenes/slappa/anim.slappa.1.json från mall
npm run anim:validate [-- scenes/slappa/*.json] [--json]                # schema, referenser, tider, utsnitt, kontrastkrav, dubbletter
npm run anim:strip -- anim.slappa.1 [--frames 8] [--size 180] [--label] # PNG-bildremsa i review/strips/ (Playwright)
npm run anim:compare -- anim.slappa.1 anim.sova.1                        # remsor under varandra + posterbilder bredvid varandra
npm run anim:poster -- anim.slappa.1                                     # SVG/PNG av posterMs i 180 och 140 px
npm run anim:sheet [-- --module m.steka-och-bryna]                       # HTML-kontaktark med posterbilder + remsor
npm run anim:perf                                                         # bildfrekvens/CPU i Chromium med iPhone-emulering, skriver docs/perf.md
npm run anim:batch -- registry/plan/m-steka-och-bryna.json               # skapar saknade utkast från mallar, validerar, genererar remsor, rapport
npm run anim:report                                                       # antal per status, saknade kontrastpar, ord utan visualisering
npm run anim:export                                                       # Swechan-paket till dist/swechan/
npm run anim:preview -- anim.slappa.1                                      # öppnar studion på scenen (dev-server) – för produktägaren
```

`anim:plan` läser Swechans `src/content/data/dictionary/*.json` och `modules/*.json` **från en lokal klon** (sökväg som argument); verktyget får inte bero på nätverk i körning.

### 9.3 Mallar

`src/compiler/templates.ts` innehåller begreppsfamiljerna med beskrivning, **kontrakt** (maskinkontrollerade krav) och en komplett, validerad startscen: `locomotion`, `manipulate-prop`, `relation-arrow`, `property-contrast`, `emotion`, `state`, `event`, `ui`. Claude byter föremål, parametrar och kontrast – aldrig familjens grundidé. Nya familjer (t.ex. `cook-rhythm` när matlagningsföremålen finns) läggs till med kontrakt, startscen, test och remsa, och godkänns av produktägaren innan de används i produktion. Det är så "semantiskt välgrundade kombinationer" skalar.

---

## 10. Webbstudion

Liten men fungerande, mobilvänlig, på svenska:

- **Galleri** med sökning på `animationId`, `senseId`, titel, kategori, status och modul; filter "saknar kontrastpar", "ej granskad".
- **Spelare** med spela/pausa, repris, hastighet 0.25–2×, tidslinjeskrapning, hopp till `posterMs`, etikett på/av, 180/140 px-förhandsvisning och "iPhone-ram".
- **Bildremsa** (8–12 rutor) under spelaren – samma som CLI genererar.
- **Jämförelse**: två animationer synkroniserade sida vid sida (kontrastpar).
- **Editor**: JSON med live-validering och begripliga fel; strukturerat formulär för de vanligaste fälten (aktör, föremål, miljö, handlingsparametrar, tider); ångra/gör om.
- **Import/export** av en eller flera scener som filer; export av Swechan-paket; ingen "spara till GitHub".
- **Granskningskö**: lista över `ai-draft` → "Tekniskt OK" → knapp "Markera som granskad" som skriver `reviewer`/`date` i den exporterade filen (människa).
- Status synligt överallt: *utkast*, *validerad*, *granskad*.
- Lokal lagring (IndexedDB/localStorage) endast som arbetskopia med tydlig "Exportera säkerhetskopia".

Alla reglage ska fungera. Inga knappar utan funktion.

---

## 11. Swechan-integration (kontrakt, levereras i fas 3, införs i Swechan i separat uppdrag)

Målbild i Swechan:

```tsx
<WordVisual senseId="s.slappa.1" size={180} />        // väljer animation/bild/symbol via registret
<WordAnimation animationId="anim.slappa.1" autoplay={false} size={180} />
```

- **Spelarpaket:** mappen `src/player/` + dess beroenden kopieras till Swechan som `src/ui/anim/` (eller publiceras som tarball i releases). Noll externa beroenden utöver React. Kompilator + motor ≤ ~15 kB gzip – mät.
- **Register:** föreslå att `wordImages.json` utvecklas till `wordVisuals.json` med `kind: animation | illustration | symbol | photo(utfasas)`, `animationId` för animationer, befintliga fält oförändrade. `imageFor` → `visualFor`; `imageDistractorAllowed` oförändrad (gäller posterbild). Migrering utan att något befintligt `senseId` eller motiv-ID ändras.
- **Laddning:** `animations.index.json` i startpaketet (små poster), varje animation som egen lat del via `import.meta.glob` eller `fetch` av statiska filer, förladdning tillsammans med lektionen (service worker), versionerad cache.
- **Var animationer visas:** ordintroduktion (autoplay en gång, sedan repris-knapp; under reduce-motion bara poster + knapp), bildfrågor och bildalternativ visar **posterbilden** (aldrig uppspelning i flerval – lika villkor för alternativen), stavning visar poster. Aldrig i luckmeningar, böjning eller japanska → svenska (som i 0.6).
- **Fallback:** finns ingen animation används befintlig wordArt-bild; finns ingen bild visas inget. Ingen påverkan på FSRS, streak, daglig session eller sparad progression.
- Dokumentera integrationen i `docs/SWECHAN_INTEGRATION.md` med exakt fil-lista, steg och tester som ska läggas till i Swechan.

---

## 12. Genomförandeordning med acceptanskriterier

**Fas 0 – Baslinje (kort).** Vite/React/TS-projekt, Vitest, Pages-workflow, README, ARCHITECTURE.md med beslut och risker. Dokumentera engångsinställningen: *Settings → Pages → Build and deployment → Source: GitHub Actions*. Påstå inte att Pages är aktivt utan verifiering. Kopiera wordArt-paletten. Inga onödiga beroenden (lista och motivera varje).

**Fas 1 – Motor, rigg, fem + två animationer.**
- Schema v1, kompilator, motor, FrameTree, React-spelare, SVG-strängrenderare, `anim:new/validate/strip/compare/poster/sheet`.
- Grundfigur med leder och ansikte; föremål: glas, kanna, dörr, låda, soffa, säng, telefon/kopp; miljöer `room`, `bedroom`, `neutral`, `outdoors.park`; dag/natt.
- Animationer: **springa** (mot gå), **hoppa**, **öppna** (dörr; mot stänga), **hälla** (kanna → glas fylls), **bakom** (föremål placeras bakom låda) + **slappa** (mot **sova**) + **sportig** (jogg/stretch, mot vardaglig).
- Acceptans: `typecheck`, `test`, `build` gröna; determinismtest (`renderFrame` samma hash för samma `t`); layouttest (inget fokusobjekt utanför duken, fötter på marken); kontrasttest för slappa/sova; bildremsor och jämförelseark i `review/` granskade av Claude och bifogade i leveransrapporten; studion körs lokalt och i Pages-build; e2e i Chromium/iPhone-emulering spelar upp en scen, pausar, skrubbar och visar poster under `prefers-reduced-motion`.

**Fas 2 – Bibliotek, studio, 20 referensscener från Swechans ordbok.**
- Rörelse- och handlingsbibliotek enligt 6.5–6.6; mallar; full studio enligt 10; import/export; `anim:batch/report/perf`.
- Referensscener, valda för att täcka ordklasser och Swechans befintliga moduler (byt ut vid behov, men motivera): verb *skära, hacka, koka, sjuda, steka, bryna, vispa, röra, knåda, skala, diska, dammsuga, hänga upp, vika, knäppa / knäppa upp, dra upp / dra ner*; adjektiv/tillstånd *mogen/omogen, ren/smutsig, skrynklig, morgontrött, mätt*; relationer *framför, under, i, på*; känslor *arg, irriterad, upprörd*.
- Acceptans: ingen scen kräver egen TS-kod; varje scen har remsa + kontrastpar där det är relevant; studions alla kontroller testade; prestandamätning dokumenterad; `STYLE_GUIDE.md`, `SCENE_FORMAT.md` kompletta.

**Fas 3 – Skalbarhet och Swechan-kontrakt.**
- `anim:plan` mot Swechans ordbok; batchproduktion ämnesvis; lat laddning; versionerad spelare; `anim:export`; `docs/SWECHAN_INTEGRATION.md`; stillbildsläge (6.7) för posterbilder.
- Pilot: **100 semantiskt olika animationer** (t.ex. modulerna i *Matlagningens verb*, *Städning & underhåll*, *Sportiga vardagskläder*, *Att beskriva en outfit* samt känslo- och relationsord). Rapportera faktisk kvalitet, antal omtag, feltyper, tidsåtgång per scen, bytes per scen.
- Acceptans: produktägaren godkänner piloten i studion; rapporten är ärlig om vad som inte blev bra.

**Fas 4 – Produktion i större skala.** Först efter godkänd pilot. Ämnesgrupp för ämnesgrupp i katalogens ordning, automatiska kontroller + mänsklig urvalsgranskning, inga påståenden om "x tusen färdiga" baserade på kosmetiska varianter.

---

## 13. Tester, säkerhet, prestanda

Tester för: scenformat (giltiga/ogiltiga filer, migreringar), referenser och ID-dubbletter, tider/easing/looping, rigg (vinkelgränser, spegling), determinism (`renderFrame` hashas för t = 0, 25, 50, 75, 100 % för varje scen i `scenes/` – snapshot), layout (fokusobjekt i bild, markkontakt, inga lemmar genom kroppen i nyckelbilder), kontrastkrav (`distinctiveFeatures` uppfyllda), export/import rundtur, beroenderiktning, tillgänglighet (knappar med namn, tangentbord, `aria-label` = `titleSv`), reduce-motion, skärmbildsregression för referensscener (Playwright, Chromium, iPhone-emulering; WebKit när miljön tillåter – påstå inte iPhone-test annars), bundlestorlek för spelaren.

Säkerhet: scen-JSON är data – ingen `dangerouslySetInnerHTML` av scendata (React-spelaren bygger SVG-element från FrameTree; strängrenderaren escapar allt), inga URL:er i scener, filimport validerad med Zod och storleksgräns.

Prestanda: mät och dokumentera (frames/s, CPU-tid per bildruta, laddningsbytes) i `docs/perf.md`; optimera transform-baserade uppdateringar; stoppa rAF när inte synlig.

---

## 14. Arbetsdisciplin och rapportering

- **Börja med fas 1-kod**, inte med ännu en plan. Små steg med körbara tester; commit per avgränsat steg; funktionsgrenar + PR för större steg; `main` alltid byggbar.
- Före varje leverans: `npm run typecheck && npm test && npm run build`, plus e2e när UI finns. Lägg aldrig in betalda beroenden; förklara begränsningar i stället.
- Uppdatera `README.md`, `ARCHITECTURE.md` (ADR-logg som i Swechan), `ROADMAP.md`, `CHANGELOG.md`, `REVIEW_LOG.md` (per scen: datum, remsa, vad som ändrades och varför, kontrastpar, status).
- **Leveransrapport per etapp:** vad fungerar, testresultat (siffror), bildremsor för nya scener, begränsningar, var det granskas visuellt (Pages-URL eller `npm run dev`), nästa steg. Skriv aldrig att en animation "tydligt visar" något som du inte har tittat på i remsan.
- Språk: dokumentation och UI på svenska; kod, identifierare och commit-meddelanden på engelska.

**Framgångskriterium för första leveransen (fas 1):** produktägaren kan öppna studion (lokalt eller på Pages), spela upp sju animationer och säga vad de betyder utan etikett – inklusive att *slappa* inte längre ser ut som *sova* och att *sportig* ser sportigt ut – redigera en scen via validerad JSON, exportera den, se att en ny scen kan skapas via CLI med bildremsa, och se grön CI. Allt utan att registrera någon betaltjänst.

---

## Bilaga A – Ursprunglig specifikation (v1, 2026-11-05, bevarad för spårbarhet)

Nedanstående var innehållet i detta dokument före version 2. Där v1 och v2 skiljer sig gäller v2.

### A.Uppdrag

Utveckla **Animation_tool-** till ett kostnadsfritt, AI-vänligt verktyg för att skapa, redigera, förhandsgranska, kvalitetssäkra och exportera **pedagogiska 2D-animationer** som används i språkinlärningsappen **Swechan**. Verktyget ska främst illustrera ords **betydelse**: exempelvis *springa*, *hoppa*, *hälla*, *öppna*, *bakom*, *full*, *tom*, *långsamt* och *förvånad*. Prioritera pedagogiska animationer, inte gränssnittseffekter. Målet på sikt är **tiotusentals semantiskt meningsfulla animationer**, men detta är ett skalbarhetsmål – inte ett löfte om att enkla slumpmässiga kombinationer blir bra undervisningsmaterial. **Viktig produktprincip:** Verktyget ska vara lättare för Claude att styra via kod och strukturerad data än via musklick. Samtidigt ska produktägaren ha ett enkelt visuellt gränssnitt.

### A.1 Hårda krav
1. Inga nya löpande kostnader. 2. Statisk webbapp. 3. Lokal användning. 4. Separat från Swechan. 5. Förutsägbarhet. 6. Mobil först. 7. Inget vilseledande kvalitetslöfte. (Formulerade i avsnitt 3 ovan.)

### A.2 Förhållande till Swechan
Läs `PROJECT_STATUS.md`, `ARCHITECTURE.md`, `CONTENT_GUIDELINES.md`, `DATA_MODEL.md`, `CLAUDE.md`. Swechan har kodritade SVG-illustrationer i `src/ui/wordArt/` och `src/ui/art/`; `senseId` av formen `s.<lemma>.<n>`. Slå inte ihop stillbilder och animationer utan migrations- och kompatibilitetsplan; beakta `group`, `quiz`, `confusableWith`, `symbol`. Animationer är valfria innehållsresurser på betydelsenivå och får inte påverka repetitionsalgoritmen, streak eller progression.

### A.3 Teknik och arkitektur
TypeScript + React + Vite + SVG, deklarativa tidslinjer, Zod, Vitest. Lås inte projektet till PixiJS, Rive eller en stor motor. Dela upp i scene schema, asset library, motion library, scene compiler/validator, renderer/player, editor/gallery, CLI för Claude, Swechan-adapter. Figurer ska vara uppbyggda så att huvud, bål, armar och ben kan animeras och återanvändas.

### A.4 Scenformat
Illustrativt v1-exempel med `animationId`, `senseId`, `titleSv`, `meaningHint`, `category`, `durationMs`, `loop`, `scene.environment`, `scene.actors[].actions[]` (`motion`, `fromMs`, `toMs`, `from`, `to`), `focus`, `pedagogy { quizEligible, confusableWith, reviewStatus }`. Krav: separera betydelse/scen/resurser/rörelser; flera scenvarianter per betydelse med unika ID:n; stöd för position, skala, rotation, lagerordning, easing, tidslinjer, upprepning, väntan, övergångar, fokus och interaktion; semantiska handlingar; avvisa okända komponenter; ingen körbar kod; versionshantering; `reviewed` bara efter mänsklig granskning.

### A.5 Visuell och pedagogisk kvalitetsstandard
Genomarbetad, vänlig, modern 2D-bilderboksstil. Verb: handling + synlig följd. Rumsord: förhållande mellan minst två föremål. Adjektiv: egenskap eller kontrast. Substantiv: animerad användning eller betydelsebärande förändring. Känslor: begripliga uttryck utan stereotyper. Abstrakta ord: konkret, kulturellt begriplig scen eller avstå. Skillnaden mellan närliggande ord måste vara synlig. Testa med och utan etikett.

### A.6 Funktioner i webbstudion
Galleri med sökning; förhandsgranskning med spela/pausa/repris/hastighet/skrapning/stillbild; JSON-editor eller formulär med live-validering; val av figur/föremål/miljö/rörelse/färg/tid; import/export; kontaktark; mobilstorlek och utsnittskontroll; synlig status. Alla reglage ska fungera.

### A.7 Claude-arbetsflöde och massproduktion
`anim:new`, `anim:validate`, `anim:preview`, `anim:sheet`, `anim:batch`, `anim:export`. Validerat format och mallar, maskinläsbara fel, inget betalt API, körbart i GitHub Actions, batchar utan att allt laddas på iPhone, idempotens. Skala genom semantiskt välgrundade kombinationer; granskningskö och rapport.

### A.8 Tester, säkerhet och prestanda
Scenformat, determinism (`renderAt(t)`), tidsgränser/easing/ankare/lagerordning/loopning, utsnitt, import/export, dubbletter, tillgänglighet, reducerad rörelse, visuella regressioner, uppspelning i Chromium med mobilstorlek; WebKit när möjligt. Mät bildfrekvens och laddningskostnad i stället för att utlova 60 fps. Lat laddning. Alltid meningsfull stillbild.

### A.9 Integration i Swechan
Återanvändbart player-API (`<WordAnimation senseId="s.springa.1" autoplay={false} />` som målexempel), export/import av publicerade animationer, mappning `senseId` → `animationId`, kopiera inte editorn till Swechan, fallback till befintliga ordbilder, följ bildquizreglerna. Ingen ändring i Swechan innan spelaren och formatet är stabila och integrationen efterfrågats.

### A.10 Repositorystruktur
`README.md`, `CLAUDE.md`, `ARCHITECTURE.md`, `SCENE_FORMAT.md`, `STYLE_GUIDE.md`, `ROADMAP.md`, `CHANGELOG.md`, `src/{engine,schema,assets,motions,scenes,editor,player}`, `scripts/`, `tests/`, `.github/workflows/`.

### A.11 Genomförandeordning
Fas 0 baslinje; Fas 1 MVP med fem animationer (*springa, hoppa, öppna, hälla, bakom*); Fas 2 återanvändbarhet och studio med 20 referensscener; Fas 3 skalbarhet och Swechan-kontrakt med 100-pilot; Fas 4 produktion i större skala efter godkänd pilot.

### A.12 Arbetsdisciplin
Börja implementera fas 1; `typecheck`, `test`, `build` före leverans; uppdatera dokumentation; håll `main` fungerande; Pages-workflow med korrekta relativa sökvägar; förklara begränsningar i stället för betalda beroenden; avsluta varje etapp med statusrapport. Framgångskriterium: öppna studio, spela upp fem animationer, redigera via validerad data, exportera, skapa en till via CLI, grön CI – utan betaltjänst.
