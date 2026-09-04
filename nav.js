// App shell: navigation + Share sheet (copy · WhatsApp · QR · print) + toast. Loads ui.css tokens.
(function(){
  if(!document.querySelector('link[href="ui.css"]')){ const l=document.createElement("link"); l.rel="stylesheet"; l.href="ui.css"; document.head.appendChild(l); }
  const here = location.pathname.split("/").pop() || "index.html";
  let LANG = "pt"; try{ LANG = localStorage.getItem("edr_lang") || ((navigator.language||"pt").toLowerCase().startsWith("pt")?"pt":"en"); }catch(e){}
  const T = {pt:{share:"PARTILHAR",title:"Partilhar esta vista",sub:"O link abre exatamente o que está no ecrã — posição, camadas e idioma.",copy:"Copiar link",copied:"Link copiado",wa:"WhatsApp",wasub:"enviar à equipa",qr:"Mostrar QR",qrsub:"para telemóvel",print:"Imprimir / PDF",printsub:"esta página",asset:"Link do ativo",assetsub:"ficha aberta",view:"vista atual"},
             en:{share:"SHARE",title:"Share this view",sub:"The link opens exactly what's on screen — position, layers and language.",copy:"Copy link",copied:"Link copied",wa:"WhatsApp",wasub:"send to the team",qr:"Show QR",qrsub:"for a phone",print:"Print / PDF",printsub:"this page",asset:"Asset link",assetsub:"open card",view:"current view"}};
  const t = T[LANG];
  const items = [["index.html",{pt:"Mapa",en:"Map"}],["3d.html",{pt:"3D",en:"3D"}],["dashboard.html",{pt:"Painel",en:"Dashboard"}],["report.html",{pt:"Relatório",en:"Report"}],["guest.html",{pt:"Hóspedes",en:"Guests"}],["labels.html",{pt:"Etiquetas",en:"Labels"}]];
  const nav = document.createElement("nav"); nav.id = "appnav";
  nav.innerHTML = `<a class="brand" href="index.html"><span class="mark"></span><span class="t">EdenRise</span></a>` +
    items.map(([h,l])=>`<a href="${h}" class="${h===here?"on":""}">${l[LANG]}</a>`).join("") +
    `<span class="sp"></span><button class="share" id="navshare"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></svg><span>${t.share}</span></button>`;
  document.body.prepend(nav);
  window.toast = function(msg){ const el=document.createElement("div"); el.className="toast"; el.textContent=msg; document.body.appendChild(el); setTimeout(()=>el.remove(), 1800); };
  function link(){ return window.viewLink ? window.viewLink() : location.href; }
  function openSheet(){
    const url = link(); const assetHash = location.hash.match(/#(asset|work|at)=[^&]+/);
    const bg = document.createElement("div"); bg.className = "sheet-bg";
    bg.innerHTML = `<div class="sheet" role="dialog" aria-label="${t.title}"><button class="close" aria-label="close">✕</button>
      <h3>${t.title}</h3><div class="sub">${t.sub}</div>
      <div class="what"><div class="qr" id="shqr"></div><div><div class="eyebrow">${document.title.replace("EdenRise — ","")} · ${t.view}</div><div class="lnk">${url.replace(/^https?:\/\//,"")}</div></div></div>
      <div class="opts">
        <button class="opt primary" id="shcopy"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg><span>${t.copy}<small>${url.length>60?url.slice(0,58)+"…":url}</small></span></button>
        <a class="opt" target="_blank" href="https://wa.me/?text=${encodeURIComponent(url)}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.8c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4c1.7.7 2 .6 2.6.5a2.3 2.3 0 0 0 1.5-1 1.8 1.8 0 0 0 .1-1c0-.2-.2-.2-.5-.4z"/></svg><span>${t.wa}<small>${t.wasub}</small></span></a>
        ${assetHash?`<button class="opt" id="shasset"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-7.6 7-13a7 7 0 1 0-14 0c0 5.4 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg><span>${t.asset}<small>${assetHash[0]}</small></span></button>`:""}
        <button class="opt" id="shprint"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg><span>${t.print}<small>${t.printsub}</small></span></button>
      </div></div>`;
    document.body.appendChild(bg);
    const close = ()=>bg.remove(); bg.querySelector(".close").onclick = close; bg.addEventListener("click", e=>{ if(e.target===bg) close(); });
    document.addEventListener("keydown", function esc(e){ if(e.key==="Escape"){ close(); document.removeEventListener("keydown", esc); } });
    const copy = (u)=>{ try{ navigator.clipboard.writeText(u); }catch(e){} toast(t.copied); close(); };
    bg.querySelector("#shcopy").onclick = ()=>copy(url);
    const a = bg.querySelector("#shasset"); if(a) a.onclick = ()=>copy(location.origin + location.pathname + assetHash[0]);
    bg.querySelector("#shprint").onclick = ()=>{ close(); setTimeout(()=>window.print(), 100); };
    const drawQR = ()=>{ try{ new QRCode(bg.querySelector("#shqr"), {text:url, width:56, height:56, correctLevel:QRCode.CorrectLevel.L}); }catch(e){} };
    if(typeof QRCode==="undefined"){ const s=document.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"; s.onload=drawQR; document.head.appendChild(s); } else drawQR();
  }
  document.getElementById("navshare").onclick = openSheet;
  window.openShare = openSheet;
})();
