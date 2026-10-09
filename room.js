// EdenRise map — "Sala 3D": walk around a room from the card, with every item in it pinned where it really is.
//
// Someone scans the pump room once with a free phone app (Scaniverse makes a Gaussian splat: photo-real, ~5–15 MB as
// SPZ; Polycam / 3D Scanner App / Apple RoomPlan make a mesh: GLB or USDZ). The scan goes into the item's media store
// like a photo (caption "[sala3d] vN ext"), so nothing new is needed on the server and every upload is a version.
// Then the team drops pins on the scan: tap a spot, pick the item (a pump, a valve, a meter) or type a label. Each pin
// shows that item's live state from its timeline (open problems, parts on order, days since service), and a tap gives
// the same one-tap records as the field card. Pins are a small JSON file in the same store ("[sala3d-pins] vN"):
// every save is a version, a removed pin can be brought back from any earlier version, and nothing is overwritten.
//
// Engine: three.js (MIT) and Spark (World Labs, MIT) for splats, three's glTF/USDZ loaders for meshes — bundled once
// into vendor/spark/room3d.js and loaded only when a room is opened. Big PLY splats are converted to SPZ on the phone
// (Spark's transcoder) before upload, so a 100 MB export becomes ~10 MB.
(function(){
const EN = (typeof LANG !== "undefined") && LANG === "en";
const API = "https://edenrise-brain.edenrise.workers.dev";
const SITE = (typeof SITE_ID !== "undefined") ? SITE_ID : "edenrise";
const LIB = "vendor/spark/room3d.js";
const MAX = 20 * 1024 * 1024;
const T = EN ? {room:"3D room", add:"Add a 3D scan", none:"No 3D scan of this place yet.", how:"Scan it once with a free phone app, then upload the file here:", scaniverse:"<b>Scaniverse</b> (iPhone and Android): scan, then Share → Export → <b>SPZ</b>. Photo-real, best choice.", polycam:"<b>Polycam</b> or <b>3D Scanner App</b>: export <b>GLB</b>.", roomplan:"<b>Apple RoomPlan</b> (iPhone Pro): export <b>USDZ</b>.", choose:"Choose scan file", loading:"Loading the room…", reading:"Reading the scan…", converting:"Making it smaller (SPZ)…", uploading:"Uploading", uploaded:"Scan saved", tooBig:"Still over 20 MB. In Scaniverse export SPZ, or crop the scan to the room.", badType:"Use SPZ, PLY, SPLAT, KSPLAT, GLB or USDZ.", failed:"Could not load this scan", pin:"Add pin", pinHint:"Tap the spot where the item is", pick:"What is here?", inside:"In this place", nearby:"Nearby", label:"Just a label", labelAsk:"Label text", filter:"Type to search", save:"Save", saved:"Saved", saving:"Saving…", unsaved:"Pins changed. Save before closing?", undo:"Undo", versions:"Versions", restore:"Bring back this version", restored:"Version brought back — Save to keep it", close:"Close", flip:"Flip", turn:"Turn", replace:"New scan", open:"Open card", move:"Move", moveHint:"Tap the new spot", del:"Delete pin", delAsk:"Delete this pin? You can bring it back from Versions.", deleted:"Pin deleted", viewOnly:"view only — sign in to edit", noSignal:"No signal — saved on this device, will send later", pins:"pins", draft:"local draft", reset:"Reset view", noState:"no record yet", walk:"Tip: drag to look around, pinch or scroll to zoom, two fingers to move.", err:"Something went wrong"}
             : {room:"Sala 3D", add:"Juntar digitalização 3D", none:"Ainda não há digitalização 3D deste sítio.", how:"Digitaliza uma vez com uma app grátis no telemóvel e carrega o ficheiro aqui:", scaniverse:"<b>Scaniverse</b> (iPhone e Android): digitaliza, depois Partilhar → Exportar → <b>SPZ</b>. Fotorrealista, a melhor escolha.", polycam:"<b>Polycam</b> ou <b>3D Scanner App</b>: exporta <b>GLB</b>.", roomplan:"<b>Apple RoomPlan</b> (iPhone Pro): exporta <b>USDZ</b>.", choose:"Escolher ficheiro", loading:"A abrir a sala…", reading:"A ler a digitalização…", converting:"A tornar mais leve (SPZ)…", uploading:"A enviar", uploaded:"Digitalização guardada", tooBig:"Ainda tem mais de 20 MB. No Scaniverse exporta SPZ, ou recorta a digitalização à sala.", badType:"Usa SPZ, PLY, SPLAT, KSPLAT, GLB ou USDZ.", failed:"Não consegui abrir esta digitalização", pin:"Juntar pino", pinHint:"Toca no sítio onde está o item", pick:"O que está aqui?", inside:"Neste sítio", nearby:"Perto", label:"Só uma etiqueta", labelAsk:"Texto da etiqueta", filter:"Escreve para procurar", save:"Guardar", saved:"Guardado", saving:"A guardar…", unsaved:"Os pinos mudaram. Guardar antes de fechar?", undo:"Desfazer", versions:"Versões", restore:"Recuperar esta versão", restored:"Versão recuperada — Guarda para a manter", close:"Fechar", flip:"Virar", turn:"Rodar", replace:"Nova digitalização", open:"Abrir ficha", move:"Mover", moveHint:"Toca no novo sítio", del:"Apagar pino", delAsk:"Apagar este pino? Podes recuperá-lo em Versões.", deleted:"Pino apagado", viewOnly:"só leitura — entra para editar", noSignal:"Sem rede — guardado neste aparelho, envia depois", pins:"pinos", draft:"rascunho local", reset:"Repor vista", noState:"sem registo", walk:"Dica: arrasta para olhar, belisca ou roda para aproximar, dois dedos para mover.", err:"Algo correu mal"};
const auth = () => window.edrAuth || {key:"", role:"viewer", actor:""};
const say = m => window.toast && toast(m);
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));
const LEVEL = {problem:"#e5484d", waiting:"#e0a030", ok:"#5be0a0", none:"#b9b2a4"};
const R = {fid:null, aliases:[], name:"", ll:null, ui:null, viewOnly:true, scan:null, scans:[], pinFiles:[], pins:[], xf:{flip:null, yaw:0}, pinsVer:0, dirty:false, undo:[], mode:"view", sel:null, three:null, raf:0, status:new Map()};

