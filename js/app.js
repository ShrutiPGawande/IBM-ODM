/* ==========================================================================
   app.js — course assembly, routing, views and event wiring.
   ========================================================================== */

/* ------------------------------------------------------------ the course */

const COURSE = {
  phases: [window.PHASE_1, window.PHASE_2, window.PHASE_3, window.PHASE_4,
           window.PHASE_5, window.PHASE_6, window.PHASE_7].filter(Boolean),
  pocs: window.POCS || [],
  cards: window.FLASHCARDS || []
};

const PASS_MARK = 0.7;

/* ------------------------------------------------------------- selectors */

const $  = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

/* --------------------------------------------------------- course lookups */

function allTopics() {
  const out = [];
  COURSE.phases.forEach(p => (p.topics || []).forEach((t, i) =>
    out.push({ topic: t, phase: p, index: i })));
  return out;
}

function findTopic(id) {
  return allTopics().find(x => x.topic.id === id) || null;
}

function phaseByNumber(n) {
  return COURSE.phases.find(p => p.number === Number(n)) || null;
}

function phaseProgress(phase) {
  const topics = phase.topics || [];
  const done = topics.filter(t => Store.isDone(t.id)).length;
  const quiz = Store.getPhaseQuiz(phase.id);
  const total = topics.length + 1;              // topics + the phase quiz
  const completed = done + (quiz && quiz.passed ? 1 : 0);
  return {
    doneTopics: done,
    totalTopics: topics.length,
    quizPassed: !!(quiz && quiz.passed),
    pct: total ? Math.round((completed / total) * 100) : 0,
    complete: done === topics.length && !!(quiz && quiz.passed)
  };
}

function isPhaseUnlocked(number) {
  if (Store.isUnlockAll()) return true;
  if (Number(number) <= 1) return true;
  const prev = phaseByNumber(Number(number) - 1);
  if (!prev) return true;
  const q = Store.getPhaseQuiz(prev.id);
  return !!(q && q.passed);
}

function overallPct() {
  let total = 0, done = 0;
  COURSE.phases.forEach(p => {
    total += (p.topics || []).length + 1;
    const pr = phaseProgress(p);
    done += pr.doneTopics + (pr.quizPassed ? 1 : 0);
  });
  COURSE.pocs.forEach(p => { total += 1; if (Store.getPoc(p.id).done) done += 1; });
  return total ? Math.round((done / total) * 100) : 0;
}

function nextUnfinished() {
  for (const p of COURSE.phases) {
    if (!isPhaseUnlocked(p.number)) continue;
    for (const t of (p.topics || [])) {
      if (!Store.isDone(t.id)) return "#/topic/" + t.id;
    }
    const q = Store.getPhaseQuiz(p.id);
    if (!q || !q.passed) return "#/quiz/" + p.number;
  }
  return "#/cards";
}

function pocsForPhase(n) { return COURSE.pocs.filter(p => p.phase === Number(n)); }

/* ------------------------------------------------------------------ chrome */

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  Store.setTheme(theme);
  const b = $("#themeBtn");
  if (b) b.textContent = theme === "dark" ? "☀" : "☽";
}

let toastTimer = null;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

function closeSidebar() {
  $("#sidebar").classList.remove("open");
  $("#scrim").classList.remove("show");
}

/**
 * Copy to the clipboard. The async Clipboard API needs a secure context,
 * which a file:// page is not, so fall back to a hidden textarea.
 */
function copyText(text, onOk) {
  const fallback = () => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (ok) onOk(); else toast("Could not copy — select the text instead");
    } catch (e) {
      toast("Could not copy — select the text instead");
    }
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(onOk).catch(fallback);
  } else {
    fallback();
  }
}

/* ------------------------------------------------------------- the sidebar */

let searchTerm = "";
const openPhases = {};

function renderSidebar() {
  const route = location.hash || "#/";
  const box = $("#sideNav");

  if (searchTerm.trim().length >= 2) {
    box.innerHTML = renderSearchResults(searchTerm.trim().toLowerCase());
    return;
  }

  let html = "";
  html += navLink("#/", "⌂", "Dashboard", route === "#/" || route === "");
  html += '<div class="nav-section">Learning path</div>';

  COURSE.phases.forEach(p => {
    const pr = phaseProgress(p);
    const unlocked = isPhaseUnlocked(p.number);
    const isCurrent = route.indexOf("#/phase/" + p.number) === 0 ||
                      route === "#/quiz/" + p.number ||
                      (p.topics || []).some(t => route === "#/topic/" + t.id);
    if (isCurrent) openPhases[p.id] = true;
    const open = openPhases[p.id];

    html += '<div class="phase-group' + (open ? " open" : "") + '" data-phase-group="' + p.id + '">';
    html += '<button class="phase-head' + (pr.complete ? " done" : "") +
              (isCurrent ? " current" : "") + (unlocked ? "" : " locked") +
              '" data-phase-toggle="' + p.id + '">' +
              '<span class="phase-num">' + (pr.complete ? "✓" : p.number) + "</span>" +
              '<span class="phase-label">' + R.esc(p.title) + "</span>" +
              '<span class="phase-meta">' + (unlocked ? pr.pct + "%" : "🔒") + "</span>" +
              '<span class="chev">▶</span>' +
            "</button>";

    html += '<div class="topic-list">';
    html += '<button class="topic-link' + (route === "#/phase/" + p.number ? " active" : "") +
            '" data-go="#/phase/' + p.number + '">' +
            '<span class="tick">○</span><span class="t-text"><em>Phase overview</em></span></button>';

    (p.topics || []).forEach((t, i) => {
      const done = Store.isDone(t.id);
      html += '<button class="topic-link' + (done ? " is-done" : "") +
              (route === "#/topic/" + t.id ? " active" : "") +
              '" data-go="#/topic/' + t.id + '">' +
              '<span class="tick">' + (done ? "✓" : "○") + "</span>" +
              '<span class="t-text">' + p.number + "." + (i + 1) + " " + R.esc(t.title) + "</span></button>";
    });

    pocsForPhase(p.number).forEach(poc => {
      const done = Store.getPoc(poc.id).done;
      html += '<button class="topic-link' + (done ? " is-done" : "") +
              (route === "#/poc/" + poc.id ? " active" : "") +
              '" data-go="#/poc/' + poc.id + '">' +
              '<span class="tick">' + (done ? "✓" : "★") + "</span>" +
              '<span class="t-text">' + R.esc(poc.code) + " — " + R.esc(poc.title) + "</span></button>";
    });

    const q = Store.getPhaseQuiz(p.id);
    html += '<button class="topic-link' + (q && q.passed ? " is-done" : "") +
            (route === "#/quiz/" + p.number ? " active" : "") +
            '" data-go="#/quiz/' + p.number + '">' +
            '<span class="tick">' + (q && q.passed ? "✓" : "○") + "</span>" +
            '<span class="t-text"><em>Phase quiz</em></span></button>';

    html += "</div></div>";
  });

  html += '<div class="nav-section">Practice &amp; reference</div>';
  html += navLink("#/cards", "✦", "Flashcards", route === "#/cards");
  html += navLink("#/pocs", "★", "POC milestones", route === "#/pocs");
  html += navLink("#/settings", "⚙", "Settings &amp; backup", route === "#/settings");

  box.innerHTML = html;
}

