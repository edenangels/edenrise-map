// Onboarding — a short guided tour on first open (skippable, remembered), replayable from the help sheet. Bilingual, keyboard-friendly.
(function(){
const EN=(typeof LANG!=="undefined")&&LANG==="en";
const STEPS=EN?[
 {sel:"#q",t:"Search",d:"Find any asset, building, tree or team item by name or id. Enter jumps to the first result."},
 {sel:"#tree",t:"Layers by category",d:"Open a category, switch layers on and off. The team's own proposals live in ✎ Team proposals at the top."},
 {sel:"#nav-edit",t:"Edit",d:"Draw, measure, place exact shapes, attach photos and notes. Sign in with a team key the first time. Cancel never deletes."},
 {sel:"#nav-tasks",t:"Tasks",d:"Work pinned to a place: who, by when, done with a photo."},
 {sel:"#brainbtn",t:"Estate Brain",d:"Ask anything about the land in Portuguese or English. It answers from the map's own data and cites the source."},
 {sel:"#navshare",t:"Share",d:"Copy a link that opens exactly this view, send it on WhatsApp, or print a QR."},
 {sel:".tree-tools",t:"Offline and print",d:"Save the map for offline before going to the field; print an atlas or the fire-strip proof."}]
:[
 {sel:"#q",t:"Pesquisar",d:"Encontre qualquer ativo, edifício, árvore ou item da equipa por nome ou id. Enter vai ao primeiro resultado."},
 {sel:"#tree",t:"Camadas por categoria",d:"Abra uma categoria e ligue ou desligue camadas. As propostas da equipa ficam em ✎ Propostas da equipa, no topo."},
 {sel:"#nav-edit",t:"Editar",d:"Desenhar, medir, colocar formas exatas, juntar fotos e notas. Entre com a chave da equipa na primeira vez. Cancelar nunca apaga."},
 {sel:"#nav-tasks",t:"Tarefas",d:"Trabalho preso a um sítio: quem, até quando, feito com foto."},
 {sel:"#brainbtn",t:"Cérebro da Herdade",d:"Pergunte o que quiser sobre a terra, em português ou inglês. Responde com os dados do mapa e cita a fonte."},
 {sel:"#navshare",t:"Partilhar",d:"Copie um link que abre exatamente esta vista, envie por WhatsApp ou imprima um QR."},
 {sel:".tree-tools",t:"Offline e impressão",d:"Guarde o mapa para offline antes de ir para o terreno; imprima um atlas ou a prova das faixas."}];
const css=document.createElement("style"); css.textContent=`#tour{position:fixed;inset:0;z-index:6000;pointer-events:none} #tour .dim{position:absolute;inset:0;background:rgba(12,10,8,.55);pointer-events:auto} #tour .ring{position:absolute;border:2px solid var(--straw);border-radius:12px;box-shadow:0 0 0 9999px rgba(12,10,8,.55);pointer-events:none;transition:all .25s} #tour .card{position:absolute;max-width:320px;background:var(--night,#221d17);color:var(--linen,#f1e9d8);border:1px solid var(--line-2,#4a4033);border-radius:14px;padding:14px 16px;box-shadow:0 10px 40px rgba(0,0,0,.5);pointer-events:auto;font:14px/1.45 var(--ui,sans-serif)} #tour .card b{display:block;font:600 16px var(--display,sans-serif);margin-bottom:4px} #tour .card .k{font:600 10.5px var(--mono,monospace);letter-spacing:.1em;color:var(--muted,#9a8f80);text-transform:uppercase;margin-bottom:6px} #tour .card .bt{display:flex;gap:6px;margin-top:12px;justify-content:flex-end} #tour .card button{padding:8px 13px;border-radius:9px;border:1px solid var(--line-2,#4a4033);background:transparent;color:var(--linen,#f1e9d8);font:600 12.5px var(--ui,sans-serif);cursor:pointer} #tour .card button.ok{background:var(--oak,#7f9a6a);color:var(--bark,#1c1813);border-color:var(--oak,#7f9a6a)} #tour .card button:focus-visible{outline:2px solid var(--straw,#c9a227)} @media(prefers-reduced-motion:reduce){#tour .ring{transition:none}}`; document.head.appendChild(css);
let i=0, el=null;
function place(){ const s=STEPS[i]; const target=document.querySelector(s.sel); const ring=el.querySelector(".ring"), card=el.querySelector(".card"); el.querySelector(".k").textContent=`${i+1} / ${STEPS.length}`; el.querySelector("b").textContent=s.t; el.querySelector("p").textContent=s.d; el.querySelector(".nx").textContent=i===STEPS.length-1?(EN?"Done":"Concluir"):(EN?"Next":"Seguinte"); el.querySelector(".pv").hidden=i===0;
  if(target){ target.scrollIntoView({block:"nearest"}); const r=target.getBoundingClientRect(); ring.style.cssText=`left:${r.left-6}px;top:${r.top-6}px;width:${r.width+12}px;height:${r.height+12}px;display:block`; const below=r.bottom+12; const top=below+240<innerHeight?below:Math.max(12,r.top-230); const left=Math.min(innerWidth-336,Math.max(12,r.left)); card.style.cssText=`left:${left}px;top:${top}px`; } else { ring.style.display="none"; card.style.cssText=`left:50%;top:40%;transform:translate(-50%,-50%)`; } el.querySelector(".nx").focus(); }
function start(){ if(el) return; el=document.createElement("div"); el.id="tour"; el.setAttribute("role","dialog"); el.setAttribute("aria-label",EN?"Guided tour":"Visita guiada"); el.innerHTML=`<div class="ring"></div><div class="card"><div class="k"></div><b></b><p style="margin:0"></p><div class="bt"><button class="sk">${EN?"Skip":"Saltar"}</button><button class="pv">‹</button><button class="ok nx"></button></div></div>`; document.body.appendChild(el); i=0; place();
  el.querySelector(".sk").onclick=end; el.querySelector(".pv").onclick=()=>{ if(i>0){ i--; place(); } }; el.querySelector(".nx").onclick=()=>{ if(i<STEPS.length-1){ i++; place(); } else end(); }; el.addEventListener("keydown",e=>{ if(e.key==="Escape") end(); if(e.key==="ArrowRight") el.querySelector(".nx").click(); if(e.key==="ArrowLeft") el.querySelector(".pv").click(); }); window.addEventListener("resize",place); }
function end(){ if(!el) return; el.remove(); el=null; window.removeEventListener("resize",place); try{ localStorage.setItem("edr_tour_done","1"); }catch(e){} }
window.edrTour={start,end};
let seen=false; try{ seen=!!localStorage.getItem("edr_tour_done"); }catch(e){}
if(/[#&]tour\b/.test(location.hash)) setTimeout(start,1500); else if(!seen&&!/[#&](edit|task=|asset=|v=)/.test(location.hash)) setTimeout(start,2500);
})();
