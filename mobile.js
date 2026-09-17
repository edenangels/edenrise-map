// EdenRise map — mobile layer: one thumb-reachable action bar, big touch targets, less chrome.
// Active only at ≤700px. It drives the controls that already exist (side panel, search, edit, brain) and adds
// nothing the desktop does not have, except "where am I", which a phone in the field needs.
(function(){
const MQ = window.matchMedia("(max-width:700px)");
const EN = (typeof LANG !== "undefined") && LANG === "en";
const T = EN
  ? {layers:"Layers", search:"Search", where:"GPS", edit:"Edit", brain:"Brain", legend:"Legend", close:"Close",
     gpsNo:"This device has no GPS", gpsFail:"Could not get your position", gpsOff:"Stopped following you"}
  : {layers:"Camadas", search:"Procurar", where:"GPS", edit:"Editar", brain:"Cérebro", legend:"Legenda", close:"Fechar",
     gpsNo:"Este aparelho não tem GPS", gpsFail:"Não consegui obter a tua posição", gpsOff:"Deixei de te seguir"};

const I = {
  layers:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M12 3 3 7.5 12 12l9-4.5z"/><path d="m3 12.5 9 4.5 9-4.5"/><path d="m3 17 9 4.5L21 17"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>',
  where:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/><path d="M12 1.5V5M12 19v3.5M1.5 12H5M19 12h3.5" stroke-linecap="round"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M4 20.5h4.2L20 8.7l-4.2-4.2L4 16.3z"/><path d="m14.6 5.9 3.5 3.5"/></svg>',
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
      if(!tap("#brainbtn")) say(EN ? "The Brain is still loading" : "O Cérebro ainda está a carregar"); setTimeout(sync, 150); }]
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

sync();
window.edrMobile = {sync, locate, stopLocate};
})();