function navLink(href, ico, label, active) {
  return '<button class="nav-link' + (active ? " active" : "") + '" data-go="' + href + '">' +
         '<span class="nav-ico">' + ico + "</span><span>" + label + "</span></button>";
}

function renderSearchResults(q) {
  const hits = [];
  allTopics().forEach(({ topic, phase, index }) => {
    const hay = (topic.title + " " + (topic.tag || "") + " " + (topic.intro || "")).toLowerCase();
    if (hay.indexOf(q) >= 0) hits.push({ topic, phase, index });
  });
  const cardHits = COURSE.cards.filter(c =>
    (c.term + " " + c.definition).toLowerCase().indexOf(q) >= 0).slice(0, 6);

  let html = '<div class="nav-section">Topics (' + hits.length + ")</div>";
  if (!hits.length) html += '<div style="padding:8px 12px;font-size:.82rem;color:var(--ink-3)">No topics matched.</div>';
  hits.slice(0, 25).forEach(({ topic, phase, index }) => {
    html += '<button class="topic-link" data-go="#/topic/' + topic.id + '">' +
            '<span class="tick">' + (Store.isDone(topic.id) ? "✓" : "○") + "</span>" +
            '<span class="t-text">' + phase.number + "." + (index + 1) + " " + R.esc(topic.title) + "</span></button>";
  });
  if (cardHits.length) {
    html += '<div class="nav-section">Terms</div>';
    cardHits.forEach(c => {
      html += '<button class="topic-link" data-go="#/cards">' +
              '<span class="tick">✦</span><span class="t-text">' + R.esc(c.term) + "</span></button>";
    });
  }
  return html;
}

/* =========================================================================
   VIEWS
   ========================================================================= */

function viewDashboard() {
  const pct = overallPct();
  const totalTopics = allTopics().length;
  const doneTopics = allTopics().filter(x => Store.isDone(x.topic.id)).length;
  const badges = COURSE.phases.filter(p => phaseProgress(p).complete).length;
  const pocsDone = COURSE.pocs.filter(p => Store.getPoc(p.id).done).length;
  const streak = Store.state.streak.count || 0;

  let html = "";

  html += '<div class="hero">' +
    '<div class="hero-main">' +
      '<div class="eyebrow">IBM ODM &amp; Java</div>' +
      "<h1>Your learning path</h1>" +
      '<p class="page-sub">Seven phases, ' + totalTopics + ' topics, 5 POC milestones — one loan-eligibility ' +
      'storyline running through all of it.</p>' +
      '<div class="btn-row" style="margin-top:16px">' +
        '<button class="btn primary" data-go="' + nextUnfinished() + '">Continue &rarr;</button>' +
        '<button class="btn" data-go="#/cards">Review flashcards</button>' +
      "</div>" +
    "</div>" +
    '<div class="ring" style="--pct:' + pct + '"><div class="ring-label">' +
      '<div class="ring-num">' + pct + "%</div>" +
      '<div class="ring-cap">complete</div>' +
    "</div></div>" +
  "</div>";

  html += '<div class="stat-grid">' +
    stat(doneTopics + " / " + totalTopics, "Topics done") +
    stat(badges + " / " + COURSE.phases.length, "Phases complete") +
    stat(pocsDone + " / " + COURSE.pocs.length, "POCs finished") +
    stat(streak + (streak === 1 ? " day" : " days"), "Current streak") +
  "</div>";

  html += R.blockTitle("The journey");
  html += '<div class="journey">';
  COURSE.phases.forEach(p => {
    const pr = phaseProgress(p);
    const unlocked = isPhaseUnlocked(p.number);
    const cls = pr.complete ? "complete" : (!unlocked ? "locked" : (pr.pct > 0 ? "current" : ""));
    html += '<div class="journey-node ' + cls + '">' +
      '<div class="j-dot">' + (pr.complete ? "✓" : (unlocked ? p.number : "🔒")) + "</div>" +
      '<div class="j-body" data-go="#/phase/' + p.number + '">' +
        '<div class="j-title">' + R.esc(p.title) +
          (pr.complete ? ' <span class="chip teal">' + p.badge.icon + " " + R.esc(p.badge.name) + "</span>" : "") +
          (!unlocked ? ' <span class="chip">locked</span>' : "") +
        "</div>" +
        '<div class="j-sub">' + R.esc(p.subtitle) + "</div>" +
        '<div class="j-foot">' +
          '<div class="bar' + (pr.complete ? " done" : "") + '"><span style="width:' + pr.pct + '%"></span></div>' +
          '<div class="j-pct">' + pr.doneTopics + "/" + pr.totalTopics + " · " + pr.pct + "%</div>" +
        "</div>" +
      "</div></div>";
  });
  html += "</div>";

  html += R.blockTitle("POC milestones");
  html += '<div class="topic-cards">';
  COURSE.pocs.forEach(poc => {
    const done = Store.getPoc(poc.id).done;
    html += '<button class="tcard' + (done ? " is-done" : "") + '" data-go="#/poc/' + poc.id + '">' +
      '<span class="tcard-n">' + (done ? "✓" : "★") + "</span>" +
      '<span class="tcard-main"><span class="tcard-title">' + R.esc(poc.code) + " — " + R.esc(poc.title) + "</span>" +
      '<span class="tcard-meta">Phase ' + poc.phase + " · " + R.esc(poc.estimate) + " · " + R.esc(poc.summary) + "</span></span>" +
      '<span class="tcard-go">›</span></button>';
  });
  html += "</div>";

  html += R.blockTitle("Badges");
  html += '<div class="badge-shelf">';
  COURSE.phases.forEach(p => {
    const earned = phaseProgress(p).complete;
    html += '<div class="badge ' + (earned ? "earned" : "locked") + '">' +
      '<span class="badge-ico">' + p.badge.icon + "</span><span>" + R.esc(p.badge.name) + "</span></div>";
  });
  html += "</div>";

  return html;
}

