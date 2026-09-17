// EdenRise map — "Ver": the camera as a window into the GIS.
//
// Location-based AR, the honest kind: GPS gives where you stand, the compass and gyro give where the phone points,
// and the map's own features are drawn over the live camera at the bearing and elevation angle they really sit at,
// each with its distance. Tap a label to open its card. Point the reticle at the ground and "Marcar" ray-casts
// from the phone onto our 0.5 m LiDAR terrain to get the GPS position of the spot you are looking at.
//
// No Google/Apple positioning service, no cloud, no model download: camera + sensors + cached tiles, so it works
// with the network off. Limits, stated on screen: GPS ±3–5 m and compass ±5–15°, so at 50 m a label can sit a few
// metres from its object. Good for "which tank is this" and "where does the boundary run", not for staking.
(function(){
if(typeof map === "undefined") return;
const EN = (typeof LANG !== "undefined") && LANG === "en";
const T = EN ? {
  title:"Camera view", noCam:"No camera access. Allow the camera in the browser settings.", noOri:"This device gives no compass heading — labels cannot be placed.",
  tapStart:"Tap to start the camera and compass", mark:"Mark what I'm looking at", close:"Close", calib:"Compass: wave the phone in a figure of 8 if labels drift",
  noGround:"Point lower — I need to see the ground to place a mark.", marked:"Marked from the camera", radius:"radius",
  note:(d,h,a)=>`Marked from the camera ${new Date().toLocaleString("en-GB")}: ${d} m away on bearing ${h}°, GPS accuracy ${a} m, compass ±10° (phone AR, not survey grade).`,
  waiting:"Getting a fix…", far:"m"
} : {
  title:"Ver com a câmara", noCam:"Sem acesso à câmara. Autoriza a câmara nas definições do browser.", noOri:"Este aparelho não dá rumo de bússola — não consigo colocar as etiquetas.",
  tapStart:"Toca para ligar a câmara e a bússola", mark:"Marcar o que estou a ver", close:"Fechar", calib:"Bússola: faz um 8 com o telemóvel se as etiquetas fugirem",
  noGround:"Aponta mais para baixo — preciso de ver o chão para marcar.", marked:"Marcado a partir da câmara", radius:"raio",
  note:(d,h,a)=>`Marcado a partir da câmara ${new Date().toLocaleString("pt-PT")}: a ${d} m no rumo ${h}°, precisão GPS ${a} m, bússola ±10° (AR do telemóvel, não é topografia).`,
  waiting:"A apanhar sinal…", far:"m"
};
const RADIUS = 300;            // metres: features farther than this are not drawn
const HFOV = 62;               // degrees: typical rear camera, portrait; close enough for labels
const EYE = 1.6;               // metres: phone held at eye height

const S = {on:false, pos:null, acc:99, heading:null, pitch:0, feats:[], watch:null, raf:null, stream:null};
let ui = null, video = null, canvas = null, ctx = null, hits = [];

const css = document.createElement("style"); css.textContent = `
#arview{position:fixed;inset:0;z-index:1800;background:#000;display:none}
#arview.on{display:block}
#arview video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
#arview canvas{position:absolute;inset:0;width:100%;height:100%}
#arview .top{position:absolute;top:calc(10px + env(safe-area-inset-top,0px));left:12px;right:12px;display:flex;align-items:center;justify-content:space-between;gap:8px;color:#fff;font:600 12px var(--mono);text-shadow:0 1px 3px #000}
#arview .x{width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:rgba(20,17,13,.7);color:#fff;font-size:17px;cursor:pointer}
#arview .ret{position:absolute;left:50%;top:50%;width:28px;height:28px;margin:-14px 0 0 -14px;border:2px solid #ffd166;border-radius:50%;box-shadow:0 0 0 2px rgba(0,0,0,.5);pointer-events:none}
#arview .ret::after{content:"";position:absolute;left:50%;top:50%;width:4px;height:4px;margin:-2px 0 0 -2px;background:#ffd166;border-radius:50%}
#arview .bot{position:absolute;left:12px;right:12px;bottom:calc(14px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:8px}
#arview .bot button{min-height:56px;border-radius:14px;border:0;background:var(--straw);color:var(--bark);font:700 15px var(--ui);cursor:pointer}
#arview .hint{color:#fff;font:500 11.5px var(--ui);text-align:center;text-shadow:0 1px 3px #000;opacity:.9}
#arview .start{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font:600 16px var(--ui);text-align:center;padding:30px;background:rgba(0,0,0,.55)}
`; document.head.appendChild(css);

/* ---------- geometry ---------- */
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
function bearing(a, b){ const φ1 = rad(a[0]), φ2 = rad(b[0]), Δλ = rad(b[1] - a[1]);
  const y = Math.sin(Δλ) * Math.cos(φ2), x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (deg(Math.atan2(y, x)) + 360) % 360; }
function dist(a, b){ return L.latLng(a[0], a[1]).distanceTo(L.latLng(b[0], b[1])); }
function dest(a, brg, d){ const kx = 111320 * Math.cos(rad(a[0])), ky = 110540;
  return [a[0] + Math.cos(rad(brg)) * d / ky, a[1] + Math.sin(rad(brg)) * d / kx]; }
const wrap = a => ((a + 540) % 360) - 180;
function centroid(g){ try{ const f = c => typeof c[0] === "number" ? [c] : c.flatMap(f); const p = f(g.coordinates);
  return [p.reduce((s, q) => s + q[1], 0) / p.length, p.reduce((s, q) => s + q[0], 0) / p.length]; }catch(e){ return null; } }
async function elev(ll){ try{ return (window.edrEdit && edrEdit.elevB) ? await edrEdit.elevB(L.latLng(ll[0], ll[1])) : null; }catch(e){ return null; } }

/* project a bearing/elevation-angle pair onto the screen; null when outside the camera's view */
function project(brg, elevAngle, W, H){
  const dx = wrap(brg - S.heading), vfov = HFOV * H / W;
  if(Math.abs(dx) > HFOV / 2 + 6) return null;
  return {x: W / 2 + dx / HFOV * W, y: H / 2 - (elevAngle - S.pitch) / vfov * H};
}

/* everything on the map that is near enough to be worth drawing, with its bearing and distance from here */
function gather(){
  if(!S.pos || typeof layerObjs === "undefined") return [];
  const out = [];
  for(const t in layerObjs){
    const o = layerObjs[t]; if(!o || !map.hasLayer(o.lyr)) continue;
    const fc = (typeof DATA !== "undefined") && DATA[t]; if(!fc || !fc.features) continue;
    for(const f of fc.features){
      const c = f.geometry && (f.geometry.type === "Point" ? [f.geometry.coordinates[1], f.geometry.coordinates[0]] : centroid(f.geometry));
      if(!c) continue; const d = dist(S.pos, c); if(d > RADIUS || d < 1) continue;
      out.push({t, f, c, d, brg: bearing(S.pos, c), name: f.properties.name || f.properties.asset_id || (window.title_i18n ? title_i18n(t, t) : t)});
    }
  }
  out.sort((a, b) => a.d - b.d); return out.slice(0, 40);
}

let zEye = null;
async function refreshFeats(){
  S.feats = gather();
  const z0 = await elev(S.pos); zEye = (z0 == null ? 0 : z0) + EYE;
  for(const it of S.feats){ const z = await elev(it.c); it.el = z == null ? 0 : deg(Math.atan2(z - zEye, it.d)); }
}

/* ---------- drawing ---------- */
function draw(){
  if(!S.on) return; S.raf = requestAnimationFrame(draw);
  const W = canvas.width = canvas.clientWidth * devicePixelRatio, H = canvas.height = canvas.clientHeight * devicePixelRatio;
  ctx.clearRect(0, 0, W, H); hits = [];
  if(S.heading == null || !S.pos) return;
  ctx.font = `600 ${13 * devicePixelRatio}px ${getComputedStyle(document.body).getPropertyValue("--ui") || "sans-serif"}`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for(const it of S.feats){
    const p = project(it.brg, it.el || 0, W, H); if(!p) continue;
    const label = `${it.name}  ·  ${Math.round(it.d)} ${T.far}`; const w = ctx.measureText(label).width + 22 * devicePixelRatio, h = 30 * devicePixelRatio;
    const alpha = Math.max(.45, 1 - it.d / RADIUS);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(28,24,19,.86)"; ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 1.2 * devicePixelRatio;
    ctx.beginPath(); ctx.roundRect(p.x - w / 2, p.y - h / 2, w, h, 8 * devicePixelRatio); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.fillText(label, p.x, p.y);
    ctx.beginPath(); ctx.moveTo(p.x, p.y + h / 2); ctx.lineTo(p.x, p.y + h / 2 + 10 * devicePixelRatio); ctx.stroke();
    ctx.globalAlpha = 1;
    hits.push({x: p.x / devicePixelRatio, y: p.y / devicePixelRatio, w: w / devicePixelRatio, h: h / devicePixelRatio, it});
  }
  const st = document.getElementById("arstat");
  if(st) st.textContent = `${Math.round(S.heading)}° · ${S.acc ? "±" + Math.round(S.acc) + " m" : T.waiting} · ${S.feats.length}`;
}

/* ---------- sensors ---------- */
function onOri(e){
  let h = null;
  if(typeof e.webkitCompassHeading === "number") h = e.webkitCompassHeading;             // iOS: true compass heading
  else if(e.absolute && typeof e.alpha === "number") h = (360 - e.alpha) % 360;          // Android: absolute alpha
  else if(typeof e.alpha === "number") h = (360 - e.alpha) % 360;
  if(h != null) S.heading = h;
  if(typeof e.beta === "number") S.pitch = e.beta - 90;                                  // phone upright & level → 0; looking down → negative
}
async function startSensors(){
  if(typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function"){
    try{ const r = await DeviceOrientationEvent.requestPermission(); if(r !== "granted"){ say(T.noOri); return false; } }catch(e){ say(T.noOri); return false; }
  }
  window.addEventListener("deviceorientationabsolute", onOri, true);
  window.addEventListener("deviceorientation", onOri, true);
  S.watch = navigator.geolocation.watchPosition(p => { S.pos = [p.coords.latitude, p.coords.longitude]; S.acc = p.coords.accuracy || 99; refreshFeats(); },
    () => {}, {enableHighAccuracy:true, maximumAge:1000, timeout:30000});
  return true;
}
async function startCamera(){
  try{ S.stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}, width:{ideal:1280}}, audio:false});
    video.srcObject = S.stream; await video.play(); return true; }
  catch(e){ say(T.noCam); return false; }
}
function say(m){ if(window.toast) toast(m); }

