/* Pollinate V7 — hero zoom, travelling dandelion, butterflies, sprouts */
(function () {
  if (window.__p7) return; window.__p7 = 1;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches, fine = matchMedia('(pointer: fine)').matches;
  var mx = null, my = null, tick = false, plan = null, pick = -1, f = null, raf = 0;
  addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });

  function update() {
    tick = false;
    var hx = document.querySelector('[data-hx]'); if (!hx) return;
    var r = hx.getBoundingClientRect(), p = Math.max(0, Math.min(1, -r.top / Math.max(1, innerHeight * 1.2)));
    hx.style.setProperty('--p', p.toFixed(3)); var zq = Math.min(1, p / .62), ze = zq < .5 ? 4 * zq * zq * zq : 1 - Math.pow(-2 * zq + 2, 3) / 2; hx.style.setProperty('--pz', ze.toFixed(4));
    document.documentElement.classList.toggle('p7-in', p > .6); document.documentElement.classList.toggle('p7-hx', r.bottom > innerHeight * .5); document.documentElement.classList.toggle('p7-hxtop', -r.top < hx.offsetHeight - innerHeight + 4);
    seeds(); stage();
  }
  var STAGES = { what: '#16221b', clients: '#16221b', about: '#ef4a86' }, curStage = null;
  function stage() {
    var st = document.querySelector('[data-stage]'); if (!st) return;
    var r = st.getBoundingClientRect(), y = r.top + r.height / 2, c = 'transparent';
    if (document.documentElement.classList.contains('p7-in')) document.querySelectorAll('main > section[id]').forEach(function (s) { var b = s.getBoundingClientRect(); if (y >= b.top && y < b.bottom && STAGES[s.id]) c = STAGES[s.id]; });
    if (c !== curStage) { curStage = c; st.style.setProperty('--stage', c); st.classList.remove('pop'); void st.offsetWidth; if (c !== 'transparent') st.classList.add('pop'); }
  }
  function onScroll() { if (!tick) { tick = true; requestAnimationFrame(update); } }

  function seeds() {
    var D = document.querySelector('[data-dl]'); if (!D || still) return;
    var S = [].slice.call(D.querySelectorAll('.sd')); if (!S.length) return;
    var g = Math.max(0, Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)));
    if (!plan || plan.length !== S.length) {
      var ord = S.map(function (_, i) { return i; }).sort(function () { return Math.random() - .5; });
      plan = []; ord.forEach(function (si, n) { var a = parseFloat(S[si].getAttribute('data-a') || 0) * Math.PI / 180; plan[si] = { dx: -(120 + Math.random() * 360) + Math.sin(a) * 50, dy: -(100 + Math.random() * 300), r: Math.random() * 120 - 60, k: n < S.length * .8 ? .03 + Math.pow(n / (S.length * .8), 1.7) * .92 : 2 }; });
      pick = ord[0];
    }
    S.forEach(function (el, i) {
      if (i === pick) return; var q = plan[i], t = Math.max(0, Math.min(1, (g - q.k) / .14)); t = t * t * (3 - 2 * t);
      el.style.transform = t ? 'translate(' + (q.dx * t).toFixed(1) + 'px,' + (q.dy * t).toFixed(1) + 'px) rotate(' + (q.r * t).toFixed(1) + 'deg)' : '';
      el.style.opacity = t ? Math.max(0, 1 - t * 1.25).toFixed(2) : '';
    });
    var gs = Math.min(1, Math.max(0, (g - .3) / .25)); gs = gs * gs * (3 - 2 * gs); var big = innerWidth <= 700 ? 1.1 : 1.15; document.documentElement.style.setProperty('--dls', (big - (big - .6) * gs).toFixed(4));
    if (g > .005 && !f) release(S[pick]); else if (g <= .005 && f) { f.el.remove(); f.src.classList.remove('gone'); f = null; }
  }

  function release(el) {
    var svg = el.ownerSVGElement, R = svg.getBoundingClientRect(), u = R.width / 400, sc = u * 1.75, ang = parseFloat(el.getAttribute('data-a') || 0);
    el.classList.add('gone');
    var NS = 'http://www.w3.org/2000/svg', W = Math.round(200 * sc), d = document.createElementNS(NS, 'svg');
    d.setAttribute('viewBox', '-100 -100 200 200'); d.setAttribute('class', 'seed-f');
    d.style.width = d.style.height = W + 'px'; d.style.marginLeft = d.style.marginTop = (-W / 2) + 'px';
    var gg = document.createElementNS(NS, 'g'); gg.setAttribute('transform', 'rotate(' + (-ang) + ')');
    var c = el.cloneNode(); c.removeAttribute('style'); c.removeAttribute('class'); gg.appendChild(c); d.appendChild(gg); document.body.appendChild(d);
    var a = ang * Math.PI / 180;
    f = { src: el, el: d, x: R.left + 200 * u, y: R.top + 170 * u, vx: Math.sin(a) - .3, vy: -Math.abs(Math.cos(a)) - .4, ang: Math.random() * 6.28 };
    if (!raf) raf = requestAnimationFrame(fly);
  }
  function fly(t) {
    raf = 0; if (!f) return;
    f.ang += .002; var tx, ty;
    if (fine && mx != null) { tx = mx + Math.cos(f.ang) * 26; ty = my + Math.sin(f.ang) * 18; } else { tx = innerWidth * .5 + Math.cos(f.ang) * innerWidth * .4; ty = innerHeight * .4 + Math.sin(f.ang * 1.3) * innerHeight * .25; }
    f.vx += (tx - f.x) * .0012 + Math.sin(t / 1400) * .02; f.vy += (ty - f.y) * .0012 + Math.cos(t / 1700) * .015;
    f.vx *= .975; f.vy *= .975; f.x += f.vx; f.y += f.vy;
    f.el.style.transform = 'translate(' + f.x.toFixed(1) + 'px,' + f.y.toFixed(1) + 'px) rotate(' + Math.max(-35, Math.min(35, f.vx * 14)).toFixed(1) + 'deg)';
    raf = requestAnimationFrame(fly);
  }

  function watch() {
    if (!('IntersectionObserver' in window)) { document.querySelectorAll('[data-bfs],[data-sprouts]').forEach(function (n) { n.classList.add('in'); }); return; }
    document.querySelectorAll('[data-bfs]:not([data-w])').forEach(function (n) { n.setAttribute('data-w', 1); new IntersectionObserver(function (es) { es.forEach(function (e) { n.classList.toggle('in', e.isIntersecting); }); }, { threshold: .35 }).observe(n); });
    document.querySelectorAll('[data-sprouts]:not([data-w])').forEach(function (n) { n.setAttribute('data-w', 1); new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) n.classList.add('in'); }); }, { threshold: .1 }).observe(n); });
  }

  function start() {
    if (!document.querySelector('[data-hx]')) return setTimeout(start, 120);
    addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll);
    update(); watch();
    var last = document.querySelector('[data-dl]');
    new MutationObserver(function () { watch(); var now = document.querySelector('[data-dl]'); if (now !== last) { last = now; plan = null; onScroll(); } }).observe(document.body, { childList: true, subtree: true });
  }
  /* uplevel: cursor lean, tap bounce, footer planting, neon seed trail */
  var lean = 0, leanT = 0;
  function leanLoop() {
    var D = document.querySelector('[data-dl]');
    if (D && fine && mx != null) { var r = D.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * .3, dx = mx - cx, dy = my - cy, dist = Math.hypot(dx, dy), R = Math.max(220, r.width * 1.4); leanT = dist < R ? -Math.sign(dx) * (1 - dist / R) * 14 : 0; }
    lean += (leanT - lean) * .08; if (D) D.style.setProperty('--lean', lean.toFixed(2) + 'deg');
    requestAnimationFrame(leanLoop);
  }
  if (!still) requestAnimationFrame(leanLoop);
  document.addEventListener('pointerdown', function (e) { var s = e.target.closest && e.target.closest('.dl-svg'); if (!s) return; s.classList.remove('boing'); void s.getBoundingClientRect(); s.classList.add('boing'); });
  function endWatch() { var g = document.querySelector('.ft'); if (!g || g.__w) return setTimeout(endWatch, 300); g.__w = 1; if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { document.documentElement.classList.toggle('p7-end', e.isIntersecting); }); }, { threshold: .05 }).observe(g); }
  endWatch();
  var trailT = 0;
  (function trail(t) { requestAnimationFrame(trail); if (still || !f || t - trailT < 90) return; trailT = t; var m = /translate\(([-\d.]+)px,([-\d.]+)px/.exec(f.el.style.transform); if (!m) return; var p = document.createElement('i'); p.className = 'pollen-dot'; p.style.left = m[1] + 'px'; p.style.top = m[2] + 'px'; p.style.background = ['#ef4a86', '#ee7c62', '#c9a6ff', '#50f400'][Math.floor(Math.random() * 4)]; document.body.appendChild(p); setTimeout(function () { p.remove(); }, 1400); })(0);
  start();
})();

