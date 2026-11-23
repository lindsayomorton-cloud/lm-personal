/* ============ "Ask my résumé": answers only from Lindsay's real profile ============ */
(function () {

  var turns = [], ctl = null, docMd = "";

  // Calls the site's own /api/ask function and streams the answer back as plain text.
  function sample(payload, opts) {
    var acc = "";
    return fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload), signal: opts.signal })
      .then(function (res) {
        if (!res.ok || !res.body) return res.text().then(function () { throw { code: res.status === 503 ? "unavailable" : "error", text: acc }; });
        var reader = res.body.getReader(), dec = new TextDecoder();
        function pump() {
          return reader.read().then(function (r) {
            if (r.done) return { text: acc };
            acc += dec.decode(r.value, { stream: true }); opts.onText({ text: acc });
            return pump();
          });
        }
        return pump();
      })
      .catch(function (e) {
        if (e && e.name === "AbortError") throw { code: "cancelled", text: acc };
        if (e && e.code) throw e;
        throw { code: "error", text: acc };
      });
  }

  function errCopy(e) {
    var c = e && e.code;
    if (c === "unavailable") return "The assistant is taking a break right now. You can still download the résumé or reach Lindsay on LinkedIn.";
    if (c === "cancelled") return "";
    return "Something went wrong reaching the assistant. Try again in a moment.";
  }
  function esc(s) { return s.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  function inline(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>"); }
  function md(src) {
    var out = [], inList = false;
    src.split(/\r?\n/).forEach(function (line) {
      var m;
      if (/^\s*[-*•]\s+/.test(line)) { if (!inList) { out.push("<ul>"); inList = true; } out.push("<li>" + inline(line.replace(/^\s*[-*•]\s+/, "")) + "</li>"); return; }
      if (inList) { out.push("</ul>"); inList = false; }
      if ((m = line.match(/^(#{1,3})\s+(.*)/))) { out.push("<h" + m[1].length + ">" + inline(m[2]) + "</h" + m[1].length + ">"); return; }
      if (line.trim()) out.push("<p>" + inline(line) + "</p>");
    });
    if (inList) out.push("</ul>");
    return out.join("");
  }

  /* called each time the About room opens (its contents are rebuilt then) */
  window.wireResumeBot = function () {
    var $ = function (id) { return document.getElementById(id); };
    var chat = $("chat"), doc = $("doc"); if (!chat) return;

    function showTab(ask) { $("tabAsk").setAttribute("aria-selected", ask); $("tabFit").setAttribute("aria-selected", !ask); $("paneAsk").hidden = !ask; $("paneFit").hidden = ask; }
    $("tabAsk").onclick = function () { showTab(true); }; $("tabFit").onclick = function () { showTab(false); };

    function bubble(cls, t) { var d = document.createElement("div"); d.className = "msg " + cls; d.textContent = t; chat.appendChild(d); chat.scrollTop = chat.scrollHeight; return d; }
    function ask(q) {
      q = (q || "").trim(); if (!q) return;
      $("askInput").value = ""; $("askBtn").disabled = true;
      bubble("you", q); var b = bubble("them wait", "Thinking…");
      turns.push({ role: "user", content: q });
      sample({ mode: "ask", turns: turns.slice(-8) }, { onText: function (o) { b.classList.remove("wait"); b.textContent = o.text; chat.scrollTop = chat.scrollHeight; } })
        .then(function (r) { b.classList.remove("wait"); b.textContent = r.text; turns.push({ role: "assistant", content: r.text }); })
        .catch(function (e) { turns.pop(); b.classList.remove("wait"); b.textContent = (e && e.text) || errCopy(e) || "Stopped."; })
        .then(function () { $("askBtn").disabled = false; });
    }
    $("askForm").onsubmit = function (ev) { ev.preventDefault(); ask($("askInput").value); };
    [].forEach.call(document.querySelectorAll(".qchip"), function (c) { c.onclick = function () { ask(c.textContent); }; });

    $("fitStop").onclick = function () { if (ctl) ctl.abort(); };
    $("fitForm").onsubmit = function (ev) {
      ev.preventDefault();
      var role = $("fitInput").value.trim(); if (!role) return;
      ctl = new AbortController();
      $("fitBtn").disabled = true; $("fitStop").hidden = false; $("docActions").hidden = true;
      doc.hidden = false; doc.innerHTML = "<p><em>Reading the role and building a tailored version… this can take up to a minute.</em></p>";
      sample({ mode: "fit", role: role.slice(0, 12000) }, { signal: ctl.signal, onText: function (o) { doc.innerHTML = md(o.text); } })
        .then(function (r) { docMd = r.text; doc.innerHTML = md(r.text); $("docActions").hidden = false; })
        .catch(function (e) { var keep = e && e.text; doc.innerHTML = keep ? md(keep) : ""; var msg = errCopy(e); if (msg) doc.innerHTML += "<p><em>" + esc(msg) + "</em></p>"; if (!keep && !msg) doc.hidden = true; })
        .then(function () { $("fitBtn").disabled = false; $("fitStop").hidden = true; });
    };
    $("docCopy").onclick = function () {
      var btn = this;
      function sel() { var r = document.createRange(); r.selectNodeContents(doc); var s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = "Selected, press copy"; }
      try { navigator.clipboard.writeText(docMd).then(function () { btn.textContent = "Copied"; setTimeout(function () { btn.textContent = "Copy text"; }, 1500); }, sel); } catch (x) { sel(); }
    };
    $("docSave").onclick = function () {
      if (!docMd) return;
      var url = URL.createObjectURL(new Blob([docMd], { type: "text/markdown;charset=utf-8" }));
      var a = document.createElement("a"); a.href = url; a.download = "Lindsay_Morton_Tailored_Resume.md";
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    };
  };
})();
