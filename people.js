// EdenRise map — people as objects on the map.
//
// A coloured dot is not enough: on 241 hectares the questions are who is that, what are they doing, and how current is
// this? Each teammate who shares their position appears where their GPS says they are, with the accuracy as a ring
// and the age of the fix on the label — live, minutes old, or a grey "last seen" that never pretends to be current.
// Tap a person: their duty, current task, battery, distance and the walking route to them; assign them work there,
// or message them. People who are only looking at the map are online, not somewhere: they are listed, never placed.
//
// Sharing is opt-in and tied to duty: "em serviço" shares, "pausa" and "fora de serviço" stop. A browser cannot
// report a position with the screen off, so the age is the honest signal.
//
// Transport: the existing /presence beat. The worker keeps only actor, role, lat, lon, zoom, page (40 chars) and time,
// so the GPS details travel in `page` as  g|acc|fix-epoch-s|duty|battery%|task-id  — no server change.
(function(){
if(typeof map === "undefined") return;
const EN = (typeof LANG !== "undefined") && LANG === "en";
const T = EN ? {team:"Team", me:"Me", share:"Share my position while on duty", duty:{on:"on duty", brk:"on a break", off:"off duty"}, live:"live", ago:m=>`${m} min ago`, lastSeen:"last seen", hrs:h=>`${h} h ago`, acc:"accuracy", battery:"battery", task:"Working on", noTask:"no task in progress", dist:"from you",
  assign:"Assign a task here", route:"Walk there", message:"Message", centre:"Show on map", online:"Online, viewing the map", nobody:"Nobody is sharing a position right now.", sharingOff:"You are not sharing your position.", sharingOn:"You are sharing your position.", gpsNo:"No GPS on this device", gpsDenied:"Location permission denied", tasks:n=>`${n} open task${n === 1 ? "" : "s"}`, close:"Close", stale:"Position is old — they may have moved or lost signal", rtk:"RTK"}
             : {team:"Equipa", me:"Eu", share:"Partilhar a minha posição em serviço", duty:{on:"em serviço", brk:"em pausa", off:"fora de serviço"}, live:"ao vivo", ago:m=>`há ${m} min`, lastSeen:"visto pela última vez", hrs:h=>`há ${h} h`, acc:"precisão", battery:"bateria", task:"A trabalhar em", noTask:"sem tarefa em curso", dist:"de ti",
  assign:"Atribuir tarefa aqui", route:"Ir até lá", message:"Mensagem", centre:"Ver no mapa", online:"Online, a ver o mapa", nobody:"Ninguém está a partilhar a posição agora.", sharingOff:"Não estás a partilhar a tua posição.", sharingOn:"Estás a partilhar a tua posição.", gpsNo:"Este aparelho não tem GPS", gpsDenied:"Permissão de localização recusada", tasks:n=>`${n} tarefa${n === 1 ? "" : "s"} aberta${n === 1 ? "" : "s"}`, close:"Fechar", stale:"Posição antiga — pode ter-se mexido ou perdido sinal", rtk:"RTK"};
const auth = () => window.edrAuth || {key:"", role:"viewer", actor:""};
const say = m => window.toast && toast(m);
const K_DUTY = "edr_duty", K_SHARE = "edr_share_pos";
const S = {tab:"people", duty:localStorage.getItem(K_DUTY) || "off", share:localStorage.getItem(K_SHARE) === "1", fix:null, watch:null, battery:null, others:[], markers:new Map(), panel:null, card:null};
const colour = name => { let h = 0; for(const c of String(name)) h = (h * 31 + c.charCodeAt(0)) % 360; return `hsl(${h} 55% 50%)`; };
const initials = n => String(n).split(/\s+/).filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();

/* ---------- encoding in the presence `page` field ---------- */
function encode(){ const f = S.fix; if(!f) return "map"; const b = S.battery == null ? "" : Math.round(S.battery * 100); const t = myTask(); return `g|${Math.round(f.acc * 10) / 10}|${Math.round(f.at / 1000)}|${S.duty}|${b}|${t ? t.id : ""}${f.rtk ? "|r" : ""}`.slice(0, 40); }
function decode(o){ const p = String(o.page || ""); if(!p.startsWith("g|")) return {gps:false}; const [, acc, t, duty, bat, task, r] = p.split("|"); return {gps:true, acc:+acc || null, fixAt:(+t || 0) * 1000, duty:duty || "on", battery:bat === "" ? null : +bat, task:task || null, rtk:r === "r"}; }
/** presence.js asks this before every beat */
function payload(){ if(!S.share || S.duty !== "on" || !S.fix) return null; return {lat:+S.fix.lat.toFixed(6), lon:+S.fix.lon.toFixed(6), zoom:+map.getZoom().toFixed(1), page:encode()}; }

/* ---------- my own position (only while sharing and on duty) ---------- */
function startWatch(){ if(S.watch != null) return; if(!navigator.geolocation){ say(T.gpsNo); return; }
  S.watch = navigator.geolocation.watchPosition(p => { const prev = S.fix; S.fix = {lat:p.coords.latitude, lon:p.coords.longitude, acc:p.coords.accuracy || 15, at:p.timestamp || Date.now(), rtk:!!p.rtk};
      if(!prev || map.distance([prev.lat, prev.lon], [S.fix.lat, S.fix.lon]) > 15 || Date.now() - lastBeat > 25000) beatSoon(); },
    e => { if(e && e.code === 1){ say(T.gpsDenied); setShare(false); } }, {enableHighAccuracy:true, maximumAge:5000, timeout:30000}); }
function stopWatch(){ if(S.watch != null){ navigator.geolocation.clearWatch(S.watch); S.watch = null; } S.fix = null; }
let lastBeat = 0, beatT = null;
function beatSoon(){ clearTimeout(beatT); beatT = setTimeout(() => { lastBeat = Date.now(); if(window.edrPresence && edrPresence.beat) edrPresence.beat(); }, 800); }
function setShare(on){ S.share = on; try{ localStorage.setItem(K_SHARE, on ? "1" : "0"); }catch(e){} if(on && S.duty === "on") startWatch(); else stopWatch(); beatSoon(); paintPanel(); }
function setDuty(d){ S.duty = d; try{ localStorage.setItem(K_DUTY, d); }catch(e){} if(d === "on" && S.share) startWatch(); else stopWatch(); beatSoon(); paintPanel(); }
try{ if(navigator.getBattery) navigator.getBattery().then(b => { S.battery = b.level; b.addEventListener("levelchange", () => { S.battery = b.level; }); }); }catch(e){}

/* ---------- tasks the people are on ---------- */
function tasks(){ return (window.edrTasks && edrTasks.all) ? edrTasks.all() : []; }
function myTask(){ const me = auth().actor; return tasks().find(t => t.status === "em curso" && (t.assignee === me || (!t.assignee && t.created_by === me))) || null; }
function openTasksOf(name){ return tasks().filter(t => (t.status === "aberta" || t.status === "em curso") && t.assignee === name); }

/* ---------- freshness ---------- */
function age(o){ return Date.now() - (o.fixAt || Date.parse(o.at) || 0); }
function fresh(o){ const a = age(o); return a < 2 * 60000 ? "live" : a < 10 * 60000 ? "recent" : "stale"; }
function ageText(o){ const a = age(o), m = Math.round(a / 60000); if(a < 2 * 60000) return T.live; if(m < 90) return T.ago(m); return `${T.lastSeen} ${T.hrs(Math.round(m / 60))}`; }

/* ---------- drawing people ---------- */
const layer = L.layerGroup().addTo(map);
const css = document.createElement("style"); css.textContent = `
.pp{position:relative;width:34px;height:34px} .pp .d{position:absolute;inset:0;border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 12px var(--ui);color:#fff;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.45)}
.pp.recent .d{border-color:#ffb347} .pp.stale .d{opacity:.55;filter:grayscale(.8);border-style:dashed} .pp .lb{position:absolute;left:38px;top:4px;white-space:nowrap;background:rgba(28,24,19,.9);color:#f1e9d8;font:700 11px var(--ui);padding:3px 8px;border-radius:999px} .pp .lb small{font:600 10px var(--mono);opacity:.75;margin-left:5px}
.pp.live .d::after{content:"";position:absolute;inset:-7px;border-radius:50%;border:2px solid currentColor;opacity:.6;animation:ppl 2s ease-out infinite} @keyframes ppl{0%{transform:scale(.7);opacity:.7}100%{transform:scale(1.35);opacity:0}}
.pp .dt{position:absolute;right:-3px;bottom:-3px;width:12px;height:12px;border-radius:50%;border:2px solid #fff} @media (prefers-reduced-motion:reduce){ .pp.live .d::after{animation:none} }
#teamp{position:fixed;top:calc(var(--nav-h,52px) + 8px);right:12px;width:min(380px,calc(100vw - 24px));max-height:calc(100vh - var(--nav-h,52px) - 24px);z-index:1700;background:#1c1813;color:#f1e9d8;border:1px solid rgba(241,233,216,.15);border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.55);display:none;flex-direction:column;overflow:hidden}
#teamp.on{display:flex} @media (max-width:700px), ((pointer:coarse) and (max-width:1366px)){ #teamp{top:auto;bottom:0;right:0;left:0;width:auto;max-height:78vh;border-radius:18px 18px 0 0} }
#teamp .hd{display:flex;align-items:center;gap:8px;padding:12px 14px 8px;font:700 15px var(--ui)} #teamp .hd span{flex:1} #teamp .hd button{height:34px;border-radius:17px;border:1px solid rgba(241,233,216,.25);background:transparent;color:#f1e9d8;font:600 12px var(--ui);padding:0 12px;cursor:pointer}
#teamp .bd{overflow-y:auto;padding:0 12px 14px;display:flex;flex-direction:column;gap:8px;min-height:0} #teamp .bd > *{flex-shrink:0}
#teamp .pme{border:1px solid rgba(241,233,216,.15);border-radius:14px;padding:10px 12px;display:flex;flex-direction:column;gap:8px} #teamp .seg{display:flex;gap:6px} #teamp .seg button{flex:1;min-height:40px;border-radius:10px;border:1px solid rgba(241,233,216,.2);background:transparent;color:#f1e9d8;font:600 12px var(--ui);cursor:pointer} #teamp .seg button.on{background:#c9a227;color:#1c1813;border-color:#c9a227}
#teamp .sw{display:flex!important;flex-direction:row!important;align-items:center;gap:10px;font:600 13px var(--ui);min-height:40px;width:100%} #teamp .sw span{flex:1;min-width:0} #teamp .sw input{width:22px;height:22px;accent-color:#5be0a0} #teamp .muted{font:500 12px var(--ui);opacity:.7}
#teamp .sec{font:600 10px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:#c9a227;margin:6px 2px 0}
#teamp .p{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:9px 10px;border:1px solid rgba(241,233,216,.1);border-radius:12px;cursor:pointer;min-height:56px} #teamp .p:hover{border-color:#c9a227}
#teamp .av{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 12px var(--ui);color:#fff;position:relative} #teamp .av.stale{opacity:.55;filter:grayscale(.8)}
#teamp .p b{display:block;font:700 13.5px var(--ui)} #teamp .p small{display:block;font:500 11px var(--mono);opacity:.7;margin-top:2px} #teamp .p .r{font:700 11px var(--mono);text-align:right;white-space:nowrap}
#pcard{position:fixed;z-index:1760;left:50%;transform:translateX(-50%);bottom:calc(var(--mbar,0px) + 16px);width:min(420px,calc(100vw - 24px));background:#1c1813;color:#f1e9d8;border:1px solid rgba(241,233,216,.18);border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.55);padding:14px;display:none;flex-direction:column;gap:10px} #pcard.on{display:flex}
#pcard .top{display:flex;gap:12px;align-items:center} #pcard .top .av{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 15px var(--ui);color:#fff} #pcard .top b{font:800 16px var(--ui);display:block} #pcard .top small{font:500 12px var(--ui);opacity:.75}
#pcard .facts{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;font:500 12.5px var(--ui)} #pcard .facts span{opacity:.65;display:block;font:600 10px var(--mono);letter-spacing:.08em;text-transform:uppercase}
#pcard .warn{font:600 12px var(--ui);color:#ffb347} #pcard .acts{display:grid;grid-template-columns:1fr 1fr;gap:6px} #pcard .acts button{min-height:46px;border-radius:12px;border:1px solid rgba(241,233,216,.25);background:transparent;color:#f1e9d8;font:700 13px var(--ui);cursor:pointer} #pcard .acts button.ok{background:#c9a227;color:#1c1813;border-color:#c9a227} #pcard .bk{align-self:flex-start;height:34px;border-radius:17px;border:1px solid rgba(241,233,216,.25);background:transparent;color:#f1e9d8;font:600 12px var(--ui);padding:0 12px;cursor:pointer} #pcard .x{position:absolute;right:10px;top:10px;width:34px;height:34px;border-radius:17px;border:1px solid rgba(241,233,216,.25);background:transparent;color:#f1e9d8;cursor:pointer}`;
document.head.appendChild(css);
const dutyCol = {on:"#5be0a0", brk:"#ffb347", off:"#6b6157"};
function render(others){
  S.others = others.map(o => ({...o, ...decode(o)})).filter(o => o.actor && o.actor !== auth().actor);
  const keep = new Set();
  for(const o of S.others){ if(!o.gps || o.lat == null) continue; keep.add(o.actor); const fr = fresh(o); const col = colour(o.actor);
    const html = `<div class="pp ${fr}" style="color:${col}"><div class="d" style="background:${col}">${initials(o.actor)}</div><i class="dt" style="background:${dutyCol[o.duty] || dutyCol.on}"></i><div class="lb">${o.actor}<small>${ageText(o)}</small></div></div>`;
    let m = S.markers.get(o.actor);
    if(!m){ const ring = L.circle([o.lat, o.lon], {radius:o.acc || 10, color:col, weight:1, opacity:.6, fillColor:col, fillOpacity:.1, interactive:false});
      const mk = L.marker([o.lat, o.lon], {icon:L.divIcon({className:"", html, iconSize:[34, 34], iconAnchor:[17, 17]}), zIndexOffset:950, keyboard:true, title:o.actor});
      mk.on("click", e => { L.DomEvent.stop(e); openCard(o.actor); }); ring.addTo(layer); mk.addTo(layer); m = {mk, ring}; S.markers.set(o.actor, m); }
    else { m.mk.setLatLng([o.lat, o.lon]); m.mk.setIcon(L.divIcon({className:"", html, iconSize:[34, 34], iconAnchor:[17, 17]})); m.ring.setLatLng([o.lat, o.lon]).setRadius(o.acc || 10); m.ring.setStyle({opacity:fr === "stale" ? .25 : .6, fillOpacity:fr === "stale" ? .03 : .1}); } }
  for(const [a, m] of S.markers) if(!keep.has(a)){ layer.removeLayer(m.mk); layer.removeLayer(m.ring); S.markers.delete(a); }
  chip(); if(S.tab !== "chat") paintPanel(); if(S.card) openCard(S.card, true);
}
setInterval(() => { if(S.others.length) render(S.others.map(o => ({actor:o.actor, role:o.role, lat:o.lat, lon:o.lon, zoom:o.zoom, page:o.page, at:o.at}))); }, 30000);   // ages tick even without new beats

/* ---------- the chip in the top bar becomes the way in ---------- */
function chip(){ const el = document.querySelector("#appnav .pres"); if(!el) return; const placed = S.others.filter(o => o.gps).length; el.hidden = !auth().actor; el.style.cursor = "pointer"; el.setAttribute("role", "button"); el.setAttribute("tabindex", "0");
  el.querySelector(".n").textContent = placed ? `${S.others.length}·📍${placed}` : String(S.others.length); el.style.whiteSpace = "nowrap"; el.title = T.team; if(!el.__wired){ el.__wired = true; el.addEventListener("click", togglePanel); el.addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); togglePanel(); } }); } }