/* idle seeds: linger on a section and seeds drift down and sprout along its bottom edge */
(function(){
  if (window.__idleInit || matchMedia('(prefers-reduced-motion: reduce)').matches) return; window.__idleInit=1;
  [1,2,3,4,5].forEach(function(n){var i=new Image();i.src='assets/v7/grow-'+n+'.png'});
  var F=['coral_flower','orange_flower','pink_wildflower','sunshine_flower','violet_flower','purple_flower','magenta_blossom'].map(function(n){return 'assets/illustrations/neon/'+n+'.png'});
  F.forEach(function(s){var i=new Image();i.src=s});
  var t=null,iv=null,MAX=innerWidth<=700?3:6,moved=false,y0=scrollY;
  function sec(){var el=document.elementFromPoint(innerWidth/2,innerHeight*.55);el=el&&el.closest('main > section, main > .sec, .sec');return el&&!el.matches('[data-hx]')?el:null}
  function head(){var c=document.querySelector('.dl .core');if(!c)return {x:innerWidth-160,y:innerHeight*.35};var r=c.getBoundingClientRect();return r.width?{x:r.left+r.width/2,y:r.top+r.height/2}:{x:innerWidth-160,y:innerHeight*.35}}
  function drop(s){
    if(window.__idleN>=MAX||s.querySelectorAll(':scope > .idle-bloom').length+(s.__fly||0)>=2)return stop();window.__idleN=(window.__idleN||0)+1;s.__fly=(s.__fly||0)+1;
    var h=head(),r=s.getBoundingClientRect();if(!h)return;
    var used=[].map.call(s.querySelectorAll(':scope > .idle-bloom'),function(e){return parseFloat(e.dataset.x)});
    var x,k=0;do{x=6+Math.random()*88;k++}while(k<20&&used.some(function(u){return Math.abs(u-x)<9}));
    var tx=r.left+r.width*x/100,ty=Math.min(r.bottom-10,innerHeight+40);
    var sd=document.createElement('i');sd.className='idle-seed';document.body.appendChild(sd);
    var dx=tx-h.x,dy=ty-h.y,w=(Math.random()<.5?-1:1)*(60+Math.random()*80);
    var a=sd.animate([
      {transform:'translate('+h.x+'px,'+h.y+'px) rotate(-20deg)',opacity:0},
      {transform:'translate('+(h.x+dx*.25+w)+'px,'+(h.y+dy*.2-40)+'px) rotate(15deg)',opacity:1,offset:.2},
      {transform:'translate('+(h.x+dx*.55-w*.6)+'px,'+(h.y+dy*.55)+'px) rotate(-12deg)',offset:.55},
      {transform:'translate('+(h.x+dx*.85+w*.3)+'px,'+(h.y+dy*.85)+'px) rotate(8deg)',offset:.85},
      {transform:'translate('+tx+'px,'+ty+'px) rotate(0deg)',opacity:1}
    ],{duration:3400+Math.random()*1200,easing:'cubic-bezier(.4,.1,.5,1)',fill:'forwards'});
    a.onfinish=function(){sd.remove();s.__fly--;var b=document.createElement('span');b.className='idle-bloom';b.dataset.x=x;b.style.left=x+'%';b.style.setProperty('--s',(.75+Math.random()*.5).toFixed(2));b.innerHTML='<span class="gw">'+[1,2,3,4,5].map(function(n){return '<img alt="" src="assets/v7/grow-'+n+'.png">'}).join('')+'</span>';s.appendChild(b)};
  }
  function stop(){clearInterval(iv);iv=null}
  function wave(s){drop(s);if(Math.random()<.4)setTimeout(function(){if(iv&&sec()===s)drop(s)},700)}
  function ok(s){var r=s.getBoundingClientRect();return moved&&r.bottom>innerHeight*.35&&r.bottom<innerHeight-8}
  function start(){var s=sec();if(!s||!ok(s))return;drop(s);iv=setInterval(function(){var c=sec();if(c!==s||!ok(s))return stop();drop(s)},6000)}
  addEventListener('scroll',function(){if(Math.abs(scrollY-y0)>200)moved=true;clearTimeout(t);stop();t=setTimeout(start,3000)},{passive:true});
})();