function stat(num, cap) {
  return '<div class="stat"><div class="stat-num">' + R.esc(num) + '</div><div class="stat-cap">' + R.esc(cap) + "</div></div>";
}

/* ------------------------------------------------------------ phase view */

function viewPhase(n) {
  const p = phaseByNumber(n);
  if (!p) return notFound();
  const pr = phaseProgress(p);
  const unlocked = isPhaseUnlocked(p.number);

  let html = '<div class="page-head">' +
    '<div class="eyebrow">Phase ' + p.number + " of " + COURSE.phases.length + "</div>" +
    "<h1>" + R.esc(p.title) + "</h1>" +
    '<p class="page-sub">' + R.esc(p.subtitle) + "</p></div>";

  if (!unlocked) {
    html += '<div class="locked-note"><p><strong>This phase is locked.</strong></p>' +
      "<p>Pass the Phase " + (p.number - 1) + " quiz to unlock it — or turn on " +
      '<em>Unlock all phases</em> in settings if you would rather jump around.</p>' +
      '<div class="btn-row" style="justify-content:center">' +
      '<button class="btn primary" data-go="#/quiz/' + (p.number - 1) + '">Take the Phase ' + (p.number - 1) + " quiz</button>" +
      '<button class="btn" data-go="#/settings">Settings</button></div></div>';
    return html;
  }

  html += '<div class="card"><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">' +
    '<div style="flex:1;min-width:200px">' +
      '<div class="bar' + (pr.complete ? " done" : "") + '"><span style="width:' + pr.pct + '%"></span></div>' +
      '<div style="font-size:.8rem;color:var(--ink-3);margin-top:7px">' +
        pr.doneTopics + " of " + pr.totalTopics + " topics · quiz " +
        (pr.quizPassed ? "passed" : "not passed yet") + "</div>" +
    "</div>" +
    '<div class="chip ' + (pr.complete ? "teal" : "") + '">' + p.badge.icon + " " + R.esc(p.badge.name) + "</div>" +
  "</div></div>";

  html += '<div class="card"><div class="eyebrow">Goal of this phase</div><p style="margin:0">' +
    R.inline(p.goal) + "</p></div>";

  html += R.blockTitle("Topics");
  html += '<div class="topic-cards">';
  (p.topics || []).forEach((t, i) => {
    const done = Store.isDone(t.id);
    html += '<button class="tcard' + (done ? " is-done" : "") + '" data-go="#/topic/' + t.id + '">' +
      '<span class="tcard-n">' + (done ? "✓" : (p.number + "." + (i + 1))) + "</span>" +
      '<span class="tcard-main"><span class="tcard-title">' + R.esc(t.title) + "</span>" +
      '<span class="tcard-meta">' + R.esc(t.tag || "") + " · " + (t.minutes || 10) + " min</span></span>" +
      '<span class="tcard-go">›</span></button>';
  });
  html += "</div>";

  const pocs = pocsForPhase(p.number);
  if (pocs.length) {
    html += R.blockTitle("Milestones in this phase");
    html += '<div class="topic-cards">';
    pocs.forEach(poc => {
      const done = Store.getPoc(poc.id).done;
      html += '<button class="tcard' + (done ? " is-done" : "") + '" data-go="#/poc/' + poc.id + '">' +
        '<span class="tcard-n">' + (done ? "✓" : "★") + "</span>" +
        '<span class="tcard-main"><span class="tcard-title">' + R.esc(poc.code) + " — " + R.esc(poc.title) + "</span>" +
        '<span class="tcard-meta">' + R.esc(poc.estimate) + " · " + R.esc(poc.summary) + "</span></span>" +
        '<span class="tcard-go">›</span></button>';
    });
    html += "</div>";
  }

  const q = Store.getPhaseQuiz(p.id);
  html += R.blockTitle("End-of-phase quiz");
  html += '<div class="card"><p>' + (p.quiz || []).length +
    " questions. Score " + Math.round(PASS_MARK * 100) + "% or more to complete the phase" +
    (p.number < COURSE.phases.length ? " and unlock Phase " + (p.number + 1) : "") + ".</p>" +
    (q ? '<p style="font-size:.86rem;color:var(--ink-2)">Last attempt: <strong>' + q.score + "/" + q.total +
         "</strong> — " + (q.passed ? "passed" : "not passed") + ", " + R.esc(q.date) + "</p>" : "") +
    '<div class="btn-row"><button class="btn primary" data-go="#/quiz/' + p.number + '">' +
    (q ? "Retake the quiz" : "Start the quiz") + "</button></div></div>";

  return html;
}

/* ------------------------------------------------------------ topic view */

function viewTopic(id) {
  const found = findTopic(id);
  if (!found) return notFound();
  const { topic: t, phase: p, index } = found;
  const done = Store.isDone(t.id);

  const flat = allTopics();
  const globalIdx = flat.findIndex(x => x.topic.id === t.id);
  const prev = globalIdx > 0 ? flat[globalIdx - 1] : null;
  const next = globalIdx < flat.length - 1 ? flat[globalIdx + 1] : null;

  let html = '<div class="topic-nav-top">' +
    '<div class="crumb"><a data-go="#/phase/' + p.number + '">Phase ' + p.number + " · " + R.esc(p.title) +
    "</a> &nbsp;/&nbsp; " + (index + 1) + " of " + p.topics.length + "</div>" +
    "<div>" + (t.minutes || 10) + " min read</div></div>";

  html += '<div class="page-head">' +
    '<div class="eyebrow">' + p.number + "." + (index + 1) + "</div>" +
    "<h1>" + R.esc(t.title) + "</h1></div>";

  html += '<div class="chip-row">';
  if (t.tag) html += '<span class="chip accent">' + R.esc(t.tag) + "</span>";
  if (done) html += '<span class="chip teal">✓ done</span>';
  html += "</div>";

  html += '<div class="intro-block">' + R.md(t.intro) + "</div>";
  html += R.jargonBox(t.jargon);

  if (t.sections && t.sections.length) {
    html += R.blockTitle("Going deeper");
    html += R.sections(t.sections);
  }

  if (t.diagram) {
    html += R.blockTitle("The picture");
    html += R.diagram(t.diagram);
  }

  if (t.example) {
    html += R.blockTitle("Worked example");
    html += R.codeExample(t.example, "ex");
  }

  if (t.playground) {
    html += R.blockTitle("Try it yourself");
    html += '<div class="pg" data-pg>' +
      '<div class="pg-head"><span class="cap">' + R.inline(t.playground.caption || "Simulated console") + "</span>" +
        '<button class="btn primary" style="padding:5px 13px;font-size:.8rem" data-pg-run>Run ▶</button>' +
        '<button class="icon-btn" data-pg-reset title="Reset">↺</button></div>' +
      '<textarea spellcheck="false" data-pg-code>' + R.esc(t.playground.code) + "</textarea>" +
      '<div class="pg-console" data-pg-out>Press Run to see the output.</div>' +
      '<div class="pg-hint">A simulation, not a JVM. It runs variables, arithmetic, ' +
      "if / else if / else, for and while loops, and System.out.println — but not objects, " +
      "methods or collections. Anything it cannot run, it will say so.</div>" +
      "</div>";
    // stash the original for reset / fallback
    window.__pgOriginal = t.playground.code;
    window.__pgExpected = t.playground.output;
  }

  if (t.quiz) {
    html += R.blockTitle(t.quiz.kind === "predict" ? "Predict the output" : "Check yourself");
    html += renderTopicQuiz(t);
  }

  if (t.mistake) {
    html += R.blockTitle("Common mistake");
    html += R.mistakeBox(t.mistake);
  }

  html += '<div class="topic-foot">' +
    '<button class="btn done-btn ' + (done ? "is-done" : "primary") + '" data-mark-done="' + t.id + '">' +
      (done ? "✓ Marked as done" : "Mark this topic as done") + "</button></div>";

  html += '<div class="pager">' +
    (prev ? '<button class="btn" data-go="#/topic/' + prev.topic.id + '"><span>&larr; ' +
            R.esc(prev.topic.title) + "<small>Phase " + prev.phase.number + "</small></span></button>"
          : '<button class="btn" disabled>&larr; Start of the course</button>') +
    (next ? '<button class="btn" data-go="#/topic/' + next.topic.id + '"><span>' +
            R.esc(next.topic.title) + " &rarr;<small>Phase " + next.phase.number + "</small></span></button>"
          : '<button class="btn" data-go="#/quiz/' + p.number + '">Phase quiz &rarr;</button>') +
  "</div>";

  return html;
}

