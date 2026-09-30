# 04 — Plán, rozpočet, KPI a očekávané výsledky

Předpoklady: **1 člověk, ~50 h/týden** (rozsah 40–60), **80 000 Kč**, Claude jako
vývojový parťák. Časy jsou realistické odhady pro solo foundera s AI pomocí.

## 1. Roadmapa

### Fáze 0 — Validace a technické spiky (týden 1–2, ~100 h)
| Úkol | h |
|---|---|
| Název, logo-skica, kontrola ochranné známky a domény | 8 |
| Landing page + waitlist (e-mail) + krátké video/animace konceptu | 20 |
| Spike: Tauri průhledné okno, click-through, avatar chodí po ploše (Win + Mac) | 25 |
| Spike: Rive avatar s 5 emocemi + lip-sync vstup | 20 |
| Spike: hlasová smyčka PTT → STT → Claude → TTS v češtině, měření latence | 20 |
| 10 rozhovorů s cílovkou (Discord, Reddit, známí) | 7 |

**Výstup / rozhodnutí (go/no-go):** avatar žije na ploše, mluví česky do ~1,5 s,
waitlist > 150 lidí. Když ne → upravit koncept, než se utratí peníze za grafiku.

### Fáze 1 — MVP „Vylíhni si parťáka“ (týden 3–10, ~400 h)
| Blok | Obsah | h |
|---|---|---|
| Avatar | 1 druh, modulární díly (~60 předmětů), barvy, šatník UI, 15 animací | 90 |
| Tamagoči | potřeby, péče, pouto 1–20, odměny, vzpomínky, etická pravidla | 60 |
| Mozek | router, persona, 5 osobností + posuvníky, strukturované odpovědi | 60 |
| Paměť | profil, lidé, epizody, „co o mně víš“ | 40 |
| Hlas | PTT, streaming, lokální + cloud TTS, lip-sync | 45 |
| Skills | web search, poznámky, připomínky, počasí, briefing, check-in, dýchání, krize | 60 |
| Backend | auth, LLM proxy, limity, měření nákladů | 30 |
| Onboarding, nastavení, instalátor, podpis, auto-update | | 15 |

**Výstup:** uzavřená beta pro 50–100 lidí z waitlistu (Windows prioritně, Mac hned potom).

### Fáze 2 — Beta, užitečnost, monetizace (týden 11–18, ~400 h)
- E-mail (Outlook/IMAP) číst/shrnout/napsat s potvrzením
- Kalendář, program kina, nákupní vyhledávání + seznamy (affiliate)
- Wake word, proaktivní notifikátor, kouč (cíle, týdenní review)
- Obchod s kosmetikou, předplatné Plus/Pro (Lemon Squeezy/Paddle)
- Mini-hry, sezónní událost, sdílení „kódu avatara“
- Napojení Jídelního deníku (krmení) a Denního plánovače
- **Steam stránka** (sbírání wishlistů) — co nejdřív, ideálně už v týdnu ~12

### Fáze 3 — Veřejné spuštění (týden 19–26, ~400 h)
- Otevřená beta / Early Access na Steamu + přímý prodej na webu
- Angličtina (UI + osobnosti), slovenština
- Microsoft Store (MSIX), Mac App Store (sandbox úpravy)
- Browser agent pro košík (pilot), Gmail verifikace pokud to tržby dovolí
- Marketing: TikTok/Shorts série „můj parťák na ploše“, Discord komunita, CZ tech média

### Fáze 4 — Škálování (měsíc 7–12)
- Další druhy avatarů, 3D/VRM import, komunitní osobnosti
- Mobilní „společník“ (avatar v kapse, notifikace, péče na cestách)
- Sync mezi zařízeními, rodinný/firemní tarif
- Zvážit investici / grant (TA ČR, CzechInvest, EU programy) podle trakce

**Souhrn:** MVP beta ≈ 10 týdnů, veřejné spuštění ≈ 6 měsíců (~1 300 h).

---

## 2. Rozpočet 80 000 Kč