const css = document.createElement("style"); css.textContent = `
#qroom{position:fixed;inset:0;z-index:7050;background:#14110d;display:none;flex-direction:column;color:#f1e9d8}
#qroom.on{display:flex}
#qroom .rhd{height:52px;display:flex;align-items:center;gap:8px;padding:0 10px;background:#1c1813;font:600 13px var(--ui);flex:0 0 auto;border-bottom:1px solid rgba(241,233,216,.12)}
#qroom .rhd .ttl{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px} #qroom .rhd .ttl small{display:block;font:500 11px var(--mono);opacity:.65}
#qroom button{height:36px;border-radius:18px;border:1px solid rgba(241,233,216,.25);background:transparent;color:#f1e9d8;font:600 12px var(--ui);padding:0 12px;cursor:pointer;white-space:nowrap}
#qroom button:focus-visible{outline:2px solid #c9a227;outline-offset:2px}
#qroom button.ok{background:#c9a227;color:#1c1813;border-color:#c9a227} #qroom button.on{border-color:#c9a227;color:#c9a227} #qroom button:disabled{opacity:.4;cursor:default}
#qroom .st{font:600 11px var(--mono);opacity:.75;white-space:nowrap} #qroom .st.dirty{color:#e07b39;opacity:1}
#qroom .rbody{flex:1;position:relative;min-height:0;overflow:hidden}
#qroom canvas.r3{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
#qroom .rlabels{position:absolute;inset:0;pointer-events:none;overflow:hidden}
#qroom .rpin{position:absolute;left:0;top:0;pointer-events:auto;cursor:pointer;display:flex;align-items:center;gap:6px;transform-origin:0 50%;max-width:220px}
#qroom .rpin i{width:14px;height:14px;border-radius:50%;border:2px solid #14110d;box-shadow:0 0 0 2px currentColor;flex:0 0 auto;background:currentColor}
#qroom .rpin span{background:rgba(20,17,13,.88);border:1px solid currentColor;border-radius:9px;padding:4px 8px;font:600 12px/1.25 var(--ui);color:#f1e9d8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:190px}
#qroom .rpin span small{display:block;font:500 10.5px var(--mono);opacity:.8}
#qroom .rpin.dot span{display:none} #qroom .rpin.sel span{background:#c9a227;color:#1c1813} #qroom .rpin.back{opacity:.45}
#qroom .rhint{position:absolute;left:50%;top:12px;transform:translateX(-50%);background:rgba(28,24,19,.9);border:1px solid #c9a227;color:#f1e9d8;border-radius:12px;padding:8px 12px;font:600 12.5px var(--ui);z-index:4;display:none;max-width:90%;text-align:center}
#qroom .rhint.on{display:block}
#qroom .rtools{position:absolute;left:10px;bottom:12px;display:flex;gap:6px;z-index:4;flex-wrap:wrap} #qroom .rtools button{background:rgba(28,24,19,.86)}
#qroom .rload{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:#14110d;font:600 14px var(--ui);z-index:6}
#qroom .rload .bar{width:min(260px,70vw);height:6px;border-radius:3px;background:rgba(241,233,216,.15);overflow:hidden} #qroom .rload .bar b{display:block;height:100%;width:0;background:#c9a227;transition:width .2s}
#qroom .rempty{position:absolute;inset:0;display:none;align-items:center;justify-content:center;padding:20px;z-index:5;overflow-y:auto}
#qroom .rempty.on{display:flex}
#qroom .rempty .card{max-width:440px;background:#1c1813;border:1px solid rgba(241,233,216,.14);border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:12px;font:500 14px/1.5 var(--ui)}
#qroom .rempty h3{margin:0;font:700 17px var(--ui);text-wrap:balance} #qroom .rempty ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:13.5px} #qroom .rempty button.ok{height:46px;border-radius:12px;font-size:14px}
#qroom .rsheet{position:absolute;right:10px;top:10px;width:320px;max-width:calc(100% - 20px);max-height:calc(100% - 20px);background:#1c1813;border:1px solid rgba(241,233,216,.16);border-radius:14px;box-shadow:0 14px 40px rgba(0,0,0,.5);display:none;flex-direction:column;z-index:7;overflow:hidden}
#qroom .rsheet.on{display:flex}
#qroom .rsheet .sh{padding:12px 14px 8px;font:700 14px var(--ui);display:flex;justify-content:space-between;align-items:center;gap:8px} #qroom .rsheet .sh button{height:32px;padding:0 10px}
#qroom .rsheet .sb{overflow-y:auto;padding:0 12px 12px;display:flex;flex-direction:column;gap:6px}
#qroom .rsheet input{height:42px;border-radius:10px;border:1px solid rgba(241,233,216,.2);background:rgba(0,0,0,.3);color:#f1e9d8;padding:0 12px;font:500 14px var(--ui)}
#qroom .rsheet .li{text-align:left;height:auto;min-height:44px;border-radius:10px;border:1px solid rgba(241,233,216,.14);background:rgba(255,255,255,.04);padding:9px 12px;font:500 13px var(--ui);white-space:normal;display:flex;gap:8px;align-items:center}
#qroom .rsheet .li small{display:block;opacity:.65;font:500 11px var(--mono)} #qroom .rsheet .grp{font:700 11px var(--ui);letter-spacing:.06em;text-transform:uppercase;opacity:.6;margin:6px 2px 0}
#qroom .rsheet .stt{font:600 12.5px var(--ui);padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.05);border-left:4px solid currentColor}
#qroom .rsheet .row{display:flex;gap:6px;flex-wrap:wrap} #qroom .rsheet .row button{flex:1 1 auto;height:40px;border-radius:10px}
#qroom .rsheet .zacts{display:grid;grid-template-columns:1fr 1fr;gap:6px} #qroom .rsheet .zacts button{height:42px;border-radius:10px;font-size:12.5px}
#qroom .rsheet button.danger{border-color:#e5484d;color:#ff8f8f}
#qroom .rsheet .ver{display:flex;justify-content:space-between;gap:8px;align-items:center}
@media (max-width:700px){
 #qroom .rhd{height:48px;gap:6px;padding:0 6px} #qroom .rhd button{padding:0 9px;min-width:38px} #qroom .rhd .lb{display:none} #qroom .rhd .ttl small{display:none}
 #qroom .rsheet{left:0;right:0;top:auto;bottom:0;width:auto;max-width:none;max-height:62%;border-radius:16px 16px 0 0;border-bottom:0}
 #qroom .rtools{bottom:auto;top:10px} }
@media (pointer:coarse){ #qroom .rtools button,#qroom .rhd button{height:40px} #qroom .rpin i{width:18px;height:18px} }
@media (prefers-reduced-motion:reduce){ #qroom .rload .bar b{transition:none} }`;
document.head.appendChild(css);

