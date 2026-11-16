/* Build an actual one-file PUENTE demonstration.
   No CDN, bundler, API key, network connection or file-system writes from UI.
   Inline static source; open showcase-offline.html in a browser with no server. */
"use strict";
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const file=name=>fs.readFileSync(path.join(root,name),"utf8");
let html=file("index.html");
const css=file("styles.css");
html=html.replace('<link rel="stylesheet" href="./styles.css">',"<style>\n"+css+"\n.offline-banner{padding:12px 16px;background:#e1eecd;border:1px solid #b5d2a5;border-radius:11px;color:#2c6551;font-size:13px;font-weight:780;margin:14px 0 0}\n</style>");
const icon=Buffer.from(file("favicon.svg"),"utf8").toString("base64");
html=html.replace('href="./favicon.svg"','href="data:image/svg+xml;base64,'+icon+'"');
html=html.replace('<main>','<main><p class="offline-banner">OFFLINE SHOWCASE · Play and edit without Wi-Fi. Classroom rooms and published links need an internet connection.</p>');
const names=["config.js","garden.js","game-lab.js","play-modes.js","next-game.js","garden-ui.js","puzzle-engine.js","puzzle-ui.js","app.js"];
for(const name of names){
  let code=file(name);
  if(code.includes("</script>"))throw Error("Unsafe inline script closing sequence in "+name);
  if(name==="puzzle-ui.js"){
    const old='if(params.has("try")&&!draft&&!player)startDemo();';
    if(!code.includes(old))throw Error("Can't find Puzzle Workshop's demo startup");
    code=code.replace(old,'if((params.has("try") || root.location.pathname.endsWith("/showcase-offline.html"))&&!draft&&!player)startDemo();');
    code=code.replace('const data=P.encode(pack),url=new URL(root.location.href);',
      'const data=P.encode(pack),url=new URL(root.location.protocol==="file:"?"https://puente.abundent.org/":root.location.href);');
  }
  if(name==="app.js"){
    const old="else if(url.searchParams.has('workshop')||url.searchParams.has('try')";
    if(!code.includes(old))throw Error("Can't find workshop deep link");
    code=code.replace(old,"else if(location.pathname.endsWith('/showcase-offline.html')||url.searchParams.has('workshop')||url.searchParams.has('try')");
  }
  const modulePart=name==="app.js"?'<script>':'<script>';
  const tag=new RegExp('<script(?: type="module")? src="\\./'+name.replace(".","\\.")+'"></script>');
  if(!tag.test(html))throw Error("Cannot embed "+name);
  html=html.replace(tag,modulePart+"\n"+code+"\n</script>");
}
const output=path.join(root,"showcase-offline.html");
fs.writeFileSync(output,html);
console.log("Offline showcase written:",output,Buffer.byteLength(html),"bytes and",names.length,"embedded scripts.");
