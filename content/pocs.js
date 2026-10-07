/* =========================================================================
   POC MILESTONES — POC-01 to POC-05
   Each has: Problem, Input, Rules, Expected Output, What I Learned,
   plus an "Explain like I'm interviewing" prompt and a notes area.
   ========================================================================= */

window.POCS = [

/* ---------------------------------------------------------------- POC-01 */
{
  id: "poc-01",
  code: "POC-01",
  title: "Loan Eligibility — basic rules",
  phase: 2,
  afterTopic: "p2-t10",
  repoFolder: "poc-01-basic-rules",
  estimate: "4–6 hours",
  summary: "Your first complete rule project: XOM, BOM, vocabulary, four action rules, tested locally.",

  problem: `Sunrise Bank pre-screens personal loan applications by hand. A loan officer checks four things on every application, which is slow and inconsistent between officers. The thresholds are reviewed every quarter, so hardcoding them into the banking application means a developer and a release for every policy change.

Build an ODM decision service that makes the pre-screening decision, so the business can change the thresholds without a code release.`,

  technology: [
    "IBM ODM Rule Designer",
    "Java (the XOM project)",
    "Local run configurations — no server yet, that is POC-04"
  ],

  input: [
    { field: "name", type: "String", example: "\"Asha Kulkarni\"", note: "not used in rules, but useful in messages" },
    { field: "age", type: "int", example: "28", note: "years" },
    { field: "annualSalary", type: "double", example: "45000.0", note: "local currency" },
    { field: "creditScore", type: "int", example: "742", note: "valid range 300–900" },
    { field: "hasExistingLoan", type: "boolean", example: "false", note: "any active loan" }
  ],

  rules: [
    { id: "R1", text: "An applicant under 21 is not eligible.", reason: "\"Applicant must be at least 21\"" },
    { id: "R2", text: "An applicant with annual salary below 30,000 is not eligible.", reason: "\"Minimum annual salary is 30,000\"" },
    { id: "R3", text: "An applicant with credit score below 700 is not eligible.", reason: "\"Minimum credit score is 700\"" },
    { id: "R4", text: "An applicant passing all three checks is eligible.", reason: "\"Meets all pre-screening criteria\"" }
  ],

  expected: [
    { name: "happy path", input: "28 / 45000 / 742", output: "eligible = true", note: "Meets all criteria" },
    { name: "under age", input: "19 / 52000 / 710", output: "eligible = false", note: "age reason only" },
    { name: "low salary", input: "30 / 22000 / 780", output: "eligible = false", note: "salary reason only" },
    { name: "low credit score", input: "35 / 60000 / 640", output: "eligible = false", note: "score reason only" },
    { name: "boundary — exactly at every limit", input: "21 / 30000 / 700", output: "eligible = true", note: "★ 'at least' means these values pass" },
    { name: "boundary — just under", input: "20 / 29999 / 699", output: "eligible = false", note: "all three reasons" },
    { name: "everything fails", input: "18 / 12000 / 500", output: "eligible = false", note: "★ do you get all three reasons, or just one?" }
  ],

  steps: [
    "Create the Java XOM project with Applicant and LoanResponse. Private fields, JavaBean getters, a no-arg constructor.",
    "Create the rule project and point it at the XOM.",
    "Import the XOM into the BOM.",
    "Edit the verbalizations — especially the boolean one. 'the applicant has an existing loan', not 'the has existing loan of the applicant is true'.",
    "Declare ruleset parameters: applicant (IN), response (IN_OUT).",
    "Write the four action rules, one file each, in a rules/eligibility package.",
    "Create run configurations for all seven test cases above.",
    "Enable tracing and run each one. Read the trace, do not just check the output.",
    "Optional stretch: rewrite R1–R3 as a single decision table and compare readability."
  ],

  learned: [
    "ODM's business vocabulary comes from JavaBean getters, so Java naming determines how readable your rules are.",
    "A rule whose correctness depends on execution order is a latent bug — the approval rule is the trap here.",
    "Two rules writing the same field means the last one wins, unpredictably. A list of reasons removes the problem.",
    "Boundary test cases find bugs that happy-path testing structurally cannot."
  ],

  watchFor: `**The approval rule is deliberately a trap.** The obvious way to write R4 is *"if the reason is null then eligible = true"*, which only works because it happens to run last. Write it that way first, notice the problem, then fix it by stating all three passing conditions explicitly. Getting that wrong on purpose teaches more than getting it right by accident.

**The other trap is the reason field.** Run the "everything fails" case and see which single reason survives. That is your motivation for changing \`reason\` (String) into \`reasons\` (List<String>).`,

  interviewPrompt: `Say this out loud, without notes, in about sixty seconds:

*"I built a loan pre-screening decision service. I started with a Java object model — the XOM — then imported it into a BOM where I edited the verbalizations so the rules read as English. Four action rules implement the policy. The interesting part was that my first version of the approval rule depended on firing order, which worked but was fragile — I rewrote it to state its own conditions."*

Then be ready for: **"What is the difference between the BOM and the XOM?"** — the most common ODM interview question there is. Answer it out loud too.`
},

/* ---------------------------------------------------------------- POC-02 */
{
  id: "poc-02",
  code: "POC-02",
  title: "Ruleflow — explicit execution order",
  phase: 3,
  afterTopic: "p3-t3",
  repoFolder: "poc-02-ruleflow",
  estimate: "4–6 hours",
  summary: "Restructure POC-01 so execution order is a visible diagram rather than an accident.",

  problem: `POC-01 works, but its correctness depends on rules happening to fire in a particular order. Add a fourth rejection rule and it breaks silently.

Restructure the same policy so that execution order is explicit, visible and reviewable — and so that whole stages can be skipped when they are not needed.`,

  technology: [
    "IBM ODM Rule Designer",
    "Ruleflow editor",
    "Rule packages",
    "Function tasks and branch nodes"
  ],

  input: [
    { field: "(same as POC-01)", type: "—", example: "—", note: "the input contract does not change" },
    { field: "employmentType", type: "String", example: "\"SALARIED\"", note: "new — used by the validation stage" }
  ],

  rules: [
    { id: "V1", text: "Validation: mandatory fields must be present and plausible.", reason: "\"INVALID_INPUT: …\"" },
    { id: "R1–R3", text: "Eligibility: the three rejection rules from POC-01, each appending to a reasons list.", reason: "one per failure" },
    { id: "R4", text: "Eligibility: approval, stating all three passing conditions explicitly.", reason: "\"Meets all pre-screening criteria\"" },
    { id: "M1", text: "Messaging: build the customer-facing text from the outcome.", reason: "—" }
  ],

  expected: [
    { name: "happy path", input: "28 / 45000 / 742", output: "eligible = true", note: "validation → eligibility → messaging" },
    { name: "invalid input", input: "age 0, salary 0", output: "INVALID_INPUT", note: "★ eligibility stage never runs" },
    { name: "rejected", input: "19 / 52000 / 710", output: "eligible = false", note: "★ messaging still runs, pricing does not" },
    { name: "multiple failures", input: "18 / 12000 / 500", output: "three reasons", note: "all failure rules contribute" }
  ],

  steps: [
    "Reorganise rules into packages: validation, eligibility, messaging.",
    "Add a validation rule that flags missing or implausible mandatory data.",
    "Create the ruleflow: START → initialise (function task) → validation → branch → eligibility → branch → messaging → STOP.",
    "Add a function task at the start that initialises response.eligible = false and response.reasons = empty list.",
    "Add the branch after validation that stops immediately on INVALID_INPUT.",
    "Change response.reason (String) to response.reasons (List<String>) and use add instead of set.",
    "Run all four cases with tracing on and confirm from the trace which tasks ran and which were skipped.",
    "Deliberately break it: add a fifth rejection rule and confirm nothing else needs changing. That is the payoff."
  ],

  learned: [
    "A ruleflow makes execution order a reviewable diagram instead of a property buried in each rule.",
    "Branching lets you skip whole stages — which is both faster and safer, since skipped rules cannot throw.",
    "Collecting reasons in a list removes an entire class of ordering problems.",
    "Adding a new rule to a well-structured ruleflow requires no changes anywhere else."
  ],

  watchFor: `**Do the final step.** Adding a fifth rejection rule and finding that nothing else breaks is the moment the value of a ruleflow becomes concrete rather than theoretical. In POC-01 that same change would have silently broken the approval rule.

**Keep the flow small.** Five to seven nodes. If it grows past that, you want a sub-flow — and noticing that now is better than discovering it at thirty nodes.`,

  interviewPrompt: `Practise: **"How do you control the order rules execute in?"**

*"Three ways, in increasing order of preference. Priority numbers work but are invisible — you can't see the order without opening every rule. A ruleflow makes it explicit as a diagram, and lets you skip whole stages with a branch. Best of all is restructuring so each rule states its own full condition and order stops mattering. In my POC-02 I moved from the first to the second, and used the third for the approval rule specifically."*

Then be ready to **draw the ruleflow** on paper while explaining it.`
},

/* ---------------------------------------------------------------- POC-03 */
{
  id: "poc-03",
  code: "POC-03",
  title: "Collections — rules over multiple objects",
  phase: 3,
  afterTopic: "p3-t4",
  repoFolder: "poc-03-collections",
  estimate: "5–7 hours",
  summary: "The applicant now has a list of existing loans. Aggregate over it, and meet the null-collection trap.",

  problem: `Real credit assessment does not look at one number. Sunrise Bank wants the applicant's existing loan commitments taken into account: total outstanding debt, debt-to-income ratio, and an outright block on certain credit products.

This is your roadmap's collection example, in the loan domain:

\`\`\`
Applicant → List of Loans → total outstanding → debt-to-income → decision
\`\`\``,

  technology: [
    "IBM ODM Rule Designer",
    "Collection conditions: existence, universal, aggregate",
    "Virtual BOM attributes with a B2X mapping"
  ],

  input: [
    { field: "(everything from POC-02)", type: "—", example: "—", note: "" },
    { field: "loans", type: "List&lt;Loan&gt;", example: "[{...}, {...}]", note: "★ initialise it in the XOM — never null" },
    { field: "loans[].type", type: "String", example: "\"CAR\"", note: "CAR, PERSONAL, CREDIT_CARD, PAYDAY, INFORMAL" },
    { field: "loans[].outstanding", type: "double", example: "180000.0", note: "" },
    { field: "loans[].monthsRemaining", type: "int", example: "24", note: "" }
  ],

  rules: [
    { id: "C1", text: "Existence: any PAYDAY or INFORMAL loan disqualifies the applicant.", reason: "\"Disqualifying existing credit product\"" },
    { id: "C2", text: "Aggregate: total outstanding debt above 200,000 disqualifies.", reason: "\"Total existing debt exceeds the limit\"" },
    { id: "C3", text: "Ratio: debt-to-income above 4 disqualifies. Guard against a zero salary.", reason: "\"Debt-to-income ratio too high\"" },
    { id: "C4", text: "Universal, guarded: if there is at least one loan and all mature within 6 months, note it as favourable.", reason: "informational" }
  ],

  expected: [
    { name: "no loans", input: "loans: []", output: "collection rules do not fire", note: "★ but C4 must not fire either — guard the empty case" },
    { name: "loans null", input: "loans: null", output: "★ what actually happens?", note: "test this deliberately" },
    { name: "high total debt", input: "3 loans, 235,000", output: "C2 and C3 fire", note: "two reasons" },
    { name: "payday loan", input: "one PAYDAY loan", output: "C1 fires", note: "regardless of amount" },
    { name: "zero salary", input: "salary 0, debt 50,000", output: "★ must not throw", note: "divide-by-zero guard" }
  ],

  steps: [
    "Add the Loan class to the XOM and a loans list to Applicant — initialised at declaration, with a null-safe setter.",
    "Re-import the BOM and verbalize the collection: 'the loans of {this}'.",
    "Add a virtual BOM attribute 'total outstanding debt' with a B2X mapping that sums the loans.",
    "Write C1 as an existence condition.",
    "Write C2 using the virtual attribute (or an inline aggregate — try both and compare readability).",
    "Write C3 with an explicit guard on zero salary before dividing.",
    "Write C4 as a universal condition, then test it with an empty list and observe that it fires. Then add the count guard.",
    "Test the null-collection case deliberately and record what happens in your notes."
  ],

  learned: [
    "Existence conditions fire once for the collection; binding in definitions fires once per matching item. Know which you want.",
    "A universal condition is vacuously true over an empty collection — always guard it with a count check.",
    "A null collection makes rules silently not fire, with no error at all. Initialising list fields in the XOM prevents it.",
    "A virtual BOM attribute lets the business have a concept the Java model does not, without a XOM change.",
    "Division inside a rule condition can throw at execution time. Guard the denominator."
  ],

  watchFor: `**Test the null-collection case on purpose.** Set \`loans\` to null (or omit it from the JSON) and see how each rule behaves. This is the single most valuable experiment in the whole POC series, because the failure is silent and you will meet it for real.

**C4 will fire for an applicant with no loans** before you add the count guard. Let it, once, then fix it. Seeing the vacuous-truth behaviour yourself is worth more than reading about it.`,

  interviewPrompt: `Practise: **"How do you write a rule that looks at a list of objects?"**

*"Three forms. Existence — 'there is a loan such that…' — fires once if any item matches. Universal — 'all loans have…' — which is vacuously true for an empty collection, so it needs a count guard. And aggregates: total, count, maximum. If several rules need the same aggregate I'll promote it to a virtual BOM attribute so it's defined in one place.*

*The trap I hit was a null collection. A rule iterating null doesn't fire and doesn't error — it just silently produces nothing. So I initialise list fields in the XOM at declaration."*`
},

/* ---------------------------------------------------------------- POC-04 */
{
  id: "poc-04",
  code: "POC-04",
  title: "Decision Server — deploy it",
  phase: 4,
  afterTopic: "p4-t5",
  repoFolder: "poc-04-decision-server",
  estimate: "5–8 hours",
  summary: "Package the ruleset as a RuleApp, deploy it, and execute it on a real server. Expect ClassNotFoundException.",

  problem: `Everything so far runs only in Rule Designer on your laptop. A decision service that cannot be called by anything is not a service.

Deploy the loan-eligibility ruleset to a Decision Server, verify it in the RES console, and understand ruleset versioning well enough to explain what happens when the policy changes.`,

  technology: [
    "IBM ODM Decision Server / Rule Execution Server",
    "RES console",
    "RuleApp and ruleset archives",
    "Managed XOM"
  ],

  input: [
    { field: "(unchanged from POC-03)", type: "—", example: "—", note: "the ruleset contract stays the same" }
  ],

  rules: [
    { id: "—", text: "No new business rules. This POC is entirely about packaging, deployment and versioning.", reason: "—" }
  ],

  expected: [
    { name: "ruleset visible in the console", input: "—", output: "SunriseLoanApp/1.0/loan-eligibility/1.0", note: "with today's date" },
    { name: "console test — happy path", input: "28 / 45000 / 742", output: "eligible = true", note: "must match the local run exactly" },
    { name: "console test — rejection", input: "19 / 52000 / 710", output: "eligible = false", note: "" },
    { name: "minor version deployed", input: "salary floor → 35,000", output: "1.1 replaces 1.0 at the same path", note: "★ callers pick it up automatically" },
    { name: "the ruleset path", input: "—", output: "written down", note: "POC-05 needs it" }
  ],

  steps: [
    "Configure the server connection in Rule Designer preferences and test it.",
    "Deploy the RuleApp, making sure to include the managed XOM.",
    "Open the RES console and find your ruleset. Note its version, deployment date and resources.",
    "Run the console test facility with the happy path. Confirm it matches your local result exactly.",
    "Change the salary threshold to 35,000, redeploy as version 1.1, and observe that both versions are now listed.",
    "Test 1.0 and 1.1 separately in the console and confirm they behave differently.",
    "Write down the exact ruleset path — POC-05 depends on it.",
    "Record every failure you hit and its cause. This is the richest 'what went wrong' section you will write."
  ],

  learned: [
    "'Deployment succeeded' means the archive installed. It says nothing about whether the ruleset can execute.",
    "The XOM must reach the server separately from the ruleset — as a managed resource or on the classpath.",
    "Minor versions route forward automatically; major versions coexist and must be requested explicitly.",
    "The RES console test facility is the fastest way to separate a rule problem from a caller problem."
  ],

  watchFor: `**You will hit ClassNotFoundException.** Almost everyone does on their first deployment. It is not a mistake — it is the design-time/run-time distinction becoming visible. Write down exactly what the error said and how you fixed it; this becomes one of your best interview answers.

**Do the versioning experiment properly.** Deploying 1.1 and seeing both versions resident, then testing each and getting different answers, is what makes ruleset versioning concrete. Skipping it means you can define versioning but not explain it.`,

  interviewPrompt: `Practise: **"Tell me about something that went wrong."**

*"My first ODM deployment. It reported success, and the first execution threw ClassNotFoundException on my Applicant class. It took me a while because 'deployment succeeded' had made me look at the rules. The cause was that Rule Designer reads the XOM from the Eclipse workspace, but the Decision Server needs it as a managed resource or on its classpath — two different places. I redeployed including the managed XOM and it worked.*

*What I took from it: deployment success only means the archive installed. Now I always run the console test straight afterwards. Twenty seconds, and it tells you whether the thing can actually execute."*

That answer shows a real failure, a correct diagnosis, and a practice that changed. It is worth more than any amount of correct theory.`
},

/* ---------------------------------------------------------------- POC-05 */
{
  id: "poc-05",
  code: "POC-05",
  title: "Java + REST integration",
  phase: 5,
  afterTopic: "p5-t6",
  repoFolder: "poc-05-java-rest-integration",
  estimate: "6–10 hours",
  summary: "Call the deployed ruleset from Postman, then from Java, with proper error handling. The capstone.",

  problem: `The ruleset is deployed but nothing calls it. Complete your roadmap's final diagram:

\`\`\`
Postman → REST API → ODM Decision Server → Ruleset → Decision → JSON Response
\`\`\`

Then do the same from Java, with the timeout handling, status checking and fallback behaviour a production caller needs.`,

  technology: [
    "HTDS (Hosted Transparent Decision Service)",
    "Postman — collection with test assertions",
    "Java 11+ HttpClient",
    "Jackson for JSON"
  ],

  input: [
    { field: "(the ruleset contract from POC-04)", type: "—", example: "—", note: "now expressed as JSON" },
    { field: "top-level keys", type: "—", example: "applicant, response", note: "★ the ruleset parameter names, exactly" }
  ],

  rules: [
    { id: "—", text: "No new business rules. This POC is about the integration layer.", reason: "—" }
  ],

  expected: [
    { name: "Postman — happy path", input: "28 / 45000 / 742", output: "200, eligible = true", note: "with a test assertion, not just a visual check" },
    { name: "Postman — all ten scenarios", input: "see topic 5.3", note: "★ especially the boundary cases", output: "all green" },
    { name: "Java client — happy path", input: "same", output: "same decision as Postman", note: "" },
    { name: "Java — missing field", input: "creditScore omitted", output: "★ what comes back?", note: "test it deliberately" },
    { name: "Java — service down", input: "wrong port", output: "fallback to manual review", note: "★ never approve on failure" },
    { name: "Java — wrong ruleset path", input: "typo in the path", output: "404 handled with a clear message", note: "" }
  ],

  steps: [
    "Find the HTDS endpoint. GET /DecisionService/rest to see what is deployed.",
    "Build a Postman request for the happy path. Get a 200 with the right decision.",
    "Build out all ten scenarios from topic 5.3, with test assertions on each.",
    "Run the whole collection in one click. All green.",
    "Write the Java client: DTOs, Jackson, HttpClient, with connect and request timeouts set.",
    "Add explicit handling for 400, 401/403, 404 and 5xx — each with a message naming the likely cause.",
    "Add a fallback that routes to manual review and never approves.",
    "Test the failure paths deliberately: stop the server, use a wrong path, omit a mandatory field.",
    "Commit the Postman collection to the repository alongside the Java."
  ],

  learned: [
    "HTDS exposes a ruleset as REST with no integration code — the parameters become the JSON structure.",
    "A 200 OK does not mean the data arrived. Unknown fields are silently discarded and missing ones get Java defaults.",
    "Check the HTTP status before deserialising, or an HTML error page becomes a baffling JSON parsing error.",
    "A fallback must never be more permissive than the rules it replaces.",
    "Postman is the reference implementation: if Postman works and Java does not, the bug is in the Java."
  ],

  watchFor: `**Test the failure paths, not just the happy path.** Stop the Decision Server and run your client. Use a deliberately wrong ruleset path. Omit a mandatory field. Each of these should produce a clear, specific message — and if it does not, that is the work.

**The boundary assertions matter most.** An applicant who is exactly 21 with exactly 700 must be eligible. A single \`>\` where the policy means \`>=\` is one character and one real person.`,

  interviewPrompt: `This is your capstone. Practise the full ninety-second walkthrough:

*"The application builds a JSON request whose top-level keys are the ruleset's input parameters, and POSTs it to the Decision Server's HTDS endpoint — the URL identifies the RuleApp and ruleset by name and version.*

*HTDS deserialises that into XOM objects and passes them as ruleset parameters. The execution unit loads the ruleset from cache and runs the ruleflow. Rules are written against the BOM, which maps back to those Java classes through B2X, so when a rule reads 'the credit score of the applicant' the engine calls getCreditScore() on the real object.*

*The rules populate the output object, which is serialised back as JSON with a 200.*

*The point of all this is that the rules deploy separately from the application — the business can change a threshold, deploy a new minor version, and every caller picks it up with no code change at all."*

Then be ready for: **"What happens when the decision service is down?"** You have a real answer now.`
}

];
