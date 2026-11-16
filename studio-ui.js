/* PUENTE Teacher's Playroom: studio, preview, replay, print and Chitty prompt.
   This is local teacher tooling; never calls AI or sends class data. */
(function(root){
"use strict";
const S=root.PuenteStudio,P=root.PuenteProtocol,$=id=>document.getElementById(id);
let work=null,translated=false,answerOpen=false,origin=1001;
const create=(tag,cls,text)=>{
 const node=document.createElement(tag);if(cls)node.className=cls;
 if(text!==undefined)node.textContent=text;
 return node;
};
const notice=(text,bad=false)=>{
 const el=$("studioFeedback");el.textContent=text;el.classList.toggle("error",bad);
};
function readControls(){
 return S.options({language:$("studioLanguage").value,rank:$("studioRank").value,
  focus:$("studioFocus").value,scene:$("studioScene").value,
  minutes:Number($("studioMinutes").value),note:$("studioNotes").value});
}
function syncControls(){
 const o=work.options;
 for(const [k,id] of Object.entries({language:"studioLanguage",rank:"studioRank",
   focus:"studioFocus",scene:"studioScene",minutes:"studioMinutes"}))$(id).value=String(o[k]);
 $("studioNotes").value=o.note;
}
function cleanPromptNote(){
 if(!work)return;
 work.options.note=$("studioNotes").value.trim().slice(0,1200);
}
function render(){
 if(!work)return;
 const {options:o,puzzle:p}=work;
 $("studioMissionName").textContent=S.SCENES[o.scene].name;
 $("studioStory").textContent=S.SCENES[o.scene].hook;
 $("studioCode").textContent="PROTOCOL #"+P.codeFrom(p.seed);
 $("studioRuleCount").textContent=p.rules.length+" RULES";
 const list=$("studioRules");list.replaceChildren();
 p.rules.forEach((rule,i)=>{
  const li=create("li","",P.statement(rule,translated?(o.language==="es"?"en":"es"):o.language));
  list.append(li);
 });
 $("studioTranslate").textContent=translated?"Read original intercepted instructions":"See teacher's translations";
 $("studioAnswer").hidden=!answerOpen;
 $("studioPeek").textContent=answerOpen?"Hide teacher's key":"Peek at the solution";
 $("studioAnswerText").textContent=S.solution(work).join(" + ")+
  " · Exactly three relays, all statements true, and a connected signal path.";
 $("studioTarget").textContent=S.purpose(work);
 const agenda=$("studioAgenda");agenda.replaceChildren();
 S.schedule(o.minutes).forEach(line=>agenda.append(create("p","",line)));
 renderShelf();
}
function setWork(start,options,loadNote=false){
 const previous=work;
 try{
  work=S.forge(options,start);
  origin=work.puzzle.seed;
  translated=false;answerOpen=false;syncControls();render();
  notice("Freshly forged and checked: exactly one valid configuration. Try it before peeking!");
 }catch(err){
  work=previous;notice("Could not forge this one: "+err.message,true);
 }
}
function reroll({mix=false}={}){
 const opts=readControls();
 if(mix){
  const scenes=Object.keys(S.SCENES),focus=Object.keys(S.FOCUS);
  opts.scene=scenes[Math.floor(Math.random()*scenes.length)];
  opts.focus=focus[Math.floor(Math.random()*focus.length)];
  opts.rank=Math.random()<.5?"starter":"stretch";
 }
 const next=1+Math.floor(Math.random()*99999998);
 setWork(next,opts);
}
function updateKnob(kind){
 if(!work)return;
 cleanPromptNote();
 const opts=readControls();
 if(["language","rank","focus"].includes(kind))setWork(origin+1,opts);
 else{work.options=opts;render();notice("Lesson framing changed. The relay logic stays intact.");}
}
async function copy(value,fallback){
 try{
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return true;}
 }catch{}
 const field=document.createElement("textarea");
 field.value=value;field.readOnly=true;
 field.style.position="fixed";field.style.left="-10000px";
 document.body.append(field);field.select();
 let result=false;
 try{result=document.execCommand("copy");}catch{}
 field.remove();
 if(!result&&fallback)fallback(value);
 return result;
}
function textFallback(text){
 const blob=new Blob([text],{type:"text/plain;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="puente-lesson-"+P.codeFrom(work.puzzle.seed)+".txt";
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function save(){
 cleanPromptNote();
 try{
  const id=S.save(work);renderShelf();
  notice("Kept on this browser! Lesson "+id+" is ready to reopen, copy or print.");
 }catch(err){notice("Couldn't keep it: "+err.message,true);}
}
function renderShelf(){
 const saved=$("studioSaved");saved.replaceChildren();
 const items=S.load();$("studioShelfCount").textContent=items.length+" kept";
 if(!items.length){saved.append(create("p","help","Nothing saved yet. Roll a lesson, play it, and press “Keep this lesson ★”. Your saved ideas will appear here."));return;}
 for(const item of items.slice().reverse()){
  const card=create("article","studio-saved-card");
  const scene=S.SCENES[item.options?.scene];
  card.append(create("strong","",scene?.name||"A saved mission"),
   create("small","",P.codeFrom(item.seed)+" · "+(item.options.language==="es"?"Spanish":"English")+
    " · "+(item.options.rank==="stretch"?"Stretch":"On-ramp")));
  const row=create("div","action-row");
  const open=create("button","btn outlined small","Open lesson");
  open.type="button";open.addEventListener("click",()=>{
   setWork(item.seed,item.options);
   $("studioScreen").scrollIntoView({behavior:"smooth",block:"start"});
   notice("Saved mission loaded. You can play it, change the scene, or print it.");
  });
  const remove=create("button","btn outlined small","Remove");
  remove.type="button";remove.addEventListener("click",()=>{
   if(!confirm("Remove this lesson from this browser?"))return;
   S.remove(item.id);renderShelf();notice("Saved lesson removed.");
  });
  row.append(open,remove);card.append(row);saved.append(card);
 }
}
function openStudent(){
 if(!work)return;
 const {puzzle:p,options:o}=work;
 root.PuenteProtocolUI.load(p.seed,o.language);
 const tab=document.querySelector('[data-screen="protocol"]');
 if(tab)tab.click();
}
function print(){
 if(!work)return;
 cleanPromptNote();
 const sheet=$("studioPrintSheet");
 sheet.textContent=S.plan(work);
 const finish=()=>document.body.classList.remove("printing-studio");
 root.addEventListener("afterprint",finish,{once:true});
 document.body.classList.add("printing-studio");
 root.print();
 setTimeout(finish,2000);
}
function init(){
 if(!S||!P)throw Error("PUENTE teacher playroom needs the relay engine.");
 $("studioRoll").addEventListener("click",()=>reroll({mix:true}));
 for(const [id,key] of [["studioLanguage","language"],["studioRank","rank"],
   ["studioFocus","focus"],["studioScene","scene"],["studioMinutes","minutes"]]){
  $(id).addEventListener("change",()=>updateKnob(key));
 }
 $("studioNotes").addEventListener("change",cleanPromptNote);
 $("studioPlay").addEventListener("click",openStudent);
 $("studioTranslate").addEventListener("click",()=>{
  translated=!translated;render();
 });
 $("studioPeek").addEventListener("click",()=>{
  answerOpen=!answerOpen;render();
  if(answerOpen)notice("Teacher's key revealed here only. The student challenge link does not show the answer.");
 });
 $("studioKeep").addEventListener("click",save);
 $("studioPrint").addEventListener("click",print);
 $("studioCopyPlan").addEventListener("click",async()=>{
  cleanPromptNote();
  const result=await copy(S.plan(work),textFallback);
  notice(result?"Lesson card copied. Paste it into any document.":"Lesson card saved as a text file for sharing or printing.");
 });
 $("studioCopyChat").addEventListener("click",async()=>{
  cleanPromptNote();
  let prompt=S.chatPrompt(work);
  if(work.options.note)prompt+="\nHere is a private teacher planning note (do not share as student data): "+work.options.note;
  const result=await copy(prompt,textFallback);
  notice(result?"Chitty's prompt copied. Open your ChatGPT and paste it there.":"A text file containing the prompt was saved. Open it and paste into ChatGPT.");
 });
 const url=new URL(root.location.href).searchParams;
 const code=url.get("studioCode");let start=1001;
 if(code){try{start=P.codeTo(code);}catch{}}
 setWork(start,readControls());
 return true;
}
root.PuenteStudioUI={init,openStudent,reroll};
})(window);
