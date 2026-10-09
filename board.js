// EdenRise map — "Quadro": an interactive board on every item. The pump room gets a drawn layout with valves and pipes,
// a building gets its plan, a paddock its gates and water — notes, photos, symbols, arrows, straight lines, shapes,
// a metric grid (1 square = 1 m) and, when wanted, the real aerial photo underneath at true scale.
//
// Engine: Excalidraw (MIT), bundled once into vendor/excalidraw/ and loaded only when a board is opened. Everything
// around it is ours: storage, versions, photos, links to other items, templates, the estate symbol library.
//
// Storage needs nothing new on the server. A board is a JSON file in the item's media store (caption "[quadro] vN");
// each save is a new version, so history is free and nothing is overwritten. Images inside a board are uploaded once
// as media and referenced by URL. A PNG snapshot ("[quadro-snap] vN") becomes the board's cover on the card and
// travels to QGIS with the 15-minute sync. Offline: the save is queued like photos and sent when signal returns;
// the draft also lives on the device.
(function(){
const EN = (typeof LANG !== "undefined") && LANG === "en";
const API = "https://edenrise-brain.edenrise.workers.dev";
const V = "vendor/excalidraw/";
const GRID = 20;                                   // px per metre on the board
const T = EN ? {board:"Board", open:"Open board", save:"Save", saved:"Saved", saving:"Saving…", draft:"local draft", viewOnly:"view only — sign in to edit", templates:"Templates", photos:"Photos", aerial:"Aerial photo", link:"Link to item", history:"Versions", close:"Close",
  scale:"1 square = 1 m", noPhotos:"No photos on this item yet.", addPhoto:"Add photo", insert:"Tap a photo to place it on the board", pick:"Which item does this point to? Type to search", none:"nothing found", linked:"Linked", selectFirst:"Select a shape first", unsaved:"Unsaved changes. Save before closing?", versionOf:"Version", restore:"Restore this version", restored:"Restored as a new version", loading:"Loading the board…", queued:"No signal — saved on this device, will send later", err:"Could not save", aerialBusy:"Fetching aerial tiles…", tplQ:"Replace the board with this template?", size:(w,h)=>`${w} × ${h} m`, map:"Map", bring:"Bring from the map (60 m around)", send:"Send selection to the map", sent:n=>`${n} sent to the map as proposals`, nothingNear:"Nothing on the map within 60 m", brought:n=>`${n} items placed at true scale`, measure:"Measure", tape:"Tape measure (draw an arrow)", tapeOn:"Tape on: draw arrows, each shows its length", labelIt:"Label size of selection", calib:"Set scale from a photo", calibPick:"Select the photo first", calibDist:"Real distance between the two points (m)", calibTap:"Now tap the two points on the photo", calibDone:"Photo scaled", lock:"Walk mode (lock)", unlock:"Unlock", ficha:"Symbol", tag:"Tag / name", state:"State", open:"open", closed:"closed", on:"on", off:"off", note:"Note", reading:"Reading", capacity:"Capacity (m³)", record:"Record in the item timeline", recorded:"Recorded", apply:"Apply", area:"A"}
: {board:"Quadro", open:"Abrir quadro", save:"Guardar", saved:"Guardado", saving:"A guardar…", draft:"rascunho local", viewOnly:"só leitura — entra para editar", templates:"Modelos", photos:"Fotos", aerial:"Foto aérea", link:"Ligar a item", history:"Versões", close:"Fechar",
  scale:"1 quadrado = 1 m", noPhotos:"Este item ainda não tem fotos.", addPhoto:"Juntar foto", insert:"Toca numa foto para a pôr no quadro", pick:"Para que item aponta? Escreve para procurar", none:"nada encontrado", linked:"Ligado", selectFirst:"Seleciona primeiro uma forma", unsaved:"Há alterações por guardar. Guardar antes de fechar?", versionOf:"Versão", restore:"Repor esta versão", restored:"Reposta como nova versão", loading:"A carregar o quadro…", queued:"Sem rede — guardado neste aparelho, envia depois", err:"Não consegui guardar", aerialBusy:"A buscar a foto aérea…", tplQ:"Substituir o quadro por este modelo?", size:(w,h)=>`${w} × ${h} m`, map:"Mapa", bring:"Trazer do mapa (60 m à volta)", send:"Enviar seleção para o mapa", sent:n=>`${n} enviados para o mapa como propostas`, nothingNear:"Nada no mapa a menos de 60 m", brought:n=>`${n} itens colocados à escala`, measure:"Medir", tape:"Fita métrica (desenha uma seta)", tapeOn:"Fita ligada: desenha setas, cada uma mostra o comprimento", labelIt:"Etiquetar medida da seleção", calib:"Escala a partir de uma foto", calibPick:"Seleciona primeiro a foto", calibDist:"Distância real entre os dois pontos (m)", calibTap:"Agora toca nos dois pontos da foto", calibDone:"Foto posta à escala", lock:"Modo de passeio (bloquear)", unlock:"Desbloquear", ficha:"Símbolo", tag:"Tag / nome", state:"Estado", open:"aberta", closed:"fechada", on:"ligada", off:"desligada", note:"Nota", reading:"Leitura", capacity:"Capacidade (m³)", record:"Registar na linha do tempo do item", recorded:"Registado", apply:"Aplicar", area:"A"};
const auth = () => window.edrAuth || {key:"", role:"viewer", actor:""};
const say = m => window.toast && toast(m);
const S = {fid:null, name:"", ll:null, mount:null, api:null, ui:null, version:0, dirty:false, lastSaved:0, files:{}, fileUrls:{}, versions:[], viewOnly:false, timer:null};

const css = document.createElement("style"); css.textContent = `
#qboard{position:fixed;inset:0;z-index:7000;background:#f1e9d8;display:none;flex-direction:column}
#qboard.on{display:flex}
#qboard .qhd{height:52px;display:flex;align-items:center;gap:8px;padding:0 10px;background:#1c1813;color:#f1e9d8;font:600 13px var(--ui);flex:0 0 auto}
#qboard .qhd .ttl{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px} #qboard .qhd .ttl small{display:block;font:500 11px var(--mono);opacity:.65}
#qboard .qhd button{height:36px;border-radius:18px;border:1px solid rgba(241,233,216,.25);background:transparent;color:#f1e9d8;font:600 12px var(--ui);padding:0 12px;cursor:pointer;white-space:nowrap}
#qboard .qhd button.ok{background:#c9a227;color:#1c1813;border-color:#c9a227} #qboard .qhd button.on{border-color:#c9a227;color:#c9a227} #qboard .qhd button:disabled{opacity:.4}
#qboard .qhd .st{font:600 11px var(--mono);opacity:.75;white-space:nowrap} #qboard .qhd .st.dirty{color:#e07b39;opacity:1}
#qboard .qbody{flex:1;position:relative;min-height:0;display:flex}
#qboard .qcanvas{flex:1;position:relative;min-width:0}
#qboard .qcanvas .excalidraw{--color-primary:#c9a227;--color-primary-darker:#a8861d;--color-primary-darkest:#8a6d12;--color-primary-light:#f3e7bf;--color-surface-primary-container:#f8f3e6;--default-bg-color:#fbf8f1}
#qboard .qtray{width:300px;max-width:42vw;background:#1c1813;color:#f1e9d8;display:none;flex-direction:column;border-left:1px solid rgba(241,233,216,.15)} #qboard .qtray.on{display:flex}
#qboard .qtray .th{padding:12px 14px 8px;font:700 13px var(--ui);display:flex;justify-content:space-between;align-items:center} #qboard .qtray .th button{height:32px;border-radius:16px;border:1px solid rgba(241,233,216,.25);background:transparent;color:#f1e9d8;font:600 12px var(--ui);padding:0 10px;cursor:pointer}
#qboard .qtray .hint{padding:0 14px 8px;font:500 11.5px var(--ui);opacity:.7}
#qboard .qtray .grid{overflow-y:auto;padding:0 10px 12px;display:grid;grid-template-columns:1fr 1fr;gap:8px} #qboard .qtray .grid img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px;cursor:pointer;border:2px solid transparent} #qboard .qtray .grid img:hover{border-color:#c9a227}
#qboard .qtray .list{overflow-y:auto;padding:0 10px 12px;display:flex;flex-direction:column;gap:6px} #qboard .qtray .list button{text-align:left;border:1px solid rgba(241,233,216,.15);background:rgba(255,255,255,.04);color:#f1e9d8;border-radius:10px;padding:10px 12px;font:500 13px var(--ui);cursor:pointer;min-height:48px} #qboard .qtray .list button:hover{border-color:#c9a227} #qboard .qtray .list button small{display:block;font:500 11px var(--mono);opacity:.6;margin-top:2px}
#qboard .qtray input{margin:0 10px 8px;height:40px;border-radius:10px;border:1px solid rgba(241,233,216,.2);background:rgba(0,0,0,.3);color:#f1e9d8;padding:0 12px;font:500 14px var(--ui)}
#qboard .qscale{position:absolute;left:50%;transform:translateX(-50%);bottom:14px;z-index:5;background:rgba(28,24,19,.86);color:#f1e9d8;border-radius:10px;padding:6px 10px;font:600 11px var(--mono);pointer-events:none}
#qboard .qload{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(241,233,216,.9);font:600 14px var(--ui);color:#1c1813;z-index:6}
.qcover{position:relative;border-radius:12px;overflow:hidden;margin:6px 0 8px;cursor:pointer;background:#2a241d;aspect-ratio:16/9} .qcover img{width:100%;height:100%;object-fit:cover;display:block} .qcover span{position:absolute;left:10px;bottom:8px;background:rgba(28,24,19,.85);color:#f1e9d8;border-radius:999px;padding:4px 10px;font:700 11px var(--ui)}
#qboard .ficha{padding:0 14px 14px;display:flex;flex-direction:column;gap:10px} #qboard .ficha label{display:flex;flex-direction:column;gap:4px;font:600 11px var(--ui);opacity:.9} #qboard .ficha input,#qboard .ficha textarea{height:40px;border-radius:10px;border:1px solid rgba(241,233,216,.2);background:rgba(0,0,0,.3);color:#f1e9d8;padding:0 12px;font:500 14px var(--ui)} #qboard .ficha textarea{height:auto;padding:10px 12px}
#qboard .ficha .row{display:flex;gap:6px} #qboard .ficha .row input{flex:1} #qboard .ficha button{min-height:40px;border-radius:10px;border:1px solid rgba(241,233,216,.25);background:transparent;color:#f1e9d8;font:600 13px var(--ui);padding:0 12px;cursor:pointer} #qboard .ficha button.ok{background:#c9a227;color:#1c1813;border-color:#c9a227;min-height:46px}
#qboard .seg{display:flex;gap:6px} #qboard .seg button{flex:1} #qboard .seg button.on{background:#5be0a0;color:#0b1a20;border-color:#5be0a0}
#qboard .excalidraw{--default-button-size:2.5rem} @media (pointer:coarse){ #qboard .excalidraw{--default-button-size:3rem;--default-icon-size:1.2rem} #qboard .qtray .list button{min-height:52px} }
@media (max-width:700px){ #qboard .qtray{position:absolute;left:0;right:0;bottom:0;top:auto;width:auto;max-width:none;max-height:58vh;border-left:0;border-top:1px solid rgba(241,233,216,.2);border-radius:16px 16px 0 0;box-shadow:0 -10px 30px rgba(0,0,0,.45);z-index:7} #qboard .qtray .grid{grid-template-columns:repeat(3,1fr)} #qboard .qscale{bottom:96px;left:12px;transform:none;font-size:10px} }

@media (max-width:700px){ #qboard .qhd{height:48px;gap:6px;padding:0 6px} #qboard .qhd button{padding:0 9px;font-size:12px;min-width:38px} #qboard .qhd .lb{display:none} #qboard .qhd .ttl small{display:none} }`;
document.head.appendChild(css);

/* ---------- loading the engine (once) ---------- */
let libP = null;
function loadLib(){
  if(window.EdrBoardLib) return Promise.resolve();
  if(libP) return libP;
  window.EXCALIDRAW_ASSET_PATH = new URL(V, location.href).href;   // must be an absolute URL: Excalidraw builds font URLs from it
  libP = new Promise((res, rej) => {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = V + "board.css"; document.head.appendChild(l);
    const s = document.createElement("script"); s.src = V + "board.js"; s.onload = () => res(); s.onerror = () => rej(new Error("board.js")); document.head.appendChild(s);
  });
  return libP;
}
const skelCache = {};
async function skel(name){ if(skelCache[name]) return skelCache[name]; const d = await fetch(V + name + ".json").then(r => r.json()); skelCache[name] = d; return d; }

/* ---------- storage: the item's media store ---------- */
async function itemMedia(fid){ try{ const d = await fetch(`${API}/item/${encodeURIComponent(fid)}`).then(r => r.json()); return d.media || []; }catch(e){ return []; } }
const isBoardFile = m => /^\[quadro\]/.test(m.caption || "");
const isSnap = m => /^\[quadro-snap\]/.test(m.caption || "");
const isBoardImg = m => /^\[quadro-img\]/.test(m.caption || "");
const verOf = m => +((m.caption || "").match(/v(\d+)/) || [0, 0])[1];
async function listVersions(fid){ const media = await itemMedia(fid); S.versions = media.filter(isBoardFile).sort((a, b) => verOf(b) - verOf(a)); S.snaps = media.filter(isSnap); return S.versions; }
async function loadVersion(m){ const d = await fetch(`${API}/media/${m.id}`).then(r => r.json()); return d; }
const draftKey = fid => "edr_qb_" + fid;
function saveDraft(){ try{ if(!S.api) return; const d = serialize(); d.at = Date.now(); d.version = S.version; localStorage.setItem(draftKey(S.fid), JSON.stringify(d)); }catch(e){} }
function readDraft(fid){ try{ return JSON.parse(localStorage.getItem(draftKey(fid)) || "null"); }catch(e){ return null; } }
function dropDraft(fid){ try{ localStorage.removeItem(draftKey(fid)); }catch(e){} }

function serialize(){
  const api = S.api; const els = api.getSceneElements(); const st = api.getAppState(); const files = api.getFiles();
  const used = new Set(els.filter(e => e.type === "image" && e.fileId).map(e => e.fileId));
  const outFiles = {}; for(const id of used){ const f = files[id]; if(!f) continue; outFiles[id] = {mimeType:f.mimeType, url:S.fileUrls[id] || null, dataURL:S.fileUrls[id] ? null : f.dataURL}; }
  return {type:"edr-board", v:1, fid:S.fid, geo:S.geo, elements:els, appState:{viewBackgroundColor:st.viewBackgroundColor, gridSize:st.gridSize, gridStep:st.gridStep, gridModeEnabled:st.gridModeEnabled, scrollX:st.scrollX, scrollY:st.scrollY, zoom:st.zoom}, files:outFiles};
}
async function blobToDataURL(b){ return new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); }
async function dataURLToBlob(u){ return (await fetch(u)).blob(); }
/** upload any image the board holds that is not yet in the media store; returns a url map */
async function uploadImages(){
  const files = S.api.getFiles(); const els = S.api.getSceneElements(); const used = new Set(els.filter(e => e.type === "image" && e.fileId).map(e => e.fileId));
  for(const id of used){ if(S.fileUrls[id] || !files[id]) continue;
    try{ const blob = await dataURLToBlob(files[id].dataURL); const d = await edrUpload(blob, {feature_id:S.fid, caption:"[quadro-img] " + id, actor:auth().actor, lat:S.ll && S.ll.lat, lon:S.ll && S.ll.lng}); if(d && d.id) S.fileUrls[id] = `${API}/media/${d.id}`; }catch(e){ /* stays inline in the JSON this time */ } }
}
async function save(explicit){
  if(!S.api || S.viewOnly) return false; const a = auth(); if(!a.key){ say(T.viewOnly); return false; }
  setStatus(T.saving); await uploadImages();
  const n = S.version + 1; const data = serialize(); data.version = n; data.by = a.actor; data.at = new Date().toISOString(); data.name = S.name;
  const json = new Blob([JSON.stringify(data)], {type:"application/json"});
  const params = {feature_id:S.fid, caption:`[quadro] v${n}`, actor:a.actor, lat:S.ll && S.ll.lat, lon:S.ll && S.ll.lng};
  let snap = null; try{ snap = await EdrBoardLib.exportToBlob({elements:S.api.getSceneElements(), appState:{...S.api.getAppState(), exportBackground:true, exportWithDarkMode:false}, files:S.api.getFiles(), mimeType:"image/jpeg", quality:0.82, maxWidthOrHeight:1400, exportPadding:24}); }catch(e){}
  try{
    await edrUpload(json, params); if(snap) await edrUpload(snap, {feature_id:S.fid, caption:`[quadro-snap] v${n}`, actor:a.actor, lat:S.ll && S.ll.lat, lon:S.ll && S.ll.lng, w:1400});
    S.version = n; S.dirty = false; S.lastSaved = Date.now(); dropDraft(S.fid); setStatus(`${T.saved} · v${n}`); if(explicit) say(`${T.saved} · ${T.versionOf} ${n}`); document.dispatchEvent(new CustomEvent("edr-board-saved", {detail:{fid:S.fid, version:n}})); return true;
  }catch(e){
    try{ await edrQueuePhoto(json, params); if(snap) await edrQueuePhoto(snap, {feature_id:S.fid, caption:`[quadro-snap] v${n}`, actor:a.actor, w:1400}); S.version = n; S.dirty = false; dropDraft(S.fid); setStatus(`${T.queued} · v${n}`); say(T.queued); return true; }
    catch(e2){ setStatus(T.err); say(T.err); saveDraft(); return false; }
  }
}
function setStatus(s, dirty){ const el = S.ui && S.ui.querySelector(".st"); if(el){ el.textContent = s; el.classList.toggle("dirty", !!dirty); } }

/* ---------- restoring a board into the engine ---------- */
async function hydrate(data){
  const files = []; S.fileUrls = {};
  for(const [id, f] of Object.entries(data.files || {})){
    try{ let dataURL = f.dataURL; if(!dataURL && f.url){ dataURL = await blobToDataURL(await (await fetch(f.url)).blob()); S.fileUrls[id] = f.url; } if(dataURL) files.push({id, dataURL, mimeType:f.mimeType || "image/jpeg", created:Date.now()}); }catch(e){}
  }
  const els = EdrBoardLib.restoreElements(data.elements || [], null);
  return {elements:els, appState:{...defaultsState(), ...(data.appState || {})}, files};
}
function defaultsState(){ return {viewBackgroundColor:"#fbf8f1", gridSize:GRID, gridStep:5, gridModeEnabled:true, objectsSnapModeEnabled:true, currentItemRoughness:0, currentItemStrokeWidth:2, currentItemFontFamily:2, currentItemRoundness:"sharp", currentItemStrokeColor:"#1c1813", currentItemBackgroundColor:"transparent", zenModeEnabled:false}; }

/* ---------- the estate library ---------- */
async function installLibrary(){
  try{ const lib = await skel("edenrise-library"); const items = lib.items.map((it, i) => ({id:"edr-" + i, status:"published", created:Date.now(), name:it.name, elements:EdrBoardLib.convertToExcalidrawElements(it.elements)}));
    await S.api.updateLibrary({libraryItems:items, merge:false, openLibraryMenu:false}); }catch(e){ console.warn("library", e); }
}
async function applyTemplate(id){
  const t = (await skel("edenrise-templates")).templates.find(x => x.id === id); if(!t) return;
  if(S.api.getSceneElements().length && !confirm(T.tplQ)) return;
  const els = EdrBoardLib.convertToExcalidrawElements(t.elements); S.api.updateScene({elements:els}); S.api.scrollToContent(els, {fitToContent:true, viewportZoomFactor:0.8}); markDirty();
}

/* ---------- photos tray, links, aerial ---------- */
async function insertImage(url, caption){
  try{ const blob = await (await fetch(url)).blob(); const dataURL = await blobToDataURL(blob); const id = "ph-" + Math.random().toString(36).slice(2, 10);
    const dims = await new Promise(r => { const im = new Image(); im.onload = () => r([im.width, im.height]); im.onerror = () => r([400, 300]); im.src = dataURL; });
    const st = S.api.getAppState(); const cx = (st.width / 2 - st.scrollX) / st.zoom.value, cy = (st.height / 2 - st.scrollY) / st.zoom.value; const w = 320, h = Math.round(w * dims[1] / dims[0]);
    S.api.addFiles([{id, dataURL, mimeType:blob.type || "image/jpeg", created:Date.now()}]); S.fileUrls[id] = url;
    const el = EdrBoardLib.convertToExcalidrawElements([{type:"image", fileId:id, x:cx - w / 2, y:cy - h / 2, width:w, height:h}])[0];
    S.api.updateScene({elements:[...S.api.getSceneElements(), el]}); markDirty(); }catch(e){ say(T.err); }
}
async function openPhotos(){
  const tray = S.ui.querySelector(".qtray"); tray.classList.add("on"); tray.innerHTML = `<div class="th"><span>${T.photos}</span><span><button data-add>📷 ${T.addPhoto}</button> <button data-x>✕</button></span></div><div class="hint">${T.insert}</div><div class="grid"></div>`;
  tray.querySelector("[data-x]").onclick = () => tray.classList.remove("on");
  tray.querySelector("[data-add]").onclick = () => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.setAttribute("capture", "environment"); inp.onchange = async () => { const f = inp.files[0]; if(!f) return; const dataURL = await blobToDataURL(f); await insertImage(dataURL, f.name); }; inp.click(); };
  const media = (await itemMedia(S.fid)).filter(m => m.kind === "foto" && !isSnap(m) && !isBoardImg(m));
  const g = tray.querySelector(".grid"); g.innerHTML = media.length ? media.map(m => `<img loading="lazy" src="${API}/media/${m.id}" title="${(m.caption || "").replace(/"/g, "&quot;")}" data-u="${API}/media/${m.id}">`).join("") : `<div class="hint">${T.noPhotos}</div>`;
  g.querySelectorAll("img").forEach(im => im.onclick = () => insertImage(im.dataset.u, im.title));
}
function candidates(q){
  q = (q || "").toLowerCase(); const out = [];
  try{ for(const f of (window.edrEdit && edrEdit.feats ? edrEdit.feats() : [])){ const p = f.properties || {}; const n = String(p.name || p.preset || p.id); if(!q || n.toLowerCase().includes(q)) out.push({ref:"id:" + p.id, name:n, sub:(p.preset || "") + " · " + (p.status || "")}); } }catch(e){}
  try{ if(typeof DATA !== "undefined") for(const t in DATA){ const fc = DATA[t]; if(!fc || !fc.features) continue; for(const f of fc.features){ const p = f.properties || {}; const n = String(p.name || p.asset_id || ""); if(!n) continue; if(!q || n.toLowerCase().includes(q) || t.includes(q)) out.push({ref:"core:" + t + ":" + n, name:n, sub:(typeof title_i18n === "function" ? title_i18n(t, t) : t)}); if(out.length > 300) break; } } }catch(e){}
  return out.slice(0, 40);
}
function openLink(){
  const sel = Object.keys(S.api.getAppState().selectedElementIds || {}); if(!sel.length){ say(T.selectFirst); return; }
  const tray = S.ui.querySelector(".qtray"); tray.classList.add("on"); tray.innerHTML = `<div class="th"><span>${T.link}</span><button data-x>✕</button></div><div class="hint">${T.pick}</div><input placeholder="…"><div class="list"></div>`;
  tray.querySelector("[data-x]").onclick = () => tray.classList.remove("on"); const inp = tray.querySelector("input"), list = tray.querySelector(".list");
  const paint = () => { const c = candidates(inp.value); list.innerHTML = c.length ? c.map((x, i) => `<button data-i="${i}">${x.name.replace(/</g, "&lt;")}<small>${x.sub}</small></button>`).join("") : `<div class="hint">${T.none}</div>`;
    list.querySelectorAll("button").forEach(b => b.onclick = () => { const x = c[+b.dataset.i]; const link = "#item=" + encodeURIComponent(x.ref);
      const els = S.api.getSceneElements().map(e => sel.includes(e.id) ? {...e, link} : e); S.api.updateScene({elements:els}); markDirty(); tray.classList.remove("on"); say(`${T.linked}: ${x.name}`); }); };
  inp.oninput = paint; paint(); inp.focus();
}
function followLink(link){
  const m = /^#item=(.+)$/.exec(link || ""); if(!m){ window.open(link, "_blank"); return; }
  const ref = decodeURIComponent(m[1]); close(true);
  if(ref.startsWith("id:")){ const id = ref.slice(3); if(window.edrEdit && edrEdit.openById && edrEdit.openById(id)) return; say(T.none); return; }
  if(ref.startsWith("core:")){ const [, t, name] = ref.split(":"); try{ const fc = DATA[t]; const f = fc.features.find(x => String((x.properties || {}).name || (x.properties || {}).asset_id) === name); if(f && window.showCard){ const c = window.turf ? turf.centroid(f).geometry.coordinates : null; showCard(f.properties, c ? L.latLng(c[1], c[0]) : null, (typeof title_i18n === "function" ? title_i18n(t, t) : t), t); return; } }catch(e){} say(T.none); }
}
/** the real aerial photo under the drawing, at board scale (GRID px = 1 m), locked at 60 % so lines stay readable */
async function addAerial(){
  if(!S.ll || typeof SITE === "undefined" || !SITE.tiles || !SITE.tiles.ortho){ say(T.none); return; }
  say(T.aerialBusy); const z = 20, span = 80; const lat = S.ll.lat, lon = S.ll.lng; const mpp = 156543.03392 * Math.cos(lat * Math.PI / 180) / 2 ** z;
  const n = 2 ** z; const xf = (lon + 180) / 360 * n, yf = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n;
  const half = span / 2 / mpp / 256; const x0 = Math.floor(xf - half), x1 = Math.floor(xf + half), y0 = Math.floor(yf - half), y1 = Math.floor(yf + half);
  const c = document.createElement("canvas"); c.width = (x1 - x0 + 1) * 256; c.height = (y1 - y0 + 1) * 256; const g = c.getContext("2d"); let ok = 0;
  await Promise.all([].concat(...Array.from({length:x1 - x0 + 1}, (_, i) => Array.from({length:y1 - y0 + 1}, (_, j) => new Promise(r => { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => { g.drawImage(im, i * 256, j * 256); ok++; r(); }; im.onerror = () => r(); im.src = `${SITE.tiles.ortho}/${z}/${x0 + i}/${y0 + j}.jpg`; })))));
  if(!ok){ say(T.none); return; }
  // crop to the span centred on the item, then scale so GRID px = 1 m
  const px = span / mpp; const sx = (xf - x0) * 256 - px / 2, sy = (yf - y0) * 256 - px / 2; const out = document.createElement("canvas"); const side = Math.round(span * GRID); out.width = out.height = side;
  out.getContext("2d").drawImage(c, sx, sy, px, px, 0, 0, side, side); const dataURL = out.toDataURL("image/jpeg", .85); const id = "aer-" + Date.now().toString(36);
  S.api.addFiles([{id, dataURL, mimeType:"image/jpeg", created:Date.now()}]);
  const els = EdrBoardLib.convertToExcalidrawElements([{type:"image", fileId:id, x:-side / 2, y:-side / 2, width:side, height:side, opacity:60, locked:true},
    {type:"line", x:-side / 2 + 20, y:side / 2 - 30, points:[[0, 0], [10 * GRID, 0]], strokeColor:"#1c1813", strokeWidth:3, roughness:0}, {type:"text", x:-side / 2 + 20, y:side / 2 - 58, text:"10 m", fontSize:14, fontFamily:2}]);
  S.api.updateScene({elements:[...els, ...S.api.getSceneElements()]}); S.api.scrollToContent(els, {fitToContent:true}); markDirty();
}