function renderTopicQuiz(t) {
  const q = t.quiz;
  const saved = Store.getTopicAnswer(t.id);
  const answered = saved !== null && saved !== undefined;

  let html = '<div class="quiz" data-quiz="' + t.id + '">' +
    '<div class="quiz-head"><span>❓</span><span>' +
      (q.kind === "predict" ? "Predict, then reveal" : "Quick check") + "</span></div>" +
    '<div class="quiz-body">' +
      '<div class="quiz-prompt">' + R.inline(q.prompt) + "</div>" +
      (q.code ? "<pre><code>" + R.esc(q.code) + "</code></pre>" : "") +
      '<div class="quiz-opts">';

  (q.options || []).forEach((opt, i) => {
    let cls = "quiz-opt";
    if (answered) {
      if (i === q.answer) cls += " correct";
      else if (i === saved) cls += " wrong";
    }
    html += '<button class="' + cls + '" data-opt="' + i + '"' + (answered ? " disabled" : "") + ">" +
      '<span class="key">' + "ABCDEFGH"[i] + "</span><span>" + R.inline(opt) + "</span></button>";
  });

  html += "</div>";
  html += '<div data-quiz-explain>';
  if (answered) html += explainHtml(saved === q.answer, q.explain);
  html += "</div></div></div>";
  return html;
}

function explainHtml(right, text) {
  return '<div class="quiz-explain ' + (right ? "right" : "wrong") + '">' +
    '<span class="verdict">' + (right ? "✓ Correct" : "✗ Not quite") + "</span>" +
    R.inline(text) + "</div>";
}

/* ------------------------------------------------------- phase quiz view */

let quizState = null;

function viewPhaseQuiz(n) {
  const p = phaseByNumber(n);
  if (!p || !p.quiz || !p.quiz.length) return notFound();

  if (!quizState || quizState.phaseId !== p.id) {
    quizState = { phaseId: p.id, index: 0, answers: [], finished: false };
  }

  let html = '<div class="page-head">' +
    '<div class="eyebrow">Phase ' + p.number + " quiz</div>" +
    "<h1>" + R.esc(p.title) + "</h1>" +
    '<p class="page-sub">' + p.quiz.length + " questions · pass mark " +
    Math.round(PASS_MARK * 100) + "%</p></div>";

  html += '<div class="pq-progress">';
  p.quiz.forEach((q, i) => {
    let cls = "pq-pip";
    if (quizState.answers[i] !== undefined) {
      cls += quizState.answers[i] === q.answer ? " right" : " wrong";
    } else if (i === quizState.index && !quizState.finished) cls += " done";
    html += '<div class="' + cls + '"></div>';
  });
  html += "</div>";

  if (quizState.finished) return html + renderQuizResult(p);

  const q = p.quiz[quizState.index];
  const answered = quizState.answers[quizState.index] !== undefined;

  html += '<div class="quiz" data-phase-quiz="' + p.number + '">' +
    '<div class="quiz-head"><span>Question ' + (quizState.index + 1) + " of " + p.quiz.length + "</span></div>" +
    '<div class="quiz-body"><div class="quiz-prompt">' + R.inline(q.q) + "</div>" +
    '<div class="quiz-opts">';

  q.options.forEach((opt, i) => {
    let cls = "quiz-opt";
    if (answered) {
      if (i === q.answer) cls += " correct";
      else if (i === quizState.answers[quizState.index]) cls += " wrong";
    }
    html += '<button class="' + cls + '" data-pq-opt="' + i + '"' + (answered ? " disabled" : "") + ">" +
      '<span class="key">' + "ABCDEFGH"[i] + "</span><span>" + R.inline(opt) + "</span></button>";
  });
  html += "</div>";

  if (answered) {
    html += explainHtml(quizState.answers[quizState.index] === q.answer, q.explain);
    html += '<div class="btn-row" style="margin-top:16px"><button class="btn primary" data-pq-next>' +
      (quizState.index === p.quiz.length - 1 ? "See my result" : "Next question →") + "</button></div>";
  }
  html += "</div></div>";

  return html;
}

