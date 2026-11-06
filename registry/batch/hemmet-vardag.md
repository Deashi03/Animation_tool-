# Batch: Hemmet och vardagliga aktiviteter (m.hemmet-vardag)

Skapade 9 utkast, 1 fanns, 7 ej animation, 0 bild, 2 blockerade (svagt recept, ingen scen), 1 manuella (verktyget säger ifrån – se anmärkningen), 0 ogiltiga, 0 utan recept.

**Regel:** ett utkast är klart först när remsan är granskad och blindtestet godkänt (`anim:blindtest`). Rader märkta ⚠ har ett recept med känd svaghet – läs anmärkningen och förbättra scenen eller receptet innan blindtest. Rader med status *manual* kan verktyget inte göra själv: följ anmärkningen och `docs/MANUAL_SCENES.md`, och lägg det du lär dig i `src/tools/lexicon.ts` så att nästa liknande ord går automatiskt.

| Ord | Status | Scen | Mall | Anmärkning |
|---|---|---|---|---|
| kök | skipped | – | – | image – ingen animation |
| sovrum | skipped | – | – | image – ingen animation |
| badrum | skipped | – | – | image – ingen animation |
| säng | skipped | – | – | image – ingen animation |
| golv | skipped | – | – | image – ingen animation |
| fönster | skipped | – | – | image – ingen animation |
| ren | created | anim.ren.1 | attribute-gloss |  |
| smutsig | created | anim.smutsig.1 | attribute-gloss |  |
| stökig | blocked | – | attribute-gloss | receptet är märkt som svagt – ingen scen skapas: TODO: flera saker huller om buller |
| städa | created | anim.städa.1 | attribute-gloss | symbolisk minischen: ikon + bärare + gloss |
| plocka undan | created | anim.plocka-undan.1 | arrange |  |
| tvätta | created | anim.tvätta.1 | tool-rhythm |  |
| tvätt | manual | – | – | MANUELLT – tvätt: aktivitetssubstantiv – använd verbet tvätta eller en event-scen • bygg byggstenen eller skriv en handscen enligt docs/MANUAL_SCENES.md • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| tvättmaskin | skipped | – | – | image – ingen animation |
| hänga | created | anim.hänga.1 | arrange |  |
| diska | created | anim.diska.1 | tool-rhythm |  |
| dammsuga | exists | anim.dammsuga.1 | – | scen finns |
| laga | blocked | – | cook-rhythm | receptet är märkt som svagt – ingen scen skapas: fritera/grilla: TODO egna föremål (fritös, grill) |
| handla | created | anim.handla.1 | attribute-gloss | symbolisk minischen: ikon + bärare + gloss |
| slänga | created | anim.slänga.1 | arrange |  |
