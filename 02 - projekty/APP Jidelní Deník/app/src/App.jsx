import React, { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Trash2, Sparkles, ShoppingCart, ChefHat, Target, Loader2, RefreshCw, KeyRound } from "lucide-react";
import { getConfig, saveKey, generatePlan } from "./lib/api";

/* ---------------------------------- data ---------------------------------- */

const ACTIVITY = [
  { id: "low", label: "Sedavá práce, málo pohybu", factor: 1.2 },
  { id: "light", label: "Lehká aktivita (1–3× týdně)", factor: 1.375 },
  { id: "moderate", label: "Střední aktivita (3–5× týdně)", factor: 1.55 },
  { id: "high", label: "Vysoká aktivita (6–7× týdně)", factor: 1.725 },
];

const GOALS = [
  { id: "lose", label: "Hubnutí" },
  { id: "maintain", label: "Udržování" },
  { id: "gain", label: "Nabírání" },
];

const UNITS = ["g", "ml", "ks"];
const STORAGE_KEY = "mealplanner-state";

const emptyIngredient = () => ({
  id: crypto.randomUUID(),
  name: "",
  amount: "",
  unit: "g",
  kcal100: "",
  protein100: "",
  carbs100: "",
  fat100: "",
  packagePrice: "",
  packageSize: "",
});

const emptyMeal = (name = "") => ({
  id: crypto.randomUUID(),
  name,
  frequency: 7,
  ingredients: [emptyIngredient()],
});

/* -------------------------------- helpers --------------------------------- */

function calcTargets(profile) {
  const a = parseFloat(profile.age);
  const w = parseFloat(profile.weight);
  const h = parseFloat(profile.height);
  if (!a || !w || !h) return null;
  const bmr = 10 * w + 6.25 * h - 5 * a + (profile.gender === "male" ? 5 : -161);
  const factor = ACTIVITY.find((x) => x.id === profile.activity)?.factor || 1.2;
  const tdee = bmr * factor;
  let kcal;
  if (profile.goal === "lose") kcal = tdee - 500;
  else if (profile.goal === "gain") kcal = tdee + 400;
  else kcal = tdee;
  kcal = Math.round(kcal);

  const proteinPerKg = profile.goal === "lose" ? 2.0 : 1.8;
  const proteinG = Math.round(w * proteinPerKg);
  const proteinKcal = proteinG * 4;
  const fatKcal = Math.round(kcal * 0.27);
  const fatG = Math.round(fatKcal / 9);
  const carbsKcal = Math.max(0, kcal - proteinKcal - fatKcal);
  const carbsG = Math.round(carbsKcal / 4);

  return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, proteinG, fatG, carbsG };
}

