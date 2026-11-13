const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const els={},storage={};
const element=()=>({innerHTML:'',textContent:'',style:{},dataset:{},disabled:false,classList:{add(){},remove(){}},scrollIntoView(){}});
const sound={play(){},stop(){},status(){}};const ctx=vm.createContext({Sound:sound,document:{getElementById(id){return els[id]??=element()},querySelectorAll(){return[]}},window:{scrollTo(){}},localStorage:{getItem(k){return storage[k]},setItem(k,v){storage[k]=v}},console});
vm.runInContext(script,ctx);
vm.runInContext(`
if(DATA.units.length!==3||DATA.lessons.length!==12)throw Error('Missing curriculum');
for(const l of DATA.lessons){
 if(l.questions.length!==4||new Set(l.sequence).size!==l.sequence.length)throw Error('Invalid lesson');
 for(const q of l.questions)if(!q.options.includes(q.a)||q.options.length!==4)throw Error('Invalid choices');
 chooseUnit(l.unit);openLesson(l.id);
 for(const m of ['quiz','truefalse','order']){
  startGame(m);let expected=m==='quiz'?4:1;
  if(m==='quiz'){for(let n=0;n<4;n++){answer({dataset:{answer:encodeURIComponent(l.questions[n].a)},classList:{add(){}}});if(score!==n+1)throw Error('Quiz score');nextQuestion()}}
  if(m==='truefalse'){tfAnswer(l.tf.answer,{classList:{add(){}}});nextQuestion()}
  if(m==='order'){for(const v of l.sequence)pick({dataset:{val:encodeURIComponent(v)},style:{}});checkOrder();nextQuestion()}
  if(score!==expected)throw Error('Perfect result');
  startGame(m);
  if(m==='quiz'){for(let n=0;n<4;n++){answer({dataset:{answer:encodeURIComponent(l.questions[n].options.find(x=>x!==l.questions[n].a))},classList:{add(){}}});nextQuestion()}}
  if(m==='truefalse'){tfAnswer(!l.tf.answer,{classList:{add(){}}});nextQuestion()}
  if(m==='order'){for(const v of [...l.sequence].reverse())pick({dataset:{val:encodeURIComponent(v)},style:{}});checkOrder();nextQuestion()}
  if(score!==0)throw Error('Wrong answer score');
 }
}
if(stars!==108)throw Error('Stars persistence');
`,ctx);
assert.equal(storage['science3-stars-v1'],'108');
const denied=vm.createContext({Sound:sound,document:ctx.document,window:{scrollTo(){}},localStorage:{getItem(){throw Error('denied')},setItem(){throw Error('denied')}}});vm.runInContext(script,denied);
console.log('PASS: 3 units, 12 lessons, all 36 games correct/wrong paths, 48 choices, results, 108 saved stars, storage denied fallback');
