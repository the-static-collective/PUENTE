/* PUENTE Puzzle Workshop v1: deterministic local-first map and language-lock engine.
   No accounts, analytics, student names, network mutation or arbitrary student text. */
(function(root){
"use strict";
const SCHEMA="puente.map-puzzle/v1",W=8,H=6,SIZE=W*H,VERSION=1;
const THEMES=Object.freeze({
  village:{name:"The Village Workshop",caption:"An unfinished village needs a route."},
  observatory:{name:"The Night Observatory",caption:"Repair the route to the signal tower."},
  market:{name:"The Hidden Marketplace",caption:"Find a way into the market before dusk."},
  library:{name:"The Lost Library",caption:"The shelves hide a secret passage."}
});
const PHRASES={
  es:[
    ["“La puerta está cerrada.” What is closed?",["The door","The street","The book"],0,"“La puerta” means the door."],
    ["“Gira a la derecha.” Which way?",["Left","Right","Straight"],1,"“Derecha” means right."],
    ["“Busca la llave roja.” Which key?",["Blue","Green","Red"],2,"“Roja” means red."],
    ["“El gato duerme.” What is the cat doing?",["Sleeping","Running","Eating"],0,"“Duerme” means sleeps."],
    ["“Tengo tres libros.” How many books?",["Two","Three","Four"],1,"“Tres” means three."],
    ["“Son las ocho.” What time is it?",["Seven","Nine","Eight"],2,"“Ocho” means eight."],
    ["“La biblioteca está cerca.” How far is the library?",["Near","Far","Closed"],0,"“Cerca” means near."],
    ["“¿Dónde está el mapa?” What is being requested?",["A key","A map","A drink"],1,"“El mapa” means the map."],
    ["“Mañana iremos.” When will we go?",["Yesterday","Today","Tomorrow"],2,"“Mañana” means tomorrow here."],
    ["“Por favor, abre la ventana.” What should you open?",["The window","The door","The box"],0,"“La ventana” means the window."]
  ],
  en:[
    ["“The door is closed.” ¿Qué está cerrado?",["La puerta","La calle","El libro"],0,"“Door” significa puerta."],
    ["“Turn right.” ¿Hacia dónde giras?",["Izquierda","Derecha","Recto"],1,"“Right” significa derecha."],
    ["“Find the red key.” ¿Cuál llave?",["Azul","Verde","Roja"],2,"“Red” significa rojo o roja."],
    ["“The cat sleeps.” ¿Qué hace el gato?",["Duerme","Corre","Come"],0,"“Sleeps” significa duerme."],
    ["“I have three books.” ¿Cuántos libros?",["Dos","Tres","Cuatro"],1,"“Three” significa tres."],
    ["“It's eight o'clock.” ¿Qué hora es?",["Las siete","Las nueve","Las ocho"],2,"“Eight” significa ocho."],
    ["“The library is nearby.” ¿Dónde queda?",["Cerca","Lejos","Cerrada"],0,"“Nearby” significa cerca."],
    ["“Where is the map?” ¿Qué buscan?",["Una llave","Un mapa","Una bebida"],1,"“Map” significa mapa."],
    ["“We will go tomorrow.” ¿Cuándo irán?",["Ayer","Hoy","Mañana"],2,"“Tomorrow” significa mañana."],
    ["“Please open the window.” ¿Qué debes abrir?",["La ventana","La puerta","La caja"],0,"“Window” significa ventana."]
  ]
};
const ADVANCED={
  es:[
    ["Cuando llegué, ellos ya ___.",["se habían ido","se van","irán"],0,"“Cuando llegué” sets a past reference point; “se habían ido” describes what had already happened."],
    ["No creo que él ___ la respuesta.",["sabe","sepa","sabía"],1,"“No creo que” expresses doubt and normally calls for the present subjunctive: “sepa”."],
    ["Te llamaría si ___ tiempo.",["tendré","tengo","tuviera"],2,"A hypothetical present condition uses “si” + imperfect subjunctive: “tuviera”, with conditional “llamaría”."],
    ["La señal está rota; ___ no podemos entrar.",["por eso","sin embargo","aunque"],0,"“Por eso” marks a result: the signal is broken, so we cannot enter."],
    ["“Se me olvidaron las llaves.” What happened?",["I deliberately hid the keys","I forgot the keys","The keys were broken"],1,"“Se me olvidaron” describes forgetting the keys, often without stressing intent."],
    ["Busco a alguien que ___ reparar la radio; no sé quién.",["sabe","sabía","sepa"],2,"The person is unidentified, so “que sepa” uses the subjunctive."],
    ["“A pesar de la lluvia, seguimos.” Best interpretation?",["Despite the rain, we continued","Because it rained, we stopped","We left before it rained"],0,"“A pesar de” means despite; “seguimos” here means we continued."],
    ["“El mensaje fue enviado por Ada.” Who sent it?",["The speaker","Ada","Someone unnamed"],1,"The passive “fue enviado por Ada” identifies Ada as the sender."],
    ["“Llevo dos horas esperando.” What is happening?",["I waited for two hours yesterday","I will wait for two hours","I have been waiting for two hours"],2,"“Llevar + duration + gerund” describes an ongoing action begun in the past."],
    ["“¿Para qué sirve esta llave?” What is asked?",["What is this key used for?","Where did this key come from?","Who made this key?"],0,"“¿Para qué sirve...?” asks about function or purpose."]
  ],
  en:[
    ["By the time I arrived, they ___.",["had left","leave","will leave"],0,"The past perfect “had left” shows an earlier action before another past event."],
    ["If I ___ more time, I'd decode the message.",["have","had","will have"],1,"A hypothetical present situation uses “if + past form” and “would + verb”: “If I had...”"],
    ["The transmitter ___ before we got there.",["was fixing","has repaired","had been repaired"],2,"Past perfect passive “had been repaired” places the repair before arrival."],
    ["Although the signal was weak, we ___ the message.",["understood","understand","will understanding"],0,"“Although” introduces a contrast; the simple past “understood” matches “was”."],
    ["She suggested that he ___ the code again.",["checks","check","checked"],1,"In formal English, “suggested that” takes the plain form “check” in a mandative clause."],
    ["“I nearly missed the train.” What happened?",["I definitely missed the train","I was nowhere near the train","I almost missed the train"],2,"“Nearly missed” means it was a close call, but the train was not missed."],
    ["He denied ___ the lock.",["breaking","to break","break"],0,"The verb “deny” takes a gerund complement: “denied breaking”."],
    ["The book ___ cover is red contains the clue.",["who's","whose","which"],1,"“Whose” shows possession: the book's cover is red."],
    ["If they had checked earlier, they ___ the fault.",["will find","find","would have found"],2,"The unreal past conditional uses “had + participle” and “would have + participle”."],
    ["“The message was intercepted.” What does it imply?",["Someone captured it in transit","Someone published it as intended","The sender did not write it"],0,"“Intercepted” means captured or stopped while being transmitted or delivered."]
  ]
};
PHRASES.es.push(...ADVANCED.es); PHRASES.en.push(...ADVANCED.en);
const ENTRY="S",EXIT="E",WALL="#",FLOOR=".",P1="P",P2="Q",FRAGMENT_A="X",FRAGMENT_B="Y";
const isGate=t=>/^[a-t]$/.test(t);
const idx=(x,y)=>y*W+x,xy=i=>({x:i%W,y:Math.floor(i/W)});
const isFragment=t=>t===FRAGMENT_A||t===FRAGMENT_B;
const allow=t=>t===ENTRY||t===EXIT||t===WALL||t===FLOOR||t===P1||t===P2||isGate(t)||isFragment(t);
const clone=pack=>JSON.parse(JSON.stringify(pack));
function empty({language="es",theme="village",parent="",generation=0}={}){
  return {schema:SCHEMA,language,theme,tiles:FLOOR.repeat(SIZE),parent,generation};
}
function sample(language="es"){
  const cells=Array(SIZE).fill(FLOOR);
  for(let y=0;y<H;y++)cells[idx(3,y)]=WALL;
  cells[idx(3,2)]="a";cells[idx(1,2)]=ENTRY;cells[idx(6,2)]=EXIT;
  cells[idx(1,4)]=P1;cells[idx(2,0)]=P2;
  return validate({...empty({language,theme:"village"}),tiles:cells.join("")});
}
// Signal Heist: recover two fragments before extraction. One route through
// the central gate; a portal offers an alternative but never skips the clues.
function heist(language="es"){
  const rows=["########","##X###E#","##k#Q#n#","#S.m.l.#","#P.##Y##","########"];
  return validate({...empty({language,theme:"observatory"}),tiles:rows.join("")});
}
function canonical(raw){
  if(!raw||typeof raw!=="object"||Array.isArray(raw))throw Error("Invalid map packet.");
  if(raw.schema!==SCHEMA)throw Error("Unsupported puzzle format.");
  if(!Object.prototype.hasOwnProperty.call(PHRASES,raw.language))throw Error("Choose a learning language.");
  if(!Object.prototype.hasOwnProperty.call(THEMES,raw.theme))throw Error("Choose a listed story theme.");
  if(typeof raw.tiles!=="string"||raw.tiles.length!==SIZE||![...raw.tiles].every(allow))throw Error("The map needs exactly 48 valid tiles.");
  if(typeof raw.parent!=="string"||raw.parent.length>24||!/^([a-f0-9]{8})?$/.test(raw.parent))throw Error("Invalid parent puzzle reference.");
  if(!Number.isInteger(raw.generation)||raw.generation<0||raw.generation>50)throw Error("Invalid revision generation.");
  return {schema:SCHEMA,language:raw.language,theme:raw.theme,tiles:raw.tiles,parent:raw.parent,generation:raw.generation};
}
// Deterministic shortest route with an inventory bitmask (0, X, Y or XY).
// Unlocked question gates are modeled as passable: answer skill is tested in play.
function shortestRoute(pack,{blockGates=false}={}){
 const start=pack.tiles.indexOf(ENTRY),finish=pack.tiles.indexOf(EXIT);
 if(start<0||finish<0)return Infinity;
 const required=pack.tiles.includes(FRAGMENT_A)&&pack.tiles.includes(FRAGMENT_B)?3:0;
 const todo=[{pos:start,bits:0,moves:0}],seen=new Set([start+":0"]);
 for(let i=0;i<todo.length;i++){
   const {pos,bits,moves}=todo[i],{x,y}=xy(pos);
   if(pos===finish&&bits===required)return moves;
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
     const nx=x+dx,ny=y+dy;if(nx<0||nx>=W||ny<0||ny>=H)continue;
     let target=idx(nx,ny),tile=pack.tiles[target];
     if(tile===WALL||(blockGates&&isGate(tile)))continue;
     if(tile===P1||tile===P2){const other=pack.tiles.indexOf(tile===P1?P2:P1);if(other>=0)target=other;}
     let nextBits=bits;
     if(pack.tiles[target]===FRAGMENT_A)nextBits|=1;
     if(pack.tiles[target]===FRAGMENT_B)nextBits|=2;
     if(target===finish&&nextBits!==required)continue;
     const key=target+":"+nextBits;
     if(!seen.has(key)){seen.add(key);todo.push({pos:target,bits:nextBits,moves:moves+1});}
   }
 }return Infinity;
}
function reachable(pack,options={}){return Number.isFinite(shortestRoute(pack,options));}
function validate(raw){
  const p=canonical(raw),count=c=>[...p.tiles].filter(v=>v===c).length;
  if(count(ENTRY)!==1||count(EXIT)!==1)throw Error("Place exactly one START and one EXIT.");
  const gates=[...p.tiles].filter(isGate).length;
  if(gates<1||gates>4)throw Error("Add between one and four word locks.");
  if(count(P1)!==count(P2)||count(P1)>1)throw Error("Portals need one matched A and B, or neither.");
  if(count(FRAGMENT_A)!==count(FRAGMENT_B)||count(FRAGMENT_A)>1)throw Error("A heist requires both signal fragments X and Y, or neither.");
  if(count(FRAGMENT_A)===1&&gates<2)throw Error("Signal Heist needs at least two language locks.");
  if(!reachable(p))throw Error("No route reaches the exit. Rearrange walls or portals.");
  if(reachable(p,{blockGates:true}))throw Error("The exit is reachable without a word lock. Make language essential to escape.");
  return p;
}
function place(raw,n,kind,{gate=0}={}){
  const p=canonical(raw);
  if(!Number.isInteger(n)||n<0||n>=SIZE)throw Error("Pick a tile on the board.");
  if(![FLOOR,WALL,ENTRY,EXIT,P1,P2,FRAGMENT_A,FRAGMENT_B,"gate"].includes(kind))throw Error("Unknown builder tool.");
  if(!Number.isInteger(gate)||gate<0||gate>=PHRASES[p.language].length)throw Error("Choose a valid word lock.");
  const tiles=[...p.tiles];
  const next=kind==="gate"?String.fromCharCode(97+gate):kind;
  if([ENTRY,EXIT,P1,P2,FRAGMENT_A,FRAGMENT_B].includes(next))for(let i=0;i<tiles.length;i++)if(tiles[i]===next)tiles[i]=FLOOR;
  tiles[n]=next;return canonical({...p,tiles:tiles.join("")});
}
function question(pack,tile){
  const i=typeof tile==="number"?tile:pack.tiles.indexOf(tile);
  const code=pack.tiles[i];
  if(!isGate(code))return null;
  const [prompt,choices,correct,explanation]=PHRASES[pack.language][code.charCodeAt(0)-97];
  return {prompt,choices:[...choices],correct,explanation,code};
}
function hash(raw){
  const p=canonical(raw);let n=2166136261;
  const data=p.language+"|"+p.theme+"|"+p.tiles;
  for(let i=0;i<data.length;i++){n^=data.charCodeAt(i);n=Math.imul(n,16777619)>>>0;}
  return n.toString(16).padStart(8,"0");
}
function remix(raw){
  const p=validate(raw);
  return {...p,parent:hash(p),generation:Math.min(50,p.generation+1)};
}
function encode(raw){
  const p=validate(raw);
  const bytes=new TextEncoder().encode(JSON.stringify(p));
  let binary="";for(const b of bytes)binary+=String.fromCharCode(b);
  const value=btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
  if(value.length>1400)throw Error("Map exceeds the share-link size limit.");
  return value;
}
function decode(value){
  if(typeof value!=="string"||value.length<10||value.length>1400||!/^[A-Za-z0-9_-]+$/.test(value))throw Error("Invalid puzzle link.");
  try{
    const binary=atob(value.replace(/-/g,"+").replace(/_/g,"/"));
    const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    return validate(JSON.parse(new TextDecoder().decode(bytes)));
  }catch(err){throw Error("Invalid puzzle link: "+err.message);}
}
function newRun(raw){
  const pack=validate(raw);
  return {pack,pos:pack.tiles.indexOf(ENTRY),unlocked:[],collected:[],moves:0,mistakes:0,portals:0,pending:null,won:false,events:[]};
}
function move(run,dx,dy){
  if(run.won)return {type:"won"};
  if(run.pending!==null)return {type:"locked",message:"Answer the language lock first."};
  if(!Number.isInteger(dx)||!Number.isInteger(dy)||Math.abs(dx)+Math.abs(dy)!==1)throw Error("Use one step at a time.");
  const {x,y}=xy(run.pos),xx=x+dx,yy=y+dy;
  if(xx<0||xx>=W||yy<0||yy>=H)return {type:"wall"};
  const to=idx(xx,yy),tile=run.pack.tiles[to];
  if(tile===WALL)return {type:"wall"};
  if(isGate(tile)&&!run.unlocked.includes(to)){
    run.pending=to;return {type:"question",question:question(run.pack,to)};
  }
  return enter(run,to);
}
function enter(run,to){
 const t=run.pack.tiles[to],pair=t===P1?P2:t===P2?P1:null;
 if(pair){const other=run.pack.tiles.indexOf(pair);if(other>=0){to=other;run.portals++;run.events.push("portal");}}
 const tile=run.pack.tiles[to],missing=[FRAGMENT_A,FRAGMENT_B].filter(k=>run.pack.tiles.includes(k)&&!run.collected.includes(k));
 if(tile===EXIT&&missing.length)return {type:"sealed",missing};
 run.pos=to;run.moves++;
 if(isFragment(tile)&&!run.collected.includes(tile)){
   run.collected.push(tile);run.events.push("fragment:"+tile);
   return {type:"fragment",fragment:tile,remaining:[FRAGMENT_A,FRAGMENT_B].filter(k=>run.pack.tiles.includes(k)&&!run.collected.includes(k))};
 }
 if(tile===EXIT){run.won=true;run.events.push("exit");return {type:"win",moves:run.moves,optimal:shortestRoute(run.pack)};}
 return {type:pair?"portal":"move",pos:run.pos};
}
function solve(run,choice){
  if(run.won)return {type:"won"};
  if(run.pending===null)return {type:"idle"};
  if(!Number.isInteger(choice)||choice<0||choice>2)throw Error("Invalid answer.");
  const q=question(run.pack,run.pending);
  if(choice!==q.correct){run.mistakes++;run.events.push("retry");return {type:"retry",message:"Not quite. Re-read the message and try another interpretation."};}
  const next=run.pending;run.pending=null;run.unlocked.push(next);run.events.push("unlock");
  const entered=enter(run,next);
  return {type:entered.type==="win"?"win":"unlocked",explanation:q.explanation,moves:run.moves,optimal:entered.optimal};
}
root.PuentePuzzle={SCHEMA,W,H,SIZE,THEMES,PHRASES,ADVANCED,ENTRY,EXIT,WALL,FLOOR,P1,P2,FRAGMENT_A,FRAGMENT_B,isGate,isFragment,xy,idx,empty,sample,heist,canonical,place,validate,shortestRoute,reachable,question,hash,remix,encode,decode,newRun,move,solve,clone};
})(typeof window==="undefined"?globalThis:window);
