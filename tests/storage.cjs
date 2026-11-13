const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
function boot(storage){const nodes={};const c=vm.createContext({window:{},localStorage:storage,Sound:{status(){}},document:{getElementById(id){return nodes[id]??={style:{},innerHTML:'',textContent:''}},addEventListener(){}},setTimeout,clearTimeout});for(const f of ['lessons.js','activities.js','app.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);return c}
let c=boot({getItem(k){return k==='science3-progress-v2'?'not json':'43'}});assert.equal(vm.runInContext('stars',c),43);
c=boot({getItem(){throw Error('denied')},setItem(){throw Error('denied')}});assert.equal(vm.runInContext('stars',c),0);
c=boot({getItem(k){return k==='science3-progress-v2'?JSON.stringify({best:{'1:quiz':3,'99:quiz':3,'1:fake':3,'2:quiz':999},lastLesson:999}):'Infinity'}});assert.equal(vm.runInContext('stars',c),0);assert.equal(vm.runInContext('JSON.stringify(progress)',c),JSON.stringify({best:{'1:quiz':3},lastLesson:1}));
console.log('PASS: corrupted progress preserves legacy stars; denied storage does not crash; invalid scores, lesson IDs and nonfinite stars are rejected.');
