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

## 0.1.1 – 2026-11-05 (fysik efter produktägarens granskning)
- **Fötter glider inte längre.** Ny gångmodell (`motions/gait`): fotplacering + ben-IK; stödfoten rör sig bakåt i exakt markhastighet, svängfoten i en båge. Gång- och löpparametrar (`GAITS`: steglängd, cykeltid, stödandel, flyglyft, lutning, armpendling). När duken inte räcker rullar världen (`env.scrollX`) med parallax (träd långsammare än buskar); fartstreck bakom figuren vid rullning.
- **Bålen hänger ihop:** bålen ritas som en fyrhörning mellan axellinje och höftlinje; nytt bäcken binder benen; främre armen ritas framför ansiktet.
- **Parabler:** hopp (anticipation → frånskjut → parabel → landningssquash) och boll (keepy-uppies).
- **Täcket** ligger ovanpå kroppen med puckel (`length`, `bulge`), armarna under; sovaren ligger lite högre på madrassen.
- **sportig** omgjord: kontrast i samma scen – en vardaglig person med mugg står stilla, en person i träningskläder med pannband gör keepy-uppies med fotboll (`exercise kickups`, prop `football`).
- Layoutkontrollen tar 13 prover per scen (fångade ett hopp som gick ur bild); `airborne` mäter höfter > 1 enhet; nya tester för icke-glidande fötter, parabel, täcke och boll.
- Kända rester: armarna i löpcykeln pendlar men ser stela ut i stillbild; ansiktet i profil; möbler är enkla.

## 0.1.2 – 2026-11-05 (effekter, föremål utan människor, stormning)
- **Effekter fästa vid figuren:** `zzz` utgår från munnen även när figuren ligger (kroppsrotationen räknas in), stiger kort och tonar ut, tre tecken; fartstreck pågår hela löpningen (spåret hålls konstant med stegeasing), fler och längre ju fortare världen rusar förbi; dammpuffar vid frånskjut och landning i hopp.
- **Scener utan människor:** ny handling `roll` (konstant retardation, rotation = sträcka/radie, rotation kring bollens mitt via `pivot` på föremål). *bakom* är omgjord: en boll rullar in bakom en låg låda och stannar delvis dold – ingen person, inget "lägga ner".
- **Nya föremål:** `ladder` (läggs ner/reses, `lean`), `castle` (mur med krenelering, torn, fana med färg, port som öppnas), `box` med `w`/`h`, boll med `r` och söm.
- **Ny handling `climb`:** figuren klättrar längs en rest stege med växelvisa arm- och bensteg och lutar in mot stegen.
- **anim.stormning.1:** tre anfallare rusar fram, stegen reses, två klättrar över muren (och försvinner bakom den), fanan byter färg, porten öppnas, den tredje rusar in. Kontrastpartner *belägring* saknas ännu.
- Tester: 40 (rullande boll, stormning, effekternas placering).

## 0.1.3 – 2026-11-05 (bakom med pil och 後ろ, stormning som inträngning + slagsmålsmoln)
- **bakom** är nu stillastående: en bågpil ritas över lådan till den delvis dolda bollen, det japanska ordet 後ろ tonar in, en nedåtpil markerar bollen. Produktägarens förslag: relationer behöver ingen rörelse som kan misstas för ett verb. Nya ikoner `arc-arrow`, `arrow-down`, `exclaim`.
- **stormning** omgjord: fyra soldater rusar fram, porten öppnas, de springer in och försvinner bakom muren, ett tecknat slagsmålsmoln (`brawl`: puffar, stjärnor, nävar, skakning via `phase`) stiger över murarna, fanan byter färg. Stegen och `climb` finns kvar som byggstenar.
- Tester 41.

## 0.1.4 – 2026-11-05 (text på vitt)
- Produktägarens regel: all text i ordscener ligger på vit bakgrund – `bg: pill` (standard), `bubble` (pratbubbla med `tail`), `panel` (vit panel som glider in från en kant; tweena `x`/`y` från utanför duken). Validatorn avvisar `bg: none` i ordscener; UI-scener får välja bort eftersom de har egna paneler. Etiketten är helvit. Breddberäkning tar hänsyn till CJK-tecken.
- *bakom*: 後ろ glider in på en vit panel från höger kant.
- Tester 44.

