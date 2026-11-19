/* ============ "Ask my résumé": answers only from Lindsay's real profile ============ */
(function () {
  var PROFILE = [
    "LINDSAY MORTON — Marketing executive. Birmingham, Alabama. LinkedIn: linkedin.com/in/lindsayoneal.",
    "15+ years building brands, launching products and accelerating growth across B2B technology, AI, SaaS, healthcare technology and consumer businesses. Former Chief Growth Officer and VP of Marketing.",
    "",
    "EXPERIENCE (newest first)",
    "KLAAR — Vice President of Marketing (2026). AI-enabled predictive performance management software. Led brand narrative, website, product positioning, demand generation, digital growth and go-to-market planning for an emerging software category. Rebranded the company and launched its AI within one month. Directed a refreshed website and market narrative; aligned product, commercial and event marketing.",
    "VIVUN — Director of Demand Generation & GTM Engineering (2024–2026). AI software and sales technology. Led positioning and launch marketing for an AI sales agent (narrative, competitive differentiation, digital campaigns, content, sales enablement). Delivered 4x top-of-funnel growth in under six months and 10x organic traffic through integrated campaigns, website restructuring, SEO and conversion optimization. Managed $3M in paid media and $1.5M in events and executive-engagement programs. Built marketing operations, attribution and reporting. Partnered with Sales and BDR leaders on target accounts, lead quality, qualification and pipeline reviews. Applied AI workflows to research, campaign development, content, targeting and analytics.",
    "TRAK CAPITAL / HRLOGICS / ONCENTIVE — VP of Growth Marketing, then Chief Growth Officer (2021–2024). Private-equity-backed portfolio of B2B technology, HR, finance and compliance businesses. Built marketing programs across five B2B platforms and generated $20M in inbound sales pipeline in the first year (thought leadership, webinars, events, content, lifecycle marketing). Developed partner and referral channels that reached 50% of revenue while reducing customer acquisition cost 50%. Led brand repositioning and go-to-market integration of acquired companies. Partnered on pricing and packaging improvements associated with 30% growth in existing-customer revenue. Helped build OnCentive's growth engine as revenue scaled from launch to $23M and later $55M. Managed a $5M growth budget and improved marketing ROI 50%. Built and led a six-person team plus agency partners; managed BDR alignment; presented to executives and investors.",
    "INDEPENDENT — Fractional CMO and consulting (2019–2020). Growth, customer engagement and communications programs.",
    "PASSPORT — Vice President of Marketing, Digital Growth (2013–2019). Consumer business with digital and physical customer channels. Built the digital acquisition engine; led brand and website modernization; contributed to 5x sales growth and 7x website traffic growth. Established paid search, SEO, lifecycle marketing, testing and customer research programs.",
    "SUCCESSEHS — Product Marketing Specialist (2011–2013). Healthcare technology (EHR), later acquired by Greenway Health. Positioning, competitive intelligence, sales enablement and buyer education; buyer personas increased campaign engagement 40%. National conference programs doubled booth traffic and generated 300+ qualified leads.",
    "Earlier: agency marketing, technology publishing and editorial production.",
    "",
    "EXPERTISE: brand strategy and positioning; category creation; integrated marketing; demand generation; ABM and targeted campaigns; product marketing and launches; revenue and pipeline growth; digital, SEO/AEO and paid media; marketing operations and attribution; AI-enabled marketing; partnerships, channels and referral programs; events and field marketing; executive and investor communications; team and agency leadership; budget, CAC and ROI ownership; pricing and packaging collaboration.",
    "APPROXIMATE YEARS BY AREA: brand and positioning 12+; demand generation 11+; HubSpot and marketing operations 10+; VP-level and executive leadership 10; lifecycle and email 9; SEO and website 9; product marketing 8; paid media 8; events and field marketing 7; partnerships and channels 3 (Trak, where partner channels reached 50% of revenue); AI-enabled marketing about 3.",
    "TOOLS: HubSpot (10+ years hands-on administration: workflows, lead scoring, automation, attribution, sales handoffs), Salesforce, GA4, paid search and social, CRM and lifecycle automation, dashboards, experimentation, AI-assisted marketing workflows.",
    "NOW BUILDING: Pollinate, helping ideas that deserve to spread. Also LumiLumber: recycled-plastic building materials (boards, panels, playground rock walls) with glow-in-the-dark and color-shifting finishes; seeking manufacturers, recycled-plastic suppliers and pilot customers.",
    "WHAT'S NEXT / INTERESTS: alternative coolants for AI data centers; sustainability technology; sustainable manufacturing, recycled materials, additive manufacturing and 3D printing, and new possibilities for American manufacturing; eco and solarpunk ideas about a greener, more hopeful future."
  ].join("\n");

  var ASK_RULES = "You are the assistant on Lindsay Morton's personal website. Recruiters and hiring managers ask you about her experience.\n" +
    "Rules: Use ONLY the profile below. Never invent employers, titles, dates, numbers, tools or skills. If the profile doesn't cover something, say so plainly and suggest reaching Lindsay on LinkedIn. Refer to her as Lindsay or she. Be warm, specific and brief: under 120 words unless asked for more. Plain text; short dash bullets are fine; no markdown headings. If asked something unrelated to Lindsay's professional background, gently steer back.\n\nPROFILE\n" + PROFILE;

  var FIT_RULES = "Write a one-page résumé for Lindsay Morton tailored to the role below, using ONLY facts from her profile. Reorder and reword to emphasize what this role values, but never add or change employers, titles, dates or numbers, and never claim a skill or experience the profile doesn't support. Keep every metric exactly as written.\n" +
    "Output Markdown only, in this shape:\n# Lindsay Morton\nOne line: a headline title fitted to the role · Birmingham, AL · linkedin.com/in/lindsayoneal\n## Summary\n3 sentences.\n## Most relevant results\n4–6 bullets.\n## Experience\nFor each role, newest first: ### COMPANY — Title (years), then 2–3 bullets.\n## Skills\nOne line of the most relevant skills, separated by ' · '.\n## Why Lindsay fits this role\n3 bullets, each linking a requirement of the role to specific evidence from her profile.\nNo commentary before or after the résumé.\n\nPROFILE\n" + PROFILE;

  var sample = null, ready = false, turns = [], ctl = null, docMd = "";
  if (window.claude && claude.use) {
    claude.use("downloads").then(function (d) { window.__downloads = d; });
    claude.use("sample").then(function (s) { sample = s; ready = true; });
  } else ready = true;

  function errCopy(e) {
    var c = e && e.code;
    if (c === "not_granted") return "The assistant needs your OK to run. Reload the page if you'd like to try again.";
    if (c === "rate_limited" || c === "queue_overflow") return "Lots of questions at once. Give it a few seconds and try again.";
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
    function offline() { $("botOff").hidden = false; [].forEach.call(document.querySelectorAll("#bot .bot-tabs,#bot .bot-pane,#bot .fine"), function (el) { el.hidden = true; }); }
    if (ready && !sample) offline();
    if (!window.__downloads) $("docSave").hidden = true;

    function showTab(ask) { $("tabAsk").setAttribute("aria-selected", ask); $("tabFit").setAttribute("aria-selected", !ask); $("paneAsk").hidden = !ask; $("paneFit").hidden = ask; }
    $("tabAsk").onclick = function () { showTab(true); }; $("tabFit").onclick = function () { showTab(false); };

    function bubble(cls, t) { var d = document.createElement("div"); d.className = "msg " + cls; d.textContent = t; chat.appendChild(d); chat.scrollTop = chat.scrollHeight; return d; }
    function ask(q) {
      q = (q || "").trim(); if (!q || !sample) return;
      $("askInput").value = ""; $("askBtn").disabled = true;
      bubble("you", q); var b = bubble("them wait", "Thinking…");
      turns.push({ role: "user", content: q });
      var input = [{ role: "user", content: ASK_RULES }, { role: "assistant", content: "Understood. I'll answer only from Lindsay's profile." }].concat(turns.slice(-8));
      sample(input, { cache: false, modelTier: "quick", onText: function (o) { b.classList.remove("wait"); b.textContent = o.text; chat.scrollTop = chat.scrollHeight; } })
        .then(function (r) { b.classList.remove("wait"); b.textContent = r.text; turns.push({ role: "assistant", content: r.text }); })
        .catch(function (e) { turns.pop(); b.classList.remove("wait"); b.textContent = (e && e.text) || errCopy(e) || "Stopped."; })
        .then(function () { $("askBtn").disabled = false; });
    }
    $("askForm").onsubmit = function (ev) { ev.preventDefault(); ask($("askInput").value); };
    [].forEach.call(document.querySelectorAll(".qchip"), function (c) { c.onclick = function () { ask(c.textContent); }; });

    $("fitStop").onclick = function () { if (ctl) ctl.abort(); };
    $("fitForm").onsubmit = function (ev) {
      ev.preventDefault();
      var role = $("fitInput").value.trim(); if (!role || !sample) return;
      ctl = new AbortController();
      $("fitBtn").disabled = true; $("fitStop").hidden = false; $("docActions").hidden = true;
      doc.hidden = false; doc.innerHTML = "<p><em>Reading the role and building a tailored version… this can take up to a minute.</em></p>";
      sample(FIT_RULES + "\n\nROLE\n" + role.slice(0, 12000), { signal: ctl.signal, modelTier: "default", onText: function (o) { doc.innerHTML = md(o.text); } })
        .then(function (r) { docMd = r.text; doc.innerHTML = md(r.text); $("docActions").hidden = false; })
        .catch(function (e) { var keep = e && e.text; doc.innerHTML = keep ? md(keep) : ""; var msg = errCopy(e); if (msg) doc.innerHTML += "<p><em>" + esc(msg) + "</em></p>"; if (!keep && !msg) doc.hidden = true; })
        .then(function () { $("fitBtn").disabled = false; $("fitStop").hidden = true; });
    };
    $("docCopy").onclick = function () {
      var btn = this;
      function sel() { var r = document.createRange(); r.selectNodeContents(doc); var s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = "Selected, press copy"; }
      try { navigator.clipboard.writeText(docMd).then(function () { btn.textContent = "Copied"; setTimeout(function () { btn.textContent = "Copy text"; }, 1500); }, sel); } catch (x) { sel(); }
    };
    $("docSave").onclick = function () { if (window.__downloads && docMd) window.__downloads.save({ filename: "Lindsay_Morton_Tailored_Resume.md", data: docMd }).catch(function () {}); };
  };
})();
