# Ordfunktioner och förinställda lösningar (normativ, 2026-11-05)

Verktyget ska kunna illustrera **varje ord i svenskan**. Det går bara om varje vanlig *funktion* ett ord kan ha har en förinställd lösning: en mall, en regel för vad som bär betydelsen, och en regel för text. Den här filen är den regeln. Recepten i `registry/recipes.json` är tillämpningar av den; `anim:batch` bygger scener av recepten; validatorn stoppar scener som bryter mot den.

## Grundprincipen

> **Varje ordscen måste visa ett typexempel.** Något i bilden – ett föremål, en förändring, en rörelse, en klädseldetalj, en ikon eller en kroppslig handling – ska *i sig* peka på ordet. Text (japansk gloss) förklarar, den bär aldrig ensam.

Validatorn upprätthåller detta med **bärar-regeln**: en ordscen utan bärare är ett fel (`scenen saknar bärare …`). Som bärare räknas ett föremål, en ikon, en klädseldetalj (inklusive uttryckligt vald färg på tröja/byxor/skor), en kroppslig handling (`use`, `cook`, `dress`, `express`, `relax`, …) eller en pratbubbla **med ikon**. En figur som bara säger ordet är **inte** en bärare.

## Tabellen: funktion → förinställd lösning

| Ordets funktion | Exempel | Mall | Vad som bär betydelsen (obligatoriskt) | Text | Förbjudet |
|---|---|---|---|---|---|
| **Förflyttning** | gå, springa, hoppa, smyga, halka | `locomotion` | gångcykel/hopp med rätt tempo och hållning; världen rullar om figuren går fortare än duken | ingen | glidande fötter, stel figur som flyttas |
| **Handling på ett föremål** | öppna, hälla, dricka, äta, knäppa | `manipulate-prop` | handen orsakar en synlig förändring i föremålet (`angle`, `fill`, `lidOpen`, biten försvinner) | ingen | förändring utan hand, hand utan förändring |
| **Verktygsarbete / rytmiskt verb** | skära, hacka, vispa, röra, knåda, skala, borsta, såga | `tool-rhythm` | verktyg i hand + råvara/yta som **ändrar form eller tillstånd** (`parts`, `foam`, `pile`, `peel`) i takt med rörelsen; tempot skiljer grannar (hacka > skära) | ingen | verktyg som rör sig över något som inte förändras |
| **Matlagning i panna** | steka, bryna, fräsa, bränna, vända, skvätta | `cook-rhythm` | panna på tänd platta; innehållets färg/fräs går *så långt som verbet säger* (`browning`, `burnt`, `sizzle`); vändning/skvätt som egen handling | ingen | samma slutläge för steka och bränna |
| **Process utan människa** | koka, sjuda, smälta, mogna, brinna, droppa, krympa, blekna | `process` | ett föremål i närbild vars tillstånd tweenas; effekter (bubblor, ånga, droppar) sitter fast vid föremålet; grad och tempo skiljer grannar | ingen | människor; pratbubbla |
| **Tal och kommunikation** | beställa, klaga, varna, förklara, fråga | `communicate` | pratbubbla **med ikon** som visar innehållet (bestick, utropstecken, fråga) + mun/bryn/hållning + motpartens reaktion | ikon, ej ord | bubbla med enbart det japanska ordet; **gest-ikon (hand, palms, wave) utan kroppslig handling** |
| **Artighet och ritual** | ursäkta, be om ursäkt, tacka, hälsa, buga | `communicate` med `say.bow` | **kroppen bär**: en bugning (`bow`, djup för förlåt, lätt för tack), händerna ihop, 🙏-ikonen (`palms`) i bubblan, en synlig orsak (spilld kopp) och motpartens mjuknande | ikon | en gest i bubblan som enda bärare – gester läses olika i olika kulturer och en ikon med ett utstickande finger blev ett långfinger |
| **Sätt att röra sig** | försiktig, varsam, hastig | `attribute-gloss` (`bearer.kind: manner`) | gången själv ändras (`walk.manner: careful` = korta långsamma steg, nästan ingen armpendling, blicken ner) och något som står på spel (ett fullt glas i handen) | japanskt ord | en vanlig gång med ett föremål – då läses det som *bära* |
| **Mellan människor med föremål** | ge, lämna över, bjuda på, skicka | `social` | två figurer; föremålet byter hand mitt i rörelsen | ingen | – |
| **Ställa/ta/ordna föremål** | duka, packa, stapla, hänga upp, slänga, sortera | `arrange` | figuren går fram; föremålet lämnar handen och hamnar synligt på platsen (eller tas därifrån); slutläget hålls | ingen | föremål som bara försvinner |
| **Klä sig** | ta på/av sig, knäppa (upp), dra upp, kavla upp, knyta | `dress-self` | garderobsspår ändras synligt (`hat 0→1`, `buttons 1→0`), händerna är där förändringen sker | ingen | byte som syns från t = 0 |
| **Tillstånd / vila** | slappa, sova, vila, vänta | `state` | hållning + ögon + ljus + föremål (telefon, täcke) – designas **mot** grannordet | ingen | – |
| **Känsla** | arg, glad, rädd, stolt, äcklad | `emotion` | `express`: ögon, bryn, mun, axlar **och en synlig utlösare** | ingen | kulturspecifika gester som enda bärare |
| **Händelse med flera** | stormning, fest, flytt, möte | `event` | ≥ 2 figurer och ett föremål som förändras (fana, bord, lådor) | ingen | – |
| **Egenskap buren av ett föremål** | vass, slö, grov, fin, tung, mogen, trasig, blank | `attribute-gloss` (`bearer.kind: prop`) | ett föremål som **har** egenskapen, gärna med en liten betoning som visar den (kniv + glint = vass; tandad egg = slö; stora bitar = grov) | japanskt ord i bubbla med svans mot föremålet | en person som säger ordet |
| **Egenskap buren av kläder/utseende** | randig, sportig, elegant, skrynklig, beige | `attribute-gloss` (`bearer.kind: wardrobe`) | figur vars klädsel **har** egenskapen (mönster, färg, plagg); lugn andning | japanskt ord, svans mot bålen | aktivitet som är ett eget verb (kicka ≠ sportig) |
| **Egenskap som bara syns i rörelse** | vinglig, seg, elastisk | `attribute-gloss` (`bearer.kind: motion`) | liten loopad rörelse hos ett föremål som inte är ett eget verb (vinglar, töjs) | japanskt ord | – (markera `TODO` i receptet om rörelsen inte räcker; **ett recept märkt TODO ger inget utkast**) |
| **Egenskap som smak/känsla i kroppen** | salt, söt, sur, bitter, mätt, hungrig | `attribute-gloss` (`bearer.kind: taste`/`emotion`) | figur som smakar/känner + ansikte + föremålet som orsakar | japanskt ord | – |
| **Egenskap med motsats som poäng** | tung/lätt, ren/smutsig, full/tom | `property-contrast` | båda i samma bild, bäraren är föremålen | japanskt ord | kontrast utan bärare |
| **Abstraktion med kulturneutral symbol** | tid, pris, mod, vis, ordning | `attribute-gloss` (`bearer.kind: icon`) | en ikon ur ikonbiblioteket (klocka, mynt, våg …), ensam på duken eller på en panel | japanskt ord | västerländska djurmetaforer (uggla, lejon, fyrklöver) |
| **Relation i rummet** | bakom, framför, under, i, på | `relation-arrow` | två föremål i stillhet + pil som pekar ut relationen; posterbild = slutläget | japanskt ord på panel | människor; rörelse som läses som verb |
| **Konkret ting** | kofta, stekpanna, soffa | *bild* (`template: image`) | – (Swechans wordArt) | – | – |
| **Ingen entydig scen** | – | ingen visualisering | – | – | hitta på en egen komposition |

