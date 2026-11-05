# CLAUDE.md — Utvecklingsinstruktion för Animation_tool-

## Uppdrag

Utveckla **Animation_tool-** till ett kostnadsfritt, AI-vänligt verktyg för att skapa, redigera, förhandsgranska, kvalitetssäkra och exportera **pedagogiska 2D-animationer** som används i språkinlärningsappen **Swechan**.

**Repository för verktyget:** `Deashi03/Animation_tool-`  
**Konsument:** `Deashi03/Swechan`  
**Publicering:** GitHub Pages på `https://deashi03.github.io/Animation_tool-/` när Pages är aktiverat.

Verktyget ska främst illustrera ords **betydelse**: exempelvis *springa*, *hoppa*, *hälla*, *öppna*, *bakom*, *full*, *tom*, *långsamt* och *förvånad*. Prioritera pedagogiska animationer, inte gränssnittseffekter. Målet på sikt är **tiotusentals semantiskt meningsfulla animationer**, men detta är ett skalbarhetsmål – inte ett löfte om att enkla slumpmässiga kombinationer blir bra undervisningsmaterial.

**Viktig produktprincip:** Verktyget ska vara lättare för Claude att styra via kod och strukturerad data än via musklick. Samtidigt ska produktägaren ha ett enkelt visuellt gränssnitt.

## 1. Hårda krav

1. **Inga nya löpande kostnader.** Ingen betald AI-API, bild-/videogenerering, molnserver, prenumeration, licens eller betald tjänst får krävas. Föreslå aldrig kostnadsbelagda beroenden som standard. Kostnadsfria, korrekt licensierade open-source-bibliotek får användas med redovisad licens.
2. **Statisk webbapp.** Verktyget ska kunna byggas och publiceras på GitHub Pages utan backend, konto, databas på servern eller API-nycklar. Ingen hemlighet får exponeras i klientkoden.
3. **Lokal användning.** Scener ska kunna redigeras och förhandsgranskas i webbläsaren. Exportera/importera filer lokalt. En GitHub Pages-sida kan inte skriva direkt till repositoryt utan autentiserad extern tjänst; bygg därför inte en falsk "Spara till GitHub"-knapp.
4. **Separat från Swechan.** Ändra inte Swechans repository utan särskilt uppdrag. Dokumentera en tydlig integration som kan införas senare utan att röra inlärningslogik eller användardata.
5. **Förutsägbarhet.** Samma scen + samma tidpunkt + samma version av tillgångar ska ge samma bild. Ingen okontrollerad slump eller externt innehåll vid uppspelning.
6. **Mobil först.** Allt måste fungera i iPhone Safari, med rimlig prestanda och tillgänglighet. Stöd `prefers-reduced-motion`, paus, repris och en informativ stillbild.
7. **Inget vilseledande kvalitetslöfte.** Automatiska tester upptäcker tekniska fel men kan inte garantera att en animation betyder rätt sak. Märk AI-genererat material som utkast tills det granskats.

## 2. Förhållande till Swechan (kontrollerat 2026-11-05)

Läs vid integration dokumentationen i `Deashi03/Swechan`, i denna ordning:
- `PROJECT_STATUS.md`
- `ARCHITECTURE.md`
- `CONTENT_GUIDELINES.md`
- `DATA_MODEL.md`
- `CLAUDE.md`

Swechan använder för närvarande React 19, TypeScript, Vite, Zod och GitHub Pages och är en statisk local-first-PWA. Den har redan **kodritade SVG-illustrationer** i `src/ui/wordArt/` (ordbilder) och `src/ui/art/` (modulmotiv). Ord och betydelser identifieras med stabila `senseId` av formen `s.<lemma>.<n>`.

**Anpassa det nya verktyget till den befintliga arkitekturen och grafiska riktningen.** Slå inte ihop stillbilder och animationer utan genomtänkt migrations- och kompatibilitetsplan. Befintliga bildmetadata (`group`, `quiz`, `confusableWith`, `symbol`) ska beaktas: en animation är inte automatiskt lämplig som flervalsfråga.

Swechans undervisning omfattar bland annat ordintroduktion, övningar, läsning och samtal. Animationer ska vara **valfria innehållsresurser på betydelsenivå** och får inte påverka repetitionsalgoritmen, streak eller sparad progression.

## 3. Teknik och arkitektur

**Föredragen första version:** TypeScript + React + Vite + SVG, deklarativa tidslinjer, Zod för schemavalidering och Vitest för tester. SVG passar Swechans nuvarande grafik och gör en första prototyp enkel att redigera och spela upp på mobil. Använd webbläsarens animationsfunktioner eller en liten egen deterministisk tidslinjemotor; välj efter mätning. **Lås inte projektet till PixiJS, Rive eller en stor motor från början.** Om prestandamätningar senare visar att Canvas/WebGL behövs ska rendering kunna bytas bakom ett gränssnitt.

