# Batch: Grannar och störningar (m.grannar-och-storningar)

Skapade 3 utkast, 0 fanns, 6 ej animation, 0 bild, 0 blockerade (svagt recept, ingen scen), 7 manuella (verktyget säger ifrån – se anmärkningen), 0 ogiltiga, 0 utan recept.

**Regel:** ett utkast är klart först när remsan är granskad och blindtestet godkänt (`anim:blindtest`). Rader märkta ⚠ har ett recept med känd svaghet – läs anmärkningen och förbättra scenen eller receptet innan blindtest. Rader med status *manual* kan verktyget inte göra själv: följ anmärkningen och `docs/MANUAL_SCENES.md`, och lägg det du lär dig i `src/tools/lexicon.ts` så att nästa liknande ord går automatiskt.

| Ord | Status | Scen | Mall | Anmärkning |
|---|---|---|---|---|
| störa | created | anim.störa.1 | communicate |  [genererat medium: kommunikation: ikon no ur definitionen] |
| klagomål | skipped | – | – | image – ingen animation |
| störning | manual | – | – | MANUELLT – bara familjen är säker (verbet bakom: störa; kommunikation: ikon no ur definitionen) – förslag: {"template":"communicate","say":{"icon":"no","mood":"angry"},"note":"aktivitetssubstantiv: samma bild som verbet störa"} • bekräfta eller ändra förslaget och skriv det som regel i lexicon.ts eller recept i recipes.json • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| oväsen | skipped | – | – | image – ingen animation |
| lyhörd | manual | – | – | MANUELLT – bara familjen är säker (abstrakt: ikon house ur definitionen) – förslag: {"template":"attribute-gloss","bearer":{"kind":"icon","icon":"house","env":"neutral"}} • bekräfta eller ändra förslaget och skriv det som regel i lexicon.ts eller recept i recipes.json • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| ordningsregel | skipped | – | – | image – ingen animation |
| hänsyn | skipped | – | – | image – ingen animation |
| anslagstavla | skipped | – | – | image – ingen animation |
| festa | manual | – | – | MANUELLT – verbet festa passar ingen känd familj utifrån definitionen "Ha fest, ofta med musik och många gäster." • hittade föremål: inga • avgör familj (verktygsarbete, process, ordna, kommunikation, förflyttning …) och skriv ett recept enligt docs/WORD_FUNCTIONS.md – eller "ingen visualisering" • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| kvällstid | manual | – | – | MANUELLT – adverb utan sätt-regel: hur ser det ut när någon gör något på detta sätt? • lägg till ordet i PROPERTIES med manner eller icon i src/tools/lexicon.ts • liknande lösta ord: vass, grov, jämn (registry/recipes.json) • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| dunka | created | anim.dunka.1 | process |  [genererat high: processverb i tabellen] |
| skälla | manual | – | – | MANUELLT – skälla: byggsten saknas i katalogen – hund • lägg till föremålet i src/assets/props/ (med tillstånd som visar följden) och ett recept i lexicon.ts • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| vänlig | manual | – | – | MANUELLT – egenskapen vänlig har ingen bärare: definitionen "Trevlig och snäll mot andra." nämner inget föremål i katalogen och ingen känd symbol • hitta ett typexempel: föremål med tillstånd, klädseldetalj, kontrastpar eller kulturneutral ikon – annars "ingen visualisering" • liknande lösta ord: vass, grov, jämn (registry/recipes.json) • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| ursäkta | created | anim.ursäkta.1 | communicate |  [genererat high: kommunikation: ikon palms ur definitionen, bugning deep] |
| sänka | manual | – | – | MANUELLT – verbet sänka passar ingen känd familj utifrån definitionen "Göra något lägre, till exempel ljudet." • hittade föremål: inga • avgör familj (verktygsarbete, process, ordna, kommunikation, förflyttning …) och skriv ett recept enligt docs/WORD_FUNCTIONS.md – eller "ingen visualisering" • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| grannsämja | skipped | – | – | image – ingen animation |
