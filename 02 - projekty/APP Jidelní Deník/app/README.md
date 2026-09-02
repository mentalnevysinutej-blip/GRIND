# Jídelní deník

Spočítá denní potřebu kalorií a makroživin (BMR/TDEE), pomůže sestavit jídelníček
(ručně nebo AI návrhem) a z něj rovnou spočítá nákupní seznam a týdenní/měsíční
výdaje za jídlo.

## Jak to funguje

- **Frontend** — Vite + React, profil i jídelníček žijí lokálně v prohlížeči
  (localStorage), nic se neposílá na žádný server kromě volitelného AI generování.
- **Backend** — tenký proxy, který drží Anthropic API klíč a volá Claude pro
  návrh jídelníčku. Klíč se nikdy neposílá do prohlížeče. Dvě podoby stejného
  API, ať appka běží kdekoliv:
  - `server/` — Express server pro lokální vývoj (`npm run dev`).
  - `api/` — stejné endpointy jako Vercel serverless funkce pro nasazení.

## Spuštění (lokálně)

```bash
npm install
npm run dev
```

Spustí se frontend (http://localhost:5185) i backend (http://localhost:5177) zároveň.

### Nastavení API klíče (jen pro AI návrh jídelníčku, lokálně)

1. V appce přepni na záložku Jídelníček → "Navrhneš mi ho".
2. Vlož Anthropic API klíč (z [console.anthropic.com](https://console.anthropic.com)) do pole,
   které se zobrazí, a klikni "Uložit" — uloží se lokálně do `server/.env`
   (necommitovaný soubor).

Bez klíče appka funguje normálně (profil, ruční jídelníček, nákupní seznam),
jen je zablokované tlačítko AI generování.

## Nasazení na Vercel (pro sdílení s ostatními)

1. Na [vercel.com](https://vercel.com) → **Add New → Project** → naimportuj tento
   GitHub repo (`GRIND`).
2. V nastavení projektu při importu nastav **Root Directory** na
   `02 - projekty/APP Jidelní Deník/app` (Vercel framework preset "Vite" se
   napojí automaticky).
3. V **Settings → Environment Variables** přidej `ANTHROPIC_API_KEY` (hodnota =
   tvůj klíč z [console.anthropic.com](https://console.anthropic.com)) a klikni **Deploy**.
4. Po nasazení appka běží na `https://<projekt>.vercel.app` — tenhle odkaz stačí
   poslat komukoliv, funguje včetně AI návrhu jídelníčku.

Bez nastaveného `ANTHROPIC_API_KEY` appka na Vercelu funguje také (profil,
ruční jídelníček, nákupní seznam), jen AI generování vrátí chybu — API klíč
jde v appce uložit jen lokálně (`server/.env`), na Vercelu se nastavuje
výhradně přes Environment Variables v dashboardu.
