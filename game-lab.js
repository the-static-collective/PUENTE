/* PUENTE Game Lab — alternative *interactions*, not a self-learning model.
   Extends the existing finite teacher-reviewed question library without changing
   the public questpack/v1 contract or server-side answer validation. */
(function(root){
  "use strict";
  const G=root.PuenteGarden;
  if(!G)throw Error("Quest Garden must load before the Game Lab.");
  const FORMATS={mixed:"Mixed Adventure",signal:"Signal Tuner",map:"Map Navigator",forge:"Word Weave"};
  const FORGE_BANK={
    es:[
      ["conversation","Build the sentence meaning “I speak Spanish.”",["Yo","hablo","español."],"“Yo hablo español” means “I speak Spanish.”"],
      ["objects","Build the sentence meaning “The door is open.”",["La","puerta","abre."],"“La puerta abre” literally means “The door opens.”"],
      ["conversation","Build the sentence meaning “We are ready.”",["Estamos","muy","listos."],"“Estamos muy listos” means “We are very ready.”"],
      ["objects","Build the sentence meaning “I have bread.”",["Tengo","el","pan."],"“Tengo el pan” means “I have the bread.”"],
      ["direction","Build the sentence meaning “Where is it?”",["¿Dónde","está","eso?"],"“¿Dónde está eso?” means “Where is that?”"],
      ["greeting","Build the greeting “Good morning, friend.”",["Buenos","días,","amigo."],"“Buenos días, amigo” means “Good morning, friend.”"]
    ],
    en:[
      ["conversation","Build the sentence meaning “Yo hablo inglés.”",["I","speak","English."],"“I speak English” means “Yo hablo inglés.”"],
      ["objects","Build the sentence meaning “La puerta está abierta.”",["Doors","are","open."],"“Doors are open” means “Las puertas están abiertas.”"],
      ["conversation","Build the sentence meaning “Estamos listos.”",["We","are","ready."],"“We are ready” means “Estamos listos.”"],
      ["objects","Build the sentence meaning “Tengo un libro.”",["I","have","books."],"“I have books” means “Tengo libros.”"],
      ["direction","Build the sentence meaning “¿Dónde está?”",["Where","is","it?"],"“Where is it?” means “¿Dónde está?”"],
      ["greeting","Build the greeting “Buenos días.”",["Good","morning,","friend."],"“Good morning, friend” means “Buenos días, amigo.”"]
    ]
  };
  // The Bank's English/Spanish targets must match exactly, not approximate.
  FORGE_BANK.es[1]=["objects","Build the sentence meaning “The door opens.”",["La","puerta","abre."],"“La puerta abre” means “The door opens.”"];
  FORGE_BANK.es[2]=["conversation","Build the sentence meaning “We are very ready.”",["Estamos","muy","listos."],"“Estamos muy listos” means “We are very ready.”"];
  FORGE_BANK.es[3]=["objects","Build the sentence meaning “I have the bread.”",["Tengo","el","pan."],"“Tengo el pan” means “I have the bread.”"];
  FORGE_BANK.en[1]=["objects","Build the sentence meaning “Las puertas están abiertas.”",["Doors","are","open."],"“Doors are open” means “Las puertas están abiertas.”"];
  FORGE_BANK.en[3]=["objects","Build the sentence meaning “Tengo libros.”",["I","have","books."],"“I have books” means “Tengo libros.”"];
  FORGE_BANK.en[5]=["greeting","Build the greeting “Buenos días, amigo.”",["Good","morning,","friend."],"“Good morning, friend” means “Buenos días, amigo.”"];
  const rotate=(xs,n)=>xs.slice(n).concat(xs.slice(0,n));
  const baseDerive=G.derive;
  function forgeQuestion(entry,offset){
    const [topic,prompt,tokens,explanation]=entry;
    const start=((Number(offset)||0)%3+3)%3;
    const words=rotate(tokens,start);
    const choices=[0,1,2].map(n=>rotate(words,n).join(" "));
    return {topic,prompt,choices,correct:(3-start)%3,explanation,mechanic:"repair"};
  }
  function isWordWeave(q){
    if(!q||q.mechanic!=="repair"||!Array.isArray(q.choices)||q.choices.length!==3)return false;
    const words=q.choices[0].trim().split(/ +/);
    if(words.length!==3)return false;
    return [0,1,2].every(i=>rotate(words,i).join(" ")===q.choices[i]);
  }
  G.derive=function(opts={}){
    const mode=opts.mode||"mixed";
    if(!Object.prototype.hasOwnProperty.call(FORMATS,mode))throw Error("Unknown mini-game format.");
    const seed=(Math.floor(Number(opts.seed)||1)>>>0);
    const pack=baseDerive(opts);
    const bank=FORGE_BANK[pack.language];
    // Mixed = 2 Signal + 2 Map + 2 Word Weave. All-fragment modes use the
    // same pre-reviewed prompts, formatted as distinct game interactions.
    pack.questions=pack.questions.map((q,i)=>{
      const flavor=mode==="mixed"?["signal","map","forge"][i%3]:mode;
      if(flavor==="forge")return forgeQuestion(bank[(i+seed)%bank.length],(seed+i)%3);
      return {...q,mechanic:flavor==="signal"?"decode":"trade"};
    });
    pack.source.evidence=String((pack.source.evidence||"not measured")+" | mode:"+mode).slice(0,200);
    return G.validate(pack);
  };
  // Keeps the ChatGPT prompt compatible with the original schema; teachers
  // can create fresh content in this version without a model on the device.
  const priorPrompt=G.prompt;
  G.prompt=function(language="es",focus="mixed"){
    return priorPrompt(language,focus)+" For optional interactive Word Weave challenges, use mechanic 'repair': exactly three space-separated word tiles in the first answer, then its two cyclic rotations as options 2 and 3. All three choices must be whole phrases, and their correct option must be grammatically valid. Avoid using personal information.";
  };
  root.PuenteGameLab={FORMATS,FORGE_BANK,forgeQuestion,isWordWeave};
})(window);