/* ---------- history ---------- */
async function openHistory(){
  const tray = S.ui.querySelector(".qtray"); tray.classList.add("on"); tray.innerHTML = `<div class="th"><span>${T.history}</span><button data-x>✕</button></div><div class="list"><div class="hint">…</div></div>`;
  tray.querySelector("[data-x]").onclick = () => tray.classList.remove("on");
  const vs = await listVersions(S.fid); const list = tray.querySelector(".list");
  list.innerHTML = vs.length ? vs.map((m, i) => `<button data-i="${i}">${T.versionOf} ${verOf(m)}${verOf(m) === S.version ? " · ✓" : ""}<small>${String(m.at || "").slice(0, 16).replace("T", " ")} · ${m.by || ""}</small></button>`).join("") : `<div class="hint">${T.none}</div>`;
  list.querySelectorAll("button").forEach(b => b.onclick = async () => { const m = vs[+b.dataset.i]; if(verOf(m) === S.version) return; if(S.dirty && !confirm(T.unsaved + " (" + T.restore + ")")) return;
    try{ const d = await loadVersion(m); const sc = await hydrate(d); S.api.updateScene({elements:sc.elements, appState:sc.appState}); S.api.addFiles(sc.files); S.api.scrollToContent(sc.elements, {fitToContent:true}); markDirty(); tray.classList.remove("on"); say(`${T.versionOf} ${verOf(m)} → ${T.save}`); }catch(e){ say(T.err); } });
}