## 0.2.0 – 2026-11-05 (pålitlighet: mallar, plan, blindtest)
- **Mallar med kontrakt** (`src/compiler/templates.ts`): åtta begreppsfamiljer; varje ordscen anger `template`, validatorn kontrollerar kontraktet (nya `has:`-features: actors/props/entities-antal, action, icon, cjk-text, contrast). Godkännande per mall i `registry/templates.json` (bara produktägaren); ogodkänd mall → varning, saknad mall → varning, brutet kontrakt → fel.
- **anim:plan** läser en Swechan-modul från en lokal klon och skriver en plan per ord: typ, mall, kontrastkandidater (antonymer/near/synonymer i ordboken, confusableWith i bildregistret, samma ordklass i modulen), japanskt ord utan furigana och parenteser, säkerhet. Markdown för läsning, JSON för maskin.
- **anim:blindtest** (`make`/`grade`): omärkta remsor med bokstäver, frågefil med alternativ (ordet, kontrastpartner, förväxlingsord, distraktorer), dolt facit; rättning registreras i `registry/blind.json`. `anim:validate` varnar för scener utan blindtest, stoppar scener med underkänt test och kräver godkänt test för `validated`/`reviewed`. `anim:report` visar mallar, godkännanden och blindstatus.
- **Posterregel:** en `quizEligible`-scen får inte visa japansk text i posterbilden.
- Tester 48.

## 0.3.0 – 2026-11-05 (matlagningsbibliotek, speglingsfel rättat)
- **Ny begreppsfamilj `cook-rhythm`** (kontrakt: aktör, `pan`, `stove`, `cook|flip|splash`) med godkänd startscen. Planeraren föreslår den för steka, bryna, fräsa, smälta, vända, bränna, skvätta.
- **Nya föremål:** `stove` (platta som glöder, `heat`), `pan` (råvara `egg|pancake|butter|onion|steak`, `browning`, `top`, `burnt`, `melt`, `toss`, `sizzle`+`phase`, `splash`), `spatula`.
- **Nya handlingar:** `cook` (kind `fry|brown|sear|burn|melt`; hand på handtaget med IK som följer pannans skakningar, plattan tänds, fräsmärken, färgförändring; valfritt verktyg i andra handen), `flip` (stekspade lyfter och vänder, eller pannan kastar; stekta sidan blir synlig), `splash` (fettdroppar i parabler, figuren ryggar).
- **Scener (8):** steka, bryna, fräsa, smälta, vända, bränna, skvätta, gyllenbrun (kontrast utan människa, きつね色). Alla har godkänt blindtest.
- **stormning:** anfallarnas fana hissas på tornet (`castle.raise`, `banner`, `broken`); blindtest godkänt i b3.
- **Motorfel rättat:** vänstervända figurer speglades två gånger (rigg + renderare), så framåtriktade leder pekade bakåt. Alla scener med `facing: left` ser nu rätt ut; regressionstest tillagt. Snapshot av bildhashar uppdaterad avsiktligt.
- **Blindtest:** alternativen är ordet + kontrastpartner + distraktorer; deklarerade `confusableWith`-synonymer erbjuds inte (bildfrågorna gör det inte heller). Remsorna tar 12 rutor så korta händelser fångas. Resultat: b2 7/9, b3 1/3, b4 4/4 – alla 20 ordscener har nu minst ett godkänt blindtest.
- Tester: 53.
- **0.3.1:** experimentell mall `attribute-gloss` (egenskap buren av utseende + japanskt ord, utan verb) med `anim.sportig.1.v2`; garderob: `shorts`, `number`. Bollen i `kickups` längre fram. Normativ regel skrivs efter produktägarens dom.

