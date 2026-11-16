/* PUENTE / Relay Protocol UI. HTML buttons are the game controller;
   the SVG network is a readable visualization, not a screenshot.
   All relay logic, validation and score come from protocol-engine.js. */
(function(root){
"use strict";
const G=root.PuenteProtocol;
const $=id=>document.getElementById(id);
const make=(tag,cls,label)=>{
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(label!==undefined)node.textContent=label;
 return node;
};
const SVG="http://www.w3.org/2000/svg";
const POINTS={
 IN:[30,195],A:[200,80],B:[200,195],C:[200,310],
 D:[430,80],E:[430,195],F:[430,310],OUT:[610,195]
};
let state=null,seed=1001,language="es";
let wires=[],buttons=[];
const label=(n)=>G.LETTERS[n];
function link(){
 const origin=root.location.protocol==="file:"?"https://puente.abundent.org/":root.location.href;
 const u=new URL(origin);u.search="";u.hash="";
 u.searchParams.set("protocol",G.codeFrom(seed));
 u.searchParams.set("language",language);
 $("protocolShareLink").value=u.href;
 return u.href;
}
function draw(){
 const svg=$("protocolWires");svg.replaceChildren();
 wires=[];
 for(const [from,to] of G.EDGES){
  const [x1,y1]=POINTS[from],[x2,y2]=POINTS[to];
  const line=document.createElementNS(SVG,"line");
  for(const [name,value] of Object.entries({x1,y1,x2,y2}))line.setAttribute(name,String(value));
  line.setAttribute("class","protocol-wire");
  line.setAttribute("stroke-linecap","round");
  svg.append(line);wires.push({from,to,line});
 }
 for(const end of ["IN","OUT"]){
  const [x,y]=POINTS[end],n=document.createElementNS(SVG,"circle");
  n.setAttribute("cx",String(x));n.setAttribute("cy",String(y));n.setAttribute("r","14");
  n.setAttribute("class",end==="IN"?"protocol-terminal input":"protocol-terminal output");
  svg.append(n);
 }
 const wrap=$("protocolRelays");wrap.replaceChildren();
 buttons=G.LETTERS.map((name,i)=>{
  const [x,y]=POINTS[name],btn=make("button","protocol-node",name);
  btn.type="button";
  btn.style.left=(x/640*100)+"%";btn.style.top=(y/390*100)+"%";
  btn.dataset.relay=name;
  btn.setAttribute("aria-label","Relay "+name+" — off. Click to toggle.");
  btn.setAttribute("aria-pressed","false");
  btn.addEventListener("click",()=>{
   if(state.solved)return;
   G.toggle(state,i);render();
  });
  wrap.append(btn);
  return btn;
 });
}
function status(message,isError=false){
 const e=$("protocolFeedback");e.textContent=message;
 e.classList.toggle("protocol-error",Boolean(isError));
}
function translated(rule,i){
 const alternate=state.hints.includes(i);
 return alternate?G.statement(rule,language==="es"?"en":"es"):G.statement(rule,language);
}
function renderRules(){
 const list=$("protocolRules");list.replaceChildren();
 state.puzzle.rules.forEach((rule,i)=>{
  const item=make("li","protocol-rule");
  const number=make("span","protocol-rule-number",String(i+1).padStart(2,"0"));
  const body=make("p","protocol-rule-text",translated(rule,i));
  const button=make("button","protocol-translate",state.hints.includes(i)?"Translation used":"Translate");
  button.type="button";
  button.disabled=state.solved||state.hints.includes(i);
  button.setAttribute("aria-label","Translate instruction "+(i+1)+"; this uses one hint.");
  button.addEventListener("click",()=>{
   G.translate(state,i);renderRules();render();
   status("Translation decoded. You can still solve the mission; an assisted run earns a lower score.");
  });
  item.append(number,body,button);list.append(item);
 });
}
function render(){
 if(!state)return;
 const {mask,puzzle}=state,active=G.ones(mask),route=G.connected(mask);
 const powered=new Set(route.powered);
 buttons.forEach((node,i)=>{
  const lit=Boolean((mask>>i)&1),name=label(i);
  node.classList.toggle("on",lit);
  node.classList.toggle("energized",powered.has(name));
  node.setAttribute("aria-pressed",String(lit));
  node.setAttribute("aria-label","Relay "+name+" — "+(lit?"on":"off")+". Click to toggle.");
  node.disabled=state.solved;
 });
 wires.forEach(({from,to,line})=>{
  const fromOn=from==="IN"||powered.has(from);
  const toOn=to==="OUT"?route.connected:powered.has(to);
  line.classList.toggle("active",fromOn&&toOn);
  line.classList.toggle("complete",state.solved&&fromOn&&toOn);
 });
 $("protocolPower").textContent=active+" / "+G.POWER;
 $("protocolPower").classList.toggle("bad",active>G.POWER);
 $("protocolRoute").textContent=route.connected?"ROUTE LIVE":"DISCONNECTED";
 $("protocolRoute").classList.toggle("good",route.connected);
 $("protocolTrace").textContent=String(Math.max(0,state.attempts-(state.solved?1:0)))+" FAILED PULSES";
 const ready=active===G.POWER&&route.connected;
 $("protocolPulse").disabled=state.solved||!ready;
 $("protocolPulse").textContent=state.solved?"CONNECTION AUTHORIZED":ready?"TEST THIS NETWORK →":"CONNECT 3 RELAYS TO TRANSMIT";
 $("protocolClear").disabled=state.solved;
 $("protocolSeed").textContent="PROTOCOL #"+G.codeFrom(seed);
 $("protocolLanguage").value=language;
 $("protocolWin").hidden=!state.solved;
 if(state.lastPulse&&!state.solved){
  status("SIGNAL REJECTED · "+state.lastPulse.correct+" of "+state.lastPulse.total+
   " intercepted conditions match. Rearrange the live network.",true);
 }else if(!state.solved){
  if(active===0)status("Six relays. Three units of power. One correct network. Read the intercepted conditions and build a route.");
  else if(active!==G.POWER)status("POWER BUDGET · "+active+" active; exactly "+G.POWER+" required.");
  else if(!route.connected)status("PHYSICAL FAILURE · No powered path from INPUT to OUTPUT.",true);
  else status("Circuit ready. Is it consistent with ALL of the intercepted rules? Transmit to find out.");
 }
}
function bestRecord(){
 const key="puente.relay.best."+seed+"."+language;
 const score=G.score(state),record={score,attempts:state.attempts,hints:state.hints.length};
 try{
  const old=JSON.parse(localStorage.getItem(key)||"null");
  if(!old||score>old.score)localStorage.setItem(key,JSON.stringify(record));
  const best=JSON.parse(localStorage.getItem(key)||"null");
  return best?"PERSONAL BEST "+best.score+" PTS · saved on this device.":"";
 }catch{return "Results are not sent to a server.";}
}
function transmit(){
 const result=G.pulse(state);
 render();
 if(result.type==="win"){
  const rank=state.attempts===1&&state.hints.length===0?"PERFECT DECODE":
   state.hints.length===0?"SIGNAL OPERATOR":"ASSISTED EXTRACTION";
  $("protocolWin").hidden=false;
  $("protocolWinReport").textContent=rank+" · "+G.score(state)+
   " points · "+state.attempts+" pulse"+(state.attempts===1?"":"s")+
   " · "+state.hints.length+" translated clue"+(state.hints.length===1?"":"s")+
   ". "+bestRecord();
  renderRules();status("SIGNAL ACCEPTED · All directives agree and the route is physical.");
 }else if(result.message){status(result.message,result.type==="reject"||result.type==="route");}
}
function load(nextSeed=1001,lang="es"){
 try{
  seed=G.seedValue(nextSeed);
  language=lang==="en"?"en":"es";
  state=G.begin(seed,language);
  draw();renderRules();render();link();
  $("protocolWin").hidden=true;
  $("protocolTeachPanel").hidden=true;
 }catch(err){status("Challenge could not be opened: "+err.message,true);}
}
function init(){
 if(!G)throw Error("Relay engine missing.");
 $("protocolPulse").addEventListener("click",transmit);
 $("protocolClear").addEventListener("click",()=>{
  const fresh=G.begin(seed,language);
  state=fresh;renderRules();render();$("protocolWin").hidden=true;
  status("Relays reset. The intercepted instructions remain unchanged.");
 });
 $("protocolLanguage").addEventListener("change",e=>load(seed,e.target.value));
 $("protocolTeach").addEventListener("click",()=>{
  $("protocolTeachPanel").hidden=!$("protocolTeachPanel").hidden;
 });
 $("protocolCopy").addEventListener("click",async()=>{
  const text=link();
  try{await navigator.clipboard.writeText(text);status("Challenge link copied. Send it to someone who enjoys logic puzzles.");}
  catch{const input=$("protocolShareLink");input.focus();input.select();status("Clipboard unavailable. Select and copy the challenge URL above.");}
 });
 const next=()=>{
  // Repeatable seed => repeatable constraints. Share a challenge code instead
  // of uploading user-written instructions or personal information.
  let code=1+Math.floor(Math.random()*90000000);
  if(code===seed)code=(code%90000000)+1;
  load(code,language);
 };
 $("protocolNext").addEventListener("click",next);
 $("protocolNew").addEventListener("click",next);
 $("protocolReplay").addEventListener("click",()=>load(seed,language));
 const p=new URL(root.location.href).searchParams;
 let initial=1001;
 if(p.has("protocol"))try{initial=G.codeTo(p.get("protocol"));}
 catch{initial=1001;}
 load(initial,p.get("language")==="en"?"en":"es");
}
root.PuenteProtocolUI={init,load,transmit};
})(window);