/* ---------- ui ---------- */
function markDirty(){ S.dirty = true; setStatus(T.draft, true); clearTimeout(S.timer); S.timer = setTimeout(saveDraft, 1500); }
function build(){
  const ui = document.createElement("div"); ui.id = "qboard"; ui.setAttribute("role", "dialog"); ui.setAttribute("aria-label", T.board);
  ui.innerHTML = `<div class="qhd"><button data-a="close" aria-label="${T.close}">← ${T.close}</button><div class="ttl"><span class="nm"></span><small class="st"></small></div>
      <button data-a="tpl" title="${T.templates}">▦<span class="lb"> ${T.templates}</span></button><button data-a="photos" title="${T.photos}">📷<span class="lb"> ${T.photos}</span></button><button data-a="aerial" title="${T.aerial}">🛰<span class="lb"> ${T.aerial}</span></button><button data-a="map" title="${T.map}">🗺<span class="lb"> ${T.map}</span></button><button data-a="measure" title="${T.measure}">📏<span class="lb"> ${T.measure}</span></button><button data-a="link" title="${T.link}">🔗<span class="lb"> ${T.link}</span></button><button data-a="lock" title="${T.lock}">🔓</button><button data-a="hist" title="${T.history}">🕘<span class="lb"> ${T.history}</span></button><button data-a="save" class="ok">${T.save}</button></div>
    <div class="qbody"><div class="qcanvas"><div class="qmount" style="position:absolute;inset:0"></div><div class="qscale">${T.scale}</div><div class="qload">${T.loading}</div></div><div class="qtray"></div></div>`;
  document.body.appendChild(ui);
  ui.querySelector(".qhd").addEventListener("click", async e => { const b = e.target.closest("button[data-a]"); if(!b) return; const a = b.dataset.a;
    if(a === "close") return close(); if(a === "save") return save(true); if(a === "map") return openMapMenu(); if(a === "measure") return openMeasureMenu(); if(a === "lock") return toggleLock(b); if(a === "photos") return openPhotos(); if(a === "link") return openLink(); if(a === "aerial") return addAerial(); if(a === "hist") return openHistory();
    if(a === "tpl"){ const tray = ui.querySelector(".qtray"); tray.classList.add("on"); const t = await skel("edenrise-templates");
      tray.innerHTML = `<div class="th"><span>${T.templates}</span><button data-x>✕</button></div><div class="list">${t.templates.map(x => `<button data-t="${x.id}">${EN ? x.en : x.name}</button>`).join("")}</div>`;
      tray.querySelector("[data-x]").onclick = () => tray.classList.remove("on"); tray.querySelectorAll("[data-t]").forEach(bb => bb.onclick = () => { applyTemplate(bb.dataset.t); tray.classList.remove("on"); }); } });
  document.addEventListener("keydown", e => { if(e.key === "Escape" && ui.classList.contains("on") && !ui.querySelector(".qtray.on")) { /* Excalidraw uses Escape itself; close only via the button */ } });
  return ui;
}
function sizeBadge(els, st){
  const badge = S.ui.querySelector(".qscale"); const ids = Object.keys(st.selectedElementIds || {});
  if(ids.length === 1){ const e = els.find(x => x.id === ids[0]); if(e && e.width != null){ const a = areaOf(e); const ln = lengthOf(e); badge.textContent = `${T.size((e.width / GRID).toFixed(1), (e.height / GRID).toFixed(1))}${a != null && a >= 0.05 ? ` · ${T.area} = ${a.toFixed(1)} m²` : ln != null ? ` · ${ln.toFixed(1)} m` : ""}`; return; } }
  if(ids.length > 1){ const sel = els.filter(x => ids.includes(x.id)); const xs = sel.flatMap(e => [e.x, e.x + e.width]), ys = sel.flatMap(e => [e.y, e.y + e.height]); badge.textContent = `${T.size(((Math.max(...xs) - Math.min(...xs)) / GRID).toFixed(1), ((Math.max(...ys) - Math.min(...ys)) / GRID).toFixed(1))} · ${ids.length}`; return; }
  badge.textContent = T.scale;
}

