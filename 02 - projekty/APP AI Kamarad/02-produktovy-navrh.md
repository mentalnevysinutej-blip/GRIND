# 02 — Produktový návrh: avatar, osobnosti, tamagoči, skills

## 1. Produkt v jedné větě

**Parťák je malá postavička, která žije na tvé ploše, mluví s tebou hlasem,
pamatuje si tvůj život, stará se o tebe — a ty se staráš o ni.**

Hlavní smyčka (core loop):

```
 ráno ─► avatar se probudí, pozdraví, shrne den (počasí, schůzky, e-maily)
   │
   ▼
 během dne ─► sedí/chodí po ploše, reaguje na tebe, připomíná pití/pauzy,
   │           plní úkoly hlasem („napiš Petrovi, že přijdu později“)
   ▼
 péče ─► nakrmíš ho (= ty jsi jedl/pil), pohraješ si, pochválíš → roste pouto
   │
   ▼
 večer ─► reflexe dne, uložení vzpomínky, uložíš ho spát (= ty jdeš spát)
   │
   ▼
 odměna ─► XP, level pouta, nové animace/předměty/repliky → důvod přijít zítra
```

---

## 2. Avatar

### 2.1 Chování na ploše (PC)

| Režim | Popis |
|---|---|
| **Desktop pet** | průhledné okno přes celou obrazovku, avatar chodí po spodní hraně / po horních hranách oken, sedí na liště, spí v rohu |
| **Kliknutí skrz** | všechno kromě samotného avatara propouští myš do aplikací pod ním (click-through) |
| **Bublina** | text/obsah odpovědi v komiksové bublině vedle avatara (odkazy, seznamy, karty kina…) |
| **Panel** | rozkliknutelné okno: chat, nastavení, šatník, statistiky, deník |
| **Nerušit** | při hře na celou obrazovku / prezentaci / sdílení obrazovky se automaticky schová |
| **Velikost & pozice** | uživatel ho chytí a přetáhne kamkoliv, zvolí velikost (S/M/L), více monitorů |

Interakce s avatarem: pohlazení (hover), šťouchnutí (klik), chycení a hození
(fyzika), krmení přetažením jídla z inventáře, reakce na čas (večer zívá),
na aktivitu (dlouho nehybný kurzor → usne), na hudbu (tancuje — volitelné).

### 2.2 Vizuální styl — doporučení

**2D, stylizovaný, „chibi/cute“ se silnou siluetou.** Důvody:
- levnější a rychlejší výroba než 3D, menší nároky na PC,
- modularita (paper-doll vrstvy) je ve 2D mnohem jednodušší,
- dobře vypadá malý na ploše i velký v panelu,
- dobře se sdílí na TikToku.

**Technologie animace:** **Rive** (state machine pro emoce a potřeby, vstupy
pro lip-sync, runtime pro web/React zdarma). Alternativa: PixiJS + Spine.
3D (VRM/VRoid modely) až jako fáze 3 — „přines si vlastního avatara“ pro
VTuber komunitu.

### 2.3 Customizace (hodně, opravdu hodně)

Systém **„Druh → Tělo → Obličej → Styl → Doplňky → Barvy → Osobnost → Hlas“**:

| Vrstva | Možnosti (MVP → později) |
|---|---|
| **Druh / základ** | MVP: 1 druh „blob-tvor“ (neutrální, roztomilý). Později: kočka, lišák, robot, duch, drak, člověk-chibi |
| **Tělo** | tvar (kulatý, vysoký, malý), proporce hlavy, ocas/uši/křídla/rohy |
| **Obličej** | oči (15+ tvarů), obočí, pusa, tváře, pihy, brýle |
| **Vlasy / srst** | 20+ střihů, přechody barev |
| **Oblečení** | vrstvy: čepice, top, spodek, boty, plášť; sezónní kolekce |
| **Doplňky** | batoh, hrnek kafe, sluchátka, meč, kytka, mazlíček mazlíčka |
| **Barvy** | každá vrstva má barevné „tokeny“ (hlavní/vedlejší/akcent) + libovolný HEX + palety |
| **Efekty** | aura, třpytky, stopy při chůzi, emote bubliny |
| **Animační sety** | styl chůze, idle animace, tanečky |
| **Pokoj/domeček** | (fáze 2) malý „pokojíček“ v panelu, který si zařizuješ |
| **Hlas** | výběr hlasu, výška, rychlost; prémiové hlasy |
| **Jméno, zájmena, narozeniny** | avatar slaví narozeniny = den „adopce“ |

Technicky: každý díl = samostatný asset se stejnými kotevními body (sockets)
na kostře → nové předměty přidáváme bez nových animací. Barvy přes shader/
tokeny → jedna kresba = stovky variant. Konfigurace avatara = malý JSON
(snadné sdílení: „kód avatara“ → virální mechanika).

---

## 3. Osobnostní režimy

Osobnost = **preset** nad sadou posuvníků, které si uživatel může doladit.