Två regler som gäller på tvären:

- **Grannordet är en designparameter.** Recept för ord med en uppenbar granne anger vad som skiljer (tempo, grad, slutläge, föremål) och scenen deklarerar `contrast.distinctiveFeatures`. *halvera* är `parts: 2`, *skiva* är `parts: 6`; *hacka* är snabbare än *skära* och lämnar en hög.
- **Slutläget är beviset.** Den sista halvsekunden håller resultatet (två halvor, fyllt glas, öppnad dörr) så att posterbilden är entydig.

## Receptformat (`registry/recipes.json`)

Nyckel: lemma (`"vass"`) eller betydelse (`"s.slö.1"` – vinner över lemmat; använd det när två betydelser av samma ord behöver olika scener). Fält per mall:

| Mall | Fält |
|---|---|
| `attribute-gloss` | `bearer: { kind: prop\|wardrobe\|icon\|contrast\|emotion\|taste\|motion\|manner, asset?, state?, scale?, color?, surface?, env?, wardrobe?, icon?, tail?, emphasis?, motion?, manner?, prop? }` |
| `tool-rhythm` | `tool`, `target`, `surface?`, `motion`, `effects: [{ role: target\|surface\|extra, key, to, at? }]`, `claim?: []`, `period?`, `bothHands?`, `extra?` |
| `process` | `asset`, `change: [{ key, from?, to, at? }]`, `state?`, `extra?: [{ asset, change? }]`, `sound?`, `claim?` |
| `cook-rhythm` | `kind: fry\|brown\|sear\|burn\|melt`, `contents`, `flip?`, `splash?` |
| `communicate` | `say: { icon, mood?, bow?: light\|deep }` – med `bow` bär kroppen (bugning) och ikonen förstärker |
| `social` | `give: { prop }` |
| `arrange` | `put: { prop, on? }` eller `take: { prop }` |
| `manipulate-prop` | `eat: { prop, sound? }` eller `pour: { from, into }` |
| `dress-self`, `locomotion`, `emotion`, `state`, `event`, `relation-arrow` | mallens startscen med lemma-specifika tabeller i `src/tools/batch.ts` |
| `image` | `note` – ordet är en bild, inte en animation |