async function open(fid, opts){
  opts = opts || {}; if(!S.ui) S.ui = build(); S.fid = fid; S.name = opts.name || fid; S.ll = opts.latlng || null; S.viewOnly = !auth().key || auth().role === "viewer"; S.dirty = false; S.version = 0; S.fileUrls = {};
  S.ui.classList.add("on"); S.ui.querySelector(".nm").textContent = `${T.board} · ${S.name}`; setStatus(T.loading); S.ui.querySelector(".qload").style.display = "flex"; S.ui.querySelector(".qtray").classList.remove("on");
  S.ui.querySelectorAll('[data-a="save"],[data-a="tpl"],[data-a="photos"],[data-a="aerial"],[data-a="link"]').forEach(b => b.disabled = S.viewOnly);
  try{ await loadLib(); }catch(e){ say(T.err); close(true); return; }
  // what to show: the newest server version, unless a newer local draft exists
  let data = null; const vs = await listVersions(fid); if(vs.length){ try{ data = await loadVersion(vs[0]); S.version = verOf(vs[0]); }catch(e){} }
  const draft = readDraft(fid); if(draft && (!data || (draft.version || 0) >= S.version) && draft.elements && draft.elements.length){ data = draft; S.dirty = true; }
  S.geo = (data && data.geo) || (S.ll ? {lat:S.ll.lat, lon:S.ll.lng, ppm:GRID} : null); S.tape = false; S.calib = null; S.known = new Set();
  const scene = data ? await hydrate(data) : {elements:[], appState:defaultsState(), files:[]};
  if(S.mount){ try{ S.mount.unmount(); }catch(e){} } const host = S.ui.querySelector(".qmount"); host.innerHTML = "";
  S.mount = EdrBoardLib.mount(host, {initialData:{elements:scene.elements, appState:scene.appState, files:scene.files, scrollToContent:true}, lang:EN ? "en" : "pt-PT", viewMode:S.viewOnly, name:S.name, welcomeTitle:`${T.board} · ${S.name}`,
    onChange:(els, st) => { if(!S.api) return; sizeBadge(els, st); watchSelection(els, st); const v = EdrBoardLib.getSceneVersion(els); if(S.lastV != null && v !== S.lastV){ if(!S.viewOnly) markDirty(); tapeWatch(els); } S.lastV = v; },
    onLinkOpen:followLink});
  S.api = await S.mount.ready(); await new Promise(r => setTimeout(r, 300));   // the engine applies initialData asynchronously; defaults go in after it settles
  if(scene.elements.length) S.api.scrollToContent(scene.elements, {fitToContent:true, viewportZoomFactor:0.8});
  const d0 = defaultsState(); const saved = (data && data.appState) || {}; S.api.updateScene({appState:{...d0, gridModeEnabled:saved.gridModeEnabled != null ? saved.gridModeEnabled : true, gridSize:saved.gridSize || GRID, viewBackgroundColor:saved.viewBackgroundColor || d0.viewBackgroundColor}}); S.lastV = EdrBoardLib.getSceneVersion(S.api.getSceneElements());
  S.ui.querySelector(".qload").style.display = "none"; setStatus(S.viewOnly ? T.viewOnly : (S.dirty ? T.draft : (S.version ? `${T.saved} · v${S.version}` : "")), S.dirty);
  if(!S.viewOnly) installLibrary();
}
async function close(force){
  if(!force && S.dirty && !S.viewOnly){ if(confirm(T.unsaved)){ const ok = await save(true); if(!ok) return; } else saveDraft(); }
  if(S.ui) S.ui.classList.remove("on"); if(S.mount){ try{ S.mount.unmount(); }catch(e){} S.mount = null; } S.api = null;
}
/* ---------- geometry helpers (board px ↔ metres ↔ lon/lat) ---------- */
function rotPt(px, py, cx, cy, a){ if(!a) return [px, py]; const c = Math.cos(a), s = Math.sin(a); return [cx + (px - cx) * c - (py - cy) * s, cy + (px - cx) * s + (py - cy) * c]; }
function outline(e){   // absolute points of an element's outline (px), closed when it is an area
  const cx = e.x + e.width / 2, cy = e.y + e.height / 2;
  if(e.type === "rectangle" || e.type === "image" || e.type === "diamond" || e.type === "text"){ const r = [[e.x, e.y], [e.x + e.width, e.y], [e.x + e.width, e.y + e.height], [e.x, e.y + e.height]]; return {pts:r.map(p => rotPt(p[0], p[1], cx, cy, e.angle)), closed:true}; }
  if(e.type === "ellipse"){ const pts = []; for(let i = 0; i < 36; i++){ const t = i / 36 * Math.PI * 2; pts.push(rotPt(cx + Math.cos(t) * e.width / 2, cy + Math.sin(t) * e.height / 2, cx, cy, e.angle)); } return {pts, closed:true}; }
  if(e.type === "line" || e.type === "arrow" || e.type === "freedraw"){ const pts = (e.points || []).map(p => rotPt(e.x + p[0], e.y + p[1], cx, cy, e.angle)); const closed = e.type === "line" && pts.length > 2 && (e.polygon || Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 2); return {pts, closed}; }
  return null;
}
function lengthOf(e){ if(!/^(line|arrow|freedraw)$/.test(e.type)) return null; const o = outline(e); if(!o) return null; let L = 0; for(let i = 1; i < o.pts.length; i++) L += Math.hypot(o.pts[i][0] - o.pts[i - 1][0], o.pts[i][1] - o.pts[i - 1][1]); return L / GRID; }
function areaOf(e){ const o = outline(e); if(!o || !o.closed || e.type === "text" || e.type === "image") return null; const p = o.pts; let a = 0; for(let i = 0; i < p.length; i++){ const j = (i + 1) % p.length; a += p[i][0] * p[j][1] - p[j][0] * p[i][1]; } return Math.abs(a) / 2 / GRID / GRID; }
const scaleAt = lat => ({kx:111320 * Math.cos(lat * Math.PI / 180), ky:110540});
function toLL(x, y){ const g = S.geo; const {kx, ky} = scaleAt(g.lat); return [g.lat - y / g.ppm / ky, g.lon + x / g.ppm / kx]; }   // y grows south
function toBoard(lat, lon){ const g = S.geo; const {kx, ky} = scaleAt(g.lat); return [(lon - g.lon) * kx * g.ppm, -(lat - g.lat) * ky * g.ppm]; }

