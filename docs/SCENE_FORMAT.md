# Scenformat v1

En scen är en JSON-fil, `scenes/<lemma>/<animationId>.json`, validerad av `src/schema/scene.ts` (Zod; TypeScript-typerna härleds från schemat). Ingen kod, inga URL:er, ingen fri SVG/HTML. Okända fält avvisas.

## Toppnivå

| Fält | Typ | Betydelse |
|---|---|---|
| `schemaVersion` | `1` | Migreringar i `src/schema/migrate.ts` |
| `animationId` | `anim.<lemma>.<n>` / `ui.<grupp>.<namn>` | Unikt, permanent. `<n>` = betydelsens nummer i `senseId`; varianter `anim.<lemma>.<n>.v2` |
| `kind` | `word` (standard) / `ui` | `ui`-scener saknar miljö och ritas transparent utan rundade hörn |
| `senseId` | `s.<lemma>.<n>` | Swechans betydelse-ID; krävs för `word` |
| `titleSv`, `meaningHint`, `category` | | `category`: action · state · property · relation · emotion · abstract · ui |
| `durationMs`, `loop`, `holdMs`, `posterMs` | | `holdMs` = paus på slutbilden innan omstart; `posterMs` = stillbilden (standard 60 %) |
| `canvas` | `{w,h}` | Standard 120×120 (Swechans bildruta). UI-scener väljer fritt, t.ex. 360×120 |
| `environment` | `{id, time, ground?}` | `neutral · room · bedroom · kitchen · outdoors.park · street`; `time`: day · evening · night |
| `actors[]` | | `id`, `asset: character.base`, `variant: a|b|c`, `at {x,y}` (fötternas punkt), `facing`, `scale`, `wardrobe {top,bottom,shoes,hair,skin,hairStyle,headband}`, `face` |
| `props[]` | | `id`, `asset`, `at` **eller** `attachTo {actor, hand}`, `scale`, `rotate`, `z`, `state`, `color` |
| `shapes[]` | | Fria former: `rect`, `circle`, `text` (alltid på vitt i ordscener: `bg: pill | bubble | panel`, `tail {x,y}` för bubblans svans, `pad`), `icon` (check, cross, star, arrow-right, arrow-up, arrow-down, arc-arrow, flag, heart, exclaim) – `progress` ritar på |
| `timeline[]` | | Handlingar med `t` (ms). Kompileras i tidsordning |
| `focus` | `{targets[], feature}` | Vad som måste synas (layoutkontrollen) |
| `contrast` | `{with[], distinctiveFeatures[]}` | Kontrastpar och maskinläsbara skillnader (nedan) |
| `pedagogy` | | `quizEligible`, `group`, `confusableWith[]`, `reviewStatus` (`ai-draft` · `validated` · `reviewed` + `reviewer` + `date`), `note` |
| `label` | `{sv?, show}` | `never · optional · always` – etikett i en pill längst ner |

Koordinater i dukenheter, origo uppe till vänster, markplan y ≈ 100. Färger: palettnyckel (`navy`, `sky`, `uiSuccess` …) eller CSS-färg.

## Föremål och tillstånd

| asset | tillstånd | ankare |
|---|---|---|
| `glass` | `fill` 0..1 | mouth = rim |
| `jug` | `tilt` 0..1, `level` 0..1, `stream` | grip = handtag (bak), mouth = pip (fram) |
| `door` | `angle` 0..1 | grip = handtag |
| `box` | `lidOpen` | |
| `ball`, `mug`, `phone` | (`mug.level`, `phone.on`) | grip |
| `sofa`, `bed` | – | `seat` används av `relax`/`sleep` |
| `blanket` | `cover` 0..1, `length`, `bulge` | förankrat vid fotänden på madrasskanten; puckeln följer kroppen; högre `z` än aktören |
| `football` | – | boll för `kickups` |
| `ladder` | `length`, `lean` 0..1 | står på marken; 0 = ligger, 1 = rest mot vägg (72°) |
| `castle` | `flag` (färg), `gate` 0..1, `w`, `h` | mur med torn och fana; porten öppnas |
| `brawl` | `intensity` 0..1, `phase` (tweena 0→N för skakning) | tecknat slagsmålsmoln med stjärnor och nävar |
| `box` | `w`, `h`, `lidOpen` | |
| `table`, `window`, `mat` | (`window.time` följer miljön) | |
| `castle` (forts.) | `raise` 0..1 hissar `banner` (färg) och halar `flag`; `broken` 0..1 | |
| `stove` | `heat` 0..1 | mouth = plattan (pannans `at` sätts där: `y = marken − 30`) |
| `pan` | `contents: none|egg|pancake|butter|onion|steak`, `browning` 0..1 (blek → gyllene → brun), `top` (synliga sidans färg efter vändning), `burnt` 0..1 (svart + rök), `melt` 0..1, `toss` 0..1, `sizzle` 0..1 + `phase`, `splash` (−1 av, 0..1 fas) | grip = handtagets ände (åt +x), mouth = pannans mitt |
| `spatula` | – | hålls upprätt, bladet nedåt; `tilt` via handlingen |

Ett föremål med `attachTo` ritas i aktörens hand, upprätt; `tilt` roterar det framåt kring greppet (55° vid 1).

## Handlingar