/* ---------- point-to-mark: march a ray from the eye along the view until it meets the LiDAR ground ---------- */
async function groundPoint(){
  if(!S.pos || S.heading == null) return null;
  if(S.pitch > -3) return null;                              // looking at or above the horizon: no ground in the reticle
  const z0 = await elev(S.pos); const eye = (z0 == null ? 0 : z0) + EYE; const slope = Math.tan(rad(S.pitch));   // negative
  for(let s = 2; s <= 250; s += 2){
    const p = dest(S.pos, S.heading, s); const zt = await elev(p); if(zt == null) continue;
    if(eye + s * slope <= zt) return {ll:p, d:s};
  }
  return null;
}
async function mark(){
  const g = await groundPoint(); if(!g){ say(T.noGround); return; }
  const m = L.marker(g.ll);
  close();
  const note = T.note(g.d, Math.round(S.heading), Math.round(S.acc));
  if(window.edrEdit && edrEdit.handoff) edrEdit.handoff(m, {layer:"propostas", preset:"marco", props:{name:T.marked, note}});
  else { m.addTo(map); say(note); }
}

/* ---------- ui ---------- */
function build(){
  ui = document.createElement("div"); ui.id = "arview"; ui.setAttribute("role", "dialog"); ui.setAttribute("aria-label", T.title);
  ui.innerHTML = `<video playsinline muted autoplay></video><canvas></canvas><div class="ret"></div>
    <div class="top"><span id="arstat"></span><button class="x" data-a="close" aria-label="${T.close}">✕</button></div>
    <div class="bot"><div class="hint">${T.calib}</div><button data-a="mark">${T.mark}</button></div>
    <div class="start" data-a="start">${T.tapStart}</div>`;
  document.body.appendChild(ui); video = ui.querySelector("video"); canvas = ui.querySelector("canvas"); ctx = canvas.getContext("2d");
  ui.addEventListener("click", async e => {
    const a = e.target.closest("[data-a]")?.dataset.a;
    if(a === "close") return close();
    if(a === "mark") return mark();
    if(a === "start"){ e.target.closest(".start").remove(); const ok = await startSensors(); if(ok) await startCamera(); return; }
    // tap on a label → its card
    const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const hit = hits.find(h => Math.abs(x - h.x) <= h.w / 2 && Math.abs(y - h.y) <= h.h / 2);
    if(hit && window.showCard){ close(); showCard(hit.it.f.properties, L.latLng(hit.it.c[0], hit.it.c[1]), hit.it.name, hit.it.t); }
  });
}
function open(){ if(!navigator.mediaDevices || !navigator.geolocation){ say(T.noCam); return; } if(!ui) build();
  S.on = true; ui.classList.add("on"); if(window.edrSurvey) edrSurvey.close(); draw(); }
function close(){ S.on = false; if(ui) ui.classList.remove("on"); cancelAnimationFrame(S.raf);
  window.removeEventListener("deviceorientationabsolute", onOri, true); window.removeEventListener("deviceorientation", onOri, true);
  if(S.watch != null){ navigator.geolocation.clearWatch(S.watch); S.watch = null; }
  if(S.stream){ S.stream.getTracks().forEach(t => t.stop()); S.stream = null; }
  const st = ui && ui.querySelector(".start"); if(ui && !st){ const d = document.createElement("div"); d.className = "start"; d.dataset.a = "start"; d.textContent = T.tapStart; ui.appendChild(d); }
}

window.edrAR = {open, close, state:S, project, groundPoint, gather, refreshFeats, _sim:(o)=>Object.assign(S, o)};
})();
