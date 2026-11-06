# Batch: Flytta till ny bostad (m.flytta-till-ny-bostad)

Skapade 6 utkast, 0 fanns, 5 ej animation, 0 bild, 0 blockerade (svagt recept, ingen scen), 4 manuella (verktyget säger ifrån – se anmärkningen), 0 ogiltiga, 0 utan recept.

**Regel:** ett utkast är klart först när remsan är granskad och blindtestet godkänt (`anim:blindtest`). Rader märkta ⚠ har ett recept med känd svaghet – läs anmärkningen och förbättra scenen eller receptet innan blindtest. Rader med status *manual* kan verktyget inte göra själv: följ anmärkningen och `docs/MANUAL_SCENES.md`, och lägg det du lär dig i `src/tools/lexicon.ts` så att nästa liknande ord går automatiskt.

| Ord | Status | Scen | Mall | Anmärkning |
|---|---|---|---|---|
| flytta | created | anim.flytta.1 | arrange |  [genererat high: ställa/ta-verb i tabellen] |
| packa | created | anim.packa.1 | arrange |  [genererat high: ställa/ta-verb i tabellen] |
| packa upp | created | anim.packa-upp.1 | arrange |  [genererat high: ställa/ta-verb i tabellen] |
| flyttkartong | skipped | – | – | image – ingen animation |
| märka | manual | – | – | MANUELLT – bara familjen är säker (verktygsverb i tabellen utan synlig följd) – förslag: {"template":"tool-rhythm","motion":"wipe","effects":[],"env":"kitchen","tool":"tool.pen","target":"container.crate","surface":null,"period":500,"note":"ingen synlig följd – verktyget rör sig bara; lägg till ett tillstånd på container.crate som ändras"} • bekräfta eller ändra förslaget och skriv det som regel i lexicon.ts eller recept i recipes.json • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| ömtålig | manual | – | – | MANUELLT – ömtålig: föremålet glass hittades men inget tillstånd visar egenskapen • välj ett tillstånd på glass som visar ömtålig (eller en kontrast a/b) och lägg till i PROPERTIES • en figur som bara säger ordet är inte en bärare • liknande lösta ord: vass, grov, jämn (registry/recipes.json) • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| bubbelplast | skipped | – | – | image – ingen animation |
| tejp | skipped | – | – | image – ingen animation |
| tejpa | manual | – | – | MANUELLT – tejpa: byggsten saknas i katalogen – tejp • lägg till föremålet i src/assets/props/ (med tillstånd som visar följden) och ett recept i lexicon.ts • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| flyttfirma | skipped | – | – | image – ingen animation |
| flyttbil | skipped | – | – | image – ingen animation |
| flyttstäda | created | anim.flyttstäda.1 | tool-rhythm |  [genererat high: verktygsverb i tabellen] |
| lämna | created | anim.lämna.1 | locomotion |  [genererat high: förflyttningsverb] |
| sakna | created | anim.sakna.1 | emotion |  [genererat high: känsloverb i tabellen] |
| inflyttningsfest | manual | – | – | MANUELLT – aktivitetssubstantiv: en händelse med flera figurer måste komponeras per ord • välj verbet bakom substantivet och använd dess recept (t.ex. "tvätt" → tvätta), eller skriv en event-scen • liknande lösta ord: sova middag, äta ute, storma (registry/recipes.json) • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