function renderQuizResult(p) {
  const total = p.quiz.length;
  const score = quizState.answers.filter((a, i) => a === p.quiz[i].answer).length;
  const passed = (score / total) >= PASS_MARK;

  // keep the best attempt; a pass always beats a previously-failed attempt
  const existing = Store.getPhaseQuiz(p.id);
  const better = !existing || (passed && !existing.passed) || score > existing.score;
  if (better) {
    Store.setPhaseQuiz(p.id, { score, total, passed, date: new Date().toLocaleDateString() });
  }

  let html = '<div class="card"><div class="result-ring">' +
    '<div class="result-score">' + score + "/" + total + "</div>" +
    '<div class="result-label">' + Math.round((score / total) * 100) + "% — " +
      (passed ? "passed" : "not passed, pass mark is " + Math.round(PASS_MARK * 100) + "%") + "</div>";

  if (passed) {
    html += '<div class="result-badge"><span style="font-size:1.3rem">' + p.badge.icon + "</span>" +
      "<span>Badge earned: " + R.esc(p.badge.name) + "</span></div>";
    const nextP = phaseByNumber(p.number + 1);
    if (nextP) html += '<p style="color:var(--ink-2)">Phase ' + nextP.number + " — " +
      R.esc(nextP.title) + " is now unlocked.</p>";
  } else {
    html += '<p style="color:var(--ink-2)">Have another look at the topics below, then try again. ' +
      "Retaking a quiz is normal and costs nothing.</p>";
  }
  html += "</div>";

  html += '<div class="result-review">';
  p.quiz.forEach((q, i) => {
    const right = quizState.answers[i] === q.answer;
    html += '<div class="rr-item"><span class="rr-mark ' + (right ? "ok" : "no") + '">' +
      (right ? "✓" : "✗") + "</span><span><strong>" + R.inline(q.q) + "</strong>" +
      (right ? "" : '<br><span style="color:var(--ink-3)">Answer: ' + R.inline(q.options[q.answer]) + "</span>") +
      "</span></div>";
  });
  html += "</div>";

  html += '<div class="btn-row" style="margin-top:20px">' +
    '<button class="btn" data-pq-retry="' + p.number + '">Retake</button>' +
    '<button class="btn" data-go="#/phase/' + p.number + '">Back to phase</button>' +
    (passed && phaseByNumber(p.number + 1)
      ? '<button class="btn primary" data-go="#/phase/' + (p.number + 1) + '">Start Phase ' + (p.number + 1) + " →</button>"
      : '<button class="btn primary" data-go="#/">Dashboard</button>') +
    "</div></div>";

  return html;
}

/* -------------------------------------------------------------- POC views */

function viewPocList() {
  let html = '<div class="page-head"><div class="eyebrow">Milestones</div>' +
    "<h1>POC checklist</h1>" +
    '<p class="page-sub">Five proofs of concept, one storyline. Each adds a capability the previous one lacked.</p></div>';

  html += '<div class="topic-cards">';
  COURSE.pocs.forEach(poc => {
    const p = Store.getPoc(poc.id);
    html += '<button class="tcard' + (p.done ? " is-done" : "") + '" data-go="#/poc/' + poc.id + '">' +
      '<span class="tcard-n">' + (p.done ? "✓" : "★") + "</span>" +
      '<span class="tcard-main"><span class="tcard-title">' + R.esc(poc.code) + " — " + R.esc(poc.title) + "</span>" +
      '<span class="tcard-meta">Phase ' + poc.phase + " · " + R.esc(poc.estimate) +
      (p.notes ? " · notes saved" : "") + "</span></span>" +
      '<span class="tcard-go">›</span></button>';
  });
  html += "</div>";
  return html;
}

function viewPoc(id) {
  const poc = COURSE.pocs.find(p => p.id === id);
  if (!poc) return notFound();
  const saved = Store.getPoc(poc.id);

  let html = '<div class="poc-hero">' +
    '<div class="eyebrow">' + R.esc(poc.code) + " · Phase " + poc.phase + "</div>" +
    "<h1>" + R.esc(poc.title) + "</h1>" +
    '<p style="margin:0;color:var(--ink-2)">' + R.esc(poc.summary) + "</p>" +
    '<div class="chip-row" style="margin:14px 0 0">' +
      '<span class="chip">⏱ ' + R.esc(poc.estimate) + "</span>" +
      '<span class="chip">📁 ' + R.esc(poc.repoFolder) + "</span>" +
      (saved.done ? '<span class="chip teal">✓ complete</span>' : "") +
    "</div></div>";

  html += R.blockTitle("Problem");
  html += '<div class="card">' + R.md(poc.problem) + "</div>";

  html += R.blockTitle("Technology");
  html += '<div class="card"><ul style="margin:0">' +
    poc.technology.map(t => "<li>" + R.inline(t) + "</li>").join("") + "</ul></div>";

  html += R.blockTitle("Input");
  html += '<div class="table-wrap"><table><thead><tr><th>Field</th><th>Type</th><th>Example</th><th>Notes</th></tr></thead><tbody>' +
    poc.input.map(f => "<tr><td><code>" + R.esc(f.field) + "</code></td><td>" + f.type +
      "</td><td><code>" + R.esc(f.example) + "</code></td><td>" + R.inline(f.note || "") + "</td></tr>").join("") +
    "</tbody></table></div>";

  html += R.blockTitle("Business rules");
  html += '<div class="table-wrap"><table><thead><tr><th>#</th><th>Rule</th><th>Reason returned</th></tr></thead><tbody>' +
    poc.rules.map(r => "<tr><td><strong>" + R.esc(r.id) + "</strong></td><td>" + R.inline(r.text) +
      "</td><td>" + R.inline(r.reason) + "</td></tr>").join("") + "</tbody></table></div>";

  html += R.blockTitle("Expected output");
  html += '<div class="table-wrap"><table><thead><tr><th>Case</th><th>Input</th><th>Expected</th><th>Note</th></tr></thead><tbody>' +
    poc.expected.map(e => "<tr><td>" + R.inline(e.name) + "</td><td><code>" + R.esc(e.input) +
      "</code></td><td>" + R.inline(e.output) + "</td><td>" + R.inline(e.note || "") + "</td></tr>").join("") +
    "</tbody></table></div>";

  html += R.blockTitle("How to build it");
  html += '<ul class="checklist">' + poc.steps.map((s, i) =>
    '<li><span class="n">' + (i + 1) + "</span><span>" + R.inline(s) + "</span></li>").join("") + "</ul>";

  if (poc.watchFor) {
    html += R.blockTitle("Watch out for");
    html += '<div class="mistake">' +
      '<div class="mistake-head"><span>&#9888;</span><span>Where this POC will trip you up</span></div>' +
      '<div class="mistake-body">' + R.md(poc.watchFor) + "</div></div>";
  }

  html += R.blockTitle("What I learned (the checklist)");
  html += '<div class="card"><ul style="margin:0">' +
    poc.learned.map(l => "<li>" + R.inline(l) + "</li>").join("") + "</ul>" +
    '<p style="margin:14px 0 0;font-size:.84rem;color:var(--ink-3)">These are the takeaways this POC is designed to produce. ' +
    "Write your own version below — yours will be better, because they will be yours.</p></div>";

  html += R.blockTitle("Explain like I'm interviewing");
  html += '<div class="interview-box"><div class="ib-head"><span>🎤</span>' +
    "<span>Say it out loud, right now</span></div>" + R.md(poc.interviewPrompt) + "</div>";

  html += R.blockTitle("My notes");
  html += '<div class="card">' +
    '<p style="font-size:.86rem;color:var(--ink-2);margin-bottom:12px">What went wrong, what you fixed, what you would ' +
    "do differently. Saved automatically to this browser — copy it into your POC README when you are done.</p>" +
    '<textarea class="notes-area" data-poc-notes="' + poc.id + '" placeholder="Problem I hit&#10;Cause&#10;Fix&#10;What I would do differently&#10;&#10;Questions for my trainer">' +
      R.esc(saved.notes || "") + "</textarea>" +
    '<div class="save-hint" data-save-hint>' + (saved.updated ? "Last saved " + new Date(saved.updated).toLocaleString() : "") + "</div>" +
    '<div class="btn-row" style="margin-top:14px">' +
      '<button class="btn ' + (saved.done ? "" : "teal") + '" data-poc-done="' + poc.id + '">' +
        (saved.done ? "✓ Marked complete — undo" : "Mark POC complete") + "</button>" +
      '<button class="btn ghost" data-poc-copy="' + poc.id + '">Copy notes</button>' +
    "</div></div>";

  return html;
}