/* ---------- the engine, loaded once ---------- */
let libP = null;
function loadLib(){
  if(window.EdrRoom3D) return Promise.resolve();
  if(libP) return libP;
  libP = new Promise((res, rej) => { const s = document.createElement("script"); s.src = LIB; s.onload = () => res(); s.onerror = () => { libP = null; rej(new Error("room3d")); }; document.head.appendChild(s); });
  return libP;
}

/* ---------- storage: the item's media store ---------- */
const isScan = m => /^\[sala3d\]\s/.test(m.caption || "");
const isPins = m => /^\[sala3d-pins\]/.test(m.caption || "");
const verOf = m => { const x = /v(\d+)/.exec(m.caption || ""); return x ? +x[1] : 0; };
const extOf = m => { const x = /^\[sala3d\]\s+v\d+\s+(\w+)/.exec(m.caption || ""); return x ? x[1].toLowerCase() : "spz"; };
async function itemMedia(){ let out = []; for(const id of [R.fid, ...R.aliases]){ try{ const d = await fetch(`${API}/item/${encodeURIComponent(id)}`).then(r => r.json()); out = out.concat(d.media || []); }catch(e){} } return out; }
const byVer = (a, b) => verOf(b) - verOf(a) || String(b.at).localeCompare(String(a.at));
async function cachedBytes(url){   // scans are big: keep them on the device so the pump room opens with no signal
  let c = null; try{ c = await caches.open("edr-rooms"); const hit = await c.match(url); if(hit) return new Uint8Array(await hit.arrayBuffer()); }catch(e){}
  const r = await fetch(url); if(!r.ok) throw new Error(r.status); const buf = await r.arrayBuffer();
  try{ if(c) await c.put(url, new Response(buf.slice(0), {headers:{"Content-Type":"application/octet-stream"}})); }catch(e){}
  return new Uint8Array(buf);
}
const draftKey = () => "edr_room_" + R.fid;
function readDraft(){ try{ return JSON.parse(localStorage.getItem(draftKey()) || "null"); }catch(e){ return null; } }
function writeDraft(){ try{ localStorage.setItem(draftKey(), JSON.stringify({pins:R.pins, xf:R.xf, ver:R.pinsVer, at:Date.now()})); }catch(e){} }
function dropDraft(){ try{ localStorage.removeItem(draftKey()); }catch(e){} }