/* dandelion scene: motif + circle colour follow the section on screen */
(function(){
  var map=[['.svc-r:nth-child(1)','plant'],['.svc-r:nth-child(2)','bloom'],['.svc-r:nth-child(3)','root'],['.svc-r:nth-child(4)','spread'],['.what-h','plant'],['.sec-clients','bloom'],['.sec-studio','root'],['.ground','bloom'],['.sec-work','spread'],['.ft','spread']];
  var cur='';
  function tick(){var y=innerHeight*.5,k='';for(var i=0;i<map.length;i++){var e=document.querySelector(map[i][0]);if(!e)continue;var r=e.getBoundingClientRect();if(r.top<=y&&r.bottom>=y){k=map[i][1];break}}
    if(k!==cur){cur=k;if(k)document.documentElement.setAttribute('data-dlk',k);else document.documentElement.removeAttribute('data-dlk')}}
  addEventListener('scroll',tick,{passive:true});addEventListener('resize',tick);setTimeout(tick,400);
})();

/* reading reveal: each block rises in, in reading order, as it enters view */
(function(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  var sel='.sec .kicker,.sec h2,.sec h3,.sec p,.svc-out,.svc-art,.sec .btn,.work-stage,.work-link,.sec img:not(.idle-bloom img),.sec li,.ft-logo,.ft nav,.ft small';
  function go(){
    var els=[].slice.call(document.querySelectorAll(sel)).filter(function(e){return !e.closest('.hx,.dl,.idle-bloom,.blooms')&&!e.parentElement.closest('[data-rv]')});
    if(!els.length) return setTimeout(go,300);
    document.documentElement.classList.add('rv-on');
    var io=new IntersectionObserver(function(es){
      var vis=es.filter(function(e){return e.isIntersecting}).sort(function(a,b){return a.boundingClientRect.top-b.boundingClientRect.top||a.boundingClientRect.left-b.boundingClientRect.left});
      vis.forEach(function(e,i){e.target.style.setProperty('--rvd',(i*.09).toFixed(2)+'s');e.target.classList.add('rv-in');io.unobserve(e.target)});
    },{rootMargin:'0px 0px -12% 0px',threshold:.15});
    els.forEach(function(e){e.setAttribute('data-rv','');var r=e.getBoundingClientRect();if(r.top<innerHeight*.88&&r.bottom>0)e.classList.add('rv-in');else io.observe(e)});
  }
  setTimeout(go,200);
})();