/* -------------------------------------------------------- flashcard view */

let fc = { list: [], pos: 0, flipped: false, group: "all", phase: "all", onlyReview: false };

function buildDeck() {
  let list = COURSE.cards.slice();
  if (fc.group !== "all") list = list.filter(c => c.group === fc.group);
  if (fc.phase !== "all") list = list.filter(c => String(c.phase) === fc.phase);
  if (fc.onlyReview) list = list.filter(c => Store.getCard(c.term) !== "known");
  fc.list = list;
  if (fc.pos >= list.length) fc.pos = 0;
}

function viewCards() {
  buildDeck();
  const groups = Array.from(new Set(COURSE.cards.map(c => c.group)));
  const phases = Array.from(new Set(COURSE.cards.map(c => c.phase))).sort();
  const known = COURSE.cards.filter(c => Store.getCard(c.term) === "known").length;

  let html = '<div class="page-head"><div class="eyebrow">Review mode</div>' +
    "<h1>Flashcards</h1>" +
    '<p class="page-sub">' + COURSE.cards.length + " key terms across every phase. " +
    known + " marked as known.</p></div>";

  html += '<div class="fc-toolbar">' +
    '<select data-fc-group>' +
      '<option value="all">All groups</option>' +
      groups.map(g => '<option value="' + R.esc(g) + '"' + (fc.group === g ? " selected" : "") + ">" + R.esc(g) + "</option>").join("") +
    "</select>" +
    '<select data-fc-phase>' +
      '<option value="all">All phases</option>' +
      phases.map(p => '<option value="' + p + '"' + (fc.phase === String(p) ? " selected" : "") + ">Phase " + p + "</option>").join("") +
    "</select>" +
    '<button class="btn ghost" data-fc-review>' + (fc.onlyReview ? "✓ " : "") + "Hide known</button>" +
    '<button class="btn ghost" data-fc-shuffle>Shuffle</button>' +
    '<span class="fc-count">' + (fc.list.length ? (fc.pos + 1) + " / " + fc.list.length : "0") + "</span>" +
  "</div>";

  if (!fc.list.length) {
    html += '<div class="empty"><p>No cards match that filter.</p>' +
      '<button class="btn" data-fc-clear>Clear filters</button></div>';
    return html;
  }

  const c = fc.list[fc.pos];
  const status = Store.getCard(c.term);

  html += '<div class="fc-stage"><div class="fc-card' + (fc.flipped ? " flipped" : "") + '" data-fc-flip>' +
    '<div class="fc-face">' +
      '<div class="fc-group">' + R.esc(c.group) + "</div>" +
      '<div class="fc-phase">Phase ' + c.phase + "</div>" +
      '<div class="fc-term">' + R.esc(c.term) + "</div>" +
      (status ? '<div class="chip ' + (status === "known" ? "teal" : "amber") + '">' + status + "</div>" : "") +
      '<div class="fc-tap">tap to reveal</div>' +
    "</div>" +
    '<div class="fc-face fc-back">' +
      '<div class="fc-group">' + R.esc(c.term) + "</div>" +
      '<div class="fc-def">' + R.inline(c.definition) + "</div>" +
      '<div class="fc-tap">tap to flip back</div>' +
    "</div>" +
  "</div></div>";

  html += '<div class="fc-actions">' +
    '<button class="btn" data-fc-prev>&larr; Previous</button>' +
    '<button class="btn" data-fc-mark="review">Review again</button>' +
    '<button class="btn teal" data-fc-mark="known">I know this</button>' +
    '<button class="btn" data-fc-next>Next &rarr;</button>' +
  "</div>";

  html += '<p style="margin-top:18px;font-size:.82rem;color:var(--ink-3)">' +
    "Keyboard: <code>space</code> flip, <code>&larr;</code> <code>&rarr;</code> move, " +
    "<code>k</code> known, <code>r</code> review.</p>";

  return html;
}

/* ------------------------------------------------------------ other views */

function viewSettings() {
  const dark = Store.getTheme() === "dark";
  let html = '<div class="page-head"><div class="eyebrow">Settings</div>' +
    "<h1>Settings &amp; backup</h1>" +
    '<p class="page-sub">Everything is stored in this browser only. No account, no server.</p></div>';

  html += '<div class="card">' +
    settingRow("Dark mode", "Easier at night. Remembered between visits.",
      '<label class="switch"><input type="checkbox" data-set-theme' + (dark ? " checked" : "") + "><span></span></label>") +
    settingRow("Unlock all phases", "By default a phase unlocks when you pass the previous phase quiz. Turn this on to jump anywhere.",
      '<label class="switch"><input type="checkbox" data-set-unlock' + (Store.isUnlockAll() ? " checked" : "") + "><span></span></label>") +
  "</div>";

  html += R.blockTitle("Backup");
  html += '<div class="card"><p style="font-size:.88rem;color:var(--ink-2)">Your progress and POC notes live in this ' +
    "browser's local storage. Clearing site data will erase them, so export a copy occasionally — " +
    "especially your POC notes.</p>" +
    '<div class="btn-row"><button class="btn primary" data-export>Download my progress</button>' +
    '<button class="btn" data-import-btn>Import a backup</button>' +
    '<input type="file" accept="application/json" style="display:none" data-import-file></div></div>';

  html += R.blockTitle("Danger zone");
  html += '<div class="card" style="border-color:var(--red)"><p style="font-size:.88rem;color:var(--ink-2)">' +
    "This erases every tick, quiz result and POC note. There is no undo.</p>" +
    '<button class="btn" style="color:var(--red);border-color:var(--red)" data-reset-all>Reset everything</button></div>';

  html += R.blockTitle("Editing the content yourself");
  html += '<div class="card">' + R.md(
    "All the teaching content lives in plain JavaScript files you can edit in any text editor:\n\n" +
    "- `content/phase1.js` ... `content/phase7.js` — one file per phase\n" +
    "- `content/pocs.js` — the five POC milestones\n" +
    "- `content/flashcards.js` — the review terms\n\n" +
    "Each file starts with a comment showing the shape of a topic. Add a topic by copying an existing " +
    "one and changing the `id` to something unique. Save the file, refresh the page, and it appears — " +
    "no build step, no install. The app logic never needs touching."
  ) + "</div>";

  return html;
}

