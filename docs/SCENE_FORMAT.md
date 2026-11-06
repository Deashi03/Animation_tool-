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

### Föremålsfamiljer (`<familj>.<form>`)

Katalogblad: `npm run anim:props -- --filter <familj>` → `review/sheet/props-<familj>.png`. Alla är ritfunktioner av sitt tillstånd; okänt id ger ett schemafel med förslag.

| familj | former | tillstånd (0..1 om inget annat anges) |
|---|---|---|
| `tool.*` (hålls i handen, spetsen nedåt, `heldTilt` svänger spetsen framåt) | knife, masher, spoon, ladle, fork, whisk, peeler, grater, rollingpin, brush, toothbrush, cloth, sponge, broom, mop, hammer, saw, drill, screwdriver, pen, iron, shaker, scraper, razor, scissors, needle, paintbrush, roller, tongs, nozzle | `tilt` (sätts av `use`) |
| `container.*` (står på en yta, `mouth` = där innehåll/arbete sker) | bowl, pot, plate, board, bucket, bin, bag, basket, cup, bottle, jar, tray, tub, suitcase, crate | bowl: `fill`, `mixed`, `foam`, `contents` (färg); pot: `fill`, `boil` (0.3 = sjuda, 1 = koka), `steam`, `lid`, `phase`; plate: `food`, `dirty`; bucket/cup: `fill`, `steam`; bin/suitcase: `open`, `full`; tub: `foam` |
| `food.*` (ligger på bräda/tallrik/bord) | apple, banana, carrot, tomato, onion, potato, bread, dough, egg, cheese, pile, fish, pancake, cake | `pieces` (skivas), `peeled`, `ripeness` (grön → gul → röd), `rot` (fläckar, mögel), `mashed`, `squash`; dough: `rise`, `flat`; egg: `cracked`; cheese: `grated`; bread: `toast`; pile: `amount`, `contents` |
| `fixture.*` (inventarier och sådant som förändras av sig självt) | lamp, candle, tap, sink, shower, ice, fire, plant, flower, puddle, drip, washingmachine, oven, fridge, microwave, radiator, clothesline, hanger, ironingboard, chair, shelf, wall, bike, cart, tent, tree, bush, cloud, sun, clock, scale, mirror, toilet, cow, hen, nest | `on`, `lit`, `flow`, `melt`, `burn`, `smoke`, `grow`, `wilt`, `bloom`, `size`, `spin`, `open`, `paint`, `paper`, `flake`, `rain`, `dark`, `hour`/`minute`, `weight`, `flush`, `items`, `eggs`, `phase` |
| `garment.*` (plagg som föremål) | shirt, trousers, sock, towel, dress, jacket | `folded`, `hanging`, `wrinkled`, `wet`, `stain`, `shrink`, `faded`, `phase` |

