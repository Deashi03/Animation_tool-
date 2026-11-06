# Pilot: receptgeneratorn utan handrecept (2026-11-06)

**Fråga:** hur långt kommer verktyget på egen hand, utan Claudes handskrivna recept? Tre moduler kördes med `anim:batch --generated --out review/pilot/scenes` (handrecepten dolda, biblioteket orört): *Att beskriva en bostad*, *Hemmet och vardagliga aktiviteter*, *Tillaga och servera*.

## Utfall per ord (36 ord som behöver animation)

| Läge | Antal | Ord |
|---|---|---|
| Scen byggd (hög/medel säkerhet) | 18 | diska, dragig, hänga, laga, lägga upp, modern, plocka undan, ren, servera, sliten, slänga, smutsig, solig, städa, ta för sig, tillaga, tvätta, värma upp |
| Manuellt – ingen bärare i definitionen | 9 | trång, mysig, praktisk, central, bullrig, stökig, rymlig, högt i tak, renovera |
| Manuellt – bara familjen säker (förslag lämnat) | 4 | nybyggd, charmig, ljummen, rykande |
| Manuellt – byggsten saknas / känt svårt | 3 | dammsuga (dammsugare), dela (bryta i två), tvätt (aktivitetssubstantiv) |
| Manuellt – övrigt | 2 | handla, förbereda, garnera, smaklig måltid (ikon saknas) |

Varje manuell rad har skäl, ledtråd och liknande lösta ord i batchrapporten; `docs/MANUAL_SCENES.md` är överlämningen.

## Blindtest (oberoende granskare, bara remsa + frågor, tredje frågan om missförstånd)

| Omgång | Scener | Rätt ord | Rätt utan flagga | Viktigaste flaggor |
|---|---|---|---|---|
| p1 + p2 (första bygget) | 19 | 18 | 5 | identiska scener för *lägga upp*/*servera*/*duka*; tomma tallrikar; flaska ovanpå soptunnans lock; klädstreckets stolpe genom figuren; sol på bordet; effekter som aldrig startade (smulor, smuts) |
| p3 + p4 (efter rättningarna) | 18 | 16 | 5 | synonymkluster *laga/tillaga/värma upp* och *lägga upp/servera* erbjöds mot varandra; stolpen fortfarande nära ansiktet; tvättposen; *sliten* och *modern* bärs av texten; drag-ikonen lästes som snöflinga |

Fel val var uteslutande inom synonymkluster (*laga*→*tillaga*, *lägga upp*→*servera*). Inget bedömdes som stötande.

## Vad piloten gav upphov till (regler, inte handrättningar)

- **Motorfel:** en följd (`effects`) startade från 0 i stället för föremålets deklarerade tillstånd – smulor försvann aldrig, smutsiga tallrikar var rena från början. Rättat i `use`.
- **Identiska scener:** batchen stoppar två ord med samma bild i samma modul (status *manual*: "samma bild som …").
- **Synonymkluster** (`SYNONYM_GROUPS`): *laga/tillaga*, *servera/lägga upp/duka*, *värma upp/koka* … är `confusableWith`, inte kontrastpar – de erbjuds inte mot varandra i blindtest eller bildfrågor.
- **Byggare:** tallrikar med mat för serveringsord; soptunnan öppnas och saken försvinner ner i den; soptunnor, lådor och hinkar står på golvet; klädstrecket står så att stolpen inte går genom figuren; himlaföremål i skyn med gloss under; rummets fönster används som bärare; pratbubblan står bredvid föremål på bord och täcker aldrig bäraren; solen pulserar; ny ikon `wind` för drag; mindre framåtlutning vid verktygsarbete.
- **Generatorn:** låg säkerhet byggs inte utan lämnas som förslag; `HARD_WORDS` med ärliga skäl (dela, skåla, sjunka, fika, tvätt); saknade byggstenar namnges (`MISSING_ASSET`); kontrast vinner över ensamt tillstånd (ren/smutsig, full/tom).

