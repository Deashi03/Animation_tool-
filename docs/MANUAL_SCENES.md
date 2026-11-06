# När verktyget säger ifrån: så gör Claude själv

Verktyget ska klara de vanliga ordfunktionerna utan översikt. För resten ska det **säga ifrån tydligt** – status `manual` i `anim:batch`, läge *Manuellt* i `anim:coverage` – och då tar Claude över med den här sidan som instruktion. Målet med varje manuellt ord är dubbelt: en bra scen **och** en regel i `src/tools/lexicon.ts` så att nästa liknande ord går automatiskt.

## 1. Vad verktyget gör själv (och var det slutar)

`anim:recipe` läser ordets ordklass, definition, exempelmening och antonymer i Swechans ordbok och väljer recept i denna ordning:

1. **Handskrivet recept** i `registry/recipes.json` (per betydelse `s.<lemma>.<n>` eller per lemma) – vinner alltid.
2. **Lemmatabeller** i `lexicon.ts`: verktygsverb (`TOOL_VERBS`), processverb (`PROCESS_VERBS`), egenskaper (`PROPERTIES`), mönster/färger, klädfraser, förflyttning, tillstånd. Säkerhet *hög*.
3. **Definitionsregler** (`DEF_CATEGORY`, `SAY_BY_DEF`, `ABSTRACT_ICON`) med substantiv i definitionen översatta till katalogföremål (`NOUN_ASSET`). Säkerhet *medel* när ett föremål hittades, *låg* när bara familjen är känd.
4. Annars **manuellt** med skäl, vad som saknas och tre liknande lösta ord.

Verktyget gissar aldrig en bärare. Typiska skäl till *manuellt*:

| Skäl | Betyder | Vad Claude gör |
|---|---|---|
| "egenskapen X har ingen bärare" | definitionen nämner inget föremål i katalogen och ingen känd symbol (*mysig*, *trendig*, *praktisk*) | hitta typexemplet (avsnitt 3) eller besluta *ingen visualisering* |
| "föremålet Y hittades men inget tillstånd visar egenskapen" | katalogen har föremålet men ingen tillståndsnyckel bär ordet (*vinglig* + bord) | välj/lägg till en tillståndsnyckel eller effekt (`wobble`), skriv `PROPERTIES[lemma]` |
| "verbet X passar ingen känd familj" | definitionen matchar inget mönster (*renovera*, *jämföra*, *äga*) | avgör familj enligt `WORD_FUNCTIONS.md`; ofta blir det `arrange`, `tool-rhythm` eller *ingen visualisering* |
| "process på Y – vilken nyckel ändras?" | processverb utan känd riktning (*svälla*) | skriv `PROCESS_VERBS[lemma] = { asset, change }` |
| "kommunikationsverbet X har ingen ikon för innehållet" | ingen ikon visar *vad* som sägs (*kapitulera*, *uttrycka*) | välj ikon ur `ICON_NAMES` eller rita en ny kulturneutral ikon; artigheter får `bow` |
| "aktivitetssubstantiv" | händelse med flera figurer (*fika*, *flytt*) | använd verbet bakom (*fika* → äta/dricka tillsammans) eller skriv en `event`-scen |

## 2. Arbetsgång för ett manuellt ord

1. Läs raden i batchrapporten: skäl, ledtrådar, liknande lösta ord. Öppna de lösta ordens recept i `registry/recipes.json` och deras remsor i `review/strips/`.
2. Bestäm **funktionen** med tabellen i `docs/WORD_FUNCTIONS.md`. Fråga: *vad i bilden pekar i sig på ordet?* Om svaret är "texten" är det inget typexempel.
3. Skriv receptet – helst som **regel** (`PROPERTIES`, `TOOL_VERBS`, `PROCESS_VERBS`, `SAY_BY_DEF`, `NOUN_ASSET` …), annars som handrecept under `s.<lemma>.<n>`.
4. Saknas en byggsten (föremål, tillstånd, ikon, rörelse): lägg till den i `assets/`, `motions/` eller `actions/` med test och remsa. Aldrig TypeScript för ett enskilt ord.
5. `anim:batch --write --strips` → **titta på remsan** → `anim:blindtest make` → oberoende granskare → `grade`. Flagga eller fel val = inte klar.
6. Logga i `docs/REVIEW_LOG.md` vad som var svårt och vad som löste det. Är ordet för svårt: skriv `{"template":"image"}` eller en `TODO`-not – verktyget skapar då inget utkast.