| Posuvník | 0 ←→ 10 |
|---|---|
| Energie | klidný ←→ hyperaktivní |
| Humor | vážný ←→ vtipálek |
| Přímost | jemný ←→ brutálně upřímný |
| Formálnost | kámoš (tykání, slang) ←→ profík |
| Empatie | věcný ←→ velmi citlivý |
| Proaktivita | ozve se jen když chceš ←→ často iniciuje |
| Sprostota | vypnuto ←→ občas zakleje (18+) |

| Režim | Pro koho | Jak mluví | Co dělá navíc |
|---|---|---|---|
| **Kamarád** (výchozí) | všichni | přátelsky, zvědavě | pamatuje si, ptá se, jak dopadla věc z minula |
| **Bestie** | kdo chce drby a hype | energicky, drzost, emoji | fandí ti, drbe, řeší s tebou vztahy |
| **Kouč** | cíle, práce | strukturovaně, otázky | cíle, týdenní review, akční kroky |
| **Motivátor** | lenost, sport | nakopávací, tvrdší láska | streaky, výzvy, „vstávej“ |
| **Parťák na vypovídání** (wellbeing) | špatný den | klidně, pomalu, aktivní naslouchání | dýchání, zapisování, krizový protokol |
| **Asistent / Profík** | práce | stručně, věcně | e-mail, shrnutí, plánování |
| **Učitel** | studenti | trpělivě, příklady | procvičování, kvízy, jazyky |
| **Sarkastický gremlin** | zábava | ironicky (nikdy zle) | vtipné komentáře k tvému dni |

Pravidla:
- Režim se dá přepnout hlasem („buď teď kouč“) nebo automaticky podle kontextu
  (když je uživatel smutný, i Motivátor zjemní — **bezpečnost má přednost před rolí**).
- Každý režim má vlastní sadu animací/výrazů a volitelně vlastní hlas.
- Komunita může později sdílet vlastní osobnosti (moderovaný katalog).

---

## 4. Tamagoči systém

### 4.1 Potřeby avatara

| Potřeba | Klesá když… | Doplní se když… | Vazba na tvůj reálný život |
|---|---|---|---|
| **Hlad** 🍎 | čas (pomalu) | nakrmíš ho | když ty zapíšeš jídlo / vypiješ vodu → avatar „jí s tebou“ (napojení na Jídelní deník) |
| **Energie** 💤 | čas vzhůru, práce | uložíš ho spát | ukládáte se spát spolu; ráno ví, jak dlouho jsi spal (volitelně) |
| **Nálada** 😊 | ignorování, nuda | pokec, hra, pochvala, splněný úkol | tvoje splněné úkoly ho těší |
| **Zdraví** ❤️ | dlouhodobě nízké potřeby | léčení (lékárnička, odpočinek) | když jsi nemocný ty, onemocní „solidárně“ a hlídá tvoji léčbu |
| **Čistota** 🫧 (volitelné) | čas | koupel (mini-hra) | pauza od obrazovky = „jde se vykoupat“ |
| **Pouto** 💞 | nikdy neklesá | každá péče a rozhovor | odemyká obsah, hlubší rozhovory, vzpomínky |

### 4.2 Etická pravidla (tvrdě)

- Avatar **nikdy neumře** a neztratíš pokrok. Nejhorší stav = „smutný a ospalý“,
  po návratu tě radostně přivítá („chyběl jsi mi, co se dělo?“) — žádné výčitky.
- Pouto nikdy neklesá — tresty nejsou, jen odměny.
- Režim dovolená/pauza — potřeby se zmrazí.
- Žádné „kup si léčivo, jinak…“: placené předměty jsou **jen kosmetika**, nikdy
  ne nutnost pro péči.
- Proaktivní oslovení mají denní limit a respektují nerušit/noc.

### 4.3 Progrese a odměny

- **Level pouta** (1–50): každý level odemkne něco — nová animace, repliku,
  předmět, schopnost („od levelu 5 ti umí ráno shrnout e-maily“ → užitečnost
  se odemyká spolu se vztahem = přirozený onboarding).
- **Vzpomínky / deník**: avatar vede deník vašich společných chvil
  (týdenní „alba“, výročí). Silný emoční retenční prvek.
- **Denní drobnosti**: náhodná událost dne (avatar našel kamínek, chce ti ukázat písničku).
- **Sezónní události**: Vánoce, Halloween — dočasné předměty.
- **Streaky** (jen pozitivně): série dní péče, bez penalizace za výpadek (možnost „zmrazit“).

### 4.4 Mini-hry (fáze 2)

Házení míčkem po ploše, schovávaná mezi okny, kvíz, „nakrm ho správně“,
dechové cvičení jako hra (wellbeing).

---

## 5. Skills — co avatar umí

Značení: **MVP** = první veřejná verze, **F2** = fáze 2, **F3** = později.

### 5.1 Jádro