/* ---------- board → map: the selection becomes proposals at metre accuracy ---------- */
function elementToGeometry(e){
  const o = outline(e); if(!o || e.type === "text" || e.type === "image") return null;
  const ring = o.pts.map(p => { const ll = toLL(p[0], p[1]); return [ll[1], ll[0]]; });
  if(o.closed && ring.length >= 3){ if(ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) ring.push(ring[0]); return {type:"Polygon", coordinates:[ring]}; }
  if(ring.length >= 2) return {type:"LineString", coordinates:ring};
  return null;
}
function labelOfGroup(e, els){ const t = els.find(x => x.type === "text" && ((x.containerId && x.containerId === e.id) || (e.groupIds && e.groupIds.length && x.groupIds && x.groupIds.some(g => e.groupIds.includes(g))))); return t ? t.text.split("\n")[0] : ""; }
async function sendToMap(){
  if(!S.geo){ say(T.nothingNear); return; } const st = S.api.getAppState(); const ids = Object.keys(st.selectedElementIds || {}); if(!ids.length){ say(T.selectFirst); return; }
  const els = S.api.getSceneElements(); const sel = els.filter(e => ids.includes(e.id) && !e.isDeleted); const shapes = sel.map(e => ({e, g:elementToGeometry(e)})).filter(x => x.g);
  if(!shapes.length){ say(T.selectFirst); return; }
  const note = (EN ? `Drawn on the board of ${S.name} (v${S.version || "draft"}) at 1 square = 1 m over the aerial photo.` : `Desenhado no quadro de ${S.name} (v${S.version || "rascunho"}) a 1 quadrado = 1 m sobre a foto aérea.`);
  if(shapes.length === 1 && window.edrEdit && edrEdit.handoff){
    const {e, g} = shapes[0]; const name = labelOfGroup(e, els) || (EN ? "From the board" : "Do quadro"); const ll = g.type === "Polygon" ? g.coordinates[0].map(c => [c[1], c[0]]) : g.coordinates.map(c => [c[1], c[0]]);
    const layer = g.type === "Polygon" ? L.polygon(ll) : L.polyline(ll); saveDraft(); close(true); edrEdit.handoff(layer, {layer:"propostas", preset:"outro", props:{name, note, board:S.fid}}); return;
  }
  if(!confirm(`${shapes.length} → ${T.map}?`)) return; const a = auth(); let n = 0; const cs = "cs_" + Date.now().toString(36);
  for(const {e, g} of shapes){ const name = labelOfGroup(e, els) || `${EN ? "Board" : "Quadro"} · ${e.type}`;
    try{ const r = await fetch(API + "/features", {method:"POST", headers:{"Content-Type":"application/json", ...(a.key ? {"X-Role-Key":a.key} : {})}, body:JSON.stringify({layer:"propostas", name, kind:"outro", geometry:g, props:{preset:"outro", board:S.fid, color:e.strokeColor}, note, actor:a.actor, changeset:cs, site:(typeof SITE_ID !== "undefined" ? SITE_ID : "edenrise")})}); if(r.ok) n++; }catch(err){} }
  say(T.sent(n)); if(window.edrEdit && edrEdit.reload) edrEdit.reload();
}
/* ---------- map → board: what the GIS knows around this item, placed at true scale ---------- */
function layerColour(key){ try{ for(const [, , layers] of GROUPS) for(const l of layers) if(l[0] === key) return l[3]; }catch(e){} return "#6b6157"; }
function featureToSkel(f, key, colour, ref){
  const g = f.geometry; if(!g) return [];
  const name = String((f.properties || {}).name || (f.properties || {}).asset_id || key); const link = "#item=" + encodeURIComponent(ref); const cd = {fromMap:ref};
  const toPts = coords => coords.map(c => toBoard(c[1], c[0]));
  const lineOf = (pts, closed, extra) => { const x0 = pts[0][0], y0 = pts[0][1]; return {type:"line", x:x0, y:y0, points:pts.map(p => [p[0] - x0, p[1] - y0]), strokeColor:colour, strokeWidth:closed ? 1.5 : 3, roughness:0, backgroundColor:closed ? colour : "transparent", fillStyle:"solid", opacity:closed ? 30 : 100, link, customData:cd, ...extra}; };
  if(g.type === "Point"){ const [x, y] = toBoard(g.coordinates[1], g.coordinates[0]); return [{type:"ellipse", x:x - 8, y:y - 8, width:16, height:16, strokeColor:colour, backgroundColor:colour, fillStyle:"solid", roughness:0, link, customData:cd}, {type:"text", x:x + 12, y:y - 8, text:name, fontSize:12, fontFamily:2, strokeColor:"#1c1813", customData:cd}]; }
  if(g.type === "LineString"){ const pts = toPts(g.coordinates); return [lineOf(pts, false), {type:"text", x:pts[0][0] + 6, y:pts[0][1] - 18, text:name, fontSize:11, fontFamily:2, strokeColor:colour, customData:cd}]; }
  if(g.type === "MultiLineString") return g.coordinates.flatMap(c => [lineOf(toPts(c), false)]);
  if(g.type === "Polygon"){ const pts = toPts(g.coordinates[0]); return [lineOf(pts, true), {type:"text", x:pts[0][0] + 6, y:pts[0][1] + 4, text:name, fontSize:11, fontFamily:2, strokeColor:colour, customData:cd}]; }
  if(g.type === "MultiPolygon") return g.coordinates.flatMap(poly => [lineOf(toPts(poly[0]), true)]);
  if(g.type === "MultiPoint") return g.coordinates.flatMap(c => featureToSkel({geometry:{type:"Point", coordinates:c}, properties:f.properties}, key, colour, ref));
  return [];
}
function within(f, R){ try{ const walk = c => typeof c[0] === "number" ? [c] : c.flatMap(walk); const pts = walk(f.geometry.coordinates); const {kx, ky} = scaleAt(S.geo.lat); return pts.some(c => Math.hypot((c[0] - S.geo.lon) * kx, (c[1] - S.geo.lat) * ky) <= R); }catch(e){ return false; } }
async function bringFromMap(){
  if(!S.geo){ say(T.nothingNear); return; } const R = 60; const have = new Set(S.api.getSceneElements().map(e => e.customData && e.customData.fromMap).filter(Boolean)); const skels = []; let n = 0;
  try{ for(const t in DATA){ const fc = DATA[t]; if(!fc || !fc.features) continue; const col = layerColour(t); for(const f of fc.features){ if(!within(f, R)) continue; const ref = "core:" + t + ":" + String((f.properties || {}).name || (f.properties || {}).asset_id || ""); if(have.has(ref)) continue; have.add(ref); skels.push(...featureToSkel(f, t, col, ref)); n++; } } }catch(e){}
  try{ for(const f of (window.edrEdit && edrEdit.feats ? edrEdit.feats() : [])){ if(!within(f, R)) continue; const p = f.properties || {}; const ref = "id:" + p.id; if(have.has(ref)) continue; have.add(ref); skels.push(...featureToSkel(f, "propostas", p.color || "#c9a227", ref)); n++; } }catch(e){}
  if(!n){ say(T.nothingNear); return; }
  const els = EdrBoardLib.convertToExcalidrawElements(skels); S.api.updateScene({elements:[...S.api.getSceneElements(), ...els]}); S.api.scrollToContent(els, {fitToContent:true, viewportZoomFactor:0.8}); markDirty(); say(T.brought(n));
}
function openMapMenu(){ menu(T.map, [[T.bring, bringFromMap], [T.send, sendToMap]]); }
function menu(title, items){ const tray = S.ui.querySelector(".qtray"); tray.classList.add("on"); delete tray.dataset.ficha; tray.innerHTML = `<div class="th"><span>${title}</span><button data-x>✕</button></div><div class="list">${items.map((it, i) => `<button data-i="${i}">${it[0]}</button>`).join("")}</div>`; tray.querySelector("[data-x]").onclick = () => tray.classList.remove("on"); tray.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { tray.classList.remove("on"); items[+b.dataset.i][1](); }); }

