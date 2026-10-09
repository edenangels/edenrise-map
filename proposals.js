// EdenRise map — Propostas: the review centre. Every proposal the team made, all statuses, in one list with real filters,
// and an approval gate: nothing is approved without a destination (category › layer), because approval is what sends an
// item into its area of the estate map — and into the right layer when QGIS merges it. Rejections carry a reason.
(function(){
if(typeof map === "undefined") return;
const EN = (typeof LANG !== "undefined") && LANG === "en";
const API = "https://edenrise-brain.edenrise.workers.dev"; const SITE = (typeof SITE_ID !== "undefined") ? SITE_ID : "edenrise";
const ST = {proposto:"#c9a227", reportado:"#e07b39", aprovado:"#7f9a6a", resolvido:"#7f9a6a", rejeitado:"#6b6157", retirado:"#6b6157"};
const T = EN ? {title:"Proposals", all:"all", st:{proposto:"proposed", reportado:"reported", aprovado:"approved", resolvido:"resolved", rejeitado:"rejected", retirado:"retired"}, search:"Search name, author, note…", author:"Author", type:"Type", area:"Area", mine:"Only mine", noArea:"no destination yet", onMap:"Show only these on the map", onMapOff:"Show all on the map", approve:"Approve", reject:"Reject", send:"Set destination", gateT:"Approve and send to its area", gateSub:n=>`${n} selected. Every approved item needs a destination: the category and layer it belongs to.`, dest:"Destination", cat:"Category", layer:"Layer", note:"Note to the team (optional)", go:(n,l)=>`Approve ${n} → ${l}`, needDest:"Choose the destination first", rejT:"Reject", rejSub:"Say why — the author sees this.", reason:"Reason", rejGo:n=>`Reject ${n}`, needReason:"A reason is required", done:n=>`${n} done`, hidden:n=>`${n} hidden by the layer toggles`, showAll:"show all", exportG:"GeoJSON", exportK:"KML", close:"Close", none:"Nothing matches", selectAll:"Select all shown", clear:"Clear", sort:{new:"newest", old:"oldest", name:"name", author:"author"}, modify:"change to", retire:"retire", open:"Open", fly:"Map"}
: {title:"Propostas", all:"todas", st:{proposto:"propostas", reportado:"reportadas", aprovado:"aprovadas", resolvido:"resolvidas", rejeitado:"rejeitadas", retirado:"retiradas"}, search:"Procurar nome, autor, nota…", author:"Autor", type:"Tipo", area:"Área", mine:"Só as minhas", noArea:"ainda sem destino", onMap:"Mostrar só estas no mapa", onMapOff:"Mostrar todas no mapa", approve:"Aprovar", reject:"Rejeitar", send:"Definir destino", gateT:"Aprovar e enviar para a área", gateSub:n=>`${n} selecionadas. Cada item aprovado precisa de um destino: a categoria e a camada a que pertence.`, dest:"Destino", cat:"Categoria", layer:"Camada", note:"Nota para a equipa (opcional)", go:(n,l)=>`Aprovar ${n} → ${l}`, needDest:"Escolhe primeiro o destino", rejT:"Rejeitar", rejSub:"Diz porquê — o autor vê isto.", reason:"Motivo", rejGo:n=>`Rejeitar ${n}`, needReason:"O motivo é obrigatório", done:n=>`${n} feito`, hidden:n=>`${n} escondidas pelas camadas`, showAll:"mostrar todas", exportG:"GeoJSON", exportK:"KML", close:"Fechar", none:"Nada corresponde", selectAll:"Selecionar as visíveis", clear:"Limpar", sort:{new:"mais recentes", old:"mais antigas", name:"nome", author:"autor"}, modify:"alteração de", retire:"retirada de", open:"Abrir", fly:"Mapa"};
const auth = () => window.edrAuth || {key:"", role:"viewer", actor:""};
const say = m => window.toast && toast(m);
const S = {all:[], sel:new Set(), status:new Set(["proposto", "reportado"]), q:"", author:"", type:"", area:"", mine:false, sort:"new", onlyOnMap:false, ui:null};

const css = document.createElement("style"); css.textContent = `
#propc{position:fixed;top:calc(var(--nav-h,52px) + 8px);right:12px;bottom:12px;width:min(560px,calc(100vw - 24px));z-index:1700;background:#1c1813;color:#f1e9d8;border:1px solid rgba(241,233,216,.15);border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.55);display:none;flex-direction:column;overflow:hidden}
#propc.on{display:flex} @media (max-width:700px){ #propc{top:44px;right:0;left:0;bottom:0;width:auto;border-radius:0} }
#propc .ph{padding:12px 14px 8px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(241,233,216,.12)} #propc .ph h3{margin:0;font:700 16px var(--ui);flex:1} #propc .ph button{height:36px;border-radius:18px;border:1px solid rgba(241,233,216,.25);background:transparent;color:#f1e9d8;font:600 12px var(--ui);padding:0 12px;cursor:pointer}
#propc .chips{display:flex;flex-wrap:wrap;gap:6px;padding:8px 14px} #propc .chips button{height:32px;border-radius:16px;border:1px solid rgba(241,233,216,.2);background:transparent;color:#f1e9d8;font:600 12px var(--ui);padding:0 10px;cursor:pointer;display:flex;align-items:center;gap:6px} #propc .chips button i{width:9px;height:9px;border-radius:50%;display:inline-block} #propc .chips button.on{background:rgba(241,233,216,.12);border-color:#c9a227} #propc .chips button b{font:700 11px var(--mono);opacity:.8}
#propc .filt{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:0 14px 8px} #propc .filt input,#propc .filt select{height:38px;border-radius:10px;border:1px solid rgba(241,233,216,.2);background:rgba(0,0,0,.3);color:#f1e9d8;padding:0 10px;font:500 13px var(--ui);min-width:0} #propc .filt .wide{grid-column:1 / -1} #propc .filt label.ck{display:flex;align-items:center;gap:8px;font:600 12px var(--ui);height:38px}
#propc .tools{display:flex;gap:6px;align-items:center;padding:0 14px 8px;font:600 11px var(--ui);color:#c9a227;flex-wrap:wrap} #propc .tools button{height:30px;border-radius:15px;border:1px solid rgba(241,233,216,.2);background:transparent;color:#f1e9d8;font:600 11px var(--ui);padding:0 10px;cursor:pointer}
#propc .list{flex:1;overflow-y:auto;padding:0 10px 10px;display:flex;flex-direction:column;gap:6px}
#propc .row{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:9px 10px;border:1px solid rgba(241,233,216,.12);border-radius:12px;background:rgba(255,255,255,.03)} #propc .row.sel{border-color:#c9a227;background:rgba(201,162,39,.08)}
#propc .row input{width:20px;height:20px;accent-color:#c9a227} #propc .row .n{min-width:0} #propc .row .n b{display:block;font:600 13.5px var(--ui);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer} #propc .row .n small{display:block;font:500 11px var(--mono);opacity:.65;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#propc .row .dest{display:inline-block;margin-top:4px;font:600 11px var(--ui);color:#c9a227} #propc .row .dest.none{color:#e07b39}
#propc .row .r{display:flex;flex-direction:column;align-items:flex-end;gap:5px} #propc .pill{font:700 9.5px var(--mono);letter-spacing:.08em;text-transform:uppercase;padding:3px 8px;border-radius:999px;color:#1c1813;white-space:nowrap} #propc .row .r button{height:28px;border-radius:14px;border:1px solid rgba(241,233,216,.2);background:transparent;color:#f1e9d8;font:600 11px var(--ui);padding:0 9px;cursor:pointer}
#propc .ft{display:flex;flex-wrap:wrap;gap:6px;padding:10px 14px;border-top:1px solid rgba(241,233,216,.12)} #propc .ft button{min-height:44px;border-radius:12px;border:1px solid rgba(241,233,216,.25);background:transparent;color:#f1e9d8;font:700 13px var(--ui);padding:0 14px;cursor:pointer} #propc .ft button.ok{background:#c9a227;color:#1c1813;border-color:#c9a227} #propc .ft button.x{border-color:#d9534f;color:#ff8a80} #propc .ft button:disabled{opacity:.4}
#propc .gate{position:absolute;inset:0;background:rgba(28,24,19,.98);display:flex;flex-direction:column;padding:16px;gap:10px;z-index:2} #propc .gate h3{margin:0;font:700 17px var(--ui)} #propc .gate p{margin:0;font:500 13px var(--ui);opacity:.85} #propc .gate label{display:flex;flex-direction:column;gap:4px;font:600 11px var(--ui);opacity:.9} #propc .gate select,#propc .gate textarea{border-radius:10px;border:1px solid rgba(241,233,216,.2);background:rgba(0,0,0,.3);color:#f1e9d8;padding:10px 12px;font:500 14px var(--ui)} #propc .gate select{height:44px} #propc .gate .ft{border:0;padding:0;margin-top:auto}
#propc .empty{padding:24px 14px;font:500 13px var(--ui);opacity:.75}`; document.head.appendChild(css);

/* ---------- data ---------- */
const P = f => f.properties || f;
const typeName = p => { const pr = (window.edrEdit && edrEdit.PRESETS || []).find(x => x.id === p.preset); return pr ? (EN ? pr.en : pr.pt) : (p.tipo_livre || p.kind || p.preset || ""); };
const destOf = p => p.category ? {cat:p.category, lk:p.layer_key || "", lt:p.layer_title || ""} : (p.ai && p.ai.category ? {cat:p.ai.category, lk:p.ai.layer_key || "", lt:p.ai.layer_title || "", ai:true} : null);
async function load(){
  const live = (window.edrEdit && edrEdit.feats ? edrEdit.feats() : []).map(f => ({...f, properties:{...P(f)}}));
  let rej = [], ret = [];
  try{ const d = await fetch(`${API}/features?status=rejeitado&site=${SITE}`).then(r => r.json()); rej = d.features || []; }catch(e){}
  try{ const d = await fetch(`${API}/features/retired?site=${SITE}`).then(r => r.json()); ret = (d.retired || []).map(x => ({type:"Feature", properties:{...(x.properties || x), status:"retirado"}, geometry:x.geometry || (x.lon != null ? {type:"Point", coordinates:[x.lon, x.lat]} : null)})); }catch(e){}
  const byId = new Map(); for(const f of [...live, ...rej, ...ret]){ const p = P(f); if(p && p.id && !byId.has(p.id)) byId.set(p.id, f); }
  S.all = [...byId.values()]; paint();
}
function visible(){
  const a = auth(); const q = S.q.toLowerCase();
  let list = S.all.filter(f => { const p = P(f); if(S.status.size && !S.status.has(p.status || "proposto")) return false; if(S.author && (p.created_by || "") !== S.author) return false; if(S.type && (p.preset || "") !== S.type) return false;
    if(S.area){ const d = destOf(p); if(S.area === "__none" ? !!d : (!d || d.cat !== S.area)) return false; } if(S.mine && p.created_by !== a.actor) return false;
    if(q && !`${p.name || ""} ${p.created_by || ""} ${p.note || ""} ${p.id}`.toLowerCase().includes(q)) return false; return true; });
  const k = S.sort; list.sort((x, y) => { const a = P(x), b = P(y); if(k === "name") return String(a.name || "").localeCompare(String(b.name || "")); if(k === "author") return String(a.created_by || "").localeCompare(String(b.created_by || "")); const ta = String(a.updated_at || a.created_at || ""), tb = String(b.updated_at || b.created_at || ""); return k === "old" ? ta.localeCompare(tb) : tb.localeCompare(ta); });
  return list;
}
/* ---------- ui ---------- */
function build(){
  const ui = document.createElement("div"); ui.id = "propc"; ui.setAttribute("role", "dialog"); ui.setAttribute("aria-label", T.title);
  ui.innerHTML = `<div class="ph"><h3>${T.title} <b class="tot" style="font:600 13px var(--mono);opacity:.7"></b></h3><button data-a="map"></button><button data-a="close">✕</button></div>
    <div class="chips"></div>
    <div class="filt"><input class="wide" data-f="q" placeholder="${T.search}"><select data-f="author"></select><select data-f="type"></select><select data-f="area"></select><select data-f="sort">${Object.entries(T.sort).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select><label class="ck"><input type="checkbox" data-f="mine"> ${T.mine}</label></div>
    <div class="tools"><span class="cnt"></span><button data-a="selall">${T.selectAll}</button><button data-a="clear">${T.clear}</button><span class="hid"></span></div>
    <div class="list"></div>
    <div class="ft"></div>`;
  document.body.appendChild(ui);
  ui.querySelector(".filt").addEventListener("input", e => { const f = e.target.dataset.f; if(!f) return; S[f] = e.target.type === "checkbox" ? e.target.checked : e.target.value; paintList(); });
  ui.addEventListener("click", e => { const b = e.target.closest("[data-a]"); if(!b) return; const a = b.dataset.a;
    if(a === "close") return close(); if(a === "map") return toggleOnMap(); if(a === "selall"){ visible().forEach(f => S.sel.add(P(f).id)); paintList(); return; } if(a === "clear"){ S.sel.clear(); paintList(); return; }
    if(a === "approve") return gate("approve"); if(a === "reject") return gate("reject"); if(a === "dest") return gate("dest"); if(a === "gj") return exportG(); if(a === "kml") return exportK(); if(a === "showall"){ if(window.edrEdit && edrEdit.showAllCats) edrEdit.showAllCats(); paintList(); return; } });
  return ui;
}
function paint(){ const ui = S.ui; const counts = {}; for(const f of S.all){ const s = P(f).status || "proposto"; counts[s] = (counts[s] || 0) + 1; }
  ui.querySelector(".tot").textContent = `· ${S.all.length}`;
  ui.querySelector(".chips").innerHTML = ["proposto", "reportado", "aprovado", "resolvido", "rejeitado", "retirado"].filter(s => counts[s]).map(s => `<button data-s="${s}" class="${S.status.has(s) ? "on" : ""}"><i style="background:${ST[s]}"></i>${T.st[s]} <b>${counts[s]}</b></button>`).join("") + `<button data-s="__all" class="${S.status.size === 0 ? "on" : ""}">${T.all} <b>${S.all.length}</b></button>`;
  ui.querySelectorAll(".chips button").forEach(b => b.onclick = () => { const s = b.dataset.s; if(s === "__all") S.status.clear(); else { if(S.status.has(s)) S.status.delete(s); else S.status.add(s); } paint(); });
  const opts = (sel, vals, label) => { const cur = S[sel]; const el = ui.querySelector(`[data-f="${sel}"]`); el.innerHTML = `<option value="">${label}: ${T.all}</option>` + vals.map(([v, l, n]) => `<option value="${v}" ${v === cur ? "selected" : ""}>${l}${n != null ? ` (${n})` : ""}</option>`).join(""); };
  const cnt = (fn) => { const m = new Map(); for(const f of S.all){ const k = fn(P(f)); if(k == null) continue; m.set(k, (m.get(k) || 0) + 1); } return [...m.entries()]; };
  opts("author", cnt(p => p.created_by || "—").sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, k, n]), T.author);
  opts("type", cnt(p => p.preset || "").filter(([k]) => k).sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, typeName({preset:k}), n]), T.type);
  const tax = (window.edrEdit && edrEdit.TAX) ? edrEdit.TAX() : []; const catLabel = (window.edrEdit && edrEdit.catLabel) || (x => x);
  const noDest = S.all.filter(f => !destOf(P(f))).length;
  opts("area", [["__none", T.noArea, noDest], ...tax.map(c => [c.category, catLabel(c.category), S.all.filter(f => (destOf(P(f)) || {}).cat === c.category).length]).filter(x => x[2])], T.area);
  paintList();
}
function paintList(){
  const ui = S.ui; const list = visible(); const leader = auth().role === "leader"; const catLabel = (window.edrEdit && edrEdit.catLabel) || (x => x);
  ui.querySelector(".cnt").textContent = `${list.length} · ${S.sel.size} ✓`;
  const hiddenN = (window.edrEdit && edrEdit.hiddenCount) ? edrEdit.hiddenCount() : 0; ui.querySelector(".hid").innerHTML = hiddenN ? `${T.hidden(hiddenN)} · <button data-a="showall">${T.showAll}</button>` : "";
  ui.querySelector(".list").innerHTML = list.length ? list.map(f => { const p = P(f); const d = destOf(p); const op = p.op === "modify" ? `${T.modify} ${p.ref_name || p.ref_id}` : p.op === "retire" ? `${T.retire} ${p.ref_name || p.ref_id}` : "";
    return `<div class="row ${S.sel.has(p.id) ? "sel" : ""}" data-id="${p.id}"><input type="checkbox" ${S.sel.has(p.id) ? "checked" : ""} data-ck="${p.id}"><div class="n"><b data-open="${p.id}">${(p.name || p.kind || p.id).toString().replace(/</g, "&lt;")}</b><small>${typeName(p)} · ${p.created_by || "—"} · ${String(p.updated_at || p.created_at || "").slice(0, 10)}${p.version ? " · v" + p.version : ""}${op ? " · " + op : ""}${p.note ? " · " + String(p.note).slice(0, 70).replace(/</g, "&lt;") : ""}</small><span class="dest ${d ? "" : "none"}">${d ? `📁 ${catLabel(d.cat)}${d.lt ? " › " + d.lt : ""}${d.ai ? " · AI" : ""}` : `⚠ ${T.noArea}`}</span></div><div class="r"><span class="pill" style="background:${ST[p.status] || ST.proposto}">${T.st[p.status] || p.status}</span><button data-fly="${p.id}">${T.fly} ↗</button></div></div>`; }).join("") : `<div class="empty">${T.none}</div>`;
  ui.querySelectorAll("[data-ck]").forEach(i => i.onchange = () => { i.checked ? S.sel.add(i.dataset.ck) : S.sel.delete(i.dataset.ck); i.closest(".row").classList.toggle("sel", i.checked); ui.querySelector(".cnt").textContent = `${list.length} · ${S.sel.size} ✓`; paintFooter(); });
  ui.querySelectorAll("[data-fly],[data-open]").forEach(b => b.onclick = () => { const id = b.dataset.fly || b.dataset.open; const f = S.all.find(x => P(x).id === id); if(!f || !f.geometry) return; try{ const bb = L.geoJSON(f).getBounds(); map.fitBounds(bb, {maxZoom:19, padding:[60, 60]}); }catch(e){} if(b.dataset.open && window.edrEdit && edrEdit.openById) edrEdit.openById(id); });
  paintFooter(); if(S.onlyOnMap) applyOnMap();
}
function paintFooter(){ const ui = S.ui; const leader = auth().role === "leader"; const n = S.sel.size;
  ui.querySelector(".ft").innerHTML = (leader ? `<button class="ok" data-a="approve" ${n ? "" : "disabled"}>✓ ${T.approve} ${n || ""}</button><button data-a="dest" ${n ? "" : "disabled"}>📁 ${T.send}</button><button class="x" data-a="reject" ${n ? "" : "disabled"}>✗ ${T.reject} ${n || ""}</button>` : "") + `<button data-a="gj">⤓ ${T.exportG}</button><button data-a="kml">⤓ ${T.exportK}</button>`;
  ui.querySelector('[data-a="map"]').textContent = S.onlyOnMap ? T.onMapOff : T.onMap; }