| Položka | Kč | Poznámka |
|---|---|---|
| **Grafika avatara** (freelance ilustrátor/animátor v Rive, 1 druh + ~60 dílů) | 28 000 | největší investice — to je produkt; AI koncepty pro zadání, finál ručně (konzistence, práva) |
| **API náklady** vývoj + beta (Claude, STT, TTS) | 10 000 | s limity na testery |
| **Právo**: podmínky, GDPR zásady, konzultace | 9 000 | šablona + revize právníkem |
| **Marketing**: video, reklama na TikTok/Meta test, Discord | 10 000 | jen testy kanálů, ne velký launch |
| **Apple Developer** (99 $ / rok) | 2 400 | nutné pro Mac podpis i App Store |
| **Steam Direct** (100 $, vratné po tržbách) | 2 400 | |
| **Podpis Windows** (Azure Trusted Signing ~10 $ / měs × 12) | 2 900 | bez podpisu varování „neznámý vydavatel“ |
| **Doména, hosting, DB, e-mail** (1 rok) | 3 000 | |
| **Zvuky, hudba, fonty** (licence) | 2 000 | |
| **Rezerva** | 10 300 | nečekané (např. druhé kolo grafiky) |
| **Celkem** | **80 000** | |

Co **není** v rozpočtu a přijde až z tržeb: Gmail CASA audit, prémiové hlasy
pro všechny, placená reklama ve velkém, další druhy avatarů, 3D.

> Pokud je rozpočet 80 000 **EUR**, plán se mění: najmout na částečný úvazek
> animátora (2D/Rive) a 1 vývojáře, rovnou 2–3 druhy avatarů, Gmail verifikace,
> větší launch kampaň → spuštění o ~2 měsíce dřív a s mnohem bohatším obsahem.

---

## 3. KPI — co měříme a jaké cíle

| Metrika | Cíl beta | Cíl po spuštění | Proč |
|---|---|---|---|
| Waitlist před betou | 500 | — | zájem |
| Steam wishlisty při spuštění | — | 5 000+ | algoritmus Steamu |
| D1 retence | 50 % | 45 % | první dojem |
| D7 retence | 30 % | 25 % | funguje tamagoči smyčka? |
| D30 retence | 15 % | 12 % | vztah vznikl |
| Průměrné interakce / den | 8+ | 8+ | engagement |
| % uživatelů, co upravili avatara | 70 % | 70 % | customizace = investice |
| Konverze free → placené | — | 3–6 % | peníze |
| Náklady AI / platící uživatel | < 40 % ceny | < 30 % ceny | marže |
| NPS | 40+ | 40+ | doporučování |
| Bezpečnostní incidenty | 0 | 0 | důvěra |

---

## 4. Očekávané výsledky — scénáře (12 měsíců od spuštění)

Předpoklad: průměrná tržba na platícího ≈ 130 Kč/měs po poplatcích a DPH
(mix Plus/Pro/roční), + kosmetika ≈ 15 % navíc.

| Scénář | Aktivních uživatelů (MAU) | Platících | Měsíční tržby (MRR) | Komentář |
|---|---|---|---|---|
| **Pesimistický** | 2 000 | 60 | ~9 000 Kč | pokrývá provoz, ne mzdu; pivot / niche |
| **Realistický** | 15 000 | 600 | ~90 000 Kč | ziskový vedlejšák → plný úvazek |
| **Optimistický** | 80 000 | 4 000 | ~600 000 Kč | virální TikTok/Steam hit, najímat tým |

Kritický bod: **D7 retence**. Pokud je v betě pod ~20 %, nesmí se škálovat
marketing — nejdřív opravit smyčku (tamagoči, briefing, osobnost).

---

## 5. Týdenní rytmus (50 h)

| Den | Fokus |
|---|---|
| Po | plán týdne (15 min review KPI), deep work vývoj |
| Út–Čt | deep work vývoj (hlavní feature týdne) |
| Pá | dokončení, build, testy, release pro testery; 2 h komunita/obsah |
| So (volitelné) | obsah na TikTok/Discord, rozhovory s uživateli |
| Ne | volno (vyhoření = největší riziko solo projektu) |

Pravidlo: **každý pátek něco, co si testeři můžou pustit.**

---

## 6. Nejbližší kroky (tento a příští týden)

1. ✅ Ústava (`/CLAUDE.md`) a studie — hotovo.
2. Vybrat **pracovní název** (musí fungovat CZ i EN, volná doména .com/.cz, nekolidovat s ochrannou známkou).
3. Nakreslit / nechat vygenerovat 3–5 konceptů vzhledu „blob-tvora“ → vybrat 1 styl.
4. **Spike 1:** Tauri 2 appka s průhledným oknem a postavičkou, která chodí po spodní hraně obrazovky a jde chytit myší.
5. **Spike 2:** hlasová smyčka v češtině (PTT → STT → Claude → TTS), změřit latenci a cenu.
6. Landing page + waitlist (Vercel, stejně jako ostatní appky).
7. Napsat zadání pro ilustrátora (styl, kostra, seznam dílů, formát Rive).