/* ---------- measuring ---------- */
function fmtM(v){ return v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2); }
function openMeasureMenu(){ menu(T.measure, [[S.tape ? "■ " + T.tape : T.tape, toggleTape], [T.labelIt, labelSelection], [T.calib, startCalibrate]]); }
function toggleTape(){ S.tape = !S.tape; if(S.tape){ S.known = new Set(S.api.getSceneElements().map(e => e.id)); S.api.setActiveTool({type:"arrow"}); say(T.tapeOn); } else S.api.setActiveTool({type:"selection"}); }
function tapeWatch(els){
  if(S.viewOnly) return; let changed = false; const out = els.map(e => e);
  if(S.tape){ for(const e of els){ if(e.type === "arrow" && !S.known.has(e.id) && !(e.customData && e.customData.measure) && (e.points || []).length >= 2){ const ln = lengthOf(e); if(ln == null || ln < 0.05) continue;
      const idx = out.findIndex(x => x.id === e.id); out[idx] = {...e, customData:{...(e.customData || {}), measure:true}, strokeColor:"#1c1813", strokeWidth:1.5, startArrowhead:"bar", endArrowhead:"bar", roughness:0};
      const [tx, ty] = midOf(e); out.push(EdrBoardLib.convertToExcalidrawElements([{type:"text", x:tx, y:ty - 20, text:`${fmtM(ln)} m`, fontSize:13, fontFamily:2, strokeColor:"#1c1813", customData:{measureOf:e.id}}])[0]); changed = true; } } }
  for(const t of els){ const of = t.customData && t.customData.measureOf; if(!of) continue; const a = els.find(x => x.id === of && !x.isDeleted); if(!a){ const i = out.findIndex(x => x.id === t.id); if(i >= 0 && !t.isDeleted){ out[i] = {...t, isDeleted:true}; changed = true; } continue; }
    const ln = lengthOf(a); const txt = `${fmtM(ln)} m`; const [tx, ty] = midOf(a); if(t.text !== txt || Math.abs(t.x - tx) > 1 || Math.abs(t.y - (ty - 20)) > 1){ const i = out.findIndex(x => x.id === t.id); out[i] = {...t, text:txt, originalText:txt, x:tx, y:ty - 20}; changed = true; } }
  if(changed) S.api.updateScene({elements:out});
}
function midOf(e){ const o = outline(e); const p = o.pts; let L = 0; const seg = []; for(let i = 1; i < p.length; i++){ const d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); seg.push(d); L += d; } let acc = 0; for(let i = 0; i < seg.length; i++){ if(acc + seg[i] >= L / 2){ const f = (L / 2 - acc) / (seg[i] || 1); return [p[i][0] + (p[i + 1][0] - p[i][0]) * f, p[i][1] + (p[i + 1][1] - p[i][1]) * f]; } acc += seg[i]; } return [e.x, e.y]; }
function labelSelection(){
  const ids = Object.keys(S.api.getAppState().selectedElementIds || {}); if(!ids.length){ say(T.selectFirst); return; } const els = S.api.getSceneElements(); const add = [];
  for(const e of els.filter(x => ids.includes(x.id))){ const a = areaOf(e), ln = lengthOf(e); const txt = a != null ? `${fmtM(a)} m²` : ln != null ? `${fmtM(ln)} m` : (e.width != null ? `${fmtM(e.width / GRID)} × ${fmtM(e.height / GRID)} m` : null); if(!txt) continue;
    add.push({type:"text", x:e.x + e.width / 2 - 20, y:e.y + e.height / 2 - 8, text:txt, fontSize:13, fontFamily:2, strokeColor:"#1c1813", customData:{sizeOf:e.id}}); }
  if(add.length){ S.api.updateScene({elements:[...els, ...EdrBoardLib.convertToExcalidrawElements(add)]}); markDirty(); }
}
/* scale from a photo: pick the image, tell the real distance, tap two points on it */
function startCalibrate(){
  const ids = Object.keys(S.api.getAppState().selectedElementIds || {}); const img = S.api.getSceneElements().find(e => ids.includes(e.id) && e.type === "image"); if(!img){ say(T.calibPick); return; }
  const m = parseFloat((prompt(T.calibDist, "10") || "").replace(",", ".")); if(!(m > 0)) return;
  S.calib = {img:img.id, m, pts:[]}; say(T.calibTap); S.api.setActiveTool({type:"selection"});
  const host = S.ui.querySelector(".qcanvas"); const onUp = ev => { if(!S.calib){ host.removeEventListener("pointerup", onUp, true); return; } const st = S.api.getAppState(); const r = host.getBoundingClientRect();
    const x = (ev.clientX - r.left) / st.zoom.value - st.scrollX, y = (ev.clientY - r.top) / st.zoom.value - st.scrollY; S.calib.pts.push([x, y]); if(S.calib.pts.length < 2) return;
    host.removeEventListener("pointerup", onUp, true); const [a, b] = S.calib.pts; const dpx = Math.hypot(b[0] - a[0], b[1] - a[1]); if(dpx < 2){ S.calib = null; return; }
    const k = (S.calib.m * GRID) / dpx; const els = S.api.getSceneElements().map(e => e.id === S.calib.img ? {...e, width:e.width * k, height:e.height * k} : e); S.api.updateScene({elements:els}); S.calib = null; markDirty(); say(T.calibDone); };
  host.addEventListener("pointerup", onUp, true);
}

