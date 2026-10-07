/* =========================================================================
   PHASE 3 — Advanced Rule Logic
   Sequenced deliberately: algorithms -> ordering -> ruleflows -> collections
   -> decision tables -> trees -> scorecards. Do not learn them all at once.
   ========================================================================= */

window.PHASE_3 = {
  id: "phase3",
  number: 3,
  title: "Advanced Rule Logic",
  subtitle: "Algorithms, ruleflows, collections, trees and scorecards — in the right order",
  goal: "Control how and when rules execute, and handle policies that involve many objects rather than one.",
  badge: { name: "Flow Architect", icon: "🧭" },
  topics: [

  /* ---------------------------------------------------------------- 3.1 */
  {
    id: "p3-t1",
    title: "Rule algorithms — RetePlus, Sequential, Fastpath",
    minutes: 15,
    tag: "Execution ★",
    intro: `A rule engine has to answer one question very fast, over and over: *given these objects, which rules match?*

The **rule algorithm** is the strategy it uses. ODM offers three, and you choose per rule task:

**RetePlus** — builds a network of the conditions once, then remembers partial matches as objects change. Expensive to set up, brilliant when rules chain and objects are modified mid-execution.

**Sequential** — compiles the rules into what is effectively a long if/else chain and runs them top to bottom, once. Very fast start-up, very fast execution, no memory of intermediate state.

**Fastpath** — a middle ground: sequential-like speed with some of Rete's ability to handle object updates.

The practical guidance is simpler than the theory: **start with Sequential**. Most decision services — including your loan-eligibility ruleset — are one pass over one object, and Sequential is the fastest and most predictable choice. Move to RetePlus only when you actually need rules to react to each other.`,
    jargon: [
      { term: "Rule algorithm", plain: "The strategy the engine uses to find and fire matching rules." },
      { term: "RetePlus", plain: "IBM's enhanced Rete algorithm. Builds a match network, handles object updates and rule chaining." },
      { term: "Sequential", plain: "Compiles rules into a straight-through sequence. Fast, stateless, no re-evaluation." },
      { term: "Fastpath", plain: "A hybrid: sequential speed with limited support for object updates." },
      { term: "Inference / chaining", plain: "One rule's action changing data so that another rule now matches." },
      { term: "Agenda", plain: "The list of rules the engine has found to be matching and is about to fire." }
    ],
    sections: [
      {
        title: "How to choose — the decision in three questions",
        open: true,
        body: `**1. Do rules modify objects that other rules then need to re-evaluate?**
Yes → RetePlus. No → keep reading.

**2. Do you insert or retract objects during execution?**
Yes → RetePlus. No → keep reading.

**3. Is this a straight pass over the input to produce a decision?**
Yes → **Sequential**.

That covers the vast majority of decision services. Sequential is the sensible default for a stateless REST decision service, which is exactly what Phase 5 will build.

Fastpath is worth trying when you want Sequential's speed but have a small amount of object updating. Measure rather than guess — the difference matters only at real volume.`
      },
      {
        title: "What RetePlus actually buys you",
        open: true,
        body: `Consider two rules:

\`\`\`
R1: if the total debt of the applicant is more than 200000
    then set the risk band of the applicant to "HIGH";

R2: if the risk band of the applicant is "HIGH"
    then set the eligibility of the response to false;
\`\`\`

R2 depends on something R1 sets. Under **Sequential**, if R2 is evaluated before R1 in the compiled order, it simply misses — the risk band was not HIGH yet when R2 was checked, and Sequential never looks again.

Under **RetePlus**, when R1 fires and calls \`update\`, the engine re-evaluates affected rules, R2 becomes matching, and it fires. That is **inference** or **forward chaining**, and it is the reason Rete exists.

The cost: RetePlus builds and maintains a match network, uses more memory, and its firing order is harder to predict. Power for predictability is the trade.`
      },
      {
        title: "The `update` statement",
        open: false,
        body: `Under RetePlus, if a rule modifies an object and you want dependent rules to re-evaluate, you must tell the engine:

\`\`\`
then
    set the risk band of 'the applicant' to "HIGH";
    update 'the applicant';
\`\`\`

Without \`update\`, the engine's network still holds the old match state and dependent rules may not re-fire.

The mirror-image trap: an unguarded \`update\` can cause a rule to re-match itself and loop forever. Always make sure the rule's own condition becomes false after it fires, or guard it with a flag.`
      }
    ],
    diagram: {
      caption: "The three algorithms, and where each fits",
      kind: "columns",
      cols: [
        { title: "Sequential", tone: "ok", items: ["Straight-through, one pass", "Fastest, most predictable", "No chaining, no updates", "→ default for decision services"] },
        { title: "Fastpath", tone: "b", items: ["Sequential-like speed", "Limited update support", "Middle ground", "→ measure before choosing"] },
        { title: "RetePlus", tone: "c", items: ["Match network, remembers state", "Chaining and inference", "Handles insert/update/retract", "→ when rules react to rules"] }
      ]
    },
    example: {
      caption: "The same two rules under Sequential and under RetePlus",
      lang: "text",
      code: `/* ------- The rules ------- */
R1  if the total outstanding debt of 'the applicant' is more than 200000
    then set the risk band of 'the applicant' to "HIGH";
         update 'the applicant';

R2  if the risk band of 'the applicant' is "HIGH"
    then set the eligibility of 'the response' to false;
         set the reason of 'the response' to "High existing debt";


/* ------- SEQUENTIAL, compiled order R2 then R1 ------- */
  evaluate R2 : risk band is null, not "HIGH"   -> skip
  evaluate R1 : debt 235000 > 200000            -> FIRE, band := "HIGH"
  end of pass. No re-evaluation.
  RESULT: eligible stays true.   <-- WRONG

/* ------- SEQUENTIAL, compiled order R1 then R2 ------- */
  evaluate R1 : FIRE, band := "HIGH"
  evaluate R2 : band is "HIGH"                  -> FIRE
  RESULT: eligible = false.      <-- right, but only by luck of ordering

/* ------- RETEPLUS ------- */
  agenda: R1 matches
  FIRE R1 : band := "HIGH", update applicant
  network re-evaluates -> R2 now matches, added to agenda
  FIRE R2 : eligible := false
  RESULT: eligible = false.      <-- right, regardless of authoring order


/* ------- The third option: don't chain at all ------- */
R2' if the total outstanding debt of 'the applicant' is more than 200000
    then set the eligibility of 'the response' to false;
         set the reason of 'the response' to "High existing debt";

  One rule, no dependency, Sequential works perfectly.
  Often the best answer is to remove the chaining, not to change the engine.`,
      note: "That last block matters. Reaching for RetePlus because two rules depend on each other is sometimes right and sometimes a sign the rules should be restructured. Ask 'can I express this without the dependency?' before changing the algorithm."
    },
    quiz: {
      kind: "choose",
      prompt: "Your ruleset takes one applicant, applies four independent eligibility checks and returns a decision. No rule modifies data another rule reads. Which algorithm?",
      options: [
        "RetePlus, because it is the most powerful",
        "Sequential, because it is a single pass with no chaining",
        "Fastpath, because it is the safest middle ground",
        "It makes no difference"
      ],
      answer: 1,
      explain: "No chaining, no updates, one pass — Sequential is faster to compile, faster to execute, and its behaviour is easy to reason about. RetePlus would work but pays for machinery you are not using. 'Powerful' is not a selection criterion; matching the algorithm to the workload is."
    },
    mistake: {
      title: "An infinite loop under RetePlus",
      symptom: "The ruleset never returns. CPU pinned, execution times out, the calling application hangs.",
      cause: "A rule modifies an object and calls update, which makes its own condition true again, so it re-fires forever. Classically: 'if the score is less than 100 then increase the score by 1; update' where something keeps it below 100.",
      fix: "Make sure every rule that updates an object changes it in a way that makes the rule's own condition false. Guard with a flag ('and the applicant has not been repriced'). Set a maximum-loop or execution-timeout limit in the runtime as a safety net, and always test with the trace on so you can see the repetition."
    }
  },

  /* ---------------------------------------------------------------- 3.2 */
  {
    id: "p3-t2",
    title: "Rule ordering, priority and overriding",
    minutes: 12,
    tag: "Execution",
    intro: `Topic 2.8 left a loose end: two rules both set \`the reason of the response\`, and whichever fires last wins. That is unacceptable in a system anybody depends on, so let's fix it properly.

ODM gives you three levers, in increasing order of preference:

**Priority** — a number on each rule. Higher priority fires first. Quick, but invisible: you cannot see the execution order by looking at the project, only by opening every rule.

**Ruleflow ordering** — put rules in packages and run those packages as ordered tasks. Visible, diagrammable, and the recommended approach. That is topic 3.3.

**Restructuring** — often the best answer is to make the rules independent so order stops mattering at all.

A useful principle: *if the correctness of your ruleset depends on firing order, make that order explicit and visible.* Implicit ordering is a bug waiting for a busy Tuesday.`,
    jargon: [
      { term: "Priority", plain: "A numeric property on a rule; higher values fire earlier within a rule task." },
      { term: "Conflict set", plain: "The set of rules that all match at the same moment. Something has to decide the order." },
      { term: "Conflict resolution", plain: "How the engine picks which of several matching rules fires first." },
      { term: "Override", plain: "One rule explicitly declared to supersede another." },
      { term: "Exit criteria", plain: "A ruleflow setting that stops a task once a condition is met." }
    ],
    sections: [
      {
        title: "Setting priority",
        open: true,
        body: `Every rule has a **priority** property. The default is 0. Higher numbers fire first.

\`\`\`
reject-under-age            priority: 100
reject-low-salary           priority: 100
reject-low-credit-score     priority: 100
approve-if-no-rejection     priority: 0     <- must run last
\`\`\`

This works, and for a small ruleset it is fine. Two cautions:

1. Priority is a property buried in each rule's settings. Six months later, nobody can see the execution order without opening every file.
2. Priorities within the same value are still unordered relative to each other.

Use priority for coarse "this must run last" cases. Use a ruleflow for anything more structured.`
      },
      {
        title: "The better fix — make order irrelevant",
        open: true,
        body: `Look again at the fragile approval rule:

\`\`\`
if the reason of 'the response' is null
then set the eligibility of 'the response' to true;
\`\`\`

It only works because it runs last. Now compare:

\`\`\`
if the age of 'the applicant' is at least 21
   and the annual salary of 'the applicant' is at least 30000
   and the credit score of 'the applicant' is at least 700
then set the eligibility of 'the response' to true;
     set the reason of 'the response' to "Meets all pre-screening criteria";
\`\`\`

This rule states its own conditions. It fires when the applicant qualifies, whatever the order. No priority needed, no hidden dependency.

The cost is duplication: the thresholds now appear in two places, and someone changing 700 to 720 must change both. That duplication is real, and it is exactly what a decision table solves — one grid, every combination, stated once. This is the argument that makes tables click.`
      },
      {
        title: "Collecting reasons instead of overwriting",
        open: false,
        body: `If an applicant fails on salary *and* credit score, which reason should the customer see?

Business answer, usually: all of them. So stop overwriting a single field:

\`\`\`
then
    set the eligibility of 'the response' to false;
    add "Minimum annual salary is 30,000" to the reasons of 'the response';
\`\`\`

Now every failing rule contributes, order does not matter, and the response carries the full picture. Design your output object to hold a list of reasons from the very start — retrofitting it later means changing every rule and every consumer of the JSON.`
      }
    ],
    diagram: {
      caption: "Three ways to control order, from most fragile to most robust",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "Implicit order", sub: "whatever the engine happens to do — never rely on this", tone: "bad" },
        { label: "Priority numbers", sub: "works, but invisible in the project structure", tone: "warn" },
        { label: "Ruleflow tasks", sub: "explicit, diagrammed, reviewable", tone: "b" },
        { label: "Order-independent rules", sub: "each rule states its own full condition", tone: "ok" }
      ]
    },
    example: {
      caption: "The Sunrise Bank rules, refactored so order no longer decides the answer",
      lang: "text",
      code: `/* ===== BEFORE: correctness depends on firing order ===== */

reject-under-age            if age < 21              then reason := "..."
reject-low-salary           if salary < 30000        then reason := "..."
reject-low-credit-score     if score < 700           then reason := "..."
approve-if-no-rejection     if reason is null        then eligible := true

  Problems:
   - approve rule MUST run last (hidden dependency)
   - an applicant failing twice shows only one reason, unpredictably


/* ===== AFTER: independent rules, list of reasons ===== */

/* --- each failure rule contributes, none overwrite --- */
reject-under-age
    if the age of 'the applicant' is less than 21
    then set the eligibility of 'the response' to false;
         add "Applicant must be at least 21"
             to the reasons of 'the response';

reject-low-salary
    if the annual salary of 'the applicant' is less than 30000
    then set the eligibility of 'the response' to false;
         add "Minimum annual salary is 30,000"
             to the reasons of 'the response';

reject-low-credit-score
    if the credit score of 'the applicant' is less than 700
    then set the eligibility of 'the response' to false;
         add "Minimum credit score is 700"
             to the reasons of 'the response';

/* --- approval states its own full condition --- */
approve
    if the age of 'the applicant' is at least 21
       and the annual salary of 'the applicant' is at least 30000
       and the credit score of 'the applicant' is at least 700
    then set the eligibility of 'the response' to true;
         add "Meets all pre-screening criteria"
             to the reasons of 'the response';


/* ===== RESULT for Vikram: age 19, salary 22000, score 710 ===== */
  eligible = false
  reasons  = [ "Applicant must be at least 21",
               "Minimum annual salary is 30,000" ]

  Both failures reported. Any firing order gives the same answer.`,
      note: "Notice that eligible defaults to false in the Java class, so a rejection needs no ordering guarantee at all — the failure rules only ever confirm it. Designing your output object's defaults thoughtfully removes a surprising amount of ordering anxiety."
    },
    quiz: {
      kind: "predict",
      prompt: "Using the refactored rules above, an applicant is 25, earns 45,000 and has a credit score of 640. What is in `reasons`?",
      options: [
        "[\"Minimum credit score is 700\"]",
        "[\"Meets all pre-screening criteria\"]",
        "[\"Minimum credit score is 700\", \"Meets all pre-screening criteria\"]",
        "[] — no rule fires"
      ],
      answer: 0,
      explain: "Age 25 passes, salary 45,000 passes, score 640 fails — so only reject-low-credit-score fires. The approve rule requires all three conditions and score 640 is below 700, so it does not fire. One reason, correct regardless of order. Compare this with the old design, where the answer would have depended on which rule ran last."
    },
    mistake: {
      title: "Relying on priority to paper over a design problem",
      symptom: "The ruleset has priorities like 1000, 999, 998, 500, 100 and nobody remembers why. Every new rule needs someone to work out where it fits.",
      cause: "Priority was used as the primary ordering mechanism instead of structuring the rules and the flow.",
      fix: "Reserve priority for genuine exceptions — a single override rule that must beat everything else. Express normal sequencing in a ruleflow, where it is visible as a diagram. And whenever you catch yourself adding a priority, first ask whether the rule could simply state its own full condition instead."
    }
  },

  /* ---------------------------------------------------------------- 3.3 */
  {
    id: "p3-t3",
    title: "Ruleflows — organising execution",
    minutes: 15,
    tag: "Orchestration ★",
    intro: `A **ruleflow** is a flowchart for your ruleset. Boxes are **rule tasks** (each running a selected group of rules), arrows are transitions, and diamonds are branches.

It answers the question priority answers badly: *in what order do groups of rules run, and under what conditions do we skip a group entirely?*

For Sunrise Bank:

\`\`\`
START → validate input → [valid?] → check eligibility → price the loan → build message → END
                            ↓ no
                        reject with error → END
\`\`\`

Two things make this worth doing. First, it is **visible** — a diagram anyone can review, including a business stakeholder. Second, it lets you **skip whole stages**: if validation fails, do not waste time (or risk exceptions) running eligibility rules on incomplete data.

A ruleflow is also where you set the rule algorithm per task, which means you can run a straightforward validation stage Sequentially and a chaining pricing stage under RetePlus, in the same ruleset.`,
    jargon: [
      { term: "Ruleflow", plain: "A diagram defining the order and conditions of rule execution." },
      { term: "Rule task", plain: "One box in the flow. Selects a set of rules and runs them." },
      { term: "Transition", plain: "An arrow from one node to the next." },
      { term: "Branch node", plain: "A decision point with conditional outgoing transitions." },
      { term: "Rule selection", plain: "How a task chooses its rules — usually all rules in a package." },
      { term: "Exit criteria", plain: "A condition that stops a task early, once satisfied." }
    ],
    sections: [
      {
        title: "The node types you will use",
        open: true,
        body: `| Node | What it does |
|---|---|
| **Start / Stop** | Entry and exit of the flow |
| **Rule task** | Runs a set of rules; you choose the algorithm and ordering here |
| **Function task** | Runs BAL statements directly, no rules — useful for setup and defaults |
| **Branch** | Conditional split: take one path or another |
| **Fork / Join** | Parallel paths that reconverge |
| **Sub-flow** | Calls another ruleflow — how you keep large flows readable |

You will use Start, Rule task, Branch and Stop for almost everything. Function tasks are handy for initialising the response object at the very beginning.`
      },
      {
        title: "Designing the task breakdown",
        open: true,
        body: `A good ruleflow mirrors how a human would do the job in stages:

1. **Validate** — is the input usable at all? Missing name, negative age, null collections.
2. **Enrich** — derive anything the later rules need. Total debt, age band, tenure.
3. **Decide** — the actual eligibility policy.
4. **Price** — only reached if eligible.
5. **Communicate** — build the customer-facing message.

Each stage becomes a rule package and a rule task with the same name. Your folder structure and your ruleflow then look identical, which makes the project navigable by someone who has never seen it.

Notice stage 4: pricing rules never run for a rejected applicant. That is not just efficiency — it prevents a pricing rule from throwing an exception on data that was never going to be used.`
      },
      {
        title: "Rule selection and exit criteria",
        open: false,
        body: `A rule task selects its rules, most commonly:

\`\`\`
all rules in package 'eligibility'
\`\`\`

You can also select by property, which is how "run only the rules effective today" or "run only rules for the retail channel" is done:

\`\`\`
all rules where the property "channel" is "RETAIL"
\`\`\`

**Exit criteria** stop a task once something is true — useful for "first matching rule wins" behaviour:

\`\`\`
exit criteria: the reasons of 'the response' is not empty
\`\`\`

Combined with an ordered task, that gives you a clean "stop at the first failure" policy without any priority juggling.`
      }
    ],
    diagram: {
      caption: "The Sunrise Bank ruleflow",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "START", sub: "ruleset invoked with applicant + response", tone: "b" },
        { label: "Function: initialise", sub: "response.eligible = false, reasons = []", tone: "b" },
        { label: "Task: validation", sub: "package 'validation', Sequential", tone: "a" },
        { label: "BRANCH: input valid?", sub: "no → jump to error stop", tone: "warn" },
        { label: "Task: eligibility", sub: "package 'eligibility', Sequential", tone: "a" },
        { label: "BRANCH: eligible?", sub: "no → skip pricing", tone: "warn" },
        { label: "Task: pricing", sub: "decision table, only for eligible applicants", tone: "c" },
        { label: "Task: messaging", sub: "build the customer-facing text", tone: "c" },
        { label: "STOP", sub: "response returned to the caller", tone: "ok" }
      ]
    },
    example: {
      caption: "The ruleflow expressed as configuration",
      lang: "text",
      code: `RULEFLOW: loan-eligibility.rfl

[START]
   |
   v
[FUNCTION TASK: initialise-response]
   body:
     set the eligibility of 'the response' to false;
     set the reasons of 'the response' to a new List;
   |
   v
[RULE TASK: validation]
   rule selection : all rules in package 'validation'
   algorithm      : Sequential
   ordering       : rule name
   |
   v
[BRANCH: input-usable?]
   |-- condition: the reasons of 'the response' contains "INVALID_INPUT"
   |        --> [STOP: error-exit]
   |
   +-- otherwise
            |
            v
[RULE TASK: eligibility]
   rule selection : all rules in package 'eligibility'
   algorithm      : Sequential
   |
   v
[BRANCH: eligible?]
   |-- condition: the eligibility of 'the response' is false
   |        --> [RULE TASK: messaging]  (skip pricing entirely)
   |
   +-- otherwise
            |
            v
[RULE TASK: pricing]
   rule selection : all rules in package 'pricing'
   algorithm      : Sequential
   contains       : the loan-pricing decision table
            |
            v
[RULE TASK: messaging]
   rule selection : all rules in package 'messaging'
            |
            v
[STOP]


TRACE for Vikram (age 19):
  initialise-response  -> eligible=false, reasons=[]
  validation           -> 0 fired (input is well-formed)
  branch input-usable? -> otherwise
  eligibility          -> 1 fired (reject-under-age)
  branch eligible?     -> false, so SKIP pricing
  messaging            -> 1 fired
  STOP.  Pricing rules never evaluated. 3 rules fired total.`,
      note: "Read the last two lines of the trace. The pricing decision table was never touched, so it cannot have thrown, cannot have mispriced, and cost nothing. Skipping work you do not need is one of the quiet advantages of a ruleflow over a flat pile of rules."
    },
    quiz: {
      kind: "choose",
      prompt: "Why put pricing rules in a separate task after an “eligible?” branch, rather than adding “and the applicant is eligible” to every pricing rule?",
      options: [
        "Rules cannot check the response object",
        "The flow makes the dependency visible, avoids repeating the condition, and skips the work entirely for rejected applicants",
        "Pricing rules require RetePlus",
        "Decision tables cannot have conditions"
      ],
      answer: 1,
      explain: "Three benefits at once. The diagram shows a reviewer that pricing depends on eligibility; the condition is stated once rather than in every pricing row; and rejected applicants skip the whole stage, which is both faster and safer — a pricing rule cannot throw on data it never sees."
    },
    mistake: {
      title: "A ruleflow that has grown into a maze",
      symptom: "Thirty nodes, crossing arrows, and nobody can say with confidence which tasks run for a given input.",
      cause: "Nodes were added one at a time as requirements arrived, with no periodic restructuring.",
      fix: "Keep the top-level flow to roughly five to seven nodes — a diagram you can screenshot into a document. Push detail into sub-flows: a 'pricing' sub-flow with its own internal stages appears as one box in the parent. If you cannot explain the flow out loud in thirty seconds, it needs refactoring, and doing that is much cheaper than a wrong decision in production."
    }
  },

  /* ---------------------------------------------------------------- 3.4 */
  {
    id: "p3-t4",
    title: "Rules over collections",
    minutes: 16,
    tag: "Authoring ★",
    intro: `So far every rule has looked at one applicant. Real policies look at *sets* of things: all the applicant's existing loans, all the line items in an order, all the claims in the last twelve months.

Your roadmap gives the shape:

\`\`\`
Customer → List of Orders → Check total purchase → Calculate discount
\`\`\`

ODM gives you three ways to write conditions over a collection:

**Existence** — is there at least one item like this?
\`\`\`
there is a loan in the loans of 'the applicant'
    such that the type of this loan is "CREDIT_CARD"
\`\`\`

**Universal** — are all items like this?
\`\`\`
all loans in the loans of 'the applicant'
    have a months remaining of less than 12
\`\`\`

**Aggregate** — what is the total, count, minimum, maximum, average?
\`\`\`
the total of the outstanding of each loan
    in the loans of 'the applicant' is more than 200000
\`\`\`

This is Phase 1 topic 1.9 in business clothing: existence is \`anyMatch\`, universal is \`allMatch\`, aggregate is a stream sum. The concepts you already have transfer directly.`,
    jargon: [
      { term: "Collection condition", plain: "A rule condition that examines a list rather than a single value." },
      { term: "Existential", plain: "'There is at least one item such that…'" },
      { term: "Universal", plain: "'All items satisfy…' — note this is true for an empty collection." },
      { term: "Aggregate", plain: "A computed value across the collection: sum, count, min, max, average." },
      { term: "Binding", plain: "Naming the matched item ('this loan') so you can use it in the action." }
    ],
    sections: [
      {
        title: "Existence — the most common form",
        open: true,
        body: `\`\`\`
definitions
    set 'the applicant' to a Applicant;
if
    there is a loan in the loans of 'the applicant' such that
        the type of this loan is "PAYDAY"
then
    set the eligibility of 'the response' to false;
    add "Payday loans disqualify an applicant"
        to the reasons of 'the response';
\`\`\`

The rule fires **once** if at least one payday loan exists, not once per loan. That is usually what you want for a decision.

If you genuinely need to act on every matching loan, bind it in the definitions instead:

\`\`\`
definitions
    set 'the loan' to a Loan in the loans of 'the applicant'
        where the type of this is "PAYDAY";
\`\`\`

Now the rule fires once **per** matching loan, and 'the loan' refers to the specific one. Understanding this distinction is what separates people who can write collection rules from people who copy them.`
      },
      {
        title: "Aggregates — sum, count, min, max",
        open: true,
        body: `\`\`\`
// total
the total of the outstanding of each loan in the loans of 'the applicant'

// count
the number of loans in the loans of 'the applicant'
    where the type of this loan is "CREDIT_CARD"

// maximum
the maximum of the outstanding of each loan in the loans of 'the applicant'

// average
the average of the outstanding of each loan in the loans of 'the applicant'
\`\`\`

Aggregates are frequently worth promoting to a **virtual BOM attribute** (topic 2.5). If five rules all need "the total outstanding debt", define it once in the BOM and let every rule say \`the total outstanding debt of 'the applicant'\`. Cleaner rules, one place to change the definition.`
      },
      {
        title: "The empty-collection trap",
        open: true,
        body: `Two traps, and they pull in opposite directions.

**Universal conditions are true for an empty collection.** "All loans have months remaining under 12" is *true* when there are no loans at all — vacuously. If your rule grants a benefit on that basis, applicants with no loan history get it by accident.

Guard it:
\`\`\`
if the number of loans in the loans of 'the applicant' is at least 1
   and all loans in the loans of 'the applicant' have ...
\`\`\`

**A null collection fires nothing.** If \`getLoans()\` returns null rather than an empty list, existence conditions are false, universal conditions may not evaluate, and aggregates may throw or return zero. No error surfaces; the rule just quietly does not fire.

This is why topic 2.4 insisted on initialising list fields in the XOM. It is the single highest-value defensive habit in ODM.`
      }
    ],
    diagram: {
      caption: "The roadmap's collection example, as a flow",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "Customer / Applicant", sub: "one object", tone: "a" },
        { label: "List of Orders / Loans", sub: "zero or more items", tone: "a" },
        { label: "Collection condition", sub: "exists / all / total", tone: "b" },
        { label: "Aggregate value", sub: "total purchase = 235,000", tone: "b" },
        { label: "Rule fires", sub: "band the customer, apply the discount", tone: "c" },
        { label: "Decision", sub: "discount = 10%", tone: "ok" }
      ]
    },
    example: {
      caption: "POC-03 in rule form — collections applied to Sunrise Bank",
      lang: "text",
      code: `/* ===== 1. EXISTENCE: any disqualifying loan type? ===== */
definitions
    set 'the applicant' to a Applicant;
if
    there is a loan in the loans of 'the applicant' such that
        the type of this loan is one of { "PAYDAY", "INFORMAL" }
then
    set the eligibility of 'the response' to false;
    add "Disqualifying existing credit product"
        to the reasons of 'the response';


/* ===== 2. AGGREGATE: total debt too high? ===== */
definitions
    set 'the applicant' to a Applicant;
    set 'total debt' to the total of the outstanding of each loan
                        in the loans of 'the applicant';
if
    'total debt' is more than 200000
then
    set the eligibility of 'the response' to false;
    add "Total existing debt of " + 'total debt' + " exceeds the limit of 200,000"
        to the reasons of 'the response';


/* ===== 3. AGGREGATE + RATIO: debt-to-income ===== */
definitions
    set 'the applicant' to a Applicant;
    set 'total debt' to the total of the outstanding of each loan
                        in the loans of 'the applicant';
    set 'ratio' to 'total debt' / the annual salary of 'the applicant';
if
    the annual salary of 'the applicant' is more than 0
    and 'ratio' is more than 4
then
    set the eligibility of 'the response' to false;
    add "Debt-to-income ratio too high" to the reasons of 'the response';


/* ===== 4. UNIVERSAL, guarded against the empty case ===== */
definitions
    set 'the applicant' to a Applicant;
if
    the number of loans in the loans of 'the applicant' is at least 1
    and all loans in the loans of 'the applicant' have
        a months remaining of less than 6
then
    add "All existing loans mature within 6 months - favourable"
        to the reasons of 'the response';


/* ===== 5. PER-ITEM: act on each matching loan ===== */
definitions
    set 'the applicant' to a Applicant;
    set 'the loan' to a Loan in the loans of 'the applicant'
        where the outstanding of this is more than 100000;
then
    add "Large existing loan: " + the type of 'the loan'
        + " (" + the outstanding of 'the loan' + ")"
        to the messages of 'the response';

    /* fires ONCE PER large loan, not once overall */


/* ===== Applicant: CAR 180000/24m, PERSONAL 40000/12m, CARD 15000/6m ===== */
  Rule 1: no payday or informal loan          -> not fired
  Rule 2: total 235000 > 200000               -> FIRED
  Rule 3: salary 52000, ratio 4.52 > 4        -> FIRED
  Rule 4: 24 months is not < 6                -> not fired
  Rule 5: one loan over 100000 (CAR)          -> FIRED once

  reasons  = [ "Total existing debt of 235000 exceeds the limit of 200,000",
               "Debt-to-income ratio too high" ]
  messages = [ "Large existing loan: CAR (180000)" ]`,
      note: "Rule 3 guards against a zero salary before dividing. A divide-by-zero inside a rule condition throws at execution time and takes the whole decision service down with it — exactly the class of failure Phase 7 covers, and exactly the sort of thing a well-meaning rule author forgets."
    },
    quiz: {
      kind: "predict",
      prompt: "An applicant has NO existing loans (the list is empty). What does this rule do?",
      code: `if
    all loans in the loans of 'the applicant' have
        a months remaining of less than 6
then
    add "All loans mature soon - favourable" to the reasons of 'the response';`,
      options: [
        "Does not fire — there are no loans to check",
        "Fires — a universal condition is vacuously true for an empty collection",
        "Throws an exception",
        "Depends on the rule algorithm"
      ],
      answer: 1,
      explain: "'All items satisfy X' is true when there are no items — there is no counter-example. So an applicant with no loan history gets the favourable note intended for people whose loans are nearly repaid. Always pair a universal condition with a count check when the empty case should be treated differently. This is a genuine production bug pattern, not a quiz curiosity."
    },
    mistake: {
      title: "The collection rule silently never fires",
      symptom: "You wrote a rule over the applicant's loans, the applicant clearly has loans, and the trace shows the rule was never fired.",
      cause: "Almost always one of three things: (1) getLoans() returned null instead of an empty list; (2) the JSON field name did not match, so the collection was never populated; (3) a string comparison failed on case — the data says \"Car\" and the rule says \"CAR\".",
      fix: "Check in that order. Print the collection size in a function task at the start of the flow — if it is 0 or null, the problem is upstream of your rules, not in them. Initialise collections in the XOM. And use a BOM domain for type codes so the rule editor offers the exact values and case mismatches become impossible."
    }
  },

  /* ---------------------------------------------------------------- 3.5 */
  {
    id: "p3-t5",
    title: "Decision tables, advanced",
    minutes: 14,
    tag: "Authoring ★",
    intro: `Topic 2.9 covered the basics. Your roadmap says to become *very comfortable* with decision tables, because they are the artefact business users actually own — so here is the rest.

Four things separate a table that works from a table a business team can safely maintain for years:

1. **Templates** — constraining what a business user can put in each cell.
2. **Ordering and completeness** — deciding whether one row wins or all matching rows fire, and proving there are no holes.
3. **Structure** — merged cells, sensible column order, and knowing when to split into two tables.
4. **Governance** — who may change which column, and how a change is reviewed.

A well-built table is the closest thing ODM has to a self-documenting artefact: the policy and its implementation are the same object.`,
    jargon: [
      { term: "Column template", plain: "A definition constraining what a condition or action column accepts." },
      { term: "Domain", plain: "A fixed list of allowed values, presented as a dropdown in the cell." },
      { term: "Rule ordering", plain: "A table setting: do all matching rows fire, or only the first?" },
      { term: "Completeness check", plain: "ODM's analysis for gaps — input combinations no row covers." },
      { term: "Redundancy", plain: "Two rows that always fire together with identical actions." },
      { term: "Otherwise row", plain: "A final catch-all row matching anything not caught above." }
    ],
    sections: [
      {
        title: "Templates — the feature that makes tables safe",
        open: true,
        body: `Without a template, a condition cell is free text and a business user can write anything, including something that breaks the build.

With a template, you define the column once:

\`\`\`
Column: credit score
  Template: the credit score of the applicant is <between> <min> and <max>
  min: integer, 300..900
  max: integer, 300..900
\`\`\`

Now the cell only accepts two numbers in a valid range. The analyst gets a small form, not a text box. They can add rows, change thresholds and reorder — but cannot produce something that fails to compile.

This is how you hand real ownership to non-developers without handing over the risk. If you learn one advanced table feature, learn this one.`
      },
      {
        title: "Ordering, and the 'first match wins' pattern",
        open: true,
        body: `Two table modes:

**All matching rows fire.** Suits tables where rows are independent — each adds a fee, or appends a message.

**First match wins.** Suits classification: exactly one band, one rate, one outcome. Rows are evaluated top to bottom and evaluation stops at the first hit.

First-match-wins lets you write deliberately overlapping rows from most specific to most general, which is often far more readable than mutually exclusive ranges:

| # | Credit score | Existing loan | Rate |
|---|---|---|---|
| 1 | < 650 | any | DECLINE |
| 2 | any | yes | 12.0 |
| 3 | ≥ 750 | any | 8.5 |
| 4 | any | any | 10.5 |

Row 4 is the otherwise row. An applicant with a score of 720 and an existing loan matches rows 2 and 4; first-match-wins gives 12.0 unambiguously. Set the mode deliberately, and write it in the table's description so the next person knows.`
      },
      {
        title: "Completeness, redundancy and the checker",
        open: false,
        body: `Rule Designer analyses a table for:

- **Gaps** — combinations no row covers. Fix with an otherwise row.
- **Overlaps** — combinations several rows cover. Fine under first-match-wins, dangerous under all-match if the actions conflict.
- **Redundancy** — two rows that always match together and do the same thing. Harmless, but noise.

Make running the checker part of your definition of done for any table change, alongside running your test scenarios. It costs seconds and catches the errors that are hardest to find by reading.`
      },
      {
        title: "When to split a table",
        open: false,
        body: `Split when:
- Different columns are owned by different teams (pricing vs. risk).
- The table exceeds roughly six condition columns — combinations explode and nobody can reason about it.
- Some rows apply to one product and some to another. Two tables in two rule tasks, chosen by a ruleflow branch, beats one table with a product column.

Splitting also improves the trace: you can see which table produced the decision, rather than which of forty rows in one table did.`
      }
    ],
    diagram: {
      caption: "How a template turns a free-text cell into a safe form",
      kind: "flow",
      dir: "right",
      nodes: [
        { label: "Column template", sub: "author-defined, in Rule Designer", tone: "a" },
        { label: "Constrained cell", sub: "dropdown / number range only", tone: "b" },
        { label: "Business user edits", sub: "in Decision Center", tone: "b" },
        { label: "Always compiles", sub: "no syntax errors possible", tone: "ok" }
      ]
    },
    example: {
      caption: "The pricing table, upgraded: templates, first-match-wins, otherwise row",
      lang: "text",
      code: `DECISION TABLE: loan-pricing-v2
  ordering  : FIRST MATCH WINS   (evaluation stops at the first matching row)
  algorithm : Sequential

COLUMN DEFINITIONS (templates)
  C1  credit score
      template : the credit score of the applicant is between <min> and <max>
      min, max : integer 300..900         [constrained]
  C2  existing loan
      template : the applicant has an existing loan is <value>
      value    : domain { yes, no, any }  [dropdown]
  C3  total debt
      template : the total outstanding debt of the applicant is <op> <amount>
      op       : domain { at most, more than, any }
      amount   : decimal 0..10000000
  A1  interest rate
      template : set the interest rate of the response to <rate>
      rate     : decimal 0..30            [constrained]
  A2  decision
      template : set the decision of the response to <value>
      value    : domain { APPROVE, REFER, DECLINE }

+---+-------------+----------+---------------+--------+----------+
| # | credit      | existing | total debt    | rate   | decision |
|   | score       | loan     |               |        |          |
+---+-------------+----------+---------------+--------+----------+
| 1 | 300 .. 649  | any      | any           |   -    | DECLINE  |
| 2 | any         | any      | more than     |   -    | REFER    |
|   |             |          | 200000        |        |          |
| 3 | 750 .. 900  | no       | any           |  8.5   | APPROVE  |
| 4 | 750 .. 900  | yes      | any           |  9.5   | APPROVE  |
| 5 | 700 .. 749  | no       | any           | 10.5   | APPROVE  |
| 6 | 700 .. 749  | yes      | any           | 12.0   | APPROVE  |
| 7 | 650 .. 699  | any      | any           | 14.0   | REFER    |
| 8 | any         | any      | any           | 18.0   | REFER    |  <- otherwise
+---+-------------+----------+---------------+--------+----------+

WHY THIS ORDER
  Row 1 first  : a hard decline beats everything, no rate needed.
  Row 2 second : high total debt refers to a human, whatever the score.
  Rows 3-7     : normal pricing, most favourable first.
  Row 8        : otherwise. The table can never produce nothing.

COMPLETENESS CHECK
  credit score : [300,650) [650,700) [700,750) [750,900]  -> full range, no gap
  otherwise row present                                   -> no gap possible
  overlaps exist (rows 2 and 5, say) but ordering is FIRST MATCH -> intended

WORKED EXAMPLE: score 720, has existing loan, total debt 235000
  row 1 : 720 not in 300..649           -> no
  row 2 : total debt 235000 > 200000    -> MATCH -> decision = REFER, stop
  Rows 3-8 never evaluated.
  Note this beats row 6 (which would have priced at 12.0). Deliberate:
  the bank wants a human to look at any applicant with debt over 200k.`,
      note: "The 'WHY THIS ORDER' block is not decoration — write one for every first-match-wins table. Row order is now load-bearing logic, and six months from now the reason it is in that order must not live only in your head."
    },
    quiz: {
      kind: "predict",
      prompt: "Using the loan-pricing-v2 table above: applicant has credit score 780, no existing loan, total outstanding debt of 250,000. What decision and rate?",
      options: [
        "APPROVE at 8.5 (row 3)",
        "REFER, no rate (row 2)",
        "REFER at 18.0 (row 8)",
        "Both rows 2 and 3 fire"
      ],
      answer: 1,
      explain: "First match wins, so evaluation runs top down. Row 1: 780 is not in 300..649, no match. Row 2: total debt 250,000 is more than 200,000 — MATCH. Decision REFER, no rate set, and evaluation stops. Row 3 would have approved at 8.5 but is never reached. That is exactly the intended policy: high total debt always goes to a human, no matter how good the credit score."
    },
    mistake: {
      title: "Changing row order without realising it changes the policy",
      symptom: "A business user reorders rows in Decision Center to 'group them better', and applicants start getting different decisions.",
      cause: "Under first-match-wins, row order IS the logic. Moving a general row above a specific one makes the specific row unreachable.",
      fix: "Three defences: state the ordering mode prominently in the table description; document why the order is what it is, in the table itself; and keep a DVS scenario suite that runs on every change, so a reorder that alters an outcome fails a test rather than reaching a customer. If rows genuinely should be independent of order, use mutually exclusive ranges and all-match mode instead."
    }
  },

  /* ---------------------------------------------------------------- 3.6 */
  {
    id: "p3-t6",
    title: "Decision trees",
    minutes: 12,
    tag: "Authoring",
    intro: `A **decision tree** is a branching diagram. You start at the root, follow the branch matching your data, and keep going until you reach a leaf, which holds the outcome.

It expresses the same kind of logic as a decision table, but the shape suits a different problem. A table is best when the same few conditions repeat across every row. A tree is best when the questions you ask **depend on the answers to earlier questions**.

For Sunrise Bank: if the applicant is salaried, you want to know about employment tenure. If self-employed, you want years trading and tax filings. Those are different questions entirely — a table would need columns that are blank for half the rows, which is exactly the signal that a tree fits better.

Trees are visual and very good in a workshop with business stakeholders. They become unwieldy past three or four levels.`,
    jargon: [
      { term: "Decision tree", plain: "A branching structure: nodes ask questions, leaves hold outcomes." },
      { term: "Root", plain: "The first question, where every evaluation starts." },
      { term: "Node", plain: "A question with branches for each possible answer." },
      { term: "Leaf", plain: "An endpoint holding the action or outcome." },
      { term: "Path", plain: "One route from root to leaf — equivalent to one rule." }
    ],
    sections: [
      {
        title: "Tree or table? — the deciding question",
        open: true,
        body: `Ask: **do later questions depend on earlier answers?**

**No** — every case is judged on the same criteria → **decision table**. Credit score and existing loan apply to everyone, so pricing is a table.

**Yes** — the next question changes based on the last answer → **decision tree**. Employment type determines which income-evidence questions matter.

A practical smell: if a decision table has many blank or "any" cells clustered by row group, the logic is really a tree wearing a table's clothes.

The reverse smell: if a tree has the same sub-branch repeated under several parents, it is really a table.`
      },
      {
        title: "Reading and writing a tree",
        open: false,
        body: `Every root-to-leaf path is one rule. A tree with three top-level branches, each splitting two ways, is six rules — written once as a diagram rather than six times as text.

Two properties to check, exactly as with tables:

- **Every node must be exhaustive.** If a node branches on employment type with SALARIED and SELF_EMPLOYED, what happens to RETIRED? Add an "other" branch or the evaluation falls off the tree and produces nothing.
- **Every leaf must set an outcome.** A leaf that sets nothing is a silent gap.

Rule Designer will show you the tree graphically and will check for missing branches. Use it.`
      },
      {
        title: "Keeping trees maintainable",
        open: false,
        body: `- Three levels is comfortable. Four is the limit. Five means you should split into sub-decisions run by a ruleflow.
- Put the most discriminating question at the root — the one that most reduces the remaining cases.
- If a whole sub-tree repeats, extract it into its own tree or table and invoke it from a separate rule task.
- Name the tree after the decision it makes ("income-verification-route"), not after its inputs.`
      }
    ],
    diagram: {
      caption: "Income verification — the questions depend on the answers",
      kind: "split",
      head: { label: "What is the employment type?", sub: "root question" },
      branches: [
        { when: "SALARIED", label: "→ tenure ≥ 12 months? → payslips / full check", tone: "a" },
        { when: "SELF_EMPLOYED", label: "→ years trading ≥ 3? → tax returns / decline", tone: "b" },
        { when: "RETIRED", label: "→ pension income? → statements / manual referral", tone: "c" },
        { when: "other", label: "→ refer to underwriter", tone: "warn" }
      ]
    },
    example: {
      caption: "The Sunrise Bank income-verification tree, written out",
      lang: "text",
      code: `DECISION TREE: income-verification-route

the employment type of the applicant
│
├── "SALARIED"
│   └── the months in current job of the applicant
│       ├── is at least 12
│       │     LEAF: set verification to "PAYSLIP_3_MONTHS"
│       │           set the confidence of the response to "HIGH"
│       │
│       └── is less than 12
│           └── the credit score of the applicant
│               ├── is at least 750
│               │     LEAF: set verification to "PAYSLIP_3_MONTHS"
│               │           set the confidence of the response to "MEDIUM"
│               └── otherwise
│                     LEAF: set verification to "EMPLOYER_LETTER"
│                           set the confidence of the response to "LOW"
│
├── "SELF_EMPLOYED"
│   └── the years trading of the applicant
│       ├── is at least 3
│       │     LEAF: set verification to "TAX_RETURNS_2_YEARS"
│       │           set the confidence of the response to "MEDIUM"
│       └── is less than 3
│             LEAF: set verification to "MANUAL_UNDERWRITING"
│                   set the confidence of the response to "LOW"
│
├── "RETIRED"
│     LEAF: set verification to "PENSION_STATEMENT"
│           set the confidence of the response to "MEDIUM"
│
└── otherwise                      <-- the branch people forget
      LEAF: set verification to "MANUAL_UNDERWRITING"
            set the confidence of the response to "UNKNOWN"
            add "Unrecognised employment type"
                to the messages of the response;


PATH COUNT: 7 leaves = 7 rules, expressed as one reviewable diagram.

WHY NOT A TABLE?
  A table would need columns for: months in current job, years trading,
  pension income. Each is blank ("any") for two thirds of the rows.
  That blankness is the signal: the questions are conditional, so the
  logic is a tree.

WORKED EXAMPLE: Asha, SALARIED, 8 months in job, credit score 742
  root      -> "SALARIED"
  tenure    -> 8 is less than 12
  score     -> 742 is not at least 750 -> otherwise
  LEAF      -> verification = "EMPLOYER_LETTER", confidence = "LOW"`,
      note: "The 'otherwise' branch at the bottom is the whole lesson. Without it, an applicant whose employment type is UNEMPLOYED or a typo falls off the tree, no leaf fires, and the response carries whatever defaults it had. Every node needs a catch-all — the same discipline as a decision table's otherwise row."
    },
    quiz: {
      kind: "choose",
      prompt: "You are modelling: “credit score and existing-loan status determine the interest rate for every applicant, regardless of anything else.” Tree or table?",
      options: [
        "Decision tree — it has branching logic",
        "Decision table — the same two conditions apply to every case",
        "Neither, use action rules",
        "Both, one nested in the other"
      ],
      answer: 1,
      explain: "Both conditions apply to every applicant and neither depends on the other's answer, so it is a grid: a decision table. Use a tree when the next question depends on the previous answer — as with employment type deciding which income questions matter."
    },
    mistake: {
      title: "A node with no catch-all branch",
      symptom: "Most applicants get a decision. A few get nothing at all, and the ones that fail have something unusual in common.",
      cause: "A node branches on the values someone thought of at design time. Real data contains a value nobody listed — a new employment type, a null, a differently-cased string.",
      fix: "Every node gets an explicit 'otherwise' branch, and its leaf must do something visible: route to manual underwriting, set a flag, add a message naming the unexpected value. Silent gaps in a tree are harder to spot than in a table because you cannot see all the paths at once — so build the habit rather than relying on inspection."
    }
  },

  /* ---------------------------------------------------------------- 3.7 */
  {
    id: "p3-t7",
    title: "Scorecards",
    minutes: 13,
    tag: "Authoring",
    intro: `A **scorecard** replaces a yes/no decision with a number. Each attribute contributes points, the points are summed, and the total is banded into an outcome.

This is how real credit risk works. "Reject if credit score is below 700" is crude — it declines an applicant with a 695 score, a 200,000 salary and no debt, while approving someone at 701 who is drowning. A scorecard lets several factors compensate for each other.

Remember the \`RiskCheck\` interface from Phase 1 topic 1.4 — a list of checks, each returning points, all summed in a loop? A scorecard is precisely that, as a business-editable artefact. The Java version needed a developer to change a weighting; the scorecard needs a business user and five minutes.

Scorecards also carry **reason codes**: which factors contributed most to the score. Regulators frequently require that you can tell a declined applicant *why*, and a scorecard gives you that for free.`,
    jargon: [
      { term: "Scorecard", plain: "A rule artefact that accumulates points across attributes into a total score." },
      { term: "Attribute (scorecard)", plain: "One factor being scored, e.g. credit score band." },
      { term: "Bin", plain: "One value range within an attribute, with its own point allocation." },
      { term: "Partial score", plain: "The points contributed by one attribute." },
      { term: "Reason code", plain: "A label attached to a bin, explaining its contribution to the outcome." },
      { term: "Initial score", plain: "The baseline every applicant starts with before attributes are applied." }
    ],
    sections: [
      {
        title: "The anatomy of a scorecard",
        open: true,
        body: `1. **Initial score** — everyone starts at, say, 500.
2. **Attributes** — the factors: credit score, debt-to-income, employment tenure, existing loans.
3. **Bins** — ranges within each attribute, each worth points. Points can be negative.
4. **Total** — initial plus all partial scores.
5. **Banding** — a decision table or set of rules turning the total into an outcome.
6. **Reason codes** — attached per bin, collected as the score is computed.

Step 5 is worth noticing: the scorecard produces a *number*, not a decision. Turning the number into APPROVE / REFER / DECLINE is a separate, deliberately separate, artefact — so risk can retune weightings without touching the approval thresholds, and vice versa.`
      },
      {
        title: "Choosing weightings",
        open: false,
        body: `In a real bank, weightings come from statistical modelling on historical outcomes, not from intuition. Your job as the ODM developer is to implement what the risk team hands you, and to make it easy to retune.

What you *can* contribute:
- Make sure every attribute has a bin covering every possible value, including nulls and negatives.
- Make sure the bins do not overlap.
- Keep the score-to-outcome banding separate from the point allocations.
- Ensure reason codes exist for every negative bin — those are the ones you will have to explain to a customer.`
      },
      {
        title: "Scorecard or table? — and the honest answer",
        open: false,
        body: `**Scorecard** when factors compensate for one another and you want a continuous measure of risk. Strength on one factor can offset weakness on another.

**Decision table** when the policy is genuinely categorical — a hard regulatory floor is a hard floor, not something a good salary can outweigh.

Most real systems use both: hard knock-out rules first (under 21, sanctions match, disqualifying product), then a scorecard for everything that survives. Sunrise Bank's design does exactly that, which is why the ruleflow puts eligibility before pricing.`
      }
    ],
    diagram: {
      caption: "Points in, band out — and note the separation",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "Initial score: 500", sub: "everyone starts here", tone: "b" },
        { label: "+ credit score bin", sub: "742 → GOOD → +80", tone: "a" },
        { label: "+ debt-to-income bin", sub: "4.52 → HIGH → −120", tone: "a" },
        { label: "+ tenure bin", sub: "8 months → SHORT → −30", tone: "a" },
        { label: "+ existing loans bin", sub: "3 loans → MANY → −40", tone: "a" },
        { label: "Total: 390", sub: "the scorecard's only output", tone: "c" },
        { label: "Banding (separate artefact)", sub: "390 → 350..449 → REFER", tone: "ok" }
      ]
    },
    example: {
      caption: "The Sunrise Bank risk scorecard, fully worked",
      lang: "text",
      code: `SCORECARD: sunrise-risk-score
  initial score : 500

ATTRIBUTE 1 — credit score of the applicant
  +---------------+--------+---------------------------+
  | bin           | points | reason code               |
  +---------------+--------+---------------------------+
  | >= 800        |  +150  | CS_EXCELLENT              |
  | 750 .. 799    |  +120  | CS_VERY_GOOD              |
  | 700 .. 749    |   +80  | CS_GOOD                   |
  | 650 .. 699    |    +0  | CS_FAIR                   |
  | 600 .. 649    |   -80  | CS_POOR                   |
  | < 600         |  -200  | CS_VERY_POOR              |
  | null / absent |  -200  | CS_UNKNOWN   <- always bin the null case
  +---------------+--------+---------------------------+

ATTRIBUTE 2 — debt to income ratio of the applicant
  | <= 1.0        |  +100  | DTI_LOW                   |
  | 1.01 .. 2.5   |   +40  | DTI_MODERATE              |
  | 2.51 .. 4.0   |   -40  | DTI_ELEVATED              |
  | > 4.0         |  -120  | DTI_HIGH                  |

ATTRIBUTE 3 — months in current job
  | >= 36         |   +60  | TEN_LONG                  |
  | 12 .. 35      |   +30  | TEN_MODERATE              |
  | 6 .. 11       |   -30  | TEN_SHORT                 |
  | < 6           |   -70  | TEN_VERY_SHORT            |

ATTRIBUTE 4 — number of existing loans
  | 0             |   +50  | LOANS_NONE                |
  | 1 .. 2        |    +0  | LOANS_FEW                 |
  | 3 .. 4        |   -40  | LOANS_MANY                |
  | >= 5          |  -100  | LOANS_EXCESSIVE           |


BANDING (a separate decision table - deliberately not in the scorecard)
  +----------------+-----------+----------------------------+
  | total score    | decision  | note                       |
  +----------------+-----------+----------------------------+
  | >= 700         | APPROVE   | auto-approve               |
  | 550 .. 699     | APPROVE   | approve, standard pricing  |
  | 450 .. 549     | REFER     | underwriter review         |
  | 350 .. 449     | REFER     | underwriter, adverse       |
  | < 350          | DECLINE   | auto-decline               |
  +----------------+-----------+----------------------------+


=== WORKED: Asha Kulkarni ===
  credit score 742, salary 52000, total debt 235000 (ratio 4.52),
  8 months in current job, 3 existing loans

  initial                                        500
  credit score 742      -> 700..749    CS_GOOD    +80   -> 580
  DTI 4.52              -> > 4.0       DTI_HIGH  -120   -> 460
  tenure 8 months       -> 6..11       TEN_SHORT  -30   -> 430
  existing loans 3      -> 3..4      LOANS_MANY   -40   -> 390
                                                 -----
  TOTAL                                            390

  band 350..449 -> REFER (underwriter, adverse)

  reason codes returned, worst first:
     DTI_HIGH      (-120)   "Existing debt is high relative to income"
     LOANS_MANY     (-40)   "Several existing credit commitments"
     TEN_SHORT      (-30)   "Short time in current employment"

  Compare with the simple rule: credit score 742 >= 700, so the Phase 2
  ruleset would have APPROVED Asha outright. The scorecard sees the whole
  picture and sends the case to a human. That is the argument for scorecards.`,
      note: "The null bin on attribute 1 is not paranoia. If credit score arrives as null and there is no bin for it, the attribute contributes nothing at all — the applicant silently gets a free pass on the most important factor. Bin the null case on every attribute, every time."
    },
    playground: {
      caption: "The scorecard, running. Change any input and watch the band move.",
      code: `int creditScore = 742;
double dti = 4.52;          // debt to income ratio
int monthsInJob = 8;
int existingLoans = 3;

int score = 500;

// attribute 1 - credit score
if (creditScore >= 800)      { score += 150; }
else if (creditScore >= 750) { score += 120; }
else if (creditScore >= 700) { score += 80;  }
else if (creditScore >= 650) { score += 0;   }
else if (creditScore >= 600) { score -= 80;  }
else                         { score -= 200; }

// attribute 2 - debt to income
if (dti <= 1.0)      { score += 100; }
else if (dti <= 2.5) { score += 40;  }
else if (dti <= 4.0) { score -= 40;  }
else                 { score -= 120; }

// attribute 3 - months in current job
if (monthsInJob >= 36)     { score += 60; }
else if (monthsInJob >= 12){ score += 30; }
else if (monthsInJob >= 6) { score -= 30; }
else                       { score -= 70; }

// attribute 4 - number of existing loans
if (existingLoans == 0)     { score += 50; }
else if (existingLoans <= 2){ score += 0;  }
else if (existingLoans <= 4){ score -= 40; }
else                        { score -= 100; }

System.out.println("Total score: " + score);

if (score >= 700)      { System.out.println("APPROVE - auto"); }
else if (score >= 550) { System.out.println("APPROVE - standard pricing"); }
else if (score >= 450) { System.out.println("REFER - underwriter review"); }
else if (score >= 350) { System.out.println("REFER - underwriter, adverse"); }
else                   { System.out.println("DECLINE - auto"); }`,
      output: "Total score: 390\nREFER - underwriter, adverse"
    },
    quiz: {
      kind: "predict",
      prompt: "Using the scorecard above: credit score 780, DTI 0.8, 40 months in job, 0 existing loans. What is the total and the decision?",
      options: [
        "780 → APPROVE",
        "830 → APPROVE",
        "500 → REFER",
        "930 → APPROVE"
      ],
      answer: 1,
      explain: "Start at 500. Credit score 780 falls in 750..799 → +120 (620). DTI 0.8 is ≤ 1.0 → +100 (720). Tenure 40 months is ≥ 36 → +60 (780). Zero existing loans → +50 (830). Total 830, which is above 700, so APPROVE — auto-approve. Note the total is not the credit score; a common confusion when reading scorecard output."
    },
    mistake: {
      title: "An attribute value that matches no bin",
      symptom: "Some applicants score suspiciously high — or the score is inexplicably identical for very different profiles.",
      cause: "A value fell outside every bin: a null credit score, a negative salary, a debt-to-income ratio of infinity when salary is zero. The attribute contributes zero points, silently.",
      fix: "Cover the full possible range on every attribute, including null and impossible-but-real values. Give the null bin a deliberately unfavourable score so missing data never advantages an applicant. Then test each attribute with a null and an out-of-range value — four extra test cases per attribute, and they catch the failures that are hardest to notice because the output still looks plausible."
    }
  }

  ],

  quiz: [
    {
      q: "Your ruleset makes one pass over one applicant with no rule depending on another rule's output. Which algorithm is the sensible default?",
      options: ["RetePlus", "Sequential", "Fastpath", "Whichever is configured globally"],
      answer: 1,
      explain: "No chaining and no object updates means Sequential: fastest, most predictable, and easiest to reason about."
    },
    {
      q: "What does the `update` statement do under RetePlus?",
      options: ["Saves the object to a database", "Tells the engine the object changed so dependent rules are re-evaluated", "Increments the rule's priority", "Commits the ruleflow transaction"],
      answer: 1,
      explain: "It notifies the match network that an object changed, allowing forward chaining. Forget it and dependent rules may not re-fire; misuse it and you get an infinite loop."
    },
    {
      q: "Which is the most robust way to guarantee that approval rules run after rejection rules?",
      options: ["Give the approval rule a lower priority number", "Name the files so they sort alphabetically", "Put them in separate packages and order them as tasks in a ruleflow", "Rely on the order they were created"],
      answer: 2,
      explain: "A ruleflow makes the ordering explicit and visible as a diagram. Priority works but is invisible in the project; alphabetical naming and creation order are not guarantees at all."
    },
    {
      q: "An applicant has an empty loans list. What does “all loans in the loans of the applicant have a months remaining of less than 6” evaluate to?",
      options: ["False", "True — vacuously, since there is no counter-example", "It throws", "It does not evaluate"],
      answer: 1,
      explain: "Universal conditions are true over an empty collection. Guard with a count check whenever the empty case should behave differently."
    },
    {
      q: "In a first-match-wins decision table, what is the effect of moving a general row above a specific one?",
      options: ["No effect — ODM sorts rows by specificity", "The specific row becomes unreachable and the policy silently changes", "The table fails to compile", "Both rows fire"],
      answer: 1,
      explain: "Under first-match-wins, row order is the logic. A more general row placed higher shadows every specific row below it."
    },
    {
      q: "When is a decision tree a better fit than a decision table?",
      options: ["When there are more than ten rules", "When the questions you ask depend on the answers to earlier questions", "When business users need to edit it", "When performance matters"],
      answer: 1,
      explain: "Conditional questioning is the tree's signature. If the same conditions apply to every case, a table is clearer and easier to check for gaps."
    },
    {
      q: "In a scorecard, why bin the null case for every attribute?",
      options: ["ODM requires it", "Otherwise the attribute contributes zero points and missing data silently advantages the applicant", "To improve performance", "Because null is always a decline"],
      answer: 1,
      explain: "An unbinned value contributes nothing at all — no error, no points. Give the null bin an unfavourable score so absent data can never look like a good result."
    },
    {
      q: "Why keep the score-to-decision banding separate from the scorecard's point allocations?",
      options: ["ODM cannot combine them", "So risk can retune weightings and the business can retune approval thresholds independently", "It executes faster", "To reduce the number of rules"],
      answer: 1,
      explain: "Two different owners, two different change cadences. Separating them means either can change without re-testing the other's logic."
    }
  ]
};