Dela upp systemet i:
- **Scene schema:** versionerad, strikt typad JSON utan körbar kod.
- **Asset library:** återanvändbara vektorfigurer, kroppsdelar, objekt, miljöer och färgpaletter.
- **Motion library:** rörelser som gå, springa, hoppa, bära, gripa, öppna, hälla, falla, titta och reagera. Rörelserna ska kunna parametriseras och kombineras.
- **Scene compiler/validator:** validerar JSON, referenser, timing, bildutsnitt och exporterbarhet.
- **Renderer/player:** tolkar scenen, har play/pause/replay/scrub och kan rendera en bestämd bildruta vid tiden `t`.
- **Editor/gallery:** webbaserad studio för förhandsgranskning, jämförelse och lokala filimporter/-exporter.
- **CLI för Claude:** enkla kommandon för att skapa, validera, förhandsgranska och batchkontrollera scener.
- **Swechan-adapter:** separat, dokumenterat paket eller modul som senare kan integreras i Swechan med minimala beroenden.

Varje visuell komponent ska ha tydliga mått, koordinatsystem, ankare och egenskaper. Figurer ska vara uppbyggda så att huvud, bål, armar och ben kan animeras och återanvändas – inte bara flyttas som en stel helbild. Samtidigt ska de första figurerna vara enkla nog att färdigställa med hög kvalitet.

## 4. Scenformat: kontrakt för AI-produktion

Definiera ett tydligt `scene.schema.json` och motsvarande TypeScript-typer. Följande är ett **illustrativt förslag**; färdigställ och dokumentera det faktiska formatet innan storskalig produktion:

```json
{
  "schemaVersion": 1,
  "animationId": "anim.springa.1",
  "senseId": "s.springa.1",
  "titleSv": "springa",
  "meaningHint": "En person förflyttar sig snabbt till fots",
  "category": "action",
  "durationMs": 3600,
  "loop": true,
  "scene": {
    "environment": "park",
    "actors": [
      {
        "id": "person1",
        "asset": "character.basic.1",
        "actions": [
          {
            "motion": "run",
            "fromMs": 0,
            "toMs": 3600,
            "from": { "x": 0.15, "y": 0.76 },
            "to": { "x": 0.85, "y": 0.76 }
          }
        ]
      }
    ]
  },
  "focus": { "actorIds": ["person1"], "action": "run" },
  "pedagogy": {
    "quizEligible": false,
    "confusableWith": ["s.gå.1"],
    "reviewStatus": "ai-draft"
  }
}
```

Krav på det slutliga formatet:
- Separera **betydelse**, **scen**, **visuella resurser** och **rörelser**.
- Låt en betydelse ha flera tänkbara scenvarianter, med **unika animations-ID:n**, utan att kopiera ordboksdefinitioner.
- Stöd position, skala, rotation, lagerordning, easing, tidslinjer, upprepning, väntan, scenövergångar, fokus och interaktion mellan aktörer/föremål.
- Beskriv handlingar **semantiskt** (t.ex. `pour`) som översätts till rörelse, föremålsförändring och orsak–verkan; enbart en generisk förflyttning räcker inte.
- Avvisa okända komponenter, saknade filer, orimliga koordinater/tider och ogiltiga referenser med begripliga fel.
- Tillåt inte `eval`, godtycklig JavaScript, obegränsat HTML/SVG-markup eller osäker filinläsning i scen-JSON.
- Schemat ska versionshanteras och kunna migreras utan att befintliga scener går sönder.
- `reviewStatus: reviewed` får endast sättas efter verklig mänsklig granskning, aldrig automatiskt av AI.

## 5. Visuell och pedagogisk kvalitetsstandard

Målet är **genomarbetad, vänlig och modern 2D-bilderboksstil** med naturliga proportioner, mjuka rörelser, konsekvent linjeföring och tydlig fokuspunkt. Ta visuella ledtrådar från Swechans befintliga `wordArt` och designprinciper, men utveckla gemensamma stilregler i `STYLE_GUIDE.md`. Skapa inte en stor mängd halvfärdiga stickfigursanimationer.

