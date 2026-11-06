# Batch: Att beskriva en bostad (m.att-beskriva-en-bostad)

Skapade 11 utkast, 2 fanns, 1 ej animation, 0 bild, 1 blockerade (svagt recept, ingen scen), 0 manuella (verktyget säger ifrån – se anmärkningen), 0 ogiltiga, 0 utan recept.

**Regel:** ett utkast är klart först när remsan är granskad och blindtestet godkänt (`anim:blindtest`). Rader märkta ⚠ har ett recept med känd svaghet – läs anmärkningen och förbättra scenen eller receptet innan blindtest. Rader med status *manual* kan verktyget inte göra själv: följ anmärkningen och `docs/MANUAL_SCENES.md`, och lägg det du lär dig i `src/tools/lexicon.ts` så att nästa liknande ord går automatiskt.

| Ord | Status | Scen | Mall | Anmärkning |
|---|---|---|---|---|
| rymlig | created | anim.rymlig.1 | property-contrast |  |
| trång | created | anim.trång.1 | property-contrast |  |
| mysig | exists | anim.mysig.1 | – | scen finns |
| modern | exists | anim.modern.1 | – | scen finns |
| renovera | created | anim.renovera.1 | attribute-gloss | symbolisk minischen: ikon + bärare + gloss |
| nybyggd | created | anim.nybyggd.1 | attribute-gloss |  |
| sliten | blocked | – | attribute-gloss | receptet är märkt som svagt – ingen scen skapas: TODO: noppor/hål-tillstånd |
| charmig | created | anim.charmig.1 | attribute-gloss |  |
| praktisk | created | anim.praktisk.1 | attribute-gloss |  |
| central | created | anim.central.1 | attribute-gloss |  |
| läge | skipped | – | – | image – ingen animation |
| bullrig | created | anim.bullrig.1 | attribute-gloss | med sound thump |
| solig | created | anim.solig.1 | attribute-gloss |  |
| dragig | created | anim.dragig.1 | attribute-gloss |  |
| högt i tak | created | anim.högt-i-tak.1 | attribute-gloss |  |