Figurens **garderob** (`actors[].wardrobe`): `top`, `bottom`, `shoes`, `hair`, `skin`, `hairStyle`, `headband`, `shorts`, `number` (tröjnummer), `hat` (`none` = ingen), `glasses`, `scarf`, `buttons` 0..1 (stängda; odefinierad = inga knappar), `zipper` 0..1, `sleeves` long|short|rolled, `apron`, `laces`. Allt kan animeras via spåren `<aktör>.w.<nyckel>` (handlingarna `dress`/`fasten` gör det).

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
| `use` | `actor, on, tool?, hand (standard: närmaste), motion, durationMs, periodMs?, effect[], offset?, bothHands` | **generellt verktygsarbete**: handen (med verktyget, fästs automatiskt) går till målets `mouth` och utför ett mönster – `chop tap press knead saw wipe scrub sweep spread brush stir whisk pull peel grate sprinkle squeeze hold roll` – medan `effect` tweenar målets tillstånd (`{key, to, from?, at?, prop?}`). Slag skakar målet, `sprinkle` strör korn, `knead`/`press` trycker ihop målet (`squash`) |
| `say` | `actor, icon? | text? (≤14), mood: neutral|happy|angry|sad|question|surprised, to?, durationMs, gesture` | pratbubbla på vitt som följer huvudet (ikon eller kort text), munnen rör sig, bryn efter stämning, liten handgest; `to` vänder båda mot varandra |
| `sound` | `target, kind: hum|ring|bark|thump|crunch|splash, durationMs` | ljudbågar `)))` eller slagstreck intill källan |
| `give` | `from, to, prop, durationMs` | båda sträcker sig, föremålet byter hand mitt i |
| `put` / `take` | `actor, prop, on? | at?, z?` / `actor, prop, hand` | ställa ner på ett föremåls topp (`mouth`) eller en punkt; plocka upp (= `grab`) |
| `dress` | `actor, garment: top|bottom|shoes|hat|glasses|scarf|apron, on, value? (färg), durationMs` | plaggets koreografi (armar över huvudet, böja sig, lyfta foten …); garderoben byts mitt i |
| `fasten` | `actor, what: buttons|zipper|laces|sleeves, on, durationMs` | händer vid skjortfronten/skon/ärmen; knapparna stängs en i taget, dragkedjan tweenas, snören knyts, ärmar kavlas |

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
| `property-contrast` | tung/lätt, ren/smutsig, full/tom | ≥ 2 entiteter; bärare; japanskt ord |
| `emotion` | arg, glad, förvånad … | aktör; `express` |
| `state` | slappa, sova, vila … | aktör; `relax`/`sleep`/`idle`; kontrastpar |
| `event` | stormning, flytt, fest … | ≥ 2 aktörer; ≥ 1 föremål |
| `attribute-gloss` | vass, slö, grov, sportig, randig, mogen … | **bärare** (`has:bearer`: föremål, ikon, klädseldetalj eller kroppslig handling); japanskt ord på vitt; ingen verbhandling. **Standardmall för egenskaper** (normativ 2026-11-05). Godkänd av produktägaren |
| `cook-rhythm` | steka, bryna, fräsa, smälta, vända, bränna, skvätta | aktör; `pan` + `stove`; `cook`/`flip`/`splash`. Verben skiljs genom hur långt färgen går, tempot och följden |
| `tool-rhythm` | skära, hacka, vispa, röra, knåda, kavla, skala, riva, mosa, salta, vika, stryka, borsta, såga, odla, mjölka … | aktör; ≥ 1 föremål; `use`; råvaran/ytan ändrar tillstånd |
| `process` | koka, sjuda, smälta, mogna, ruttna, brinna, släcka, droppa, rinna, läcka, jäsa, växa, vissna, flagna, regna, krympa, blekna, brumma, dunka | inga människor; ≥ 1 föremål; `tween`/`set`/`sound` |
| `communicate` | beställa, klaga, varna, skämta, förklara, rekommendera, köa; ursäkta/tacka/hälsa med `bow` | aktör; `say`; gest-ikon bara tillsammans med kroppslig handling |
| `social` | lämna över, ge, skicka, bjuda på | ≥ 2 aktörer; föremål; `give` |
| `arrange` | duka, packa, stapla, hänga upp, slänga, plocka undan | ≥ 1 aktör; föremål; `put`/`take` – föremålet hamnar synligt på platsen |
| `dress-self` | ta på/av sig, klä på/av sig, byta om, knäppa (upp), dra upp/ner, kavla upp, knyta, sätta på sig | aktör; `dress`/`fasten` |
| `ui` | paneler, bockar | – |

Garderob: `wear:<aktör>.<nyckel>>=v | <=v | ==värde` (vid slutet), `wear-start:…` (vid starten, t.ex. `wear-start:p.top==red`, `wear:p.buttons>=0.9`). Tal och ljud: `has:say-icon:a|b`, `has:say-mood:a|b`, `has:sound:a|b`, `has:prop:asset|asset`.

Extra `has:`-features för kontrakt och kontrastpar: `has:actors>=N`, `has:actors==0`, `has:props>=N`, `has:entities>=N`, `has:action:a|b`, `has:icon:a|b`, `has:cjk-text`, `has:contrast`, `has:bearer`, `has:emphasis:a|b`, `has:express:a|b`, `has:walk-manner:normal|careful`, `has:bow:light|deep`.

**Bärar-regeln:** varje ordscen (alla mallar utom `ui`) måste ha en bärare – annars fel. Vad som räknas som bärare och vilken förinställd lösning varje ordfunktion har står i `docs/WORD_FUNCTIONS.md`. Receptformatet för `anim:batch` står där också.
