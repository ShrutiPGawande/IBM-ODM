/* ==========================================================================
   playground.js — a deliberately small Java *simulator*.

   This is NOT a JVM. It understands:
     - variable declarations and assignments (int, long, double, String, boolean)
     - System.out.println / print
     - if / else if / else
     - for and while loops
     - arithmetic, comparison and boolean expressions

   It does NOT understand objects, methods, collections or generics.
   Anything it cannot handle, it says so plainly and shows the expected
   output of the original snippet instead. It never pretends.
   ========================================================================== */

const Playground = (function () {

  const TYPES = ["int", "long", "short", "byte", "double", "float",
                 "String", "boolean", "char", "var"];

  const STEP_BUDGET = 20000;   // guards against an accidental endless loop

  /* ------------------------------------------------------------- helpers */

  /**
   * Replace string literals with placeholders so we can inspect syntax
   * safely. The placeholder contains no letters, so the identifier check
   * never mistakes it for a variable name.
   */
  function stripStrings(expr) {
    const strings = [];
    const stripped = expr.replace(/"(\\.|[^"\\])*"/g, function (m) {
      strings.push(m);
      return "\u0000" + (strings.length - 1) + "\u0001";
    });
    return { stripped: stripped, strings: strings };
  }

  function restoreStrings(stripped, strings) {
    return stripped.replace(/\u0000(\d+)\u0001/g, function (m, i) {
      return strings[Number(i)];
    });
  }

  /** Is this expression something we are willing to evaluate? */
  function validate(expr, scope) {
    const stripped = stripStrings(expr).stripped;

    if (/[;{}\[\]]/.test(stripped))               return "statements or arrays";
    if (/[A-Za-z_]\w*\s*\(/.test(stripped))       return "method calls";
    if (/\.(?!\d)/.test(stripped))                return "object access";
    if (/(^|[^=!<>+\-*/%])=(?!=)/.test(stripped)) return "assignment inside an expression";
    if (/\+\+|--/.test(stripped))                 return "++ or -- inside an expression";

    if (!/^[A-Za-z0-9_+\-*/%().,\s<>!=&|\u0000\u0001]*$/.test(stripped))
      return "unsupported characters";

    const ids = stripped.match(/[A-Za-z_]\w*/g) || [];
    const known = ["true", "false", "null"];
    for (let i = 0; i < ids.length; i++) {
      if (known.indexOf(ids[i]) >= 0) continue;
      if (!(ids[i] in scope)) return "the variable '" + ids[i] + "'";
    }
    return null;
  }

  function evaluate(expr, scope) {
    const names = Object.keys(scope);
    const values = names.map(function (n) { return scope[n]; });
    // eslint-disable-next-line no-new-func
    const fn = Function.apply(null, names.concat(['"use strict"; return (' + expr + ");"]));
    return fn.apply(null, values);
  }

  /** Java prints doubles with a decimal point; JS drops it. Approximate that. */
  function javaString(value, isFloating) {
    if (value === null || value === undefined) return "null";
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "number") {
      if (isFloating && Number.isInteger(value)) return value.toFixed(1);
      return String(value);
    }
    return String(value);
  }

  /* ------------------------------------------------------------- parsing */

  function Unsupported(what, lineNo) {
    this.what = what;
    this.lineNo = lineNo;
  }

  /** Split raw source into logical lines, dropping comments and blanks. */
  function cleanLines(code) {
    const lines = [];
    let inBlockComment = false;

    String(code).split("\n").forEach(function (raw, i) {
      let line = raw.trim();

      if (inBlockComment) {
        const end = line.indexOf("*/");
        if (end < 0) return;
        line = line.slice(end + 2).trim();
        inBlockComment = false;
      }
      if (!line) return;

      const bc = line.indexOf("/*");
      if (bc >= 0) {
        const end = line.indexOf("*/", bc + 2);
        if (end >= 0) line = (line.slice(0, bc) + " " + line.slice(end + 2)).trim();
        else { inBlockComment = true; line = line.slice(0, bc).trim(); }
        if (!line) return;
      }

      const sc = stripStrings(line);
      const ci = sc.stripped.indexOf("//");
      if (ci >= 0) {
        line = restoreStrings(sc.stripped.slice(0, ci), sc.strings).trim();
        if (!line) return;
      }

      explode(line).forEach(function (piece) {
        lines.push({ text: piece, no: i + 1 });
      });
    });

    return lines;
  }

  /**
   * Split one physical line into logical statements, so that
   * "} else {" becomes "}" + "else {" and "if (x) { y = 1; }" becomes
   * "if (x) {" + "y = 1" + "}". Semicolons inside for(...) are left alone.
   */
  function explode(line) {
    const pieces = [];
    let buf = "";
    let depth = 0;          // parenthesis depth
    let inString = false;
    let escaped = false;

    function flush(extra) {
      const t = (buf + (extra || "")).trim();
      if (t) pieces.push(t);
      buf = "";
    }

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (inString) {
        buf += ch;
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') { inString = true; buf += ch; continue; }
      if (ch === "(") { depth++; buf += ch; continue; }
      if (ch === ")") { depth--; buf += ch; continue; }

      if (depth === 0) {
        if (ch === "{") { flush("{"); continue; }
        if (ch === "}") { flush(); pieces.push("}"); continue; }
        if (ch === ";") { flush(); continue; }
      }
      buf += ch;
    }
    flush();
    return pieces;
  }

  /**
   * Build a statement tree from cleaned lines.
   *   {kind:'simple', text, no}
   *   {kind:'if',    cond, then:[], otherwise:[], no}
   *   {kind:'for',   init, cond, step, body:[], no}
   *   {kind:'while', cond, body:[], no}
   */
  function parse(lines, start, stopAtBrace) {
    const out = [];
    let i = start;

    while (i < lines.length) {
      const text = lines[i].text;
      const no = lines[i].no;

      if (text === "}" || text === "};") {
        if (stopAtBrace) return { nodes: out, next: i + 1 };
        i++; continue;                      // stray closing brace — ignore
      }

      /* ---- if / else if / else ---- */
      let m = text.match(/^if\s*\((.+)\)\s*\{$/);
      if (m) {
        const inner = parse(lines, i + 1, true);
        const node = { kind: "if", cond: m[1], then: inner.nodes, otherwise: [], no: no };
        let next = inner.next;

        while (next < lines.length && /^else\b/.test(lines[next].text)) {
          const et = lines[next].text;
          const em = et.match(/^else\s+if\s*\((.+)\)\s*\{$/);
          if (em) {
            const r = parse(lines, next + 1, true);
            const chained = { kind: "if", cond: em[1], then: r.nodes, otherwise: [], no: lines[next].no };
            attachElse(node, chained);
            next = r.next;
          } else if (/^else\s*\{$/.test(et)) {
            const r = parse(lines, next + 1, true);
            attachElse(node, r.nodes);
            next = r.next;
            break;
          } else {
            throw new Unsupported("that else clause", lines[next].no);
          }
        }

        out.push(node);
        i = next;
        continue;
      }
      if (/^if\s*\(/.test(text) && !text.endsWith("{")) {
        throw new Unsupported("a single-line if without braces — add { }", no);
      }

      /* ---- for-each: not supported, but be explicit about it ---- */
      if (/^for\s*\([^;]*:[^;]*\)/.test(text)) {
        throw new Unsupported("for-each loops over collections", no);
      }

      /* ---- classic for ---- */
      m = text.match(/^for\s*\((.*?);(.*?);(.*?)\)\s*\{$/);
      if (m) {
        const r = parse(lines, i + 1, true);
        out.push({ kind: "for", init: m[1].trim(), cond: m[2].trim(),
                   step: m[3].trim(), body: r.nodes, no: no });
        i = r.next;
        continue;
      }

      /* ---- while ---- */
      m = text.match(/^while\s*\((.+)\)\s*\{$/);
      if (m) {
        const r = parse(lines, i + 1, true);
        out.push({ kind: "while", cond: m[1], body: r.nodes, no: no });
        i = r.next;
        continue;
      }

      if (text.endsWith("{")) {
        throw new Unsupported("the block starting \u201c" + text.slice(0, 40) + "\u201d", no);
      }

      out.push({ kind: "simple", text: text.replace(/;$/, "").trim(), no: no });
      i++;
    }

    return { nodes: out, next: i };
  }

  /** Split an expression on '+' operators at paren depth 0, outside strings. */
  function splitTopLevelPlus(expr) {
    const pieces = [];
    let buf = "";
    let depth = 0, inString = false, escaped = false;

    for (let i = 0; i < expr.length; i++) {
      const ch = expr[i];
      if (inString) {
        buf += ch;
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') { inString = true; buf += ch; continue; }
      if (ch === "(") { depth++; buf += ch; continue; }
      if (ch === ")") { depth--; buf += ch; continue; }
      if (ch === "+" && depth === 0) {
        const prev = buf.replace(/\s+$/, "");
        // ignore a leading unary plus and anything that looks like ++
        if (prev !== "" && expr[i + 1] !== "+") { pieces.push(prev); buf = ""; continue; }
      }
      buf += ch;
    }
    if (buf.trim()) pieces.push(buf.trim());
    return pieces.map(function (p) { return p.trim(); }).filter(Boolean);
  }

  /** Attach an else branch to the deepest if in a chain. */
  function attachElse(node, branch) {
    let target = node;
    while (target.otherwise.length === 1 && target.otherwise[0].kind === "if") {
      target = target.otherwise[0];
    }
    target.otherwise = Array.isArray(branch) ? branch : [branch];
  }

  /* ----------------------------------------------------------- execution */

  function makeRunner() {
    const scope = {};
    const floating = {};
    const out = [];
    let steps = 0;

    function tick(no) {
      if (++steps > STEP_BUDGET) {
        throw new Unsupported("this many steps — it looks like an endless loop", no);
      }
    }

    function evalExpr(expr, no) {
      const bad = validate(expr, scope);
      if (bad) throw new Unsupported(bad, no);
      try { return evaluate(expr, scope); }
      catch (e) { throw new Unsupported("that expression", no); }
    }

    /** Does this fragment mention a variable declared double/float? */
    function fragmentIsFloating(fragment) {
      const ids = stripStrings(fragment).stripped.match(/[A-Za-z_]\w*/g) || [];
      return ids.some(function (id) { return floating[id]; }) ||
             /\d\.\d/.test(fragment);
    }

    /**
     * Java integer arithmetic truncates: 7 / 2 is 3, not 3.5.
     * If a fragment involves only int variables and whole-number literals,
     * apply the same rule.
     */
    function javaNumeric(fragment, value) {
      if (typeof value === "number" && !fragmentIsFloating(fragment)) {
        return Math.trunc(value);
      }
      return value;
    }

    /**
     * Evaluate a println argument with Java's concatenation semantics.
     *
     * Java is left-associative: once the running value is a String,
     * everything after it is appended; before that, numbers are added.
     * Doing it piece by piece also lets us print a double holding a whole
     * number as "45000.0" the way Java does, rather than JS's "45000".
     */
    function evalPrintArg(expr, no) {
      const pieces = splitTopLevelPlus(expr);
      if (pieces.length === 1) {
        const v = javaNumeric(expr, evalExpr(expr, no));
        return javaString(v, fragmentIsFloating(expr) && typeof v === "number");
      }

      let acc = null;
      let accIsString = false;

      for (let i = 0; i < pieces.length; i++) {
        const frag = pieces[i];
        const value = javaNumeric(frag, evalExpr(frag, no));
        const asText = javaString(value, fragmentIsFloating(frag) && typeof value === "number");

        if (i === 0) {
          acc = value; accIsString = (typeof value === "string");
          if (accIsString) acc = asText;
          continue;
        }
        if (accIsString || typeof value === "string") {
          if (!accIsString) {
            acc = javaString(acc, fragmentIsFloating(pieces.slice(0, i).join("+")) &&
                                   typeof acc === "number");
            accIsString = true;
          }
          acc = acc + asText;
        } else {
          acc = acc + value;         // still numeric addition
        }
      }
      return accIsString ? acc
                         : javaString(acc, fragmentIsFloating(expr) && typeof acc === "number");
    }

    function simple(text, no) {
      if (!text) return;

      /* println / print */
      let m = text.match(/^System\.out\.(println|print)\s*\(([\s\S]*)\)$/);
      if (m) {
        const isLn = m[1] === "println";
        const arg = m[2].trim();
        if (arg === "") { if (isLn) out.push(""); return; }
        const rendered = evalPrintArg(arg, no);
        if (isLn) out.push(rendered);
        else if (out.length) out[out.length - 1] += rendered;
        else out.push(rendered);
        return;
      }

      /* declaration with initialiser */
      m = text.match(/^(?:final\s+)?([A-Za-z_]\w*)\s+([A-Za-z_]\w*)\s*=\s*([\s\S]+)$/);
      if (m && TYPES.indexOf(m[1]) >= 0) {
        const type = m[1], name = m[2];
        let value = javaNumeric(m[3].trim(), evalExpr(m[3].trim(), no));
        if (["int", "long", "short", "byte"].indexOf(type) >= 0 && typeof value === "number") {
          value = Math.trunc(value);
        }
        if (type === "double" || type === "float") floating[name] = true;
        scope[name] = value;
        return;
      }

      /* declaration without initialiser */
      m = text.match(/^(?:final\s+)?([A-Za-z_]\w*)\s+([A-Za-z_]\w*)$/);
      if (m && TYPES.indexOf(m[1]) >= 0) {
        const type = m[1];
        scope[m[2]] = type === "String" ? null : (type === "boolean" ? false : 0);
        if (type === "double" || type === "float") floating[m[2]] = true;
        return;
      }

      /* increment / decrement */
      m = text.match(/^([A-Za-z_]\w*)(\+\+|--)$/);
      if (!m) {
        const pre = text.match(/^(\+\+|--)([A-Za-z_]\w*)$/);
        if (pre) m = [text, pre[2], pre[1]];
      }
      if (m) {
        const name = m[1];
        if (!(name in scope)) throw new Unsupported("the variable '" + name + "'", no);
        scope[name] = scope[name] + (m[2] === "++" ? 1 : -1);
        return;
      }

      /* assignment, possibly compound */
      m = text.match(/^([A-Za-z_]\w*)\s*([+\-*/%]?)=\s*([\s\S]+)$/);
      if (m && m[1] in scope) {
        const name = m[1], op = m[2];
        const rhs = op ? "(" + name + ") " + op + " (" + m[3].trim() + ")" : m[3].trim();
        let value = javaNumeric(rhs, evalExpr(rhs, no));
        if (typeof scope[name] === "number" && !floating[name] && typeof value === "number") {
          value = Math.trunc(value);
        }
        scope[name] = value;
        return;
      }

      throw new Unsupported("the line \u201c" + text.slice(0, 48) + "\u201d", no);
    }

    function exec(nodes) {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        tick(n.no);

        if (n.kind === "simple") { simple(n.text, n.no); continue; }

        if (n.kind === "if") {
          if (evalExpr(n.cond, n.no)) exec(n.then);
          else exec(n.otherwise);
          continue;
        }

        if (n.kind === "for") {
          if (n.init) simple(n.init.replace(/;$/, "").trim(), n.no);
          while (n.cond ? evalExpr(n.cond, n.no) : true) {
            tick(n.no);
            exec(n.body);
            if (n.step) simple(n.step.replace(/;$/, "").trim(), n.no);
          }
          continue;
        }

        if (n.kind === "while") {
          while (evalExpr(n.cond, n.no)) { tick(n.no); exec(n.body); }
          continue;
        }
      }
    }

    return { exec: exec, out: out };
  }

  /* ---------------------------------------------------------------- run */

  /** @returns {{ok:boolean, output:string, message?:string}} */
  function run(code) {
    let tree;
    try {
      tree = parse(cleanLines(code), 0, false).nodes;
    } catch (e) {
      if (e instanceof Unsupported) return unsupported(e.what, e.lineNo);
      return unsupported("that code", 1);
    }

    const runner = makeRunner();
    try {
      runner.exec(tree);
    } catch (e) {
      if (e instanceof Unsupported) return unsupported(e.what, e.lineNo);
      return unsupported("that code", 1);
    }

    if (!runner.out.length) {
      return { ok: true, output: "(the snippet ran, but printed nothing)" };
    }
    return { ok: true, output: runner.out.join("\n") };
  }

  function unsupported(what, lineNo) {
    return {
      ok: false,
      output: "",
      message: "The simulated console cannot handle " + what +
               " (line " + lineNo + ").\n\nIt understands variables, arithmetic, " +
               "if/else, for and while loops, and System.out.println — but not " +
               "objects, methods or collections."
    };
  }

  return { run: run };
})();
