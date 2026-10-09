// EdenRise map — "Os meus": what I marked, what happened to it, and a nudge when it changes.
// Closes the field loop: a proposal used to go in and vanish. Now the author sees its status here, gets a toast when a
// leader approves, rejects or comments, and can jump back to the item with one tap. Polls the same worker feed the map
// already uses; nothing new on the server.
(function(){
if(typeof map === "undefined") return;
const EN = (typeof LANG !== "undefined") && LANG === "en";
const API = "https://edenrise-brain.edenrise.workers.dev"; const SITE = (typeof SITE_ID !== "undefined") ? SITE_ID : "edenrise";
const T = EN ? {sync:"Sync", ready:"Ready for the field", online:"online", offline:"offline", edits:"edits waiting", photos:"photos waiting", drafts:"drafts on this device", boards:"board drafts", lastSync:"last sent", lastPull:"last received", never:"never", sendNow:"Send now", exportQ:"Export waiting edits", allSent:"Everything sent", keyOk:"Signed in", keyNo:"Not signed in — nothing can be sent", tiles:"Offline map", tilesNone:"not saved — tap “save offline” in the layers menu", engine:"Board engine cached", engineNo:"Board engine not cached yet (open any board once with signal)", gps:"GPS fix", gpsNo:"no GPS fix yet", fresh:"Data", checking:"checking…", saveOffline:"Save offline now", btn:"Mine", title:"My items", none:"Nothing marked yet. Anything you propose shows up here with its status.", signin:"Sign in (EDIT → key) to see your items.",
  st:{proposto:"proposed", aprovado:"approved", rejeitado:"rejected", reportado:"reported", resolvido:"resolved", retirado:"retired"}, changed:(n,s)=>`"${n}" is now ${s}`, by:"by", refresh:"Refresh", close:"Close", go:"Show on map", recent:"Recent changes"}
             : {sync:"Sincronização", ready:"Pronto para o campo", online:"com rede", offline:"sem rede", edits:"edições por enviar", photos:"fotos por enviar", drafts:"rascunhos neste aparelho", boards:"rascunhos de quadros", lastSync:"último envio", lastPull:"última receção", never:"nunca", sendNow:"Enviar agora", exportQ:"Exportar edições pendentes", allSent:"Tudo enviado", keyOk:"Sessão iniciada", keyNo:"Sem sessão — nada pode ser enviado", tiles:"Mapa offline", tilesNone:"não guardado — toca em “guardar offline” no menu das camadas", engine:"Motor dos quadros em cache", engineNo:"Motor dos quadros ainda não está em cache (abre um quadro com rede)", gps:"Posição GPS", gpsNo:"ainda sem posição GPS", fresh:"Dados", checking:"a verificar…", saveOffline:"Guardar offline agora", btn:"Meus", title:"Os meus itens", none:"Ainda não marcaste nada. O que propuseres aparece aqui com o estado.", signin:"Entra (EDITAR → chave) para ver os teus itens.",
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
@media (max-width:700px), ((pointer:coarse) and (max-width:1366px)){ #minebtn{top:auto;bottom:calc(var(--mbar,64px) + 62px);right:12px} }
#minesheet{position:fixed;left:0;right:0;bottom:0;z-index:1900;max-height:78vh;background:#1c1813;color:#f1e9d8;border-radius:18px 18px 0 0;box-shadow:0 -10px 30px rgba(0,0,0,.5);display:flex;flex-direction:column;transform:translateY(105%);transition:transform .25s}
#minesheet.open{transform:none} @media (min-width:701px){ #minesheet{left:auto;right:14px;bottom:14px;width:380px;border-radius:18px} }
#minesheet .hd{display:flex;justify-content:space-between;align-items:center;padding:14px 16px 8px;font:700 15px var(--ui)} #minesheet .hd button{height:36px;border-radius:18px;border:1px solid var(--line-2,#3a342c);background:transparent;color:#f1e9d8;font:600 12px var(--ui);padding:0 12px;cursor:pointer;margin-left:6px}
#minesheet .bd{overflow-y:auto;padding:0 12px 16px;display:flex;flex-direction:column;gap:6px;min-height:0} #minesheet .bd > *{flex-shrink:0}
#minesheet .it{display:flex;gap:10px;align-items:center;padding:10px 10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);cursor:pointer;min-height:54px}
#minesheet .it .n{flex:1;font:600 13px var(--ui);line-height:1.25} #minesheet .it .n small{display:block;font:500 11px var(--mono);opacity:.6;margin-top:2px}
#minesheet .pill{font:700 10px var(--mono);letter-spacing:.06em;text-transform:uppercase;border-radius:999px;padding:4px 8px;color:#1c1813;white-space:nowrap}
#minesheet .sec{font:600 10px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:#c9a227;margin:8px 4px 2px} #minesheet .ev{font:500 12px var(--ui);opacity:.85;padding:4px 6px}
#minesheet .empty{padding:20px 10px;font:500 13px var(--ui);opacity:.75;line-height:1.4}
#minesheet .sy{display:flex;flex-direction:column;gap:4px;padding:6px 8px 10px;font:500 13px var(--ui)} #minesheet .syrow{display:flex;gap:8px;align-items:center;min-height:26px} #minesheet .syrow b{font:700 15px var(--mono);min-width:26px;text-align:right} #minesheet .syrow.small{font:500 11px var(--mono);opacity:.65} #minesheet .sy .row{display:flex;gap:6px;margin-top:4px} #minesheet .sy button{min-height:38px;border-radius:10px;border:1px solid rgba(241,233,216,.25);background:transparent;color:#f1e9d8;font:600 12px var(--ui);padding:0 12px;cursor:pointer} #minesheet .sy .ok{color:#7f9a6a;font:600 12px var(--ui)} #minesheet .syrow button{min-height:30px;padding:0 10px;font-size:11px}`; document.head.appendChild(css);

const btn = document.createElement("button"); btn.id = "minebtn"; btn.type = "button"; btn.hidden = true; btn.innerHTML = `${T.btn}<b></b>`; document.body.appendChild(btn);
const sheet = document.createElement("div"); sheet.id = "minesheet"; sheet.setAttribute("role", "dialog"); document.body.appendChild(sheet);
btn.onclick = () => { sheet.classList.contains("open") ? closeSheet() : openSheet(); };
function openSheet(){ unread = 0; badge(); paint(); sheet.classList.add("open"); poll(true); }
function closeSheet(){ sheet.classList.remove("open"); }
function badge(){ btn.querySelector("b").textContent = unread ? String(unread) : ""; }

async function poll(force){
  const a = auth(); btn.hidden = !a.key || !a.actor; if(btn.hidden) return; badgePending();
  if(!force && document.hidden) return;
  let feats = []; try{ const d = await fetch(`${API}/features?site=${SITE}`).then(r => r.json()); feats = d.features || []; }catch(e){ return; }
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
  sheet.innerHTML = `<div class="hd"><span>${T.title} · ${mine.length}</span><span><button data-r>${T.refresh}</button><button data-x>${T.close}</button></span></div><div class="bd"><div id="minesync"></div><div id="mineready"></div>${rows || `<div class="empty">${T.none}</div>`}${evs}</div>`; wire(); paintSync(); paintReady();
}
/* ---------- receipts: what is on this device, what reached the server, what is waiting ---------- */
async function syncState(){
  const edits = (window.edrEdit && edrEdit.queued) ? edrEdit.queued() : []; let photos = []; try{ photos = window.edrMediaQueued ? await edrMediaQueued() : []; }catch(e){}
  const drafts = (window.edrEdit && edrEdit.drafts) ? edrEdit.drafts() : []; const notesQ = (window.edrZones && edrZones.queued) ? edrZones.queued() : []; let boards = 0; try{ for(let i = 0; i < localStorage.length; i++) if(localStorage.key(i).startsWith("edr_qb_")) boards++; }catch(e){}
  const fmt = k => { const v = localStorage.getItem(k); return v ? new Date(v).toLocaleString(EN ? "en-GB" : "pt-PT").slice(0, 17) : T.never; };
  return {online:navigator.onLine, edits, photos, notesQ, drafts, boards, lastSync:fmt("edr_last_sync"), lastPull:fmt("edr_last_pull"), key:!!auth().key};
}
async function paintSync(){ const el = sheet.querySelector("#minesync"); if(!el) return; const s = await syncState(); const pending = s.edits.length + s.photos.length + s.notesQ.length;
  el.innerHTML = `<div class="sec">${T.sync} · ${s.online ? T.online : T.offline}</div><div class="sy">
    <div class="syrow"><b>${s.edits.length}</b> ${T.edits}</div><div class="syrow"><b>${s.photos.length}</b> ${T.photos}</div><div class="syrow"><b>${s.notesQ.length}</b> ${EN ? "field records waiting" : "registos de campo por enviar"}</div><div class="syrow"><b>${s.drafts.length}</b> ${T.drafts}</div><div class="syrow"><b>${s.boards}</b> ${T.boards}</div>
    <div class="syrow small">${T.lastSync}: ${s.lastSync} · ${T.lastPull}: ${s.lastPull}</div>
    <div class="syrow small" style="color:${s.key ? "#7f9a6a" : "#e07b39"}">${s.key ? T.keyOk : T.keyNo}</div>
    <div class="row">${pending ? `<button data-send>↑ ${T.sendNow} (${pending})</button><button data-exp>⤓ ${T.exportQ}</button>` : `<span class="ok">✓ ${T.allSent}</span>`}</div></div>`;
  const b = el.querySelector("[data-send]"); if(b) b.onclick = async () => { b.disabled = true; try{ if(window.edrEdit && edrEdit.flushNow) await edrEdit.flushNow(); if(window.edrZones && edrZones.flushNotes) await edrZones.flushNotes(); if(window.edrFlushMedia) await edrFlushMedia(); }catch(e){} paintSync(); badgePending(); };
  const x = el.querySelector("[data-exp]"); if(x) x.onclick = () => { const fc = {type:"FeatureCollection", features:s.edits.map(it => ({type:"Feature", properties:{...(it.body || {}), geometry:undefined, _path:it.path, _method:it.method}, geometry:(it.body || {}).geometry || null}))}; const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(fc, null, 1)], {type:"application/geo+json"})); a.download = `edenrise-pendentes-${new Date().toISOString().slice(0, 10)}.geojson`; a.click(); };
  badgePending(s); }
async function badgePending(s){ s = s || await syncState(); const n = s.edits.length + s.photos.length + s.notesQ.length; const b = btn.querySelector("b"); if(n && !unread) b.textContent = `⏳${n}`; else if(!n && !unread) b.textContent = ""; }
/* ---------- readiness: can this device go to the field now? ---------- */
async function paintReady(){ const el = sheet.querySelector("#mineready"); if(!el) return; el.innerHTML = `<div class="sec">${T.ready}</div><div class="sy" id="rdy">${T.checking}</div>`;
  const rows = []; const ok = (good, text, fix) => rows.push(`<div class="syrow"><span style="color:${good ? "#7f9a6a" : "#e07b39"}">${good ? "✓" : "✗"}</span> ${text}${!good && fix ? ` <button data-fix="${fix}">${fix === "offline" ? T.saveOffline : fix}</button>` : ""}</div>`);
  ok(!!auth().key, auth().key ? T.keyOk : T.keyNo);
  // offline tiles: sample the expected set against the service worker's cache
  let tiles = null; try{ if(window.edrOffline && edrOffline.expected && window.caches){ const want = edrOffline.expected().filter(u => /\.(jpg|png)$/.test(u)); const sample = want.filter((_, i) => i % Math.max(1, Math.floor(want.length / 60)) === 0).slice(0, 60); const keys = await caches.keys(); const tcache = keys.find(k => k.includes("tiles")); let hit = 0; if(tcache){ const c = await caches.open(tcache); for(const u of sample){ if(await c.match(new URL(u, location.href).href, {ignoreSearch:true})) hit++; } } tiles = sample.length ? hit / sample.length : 0; } }catch(e){}
  ok(tiles != null && tiles > 0.9, tiles == null ? T.tiles : `${T.tiles}: ${Math.round(tiles * 100)}%${tiles > 0.9 ? "" : " · " + T.tilesNone}`, tiles != null && tiles <= 0.9 ? "offline" : null);
  let eng = false; try{ const keys = await caches.keys(); for(const k of keys){ const c = await caches.open(k); if(await c.match(new URL("vendor/excalidraw/board.js", location.href).href, {ignoreSearch:true})){ eng = true; break; } } }catch(e){} ok(eng, eng ? T.engine : T.engineNo);
  const fix = window.edrSurvey && edrSurvey.state && edrSurvey.state.last; ok(!!fix, fix ? `${T.gps}: ±${Math.round(fix.acc || fix.coords && fix.coords.accuracy || 0)} m` : T.gpsNo);
  const s = await syncState(); ok(s.edits.length + s.photos.length === 0, s.edits.length + s.photos.length === 0 ? T.allSent : `${s.edits.length + s.photos.length} ${T.edits}`);
  const dataV = (document.querySelector('script[src^="data.js"]') || {}).src || ""; ok(true, `${T.fresh}: ${(dataV.match(/v=([0-9a-f]+)/) || [,"—"])[1]} · ${T.lastPull} ${s.lastPull}`);
  el.querySelector("#rdy").innerHTML = rows.join(""); el.querySelectorAll("[data-fix]").forEach(b => b.onclick = () => { if(b.dataset.fix === "offline" && window.edrOffline) edrOffline.save(); }); }
/* edits go before photos when the connection returns */
window.addEventListener("online", async () => { try{ if(window.edrEdit && edrEdit.flushNow) await edrEdit.flushNow(); if(window.edrFlushMedia) await edrFlushMedia(); }catch(e){} badgePending(); });
document.addEventListener("edr-sync", () => { badgePending(); if(sheet.classList.contains("open")) paintSync(); });
document.addEventListener("edr-media-queue", () => badgePending());
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