| Skill | Popis | Fáze |
|---|---|---|
| Konverzace | povídání hlasem i textem, osobnosti | MVP |
| Paměť | pamatuje si fakta o tobě, lidi, události, preference; umíš ji prohlížet a mazat | MVP |
| Hlas | push-to-talk klávesa → STT → odpověď → TTS s lip-syncem | MVP |
| Wake word | „Hej Parťáku“ bez klávesy | F2 |
| Tamagoči engine | potřeby, péče, pouto, odměny | MVP |
| Denní briefing | ráno: počasí, kalendář, připomínky, 1 motivační věta | MVP |

### 5.2 Každodenní život

| Skill | Jak | Fáze |
|---|---|---|
| **Vyhledávání na internetu** | web search nástroj + shrnutí se zdroji v bublině | MVP |
| **Poznámky** | „zapiš si…“ → lokální poznámky (Markdown), hledání, export | MVP |
| **Připomínky & budík** | „připomeň mi v 15:00…“, opakované, lokální notifikace + avatar | MVP |
| **Počasí** | open API | MVP |
| **Kalendář** | Google/Outlook kalendář (čtení, pak zápis) | F2 |
| **E-mail — číst & shrnout** | Outlook/Microsoft Graph + IMAP; Gmail až po verifikaci | F2 |
| **E-mail — napsat** | koncept → náhled v bublině → potvrzení → odeslat | F2 |
| **Program kina** | vyhledání programu (web search + parsování webů kin), karty filmů, odkaz na koupi lístku | F2 |
| **Nákupy** | fáze A: najde produkt, porovná ceny, pošle odkaz / sestaví nákupní seznam; fáze B: vyplní košík v prohlížeči (browser agent) → ty jen potvrdíš a zaplatíš | F2 / F3 |
| **Nákupní seznam** | z jídelníčku (Jídelní deník) | F2 |
| **Doprava** | spojení (odkazy na IDOS/Google Maps) | F2 |
| **Finance** | výdaje (napojení na Rozpočet appku) | F3 |
| **Soubory & PC** | „otevři…“, „najdi soubor…“, spouštění appek | F2 |
| **Hudba** | Spotify ovládání | F3 |
| **Překlad & psaní** | přeložit, přepsat text ze schránky | MVP (jednoduché) |
| **Chytrá domácnost** | Home Assistant | F3 |

### 5.3 Wellbeing & kouč

| Skill | Fáze |
|---|---|
| Check-in nálady (1× denně, 1 klik) | MVP |
| Dechová cvičení s animací avatara | MVP |
| Pitný režim & pauzy od obrazovky | MVP |
| Cíle & návyky (kouč) + týdenní review | F2 |
| Deník / reflexe večer | F2 |
| Krizový protokol (detekce → kontakty na pomoc) | MVP (povinné) |

### 5.4 Notifikátor (proaktivita)

Zdroje: připomínky, kalendář, důležité e-maily (F2), počasí (déšť → deštník),
potřeby avatara, dlouhé sezení, narozeniny lidí z paměti.
Pravidla: priorita (urgentní/normální/drobnost), tiché hodiny, denní rozpočet
oslovení (např. max 6 drobností/den), avatar jde *fyzicky* k okraji obrazovky
a „zaklepe“ — žádné systémové spamování.

---

## 6. UX principy pro „obyčejného člověka“

1. **Žádné nastavování na začátku.** Onboarding = „vylíhnutí“ avatara (vajíčko →
   uživatel vybere barvu a jméno → avatar se vylíhne a sám se představí). Detailní
   šatník až potom.
2. **Mluv normálně.** Žádné příkazy; avatar se doptá.
3. **Vždy ukaž, co děláš.** „Hledám kino…“ animace; u akcí náhled + potvrzení.
4. **Chyby s humorem**, ale bez zlehčování.
5. **Soukromí viditelně**: tlačítko „co o mně víš?“ → seznam vzpomínek, smazat jedním klikem.
6. **Mikrofon nikdy neposlouchá tajně** — viditelný indikátor, push-to-talk jako výchozí.

---

## 7. Monetizace (návrh)

| Úroveň | Cena (orientačně) | Obsah |
|---|---|---|
| **Free** | 0 Kč | avatar + základní customizace, tamagoči, textový chat s denním limitem, lokální (základní) hlas, poznámky, připomínky |
| **Plus** | 149 Kč / měs (5,99 €) | neomezený chat, paměť, hlasová konverzace, všechny osobnosti, vyhledávání, briefing |
| **Pro** | 249 Kč / měs (9,99 €) | + e-mail, kalendář, nákupní agent, prémiové hlasy, proaktivní notifikace, více avatarů |
| **Kosmetika** | 29–199 Kč | balíčky oblečení, druhy, efekty, sezónní kolekce (jen vzhled!) |
| **Zakladatelská edice** | jednorázově 499–799 Kč | pro early adoptery / Steam: doživotní Plus + exkluzivní skin |

Roční předplatné se slevou ~35 %. Kosmetika = zdroj příjmů nezávislý na
nákladech na AI (vysoká marže) — proto je customizace strategická.
