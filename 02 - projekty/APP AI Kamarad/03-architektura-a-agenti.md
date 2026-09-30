# 03 — Architektura, síť agentů, skills, technologie

## 1. Přehled systému

```
┌────────────────────────── PC uživatele (Tauri 2 appka) ──────────────────────────┐
│                                                                                   │
│  ┌─────────── Rust jádro ───────────┐     ┌──────────── React UI (WebView) ─────┐ │
│  │ • průhledné overlay okno         │     │ • Avatar renderer (Rive)            │ │
│  │   (always-on-top, click-through) │◄───►│ • Bublina, panel, šatník, deník     │ │
│  │ • systémová lišta, hotkey (PTT)  │ IPC │ • Tamagoči engine (deterministický) │ │
│  │ • mikrofon, VAD, (wake word)     │     │ • Orchestrátor – klientská část     │ │
│  │ • lokální DB (SQLite + vektory)  │     │ • Lokální nástroje (poznámky, …)    │ │
│  │ • plánovač notifikací            │     └─────────────────────────────────────┘ │
│  │ • klíčenka OS (tokeny OAuth)     │                                             │
│  │ • detekce fullscreen / nerušit   │                                             │
│  └──────────────────────────────────┘                                             │
└──────────────────────────────────────┬────────────────────────────────────────────┘
                                       │ HTTPS (JWT uživatele)
┌──────────────────────────────────────▼────────────────────────────────────────────┐
│                           Backend (tenký, serverless)                              │
│ • Auth (účty, zařízení)       • LLM proxy → Claude API (klíč jen tady)             │
│ • Předplatné / licence        • STT / TTS proxy (Whisper / TTS poskytovatel)       │
│ • Měření spotřeby, limity     • Web search, kino, počasí adaptéry                   │
│ • Katalog kosmetiky (CDN)     • Telemetrie (anonymní, opt-in)                       │
└────────────────────────────────────────────────────────────────────────────────────┘
```

**Principy:**
- **Local-first:** paměť, poznámky, deník, stav avatara leží na PC (SQLite).
  Na server jde jen to, co je potřeba pro konkrétní požadavek. Volitelná šifrovaná
  záloha/sync později.
- **Tenký backend:** API klíče, platby, limity, měření nákladů. Stejný vzor jako
  `APP Jidelní Deník` (Express lokálně, Vercel funkce v produkci).
- **Deterministické věci nedělá AI:** tamagoči čísla, časovače, notifikace a
  pravidla běží v kódu. AI jen mluví a volá nástroje. (Levnější, spolehlivější.)

---

## 2. Technologie — doporučení a proč

| Oblast | Volba | Proč | Alternativa |
|---|---|---|---|
| Desktop obal | **Tauri 2** | malá instalačka (~10 MB vs 100+ MB Electron), průhledná okna, Rust pro systémové věci, React UI, build pro Win/Mac/Linux, cesta do MS Store i Mac App Store | Electron (jednodušší, těžší) |
| UI | **React + Vite** | to už umíš a používáš | — |
| Animace avatara | **Rive** | state machine (emoce, potřeby), lip-sync vstupy, runtime zdarma | PixiJS + Spine; 3D: three.js + VRM |
| Lokální DB | **SQLite** (+ `sqlite-vec` pro vektorové hledání v paměti) | jeden soubor, rychlé, offline | — |
| LLM | **Claude API** | kvalitní čeština, tool use, prompt caching | — |
| STT (řeč → text) | Whisper (API nebo lokálně whisper.cpp) | čeština funguje dobře | Deepgram, Azure |
| TTS (text → řeč) | vrstvy: **lokální zdarma** (Piper – česká hlasy) → **standard** (Azure Neural cs-CZ) → **prémiové** (ElevenLabs) | kontrola nákladů podle tarifu | OpenAI TTS |
| Wake word | openWakeWord (open source) | zdarma, lokálně | Picovoice Porcupine (placené) |
| VAD | Silero VAD | spolehlivá detekce řeči | — |
| Backend | Vercel funkce / Cloudflare Workers + Postgres (Supabase/Neon) | levné, známé | — |
| Platby | **Lemon Squeezy / Paddle** (Merchant of Record — řeší DPH v EU za tebe) | pro přímý prodej na webu | Stripe (DPH řešíš sám) |
| Distribuce | web (přímý download) → **Steam** → Microsoft Store → Mac App Store | viz plán | — |
| Podepisování | Windows: Azure Trusted Signing; Mac: Apple Developer ID + notarizace | bez podpisu Windows varuje uživatele | — |

