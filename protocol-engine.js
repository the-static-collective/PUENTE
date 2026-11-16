/* PUENTE RELAY: bounded bilingual network deduction, not a quiz.
   No accounts, user text, API access, analytics or hidden paid generation. */
(function(root){
"use strict";
const LETTERS=Object.freeze(["A","B","C","D","E","F"]);
const EDGES=Object.freeze([
 ["IN","A"],["IN","B"],["IN","C"],
 ["A","D"],["A","E"],["B","D"],["B","F"],["C","E"],["C","F"],
 ["D","OUT"],["E","OUT"],["F","OUT"]
]);
const POWER=3,MAX_SEED=99999999;
const bit=(mask,i)=>(mask>>i)&1;
const ones=n=>{let c=0;while(n){n&=n-1;c++;}return c;};
function connected(mask){
 const visited=new Set(["IN"]),todo=["IN"];
 for(let i=0;i<todo.length;i++){
  const node=todo[i];
  for(const [a,b] of EDGES){
   if(a!==node)continue;
   if(b!=="OUT"&&!bit(mask,LETTERS.indexOf(b)))continue;
   if(!visited.has(b)){visited.add(b);todo.push(b);}
  }
 }
 return {connected:visited.has("OUT"),powered:LETTERS.filter(x=>visited.has(x))};
}
const BASE=Object.freeze(Array.from({length:64},(_,n)=>n).filter(mask=>ones(mask)===POWER&&connected(mask).connected));
function rulesPool(){
 const r=[];
 for(let a=0;a<6;a++)for(let b=a+1;b<6;b++){
  for(const type of ["xor","same","notBoth","atLeast","implies","ifOff"]){
   r.push({type,a,b});
   if(type==="implies"||type==="ifOff")r.push({type,a:b,b:a});
  }
 }
 for(let a=0;a<6;a++)for(let b=a+1;b<6;b++)for(let c=b+1;c<6;c++)
  r.push({type:"exactlyOne",a,b,c},{type:"exactlyTwo",a,b,c});
 return r;
}
const ALL=Object.freeze(rulesPool());
function matches(rule,mask){
 const a=bit(mask,rule.a),b=bit(mask,rule.b),c=rule.c===undefined?0:bit(mask,rule.c);
 switch(rule.type){
  case "xor":return a!==b;
  case "same":return a===b;
  case "notBoth":return !(a&&b);
  case "atLeast":return Boolean(a||b);
  case "implies":return !a||Boolean(b);
  case "ifOff":return Boolean(a||b);
  case "exactlyOne":return a+b+c===1;
  case "exactlyTwo":return a+b+c===2;
  default:throw Error("Unknown rule");
 }
}
const id=r=>r.type+":"+r.a+":"+r.b+":"+(r.c===undefined?"-":r.c);
function rng(seed){
 let x=(Math.floor(Number(seed))>>>0)||0x9e3779b9;
 return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};
}
function shuffled(array,rand){
 const out=array.slice();
 for(let i=out.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
 return out;
}
function seedValue(value){
 const n=Number(value);
 if(!Number.isSafeInteger(n)||n<1||n>MAX_SEED)throw Error("Challenge code must be between 1 and "+MAX_SEED+".");
 return n;
}
const nonredundant=rules=>rules.every((r,i)=>
 BASE.filter(mask=>rules.every((q,j)=>j===i||matches(q,mask))).length>1);
function verify(puzzle){
 if(!puzzle||puzzle.power!==POWER||!Array.isArray(puzzle.rules))throw Error("Invalid protocol.");
 return BASE.filter(mask=>puzzle.rules.every(rule=>matches(rule,mask)));
}
function generate(seed=1001,language="es"){
 seed=seedValue(seed);
 if(language!=="es"&&language!=="en")throw Error("Choose Spanish or English.");
 const random=rng(seed),targets=shuffled(BASE,random);
 for(const target of targets){
  const eligible=ALL.filter(rule=>matches(rule,target)&&BASE.some(mask=>!matches(rule,mask)));
  for(let trial=0;trial<230;trial++){
   let pool=BASE.slice(),selected=[];
   const order=shuffled(eligible,random);
   for(let depth=0;depth<6&&pool.length>1;depth++){
    let options=order.filter(r=>!selected.some(x=>id(x)===id(r)))
     .map(r=>({r,left:pool.filter(mask=>matches(r,mask))}))
     .filter(o=>o.left.length<pool.length&&o.left.length>=1&&(depth>=3||o.left.length>1));
    if(depth===0)options=options.filter(o=>o.r.type==="exactlyOne"||o.r.type==="exactlyTwo");
    if(!options.length)break;
    const optimum=pool.length*(depth>=3?.45:.65);
    options.sort((a,b)=>{
     const score=o=>Math.abs(o.left.length-optimum)+(selected.some(v=>v.type===o.r.type)?2:0);
     return score(a)-score(b);
    });
    const bound=Math.min(options.length,Math.max(4,Math.min(14,Math.floor(options.length*.25))));
    const choice=options[Math.floor(random()*bound)];
    selected.push(choice.r);pool=choice.left;
   }
   if(pool.length!==1||pool[0]!==target||selected.length<4||!nonredundant(selected))continue;
   if(new Set(selected.map(r=>r.type)).size<3)continue;
   const protocol={schema:"puente.relay/v1",seed,language,power:POWER,solution:target,
     rules:selected,connectors:EDGES,version:1};
   if(verify(protocol).length!==1)throw Error("Generator uniqueness invariant failed.");
   return protocol;
  }
 }
 throw Error("Could not construct a unique puzzle for this challenge code.");
}
function statement(rule,lang="es"){
 const a=LETTERS[rule.a],b=LETTERS[rule.b],c=LETTERS[rule.c];
 const es={
  xor:()=> "Solo uno de los relés "+a+" y "+b+" está encendido.",
  same:()=> "Los relés "+a+" y "+b+" están en el mismo estado.",
  notBoth:()=> "No pueden estar activos "+a+" y "+b+" simultáneamente.",
  atLeast:()=> "Por lo menos uno de los relés "+a+" y "+b+" transmite.",
  implies:()=> "Si "+a+" transmite, entonces "+b+" también debe transmitir.",
  ifOff:()=> "Si "+a+" está apagado, "+b+" tiene que estar encendido.",
  exactlyOne:()=> "Exactamente uno de "+a+", "+b+" y "+c+" está encendido.",
  exactlyTwo:()=> "Exactamente dos de "+a+", "+b+" y "+c+" están encendidos."
 };
 const en={
  xor:()=> "Exactly one of relays "+a+" and "+b+" is powered on.",
  same:()=> "Relays "+a+" and "+b+" are in the same state.",
  notBoth:()=> "Relays "+a+" and "+b+" cannot both be active.",
  atLeast:()=> "At least one of relays "+a+" and "+b+" must transmit.",
  implies:()=> "If "+a+" transmits, then "+b+" must transmit as well.",
  ifOff:()=> "If "+a+" is off, "+b+" must be on.",
  exactlyOne:()=> "Exactly one of "+a+", "+b+" and "+c+" is powered on.",
  exactlyTwo:()=> "Exactly two of "+a+", "+b+" and "+c+" are powered on."
 };
 return (lang==="en"?en:es)[rule.type]();
}
function begin(seed=1001,language="es"){
 return {puzzle:generate(seed,language),mask:0,attempts:0,toggles:0,hints:[],solved:false,lastPulse:null};
}
function toggle(state,index){
 if(state.solved)throw Error("Already secured. Generate another challenge.");
 if(!Number.isInteger(index)||index<0||index>=6)throw Error("Invalid relay.");
 state.mask^=(1<<index);state.toggles++;state.lastPulse=null;return state;
}
function score(state){
 return Math.max(0,1000-Math.max(0,state.attempts-1)*160-state.toggles*6-state.hints.length*100);
}
function pulse(state){
 if(state.solved)return {type:"solved"};
 const active=ones(state.mask),network=connected(state.mask);
 if(active!==POWER)return {type:"power",message:"Exactly "+POWER+" relays must be active; you have "+active+"."};
 if(!network.connected)return {type:"route",message:"No active path from INPUT to OUTPUT. Fix the physical route."};
 state.attempts++;
 const correct=state.puzzle.rules.filter(r=>matches(r,state.mask)).length,total=state.puzzle.rules.length;
 state.lastPulse={correct,total};
 if(correct===total){state.solved=true;return {type:"win",correct,total,score:score(state)};}
 return {type:"reject",correct,total,message:"Signal rejected: "+correct+" of "+total+" intercepted conditions satisfied. Re-evaluate your assumptions."};
}
function translate(state,index){
 if(!Number.isInteger(index)||index<0||index>=state.puzzle.rules.length)throw Error("Invalid clue.");
 if(!state.hints.includes(index))state.hints.push(index);
 return statement(state.puzzle.rules[index],state.puzzle.language==="es"?"en":"es");
}
function codeFrom(seed){return seedValue(seed).toString(36).toUpperCase();}
function codeTo(code){
 if(typeof code!=="string"||!(/^[0-9A-Z]{1,6}$/i).test(code))throw Error("Invalid relay challenge code.");
 return seedValue(parseInt(code,36));
}
root.PuenteProtocol={LETTERS,EDGES,POWER,BASE,ALL,ones,connected,matches,generate,verify,
 statement,begin,toggle,pulse,translate,score,codeFrom,codeTo,seedValue};
})(typeof window!=="undefined"?window:globalThis);