## 0.4.0 – 2026-11-05 (generellt bibliotek: verktyg, processer, samtal, kläder)
- **Föremålsfamiljer** i egna filer med katalogblad (`anim:props`): `tool.*` (30), `container.*` (15), `food.*` (14), `fixture.*` (36), `garment.*` (6). Schemat tar vilket katalog-id som helst och föreslår närmaste vid stavfel. Klippning (`clip`) i båda renderarna för skivade råvaror.
- **Handlingar:** `use` (verktygsarbete med 19 rörelsemönster och tweenade följder; verktyget fästs automatiskt i närmaste hand), `say` (pratbubbla med ikon/text som följer huvudet, mun och bryn), `sound`, `give`, `put`, `take`, `dress`, `fasten`. Garderoben är animerbar (`<aktör>.w.<nyckel>`): hatt, glasögon, halsduk, knappar, dragkedja, ärmar, snören, förkläde, shorts, tröjnummer.
- **Mallar:** `tool-rhythm`, `process`, `communicate`, `social`, `dress-self` (alla ännu ej godkända i `registry/templates.json`).
- **Ikoner:** 67 kulturneutrala ikoner (fråga, mynt, klocka, lupp, våg, hus, nyckel, glödlampa, …) för bubblor, UI och gloss-scener.
- **Scener:** 53 nya (matberedning 10, processer 15, samtal/ljud 12, kläder 16) – 75 totalt. Blindtest b5 10/10, b6 15/15; b7/b8 pågår.
- **Fel rättade på vägen:** hållna föremåls ankare speglades fel åt vänster; prop-tillstånd som bara fanns som spår (t.ex. `tilt`) lästes aldrig; `rgb()`-färger kunde inte blandas; garderobsbyten syntes från t = 0 (startnyckel krävs).
- Tester: 61.

## 0.5.0 – 2026-11-05 (skalning: recept, täckning, batch, prestanda, Swechan-kontrakt)
- **`registry/recipes.json`** (293 recept: mall + handlingar + byggstenar per verb/fras) och **`anim:coverage`** mot Swechans ordbok (`registry/coverage.md`): 606 betydelser behöver animation, 502 redo, 59 klara, 21 blockerade av svaga recept, 2 utan recept.
- **`anim:batch`**: utkast för en hel modul från recepten med slot-fyllning (verktyg, råvara, yta, kokgrad, ikon, plagg, japansk gloss), validering, remsor och rapport i `registry/batch/`. Utkast är startpunkter, inte färdiga scener.
- **`anim:perf`**: uppspelning i Chromium med iPhone 13-emulering och 4× CPU-strypning – 60 fps, inga långa uppgifter; stormning har 182 SVG-noder (över riktvärdet 150). `docs/perf.md`.
- **`anim:package`**: spelarpaket för Swechan (`dist/player-package/anim/`, 30 filer, `WordVisual.tsx`, manifest). Spelare + motor utan React: 206 kB / 61 kB gzip – över målet 15 kB; åtgärd beskriven i `docs/SWECHAN_INTEGRATION.md`.
- **`docs/SWECHAN_INTEGRATION.md`**: fil-lista, åtta steg, register `wordVisuals.json`, laddning, tester. Swechan är inte rört.
- Scener: 75 (59 med godkänt blindtest; b7 11/13 → två rättade; b8 12/12). Tester: 61.

