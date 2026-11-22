(function () {
  var grain = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .12  0 0 0 0 .1  0 0 0 0 .1  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";
  function decorate() {
    if (document.getElementById('hw-grain')) return;
    var g = document.createElement('div');
    g.id = 'hw-grain';
    g.setAttribute('aria-hidden', 'true');
    g.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:40;opacity:.12;mix-blend-mode:soft-light;background-image:' + grain;
    document.body.appendChild(g);
    var l = document.createElement('div');
    l.setAttribute('aria-hidden', 'true');
    l.style.cssText = 'position:absolute;left:0;right:0;top:0;height:min(100vh,1100px);pointer-events:none;display:flex;justify-content:space-evenly;z-index:-1';
    for (var i = 0; i < 3; i++) {
      var s = document.createElement('span');
      s.style.cssText = 'width:1px;background:linear-gradient(180deg,rgba(32,30,29,0),rgba(32,30,29,.07) 30%,rgba(32,30,29,0))';
      l.appendChild(s);
    }
    document.body.style.position = 'relative';
    document.body.appendChild(l);
  }
  function reveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    var sel = ['section[data-screen-label] h1', 'section[data-screen-label] h2', 'section[data-screen-label] h3', 'section[data-screen-label] p', 'section[data-screen-label] figure', 'section[data-screen-label] [role=tablist]', 'section[data-screen-label] form', 'section[data-screen-label] ol', 'section[data-screen-label] iframe', 'section[data-screen-label] [data-reveal]', 'section[data-screen-label] span[style*="letter-spacing:.26em"]'].join(',');
    var els = Array.prototype.slice.call(document.querySelectorAll(sel));
    var seen = [];
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.style.opacity = '1'; el.style.transform = 'none'; el.style.filter = 'none';
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    els.forEach(function (el) {
      if (el.dataset.hwRev) return;
      if (seen.some(function (p) { return p.contains(el); })) return;
      seen.push(el);
      el.dataset.hwRev = '1';
      var idx = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      var isImg = el.matches('figure, iframe, [data-reveal="img"]');
      el.style.opacity = '0';
      el.style.transform = isImg ? 'translateY(32px) scale(.985)' : 'translateY(22px)';
      el.style.filter = isImg ? 'blur(6px)' : 'none';
      el.style.transition = 'opacity 1.1s cubic-bezier(.2,.7,.2,1), transform 1.3s cubic-bezier(.2,.7,.2,1), filter 1.2s ease';
      el.style.transitionDelay = Math.min(idx, 5) * 90 + 'ms';
      io.observe(el);
    });
  }
  var last = -1, stable = 0, tries = 0;
  function wait() {
    var n = document.querySelectorAll('section[data-screen-label] *').length;
    if (n > 0 && n === last) stable++; else stable = 0;
    last = n; tries++;
    if (stable >= 2 || tries > 40) { decorate(); reveal(); return; }
    setTimeout(wait, 150);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wait); else wait();
})();