/* ---------- the gate ---------- */
function gate(kind){
  const ids = [...S.sel]; if(!ids.length) return; const ui = S.ui; const tax = (window.edrEdit && edrEdit.TAX) ? edrEdit.TAX() : []; const catLabel = (window.edrEdit && edrEdit.catLabel) || (x => x);
  const first = S.all.find(f => P(f).id === ids[0]); const pre = first ? destOf(P(first)) : null; const allRetire = ids.every(id => (P(S.all.find(f => P(f).id === id) || {}) || {}).op === "retire");
  const g = document.createElement("div"); g.className = "gate";
  if(kind === "reject"){ g.innerHTML = `<h3>${T.rejT} · ${ids.length}</h3><p>${T.rejSub}</p><label>${T.reason}<textarea rows="4" data-g="reason"></textarea></label><div class="ft"><button class="x" data-g="go">✗ ${T.rejGo(ids.length)}</button><button data-g="x">${T.close}</button></div>`; }
  else { g.innerHTML = `<h3>${kind === "approve" ? T.gateT : T.send} · ${ids.length}</h3><p>${T.gateSub(ids.length)}</p>
      <label>${T.cat}<select data-g="cat"><option value="">—</option>${tax.map(c => `<option value="${c.category}" ${pre && pre.cat === c.category ? "selected" : ""}>${catLabel(c.category)}</option>`).join("")}</select></label>
      <label>${T.layer}<select data-g="lk"></select></label>
      ${kind === "approve" ? `<label>${T.note}<textarea rows="3" data-g="note"></textarea></label>` : ""}
      <div class="ft"><button class="ok" data-g="go"></button><button data-g="x">${T.close}</button></div>`; }
  ui.appendChild(g);
  const fill = () => { const sel = g.querySelector('[data-g="cat"]'); const lk = g.querySelector('[data-g="lk"]'); if(!sel) return; const c = tax.find(x => x.category === sel.value); lk.innerHTML = c ? c.layers.map(l => `<option value="${l.key}" ${pre && pre.lk === l.key ? "selected" : ""}>${l.title}</option>`).join("") : `<option value="">—</option>`; const go = g.querySelector('[data-g="go"]'); const lt = lk.selectedOptions[0] ? lk.selectedOptions[0].textContent : ""; go.textContent = kind === "approve" ? `✓ ${T.go(ids.length, lt || (allRetire ? T.st.aprovado : "…"))}` : `📁 ${T.send} → ${lt || "…"}`; };
  const cs = g.querySelector('[data-g="cat"]'); if(cs){ cs.onchange = fill; fill(); }
  g.querySelector('[data-g="x"]').onclick = () => g.remove();
  g.querySelector('[data-g="go"]').onclick = async () => {
    const a = auth(); const changeset = "CS-REV-" + Date.now().toString(36).toUpperCase(); let n = 0;
    if(kind === "reject"){ const why = g.querySelector('[data-g="reason"]').value.trim(); if(!why){ say(T.needReason); return; }
      for(const id of ids){ const r = await edrEdit.send("POST", `/features/${id}/status`, {status:"rejeitado", note:why, actor:a.actor, changeset}); if(r && (r.ok || r.queued)) n++; } }
    else { const cat = g.querySelector('[data-g="cat"]').value; const lk = g.querySelector('[data-g="lk"]'); const lkv = lk.value, lt = lk.selectedOptions[0] ? lk.selectedOptions[0].textContent : "";
      if(!cat && !allRetire){ say(T.needDest); return; }
      if(cat){ const r = await edrEdit.send("POST", "/features/batch", {ids, category:cat, layer_key:lkv, layer_title:lt, actor:a.actor, changeset}); if(!(r && (r.ok || r.queued))){ say(r && r.error || T.needDest); return; } }
      if(kind === "approve"){ const note = (g.querySelector('[data-g="note"]') || {}).value || ""; for(const id of ids){ const r = await edrEdit.send("POST", `/features/${id}/status`, {status:"aprovado", note, actor:a.actor, changeset}); if(r && (r.ok || r.queued)) n++; } } else n = ids.length; }
    g.remove(); S.sel.clear(); say(T.done(n)); if(window.edrEdit && edrEdit.reload) await edrEdit.reload(); await load();
  };
}
/* ---------- map coupling ---------- */
function toggleOnMap(){ S.onlyOnMap = !S.onlyOnMap; if(S.onlyOnMap) applyOnMap(); else restoreMap(); paintFooter(); }
function applyOnMap(){ if(!window.edrEdit || !edrEdit.drawnEach) return; const ids = new Set(visible().map(f => P(f).id)); edrEdit.drawnEach(l => { const p = l.feature && l.feature.properties; if(!p) return; const on = ids.has(p.id); if(l.setStyle){ if(l.__pcSaved == null) l.__pcSaved = {opacity:l.options.opacity, fillOpacity:l.options.fillOpacity}; l.setStyle(on ? l.__pcSaved : {opacity:.08, fillOpacity:.02}); } else if(l.setOpacity) l.setOpacity(on ? 1 : .15); }); }
function restoreMap(){ if(!window.edrEdit || !edrEdit.drawnEach) return; edrEdit.drawnEach(l => { if(l.setStyle && l.__pcSaved){ l.setStyle(l.__pcSaved); delete l.__pcSaved; } else if(l.setOpacity) l.setOpacity(1); }); }
/* ---------- export ---------- */
const dl = (name, txt, type) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], {type})); a.download = name; a.click(); };
function exportG(){ dl(`edenrise-propostas-${new Date().toISOString().slice(0, 10)}.geojson`, JSON.stringify({type:"FeatureCollection", features:visible()}, null, 1), "application/geo+json"); }
function exportK(){ const esc = t => String(t || "").replace(/[<>&]/g, c => ({"<":"&lt;", ">":"&gt;", "&":"&amp;"}[c])); const co = a => a.map(c => c[0] + "," + c[1] + ",0").join(" ");
  const geo = g => g.type === "Point" ? `<Point><coordinates>${co([g.coordinates])}</coordinates></Point>` : g.type === "LineString" ? `<LineString><coordinates>${co(g.coordinates)}</coordinates></LineString>` : g.type === "Polygon" ? `<Polygon><outerBoundaryIs><LinearRing><coordinates>${co(g.coordinates[0])}</coordinates></LinearRing></outerBoundaryIs></Polygon>` : g.type === "MultiLineString" ? g.coordinates.map(l => `<LineString><coordinates>${co(l)}</coordinates></LineString>`).join("") : "";
  dl(`edenrise-propostas.kml`, `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>EdenRise propostas</name>${visible().filter(f => f.geometry).map(f => { const p = P(f); return `<Placemark><name>${esc(p.name || p.id)}</name><description>${esc(`${p.status} · ${p.created_by || ""} · ${p.category || ""} · ${p.note || ""}`)}</description>${geo(f.geometry)}</Placemark>`; }).join("")}</Document></kml>`, "application/vnd.google-earth.kml+xml"); }
/* ---------- open / close ---------- */
async function open(){ if(!S.ui) S.ui = build(); S.ui.classList.add("on"); S.sel.clear(); await load(); }
function close(){ if(S.ui) S.ui.classList.remove("on"); if(S.onlyOnMap){ S.onlyOnMap = false; restoreMap(); } }
window.edrProposals = {open, close, state:S, visible, load};
})();
