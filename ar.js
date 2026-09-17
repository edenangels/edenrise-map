// EdenRise map — "Ver": the camera as a window into the GIS.
//
// Location-based AR, the honest kind: GPS gives where you stand, the phone's fused orientation sensor gives where it
// points (full rotation matrix, so it is right in any grip, not only upright portrait), and the map's own features are
// drawn over the live camera at their true bearing and elevation angle — heights from our LiDAR, not GPS altitude —
// each with its distance. Tap a label to open its card. Point the reticle at the ground and "Marcar" ray-casts from eye
// height onto the 0.5 m terrain to get the GPS position of the spot you are looking at.
//
// Optional on-device AI (MediaPipe Object Detector, Apache-2.0, EfficientDet-Lite0, COCO classes): boxes what the camera
// sees and pre-fills the preset when you mark. It runs in the phone, from vendored files, so it works with no signal.
// COCO knows people, vehicles, animals and everyday objects — not trees, tanks or fences; that needs a model trained on
// our own photos, which is the next step once the team has captured them.
//
// A mini-map in the corner mirrors the same picture north-up: you, your heading cone, the features, and the walk being
// recorded, so the camera and the GIS never disagree. Limits on screen: GPS ±3–5 m, compass ±5–15°.
(function(){
if(typeof map === "undefined") return;
const EN = (typeof LANG !== "undefined") && LANG === "en";
const T = EN ? {
  title:"Camera view", noCam:"No camera access. Allow the camera in the browser settings.", noOri:"This device gives no compass heading — labels cannot be placed.",
  tapStart:"Tap to start the camera and compass", mark:"Mark what I'm looking at", close:"Close", calib:"Compass: wave the phone in a figure of 8 if labels drift",
  noGround:"Point lower — I need to see the ground to place a mark.", marked:"Marked from the camera", ai:"AI", aiOn:"AI on: boxes what the camera recognises", aiLoad:"Loading the AI model…", aiFail:"AI model could not load (save the map offline first, or get signal once).",
  note:(d,h,a,cls)=>`Marked from the camera ${new Date().toLocaleString("en-GB")}: ${d} m away on bearing ${h}°, GPS accuracy ${a} m, compass ±10°${cls?", AI saw: "+cls:""} (phone AR, not survey grade).`,
  waiting:"Getting a fix…", far:"m", rec:"recording"
} : {
  title:"Ver com a câmara", noCam:"Sem acesso à câmara. Autoriza a câmara nas definições do browser.", noOri:"Este aparelho não dá rumo de bússola — não consigo colocar as etiquetas.",
  tapStart:"Toca para ligar a câmara e a bússola", mark:"Marcar o que estou a ver", close:"Fechar", calib:"Bússola: faz um 8 com o telemóvel se as etiquetas fugirem",
  noGround:"Aponta mais para baixo — preciso de ver o chão para marcar.", marked:"Marcado a partir da câmara", ai:"IA", aiOn:"IA ligada: assinala o que a câmara reconhece", aiLoad:"A carregar o modelo de IA…", aiFail:"O modelo de IA não carregou (guarda o mapa offline primeiro, ou apanha rede uma vez).",
  note:(d,h,a,cls)=>`Marcado a partir da câmara ${new Date().toLocaleString("pt-PT")}: a ${d} m no rumo ${h}°, precisão GPS ${a} m, bússola ±10°${cls?", a IA viu: "+cls:""} (AR do telemóvel, não é topografia).`,
  waiting:"A apanhar sinal…", far:"m", rec:"a gravar"
};
const RADIUS = 300, HFOV = 62, EYE = 1.6;
/* COCO class → the estate preset it most likely is; anything else marks as "outro" and the person decides */
const PRESET_FOR = {cow:"pasto", sheep:"pasto", horse:"pasto", dog:"atencao", person:"atencao", car:"infraestrutura", truck:"infraestrutura", motorcycle:"infraestrutura", bicycle:"infraestrutura", bus:"infraestrutura", boat:"tanque", "fire hydrant":"conduta", bench:"infraestrutura", "potted plant":"arvore", bird:"outro"};
const PT_CLASS = {cow:"vaca", sheep:"ovelha", horse:"cavalo", dog:"cão", person:"pessoa", car:"carro", truck:"camião", motorcycle:"mota", bicycle:"bicicleta", bus:"autocarro", boat:"barco", bird:"pássaro", "potted plant":"planta", bench:"banco", "fire hydrant":"hidrante", cat:"gato", chair:"cadeira"};

const S = {on:false, pos:null, acc:99, heading:null, pitch:0, hRaw:null, feats:[], watch:null, raf:null, stream:null, ai:false, det:null, boxes:[], lastAI:0, aiBusy:false};
let ui = null, video = null, canvas = null, ctx = null, mini = null, mctx = null, hits = [], work = null;

const css = document.createElement("style"); css.textContent = `
#arview{position:fixed;inset:0;z-index:1800;background:#000;display:none}
#arview.on{display:block}
#arview video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
#arview canvas.ov{position:absolute;inset:0;width:100%;height:100%}
#arview .top{position:absolute;top:calc(10px + env(safe-area-inset-top,0px));left:12px;right:12px;display:flex;align-items:center;justify-content:space-between;gap:8px;color:#fff;font:600 12px var(--mono);text-shadow:0 1px 3px #000}
#arview .top .r{display:flex;gap:8px;align-items:center}
#arview .x,#arview .ai{height:42px;border-radius:21px;border:1px solid rgba(255,255,255,.35);background:rgba(20,17,13,.7);color:#fff;font:700 13px var(--ui);cursor:pointer;padding:0 14px}
#arview .x{width:42px;padding:0;font-size:17px}
#arview .ai.on{background:var(--straw);color:var(--bark);border-color:var(--straw)}
#arview .ret{position:absolute;left:50%;top:50%;width:28px;height:28px;margin:-14px 0 0 -14px;border:2px solid #ffd166;border-radius:50%;box-shadow:0 0 0 2px rgba(0,0,0,.5);pointer-events:none}
#arview .ret::after{content:"";position:absolute;left:50%;top:50%;width:4px;height:4px;margin:-2px 0 0 -2px;background:#ffd166;border-radius:50%}
#arview canvas.mini{position:absolute;right:12px;bottom:calc(92px + env(safe-area-inset-bottom,0px));width:120px;height:120px;border-radius:50%;border:2px solid rgba(255,255,255,.55);background:rgba(20,17,13,.75);box-shadow:0 4px 16px rgba(0,0,0,.5)}
#arview .bot{position:absolute;left:12px;right:144px;bottom:calc(14px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:8px}
#arview .bot button{min-height:56px;border-radius:14px;border:0;background:var(--straw);color:var(--bark);font:700 15px var(--ui);cursor:pointer}
#arview .hint{color:#fff;font:500 11.5px var(--ui);text-shadow:0 1px 3px #000;opacity:.9}
#arview .start{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font:600 16px var(--ui);text-align:center;padding:30px;background:rgba(0,0,0,.55)}
`; document.head.appendChild(css);

/* ---------- geometry ---------- */
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
function bearing(a, b){ const φ1 = rad(a[0]), φ2 = rad(b[0]), Δλ = rad(b[1] - a[1]);
  const y = Math.sin(Δλ) * Math.cos(φ2), x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (deg(Math.atan2(y, x)) + 360) % 360; }
function dist(a, b){ return L.latLng(a[0], a[1]).distanceTo(L.latLng(b[0], b[1])); }
function dest(a, brg, d){ const kx = 111320 * Math.cos(rad(a[0])), ky = 110540; return [a[0] + Math.cos(rad(brg)) * d / ky, a[1] + Math.sin(rad(brg)) * d / kx]; }
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

/* ---------- orientation: the direction the BACK of the phone points, from the full rotation (W3C device orientation) ----------
   Works in any grip: portrait, landscape, tilted. Heading = compass bearing of the camera axis; pitch = its angle above the horizon. */
function cameraAxis(alpha, beta, gamma){
  const a = rad(alpha), b = rad(beta), g = rad(gamma);
  const cA = Math.cos(a), sA = Math.sin(a), cB = Math.cos(b), sB = Math.sin(b), cG = Math.cos(g), sG = Math.sin(g);
  // rotation matrix R = Rz(alpha) · Rx(beta) · Ry(gamma) (W3C), applied to the device's -Z axis (out the back, through the camera):
  // the camera axis in the world frame is minus the third column of R.
  const vx = -(cA * sG + sA * sB * cG);
  const vy = -(sA * sG - cA * sB * cG);
  const vz = -(cB * cG);
  // W3C frame: x east, y north, z up → heading measured from north, clockwise; pitch above the horizon
  const heading = (deg(Math.atan2(vx, vy)) + 360) % 360;
  const pitch = deg(Math.asin(Math.max(-1, Math.min(1, vz))));
  return {heading, pitch};
}
let smoothH = null, smoothP = 0;
function onOri(e){
  let h = null, p = null;
  if(typeof e.webkitCompassHeading === "number" && typeof e.beta === "number"){          // iOS: true heading of the top of the phone…
    const ax = cameraAxis(360 - e.webkitCompassHeading, e.beta, e.gamma || 0);          // …fed into the same matrix so pitch/grip are consistent
    h = ax.heading; p = ax.pitch;
  } else if(typeof e.alpha === "number" && typeof e.beta === "number"){
    const ax = cameraAxis(e.alpha, e.beta, e.gamma || 0); h = ax.heading; p = ax.pitch;
  }
  if(h == null) return;
  S.hRaw = h;
  // exponential smoothing on the circle: steady labels without the lag of a long filter
  if(smoothH == null) smoothH = h; else smoothH = (smoothH + 0.25 * wrap(h - smoothH) + 360) % 360;
  smoothP = smoothP + 0.3 * (p - smoothP);
  S.heading = smoothH; S.pitch = smoothP;
}

/* ---------- features near me ---------- */
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

/* ---------- on-device AI (lazy: nothing loads until the button is pressed) ---------- */
async function loadAI(){
  if(S.det) return S.det;
  say(T.aiLoad);
  const mod = await import("./vendor/mediapipe/vision_bundle.mjs");
  const files = await mod.FilesetResolver.forVisionTasks("vendor/mediapipe/wasm");
  S.det = await mod.ObjectDetector.createFromOptions(files, {baseOptions:{modelAssetPath:"vendor/mediapipe/efficientdet_lite0.tflite"}, scoreThreshold:0.45, maxResults:6, runningMode:"VIDEO"});
  return S.det;
}
async function toggleAI(btn){
  if(S.ai){ S.ai = false; S.boxes = []; btn.classList.remove("on"); return; }
  try{ await loadAI(); S.ai = true; btn.classList.add("on"); say(T.aiOn); }catch(e){ say(T.aiFail); S.ai = false; }
}
function runAI(now){
  if(!S.ai || !S.det || S.aiBusy || now - S.lastAI < 350 || !video || video.readyState < 2) return;
  S.aiBusy = true; S.lastAI = now;
  try{
    if(!work){ work = document.createElement("canvas"); }
    const vw = video.videoWidth || 640, vh = video.videoHeight || 480, sc = 480 / Math.max(vw, vh);
    work.width = Math.round(vw * sc); work.height = Math.round(vh * sc);
    work.getContext("2d").drawImage(video, 0, 0, work.width, work.height);
    const r = S.det.detectForVideo(work, now);
    S.boxes = (r.detections || []).map(d => ({x:d.boundingBox.originX / work.width, y:d.boundingBox.originY / work.height, w:d.boundingBox.width / work.width, h:d.boundingBox.height / work.height,
      cls:d.categories[0].categoryName, score:d.categories[0].score}));
  }catch(e){ S.boxes = []; }
  S.aiBusy = false;
}
/* the recognised object under the reticle, if any (video is object-fit: cover, so map box coords through the crop) */
function classAtReticle(){
  if(!S.boxes.length || !video) return null;
  const vw = video.videoWidth || 1, vh = video.videoHeight || 1, W = canvas.clientWidth, H = canvas.clientHeight;
  const s = Math.max(W / vw, H / vh), ox = (W - vw * s) / 2, oy = (H - vh * s) / 2;
  const cx = W / 2, cy = H / 2;
  for(const b of S.boxes){ const x0 = ox + b.x * vw * s, y0 = oy + b.y * vh * s, x1 = x0 + b.w * vw * s, y1 = y0 + b.h * vh * s;
    if(cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1) return b.cls; }
  return null;
}

/* ---------- drawing ---------- */
function draw(now){
  if(!S.on) return; S.raf = requestAnimationFrame(draw);
  const dpr = devicePixelRatio || 1, W = canvas.width = canvas.clientWidth * dpr, H = canvas.height = canvas.clientHeight * dpr;
  ctx.clearRect(0, 0, W, H); hits = [];
  runAI(now || performance.now());
  const font = getComputedStyle(document.body).getPropertyValue("--ui") || "sans-serif";
  // AI boxes (video is object-fit: cover)
  if(S.ai && S.boxes.length && video && video.videoWidth){
    const vw = video.videoWidth, vh = video.videoHeight, s = Math.max(W / (vw), H / (vh)), ox = (W - vw * s) / 2, oy = (H - vh * s) / 2;
    ctx.lineWidth = 2 * dpr; ctx.strokeStyle = "#5bc0de"; ctx.font = `600 ${12 * dpr}px ${font}`; ctx.textAlign = "left"; ctx.textBaseline = "top";
    for(const b of S.boxes){ const x = ox + b.x * vw * s, y = oy + b.y * vh * s, w = b.w * vw * s, h = b.h * vh * s;
      ctx.strokeRect(x, y, w, h); const lab = `${EN ? b.cls : (PT_CLASS[b.cls] || b.cls)} ${Math.round(b.score * 100)}%`;
      const tw = ctx.measureText(lab).width + 10 * dpr; ctx.fillStyle = "rgba(91,192,222,.9)"; ctx.fillRect(x, y - 20 * dpr, tw, 20 * dpr); ctx.fillStyle = "#0b1a20"; ctx.fillText(lab, x + 5 * dpr, y - 17 * dpr); }
  }
  if(S.heading != null && S.pos){
    ctx.font = `600 ${13 * dpr}px ${font}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for(const it of S.feats){
      const p = project(it.brg, it.el || 0, W, H); if(!p) continue;
      const label = `${it.name}  ·  ${Math.round(it.d)} ${T.far}`; const w = ctx.measureText(label).width + 22 * dpr, h = 30 * dpr;
      ctx.globalAlpha = Math.max(.45, 1 - it.d / RADIUS);
      ctx.fillStyle = "rgba(28,24,19,.86)"; ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 1.2 * dpr;
      ctx.beginPath(); ctx.roundRect(p.x - w / 2, p.y - h / 2, w, h, 8 * dpr); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.fillText(label, p.x, p.y);
      ctx.beginPath(); ctx.moveTo(p.x, p.y + h / 2); ctx.lineTo(p.x, p.y + h / 2 + 10 * dpr); ctx.stroke(); ctx.globalAlpha = 1;
      hits.push({x: p.x / dpr, y: p.y / dpr, w: w / dpr, h: h / dpr, it});
    }
  }
  drawMini();
  const st = document.getElementById("arstat");
  if(st) st.textContent = S.heading == null ? T.waiting : `${Math.round(S.heading)}° · ${S.acc ? "±" + Math.round(S.acc) + " m" : T.waiting} · ${S.feats.length}${(window.edrSurvey && edrSurvey.recording()) ? " · ● " + T.rec : ""}`;
}
/* the mini-map: north-up, 120 px = 2×RADIUS, me in the middle, heading cone, features, and the walk being recorded */
function drawMini(){
  if(!mini) return; const dpr = devicePixelRatio || 1, N = mini.width = mini.height = 120 * dpr, c = N / 2, k = c / RADIUS;
  mctx.clearRect(0, 0, N, N);
  mctx.strokeStyle = "rgba(255,255,255,.25)"; mctx.lineWidth = dpr; mctx.beginPath(); mctx.arc(c, c, c * .5, 0, 7); mctx.stroke();
  mctx.fillStyle = "#fff"; mctx.font = `700 ${10 * dpr}px monospace`; mctx.textAlign = "center"; mctx.fillText("N", c, 12 * dpr);
  if(S.heading != null){ mctx.fillStyle = "rgba(255,209,102,.28)"; mctx.beginPath(); mctx.moveTo(c, c);
    mctx.arc(c, c, c * .95, rad(S.heading - 90 - HFOV / 2), rad(S.heading - 90 + HFOV / 2)); mctx.closePath(); mctx.fill(); }
  if(S.pos){
    const sv = window.edrSurvey && edrSurvey.state; if(sv && sv.pts && sv.pts.length > 1){ mctx.strokeStyle = "#ffd166"; mctx.lineWidth = 2 * dpr; mctx.beginPath();
      sv.pts.forEach((p, i) => { const d = dist(S.pos, p.ll), b = rad(bearing(S.pos, p.ll)); const x = c + Math.sin(b) * d * k, y = c - Math.cos(b) * d * k; i ? mctx.lineTo(x, y) : mctx.moveTo(x, y); }); mctx.stroke(); }
    for(const it of S.feats){ const b = rad(it.brg); mctx.fillStyle = "#e07b39"; mctx.beginPath(); mctx.arc(c + Math.sin(b) * it.d * k, c - Math.cos(b) * it.d * k, 2.2 * dpr, 0, 7); mctx.fill(); }
  }
  mctx.fillStyle = "#3ba9ff"; mctx.strokeStyle = "#fff"; mctx.lineWidth = 2 * dpr; mctx.beginPath(); mctx.arc(c, c, 4 * dpr, 0, 7); mctx.fill(); mctx.stroke();
}

/* ---------- sensors & camera ---------- */
async function startSensors(){
  if(typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function"){
    try{ const r = await DeviceOrientationEvent.requestPermission(); if(r !== "granted"){ say(T.noOri); return false; } }catch(e){ say(T.noOri); return false; }
  }
  window.addEventListener("deviceorientationabsolute", onOri, true);
  window.addEventListener("deviceorientation", onOri, true);
  S.watch = navigator.geolocation.watchPosition(p => { S.pos = [p.coords.latitude, p.coords.longitude]; S.acc = p.coords.accuracy || 99; refreshFeats(); }, () => {}, {enableHighAccuracy:true, maximumAge:1000, timeout:30000});
  return true;
}
async function startCamera(){
  try{ S.stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}, width:{ideal:1280}}, audio:false}); video.srcObject = S.stream; await video.play(); return true; }
  catch(e){ say(T.noCam); return false; }
}
function say(m){ if(window.toast) toast(m); }

/* ---------- point-to-mark ---------- */
async function groundPoint(){
  if(!S.pos || S.heading == null) return null;
  if(S.pitch > -3) return null;
  const z0 = await elev(S.pos); const eye = (z0 == null ? 0 : z0) + EYE; const slope = Math.tan(rad(S.pitch));
  for(let s = 2; s <= 250; s += 2){ const p = dest(S.pos, S.heading, s); const zt = await elev(p); if(zt == null) continue; if(eye + s * slope <= zt) return {ll:p, d:s}; }
  return null;
}
async function mark(){
  const g = await groundPoint(); if(!g){ say(T.noGround); return; }
  const cls = classAtReticle(); const preset = (cls && PRESET_FOR[cls]) || "marco";
  const m = L.marker(g.ll); close();
  const note = T.note(g.d, Math.round(S.heading), Math.round(S.acc), cls ? (EN ? cls : (PT_CLASS[cls] || cls)) : "");
  const name = cls ? `${T.marked}: ${EN ? cls : (PT_CLASS[cls] || cls)}` : T.marked;
  if(window.edrEdit && edrEdit.handoff) edrEdit.handoff(m, {layer:"propostas", preset, props:{name, note}}); else { m.addTo(map); say(note); }
}

/* ---------- ui ---------- */
function build(){
  ui = document.createElement("div"); ui.id = "arview"; ui.setAttribute("role", "dialog"); ui.setAttribute("aria-label", T.title);
  ui.innerHTML = `<video playsinline muted autoplay></video><canvas class="ov"></canvas><div class="ret"></div>
    <div class="top"><span id="arstat"></span><span class="r"><button class="ai" data-a="ai">${T.ai}</button><button class="x" data-a="close" aria-label="${T.close}">✕</button></span></div>
    <canvas class="mini"></canvas>
    <div class="bot"><div class="hint">${T.calib}</div><button data-a="mark">${T.mark}</button></div>
    <div class="start" data-a="start">${T.tapStart}</div>`;
  document.body.appendChild(ui); video = ui.querySelector("video"); canvas = ui.querySelector("canvas.ov"); ctx = canvas.getContext("2d"); mini = ui.querySelector("canvas.mini"); mctx = mini.getContext("2d");
  ui.addEventListener("click", async e => {
    const el = e.target.closest("[data-a]"), a = el && el.dataset.a;
    if(a === "close") return close();
    if(a === "mark") return mark();
    if(a === "ai") return toggleAI(el);
    if(a === "start"){ el.remove(); const ok = await startSensors(); if(ok) await startCamera(); return; }
    const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const hit = hits.find(h => Math.abs(x - h.x) <= h.w / 2 && Math.abs(y - h.y) <= h.h / 2);
    if(hit && window.showCard){ close(); showCard(hit.it.f.properties, L.latLng(hit.it.c[0], hit.it.c[1]), hit.it.name, hit.it.t); }
  });
}
function open(){ if(!navigator.mediaDevices || !navigator.geolocation){ say(T.noCam); return; } if(!ui) build();
  S.on = true; ui.classList.add("on"); if(window.edrSurvey) edrSurvey.close(); draw(performance.now()); }   // a walk being recorded keeps recording: its watch is its own
function close(){ S.on = false; if(ui) ui.classList.remove("on"); cancelAnimationFrame(S.raf);
  window.removeEventListener("deviceorientationabsolute", onOri, true); window.removeEventListener("deviceorientation", onOri, true);
  if(S.watch != null){ navigator.geolocation.clearWatch(S.watch); S.watch = null; }
  if(S.stream){ S.stream.getTracks().forEach(t => t.stop()); S.stream = null; }
  if(ui && !ui.querySelector(".start")){ const d = document.createElement("div"); d.className = "start"; d.dataset.a = "start"; d.textContent = T.tapStart; ui.appendChild(d); }
}

window.edrAR = {open, close, state:S, project, groundPoint, gather, refreshFeats, cameraAxis, loadAI, _sim:(o)=>Object.assign(S, o)};
})();
