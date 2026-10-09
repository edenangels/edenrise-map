// EdenRise map — tags: every asset gets a sticker that opens its card.
//
// Indoors GPS cannot tell which valve you are facing; a tag can. Each item can carry an NFC sticker and/or a QR
// sticker holding one link: <map>#item=<id>. Touching the NFC sticker or pointing any camera at the QR opens that
// item's card with its one-tap actions (service done, part ordered, problem, reading) — on Android and iPhone,
// with or without signal (the map shell and data are cached; actions queue until signal returns).
// Writing: Chrome on Android writes NFC from the browser (Web NFC); iPhones read the same stickers natively.
// Printing: a single sticker or a sheet for every item inside a building.
(function(){
if(typeof map === "undefined") return;
const EN = (typeof LANG !== "undefined") && LANG === "en";
const T = EN ? {tag:"Tag", title:"Tag for this item", nfc:"Write NFC sticker", nfcLock:"Lock it (read-only, cannot be rewritten)", nfcHold:"Hold the phone against the sticker…", nfcOk:"NFC sticker written", nfcNo:"This browser cannot write NFC — use Chrome on Android. iPhones can still read the stickers.", nfcErr:"Could not write the sticker", print:"Print sticker", sheet:"Print stickers for every item in this building", copy:"Copy link", copied:"Link copied", how:"Stick it on the equipment. Touch the NFC sticker or point any phone camera at the QR: the card opens.", opened:"Opened from a tag", notFound:"This tag points to an item that is not on the map any more", written:"Sticker written", scanNfc:"Read NFC stickers here", scanOn:"Touch a sticker…"}
             : {tag:"Etiqueta", title:"Etiqueta deste item", nfc:"Escrever etiqueta NFC", nfcLock:"Bloquear (só leitura, não pode ser reescrita)", nfcHold:"Encosta o telemóvel à etiqueta…", nfcOk:"Etiqueta NFC escrita", nfcNo:"Este browser não escreve NFC — usa o Chrome no Android. Os iPhones conseguem ler as etiquetas.", nfcErr:"Não consegui escrever a etiqueta", print:"Imprimir etiqueta", sheet:"Imprimir etiquetas de todos os itens deste edifício", copy:"Copiar link", copied:"Link copiado", how:"Cola no equipamento. Encosta o telemóvel à etiqueta NFC ou aponta qualquer câmara ao QR: abre a ficha.", opened:"Aberto por etiqueta", notFound:"Esta etiqueta aponta para um item que já não está no mapa", written:"Etiqueta escrita", scanNfc:"Ler etiquetas NFC aqui", scanOn:"Encosta a uma etiqueta…"};
const API = "https://edenrise-brain.edenrise.workers.dev";
const say = m => window.toast && toast(m);
const esc = x => String(x == null ? "" : x).replace(/[<>&"]/g, c => ({"<":"&lt;", ">":"&gt;", "&":"&amp;", '"':"&quot;"}[c]));
const auth = () => window.edrAuth || {key:"", role:"viewer", actor:""};
// Sticker links always point at the published map (the native app builds the same image to anchor its labels on the
// sticker, so the text must be identical wherever the sheet was printed). Local copies keep their own address for tests.
const CANON = "https://edenangels.github.io/edenrise-map/";
const BASE = () => /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) ? location.origin + location.pathname.replace(/[^/]*$/, "") : CANON;
const linkOf = fid => `${BASE()}#item=${encodeURIComponent(fid)}`;
const shortId = fid => { const s = String(fid); if(s.startsWith("u:")) return s.slice(2, 10).toUpperCase(); if(s.startsWith("asset:")) return s.slice(6); return s.length > 14 ? s.slice(-10) : s; };

/* ---------- resolving a tag to an item ---------- */
function centre(f){ try{ const c = turf.centroid(f).geometry.coordinates; return L.latLng(c[1], c[0]); }catch(e){ return null; } }
function findCore(fid){
  const s = String(fid); if(typeof DATA === "undefined") return null; let hit = null;
  for(const t in DATA){ const fc = DATA[t]; if(!fc || !fc.features) continue; for(const f of fc.features){ const p = f.properties || {};
    if(s.startsWith("asset:") && p.asset_id === s.slice(6)) return {t, f}; if(s.startsWith("u:") && p.uid === s.slice(2)) hit = hit || {t, f};
    if(window.edrRefOf){ const id = edrRefOf(t, p); if(id.ref === s){ if(t === "building_footprints") return {t, f}; hit = hit || {t, f}; } else if(!hit && id.aliases.includes(s)) hit = {t, f}; } } }
  return hit;
}
async function openRef(fid, via){
  const s = String(fid);
  if(s.startsWith("task:") && window.edrTasks){ for(let i = 0; i < 20 && !(edrTasks.all() || []).some(t => t.id === s.slice(5)); i++) await new Promise(r => setTimeout(r, 300)); edrTasks.open(s.slice(5)); return true; }
  const core = findCore(s);
  if(core){ const ll = centre(core.f); if(ll) map.setView(ll, Math.max(map.getZoom(), 19)); if(window.showCard) showCard(core.f.properties, ll, (typeof title_i18n === "function" ? title_i18n(core.t, core.t) : core.t), core.t); flash(ll); if(via) say(`🏷 ${T.opened}`); return true; }
  // team proposals load from the server: wait for them
  for(let i = 0; i < 25; i++){ if(window.edrEdit && edrEdit.openById && edrEdit.openById(s)){ if(via) say(`🏷 ${T.opened}`); return true; } await new Promise(r => setTimeout(r, 400)); }
  say(T.notFound); return false;
}
function flash(ll){ if(!ll) return; const c = L.circleMarker(ll, {radius:26, color:"#5be0a0", weight:4, fill:false, className:"tagflash"}).addTo(map); setTimeout(() => map.removeLayer(c), 2600); }
function fromHash(){ const m = /[#&]item=([^&]+)/.exec(location.hash); if(!m) return; const fid = decodeURIComponent(m[1]); setTimeout(() => openRef(fid, true), 1200); }
window.addEventListener("hashchange", fromHash); fromHash();

/* ---------- the tag sheet ---------- */
const css = document.createElement("style"); css.textContent = `
#tagsheet{position:fixed;inset:0;z-index:2100;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;padding:16px} #tagsheet.on{display:flex}
#tagsheet .box{background:#1c1813;color:#f1e9d8;border:1px solid rgba(241,233,216,.18);border-radius:18px;max-width:420px;width:100%;padding:16px;display:flex;flex-direction:column;gap:12px;max-height:calc(100vh - 32px);overflow-y:auto}
#tagsheet h3{margin:0;font:800 16px var(--ui)} #tagsheet .lbl{display:flex;gap:14px;align-items:center;background:#fff;color:#111;border-radius:12px;padding:12px} #tagsheet .lbl .q{width:120px;height:120px;flex:none} #tagsheet .lbl .q img,#tagsheet .lbl .q canvas{width:120px!important;height:120px!important}
#tagsheet .lbl b{display:block;font:800 15px var(--ui)} #tagsheet .lbl small{display:block;font:600 11px var(--mono);opacity:.7;margin-top:4px} #tagsheet .how{font:500 12.5px var(--ui);opacity:.8}
#tagsheet .acts{display:flex;flex-direction:column;gap:8px} #tagsheet .acts button{min-height:48px;border-radius:12px;border:1px solid rgba(241,233,216,.25);background:transparent;color:#f1e9d8;font:700 13.5px var(--ui);cursor:pointer;text-align:left;padding:0 14px} #tagsheet .acts button.ok{background:#c9a227;color:#1c1813;border-color:#c9a227} #tagsheet .acts button:disabled{opacity:.45}
#tagsheet label.ck{display:flex;flex-direction:row;gap:8px;align-items:center;font:600 12px var(--ui)} #tagsheet .st{font:700 12.5px var(--ui);color:#5be0a0;min-height:18px}
.tagflash{animation:tgf 1.3s ease-out 2} @keyframes tgf{0%{stroke-opacity:1}100%{stroke-opacity:0}}
@media print{ body.tagprint > *:not(#tagprint){display:none!important} #tagprint{display:block!important} }
#tagprint{display:none;background:#fff;color:#111} #tagprint .grid{display:grid;grid-template-columns:repeat(3,62mm);gap:4mm} #tagprint .st{border:0.3mm dashed #999;border-radius:3mm;padding:3mm;display:flex;gap:3mm;align-items:center;height:34mm;box-sizing:border-box;break-inside:avoid} #tagprint .st .q{width:26mm;height:26mm;flex:none} #tagprint .st .q img,#tagprint .st .q canvas{width:26mm!important;height:26mm!important} #tagprint .st b{display:block;font:800 9.5pt sans-serif;line-height:1.15} #tagprint .st small{display:block;font:600 7pt monospace;color:#555;margin-top:1mm} #tagprint .st i{display:block;font:600 6.5pt sans-serif;color:#777;margin-top:1.5mm;font-style:normal}`;
document.head.appendChild(css);
let qrP = null; function qrLib(){ if(window.qrcode) return Promise.resolve(); if(!qrP) qrP = new Promise((res, rej) => { const sc = document.createElement("script"); sc.src = "vendor/qrgen.js"; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); }); return qrP; }
/* QR drawing: qrcode-generator (MIT), the same encoder the native app uses, error correction M, no quiet zone (the sticker's white is the margin) */
function qrMatrix(text){ const q = qrcode(0, "M"); q.addData(text); q.make(); return q; }
async function qrInto(el, text, px){ el.innerHTML = ""; try{ await qrLib(); const q = qrMatrix(text), n = q.getModuleCount(), cell = Math.max(1, Math.floor(px / n)); const cv = document.createElement("canvas"); cv.width = cv.height = n * cell; cv.style.width = cv.style.height = px + "px"; cv.style.imageRendering = "pixelated";
  const g = cv.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = "#000"; for(let r = 0; r < n; r++) for(let c = 0; c < n; c++) if(q.isDark(r, c)) g.fillRect(c * cell, r * cell, cell, cell); cv.setAttribute("aria-label", text); el.appendChild(cv); }catch(e){ el.textContent = text; } }
let sheet = null;
function open(fid, name){
  if(!sheet){ sheet = document.createElement("div"); sheet.id = "tagsheet"; sheet.setAttribute("role", "dialog"); document.body.appendChild(sheet); sheet.addEventListener("click", e => { if(e.target === sheet) close(); }); }
  const zone = window.edrZones ? edrZones.zonesAt(centreOfRef(fid) || [0, 0], 0).find(z => z.fid === fid) || zoneByFid(fid) : null; const kids = zone ? edrZones.children(zone) : [];
  const canNfc = "NDEFReader" in window;
  sheet.innerHTML = `<div class="box"><h3>🏷 ${T.title}</h3><div class="lbl"><div class="q"></div><div><b>${esc(name || fid)}</b><small>${esc(shortId(fid))}</small><small>EdenRise</small></div></div><div class="how">${T.how}</div>
    <div class="acts"><button class="ok" data-a="nfc" ${canNfc ? "" : "disabled"}>📡 ${T.nfc}</button>${canNfc ? `<label class="ck"><input type="checkbox" data-a="lock"> ${T.nfcLock}</label>` : `<div class="how">${T.nfcNo}</div>`}<div class="st" data-a="st"></div>
    <button data-a="print">🖨 ${T.print}</button>${kids.length ? `<button data-a="sheet">🖨 ${T.sheet} (${kids.length + 1})</button>` : ""}<button data-a="copy">🔗 ${T.copy}</button><button data-a="x">${EN ? "Close" : "Fechar"}</button></div></div>`;
  qrInto(sheet.querySelector(".q"), linkOf(fid), 240); sheet.classList.add("on");
  const st = sheet.querySelector('[data-a="st"]');
  sheet.querySelectorAll("button[data-a]").forEach(b => b.onclick = async () => { const a = b.dataset.a;
    if(a === "x") return close();
    if(a === "copy"){ try{ await navigator.clipboard.writeText(linkOf(fid)); say(T.copied); }catch(e){ prompt(T.copy, linkOf(fid)); } }
    if(a === "print") printStickers([{fid, name}]);
    if(a === "sheet") printStickers([{fid, name}, ...kids.map(k => ({fid:k.fid, name:k.name}))]);
    if(a === "nfc"){ st.textContent = `📡 ${T.nfcHold}`; b.disabled = true;
      try{ const w = new NDEFReader(); await w.write({records:[{recordType:"url", data:linkOf(fid)}]}); if(sheet.querySelector('[data-a="lock"]').checked) await w.makeReadOnly();
        st.textContent = `✓ ${T.nfcOk}`; if(navigator.vibrate) navigator.vibrate(120);
        try{ await fetch(`${API}/item/${encodeURIComponent(fid)}/notes`, {method:"POST", headers:{"Content-Type":"application/json", ...(auth().key ? {"X-Role-Key":auth().key} : {})}, body:JSON.stringify({text:`🏷 ${T.written}${sheet.querySelector('[data-a="lock"]').checked ? " (🔒)" : ""}`, kind:"etiqueta", actor:auth().actor, site:(typeof SITE_ID !== "undefined" ? SITE_ID : "edenrise")})}); }catch(e){}
      }catch(e){ st.textContent = `✗ ${T.nfcErr}: ${e && e.message || e}`; } b.disabled = false; } });
}
function close(){ if(sheet) sheet.classList.remove("on"); }
function centreOfRef(fid){ const c = findCore(fid); if(c){ const ll = centre(c.f); return ll ? [ll.lat, ll.lng] : null; } try{ const f = (window.edrEdit && edrEdit.feats ? edrEdit.feats() : []).find(x => x.properties && x.properties.id === fid); if(f){ const ll = centre(f); return ll ? [ll.lat, ll.lng] : null; } }catch(e){} return null; }
function zoneByFid(fid){ if(!window.edrZones) return null; const c = centreOfRef(fid); if(!c) return null; return edrZones.zonesAt(c, 0).find(z => z.fid === fid) || null; }
/* ---------- printing ---------- */
function printStickers(list){
  let host = document.getElementById("tagprint"); if(!host){ host = document.createElement("div"); host.id = "tagprint"; document.body.appendChild(host); }
  host.innerHTML = `<div class="grid">${list.map((x, i) => `<div class="st"><div class="q" data-i="${i}"></div><div><b>${esc(x.name || x.fid)}</b><small>${esc(shortId(x.fid))}</small><i>${EN ? "Touch or scan → card" : "Encosta ou aponta → ficha"}</i></div></div>`).join("")}</div>`;
  Promise.all(list.map((x, i) => qrInto(host.querySelector(`.q[data-i="${i}"]`), linkOf(x.fid), 300))).then(() => { document.body.classList.add("tagprint"); setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove("tagprint"), 500); }, 400); });
}
/* ---------- reading NFC while the map is open (Android Chrome) — otherwise the phone opens the link itself ---------- */
let reading = false;
async function scanNfc(){ if(!("NDEFReader" in window) || reading) return false; try{ const r = new NDEFReader(); await r.scan(); reading = true; say(`📡 ${T.scanOn}`);
  r.onreading = ev => { for(const rec of ev.message.records){ if(rec.recordType === "url" || rec.recordType === "absolute-url"){ const url = new TextDecoder().decode(rec.data); const m = /[#&]item=([^&]+)/.exec(url); if(m){ if(navigator.vibrate) navigator.vibrate(80); openRef(decodeURIComponent(m[1]), true); return; } } } }; return true; }catch(e){ return false; } }
window.edrTags = {open, close, openRef, linkOf, scanNfc, printStickers, findCore, _shortId:shortId};
})();
