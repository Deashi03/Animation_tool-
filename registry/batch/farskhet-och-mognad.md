# Batch: Färskhet och mognad (m.farskhet-och-mognad)

Skapade 12 utkast, 0 fanns, 1 ej animation, 0 bild, 0 blockerade (svagt recept, ingen scen), 2 manuella (verktyget säger ifrån – se anmärkningen), 0 ogiltiga, 0 utan recept.

**Regel:** ett utkast är klart först när remsan är granskad och blindtestet godkänt (`anim:blindtest`). Rader märkta ⚠ har ett recept med känd svaghet – läs anmärkningen och förbättra scenen eller receptet innan blindtest. Rader med status *manual* kan verktyget inte göra själv: följ anmärkningen och `docs/MANUAL_SCENES.md`, och lägg det du lär dig i `src/tools/lexicon.ts` så att nästa liknande ord går automatiskt.

| Ord | Status | Scen | Mall | Anmärkning |
|---|---|---|---|---|
| mogna | created | anim.mogna.1 | process |  [genererat high: processverb i tabellen] |
| omogen | created | anim.omogen.1 | attribute-gloss |  [genererat high: egenskap i tabellen] |
| övermogen | created | anim.övermogen.1 | attribute-gloss |  [genererat high: tillståndet rot=0.45 på food.banana (ur definitionen)] |
| fräsch | created | anim.fräsch.1 | attribute-gloss |  [genererat medium: tillståndet ripeness=0.9 på food.apple (standardföremål)] |
| nybakad | created | anim.nybakad.1 | attribute-gloss |  [genererat high: tillståndet toast=0 på food.bread (ur definitionen)] |
| dagsfärsk | created | anim.dagsfärsk.1 | attribute-gloss |  [genererat medium: tillståndet ripeness=0.9 på food.apple (standardföremål)] |
| vissen | created | anim.vissen.1 | attribute-gloss |  [genererat high: tillståndet wilt=1 på fixture.plant (ur definitionen)] |
| slokig | created | anim.slokig.1 | attribute-gloss |  [genererat medium: tillståndet wilt=1 på fixture.flower (standardföremål)] |
| mögel | skipped | – | – | image – ingen animation |
| möglig | created | anim.möglig.1 | attribute-gloss |  [genererat medium: tillståndet mold=1 på food.apple (standardföremål)] |
| ruttna | created | anim.ruttna.1 | process |  [genererat high: processverb i tabellen] |
| rutten | created | anim.rutten.1 | attribute-gloss |  [genererat high: egenskap i tabellen] |
| skämd | created | anim.skämd.1 | attribute-gloss |  [genererat medium: tillståndet rot=0.65 på food.apple (standardföremål)] |
| härsken | manual | – | – | MANUELLT – egenskapen härsken har ingen bärare: definitionen "Om fett, nötter eller olja: som smakar och luktar gammalt och illa." nämner inget föremål i katalogen och ingen känd symbol • hitta ett typexempel: föremål med tillstånd, klädseldetalj, kontrastpar eller kulturneutral ikon – annars "ingen visualisering" • liknande lösta ord: vass, grov, jämn (registry/recipes.json) • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
| unken | manual | – | – | MANUELLT – egenskapen unken har ingen bärare: definitionen "Som luktar gammalt, som ett rum där ingen luft har kommit in på länge." nämner inget föremål i katalogen och ingen känd symbol • hitta ett typexempel: föremål med tillstånd, klädseldetalj, kontrastpar eller kulturneutral ikon – annars "ingen visualisering" • liknande lösta ord: vass, grov, jämn (registry/recipes.json) • läs docs/MANUAL_SCENES.md: arbetsgång, checklista och vad som gått fel förut |