För varje ord ska Claude först avgöra om animationen **faktiskt tillför pedagogiskt värde**:
- **Verb:** handling + synlig följd (t.ex. hälla: kärl lutar, vätska rör sig och glaset fylls).
- **Rumsord/prepositioner:** tydligt förhållande mellan minst två föremål (bakom, framför, under).
- **Adjektiv:** tydlig egenskap eller kontrast (full/tom, snabb/långsam, tung/lätt).
- **Substantiv:** animerad användning eller betydelsebärande förändring, inte rörelse bara för rörelsens skull.
- **Känslor:** begripliga ansiktsuttryck, kroppshållning och situation, utan överdrivna kulturella stereotyper.
- **Abstrakta ord:** försök en konkret, kulturellt begriplig scen; om konceptet inte kan förmedlas entydigt, avstå från animation.

Skillnaden mellan närliggande ord måste vara synlig. Undvik distraktioner, dekorativa animationer utan lärvärde, irrelevanta detaljer och osanna orsak–verkan-samband.

Lägg till metadata för `confusableWith`, pedagogiskt fokus, kategorier och granskningsstatus. Animationer ska inte användas i automatiskt rättade bildfrågor om det finns flera rimliga tolkningar. Testa både med och utan svensk ordetikett; eleven ska i bästa möjliga mån förstå konceptet visuellt.

## 6. Funktioner i webbstudion

Bygg en liten men fungerande **studio** i stället för en statisk demosida. Den ska innehålla:
- Scengalleri med sökning på animationId, `senseId`, titel och kategori.
- Förhandsgranskning med spela/pausa, repris, hastighet, tidslinjeskrapning och stillbild.
- JSON-editor eller strukturerat formulär med live-validering och begripliga felmeddelanden.
- Möjlighet att välja figur, föremål, miljö, rörelse, färger och tidsparametrar.
- Import och export av en scen respektive flera scener som lokala filer.
- Kontaktark med många förhandsbilder för snabb kvalitetsgranskning.
- Visning av mobilstorlek och kontroll av att viktiga motiv inte klipps av.
- Synlig status: utkast, tekniskt validerad, manuellt granskad.

Alla reglage och knappar ska fungera. Använd lokal lagring endast om det behövs och dokumentera hur användaren exporterar en säkerhetskopia; GitHub Pages är inte en skrivbar databas.

## 7. Claude-arbetsflöde och massproduktion

Implementera ett kommandoradsgränssnitt för repetitiva uppgifter. Föreslagna npm-skript (namnen kan justeras om det dokumenteras):

```bash
npm run anim:new -- s.springa.1
npm run anim:validate
npm run anim:preview -- anim.springa.1
npm run anim:sheet
npm run anim:batch -- scenes/input.json
npm run anim:export
```

Kommandona ska:
- utgå från ett validerat format och mallar;
- ge tydliga, maskinläsbara felmeddelanden;
- inte kräva ett betalt API eller manuella klick;
- kunna köras i GitHub Actions eller vanlig terminal;
- stödja batchar utan att hela samlingen laddas på iPhone;
- vara idempotenta: körning av samma indata ska inte skapa dubbletter eller ändra befintliga godkända scener tyst.

Skapa deduplicering av resurser och begripliga ID-konventioner. **Skala genom semantiskt välgrundade kombinationer** av byggblock, inte genom att slumpa färg och påstå att en ny färg är en ny inlärningsanimation. Inför granskningskö och rapport över antal utkast, tekniskt validerade och mänskligt granskade scener.

## 8. Tester, säkerhet och prestanda

Skapa tester för:
- scenformat, felaktig JSON, referenser och versionsmigreringar;
- renderingsdeterminism: `renderAt(t)` ska kunna testas;
- tidsgränser, easing, rörelser, ankare, orientering, lagerordning, loopning;
- försvunna/felplacerade objekt, avklippta fokusobjekt och ogiltiga scener;
- import/export, dubblett-ID:n, felaktiga `senseId` och osäkra fält;
- tillgänglighet, reducerad rörelse, tangenter och mobilkontroller;
- visuella regressioner med skärmbilder för representativa scener;
- responsivitet och faktisk uppspelning i Chromium med mobilstorlek. WebKit/iPhone bör testas när miljön tillåter det; påstå inte att fysisk iPhone är testad om det inte är gjort.

Sätt ett initialt mål om **flytande uppspelning på vanliga iPhone-modeller** med så lite CPU/batterianvändning som rimligt, och **mät** bildfrekvens och laddningskostnad i stället för att utlova 60 fps. Animationsfiler och gemensamma tillgångar ska hämtas vid behov; en publik Swechan-användare ska inte behöva ladda tiotusentals scener på startsidan. Långtidslagring och offline-cache ska versionshanteras.

Visa alltid en meningsfull stillbild när rörelse är avstängd eller uppspelning misslyckas.

## 9. Integration i Swechan — leverera kontrakt först

