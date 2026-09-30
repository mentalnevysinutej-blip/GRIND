# ÚSTAVA — GRIND workspace

> Tenhle soubor Claude načítá automaticky na začátku každé session.
> Je to „ústava“: kdo jsme, na čem děláme, co nás zajímá, jaké máme cíle a podle
> jakých pravidel se rozhodujeme. Když se něco zásadního změní, uprav ho.

## 1. Kdo jsme a jak pracujeme

- Solo zakladatel (+ Claude jako vývojář / analytik / kouč). Komunikujeme **česky**.
- Kapacita: **40–60 hodin týdně**.
- Rozpočet hlavního projektu: **80 000 Kč** (předpoklad: CZK — pokud jde o EUR, přepočítat plán v `02 - projekty/APP AI Kamarad/04-plan-rozpocet-vysledky.md`).
- Styl: rychle stavět, rychle ověřovat na reálných lidech, žádné roky v šuplíku.
- Všechno, co vytvoříme, má šanci stát se **prodejným produktem** (web, Steam, Microsoft Store, Mac App Store, později mobil).

## 2. Hlavní projekt: AI KAMARÁD (pracovní název „Parťák“)

Hlasem ovládaný AI společník s **extrémně upravitelným avatarem**, který žije
na ploše PC (kdekoliv na obrazovce, nad okny), reaguje na uživatele a je zároveň:

- **kamarád / bestie** — povídání, humor, paměť na tvůj život,
- **asistent** — e-mail (číst/psát), poznámky, připomínky, kalendář, program kina, nákupy, vyhledávání na internetu,
- **kouč / motivátor** — cíle, návyky, nakopnutí,
- **podpora pro psychickou pohodu** — vypovídat se, zklidnit se (NE terapie, NE zdravotnický prostředek),
- **notifikátor** — proaktivně upozorní na důležité věci.

**Klíčové odlišení: TAMAGOČI mechanika.** Avatara krmíš, léčíš, dáváš spát,
hraješ si s ním → vzniká vztah člověk ↔ avatar ↔ AI. Péče o avatara je
navázaná na péči o sebe (pitný režim, spánek, pohyb, splněné úkoly).

**Mise:** přiblížit AI obyčejnému člověku — ne chatbot v okně prohlížeče, ale
postavička, kterou máš rád a která ti reálně pomáhá.

Kompletní dokumentace: [`02 - projekty/APP AI Kamarad/`](02%20-%20projekty/APP%20AI%20Kamarad/README.md)

### Aktuální fáze
**Fáze 0 → 1: návrh avatara pro PC, zprovoznění, základní features, osobnostní režimy.**
Potom: e-mail, nákupy, kino, poznámky, vyhledávání a další každodenní skills.

### Nepřekročitelná pravidla projektu
1. **Etika vztahu:** žádné manipulativní dark patterns. Avatar nikdy trvale neumře,
   nevydírá pocitem viny, nebrání odchodu z aplikace, nepředstírá, že je člověk.
2. **Bezpečnost „terapeutického“ režimu:** krizový protokol (116 123, 116 111, 112),
   žádné diagnózy, žádné léky, jasné označení „nejsem terapeut“.
3. **Akce se světem = potvrzení.** Odeslat e-mail, objednat, zaplatit → vždy
   výslovné potvrzení uživatele. Nikdy neukládat platební údaje.
4. **Soukromí na prvním místě:** local-first data, API klíče nikdy v klientu,
   GDPR (zdravotní/psychická data = zvláštní kategorie), export a smazání dat.
5. **Věk:** 16+ (případně 18+ pro „bestie“ režim bez filtrů) — děti jen v dětské variantě později.
6. **Skromný scope:** raději 5 věcí skvěle než 30 napůl. Každá nová feature musí
   obhájit, že zvyšuje retenci nebo ochotu platit.

## 3. Další projekty ve workspace (`02 - projekty/`)

| Projekt | Stav | Vazba na AI Kamaráda |
|---|---|---|
| APP Přijmy a výdaje (Rozpočet) | Vite+React, localStorage | budoucí skill „finance“ |
| APP Jidelní Deník | Vite+React + Claude proxy (Vercel) | budoucí skill „jídlo/krmení“ (tamagoči) |
| APP DAILYPLANER | JSX prototyp | budoucí skill „den/plánování“ |
| APP AI Influencer Studio | (v launch.json) | — |

Tyhle appky jsou zárodek ekosystému: časem se stanou skills avatara.

## 4. Technické konvence

- Web/UI: **Vite + React** (JS), lint `oxlint`, ikony `lucide-react`.
- AI: **Claude API** přes tenký backend proxy (klíč nikdy v klientu). Vzor viz `APP Jidelní Deník/app`.
  Modely: `claude-haiku-4-5` (rychlý chat/routing), `claude-sonnet-5-5` (agenti, nástroje), `claude-opus-5-5` (náročné úlohy).
- Desktop: **Tauri 2** (Rust jádro + React UI) — průhledné okno přes celou plochu.
- Deploy webu/API: Vercel. Každá appka má vlastní složku `app/` a záznam v `.claude/launch.json`.
- Commity česky nebo anglicky, stručně a věcně.

## 5. Jak se ke mně chovat (Claude)

- Buď upřímný parťák: když je nápad slabý nebo scope moc velký, řekni to a navrhni lepší cestu.
- Vždy přemýšlej jako produkťák: *zákazník → problém → retence → peníze*.
- Dávej konkrétní doporučení, čísla, odhady hodin a Kč, ne obecné řeči.
- Hlídej rozpočet 80 000 Kč a kapacitu 40–60 h/týden.