| handling | parametrar | ger |
|---|---|---|
| `walk` / `run` | `actor, to, durationMs?` | gångmodell med fotplacering (inga glidande fötter); räcker inte duken rullar miljön (`env.scrollX`) i resterande hastighet med parallax och fartstreck |
| `jump` | `actor, height, to?, durationMs` | anticipation, luft (`lift`), landning |
| `turn` | `actor, facing` | |
| `idle` | `actor, durationMs, style: breathe|footWiggle|none` | |
| `reach` / `grab` / `release` | `actor, hand, target|prop, at?, z?` | IK mot målet; `grab` fäster, `release` lossar och placerar (`z` för *bakom*) |
| `pour` | `actor, from, into, amount, durationMs` | kärlet lutar, stråle, nivån stiger i målet, kärlet töms |
| `open` / `close` | `actor, prop` | hand till handtag, dörr/lock svänger |
| `sip` | `actor, prop` | |
| `lookAt` | `actor, target` | blick + huvud |
| `relax` | `actor, on, durationMs, legsUp` | sitter tillbakalutad på möbeln, ögon halvöppna, fot vickar, telefon-tumme |
| `sleep` | `actor, on, durationMs, zzz` | ligger, ögon slutna, långsam andning, valfria z |
| `exercise` | `actor, kind: jog|stretch|kickups, durationMs, ball?` | `kickups` kräver en `football`/`ball`-prop: bollen studsar i parabel mot knät |
| `express` | `actor, emotion: happy|surprised|angry|sad|tired|content` | ansikte + hållning |
| `face` | `actor, eyes?, brows?, mouth?, gaze?` | direkt ansiktsstyrning |
| `pose` | `actor, joints{}, durationMs, ease, lift?, bodyRotate?` | lågnivå (undvik i vanliga scener) |
| `set` / `tween` | `target, prop, value|to, from?, durationMs, ease` | vilken spårbar egenskap som helst: `x y opacity scale rotate w h r progress`, ledvinklar, föremålstillstånd |
| `emphasis` | `target, kind: ring|glow|arrowDown` | markering |
| `roll` | `prop, to, durationMs, z?` | föremål rullar på marken: konstant inbromsning, rotation = sträcka/radie |
| `climb` | `actor, prop (ladder), durationMs` | klättrar längs en rest stege |
| `cook` | `actor, pan, kind: fry|brown|sear|burn|melt, hand, tool?, durationMs` | handen på handtaget (IK följer pannans skakningar), spisen under pannan tänds, fräsmärken, råvaran byter färg så långt `kind` säger; `sear` kastar innehållet; `tool` (hållen stekspade) petar då och då |
| `flip` | `actor, pan, tool?, durationMs` | med `tool`: spaden under, snabbt lyft, maten flyger upp och vänder; utan: pannan kastar. Den stekta sidan (`browning`) blir `top` |
| `splash` | `pan, actor?, durationMs` | fettdroppar flyger ur pannan i parabler (två skurar); aktören ryggar med vida ögon och skyddande arm |

Easing: `linear easeIn easeOut easeInOut anticipate overshoot bounce step`.

## Kontrastpar – maskinläsbara skillnader

`contrast.distinctiveFeatures` kontrolleras i den egna scenen (måste gälla) och i partnerscenen (minst en får **inte** gälla):

```
actor.<id>.eyes:<open|half|closed|wide>[>=andel]     actor.<id>.posture:<standing|reclined|lying>[>=andel]
environment.time:<day|evening|night>                 prop:<asset>
motion:<actor>[>=andel]                              speed:<actor>>=u/s | <=u/s
airborne:<actor>>=andel | <=andel                    peaklift:<actor>>=enheter | <=enheter
end:<prop>.<tillstånd>>=värde | <=värde
```

## Exempel

Se `scenes/slappa/anim.slappa.1.json` (tillstånd med kontrastpar), `scenes/hälla/anim.hälla.1.json` (orsak–verkan) och `scenes/ui/ui.feedback.correct.json` (gränssnitt).

## Mallar (begreppsfamiljer) och kontrakt

Varje ordscen anger `template`. Kontraktet kontrolleras av validatorn; produktägaren godkänner mallar i `registry/templates.json`.

| Mall | Används för | Kontrakt |
|---|---|---|
| `locomotion` | gå, springa, hoppa … | minst en aktör; `walk`/`run`/`jump`; rörelse ≥ 40 % |
| `manipulate-prop` | öppna, hälla, knäppa … | aktör + föremål; en föremålshandling |
| `relation-arrow` | bakom, framför, under … | inga människor; ≥ 2 föremål; pil-ikon; japanskt ord |
| `property-contrast` | sportig, tung, ren … | ≥ 2 entiteter; kontrastpar deklarerat |
| `emotion` | arg, glad, förvånad … | aktör; `express` |
| `state` | slappa, sova, vila … | aktör; `relax`/`sleep`/`idle`; kontrastpar |
| `event` | stormning, flytt, fest … | ≥ 2 aktörer; ≥ 1 föremål |
| `attribute-gloss` | sportig, randig, skrynklig, mogen … | ≥ 1 entitet som bär egenskapen; japanskt ord på vitt; ingen verbhandling. **Standardmall för egenskaper** (normativ 2026-11-05) |
| `cook-rhythm` | steka, bryna, fräsa, smälta, vända, bränna, skvätta | aktör; `pan` + `stove`; `cook`/`flip`/`splash`. Verben skiljs genom hur långt färgen går, tempot och följden |
| `ui` | paneler, bockar | – |

Extra `has:`-features för kontrakt och kontrastpar: `has:actors>=N`, `has:actors==0`, `has:props>=N`, `has:entities>=N`, `has:action:a|b`, `has:icon:a|b`, `has:cjk-text`, `has:contrast`.
