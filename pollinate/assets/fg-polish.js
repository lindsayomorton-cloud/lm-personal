(function(){
if(window.__fgp)return;window.__fgp=1;
var rm=matchMedia('(prefers-reduced-motion: reduce)').matches,fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
if(rm)return;
var TILT='.fg-pc,.sb-story,.mt-card,.hc-pin,.fg-tri-c,.sb-cause,.mg-card,.fg-two-c,.sb-rwc,.sb-person,.fg-steps li,.mg-next-item,.fg-xlink,.sb-voice';
var MAG='.btn,.fg-play,.sb-reel-nav button,.hc-focus-nav button';
var PAR='.fg-vposter,.fg-pitch-img,.mg-bleed>div,.fg-spot-img,.fg-q3-img,.fg-hframe,.mg-split figure>div,.fg-ap-img.on,.fg-two-img,.ng-img';
if(fine){
  document.addEventListener('pointermove',function(e){
    var c=e.target.closest&&e.target.closest(TILT);
    if(c){var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.setProperty('--mx',((x+.5)*100).toFixed(1)+'%');c.style.setProperty('--my',((y+.5)*100).toFixed(1)+'%');c.style.rotate=(-y).toFixed(3)+' '+x.toFixed(3)+' 0 '+(Math.hypot(x,y)*5).toFixed(2)+'deg';c.classList.add('fgp-t')}
    var b=e.target.closest&&e.target.closest(MAG);
    if(b){var q=b.getBoundingClientRect(),dx=e.clientX-(q.left+q.width/2),dy=e.clientY-(q.top+q.height/2);b.style.translate=(dx*.14).toFixed(1)+'px '+(dy*.2).toFixed(1)+'px';b.classList.add('fgp-m')}
  },{passive:true});
  document.addEventListener('pointerout',function(e){
    var c=e.target.closest&&e.target.closest(TILT);if(c&&!c.contains(e.relatedTarget)){c.style.rotate='';c.classList.remove('fgp-t')}
    var b=e.target.closest&&e.target.closest(MAG);if(b&&!b.contains(e.relatedTarget)){b.style.translate='';b.classList.remove('fgp-m')}
  },{passive:true});
}
var tick=false;
function par(){tick=false;var vh=innerHeight;document.querySelectorAll(PAR).forEach(function(el){var r=el.getBoundingClientRect();if(r.bottom<-100||r.top>vh+100)return;var p=(r.top+r.height/2-vh/2)/vh;el.style.translate='0 '+(p*-26).toFixed(1)+'px'})}
addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(par)}},{passive:true});addEventListener('resize',par);setTimeout(par,300);
function count(){document.querySelectorAll('.fg-hstrip b').forEach(function(b){if(b.__c)return;var m=b.textContent.match(/^(\$?)([\d,.]+)([KM]?)(.*)$/);if(!m)return;b.__c=1;var pre=m[1],num=parseFloat(m[2].replace(/,/g,'')),suf=m[3],rest=m[4],dec=(m[2].split('.')[1]||'').length,t0=performance.now(),final=b.textContent;
  var obs=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;obs.disconnect();(function step(t){var k=Math.min(1,(t-t0)/1100),e=1-Math.pow(1-k,3),v=num*e;var s=dec?v.toFixed(dec):Math.round(v).toLocaleString('en-US');var tn=b.firstChild&&b.firstChild.nodeType===3?b.firstChild:null;if(!tn||b.childNodes.length>1){return}tn.nodeValue=pre+s+suf+rest;if(k<1)requestAnimationFrame(step);else tn.nodeValue=final})(t0=performance.now())});obs.observe(b)})}
setTimeout(count,600);setTimeout(count,2000);
})();
