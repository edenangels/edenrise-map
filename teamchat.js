// EdenRise map — the team channel: messages, announcements that must be confirmed, check-ins, SOS and shift handover.
//
// One record per property ("team:<site>") holds the conversation as timeline notes, so it needs no new server code,
// it keeps author and time, and it survives on any device. Kinds: msg, aviso (announcement: everyone confirms),
// ack (a confirmation; text = the id it confirms), checkin (I'm OK until HH:MM), sos (emergency, with position),
// turno (shift handover). Positions travel in the text — the worker drops lat/lon on notes.
//
// Delivery is shown honestly: ⏳ waiting on this device, ✓ on the server, ✓✓ confirmed by named people. Nothing is
// marked delivered that has not reached the server; nothing is marked seen that nobody confirmed.
(function(){
if(typeof map === "undefined") return;
const EN = (typeof LANG !== "undefined") && LANG === "en";
const API = "https://edenrise-brain.edenrise.workers.dev"; const SITE = (typeof SITE_ID !== "undefined") ? SITE_ID : "edenrise"; const FID = "team:" + SITE;
const T = EN ? {tab:"Messages", people:"People", write:"Message the team… use @Name to mention", send:"Send", aviso:"Announcement — everyone confirms", seen:"Confirm", seenBy:"confirmed by", waiting:"waiting", queued:"waiting to send", sent:"sent", none:"No messages yet.", sos:"SOS", sosQ:"Send an emergency alert with your position to the whole team?", sosSent:"Emergency alert sent", sosGot:"EMERGENCY", sosAck:"I'm on it", sosShow:"Show on map", sosRoute:"Walk there", checkin:"Check in", checkinEvery:"Next check-in in", checkinDone:"Checked in", overdue:"check-in overdue", min:"min", handover:"Shift handover", handoverPost:"Post handover", handoverTitle:"Handover", mentioned:n=>`${n} mentioned you`, newMsg:"New message", ok:"OK", until:"until", noFix:"No GPS fix — alert sent without a position"}
             : {tab:"Mensagens", people:"Pessoas", write:"Mensagem para a equipa… usa @Nome para chamar alguém", send:"Enviar", aviso:"Aviso — todos confirmam", seen:"Confirmar", seenBy:"confirmado por", waiting:"falta", queued:"por enviar", sent:"enviado", none:"Ainda sem mensagens.", sos:"SOS", sosQ:"Enviar um alerta de emergência com a tua posição a toda a equipa?", sosSent:"Alerta de emergência enviado", sosGot:"EMERGÊNCIA", sosAck:"Vou a caminho", sosShow:"Ver no mapa", sosRoute:"Ir até lá", checkin:"Check-in", checkinEvery:"Próximo check-in em", checkinDone:"Check-in feito", overdue:"check-in em atraso", min:"min", handover:"Passagem de turno", handoverPost:"Publicar passagem", handoverTitle:"Passagem de turno", mentioned:n=>`${n} chamou-te`, newMsg:"Nova mensagem", ok:"OK", until:"até", noFix:"Sem GPS — alerta enviado sem posição"};
const auth = () => window.edrAuth || {key:"", role:"viewer", actor:""};
const say = m => window.toast && toast(m);
const esc = x => String(x == null ? "" : x).replace(/[<>&"]/g, c => ({"<":"&lt;", ">":"&gt;", "&":"&amp;", '"':"&quot;"}[c]));
const hdr = () => ({"Content-Type":"application/json", ...(auth().key ? {"X-Role-Key":auth().key} : {})});
const K_Q = "edr_chat_q", K_SEEN = "edr_chat_seen", K_CHECK = "edr_checkin_min";
const S = {notes:[], loaded:false, timer:null, sosShown:new Set(), mentionShown:new Set(), host:null};
const qget = () => { try{ return JSON.parse(localStorage.getItem(K_Q) || "[]"); }catch(e){ return []; } };
const qset = a => { try{ localStorage.setItem(K_Q, JSON.stringify(a)); }catch(e){} };

/* ---------- transport ---------- */
async function load(){ try{ const d = await fetch(`${API}/item/${encodeURIComponent(FID)}`).then(r => r.json()); S.notes = (d.notes || []).sort((a, b) => String(a.at).localeCompare(String(b.at))); S.loaded = true; }catch(e){} await flush(); react(); paint(); }
async function post(kind, text){ const a = auth(); const item = {kind, text, actor:a.actor, site:SITE, local:"L" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at:new Date().toISOString()};
  try{ const r = await fetch(`${API}/item/${encodeURIComponent(FID)}/notes`, {method:"POST", headers:hdr(), body:JSON.stringify({text, kind, actor:a.actor, site:SITE})}); if(!r.ok) throw new Error(r.status); await load(); return true; }
  catch(e){ qset([...qget(), item]); paint(); return false; } }
async function flush(){ const q = qget(); if(!q.length || !navigator.onLine || !auth().key) return; const left = [];
  for(const it of q){ try{ const r = await fetch(`${API}/item/${encodeURIComponent(FID)}/notes`, {method:"POST", headers:hdr(), body:JSON.stringify({text:it.text, kind:it.kind, actor:it.actor, site:SITE})}); if(!r.ok) left.push(it); }catch(e){ left.push(it); } }
  qset(left); if(left.length < q.length){ try{ const d = await fetch(`${API}/item/${encodeURIComponent(FID)}`).then(r => r.json()); S.notes = (d.notes || []).sort((a, b) => String(a.at).localeCompare(String(b.at))); }catch(e){} } }
function schedule(){ clearInterval(S.timer); S.timer = setInterval(() => { if(!document.hidden && auth().key) load(); }, isOpen() ? 15000 : 45000); }
document.addEventListener("visibilitychange", () => { if(!document.hidden && auth().key) load(); });
window.addEventListener("online", () => load());

/* ---------- reading the channel ---------- */
const msgs = () => S.notes.filter(n => n.kind !== "ack");
const acksOf = id => S.notes.filter(n => n.kind === "ack" && String(n.text) === String(id));
function team(){ const names = new Set(); const since = Date.now() - 14 * 86400000; for(const n of S.notes) if(Date.parse(n.at) > since && n.by) names.add(n.by);
  try{ for(const o of (window.edrPeople ? edrPeople.state.others : [])) names.add(o.actor); }catch(e){} names.delete(""); return [...names]; }
const mentions = (text, name) => !!name && new RegExp("@" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(String(text || ""));
const needsAck = n => n.kind === "aviso" || n.kind === "sos" || mentions(n.text, auth().actor);
function lastSeen(){ return +(localStorage.getItem(K_SEEN) || 0); }
function unread(){ const me = auth().actor, ls = lastSeen(); return msgs().filter(n => n.by !== me && +n.id > ls).length; }
function markSeen(){ const ids = msgs().map(n => +n.id).filter(Boolean); if(ids.length) try{ localStorage.setItem(K_SEEN, String(Math.max(...ids))); }catch(e){} badge(); }
const coordsOf = t => { const m = /📍\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)(?:\s*±(\d+))?/.exec(String(t || "")); return m ? {lat:+m[1], lon:+m[2], acc:m[3] ? +m[3] : null} : null; };
/* ---------- check-ins: everyone on duty says they're OK; late ones are flagged for all ---------- */
function checkins(){ const out = new Map(); for(const n of S.notes) if(n.kind === "checkin"){ const m = /\|due=(\d+)/.exec(n.text); out.set(n.by, {at:Date.parse(n.at), due:m ? +m[1] * 1000 : null, text:n.text}); } return out; }
function overdueNames(){ const now = Date.now(), out = []; for(const [name, c] of checkins()) if(c.due && now > c.due + 10 * 60000 && !isOffDuty(name)) out.push(name); return out; }
function isOffDuty(name){ try{ const o = (window.edrPeople ? edrPeople.state.others : []).find(x => x.actor === name); return o && o.duty && o.duty !== "on"; }catch(e){ return false; } }
async function checkIn(){ const minutes = +(localStorage.getItem(K_CHECK) || 60); const due = Date.now() + minutes * 60000; const hh = new Date(due).toLocaleTimeString(EN ? "en-GB" : "pt-PT", {hour:"2-digit", minute:"2-digit"});
  await post("checkin", `✅ ${T.ok} · ${T.until} ${hh}|due=${Math.round(due / 1000)}`); say(T.checkinDone); remind(due); }
let remindT = null; function remind(due){ clearTimeout(remindT); const ms = due - Date.now() - 5 * 60000; if(ms > 0) remindT = setTimeout(() => { say(`⏰ ${T.checkin}`); if(navigator.vibrate) navigator.vibrate([200, 100, 200]); }, ms); }
/* ---------- SOS ---------- */
async function sos(){ if(!confirm(T.sosQ)) return; const pos = await new Promise(res => { if(!navigator.geolocation) return res(null); navigator.geolocation.getCurrentPosition(p => res(p.coords), () => res(null), {enableHighAccuracy:true, timeout:8000, maximumAge:15000}); });
  const where = pos ? ` 📍${pos.latitude.toFixed(6)},${pos.longitude.toFixed(6)} ±${Math.round(pos.accuracy || 0)}` : ""; if(!pos) say(T.noFix);
  const ok = await post("sos", `🆘 ${auth().actor}${where}`); say(ok ? T.sosSent : `${T.sosSent} — ${T.queued}`); }
/* ---------- reactions to what arrived ---------- */
function react(){ const me = auth().actor; if(!me) return; badge();
  for(const n of S.notes){ if(n.by === me) continue;
    if(n.kind === "sos" && !acksOf(n.id).some(a => a.by === me) && Date.now() - Date.parse(n.at) < 6 * 3600000 && !S.sosShown.has(n.id)){ S.sosShown.add(n.id); alarm(n); }
    if((n.kind === "aviso" || mentions(n.text, me)) && +n.id > lastSeen() && !S.mentionShown.has(n.id)){ S.mentionShown.add(n.id); say(n.kind === "aviso" ? `📣 ${n.by}: ${String(n.text).slice(0, 80)}` : `💬 ${T.mentioned(n.by)}: ${String(n.text).slice(0, 80)}`); } } }
function alarm(n){ const c = coordsOf(n.text); let el = document.getElementById("sosalarm"); if(!el){ el = document.createElement("div"); el.id = "sosalarm"; document.body.appendChild(el); }
  el.innerHTML = `<div class="box"><div class="h">🆘 ${T.sosGot}</div><div class="w">${esc(n.by)} · ${new Date(n.at).toLocaleTimeString(EN ? "en-GB" : "pt-PT", {hour:"2-digit", minute:"2-digit"})}${c && c.acc != null ? ` · ±${c.acc} m` : ""}</div><div class="r">${c ? `<button data-a="show">◎ ${T.sosShow}</button><button data-a="route">🥾 ${T.sosRoute}</button>` : ""}<button class="ok" data-a="ack">✓ ${T.sosAck}</button></div></div>`; el.classList.add("on");
  if(navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 400]);
  el.querySelectorAll("[data-a]").forEach(b => b.onclick = async () => { const a = b.dataset.a; if(a === "show" && c){ map.setView([c.lat, c.lon], 18); L.circle([c.lat, c.lon], {radius:c.acc || 15, color:"#d9534f", weight:3, fillOpacity:.2}).addTo(map); }
    if(a === "route" && c && window.edrEdit && edrEdit.routeTo) edrEdit.routeTo(L.latLng(c.lat, c.lon)); if(a === "ack"){ await post("ack", String(n.id)); el.classList.remove("on"); } else el.classList.remove("on"); }); }
/* ---------- handover: what happened since the last one, drafted from the records ---------- */
async function draftHandover(){ const me = auth().actor; const prev = [...S.notes].reverse().find(n => n.kind === "turno"); const since = prev ? Date.parse(prev.at) : Date.now() - 12 * 3600000; const fmt = d => new Date(d).toLocaleString(EN ? "en-GB" : "pt-PT", {day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit"});
  const tasks = (window.edrTasks && edrTasks.all) ? edrTasks.all() : []; const inRange = t => t && Date.parse(t) >= since;
  const done = tasks.filter(t => t.status === "feita" && inRange(t.done_at)); const opened = tasks.filter(t => inRange(t.created_at)); const open = tasks.filter(t => t.status === "aberta" || t.status === "em curso"); const overdue = open.filter(t => t.due && t.due < new Date().toISOString().slice(0, 10));
  let ev = []; try{ const d = await fetch(`${API}/updates?limit=200&site=${SITE}`).then(r => r.json()); ev = (d.updates || []).filter(u => Date.parse(u.at) >= since); }catch(e){}
  const problems = ev.filter(u => u.action === "note.add" && u.payload && u.payload.kind === "problema"); const props = ev.filter(u => u.action === "feature.add"); const photos = ev.filter(u => u.action === "media.add");
  const sosN = S.notes.filter(n => n.kind === "sos" && Date.parse(n.at) >= since); const late = overdueNames();
  const L = []; L.push(`${T.handoverTitle} · ${me} · ${fmt(since)} → ${fmt(Date.now())}`);
  L.push(""); L.push(`✓ ${EN ? "Done" : "Feito"} (${done.length})`); done.slice(0, 12).forEach(t => L.push(`  • ${t.title}${t.done_by ? " — " + t.done_by : ""}`));
  L.push(`＋ ${EN ? "New tasks" : "Novas tarefas"} (${opened.length})`); opened.slice(0, 12).forEach(t => L.push(`  • ${t.title}${t.assignee ? " → " + t.assignee : ""}`));
  L.push(`⏳ ${EN ? "Still open" : "Em aberto"} (${open.length})${overdue.length ? ` · ${overdue.length} ${EN ? "overdue" : "em atraso"}` : ""}`); overdue.slice(0, 8).forEach(t => L.push(`  ! ${t.title}${t.assignee ? " → " + t.assignee : ""} (${t.due})`));
  if(problems.length){ L.push(`⚠ ${EN ? "Problems reported" : "Problemas reportados"} (${problems.length})`); problems.slice(0, 8).forEach(u => L.push(`  • ${String(u.payload.text || "").slice(0, 90)} — ${u.actor}`)); }
  L.push(`✎ ${EN ? "Proposals" : "Propostas"}: ${props.length} · 📷 ${photos.length}`); if(sosN.length) L.push(`🆘 SOS: ${sosN.length}`); if(late.length) L.push(`⏰ ${T.overdue}: ${late.join(", ")}`);
  L.push(""); L.push(EN ? "Notes for the next shift:" : "Notas para o próximo turno:"); return L.join("\n"); }
/* ---------- ui (inside the team panel) ---------- */
const css = document.createElement("style"); css.textContent = `
#teamp .tabs{display:flex;gap:6px;padding:0 12px 6px} #teamp .tabs button{flex:1;min-height:38px;border-radius:10px;border:1px solid rgba(241,233,216,.2);background:transparent;color:#f1e9d8;font:700 12.5px var(--ui);cursor:pointer} #teamp .tabs button.on{background:rgba(241,233,216,.12);border-color:#c9a227} #teamp .tabs b{background:#e07b39;color:#1c1813;border-radius:9px;padding:1px 6px;font:700 10px var(--mono);margin-left:6px}
#teamp .chat{display:flex;flex-direction:column;gap:8px} #teamp .m{border:1px solid rgba(241,233,216,.1);border-radius:12px;padding:8px 10px;display:flex;flex-direction:column;gap:4px} #teamp .m.mine{background:rgba(201,162,39,.08);border-color:rgba(201,162,39,.35)} #teamp .m.aviso{border-color:#c9a227;background:rgba(201,162,39,.12)} #teamp .m.sos{border-color:#d9534f;background:rgba(217,83,79,.15)} #teamp .m.checkin{opacity:.8} #teamp .m.turno{border-color:#7f9a6a}
#teamp .m .mh{display:flex;gap:6px;align-items:baseline;font:700 12px var(--ui)} #teamp .m .mh small{font:500 10.5px var(--mono);opacity:.6;margin-left:auto} #teamp .m .mt{font:500 13px var(--ui);white-space:pre-wrap;word-break:break-word} #teamp .m .mt .at{color:#c9a227;font-weight:700}
#teamp .m .mf{display:flex;gap:6px;align-items:center;flex-wrap:wrap;font:600 11px var(--ui);opacity:.85} #teamp .m .mf button{min-height:30px;border-radius:15px;border:1px solid #5be0a0;background:transparent;color:#5be0a0;font:700 11px var(--ui);padding:0 10px;cursor:pointer}
#teamp .compose{display:flex;flex-direction:column;gap:6px;border-top:1px solid rgba(241,233,216,.12);padding-top:8px;position:sticky;bottom:0;z-index:2;background:#1c1813;padding-bottom:4px} #teamp .compose textarea{border-radius:10px;border:1px solid rgba(241,233,216,.2);background:rgba(0,0,0,.3);color:#f1e9d8;padding:10px 12px;font:500 14px var(--ui);min-height:64px;resize:vertical} #teamp .compose .row{display:flex;gap:6px;align-items:center;flex-wrap:wrap} #teamp .compose .row button{min-height:42px;border-radius:10px;border:1px solid rgba(241,233,216,.25);background:transparent;color:#f1e9d8;font:700 13px var(--ui);padding:0 14px;cursor:pointer} #teamp .compose .row button.ok{background:#c9a227;color:#1c1813;border-color:#c9a227;margin-left:auto} #teamp .compose .names{display:flex;gap:4px;flex-wrap:wrap} #teamp .compose .names button{min-height:28px;border-radius:14px;border:1px solid rgba(241,233,216,.2);background:transparent;color:#c9a227;font:600 11px var(--ui);padding:0 9px;cursor:pointer} #teamp .compose label{display:flex;flex-direction:row;align-items:center;gap:6px;font:600 12px var(--ui)}
#teamp .safety{display:flex;gap:6px;position:sticky;top:0;z-index:2;background:#1c1813;padding:2px 0 8px;box-shadow:0 6px 10px -6px rgba(0,0,0,.6)} #teamp .safety button{flex:1;min-height:44px;border-radius:12px;border:1px solid rgba(241,233,216,.25);background:transparent;color:#f1e9d8;font:700 13px var(--ui);cursor:pointer} #teamp .safety button.sos{border-color:#d9534f;color:#fff;background:#b53b37} #teamp .safety select{min-height:44px;border-radius:12px;border:1px solid rgba(241,233,216,.2);background:rgba(0,0,0,.3);color:#f1e9d8;font:600 12px var(--ui);padding:0 8px}
#teamp .late{font:700 12px var(--ui);color:#ffb347}
#sosalarm{position:fixed;inset:0;z-index:9000;background:rgba(150,20,20,.92);display:none;align-items:center;justify-content:center;padding:20px} #sosalarm.on{display:flex} #sosalarm .box{background:#1c1813;color:#fff;border:3px solid #d9534f;border-radius:18px;padding:22px;max-width:420px;width:100%;display:flex;flex-direction:column;gap:12px;text-align:center} #sosalarm .h{font:900 28px var(--ui);color:#ff6b6b;letter-spacing:.05em} #sosalarm .w{font:600 16px var(--ui)} #sosalarm .r{display:grid;grid-template-columns:1fr 1fr;gap:8px} #sosalarm .r button{min-height:52px;border-radius:12px;border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;font:800 14px var(--ui);cursor:pointer} #sosalarm .r button.ok{grid-column:1 / -1;background:#5be0a0;color:#0b1a20;border-color:#5be0a0}`;
document.head.appendChild(css);
const isOpen = () => !!(S.host && document.body.contains(S.host) && S.host.closest("#teamp.on") && !document.hidden);   // only an open, visible channel counts as read
function mark(text){ return esc(text).replace(/\|due=\d+/, "").replace(/📍\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)(\s*±\d+)?/, (m, a, b, c) => `📍${c ? c.trim() + " m" : ""}`).replace(/@([\wÀ-ÿ.-]+)/g, '<span class="at">@$1</span>'); }
function statusLine(n){ if(n.queued) return `⏳ ${T.queued}`; const acks = acksOf(n.id); const by = [...new Set(acks.map(a => a.by))]; if(n.kind === "aviso" || n.kind === "sos"){ const waitingFor = team().filter(x => x !== n.by && !by.includes(x)); return `✓ ${T.sent}${by.length ? ` · ✓✓ ${T.seenBy} ${by.join(", ")}` : ""}${waitingFor.length ? ` · ${T.waiting}: ${waitingFor.join(", ")}` : ""}`; } return `✓ ${T.sent}${by.length ? ` · ✓✓ ${by.join(", ")}` : ""}`; }
function renderInto(host){ S.host = host; schedule(); if(!S.loaded) load(); paint(); }
function paint(){ const host = S.host; if(!isOpen()) return; const me = auth().actor; const leader = auth().role === "leader";
  const list = [...msgs().slice(-60), ...qget().map(q => ({...q, by:q.actor, id:q.local, queued:true}))];
  const late = overdueNames(); const mins = +(localStorage.getItem(K_CHECK) || 60); const myC = checkins().get(me);
  host.innerHTML = `<div class="safety"><button data-a="checkin">✅ ${T.checkin}</button><select data-a="every" aria-label="${T.checkinEvery}">${[30, 60, 90, 120, 240].map(m => `<option value="${m}" ${m === mins ? "selected" : ""}>${m} ${T.min}</option>`).join("")}</select><button class="sos" data-a="sos">🆘 ${T.sos}</button></div>
    ${myC && myC.due ? `<div class="late" style="color:${Date.now() > myC.due ? "#ffb347" : "#7f9a6a"}">${T.checkin}: ${T.until} ${new Date(myC.due).toLocaleTimeString(EN ? "en-GB" : "pt-PT", {hour:"2-digit", minute:"2-digit"})}</div>` : ""}
    ${late.length ? `<div class="late">⏰ ${T.overdue}: ${late.map(esc).join(", ")}</div>` : ""}
    <div class="chat">${list.length ? list.map(n => { const ack = !n.queued && n.by !== me && needsAck(n) && !acksOf(n.id).some(a => a.by === me); const c = n.kind === "sos" ? coordsOf(n.text) : null;
      return `<div class="m ${n.by === me ? "mine" : ""} ${n.kind}"><div class="mh">${esc(n.by)}${n.kind === "aviso" ? " · 📣" : n.kind === "turno" ? ` · 📋 ${T.handoverTitle}` : ""}<small>${new Date(n.at).toLocaleString(EN ? "en-GB" : "pt-PT", {day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit"})}</small></div><div class="mt">${mark(n.text)}</div><div class="mf"><span>${statusLine(n)}</span>${ack ? `<button data-ack="${n.id}">✓ ${n.kind === "sos" ? T.sosAck : T.seen}</button>` : ""}${c ? `<button data-show="${c.lat},${c.lon}">◎ ${T.sosShow}</button>` : ""}</div></div>`; }).join("") : `<div class="muted">${T.none}</div>`}</div>
    <div class="compose"><div class="names">${team().filter(x => x !== me).slice(0, 12).map(x => `<button data-at="${esc(x)}">@${esc(x)}</button>`).join("")}</div><textarea data-a="text" placeholder="${T.write}"></textarea><div class="row">${leader ? `<label><input type="checkbox" data-a="aviso"> ${T.aviso}</label>` : ""}<button data-a="handover">📋 ${T.handover}</button><button class="ok" data-a="send">${T.send}</button></div></div>`;
  const ta = host.querySelector('[data-a="text"]'); if(S.draft){ ta.value = S.draft; } ta.oninput = () => { S.draft = ta.value; };
  host.querySelectorAll("[data-at]").forEach(b => b.onclick = () => { ta.value = (ta.value ? ta.value.replace(/\s*$/, " ") : "") + "@" + b.dataset.at + " "; S.draft = ta.value; ta.focus(); });
  host.querySelector('[data-a="send"]').onclick = async () => { const text = ta.value.trim(); if(!text) return; const kind = (host.querySelector('[data-a="aviso"]') || {}).checked ? "aviso" : (S.handoverDraft && text.startsWith(T.handoverTitle) ? "turno" : "msg"); ta.value = ""; S.draft = ""; S.handoverDraft = false; await post(kind, text); };
  host.querySelector('[data-a="handover"]').onclick = async () => { ta.value = await draftHandover(); S.draft = ta.value; S.handoverDraft = true; ta.style.minHeight = "220px"; ta.focus(); };
  host.querySelector('[data-a="checkin"]').onclick = () => checkIn(); host.querySelector('[data-a="sos"]').onclick = () => sos();
  host.querySelector('[data-a="every"]').onchange = e => { try{ localStorage.setItem(K_CHECK, e.target.value); }catch(err){} };
  host.querySelectorAll("[data-ack]").forEach(b => b.onclick = () => post("ack", b.dataset.ack));
  host.querySelectorAll("[data-show]").forEach(b => b.onclick = () => { const [la, lo] = b.dataset.show.split(",").map(Number); map.setView([la, lo], 18); });
  const chat = host.querySelector(".chat"); if(chat && chat.lastElementChild) chat.lastElementChild.scrollIntoView({block:"nearest"}); markSeen(); }
function badge(){ const n = unread(); const late = overdueNames().length; const el = document.querySelector("#appnav .pres"); if(!el) return; let b = el.querySelector(".chatn"); if(!b){ b = document.createElement("b"); b.className = "chatn"; b.style.cssText = "margin-left:6px;border-radius:9px;padding:1px 6px;font:700 10px var(--mono);color:#1c1813"; el.appendChild(b); } b.textContent = late ? `⏰${late}` : n ? `💬${n}` : ""; b.style.background = late ? "#ffb347" : "#e07b39"; b.hidden = !(n || late); }
function compose(name, text){ if(window.edrPeople){ if(!document.querySelector("#teamp.on")) edrPeople.togglePanel(); edrPeople.showTab && edrPeople.showTab("chat"); } S.draft = text || (name ? `@${name} ` : ""); paint(); const ta = S.host && S.host.querySelector('[data-a="text"]'); if(ta) ta.focus(); }
setTimeout(() => { if(auth().key) load(); schedule(); }, 5000);
let lastKey = null; setInterval(() => { const k = auth().key + "|" + auth().actor; if(k !== lastKey){ lastKey = k; if(auth().key) load(); } }, 5000);
window.edrTeamChat = {renderInto, load, post, compose, unread, overdueNames, checkins, draftHandover, sos, checkIn, state:S, _alarm:alarm};
})();
