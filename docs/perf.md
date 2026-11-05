# Prestanda (2026-11-05)

Mätt i Chromium (Playwright) med iPhone 13-emulering och **4× CPU-strypning** på byggmaskinen, 3 s uppspelning per scen i studions spelare. Det är inte en fysisk iPhone; siffrorna visar relativ kostnad och var det finns risk, inte en garanti.

| Scen | fps | p95 ruta (ms) | längsta lucka (ms) | långa uppgifter | SVG-noder | scenfil (B) |
|---|---|---|---|---|---|---|
| anim.springa.1 | 60.2 | 16.7 | 17 | 0 (0 ms) | 59 | 1207 |
| anim.steka.1 | 60.3 | 16.7 | 17 | 0 (0 ms) | 60 | 1702 |
| anim.vända.1 | 60.5 | 16.8 | 17 | 0 (0 ms) | 69 | 2038 |
| anim.stormning.1 | 59.6 | 16.8 | 33 | 0 (0 ms) | 182 | 5477 |
| anim.koka.1 | 60.2 | 16.8 | 17 | 0 (0 ms) | 37 | 1977 |
| anim.beställa.1 | 59.9 | 16.7 | 33 | 0 (0 ms) | 98 | 2138 |
| anim.klä-på-sig.1 | 60.2 | 16.8 | 17 | 0 (0 ms) | 39 | 1900 |
| anim.hacka.1 | 59.2 | 16.8 | 50 | 0 (0 ms) | 118 | 2185 |
| anim.bakom.1 | 60.2 | 16.8 | 17 | 0 (0 ms) | 40 | 2645 |
| ui.module.complete | 60.2 | 16.7 | 17 | 0 (0 ms) | 28 | 3663 |

Riktvärden: ≤ 150 SVG-noder per scen (6.3 i CLAUDE.md), inga långa uppgifter under uppspelning, p95 under 33 ms (30 fps) på strypt CPU. Spelaren renderar hela bildträdet per ruta (ingen diff av transformer); om p95 överskrids är nästa steg att bara uppdatera transformer för aktörer och föremål.
