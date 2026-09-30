# 01 — Studie a analýza: AI Kamarád („Parťák“)

## 1. Co si o tom myslím (upřímně)

**Nápad je dobrý a načasování je dobré. Rozsah je ale teď zhruba 10× větší, než
se dá s 80 000 Kč a jedním člověkem postavit.** To není důvod to nedělat — je to
důvod udělat to ve správném pořadí.

Co je na tom silné:

1. **Tamagoči + AI je skutečné odlišení.** Chatboti mají problém s retencí — lidi
   si je vyzkouší a zapomenou. Tamagoči mechanika dává *důvod se vracet každý den*
   (potřeby avatara) a *důvod neodejít* (vztah, historie, vzhled, který sis vyladil).
   Že to funguje, dokazuje appka **Finch** (virtuální ptáček, o kterého pečuješ tím,
   že pečuješ o sebe) s miliony uživatelů a vysokou retencí.
2. **Desktop je méně obsazený než mobil.** Na mobilu se přetahuješ s Replikou,
   Character.AI, Snapchatem a vestavěnými asistenty. Na ploše PC je místo —
   ukázal to **Desktop Mate** (Steam, 2025): postavička na ploše se prodávala
   ve statisících kusů *bez jakékoliv AI*. Kombinace „postavička na ploše + mozek“ je mezera.
3. **Čeština je výhoda, ne nevýhoda.** Velcí hráči češtinu podporují „technicky“,
   ale ne kulturně (humor, oslovení, místní služby — kina, Rohlík, Alza, Zásilkovna,
   IDOS, ČSFD). Český trh jako první testovací trh je malý, ale levný na marketing
   a můžeš ho osobně ovládnout. Pak angličtina.
4. **Máš už zárodky ekosystému** (Jídelní deník, Rozpočet, Denní plánovač) — z nich
   se stanou skills avatara.

Co je rizikové / na co bacha:

1. **„Univerzální asistent“ neprodáš proti Microsoftu, Googlu a Applu.** Copilot,
   Gemini a Siri s LLM umí e-mail, kalendář a vyhledávání zadarmo a hluboko v OS.
   → Užitečné funkce jsou **nutný základ („table stakes“), ne důvod koupit**.
   Důvod koupit je *postavička, vztah a osobnost*. Proto: **companion first, asistent second.**
2. **„Terapeut“ je právní mina.** Slovo terapie = zdravotnický prostředek (EU MDR),
   rizika dle EU AI Act, žaloby v USA proti Character.AI, pokuta 5 mil. € pro Repliku
   v Itálii (GDPR, ochrana nezletilých). → Pojmenovat jako **„Parťák na vypovídání“ /
   „psychická pohoda“**, s krizovým protokolem, bez diagnóz.
3. **Emoční závislost.** Tamagoči + AI je silná kombinace — a dá se zneužít
   (výčitky „bez tebe umřu“). To nechceme: je to neetické, obchody (Apple) to
   penalizují a regulátoři na to jdou. Etická verze je navíc lepší marketing.
4. **Objednávání zboží a e-mail jsou technicky i byrokraticky drahé.**
   Gmail vyžaduje pro čtení pošty bezpečnostní audit Google (CASA) — řádově tisíce
   až desítky tisíc Kč ročně. Obchody nemají veřejná API pro nákup. → Řešíme chytře (viz návrh).
5. **Náklady na hlas.** Kvalitní hlasový výstup (TTS) je dražší než samotný „mozek“.
   Bez kontroly nákladů tě úspěšní uživatelé finančně zabijí.

**Verdikt:** Jdi do toho, ale jako **„digitální mazlíček s mozkem na tvojí ploše“**,
ne jako „další AI asistent“. První verze = avatar + osobnost + tamagoči + hlas
+ 4–5 užitečných skills. Všechno ostatní postupně podle dat.

---

## 2. Trh a trendy (stav 2026)

- **AI companion** je jedna z nejrychleji rostoucích kategorií spotřebitelské AI
  (Character.AI, Replika, Talkie, Grok companions, Copilot s avatarem). Lidi
  za vztah s AI platí — companion appky patří k nejvýdělečnějším AI appkám na mobilu.
- **Desktop companions / „desktop pets“** — Desktop Mate, Shimeji, VTuber
  komunita, Wallpaper Engine. Steam je pro to ověřený distribuční kanál.
- **Wellbeing gamifikace** — Finch, Habitica, Forest: péče o virtuální bytost
  = motivace k dobrým návykům.
- **Hlasová AI** zlevnila a zrychlila (real-time STT/TTS, speech-to-speech modely),
  latence pod 1 s je dosažitelná.
- **Regulace** houstne: EU AI Act (transparentnost — uživatel musí vědět, že mluví s AI;
  zákaz manipulativních technik), ochrana nezletilých u companion appek, GDPR.

### Cílové skupiny (persony)