/* ---------- UI ---------- */
function build(){
  const ui = document.createElement("div"); ui.id = "qroom"; ui.setAttribute("role", "dialog"); ui.setAttribute("aria-label", T.room);
  ui.innerHTML = `<div class="rhd"><button data-a="close" aria-label="${T.close}">✕</button><div class="ttl"><span class="nm"></span><small class="sub"></small></div><span class="st"></span>
    <button data-a="undo" title="${T.undo}">↶<span class="lb"> ${T.undo}</span></button><button data-a="pin">📍<span class="lb"> ${T.pin}</span></button><button data-a="versions" title="${T.versions}">🕘<span class="lb"> ${T.versions}</span></button><button data-a="save" class="ok">${T.save}</button></div>
    <div class="rbody"><canvas class="r3"></canvas><div class="rlabels"></div><div class="rhint"></div>
    <div class="rtools"><button data-a="reset">⟲ ${T.reset}</button><button data-a="flip">⇅ ${T.flip}</button><button data-a="turn">↻ ${T.turn}</button><button data-a="replace">⬆ ${T.replace}</button></div>
    <div class="rempty"><div class="card"><h3>${T.none}</h3><div>${T.how}</div><ul><li>${T.scaniverse}</li><li>${T.polycam}</li><li>${T.roomplan}</li></ul><button class="ok" data-a="upload">⬆ ${T.choose}</button></div></div>
    <div class="rsheet"><div class="sh"><span class="sht"></span><button data-a="sheetclose" aria-label="${T.close}">✕</button></div><div class="sb"></div></div>
    <div class="rload"><span class="lt">${T.loading}</span><div class="bar"><b></b></div></div></div>
    <input type="file" class="rfile" hidden accept=".spz,.ply,.splat,.ksplat,.glb,.gltf,.usdz">`;
  document.body.appendChild(ui);
  const on = (a, f) => ui.querySelectorAll(`[data-a="${a}"]`).forEach(b => b.onclick = f);
  on("close", () => close()); on("save", () => save()); on("undo", undo); on("pin", () => setMode(R.mode === "pin" ? "view" : "pin")); on("versions", showVersions);
  on("reset", frame); on("flip", () => { pushUndo(); R.xf.flip = !R.xf.flip; applyXf(); markDirty(); }); on("turn", () => { pushUndo(); R.xf.yaw = ((R.xf.yaw || 0) + 90) % 360; applyXf(); markDirty(); });
  on("upload", () => ui.querySelector(".rfile").click()); on("replace", () => ui.querySelector(".rfile").click()); on("sheetclose", closeSheet);
  ui.querySelector(".rfile").onchange = e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if(f) uploadScan(f); };
  document.addEventListener("keydown", e => { if(!ui.classList.contains("on")) return; if(e.key === "Escape"){ if(R.mode !== "view") setMode("view"); else if(ui.querySelector(".rsheet.on")) closeSheet(); else close(); } if((e.metaKey || e.ctrlKey) && e.key === "z"){ e.preventDefault(); undo(); } });
  return ui;
}
const $ = s => R.ui.querySelector(s);
function setStatus(t, dirty){ const s = $(".st"); s.textContent = t || ""; s.classList.toggle("dirty", !!dirty); }
function setLoad(t, frac){ const l = $(".rload"); if(t == null){ l.style.display = "none"; return; } l.style.display = "flex"; l.querySelector(".lt").textContent = t; l.querySelector(".bar b").style.width = frac == null ? "0" : Math.round(frac * 100) + "%"; l.querySelector(".bar").style.visibility = frac == null ? "hidden" : "visible"; }
function hint(t){ const h = $(".rhint"); h.textContent = t || ""; h.classList.toggle("on", !!t); }
function syncButtons(){
  const hasScan = !!R.scan; const ro = R.viewOnly;
  $('[data-a="save"]').disabled = ro || !R.dirty; $('[data-a="undo"]').disabled = ro || !R.undo.length; $('[data-a="pin"]').disabled = ro || !hasScan; $('[data-a="versions"]').disabled = !R.pinFiles.length;
  $('[data-a="pin"]').classList.toggle("on", R.mode === "pin");
  R.ui.querySelectorAll('[data-a="flip"],[data-a="turn"],[data-a="replace"]').forEach(b => b.style.display = ro ? "none" : "");
  $(".rtools").style.display = hasScan ? "flex" : "none";
  $(".sub").textContent = hasScan ? `v${verOf(R.scan)} · ${R.pins.length} ${T.pins}` : "";
}
function markDirty(){ R.dirty = true; writeDraft(); setStatus(T.draft, true); syncButtons(); }
function pushUndo(){ R.undo.push(JSON.stringify({pins:R.pins, xf:R.xf})); if(R.undo.length > 60) R.undo.shift(); }
function undo(){ if(R.viewOnly || !R.undo.length) return; const s = JSON.parse(R.undo.pop()); R.pins = s.pins; R.xf = s.xf; applyXf(); renderPins(true); markDirty(); closeSheet(); }
function setMode(m){ R.mode = m; hint(m === "pin" ? T.pinHint : m === "move" ? T.moveHint : ""); syncButtons(); }

/* ---------- open / close ---------- */
async function open(fid, opts){
  opts = opts || {}; if(!R.ui) R.ui = build();
  Object.assign(R, {fid, aliases:opts.aliases || [], name:opts.name || fid, ll:opts.latlng || null, viewOnly:!auth().key || auth().role === "viewer", scan:null, scans:[], pinFiles:[], pins:[], xf:{flip:null, yaw:0}, pinsVer:0, dirty:false, undo:[], mode:"view", sel:null});
  R.ui.classList.add("on"); $(".nm").textContent = `${T.room} · ${R.name}`; $(".rempty").classList.remove("on"); closeSheet(); hint(""); setLoad(T.loading); setStatus(R.viewOnly ? T.viewOnly : "");
  syncButtons();
  const media = await itemMedia(); if(R.fid !== fid) return;
  R.scans = media.filter(isScan).sort(byVer); R.pinFiles = media.filter(isPins).sort(byVer); R.scan = R.scans[0] || null;
  if(R.pinFiles.length){ try{ const d = await fetch(`${API}/media/${R.pinFiles[0].id}`).then(r => r.json()); R.pins = d.pins || []; R.xf = d.xf || R.xf; R.pinsVer = verOf(R.pinFiles[0]); }catch(e){} }
  const dr = readDraft(); if(dr && (dr.ver || 0) >= R.pinsVer && JSON.stringify(dr.pins) !== JSON.stringify(R.pins)){ R.pins = dr.pins || []; R.xf = dr.xf || R.xf; R.dirty = true; }
  setStatus(R.viewOnly ? T.viewOnly : R.dirty ? T.draft : R.pinsVer ? `${T.saved} · v${R.pinsVer}` : "", R.dirty);
  if(!R.scan){ setLoad(null); $(".rempty").classList.add("on"); $(".rempty .ok").style.display = R.viewOnly ? "none" : ""; syncButtons(); return; }
  try{ await loadLib(); }catch(e){ setLoad(null); say(T.failed); return; }
  if(R.fid !== fid) return;
  try{ setLoad(T.reading); const bytes = await cachedBytes(`${API}/media/${R.scan.id}`); if(R.fid !== fid || !R.ui.classList.contains("on")) return; await show(bytes, extOf(R.scan)); }
  catch(e){ console.warn("room", e); setLoad(null); say(T.failed); $(".rempty").classList.add("on"); syncButtons(); return; }
  setLoad(null); syncButtons(); refreshStatus(); if(!R.pins.length && !R.viewOnly) say(T.walk);
}
async function close(force){
  if(!force && R.dirty && !R.viewOnly){ if(confirm(T.unsaved)){ const ok = await save(); if(!ok) return; } }   // "no" keeps the local draft — nothing is thrown away
  if(R.ui) R.ui.classList.remove("on"); teardown(); R.fid = null;
}

