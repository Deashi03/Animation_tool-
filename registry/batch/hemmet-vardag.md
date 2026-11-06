# Batch: Hemmet och vardagliga aktiviteter (m.hemmet-vardag)

Skapade 9 utkast, 0 fanns, 7 ej animation, 0 bild, 0 blockerade (svagt recept, ingen scen), 4 manuella (verktyget säger ifrån – se anmärkningen), 0 ogiltiga, 0 utan recept.

**Regel:** ett utkast är klart först när remsan är granskad och blindtestet godkänt (`anim:blindtest`). Rader märkta ⚠ har ett recept med känd svaghet – läs anmärkningen och förbättra scenen eller receptet innan blindtest. Rader med status *manual* kan verktyget inte göra själv: följ anmärkningen och `docs/MANUAL_SCENES.md`, och lägg det du lär dig i `src/tools/lexicon.ts` så att nästa liknande ord går automatiskt.

| Ord | Status | Scen | Mall | Anmärkning |
|---|---|---|---|---|
| kök | skipped | – | – | image – ingen animation |
| sovrum | skipped | – | – | image – ingen animation |
| badrum | skipped | – | – | image – ingen animation |
| säng | skipped | – | – | image – ingen animation |
| golv | skipped | – | – | image – ingen animation |
| fönster | skipped | – | – | image – ingen animation |
| ren | created | anim.ren.1 | attribute-gloss |  [genererat high: egenskap i tabellen] |
| smutsig | created | anim.smutsig.1 | attribute-gloss |  [genererat high: egenskap i tabellen] |
| stökig | manual | – | – | MANUELLT – egenskapen stökig har ingen bärare: definitionen "När saker ligger överallt och inte på sin plats." nämner inget föremål i katalogen och ingen känd symbol • hitta ett typexempel: föremål med tillstånd, klädseldetalj, kontrastpar eller kulturneutral ikon – annars "ingen visualisering" • liknande lösta ord: vass, grov, jämn (registry/recipes.json) • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| städa | created | anim.städa.1 | tool-rhythm |  [genererat high: verktygsverb i tabellen] |
| plocka undan | created | anim.plocka-undan.1 | arrange |  [genererat high: ställa/ta-verb i tabellen] |
| tvätta | created | anim.tvätta.1 | tool-rhythm |  [genererat high: verktygsverb i tabellen] |
| tvätt | manual | – | – | MANUELLT – tvätt: aktivitetssubstantiv – använd verbet tvätta eller en event-scen • bygg byggstenen eller skriv en handscen enligt docs/MANUAL_SCENES.md • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| tvättmaskin | skipped | – | – | image – ingen animation |
| hänga | created | anim.hänga.1 | arrange |  [genererat high: ställa/ta-verb i tabellen] |
| diska | created | anim.diska.1 | tool-rhythm |  [genererat high: verktygsverb i tabellen, råvara från definitionen: container.plate] |
| dammsuga | manual | – | – | MANUELLT – dammsuga: byggsten saknas i katalogen – dammsugare • lägg till föremålet i src/assets/props/ och ett ARRANGE_VERBS-recept • liknande lösta ord: duka, lägga upp, servera (registry/recipes.json) • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| laga | created | anim.laga.1 | cook-rhythm |  [genererat high: matlagning i panna (tabell)] |
| handla | manual | – | – | MANUELLT – verbet handla passar ingen känd familj utifrån definitionen "Köpa mat och andra saker i en affär." • hittade föremål: inga • avgör familj (verktygsarbete, process, ordna, kommunikation, förflyttning …) och skriv ett recept enligt docs/WORD_FUNCTIONS.md – eller "ingen visualisering" • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| slänga | created | anim.slänga.1 | arrange |  [genererat high: ställa/ta-verb i tabellen] |
