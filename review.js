/* Review — leadership goes through the team's proposals one at a time: the map flies to each one, a change to an
   existing item shows before (grey, dashed) and after (gold), and one tap approves, rejects (with a reason) or asks the
   author a question. Every decision can be undone. Approving never touches the core map: it marks the proposal
   approved, the map then draws it as part of the map, and the 15-minute sync carries it into QGIS. */
(function(){
const API = "https://edenrise-brain.edenrise.workers.dev";
const EN = (typeof LANG !== "undefined" && LANG === "en");
const T = EN ? {
  title:"Review", of:"of", start:"Review", none:"Nothing waiting for review — the map is up to date.", done:"All reviewed", doneSub:"Every proposal in this list has a decision.",
  approve:"Approve", reject:"Reject", ask:"Ask", skip:"Skip", undo:"Undo", close:"Close", by:"by", v:"v", note:"Note from the author",
  new:"New item", change:"Change to", remove:"Remove from the map", before:"before", after:"after", into:"Goes into", noDest:"no destination chosen yet",
  reasons:["Duplicate", "Wrong place", "Not needed", "Needs more detail"], other:"Other reason…", why:"Why? (the author sees this)", send:"Send",
  askPh:"Question for the author…", asked:"Question sent — it stays waiting for the answer", approved:"Approved", rejected:"Rejected", undone:"Undone — back to waiting",
  group:n => `Approve all ${n} with this name`, groupQ:(n, nm) => `Approve all ${n} items named “${nm}”?`, filter:"Show", all:"Everyone", oldest:"Oldest first",
  photos:"photos", notes:"notes", board:"Board", keys:"Keys: A approve · R reject · Q ask · → skip · U undo", lead:"Only leadership can approve — sign in as leadership."
} : {
  title:"Rever", of:"de", start:"Rever", none:"Nada à espera de revisão — o mapa está em dia.", done:"Tudo revisto", doneSub:"Todas as propostas desta lista têm decisão.",
  approve:"Aprovar", reject:"Rejeitar", ask:"Perguntar", skip:"Saltar", undo:"Desfazer", close:"Fechar", by:"por", v:"v", note:"Nota do autor",
  new:"Item novo", change:"Alteração a", remove:"Retirar do mapa", before:"antes", after:"depois", into:"Vai para", noDest:"sem destino escolhido",
  reasons:["Duplicado", "Sítio errado", "Não é preciso", "Falta detalhe"], other:"Outro motivo…", why:"Porquê? (o autor vê isto)", send:"Enviar",
  askPh:"Pergunta para o autor…", asked:"Pergunta enviada — fica à espera da resposta", approved:"Aprovado", rejected:"Rejeitado", undone:"Desfeito — volta a estar à espera",
  group:n => `Aprovar os ${n} com este nome`, groupQ:(n, nm) => `Aprovar os ${n} itens chamados «${nm}»?`, filter:"Mostrar", all:"Todos", oldest:"Mais antigas primeiro",
  photos:"fotos", notes:"notas", board:"Quadro", keys:"Teclas: A aprovar · R rejeitar · Q perguntar · → saltar · U desfazer", lead:"Só a liderança pode aprovar — entre como liderança."
};
const css = document.createElement("style"); css.textContent = `
#revw{position:fixed;right:14px;top:calc(var(--nav-h,52px) + 8px);bottom:16px;width:min(400px,calc(100vw - 28px));z-index:1720;background:rgba(28,24,19,.97);backdrop-filter:blur(12px);color:var(--linen,#ece4d2);border:1px solid var(--line-2,#47402f);border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.55);display:none;flex-direction:column;overflow:hidden;font:13px var(--ui,sans-serif)}
#revw.on{display:flex}
#revw .rh{display:flex;align-items:center;gap:10px;padding:12px 14px 10px;border-bottom:1px solid var(--line,#332c22)}
#revw .rh h3{margin:0;font:600 16px var(--display,sans-serif);flex:1}
#revw .rh .pg{font:600 12px var(--mono,monospace);color:var(--muted,#8f8676);font-variant-numeric:tabular-nums}
#revw .rh button{height:32px;border-radius:16px;border:1px solid var(--line-2,#47402f);background:transparent;color:var(--linen,#ece4d2);font:600 12px var(--ui);padding:0 12px;cursor:pointer}
#revw .bar{height:3px;background:var(--line,#332c22)} #revw .bar i{display:block;height:100%;background:var(--oak,#7f9a6a);transition:width .25s}
#revw .rf{display:flex;gap:6px;padding:8px 14px;border-bottom:1px solid var(--line,#332c22)} #revw .rf select{flex:1;min-width:0;height:32px;border-radius:8px;border:1px solid var(--line-2,#47402f);background:var(--bark,#14110d);color:var(--linen,#ece4d2);font:12.5px var(--ui)}
#revw .rb{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;min-height:0}
#revw .op{align-self:flex-start;font:700 10px var(--mono,monospace);letter-spacing:.1em;text-transform:uppercase;padding:3px 9px;border-radius:999px;color:var(--bark,#14110d)}
#revw h4{margin:0;font:600 19px var(--display,sans-serif);line-height:1.2;text-wrap:balance}
#revw .meta{color:var(--muted,#8f8676);font-size:12px;line-height:1.5}
#revw .meta b{color:var(--linen,#ece4d2);font-weight:600}
#revw .dest{font-size:12.5px;color:var(--straw,#c9a227)}
#revw .ba{display:flex;gap:12px;font:600 11px var(--ui);color:var(--muted,#8f8676)} #revw .ba span{display:flex;align-items:center;gap:6px} #revw .ba i{display:inline-block;width:22px;height:0;border-top:3px solid}
#revw .nt{background:var(--bark,#14110d);border:1px solid var(--line,#332c22);border-radius:10px;padding:9px 11px;font-size:12.5px;line-height:1.45;white-space:pre-wrap}
#revw .nt small{display:block;font:600 10px var(--mono,monospace);letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#8f8676);margin-bottom:4px}
#revw .ms{display:grid;grid-template-columns:1fr 1fr;gap:4px 14px;font-size:12px} #revw .ms div{display:flex;justify-content:space-between;gap:8px} #revw .ms span{color:var(--muted,#8f8676)} #revw .ms b{font:600 12px var(--mono,monospace);font-variant-numeric:tabular-nums}
#revw .th{display:flex;gap:6px;overflow-x:auto} #revw .th img{width:84px;height:64px;object-fit:cover;border-radius:8px;flex:none;background:#000}
#revw .grp{align-self:flex-start;border:1px dashed var(--straw,#c9a227);background:transparent;color:var(--straw,#c9a227);border-radius:999px;padding:6px 12px;font:600 12px var(--ui);cursor:pointer}
#revw .rx{display:flex;flex-direction:column;gap:6px} #revw .rx .chips{display:flex;flex-wrap:wrap;gap:6px}
#revw .rx .chips button{border:1px solid var(--line-2,#47402f);background:transparent;color:var(--linen,#ece4d2);border-radius:999px;padding:7px 12px;font:600 12px var(--ui);cursor:pointer}
#revw .rx textarea{min-height:58px;border-radius:9px;border:1px solid var(--line-2,#47402f);background:var(--bark,#14110d);color:var(--linen,#ece4d2);padding:9px;font:13px var(--ui);resize:vertical}
#revw .rx .go{align-self:flex-end;border:0;border-radius:9px;padding:9px 16px;font:700 13px var(--ui);cursor:pointer}
#revw .ft{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:6px;padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--line,#332c22)}
#revw .ft button{min-height:48px;border-radius:12px;border:1px solid var(--line-2,#47402f);background:var(--night-2,#241f18);color:var(--linen,#ece4d2);font:700 13.5px var(--ui);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px}
#revw .ft button small{font:500 10px var(--ui);opacity:.65}
#revw .ft .ok{background:var(--oak,#7f9a6a);border-color:var(--oak,#7f9a6a);color:var(--bark,#14110d)}
#revw .ft .no{color:#f08a6c;border-color:rgba(240,138,108,.55)}
#revw .ft .sk{padding:0 14px}
#revw .ft button:disabled{opacity:.4;cursor:default}
#revw .un{font:600 12px var(--ui);color:var(--straw,#c9a227);background:none;border:0;cursor:pointer;padding:0 14px 8px;text-align:left}
#revw .keys{font-size:10.5px;color:var(--muted,#8f8676);padding:0 14px 8px}
#revw .empty{color:var(--muted,#8f8676);text-align:center;padding:30px 10px;line-height:1.5} #revw .empty b{display:block;color:var(--linen,#ece4d2);font:600 17px var(--display,sans-serif);margin-bottom:4px}
#revw button:focus-visible,#revw select:focus-visible,#revw textarea:focus-visible{outline:2px solid var(--straw,#c9a227);outline-offset:2px}
#propc .ph .revgo{background:var(--oak,#7f9a6a)!important;color:var(--bark,#14110d)!important;border-color:var(--oak,#7f9a6a)!important;font-weight:700}
@media (max-width:700px), ((pointer:coarse) and (max-width:1024px)){
  #revw{left:0;right:0;top:auto;bottom:0;width:auto;height:min(58vh,560px);border-radius:18px 18px 0 0}
  #revw .keys{display:none}
}`;
document.head.appendChild(css);

const R = {queue:[], i:0, done:[], who:"", order:"old", ui:null, ghost:null};
const auth = () => window.edrAuth || {role:"viewer", key:"", actor:""};
const esc = t => String(t == null ? "" : t).replace(/[<>&"]/g, c => ({"<":"&lt;", ">":"&gt;", "&":"&amp;", '"':"&quot;"}[c]));
const say = m => { if(window.toast) toast(m); };
const pending = () => (window.edrEdit && edrEdit.feats ? edrEdit.feats() : []).filter(f => f.properties.status === "proposto");
const presetName = p => { const pr = (edrEdit.PRESETS || []).find(x => x.id === p.preset); return pr ? (EN ? pr.en : pr.pt) : (p.kind || ""); };
const nameOf = p => String(p.name || p.tipo_livre || presetName(p) || p.id).trim();
const when = s => { try{ return new Date(s).toLocaleDateString(EN ? "en-GB" : "pt-PT", {day:"numeric", month:"short"}) + " " + new Date(s).toLocaleTimeString(EN ? "en-GB" : "pt-PT", {hour:"2-digit", minute:"2-digit"}); }catch(e){ return String(s || "").slice(0, 16); } };

function build(){
  const ui = document.createElement("div"); ui.id = "revw"; ui.setAttribute("role", "dialog"); ui.setAttribute("aria-label", T.title);
  ui.innerHTML = `<div class="rh"><h3>${T.title}</h3><span class="pg"></span><button data-x>${T.close}</button></div><div class="bar"><i style="width:0"></i></div>
    <div class="rf"><select data-f="who"></select><select data-f="order"><option value="old">${T.oldest}</option><option value="name">A–Z</option><option value="author">${EN ? "By author" : "Por autor"}</option></select></div>
    <div class="rb"></div><button class="un" hidden></button><div class="keys">${T.keys}</div>
    <div class="ft"><button class="ok" data-d="ok">✓ ${T.approve}<small>A</small></button><button class="no" data-d="no">✕ ${T.reject}<small>R</small></button><button data-d="ask">? ${T.ask}<small>Q</small></button><button class="sk" data-d="skip" aria-label="${T.skip}">→</button></div>`;
  document.body.appendChild(ui);
  ui.querySelector("[data-x]").onclick = close;
  ui.querySelector('[data-f="who"]').onchange = e => { R.who = e.target.value; makeQueue(); show(); };
  ui.querySelector('[data-f="order"]').onchange = e => { R.order = e.target.value; makeQueue(); show(); };
  ui.querySelector(".ft").onclick = e => { const b = e.target.closest("button"); if(!b || b.disabled) return; ({ok:approve, no:rejectAsk, ask:askAsk, skip:next})[b.dataset.d](); };
  ui.querySelector(".un").onclick = undo;
  return ui;
}
function makeQueue(){
  const keepId = R.queue[R.i] && R.queue[R.i].properties.id;
  let q = pending(); if(R.who) q = q.filter(f => (f.properties.created_by || "") === R.who);
  const t = f => String(f.properties.created_at || "");
  q.sort(R.order === "name" ? (a, b) => nameOf(a.properties).localeCompare(nameOf(b.properties), undefined, {numeric:true}) || t(a).localeCompare(t(b))
       : R.order === "author" ? (a, b) => String(a.properties.created_by || "").localeCompare(String(b.properties.created_by || "")) || t(a).localeCompare(t(b))
       : (a, b) => t(a).localeCompare(t(b)));
  R.queue = q; const k = keepId ? q.findIndex(f => f.properties.id === keepId) : -1; R.i = k >= 0 ? k : 0;
}
function fillWho(){
  const sel = R.ui.querySelector('[data-f="who"]'); const n = {}; for(const f of pending()){ const a = f.properties.created_by || "—"; n[a] = (n[a] || 0) + 1; }
  sel.innerHTML = `<option value="">${T.all} · ${pending().length}</option>` + Object.entries(n).sort((a, b) => b[1] - a[1]).map(([a, c]) => `<option value="${esc(a)}" ${R.who === a ? "selected" : ""}>${esc(a)} · ${c}</option>`).join("");
}
/* ---------- the map: fly to the item, show before / after ---------- */
function clearGhost(){ if(R.ghost){ try{ map.removeLayer(R.ghost); }catch(e){} R.ghost = null; } }
function coreLayerFor(ref){ if(!ref || typeof layerObjs === "undefined" || !edrEdit.sameRef) return null; let hit = null;
  for(const [t, o] of Object.entries(layerObjs)){ if(hit || !o.geo || !o.geo.eachLayer) continue; o.geo.eachLayer(l => { if(!hit && l.feature && edrEdit.sameRef(edrEdit.coreRef(t, l.feature), ref)) hit = l; }); }
  return hit; }
function showOnMap(f){
  clearGhost(); const p = f.properties; const g = L.featureGroup();
  const after = L.geoJSON(f, {style:{color:"#e8c547", weight:5, opacity:1, fillColor:"#e8c547", fillOpacity:.18}, pointToLayer:(x, ll) => L.circleMarker(ll, {radius:13, color:"#e8c547", weight:4, fillOpacity:.15}), interactive:false});
  const halo = L.geoJSON(f, {style:{color:"#fff", weight:11, opacity:.35, fill:false}, pointToLayer:(x, ll) => L.circleMarker(ll, {radius:19, color:"#fff", weight:2, opacity:.6, fill:false}), interactive:false});
  halo.addTo(g); if(p.op !== "retire") after.addTo(g);
  if(p.ref_id && (p.op === "modify" || p.op === "retire")){ const core = coreLayerFor(p.ref_id);
    if(core){ const gj = core.toGeoJSON(); L.geoJSON(gj, {style:{color:p.op === "retire" ? "#f08a6c" : "#c9c2b4", weight:p.op === "retire" ? 5 : 3, dashArray:"6 6", opacity:1, fill:false}, pointToLayer:(x, ll) => L.circleMarker(ll, {radius:11, color:p.op === "retire" ? "#f08a6c" : "#c9c2b4", weight:3, dashArray:"4 4", fill:false}), interactive:false}).addTo(g); } }
  R.ghost = g.addTo(map);
  try{ const b = g.getBounds(); if(b.isValid()){ const phone = window.matchMedia("(max-width:700px)").matches; map.flyToBounds(b, {maxZoom:19, duration:.6, paddingTopLeft:[40, 60], paddingBottomRight:phone ? [40, Math.round(innerHeight * .6)] : [440, 40]}); } }catch(e){}
}
/* ---------- the card ---------- */
async function show(){
  if(!R.ui) return; fillWho(); const body = R.ui.querySelector(".rb"); const n = R.queue.length; const f = R.queue[R.i];
  R.ui.querySelector(".pg").textContent = n ? `${R.i + 1} ${T.of} ${n}` : "";
  const total = R.done.length + pending().length; R.ui.querySelector(".bar i").style.width = total ? `${Math.round(100 * R.done.length / total)}%` : "0";
  const un = R.ui.querySelector(".un"); const last = R.done[R.done.length - 1]; un.hidden = !last; if(last) un.textContent = `↶ ${T.undo}: ${last.status === "aprovado" ? T.approved : last.status === "rejeitado" ? T.rejected : T.asked.split(" —")[0]} · ${last.name}`;
  R.ui.querySelectorAll(".ft button").forEach(b => b.disabled = !f);
  if(!f){ clearGhost(); body.innerHTML = `<div class="empty"><b>${R.done.length ? T.done : T.title}</b>${R.done.length ? T.doneSub : T.none}</div>`; return; }
  const p = f.properties; const m = p.measures || {};
  const op = p.op === "modify" ? {t:`${T.change} “${esc(p.ref_name || p.ref_id)}”`, c:"#e8c547"} : p.op === "retire" ? {t:`${T.remove}: “${esc(p.ref_name || p.ref_id)}”`, c:"#f08a6c"} : {t:T.new, c:"#9cc27f"};
  const cat = p.category || (p.ai && p.ai.category) || ""; const dest = cat ? `${esc(edrEdit.catLabel ? edrEdit.catLabel(cat) : cat)}${p.layer_title && p.layer_title !== "—" ? " › " + esc(p.layer_title) : ""}` : `<span style="color:var(--muted)">${T.noDest}</span>`;
  const ms = [[EN ? "Area" : "Área", m.area_ha ? (m.area_ha >= 1 ? (+m.area_ha).toFixed(2) + " ha" : Math.round(m.area_m2 || m.area_ha * 1e4) + " m²") : null], [EN ? "Length" : "Comprimento", m.comprimento_m && m.kind !== "polygon" ? Math.round(m.comprimento_m) + " m" : null], [EN ? "Elevation" : "Cota", m.cota_m ? m.cota_m + " m" : null], [EN ? "Slope" : "Declive", m.declive_pct != null ? m.declive_pct + " %" : null]].filter(x => x[1]);
  const same = R.queue.filter(x => nameOf(x.properties).toLowerCase() === nameOf(p).toLowerCase());
  body.innerHTML = `<span class="op" style="background:${op.c}">${op.t}</span><h4>${esc(nameOf(p))}</h4>
    <div class="meta">${esc(presetName(p))} · ${T.by} <b>${esc(p.created_by || "—")}</b> · ${when(p.created_at)} · ${T.v}${p.version || 1}</div>
    <div class="dest">📁 ${T.into}: ${dest}</div>
    ${p.op === "modify" ? `<div class="ba"><span><i style="border-color:#c9c2b4;border-top-style:dashed"></i>${T.before}</span><span><i style="border-color:#e8c547"></i>${T.after}</span></div>` : ""}
    ${p.note ? `<div class="nt"><small>${T.note}</small>${esc(p.note)}</div>` : ""}
    ${ms.length ? `<div class="ms">${ms.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("")}</div>` : ""}
    <div class="xtra" style="display:flex;flex-direction:column;gap:8px"></div>
    ${same.length > 1 ? `<button class="grp">${T.group(same.length)}</button>` : ""}`;
  const grp = body.querySelector(".grp"); if(grp) grp.onclick = () => approveGroup(same);
  showOnMap(f); extras(p.id, body.querySelector(".xtra"));
}
async function extras(id, box){
  try{ const d = await fetch(`${API}/item/${encodeURIComponent(id)}`).then(r => r.json()); if(!box.isConnected) return;
    const media = d.media || []; const snap = media.find(x => /^\[quadro-snap\]/.test(x.caption || "")); const photos = media.filter(x => x.kind === "foto" && !/^\[/.test(x.caption || "")).slice(0, 6);
    const notes = (d.notes || []).filter(n => n.kind !== "ficha").slice(0, 2);
    const imgs = [...(snap ? [snap] : []), ...photos];
    box.innerHTML = `${imgs.length ? `<div class="th">${imgs.map(x => `<img loading="lazy" alt="" src="${API}/media/${x.id}" title="${esc(x.caption || "")}">`).join("")}</div>` : ""}
      ${notes.map(n => `<div class="nt"><small>${esc(n.by || "—")} · ${when(n.at)}</small>${esc(n.text)}</div>`).join("")}`;
  }catch(e){}
}
/* ---------- decisions ---------- */
async function decide(f, status, note){
  const a = auth(); const r = await edrEdit.send("POST", `/features/${f.properties.id}/status`, {status, note:note || "", actor:a.actor});
  if(r && r.error){ say(r.error === "role" ? T.lead : r.error); return false; }
  f.properties.status = status; return true;
}
async function approve(){ const f = R.queue[R.i]; if(!f) return; if(await decide(f, "aprovado", "")){ R.done.push({id:f.properties.id, name:nameOf(f.properties), status:"aprovado", f}); say(`✓ ${T.approved}`); afterDecision(); } }
async function approveGroup(list){ if(!confirm(T.groupQ(list.length, nameOf(list[0].properties)))) return; let n = 0;
  for(const f of list){ if(await decide(f, "aprovado", "")){ R.done.push({id:f.properties.id, name:nameOf(f.properties), status:"aprovado", f}); n++; } }
  say(`✓ ${T.approved} · ${n}`); afterDecision(); }
function inline(kind){
  const f = R.queue[R.i]; if(!f) return; const body = R.ui.querySelector(".rb"); body.querySelector(".rx")?.remove();
  const box = document.createElement("div"); box.className = "rx";
  box.innerHTML = kind === "no" ? `<div class="chips">${T.reasons.map(x => `<button data-r="${esc(x)}">${x}</button>`).join("")}</div><textarea placeholder="${T.why}"></textarea><button class="go" style="background:#f08a6c;color:#14110d">✕ ${T.reject}</button>`
    : `<textarea placeholder="${T.askPh}"></textarea><button class="go" style="background:var(--straw,#c9a227);color:#14110d">${T.send}</button>`;
  body.appendChild(box); const ta = box.querySelector("textarea"); ta.focus(); box.scrollIntoView({block:"nearest"});
  box.querySelectorAll("[data-r]").forEach(b => b.onclick = () => { ta.value = b.dataset.r; box.querySelector(".go").click(); });
  box.querySelector(".go").onclick = async () => { const txt = ta.value.trim(); if(!txt){ ta.focus(); return; }
    if(kind === "no"){ if(await decide(f, "rejeitado", txt)){ R.done.push({id:f.properties.id, name:nameOf(f.properties), status:"rejeitado", f}); say(`✕ ${T.rejected}`); afterDecision(); } }
    else { const ok = window.edrZones ? await edrZones.record(f.properties.id, "pergunta", txt) : false; if(ok){ R.done.push({id:f.properties.id, name:nameOf(f.properties), status:"pergunta", f}); say(T.asked); R.queue.splice(R.i, 1); if(R.i >= R.queue.length) R.i = Math.max(0, R.queue.length - 1); show(); } } };
}
const rejectAsk = () => inline("no"), askAsk = () => inline("ask");
function afterDecision(){ makeQueue(); show(); if(window.edrEdit && edrEdit.reload) { clearTimeout(R.rl); R.rl = setTimeout(() => edrEdit.reload(), 1500); } }
function next(){ if(!R.queue.length) return; R.i = (R.i + 1) % R.queue.length; show(); }
async function undo(){ const last = R.done.pop(); if(!last) return;
  if(last.status !== "pergunta"){ const r = await edrEdit.send("POST", `/features/${last.id}/status`, {status:"proposto", note:EN ? "decision undone" : "decisão desfeita", actor:auth().actor}); if(r && r.error){ R.done.push(last); say(r.error); return; } last.f.properties.status = "proposto"; }
  makeQueue(); const k = R.queue.findIndex(x => x.properties.id === last.id); if(k >= 0) R.i = k; say(T.undone); show(); if(edrEdit.reload) edrEdit.reload(); }
/* ---------- open / close ---------- */
function onKey(e){ if(!R.ui || !R.ui.classList.contains("on") || /input|textarea|select/i.test((e.target.tagName || ""))) return;
  const k = e.key.toLowerCase(); if(k === "a"){ e.preventDefault(); approve(); } else if(k === "r"){ e.preventDefault(); rejectAsk(); } else if(k === "q"){ e.preventDefault(); askAsk(); } else if(k === "arrowright"){ e.preventDefault(); next(); } else if(k === "u"){ e.preventDefault(); undo(); } else if(k === "escape"){ close(); } }
async function open(opts){
  if(auth().role !== "leader"){ if(window.edrSignIn) await edrSignIn.open(); if(auth().role !== "leader"){ say(T.lead); return; } }
  if(!R.ui) R.ui = build(); if(opts && opts.fresh) R.done = []; if(opts && opts.who != null) R.who = opts.who; makeQueue(); R.ui.classList.add("on"); show(); document.addEventListener("keydown", onKey);
}
function close(){ if(R.ui) R.ui.classList.remove("on"); clearGhost(); document.removeEventListener("keydown", onKey); }
/* a Review button in the proposals list header (leadership only) */
function decorate(){ const ph = document.querySelector("#propc .ph"); if(!ph) return; let b = ph.querySelector(".revgo"); const n = pending().length;
  if(auth().role !== "leader" || !n){ if(b) b.remove(); return; }
  if(!b){ b = document.createElement("button"); b.className = "revgo"; b.onclick = () => { if(window.edrProposals) edrProposals.close(); open(); }; ph.insertBefore(b, ph.querySelector('[data-a="map"]')); }
  b.textContent = `▶ ${T.start} · ${n}`; }
new MutationObserver(decorate).observe(document.body, {childList:true, subtree:false});
document.addEventListener("click", () => setTimeout(decorate, 50), true);
window.edrReview = {open, close, state:R, pending};
})();
