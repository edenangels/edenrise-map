// EdenRise Brain — conversational layer on the map: ask, focus, place (role-gated), report, learn. iPad/phone friendly.
(function(){
const API = "https://edenrise-brain.edenrise.workers.dev";
const L_ = (typeof LANG!=="undefined") ? LANG : "pt";
const T = {pt:{title:"Cérebro da Herdade",sub:"Pergunte qualquer coisa sobre a terra, ou dê uma ordem: “põe um tanque aqui”.",ph:"Pergunta ou ordem…",send:"Enviar",role:"Perfil",viewer:"visitante",field:"terreno",leader:"liderança",login:"Entrar com chave",logout:"sair",place:"Toque no mapa para colocar",confirm:"Confirmar aqui",cancel:"Cancelar",placed:"Colocado no mapa",needLeader:"Só a liderança pode colocar no mapa. Entre com a chave de liderança.",used:"Fontes",thinking:"a pensar…",err:"Sem resposta agora — tente outra vez.",mic:"Falar",report:"Reportar aqui",reported:"Ocorrência registada",keyPrompt:"Chave de acesso (liderança ou terreno):",name:"O seu nome:",layerP:"Propostas (do cérebro)",layerO:"Ocorrências"},
           en:{title:"Estate Brain",sub:"Ask anything about the land, or give an order: “put a tank here”.",ph:"Question or command…",send:"Send",role:"Role",viewer:"viewer",field:"field",leader:"leadership",login:"Sign in with key",logout:"sign out",place:"Tap the map to place",confirm:"Confirm here",cancel:"Cancel",placed:"Placed on the map",needLeader:"Only leadership can place on the map. Sign in with the leadership key.",used:"Sources",thinking:"thinking…",err:"No answer right now — try again.",mic:"Speak",report:"Report here",reported:"Occurrence recorded",keyPrompt:"Access key (leadership or field):",name:"Your name:",layerP:"Proposals (from the brain)",layerO:"Occurrences"}}[L_];
let KEY = "", ROLE = "viewer", ACTOR = ""; try{ KEY = localStorage.getItem("edr_role_key")||""; ACTOR = localStorage.getItem("edr_actor")||""; }catch(e){}
const hdr = ()=>({"Content-Type":"application/json", ...(KEY?{"X-Role-Key":KEY}:{})});
// ---------- UI ----------
const css = document.createElement("style"); css.textContent = `
#brainbtn{position:absolute;right:14px;bottom:26px;z-index:1400;display:flex;align-items:center;gap:8px;background:var(--linen);color:var(--bark);border:0;border-radius:999px;padding:11px 16px 11px 13px;font:700 13px var(--display);letter-spacing:.02em;box-shadow:var(--sh);cursor:pointer}
#brainbtn .orb{width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#fff,var(--oak) 60%,var(--oak-2));box-shadow:0 0 0 3px rgba(127,154,106,.25);animation:orb 2.4s ease-in-out infinite} @keyframes orb{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
#brain{position:absolute;right:14px;bottom:26px;width:min(420px,calc(100vw - 28px));height:min(560px,calc(100vh - 120px));z-index:1450;background:rgba(28,24,19,.96);backdrop-filter:blur(12px);border:1px solid var(--line-2);border-radius:14px;box-shadow:var(--sh);display:flex;flex-direction:column;overflow:hidden}
#brain[hidden]{display:none} #brain .hd{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line)} #brain .hd h3{font:600 16px var(--display);margin:0;flex:1} #brain .hd .sub{font-size:11px;color:var(--muted)}
#brain .role{font:600 10.5px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--bark);background:var(--straw);border-radius:999px;padding:2px 8px;cursor:pointer} #brain .role.viewer{background:var(--line-2);color:var(--linen-2)} #brain .role.leader{background:var(--oak)}
#brain .log{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:10px;font-size:13.5px;line-height:1.45}
#brain .m{max-width:92%;padding:9px 12px;border-radius:12px;white-space:pre-wrap} #brain .m.u{align-self:flex-end;background:var(--night-2);border:1px solid var(--line-2)} #brain .m.a{align-self:flex-start;background:var(--bark);border:1px solid var(--line)}
#brain .m .src{margin-top:6px;display:flex;flex-wrap:wrap;gap:4px} #brain .m .src span{font:500 10.5px var(--mono);border:1px solid var(--line-2);border-radius:5px;padding:1px 6px;color:var(--linen-2);cursor:pointer} #brain .m .src span:hover{border-color:var(--oak);color:var(--linen)}
#brain .in{display:flex;gap:6px;padding:10px 12px;border-top:1px solid var(--line)} #brain .in input{flex:1;padding:11px 12px;background:var(--bark);color:var(--linen);border:1px solid var(--line-2);border-radius:10px;font:14px var(--ui)} #brain .in button{padding:0 14px;border-radius:10px;border:0;background:var(--oak);color:var(--bark);font:700 13px var(--ui);cursor:pointer} #brain .in button.mic{background:var(--night-2);color:var(--linen);border:1px solid var(--line-2)} #brain .in button.mic.on{background:var(--ember);color:#fff}
#brain .chips{display:flex;gap:6px;padding:0 12px 10px;flex-wrap:wrap} #brain .chips button{font:500 11.5px var(--ui);padding:5px 10px;border-radius:999px;border:1px solid var(--line-2);background:transparent;color:var(--linen-2);cursor:pointer} #brain .chips button:hover{border-color:var(--oak);color:var(--linen)}
#placebar{position:absolute;left:50%;top:60px;transform:translateX(-50%);z-index:1460;background:var(--straw);color:var(--bark);border-radius:999px;padding:10px 16px;font:700 13px var(--ui);display:flex;gap:10px;align-items:center;box-shadow:var(--sh)} #placebar button{border:0;border-radius:999px;padding:6px 12px;font:700 12px var(--ui);cursor:pointer;background:var(--bark);color:var(--linen)}
#placebar button.ok{background:var(--oak);color:var(--bark)} .crosshair{cursor:crosshair!important}
.prop-pin{width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--straw);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;color:#111;font-weight:800;font-size:13px} .prop-pin.occ{background:var(--ember);color:#fff}
@media(max-width:700px){ #brain{right:8px;left:8px;bottom:8px;width:auto;height:min(70vh,560px)} #brainbtn{right:10px;bottom:16px} }
@media(pointer:coarse){ #brain .in input{font-size:16px;padding:13px} #brain .in button{padding:0 18px} .lyr{padding:10px 6px} }`;
document.head.appendChild(css);
const btn = document.createElement("button"); btn.id="brainbtn"; btn.innerHTML=`<span class="orb"></span>${T.title}`; document.getElementById("map").appendChild(btn);
const box = document.createElement("div"); box.id="brain"; box.hidden=true; box.innerHTML=`<div class="hd"><span class="orb" style="width:12px;height:12px;border-radius:50%;background:var(--oak)"></span><div style="flex:1"><h3>${T.title}</h3><div class="sub">${T.sub}</div></div><span class="role ${ROLE}" id="brole">${T.viewer}</span><button id="bclose" style="background:transparent;border:0;color:var(--muted);font-size:16px;cursor:pointer">✕</button></div>
<div class="log" id="blog"></div><div class="chips" id="bchips"></div><div class="in"><input id="bq" placeholder="${T.ph}" autocomplete="off"><button class="mic" id="bmic" title="${T.mic}">🎤</button><button id="bsend">${T.send}</button></div>`;
document.getElementById("map").appendChild(box);
const log = document.getElementById("blog"), q = document.getElementById("bq");
btn.onclick = ()=>{ box.hidden=false; btn.hidden=true; q.focus(); if(!log.children.length) hello(); };
document.getElementById("bclose").onclick = ()=>{ box.hidden=true; btn.hidden=false; };
function msg(role, text, used){ const d=document.createElement("div"); d.className="m "+(role==="user"?"u":"a"); d.textContent=text;
  if(used && used.length){ const s=document.createElement("div"); s.className="src"; s.innerHTML=`<span style="border:0;color:var(--muted);padding-left:0">${T.used}:</span>`+used.map(u=>`<span data-id="${u.id}" data-lat="${u.lat||""}" data-lon="${u.lon||""}">${u.id}</span>`).join(""); s.querySelectorAll("[data-id]").forEach(e=>e.onclick=()=>focusEntity(e.dataset.id,+e.dataset.lat,+e.dataset.lon)); d.appendChild(s); }
  log.appendChild(d); log.scrollTop=log.scrollHeight; return d; }
const CHIPS = L_==="en" ? ["Which buildings are most exposed to fire?","What needs attention this week?","Where can we build?","Put a water tank here"] : ["Que edifícios estão mais expostos ao fogo?","O que precisa de atenção esta semana?","Onde podemos construir?","Põe um tanque de água aqui"];
document.getElementById("bchips").innerHTML = CHIPS.map(c=>`<button>${c}</button>`).join(""); document.querySelectorAll("#bchips button").forEach(b=>b.onclick=()=>{ q.value=b.textContent; send(); });
function hello(){ msg("a", L_==="en" ? "I know the whole estate: 388 entities, 200 relations, every dataset and feed. Ask, or give an order." : "Conheço a herdade inteira: 388 entidades, 200 relações, todas as camadas e feeds. Pergunte, ou dê uma ordem."); }
const history = [];
async function send(){ const text=q.value.trim(); if(!text) return; q.value=""; msg("user", text); history.push({role:"user",content:text});
  const th = msg("a", T.thinking); const c = map.getCenter();
  const ctx = {view:{lat:+c.lat.toFixed(5), lon:+c.lng.toFixed(5), zoom:+map.getZoom().toFixed(1)}, near:[+c.lng.toFixed(5), +c.lat.toFixed(5)], focus: window.__focusId||null};
  try{ const r = await fetch(API+"/ask",{method:"POST",headers:hdr(),body:JSON.stringify({lang:L_,messages:history.slice(-8),context:ctx,actor:ACTOR})}); const d = await r.json();
    th.remove(); if(d.error){ msg("a", T.err+" ("+d.error+")"); return; }
    msg("a", d.reply, d.used); history.push({role:"assistant",content:d.reply}); if(d.role) setRole(d.role);
    if(d.action) act(d.action);
  }catch(e){ th.textContent = T.err; }
}
document.getElementById("bsend").onclick = send; q.addEventListener("keydown", e=>{ if(e.key==="Enter") send(); });
// voice (on-device Web Speech, free)
const SR = window.SpeechRecognition||window.webkitSpeechRecognition; const mic=document.getElementById("bmic");
if(!SR) mic.hidden=true; else { const rec=new SR(); rec.lang = L_==="en"?"en-GB":"pt-PT"; rec.interimResults=false; let on=false;
  mic.onclick=()=>{ if(on){ rec.stop(); return; } rec.start(); on=true; mic.classList.add("on"); };
  rec.onresult=e=>{ q.value=e.results[0][0].transcript; }; rec.onend=()=>{ on=false; mic.classList.remove("on"); if(q.value) send(); }; }
// ---------- roles ----------
function setRole(r){ ROLE=r; const el=document.getElementById("brole"); el.className="role "+r; el.textContent=T[r]||r; }
window.edrAuth = { get key(){ return KEY; }, get role(){ return ROLE; }, get actor(){ return ACTOR; }, signIn: ()=>document.getElementById("brole").onclick() };
document.getElementById("brole").onclick = async ()=>{ if(KEY){ if(confirm(T.logout+"?")){ KEY=""; try{localStorage.removeItem("edr_role_key");}catch(e){} setRole("viewer"); } return; }
  const k = prompt(T.keyPrompt); if(!k) return; const n = prompt(T.name, ACTOR||""); if(n){ ACTOR=n; try{localStorage.setItem("edr_actor",n);}catch(e){} }
  KEY=k.trim(); try{localStorage.setItem("edr_role_key",KEY);}catch(e){} const h = await fetch(API+"/health",{headers:hdr()}).then(r=>r.json()); setRole(h.role||"viewer"); if(h.role==="viewer"){ KEY=""; try{localStorage.removeItem("edr_role_key");}catch(e){} alert(L_==="en"?"Key not recognised.":"Chave não reconhecida."); } };
(async()=>{ if(KEY){ try{ const h=await fetch(API+"/health",{headers:hdr()}).then(r=>r.json()); setRole(h.role||"viewer"); }catch(e){} } })();
// ---------- live layers from the brain (proposals, occurrences) ----------
const liveP = L.layerGroup().addTo(map), liveO = L.layerGroup().addTo(map);
async function loadFeatures(){ if(window.renderFeatures) return window.renderFeatures(); try{ const d = await fetch(API+"/features").then(r=>r.json()); liveP.clearLayers(); liveO.clearLayers();
  for(const f of d.features){ const p=f.properties; const isO = p.layer==="ocorrencias"; const c=f.geometry.coordinates; const m=L.marker([c[1],c[0]],{icon:L.divIcon({className:"",html:`<div class="prop-pin ${isO?"occ":""}">${isO?"!":"+"}</div>`,iconSize:[30,30],iconAnchor:[15,30]})});
    m.on("click", ()=>{ if(window.showCard) showCard({name:p.name, kind:p.kind, status:p.status, created_by:p.created_by, created_at:String(p.created_at).slice(0,16), note:p.note, brain_id:p.id}, L.latLng(c[1],c[0]), isO?T.layerO:T.layerP); });
    (isO?liveO:liveP).addLayer(m); } }catch(e){} }
loadFeatures();
// ---------- actions ----------
function focusEntity(id, lat, lon){ window.__focusId = id; if(lat && lon){ map.setView([lat,lon], Math.max(map.getZoom(),17)); L.circleMarker([lat,lon],{radius:16,color:"#c9a227",weight:3,fill:false}).addTo(map).bringToFront(); } }
function act(a){ if(a.type==="focus"){ fetch(API+"/brain/entity?id="+encodeURIComponent(a.id)).then(r=>r.json()).then(e=>{ if(e && e.lat) focusEntity(e.id, e.lat, e.lon); }); }
  if(a.type==="place"){ if(ROLE!=="leader"){ msg("a", T.needLeader); return; } startPlace(a); } }
let placing = null;
function startPlace(a, layer){ const lyr = layer || a.layer || "propostas"; const bar=document.createElement("div"); bar.id="placebar"; bar.innerHTML=`<span>${lyr==="ocorrencias"?T.report:T.place}: <b>${a.name||a.kind||""}</b></span><button class="ok" hidden>${T.confirm}</button><button class="x">${T.cancel}</button>`; document.getElementById("map").appendChild(bar);
  document.getElementById("map").classList.add("crosshair"); let tmp=null, ll=null;
  const onClick = e=>{ ll=e.latlng; if(tmp) map.removeLayer(tmp); tmp=L.marker(ll,{draggable:true,icon:L.divIcon({className:"",html:`<div class="prop-pin ${lyr==="ocorrencias"?"occ":""}">${lyr==="ocorrencias"?"!":"+"}</div>`,iconSize:[30,30],iconAnchor:[15,30]})}).addTo(map); tmp.on("dragend",()=>ll=tmp.getLatLng()); bar.querySelector(".ok").hidden=false; };
  map.on("click", onClick);
  const end = ()=>{ map.off("click", onClick); document.getElementById("map").classList.remove("crosshair"); if(tmp) map.removeLayer(tmp); bar.remove(); placing=null; };
  bar.querySelector(".x").onclick = end;
  bar.querySelector(".ok").onclick = async ()=>{ const note = prompt(L_==="en"?"Note (optional):":"Nota (opcional):","")||""; const r = await fetch(API+"/features",{method:"POST",headers:hdr(),body:JSON.stringify({layer:lyr,name:a.name||a.kind||"",kind:a.kind||"",lon:ll.lng,lat:ll.lat,note,actor:ACTOR})}).then(r=>r.json());
    if(r.ok){ msg("a", (lyr==="ocorrencias"?T.reported:T.placed)+` — ${r.id} (${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)})`); loadFeatures(); if(window.toast) toast(lyr==="ocorrencias"?T.reported:T.placed); } else msg("a", T.err+" "+(r.need||r.error||"")); end(); };
  placing = a;
}
window.brainPlace = (kind,name)=>{ if(ROLE!=="leader"){ box.hidden=false; btn.hidden=true; msg("a", T.needLeader); return; } startPlace({kind,name}); };
window.brainReport = ()=>{ if(ROLE==="viewer"){ box.hidden=false; btn.hidden=true; msg("a", L_==="en"?"Sign in with the field or leadership key to report.":"Entre com a chave de terreno ou liderança para reportar."); return; } startPlace({kind:"ocorrencia",name:L_==="en"?"Occurrence":"Ocorrência"},"ocorrencias"); };
})();
