/* PUENTE Quest Garden teacher UI — local drafts, explicit approval, no student identifiers */
(function(root){
"use strict";
const G=root.PuenteGarden;
const $=id=>document.getElementById(id);
let activeDraft=null,practicePack=null,loadedPractice=false,editing=false;
const notice=(message,error=false)=>{const box=$("appNotice");box.textContent=message;box.classList.toggle("error",error);};
const button=(label,handler,primary=false)=>{
  const b=document.createElement("button");b.type="button";b.className="btn "+(primary?"primary":"outlined")+" small";
  b.textContent=label;b.addEventListener("click",handler);return b;
};
const node=(tag,text,className)=>{
  const d=document.createElement(tag);d.textContent=text;if(className)d.className=className;return d;
};
function showGarden(){
  document.querySelector('[data-screen="garden"]').click();
}
function renderShelves(){
  const lib=G.load();$("gardenCounts").textContent=lib.approved.length+" approved · "+lib.drafts.length+" drafts";
  const pending=$("gardenDraftList"),approved=$("gardenApprovedList");
  pending.replaceChildren();approved.replaceChildren();
  if(!lib.drafts.length)pending.append(node("p","No drafts yet. Plant one, or paste a ChatGPT-generated pack.","garden-empty"));
  if(!lib.approved.length)approved.append(node("p","No approved adventures yet. Review a draft, then add it to the teacher's game shelf.","garden-empty"));
  for(const card of lib.drafts){
    const item=node("article","","garden-item");
    item.append(node("h4",card.pack.title),node("p",card.receipt||"Needs teacher review."));
    const actions=node("div","","action-row");
    actions.append(button("Inspect answers",()=>review(card.id)),button("Export JSON",()=>download(card.pack)));
    item.append(actions);pending.append(item);
  }
  for(const card of lib.approved){
    const item=node("article","","garden-item");
    item.append(node("h4",card.pack.title),node("p",(card.pack.language==="es"?"Spanish":"English")+" · six challenges · "+(card.pack.source?.method||"teacher-reviewed")));
    const actions=node("div","","action-row");
    actions.append(button("Play in class",()=>loadInTeacher(card.id),true),
      button("Homework link",()=>copyHomework(card.pack)),
      button("Export JSON",()=>download(card.pack)),
      button("Remove",()=>{if(confirm("Remove this approved pack from this browser? Export first if you want a backup.")){G.remove(card.id,"approved");renderShelves();}}));
    item.append(actions);approved.append(item);
  }
  populateAdventures();
}
function populateAdventures(selected=null){
  const select=$("teacherAdventure"),lang=$("teacherLanguage").value;
  const prev=selected||select.value;
  select.replaceChildren();
  const base=document.createElement("option");base.value="bridge";base.textContent="The Broken Bridge · 6 challenges";select.append(base);
  for(const card of G.load().approved){
    if(card.pack.language!==lang)continue;
    const option=document.createElement("option");option.value=card.id;option.textContent=card.pack.title;select.append(option);
  }
  if([...select.options].some(o=>o.value===prev))select.value=prev;
}
function selectedPack(){
  const card=G.load().approved.find(c=>c.id===$("teacherAdventure").value);
  return card?G.validate(card.pack):null;
}
function review(key){
  const card=G.load().drafts.find(c=>c.id===key);
  if(!card){notice("Draft not found.",true);return;}
  activeDraft=key;editing=false;
  $("gardenReview").hidden=false;
  $("gardenReviewTitle").textContent=card.pack.title;
  $("gardenReviewIntro").textContent=card.pack.intro;
  $("gardenReviewProvenance").textContent="SOURCE / "+card.pack.source.origin+" · FOCUS / "+card.pack.source.focus+" · EVIDENCE / "+card.pack.source.evidence+". No questions are published until approved.";
  const list=$("gardenQuestionReview");list.replaceChildren();
  card.pack.questions.forEach((q,i)=>{
    const row=node("article","","garden-question");
    row.append(node("h4",(i+1)+". "+q.prompt),node("p",q.choices.map((x,j)=>String.fromCharCode(65+j)+". "+x).join("   ·   ")),node("p","Correct: "+q.choices[q.correct]+"  |  "+q.explanation,"key"));
    list.append(row);
  });
  $("gardenEditJson").value=JSON.stringify(card.pack,null,2);
  $("gardenReview").scrollIntoView({block:"start",behavior:"smooth"});
}
function download(pack){
  try{
    const contents=JSON.stringify(G.validate(pack),null,2);
    const blob=new Blob([contents],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");link.href=url;
    link.download="puente-"+pack.language+"-"+pack.world+"-"+Date.now()+".json";
    document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);notice("Quest pack downloaded as JSON.");
  }catch(err){notice(err.message,true);}
}
async function copy(text){
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true;}
  return false;
}
async function copyHomework(pack){
  try{
    const url=new URL(root.location.href);
    url.search="";url.searchParams.set("practicePack",G.toLink(pack));
    if(await copy(url.href))notice("Homework link copied: opens this approved pack on any phone.");
    else notice("Copy this link: "+url.href);
  }catch(err){notice("Could not make a practice link: "+err.message,true);}
}
function loadInTeacher(key){
  const item=G.load().approved.find(c=>c.id===key);if(!item)return;
  $("teacherLanguage").value=item.pack.language;
  populateAdventures(key);
  $("teacherAdventure").value=key;
  document.querySelector('[data-screen="teacher"]').click();
  notice("Loaded "+item.pack.title+". Open the classroom to start.");
}
function generate(receipt=null){
  try{
    const lib=G.load();
    const seed=Date.now()+lib.drafts.length*97+lib.approved.length*123;
    const pack=G.derive({language:$("gardenLanguage").value,world:$("gardenWorld").value,focus:$("gardenFocus").value,seed,evidence:receipt||"Teacher-initiated recombination; not tested with students."});
    const key=G.draft(pack,receipt||"New authored-bank combination — requires teacher review.");
    renderShelves();review(key);notice("Draft generated. Check all six answers before approving.");
    return key;
  }catch(err){notice(err.message,true);return null;}
}
function topFocus(rows){
  const candidates=rows.filter(x=>x.responses>=2&&x.topic!=="mixed");
  if(!candidates.length)return {focus:"mixed",evidence:"No interpretable class-level trend; exploratory draft only."};
  const sorted=candidates.slice().sort((a,b)=>(a.correct/a.responses)-(b.correct/b.responses));
  const hardest=sorted[0],rate=Math.round(hardest.correct/hardest.responses*100);
  return {focus:hardest.topic,evidence:"Aggregate round "+hardest.step+": "+hardest.correct+" / "+hardest.responses+" correct ("+rate+"%). Hypothesis: revisit "+hardest.topic+". Teacher review required."};
}
function track(s,role){
  if(role!=="teacher")return;
  let key="puente.growth." + s.code;
  let data;
  try{data=JSON.parse(sessionStorage.getItem(key)||"null");}catch{data=null;}
  if(!data)data={code:s.code,language:s.language,rounds:{},grown:false};
  if(s.status==="reveal"&&s.step>=1&&s.responses>0&&!data.rounds[s.step]){
    const topic=s.question?.topic || "mixed";
    data.rounds[s.step]={step:s.step,topic,correct:s.round_correct,responses:s.responses};
    sessionStorage.setItem(key,JSON.stringify(data));
  }
  if(s.status!=="finished")return;
  if(!data.grown){
    const result=topFocus(Object.values(data.rounds));
    const worldCycle=["market","signal","clock","mystery","village"];
    const world=worldCycle[(Math.max(0,Number(s.step))+G.load().approved.length)%worldCycle.length];
    try{
      const lib=G.load();
      const pack=G.derive({language:s.language,world,focus:result.focus,seed:Date.now()+lib.drafts.length*37,evidence:result.evidence});
      const id=G.draft(pack,"Session-derived hypothesis. "+result.evidence);
      data.grown=true;data.draftId=id;
      sessionStorage.setItem(key,JSON.stringify(data));
      renderShelves();
    }catch(err){
      data.grown=false;notice("Class finished. Quest Garden needs review: "+err.message,true);
    }
  }
  $("classGrowth").hidden=false;
  $("growthReceipt").textContent=data.grown?"Next adventure drafted from the class's aggregate round totals, without nicknames or individual answers. Review and approve before use.":"You finished! Open Quest Garden to create the next adventure.";
}
function init(){
  if(!G)throw Error("Quest Garden engine was not loaded.");
  $("gardenGrow").addEventListener("click",()=>generate());
  $("gardenCopyPrompt").addEventListener("click",async()=>{
    const prompt=G.prompt($("gardenLanguage").value,$("gardenFocus").value);
    try{if(await copy(prompt))notice("ChatGPT authoring prompt copied.");else{$("gardenPaste").value=prompt;$("gardenPaste").select();notice("Clipboard unavailable. Prompt selected in the text box; copy it before replacing with JSON.");}}
    catch{$("gardenPaste").value=prompt;$("gardenPaste").select();}
  });
  $("gardenImport").addEventListener("click",()=>{
    try{
      const input=$("gardenPaste").value;
      if(input.length>24000)throw Error("Pack too large.");
      const pack=G.validate(JSON.parse(input));
      const key=G.draft(pack,"Imported JSON candidate · source unverified until teacher review");
      $("gardenPaste").value="";renderShelves();review(key);notice("Imported as a held draft. Review before approving.");
    }catch(err){notice("Import rejected: "+err.message,true);}
  });
  $("gardenSaveEdit").addEventListener("click",()=>{
    if(!activeDraft)return;
    try{G.revise(activeDraft,JSON.parse($("gardenEditJson").value));renderShelves();review(activeDraft);notice("Saved validated edits.");}
    catch(err){notice("Edit rejected: "+err.message,true);}
  });
  $("gardenApprove").addEventListener("click",()=>{
    if(!activeDraft)return;
    try{
      // Must save JSON edits explicitly before approval; no silent edits.
      const latest=G.load().drafts.find(x=>x.id===activeDraft);
      if(latest&&$("gardenEditJson").value!==JSON.stringify(latest.pack,null,2))throw Error("Save and validate edits before approving.");
      const card=G.approve(activeDraft);activeDraft=null;$("gardenReview").hidden=true;renderShelves();
      notice("Teacher approved "+card.pack.title+". Available in Teacher's Desk and via a homework link.");
    }catch(err){notice(err.message,true);}
  });
  $("gardenDiscard").addEventListener("click",()=>{
    if(!activeDraft)return;
    if(!confirm("Discard this unapproved draft?"))return;
    G.remove(activeDraft);activeDraft=null;$("gardenReview").hidden=true;renderShelves();notice("Draft discarded.");
  });
  $("gardenCloseReview").addEventListener("click",()=>{$("gardenReview").hidden=true;activeDraft=null;});
  $("viewGrowth").addEventListener("click",showGarden);
  $("teacherLanguage").addEventListener("change",()=>populateAdventures());
  $("teacherAdventure").addEventListener("change",()=>{
    const pack=selectedPack();if(pack)$("teacherLanguage").value=pack.language;
  });
  const search=new URL(root.location.href).searchParams;
  const embedded=search.get("practicePack");
  if(embedded){
    try{
      practicePack=G.fromLink(embedded);loadedPractice=true;
      $("practiceLanguage").value=practicePack.language;
      notice("Teacher-approved practice pack opened. Scores remain on this device.");
    }catch(err){notice("Invalid homework link: "+err.message,true);}
  }
  renderShelves();
  return true;
}
root.PuenteGardenUI={init,track,selectedPack,practicePack:()=>practicePack,renderShelves,showGarden};
})(window);
