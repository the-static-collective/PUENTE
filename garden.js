/* PUENTE Quest Garden v1
   An explicitly human-reviewed growth loop. No student records or background model calls.
   Inspired by MOTIF's source / hypothesis / probe / review distinctions, NOT MOTIF runtime. */
(function(root){
  "use strict";
  const SCHEMA="puente.questpack/v1", KEY="puente.garden.v1", LIMIT=24;
  const WORLD={
    village:{title:"Village of Two Tongues",intro:"A second neighborhood appears across the river. Restore its missing signs by understanding each message."},
    market:{title:"The Midnight Marketplace",intro:"Traders from two cities can no longer understand one another. Decode their messages to reopen the market."},
    signal:{title:"The Signal Station",intro:"A faraway radio tower is sending strange bilingual messages. Translate each transmission to bring the station online."},
    clock:{title:"The Clockmaker's Library",intro:"A library keeps yesterday, today and tomorrow in the wrong order. Language is the key to repairing its clock."},
    mystery:{title:"The Missing Words Mystery",intro:"Someone has switched the village's labels. Follow six language clues and solve the case."}
  };
  const BANK={
    es:[
      ["direction","decode","A traveler asks “¿Dónde está la estación?” What are they looking for?",["The station","The library","The bakery"],0,"“¿Dónde está?” asks where something is located."],
      ["direction","decode","The note says “Gira a la izquierda.” Which way should you turn?",["Right","Left","Straight ahead"],1,"“Izquierda” means left."],
      ["direction","decode","The bridge sign says “Sigue derecho.” What should you do?",["Stop","Turn back","Go straight"],2,"“Sigue derecho” means continue straight."],
      ["greeting","respond","A neighbor says “Buenos días.” What are they saying?",["Good morning","Good night","Goodbye"],0,"“Buenos días” is a morning greeting."],
      ["greeting","respond","Someone asks “¿Cómo te llamas?” They want to know your…",["Age","Name","Address"],1,"“¿Cómo te llamas?” asks your name."],
      ["greeting","respond","A visitor says “Mucho gusto.” What does that mean?",["Good luck","Excuse me","Nice to meet you"],2,"“Mucho gusto” is used when meeting someone."],
      ["market","trade","A vendor says “Son cinco pesos.” What is the price?",["Five pesos","Ten pesos","Fifteen pesos"],0,"“Cinco” means five."],
      ["market","trade","Which phrase asks for water in Spanish?",["Tengo sed.","Quisiera agua, por favor.","La calle está lejos."],1,"“Quisiera agua, por favor” is a polite request for water."],
      ["market","trade","A stall sign says “Cerrado.” Is the shop open?",["Yes, it is open","It is opening now","No, it is closed"],2,"“Cerrado” means closed."],
      ["time","repair","The clock reads 8:00. Which phrase fits?",["Son las ocho.","Es la una.","Son las doce."],0,"Use “Son las” with most hours, including eight."],
      ["time","repair","Someone says “Mañana iremos al parque.” When are they going?",["Yesterday","Tomorrow","Right now"],1,"“Mañana” means tomorrow here, and “iremos” is future."],
      ["time","repair","Complete: “Ayer yo ___ una carta.”",["escribo","escribiré","escribí"],2,"“Ayer” signals the past; “escribí” means I wrote."],
      ["objects","decode","The note says “Busca la llave.” What should you look for?",["A key","A book","A chair"],0,"“La llave” means the key."],
      ["objects","decode","The message reads “La puerta está abierta.” What is open?",["The window","The door","The box"],1,"“La puerta” means the door; “abierta” means open."],
      ["objects","decode","A librarian asks for “un libro rojo.” Which object fits?",["A blue notebook","A green pencil","A red book"],2,"“Un libro rojo” means a red book."],
      ["conversation","respond","Someone says “Perdón.” What are they doing?",["Apologizing","Asking the time","Saying goodbye"],0,"“Perdón” can mean sorry or excuse me."],
      ["conversation","respond","Which is a polite way to say “Please” in Spanish?",["De nada","Por favor","Hasta luego"],1,"“Por favor” means please."],
      ["conversation","respond","The message reads “Hasta mañana.” What does it mean?",["See you yesterday","Good morning","See you tomorrow"],2,"“Hasta mañana” means see you tomorrow."]
    ],
    en:[
      ["direction","decode","Someone asks “Where is the station?” ¿Qué está buscando?",["La estación","La biblioteca","La panadería"],0,"“Where is” se usa para preguntar dónde está algo."],
      ["direction","decode","The sign says “Turn left.” ¿Hacia dónde debes girar?",["A la derecha","A la izquierda","Sigue derecho"],1,"“Left” significa izquierda."],
      ["direction","decode","The bridge sign reads “Go straight.” ¿Qué haces?",["Te detienes","Das la vuelta","Sigues derecho"],2,"“Go straight” significa sigue derecho."],
      ["greeting","respond","A neighbor says “Good morning.” ¿Qué está diciendo?",["Buenos días","Buenas noches","Adiós"],0,"“Good morning” es un saludo de mañana."],
      ["greeting","respond","Someone asks “What is your name?” Quiere saber tu…",["Edad","Nombre","Dirección"],1,"“What is your name?” pregunta cómo te llamas."],
      ["greeting","respond","A visitor says “Nice to meet you.” ¿Qué significa?",["Buena suerte","Perdón","Mucho gusto"],2,"“Nice to meet you” se usa al conocer a alguien."],
      ["market","trade","A vendor says “It costs five dollars.” ¿Cuál es el precio?",["Cinco dólares","Diez dólares","Quince dólares"],0,"“Five” significa cinco."],
      ["market","trade","¿Qué frase pide agua educadamente?",["I am thirsty.","May I have some water, please?","The street is far."],1,"“May I have some water, please?” es una petición educada."],
      ["market","trade","A stall sign says “Closed.” ¿Está abierta la tienda?",["Sí, está abierta","Está abriendo ahora","No, está cerrada"],2,"“Closed” significa cerrado."],
      ["time","repair","The clock reads 8:00. Choose the correct sentence.",["It is eight o'clock.","It is one o'clock.","It is twelve o'clock."],0,"“Eight o'clock” es las ocho en punto."],
      ["time","repair","Someone says “We will go to the park tomorrow.” ¿Cuándo van?",["Ayer","Mañana","Ahora"],1,"“Tomorrow” significa mañana."],
      ["time","repair","Complete: “Yesterday I ___ a letter.”",["write","will write","wrote"],2,"“Yesterday” pide el pasado de write: wrote."],
      ["objects","decode","The note says “Find the key.” ¿Qué debes buscar?",["Una llave","Un libro","Una silla"],0,"“Key” significa llave."],
      ["objects","decode","The message says “The door is open.” ¿Qué está abierto?",["La ventana","La puerta","La caja"],1,"“Door” significa puerta."],
      ["objects","decode","The librarian asks for “a red book.” ¿Cuál corresponde?",["Un cuaderno azul","Un lápiz verde","Un libro rojo"],2,"“A red book” significa un libro rojo."],
      ["conversation","respond","Someone says “Sorry.” ¿Qué está haciendo?",["Pidiendo disculpas","Preguntando la hora","Despidiéndose"],0,"“Sorry” puede expresar una disculpa."],
      ["conversation","respond","¿Cómo dices “Por favor” en inglés?",["You're welcome","Please","See you later"],1,"“Please” significa por favor."],
      ["conversation","respond","A message says “See you tomorrow.” ¿Qué significa?",["Hasta ayer","Buenos días","Hasta mañana"],2,"“See you tomorrow” significa hasta mañana."]
    ]
  };
  const normalize=s=>String(s||"").trim();
  const ensure=(ok,reason)=>{if(!ok)throw Error(reason);};
  const clone=v=>JSON.parse(JSON.stringify(v));
  function validate(raw){
    ensure(raw&&typeof raw==="object"&&!Array.isArray(raw),"Pack must be an object.");
    ensure(raw.schema===SCHEMA,"Expected schema puente.questpack/v1.");
    ensure(raw.language==="en"||raw.language==="es","Choose en or es.");
    ensure(typeof raw.title==="string"&&raw.title.trim().length>=4&&raw.title.length<=95,"Title must be 4–95 characters.");
    ensure(typeof raw.intro==="string"&&raw.intro.trim().length>=8&&raw.intro.length<=350,"Intro must be 8–350 characters.");
    ensure(Array.isArray(raw.questions)&&raw.questions.length===6,"An adventure needs exactly six challenges.");
    const seen=new Set();
    const questions=raw.questions.map((q,i)=>{
      ensure(q&&typeof q==="object","Question "+(i+1)+" is missing.");
      ensure(typeof q.prompt==="string"&&q.prompt.trim().length>=12&&q.prompt.length<=250,"Invalid prompt on question "+(i+1)+".");
      ensure(!seen.has(q.prompt.trim()),"Each question needs a distinct prompt.");seen.add(q.prompt.trim());
      ensure(Array.isArray(q.choices)&&q.choices.length===3&&q.choices.every(x=>typeof x==="string"&&x.trim().length>0&&x.length<=115),"Question "+(i+1)+" must have three short choices.");
      ensure(new Set(q.choices.map(x=>x.trim().toLowerCase())).size===3,"Question "+(i+1)+" has duplicate choices.");
      ensure(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<=2,"Question "+(i+1)+" needs a correct answer index from 0 to 2.");
      ensure(typeof q.explanation==="string"&&q.explanation.trim().length>=8&&q.explanation.length<=250,"Question "+(i+1)+" needs an explanation.");
      return {prompt:q.prompt.trim(),choices:q.choices.map(s=>s.trim()),correct:q.correct,explanation:q.explanation.trim(),topic:["direction","greeting","market","time","objects","conversation"].includes(q.topic)?q.topic:"conversation",mechanic:["decode","respond","trade","repair"].includes(q.mechanic)?q.mechanic:"decode"};
    });
    const source=raw.source&&typeof raw.source==="object"?raw.source:{};
    return {schema:SCHEMA,title:raw.title.trim(),language:raw.language,intro:raw.intro.trim(),
      world:Object.hasOwn(WORLD,raw.world)?raw.world:"village",questions,
      source:{method:["authored","recombined","imported"].includes(source.method)?source.method:"imported",origin:normalize(source.origin).slice(0,100)||"teacher_review",focus:normalize(source.focus).slice(0,80)||"mixed",evidence:normalize(source.evidence).slice(0,200)||"not measured"}};
  }
  function choose(arr,seed){
    let x=(Number(seed)>>>0)||0x9e3779b9;
    const random=()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};
    const out=arr.slice();
    for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
    return out;
  }
  function derive({language="es",world="village",focus="mixed",seed=1,evidence="not measured"}={}){
    ensure(BANK[language],"Invalid language.");
    ensure(WORLD[world],"Invalid story world.");
    const bank=BANK[language];
    let pool=choose(bank,seed);
    const supported=["direction","greeting","market","time","objects","conversation"];
    const spotlight=supported.includes(focus)?pool.filter(x=>x[0]===focus).slice(0,2):[];
    const remaining=pool.filter(x=>!spotlight.includes(x));
    const other=choose(remaining,seed+23);
    const selected=choose([...spotlight,...other.slice(0,6-spotlight.length)],seed+11);
    const index=(Math.abs(Math.floor(Number(seed)||1))%9000)+1000;
    const pack={schema:SCHEMA,title:WORLD[world].title+" · Expedition "+index,language,world,
      intro:WORLD[world].intro,
      questions:selected.map(x=>({topic:x[0],mechanic:x[1],prompt:x[2],choices:x[3],correct:x[4],explanation:x[5]})),
      source:{method:"recombined",origin:"PUENTE authored phrase bank v1",focus:supported.includes(focus)?focus:"mixed",evidence:normalize(evidence).slice(0,200)}};
    return validate(pack);
  }
  function empty(){return {schema:"puente.garden-library/v1",drafts:[],approved:[]};}
  function load(){
    try{
      const data=JSON.parse(localStorage.getItem(KEY)||"null");
      if(!data||data.schema!=="puente.garden-library/v1")return empty();
      return {schema:data.schema,drafts:Array.isArray(data.drafts)?data.drafts.slice(-LIMIT):[],approved:Array.isArray(data.approved)?data.approved.slice(-LIMIT):[]};
    }catch{return empty();}
  }
  function write(lib){
    ensure(lib.drafts.length<=LIMIT&&lib.approved.length<=LIMIT,"Garden library is full. Export or remove a pack first.");
    localStorage.setItem(KEY,JSON.stringify(lib));
  }
  function id(){return root.crypto&&typeof root.crypto.randomUUID==="function"?root.crypto.randomUUID():"p-"+Date.now()+"-"+Math.floor(Math.random()*1e8);}
  function draft(pack,receipt="Teacher-imported candidate"){
    const good=validate(pack),lib=load();
    ensure(lib.drafts.length<LIMIT,"Draft shelf full. Review or discard drafts.");
    const key=id();lib.drafts.push({id:key,pack:good,receipt:normalize(receipt).slice(0,300),madeAt:new Date().toISOString()});write(lib);return key;
  }
  function approve(key){
    const lib=load(),index=lib.drafts.findIndex(x=>x.id===key);
    ensure(index!==-1,"Draft not found.");
    ensure(lib.approved.length<LIMIT,"Approved shelf full. Export or remove old packs.");
    const card=lib.drafts.splice(index,1)[0];
    card.pack=validate(card.pack);card.approvedAt=new Date().toISOString();
    lib.approved.push(card);write(lib);return card;
  }
  function revise(key,pack){
    const lib=load(),item=lib.drafts.find(x=>x.id===key);ensure(item,"Draft not found.");
    item.pack=validate(pack);item.receipt="Teacher edited and validated this draft.";
    write(lib);return item;
  }
  function remove(key,which="drafts"){
    ensure(["drafts","approved"].includes(which),"Invalid shelf.");
    const lib=load();lib[which]=lib[which].filter(x=>x.id!==key);write(lib);
  }
  function toLink(pack){
    const content=JSON.stringify(validate(pack));
    const bytes=new TextEncoder().encode(content);
    let s="";for(const b of bytes)s+=String.fromCharCode(b);
    const b64=btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
    ensure(b64.length<=9500,"This pack needs a shorter title or prompts to share as a URL.");
    return b64;
  }
  function fromLink(code){
    ensure(typeof code==="string"&&code.length>0&&code.length<=9500&&/^[A-Za-z0-9_-]+$/.test(code),"Invalid practice link.");
    const b64=code.replace(/-/g,"+").replace(/_/g,"/");const bytes=atob(b64);
    const array=Uint8Array.from(bytes,c=>c.charCodeAt(0));
    return validate(JSON.parse(new TextDecoder().decode(array)));
  }
  function prompt(language="es",focus="mixed"){
    return "You are helping a language teacher create a PUENTE cooperative game. Return ONE JSON object only with schema \"puente.questpack/v1\", a short title, language \""+language+"\", a story intro, world \"village\" (or \"market\", \"signal\", \"clock\", \"mystery\"), and exactly six questions. Every question needs: prompt, exactly three choices, integer correct from 0 to 2, explanation, topic (direction/greeting/market/time/objects/conversation), mechanic (decode/respond/trade/repair). Focus: "+focus+". Include practical, age-appropriate expressions. Explain genuinely correct grammar, natural usage and cultural variety. Don't request student names/data. Do not use any personal examples or student responses. Teachers must review content and answers before approving. Include source:{\"method\":\"authored\",\"origin\":\"teacher ChatGPT draft\",\"focus\":\""+focus+"\",\"evidence\":\"not tested\"}.";
  }
  root.PuenteGarden={SCHEMA,WORLD,BANK,validate,derive,load,draft,approve,revise,remove,toLink,fromLink,prompt};
})(typeof window!=="undefined"?window:globalThis);