## Kvarstående svagheter (ärligt)

- Egenskaper utan synlig förändring (*modern*, *sliten*, *solig*) bärs i hög grad av glossen. Det är inom policyn (egenskap + japanskt ord) men granskaren ser det som svagt.
- Tvättposen (huvudet mot baljan) ser obekväm ut; verktygsarbete vid låga kärl behöver en bättre lutningsmodell.
- Generatorn klarar ungefär hälften av orden i en typisk modul på egen hand; resten säger den ifrån om, med skäl. Mot hela ordboken: 272 recept av 600 (173 hög, 49 medel, 50 låg), 328 manuella; där handrecept finns stämmer mallen i 83 %.

## Andra mätningen (2026-11-06, tre nya moduler: *Färskhet och mognad*, *Flytta till ny bostad*, *Matbordets samtal*)

Innan mätningen fick generatorn tillståndsregler för adjektiv (`STATE_BY_ADJ`: mogen/rutten/vissen/blöt/skrynklig … på det föremål definitionen nämner), ätverb med ljud, synonymgrupper och känsloverb. Utfall: 35 ord, **27 scener byggda** (p5/p6), 8 manuella med skäl (tejp saknas, ömtålig, oartig, skåla, inflyttningsfest, vänta in, härsken, unken). Blindtest p5/p6: **rätt ord 25 av 27**; de två felen var *packa upp* (lådan öppnades aldrig) och *märka* (pennan lämnade inget spår) – båda svarade granskaren ärligt "inget".

Flaggorna gav nya regler: rötfrukter som bara skildes åt av texten (*rutten/skämd/möglig/härsken/unken*) → ny byggsten **mögel** på äpplet, *skämd* lättare röta, *härsken/unken* säger verktyget ifrån om; verktygsverb utan synlig följd (*märka*, *såga*, *putsa* …) lämnas som förslag i stället för att byggas; `take … from` tar saken **ur** en öppen väska/kyl; ljudmarkeringar sitter på munsidan; krukväxter större; möbler ställs på golvet; långa glosser klipps inte längre vid kanten; bakord → bröd. Scenerna med dessa rättningar är omrenderade och granskade i remsa men inte blindtestade på nytt.

## Tredje mätningen (2026-11-06, *Tygers egenskaper*, *Grannar och störningar*, *Att beskriva en outfit*)

Den svåra änden: tyg- och stilegenskaper. Före mätningen fick generatorn rörelse-bärare (`motion`: töjbar/elastisk/tålig/vinglig), förlopp (`change`: snabbtorkande), ikon + plagg för vattentät/vindtät/luftig/varmhållande, samt smak- och känsloregler lästa ur definitionen. Utfall: 34 ord, **12 scener**, 22 manuella (stilord som *trendig*, *stilig*, *cool*, *originell* och abstrakta som *isolera*, *sänka* – alla med skäl). Blindtest p7: **12 av 12 rätt ord**, men granskaren flaggade att *tidlös*, *tålig* och paret *luftig/vindtät* bärs av texten, att droppen i *vattentät* var orange (ikonfärg = accent) och att *störa* inte visar vad som stör. Rättat: ikonfärger efter betydelse (droppe blå, låga röd, sol gul). Kvar som kända svagheter: egenskaper som bara skiljs av en riktning (luft igenom/stoppas) och hållfasthet utan påfrestning.

Sammanlagt över tre mätningar: 84 scener, blindtest **96 av 103 rätt ord**; felen inom synonymkluster eller där granskaren svarade "inget" när följden inte syntes.

## Nästa steg

1. Kör samma mätning på tre nya moduler efter varje regeltillägg; målet är att andelen *manuellt* sjunker och att felvalen stannar inom synonymkluster.
2. Bygg de byggstenar som flest manuella ord pekar på (dammsugare, bryta i två, gardin/vind för rum).
3. Låt en separat Claude-session göra tre manuella ord med bara `docs/MANUAL_SCENES.md` som instruktion och mät hur det går.