`note` med `TODO`, `SVAGT` eller `saknas` markerar ett recept som bygger men inte duger; `anim:coverage` räknar det som *blockerat* och `anim:batch` märker utkastet med ⚠. Skriv hellre en ärlig `TODO` än ett recept som ser klart ut.

**Testet `every recipe builds a scene that validates`** (`tests/tools.test.ts`) bygger en scen av varje recept och kräver att den validerar, inklusive bärar-regeln och mallkontraktet. Ett recept som inte går att bygga stoppar CI.

## Varför detta skrevs

Produktägaren fann 2026-11-05 att batch-utkast för *vass*, *grov*, *halvera* och *skölja* var tomma eller fel: en figur som sa ordet på japanska, en morot i fyra delar för *halvera*, *skölja* utan vatten. Orsaken var att mallkontraktet för egenskaper bara krävde text, att startscenen var tom, att 285 adjektivrecept skrevs i bulk utan bärare, och att täckningsrapporten räknade dem som *redo*. Åtgärden är den här tabellen, bärar-regeln i validatorn, bärare i varje recept, byggare som komponerar hela scener och testet ovan.

## Tillägg 2026-11-06: gester och sätt (efter *ursäkta* och *försiktig*)

Produktägaren såg att *ursäkta* visade en hand-ikon som lästes som ett långfinger, och att *försiktig* bara var en figur som gick med en bricka. Orsaker: (1) ikonen `hand` hade ett finger högre än de andra – i 140 px blir det en gest; (2) betydelsen hade lagts i bubblan, inte i kroppen, trots regeln att gester aldrig bär ensamma; (3) blindtestet frågade bara *vilket ord*, aldrig *kan något missförstås*; (4) receptet för *försiktig* var märkt TODO men batchen skrev ändå ett utkast som produktägaren fick se.

Förinställda lösningar nu: handlingen `bow` (bugning, djup/lätt, händer ihop) bär förlåt/tack/hälsning; ikonen `palms` (🙏) finns och `hand` är omritad som öppen handflata; validatorn **stoppar** en gest-ikon i bubbla utan kroppslig handling; gångsättet `walk.manner: careful` och bäraren `manner` finns för sätt-adjektiv; blindtestet har en tredje fråga om missförstånd/stötande innehåll och ett flaggat svar räknas inte som godkänt; batchen skriver **inget utkast** för recept märkta TODO/SVAGT/saknas.

## Receptgeneratorn (`anim:recipe`, 2026-11-06)

Verktyget skriver nu recepten själv för de vanliga funktionerna och **säger ifrån** för resten. Ordningen är: handskrivet recept → lemmatabeller i `src/tools/lexicon.ts` (verktygsverb, processverb, ställa/ta-verb, verb mellan människor, matlagning, egenskaper, mönster/färger, klädfraser) → definitionsregler med substantiv översatta till katalogföremål → *manuellt* med skäl, ledtrådar och liknande lösta ord. Säkerhet *hög* (tabell), *medel* (definition + föremål), *låg* (bara familj: lämnas som **förslag**, byggs inte utan `--allow-low`). `anim:batch` använder generatorn automatiskt när handrecept saknas; `anim:coverage` visar läget *Redo: receptet genereras* och *Manuellt*; `docs/MANUAL_SCENES.md` är överlämningen till Claude.

Mätning 2026-11-06 mot hela ordboken (600 betydelser, handrecepten dolda), efter två pilotrundor: recept för 324 (194 hög, 67 medel, 63 låg), manuellt 276. Där handrecept finns: samma mall 83 %. Två pilotrundor på sex moduler enbart med generatorn: 45 scener, blindtest 59 av 64 rätt ord (fel bara inom synonymkluster eller där granskaren ärligt svarade "inget") – se `registry/pilot-generator.md`. Aktivitetssubstantiv (*städning*, *tvätt*) får verbets bild; verktygsverb utan synlig följd lämnas som förslag.