function num(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function ingredientMacros(ing) {
  const factor = num(ing.amount) / 100;
  return {
    kcal: num(ing.kcal100) * factor,
    protein: num(ing.protein100) * factor,
    carbs: num(ing.carbs100) * factor,
    fat: num(ing.fat100) * factor,
  };
}

function ingredientUnitCost(ing) {
  const size = num(ing.packageSize);
  if (!size) return 0;
  return num(ing.packagePrice) / size;
}

function ingredientCost(ing) {
  return ingredientUnitCost(ing) * num(ing.amount);
}

function mealTotals(meal) {
  return meal.ingredients.reduce(
    (acc, ing) => {
      const m = ingredientMacros(ing);
      acc.kcal += m.kcal;
      acc.protein += m.protein;
      acc.carbs += m.carbs;
      acc.fat += m.fat;
      acc.cost += ingredientCost(ing);
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0, cost: 0 }
  );
}

function dailyTotals(meals) {
  return meals.reduce(
    (acc, meal) => {
      const t = mealTotals(meal);
      acc.kcal += t.kcal;
      acc.protein += t.protein;
      acc.carbs += t.carbs;
      acc.fat += t.fat;
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function shoppingList(meals) {
  const map = new Map();
  meals.forEach((meal) => {
    const freq = num(meal.frequency) || 0;
    meal.ingredients.forEach((ing) => {
      if (!ing.name.trim()) return;
      const key = ing.name.trim().toLowerCase() + "|" + ing.unit;
      const weeklyAmount = num(ing.amount) * freq;
      const weeklyCost = ingredientCost(ing) * freq;
      if (!map.has(key)) {
        map.set(key, { name: ing.name.trim(), unit: ing.unit, amount: 0, cost: 0 });
      }
      const row = map.get(key);
      row.amount += weeklyAmount;
      row.cost += weeklyCost;
    });
  });
  return Array.from(map.values()).sort((a, b) => b.cost - a.cost);
}

function fmt(n, d = 0) {
  return n.toLocaleString("cs-CZ", { minimumFractionDigits: d, maximumFractionDigits: d });
}

/* --------------------------------- widgets --------------------------------- */

function MacroBar({ label, value, target, unit, color }) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0;
  const over = target && value > target * 1.1;
  const under = target && value < target * 0.9;
  return (
    <div className="macrobar">
      <div className="macrobar-head">
        <span className="macrobar-label">{label}</span>
        <span className="macrobar-value">
          {fmt(value)} / {fmt(target)} {unit}
        </span>
      </div>
      <div className="macrobar-track">
        <div
          className="macrobar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {target > 0 && (over || under) && (
        <div className="macrobar-hint">{over ? "nad cílem" : "pod cílem"}</div>
      )}
    </div>
  );
}

function ApiKeySetup({ configured, onSaved }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (configured) return null;

  const submit = async () => {
    if (!value.trim()) return;
    setSaving(true);
    setError("");
    try {
      await saveKey(value.trim());
      setValue("");
      onSaved();
    } catch (e) {
      setError(e.message || "Uložení se nepovedlo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="key-setup">
      <div className="key-setup-head">
        <KeyRound size={14} />
        <span>AI generování potřebuje Anthropic API klíč (uloží se jen lokálně na tvém serveru).</span>
      </div>
      <div className="key-setup-row">
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="sk-ant-..."
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button className="btn secondary" onClick={submit} disabled={saving || !value.trim()}>
          {saving ? <Loader2 size={14} className="spin" /> : "Uložit"}
        </button>
      </div>
      {error && <div className="gen-error">{error}</div>}
    </div>
  );
}

/* ---------------------------------- app ------------------------------------ */

export default function App() {
  const [profile, setProfile] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.profile) return data.profile;
      }
    } catch (e) {
      // no saved data yet
    }
    return { gender: "male", age: "", weight: "", height: "", activity: "low", goal: "maintain" };
  });
  const [tab, setTab] = useState("profile");
  const [mode, setMode] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw).mode || "ai" : "ai";
    } catch (e) {
      return "ai";
    }
  }); // "ai" | "manual"
  const [mealsPerDay, setMealsPerDay] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw).mealsPerDay || 4 : 4;
    } catch (e) {
      return 4;
    }
  });
  const [preference, setPreference] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw).preference || "bez omezení" : "bez omezení";
    } catch (e) {
      return "bez omezení";
    }
  });
  const [meals, setMeals] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw).meals || [] : [];
    } catch (e) {
      return [];
    }
  });
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [apiConfigured, setApiConfigured] = useState(null); // null = unknown yet
  const saveTimer = useRef(null);

  const targets = calcTargets(profile);

  const refreshConfig = useCallback(() => {
    getConfig()
      .then((res) => setApiConfigured(Boolean(res.configured)))
      .catch(() => setApiConfigured(false));
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  /* ---- debounced save ---- */
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ profile, mode, mealsPerDay, preference, meals })
        );
      } catch (e) {
        console.error("Uložení se nezdařilo", e);
      }
    }, 300);
    return () => clearTimeout(saveTimer.current);
  }, [profile, mode, mealsPerDay, preference, meals]);

  /* ---- meal editing helpers ---- */
  const updateMeal = (id, patch) =>
    setMeals((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const removeMeal = (id) => setMeals((ms) => ms.filter((m) => m.id !== id));

  const addMeal = () => setMeals((ms) => [...ms, emptyMeal(`Jídlo ${ms.length + 1}`)]);

  const updateIngredient = (mealId, ingId, patch) =>
    setMeals((ms) =>
      ms.map((m) =>
        m.id !== mealId
          ? m
          : { ...m, ingredients: m.ingredients.map((i) => (i.id === ingId ? { ...i, ...patch } : i)) }
      )
    );

  const addIngredient = (mealId) =>
    setMeals((ms) =>
      ms.map((m) => (m.id === mealId ? { ...m, ingredients: [...m.ingredients, emptyIngredient()] } : m))
    );

  const removeIngredient = (mealId, ingId) =>
    setMeals((ms) =>
      ms.map((m) =>
        m.id === mealId ? { ...m, ingredients: m.ingredients.filter((i) => i.id !== ingId) } : m
      )
    );

  /* ---- AI generation ---- */
  const generatePlanFromAi = useCallback(async () => {
    if (!targets) {
      setGenError("Nejdřív vyplň a spočítej svůj profil v záložce Cíl.");
      return;
    }
    if (!apiConfigured) {
      setGenError("Nejdřív nastav Anthropic API klíč výše.");
      return;
    }
    setGenerating(true);
    setGenError("");
    try {
      const sys =
        "Jsi nutriční asistent. Odpovídej výhradně čistým JSON bez markdown bloků a bez jakéhokoli textu navíc.";
      const prompt = `Sestav denní jídelníček o ${mealsPerDay} jídlech pro cíl: ${fmt(
        targets.kcal
      )} kcal, bílkoviny ${targets.proteinG} g, sacharidy ${targets.carbsG} g, tuky ${targets.fatG} g.
Preference/omezení: ${preference}.
Součet přes všechna jídla se má co nejvíce blížit zadaným cílům.
Každé jídlo má 2–4 běžné, dostupné suroviny (české reálie) v gramech/mililitrech.
Vrať JSON přesně v tomto tvaru, žádný další text:
{"meals":[{"name":"string","ingredients":[{"name":"string","amount":number,"unit":"g|ml|ks","kcal100":number,"protein100":number,"carbs100":number,"fat100":number}]}]}
kcal100/protein100/carbs100/fat100 jsou hodnoty na 100 g/ml (na 1 ks pro položky v ks). Buď stručný, žádné komentáře.`;

      const { text } = await generatePlan(sys, prompt);
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      const newMeals = (parsed.meals || []).map((m) => ({
        id: crypto.randomUUID(),
        name: m.name || "Jídlo",
        frequency: 7,
        ingredients: (m.ingredients || []).map((ing) => ({
          id: crypto.randomUUID(),
          name: ing.name || "",
          amount: ing.amount ?? "",
          unit: UNITS.includes(ing.unit) ? ing.unit : "g",
          kcal100: ing.kcal100 ?? "",
          protein100: ing.protein100 ?? "",
          carbs100: ing.carbs100 ?? "",
          fat100: ing.fat100 ?? "",
          packagePrice: "",
          packageSize: "",
        })),
      }));
      if (newMeals.length === 0) throw new Error("Prázdná odpověď");
      setMeals(newMeals);
    } catch (e) {
      setGenError(e.message || "Generování se nepovedlo, zkus to prosím znovu.");
    } finally {
      setGenerating(false);
    }
  }, [targets, mealsPerDay, preference, apiConfigured]);

  const totals = dailyTotals(meals);
  const list = shoppingList(meals);
  const weeklyCost = list.reduce((s, r) => s + r.cost, 0);

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');

        :root {
          --bg: #FAF6EF;
          --surface: #FFFFFF;
          --ink: #2A2420;
          --ink-soft: #79695C;
          --line: #E4DAC9;
          --protein: #B5473C;
          --carbs: #C08A2E;
          --fat: #55735A;
          --accent: #7A4B3A;
          --accent-soft: #F1E6D6;
        }
        * { box-sizing: border-box; }
        .app {
          background: var(--bg);
          color: var(--ink);
          font-family: 'Inter', sans-serif;
          min-height: 100%;
          padding: 32px 20px 64px;
        }
        .shell { max-width: 760px; margin: 0 auto; }
        .header { margin-bottom: 28px; }
        .header h1 {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 34px;
          margin: 0 0 6px;
          letter-spacing: -0.01em;
        }
        .header p { margin: 0; color: var(--ink-soft); font-size: 15px; max-width: 46ch; }

        .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--line); margin-bottom: 24px; }
        .tab-btn {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          background: none;
          border: none;
          padding: 10px 14px;
          cursor: pointer;
          color: var(--ink-soft);
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
        .tab-btn:hover:not(.active) { color: var(--ink); }

        .card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 16px;
        }
        .card h2 {
          font-family: 'Fraunces', serif;
          font-size: 19px;
          font-weight: 600;
          margin: 0 0 14px;
        }
        .card h3 {
          font-family: 'Fraunces', serif;
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        label { display: block; font-size: 12.5px; color: var(--ink-soft); margin-bottom: 5px; }
        input, select {
          width: 100%;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          padding: 9px 10px;
          border: 1px solid var(--line);
          border-radius: 5px;
          background: var(--bg);
          color: var(--ink);
        }
        input:focus, select:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
        .field { margin-bottom: 14px; }

        .segmented { display: flex; border: 1px solid var(--line); border-radius: 6px; overflow: hidden; }
        .segmented button {
          flex: 1; padding: 9px; font-size: 13.5px; font-family: 'Inter', sans-serif;
          background: var(--surface); border: none; cursor: pointer; color: var(--ink-soft);
          border-right: 1px solid var(--line);
        }
        .segmented button:last-child { border-right: none; }
        .segmented button.active { background: var(--accent-soft); color: var(--accent); font-weight: 600; }

        .btn {
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 14px;
          padding: 10px 18px;
          border-radius: 6px;
          border: 1px solid var(--accent);
          background: var(--accent);
          color: #fff;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }
        .btn:hover { opacity: 0.92; }
        .btn:disabled { opacity: 0.5; cursor: default; }
        .btn.secondary { background: transparent; color: var(--accent); }
        .btn.ghost {
          background: transparent; color: var(--ink-soft); border-color: var(--line);
          font-weight: 500; font-size: 13px; padding: 7px 12px;
        }

        .kcal-hero { display: flex; align-items: baseline; gap: 10px; margin: 4px 0 18px; }
        .kcal-hero .num {
          font-family: 'IBM Plex Mono', monospace; font-size: 44px; font-weight: 600; color: var(--accent);
        }
        .kcal-hero .unit { font-size: 15px; color: var(--ink-soft); }
        .sub-stats { display: flex; gap: 22px; font-size: 12.5px; color: var(--ink-soft); margin-bottom: 4px; }
        .sub-stats b { font-family: 'IBM Plex Mono', monospace; color: var(--ink); font-weight: 500; }

        .macrobar { margin-bottom: 13px; }
        .macrobar-head { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px; }
        .macrobar-label { font-weight: 500; }
        .macrobar-value { font-family: 'IBM Plex Mono', monospace; color: var(--ink-soft); font-size: 12.5px; }
        .macrobar-track { height: 7px; background: var(--accent-soft); border-radius: 4px; overflow: hidden; }
        .macrobar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
        .macrobar-hint { font-size: 11px; color: var(--ink-soft); margin-top: 3px; }

        .mode-row { display: flex; gap: 10px; align-items: flex-end; margin-bottom: 4px; }
        .mode-row .field { flex: 1; margin-bottom: 0; }
        .gen-error { color: var(--protein); font-size: 13px; margin-top: 10px; }

        .key-setup { background: var(--accent-soft); border-radius: 6px; padding: 12px 14px; margin-bottom: 16px; }
        .key-setup-head { display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: var(--ink); margin-bottom: 8px; }
        .key-setup-row { display: flex; gap: 8px; }
        .key-setup-row input { background: var(--surface); }

        .meal-card { border: 1px solid var(--line); border-radius: 8px; padding: 16px; margin-bottom: 14px; background: var(--surface); }
        .meal-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 12px; }
        .meal-head input.meal-name {
          font-family: 'Fraunces', serif; font-size: 17px; font-weight: 600; border: none; background: none; padding: 2px 0;
        }
        .freq-field { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--ink-soft); white-space: nowrap; }
        .freq-field input { width: 48px; padding: 5px 6px; text-align: center; }

        table.ing-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        table.ing-table th {
          text-align: left; font-weight: 500; color: var(--ink-soft); padding: 4px 6px; border-bottom: 1px solid var(--line);
          font-size: 11px; text-transform: none;
        }
        table.ing-table td { padding: 4px 6px; }
        table.ing-table input, table.ing-table select { padding: 6px 7px; font-size: 12.5px; }
        table.ing-table .col-name { min-width: 120px; }
        table.ing-table .col-num { width: 62px; }
        table.ing-table .col-unit { width: 58px; }
        .icon-btn { background: none; border: none; cursor: pointer; color: var(--ink-soft); padding: 4px; display: flex; }
        .icon-btn:hover { color: var(--protein); }

        .meal-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--line); font-size: 12.5px; }
        .meal-foot .totals { font-family: 'IBM Plex Mono', monospace; color: var(--ink-soft); }

        .daily-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 24px 20px; }

        .shop-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .shop-table th { text-align: left; padding: 8px 6px; border-bottom: 1px solid var(--line); color: var(--ink-soft); font-weight: 500; font-size: 12px; }
        .shop-table td { padding: 8px 6px; border-bottom: 1px solid var(--accent-soft); }
        .shop-table td.num, .shop-table th.num { text-align: right; font-family: 'IBM Plex Mono', monospace; }

        .total-row { display: flex; justify-content: space-between; align-items: baseline; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--line); }
        .total-row .label { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 600; }
        .total-row .value { font-family: 'IBM Plex Mono', monospace; font-size: 24px; color: var(--accent); font-weight: 600; }
        .empty { color: var(--ink-soft); font-size: 13.5px; padding: 20px 0; text-align: center; }
        .spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="shell">
        <div className="header">
          <h1>Jídelní deník</h1>
          <p>Spočítej si denní potřebu kalorií a makroživin, sestav jídelníček a rovnou sleduj, kolik tě bude stát nákup na týden.</p>
        </div>

        <div className="tabs">
          <button className={`tab-btn ${tab === "profile" ? "active" : ""}`} onClick={() => setTab("profile")}>
            <Target size={15} /> Cíl
          </button>
          <button className={`tab-btn ${tab === "meals" ? "active" : ""}`} onClick={() => setTab("meals")}>
            <ChefHat size={15} /> Jídelníček
          </button>
          <button className={`tab-btn ${tab === "shopping" ? "active" : ""}`} onClick={() => setTab("shopping")}>
            <ShoppingCart size={15} /> Nákup a výdaje
          </button>
        </div>

        {tab === "profile" && (
          <div>
            <div className="card">
              <h2>Tvůj profil</h2>
              <div className="field">
                <label>Pohlaví</label>
                <div className="segmented">
                  <button className={profile.gender === "male" ? "active" : ""} onClick={() => setProfile({ ...profile, gender: "male" })}>Muž</button>
                  <button className={profile.gender === "female" ? "active" : ""} onClick={() => setProfile({ ...profile, gender: "female" })}>Žena</button>
                </div>
              </div>
              <div className="grid2">
                <div className="field">
                  <label>Věk (roky)</label>
                  <input type="number" value={profile.age} onChange={(e) => setProfile({ ...profile, age: e.target.value })} placeholder="např. 29" />
                </div>
                <div className="field">
                  <label>Váha (kg)</label>
                  <input type="number" value={profile.weight} onChange={(e) => setProfile({ ...profile, weight: e.target.value })} placeholder="např. 78" />
                </div>
                <div className="field">
                  <label>Výška (cm)</label>
                  <input type="number" value={profile.height} onChange={(e) => setProfile({ ...profile, height: e.target.value })} placeholder="např. 180" />
                </div>
                <div className="field">
                  <label>Úroveň aktivity</label>
                  <select value={profile.activity} onChange={(e) => setProfile({ ...profile, activity: e.target.value })}>
                    {ACTIVITY.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Cíl</label>
                <div className="segmented">
                  {GOALS.map((g) => (
                    <button key={g.id} className={profile.goal === g.id ? "active" : ""} onClick={() => setProfile({ ...profile, goal: g.id })}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Kolik jídel denně chceš mít</label>
                <input
                  type="number" min="1" max="8"
                  value={mealsPerDay}
                  onChange={(e) => setMealsPerDay(e.target.value)}
                  style={{ maxWidth: 120 }}
                />
              </div>
            </div>

            {targets ? (
              <div className="card">
                <h2>Doporučený denní příjem</h2>
                <div className="kcal-hero">
                  <span className="num">{fmt(targets.kcal)}</span>
                  <span className="unit">kcal / den</span>
                </div>
                <div className="sub-stats">
                  <span>Bazální metabolismus: <b>{fmt(targets.bmr)} kcal</b></span>
                  <span>Klidový výdej s aktivitou: <b>{fmt(targets.tdee)} kcal</b></span>
                </div>
                <div style={{ marginTop: 18 }}>
                  <MacroBar label="Bílkoviny" value={targets.proteinG} target={targets.proteinG} unit="g" color="var(--protein)" />
                  <MacroBar label="Sacharidy" value={targets.carbsG} target={targets.carbsG} unit="g" color="var(--carbs)" />
                  <MacroBar label="Tuky" value={targets.fatG} target={targets.fatG} unit="g" color="var(--fat)" />
                </div>
              </div>
            ) : (
              <div className="card"><p className="empty">Vyplň věk, váhu a výšku, spočítám ti cíle.</p></div>
            )}
          </div>
        )}

        {tab === "meals" && (
          <div>
            <div className="card">
              <h2>Jak sestavit jídelníček</h2>
              <div className="segmented" style={{ marginBottom: 16 }}>
                <button className={mode === "ai" ? "active" : ""} onClick={() => setMode("ai")}>Navrhneš mi ho</button>
                <button className={mode === "manual" ? "active" : ""} onClick={() => setMode("manual")}>Zadám si vlastní</button>
              </div>

              {mode === "ai" && (
                <div>
                  {apiConfigured === false && <ApiKeySetup configured={false} onSaved={refreshConfig} />}
                  <div className="mode-row">
                    <div className="field" style={{ flex: 2 }}>
                      <label>Preference / omezení</label>
                      <input type="text" value={preference} onChange={(e) => setPreference(e.target.value)} placeholder="např. vegetariánská, bez laktózy…" />
                    </div>
                  </div>
                  <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 12px" }}>
                    Počet jídel denně: <b style={{ color: "var(--ink)" }}>{mealsPerDay}</b> (uprav v záložce Cíl)
                  </p>
                  <button className="btn" onClick={generatePlanFromAi} disabled={generating || !targets || !apiConfigured}>
                    {generating ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
                    {meals.length > 0 ? "Vygenerovat znovu" : "Vygenerovat jídelníček"}
                  </button>
                  {!targets && <div className="gen-error">Nejdřív vyplň profil v záložce Cíl.</div>}
                  {genError && <div className="gen-error">{genError}</div>}
                </div>
              )}

              {mode === "manual" && (
                <button className="btn" onClick={addMeal}><Plus size={15} /> Přidat jídlo</button>
              )}
            </div>

            {meals.length === 0 && (
              <div className="card"><p className="empty">Zatím žádná jídla — {mode === "ai" ? "vygeneruj návrh výše" : "přidej první jídlo"}.</p></div>
            )}

            {meals.map((meal) => {
              const t = mealTotals(meal);
              return (
                <div className="meal-card" key={meal.id}>
                  <div className="meal-head">
                    <input
                      className="meal-name"
                      value={meal.name}
                      onChange={(e) => updateMeal(meal.id, { name: e.target.value })}
                      placeholder="Název jídla"
                    />
                    <div className="freq-field">
                      <RefreshCw size={12} />
                      <input
                        type="number" min="0" max="7"
                        value={meal.frequency}
                        onChange={(e) => updateMeal(meal.id, { frequency: e.target.value })}
                      />
                      ×/týden
                    </div>
                    <button className="icon-btn" onClick={() => removeMeal(meal.id)}><Trash2 size={16} /></button>
                  </div>

                  <table className="ing-table">
                    <thead>
                      <tr>
                        <th className="col-name">Surovina</th>
                        <th className="col-num">Množ.</th>
                        <th className="col-unit">Jedn.</th>
                        <th className="col-num">Kcal/100</th>
                        <th className="col-num">B/100</th>
                        <th className="col-num">S/100</th>
                        <th className="col-num">T/100</th>
                        <th className="col-num">Cena balení</th>
                        <th className="col-num">Vel. balení</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {meal.ingredients.map((ing) => (
                        <tr key={ing.id}>
                          <td><input value={ing.name} onChange={(e) => updateIngredient(meal.id, ing.id, { name: e.target.value })} placeholder="např. kuřecí prsa" /></td>
                          <td><input type="number" value={ing.amount} onChange={(e) => updateIngredient(meal.id, ing.id, { amount: e.target.value })} /></td>
                          <td>
                            <select value={ing.unit} onChange={(e) => updateIngredient(meal.id, ing.id, { unit: e.target.value })}>
                              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </td>
                          <td><input type="number" value={ing.kcal100} onChange={(e) => updateIngredient(meal.id, ing.id, { kcal100: e.target.value })} /></td>
                          <td><input type="number" value={ing.protein100} onChange={(e) => updateIngredient(meal.id, ing.id, { protein100: e.target.value })} /></td>
                          <td><input type="number" value={ing.carbs100} onChange={(e) => updateIngredient(meal.id, ing.id, { carbs100: e.target.value })} /></td>
                          <td><input type="number" value={ing.fat100} onChange={(e) => updateIngredient(meal.id, ing.id, { fat100: e.target.value })} /></td>
                          <td><input type="number" value={ing.packagePrice} onChange={(e) => updateIngredient(meal.id, ing.id, { packagePrice: e.target.value })} placeholder="Kč" /></td>
                          <td><input type="number" value={ing.packageSize} onChange={(e) => updateIngredient(meal.id, ing.id, { packageSize: e.target.value })} placeholder={ing.unit} /></td>
                          <td><button className="icon-btn" onClick={() => removeIngredient(meal.id, ing.id)}><Trash2 size={14} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ marginTop: 8 }}>
                    <button className="btn ghost" onClick={() => addIngredient(meal.id)}><Plus size={13} /> Přidat surovinu</button>
                  </div>

                  <div className="meal-foot">
                    <span className="totals">
                      {fmt(t.kcal)} kcal · B {fmt(t.protein)} g · S {fmt(t.carbs)} g · T {fmt(t.fat)} g
                    </span>
                    <span className="totals">{fmt(t.cost, 2)} Kč / porce</span>
                  </div>
                </div>
              );
            })}

            {meals.length > 0 && (
              <div className="card">
                <h2>Denní součet vs. cíl</h2>
                {targets ? (
                  <div className="daily-summary">
                    <MacroBar label="Kalorie" value={totals.kcal} target={targets.kcal} unit="kcal" color="var(--accent)" />
                    <MacroBar label="Bílkoviny" value={totals.protein} target={targets.proteinG} unit="g" color="var(--protein)" />
                    <MacroBar label="Sacharidy" value={totals.carbs} target={targets.carbsG} unit="g" color="var(--carbs)" />
                    <MacroBar label="Tuky" value={totals.fat} target={targets.fatG} unit="g" color="var(--fat)" />
                  </div>
                ) : (
                  <p className="empty">Vyplň profil v záložce Cíl, ať mám s čím srovnávat.</p>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "shopping" && (
          <div className="card">
            <h2>Nákupní seznam na týden</h2>
            {list.length === 0 ? (
              <p className="empty">Přidej suroviny s cenou balení a velikostí balení v záložce Jídelníček.</p>
            ) : (
              <>
                <table className="shop-table">
                  <thead>
                    <tr>
                      <th>Surovina</th>
                      <th className="num">Množství / týden</th>
                      <th className="num">Cena / týden</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((row) => (
                      <tr key={row.name + row.unit}>
                        <td>{row.name}</td>
                        <td className="num">{fmt(row.amount)} {row.unit}</td>
                        <td className="num">{fmt(row.cost, 2)} Kč</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="total-row">
                  <span className="label">Týdenní výdaje na jídelníček</span>
                  <span className="value">{fmt(weeklyCost, 0)} Kč</span>
                </div>
                <div className="total-row" style={{ borderTop: "none", paddingTop: 4 }}>
                  <span className="label" style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-soft)", fontFamily: "Inter, sans-serif" }}>Odhad na měsíc</span>
                  <span className="value" style={{ fontSize: 16 }}>{fmt(weeklyCost * 4.33, 0)} Kč</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
