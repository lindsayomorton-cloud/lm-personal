/* ===== Rainbow Solitaire: the game engine (pure rules, no screen code) =====
   Shared by the page, the hint/rescue worker and the offline deal generator.
   Cards are numbers 0-51: suit * 13 + (rank - 1). Suits: 0 hearts, 1 diamonds, 2 clubs, 3 spades.
   Pile convention everywhere: the top of a pile is the LAST element of its array.
   Deal (rules v1): round-robin triangular deal from deck[0]; row r puts one card on columns r..6,
   the first card of each row face up; deck[28..51] becomes the stock in that order (stock top = deck[51]). */
function SOL_FACTORY() {
  var RULES = 1;
  function suit(c) { return (c / 13) | 0; }
  function rank(c) { return (c % 13) + 1; }
  function red(c) { return c < 26; }
  function clone(st) {
    return { t: st.t.map(function (col) { return { c: col.c.slice(), d: col.d }; }), f: st.f.slice(), s: st.s.slice(), w: st.w.slice(), draw: st.draw };
  }
  function deal(deck, draw) {
    var t = [], k = 0, i, j;
    for (i = 0; i < 7; i++) t.push({ c: [], d: 0 });
    for (i = 0; i < 7; i++) for (j = i; j < 7; j++) t[j].c.push(deck[k++]);
    for (i = 0; i < 7; i++) t[i].d = i;
    return { t: t, f: [0, 0, 0, 0], s: deck.slice(28), w: [], draw: draw === 3 ? 3 : 1 };
  }
  /* can card c sit on card under (or on an empty column when under is undefined) */
  function fitsTab(c, under) { return under === undefined ? rank(c) === 13 : (red(c) !== red(under) && rank(c) === rank(under) - 1); }
  function fitsFound(c, f) { return rank(c) === f[suit(c)] + 1; }
  function flip(col) { if (col.d > 0 && col.c.length === col.d) col.d--; }
  /* apply an action; returns a NEW state, or null if the action is illegal (the old state is never touched) */
  function apply(st, a) {
    var n = clone(st), col, card, k;
    if (a.k === "draw") {
      if (!n.s.length) return null;
      for (k = 0; k < n.draw && n.s.length; k++) n.w.push(n.s.pop());
      return n;
    }
    if (a.k === "recycle") {
      if (n.s.length || !n.w.length) return null;
      n.s = n.w.reverse(); n.w = []; return n;
    }
    if (a.k !== "mv") return null;
    var cnt = a.n || 1, moving;
    /* lift the cards off the source */
    if (a.from.p === "w") { if (!n.w.length || cnt !== 1) return null; moving = [n.w[n.w.length - 1]]; }
    else if (a.from.p === "f") { if (cnt !== 1 || !n.f[a.from.i]) return null; moving = [a.from.i * 13 + n.f[a.from.i] - 1]; }
    else if (a.from.p === "t") { col = n.t[a.from.i]; if (!col || cnt < 1 || col.c.length - cnt < col.d) return null; moving = col.c.slice(col.c.length - cnt); }
    else return null;
    /* check the destination */
    if (a.to.p === "f") {
      if (moving.length !== 1 || a.from.p === "f" || suit(moving[0]) !== a.to.i || !fitsFound(moving[0], n.f)) return null;
    } else if (a.to.p === "t") {
      if (a.from.p === "t" && a.from.i === a.to.i) return null;
      var dest = n.t[a.to.i]; if (!dest) return null;
      if (!fitsTab(moving[0], dest.c.length ? dest.c[dest.c.length - 1] : undefined)) return null;
      if (dest.c.length && dest.c.length === dest.d) return null;
    } else return null;
    /* commit */
    if (a.from.p === "w") n.w.pop();
    else if (a.from.p === "f") n.f[a.from.i]--;
    else { col.c.length -= cnt; flip(col); }
    if (a.to.p === "f") n.f[a.to.i]++;
    else Array.prototype.push.apply(n.t[a.to.i].c, moving);
    return n;
  }
  function won(st) { return st.f[0] + st.f[1] + st.f[2] + st.f[3] === 52; }
  /* every legal action in this position */
  function legal(st) {
    var out = [], i, j, col, top;
    if (st.w.length) {
      top = st.w[st.w.length - 1];
      if (fitsFound(top, st.f)) out.push({ k: "mv", from: { p: "w" }, to: { p: "f", i: suit(top) }, n: 1 });
      for (j = 0; j < 7; j++) if (fitsTab(top, last(st.t[j]))) out.push({ k: "mv", from: { p: "w" }, to: { p: "t", i: j }, n: 1 });
    }
    for (i = 0; i < 7; i++) {
      col = st.t[i]; if (!col.c.length) continue;
      top = col.c[col.c.length - 1];
      if (fitsFound(top, st.f)) out.push({ k: "mv", from: { p: "t", i: i }, to: { p: "f", i: suit(top) }, n: 1 });
      for (var s = col.d; s < col.c.length; s++) for (j = 0; j < 7; j++) if (j !== i && fitsTab(col.c[s], last(st.t[j]))) out.push({ k: "mv", from: { p: "t", i: i }, to: { p: "t", i: j }, n: col.c.length - s });
    }
    for (i = 0; i < 4; i++) if (st.f[i]) { var fc = i * 13 + st.f[i] - 1; for (j = 0; j < 7; j++) if (st.t[j].c.length && fitsTab(fc, last(st.t[j]))) out.push({ k: "mv", from: { p: "f", i: i }, to: { p: "t", i: j }, n: 1 }); }
    if (st.s.length) out.push({ k: "draw" }); else if (st.w.length) out.push({ k: "recycle" });
    return out;
  }
  function last(col) { return col.c.length && col.c.length > col.d ? col.c[col.c.length - 1] : (col.c.length ? -1 : undefined); }
  /* a position key; columns are sorted because swapping whole columns never changes who can win */
  function key(st) {
    return st.f.join(",") + "|" + st.t.map(function (c) { return c.d + ":" + c.c.join("."); }).sort().join("/") + "|" + st.w.join(".") + "~" + st.s.join(".");
  }
  function safeFound(st, c) {
    var r = rank(c); if (r <= 2) return true;
    var o1 = red(c) ? st.f[2] : st.f[0], o2 = red(c) ? st.f[3] : st.f[1];
    return o1 >= r - 1 && o2 >= r - 1;
  }
  /* the solver's move list: legal moves, pruned to the ones that can matter, best first */
  function solverMoves(st) {
    var all = legal(st), good = [], i;
    for (i = 0; i < all.length; i++) {
      var a = all[i];
      if (a.k === "mv" && a.to.p === "f" && a.from.p !== "f") {
        var c = a.from.p === "w" ? st.w[st.w.length - 1] : st.t[a.from.i].c[st.t[a.from.i].c.length - 1];
        if (safeFound(st, c)) return [a];
        good.push([90, a]); continue;
      }
      if (a.k === "mv" && a.from.p === "t" && a.to.p === "t") {
        var col = st.t[a.from.i], start = col.c.length - a.n, dest = st.t[a.to.i];
        if (start === col.d) {
          if (col.d === 0 && !dest.c.length) continue;          /* a king already at the bottom of a column: pointless */
          good.push([col.d > 0 ? 100 : 70, a]); continue;        /* reveals a card, or empties a column */
        }
        var under = col.c[start - 1];                              /* splitting a run only to free the card under it for a foundation */
        if (fitsFound(under, st.f)) good.push([60, a]);
        continue;
      }
      if (a.k === "mv" && a.from.p === "w") { good.push([a.to.p === "t" && !st.t[a.to.i].c.length ? 40 : 55, a]); continue; }
      if (a.k === "mv" && a.from.p === "f") { good.push([5, a]); continue; }
      good.push([20, a]);
    }
    good.sort(function (x, y) { return y[0] - x[0]; });
    return good.map(function (g) { return g[1]; });
  }
  /* depth-first search with a visited table. "solved" paths are real, replayable action lists.
     Running out of budget is "unknown", never "unsolvable". */
  function solve(st0, opt) {
    opt = opt || {};
    var maxNodes = opt.nodes || 150000, deadline = opt.ms ? Date.now() + opt.ms : 0, seen = new Set(), path = [], expanded = 0, stop = null;
    function dfs(st) {
      if (won(st)) return true;
      if (expanded >= maxNodes) { stop = "node-limit"; return false; }
      if (deadline && (expanded & 1023) === 0 && Date.now() > deadline) { stop = "timeout"; return false; }
      var k = key(st); if (seen.has(k)) return false; seen.add(k); expanded++;
      var ms = solverMoves(st);
      for (var i = 0; i < ms.length; i++) {
        var nx = apply(st, ms[i]); if (!nx) continue;
        path.push(ms[i]);
        if (dfs(nx)) return true;
        path.pop();
        if (stop) return false;
      }
      return false;
    }
    var ok = dfs(st0);
    if (ok) return { status: "solved", actions: path.slice(), expanded: expanded };
    if (stop) return { status: "unknown", reason: stop, expanded: expanded };
    return { status: "exhausted", expanded: expanded };   /* pruned search found nothing; still not a proof */
  }
  function replay(st, actions) { for (var i = 0; i < actions.length; i++) { st = apply(st, actions[i]); if (!st) return false; } return won(st); }
  /* seeded random numbers (mulberry32, PRNG v1) and Fisher-Yates */
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffle(arr, r) { var x = arr.slice(); for (var i = x.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var tmp = x[i]; x[i] = x[j]; x[j] = tmp; } return x; }
  function deckFromSeed(seed) { var d = []; for (var i = 0; i < 52; i++) d.push(i); return shuffle(d, rng(seed)); }
  function encode(deck) { return deck.map(function (c) { return String.fromCharCode(48 + c); }).join(""); }
  function decode(s) { var d = []; for (var i = 0; i < s.length; i++) d.push(s.charCodeAt(i) - 48); return d; }
  function count(st) { var n = st.s.length + st.w.length + st.f[0] + st.f[1] + st.f[2] + st.f[3]; st.t.forEach(function (c) { n += c.c.length; }); return n; }
  return { RULES: RULES, suit: suit, rank: rank, red: red, clone: clone, deal: deal, apply: apply, legal: legal, won: won, key: key, solve: solve, replay: replay,
    fitsTab: fitsTab, fitsFound: fitsFound, rng: rng, shuffle: shuffle, deckFromSeed: deckFromSeed, encode: encode, decode: decode, count: count, safeFound: safeFound };
}
var SOL = SOL_FACTORY();
if (typeof module !== "undefined" && module.exports) module.exports = { SOL: SOL, SOL_FACTORY: SOL_FACTORY };