/* ---------- team panel ---------- */
function togglePanel(){ if(!S.panel){ S.panel = document.createElement("div"); S.panel.id = "teamp"; S.panel.setAttribute("role", "dialog"); S.panel.setAttribute("aria-label", T.team); document.body.appendChild(S.panel); } S.panel.classList.toggle("on"); paintPanel(); }
function distTo(o){ const me = S.fix; if(!me || o.lat == null) return null; return map.distance([me.lat, me.lon], [o.lat, o.lon]); }
function fmtD(d){ return d == null ? "" : d < 1000 ? `${Math.round(d)} m` : `${(d / 1000).toFixed(1)} km`; }
function paintPanel(){ const p = S.panel; if(!p || !p.classList.contains("on")) return; const placed = S.others.filter(o => o.gps).sort((a, b) => age(a) - age(b)); const viewing = S.others.filter(o => !o.gps);
  const chat = window.edrTeamChat; const un = chat ? chat.unread() : 0; const lateN = chat ? chat.overdueNames() : [];
  if(S.tab === "chat" && chat){ p.innerHTML = `<div class="hd"><span>${T.team} · ${S.others.length + 1}</span><button data-x>${T.close}</button></div><div class="tabs"><button data-tab="people">${EN ? "People" : "Pessoas"}</button><button data-tab="chat" class="on">${EN ? "Messages" : "Mensagens"}</button></div><div class="bd" id="chatbody"></div>`; p.querySelector("[data-x]").onclick = () => p.classList.remove("on"); p.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => showTab(b.dataset.tab)); chat.renderInto(p.querySelector("#chatbody")); return; }
  p.innerHTML = `<div class="hd"><span>${T.team} · ${S.others.length + 1}</span><button data-x>${T.close}</button></div>${chat ? `<div class="tabs"><button data-tab="people" class="on">${EN ? "People" : "Pessoas"}</button><button data-tab="chat">${EN ? "Messages" : "Mensagens"}${un ? `<b>${un}</b>` : ""}</button></div>` : ""}<div class="bd">
    <div class="pme"><b>${T.me} · ${auth().actor || "—"}</b><div class="seg">${["on", "brk", "off"].map(d => `<button data-duty="${d}" class="${S.duty === d ? "on" : ""}">${T.duty[d]}</button>`).join("")}</div>
      <label class="sw"><input type="checkbox" data-share ${S.share ? "checked" : ""}><span>${T.share}</span></label>
      <div class="muted">${S.share && S.duty === "on" ? `${T.sharingOn}${S.fix ? ` · ±${Math.round(S.fix.acc)} m` : ""}` : T.sharingOff}</div></div>
    ${placed.length ? `<div class="sec">📍 ${placed.length}</div>` + placed.map(o => { const fr = fresh(o); const t = o.task ? tasks().find(x => x.id === o.task) : null; return `<div class="p" data-p="${o.actor}"><div class="av ${fr}" style="background:${colour(o.actor)}">${initials(o.actor)}</div><div><b>${o.actor}${lateN.includes(o.actor) ? ` <span style="color:#ffb347">⏰</span>` : ""}</b><small>${T.duty[o.duty] || ""} · ${ageText(o)}${o.acc ? ` · ±${Math.round(o.acc)} m` : ""}${t ? ` · ${t.title.slice(0, 26)}` : ""}</small></div><div class="r">${fmtD(distTo(o))}</div></div>`; }).join("") : `<div class="muted">${T.nobody}</div>`}
    ${viewing.length ? `<div class="sec">${T.online}</div>` + viewing.map(o => `<div class="p" data-p="${o.actor}"><div class="av" style="background:${colour(o.actor)};opacity:.6">${initials(o.actor)}</div><div><b>${o.actor}</b><small>${T.tasks(openTasksOf(o.actor).length)}</small></div><div class="r"></div></div>`).join("") : ""}</div>`;
  p.querySelector("[data-x]").onclick = () => p.classList.remove("on");
  p.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => showTab(b.dataset.tab));
  p.querySelectorAll("[data-duty]").forEach(b => b.onclick = () => setDuty(b.dataset.duty)); p.querySelector("[data-share]").onchange = e => setShare(e.target.checked);
  p.querySelectorAll("[data-p]").forEach(r => r.onclick = () => openCard(r.dataset.p)); }
