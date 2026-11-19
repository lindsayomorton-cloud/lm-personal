/* ===== master volume: every sound on the site is scaled by one volume knob the visitor controls =====
   iPhones and iPads ignore audio.volume, so there each sound is routed through a Web Audio gain instead,
   and "Sound off" mutes every sound outright (that part works everywhere) */
(function () {
  var master = .8; try { var v = parseFloat(localStorage.getItem("lmVolume")); if (!isNaN(v)) master = Math.min(1, Math.max(0, v)); } catch (e) {}
  var d = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "volume"), all = new Set(), muted = false;
  try { muted = localStorage.getItem("doorSound") === "off"; } catch (e) {}
  if (!d || !d.set) return;
  var locked = false; try { var pr = new Audio(); d.set.call(pr, .5); locked = Math.abs(d.get.call(pr) - .5) > .01 || /[?&]ioslock/.test(location.search); } catch (e) {}
  var AC = window.AudioContext || window.webkitAudioContext, ctx = null;
  function unlock() { if (!ctx && locked && AC) try { ctx = new AC(); } catch (e) {} if (ctx && ctx.state !== "running") { var r = ctx.resume(); if (r && r.catch) r.catch(function () {}); } }
  if (locked && AC) ["touchend", "pointerdown", "click", "keydown"].forEach(function (ev) { addEventListener(ev, unlock, true); });
  function route(a) {
    if (!locked || !AC || a.__gain || a.__noRoute) return;
    try { if (!ctx) ctx = new AC(); var src = ctx.createMediaElementSource(a), g = ctx.createGain(); src.connect(g); g.connect(ctx.destination); a.__gain = g; }
    catch (e) { a.__noRoute = true; }
  }
  function apply(a) {
    var lv = Math.min(1, Math.max(0, (a.__baseVol === undefined ? 1 : a.__baseVol) * master));
    if (a.__gain) { a.__gain.gain.value = lv; d.set.call(a, 1); } else d.set.call(a, lv);
    a.muted = muted;
  }
  Object.defineProperty(HTMLMediaElement.prototype, "volume", { configurable: true,
    get: function () { return this.__baseVol === undefined ? d.get.call(this) : this.__baseVol; },
    set: function (v) { this.__baseVol = v; all.add(this); apply(this); } });
  var play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (this.__baseVol === undefined) this.__baseVol = d.get.call(this);
    all.add(this); route(this); unlock(); apply(this);
    return play.apply(this, arguments);
  };
  window.__getVolume = function () { return master; };
  window.__setVolume = function (v) {
    master = Math.min(1, Math.max(0, v)); try { localStorage.setItem("lmVolume", master); } catch (e) {}
    all.forEach(apply);
  };
  window.__setMuted = function (m) { muted = !!m; all.forEach(apply); };
})();
/* a "real" hover means the visitor actually moved the mouse onto it (not a page scroll sliding it under a still mouse),
   and not in the moment right after a pop-up closes */