## 0.6.0 – 2026-11-05 (bärar-regeln: varje ordscen visar ett typexempel)
- **Orsak:** produktägaren fann att batch-utkasten för *vass*, *grov*, *halvera* och *skölja* var tomma eller fel (figur som säger ordet; morot i fyra delar; sköljning utan vatten). Rotorsaker: mallkontraktet för egenskaper krävde bara text, startscenen var tom, 285 adjektivrecept skrevs i bulk utan bärare, täckningen räknade dem som redo, utkasten blindtestades inte.
- **Normativ regel:** `docs/WORD_FUNCTIONS.md` – tabell *ordfunktion → mall → vad som bär betydelsen → text → förbjudet* för 21 funktioner, plus receptformatet. Pekare från CLAUDE.md §2.1, STYLE_GUIDE, SCENE_FORMAT, README.
- **Validatorn:** fel för ordscener utan bärare (`bearerOf`: föremål, ikon, klädseldetalj inkl. uttrycklig färg, kroppslig handling eller pratbubbla med ikon). Kontrakt: `attribute-gloss` och `property-contrast` kräver `has:bearer`; `manipulate-prop` tar `eat`; `tool-rhythm` ≥ 1 föremål; `social` = `give`; ny mall **`arrange`** (en person ställer/tar ett föremål: duka, packa, stapla, hänga upp – 25 recept + `anim.servera.1` flyttade dit; ej godkänd ännu).
- **Recept:** varje adjektiv har `bearer` (prop 102, ikon 128, smak 26, känsla 26, klädsel 23, kontrast 10, rörelse 5, person 1); verb har mallspecifika fält (verktyg, råvara, följd, grad, ikon). Nycklar per betydelse (`s.slö.1`) vinner över lemma. Svaga recept är märkta `TODO` och räknas som blockerade. 564 recept.
- **Byggare:** `anim:batch` komponerar hela scener av recepten (placering på bord/golv, skala per familj, gloss-bubbla med svans mot bäraren, kontrastkrav), i stället för att fylla luckor i en tom startscen.
- **Motor:** `scaleX/scaleY` med pivot (`px/py`) i både transform och bbox – stretch/wobble/bounce och bubblornas pop skalar nu kring sin egen punkt, inte kring origo. Schema: ikon-scener utan aktör/föremål tillåtna. Snapshot av bildhashar uppdaterad avsiktligt (22 scener, kontrollerade i remsor).
- **Verktygsarbete:** handen stannar bakom arbetspunkten med verktygets framåträckvidd (sin av lutningen), så bladet – inte skaftet – ligger över råvaran (skära, hacka, halvera, vispa kontrollerade i remsor). Halvor glider tydligt isär (`parts: 2`), slö kniv har synliga hack, `grov` visas mot *fin* på samma bord.
- **Batch:** kontrastpartner som skapas i samma körning länkas; `--force` uppdaterar scenen där den redan ligger i stället för att skriva en dubblett i ny mapp.
- **Blindtest:** b7 6/6 (vass, slö, grov, halvera, skölja, försiktig – granskaren påpekade att grov/slö/försiktig bars av glossen), b9 efter omarbetning 2/3 (grov och slö godkända, halvera underkänd: bladet låg bredvid äpplet), b10 efter handrättningen 2/2 men med låg säkerhet (kniven vid ansiktet, armen dolde äpplet) → hugg-lyftet sänkt till 6 enheter och runda råvaror (äpple, lök, potatis, tomat) ritas i 0,75 på brädan; b11 3/3 med säkerhet 4–5 (hacka, skära, halvera skiljs åt av tempo och resultatets form).
- **Tester (63):** varje recept bygger en scen som validerar (564/564); bärar-regeln avvisar person + text och godkänner kniv + glint.
- **Täckning (606 betydelser):** 52 klara med blindtest, 12 scener utan blindtest, 370 redo, 79 blockerade (svaga recept), 71 utan recept, 22 bild. Siffrorna är lägre än i 0.5.0 därför att de nu är ärliga.

## 0.6.1 – 2026-11-06 (gester, bugning, gångsätt – efter produktägarens granskning av ursäkta och försiktig)
- **Orsak:** *ursäkta* visade en hand-ikon som lästes som ett långfinger; *försiktig* var en figur som gick med en bricka. Rotorsaker: ikonen hade ett utstickande finger och granskades aldrig i 140 px; betydelsen låg i bubblan i stället för i kroppen; blindtestet frågade inte efter missförstånd; batchen skrev utkast från ett recept märkt TODO.
- **Handling `bow`** (djup/lätt, händer ihop/längs sidorna, mot någon) – kroppen bär förlåt, tack och hälsning. Ikon **`palms`** (🙏); `hand` omritad som öppen handflata utan utstickande finger.
- **Validatorn** stoppar en gest-ikon (`hand`, `palms`, `wave`) i pratbubbla utan kroppslig handling (CLAUDE.md §8).
- **Gångsätt:** `walk.manner: careful` (korta långsamma steg, blicken ner, nästan ingen armpendling) och bäraren `manner` för sätt-adjektiv; *försiktig* = går försiktigt med ett fullt glas.
- **Blindtest:** tredje frågan "kan något missförstås eller vara stötande?"; ett flaggat svar räknas inte som godkänt i täckning, rapport och validering (`flag` i `registry/blind.json`).
- **Batch:** inget utkast för recept märkta TODO/SVAGT/saknas (status *blocked*) – produktägaren ser aldrig en scen verktyget själv vet är fel.
- **Blindtest b12** (ursäkta, försiktig, skära): rätt val 3/3 men alla tre flaggade – bubbelikonen för liten, försiktig lästes som rädd, kniven i viloläge såg hotfull ut. Åtgärder: ikonbubblor 28×26 med ikon 19, lugnt ansikte i `careful`, en full skål soppa i stället för glas. b13 efter det – se `registry/blind.json`.
- Ansiktsritningen tål okända munvärden (fallback neutral). Tester: 66. Snapshot uppdaterad (ursäkta, försiktig, alla ikonbubblor).