function settingRow(title, sub, control) {
  return '<div class="settings-row"><div class="sr-main"><div class="sr-title">' + R.esc(title) +
    '</div><div class="sr-sub">' + R.esc(sub) + "</div></div>" + control + "</div>";
}

function notFound() {
  return '<div class="empty"><h1>Not found</h1><p>That page does not exist.</p>' +
    '<button class="btn primary" data-go="#/">Back to the dashboard</button></div>';
}

/* =========================================================================
   ROUTER
   ========================================================================= */

function route() {
  const hash = location.hash || "#/";
  const parts = hash.replace(/^#\//, "").split("/");
  const main = $("#view");
  let html = "";

  if (!parts[0]) html = viewDashboard();
  else if (parts[0] === "phase")    html = viewPhase(parts[1]);
  else if (parts[0] === "topic")    html = viewTopic(parts[1]);
  else if (parts[0] === "quiz")     html = viewPhaseQuiz(parts[1]);
  else if (parts[0] === "poc")      html = viewPoc(parts[1]);
  else if (parts[0] === "pocs")     html = viewPocList();
  else if (parts[0] === "cards")    html = viewCards();
  else if (parts[0] === "settings") html = viewSettings();
  else html = notFound();

  main.innerHTML = html;
  window.scrollTo(0, 0);
  renderSidebar();
  Store.setLastRoute(hash);
  closeSidebar();

  const t = parts[0] === "topic" ? findTopic(parts[1]) : null;
  document.title = t ? t.topic.title + " · ODM Learning" : "ODM & Java Learning Path";
}

function go(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}

/* =========================================================================
   EVENTS
   ========================================================================= */

document.addEventListener("click", e => {
  const t = e.target;

  /* navigation */
  const goEl = t.closest("[data-go]");
  if (goEl) { e.preventDefault(); go(goEl.getAttribute("data-go")); return; }

  /* sidebar phase expand */
  const ph = t.closest("[data-phase-toggle]");
  if (ph) {
    const id = ph.getAttribute("data-phase-toggle");
    openPhases[id] = !openPhases[id];
    ph.parentElement.classList.toggle("open", !!openPhases[id]);
    return;
  }

  /* collapsible section */
  const sec = t.closest("[data-sec-toggle]");
  if (sec) { sec.parentElement.classList.toggle("open"); return; }

  /* copy code */
  const copy = t.closest("[data-copy]");
  if (copy) {
    const code = $("#code-" + copy.getAttribute("data-copy"));
    if (code) {
      copyText(code.textContent, () => {
        copy.textContent = "Copied"; copy.classList.add("ok");
        setTimeout(() => { copy.textContent = "Copy"; copy.classList.remove("ok"); }, 1600);
      });
    }
    return;
  }

  /* topic quiz answer */
  const opt = t.closest("[data-opt]");
  if (opt && !opt.disabled) {
    const box = opt.closest("[data-quiz]");
    const topicId = box.getAttribute("data-quiz");
    const found = findTopic(topicId);
    if (!found) return;
    const q = found.topic.quiz;
    const chosen = Number(opt.getAttribute("data-opt"));
    Store.setTopicAnswer(topicId, chosen);
    $$(".quiz-opt", box).forEach((b, i) => {
      b.disabled = true;
      if (i === q.answer) b.classList.add("correct");
      else if (i === chosen) b.classList.add("wrong");
    });
    $("[data-quiz-explain]", box).innerHTML = explainHtml(chosen === q.answer, q.explain);
    return;
  }

  /* mark topic done */
  const md = t.closest("[data-mark-done]");
  if (md) {
    const id = md.getAttribute("data-mark-done");
    const now = !Store.isDone(id);
    Store.setDone(id, now);
    if (now) toast("Topic marked done — streak: " + Store.state.streak.count + " day" +
                   (Store.state.streak.count === 1 ? "" : "s"));
    route();
    return;
  }

  /* phase quiz */
  const pqOpt = t.closest("[data-pq-opt]");
  if (pqOpt && !pqOpt.disabled && quizState) {
    quizState.answers[quizState.index] = Number(pqOpt.getAttribute("data-pq-opt"));
    route();
    return;
  }
  if (t.closest("[data-pq-next]") && quizState) {
    const p = COURSE.phases.find(x => x.id === quizState.phaseId);
    if (quizState.index === p.quiz.length - 1) quizState.finished = true;
    else quizState.index += 1;
    route();
    return;
  }
  const retry = t.closest("[data-pq-retry]");
  if (retry) {
    const p = phaseByNumber(retry.getAttribute("data-pq-retry"));
    quizState = { phaseId: p.id, index: 0, answers: [], finished: false };
    route();
    return;
  }

  /* playground */
  if (t.closest("[data-pg-run]")) {
    const pg = t.closest("[data-pg]");
    const code = $("[data-pg-code]", pg).value;
    const out = $("[data-pg-out]", pg);
    const res = Playground.run(code);
    if (res.ok) {
      out.innerHTML = '<span class="out">' + R.esc(res.output) + "</span>";
    } else {
      out.innerHTML = '<span class="warn">' + R.esc(res.message) + "</span>\n\n" +
        '<span class="out">Expected output of the original snippet:\n' +
        R.esc(window.__pgExpected || "") + "</span>";
    }
    return;
  }
  if (t.closest("[data-pg-reset]")) {
    const pg = t.closest("[data-pg]");
    $("[data-pg-code]", pg).value = window.__pgOriginal || "";
    $("[data-pg-out]", pg).textContent = "Press Run to see the output.";
    return;
  }

  /* POC */
  const pd = t.closest("[data-poc-done]");
  if (pd) {
    const id = pd.getAttribute("data-poc-done");
    const now = !Store.getPoc(id).done;
    Store.setPocDone(id, now);
    if (now) toast("POC complete — well done");
    route();
    return;
  }
  const pc = t.closest("[data-poc-copy]");
  if (pc) {
    const notes = Store.getPoc(pc.getAttribute("data-poc-copy")).notes || "";
    if (!notes.trim()) { toast("No notes to copy yet"); return; }
    copyText(notes, () => toast("Notes copied to the clipboard"));
    return;
  }

  /* flashcards */
  if (t.closest("[data-fc-flip]")) { fc.flipped = !fc.flipped;
    $(".fc-card").classList.toggle("flipped", fc.flipped); return; }
  if (t.closest("[data-fc-next]")) { fcMove(1); return; }
  if (t.closest("[data-fc-prev]")) { fcMove(-1); return; }
  const fm = t.closest("[data-fc-mark]");
  if (fm) {
    const c = fc.list[fc.pos];
    if (c) { Store.setCard(c.term, fm.getAttribute("data-fc-mark")); fcMove(1); }
    return;
  }
  if (t.closest("[data-fc-shuffle]")) {
    for (let i = fc.list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fc.list[i], fc.list[j]] = [fc.list[j], fc.list[i]];
    }
    fc.pos = 0; fc.flipped = false; route(); return;
  }
  if (t.closest("[data-fc-review]")) { fc.onlyReview = !fc.onlyReview; fc.pos = 0; fc.flipped = false; route(); return; }
  if (t.closest("[data-fc-clear]")) { fc.group = "all"; fc.phase = "all"; fc.onlyReview = false; fc.pos = 0; route(); return; }

  /* settings */
  if (t.closest("[data-export]")) {
    const blob = new Blob([Store.exportJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "odm-learning-progress-" + Store.today() + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Backup downloaded");
    return;
  }
  if (t.closest("[data-import-btn]")) { $("[data-import-file]").click(); return; }
  if (t.closest("[data-reset-all]")) {
    if (confirm("Erase all progress, quiz results and POC notes? This cannot be undone.")) {
      Store.resetAll(); setTheme("light"); go("#/"); toast("Everything reset");
    }
    return;
  }

  /* mobile chrome */
  if (t.closest("#menuBtn")) {
    $("#sidebar").classList.add("open"); $("#scrim").classList.add("show"); return;
  }
  if (t.closest("#scrim")) { closeSidebar(); return; }
  if (t.closest("#themeBtn")) {
    setTheme(Store.getTheme() === "dark" ? "light" : "dark"); return;
  }
});

function fcMove(step) {
  if (!fc.list.length) return;
  fc.pos = (fc.pos + step + fc.list.length) % fc.list.length;
  fc.flipped = false;
  route();
}

/* change events */
document.addEventListener("change", e => {
  const t = e.target;
  if (t.matches("[data-set-theme]")) { setTheme(t.checked ? "dark" : "light"); return; }
  if (t.matches("[data-set-unlock]")) {
    Store.setUnlockAll(t.checked);
    toast(t.checked ? "All phases unlocked" : "Phase locking back on");
    renderSidebar(); return;
  }
  if (t.matches("[data-fc-group]")) { fc.group = t.value; fc.pos = 0; fc.flipped = false; route(); return; }
  if (t.matches("[data-fc-phase]")) { fc.phase = t.value; fc.pos = 0; fc.flipped = false; route(); return; }
  if (t.matches("[data-import-file]")) {
    const file = t.files && t.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        Store.importJson(reader.result);
        setTheme(Store.getTheme());
        go("#/");
        toast("Backup restored");
      } catch (err) { toast("That file could not be read as a backup"); }
    };
    reader.readAsText(file);
  }
});