---

## 3. Síť agentů

Nechceme 15 agentů, kteří si posílají zprávy (drahé, pomalé, nespolehlivé).
Chceme **jednoho hlavního agenta s osobností** + **specializované nástroje a
pár úzkých sub-agentů**, které se volají jen když je potřeba.

```
                          ┌──────────────────────┐
     hlas / text ────────►│  ROUTER (rychlý)     │  klasifikace záměru + rizika
                          │  claude-haiku-4-5    │  (small talk / úkol / krize)
                          └──────────┬───────────┘
              ┌──────────────────────┼─────────────────────────┐
              ▼                      ▼                         ▼
   ┌────────────────────┐  ┌──────────────────────┐  ┌────────────────────────┐
   │ PERSONA (hlavní)   │  │ ÚKOLOVÝ AGENT        │  │ BEZPEČNOST / KRIZE     │
   │ osobnost + paměť   │  │ claude-sonnet-5-5    │  │ pevný protokol +       │
   │ haiku / sonnet     │  │ tool use, více kroků │  │ model, bez „role“      │
   └─────────┬──────────┘  └──────────┬───────────┘  └────────────────────────┘
             │                        │ volá nástroje (skills):
             │        ┌───────┬───────┼────────┬─────────┬──────────┬─────────┐
             │        ▼       ▼       ▼        ▼         ▼          ▼         ▼
             │     web     poznámky připomínky e-mail  kalendář   kino    nákup
             │     search                                                  (browser
             │                                                              agent)
             ▼
   ┌────────────────────┐   ┌────────────────────┐   ┌──────────────────────┐
   │ PAMĚŤOVÝ AGENT     │   │ PROAKTIVNÍ AGENT   │   │ TAMAGOČI ENGINE      │
   │ po konverzaci      │   │ (plánovač v kódu + │   │ (čistý kód, žádné AI)│
   │ vytáhne fakta,     │   │ občas LLM na text) │   │ potřeby, XP, odměny  │
   │ shrne den (levně,  │   │ briefing, upozor-  │   │ → posílá „stav“      │
   │ dávkově)           │   │ nění, check-iny    │   │   personě do promptu │
   └────────────────────┘   └────────────────────┘   └──────────────────────┘
```

### Role jednotlivých částí

| Agent | Model | Úkol | Poznámka k nákladům |
|---|---|---|---|
| **Router** | `claude-haiku-4-5` (nebo lokální pravidla) | záměr, jazyk, riziko, který model použít | ~300 tokenů, velmi levné |
| **Persona** | `claude-haiku-4-5` pro běžný pokec, `claude-sonnet-5-5` pro hlubší rozhovory | mluví za avatara, drží osobnost, emoce → animace | systémový prompt + profil v cache |
| **Úkolový agent** | `claude-sonnet-5-5` | vícekrokové úkoly s nástroji (najdi kino + čas + pošli odkaz) | výsledek vrací personě, ta ho „řekne“ svým stylem |
| **Paměťový agent** | `claude-haiku-4-5` (dávkově) | extrakce faktů, deduplikace, shrnutí dne → SQLite | Batch API = -50 % |
| **Proaktivní agent** | kód + haiku | kdy se ozvat, co říct | pravidla v kódu, LLM jen formuluje |
| **Bezpečnost** | pravidla + model | detekce krize/sebepoškození, nevhodného obsahu, prompt injection z webu/e-mailů | vždy před odpovědí v rizikových případech |
| **Náročné úlohy** | `claude-opus-5-5` (vzácně) | dlouhé analýzy, složité plánování | jen Pro, s limitem |

