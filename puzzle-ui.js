/* PUENTE Puzzle Workshop — tactile grid editor, route playtest, teacher handoff.
   Students submit only fixed-code maps; no student free text or backend writes. */
(function(root){
"use strict";
const P=root.PuentePuzzle;
const $=id=>document.getElementById(id);
const STORAGE="puente.puzzle.library.v1",MAX_SHELF=18;
let board=P.sample("es"),mode="build",brush="#",undo=[],redo=[],run=null;
let review=false,approvedView=false,passedHash="",currentLink="",lastStatus="";
const el=(tag,cls,text)=>{
  const e=document.createElement(tag);
  if(cls)e.className=cls;
  if(text!==undefined)e.textContent=text;
  return e;
};
const status=(message,error=false)=>{
  lastStatus=message;
  const e=$("puzzleStatus");e.textContent=message;e.classList.toggle("error",error);
};
const labelTile=(t)=>{
  if(t==="#")return ["▦","Stone wall"];
  if(t==="S")return ["◉","Start"];
  if(t==="E")return ["⚑","Exit"];
  if(t==="P")return ["A","Portal A"];
  if(t==="Q")return ["B","Portal B"];
  if(t==="X")return ["◈","Signal fragment A"];
  if(t==="Y")return ["◈","Signal fragment B"];
  if(P.isGate(t))return ["◆","Language lock "+(t.charCodeAt(0)-96)];
  return ["·","Clear floor"];
};
function loadShelf(){
  try{
    const d=JSON.parse(localStorage.getItem(STORAGE)||"null");
    if(!d||d.schema!=="puente.puzzle-library/v1"||!Array.isArray(d.items))return [];
    return d.items.filter(x=>x&&typeof x==="object").slice(-MAX_SHELF);
  }catch{return [];}
}
function writeShelf(items){
  if(items.length>MAX_SHELF)throw Error("Workshop shelf full. Remove or export a puzzle first.");
  localStorage.setItem(STORAGE,JSON.stringify({schema:"puente.puzzle-library/v1",items}));
}
function shelfSave(type,pack){
  const p=P.validate(pack),items=loadShelf(),id=P.hash(p),now=Date.now();
  const old=items.findIndex(x=>x.id===id);
  if(old>=0&&items[old].type==="approved"&&type==="draft")return id;
  if(old>=0)items.splice(old,1);
  items.push({id,type,pack:p,at:now});
  writeShelf(items);renderShelf();return id;
}
function renderShelf(){
  const list=$("puzzleShelf"),items=loadShelf();
  $("puzzleShelfCount").textContent=items.length+" saved";
  list.replaceChildren();
  if(!items.length){list.append(el("p","help","No saved levels yet. Build one, test it, and save a draft."));return;}
  for(const item of items.slice().reverse()){
    let pack;try{pack=P.validate(item.pack);}catch{continue;}
    const card=el("article","puzzle-shelf-card");
    card.append(el("strong","",P.THEMES[pack.theme].name+" · "+(pack.language==="es"?"Spanish":"English")),
      el("small","",(item.type==="approved"?"Teacher-distributed level":"Unapproved draft")+" · #"+item.id+" · generation "+pack.generation));
    const actions=el("div","action-row");
    const make=(label,cb)=>{
      const b=el("button","btn outlined small",label);
      b.type="button";b.addEventListener("click",cb);return b;
    };
    actions.append(make(item.type==="approved"?"Play":"Edit",()=>{
      board=P.clone(pack);review=false;approvedView=item.type==="approved";
      if(item.type==="approved"){startRun("play");}
      else {mode="build";run=null;undo=[];redo=[];passedHash="";render();status("Draft loaded. Edit or test your level.");}
    }));
    actions.append(make("Share",()=>{
      try{makeLink(item.type==="approved"?"puzzle":"puzzleDraft",pack);status("The "+(item.type==="approved"?"player":"teacher handoff")+" link is ready below.");}
      catch(err){status(err.message,true);}
    }));
    actions.append(make("Remove",()=>{
      if(!confirm("Remove this saved level from this browser? Shared links already sent elsewhere will continue to work."))return;
      writeShelf(loadShelf().filter(x=>x.id!==item.id));renderShelf();
    }));
    card.append(actions);list.append(card);
  }
}
function updateClues(){
  const select=$("puzzleClue"),prev=select.value;
  select.replaceChildren();
  const basic=document.createElement("optgroup");basic.label="FOUNDATIONS · A–J";
  const advanced=document.createElement("optgroup");advanced.label="ADVANCED · K–T";
  P.PHRASES[board.language].forEach((q,i)=>{
    const o=document.createElement("option");o.value=String(i);
    o.textContent=(i>=10?"ADV ":"BASIC ")+(i+1)+". "+q[0];
    (i<10?basic:advanced).append(o);
  });
  select.append(basic,advanced);
  if([...select.options].some(o=>o.value===prev))select.value=prev;
}
function showTool(tool){
  brush=tool;
  document.querySelectorAll("#puzzleTools [data-tool]").forEach(b=>{
    const active=b.dataset.tool===brush;b.classList.toggle("active",active);
    b.setAttribute("aria-pressed",String(active));
  });
}
function invalidateLink(){
  currentLink="";$("puzzleLink").value="";
  $("puzzleLinkLabel").textContent="This map changed. Make a fresh handoff link after testing.";
}
function change(pack,message){
  const next=P.canonical(pack);
  if(JSON.stringify(next)===JSON.stringify(board))return;
  undo.push(P.clone(board));if(undo.length>50)undo.shift();
  redo=[];board=next;passedHash="";invalidateLink();render();
  status(message||"Map updated. Test it before sharing.");
}
function paint(i){
  if(mode!=="build")return;
  try{const next=P.place(board,i,brush,{gate:Number($("puzzleClue").value)});change(next,"Placed "+labelTile(next.tiles[i])[1]+".");}
  catch(err){status(err.message,true);}
}
function gridCell(t,i){
  const cell=el("button","puzzle-cell");
  cell.type="button";cell.dataset.cell=String(i);cell.dataset.tile=t;
  const [symbol,name]=labelTile(t);cell.textContent=symbol;
  if(P.isGate(t))cell.classList.add("is-lock");
  const {x,y}=P.xy(i),here=run&&run.pos===i;
  if(here&&mode!=="build"){cell.textContent="●";cell.classList.add("player");}
  if(run?.unlocked.includes(i))cell.classList.add("solved");
  if(P.isFragment(t)&&run?.collected.includes(t)){cell.classList.add("collected");if(!here)cell.textContent="✓";}
  cell.setAttribute("aria-label","Row "+(y+1)+", column "+(x+1)+": "+name+(here?" — explorer here":""));
  if(mode==="build"){cell.addEventListener("click",()=>paint(i));
    cell.addEventListener("pointerenter",e=>{if(e.buttons===1&&(brush==="#"||brush==="."))paint(i);});
  }else cell.disabled=true;
  return cell;
}
function renderGrid(){
  const grid=$("puzzleGrid");grid.replaceChildren();
  [...board.tiles].forEach((t,i)=>grid.append(gridCell(t,i)));
  const theme=board.theme;
  grid.dataset.theme=theme;grid.dataset.mode=mode;
  $("puzzleMapId").textContent="#"+P.hash(board)+" · GEN "+board.generation;
}
function renderMode(){
  const testing=mode==="test"||mode==="play";
  $("puzzleEditorPanel").hidden=testing||mode==="review";
  $("puzzlePlayPanel").hidden=!testing;
  $("puzzleMoveControls").hidden=!testing||(run?.pending!==null&&run?.pending!==undefined)||Boolean(run?.won);
  $("puzzleLockPanel").hidden=!testing||(run?.pending===null||run?.pending===undefined);
  $("puzzleVictory").hidden=!testing||!run?.won;
  $("puzzleState").textContent=({build:"BUILD MODE",review:"TEACHER REVIEW",test:"TEST CHAMBER",play:"PLAYING LEVEL"})[mode];
  $("puzzleBoardLabel").textContent=testing?"YOUR ROUTE · USE ARROWS":mode==="review"?"TEACHER MAP INSPECTION":"MAP EDITOR · 8 × 6";
  if(testing){
    $("puzzlePlayTitle").textContent=P.THEMES[board.theme].name;
    $("puzzleMoves").textContent=run.moves+" steps";
    $("puzzleUnlocked").textContent=run.unlocked.length+" locks opened";
    $("puzzleMistakes").textContent=run.mistakes+" error"+(run.mistakes===1?"":"s");
    $("puzzleBackToEdit").textContent=review?"← Teacher review":"← Return to editor";
    $("puzzleBackToEdit").hidden=mode==="play"&&!review;
    $("puzzleVictoryStats").textContent=run.won?(
      (isHeist()?"Fragments secured. ":"")+"Solved in "+run.moves+" steps · "+run.mistakes+" mistake"+(run.mistakes===1?"":"s")+
      " · "+run.unlocked.length+" grammar locks. The theoretical shortest route is "+P.shortestRoute(board)+" moves."
    ):"";
    $("puzzleVictoryTitle").textContent=run.won?(isHeist()?rank(run):"You made it across!"):"You made it across!";
    $("puzzleBestRun").textContent=run.won?bestRunText(run):"";
    $("puzzlePlayBrief").textContent=isHeist()
      ?"Intercepted transmission. Recover BOTH signal fragments, breach the grammar locks and escape. Purple portals can shorten the route—or send you backward. No timer; think through the map."
      :"Find the exit. Use the arrow buttons or keyboard. Word locks ask language questions. Purple portals move you across the map.";
  }
  const hasFragments=isHeist();
  $("puzzleObjective").hidden=!testing||!hasFragments;
  if(hasFragments&&testing){
    const a=run.collected.includes("X"),b=run.collected.includes("Y");
    $("puzzleFragmentA").classList.toggle("secured",a);
    $("puzzleFragmentB").classList.toggle("secured",b);
    $("puzzleFragmentA").textContent=(a?"◆":"◇")+" SIGNAL A";
    $("puzzleFragmentB").textContent=(b?"◆":"◇")+" SIGNAL B";
    $("puzzleExtraction").textContent=a&&b?"EXTRACTION OPEN":"EXTRACTION SEALED";
    $("puzzleExtraction").classList.toggle("secured",a&&b);
  }
  renderReview();
}
function isHeist(){return board.tiles.includes(P.FRAGMENT_A)&&board.tiles.includes(P.FRAGMENT_B);}
function rank(r){
 const slack=r.moves-P.shortestRoute(r.pack);
 if(r.mistakes===0&&slack<=2)return "GHOST RUN · SIGNAL SECURED";
 if(r.mistakes<=1&&slack<=6)return "CLEAN EXTRACTION";
 return "MISSION COMPLETE · SIGNAL SECURED";
}
function bestRunText(r){
 const key="puente.puzzle.best."+P.hash(r.pack),record={moves:r.moves,mistakes:r.mistakes},label=n=>n===1?"error":"errors";
 try{
   const old=JSON.parse(localStorage.getItem(key)||"null");
   if(!old||r.mistakes<old.mistakes||(r.mistakes===old.mistakes&&r.moves<old.moves))localStorage.setItem(key,JSON.stringify(record));
   const best=JSON.parse(localStorage.getItem(key));
   return "PERSONAL BEST · "+best.moves+" moves · "+best.mistakes+" "+label(best.mistakes)+" · Saved only on this device.";
 }catch{return "Try another route to beat your own score. No account or leaderboard required.";}
}
function renderReview(){
  const panel=$("puzzleTeacherReview");panel.hidden=!review;
  if(!review)return;
  const list=$("puzzleReviewLocks");list.replaceChildren();
  [...board.tiles].forEach((t,i)=>{
    if(!P.isGate(t))return;
    const q=P.question(board,i),coord=P.xy(i);
    const row=el("article","puzzle-review-item");
    row.append(el("strong","", "Lock · row "+(coord.y+1)+", column "+(coord.x+1)),
      el("p","",q.prompt),el("p","",q.choices.map((x,j)=>"ABC"[j]+". "+x).join(" · ")),
      el("p","puzzle-answer","Correct: "+q.choices[q.correct]+". "+q.explanation));
    list.append(row);
  });
  const didTest=passedHash===P.hash(board);
  $("puzzleReviewHelp").textContent=didTest?"Playtest completed. Confirm the checklist to create a classroom link.":"Teacher playtest required. Use Test my puzzle, reach the exit, then confirm the checklist.";
  $("puzzleApprove").disabled=!didTest||!$("puzzleReviewChecked").checked;
}
function render(){
  $("puzzleLanguage").value=board.language;$("puzzleTheme").value=board.theme;
  renderGrid();renderMode();
  $("puzzleUndo").disabled=!undo.length;$("puzzleRedo").disabled=!redo.length;
  if(!["test","play"].includes(mode))updateClues();
}
function startRun(kind="test"){
  try{
    board=P.validate(board);
    run=P.newRun(board);mode=kind;render();
    status(isHeist()
      ?"OPERATION SIGNAL HEIST · Two fragments. Three mandatory grammar locks. The exit stays sealed until you recover both."
      :kind==="play"?"Find the exit. Solve language locks to open a route.":"Playtest started. Solve the entire level to prove it works.");
  }catch(err){status("Not ready to play: "+err.message,true);}
}
function handleMove(dx,dy){
  if(!run||!["test","play"].includes(mode))return;
  try{
    const result=P.move(run,dx,dy);
    if(result.type==="wall")status("A wall blocks this route. Try another direction.");
    else if(result.type==="question")status("A word lock blocks your path. Decode it to enter.");
    else if(result.type==="portal")status("PORTAL JUMP · You're on the other side of the map.");
    else if(result.type==="fragment")status("SIGNAL "+result.fragment+" SECURED · "+result.remaining.length+" fragment"+(result.remaining.length===1?"":"s")+" remaining. Find extraction.");
    else if(result.type==="sealed")status("EXTRACTION SEALED · Missing "+result.missing.join(" + ")+". Search the side routes before returning.",true);
    else if(result.type==="move")status(isHeist()?"Decode the perimeter, collect both signals and reach extraction.":"Keep exploring. Find the exit.");
    else if(result.type==="win"){status(isHeist()?"SIGNAL RECOVERED · Mission complete. Can you beat your route?":"Level solved! Your design has been playtested.");onWin();}
    render();
    if(result.type==="question")renderLock();
  }catch(err){status(err.message,true);}
}
// Cipher inputs are ephemeral: the typed string is compared locally, never
// stored, transmitted, or included in the teacher handoff packet.
function normalizeCipher(value){
  return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLocaleLowerCase().trim().replace(/\s+/g," ").replace(/[.!?]+$/g,"");
}
function renderLock(){
  const panel=$("puzzleLockPanel"),q=run?.pending===null?null:P.question(board,run.pending);
  if(!q){panel.hidden=true;return;}
  panel.hidden=false;$("puzzleLockPrompt").textContent=q.prompt;
  const choices=$("puzzleLockChoices");choices.replaceChildren();
  const isCipher=q.prompt.includes("___")&&q.code&&q.code>="k";
  $("puzzleLockMode").textContent=isCipher?"CIPHER GATE / TYPE THE MISSING PHRASE":"LANGUAGE LOCK / DECODE THE MESSAGE";
  if(isCipher){
    const form=el("form","cipher-form");
    const input=el("input","cipher-entry");
    input.type="text";input.required=true;input.maxLength=70;input.autocomplete="off";
    input.autocapitalize="off";input.spellcheck=false;
    input.setAttribute("aria-label","Enter the missing phrase to complete the sentence");
    input.placeholder=board.language==="es"?"Escribe la frase…":"Complete the phrase…";
    const send=el("button","btn primary cipher-submit","DECRYPT SIGNAL →");send.type="submit";
    const hint=el("button","btn outlined cipher-hint","Need a hint?");hint.type="button";
    const clue=el("p","help","");
    hint.addEventListener("click",()=>{
      const answer=q.choices[q.correct];
      clue.textContent="Word initials: "+answer.trim().split(/\s+/).map(w=>w[0].toUpperCase()).join(" · ")+" · You can omit written accents.";
      hint.hidden=true;
    });
    form.addEventListener("submit",e=>{
      e.preventDefault();
      if(!input.value.trim())return;
      const right=normalizeCipher(input.value)===normalizeCipher(q.choices[q.correct]);
      answerLock(right?q.correct:(q.correct+1)%3);
      if(!right){input.focus();input.select();}
    });
    form.append(input,send,hint,clue);choices.append(form);
    input.focus({preventScroll:true});
  }else{
    q.choices.forEach((text,i)=>{
      const b=el("button","choice","ABC"[i]+".  "+text);b.type="button";
      b.addEventListener("click",()=>answerLock(i));choices.append(b);
    });
  }
}
function answerLock(i){
  if(!run?.pending&&run?.pending!==0)return;
  try{
    const result=P.solve(run,i);
    if(result.type==="retry"){
      $("puzzleLockFeedback").textContent=result.message;
      $("puzzleMistakes").textContent=run.mistakes+" error"+(run.mistakes===1?"":"s");
      status("INTERCEPTION ERROR +1 · Re-read the clue, compare the verb forms, and try again.",true);
      return;
    }
    $("puzzleLockFeedback").textContent="";
    status(result.type==="win"?"Level solved!":"Word lock opened. "+result.explanation);
    if(result.type==="win")onWin();
    render();
  }catch(err){status(err.message,true);}
}
function onWin(){
  if(mode==="test"&&review){passedHash=P.hash(board);$("puzzleReviewChecked").checked=false;}
  if(mode==="test"&&!review){passedHash=P.hash(board);}
}
function returnFromTest(){
  mode=review?"review":"build";run=null;render();
  status(review?(passedHash===P.hash(board)?"Playtest successful. Review the language clues below.":"Finish the level before approving."):"Back in the editor. Adjust and test again.");
}
function moveHistory(source,dest,message){
  if(!source.length)return;
  dest.push(P.clone(board));board=source.pop();passedHash="";invalidateLink();render();status(message);
}
function makeLink(kind,pack=board){
  const data=P.encode(pack),url=new URL(root.location.href);
  url.search="";url.hash="";url.searchParams.set(kind,data);
  currentLink=url.href;
  $("puzzleLink").value=currentLink;
  $("puzzleLinkLabel").textContent=kind==="puzzle"?
    "Classroom player link ready. Share it only after adult review.":
    "Unapproved builder handoff ready. Send this link to the teacher for inspection.";
  return currentLink;
}
function linkAction(kind){
  try{
    if(kind==="puzzle"&&passedHash!==P.hash(board))throw Error("Complete the playtest before creating a player link.");
    makeLink(kind);
    status(kind==="puzzle"?"Player link created. An adult should distribute it.":"Draft link created. Send it to the teacher; no student account needed.");
  }catch(err){status(err.message,true);}
}
function approve(){
  if(!review)return;
  if(passedHash!==P.hash(board)||!$("puzzleReviewChecked").checked){status("Playtest the current map and confirm teacher review first.",true);return;}
  try{
    shelfSave("approved",board);makeLink("puzzle");
    status("Approved in this browser. Copy the player link and give it to classmates.");
    review=false;approvedView=true;mode="build";run=null;render();
  }catch(err){status(err.message,true);}
}
function remix(){
  try{
    board=P.remix(board);run=null;mode="build";review=false;approvedView=false;
    passedHash="";undo=[];redo=[];$("puzzleReviewChecked").checked=false;invalidateLink();render();
    status("Remix started: this branch remembers its parent puzzle #"+board.parent+". Add a new route or word lock!");
  }catch(err){status(err.message,true);}
}
function startHeist(language="es"){
  board=P.heist(language);run=null;mode="play";review=false;approvedView=false;
  undo=[];redo=[];passedHash="";invalidateLink();
  startRun("play");
}
function startDemo(){
  board=P.sample("es");run=null;mode="play";review=false;approvedView=false;
  undo=[];redo=[];passedHash="";invalidateLink();
  startRun("play");
  status("Your one-minute mission: move RIGHT twice, decode the word lock, then follow the path to the EXIT. Try the purple portals too!");
}
function openBuilder(){
  // Retain whatever level has been edited, including a finished demo level.
  if(mode==="build")return;
  run=null;mode="build";review=false;approvedView=false;
  passedHash="";invalidateLink();render();
  status("Build mode: tap Wall, Path or Word Lock, then tap tiles. Test your route when ready.");
}
function shelfOpenLink(){
  if(!currentLink){status("Generate a handoff or player link first.",true);return;}
  root.open(currentLink,"_blank","noopener,noreferrer");
}
function init(){
  if(!P)throw Error("PUENTE puzzle engine missing.");
  document.querySelectorAll("#puzzleTools [data-tool]").forEach(button=>button.addEventListener("click",()=>showTool(button.dataset.tool)));
  $("puzzleLanguage").addEventListener("change",()=>{
    change({...board,language:$("puzzleLanguage").value},"Language changed. The same clue codes now use the selected language.");
  });
  $("puzzleTheme").addEventListener("change",()=>change({...board,theme:$("puzzleTheme").value},"Story setting changed."));
  $("puzzleUndo").addEventListener("click",()=>moveHistory(undo,redo,"Undid a map change."));
  $("puzzleRedo").addEventListener("click",()=>moveHistory(redo,undo,"Restored a map change."));
  $("puzzleExample").addEventListener("click",()=>{
    change(P.sample(board.language),"Example loaded. This maze has a required language lock and a local portal pair.");
  });
  $("puzzleBlank").addEventListener("click",()=>{
    if(!confirm("Start a blank map? Use Undo to restore the current design."))return;
    change(P.empty({language:board.language,theme:board.theme}),"Blank map. Place a start, exit, and word lock.");
  });
  $("puzzleWarmup").addEventListener("click",startDemo);
  $("puzzleHeist").addEventListener("click",()=>startHeist($("puzzleLanguage").value));
  $("puzzleTest").addEventListener("click",()=>startRun("test"));
  $("puzzleSave").addEventListener("click",()=>{
    try{shelfSave("draft",board);status("Saved unapproved draft on this browser. Export the link to preserve it elsewhere.");}
    catch(err){status("Save rejected: "+err.message,true);}
  });
  $("puzzleSubmit").addEventListener("click",()=>linkAction("puzzleDraft"));
  $("puzzleBackToEdit").addEventListener("click",returnFromTest);
  $("puzzleResetPlay").addEventListener("click",()=>startRun(mode));
  $("puzzleReplay").addEventListener("click",()=>startRun(mode));
  $("puzzleRemix").addEventListener("click",remix);
  $("puzzleReviewTest").addEventListener("click",()=>startRun("test"));
  $("puzzleReviewChecked").addEventListener("change",renderReview);
  $("puzzleApprove").addEventListener("click",approve);
  $("puzzleCopy").addEventListener("click",async()=>{
    const link=$("puzzleLink").value;
    if(!link){status("Create a shareable link first.",true);return;}
    try{await navigator.clipboard.writeText(link);status("Link copied. Paste into a message to share.");}
    catch{status("Clipboard access unavailable. Select and copy the link from the box.");$("puzzleLink").select();}
  });
  $("puzzleOpen").addEventListener("click",shelfOpenLink);
  document.querySelectorAll("[data-move]").forEach(button=>button.addEventListener("click",()=>{
    const [dx,dy]=button.dataset.move.split(",").map(Number);handleMove(dx,dy);
  }));
  document.addEventListener("keydown",e=>{
    if($("workshopScreen").hidden||!["play","test"].includes(mode))return;
    if(["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName))return;
    const controls={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],a:[-1,0],s:[0,1],d:[1,0]};
    const pair=controls[e.key];if(!pair)return;e.preventDefault();handleMove(...pair);
  });
  const params=new URL(root.location.href).searchParams;
  const draft=params.get("puzzleDraft"),player=params.get("puzzle");
  if(params.has("try")&&!draft&&!player)startDemo();
  if(params.has("heist")&&!draft&&!player)startHeist();
  if(draft||player){
    try{
      board=P.decode(draft||player);
      if(draft){review=true;mode="review";status("Teacher handoff received. Review the clues, then playtest the map.");}
      else {approvedView=true;startRun("play");}
    }catch(err){board=P.sample("es");mode="build";status("Invalid puzzle link: "+err.message,true);}
  }
  showTool(brush);renderShelf();render();
  // Page navigation to the workshop is handled by the main app after its tabs bind.
}
root.PuentePuzzleUI={init,remix,startDemo,startHeist,openBuilder};
})(window);
