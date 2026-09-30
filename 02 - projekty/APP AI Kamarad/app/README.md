# Parťák: desktopová appka (spike 1)

Blob-tvor, který žije na tvé ploše nad okny. Umí:

- **vylíhnout se z vajíčka** (onboarding) a dostat od tebe jméno,
- **chodit po spodní hraně obrazovky**, sedět, koukat očima za myší,
- **nechat se chytit myší a hodit** (fyzika, odrazy),
- **tamagoči péči**: nakrmit (4 jídla), napít se *spolu s tebou*, hrát (hází
  si míček a běží pro něj), uspat/vzbudit, léčit, pomazlit (kroužením myší nad ním),
- **pouto 1–50** (XP nikdy neklesá, avatar nikdy neumře),
- **šatník**: barvy (paleta + libovolná), 5 typů očí, 7 čepic, 4 druhy uší, 4 doplňky,
  3 vzory, 3 velikosti, **kód avatara** ke sdílení s kamarády,
- **5 osobností** (Kamarád, Bestie, Kouč, Motivátor, Klidný parťák), zatím s předem
  napsanými hláškami. Až připojíme Clauda, budou mluvit volně,
- **proaktivitu s limity**: připomínka pití (45 min), protažení (60 min), noční
  „jdeme spát spolu?“, občasný pokec. Frekvence se dá nastavit,
- **režim dovolená** (potřeby se zmrazí).

Na ploše je okno průhledné a **propouští myš**, takže do aplikací pod Parťákem
normálně klikáš. Myš se chytá jen na avatarovi, bublině a panelech.
V systémové liště (vedle hodin) je ikona **Schovat / ukázat** a **Ukončit**.

---

## Instalace krok za krokem (Windows)

Potřebuješ jednou nainstalovat 3 věci (celkem ~15 minut):

1. **Node.js**: stáhni verzi „LTS“ z <https://nodejs.org> a nainstaluj (vše „Další“).
2. **Rust**: stáhni `rustup-init.exe` z <https://rustup.rs> a spusť, zvol `1` (výchozí instalace).
   Pokud se instalátor zeptá na **Visual Studio C++ Build Tools**, nech je nainstalovat
   (případně: <https://visualstudio.microsoft.com/visual-cpp-build-tools/> → zaškrtni
   „Desktop development with C++“).
3. **WebView2** má Windows 10/11 už v sobě, nic nedělej.

Pak otevři **PowerShell** ve složce `02 - projekty/APP AI Kamarad/app` a spusť:

```powershell
npm install
npm run desktop
```

První spuštění trvá 3–10 minut (kompiluje se Rust), další už pár sekund.

## Instalace krok za krokem (macOS)

1. Otevři **Terminál** a nainstaluj vývojářské nástroje Applu:
   `xcode-select --install`
2. **Node.js**: <https://nodejs.org> (LTS, .pkg instalátor).
3. **Rust**: v Terminálu
   `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
   a pak zavři a znovu otevři Terminál.
4. Ve složce appky:

```bash
cd "02 - projekty/APP AI Kamarad/app"
npm install
npm run desktop
```

Na Macu se Parťák neukazuje v Docku, najdeš ho jako ikonku nahoře v liště.

## Rychlý náhled v prohlížeči (bez Rustu)

```bash
npm install
npm run dev
```

Otevři <http://localhost:5189>. Uvidíš falešnou „plochu“ s okny a Parťáka nad nimi.
Všechno kromě propouštění myši a ikony v liště funguje stejně.

## Příkazy

| Příkaz | Co dělá |
|---|---|
| `npm run desktop` | spustí desktopovou appku (vývojový režim) |
| `npm run desktop:build` | vyrobí instalačku (`.msi`/`.exe` na Windows, `.dmg`/`.app` na Macu) do `src-tauri/target/release/bundle/` |
| `npm run dev` | náhled v prohlížeči |
| `npm test` | testy tamagoči logiky |
| `npm run lint` | kontrola kódu |

## Jak to funguje (technicky)

```
src-tauri/src/lib.rs          Rust: průhledné okno přes pracovní plochu, click-through,
                              hlídání kurzoru (30×/s), ikona v liště
src/avatar/Blob.jsx           SVG blob-tvor složený z vrstev (uši, tělo, vzor, oči, pusa, čepice…)
src/avatar/catalog.js         katalog dílů, barvy, kód avatara (+ sanitizace cizích kódů)
src/avatar/motion.js          fyzika a chování (chůze, sezení, pád, míček), čistá logika
src/avatar/useMotion.js       animační smyčka, tahání a házení, oči za kurzorem
src/tamagotchi/engine.js      potřeby, péče, XP, emoce, čistá logika + testy
src/personality/lines.js      osobnosti a hlášky (budoucí základ systémových promptů)
src/ui/*                      bublina, menu péče, šatník, nastavení, vajíčko
```

**Click-through:** frontend každých 100 ms pošle jádru obdélníky prvků
s atributem `data-hit`. Rust 30× za sekundu porovná polohu kurzoru a přepíná
`set_ignore_cursor_events`. Při tahání avatara se chytá myš na celé ploše.

Data (vzhled, stav tamagoči) jsou zatím v `localStorage` webview. Později je
přesuneme do SQLite v jádře.

## Známá omezení a další kroky

- Zatím jen **hlavní monitor**. Více monitorů přijde později.
- Při hře nebo videu na celou obrazovku se zatím **neschovává** automaticky
  (ruční schování je v liště).
- macOS: průhledné okno vyžaduje `macOSPrivateApi`, což **Mac App Store nepovolí**.
  Pro Mac App Store bude potřeba jiné řešení okna. Pro přímý prodej a Steam to nevadí.
- Grafika je placeholder v SVG. Finál od ilustrátora bude v Rive se stejnými vrstvami.
- **Další spike:** mozek (Claude přes proxy) + hlas (push-to-talk → přepis → odpověď → hlas).
