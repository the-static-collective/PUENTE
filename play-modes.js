/* PUENTE — distinct input mechanics in a shared 3-answer contract.
   The classroom server validates answer indices. This module does not decide
   whether a submitted answer is correct or modify room state. */
(function(root){
  "use strict";
  const state=new Map();
  const node=(tag,cls,content)=>{
    const el=document.createElement(tag);if(cls)el.className=cls;
    if(content!==undefined)el.textContent=content;
    return el;
  };
  const btn=(label,handler,cls="")=>{
    const el=node("button","mini-btn "+cls,label);el.type="button";
    el.addEventListener("click",handler);return el;
  };
  const view={
    signal:"Signal Tuner · Decode the transmission",
    map:"Map Navigator · Choose the destination",
    forge:"Word Weave · Rotate the sentence"
  };
  function render(target,q,{key="",answer=()=>{},mine=null,correct=null,locked=false}={}){
    if(!q||!Array.isArray(q.choices)||q.choices.length!==3)return false;
    const wordWeave=root.PuenteGameLab?.isWordWeave(q)===true;
    const kind=wordWeave?"forge":q.mechanic==="decode"?"signal":q.mechanic==="trade"?"map":null;
    if(!kind)return false;
    const choices=q.choices;
    target.replaceChildren();target.className="choices mini-game "+kind;
    const label=node("p","mini-head",view[kind]);target.append(label);
    const choiceKey=key+"|"+q.prompt.slice(0,120);
    if(!state.has(choiceKey))state.set(choiceKey,0);
    let chosen=mine===null?state.get(choiceKey):mine;
    chosen=(Number.isInteger(chosen)&&chosen>=0&&chosen<=2)?chosen:0;
    const active=!(locked||mine!==null);
    const badge=node("p","mini-feedback","");
    badge.setAttribute("aria-live","polite");
    const annotate=()=>{
      if(mine!==null)badge.textContent="Answer submitted. Wait for the teacher's reveal.";
      else badge.textContent="Pick your response, then confirm it.";
      if(correct!==null){
        badge.textContent="Correct response: "+choices[correct];
        badge.classList.add("correct");
      }
    };
    function select(i){if(!active)return;chosen=i;state.set(choiceKey,i);sync();}
    let sync=()=>{};
    if(kind==="signal"){
      const console=node("section","signal-console");
      const display=node("div","signal-display");
      const freq=node("span","signal-frequency");
      const value=node("p","signal-message");
      const dials=node("div","signal-dials");
      const left=btn("◀ Tune down",()=>select((chosen+2)%3));
      const right=btn("Tune up ▶",()=>select((chosen+1)%3));
      const transmit=btn("Transmit answer →",()=>answer(chosen),"mini-confirm");
      display.append(node("span","mini-caption","CHANNEL / TRANSMISSION"),freq,value);
      dials.append(left,right);
      console.append(display,dials,transmit);
      target.append(console);
      sync=()=>{
        freq.textContent=["88.1 FM","93.7 FM","107.3 FM"][chosen];
        value.textContent=choices[chosen];
        left.disabled=!active;right.disabled=!active;transmit.disabled=!active;
        transmit.textContent=active?"Transmit answer →":"Transmission sent";
      };
    }else if(kind==="map"){
      const map=node("div","map-console");
      const sky=node("div","map-sky","THE VILLAGE IS WAITING");
      const road=node("div","map-road");
      const destinations=node("div","map-destinations");
      const buttons=choices.map((choice,i)=>{
        const b=btn(["A · ","B · ","C · "][i]+choice,()=>answer(i),"map-pin");
        b.disabled=!active;
        if(mine===i)b.classList.add("chosen");
        if(correct===i)b.classList.add("right-route");
        destinations.append(b);return b;
      });
      road.setAttribute("aria-hidden","true");
      map.append(sky,road,destinations);
      target.append(map);
      sync=()=>{buttons.forEach(b=>b.disabled=!active);};
    }else{
      const forge=node("div","forge-console");
      const tiles=node("div","forge-tiles");
      const assembled=node("p","forge-sentence");
      const controls=node("div","action-row");
      const rotate=btn("↻ Rotate words",()=>select((chosen+1)%3));
      const submit=btn("Lock sentence →",()=>answer(chosen),"mini-confirm");
      const wordTokens=choices[0].split(/ +/);
      for(const token of wordTokens)tiles.append(node("span","forge-tile",token));
      controls.append(rotate,submit);
      forge.append(node("p","mini-caption","WORD FORGE / BUILD A SENTENCE"),tiles,assembled,controls);
      target.append(forge);
      sync=()=>{
        const turned=wordTokens.slice(chosen).concat(wordTokens.slice(0,chosen));
        tiles.replaceChildren();
        turned.forEach(w=>tiles.append(node("span","forge-tile",w)));
        assembled.textContent=choices[chosen];
        rotate.disabled=!active;submit.disabled=!active;
        submit.textContent=active?"Lock sentence →":"Sentence locked";
      };
    }
    target.append(badge);
    sync();annotate();
    return true;
  }
  root.PuentePlayModes={render,view};
})(window);
