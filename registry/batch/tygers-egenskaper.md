# Batch: Tygers egenskaper (m.tygers-egenskaper)

Skapade 8 utkast, 0 fanns, 1 ej animation, 0 bild, 0 blockerade (svagt recept, ingen scen), 6 manuella (verktyget säger ifrån – se anmärkningen), 0 ogiltiga, 0 utan recept.

**Regel:** ett utkast är klart först när remsan är granskad och blindtestet godkänt (`anim:blindtest`). Rader märkta ⚠ har ett recept med känd svaghet – läs anmärkningen och förbättra scenen eller receptet innan blindtest. Rader med status *manual* kan verktyget inte göra själv: följ anmärkningen och `docs/MANUAL_SCENES.md`, och lägg det du lär dig i `src/tools/lexicon.ts` så att nästa liknande ord går automatiskt.

| Ord | Status | Scen | Mall | Anmärkning |
|---|---|---|---|---|
| egenskap | skipped | – | – | image – ingen animation |
| vattentät | created | anim.vattentät.1 | attribute-gloss |  [genererat high: egenskap i tabellen] |
| vindtät | created | anim.vindtät.1 | attribute-gloss |  [genererat high: egenskap i tabellen] |
| andas | manual | – | – | MANUELLT – verbet andas passar ingen känd familj utifrån definitionen "Om tyg: släppa igenom luft, så att man inte blir svettig." • hittade föremål: garment.shirt • avgör familj (verktygsarbete, process, ordna, kommunikation, förflyttning …) och skriv ett recept enligt docs/WORD_FUNCTIONS.md – eller "ingen visualisering" • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| luftig | created | anim.luftig.1 | attribute-gloss |  [genererat high: egenskap i tabellen] |
| varmhållande | created | anim.varmhållande.1 | attribute-gloss |  [genererat high: egenskap i tabellen] |
| isolera | manual | – | – | MANUELLT – verbet isolera passar ingen känd familj utifrån definitionen "Göra så att värme eller kyla inte kommer igenom." • hittade föremål: fixture.radiator • avgör familj (verktygsarbete, process, ordna, kommunikation, förflyttning …) och skriv ett recept enligt docs/WORD_FUNCTIONS.md – eller "ingen visualisering" • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| snabbtorkande | created | anim.snabbtorkande.1 | attribute-gloss |  [genererat high: egenskap i tabellen] |
| töjbar | created | anim.töjbar.1 | attribute-gloss |  [genererat high: egenskap i tabellen] |
| elastisk | manual | – | – | MANUELLT – samma bild som *töjbar* – två ord får inte ha identiska scener • skilj dem åt (föremål, tillstånd, tempo, slutläge) eller markera det ena som synonym i receptet • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| styv | manual | – | – | MANUELLT – styv: styvhet syns bara mot något som böjer sig – en kontrastbyggsten (böjd mot rak) saknas • bygg byggstenen eller skriv en handscen enligt docs/MANUAL_SCENES.md • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| tålig | created | anim.tålig.1 | attribute-gloss |  [genererat high: egenskap i tabellen] |
| genomskinlig | created | anim.genomskinlig.1 | attribute-gloss |  [genererat high: egenskap i tabellen] |
| smutsavvisande | manual | – | – | MANUELLT – smutsavvisande: föremålet sofa hittades men inget tillstånd visar egenskapen • välj ett tillstånd på sofa som visar smutsavvisande (eller en kontrast a/b) och lägg till i PROPERTIES • en figur som bara säger ordet är inte en bärare • liknande lösta ord: vass, grov, jämn (registry/recipes.json) • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| brandfarlig | manual | – | – | MANUELLT – bara familjen är säker (abstrakt: ikon flame ur definitionen) – förslag: {"template":"attribute-gloss","bearer":{"kind":"icon","icon":"flame","env":"neutral"}} • bekräfta eller ändra förslaget och skriv det som regel i lexicon.ts eller recept i recipes.json • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
