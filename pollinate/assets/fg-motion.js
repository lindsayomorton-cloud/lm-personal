(function(){
if(window.__fgm)return;window.__fgm=1;
var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
var PIECES='main .ng-eye, main .ng-lead, main .lx-kw, .fg-two-c, .fg-pc, .fg-steps li, .fg-calc-box, .fg-risk, .fg-terms>div, .fg-card, .fg-opp-grid aside, .fg-subnav, .fgm-piece';
var MEDIA='.fgm-media';
var io=rm||!('IntersectionObserver' in window)?null:new IntersectionObserver(function(es){
  var vis=es.filter(function(e){return e.isIntersecting}).map(function(e){return e.target});
  vis.sort(function(a,b){return a.compareDocumentPosition(b)&2?1:-1});
  var t=0;vis.forEach(function(el){el.style.setProperty('--bd',t.toFixed(2)+'s');el.classList.add('in');io.unobserve(el);
    if(el.classList.contains('fgm'))setTimeout(function(){el.classList.add('done')},1700+t*1000);
    t=Math.min(t+(el.classList.contains('fgs')?0.12:0.06),0.45)});
},{threshold:.15,rootMargin:'0px 0px -6% 0px'});
function split(el){var k=0;(function walk(n){[].slice.call(n.childNodes).forEach(function(c){
  if(c.nodeType===3){var f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(function(p){if(!p)return;if(/^\s+$/.test(p)){f.appendChild(document.createTextNode(p));return}var s=document.createElement('span');s.className='fgw';s.style.setProperty('--wd',(k++*0.03).toFixed(3)+'s');s.textContent=p;f.appendChild(s)});c.parentNode.replaceChild(f,c)}
  else if(c.nodeType===1&&c.tagName!=='BR')walk(c)})})(el)}
function add(el,cls){if(el.dataset.fgm)return;el.dataset.fgm='1';el.classList.add(cls);if(io)io.observe(el);else el.classList.add('in','done')}
function run(){
  document.querySelectorAll('.fgm-split').forEach(function(el){if(el.dataset.fgm)return;if(!el.textContent.trim())return;split(el);add(el,'fgs')});
  document.querySelectorAll(PIECES).forEach(function(el){if(!el.closest('[data-sym]'))add(el,'fgr')});
  document.querySelectorAll(MEDIA).forEach(function(el){add(el,'fgm')});
}
var busy=false;function soon(){if(busy)return;busy=true;setTimeout(function(){busy=false;run()},90)}
function start(){if(!document.querySelector('main'))return setTimeout(start,80);run();new MutationObserver(soon).observe(document.body,{childList:true,subtree:true});var n=0,iv=setInterval(function(){run();if(++n>20)clearInterval(iv)},400)}
start();
})();