/* client case-study modal */
(function(){
  var d=document.getElementById('case-dlg');if(!d||!d.showModal)return;var inn=d.querySelector('.cs-in');
  document.addEventListener('click',function(e){var b=e.target.closest('.cl-b');if(b){var t=document.getElementById('case-'+b.dataset.case);inn.innerHTML=t?t.innerHTML:'';d.showModal();document.documentElement.style.overflow='hidden';return}
    if(e.target===d||e.target.closest('.cs-x'))d.close()});
  d.addEventListener('close',function(){document.documentElement.style.overflow=''});
})();

/* headline focus: section headlines swell as they reach the middle of the screen */
(function(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var H=[],raf=0;
  function collect(){H=[].slice.call(document.querySelectorAll('main>.sec h2, main>.sec h3')).filter(function(e){return !e.closest('.cs')});H.forEach(function(e){var cs=getComputedStyle(e);e.style.transformOrigin=cs.textAlign==='center'?'50% 60%':'0 60%'})}
  function run(){raf=0;var vh=innerHeight||document.documentElement.clientHeight||800,mid=vh*.5;for(var i=0;i<H.length;i++){var r=H[i].getBoundingClientRect();if(r.bottom<-200||r.top>innerHeight+200)continue;var d=Math.abs((r.top+r.height/2)-mid)/mid;var e=Math.max(0,1-d);e=e*e*(3-2*e);if(!isFinite(e))e=0;H[i].style.setProperty('--hf',e.toFixed(3))}}
  function req(){if(!raf)raf=requestAnimationFrame(run)}
  setTimeout(function(){collect();run()},400);addEventListener('load',function(){collect();req()});requestAnimationFrame(function(){collect();req()});addEventListener('scroll',req,{passive:true});addEventListener('resize',function(){collect();req()});
})();

