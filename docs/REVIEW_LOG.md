# Granskningslogg

Varje rad: datum · scen · vad som sågs i bildremsan · åtgärd · status. Claude fyller i efter `anim:strip`/`anim:compare`; produktägaren sätter *granskad* i studion.

| Datum | Scen | Iakttagelse | Åtgärd | Status |
|---|---|---|---|---|
| 2026-11-05 | alla | Första rendering: figuren ritades upp och ned (riggens upp-riktning) | FK rättad | – |
| 2026-11-05 | anim.hälla.1 | Kannan hölls bakom huvudet och strålen började utanför bilden: hållna föremål roterades med armen, pipen satt bakåt, bordet för högt | Hållna föremål upprätta; kanna med pip framåt; handmål räknas från den lutade pipen; lägre bord; främre armen ritas framför ansiktet | ai-draft, remsa granskad |
| 2026-11-05 | anim.slappa.1 | Första versionen låg nästan platt och liknade *sova* | Säte högre, lutning 18°, ben upp på soffan, telefon, halvöppna ögon, fot som vickar; kontrastkrav mot anim.sova.1 | ai-draft, remsa + jämförelse granskad |
| 2026-11-05 | anim.sova.1 | Fötterna stack utanför sängen; "z" syntes innan sömnen börjat | Position räknad från sängens säte; effektspår börjar avstängda | ai-draft, remsa granskad |
| 2026-11-05 | anim.sportig.1 | Framåtböjningen såg ut som en krypande pose | Stretch = armar upp + sidolutning + utfallssteg | ai-draft, remsa granskad |
| 2026-11-05 | anim.bakom.1 | Bollen försvann helt bakom lådan | Placering så att bollen sticker upp bakom lådans kant; pil som markering | ai-draft, remsa granskad |
| 2026-11-05 | anim.springa.1 | Figuren sprang ut ur bilden | Slutposition 92; kontrast mot gå via `airborne`/`speed` | ai-draft, remsa granskad |
| 2026-11-05 | anim.hoppa.1, anim.öppna.1, anim.stänga.1, anim.gå.1 | Läsbara i remsan; dörrens öppna läge ritas som ljus öppning + smal dörrskiva | – | ai-draft, remsa granskad |
| 2026-11-05 | ui.feedback.correct, ui.module.complete | Panel glider upp med easeOut, bock ritas, text tonar in; flagga + stjärnor med overshoot | – | ai-draft |

Kvarstående svagheter: ansiktet i profil (sova), arm-IK:s armbåge i övergången till hällpositionen, enkla möbelvolymer.
| 2026-11-05 | anim.springa.1, anim.gå.1 | Produktägaren: "springandet måste vara mer än benen", magen lossnade från höfterna, fötterna gled | Gångmodell med fotplacering + IK, världen rullar, bål fäst i höfterna, lutning, flygfas, fartstreck. Remsa granskad med 9 rutor (ej multiplar av cykeln) | ai-draft |
| 2026-11-05 | anim.sova.1 | Täcket låg "i" figuren | Täcke med puckel ovanpå kroppen, armar under, höfter 9 över madrassen | ai-draft, remsa granskad |
| 2026-11-05 | anim.sportig.1 | Produktägaren: ser bara ut som stretchning | Omgjord till kontrast i samma scen (vardaglig vs sportig med keepy-uppies, pannband, träningskläder). Osäkert om adjektivet alls går att visa entydigt – kräver produktägarens dom | ai-draft, remsa granskad |
| 2026-11-05 | anim.hoppa.1 | Huvudet gick ur bild i apex (13-provskontrollen) | Figur 0.88, höjd 16, armar lägre | ai-draft |
| 2026-11-05 | anim.bakom.1 | Produktägaren: fysiken glömd, bollen "ovanpå/bredvid/bakom", och personen la ner bollen – missförstånd. Ingen människa behövs | Omgjord: boll rullar in bakom låg låda med riktig inbromsning och rotation; första versionen snurrade kring kontaktpunkten (rättat med pivot) | ai-draft, remsa granskad |
| 2026-11-05 | anim.sova.1 | zzz långt från huvudet och ur bild | Huvudets världsposition tar hänsyn till kroppsrotation; zzz nära munnen, kort stigning | ai-draft, remsa granskad |
| 2026-11-05 | anim.springa.1 | Fartstreck bara första sekunden och små | Spåret stegas i stället för att tona; fler, längre, strömmande streck | ai-draft, remsa granskad |
| 2026-11-05 | anim.stormning.1 | Ny på produktägarens begäran | Borg, stege, tre anfallare, fana byter färg, port öppnas; gul "glow" på borgen togs bort (såg ut som en fläck) | ai-draft, remsa granskad |
| 2026-11-05 | anim.bakom.1 | Produktägaren: den rullande bollen i början är ett verb; visa med pil och 後ろ | Statisk relation + bågpil + 後ろ + nedåtpil; pilhuvudet var för grovt (sw 2 i stället för 3) och kanjit krockade med pilen (flyttat höger) | ai-draft, remsa granskad |
| 2026-11-05 | anim.stormning.1 | Produktägaren: att bestiga murar ≠ storma; soldater in, slagsmålsmoln som i anime/Asterix | Omgjord enligt förslaget; molnet jittrar med `phase`, nävar och stjärnor | ai-draft, remsa granskad |
| 2026-11-05 | blindtest b1 (alla 11 ordscener) | Oberoende granskare (subagent med tomt minne, bara PNG + frågor): 10 av 11 rätt. *stormning* lästes som *anfalla* – "det går inte att se om borgen erövras". Granskaren noterade även att *hoppa* är tvetydigt mot *hoppa över* och *springa* mot *jogga* | stormning: fanbytet är för litet för att bära "tagen"; åtgärd planerad (stor fana hissas, port bryts upp). Resultat i registry/blind.json | 10 godkända, 1 underkänd |
