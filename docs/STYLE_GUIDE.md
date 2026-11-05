# Stilguide

**Mål:** vänlig, modern bilderboksstil som läses på 140–180 px i iPhone Safari, och rörelser som är mjuka och naturliga – aldrig kusliga.

## Figur (nivå B, beslutad 2026-11-05)
- En grundfigur (`character.base`), tre varianter `a/b/c` med olika hud, hår och kläder. Ca 4 huvuden hög (80 enheter), stort huvud (r 11), bläckkontur 2.2, runda avslut.
- Rigg med leder: bål, huvud, överarm/underarm ×2, lår/underben ×2, fötter. **Ledgränser** i `src/engine/rig.ts`: armbågar böjs bara framåt, knän bara bakåt, huvud ±45°, bål ±95°. Poser utanför gränserna klipps – det är så kusliga ledvinklar undviks.
- Ansikte bär tillstånd: ögon `open · half · closed · wide`, bryn `neutral · up · down · worried`, mun `smile · calm · neutral · open · o · frown`, blick, rodnad, blinkningar var ~2,8 s.
- Vanthänder (greppande = rund), skor som pekar åt det håll figuren vänder sig. Den främre armen ritas framför ansiktet så att en lyft hand inte försvinner bakom huvudet.
- Inga stereotyper; varianterna ska kännas lika självklara.

## Fysik (gyllene regeln)
Inget får synbart strida mot fysiken: planterade fötter glider inte (gångmodell med fotplacering + IK, världen rullar vid behov), kroppen hänger ihop (bål mellan axel- och höftlinje, bäcken), tyngdlagen ger parabler för hopp och bollar, landningar har squash, föremål har volym (täcket ligger ovanpå). Se CLAUDE.md 2.4.

## Rörelse
- Alltid **anticipation → handling → tydligt slutläge med `hold`**. En handling läses på 2–4 s, loopar 3–6 s.
- Cykler (gå, springa, jogga) skrivs som täta nyckelbilder från sinusfunktioner, aldrig linjära hopp. Övergångar in/ut ur cykler eased.
- Easing: `easeOut` för ankomster, `easeInOut` för poser, `anticipate` för starter, `overshoot` bara i UI.
- Inga partiklar/blixtar. Rörelsestreck sparsamt. `zzz` bara som förstärkning av slutna ögon + säng + natt.

## Färg och miljö
- Paletten är Swechans wordArt-palett (`src/assets/palette.ts`). Pappersbakgrund `#f6f2ea`, nattvariant `#dcdfec`. Miljöer i låg kontrast; fönster visar tid på dygnet.
- UI-scener använder Fjord-tokens (`uiSuccess`, `uiPrimary`, `uiAccent`, `uiText`) och transparent bakgrund.

## Läsbarhet och pedagogik
- Det som bär betydelsen ska vara ≥ 6 enheter stort och synligt i posterbilden i 140 px.
- Designa mot grannordet: deklarera `contrast.with` och `distinctiveFeatures`. Testa utan etikett (`--label` av i bildremsan).
- Text i scener är tillåten när den läses utan ansträngning (etiketten, "Rätt!" i UI). Aldrig text som enda bärare av ett ords betydelse.
- Kulturellt överförbart Sverige ↔ Japan: inga västerländska djurmetaforer, inga gester som bara en kultur läser rätt.

## Granskning
- Varje scen: `anim:strip` + titta; kontrastpar: `anim:compare`. Anteckna i `docs/REVIEW_LOG.md`.
- Kända svagheter att arbeta vidare med: ansiktet i profil när figuren ligger; arm-IK väljer ibland armbåge uppåt i övergångar; soffa/säng är enkla volymer.
