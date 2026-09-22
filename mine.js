// EdenRise map — "Os meus": what I marked, what happened to it, and a nudge when it changes.
// Closes the field loop: a proposal used to go in and vanish. Now the author sees its status here, gets a toast when a
// leader approves, rejects or comments, and can jump back to the item with one tap. Polls the same worker feed the map
// already uses; nothing new on the server.
(function(){
if(typeof map === "undefined") return;
const EN = (typeof LANG !== "undefined") && LANG === "en";
const API = "https://edenrise-brain.edenrise.workers.dev"; const SITE = (typeof SITE_ID !== "undefined") ? SITE_ID : "edenrise";
const T = EN ? {btn:"Mine", title:"My items", none:"Nothing marked yet. Anything you propose shows up here with its status.", signin:"Sign in (EDIT → key) to see your items.",
  st:{proposto:"proposed", aprovado:"approved", rejeitado:"rejected", reportado:"reported", resolvido:"resolved", retirado:"retired"}, changed:(n,s)=>`"${n}" is now ${s}`, by:"by", refresh:"Refresh", close:"Close", go:"Show on map", recent:"Recent changes"}
             : {btn:"Meus", title:"Os meus itens", none:"Ainda não marcaste nada. O que propuseres aparece aqui com o estado.", signin:"Entra (EDITAR → chave) para ver os teus itens.",
  st:{proposto:"proposto", aprovado:"aprovado", rejeitado:"rejeitado", reportado:"reportado", resolvido:"resolvido", retirado:"retirado"}, changed:(n,s)=>`"${n}" passou a ${s}`, by:"por", refresh:"Atualizar", close:"Fechar", go:"Ver no mapa", recent:"Alterações recentes"};
const COL = {proposto:"#c9a227", aprovado:"#7f9a6a", rejeitado:"#6b6157", reportado:"#e07b39", resolvido:"#7f9a6a", retirado:"#6b6157"};
const K_ST = "edr_my_status", K_EV = "edr_my_events";
const auth = () => window.edrAuth || {key:"", role:"viewer", actor:""};
const say = m => window.toast && toast(m);
const get = (k, d) => { try{ return JSON.parse(localStorage.getItem(k) || "null") ?? d; }catch(e){ return d; } };
const set = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
let mine = [], events = get(K_EV, []), unread = 0, timer = null;

const css = document.createElement("style"); css.textContent = `
#minebtn{position:absolute;right:14px;top:calc(var(--nav-h,52px) + 14px);z-index:1450;height:38px;border-radius:19px;border:1px solid var(--line-2,#3a342c);background:rgba(28,24,19,.92);color:#f1e9d8;font:700 12px var(--ui);padding:0 12px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35)}
#minebtn[hidden]{display:none} #minebtn b{display:inline-block;min-width:18px;height:18px;border-radius:9px;background:#e07b39;color:#1c1813;font:700 11px var(--mono);line-height:18px;text-align:center;margin-left:6px}
#minebtn b:empty{display:none}
@media (max-width:700px){ #minebtn{top:auto;bottom:calc(var(--mbar,64px) + 62px);right:12px} }
#minesheet{position:fixed;left:0;right:0;bottom:0;z-index:1900;max-height:78vh;background:#1c1813;color:#f1e9d8;border-radius:18px 18px 0 0;box-shadow:0 -10px 30px rgba(0,0,0,.5);display:flex;flex-direction:column;transform:translateY(105%);transition:transform .25s}
#minesheet.open{transform:none} @media (min-width:701px){ #minesheet{left:auto;right:14px;bottom:14px;width:380px;border-radius:18px} }
#minesheet .hd{display:flex;justify-content:space-between;align-items:center;padding:14px 16px 8px;font:700 15px var(--ui)} #minesheet .hd button{height:36px;border-radius:18px;border:1px solid var(--line-2,#3a342c);background:transparent;color:#f1e9d8;font:600 12px var(--ui);padding:0 12px;cursor:pointer;margin-left:6px}
#minesheet .bd{overflow-y:auto;padding:0 12px 16px;display:flex;flex-direction:column;gap:6px}
#minesheet .it{display:flex;gap:10px;align-items:center;padding:10px 10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);cursor:pointer;min-height:54px}
#minesheet .it .n{flex:1;font:600 13px var(--ui);line-height:1.25} #minesheet .it .n small{display:block;font:500 11px var(--mono);opacity:.6;margin-top:2px}
#minesheet .pill{font:700 10px var(--mono);letter-spacing:.06em;text-transform:uppercase;border-radius:999px;padding:4px 8px;color:#1c1813;white-space:nowrap}
#minesheet .sec{font:600 10px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:#c9a227;margin:8px 4px 2px} #minesheet .ev{font:500 12px var(--ui);opacity:.85;padding:4px 6px}
#minesheet .empty{padding:20px 10px;font:500 13px var(--ui);opacity:.75;line-height:1.4}`; document.head.appendChild(css);

const btn = document.createElement("button"); btn.id = "minebtn"; btn.type = "button"; btn.hidden = true; btn.innerHTML = `${T.btn}<b></b>`; document.body.appendChild(btn);
const sheet = document.createElement("div"); sheet.id = "minesheet"; sheet.setAttribute("role", "dialog"); document.body.appendChild(sheet);
btn.onclick = () => { sheet.classList.contains("open") ? closeSheet() : openSheet(); };
function openSheet(){ unread = 0; badge(); paint(); sheet.classList.add("open"); poll(true); }
function closeSheet(){ sheet.classList.remove("open"); }
function badge(){ btn.querySelector("b").textContent = unread ? String(unread) : ""; }

async function poll(force){
  const a = auth(); btn.hidden = !a.key || !a.actor; if(btn.hidden) return;
  if(!force && document.hidden) return;
  let feats = []; try{ const d = await fetch(`${API}/features?status=all&site=${SITE}`).then(r => r.json()); feats = d.features || []; }catch(e){ return; }
  let retired = []; try{ const d = await fetch(`${API}/features/retired?site=${SITE}`).then(r => r.json()); retired = (d.retired || []).map(f => ({...f, properties:{...(f.properties || f), status:"retirado"}})); }catch(e){}
  mine = [...feats, ...retired].map(f => f.properties || f).filter(p => p && p.created_by === a.actor);
  const prev = get(K_ST, null); const now = {}; mine.forEach(p => { now[p.id] = p.status || "proposto"; });
  if(prev){ const changes = mine.filter(p => prev[p.id] && prev[p.id] !== now[p.id]);
    for(const p of changes){ const ev = {at:Date.now(), id:p.id, name:p.name || p.preset || p.id, status:now[p.id], by:p.reviewed_by || p.updated_by || ""}; events.unshift(ev); }
    events = events.slice(0, 40); set(K_EV, events);
    if(changes.length){ unread += changes.length; badge(); changes.slice(0, 3).forEach(p => say(`${p.status === "aprovado" ? "✅" : p.status === "rejeitado" ? "✖" : "•"} ${T.changed(p.name || p.preset || p.id, T.st[now[p.id]] || now[p.id])}`)); } }
  set(K_ST, now); if(sheet.classList.contains("open")) paint();
}
function paint(){
  const a = auth();
  if(!a.key || !a.actor){ sheet.innerHTML = `<div class="hd">${T.title}<button data-x>${T.close}</button></div><div class="empty">${T.signin}</div>`; wire(); return; }
  const order = ["proposto", "reportado", "aprovado", "resolvido", "rejeitado", "retirado"]; const byS = {}; mine.forEach(p => (byS[p.status || "proposto"] = byS[p.status || "proposto"] || []).push(p));
  const rows = order.filter(s => byS[s]).map(s => `<div class="sec">${T.st[s] || s} · ${byS[s].length}</div>` + byS[s].sort((x, y) => String(y.updated_at || y.created_at || "").localeCompare(String(x.updated_at || x.created_at || ""))).map(p => `<div class="it" data-id="${p.id}"><div class="n">${(p.name || p.preset || p.id).toString().replace(/</g, "&lt;")}<small>${p.preset || ""} · ${String(p.updated_at || p.created_at || "").slice(0, 16).replace("T", " ")}${p.note ? " · " + String(p.note).slice(0, 60).replace(/</g, "&lt;") : ""}</small></div><span class="pill" style="background:${COL[p.status] || COL.proposto}">${T.st[p.status] || p.status || "proposto"}</span></div>`).join("")).join("");
  const evs = events.length ? `<div class="sec">${T.recent}</div>` + events.slice(0, 8).map(e => `<div class="ev">${new Date(e.at).toLocaleString(EN ? "en-GB" : "pt-PT").slice(0, 17)} · ${T.changed(e.name, T.st[e.status] || e.status)}${e.by ? ` ${T.by} ${e.by}` : ""}</div>`).join("") : "";
  sheet.innerHTML = `<div class="hd"><span>${T.title} · ${mine.length}</span><span><button data-r>${T.refresh}</button><button data-x>${T.close}</button></span></div><div class="bd">${rows || `<div class="empty">${T.none}</div>`}${evs}</div>`; wire();
}
function wire(){
  sheet.querySelector("[data-x]").onclick = closeSheet; const r = sheet.querySelector("[data-r]"); if(r) r.onclick = () => poll(true);
  sheet.querySelectorAll(".it").forEach(el => el.onclick = () => { const p = mine.find(x => String(x.id) === el.dataset.id); if(!p) return; closeSheet();
    const f = (window.edrEdit && edrEdit.feats ? edrEdit.feats() : []).find(x => x.properties && x.properties.id === p.id);
    if(f && f.geometry){ try{ const b = L.geoJSON(f).getBounds(); if(b.isValid()) map.fitBounds(b, {maxZoom:19, padding:[40, 40]}); }catch(e){} }
    if(window.edrEdit && edrEdit.openById && !edrEdit.openById(p.id)) say(EN ? "Item not on the map right now (retired or filtered)" : "Item não está no mapa agora (retirado ou filtrado)"); });
}
function schedule(){ clearInterval(timer); timer = setInterval(() => poll(false), 90000); }
document.addEventListener("visibilitychange", () => { if(!document.hidden) poll(false); });
window.addEventListener("edr-auth", () => poll(true));
setTimeout(() => { poll(true); schedule(); }, 6000);
let lastKey = null; setInterval(() => { const k = auth().key + "|" + auth().actor; if(k !== lastKey){ lastKey = k; poll(true); } }, 5000);   // sign-in later → button appears within seconds
window.edrMine = {open:openSheet, close:closeSheet, poll, items:() => mine, events:() => events};
})();
