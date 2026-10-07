/* =========================================================================
   PHASE 6 — GitHub, Portfolio & Documentation
   Continuous: starts at POC-01, not after everything.
   ========================================================================= */

window.PHASE_6 = {
  id: "phase6",
  number: 6,
  title: "GitHub & Portfolio",
  subtitle: "A visible learning history, built from POC-01 onwards",
  goal: "Turn five POCs into one coherent story you can show and tell — starting the repository on day one, not at the end.",
  badge: { name: "Storyteller", icon: "📚" },
  topics: [

  /* ---------------------------------------------------------------- 6.1 */
  {
    id: "p6-t1",
    title: "The repository — set it up before POC-01",
    minutes: 10,
    tag: "Setup ★",
    intro: `Your roadmap makes one correction here and it is the right one: **start GitHub from POC-01, not after all five are finished.**

The reason is not tidiness. A repository built as you go records *how you learned* — the commits, the questions in your READMEs, the mistakes you fixed. A repository assembled at the end records only that you finished, and it always looks assembled at the end.

There is a second, more practical reason. Three months from now you will not remember why POC-02's ruleflow was structured that way, or what the fix was for that classpath error. Written at the time, it takes two minutes. Reconstructed later, it takes an afternoon and is half wrong.

Create the repository before you write your first rule. Today, if POC-01 is not done yet.`,
    jargon: [
      { term: "Repository (repo)", plain: "A project folder tracked by Git, usually hosted on GitHub." },
      { term: "Commit", plain: "One saved change, with a message describing it." },
      { term: "README", plain: "The markdown file GitHub displays on a folder's page. Your documentation front door." },
      { term: ".gitignore", plain: "A file listing things Git should not track — build output, IDE settings, credentials." }
    ],
    sections: [
      {
        title: "The structure",
        open: true,
        body: `Your roadmap already specifies it:

\`\`\`
ibm-odm-learning
├── poc-01-basic-rules
├── poc-02-ruleflow
├── poc-03-collections
├── poc-04-decision-server
├── poc-05-java-rest-integration
└── README.md
\`\`\`

Create all five folders now, each with a README stating the problem it will solve. Empty folders with intentions in them are fine — they show a plan, and they make each POC's first commit a completion rather than a creation.

Add two more things at the top level:

\`\`\`
├── notes/          your own learning notes, one file per topic area
└── .gitignore      so build output and credentials never get committed
\`\`\``
      },
      {
        title: "What goes in each POC folder",
        open: true,
        body: `\`\`\`
poc-01-basic-rules/
├── README.md                  <- the most important file
├── loan-eligibility-xom/      <- the Java project
│   ├── pom.xml
│   └── src/main/java/com/sunrise/model/
├── loan-eligibility-rules/    <- the exported rule project
│   ├── rules/*.brl
│   ├── bom/model.bom
│   └── bom/model_en_US.voc
├── test-data/
│   └── scenarios.md           <- your test cases and expected results
└── screenshots/
    └── decision-table.png     <- one or two, for the README
\`\`\`

Rule artefacts (.brl, .bom, .voc) are text files. Commit them. They diff cleanly in a pull request, which is a genuinely good answer when an interviewer asks how business rules are version-controlled.

A screenshot of a decision table or a ruleflow in the README is worth a great deal — it is the fastest way for a reader to see what you built.`
      },
      {
        title: ".gitignore — get this right immediately",
        open: false,
        body: `\`\`\`
# build output
target/
build/
*.class
*.jar

# Eclipse / Rule Designer
.metadata/
.settings/
bin/
*.launch

# IntelliJ
.idea/
*.iml

# OS
.DS_Store
Thumbs.db

# credentials - NEVER commit these
*.properties.local
secrets.*
**/application-local.yml
\`\`\`

That last block matters most. A Decision Server password committed to a public repository is a real incident, and Git history means deleting the file later does not remove it. Put credentials in environment variables or a local file that is ignored, and say so in the README.`
      }
    ],
    diagram: {
      caption: "Build the repo alongside the learning, not after it",
      kind: "columns",
      cols: [
        { title: "Repo built as you go", tone: "ok", items: ["Commits show progression", "Notes written while fresh", "Mistakes and fixes recorded", "Reads like a learning journey"] },
        { title: "Repo built at the end", tone: "warn", items: ["One big commit", "Details reconstructed", "Mistakes forgotten", "Reads like a submission"] }
      ]
    },
    example: {
      caption: "The top-level README — your repository's front page",
      lang: "markdown",
      code: `# IBM ODM Learning

Learning IBM Operational Decision Manager (ODM) and the Java that
supports it, through five progressively harder proofs of concept.

All five POCs build on one running example: **Sunrise Bank personal
loan pre-screening**. Each POC adds one capability to the same
decision service, so the repository reads as one story rather than
five unrelated exercises.

## The POCs

| # | POC | Adds | Status |
|---|-----|------|--------|
| 01 | [Basic rules](./poc-01-basic-rules) | BOM/XOM, vocabulary, action rules, a decision table | Done |
| 02 | [Ruleflow](./poc-02-ruleflow) | Rule packages, ruleflow, branching, execution order | In progress |
| 03 | [Collections](./poc-03-collections) | Rules over a list of existing loans, aggregates | Not started |
| 04 | [Decision Server](./poc-04-decision-server) | RuleApp, ruleset versioning, deployment, RES console | Not started |
| 05 | [Java + REST](./poc-05-java-rest-integration) | HTDS endpoint, Postman collection, Java client | Not started |

## The running example

Sunrise Bank pre-screens personal loan applications on four inputs —
age, annual salary, credit score and existing loans — and returns an
eligibility decision with reasons. The thresholds are reviewed every
quarter, which is why the logic belongs in a rule engine rather than
in application code.

## Architecture

    Java application data
            |
    XOM  (Applicant, Loan, LoanResponse)
            |
    BOM  + vocabulary
            |
    Business rules + decision tables
            |
    Ruleflow -> rule execution
            |
    Decision (eligible / not eligible, with reasons)

## Environment

- IBM ODM 8.12 (Rule Designer, Decision Server)
- Java 17
- Maven 3.9
- Postman for REST testing

## Notes

Topic-by-topic learning notes are in the notes/ folder.

## Author

Learning log, 2026.`,
      note: "The status table is the single most valuable thing here. A reader sees at a glance what exists, what is in progress, and the shape of the whole plan. Update it as you go — a stale status table is worse than none."
    },
    quiz: {
      kind: "choose",
      prompt: "Why does your roadmap insist on starting the repository at POC-01 rather than after all five?",
      options: [
        "GitHub requires it",
        "Because the commit history and contemporaneous notes record how you learned — and details are lost if reconstructed later",
        "To back up the files",
        "Because rule projects cannot be added retrospectively"
      ],
      answer: 1,
      explain: "The commit history is itself evidence of a learning progression, and notes written while a problem is fresh are accurate in a way reconstructed ones never are. Backup is a side benefit, not the reason."
    },
    mistake: {
      title: "Committing credentials or a whole Eclipse workspace",
      symptom: "A repository containing a Decision Server password, or 400 files of .metadata that nobody can navigate.",
      cause: "No .gitignore, and git add . run in the workspace root.",
      fix: "Create .gitignore before the first commit. Keep the Git repository separate from the Eclipse workspace directory, and export or copy rule projects into it deliberately. If a credential is ever committed, rotate it immediately — deleting the file does not remove it from the history."
    }
  },

  /* ---------------------------------------------------------------- 6.2 */
  {
    id: "p6-t2",
    title: "Git essentials — the commands you will actually use",
    minutes: 12,
    tag: "Tooling",
    intro: `You do not need to be a Git expert. You need about eight commands and one mental model.

**The mental model:** your work lives in three places. The **working directory** is your files as they are now. The **staging area** is the set of changes you have marked for the next commit. The **repository** is the permanent history of commits. \`git add\` moves changes from the first to the second; \`git commit\` moves them from the second to the third; \`git push\` copies the third to GitHub.

That is it. Almost everything else is a variation.`,
    jargon: [
      { term: "Working directory", plain: "Your files as they currently are on disk." },
      { term: "Staging area / index", plain: "Changes marked to go into the next commit." },
      { term: "Commit", plain: "A permanent snapshot with a message." },
      { term: "Branch", plain: "A parallel line of work." },
      { term: "Remote / origin", plain: "The copy on GitHub." },
      { term: "Push / pull", plain: "Send commits to GitHub / fetch them from it." }
    ],
    sections: [
      {
        title: "The eight commands",
        open: true,
        body: `\`\`\`
git status                       # what has changed? Run this constantly.
git add poc-01-basic-rules/      # stage specific things (better than 'git add .')
git commit -m "message"          # save a snapshot
git push                         # send it to GitHub
git pull                         # get changes from GitHub
git log --oneline -10            # last ten commits
git diff                         # what changed but is not staged
git checkout -b feature-name     # create and switch to a branch
\`\`\`

\`git status\` before every commit and \`git log --oneline\` when you are lost will handle most situations. Prefer \`git add <path>\` over \`git add .\` — it is how you avoid accidentally committing something you did not mean to.`
      },
      {
        title: "Writing commit messages that are worth reading",
        open: true,
        body: `A commit message answers "what changed and why", in one line.

**Weak:**
\`\`\`
update
fixed stuff
poc1
asdf
\`\`\`

**Useful:**
\`\`\`
POC-01: add decision table for credit-score pricing bands
POC-01: fix salary threshold - policy says 30000, rule had 25000
POC-02: split eligibility and pricing into separate rule tasks
POC-04: document the ClassNotFoundException fix (managed XOM)
notes: add ruleflow vs priority comparison
\`\`\`

Prefixing with the POC number costs four characters and makes \`git log\` readable as a project history. That log is a genuine artefact you can show — it demonstrates a working style, not just an outcome.`
      },
      {
        title: "Branches, and whether you need them",
        open: false,
        body: `For solo learning, committing straight to \`main\` is perfectly fine and simpler.

Use a branch when you want to try something that might not work:

\`\`\`
git checkout -b try-scorecard
# ... experiment ...
git checkout main            # abandon it, main is untouched
# or:
git merge try-scorecard      # keep it
\`\`\`

It is also worth doing once deliberately, so that you have used branches and pull requests before a job requires it. Make POC-03 a branch, open a pull request against your own repository, review your own diff, and merge it. Twenty minutes, and it removes any first-day awkwardness.`
      }
    ],
    diagram: {
      caption: "The three places your work lives",
      kind: "flow",
      dir: "right",
      nodes: [
        { label: "Working directory", sub: "your files right now", tone: "a" },
        { label: "git add", sub: "stage the changes", tone: "b" },
        { label: "Staging area", sub: "marked for the next commit", tone: "b" },
        { label: "git commit", sub: "save a snapshot", tone: "c" },
        { label: "Local repository", sub: "your commit history", tone: "c" },
        { label: "git push → GitHub", sub: "shared and backed up", tone: "ok" }
      ]
    },
    example: {
      caption: "A realistic session — from empty folder to first pushed POC",
      lang: "bash",
      code: `# ---- one-time setup ----
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"

mkdir ibm-odm-learning && cd ibm-odm-learning
git init
git branch -M main

# create the .gitignore FIRST, before anything else exists
printf 'target/\\nbin/\\n.metadata/\\n.settings/\\n*.class\\n*.jar\\nsecrets.*\\n' > .gitignore
git add .gitignore
git commit -m "chore: add gitignore before anything else"

# scaffold the whole plan up front
mkdir -p poc-01-basic-rules poc-02-ruleflow poc-03-collections \\
         poc-04-decision-server poc-05-java-rest-integration notes
git add .
git commit -m "chore: scaffold five POC folders and notes"

git remote add origin https://github.com/<you>/ibm-odm-learning.git
git push -u origin main


# ---- day 3: POC-01 XOM is written ----
git status
#   modified:   poc-01-basic-rules/README.md
#   new file:   poc-01-basic-rules/loan-eligibility-xom/...

git add poc-01-basic-rules/
git commit -m "POC-01: add XOM classes - Applicant, Loan, LoanResponse"
git push


# ---- day 4: rules written and tested ----
git add poc-01-basic-rules/loan-eligibility-rules/
git commit -m "POC-01: add four eligibility action rules and BOM vocabulary"

git add poc-01-basic-rules/test-data/
git commit -m "POC-01: add six test scenarios including boundary cases"
git push


# ---- day 5: found and fixed a bug ----
git add poc-01-basic-rules/loan-eligibility-rules/rules/
git commit -m "POC-01: fix approval rule - was relying on firing order

The approve rule tested 'reason is null', which only worked because
it happened to run last. Rewrote it to state its own three conditions
so the result is independent of execution order."
git push


# ---- review your own history ----
git log --oneline -6
#   a1b2c3d POC-01: fix approval rule - was relying on firing order
#   e4f5g6h POC-01: add six test scenarios including boundary cases
#   i7j8k9l POC-01: add four eligibility action rules and BOM vocabulary
#   m0n1o2p POC-01: add XOM classes - Applicant, Loan, LoanResponse
#   q3r4s5t chore: scaffold five POC folders and notes
#   u6v7w8x chore: add gitignore before anything else`,
      note: "The day-5 commit has a body explaining the reasoning, not just the change. That commit alone tells a reader you understood a subtle ordering problem and fixed it properly. Write one of those whenever you fix something you had to think about."
    },
    quiz: {
      kind: "choose",
      prompt: "You accidentally committed a file containing your Decision Server password. What is the correct response?",
      options: [
        "Delete the file and commit again — the history will be fine",
        "Rotate the password immediately, then remove the file and add it to .gitignore",
        "Make the repository private",
        "Nothing, if the repository is private"
      ],
      answer: 1,
      explain: "Deleting a file in a later commit does not remove it from history — anyone can retrieve it from any earlier commit. Treat the credential as compromised: change it first, then clean up. Making the repo private helps but does not undo the exposure if it was ever public."
    },
    mistake: {
      title: "One enormous commit at the end of each POC",
      symptom: "A history of five commits, each called 'poc-03 done', each touching sixty files.",
      cause: "Committing only when something is finished, rather than at each meaningful step.",
      fix: "Commit when you complete a thought: the XOM compiles, the rules are written, the tests pass, the bug is fixed. Four small commits tell a story; one large one records only an outcome. It also makes it far easier to find what broke when something stops working."
    }
  },

  /* ---------------------------------------------------------------- 6.3 */
  {
    id: "p6-t3",
    title: "The POC README template",
    minutes: 12,
    tag: "Documentation ★",
    intro: `Your roadmap specifies exactly what each POC should document:

> Problem · Technology · Input · Business Rules · Expected Output · What I learned

That is a good template and this topic turns it into something you can copy. Two additions are worth making: **How to run it** (so a reader — or you in six months — can actually reproduce it) and **What went wrong** (the failures are the most interesting part and the most useful in an interview).

Write the README *as you build*, not after. The "what went wrong" section in particular is worthless if written from memory a month later, and priceless if written the afternoon you fixed the thing.`,
    jargon: [
      { term: "README", plain: "The markdown file GitHub renders as a folder's front page." },
      { term: "Markdown", plain: "Plain-text formatting: # for headings, ** for bold, - for lists." },
      { term: "Reproducible", plain: "Someone else can follow your instructions and get the same result." }
    ],
    sections: [
      {
        title: "The eight sections",
        open: true,
        body: `1. **Problem** — the business situation, in two or three sentences. No ODM jargon.
2. **Technology** — versions of everything. ODM 8.12, Java 17, Maven 3.9.
3. **Input** — the data the decision service receives, with an example.
4. **Business rules** — the policy in plain language, then how it is implemented.
5. **Expected output** — the decision, with worked examples including edge cases.
6. **How to run it** — the steps, precisely enough to be followed.
7. **What went wrong** — the failures and their causes.
8. **What I learned** — three to five specific things.

Section 8 should be specific. "I learned about BOM" says nothing. "I learned that a rule iterating a null collection does not fire and does not error, which is why XOM list fields must be initialised at declaration" says you understood something.`
      },
      {
        title: "Why 'what went wrong' is the best section",
        open: true,
        body: `Anyone can follow a tutorial to a working result. What distinguishes you is having hit a real failure, diagnosed it and understood the cause.

An interviewer reading *"deployment succeeded but execution threw ClassNotFoundException; the XOM jar was not deployed with the ruleset because Rule Designer reads it from the workspace while the server needs it as a managed resource"* learns three things instantly: you have deployed something real, you can debug, and you understand the design-time/run-time distinction.

None of that is visible in a README that only records success.`
      }
    ],
    diagram: {
      caption: "One README, eight sections, written as you go",
      kind: "layers",
      layers: [
        { label: "Problem · Technology", sub: "context — what and with what", tone: "a" },
        { label: "Input · Business rules · Expected output", sub: "the specification", tone: "b" },
        { label: "How to run it", sub: "reproducibility", tone: "b" },
        { label: "What went wrong", sub: "the section that proves you did it for real", tone: "warn" },
        { label: "What I learned", sub: "specific, not general", tone: "ok" }
      ]
    },
    example: {
      caption: "A complete POC README you can copy and adapt",
      lang: "markdown",
      code: `# POC-01 - Loan Eligibility with Basic Rules

## Problem

Sunrise Bank pre-screens personal loan applications manually. A loan
officer checks four things on every application, which is slow and
inconsistent. The thresholds are reviewed every quarter, so hardcoding
them into the banking application means a developer and a release for
every policy change.

This POC automates the pre-screening as an ODM decision service the
business can change without a code release.

## Technology

| Component | Version |
|---|---|
| IBM ODM Rule Designer | 8.12 |
| Java | 17 (Temurin) |
| Maven | 3.9.6 |
| Execution | Local run configuration (no server yet - that is POC-04) |

## Input

| Field | Type | Example | Notes |
|---|---|---|---|
| name | String | "Asha Kulkarni" | not used in rules |
| age | int | 28 | years |
| annualSalary | double | 45000.0 | in local currency |
| creditScore | int | 742 | range 300-900 |
| hasExistingLoan | boolean | false | any active loan |

    {
      "applicant": {
        "name": "Asha Kulkarni",
        "age": 28,
        "annualSalary": 45000.0,
        "creditScore": 742,
        "hasExistingLoan": false
      }
    }

## Business rules

Policy as supplied by Lending (v3, effective Q3):

| # | Rule | Reason returned |
|---|---|---|
| R1 | Age must be at least 21 | "Applicant must be at least 21" |
| R2 | Annual salary must be at least 30,000 | "Minimum annual salary is 30,000" |
| R3 | Credit score must be at least 700 | "Minimum credit score is 700" |
| R4 | If R1-R3 all pass, the applicant is eligible | "Meets all pre-screening criteria" |

Implemented as four action rules in rules/eligibility/. Each failure
rule appends to response.reasons rather than overwriting a single
field, so an applicant failing twice sees both reasons.

## Expected output

| Case | age | salary | score | eligible | reasons |
|---|---|---|---|---|---|
| happy path | 28 | 45000 | 742 | true | Meets all criteria |
| under age | 19 | 52000 | 710 | false | Must be at least 21 |
| low salary | 30 | 22000 | 780 | false | Minimum salary 30,000 |
| low score | 35 | 60000 | 640 | false | Minimum credit score 700 |
| boundary, exact | 21 | 30000 | 700 | TRUE | Meets all criteria |
| boundary, under | 20 | 29999 | 699 | false | all three reasons |
| all fail | 18 | 12000 | 500 | false | all three reasons |

Boundary cases matter: "at least 21" means 21 passes. An early version
used "is more than 21" and rejected 21-year-olds.

## How to run it

1. Import both projects into Rule Designer:
   loan-eligibility-xom (Java) and loan-eligibility-rules (rule project)
2. Confirm the rule project references the XOM project
   (Properties -> Java XOM path)
3. Run As -> Decision Run -> select 'happy-path'
4. Enable tracing to see which rules fired

Saved run configurations are in test-data/scenarios.md.

## What went wrong

**1. The approval rule depended on firing order.**
Originally written as "if the reason of the response is null then
eligible := true". It worked only because it happened to execute last.
Adding a fourth rejection rule later would have broken it silently.
Rewrote it to state all three passing conditions explicitly.

**2. Two rejection rules overwrote each other's reason.**
An applicant failing on both salary and credit score showed only one
reason, and which one was not predictable. Changed response.reason
(String) to response.reasons (List<String>) and used 'add' instead
of 'set'.

**3. Boundary off-by-one.**
Used "is more than 21" where the policy said "at least 21", so
21-year-olds were rejected. Found by a deliberate boundary test case,
not by the happy path.

**4. Verbalization read badly.**
ODM generated "the has existing loan of the applicant is true". Edited
the .voc to "{this} has an existing loan" so the rule reads as a
sentence.

## What I learned

- ODM's business vocabulary is generated from JavaBean getters, so Java
  naming directly determines how readable the rules are to a business
  user.
- A rule whose correctness depends on execution order is a latent bug.
  Either state the full condition, or make the ordering explicit in a
  ruleflow - never rely on what happens to run last.
- Collecting reasons in a list instead of overwriting a string field
  removes a whole class of ordering problems, and gives the business
  better information.
- Boundary test cases (exactly 21, exactly 700) found two real bugs that
  happy-path testing could not have.

## Next

POC-02 adds a ruleflow so the execution order is explicit and visible
rather than implied by rule priorities.`,
      note: "Notice that 'What went wrong' is the longest section, and that every learning point is tied to a specific incident. That is what makes a README worth reading — and it is written from notes taken the day each thing happened, not reconstructed later."
    },
    quiz: {
      kind: "choose",
      prompt: "Which “What I learned” entry is most valuable in a portfolio README?",
      options: [
        "I learned about BOM and XOM",
        "I learned that a rule iterating a null collection does not fire and does not error, which is why XOM list fields must be initialised at declaration",
        "I learned ODM is a powerful tool",
        "I completed the POC successfully"
      ],
      answer: 1,
      explain: "It is specific, it explains a mechanism, and it states a practice that follows from it. A reader immediately knows you hit the problem for real and understood why it happened. The others could be written by someone who read a brochure."
    },
    mistake: {
      title: "Writing the README after the POC is finished",
      symptom: "A README recording only that everything worked, with a vague 'learned a lot about ODM' at the end.",
      cause: "Documentation treated as a final step. By then the failures are forgotten and only the outcome remains.",
      fix: "Keep the README open while you work and add to 'What went wrong' the moment something goes wrong — one line is enough at the time, expand it later. This costs almost nothing during the work and produces the section that most distinguishes your portfolio."
    }
  },

  /* ---------------------------------------------------------------- 6.4 */
  {
    id: "p6-t4",
    title: "Reading IBM documentation without drowning",
    minutes: 10,
    tag: "Skill",
    intro: `IBM's ODM documentation is comprehensive, which is a polite way of saying enormous. It is organised by product structure rather than by task, so searching for "how do I deploy a ruleset" can return a dozen pages, none of which is quite the one you need.

Three habits make it manageable.

**Know your version.** ODM documentation is versioned and things move between releases. 8.10, 8.11 and 8.12 differ in real ways. Find out which version your team uses, bookmark that version's documentation, and stop reading anything else.

**Search for the exact term, not the question.** "How do I make rules run in order" returns noise. "ruleflow rule task ordering" returns the page.

**Read the concept page before the task page.** IBM separates "what this is" from "how to do it". Skipping the concept page is why the task page feels like it assumes knowledge you do not have — it does.`,
    jargon: [
      { term: "IBM Documentation", plain: "IBM's official product documentation site, formerly Knowledge Center." },
      { term: "Redbook", plain: "A long-form IBM technical guide, often more practical than the reference docs." },
      { term: "APAR", plain: "A recorded IBM product defect, with the fix pack that resolves it." },
      { term: "Fix pack", plain: "A cumulative patch release, e.g. 8.12.0.1." }
    ],
    sections: [
      {
        title: "Where to look, in order",
        open: true,
        body: `1. **IBM Documentation for your exact version** — the authoritative reference. Start with concept pages.
2. **IBM Redbooks** — longer, scenario-driven, and much better for "how do the pieces fit together". Often the best material for architecture questions.
3. **IBM Support / APARs** — when something behaves oddly, search the error message here. A known defect saves days.
4. **Stack Overflow** — thin for ODM specifically. Useful for the Java and REST parts.
5. **Your own team's wiki and existing rule projects** — usually the fastest answer to "how do we do it here", which is a different question from "how does ODM do it".

Source 5 is undervalued. Team conventions are rarely documented publicly, and reading one existing project teaches you more about local practice than any manual.`
      },
      {
        title: "Turning documentation into notes",
        open: false,
        body: `Reading without writing does not stick. Keep a \`notes/\` folder in your repository, one file per topic area, and write in your own words.

\`\`\`
notes/
├── bom-and-xom.md
├── ruleflow-vs-priority.md
├── decision-table-gotchas.md
├── deployment-checklist.md
└── questions-for-trainer.md
\`\`\`

Two rules for the notes:
- **Your own words.** Copy-pasted documentation is not a note; it is a bookmark.
- **Include the version and a link.** Six months later you will want to know which version you were reading.

\`questions-for-trainer.md\` deserves special mention — keep a running list and ask them in batches. It is a much better use of someone's time than five separate interruptions, and it makes you look organised.`
      }
    ],
    diagram: {
      caption: "Where to look, in the order that wastes least time",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "Your team's existing projects", sub: "how we actually do it here", tone: "ok" },
        { label: "IBM Documentation — your version", sub: "concept page, then task page", tone: "b" },
        { label: "IBM Redbooks", sub: "how the pieces fit together", tone: "b" },
        { label: "IBM Support / APARs", sub: "search the exact error message", tone: "a" },
        { label: "Ask your trainer", sub: "batched, from your written list", tone: "c" }
      ]
    },
    example: {
      caption: "A worked example of finding one specific answer",
      lang: "text",
      code: `QUESTION
  "How do I make one rule always run before another?"

BAD SEARCH
  "odm make rule run first"
  -> blog posts about other rule engines, a 2014 forum thread,
     documentation for version 7.5

GOOD SEARCH
  site:ibm.com odm 8.12 ruleflow "rule task" ordering priority

BETTER STILL - think in product vocabulary first
  The concepts involved are: rule task, ruleflow, rule ordering,
  rule priority. Search for the CONCEPT, then read its task page.

READING ORDER
  1. Concept: "Ruleflows"           -> what they are and why
  2. Concept: "Rule tasks"          -> what a task selects and how it orders
  3. Task:    "Creating a ruleflow" -> the click-by-click
  4. Reference: "Rule properties"   -> where priority actually lives

  Reading 3 before 1 and 2 is why the task page felt impenetrable.


THE NOTE THAT COMES OUT OF IT
  # notes/ruleflow-vs-priority.md

  Two ways to control execution order (ODM 8.12):

  1. PRIORITY - a numeric property on each rule, higher fires first
     within a rule task. Works, but is invisible: you cannot see the
     order without opening every rule.

  2. RULEFLOW - rules grouped into packages, packages run as ordered
     rule tasks. Visible as a diagram, reviewable, and lets you skip
     whole stages with a branch.

  Team practice seems to be: ruleflow for normal sequencing, priority
  only for a genuine override rule.

  Source: IBM Docs 8.12, "Ruleflows" and "Rule tasks" concept pages.
  Read 2026-09-10.

  OPEN QUESTION for trainer: do we set priorities at all in our
  projects, or is everything sequenced by ruleflow?
  -> added to notes/questions-for-trainer.md`,
      note: "The 'open question' at the end is the habit worth copying. Documentation tells you what the product can do; only your team can tell you what your team does. Capturing that gap as a question, in writing, is how you avoid guessing."
    },
    quiz: {
      kind: "choose",
      prompt: "You are reading an IBM task page and it assumes concepts you do not have. What is the most likely cause?",
      options: [
        "The documentation is badly written",
        "You skipped the concept page — IBM deliberately separates 'what this is' from 'how to do it'",
        "You are reading the wrong product",
        "You need a Redbook instead"
      ],
      answer: 1,
      explain: "IBM's structure is concept → task → reference. Task pages are written assuming you read the concept page, so jumping straight to the steps reliably feels like missing context — because it is. Read the concept page first; it is usually short."
    },
    mistake: {
      title: "Reading documentation for the wrong ODM version",
      symptom: "Following instructions that reference a menu, property or API that does not exist in your installation.",
      cause: "A search result landed on an older or newer version's page. IBM keeps every version's documentation online and the URLs look similar.",
      fix: "Find out your exact version (Help → About in Rule Designer) and bookmark that version's documentation root. Check the version selector on every page you land on. When you save something in your notes, write the version next to it."
    }
  },

  /* ---------------------------------------------------------------- 6.5 */
  {
    id: "p6-t5",
    title: "Turning five POCs into one story",
    minutes: 12,
    tag: "Interview ★",
    intro: `Your roadmap makes the key point here:

> *"I started with a basic decision table, then introduced collections, then deployed it, and finally exposed it through REST."*
>
> *That tells a much better story than listing five certifications.*

Exactly right. A list of five POCs says you did five exercises. A **progression** says you built understanding — each POC added one capability because the previous one made the next one necessary.

This topic is about being able to tell that story in ninety seconds, out loud, without notes. It is the single highest-return thing on your whole roadmap, because it is the first question in almost every interview: *"tell me about something you've built."*`,
    jargon: [
      { term: "Narrative", plain: "The connecting thread that makes separate pieces of work into one account." },
      { term: "STAR", plain: "Situation, Task, Action, Result — a structure for answering experience questions." },
      { term: "Elevator pitch", plain: "A 30–90 second summary you can deliver from memory." }
    ],
    sections: [
      {
        title: "The ninety-second version",
        open: true,
        body: `Practise this out loud until it is comfortable:

> "I learned ODM by building one decision service and growing it across five POCs.
>
> I started with loan pre-screening for a fictional bank — a Java object model, a BOM with proper business vocabulary, and four eligibility rules. The first thing that went wrong taught me the most: my approval rule only worked because it happened to fire last, which is a latent bug.
>
> So POC-02 introduced a ruleflow, so execution order was explicit and visible rather than implied. POC-03 added collections — the applicant now has a list of existing loans, and the rules aggregate total debt and compute a debt-to-income ratio. That is also where I learned that a rule over a null collection silently does not fire.
>
> POC-04 deployed it: RuleApp, ruleset versioning, and my first ClassNotFoundException, which taught me that the XOM jar has to reach the server separately from the ruleset. POC-05 exposed it as a REST decision service — a Postman collection with boundary tests, and a Java client with proper timeout and status handling.
>
> The thing that stuck with me most is that ODM's value is not the engine, it is the separation. A business analyst can change a threshold in Decision Center and deploy a new minor version, and every caller picks it up with no code change at all."

Notice: it is one story with five chapters, it includes failures, and it ends on *why the technology matters* rather than what it does.`
      },
      {
        title: "The questions that follow, and what they are testing",
        open: true,
        body: `| Question | What they are really asking |
|---|---|
| "Walk me through the architecture." | Can you draw the XOM → BOM → vocabulary → rules → decision flow? |
| "When would you *not* use a rules engine?" | Do you understand the tool or just like it? |
| "What is the difference between BOM and XOM?" | The most common ODM interview question. Know it cold. |
| "How do you test rules?" | Run configurations, traces, DVS scenarios, boundary cases. |
| "A rule isn't firing. What do you do?" | Your Phase 7 debugging process. |
| "How are rules version-controlled?" | Decision Center snapshots + Git for the text artefacts. |
| "Tell me about something that went wrong." | Have you done it for real? |

That last one is where your READMEs pay off. You have four specific answers per POC, written down at the time.`
      },
      {
        title: "Preparing without over-rehearsing",
        open: false,
        body: `Rehearse the *structure*, not the wording. A memorised paragraph sounds memorised.

Three things to have genuinely ready:
1. **The one-sentence version.** "I built a loan eligibility decision service and grew it from basic rules to a deployed REST service across five POCs."
2. **The ninety-second version** above.
3. **The whiteboard version.** Be able to draw the flow diagram from Phase 2 topic 2.3 while talking. Practise it on paper until the boxes come out in the right order without thinking.

Then be ready to go deeper on any chapter. The interviewer chooses which one — that is why you build the whole story rather than polishing one part.`
      }
    ],
    diagram: {
      caption: "Five POCs as one progression, each answering the previous one's limitation",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "POC-01 — basic rules", sub: "BOM, XOM, vocabulary, four rules", tone: "a" },
        { label: "…but execution order was implicit", sub: "so →", tone: "warn" },
        { label: "POC-02 — ruleflow", sub: "explicit, visible ordering", tone: "a" },
        { label: "…but only one object at a time", sub: "so →", tone: "warn" },
        { label: "POC-03 — collections", sub: "list of loans, aggregates, ratios", tone: "b" },
        { label: "…but it only ran on my laptop", sub: "so →", tone: "warn" },
        { label: "POC-04 — deployment", sub: "RuleApp, versioning, Decision Server", tone: "b" },
        { label: "…but nothing could call it", sub: "so →", tone: "warn" },
        { label: "POC-05 — REST + Java client", sub: "a real decision service", tone: "ok" }
      ]
    },
    example: {
      caption: "Three interview answers, prepared from your own READMEs",
      lang: "text",
      code: `Q: "What is the difference between the BOM and the XOM?"

A: "The XOM is the execution object model - the real Java classes the
   engine runs against. When a rule reads a credit score, at run time
   it is calling getCreditScore() on an actual object.

   The BOM is the business object model: a business-facing view of that
   same structure. It is where I rename things, hide technical fields
   and write the verbalizations, so a business user sees 'the credit
   score of the applicant' instead of a method name. Each BOM member
   maps back to Java through the B2X mapping.

   The practical value is insulation. In POC-03 I renamed a field in
   the Java model and only had to repoint one B2X mapping - none of the
   rules using it changed. Without that layer it would have been an
   edit to every rule that referenced it."

   [Concrete, correct, and grounded in something you actually did.]


Q: "When would you NOT use a rules engine?"

A: "When the logic does not change and nobody outside the development
   team needs to read it. If it is three if-statements in an internal
   tool, a rule engine adds a deployment artefact, a runtime and a
   governance process for no benefit.

   I would also keep data transformation and plumbing out of rules
   entirely. In my POCs the ruleset receives clean data, makes a
   decision and returns it - parsing, formatting and fetching stay in
   Java. Rules that are not expressing business policy tend to make the
   ruleflow unreadable."

   [Shows judgement, not enthusiasm. Interviewers notice.]


Q: "Tell me about something that went wrong."

A: "In POC-04, my first deployment. It reported success, and the first
   execution threw ClassNotFoundException on my Applicant class.

   It took me a while because 'deployment succeeded' had made me look
   at the rules. The cause was that design time and run time load the
   XOM from different places - Rule Designer reads it from the Eclipse
   workspace, but the Decision Server needs it as a managed resource or
   on its classpath. I redeployed including the managed XOM and it
   worked.

   What I took from it: deployment success only means the archive
   installed. Now I always run the console test facility straight after
   deploying, before anything else calls it. It takes twenty seconds and
   it tells you whether the thing can actually execute."

   [A real failure, a correct diagnosis, and a practice that changed.]`,
      note: "Every one of these answers came directly out of a README section you wrote at the time. That is the whole argument for documenting as you go — the interview preparation is a by-product of having worked properly."
    },
    quiz: {
      kind: "choose",
      prompt: "Which framing of your POC work is strongest in an interview?",
      options: [
        "I completed five POCs covering rules, ruleflows, collections, deployment and REST",
        "I built one decision service and grew it across five POCs — each one solved a limitation the previous one exposed",
        "I have hands-on experience with IBM ODM",
        "I finished the full ODM training curriculum"
      ],
      answer: 1,
      explain: "The progression framing shows understanding rather than coverage: each step happened for a reason you can explain. It also invites the interviewer to ask about any chapter, which is exactly what you have prepared for. The others are claims; this one is a story with evidence behind it."
    },
    mistake: {
      title: "Five POCs with no connecting thread",
      symptom: "Five unrelated examples — a loan check, an insurance quote, a shipping calculator — and no way to explain why one followed another.",
      cause: "Each POC chosen for variety rather than progression, usually by following different tutorials.",
      fix: "Use one domain throughout, as this site does with Sunrise Bank. The progression is then obvious and each POC's motivation is 'the previous one could not do X'. If you have already built unrelated POCs, you can still retro-fit the thread: order them by capability and explain what each added."
    }
  }

  ],

  quiz: [
    {
      q: "Why start the GitHub repository at POC-01 rather than after all five?",
      options: ["GitHub requires it", "The commit history and notes written at the time record how you learned; reconstructed detail is lost or wrong", "It is faster", "Rule projects cannot be added later"],
      answer: 1,
      explain: "A repository built as you go is evidence of a progression. One assembled at the end always looks assembled at the end."
    },
    {
      q: "Which commit message is most useful six months later?",
      options: ["update", "POC-01: fix approval rule - was relying on firing order", "poc1 done", "changes"],
      answer: 1,
      explain: "It names the POC, the change and the reason. A log of messages like this reads as a project history."
    },
    {
      q: "You committed a Decision Server password. What must you do first?",
      options: ["Delete the file and commit", "Rotate the password — the credential is in the history and cannot be un-published", "Make the repo private", "Nothing if the repo is private"],
      answer: 1,
      explain: "Deleting a file in a later commit leaves it retrievable from earlier ones. Treat it as compromised and change it, then clean up."
    },
    {
      q: "Which README section most distinguishes a real portfolio from a tutorial follow-along?",
      options: ["Technology versions", "What went wrong", "Expected output", "How to run it"],
      answer: 1,
      explain: "Failures and their diagnoses prove you did the work for real and can debug. Success alone is what a tutorial produces."
    },
    {
      q: "An IBM task page assumes knowledge you do not have. Most likely cause?",
      options: ["Bad documentation", "You skipped the concept page that precedes it in IBM's concept → task → reference structure", "Wrong product", "You need a Redbook"],
      answer: 1,
      explain: "Task pages are written assuming the concept page was read. Reading them in order is usually the whole fix."
    },
    {
      q: "What makes the five-POC narrative strong in an interview?",
      options: ["It covers many topics", "Each POC solved a limitation the previous one exposed, so the progression shows understanding rather than coverage", "It took a long time", "It uses IBM products"],
      answer: 1,
      explain: "Progression demonstrates reasoning. Coverage only demonstrates attendance."
    },
    {
      q: "Where should decision-service credentials live in your repository?",
      options: ["In application.properties, committed", "Nowhere — in environment variables or a gitignored local file, with the README explaining the setup", "In the README so it is easy to find", "Base64-encoded in the code"],
      answer: 1,
      explain: "Never in the repository, and base64 is encoding, not encryption. Document how to supply them instead."
    },
    {
      q: "What is the best use of a questions-for-trainer.md file?",
      options: ["Recording questions you already answered", "Keeping a running list to ask in batches, especially about team conventions the documentation cannot tell you", "Tracking bugs", "Replacing the README"],
      answer: 1,
      explain: "Documentation tells you what ODM does; only your team can tell you what your team does. Batching the questions respects their time and makes you look organised."
    }
  ]
};
