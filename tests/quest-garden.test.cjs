/* Standalone test: node tests/quest-garden.test.cjs. No network, credentials or student data. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const repo=path.join(__dirname,"..");
const cache=new Map();
globalThis.localStorage={
  getItem(key){return cache.has(key)?cache.get(key):null;},
  setItem(key,value){cache.set(key,String(value));},
  removeItem(key){cache.delete(key);}
};
globalThis.window=globalThis;
require(path.join(repo,"garden.js"));
require(path.join(repo,"game-lab.js"));
require(path.join(repo,"next-game.js"));
require(path.join(repo,"play-modes.js"));
const G=globalThis.PuenteGarden;
assert.ok(G);
let total=0;
for(const language of ["en","es"]){
  for(const world of Object.keys(G.WORLD)){
    for(const focus of ["mixed","time","direction"]){
      const a=G.derive({language,world,focus,seed:12345});
      const b=G.derive({language,world,focus,seed:12345});
      assert.deepEqual(a,b,"Generator must be reproducible from same seed");
      assert.equal(a.schema,"puente.questpack/v1");
      assert.equal(a.questions.length,6);
      assert.equal(new Set(a.questions.map(q=>q.prompt)).size,6);
      for(const q of a.questions){
        assert.equal(q.choices.length,3);
        assert.equal(typeof q.choices[q.correct],"string");
        assert.ok(q.explanation.length>=8);
      }
      const link=G.toLink(a);
      const unpacked=G.fromLink(link);
      assert.deepEqual(unpacked,a,"Homework links must preserve the entire pack");
      total++;
    }
  }
}
const draft=G.derive({language:"es",world:"signal",focus:"market",seed:432});
const draftId=G.draft(draft,"author-proposed");
assert.equal(G.load().drafts.length,1);
let alt=JSON.parse(JSON.stringify(draft));alt.title="Signal Tower: Revisited";
G.revise(draftId,alt);
assert.equal(G.load().drafts[0].pack.title,alt.title);
const approved=G.approve(draftId);
assert.equal(approved.pack.title,alt.title);
assert.equal(G.load().drafts.length,0);
assert.equal(G.load().approved.length,1);
assert.throws(()=>G.approve(draftId),/Draft not found/);
G.remove(draftId,"approved");
assert.equal(G.load().approved.length,0);
const invalid=JSON.parse(JSON.stringify(draft));
invalid.questions[0].correct=3;
assert.throws(()=>G.validate(invalid),/correct answer/);
invalid.questions[0].correct=0;
invalid.questions[0].choices=["same","same","different"];
assert.throws(()=>G.validate(invalid),/duplicate choices/);
assert.throws(()=>G.fromLink("x!!"),/Invalid practice link/);
for(const filename of ["app.js","garden.js","game-lab.js","next-game.js","play-modes.js","garden-ui.js"]){
  assert.doesNotThrow(()=>new Function(fs.readFileSync(path.join(repo,filename),"utf8")),filename+" invalid JS");
}
const html=fs.readFileSync(path.join(repo,"index.html"),"utf8");
const allIds=new Set(Array.from(html.matchAll(/\bid="([^"]+)"/g),m=>m[1]));
for(const filename of ["app.js","garden-ui.js"]){
  const text=fs.readFileSync(path.join(repo,filename),"utf8");
  const matches=[...text.matchAll(/\$\(['"]([^'"]+)['"]\)/g)];
  for(const m of matches)assert.ok(allIds.has(m[1]),filename+" references missing #"+m[1]);
}
for(const name of ["config.js","garden.js","game-lab.js","next-game.js","play-modes.js","garden-ui.js","app.js"]){
  assert.ok(html.includes('src="./'+name+'"'),name+" not wired in HTML");
}
const sql=fs.readFileSync(path.join(repo,"supabase/garden-v2.sql"),"utf8");
assert.match(sql,/create or replace function public\.puente_create_room\(p_language text,p_pack jsonb\)/);
assert.match(sql,/revoke all on function public\.puente_create_room\(text,jsonb\)/);
assert.match(sql,/case when r\.status in \('reveal','finished'\)/);

for(const language of ["en","es"]){
  for(const mode of ["mixed","forge","signal","map"]){
    const pack=G.derive({language,world:"mystery",focus:"conversation",mode,seed:718});
    assert.equal(pack.questions.length,6);
    const counts={decode:0,trade:0,repair:0};
    for(const q of pack.questions){
      counts[q.mechanic]=(counts[q.mechanic]||0)+1;
      if(q.mechanic==="repair"){
        assert.equal(globalThis.PuenteGameLab.isWordWeave(q),true,"Word Weave must use cyclic sentence tiles");
        assert.equal(q.choices[q.correct].split(" ").length,3);
        assert.ok(q.explanation.length>8);
      }
    }
    if(mode==="mixed")assert.deepEqual(counts,{decode:2,trade:2,repair:2});
    if(mode==="forge")assert.equal(counts.repair,6);
    if(mode==="signal")assert.equal(counts.decode,6);
    if(mode==="map")assert.equal(counts.trade,6);
  }
}
assert.equal(globalThis.PuenteAssembly.winner({world:[0,3,2],mode:[1,0,4]}).world,"signal");
assert.equal(globalThis.PuenteAssembly.winner({world:[0,3,2],mode:[1,0,4]}).mode,"forge");
assert.equal(globalThis.PuenteAssembly.winner(null).mode,null);
const fakeCrypto=require("node:crypto").webcrypto;
const appSource=fs.readFileSync(path.join(repo,"app.js"),"utf8").replace(/\ninit\(\);\s*$/,"\nreturn {demo};");
const {demo}=new Function("window","localStorage","crypto",appSource)(globalThis,globalThis.localStorage,fakeCrypto);
const roomPack=G.derive({language:"en",world:"market",mode:"mixed",seed:133});
const roomCode=demo.create("en",roomPack);
demo.join(roomCode,"Test Fox");
demo.join(roomCode,"Blue Kite");
assert.throws(()=>demo.vote(roomCode,"Test Fox",0,2),/three bridge pieces/);
demo.advance(roomCode);
for(let step=1;step<=3;step++){
  const state=demo.snapshot(roomCode,"teacher","");
  assert.equal(state.step,step);
  assert.equal(state.question.correct_choice,null,"Live answer key must be withheld before reveal");
  demo.answer(roomCode,"Test Fox",roomPack.questions[step-1].correct);
  demo.advance(roomCode);
  if(step<3)demo.advance(roomCode);
}
assert.equal(demo.snapshot(roomCode,"teacher","").cleared,3);
assert.ok(demo.vote(roomCode,"Test Fox",1,2).accepted);
assert.ok(demo.vote(roomCode,"Blue Kite",2,1).accepted);
assert.ok(demo.vote(roomCode,"Blue Kite",1,1).accepted,"Votes may be revised");
const teacher=demo.snapshot(roomCode,"teacher","");
assert.deepEqual(teacher.design_counts,{world:[0,2,0],mode:[0,1,1]});
const student=demo.snapshot(roomCode,"student","Test Fox");
assert.equal(student.design_counts,null,"Students must not receive teacher tallies");
assert.deepEqual(student.my_design,{world:1,mode:2});
assert.throws(()=>demo.vote(roomCode,"Not Joined",1,2),/Join/);
assert.throws(()=>demo.vote(roomCode,"Blue Kite",4,2),/Invalid/);
const sqlV3=fs.readFileSync(path.join(repo,"supabase/village-assembly-v3.sql"),"utf8");
assert.match(sqlV3,/revoke all on public\.puente_design_votes/);
assert.match(sqlV3,/create or replace function public\.puente_cast_next_game_vote/);
assert.match(sqlV3,/v_cleared<3/);
assert.match(sqlV3,/design_counts/);
console.log("Quest Garden tests passed:",total,"base packs; 8 game modes; draft approval; 3-point unlock, vote revisions, aggregate-only student views.");

