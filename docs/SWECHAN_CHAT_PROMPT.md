# Instruktion till Claude i Swechan-chatten: så använder du Animation_tool-

Klistra in texten nedan i chatten (allt mellan strecken). Den förutsätter att repot `Deashi03/Animation_tool-` finns i miljön och att Swechans repo är klonat bredvid, t.ex. `../swechan`.

---

Du ska producera **ordanimationer för Swechan** med verktyget **Animation_tool-** (repo `Deashi03/Animation_tool-`). Verktyget gör en kort, deterministisk 2D-animation (120×120 SVG) av en betydelse i Swechans ordbok: verb visas som rörelse med synlig följd, egenskaper och relationer som en nästan stilla scen med det japanska ordet på vitt. Du ändrar **ingenting i Swechan**; allt arbete sker i Animation_tool-.

## Så fungerar verktyget

- Ett ord = ett **recept** (JSON) som byggarna gör till en hel scen. Recepten skrivs av **generatorn** ur ordboken (`anim:recipe`, regler i `src/tools/lexicon.ts`) eller för hand i `registry/recipes.json`. Du skriver aldrig TypeScript för ett enskilt ord.
- Verktyget **säger ifrån** när det inte klarar ett ord: status `manual` i batchrapporten med skäl, ledtrådar och liknande lösta ord. Då gäller `docs/MANUAL_SCENES.md`.
- Tre grindar avgör om en scen är klar: validatorn (bärar-regeln: något i bilden måste visa ordet – en figur som bara säger ordet är ett fel), **bildremsan** (du måste titta på PNG:n) och **blindtestet** (en separat granskare som bara får remsan och frågefilen). Utan godkänt blindtest utan flaggor är scenen inte klar.

## Läs först (i denna ordning)

1. `docs/MANUAL_SCENES.md` – vad verktyget gör själv, varför det säger ifrån, arbetsgång, checklista, vad som gått fel förut.
2. `docs/WORD_FUNCTIONS.md` – tabellen *ordfunktion → mall → bärare → text*, receptformatet.
3. `README.md`, avsnittet "Arbetsflöde för en modul". Vid behov `docs/SCENE_FORMAT.md` och `docs/STYLE_GUIDE.md`.

Kontrollera att `docs/MANUAL_SCENES.md` och `src/tools/lexicon.ts` finns; saknas de står du på en för gammal commit (byt till `main` efter att PR #6 är sammanslagen, annars till grenen `claude/phase-1`). Kör `npm ci` och `npm run typecheck && npx vitest run` innan du börjar.

## Arbetsgång för en modul

```bash
npm run anim:plan    -- --swechan ../swechan --module m.<modul>          # plan per ord → registry/plan/<modul>.md
npm run anim:recipe  -- --swechan ../swechan --module m.<modul> --list    # vad generatorn kan, och vad den säger ifrån om
npm run anim:batch   -- --swechan ../swechan --module m.<modul> --write --strips   # utkast + remsor + rapport i registry/batch/
```

Läs rapporten rad för rad:

- `created` → titta på remsan i `review/strips/anim.<ord>.1.png`. Ser något fel ut (lem genom kropp, föremål utanför duken, text som täcker bäraren, pose som ser kuslig ut) är det ett fel även om valideringen är grön.
- `manual` → följ anmärkningen och `docs/MANUAL_SCENES.md`: avgör funktion och bärare, skriv en **regel** i `src/tools/lexicon.ts` (hellre än ett handrecept), lägg till byggsten i `src/assets/`/`src/actions/` om den saknas (med test och remsa), bygg bara det ordet: `anim:batch -- --swechan ../swechan --module m.<modul> --word <ord> --write --strips`.
- `blocked` → receptet är märkt TODO; gör som för `manual`.
- Ett ord utan kulturneutralt typexempel får **ingen visualisering** (`{"template":"image"}` eller TODO med skäl). Det är bättre än en vilseledande scen.

Blindtesta sedan allt nytt:

```bash
npm run anim:blindtest -- make anim.<ord1>.1 anim.<ord2>.1 … --batch <namn>
```

Ge **en separat granskare** (ny session eller subagent) endast `review/strips/blind-<namn>.png` och `review/blind/<namn>.questions.md` – aldrig scenfiler eller facit. Granskaren svarar JSON (`{"A": {"description", "choice", "flag", "confidence"}}`) till `review/blind/<namn>.answers.json`. Rätta: `npm run anim:blindtest -- grade <namn> review/blind/<namn>.answers.json`. Fel val eller flagga = inte klar: ändra, titta på remsan, testa om.

Avsluta med `npm run anim:validate`, `npm run typecheck && npx vitest run`, en rad per scen i `docs/REVIEW_LOG.md`, och `npm run anim:coverage -- --swechan ../swechan`. Committa på en egen gren och öppna en PR; `main` ska alltid vara byggbar.

## Regler du inte får runda

- **Bärar-regeln:** föremål, förändring, rörelse, klädseldetalj eller ikon bär ordet. Text förklarar, bär aldrig ensam.
- **Verb = rörelse utan text; egenskap/relation/abstraktion = stilla scen + japanskt ord på vitt.** En aktivitet läses som sitt verb: en figur som kickar boll betyder *kicka*, inte *sportig*.
- **Gester bär aldrig ensamma** (hand-ikonen lästes som långfinger). Förlåt, tack, hälsning = bugning (`bow`) med 🙏 som förstärkning.
- **Grannordet är en designparameter:** *skära* mot *hacka*, *slappa* mot *sova*. Synonymer får dela bild men deklareras som `confusableWith`; två olika ord får aldrig ha identiska scener.
- **Fysiken:** fötter glider inte, verktyg ligger över råvaran, inget lem genom kroppen, inget föremål svävar.
- **Rapportera ärligt:** skriv aldrig att en scen "tydligt visar" något du inte sett i remsan. Säkerheten *hög* i generatorn betyder att regeln kom ur en tabell, inte att bilden är läsbar – det avgör bara remsan och blindtestet.
- Rör inte Swechan, inga betalda tjänster, inga URL:er eller fri SVG i scener, `reviewStatus: reviewed` sätts bara av människa.

## Rapportera till produktägaren

Per modul: antal skapade / manuella / blockerade, blindtestets resultat med flaggor, vilka regler eller byggstenar du lade till, vad som inte blev bra och varför, och länk till PR:en. Bifoga remsorna för nya scener.

---
