import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Trash2,
  Check,
  Pencil,
  Copy,
  CalendarDays,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";

const DAY_LABELS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const DAY_FULL = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"];
const MONTHS_GEN = [
  "ledna", "února", "března", "dubna", "května", "června",
  "července", "srpna", "září", "října", "listopadu", "prosince",
];

const PAGES = {
  plan: { label: "DENNÍ PLÁN", short: "Plán", color: "#F5B942", icon: CalendarDays },
  todo: { label: "TODO", short: "Todo", color: "#4FD1C5", icon: ListChecks },
};

const DONE_COLOR = "#6FCF97";

const STORAGE_KEY = "day-planner:v3";
const OLD_STORAGE_KEY_V2 = "week-planner:v2";
const OLD_STORAGE_KEY_V1 = "week-planner:v1";
const OLD_WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function emptyDay() {
  return { plan: [], todo: [] };
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d, n) {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

function startOfWeek(d) {
  // Monday-based week
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

function getWeekDates(d) {
  const start = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function sameDate(a, b) {
  return dateKey(a) === dateKey(b);
}

function shortDate(d) {
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

function fullDate(d) {
  return `${d.getDate()}. ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
}

function isoWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}

function getDay(entries, key) {
  return entries[key] || emptyDay();
}

// Migrates older storage shapes into the flat date-keyed shape, anchoring the
// old generic weekday keys ("mon", "tue"...) to the real dates of the current week.
function migrateOldData(parsedV2, parsedV1) {
  const entries = {};
  const weekDates = getWeekDates(new Date());
  const source = parsedV2 || parsedV1;
  if (!source) return entries;
  OLD_WEEKDAY_KEYS.forEach((wk, i) => {
    const val = source[wk];
    const key = dateKey(weekDates[i]);
    if (Array.isArray(val)) {
      entries[key] = { plan: val, todo: [] };
    } else if (val && typeof val === "object") {
      entries[key] = { plan: val.plan || [], todo: val.todo || [] };
    }
  });
  return entries;
}

function ProgressRing({ pct, size = 44, stroke = 4, color = "#F5B942", track = "#2A313B" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 400ms ease" }}
      />
    </svg>
  );
}

function StatPill({ label, pct }) {
  return (
    <div className="flex items-center gap-2">
      <ProgressRing pct={pct} size={30} stroke={3} color="#F5B942" />
      <div>
        <div style={{ color: "#F3F1EB", fontSize: "0.8rem", fontFamily: "ui-monospace, monospace" }}>{pct}%</div>
        <div style={{ color: "#6B7280", fontSize: "0.65rem" }}>{label}</div>
      </div>
    </div>
  );
}

function DayPicker({ selected, options, onToggle, onCancel, onConfirm, label }) {
  return (
    <div className="p-3 -mt-1" style={{ background: "#1C2229", border: "1px solid #2A313B", borderRadius: 10 }}>
      {label && <div style={{ color: "#6B7280", fontSize: "0.7rem", marginBottom: 8 }}>{label}</div>}
      <div className="flex flex-wrap gap-2 mb-3">
        {options.map((d) => {
          const key = dateKey(d);
          const isSel = selected.includes(key);
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className="px-3 py-1.5 text-xs focus:outline-none"
              style={{
                background: isSel ? "#F5B942" : "transparent",
                border: `1px solid ${isSel ? "#F5B942" : "#2A313B"}`,
                borderRadius: 8,
                color: isSel ? "#14181D" : "#8B93A1",
                cursor: "pointer",
                fontWeight: isSel ? 700 : 400,
              }}
            >
              {DAY_LABELS[(d.getDay() + 6) % 7]} {shortDate(d)}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between items-center">
        <button
          onClick={onCancel}
          className="text-xs focus:outline-none"
          style={{ background: "transparent", border: "none", color: "#6B7280", cursor: "pointer" }}
        >
          Zrušit
        </button>
        <button
          onClick={onConfirm}
          disabled={!selected.length}
          className="text-xs px-3 py-1.5 focus:outline-none"
          style={{
            background: selected.length ? "#F5B942" : "#2A313B",
            border: "none",
            borderRadius: 8,
            color: selected.length ? "#14181D" : "#6B7280",
            cursor: selected.length ? "pointer" : "default",
            fontWeight: 700,
          }}
        >
          Zkopírovat
        </button>
      </div>
    </div>
  );
}

export default function WeekPlanner() {
  const [entries, setEntries] = useState({});
  const [activeDate, setActiveDate] = useState(new Date());
  const [page, setPage] = useState("plan");
  const [draft, setDraft] = useState("");
  const [draftTime, setDraftTime] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [editTime, setEditTime] = useState("");
  const [copyMenuOpen, setCopyMenuOpen] = useState(false);
  const [copyTargets, setCopyTargets] = useState([]);
  const [yearRoutineConfirm, setYearRoutineConfirm] = useState(false);
  const [taskCopyMenuId, setTaskCopyMenuId] = useState(null);
  const [taskCopyTargets, setTaskCopyTargets] = useState([]);
  const [actionsOpen, setActionsOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await safeGet(STORAGE_KEY);
        if (res && res.value) {
          setEntries(JSON.parse(res.value));
        } else {
          const v2 = await safeGet(OLD_STORAGE_KEY_V2);
          const v1 = await safeGet(OLD_STORAGE_KEY_V1);
          const parsedV2 = v2 && v2.value ? JSON.parse(v2.value) : null;
          const parsedV1 = v1 && v1.value ? JSON.parse(v1.value) : null;
          if (parsedV2 || parsedV1) {
            setEntries(migrateOldData(parsedV2, parsedV1));
          }
        }
      } catch (e) {
        // no existing data yet — that's fine
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  async function safeGet(key) {
    try {
      return await window.storage.get(key, false);
    } catch (e) {
      return null;
    }
  }

  const persist = useCallback(async (next) => {
    try {
      const result = await window.storage.set(STORAGE_KEY, JSON.stringify(next), false);
      if (!result) setError("Uložení se nezdařilo.");
      else setError(null);
    } catch (e) {
      setError("Uložení se nezdařilo.");
    }
  }, []);

  const updateEntries = (updater) => {
    setEntries((prev) => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  };

  const activeKey = dateKey(activeDate);
  const weekDates = useMemo(() => getWeekDates(activeDate), [activeDate]);

  const selectDay = (d) => {
    if (sameDate(d, activeDate)) {
      setPage((p) => (p === "plan" ? "todo" : "plan"));
    } else {
      setActiveDate(d);
      setPage("plan");
    }
    setEditingId(null);
    setTaskCopyMenuId(null);
  };

  const goWeek = (delta) => {
    setActiveDate((prev) => addDays(prev, delta * 7));
    setEditingId(null);
    setTaskCopyMenuId(null);
  };

  const goToday = () => {
    setActiveDate(new Date());
    setPage("plan");
  };

  const ensureDay = (prev, key) => (prev[key] ? prev : { ...prev, [key]: emptyDay() });

  const addTask = () => {
    const text = draft.trim();
    if (!text) return;
    const time = draftTime || null;
    updateEntries((prev) => {
      const base = ensureDay(prev, activeKey);
      return {
        ...base,
        [activeKey]: { ...base[activeKey], [page]: [...base[activeKey][page], { id: uid(), text, done: false, time }] },
      };
    });
    setDraft("");
    setDraftTime("");
  };

  const toggleTask = (key, pg, id) => {
    updateEntries((prev) => ({
      ...prev,
      [key]: { ...getDay(prev, key), [pg]: getDay(prev, key)[pg].map((t) => (t.id === id ? { ...t, done: !t.done } : t)) },
    }));
  };

  const removeTask = (key, pg, id) => {
    updateEntries((prev) => ({
      ...prev,
      [key]: { ...getDay(prev, key), [pg]: getDay(prev, key)[pg].filter((t) => t.id !== id) },
    }));
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setEditDraft(t.text);
    setEditTime(t.time || "");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft("");
    setEditTime("");
  };
  const saveEdit = (key, pg, id) => {
    const text = editDraft.trim();
    if (!text) {
      cancelEdit();
      return;
    }
    const time = editTime || null;
    updateEntries((prev) => ({
      ...prev,
      [key]: { ...getDay(prev, key), [pg]: getDay(prev, key)[pg].map((t) => (t.id === id ? { ...t, text, time } : t)) },
    }));
    setEditingId(null);
    setEditDraft("");
    setEditTime("");
  };

  const toggleCopyTarget = (key) => {
    setCopyTargets((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };
  const copyDayPageToSelected = () => {
    if (!copyTargets.length) return;
    updateEntries((prev) => {
      const source = getDay(prev, activeKey)[page];
      const next = { ...prev };
      copyTargets.forEach((key) => {
        next[key] = { ...getDay(next, key), [page]: source.map((t) => ({ id: uid(), text: t.text, done: false, time: t.time || null })) };
      });
      return next;
    });
    setCopyMenuOpen(false);
    setCopyTargets([]);
  };

  // Takes the currently viewed week's DENNÍ PLÁN as a weekly template and
  // replicates it (per matching weekday) onto every other week of the year.
  const applyWeekAsYearRoutine = () => {
    const y = activeDate.getFullYear();
    const sourceByWeekday = weekDates.map((d) => getDay(entries, dateKey(d)).plan);
    const sourceWeekKeys = new Set(weekDates.map((d) => dateKey(d)));

    updateEntries((prev) => {
      const next = { ...prev };
      let cursor = new Date(y, 0, 1);
      const end = new Date(y, 11, 31);
      while (cursor <= end) {
        const key = dateKey(cursor);
        if (!sourceWeekKeys.has(key)) {
          const weekdayIdx = (cursor.getDay() + 6) % 7; // 0 = Mon
          const template = sourceByWeekday[weekdayIdx];
          next[key] = {
            ...getDay(next, key),
            plan: template.map((t) => ({ id: uid(), text: t.text, done: false, time: t.time || null })),
          };
        }
        cursor = addDays(cursor, 1);
      }
      return next;
    });
    setYearRoutineConfirm(false);
  };

  const toggleTaskCopyTarget = (key) => {
    setTaskCopyTargets((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };
  const copyTaskToSelected = (task) => {
    if (!taskCopyTargets.length) return;
    updateEntries((prev) => {
      const next = { ...prev };
      taskCopyTargets.forEach((key) => {
        next[key] = { ...getDay(next, key), [page]: [...getDay(next, key)[page], { id: uid(), text: task.text, done: false, time: task.time || null }] };
      });
      return next;
    });
    setTaskCopyMenuId(null);
    setTaskCopyTargets([]);
  };

  // ---- Discipline stats (DENNÍ PLÁN only) ----
  const ratioFor = (dates) => {
    let total = 0, done = 0;
    dates.forEach((d) => {
      const plan = getDay(entries, dateKey(d)).plan;
      total += plan.length;
      done += plan.filter((t) => t.done).length;
    });
    return total ? Math.round((done / total) * 100) : 0;
  };

  const weekPct = useMemo(() => ratioFor(weekDates), [entries, weekDates]);

  const monthPct = useMemo(() => {
    const y = activeDate.getFullYear(), m = activeDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const dates = Array.from({ length: daysInMonth }, (_, i) => new Date(y, m, i + 1));
    return ratioFor(dates);
  }, [entries, activeDate]);

  const yearPct = useMemo(() => {
    const y = activeDate.getFullYear();
    const dates = [];
    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) dates.push(new Date(y, m, i));
    }
    return ratioFor(dates);
  }, [entries, activeDate]);

  const activeDay = getDay(entries, activeKey);
  const activeTasks = useMemo(() => {
    const list = [...activeDay[page]];
    return list.sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });
  }, [activeDay, page]);
  const pageInfo = PAGES[page];

  return (
    <div className="w-full min-h-screen flex justify-center p-6" style={{ background: "#14181D", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-end justify-between mb-1">
          <div>
            <div className="uppercase tracking-widest text-xs mb-1" style={{ color: "#6B7280", letterSpacing: "0.2em" }}>
              {fullDate(activeDate)}
            </div>
            <h1 style={{ color: "#F3F1EB", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "1.9rem", fontWeight: 700 }}>
              {DAY_FULL[(activeDate.getDay() + 6) % 7]} · {pageInfo.label}
            </h1>
          </div>
        </div>

        {/* Discipline stats */}
        <div className="flex items-center gap-6 mb-6 mt-4 flex-wrap">
          <StatPill label="Týden" pct={weekPct} />
          <StatPill label="Měsíc" pct={monthPct} />
          <StatPill label="Rok" pct={yearPct} />
        </div>

        {/* Page switcher */}
        <div className="flex gap-2 mb-6 items-center flex-wrap">
          {Object.entries(PAGES).map(([key, info]) => {
            const Icon = info.icon;
            const isActive = page === key;
            return (
              <button
                key={key}
                onClick={() => setPage(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs focus:outline-none"
                style={{
                  background: isActive ? info.color : "transparent",
                  border: `1px solid ${isActive ? info.color : "#2A313B"}`,
                  borderRadius: 8,
                  color: isActive ? "#14181D" : "#8B93A1",
                  cursor: "pointer",
                  fontWeight: isActive ? 700 : 400,
                }}
              >
                <Icon size={13} />
                {info.short}
              </button>
            );
          })}
        </div>

        {/* Week nav */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => goWeek(-1)} className="focus:outline-none" style={{ background: "transparent", border: "none", cursor: "pointer" }} aria-label="Předchozí týden">
            <ChevronLeft size={18} color="#8B93A1" />
          </button>
          <div className="flex items-center gap-3">
            <span style={{ color: "#8B93A1", fontSize: "0.75rem", fontFamily: "ui-monospace, monospace" }}>
              Týden {isoWeekNumber(activeDate)} · {shortDate(weekDates[0])}–{shortDate(weekDates[6])} {activeDate.getFullYear()}
            </span>
            <button
              onClick={goToday}
              className="text-xs px-2 py-1 focus:outline-none"
              style={{ background: "transparent", border: "1px solid #2A313B", borderRadius: 6, color: "#4FD1C5", cursor: "pointer" }}
            >
              Dnes
            </button>
          </div>
          <button onClick={() => goWeek(1)} className="focus:outline-none" style={{ background: "transparent", border: "none", cursor: "pointer" }} aria-label="Další týden">
            <ChevronRight size={18} color="#8B93A1" />
          </button>
        </div>

        {/* Week spine */}
        <div className="relative mb-8">
          <div className="absolute left-0 right-0 top-6 h-px" style={{ background: "#2A313B" }} />
          <div className="relative flex justify-between">
            {weekDates.map((d) => {
              const key = dateKey(d);
              const dayData = getDay(entries, key);
              const plan = dayData.plan;
              const pct = plan.length ? Math.round((plan.filter((t) => t.done).length / plan.length) * 100) : 0;
              const isActive = sameDate(d, activeDate);
              const isToday = sameDate(d, new Date());
              const totalCount = plan.length;
              const doneCount = plan.filter((t) => t.done).length;
              return (
                <button
                  key={key}
                  onClick={() => selectDay(d)}
                  className="flex flex-col items-center gap-2 focus:outline-none"
                  style={{ background: "transparent", border: "none", cursor: "pointer" }}
                >
                  <div className="relative flex items-center justify-center">
                    <ProgressRing pct={pct} size={44} stroke={4} color={isActive ? pageInfo.color : "#4FD1C5"} />
                    <span style={{ position: "absolute", color: isActive ? "#F3F1EB" : "#8B93A1", fontSize: "0.65rem", fontFamily: "ui-monospace, monospace" }}>
                      {totalCount ? `${doneCount}/${totalCount}` : "–"}
                    </span>
                  </div>
                  <span style={{ color: isActive ? pageInfo.color : "#8B93A1", fontSize: "0.75rem", fontWeight: isActive ? 700 : 400, letterSpacing: "0.05em" }}>
                    {DAY_LABELS[(d.getDay() + 6) % 7]}
                  </span>
                  <span style={{ color: "#4B5563", fontSize: "0.65rem" }}>{shortDate(d)}</span>
                  {isToday && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#F5B942", marginTop: -4 }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add task */}
        <div className="flex gap-2 mb-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder={page === "plan" ? "Přidat bod do denního plánu…" : "Přidat úkol / schůzku…"}
            className="flex-1 px-4 py-3 focus:outline-none"
            style={{ background: "#1C2229", border: "1px solid #2A313B", borderRadius: 10, color: "#F3F1EB", fontSize: "0.95rem" }}
          />
          <button
            onClick={addTask}
            className="flex items-center justify-center focus:outline-none"
            style={{ background: pageInfo.color, border: "none", borderRadius: 10, width: 48, cursor: "pointer" }}
            aria-label="Přidat úkol"
          >
            <Plus size={20} color="#14181D" />
          </button>
        </div>

        <div className="flex flex-col items-end mb-6 gap-2">
          <button
            onClick={() => setActionsOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 focus:outline-none"
            style={{ background: "transparent", border: "1px solid #2A313B", borderRadius: 8, color: "#8B93A1", cursor: "pointer" }}
          >
            <SlidersHorizontal size={13} />
            Akce
            <ChevronDown size={13} style={{ transform: actionsOpen ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
          </button>

          {actionsOpen && (
            <div className="w-full flex flex-col items-end gap-2">
              <button
                onClick={() => setCopyMenuOpen((o) => !o)}
                className="text-xs px-3 py-1.5 focus:outline-none"
                style={{ background: "transparent", border: "1px solid #2A313B", borderRadius: 8, color: "#8B93A1", cursor: "pointer" }}
              >
                Kopírovat {pageInfo.short.toLowerCase()} ({shortDate(activeDate)}) do dnů…
              </button>
              {copyMenuOpen && (
                <div className="w-full">
                  <DayPicker
                    selected={copyTargets}
                    options={weekDates.filter((d) => !sameDate(d, activeDate))}
                    onToggle={toggleCopyTarget}
                    onCancel={() => { setCopyMenuOpen(false); setCopyTargets([]); }}
                    onConfirm={copyDayPageToSelected}
                  />
                </div>
              )}

              {page === "plan" && (
                <>
                  <button
                    onClick={() => setYearRoutineConfirm((o) => !o)}
                    className="text-xs px-3 py-1.5 focus:outline-none"
                    style={{ background: "transparent", border: "1px solid #2A313B", borderRadius: 8, color: "#8B93A1", cursor: "pointer" }}
                  >
                    Nastavit tento týden jako rutinu na celý rok…
                  </button>
                  {yearRoutineConfirm && (
                    <div className="w-full p-3" style={{ background: "#1C2229", border: "1px solid #2A313B", borderRadius: 10 }}>
                      <div style={{ color: "#8B93A1", fontSize: "0.78rem", marginBottom: 10, lineHeight: 1.5 }}>
                        Zkopíruje denní plán z tohoto týdne ({shortDate(weekDates[0])}–{shortDate(weekDates[6])}) na
                        každý odpovídající den ve zbytku roku {activeDate.getFullYear()} — např. pondělní body se
                        objeví na všech ostatních pondělích. Existující denní plán na cílových dnech se{" "}
                        <strong style={{ color: "#F3F1EB" }}>přepíše</strong>. TODO se nedotkne.
                      </div>
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => setYearRoutineConfirm(false)}
                          className="text-xs focus:outline-none"
                          style={{ background: "transparent", border: "none", color: "#6B7280", cursor: "pointer" }}
                        >
                          Zrušit
                        </button>
                        <button
                          onClick={applyWeekAsYearRoutine}
                          className="text-xs px-3 py-1.5 focus:outline-none"
                          style={{ background: "#F5B942", border: "none", borderRadius: 8, color: "#14181D", cursor: "pointer", fontWeight: 700 }}
                        >
                          Ano, nastavit na celý rok
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Task list */}
        <div className="flex flex-col gap-2">
          {!loaded && <div style={{ color: "#6B7280", fontSize: "0.85rem" }}>Načítání…</div>}
          {loaded && activeTasks.length === 0 && (
            <div className="text-center py-10" style={{ color: "#4B5563", fontSize: "0.9rem" }}>
              {page === "plan" ? "Zatím žádný rutinní bod na tento den." : "Zatím žádné nepravidelné úkoly na tento den."}
            </div>
          )}
          {activeTasks.map((t) => (
            <div key={t.id}>
              <div className="flex items-center gap-3 px-4 py-3 group" style={{ background: "#1C2229", border: "1px solid #2A313B", borderRadius: 10 }}>
                <button
                  onClick={() => toggleTask(activeKey, page, t.id)}
                  aria-label={t.done ? "Označit jako nehotové" : "Označit jako hotové"}
                  style={{
                    width: 24, height: 24, borderRadius: 6,
                    border: `2px solid ${t.done ? DONE_COLOR : "#4B5563"}`,
                    background: t.done ? DONE_COLOR : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
                  }}
                >
                  {t.done && <Check size={16} color="#14181D" strokeWidth={3} />}
                </button>

                {editingId === t.id ? (
                  <input
                    autoFocus
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(activeKey, page, t.id);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    onBlur={() => saveEdit(activeKey, page, t.id)}
                    className="flex-1 focus:outline-none"
                    style={{ background: "#14181D", border: "1px solid #F5B942", borderRadius: 6, color: "#F3F1EB", fontSize: "0.95rem", padding: "4px 8px" }}
                  />
                ) : (
                  <>
                    {t.time && (
                      <span style={{ color: t.done ? DONE_COLOR : pageInfo.color, fontSize: "0.8rem", fontFamily: "ui-monospace, monospace", flexShrink: 0, width: 42 }}>
                        {t.time}
                      </span>
                    )}
                    <span
                      onClick={() => startEdit(t)}
                      style={{ flex: 1, color: t.done ? DONE_COLOR : "#F3F1EB", textDecoration: t.done ? "line-through" : "none", fontSize: "0.95rem", cursor: "text" }}
                    >
                      {t.text}
                    </span>
                  </>
                )}

                {editingId !== t.id && (
                  <button onClick={() => startEdit(t)} className="opacity-0 group-hover:opacity-100" style={{ background: "transparent", border: "none", cursor: "pointer", transition: "opacity 150ms" }} aria-label="Upravit úkol">
                    <Pencil size={15} color="#6B7280" />
                  </button>
                )}
                <button
                  onClick={() => setTaskCopyMenuId((prev) => (prev === t.id ? null : t.id))}
                  className="opacity-0 group-hover:opacity-100"
                  style={{ background: "transparent", border: "none", cursor: "pointer", transition: "opacity 150ms" }}
                  aria-label="Kopírovat úkol do dnů"
                >
                  <Copy size={15} color="#6B7280" />
                </button>
                <button onClick={() => removeTask(activeKey, page, t.id)} className="opacity-0 group-hover:opacity-100" style={{ background: "transparent", border: "none", cursor: "pointer", transition: "opacity 150ms" }} aria-label="Smazat úkol">
                  <Trash2 size={16} color="#6B7280" />
                </button>
              </div>

              {taskCopyMenuId === t.id && (
                <DayPicker
                  selected={taskCopyTargets}
                  options={weekDates.filter((d) => !sameDate(d, activeDate))}
                  onToggle={toggleTaskCopyTarget}
                  onCancel={() => { setTaskCopyMenuId(null); setTaskCopyTargets([]); }}
                  onConfirm={() => copyTaskToSelected(t)}
                  label={`Zkopírovat "${t.text}" (${pageInfo.short}) do:`}
                />
              )}
            </div>
          ))}
        </div>

        {error && <div style={{ color: "#E27D60", fontSize: "0.8rem", marginTop: 12 }}>{error}</div>}
      </div>
    </div>
  );
}