## 3. Checklista innan en manuell scen räknas som klar

- [ ] Bäraren är ett föremål, en förändring, en rörelse, en klädseldetalj eller en ikon – inte en person som säger ordet.
- [ ] Verb: rörelse utan text, synlig följd, slutläget hålls. Egenskap/relation/abstraktion: nästan stilla scen + japanskt ord på vitt.
- [ ] Grannordet är designat emot (tempo, grad, slutläge, föremål) och `contrast.distinctiveFeatures` är specifika.
- [ ] Inga gester som enda bärare; inga västerländska djurmetaforer; inget som kan läsas som ett annat verb.
- [ ] Remsan granskad i 140 px: detaljer ≥ 6 enheter, inget utanför duken, ingen ruta med halvt synlig text.
- [ ] Fysiken håller: fötter glider inte, verktyg över råvaran, inga blinkningar mitt i ett hugg.
- [ ] Blindtest godkänt utan flaggor efter den senaste betydelseändringen.
- [ ] Regeln är tillagd i `lexicon.ts` eller receptet i `recipes.json`; en rad i `REVIEW_LOG.md`.

## 4. Vad som har gått fel förut (läs innan du gör samma sak)

| När | Ord | Vad som blev fel | Rotorsak | Regel som kom ur det |
|---|---|---|---|---|
| 2026-11-05 | *slappa* | såg ut som *sova* | stillbildstänkande, ingen tid, ingen kontrastdesign | kontrastpar är en designparameter; ögon, ljus och föremål skiljer tillstånd |
| 2026-11-05 | *sportig* | figur som kickar boll | en aktivitet läses som sitt verb (*kicka*) | egenskaper bärs av utseende/föremål + gloss, aldrig av en verbhandling |
| 2026-11-05 | *stormning*, *vända*, *skvätta* | otydligt i blindtest | för korta händelser, för få rutor, effekter för små | 12-rutors remsor; effekter sitter fast vid det de tillhör och är ≥ 6 enheter |
| 2026-11-05 | *vass*, *grov*, *halvera*, *skölja* | figur som säger ordet; fel antal delar; inget vatten | kontrakt utan bärarkrav, tom startscen, bulkrecept, täckning som räknade dem som redo | bärar-regeln i validatorn; test "varje recept bygger en giltig scen"; ärlig täckning |
| 2026-11-05 | *halvera*, *skära* | bladet bredvid råvaran, hand vid ansiktet | verktygets framåträckvidd räknades inte in; för stort äpple, för högt lyft | hand bakom arbetspunkten; runda råvaror 0,75; hugg-lyft 6 |
| 2026-11-06 | *ursäkta* | hand-ikon lästes som långfinger | ikon med utstickande finger, aldrig sedd i 140 px; betydelse i bubblan i stället för kroppen; blindtestet frågade inte om missförstånd | `bow` + 🙏; validatorn stoppar gest-ikon utan kroppslig handling; blindtestets fråga 3 |
| 2026-11-06 | *försiktig* | figur som bara gick med en bricka | TODO-recept gav ändå ett utkast; ingen byggsten för sätt | batch skriver inget för TODO-recept; `walk.manner: careful`; bäraren `manner` |
| 2026-11-06 | *grov* | hög av bitar, oläsbar ensam | egenskap som bara finns relativt | kontrast mot *fin* på samma bord när motsatsen är poängen |
| 2026-11-06 | alla gloss-scener | panel halvt utanför duken i en ruta | glidning in från utanför duken | glossen tonas in på plats |

## 5. När svaret är "ingen visualisering"

Om inget typexempel finns som en japansk inlärare läser rätt utan svenska, är rätt leverans `{"template":"image"}` (när Swechans bild räcker) eller ett `TODO`-recept med ett ärligt skäl. En vilseledande animation är sämre än ingen. Skriv skälet så att nästa Claude inte gör om försöket.
