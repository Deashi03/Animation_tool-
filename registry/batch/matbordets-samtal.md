# Batch: Matbordets samtal (m.matbordets-samtal)

Skapade 6 utkast, 0 fanns, 6 ej animation, 0 bild, 0 blockerade (svagt recept, ingen scen), 3 manuella (verktyget säger ifrån – se anmärkningen), 0 ogiltiga, 0 utan recept.

**Regel:** ett utkast är klart först när remsan är granskad och blindtestet godkänt (`anim:blindtest`). Rader märkta ⚠ har ett recept med känd svaghet – läs anmärkningen och förbättra scenen eller receptet innan blindtest. Rader med status *manual* kan verktyget inte göra själv: följ anmärkningen och `docs/MANUAL_SCENES.md`, och lägg det du lär dig i `src/tools/lexicon.ts` så att nästa liknande ord går automatiskt.

| Ord | Status | Scen | Mall | Anmärkning |
|---|---|---|---|---|
| skicka | created | anim.skicka.1 | social |  [genererat high: verb mellan människor i tabellen] |
| servett | skipped | – | – | image – ingen animation |
| bordsskick | skipped | – | – | image – ingen animation |
| oartig | manual | – | – | MANUELLT – egenskapen oartig har ingen bärare: definitionen "Inte artig." nämner inget föremål i katalogen och ingen känd symbol • hitta ett typexempel: föremål med tillstånd, klädseldetalj, kontrastpar eller kulturneutral ikon – annars "ingen visualisering" • liknande lösta ord: vass, grov, jämn (registry/recipes.json) • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| armbåge | skipped | – | – | image – ingen animation |
| sörpla | created | anim.sörpla.1 | manipulate-prop |  [genererat high: ätverb i tabellen] |
| smaska | created | anim.smaska.1 | manipulate-prop |  [genererat high: ätverb i tabellen] |
| vänta in | manual | – | – | MANUELLT – bara familjen är säker (definitionen beskriver ett tillstånd) – förslag: {"template":"state","note":"tillstånd: vänta in"} • bekräfta eller ändra förslaget och skriv det som regel i lexicon.ts eller recept i recipes.json • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| värd | skipped | – | – | image – ingen animation |
| skåla | manual | – | – | MANUELLT – skåla: två glas som höjs mot varandra saknas som pose • bygg byggstenen eller skriv en handscen enligt docs/MANUAL_SCENES.md • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| tack för maten | created | anim.tack-för-maten.1 | communicate |  [genererat high: kommunikation: ikon palms ur definitionen, bugning light] |
| samtalsämne | skipped | – | – | image – ingen animation |
| avbryta | created | anim.avbryta.1 | communicate |  [genererat medium: kommunikation: ikon no ur definitionen] |
| skämta | created | anim.skämta.1 | communicate |  [genererat medium: kommunikation: ikon smile ur definitionen] |
| tystnad | skipped | – | – | image – ingen animation |
