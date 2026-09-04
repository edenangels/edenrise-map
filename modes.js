// EdenRise map — use-case modes: 🔥 Fogo · 📍 Campo · 🕰️ Tempo · 🔍 Pesquisa
// Depends on globals from index.html: map, layerObjs, DATA, GROUPS, LANG, LIVE, bases, popup, buildSidebar
(function(){
const OGC = "https://ogcapi.dgterritorio.gov.pt/collections/";
const EST = [37.512, -8.645];
const tx = () => ({
  pt:{fire:"🔥 Fogo",field:"📍 Campo",time:"🕰️ Tempo",exit:"✕ sair do modo",search:"Pesquisar: ativo, edifício, árvore, zona…",
      wind:"Vento agora",gusts:"rajadas",hum:"humidade",temp:"temp.",worst:"Edifícios mais expostos",water:"pontos de água visíveis",
      locate:"📡 Localizar-me",follow:"seguir",report:"📍 Reportar ocorrência",reportHint:"Cria um pino no local e abre uma mensagem WhatsApp pronta com coordenadas e o ativo mais próximo.",
      copied:"Copiado. Cole no WhatsApp/ClickUp.",nogps:"Sem GPS — usa o centro do mapa.",
      sat:"Vigor das pastagens por data (Sentinel-2)",swipe:"Comparar ortofotos — arraste a barra",left:"Esquerda",right:"Direita",mean:"NDVI médio",
      nearest:"Ativo mais próximo",noresults:"sem resultados"},
  en:{fire:"🔥 Fire",field:"📍 Field",time:"🕰️ Time",exit:"✕ leave mode",search:"Search: asset, building, tree, zone…",
      wind:"Wind now",gusts:"gusts",hum:"humidity",temp:"temp.",worst:"Most exposed buildings",water:"water points shown",
      locate:"📡 Locate me",follow:"follow",report:"📍 Report an occurrence",reportHint:"Drops a pin here and opens a ready WhatsApp message with coordinates and the nearest asset.",
      copied:"Copied. Paste into WhatsApp/ClickUp.",nogps:"No GPS — using map centre.",
      sat:"Pasture vigour by date (Sentinel-2)",swipe:"Compare orthophotos — drag the bar",left:"Left",right:"Right",mean:"mean NDVI",
      nearest:"Nearest asset",noresults:"no results"}
})[LANG];

// ---------- UI scaffold ----------
const side = document.getElementById("side");
const bar = document.createElement("div"); bar.className="basemaps"; bar.id="modes";
const panel = document.createElement("div"); panel.id="modepanel"; panel.className="risk"; panel.style.display="none";
const search = document.createElement("div"); search.id="searchbox";
search.innerHTML = `<input id="q" type="search" autocomplete="off"><div id="qres"></div>`;
const anchor = document.getElementById("basemaps");
anchor.after(search); search.after(bar); bar.after(panel);
let MODE = null; const state = {}; const layers = {};
function setLayer(t, on){ const o = layerObjs[t]; if(!o) return; if(o.box){ if(o.box.checked!==on){ o.box.checked=on; o.box.onchange(); } } else { on ? o.lyr.addTo(map) : map.removeLayer(o.lyr); } }
function snapshot(){ state.on = {}; for(const t in layerObjs) state.on[t] = map.hasLayer(layerObjs[t].lyr); state.live = {}; for(const k in LIVE) state.live[k] = map.hasLayer(LIVE[k].lyr); }
function restore(){ for(const t in state.on) setLayer(t, state.on[t]); for(const k in state.live){ const on = state.live[k]; on ? LIVE[k].lyr.addTo(map) : map.removeLayer(LIVE[k].lyr); } }
function only(list){ for(const t in layerObjs) setLayer(t, list.includes(t)); }
function renderBar(){
  const t = tx(); bar.innerHTML = "";
  [["fire",t.fire],["field",t.field],["time",t.time]].forEach(([m,l])=>{ const b=document.createElement("button"); b.textContent=l; if(MODE===m) b.classList.add("on"); b.onclick=()=>toggle(m); bar.appendChild(b); });
  document.getElementById("q").placeholder = t.search;
}
function leave(){ if(!MODE) return; (leavers[MODE]||(()=>{}))(); MODE=null; panel.style.display="none"; panel.innerHTML=""; document.body.classList.remove("field"); restore(); renderBar(); }
function toggle(m){ if(MODE===m){ leave(); return; } leave(); snapshot(); MODE=m; panel.style.display="block"; document.body.classList.toggle("field", m==="field"); enter[m](); renderBar(); }
const enter = {}, leavers = {};

// ---------- 🔥 FIRE MODE ----------
enter.fire = async function(){
  const t = tx();
  only(["cadastre_parcels","buildings_pt","water_sources_pt","water_storage_pt","paths_ln","defensible_space","fire_fuel_strips"]);
  LIVE.fwi.lyr.addTo(map); LIVE.hs.lyr.addTo(map);
  panel.innerHTML = `<b>${t.fire}</b><div id="windbox" style="margin-top:4px">…</div><div id="worst" style="margin-top:6px"></div>`;
  // worst buildings
  const D = (typeof DEFDATA!=="undefined") ? DEFDATA.defensible_space.features.slice(0,3) : [];
  layers.worst = L.layerGroup(D.map((f,i)=>{ const c = L.geoJSON(f.geometry).getBounds().getCenter();
    return L.marker(c,{icon:L.divIcon({className:"", html:`<div class="pin fire">${i+1}</div>`, iconSize:[26,26], iconAnchor:[13,13]})}).bindPopup(popup(f.properties)); })).addTo(map);
  document.getElementById("worst").innerHTML = `<div style="font-size:11px;color:var(--muted)">${t.worst}</div>` + D.map((f,i)=>`<div class="wrow" data-i="${i}">${i+1}. ${f.properties.name} — <b style="color:#d3705e">${f.properties.score}</b></div>`).join("");
  panel.querySelectorAll(".wrow").forEach(el=>el.onclick=()=>{ const f=D[+el.dataset.i]; map.fitBounds(L.geoJSON(f.geometry).getBounds(),{maxZoom:18}); });
  try{
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${EST[0]}&longitude=${EST[1]}&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m,temperature_2m,relative_humidity_2m&hourly=wind_speed_10m,wind_direction_10m&forecast_days=1&timezone=Europe%2FLisbon`;
    const w = await fetch(u).then(r=>r.json()); const c = w.current;
    const dirs = LANG==="en"?["N","NE","E","SE","S","SW","W","NW"]:["N","NE","E","SE","S","SO","O","NO"]; const card = dirs[Math.round(c.wind_direction_10m/45)%8];
    document.getElementById("windbox").innerHTML = `<div><b>${t.wind}: ${card} ${Math.round(c.wind_speed_10m)} km/h</b> · ${t.gusts} ${Math.round(c.wind_gusts_10m)} · ${t.hum} ${c.relative_humidity_2m}% · ${t.temp} ${Math.round(c.temperature_2m)}°</div><div style="font-size:10.5px;color:var(--muted)">Open-Meteo · ${c.time.replace("T"," ")}</div>`;
    // wind arrows: 5 across the estate pointing where the wind blows TO
    const rot = (c.wind_direction_10m + 180) % 360; const spd = c.wind_speed_10m;
    layers.wind = L.layerGroup([[37.505,-8.655],[37.505,-8.635],[37.512,-8.645],[37.519,-8.655],[37.519,-8.635]].map(ll =>
      L.marker(ll,{interactive:false,icon:L.divIcon({className:"", html:`<div class="windarrow" style="transform:rotate(${rot}deg);opacity:${Math.min(.35+spd/40,1)}">➤</div>`, iconSize:[40,40], iconAnchor:[20,20]})}))).addTo(map);
  }catch(e){ document.getElementById("windbox").textContent = "Open-Meteo —"; }
  map.fitBounds(layerObjs.cadastre_parcels.lyr.getBounds().pad(.08));
};
leavers.fire = ()=>{ for(const k of ["worst","wind"]) if(layers[k]){ map.removeLayer(layers[k]); delete layers[k]; } };

// ---------- 📍 FIELD MODE ----------
let me = null, meCircle = null, follow = false, watching = false;
enter.field = function(){
  const t = tx();
  panel.innerHTML = `<button id="loc" class="big">${t.locate}</button> <label style="font-size:12px"><input type="checkbox" id="follow"> ${t.follow}</label>
    <button id="rep" class="big" style="margin-top:8px;background:#7a2f22;color:#fff">${t.report}</button><div style="font-size:10.5px;color:var(--muted);margin-top:4px">${t.reportHint}</div><div id="repout" style="font-size:11.5px;margin-top:4px"></div>`;
  document.getElementById("loc").onclick = ()=>{ if(!watching){ map.locate({watch:true,setView:false,enableHighAccuracy:true}); watching=true; } else map.setView(me?me.getLatLng():map.getCenter(), Math.max(map.getZoom(),17)); };
  document.getElementById("follow").onchange = e=>{ follow = e.target.checked; if(follow && me) map.setView(me.getLatLng(), Math.max(map.getZoom(),17)); };
  document.getElementById("rep").onclick = report;
  map.on("locationfound", onLoc);
  ["asset_registry","buildings_pt","water_sources_pt","water_storage_pt","wastewater_pt","paths_ln","water_network_ln","cadastre_parcels"].forEach(x=>setLayer(x,true));
};
leavers.field = ()=>{ map.off("locationfound", onLoc); map.stopLocate(); watching=false; if(me){ map.removeLayer(me); me=null; } if(meCircle){ map.removeLayer(meCircle); meCircle=null; } if(layers.rep){ map.removeLayer(layers.rep); delete layers.rep; } };
function onLoc(e){
  if(!me){ me = L.marker(e.latlng,{icon:L.divIcon({className:"", html:`<div class="me"></div>`, iconSize:[18,18], iconAnchor:[9,9]})}).addTo(map); meCircle = L.circle(e.latlng,{radius:e.accuracy,color:"#7fa8cc",weight:1,fillOpacity:.08}).addTo(map); map.setView(e.latlng, Math.max(map.getZoom(),17)); }
  else { me.setLatLng(e.latlng); meCircle.setLatLng(e.latlng).setRadius(e.accuracy); if(follow) map.panTo(e.latlng); }
}
function nearestAsset(ll){
  let best=null, bd=1e9; (DATA.asset_registry?DATA.asset_registry.features:[]).forEach(f=>{ const c=f.geometry.coordinates; const pts = f.geometry.type==="Point"?[c]:c; pts.forEach(p=>{ const d=map.distance(ll,[p[1],p[0]]); if(d<bd){bd=d;best=f;} }); });
  return best ? {asset:best.properties, d:Math.round(bd)} : null;
}
function report(){
  const t = tx(); const ll = me ? me.getLatLng() : map.getCenter(); const src = me ? "GPS" : t.nogps;
  if(layers.rep) map.removeLayer(layers.rep);
  layers.rep = L.marker(ll,{icon:L.divIcon({className:"", html:`<div class="pin rep">!</div>`, iconSize:[26,26], iconAnchor:[13,26]})}).addTo(map);
  const n = nearestAsset(ll); const lat = ll.lat.toFixed(6), lon = ll.lng.toFixed(6);
  const link = `${location.origin}${location.pathname}#at=${lat},${lon}`;
  const msg = (LANG==="en"?`📍 EdenRise occurrence\nWhere: ${lat}, ${lon} (${src})\n`:`📍 Ocorrência EdenRise\nLocal: ${lat}, ${lon} (${src})\n`) +
              (n?`${t.nearest}: ${n.asset.asset_id} — ${n.asset.name} (${n.d} m)\n`:"") + `${LANG==="en"?"Map":"Mapa"}: ${link}\n${LANG==="en"?"What's wrong":"O que se passa"}: `;
  try{ navigator.clipboard && navigator.clipboard.writeText(msg); }catch(e){}
  document.getElementById("repout").innerHTML = `${t.copied}<br><a href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" style="color:#7fa8cc">WhatsApp →</a> · <a href="${link}" style="color:#7fa8cc">link</a>`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}
// #at=lat,lon deep link
(function(){ const m = location.hash.match(/#at=(-?\d+\.\d+),(-?\d+\.\d+)/); if(m){ const ll=[+m[1],+m[2]]; setTimeout(()=>{ map.setView(ll,18); L.marker(ll,{icon:L.divIcon({className:"", html:`<div class="pin rep">!</div>`, iconSize:[26,26], iconAnchor:[13,26]})}).addTo(map); }, 600); } })();

// ---------- 🕰️ TIME MODE ----------
const YEARS = [["ortos1995-irg","1995 (IR)"],["ortos2004-2006-rgb","2004–06"],["ortos2007-rgb","2007"],["ortos2010-rgb","2010"],["ortos2012-rgb","2012"],["ortos2015-rgb","2015"],["ortos2018-rgb","2018"],["ortos-rgb","2023"],["local2025","2025"]];
const OgcTile = L.TileLayer.extend({ getTileUrl(c){ const n=Math.pow(2,c.z), R=6378137*Math.PI, s=2*R/n; const x0=-R+c.x*s, y1=R-c.y*s; return `${OGC}${this.options.coll}/map?bbox=${x0},${y1-s},${x0+s},${y1}&bbox-crs=http://www.opengis.net/def/crs/EPSG/0/3857&width=256&height=256&f=png`; } });
function orthoLayer(coll, pane){ return coll==="local2025" ? L.tileLayer("ortho2025/{z}/{x}/{y}.jpg",{minZoom:12,maxNativeZoom:18,maxZoom:20,pane,bounds:[[37.497,-8.661],[37.526,-8.628]]}) : new OgcTile("",{coll,pane,maxZoom:20,attribution:"© DGT"}); }
let divider = null, dragging = false;
enter.time = function(){
  const t = tx();
  only(["cadastre_parcels","grazing_parks_pg","agri_features_pg"]);
  map.removeLayer(bases[curBase]);                             // base handled by the swipe pair
  if(!map.getPane("swipeL")){ map.createPane("swipeL").style.zIndex=150; map.createPane("swipeR").style.zIndex=160; }
  const dates = [...new Set(Object.values(SATDATA.series).flatMap(s=>s.pts.map(p=>p[0])))].sort();
  panel.innerHTML = `<div style="font-size:11px;color:var(--muted)">${t.sat}</div><input type="range" id="tsl" min="0" max="${dates.length-1}" value="${dates.length-1}" style="width:100%"><div id="tinfo"></div>
    <div style="font-size:11px;color:var(--muted);margin-top:8px">${t.swipe}</div><div class="row2"><select id="yl"></select><select id="yr"></select></div>`;
  const yl=document.getElementById("yl"), yr=document.getElementById("yr");
  YEARS.forEach(([c,l])=>{ yl.add(new Option(l,c)); yr.add(new Option(l,c)); }); yl.value="ortos2004-2006-rgb"; yr.value="local2025";
  const setPair=()=>{ if(layers.L) map.removeLayer(layers.L); if(layers.R) map.removeLayer(layers.R); layers.L=orthoLayer(yl.value,"swipeL").addTo(map); layers.R=orthoLayer(yr.value,"swipeR").addTo(map); clip(); };
  yl.onchange=yr.onchange=setPair; setPair();
  divider = document.createElement("div"); divider.id="divider"; document.getElementById("map").appendChild(divider);
  divider.style.left = Math.round(document.getElementById("map").getBoundingClientRect().width / 2) + "px";
  const start=e=>{dragging=true;e.preventDefault();}, move=e=>{ if(!dragging) return; const r=document.getElementById("map").getBoundingClientRect(); const x=(e.touches?e.touches[0].clientX:e.clientX)-r.left; divider.style.left=Math.max(0,Math.min(r.width,x))+"px"; clip(); }, end=()=>dragging=false;
  divider.addEventListener("mousedown",start); divider.addEventListener("touchstart",start,{passive:false}); window.addEventListener("mousemove",move); window.addEventListener("touchmove",move,{passive:false}); window.addEventListener("mouseup",end); window.addEventListener("touchend",end);
  map.on("move", clip); map.on("resize", clip);
  const sl=document.getElementById("tsl"); const paint=()=>{ const d=dates[+sl.value]; let sum=0,n=0;
    ["grazing_parks_pg","agri_features_pg"].forEach(tn=>{ const o=layerObjs[tn]; if(!o) return; o.lyr.eachLayer(l=>{ const nm=l.feature.properties.name; let v=null;
      for(const s of Object.values(SATDATA.series)){ if(s.name!==nm) continue; let best=null; for(const p of s.pts){ if(p[0]<=d) best=p; } if(best){ v=best[1]; break; } }
      if(v==null){ l.setStyle({fillOpacity:.05,color:"#666"}); return; } sum+=v;n++; const col = v>=.6?"#1b5e20":v>=.45?"#7cb342":v>=.35?"#fdd835":v>=.25?"#fb8c00":"#8d6e63"; l.setStyle({fillColor:col,fillOpacity:.65,color:col,weight:1}); }); });
    document.getElementById("tinfo").innerHTML=`<b>${d}</b> · ${t.mean} ${n?(sum/n).toFixed(2):"—"}`; };
  sl.oninput=paint; paint();
  map.fitBounds(layerObjs.cadastre_parcels.lyr.getBounds().pad(.05));
};
function clip(){ if(!divider) return; const r=document.getElementById("map").getBoundingClientRect(); const x=parseFloat(divider.style.left); const pane=map.getPane("swipeR"); const p=map.containerPointToLayerPoint([x,0]); pane.style.clipPath=`inset(0 0 0 ${x}px)`; pane.style.webkitClipPath=pane.style.clipPath; }
leavers.time = ()=>{ ["L","R"].forEach(k=>{ if(layers[k]){ map.removeLayer(layers[k]); delete layers[k]; } }); if(divider){ divider.remove(); divider=null; } map.off("move", clip); map.off("resize", clip);
  bases[curBase].addTo(map); ["grazing_parks_pg","agri_features_pg"].forEach(tn=>{ const o=layerObjs[tn]; if(o) o.lyr.resetStyle(); }); };

// ---------- 🔍 SEARCH ----------
const IDX = [];
function buildIndex(){
  IDX.length = 0;
  for(const [t, fc] of Object.entries(DATA)){ if(!fc || !fc.features || !layerObjs[t]) continue;
    for(const f of fc.features){ const p=f.properties||{}; const label = p.name || p.asset_id || p.tree_id || p.key; if(!label) continue;
      const extra = [p.asset_id, p.tree_id, p.key, p.cadastral_article, p.status].filter(Boolean).join(" ");
      IDX.push({t, f, label:String(label), hay:(label+" "+extra).toLowerCase()}); } }
}
const q = document.getElementById("q"), qres = document.getElementById("qres");
q.oninput = ()=>{ const v=q.value.trim().toLowerCase(); if(v.length<2){ qres.innerHTML=""; return; } if(!IDX.length) buildIndex();
  const hits = IDX.filter(x=>x.hay.includes(v)).slice(0,12);
  qres.innerHTML = hits.length ? hits.map((h,i)=>`<div class="qhit" data-i="${i}">${h.label} <span style="color:var(--muted)">· ${(LANG==="en"&&typeof T_EN!=="undefined"&&T_EN[h.t])||h.t}</span></div>`).join("") : `<div class="qhit" style="color:var(--muted)">${tx().noresults}</div>`;
  qres.querySelectorAll(".qhit[data-i]").forEach(el=>el.onclick=()=>{ const h=hits[+el.dataset.i]; goTo(h); qres.innerHTML=""; q.value=h.label; });
};
q.onkeydown = e=>{ if(e.key==="Enter"){ const first=qres.querySelector(".qhit[data-i]"); if(first) first.click(); } };
function goTo(h){ const o=layerObjs[h.t]; setLayer(h.t,true); let target=null; o.lyr.eachLayer(l=>{ if(!target && l.feature===h.f) target=l; });
  if(!target) return; const ll = typeof target.getLatLng==="function" ? target.getLatLng() : target.getBounds().getCenter();
  map.setView(ll, typeof target.getLatLng==="function"?18:17); target.openPopup(ll); }

// ---------- wiring ----------
renderBar();
const _langs = document.getElementById("langs"); if(_langs) _langs.addEventListener("click", ()=>setTimeout(()=>{ renderBar(); if(MODE){ const m=MODE; leave(); toggle(m); } }, 50));
})();
