/* ===== Rainbow Solitaire: cards, table, play, hints, rescue shuffle, saving ===== */
(function () {
  var host = document.getElementById("solitaire"); if (!host || typeof SOL === "undefined") return;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SUITS = ["hearts", "diamonds", "clubs", "spades"], SUITCH = ["h", "d", "c", "s"], RANKS = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  var RANKNAME = ["", "Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Jack", "Queen", "King"];
  /* rank color families: black suits take the deeper shade, red suits the lighter one */
  var FACE = [null, ["#D81783", "#EC3295"], ["#ED477C", "#F06C9A"], ["#F25B55", "#FF7773"], ["#F57C24", "#FF963E"], ["#F9AC24", "#FFC24D"], ["#F6D53D", "#FFE46B"],
    ["#C5D72A", "#D7E650"], ["#84BE38", "#A2D65A"], ["#32A86D", "#54C68A"], ["#17A8AC", "#51C8C2"], ["#268FCB", "#6ABAE6"], ["#7654BA", "#A17BD7"], ["#A1259E", "#C94BBC"]];
  var MODES = { easy: { label: "Easy", draw: 1, rescues: Infinity, mult: 1 }, medium: { label: "Medium", draw: 1, rescues: 3, mult: 1.5 }, expert: { label: "Expert", draw: 3, rescues: 1, mult: 2 } };
  var KEY = "lm-solitaire-v1";

  /* ---------- the card artwork, built from data as SVG ---------- */
  var PIP = {
    h: '<path d="M10 18.2C10 18.2 1 12.3 1 6.6 1 3.6 3.4 1.6 6 1.6 7.9 1.6 9.3 2.8 10 4.2 10.7 2.8 12.1 1.6 14 1.6 16.6 1.6 19 3.6 19 6.6 19 12.3 10 18.2 10 18.2Z"/>',
    d: '<path d="M10 .8 18.2 10 10 19.2 1.8 10Z"/>',
    s: '<path d="M10 1C10 1 2 7.4 2 11.9 2 14.5 4 16.2 6.3 16.2 7.6 16.2 8.7 15.6 9.3 14.7 9 16.5 8.2 17.9 7 19H13C11.8 17.9 11 16.5 10.7 14.7 11.3 15.6 12.4 16.2 13.7 16.2 16 16.2 18 14.5 18 11.9 18 7.4 10 1 10 1Z"/>',
    c: '<circle cx="10" cy="5.4" r="4.1"/><circle cx="5.1" cy="11.4" r="4.1"/><circle cx="14.9" cy="11.4" r="4.1"/><path d="M9 11.5C9 15.4 8.1 17.6 6.5 19H13.5C11.9 17.6 11 15.4 11 11.5Z"/>'
  };
  var LAYOUT = {
    2: [[50, 32], [50, 108, 1]], 3: [[50, 32], [50, 70], [50, 108, 1]],
    4: [[32, 32], [68, 32], [32, 108, 1], [68, 108, 1]], 5: [[32, 32], [68, 32], [50, 70], [32, 108, 1], [68, 108, 1]],
    6: [[32, 32], [68, 32], [32, 70], [68, 70], [32, 108, 1], [68, 108, 1]],
    7: [[32, 32], [68, 32], [50, 51], [32, 70], [68, 70], [32, 108, 1], [68, 108, 1]],
    8: [[32, 32], [68, 32], [50, 51], [32, 70], [68, 70], [50, 89, 1], [32, 108, 1], [68, 108, 1]],
    9: [[32, 32], [68, 32], [32, 57], [68, 57], [50, 70], [32, 83, 1], [68, 83, 1], [32, 108, 1], [68, 108, 1]],
    10: [[32, 32], [68, 32], [50, 44.5], [32, 57], [68, 57], [32, 83, 1], [68, 83, 1], [50, 95.5, 1], [32, 108, 1], [68, 108, 1]]
  };
  function pip(s, x, y, size, flip) {
    var k = size / 20;
    return '<g transform="translate(' + x + ' ' + y + ')' + (flip ? " rotate(180)" : "") + ' scale(' + k + ') translate(-10 -10)">' + PIP[s] + "</g>";
  }
  function faceSVG(c) {
    /* red suits (hearts, diamonds) sit on white with pink ink; black suits (clubs, spades) sit on lavender with dark ink,
       so the two colors are obvious at a glance. A thin rainbow rank stripe keeps the whimsy. */
    var r = SOL.rank(c), s = SUITCH[SOL.suit(c)], isRed = SOL.red(c), bg = isRed ? "#ffffff" : "#d9cdf7", R = RANKS[r];
    var ink = isRed ? "#e0215f" : "#1d1633", stripe = FACE[r][0];
    var corner = '<text x="9" y="22" font-size="' + (R.length > 1 ? 17 : 20) + '" font-weight="800" letter-spacing="-1">' + R + "</text>" + pip(s, 15, 33, 11);
    var mid = "";
    if (r === 1) mid = pip(s, 50, 70, 46);
    else if (r <= 10) mid = LAYOUT[r].map(function (p) { return pip(s, p[0], p[1], 17, p[2]); }).join("");
    else {
      /* J, Q, K: a bold geometric emblem built from the suit, not a portrait */
      var deco = r === 13 ? '<path d="M33 52 39 40 45 50 50 36 55 50 61 40 67 52Z" opacity=".9"/>' : r === 12 ? '<circle cx="38" cy="45" r="3.4"/><circle cx="50" cy="40" r="3.4"/><circle cx="62" cy="45" r="3.4"/>' : '<path d="M50 36 56 44 50 52 44 44Z"/>';
      mid = '<rect x="23" y="29" width="54" height="82" rx="8" fill="none" stroke="currentColor" stroke-width="2.4" opacity=".55"/>' + deco
        + '<text x="50" y="86" text-anchor="middle" font-size="36" font-weight="900" letter-spacing="-1">' + R + "</text>" + pip(s, 50, 99, 13);
    }
    return '<svg viewBox="0 0 100 140" aria-hidden="true" style="color:' + ink + '"><rect width="100" height="140" rx="9" fill="' + bg + '"/><rect x="3.5" y="3.5" width="93" height="133" rx="6.5" fill="none" stroke="' + stripe + '" stroke-width="2.2" opacity=".85"/><g fill="currentColor" font-family="\'Bricolage Grotesque\',\'DM Sans\',Arial,sans-serif">'
      + corner + '<g transform="rotate(180 50 70)">' + corner + "</g>" + mid + "</g></svg>";
  }
  function label(c, up) { return up === false ? "Face-down card" : RANKNAME[SOL.rank(c)] + " of " + SUITS[SOL.suit(c)] + ", " + (SOL.red(c) ? "red" : "black"); }

  /* ---------- game state ---------- */
  var overlay = null, G = null, hist = [], fut = [], els = {}, timerT = null, worker = null, reqId = 0, hintStage = 0, hintFor = -1, hintAct = null, busy = false, finishing = false;
  function blank(mode, idx) {
    var deck = SOL.decode(SOL_DEALS[mode][idx]);
    var st = SOL.deal(deck, MODES[mode].draw);
    return { mode: mode, idx: idx, deck: SOL_DEALS[mode][idx], st: st, moves: 0, secs: 0, hints: 0, rescues: 0, assisted: false, revealed: [], known: initialKnown(st), rev: 0, status: "playing", started: false };
  }
  function initialKnown(st) { var k = []; st.t.forEach(function (col) { k.push(col.c[col.c.length - 1]); }); return k; }
  function pickIdx(mode) {
    var played = load("played") || {}, list = played[mode] || [], n = SOL_DEALS[mode].length, free = [];
    for (var i = 0; i < n; i++) if (list.indexOf(i) < 0) free.push(i);
    if (!free.length) { list = []; free = Array.from({ length: n }, function (_, i) { return i; }); }
    var pick = free[Math.floor(Math.random() * free.length)];
    list.push(pick); played[mode] = list; save("played", played); return pick;
  }
  /* storage that never breaks the game (private mode, full quota, blocked) */
  function load(k) { try { var v = localStorage.getItem(KEY + ":" + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(KEY + ":" + k, JSON.stringify(v)); } catch (e) {} }
  function persist() { save("game", { G: G, hist: hist.slice(-200), fut: fut.slice(-200) }); }
  function restore() {
    var s = load("game"); if (!s || !s.G || !s.G.st || !SOL_DEALS[s.G.mode]) return false;
    try { if (SOL.count(s.G.st) !== 52) return false; var seen = {}; s.G.st.t.forEach(function (c) { c.c.forEach(function (x) { seen[x] = 1; }); }); s.G.st.s.concat(s.G.st.w).forEach(function (x) { seen[x] = 1; });
      for (var i = 0; i < 4; i++) for (var r = 0; r < s.G.st.f[i]; r++) seen[i * 13 + r] = 1; if (Object.keys(seen).length !== 52) return false; } catch (e) { return false; }
    G = s.G; hist = s.hist || []; fut = s.fut || []; return true;
  }

  /* ---------- build the table ---------- */
  var root, board, bar, live, statMoves, statTime, statScore, btn = {}, pileEls = {};
  function build() {
    overlay = document.createElement("div"); overlay.className = "sol-overlay"; overlay.setAttribute("role", "dialog"); overlay.setAttribute("aria-modal", "true"); overlay.setAttribute("aria-label", "Solitaire");
    document.body.appendChild(overlay);
    overlay.innerHTML = '<div class="sol-table"><div class="sol-board" aria-label="Solitaire table"></div><p class="sol-live" aria-live="polite"></p><div class="sol-bar" role="toolbar" aria-label="Solitaire controls">'
      + '<div class="sol-modes" role="radiogroup" aria-label="Difficulty">' + Object.keys(MODES).map(function (m) { return '<button type="button" role="radio" data-mode="' + m + '">' + MODES[m].label + "</button>"; }).join("") + "</div>"
      + '<div class="sol-acts"><button type="button" data-a="new">New game</button><button type="button" data-a="restart">Restart</button><button type="button" data-a="undo" aria-label="Undo">↶ Undo</button><button type="button" data-a="redo" aria-label="Redo">Redo ↷</button>'
      + '<button type="button" data-a="hint">💡 Hint</button><button type="button" data-a="shuffle">🔀 Shuffle <b class="sol-left"></b></button><button type="button" data-a="finish" class="sol-finish" hidden>Finish ✨</button></div>'
      + '<div class="sol-win-ctl"><button type="button" class="sol-fs" aria-label="Full screen">⛶ Full screen</button><button type="button" class="sol-x" aria-label="Close solitaire">✕ Close</button></div>'
      + '<div class="sol-stats"><span>Moves <b data-s="moves">0</b></span><span>Time <b data-s="time">0:00</b></span><span>Score <b data-s="score">0</b></span></div></div>'
      + '</div>';
    overlay.querySelector(".sol-x").addEventListener("click", close);
    /* full screen, where the browser allows it */
    var fs = overlay.querySelector(".sol-fs"), canFS = !!(overlay.requestFullscreen || overlay.webkitRequestFullscreen) && (document.fullscreenEnabled || document.webkitFullscreenEnabled);
    if (!canFS) fs.hidden = true;
    fs.addEventListener("click", function () {
      var on = document.fullscreenElement || document.webkitFullscreenElement;
      try { if (on) (document.exitFullscreen || document.webkitExitFullscreen).call(document); else { var r = (overlay.requestFullscreen || overlay.webkitRequestFullscreen).call(overlay); if (r && r.catch) r.catch(function () { say("Your browser didn't allow full screen here."); }); } } catch (e) { say("Your browser didn't allow full screen here."); }
    });
    document.addEventListener("fullscreenchange", function () { var on = !!document.fullscreenElement; fs.textContent = on ? "⤢ Exit full screen" : "⛶ Full screen"; overlay.classList.toggle("is-fs", on); setTimeout(layout, 60); });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    root = overlay.querySelector(".sol-table"); board = overlay.querySelector(".sol-board"); live = overlay.querySelector(".sol-live");
    statMoves = overlay.querySelector('[data-s="moves"]'); statTime = overlay.querySelector('[data-s="time"]'); statScore = overlay.querySelector('[data-s="score"]');
    overlay.querySelectorAll("[data-a]").forEach(function (b) { btn[b.dataset.a] = b; b.addEventListener("click", function () { act(b.dataset.a); }); });
    overlay.querySelectorAll("[data-mode]").forEach(function (b) { b.addEventListener("click", function () { if (G.mode !== b.dataset.mode) newGame(b.dataset.mode); }); });
    /* empty-pile outlines: stock, waste, four foundations (ghosted suit), seven columns */
    function slot(cls, html) { var d = document.createElement("div"); d.className = "sol-slot " + cls; d.innerHTML = html || ""; board.appendChild(d); return d; }
    pileEls.stock = slot("stock", '<span class="sol-recycle" aria-hidden="true">↻</span>'); pileEls.stock.setAttribute("role", "button"); pileEls.stock.tabIndex = 0;
    pileEls.stock.setAttribute("aria-label", "Stock: draw cards");
    pileEls.stock.addEventListener("click", function () { act("stock"); });
    pileEls.stock.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act("stock"); } });
    pileEls.waste = slot("waste");
    pileEls.f = [0, 1, 2, 3].map(function (i) { return slot("found", '<svg viewBox="0 0 20 20" aria-hidden="true">' + PIP[SUITCH[i]] + "</svg>"); });
    pileEls.t = [0, 1, 2, 3, 4, 5, 6].map(function () { return slot("col"); });
    for (var c = 0; c < 52; c++) {
      var el = document.createElement("div"); el.className = "sol-card"; el.dataset.c = c;
      el.innerHTML = '<div class="sol-in"><div class="sol-face">' + faceSVG(c) + '</div><div class="sol-back"></div></div>';
      board.appendChild(el); els[c] = el; wireCard(el, c);
    }
    addEventListener("resize", function () { layout(); });
    if ("ResizeObserver" in window) new ResizeObserver(function () { layout(); }).observe(board);
    document.addEventListener("visibilitychange", tick);
  }

  /* ---------- where every card sits ---------- */
  var M = {};   /* measurements */
  function locate(st) {
    var loc = {};
    st.s.forEach(function (c, i) { loc[c] = { p: "s", i: i, up: false }; });
    st.w.forEach(function (c, i) { loc[c] = { p: "w", i: i, up: true }; });
    for (var f = 0; f < 4; f++) for (var r = 0; r < st.f[f]; r++) loc[f * 13 + r] = { p: "f", f: f, i: r, up: true };
    st.t.forEach(function (col, ci) { col.c.forEach(function (c, i) { loc[c] = { p: "t", col: ci, i: i, up: i >= col.d }; }); });
    return loc;
  }
  function layout(dragging) {
    if (!G) return;
    var W = board.clientWidth, Hb = board.clientHeight || 600, gap = Math.max(4, Math.min(16, W * .014)), cw = (W - gap * 8) / 7;
    /* big as the screen allows: the top row plus about three and a half cards of columns must fit the height */
    cw = Math.max(36, Math.min(cw, (Hb - gap * 4) / (1.4 * 3.9), 190)); var ch = cw * 1.4, x0 = (W - (cw * 7 + gap * 6)) / 2;
    M = { W: W, H: Hb, gap: gap, cw: cw, ch: ch, x: function (i) { return x0 + i * (cw + gap); }, top: gap, tab: gap * 2 + ch + Math.max(8, ch * .12) };
    root.style.setProperty("--cw", cw + "px");
    var st = G.st, loc = locate(st);
    /* each column squeezes its overlap if it would get very long */
    var maxTab = Math.max(ch * 2.2, Hb - (gap * 2 + ch + Math.max(8, ch * .12)) - gap), fd = ch * .13, fuBase = ch * .27, colFu = [];
    st.t.forEach(function (col, i) { var n = col.c.length, up = n - col.d, need = col.d * fd + Math.max(0, up - 1) * fuBase + ch; colFu[i] = need > maxTab && up > 1 ? Math.max(ch * .17, (maxTab - ch - col.d * fd) / (up - 1)) : fuBase; });
    var bottom = M.tab + ch;
    pileEls.stock.style.cssText = pos(M.x(0), M.top); pileEls.waste.style.cssText = pos(M.x(1), M.top);
    pileEls.stock.classList.toggle("empty", !st.s.length); pileEls.stock.classList.toggle("can-recycle", !st.s.length && st.w.length > 0);
    pileEls.f.forEach(function (e, i) { e.style.cssText = pos(M.x(3 + i), M.top); });
    pileEls.t.forEach(function (e, i) { e.style.cssText = pos(M.x(i), M.tab); });
    /* the waste always fans out its last three cards, like the classic game; only the top one can be played */
    var wn = st.w.length, fan = Math.min(3, wn);
    for (var c = 0; c < 52; c++) {
      var L = loc[c], el = els[c], x, y, z;
      if (L.p === "s") { x = M.x(0); y = M.top; z = 10 + L.i; }
      else if (L.p === "w") { var fromTop = wn - 1 - L.i; x = M.x(1) + (fromTop < fan ? (fan - 1 - fromTop) * cw * .24 : 0); y = M.top; z = 100 + L.i; }
      else if (L.p === "f") { x = M.x(3 + L.f); y = M.top; z = 200 + L.i; }
      else {
        var col = st.t[L.col], yy = M.tab; for (var k = 0; k < L.i; k++) yy += k < col.d ? fd : colFu[L.col];
        x = M.x(L.col); y = yy; z = 300 + L.i; if (y + ch > bottom) bottom = y + ch;
      }
      if (dragging && dragging.indexOf(c) >= 0) continue;
      el.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)"; el.style.zIndex = z;
      el.classList.toggle("up", L.up);
      var movable = L.up && (L.p === "t" || (L.p === "w" && L.i === wn - 1) || (L.p === "f" && L.i === st.f[L.f] - 1));
      el.tabIndex = movable ? 0 : -1; el.setAttribute("role", movable ? "button" : "img"); el.setAttribute("aria-label", label(c, L.up));
      el.classList.toggle("buried", L.p === "s" && L.i < st.s.length - 2);
    }

    paint();
  }
  function pos(x, y) { return "transform:translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0);width:" + M.cw.toFixed(1) + "px;height:" + M.ch.toFixed(1) + "px"; }

  /* ---------- toolbar, stats, score ---------- */
  function score() {
    var f = G.st.f[0] + G.st.f[1] + G.st.f[2] + G.st.f[3];
    var s = f * 10 + Math.min(21, G.revealed.length) * 5 - G.hints * 5 - G.rescues * 25 + (G.status === "won" ? 500 : 0);
    return Math.max(0, Math.round(s * MODES[G.mode].mult));
  }
  function fmt(t) { return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); }
  function paint() {
    statMoves.textContent = G.moves; statTime.textContent = fmt(G.secs); statScore.textContent = score();
    overlay.querySelectorAll("[data-mode]").forEach(function (b) { b.setAttribute("aria-checked", b.dataset.mode === G.mode); });
    btn.undo.disabled = !hist.length; btn.redo.disabled = !fut.length;
    var left = MODES[G.mode].rescues - G.rescues;
    btn.shuffle.querySelector(".sol-left").textContent = left === Infinity ? "" : "(" + Math.max(0, left) + ")";
    btn.shuffle.disabled = left <= 0 || G.status === "won";
    btn.finish.hidden = !(G.status === "playing" && canFinish());
  }
  function say(t) { live.textContent = ""; setTimeout(function () { live.textContent = t; }, 30); }
  function tick() {
    clearInterval(timerT);
    if (!G || G.status !== "playing" || !G.started || document.hidden) return;
    timerT = setInterval(function () { G.secs++; statTime.textContent = fmt(G.secs); if (G.secs % 10 === 0) persist(); }, 1000);
  }

  /* ---------- every change goes through here ---------- */
  function commit(a, opts) {
    opts = opts || {};
    var nx = SOL.apply(G.st, a); if (!nx) return false;
    hist.push(snap()); fut = [];
    var before = G.st; G.st = nx; G.moves++; G.rev++; hintStage = 0; clearHint();
    learn(before, nx);
    if (!G.started) { G.started = true; tick(); }
    if (SOL.won(nx)) win();
    layout(); persist(); return true;
  }
  /* remember every card ever seen face up (kept across undo, so peeking can't be erased) */
  function learn(a, b) {
    var loc = locate(b);
    for (var c = 0; c < 52; c++) if (loc[c].up && G.known.indexOf(c) < 0) {
      G.known.push(c);
      if (loc[c].p === "t") { var wasTab = locate(a)[c]; if (wasTab.p === "t" && !wasTab.up && G.revealed.indexOf(c) < 0) G.revealed.push(c); }
    }
  }
  function snap() { return { st: G.st, moves: G.moves, status: G.status }; }
  function act(a) {
    if (busy || finishing) return;
    if (a === "new") return newGame(G.mode);
    if (a === "restart") { var keep = { known: G.known, revealed: G.revealed, hints: G.hints, rescues: G.rescues, assisted: G.assisted }; G = blank(G.mode, G.idx); Object.assign(G, keep); hist = []; fut = []; clearHint(); layout(); persist(); tick(); say("Restarted the same deal."); return; }
    if (a === "undo") { if (!hist.length) return; fut.push(snap()); var h = hist.pop(); G.st = h.st; G.moves = h.moves; G.status = h.status; G.rev++; clearHint(); layout(); persist(); say("Undone."); return; }
    if (a === "redo") { if (!fut.length) return; hist.push(snap()); var r = fut.pop(); G.st = r.st; G.moves = r.moves; G.status = r.status; G.rev++; clearHint(); learn(G.st, G.st); layout(); persist(); say("Redone."); return; }
    if (a === "stock") { if (G.status !== "playing") return; if (G.st.s.length) commit({ k: "draw" }); else if (G.st.w.length) { commit({ k: "recycle" }); say("Turned the waste back over."); } return; }
    if (a === "hint") return hint();
    if (a === "shuffle") return rescue();
    if (a === "finish") return finish();
  }
  function newGame(mode) {
    clearHint(); G = blank(mode, pickIdx(mode)); hist = []; fut = []; clearInterval(timerT);
    layout(); persist(); dealIn(); say("New " + MODES[mode].label + " game. Every deal here has a verified win.");
  }
  /* cards fly out from the stock when a deal starts */
  function dealIn() {
    if (reduce) return;
    var order = [], st = G.st; st.t.forEach(function (col) { col.c.forEach(function (c) { order.push(c); }); });
    order.forEach(function (c, i) {
      var el = els[c], to = el.style.transform; el.style.transition = "none"; el.style.transform = "translate3d(" + M.x(0) + "px," + M.top + "px,0)";
      requestAnimationFrame(function () { setTimeout(function () { el.style.transition = ""; el.style.transform = to; }, 20 + i * 28); });
    });
  }

  /* ---------- picking cards up: drag, tap and keyboard all use the same moves ---------- */
  function sourceOf(c) {
    var L = locate(G.st)[c]; if (!L.up) return null;
    if (L.p === "t") return { from: { p: "t", i: L.col }, n: G.st.t[L.col].c.length - L.i, cards: G.st.t[L.col].c.slice(L.i) };
    if (L.p === "w" && L.i === G.st.w.length - 1) return { from: { p: "w" }, n: 1, cards: [c] };
    if (L.p === "f" && L.i === G.st.f[L.f] - 1) return { from: { p: "f", i: L.f }, n: 1, cards: [c] };
    return null;
  }
  function smart(c) {
    var src = sourceOf(c); if (!src || G.status !== "playing") return false;
    if (src.n === 1 && src.from.p !== "f" && commit({ k: "mv", from: src.from, to: { p: "f", i: SOL.suit(c) }, n: 1 })) return true;
    var order = [], i;
    for (i = 0; i < 7; i++) if (G.st.t[i].c.length) order.push(i);
    for (i = 0; i < 7; i++) if (!G.st.t[i].c.length && !(src.from.p === "t" && G.st.t[src.from.i].c.length === src.n && G.st.t[src.from.i].d === 0)) order.push(i);
    for (i = 0; i < order.length; i++) if (commit({ k: "mv", from: src.from, to: { p: "t", i: order[i] }, n: src.n })) return true;
    nope(src.cards); return false;
  }
  function nope(cards) { if (reduce) return; cards.forEach(function (c) { els[c].classList.remove("shake"); void els[c].offsetWidth; els[c].classList.add("shake"); }); }
  function wireCard(el, c) {
    var down = null;
    el.addEventListener("pointerdown", function (e) {
      if (busy || finishing || !G || G.status !== "playing" || e.button > 0) return;
      var L = locate(G.st)[c];
      if (L.p === "s") { act("stock"); return; }
      var src = sourceOf(c); if (!src) return;
      down = { x: e.clientX, y: e.clientY, src: src, drag: false, base: src.cards.map(function (k) { return parse(els[k].style.transform); }) };
      try { el.setPointerCapture(e.pointerId); } catch (er) {}
    });
    el.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!down.drag && Math.abs(dx) + Math.abs(dy) < 7) return;
      if (!down.drag) { down.drag = true; down.src.cards.forEach(function (k, i) { els[k].classList.add("dragging"); els[k].style.zIndex = 900 + i; }); clearHint(); }
      down.src.cards.forEach(function (k, i) { els[k].style.transform = "translate3d(" + (down.base[i][0] + dx) + "px," + (down.base[i][1] + dy) + "px,0)"; });
    });
    function up(e) {
      if (!down) return; var d = down; down = null;
      d.src.cards.forEach(function (k) { els[k].classList.remove("dragging"); });
      if (!d.drag) { smart(c); return; }
      var to = dropTarget(d.base[0][0] + e.clientX - d.x + M.cw / 2, d.base[0][1] + e.clientY - d.y + M.ch / 2);
      if (!to || !commit({ k: "mv", from: d.src.from, to: to, n: d.src.n })) layout();
    }
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", function () { if (down) { down = null; layout(); } });
    el.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && el.tabIndex === 0) { e.preventDefault(); smart(c); } });
  }
  function parse(t) { var m = /translate3d\(([-\d.]+)px,\s*([-\d.]+)px/.exec(t || ""); return m ? [+m[1], +m[2]] : [0, 0]; }
  /* which pile is under the dragged card's center */
  function dropTarget(x, y) {
    if (y < M.tab - M.gap) { for (var f = 0; f < 4; f++) if (x >= M.x(3 + f) - M.gap / 2 && x <= M.x(3 + f) + M.cw + M.gap / 2) return { p: "f", i: f }; return null; }
    for (var i = 0; i < 7; i++) if (x >= M.x(i) - M.gap / 2 && x <= M.x(i) + M.cw + M.gap / 2) return { p: "t", i: i };
    return null;
  }

  /* ---------- hints: the solver first (in the background), then plain good sense ---------- */
  function getWorker() {
    if (worker !== null) return worker;
    try {
      var src = "var SOL=(" + SOL_FACTORY.toString() + ")();onmessage=function(e){var d=e.data,r;"
        + "if(d.kind==='solve'){r=SOL.solve(d.st,{nodes:d.nodes,ms:d.ms});}"
        + "else{r=null;var rnd=SOL.rng(d.seed);for(var t=0;t<d.tries&&!r;t++){var cand=perm(d.st,d.known,rnd);if(!cand)break;var s=SOL.solve(cand,{nodes:d.nodes,ms:d.ms});if(s.status==='solved'&&SOL.replay(SOL.clone(cand),s.actions))r={st:cand,actions:s.actions};}}"
        + "postMessage({id:d.id,r:r});};"
        + "function perm(st,known,rnd){var c=SOL.clone(st),slots=[],cards=[];c.s.forEach(function(x,i){if(known.indexOf(x)<0){slots.push(['s',i]);cards.push(x);}});"
        + "c.t.forEach(function(col,ci){for(var i=0;i<col.d;i++)if(known.indexOf(col.c[i])<0){slots.push(['t',ci,i]);cards.push(col.c[i]);}});"
        + "if(cards.length<2)return null;var sh=SOL.shuffle(cards,rnd);if(sh.join()===cards.join())sh=SOL.shuffle(cards,rnd);"
        + "slots.forEach(function(p,k){if(p[0]==='s')c.s[p[1]]=sh[k];else c.t[p[1]].c[p[2]]=sh[k];});return c;}";
      worker = new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })));
    } catch (e) { worker = false; }
    return worker;
  }
  function ask(msg, cb, fallback) {
    var w = getWorker(), id = ++reqId, rev = G.rev, done = false;
    msg.id = id;
    function finish(r) { if (done) return; done = true; if (id !== reqId || rev !== G.rev) return; cb(r); }
    if (w) {
      var on = function (e) { if (e.data.id === id) { w.removeEventListener("message", on); finish(e.data.r); } };
      w.addEventListener("message", on); w.onerror = function () { worker = false; finish(fallback()); };
      w.postMessage(msg); setTimeout(function () { if (!done) { w.removeEventListener("message", on); finish(null); } }, (msg.ms || 2000) * (msg.tries || 1) + 1500);
    } else setTimeout(function () { finish(fallback()); }, 10);
  }
  function hint() {
    if (G.status !== "playing") return;
    if (hintAct && hintFor === G.rev) {
      hintStage++;
      if (hintStage === 2) { showHint(hintAct, true); return; }
      var a = hintAct; clearHint(); if (a.k === "mv") commit(a); else act("stock"); return;
    }
    if (hintFor !== G.rev) { G.hints++; hintFor = G.rev; }
    busy = true; btn.hint.classList.add("thinking"); say("Thinking…");
    ask({ kind: "solve", st: G.st, nodes: 60000, ms: 1800 }, function (r) {
      busy = false; btn.hint.classList.remove("thinking");
      var a = r && r.status === "solved" && r.actions.length ? r.actions[0] : null, why = a ? reason(a, true) : "";
      if (!a) { a = heuristic(); why = a ? reason(a, false) : ""; }
      if (!a) { say("No helpful move found yet. Try Undo, Shuffle, or Restart."); paint(); return; }
      hintAct = a; hintStage = 1; showHint(a, false); say(why + " (Tap Hint again for more.)"); paint();
    }, function () { var s = SOL.solve(G.st, { nodes: 12000, ms: 400 }); return s; });
  }
  function heuristic() {
    var st = G.st, best = null, bs = -1;
    SOL.legal(st).forEach(function (a) {
      var s = 0;
      if (a.k === "draw" || a.k === "recycle") s = 20;
      else if (a.to.p === "f") { var c = a.from.p === "w" ? st.w[st.w.length - 1] : st.t[a.from.i].c[st.t[a.from.i].c.length - 1]; s = SOL.rank(c) === 1 ? 95 : SOL.safeFound(st, c) ? 80 : 50; }
      else if (a.from.p === "t") { var col = st.t[a.from.i], start = col.c.length - a.n; if (start === col.d && col.d > 0) s = 100; else if (start === col.d && !st.t[a.to.i].c.length) s = 0; else if (start === col.d) s = 75; else s = SOL.fitsFound(col.c[start - 1], st.f) ? 45 : 0; }
      else if (a.from.p === "w") s = 60;
      else s = 0;
      if (s > bs) { bs = s; best = a; }
    });
    return bs > 0 ? best : null;
  }
  function reason(a, solver) {
    var tail = solver ? " This keeps a winning path open." : "";
    if (a.k === "draw") return "Draw from the stock." + tail;
    if (a.k === "recycle") return "Turn the waste back over and go again." + tail;
    if (a.to.p === "f") return "Send it up to the foundation." + tail;
    if (a.from.p === "t" && G.st.t[a.from.i].c.length - a.n === G.st.t[a.from.i].d && G.st.t[a.from.i].d > 0) return "Move these to uncover a face-down card." + tail;
    if (a.from.p === "w") return "Play the waste card onto the table." + tail;
    return "Rearrange to open things up." + tail;
  }
  function cardOfSource(a) {
    if (a.k !== "mv") return null; var st = G.st;
    if (a.from.p === "w") return [st.w[st.w.length - 1]];
    if (a.from.p === "f") return [a.from.i * 13 + st.f[a.from.i] - 1];
    var col = st.t[a.from.i]; return col.c.slice(col.c.length - a.n);
  }
  function showHint(a, dest) {
    clearHint(true);
    if (a.k !== "mv") { pileEls.stock.classList.add("hint-src"); return; }
    cardOfSource(a).forEach(function (c) { els[c].classList.add("hint-src"); });
    if (dest) {
      var tgt = a.to.p === "f" ? (G.st.f[a.to.i] ? els[a.to.i * 13 + G.st.f[a.to.i] - 1] : pileEls.f[a.to.i]) : (G.st.t[a.to.i].c.length ? els[G.st.t[a.to.i].c[G.st.t[a.to.i].c.length - 1]] : pileEls.t[a.to.i]);
      tgt.classList.add("hint-dst");
    }
  }
  function clearHint(keep) { board && board.querySelectorAll(".hint-src,.hint-dst").forEach(function (e) { e.classList.remove("hint-src", "hint-dst"); }); if (!keep) { hintAct = null; } }

  /* ---------- rescue shuffle: reshuffle only cards you've never seen, and only into a position with a verified win ---------- */
  function rescue() {
    if (G.status !== "playing") return;
    var left = MODES[G.mode].rescues - G.rescues; if (left <= 0) { say("No shuffles left in this mode."); return; }
    busy = true; btn.shuffle.classList.add("thinking"); say("Shuffling the cards you haven't seen yet, without losing your progress…");
    ask({ kind: "rescue", st: G.st, known: G.known, seed: (Date.now() & 0xffffff), tries: 10, nodes: 40000, ms: 900 }, function (r) {
      busy = false; btn.shuffle.classList.remove("thinking");
      if (!r) { say("Couldn't find a winning shuffle this time. Your game is unchanged. Try Undo or Restart."); paint(); return; }
      hist.push(snap()); fut = []; G.st = r.st; G.rescues++; G.assisted = true; G.rev++; clearHint();
      board.classList.add("reshuffle"); setTimeout(function () { board.classList.remove("reshuffle"); }, 700);
      layout(); persist(); say("Shuffled. There's a winning path from here.");
    }, function () { return null; });
  }

  /* ---------- finishing: when everything is face up, play it all home, one card at a time ---------- */
  function canFinish() { var st = G.st; if (st.s.length || st.w.length) return false; for (var i = 0; i < 7; i++) if (st.t[i].d > 0) return false; return !SOL.won(st); }
  function finish() {
    if (!canFinish()) return; finishing = true; say("Finishing…");
    (function step() {
      if (G.status !== "playing") { finishing = false; return; }
      var st = G.st, best = null, low = 99;
      for (var i = 0; i < 7; i++) { var col = st.t[i]; if (!col.c.length) continue; var c = col.c[col.c.length - 1]; if (SOL.fitsFound(c, st.f) && SOL.rank(c) < low) { low = SOL.rank(c); best = { k: "mv", from: { p: "t", i: i }, to: { p: "f", i: SOL.suit(c) }, n: 1 }; } }
      if (!best) { finishing = false; paint(); return; }
      commit(best); setTimeout(step, reduce ? 0 : 90);
    })();
  }

  /* ---------- winning: the classic bouncing-card cascade ---------- */
  function win() {
    G.status = "won"; clearInterval(timerT);
    var rec = load("records") || {}, m = rec[G.mode] || { wins: 0, assistedWins: 0, best: null };
    if (!G.counted) { if (G.assisted || G.hints) m.assistedWins++; else m.wins++; if (!G.assisted && !G.hints && (m.best === null || G.secs < m.best)) m.best = G.secs; rec[G.mode] = m; save("records", rec); G.counted = true; }
    say("You won! " + G.moves + " moves in " + fmt(G.secs) + ". Score " + score() + ".");
    setTimeout(cascade, 400);
  }
  function cascade() {
    var wrap = document.createElement("div"); wrap.className = "sol-win";
    wrap.innerHTML = '<div class="sol-win-card"><p class="sol-win-h">You did it!</p><p>' + G.moves + " moves · " + fmt(G.secs) + " · score " + score() + '</p><button type="button" class="btn">Deal again</button></div>';
    root.appendChild(wrap); wrap.querySelector("button").addEventListener("click", function () { wrap.remove(); newGame(G.mode); });
    /* a congrats sticker pops out: the YAY! or the smart Lego */
    var st = document.createElement("img"); st.className = "sol-yay"; st.alt = ""; st.src = Math.random() < .5 ? "assets/proj/pr-yay.webp" : "assets/proj/vx-smart.webp";
    root.appendChild(st); setTimeout(function () { st.classList.add("bye"); }, 5200); setTimeout(function () { st.remove(); }, 6000);
    if (reduce) return;
    var cv = document.createElement("canvas"), W = board.clientWidth, H = board.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr; cv.className = "sol-cascade"; board.appendChild(cv);
    var ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
    var imgs = {}, queue = [];
    for (var r = 13; r >= 1; r--) for (var s = 0; s < 4; s++) queue.push(s * 13 + r - 1);
    queue.forEach(function (c) { var im = new Image(); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(faceSVG(c).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')); imgs[c] = im; });
    var cur = null, n = 0, frames = 0;
    (function fly() {
      if (!cv.isConnected) return;
      if (!cur) { if (n >= queue.length) { setTimeout(function () { cv.remove(); }, 1500); return; }
        var c = queue[n++]; cur = { c: c, x: M.x(3 + SOL.suit(c)), y: M.top, vx: (Math.random() < .5 ? -1 : 1) * (2 + Math.random() * 4), vy: -Math.random() * 6 }; }
      cur.vy += .45; cur.x += cur.vx; cur.y += cur.vy;
      if (cur.y + M.ch > H) { cur.y = H - M.ch; cur.vy *= -.72; }
      if (imgs[cur.c].complete) ctx.drawImage(imgs[cur.c], cur.x, cur.y, M.cw, M.ch);
      if (cur.x < -M.cw || cur.x > W) cur = null;
      if (++frames < 6000) requestAnimationFrame(fly);
    })();
  }

  /* ---------- the "Play me" invitation ---------- */
  var play = host.querySelector(".sol-play");
  var lastFocus = null;
  function start() {
    lastFocus = document.activeElement;
    var first = !overlay;
    if (first) build();
    overlay.hidden = false; document.documentElement.classList.add("sol-on");
    overlay.classList.remove("show"); void overlay.offsetWidth;
    requestAnimationFrame(function () { overlay.classList.add("show"); sparkle(); });
    if (first) { if (!restore()) G = blank("easy", pickIdx("easy")); }
    layout(); if (first && !hist.length && G.moves === 0) dealIn(); tick();
    if (G.status === "won") say("Last game: won. Tap New game to play again.");
    setTimeout(function () { var x = overlay.querySelector(".sol-x"); if (x) x.focus({ preventScroll: true }); }, 50);
    if (play) play.innerHTML = 'Back to my game <span aria-hidden="true">&#9824;</span>';
  }
  /* stars and sparkles burst out as the table opens */
  function sparkle() {
    if (reduce) return;
    var B = document.createElement("div"); B.className = "sol-burst"; B.setAttribute("aria-hidden", "true");
    var stars = ["gem-star3-pink", "cr-star-yellow", "gem-star-glitter", "gem-star3-blue", "cr-star-rpink", "holo-star-teal"], h = "";
    for (var k = 0; k < 14; k++) { var an = k / 14 * Math.PI * 2 + Math.random() * .4, d = 34 + Math.random() * 26;
      h += '<img src="assets/proj/' + stars[k % stars.length] + '.webp" alt="" style="--dx:' + (Math.cos(an) * d).toFixed(1) + 'vw;--dy:' + (Math.sin(an) * d * .7).toFixed(1) + 'vh;width:' + (56 + Math.random() * 60).toFixed(0) + 'px;--dl:' + (Math.random() * .25).toFixed(2) + 's;--r:' + Math.round(Math.random() * 540 - 270) + 'deg">'; }
    for (k = 0; k < 40; k++) { an = Math.random() * Math.PI * 2; d = 18 + Math.random() * 40;
      h += '<b style="--dx:' + (Math.cos(an) * d).toFixed(1) + 'vw;--dy:' + (Math.sin(an) * d * .7).toFixed(1) + 'vh;--z:' + (10 + Math.random() * 22).toFixed(0) + 'px;--dl:' + (Math.random() * .6).toFixed(2) + 's"></b>'; }
    B.innerHTML = h; document.body.appendChild(B); setTimeout(function () { B.remove(); }, 2600);
  }
  function close() {
    if (!overlay) return;
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {} overlay.classList.remove("show"); clearInterval(timerT); persist();
    setTimeout(function () { overlay.hidden = true; document.documentElement.classList.remove("sol-on"); }, reduce ? 0 : 250);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  addEventListener("keydown", function (e) { if (e.key === "Escape" && overlay && !overlay.hidden) close(); });
  if (play) play.addEventListener("click", start);
  /* the fanned bunny cards open the game too */
  var fan = host.querySelector(".sol-fan");
  if (fan) { fan.setAttribute("role", "button"); fan.tabIndex = 0; fan.setAttribute("aria-label", "Play solitaire"); fan.removeAttribute("aria-hidden");
    fan.addEventListener("click", start); fan.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); start(); } }); }
  window.__sol = { faceSVG: faceSVG, get G() { return G; }, play: function (a) { return commit(a); } };
})();
