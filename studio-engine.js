/* PUENTE / Teacher's Playroom
   Builds explainable lesson cards around actual, mathematically checked relay
   games. A teacher's ChatGPT is an optional *manual* creative collaborator. */
(function(root){
"use strict";
const P=root.PuenteProtocol;
const KEY="puente.teacher-playroom.v1",MAX=16;
const SCENES=Object.freeze({
 radio:{name:"The Pirate Radio Station",hook:"The late-night radio station has gone silent. A mysterious transmission lists the only safe configuration. Can you bring the signal back?"},
 museum:{name:"The Museum After Midnight",hook:"The museum security grid has locked itself. The night guard left the override instructions in another language."},
 town:{name:"The Department of Unnecessary Emergencies",hook:"City Hall accidentally declared a full-scale emergency over a missing stapler. The emergency relay is the only way to cancel it."},
 observatory:{name:"The Observatory",hook:"An astronomical signal is arriving tonight. The dish will align only when every relay condition is satisfied."},
 stage:{name:"The Backstage Blackout",hook:"The show starts in twenty minutes and the stage lights are out. The lighting console only obeys the intercepted instructions."}
});
const FOCUS=Object.freeze({
 all:{name:"Mixed reasoning",types:[],goal:"interpret a set of logically connected instructions"},
 conditional:{name:"If / then",types:["implies","ifOff"],goal:"interpret conditional clauses and identify when a condition does or does not apply"},
 contrast:{name:"Either / neither",types:["xor","notBoth","same"],goal:"compare competing statements such as exactly one, neither-both and same-state"},
 quantity:{name:"How many / exactly",types:["exactlyOne","exactlyTwo"],goal:"interpret quantifiers and test the difference between one, two and at least one"}
});
const ensure=(condition,message)=>{if(!condition)throw Error(message);};
function options(input={}){
 const out={language:input.language==="en"?"en":"es",
 rank:input.rank==="starter"?"starter":"stretch",
 focus:Object.hasOwn(FOCUS,input.focus)?input.focus:"all",
 scene:Object.hasOwn(SCENES,input.scene)?input.scene:"radio",
 minutes:[10,20,30].includes(Number(input.minutes))?Number(input.minutes):20,
 note:typeof input.note==="string"?input.note.trim().slice(0,1200):""};
 return out;
}
function forge(input={},seed=1001){
 const opts=options(input),n=P.seedValue(seed);
 for(let i=0;i<230;i++){
  const candidate=n+i>99999999?1+(n+i)%99999999:n+i;
  const puzzle=P.generate(candidate,opts.language);
  if(opts.rank==="starter"&&puzzle.rules.length!==4)continue;
  if(opts.rank==="stretch"&&puzzle.rules.length<5)continue;
  if(!FOCUS[opts.focus].types.length||FOCUS[opts.focus].types.some(x=>puzzle.rules.some(r=>r.type===x))){
   return {options:opts,puzzle};
  }
 }
 throw Error("Couldn't find a matching challenge. Try a different focus.");
}
function purpose({options:opts,puzzle}){
 const rule=FOCUS[opts.focus];
 return "Students will "+rule.goal+" in "+(opts.language==="es"?"Spanish":"English")+
   ", justify a three-relay solution, and explain why an alternative fails.";
}
function schedule(minutes){
 if(minutes===10)return ["1 min · Set the mystery","6 min · Solve in pairs; one person explains each rule","3 min · Compare two routes and justify the winner"];
 if(minutes===30)return ["3 min · Read the intercepted transmission together","9 min · Small-team solving without translation","7 min · Build and test a physical relay configuration","7 min · Swap strategies; explain an incorrect alternative","4 min · Write one original conditional instruction"];
 return ["2 min · Introduce the mystery and the power budget","7 min · Pair work: decode and sketch hypotheses","6 min · Test a route, diagnose, and revise","5 min · Explain the solution and compose a new rule"];
}
function solution(pack){
 const mask=pack.puzzle.solution;
 return P.LETTERS.filter((_,i)=>((mask>>i)&1)===1);
}
function plan({options:opts,puzzle}){
 const scene=SCENES[opts.scene];
 const lines=[
  "PUENTE · TEACHER'S MISSION CARD",
  scene.name+" / Protocol #"+P.codeFrom(puzzle.seed),
  (opts.language==="es"?"Language: Spanish":"Language: English")+" | "+opts.minutes+" minutes | "+puzzle.rules.length+" conditions",
  "",
  "THE STORY",scene.hook,"",
  "THE CHALLENGE","Six relays. Activate exactly three. A signal must travel from INPUT to OUTPUT, obeying every intercepted instruction.",
  "", "INTERCEPTED CONDITIONS",
  ...puzzle.rules.map((r,i)=>(i+1)+". "+P.statement(r,opts.language)),
  "", "LEARNING TARGET",purpose({options:opts,puzzle}),
  "", "LESSON FLOW",...schedule(opts.minutes),
  "", "ASK THE CLASS",
  "• Which statement eliminated the most configurations?",
  "• Which relay choices create a physical path but fail the instructions?",
  "• How would you explain an 'if...then' statement without treating it as 'if and only if'?",
  "• Change one instruction. Would more than one solution become possible?",
  "", "TEACHER KEY — DO NOT DISPLAY UNTIL DEBRIEF",
  "The only winning relays: "+solution({puzzle}).join(" + "),
  "Every condition and the physical signal route must hold simultaneously.",
  "", "PLAYER LINK",
  "https://puente.abundent.org/?protocol="+P.codeFrom(puzzle.seed)+"&language="+opts.language,
  "", "PREPARATION NOTE",
  opts.note||"(Add notes from your own teaching or ChatGPT; saved locally in this browser.)",
  "", "This is a candidate teaching activity, not a validated lesson. Check the language and level for your actual class."
 ];
 return lines.join("\n");
}
function chatPrompt(work){
 const {options:opts,puzzle}=work;
 return [
  "You are Chitty Chitty Bang Bang, my imaginative teaching partner.",
  "Help me make a witty, respectful high-school language lesson based on the REAL PUENTE relay logic puzzle below.",
  "Do not invent or alter the network rules, correct answer or relay count. Do not claim you accessed PUENTE or students' work.",
  "Students must turn on exactly 3 of A–F, create an INPUT→OUTPUT signal path, and satisfy every condition.",
  "Language: "+(opts.language==="es"?"Spanish":"English")+". Lesson duration: "+opts.minutes+" minutes.",
  "Main target: "+FOCUS[opts.focus].name+". Story: "+SCENES[opts.scene].name+".",
  "Use this story seed: "+SCENES[opts.scene].hook,
  "Intercepted conditions:",
  ...puzzle.rules.map((r,i)=>(i+1)+") "+P.statement(r,opts.language)),
  "TEACHER-ONLY ANSWER (never reveal in student handout): "+solution(work).join("+"),
  "",
  "Please return five plain-text sections, no JSON:",
  "1. A 30-second, intriguingly absurd opening monologue that treats teenagers intelligently.",
  "2. A concise student-facing challenge card, without the answer.",
  "3. Two genuine language scaffolds (not revealing the configuration).",
  "4. Three discussion questions that require students to justify reasoning, including why a wrong route fails.",
  "5. A practical "+opts.minutes+"-minute lesson flow, with an answer-check section clearly labeled TEACHER ONLY.",
  "Stay linguistically accurate. State uncertainties explicitly. Don't invent student records or identities.",
  "I will review and edit the result before using it in class."
 ].join("\n");
}
const empty=()=>({schema:"puente.teacher-library/v1",cards:[]});
function load(){
 try{
  const record=JSON.parse(localStorage.getItem(KEY)||"null");
  if(!record||record.schema!=="puente.teacher-library/v1"||!Array.isArray(record.cards))return [];
  return record.cards.filter(x=>x&&Number.isInteger(x.seed)&&x.seed>=1&&x.seed<=99999999).slice(-MAX);
 }catch{return [];}
}
function save(work){
 const saved=load(),opts=options(work.options),puzzle=forge(opts,work.puzzle.seed).puzzle;
 ensure(puzzle.seed===work.puzzle.seed,"The lesson's puzzle no longer matches its source code.");
 const id=puzzle.seed+"-"+opts.language+"-"+opts.scene+"-"+opts.minutes;
 const idx=saved.findIndex(x=>x.id===id);
 if(idx>=0)saved.splice(idx,1);
 saved.push({id,seed:puzzle.seed,options:opts,savedAt:new Date().toISOString()});
 while(saved.length>MAX)saved.shift();
 localStorage.setItem(KEY,JSON.stringify({schema:"puente.teacher-library/v1",cards:saved}));
 return id;
}
function remove(id){
 const cards=load().filter(x=>x.id!==id);
 localStorage.setItem(KEY,JSON.stringify({schema:"puente.teacher-library/v1",cards}));
}
root.PuenteStudio={SCENES,FOCUS,options,forge,solution,purpose,schedule,plan,chatPrompt,load,save,remove,MAX};
})(typeof window!=="undefined"?window:globalThis);
