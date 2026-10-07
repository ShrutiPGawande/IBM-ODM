/* =========================================================================
   PHASE 2 — ODM Fundamentals
   ========================================================================= */

window.PHASE_2 = {
  id: "phase2",
  number: 2,
  title: "ODM Fundamentals",
  subtitle: "BOM, XOM, vocabulary, rules and decision tables — the core machinery",
  goal: "Understand the full flow from Java data to a decision, and build the loan-eligibility rule project end to end.",
  badge: { name: "Rule Author", icon: "📐" },
  topics: [

  /* ---------------------------------------------------------------- 2.1 */
  {
    id: "p2-t1",
    title: "What a rules engine is, and why banks don't hardcode if/else",
    minutes: 10,
    tag: "Concepts",
    intro: `Sunrise Bank's eligibility check is four \`if\` statements. A developer could write it in ten minutes. So why buy an enterprise product for it?

Because the four \`if\` statements are not the problem. **Change** is the problem.

The credit-score threshold moves from 700 to 720 next quarter. In hardcoded Java that means: raise a ticket, wait for a developer, change one number, code review, build, test cycle, release window, deploy. Three weeks and four people, to change one number that a business analyst already knew on day one.

A **business rule management system** (BRMS) like ODM separates the *logic* from the *application*. The rules live in their own artefact, editable by people who understand the business, deployable without rebuilding the application. The developer builds the plumbing once; the business changes the policy forever after.

That is the entire pitch. Everything else in ODM — BOM, vocabulary, decision tables, Decision Center — exists to make that separation work in practice.`,
    jargon: [
      { term: "BRMS", plain: "Business Rule Management System — software for authoring, storing, testing and deploying business rules separately from application code." },
      { term: "ODM", plain: "IBM Operational Decision Manager. IBM's BRMS." },
      { term: "Decision service", plain: "A deployed set of rules exposed so applications can call it and get a decision back." },
      { term: "Business rule", plain: "One statement of policy: a condition and what to do when it holds." }
    ],
    sections: [
      {
        title: "When a rule engine is the right answer",
        open: true,
        body: `**Good fit:**
- The logic changes often, driven by business or regulation.
- Non-developers need to read, review or own the logic.
- There are many conditions combining in many ways (pricing, eligibility, risk, validation, fraud).
- You need an audit trail of what the policy was on a given date.

**Poor fit:**
- Logic that never changes.
- Pure data transformation or plumbing.
- Anything performance-critical at microsecond scale.
- Three if-statements in an internal tool nobody else touches.

Being able to say *when not to use ODM* is a genuinely good interview answer. It shows you understand the tool rather than just liking it.`
      },
      {
        title: "The three ODM components, in one line each",
        open: true,
        body: `- **Rule Designer** — the Eclipse-based IDE where a developer builds the rule project, the BOM and the ruleflow. This is where you will spend Phase 2 and 3.
- **Decision Center** — the web application where business users browse, edit, test and govern rules. Same rules, business-friendly front end.
- **Decision Server** — the runtime that actually executes deployed rulesets and answers calls from applications. Phase 4 and 5 live here.

One project, authored in Designer, governed in Center, executed on Server.`
      },
      {
        title: "Java if/else vs a rule — the same policy twice",
        open: false,
        body: `**In Java:**
\`\`\`
if (applicant.getCreditScore() < 700) {
    response.setEligible(false);
    response.setReason("Credit score below 700");
}
\`\`\`
Buried in a class, in a jar, in a release.

**As an ODM rule:**
\`\`\`
if
    the credit score of 'the applicant' is less than 700
then
    set the eligibility of 'the response' to false;
    set the reason of 'the response' to "Credit score below 700";
\`\`\`
Stored as a rule artefact, readable by the lending manager, changeable without a build.

Same logic. Completely different lifecycle. The second one is the product.`
      }
    ],
    diagram: {
      caption: "Logic in the application vs logic in a decision service",
      kind: "columns",
      cols: [
        { title: "Hardcoded", tone: "warn", items: ["Logic inside the app", "Developer changes it", "Full build + release", "Weeks per change", "No business visibility"] },
        { title: "Rule-managed", tone: "ok", items: ["Logic in a ruleset", "Business author changes it", "Deploy the ruleset only", "Hours per change", "Full audit history"] }
      ]
    },
    example: {
      caption: "The Sunrise Bank policy as your team will receive it",
      lang: "text",
      code: `SUNRISE BANK — PERSONAL LOAN PRE-SCREENING (v3, effective Q3)

R1  An applicant under 21 is not eligible.
        Reason: "Applicant must be at least 21"

R2  An applicant with annual salary below 30,000 is not eligible.
        Reason: "Minimum annual salary is 30,000"

R3  An applicant with credit score below 700 is not eligible.
        Reason: "Minimum credit score is 700"

R4  If none of the above apply, the applicant is eligible.
        Reason: "Meets all pre-screening criteria"

NOTE FROM LENDING: thresholds are reviewed every quarter.
Last change: salary floor raised from 25,000 to 30,000.`,
      note: "That last note is why this project uses ODM. A policy document that says 'reviewed every quarter' is a policy document that should never be compiled into a jar."
    },
    quiz: {
      kind: "choose",
      prompt: "Which of these is the WEAKEST reason to adopt a rules engine?",
      options: [
        "The lending team changes thresholds every quarter",
        "A regulator requires an audit trail of policy changes",
        "The logic is complex, with many combinations of conditions",
        "The developers find if/else statements hard to write"
      ],
      answer: 3,
      explain: "Developers writing if/else is not a problem a BRMS solves — Java handles conditionals perfectly well. The real justification is always about change, ownership and governance: who edits the logic, how often, and how you prove what it was last March."
    },
    mistake: {
      title: "Using ODM as a general-purpose programming language",
      symptom: "Rule projects with hundreds of rules doing string manipulation, date parsing and data mapping, and a ruleflow nobody can follow.",
      cause: "Once the rule engine is there, it is tempting to put everything in it. But rules are for decisions, not for plumbing.",
      fix: "Keep a hard boundary. Data fetching, formatting, parsing and transformation belong in Java before or after the call. The ruleset receives clean data, makes a decision, returns it. If a rule is not expressing business policy, it probably belongs in code."
    }
  },

  /* ---------------------------------------------------------------- 2.2 */
  {
    id: "p2-t2",
    title: "The ODM landscape — Designer, Center, Server",
    minutes: 12,
    tag: "Architecture",
    intro: `Before touching artefacts, get the map in your head. ODM is not one program; it is a small family, and knowing which piece does what saves enormous confusion later.

Broadly there are two halves:

**Decision Server** — the runtime. It executes rules. This is what your application talks to in production.

**Decision Center** — the repository and governance layer. It stores rules, tracks who changed what, lets business users edit and test, and pushes rules towards deployment.

And one tool: **Rule Designer**, an Eclipse plug-in where developers build the technical parts — the BOM, the ruleflow, the project structure, the integration.

You will hear "RES" as well. Rule Execution Server is the classic name for the rule-execution component inside Decision Server. In conversation people use Decision Server and RES almost interchangeably; Phase 4 pins down the difference.`,
    jargon: [
      { term: "Rule Designer", plain: "The Eclipse-based developer IDE for building rule projects." },
      { term: "Decision Center", plain: "Web application where business users author, review and govern rules." },
      { term: "Decision Server", plain: "The runtime that executes deployed rulesets." },
      { term: "RES", plain: "Rule Execution Server — the rule-execution engine and console inside Decision Server." },
      { term: "Ruleset", plain: "The deployable package of rules the runtime actually executes." },
      { term: "RuleApp", plain: "A container that holds one or more rulesets for deployment." }
    ],
    sections: [
      {
        title: "Who uses what",
        open: true,
        body: `| Person | Tool | What they do |
|---|---|---|
| Developer (you) | **Rule Designer** | Create the rule project, import the XOM, build the BOM and vocabulary, write the ruleflow, wire integration, run local tests |
| Business analyst | **Decision Center** | Read and edit rules and decision tables in business language, run test scenarios, request deployment |
| Ops / release | **Decision Server console (RES)** | Deploy RuleApps, check which ruleset version is live, view execution traces |
| Calling application | **Decision Server runtime** | Sends a request, gets a decision back |

Notice: nobody edits rules directly on the server. Rules flow Designer → Center → Server, and the direction matters.`
      },
      {
        title: "Two authoring paths, one repository",
        open: false,
        body: `A rule project can live in two places and synchronise between them:

\`\`\`
Rule Designer  <--- publish / update --->  Decision Center
      |                                          |
      |                                          |
      +----------> deploy ruleset -------> Decision Server
\`\`\`

In Rule Designer you **publish** a project to Decision Center, and **update** back from it when business users have made changes. Getting that two-way flow wrong — editing the same rule in both places — is a classic source of merge pain, which is exactly why Phase 6 starts you on Git discipline early.`
      },
      {
        title: "Decision Server has two engines",
        open: false,
        body: `Worth knowing the words even before you need them:

- **Decision Server Rules** — executes business rules. This is our whole roadmap.
- **Decision Server Events** — detects patterns across streams of events over time. A different product concern; you can safely ignore it unless your project uses it.

If someone at work says "Decision Server", they almost certainly mean Decision Server Rules.`
      }
    ],
    diagram: {
      caption: "The three components and how work moves between them",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "Rule Designer (Eclipse)", sub: "developer: XOM, BOM, ruleflow, project setup", tone: "a" },
        { label: "Decision Center (web)", sub: "business: author, review, govern, test", tone: "b" },
        { label: "RuleApp / ruleset archive", sub: "the deployable package", tone: "c" },
        { label: "Decision Server / RES", sub: "runtime: executes the ruleset", tone: "c" },
        { label: "Calling application", sub: "REST or Java API → decision", tone: "ok" }
      ]
    },
    example: {
      caption: "What a rule project looks like on disk in Rule Designer",
      lang: "text",
      code: `loan-eligibility-rules/            <- the rule project
├── rules/                          <- business rules live here
│   ├── validation/
│   │   ├── check-age.brl
│   │   ├── check-salary.brl
│   │   └── check-credit-score.brl
│   └── decision/
│       └── final-eligibility.brl
├── bom/                            <- Business Object Model
│   └── model.bom
│   └── model.voc                   <- the vocabulary (verbalizations)
├── ruleflow/
│   └── main.rfl                    <- execution order
├── queries/
├── templates/
└── ruleproject.xml                 <- project descriptor

loan-eligibility-xom/               <- a SEPARATE Java project
└── src/com/sunrise/model/
    ├── Applicant.java
    ├── Loan.java
    └── LoanResponse.java`,
      note: "Two projects, not one. The XOM is ordinary Java; the rule project references it. Keeping them separate is standard practice and makes the XOM independently buildable and testable."
    },
    quiz: {
      kind: "choose",
      prompt: "A business analyst needs to change the minimum credit score from 700 to 720. Where should that change be made?",
      options: [
        "In Rule Designer, by the developer",
        "In Decision Center, by the analyst",
        "Directly on the Decision Server console",
        "In the XOM Java class"
      ],
      answer: 1,
      explain: "That is precisely the point of Decision Center: business users own business policy. The developer built the project so this change needs no code. You cannot edit rules on the Decision Server console at all — it only deploys and monitors what it is given."
    },
    mistake: {
      title: "Editing the same rule in Designer and Decision Center",
      symptom: "A change you made in Rule Designer disappears after someone runs an update from Decision Center — or vice versa.",
      cause: "Both sides hold a copy of the project. Publishing and updating are synchronisation operations, and simultaneous edits on both sides overwrite each other.",
      fix: "Agree ownership per artefact. The common convention: developers own BOM, ruleflow and technical rules in Designer; business owns rule content and decision tables in Decision Center. Always update from Decision Center before you publish to it, exactly as you would pull before push in Git."
    }
  },

  /* ---------------------------------------------------------------- 2.3 */
  {
    id: "p2-t3",
    title: "The core flow — Java data to decision",
    minutes: 14,
    tag: "Architecture ★",
    intro: `This is the single most important diagram in your roadmap, and the one thing to be able to draw on a whiteboard in an interview.

\`\`\`
Java / application data
        ↓
XOM  (execution object model)
        ↓
BOM  (business object model)
        ↓
Vocabulary
        ↓
Business rules
        ↓
Rule execution
        ↓
Decision
\`\`\`

Read it as one sentence: *real Java objects are described by the XOM, the BOM gives them a business-friendly face, the vocabulary turns that face into readable phrases, rules are written in those phrases, the engine executes them against the real objects, and out comes a decision.*

Two directions are worth noticing. At **design time** you move down the chain: you build the XOM, derive the BOM, verbalize, then write rules. At **run time** the engine goes the other way: it takes the rules and executes them against the actual Java objects the application handed it. The BOM-to-XOM mapping is what connects the two.`,
    jargon: [
      { term: "XOM", plain: "eXecution Object Model — the real Java classes (or XSD schema) the engine actually manipulates at run time." },
      { term: "BOM", plain: "Business Object Model — the business-facing view of the XOM. Same structure, friendlier names." },
      { term: "Vocabulary", plain: "The readable phrases rules are written in, generated from the BOM." },
      { term: "B2X mapping", plain: "BOM-to-XOM mapping — the translation that connects a business concept back to real Java code." },
      { term: "Ruleset parameters", plain: "The declared inputs and outputs of a ruleset — what goes in, what comes out." }
    ],
    sections: [
      {
        title: "What each layer is actually for",
        open: true,
        body: `**XOM** — reality. Real Java classes with real methods. The engine reads and writes these objects. If the XOM class does not have it, no rule can ever see it.

**BOM** — abstraction. A copy of the XOM's structure that you are free to rename, hide and restructure. You might hide \`getInternalRiskFlag()\` entirely, rename \`custAge\` to \`age\`, or expose a derived concept. The business sees the BOM; the engine runs the XOM.

**Vocabulary** — language. For each BOM class and member, a phrase: "the age of the applicant", "the applicant has an existing loan". This is what appears in the rule editor's autocomplete.

**Rules** — policy, written in that vocabulary.

**Execution** — the engine matches rule conditions against the objects and fires the actions.

**Decision** — whatever the rules wrote into the output object.`
      },
      {
        title: "Why not skip the BOM and write rules against Java directly?",
        open: true,
        body: `A fair question, and the answer is the whole design philosophy.

1. **Insulation.** If a developer renames a Java field, you fix one mapping in the BOM instead of every rule that used it.
2. **Readability.** \`custAcctBal\` is unreadable policy; "the account balance of the customer" is not.
3. **Control.** The BOM lets you expose exactly what the business should see and hide the rest — internal IDs, technical flags, helper methods.
4. **Independence.** The same BOM can be backed by a Java XOM in one environment and an XML schema in another.

The BOM is a deliberate translation layer. It costs a little setup and saves a great deal of churn.`
      },
      {
        title: "Ruleset parameters — the contract",
        open: false,
        body: `Every ruleset declares its parameters, and this is your API contract:

| Parameter | Direction | Type |
|---|---|---|
| \`applicant\` | IN | Applicant |
| \`response\` | OUT | LoanResponse |

Three directions exist:
- **IN** — the engine reads it, rules cannot change what the caller sees.
- **OUT** — created by the ruleset, returned to the caller.
- **IN_OUT** — passed in, modified, returned.

These parameters become the JSON fields of your REST request and response in Phase 5. Design them carefully; changing them later breaks every caller.`
      }
    ],
    diagram: {
      caption: "The core flow — design time goes down, run time executes across",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "Java application data", sub: "an Applicant object filled from a request", tone: "a" },
        { label: "XOM", sub: "Applicant.java, Loan.java, LoanResponse.java", tone: "a" },
        { label: "BOM", sub: "business view + B2X mapping back to Java", tone: "b" },
        { label: "Vocabulary", sub: "“the credit score of the applicant”", tone: "b" },
        { label: "Business rules", sub: "if / then, decision tables", tone: "c" },
        { label: "Rule execution", sub: "engine fires matching rules on the real objects", tone: "c" },
        { label: "Decision", sub: "response.eligible = false, reason = “…”", tone: "ok" }
      ]
    },
    example: {
      caption: "One journey through every layer, for a single applicant",
      lang: "text",
      code: `1. APPLICATION builds the input
   Applicant a = new Applicant();
   a.setName("Vikram Rao");
   a.setAge(19);
   a.setAnnualSalary(52000);
   a.setCreditScore(710);

2. XOM — this is the real class the engine will touch
   com.sunrise.model.Applicant  { getAge(), getAnnualSalary(), ... }

3. BOM — the business view, mapped back to that class
   Applicant
     age            -> maps to getAge()
     annual salary  -> maps to getAnnualSalary()
     credit score   -> maps to getCreditScore()

4. VOCABULARY — the phrases the rule editor offers
   "the age of {this}"
   "the annual salary of {this}"
   "the credit score of {this}"

5. RULE — written in those phrases
   if the age of 'the applicant' is less than 21
   then set the eligibility of 'the response' to false;
        set the reason of 'the response' to "Applicant must be at least 21";

6. EXECUTION — engine evaluates: 19 < 21 -> true -> fire

7. DECISION
   { "eligible": false, "reason": "Applicant must be at least 21" }`,
      note: "Trace this seven-step journey once by hand and the architecture stops being abstract. This is also, almost word for word, the answer to “walk me through how ODM works” in an interview."
    },
    quiz: {
      kind: "choose",
      prompt: "A developer renames the Java field `custAge` to `applicantAge` in the XOM. Twelve rules use it. What do you have to change?",
      options: [
        "All twelve rules, one by one",
        "Just the BOM-to-XOM mapping for that one attribute",
        "Nothing — ODM tracks Java renames automatically",
        "The vocabulary file, then re-verbalize every rule"
      ],
      answer: 1,
      explain: "This is exactly why the BOM exists. The rules reference the BOM member ('the age of the applicant'), and the BOM member points at a Java method through the B2X mapping. Repoint the mapping and all twelve rules keep working untouched. Without a BOM layer this would be a twelve-rule edit."
    },
    mistake: {
      title: "Changing the XOM without updating the BOM",
      symptom: "Rules that compiled yesterday now show errors in Rule Designer, or worse, deploy fine and fail at run time with NoSuchMethodError.",
      cause: "The BOM holds a snapshot of the XOM's structure. Rename a Java method or change its return type and the BOM is still pointing at the old signature.",
      fix: "After any XOM change, re-import or refresh the BOM in Rule Designer and rebuild the project. Treat XOM changes as a breaking API change — because for your rules, that is exactly what they are. Making the XOM a separately versioned jar makes this discipline much easier to enforce."
    }
  },

  /* ---------------------------------------------------------------- 2.4 */
  {
    id: "p2-t4",
    title: "XOM — the execution object model",
    minutes: 12,
    tag: "Core artefact",
    intro: `The **XOM** is what the rule engine actually executes against. When a rule says "the credit score of the applicant is at least 700", at run time the engine is calling \`getCreditScore()\` on a real object in memory. That object's class is the XOM.

There are two kinds:

**Java XOM** — ordinary Java classes packaged in a jar, or referenced as an Eclipse project. This is the common case and the one you will use.

**Dynamic XOM (XSD)** — an XML schema instead of Java classes. ODM generates the structure at run time. Useful when your service is schema-driven and there is no Java model, and common in pure REST decision services.

For Sunrise Bank we use a Java XOM: three classes, no logic, just data.`,
    jargon: [
      { term: "XOM", plain: "eXecution Object Model — the real implementation the engine runs against." },
      { term: "Java XOM", plain: "A XOM made of compiled Java classes, usually shipped as a jar." },
      { term: "Dynamic XOM", plain: "A XOM defined by an XML schema (XSD) rather than Java classes." },
      { term: "POJO", plain: "Plain Old Java Object — a simple class with fields and getters, no framework dependencies." }
    ],
    sections: [
      {
        title: "Rules for a well-behaved XOM class",
        open: true,
        body: `1. **Plain POJOs.** No framework annotations, no Spring, no JPA if you can avoid it. The engine just needs data.
2. **Private fields, public getters/setters** following JavaBean naming.
3. **A public no-argument constructor.** ODM may need to instantiate objects, particularly for output parameters and when a rule creates an object.
4. **No business logic.** Thresholds and decisions belong in rules.
5. **Initialise collections** at declaration so they are never null.
6. **Serializable is helpful** if the objects cross a remote boundary.
7. **Keep it stable.** The XOM is a contract; changing it ripples into the BOM and out to every caller.`
      },
      {
        title: "Java XOM vs Dynamic XOM — choosing",
        open: false,
        body: `| | Java XOM | Dynamic XOM (XSD) |
|---|---|---|
| Defined by | Java classes | XML schema |
| Best when | A Java app calls the rules, or you already have a domain model | A REST-only decision service, schema-first design |
| Deployment | XOM jar must be on the server's classpath | Schema travels with the ruleset |
| Java methods available to rules | Yes | No — data only |
| Typical friction | Keeping the jar in sync across environments | No custom Java helpers available |

If your project is heading for a hosted REST decision service with no Java caller, a dynamic XOM removes an entire class of classpath problems. Ask your trainer which your team uses — it is a genuinely good question to raise.`
      },
      {
        title: "How the XOM reaches the runtime",
        open: false,
        body: `This trips up nearly everyone the first time they deploy.

At **design time**, Rule Designer sees the XOM because your rule project references the Java project or jar.

At **run time**, the Decision Server needs those same classes on its classpath. If the jar is missing or is a different version, you get \`ClassNotFoundException\` or \`NoSuchMethodError\` — and only at execution, never at build.

Two ways to handle it:
1. Package the XOM jar into the deployment so it travels with the ruleset (managed XOM / resource in the RuleApp).
2. Place the jar on the application server's shared classpath.

Whichever your team uses, know which it is. This is Phase 7 material arriving early.`
      }
    ],
    diagram: {
      caption: "The same XOM seen at design time and at run time",
      kind: "columns",
      cols: [
        { title: "Design time", tone: "b", items: ["Rule Designer reads the classes", "Generates the BOM from them", "Rule editor autocompletes", "Compiles rules against signatures"] },
        { title: "Run time", tone: "c", items: ["Application creates real objects", "Engine calls real getters", "XOM jar must be on the classpath", "Missing jar = execution failure"] }
      ]
    },
    example: {
      caption: "The complete Sunrise Bank XOM — three classes, zero logic",
      lang: "java",
      code: `package com.sunrise.model;

import java.util.ArrayList;
import java.util.List;

public class Applicant {
    private String name;
    private int age;
    private double annualSalary;
    private int creditScore;
    private boolean hasExistingLoan;
    private List<Loan> loans = new ArrayList<>();   // never null

    public Applicant() { }                          // required no-arg constructor

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }

    public double getAnnualSalary() { return annualSalary; }
    public void setAnnualSalary(double annualSalary) { this.annualSalary = annualSalary; }

    public int getCreditScore() { return creditScore; }
    public void setCreditScore(int creditScore) { this.creditScore = creditScore; }

    public boolean isHasExistingLoan() { return hasExistingLoan; }
    public void setHasExistingLoan(boolean v) { this.hasExistingLoan = v; }

    public List<Loan> getLoans() { return loans; }
    public void setLoans(List<Loan> loans) {
        this.loans = (loans == null) ? new ArrayList<Loan>() : loans;
    }
}

public class Loan {
    private String type;
    private double outstanding;
    private int monthsRemaining;

    public Loan() { }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public double getOutstanding() { return outstanding; }
    public void setOutstanding(double v) { this.outstanding = v; }
    public int getMonthsRemaining() { return monthsRemaining; }
    public void setMonthsRemaining(int v) { this.monthsRemaining = v; }
}

public class LoanResponse {
    private boolean eligible;
    private String reason;
    private List<String> messages = new ArrayList<>();

    public LoanResponse() { }

    public boolean isEligible() { return eligible; }
    public void setEligible(boolean eligible) { this.eligible = eligible; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public List<String> getMessages() { return messages; }
    public void setMessages(List<String> m) {
        this.messages = (m == null) ? new ArrayList<String>() : m;
    }
}`,
      note: "Note setLoans() and setMessages() defending against null. If a JSON request omits the loans array, an unguarded setter would leave the field null and every collection rule would silently fail to fire. Three extra characters here, hours saved in Phase 7."
    },
    quiz: {
      kind: "choose",
      prompt: "Your ruleset builds and deploys successfully, but the first execution fails with java.lang.NoSuchMethodError: Applicant.getCreditScore(). What is the most likely cause?",
      options: [
        "The rule syntax is wrong",
        "The XOM jar on the server is an older version that lacks that method",
        "Decision Center is not synchronised",
        "The ruleset parameters are misconfigured"
      ],
      answer: 1,
      explain: "NoSuchMethodError at run time (rather than compile time) is the signature of a classpath version mismatch: the rules were compiled against a newer XOM than the one the server actually loaded. Check which jar the Decision Server has and whether your build deployed the updated one. This is one of the most common real-world ODM incidents."
    },
    mistake: {
      title: "The XOM jar and the ruleset drift apart",
      symptom: "Works perfectly in Rule Designer. Fails at execution with ClassNotFoundException or NoSuchMethodError.",
      cause: "Design time and run time load the XOM from different places. Adding a field locally does not update the jar sitting on the server.",
      fix: "Version the XOM jar explicitly (loan-xom-1.2.0.jar, not loan-xom.jar) and make deploying it part of the same pipeline step as deploying the ruleset. When debugging, always establish first which XOM version the server actually has — assume nothing."
    }
  },

  /* ---------------------------------------------------------------- 2.5 */
  {
    id: "p2-t5",
    title: "BOM — the business object model",
    minutes: 14,
    tag: "Core artefact ★",
    intro: `The **BOM** is the business-facing mirror of your XOM. Same classes, same attributes, but you control what is visible and what it is called.

You create it by importing the XOM: Rule Designer reads the Java classes and generates a matching BOM structure. Then you customise. Hide the technical fields. Rename \`custAge\` to \`age\`. Make an enumeration readable. Add a derived attribute the Java class does not have.

Critically, every BOM member keeps a link back to the Java it came from — the **BOM-to-XOM mapping**, usually written B2X. That mapping is what makes the abstraction real rather than decorative: rules talk to the BOM, the engine executes against the XOM, and B2X connects them.

If you understand one artefact deeply in Phase 2, make it this one. It is where most real ODM work happens and where most interview questions land.`,
    jargon: [
      { term: "BOM", plain: "Business Object Model — the business view of the data, mapped to real code." },
      { term: "B2X", plain: "BOM-to-XOM mapping. The translation from a business member to the Java that implements it." },
      { term: "Virtual member", plain: "A BOM attribute or method with no direct Java equivalent — you supply the Java in the B2X mapping." },
      { term: "Verbalization", plain: "The readable phrase attached to a BOM element." },
      { term: ".bom / .voc", plain: "The two files: structure lives in .bom, the phrases live in .voc." }
    ],
    sections: [
      {
        title: "The four things you do to a BOM after importing",
        open: true,
        body: `1. **Hide what the business must not see.** Internal IDs, audit fields, technical flags. Fewer visible members means a cleaner rule editor and fewer wrong rules.

2. **Rename for clarity.** \`custAge\` → \`age\`. \`flgActv\` → \`active\`. The Java stays as it is; only the business name changes.

3. **Fix the verbalizations.** ODM's generated phrases are decent but rarely perfect. "the has existing loan of the applicant" should become "the applicant has an existing loan".

4. **Add virtual members** where the business thinks in a concept the Java does not have. "the total outstanding debt of the applicant" can be a BOM attribute whose B2X mapping sums the loans in Java, even though no \`getTotalOutstandingDebt()\` exists.`
      },
      {
        title: "Virtual members — the most useful BOM trick",
        open: true,
        body: `Suppose the business keeps saying "the debt-to-income ratio". There is no such field in Java. Three options:

1. Add \`getDebtToIncomeRatio()\` to the XOM. Requires a developer and a redeploy of the jar.
2. Compute it in a rule and store it in a variable. Works, but every rule must repeat it.
3. **Add a virtual BOM attribute** with a B2X mapping containing the Java expression:

\`\`\`
// B2X mapping for: Applicant.debtToIncomeRatio
this.getAnnualSalary() == 0 ? 0 :
    (totalOutstanding(this) / this.getAnnualSalary())
\`\`\`

Now every rule can say "the debt to income ratio of the applicant" and it just works. The concept lives where the business thinks about it, and the Java stays clean.

Note the divide-by-zero guard. B2X mappings are real Java and can throw real exceptions — Phase 7 will remind you.`
      },
      {
        title: "The two files, and what goes where",
        open: false,
        body: `- **model.bom** — the structure: classes, attributes, methods, types, and the B2X mapping expressions.
- **model.voc** — the vocabulary: one verbalization per element, per locale.

They live side by side in the \`bom/\` folder. Both are text files, both belong in Git, and both can be diffed in a pull request — which is a genuinely useful thing to say in an interview when asked how rules are version-controlled.`
      },
      {
        title: "Types in the BOM",
        open: false,
        body: `The BOM has its own type names that map onto Java:

| BOM type | Java |
|---|---|
| int, double, boolean | int, double, boolean |
| string | java.lang.String |
| date, time | java.util.Date, etc. |
| collection of X | java.util.List<X>, Set, arrays |
| domain (enumeration) | a Java enum, or a String with a fixed value list |

**Domains** are worth knowing: restricting \`loan type\` to a domain of CAR / PERSONAL / CREDIT_CARD turns a free-text field into a dropdown in the rule editor. Business users stop typing "Car" when the data says "CAR", and an entire category of silent no-fire bugs disappears.`
      }
    ],
    diagram: {
      caption: "BOM sits between the business phrase and the Java method",
      kind: "flow",
      dir: "right",
      nodes: [
        { label: "Rule text", sub: "“the credit score of the applicant”", tone: "ok" },
        { label: "Vocabulary (.voc)", sub: "phrase → BOM member", tone: "b" },
        { label: "BOM member (.bom)", sub: "Applicant.creditScore : int", tone: "b" },
        { label: "B2X mapping", sub: "this.getCreditScore()", tone: "a" },
        { label: "XOM Java", sub: "Applicant.getCreditScore()", tone: "a" }
      ]
    },
    example: {
      caption: "The Sunrise Bank BOM, including a virtual attribute",
      lang: "text",
      code: `// ---------- model.bom (simplified, readable form) ----------

package com.sunrise.model;

public class Applicant
{
    public string name;                 // -> getName()
    public int age;                     // -> getAge()
    public double annualSalary;         // -> getAnnualSalary()
    public int creditScore;             // -> getCreditScore()
    public boolean hasExistingLoan;     // -> isHasExistingLoan()
    public java.util.List loans domain 0,* class com.sunrise.model.Loan;

    // VIRTUAL attribute - no such field exists in Java
    public double totalOutstandingDebt;
}

// ---------- B2X mapping for the virtual attribute ----------
// Applicant#totalOutstandingDebt (getter body)

double total = 0;
if (this.getLoans() != null) {
    for (Object o : this.getLoans()) {
        total += ((com.sunrise.model.Loan) o).getOutstanding();
    }
}
return total;


// ---------- model.voc (the verbalizations) ----------

Applicant#name                 = {this}'s name
Applicant#age                  = the age of {this}
Applicant#annualSalary         = the annual salary of {this}
Applicant#creditScore          = the credit score of {this}
Applicant#hasExistingLoan      = {this} has an existing loan
Applicant#loans                = the loans of {this}
Applicant#totalOutstandingDebt = the total outstanding debt of {this}

LoanResponse#eligible          = the eligibility of {this}
LoanResponse#reason            = the reason of {this}`,
      note: "Read the hasExistingLoan verbalization carefully. ODM would have generated 'the has existing loan of {this}'. One minute of editing turns a clumsy phrase into one a lending manager can read without wincing — and that readability is the whole product."
    },
    quiz: {
      kind: "choose",
      prompt: "The business wants rules about “the total outstanding debt of the applicant”, but the Java Applicant class has no such method. What is the cleanest ODM solution?",
      options: [
        "Ask a developer to add getTotalOutstandingDebt() and redeploy the XOM jar",
        "Add a virtual BOM attribute with a B2X mapping that computes it",
        "Compute it in every rule that needs it",
        "Tell the business the concept is not available"
      ],
      answer: 1,
      explain: "A virtual BOM member with a B2X mapping gives the business the concept they think in, without touching the Java model or repeating the computation in every rule. Option A also works and is sometimes right if many systems need the value — but it costs a jar redeploy and couples the model to one consumer's vocabulary."
    },
    mistake: {
      title: "Leaving the auto-generated verbalizations as they are",
      symptom: "Business users refuse to use Decision Center because the rules read like “the is active flg of the customer is true”.",
      cause: "The BOM was imported and shipped without editing the .voc file. ODM's generated phrases are mechanical — they split camelCase and nothing more.",
      fix: "Budget real time for verbalization; it is not cosmetic, it is the product's entire value proposition. Read each phrase out loud in a full sentence — 'if the applicant has an existing loan then…'. If it sounds wrong spoken, fix it. Also hide every member the business will never use; a shorter vocabulary is a better one."
    }
  },

  /* ---------------------------------------------------------------- 2.6 */
  {
    id: "p2-t6",
    title: "Vocabulary and verbalization",
    minutes: 12,
    tag: "Core artefact",
    intro: `The **vocabulary** is the set of phrases rules can be written in. It is generated from the BOM and stored in the \`.voc\` file, and it is what turns \`applicant.getCreditScore() >= 700\` into *"the credit score of the applicant is at least 700"*.

Every BOM element gets a verbalization:
- A **class** gets a noun: \`Applicant\` → "applicant".
- An **attribute** gets a phrase with a placeholder: \`creditScore\` → "the credit score of {this}".
- A **method** gets a verb phrase: \`addMessage(String)\` → "add {0} to the messages of {this}".

The \`{this}\` placeholder is where the object slots in, and \`{0}\`, \`{1}\` are the arguments. When you write a rule, the editor offers these phrases and fills the placeholders as you type.

Good verbalization is the difference between a rule project business users actually adopt and one that quietly stays a developer tool.`,
    jargon: [
      { term: "Verbalization", plain: "The readable phrase attached to a BOM element." },
      { term: "{this}", plain: "The placeholder for the object the phrase applies to." },
      { term: "{0}, {1}", plain: "Placeholders for method arguments." },
      { term: "Navigation phrase", plain: "A verbalization that reads a value: 'the age of {this}'." },
      { term: "Action phrase", plain: "A verbalization that does something: 'set the eligibility of {this} to {0}'." },
      { term: "BAL", plain: "Business Action Language — the near-English syntax ODM rules are written in." }
    ],
    sections: [
      {
        title: "The three kinds of phrase",
        open: true,
        body: `**Navigation** (reading a value, used in conditions):
\`\`\`
the age of {this}
the credit score of {this}
the loans of {this}
\`\`\`

**Boolean** (a condition that reads as a statement):
\`\`\`
{this} has an existing loan
{this} is a premium customer
\`\`\`

**Action** (used in the then-part):
\`\`\`
set the eligibility of {this} to {0}
add {0} to the messages of {this}
reject {this} with reason {0}
\`\`\`

Getting the boolean form right matters most. "the applicant has an existing loan" reads naturally inside an if; "the has existing loan of the applicant is true" does not.`
      },
      {
        title: "Writing verbalizations that read well",
        open: true,
        body: `Test every phrase by dropping it into a full sentence.

| Generated | Better | Reads as |
|---|---|---|
| the has existing loan of {this} | {this} has an existing loan | *if the applicant has an existing loan* |
| the is active of {this} | {this} is active | *if the account is active* |
| the num of dependents of {this} | the number of dependents of {this} | *if the number of dependents of the applicant is more than 2* |
| the set eligible of {this} | set the eligibility of {this} to {0} | *then set the eligibility of the response to false* |

Three habits:
1. Read it aloud inside if/then. If you stumble, rewrite it.
2. Expand abbreviations. Always.
3. Be consistent across the project — always "the X of the Y", never a mix of styles.`
      },
      {
        title: "Locales",
        open: false,
        body: `The \`.voc\` file is per-locale: \`model_en_US.voc\`, \`model_fr_FR.voc\`. The same rule project can present its vocabulary in several languages, and business users in each region see rules in their own.

Not something you need on day one, but worth knowing it exists — it explains why the file is named the way it is, and it is a nice detail to mention when someone asks what ODM offers over a hand-rolled rules table.`
      }
    ],
    diagram: {
      caption: "One BOM member, three layers of naming",
      kind: "layers",
      layers: [
        { label: "Rule text (what the business reads)", sub: "if the applicant has an existing loan then …", tone: "ok" },
        { label: "Verbalization (.voc)", sub: "Applicant#hasExistingLoan = {this} has an existing loan", tone: "b" },
        { label: "BOM member (.bom)", sub: "public boolean hasExistingLoan;", tone: "b" },
        { label: "Java XOM", sub: "public boolean isHasExistingLoan()", tone: "a" }
      ]
    },
    example: {
      caption: "Before and after — the same rule with two vocabularies",
      lang: "text",
      code: `/* ============ BEFORE: auto-generated verbalizations ============ */

definitions
    set 'the app' to a Applicant;
if
    the age of 'the app' is less than 21
    or the annual salary of 'the app' is less than 30000
    or the credit score of 'the app' is less than 700
    or the has existing loan of 'the app' is true
then
    set the eligible of 'the resp' to false;

    -> A lending manager reading this stumbles three times.


/* ============ AFTER: edited verbalizations ============ */

definitions
    set 'the applicant' to a Applicant;
if
    the age of 'the applicant' is less than 21
    or the annual salary of 'the applicant' is less than 30000
    or the credit score of 'the applicant' is less than 700
    or 'the applicant' has an existing loan
then
    set the eligibility of 'the response' to false;

    -> This reads as a sentence. Same code underneath.


/* ============ The .voc changes that did it ============ */

Applicant#hasExistingLoan  = {this} has an existing loan
LoanResponse#eligible      = the eligibility of {this}
// plus: renamed the rule variable from 'the app' to 'the applicant'`,
      note: "Nothing about the Java changed between these two versions. The only difference is the .voc file and one variable name — and the second one is a document the business will actually sign off."
    },
    quiz: {
      kind: "choose",
      prompt: "Which verbalization for a boolean attribute `premiumCustomer` will produce the most readable rule?",
      options: [
        "the premium customer of {this}",
        "{this} is a premium customer",
        "the premium customer flag of {this} is true",
        "isPremiumCustomer({this})"
      ],
      answer: 1,
      explain: "Boolean attributes should verbalize as complete statements so they read naturally inside a condition: 'if the applicant is a premium customer then…'. Option A forces the awkward 'if the premium customer of the applicant is true'. Option D exposes Java syntax to a business audience, which defeats the purpose."
    },
    mistake: {
      title: "Renaming a verbalization after rules already use it",
      symptom: "You improve a phrase in the .voc file and suddenly a dozen rules show errors, or Decision Center shows rules as broken.",
      cause: "Rules are stored against the vocabulary. Changing a phrase can invalidate existing rule text that referenced the old wording.",
      fix: "Get verbalizations right before writing many rules — spend the hour early. If you must change one later, use Rule Designer's refactoring support rather than hand-editing the .voc, verify by rebuilding the whole project, and never do it in the same commit as a logic change so that a broken build is easy to attribute."
    }
  },

  /* ---------------------------------------------------------------- 2.7 */
  {
    id: "p2-t7",
    title: "Rule Designer and the rule project",
    minutes: 12,
    tag: "Tooling",
    intro: `**Rule Designer** is Eclipse with ODM plug-ins. If you have used Eclipse or IntelliJ, the shape is familiar: a project explorer on the left, editors in the middle, problems and console below.

A **rule project** is the unit of work. It contains rules, the BOM, the ruleflow, queries and templates, and it declares its ruleset parameters. Rule projects can depend on other rule projects, which is how large organisations share a common BOM across many decision services.

The workflow you will repeat many times in Phases 2 and 3:

1. Create or update the XOM (a normal Java project).
2. Create the rule project and point it at the XOM.
3. Import the XOM into the BOM, then verbalize.
4. Declare ruleset parameters.
5. Write rules.
6. Build a ruleflow to order them.
7. Run a test locally.

Then repeat step 5 onwards as the policy grows.`,
    jargon: [
      { term: "Rule project", plain: "The container holding rules, BOM, ruleflow and parameters." },
      { term: "Rule package", plain: "A folder inside the rule project, used to group related rules." },
      { term: "Ruleset parameter", plain: "A declared input or output of the ruleset." },
      { term: "Ruleflow", plain: "A diagram defining the order in which groups of rules execute." },
      { term: ".brl / .dtable", plain: "File extensions: business rule language file, and decision table." }
    ],
    sections: [
      {
        title: "Anatomy of the project explorer",
        open: true,
        body: `| Folder | What lives there |
|---|---|
| \`rules/\` | Action rules (.brl), decision tables (.dtable), decision trees |
| \`bom/\` | model.bom and model.voc |
| \`ruleflow/\` | The .rfl execution flow |
| \`queries/\` | Saved searches over your rules — useful when the project grows |
| \`templates/\` | Rule templates that constrain what business users can edit |
| \`resources/\` | Ruleset parameters and project properties |

Organise \`rules/\` into packages that mirror your ruleflow: \`validation/\`, \`eligibility/\`, \`pricing/\`. A flat folder with sixty rules is unmanageable by month three.`
      },
      {
        title: "Declaring ruleset parameters",
        open: true,
        body: `Right-click the rule project → Properties → **Ruleset Parameters**. For Sunrise Bank:

| Name | Direction | Type |
|---|---|---|
| \`applicant\` | IN | com.sunrise.model.Applicant |
| \`response\` | IN_OUT | com.sunrise.model.LoanResponse |

Why IN_OUT for the response rather than OUT? Because the caller creates the object and passes it in, the rules populate it, and it comes back. Both patterns work; IN_OUT is common because it gives the caller control over initial state and avoids ODM having to construct the object.

These parameter names are the ones you will use in a rule's \`definitions\` block, and they become your JSON field names in Phase 5. Choose them with care.`
      },
      {
        title: "Rule packages and the ruleflow",
        open: false,
        body: `A rule package is a folder. A **rule task** in a ruleflow selects rules — usually "all rules in package X". So your folder structure and your execution flow are designed together.

\`\`\`
rules/
├── validation/       -> rule task 1: check the input is usable
├── eligibility/      -> rule task 2: apply the four eligibility rules
└── messaging/        -> rule task 3: build the customer-facing message
\`\`\`

That maps to a three-step ruleflow. Clean, inspectable, and easy to explain in an interview.`
      }
    ],
    diagram: {
      caption: "The build loop you will repeat all through Phases 2 and 3",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "1. XOM (Java project)", sub: "Applicant, Loan, LoanResponse", tone: "a" },
        { label: "2. Rule project + XOM reference", sub: "new project, point at the Java", tone: "a" },
        { label: "3. Import XOM → BOM → verbalize", sub: "the translation layer", tone: "b" },
        { label: "4. Declare ruleset parameters", sub: "applicant IN, response IN_OUT", tone: "b" },
        { label: "5. Write rules", sub: "action rules and decision tables", tone: "c" },
        { label: "6. Ruleflow", sub: "order the rule tasks", tone: "c" },
        { label: "7. Run locally and check the trace", sub: "did the right rules fire?", tone: "ok" }
      ]
    },
    example: {
      caption: "The Sunrise Bank rule project, laid out",
      lang: "text",
      code: `loan-eligibility-rules  [Rule Project]
│
├── rules
│   ├── validation
│   │   └── check-mandatory-fields.brl
│   ├── eligibility
│   │   ├── reject-under-age.brl
│   │   ├── reject-low-salary.brl
│   │   ├── reject-low-credit-score.brl
│   │   └── approve-if-no-rejection.brl
│   └── messaging
│       └── build-customer-message.brl
│
├── bom
│   ├── model.bom
│   └── model_en_US.voc
│
├── ruleflow
│   └── loan-eligibility.rfl
│
└── Ruleset Parameters
    ├── applicant : Applicant          (IN)
    └── response  : LoanResponse       (IN_OUT)


Referenced XOM:  loan-eligibility-xom  [Java Project]`,
      note: "Four rules for four policy statements, one file each. Resist the urge to combine them into one big rule — separate rules mean you can see exactly which one fired in the execution trace, and a business user can change one without reading the others."
    },
    quiz: {
      kind: "choose",
      prompt: "You declare a ruleset parameter `response` with direction OUT. Which statement is true?",
      options: [
        "The caller must create the LoanResponse object and pass it in",
        "The ruleset produces it and returns it to the caller; the caller does not supply one",
        "Rules cannot write to it",
        "It is the same as IN_OUT"
      ],
      answer: 1,
      explain: "OUT means the ruleset is responsible for the value and hands it back — the caller supplies nothing. IN_OUT means the caller passes an object in, rules modify it, and it returns. Both are legitimate; the choice affects your calling code in Phase 5, so decide deliberately rather than by accident."
    },
    mistake: {
      title: "One giant rule containing the whole policy",
      symptom: "A single rule with eight or-conditions. When a decision comes out wrong, nobody can tell which clause caused it, and the execution trace shows only 'rule fired'.",
      cause: "It feels efficient to write the policy once. It is not — you have collapsed four separately-governed business statements into one artefact.",
      fix: "One business statement, one rule. The trace then tells you exactly which policy rejected the applicant, business users can change one threshold without reading the others, and the reason message writes itself. Rule engines are optimised for many small rules; that is what they are for."
    }
  },

  /* ---------------------------------------------------------------- 2.8 */
  {
    id: "p2-t8",
    title: "Writing your first action rule (BAL)",
    minutes: 15,
    tag: "Authoring ★",
    intro: `An **action rule** is the basic rule artefact: a condition and an action, written in **BAL** (Business Action Language) — ODM's near-English syntax.

The shape is always the same:

\`\`\`
definitions
    set 'the applicant' to a Applicant;
if
    the age of 'the applicant' is less than 21
then
    set the eligibility of 'the response' to false;
    set the reason of 'the response' to "Applicant must be at least 21";
\`\`\`

Three parts:
- **definitions** — bind variables to objects the engine should match. Optional but almost always present.
- **if** — the conditions. Omit it and the rule always fires.
- **then** — the actions. What happens when the conditions hold.

There is also an optional **else** part. Use it sparingly — separate rules are usually clearer than one rule with two branches.`,
    jargon: [
      { term: "Action rule", plain: "A single if/then rule written in BAL." },
      { term: "BAL", plain: "Business Action Language — ODM's readable rule syntax." },
      { term: "definitions", plain: "The block where you bind a variable to an object type the engine should match." },
      { term: "Pattern matching", plain: "The engine finding objects in working memory that match a rule's definitions." },
      { term: "Fire", plain: "To execute a rule's then-part because its conditions were true." }
    ],
    sections: [
      {
        title: "The operators you will use",
        open: true,
        body: `| BAL | Meaning |
|---|---|
| \`is\`, \`is not\` | equality |
| \`is more than\`, \`is less than\` | > and < |
| \`is at least\`, \`is at most\` | >= and <= |
| \`is between X and Y\` | inclusive range |
| \`is one of { A, B }\` | membership |
| \`and\`, \`or\`, \`not\` | boolean combination |
| \`is null\`, \`is not null\` | null checks |
| \`contains\` | substring or collection membership |

"is at least 700" is exactly \`>= 700\`. When translating a policy document, watch the boundaries: "over 700" and "at least 700" differ by one applicant with a score of exactly 700, and that difference will eventually be a production incident.`
      },
      {
        title: "The definitions block",
        open: true,
        body: `\`\`\`
definitions
    set 'the applicant' to a Applicant;
\`\`\`

This says: find an object of type \`Applicant\` in working memory and call it 'the applicant'. If several exist, the rule evaluates once **per matching object** — which is the heart of how a rule engine differs from a for-loop.

You can filter right in the definition:
\`\`\`
definitions
    set 'the applicant' to a Applicant where the age of this is at least 21;
\`\`\`

And you can define plain values:
\`\`\`
definitions
    set 'minimum score' to 700;
\`\`\`

For a single-applicant ruleset, ruleset parameters are already available by name, so definitions are often about readability rather than matching.`
      },
      {
        title: "Actions you can write in the then-part",
        open: false,
        body: `\`\`\`
set the eligibility of 'the response' to false;
add "Salary below minimum" to the messages of 'the response';
insert a new Loan;                    // add an object to working memory
update 'the applicant';               // tell the engine an object changed
print "debug: rule fired";            // console output, useful when testing
\`\`\`

\`update\` matters in the RetePlus algorithm: if a rule changes an object and other rules depend on that change, the engine needs to know to re-evaluate. Miss it and rules that should re-fire, don't. Phase 3 covers why.`
      }
    ],
    diagram: {
      caption: "Anatomy of an action rule",
      kind: "layers",
      layers: [
        { label: "definitions", sub: "set 'the applicant' to a Applicant;", tone: "b" },
        { label: "if", sub: "the age of 'the applicant' is less than 21", tone: "c" },
        { label: "then", sub: "set the eligibility of 'the response' to false;", tone: "ok" },
        { label: "else (optional)", sub: "rarely needed — prefer a separate rule", tone: "a" }
      ]
    },
    example: {
      caption: "All four Sunrise Bank rules, written out",
      lang: "text",
      code: `/* ===== rules/eligibility/reject-under-age.brl ===== */
definitions
    set 'the applicant' to a Applicant;
if
    the age of 'the applicant' is less than 21
then
    set the eligibility of 'the response' to false;
    set the reason of 'the response' to "Applicant must be at least 21";
    add "Age check failed" to the messages of 'the response';


/* ===== rules/eligibility/reject-low-salary.brl ===== */
definitions
    set 'the applicant' to a Applicant;
if
    the annual salary of 'the applicant' is less than 30000
then
    set the eligibility of 'the response' to false;
    set the reason of 'the response' to "Minimum annual salary is 30,000";
    add "Salary check failed" to the messages of 'the response';


/* ===== rules/eligibility/reject-low-credit-score.brl ===== */
definitions
    set 'the applicant' to a Applicant;
if
    the credit score of 'the applicant' is less than 700
then
    set the eligibility of 'the response' to false;
    set the reason of 'the response' to "Minimum credit score is 700";
    add "Credit score check failed" to the messages of 'the response';


/* ===== rules/eligibility/approve-if-no-rejection.brl ===== */
/* priority: low  -- must run AFTER the rejection rules */
if
    the reason of 'the response' is null
then
    set the eligibility of 'the response' to true;
    set the reason of 'the response' to "Meets all pre-screening criteria";`,
      note: "The fourth rule is the interesting one. It has no definitions block and fires only if nothing else has set a reason. Its correctness depends entirely on running last — which is a fragile way to build a policy. Topic 3.2 shows the robust alternative, and Phase 3's ruleflow makes the ordering explicit instead of implicit."
    },
    quiz: {
      kind: "predict",
      prompt: "Vikram: age 19, salary 52,000, credit score 710. All four rules above run, with approve-if-no-rejection last. What is the final response?",
      options: [
        "eligible = true, reason = \"Meets all pre-screening criteria\"",
        "eligible = false, reason = \"Applicant must be at least 21\"",
        "eligible = false, reason = null",
        "No rule fires"
      ],
      answer: 1,
      explain: "Only the age rule matches (19 < 21). It sets eligible=false and a reason. Salary 52,000 and score 710 both pass, so those rules do not fire. The approval rule then checks whether the reason is null — it is not, so it does not fire. Final answer: rejected for age. Trace it rule by rule; that habit is exactly what Phase 7 debugging requires."
    },
    mistake: {
      title: "Two rules both fire and the last one wins",
      symptom: "An applicant fails on both salary and credit score, but the reason shown is only one of them — and which one seems arbitrary.",
      cause: "Both rules fire and both call set the reason. The second overwrites the first, and without explicit priorities the order is whatever the engine chose.",
      fix: "Decide the intent. If you want all failure reasons, use add ... to the messages of the response (a list) rather than overwriting a single field. If you want only the first, set explicit priorities or use a ruleflow with ordered tasks. Never leave it to chance — 'it happened to work in testing' is not a design."
    }
  },

  /* ---------------------------------------------------------------- 2.9 */
  {
    id: "p2-t9",
    title: "Decision tables",
    minutes: 15,
    tag: "Authoring ★",
    intro: `A **decision table** is a grid: each row is a rule, each column is a condition or an action. When a policy is "the same handful of conditions, many combinations of values", a table says in twelve rows what would take twelve separate rule files.

Remember \`RatePolicy\` from topic 1.8 — the Java class with credit-score bands and interest rates? That is a decision table wanting to happen:

| Credit score | Existing loan | Interest rate | Approved |
|---|---|---|---|
| ≥ 750 | no | 8.5% | yes |
| ≥ 750 | yes | 9.5% | yes |
| 700–749 | no | 10.5% | yes |
| 700–749 | yes | 12.0% | yes |
| 650–699 | any | 14.0% | refer |
| < 650 | any | — | no |

A lending manager can read that in ten seconds and spot a missing case. That is why decision tables are, in practice, the most-used artefact in real ODM projects — and why your roadmap says to get very comfortable with them.`,
    jargon: [
      { term: "Decision table", plain: "A grid of rules: condition columns, action columns, one rule per row." },
      { term: "Condition column", plain: "A column testing one thing, e.g. credit score." },
      { term: "Action column", plain: "A column setting one outcome, e.g. interest rate." },
      { term: "Gap", plain: "A combination of inputs no row matches — nothing fires." },
      { term: "Overlap", plain: "A combination several rows match — more than one fires." },
      { term: "Otherwise row", plain: "A catch-all final row that matches anything not caught above." }
    ],
    sections: [
      {
        title: "When to use a table instead of action rules",
        open: true,
        body: `**Use a decision table when:**
- The same 2–4 conditions repeat with different values.
- The policy already exists as a grid in a spreadsheet (it usually does).
- Business users will maintain it.
- You want to see all cases side by side and spot gaps.

**Use action rules when:**
- The conditions differ from rule to rule.
- The logic is genuinely one-off.
- You need complex conditions over collections.

A decision table with fifty columns is a sign you chose wrong. So is an action rule that is the twelfth near-identical copy of its neighbours.`
      },
      {
        title: "Gaps and overlaps — the two things to check",
        open: true,
        body: `**A gap** is a combination of inputs that matches no row. In our table, what happens to an applicant with a credit score of exactly 649 and no existing loan? Row 6 catches it (< 650). Good. But if row 6 said "< 640", scores of 640–649 would fall through a gap and the table would produce no decision at all — silently.

**An overlap** is a combination matching several rows. If row 3 says "700–749" and row 4 says "≥ 700", an applicant with 720 matches both. Which wins depends on the table's rule-ordering setting, and relying on that is how quiet bugs are born.

Rule Designer has a **gap and overlap checker** on decision tables. Run it. Every time. It takes two seconds and it is the single highest-value habit in Phase 2.`
      },
      {
        title: "Table settings worth knowing",
        open: false,
        body: `- **Rule ordering** — do all matching rows fire, or only the first? Configurable per table.
- **Otherwise row** — a final catch-all so the table can never produce nothing. Add one to almost every table.
- **Merged cells** — merge identical adjacent condition cells to show hierarchy visually. Purely cosmetic, hugely helpful for readability.
- **Column templates** — restrict what a business user may type in a cell (a range, a domain value list). This is how you let non-developers edit safely.

That last one deserves emphasis: templates are how you give business users real editing power without letting them break the ruleset.`
      }
    ],
    diagram: {
      caption: "Twelve near-identical action rules, or one table",
      kind: "columns",
      cols: [
        { title: "As action rules", tone: "warn", items: ["12 separate files", "Copy-paste drift", "Gaps invisible", "Business can't review it", "Adding a band = new file"] },
        { title: "As a decision table", tone: "ok", items: ["1 artefact, 12 rows", "Consistent structure", "Gap checker finds holes", "Readable at a glance", "Adding a band = new row"] }
      ]
    },
    example: {
      caption: "The Sunrise Bank pricing table as ODM would render it",
      lang: "text",
      code: `DECISION TABLE: loan-pricing

+---+------------------+-------------------+---------------+-------------+
|   | CONDITION        | CONDITION         | ACTION        | ACTION      |
|   | credit score of  | applicant has an  | set interest  | set the     |
| # | the applicant    | existing loan     | rate to       | decision to |
+---+------------------+-------------------+---------------+-------------+
| 1 | >= 750           | no                | 8.5           | APPROVE     |
| 2 | >= 750           | yes               | 9.5           | APPROVE     |
| 3 | 700 .. 749       | no                | 10.5          | APPROVE     |
| 4 | 700 .. 749       | yes               | 12.0          | APPROVE     |
| 5 | 650 .. 699       | -                 | 14.0          | REFER       |
| 6 | < 650            | -                 | -             | DECLINE     |
+---+------------------+-------------------+---------------+-------------+
                                                         "-" = any value

GAP / OVERLAP CHECK
  Ranges covered: (-inf, 650) [650,700) [700,750) [750, +inf)
  -> no gaps, no overlaps on credit score.
  -> "existing loan" is unconstrained in rows 5 and 6: intentional.

EQUIVALENT ACTION RULE for row 3 (what ODM generates internally):
  if the credit score of 'the applicant' is between 700 and 749
     and 'the applicant' does not have an existing loan
  then set the interest rate of 'the response' to 10.5;
       set the decision of 'the response' to "APPROVE";`,
      note: "Compare this against RatePolicy.java from topic 1.8. Identical policy. One is a grid a lending manager reviews in a meeting; the other is a Java class behind a release process. This contrast is the single clearest way to explain ODM's value in an interview."
    },
    playground: {
      caption: "The same table as Java. Run it, then imagine asking a lending manager to review this instead of the grid.",
      code: `int creditScore = 742;
boolean hasExistingLoan = true;

double rate = 0;
String decision = "DECLINE";

if (creditScore >= 750 && hasExistingLoan == false) {
    rate = 8.5;  decision = "APPROVE";
} else if (creditScore >= 750) {
    rate = 9.5;  decision = "APPROVE";
} else if (creditScore >= 700 && hasExistingLoan == false) {
    rate = 10.5; decision = "APPROVE";
} else if (creditScore >= 700) {
    rate = 12.0; decision = "APPROVE";
} else if (creditScore >= 650) {
    rate = 14.0; decision = "REFER";
}

System.out.println("Decision: " + decision);
System.out.println("Rate: " + rate);

// Now find the gap: set creditScore to 640 and run it again.
// The Java version has the same hole the table would — but you
// cannot SEE it here the way you can in a grid.`,
      output: "Decision: APPROVE\nRate: 12.0"
    },
    quiz: {
      kind: "choose",
      prompt: "A decision table has rows for credit score ranges: `>= 750`, `700..749`, `650..699`. An applicant arrives with a score of 630. What happens?",
      options: [
        "The last row fires as a default",
        "No row matches — the table produces no action at all",
        "ODM throws an exception",
        "The closest row (650..699) fires"
      ],
      answer: 1,
      explain: "That is a gap. No row matches 630, so the table does nothing — silently. No error, no decision, no clue. The applicant's response object keeps whatever values it already had, which is usually the Java default. This is why every table needs an otherwise row and why you run the gap checker before you trust a table."
    },
    mistake: {
      title: "A gap in the table, discovered in production",
      symptom: "Certain applicants get no decision at all. Response comes back with eligible=false and reason=null, or default values that make no sense.",
      cause: "A combination of inputs no row covers — usually at a boundary (exactly 700, exactly 0, a negative value) or a value the business never mentioned.",
      fix: "Three defences, all cheap: (1) run Rule Designer's gap and overlap checker on every table, every time you change it; (2) always add an otherwise row that sets an explicit default, even if that default is 'REFER to a human'; (3) test the exact boundary values, not just the middles — 699, 700, 749, 750."
    }
  },

  /* ---------------------------------------------------------------- 2.10 */
  {
    id: "p2-t10",
    title: "Testing rules locally",
    minutes: 12,
    tag: "Quality",
    intro: `Before anything is deployed anywhere, you need to answer one question: *did the right rules fire, and did they produce the right decision?*

Rule Designer gives you three ways to find out, in increasing order of formality:

**Run configuration** — a local execution. You supply input values, run the ruleset in the IDE, and read the output. Fast, and where you will spend most of your debugging time.

**Execution trace** — the log of which rules fired, in what order, on which objects. This is your single most important debugging tool for the rest of your ODM career.

**DVS (Decision Validation Services)** — scenario-based testing driven from an Excel workbook. Business users write scenarios with expected results, and ODM runs them and reports pass/fail. This is regression testing that non-developers can own.

Get comfortable reading a trace now. Phase 7's entire "rule didn't fire" topic is trace-reading.`,
    jargon: [
      { term: "Run configuration", plain: "A saved local execution setup: which ruleset, which input values." },
      { term: "Execution trace", plain: "A record of which rules fired, in order, with the objects they matched." },
      { term: "DVS", plain: "Decision Validation Services — ODM's scenario testing framework, usually driven from Excel." },
      { term: "Scenario", plain: "One test case: a set of inputs plus the expected outputs." },
      { term: "Working memory", plain: "The set of objects the engine currently knows about and matches rules against." }
    ],
    sections: [
      {
        title: "Setting up a run configuration",
        open: true,
        body: `Right-click the rule project → Run As → Run Configurations → new **Decision Run**.

You then supply a value for each ruleset parameter. For \`applicant\` you fill in age, salary, credit score; for \`response\` you usually let ODM create an empty object.

Save one configuration per interesting case:

| Configuration | age | salary | score | Expect |
|---|---|---|---|---|
| happy-path | 28 | 45000 | 742 | eligible |
| under-age | 19 | 52000 | 710 | reject: age |
| low-salary | 30 | 22000 | 780 | reject: salary |
| low-score | 35 | 60000 | 640 | reject: score |
| boundary-21 | 21 | 30000 | 700 | eligible (all exactly at the limit) |
| all-fail | 18 | 12000 | 500 | reject — but with which reason? |

That last one is deliberately interesting: it exposes the overwriting-reason problem from topic 2.8. Boundary cases and multi-failure cases find more bugs than happy paths ever will.`
      },
      {
        title: "Reading an execution trace",
        open: true,
        body: `A trace looks roughly like this:

\`\`\`
--- Ruleflow: loan-eligibility ---
  Task: validation        (0 rules fired)
  Task: eligibility
      FIRED  reject-under-age        [applicant = Vikram Rao]
      -- reject-low-salary            not fired
      -- reject-low-credit-score      not fired
      -- approve-if-no-rejection      not fired
  Task: messaging
      FIRED  build-customer-message
--- 2 rules fired ---
\`\`\`

Three questions to ask of every trace:
1. Did the rule I expected fire? If not, why did its condition evaluate false?
2. Did a rule fire that should not have?
3. Did rules fire in the order I intended?

Enable tracing in the run configuration. Do it once, and leave it on.`
      },
      {
        title: "DVS in one paragraph",
        open: false,
        body: `ODM can generate an Excel template shaped by your ruleset parameters. Each row is a scenario: input columns and expected-output columns. A business user fills in fifty rows from real historical cases. You run the DVS test suite and get a report showing which scenarios passed and which produced a different result.

The value is twofold: business users can express test cases without writing code, and you get a regression suite that catches the moment someone's threshold change breaks an unrelated case.

You do not need DVS for POC-01. Know that it exists, and mention it when someone asks how rules are tested — it is exactly the kind of answer that separates a trained candidate from someone who watched a tutorial.`
      }
    ],
    diagram: {
      caption: "Three levels of testing, before anything is deployed",
      kind: "flow",
      dir: "right",
      nodes: [
        { label: "Run configuration", sub: "one case, run it now", tone: "a" },
        { label: "Execution trace", sub: "which rules fired, in what order", tone: "b" },
        { label: "DVS scenarios", sub: "many cases, expected results, pass/fail", tone: "c" },
        { label: "Confidence to deploy", sub: "Phase 4", tone: "ok" }
      ]
    },
    example: {
      caption: "One full local test, input to trace to output",
      lang: "text",
      code: `=== RUN CONFIGURATION: under-age ===

INPUT
  applicant.name            = "Vikram Rao"
  applicant.age             = 19
  applicant.annualSalary    = 52000.0
  applicant.creditScore     = 710
  applicant.hasExistingLoan = false
  response                  = new LoanResponse()   (all defaults)

--- EXECUTION TRACE ---
Ruleflow 'loan-eligibility' started
  > Task 'validation'   : 1 rule considered, 0 fired
  > Task 'eligibility'  : 4 rules considered
        FIRED   reject-under-age
                condition: the age of the applicant is less than 21
                           19 < 21  -> TRUE
                actions:   eligibility := false
                           reason := "Applicant must be at least 21"
        skipped reject-low-salary        (52000 < 30000 -> FALSE)
        skipped reject-low-credit-score  (710 < 700     -> FALSE)
        skipped approve-if-no-rejection  (reason is null -> FALSE)
  > Task 'messaging'    : 1 rule considered, 1 fired
        FIRED   build-customer-message
Ruleflow completed. 2 rules fired. Duration 3 ms.

OUTPUT
  response.eligible = false
  response.reason   = "Applicant must be at least 21"
  response.messages = ["Age check failed",
                       "Thank you. We are unable to proceed at this time."]

VERDICT: matches expectation.`,
      note: "Notice the trace shows why each rule did NOT fire, with the actual comparison. When you hit 'my rule didn't fire' in Phase 7, this is the artefact that answers it — usually in under a minute, once you are used to reading it."
    },
    quiz: {
      kind: "choose",
      prompt: "Your execution trace shows “0 rules fired” but you expected the age rule to reject the applicant. What should you check FIRST?",
      options: [
        "Redeploy the ruleset to the server",
        "Whether the applicant object actually reached working memory with the values you think it has",
        "Rewrite the rule as a decision table",
        "Increase the rule's priority"
      ],
      answer: 1,
      explain: "Zero rules firing almost always means the engine had nothing to match, or matched against different data than you assume — a null parameter, an object never inserted, or a value that did not arrive. Check the inputs before you touch the rules. Changing priorities cannot help a rule whose condition is false, and redeploying changes nothing about a local test."
    },
    mistake: {
      title: "Testing only the happy path",
      symptom: "The demo works beautifully. The first week in production produces three cases nobody has ever seen a decision for.",
      cause: "Test cases were written from the example in the requirements document, which is always a well-formed, comfortably-passing applicant.",
      fix: "For every numeric threshold write three cases: just below, exactly on, just above. For every optional field write a case where it is missing. Write one case where everything fails at once, and one where the input is nonsense. Six extra run configurations, half an hour, and they will catch things the happy path never can."
    }
  }

  ],

  quiz: [
    {
      q: "What is the primary business justification for using a rules engine rather than if/else in application code?",
      options: ["Rules execute faster", "Business logic can change without a code change and release", "Java cannot express complex conditions", "It reduces the number of servers needed"],
      answer: 1,
      explain: "The value is in the lifecycle: who can change the logic, how quickly, and with what audit trail. Performance is not the argument."
    },
    {
      q: "Put the flow in order: Vocabulary, XOM, Decision, Rules, BOM.",
      options: ["BOM → XOM → Vocabulary → Rules → Decision", "XOM → BOM → Vocabulary → Rules → Decision", "Vocabulary → BOM → XOM → Rules → Decision", "XOM → Vocabulary → BOM → Rules → Decision"],
      answer: 1,
      explain: "Real Java classes (XOM) are described by the business model (BOM), which generates readable phrases (Vocabulary), which rules are written in, producing a Decision."
    },
    {
      q: "What is the BOM-to-XOM (B2X) mapping for?",
      options: ["Converting XML to Java", "Connecting each business-facing member back to the Java that implements it", "Mapping rules to rule tasks", "Translating vocabulary between languages"],
      answer: 1,
      explain: "B2X is the link that lets rules speak business language while the engine executes real Java. It is also what lets you rename Java without touching rules."
    },
    {
      q: "Which is the best use for a virtual BOM attribute?",
      options: ["Hiding a technical field from business users", "Exposing a business concept like 'debt to income ratio' that has no matching Java method", "Renaming an existing attribute", "Adding a new rule"],
      answer: 1,
      explain: "A virtual member gives the business a concept they think in, computed by a B2X mapping, without changing the XOM jar."
    },
    {
      q: "A decision table has no row matching a particular input combination. What happens at run time?",
      options: ["An exception is thrown", "The nearest row fires", "Nothing fires — the table produces no action, silently", "The ruleset returns an error to the caller"],
      answer: 2,
      explain: "That is a gap. Silence is the dangerous part: the response keeps its default values and nothing signals a problem. Add an otherwise row and run the gap checker."
    },
    {
      q: "Two rules both fire and each sets `the reason of the response`. What determines the final value?",
      options: ["Alphabetical rule name", "Whichever fired last, which without explicit priorities or a ruleflow is not reliably predictable", "The engine merges both", "The first one always wins"],
      answer: 1,
      explain: "Last write wins, and the firing order is only guaranteed if you set it — with priorities or a ruleflow. If you need every reason, collect them into a list instead of overwriting one field."
    },
    {
      q: "Where should a business analyst change the minimum credit score in a properly set-up ODM project?",
      options: ["Rule Designer", "Decision Center", "The Decision Server console", "The XOM Java class"],
      answer: 1,
      explain: "Decision Center is the business-facing authoring and governance tool. Rules cannot be edited on the Decision Server at all."
    },
    {
      q: "A ruleset deploys successfully but the first execution throws NoSuchMethodError. What is the most likely cause?",
      options: ["A syntax error in a rule", "The XOM jar on the server is a different version from the one the rules were built against", "The ruleflow is missing", "Decision Center is out of sync"],
      answer: 1,
      explain: "A run-time-only NoSuchMethodError is the classic signature of a XOM classpath version mismatch between design time and run time."
    }
  ]
};
