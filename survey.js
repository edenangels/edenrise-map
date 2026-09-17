// EdenRise map — GPS field survey: walk the land, the map records it.
//
// What this is modelled on: the working parts of a Trimble/Garmin field workflow that a phone can actually do —
// an accuracy gate, static point averaging, streamed line/area capture, and every fix carrying its own quality.
// What a bare phone cannot do: centimetres. A handset's own GNSS gives roughly 3–5 m, near 1 m in open sky on a
// dual-frequency (L1+L5) device. Centimetres need an external receiver and a correction service; the recorded
// accuracy per point is kept so a later survey can be told apart from a walked one.
//
// It is built for the field: GPS needs no mobile network (satellites are passive), the map tiles come from the
// offline pack, the walk is written to local storage as it happens, and a screen wake lock keeps the browser
// from stopping the fix. The finished geometry is handed to the normal proposal flow — same form, presets,
// offline queue, review and sync to QGIS — so nothing here is a parallel system.
(function(){
if(typeof map === "undefined" || !navigator.geolocation) return;
const EN = (typeof LANG !== "undefined") && LANG === "en";
const T = EN ? {
  title:"GPS survey", waiting:"Getting a fix…", denied:"Location permission refused. Allow it in the browser settings.",
  unavailable:"No position. Under trees or indoors the sky is blocked — walk into the open.",
  acc:"accuracy", alt:"alt", speed:"speed", quality:["excellent","good","usable","poor"],
  point:"Mark a point here", line:"Record a walk", area:"Record an area", stop:"Finish", discard:"Discard",
  pause:"Pause", resume:"Resume", recLine:"Recording a walk", recArea:"Recording an area",
  averaging:"Holding still, averaging", avgDone:"Point averaged over", gate:"Reject fixes worse than",
  pts:"points", len:"length", ar:"area", waitAcc:"Waiting for a good enough fix",
  keepOpen:"Keep this screen on while you walk.", saved:"Recovered an unfinished walk.",
  tooShort:"Too short to save — walk a few more metres.", nameLine:"Walked line", nameArea:"Walked area", namePoint:"Surveyed point",
  note:(n,a,d)=>`GPS ${d}: ${n} fixes, mean accuracy ${a} m (phone GNSS, not survey grade).`,
  noteAvg:(n,a,s,d)=>`GPS ${d}: averaged ${n} fixes over ${s}s, mean accuracy ${a} m (phone GNSS, not survey grade).`,
  close:"Close", follow:"Centre on me", cam:"See through the camera", elev:"elevation from our LiDAR terrain", drop:"drop"
} : {
  title:"Levantamento GPS", waiting:"A apanhar sinal…", denied:"Permissão de localização recusada. Autoriza nas definições do browser.",
  unavailable:"Sem posição. Debaixo de árvores ou dentro de casa o céu fica tapado — sai para o aberto.",
  acc:"precisão", alt:"alt", speed:"velocidade", quality:["excelente","boa","aceitável","fraca"],
  point:"Marcar ponto aqui", line:"Gravar percurso", area:"Gravar área", stop:"Terminar", discard:"Descartar",
  pause:"Pausa", resume:"Continuar", recLine:"A gravar percurso", recArea:"A gravar área",
  averaging:"Quieto, a fazer a média", avgDone:"Ponto com média de", gate:"Rejeitar pior que",
  pts:"pontos", len:"comprimento", ar:"área", waitAcc:"À espera de sinal suficiente",
  keepOpen:"Deixa este ecrã ligado enquanto caminhas.", saved:"Recuperei um percurso por terminar.",
  tooShort:"Demasiado curto para guardar — caminha mais uns metros.", nameLine:"Percurso caminhado", nameArea:"Área caminhada", namePoint:"Ponto levantado",
  note:(n,a,d)=>`GPS ${d}: ${n} posições, precisão média ${a} m (GNSS do telemóvel, não é topografia).`,
  noteAvg:(n,a,s,d)=>`GPS ${d}: média de ${n} posições em ${s}s, precisão média ${a} m (GNSS do telemóvel, não é topografia).`,
  close:"Fechar", follow:"Centrar em mim", cam:"Ver com a câmara", elev:"cota do nosso terreno LiDAR", drop:"desnível"
};

const KEY = "edr_survey_wip";                 // an unfinished walk survives a reload or a dead battery
const QCOL = ["#7f9a6a", "#c9a227", "#e07b39", "#b3413a"];
let gate = 15;                                 // metres: fixes worse than this are not used
try{ const g = +localStorage.getItem("edr_survey_gate"); if(g >= 3 && g <= 60) gate = g; }catch(e){}
const MIN_STEP = 2.5;                          // metres between vertices: below this it is GPS jitter, not walking
const AVG_SECONDS = 30;

const st = {watch:null, last:null, mode:null, pts:[], paused:false, avgUntil:0, avgFixes:[], lock:null, opened:false};
let me = null, ring = null, trail = null, sheet = null;

/* ---------- styles ---------- */
const css = document.createElement("style");
css.textContent = `
#svsheet{position:fixed;left:0;right:0;bottom:0;z-index:1700;background:rgba(20,17,13,.97);backdrop-filter:blur(16px) saturate(1.2);
  border-top:1px solid var(--line-2);border-radius:18px 18px 0 0;padding:10px 16px calc(16px + env(safe-area-inset-bottom,0px));
  box-shadow:0 -12px 40px rgba(0,0,0,.5);transform:translateY(102%);transition:transform .22s ease;max-height:76vh;overflow-y:auto}
#svsheet.open{transform:none}
#svsheet .grab{width:38px;height:4px;border-radius:2px;background:var(--line-2);margin:0 auto 12px}
#svsheet h3{font:600 15px var(--display);margin:0 0 2px;display:flex;align-items:center;gap:8px}
#svsheet .dot{width:10px;height:10px;border-radius:50%;flex:none;box-shadow:0 0 0 4px rgba(255,255,255,.06)}
#svsheet .fix{font:600 12px var(--mono);color:var(--muted);margin:6px 0 2px;letter-spacing:.02em}
#svsheet .coord{font:600 13px var(--mono);color:var(--linen);letter-spacing:.01em;word-break:break-all}
#svsheet .mtr{font:600 26px var(--display);color:var(--linen);letter-spacing:-.01em;margin:8px 0 0}
#svsheet .mtr small{font:500 12px var(--ui);color:var(--muted);margin-left:7px}
#svsheet .acts{display:flex;flex-direction:column;gap:8px;margin-top:14px}
#svsheet button.a{display:flex;align-items:center;gap:11px;width:100%;min-height:54px;padding:12px 15px;border-radius:12px;
  border:1px solid var(--line-2);background:var(--bark);color:var(--linen);font:600 14px var(--ui);cursor:pointer;text-align:left}
#svsheet button.a:active{background:var(--night-2)}
#svsheet button.a svg{width:22px;height:22px;flex:none;color:var(--straw)}
#svsheet button.a[disabled]{opacity:.45}
#svsheet .row{display:flex;gap:8px;margin-top:10px}
#svsheet .row button{flex:1;min-height:52px;border-radius:12px;border:1px solid var(--line-2);background:var(--bark);color:var(--linen);font:700 13px var(--ui);cursor:pointer}
#svsheet .row button.go{background:var(--oak);color:var(--bark);border-color:var(--oak)}
#svsheet .row button.bad{color:#e07b39}
#svsheet .gate{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid var(--line);font-size:12px;color:var(--muted)}
#svsheet .gate .pm{display:flex;gap:6px} #svsheet .gate button{width:40px;height:40px;border-radius:10px;border:1px solid var(--line-2);background:var(--bark);color:var(--linen);font-size:17px;cursor:pointer}
#svsheet .hint{font-size:11.5px;color:var(--muted);margin-top:10px;line-height:1.45}
#svsheet .x{position:absolute;top:10px;right:12px;width:38px;height:38px;border-radius:50%;border:1px solid var(--line-2);background:var(--night-2);color:var(--linen);font-size:16px;cursor:pointer}
.svme{width:20px;height:20px;border-radius:50%;background:#3ba9ff;border:3px solid #fff;box-shadow:0 0 0 2px rgba(0,0,0,.35)}
@media(min-width:701px){ #svsheet{left:auto;right:14px;bottom:14px;width:370px;border-radius:16px} }`;
document.head.appendChild(css);

/* ---------- helpers ---------- */
const fmt = (n, d=1) => Number(n).toFixed(d);
function qIndex(a){ return a <= 5 ? 0 : a <= 10 ? 1 : a <= 20 ? 2 : 3; }
function say(m){ if(window.toast) toast(m); }
function len(pts){ let d = 0; for(let i=1;i<pts.length;i++) d += L.latLng(pts[i-1]).distanceTo(pts[i]); return d; }
function areaOf(pts){
  if(pts.length < 3) return 0;
  try{ if(window.turf){ const ring = pts.map(p=>[p[1],p[0]]); ring.push(ring[0]); return turf.area(turf.polygon([ring])); } }catch(e){}
  const R = 6378137, rad = Math.PI/180; let s = 0;                       // spherical excess, good enough for a field readout
  for(let i=0;i<pts.length;i++){ const a = pts[i], b = pts[(i+1)%pts.length];
    s += (b[1]-a[1]) * rad * (2 + Math.sin(a[0]*rad) + Math.sin(b[0]*rad)); }
  return Math.abs(s * R * R / 2);
}

/* ---------- screen wake lock: a walk must not stop because the screen dimmed ---------- */
async function lockScreen(){
  try{ if("wakeLock" in navigator && !st.lock) st.lock = await navigator.wakeLock.request("screen"); }catch(e){}
}
function releaseScreen(){ try{ st.lock && st.lock.release(); }catch(e){} st.lock = null; }
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible" && st.mode) lockScreen(); });

/* ---------- the GPS watch ---------- */
function start(){
  if(st.watch != null) return;
  st.watch = navigator.geolocation.watchPosition(onFix, onErr, {enableHighAccuracy:true, maximumAge:1000, timeout:30000});
}
function stop(){ if(st.watch != null){ navigator.geolocation.clearWatch(st.watch); st.watch = null; } }

function onErr(e){
  render();
  if(e && e.code === 1) say(T.denied);
  else if(e && e.code === 2 && !st.last) say(T.unavailable);   // only before the first fix; dropouts mid-walk are normal
}

function onFix(pos){
  const c = pos.coords, ll = [c.latitude, c.longitude], acc = c.accuracy || 99;
  st.last = {ll, acc, alt:c.altitude, speed:c.speed, t:pos.timestamp};

  if(!me){
    me = L.marker(ll, {icon:L.divIcon({className:"", html:'<div class="svme"></div>', iconSize:[20,20], iconAnchor:[10,10]}), zIndexOffset:900, interactive:false}).addTo(map);
    ring = L.circle(ll, {radius:acc, color:"#3ba9ff", weight:1, fillColor:"#3ba9ff", fillOpacity:.1, interactive:false}).addTo(map);
    map.setView(ll, Math.max(map.getZoom(), 18));
  } else { me.setLatLng(ll); ring.setLatLng(ll).setRadius(acc); }

  if(acc <= gate){
    if(st.mode === "avg") collectAvg();
    else if((st.mode === "line" || st.mode === "area") && !st.paused) collectStep(ll, acc);
  }
  render();
}

function collectAvg(){
  st.avgFixes.push(st.last);
  if(Date.now() >= st.avgUntil) finishAvg();
}

function collectStep(ll, acc){
  const prev = st.pts[st.pts.length - 1];
  if(prev && L.latLng(prev.ll).distanceTo(ll) < MIN_STEP) return;    // standing still: do not pile up jitter
  st.pts.push({ll, acc});
  drawTrail();
  try{ localStorage.setItem(KEY, JSON.stringify({mode:st.mode, pts:st.pts, at:Date.now()})); }catch(e){}
}

function drawTrail(){
  const line = st.pts.map(p => p.ll);
  const opts = {color:"#ffd166", weight:5, opacity:.95, lineJoin:"round", lineCap:"round"};
  if(!trail){ trail = (st.mode === "area" ? L.polygon(line, {...opts, fillColor:"#ffd166", fillOpacity:.18}) : L.polyline(line, opts)).addTo(map); }
  else trail.setLatLngs(line);
}
function clearTrail(){ if(trail){ map.removeLayer(trail); trail = null; } }

/* ---------- actions ---------- */
function beginAvg(){
  if(!st.last) return say(T.waiting);
  st.mode = "avg"; st.avgFixes = []; st.avgUntil = Date.now() + AVG_SECONDS * 1000; lockScreen(); render();
}
function finishAvg(){
  const f = st.avgFixes.slice(); st.mode = null; releaseScreen();
  if(!f.length){ render(); return say(T.waitAcc); }
  let wsum = 0, la = 0, lo = 0;                                        // weight each fix by 1/accuracy²: a tight fix counts for more
  for(const x of f){ const w = 1 / Math.max(x.acc, 1) ** 2; wsum += w; la += x.ll[0] * w; lo += x.ll[1] * w; }
  const ll = [la / wsum, lo / wsum];
  const meanAcc = f.reduce((s,x)=>s + x.acc, 0) / f.length;
  render();
  const m = L.marker(ll, {draggable:false});
  const base = T.noteAvg(f.length, fmt(meanAcc), AVG_SECONDS, new Date().toLocaleString(EN?"en-GB":"pt-PT"));
  terrainNote(ll).then(extra => hand(m, T.namePoint, base + extra, "marco"));
}

function begin(mode){
  if(!st.last) return say(T.waiting);
  st.mode = mode; st.pts = []; st.paused = false; clearTrail(); lockScreen();
  if(st.last.acc <= gate) collectStep(st.last.ll, st.last.acc);
  say(T.keepOpen); render();
}

function finish(){
  const mode = st.mode, pts = st.pts.slice();
  st.mode = null; st.paused = false; releaseScreen();
  try{ localStorage.removeItem(KEY); }catch(e){}
  const need = mode === "area" ? 3 : 2;
  if(pts.length < need){ clearTrail(); render(); return say(T.tooShort); }
  const line = pts.map(p => p.ll);
  const meanAcc = pts.reduce((s,p)=>s + p.acc, 0) / pts.length;
  const when = new Date().toLocaleString(EN ? "en-GB" : "pt-PT");
  const layer = mode === "area"
    ? L.polygon(line, {color:"#c9a227", weight:3, fillColor:"#c9a227", fillOpacity:.15})
    : L.polyline(line, {color:"#c9a227", weight:4});
  clearTrail(); render();
  const base = T.note(pts.length, fmt(meanAcc), when);
  terrainDrop(line[0], line[line.length - 1]).then(extra =>
    hand(layer, mode === "area" ? T.nameArea : T.nameLine, base + extra, mode === "area" ? "zona" : "caminho"));
}

function discard(){
  st.mode = null; st.pts = []; st.paused = false; clearTrail(); releaseScreen();
  try{ localStorage.removeItem(KEY); }catch(e){}
  render();
}

/* A phone's weakest number is height: GPS altitude is routinely 10–20 m out. We already hold the estate at
   0.5 m from the LiDAR, so take the elevation from our own terrain instead of from the satellites. */
async function terrainNote(ll){
  try{
    if(!(window.edrEdit && edrEdit.elevB)) return "";
    const z = await edrEdit.elevB(L.latLng(ll[0], ll[1]));
    return z == null ? "" : ` ${T.elev}: ${fmt(z)} m.`;
  }catch(e){ return ""; }
}
async function terrainDrop(a, b){
  try{
    if(!(window.edrEdit && edrEdit.elevB)) return "";
    const za = await edrEdit.elevB(L.latLng(a[0], a[1])), zb = await edrEdit.elevB(L.latLng(b[0], b[1]));
    if(za == null || zb == null) return "";
    return ` ${T.elev}: ${fmt(za)} → ${fmt(zb)} m, ${T.drop} ${fmt(Math.abs(za - zb))} m.`;
  }catch(e){ return ""; }
}

/* the finished geometry joins the normal proposal flow: name it, type it, save it, it syncs like anything else */
function hand(layer, name, note, preset){
  close();
  if(window.edrEdit && edrEdit.handoff) edrEdit.handoff(layer, {layer:"propostas", preset, props:{name, note}});
  else { layer.addTo(map); say(note); }
}

/* ---------- recover an unfinished walk ---------- */
try{
  const wip = JSON.parse(localStorage.getItem(KEY) || "null");
  if(wip && wip.pts && wip.pts.length > 1 && Date.now() - wip.at < 12*3600*1000){
    st.mode = wip.mode; st.pts = wip.pts; st.paused = true; drawTrail();
    setTimeout(()=>{ say(T.saved); open(); }, 1200);
  } else if(wip) localStorage.removeItem(KEY);
}catch(e){}

/* ---------- the sheet ---------- */
function build(){
  sheet = document.createElement("div"); sheet.id = "svsheet";
  sheet.setAttribute("role","dialog"); sheet.setAttribute("aria-label", T.title);
  document.body.appendChild(sheet);
  sheet.addEventListener("click", e => {
    const b = e.target.closest("button"); if(!b) return;
    const a = b.dataset.a;
    if(a === "close") close();
    else if(a === "point") beginAvg();
    else if(a === "line") begin("line");
    else if(a === "area") begin("area");
    else if(a === "stop") finish();
    else if(a === "discard") discard();
    else if(a === "pause"){ st.paused = !st.paused; render(); }
    else if(a === "follow" && st.last) map.setView(st.last.ll, Math.max(map.getZoom(), 18));
    else if(a === "cam"){ if(window.edrAR) edrAR.open(); }
    else if(a === "gate-"){ gate = Math.max(3, gate - 5); saveGate(); }
    else if(a === "gate+"){ gate = Math.min(60, gate + 5); saveGate(); }
  });
}
function saveGate(){ try{ localStorage.setItem("edr_survey_gate", String(gate)); }catch(e){} render(); }

function render(){
  if(!sheet || !st.opened) return;
  const f = st.last, q = f ? qIndex(f.acc) : 3, col = f ? QCOL[q] : "var(--line-2)";
  const head = `<button class="x" data-a="close" aria-label="${T.close}">✕</button>
    <div class="grab"></div>
    <h3><span class="dot" style="background:${col}"></span>${T.title}</h3>`;

  if(!f){
    sheet.innerHTML = head + `<div class="fix">${T.waiting}</div>
      <div class="hint">${T.unavailable}</div>`;
    return;
  }
  const fix = `<div class="fix">${T.acc} ${fmt(f.acc)} m · ${T.quality[q]}${f.alt!=null?` · ${T.alt} ${fmt(f.alt,0)} m`:""}${f.speed?` · ${fmt(f.speed*3.6)} km/h`:""}</div>
    <div class="coord">${fmt(f.ll[0],6)}, ${fmt(f.ll[1],6)}</div>`;

  if(st.mode === "avg"){
    const left = Math.max(0, Math.ceil((st.avgUntil - Date.now())/1000));
    sheet.innerHTML = head + fix +
      `<div class="mtr">${left}<small>s · ${T.averaging}</small></div>
       <div class="mtr" style="font-size:18px">${st.avgFixes.length}<small>${T.pts}</small></div>
       <div class="row"><button data-a="discard" class="bad">${T.discard}</button></div>
       <div class="hint">${T.keepOpen}</div>`;
    return;
  }
  if(st.mode === "line" || st.mode === "area"){
    const line = st.pts.map(p => p.ll);
    const metric = st.mode === "area"
      ? `${fmt(areaOf(line)/10000, 2)}<small>ha · ${T.ar}</small>`
      : `${fmt(len(line),0)}<small>m · ${T.len}</small>`;
    sheet.innerHTML = head + fix +
      `<div class="mtr">${metric}</div>
       <div class="mtr" style="font-size:18px">${st.pts.length}<small>${T.pts}</small></div>
       <div class="row">
         <button data-a="pause">${st.paused ? T.resume : T.pause}</button>
         <button data-a="stop" class="go">${T.stop}</button>
       </div>
       <div class="row"><button data-a="discard" class="bad">${T.discard}</button></div>
       <div class="hint">${st.paused ? "" : T.keepOpen}</div>`;
    return;
  }
  const poor = f.acc > gate;
  const ic = {
    point:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/></svg>',
    line:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 18 9 9l4 5 7-11"/><circle cx="4" cy="18" r="2"/><circle cx="20" cy="3" r="2"/></svg>',
    area:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M4 8.5 12 3l8 5.5V17l-8 5-8-5z"/></svg>',
    cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.2"/></svg>',
    follow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 2.5 21 21l-9-4.6L3 21z"/></svg>'
  };
  sheet.innerHTML = head + fix + `
    <div class="acts">
      <button class="a" data-a="point" ${poor?"disabled":""}>${ic.point}<span>${T.point}</span></button>
      <button class="a" data-a="line"  ${poor?"disabled":""}>${ic.line}<span>${T.line}</span></button>
      <button class="a" data-a="area"  ${poor?"disabled":""}>${ic.area}<span>${T.area}</span></button>
      <button class="a" data-a="follow">${ic.follow}<span>${T.follow}</span></button>
      <button class="a" data-a="cam">${ic.cam}<span>${T.cam}</span></button>
    </div>
    <div class="gate"><span>${T.gate} <b style="color:var(--linen)">${gate} m</b></span>
      <span class="pm"><button data-a="gate-" aria-label="−">−</button><button data-a="gate+" aria-label="+">+</button></span></div>
    <div class="hint">${poor ? T.waitAcc + " — " + T.unavailable : T.keepOpen}</div>`;
}

let tick = null;
function open(){
  if(!sheet) build();
  st.opened = true; start(); render();
  requestAnimationFrame(()=>sheet.classList.add("open"));
  if(!tick) tick = setInterval(render, 1000);        // keeps the countdown and the live length honest
  if(window.edrMobile) edrMobile.sync();
}
function close(){
  st.opened = false;
  if(sheet) sheet.classList.remove("open");
  if(tick && !st.mode){ clearInterval(tick); tick = null; }
  if(!st.mode){ stop(); }                            // keep the watch alive while a walk is being recorded
  if(window.edrMobile) edrMobile.sync();
}

window.edrSurvey = {open, close, recording:()=>!!st.mode, state:st};
})();
