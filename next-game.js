/* PUENTE Village Assembly — voluntary, anonymous-to-class *aggregate* votes.
   No open student text, no names in the growth receipt, no automatic publishing.
   Multiple-choice proposals are suggestions, not proof of teaching quality. */
(function(root){
"use strict";
const WORLDS=[{key:"market",name:"Midnight Marketplace",description:"Trade words to reopen the shops."},{key:"signal",name:"Signal Station",description:"Rescue an old radio tower."},{key:"mystery",name:"Missing Words Mystery",description:"Hunt for clues in the village."}];
const MODES=[{key:"signal",name:"Signal Tuner",description:"Tune and decode a radio signal."},{key:"map",name:"Map Navigator",description:"Choose routes through the village."},{key:"forge",name:"Word Weave",description:"Rotate three word tiles into a sentence."}];
const preference=new Map();
const make=(tag,cls,text)=>{const d=document.createElement(tag);if(cls)d.className=cls;if(text!==undefined)d.textContent=text;return d;};
const choose=(counts)=>(Array.isArray(counts)&&counts.some(n=>Number(n)>0))?counts.reduce((best,val,i)=>val>counts[best]?i:best,0):null;
function winner(counts){
 const w=choose(counts?.world),m=choose(counts?.mode);
 return {world:w===null?null:WORLDS[w]?.key||null,mode:m===null?null:MODES[m]?.key||null,
   worldVotes:(counts?.world||[]).reduce((a,b)=>a+Number(b||0),0),
   modeVotes:(counts?.mode||[]).reduce((a,b)=>a+Number(b||0),0)};
}
function display(el,s,onCast){
  if(!s||!s.design_enabled||!s.cleared||s.cleared<3){el.hidden=true;return;}
  el.hidden=false;el.replaceChildren();
  el.append(make("p","eyebrow","UNLOCKED · THE VILLAGE ASSEMBLY"));
  el.append(make("h3","","Help design the next adventure"));
  const canVote=s.status!=="finished"&&s.status!=="lobby"&&typeof onCast==="function";
  const voteKey=s.code;
  if(!preference.has(voteKey))preference.set(voteKey,{world:null,mode:null});
  const state=preference.get(voteKey);
  if(s.my_design && state.world===null && state.mode===null) {
    state.world=s.my_design.world;state.mode=s.my_design.mode;
  }
  const msg=make("p","help",canVote?"Choose what should happen next. Optional: you can skip or change your vote until this adventure ends.":"This chapter is finished. The teacher will review the next quest.");
  el.append(msg);
  for(const [label,data,key] of [["Where should we go?",WORLDS,"world"],["What kind of game?",MODES,"mode"]]){
    const group=make("fieldset","assembly-group");
    group.append(make("legend","assembly-legend",label));
    data.forEach((o,i)=>{
      const b=make("button","assembly-choice"+(state[key]===i?" active":""),o.name+" · "+o.description);
      b.type="button";b.disabled=!canVote;
      b.setAttribute("aria-pressed",String(state[key]===i));
      b.addEventListener("click",()=>{state[key]=i;display(el,s,onCast);});
      group.append(b);
    });el.append(group);
  }
  const action=make("button","btn primary","Submit my game idea →");action.type="button";
  action.disabled=!canVote||state.world===null||state.mode===null;
  action.addEventListener("click",async()=>{
    action.disabled=true;
    try {await onCast(state.world,state.mode);msg.textContent="Idea recorded. Your teacher will see totals, not who chose what.";}
    catch(err){msg.textContent="Could not record this vote: "+(err.message||"network error");action.disabled=false;}
  });
  if(canVote)el.append(action);
  if(s.my_design)el.append(make("p","help","Saved choice: "+WORLDS[s.my_design.world]?.name+" + "+MODES[s.my_design.mode]?.name+". You may revise until the class finishes."));
}
function teacher(el,s){
  if(!s||!s.design_enabled){el.hidden=true;return;}
  el.hidden=false;el.replaceChildren();
  el.append(make("p","eyebrow","THE CLASS CHOOSES THE NEXT WORLD"));
  el.append(make("h3","","Village Assembly results"));
  if(s.cleared<3){el.append(make("p","help","The class unlocks this optional vote when it restores 3 bridge pieces."));return;}
  const counts=s.design_counts||{world:[0,0,0],mode:[0,0,0]};
  const w=winner(counts);
  el.append(make("p","help",w.worldVotes?"Votes are suggestions for the next teacher-reviewed draft. No names or individual answers are included.":"No class votes yet. PUENTE will grow an exploratory draft after the final challenge."));
  for(const [title,values,data] of [["Next world",counts.world,WORLDS],["New game mechanic",counts.mode,MODES]]){
    const group=make("section","assembly-results");
    group.append(make("h4","",title));
    data.forEach((o,i)=>{
      const tally=Number(values?.[i]||0),line=make("div","assembly-result");
      line.append(make("span","",o.name),make("strong","",String(tally)+" vote"+(tally===1?"":"s")));
      group.append(line);
    });
    el.append(group);
  }
}
root.PuenteAssembly={WORLDS,MODES,winner,display,teacher};
})(window);
