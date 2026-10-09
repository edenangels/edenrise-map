// EdenRise map — mobile layer: one thumb-reachable action bar, big touch targets, less chrome.
// Active only at ≤700px. It drives the controls that already exist (side panel, search, edit, brain) and adds
// nothing the desktop does not have, except "where am I", which a phone in the field needs.
(function(){
const MQ = window.matchMedia("(max-width:700px), ((pointer:coarse) and (max-width:1366px))");
const EN = (typeof LANG !== "undefined") && LANG === "en";
const T = EN
  ? {layers:"Layers", search:"Search", where:"GPS", edit:"Edit", brain:"Brain", board:"Board", legend:"Legend", close:"Close",
     gpsNo:"This device has no GPS", gpsFail:"Could not get your position", gpsOff:"Stopped following you", noNear:"Nothing within 40 m. Open an item on the map and tap Quadro.", penNote:"Drawn with the pen on the map", penName:"Pen annotation"}
  : {layers:"Camadas", search:"Procurar", where:"GPS", edit:"Editar", brain:"Cérebro", board:"Quadro", legend:"Legenda", close:"Fechar",
     gpsNo:"Este aparelho não tem GPS", gpsFail:"Não consegui obter a tua posição", gpsOff:"Deixei de te seguir", noNear:"Nada a menos de 40 m. Abre um item no mapa e toca em Quadro.", penNote:"Desenhado com a caneta no mapa", penName:"Anotação à caneta"};

const I = {
  layers:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M12 3 3 7.5 12 12l9-4.5z"/><path d="m3 12.5 9 4.5 9-4.5"/><path d="m3 17 9 4.5L21 17"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>',
  where:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/><path d="M12 1.5V5M12 19v3.5M1.5 12H5M19 12h3.5" stroke-linecap="round"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M4 20.5h4.2L20 8.7l-4.2-4.2L4 16.3z"/><path d="m14.6 5.9 3.5 3.5"/></svg>',
  board:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 18v3M16 18v3M7 12l3-3 3 2 4-4"/></svg>',
  brain:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M9.2 3.6A2.7 2.7 0 0 0 6.5 6.3a2.8 2.8 0 0 0-.9 5.3 2.8 2.8 0 0 0 2.2 4.6 2.7 2.7 0 0 0 4.2 1.9 2.7 2.7 0 0 0 4.2-1.9 2.8 2.8 0 0 0 2.2-4.6 2.8 2.8 0 0 0-.9-5.3 2.7 2.7 0 0 0-2.7-2.7A2.7 2.7 0 0 0 12 2.4a2.7 2.7 0 0 0-2.8 1.2z"/><path d="M12 2.4v16.6"/></svg>'
};

function tap(sel){ const el = document.querySelector(sel); if(el) el.click(); return !!el; }
function say(m){ if(window.toast) toast(m); }

/* ---------- bottom action bar ---------- */
const bar = document.createElement("nav");
bar.id = "mbar"; bar.setAttribute("aria-label", EN ? "Map actions" : "Ações do mapa");
const items = [
  ["layers", T.layers, () => { const s = document.getElementById("side"); if(!s) return; s.classList.toggle("open"); sync(); }],
  ["search", T.search, () => { const s = document.getElementById("side"); if(s) s.classList.add("open"); sync();
      const q = document.getElementById("q"); if(q){ q.scrollIntoView({block:"center"}); setTimeout(()=>q.focus(), 250); } }],
  ["where",  T.where,  () => { if(window.edrSurvey) return edrSurvey.open(); locate(); }],
  ["edit",   T.edit,   () => { const s = document.getElementById("side"); if(s) s.classList.remove("open");
      if(!tap("#editbtn")) say(EN ? "Edit mode is still loading" : "O modo de edição ainda está a carregar"); setTimeout(sync, 150); }],
  ["brain",  T.brain,  () => { const s = document.getElementById("side"); if(s) s.classList.remove("open");
      if(!tap("#brainbtn")) say(EN ? "The Brain is still loading" : "O Cérebro ainda está a carregar"); setTimeout(sync, 150); }],
  ["board",  T.board,  () => boardHere()]
];
for(const [key, label, fn] of items){
  const b = document.createElement("button");
  b.type = "button"; b.dataset.k = key; b.setAttribute("aria-label", label);
  b.innerHTML = `${I[key]}<span>${label}</span>`;
  b.addEventListener("click", e => { e.preventDefault(); fn(); });
  bar.appendChild(b);
}
document.body.appendChild(bar);

/* reflect what is actually open, so the bar never lies about the state */
function sync(){
  const open = {
    layers: !!document.querySelector("#side.open"),
    edit:   isShown("#etools") || isShown("#eform"),
    brain:  isShown("#brain"),
    where:  !!watch || !!document.querySelector("#svsheet.open") || !!(window.edrSurvey && edrSurvey.recording())
  };
  bar.querySelectorAll("button").forEach(b => b.classList.toggle("on", !!open[b.dataset.k]));
}
function isShown(sel){ const el = document.querySelector(sel); if(!el) return false;
  const cs = getComputedStyle(el); return cs.display !== "none" && cs.visibility !== "hidden" && !el.hidden; }
new MutationObserver(sync).observe(document.body, {subtree:true, attributes:true, attributeFilter:["class","style","hidden"], childList:true});

/* ---------- where am I ---------- */
let watch = null, me = null, ring = null;
function locate(){
  if(watch){ stopLocate(); say(T.gpsOff); return; }
  if(!navigator.geolocation){ say(T.gpsNo); return; }
  watch = true; sync();
  map.locate({watch:true, setView:true, maxZoom:18, enableHighAccuracy:true});
}
function stopLocate(){ map.stopLocate(); watch = null;
  if(me){ map.removeLayer(me); me = null; } if(ring){ map.removeLayer(ring); ring = null; } sync(); }
map.on("locationfound", e => {
  if(!me){
    me = L.circleMarker(e.latlng, {radius:9, color:"#fff", weight:3, fillColor:"#3ba9ff", fillOpacity:1, pane:"markerPane"}).addTo(map);
    ring = L.circle(e.latlng, {radius:e.accuracy || 20, color:"#3ba9ff", weight:1, fillColor:"#3ba9ff", fillOpacity:.12, interactive:false}).addTo(map);
  } else { me.setLatLng(e.latlng); ring.setLatLng(e.latlng).setRadius(e.accuracy || 20); }
});
map.on("locationerror", () => { say(T.gpsFail); stopLocate(); });

/* ---------- legend: a chip on the map, opened only when wanted ---------- */
const chip = document.createElement("button");
chip.id = "mleg"; chip.type = "button"; chip.textContent = T.legend;
chip.setAttribute("aria-label", T.legend);
chip.addEventListener("click", () => { const on = document.body.classList.toggle("legopen"); chip.classList.toggle("on", on); });
document.body.appendChild(chip);

/* ---------- close the panel by tapping the map beside it ---------- */
document.getElementById("map").addEventListener("click", () => {
  const s = document.querySelector("#side.open");
  if(s && MQ.matches){ s.classList.remove("open"); sync(); }
}, true);

/* a close button inside the panel, so the way out is always visible */
const side = document.getElementById("side");
if(side){
  const x = document.createElement("button");
  x.id = "msideclose"; x.type = "button"; x.setAttribute("aria-label", T.close); x.innerHTML = "✕";
  x.addEventListener("click", () => { side.classList.remove("open"); sync(); });
  side.prepend(x);
}

/* ---------- the board of the place I am standing in ---------- */
function refOf(t, f){ const p = f.properties || {}; return p.asset_id ? ("asset:" + p.asset_id) : (t + ":" + (p.key || p.name || p.tree_name || "?")); }
function centroidOf(g){ try{ const w = c => typeof c[0] === "number" ? [c] : c.flatMap(w); const pts = w(g.coordinates); return [pts.reduce((s, q) => s + q[1], 0) / pts.length, pts.reduce((s, q) => s + q[0], 0) / pts.length]; }catch(e){ return null; } }
function nearest(lat, lon, R){
  const kx = 111320 * Math.cos(lat * Math.PI / 180), ky = 110540; let best = null;
  const consider = (t, f, dBoost) => { const c = f.geometry && (f.geometry.type === "Point" ? [f.geometry.coordinates[1], f.geometry.coordinates[0]] : centroidOf(f.geometry)); if(!c) return;
    let d = Math.hypot((c[1] - lon) * kx, (c[0] - lat) * ky); if(/Polygon/.test(f.geometry.type) && window.turf){ try{ if(turf.booleanPointInPolygon([lon, lat], f)) d = 0; }catch(e){} }
    d += dBoost; if(d <= R && (!best || d < best.d)) best = {d, t, f, c}; };
  try{ for(const t in DATA){ const fc = DATA[t]; if(!fc || !fc.features) continue; const boost = /^(hydro|topo|habitat|defensible|wet_zones|catchments|fire_fuel|boundary_dev)/.test(t) ? 30 : 0; for(const f of fc.features) consider(t, f, boost); } }catch(e){}
  try{ for(const f of (window.edrEdit && edrEdit.feats ? edrEdit.feats() : [])) consider("propostas", f, 0); }catch(e){}
  return best;
}
function boardHere(){
  if(!navigator.geolocation){ say(T.gpsNo); return; }
  navigator.geolocation.getCurrentPosition(p => {
    const lat = p.coords.latitude, lon = p.coords.longitude; const b = nearest(lat, lon, 40); if(!b){ say(T.noNear); return; }
    const pr = b.f.properties || {}; const name = pr.name || pr.asset_id || pr.tree_name || b.t; const fid = b.t === "propostas" ? pr.id : refOf(b.t, b.f);
    const go = () => edrBoard.open(fid, {name, latlng:L.latLng(b.c[0], b.c[1])});
    if(window.edrBoard) go(); else { const sc = document.createElement("script"); sc.src = "board.js"; sc.onload = go; document.head.appendChild(sc); }
  }, () => say(T.gpsFail), {enableHighAccuracy:true, maximumAge:30000, timeout:15000});
}

/* ---------- a pen draws, a finger pans: freehand annotation straight onto the map in edit mode ---------- */
(function penLayer(){
  const el = document.getElementById("map"); if(!el || !window.PointerEvent) return; let stroke = null, line = null;
  const canDraw = () => window.edrEdit && edrEdit.on && edrEdit.on() && !(edrEdit.busy && edrEdit.busy());
  el.addEventListener("pointerdown", e => { if(e.pointerType !== "pen" || !canDraw()) return; stroke = {id:e.pointerId, pts:[map.mouseEventToLatLng(e)]}; map.dragging.disable(); line = L.polyline(stroke.pts, {color:"#c9a227", weight:3}).addTo(map); e.preventDefault(); }, true);
  el.addEventListener("pointermove", e => { if(!stroke || e.pointerId !== stroke.id) return; stroke.pts.push(map.mouseEventToLatLng(e)); line.setLatLngs(stroke.pts); e.preventDefault(); }, true);
  const end = e => { if(!stroke || e.pointerId !== stroke.id) return; const pts = stroke.pts; stroke = null; map.dragging.enable(); map.removeLayer(line); line = null; if(pts.length < 3) return;
    let ll = pts; try{ if(window.turf){ const s = turf.simplify(turf.lineString(pts.map(q => [q.lng, q.lat])), {tolerance:0.000006, highQuality:true}); ll = s.geometry.coordinates.map(c => [c[1], c[0]]); } }catch(err){}
    const l = L.polyline(ll); if(window.edrEdit && edrEdit.handoff) edrEdit.handoff(l, {layer:"propostas", preset:"outro", props:{name:T.penName, note:T.penNote}}); };
  el.addEventListener("pointerup", end, true); el.addEventListener("pointercancel", end, true);
})();

sync();
window.edrMobile = {sync, locate, stopLocate, boardHere, nearest};
})();
