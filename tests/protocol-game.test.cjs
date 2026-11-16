/* PUENTE RELAY gameplay tests: pure rules, generated uniqueness, valid routing,
   correct/incorrect transmissions, translation and stable challenge codes. */
"use strict";
const assert=require("node:assert/strict");
require("../protocol-engine.js");
const G=globalThis.PuenteProtocol;
assert.ok(G);
assert.equal(G.LETTERS.length,6);
assert.equal(G.POWER,3);
assert.ok(G.BASE.length>=12);
assert.equal(G.BASE.every(mask=>G.ones(mask)===3&&G.connected(mask).connected),true);
let total=0;
for(let i=1;i<=120;i++){
 const seed=i*729+1;
 for(const language of ["es","en"]){
  const p=G.generate(seed,language);
  assert.equal(p.schema,"puente.relay/v1");
  assert.equal(p.language,language);
  assert.ok(p.rules.length>=4);
  assert.ok(new Set(p.rules.map(r=>r.type)).size>=3);
  const answers=G.verify(p);
  assert.deepEqual(answers,[p.solution],"Exactly one physically valid relay network must obey all intercepted rules.");
  assert.equal(G.generate(seed,language).solution,p.solution,"Same code must reproduce the puzzle.");
  assert.deepEqual(G.generate(seed,language).rules,p.rules,"Rules must be seed-stable.");
  for(const [i,r] of p.rules.entries()){
   assert.ok(G.statement(r,language).length>18,"Rule "+i+" must have meaningful written language.");
   assert.equal(G.matches(r,p.solution),true);
   assert.ok(G.BASE.some(mask=>!G.matches(r,mask)),"Rule must actually eliminate some possibilities.");
   const other=p.rules.filter((_,j)=>i!==j);
   assert.ok(G.BASE.filter(mask=>other.every(q=>G.matches(q,mask))).length>1,"Each rule must matter to uniqueness.");
  }
  assert.equal(G.codeTo(G.codeFrom(seed)),seed);
  total++;
 }
}
const seed=2707,puzzle=G.generate(seed,"es");
const bad=G.BASE.find(mask=>mask!==puzzle.solution);
assert.ok(Number.isInteger(bad));
let run=G.begin(seed,"es");
for(let i=0;i<6;i++)if((bad>>i)&1)G.toggle(run,i);
assert.equal(G.ones(run.mask),3);assert.equal(G.connected(run.mask).connected,true);
const wrong=G.pulse(run);
assert.equal(wrong.type,"reject");
assert.ok(wrong.correct<wrong.total);
assert.equal(run.solved,false);
assert.equal(run.attempts,1);
const clue=G.translate(run,0);
assert.ok(clue.length>12);
assert.equal(run.hints.length,1);
G.translate(run,0);assert.equal(run.hints.length,1,"Repeated translation must not double-charge");
for(let i=0;i<6;i++)if(((run.mask>>i)&1)!==((puzzle.solution>>i)&1))G.toggle(run,i);
assert.equal(G.pulse(run).type,"win");
assert.equal(run.solved,true);
assert.ok(G.score(run)<1000,"Hints/failed pulses must change the personal score.");
assert.throws(()=>G.toggle(run,0),/secured/i,"Solved mission must not mutate.");
const fresh=G.begin(seed,"es");
assert.equal(G.pulse(fresh).type,"power","Can't submit an empty network.");
assert.equal(fresh.attempts,0);
assert.throws(()=>G.codeTo("DROP TABLE"),/Invalid/);
assert.throws(()=>G.codeTo("-23"),/Invalid/);
assert.throws(()=>G.generate(-1),/code/);
assert.throws(()=>G.generate(111,"xx"),/language/i);
for(const name of ["protocol-engine.js","protocol-ui.js"])
 assert.doesNotThrow(()=>new Function(require("fs").readFileSync(require("path").join(__dirname,"..",name),"utf8")));
const html=require("fs").readFileSync(require("path").join(__dirname,"..","index.html"),"utf8");
assert.match(html,/id="protocolScreen"/);
assert.match(html,/id="protocolPulse"/);
assert.match(html,/id="protocolShareLink"/);
assert.match(html,/src="\.\/protocol-engine\.js"/);
assert.match(html,/src="\.\/protocol-ui\.js"/);
const ui=require("fs").readFileSync(require("path").join(__dirname,"..","protocol-ui.js"),"utf8");
const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
for(const m of ui.matchAll(/\$\("([^"]+)"\)/g))assert.ok(ids.has(m[1]),"Missing HTML #"+m[1]);
const app=require("fs").readFileSync(require("path").join(__dirname,"..","app.js"),"utf8");
assert.match(app,/PuenteProtocolUI\.init/);
assert.match(app,/'protocol'/);
console.log("RELAY GAME PASS:",total,"uniquely-solvable bilingual protocols, all meaningful rules, routing, pulses, scoring, stable shares and UI wiring.");
