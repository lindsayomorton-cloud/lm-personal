const {SOL}=require(require('path').join(__dirname,'../src/90-sol-engine.js'));let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('FAIL',m)}};
const C=(r,s)=>s*13+r-1; // s:0h1d2c3s
// deal shape
let st=SOL.deal(SOL.deckFromSeed(7),1);
ok(st.t.map(c=>c.c.length).join()==='1,2,3,4,5,6,7','column sizes');ok(st.t.every((c,i)=>c.d===i),'face-down counts');ok(st.s.length===24&&!st.w.length,'stock 24');
const d=SOL.deckFromSeed(7);ok(st.s[st.s.length-1]===d[51],'stock top is deck[51]');ok(new Set(d).size===52,'52 unique');
ok(SOL.encode(d)===SOL.encode(SOL.decode(SOL.encode(d))),'encode roundtrip');
// deterministic
ok(SOL.encode(SOL.deckFromSeed(42))===SOL.encode(SOL.deckFromSeed(42)),'deterministic seed');
// draw 3 partial + recycle order
let s3=SOL.deal(d,3);s3.s=s3.s.slice(0,4);const before=s3.s.slice();
let a=SOL.apply(s3,{k:'draw'});ok(a.w.length===3&&a.s.length===1,'draw 3');a=SOL.apply(a,{k:'draw'});ok(a.w.length===4&&!a.s.length,'partial draw');
ok(SOL.apply(a,{k:'draw'})===null,'no draw from empty');let rc=SOL.apply(a,{k:'recycle'});ok(rc.s.join()===before.join()&&!rc.w.length,'recycle restores exact order');
ok(SOL.apply(s3,{k:'recycle'})===null,'no recycle while stock has cards');
// rules on a hand-made position
const mk=()=>({t:[{c:[C(13,0)],d:0},{c:[C(5,2),C(12,3)],d:1},{c:[],d:0},{c:[C(8,1)],d:0},{c:[C(7,2)],d:0},{c:[C(2,0)],d:0},{c:[C(7,0)],d:0}],f:[1,0,0,0],s:[],w:[C(6,0)],draw:1});
let p=mk();
ok(SOL.apply(p,{k:'mv',from:{p:'t',i:4},to:{p:'t',i:3},n:1}),'black 7 on red 8');
ok(!SOL.apply(p,{k:'mv',from:{p:'t',i:6},to:{p:'t',i:3},n:1}),'red 7 on red 8 rejected');
ok(!SOL.apply(p,{k:'mv',from:{p:'t',i:1},to:{p:'t',i:0},n:2}),'face-down source rejected');
let q=SOL.apply(p,{k:'mv',from:{p:'t',i:1},to:{p:'t',i:0},n:1});ok(q&&q.t[1].d===0,'auto flip after move');
ok(!SOL.apply(p,{k:'mv',from:{p:'t',i:4},to:{p:'t',i:2},n:1}),'non-king to empty rejected');
ok(SOL.apply(p,{k:'mv',from:{p:'t',i:0},to:{p:'t',i:2},n:1}),'king to empty ok');
ok(SOL.apply(p,{k:'mv',from:{p:'t',i:5},to:{p:'f',i:0},n:1}),'2h on Ah foundation');
ok(!SOL.apply(p,{k:'mv',from:{p:'t',i:5},to:{p:'f',i:1},n:1}),'wrong suit foundation');
ok(!SOL.apply(p,{k:'mv',from:{p:'t',i:6},to:{p:'f',i:0},n:1}),'wrong rank foundation');
let r1=SOL.apply(mk(),{k:'mv',from:{p:'t',i:4},to:{p:'t',i:3},n:1});r1=SOL.apply(r1,{k:'mv',from:{p:'w'},to:{p:'t',i:3},n:1});ok(r1&&r1.t[3].c.length===3,'waste 6h on 7c');
let ff=mk();ff.f=[0,0,3,0];ok(SOL.apply(ff,{k:'mv',from:{p:'f',i:2},to:{p:'t',i:5},n:1})===null,'3c on 2h rejected');ff.t[5].c=[C(4,0)];ok(SOL.apply(ff,{k:'mv',from:{p:'f',i:2},to:{p:'t',i:5},n:1}),'foundation return 3c on 4h');
// suffix move
let sx={t:[{c:[C(9,1),C(8,2),C(7,0)],d:0},{c:[C(10,3)],d:0},{c:[],d:0},{c:[],d:0},{c:[],d:0},{c:[],d:0},{c:[],d:0}],f:[0,0,0,0],s:[],w:[],draw:1};
ok(SOL.apply(sx,{k:'mv',from:{p:'t',i:0},to:{p:'t',i:1},n:3}),'move valid run of 3');ok(!SOL.apply(sx,{k:'mv',from:{p:'t',i:0},to:{p:'t',i:1},n:2}),'run start must fit');
// immutability + invariants under random play
for(let g=0;g<200;g++){let s=SOL.deal(SOL.deckFromSeed(1000+g),g%2?3:1),r=SOL.rng(g);for(let m=0;m<300;m++){const L=SOL.legal(s);if(!L.length)break;const snap=JSON.stringify(s);const n=SOL.apply(s,L[Math.floor(r()*L.length)]);ok(n,'legal move applies');ok(JSON.stringify(s)===snap,'old state untouched');s=n;
 if(SOL.count(s)!==52)ok(false,'52 cards');const all=[];s.t.forEach(c=>{all.push(...c.c);ok(c.d<=c.c.length&&(c.c.length===0||c.d<c.c.length),'top face up')});all.push(...s.s,...s.w);for(let i=0;i<4;i++)for(let k=0;k<s.f[i];k++)all.push(i*13+k);if(new Set(all).size!==52)ok(false,'unique ids');}}
// solver returns replayable or unknown, never claims unsolvable
let rr=SOL.solve(SOL.deal(SOL.deckFromSeed(3),1),{nodes:3000});ok(['solved','unknown','exhausted'].includes(rr.status),'solver status');if(rr.status==='solved')ok(SOL.replay(SOL.deal(SOL.deckFromSeed(3),1),rr.actions),'replay');
console.log(fails?fails+' FAILED':'all engine tests passed');