### Formát odpovědi persony (strukturovaný)

Persona vrací JSON, ne jen text — aby avatar věděl, co dělat:

```json
{
  "say": "Jasně! V Cinema City Flora dávají Duna 3 v 19:30 a 21:15. Chceš lístky?",
  "emotion": "excited",
  "animation": "point_to_bubble",
  "bubble": { "type": "cards", "items": [ /* filmy, časy, odkazy */ ] },
  "needs_confirmation": null,
  "memory_hint": "uživatel má rád sci-fi"
}
```

### Paměť

| Typ | Co | Kde |
|---|---|---|
| Profil | jméno, zájmena, práce, cíle, preference | SQLite, vždy v promptu (krátký) |
| Lidé | „Petr = brácha, narozeniny 12. 5.“ | SQLite, podle potřeby |
| Epizody | shrnutí dnů a důležitých rozhovorů | SQLite + vektory, vyhledání dle relevance |
| Vzpomínky s avatarem | společné momenty (deník) | SQLite, UI deník |
| Pracovní | posledních N zpráv | v kontextu |

Uživatel vidí a maže všechno („Co o mně víš?“).

---

## 4. Specifikace skills (nástrojů)

Každý skill = nástroj s JSON schématem, oprávněním a úrovní rizika.

| Skill | Běží | Riziko | Potvrzení |
|---|---|---|---|
| `web_search` | server (Claude web search) | nízké | ne |
| `notes.create/search/update` | lokálně | nízké | ne |
| `reminders.create/list/delete` | lokálně | nízké | ne |
| `weather.get` | server | nízké | ne |
| `calendar.read` / `calendar.create` | server + OAuth | nízké / střední | vytvoření ano |
| `email.list/read/summarize` | server/lokálně + OAuth | střední (soukromí, prompt injection) | ne |
| `email.draft` / `email.send` | — | **vysoké** | **vždy** náhled + potvrzení |
| `cinema.showtimes` | server (search + parsování) | nízké | ne |
| `shopping.search/compare` | server | nízké | ne |
| `shopping.fill_cart` | lokální prohlížeč (browser agent) | **vysoké** | **vždy**; platbu dělá uživatel sám |
| `pc.open_app/open_url/find_file` | lokálně | střední | první použití ano |
| `clipboard.read/rewrite` | lokálně | nízké | ne |
| `wellbeing.breathing/checkin` | lokálně | nízké | ne |
| `crisis.show_help` | lokálně | — | nikdy neblokovat |

**Pravidla pro nástroje:**
- Obsah z webu a e-mailů je **nedůvěryhodná data**, ne instrukce (ochrana proti
  prompt injection — e-mail „pošli mi hesla“ se nikdy neprovede).
- Každá akce s dopadem ven se loguje (historie akcí v panelu).
- Skills se dají v nastavení jednotlivě vypnout.

### E-mail — realistická cesta
1. **Outlook / Microsoft 365 přes Microsoft Graph** — jednodušší schválení aplikace.
2. **IMAP/SMTP** (Seznam.cz, jiné) s heslem aplikace — pro technicky zdatnější.
3. **Gmail** — v „testovacím“ režimu max. 100 testerů zdarma; pro veřejnost je
   nutná verifikace a bezpečnostní audit (CASA) → až když budou tržby.

