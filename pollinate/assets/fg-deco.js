(function(){
if(window.__fgd)return;window.__fgd=1;
var map=[[/^circular/i,'circular'],[/^grown/i,'grown'],[/^(land|regenerative)/i,'land'],[/^(water|clean water)/i,'water']];
var SEL='.fg-pc-img span, .fg-stg, .tag, .fg-chip, .fg-two-k';
function area(t){t=(t||'').trim();for(var i=0;i<map.length;i++)if(map[i][0].test(t))return map[i][1];return ''}
function run(){
  document.querySelectorAll(SEL).forEach(function(el){var a=area(el.textContent);if(a&&el.getAttribute('data-area')!==a)el.setAttribute('data-area',a)});
  document.querySelectorAll('.fg-pc').forEach(function(c){var t=c.querySelector('.fg-pc-img span');var a=t&&area(t.textContent);if(a&&c.getAttribute('data-area')!==a)c.setAttribute('data-area',a)});
}
var busy=false;function soon(){if(busy)return;busy=true;setTimeout(function(){busy=false;run()},120)}
function start(){if(!document.body)return setTimeout(start,50);run();new MutationObserver(soon).observe(document.body,{childList:true,subtree:true,characterData:true});var n=0,iv=setInterval(function(){run();if(++n>25){clearInterval(iv);setInterval(run,2000)}},400);addEventListener('load',run)}
start();
})();
