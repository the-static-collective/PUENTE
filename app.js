// PUENTE 001 — no build tools; GitHub Pages + optional isolated Supabase backend.
// Fictional aliases only. Local demo is same-device only, never cross-phone.
const $ = (id) => document.getElementById(id);
const config = window.PUENTE_CONFIG || {};
const gardenUI = window.PuenteGardenUI;
const languages = {
  es: [
    {prompt:'A sign reads “La biblioteca está cerca del parque.” Where is the library?', choices:['Near the park','Behind the school','Across the river'], correct:0, explanation:'“Cerca de” means “near.” The library is near the park.'},
    {prompt:'A villager greets you. Which is a natural Spanish way to ask “How are you?”', choices:['¿Cuántos años tienes?','¿Cómo estás?','¿Dónde vives?'], correct:1, explanation:'“¿Cómo estás?” is an informal way to ask how someone is.'},
    {prompt:'At the market someone asks “¿Cuánto cuesta?” What are they asking?', choices:['Where is it?','What time is it?','How much does it cost?'], correct:2, explanation:'“¿Cuánto cuesta?” asks for the price.'},
    {prompt:'Repair the sign: “Nosotros ___ al mercado ayer.”', choices:['vamos','fuimos','irán'], correct:1, explanation:'“Ayer” means yesterday, so “fuimos” is the past-tense choice.'},
    {prompt:'The cook says “Tengo hambre.” What do they need?', choices:['Something to eat','A new coat','A map'], correct:0, explanation:'“Tengo hambre” literally means “I have hunger” — I am hungry.'},
    {prompt:'You helped rebuild the bridge. Someone says “Gracias.” What do you reply?', choices:['Tengo frío.','¿Dónde está?','De nada.'], correct:2, explanation:'“De nada” is a standard response to “Thank you.”'}
  ],
  en: [
    {prompt:'El letrero dice “The library is near the park.” ¿Dónde está la biblioteca?', choices:['Cerca del parque','Detrás de la escuela','Al otro lado del río'], correct:0, explanation:'“Near” significa “cerca de”.'},
    {prompt:'Un vecino te saluda. ¿Cómo puedes preguntar “¿Cómo estás?” en inglés?', choices:['How old are you?','How are you?','Where do you live?'], correct:1, explanation:'“How are you?” pregunta por el bienestar de alguien.'},
    {prompt:'En el mercado alguien pregunta “How much is it?” ¿Qué quiere saber?', choices:['El lugar','La hora','El precio'], correct:2, explanation:'“How much” pregunta por la cantidad o el precio.'},
    {prompt:'Completa la oración: “Yesterday, we ___ to the market.”', choices:['go','went','will go'], correct:1, explanation:'“Yesterday” indica el pasado; “went” es el pasado de “go”.'},
    {prompt:'El cocinero dice “I am hungry.” ¿Qué necesita?', choices:['Comida','Un abrigo','Un mapa'], correct:0, explanation:'“I am hungry” significa “Tengo hambre”.'},
    {prompt:'Alguien dice “Thank you.” ¿Cuál respuesta es apropiada?', choices:['I am cold.','Where is it?','You are welcome.'], correct:2, explanation:'“You are welcome” es una respuesta habitual a “Thank you”.'}
  ]
};
let db = null;
let useLive = false;
let session = {code:'',role:'',alias:''};
let snapshot = null;
let timer = null;
let busy = false;
let practice = {language:'es',index:0,score:0,answered:false};
const normalizeCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12);
const notice = (msg, error=false) => {const n=$('appNotice'); n.textContent=msg;n.classList.toggle('error',error);};
function showScreen(name) {
  for(const id of ['teacher','student','practice','garden']) $(id+'Screen').hidden = (id!==name);
  document.querySelectorAll('.mode').forEach(b=>{const active=b.dataset.screen===name;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  if(name==='practice') renderPractice();
  const section=$(name+'Screen');
  if(section) section.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
function buildChoices(element, choices, onSelect, selected=null, correct=null, locked=false) {
  element.replaceChildren();
  (choices||[]).forEach((label,i)=>{
    const b=document.createElement('button');b.type='button';b.className='choice';b.textContent=String.fromCharCode(65+i)+'.  '+label;
    if(selected===i) b.classList.add('selected');
    if(correct!==null && correct===i) b.classList.add('correct');
    if(correct!==null && selected===i && selected!==correct) b.classList.add('incorrect');
    b.disabled = locked || !onSelect;
    if(onSelect) b.addEventListener('click',()=>onSelect(i));
    element.appendChild(b);
  });
}
function readDemo(code){try{return JSON.parse(localStorage.getItem('puente.room.'+code)||'null');}catch{return null;}}
function writeDemo(room){localStorage.setItem('puente.room.'+room.code,JSON.stringify(room));}
const demo = {
  create(language,pack=null) {
    const code='D'+crypto.getRandomValues(new Uint32Array(1))[0].toString(16).toUpperCase().padStart(8,'0').slice(0,7);
    const room={code,language,pack:pack?window.PuenteGarden.validate(pack):null,status:'lobby',step:0,players:[],submissions:[],created:Date.now()};
    writeDemo(room);return code;
  },
  join(code,alias) {
    const r=readDemo(code);
    if(!r) throw Error('Room not found on this device. For different phones, set up live mode.');
    if(Date.now()-r.created>12*3600*1000) throw Error('This room has expired.');
    if(!r.players.includes(alias)&&r.players.length>=40) throw Error('This room is full.');
    if(!r.players.includes(alias)) {r.players.push(alias);writeDemo(r);}
    return true;
  },
  advance(code) {
    const r=readDemo(code);if(!r) throw Error('Room not found.');
    if(r.status==='lobby'){r.status='question';r.step=1;}
    else if(r.status==='question')r.status='reveal';
    else if(r.status==='reveal'){const solved=r.submissions.some(s=>s.step===r.step&&s.correct);const total=r.pack?r.pack.questions.length:6;if(!solved){r.submissions=r.submissions.filter(s=>s.step!==r.step);r.status='question';}else if(r.step>=total)r.status='finished';else{r.step++;r.status='question';}}
    writeDemo(r);
  },
  answer(code,alias,choice) {
    const r=readDemo(code);if(!r||r.status!=='question')throw Error('This question is closed.');
    if(!r.players.includes(alias))throw Error('Join the room first.');
    const existing=r.submissions.find(s=>s.step===r.step&&s.alias===alias);
    if(existing)return {accepted:false};
    const q=r.pack?r.pack.questions[r.step-1]:languages[r.language][r.step-1];
    r.submissions.push({step:r.step,alias,choice,correct:choice===q.correct});
    writeDemo(r);return {accepted:true};
  },
  snapshot(code,role,alias) {
    const r=readDemo(code);if(!r)throw Error('Room not found.');
    if(Date.now()-r.created>12*3600*1000)throw Error('Room has expired.');
    if(role==='student'&&!r.players.includes(alias))throw Error('Not joined.');
    const q=r.step>0?(r.pack?r.pack.questions[r.step-1]:languages[r.language][r.step-1]):null;
    const answers=r.submissions.filter(s=>s.step===r.step);
    const mine=answers.find(s=>s.alias===alias);
    return {code:r.code,language:r.language,pack_title:r.pack?r.pack.title:'The Broken Bridge',status:r.status,step:r.step,total:r.pack?r.pack.questions.length:6,cleared:new Set(r.submissions.filter(s=>s.correct).map(s=>s.step)).size,round_correct:answers.filter(s=>s.correct).length,players:r.players.map(a=>({alias:a,score:r.submissions.filter(s=>s.alias===a&&s.correct).length})),responses:answers.length,my_choice:mine?mine.choice:null,question:q?{prompt:q.prompt,choices:q.choices,topic:q.topic||'mixed',mechanic:q.mechanic||'decode',correct_choice:['reveal','finished'].includes(r.status)?q.correct:null,explanation:['reveal','finished'].includes(r.status)?q.explanation:null}:null};
  },
  simulate(code) {
    const r=readDemo(code);if(!r) return;
    const aliases=['Blue Fox','Paper Kite','Golden Otter','Moon Lantern','Moss Rabbit'];
    let alias=r.players.find(a=>!r.submissions.some(s=>s.step===r.step&&s.alias===a));
    if(!alias){alias=aliases.find(a=>!r.players.includes(a));if(!alias)return;r.players.push(alias);}
    if(r.status==='question'&&!r.submissions.some(s=>s.step===r.step&&s.alias===alias))r.submissions.push({step:r.step,alias,choice:(r.pack?r.pack.questions[r.step-1]:languages[r.language][r.step-1]).correct,correct:true});
    writeDemo(r);
  }
};
async function connect() {
  if(!config.url || !config.publishableKey){$('connectionBadge').textContent='LOCAL DEMO';return;}
  try {
    const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.76.1/+esm');
    db=mod.createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true}});
    const {data:{session:s},error:e}=await db.auth.getSession();
    if(e) throw e;
    if(!s){const sign=await db.auth.signInAnonymously();if(sign.error)throw sign.error;}
    useLive=true;
    $('connectionBadge').textContent='LIVE CLASSROOM';
    $('connectionBadge').classList.add('live');
    $('teacherModeHelp').textContent='Live classroom connected. Students can join from separate phones using the room code.';
    $('simulatePlayer').hidden=true;
  } catch(err) {
    db=null;useLive=false;
    notice('Live connection unavailable: '+err.message+'. Local demo remains available.',true);
  }
}
async function callRpc(name,params) {
  const {data,error}=await db.rpc(name,params);
  if(error) throw Error(error.message || 'Could not reach the classroom server.');
  return data;
}
async function createRoom() {
  if(busy)return;busy=true;$('createRoom').disabled=true;
  try {
    const pack=gardenUI.selectedPack();
    const lang=pack?pack.language:$('teacherLanguage').value;
    const code=useLive?await callRpc('puente_create_room',{p_language:lang,p_pack:pack}):demo.create(lang,pack);
    session={code,role:'teacher',alias:''};snapshot=null;
    sessionStorage.setItem('puente.session',JSON.stringify(session));
    $('createPanel').hidden=true;$('teacherRoom').hidden=false;
    $('teacherCode').textContent=code;
    notice('');
    await refresh();
    beginPolling();
  }catch(err){notice(err.message,true);}
  finally{busy=false;$('createRoom').disabled=false;}
}
async function joinRoom(e) {
  e.preventDefault();if(busy)return;
  const code=normalizeCode($('joinCode').value);
  const alias=$('joinAlias').value.trim().replace(/\s+/g,' ');
  if(!/^[A-Za-z0-9 _-]{2,18}$/.test(alias)){notice('Use a fictional alias of 2–18 letters, numbers, spaces, hyphens or underscores.',true);return;}
  if(!/^[A-F0-9]{8}$/.test(code) && !/^D[A-F0-9]{7}$/.test(code)){notice('Please enter an 8-character room code.',true);return;}
  busy=true;$('joinForm').querySelector('button').disabled=true;
  try {
    if(useLive)await callRpc('puente_join_room',{p_code:code,p_alias:alias});else demo.join(code,alias);
    session={code,role:'student',alias};snapshot=null;
    sessionStorage.setItem('puente.session',JSON.stringify(session));
    $('joinForm').hidden=true;$('studentRoom').hidden=false;
    notice('');
    await refresh();beginPolling();
  }catch(err){notice(err.message,true);}
  finally{busy=false;$('joinForm').querySelector('button').disabled=false;}
}
async function advance() {
  if(busy||session.role!=='teacher')return;busy=true;$('advanceRoom').disabled=true;
  try{if(useLive)await callRpc('puente_advance_room',{p_code:session.code});else demo.advance(session.code);await refresh();}
  catch(err){notice(err.message,true);}finally{busy=false;$('advanceRoom').disabled=false;}
}
async function answer(choice) {
  if(busy||session.role!=='student'||!snapshot||snapshot.status!=='question')return;
  busy=true;
  try{if(useLive)await callRpc('puente_submit_answer',{p_code:session.code,p_choice:choice});else demo.answer(session.code,session.alias,choice);await refresh();}
  catch(err){notice(err.message,true);}finally{busy=false;}
}
async function refresh() {
  if(!session.code)return;
  try{
    const snap=useLive?await callRpc('puente_room_snapshot',{p_code:session.code}):demo.snapshot(session.code,session.role,session.alias);
    if(!snap)return;
    snapshot=snap;
    if(session.role==='teacher'){renderTeacher(snap);gardenUI.track(snap,'teacher');}
    else renderStudent(snap);
    updateBridge(snap);
  }catch(err){notice('Could not refresh the room: '+err.message,true);stopPolling();}
}
function beginPolling(){stopPolling();timer=setInterval(()=>{if(!document.hidden&&!busy)refresh();},2000);}
function stopPolling(){if(timer){clearInterval(timer);timer=null;}}
function updateBridge(s) {
  const completed=s.cleared||0;
  document.querySelectorAll('.plank').forEach((el,i)=>el.classList.toggle('built',i<completed));
}
function renderTeacher(s) {
  $('teacherCode').textContent=s.code;
  $('classGrowth').hidden=s.status!=='finished';
  $('roomState').textContent=({lobby:'WAITING FOR CLASS',question:'CHALLENGE LIVE',reveal:'ANSWER REVEALED',finished:'BRIDGE RESTORED'})[s.status]||s.status;
  $('playerCount').textContent=s.players.length+' explorer'+(s.players.length===1?'':'s');
  $('responseCount').textContent=s.responses+' / '+s.players.length+' responses';
  const completed=s.cleared||0;
  $('classProgress').style.width=(100*completed/s.total)+'%';
  $('progressText').textContent=completed+' of '+s.total+' bridge pieces restored';
  const ul=$('playerList');ul.replaceChildren();
  if(!s.players.length){const li=document.createElement('li');li.className='empty';li.textContent='No explorers yet. Share the room code.';ul.append(li);}
  s.players.forEach(p=>{const li=document.createElement('li');const label=document.createElement('span');label.textContent=p.alias;const points=document.createElement('span');points.className='score';points.textContent=p.score+' pts';li.append(label,points);ul.append(li);});
  $('roundLabel').textContent=s.status==='lobby'?'PROLOGUE':s.status==='finished'?'EPILOGUE':'CHALLENGE '+s.step+' / '+s.total;
  if(s.status==='lobby'){$('teacherPrompt').textContent='The bridge is waiting.';$('teacherHint').textContent='Invite explorers and begin when the class is ready.';}
  else if(s.status==='finished'){$('teacherPrompt').textContent='The bridge is whole again!';$('teacherHint').textContent='The village speaks. The class built this together.';}
  else{$('teacherPrompt').textContent=s.question.prompt;$('teacherHint').textContent=s.status==='reveal'?'Discuss why the answer works.':'Let everyone choose an answer, then reveal it.';}
  buildChoices($('teacherChoices'),s.question?.choices,null,null,s.status==='reveal'?s.question.correct_choice:null,true);
  $('revealBox').hidden=s.status!=='reveal';
  if(s.status==='reveal')$('revealBox').textContent=(s.round_correct>0?'BRIDGE PIECE RESTORED · ':'NOT YET RESTORED · Talk it through, then retry. ')+'WHY IT WORKS · '+s.question.explanation;
  $('advanceRoom').textContent=({lobby:'Begin adventure →',question:'Reveal answer →',reveal:s.round_correct===0?'Retry this challenge →':s.step===s.total?'Finish the bridge →':'Next challenge →',finished:'Adventure complete'})[s.status];
  $('advanceRoom').disabled=s.status==='finished';
}
function renderStudent(s) {
  $('studentRound').textContent=s.status==='lobby'?'PROLOGUE':s.status==='finished'?'EPILOGUE':'CHALLENGE '+s.step+' / '+s.total;
  $('studentStatus').textContent=({lobby:'WAITING',question:'YOUR TURN',reveal:'ANSWER',finished:'COMPLETE'})[s.status];
  const f=$('studentFeedback');
  if(s.status==='lobby'){$('studentPrompt').textContent='Waiting for the teacher to begin…';f.textContent='You are in the village, '+session.alias+'.';f.className='feedback info';}
  else if(s.status==='finished'){$('studentPrompt').textContent='The bridge is whole again!';f.textContent='Your class solved the adventure together.';f.className='feedback';}
  else {
    $('studentPrompt').textContent=s.question.prompt;
    if(s.status==='reveal'){
      const wasRight=s.my_choice===s.question.correct_choice;
      f.textContent=(s.my_choice===null?'No answer submitted.':wasRight?'Correct!':'Good try.')+' '+s.question.explanation;
      f.className='feedback '+(s.my_choice!==null&&!wasRight?'error':'');
    }else if(s.my_choice!==null){f.textContent='Answer recorded. Wait for your teacher to reveal the result.';f.className='feedback info';}
    else {f.textContent='Choose one answer. You get one attempt per challenge.';f.className='feedback info';}
  }
  const q=s.question;
  buildChoices($('studentChoices'),q?.choices,s.status==='question'&&s.my_choice===null?answer:null,s.my_choice,s.status==='reveal'?q.correct_choice:null,s.status!=='question'||s.my_choice!==null);
}
function resetSession(){
  stopPolling();sessionStorage.removeItem('puente.session');session={code:'',role:'',alias:''};snapshot=null;
  $('createPanel').hidden=false;$('teacherRoom').hidden=true;
  $('joinForm').hidden=false;$('studentRoom').hidden=true;
  document.querySelectorAll('.plank').forEach(p=>p.classList.remove('built'));
  notice('');
}
function renderPractice(){
  const custom=gardenUI.practicePack();const bank=custom&&custom.language===practice.language?custom.questions:languages[practice.language];
  $('practiceStory').textContent=custom&&custom.language===practice.language?custom.title+' — '+custom.intro:"The clockmaker's notes — independent practice";
  const done=practice.index>=5;
  $('practiceCounter').textContent=done?'QUEST COMPLETE':'QUEST '+(practice.index+1)+' / 5';
  $('practiceScore').textContent=practice.score+' correct';
  $('practiceProgress').style.width=(100*Math.min(5,practice.index+(practice.answered?1:0))/5)+'%';
  $('practiceNext').hidden=!practice.answered||done;
  $('practiceRestart').hidden=!done;
  if(done){$('practicePrompt').textContent='The clockmaker has what they need.';$('practiceChoices').replaceChildren();$('practiceFeedback').textContent='You answered '+practice.score+' of 5 correctly. Try again any time — your answers stay on this device.';return;}
  const q=bank[practice.index];$('practicePrompt').textContent=q.prompt;
  buildChoices($('practiceChoices'),q.choices,practice.answered?null:choosePractice,null,practice.answered?q.correct:null,practice.answered);
  if(!practice.answered)$('practiceFeedback').textContent='';
}
function choosePractice(i){
  if(practice.answered)return;
  const custom=gardenUI.practicePack();const bank=custom&&custom.language===practice.language?custom.questions:languages[practice.language];
  const q=bank[practice.index];
  practice.answered=true;if(i===q.correct)practice.score++;
  $('practiceFeedback').textContent=(i===q.correct?'Correct. ':'Not quite. ')+q.explanation;
  $('practiceFeedback').className='feedback '+(i===q.correct?'':'error');
  buildChoices($('practiceChoices'),q.choices,null,i,q.correct,true);
  $('practiceScore').textContent=practice.score+' correct';
  $('practiceProgress').style.width=(100*(practice.index+1)/5)+'%';
  $('practiceNext').hidden=false;
}
async function copyJoin(){
  const url=new URL(location.href);url.search='?join='+session.code;
  try{await navigator.clipboard.writeText(url.href);notice('Join link copied.');}
  catch{notice('Join link: '+url.href);}
}
function init(){
  gardenUI.init();
  document.querySelectorAll('[data-screen]').forEach(b=>b.addEventListener('click',()=>showScreen(b.dataset.screen)));
  $('goTeacher').addEventListener('click',()=>showScreen('teacher'));
  $('goStudent').addEventListener('click',()=>showScreen('student'));
  $('createRoom').addEventListener('click',createRoom);
  $('joinForm').addEventListener('submit',joinRoom);
  $('advanceRoom').addEventListener('click',advance);
  $('copyJoin').addEventListener('click',copyJoin);
  $('leaveTeacher').addEventListener('click',resetSession);
  $('leaveStudent').addEventListener('click',resetSession);
  $('simulatePlayer').addEventListener('click',async()=>{if(useLive)return;demo.simulate(session.code);await refresh();});
  $('practiceLanguage').addEventListener('change',()=>{practice={language:$('practiceLanguage').value,index:0,score:0,answered:false};renderPractice();});
  $('practiceNext').addEventListener('click',()=>{practice.index++;practice.answered=false;renderPractice();});
  $('practiceRestart').addEventListener('click',()=>{practice={language:$('practiceLanguage').value,index:0,score:0,answered:false};renderPractice();});
  window.addEventListener('storage',e=>{if(session.code&&e.key==='puente.room.'+session.code&&!useLive)refresh();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&session.code)refresh();});
  const url=new URL(location.href),join=url.searchParams.get('join');
  if(join){$('joinCode').value=normalizeCode(join);showScreen('student');}
  else if(url.searchParams.has('homework')||url.searchParams.has('practicePack'))showScreen('practice');
  practice.language=$('practiceLanguage').value;
  renderPractice();
  connect().then(async()=>{
    try {
      const saved=JSON.parse(sessionStorage.getItem('puente.session')||'null');
      if(saved&&saved.code&&['teacher','student'].includes(saved.role)){
        session=saved;
        if(saved.role==='teacher'){$('createPanel').hidden=true;$('teacherRoom').hidden=false;showScreen('teacher');}
        else {$('joinForm').hidden=true;$('studentRoom').hidden=false;showScreen('student');}
        await refresh();if(session.code)beginPolling();
      }
    }catch{sessionStorage.removeItem('puente.session');}
  });
}
init();