/* POC notes autosave */
let notesTimer = null;
document.addEventListener("input", e => {
  const t = e.target;

  if (t.matches("[data-poc-notes]")) {
    const id = t.getAttribute("data-poc-notes");
    const hint = $("[data-save-hint]");
    if (hint) { hint.textContent = "Saving…"; hint.classList.remove("saved"); }
    clearTimeout(notesTimer);
    notesTimer = setTimeout(() => {
      Store.setPocNotes(id, t.value);
      if (hint) { hint.textContent = "Saved " + new Date().toLocaleTimeString(); hint.classList.add("saved"); }
    }, 500);
    return;
  }

  if (t.matches("#sideSearch")) {
    searchTerm = t.value;
    renderSidebar();
  }
});

/* keyboard shortcuts on the flashcard page */
document.addEventListener("keydown", e => {
  if (e.target.matches("input, textarea, select")) return;
  if (!location.hash.startsWith("#/cards")) return;
  if (e.key === " ") { e.preventDefault(); fc.flipped = !fc.flipped;
    const c = $(".fc-card"); if (c) c.classList.toggle("flipped", fc.flipped); }
  else if (e.key === "ArrowRight") fcMove(1);
  else if (e.key === "ArrowLeft")  fcMove(-1);
  else if (e.key.toLowerCase() === "k") { const c = fc.list[fc.pos]; if (c) { Store.setCard(c.term, "known"); fcMove(1); } }
  else if (e.key.toLowerCase() === "r") { const c = fc.list[fc.pos]; if (c) { Store.setCard(c.term, "review"); fcMove(1); } }
});

window.addEventListener("hashchange", route);

/* =========================================================================
   BOOT
   ========================================================================= */

(function boot() {
  Store.load();
  setTheme(Store.getTheme() || "light");

  const total = allTopics().length;
  const el = $("#topicCount");
  if (el) el.textContent = total + " topics";

  if (!location.hash) location.hash = "#/";
  route();

  if (!Store.available) {
    const banner = document.createElement("div");
    banner.className = "card";
    banner.style.cssText = "border-color:var(--amber);border-left:4px solid var(--amber);margin:0 0 20px";
    banner.innerHTML = "<strong>Progress cannot be saved in this browser.</strong>" +
      "<p style='margin:8px 0 0;font-size:.88rem;color:var(--ink-2)'>Local storage is blocked, " +
      "which usually means the page was opened straight from disk in a browser that restricts " +
      "<code>file://</code> storage. Everything still works, but ticks and notes will be lost on refresh. " +
      "Try a different browser, or serve the folder locally — for example " +
      "<code>python -m http.server</code> in this directory, then open " +
      "<code>http://localhost:8000</code>.</p>";
    const view = $("#view");
    view.insertBefore(banner, view.firstChild);
  }

  const s = Store.state.streak;
  const chip = $("#streakChip");
  if (chip) chip.textContent = "🔥 " + (s.count || 0);
})();
