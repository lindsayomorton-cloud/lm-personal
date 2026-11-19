/* offline deal generator: seeded deals -> solve under exact rules -> replay proof -> metrics -> library */
const {SOL}=require(require('path').join(__dirname,'../src/90-sol-engine.js'));const fs=require('fs');
const out={rulesVersion:SOL.RULES,prng:'mulberry32-v1',shuffle:'fisher-yates-v1',solver:'dfs-v1',deals:[]};const seenDecks=new Set();
function metrics(deck,draw,r){const st=SOL.deal(deck,draw);let buriedAces=0;st.t.forEach(c=>c.c.forEach((x,i)=>{if(SOL.rank(x)===1&&i<c.c.length-1)buriedAces+=(c.c.length-1-i)}));
 const draws=r.actions.filter(a=>a.k==='draw').length,recycles=r.actions.filter(a=>a.k==='recycle').length;
 const openers=SOL.legal(st).filter(a=>a.k==='mv').length;
 return {expanded:r.expanded,length:r.actions.length,buriedAces,draws,recycles,openers};}
function run(draw,from,to,budget){let n=0;for(let seed=from;seed<to;seed++){const deck=SOL.deckFromSeed(seed);const enc=SOL.encode(deck);if(seenDecks.has(enc+draw))continue;
 const r=SOL.solve(SOL.deal(deck,draw),{nodes:budget});if(r.status!=='solved')continue;
 if(!SOL.replay(SOL.deal(SOL.decode(enc),draw),r.actions))throw new Error('replay failed '+seed);
 seenDecks.add(enc+draw);out.deals.push({seed,draw,deck:enc,verifiedWinnable:true,solution:r.actions,metrics:metrics(deck,draw,r)});n++;}
 return n;}
const t0=Date.now();
const n1=run(1,1,520,100000);const n3=run(3,100001,100320,100000);
/* difficulty estimate: weighted, normalized within each rule variant */
function score(m,all){const norm=(k,v)=>{const xs=all.map(d=>d.metrics[k]);const lo=Math.min(...xs),hi=Math.max(...xs);return hi>lo?(v-lo)/(hi-lo):0};
 return .25*norm('expanded',Math.log(m.expanded))+.25*norm('recycles',m.recycles)+.2*norm('buriedAces',m.buriedAces)+.15*norm('draws',m.draws)+.1*(1-norm('openers',m.openers))+.05*norm('length',m.length);}
const d1=out.deals.filter(d=>d.draw===1),d3=out.deals.filter(d=>d.draw===3);
d1.forEach(d=>d.metrics.expanded=Math.log(d.metrics.expanded));d3.forEach(d=>d.metrics.expanded=Math.log(d.metrics.expanded));
[d1,d3].forEach(set=>set.forEach(d=>d.difficultyScore=+score(d.metrics,set).toFixed(3)));
d1.sort((a,b)=>a.difficultyScore-b.difficultyScore);const half=Math.floor(d1.length/2);
d1.forEach((d,i)=>d.difficulty=i<half?'easy':'medium');d3.forEach(d=>d.difficulty='expert');
fs.writeFileSync('../solitaire-deals.json',JSON.stringify(out));
const lib={easy:d1.filter(d=>d.difficulty==='easy').map(d=>d.deck),medium:d1.filter(d=>d.difficulty==='medium').map(d=>d.deck),expert:d3.map(d=>d.deck)};
fs.writeFileSync('../src/91-sol-deals.js','/* verified-winnable starting deals (rules v1, mulberry32 + Fisher-Yates); each was solved and its winning path replayed through the engine. Full records with solutions: solitaire-deals.json */\nvar SOL_DEALS = '+JSON.stringify(lib)+';\n');
console.log('draw1',n1,'draw3',n3,'easy',lib.easy.length,'medium',lib.medium.length,'expert',lib.expert.length,'secs',(Date.now()-t0)/1000);
