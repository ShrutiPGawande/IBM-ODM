# ODM & Java Learning Path

A self-paced learning site covering IBM Operational Decision Manager and the Java
that supports it, structured around a 7-phase roadmap.

## Opening it

Double-click **`index.html`**. That's it — no install, no build step, no server.

If your browser blocks local storage on `file://` pages, the site will tell you so
on the dashboard and progress won't persist between refreshes. In that case, serve
the folder locally instead:

```
cd "path/to/Learning"
python -m http.server
```

then open <http://localhost:8000>.

## What's in it

| | |
|---|---|
| Phases | 7 |
| Topics | 56 |
| Diagrams | 56 (one per topic) |
| Code examples | 56 |
| Predict-the-output quizzes | 56 |
| Common-mistake callouts | 56 |
| End-of-phase quizzes | 7 × 8 questions |
| POC milestones | 5 |
| Flashcard terms | 63 |
| Runnable playgrounds | 7 |

One storyline — **Sunrise Bank loan eligibility** — runs through every phase.
Phase 1 builds the `Applicant` class, Phase 2 turns it into a rule project,
Phase 3 adds collections and a scorecard, Phase 4 deploys it, Phase 5 calls it
over REST, Phase 7 breaks it on purpose.

## Features

- **Dashboard** with a journey map, per-phase progress, streak counter and badges
- **Phase locking** — pass a phase quiz (70%) to unlock the next one, or turn
  locking off in Settings if you'd rather jump around
- **Collapsible sections** so no page is a wall of text
- **Code playground** that really runs variables, arithmetic, `if`/`else`, `for`
  and `while` loops (it is a simulator, not a JVM, and says so when it can't
  handle something)
- **Flashcards** with keyboard shortcuts: `space` flip, `←` `→` move, `k` known,
  `r` review
- **POC pages** with Problem / Input / Rules / Expected Output / What I Learned,
  a notes box that autosaves, and an "Explain like I'm interviewing" prompt
- **Dark mode**, fully responsive, and a progress export/import in Settings

## Files

```
Learning/
├── index.html              open this
├── README.md
├── css/
│   └── styles.css          all styling; the palette is in :root
├── js/
│   ├── storage.js          localStorage: progress, notes, theme
│   ├── render.js           mini-markdown + diagram renderers
│   ├── playground.js       the Java simulator
│   └── app.js              routing, views, event handling
└── content/                ← everything you'd want to edit
    ├── phase1.js  Java Foundations           (12 topics)
    ├── phase2.js  ODM Fundamentals           (10 topics)
    ├── phase3.js  Advanced Rule Logic        (7 topics)
    ├── phase4.js  Publishing & Decision Server (6 topics)
    ├── phase5.js  Java / REST Integration    (6 topics)
    ├── phase6.js  GitHub & Portfolio         (5 topics)
    ├── phase7.js  Troubleshooting & Job Readiness (10 topics)
    ├── pocs.js    the 5 POC milestones
    └── flashcards.js  the review terms
```

## Editing the content yourself

The app logic never needs touching. Everything you read on the site lives in
`content/*.js`, in plain JavaScript objects. Each file starts with a comment
showing the shape of a topic.

### Adding a topic

Copy an existing topic block inside a phase's `topics: [ ... ]` array, give it a
unique `id`, and edit the text. Save, refresh the browser, done.

```js
{
  id: "p2-t11",                    // must be unique across the whole site
  title: "My new topic",
  minutes: 10,
  tag: "Concepts",

  intro: `Plain-English explanation.
Supports **bold**, \`code\`, - bullets, 1. numbered lists,
> quotes, | tables |, and \`\`\` fenced code blocks.`,

  jargon: [
    { term: "Word", plain: "What it means, without jargon." }
  ],

  sections: [
    { title: "Going deeper", open: true, body: `More markdown here.` }
  ],

  diagram: {
    caption: "What the picture shows",
    kind: "flow",              // flow | split | columns | layers
    dir: "down",               // flow only: down | right
    nodes: [
      { label: "Step one", sub: "detail", tone: "a" }
    ]
  },

  example: {
    caption: "What this code shows",
    lang: "java",
    code: `// your code here`,
    note: "The one thing to notice about it."
  },

  // optional — only add one if the simulator can actually run the code
  playground: {
    caption: "Try changing the numbers",
    code: `int x = 5;\nSystem.out.println(x);`,
    output: "5"
  },

  quiz: {
    kind: "predict",           // predict | choose
    prompt: "What does this print?",
    code: `optional code block`,
    options: ["A", "B", "C", "D"],
    answer: 1,                 // zero-based index of the right option
    explain: "Why that is the answer, and why the others are not."
  },

  mistake: {
    title: "The mistake people make",
    symptom: "What you actually see when it happens.",
    cause: "Why it happens.",
    fix: "What to do instead."
  }
}
```

### Diagram kinds

| kind | shape | key field |
|---|---|---|
| `flow` | boxes joined by arrows, vertical or horizontal | `nodes: [{label, sub, tone}]` |
| `split` | one box branching into several | `head: {label, sub}`, `branches: [{when, label, tone}]` |
| `columns` | side-by-side comparison cards | `cols: [{title, tone, items: []}]` |
| `layers` | stacked bars, no arrows | `layers: [{label, sub, tone}]` |

Tones: `a` indigo, `b` teal, `c` violet, `ok` green, `warn` amber, `bad` red.

### Adding a phase quiz question

Each phase file ends with a `quiz: [ ... ]` array:

```js
{
  q: "The question",
  options: ["A", "B", "C", "D"],
  answer: 1,
  explain: "Why."
}
```

Aim for 5–8 questions. The pass mark is 70%, set by `PASS_MARK` in `js/app.js`.

### Adding a flashcard

In `content/flashcards.js`:

```js
{ term: "Thing", group: "ODM core", phase: 2,
  definition: "What it means." }
```

The group and phase dropdowns on the flashcard page build themselves from
whatever values you use.

## A note on the playground

It is a small interpreter, not a JVM. It handles variable declarations,
arithmetic (including Java's integer division), string concatenation with Java's
left-associative rules, `if` / `else if` / `else`, `for` and `while` loops, and
`System.out.println`.

It does **not** handle objects, method calls, collections or generics. When it
meets something it cannot run, it says so and shows the expected output of the
original snippet instead. Only add a `playground` block where the code is within
those limits — otherwise the topic is better served by the `example` block alone.

## Backing up your progress

Progress, quiz results and POC notes live in your browser's local storage, which
clearing site data will erase. **Settings → Download my progress** exports a JSON
file you can re-import later. Worth doing occasionally, especially once your POC
notes are substantial.