Bygg först ett **återanvändbart player-API** som kan användas från React utan att webbstudions kod följer med i Swechan. Dokumentera exempel i stil med:

```tsx
<WordAnimation senseId="s.springa.1" autoplay={false} />
```

Detta är ett **målexempel**, inte en befintlig komponent. Skapa en export-/importväg för publicerade animationer och en mappning från `senseId` till animationId; kopiera inte hela animationverktygets editor till Swechan. Föreslå hur Swechans nuvarande ordbilder ska visas tillsammans med eller som fallback för animationer. Följ Swechans bildquizregler och granskningsstatus. Bevara befintliga ordposter och ID:n.

Ingen ändring i Swechan sker innan spelaren och formatet är stabila och integrationen efterfrågats.

## 10. Repositorystruktur och dokumentation

Skapa en lättbegriplig struktur som ungefär motsvarar:

```text
Animation_tool-/
  README.md
  CLAUDE.md
  ARCHITECTURE.md
  SCENE_FORMAT.md
  STYLE_GUIDE.md
  ROADMAP.md
  CHANGELOG.md
  src/
    engine/
    schema/
    assets/
    motions/
    scenes/
    editor/
    player/
  scripts/
  tests/
  .github/workflows/
```

Anpassa strukturen om det förbättrar underhållbarheten. Alla större designbeslut och nya beroenden ska motiveras. Dokumentera hur Claude skapar en scen från ett `senseId`, validerar den, förhandsgranskar och exporterar den utan extra handpåläggning.

## 11. Genomförandeordning

**Fas 0 — Baslinje.** Inspektera befintligt repository och Swechans aktuella arkitektur. Dokumentera teknikval och risker. Inga onödiga beroenden.

**Fas 1 — Fungerande MVP.** Skapa statisk Vite/React/TypeScript-app, vektorbaserad renderare, JSON-schema, CLI-validering, automatiska tester och publicerbar GitHub Pages-build. Leverera **fem verkligt fungerande animationer**: `springa`, `hoppa`, `öppna`, `hälla`, `bakom`. Var och en måste tydligt illustrera ordets betydelse.

**Fas 2 — Återanvändbarhet och studio.** Bygg rörelse-/resursbibliotek, scenredigering, kontaktark, import/export, manuella kvalitetskontroller och 20 ytterligare referensscener från flera ordklasser. Säkerställ att scenerna inte kräver unik hårdkodad komponent per ord.

**Fas 3 — Skalbarhet och Swechan-kontrakt.** Utveckla batchgenerator, lazy loading, versionerad player, prestandatester och dokumenterad adapter. Skapa en pilot med 100 semantiskt olika animationer. Rapportera faktisk kvalitet, upprepning, feltyper och kostnader.

**Fas 4 — Produktion i större skala.** Skala först efter godkänd pilot. Arbeta ämnesvis, med automatiska kontroller och mänsklig urvalsgranskning. Inga påståenden om "20 000 färdiga" baserat på bara kosmetiska variationer.

## 12. Arbetsdisciplin och leveranskrav

- **Börja implementera fas 1**, inte bara skriva en plan. Arbeta i avgränsade steg med körbara tester.
- Kör minst `npm run typecheck`, `npm test` och `npm run build` före varje större leverans. Lägg till och kör E2E när UI finns.
- Vid nya funktioner: tillför tester och uppdatera `README.md`, `ARCHITECTURE.md`, `ROADMAP.md` och `CHANGELOG.md` där det är relevant.
- Behåll huvudgrenen fungerande; använd utvecklingsgrenar/PR vid större riskfyllda ändringar. Radera aldrig fungerande data för att göra tester gröna.
- Säkra GitHub Pages-workflow för statisk publicering från `main`, med korrekta relativa sökvägar för repositorynamnet `Animation_tool-`. Om GitHub kräver engångsinställning: dokumentera exakt **Settings → Pages → Build and deployment → Source: GitHub Actions**. Påstå inte att Pages är aktiverat utan verifiering.
- Om en funktion inte kan byggas inom kostnads- eller teknikkraven: förklara begränsningen och leverera en fungerande kostnadsfri del, i stället för att lägga in betalt beroende.
- Avsluta varje utvecklingsetapp med: vad som fungerar, testresultat, begränsningar, var det kan granskas visuellt samt nästa prioriterade steg.

**Framgångskriterium för första leveransen:** Jag kan öppna en publicerad eller lokal studio, spela upp fem olika pedagogiskt begripliga animationer, redigera minst en scen via validerad data, exportera den, skapa en till via CLI och se en lyckad automatisk bygg- och testkörning — utan att registrera någon betaltjänst.
