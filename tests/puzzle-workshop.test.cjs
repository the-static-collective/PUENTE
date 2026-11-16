/* PUENTE Puzzle Workshop tests: deterministic, no school data and no network. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const P=require(path.join(__dirname,"..","puzzle-engine.js"))||globalThis.PuentePuzzle;
const E=P?.sample?P:globalThis.PuentePuzzle;
assert.ok(E,"Puzzle engine should export to globalThis under Node");
assert.equal(E.W,8);assert.equal(E.H,6);assert.equal(E.SIZE,48);
const sample=E.sample("es");
assert.equal(sample.schema,"puente.map-puzzle/v1");
assert.ok(E.validate(sample));
assert.equal(E.reachable(sample),true);
assert.equal(E.reachable(sample,{blockGates:true}),false);
assert.equal(sample.tiles.split("S").length-1,1);
assert.equal(sample.tiles.split("E").length-1,1);
assert.equal(sample.tiles.split("P").length-1,1);
assert.equal(sample.tiles.split("Q").length-1,1);
const es=E.question(sample,sample.tiles.indexOf("a"));
assert.equal(es.correct,0);assert.equal(es.choices.length,3);
const en=E.sample("en");
assert.ok(E.validate(en));assert.notDeepEqual(E.question(sample,"a").prompt,E.question(en,"a").prompt);
assert.equal(E.PHRASES.es.length,20);assert.equal(E.PHRASES.en.length,20);
const packet=E.encode(sample);
assert.deepEqual(E.decode(packet),sample);
assert.ok(packet.length<1400,"Packet must fit in a shareable URL");
assert.throws(()=>E.decode("bad!"),/Invalid puzzle link/);
assert.throws(()=>E.validate({...sample,language:"zz"}),/learning language/);
assert.throws(()=>E.validate({...sample,tiles:".".repeat(48)}),/START/);
const noPortals={...sample,tiles:sample.tiles.replace("P",".")};
assert.throws(()=>E.validate(noPortals),/Portals need/);
const noLock={...sample,tiles:sample.tiles.replace("a",".")};
assert.throws(()=>E.validate(noLock),/word locks/);
const bypass={...sample,tiles:sample.tiles.substring(0,3)+"."+sample.tiles.substring(4)};
assert.throws(()=>E.validate(bypass),/reachable without a word lock/);
const impossible={...sample,tiles:sample.tiles.replace("a","#")};
assert.throws(()=>E.validate(impossible),/word locks/);
const floor=E.place(sample,E.idx(0,0),"#");
assert.equal(floor.tiles[E.idx(0,0)],"#");
const startMoved=E.place(sample,E.idx(0,0),"S");
assert.equal(startMoved.tiles[E.idx(0,0)],"S");
assert.equal(startMoved.tiles[E.idx(1,2)],".");
assert.throws(()=>E.place(sample,50,"#"),/tile/);
assert.throws(()=>E.place(sample,2,"gate",{gate:99}),/valid word/);
const altered=E.place(sample,E.idx(1,1),"gate",{gate:9});
assert.equal(altered.tiles[E.idx(1,1)],"j");
const branch=E.remix(sample);
assert.equal(branch.parent,E.hash(sample));
assert.equal(branch.generation,1);
assert.equal(branch.tiles,sample.tiles);
assert.equal(E.hash(branch),E.hash(sample),"lineage info must not change puzzle content identity");
let run=E.newRun(sample);
assert.equal(run.won,false);
assert.equal(run.pos,E.idx(1,2));
assert.equal(E.move(run,1,0).type,"move");
const locked=E.move(run,1,0);
assert.equal(locked.type,"question");
assert.equal(run.pos,E.idx(2,2),"Word lock must block movement");
assert.equal(locked.question.correct,0);
assert.equal(E.move(run,1,0).type,"locked");
assert.equal(E.solve(run,2).type,"retry");
assert.equal(run.mistakes,1);
assert.equal(E.solve(run,0).type,"unlocked");
assert.equal(run.unlocked.length,1);
assert.equal(run.pos,E.idx(3,2));
assert.equal(E.move(run,1,0).type,"move");
assert.equal(E.move(run,1,0).type,"move");
assert.equal(E.move(run,1,0).type,"win");
assert.equal(run.won,true);
assert.equal(E.move(run,0,-1).type,"won");
run=E.newRun(sample);
assert.equal(E.move(run,0,1).type,"move");
assert.equal(E.move(run,0,1).type,"portal");
assert.equal(run.pos,E.idx(2,0));
assert.equal(run.portals,1);
assert.equal(E.move(run,0,-1).type,"wall");

// High-school tier: grammar has genuinely distinct forms, and mission completion
// requires strategic route choices, three locks and two recovered signal fragments.
assert.equal(E.PHRASES.es.length,20);
assert.equal(E.PHRASES.en.length,20);
assert.equal(E.ADVANCED.es.length,10);
assert.equal(E.ADVANCED.en.length,10);
assert.equal(E.isGate("k"),true);
assert.equal(E.isGate("t"),true);
const hard=E.heist("es");
assert.ok(E.validate(hard));
assert.equal([...hard.tiles].filter(E.isGate).length,4);
assert.equal(hard.tiles.split("X").length,2);
assert.equal(hard.tiles.split("Y").length,2);
assert.ok(E.shortestRoute(hard)>=10);
assert.equal(E.reachable(hard,{blockGates:true}),false);
assert.deepEqual(E.decode(E.encode(hard)),hard,"Heist links roundtrip without new backend schema");
assert.ok(E.validate(E.heist("en")),"English high-school heist should work");
const onlyOne={...hard,tiles:hard.tiles.replace("Y",".")};
assert.throws(()=>E.validate(onlyOne),/both signal fragments/);
const oneLock={...hard,tiles:hard.tiles.replace("l",".").replace("m",".").replace("n",".")};
assert.throws(()=>E.validate(oneLock),/at least two language locks/);
const k=E.question(hard,"k"),l=E.question(hard,"l"),n=E.question(hard,"n");
assert.match(k.prompt,/llegué/);
assert.match(l.prompt,/No creo/);
assert.match(n.prompt,/señal/);
let h=E.newRun(hard);
assert.equal(h.collected.length,0);
assert.equal(E.move(h,1,0).type,"move");                 // from start to corridor
assert.equal(E.move(h,0,-1).type,"question");            // past perfect lock k
assert.equal(E.solve(h,1).type,"retry");                 // incorrect, no opening
assert.equal(h.mistakes,1);
assert.equal(E.solve(h,0).type,"unlocked");
assert.equal(E.move(h,0,-1).type,"fragment");            // acquire signal X
assert.deepEqual(h.collected,["X"]);
assert.equal(E.move(h,0,1).type,"move");
assert.equal(E.move(h,0,1).type,"move");
assert.equal(E.move(h,-1,0).type,"move");
assert.equal(E.move(h,0,1).type,"portal");               // from P to Q
assert.equal(h.pos,E.idx(4,2));
assert.equal(E.move(h,0,1).type,"move");
assert.equal(E.move(h,1,0).type,"question");             // subjunctive lock l
assert.equal(E.solve(h,1).type,"unlocked");
assert.equal(E.move(h,0,1).type,"fragment");             // acquire signal Y
assert.deepEqual(h.collected,["X","Y"]);
assert.equal(E.move(h,0,-1).type,"move");
assert.equal(E.move(h,1,0).type,"move");
assert.equal(E.move(h,0,-1).type,"question");            // third grammar lock n
assert.equal(E.solve(h,0).type,"unlocked");
const extraction=E.move(h,0,-1);
assert.equal(extraction.type,"win");
assert.equal(h.won,true);
assert.equal(h.unlocked.length,3);
assert.equal(h.mistakes,1);
assert.ok(h.moves>=extraction.optimal);
const incomplete=E.newRun(hard);
assert.equal(E.move(incomplete,0,1).type,"portal");      // enter portal, skip X for now
assert.equal(E.move(incomplete,0,1).type,"move");
assert.equal(E.move(incomplete,1,0).type,"question");
assert.equal(E.solve(incomplete,1).type,"unlocked");
assert.equal(E.move(incomplete,0,1).type,"fragment");    // Y first
assert.equal(E.move(incomplete,0,-1).type,"move");
assert.equal(E.move(incomplete,1,0).type,"move");
assert.equal(E.move(incomplete,0,-1).type,"question");
assert.equal(E.solve(incomplete,0).type,"unlocked");
const sealed=E.move(incomplete,0,-1);
assert.equal(sealed.type,"sealed");
assert.deepEqual(sealed.missing,["X"]);
assert.equal(incomplete.won,false,"Exit never opens until both fragments are recovered");
assert.equal(incomplete.pos,E.idx(6,2),"Sealed exit blocks entry, rather than allowing victory");
// Same tiles remixed keep two-fragment rules and original lineage.
const hardRemix=E.remix(hard);
assert.equal(hardRemix.parent,E.hash(hard));
assert.equal(E.shortestRoute(hardRemix),E.shortestRoute(hard));

const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
const js=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
for(const name of ["puzzle-engine.js","puzzle-ui.js"])assert.ok(html.includes('src="./'+name+'"'),"Missing script "+name);
for(const file of ["puzzle-engine.js","puzzle-ui.js"])assert.doesNotThrow(()=>new Function(fs.readFileSync(path.join(__dirname,"..",file),"utf8")));
const ids=new Set(Array.from(html.matchAll(/\bid="([^"]+)"/g),m=>m[1]));
const ui=fs.readFileSync(path.join(__dirname,"..","puzzle-ui.js"),"utf8");
for(const m of ui.matchAll(/\$\("([^"]+)"\)/g))assert.ok(ids.has(m[1]),"Missing workshop UI element "+m[1]);
assert.match(js,/'workshop'/);
assert.match(js,/PuentePuzzleUI\.init/);
console.log("PUENTE Puzzle Workshop tests passed: beginner + high-school Signal Heist, 3 mandatory grammar locks, fragment extraction, sealed exits, route planning, encoding and remix.");
