/* =========================================================================
   FLASHCARDS — key terms across all phases
   Add your own freely: { term, definition, phase, group }
   ========================================================================= */

window.FLASHCARDS = [

/* ---------- ODM core artefacts ---------- */
{ term: "XOM", group: "ODM core", phase: 2,
  definition: "eXecution Object Model — the real Java classes (or XSD schema) the rule engine executes against at run time. If it is not in the XOM, no rule can see it." },

{ term: "BOM", group: "ODM core", phase: 2,
  definition: "Business Object Model — the business-facing view of the XOM. Same structure, but you control names, visibility and verbalizations. Rules are written against the BOM." },

{ term: "B2X mapping", group: "ODM core", phase: 2,
  definition: "BOM-to-XOM mapping. The link from each business member back to the Java that implements it. It is why renaming a Java field means fixing one mapping, not twelve rules." },

{ term: "Vocabulary", group: "ODM core", phase: 2,
  definition: "The readable phrases rules are written in, generated from the BOM and stored in the .voc file. 'the credit score of {this}'." },

{ term: "Verbalization", group: "ODM core", phase: 2,
  definition: "The readable phrase attached to one BOM element. Good ones read as English inside if/then; bad ones are why business users abandon Decision Center." },

{ term: "Virtual member", group: "ODM core", phase: 2,
  definition: "A BOM attribute or method with no direct Java equivalent — you supply the logic in the B2X mapping. How you give the business a concept like 'total outstanding debt' without changing the XOM." },

{ term: "Ruleset", group: "ODM core", phase: 4,
  definition: "The compiled, deployable package of a rule project: rules, BOM, ruleflow and parameter signatures. What the engine actually executes." },

{ term: "RuleApp", group: "ODM core", phase: 4,
  definition: "A versioned container holding one or more rulesets. Part of the path callers use: /RuleApp/1.0/ruleset/1.0." },

{ term: "Ruleset parameters", group: "ODM core", phase: 2,
  definition: "The declared inputs and outputs of a ruleset — IN, OUT or IN_OUT. They become the top-level keys of your REST JSON, so changing them is a major version bump." },

/* ---------- ODM components ---------- */
{ term: "Rule Designer", group: "Components", phase: 2,
  definition: "The Eclipse-based IDE where developers build rule projects: XOM reference, BOM, ruleflow, parameters and technical rules." },

{ term: "Decision Center", group: "Components", phase: 2,
  definition: "The web application where business users author, review and govern rules. Also the repository, with history, permissions and snapshots." },

{ term: "Decision Server", group: "Components", phase: 4,
  definition: "The runtime that executes deployed rulesets and answers calls from applications." },

{ term: "RES", group: "Components", phase: 4,
  definition: "Rule Execution Server — the rule-execution component and management console inside Decision Server. Often used interchangeably with 'Decision Server'." },

{ term: "XU (Execution Unit)", group: "Components", phase: 4,
  definition: "The component that loads rulesets, caches them compiled, and manages a pool of rule engines. The reason the first call after deployment is slow and the rest are fast." },

{ term: "HTDS", group: "Components", phase: 5,
  definition: "Hosted Transparent Decision Service — automatic REST/SOAP exposure of a deployed ruleset. 'Transparent' means you write no integration code." },

{ term: "DVS", group: "Components", phase: 2,
  definition: "Decision Validation Services — scenario-based testing driven from an Excel workbook, so business users can own regression tests." },

{ term: "Decision warehouse", group: "Components", phase: 4,
  definition: "Optional storage of execution traces on the server, for audit and later investigation of specific past decisions." },

/* ---------- Authoring ---------- */
{ term: "Action rule", group: "Authoring", phase: 2,
  definition: "A single if/then rule written in BAL, with optional definitions and else parts." },

{ term: "BAL", group: "Authoring", phase: 2,
  definition: "Business Action Language — ODM's near-English rule syntax. 'if the age of the applicant is less than 21 then…'" },

{ term: "definitions block", group: "Authoring", phase: 2,
  definition: "Where a rule binds a variable to an object the engine should match. If several objects match, the rule evaluates once per object." },

{ term: "Decision table", group: "Authoring", phase: 2,
  definition: "A grid where each row is a rule and each column a condition or action. The artefact business users most often own." },

{ term: "Gap", group: "Authoring", phase: 2,
  definition: "An input combination no decision table row matches. Nothing fires, silently. Fixed with an otherwise row." },

{ term: "Overlap", group: "Authoring", phase: 3,
  definition: "An input combination several rows match. Fine under first-match-wins; dangerous under all-match if the actions conflict." },

{ term: "Otherwise row", group: "Authoring", phase: 2,
  definition: "The catch-all final row of a decision table, guaranteeing the table can never produce nothing." },

{ term: "Column template", group: "Authoring", phase: 3,
  definition: "A constraint on what a decision table cell accepts — a range, a dropdown. How you let business users edit safely." },

{ term: "Decision tree", group: "Authoring", phase: 3,
  definition: "A branching structure where the next question depends on the previous answer. Use when a table would have many blank cells." },

{ term: "Scorecard", group: "Authoring", phase: 3,
  definition: "Accumulates points across attributes into a total score, then bands the total into an outcome. Lets factors compensate for one another." },

{ term: "Bin", group: "Authoring", phase: 3,
  definition: "One value range within a scorecard attribute, with its own points and reason code. Always bin the null case." },

{ term: "Reason code", group: "Authoring", phase: 3,
  definition: "A label on a scorecard bin explaining its contribution — how you tell a declined applicant why, which regulators often require." },

{ term: "Domain", group: "Authoring", phase: 2,
  definition: "A fixed list of allowed values on a BOM attribute, shown as a dropdown in the rule editor. Eliminates case-mismatch bugs." },

/* ---------- Execution ---------- */
{ term: "Ruleflow", group: "Execution", phase: 3,
  definition: "A flowchart of rule tasks defining execution order and conditional branching. The recommended way to control ordering." },

{ term: "Rule task", group: "Execution", phase: 3,
  definition: "One box in a ruleflow. Selects a set of rules (usually a package) and runs them with a chosen algorithm." },

{ term: "RetePlus", group: "Execution", phase: 3,
  definition: "IBM's enhanced Rete algorithm. Builds a match network, remembers partial matches, and supports chaining and object updates." },

{ term: "Sequential", group: "Execution", phase: 3,
  definition: "Compiles rules into a straight-through sequence, run once top to bottom. Fastest and most predictable — the default for decision services." },

{ term: "Fastpath", group: "Execution", phase: 3,
  definition: "A hybrid algorithm: sequential-like speed with limited support for object updates." },

{ term: "Inference / chaining", group: "Execution", phase: 3,
  definition: "One rule's action changing data so another rule now matches. Requires RetePlus and an update statement." },

{ term: "update statement", group: "Execution", phase: 3,
  definition: "Tells the RetePlus engine an object changed, so dependent rules re-evaluate. Forget it and rules do not re-fire; misuse it and you get an infinite loop." },

{ term: "Priority", group: "Execution", phase: 3,
  definition: "A numeric rule property; higher fires first within a task. Works, but is invisible in the project — prefer a ruleflow." },

{ term: "Conflict set", group: "Execution", phase: 3,
  definition: "The set of rules all matching at the same moment. Something must decide the firing order among them." },

{ term: "Working memory", group: "Execution", phase: 2,
  definition: "The objects the engine currently knows about and can match rules against." },

{ term: "Execution trace", group: "Execution", phase: 2,
  definition: "The record of which rules were considered, which fired, in what order, on which objects. Your most important debugging tool." },

/* ---------- Integration ---------- */
{ term: "Ruleset path", group: "Integration", phase: 4,
  definition: "The address used to invoke a ruleset: /RuleApp/version/ruleset/version. Case-sensitive, and it is your API contract." },

{ term: "Minor version bump", group: "Integration", phase: 4,
  definition: "1.0 → 1.1. Replaces the old version at the same major path; callers route forward automatically. Use for policy changes." },

{ term: "Major version bump", group: "Integration", phase: 4,
  definition: "1.0 → 2.0. Both versions coexist and callers must opt in. Required whenever ruleset parameters change." },

{ term: "Managed XOM", group: "Integration", phase: 4,
  definition: "A XOM jar uploaded to the Decision Server with the ruleset, rather than placed on the server classpath." },

{ term: "Stateless session", group: "Integration", phase: 5,
  definition: "One execution with no memory between calls. The usual choice — everything the rules need must be in the request." },

{ term: "Java rules API", group: "Integration", phase: 5,
  definition: "ODM's Java interface for executing rulesets in-process (IlrSessionFactory, IlrStatelessSession). Use when a network hop per call is unaffordable." },

{ term: "Snapshot", group: "Integration", phase: 4,
  definition: "A frozen, named copy of a rule project in Decision Center. Deploy from a snapshot, never from the working state." },

/* ---------- Java ---------- */
{ term: "JavaBean convention", group: "Java", phase: 1,
  definition: "getSomething() / isSomething() / setSomething(v). ODM generates its vocabulary from these, so breaking the convention breaks the BOM import." },

{ term: "POJO", group: "Java", phase: 1,
  definition: "Plain Old Java Object — a simple class with fields and accessors, no framework dependencies. What a XOM class should be." },

{ term: "List vs Set vs Map", group: "Java", phase: 1,
  definition: "List: ordered, duplicates allowed, access by index. Set: unique, unordered, fast contains(). Map: key → value lookup, unique keys." },

{ term: "ConcurrentModificationException", group: "Java", phase: 1,
  definition: "Thrown when you add or remove from a collection while a for-each loop is walking it. Use removeIf() or an explicit Iterator." },

{ term: "Vacuous truth", group: "Java", phase: 3,
  definition: "'All items satisfy X' is true when there are no items. Why a universal rule condition needs a count guard for the empty case." },

{ term: "Terminal operation", group: "Java", phase: 1,
  definition: "The step that actually runs a stream: collect, count, sum, forEach. Without one, filter and map do nothing at all." },

{ term: "Optional", group: "Java", phase: 1,
  definition: "A container holding either a value or nothing, making absence explicit in the type. Use orElse; treat .get() as forbidden." },

{ term: "Unboxing null", group: "Java", phase: 1,
  definition: "Converting a null Integer into a primitive int throws NullPointerException. The reason map.get(missingKey) assigned to an int blows up." },

/* ---------- Troubleshooting ---------- */
{ term: "Silent failure", group: "Troubleshooting", phase: 7,
  definition: "Wrong or absent behaviour with no error raised. In ODM, null usually causes silence rather than an exception — which is what makes it dangerous." },

{ term: "ClassNotFoundException (ODM)", group: "Troubleshooting", phase: 7,
  definition: "At execution after a successful deployment: the ruleset installed but the XOM classes are not on the server. The classic first-deployment failure." },

{ term: "NoSuchMethodError (ODM)", group: "Troubleshooting", phase: 7,
  definition: "A XOM jar is present but is a different version from the one the rules were compiled against. Version your jars in their filenames." },

{ term: "Considered vs fired", group: "Troubleshooting", phase: 7,
  definition: "Considered means the engine evaluated the rule's conditions. Fired means they were true. 'Considered but not fired' eliminates every ruleflow and selection cause." },

{ term: "Bisecting the chain", group: "Troubleshooting", phase: 7,
  definition: "Test the midpoint to eliminate half the system. The RES console test is the best midpoint: right answer means the problem is above it, wrong means below." },

{ term: "Fail fast", group: "Troubleshooting", phase: 7,
  definition: "Detect bad input at the boundary and stop with a message naming the field and the value. Better than a plausible wrong answer downstream." },

{ term: "Cold start", group: "Troubleshooting", phase: 5,
  definition: "The first call after deployment is much slower because the ruleset must be parsed and compiled before caching. Warm it with a throwaway call." }

];
