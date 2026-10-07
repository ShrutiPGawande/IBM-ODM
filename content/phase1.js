/* =========================================================================
   PHASE 1 — Java Foundations
   Edit freely. Schema of a topic:
   {
     id, title, minutes, tag,
     intro:      "plain-English paragraph(s). Supports **bold**, `code`, - bullets",
     jargon:     [{term, plain}],
     sections:   [{title, body, open:true|false}],
     diagram:    {caption, kind:'flow'|'split'|'columns'|'layers', ...},
     example:    {caption, lang, code, note},
     playground: {caption, code, output},        // optional
     quiz:       {kind:'predict'|'choose', prompt, code, options:[], answer:0, explain},
     mistake:    {title, symptom, cause, fix}
   }
   ========================================================================= */

window.PHASE_1 = {
  id: "phase1",
  number: 1,
  title: "Java Foundations",
  subtitle: "Read and write the Java that ODM projects are actually made of",
  goal: "Not “I know Java syntax” — but “I can comfortably read and write the Java code used in an ODM rule project.”",
  badge: { name: "Java Reader", icon: "☕" },
  topics: [

  /* ---------------------------------------------------------------- 1.1 */
  {
    id: "p1-t1",
    title: "Why Java matters for ODM",
    minutes: 8,
    tag: "Orientation",
    intro: `Business rules feel like they float above code — “if the credit score is at least 700, approve the loan.” They don't. Every ODM rule you will ever write is secretly reading and writing **Java objects**.

When a business user writes *"the credit score of the applicant"*, ODM is calling \`applicant.getCreditScore()\` on a real Java object underneath. That is the whole trick. If you can read Java classes, fields and getters, ODM's vocabulary stops being magic and becomes obvious.

So the goal of this phase is narrow and practical. You are not becoming a Java developer. You are becoming someone who can open a class in a rule project, understand what data the rules can see, and write the small helper methods a rule project needs.`,
    jargon: [
      { term: "ODM", plain: "IBM Operational Decision Manager — software that lets business logic live in editable rules instead of hardcoded application code." },
      { term: "Rule", plain: "One business statement ODM can execute, e.g. 'if the age is below 21 then reject'." },
      { term: "Getter", plain: "A Java method like getCreditScore() whose only job is to hand back the value of a field." }
    ],
    sections: [
      {
        title: "Our storyline: Sunrise Bank",
        open: true,
        body: `Every topic on this site uses one running example so the pieces connect instead of scattering.

**Sunrise Bank** wants to automate the first pass of its personal-loan applications. A loan officer currently checks four things by hand:

- Age
- Annual salary
- Credit score
- Whether the applicant already has an existing loan

The rules today are simple: age at least 21, salary at least 30,000, credit score at least 700. But the bank changes these thresholds every quarter, and each change currently means a developer, a code change and a release. That pain is exactly the problem ODM exists to solve.

By Phase 5 this same example will be a deployed decision service that you call from Postman and from Java. Right now, in Phase 1, it is just a Java class.`
      },
      {
        title: "What Java you actually need (and what you can skip)",
        open: false,
        body: `**Need it, deeply:**
- Classes, objects, fields, getters/setters
- Collections: \`List\`, \`Set\`, \`Map\` and how to loop over them
- Generics enough to read \`List<Applicant>\`
- Exception handling

**Need it, lightly:**
- Interfaces, inheritance
- Streams and lambdas
- \`Optional\`

**Can skip for now:**
- Threads and concurrency
- Swing/JavaFX and anything GUI
- Reflection, annotation processing, the module system

> If a Java tutorial starts talking about thread pools, close the tab. It is not on your path.`
      }
    ],
    diagram: {
      caption: "Where Java sits in the ODM pipeline — you will meet every box in this chain by Phase 5",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "Java / application data", sub: "Applicant, Loan objects", tone: "a" },
        { label: "XOM", sub: "the execution object model — real Java classes", tone: "a" },
        { label: "BOM", sub: "the business view of those classes", tone: "b" },
        { label: "Vocabulary", sub: "“the credit score of the applicant”", tone: "b" },
        { label: "Business rules", sub: "if / then, decision tables", tone: "c" },
        { label: "Rule execution", sub: "the engine fires matching rules", tone: "c" },
        { label: "Decision", sub: "Eligible / Not eligible", tone: "ok" }
      ]
    },
    example: {
      caption: "The very first version of our data — plain Java, no ODM yet",
      lang: "java",
      code: `public class Applicant {
    private String name;
    private int age;
    private double annualSalary;
    private int creditScore;
    private boolean hasExistingLoan;

    // getters are what ODM will turn into business vocabulary
    public String getName()          { return name; }
    public int getAge()              { return age; }
    public double getAnnualSalary()  { return annualSalary; }
    public int getCreditScore()      { return creditScore; }
    public boolean isHasExistingLoan() { return hasExistingLoan; }
}`,
      note: "Look at those five getters. In Phase 2 each one becomes a phrase a business user can click on. Nothing else needs to happen for that — ODM reads the getters."
    },
    quiz: {
      kind: "choose",
      prompt: "A business user writes the rule condition “the credit score of the applicant is at least 700”. What is ODM actually calling under the hood?",
      options: [
        "A database query against the credit_score column",
        "The Java method applicant.getCreditScore()",
        "A REST call to a credit bureau",
        "A stored procedure defined in the rule project"
      ],
      answer: 1,
      explain: "ODM's vocabulary is generated from the Java class. The phrase 'the credit score of the applicant' is a readable label bound to getCreditScore(). No database or network is involved at rule-execution time — the object is already in memory, handed to the engine by the calling application."
    },
    mistake: {
      title: "“I'll finish all of Java first, then start ODM”",
      symptom: "Three months in, you know Java streams well and have never opened Rule Designer.",
      cause: "Treating Java as a prerequisite gate rather than a parallel track. Java is enormous; ODM only uses a slice of it.",
      fix: "Get comfortable through topic 1.9 (iteration), then start Phase 2 immediately and keep learning streams, Optional and the rest in parallel. Your roadmap says the same thing: phases are milestones, not weeks."
    }
  },

  /* ---------------------------------------------------------------- 1.2 */
  {
    id: "p1-t2",
    title: "Classes and objects",
    minutes: 12,
    tag: "OOP",
    intro: `A **class** is a blueprint. An **object** is one thing built from that blueprint.

\`Applicant\` is a class — it says "anything that is an applicant has a name, an age, a salary, a credit score." It holds no actual data. Asha Kulkarni, age 28, salary 45,000 is an *object*: one specific applicant with real values filled in.

The word \`new\` is what turns a blueprint into a thing. \`new Applicant()\` builds one fresh applicant in memory and hands you a reference to it.

This matters for ODM more than it sounds. When your decision service runs, the application creates one \`Applicant\` object per request, fills it with data from the incoming JSON, and hands it to the rule engine. The rules then talk about *that object*. One request, one object, one decision.`,
    jargon: [
      { term: "Field", plain: "A named piece of data stored inside an object, e.g. age." },
      { term: "Constructor", plain: "A special method that runs when you say new Applicant(...) — it sets the starting values." },
      { term: "Instance", plain: "Another word for object. 'Two instances of Applicant' = two applicant objects." }
    ],
    sections: [
      {
        title: "The four parts of a class you will see over and over",
        open: true,
        body: `1. **Fields** — the data. \`private int age;\`
2. **Constructor** — how one gets built. \`public Applicant(String name, int age) {...}\`
3. **Getters/setters** — controlled access to the data.
4. **Behaviour methods** — anything the object can do or compute, e.g. \`isAdult()\`.

For an ODM XOM class, parts 1–3 are essential and part 4 is optional — you generally want the *decision* logic in rules, not in Java. A method like \`isEligible()\` written in Java is a small warning sign: that is a business rule hiding in code.`
      },
      {
        title: "Reference vs value — the one gotcha",
        open: false,
        body: `A variable holding an object does not hold the object. It holds a **reference** (an arrow pointing at it).

\`\`\`
Applicant a = new Applicant("Asha", 28);
Applicant b = a;          // b points at the SAME object
b.setAge(29);
a.getAge();               // 29 — not 28!
\`\`\`

There is only one applicant in memory; \`a\` and \`b\` are two arrows to it. This bites people in ODM when a rule modifies an object and another rule later reads it — they are seeing the same object, already changed. That is intentional and useful, but it surprises you the first time.`
      }
    ],
    diagram: {
      caption: "One class, many objects",
      kind: "columns",
      cols: [
        { title: "Applicant (class)", tone: "b", items: ["Blueprint only", "name : String", "age : int", "creditScore : int", "No values yet"] },
        { title: "Object #1", tone: "a", items: ["name = \"Asha Kulkarni\"", "age = 28", "creditScore = 742", "→ approved later"] },
        { title: "Object #2", tone: "a", items: ["name = \"Vikram Rao\"", "age = 19", "creditScore = 690", "→ rejected later"] }
      ]
    },
    example: {
      caption: "Applicant with a constructor, and two objects created from it",
      lang: "java",
      code: `public class Applicant {
    private String name;
    private int age;
    private int creditScore;

    public Applicant(String name, int age, int creditScore) {
        this.name = name;             // "this.name" = the field
        this.age = age;               // "name" alone = the parameter
        this.creditScore = creditScore;
    }

    public String getName()    { return name; }
    public int getAge()        { return age; }
    public int getCreditScore(){ return creditScore; }
}

class Demo {
    public static void main(String[] args) {
        Applicant asha   = new Applicant("Asha Kulkarni", 28, 742);
        Applicant vikram = new Applicant("Vikram Rao", 19, 690);

        System.out.println(asha.getName() + " is " + asha.getAge());
        System.out.println(vikram.getName() + " is " + vikram.getAge());
    }
}`,
      note: "this.name = name is the single most common line in any XOM class. 'this' disambiguates the field from the parameter that shares its name."
    },
    playground: {
      caption: "Change the ages and run it",
      code: `String name = "Asha Kulkarni";
int age = 28;
System.out.println(name + " is " + age);`,
      output: "Asha Kulkarni is 28"
    },
    quiz: {
      kind: "predict",
      prompt: "What does this print?",
      code: `Applicant a = new Applicant("Asha", 28, 742);
Applicant b = a;
b.setAge(35);
System.out.println(a.getAge());`,
      options: ["28", "35", "0", "Compile error"],
      answer: 1,
      explain: "b = a copies the reference, not the object. Both variables point at the same Applicant in memory, so changing it through b is visible through a. If you wanted an independent copy you would have to create a second object with new."
    },
    mistake: {
      title: "Putting decision logic inside the XOM class",
      symptom: "Your Java class has a method like isEligible() containing the 700 credit-score threshold, and the business asks why they still need a developer to change it.",
      cause: "Old habits. It feels natural to put an if-statement where the data lives.",
      fix: "Keep XOM classes dumb: data in, data out. Every threshold, every 'if', every business decision belongs in a rule. The test is simple — if the business could reasonably want to change the number next quarter, it does not belong in Java."
    }
  },

  /* ---------------------------------------------------------------- 1.3 */
  {
    id: "p1-t3",
    title: "Methods, getters/setters and encapsulation",
    minutes: 12,
    tag: "OOP",
    intro: `**Encapsulation** means: keep the data private, and expose it through methods you control.

Fields are marked \`private\` so nothing outside the class can touch them directly. Then you add \`getAge()\` to read and \`setAge(int)\` to write. It looks like pointless ceremony until you realise you now have one place to validate, log, or change how the value is stored.

For ODM this stops being a style preference and becomes a hard requirement. ODM builds its business vocabulary by inspecting your class for **JavaBean conventions**: a method named \`getX()\` returning something, or \`isX()\` returning a boolean. Follow the convention and the vocabulary generates itself. Break it and you are hand-editing the BOM.`,
    jargon: [
      { term: "Encapsulation", plain: "Hiding an object's data behind methods so it cannot be changed in uncontrolled ways." },
      { term: "JavaBean convention", plain: "A naming rule: getters are getSomething(), boolean getters are isSomething(), setters are setSomething(value). Tools like ODM rely on it." },
      { term: "Signature", plain: "A method's name plus its parameter types — what identifies it uniquely." }
    ],
    sections: [
      {
        title: "The naming rules ODM cares about",
        open: true,
        body: `| Field | Correct getter | Vocabulary it generates |
|---|---|---|
| \`int age\` | \`getAge()\` | the age of the applicant |
| \`int creditScore\` | \`getCreditScore()\` | the credit score of the applicant |
| \`boolean hasExistingLoan\` | \`isHasExistingLoan()\` | the applicant has an existing loan |
| \`List<Loan> loans\` | \`getLoans()\` | the loans of the applicant |

Notice ODM splits camelCase into words: \`creditScore\` becomes "credit score". Name your fields well in Java and your business vocabulary reads well for free. Name a field \`cs\` and a business user sees "the cs of the applicant".`
      },
      {
        title: "Do I need setters?",
        open: false,
        body: `Getters: always. Rules read data constantly.

Setters: only for fields rules need to **write**. In our loan example the rules will write a \`decision\` and a \`reason\` back onto a \`LoanResponse\` object, so that object needs setters. The \`Applicant\` object is input-only — it can be getter-only, which also prevents a rule from accidentally rewriting the applicant's age.

This read/write split becomes the input/output parameter design of your ruleset in Phase 2.`
      },
      {
        title: "Static vs instance methods",
        open: false,
        body: `An **instance** method belongs to an object: \`asha.getAge()\`. A **static** method belongs to the class itself: \`Math.max(3, 7)\` — no object needed.

In rule projects you will occasionally see a static utility class (date maths, string formatting) exposed to the BOM so rules can call it. That is legitimate. Just make sure it is a *utility*, not a decision.`
      }
    ],
    diagram: {
      caption: "One private field becomes one business phrase",
      kind: "flow",
      dir: "right",
      nodes: [
        { label: "private int creditScore", sub: "the data, hidden", tone: "a" },
        { label: "public int getCreditScore()", sub: "the JavaBean getter", tone: "b" },
        { label: "“the credit score of the applicant”", sub: "what the business user sees", tone: "ok" }
      ]
    },
    example: {
      caption: "Encapsulated Applicant, plus the output object the rules will write to",
      lang: "java",
      code: `public class Applicant {
    private String name;
    private int age;
    private double annualSalary;
    private int creditScore;
    private boolean hasExistingLoan;

    public String getName()   { return name; }
    public void setName(String name) { this.name = name; }

    public int getAge()       { return age; }
    public void setAge(int age) {
        if (age < 0) {
            throw new IllegalArgumentException("age cannot be negative");
        }
        this.age = age;                       // one place to validate
    }

    public double getAnnualSalary()   { return annualSalary; }
    public void setAnnualSalary(double s) { this.annualSalary = s; }

    public int getCreditScore()       { return creditScore; }
    public void setCreditScore(int c) { this.creditScore = c; }

    public boolean isHasExistingLoan()        { return hasExistingLoan; }
    public void setHasExistingLoan(boolean h) { this.hasExistingLoan = h; }
}

public class LoanResponse {
    private boolean eligible;
    private String reason;

    public boolean isEligible()  { return eligible; }
    public void setEligible(boolean e) { this.eligible = e; }

    public String getReason()    { return reason; }
    public void setReason(String r) { this.reason = r; }
}`,
      note: "LoanResponse is the object our rules will fill in. In Phase 2 it becomes the ruleset's output parameter, and in Phase 5 it becomes the JSON that comes back from the REST call."
    },
    quiz: {
      kind: "choose",
      prompt: "A developer names a field `custAge` with getter `getCustAge()`. What phrase will ODM generate in the business vocabulary by default?",
      options: [
        "the age of the customer",
        "the cust age of the applicant",
        "getCustAge",
        "Nothing — ODM rejects abbreviated names"
      ],
      answer: 1,
      explain: "ODM splits the camelCase getter name into words verbatim: 'cust age'. It has no idea 'cust' means customer. You can rename the verbalization by hand in the BOM editor, but it is far cheaper to name Java fields in full words in the first place — your Java naming is your business vocabulary."
    },
    mistake: {
      title: "Public fields, or getters that don't follow the convention",
      symptom: "You import your XOM into the BOM and half the attributes are missing, or they show up as unreadable method names.",
      cause: "Fields declared public with no getter, or a getter named fetchAge() / creditScore() instead of getCreditScore().",
      fix: "Make every field private and give it a standard get/is accessor. If you inherited a class you cannot change, you can still fix the verbalization manually in the BOM editor — but fix the Java if you own it."
    }
  },

  /* ---------------------------------------------------------------- 1.4 */
  {
    id: "p1-t4",
    title: "Interfaces and abstraction",
    minutes: 10,
    tag: "OOP",
    intro: `An **interface** is a contract with no body. It says "anything claiming to be a RiskCheck must have a method called \`evaluate\` that takes an Applicant and returns an int" — and says nothing about how.

Different classes then \`implements RiskCheck\` in their own way. Code that depends on the interface works with all of them without knowing which one it got. That is **abstraction**: depending on what something does, not on what it is.

In ODM you meet interfaces mostly on the integration side — the Java rules API is full of them (\`IlrSessionRequest\`, \`IlrSessionResponse\`) — and occasionally in a XOM where the team wants to swap implementations. You need to *read* them comfortably more than you need to design them.`,
    jargon: [
      { term: "Interface", plain: "A list of method signatures with no code. Classes promise to provide the code." },
      { term: "implements", plain: "The Java keyword a class uses to promise it fulfils an interface." },
      { term: "Abstract class", plain: "A half-finished class: some methods written, some left for subclasses. Unlike an interface, it can hold fields and a constructor." }
    ],
    sections: [
      {
        title: "Interface vs abstract class, in one line each",
        open: true,
        body: `- **Interface** — "can do this". A class can implement many. No state.
- **Abstract class** — "is a kind of this". A class can extend only one. Can hold fields and shared code.

Rule of thumb: if you are describing a *capability*, use an interface. If you are describing a *family* of things that share data, use an abstract class.

Since Java 8, interfaces can also have \`default\` methods with real bodies, which blurs the line a little. Don't worry about that yet.`
      },
      {
        title: "Why this matters when you hit Phase 5",
        open: false,
        body: `When you call a deployed ruleset from Java, almost everything you touch is an interface:

\`\`\`
IlrSessionFactory factory = new IlrJ2SESessionFactory();
IlrStatelessSession session = factory.createStatelessSession();
IlrSessionRequest request = factory.createRequest("MyRuleApp/1.0/loan/1.0");
\`\`\`

\`IlrStatelessSession\` is an interface. You never see the class that implements it — the factory decides. That is the point: IBM can change the implementation between versions without breaking your code.`
      }
    ],
    diagram: {
      caption: "One contract, three implementations, one caller that doesn't care",
      kind: "split",
      head: { label: "interface RiskCheck", sub: "int evaluate(Applicant a)" },
      branches: [
        { when: "implements", label: "CreditScoreCheck", tone: "a" },
        { when: "implements", label: "ExistingLoanCheck", tone: "a" },
        { when: "implements", label: "SalaryBandCheck", tone: "a" }
      ]
    },
    example: {
      caption: "A risk-check contract with two implementations",
      lang: "java",
      code: `public interface RiskCheck {
    String getName();
    int evaluate(Applicant applicant);   // returns risk points
}

public class CreditScoreCheck implements RiskCheck {
    public String getName() { return "Credit score"; }
    public int evaluate(Applicant a) {
        if (a.getCreditScore() >= 750) return 0;
        if (a.getCreditScore() >= 700) return 10;
        return 40;
    }
}

public class ExistingLoanCheck implements RiskCheck {
    public String getName() { return "Existing loan"; }
    public int evaluate(Applicant a) {
        return a.isHasExistingLoan() ? 25 : 0;
    }
}

class Demo {
    public static void main(String[] args) {
        List<RiskCheck> checks = List.of(
            new CreditScoreCheck(), new ExistingLoanCheck());

        Applicant asha = new Applicant("Asha", 28, 742);
        int total = 0;
        for (RiskCheck check : checks) {       // same call, different behaviour
            total += check.evaluate(asha);
        }
        System.out.println("Total risk points: " + total);
    }
}`,
      note: "Read the loop: it calls evaluate() without knowing or caring which implementation it has. Hold that thought — in Phase 3 a scorecard does exactly this job, but as a rule artefact the business can edit."
    },
    quiz: {
      kind: "predict",
      prompt: "Given the classes above, what does this print?",
      code: `Applicant a = new Applicant("Vikram", 19, 690);
a.setHasExistingLoan(true);

List<RiskCheck> checks = List.of(
    new CreditScoreCheck(), new ExistingLoanCheck());

int total = 0;
for (RiskCheck c : checks) total += c.evaluate(a);
System.out.println(total);`,
      options: ["0", "25", "40", "65"],
      answer: 3,
      explain: "Credit score 690 is below 700, so CreditScoreCheck returns 40. hasExistingLoan is true, so ExistingLoanCheck returns 25. 40 + 25 = 65. The loop treats both objects identically through the RiskCheck interface — that is polymorphism doing the work."
    },
    mistake: {
      title: "Exposing an interface to the BOM without packaging an implementation",
      symptom: "Your rule compiles but throws ClassNotFoundException or NoClassDefFoundError at execution time.",
      cause: "You imported the interface into the XOM jar but forgot to package the concrete class that implements it. At design time the interface is enough; at run time the engine needs real code.",
      fix: "Package interface and implementations in the same XOM jar. When a rule fails only at execution and not at build, suspect a missing class in the deployed jar first — you will meet this again in Phase 7."
    }
  },

  /* ---------------------------------------------------------------- 1.5 */
  {
    id: "p1-t5",
    title: "Inheritance and polymorphism",
    minutes: 12,
    tag: "OOP",
    intro: `**Inheritance** lets one class build on another. \`SalariedApplicant extends Applicant\` means it gets every field and method of \`Applicant\` for free, and can add its own (employer name, years in job) or change behaviour.

**Polymorphism** is the payoff: a variable declared as \`Applicant\` can hold a \`SalariedApplicant\` or a \`SelfEmployedApplicant\`, and when you call a method Java runs the version belonging to the *actual* object, not the declared type.

This is directly relevant to ODM because the BOM mirrors your class hierarchy. If you write a rule against \`Applicant\`, it fires for salaried and self-employed applicants alike. Write it against \`SelfEmployedApplicant\` and it only fires for those. That "write once, applies to all subtypes" behaviour is one of the quiet superpowers of a rule engine — and one of its quiet traps.`,
    jargon: [
      { term: "Superclass / parent", plain: "The class being extended (Applicant)." },
      { term: "Subclass / child", plain: "The class doing the extending (SalariedApplicant)." },
      { term: "Override", plain: "A subclass replacing a parent method with its own version, keeping the same signature." },
      { term: "instanceof", plain: "A test asking 'is this object actually of that type?'" }
    ],
    sections: [
      {
        title: "How ODM sees your hierarchy",
        open: true,
        body: `When you import a XOM, the BOM keeps the inheritance. In the rule editor you then get:

- A rule condition on \`Applicant\` matches **every** applicant object, including subclasses.
- A rule condition on \`SelfEmployedApplicant\` matches only those.
- Vocabulary inherited from the parent shows up on the child automatically — you don't re-verbalize \`getAge()\` three times.

That is why designing a sensible hierarchy in Java pays off directly in how clean your rules read.`
      },
      {
        title: "Prefer shallow hierarchies",
        open: false,
        body: `Two levels is usually plenty. Deep inheritance chains make rules hard to reason about, because you can no longer tell at a glance which rules will fire for a given object.

If you find yourself with four levels, the data probably wants to be a *field* rather than a *type*: instead of \`SalariedApplicant\` / \`SelfEmployedApplicant\` / \`RetiredApplicant\` subclasses, one \`Applicant\` with an \`employmentType\` field often makes better rules — and a business user can add a new employment type without a developer.`
      }
    ],
    diagram: {
      caption: "A rule written against the parent fires for every child",
      kind: "split",
      head: { label: "Applicant", sub: "age, salary, creditScore — a rule here matches all" },
      branches: [
        { when: "extends", label: "SalariedApplicant", tone: "a" },
        { when: "extends", label: "SelfEmployedApplicant", tone: "b" }
      ]
    },
    example: {
      caption: "Two kinds of applicant, one rule-friendly parent",
      lang: "java",
      code: `public class Applicant {
    protected String name;                 // protected = visible to subclasses
    protected int age;
    protected int creditScore;

    public Applicant(String name, int age, int creditScore) {
        this.name = name; this.age = age; this.creditScore = creditScore;
    }
    public String getName() { return name; }
    public int getAge() { return age; }
    public int getCreditScore() { return creditScore; }

    public String getIncomeEvidence() { return "Not specified"; }
}

public class SalariedApplicant extends Applicant {
    private String employer;

    public SalariedApplicant(String name, int age, int score, String employer) {
        super(name, age, score);           // call the parent constructor first
        this.employer = employer;
    }
    public String getEmployer() { return employer; }

    @Override
    public String getIncomeEvidence() { return "Payslips from " + employer; }
}

public class SelfEmployedApplicant extends Applicant {
    private int yearsTrading;

    public SelfEmployedApplicant(String name, int age, int score, int years) {
        super(name, age, score);
        this.yearsTrading = years;
    }
    public int getYearsTrading() { return yearsTrading; }

    @Override
    public String getIncomeEvidence() { return yearsTrading + " years of tax returns"; }
}`,
      note: "super(...) must be the first statement in a subclass constructor. @Override is optional but tells the compiler to check you really are overriding something — it catches typos like getIncomeEvidance()."
    },
    quiz: {
      kind: "predict",
      prompt: "What does this print?",
      code: `Applicant a = new SelfEmployedApplicant("Vikram", 34, 710, 5);
System.out.println(a.getIncomeEvidence());`,
      options: [
        "Not specified",
        "5 years of tax returns",
        "Compile error — a is declared as Applicant",
        "null"
      ],
      answer: 1,
      explain: "The variable is declared as Applicant, but the object is really a SelfEmployedApplicant. Java picks the method based on the actual object at run time, not the declared type. That is dynamic dispatch — the engine of polymorphism, and exactly how an ODM rule on Applicant ends up running against a subclass."
    },
    mistake: {
      title: "A rule fires for subclasses you didn't expect",
      symptom: "You add a PremiumApplicant subclass and suddenly the standard-applicant rules fire on premium customers too, applying the wrong fee.",
      cause: "The existing rules were written against the parent type, so they match every subclass automatically. Nobody re-checked them when the subclass was added.",
      fix: "When you add a subclass to a live rule project, audit every rule written against the parent and decide, one by one, whether it should still apply. Adding an explicit condition (e.g. 'the employment type of the applicant is SALARIED') is often clearer than relying on the type hierarchy."
    }
  },

  /* ---------------------------------------------------------------- 1.6 */
  {
    id: "p1-t6",
    title: "Exception handling",
    minutes: 12,
    tag: "Core",
    intro: `An **exception** is Java's way of saying "I cannot continue with this". Divide by zero, call a method on \`null\`, parse "abc" as a number — each throws an exception, and unless someone catches it the program stops.

You handle them with \`try / catch / finally\`: try the risky thing, catch the failure, and finally clean up whether it worked or not.

For ODM this is Phase 7 in miniature. When a decision service returns HTTP 500 instead of a decision, the cause is almost always an exception thrown somewhere in the chain — a null field, a bad cast, a missing class. Learning to read a stack trace now saves you days later.`,
    jargon: [
      { term: "Exception", plain: "An object describing something that went wrong, thrown up the call chain until someone catches it." },
      { term: "Checked exception", plain: "One the compiler forces you to handle or declare, e.g. IOException." },
      { term: "Unchecked / runtime exception", plain: "One the compiler ignores, e.g. NullPointerException. It happens at run time or not at all." },
      { term: "Stack trace", plain: "The printed list of method calls showing where the exception was thrown and what called what." }
    ],
    sections: [
      {
        title: "The shape of try / catch / finally",
        open: true,
        body: `\`\`\`
try {
    // risky work
} catch (NumberFormatException e) {
    // what to do when THAT specific thing fails
} catch (Exception e) {
    // fallback for anything else — always last
} finally {
    // always runs, success or failure — closing files, releasing sessions
}
\`\`\`

Order matters: catch the specific type before the general one. If \`catch (Exception e)\` comes first, the compiler rejects the later, more specific catch as unreachable.`
      },
      {
        title: "Reading a stack trace, top-down",
        open: true,
        body: `\`\`\`
java.lang.NullPointerException: Cannot invoke
  "String.length()" because "name" is null
    at com.sunrise.Applicant.getNameLength(Applicant.java:42)
    at com.sunrise.LoanService.decide(LoanService.java:17)
    at com.sunrise.Main.main(Main.java:8)
\`\`\`

Read it like this:
1. **Line 1** — what went wrong and, in modern Java, exactly which value was null.
2. **First \`at\` line** — where it blew up: Applicant.java line 42.
3. **Lines below** — who called that, in reverse order.

The first \`at\` line that belongs to *your* code is almost always where to look. Everything above it is library plumbing.`
      },
      {
        title: "The five exceptions you will actually hit",
        open: false,
        body: `- \`NullPointerException\` — you called a method on nothing. By far the most common, in Java and in ODM.
- \`NumberFormatException\` — \`Integer.parseInt("thirty")\`.
- \`IndexOutOfBoundsException\` — asked a list of 3 for item 5.
- \`ClassCastException\` — forced an object into a type it is not.
- \`ArithmeticException\` — integer divide by zero.

Every one of these has an ODM equivalent you will meet in Phase 7.`
      }
    ],
    diagram: {
      caption: "What happens when something throws",
      kind: "split",
      head: { label: "try { parse the salary }", sub: "risky operation runs" },
      branches: [
        { when: "no problem", label: "continue normally → finally", tone: "ok" },
        { when: "throws, caught", label: "catch block handles it → finally", tone: "warn" },
        { when: "throws, uncaught", label: "propagates up, program stops", tone: "bad" }
      ]
    },
    example: {
      caption: "Defensive loading of applicant data — the kind of code that sits in front of a decision service",
      lang: "java",
      code: `public class ApplicantLoader {

    public Applicant load(String name, String ageText, String salaryText) {
        Applicant applicant = new Applicant();
        applicant.setName(name);

        try {
            applicant.setAge(Integer.parseInt(ageText));
            applicant.setAnnualSalary(Double.parseDouble(salaryText));

        } catch (NumberFormatException e) {
            // the input was not a number at all
            System.out.println("Bad numeric input for " + name + ": " + e.getMessage());
            applicant.setAge(-1);                 // sentinel: rules will reject it
            applicant.setAnnualSalary(0);

        } catch (IllegalArgumentException e) {
            // thrown by our own setAge() validation
            System.out.println("Rejected value for " + name + ": " + e.getMessage());
            applicant.setAge(-1);

        } finally {
            System.out.println("Finished loading " + name);
        }

        return applicant;
    }
}`,
      note: "Note the order: NumberFormatException is a subclass of IllegalArgumentException, so it must be caught first. Swap them and the compiler complains that the second catch is unreachable."
    },
    quiz: {
      kind: "predict",
      prompt: "What does this print, and in what order?",
      code: `try {
    System.out.println("A");
    int x = Integer.parseInt("30k");
    System.out.println("B");
} catch (NumberFormatException e) {
    System.out.println("C");
} finally {
    System.out.println("D");
}
System.out.println("E");`,
      options: ["A B D E", "A C D E", "A C E", "A B C D E"],
      answer: 1,
      explain: "'A' prints. parseInt(\"30k\") throws immediately, so 'B' is skipped entirely — execution jumps straight to the catch block and prints 'C'. finally always runs, so 'D'. Then normal flow resumes: 'E'. The key insight is that nothing after the throwing line inside try ever runs."
    },
    mistake: {
      title: "The silent catch",
      symptom: "A decision service returns the wrong answer with no error anywhere in the logs. Nobody can reproduce it.",
      cause: "Somewhere there is catch (Exception e) { } — an empty catch block that swallows the failure whole. The program limps on with bad data.",
      fix: "Never write an empty catch. At minimum log the exception with its stack trace. If you genuinely expect and accept the failure, write a one-line comment saying why. In enterprise work an error you can see beats a wrong answer you cannot."
    }
  },

  /* ---------------------------------------------------------------- 1.7 */
  {
    id: "p1-t7",
    title: "Collections I — List and ArrayList",
    minutes: 15,
    tag: "Collections ★",
    intro: `A **List** is an ordered, resizable sequence that allows duplicates. It is the collection you will use ninety per cent of the time, and your trainer singled it out for a reason: real rule projects are full of lists. An applicant has a list of existing loans. An order has a list of line items. A decision returns a list of reasons.

\`List\` is the **interface** (the contract) and \`ArrayList\` is the usual **implementation** (the actual storage). The standard way to declare one:

\`\`\`
List<Loan> loans = new ArrayList<>();
\`\`\`

Read it as: "a list of Loan objects, backed by an ArrayList". Declaring the variable as \`List\` and not \`ArrayList\` means you can swap the implementation later without touching the rest of your code.

In Phase 3 you will write ODM rules that iterate over exactly this kind of list — so getting fluent here pays twice.`,
    jargon: [
      { term: "Collection", plain: "Any object that holds a group of other objects: List, Set, Map and friends." },
      { term: "ArrayList", plain: "A List that stores items in a resizable array. Fast to read by index, fast to add at the end." },
      { term: "LinkedList", plain: "A List that chains items together. Faster inserting in the middle, slower to read by index. You will rarely need it." },
      { term: "Index", plain: "The position of an item, counting from 0. The first item is index 0." }
    ],
    sections: [
      {
        title: "The methods you will use every day",
        open: true,
        body: `| Method | What it does |
|---|---|
| \`add(item)\` | append to the end |
| \`add(index, item)\` | insert at a position |
| \`get(index)\` | read item at position |
| \`set(index, item)\` | replace item at position |
| \`remove(index)\` | remove by position |
| \`remove(object)\` | remove first matching object |
| \`size()\` | how many items |
| \`isEmpty()\` | true if size is 0 |
| \`contains(item)\` | is it in there |
| \`indexOf(item)\` | position, or -1 if absent |
| \`clear()\` | empty it |

Counting starts at **0**. A list of 3 items has valid indexes 0, 1 and 2 — asking for index 3 throws \`IndexOutOfBoundsException\`.`
      },
      {
        title: "The remove(int) vs remove(Object) trap",
        open: false,
        body: `This one catches everybody exactly once.

\`\`\`
List<Integer> scores = new ArrayList<>();
scores.add(700); scores.add(742); scores.add(2);

scores.remove(2);                      // removes INDEX 2 -> removes the value 2
scores.remove(Integer.valueOf(700));   // removes the VALUE 700
\`\`\`

With a \`List<Integer>\`, passing a plain \`int\` picks the index version. To remove by value you must pass an actual \`Integer\` object. For \`List<Loan>\` there is no ambiguity — the trap only exists for integer-typed lists.`
      },
      {
        title: "Creating lists quickly",
        open: false,
        body: `\`\`\`
List<String> a = new ArrayList<>();                  // empty, growable
List<String> b = new ArrayList<>(List.of("x","y"));  // pre-filled, growable
List<String> c = List.of("x", "y");                  // IMMUTABLE - add() throws
List<String> d = Arrays.asList("x", "y");            // fixed size - add() throws
\`\`\`

\`List.of(...)\` is wonderfully concise for test data, but it is read-only. If you try to \`add()\` to it you get \`UnsupportedOperationException\` — a genuinely confusing error the first time.`
      }
    ],
    diagram: {
      caption: "An ArrayList of the applicant's existing loans",
      kind: "columns",
      cols: [
        { title: "index 0", tone: "a", items: ["Loan", "type: CAR", "outstanding: 180000"] },
        { title: "index 1", tone: "a", items: ["Loan", "type: PERSONAL", "outstanding: 40000"] },
        { title: "index 2", tone: "a", items: ["Loan", "type: CREDIT_CARD", "outstanding: 15000"] },
        { title: "size() = 3", tone: "b", items: ["get(0) → CAR loan", "get(3) → exception", "isEmpty() → false"] }
      ]
    },
    example: {
      caption: "The Loan class, and an applicant who now carries a list of them",
      lang: "java",
      code: `public class Loan {
    private String type;              // CAR, PERSONAL, CREDIT_CARD
    private double outstanding;
    private int monthsRemaining;

    public Loan(String type, double outstanding, int monthsRemaining) {
        this.type = type;
        this.outstanding = outstanding;
        this.monthsRemaining = monthsRemaining;
    }
    public String getType()        { return type; }
    public double getOutstanding() { return outstanding; }
    public int getMonthsRemaining(){ return monthsRemaining; }
}

class Demo {
    public static void main(String[] args) {
        List<Loan> loans = new ArrayList<>();
        loans.add(new Loan("CAR", 180000, 24));
        loans.add(new Loan("PERSONAL", 40000, 12));
        loans.add(new Loan("CREDIT_CARD", 15000, 6));

        System.out.println("Loan count: " + loans.size());
        System.out.println("First type: " + loans.get(0).getType());

        double total = 0;
        for (int i = 0; i < loans.size(); i++) {
            total += loans.get(i).getOutstanding();
        }
        System.out.println("Total outstanding: " + total);
    }
}`,
      note: "This total-outstanding calculation is the seed of POC-03. In Phase 3 you will write the same logic as an ODM rule over a collection — and it will read almost like English."
    },
    playground: {
      caption: "Predict before you run — then change a loan amount and run it again",
      code: `int carLoan = 180000;
int personalLoan = 40000;
int cardLoan = 15000;

int total = carLoan + personalLoan + cardLoan;
int count = 3;

System.out.println("Loans: " + count);
System.out.println("Total outstanding: " + total);

if (total > 200000) {
    System.out.println("Above the 200,000 limit");
} else {
    System.out.println("Within the limit");
}`,
      output: "Loans: 3\nTotal outstanding: 235000\nAbove the 200,000 limit"
    },
    quiz: {
      kind: "predict",
      prompt: "What does this print?",
      code: `List<String> reasons = new ArrayList<>();
reasons.add("Age OK");
reasons.add("Salary low");
reasons.add("Score OK");
reasons.remove("Salary low");
System.out.println(reasons.size() + " / " + reasons.get(1));`,
      options: ["3 / Salary low", "2 / Score OK", "2 / Salary low", "IndexOutOfBoundsException"],
      answer: 1,
      explain: "remove(\"Salary low\") removes by value, leaving 2 items. Critically, the list closes the gap — \"Score OK\" shifts from index 2 down to index 1. Lists always stay contiguous, which is why holding on to an index across a removal is dangerous."
    },
    mistake: {
      title: "Assuming a list from the caller is never null",
      symptom: "NullPointerException on loans.size() the first time a real request arrives without any loan history.",
      cause: "An applicant with no existing loans might arrive with an empty list [] — or with null, if the calling system omits the field entirely. Those are not the same thing.",
      fix: "Initialise list fields at declaration: private List<Loan> loans = new ArrayList<>();  That way the getter never returns null and every downstream loop is safe. This single habit prevents a large share of Phase 7 incidents — and in ODM, a rule iterating a null collection simply does not fire, which is worse than crashing because it fails silently."
    }
  },

  /* ---------------------------------------------------------------- 1.8 */
  {
    id: "p1-t8",
    title: "Collections II — Set and Map",
    minutes: 15,
    tag: "Collections ★",
    intro: `Two more collection shapes, each solving a different problem.

A **Set** is a bag of unique things with no duplicates and, for \`HashSet\`, no reliable order. Use it when the question is "is this in there?" — for example, the set of loan types Sunrise Bank will not refinance.

A **Map** is a lookup table of key → value pairs. Each key appears once and points to one value. Use it when the question is "what is the value for this key?" — for example, credit-score band → interest rate.

Rule of thumb for choosing:
- Order matters, duplicates allowed → **List**
- Uniqueness matters, order does not → **Set**
- You need to look something up by a key → **Map**`,
    jargon: [
      { term: "HashSet", plain: "The usual Set. Very fast lookups, arbitrary order." },
      { term: "HashMap", plain: "The usual Map. Very fast lookups by key, arbitrary order." },
      { term: "LinkedHashMap", plain: "A Map that remembers insertion order. Handy when printing." },
      { term: "Entry", plain: "One key-value pair inside a Map." },
      { term: "hashCode / equals", plain: "Two methods every object has. Sets and Maps use them to decide whether two objects are 'the same'." }
    ],
    sections: [
      {
        title: "Set essentials",
        open: true,
        body: `\`\`\`
Set<String> blockedTypes = new HashSet<>();
blockedTypes.add("PAYDAY");
blockedTypes.add("CREDIT_CARD");
blockedTypes.add("PAYDAY");        // ignored - already there

blockedTypes.size();               // 2
blockedTypes.contains("PAYDAY");   // true
\`\`\`

\`add()\` returns \`boolean\`: true if the item was new, false if it was already present. That is a neat way to detect duplicates in one line.`
      },
      {
        title: "Map essentials",
        open: true,
        body: `\`\`\`
Map<String, Double> rateByBand = new HashMap<>();
rateByBand.put("EXCELLENT", 8.5);
rateByBand.put("GOOD", 10.5);
rateByBand.put("FAIR", 14.0);

rateByBand.get("GOOD");                   // 10.5
rateByBand.get("UNKNOWN");                // null  <- careful!
rateByBand.getOrDefault("UNKNOWN", 18.0); // 18.0  <- much safer
rateByBand.containsKey("FAIR");           // true
rateByBand.size();                        // 3
\`\`\`

\`get()\` returning \`null\` for a missing key is the number-one source of NullPointerException in map-heavy code. \`getOrDefault\` exists precisely for that.`
      },
      {
        title: "equals and hashCode — why your Set has duplicates",
        open: false,
        body: `A \`HashSet<String>\` deduplicates perfectly because \`String\` defines \`equals\` and \`hashCode\` sensibly. Your own classes do **not**, by default — two \`Loan\` objects with identical field values are considered different objects.

\`\`\`
Set<Loan> loans = new HashSet<>();
loans.add(new Loan("CAR", 180000, 24));
loans.add(new Loan("CAR", 180000, 24));
loans.size();     // 2, not 1!
\`\`\`

If you need value-based uniqueness, override \`equals\` and \`hashCode\` together — always both, never one. Most IDEs generate them for you.`
      },
      {
        title: "Looping over a Map",
        open: false,
        body: `\`\`\`
for (Map.Entry<String, Double> entry : rateByBand.entrySet()) {
    System.out.println(entry.getKey() + " -> " + entry.getValue());
}

// or just the keys
for (String band : rateByBand.keySet()) { ... }

// or just the values
for (Double rate : rateByBand.values()) { ... }
\`\`\``
      }
    ],
    diagram: {
      caption: "Three shapes, three jobs",
      kind: "columns",
      cols: [
        { title: "List<Loan>", tone: "a", items: ["Ordered", "Duplicates allowed", "Access by index", "“the applicant's 3 loans”"] },
        { title: "Set<String>", tone: "b", items: ["No duplicates", "No reliable order", "Fast contains()", "“blocked loan types”"] },
        { title: "Map<String,Double>", tone: "c", items: ["Key → value", "Unique keys", "Fast get(key)", "“band → interest rate”"] }
      ]
    },
    example: {
      caption: "Sunrise Bank's lookup tables, in Java",
      lang: "java",
      code: `public class RatePolicy {

    // loan types the bank refuses to refinance
    private static final Set<String> BLOCKED_TYPES =
        new HashSet<>(Arrays.asList("PAYDAY", "INFORMAL"));

    // credit-score band -> annual interest rate
    private static final Map<String, Double> RATE_BY_BAND = new HashMap<>();
    static {
        RATE_BY_BAND.put("EXCELLENT", 8.5);   // 750+
        RATE_BY_BAND.put("GOOD",     10.5);   // 700-749
        RATE_BY_BAND.put("FAIR",     14.0);   // 650-699
    }

    public boolean isBlocked(Loan loan) {
        return BLOCKED_TYPES.contains(loan.getType());
    }

    public String bandFor(int creditScore) {
        if (creditScore >= 750) return "EXCELLENT";
        if (creditScore >= 700) return "GOOD";
        if (creditScore >= 650) return "FAIR";
        return "POOR";
    }

    public double rateFor(int creditScore) {
        // POOR is not in the map at all -> fall back to 18.0
        return RATE_BY_BAND.getOrDefault(bandFor(creditScore), 18.0);
    }
}`,
      note: "Look hard at bandFor() and rateFor(). Those thresholds are business policy living in Java — exactly the thing that belongs in a decision table. Keep this class in mind: in topic 2.9 you will rewrite it as one, and the contrast is the whole argument for ODM."
    },
    playground: {
      caption: "The band lookup, running. Change the score and watch the rate move.",
      code: `int creditScore = 720;
String band = "POOR";
double rate = 18.0;

if (creditScore >= 750) {
    band = "EXCELLENT";
    rate = 8.5;
} else if (creditScore >= 700) {
    band = "GOOD";
    rate = 10.5;
} else if (creditScore >= 650) {
    band = "FAIR";
    rate = 14.0;
}

System.out.println("Score " + creditScore + " is " + band);
System.out.println("Rate: " + rate);

// try 750, then 749, then 700, then 699 — the boundaries are where bugs live`,
      output: "Score 720 is GOOD\nRate: 10.5"
    },
    quiz: {
      kind: "predict",
      prompt: "What does this print?",
      code: `Map<String, Integer> counts = new HashMap<>();
counts.put("CAR", 1);
counts.put("PERSONAL", 2);
counts.put("CAR", 5);

System.out.println(counts.size() + " / " + counts.get("CAR"));`,
      options: ["3 / 1", "3 / 5", "2 / 5", "2 / 1"],
      answer: 2,
      explain: "Map keys are unique. The second put(\"CAR\", 5) does not add a new entry — it overwrites the existing value for that key. So the map has 2 entries and CAR maps to 5. (put() returns the old value, 1, if you ever need it.)"
    },
    mistake: {
      title: "map.get() returned null and everything exploded",
      symptom: "NullPointerException on a line that looks harmless, like double rate = rates.get(band);",
      cause: "The key was not in the map. get() returns null, and unboxing null into a primitive double throws instantly.",
      fix: "Use getOrDefault(key, sensibleDefault) or check containsKey() first. In ODM this same shape appears when a rule looks up a value that has no matching entry — the rule quietly does not fire. Always define what happens for the unmatched case; Phase 7 calls this the 'missing default' problem."
    }
  },

  /* ---------------------------------------------------------------- 1.9 */
  {
    id: "p1-t9",
    title: "Iteration — for-each and Iterator",
    minutes: 14,
    tag: "Collections ★",
    intro: `Your trainer called out list iteration specifically, so let's be thorough.

There are three ways to walk a collection, and you should be able to read all three:

1. **Classic for loop** — you manage the index yourself. Use when you need the index.
2. **For-each (enhanced for)** — clean and safe. Use for almost everything.
3. **Iterator** — verbose, but the only safe way to *remove* items mid-loop.

The for-each loop is the one you will write most:

\`\`\`
for (Loan loan : loans) {
    System.out.println(loan.getType());
}
\`\`\`

Read the colon as "in": *for each loan in loans*.

This maps almost exactly onto how ODM rules iterate collections in Phase 3, where you will write conditions like *"there is a loan in the loans of the applicant such that the type of this loan is CAR"*. Same idea, business wording.`,
    jargon: [
      { term: "Enhanced for loop", plain: "The official name for the for-each loop." },
      { term: "Iterator", plain: "An object that walks a collection one item at a time, with hasNext() and next()." },
      { term: "ConcurrentModificationException", plain: "Thrown when you change a collection while looping over it." }
    ],
    sections: [
      {
        title: "The three forms side by side",
        open: true,
        body: `\`\`\`
// 1. classic - when you need the position
for (int i = 0; i < loans.size(); i++) {
    System.out.println(i + ": " + loans.get(i).getType());
}

// 2. for-each - the default choice
for (Loan loan : loans) {
    System.out.println(loan.getType());
}

// 3. iterator - when you must remove while looping
Iterator<Loan> it = loans.iterator();
while (it.hasNext()) {
    Loan loan = it.next();
    if (loan.getOutstanding() == 0) {
        it.remove();            // safe
    }
}
\`\`\`

Use form 2 unless you have a specific reason not to.`
      },
      {
        title: "The ConcurrentModificationException trap",
        open: true,
        body: `This throws:

\`\`\`
for (Loan loan : loans) {
    if (loan.getOutstanding() == 0) {
        loans.remove(loan);       // ConcurrentModificationException
    }
}
\`\`\`

The for-each loop is quietly using an iterator underneath, and that iterator notices the list changed behind its back. It refuses to continue rather than silently skip items.

Three safe fixes:
1. Use an explicit \`Iterator\` and call \`it.remove()\`.
2. Use \`loans.removeIf(loan -> loan.getOutstanding() == 0);\` — cleanest, Java 8+.
3. Collect the doomed items into a second list, then \`loans.removeAll(toRemove)\` after the loop.

Interviewers love this question. So does production.`
      },
      {
        title: "Nested iteration — applicants and their loans",
        open: false,
        body: `\`\`\`
for (Applicant applicant : applicants) {
    double total = 0;
    for (Loan loan : applicant.getLoans()) {
        total += loan.getOutstanding();
    }
    System.out.println(applicant.getName() + " owes " + total);
}
\`\`\`

Two levels is fine and common. Three nested loops usually means the data model wants rethinking — or, in ODM terms, that you want a rule over a collection rather than a hand-rolled loop.`
      }
    ],
    diagram: {
      caption: "What a for-each loop is really doing",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "loans.iterator()", sub: "get a cursor positioned before item 0", tone: "b" },
        { label: "hasNext() ?", sub: "any items left?", tone: "b" },
        { label: "next()", sub: "hand me the item, move the cursor on", tone: "a" },
        { label: "run the loop body", sub: "your code, once per item", tone: "a" },
        { label: "hasNext() = false → done", sub: "loop exits", tone: "ok" }
      ]
    },
    example: {
      caption: "Iterating the applicant's loans three different ways",
      lang: "java",
      code: `public class LoanSummary {

    public void summarise(Applicant applicant) {
        List<Loan> loans = applicant.getLoans();

        if (loans == null || loans.isEmpty()) {
            System.out.println(applicant.getName() + " has no existing loans.");
            return;
        }

        // 1) for-each: total everything
        double total = 0;
        for (Loan loan : loans) {
            total += loan.getOutstanding();
        }

        // 2) classic for: numbered listing
        for (int i = 0; i < loans.size(); i++) {
            Loan loan = loans.get(i);
            System.out.println((i + 1) + ". " + loan.getType()
                               + " - " + loan.getOutstanding());
        }

        // 3) iterator: drop the settled loans safely
        Iterator<Loan> it = loans.iterator();
        while (it.hasNext()) {
            if (it.next().getOutstanding() == 0) {
                it.remove();
            }
        }

        System.out.println(applicant.getName() + " owes " + total
                           + " across " + loans.size() + " active loans");
    }
}`,
      note: "The null-and-empty guard at the top is not decoration. It is the single most valuable defensive line in collection code, and it maps directly to the Phase 7 topic 'input is null'."
    },
    playground: {
      caption: "A real loop — change the count, or the amounts, and run it again",
      code: `// three loans, repaid in equal monthly instalments
int monthly = 8500;
int months = 24;
int total = 0;

for (int i = 1; i <= months; i++) {
    total += monthly;
    if (i == 12) {
        System.out.println("After 12 months, paid: " + total);
    }
}

System.out.println("After " + months + " months, paid: " + total);

int remaining = 235000 - total;
if (remaining > 0) {
    System.out.println("Still outstanding: " + remaining);
} else {
    System.out.println("Fully repaid");
}`,
      output: "After 12 months, paid: 102000\nAfter 24 months, paid: 204000\nStill outstanding: 31000"
    },
    quiz: {
      kind: "predict",
      prompt: "What happens when this runs?",
      code: `List<String> reasons = new ArrayList<>();
reasons.add("Age OK");
reasons.add("Salary low");
reasons.add("Score OK");

for (String r : reasons) {
    if (r.contains("low")) {
        reasons.remove(r);
    }
}
System.out.println(reasons.size());`,
      options: [
        "Prints 2",
        "Prints 3",
        "Throws ConcurrentModificationException",
        "Infinite loop"
      ],
      answer: 2,
      explain: "Removing from a list while a for-each loop is walking it throws ConcurrentModificationException. The iterator detects that the list's modification count changed underneath it. Use reasons.removeIf(r -> r.contains(\"low\")) instead — one line, no exception. (Curiosity: removing the second-to-last item happens to escape the check, which makes this bug maddeningly intermittent in real code.)"
    },
    mistake: {
      title: "Modifying a collection while iterating it",
      symptom: "ConcurrentModificationException in a loop that has worked fine for months — or, worse, silently skipped items.",
      cause: "add() or remove() called on the collection inside a for-each over that same collection.",
      fix: "Reach for removeIf() first. If the logic is more complex, use an explicit Iterator and it.remove(), or build a separate list of items to remove and apply it after the loop. Never mutate the collection you are walking."
    }
  },

  /* ---------------------------------------------------------------- 1.10 */
  {
    id: "p1-t10",
    title: "Generics — what the angle brackets buy you",
    minutes: 10,
    tag: "Core",
    intro: `\`List<Applicant>\` — the \`<Applicant>\` part is a **generic type parameter**. It tells the compiler "this list holds Applicant objects and nothing else".

Two things follow from that.

**Safety.** If you try to \`add(new Loan(...))\` to a \`List<Applicant>\`, the code will not compile. The error arrives on your screen, not in production at 2 a.m.

**No casting.** \`Applicant a = list.get(0);\` just works. Without generics you would write \`Applicant a = (Applicant) list.get(0);\` and hope.

You will mostly *consume* generics rather than write them. Being able to read \`Map<String, List<Loan>>\` at a glance — "a map from String to a list of Loans" — is the actual skill.`,
    jargon: [
      { term: "Type parameter", plain: "The thing in angle brackets, e.g. the Applicant in List<Applicant>." },
      { term: "Raw type", plain: "Using a generic class without its brackets, e.g. plain List. Legal but unsafe — a leftover from Java 4." },
      { term: "Diamond operator", plain: "The empty <> in new ArrayList<>(), where Java infers the type from the left-hand side." },
      { term: "Wildcard", plain: "The ? in List<? extends Applicant> — 'some unknown subtype of Applicant'. Read-only in practice." }
    ],
    sections: [
      {
        title: "Reading nested generics",
        open: true,
        body: `Work outward-in, left to right:

- \`List<String>\` — a list of strings.
- \`Map<String, Double>\` — a map from string keys to double values.
- \`Map<String, List<Loan>>\` — a map from string keys to *lists of loans*. For example, loans grouped by applicant ID.
- \`List<Map<String, Object>>\` — a list of generic key-value bags. You will see this shape a lot when parsing JSON in Phase 5.

That last one is worth remembering: JSON parsed loosely in Java almost always ends up as \`Map<String, Object>\`.`
      },
      {
        title: "Why raw types are dangerous",
        open: false,
        body: `\`\`\`
List raw = new ArrayList();     // no type parameter
raw.add(new Applicant());
raw.add("a string");            // compiler shrugs

for (Object o : raw) {
    Applicant a = (Applicant) o;   // ClassCastException on item 2
}
\`\`\`

The compiler cannot help you, so the failure moves to run time. If you see a raw type in a codebase you are maintaining, adding the type parameter is nearly always a safe improvement — and the compiler will immediately tell you where the assumptions were wrong.`
      },
      {
        title: "Primitives don't fit — use the wrappers",
        open: false,
        body: `Generics only work with objects, so \`List<int>\` is illegal. Use the wrapper class:

| Primitive | Wrapper |
|---|---|
| int | Integer |
| double | Double |
| boolean | Boolean |
| long | Long |
| char | Character |

Java auto-boxes between them, so \`List<Integer> l = new ArrayList<>(); l.add(5);\` works fine. The catch: a \`null\` Integer unboxed into an \`int\` throws NullPointerException — which is why \`map.get(missingKey)\` assigned to an \`int\` blows up.`
      }
    ],
    diagram: {
      caption: "Same list, with and without the type parameter",
      kind: "columns",
      cols: [
        { title: "List (raw)", tone: "warn", items: ["Accepts anything", "Cast on every read", "Fails at run time", "ClassCastException"] },
        { title: "List<Applicant>", tone: "ok", items: ["Only Applicants", "No cast needed", "Fails at compile time", "Errors on your screen"] }
      ]
    },
    example: {
      caption: "Generics doing real work — grouping loans by applicant",
      lang: "java",
      code: `public class LoanBook {

    // a map from applicant id -> that applicant's list of loans
    private Map<String, List<Loan>> loansByApplicant = new HashMap<>();

    public void addLoan(String applicantId, Loan loan) {
        // if this applicant has no list yet, create one
        List<Loan> existing = loansByApplicant.get(applicantId);
        if (existing == null) {
            existing = new ArrayList<>();
            loansByApplicant.put(applicantId, existing);
        }
        existing.add(loan);
    }

    // the same thing in one line, Java 8+
    public void addLoanShort(String applicantId, Loan loan) {
        loansByApplicant.computeIfAbsent(applicantId, k -> new ArrayList<>())
                        .add(loan);
    }

    public double totalOutstanding(String applicantId) {
        List<Loan> loans = loansByApplicant.getOrDefault(
                applicantId, Collections.emptyList());
        double total = 0;
        for (Loan loan : loans) {
            total += loan.getOutstanding();
        }
        return total;
    }
}`,
      note: "getOrDefault(id, Collections.emptyList()) means totalOutstanding never has to null-check. Returning an empty collection instead of null is one of the most useful habits you can build."
    },
    quiz: {
      kind: "choose",
      prompt: "Which of these lines will fail to compile?",
      code: `List<Applicant> applicants = new ArrayList<>();
applicants.add(new SalariedApplicant("Asha", 28, 742, "Infosys"));   // A
applicants.add(new Loan("CAR", 180000, 24));                         // B
Applicant first = applicants.get(0);                                 // C
Object thing = applicants.get(0);                                    // D`,
      options: ["A", "B", "C", "D"],
      answer: 1,
      explain: "B fails: a Loan is not an Applicant, and the type parameter forbids it at compile time. A works because SalariedApplicant IS an Applicant (subclasses are allowed). C works with no cast — that is the whole point of generics. D works because everything in Java is an Object."
    },
    mistake: {
      title: "Unboxing a null into a primitive",
      symptom: "NullPointerException on a line with no visible method call, like int score = scoreMap.get(applicantId);",
      cause: "The map had no entry for that key, so get() returned null. Java then tried to convert null into an int, which is impossible.",
      fix: "Either receive it as the wrapper type (Integer score = ...) and null-check, or use getOrDefault with a sensible fallback. In ODM the equivalent is a numeric BOM attribute arriving as null from JSON — arithmetic on it fails the same way, and Phase 7 covers exactly that."
    }
  },

  /* ---------------------------------------------------------------- 1.11 */
  {
    id: "p1-t11",
    title: "Lambdas and Streams",
    minutes: 15,
    tag: "Modern Java",
    intro: `A **lambda** is a tiny anonymous function you can pass around like a value:

\`\`\`
loan -> loan.getOutstanding() > 50000
\`\`\`

Read as: "given a loan, return whether its outstanding is over 50,000". No name, no class, just the logic.

A **stream** is a pipeline you push a collection through. You describe *what* you want, not *how* to loop:

\`\`\`
double total = loans.stream()
                    .filter(l -> l.getType().equals("CAR"))
                    .mapToDouble(Loan::getOutstanding)
                    .sum();
\`\`\`

Compare that to a for-loop with an if inside and a running total. Same result, but the stream reads as one sentence: take the loans, keep the car ones, pull out their outstanding amounts, add them up.

This is genuinely useful for ODM too — not because you write streams inside rules, but because the Java service that *prepares* data for your decision service is usually full of them.`,
    jargon: [
      { term: "Lambda", plain: "An inline function: parameters -> body." },
      { term: "Stream", plain: "A one-shot pipeline over a collection. It does not store data and cannot be reused." },
      { term: "Intermediate operation", plain: "A step that returns another stream: filter, map, sorted. Lazy — does nothing on its own." },
      { term: "Terminal operation", plain: "The step that actually runs the pipeline and produces a result: collect, sum, count, forEach." },
      { term: "Method reference", plain: "A shorthand lambda: Loan::getOutstanding means loan -> loan.getOutstanding()." }
    ],
    sections: [
      {
        title: "The operations worth memorising",
        open: true,
        body: `| Operation | Type | What it does |
|---|---|---|
| \`filter(pred)\` | intermediate | keep items matching a condition |
| \`map(fn)\` | intermediate | transform each item |
| \`sorted()\` | intermediate | order the items |
| \`distinct()\` | intermediate | drop duplicates |
| \`limit(n)\` | intermediate | keep the first n |
| \`collect(toList())\` | terminal | gather into a List |
| \`count()\` | terminal | how many |
| \`anyMatch(pred)\` | terminal | is any item matching? |
| \`allMatch(pred)\` | terminal | are all items matching? |
| \`sum()\` / \`average()\` | terminal | on numeric streams |
| \`forEach(action)\` | terminal | do something with each |

Nothing runs until a terminal operation appears. A stream with only \`filter()\` and no terminal does absolutely nothing.`
      },
      {
        title: "Streams vs loops — when to use which",
        open: false,
        body: `Use a **stream** when you are transforming, filtering or aggregating data and the pipeline reads clearly.

Use a **loop** when you need side effects, early exit with complex conditions, or an index — or, honestly, when the stream version would be harder to read than the loop.

Streams are not faster for small collections. Choose for readability, not performance. A three-line stream that a colleague has to puzzle over is worse than a five-line loop that reads instantly.`
      },
      {
        title: "The functional interfaces behind the arrow",
        open: false,
        body: `A lambda is really an implementation of a one-method interface. The common ones:

- \`Predicate<T>\` — \`T -> boolean\`. Used by \`filter\`.
- \`Function<T,R>\` — \`T -> R\`. Used by \`map\`.
- \`Consumer<T>\` — \`T -> void\`. Used by \`forEach\`.
- \`Supplier<T>\` — \`() -> T\`. Used for lazy creation.

You rarely name these types yourself, but you will see them in method signatures and it helps to know what the arrow means.`
      }
    ],
    diagram: {
      caption: "A stream pipeline over the applicant's loans",
      kind: "flow",
      dir: "right",
      nodes: [
        { label: "loans", sub: "3 loans", tone: "a" },
        { label: ".filter(CAR)", sub: "keep 1", tone: "b" },
        { label: ".mapToDouble(...)", sub: "180000.0", tone: "b" },
        { label: ".sum()", sub: "terminal — runs it", tone: "c" },
        { label: "180000.0", sub: "result", tone: "ok" }
      ]
    },
    example: {
      caption: "The same questions, answered with streams",
      lang: "java",
      code: `public class LoanAnalytics {

    public void report(Applicant applicant) {
        List<Loan> loans = applicant.getLoans();

        // total outstanding across every loan
        double total = loans.stream()
                            .mapToDouble(Loan::getOutstanding)
                            .sum();

        // only the big ones, largest first
        List<Loan> big = loans.stream()
                              .filter(l -> l.getOutstanding() > 50000)
                              .sorted(Comparator.comparing(Loan::getOutstanding).reversed())
                              .collect(Collectors.toList());

        // does the applicant hold any credit-card debt at all?
        boolean hasCard = loans.stream()
                               .anyMatch(l -> "CREDIT_CARD".equals(l.getType()));

        // distinct loan types, as a readable string
        String types = loans.stream()
                            .map(Loan::getType)
                            .distinct()
                            .collect(Collectors.joining(", "));

        System.out.println(applicant.getName() + " owes " + total);
        System.out.println("Large loans: " + big.size());
        System.out.println("Has credit card debt: " + hasCard);
        System.out.println("Types: " + types);
    }
}`,
      note: "Notice \"CREDIT_CARD\".equals(l.getType()) rather than l.getType().equals(\"CREDIT_CARD\"). Putting the literal first means a null type returns false instead of throwing. That trick is worth adopting permanently."
    },
    quiz: {
      kind: "predict",
      prompt: "The applicant has three loans: CAR 180000, PERSONAL 40000, CREDIT_CARD 15000. What does this print?",
      code: `long count = loans.stream()
                  .filter(l -> l.getOutstanding() > 20000)
                  .count();
System.out.println(count);`,
      options: ["0", "1", "2", "3"],
      answer: 2,
      explain: "CAR (180000) and PERSONAL (40000) are both above 20000; CREDIT_CARD (15000) is not. So 2 items survive the filter and count() returns 2. Note count() returns a long, not an int — a small detail that trips people up when assigning."
    },
    mistake: {
      title: "A stream that does nothing",
      symptom: "You write a filter pipeline, run it, and absolutely nothing happens — no output, no error.",
      cause: "No terminal operation. Intermediate operations are lazy by design; the pipeline is just a description until something demands a result.",
      fix: "Every stream must end in a terminal operation — collect, sum, count, forEach, anyMatch. If your line ends in .filter(...) or .map(...) and nothing else, that is your bug. A related trap: streams are single-use. Calling a second terminal operation on the same stream throws IllegalStateException."
    }
  },

  /* ---------------------------------------------------------------- 1.12 */
  {
    id: "p1-t12",
    title: "Optional and null-safety",
    minutes: 12,
    tag: "Modern Java",
    intro: `\`null\` means "no object here". Calling any method on it throws \`NullPointerException\` — the most common failure in all of Java, and the most common cause of a decision service returning HTTP 500.

**Optional** is a small box that either contains a value or is explicitly empty. Its point is honesty: a method returning \`Optional<Applicant>\` is telling you, in its signature, that there might be nothing there. A method returning plain \`Applicant\` gives you no warning at all.

\`\`\`
Optional<Loan> biggest = loans.stream()
        .max(Comparator.comparing(Loan::getOutstanding));

if (biggest.isPresent()) {
    System.out.println(biggest.get().getType());
}
\`\`\`

This is the last topic of Phase 1 and it deliberately points forward: Phase 7 opens with "input is null", and everything here is your defence.`,
    jargon: [
      { term: "null", plain: "The absence of an object. Not zero, not empty string — nothing at all." },
      { term: "NullPointerException (NPE)", plain: "Thrown when you use a null as if it were an object." },
      { term: "Optional", plain: "A container that holds either one value or nothing, making absence explicit in the type." },
      { term: "Defensive programming", plain: "Writing code that assumes inputs may be wrong or missing." }
    ],
    sections: [
      {
        title: "The Optional methods worth knowing",
        open: true,
        body: `| Method | What it does |
|---|---|
| \`Optional.of(x)\` | wrap a value that must not be null |
| \`Optional.ofNullable(x)\` | wrap a value that might be null |
| \`Optional.empty()\` | explicitly nothing |
| \`isPresent()\` / \`isEmpty()\` | is there a value? |
| \`get()\` | unwrap — throws if empty. **Avoid.** |
| \`orElse(other)\` | the value, or a fallback |
| \`orElseGet(supplier)\` | same, but computes the fallback lazily |
| \`orElseThrow(...)\` | the value, or throw your own exception |
| \`map(fn)\` | transform the value if present |
| \`ifPresent(action)\` | do something only if present |

The good pattern is \`orElse\`. The bad pattern is \`isPresent()\` followed by \`get()\`, which is just a null check wearing a costume.`
      },
      {
        title: "Where null comes from in an ODM system",
        open: true,
        body: `Every one of these produces a null that eventually reaches your rules:

- A JSON request omits an optional field entirely → the BOM attribute is null.
- A database column is NULL → the mapped field is null.
- A list field was never initialised → \`getLoans()\` returns null, and a rule iterating it silently does not fire.
- An upstream service times out and the integration layer passes a partially-filled object.

Note the third one especially. In Java a null list throws loudly. In ODM a rule over a null collection often just **does not fire** — no error, no decision, no clue. That silent failure is why Phase 7 exists.`
      },
      {
        title: "Practical null-safety habits",
        open: false,
        body: `1. Initialise collection fields at declaration: \`private List<Loan> loans = new ArrayList<>();\`
2. Put the literal first in equals: \`"CAR".equals(type)\` never throws.
3. Return empty collections, never null.
4. Use \`Objects.requireNonNull(x, "message")\` at the top of a method for things that genuinely must be present — it fails immediately with a useful message instead of five frames deeper.
5. Validate at the boundary. Check the incoming request once, thoroughly, before anything else touches it.`
      }
    ],
    diagram: {
      caption: "Two ways to describe 'there might be no applicant here'",
      kind: "columns",
      cols: [
        { title: "Applicant findById(String id)", tone: "warn", items: ["Might return null", "Signature says nothing", "Caller forgets to check", "NPE at run time"] },
        { title: "Optional<Applicant> findById(String id)", tone: "ok", items: ["Might be empty", "Signature says so", "Compiler nudges caller", "Handled explicitly"] }
      ]
    },
    example: {
      caption: "Null-safe applicant handling, ready for a decision service",
      lang: "java",
      code: `public class ApplicantService {

    private Map<String, Applicant> byId = new HashMap<>();

    // honest signature: this might find nothing
    public Optional<Applicant> findById(String id) {
        return Optional.ofNullable(byId.get(id));
    }

    public String describe(String id) {
        return findById(id)
                 .map(Applicant::getName)          // only if present
                 .orElse("Unknown applicant");     // otherwise this
    }

    // the largest loan, or empty if there are none
    public Optional<Loan> largestLoan(Applicant applicant) {
        List<Loan> loans = applicant.getLoans();
        if (loans == null || loans.isEmpty()) {
            return Optional.empty();
        }
        return loans.stream().max(Comparator.comparing(Loan::getOutstanding));
    }

    // validate before the rules ever see the object
    public void validateForDecision(Applicant applicant) {
        Objects.requireNonNull(applicant, "applicant must not be null");
        if (applicant.getName() == null || applicant.getName().isBlank()) {
            throw new IllegalArgumentException("applicant name is required");
        }
        if (applicant.getAge() <= 0) {
            throw new IllegalArgumentException("age must be positive, got "
                                               + applicant.getAge());
        }
    }
}`,
      note: "validateForDecision is the pattern you will wrap around your deployed ruleset in Phase 5. Fail fast, with a message that names the field — 'age must be positive, got -1' tells an on-call engineer everything; 'NullPointerException' tells them nothing."
    },
    quiz: {
      kind: "predict",
      prompt: "What does this print?",
      code: `Map<String, Applicant> byId = new HashMap<>();
Optional<Applicant> found = Optional.ofNullable(byId.get("A-9999"));
String label = found.map(Applicant::getName).orElse("Unknown applicant");
System.out.println(label);`,
      options: [
        "null",
        "Unknown applicant",
        "NoSuchElementException",
        "NullPointerException"
      ],
      answer: 1,
      explain: "byId.get(\"A-9999\") returns null because the key is absent. ofNullable turns that null into an empty Optional rather than throwing. map() on an empty Optional does nothing and stays empty, so orElse supplies the fallback. No exception anywhere — that is the entire value of Optional."
    },
    mistake: {
      title: "Optional.get() without checking",
      symptom: "NoSuchElementException: No value present — which is really just a NullPointerException with a new hat.",
      cause: "Calling .get() on an Optional that turned out to be empty. Using Optional but skipping the part that makes it safe.",
      fix: "Treat .get() as forbidden. Use orElse(fallback), orElseThrow(() -> new IllegalStateException(\"...\")), or map(...).orElse(...). If you find yourself writing if (opt.isPresent()) { opt.get(); } you have reinvented the null check — use ifPresent() or map() instead."
    }
  }

  ],

  /* ------------------------------------------------------------ QUIZ */
  quiz: [
    {
      q: "In ODM, where does the business phrase “the credit score of the applicant” ultimately come from?",
      options: ["A configuration file in Decision Center", "The getCreditScore() method on the Java XOM class", "A database column name", "A hand-written glossary"],
      answer: 1,
      explain: "ODM generates vocabulary from JavaBean getters on the XOM classes. Good Java naming produces good business vocabulary for free."
    },
    {
      q: "Which collection would you choose to store 'the set of loan types Sunrise Bank refuses to refinance'?",
      options: ["List, because order matters", "Set, because entries are unique and you only ever ask 'is it in there?'", "Map, because you need key-value pairs", "Array, because the size never changes"],
      answer: 1,
      explain: "Uniqueness plus fast contains() is exactly what a Set is for. There is no meaningful order and no value to look up."
    },
    {
      q: "What does b = a do when a holds an Applicant object?",
      options: ["Creates an independent copy of the applicant", "Makes b point at the same object a points at", "Copies only the primitive fields", "Throws unless Applicant implements Cloneable"],
      answer: 1,
      explain: "Object variables hold references. Both names now point at one object, so a change through either is visible through both."
    },
    {
      q: "Why does removing an item inside a for-each loop throw ConcurrentModificationException?",
      options: ["Because lists are immutable", "Because the underlying iterator detects the collection changed behind its back", "Because remove() is not thread-safe", "Because the list becomes null"],
      answer: 1,
      explain: "The for-each loop uses an iterator internally, and it fails fast rather than silently skipping items. Use removeIf() or an explicit Iterator with it.remove()."
    },
    {
      q: "A stream pipeline ends with .filter(l -> l.getOutstanding() > 1000) and nothing else. What happens?",
      options: ["The matching items are removed from the list", "A new filtered list is returned", "Nothing at all — there is no terminal operation", "A compile error"],
      answer: 2,
      explain: "filter is an intermediate, lazy operation. Without a terminal operation such as collect, count or forEach, the pipeline never executes."
    },
    {
      q: "int score = scoreMap.get(\"A-9999\"); throws NullPointerException. Why?",
      options: ["The map itself is null", "The key was absent, get() returned null, and unboxing null into int is impossible", "int cannot hold map values", "get() always throws for missing keys"],
      answer: 1,
      explain: "Missing key means null. Converting a null Integer into a primitive int throws. getOrDefault(key, 0) avoids it entirely."
    },
    {
      q: "Which method belongs in the ODM rule project rather than in the XOM Java class?",
      options: ["getCreditScore()", "setAge(int age)", "isEligible() containing the 700 threshold", "toString()"],
      answer: 2,
      explain: "A threshold the business might change next quarter is a business rule. Keeping it in Java defeats the purpose of using a rule engine — XOM classes should stay data-only."
    },
    {
      q: "A method is declared Optional<Applicant> findById(String id). What is that signature telling you?",
      options: ["The method is slow", "It might legitimately find nothing, and you must handle that case", "It never returns null", "It throws a checked exception"],
      answer: 1,
      explain: "Optional makes absence explicit in the type. The caller is nudged to supply a fallback with orElse rather than discovering null at run time."
    }
  ]
};
