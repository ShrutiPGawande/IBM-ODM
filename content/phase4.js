/* =========================================================================
   PHASE 4 — Publishing and Decision Server
   Deliberately placed AFTER you have one complete, working rule project.
   ========================================================================= */

window.PHASE_4 = {
  id: "phase4",
  number: 4,
  title: "Publishing & Decision Server",
  subtitle: "From a project on your laptop to a ruleset running on a server",
  goal: "Understand the full lifecycle — build, test, package, publish, deploy, execute — and know exactly which tools your team uses for each step.",
  badge: { name: "Deployer", icon: "🚀" },
  topics: [

  /* ---------------------------------------------------------------- 4.1 */
  {
    id: "p4-t1",
    title: "The lifecycle — build, test, execute, then deploy",
    minutes: 10,
    tag: "Orientation",
    intro: `Your roadmap is explicit about this and it is good advice: **do not spend time on deployment until you have a complete rule project that works locally.**

There is a reason. Deployment problems and rule-logic problems look identical from the outside — the answer is wrong, or there is no answer. If you have never seen your ruleset produce a correct decision on your own machine, you cannot tell which kind of problem you are looking at, and you will burn days.

So the order is:

\`\`\`
Create rule  →  Test rule  →  Execute rule  →  Get expected result
\`\`\`

*Then and only then:*

\`\`\`
Publish  →  Deploy  →  Decision Server / RES  →  Execute deployed ruleset
\`\`\`

Everything in this phase assumes POC-01 already works in Rule Designer. If it does not, go back — this phase will make more sense and take a quarter of the time.`,
    jargon: [
      { term: "Publish", plain: "Push a rule project from Rule Designer into Decision Center." },
      { term: "Deploy", plain: "Package a ruleset and install it onto a Decision Server so applications can call it." },
      { term: "Environment", plain: "A distinct installation — DEV, TEST, UAT, PROD — each with its own server." },
      { term: "Promotion", plain: "Moving a tested artefact from one environment to the next." }
    ],
    sections: [
      {
        title: "The two halves, and why they are separate",
        open: true,
        body: `**Authoring lifecycle** (Rule Designer ↔ Decision Center)
Write rules, review them, get business sign-off, snapshot a version. Concerned with *is this the right policy?*

**Deployment lifecycle** (Decision Center → Decision Server)
Package the approved rules, install them onto a runtime, point applications at them. Concerned with *is the right version running in the right place?*

They are separate because they have different owners and different risks. A wrong rule is a business problem; a wrong deployment is an operations problem. Conflating them is how you get "we fixed the rule three weeks ago but production still has the old one".`
      },
      {
        title: "Environments",
        open: false,
        body: `A typical setup:

| Environment | Purpose | Who deploys |
|---|---|---|
| DEV | Your own testing | You, constantly |
| TEST / SIT | Integration with calling systems | Build pipeline |
| UAT | Business validation | Release process |
| PROD | Live | Controlled release only |

The same ruleset archive should travel unchanged through all of them. If you rebuild for each environment you can no longer claim that what passed UAT is what runs in PROD — which is a question an auditor will eventually ask.

Two things you must ask your team about early: how many environments there are, and how a ruleset gets from one to the next.`
      }
    ],
    diagram: {
      caption: "The full lifecycle — note where the gate sits",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "1. Create rules", sub: "Rule Designer", tone: "a" },
        { label: "2. Test locally", sub: "run configuration + trace", tone: "a" },
        { label: "3. Execute and verify", sub: "expected result on your machine", tone: "a" },
        { label: "— gate: does it work locally? —", sub: "do not proceed until yes", tone: "warn" },
        { label: "4. Publish to Decision Center", sub: "business review, snapshot", tone: "b" },
        { label: "5. Build the RuleApp / ruleset archive", sub: "the deployable package", tone: "b" },
        { label: "6. Deploy to Decision Server (RES)", sub: "install onto the runtime", tone: "c" },
        { label: "7. Execute the deployed ruleset", sub: "REST or Java call → decision", tone: "ok" }
      ]
    },
    example: {
      caption: "A realistic first deployment run, with the timings that surprise people",
      lang: "text",
      code: `MONDAY   — local
  09:00  POC-01 rules written
  11:00  run configuration: happy path passes
  11:30  boundary cases pass, trace looks right
         >>> gate passed: it works locally <<<

TUESDAY  — first deployment attempt
  09:00  publish project to Decision Center            .... 10 min
  09:15  create RuleApp, add ruleset, version 1.0      .... 10 min
  09:30  deploy to DEV Decision Server                 .... 5 min
  09:35  first execution                               .... FAILS
         java.lang.ClassNotFoundException:
             com.sunrise.model.Applicant
  10:30  cause: the XOM jar was never deployed to the server.
         Design time read it from the Eclipse workspace;
         the server has no idea it exists.
  11:00  add the XOM jar as a managed resource, redeploy .. WORKS

WEDNESDAY — the second classic
  14:00  changed a threshold, redeployed
  14:05  old behaviour still returned
  14:40  cause: the application was calling
             /MyRuleApp/1.0/loan/1.0
         and the new rules went to loan/1.1.
         Both versions are live on the server simultaneously.
  14:45  point the caller at the right version.  WORKS

LESSON
  Neither failure was a rule problem. Both were deployment problems.
  Because the rules had already been proven locally on Monday, both
  were diagnosed in under an hour instead of being confused with logic bugs.`,
      note: "Those two failures — missing XOM jar, and calling the wrong ruleset version — account for a very large share of first-deployment problems. Expect both. Neither means you did anything wrong."
    },
    quiz: {
      kind: "choose",
      prompt: "Your deployed ruleset returns a decision that contradicts what Rule Designer produced for the same input. What is the FIRST thing to check?",
      options: [
        "Rewrite the rule",
        "Which ruleset version the caller is actually invoking, and which XOM jar the server has loaded",
        "Restart the Decision Server",
        "Change the rule algorithm"
      ],
      answer: 1,
      explain: "Same input, different answer in two places means the two places are not running the same thing. Version and classpath account for the overwhelming majority of these. Confirm what is actually deployed before touching any rule — otherwise you risk 'fixing' rules that were never broken."
    },
    mistake: {
      title: "Learning deployment before the rules work",
      symptom: "Days lost to an unclear failure that turns out to be a rule logic error, discovered only after exhaustively debugging the server configuration.",
      cause: "Deploying a ruleset you have never seen produce a correct answer. Every failure now has two possible causes and no way to distinguish them.",
      fix: "Follow your roadmap's order exactly. Get a green local run with a trace you understand, save that trace, then deploy. When the deployed version disagrees, you have a known-good reference to compare against — and the comparison usually points straight at the cause."
    }
  },

  /* ---------------------------------------------------------------- 4.2 */
  {
    id: "p4-t2",
    title: "RuleApps and ruleset archives",
    minutes: 12,
    tag: "Packaging",
    intro: `You do not deploy a "rule project". You deploy a **RuleApp** containing one or more **rulesets**.

- A **ruleset** is the executable form of your rules: rules, BOM, ruleflow and parameter definitions, compiled and packaged. It is what the engine runs.
- A **RuleApp** is a container holding rulesets. It exists so related decision services can be versioned and deployed together.

Both are versioned, and the version is part of the address applications use to call them:

\`\`\`
/SunriseLoanApp/1.0/loan-eligibility/1.2
   RuleApp name  ver   ruleset name    ver
\`\`\`

That path string is the API contract between your rules and every application that calls them. Understanding how it is formed — and what happens when you change a version number — is most of what Phase 4 is about.`,
    jargon: [
      { term: "RuleApp", plain: "A deployable container holding one or more rulesets, with its own version." },
      { term: "Ruleset", plain: "The compiled, executable package of a rule project." },
      { term: "Ruleset archive", plain: "The .jar file containing the ruleset." },
      { term: "Ruleset path", plain: "The address used to invoke a ruleset: /RuleApp/version/ruleset/version." },
      { term: "Managed XOM", plain: "A XOM jar uploaded to and managed by the Decision Server, rather than on the classpath." },
      { term: "Ruleset property", plain: "A configuration setting on a deployed ruleset, e.g. trace level or debug flags." }
    ],
    sections: [
      {
        title: "Major vs minor versions — the rule that matters",
        open: true,
        body: `Versions are \`major.minor\`, and ODM treats them differently:

- **Increment the minor version** (1.0 → 1.1) and the new version *replaces* the old at the same major path. Callers using \`/loan/1.0\` are transparently routed to the newest 1.x. Use this for a policy change with no interface change.

- **Increment the major version** (1.0 → 2.0) and both live side by side. Callers must explicitly ask for 2.0. Use this when you change ruleset parameters — that is, when you break the contract.

The practical rule: **change the parameters, change the major version.** Anything else and you break every caller with no warning.

Callers can also request \`/loan\` with no version at all, meaning "give me the highest". Convenient in DEV, alarming in PROD — a deployment could silently change production behaviour with no application change. Most teams pin the version explicitly. Ask which your team does.`
      },
      {
        title: "What is actually inside a ruleset archive",
        open: false,
        body: `\`\`\`
loan-eligibility-1.2.jar
├── rules (compiled)
├── the BOM and vocabulary
├── the ruleflow
├── ruleset parameter signatures
├── ruleset properties (trace level, algorithm defaults)
└── optionally, the managed XOM jar
\`\`\`

Two things it may **not** contain: the XOM classes, if your team puts them on the server classpath instead; and any external resources your B2X mappings call out to. Both are classic sources of "works in Designer, fails on the server".`
      },
      {
        title: "Where the XOM lives at run time — two choices",
        open: true,
        body: `**Option A — Managed XOM.** Upload the XOM jar to the Decision Server as a managed resource. It is stored with the ruleset and travels with it.
- Good: version-locked to the ruleset, no server configuration.
- Watch out: you must remember to upload the new jar when the model changes.

**Option B — Classpath XOM.** Put the jar in the application server's shared library path.
- Good: one copy shared by many rulesets.
- Watch out: updating it affects every ruleset at once, and requires a server-side change.

Either is legitimate. What is not acceptable is not knowing which one your project uses — because that determines your entire debugging approach when you see \`ClassNotFoundException\`. Add it to your questions-for-the-trainer list in topic 4.6.`
      }
    ],
    diagram: {
      caption: "From rule project to something a URL can address",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "Rule project", sub: "rules + BOM + ruleflow, in Rule Designer", tone: "a" },
        { label: "Build / compile", sub: "rules compiled, parameters fixed", tone: "a" },
        { label: "Ruleset archive (.jar)", sub: "loan-eligibility 1.2", tone: "b" },
        { label: "RuleApp", sub: "SunriseLoanApp 1.0 — the container", tone: "b" },
        { label: "Deployed to Decision Server", sub: "installed and addressable", tone: "c" },
        { label: "/SunriseLoanApp/1.0/loan-eligibility/1.2", sub: "the ruleset path callers use", tone: "ok" }
      ]
    },
    example: {
      caption: "Version strategy over a year of Sunrise Bank changes",
      lang: "text",
      code: `RULEAPP: SunriseLoanApp

  v1.0
   ├── loan-eligibility 1.0    initial release, Jan
   ├── loan-eligibility 1.1    Apr: salary floor 25000 -> 30000
   │                            (policy change only, same parameters)
   └── loan-eligibility 1.2    Jul: added the risk scorecard
                                (still same parameters -> minor bump)

  v2.0
   └── loan-eligibility 2.0    Oct: response now returns a LIST of reasons
                                instead of a single reason string.
                                PARAMETERS CHANGED -> major bump.
                                v1.x stays deployed for existing callers.


WHAT EACH CALLER SEES

  Mobile app  -> /SunriseLoanApp/1.0/loan-eligibility/1.2
                 pinned. Gets exactly 1.2. Unaffected by the 2.0 release.

  Branch app  -> /SunriseLoanApp/1.0/loan-eligibility/1.0
                 asked for 1.0, but ODM routes minor versions forward,
                 so it actually executes 1.2. It got the April and July
                 policy changes automatically -- which was intended.

  New partner -> /SunriseLoanApp/2.0/loan-eligibility/2.0
                 explicitly on the new contract, reads response.reasons[].

  Anything    -> /SunriseLoanApp/loan-eligibility
                 no version at all: gets the highest available.
                 Works, but means a deployment can change behaviour with
                 no application change. Avoid in production.


THE MISTAKE TO AVOID
  Releasing the October change as 1.3 instead of 2.0.
  Every 1.x caller would suddenly receive a response object whose
  'reason' field no longer exists. Mobile app breaks at 3am, and
  nothing in the application changed -- which makes it very hard to
  diagnose from the application side.`,
      note: "Read the last block twice. The version number is not bookkeeping; it is the promise you make to callers. Minor means 'the answer may change, the shape will not'. Major means 'the shape changed, opt in deliberately'."
    },
    quiz: {
      kind: "choose",
      prompt: "You add a new IN parameter `channel` to the ruleset so rules can vary by sales channel. Existing callers do not send it. What version bump?",
      options: [
        "Minor (1.2 → 1.3) — it's just one new field",
        "Major (1.2 → 2.0) — the parameter signature changed",
        "No bump needed — parameters are not versioned",
        "Bump the RuleApp only"
      ],
      answer: 1,
      explain: "Any change to the ruleset parameter signature is a contract change, so it needs a major version. Existing callers keep working against 1.x while new callers opt in to 2.0. Releasing it as 1.3 would route existing callers to a ruleset expecting a parameter they do not send — which fails at execution, in production, for reasons the calling team cannot see."
    },
    mistake: {
      title: "Deploying the ruleset but not the updated XOM jar",
      symptom: "ClassNotFoundException or NoSuchMethodError on the first execution after a deployment that appeared to succeed.",
      cause: "The ruleset and the XOM are two artefacts. Deploying one does not deploy the other, and the deployment reports success because the ruleset itself installed fine.",
      fix: "Make the XOM jar part of the same deployment step — as a managed XOM travelling with the ruleset, or as an explicit pipeline stage that copies the versioned jar to the server. Then verify: the Decision Server console shows which resources a ruleset has. Look, rather than assuming."
    }
  },

  /* ---------------------------------------------------------------- 4.3 */
  {
    id: "p4-t3",
    title: "Decision Center and publishing",
    minutes: 12,
    tag: "Governance",
    intro: `**Decision Center** is the rule repository plus a web front end for business users. It is where rules live between being authored and being deployed, and it is what makes ODM a governance product rather than just a rules engine.

Three things it gives you that a Git repository of rule files does not:

**Business-readable editing.** Analysts see rules and decision tables in business language, with the vocabulary you built, and can change them without an IDE.

**Governance.** Who changed what, when, and why. Approval workflows. Permissions per rule package. A full history you can query.

**Snapshots and baselines.** A named, frozen point in time you can deploy, compare against, or roll back to.

From Rule Designer you **publish** a project to Decision Center, and **update** back to pick up business changes. Getting that two-way flow right is the main skill here.`,
    jargon: [
      { term: "Decision Center", plain: "The web-based rule repository and governance application." },
      { term: "Publish", plain: "Send a project from Rule Designer to Decision Center." },
      { term: "Update", plain: "Pull changes from Decision Center back into Rule Designer." },
      { term: "Snapshot", plain: "A frozen, named copy of the project at a point in time." },
      { term: "Baseline", plain: "A reference version used for comparison or rollback." },
      { term: "Branch", plain: "A parallel line of rule development, merged later." },
      { term: "Business console", plain: "The main Decision Center interface for business users." }
    ],
    sections: [
      {
        title: "The synchronisation flow — and its one rule",
        open: true,
        body: `\`\`\`
Rule Designer  --- publish --->  Decision Center
Rule Designer  <-- update ----   Decision Center
\`\`\`

The rule that prevents most pain: **always update before you publish.** It is exactly \`git pull\` before \`git push\`. Publish over a project someone has edited in Decision Center and you can overwrite their work.

The conventional division of ownership:

| Artefact | Owner | Edited in |
|---|---|---|
| BOM and vocabulary | Developer | Rule Designer |
| Ruleflow | Developer | Rule Designer |
| Ruleset parameters | Developer | Rule Designer |
| Business rules | Analyst | Decision Center |
| Decision tables | Analyst | Decision Center |
| Templates | Developer | Rule Designer |

Agree this explicitly with your team. "Whoever gets there first" is not a policy.`
      },
      {
        title: "Snapshots — your rollback plan",
        open: true,
        body: `A snapshot is a frozen copy of the whole project, named and dated:

\`\`\`
2026-01-15  loan-eligibility-v1.0-initial
2026-04-02  loan-eligibility-v1.1-salary-30k
2026-07-18  loan-eligibility-v1.2-scorecard
2026-10-05  loan-eligibility-v2.0-multi-reason
\`\`\`

Three uses:
1. **Deploy from a snapshot**, not from the live working state. What you tested is exactly what ships.
2. **Compare** two snapshots to see precisely what changed between releases — invaluable when something breaks.
3. **Roll back** by redeploying an earlier snapshot. Minutes, not a rebuild.

Take a snapshot before every deployment. It costs nothing and it is the thing you will be desperately glad of at some point.`
      },
      {
        title: "Decision Center and Git together",
        open: false,
        body: `Your roadmap says start GitHub from POC-01, and that raises a fair question: if Decision Center versions rules, why also use Git?

Because they cover different things:

- **Decision Center** versions the *rule content* and its business governance.
- **Git** versions everything else: the XOM Java, the deployment scripts, the test data, the documentation, the README explaining what the POC does.

For your learning POCs, Git is the main record — you may not even have a Decision Center instance. Export the rule project to your repository so the .brl, .bom and .voc files are versioned as text and diffable in a pull request. That is a genuinely good answer when an interviewer asks how rules are source-controlled.`
      }
    ],
    diagram: {
      caption: "Who edits where, and how work flows",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "Developer in Rule Designer", sub: "BOM, ruleflow, parameters, templates", tone: "a" },
        { label: "publish ↓   ↑ update", sub: "always update before you publish", tone: "warn" },
        { label: "Decision Center repository", sub: "rules, history, permissions", tone: "b" },
        { label: "Business analyst edits", sub: "rule content and decision tables", tone: "b" },
        { label: "Snapshot", sub: "frozen, named, deployable", tone: "c" },
        { label: "Deploy to Decision Server", sub: "from the snapshot, not the working state", tone: "ok" }
      ]
    },
    example: {
      caption: "One quarterly policy change, end to end",
      lang: "text",
      code: `SCENARIO: lending raises the minimum salary from 30,000 to 35,000.

DAY 1 — the request
  Lending manager raises the change in Decision Center.
  No developer involved yet.

DAY 1 — the edit
  Analyst opens the eligibility rules in the business console,
  finds 'reject-low-salary', changes 30000 to 35000, saves.
  Decision Center records: who, when, old value, new value.

DAY 2 — validation
  Analyst runs the DVS scenario suite from Decision Center.
     48 of 50 scenarios pass.
      2 fail: applicants earning 32,000, previously eligible.
  Those two failures are CORRECT -- the policy changed.
  Analyst updates the expected results and adds a note.

DAY 3 — review and approval
  Lending manager reviews the change and the test report,
  approves it in the Decision Center workflow.

DAY 3 — snapshot
  Snapshot created: 'loan-eligibility-v1.3-salary-35k'

DAY 4 — deployment
  Release engineer deploys the SNAPSHOT (not the working state)
  to TEST, runs a smoke test, then promotes the same archive to PROD
  as ruleset version 1.3.

  Minor bump: parameters unchanged, so all existing callers pick it
  up automatically. No application change, no code release.

TOTAL DEVELOPER TIME: zero.

CONTRAST -- if this logic had been Java:
  ticket -> developer -> code change -> review -> build -> test cycle
  -> release window -> deploy.  Typically 2-3 weeks and four people,
  for one number.

That contrast is the single best thing you can say in an ODM interview.`,
      note: "Notice day 4: the deployment used the snapshot, not the current working state. If someone had started editing the next change on day 3, deploying 'current' would have shipped half-finished work. Snapshot-based deployment prevents an entire class of accident."
    },
    quiz: {
      kind: "choose",
      prompt: "You have been editing the BOM in Rule Designer for two days. An analyst has been editing rules in Decision Center. What should you do before publishing?",
      options: [
        "Publish immediately — the BOM and rules are different artefacts",
        "Run update from Decision Center first, resolve any conflicts, then publish",
        "Ask the analyst to stop working and re-enter their changes afterwards",
        "Delete the Decision Center project and republish fresh"
      ],
      answer: 1,
      explain: "Update first, exactly like git pull before push. Publishing over the repository can overwrite the analyst's work. This is why teams split ownership by artefact — but the update-first habit still matters, because publish operates on the project, not on individual files."
    },
    mistake: {
      title: "Deploying from the working state rather than a snapshot",
      symptom: "Production behaviour includes a half-finished change nobody meant to release.",
      cause: "The deployment was taken from the current live state of the project in Decision Center, which included in-progress edits from someone else.",
      fix: "Always snapshot, then deploy the snapshot. Name snapshots so the name says what changed and when. This also gives you an instant rollback path: redeploy the previous snapshot, which takes minutes and requires no rebuild."
    }
  },

  /* ---------------------------------------------------------------- 4.4 */
  {
    id: "p4-t4",
    title: "Decision Server and RES",
    minutes: 13,
    tag: "Runtime ★",
    intro: `**Decision Server** is the runtime. **Rule Execution Server (RES)** is the rule-execution component inside it, along with a web console for managing deployed rulesets. In practice people use the two names interchangeably; when precision matters, RES is the part that stores, loads and executes rulesets.

Three things live here:

**The RES console** — a web application where you see deployed RuleApps and rulesets, their versions, their properties, and execution statistics. This is where you go when someone asks "what is actually running in production?"

**The execution unit (XU)** — the component that loads a ruleset, manages a pool of rule engines and runs executions. It caches compiled rulesets so the second call is much faster than the first.

**HTDS** — Hosted Transparent Decision Service. This is what exposes your ruleset as a REST endpoint with no code at all, and it is what Phase 5 will call from Postman.

Learn the console first. Being able to answer "which version is live and when was it deployed?" in thirty seconds makes you immediately useful on a project.`,
    jargon: [
      { term: "Decision Server", plain: "The ODM runtime that executes deployed rules." },
      { term: "RES", plain: "Rule Execution Server — the rule execution component and its management console." },
      { term: "XU", plain: "Execution Unit — the component that loads rulesets and manages engine pools." },
      { term: "HTDS", plain: "Hosted Transparent Decision Service — automatic REST/SOAP exposure of a ruleset." },
      { term: "Ruleset cache", plain: "Compiled rulesets kept in memory so repeat calls avoid re-parsing." },
      { term: "Decision warehouse", plain: "Optional storage of execution traces for later audit and analysis." }
    ],
    sections: [
      {
        title: "What you can do in the RES console",
        open: true,
        body: `| Task | Why you will need it |
|---|---|
| List deployed RuleApps and rulesets | Answer "what is running?" |
| See ruleset versions and deployment dates | Answer "when did this change?" |
| View and edit ruleset properties | Turn tracing on for a live problem |
| Test a ruleset with sample input | Prove the server works, independently of the caller |
| View execution statistics | Spot a ruleset being called far more, or far less, than expected |
| Browse the decision warehouse | See the actual trace of a specific past decision |
| Deploy or remove a RuleApp | Manual deployment, and emergency rollback |

The built-in test facility is underrated. When an application reports a wrong decision, running the same input directly in the console immediately tells you whether the problem is in the rules or in the caller. That single step saves whole afternoons.`
      },
      {
        title: "Ruleset properties worth knowing",
        open: true,
        body: `Properties are configuration you can change on a deployed ruleset without redeploying:

- \`ruleset.bom.enabled\` — makes BOM information available in traces; needed for readable rule names.
- \`ruleset.sequential.mode\` — override the execution algorithm.
- \`monitoring.enabled\` — record executions to the decision warehouse.
- \`ruleset.maxLoop\` — a safety limit against runaway RetePlus loops (see topic 3.1).
- Trace-level properties controlling how much detail an execution records.

The pattern to remember: **turn tracing up temporarily to diagnose a live problem, then turn it back down.** Full tracing on a high-volume service is expensive and will fill your storage quickly.`
      },
      {
        title: "How the runtime is actually deployed",
        open: false,
        body: `Decision Server runs on an application server. Common arrangements:

- **WebSphere Liberty** — IBM's own, and the most common in ODM shops.
- **WebSphere traditional / JBoss / Tomcat** — supported in various configurations.
- **Containers** — ODM ships certified container images, frequently run on Kubernetes or OpenShift.
- **ODM on Cloud / cloud-hosted** — IBM-managed.

This directly affects how you deploy and where logs live, and it is one of the specific things your roadmap tells you to ask your trainer about. Topic 4.6 has the full question list.`
      }
    ],
    diagram: {
      caption: "Inside Decision Server",
      kind: "layers",
      layers: [
        { label: "Calling application", sub: "REST client, Java app, Postman", tone: "ok" },
        { label: "HTDS — auto-generated REST/SOAP endpoint", sub: "no code needed to expose a ruleset", tone: "c" },
        { label: "Execution Unit (XU)", sub: "ruleset cache + pool of rule engines", tone: "b" },
        { label: "Deployed rulesets", sub: "SunriseLoanApp/1.0/loan-eligibility/1.2", tone: "b" },
        { label: "XOM classes", sub: "managed resource or server classpath", tone: "a" },
        { label: "Decision warehouse (optional)", sub: "stored execution traces for audit", tone: "a" }
      ]
    },
    example: {
      caption: "Using the RES console to diagnose a real problem",
      lang: "text",
      code: `PROBLEM REPORT
  "The mobile app is approving applicants it should reject."

STEP 1 — what is actually deployed?
  RES console -> Explorer -> RuleApps

  SunriseLoanApp
    version 1.0
      loan-eligibility  1.0   deployed 2026-01-15
      loan-eligibility  1.1   deployed 2026-04-02
      loan-eligibility  1.2   deployed 2026-07-18   <- highest

  Good: 1.2 is there, containing the July scorecard change.

STEP 2 — test the ruleset directly, bypassing the app
  RES console -> select loan-eligibility 1.2 -> Test

  input:  age 25, salary 28000, creditScore 710
  output: eligible = false, reason = "Minimum annual salary is 30,000"

  The ruleset is CORRECT. So the problem is not the rules.

STEP 3 — what is the app actually calling?
  Ask the mobile team for the ruleset path in their configuration:

      /SunriseLoanApp/1.0/loan-eligibility/1.0

  They pinned 1.0 explicitly. ODM routes minor versions forward, so
  they should get 1.2... but check the deployment again:

STEP 4 — the real cause
  RES console -> loan-eligibility 1.0 -> Properties
      This ruleset was deployed as a SEPARATE major-path entry by an
      earlier manual deployment, so it is still resident and still
      being served. The app is executing January's rules.

STEP 5 — fix
  Short term : point the app at 1.2 explicitly.
  Long term  : remove the stale 1.0 ruleset, and add a deployment
               check that fails if more than one version is resident.

TIME TAKEN: about 20 minutes, all in the console.
NOTHING in the rule project needed to change.`,
      note: "Steps 1 and 2 are the whole technique: establish what is deployed, then test it directly. If the ruleset gives the right answer in the console, the bug is between the caller and the server — and you have just saved yourself from debugging perfectly correct rules."
    },
    quiz: {
      kind: "choose",
      prompt: "An application reports a wrong decision. You run the identical input in the RES console test facility and get the CORRECT decision. What does this tell you?",
      options: [
        "The rules are wrong and need fixing",
        "The problem is between the caller and the server — wrong version, wrong data being sent, or a mapping error",
        "The Decision Server needs restarting",
        "The XOM jar is missing"
      ],
      answer: 1,
      explain: "The ruleset produces the right answer when given that input directly, so the rules are fine. The difference must be in what reaches them: a different ruleset version, different field values than the caller believes it is sending, or a JSON mapping problem. This one test cleanly splits the problem space in half — make it your first move every time."
    },
    mistake: {
      title: "Leaving full tracing enabled in production",
      symptom: "Response times degrade over weeks, disk fills up, and the decision warehouse becomes too large to query.",
      cause: "Tracing was turned on to diagnose an incident and never turned back off. Every execution now writes a detailed trace.",
      fix: "Treat tracing as a temporary diagnostic, like a debug log level. Turn it on for a specific investigation, note the time you did it, turn it off when you are done. If you need permanent audit records, configure the decision warehouse deliberately with a retention policy — not by accident via a forgotten trace flag."
    }
  },

  /* ---------------------------------------------------------------- 4.5 */
  {
    id: "p4-t5",
    title: "Deploying and running a ruleset",
    minutes: 14,
    tag: "Runtime ★",
    intro: `Time to do it. There are three routes from a rule project to a running ruleset, and you should know all three because different situations call for each.

**1. Directly from Rule Designer.** Right-click → Deploy RuleApp. Fastest for your own DEV loop. Not acceptable for anything shared — there is no audit trail and no snapshot.

**2. From Decision Center.** Deploy a snapshot to a configured server. This is the governed path, and the one a real project uses.

**3. From a build pipeline.** A script or Maven build produces the archive and deploys it via the RES API. This is how TEST and PROD should work, and it is what your roadmap's "open-source deployment tool" question is about.

For POC-04 you will use route 1 to get something running, then route 2 to understand the governed path. Route 3 depends entirely on your team's tooling.`,
    jargon: [
      { term: "Deployment configuration", plain: "A saved definition of where and how to deploy: server URL, credentials, RuleApp name and version." },
      { term: "Smoke test", plain: "A minimal post-deployment check that the thing responds at all." },
      { term: "Rollback", plain: "Restoring the previous working version." },
      { term: "res-deploy / RES API", plain: "The programmatic interface used to deploy rulesets from a script." }
    ],
    sections: [
      {
        title: "The deployment checklist",
        open: true,
        body: `Before you press deploy:

1. ☐ Local run passes, including boundary cases
2. ☐ Execution trace reviewed — the right rules fired
3. ☐ Decision tables checked for gaps and overlaps
4. ☐ Snapshot taken and named meaningfully
5. ☐ Version number decided — minor for policy, **major for parameter changes**
6. ☐ XOM jar built and its deployment path confirmed
7. ☐ You know the ruleset path callers will use
8. ☐ You know how to roll back

After you press deploy:

9. ☐ Console shows the new version with today's date
10. ☐ Console test facility returns the expected decision
11. ☐ A real call from Postman or the application succeeds
12. ☐ Tracing turned back down if you raised it

Twelve boxes, five minutes. It is worth it — every one of these corresponds to something that has gone wrong for somebody.`
      },
      {
        title: "Deploying from Rule Designer",
        open: true,
        body: `\`\`\`
1. Right-click the rule project → Deploy RuleApp Archive
2. Choose or create a RuleApp:   SunriseLoanApp, version 1.0
3. Add the ruleset:              loan-eligibility, version 1.0
4. Choose the target server:     the RES you configured earlier
5. Deploy
6. Check the console for the new entry
\`\`\`

The server connection is configured once in Rule Designer's preferences: URL, username, password. If deployment fails at this step it is nearly always the URL path or credentials, not your rules.

Use this route freely on your own DEV server. Never use it on anything shared — it deploys your working state, unversioned and unrecorded, which is precisely the accident topic 4.3 warns about.`
      },
      {
        title: "Rollback — decide before you need it",
        open: false,
        body: `Because previous versions remain resident on the server, rollback is usually simple:

**If callers are pinned to a specific version:** point them back at the old one. Application config change, no ODM action.

**If callers use the highest version:** remove or undeploy the bad ruleset, and the previous highest takes over again.

**If you must restore from source:** redeploy the previous snapshot from Decision Center. Minutes, no rebuild.

Write down which of these applies to your project *before* your first production deployment. Working it out during an incident is not the moment.`
      }
    ],
    diagram: {
      caption: "Three deployment routes, three purposes",
      kind: "columns",
      cols: [
        { title: "From Rule Designer", tone: "a", items: ["Fast, one click", "Your DEV server only", "No snapshot, no audit", "→ your inner loop"] },
        { title: "From Decision Center", tone: "b", items: ["Deploys a snapshot", "Governed and recorded", "Business-visible", "→ the real path"] },
        { title: "From a pipeline", tone: "c", items: ["Scripted, repeatable", "Same archive across envs", "No human in the loop", "→ TEST and PROD"] }
      ]
    },
    example: {
      caption: "POC-04 walkthrough — first successful deployment and execution",
      lang: "text",
      code: `=== 1. CONFIGURE THE SERVER CONNECTION (once) ===
Rule Designer -> Window -> Preferences -> Rule Designer -> Servers
   Name : local-res
   URL  : http://localhost:9060/res
   User : resAdmin
Test connection -> OK


=== 2. DEPLOY ===
Right-click 'loan-eligibility-rules' -> Deploy RuleApp Archive
   RuleApp : SunriseLoanApp   version 1.0
   Ruleset : loan-eligibility version 1.0
   Server  : local-res
   [x] include managed XOM      <-- do not skip this
Deploy.

Console output:
   Building ruleset archive...           ok
   Uploading managed XOM (42 KB)...      ok
   Deploying to local-res...             ok
   RuleApp /SunriseLoanApp/1.0 deployed.


=== 3. VERIFY IN THE RES CONSOLE ===
http://localhost:9060/res  ->  Explorer

   SunriseLoanApp 1.0
     loan-eligibility 1.0    deployed 2026-09-10 14:22
       Resources: loan-xom-1.0.jar
       Parameters:
         applicant  IN      com.sunrise.model.Applicant
         response   IN_OUT  com.sunrise.model.LoanResponse


=== 4. SMOKE TEST IN THE CONSOLE ===
Select the ruleset -> Test
   applicant.age             = 19
   applicant.annualSalary    = 52000
   applicant.creditScore     = 710
   applicant.hasExistingLoan = false
Execute:
   response.eligible = false
   response.reason   = "Applicant must be at least 21"
   3 rules fired, 4 ms

Matches the local run exactly. Deployment is good.


=== 5. THE RULESET PATH FOR CALLERS ===
   /SunriseLoanApp/1.0/loan-eligibility/1.0

Write this down. Phase 5 needs it, and it is the first thing anyone
integrating with your service will ask for.


=== IF STEP 4 FAILS ===
ClassNotFoundException  -> the XOM did not go with it. Redeploy with
                           'include managed XOM' ticked, or place the
                           jar on the server classpath.
Ruleset not found       -> check the path spelling and the versions
                           in the console; they are case-sensitive.
Parameter type mismatch -> the XOM on the server is a different build
                           from the one you compiled against.`,
      note: "Step 4 is the one people skip because the deployment already said 'ok'. Deployment success only means the archive installed — it says nothing about whether it can execute. The console test is the cheapest possible proof, and it takes twenty seconds."
    },
    quiz: {
      kind: "choose",
      prompt: "Deployment reports success, but the first execution throws ClassNotFoundException for your Applicant class. What happened?",
      options: [
        "The rules failed to compile",
        "The ruleset installed but the XOM classes are not available to the server",
        "The RuleApp version is wrong",
        "Decision Center is not connected"
      ],
      answer: 1,
      explain: "The deployment succeeded because the ruleset archive itself installed correctly. Execution fails because the engine cannot find the Java classes the rules reference. Either include the XOM as a managed resource in the deployment, or put the jar on the server classpath. This is the most common first-deployment failure there is — expect it."
    },
    mistake: {
      title: "Deploying from Rule Designer to a shared environment",
      symptom: "A ruleset appears in TEST that nobody planned, with no snapshot, no record of what it contains, and behaviour that does not match any known version.",
      cause: "Someone used the convenient right-click deploy against a shared server. It pushes the current working state directly — no snapshot, no approval, no audit trail.",
      fix: "Configure Rule Designer with your own DEV server only. Restrict credentials for shared environments so direct deployment is not possible. Deploy shared environments from Decision Center snapshots or from a pipeline, always. The convenience is genuinely useful — just keep it inside your own sandbox."
    }
  },

  /* ---------------------------------------------------------------- 4.6 */
  {
    id: "p4-t6",
    title: "CI/CD, build tooling, and what to ask your trainer",
    minutes: 12,
    tag: "Team practice ★",
    intro: `Your roadmap flags two open questions, and it is right to flag them rather than guess:

> *"What is the exact environment/tool we use to publish or deploy the ODM rule project?"*
> *"What is the exact open-source deployment/CI-CD tool I should learn?"*

Do not guess. "Open-source deployment tool" could reasonably mean Jenkins, GitHub Actions, GitLab CI, Maven, Gradle, Ansible, Docker, Kubernetes or Argo CD — and the answer changes what you should spend evenings learning. Guessing wrong costs weeks.

This topic gives you two things: enough vocabulary to understand whichever answer you get, and a written list of questions to actually ask. Print the list. Ask them in one conversation. The fact that you asked precise questions is itself a good impression.`,
    jargon: [
      { term: "CI", plain: "Continuous Integration — automatically building and testing on every change." },
      { term: "CD", plain: "Continuous Delivery/Deployment — automatically shipping what passed CI." },
      { term: "Pipeline", plain: "The scripted sequence of build, test and deploy steps." },
      { term: "Artifact repository", plain: "Storage for built artefacts (Nexus, Artifactory) so the same binary is promoted between environments." },
      { term: "Maven / Gradle", plain: "Java build tools. ODM provides Maven plugins for building rule projects." },
      { term: "IaC", plain: "Infrastructure as Code — servers defined in version-controlled files." }
    ],
    sections: [
      {
        title: "The questions to ask — copy this list",
        open: true,
        body: `**Environments and access**
1. How many environments do we have, and can I get access to DEV?
2. Is Decision Server on WebSphere Liberty, another app server, or containers?
3. Is our ODM on-premises, ODM on Cloud, or containerised?

**Authoring and repository**
4. Do we use Decision Center, or do developers work only in Rule Designer?
5. Who owns which artefacts — who edits the BOM, who edits the rules?
6. Are rule projects also stored in Git? Which repository?

**Build and deploy**
7. **What exactly do we use to build and deploy rule projects?** (the roadmap's question)
8. **Which CI/CD tool should I learn?** (the roadmap's other question)
9. Do we use the ODM Maven plugins, or a custom script?
10. Where does the XOM jar come from at run time — managed XOM or server classpath?
11. Who is allowed to deploy to TEST and to PROD?

**Testing**
12. Do we use DVS? Who writes the scenarios?
13. Is there an automated regression suite that runs on rule changes?

**Practical**
14. Where do I look at Decision Server logs?
15. Is there an existing rule project I can read as a reference?

Question 15 is quietly the most valuable. One real project teaches you more about your team's conventions than any documentation.`
      },
      {
        title: "What a typical ODM pipeline does",
        open: true,
        body: `Whatever the tool, the steps are much the same:

\`\`\`
1. checkout          rule project + XOM from Git
2. build XOM         mvn package -> loan-xom-1.2.0.jar
3. build ruleset     ODM Maven plugin -> loan-eligibility-1.2.jar
4. unit test         DVS scenarios against the built ruleset
5. publish artefact  push both jars to Nexus/Artifactory
6. deploy to TEST    RES API call
7. smoke test        one known input, assert the expected decision
8. gate              manual approval
9. deploy to PROD    the SAME artefact from step 5, not a rebuild
\`\`\`

Step 9 is the important one. Promote the artefact you tested; never rebuild for production. A rebuild is a different binary, and everything you proved in TEST applied to the other one.`
      },
      {
        title: "Learning CI/CD without knowing the tool yet",
        open: false,
        body: `While you wait for an answer, the transferable knowledge is the *concepts*, not the syntax:

- What a pipeline is, and why build once / deploy many matters.
- Why artefacts are versioned and stored rather than rebuilt.
- What a deployment gate is and who owns it.
- How secrets (server passwords) are kept out of the repository.
- What a rollback looks like.

If you want something concrete to practise on, **GitHub Actions** is the lowest-friction choice: it needs no server, it works directly on the repository your roadmap already tells you to create in Phase 6, and the YAML concepts transfer cleanly to Jenkins or GitLab CI. Setting up a workflow that just compiles your XOM on every push is a genuinely useful hour, whatever your team turns out to use.`
      }
    ],
    diagram: {
      caption: "Build once, promote the same artefact",
      kind: "flow",
      dir: "right",
      nodes: [
        { label: "Git commit", sub: "rules + XOM", tone: "a" },
        { label: "Build + test", sub: "one artefact, DVS scenarios", tone: "b" },
        { label: "Artefact repo", sub: "loan-eligibility-1.2.jar", tone: "b" },
        { label: "Deploy to TEST", sub: "that exact jar", tone: "c" },
        { label: "Deploy to PROD", sub: "the same jar — never a rebuild", tone: "ok" }
      ]
    },
    example: {
      caption: "A minimal GitHub Actions workflow you could actually run on your POC repo",
      lang: "yaml",
      code: `# .github/workflows/build.yml
# Builds the XOM on every push. A real first step you can add today,
# whatever CI/CD tool your team turns out to use.

name: build-odm-poc

on:
  push:
    branches: [ main ]
  pull_request:

jobs:
  build-xom:
    runs-on: ubuntu-latest
    steps:
      - name: Check out the repository
        uses: actions/checkout@v4

      - name: Set up Java
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven

      - name: Build the XOM jar
        working-directory: poc-01-basic-rules/loan-eligibility-xom
        run: mvn -B clean package

      - name: Publish the jar as a build artefact
        uses: actions/upload-artifact@v4
        with:
          name: loan-xom
          path: poc-01-basic-rules/loan-eligibility-xom/target/*.jar

# ---------------------------------------------------------------
# What a full ODM pipeline would add on top of this:
#
#   - build the ruleset archive with the ODM Maven plugin
#       (com.ibm.odm:build-ruleset)
#   - run DVS scenario tests against the built ruleset
#   - deploy to the DEV Decision Server via the RES API
#   - smoke test: POST one known applicant, assert the decision
#   - manual approval gate
#   - promote the SAME archive to TEST, then PROD
#
# Ask your trainer which of these your team automates today.
# ---------------------------------------------------------------`,
      note: "This is deliberately small. It builds your XOM and nothing else — but it is real CI running on your real repository, and extending it later is much easier than starting from nothing. It also gives you something concrete to point at when someone asks what CI/CD experience you have."
    },
    quiz: {
      kind: "choose",
      prompt: "Why should a pipeline deploy the SAME artefact to PROD that it tested in TEST, rather than rebuilding from the same commit?",
      options: [
        "Rebuilding is slower",
        "A rebuild produces a different binary, so nothing you proved in TEST provably applies to what runs in PROD",
        "ODM licences forbid rebuilding",
        "Git tags cannot be reused"
      ],
      answer: 1,
      explain: "Build once, deploy many. A rebuild can differ through dependency versions, build environment, timestamps or plain human error. If the binary is not identical, your test evidence is about a different thing — which is exactly the question an auditor asks after an incident."
    },
    mistake: {
      title: "Guessing which tool your team uses and learning the wrong one",
      symptom: "Three weekends on Jenkins, and the team turns out to use GitLab CI with the ODM Maven plugins.",
      cause: "A vague phrase in a training plan — 'open-source deployment tool' — was interpreted rather than clarified.",
      fix: "Ask. Use the list in this topic, ask everything in one conversation, and write the answers down. Asking precise questions marks you as someone who has thought about the problem; guessing wrong costs weeks and teaches nobody anything. And while you wait, learn the concepts rather than one tool's syntax — those transfer whatever the answer is."
    }
  }

  ],

  quiz: [
    {
      q: "Why does your roadmap put deployment AFTER building one complete rule project?",
      options: ["Deployment is harder", "Without a known-good local result you cannot tell a deployment problem from a rule-logic problem", "Licences are only issued later", "Decision Center requires it"],
      answer: 1,
      explain: "A proven local run is your reference point. Without it, every deployment failure has two possible causes and no way to distinguish them."
    },
    {
      q: "You change a ruleset parameter's type. What version bump is required?",
      options: ["No bump", "Minor (1.2 → 1.3)", "Major (1.2 → 2.0)", "RuleApp version only"],
      answer: 2,
      explain: "A parameter change is a contract change. Major versions coexist so existing callers keep working; minor versions route forward and would silently break them."
    },
    {
      q: "What is HTDS?",
      options: ["The rule storage database", "Hosted Transparent Decision Service — automatic REST/SOAP exposure of a deployed ruleset", "A testing framework", "The Decision Center approval workflow"],
      answer: 1,
      explain: "HTDS exposes a deployed ruleset as a web service with no integration code. It is what Phase 5 calls from Postman."
    },
    {
      q: "An application reports a wrong decision, but the RES console test with the same input gives the right one. Where is the problem?",
      options: ["In the rules", "Between the caller and the server — version, input data, or mapping", "In the BOM", "In the ruleflow"],
      answer: 1,
      explain: "The ruleset is provably correct for that input, so the difference lies in what actually reaches it. This test splits the problem space in half in about a minute."
    },
    {
      q: "Why deploy from a snapshot rather than the current project state?",
      options: ["It is faster", "A snapshot is frozen, so you ship exactly what was tested and can roll back to it", "Snapshots compress better", "Decision Center requires it"],
      answer: 1,
      explain: "The working state may contain someone else's in-progress edits. A named snapshot is reproducible, deployable and instantly restorable."
    },
    {
      q: "First execution after a successful deployment throws ClassNotFoundException. What is missing?",
      options: ["The ruleflow", "The XOM classes on the server — managed XOM not included, or jar not on the classpath", "The BOM", "A decision table"],
      answer: 1,
      explain: "The ruleset archive installed fine; the engine simply cannot find the Java classes the rules reference. This is the most common first-deployment failure."
    },
    {
      q: "Why should a pipeline promote the same artefact through environments rather than rebuilding?",
      options: ["To save build minutes", "So that what passed testing is provably identical to what runs in production", "Because Maven caches are unreliable", "To keep Git history clean"],
      answer: 1,
      explain: "Build once, deploy many. A rebuilt binary is a different binary, so the test evidence no longer applies to it."
    },
    {
      q: "Which is the WORST place to use Rule Designer's direct 'Deploy RuleApp' feature?",
      options: ["Your own local DEV server", "A shared TEST or PROD environment", "A throwaway sandbox", "A container running on your laptop"],
      answer: 1,
      explain: "Direct deploy pushes your unversioned working state with no snapshot and no audit trail. Convenient in your own sandbox, unacceptable anywhere shared."
    }
  ]
};
