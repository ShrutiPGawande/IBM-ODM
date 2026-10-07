/* ==========================================================================
   render.js — the mini-markdown renderer, the diagram renderer,
   and small HTML helpers. No dependencies.
   ========================================================================== */

const R = (function () {

  /* ---------------------------------------------------------------- utils */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Inline formatting: `code`, **bold**, *italic*. Code spans are protected. */
  function inline(text) {
    const parts = String(text).split("`");
    let out = "";
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 1) {
        out += "<code>" + esc(parts[i]) + "</code>";
      } else {
        let seg = esc(parts[i]);
        seg = seg.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        seg = seg.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, "$1<em>$2</em>");
        out += seg;
      }
    }
    return out;
  }

  /**
   * Markdown-lite -> HTML.
   * Supports: fenced code, tables, - bullets, 1. numbered, > quotes,
   * #/## headings, blank-line paragraphs, and the inline rules above.
   */
  function md(src) {
    if (!src) return "";
    const lines = String(src).replace(/\r\n/g, "\n").split("\n");
    let html = "";
    let i = 0;

    const isTableRow = s => /^\s*\|.*\|\s*$/.test(s);
    const isDivider  = s => /^\s*\|[\s:|-]+\|\s*$/.test(s);

    while (i < lines.length) {
      const line = lines[i];

      /* fenced code */
      if (/^\s*```/.test(line)) {
        const lang = line.replace(/^\s*```/, "").trim();
        const buf = [];
        i++;
        while (i < lines.length && !/^\s*```/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++; // closing fence
        html += '<pre><code class="lang-' + esc(lang) + '">' + esc(buf.join("\n")) + "</code></pre>";
        continue;
      }

      /* table */
      if (isTableRow(line) && i + 1 < lines.length && isDivider(lines[i + 1])) {
        const cells = s => s.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => c.trim());
        const head = cells(line);
        i += 2;
        const body = [];
        while (i < lines.length && isTableRow(lines[i])) { body.push(cells(lines[i])); i++; }
        html += '<div class="table-wrap"><table><thead><tr>' +
                head.map(h => "<th>" + inline(h) + "</th>").join("") +
                "</tr></thead><tbody>" +
                body.map(r => "<tr>" + r.map(c => "<td>" + inline(c) + "</td>").join("") + "</tr>").join("") +
                "</tbody></table></div>";
        continue;
      }

      /* headings */
      const h = line.match(/^(#{1,4})\s+(.*)$/);
      if (h) {
        const lvl = Math.min(h[1].length + 1, 5);
        html += "<h" + lvl + ">" + inline(h[2]) + "</h" + lvl + ">";
        i++; continue;
      }

      /* blockquote */
      if (/^\s*>\s?/.test(line)) {
        const buf = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
          buf.push(lines[i].replace(/^\s*>\s?/, "")); i++;
        }
        html += "<blockquote>" + md(buf.join("\n")) + "</blockquote>";
        continue;
      }

      /* unordered list */
      if (/^\s*[-*]\s+/.test(line)) {
        const buf = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          buf.push(lines[i].replace(/^\s*[-*]\s+/, "")); i++;
        }
        html += "<ul>" + buf.map(b => "<li>" + inline(b) + "</li>").join("") + "</ul>";
        continue;
      }

      /* ordered list */
      if (/^\s*\d+\.\s+/.test(line)) {
        const buf = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          buf.push(lines[i].replace(/^\s*\d+\.\s+/, "")); i++;
        }
        html += "<ol>" + buf.map(b => "<li>" + inline(b) + "</li>").join("") + "</ol>";
        continue;
      }

      /* blank */
      if (/^\s*$/.test(line)) { i++; continue; }

      /* paragraph — gather until a blank line or a block starter */
      const buf = [];
      while (i < lines.length && !/^\s*$/.test(lines[i]) &&
             !/^\s*```/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i]) &&
             !/^\s*\d+\.\s+/.test(lines[i]) && !/^\s*>\s?/.test(lines[i]) &&
             !/^#{1,4}\s+/.test(lines[i]) && !isTableRow(lines[i])) {
        buf.push(lines[i]); i++;
      }
      html += "<p>" + inline(buf.join(" ")) + "</p>";
    }
    return html;
  }

  /* ------------------------------------------------------------- diagrams */

  function node(n) {
    return '<div class="dg-node tone-' + esc(n.tone || "a") + '">' +
             '<div class="dg-label">' + inline(n.label || "") + "</div>" +
             (n.sub ? '<div class="dg-sub">' + inline(n.sub) + "</div>" : "") +
           "</div>";
  }

  function diagram(d) {
    if (!d) return "";
    let inner = "";

    if (d.kind === "flow" && d.dir === "right") {
      inner = '<div class="dg-flow-right">' +
        (d.nodes || []).map((n, idx) =>
          (idx ? '<div class="dg-arrow-h">&rarr;</div>' : "") + node(n)
        ).join("") + "</div>";

    } else if (d.kind === "flow") {
      inner = '<div class="dg-flow-down">' +
        (d.nodes || []).map((n, idx) =>
          (idx ? '<div class="dg-arrow-v">&darr;</div>' : "") + node(n)
        ).join("") + "</div>";

    } else if (d.kind === "columns") {
      inner = '<div class="dg-cols">' +
        (d.cols || []).map(c =>
          '<div class="dg-col tone-' + esc(c.tone || "a") + '">' +
            '<div class="dg-col-head">' + inline(c.title || "") + "</div>" +
            "<ul>" + (c.items || []).map(x => "<li>" + inline(x) + "</li>").join("") + "</ul>" +
          "</div>"
        ).join("") + "</div>";

    } else if (d.kind === "split") {
      inner = '<div class="dg-split">' +
        '<div class="dg-split-head">' + node(Object.assign({ tone: "b" }, d.head || {})) + "</div>" +
        '<div class="dg-split-stem">&darr;</div>' +
        '<div class="dg-branches">' +
          (d.branches || []).map(b =>
            '<div class="dg-branch">' +
              (b.when ? '<div class="dg-when">' + inline(b.when) + "</div>" : "") +
              node({ label: b.label, sub: b.sub, tone: b.tone }) +
            "</div>"
          ).join("") +
        "</div></div>";

    } else if (d.kind === "layers") {
      inner = '<div class="dg-layers">' + (d.layers || []).map(node).join("") + "</div>";

    } else {
      inner = '<div class="dg-flow-down">' + (d.nodes || []).map(node).join("") + "</div>";
    }

    return '<div class="diagram">' + inner +
           (d.caption ? '<div class="diagram-cap">' + inline(d.caption) + "</div>" : "") +
           "</div>";
  }

  /* ------------------------------------------------------------- fragments */

  function codeExample(ex, idx) {
    if (!ex) return "";
    return '<div class="example">' +
      '<div class="example-head">' +
        '<span class="lang">' + esc(ex.lang || "text") + "</span>" +
        '<span class="example-cap">' + inline(ex.caption || "") + "</span>" +
        '<button class="copy-btn" data-copy="' + idx + '">Copy</button>' +
      "</div>" +
      "<pre><code id=\"code-" + idx + "\">" + esc(ex.code || "") + "</code></pre>" +
      (ex.note ? '<div class="example-note"><strong>Note</strong> &mdash; ' + inline(ex.note) + "</div>" : "") +
    "</div>";
  }

  function mistakeBox(m) {
    if (!m) return "";
    return '<div class="mistake">' +
      '<div class="mistake-head"><span>&#9888;</span><span>' + inline(m.title || "Common mistake") + "</span></div>" +
      '<div class="mistake-body">' +
        (m.symptom ? '<div class="mistake-row"><div class="mistake-key">Symptom</div><div class="mistake-val">' + inline(m.symptom) + "</div></div>" : "") +
        (m.cause   ? '<div class="mistake-row"><div class="mistake-key">Cause</div><div class="mistake-val">' + inline(m.cause) + "</div></div>" : "") +
        (m.fix     ? '<div class="mistake-row fix"><div class="mistake-key">Fix</div><div class="mistake-val">' + inline(m.fix) + "</div></div>" : "") +
      "</div></div>";
  }

  function jargonBox(list) {
    if (!list || !list.length) return "";
    return '<div class="jargon">' +
      '<div class="jargon-head">Jargon, in plain English</div>' +
      list.map(j =>
        '<div class="jargon-item">' +
          '<div class="jargon-term">' + inline(j.term) + "</div>" +
          '<div class="jargon-def">' + inline(j.plain) + "</div>" +
        "</div>"
      ).join("") + "</div>";
  }

  function sections(list) {
    if (!list || !list.length) return "";
    return list.map((s, i) =>
      '<div class="sec' + (s.open ? " open" : "") + '" data-sec="' + i + '">' +
        '<button class="sec-head" data-sec-toggle="' + i + '">' +
          "<span>" + inline(s.title) + "</span>" +
          '<span class="sec-chev">&#9654;</span>' +
        "</button>" +
        '<div class="sec-body">' + md(s.body) + "</div>" +
      "</div>"
    ).join("");
  }

  function blockTitle(t) {
    return '<div class="block-title">' + esc(t) + "</div>";
  }

  return { esc, inline, md, diagram, codeExample, mistakeBox, jargonBox, sections, blockTitle };
})();