/* ---------- the 3D view ---------- */
function teardown(){
  const t = R.three; if(!t) return; cancelAnimationFrame(R.raf); R.raf = 0;
  try{ t.ro && t.ro.disconnect(); }catch(e){} try{ t.controls.dispose(); }catch(e){}
  try{ t.scene.traverse(o => { if(o.geometry) o.geometry.dispose && o.geometry.dispose(); if(o.material){ (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose && m.dispose()); } if(o.dispose && o !== t.scene) try{ o.dispose(); }catch(e){} }); }catch(e){}
  try{ t.renderer.dispose(); t.renderer.forceContextLoss && t.renderer.forceContextLoss(); }catch(e){}
  R.three = null; $(".rlabels").innerHTML = "";
  const old = $("canvas.r3"); const c = document.createElement("canvas"); c.className = "r3"; old.replaceWith(c);   // a fresh canvas: a lost WebGL context cannot be reused
}
async function show(bytes, ext){
  teardown();
  const {THREE, OrbitControls, GLTFLoader, USDZLoader, SparkRenderer, SplatMesh} = window.EdrRoom3D;
  const canvas = $("canvas.r3"); const body = $(".rbody");
  const renderer = new THREE.WebGLRenderer({canvas, antialias:false, alpha:false}); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setClearColor(0x14110d);
  const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(60, 1, 0.02, 500);
  const holder = new THREE.Group(); scene.add(holder);
  let obj, splat = false;
  if(/^(glb|gltf)$/.test(ext)){ const g = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), ""); obj = g.scene; scene.add(new THREE.HemisphereLight(0xfff4e0, 0x3a3226, 2.2)); const d = new THREE.DirectionalLight(0xffffff, 1.4); d.position.set(3, 6, 2); scene.add(d); }
  else if(ext === "usdz"){ obj = new USDZLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)); scene.add(new THREE.HemisphereLight(0xfff4e0, 0x3a3226, 2.2)); }
  else { const spark = new SparkRenderer({renderer}); scene.add(spark); obj = new SplatMesh({fileBytes:bytes, fileType:ext}); await obj.initialized; splat = true; }
  holder.add(obj);
  const controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.dampingFactor = 0.12; controls.screenSpacePanning = true; controls.zoomToCursor = true;
  R.three = {THREE, renderer, scene, camera, controls, holder, obj, splat, ray:new THREE.Raycaster(), markers:new Map()};
  applyXf(true);
  const size = () => { const w = body.clientWidth, h = body.clientHeight; if(!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(size); ro.observe(body); R.three.ro = ro; size();
  bindPointer(canvas);
  const loop = () => { if(!R.three) return; R.raf = requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); placeLabels(); };
  loop(); renderPins(true);
}
function bounds(){ const t = R.three; if(!t) return null; t.holder.updateMatrixWorld(true); let b;
  if(t.splat){ b = t.obj.getBoundingBox(true).clone(); b.applyMatrix4(t.obj.matrixWorld); } else b = new t.THREE.Box3().setFromObject(t.obj);
  return b.isEmpty() ? null : b; }
function applyXf(refit){
  const t = R.three; if(!t) return; const {THREE} = t;
  if(R.xf.flip == null) R.xf.flip = t.splat;   // splat scanners write y-down (OpenCV axes); glTF/USDZ meshes are already y-up
  // scans come in their scanner's own axes: centre them on the origin, then flip/turn as the team set it
  t.obj.position.set(0, 0, 0); t.obj.quaternion.identity(); t.obj.updateMatrixWorld(true);
  const q = new THREE.Quaternion(); if(R.xf.flip) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI));
  const yawQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (R.xf.yaw || 0) * Math.PI / 180);
  t.holder.quaternion.copy(yawQ.multiply(q)); t.holder.position.set(0, 0, 0); t.holder.updateMatrixWorld(true);
  if(refit || !t.fitted){ frame(); t.fitted = true; }
}
function frame(){
  const t = R.three; if(!t) return; const b = bounds(); const c = new t.THREE.Vector3(), s = new t.THREE.Vector3();
  if(b){ b.getCenter(c); b.getSize(s); } else { s.set(4, 3, 4); }
  const r = Math.max(1, Math.min(60, s.length() / 2));
  t.camera.position.set(c.x + r * 0.9, c.y + r * 0.6, c.z + r * 0.9); t.camera.near = Math.max(0.01, r / 500); t.camera.far = r * 40; t.camera.updateProjectionMatrix();
  t.controls.target.copy(c); t.controls.maxDistance = r * 6; t.controls.update();
}