var __lastMove = 0, __quietUntil = 0;
addEventListener("pointermove", function (e) { if (e.pointerType === "mouse") __lastMove = Date.now(); }, { passive: true });
var __lastScroll = 0; addEventListener("scroll", function () { __lastScroll = Date.now(); }, { passive: true });
function realHover() { var n = Date.now(); return (n - __lastMove < 200 || n - __lastScroll > 300) && n > __quietUntil; }
/* ============ Behaviour ============ */
(function () {
  var root = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (id) { return document.getElementById(id); };
  var all = function (sel, el) { return [].slice.call((el || document).querySelectorAll(sel)); };

  /* Run fn once when el is on screen enough (works in normal pages and in tall viewers). */
  function whenSeen(el, fn, ratio) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) {
      /* also fires if you scrolled right past it, so nothing gets left behind */
      es.forEach(function (e) { if ((e.isIntersecting && e.intersectionRatio >= (ratio || 0)) || (!e.isIntersecting && e.boundingClientRect.bottom < 0)) { io.disconnect(); fn(); } });
    }, { threshold: [0, ratio || 0, .25, .5, .75, 1] });
    io.observe(el);
  }

  /* A "tall" viewer shows the whole page at once with no scrolling inside the page. */
  function isTall() {
    var sc = document.scrollingElement || root;
    return sc.scrollHeight - innerHeight < 80 || innerHeight > 2600;
  }
  function setMode() {
    root.classList.toggle("tall", isTall());
    if (isTall()) {
      root.classList.add("vx-done");
      /* the whole page is on screen at once, so every door gets its shelf */
      [].forEach.call(document.querySelectorAll(".wall"), function (w) { if (!w.classList.contains("shelf-in")) { w.classList.add("shelf-in"); w.dispatchEvent(new Event("shelf")); } });
    }
  }
  setMode(); addEventListener("resize", setMode); addEventListener("load", setMode);

  /* ---------- loading screen: shows at least a moment, then the vortex rushes toward you and fades ---------- */
  var loader = $("loader"), t0 = Date.now();
  function hideLoader() {
    if (hideLoader.done) return; hideLoader.done = true; if (!loader) { hideLoader.gone = hideLoader.fading = true; return; }
    setTimeout(function () { loader.classList.add("done"); hideLoader.fading = true; root.classList.add("hero-go"); setTimeout(function () { loader.remove(); hideLoader.gone = true; }, 900); }, Math.max(0, 900 - (Date.now() - t0)));
  }
  if (document.readyState === "complete") hideLoader(); else addEventListener("load", hideLoader);
  setTimeout(hideLoader, 6000);

  /* ---------- header menu ---------- */
  var menuBtn = $("menuBtn"), menu = $("menu");
  menuBtn.addEventListener("click", function () { var o = menu.classList.toggle("open"); menuBtn.setAttribute("aria-expanded", o); });
  /* the white rabbit: once the loading screen clears, he dashes across the hero and dives down his hole.
     Only then does the vortex wake up (with a safety timer so it can never stay asleep). */
  var rabbit = $("rabbit");
  window.__vxReady = !!reduce || !rabbit;
  /* the Sabrina theme plays as you fall into the vortex (browsers only allow sound after a click or key press,
     so if it's blocked it starts on your next click) */
  var theme = new Audio("assets/sfx/sabrina.mp3"); theme.preload = "auto"; theme.volume = .55;
  function playTheme() {
    if (playTheme.done || (typeof soundOn !== "undefined" && !soundOn)) return;
    var pr = theme.play();
    if (pr && pr.then) pr.then(function () { playTheme.done = true; }).catch(function () {
      if (playTheme.waiting) return; playTheme.waiting = true;
      function retry() { removeEventListener("pointerdown", retry, true); removeEventListener("keydown", retry, true); playTheme.waiting = false; if (!root.classList.contains("vx-done") || true) playTheme(); }
      addEventListener("pointerdown", retry, true); addEventListener("keydown", retry, true);
    });
  }
  window.__playTheme = playTheme; window.__theme = theme;
  window.__stopTheme = function () { stopTheme(); };
  theme.loop = true;
  /* once you're through the vortex, the theme fades out and stops */
  function stopTheme() {
    if (stopTheme.done) return; stopTheme.done = true; playTheme.done = true;
    var v = theme.volume, t = setInterval(function () { v -= .05; if (v <= 0) { clearInterval(t); theme.pause(); } else theme.volume = v; }, 60);
  }
  function vxLive() { if (window.__vxReady && root.classList.contains("vx-live")) return; window.__vxReady = true; root.classList.add("vx-live"); window.dispatchEvent(new Event("scroll")); }
  if (window.__vxReady) root.classList.add("vx-live");
  function runRabbit() {
    if (!rabbit || !rabbit.isConnected || runRabbit.done) return; runRabbit.done = true;
    var h = rabbit.parentElement.getBoundingClientRect(), copy = document.querySelector(".hero-copy").getBoundingClientRect(),
      stage = document.querySelector(".hero-stage").getBoundingClientRect(), w = rabbit.offsetWidth, ht = w * 140 / 266;
    var side = stage.left > copy.left + 10;
    rabbit.style.setProperty("--x0", ((side ? copy.left + copy.width * .25 : copy.left) - h.left) + "px");
    rabbit.style.setProperty("--x1", ((side ? stage.left + stage.width * .45 : copy.left + copy.width * .7) - h.left - w / 2) + "px");
    /* he runs along the bottom edge of the hero, right on top of the menu bar, from the cream into the gradient */
    var heroB = document.querySelector(".hero").getBoundingClientRect().bottom;
    rabbit.style.setProperty("--y", (heroB - h.top - ht * .92) + "px");
    /* he stops right in front of the blooming daisy under the photo, then dives */
    var dz = document.querySelector(".hero-daisy");
    if (dz && side) { var dr = dz.getBoundingClientRect(); rabbit.style.setProperty("--x1", (dr.left + dr.width / 2 - h.left - w / 2) + "px"); rabbit.style.setProperty("--y", (Math.min(dr.bottom, heroB - 8) - h.top - ht * .95) + "px"); }
    /* sparkles that ride along with him */
    if (!rabbit.querySelector(".rb-sp")) { var sp = ""; for (var q = 0; q < 10; q++) sp += '<i class="rb-sp" style="--sx:' + Math.round(-30 + Math.random() * 130) + '%;--sy:' + Math.round(-30 + Math.random() * 110) + '%;--sz:' + Math.round(10 + Math.random() * 16) + 'px;--sd:' + (Math.random() * 1.6).toFixed(2) + 's"></i>'; rabbit.insertAdjacentHTML("beforeend", sp); }
    rabbit.classList.add("go"); root.classList.add("bunny-on");
    /* Sabrina comes in a beat after he starts running */
    setTimeout(playTheme, 1500);
    /* the camera pushes in on the bunny as he reaches his hole; the vortex then opens from that exact spot */
    var dur = parseFloat(getComputedStyle(rabbit).animationDuration) * 1000 || 5200;
    setTimeout(function () {
      var hr = document.querySelector(".hero").getBoundingClientRect(), x1 = parseFloat(rabbit.style.getPropertyValue("--x1")) || 0, y = parseFloat(rabbit.style.getPropertyValue("--y")) || 0;
      var hx = h.left + x1 + w * .55, hy = h.top + y + ht * .85;
      /* a gentle push-in toward the hole; the vortex then opens exactly where the hole ends up on screen */
      var zx = (innerWidth / 2 - hx) * .25, zy = (innerHeight * .55 - hy) * .25;
      root.style.setProperty("--holex", (hx - hr.left) + "px"); root.style.setProperty("--holey", (hy - hr.top) + "px"); root.style.setProperty("--zx", zx + "px"); root.style.setProperty("--zy", zy + "px");
      /* remember where the hole sits on the page so the vortex circle opens from it and travels with it as the page scrolls */
      window.__holeDoc = { x: hx + zx, y: hy + zy + scrollY };
      root.classList.add("bunny-zoom");
      /* his sparkles multiply and swell as he heads into the hole */
      var more = ""; for (var q2 = 0; q2 < 18; q2++) more += '<i class="rb-sp rb-sp2" style="--sx:' + Math.round(-60 + Math.random() * 190) + '%;--sy:' + Math.round(-60 + Math.random() * 170) + '%;--sz:' + Math.round(14 + Math.random() * 22) + 'px;--sd:' + (Math.random() * 1.2).toFixed(2) + 's"></i>';
      rabbit.insertAdjacentHTML("beforeend", more); rabbit.classList.add("rb-grow");
      var unz = setInterval(function () { if (root.classList.contains("vx-past")) { clearInterval(unz); root.classList.remove("bunny-zoom"); } }, 200);
    }, dur * .55);
  }
  if (rabbit) rabbit.addEventListener("animationend", function (e) { if (e.target === rabbit) { poof(rabbit); root.classList.remove("bunny-on"); rabbit.remove(); vxLive(); pullIn(); } });
  /* the vortex starts opening from his hole as his dive is ending, not after */
  if (rabbit) rabbit.addEventListener("animationstart", function (e) {
    if (e.target !== rabbit) return;
    var d = parseFloat(getComputedStyle(rabbit).animationDuration) * 1000 || 5200;
    setTimeout(vxLive, d * .78);   /* the vortex opens as the dive ends */
    setTimeout(pullIn, d * .55 + 2200);   /* the page only starts scrolling once the camera push has finished, so the two never fight */
  });
  /* a poof of light and sparkles where he dives in, as you're pushed into the vortex */
  function poof(el) {
    if (reduce) return;
    var r = el.getBoundingClientRect(), x = r.left + r.width * .55, y = r.top + r.height * .6, P = document.createElement("div");
    P.className = "poof"; P.style.left = x + "px"; P.style.top = y + "px";
    var h = '<i class="poof-flash"></i>';
    for (var k = 0; k < 22; k++) { var an = k / 22 * Math.PI * 2 + Math.random() * .3, d = 90 + Math.random() * 220;
      h += '<b style="--dx:' + (Math.cos(an) * d).toFixed(0) + 'px;--dy:' + (Math.sin(an) * d - 40).toFixed(0) + 'px;--z:' + (10 + Math.random() * 22).toFixed(0) + 'px;--dl:' + (Math.random() * .2).toFixed(2) + 's"></b>'; }
    P.innerHTML = h; document.body.appendChild(P); setTimeout(function () { P.remove(); }, 2200);
  }
  window.__poof = poof;
  /* the bunny's pink + chartreuse sparkles follow him down and become part of the vortex: they spiral out of his hole and keep orbiting the swirl */
  function swirl() {
    if (reduce || swirl.on) return; swirl.on = true;
    var L = document.createElement("div"); L.className = "rb-swirl"; L.setAttribute("aria-hidden", "true");
    var cols = ["#fe7bbf", "#ceff32", "#ec2b7a", "#fff", "#ceff32", "#fe7bbf"], N = 34, P = [];
    for (var i = 0; i < N; i++) {
      var b = document.createElement("i"), z = 14 + Math.random() * 30;
      b.style.width = b.style.height = z + "px"; b.style.background = cols[i % cols.length]; b.style.animationDelay = (Math.random() * 1.4).toFixed(2) + "s";
      L.appendChild(b);
      P.push({ el: b, a: i * 2.39996, r: .18 + Math.random() * .82, sp: (.35 + Math.random() * .6) * (i % 2 ? 1 : 1.25), d: Math.random() * .6 });
    }
    document.body.appendChild(L);
    var t1 = performance.now(), H = window.__holeDoc;
    (function f(now) {
      var t = (now - t1) / 1000, W = innerWidth, Hh = innerHeight, m = Math.min(W, Hh);
      var k = Math.min(1, t / 2.6), e = 1 - Math.pow(1 - k, 3);
      var hx = H ? H.x : W / 2, hy = H ? H.y - scrollY : Hh / 2, cx = hx + (W / 2 - hx) * e, cy = hy + (Hh / 2 - hy) * e;
      for (var j = 0; j < P.length; j++) {
        var q = P[j], g = Math.max(0, Math.min(1, (t - q.d) / 1.6)), gr = 1 - Math.pow(1 - g, 2);
        var R = (10 + q.r * m * .46 * gr) * (1 + .06 * Math.sin(t * 2 + j)), an = q.a + t * q.sp;
        q.el.style.transform = "translate(" + (cx + Math.cos(an) * R).toFixed(1) + "px," + (cy + Math.sin(an) * R * .82).toFixed(1) + "px) translate(-50%,-50%) scale(" + (.3 + gr * (.8 + q.r * .9)).toFixed(2) + ") rotate(" + (an * 57).toFixed(0) + "deg)";
      }
      if (root.classList.contains("vx-past")) { L.classList.add("bye"); setTimeout(function () { L.remove(); }, 900); return; }
      requestAnimationFrame(f);
    })(t1);
  }
  /* once he's gone down the hole, the site takes the wheel and carries you down into the vortex;
     any wheel, touch or key from you hands control straight back */
  function pullIn() {
    if (pullIn.done) return; pullIn.done = true;
    swirl();
    if (root.classList.contains("tall") || scrollY > innerHeight * 1.2) return;
    var vx2 = $("vortex"), from = scrollY, to = vx2.offsetTop + innerHeight * .15, t1 = performance.now(), dur = 2800, stop = false;
    function quit() { if (performance.now() - t1 < 250) return; stop = true; ["wheel", "touchstart", "keydown"].forEach(function (ev) { removeEventListener(ev, quit); }); }
    ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (ev) { addEventListener(ev, quit, { passive: true }); });
    root.style.scrollBehavior = "auto";
    (function frame(now) {
      if (stop) { root.style.scrollBehavior = ""; return; }
      var k = Math.min(1, (now - t1) / dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      scrollTo(0, from + (to - from) * e);
      if (k < 1) requestAnimationFrame(frame); else { root.style.scrollBehavior = ""; quit(); }
    })(t1);
  }
  if (!reduce) { var heroEl = document.querySelector(".hero"); if (heroEl) heroEl.addEventListener("mousemove", function () { if (Date.now() - t0 > 2000) window.__heroHover = true; }); }
  if (reduce) { if (rabbit) rabbit.remove(); }
  /* he waits until the loading screen is completely gone and the hero is on screen */
  /* he runs about two seconds after the page opens (or sooner, the moment you start scrolling) */
  else (function wait() {
    var hb = document.querySelector(".hero").getBoundingClientRect(), heroUp = root.classList.contains("tall") || (hb.bottom > innerHeight * .5 && hb.top < innerHeight * .5);
    if (hideLoader.fading && heroUp && window.__daisyGo) { if (holdScroll.t) rabbit.classList.add("fast"); runRabbit(); } else setTimeout(wait, 100);
  })();
  /* if you try to scroll before he has run, the page holds still while he dashes across (a little quicker),
     then dives, and the site carries you down into the vortex */
  function holdScroll(e) {
    if (root.classList.contains("tall") || !rabbit || !rabbit.isConnected || releaseHold.done) return;
    if (e.type === "keydown" && !/^(ArrowDown|PageDown|Space| |End)$/.test(e.key)) return;
    e.preventDefault();
    /* nobody scrolls past the hero until they've clicked: the page stays put and the tag asks again */
    if (!window.__daisyGo) { if (window.__nudgeTag) window.__nudgeTag(); return; }
    if (!holdScroll.t) holdScroll.t = setTimeout(releaseHold, 5200);
    if (!runRabbit.done && hideLoader.fading) { rabbit.classList.add("fast"); runRabbit(); }
  }
  /* never hold the page for more than a few seconds, whatever happens to the rabbit */
  function releaseHold() { releaseHold.done = true; ["wheel", "touchmove", "keydown"].forEach(function (ev) { removeEventListener(ev, holdScroll); }); }
  setTimeout(releaseHold, 13000);
  if (rabbit && !reduce) {
    addEventListener("wheel", holdScroll, { passive: false });
    addEventListener("touchmove", holdScroll, { passive: false });
    addEventListener("keydown", holdScroll);
    rabbit.addEventListener("animationend", function (e) { if (e.target === rabbit) releaseHold(); });
  }
  addEventListener("scroll", function first() { if (scrollY > 8 && hideLoader.fading) { removeEventListener("scroll", first); if (!runRabbit.done && rabbit) { rabbit.classList.add("fast"); runRabbit(); } } }, { passive: true });
  setTimeout(vxLive, 16000);

  /* ---------- vortex ---------- */
  var vx = $("vortex"), view = vx.querySelector(".vx-view"), quotes = all(".vq", vx);
  /* the vortex's images load once the top of the page is up, or as soon as you start scrolling, so the hero appears first */
  function makeGems() {
    if (makeGems.done) return; makeGems.done = true;
    all("img[data-src]", vx).forEach(function (im) { im.src = im.dataset.src; });
    var G = ["cr-heart", "gem-flower-blue", "cr-star-rpink", "gem-plumbob", "gem-pink", "gem-star-glass", "cr-star-yellow", "gem-star-glitter", "gem-star3-pink", "cr-star-blue", "gem-star3-blue", "cr-star-pink", "gem-star3-yellow"], box = $("vxFloat"), seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    /* everything shares one long cycle and gets its own slot in it, so only a few are moving at any moment */
    var items = [];
    for (var i = 0; i < 10; i++) { var gs = 34 + rnd() * 30; items.push([G[i % G.length], G[i % G.length] === "gem-plumbob" ? gs * .5 : gs]); }
    [["vx-chair", 130], ["vx-teacup2", 170], ["vx-bee", 110], ["vx-shop", 170], ["vx-smart", 160], ["vx-rainbow", 160]].forEach(function (t, j) { items.splice(1 + j * 2, 0, t); });
    var cycle = 64, n = items.length;
    items.forEach(function (it, j) {
      var s = document.createElement("span"), out = j % 2 === 0, ang = j * 2.39996 + rnd() * .5, R = 50 + rnd() * 40;
      /* the chair and the teacup tumble down from above the screen, then get sucked into the middle */
      var fall = it[0] === "vx-chair" || it[0] === "vx-teacup2";
      if (fall) { out = false; ang = -Math.PI / 2 + (it[0] === "vx-chair" ? -.35 : .35); R = 85; }
      s.className = "vb" + (it[1] > 100 ? " big" : "");
      s.style.cssText = "--anim:" + (fall ? "vbFallIn" : out ? "vbOut1" : "vbIn1") + ";--w:" + Math.round(it[1] * 1.5) + "px;--tx:" + (Math.cos(ang) * R).toFixed(1) + "vw;--ty:" + (Math.sin(ang) * R * .8).toFixed(1) + "vh;--s:" + (out ? 2.2 + rnd() * 1.4 : 1).toFixed(2) + ";--dur:" + (out ? 4.6 : 5) + "s;--del:" + (.3 + j * .24 + rnd() * .2).toFixed(2) + "s;--rt:" + Math.round(-200 + rnd() * 400) + "deg";
      s.innerHTML = '<img src="assets/proj/' + it[0] + '.webp" alt="">';
      box.appendChild(s);
    });
    /* right after the shower: Van on his seahorse flies out of the center toward you,
       while the Lego jellyfish is pulled into the center, both at the same pace */
    [["vx-rider", "vbOut1", 0], ["pr-jelly", "vbOut1", Math.PI * .8]].forEach(function (d) {
      var s = document.createElement("span"); s.className = "vb big hero-pair";
      s.style.cssText = "--anim:" + d[1] + ";--w:240px;--tx:" + (Math.cos(d[2]) * 60).toFixed(1) + "vw;--ty:" + (Math.sin(d[2]) * 40 - 10).toFixed(1) + "vh;--s:3.2;--dur:6s;--del:.5s;--rt:" + (d[1] === "vbIn1" ? 0 : 20) + "deg";
      s.innerHTML = '<img src="assets/proj/' + d[0] + '.webp" alt="">';
      box.appendChild(s);
    });
    /* a ring of sparkles bursts around the question as it appears */
    var q1 = vx.querySelector(".vq-lock .vl1");
    /* ten sparkles, spread well apart around the strip, each in its own moment */
    if (q1) for (var z = 0; z < 10; z++) { var qs = document.createElement("i"); qs.className = "vq-spark"; var an = z * 2.39996 + rnd() * .4, rr = .7 + rnd() * .5;
      qs.style.cssText = "--sx:" + (Math.cos(an) * 520 * rr).toFixed(0) + "px;--sy:" + (Math.sin(an) * 230 * rr).toFixed(0) + "px;--z:" + (18 + rnd() * 26).toFixed(0) + "px;--del:" + (.3 + z * .22 + rnd() * .1).toFixed(2) + "s"; q1.appendChild(qs); }
    /* once "Who in the world am I?" has landed, a handful of gems pop out around it and keep twinkling */
    if (q1) ["gem-star3-pink", "gem-heart", "gem-star-glass", "gem-flower-blue", "gem-star3-yellow", "gem-pink"].forEach(function (g, z) {
      var e = document.createElement("img"); e.className = "vq-gem"; e.alt = ""; e.src = "assets/proj/" + (g === "gem-heart" ? "cr-heart" : g) + ".webp";
      var an = z / 6 * Math.PI * 2 + .4;
      e.style.cssText = "--gx:" + (Math.cos(an) * (430 + rnd() * 80)).toFixed(0) + "px;--gy:" + (Math.sin(an) * (150 + rnd() * 50)).toFixed(0) + "px;--gz:" + (44 + rnd() * 26).toFixed(0) + "px;--gd:" + (1.15 + z * .12).toFixed(2) + "s;--gr:" + Math.round(-30 + rnd() * 60) + "deg";
      e.classList.add(z % 2 ? "g-in" : "g-out");
      q1.appendChild(e);
    });
    /* sparkles twinkle all over the portal from the first moment */
    for (var q = 0; q < 30; q++) {
      var sp = document.createElement("i"); sp.className = "vx-spark";
      sp.style.cssText = "left:" + (rnd() * 100).toFixed(1) + "%;top:" + (rnd() * 100).toFixed(1) + "%;--z:" + (18 + rnd() * 40).toFixed(0) + "px;--del:" + (rnd() * 2.4).toFixed(2) + "s;--dur:" + (1.4 + rnd() * 1.6).toFixed(2) + "s";
      box.appendChild(sp);
    }
    /* the moment you enter: sparkly gems tumble down the screen while holographic balloons float up past them */
    var fall = ["cr-star-yellow", "gem-flower-blue", "cr-star-pink", "gem-plumbob", "cr-star-blue", "gem-star-glass", "gem-pink", "gem-star-glitter", "gem-star3-pink", "cr-star-rpink", "gem-star3-blue", "cr-heart", "gem-star3-yellow"], rise = ["holo-heart", "holo-star-blue", "holo-star-puffy", "holo-star-teal", "holo-star-dark"];
    for (var g = 0; g < 20; g++) {
      var e = document.createElement("span"), up = g % 3 === 2;
      e.className = "vx-enter " + (up ? "up" : "down");
      e.style.cssText = "--x:" + (2 + ((g * 37) % 20) / 20 * 92 + (rnd() - .5) * 3).toFixed(1) + "%;--w:" + Math.round(up ? 120 + rnd() * 70 : 56 + rnd() * 50) + "px;--del:" + (.2 + g / 20 * 3.5 + rnd() * .25).toFixed(2) + "s;--dur:" + (up ? 4.5 + rnd() * 1.5 : 3 + rnd() * 1.5).toFixed(2) + "s;--rt:" + Math.round(-300 + rnd() * 600) + "deg";
      e.innerHTML = '<img src="assets/proj/' + (up ? rise[g % rise.length] : fall[g % fall.length]) + '.webp" alt="">';
      /* the green plumbob gem stays small */
      if (!up && fall[g % fall.length] === "gem-plumbob") e.style.setProperty("--w", Math.round(30 + rnd() * 10) + "px");
      /* scatter: every piece gets its own direction around the vortex (golden angle, so no two crowd), flying out of the center or being pulled into it */
      var ea = g * 2.39996 + rnd() * .6, er = 62 + rnd() * 30;
      e.style.setProperty("--ex", (Math.cos(ea) * er).toFixed(1) + "vw"); e.style.setProperty("--ey", (Math.sin(ea) * er * .75).toFixed(1) + "vh");
      e.style.setProperty("--es", (up ? 1.6 + rnd() * .8 : 2 + rnd() * 1.6).toFixed(2)); e.style.setProperty("--ee", (rnd() * .35).toFixed(2));
      var wob = up ? 70 : 40;
      e.style.setProperty("--wx1", ((rnd() - .5) * wob * 2).toFixed(0) + "px"); e.style.setProperty("--wx2", ((rnd() - .5) * wob * 3).toFixed(0) + "px"); e.style.setProperty("--wx3", ((rnd() - .5) * wob * 4).toFixed(0) + "px");
      e.style.setProperty("--td", (1.2 + rnd() * 2).toFixed(2) + "s"); e.style.setProperty("--tl", (4 + rnd() * 14).toFixed(1) + "deg");
      box.appendChild(e);
    }
    /* a little worm crawling across */
  }
  addEventListener("scroll", makeGems, { once: true, passive: true });
  function soon() { setTimeout(makeGems, 600); }
  if (document.readyState === "complete") soon(); else addEventListener("load", soon);
  /* In a tall viewer the page can't tell where the screen is, so the section is cut into
     thin slices and an observer reports which slices are showing. */
  var shown = {}, maxH = 0, slices = [];
  for (var k = 0; k < 40; k++) { var sl = document.createElement("i"); sl.className = "vx-slice"; sl.style.top = (k * 2.5) + "%"; sl.dataset.k = k; vx.appendChild(sl); slices.push(sl); }
  function visible() {
    var top = Infinity, bot = -Infinity;
    for (var k in shown) if (shown[k]) { top = Math.min(top, shown[k].top); bot = Math.max(bot, shown[k].bottom); }
    return isFinite(top) ? { top: top, bottom: bot, height: bot - top } : null;
  }
  function clamp(x) { return Math.min(1, Math.max(0, x)); }
  /* where the fall should be (target), eased toward each frame so it glides */
  /* the question spins up out of the wormhole first; once "puzzle." lands, everything else pours in */
  function startQuote() {
    if (startQuote.done) return; startQuote.done = true; root.classList.add("vq-go");
    setTimeout(vxBurst, 3300);
    setTimeout(dolGems, 2700);   /* gems leap up alongside the dolphin's jump */
    setTimeout(puzzlePoof, 4250);   /* he dives into "puzzle.": sparkles poof out of the word and balloons drift in and shrink away into the vortex */   /* the dolphin lands at 4.3s: smoke and sparkles puff up a second before he's fully down */
    setTimeout(function () { var fl = $("vxFloat"); if (fl) fl.classList.add("go"); root.classList.add("vx-go"); }, 4400);   /* the chair, teacup and the rest pour in the moment the dolphin splashes down */
  }
  /* a puff of smoke and a spray of sparkles as everything else pours into the vortex */
  function dolGems() {
    if (reduce) return;
    var dol = document.querySelector(".vq-lock .vq-dol"), r = dol ? dol.getBoundingClientRect() : null;
    var G = document.createElement("div"); G.className = "dol-gems"; G.setAttribute("aria-hidden", "true");
    G.style.left = (r ? r.left + r.width * .6 : innerWidth / 2) + "px"; G.style.top = (r ? r.top + r.height * .7 : innerHeight / 2) + "px";
    var pics = ["gem-star3-pink", "gem-flower-blue", "gem-star3-yellow", "cr-heart", "gem-star-glass", "gem-pink", "gem-star3-blue"], h = "";
    for (var k = 0; k < 27; k++) { var dx = 20 + (k % 9) * 36 + Math.random() * 40 - (k % 3) * 30, up = 90 + Math.random() * 230;
      h += '<img src="assets/proj/' + pics[k % pics.length] + '.webp" alt="" style="width:' + Math.round(28 + Math.random() * 26) + 'px;--dx:' + dx.toFixed(0) + 'px;--up:' + up.toFixed(0) + 'px;--dl:' + (k * .035 + Math.random() * .08).toFixed(2) + 's;--r:' + Math.round(-200 + Math.random() * 400) + 'deg">'; }
    G.innerHTML = h; document.body.appendChild(G); setTimeout(function () { G.remove(); }, 2600);
  }
  function puzzlePoof() {
    if (reduce) return;
    var w = [].slice.call(document.querySelectorAll(".vq-lock .vw")).pop(), r = w ? w.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    var P = document.createElement("div"); P.className = "pz-poof"; P.setAttribute("aria-hidden", "true");
    P.style.left = (r.left + r.width / 2) + "px"; P.style.top = (r.top + r.height / 2) + "px";
    var h = '<i class="pz-flash"></i>';
    for (var k = 0; k < 26; k++) { var an = k / 26 * Math.PI * 2 + Math.random() * .3, d = 70 + Math.random() * 190;
      h += '<b style="--dx:' + (Math.cos(an) * d * 1.3).toFixed(0) + 'px;--dy:' + (Math.sin(an) * d).toFixed(0) + 'px;--z:' + (12 + Math.random() * 22).toFixed(0) + 'px;--dl:' + (Math.random() * .2).toFixed(2) + 's"></b>'; }
    P.innerHTML = h; document.body.appendChild(P); setTimeout(function () { P.remove(); }, 2000);
    /* balloons float in from the edges, then shrink away down the middle of the vortex */
    var B = document.createElement("div"); B.className = "vx-balloons"; B.setAttribute("aria-hidden", "true");
    var pics = ["holo-heart", "holo-star-blue", "holo-star-puffy", "holo-star-teal", "holo-star-dark", "holo-heart", "holo-star-puffy", "holo-star-blue", "holo-star-teal", "holo-heart"], hb = "";
    pics.forEach(function (pic, i) {
      var an = i / pics.length * Math.PI * 2 + .3, sx = Math.cos(an) * 60, sy = Math.sin(an) * 52 + 10;
      hb += '<img src="assets/proj/' + pic + '.webp" alt="" style="width:' + Math.round(110 + Math.random() * 70) + 'px;--sx:' + sx.toFixed(1) + 'vw;--sy:' + sy.toFixed(1) + 'vh;--mx:' + (sx * .45).toFixed(1) + 'vw;--my:' + (sy * .4).toFixed(1) + 'vh;--dl:' + (.15 + i * .18).toFixed(2) + 's;--r:' + Math.round(-30 + Math.random() * 60) + 'deg">';
    });
    B.innerHTML = hb; document.body.appendChild(B); setTimeout(function () { B.remove(); }, 6500);
  }
  function vxBurst() {
    if (reduce) return;
    var B = document.createElement("div"); B.className = "vx-burst"; B.setAttribute("aria-hidden", "true");
    var h = "";
    for (var k = 0; k < 9; k++) { var an = k / 9 * Math.PI * 2 + Math.random() * .5, d = 120 + Math.random() * 160;
      h += '<s style="--dx:' + (Math.cos(an) * d).toFixed(0) + 'px;--dy:' + (Math.sin(an) * d * .7).toFixed(0) + 'px;--z:' + (140 + Math.random() * 120).toFixed(0) + 'px;--dl:' + (Math.random() * .25).toFixed(2) + 's"></s>'; }
    for (k = 0; k < 26; k++) { an = k / 26 * Math.PI * 2 + Math.random() * .3; d = 160 + Math.random() * 320;
      h += '<b style="--dx:' + (Math.cos(an) * d).toFixed(0) + 'px;--dy:' + (Math.sin(an) * d * .8).toFixed(0) + 'px;--z:' + (14 + Math.random() * 26).toFixed(0) + 'px;--dl:' + (.1 + Math.random() * .4).toFixed(2) + 's"></b>'; }
    B.innerHTML = h; document.body.appendChild(B); setTimeout(function () { B.remove(); }, 2600);
  }
  function vortexTarget() {
    var r = vx.getBoundingClientRect(), H = innerHeight;
    if (root.classList.contains("tall")) {
      var vis = visible(); if (!vis) return { p: 0, o: 0 };
      if (vis.height > maxH) maxH = vis.height;
      var h = maxH, top = vis.top - r.top;
      if (vis.bottom >= r.bottom - 2 && vis.height < h) top = r.height - h;
      view.style.setProperty("--vt", Math.max(0, top) + "px");
      view.style.setProperty("--vh", h + "px");
      var pp = clamp(top / Math.max(1, r.height - h)), enter = vis.bottom >= r.bottom - 2 ? 1 : clamp(vis.height / h);
       if (enter > .2 && root.classList.contains("vx-live")) startQuote(); root.classList.add("vx-go");
      return { p: pp, o: Math.min(enter, clamp((1 - pp) / .15)) };
    }
    if (r.bottom < H * 2) root.classList.add("vx-done");
    /* Sabrina keeps playing past the vortex; it hands off to Boy Meets World at the garden */
    /* if you reach the vortex before the rabbit has finished, it wakes up anyway */
    if (!root.classList.contains("vx-live") && r.top < H * 1.3) vxLive();
    /* the question arrives the moment the portal opens */
    if (root.classList.contains("vx-live") && r.top < H * .85) startQuote();
    /* the shower and the characters start the moment the portal has swallowed the screen, so you see all of it */
    
    /* coming in: a round portal opens from the center of the screen as the section approaches, swallowing the page;
       going out: the doors rise from below and push it away */
    var inView = r.top < H && r.bottom > 0, a = clamp((H * 1.15 - r.top) / (H * 1.15));
    /* once the hero is gone, the vortex drops beneath the doors, so the doors slide up over it exactly with your scroll */
    root.classList.toggle("vx-past", r.top < 0);
    if (r.top < 0) view.style.clipPath = "none";
    else { var hd = window.__holeDoc, at = hd ? hd.x.toFixed(0) + "px " + (hd.y - scrollY).toFixed(0) + "px" : "50% 55%"; view.style.clipPath = "circle(" + (!hd && a < .2 ? 0 : a * a * 160).toFixed(2) + "vmax at " + at + ")"; }
    return { p: clamp(-r.top / Math.max(1, r.height - H)), o: inView || (r.top > 0 && a > 0) ? 1 : 0 };
  }
  var cur = null, running = false;
  var hole = vx.querySelector(".vx-hole"), tunnel = vx.querySelector(".vx-tunnel");
  /* set each moving layer's transform directly, so a scroll frame touches only those few layers */
  function paint(p, o) {
    var op = o * o * (3 - 2 * o);
    view.style.opacity = op.toFixed(4); view.classList.toggle("on", op > .005 && root.classList.contains("vx-live")); root.classList.toggle("in-vx", op > .05);
    hole.style.transform = "scale(" + (1 + p * p * 2.6).toFixed(4) + ") rotate(" + (p * 90).toFixed(2) + "deg)";
    tunnel.style.transform = "scale(" + (.5 + p * p * 4.5).toFixed(4) + ") rotate(" + (-p * 160).toFixed(2) + "deg)";
    tunnel.style.opacity = (1 - clamp((p - .6) / .25)).toFixed(4);
    quotes.forEach(function (q) {
      var a = +q.dataset.a, b = +q.dataset.b, qo = Math.max(0, Math.min((p - a) / .07, (b - p) / .07, 1));
      q.style.opacity = qo.toFixed(3);
      q.style.transform = "translateY(" + ((1 - qo) * 24).toFixed(1) + "px) rotate(var(--rt)) scale(" + (.92 + qo * .08).toFixed(3) + ")";
    });
  }
  function step() {
    var t = vortexTarget();
    if (!cur) cur = { p: t.p, o: t.o };
    cur.p += (t.p - cur.p) * .2;
    cur.o = t.o;
    paint(cur.p, cur.o);
    if (Math.abs(t.p - cur.p) > .0005 || Math.abs(t.o - cur.o) > .0005) requestAnimationFrame(step); else running = false;
  }
  function paintVortex() { if (!running) { running = true; requestAnimationFrame(step); } }
  if ("IntersectionObserver" in window) {
    var sio = new IntersectionObserver(function (es) { es.forEach(function (e) { shown[e.target.dataset.k] = e.isIntersecting ? e.intersectionRect : null; }); requestAnimationFrame(paintVortex); }, { threshold: [0, .01, .25, .5, .75, .99, 1] });
    slices.forEach(function (x) { sio.observe(x); });
  }
  var ticking = false;
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; paintVortex(); }); } }, { passive: true });
  paintVortex();
  if (reduce) root.classList.add("vx-done");
  /* jumping to a section skips the fall */
  document.addEventListener("click", function (e) { var a = e.target.closest && e.target.closest("a[href^='#'],[data-room],[data-full]"); if (a) root.classList.add("vx-done"); });
  if (location.hash && location.hash !== "#top") root.classList.add("vx-done");

  /* ---------- gems drift past the edges as you scroll ---------- */
  var drift = all("#drift img");
  if (!reduce) {
    var t2 = false;
    addEventListener("scroll", function () {
      if (t2) return; t2 = true;
      requestAnimationFrame(function () {
        t2 = false; var y = scrollY, H = innerHeight + 260;
        drift.forEach(function (o) {
          var pos = ((+o.dataset.y * H - y * +o.dataset.sp) % H + H) % H - 130;
          /* flowers only sway a little (never upside down); gems and stars can spin */
          var rot = /fl-|flower|bloom|daisy|peony|tulip/i.test(o.getAttribute("src") || "") ? Math.sin(y / 700 + pos / 300) * 14 : y / 1000 * +o.dataset.rot;
          o.style.transform = "translateY(" + pos.toFixed(1) + "px) rotate(" + rot.toFixed(1) + "deg)";
        });
      });
    }, { passive: true });
  }
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { root.classList.toggle("in-doors", es[0].isIntersecting); }, { rootMargin: "-10% 0px -10% 0px" }).observe($("doors"));

  /* ---------- doors ---------- */
  var walls = all(".wall");
  /* where the door's crack is, so things fly out of it */
  function crack(w) {
    var d = w.querySelector(".door"), cx = d.offsetLeft + d.offsetWidth * .86, cy = d.offsetTop + d.offsetHeight * .5;
    all(".out", w).forEach(function (el) { el.style.setProperty("--fx", (cx - (el.offsetLeft + el.offsetWidth / 2)) + "px"); el.style.setProperty("--fy", (cy - (el.offsetTop + el.offsetHeight / 2)) + "px"); });
  }
  function crackAll() { walls.forEach(crack); }
  crackAll(); addEventListener("load", crackAll); addEventListener("resize", crackAll);
  walls.forEach(function (w, i) {
    w.style.setProperty("--fr", (i % 2 ? 1 : -1) * 2.5 + "deg");
    var d = w.querySelector(".door"), t;
    /* hovering or focusing a door opens it a crack */
    function open() { clearTimeout(t); w.classList.add("open-a-crack"); }
    function shut() { clearTimeout(t); t = setTimeout(function () { w.classList.remove("open-a-crack"); }, 120); }
    d.addEventListener("mouseenter", open); d.addEventListener("focus", open); d.addEventListener("touchstart", open, { passive: true });
    d.addEventListener("mouseleave", shut); d.addEventListener("blur", shut);
    /* the shelf springs up once a good part of the door is on screen, and stays */
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          var past = !e.isIntersecting && e.boundingClientRect.bottom < 0;
          if (((e.isIntersecting && e.intersectionRatio >= .35) || past) && !w._t) w._t = setTimeout(function () { w.classList.add("shelf-in"); w.dispatchEvent(new Event("shelf")); }, 350);
        });
      }, { threshold: [0, .35, .5, .7, 1] });
      io.observe(d);
    } else w.classList.add("shelf-in");
    /* the wall rises into place */
    if (!reduce) whenSeen(w, function () { w.classList.add("in"); });
  });
  /* backup for fast scrolling: any door you've reached or passed gets its wall and shelf */
  var pendingWalls = walls.slice(), wallTick = false;
  function catchUp() {
    wallTick = false;
    pendingWalls = pendingWalls.filter(function (w) {
      if (w.getBoundingClientRect().top > innerHeight * .6) return true;
      w.classList.add("in");
      if (!w.classList.contains("shelf-in")) { w.classList.add("shelf-in"); w.dispatchEvent(new Event("shelf")); }
      return false;
    });
    if (!pendingWalls.length) removeEventListener("scroll", onWallScroll);
  }
  function onWallScroll() { if (!wallTick && root.classList.contains("vx-done")) { wallTick = true; requestAnimationFrame(catchUp); } }
  addEventListener("scroll", onWallScroll, { passive: true });
  whenSeen(document.querySelector(".side-about"), function () { document.querySelector(".side-about").classList.add("in"); }, .25);

  /* door sounds, made in the browser: a creak and a chime */
  var soundOn = true, ctx = null, sndBtn = $("sndBtn");
  try { if (localStorage.getItem("doorSound") === "off") soundOn = false; } catch (e) {}
  function paintSnd() { sndBtn.setAttribute("aria-pressed", soundOn); sndBtn.textContent = soundOn ? "♪ Sound on" : "♪ Sound off"; }
  paintSnd();
  var SFX = {};
  function playSfx(n) { try { var a = SFX[n] || (SFX[n] = new Audio("assets/sfx/" + n + ".mp3")); a.currentTime = 0; a.volume = .8; var pr = a.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {} }
  window.__playSfx = playSfx; window.__SFX = SFX;
  ["dooropen", "doorslam", "welcome", "goodbye", "imrcv"].forEach(function (n) { var a = new Audio(); a.preload = "auto"; a.src = "assets/sfx/" + n + ".mp3"; SFX[n] = a; });
  /* AIM's "Welcome!" when sound goes on, "Goodbye!" when it goes off */
  sndBtn.addEventListener("click", function () { playSfx(soundOn ? "goodbye" : "welcome"); });
  sndBtn.addEventListener("click", function () { soundOn = !soundOn; paintSnd(); try { localStorage.setItem("doorSound", soundOn ? "on" : "off"); } catch (e) {} if (soundOn && window.__bmwRetry) setTimeout(window.__bmwRetry, 50); if (window.__setMuted) { if (soundOn) window.__setMuted(false); else setTimeout(function () { if (!soundOn) window.__setMuted(true); }, 900); } document.dispatchEvent(new Event("lm-sound")); });
  function audio() { if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); } if (ctx.state === "suspended") ctx.resume(); return ctx; }
  function tone(c, f1, f2, t0, d, g, type) { var o = c.createOscillator(), v = c.createGain(); o.type = type || "sine"; o.frequency.setValueAtTime(f1, t0); o.frequency.exponentialRampToValueAtTime(f2, t0 + d); v.gain.setValueAtTime(.0001, t0); v.gain.exponentialRampToValueAtTime(g, t0 + .02); v.gain.exponentialRampToValueAtTime(.0001, t0 + d); o.connect(v).connect(c.destination); o.start(t0); o.stop(t0 + d + .05); }
  function creak(c, t0, d, up) { var n = c.sampleRate * d, b = c.createBuffer(1, n, c.sampleRate), x = b.getChannelData(0); for (var i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * (Math.sin(i / (c.sampleRate / 38)) > .6 ? 1 : .25); var s = c.createBufferSource(); s.buffer = b; var f = c.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 9; f.frequency.setValueAtTime(up ? 380 : 900, t0); f.frequency.linearRampToValueAtTime(up ? 900 : 380, t0 + d); var g = c.createGain(); g.gain.setValueAtTime(.0001, t0); g.gain.linearRampToValueAtTime(.18, t0 + .05); g.gain.linearRampToValueAtTime(.0001, t0 + d); s.connect(f).connect(g).connect(c.destination); s.start(t0); }
  function doorSound(open) {
    /* the real AIM sounds: buddy door opening as a door opens, the door slam as it closes */
    if (!soundOn) return; playSfx(open ? "dooropen" : "doorslam"); return;
    var c = audio(); if (!c) return; var t0 = c.currentTime + .01;
    if (open) { creak(c, t0, .45, true); tone(c, 523, 523, t0 + .32, .18, .12, "triangle"); tone(c, 784, 784, t0 + .46, .32, .12, "triangle"); }
    else { tone(c, 784, 784, t0, .16, .1, "triangle"); tone(c, 523, 523, t0 + .13, .22, .1, "triangle"); creak(c, t0 + .05, .3, false); tone(c, 140, 60, t0 + .34, .18, .35, "sine"); }
  }

  /* ---------- pop-ups: one helper opens and closes them all ---------- */
  var stack = [];
  function openModal(m, from) {
    m.hidden = false; stack.push({ m: m, from: from || document.activeElement });
    /* every pop-up other than a room arrives with AIM's message-received sound */
    if (soundOn && m.id !== "room" && window.__playSfx) window.__playSfx("imrcv");
    document.body.style.overflow = "hidden";
    var f = m.querySelector("[data-close]"); if (f) setTimeout(function () { f.focus(); }, 30);
  }
  function closeModal(m) {
    if (!m || m.hidden) return;
    m.hidden = true;
    var i = stack.findIndex(function (s) { return s.m === m; }), entry = stack[i]; stack.splice(i, 1);
    if (m.onclose) m.onclose();
    if (!stack.length) document.body.style.overflow = "";
    if (entry && entry.from && entry.from.focus) entry.from.focus({ preventScroll: true });
  }
  all(".modal,.full").forEach(function (m) {
    m.addEventListener("click", function (e) { if (e.target === m || e.target.closest("[data-close]")) closeModal(m); });
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && stack.length) closeModal(stack[stack.length - 1].m); });

  /* ---------- rooms ---------- */
  var room = $("room"), roomBody = $("roomBody"), roomName = $("roomName"), roomDoor = null;
  function text(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function slotHtml(p, i) {
    var stage;
    if (p.preview) stage = '<iframe data-src="' + p.preview + (/vans-cove/.test(p.preview) ? "?embed=room" : /wildkind\/showcase/.test(p.preview) ? "?embed=1" : "") + '" title="' + text(p.name) + ' preview" tabindex="-1" aria-hidden="true"></iframe>' + (p.site ? "" : '<span class="slot-cue">Open preview ↗</span>');
    else {
      var bg = p.koi ? KOI_SVG : (p.pics && p.pics[0] ? '<img class="slot-bg" src="' + p.pics[0][0] + '" alt="" loading="lazy">' : "");
      if (!bg && !p.logo) bg = '<span class="slot-name">' + text(p.name) + '</span>';
      stage = bg + (p.logo ? '<img class="slot-logo" src="' + p.logo + '" alt="" loading="lazy">' : "") + '<span class="slot-soon">Preview coming soon</span><span class="slot-cue">See details →</span>';
    }
    var more = p.learn ? '<button type="button" class="learn" data-p="' + i + '">Visit ' + text(p.name) + ' →</button>' : p.preview && !p.noDetails ? '<button type="button" class="slot-more" data-p="' + i + '">Project details →</button>' : "";
    return '<article class="slot' + (p.preview ? "" : " no-pv") + '" data-slot="' + i + '"><button type="button" class="slot-stage" data-p="' + i + '" aria-label="' + (p.site ? "Visit the " + text(p.name) + " site" : (p.preview ? "Open the " : "See details for ") + text(p.name) + (p.preview ? " preview" : "")) + '">' + stage + '</button>'
      + '<div class="slot-info">' + (p.kick ? '<span class="slot-kick">' + text(p.kick) + '</span>' : "") + '<h3>' + text(p.name) + '</h3>' + (p.one ? '<p>' + text(p.one) + '</p>' : "") + more + '</div></article>';
  }
  var current = null;
  /* a bar at the top of a room that jumps straight to any project in it */
  function jumpHtml(R) {
    return '<nav class="room-jump" aria-label="Jump to a project"><span>Jump to</span>' + R.projects.map(function (p, i) { return '<button type="button" data-jump="' + i + '">' + text(p.name) + '</button>'; }).join("") + '</nav>';
  }
  roomBody.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-jump]"); if (!b) return;
    var a = roomBody.querySelector('[data-slot="' + b.dataset.jump + '"]'); if (!a) return;
    var bar = roomBody.querySelector(".room-jump"), off = bar ? bar.offsetHeight + 16 : 16;
    roomBody.scrollTo({ top: a.getBoundingClientRect().top - roomBody.getBoundingClientRect().top + roomBody.scrollTop - off, behavior: reduce ? "auto" : "smooth" });
    all("[data-jump]", roomBody).forEach(function (x) { x.classList.toggle("on", x === b); });
  });
  /* a live preview fills its box: on a phone-sized box the page is shown at phone width (its own mobile layout, game and logo big),
     otherwise at 1440 px wide, then scaled to fit */
  function fitFrame(box, f) {
    var W = box.clientWidth, H = box.clientHeight; if (!W) return;
    var off = f.offsetTop || 0, src = f.dataset.src || f.src || "";
    /* these two pages only come in a wide layout: on a phone, zoom in on the logo and game instead of shrinking the whole page */
    /* Van's Cove centers its own game when embedded, so only the Sanctuary needs the zoom */
    var fixed = /sanctuary/.test(src), focus = .5;
    if (W < 520 && fixed) {
      /* the Sanctuary only has a wide layout: show the whole page, scaled to fit the phone, instead of a cropped corner */
      var k2 = W / 1280; f.style.width = "1280px"; f.style.height = Math.round((H - off) / k2) + "px"; f.style.transform = "scale(" + k2.toFixed(4) + ")"; return;
    }
    var base = W < 520 ? 430 : 1440;
    f.style.width = base + "px"; f.style.height = Math.round((H - off) * base / W) + "px";
    f.style.transform = "scale(" + (W / base) + ")";
  }
  function enterRoom(key, from) {
    var R = ROOMS[key]; if (!R) return;
    current = R; roomDoor = from;
    roomName.textContent = R.name;
    if (R.template) roomBody.innerHTML = $(R.template).innerHTML;
    else {
      var body;
      if (R.layout === "career") {
        body = jumpHtml(R) + '<div class="slots feature">' + slotHtml(R.projects[0], 0) + '</div>'
          + '<h3 class="room-sub">' + (R.moreLabel || "More projects") + '<span class="dot">.</span></h3>'
          + '<div class="slots small">' + R.projects.slice(1).map(function (p, i) { return slotHtml(p, i + 1); }).join("") + '</div>';
      } else body = jumpHtml(R) + '<div class="slots">' + R.projects.map(slotHtml).join("") + '</div>';
      roomBody.innerHTML = '<div class="room-pad">' + body
        + (R.cta ? '<div class="next-cta"><p>Working on something that deserves to spread?<br>Let\'s talk.</p><a href="#connect" data-close>Get in touch ↘</a></div>' : '<div style="height:clamp(28px,4vw,48px)"></div>') + '</div>';
      fitSlots();
    }
    roomBody.scrollTop = 0;
    all(".door").forEach(function (d) { d.setAttribute("aria-expanded", d.dataset.room === key); });
    if (Date.now() - (window.__doorHoverAt || 0) > 2500) doorSound(true);
    if (key === "about") wireAbout();
    openModal(room, from);
    roomBody.scrollTop = 0;
  }
  /* hovering a door plays the AIM door-opening sound (once per hover) */
  all(".door").forEach(function (d) { var last = 0; d.addEventListener("mouseenter", function () { setTimeout(function () { if (!realHover() || !d.matches(":hover")) return; var n = Date.now(); if (n - last > 1200) { last = n; window.__doorHoverAt = n; doorSound(true); } }, 40); }); });
  room.onclose = function () { __quietUntil = Date.now() + 1500; all(".door").forEach(function (d) { d.setAttribute("aria-expanded", "false"); }); doorSound(false); roomBody.innerHTML = ""; };
  /* live previews: load each one as it scrolls into the room, scaled from 1440 px wide */
  var slotRO = "ResizeObserver" in window ? new ResizeObserver(function (es) { es.forEach(function (e) { var f = e.target.querySelector("iframe"); if (f) fitFrame(e.target, f); }); }) : null;
  function fitSlots() {
    all(".slot-stage", roomBody).forEach(function (st) {
      var f = st.querySelector("iframe"); if (!f) return;
      if (slotRO) slotRO.observe(st); else fitFrame(st, f);
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { f.src = f.dataset.src; io.disconnect(); } }, { root: roomBody, rootMargin: "300px" });
        io.observe(st);
      } else f.src = f.dataset.src;
    });
  }
  roomBody.addEventListener("click", function (e) {
    var b = e.target.closest("[data-p]"); if (!b || !current || !current.projects) return;
    var p = current.projects[+b.dataset.p];
    /* Pollinate has no details popup: the film and its button both go straight to the real site */
    if (p.site) openFull(p.site, p.name, b);
    else if (b.classList.contains("slot-stage") && p.preview) openPreview(p.preview, b);
    else if (p.full) openFull(p.full, p.name, b);
    else openProject(p, b);
  });
  roomBody.addEventListener("click", function (e) { var a = e.target.closest("a[href='#connect']"); if (a) { e.preventDefault(); closeModal(room); $("connect").scrollIntoView({ behavior: "smooth" }); } });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-room]"); if (!b) return;
    e.preventDefault();
    var d = document.querySelector('.door[data-room="' + b.dataset.room + '"]');
    if (b.classList.contains("door") || !d) { enterRoom(b.dataset.room, b); return; }
    /* from a link: bring the door into view, open it a crack, then step in */
    d.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    var w = d.closest(".wall"); w.classList.add("shelf-in", "open-a-crack");
    setTimeout(function () { w.classList.remove("open-a-crack"); enterRoom(b.dataset.room, d); }, reduce ? 0 : 650);
  });

  /* ---------- project details ---------- */
  var proj = $("proj"), pImg = $("projImg"), pThumbs = $("projThumbs");
  function openProject(p, from) {
    $("projTitle").textContent = p.name;
    $("projOne").textContent = p.one || "";
    $("projKick").textContent = current && current.name === "Workshop" ? "Career" : "Personal project";
    var facts = $("projFacts"); facts.innerHTML = (p.facts || []).map(function (f) { return "<div><dt>" + text(f[0]) + "</dt><dd>" + text(f[1]) + "</dd></div>"; }).join(""); facts.hidden = !facts.innerHTML;
    var more = $("projMore"); more.innerHTML = p.more || ""; more.hidden = !p.more;
    var pics = p.pics || [], media = proj.querySelector(".proj-media");
    var old = media.querySelector(".koi-media"); if (old) old.remove();
    if (p.koi) { pImg.hidden = true; media.insertAdjacentHTML("afterbegin", '<div class="koi-media" style="position:relative;aspect-ratio:4/3;border-radius:22px;overflow:hidden">' + KOI_SVG + '</div>'); }
    else pImg.hidden = false;
    function show(k) { pImg.src = pics[k][0]; pImg.alt = pics[k][1]; all("button", pThumbs).forEach(function (b, i) { b.setAttribute("aria-current", i === k); }); }
    pThumbs.innerHTML = pics.map(function (x, i) { return '<button type="button" aria-label="Show image ' + (i + 1) + '"><img src="' + x[0] + '" alt=""></button>'; }).join("");
    all("button", pThumbs).forEach(function (b, i) { b.addEventListener("click", function () { show(i); }); });
    pThumbs.hidden = pics.length < 2;
    if (pics.length) show(0);
    openModal(proj, from);
    proj.querySelector(".proj-card").scrollTop = 0;
  }
  proj.onclose = function () {};

  /* ---------- live preview pop-up ---------- */
  var pv = $("pv"), pvFrame = $("pvFrame"), pvStage = $("pvStage");
  function fitPreview() {
    if (pv.hidden) return;
    /* phones get the game at full phone size, in its own phone layout */
    if (innerWidth < 600) { var pw = innerWidth - 20, ph = innerHeight - 90; pvStage.style.width = pw + "px"; pvStage.style.height = ph + "px"; pvFrame.style.width = pw + "px"; pvFrame.style.height = ph + "px"; pvFrame.style.transform = "none"; return; }
    pvFrame.style.width = ""; pvFrame.style.height = "";
    var k = Math.min(Math.min(innerWidth - 40, 1440) / 1440, (innerHeight - 110) / 900);
    pvStage.style.width = Math.round(1440 * k) + "px"; pvStage.style.height = Math.round(900 * k) + "px"; pvFrame.style.transform = "scale(" + k + ")";
  }
  function openPreview(src, from) { if (pvFrame.getAttribute("src") !== src) pvFrame.src = src; openModal(pv, from); fitPreview(); }
  addEventListener("resize", fitPreview);
  document.addEventListener("click", function (e) { var b = e.target.closest("[data-preview]"); if (b) openPreview(b.dataset.preview, b); });

  /* ---------- full-screen pages ---------- */
  var full = $("full"), fullFrame = $("fullFrame");
  function openFull(href, name, from) { fullFrame.src = href; $("fullTitle").textContent = name; $("fullOpen").href = href; openModal(full, from); }
  full.onclose = function () { fullFrame.src = "about:blank"; };
  document.addEventListener("click", function (e) { var a = e.target.closest("a[data-full]"); if (!a) return; e.preventDefault(); openFull(a.getAttribute("href"), a.dataset.full, a); });

  /* ---------- About room: résumé download ---------- */
  function wireAbout() {
    var dl = $("dlResume"), note = $("dlNote");
    dl.addEventListener("click", function () {
      note.hidden = true; balloons(3, dl);
      var save = window.__downloads;
      if (!save) { window.open("resume.pdf", "_blank", "noopener"); return; }
      fetch("resume.pdf").then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
        .then(function (buf) { return save.save({ filename: "Lindsay_Morton_Resume.pdf", data: buf }); })
        .catch(function (err) { if (err && err.code === "declined") return; note.textContent = "The download didn't start here. Reach out on LinkedIn and I'll send it over."; note.hidden = false; });
    });
    if (window.wireResumeBot) window.wireResumeBot();
  }

  /* ---------- Let's connect: clouds drop; two hang from the Career shelf ---------- */
  var connect = $("connect");
  whenSeen(connect, function () {
    connect.classList.add("in");
    /* "You've got mail!" as the note floats down */
    all(".cl:not(.shelf-cloud)", connect).forEach(function (c) { c.classList.add("drop"); });
    all(".shelf-cloud", connect).forEach(function (c) { c.classList.add("drop"); });
  }, 0);
  /* every cloud's string ties onto the underside of the Workshop shelf, spread along its length */
  var careerShelf = $("careerWall").querySelector(".shelf"), skyClouds = all(".connect-sky .cl", connect);
  /* clouds have their own layout per screen size:
     wide screens  - four big clouds spread across the whole sky, hanging from the top on strings of different lengths
     narrow screens - they tie onto the underside of the Workshop shelf, which spans the screen there */
  function hangClouds() {
    if (!skyClouds.length) return;
    var k = connect.getBoundingClientRect(), W = k.width, n = skyClouds.length;
    if (innerWidth > 900) {
      /* four different sizes, bigger than before: one huge, one large, one medium, one small-ish */
      var sz = [.30, .22, .26, .17], xs = [.15, .41, .66, .89], lens = [.5, 1, .2, .75], base = Math.max(40, Math.min(160, W * .08));
      skyClouds.forEach(function (c, i) {
        var cw = Math.max(220, Math.min(620, W * sz[i % 4]));
        c.style.width = cw + "px"; c.style.right = "auto"; c.style.top = "0px";
        c.style.left = Math.max(-cw * .12, Math.min(W - cw * .88, W * xs[i % 4] - cw / 2)) + "px";
        c.style.setProperty("--len", (20 + base * lens[i % 4]) + "px");
        c.style.setProperty("--d", (i * .12) + "s");
      });
      return;
    }
    if (!careerShelf) return;
    var s = careerShelf.getBoundingClientRect(), tieY = s.bottom + 10 - k.top, slot = s.width / n, cwn = Math.min(220, Math.max(slot * 1.25, 100));
    skyClouds.forEach(function (c, i) {
      c.style.width = cwn + "px"; c.style.right = "auto"; c.style.top = tieY + "px";
      c.style.left = (s.left - k.left + slot * (i + .5) - cwn / 2) + "px";
      c.style.setProperty("--len", (Math.max(0, -tieY) + 46) + "px");
      c.style.setProperty("--d", (i * .12) + "s");
    });
  }
  hangClouds(); addEventListener("resize", hangClouds); addEventListener("load", hangClouds);
  /* images above load late and shift things down, so re-tie whenever the layout settles */
  if ("ResizeObserver" in window) { var hcT; new ResizeObserver(function () { clearTimeout(hcT); hcT = setTimeout(hangClouds, 120); }).observe(document.querySelector(".page")); }
  $("careerWall").addEventListener("shelf", function () { setTimeout(hangClouds, 950); });
  whenSeen(connect, hangClouds, 0);

  /* once the page has loaded, quietly fetch the rest of the images in page order, so they're ready before you scroll to them */
  function warmImages() {
    var lazy = all('img[loading="lazy"]'), i = 0;
    (function next() {
      for (var k = 0; k < 6 && i < lazy.length; k++, i++) lazy[i].loading = "eager";
      if (i < lazy.length) setTimeout(next, 250);
      else setTimeout(function () { all(".brew-view iframe").forEach(function (f, k) { setTimeout(function () { if (!f.getAttribute("src")) f.src = f.dataset.src; }, k * 1500); }); }, 1500);
    })();
  }
  if (document.readyState === "complete") setTimeout(warmImages, 800); else addEventListener("load", function () { setTimeout(warmImages, 800); });

  /* where the vortex meets the doors: a shimmer and a poof of smoke as the wall arrives */
  var seam = $("seam");
  if (seam && "IntersectionObserver" in window) {
    var seamIO = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { seam.classList.remove("poof"); void seam.offsetWidth; seam.classList.add("poof"); } }, { rootMargin: "0px 0px -35% 0px" });
    seamIO.observe($("doors"));
  }

  /* whimsy: give every floating thing its own wobble, tilt, drift and timing, so nothing moves in lockstep */
  function R(a, b) { return a + Math.random() * (b - a); }
  function px(a, b) { return R(a, b).toFixed(0) + "px"; }
  function dg(a, b) { return R(a, b).toFixed(1) + "deg"; }
  all(".out").forEach(function (o) {
    var st = o.style, big = o.offsetWidth > 120 ? .7 : 1;
    st.setProperty("--bd", R(3.2, 7).toFixed(2) + "s"); st.setProperty("--bo", R(0, 1.5).toFixed(2) + "s");
    st.setProperty("--bx1", px(-10 * big, 10 * big)); st.setProperty("--by1", px(-18 * big, -4)); st.setProperty("--br1", dg(-6, 6));
    st.setProperty("--bx2", px(-12 * big, 12 * big)); st.setProperty("--by2", px(-24 * big, -6)); st.setProperty("--br2", dg(-7, 7));
    st.setProperty("--bx3", px(-8, 8)); st.setProperty("--by3", px(-10, 2)); st.setProperty("--br3", dg(-4, 4));
  });
  all(".out.ws-balloon").forEach(function (o) {
    var st = o.style, dir = Math.random() < .5 ? -1 : 1;
    st.setProperty("--fd", R(1.9, 3).toFixed(2) + "s"); st.setProperty("--fo", R(0, .5).toFixed(2) + "s");
    st.setProperty("--fx1", px(-10, 10)); st.setProperty("--fx2", (dir * R(20, 90)).toFixed(0) + "px");
    st.setProperty("--fx3", (-dir * R(10, 70)).toFixed(0) + "px"); st.setProperty("--fx4", (dir * R(30, 160)).toFixed(0) + "px");
    st.setProperty("--bby", px(-18, -6)); st.setProperty("--bbr", dg(-8, 8));
  });
  all("#balloons img").forEach(function (b) {
    var st = b.style, dir = Math.random() < .5 ? -1 : 1;
    st.setProperty("--fd", R(4.2, 7.5).toFixed(2) + "s");
    st.setProperty("--fx1", (dir * R(1, 6)).toFixed(1) + "vw"); st.setProperty("--fx2", (-dir * R(1, 7)).toFixed(1) + "vw"); st.setProperty("--fx3", (dir * R(0, 9)).toFixed(1) + "vw");
  });
  all(".cl").forEach(function (c) { c.style.setProperty("--swd", R(3.5, 7.5).toFixed(2) + "s"); if (!c.style.getPropertyValue("--sw")) c.style.setProperty("--sw", dg(-4, 4)); });

  /* coming out of the vortex, the page lands on the first door and holds a beat, so you don't fly past it */
  (function () {
    var doors = $("doors"), landed = false;
    var lastW = 0, landT = 0;
    function block(e) { e.preventDefault(); lastW = performance.now(); }
    var holdAt = null;
    function pin() { if (holdAt !== null && Math.abs(scrollY - holdAt) > 2) { scrollTo(0, holdAt); lastW = performance.now(); } }
    function release() { holdAt = null; removeEventListener("scroll", pin); removeEventListener("wheel", block); removeEventListener("touchmove", block); root.style.scrollBehavior = ""; }
    /* hold until the momentum of the flick that brought you here has died out (a fresh scroll goes on) */
    function waitStill() { var n = performance.now(); if (n - landT > 2000 || (n - landT > 1000 && n - lastW > 420)) release(); else setTimeout(waitStill, 60); }
    addEventListener("scroll", function land() {
      if (landed || root.classList.contains("tall") || reduce || window.__vxDived) return;
      var t = doors.getBoundingClientRect().top;
      if (t < innerHeight * .6 && t > -innerHeight * .5) {
        landed = true; removeEventListener("scroll", land);
        var from = scrollY, to = scrollY + t, t0l = performance.now(), dur = 650;
        addEventListener("wheel", block, { passive: false }); addEventListener("touchmove", block, { passive: false });
        root.style.scrollBehavior = "auto";
        (function f(now) {
          var k = Math.min(1, (now - t0l) / dur), e = 1 - Math.pow(1 - k, 3);
          scrollTo(0, from + (to - from) * e);
          if (k < 1) requestAnimationFrame(f);
          else { holdAt = to; addEventListener("scroll", pin, { passive: true }); landT = performance.now() - 650; lastW = performance.now(); waitStill(); }
        })(t0l);
      }
    }, { passive: true });
  })();

  /* the TV switches on and its lines tune in once the card is on screen */
  all(".like-tv").forEach(function (c) { whenSeen(c, function () { c.classList.add("on"); }, .4); });

  /* clicking anywhere on the Stealth mode card pops the same access form up front, with the code requirement highlighted */
  (function () {
    var card = document.querySelector(".brew-locked"), pop = $("lockPop"), form = $("lockForm"); if (!card || !pop || !form) return;
    var home = form.parentNode, next = form.nextSibling;
    card.style.cursor = "pointer";
    card.addEventListener("click", function (e) {
      if (e.target.closest("form,input,button,a")) return;
      $("lockSlot").appendChild(form); openModal(pop, card);
      pop.classList.remove("need"); void pop.offsetWidth; pop.classList.add("need");
      setTimeout(function () { var h = $("lockClue"); (h && !h.hidden ? h.querySelector("input") : $("lockCode")).focus(); }, 60);
    });
    pop.onclose = function () { home.insertBefore(form, next); };
  })();

  /* the TV: each channel is a late-night throwback; turn the knob (or the button) to flip through them, ending on the picks */
  (function () {
    var tv = document.querySelector(".like-tv:not(.like-radio) .tv"); if (!tv) return;
    var vid = tv.querySelector(".tv-vid"), num = tv.querySelector(".tv-chnum"), ch = 0;
    var CH = [["sVvw0VjpBDU", "Pure Moods", 3], ["MXSUF_aGv5U", "Boy Meets World", 4], ["I2OHc4OvjVc", "FernGully", 5], ["wL6pCdpNPNI", "Sabrina the Teenage Witch", 6], [null, "My picks", 7]];
    /* browsers only let a video start WITH sound after the visitor has clicked or tapped somewhere on the page;
       before that it starts muted, with a little "tap for sound" chip */
    function canSound() { return !!(navigator.userActivation ? navigator.userActivation.hasBeenActive : window.__tapped); }
    addEventListener("pointerdown", function () { window.__tapped = true; }, { capture: true, once: true });
    function show(i, autoplay) {
      var c = CH[i]; tv.classList.toggle("on-list", !c[0]); num.textContent = "CH " + c[2];
      var now = $("tvNow"), yt = $("tvYT"); if (now) now.textContent = "CH " + c[2] + " · " + c[1]; if (yt) { yt.hidden = !c[0]; if (c[0]) yt.href = "https://www.youtube.com/watch?v=" + c[0]; }
      vid.innerHTML = c[0] ? '<iframe src="https://www.youtube-nocookie.com/embed/' + c[0] + '?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&start=2' + (autoplay ? "&autoplay=1" + (canSound() ? "" : "&mute=1") : "") + (location.origin && location.origin !== "null" ? "&origin=" + encodeURIComponent(location.origin) : "") + '" referrerpolicy="strict-origin-when-cross-origin" title="' + c[1] + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>' : "";
    }
    /* talk to the YouTube player so it plays the instant you hover */
    function cmd(f, args) { var fr = vid.querySelector("iframe"); if (fr && fr.contentWindow) fr.contentWindow.postMessage(JSON.stringify({ event: "command", func: f, args: args || [] }), "*"); }
    function fast() {}
    /* YouTube only takes commands after a "listening" handshake: do it as soon as the player loads,
       then quietly buffer the clip (muted play, pause at 0) so hovering starts it instantly */
    var ytReady = false, ytState = -1, primed = false;
    addEventListener("message", function (e) {
      if (!/youtube/.test(e.origin)) return; var d; try { d = JSON.parse(e.data); } catch (er) { return; }
      if (d.event === "onReady" || d.event === "initialDelivery" || d.event === "infoDelivery") ytReady = true;
      if (d.info && typeof d.info.playerState === "number") {
        ytState = d.info.playerState;
        if (ytState === 1 && !primed && !tvLive) { primed = true; cmd("pauseVideo"); cmd("seekTo", [2, true]);   /* the commercial gets going 2 seconds in */ setTimeout(function () { if (!tvLive) cmd("unMute"); }, 150); }
      }
    });
    vid.addEventListener("load", function () {
      ytReady = false; ytState = -1; primed = tvLive;
      var fr = vid.querySelector("iframe"), n = 0;
      (function hello() { if (!fr || !fr.isConnected || ytReady || n++ > 40) return; try { fr.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*"); } catch (er) {} setTimeout(hello, 120); })();
      (function prime() { if (tvLive) return; if (!ytReady) { setTimeout(prime, 150); return; } cmd("mute"); cmd("playVideo"); })();
    }, true);
    /* the player loads well before the TV is on screen, so it's ready the moment you hover */
    (function () { var bey = $("beyond") || tv; if (!("IntersectionObserver" in window)) { show(0, false); return; }
      new IntersectionObserver(function (es, ob) { if (es[0].isIntersecting) { ob.disconnect(); if (!vid.innerHTML) show(0, false); } }, { rootMargin: "1200px 0px" }).observe(bey); })();
    /* hovering the TV starts the commercial playing and stops Boy Meets World */
    var tvLive = false;
    tv.closest(".like-tv").addEventListener("pointerenter", function (e) {
      if (tvLive) return;
      if (e.pointerType === "mouse") { var el = this; setTimeout(function () { if (!tvLive && realHover() && el.matches(":hover")) startTV(); }, 40); return; }
      startTV();
    });
    function startTV() {
      if (tvLive) return; tvLive = true;
      /* the player is already loaded: tell it to play right away; if it hasn't started a moment later, reload it with autoplay */
      var started = false;
      function onMsg(e) { if (!/youtube/.test(e.origin)) return; try { var d = JSON.parse(e.data); if (d.info && d.info.playerState === 1) started = true; } catch (er) {} }
      addEventListener("message", onMsg);
      var fr = vid.querySelector("iframe");
      if (fr && ytReady && canSound()) { cmd("unMute"); cmd("setVolume", [80]); cmd("playVideo"); setTimeout(function () { removeEventListener("message", onMsg); if (!started && ytState !== 1) show(ch, true); }, 2500); }
      else { removeEventListener("message", onMsg); show(ch, true); }
      if (!canSound()) {
        var chip = document.createElement("button"); chip.type = "button"; chip.className = "tv-sound"; chip.textContent = "🔊 Tap for sound";
        tv.appendChild(chip);
        chip.addEventListener("click", function (e) { e.stopPropagation(); chip.remove(); show(ch, true); });
      }
      if (window.__bmwStop) window.__bmwStop();
    }
    function change() {
      ch = (ch + 1) % CH.length; tv.classList.add("flip");
      setTimeout(function () { show(ch, true); fast(); }, 220);
      setTimeout(function () { tv.classList.remove("flip"); }, 650);
    }
    all(".tv-knob, .tv-chbtn", tv).forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); change(); }); });
    /* click the TV and it pops up in its own window, big; close it to put it back */
    var home = tv.parentNode, next = tv.nextSibling, pop = $("tvPop");
    tv.closest(".like-tv").addEventListener("click", function (e) {
      if (e.target.closest(".tv-knob,.tv-chbtn") || tv.closest("#tvPop")) return;
      $("tvSlot").appendChild(tv); openModal(pop, home);
    });
    pop.onclose = function () { home.insertBefore(tv, next); };
  })();

  /* the Boy Meets World theme plays as you step into the garden (My art), and fades out when you leave it */
  (function () {
    var artSec = $("art"); if (!artSec || !("IntersectionObserver" in window)) return;
    var song = new Audio("assets/sfx/bmw.mp3"); song.preload = "none"; song.volume = .5; window.__bmwSong = song;
    var fade = null, inArt = false;
    function fadeTo(v, then) { clearInterval(fade); fade = setInterval(function () { var d = v - song.volume; if (Math.abs(d) < .04) { song.volume = v; clearInterval(fade); if (then) then(); } else song.volume += d > 0 ? .04 : -.04; }, 60); }
    function start() {
      if (!soundOn) return; song.volume = 0;
      var pr = song.play(); if (pr && pr.then) pr.then(function () { fadeTo(.5); }).catch(function () {
        function retry() { removeEventListener("pointerdown", retry, true); removeEventListener("keydown", retry, true); if (inArt) start(); }
        addEventListener("pointerdown", retry, true); addEventListener("keydown", retry, true);
      });
    }
    /* it starts as the garden comes up and keeps playing for the rest of the site; scrolling back above the garden fades it out */
    song.loop = false; var songEnded = false; song.addEventListener("ended", function () { songEnded = true; });
    /* Boy Meets World runs from Now brewing on, until the TV is hovered */
    var brewSec = $("brew") || artSec, beySec = $("beyond");
    function check() {
      /* it keeps going past Beyond work until you hover the TV, which starts the commercial and stops the song for good */
      var now = !tvOn && brewSec.getBoundingClientRect().top < innerHeight * .6;
      if (now === inArt) return; inArt = now;
      if (inArt) { if (window.__stopTheme) window.__stopTheme(); if (!songEnded && (song.paused || song.volume < .5)) start(); }
      else if (!song.paused) fadeTo(0, function () { song.pause(); });
    }
    var tvOn = false;
    window.__bmwStop = function () { if (tvOn) return; tvOn = true; inArt = false; if (!song.paused) fadeTo(0, function () { song.pause(); }); };
    addEventListener("scroll", check, { passive: true }); check();
    window.__bmwRetry = function () { if (inArt && song.paused && !songEnded) start(); };
    sndBtn.addEventListener("click", function () { if (!soundOn && !song.paused) song.pause(); });
  })();

  /* family polaroids float up out of the book stack and drift off to the left and right */
  /* family polaroids drop in as Beyond work arrives, then float up and off to the sides as you scroll on through */
  var polBox = document.querySelector(".polaroids");
  if (polBox && !reduce) {
    var bey = $("beyond"), polT = false;
    function polTick() {
      polT = false; var r = bey.getBoundingClientRect(), H = innerHeight;
      if (r.top < H * .55 && r.bottom > 0) polBox.classList.add("in"); var ac = document.querySelector(".accents"); if (ac && r.top < H * .6 && r.bottom > 0) ac.classList.add("in");
      if (r.top > H) polBox.classList.remove("in");
      var off = Math.min(1, Math.max(0, (-r.top - H * .3) / (r.height * .85)));
      polBox.style.setProperty("--off", off.toFixed(4));
    }
    addEventListener("scroll", function () { if (!polT) { polT = true; requestAnimationFrame(polTick); } }, { passive: true });
    polTick();
  } else if (polBox) polBox.classList.add("in");

  /* the lime ribbon unrolls from the left and wiggles across as you reach the footer */
  var wig = document.querySelector(".wiggle");
  if (wig) whenSeen(wig, function () { wig.classList.add("go"); }, .3);

  /* a glitter dolphin leaps up out of "Beyond", arcs over and dives back into "work" further right, once */
  var dol = document.querySelector(".dolphin");
  if (dol) whenSeen(document.querySelector(".like-tv"), function () { setTimeout(function () { dol.classList.add("leap"); }, 500); }, .45);

  /* a disco ball drops from the star border when Beyond work arrives */
  var disco = document.querySelector(".disco");
  if (disco) whenSeen(disco.closest(".wall") || document.getElementById("beyond"), function () { disco.classList.add("drop"); }, .3);

  /* ---------- ticker: repeat the list so it loops seamlessly ---------- */
  var track = $("mindTrack"); track.innerHTML += track.innerHTML; var track2 = $("mindTrack2"); if (track2) track2.innerHTML += track2.innerHTML;

  /* ---------- Now brewing: each live preview loads once it's on screen and you've paused scrolling, scaled from 1440 px wide ---------- */
  var brew = $("brew"), brewViews = all(".brew-view", brew);
  function fitBrew() { brewViews.forEach(function (v) { fitFrame(v, v.querySelector("iframe")); }); }
  fitBrew(); addEventListener("resize", fitBrew);
  brewViews.forEach(function (v) {
    var f = v.querySelector("iframe");
    if (!("IntersectionObserver" in window)) { f.src = f.dataset.src; return; }
    var wait = null;
    function loadWhenStill() { clearTimeout(wait); wait = setTimeout(function () { removeEventListener("scroll", loadWhenStill); f.src = f.dataset.src; }, 350); }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); if (!f.src || f.src === "about:blank") f.src = f.dataset.src; } }, { rootMargin: "1600px 0px" });
    io.observe(v);
  });
  whenSeen(brew, function () { brew.classList.add("in"); }, 0);
  /* scrolling past it sends balloons up through the art lawn */
  var bl = $("balloons"), seenBrew = false;
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) {
    var e = es[0]; if (e.isIntersecting) { seenBrew = true; return; }
    if (seenBrew && e.boundingClientRect.bottom < (e.rootBounds ? e.rootBounds.top + 10 : 0)) { bl.classList.remove("go"); void bl.offsetWidth; bl.classList.add("go"); seenBrew = false; }
  }).observe(brew);

  /* ---------- Now brewing: the private project ----------
     The lookbook is stored encrypted with the access code, so it can only be read once the right code is typed. */
  var lockForm = $("lockForm"), lockNote = $("lockNote"), boxes = all("#lockLetters input"), lockMode = "code", lumiUrl = null;
  $("lockHint").addEventListener("click", function () {
    /* the hint link disappears and the clue takes its place */
    var clue = $("lockClue"); clue.hidden = false; this.setAttribute("aria-expanded", "true"); this.hidden = true;
    lockMode = "letters"; boxes[0].focus();
  });
  $("lockCode").addEventListener("focus", function () { lockMode = "code"; });
  boxes.forEach(function (b, i) {
    b.addEventListener("focus", function () { lockMode = "letters"; b.select(); });
    b.addEventListener("input", function () { b.value = b.value.replace(/[^a-z]/gi, "").toUpperCase().slice(-1); if (b.value && i < 3) boxes[i + 1].focus(); });
    b.addEventListener("keydown", function (e) { if (e.key === "Backspace" && !b.value && i > 0) boxes[i - 1].focus(); });
    b.addEventListener("paste", function (e) { e.preventDefault(); var v = (e.clipboardData.getData("text") || "").replace(/[^a-z]/gi, "").toUpperCase().slice(0, 4 - i); v.split("").forEach(function (ch, j) { boxes[i + j].value = ch; }); boxes[Math.min(3, i + v.length)].focus(); });
  });
  function b64(s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
  async function openLookbook(code) {
    var data = b64((await (await fetch("lumi/lookbook.txt")).text()).trim());
    var salt = data.slice(0, 16), iv = data.slice(16, 28), body = data.slice(28);
    var base = await crypto.subtle.importKey("raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveKey"]);
    var key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt, iterations: 600000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    var html = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, body);
    return URL.createObjectURL(new Blob([html], { type: "text/html" }));
  }
  lockForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    var code = (lockMode === "letters" ? boxes.map(function (b) { return b.value; }).join("") : $("lockCode").value).trim().toLowerCase();
    if (!code) { lockNote.textContent = "Enter the access code first."; return; }
    var btns = all("button[type=submit]", lockForm); btns.forEach(function (b) { b.disabled = true; });
    lockNote.textContent = "Checking…";
    try {
      if (!lumiUrl) lumiUrl = await openLookbook(code);
      lockNote.textContent = "";
      openFull(lumiUrl, "LumiLumber · Private lookbook", lockForm);
    } catch (err) {
      lockNote.textContent = err && err.name === "OperationError" ? "Not quite. Try again." : "The lookbook couldn't load. Try again in a moment.";
      lockForm.classList.remove("shake"); void lockForm.offsetWidth; lockForm.classList.add("shake");
    }
    btns.forEach(function (b) { b.disabled = false; });
  });
  /* the lookbook's Lock button closes it */
  addEventListener("message", function (e) { if (e.data === "lumi-lock") closeModal(full); });

  /* ---------- My art ---------- */
  var art = $("art"), main = $("artMain"), mainImg = main.querySelector(".pa"), wall = $("artWall");
  whenSeen(art, function () { art.classList.add("in"); }, 0);
  /* the peony grows and pops beside the big painting as soon as the painting is on screen */
  whenSeen(document.querySelector(".art-main"), function () { setTimeout(function () { art.classList.add("peony-in"); }, 200); }, .4);
  whenSeen(document.querySelector(".art-patch.l"), function () { setTimeout(function () { art.classList.add("pops-in"); }, 350); }, .2);
  /* the bouquet grows and pops up once the row of paintings is on screen */
  whenSeen($("artWall"), function () { setTimeout(function () { art.classList.add("bloom"); }, 250); }, .15);
  /* six paintings hang around the big one (the rest are in the full-size viewer); picking one swaps it into the big frame */
  var shown = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  wall.innerHTML = shown.map(function (i) {
    var a = ART[i], fr = a.frame || "pink";
    return '<button type="button" data-i="' + i + '" aria-label="Show ' + text(a.t) + '"><span class="pf ' + fr + '"><img class="pa" src="' + a.src + '" alt="" loading="lazy"><img class="pfr" src="' + FRAMES[fr] + '" alt="" loading="lazy"></span></button>';
  }).join("");
  wall.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var small = b.querySelector(".pa"), i = +b.dataset.i, mi = +main.dataset.i;
    mainImg.style.opacity = 0; small.style.opacity = 0;
    setTimeout(function () {
      mainImg.src = ART[i].src; mainImg.alt = ART[i].a; main.dataset.i = i; main.setAttribute("aria-label", "Open " + ART[i].t + " full size");
      small.src = ART[mi].src; b.dataset.i = mi; b.setAttribute("aria-label", "Show " + ART[mi].t);
      mainImg.style.opacity = 1; small.style.opacity = 1;
    }, 220);
  });
  /* hovering a painting blows it up as big as the screen allows, centered */
  function growArt(el, on) {
    if (on) {
      el.style.transform = ""; el.classList.remove("big");
      var r = el.getBoundingClientRect(), k = Math.min(innerHeight * .94 / r.height, innerWidth * .94 / r.width);
      var dx = innerWidth / 2 - (r.left + r.width / 2), dy = innerHeight / 2 - (r.top + r.height / 2);
      el.style.setProperty("--gx", dx.toFixed(0) + "px"); el.style.setProperty("--gy", dy.toFixed(0) + "px"); el.style.setProperty("--gk", k.toFixed(3));
      el.classList.add("big");
    } else el.classList.remove("big");
  }
  all("#artWall button, .art-mainb").forEach(function (el) {
    el.addEventListener("mouseenter", function () { growArt(el, true); });
    el.addEventListener("mouseleave", function () { growArt(el, false); });
    el.addEventListener("focus", function () { growArt(el, true); });
    el.addEventListener("blur", function () { growArt(el, false); });
  });
  addEventListener("scroll", function () { all("#artWall button.big, .art-mainb.big").forEach(function (el) { growArt(el, false); }); }, { passive: true });
  /* hovering a painting makes it bloom: a burst of sparkles, butterflies and flowers */
  /* every painting has its own little celebration: what pops out, and how it moves */
  var THEMES = {
    "dog": { bits: ["holo-heart", "cr-heart", "gem-pink", "gem-star3-pink", "gem-star-glitter"], move: "burst" },
    "roses": { bits: ["butterfly-fly", "butterfly-fly", "fl-magenta_blossom"], move: "flutter" },
    "duck": { bits: ["fl-sunshine_flower", "cr-star-yellow", "gem-star3-yellow"], move: "rain" },
    "cat": { bits: ["fl-coral_flower", "fl-orange_flower", "fl-pink_wildflower"], move: "rise" },
    "bunny": { bits: ["cr-star-blue", "holo-star-blue", "gem-star3-blue", "gem-star-glass", "gem-flower-blue"], move: "spiral" },
    "woman": { bits: ["fl-pink_wildflower", "fl-violet_flower", "butterfly-fly", "gem-flower-blue"], move: "flutter" },
    "keyhole": { bits: ["acc-star6", "acc-star5", "acc-burst-pink", "acc-burst-purple", "acc-star-glitter"], move: "spiral" },
    "collage": { bits: ["fl-coral_flower", "fl-magenta_blossom", "fl-violet_flower", "fl-sunshine_flower"], move: "rise" },
    "geometry": { bits: ["gem-plumbob", "gem-star-glass", "gem-pink", "holo-star-teal", "gem-star-glitter"], move: "burst" },
    "yin": { bits: ["holo-heart", "fl-magenta_blossom", "gem-star3-pink", "gem-flower-blue"], move: "spiral" }
  };
  function themeFor(src) { for (var k in THEMES) if (src.indexOf(k) > -1) return THEMES[k]; return THEMES.dog; }
  function burst(el) {
    if (reduce || el._pop && Date.now() - el._pop < 900) return; el._pop = Date.now();
    var src = (el.querySelector(".pa") || {}).getAttribute ? el.querySelector(".pa").getAttribute("src") : "", th = themeFor(src);
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (var i = 0; i < 22; i++) {
      var im = document.createElement("img"), w = 46 + Math.random() * 46, ang = Math.random() * Math.PI * 2, dist = r.width * (.6 + Math.random() * .6), frames;
      im.src = "assets/proj/" + th.bits[i % th.bits.length] + ".webp"; im.alt = ""; im.className = "pop-bit";
      var sx = cx, sy = cy, rot = (Math.random() - .5) * 540;
      if (th.move === "rain") { sx = r.left + Math.random() * r.width; sy = r.top - 40; }
      if (th.move === "rise") { sx = r.left + Math.random() * r.width; sy = r.bottom; }
      im.style.width = w + "px"; im.style.left = (sx - w / 2) + "px"; im.style.top = (sy - w / 2) + "px";
      document.body.appendChild(im);
      /* every bit stays fully solid and flies right off the left or right side of the screen; each painting's theme shapes the path */
      /* each bit gets its own path: its own start point on the painting, exit height, wiggle and speed */
      sx = r.left + r.width * (.15 + Math.random() * .7); sy = r.top + r.height * (.15 + Math.random() * .7);
      im.style.left = (sx - w / 2) + "px"; im.style.top = (sy - w / 2) + "px";
      var side = i % 2 ? 1 : -1, ex = side < 0 ? -(sx + w + 80) : innerWidth - sx + w + 80;
      var exitY = (Math.random() * innerHeight) - sy, hops = 3 + Math.floor(Math.random() * 3), amp = 40 + Math.random() * 180, ph = Math.random() * Math.PI * 2;
      var flavor = th.move === "rain" ? 1 : th.move === "rise" ? -1 : 0, path = [[0, 0]];
      for (var h = 1; h <= hops; h++) {
        var f = h / hops, ease = th.move === "burst" ? Math.sqrt(f) : f;
        var wig = (th.move === "flutter" || th.move === "spiral") ? Math.sin(ph + f * Math.PI * (2 + Math.random() * 2)) * amp : (Math.random() - .5) * amp;
        path.push([ex * ease, exitY * f + wig * (1 - f * .5) + flavor * amp * Math.sin(f * Math.PI)]);
      }
      frames = path.map(function (pt, n) { var f = n / (path.length - 1); return { transform: "translate(" + pt[0].toFixed(0) + "px," + pt[1].toFixed(0) + "px) rotate(" + (rot * f).toFixed(0) + "deg) scale(" + (n === 0 ? .3 : 1 + f * .2) + ")", opacity: 1 }; });
      var an = im.animate(frames, { duration: 1500 + Math.random() * 1600, easing: ["cubic-bezier(.35,.1,.55,1)", "ease-in", "cubic-bezier(.2,.6,.4,1)", "linear"][i % 4], delay: Math.random() * 450, fill: "backwards" });
      an.onfinish = function () { this.effect.target.remove(); };
    }
  }
  wall.addEventListener("mouseover", function (e) { var b = e.target.closest("button"); if (b && !b.contains(e.relatedTarget)) burst(b); });
  wall.addEventListener("focusin", function (e) { var b = e.target.closest("button"); if (b) burst(b); });
  main.addEventListener("mouseenter", function () { burst(main); });

  /* the big painting opens the viewer */
  var viewer = $("viewer"), vImg = $("viewImg"), vi = 0;
  function showArt(i) { vi = (i + ART.length) % ART.length; var a = ART[vi]; vImg.src = a.src; vImg.alt = a.a; $("viewT").textContent = a.t; $("viewN").textContent = (vi + 1) + " / " + ART.length; }
  main.addEventListener("click", function () { showArt(+main.dataset.i); openModal(viewer, main); });
  $("viewPrev").addEventListener("click", function () { showArt(vi - 1); });
  $("viewNext").addEventListener("click", function () { showArt(vi + 1); });
  document.addEventListener("keydown", function (e) { if (viewer.hidden) return; if (e.key === "ArrowRight") showArt(vi + 1); if (e.key === "ArrowLeft") showArt(vi - 1); });

  /* ---------- Beyond work: tap to peek ---------- */
  all(".like").forEach(function (a) {
    a.addEventListener("click", function () { var o = a.classList.contains("open"); all(".like.open").forEach(function (x) { x.classList.remove("open"); }); if (!o) a.classList.add("open"); });
  });

  /* ---------- Got an idea? ---------- */
  var idea = $("write");
  whenSeen(idea, function () { idea.classList.add("in"); }, .12);
  /* the phone hangs just to the left of the Got an idea words, wherever they land */
  function placePhone() {
    var ph = document.querySelector(".idea .phone"), t = document.querySelector(".idea-in>div"); if (!ph || !t) return;
    if (innerWidth <= 900) { ph.style.left = ""; return; }
    var sec = ph.parentElement.getBoundingClientRect(), tl = t.getBoundingClientRect().left - sec.left;
    ph.style.left = Math.max(8, tl - ph.getBoundingClientRect().width - 34) + "px";
  }
  placePhone(); addEventListener("resize", placePhone); document.querySelector(".idea .phone").addEventListener("load", placePhone);
  $("ideaOpen").addEventListener("click", function (e) { openModal($("ideaForm"), e.currentTarget); setTimeout(function () { $("fName").focus(); }, 50); });
  var addr = "lindsayomorton@gmail.com";
  $("ideaFormEl").addEventListener("submit", function (e) {
    e.preventDefault(); var f = e.target, note = $("formNote");
    var nm = f.name.value.trim(), em = f.email.value.trim(), msg = f.msg.value.trim();
    if (!nm || !em || !msg || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { note.textContent = "Please add your name, a valid email and a message."; return; }
    location.href = "mailto:" + addr + "?subject=" + encodeURIComponent("Hello from " + nm) + "&body=" + encodeURIComponent(msg + "\n\n" + nm + "\n" + em);
    note.textContent = "Your email app should open with this message ready to send. If it doesn't, use the Email me button.";
  });
  if ($("copyMail")) $("copyMail").addEventListener("click", function () {
    var b = this; function done() { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1800); }
    try { navigator.clipboard.writeText(addr).then(done, function () { var r = document.createRange(); r.selectNodeContents($("mailAddr")); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }); } catch (err) {}
  });

  /* ---------- balloons released at big moments ---------- */
  var G = ["holo-star-puffy", "holo-heart", "gem-pink", "holo-star-teal", "holo-star-blue", "holo-star-dark", "gem-flower-blue", "gem-star-glitter", "gem-star3-pink", "gem-plumbob"];
  function balloons(n, origin) {
    if (reduce) return; n = n || 2 + Math.round(Math.random());
    var L = document.createElement("div"); L.className = "lift"; L.setAttribute("aria-hidden", "true");
    var ox = innerWidth * (.15 + Math.random() * .7), oy = innerHeight + 80;
    if (origin) { var r = origin.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) { ox = r.left + r.width / 2; oy = r.top + r.height * .55; } }
    for (var i = 0; i < n; i++) {
      var im = document.createElement("img"), w = Math.round(40 + Math.random() * 44); im.alt = ""; im.src = "assets/proj/" + G[Math.floor(Math.random() * G.length)] + ".webp";
      im.style.cssText = "width:" + w + "px;left:" + (ox - w / 2 + (i - (n - 1) / 2) * w * .9) + "px;top:" + (oy - w / 2) + "px;--dur:" + (8 + Math.random() * 3).toFixed(2) + "s;--del:" + (i * .5 + Math.random() * .3).toFixed(2) + "s;--sw:" + Math.round(-50 + Math.random() * 100) + "px;--r0:" + Math.round(-15 + Math.random() * 30) + "deg;--r1:" + Math.round(-15 + Math.random() * 30) + "deg";
      L.appendChild(im);
    }
    document.body.appendChild(L); setTimeout(function () { L.remove(); }, 13000);
  }
})();