/* origin story modal */
(function(){var d=document.getElementById('origin-dlg');if(!d||!d.showModal)return;
  document.addEventListener('click',function(e){if(e.target.closest('.og-b')){d.showModal();document.documentElement.style.overflow='hidden';return}if(e.target===d||(e.target.closest('.cs-x')&&e.target.closest('#origin-dlg')))d.close()});
  d.addEventListener('close',function(){document.documentElement.style.overflow=''});})();

/* modal scroll-unlock safety for both dialogs */
(function(){
  function unlock(){document.documentElement.style.overflow=''}
  ['case-dlg','origin-dlg'].forEach(function(id){var d=document.getElementById(id);if(!d)return;
    d.addEventListener('cancel',unlock);d.addEventListener('close',unlock);
    d.addEventListener('click',function(e){if(e.target===d||e.target.closest('.cs-x')){d.close();unlock()}});
  });
  setInterval(function(){if(document.documentElement.style.overflow==='hidden'&&!document.querySelector('dialog[open]'))unlock()},400);
})();

/* "Spread like wildflowers": seeds burst in from both sides */
(function(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  function go(){var row=document.querySelectorAll('.svc-r')[3];if(!row)return setTimeout(go,400);
    var armed=true;
    new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting&&armed){armed=false;burst(e.target)}else if(!e.isIntersecting&&e.boundingClientRect.top>innerHeight)armed=true})},{rootMargin:'-35% 0px -35% 0px'}).observe(row);
  }
  function burst(row){var r=row.getBoundingClientRect(),cy=r.top+r.height/2;
    var N=innerWidth<=700?7:16;for(var side=0;side<2;side++)for(var i=0;i<N;i++)(function(side,i){
      var s=document.createElement('i');s.className='idle-seed burst-seed';document.body.appendChild(s);
      var x0=side?innerWidth+30:-30,y0=cy+(Math.random()-.5)*r.height*.9,dir=side?-1:1;
      var reach=innerWidth*(.18+Math.random()*.34),lift=-(80+Math.random()*260),wob=(Math.random()-.5)*120,rot=dir*(40+Math.random()*80);
      var a=s.animate([
        {transform:'translate('+x0+'px,'+y0+'px) rotate('+(dir*-60)+'deg) scale(.6)',opacity:0},
        {transform:'translate('+(x0+dir*reach*.45)+'px,'+(y0+lift*.35+wob)+'px) rotate('+(rot*.4)+'deg) scale(1)',opacity:1,offset:.25},
        {transform:'translate('+(x0+dir*reach*.8)+'px,'+(y0+lift*.75-wob*.5)+'px) rotate('+(rot*.8)+'deg) scale(1)',opacity:.9,offset:.7},
        {transform:'translate('+(x0+dir*reach)+'px,'+(y0+lift)+'px) rotate('+rot+'deg) scale(.9)',opacity:0}
      ],{duration:2600+Math.random()*1600,delay:i*45+Math.random()*120,easing:'cubic-bezier(.15,.7,.3,1)',fill:'both'});
      a.onfinish=function(){s.remove()};
    })(side,i);
  }
  setTimeout(go,500);
})();

