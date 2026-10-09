// EdenRise map — local labels: the things inside a place, named on the map only when you are close enough to care.
//
// From the whole estate a pump room is a small rectangle; its valves and meters are noise. Zoom into it (level 19 and
// closer), or stand inside it with GPS on, and its contents get labels with their live state — open problems, parts
// on order, days since service — spread out so none sit on top of another; those that do not fit become dots.
// The place itself gets a title tag that opens its card, its 3D room when one was scanned, or its board.
// Nothing is stored here: names come from the GIS and team items, state from each item's timeline.
(function(){
const EN = (typeof LANG !== "undefined") && LANG === "en";
const API = "https://edenrise-brain.edenrise.workers.dev";
const ZMIN = 19, ZGPS = 17, MAXL = 40;
const LEVEL = {problem:"#e5484d", waiting:"#e0a030", ok:"#3fbf86", none:"#c9a227"};
const S = {on:true, layer:null, here:null, inside:null, rooms:new Map(), st:new Map(), raf:0};
try{ S.on = localStorage.getItem("edr_local_labels") !== "0"; }catch(e){}
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));
const css = document.createElement("style"); css.textContent = `
.lcl{background:none;border:0}
.lcl .lb{position:absolute;left:0;top:0;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;pointer-events:none;cursor:pointer;white-space:nowrap}
.lcl .lb span,.lcl .lb b{pointer-events:auto}
.lcl .lb span{background:rgba(20,17,13,.88);color:#f1e9d8;border:1.5px solid var(--lv,#c9a227);border-radius:8px;padding:3px 7px;font:600 11.5px/1.25 var(--ui,system-ui);max-width:170px;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 8px rgba(0,0,0,.35)}
.lcl .lb span small{display:block;font:600 10px var(--mono,monospace);color:var(--lv,#c9a227)}
.lcl .lb i{width:1.5px;height:var(--lift,8px);background:var(--lv,#c9a227);display:block}
.lcl .lb b{width:9px;height:9px;border-radius:50%;background:var(--lv,#c9a227);border:2px solid #14110d;display:block;margin-top:-1px}
.lcl .lb.dot span,.lcl .lb.dot i{display:none}
.lcl .lb:focus-visible span{outline:2px solid #f1e9d8;outline-offset:1px}
.lcl .zt{position:absolute;left:0;top:0;transform:translate(-50%,-50%);pointer-events:auto;cursor:pointer;white-space:nowrap;background:#c9a227;color:#1c1813;border-radius:999px;padding:3px 10px;font:700 11.5px var(--ui,system-ui);box-shadow:0 2px 10px rgba(0,0,0,.4);display:flex;gap:6px;align-items:center}
.lcl .zt button{all:unset;cursor:pointer;background:#1c1813;color:#f1e9d8;border-radius:999px;padding:1px 7px;font:700 11px var(--ui,system-ui)}
#lclbtn{position:absolute;right:10px;top:10px;z-index:900;height:34px;border-radius:17px;border:1px solid rgba(241,233,216,.3);background:rgba(28,24,19,.88);color:#f1e9d8;font:600 12px var(--ui,system-ui);padding:0 12px;cursor:pointer;display:none}
#lclbtn.show{display:block} #lclbtn.off{opacity:.6}
@media (pointer:coarse){ .lcl .lb span{font-size:12.5px;padding:4px 8px} #lclbtn{height:40px;border-radius:20px} }`;
document.head.appendChild(css);

/* ---------- which places are in play ---------- */
function zonesInView(){
  if(!window.edrZones || !window.turf) return [];
  const b = map.getBounds(), z = map.getZoom(), out = [];
  const ok = f => { try{ const bb = turf.bbox(f); return !(bb[2] < b.getWest() || bb[0] > b.getEast() || bb[3] < b.getSouth() || bb[1] > b.getNorth()); }catch(e){ return false; } };
  if(z >= ZMIN){ const c = map.getCenter(); for(const zn of edrZones.zonesAt([c.lat, c.lng], 400)){ if(ok(zn.poly)) out.push(zn); } }
  // standing inside a place counts from further out
  if(S.here && z >= ZGPS){ const inside = edrZones.zonesAt([S.here.lat, S.here.lng], 0).filter(x => x.inside); for(const zn of inside) if(!out.some(o => o.fid === zn.fid)) out.unshift(zn); S.inside = inside[0] || null; } else S.inside = null;
  return out.slice(0, 8);
}
function stateOf(fid){
  const hit = S.st.get(fid); if(hit && Date.now() - hit.at < 60000) return hit.v;
  if(!hit || !hit.pending){ S.st.set(fid, {at:hit ? hit.at : 0, v:hit ? hit.v : null, pending:true}); edrZones.status(fid).then(v => { S.st.set(fid, {at:Date.now(), v}); schedule(); }).catch(() => S.st.set(fid, {at:Date.now(), v:null})); }
  return hit ? hit.v : null;
}
function hasRoom(fid){
  if(S.rooms.has(fid)) return S.rooms.get(fid); S.rooms.set(fid, null);
  fetch(`${API}/item/${encodeURIComponent(fid)}`).then(r => r.json()).then(d => { const m = d.media || []; S.rooms.set(fid, {room:m.some(x => /^\[sala3d\]\s/.test(x.caption || "")), board:m.some(x => /^\[quadro\]/.test(x.caption || ""))}); schedule(); }).catch(() => {});
  return null;
}