/* ---------- smart symbols: a valve is a thing with a state, not a drawing ---------- */
const SMART = {
  valve:{label:"Válvula", states:["open", "closed"], colour:{open:["#5b8fb9", "transparent"], closed:["#d9534f", "#d9534f"]}},
  pump:{label:"Bomba", states:["on", "off"], colour:{on:["#7f9a6a", "#dfe9d6"], off:["#5b8fb9", "#ffffff"]}},
  power:{label:"Quadro elétrico", states:["on", "off"], colour:{on:["#ffab00", "#fff4d6"], off:["#6b6157", "#e8e0d0"]}},
  tank:{label:"Depósito", states:null}, meter:{label:"Contador", states:null}
};
let lastSel = "";
function smartOf(els, ids){ const sel = els.filter(e => ids.includes(e.id)); for(const e of sel){ if(e.customData && e.customData.smart) return e; } for(const e of sel){ if(e.groupIds && e.groupIds.length){ const b = els.find(x => x.customData && x.customData.smart && x.groupIds && x.groupIds.some(g => e.groupIds.includes(g))); if(b) return b; } } return null; }
function watchSelection(els, st){ const ids = Object.keys(st.selectedElementIds || {}); const key = ids.join(","); if(key === lastSel) return; lastSel = key; if(S.viewOnly) return; const body = ids.length ? smartOf(els, ids) : null; const tray = S.ui.querySelector(".qtray"); if(body) openFicha(body); else if(tray.dataset.ficha){ tray.classList.remove("on"); delete tray.dataset.ficha; } }
function openFicha(body){
  const def = SMART[body.customData.smart]; if(!def) return; const cd = body.customData; const tray = S.ui.querySelector(".qtray"); tray.classList.add("on"); tray.dataset.ficha = body.id;
  const stLabel = s => T[s] || s;
  tray.innerHTML = `<div class="th"><span>${T.ficha} · ${def.label}</span><button data-x>✕</button></div><div class="ficha">
    <label>${T.tag}<input data-f="tag" value="${(cd.tag || "").replace(/"/g, "&quot;")}" placeholder="V-01, Bomba A…"></label>
    ${def.states ? `<label>${T.state}<div class="seg">${def.states.map(s => `<button data-s="${s}" class="${cd.state === s ? "on" : ""}">${stLabel(s)}</button>`).join("")}</div></label>` : ""}
    ${cd.smart === "tank" ? `<label>${T.capacity}<input data-f="capacity" type="number" step="0.1" value="${cd.capacity || ""}"></label>` : ""}
    ${cd.smart === "meter" ? `<label>${T.reading}<div class="row"><input data-f="reading" type="number" step="0.01" value="${cd.reading || ""}"><button data-rec>${T.record}</button></div></label>` : ""}
    <label>${T.note}<textarea data-f="note" rows="3">${(cd.note || "").replace(/</g, "&lt;")}</textarea></label>
    <button class="ok" data-apply>${T.apply}</button></div>`;
  tray.querySelector("[data-x]").onclick = () => { tray.classList.remove("on"); delete tray.dataset.ficha; };
  const apply = (state) => { const els = S.api.getSceneElements(); const b = els.find(e => e.id === body.id); if(!b) return; const nd = {...b.customData}; tray.querySelectorAll("[data-f]").forEach(i => nd[i.dataset.f] = i.value); if(state) nd.state = state;
    const col = def.states && def.colour[nd.state]; const out = els.map(e => e.id === b.id ? {...e, customData:nd, ...(col ? {strokeColor:col[0], backgroundColor:col[1], fillStyle:col[1] === "transparent" ? "hachure" : "solid"} : {})} : e);
    if(nd.tag){ const g = b.groupIds || []; const ti = out.findIndex(e => e.type === "text" && !e.containerId && e.groupIds && e.groupIds.some(x => g.includes(x))); if(ti >= 0) out[ti] = {...out[ti], text:nd.tag, originalText:nd.tag}; }
    S.api.updateScene({elements:out}); markDirty(); tray.querySelectorAll("[data-s]").forEach(x => x.classList.toggle("on", x.dataset.s === nd.state)); };
  tray.querySelectorAll("[data-s]").forEach(x => x.onclick = () => apply(x.dataset.s)); tray.querySelector("[data-apply]").onclick = () => { apply(); say(T.saved); };
  const rec = tray.querySelector("[data-rec]"); if(rec) rec.onclick = async () => { const v = tray.querySelector('[data-f="reading"]').value; if(!v) return; apply(); const a = auth(); const tag = tray.querySelector('[data-f="tag"]').value || def.label;
    try{ await fetch(`${API}/item/${encodeURIComponent(S.fid)}/notes`, {method:"POST", headers:{"Content-Type":"application/json", ...(a.key ? {"X-Role-Key":a.key} : {})}, body:JSON.stringify({text:`${def.label} ${tag}: ${v}`, kind:"leitura", actor:a.actor, site:(typeof SITE_ID !== "undefined" ? SITE_ID : "edenrise")})}); say(T.recorded); }catch(e){ say(T.err); } };
}
/* walk mode: the board can be carried around without being nudged */
function toggleLock(btn){ const st = S.api.getAppState(); const on = !st.viewModeEnabled; S.api.updateScene({appState:{viewModeEnabled:on}}); btn.textContent = on ? "🔒" : "🔓"; btn.title = on ? T.unlock : T.lock; btn.classList.toggle("on", on); }

window.edrBoard = {open, close, save:() => save(true), state:S, bringFromMap, sendToMap, labelSelection, toggleTape, _serialize:serialize, _candidates:candidates, _geo:{toLL:(x, y) => toLL(x, y), toBoard:(a, b) => toBoard(a, b)}, _areaOf:areaOf, _lengthOf:lengthOf, _elementToGeometry:elementToGeometry};

})();