/* ---------- person card ---------- */
const SHEET = matchMedia("(max-width:700px), ((pointer:coarse) and (max-width:1366px))");
function openCard(name, refresh){
  const o = S.others.find(x => x.actor === name); if(!o){ closeCard(); return; } S.card = name;
  const fromPanel = !refresh && SHEET.matches && S.panel && S.panel.classList.contains("on"); if(fromPanel){ S.panel.classList.remove("on"); S.backToPanel = true; } else if(!refresh) S.backToPanel = S.backToPanel && SHEET.matches;
  let c = document.getElementById("pcard"); if(!c){ c = document.createElement("div"); c.id = "pcard"; c.setAttribute("role", "dialog"); document.body.appendChild(c); }
  const t = o.task ? tasks().find(x => x.id === o.task) : null; const open = openTasksOf(o.actor); const fr = o.gps ? fresh(o) : null;
  c.innerHTML = `<button class="x" aria-label="${T.close}">✕</button>${S.backToPanel ? `<button class="bk" data-back>← ${T.team}</button>` : ""}<div class="top"><div class="av" style="background:${colour(o.actor)}">${initials(o.actor)}</div><div><b>${o.actor}</b><small>${o.gps ? `${T.duty[o.duty] || ""} · ${ageText(o)}` : T.online}</small></div></div>
    ${fr === "stale" ? `<div class="warn">⚠ ${T.stale}</div>` : ""}${window.edrTeamChat && edrTeamChat.overdueNames().includes(o.actor) ? `<div class="warn">⏰ ${EN ? "Check-in overdue" : "Check-in em atraso"}</div>` : ""}
    <div class="facts">${o.gps ? `<div><span>${T.acc}</span>±${Math.round(o.acc || 0)} m${o.rtk ? ` · ${T.rtk}` : ""}</div><div><span>${T.dist}</span>${fmtD(distTo(o)) || "—"}</div>` : ""}${o.battery != null ? `<div><span>${T.battery}</span>${o.battery}%</div>` : ""}<div><span>${T.task}</span>${t ? t.title : T.noTask}</div><div><span>${EN ? "Open tasks" : "Tarefas abertas"}</span>${open.length}</div></div>
    <div class="acts">${o.gps ? `<button class="ok" data-a="assign">＋ ${T.assign}</button><button data-a="route">🥾 ${T.route}</button><button data-a="centre">◎ ${T.centre}</button>` : `<button class="ok" data-a="assign">＋ ${EN ? "Assign a task" : "Atribuir tarefa"}</button>`}<button data-a="msg">💬 ${T.message}</button>${t ? `<button data-a="task">📋 ${EN ? "Their task" : "A tarefa"}</button>` : ""}</div>`;
  c.classList.add("on"); if(refresh) return;
  c.querySelector(".x").onclick = closeCard; const bk = c.querySelector("[data-back]"); if(bk) bk.onclick = () => { closeCard(); togglePanel(); };
  c.querySelectorAll("[data-a]").forEach(b => b.onclick = () => { const a = b.dataset.a; const ll = o.gps ? L.latLng(o.lat, o.lon) : null;
    if(a === "assign" && window.edrTasks){ closeCard(); edrTasks.newTask({assignee:o.actor, latlng:ll, title:""}); }
    if(a === "route" && window.edrEdit && edrEdit.routeTo){ closeCard(); edrEdit.routeTo(ll); }
    if(a === "centre"){ map.setView(ll, Math.max(map.getZoom(), 18)); }
    if(a === "task" && t && window.edrTasks){ closeCard(); edrTasks.open(t.id); }
    if(a === "msg"){ const where = ll ? ` (${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)})` : ""; const text = `@${o.actor} — ${auth().actor}${where}: `; if(window.edrTeamChat && edrTeamChat.compose) edrTeamChat.compose(o.actor, text); else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank"); } });
}
function showTab(t){ S.tab = t; if(!S.panel || !S.panel.classList.contains("on")) togglePanel(); else paintPanel(); }
function closeCard(){ S.card = null; S.backToPanel = false; const c = document.getElementById("pcard"); if(c) c.classList.remove("on"); }
document.addEventListener("keydown", e => { if(e.key === "Escape"){ closeCard(); if(S.panel) S.panel.classList.remove("on"); } });
/* ---------- start ---------- */
if(S.share && S.duty === "on") startWatch();
setTimeout(chip, 2500);
window.edrPeople = {payload, render, openCard, togglePanel, showTab, setDuty, setShare, state:S, _decode:decode, _encode:encode};
})();