/* ---------- pointer: tap to place, tap a pin to open it; a drag is always just looking around ---------- */
function bindPointer(canvas){
  let down = null;
  canvas.addEventListener("pointerdown", e => { down = {x:e.clientX, y:e.clientY, t:Date.now()}; });
  canvas.addEventListener("pointerup", e => { if(!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); const quick = Date.now() - down.t < 600; down = null; if(moved > 8 || !quick) return; tap(e); });
}
function hitAt(e){
  const t = R.three; const r = t.renderer.domElement.getBoundingClientRect();
  const v = new t.THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  t.ray.setFromCamera(v, t.camera); const hits = t.ray.intersectObject(t.obj, true); return hits.length ? hits[0].point : null;
}
function toLocal(p){ const t = R.three; const v = t.holder.worldToLocal(p.clone()); return [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)]; }
function toWorld(a){ const t = R.three; return t.holder.localToWorld(new t.THREE.Vector3(a[0], a[1], a[2])); }
function tap(e){
  if(!R.three) return;
  if(R.mode === "pin" || R.mode === "move"){ const p = hitAt(e); if(!p){ say(EN ? "Tap on the scan itself" : "Toca na própria digitalização"); return; } const local = toLocal(p);
    if(R.mode === "move" && R.sel){ pushUndo(); const pin = R.pins.find(x => x.i === R.sel); if(pin) pin.p = local; setMode("view"); renderPins(true); markDirty(); openPin(R.sel); return; }
    setMode("view"); pickFor(local); return; }
}

