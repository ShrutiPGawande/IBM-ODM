/* =========================================================================
   PHASE 7 — Troubleshooting & Job Readiness
   The topic the original plan was missing. Enterprise work is not
   "create rule -> success".
   ========================================================================= */

window.PHASE_7 = {
  id: "phase7",
  number: 7,
  title: "Troubleshooting & Job Readiness",
  subtitle: "What happens when things break — and how to explain your work",
  goal: "Debug and investigate, not just build. Then be able to explain any of it out loud.",
  badge: { name: "Troubleshooter", icon: "🔧" },
  topics: [

  /* ---------------------------------------------------------------- 7.1 */
  {
    id: "p7-t1",
    title: "Input is null",
    minutes: 12,
    tag: "Failure mode ★",
    intro: `The first and most common failure. Something the rules expected is not there, and what happens next depends on *what* is null — which is exactly why this needs to be deliberate rather than discovered.

Three distinct cases, with three different behaviours:

**The whole parameter is null.** The ruleset was invoked with no applicant object at all. Rules with a definitions block matching \`a Applicant\` find nothing, so they never fire. You get a response with default values and no error.

**An attribute is null.** \`creditScore\` is null. A comparison against null is false, so the rule does not fire. Arithmetic on it may throw.

**A collection is null.** \`getLoans()\` returns null instead of an empty list. Every collection rule silently does nothing.

Notice the pattern: **null usually causes silence, not an exception.** That is what makes it dangerous. A crash tells you where to look; a wrong answer with a 200 OK does not.`,
    jargon: [
      { term: "Null parameter", plain: "A ruleset parameter that arrived with no object at all." },
      { term: "Silent failure", plain: "Wrong or absent behaviour with no error raised." },
      { term: "Guard condition", plain: "A rule condition checking for null before using a value." },
      { term: "Fail fast", plain: "Detecting a problem at the boundary and stopping immediately with a clear message." }
    ],
    sections: [
      {
        title: "What each null actually does",
        open: true,
        body: `| What is null | Behaviour | Error? |
|---|---|---|
| The whole IN parameter | Rules matching that type never fire | No |
| A String attribute | \`is "CAR"\` → false; \`is null\` → true | No |
| A numeric wrapper (Integer) | Comparison false; arithmetic may throw | Sometimes |
| A boolean wrapper (Boolean) | Condition false | Usually no |
| A collection | Existence false, aggregates 0 or throw | Usually no |
| A nested object | Navigating into it throws NPE | Yes |

That last row is the exception that proves the rule: \`the type of the primary loan of the applicant\` throws if \`primaryLoan\` is null. Everything else fails quietly.`
      },
      {
        title: "The defence, in three layers",
        open: true,
        body: `**Layer 1 — the XOM.** Initialise collections at declaration. Never let a getter return null for a list.
\`\`\`
private List<Loan> loans = new ArrayList<>();
public void setLoans(List<Loan> l) {
    this.loans = (l == null) ? new ArrayList<Loan>() : l;
}
\`\`\`

**Layer 2 — the caller.** Validate before invoking the ruleset. \`Objects.requireNonNull\`, explicit field checks, a clear exception naming the field.

**Layer 3 — a validation rule task.** The first stage of the ruleflow checks mandatory data and sets an explicit error state if it is missing.

Three layers sounds excessive until the first time a caller you do not control sends you a half-empty object.`
      },
      {
        title: "Testing for it",
        open: false,
        body: `Add these run configurations to every project:

- \`null-applicant\` — parameter not supplied at all
- \`null-credit-score\` — one mandatory attribute missing
- \`null-loans\` — collection null rather than empty
- \`empty-loans\` — collection present but empty (a *different* case)
- \`all-nulls\` — everything absent

The fourth is the one people forget. Empty and null are not the same, and rules behave differently for each. Test both.`
      }
    ],
    diagram: {
      caption: "Three kinds of null, three behaviours",
      kind: "columns",
      cols: [
        { title: "Parameter null", tone: "warn", items: ["No object to match", "Rules never fire", "No error", "Default response returned"] },
        { title: "Attribute null", tone: "warn", items: ["Comparisons false", "Rule does not fire", "Arithmetic may throw", "Plausible wrong answer"] },
        { title: "Collection null", tone: "bad", items: ["Existence false", "Universal may not evaluate", "Aggregates 0 or throw", "Silently no decision"] }
      ]
    },
    example: {
      caption: "The same applicant, four ways, and what each returns",
      lang: "text",
      code: `RULES UNDER TEST
  R1  if the credit score of 'the applicant' is less than 700
      then reject "Minimum credit score is 700"
  R2  if there is a loan in the loans of 'the applicant' such that
         the type of this loan is "PAYDAY"
      then reject "Disqualifying credit product"
  R3  if the age of 'the applicant' is at least 21
         and the annual salary of 'the applicant' is at least 30000
         and the credit score of 'the applicant' is at least 700
      then approve


=== CASE 1: everything present ===
{"applicant":{"age":28,"annualSalary":45000,"creditScore":742,"loans":[]}}
  R1 742 < 700 false -> skip
  R2 no loans        -> skip
  R3 all true        -> FIRE
  eligible = true                                     CORRECT


=== CASE 2: creditScore omitted (int -> 0) ===
{"applicant":{"age":28,"annualSalary":45000,"loans":[]}}
  R1 0 < 700 TRUE    -> FIRE, "Minimum credit score is 700"
  R3 0 >= 700 false  -> skip
  eligible = false                                    WRONG, and plausible
  -> the applicant is rejected for data we never received


=== CASE 3: creditScore is null (Integer type) ===
{"applicant":{"age":28,"annualSalary":45000,"creditScore":null,"loans":[]}}
  R1 null < 700  -> FALSE (not an error, just false)  -> skip
  R3 null >= 700 -> FALSE                             -> skip
  NO RULE FIRES.
  eligible = false (the Java default), reasons = []
  -> a rejection with no reason at all.               WORSE


=== CASE 4: loans is null, not [] ===
{"applicant":{"age":28,"annualSalary":45000,"creditScore":742,"loans":null}}
  R2 "there is a loan in null" -> no match            -> skip
  R3 fires, eligible = true
  -> Looks correct. But if the applicant DID have a payday loan and the
     field simply failed to serialise, we just approved someone we
     should have declined, with no indication anything was wrong.
                                                       DANGEROUS


=== THE FIX: a validation task, first in the ruleflow ===

  rules/validation/check-mandatory-fields.brl
    if the applicant is null
       or the age of 'the applicant' is 0
       or the annual salary of 'the applicant' is 0
       or the credit score of 'the applicant' is 0
       or the credit score of 'the applicant' is null
    then
       add "INVALID_INPUT: mandatory applicant data missing"
           to the reasons of 'the response';
       set the eligibility of 'the response' to false;

  ruleflow branch:
    if the reasons of 'the response' contains "INVALID_INPUT"
       -> STOP immediately, do not run eligibility

  Now case 2 and case 3 both return:
    eligible = false
    reasons  = ["INVALID_INPUT: mandatory applicant data missing"]

  A clear, actionable answer instead of a plausible wrong one.`,
      note: "Compare case 2's output with the fixed version. Both reject the applicant, but only one tells the caller that the request was incomplete. That difference is the entire point of a validation stage."
    },
    quiz: {
      kind: "predict",
      prompt: "`creditScore` is declared as `Integer` (not `int`) and arrives as null. The rule is “if the credit score is less than 700 then reject”. What happens?",
      options: [
        "The rule fires — null is treated as 0",
        "The rule does not fire — a comparison with null is false, and no error is raised",
        "A NullPointerException is thrown",
        "The ruleset returns HTTP 400"
      ],
      answer: 1,
      explain: "A comparison against null evaluates to false rather than throwing, so the rule silently does not fire. The applicant ends up with whatever defaults the response object had — often a rejection with no reason at all. This silence is precisely why null handling must be explicit."
    },
    mistake: {
      title: "Assuming null will cause an error",
      symptom: "No exception, no log entry, and a decision that is quietly wrong for a subset of requests.",
      cause: "Expecting nulls to fail loudly as they do in ordinary Java. In rule evaluation, a null usually just makes a condition false.",
      fix: "Never rely on nulls surfacing themselves. Initialise collections in the XOM, validate at the boundary in the caller, and make the first stage of every ruleflow a validation task that produces an explicit INVALID_INPUT outcome. Then test with nulls deliberately — an untested null path is an untested path."
    }
  },

  /* ---------------------------------------------------------------- 7.2 */
  {
    id: "p7-t2",
    title: "A required field is missing",
    minutes: 10,
    tag: "Failure mode",
    intro: `Closely related to null, but with its own signature: the field is not null, it simply never arrived — and JSON deserialisation quietly filled in a default.

An omitted \`int\` becomes 0. An omitted \`boolean\` becomes false. An omitted \`String\` becomes null. A misspelled key is treated as an unknown field and discarded.

The reason this deserves its own topic is that **the defaults are frequently valid-looking values**. Zero is a legitimate credit score as far as a comparison is concerned. False is a legitimate answer to "has an existing loan". The rules run happily and produce a confident, wrong decision.

And because HTDS ignores unknown fields rather than rejecting them, a typo in a field name looks identical to omitting it — with a request body that appears completely correct to a human reading it.`,
    jargon: [
      { term: "Default value", plain: "What a Java field holds when nothing sets it: 0, false, or null." },
      { term: "Unknown field", plain: "A JSON key with no matching attribute. Silently discarded." },
      { term: "Mandatory field", plain: "One the business requires to make a decision at all." },
      { term: "Sentinel value", plain: "A deliberately impossible value, such as -1, meaning 'not supplied'." }
    ],
    sections: [
      {
        title: "Distinguishing 'absent' from 'zero'",
        open: true,
        body: `The core problem: for a primitive \`int\`, absent and zero are indistinguishable after deserialisation.

Three ways out:

**1. Use wrapper types for optional numerics.** \`Integer creditScore\` instead of \`int\`. Absent becomes null, which is distinguishable from 0. Costs you a null check, buys you the truth.

**2. Use sentinel values.** Initialise to -1 in the XOM. Any field still at -1 was never supplied. Simple and effective, but you must remember what the sentinel means.

**3. Validate explicitly.** A validation task that rejects anything implausible: age 0, salary 0, credit score outside 300–900.

Option 3 is the most robust because it also catches values that arrived but are nonsense. Options 1 and 2 tell you *whether* something arrived; option 3 tells you whether it makes sense.`
      },
      {
        title: "Catching the typo case",
        open: true,
        body: `\`"creditscore": 742\` with a lowercase s is discarded, and \`creditScore\` stays 0. The request looks right, the response is 200, and the decision is wrong.

Two defences:

**Echo the inputs during development.** Have the ruleset write the key values it received into the response. Then a wrong decision is immediately diagnosable — you can see what actually arrived. Remove it, or gate it behind a debug flag, before production.

**Assert on decisions in integration tests, not status codes.** A test that only checks for 200 passes happily with a typo. A test that asserts "this applicant must be eligible" fails immediately.`
      }
    ],
    diagram: {
      caption: "Why a missing field is more dangerous than a malformed one",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "Field omitted or key misspelled", sub: "no error raised", tone: "warn" },
        { label: "Java default applied", sub: "int → 0, boolean → false", tone: "warn" },
        { label: "0 is a valid value for comparison", sub: "0 < 700 is true", tone: "bad" },
        { label: "Rules fire on false data", sub: "confidently", tone: "bad" },
        { label: "HTTP 200 + a plausible decision", sub: "nothing signals a problem", tone: "bad" }
      ]
    },
    example: {
      caption: "Detecting missing fields three different ways",
      lang: "text",
      code: `/* ===== OPTION 1: wrapper types in the XOM ===== */
public class Applicant {
    private Integer creditScore;      // Integer, not int
    private Integer age;
    private Double annualSalary;
    public Integer getCreditScore() { return creditScore; }
    // ... absent now arrives as null, not 0
}

  validation rule:
    if the credit score of 'the applicant' is null
    then add "MISSING: creditScore" to the reasons of 'the response';

  + absent is distinguishable from zero
  - every rule using it must tolerate null
  - a null in arithmetic still throws


/* ===== OPTION 2: sentinel values ===== */
public class Applicant {
    private int creditScore = -1;     // -1 means "not supplied"
    private int age = -1;
    private double annualSalary = -1;
}

  validation rule:
    if the credit score of 'the applicant' is -1
    then add "MISSING: creditScore" to the reasons of 'the response';

  + no nulls anywhere, arithmetic is always safe
  - -1 is magic; it must be documented and consistent
  - a caller could theoretically send -1


/* ===== OPTION 3: explicit range validation (recommended) ===== */

  rules/validation/check-applicant-data.brl

  if the age of 'the applicant' is less than 18
     or the age of 'the applicant' is more than 120
  then add "INVALID: age must be between 18 and 120, received "
           + the age of 'the applicant'
           to the reasons of 'the response';

  if the credit score of 'the applicant' is less than 300
     or the credit score of 'the applicant' is more than 900
  then add "INVALID: creditScore must be between 300 and 900, received "
           + the credit score of 'the applicant'
           to the reasons of 'the response';

  if the annual salary of 'the applicant' is at most 0
  then add "INVALID: annualSalary must be positive, received "
           + the annual salary of 'the applicant'
           to the reasons of 'the response';

  + catches BOTH missing (0) and nonsense (-5, 9999) values
  + the message names the field AND the value received
  + no XOM change required


/* ===== DEVELOPMENT AID: echo what arrived ===== */

  rules/validation/echo-inputs.brl      [property: debug=true]

  if the debug mode of 'the request' is true
  then add "RECEIVED age=" + the age of 'the applicant'
           + " salary=" + the annual salary of 'the applicant'
           + " creditScore=" + the credit score of 'the applicant'
           + " loans=" + the number of loans in the loans of 'the applicant'
           to the messages of 'the response';

  A typo in the JSON key is now visible in one glance at the response:
     "RECEIVED age=28 salary=45000.0 creditScore=0 loans=0"
                                                  ^^^^^^^^^^
  Gate it behind a flag and turn it off in production.`,
      note: "Option 3 produces the best error messages: 'creditScore must be between 300 and 900, received 0' tells the calling team exactly what to fix. Compare that with a silent rejection — one is a five-minute conversation, the other is a week of finger-pointing."
    },
    playground: {
      caption: "Watch a missing field become a confident wrong answer. Set creditScore to 742 to see the difference.",
      code: `// the caller omitted creditScore, so Java gave it the default
int age = 28;
int annualSalary = 45000;
int creditScore = 0;          // <-- never supplied

// --- the rules run, perfectly correctly, on false data ---
boolean eligible = true;
String reason = "Meets all pre-screening criteria";

if (age < 21) {
    eligible = false;
    reason = "Applicant must be at least 21";
} else if (annualSalary < 30000) {
    eligible = false;
    reason = "Minimum annual salary is 30,000";
} else if (creditScore < 700) {
    eligible = false;
    reason = "Minimum credit score is 700";
}

System.out.println("eligible: " + eligible);
System.out.println("reason:   " + reason);
System.out.println("HTTP 200 OK - nothing looks wrong");

// --- now the validation stage that should have run first ---
System.out.println("");
if (creditScore < 300 || creditScore > 900) {
    System.out.println("VALIDATION: creditScore must be 300-900, received " + creditScore);
} else {
    System.out.println("VALIDATION: input looks usable");
}`,
      output: "eligible: false\nreason:   Minimum credit score is 700\nHTTP 200 OK - nothing looks wrong\n\nVALIDATION: creditScore must be 300-900, received 0"
    },
    quiz: {
      kind: "choose",
      prompt: "A caller sends `\"creditscore\": 742` (lowercase s). The response is HTTP 200 with a rejection. What happened?",
      options: [
        "HTDS rejected the unknown field",
        "The unknown field was silently discarded, creditScore stayed 0, and 0 < 700 fired the rejection rule",
        "The value was coerced to the correct field",
        "The rule failed to compile"
      ],
      answer: 1,
      explain: "Unknown JSON fields are ignored, not rejected. The real attribute keeps its default of 0, which is a perfectly valid number to compare, so the rejection rule fires. The request looks correct to anyone reading it, which is what makes this failure so time-consuming without validation or input echoing."
    },
    mistake: {
      title: "Integration tests that only assert on the status code",
      symptom: "A green test suite and wrong decisions in production.",
      cause: "Tests check for HTTP 200 and nothing else. A field-name typo still returns 200, so nothing fails.",
      fix: "Every integration test asserts the actual decision: this applicant must be eligible, with this reason. A typo then fails a test on the day it is introduced. Add at least one test whose expected result depends on every mandatory field, so an omission anywhere breaks something."
    }
  },

  /* ---------------------------------------------------------------- 7.3 */
  {
    id: "p7-t3",
    title: "Wrong data type arrives",
    minutes: 10,
    tag: "Failure mode",
    intro: `This one, at least, tends to fail loudly — which makes it the friendliest failure in Phase 7.

Send \`"age": "twenty-eight"\` where an int is expected and HTDS cannot deserialise it. You get HTTP 400 with a message naming the field and the problem. Good.

The awkward cases are the ones that *can* be converted:

- \`"age": "28"\` — a numeric string. Some parsers coerce it, some reject it. Do not rely on either.
- \`"annualSalary": 45000\` where a double is expected — usually fine, integers widen to doubles.
- \`"creditScore": 742.0\` where an int is expected — may truncate, may reject.
- \`"hasExistingLoan": "true"\` — a string, not a boolean. Often coerced.
- \`"applicationDate": "10/09/2026"\` — is that September 10th or October 9th? Both parse. One is wrong.

That last one is the real danger. A date format mismatch produces a valid date with the wrong value, and no error at any point.`,
    jargon: [
      { term: "Type coercion", plain: "Automatically converting between types, e.g. \"28\" to 28." },
      { term: "Deserialisation error", plain: "Failure converting JSON into an object. Usually HTTP 400." },
      { term: "ISO-8601", plain: "The unambiguous international date format: 2026-09-10T14:30:00Z." },
      { term: "Precision loss", plain: "Losing information in a conversion, e.g. 742.9 becoming 742." }
    ],
    sections: [
      {
        title: "Dates — agree the format in writing",
        open: true,
        body: `\`10/09/2026\` is 10 September in most of the world and 9 October in the United States. Both parse successfully. One produces a wrong decision, silently, for a subset of dates.

Rules:
1. **Use ISO-8601 always:** \`2026-09-10\` or \`2026-09-10T14:30:00Z\`. Unambiguous by construction.
2. **Be explicit about time zones.** A date-only field in a service used across regions is a date that means different things at different moments.
3. **Write the format into the interface contract**, not into an assumption.
4. **Test with a date after the 12th of the month** — \`2026-09-15\` cannot be misread as a month, so it will expose a format mismatch that \`2026-09-10\` hides.

That last tip has found more real bugs than any amount of code review.`
      },
      {
        title: "Numeric precision",
        open: false,
        body: `Money in \`double\` is a classic source of trouble: \`0.1 + 0.2\` is not exactly \`0.3\` in binary floating point. For an eligibility threshold this rarely matters; for a currency total that must reconcile to the cent, it does.

If your rules compute monetary amounts that must be exact, use \`BigDecimal\` in the XOM. It is more awkward in rules, so make it a deliberate decision rather than a default.

For thresholds and comparisons, \`double\` is fine. Just be aware that \`salary is 30000\` may be false for a value that displays as 30000.0.`
      }
    ],
    diagram: {
      caption: "Three type problems, three very different consequences",
      kind: "columns",
      cols: [
        { title: "Unparseable", tone: "ok", items: ["\"age\": \"twenty-eight\"", "HTTP 400", "Names the field", "→ easy to fix"] },
        { title: "Coerced", tone: "warn", items: ["\"age\": \"28\"", "May work, may not", "Parser-dependent", "→ do not rely on it"] },
        { title: "Wrong but valid", tone: "bad", items: ["\"date\": \"10/09/2026\"", "Parses fine", "Wrong value", "→ no error, ever"] }
      ]
    },
    example: {
      caption: "Type failures ranked from most to least helpful",
      lang: "text",
      code: `=== 1. UNPARSEABLE — the friendly failure ===
{"applicant": {"age": "twenty-eight"}}

HTTP 400 Bad Request
{ "error": "Cannot deserialize value of type 'int' from String
            'twenty-eight': not a valid Integer value",
  "path":  "applicant.age" }

  Names the field, names the problem. Fix in two minutes.


=== 2. COERCIBLE — works, but do not depend on it ===
{"applicant": {"age": "28"}}

  Some configurations coerce "28" -> 28 and succeed.
  Others return 400.
  Behaviour can differ between ODM versions and parser settings.

  -> Send the correct JSON type. Never rely on coercion.


=== 3. PRECISION LOSS — quiet, small, occasionally expensive ===
{"applicant": {"creditScore": 742.6}}

  int field, value truncated to 742. No warning.
  Harmless here. Not harmless if the field were a monetary amount.


=== 4. DATE FORMAT — the dangerous one ===
{"applicant": {"applicationDate": "10/09/2026"}}

  Caller (UK)   meant: 10 September 2026
  Server (US locale) read: 9 October 2026

  Both are valid dates. No error at any layer.

  A rule like:
     if the application date of 'the applicant'
        is before 30/09/2026
     then apply the Q3 promotional rate

  ...silently applies the wrong rate for a whole class of applications,
  and only for dates where day <= 12. Dates from the 13th onward fail
  to parse in one locale and succeed in the other, which makes the bug
  intermittent and locale-dependent -- the worst combination.

  THE FIX
    contract: applicationDate is ISO-8601, "2026-09-10", UTC.
    validation rule:
      if the application date of 'the applicant' is null
         or the application date of 'the applicant'
            is after the current date
      then add "INVALID: applicationDate missing or in the future"
               to the reasons of 'the response';

  TEST TIP
    Always include a test date after the 12th: "2026-09-15".
    It cannot be misread as a month, so a format mismatch shows up
    immediately instead of hiding behind ambiguous dates.


=== 5. ENUM MISMATCH — case sensitivity ===
{"loans": [{"type": "Car"}]}

  BOM domain expects: CAR | PERSONAL | CREDIT_CARD
  "Car" matches nothing.

  Depending on configuration: either a 400, or the field is set to
  null and every rule testing the loan type silently does not fire.

  THE FIX
    Define a BOM domain so the rule editor offers exact values,
    and agree the exact enum strings in the interface contract.`,
      note: "Case 4 is worth reading twice. It is the only failure in this topic that produces no error at any layer, and the resulting bug is both intermittent and locale-dependent. Insisting on ISO-8601 in the interface contract eliminates it entirely, for free."
    },
    quiz: {
      kind: "choose",
      prompt: "Why is a date format mismatch more dangerous than sending a string where an int is expected?",
      options: [
        "Dates are more complex to parse",
        "A wrong-format date often parses successfully into a valid but incorrect value, so no error is ever raised",
        "Dates cannot be validated",
        "It only affects some time zones"
      ],
      answer: 1,
      explain: "10/09/2026 is a valid date in both interpretations, so every layer accepts it and the wrong value flows silently into the rules. A string where an int is expected fails immediately with a clear message. Loud failures are the good ones; this is the quiet kind."
    },
    mistake: {
      title: "Relying on the parser to coerce types for you",
      symptom: "The integration works in DEV and returns HTTP 400 in TEST, with no code change between them.",
      cause: "The caller sends \"28\" as a string. One environment's parser configuration coerces it; the other's does not.",
      fix: "Send correct JSON types from the start — numbers unquoted, booleans unquoted, dates ISO-8601. Agree the types explicitly in the interface contract and include a request example in the README. Coercion behaviour is configuration, and configuration differs between environments."
    }
  },

  /* ---------------------------------------------------------------- 7.4 */
  {
    id: "p7-t4",
    title: "The rule didn't fire — a debugging decision tree",
    minutes: 16,
    tag: "Failure mode ★★",
    intro: `The single most common thing you will say in an ODM project: *"why didn't my rule fire?"*

There is a systematic answer, and following it in order takes about five minutes. Guessing takes hours. This topic is the process — internalise it and you will look experienced faster than anything else on this roadmap.

The key insight: a rule not firing has exactly four possible causes, and they can be eliminated in a fixed order.

1. **The rule was never considered** — not in the executed rule task, or the task never ran.
2. **The rule was considered but its condition was false** — the data is not what you think.
3. **The rule fired but its effect was overwritten** — a later rule changed the same field.
4. **The rule fired but you are looking at the wrong output** — wrong version, wrong parameter, wrong environment.

Work through them in that order. Always in that order.`,
    jargon: [
      { term: "Considered", plain: "The engine evaluated the rule's conditions." },
      { term: "Fired", plain: "The conditions were true and the actions executed." },
      { term: "Rule selection", plain: "Which rules a rule task includes." },
      { term: "Working memory", plain: "The objects the engine can match rules against." }
    ],
    sections: [
      {
        title: "The process, step by step",
        open: true,
        body: `**Step 1 — turn tracing on and look at the trace.** Not at the rule. The trace answers most of this immediately.

**Step 2 — was the rule considered?** If it does not appear in the trace at all:
- Is it in a package the ruleflow actually runs?
- Did the ruleflow branch skip that task?
- Is the rule disabled, or outside its effective date range?
- Does the rule task's selection criteria include it?

**Step 3 — was it considered but not fired?** Then its condition was false:
- What data did the engine actually have? Echo it or check the trace.
- Is a value null? A comparison with null is false.
- String case mismatch — "Car" vs "CAR"?
- Boundary — is it \`>\` where the policy means \`>=\`?
- Is a collection null or empty?

**Step 4 — did it fire but the result disappeared?** Another rule overwrote the field. Look for other rules writing the same attribute; check firing order.

**Step 5 — are you even looking at the right thing?** Right ruleset version? Right environment? Right output parameter?

Ninety per cent of cases resolve at step 3, and the answer is almost always that the data was not what you assumed.`
      },
      {
        title: "Making the trace useful",
        open: true,
        body: `A trace that just says "0 rules fired" is not much help. Configure it to tell you more:

- Enable BOM information in traces so rule names are readable.
- Enable rule-level tracing to see conditions evaluated, not just rules fired.
- Add a debug rule at the start of the flow that echoes the key input values.

That last one is worth its weight. A single rule at the top of the ruleflow that appends the received values to a messages list turns "the rule didn't fire" into "ah, creditScore arrived as 0" in one glance.`
      },
      {
        title: "The four questions to ask yourself first",
        open: false,
        body: `Before touching anything:

1. **Did this ever work?** If yes, what changed — rules, data, deployment, or the caller?
2. **Does it work in Rule Designer with the same input?** If yes, it is a deployment or data problem, not a rule problem.
3. **Does it fail for all inputs or just some?** "Just some" tells you which condition to look at.
4. **What is the smallest input that reproduces it?** Reduce until nothing more can be removed.

Question 3 is the most powerful. If it fails only for applicants over 60, or only when the loans list is empty, you have already found the condition.`
      }
    ],
    diagram: {
      caption: "The debugging decision tree — follow it in order",
      kind: "split",
      head: { label: "My rule didn't fire", sub: "start here, with the trace open" },
      branches: [
        { when: "not in the trace at all", label: "Rule selection or ruleflow — wrong package, task skipped, rule disabled", tone: "a" },
        { when: "in the trace, not fired", label: "Condition false — check the actual data: null, case, boundary, empty collection", tone: "b" },
        { when: "fired, no effect visible", label: "Overwritten by a later rule — check who else writes that field", tone: "c" },
        { when: "everything looks right", label: "Wrong version, wrong environment, or wrong output parameter", tone: "warn" }
      ]
    },
    example: {
      caption: "A real debugging session, start to finish",
      lang: "text",
      code: `SYMPTOM
  "The payday-loan rejection rule never fires, even for applicants
   who clearly have a payday loan."

STEP 1 — get the trace
  Enable tracing in the run configuration. Re-run.

  Task 'eligibility': 5 rules considered
     skipped  reject-under-age
     skipped  reject-low-salary
     skipped  reject-low-credit-score
     skipped  reject-payday-loan          <-- considered, not fired
     FIRED    approve

  The rule IS being considered. So this is step 3: the condition is
  evaluating to false. Skip everything about ruleflows and selection.

STEP 2 — what data does the engine actually have?
  Add a temporary debug rule at the top of the flow:

    then add "DEBUG loans=" + the number of loans
                 in the loans of 'the applicant'
             to the messages of 'the response';

  Re-run:
    "DEBUG loans=0"

  The engine sees ZERO loans. But the request definitely had two.
  So the problem is upstream of the rules entirely.

STEP 3 — what was actually sent?
  Log the raw JSON the client produced:

    {"applicant":{"age":28,...,"loan":[{"type":"PAYDAY",...}]}}
                                ^^^^
  "loan", not "loans".

  Unknown field -> silently discarded. The loans collection was
  never populated, so it is empty, so the existence condition is
  false, so the rule does not fire.

STEP 4 — fix and verify
  Correct the client's field name to "loans". Re-run:
     "DEBUG loans=2"
     FIRED  reject-payday-loan
     eligible = false, "Disqualifying existing credit product"

STEP 5 — prevent the recurrence
  a) Validation rule: if the applicant has no loans AND the request
     claimed to include loan history, flag it.
  b) Postman test asserting a payday-loan applicant is rejected.
  c) Note it in the POC README under "What went wrong".

TOTAL TIME: about 8 minutes.
TIME IF YOU START BY REWRITING THE RULE: several hours, and the
rule was never the problem.


=== THE LESSON ===
Steps 1 and 2 were the whole investigation. The trace said the rule
was considered, so the condition was false; the debug rule said the
collection was empty, so the data never arrived. Two observations,
and the search space collapsed from "anywhere in the system" to
"the client's JSON".`,
      note: "Notice that no rule was changed. The most common outcome of a good ODM debugging session is discovering the rules were correct all along — which is exactly why you check the data before you touch the logic."
    },
    quiz: {
      kind: "choose",
      prompt: "The execution trace shows your rule as “considered” but not fired. What does this eliminate?",
      options: [
        "Nothing — it could still be any cause",
        "Rule selection and ruleflow problems — the rule was reached, so its condition evaluated false",
        "Data problems",
        "Deployment problems"
      ],
      answer: 1,
      explain: "'Considered' means the engine reached the rule and evaluated its conditions. So the ruleflow, rule selection, packaging and enablement are all fine — the condition simply was not true. That single observation eliminates an entire category of causes and points you straight at the data."
    },
    mistake: {
      title: "Rewriting the rule before looking at the data",
      symptom: "Several hours and three rule rewrites later, the original rule turns out to have been correct.",
      cause: "The symptom appeared in the rules, so the investigation started there. But 'the rule didn't fire' is far more often a data problem than a logic problem.",
      fix: "Never change a rule until you have seen what data the engine actually received. Turn on tracing, add a temporary debug rule echoing the key values, and confirm the inputs first. If the data is what you expected and the rule still does not fire, then look at the condition."
    }
  },

  /* ---------------------------------------------------------------- 7.5 */
  {
    id: "p7-t5",
    title: "Multiple rules conflict",
    minutes: 12,
    tag: "Failure mode",
    intro: `Two rules both fire and both write the same field. One wins. The question is whether you decided which, or whether the engine did.

Three distinct situations, often conflated:

**Genuine conflict** — two rules disagree. One approves, one declines. This is usually a *policy* problem, not a technical one: the business rules themselves are contradictory and somebody needs to decide.

**Accidental overwrite** — two rules both set \`reason\`, and the last one wins. The policy is fine; the implementation collapsed two independent facts into one field.

**Intended override** — a specific rule is *meant* to beat a general one. Perfectly legitimate, but it must be explicit.

The techniques from Phase 3 apply directly: priorities, ruleflow ordering, and restructuring so order does not matter. What Phase 7 adds is how to *detect* a conflict you did not know you had.`,
    jargon: [
      { term: "Conflict set", plain: "The rules that all match at the same moment." },
      { term: "Conflict resolution", plain: "How the engine decides which matching rule fires first." },
      { term: "Override", plain: "A rule deliberately superseding another." },
      { term: "Mutually exclusive", plain: "Conditions constructed so no two can be true at once." }
    ],
    sections: [
      {
        title: "Detecting conflicts before production does",
        open: true,
        body: `**1. The decision table gap-and-overlap checker.** Run it on every table. Overlaps under all-match mode with conflicting actions are exactly this problem, found at design time.

**2. Grep for who writes each field.** Search the rule project for every rule that sets \`response.eligible\`. If there are five, ask yourself what happens when two fire together. Do this once per output field; it takes ten minutes and finds real problems.

**3. Multi-failure test cases.** Test an applicant who fails on *everything*. That single case surfaces most accidental overwrites, and it is the case nobody writes because it feels unrealistic.

**4. Read the trace for double-writes.** With rule-level tracing, two rules writing the same attribute are visible in the execution log.`
      },
      {
        title: "The three fixes, in order of preference",
        open: true,
        body: `**Best — make the field additive.** If two rules both have something to say, do not make them fight over one slot. \`add\` to a list rather than \`set\` a string. The conflict dissolves.

**Good — make conditions mutually exclusive.** Restructure so no two rules can match the same case. Ranges that do not overlap, an explicit \`otherwise\`. Often this reveals that the policy itself was ambiguous.

**Acceptable — make the priority explicit.** A ruleflow ordering, or a priority number on a genuine override rule. Correct, but it means the behaviour is now encoded somewhere a reader has to go and find.

**Never — leave it to the engine.** "It works in testing" is not a design. The firing order among equal-priority rules in the same task is not something to build a policy on.`
      }
    ],
    diagram: {
      caption: "Three kinds of conflict, three responses",
      kind: "columns",
      cols: [
        { title: "Genuine conflict", tone: "bad", items: ["Rules disagree on the outcome", "The POLICY is contradictory", "Escalate to the business", "Do not resolve it in code"] },
        { title: "Accidental overwrite", tone: "warn", items: ["Both write one field", "Policy is fine", "Make the field a list", "Conflict disappears"] },
        { title: "Intended override", tone: "ok", items: ["Specific beats general", "Legitimate design", "Make it explicit", "Priority or ruleflow"] }
      ]
    },
    example: {
      caption: "Finding and fixing a real conflict",
      lang: "text",
      code: `=== THE SYMPTOM ===
"A VIP customer with a low credit score is sometimes approved and
 sometimes declined. Same data, different answers across environments."


=== WHO WRITES 'eligible'? ===
Search the rule project for rules setting response.eligible:

  reject-under-age          sets false
  reject-low-salary         sets false
  reject-low-credit-score   sets false
  approve                   sets true
  vip-override              sets true      <-- added last month
  sanctions-match           sets false

Six rules, one boolean field. That is the whole problem.


=== TRACE FOR THE FAILING CASE ===
Applicant: VIP, credit score 640

  FIRED  reject-low-credit-score   eligible := false
  FIRED  vip-override              eligible := true

  Both fire. Both are in the 'eligibility' task at default priority 0.
  Firing order is not specified, so the outcome depends on factors that
  can differ between environments and even between deployments.


=== IS THIS A GENUINE CONFLICT? ===
Ask the business: "should a VIP with a credit score of 640 be approved?"

Answer: "Yes, VIPs bypass the credit score check -- but NOT the
         sanctions check, and not the age check."

Good: the policy is clear. It was the implementation that was ambiguous.
This is an INTENDED OVERRIDE that was never made explicit.


=== FIX 1: make the override explicit and bounded ===

  rules/eligibility/reject-low-credit-score.brl
    if the credit score of 'the applicant' is less than 700
       and 'the applicant' is not a VIP customer         <-- added
    then set the eligibility of 'the response' to false;
         add "Minimum credit score is 700" to the reasons;

  Now the two rules are mutually exclusive. No ordering needed,
  and the exception is visible in the rule that grants it.

=== FIX 2: keep the sanctions rule absolutely last ===

  Sanctions must beat everything, including the VIP override.
  Make that explicit in the ruleflow rather than with a priority:

    Task: eligibility          (all the normal rules)
        |
        v
    Task: mandatory-blocks     (sanctions, fraud, regulatory)
        rule: sanctions-match
          if 'the applicant' is on the sanctions list
          then set the eligibility of 'the response' to false;
               add "REGULATORY_BLOCK" to the reasons;

  A separate, later rule task cannot be accidentally reordered, and
  the diagram tells any reviewer that regulatory blocks come last.

=== FIX 3: prevent the recurrence ===

  Test cases added:
    vip-low-score            -> approved
    vip-under-age            -> rejected (VIP does not bypass age)
    vip-sanctions-match      -> rejected (nothing bypasses sanctions)
    vip-low-score-sanctions  -> rejected, REGULATORY_BLOCK

  The last one is the important test: it proves the override hierarchy
  is what the business actually described.


=== WHAT MADE THIS HARD ===
vip-override was added a month after the original rules, by someone
who correctly implemented "VIPs bypass the credit check" -- but as a
NEW rule rather than as an exception on the EXISTING rule. Both were
individually correct. The combination was undefined.

  -> When adding an override, always ask: "what does this need to
     beat, and what must still beat it?" Write both down.`,
      note: "The last block is the real lesson. Both rules were correct in isolation, and the person who added the VIP rule did nothing obviously wrong. Conflicts in rule projects usually arrive this way — incrementally, from reasonable changes — which is why searching for 'who else writes this field' should be a habit before adding any rule that sets an outcome."
    },
    quiz: {
      kind: "choose",
      prompt: "Two rules both fire and both set `response.eligible` to opposite values, with no priorities set. What should you do FIRST?",
      options: [
        "Set a priority on one of them",
        "Ask the business what the correct outcome is for that case — the policy may be genuinely ambiguous",
        "Delete the newer rule",
        "Change the algorithm to RetePlus"
      ],
      answer: 1,
      explain: "A technical fix applied to an unclear policy just encodes a guess. Find out what should happen first. Often the business has a clear answer nobody wrote down — and once you have it, the implementation (mutually exclusive conditions, or an explicit ordered task) follows immediately and correctly."
    },
    mistake: {
      title: "Adding an override rule without checking what else writes that field",
      symptom: "A new rule works perfectly in its own test case and produces intermittent wrong results in combination with existing rules.",
      cause: "The new rule was written and tested in isolation. Its interaction with the five existing rules that write the same field was never considered.",
      fix: "Before adding any rule that sets an outcome field, search for every other rule that writes it. For each, ask what should happen if both fire. Then encode that answer — as a mutually exclusive condition, or as an ordered rule task — and add a test case for the combination, not just for the new rule alone."
    }
  },

  /* ---------------------------------------------------------------- 7.6 */
  {
    id: "p7-t6",
    title: "Deployment fails",
    minutes: 12,
    tag: "Failure mode",
    intro: `Deployment failures divide cleanly into two kinds, and telling them apart immediately halves your search space.

**Failed at deployment.** The archive would not install. You get an error straight away. Annoying, but honest — the message usually names the cause.

**Deployed successfully, failed at execution.** Far more common and far more confusing, because "deployment succeeded" tells you the archive installed and nothing more. It says nothing about whether the ruleset can actually run.

The archetype is \`ClassNotFoundException\` on the first call after a clean deployment. Nothing was wrong with the deployment; the XOM simply is not there.

This topic is a catalogue of the failures you will actually meet, with their signatures.`,
    jargon: [
      { term: "Deployment failure", plain: "The archive could not be installed on the server." },
      { term: "Execution failure", plain: "The ruleset installed but cannot run." },
      { term: "Classpath", plain: "Where the JVM looks for classes at run time." },
      { term: "Managed XOM", plain: "A XOM jar uploaded to the Decision Server with the ruleset." }
    ],
    sections: [
      {
        title: "The catalogue",
        open: true,
        body: `| Symptom | Almost always means |
|---|---|
| \`ClassNotFoundException\` at execution | XOM jar not on the server |
| \`NoSuchMethodError\` at execution | XOM jar is a different version from the one rules were built against |
| \`Ruleset not found\` (404) | Wrong path, wrong version, or not deployed where you think |
| 401 / 403 on deployment | Credentials or role missing |
| \`Ruleset parameter mismatch\` | Caller sends parameters that do not match the deployed signature |
| Deployment hangs | Server unreachable, wrong port, or a proxy in the way |
| Old behaviour after deploying | Caller pinned to an older version, or the ruleset cache not refreshed |
| Works in DEV, fails in TEST | Environment difference — XOM version, config, or ODM level |

Learn the first two by heart. Between them they account for most first-deployment problems, and both are classpath issues rather than rule issues.`
      },
      {
        title: "The five-minute triage",
        open: true,
        body: `1. **Did the deployment actually succeed?** Check the RES console, not the tool's output. Is the ruleset listed, with today's date?
2. **Test in the console.** Does it execute correctly there? If yes, the problem is the caller. If no, the problem is on the server.
3. **Check the resources.** Does the ruleset show the XOM jar it needs?
4. **Check the parameters.** Does the deployed signature match what the caller sends?
5. **Check the server log.** The full stack trace lives there, not in the HTTP response.

Step 5 is skipped surprisingly often. The HTTP 500 body is usually a sanitised summary; the server log has the actual exception and the line it came from.`
      }
    ],
    diagram: {
      caption: "Split the problem at the first fork",
      kind: "split",
      head: { label: "Deployment problem", sub: "start by asking: did it install?" },
      branches: [
        { when: "failed to install", label: "Auth, connectivity, or a malformed archive — the error usually names it", tone: "a" },
        { when: "installed, fails to execute", label: "XOM classpath, parameter signature, or a missing resource", tone: "warn" },
        { when: "installed, runs, wrong answer", label: "Wrong version being called, or stale cache", tone: "b" },
        { when: "works in DEV, not TEST", label: "Environment difference — compare versions and configuration", tone: "c" }
      ]
    },
    example: {
      caption: "Four real deployment failures and their diagnoses",
      lang: "text",
      code: `=== FAILURE 1: ClassNotFoundException ===
HTTP 500
java.lang.ClassNotFoundException: com.sunrise.model.Applicant
    at ilog.rules.res.xu...

DIAGNOSIS  The ruleset deployed. The engine cannot find the XOM classes.
CHECK      RES console -> ruleset -> Resources. Is the XOM jar listed?
FIX        Redeploy with 'include managed XOM', or place the jar on the
           application server's shared classpath.
PREVENT    Make XOM deployment part of the same pipeline step as the
           ruleset. Never a separate manual action.


=== FAILURE 2: NoSuchMethodError ===
HTTP 500
java.lang.NoSuchMethodError:
    com.sunrise.model.Applicant.getTotalOutstandingDebt()

DIAGNOSIS  A XOM jar IS present, but it is an older build without the
           method your rules were compiled against.
CHECK      Compare the jar's version/timestamp on the server against
           the one in your workspace.
FIX        Deploy the correct XOM version.
PREVENT    Version the jar in its filename (loan-xom-1.2.0.jar). An
           unversioned loan-xom.jar makes this failure invisible.


=== FAILURE 3: Ruleset not found ===
HTTP 404
{"error":"Ruleset /SunriseLoanApp/1.0/loan-elegibility/1.0 not found"}

DIAGNOSIS  Read the path character by character: "elegibility".
CHECK      RES console -> Explorer -> compare the exact string.
FIX        Correct the spelling in the caller.
PREVENT    Put the ruleset path in one configuration constant, never
           typed inline at each call site. Paths are case-sensitive.


=== FAILURE 4: old behaviour after a successful deployment ===
No error. The threshold change simply has no effect.

DIAGNOSIS  Three candidates, check in this order:
  a) The caller is pinned to an older MAJOR version. Minor versions
     route forward; major versions do not.
  b) A stale ruleset from an earlier manual deployment is still
     resident and being served.
  c) The ruleset cache has not picked up the change.
CHECK      RES console: which versions exist, and when was each
           deployed? Then test the NEW version directly in the console.
FIX        Depends which. Usually (a) -- point the caller at the right
           version, or use a minor bump so it routes forward.
PREVENT    Add a smoke test after every deployment that asserts a
           value which changed. "Deployment succeeded" is not evidence
           that anything is different.


=== THE GENERAL PRINCIPLE ===
"Deployment succeeded" means the archive installed.
It does NOT mean:
   - the XOM is available
   - the parameters match what callers send
   - the new version is the one being executed
   - anything at all about correctness

Always follow a deployment with a console test AND a smoke test
through the real calling path. Two minutes, and it converts a
silent failure into an immediate one.`,
      note: "Failure 4 is the one that costs the most time, because there is no error to search for. Something you changed had no effect, and every layer reports success. The smoke test that asserts a changed value is the only reliable defence."
    },
    quiz: {
      kind: "choose",
      prompt: "You deploy a threshold change. No errors anywhere, but behaviour is unchanged. What is the most likely cause?",
      options: [
        "The rule change did not save",
        "The caller is executing a different ruleset version from the one you deployed",
        "The Decision Server needs restarting",
        "The BOM is out of date"
      ],
      answer: 1,
      explain: "Silent no-change almost always means a version mismatch: the caller is pinned to an older major version, or a stale ruleset from an earlier deployment is still resident and being served. Check the RES console for which versions exist, then test the new one directly to confirm your change is in it."
    },
    mistake: {
      title: "Treating “deployment succeeded” as proof it works",
      symptom: "A deployment reported as complete, followed by a production incident hours later when the first real request arrives.",
      cause: "Deployment success only confirms the archive installed. It says nothing about the XOM, the parameters, or which version callers reach.",
      fix: "Every deployment ends with two checks: run the console test facility with a known input, and run one real call through the actual calling path asserting a value that your change affected. Two minutes, and it converts a silent failure into an immediate one — which is the entire difference between an inconvenience and an incident."
    }
  },

  /* ---------------------------------------------------------------- 7.7 */
  {
    id: "p7-t7",
    title: "The service errors, or returns unexpected data",
    minutes: 12,
    tag: "Failure mode",
    intro: `Two failures from the caller's side of the boundary.

**The service returns an error.** An HTTP status in the 400s or 500s. At least it is explicit — the status code narrows the cause immediately.

**The service returns unexpected data.** HTTP 200, but the body is not what you expected: a field missing, an extra field, a different shape, a null where you assumed a value. This is the one that breaks callers in production, because tests were written against the shape as it was.

Both come down to the same discipline: **the caller must not assume.** Check the status, check the shape, handle the unexpected, and decide in advance what to do when the decision service cannot answer.`,
    jargon: [
      { term: "Status code", plain: "The HTTP result number: 200 ok, 400 bad request, 500 server error." },
      { term: "Fallback", plain: "What the caller does when the service is unavailable." },
      { term: "Circuit breaker", plain: "A pattern that stops calling a failing service for a while instead of hammering it." },
      { term: "Idempotent", plain: "Safe to call more than once with the same effect. Decisions usually are." },
      { term: "Defensive parsing", plain: "Reading a response without assuming every field is present." }
    ],
    sections: [
      {
        title: "The status codes and what they mean here",
        open: true,
        body: `| Code | Meaning in an ODM context | Whose problem |
|---|---|---|
| 200 | Executed. **Still verify the content.** | — |
| 400 | Malformed JSON, wrong types, bad parameters | Caller |
| 401 / 403 | Authentication or authorisation | Caller/config |
| 404 | Ruleset path or version wrong | Caller/deployment |
| 500 | Exception during execution — often XOM or a rule throwing | Server |
| 503 | Server unavailable or overloaded | Infrastructure |
| Timeout | No response in time | Either |

A 500 is worth special attention: the response body is usually a sanitised summary, and the real stack trace is in the Decision Server log. Always go and look.`
      },
      {
        title: "Deciding what to do when it fails",
        open: true,
        body: `Answer this before you write the client, not during an incident:

**Fail the transaction.** Safest when a wrong decision is worse than no decision. Usually correct for lending — declining to answer beats guessing.

**Retry once.** Reasonable for a timeout or a 503, and safe because a decision call has no side effects. Do not retry a 400 — the request will still be malformed.

**Fall back to a safe default.** Route to manual review. Never fall back to "approve" — a service outage must not become an approval mechanism.

**Circuit-break.** If the service has failed twenty times in a row, stop calling it for a minute. Prevents a failing dependency from consuming all your threads.

Write your choice into the POC README. "What happens when the decision service is down?" is a question a good interviewer asks, and a considered answer is a strong signal.`
      },
      {
        title: "Defensive parsing",
        open: false,
        body: `Assume the response might not have what you expect:

\`\`\`
if (decision == null) { ... }
if (decision.getReasons() == null) { ... }   // or initialise in the DTO
\`\`\`

Better: initialise collection fields in the DTO exactly as you did in the XOM, so \`getReasons()\` never returns null. Phase 1's habits apply on both sides of the wire.

And log the raw response body when parsing fails. \`Unrecognized token '<'\` with no body logged is a much longer debugging session than the same message with the HTML error page attached.`
      }
    ],
    diagram: {
      caption: "What the caller must do with every response",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "Send the request", sub: "with a timeout set", tone: "a" },
        { label: "Did it respond at all?", sub: "no → timeout path, fallback", tone: "warn" },
        { label: "Check the status code", sub: "before touching the body", tone: "warn" },
        { label: "Parse defensively", sub: "assume fields may be absent", tone: "b" },
        { label: "Verify the decision makes sense", sub: "not just that it parsed", tone: "b" },
        { label: "Use it, or take the fallback", sub: "decided in advance", tone: "ok" }
      ]
    },
    example: {
      caption: "A client that handles every failure mode deliberately",
      lang: "java",
      code: `public LoanDecision decideWithFallback(Applicant applicant) {

    try {
        HttpResponse<String> response = send(applicant);
        int status = response.statusCode();

        // ---- 4xx: our fault, do not retry ----
        if (status == 400) {
            log.error("Decision service rejected our request. " +
                      "Body: {}", response.body());
            throw new IllegalStateException(
                "Malformed decision request - this is a code bug");
        }
        if (status == 401 || status == 403) {
            log.error("Not authorised to call the decision service");
            return manualReview("Decision service authorisation failure");
        }
        if (status == 404) {
            log.error("Ruleset not found at {} - check path and version",
                      endpoint);
            return manualReview("Decision service misconfigured");
        }

        // ---- 5xx: their fault, retry once ----
        if (status >= 500) {
            log.warn("Decision service returned {}. Retrying once.", status);
            response = send(applicant);
            if (response.statusCode() >= 500) {
                log.error("Decision service still failing: {} - {}",
                          response.statusCode(), response.body());
                return manualReview("Decision service unavailable");
            }
        }

        if (response.statusCode() != 200) {
            return manualReview("Unexpected status " + response.statusCode());
        }

        // ---- 200: parse defensively ----
        DecisionEnvelope envelope;
        try {
            envelope = MAPPER.readValue(response.body(), DecisionEnvelope.class);
        } catch (JsonProcessingException e) {
            // log the RAW BODY - this is what makes the next one quick
            log.error("Could not parse decision response. Raw body: {}",
                      response.body(), e);
            return manualReview("Unparseable decision response");
        }

        LoanDecision decision = envelope.getResponse();
        if (decision == null) {
            log.error("Response contained no decision object. Body: {}",
                      response.body());
            return manualReview("Empty decision response");
        }

        // ---- sanity-check the CONTENT, not just the shape ----
        if (!decision.isEligible()
                && (decision.getReasons() == null
                    || decision.getReasons().isEmpty())) {
            log.warn("Applicant declined with no reason given - " +
                     "possible missing-input problem upstream");
            return manualReview("Declined without a reason");
        }

        return decision;

    } catch (java.io.IOException e) {
        log.error("Could not reach the decision service at {}", endpoint, e);
        return manualReview("Decision service unreachable");

    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        return manualReview("Decision call interrupted");
    }
}

/** The fallback. Never approves. Always routes to a human. */
private LoanDecision manualReview(String why) {
    LoanDecision d = new LoanDecision();
    d.setEligible(false);
    d.setDecision("REFER");
    d.getReasons().add("Automated decision unavailable: " + why);
    return d;
}`,
      note: "Two details worth copying. The parse-failure branch logs the raw body — that single line turns 'Unrecognized token' into an instantly diagnosable problem. And manualReview never approves: a service outage must never become an approval path, whatever the pressure to keep applications flowing."
    },
    quiz: {
      kind: "choose",
      prompt: "The decision service is down. What is the WORST fallback behaviour for a loan eligibility check?",
      options: [
        "Fail the transaction and show an error",
        "Route the application to manual underwriting",
        "Default to approving the applicant so the flow is not blocked",
        "Retry once, then route to manual review"
      ],
      answer: 2,
      explain: "Defaulting to approve turns an infrastructure outage into an approval mechanism — the bank could approve applicants it would have declined, for the entire duration of the outage, with no record of why. Fail, or route to a human. A fallback must never be more permissive than the rules it replaces."
    },
    mistake: {
      title: "Parsing the response without checking the status",
      symptom: "A confusing JSON parsing error — “Unrecognized token '<'” — that tells you nothing about the real problem.",
      cause: "The response was an HTML error page from the application server. The code went straight to deserialisation and reported a parsing failure instead of the actual 404 or 500.",
      fix: "Check the status code first, always, and give each code a message naming the likely cause. When parsing does fail, log the raw response body — that one line converts a mystery into an obvious answer, at 3 a.m., for whoever is on call."
    }
  },

  /* ---------------------------------------------------------------- 7.8 */
  {
    id: "p7-t8",
    title: "Your debugging toolkit",
    minutes: 12,
    tag: "Method ★",
    intro: `Everything from topics 7.1–7.7, consolidated into a method you can apply to a failure you have never seen before.

The core principle: **bisect the system.** Every ODM decision passes through a fixed chain of layers. Rather than guessing which one failed, test at the midpoint and eliminate half the chain. Repeat. Four or five checks find anything.

\`\`\`
caller → JSON → HTTP → HTDS → ruleset → rules → response → caller
\`\`\`

The single most useful test is the RES console: it executes the ruleset directly, with no caller involved. Right answer there means the problem is above; wrong answer means it is below. One test, half the system eliminated.`,
    jargon: [
      { term: "Bisect", plain: "Test the midpoint to eliminate half the possibilities, then repeat." },
      { term: "Minimal reproduction", plain: "The smallest input that still shows the problem." },
      { term: "Known-good reference", plain: "A case you have proven works, to compare against." },
      { term: "Instrumentation", plain: "Temporary logging or debug output added to see what is happening." }
    ],
    sections: [
      {
        title: "The five tools, in order of use",
        open: true,
        body: `**1. The execution trace.** Which rules were considered, which fired, in what order. Answers most questions on its own. Turn it on and leave it on in DEV.

**2. The RES console test.** Executes the deployed ruleset directly. Splits caller problems from ruleset problems in thirty seconds.

**3. A temporary debug rule.** One rule at the top of the ruleflow echoing the key input values into the messages list. Turns "the rule didn't fire" into "the data was not what I thought".

**4. Postman.** Tests the REST layer independently of your Java. If Postman works and Java does not, the bug is in your client.

**5. The Decision Server log.** The full stack trace, which the HTTP response usually does not contain. Always check it for a 500.

Use them in that order. Each one eliminates a layer.`
      },
      {
        title: "The universal checklist",
        open: true,
        body: `When something is wrong and you do not know why:

1. ☐ **What exactly is wrong?** Wrong decision, no decision, an error, or slow? Different symptoms, different searches.
2. ☐ **Did it ever work?** If yes, what changed?
3. ☐ **Does it fail for all inputs or some?** "Some" identifies the condition.
4. ☐ **What is the minimal reproduction?** Strip everything not needed.
5. ☐ **What does the trace say?** Considered? Fired?
6. ☐ **What data did the engine actually receive?** Echo it. Do not assume.
7. ☐ **Does the RES console give the right answer for that input?** Splits the system in half.
8. ☐ **Which ruleset version is being executed?**
9. ☐ **What does the server log say?**
10. ☐ **What is the smallest change that fixes it?** And do you understand *why* it fixes it?

Question 10 matters. A fix you do not understand is a fix that will come back.`
      },
      {
        title: "Writing it down",
        open: false,
        body: `After every real debugging session, write four lines in your notes:

\`\`\`
SYMPTOM   what you saw
CAUSE     what it actually was
FIX       what you changed
PREVENT   what stops it happening again
\`\`\`

Three reasons this pays off. You will hit the same class of problem again. It becomes the "What went wrong" section of your POC README. And it is exactly the material an interviewer is fishing for when they ask about something that went wrong.

Four lines, two minutes, and it is the highest-return writing you will do.`
      }
    ],
    diagram: {
      caption: "Bisect the chain — test the midpoint, eliminate half",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "Symptom observed", sub: "wrong decision, error, or silence", tone: "warn" },
        { label: "RES console test — the midpoint", sub: "does the ruleset alone give the right answer?", tone: "b" },
        { label: "Right → problem is ABOVE", sub: "caller, JSON, HTTP, version", tone: "a" },
        { label: "Wrong → problem is BELOW", sub: "rules, data mapping, XOM", tone: "c" },
        { label: "Bisect again in that half", sub: "trace, debug rule, Postman, server log", tone: "b" },
        { label: "Cause found", sub: "write down symptom / cause / fix / prevent", tone: "ok" }
      ]
    },
    example: {
      caption: "A debugging notebook — four real entries",
      lang: "text",
      code: `=== notes/debugging-log.md ===

--------------------------------------------------------------
2026-09-03  POC-01
SYMPTOM   21-year-old applicants rejected for age
CAUSE     rule used 'is more than 21', policy says 'at least 21'
FIX       changed to 'is at least 21'
PREVENT   boundary test cases for every threshold: 20, 21, 22.
          Found by test case 'boundary-exact', not by the happy path.
--------------------------------------------------------------
2026-09-07  POC-02
SYMPTOM   approval rule fired for an applicant who failed on salary
CAUSE     approve rule tested 'reason is null'. A rejection rule had
          set 'reasons' (list) but not 'reason' (string), so the
          approve rule saw null and fired.
FIX       rewrote approve to state all three passing conditions
PREVENT   never write a rule whose condition depends on what another
          rule happened to leave behind. State your own conditions.
--------------------------------------------------------------
2026-09-11  POC-03
SYMPTOM   payday-loan rejection never fires
CAUSE     client JSON used "loan" instead of "loans"; unknown field
          silently discarded, collection stayed empty
FIX       corrected the field name in the client
PREVENT   debug rule echoing collection sizes at the top of the flow;
          Postman test asserting a payday applicant is rejected.
          Lesson: check the DATA before touching the RULE.
--------------------------------------------------------------
2026-09-16  POC-04
SYMPTOM   deployment succeeded, first execution threw
          ClassNotFoundException: com.sunrise.model.Applicant
CAUSE     XOM jar not deployed. Design time reads it from the Eclipse
          workspace; the server needs it as a managed resource.
FIX       redeployed with 'include managed XOM'
PREVENT   XOM deployment is now part of the same step, never separate.
          Always run the console test straight after deploying.
--------------------------------------------------------------

=== WHY THIS FILE IS WORTH KEEPING ===

1. Patterns emerge. Three of these four were data or configuration
   problems, not rule logic. That changes where you look first.

2. It writes your READMEs for you. Every entry is a "What went
   wrong" section, already drafted.

3. It answers the interview question. "Tell me about something that
   went wrong" has four specific, technically-precise answers here,
   each with a cause and a practice that changed as a result.

4. Two minutes each. Four entries, eight minutes total, and it is
   the most useful eight minutes on the whole roadmap.`,
      note: "Look at the pattern in entry 3 and 4: both were caused by a difference between what you assumed and what was actually there — a field name, a jar location. Most ODM debugging is closing that gap, which is why 'check the data first' is the single most valuable habit in this phase."
    },
    quiz: {
      kind: "choose",
      prompt: "What single test most quickly narrows down an ODM problem?",
      options: [
        "Rewriting the rule and seeing if it helps",
        "Running the same input through the RES console test facility",
        "Restarting the Decision Server",
        "Checking the BOM for errors"
      ],
      answer: 1,
      explain: "The console test executes the deployed ruleset with no caller involved. A correct answer means the rules and deployment are fine and the problem is above; a wrong answer means it is in the rules or data mapping. One test, thirty seconds, half the system eliminated. Nothing else comes close."
    },
    mistake: {
      title: "Changing things until it works",
      symptom: "The problem goes away, nobody knows why, and it returns three weeks later in a slightly different form.",
      cause: "Multiple changes made at once with no hypothesis. When it started working, the actual cause was never identified.",
      fix: "Form a hypothesis, make one change, test. If it does not help, change it back before trying the next thing. When it does work, make sure you can explain why — if you cannot, you have not finished. Then write the four lines: symptom, cause, fix, prevent."
    }
  },

  /* ---------------------------------------------------------------- 7.9 */
  {
    id: "p7-t9",
    title: "Explaining the architecture out loud",
    minutes: 12,
    tag: "Interview ★★",
    intro: `You can build it. Now practise saying it.

There is a real gap between understanding something and explaining it under mild pressure to someone who is evaluating you. The only way to close it is to say it out loud, several times, ideally to another person.

This topic gives you the three explanations you need, at three lengths:

- **Thirty seconds** — what ODM is and why it exists.
- **Ninety seconds** — the architecture, end to end.
- **Five minutes with a whiteboard** — the full flow, drawn while talking.

Practise the whiteboard version most. Drawing while talking is genuinely harder than it sounds, and being fluent at it is disproportionately impressive because it is obvious you have done it before.`,
    jargon: [
      { term: "Whiteboard round", plain: "An interview stage where you explain something while drawing it." },
      { term: "Elevator pitch", plain: "A very short summary deliverable from memory." },
      { term: "Signposting", plain: "Telling the listener the structure before the detail: 'there are three parts…'" }
    ],
    sections: [
      {
        title: "The thirty-second version",
        open: true,
        body: `> "ODM is IBM's business rules management system. The idea is that business logic which changes often — eligibility criteria, pricing, risk thresholds — shouldn't be hardcoded in the application, because then every policy change needs a developer and a release.
>
> Instead the rules live in their own artefact, written in near-English so a business analyst can read and edit them, and deployed as a decision service the application calls. The bank changes a threshold in the morning and it's live in the afternoon, with no code change."

That is the whole pitch. Notice it leads with the *problem*, not the product. Anyone can recite what ODM contains; explaining why it exists shows you understand it.`
      },
      {
        title: "The ninety-second architecture answer",
        open: true,
        body: `> "There are three components. **Rule Designer** is the Eclipse-based IDE where a developer sets the project up. **Decision Center** is the web application where business users author and govern the rules. **Decision Server** is the runtime that executes them.
>
> The data flow has a specific shape. You start with your Java classes — the **XOM**, the execution object model, the real objects the engine runs against. You import that into a **BOM**, the business object model, which is a business-facing view where you rename things, hide technical fields and write **verbalizations** — so \`getCreditScore()\` becomes 'the credit score of the applicant'. Rules are written in that vocabulary, and the BOM maps back to the Java through the **B2X mapping**.
>
> At run time the application sends a request — usually JSON to a REST endpoint that ODM exposes automatically through **HTDS**. That's deserialised into XOM objects, passed to the ruleset as parameters, and a **ruleflow** controls which groups of rules run in which order. The rules populate an output object, which is serialised back as the response.
>
> The reason for the BOM layer specifically is insulation: rename a Java field and you repoint one mapping instead of editing every rule that used it."

Practise until you can say it without the words "um" or "basically". Time yourself.`
      },
      {
        title: "The whiteboard version",
        open: false,
        body: `Draw as you talk, top to bottom:

\`\`\`
   Application / Postman
            ↓  JSON
        HTDS (REST)
            ↓
   Decision Server / XU
            ↓
        Ruleset
            ↓
        Ruleflow
       ↙    ↓    ↘
  validate eligible price
            ↓
   Rules ── written against ──> BOM ──B2X──> XOM (Java)
            ↓
      Response object
            ↓  JSON
      back to the caller
\`\`\`

Two things that make this land:
1. **Draw the boxes before adding the arrows.** It looks planned rather than improvised.
2. **Say what fails at each box** as you draw it — that is what separates someone who has run this from someone who has read about it.

Practise on paper five times. It takes fifteen minutes and it will feel completely different from having only read the diagram.`
      }
    ],
    diagram: {
      caption: "The diagram to be able to draw from memory",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "Application / Postman", sub: "builds the JSON request", tone: "a" },
        { label: "HTDS (REST endpoint)", sub: "auto-exposed, no integration code", tone: "a" },
        { label: "Decision Server / execution unit", sub: "loads the cached ruleset", tone: "b" },
        { label: "Ruleflow", sub: "validate → decide → price → message", tone: "b" },
        { label: "Rules ← vocabulary ← BOM ← B2X → XOM", sub: "business language, real Java underneath", tone: "c" },
        { label: "Response object → JSON", sub: "the decision", tone: "ok" }
      ]
    },
    example: {
      caption: "Six questions, six answers, prepared from your own work",
      lang: "text",
      code: `Q1: "What is the difference between BOM and XOM?"
  The XOM is the real Java the engine executes against. The BOM is a
  business-facing view of it, where I control names, visibility and
  the verbalizations. B2X maps each BOM member back to the Java.
  The value is insulation — rename a Java field and you fix one
  mapping, not twelve rules. I hit that exactly in POC-03.

Q2: "How do you decide between a decision table and action rules?"
  A table when the same few conditions repeat with different values —
  pricing bands, for instance. Action rules when each rule's conditions
  are genuinely different. If a table has lots of blank cells clustered
  by row group, the logic is really a tree; if action rules are the
  twelfth near-identical copy, it should have been a table.

Q3: "A rule isn't firing. Walk me through what you do."
  First the trace. If the rule isn't listed at all, it's a ruleflow or
  rule-selection problem. If it's considered but not fired, the
  condition is false — so I check what data the engine actually
  received, usually with a temporary debug rule, before I touch the
  rule itself. Most of the time the rule was correct and the data
  wasn't what I assumed. I had exactly that in POC-03: a field named
  "loan" instead of "loans", silently discarded.

Q4: "When would you not use a rules engine?"
  When the logic doesn't change and nobody outside development reads
  it. And I'd keep transformation and plumbing out of rules entirely —
  the ruleset should receive clean data, decide, and return. Rules that
  aren't expressing business policy make the ruleflow unreadable.

Q5: "How are rules tested?"
  Three levels. Run configurations with the execution trace for
  development. DVS scenarios from an Excel workbook for regression,
  which business users can own. And a Postman collection with test
  assertions against the deployed service. I always include boundary
  cases — exactly 21, exactly 700 — because those found two real bugs
  in my first POC that happy-path testing couldn't have.

Q6: "How would you explain ODM to a business stakeholder?"
  Your lending policy currently lives inside application code, so
  changing a threshold means a developer, a release and three weeks.
  ODM moves that policy into a form you can read and change yourself,
  with an approval workflow and a full history of who changed what.
  The application asks a question and gets an answer; you own the
  logic behind the answer.


=== HOW TO PRACTISE ===
Record yourself answering each one. Play it back.
You will hear the filler words, the places you lose the thread, and
the answers that trail off. Ten minutes of this is worth more than
another hour of reading.`,
      note: "Every one of these answers references something specific you did. 'I hit that exactly in POC-03' is worth more than any amount of correct-but-generic explanation, because it cannot be faked and it invites a follow-up you are prepared for."
    },
    quiz: {
      kind: "choose",
      prompt: "Which answer to “what is the BOM for?” is strongest in an interview?",
      options: [
        "It's the business object model",
        "It's a business-facing view of the XOM that gives insulation — I renamed a Java field in POC-03 and only had to repoint one B2X mapping instead of editing every rule",
        "It maps to the XOM",
        "It's where the vocabulary comes from"
      ],
      answer: 1,
      explain: "It defines the concept, states the benefit, and grounds it in something you actually did. The others are definitions that could come from a glossary. Specificity is what makes an answer credible, and the concrete example invites a follow-up question you are ready for."
    },
    mistake: {
      title: "Understanding it perfectly and explaining it badly",
      symptom: "You know the material, but the explanation comes out tangled, jumps around, and loses the thread halfway.",
      cause: "Never having said it out loud. Reading and explaining use different skills, and only one of them gets practised by studying.",
      fix: "Say each answer out loud at least three times — to a colleague, a friend, or a recording. Signpost the structure first ('there are three components…') so both you and the listener know where the answer is going. And practise the whiteboard diagram on paper until the boxes come out in the right order without thinking about it."
    }
  },

  /* ---------------------------------------------------------------- 7.10 */
  {
    id: "p7-t10",
    title: "Requirements to rules — reading what the business gives you",
    minutes: 14,
    tag: "Job skill ★",
    intro: `On a real project nobody hands you a clean specification. You get a spreadsheet, an email thread, a policy document written in 2019, and a meeting where two people disagree about what "recent" means.

Turning that into rules is a large part of the job, and it is mostly about asking good questions. The technical implementation is usually the easy half.

Four things to extract from any requirement:

1. **The conditions** — what is being tested, and against what values.
2. **The outcomes** — what happens when each condition holds.
3. **The boundaries** — is it "over 700" or "at least 700"? These are never stated and always matter.
4. **The gaps** — what happens in the cases nobody mentioned.

Point 4 is where most production incidents come from. The requirement covers the cases the author thought of; reality supplies the others.`,
    jargon: [
      { term: "Requirement", plain: "A statement of what the system should do, usually from a business stakeholder." },
      { term: "Ambiguity", plain: "A statement that can reasonably be read more than one way." },
      { term: "Edge case", plain: "An unusual but possible input the requirement did not address." },
      { term: "Acceptance criteria", plain: "The agreed, testable definition of 'this works'." },
      { term: "Decision model", plain: "The structured form of a policy: inputs, rules, outputs." }
    ],
    sections: [
      {
        title: "The questions to ask about every requirement",
        open: true,
        body: `**On boundaries:**
- "Over 700" — does exactly 700 pass?
- Is the range inclusive at both ends?
- What about zero? Negative? Extremely large?

**On missing data:**
- What if this field is not supplied?
- Is it mandatory, or is there a default?

**On combinations:**
- What if two of these conditions are true at once?
- Which takes precedence?
- Can they both apply?

**On exceptions:**
- Are there customers this does not apply to?
- Who can override it, and is that recorded?

**On time:**
- When does this take effect?
- Does it apply to applications already in progress?
- Does the old rule still need to run for historical cases?

Bring these to the requirements meeting. Asking them makes you visibly useful and saves the project from three future incidents.`
      },
      {
        title: "From prose to a decision model",
        open: true,
        body: `Take any requirement and force it into four columns:

| Input | Condition | Outcome | Source |
|---|---|---|---|
| creditScore | < 700 | decline, reason | Policy v3 §2.1 |
| age | < 21 | decline, reason | Policy v3 §1.4 |
| … | … | … | … |

Three benefits. It exposes gaps immediately — a condition with no outcome, or an input tested nowhere. It gives you the decision table structure directly. And the source column means that in a year, when someone asks why the threshold is 700, you can answer.

If a requirement will not fit in the table, it is usually because it is ambiguous. That is useful information, not an obstacle.`
      },
      {
        title: "A worked translation",
        open: false,
        body: `**What you receive:**

> "We should decline applicants with poor credit, unless they're existing customers in good standing, in which case we can be a bit more flexible. Obviously anyone with a recent default is out."

**What is unspecified:**
- "poor credit" — what score?
- "existing customer" — for how long?
- "good standing" — defined how?
- "a bit more flexible" — how much?
- "recent" — how many months?
- "default" — any default, or over an amount?
- Does the default rule beat the existing-customer exception? (Almost certainly, but ask.)

Seven questions from one sentence. That is normal, and asking them is the job — not a sign you failed to understand.`
      }
    ],
    diagram: {
      caption: "From prose to something you can implement",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "Prose requirement", sub: "email, policy doc, meeting notes", tone: "a" },
        { label: "Extract inputs and outcomes", sub: "what is tested, what happens", tone: "b" },
        { label: "Find the ambiguities", sub: "boundaries, missing data, combinations", tone: "warn" },
        { label: "Ask — and get answers in writing", sub: "this is the job, not a failure", tone: "warn" },
        { label: "Decision model table", sub: "input · condition · outcome · source", tone: "b" },
        { label: "Rules or decision table", sub: "the implementation is now the easy part", tone: "ok" }
      ]
    },
    example: {
      caption: "One real requirement, fully translated",
      lang: "text",
      code: `=== WHAT ARRIVED (email from Lending, Tuesday) ===

  "Following the quarterly review we need to tighten up. Decline
   anyone with poor credit unless they're an existing customer in
   good standing, where we can be a bit more flexible. Obviously
   anyone with a recent default is out regardless. Also we should
   probably do something about people with too much existing debt.
   Can this be live by month end?"


=== THE QUESTIONS (sent back the same day) ===

  1. "Poor credit" - I'm assuming this is the credit score. What is
     the threshold, and does an applicant AT that score pass or fail?
  2. "Existing customer" - is there a minimum relationship length?
  3. "Good standing" - can we define this? No missed payments in N
     months? No arrears currently?
  4. "A bit more flexible" - what score do we accept for an existing
     customer in good standing?
  5. "Recent default" - how many months counts as recent? Does the
     amount matter, or is any default disqualifying?
  6. Confirming: a recent default beats the existing-customer
     exception, so a good-standing customer with a recent default is
     still declined?
  7. "Too much existing debt" - is this a total amount, or a ratio to
     income? What is the limit, and is it a decline or a referral?
  8. Effective date - does this apply to applications already
     submitted but not yet decided?


=== THE ANSWERS (Thursday) ===

  1. Credit score below 700. Exactly 700 PASSES.
  2. 24 months minimum.
  3. No missed payment in the last 12 months and no current arrears.
  4. 650 for those customers.
  5. 24 months. Any default, regardless of amount.
  6. Yes - default overrides everything.
  7. Ratio. Total existing debt over 4x annual salary -> REFER to an
     underwriter, not an automatic decline.
  8. New applications only, from the 1st.


=== THE DECISION MODEL ===

+---+--------------------------+---------------------+------------+--------+
| # | Condition                | Outcome             | Overrides  | Source |
+---+--------------------------+---------------------+------------+--------+
| 1 | default in last 24 mo    | DECLINE             | everything | A5, A6 |
| 2 | debt > 4x annual salary  | REFER               | 3,4,5      | A7     |
| 3 | credit score >= 700      | continue            | -          | A1     |
| 4 | score 650-699 AND        | continue            | -          | A2,A3, |
|   | customer >= 24 months    |                     |            | A4     |
|   | AND in good standing     |                     |            |        |
| 5 | otherwise                | DECLINE             | -          | -      |
+---+--------------------------+---------------------+------------+--------+

  good standing := no missed payment in 12 months AND no current arrears


=== NEW DATA REQUIRED (raised immediately) ===

  The current Applicant object has NONE of these:
     - months as a customer
     - date of most recent default
     - missed payments in the last 12 months
     - current arrears flag
     - total existing debt  (derivable from the loans list)

  -> XOM change, BOM change, and the calling application must supply
     four new fields. That is a bigger change than the rules, and it
     is the reason "live by month end" needs discussing.


=== IMPLEMENTATION ===
  Rows 1 and 2 -> a 'mandatory-blocks' rule task, ordered FIRST
  Rows 3-5     -> a first-match-wins decision table
  Row 5        -> the otherwise row, so there can be no gap
  Effective date -> rule property, or a condition on application date


=== WHY THIS MATTERS ===
The email would have taken twenty minutes to implement as written,
and would have been wrong in at least four ways. The eight questions
took ten minutes to write and turned an ambiguous request into a
specification with an audit trail.

They also surfaced the real problem: this needs four new data fields
from an upstream system. Better to know that on Tuesday than during
the month-end release.`,
      note: "The 'new data required' section is the most valuable part of that analysis. The rules were never the hard part — sourcing four fields from another system is. Spotting that early is exactly what a project needs from you, and it is the kind of contribution that gets noticed."
    },
    quiz: {
      kind: "choose",
      prompt: "A requirement says “decline applicants with a credit score over 700”. What should you ask first?",
      options: [
        "Which decision table to use",
        "Whether that is really intended — declining HIGH scores is backwards — and whether exactly 700 is included",
        "What the response message should say",
        "Nothing, implement it as written"
      ],
      answer: 1,
      explain: "Two problems in six words. 'Over 700' probably means 'below 700' — the requirement as written declines good applicants. And even once corrected, whether exactly 700 passes is unstated and will eventually matter to a real person. Implementing an obviously-wrong requirement as written helps nobody; asking takes a minute."
    },
    mistake: {
      title: "Implementing an ambiguous requirement rather than clarifying it",
      symptom: "The rules pass every test and the business says 'that's not what we meant' at the demo.",
      cause: "Ambiguity resolved by assumption instead of by asking. The assumption was reasonable and wrong.",
      fix: "Write down every question the requirement raises and send them in one batch, in writing. Get the answers in writing too — email is fine, and it becomes your audit trail. If an answer is slow to arrive, implement your assumption but state it prominently in the decision model, so the demo becomes a confirmation rather than a surprise."
    }
  }

  ],

  quiz: [
    {
      q: "A rule condition compares against an attribute that is null. What happens?",
      options: ["NullPointerException", "The condition evaluates to false and the rule silently does not fire", "The rule fires with a default value", "HTTP 400"],
      answer: 1,
      explain: "Null usually causes silence, not an error. That is what makes it dangerous — you get a plausible wrong answer instead of a crash."
    },
    {
      q: "A caller omits creditScore. The XOM declares it as `int`. What value do the rules see?",
      options: ["null", "0 — the Java default, which is a perfectly valid value for a comparison", "-1", "The request is rejected"],
      answer: 1,
      explain: "Omitted primitives get Java defaults, and 0 compares happily against any threshold. Absent and zero become indistinguishable unless you validate or use wrapper types."
    },
    {
      q: "Why is a date-format mismatch more dangerous than a type error?",
      options: ["Dates are harder to parse", "A wrong-format date often parses into a valid but incorrect value, so no layer raises an error", "It only affects some servers", "Dates cannot be validated"],
      answer: 1,
      explain: "10/09/2026 is valid in two interpretations. Everything succeeds and the wrong value flows through silently. ISO-8601 in the interface contract eliminates it."
    },
    {
      q: "The trace shows your rule as “considered” but not fired. What does that eliminate?",
      options: ["Nothing", "Ruleflow, packaging and rule-selection problems — the rule was reached, so its condition was false", "Data problems", "All deployment problems"],
      answer: 1,
      explain: "Considered means the engine evaluated it. The whole category of 'the rule never ran' is eliminated, and you should look at the data next."
    },
    {
      q: "Two rules fire and both set `response.eligible` to opposite values. What is the first step?",
      options: ["Set a priority", "Ask the business what the correct outcome is — the policy may be genuinely ambiguous", "Delete one rule", "Switch to RetePlus"],
      answer: 1,
      explain: "A technical fix on an unclear policy just encodes a guess. Establish the intended behaviour, then implement it explicitly."
    },
    {
      q: "Deployment succeeds; the first execution throws ClassNotFoundException. What does this tell you?",
      options: ["The rules failed to compile", "The archive installed but the XOM classes are not available to the server", "Decision Center is out of sync", "The ruleflow is missing"],
      answer: 1,
      explain: "Deployment success means the archive installed and nothing more. The XOM must reach the server separately, as a managed resource or on the classpath."
    },
    {
      q: "What is the worst fallback when the decision service is unavailable?",
      options: ["Fail the transaction", "Route to manual review", "Default to approving, so applications keep flowing", "Retry once, then refer"],
      answer: 2,
      explain: "A fallback must never be more permissive than the rules it replaces. Defaulting to approve turns an outage into an approval mechanism."
    },
    {
      q: "Which single test most quickly narrows down an ODM problem?",
      options: ["Rewriting the rule", "Running the same input through the RES console test facility", "Restarting the server", "Checking the BOM"],
      answer: 1,
      explain: "It executes the ruleset with no caller involved. Right answer means the problem is above; wrong answer means it is below. Half the system eliminated in thirty seconds."
    }
  ]
};
