import React, { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Trash2, X, ArrowUpRight, ArrowDownRight, Check, Pencil } from "lucide-react";

const C = {
  paper: "#EAE4D4",
  card: "#F8F5EC",
  ink: "#1C2A22",
  inkSoft: "#63705F",
  line: "#D7CCB0",
  green: "#2F6F4E",
  greenSoft: "#E1EEE5",
  rust: "#9C3F2C",
  rustSoft: "#F1E1D8",
  gold: "#8F6A1E",
  goldSoft: "#EEE3C6",
};

const serif = "'Iowan Old Style','Palatino Linotype',Georgia,serif";
const sans = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const mono = "'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

const EXPENSE_CATS = ["Bydlení", "Energie", "Jídlo", "Doprava", "Zábava", "Zdraví", "Předplatné", "Ostatní"];
const INCOME_CATS = ["Mzda", "Freelance", "Dar", "Ostatní příjem"];
const TX_KEY = "transactions:list";
const DEBTS_KEY = "debts:list";

const czk = (n) => n.toLocaleString("cs-CZ") + " Kč";
const fmtDate = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${parseInt(day)}. ${parseInt(m)}.`;
};

function useStoredList(key) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const loadedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(key, false);
        if (result && result.value) setItems(JSON.parse(result.value));
        setStatus("ready");
      } catch (e) {
        setStatus("ready");
      } finally {
        loadedRef.current = true;
      }
    })();
  }, [key]);

  useEffect(() => {
    if (!loadedRef.current) return;
    (async () => {
      try {
        const res = await window.storage.set(key, JSON.stringify(items), false);
        if (!res) setStatus("error");
      } catch (e) {
        setStatus("error");
      }
    })();
  }, [items, key]);

  return [items, setItems, status];
}

function useStoredValue(key, fallback) {
  const [value, setValue] = useState(fallback);
  const [status, setStatus] = useState("loading");
  const loadedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(key, false);
        if (result && result.value !== undefined) setValue(JSON.parse(result.value));
        setStatus("ready");
      } catch (e) {
        setStatus("ready");
      } finally {
        loadedRef.current = true;
      }
    })();
  }, [key]);

  useEffect(() => {
    if (!loadedRef.current) return;
    (async () => {
      try {
        const res = await window.storage.set(key, JSON.stringify(value), false);
        if (!res) setStatus("error");
      } catch (e) {
        setStatus("error");
      }
    })();
  }, [value, key]);

  return [value, setValue, status];
}

function Segmented({ tab, setTab }) {
  const tabs = [
    { key: "prehled", label: "Přehled" },
    { key: "dluhy", label: "Dluhy" },
  ];
  return (
    <div style={{ display: "inline-flex", background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: 4, marginBottom: 24 }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          style={{
            fontFamily: sans,
            fontSize: 14,
            fontWeight: 500,
            padding: "8px 18px",
            borderRadius: 7,
            border: "none",
            background: tab === t.key ? C.ink : "transparent",
            color: tab === t.key ? C.card : C.inkSoft,
            cursor: "pointer",
            transition: "all .15s",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Prehled() {
  const [items, setItems, status] = useStoredList(TX_KEY);
  const [cashBase, setCashBase, cashStatus] = useStoredValue("cash:base", 0);
  const [editingCash, setEditingCash] = useState(false);
  const [cashInput, setCashInput] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category: "",
    note: "",
    date: "2026-09-01",
  });
  const [error, setError] = useState("");

  const totals = useMemo(() => {
    const income = items.filter((i) => i.type === "income").reduce((s, i) => s + i.amount, 0);
    const expense = items.filter((i) => i.type === "expense").reduce((s, i) => s + i.amount, 0);
    const remaining = income - expense;
    const pct = income > 0 ? (remaining / income) * 100 : 0;
    return { income, expense, remaining, pct };
  }, [items]);

  const cash = cashBase + totals.income - totals.expense;

  const startCashEdit = () => {
    setCashInput(String(cash));
    setEditingCash(true);
  };

  const saveCashEdit = () => {
    const val = parseFloat(cashInput.replace(",", "."));
    if (!isNaN(val)) {
      setCashBase(val - totals.income + totals.expense);
    }
    setEditingCash(false);
  };

  const pctColor = totals.pct >= 20 ? C.green : totals.pct >= 0 ? C.gold : C.rust;

  const breakdown = useMemo(() => {
    const map = {};
    items.filter((i) => i.type === "expense").forEach((i) => {
      map[i.category] = (map[i.category] || 0) + i.amount;
    });
    const arr = Object.entries(map).map(([category, amount]) => ({ category, amount }));
    arr.sort((a, b) => b.amount - a.amount);
    return arr;
  }, [items]);

  const maxCat = breakdown.length ? breakdown[0].amount : 1;

  const filtered = useMemo(() => {
    let list = [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));
    if (filter === "income") list = list.filter((i) => i.type === "income");
    if (filter === "expense") list = list.filter((i) => i.type === "expense");
    return list;
  }, [items, filter]);

  const cats = form.type === "expense" ? EXPENSE_CATS : INCOME_CATS;

  const submit = () => {
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) {
      setError("Zadej částku větší než 0.");
      return;
    }
    if (!form.category) {
      setError("Vyber kategorii.");
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: form.type,
        amount: amt,
        category: form.category,
        note: form.note,
        date: form.date,
      },
    ]);
    setForm({ type: form.type, amount: "", category: "", note: "", date: form.date });
    setError("");
  };

  const remove = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const filterBtn = (key, label) => (
    <button
      onClick={() => setFilter(key)}
      style={{
        fontFamily: sans,
        fontSize: 13,
        padding: "6px 14px",
        borderRadius: 999,
        border: `1px solid ${filter === key ? C.ink : C.line}`,
        background: filter === key ? C.ink : "transparent",
        color: filter === key ? C.card : C.inkSoft,
        cursor: "pointer",
        transition: "all .15s",
      }}
    >
      {label}
    </button>
  );

  if (status === "loading") {
    return <p style={{ color: C.inkSoft, textAlign: "center", padding: "60px 0" }}>Načítání dat…</p>;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: serif, fontSize: 30, fontWeight: 500, margin: 0 }}>Rozpočet</h1>
          <p style={{ margin: "4px 0 0", color: C.inkSoft, fontSize: 14 }}>
            Září 2026 · {items.length === 0 ? "zatím žádné záznamy" : `${items.length} ${items.length === 1 ? "záznam" : items.length < 5 ? "záznamy" : "záznamů"}`}
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: sans, fontSize: 14, fontWeight: 500, padding: "10px 18px", borderRadius: 8, border: "none", background: C.ink, color: C.card, cursor: "pointer" }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Zavřít" : "Přidat záznam"}
        </button>
      </div>

      {status === "error" && (
        <p style={{ color: C.rust, fontSize: 13, marginBottom: 16 }}>Poslední záznam se nepodařilo uložit natrvalo. Zkus to prosím ještě jednou.</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, marginBottom: 20 }}>
        {[
          { label: "Příjmy", value: czk(totals.income), color: C.green },
          { label: "Výdaje", value: czk(totals.expense), color: C.rust },
          { label: "Zůstává z příjmu", value: totals.income > 0 ? `${totals.pct.toFixed(1)} %` : "—", color: pctColor },
        ].map((s, idx) => (
          <div key={s.label} style={{ padding: "22px 26px", borderLeft: idx === 0 ? "none" : `1px solid ${C.line}` }}>
            <p style={{ margin: "0 0 8px", fontSize: 13, color: C.inkSoft }}>{s.label}</p>
            <p style={{ margin: 0, fontFamily: serif, fontSize: 26, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
          </div>
        ))}
        <div style={{ padding: "22px 26px", borderLeft: `1px solid ${C.line}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <p style={{ margin: 0, fontSize: 13, color: C.inkSoft }}>Hotovost</p>
            {!editingCash && (
              <button
                onClick={startCashEdit}
                aria-label="Upravit hotovost"
                style={{ background: "none", border: "none", color: C.inkSoft, cursor: "pointer", padding: 2, display: "flex" }}
              >
                <Pencil size={13} />
              </button>
            )}
          </div>
          {editingCash ? (
            <input
              type="number"
              autoFocus
              value={cashInput}
              onChange={(e) => setCashInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveCashEdit(); if (e.key === "Escape") setEditingCash(false); }}
              onBlur={saveCashEdit}
              style={{
                width: "100%", boxSizing: "border-box", padding: "4px 8px", borderRadius: 6,
                border: `1px solid ${C.line}`, fontFamily: mono, fontSize: 20, background: "white",
              }}
            />
          ) : (
            <p style={{ margin: 0, fontFamily: serif, fontSize: 26, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{czk(cash)}</p>
          )}
        </div>
      </div>

      {showForm && (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 22, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["expense", "income"].map((t) => (
              <button
                key={t}
                onClick={() => setForm((f) => ({ ...f, type: t, category: "" }))}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 8,
                  border: `1px solid ${form.type === t ? (t === "income" ? C.green : C.rust) : C.line}`,
                  background: form.type === t ? (t === "income" ? C.greenSoft : C.rustSoft) : "transparent",
                  color: form.type === t ? (t === "income" ? C.green : C.rust) : C.inkSoft,
                  fontFamily: sans, fontSize: 14, fontWeight: 500, cursor: "pointer",
                }}
              >
                {t === "income" ? "Příjem" : "Výdaj"}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: C.inkSoft, display: "block", marginBottom: 4 }}>Částka (Kč)</label>
              <input type="number" autoFocus value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="0"
                style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.line}`, fontFamily: mono, fontSize: 14, background: "white" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.inkSoft, display: "block", marginBottom: 4 }}>Kategorie</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.line}`, fontFamily: sans, fontSize: 14, background: "white" }}>
                <option value="">Vyber…</option>
                {cats.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: C.inkSoft, display: "block", marginBottom: 4 }}>Poznámka (nepovinné)</label>
              <input type="text" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="např. nákup potravin"
                style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.line}`, fontFamily: sans, fontSize: 14, background: "white" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.inkSoft, display: "block", marginBottom: 4 }}>Datum</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.line}`, fontFamily: sans, fontSize: 14, background: "white" }} />
            </div>
          </div>

          {error && <p style={{ color: C.rust, fontSize: 13, margin: "0 0 12px" }}>{error}</p>}

          <button onClick={submit} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: C.ink, color: C.card, fontFamily: sans, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
            Uložit záznam
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {filterBtn("all", "Vše")}
            {filterBtn("income", "Příjmy")}
            {filterBtn("expense", "Výdaje")}
          </div>

          {filtered.length === 0 ? (
            <p style={{ color: C.inkSoft, fontSize: 14, padding: "20px 0", textAlign: "center" }}>
              {items.length === 0 ? "Zatím jsi nic nezapsal. Klikni na „Přidat záznam“." : "Žádné záznamy v tomto filtru."}
            </p>
          ) : (
            <div>
              {filtered.map((it, idx) => (
                <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: idx === 0 ? "none" : `1px solid ${C.line}` }}>
                  <div style={{ color: it.type === "income" ? C.green : C.rust, flexShrink: 0 }}>
                    {it.type === "income" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14 }}>{it.note || it.category}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: C.inkSoft }}>
                      {it.category} · {fmtDate(it.date)}
                    </p>
                  </div>
                  <p style={{ margin: 0, fontFamily: mono, fontSize: 14, color: it.type === "income" ? C.green : C.rust, whiteSpace: "nowrap" }}>
                    {it.type === "income" ? "+ " : "− "}{czk(it.amount)}
                  </p>
                  <button onClick={() => remove(it.id)} style={{ background: "none", border: "none", color: C.inkSoft, cursor: "pointer", padding: 4, flexShrink: 0 }} aria-label="Smazat záznam">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 20 }}>
            <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 500 }}>Výdaje podle kategorie</p>
            {breakdown.length === 0 ? (
              <p style={{ fontSize: 13, color: C.inkSoft, margin: 0 }}>Zatím žádné výdaje.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {breakdown.map((b) => (
                  <div key={b.category}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: C.inkSoft }}>{b.category}</span>
                      <span style={{ fontFamily: mono }}>{czk(b.amount)}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 4, background: C.paper }}>
                      <div style={{ height: "100%", width: `${(b.amount / maxCat) * 100}%`, background: C.rust, borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Dluhy() {
  const [debts, setDebts, status] = useStoredList(DEBTS_KEY);
  const [showForm, setShowForm] = useState(false);
  const [showPaid, setShowPaid] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", due: "", note: "" });
  const [error, setError] = useState("");

  const active = useMemo(
    () => debts.filter((d) => !d.paid).sort((a, b) => {
      if (a.due && b.due) return a.due < b.due ? -1 : a.due > b.due ? 1 : 0;
      if (a.due) return -1;
      if (b.due) return 1;
      return b.amount - a.amount;
    }),
    [debts]
  );
  const paid = useMemo(() => debts.filter((d) => d.paid), [debts]);
  const totalDebt = active.reduce((s, d) => s + d.amount, 0);

  const today = new Date().toISOString().slice(0, 10);

  const submit = () => {
    const amt = parseFloat(form.amount);
    if (!form.name.trim()) {
      setError("Zadej komu nebo za co dlužíš.");
      return;
    }
    if (!form.amount || isNaN(amt) || amt <= 0) {
      setError("Zadej částku větší než 0.");
      return;
    }
    setDebts((prev) => [
      ...prev,
      { id: Date.now(), name: form.name.trim(), amount: amt, due: form.due, note: form.note.trim(), paid: false },
    ]);
    setForm({ name: "", amount: "", due: "", note: "" });
    setError("");
  };

  const togglePaid = (id) => setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, paid: !d.paid } : d)));
  const remove = (id) => setDebts((prev) => prev.filter((d) => d.id !== id));

  if (status === "loading") {
    return <p style={{ color: C.inkSoft, textAlign: "center", padding: "60px 0" }}>Načítání dat…</p>;
  }

  const renderRow = (d) => {
    const overdue = d.due && !d.paid && d.due < today;
    return (
      <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: `1px solid ${C.line}` }}>
        <button
          onClick={() => togglePaid(d.id)}
          aria-label={d.paid ? "Označit jako nesplacené" : "Označit jako splacené"}
          style={{
            width: 22, height: 22, borderRadius: 6, flexShrink: 0, cursor: "pointer",
            border: `1px solid ${d.paid ? C.green : C.line}`,
            background: d.paid ? C.green : "white",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {d.paid && <Check size={14} color="white" />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, textDecoration: d.paid ? "line-through" : "none", color: d.paid ? C.inkSoft : C.ink }}>
            {d.name}
          </p>
          {(d.due || d.note) && (
            <p style={{ margin: "2px 0 0", fontSize: 12, color: overdue ? C.rust : C.inkSoft }}>
              {d.due && `splatnost ${fmtDate(d.due)}`}
              {d.due && d.note && " · "}
              {d.note}
              {overdue && " · po splatnosti"}
            </p>
          )}
        </div>
        <p style={{ margin: 0, fontFamily: mono, fontSize: 14, color: d.paid ? C.inkSoft : C.rust, whiteSpace: "nowrap", textDecoration: d.paid ? "line-through" : "none" }}>
          {czk(d.amount)}
        </p>
        <button onClick={() => remove(d.id)} style={{ background: "none", border: "none", color: C.inkSoft, cursor: "pointer", padding: 4, flexShrink: 0 }} aria-label="Smazat dluh">
          <Trash2 size={15} />
        </button>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: serif, fontSize: 30, fontWeight: 500, margin: 0 }}>Dluhy</h1>
          <p style={{ margin: "4px 0 0", color: C.inkSoft, fontSize: 14 }}>
            {active.length === 0 ? "Žádné otevřené dluhy" : `${active.length} ${active.length === 1 ? "otevřený dluh" : active.length < 5 ? "otevřené dluhy" : "otevřených dluhů"}`}
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: sans, fontSize: 14, fontWeight: 500, padding: "10px 18px", borderRadius: 8, border: "none", background: C.ink, color: C.card, cursor: "pointer" }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Zavřít" : "Přidat dluh"}
        </button>
      </div>

      {status === "error" && (
        <p style={{ color: C.rust, fontSize: 13, marginBottom: 16 }}>Poslední změnu se nepodařilo uložit natrvalo. Zkus to prosím ještě jednou.</p>
      )}

      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "22px 26px", marginBottom: 20 }}>
        <p style={{ margin: "0 0 8px", fontSize: 13, color: C.inkSoft }}>Celkem dlužíš</p>
        <p style={{ margin: 0, fontFamily: serif, fontSize: 30, color: C.rust, fontVariantNumeric: "tabular-nums" }}>{czk(totalDebt)}</p>
      </div>

      {showForm && (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 22, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: C.inkSoft, display: "block", marginBottom: 4 }}>Komu / za co</label>
              <input type="text" autoFocus value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="např. půjčka od Petra"
                style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.line}`, fontFamily: sans, fontSize: 14, background: "white" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.inkSoft, display: "block", marginBottom: 4 }}>Částka (Kč)</label>
              <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="0"
                style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.line}`, fontFamily: mono, fontSize: 14, background: "white" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: C.inkSoft, display: "block", marginBottom: 4 }}>Splatnost (nepovinné)</label>
              <input type="date" value={form.due} onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))}
                style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.line}`, fontFamily: sans, fontSize: 14, background: "white" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.inkSoft, display: "block", marginBottom: 4 }}>Poznámka (nepovinné)</label>
              <input type="text" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="např. splátky 1000 Kč/měsíc"
                style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.line}`, fontFamily: sans, fontSize: 14, background: "white" }} />
            </div>
          </div>

          {error && <p style={{ color: C.rust, fontSize: 13, margin: "0 0 12px" }}>{error}</p>}

          <button onClick={submit} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: C.ink, color: C.card, fontFamily: sans, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
            Uložit dluh
          </button>
        </div>
      )}

      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 20 }}>
        {active.length === 0 ? (
          <p style={{ color: C.inkSoft, fontSize: 14, padding: "20px 0", textAlign: "center" }}>
            Žádné otevřené dluhy. Klikni na „Přidat dluh“.
          </p>
        ) : (
          <div>{active.map(renderRow)}</div>
        )}

        {paid.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => setShowPaid((s) => !s)}
              style={{ background: "none", border: "none", color: C.inkSoft, fontSize: 13, cursor: "pointer", padding: 0 }}
            >
              {showPaid ? "Skrýt" : "Zobrazit"} splacené ({paid.length})
            </button>
            {showPaid && <div>{paid.map(renderRow)}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("prehled");
  return (
    <div style={{ background: C.paper, minHeight: "100vh", fontFamily: sans, color: C.ink, padding: "40px 20px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <Segmented tab={tab} setTab={setTab} />
        {tab === "prehled" ? <Prehled /> : <Dluhy />}
      </div>
    </div>
  );
}