/* headline lands: dandelion takes one breath and lets go of a few seeds */
(function(){
  var done=false,R=document.documentElement;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  new MutationObserver(function(){
    if(done||!R.classList.contains('p7-in')||!R.classList.contains('p7-hx'))return;done=true;
    setTimeout(function(){
      var s=document.querySelector('.dl-svg');if(s){s.classList.remove('dl-breath');void s.getBoundingClientRect();s.classList.add('dl-breath')}
      var c=document.querySelector('.dl .core'),r=c&&c.getBoundingClientRect();if(!r||!r.width)return;
      for(var i=0;i<3;i++)(function(i){var e=document.createElement('i');e.className='idle-seed';document.body.appendChild(e);
        var x=r.left+r.width/2+(Math.random()-.5)*60,y=r.top-20-Math.random()*40,dx=-(180+Math.random()*260),dy=-(120+Math.random()*200);
        e.animate([{transform:'translate('+x+'px,'+y+'px) rotate(0deg)',opacity:0},{transform:'translate('+(x+dx*.35)+'px,'+(y+dy*.25+30)+'px) rotate(-18deg)',opacity:1,offset:.25},{transform:'translate('+(x+dx)+'px,'+(y+dy)+'px) rotate(-40deg)',opacity:0}],{duration:4200+i*500,delay:700+i*380,easing:'cubic-bezier(.3,.6,.4,1)',fill:'both'}).onfinish=function(){e.remove()};
      })(i);
    },1100);
  }).observe(R,{attributes:true,attributeFilter:['class']});
})();

/* header tone: dark wordmark over light sections */
(function(){var R=document.documentElement,raf=0;
  function run(){raf=0;var hd=document.querySelector('.hd');if(!hd)return;var y=hd.getBoundingClientRect().bottom/2,light=false;
    var el=document.elementsFromPoint(innerWidth*.25,y).find(function(e){return e.closest&&e.closest('main>section,main>.sec,.hx,.ft,.ground')&&!e.closest('.hd')});
    var s=el&&el.closest('main>section,main>.sec,.hx,.ft,.ground');if(s&&!s.matches('.hx,.ft,.sec-work'))light=true;
    R.classList.toggle('hd-light',light&&!R.classList.contains('p7-hx'))}
  function req(){if(!raf)raf=requestAnimationFrame(run)}
  addEventListener('scroll',req,{passive:true});addEventListener('resize',req);setTimeout(run,500);
})();

/* bees follow the mouse */
(function(){
  if(window.__bees||!matchMedia('(pointer: fine)').matches||matchMedia('(prefers-reduced-motion: reduce)').matches)return;window.__bees=1;
  var b=document.createElement('img');b.src='assets/v7/bees.gif';b.alt='';b.className='bees';b.setAttribute('aria-hidden','true');document.body.appendChild(b);
  var tx=innerWidth/2,ty=innerHeight/2,x=tx,y=ty,on=false,px=x;
  addEventListener('pointermove',function(e){tx=e.clientX;ty=e.clientY;if(!on){on=true;x=tx;y=ty;b.classList.add('on')}},{passive:true});
  document.addEventListener('pointerleave',function(){on=false;b.classList.remove('on')});
  (function loop(){x+=(tx+28-x)*.07;y+=(ty+18-y)*.07;var vx=x-px;px=x;var flip=vx<-.4?-1:vx>.4?1:(b.__f||1);b.__f=flip;
    b.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px) translate(-50%,-50%) scaleX('+(-flip)+') rotate('+(Math.max(-12,Math.min(12,vx*1.5))).toFixed(1)+'deg)';requestAnimationFrame(loop)})();
})();
