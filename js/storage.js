/* ==========================================================================
   storage.js — everything that persists, in one place.
   Uses localStorage. No backend, no login.
   ========================================================================== */

const Store = (function () {

  const KEY = "odm-learning-v1";

  const blank = () => ({
    version: 1,
    theme: "light",
    done: {},          // topicId -> true
    topicQuiz: {},     // topicId -> chosen option index
    phaseQuiz: {},     // phaseId -> { score, total, passed, date }
    pocs: {},          // pocId  -> { notes, done, updated }
    cards: {},         // term   -> "known" | "review"
    streak: { last: null, count: 0, days: [] },
    unlockAll: false,
    lastRoute: null
  });

  let state = blank();

  /* Some browsers block storage on file:// URLs. Detect it once so the
     app can warn instead of silently losing everything on refresh. */
  let available = true;
  try {
    const probe = "__odm_probe__";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
  } catch (e) {
    available = false;
  }

  function load() {
    if (!available) return state;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = Object.assign(blank(), parsed);
        // defensive: make sure nested objects exist
        state.done      = state.done      || {};
        state.topicQuiz = state.topicQuiz || {};
        state.phaseQuiz = state.phaseQuiz || {};
        state.pocs      = state.pocs      || {};
        state.cards     = state.cards     || {};
        state.streak    = state.streak    || { last: null, count: 0, days: [] };
        state.streak.days = state.streak.days || [];
      }
    } catch (e) {
      console.warn("Could not read saved progress; starting fresh.", e);
      state = blank();
    }
    return state;
  }

  let saveTimer = null;
  function save() {
    if (!available) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch (e) {
        available = false;
        console.warn("Could not save progress.", e);
      }
    }, 120);
  }

  function today() {
    const d = new Date();
    return d.getFullYear() + "-" +
           String(d.getMonth() + 1).padStart(2, "0") + "-" +
           String(d.getDate()).padStart(2, "0");
  }

  function daysBetween(a, b) {
    const d1 = new Date(a + "T00:00:00");
    const d2 = new Date(b + "T00:00:00");
    return Math.round((d2 - d1) / 86400000);
  }

  /** Called on any real activity. Maintains the day streak. */
  function touchStreak() {
    const t = today();
    const s = state.streak;
    if (s.last === t) return;
    if (s.last && daysBetween(s.last, t) === 1) s.count += 1;
    else s.count = 1;
    s.last = t;
    if (!s.days.includes(t)) s.days.push(t);
    if (s.days.length > 400) s.days = s.days.slice(-400);
    save();
  }

  return {
    get state() { return state; },
    get available() { return available; },
    load, save, today, touchStreak,

    /* ---- topics ---- */
    isDone: id => !!state.done[id],
    setDone(id, v) {
      if (v) { state.done[id] = true; touchStreak(); }
      else delete state.done[id];
      save();
    },

    /* ---- topic quizzes ---- */
    getTopicAnswer: id => (id in state.topicQuiz ? state.topicQuiz[id] : null),
    setTopicAnswer(id, idx) { state.topicQuiz[id] = idx; touchStreak(); save(); },

    /* ---- phase quizzes ---- */
    getPhaseQuiz: pid => state.phaseQuiz[pid] || null,
    setPhaseQuiz(pid, result) { state.phaseQuiz[pid] = result; touchStreak(); save(); },

    /* ---- POCs ---- */
    getPoc(id) { return state.pocs[id] || { notes: "", done: false, updated: null }; },
    setPocNotes(id, notes) {
      const p = this.getPoc(id);
      p.notes = notes; p.updated = new Date().toISOString();
      state.pocs[id] = p; touchStreak(); save();
    },
    setPocDone(id, v) {
      const p = this.getPoc(id);
      p.done = v; p.updated = new Date().toISOString();
      state.pocs[id] = p; if (v) touchStreak(); save();
    },

    /* ---- flashcards ---- */
    getCard: term => state.cards[term] || null,
    setCard(term, status) {
      if (status) state.cards[term] = status; else delete state.cards[term];
      touchStreak(); save();
    },
    resetCards() { state.cards = {}; save(); },

    /* ---- theme ---- */
    getTheme: () => state.theme,
    setTheme(t) { state.theme = t; save(); },

    /* ---- unlock override ---- */
    isUnlockAll: () => !!state.unlockAll,
    setUnlockAll(v) { state.unlockAll = !!v; save(); },

    /* ---- last route ---- */
    setLastRoute(r) { state.lastRoute = r; save(); },
    getLastRoute: () => state.lastRoute,

    /* ---- backup ---- */
    exportJson() { return JSON.stringify(state, null, 2); },
    importJson(text) {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object") throw new Error("Not a progress file");
      state = Object.assign(blank(), parsed);
      save();
      return true;
    },
    resetAll() { state = blank(); save(); }
  };
})();
