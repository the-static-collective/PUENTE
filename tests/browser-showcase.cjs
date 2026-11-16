/* Reproducible public showcase smoke test: headless Chromium, two viewports.
   No Supabase credentials, no classroom data, no calls to a live school backend. */
"use strict";
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const http=require("node:http");
const root=path.resolve(__dirname,"..");
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".svg":"image/svg+xml"};
const server=http.createServer((req,res)=>{
  const filename=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const p=path.resolve(root,"."+ (filename==="/"?"/index.html":filename));
  if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(p,(err,contents)=>{
    if(err){res.writeHead(404).end();return;}
    res.writeHead(200,{"content-type":mime[path.extname(p)]||"application/octet-stream","cache-control":"no-store"});
    res.end(contents);
  });
});
const A=async(button,n=1)=>{for(let i=0;i<n;i++)await button.click();};
async function main(){
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const base="http://127.0.0.1:"+server.address().port;
  const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  const errors=[];
  async function openPage(url,device="mobile"){
    const ctx=await browser.newContext({viewport:device==="mobile"?{width:390,height:844}:{width:1280,height:850},deviceScaleFactor:1});
    const page=await ctx.newPage();
    page.on("pageerror",e=>errors.push("pageerror: "+e.message));
    page.on("console",m=>{if(m.type()==="error")errors.push("console: "+m.text());});
    await page.goto(url,{waitUntil:"load"});
    await page.locator("#connectionBadge").waitFor();
    return {ctx,page};
  }
  async function winFromStart(page){
    const right=page.locator('[data-move="1,0"]');
    await A(right,2);
    await page.locator("#puzzleLockPanel").waitFor({state:"visible"});
    const prompt=await page.locator("#puzzleLockPrompt").innerText();
    assert.match(prompt,/puerta|door/i,"The teaching gate should mention the door");
    await page.locator("#puzzleLockChoices button").first().click();
    await A(right,3);
    await page.locator("#puzzleVictory").waitFor({state:"visible"});
    assert.match(await page.locator("#puzzleVictoryStats").innerText(),/solved in/i);
  }
  try{
    const {ctx:studentCtx,page:student}=await openPage(base+"/");
    assert.equal(await student.title(),"PUENTE — Play. Build. Remix.");
    await student.locator("#goTryPuzzle").click();
    await student.locator("#protocolScreen").waitFor({state:"visible"});
    assert.equal(await student.locator("#protocolRelays .protocol-node").count(),6);
    assert.ok(await student.locator("#protocolPulse").isDisabled(),"Physical route must be ready before transmitting.");
    const relayState=await student.evaluate(()=>{
      const G=window.PuenteProtocol,p=G.generate(1001,"es");
      return {answer:p.solution,bad:G.BASE.find(n=>n!==p.solution)};
    });
    for(let i=0;i<6;i++)if((relayState.bad>>i)&1)
      await student.locator('#protocolRelays [data-relay="'+String.fromCharCode(65+i)+'"]').click();
    assert.equal(await student.locator("#protocolPower").innerText(),"3 / 3");
    await student.locator("#protocolPulse").click();
    assert.match(await student.locator("#protocolFeedback").innerText(),/REJECTED/i);
    for(let i=0;i<6;i++)if(((relayState.bad>>i)&1)!==((relayState.answer>>i)&1))
      await student.locator('#protocolRelays [data-relay="'+String.fromCharCode(65+i)+'"]').click();
    assert.equal(await student.locator("#protocolRoute").innerText(),"ROUTE LIVE");
    await student.locator("#protocolPulse").click();
    await student.locator("#protocolWin").waitFor({state:"visible"});
    assert.match(await student.locator("#protocolWinReport").innerText(),/SIGNAL OPERATOR/);
    assert.ok((await student.locator("#protocolShareLink").inputValue()).includes("protocol="));
    await student.screenshot({path:path.join(root,"artifacts","relay-mobile.png"),fullPage:false});
    await student.locator("#protocolNext").click();
    await student.locator("#protocolWin").waitFor({state:"hidden"});
    await student.goto(base+"/?try=1");
    await student.locator("#workshopScreen").waitFor({state:"visible"});
    assert.equal(await student.locator("#puzzleGrid .puzzle-cell").count(),48);
    assert.match(await student.locator("#puzzleState").innerText(),/PLAYING LEVEL/);
    await winFromStart(student);
    await student.locator("#puzzleRemix").click();
    assert.match(await student.locator("#puzzleState").innerText(),/BUILD MODE/);
    assert.match(await student.locator("#puzzleMapId").innerText(),/GEN 1/);
    await student.locator("#puzzleSubmit").click();
    const draft=await student.locator("#puzzleLink").inputValue();
    assert.ok(draft.includes("puzzleDraft="));
    assert.ok(draft.length<1800);
    const overflow=await student.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    assert.ok(overflow<=3,"Mobile homepage has horizontal overflow: "+overflow);
    const out=path.join(root,"artifacts");fs.mkdirSync(out,{recursive:true});
    await student.screenshot({path:path.join(out,"puzzle-mobile.png"),fullPage:false});
    await studentCtx.close();

    const reviewURL=draft.replace("https://puente.abundent.org",base).replace("https://the-static-collective.github.io/PUENTE",base);
    const {ctx:reviewCtx,page:review}=await openPage(reviewURL,"desktop");
    await review.locator("#workshopScreen").waitFor({state:"visible"});
    await review.locator("#puzzleTeacherReview").waitFor({state:"visible"});
    assert.equal(await review.locator("#puzzleReviewLocks .puzzle-review-item").count(),1);
    await review.locator("#puzzleReviewTest").click();
    await winFromStart(review);
    await review.locator("#puzzleBackToEdit").click();
    await review.locator("#puzzleReviewChecked").check();
    assert.equal(await review.locator("#puzzleApprove").isEnabled(),true);
    await review.locator("#puzzleApprove").click();
    const player=await review.locator("#puzzleLink").inputValue();
    assert.ok(player.includes("?puzzle="));
    const playerURL=player.replace("https://puente.abundent.org",base);
    await review.screenshot({path:path.join(out,"teacher-review-desktop.png"),fullPage:false});
    await reviewCtx.close();

    const {ctx:playCtx,page:play}=await openPage(playerURL,"mobile");
    await play.locator("#workshopScreen").waitFor({state:"visible"});
    await winFromStart(play);
    await playCtx.close();

    const {ctx:directCtx,page:direct}=await openPage(base+"/?try=1","mobile");
    await direct.locator("#workshopScreen").waitFor({state:"visible"});
    assert.match(await direct.locator("#puzzleState").innerText(),/PLAYING LEVEL/);
    await directCtx.close();

    // The first real user's complete loop: teacher tinkers, plays, saves,
    // and creates a lesson to bring to an existing ChatGPT conversation.
    const {ctx:teacherCtx,page:teacher}=await openPage(base+"/?studio=1","desktop");
    await teacher.locator("#studioScreen").waitFor({state:"visible"});
    assert.match(await teacher.locator("#studioHeading").innerText(),/Playroom/);
    assert.equal(await teacher.locator("#studioRules li").count(),5);
    await teacher.locator("#studioPeek").click();
    await teacher.locator("#studioAnswer").waitFor({state:"visible"});
    assert.match(await teacher.locator("#studioAnswerText").innerText(),/[A-F] \+ [A-F] \+ [A-F]/);
    await teacher.locator("#studioRank").selectOption("starter");
    assert.equal(await teacher.locator("#studioRules li").count(),4);
    await teacher.locator("#studioScene").selectOption("town");
    assert.match(await teacher.locator("#studioMissionName").innerText(),/Unnecessary Emergencies/);
    await teacher.locator("#studioNotes").fill("Ask students to invent an if/then rule for a fictional relay.");
    await teacher.locator("#studioKeep").click();
    assert.match(await teacher.locator("#studioShelfCount").innerText(),/1 kept/);
    assert.equal(await teacher.locator(".studio-saved-card").count(),1);
    await teacher.locator("#studioPlay").click();
    await teacher.locator("#protocolScreen").waitFor({state:"visible"});
    assert.equal(await teacher.locator("#protocolRelays .protocol-node").count(),6);
    const studioGame=await teacher.evaluate(()=>{
      const p=window.PuenteProtocol;
      return p.generate(p.codeTo(new URL(document.querySelector("#protocolShareLink").value).searchParams.get("protocol")),"es").solution;
    });
    for(let i=0;i<6;i++)if((studioGame>>i)&1)
      await teacher.locator('#protocolRelays [data-relay="'+String.fromCharCode(65+i)+'"]').click();
    await teacher.locator("#protocolPulse").click();
    await teacher.locator("#protocolWin").waitFor({state:"visible"});
    await teacher.locator('[data-screen="studio"]').click();
    await teacher.locator("#studioScreen").waitFor({state:"visible"});
    assert.match(await teacher.locator("#studioNotes").inputValue(),/fictional relay/);
    await teacher.screenshot({path:path.join(root,"artifacts","teacher-playroom-desktop.png"),fullPage:false});
    await teacherCtx.close();

    // High-school path: no guessable A/B/C buttons for advanced grammar.
    // Player must recover two fragments and type three phrases to get out.
    const {ctx:heistCtx,page:heist}=await openPage(base+"/?heist=1","mobile");
    await heist.locator("#workshopScreen").waitFor({state:"visible"});
    assert.match(await heist.locator("#puzzleState").innerText(),/PLAYING LEVEL/);
    await heist.locator("#puzzleObjective").waitFor({state:"visible"});
    assert.match(await heist.locator("#puzzleExtraction").innerText(),/SEALED/);
    const press=async(direction,times=1)=>A(heist.locator('[data-move="'+direction+'"]'),times);
    const cipher=async(answer)=>{
      await heist.locator("#puzzleLockPanel").waitFor({state:"visible"});
      await heist.locator(".cipher-entry").fill(answer);
      await heist.locator(".cipher-submit").click();
      await heist.locator("#puzzleLockPanel").waitFor({state:"hidden"});
    };
    await press("1,0");
    await press("0,-1"); await cipher("se habian ido"); // accents optional
    await press("0,-1"); // fragment X
    assert.match(await heist.locator("#puzzleFragmentA").innerText(),/◆/);
    await press("0,1",2);
    await press("-1,0");
    await press("0,1"); // portal P teleports to Q
    await press("0,1");
    await press("1,0"); await cipher("sepa"); // subjunctive
    await press("0,1"); // fragment Y
    assert.match(await heist.locator("#puzzleExtraction").innerText(),/OPEN/);
    await press("0,-1");
    await press("1,0");
    await press("0,-1"); await cipher("por eso"); // causal connector
    await press("0,-1"); // extraction
    await heist.locator("#puzzleVictory").waitFor({state:"visible"});
    assert.match(await heist.locator("#puzzleVictoryTitle").innerText(),/SIGNAL SECURED/);
    assert.match(await heist.locator("#puzzleBestRun").innerText(),/PERSONAL BEST/);
    const hardOverflow=await heist.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    assert.ok(hardOverflow<=3,"Heist viewport overflowed by "+hardOverflow+" px.");
    await heist.screenshot({path:path.join(root,"artifacts","heist-mobile.png"),fullPage:false});
    await heistCtx.close();

    // The fallback is one physical HTML file and must run without a web server.
    const offlineURL="file://"+path.join(root,"showcase-offline.html");
    const {ctx:offlineCtx,page:offline}=await openPage(offlineURL,"mobile");
    await offline.locator("#protocolScreen").waitFor({state:"visible"});
    const offlineAnswer=await offline.evaluate(()=>window.PuenteProtocol.generate(1001,"es").solution);
    for(let i=0;i<6;i++)if((offlineAnswer>>i)&1)
      await offline.locator('#protocolRelays [data-relay="'+String.fromCharCode(65+i)+'"]').click();
    await offline.locator("#protocolPulse").click();
    await offline.locator("#protocolWin").waitFor({state:"visible"});
    assert.match(await offline.locator("#protocolWinReport").innerText(),/PERFECT DECODE/);
    await offlineCtx.close();
    if(errors.length)throw Error("Browser errors:\n"+errors.join("\n"));
    console.log("SHOWCASE SMOKE PASS: actual relay deduction, failed pulse, unique winning route, procedural challenge, legacy map remix/teacher workflow, heist and offline relay.");
  }finally{await browser.close();server.close();}
}
main().catch(err=>{console.error(err.stack||err);server.close();process.exitCode=1;});