/* a paper airplane flies across the screen and lands on "Float A Note" in the nav when you reach the connect section */
["connect", "connect2"].forEach(function (sid) {
  var sec = document.getElementById(sid), cta = sec && sec.querySelector(".connect-actions .btn");
  if (!sec || !cta || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var done = false;
  new IntersectionObserver(function (es, ob) {
    if (done || !es[0].isIntersecting) return; done = true; ob.disconnect();
    var p = document.createElement("img"); p.src = "assets/proj/paper-plane.gif"; p.alt = ""; p.className = "note-plane"; document.body.appendChild(p);
    var W = innerWidth, H = innerHeight, s = Math.max(240, Math.min(400, W * .24)), dur = 4200, t0 = null;
    /* start off the left edge, drift up and over in a lazy curve, then glide down into the button (re-aimed every frame so it always lands on it) */
    var r0 = cta.getBoundingClientRect(), cx = r0.left + r0.width / 2, P0 = [cx - W * .18, -s * .8], P1 = [cx + W * .22, H * .12], P2 = [cx - W * .12, H * .3];
    function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function step(now) {
      if (t0 === null) t0 = now;
      var t = Math.min(1, (now - t0) / dur), e = ease(t), r = cta.getBoundingClientRect(), P3 = [r.left + r.width / 2, r.top + r.height / 2], u = 1 - e;
      var x = u*u*u*P0[0] + 3*u*u*e*P1[0] + 3*u*e*e*P2[0] + e*e*e*P3[0], y = u*u*u*P0[1] + 3*u*u*e*P1[1] + 3*u*e*e*P2[1] + e*e*e*P3[1];
      var sc = t < .78 ? 1 - t * .35 : (1 - .78 * .35) * Math.max(0, (1 - t) / .22), wob = Math.sin(t * 9) * 6 * (1 - t);
      p.style.transform = "translate(" + (x - s / 2) + "px," + (y - s / 2) + "px) rotate(" + (wob - 6) + "deg) scale(" + sc + ")";
      p.style.opacity = t < .05 ? t / .05 : t > .9 ? Math.max(0, (1 - t) / .1) : 1;
      if (t < 1) requestAnimationFrame(step);
      else { p.remove(); if (window.__mail) window.__mail(); cta.classList.add("note-landed"); setTimeout(function () { cta.classList.remove("note-landed"); }, 1400); }
    }
    requestAnimationFrame(step);
  }, { threshold: .5 }).observe(sec);
});

/* a daisy grows up out of the gem that holds the two fringe swags, and blooms */
(function () {
  var d = document.querySelector(".fringe-daisy"), sec = document.getElementById("beyond");
  if (!d || !sec) return;
  new IntersectionObserver(function (es, ob) {
    if (!es[0].isIntersecting) return; ob.disconnect();
    d.src = d.dataset.src + "?t=" + Date.now(); d.classList.add("grow");
  }, { threshold: 0, rootMargin: "0px 0px -10% 0px" }).observe(d.closest(".fringe") || sec);
})();

/* the old-internet window pops up when you reach it */
(function () { var o = document.getElementById("oldweb"); if (!o) return; if (!("IntersectionObserver" in window)) { o.classList.add("in"); return; }
  new IntersectionObserver(function (es, ob) { if (es[0].isIntersecting) { o.classList.add("in"); ob.disconnect(); } }, { threshold: .2 }).observe(o); })();

/* the repeated Float A Note at the bottom: clouds drop and hang the same way */
(function () {
  var c = document.getElementById("connect2"); if (!c) return;
  var cl = Array.prototype.slice.call(c.querySelectorAll(".connect-sky .cl"));
  function hang() {
    var W = c.getBoundingClientRect().width, sz = [.30, .22, .26, .17], xs = [.15, .41, .66, .89], lens = [.5, 1, .2, .75], base = Math.max(40, Math.min(160, W * .08));
    /* strings tie onto the bottom edge of the old-internet window above */
    var win = document.querySelector(".ow-win"), k = c.getBoundingClientRect(), wr = win ? win.getBoundingClientRect() : null;
    var tie = wr ? wr.bottom - k.top - 60 : 0, wl = wr ? wr.left - k.left + 30 : 0, ww = wr ? wr.width - 60 : W;
    cl.forEach(function (e, i) { var cw = innerWidth > 900 ? Math.max(160, Math.min(560, W * [.32, .16, .25, .12][i % 4])) : Math.max(110, W * .3);
      var cx = wl + ww * [.08, .38, .66, .94][i % 4];
      e.style.width = cw + "px"; e.style.right = "auto"; e.style.top = tie + "px";
      e.style.left = (cx - cw / 2) + "px";
      e.style.setProperty("--len", (Math.max(0, -tie) + 20 + base * [.25, 1.3, .05, .8][i % 4]) + "px"); e.style.setProperty("--d", (i * .12) + "s"); });
  }
  hang(); addEventListener("resize", hang);
  new IntersectionObserver(function (es, ob) { if (!es[0].isIntersecting) return; ob.disconnect(); hang(); c.classList.add("in"); cl.forEach(function (e) { e.classList.add("drop"); }); }, { threshold: .05 }).observe(c);
})();

/* two paintings step up into the empty grass under the "My art" card, left of the dog */
(function () {
  var wall = document.getElementById("artWall"), head = document.querySelector(".art-head"), dog = document.querySelector(".art-mainb");
  if (!wall || !head || !dog) return;
  function place() {
    var bs = wall.querySelectorAll(":scope > button");
    if (bs.length < 2) return;
    var up = [bs[0], bs[1]];
    if (innerWidth <= 900) { up.forEach(function (b) { b.classList.remove("art-up"); b.style.left = b.style.top = b.style.width = ""; }); return; }
    var w = wall.getBoundingClientRect(), h = head.getBoundingClientRect(), d = dog.getBoundingClientRect();
    var room = d.left - h.left - 40, top = h.bottom - w.top + 40, avail = d.bottom - h.bottom - 60;
    var pw = Math.min(room / 2 - 40, avail * (696 / 900), 300);
    up.forEach(function (b, i) {
      b.classList.add("art-up");
      b.style.width = pw + "px";
      b.style.left = (h.left - w.left + 20 + i * (room / 2) + (room / 2 - pw) / 2) + "px";
      b.style.top = (top + (i ? 30 : 0)) + "px";
    });
  }
  place(); addEventListener("resize", place); addEventListener("load", place);
  new MutationObserver(place).observe(wall, { childList: true });
  if ("ResizeObserver" in window) new ResizeObserver(place).observe(head);
  setTimeout(place, 800); setTimeout(place, 2500);
})();

/* hero daisy blooms once the photo has dropped in */
(function () { var d = document.querySelector(".hero-daisy"); if (!d) return;
  /* it blooms together with the daisy patch, the moment the hero appears */
  (function wait() { if (document.documentElement.classList.contains("hero-go")) { d.src = d.dataset.src + "?t=" + Date.now(); d.classList.add("grow"); var d2 = document.querySelector(".hero-daisy2"); if (d2) { d2.src = d2.dataset.src + "?u=" + Date.now(); d2.classList.add("grow"); } } else setTimeout(wait, 60); })(); })();

/* each Playroom sticker starts at the door's center, so it flies out of the door to its spot */
(function () {
  var w = document.querySelector(".pr-wall"); if (!w) return;
  var door = w.querySelector(".door");
  function aim() {
    var d = door.getBoundingClientRect(), cx = d.left + d.width / 2, cy = d.top + d.height * .45;
    w.querySelectorAll('.out[class*=" pr-"]').forEach(function (o) {
      var prev = o.style.animation; o.style.animation = "none";
      var r = o.getBoundingClientRect(); o.style.animation = prev;
      o.style.setProperty("--sx", (cx - (r.left + r.width / 2)).toFixed(0) + "px");
      o.style.setProperty("--sy", (cy - (r.top + r.height / 2)).toFixed(0) + "px");
    });
  }
  w.addEventListener("mouseenter", aim); w.addEventListener("focusin", aim); addEventListener("resize", aim); setTimeout(aim, 1500);
})();

/* the paper bouquet stands in the grass just left of the yellow oval (neon butterfly) painting */
(function () {
  var bq = document.querySelector(".art-bouquet"), clip = document.querySelector(".art-clip"), wall = document.getElementById("artWall");
  if (!bq || !clip || !wall) return;
  function place() {
    bq.classList.remove("by-oval"); bq.style.left = bq.style.top = ""; return; /* now sits beside the fringe daisy (CSS) */
    var b = wall.querySelector('button[data-i="3"]'); if (!b || innerWidth <= 900) { bq.classList.remove("by-oval"); return; }
    var c = clip.getBoundingClientRect(), r = b.getBoundingClientRect(), w = bq.offsetWidth || 260;
    bq.classList.add("by-oval");
    bq.style.left = Math.max(-20, r.left - c.left - w * .95) + "px";
    bq.style.top = (r.bottom - c.top - w * 1.25) + "px";
  }
  place(); addEventListener("resize", place); addEventListener("load", place); setTimeout(place, 1000); setTimeout(place, 3000);
  if ("ResizeObserver" in window) new ResizeObserver(place).observe(wall);
})();

/* Playroom door: a big burst of bubbles and puffs of smoke when it opens */
(function () {
  var box = document.querySelector(".pr-bubbles"); if (!box) return;
  var seed = 11; function r() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  for (var i = 0; i < 18; i++) {
    var b = document.createElement("i"); b.className = "pr-bub burst";
    var a = -Math.PI / 2 + (r() - .5) * 2.6, sp = 120 + r() * 220;
    b.style.cssText = "--s:" + Math.round(20 + r() * 50) + "px;--px:" + (Math.cos(a) * sp).toFixed(0) + "px;--py:" + (Math.sin(a) * sp * .7).toFixed(0) + "px;--bx:" + Math.round((r() - .5) * 360) + "px;--bd:" + (3.2 + r() * 2.4).toFixed(2) + "s;--bl:" + (r() * .5).toFixed(2) + "s;--bh:" + (.8 + r() * .4).toFixed(2);
    box.appendChild(b);
  }
  /* smoke lives behind the door and billows out around its edges */
  var wall = box.closest(".wall"), sm = document.createElement("span"); sm.className = "pr-smokes"; sm.setAttribute("aria-hidden", "true");
  wall.insertBefore(sm, wall.querySelector(".door"));
  for (var k = 0; k < 12; k++) {
    var m = document.createElement("i"); m.className = "pr-smoke", side = k % 3;
    var ox = side === 0 ? "calc(var(--dw) * -.5)" : side === 1 ? "calc(var(--dw) * .5)" : (r() - .5) * 120 + "px",
        oy = side === 2 ? "calc(var(--dw) * -1.6)" : Math.round(-r() * 360) + "px",
        mx = side === 0 ? -(60 + r() * 140) : side === 1 ? 60 + r() * 140 : (r() - .5) * 160,
        my = side === 2 ? -(60 + r() * 120) : -(40 + r() * 140);
    m.style.cssText = "--ox:" + ox + ";--oy:" + oy + ";--s:" + Math.round(100 + r() * 120) + "px;--mx:" + Math.round(mx) + "px;--my:" + Math.round(my) + "px;--md:" + (2.2 + r() * 1.6).toFixed(2) + "s;--ml:" + (k * .1 + r() * .2).toFixed(2) + "s";
    sm.appendChild(m);
  }
})();

/* leaving the vortex: a big poof of light, sparkles and smoke as the doors push it away */
(function () {
  var doors = document.getElementById("doors"); if (!doors || !window.__poof) return;
  var done = false;
  addEventListener("scroll", function () {
    if (done || !document.documentElement.classList.contains("vx-past")) return;
    var t = doors.getBoundingClientRect().top;
    if (t < innerHeight * .75 && t > 0) {
      done = true;
      var fake = { getBoundingClientRect: function () { return { left: innerWidth / 2 - 50, top: Math.max(80, t - 120), width: 100, height: 100 }; } };
      window.__poof(fake);
      var S = document.createElement("div"); S.className = "vx-exit-smoke"; S.style.top = Math.max(80, t - 60) + "px";
      var h = ""; for (var k = 0; k < 14; k++) h += '<i style="--sx:' + Math.round((Math.random() - .5) * innerWidth * .9) + 'px;--sy:' + Math.round(-40 - Math.random() * 220) + 'px;--sz:' + Math.round(140 + Math.random() * 180) + 'px;--sd:' + (Math.random() * .25).toFixed(2) + 's"></i>';
      S.innerHTML = h; document.body.appendChild(S); setTimeout(function () { S.remove(); }, 2600);
    }
  }, { passive: true });
})();

/* Workshop: the purple bees fly from the door to the shelf flowers and hover there */
(function () {
  var w = document.getElementById("careerWall"); if (!w) return;
  var bee = w.querySelector(".ws-bee"), shelf = w.querySelector(".shelf"); if (!bee || !shelf) return;
  function aim() {
    var bx = bee.offsetLeft + bee.offsetWidth / 2, by = bee.offsetTop + bee.offsetHeight / 2;
    var fx = shelf.offsetLeft + shelf.offsetWidth * .62, fy = shelf.offsetTop - shelf.offsetHeight * .15;
    bee.style.setProperty("--hx", Math.round(fx - bx) + "px"); bee.style.setProperty("--hy", Math.round(fy - by) + "px");
  }
  aim(); w.addEventListener("mouseenter", aim); addEventListener("resize", aim);
})();

/* Nokia-style snakes in the side gutters, from "Got an idea?" to the bottom of the page; they move as you scroll */
(function () {
  var idea = document.getElementById("write"); if (!idea || matchMedia("(max-width:700px)").matches) return;
  var host = idea.parentElement; if (getComputedStyle(host).position === "static") host.style.position = "relative";
  var lane = document.createElement("div"); lane.className = "snake-lanes"; lane.setAttribute("aria-hidden", "true");
  lane.innerHTML = '<div class="snake-rail l"><canvas data-seed="7"></canvas></div><div class="snake-rail r"><canvas data-seed="42"></canvas></div>';
  host.appendChild(lane);
  var extra = 0, EXTRA = 1400;
  var CELL = 12, PX_PER_STEP = 6, FOOD_EVERY = 22, START_LEN = 8, MAX_LEN = 60, HUD = 2;
  var SNAKE = "#ec2b7a", FOOD = "#ceff32";
  function rng(seed) { return function () { seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function buildPath(cols, rows, len, seed) {
    var r = rng(seed), x = Math.floor(cols / 2), y = HUD + 1, d = [0, 1], run = 3 + Math.floor(r() * 6), path = [[x, y]], recent = [];
    function key(a, b) { return a + "," + b; } function ok(nx, ny) { return nx >= 0 && nx < cols && ny >= HUD && ny < rows; }
    for (var i = 1; i < len; i++) {
      var rs = new Set(recent);
      var free = function (dx, dy) { return ok(x + dx, y + dy) && !rs.has(key(x + dx, y + dy)); }, next = d;
      if (run <= 0 || !free(d[0], d[1])) {
        var turns = [[d[1], d[0]], [-d[1], -d[0]]].sort(function () { return r() - .5; });
        next = turns.find(function (t) { return free(t[0], t[1]); }) || (free(d[0], d[1]) ? d : null) || turns.find(function (t) { return ok(x + t[0], y + t[1]); }) || (ok(x + d[0], y + d[1]) ? d : [-d[0], -d[1]]);
        run = 2 + Math.floor(r() * Math.max(3, Math.min(cols, rows) - 3));
      }
      d = next; x += d[0]; y += d[1]; run--; path.push([x, y]); recent.push(key(x, y)); if (recent.length > MAX_LEN + 4) recent.shift();
    }
    return path;
  }
  var st = Array.prototype.map.call(lane.querySelectorAll("canvas"), function (c) { return { c: c, ctx: c.getContext("2d"), seed: +c.dataset.seed }; });
  function place() {
    var hr = host.getBoundingClientRect(), ir = idea.getBoundingClientRect();
    lane.style.top = (ir.top - hr.top) + "px"; lane.style.height = (hr.bottom - ir.top) + "px";
  }
  function layout() {
    place();
    var travel = Math.max(1, lane.offsetHeight - innerHeight + EXTRA), steps = Math.max(120, Math.round(travel / PX_PER_STEP)), dpr = Math.min(devicePixelRatio || 1, 2);
    st.forEach(function (s) {
      var w = s.c.clientWidth, h = s.c.clientHeight; s.c.width = Math.round(w * dpr); s.c.height = Math.round(h * dpr); s.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      s.cols = Math.max(3, Math.floor(w / CELL)); s.rows = Math.max(HUD + 3, Math.floor(h / CELL));
      s.ox = Math.floor((w - s.cols * CELL) / 2); s.oy = Math.floor((h - s.rows * CELL) / 2); s.path = buildPath(s.cols, s.rows, steps, s.seed);
    });
    draw();
  }
  function blk(s, cx, cy, a, inset) { s.ctx.globalAlpha = a; s.ctx.fillRect(s.ox + cx * CELL + inset, s.oy + cy * CELL + inset, CELL - inset * 2, CELL - inset * 2); }
  function draw() {
    var r = lane.getBoundingClientRect(), travel = Math.max(1, r.height - innerHeight), p = Math.min(1, Math.max(0, (-r.top + extra) / (travel + EXTRA)));
    st.forEach(function (s) {
      var ctx = s.ctx, path = s.path, w = s.c.clientWidth, h = s.c.clientHeight; if (!path) return;
      var head = Math.floor(p * (path.length - 1)), eaten = Math.floor((head + FOOD_EVERY / 2) / FOOD_EVERY), len = Math.min(MAX_LEN, START_LEN + eaten);
      ctx.globalAlpha = 1; ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#ffffff"; for (var yy = HUD; yy < s.rows; yy++) for (var xx = 0; xx < s.cols; xx++) blk(s, xx, yy, .05, 1);
      ctx.globalAlpha = 1; ctx.fillStyle = SNAKE; ctx.font = "bold " + Math.round(CELL * 1.15) + "px 'Courier New', monospace"; ctx.textBaseline = "middle";
      ctx.fillText(String(eaten * 7).padStart(4, "0"), s.ox + 2, s.oy + CELL * .9); ctx.fillRect(s.ox, s.oy + HUD * CELL - 3, s.cols * CELL, 2);
      var nf = eaten * FOOD_EVERY + FOOD_EVERY / 2;
      if (nf < path.length) { var f = path[Math.round(nf)], q = CELL / 3, bx = s.ox + f[0] * CELL, by = s.oy + f[1] * CELL; ctx.fillStyle = FOOD;
        ctx.fillRect(bx + q, by, q, q); ctx.fillRect(bx, by + q, q, q); ctx.fillRect(bx + 2 * q, by + q, q, q); ctx.fillRect(bx + q, by + 2 * q, q, q); }
      ctx.fillStyle = SNAKE;
      for (var i = Math.max(0, head - len + 1); i <= head; i++) { var c = path[i]; blk(s, c[0], c[1], 1, 1);
        if (i < head) { var n = path[i + 1]; ctx.fillRect(s.ox + Math.min(c[0], n[0]) * CELL + 1, s.oy + Math.min(c[1], n[1]) * CELL + 1, n[0] !== c[0] ? CELL * 2 - 2 : CELL - 2, n[1] !== c[1] ? CELL * 2 - 2 : CELL - 2); } }
      var hd = path[head], pv = path[Math.max(0, head - 1)], dx = hd[0] - pv[0], dy = hd[1] - pv[1];
      ctx.globalAlpha = 1; ctx.fillStyle = "#1a0f33";
      ctx.fillRect(s.ox + hd[0] * CELL + CELL / 2 - 1.5 + dx * 2 - dy * 2, s.oy + hd[1] * CELL + CELL / 2 - 1.5 + dy * 2 + dx * 2, 3, 3);
    });
  }
  var tick = false;
  function redraw() { if (!tick) { tick = true; requestAnimationFrame(function () { draw(); tick = false; }); } }
  addEventListener("scroll", redraw, { passive: true });
  /* at the very bottom the page stops, but scrolling keeps the snakes going until they reach the end */
  function atBottom() { return scrollY + innerHeight >= document.documentElement.scrollHeight - 2; }
  addEventListener("wheel", function (e) {
    if (e.deltaY > 0 && atBottom()) { extra = Math.min(EXTRA, extra + e.deltaY); redraw(); }
    else if (e.deltaY < 0 && extra > 0) { extra = Math.max(0, extra + e.deltaY); redraw(); }
  }, { passive: true });
  var ty = null;
  addEventListener("touchstart", function (e) { ty = e.touches[0].clientY; }, { passive: true });
  addEventListener("touchmove", function (e) { if (ty === null) return; var d = ty - e.touches[0].clientY; ty = e.touches[0].clientY;
    if (d > 0 && atBottom()) { extra = Math.min(EXTRA, extra + d * 2); redraw(); } else if (d < 0 && extra > 0) { extra = Math.max(0, extra + d * 2); redraw(); } }, { passive: true });
  addEventListener("resize", layout); addEventListener("load", layout); setTimeout(layout, 1500);
  if ("ResizeObserver" in window) { var rt; new ResizeObserver(function () { clearTimeout(rt); rt = setTimeout(layout, 200); }).observe(host); }
  layout();
})();

/* browsers only allow sound after the visitor taps, clicks or presses a key once.
   The first time they do, unlock every sound so the door creaks, AIM chimes and songs can play from then on,
   and the Sound button pulses until then so people know to tap it. */
(function () {
  var btn = document.getElementById("sndBtn"); if (btn) btn.classList.add("snd-hint");
  /* a friendly "tap for sound" pill until the visitor's first tap (hovering and scrolling don't count for browsers) */
  var pill = null, active = navigator.userActivation && navigator.userActivation.hasBeenActive;
  var off = false; try { off = localStorage.getItem("doorSound") === "off"; } catch (e) {}
  if (false) {   /* no separate sound pill: the daisy's "Click me" is the first tap */
    pill = document.createElement("button"); pill.type = "button"; pill.className = "snd-pill"; pill.innerHTML = "🔊 Tap anywhere for sound";
    /* the hero's own "Click me" by the daisy asks first; this pill only shows if they skip it and scroll on without tapping */
    (function later() { if (!pill) return; if (document.documentElement.classList.contains("vx-past")) document.body.appendChild(pill); else setTimeout(later, 500); })();
  }
  function unlock() {
    ["pointerdown", "keydown", "touchend"].forEach(function (ev) { removeEventListener(ev, unlock, true); });
    if (btn) btn.classList.remove("snd-hint");
    if (pill) { pill.classList.add("bye"); setTimeout(function () { pill.remove(); }, 500); }
    /* Safari only lets a sound play later if that exact sound was started once during a tap, so warm up the real ones */
    var all = []; var X = window.__SFX || {}; for (var k in X) all.push(X[k]); if (window.__theme) all.push(window.__theme); if (window.__bmwSong) all.push(window.__bmwSong);
    all.forEach(function (a) {
      if (!a || !a.paused) return;
      try { a.muted = true; var p = a.play(); if (p && p.then) p.then(function () { if (a.muted) { a.pause(); a.currentTime = 0; } a.muted = false; }).catch(function () { a.muted = false; }); else a.muted = false; } catch (e) { a.muted = false; }
    });
    if (window.__bmwRetry) window.__bmwRetry();
  }
  ["pointerdown", "keydown", "touchend"].forEach(function (ev) { addEventListener(ev, unlock, true); });
})();

/* on load: no door sound; a single AIM ping the moment my photo lands in the hero */
(function () {
  function on() { try { return localStorage.getItem("doorSound") !== "off"; } catch (e) { return true; } }
  var fig = document.querySelector(".hero-figure"), done = false;
  function ping() {
    if (done || !on()) return; done = true;
    var b = new Audio("assets/sfx/imrcv.mp3"); b.volume = .8; var q = b.play(); if (q && q.catch) q.catch(function () {});
  }
  /* the photo drops in once the hero starts; ping as it settles */
  (function wait() {
    if (document.documentElement.classList.contains("hero-go")) setTimeout(ping, 1100);
    else setTimeout(wait, 80);
  })();
})();

/* if someone just watches the vortex for a while, carry them on down to the doors */
(function () {
  var root = document.documentElement, doors = document.getElementById("doors"), vx = document.getElementById("vortex");
  if (!doors || !vx) return;
  var t = null, moved = false;
  function arm() {
    clearTimeout(t); if (moved) return;
    t = setTimeout(function () {
      var r = vx.getBoundingClientRect();
      if (root.classList.contains("vx-go") && doors.getBoundingClientRect().top > innerHeight * .4 && r.bottom > 0) dive();
    }, 11000);
  }
  /* the way out: zoom into the middle of the vortex as if falling through it, flash, then land right on the doors */
  function dive() {
        if (moved) return; moved = true; clearTimeout(t); window.__vxDived = true; root.classList.add("vx-zoom");
        var fl = document.createElement("div"); fl.className = "vx-zoom-flash"; document.body.appendChild(fl);
        setTimeout(function () {
          var de = document.documentElement, sb = de.style.scrollBehavior; de.style.scrollBehavior = "auto";
          window.scrollTo(0, doors.getBoundingClientRect().top + scrollY); de.style.scrollBehavior = sb;
          if (window.__poof) window.__poof({ getBoundingClientRect: function () { return { left: innerWidth / 2 - 50, top: innerHeight * .35, width: 100, height: 100 }; } });
          setTimeout(function () { root.classList.remove("vx-zoom"); fl.classList.add("out"); setTimeout(function () { fl.remove(); }, 900); }, 150);
        }, 900);
  }
  /* once the answer has landed, scrolling on through the vortex takes the dive instead of a long slow slide */
  addEventListener("wheel", function (e) { if (e.deltaY > 0 && ready()) dive(); }, { passive: true });
  addEventListener("touchmove", function () { if (ready() && scrollY > ready.y + 40) dive(); }, { passive: true });
  addEventListener("keydown", function (e) { if (/^(ArrowDown|PageDown| |Space)$/.test(e.key) && ready()) dive(); });
  function ready() {
    if (moved || !root.classList.contains("vx-go") || !document.querySelector(".vq-lock .vq-cite")) return false;
    var since = ready.at || (ready.at = Date.now()); ready.y = ready.y || scrollY;
    var r = vx.getBoundingClientRect(); return Date.now() - since > 2600 && r.top < innerHeight * .2 && doors.getBoundingClientRect().top > innerHeight * .4;
  }
  new MutationObserver(function () { if (root.classList.contains("vx-go")) arm(); }).observe(root, { attributes: true, attributeFilter: ["class"] });
  ["wheel", "touchmove", "keydown"].forEach(function (ev) { addEventListener(ev, function () { if (root.classList.contains("vx-go")) arm(); }, { passive: true }); });
})();

window.__mail = function () {
  /* the paper airplane lands in the button: the AIM message chime (a "You've got mail" clip can drop in as assets/sfx/gotmail.mp3 later) */
  var on = true; try { on = localStorage.getItem("doorSound") !== "off"; } catch (e) {}
  if (on && window.__playSfx) window.__playSfx("imrcv");
};

/* clicking a photo (the Beyond work polaroids and the portraits) opens it big */
(function () {
  var box = document.createElement("div"); box.className = "zoombox"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Photo");
  box.innerHTML = '<div class="zslot"></div><button type="button" aria-label="Close">\u00d7</button>'; document.body.appendChild(box);
  var big = box.querySelector("img");
  function open(src, alt) { big.src = src; big.alt = alt || ""; box.classList.add("on"); }
  function close() { box.classList.remove("on"); }
  box.addEventListener("click", close); addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  /* the photo opens together with its frame (polaroid, camera, arch), as one piece */
  document.addEventListener("click", function (e) {
    var el = e.target.closest(".pol, .hero-photo, .connect-photo"); if (!el) return;
    e.preventDefault(); e.stopPropagation();
    /* clone it at its own size (so the photo stays seated in its frame), then scale the whole piece up */
    var c = el.cloneNode(true), w = el.offsetWidth, h = el.offsetHeight;
    var cs = getComputedStyle(el), keep = ["--r", "--i"].map(function (v) { return v + ":" + cs.getPropertyValue(v); }).join(";");
    c.removeAttribute("style"); c.classList.add("zoomed");
    c.style.cssText = keep + ";position:absolute;left:0;top:0;margin:0;opacity:1;transform:none;translate:none;rotate:0deg;scale:1;animation:none;transition:none;width:" + w + "px;height:" + h + "px;max-width:none";
    var k = Math.min(innerWidth * .84 / w, innerHeight * .84 / h);
    var slot = box.querySelector(".zslot"); slot.innerHTML = ""; slot.style.width = w + "px"; slot.style.height = h + "px"; slot.style.setProperty("--zk", k.toFixed(3));
    slot.appendChild(c); box.classList.add("on");
  }, true);
})();

/* the nightstand books: opening one closes the others */
(function () {
  var books = Array.prototype.slice.call(document.querySelectorAll("details.book"));
  books.forEach(function (b) { b.addEventListener("toggle", function () { if (b.open) books.forEach(function (o) { if (o !== b && o.open) o.open = false; }); }); });
})();

/* the solitaire invitation fades up when you reach the very bottom */
(function () { var o = document.getElementById("solo"); if (!o) return; if (!("IntersectionObserver" in window)) { o.classList.add("in"); return; }
  new IntersectionObserver(function (es, ob) { if (es[0].isIntersecting) { o.classList.add("in"); ob.disconnect(); } }, { threshold: .3 }).observe(o); })();

/* ===== the sound dock: a little speaker in the corner that opens into mute + volume ===== */
(function () {
  var main = document.getElementById("sndBtn"); if (!main || !window.__setVolume) return;
  var dock = document.createElement("div"); dock.className = "snd-dock"; dock.setAttribute("role", "group"); dock.setAttribute("aria-label", "Sound controls");
  dock.innerHTML = '<button type="button" class="sd-toggle" aria-expanded="false" aria-label="Sound controls"><span class="sd-ic" aria-hidden="true"></span></button>'
    + '<div class="sd-panel"><button type="button" class="sd-mute"></button>'
    + '<button type="button" class="sd-step" data-d="-.1" aria-label="Volume down">−</button>'
    + '<input type="range" class="sd-range" min="0" max="100" step="5" aria-label="Volume">'
    + '<button type="button" class="sd-step" data-d=".1" aria-label="Volume up">+</button>'
    + '<button type="button" class="sd-min" aria-label="Minimize sound controls">▾</button></div>';
  document.body.appendChild(dock);
  var tog = dock.querySelector(".sd-toggle"), mute = dock.querySelector(".sd-mute"), range = dock.querySelector(".sd-range"), ic = dock.querySelector(".sd-ic");
  var open = false; try { open = localStorage.getItem("lmDock") === "open"; } catch (e) {}
  function on() { return main.getAttribute("aria-pressed") === "true"; }
  function paint() {
    var v = Math.round(window.__getVolume() * 100), live = on() && v > 0;
    range.value = v; range.style.setProperty("--p", v + "%");
    mute.textContent = on() ? "🔊 Sound on" : "🔇 Sound off"; mute.setAttribute("aria-pressed", !on());
    ic.textContent = !live ? "🔇" : v < 40 ? "🔈" : v < 75 ? "🔉" : "🔊";
    dock.classList.toggle("open", open); tog.setAttribute("aria-expanded", open);
    try { localStorage.setItem("lmDock", open ? "open" : "closed"); } catch (e) {}
  }
  tog.addEventListener("click", function () { open = !open; paint(); });
  dock.querySelector(".sd-min").addEventListener("click", function () { open = false; paint(); tog.focus(); });
  mute.addEventListener("click", function () { main.click(); });
  range.addEventListener("input", function () { window.__setVolume(range.value / 100); if (!on() && range.value > 0) main.click(); paint(); });
  dock.querySelectorAll(".sd-step").forEach(function (b) { b.addEventListener("click", function () { window.__setVolume(window.__getVolume() + parseFloat(b.dataset.d)); if (!on()) main.click(); paint(); }); });
  document.addEventListener("lm-sound", paint);
  paint();
})();

/* ===== the daisy calls you: it glows, a "Click me" pops up beside it, and your click lets the bunny out
   (that click is also what lets the browser play sound, so the music starts with him) ===== */
(function () {
  var root = document.documentElement, hero = document.querySelector(".hero"), dz = document.querySelector(".hero-daisy");
  if (!hero || !dz) { window.__daisyGo = true; return; }
  var b = document.createElement("button"); b.type = "button"; b.className = "daisy-call"; b.innerHTML = '<span class="tag-t">Click Me</span><i class="tag-hole" aria-hidden="true"></i><i class="tag-string" aria-hidden="true"></i>';
  b.setAttribute("aria-label", "Click me to let the bunny out");
  function place() {
    var h = hero.getBoundingClientRect(), d = dz.getBoundingClientRect();
    /* the tag hangs off the daisy's stem: its string end ties on at the stem, the tag sways out to the left */
    var stemX = d.left - h.left + d.width * .5, stemY = d.top - h.top + d.height * .68, tw = b.offsetWidth || 220;
    b.style.left = (stemX - tw / 2 - 18) + "px"; b.style.top = (stemY + (b.offsetHeight || 60) / 2) + "px";
  }
  function go() {
    if (window.__daisyGo) return; window.__daisyGo = true;
    root.classList.remove("daisy-calling"); b.classList.add("bye"); setTimeout(function () { b.remove(); }, 500);
    if (window.__poof) window.__poof(dz);
  }
  b.addEventListener("click", go); dz.addEventListener("click", go);
  /* dragging the scrollbar can't sneak past either */
  addEventListener("scroll", function () { if (!window.__daisyGo && b.isConnected && document.querySelector(".rabbit") && scrollY > 4) window.__nudgeTag(); }, { passive: true });
  window.__nudgeTag = function () {
    if (window.__daisyGo) return;
    if (!b.isConnected) { root.classList.add("daisy-calling"); hero.appendChild(b); place(); }
    if (scrollY > 0) scrollTo(0, 0);
    b.classList.remove("nudge"); void b.offsetWidth; b.classList.add("nudge");
  };
  /* a click anywhere near the flower counts too */
  hero.addEventListener("click", function (e) {
    if (window.__daisyGo || !root.classList.contains("daisy-calling")) return;
    var d = dz.getBoundingClientRect(), pad = Math.max(80, d.width * .35);
    if (e.clientX > d.left - pad && e.clientX < d.right + pad && e.clientY > d.top - pad && e.clientY < d.bottom + pad) go();
  });
  /* if the bunny comes out any other way (they scrolled first), the button and glow go away too */
  function bunnyOut() { return root.classList.contains("bunny-on") || root.classList.contains("vx-past") || !!document.querySelector(".rabbit.go") || !document.querySelector(".rabbit"); }
  function hide() { root.classList.remove("daisy-calling"); if (b.isConnected) { b.classList.add("bye"); setTimeout(function () { b.remove(); }, 500); } }
  var watch = setInterval(function () { if (window.__daisyGo || bunnyOut()) { if (bunnyOut()) { clearInterval(watch); hide(); } } }, 150);
  (function wait() {
    if (root.classList.contains("hero-go") && dz.classList.contains("grow")) setTimeout(function () {
      if (window.__daisyGo || bunnyOut()) return;
      root.classList.add("daisy-calling"); setTimeout(function () { hero.appendChild(b); place(); }, 650);
      addEventListener("resize", place);
    }, 1400);
    else setTimeout(wait, 100);
  })();
})();