/* ---------- pins: which items can be pinned here ---------- */
function zoneObj(){
  if(!window.edrZones || !R.ll) return null; const ll = [R.ll.lat, R.ll.lng];
  const zs = edrZones.zonesAt(ll, 30); const ids = [R.fid, ...R.aliases];
  return zs.find(z => ids.includes(z.fid)) || zs.find(z => z.inside) || null;
}
function candidates(){
  const out = []; const seen = new Set(R.pins.map(p => p.r).filter(Boolean)); const add = (fid, name, grp, sub) => { if(!fid || fid === R.fid || out.some(o => o.fid === fid)) return; out.push({fid, name, grp, sub, used:seen.has(fid)}); };
  try{ const z = zoneObj(); if(z) for(const c of edrZones.children(z)) add(c.fid, c.name, T.inside, c.t === "propostas" ? (EN ? "team" : "equipa") : typeof title_i18n === "function" ? title_i18n(c.t, c.t) : c.t); }catch(e){}
  try{ if(R.ll && typeof DATA !== "undefined"){ const near = []; for(const t in DATA){ const fc = DATA[t]; if(!fc || !fc.features) continue; for(const f of fc.features){ const g = f.geometry; if(!g || g.type !== "Point") continue; const d = map.distance([g.coordinates[1], g.coordinates[0]], R.ll); if(d < 60) near.push({t, f, d}); } }
    near.sort((a, b) => a.d - b.d).slice(0, 40).forEach(n => { const fid = edrZones ? edrZones.fidOf(n.t, n.f) : null; const p = n.f.properties || {}; add(fid, p.name || p.asset_id || p.tree_name || n.t, T.nearby, `${typeof title_i18n === "function" ? title_i18n(n.t, n.t) : n.t} · ${Math.round(n.d)} m`); }); } }catch(e){}
  try{ for(const f of (window.edrEdit && edrEdit.feats ? edrEdit.feats() : [])){ const p = f.properties || {}; if(p.op === "retire" || p.status === "rejeitado" || !f.geometry || f.geometry.type !== "Point" || !R.ll) continue; const d = map.distance([f.geometry.coordinates[1], f.geometry.coordinates[0]], R.ll); if(d < 60) add(p.id, p.name || p.tipo_livre || p.preset || p.id, T.nearby, `${EN ? "team" : "equipa"} · ${Math.round(d)} m`); } }catch(e){}
  return out;
}
function sheet(title, html){ const s = $(".rsheet"); s.querySelector(".sht").textContent = title; s.querySelector(".sb").innerHTML = html; s.classList.add("on"); return s.querySelector(".sb"); }
function closeSheet(){ if(!R.ui) return; $(".rsheet").classList.remove("on"); if(R.sel){ R.sel = null; renderPins(); } }
function pickFor(local){
  const list = candidates();
  const draw = q => { q = (q || "").toLowerCase().trim(); const f = list.filter(c => !q || (c.name + " " + (c.sub || "")).toLowerCase().includes(q)); let grp = null, h = "";
    for(const c of f){ if(c.grp !== grp){ grp = c.grp; h += `<div class="grp">${esc(grp)}</div>`; } h += `<button class="li" data-fid="${esc(c.fid)}"><span style="flex:1">${esc(c.name)}<small>${esc(c.sub || "")}${c.used ? " · 📍" : ""}</small></span></button>`; }
    return h || `<div style="opacity:.7;font-size:13px;padding:6px 2px">${EN ? "Nothing here — use a label" : "Nada — usa uma etiqueta"}</div>`; };
  const sb = sheet(T.pick, `<input class="rq" placeholder="${T.filter}" aria-label="${T.filter}"><button class="li" data-label="1">🏷 ${T.label}</button><div class="rl">${draw("")}</div>`);
  const bind = () => sb.querySelectorAll("[data-fid]").forEach(b => b.onclick = () => { const c = list.find(x => x.fid === b.dataset.fid); addPin({r:c.fid, l:c.name, p:local}); });
  sb.querySelector(".rq").oninput = e => { sb.querySelector(".rl").innerHTML = draw(e.target.value); bind(); };
  sb.querySelector("[data-label]").onclick = () => { const v = prompt(T.labelAsk, sb.querySelector(".rq").value || ""); if(v && v.trim()) addPin({r:null, l:v.trim().slice(0, 60), p:local}); };
  bind(); if(!matchMedia("(pointer:coarse)").matches) sb.querySelector(".rq").focus();
}
function addPin(o){ pushUndo(); const pin = {i:"p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 4), r:o.r, l:o.l, p:o.p}; R.pins.push(pin); renderPins(true); markDirty(); refreshStatus(); openPin(pin.i); }

/* ---------- pins: drawing, live state, decluttered labels ---------- */
function renderPins(rebuild){
  const host = $(".rlabels"); if(!R.three){ host.innerHTML = ""; return; }
  if(rebuild){ host.innerHTML = ""; R.three.markers.clear(); for(const p of R.pins){ const el = document.createElement("div"); el.className = "rpin"; el.innerHTML = `<i></i><span></span>`; el.onclick = ev => { ev.stopPropagation(); openPin(p.i); }; host.appendChild(el); R.three.markers.set(p.i, el); } }
  for(const p of R.pins){ const el = R.three.markers.get(p.i); if(!el) continue; const st = p.r ? R.status.get(p.r) : null; el.style.color = LEVEL[st ? st.level : "none"]; el.classList.toggle("sel", R.sel === p.i);
    el.querySelector("span").innerHTML = `${esc(p.l)}${st && st.summary ? `<small>${esc(st.summary)}</small>` : ""}`; el.setAttribute("aria-label", p.l); }
  syncButtons();
}
async function refreshStatus(){ if(!window.edrZones) return; const refs = [...new Set(R.pins.map(p => p.r).filter(Boolean))]; await Promise.all(refs.map(async r => { try{ R.status.set(r, await edrZones.status(r)); }catch(e){} })); renderPins(); }
function placeLabels(){
  const t = R.three; if(!t || !R.pins.length) return; const w = t.renderer.domElement.clientWidth, h = t.renderer.domElement.clientHeight; const placed = []; const v = new t.THREE.Vector3();
  const items = R.pins.map(p => { const wp = toWorld(p.p); v.copy(wp).project(t.camera); return {p, x:(v.x + 1) / 2 * w, y:(1 - v.y) / 2 * h, z:v.z, d:wp.distanceTo(t.camera.position)}; }).sort((a, b) => (R.sel === a.p.i ? -1 : R.sel === b.p.i ? 1 : a.d - b.d));
  for(const it of items){ const el = t.markers.get(it.p.i); if(!el) continue;
    if(it.z > 1 || it.z < -1 || it.x < -40 || it.y < -40 || it.x > w + 40 || it.y > h + 40){ el.style.display = "none"; continue; }
    el.style.display = ""; const lw = Math.min(200, 26 + it.p.l.length * 7.2), lh = 30; const box = {x:it.x - 9, y:it.y - lh / 2, w:lw, h:lh};
    const clash = placed.some(b => box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y);
    el.classList.toggle("dot", clash && R.sel !== it.p.i); if(!clash) placed.push(box); else placed.push({x:it.x - 9, y:it.y - 9, w:18, h:18});
    el.style.transform = `translate(${Math.round(it.x - 9)}px,${Math.round(it.y - 9)}px)`; el.style.zIndex = String(1000 - Math.round(it.d * 10)); }
}
function openPin(id){
  const p = R.pins.find(x => x.i === id); if(!p) return; R.sel = id; renderPins();
  const st = p.r ? R.status.get(p.r) : null; const ro = R.viewOnly;
  const sb = sheet(p.l, `${p.r ? `<div class="stt" style="color:${LEVEL[st ? st.level : "none"]}"><span style="color:#f1e9d8">${esc(st && st.summary ? st.summary : T.noState)}</span></div>` : ""}
    ${p.r && !ro && window.edrZones ? `<div class="zacts">${edrZones.actionsHTML()}</div>` : ""}
    <div class="row">${p.r ? `<button data-x="card">↗ ${T.open}</button>` : ""}${ro ? "" : `<button data-x="move">✥ ${T.move}</button>`}</div>
    ${ro ? "" : `<div class="row"><button data-x="del" class="danger">🗑 ${T.del}</button></div>`}`);
  if(p.r && !ro && window.edrZones) edrZones.bindActions(sb, p.r, p.l, R.ll, () => { edrZones.invalidate(p.r); refreshStatus().then(() => R.sel === id && openPin(id)); });
  const x = sb.querySelector('[data-x="card"]'); if(x) x.onclick = () => openCard(p);
  const m = sb.querySelector('[data-x="move"]'); if(m) m.onclick = () => { $(".rsheet").classList.remove("on"); setMode("move"); };
  const d = sb.querySelector('[data-x="del"]'); if(d) d.onclick = () => { if(!confirm(T.delAsk)) return; pushUndo(); R.pins = R.pins.filter(q => q.i !== id); R.sel = null; $(".rsheet").classList.remove("on"); renderPins(true); markDirty(); say(T.deleted); };
}
async function openCard(p){
  // leave the room open underneath? The card lives on the map, so close the room first; the draft keeps unsaved pins
  if(R.dirty && !R.viewOnly) writeDraft(); const ref = p.r; R.ui.classList.remove("on"); teardown();
  if(window.edrTags) await edrTags.openRef(ref); else if(window.edrEdit && edrEdit.openById) edrEdit.openById(ref);
}

/* ---------- saving: a new version every time, never an overwrite ---------- */
async function save(){
  if(R.viewOnly || !R.dirty) return true; const a = auth(); if(!a.key){ say(EN ? "Sign in first" : "Entra primeiro"); return false; }
  setStatus(T.saving); const n = Math.max(R.pinsVer, ...R.pinFiles.map(verOf), 0) + 1;
  const blob = new Blob([JSON.stringify({v:1, scan:R.scan && R.scan.id, xf:R.xf, pins:R.pins, by:a.actor, at:new Date().toISOString()})], {type:"application/json"});
  const params = {feature_id:R.fid, caption:`[sala3d-pins] v${n}`, actor:a.actor};
  try{ const d = await window.edrUpload(blob, params); R.pinFiles.unshift({id:d.id, caption:params.caption, at:new Date().toISOString(), by:a.actor}); R.pinsVer = n; R.dirty = false; dropDraft(); setStatus(`${T.saved} · v${n}`); say(T.saved); }
  catch(e){ try{ await window.edrQueuePhoto(blob, params); R.pinsVer = n; R.dirty = false; dropDraft(); setStatus(T.noSignal, true); say(T.noSignal); }catch(e2){ setStatus(T.err, true); return false; } }
  syncButtons(); document.dispatchEvent(new CustomEvent("edr-room-saved", {detail:{fid:R.fid}})); return true;
}
async function showVersions(){
  const sb = sheet(T.versions, R.pinFiles.map((m, k) => `<div class="li ver"><span>v${verOf(m)}<small>${esc((m.by || "") + " · " + new Date(m.at).toLocaleString(EN ? "en-GB" : "pt-PT"))}</small></span>${k || R.dirty ? `<button data-v="${esc(m.id)}">${T.restore}</button>` : `<small>✓</small>`}</div>`).join("") || "—");
  sb.querySelectorAll("[data-v]").forEach(b => b.onclick = async () => { try{ const d = await fetch(`${API}/media/${b.dataset.v}`).then(r => r.json()); if(!R.viewOnly) pushUndo(); R.pins = d.pins || []; R.xf = d.xf || R.xf; applyXf(); renderPins(true); refreshStatus(); if(!R.viewOnly){ markDirty(); say(T.restored); } $(".rsheet").classList.remove("on"); }catch(e){ say(T.err); } });
}

/* ---------- uploading a scan: convert big splats to SPZ on the device first ---------- */
async function uploadScan(file){
  const a = auth(); if(R.viewOnly || !a.key){ say(T.viewOnly); return; }
  const ext = (file.name.split(".").pop() || "").toLowerCase(); if(!/^(spz|ply|splat|ksplat|glb|gltf|usdz)$/.test(ext)){ say(T.badType); return; }
  $(".rempty").classList.remove("on"); setLoad(T.reading);
  try{ await loadLib(); }catch(e){ setLoad(null); say(T.failed); return; }
  let bytes = new Uint8Array(await file.arrayBuffer()); let outExt = ext;
  if(/^(ply|splat|ksplat)$/.test(ext) && bytes.byteLength > 2 * 1024 * 1024){
    setLoad(T.converting); try{ const r = await EdrRoom3D.transcodeSpz({inputs:[{fileBytes:bytes, fileType:ext, pathOrUrl:file.name}], maxSh:1}); bytes = r.fileBytes instanceof Uint8Array ? r.fileBytes : new Uint8Array(r.fileBytes); outExt = "spz"; }catch(e){ console.warn("spz", e); }
  }
  if(bytes.byteLength > MAX){ setLoad(null); alert(T.tooBig); if(!R.scan) $(".rempty").classList.add("on"); return; }
  try{ await show(bytes, outExt); }catch(e){ console.warn("room", e); setLoad(null); say(T.failed); if(!R.scan) $(".rempty").classList.add("on"); return; }
  const n = Math.max(0, ...R.scans.map(verOf)) + 1; const params = {feature_id:R.fid, caption:`[sala3d] v${n} ${outExt}`, actor:a.actor, lat:R.ll && R.ll.lat, lon:R.ll && R.ll.lng};
  const blob = new Blob([bytes], {type:"application/octet-stream"});
  try{ setLoad(T.uploading, 0); const d = await window.edrUpload(blob, params, f => setLoad(`${T.uploading} ${Math.round(f * 100)}%`, f));
    R.scan = {id:d.id, caption:params.caption, at:new Date().toISOString()}; R.scans.unshift(R.scan);
    try{ const c = await caches.open("edr-rooms"); await c.put(`${API}/media/${d.id}`, new Response(bytes.slice(0), {headers:{"Content-Type":"application/octet-stream"}})); }catch(e){}
    say(T.uploaded); }
  catch(e){ try{ await window.edrQueuePhoto(blob, params); say(T.noSignal); }catch(e2){ say(T.err); } R.scan = R.scan || {id:"local", caption:params.caption}; }
  setLoad(null); syncButtons(); if(R.pins.length){ say(EN ? "Pins kept — use Flip/Turn if the new scan sits differently" : "Pinos mantidos — usa Virar/Rodar se a nova digitalização ficar diferente"); }
  document.dispatchEvent(new CustomEvent("edr-room-saved", {detail:{fid:R.fid}}));
}

window.edrRoom = {open, close, save, _state:R};
})();
