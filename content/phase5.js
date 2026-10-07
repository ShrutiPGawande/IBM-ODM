/* =========================================================================
   PHASE 5 — Java / REST Integration
   The phase that connects ODM knowledge to enterprise integration.
   ========================================================================= */

window.PHASE_5 = {
  id: "phase5",
  number: 5,
  title: "Java / REST Integration",
  subtitle: "Calling a deployed decision service from Postman and from Java",
  goal: "Be able to say — and prove — “I understand how an application invokes an ODM decision service.”",
  badge: { name: "Integrator", icon: "🔌" },
  topics: [

  /* ---------------------------------------------------------------- 5.1 */
  {
    id: "p5-t1",
    title: "The decision service as a REST API",
    minutes: 12,
    tag: "Integration ★",
    intro: `Here is the part that turns "I completed ODM training" into "I understand how an application invokes a decision service" — which, as your roadmap says, is a far stronger thing to be able to claim.

When you deploy a ruleset, ODM's **HTDS** (Hosted Transparent Decision Service) automatically exposes it as a REST endpoint. You write no integration code at all. The ruleset parameters become the JSON request and response.

\`\`\`
POST http://server:9060/DecisionService/rest/SunriseLoanApp/1.0/loan-eligibility/1.0
Content-Type: application/json

{ "applicant": { "age": 19, "annualSalary": 52000, "creditScore": 710 } }

→ { "response": { "eligible": false, "reason": "Applicant must be at least 21" } }
\`\`\`

That is the whole thing. Your business rules are now a service any application in the organisation can call — mobile app, web front end, batch job, another microservice.

The word "transparent" in HTDS means exactly this: the web service appears without you writing it.`,
    jargon: [
      { term: "HTDS", plain: "Hosted Transparent Decision Service — ODM automatically exposing a ruleset as REST/SOAP." },
      { term: "REST", plain: "A style of web API using HTTP verbs and URLs, usually exchanging JSON." },
      { term: "Endpoint", plain: "The URL you send a request to." },
      { term: "Payload", plain: "The body of the request or response — the JSON." },
      { term: "Stateless", plain: "Each call is independent; the server remembers nothing between calls." },
      { term: "Content-Type", plain: "An HTTP header saying what format the body is in." }
    ],
    sections: [
      {
        title: "How the URL is built",
        open: true,
        body: `\`\`\`
http://host:port/DecisionService/rest/<RuleApp>/<ver>/<ruleset>/<ver>
\`\`\`

| Part | Example | From |
|---|---|---|
| host:port | localhost:9060 | your Decision Server |
| context | /DecisionService | the deployed HTDS application |
| /rest | /rest | REST rather than SOAP |
| RuleApp | SunriseLoanApp/1.0 | what you named it in Phase 4 |
| ruleset | loan-eligibility/1.0 | what you named it in Phase 4 |

Two useful discovery endpoints:
- \`GET /DecisionService/rest\` — lists what is deployed.
- \`GET .../loan-eligibility/1.0?wsdl\` or the JSON schema endpoint — describes the expected payload.

If you are ever handed an ODM server and told "integrate with it", the first thing to do is GET that root path and see what is there.`
      },
      {
        title: "Why REST changes what ODM is for",
        open: true,
        body: `Without HTDS, calling rules means embedding the ODM Java API in your application: a dependency, a classpath, a Java runtime. That works, and topic 5.5 covers it, but it limits callers to Java.

With HTDS your decision service is language-agnostic. A Python data pipeline, a .NET service, a Node front end and a mainframe job can all call the same rules and get the same answer. That is what makes it an *enterprise decision service* rather than a library.

It also means the rules can be changed without redeploying any caller — combine that with Phase 4's versioning and you have the full picture of why organisations buy this.`
      },
      {
        title: "Stateless, and what that implies",
        open: false,
        body: `Each REST call is independent. The server keeps nothing between calls. Everything the rules need must be in the request.

Practical consequences:

- You cannot rely on "the previous call set the risk band". Send the full picture each time.
- The service scales horizontally: any server instance can answer any request.
- Retries are safe as long as your rules have no side effects — which is another reason rules should decide rather than act.

If your rules genuinely need history (a customer's last twelve decisions), that data must be fetched by the caller and passed in. The decision service does not go and get it.`
      }
    ],
    diagram: {
      caption: "The end-to-end call your roadmap describes",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "Postman / application", sub: "builds the JSON request", tone: "a" },
        { label: "HTTP POST", sub: "REST endpoint, Content-Type: application/json", tone: "a" },
        { label: "HTDS", sub: "maps JSON → ruleset parameters", tone: "b" },
        { label: "Decision Server / XU", sub: "loads the ruleset, runs the engine", tone: "b" },
        { label: "Ruleset executes", sub: "ruleflow, rules fire", tone: "c" },
        { label: "Decision", sub: "response object populated", tone: "c" },
        { label: "JSON response", sub: "back to the caller", tone: "ok" }
      ]
    },
    example: {
      caption: "The complete request and response for Sunrise Bank",
      lang: "text",
      code: `=== REQUEST ===
POST /DecisionService/rest/SunriseLoanApp/1.0/loan-eligibility/1.0 HTTP/1.1
Host: localhost:9060
Content-Type: application/json
Accept: application/json
Authorization: Basic cmVzQWRtaW46cmVzQWRtaW4=

{
  "applicant": {
    "name": "Vikram Rao",
    "age": 19,
    "annualSalary": 52000.0,
    "creditScore": 710,
    "hasExistingLoan": false,
    "loans": [
      { "type": "CAR",      "outstanding": 180000.0, "monthsRemaining": 24 },
      { "type": "PERSONAL", "outstanding":  40000.0, "monthsRemaining": 12 }
    ]
  },
  "response": {
    "eligible": false,
    "reasons": []
  }
}

=== RESPONSE ===
HTTP/1.1 200 OK
Content-Type: application/json

{
  "response": {
    "eligible": false,
    "reason": "Applicant must be at least 21",
    "reasons": [
      "Applicant must be at least 21",
      "Total existing debt of 220000 exceeds the limit of 200,000"
    ],
    "messages": [
      "Age check failed",
      "Thank you. We are unable to proceed at this time."
    ]
  }
}


=== NOTE THE SHAPE ===
Top-level keys = your ruleset parameter names, exactly.
    "applicant"  -> the IN parameter
    "response"   -> the IN_OUT parameter, sent in AND returned

Inside each, the keys = the BOM/XOM attribute names, exactly.
    "annualSalary" not "annual_salary" or "salary"

This is why topic 2.7 said to choose parameter names carefully.
They are your public API, and changing them is a major version bump.


=== DISCOVERY: what is deployed? ===
GET /DecisionService/rest

{
  "rulesets": [
    { "path": "/SunriseLoanApp/1.0/loan-eligibility/1.0",
      "displayName": "loan-eligibility" }
  ]
}`,
      note: "Notice that 'response' appears in the request too, because it is an IN_OUT parameter — the caller sends an initial object and gets it back populated. If you had declared it OUT, you would omit it from the request entirely. That difference confuses people on their first call."
    },
    quiz: {
      kind: "choose",
      prompt: "Your ruleset has parameters `applicant` (IN) and `decision` (OUT). What are the top-level keys in the REST request JSON?",
      options: [
        "applicant and decision",
        "applicant only — an OUT parameter is not sent by the caller",
        "input and output",
        "The BOM class names: Applicant and LoanResponse"
      ],
      answer: 1,
      explain: "The request carries IN and IN_OUT parameters. An OUT parameter is produced by the ruleset, so the caller does not send it — it appears only in the response. The keys are always the parameter names you declared, never the class names."
    },
    mistake: {
      title: "Assuming the JSON field names are whatever you like",
      symptom: "The call returns 200 OK but every rule behaves as though the data were empty — age 0, salary 0, no decision.",
      cause: "A field name in the JSON did not match the BOM attribute name. HTDS silently ignores unrecognised fields rather than rejecting the request, so the object is created with Java defaults.",
      fix: "Get the exact schema from the service itself rather than typing field names from memory. Then, in a validation rule task, check that the key fields are populated and add an explicit message if they are not — a 200 OK with silently empty data is far harder to debug than an outright error. This exact failure is Phase 7 topic 7.2."
    }
  },

  /* ---------------------------------------------------------------- 5.2 */
  {
    id: "p5-t2",
    title: "Anatomy of the request and response",
    minutes: 12,
    tag: "Integration",
    intro: `The JSON shape is generated from your ruleset parameters and your BOM, so it is worth understanding the mapping precisely — most integration problems are shape problems.

Three layers:

1. **Top level** — one key per IN or IN_OUT ruleset parameter.
2. **Object level** — one key per BOM attribute, using the attribute name (not the verbalization, and not the Java getter name).
3. **Type level** — how Java types appear in JSON.

That second point catches people. The vocabulary says "the credit score of the applicant" and the Java says \`getCreditScore()\`, but the JSON key is \`creditScore\` — the attribute name. Three names for one thing, each used in a different place.`,
    jargon: [
      { term: "Schema", plain: "A formal description of what the JSON must look like." },
      { term: "Serialization", plain: "Turning an object into JSON text." },
      { term: "Deserialization", plain: "Turning JSON text back into an object." },
      { term: "Nested object", plain: "A JSON object inside another, matching a Java object reference." },
      { term: "Array", plain: "A JSON list, matching a Java List or array." }
    ],
    sections: [
      {
        title: "Type mapping",
        open: true,
        body: `| Java / BOM | JSON | Example |
|---|---|---|
| int, long | number | \`"age": 28\` |
| double, float | number | \`"annualSalary": 52000.0\` |
| boolean | true/false | \`"hasExistingLoan": false\` |
| String | string | \`"name": "Asha"\` |
| enum | string | \`"employmentType": "SALARIED"\` |
| List&lt;Loan&gt; | array of objects | \`"loans": [ { ... }, { ... } ]\` |
| Date | ISO-8601 string | \`"applicationDate": "2026-09-10T00:00:00Z"\` |
| null | null | \`"creditScore": null\` |

Dates are the perennial source of trouble. Formats, time zones and whether the field is a date or a datetime all matter. Agree the format explicitly with whoever is calling you, in writing, before anybody writes code.`
      },
      {
        title: "What happens to missing and extra fields",
        open: true,
        body: `**Omit a field:** the object is created with the Java default. \`int\` becomes 0, \`boolean\` becomes false, \`String\` becomes null, an uninitialised \`List\` becomes null.

That last one is exactly why topic 2.4 initialised collections in the XOM. Omit \`loans\` and, without that guard, every collection rule silently does nothing.

**Send an extra field** that is not in the BOM: it is ignored. No error. This is convenient for forward compatibility and dangerous for typos — \`"creditscore"\` (lowercase s) is an unknown field, so it is discarded and \`creditScore\` stays 0.

The lesson: **a 200 OK does not mean your data arrived.** Verify the values, not just the status code.`
      },
      {
        title: "Getting the trace back in the response",
        open: false,
        body: `HTDS can return the execution trace alongside the decision. Enable it with the appropriate ruleset property and request parameters, and the response includes which rules fired.

This is enormously useful during integration: instead of "the answer is wrong", you can see exactly which rules ran on the data the server actually received.

Use it while developing. Turn it off before production — traces are large, and they expose your rule names and internal logic to whoever can call the endpoint.`
      }
    ],
    diagram: {
      caption: "Three names for one field, each used somewhere different",
      kind: "flow",
      dir: "right",
      nodes: [
        { label: "JSON key", sub: "\"creditScore\"", tone: "ok" },
        { label: "BOM attribute", sub: "creditScore", tone: "b" },
        { label: "Verbalization", sub: "“the credit score of the applicant”", tone: "b" },
        { label: "Java getter", sub: "getCreditScore()", tone: "a" }
      ]
    },
    example: {
      caption: "Four requests, four outcomes — including the two silent failures",
      lang: "json",
      code: `// ===== 1. COMPLETE AND CORRECT =====
{
  "applicant": {
    "name": "Asha Kulkarni",
    "age": 28,
    "annualSalary": 45000.0,
    "creditScore": 742,
    "hasExistingLoan": false,
    "loans": []
  },
  "response": { "eligible": false, "reasons": [] }
}
// -> eligible: true, "Meets all pre-screening criteria"


// ===== 2. FIELD OMITTED — silent default =====
{
  "applicant": {
    "name": "Asha Kulkarni",
    "age": 28,
    "annualSalary": 45000.0
    // creditScore missing
  }
}
// -> creditScore becomes 0
// -> "Minimum credit score is 700"  (rejected)
// -> 200 OK. No error. Completely wrong decision.


// ===== 3. TYPO IN A FIELD NAME — the nastiest failure =====
{
  "applicant": {
    "age": 28,
    "annualSalary": 45000.0,
    "creditscore": 742          // lowercase 's' — unknown field
  }
}
// -> "creditscore" ignored, creditScore stays 0
// -> rejected, 200 OK, and the JSON *looks* right to a human


// ===== 4. WRONG TYPE — this one at least fails loudly =====
{
  "applicant": {
    "age": "twenty-eight",      // string where int expected
    "annualSalary": 45000.0
  }
}
// -> HTTP 400 Bad Request
// -> "Cannot deserialize value of type int from String
//     'twenty-eight'"


/* ================= DEFENDING AGAINST 2 AND 3 =================
   Add a validation rule task at the start of the ruleflow:

     if the credit score of 'the applicant' is 0
        or the age of 'the applicant' is 0
     then add "INVALID_INPUT: mandatory field missing or zero"
              to the reasons of 'the response';

   Then branch to an error stop. Now a missing field produces a
   clear, explicit answer instead of a plausible wrong one.
   ============================================================ */`,
      note: "Cases 2 and 3 are the dangerous ones because they return 200 OK with a decision that looks legitimate. Case 4 is comparatively kind — it fails loudly. Design your validation stage assuming callers will do 2 and 3, because eventually one of them will."
    },
    quiz: {
      kind: "predict",
      prompt: "A caller sends `{\"applicant\": {\"age\": 28, \"annualSalary\": 45000}}` and omits creditScore. The rule is “if the credit score is less than 700 then reject”. What is returned?",
      options: [
        "HTTP 400 — creditScore is required",
        "200 OK, rejected: credit score defaults to 0, which is less than 700",
        "200 OK, approved: missing fields are skipped by rules",
        "HTTP 500 — NullPointerException"
      ],
      answer: 1,
      explain: "An omitted int becomes 0, the Java default. 0 < 700, so the rejection rule fires and the caller gets a plausible-looking rejection with a correct-sounding reason. No error anywhere. This is why a validation stage that explicitly checks for mandatory fields is not optional — it is the difference between a wrong answer and a clear one."
    },
    mistake: {
      title: "Trusting a 200 OK",
      symptom: "Integration testing passes, the API returns 200 every time, and a week later the business reports decisions that make no sense.",
      cause: "A field-name mismatch or an omitted field. HTDS ignores unknown fields and defaults missing ones, so the request succeeds with incomplete data.",
      fix: "Assert on the decision, not the status code. In integration tests, send a known applicant and assert the exact expected decision — that catches mapping errors immediately. Add a validation rule task that rejects requests with obviously-unset mandatory fields, and echo the key input values back in the response during development so you can see what the server actually received."
    }
  },

  /* ---------------------------------------------------------------- 5.3 */
  {
    id: "p5-t3",
    title: "Calling the ruleset from Postman",
    minutes: 12,
    tag: "Hands-on ★",
    intro: `Postman is the fastest way to prove your decision service works, and it is what your roadmap names explicitly. Before writing a single line of Java, you want a saved Postman collection that exercises your ruleset.

The value is separation of concerns. When something goes wrong later, a working Postman call tells you the server is fine and the problem is in your Java. Without it you are debugging two things at once.

Build a collection with one request per scenario — happy path, each rejection reason, each boundary. That collection then becomes your smoke test after every deployment, and a genuinely impressive thing to show in an interview: *"here is my decision service, and here are the eight cases I test it with."*`,
    jargon: [
      { term: "Postman", plain: "A desktop tool for building, sending and saving HTTP requests." },
      { term: "Collection", plain: "A saved group of related requests." },
      { term: "Environment (Postman)", plain: "A set of variables — host, port, credentials — so one collection works against several servers." },
      { term: "Basic auth", plain: "Authentication sending username:password base64-encoded in a header." },
      { term: "Test script", plain: "JavaScript Postman runs after a response, to assert things about it." }
    ],
    sections: [
      {
        title: "Setting the request up",
        open: true,
        body: `**Method:** POST

**URL:** \`{{baseUrl}}/DecisionService/rest/SunriseLoanApp/1.0/loan-eligibility/1.0\`

**Headers:**
\`\`\`
Content-Type: application/json
Accept: application/json
\`\`\`

**Authorization:** Basic Auth, with your RES credentials. Postman builds the header for you.

**Body:** raw, JSON, with the payload from topic 5.2.

Use a Postman **environment** for \`baseUrl\`, username and password so you can switch between local and TEST with a dropdown, and so credentials never end up in an exported collection you might share.`
      },
      {
        title: "Add test assertions — this is the part people skip",
        open: true,
        body: `Postman can assert on the response. A few lines turn a manual check into an automated one:

\`\`\`javascript
pm.test("Status is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Applicant is rejected for age", function () {
    const body = pm.response.json();
    pm.expect(body.response.eligible).to.eql(false);
    pm.expect(body.response.reason).to.include("at least 21");
});

pm.test("Responds within 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});
\`\`\`

Now the whole collection can be run in one click, and every scenario is checked automatically. That is a regression suite for your decision service, built in about ten minutes.`
      },
      {
        title: "The scenarios to build",
        open: false,
        body: `| Request name | Purpose |
|---|---|
| 01 happy path | 28 / 45000 / 742 → eligible |
| 02 under age | 19 / 52000 / 710 → age rejection |
| 03 low salary | 30 / 22000 / 780 → salary rejection |
| 04 low credit score | 35 / 60000 / 640 → score rejection |
| 05 boundary exact | 21 / 30000 / 700 → eligible |
| 06 boundary just under | 20 / 29999 / 699 → three rejections |
| 07 multiple failures | 18 / 12000 / 500 → all reasons present |
| 08 missing field | creditScore omitted → validation message |
| 09 empty loans | loans: [] → collection rules behave |
| 10 many loans | 4 loans → total-debt rule fires |

Ten requests. Run them after every deployment. Requests 05 and 06 will find more real bugs than the other eight combined.`
      }
    ],
    diagram: {
      caption: "Prove each hop works before adding the next",
      kind: "flow",
      dir: "right",
      nodes: [
        { label: "RES console test", sub: "is the ruleset right?", tone: "a" },
        { label: "Postman", sub: "is the REST layer right?", tone: "b" },
        { label: "Java client", sub: "is my code right?", tone: "c" },
        { label: "Real application", sub: "end to end", tone: "ok" }
      ]
    },
    example: {
      caption: "A Postman collection for POC-05, as exportable JSON",
      lang: "json",
      code: `{
  "info": {
    "name": "Sunrise Bank - Loan Eligibility",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "baseUrl",     "value": "http://localhost:9060" },
    { "key": "rulesetPath",
      "value": "SunriseLoanApp/1.0/loan-eligibility/1.0" }
  ],
  "auth": {
    "type": "basic",
    "basic": [
      { "key": "username", "value": "{{resUser}}" },
      { "key": "password", "value": "{{resPassword}}" }
    ]
  },
  "item": [
    {
      "name": "01 - happy path (eligible)",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Content-Type", "value": "application/json" },
          { "key": "Accept",       "value": "application/json" }
        ],
        "url": "{{baseUrl}}/DecisionService/rest/{{rulesetPath}}",
        "body": {
          "mode": "raw",
          "raw": "{\\n  \\"applicant\\": {\\n    \\"name\\": \\"Asha Kulkarni\\",\\n    \\"age\\": 28,\\n    \\"annualSalary\\": 45000.0,\\n    \\"creditScore\\": 742,\\n    \\"hasExistingLoan\\": false,\\n    \\"loans\\": []\\n  },\\n  \\"response\\": { \\"eligible\\": false, \\"reasons\\": [] }\\n}"
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('status 200', () => pm.response.to.have.status(200));",
              "const r = pm.response.json().response;",
              "pm.test('eligible', () => pm.expect(r.eligible).to.eql(true));",
              "pm.test('reason correct', () =>",
              "    pm.expect(r.reason).to.include('Meets all'));"
            ]
          }
        }
      ]
    },
    {
      "name": "05 - boundary: exactly at every threshold",
      "request": {
        "method": "POST",
        "header": [ { "key": "Content-Type", "value": "application/json" } ],
        "url": "{{baseUrl}}/DecisionService/rest/{{rulesetPath}}",
        "body": {
          "mode": "raw",
          "raw": "{\\n  \\"applicant\\": {\\n    \\"age\\": 21,\\n    \\"annualSalary\\": 30000.0,\\n    \\"creditScore\\": 700,\\n    \\"loans\\": []\\n  },\\n  \\"response\\": {}\\n}"
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "const r = pm.response.json().response;",
              "pm.test('exactly-at-threshold is ELIGIBLE', () =>",
              "    pm.expect(r.eligible).to.eql(true));",
              "// 'at least 21' means 21 passes.",
              "// If this fails, a rule uses > where it should use >=."
            ]
          }
        }
      ]
    }
  ]
}`,
      note: "Request 05 is the highest-value test in the collection. 'At least 21' versus 'over 21' is a single character in a rule and one real applicant in production. An automated assertion on the exact boundary catches it forever."
    },
    quiz: {
      kind: "choose",
      prompt: "Your Java client gets a wrong decision. The same request in Postman gives the correct one. Where is the bug?",
      options: [
        "In the rules",
        "In the Java client — its request differs from what you think it is sending",
        "On the Decision Server",
        "In the BOM"
      ],
      answer: 1,
      explain: "Postman proves the server and rules are correct for that payload. So your Java is sending something different — a field name mismatch, a missing value, a wrong content type, or the wrong ruleset path. Log the exact JSON your client produces and diff it against the Postman body; the difference is usually obvious within seconds."
    },
    mistake: {
      title: "Testing only through the application",
      symptom: "Hours spent debugging a wrong decision, eventually traced to a typo in the Java client's JSON.",
      cause: "No independent way to check the server. Every test went through the full application stack, so any layer could have been at fault.",
      fix: "Build the Postman collection first, before any Java. Then debugging is a binary search: if Postman is right and Java is wrong, the bug is in Java. Keep the collection in your Git repository next to the code — it is documentation, a smoke test and a debugging tool in one file."
    }
  },

  /* ---------------------------------------------------------------- 5.4 */
  {
    id: "p5-t4",
    title: "Calling the decision service from Java",
    minutes: 16,
    tag: "Hands-on ★",
    intro: `Now the Java client — the piece that makes this phase, in your roadmap's words, "one of the most valuable".

It is ordinary HTTP client code. Nothing ODM-specific is required: build the JSON, POST it, parse the response. That is the point of exposing rules over REST.

We will use \`java.net.http.HttpClient\`, built into Java 11 and later, so there is no dependency to add beyond a JSON library. In a real project you would likely use Spring's \`RestTemplate\`/\`WebClient\` or whatever your team already uses — the shape is identical.

Everything from Phase 1 shows up here: a class with getters, a list, exception handling, and \`Optional\`-style defensive checks. This is the topic where Java and ODM finally meet.`,
    jargon: [
      { term: "HttpClient", plain: "Java's built-in HTTP client, available since Java 11." },
      { term: "Jackson", plain: "The most common Java library for converting between objects and JSON." },
      { term: "DTO", plain: "Data Transfer Object — a simple class mirroring the JSON structure." },
      { term: "Timeout", plain: "How long the client waits before giving up on a response." },
      { term: "Connection pool", plain: "Reused HTTP connections, so each call does not pay setup cost." }
    ],
    sections: [
      {
        title: "The five steps of any client call",
        open: true,
        body: `1. **Build the request object** — a DTO mirroring the JSON shape.
2. **Serialise to JSON** — Jackson's \`writeValueAsString\`.
3. **Send the HTTP POST** — with headers, auth and a timeout.
4. **Check the status code** — before touching the body.
5. **Deserialise and use the decision.**

Step 4 is the one juniors skip. A 500 response has a body too, and parsing it as a success object produces a confusing failure several lines later, far from the actual cause.`
      },
      {
        title: "Timeouts and failure handling",
        open: true,
        body: `A decision service is a network call, so it can be slow or absent. Two questions to answer deliberately:

**How long do I wait?** Set both a connect timeout and a request timeout. Without them the default may be effectively forever, and a slow decision service becomes a hung application.

**What do I do if it fails?** Options, in rough order of preference:
- **Fail the transaction** — safest when a wrong decision is worse than no decision. Usually correct for lending.
- **Retry once** — reasonable for a timeout, but only if execution is side-effect free.
- **Fall back to a safe default** — e.g. route to manual review. Never fall back to "approve".

Write the choice down in your POC notes. "What happens when the decision service is down?" is a question a good interviewer will ask, and having a considered answer marks you out.`
      },
      {
        title: "Reuse the client",
        open: false,
        body: `\`HttpClient\` is designed to be created once and shared. Creating one per call throws away connection pooling and will noticeably slow a high-volume service.

\`\`\`
// good: one instance, reused
private static final HttpClient CLIENT = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5))
        .build();
\`\`\`

The same applies to Jackson's \`ObjectMapper\` — thread-safe, expensive to create, meant to be shared.`
      }
    ],
    diagram: {
      caption: "The Java client's five steps",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "1. Build DTO", sub: "Applicant object from your data", tone: "a" },
        { label: "2. Serialise", sub: "Jackson → JSON string", tone: "a" },
        { label: "3. POST", sub: "HttpClient, auth, timeout", tone: "b" },
        { label: "4. Check status", sub: "200? 400? 500? — before parsing", tone: "warn" },
        { label: "5. Deserialise", sub: "JSON → LoanDecision", tone: "c" },
        { label: "Use the decision", sub: "approve, decline, refer", tone: "ok" }
      ]
    },
    example: {
      caption: "A complete, production-shaped Java client for POC-05",
      lang: "java",
      code: `package com.sunrise.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.*;

public class LoanDecisionClient {

    // create once, reuse - connection pooling matters
    private static final HttpClient CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .setSerializationInclusion(JsonInclude.Include.NON_NULL);

    private final String endpoint;
    private final String basicAuth;

    public LoanDecisionClient(String baseUrl, String rulesetPath,
                              String user, String password) {
        this.endpoint = baseUrl + "/DecisionService/rest/" + rulesetPath;
        this.basicAuth = "Basic " + Base64.getEncoder()
                .encodeToString((user + ":" + password).getBytes());
    }

    public LoanDecision decide(Applicant applicant) throws DecisionServiceException {

        // ---- 1. build the request payload ----
        Map<String, Object> payload = new HashMap<>();
        payload.put("applicant", applicant);
        payload.put("response", new LoanResponse());   // IN_OUT parameter

        try {
            // ---- 2. serialise ----
            String json = MAPPER.writeValueAsString(payload);

            // ---- 3. send ----
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .header("Authorization", basicAuth)
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response =
                    CLIENT.send(request, HttpResponse.BodyHandlers.ofString());

            // ---- 4. check the status BEFORE parsing ----
            int status = response.statusCode();
            if (status == 400) {
                throw new DecisionServiceException(
                    "Bad request - check field names and types: " + response.body());
            }
            if (status == 401 || status == 403) {
                throw new DecisionServiceException(
                    "Not authorised to call the decision service");
            }
            if (status == 404) {
                throw new DecisionServiceException(
                    "Ruleset not found at " + endpoint + " - check the path and versions");
            }
            if (status != 200) {
                throw new DecisionServiceException(
                    "Decision service returned HTTP " + status + ": " + response.body());
            }

            // ---- 5. deserialise ----
            DecisionEnvelope envelope =
                    MAPPER.readValue(response.body(), DecisionEnvelope.class);

            if (envelope.getResponse() == null) {
                throw new DecisionServiceException(
                    "Response contained no 'response' object: " + response.body());
            }
            return envelope.getResponse();

        } catch (java.io.IOException e) {
            throw new DecisionServiceException(
                "Could not reach the decision service at " + endpoint, e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();          // restore the flag
            throw new DecisionServiceException("Call interrupted", e);
        }
    }
}


/* ---------- the DTOs ---------- */

class DecisionEnvelope {
    private LoanDecision response;
    public LoanDecision getResponse() { return response; }
    public void setResponse(LoanDecision r) { this.response = r; }
}

class LoanDecision {
    private boolean eligible;
    private String reason;
    private List<String> reasons = new ArrayList<>();
    private List<String> messages = new ArrayList<>();

    public boolean isEligible() { return eligible; }
    public void setEligible(boolean e) { this.eligible = e; }
    public String getReason() { return reason; }
    public void setReason(String r) { this.reason = r; }
    public List<String> getReasons() { return reasons; }
    public void setReasons(List<String> r) {
        this.reasons = (r == null) ? new ArrayList<>() : r;
    }
    public List<String> getMessages() { return messages; }
    public void setMessages(List<String> m) {
        this.messages = (m == null) ? new ArrayList<>() : m;
    }
}

class DecisionServiceException extends Exception {
    public DecisionServiceException(String m) { super(m); }
    public DecisionServiceException(String m, Throwable c) { super(m, c); }
}


/* ---------- using it ---------- */

class Main {
    public static void main(String[] args) {
        LoanDecisionClient client = new LoanDecisionClient(
                "http://localhost:9060",
                "SunriseLoanApp/1.0/loan-eligibility/1.0",
                "resAdmin", "resAdmin");

        Applicant asha = new Applicant();
        asha.setName("Asha Kulkarni");
        asha.setAge(28);
        asha.setAnnualSalary(45000);
        asha.setCreditScore(742);
        asha.setHasExistingLoan(false);

        try {
            LoanDecision decision = client.decide(asha);

            System.out.println("Eligible : " + decision.isEligible());
            System.out.println("Reason   : " + decision.getReason());
            for (String r : decision.getReasons()) {
                System.out.println("  - " + r);
            }

        } catch (DecisionServiceException e) {
            // decide deliberately: fail, retry, or route to manual review
            System.err.println("Decision unavailable: " + e.getMessage());
            System.err.println("Routing application to manual underwriting.");
        }
    }
}`,
      note: "Look at the status-code block. Each code gets a message naming the likely cause — 404 says 'check the path and versions', not just 'not found'. When this runs at 3 a.m. and someone reads the log, that sentence is the difference between a five-minute fix and an hour of guessing."
    },
    quiz: {
      kind: "choose",
      prompt: "The client throws a Jackson parsing error: “Unrecognized token '<'”. What has almost certainly happened?",
      options: [
        "The decision service returned XML instead of JSON",
        "The response was an HTML error page — a 404 or 500 — that the code tried to parse as JSON",
        "The ruleset is corrupt",
        "Jackson is misconfigured"
      ],
      answer: 1,
      explain: "A '<' as the first character means the body starts with HTML, typically an application-server error page. The real problem is an unchecked status code: the code went straight to parsing without noticing the request had failed. Always check the status before deserialising — the resulting error message will then name the real cause."
    },
    mistake: {
      title: "No timeout on the HTTP call",
      symptom: "Under load the application's threads all block, and eventually the whole service stops responding — even for requests that have nothing to do with lending.",
      cause: "No request timeout was set. A slow or hung decision service leaves each calling thread waiting indefinitely, and thread pool exhaustion takes down everything.",
      fix: "Always set both connectTimeout on the client and timeout on the request. Choose a value from the actual latency you observe — if the service normally answers in 20 ms, 10 seconds is generous. Then decide explicitly what happens on timeout, and make sure that path is tested, not just written."
    }
  },

  /* ---------------------------------------------------------------- 5.5 */
  {
    id: "p5-t5",
    title: "The other route — embedded execution via the Java rules API",
    minutes: 12,
    tag: "Integration",
    intro: `REST is not the only way. ODM also offers a **Java rules API** that runs rules in the same JVM as your application, with no HTTP at all.

\`\`\`
IlrSessionFactory factory = new IlrJ2SESessionFactory();
IlrStatelessSession session = factory.createStatelessSession();
IlrSessionRequest request = factory.createRequest(rulesetPath);
request.getInputParameters().put("applicant", applicant);
IlrSessionResponse response = session.execute(request);
\`\`\`

Notice the interfaces — this is exactly what topic 1.4 promised you would meet.

Two flavours: **J2SE** (embedded, rules loaded from a local archive) and **Java EE** (connecting to a Decision Server through a resource adapter).

You should know this exists and be able to recognise it in code. For your POCs, use REST — it is simpler, language-agnostic, and matches how modern decision services are actually deployed.`,
    jargon: [
      { term: "Java rules API", plain: "ODM's Java interface for executing rulesets in-process or against a server." },
      { term: "Session factory", plain: "The object that creates rule execution sessions." },
      { term: "Stateless session", plain: "One execution, no memory between calls. The usual choice." },
      { term: "Stateful session", plain: "Keeps working memory across several calls. Rarely needed." },
      { term: "IlrSessionRequest / Response", plain: "The input and output containers of an execution." },
      { term: "Resource adapter", plain: "A Java EE component connecting an application to the Rule Execution Server." }
    ],
    sections: [
      {
        title: "REST or embedded — choosing",
        open: true,
        body: `| | REST (HTDS) | Embedded (Java API) |
|---|---|---|
| Caller language | Anything | Java only |
| Latency | Network hop | In-process, fastest |
| Coupling | Loose — versioned URL | Tight — ODM jars in your app |
| Deployment | Rules deployed separately | Rules may ship with the app |
| Scaling | Independent of the caller | Scales with the caller |
| Debugging | Postman, HTTP logs | Java debugger |
| Typical use | Enterprise decision service | High-volume batch, latency-critical paths |

**Default to REST.** Choose embedded when latency genuinely matters (a batch processing millions of records where a network hop per record is unacceptable) or when there is no network path to a Decision Server.`
      },
      {
        title: "What the code looks like",
        open: false,
        body: `The shape is always: factory → session → request → execute → read outputs.

\`\`\`
IlrSessionFactory factory = new IlrJ2SESessionFactory();
IlrStatelessSession session = factory.createStatelessSession();

IlrSessionRequest request = factory.createRequest(
        "/SunriseLoanApp/1.0/loan-eligibility/1.0");
request.setTraceEnabled(true);
request.getTraceFilter().setInfoAllRules(true);

Map<String, Object> params = new HashMap<>();
params.put("applicant", applicant);
params.put("response", new LoanResponse());
request.setInputParameters(params);

IlrSessionResponse response = session.execute(request);
LoanResponse decision =
        (LoanResponse) response.getOutputParameters().get("response");
\`\`\`

Note \`setTraceEnabled(true)\` — you get the execution trace back as an object you can inspect programmatically. That is genuinely powerful for debugging and for audit logging.

Also note the cast on the last line. No generics here: \`getOutputParameters()\` returns \`Map<String, Object>\`, so a wrong parameter name gives you a \`ClassCastException\` or a null. Phase 1's warnings about raw types apply directly.`
      }
    ],
    diagram: {
      caption: "Two integration styles",
      kind: "columns",
      cols: [
        { title: "REST / HTDS", tone: "ok", items: ["Any language", "Network hop", "Loosely coupled", "Versioned URL", "→ default choice"] },
        { title: "Embedded Java API", tone: "b", items: ["Java only", "In-process, fastest", "ODM jars in your app", "Trace object available", "→ latency-critical batch"] }
      ]
    },
    example: {
      caption: "The same decision, both ways, side by side",
      lang: "java",
      code: `/* ============ ROUTE A: REST (recommended for your POCs) ============ */

LoanDecisionClient client = new LoanDecisionClient(
        "http://localhost:9060",
        "SunriseLoanApp/1.0/loan-eligibility/1.0",
        "resAdmin", "resAdmin");

LoanDecision decision = client.decide(applicant);
System.out.println(decision.isEligible());

// + works from any language
// + rules deploy independently of the app
// - network latency per call


/* ============ ROUTE B: embedded Java rules API ============ */

import ilog.rules.res.session.*;

public class EmbeddedLoanDecider {

    private final IlrSessionFactory factory = new IlrJ2SESessionFactory();
    private final String rulesetPath = "/SunriseLoanApp/1.0/loan-eligibility/1.0";

    public LoanResponse decide(Applicant applicant) throws Exception {

        IlrStatelessSession session = factory.createStatelessSession();
        IlrSessionRequest request = factory.createRequest(rulesetPath);

        // ask for the execution trace back
        request.setTraceEnabled(true);
        request.getTraceFilter().setInfoExecutionEvents(true);
        request.getTraceFilter().setInfoRules(true);

        Map<String, Object> inputs = new HashMap<>();
        inputs.put("applicant", applicant);
        inputs.put("response", new LoanResponse());
        request.setInputParameters(inputs);

        IlrSessionResponse response = session.execute(request);

        // the trace, as an object you can log or assert on
        IlrExecutionTrace trace = response.getRulesetExecutionTrace();
        System.out.println("Rules fired: " + trace.getNumberOfRulesFired());
        for (Object ruleName : trace.getExecutionEvents()) {
            System.out.println("  fired: " + ruleName);
        }

        return (LoanResponse) response.getOutputParameters().get("response");
    }
}

// + no network hop - fastest possible
// + the trace comes back as a rich object
// - Java only, ODM jars on your classpath
// - rules and application become deployment-coupled


/* ============ WHICH FOR WHAT ============
   Online loan application, one decision per user action
       -> REST. Latency is irrelevant next to the network round trip
          the user is already making.

   Overnight batch re-scoring 4 million accounts
       -> Embedded. 4 million HTTP calls at even 10ms each is 11 hours.

   A .NET or Python service needs the same decision
       -> REST. It is the only option.
   ==================================================== */`,
      note: "The batch arithmetic is worth internalising: 4 million calls at 10 ms is over 11 hours of pure network time. That is the concrete reason embedded execution still exists, and it is a good, specific answer if an interviewer asks when you would not use REST."
    },
    quiz: {
      kind: "choose",
      prompt: "An overnight batch job must apply the same eligibility rules to 4 million accounts, and must finish inside a 4-hour window. Which integration route?",
      options: [
        "REST — it is the modern default",
        "Embedded Java rules API — 4 million network round trips would not fit the window",
        "Either; the difference is negligible",
        "Split the batch across several REST servers"
      ],
      answer: 1,
      explain: "At even 10 ms per HTTP call, 4 million calls is over 11 hours of network time alone. In-process execution removes that entirely. This is exactly the case the embedded API exists for. Option D can help, but it adds infrastructure to work around a hop you did not need in the first place."
    },
    mistake: {
      title: "Choosing embedded execution by default",
      symptom: "Every application that needs a decision now carries ODM jars, and a rule change requires redeploying six applications.",
      cause: "Embedded was chosen because it was in the tutorial, not because latency required it. The tight coupling was invisible until the first policy change.",
      fix: "Default to REST and treat embedded as an optimisation you justify with measured numbers. The whole value of a decision service is that rules change independently of callers — embedding it in six applications gives that away, and you only notice the day the business asks for a threshold change."
    }
  },

  /* ---------------------------------------------------------------- 5.6 */
  {
    id: "p5-t6",
    title: "End to end — the full picture",
    minutes: 12,
    tag: "Synthesis ★",
    intro: `Time to put every phase together. This is your roadmap's final diagram:

\`\`\`
Postman → REST API → ODM Decision Server → Ruleset → Decision → JSON Response
\`\`\`

And now you know what is inside every one of those boxes. This topic is the synthesis — the one to reread before an interview, because "walk me through how a decision service works end to end" is the question that separates people who have used ODM from people who have watched a demo.

The skill being tested is not memorising components. It is being able to say, for each hop, *what could go wrong here and how would I tell?* Follow one request the whole way and you have your answer.`,
    jargon: [
      { term: "End-to-end", plain: "The complete path from the caller's request to the caller's response." },
      { term: "Round trip", plain: "One complete request-and-response cycle." },
      { term: "Latency", plain: "How long a round trip takes." },
      { term: "Contract", plain: "The agreed shape of the request and response." }
    ],
    sections: [
      {
        title: "Every hop, and what fails there",
        open: true,
        body: `| Hop | What can go wrong | How you tell |
|---|---|---|
| Caller builds JSON | Wrong field names, missing fields | Log the exact JSON; compare with Postman |
| Network to server | Unreachable, timeout, TLS | Connection error, not an HTTP status |
| HTTP / auth | 401, 403 | Status code |
| Path resolution | 404, wrong ruleset version | Status code; check RES console |
| JSON → parameters | Type mismatch → 400; unknown field → silently ignored | 400 body; or a wrong decision with 200 OK |
| Ruleset loads | Missing XOM → ClassNotFoundException | 500, server log |
| Rules execute | Wrong decision, no rule fired, loop | Execution trace |
| Response serialised | Field missing from output | Inspect the JSON |
| Caller parses | Parsing error, wrong DTO shape | Client-side exception |

Memorise the *shape* of this table rather than the details. When something breaks, walking the hops in order finds the cause faster than any amount of staring at rules.`
      },
      {
        title: "The interview answer",
        open: true,
        body: `Practise saying this out loud, in about ninety seconds:

> "The calling application builds a JSON request whose top-level keys are the ruleset's input parameters, and POSTs it to the Decision Server's HTDS endpoint — the URL identifies the RuleApp and ruleset by name and version.
>
> HTDS deserialises that JSON into Java objects of the XOM classes, and hands them to the execution unit as ruleset parameters. The execution unit loads the ruleset from its cache and runs the ruleflow. Rules are written against the BOM, which maps back to those XOM classes through the B2X mapping, so when a rule says 'the credit score of the applicant' the engine calls getCreditScore() on the real object.
>
> The rules populate the output parameter — in our case setting eligibility and a list of reasons. That object is serialised back to JSON and returned with a 200.
>
> Because the rules are deployed separately from the application, the business can change a threshold in Decision Center, deploy a new minor version, and every caller picks it up with no code change."

That last paragraph is the one that lands. It answers *why* rather than *how*.`
      },
      {
        title: "Performance, briefly",
        open: false,
        body: `Rough figures worth knowing:

- Rule execution itself: typically **1–10 ms** for a ruleset this size.
- HTTP round trip on a LAN: **5–50 ms**.
- **The first call after deployment is much slower** — the ruleset must be parsed and compiled before it is cached. This surprises everyone during their first load test.

So warm the ruleset after deployment with one throwaway call. And when someone reports "the decision service is slow", find out whether they mean the first call or all of them — the answers are completely different.`
      }
    ],
    diagram: {
      caption: "The complete journey, both directions",
      kind: "flow",
      dir: "down",
      nodes: [
        { label: "Postman / application", sub: "builds JSON from an Applicant", tone: "a" },
        { label: "HTTP POST + auth", sub: "to the ruleset path", tone: "a" },
        { label: "HTDS", sub: "JSON → XOM objects → ruleset parameters", tone: "b" },
        { label: "Execution Unit", sub: "loads the cached ruleset", tone: "b" },
        { label: "Ruleflow", sub: "validation → eligibility → pricing → messaging", tone: "c" },
        { label: "Rules fire against BOM/XOM", sub: "getCreditScore() called for real", tone: "c" },
        { label: "Response object populated", sub: "eligible, reasons, messages", tone: "ok" },
        { label: "JSON response, HTTP 200", sub: "back to the caller", tone: "ok" }
      ]
    },
    example: {
      caption: "One request, traced through every layer, with timings",
      lang: "text",
      code: `T+0ms    APPLICATION
         Applicant asha = new Applicant();
         asha.setAge(28); asha.setAnnualSalary(45000);
         asha.setCreditScore(742);

T+1ms    SERIALISE (Jackson)
         {"applicant":{"name":"Asha Kulkarni","age":28,
          "annualSalary":45000.0,"creditScore":742,
          "hasExistingLoan":false,"loans":[]},
          "response":{"eligible":false,"reasons":[]}}

T+2ms    HTTP POST
         POST /DecisionService/rest/SunriseLoanApp/1.0/
              loan-eligibility/1.0
         Authorization: Basic ***
         Content-Type: application/json

T+8ms    DECISION SERVER receives, authenticates       -> ok
T+9ms    Path resolved -> ruleset found in cache       -> ok
                          (a cold ruleset here costs 200-800ms)

T+10ms   HTDS DESERIALISES
         com.sunrise.model.Applicant@3f2a
             age=28, annualSalary=45000.0, creditScore=742,
             hasExistingLoan=false, loans=[]  (empty, not null)
         com.sunrise.model.LoanResponse@7b1c
             eligible=false, reasons=[]

T+11ms   EXECUTION UNIT takes an engine from the pool

T+11ms   RULEFLOW 'loan-eligibility'
           initialise-response      function task, ok
           validation               0 rules fired (input complete)
           branch input-usable?     -> otherwise
           eligibility              4 rules considered
              reject-under-age          28 < 21   FALSE  skip
              reject-low-salary      45000 < 30000 FALSE skip
              reject-low-credit-score  742 < 700  FALSE  skip
              approve                all three pass -> FIRED
                 eligibility := true
                 reasons += "Meets all pre-screening criteria"
           branch eligible?         -> true, continue to pricing
           pricing                  decision table loan-pricing-v2
              row 1  742 not in 300..649        no
              row 2  total debt 0, not > 200000 no
              row 3  742 not in 750..900        no
              row 5  742 in 700..749, no loan   MATCH
                 interest rate := 10.5
                 decision := "APPROVE"
           messaging                1 rule fired
T+14ms   RULEFLOW complete. 3 rules fired. 3ms execution.

T+15ms   SERIALISE the response object
         {"response":{"eligible":true,
           "reason":"Meets all pre-screening criteria",
           "reasons":["Meets all pre-screening criteria"],
           "interestRate":10.5,
           "decision":"APPROVE",
           "messages":["Congratulations - you are pre-approved."]}}

T+16ms   HTTP 200 returned

T+22ms   APPLICATION deserialises into LoanDecision
         decision.isEligible()      -> true
         decision.getInterestRate() -> 10.5

TOTAL 22ms.  Rule execution was 3ms of it.
The other 19ms is network, serialisation and HTTP.

>>> Worth remembering: the engine is rarely your bottleneck. <<<`,
      note: "Print this trace and keep it. It is the single most useful artefact for interview preparation on your whole roadmap — every component you have studied appears exactly once, in the order it actually happens, with realistic numbers attached."
    },
    quiz: {
      kind: "choose",
      prompt: "A load test shows the first request takes 850 ms and every subsequent one takes 20 ms. What is happening?",
      options: [
        "The network is unstable",
        "The first call pays the cost of loading and compiling the ruleset; after that it is cached in the execution unit",
        "The rules are inefficient",
        "Authentication is slow on the first call only"
      ],
      answer: 1,
      explain: "Cold-start. The execution unit parses and compiles the ruleset on first use and caches it thereafter. This is normal and expected. The fix is a warm-up call after every deployment — and knowing this saves you from 'optimising' rules that were never slow."
    },
    mistake: {
      title: "Debugging from the wrong end",
      symptom: "Two days spent rewriting rules for a problem that turned out to be a field name typo in the client's JSON.",
      cause: "The investigation started where the symptom was noticed (wrong decision) rather than at the beginning of the chain (what data actually arrived).",
      fix: "Walk the hops in order, always. (1) What JSON is the client actually sending — log it. (2) Does that exact JSON work in Postman? (3) Does the RES console test give the right answer for that input? (4) Only then look at the rules. Each step is under a minute and eliminates a whole layer. Almost every ODM integration problem is found by step 3."
    }
  }

  ],

  quiz: [
    {
      q: "What does HTDS give you?",
      options: ["A rule authoring interface", "Automatic REST/SOAP exposure of a deployed ruleset with no integration code", "A testing framework", "A deployment pipeline"],
      answer: 1,
      explain: "Hosted Transparent Decision Service exposes your ruleset as a web service automatically. 'Transparent' means you write no integration code for it."
    },
    {
      q: "What are the top-level keys in an HTDS JSON request?",
      options: ["The BOM class names", "The ruleset parameter names for IN and IN_OUT parameters", "input and output", "The rule package names"],
      answer: 1,
      explain: "Exactly the parameter names you declared. OUT parameters appear only in the response, never in the request."
    },
    {
      q: "A caller omits creditScore from the JSON. The rule is “if credit score is less than 700 then reject”. What happens?",
      options: ["HTTP 400", "200 OK and a rejection — the int defaults to 0, which is below 700", "The rule is skipped", "HTTP 500"],
      answer: 1,
      explain: "Omitted fields get Java defaults. The result is a plausible-looking wrong decision with no error at all, which is why a validation stage matters."
    },
    {
      q: "Your Java client gets a wrong decision; the identical request in Postman is correct. Where is the bug?",
      options: ["In the rules", "In the Java client's request", "On the Decision Server", "In the BOM"],
      answer: 1,
      explain: "Postman proves the server and rules are right for that payload, so the client must be sending something different. Log the actual JSON and compare."
    },
    {
      q: "Why must you check the HTTP status code before deserialising the response?",
      options: ["It is faster", "An error response has a different body — often HTML — and parsing it as success produces a confusing error far from the real cause", "Jackson requires it", "To avoid timeouts"],
      answer: 1,
      explain: "'Unrecognized token <' is the classic symptom: an HTML error page being parsed as JSON. Checking the status first surfaces the real problem."
    },
    {
      q: "When is the embedded Java rules API a better choice than REST?",
      options: ["Always — it is faster", "For high-volume batch work where millions of network round trips would not fit the processing window", "When business users need to edit rules", "When several languages must call the service"],
      answer: 1,
      explain: "Latency-critical, high-volume, Java-only work. Everywhere else, REST's loose coupling and language independence win."
    },
    {
      q: "The first call after a deployment takes 850 ms; the rest take 20 ms. Why?",
      options: ["Network warm-up", "Cold start — the execution unit loads and compiles the ruleset, then caches it", "Authentication caching", "Garbage collection"],
      answer: 1,
      explain: "Ruleset compilation happens on first use. Warm the service with a throwaway call after each deployment."
    },
    {
      q: "What is the strongest thing you can claim after completing this phase?",
      options: ["I completed ODM training", "I understand how an application invokes an ODM decision service, end to end", "I know Java", "I have used Postman"],
      answer: 1,
      explain: "That is precisely what your roadmap identifies as the differentiator. It describes a capability, not an attendance record — and you can now demonstrate it with a repository."
    }
  ]
};
