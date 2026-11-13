const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const baseline=fs.readFileSync('lessons.js','utf8');
const soundEvents=[],events={},elements={},storage={'science3-stars-v1':'17'};let timers=new Map(),timerId=0;
const element=()=>({innerHTML:'',textContent:'',hidden:false,dataset:{},style:{},setAttribute(){},focus(){},scrollIntoView(){},classList:{add(){},remove(){}}});
const c=vm.createContext({assert,console,window:{scrollTo(){},matchMedia(){return{matches:false}}},Sound:{play(...x){soundEvents.push(x)},stop(){},status(){}},document:{activeElement:null,getElementById(id){return elements[id]??=element()},querySelector(){return element()},querySelectorAll(){return[]},addEventListener(e,f){events[e]=f},elementFromPoint(){return null}},localStorage:{getItem(k){return storage[k]??null},setItem(k,v){storage[k]=v}},setTimeout(f){timers.set(++timerId,f);return timerId},clearTimeout(id){timers.delete(id)}});
for(const f of ['lessons.js','activities.js','app.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
const run=src=>vm.runInContext(src,c);
run(`assert.equal(DATA.units.length,3);assert.equal(DATA.lessons.length,12);assert.equal(MODES.length,8);assert.equal(stars,17);
for(const l of DATA.lessons){const a=ACTIVITIES[l.id];assert.ok(a);assert.equal(l.questions.length,4);for(const q of l.questions){assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(q.a))}assert.equal(a.cards.length,4);assert.equal(new Set(a.cards.map(c=>c[1])).size,4);assert.equal(a.similar.correct.length,2);assert.ok(a.similar.correct.every(v=>a.similar.options.includes(v)));assert.equal(new Set(a.drag.map(p=>p[1])).size,3);assert.equal(a.classify.groups.length,2);for(const [item,g] of a.classify.items)assert.ok(g===0||g===1);for(const r of a.riddles)assert.ok(r.options.includes(r.answer));}
const immutable=JSON.stringify(DATA);let tested=0;
for(const l of DATA.lessons){openLesson(l.id);for(const m of MODES){start(m.id);assert.equal(S.score,0);assert.equal(S.finished,false);next();assert.equal(S.finished,false);
 if(m.id==='quiz'){for(const q of l.questions){singleAnswer(q.a);const n=S.score;singleAnswer(q.options[1]);assert.equal(S.score,n);next()}}
 if(m.id==='truefalse'){tf(String(l.tf.answer));next()}
 if(m.id==='order'){checkOrder();assert.equal(S.answered,false);pickOrder(0);pickOrder(0);assert.equal(S.order.length,1);undoOrder();for(let i=0;i<l.sequence.length;i++)pickOrder(i);checkOrder();next()}
 if(m.id==='similar'){for(const v of activity().similar.correct)chooseSimilar(v);checkSimilar();next()}
 if(m.id==='memory'){for(let pair=0;pair<4;pair++){const ids=S.deck.map((x,i)=>x.pair===pair?i:-1).filter(i=>i>=0);flip(ids[0]);flip(ids[0]);assert.equal(S.face.length,1);flip(ids[1])}next()}
 if(m.id==='drag'){for(let i=0;i<3;i++){selectDrag(i);drop(i);drop(i);assert.equal(S.score,i+1)}next()}
 if(m.id==='classify'){for(const item of activity().classify.items)classify(item[1]);next()}
 if(m.id==='riddle'){for(const r of activity().riddles){singleAnswer(r.answer);next()}}
 assert.equal(S.finished,true,l.id+' '+m.id);assert.equal(S.score,total());assert.equal(progress.best[key()],3);const before=stars;finish();next();assert.equal(stars,before);tested++;
}}
assert.equal(tested,96);assert.equal(Object.keys(progress.best).length,96);assert.equal(stars,305);assert.equal(JSON.stringify(DATA),immutable);
// Every option, true/false outcome, and all six similarity combinations.
for(const l of DATA.lessons){openLesson(l.id);for(let qi=0;qi<4;qi++)for(const v of l.questions[qi].options){start('quiz');S.q=qi;singleAnswer(v);assert.equal(S.score,v===l.questions[qi].a?1:0)}for(const v of [true,false]){start('truefalse');tf(String(v));assert.equal(S.score,v===l.tf.answer?1:0)}for(let a=0;a<4;a++)for(let b=a+1;b<4;b++){start('similar');const o=activity().similar.options;chooseSimilar(o[a]);chooseSimilar(o[b]);checkSimilar();assert.equal(S.score,[o[a],o[b]].every(x=>activity().similar.correct.includes(x))?1:0)}start('order');for(let i=l.sequence.length-1;i>=0;i--)pickOrder(i);checkOrder();assert.equal(S.score,0);start('drag');selectDrag(0);drop(1);assert.equal(S.score,0);assert.equal(S.mistakes,1);drop(0);assert.equal(S.score,1);start('classify');classify(1-activity().classify.items[0][1]);assert.equal(S.q,0);assert.equal(S.mistakes,1);classify(activity().classify.items[0][1]);assert.equal(S.q,1)}
// Returning home or restarting cancels unmatched-card timers.
openLesson(1);start('memory');const a=0,b=S.deck.findIndex(x=>x.pair!==S.deck[0].pair);flip(a);flip(b);assert.equal(S.busy,true);home();assert.equal(S.mode,null);
`);
assert.equal(timers.size,0,'timers cleared by navigation');
assert.equal(storage['science3-stars-v1'],'305');
run(`openLesson(2);start('memory');const pair0=0,pair1=S.deck.findIndex(x=>x.pair!==S.deck[0].pair);flip(pair0);flip(pair1);`);
for(const fn of [...timers.values()])fn();timers.clear();run(`assert.equal(S.busy,false);assert.equal(S.face.length,0);start('drag');`);
let target={dataset:{drop:'0'},disabled:false,closest(){return this},classList:{add(){},remove(){}}};c.document.elementFromPoint=()=>target;
const token={disabled:false,dataset:{drag:'0'},style:{},classList:{add(){},remove(){}},setPointerCapture(){},releasePointerCapture(){}};
events.pointerdown({target:{closest(){return token}},button:0,isPrimary:true,pointerId:1,clientX:10,clientY:10});events.pointermove({pointerId:1,clientX:90,clientY:100});events.pointerup({pointerId:1,clientX:90,clientY:100});run('assert.equal(S.score,1);assert.equal(dragging,null);home();assert.equal(suppressClick,false)');
assert(soundEvents.some(e=>e[0]==='finish'));assert(soundEvents.some(e=>e[0]==='error'));assert(soundEvents.some(e=>e[0]==='start'));
run(`const savedStars=stars;progress.best['1:quiz']=3;openLesson(1);start('quiz');for(const q of lesson().questions){singleAnswer(q.options.find(x=>x!==q.a));next()}assert.equal(best(1,'quiz'),3);assert.equal(stars,savedStars);`);
console.log('PASS: 96 complete activities; all 192 quiz options; 24 true/false paths; 72 similarity combinations; order validation/undo; memory locking/timer cleanup; drag/click mapping; classification retries; all riddles; no duplicate rewards; legacy stars and best progress preserved.');
