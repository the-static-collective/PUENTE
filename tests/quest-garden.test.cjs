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
require(path.join(repo,"garden.js"));
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
for(const filename of ["app.js","garden.js","garden-ui.js"]){
  assert.doesNotThrow(()=>new Function(fs.readFileSync(path.join(repo,filename),"utf8")),filename+" invalid JS");
}
const html=fs.readFileSync(path.join(repo,"index.html"),"utf8");
const allIds=new Set(Array.from(html.matchAll(/\bid="([^"]+)"/g),m=>m[1]));
for(const filename of ["app.js","garden-ui.js"]){
  const text=fs.readFileSync(path.join(repo,filename),"utf8");
  const matches=[...text.matchAll(/\$\(['"]([^'"]+)['"]\)/g)];
  for(const m of matches)assert.ok(allIds.has(m[1]),filename+" references missing #"+m[1]);
}
for(const name of ["config.js","garden.js","garden-ui.js","app.js"]){
  assert.ok(html.includes('src="./'+name+'"'),name+" not wired in HTML");
}
const sql=fs.readFileSync(path.join(repo,"supabase/garden-v2.sql"),"utf8");
assert.match(sql,/create or replace function public\.puente_create_room\(p_language text,p_pack jsonb\)/);
assert.match(sql,/revoke all on function public\.puente_create_room\(text,jsonb\)/);
assert.match(sql,/case when r\.status in \('reveal','finished'\)/);
console.log("Quest Garden tests passed:",total,"pack variants, library, safety gates, linked page and SQL adapter.");