/* ---------- drawing: one DOM layer, greedy declutter in screen space ---------- */
function schedule(){ cancelAnimationFrame(S.raf); S.raf = requestAnimationFrame(draw); }
function draw(){
  if(!S.layer){ S.layer = L.layerGroup().addTo(map); }
  S.layer.clearLayers(); const btn = document.getElementById("lclbtn");
  const zones = (window.edrZones && !document.body.classList.contains("editing")) ? zonesInView() : [];
  if(btn){ btn.classList.toggle("show", zones.length > 0); btn.classList.toggle("off", !S.on); btn.textContent = S.on ? (EN ? "🏷 Labels on" : "🏷 Etiquetas") : (EN ? "🏷 Labels off" : "🏷 Sem etiquetas"); }
  if(!S.on || !zones.length) return;
  const titles = [], labels = []; let n = 0; const size = map.getSize(); const kidsOf = new Map();
  for(const zn of zones){ let kids = []; try{ kids = edrZones.children(zn); }catch(e){} kidsOf.set(zn.fid, kids.map(k => ({...k, p:map.latLngToContainerPoint(L.latLng(k.c[0], k.c[1]))})).filter(k => k.p.x > -40 && k.p.y > -40 && k.p.x < size.x + 40 && k.p.y < size.y + 40)); }
  for(const zn of zones){
    if(!kidsOf.get(zn.fid).length && !(S.inside && S.inside.fid === zn.fid)) continue;   // a place with nothing in view stays quiet
    let c; try{ const p = turf.pointOnFeature(zn.poly).geometry.coordinates; c = L.latLng(p[1], p[0]); }catch(e){ continue; }
    const info = hasRoom(zn.fid); const here = S.inside && S.inside.fid === zn.fid;
    const icon = L.divIcon({className:"lcl", iconSize:[0, 0], html:`<div class="zt" role="button" tabindex="0" aria-label="${esc(zn.name)}">${here ? "📍 " : ""}${esc(zn.name)}${info && info.room ? `<button data-k="room" aria-label="${EN ? "3D room" : "Sala 3D"}">🧊 3D</button>` : ""}${info && info.board ? `<button data-k="board" aria-label="${EN ? "Board" : "Quadro"}">▦</button>` : ""}</div>`});
    const m = L.marker(c, {icon, keyboard:false, zIndexOffset:900}).addTo(S.layer); m.__fid = zn.fid; bindTitle(m, zn); titles.push(m);
  }
  for(const zn of zones){
    for(const k of kidsOf.get(zn.fid)){
      const p = k.p; if(n++ >= MAXL) break;
      const st = stateOf(k.fid); const lv = st ? st.level : "none"; const sub = st && st.summary ? st.summary : "";
      const icon = L.divIcon({className:"lcl", iconSize:[0, 0], html:`<div class="lb" style="--lv:${LEVEL[lv]};--lift:8px" role="button" tabindex="0" aria-label="${esc(k.name)}${sub ? " · " + esc(sub) : ""}"><span>${esc(k.name)}${sub ? `<small>${esc(sub)}</small>` : ""}</span><i></i><b></b></div>`});
      const m = L.marker(L.latLng(k.c[0], k.c[1]), {icon, keyboard:false, zIndexOffset:800}).addTo(S.layer); m.on("click", () => openItem(k));
      labels.push({m, k, p, sub, lv});
    }
  }
  // declutter with the real sizes: titles stay put; each label takes the lowest free lift above its spot, else becomes a dot
  const placed = []; const gap = 4; const mp = map.getContainer().getBoundingClientRect();
  const free = r => !placed.some(q => r.x < q.x + q.w + gap && r.x + r.w + gap > q.x && r.y < q.y + q.h + gap && r.y + r.h + gap > q.y);
  for(const t of titles){ const el = t.getElement() && t.getElement().querySelector(".zt"); if(!el) continue; const r = el.getBoundingClientRect(); placed.push({x:r.left - mp.left, y:r.top - mp.top, w:r.width, h:r.height}); }
  for(const it of labels) placed.push({x:it.p.x - 13, y:it.p.y - 30, w:26, h:32});   // every item's own map pin is an obstacle too
  labels.sort((a, b) => (b.lv === "problem") - (a.lv === "problem") || a.p.y - b.p.y);   // problems get first pick
  for(const it of labels){
    const el = it.m.getElement() && it.m.getElement().querySelector(".lb"); if(!el) continue; const sp = el.querySelector("span"); const w = sp.offsetWidth, h = sp.offsetHeight; let lift = null;
    let dx = 0; const sides = [0, -(w / 2 - 10), w / 2 - 10];   // straight up first, then leaning left / right (the stem still meets the label)
    outer: for(const L2 of [8, 28, 50, 72, 94]) for(const d of sides){ const r = {x:it.p.x - w / 2 + d, y:it.p.y - 9 - L2 - h, w, h}; if(free(r)){ placed.push(r); lift = L2; dx = d; break outer; } }
    if(lift != null && dx) sp.style.transform = `translateX(${Math.round(dx)}px)`;
    if(lift == null){ el.classList.add("dot"); it.m.setZIndexOffset(700); it.m.bindTooltip(`${it.k.name}${it.sub ? " · " + it.sub : ""}`, {direction:"top"}); placed.push({x:it.p.x - 6, y:it.p.y - 12, w:12, h:12}); }
    else el.style.setProperty("--lift", lift + "px");
  }
  // labels that did not fit: say how many on the place's title (zoom in, or open the 3D room / camera for the rest)
  const hidden = new Map(); for(const it of labels){ const el = it.m.getElement() && it.m.getElement().querySelector(".lb.dot"); if(el){ const z = zones.find(zn => kidsOf.get(zn.fid).some(k => k.fid === it.k.fid)); if(z) hidden.set(z.fid, (hidden.get(z.fid) || 0) + 1); } }
  for(const t of titles){ const zt = t.getElement() && t.getElement().querySelector(".zt"); const h = zt && hidden.get(t.__fid); if(h){ const sp = document.createElement("small"); sp.textContent = `+${h}`; sp.title = EN ? `${h} more — zoom in` : `mais ${h} — aproxima`; sp.style.cssText = "font:700 10.5px var(--mono,monospace);opacity:.8"; zt.insertBefore(sp, zt.querySelector("button")); } }
}
function bindTitle(m, zn){
  const el = m.getElement && m.getElement(); if(!el) return; const t = el.querySelector(".zt"); if(!t || t.__b) return; t.__b = true;
  t.addEventListener("click", ev => { ev.stopPropagation(); const k = ev.target.closest("button"); const ll = map.getCenter(); const opts = {name:zn.name, latlng:L.latLng(ll.lat, ll.lng), aliases:[]};
    try{ const id = zn.t !== "propostas" && window.edrRefOf ? edrRefOf(zn.t, zn.f.properties || {}) : null; if(id) opts.aliases = id.aliases || []; }catch(e){}
    if(k && k.dataset.k === "room"){ const go = () => window.edrRoom && edrRoom.open(zn.fid, opts); if(window.edrRoom) go(); else { const s = document.createElement("script"); s.src = "room.js"; s.onload = go; document.head.appendChild(s); } return; }
    if(k && k.dataset.k === "board"){ if(window.edrBoard) edrBoard.open(zn.fid, opts); return; }
    openZone(zn); });
  t.addEventListener("keydown", ev => { if(ev.key === "Enter") t.click(); });
}
function openZone(zn){ if(zn.t === "propostas"){ if(window.edrEdit && edrEdit.openById) edrEdit.openById(zn.fid); return; } let ll; try{ const p = turf.pointOnFeature(zn.poly).geometry.coordinates; ll = L.latLng(p[1], p[0]); }catch(e){ ll = map.getCenter(); } if(window.showCard) showCard(zn.f.properties, ll, typeof title_i18n === "function" ? title_i18n(zn.t, zn.t) : zn.t, zn.t); }
function openItem(k){ if(k.t === "propostas"){ if(window.edrEdit && edrEdit.openById) edrEdit.openById(k.fid); return; } if(window.showCard) showCard(k.f.properties, L.latLng(k.c[0], k.c[1]), typeof title_i18n === "function" ? title_i18n(k.t, k.t) : k.t, k.t); }

/* ---------- wiring ---------- */
function toggle(){ S.on = !S.on; try{ localStorage.setItem("edr_local_labels", S.on ? "1" : "0"); }catch(e){} schedule(); }
const btn = document.createElement("button"); btn.id = "lclbtn"; btn.type = "button"; btn.onclick = toggle; (document.getElementById("map") || document.body).appendChild(btn);
L.DomEvent.disableClickPropagation(btn);
map.on("moveend zoomend", schedule);
map.on("locationfound", e => { const prev = S.here; S.here = e.latlng; if(!prev || prev.distanceTo(e.latlng) > 3) schedule(); });
document.addEventListener("edr-item-note", e => { if(e.detail && e.detail.fid){ S.st.delete(e.detail.fid); schedule(); } });
document.addEventListener("edr-room-saved", e => { if(e.detail && e.detail.fid){ S.rooms.delete(e.detail.fid); schedule(); } });
setTimeout(schedule, 1500);
window.edrLocal = {refresh:schedule, toggle, _state:S};
})();