| Persona | Kdo | Co chce | Za co zaplatí |
|---|---|---|---|
| **Osamělý pracant** | 20–35, hodně u PC (home office, student, gamer) | společnost při práci, pokec, motivaci | vzhled, hlas, osobnosti |
| **Zahlcený organizátor** | 25–45, hodně věcí na hlavě | připomínky, e-mail, poznámky, „někdo, kdo to pohlídá“ | Pro funkce (e-mail, kalendář, proaktivita) |
| **Sebezlepšovák** | 18–35, návyky, fitness, produktivita | kouč, streaky, disciplína | kouč režim, statistiky |
| **Sběratel / kreativec** | 16–30, anime/VTuber/gaming komunita | unikátní postavička, customizace | kosmetika, skiny, balíčky |
| **Neznalý AI** (masový cíl) | 35–65, AI nepoužívá | „kamarád“, kterému se dá prostě říct, co potřebuje | jednoduché předplatné |

**Doporučený první cíl (beachhead):** *Osamělý pracant + Sebezlepšovák* v ČR/SK —
jsou u PC celý den, rozumí konceptu, šíří věci na TikToku/Discordu.

---

## 3. Konkurence

| Produkt | Co dělá dobře | Slabina = naše šance |
|---|---|---|
| **Replika** | vztah, paměť, avatar | mobil, generický vzhled, reputační problémy, žádná užitečnost |
| **Character.AI** | tisíce postav, zábava | žádný avatar na ploše, žádné skills, problémy s nezletilými |
| **Finch** | tamagoči + wellbeing, skvělá retence | žádná skutečná AI konverzace, jen mobil |
| **Desktop Mate** | postavička na ploše, Steam, DLC postavy | žádná AI, žádná užitečnost |
| **Microsoft Copilot / Gemini / Siri** | integrace v OS, zdarma | žádná osobnost, žádný vztah, korporátní |
| **Pi / ChatGPT voice** | kvalitní hlasová konverzace | bez těla, bez tamagoči, bez plochy |
| **Shimeji, VTuber appky** | komunita, customizace | bez AI |

**Pozice:** *„Finch + Desktop Mate + Replika, s mozkem, který ti fakt pomůže.“*
Nikdo zatím nespojil všechny tři věci: **tělo na ploše + tamagoči vztah + užitečné skills**.

---

## 4. SWOT

| Silné stránky | Slabé stránky |
|---|---|
| unikátní kombinace (plocha + tamagoči + AI) | 1 člověk, malý rozpočet |
| čeština a lokální služby | umělecké assety jsou drahé |
| rychlost solo foundera + AI vývoj | nutnost zvládnout desktop, hlas, AI, backend naráz |
| existující mini-appky jako skills | žádná existující komunita |

| Příležitosti | Hrozby |
|---|---|
| Steam jako kanál (wishlisty, DLC kosmetika) | Big Tech přidá avatary do OS asistentů |
| TikTok virality (postavička = vizuální obsah) | regulace companion AI, ochrana dětí |
| B2B později (firemní maskot/asistent) | náklady na API při růstu |
| licence postav / spolupráce s tvůrci | reputační riziko (škodlivá odpověď „terapeuta“) |

---

## 5. Právní a regulatorní checklist

| Oblast | Co to znamená pro nás | Kdy řešit |
|---|---|---|
| **EU AI Act** | jasně říct „jsem AI“; žádné manipulativní techniky; žádné rozpoznávání emocí z obličeje/hlasu na pozadí | od MVP |
| **GDPR** | zásady ochrany soukromí, souhlas, export/smazání dat; psychika = zvláštní kategorie → výslovný souhlas, minimalizace, local-first | před betou |
| **Zdravotnické prostředky (MDR)** | nepoužívat „terapie“, „léčba“, „diagnóza“; wellbeing ano | od MVP (texty) |
| **Ochrana nezletilých** | 16+ (EU digitální souhlas), age gate, dětská verze až později | před betou |
| **Obchodní podmínky** | odpovědnost za akce agenta (e-mail, nákup) — vždy potvrzení | před betou |
| **Obchody (Apple/MS/Steam)** | Apple: AI obsah, věkové hodnocení, žádné „health“ claimy; Steam: AI disclosure formulář | před vydáním |
| **Google OAuth (Gmail)** | citlivé scopy = verifikace, u čtení pošty bezpečnostní audit | fáze 2 |
| **Ochranná známka** | ověřit název (ÚPV, EUIPO) před brandingem | před betou |

---

## 6. Hlavní rizika a jak je zmírnit

| Riziko | Dopad | Zmírnění |
|---|---|---|
| Scope creep | nikdy nevydáš | tvrdé MVP, backlog „později“, týdenní review |
| Náklady na TTS/LLM | záporná marže | lokální TTS zdarma, prémiový hlas jen v Pro, routing na levné modely, cache, limity |
| Assety avatara | drahé / nekonzistentní | modulární systém, 1 základní „druh“, freelancer + AI koncepty, komunita |
| Škodlivá odpověď v krizi | lidská škoda, reputace | krizový protokol, klasifikátor rizika, testovací sada scénářů |
| Agent udělá nevratnou akci | ztráta důvěry | potvrzovací dialog, log akcí, „undo“ kde jde |
| Nízká retence | produkt umře | tamagoči smyčka, proaktivní (ale ne otravná) oslovení, měřit D1/D7/D30 od prvního dne |
| Big Tech kopie | tlak na cenu | jít do hloubky osobnosti a komunity, kam korporát nepůjde |
