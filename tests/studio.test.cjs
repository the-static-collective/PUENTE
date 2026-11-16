/* Teacher Playroom: lessons are playable, reproducible and genuinely adjustable.
   No API keys, student identifiers, AI networking or fake live-classroom claims. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
require("../protocol-engine.js");
require("../studio-engine.js");
const P=globalThis.PuenteProtocol,S=globalThis.PuenteStudio;
assert.ok(S);assert.equal(Object.keys(S.SCENES).length,5);
assert.equal(Object.keys(S.FOCUS).length,4);
const store=new Map();
globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
let samples=0;
for(const language of ["es","en"])
 for(const rank of ["starter","stretch"])
  for(const focus of Object.keys(S.FOCUS)){
   const work=S.forge({language,rank,focus,scene:"town",minutes:10},1001);
   const {puzzle,options}=work;
   assert.equal(puzzle.language,language);
   assert.equal(P.verify(puzzle).length,1);
   assert.equal(puzzle.rules.length,rank==="starter"?4:5);
   if(focus!=="all")assert.ok(puzzle.rules.some(r=>S.FOCUS[focus].types.includes(r.type)));
   assert.equal(S.solution(work).length,3);
   assert.deepEqual(S.forge(options,puzzle.seed).puzzle,puzzle,"Reopening a saved seed must show same puzzle");
   const plan=S.plan(work);
   assert.ok(plan.includes(P.codeFrom(puzzle.seed)));
   assert.ok(plan.includes(S.SCENES[options.scene].hook));
   assert.ok(plan.includes("TEACHER KEY"));
   assert.ok(plan.includes("https://puente.abundent.org/?protocol="));
   assert.ok(plan.includes(S.solution(work).join(" + ")));
   assert.equal(S.schedule(options.minutes).length,3);
   const prompt=S.chatPrompt(work);
   assert.match(prompt,/Chitty Chitty Bang Bang/);
   assert.match(prompt,/do not reveal|never reveal/i);
   assert.match(prompt,/TEACHER-ONLY ANSWER/);
   assert.ok(prompt.includes(P.statement(puzzle.rules[0],language)));
   samples++;
  }
for(const minutes of [10,20,30])assert.ok(S.schedule(minutes).length>=3);
const work=S.forge({language:"es",rank:"stretch",focus:"conditional",scene:"radio",minutes:20,
 note:"Discuss the subjunctive only if relevant; no personal student data."},1001);
let saved=S.save(work);
assert.equal(S.load().length,1);
assert.equal(S.load()[0].id,saved);
assert.ok(S.load()[0].options.note.includes("subjunctive"));
S.save(work);assert.equal(S.load().length,1,"Same puzzle must not create duplicate library entries");
assert.ok(S.load()[0].savedAt);
assert.ok(!S.plan(work).includes("student name"),"Lesson card should not invent student identities");
S.remove(saved);assert.equal(S.load().length,0);
for(let i=100;i<121;i++)S.save(S.forge({rank:"starter",language:"en"},i));
assert.equal(S.load().length,16,"Only bounded local favorites retained");
assert.equal(S.options({scene:"weird",focus:"nonexistent",minutes:999}).scene,"radio","No arbitrary HTML or theme values");
const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
const script=fs.readFileSync(path.join(__dirname,"..","studio-ui.js"),"utf8");
assert.doesNotThrow(()=>new Function(script));
for(const name of ["studio-engine.js","studio-ui.js"])assert.ok(html.includes('src="./'+name+'"'));
const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
for(const m of script.matchAll(/\$\("([^"]+)"\)/g))assert.ok(ids.has(m[1]),"Studio UI is missing #"+m[1]);
const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
assert.match(app,/PuenteStudioUI.init/);
assert.match(app,/searchParams.has\('studio'\)/);
console.log("TEACHER PLAYROOM PASS:",samples,"language/complexity/focus variants, plans, reversible seeds, chat prompts, limited local favorites and DOM wiring.");
