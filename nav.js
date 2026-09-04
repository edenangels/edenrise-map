// Shared app shell: top navigation across Mapa · 3D · Painel · Relatório · Hóspedes · Etiquetas, with language + share
(function(){
  const here = location.pathname.split("/").pop() || "index.html";
  let LANG = "pt"; try{ LANG = localStorage.getItem("edr_lang") || ((navigator.language||"pt").toLowerCase().startsWith("pt")?"pt":"en"); }catch(e){}
  const items = [["index.html",{pt:"Mapa",en:"Map"}],["3d.html",{pt:"3D",en:"3D"}],["dashboard.html",{pt:"Painel",en:"Dashboard"}],["report.html",{pt:"Relatório",en:"Report"}],["guest.html",{pt:"Hóspedes",en:"Guests"}],["labels.html",{pt:"Etiquetas",en:"Labels"}]];
  const nav = document.createElement("nav"); nav.id = "appnav";
  nav.innerHTML = `<a class="brand" href="index.html"><span class="mark"></span>EdenRise</a>` +
    items.map(([h,l])=>`<a href="${h}" class="${h===here?"on":""}">${l[LANG]}</a>`).join("") +
    `<span class="sp"></span><button id="navshare" title="${LANG==="en"?"Copy link to this view":"Copiar link desta vista"}">⤴</button>`;
  const css = document.createElement("style"); css.textContent = `
    #appnav{position:fixed;top:0;left:0;right:0;height:38px;z-index:2000;display:flex;align-items:center;gap:2px;padding:0 10px;background:rgba(20,26,21,.92);backdrop-filter:blur(8px);border-bottom:1px solid #333b2f;font-family:-apple-system,"Segoe UI",Roboto,sans-serif;font-size:12.5px}
    #appnav a{color:#9ba391;text-decoration:none;padding:6px 10px;border-radius:6px} #appnav a.on{color:#e6e3d4;background:#1d241b} #appnav a:hover{color:#e6e3d4}
    #appnav .brand{color:#e6e3d4;font-weight:700;letter-spacing:.02em;display:flex;align-items:center;gap:7px;margin-right:8px;padding-left:4px}
    #appnav .mark{width:16px;height:16px;border-radius:50% 50% 50% 0;background:linear-gradient(135deg,#8fae7e,#3f5c36);transform:rotate(-45deg);display:inline-block}
    #appnav .sp{flex:1} #appnav button{background:transparent;color:#9ba391;border:1px solid #333b2f;border-radius:6px;padding:4px 9px;cursor:pointer;font-size:13px}
    body{padding-top:38px!important} #side{top:38px!important;height:calc(100vh - 38px)!important} #panel{top:50px!important} .tools{top:46px!important}
    @media(max-width:700px){ #appnav{font-size:11.5px;padding:0 4px} #appnav a{padding:6px 6px} #appnav .brand{margin-right:2px} }`;
  document.head.appendChild(css); document.body.prepend(nav);
  document.getElementById("navshare").onclick = ()=>{ const u = (window.viewLink ? window.viewLink() : location.href); try{ navigator.clipboard.writeText(u); }catch(e){} const b=document.getElementById("navshare"); b.textContent="✓"; setTimeout(()=>b.textContent="⤴",1200); };
})();