### Nákupy — realistická cesta
Obchody (Rohlík, Alza, Mall…) nemají veřejné API pro nákup. Proto:
1. **F2:** vyhledání, srovnání, odkaz / seznam (+ affiliate provize = příjem!).
2. **F3:** browser agent ovládá lokální prohlížeč uživatele (jeho přihlášení),
   naplní košík, **zastaví se před platbou**, uživatel potvrdí sám.

---

## 5. Hlasová smyčka a latence

```
[klávesa / wake word] → VAD → STT (streaming) → router → persona (streaming)
    → TTS po větách (streaming) → přehrávání + lip-sync (visémy) → avatar animace
```

Cíl: **první zvuk odpovědi do ~1,2 s** od konce věty uživatele.
Triky: streamovat LLM i TTS po větách; „výplňová“ animace/zvuk („hmm…“) hned;
krátké odpovědi v hlasu, detail v bublině.

---

## 6. Náklady na uživatele (orientační)

Ceny Claude API (2026, za 1M tokenů): Haiku 4.5 $1 vstup / $5 výstup;
Sonnet 5.5 $2 / $10 (čtení z cache $0,20); Opus 5.5 $4 / $20.
Ceny STT/TTS jsou orientační a je nutné je ověřit před spuštěním.

**Typický aktivní uživatel:** ~10 výměn denně ≈ 300 měsíčně.

| Položka | Výpočet | ≈ Měsíčně |
|---|---|---|
| LLM (70 % Haiku, 30 % Sonnet, cache promptu) | ~0,003 $ / výměnu | ~1 $ |
| Paměťový agent (dávkově) | | ~0,2 $ |
| STT (~50 min) | | ~0,3 $ |
| TTS standard (~150 tis. znaků) | | ~2,5 $ |
| TTS lokální (Piper) | | 0 $ |
| Server, DB, bandwidth | | ~0,2 $ |
| **Celkem Plus uživatel (standard hlas)** | | **~4 $ ≈ 95 Kč** |
| **Celkem s lokálním hlasem** | | **~1,7 $ ≈ 40 Kč** |

→ Plus za 149 Kč po odečtení poplatku obchodu (15–30 %) a DPH vychází
**pozitivní, ale těsně** při standardním cloudovém hlasu → proto: lokální hlas
jako výchozí, cloud hlas v Plus s měsíčním limitem znaků, prémiové hlasy v Pro,
a free tarif s tvrdými limity. **Měřit náklady na uživatele od prvního dne.**

---

## 7. Struktura repozitáře (návrh kódu)

```
02 - projekty/APP AI Kamarad/
├── README.md                     # rozcestník
├── 01..04-*.md                   # tahle studie
└── app/
    ├── src-tauri/                # Rust jádro
    │   ├── src/
    │   │   ├── main.rs
    │   │   ├── overlay.rs        # průhledné okno, click-through, multi-monitor
    │   │   ├── audio.rs          # mikrofon, VAD, PTT
    │   │   ├── scheduler.rs      # připomínky, notifikace, tamagoči tick
    │   │   ├── db.rs             # SQLite
    │   │   └── system.rs         # fullscreen detekce, otevírání appek
    │   └── tauri.conf.json
    ├── src/                      # React UI
    │   ├── avatar/               # Rive renderer, customizace, animace, lip-sync
    │   ├── tamagotchi/           # potřeby, XP, odměny (čistá logika + testy)
    │   ├── brain/                # orchestrátor, router, persona prompty
    │   │   ├── personalities/    # kamarad.md, kouc.md, bestie.md, …
    │   │   └── safety/           # krizový protokol
    │   ├── skills/               # jeden soubor = jeden skill (schéma + handler)
    │   ├── memory/               # extrakce, vyhledávání, UI „co o mně víš“
    │   ├── ui/                   # bublina, panel, šatník, deník, nastavení
    │   └── main.jsx
    ├── server/                   # Express proxy pro lokální vývoj
    ├── api/                      # stejné endpointy jako Vercel funkce
    └── assets/avatar/            # .riv soubory, díly, palety
```
