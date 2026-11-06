# Batch: Tillaga och servera (m.tillaga-och-servera)

Skapade 5 utkast, 0 fanns, 4 ej animation, 0 bild, 0 blockerade (svagt recept, ingen scen), 6 manuella (verktyget säger ifrån – se anmärkningen), 0 ogiltiga, 0 utan recept.

**Regel:** ett utkast är klart först när remsan är granskad och blindtestet godkänt (`anim:blindtest`). Rader märkta ⚠ har ett recept med känd svaghet – läs anmärkningen och förbättra scenen eller receptet innan blindtest. Rader med status *manual* kan verktyget inte göra själv: följ anmärkningen och `docs/MANUAL_SCENES.md`, och lägg det du lär dig i `src/tools/lexicon.ts` så att nästa liknande ord går automatiskt.

| Ord | Status | Scen | Mall | Anmärkning |
|---|---|---|---|---|
| kock | skipped | – | – | image – ingen animation |
| tillaga | created | anim.tillaga.1 | cook-rhythm |  [genererat high: matlagning i panna (tabell)] |
| förbereda | manual | – | – | MANUELLT – verbet förbereda passar ingen känd familj utifrån definitionen "Göra saker i förväg, så att allt är klart när man behöver det." • hittade föremål: inga • avgör familj (verktygsarbete, process, ordna, kommunikation, förflyttning …) och skriv ett recept enligt docs/WORD_FUNCTIONS.md – eller "ingen visualisering" • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| fat | skipped | – | – | image – ingen animation |
| lägga upp | created | anim.lägga-upp.1 | arrange |  [genererat high: ställa/ta-verb i tabellen] |
| garnera | manual | – | – | MANUELLT – garnera: att ställa/ta något – men vilket föremål? Inget hittades i definitionen • ange put.prop (och on) i ARRANGE_VERBS eller receptet • liknande lösta ord: duka, lägga upp, servera (registry/recipes.json) • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| servera | created | anim.servera.1 | social |  [genererat high: verb mellan människor i tabellen] |
| gäst | skipped | – | – | image – ingen animation |
| buffé | skipped | – | – | image – ingen animation |
| ta för sig | created | anim.ta-för-sig.1 | arrange |  [genererat high: ställa/ta-verb i tabellen] |
| värma upp | created | anim.värma-upp.1 | process |  [genererat high: processverb i tabellen] |
| ljummen | manual | – | – | MANUELLT – bara familjen är säker (abstrakt: ikon snowflake ur definitionen) – förslag: {"template":"attribute-gloss","bearer":{"kind":"icon","icon":"snowflake","env":"neutral"}} • bekräfta eller ändra förslaget och skriv det som regel i lexicon.ts eller recept i recipes.json • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| rykande | manual | – | – | MANUELLT – bara familjen är säker (abstrakt: ikon flame ur definitionen) – förslag: {"template":"attribute-gloss","bearer":{"kind":"icon","icon":"flame","env":"neutral"}} • bekräfta eller ändra förslaget och skriv det som regel i lexicon.ts eller recept i recipes.json • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| smaklig måltid | manual | – | – | MANUELLT – kommunikationsverbet smaklig måltid har ingen ikon för innehållet • välj en ikon ur ikonbiblioteket som visar VAD som sägs (inte en gest) och lägg till i SAY_BY_DEF • kroppen måste bära betydelsen om innehållet är en artighet (bow) • liknande lösta ord: var för sig, smaklig måltid, tack för maten (registry/recipes.json) • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| dela | manual | – | – | MANUELLT – dela: delning kräver att ett föremål delas i två och ena halvan ges bort – ingen byggsten bryter ett bröd ännu • bygg byggstenen eller skriv en handscen enligt docs/MANUAL_SCENES.md • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
