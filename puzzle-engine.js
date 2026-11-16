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
const ENTRY="S",EXIT="E",WALL="#",FLOOR=".",P1="P",P2="Q";
const isGate=t=>/^[a-j]$/.test(t);
const idx=(x,y)=>y*W+x,xy=i=>({x:i%W,y:Math.floor(i/W)});
const allow=t=>t===ENTRY||t===EXIT||t===WALL||t===FLOOR||t===P1||t===P2||isGate(t);
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
function neighbors(pack,i,{blockGates=false}={}){
  const {x,y}=xy(i),out=[];
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;
    const n=idx(nx,ny),t=pack.tiles[n];if(t===WALL||(blockGates&&isGate(t)))continue;
    const pair=t===P1?P2:t===P2?P1:null;
    const jump=pair===null?-1:pack.tiles.indexOf(pair);
    if(jump>=0)out.push(jump);
    else out.push(n);
  }
  return out;
}
function reachable(pack,{blockGates=false}={}){
  const start=pack.tiles.indexOf(ENTRY),finish=pack.tiles.indexOf(EXIT);
  if(start===-1||finish===-1)return false;
  const todo=[start],seen=new Set([start]);
  for(let i=0;i<todo.length;i++){
    const at=todo[i];if(at===finish)return true;
    for(const next of neighbors(pack,at,{blockGates})){
      if(!seen.has(next)){seen.add(next);todo.push(next);}
    }
  }return false;
}
function validate(raw){
  const p=canonical(raw),count=c=>[...p.tiles].filter(v=>v===c).length;
  if(count(ENTRY)!==1||count(EXIT)!==1)throw Error("Place exactly one START and one EXIT.");
  const gates=[...p.tiles].filter(isGate).length;
  if(gates<1||gates>4)throw Error("Add between one and four word locks.");
  if(count(P1)!==count(P2)||count(P1)>1)throw Error("Portals need one matched A and B, or neither.");
  if(!reachable(p))throw Error("No route reaches the exit. Rearrange walls or portals.");
  if(reachable(p,{blockGates:true}))throw Error("The exit is reachable without a word lock. Make language essential to escape.");
  return p;
}
function place(raw,n,kind,{gate=0}={}){
  const p=canonical(raw);
  if(!Number.isInteger(n)||n<0||n>=SIZE)throw Error("Pick a tile on the board.");
  if(![FLOOR,WALL,ENTRY,EXIT,P1,P2,"gate"].includes(kind))throw Error("Unknown builder tool.");
  if(!Number.isInteger(gate)||gate<0||gate>=10)throw Error("Choose a valid word lock.");
  const tiles=[...p.tiles];
  const next=kind==="gate"?String.fromCharCode(97+gate):kind;
  if([ENTRY,EXIT,P1,P2].includes(next))for(let i=0;i<tiles.length;i++)if(tiles[i]===next)tiles[i]=FLOOR;
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
  return {pack,pos:pack.tiles.indexOf(ENTRY),unlocked:[],moves:0,mistakes:0,portals:0,pending:null,won:false,events:[]};
}
function move(run,dx,dy){
  if(run.won)return {type:"won"};
  if(run.pending)return {type:"locked",message:"Answer the language lock first."};
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
  if(pair){const target=run.pack.tiles.indexOf(pair);if(target>=0){to=target;run.portals++;run.events.push("portal");}}
  run.pos=to;run.moves++;
  if(run.pack.tiles[to]===EXIT){run.won=true;run.events.push("exit");return {type:"win",moves:run.moves};}
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
  return {type:entered.type==="win"?"win":"unlocked",explanation:q.explanation,moves:run.moves};
}
root.PuentePuzzle={SCHEMA,W,H,SIZE,THEMES,PHRASES,ENTRY,EXIT,WALL,FLOOR,P1,P2,isGate,xy,idx,empty,sample,canonical,place,validate,reachable,question,hash,remix,encode,decode,newRun,move,solve,clone};
})(typeof window==="undefined"?globalThis:window);
