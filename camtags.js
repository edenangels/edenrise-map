// EdenRise map — sticker labels in the camera: inside a room, the tags are the anchors.
//
// GPS is a few metres off at best and useless inside a pump room, so indoors the camera uses what is really there: the
// QR stickers from the Tag sheet. While the camera view is open it reads every sticker in the frame (several at once),
// draws the item's name and live state on the sticker itself — open problems, parts on order, days since service —
// and a tap opens that item's card. Walk along a wall of valves and each one tells you how it is.
//
// Reader: the phone's own BarcodeDetector where it exists (Android Chrome: fast, no download), otherwise zxing-wasm
// (MIT, the same reader the tag printer is checked with), loaded only the first time it is needed. Runs ~4 times a
// second on a small copy of the frame, so the camera stays smooth.
(function(){
const EN = (typeof LANG !== "undefined") && LANG === "en";
const LEVEL = {problem:"#ff6b6b", waiting:"#ffb347", ok:"#5be0a0", none:"#ffd166"};
const S = {vis:0, det:null, kind:null, busy:false, last:0, seen:new Map(), names:new Map(), status:new Map(), announced:new Set(), work:null, failed:false};
const say = m => window.toast && toast(m);
const HOLD = 700;     // ms a sticker label stays after the sticker was last read (no flicker when a frame misses it)

async function reader(){
  if(S.det || S.failed) return S.det;
  try{ if("BarcodeDetector" in window){ const f = await BarcodeDetector.getSupportedFormats(); if(f.includes("qr_code")){ S.det = new BarcodeDetector({formats:["qr_code"]}); S.kind = "native"; return S.det; } } }catch(e){}
  try{
    if(!window.ZXingWASM) await new Promise((res, rej) => { const s = document.createElement("script"); s.src = "vendor/zxing/zxing-reader.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    ZXingWASM.prepareZXingModule({overrides:{locateFile:(p, pre) => p.endsWith(".wasm") ? "vendor/zxing/zxing_reader.wasm" : pre + p}});
    S.det = {detect:async img => (await ZXingWASM.readBarcodes(img, {formats:["QRCode"], maxNumberOfSymbols:8, tryHarder:true})).filter(r => r.isValid !== false).map(r => ({rawValue:r.text, cornerPoints:[r.position.topLeft, r.position.topRight, r.position.bottomRight, r.position.bottomLeft]}))};
    S.kind = "zxing"; return S.det;
  }catch(e){ S.failed = true; return null; }
}
/* which item a sticker points to: our own links only (…#item=<ref>) */
function refOf(text){ const m = /[#&]item=([^&\s]+)/.exec(String(text || "")); if(!m) return null; try{ return decodeURIComponent(m[1]); }catch(e){ return null; } }
function nameOf(ref){
  if(S.names.has(ref)) return S.names.get(ref); let n = null;
  try{ if(ref.startsWith("task:") && window.edrTasks){ const t = (edrTasks.all() || []).find(x => x.id === ref.slice(5)); if(t) n = "✔ " + (t.title || t.id); } }catch(e){}
  try{ if(!n && window.edrTags){ const c = edrTags.findCore(ref); if(c){ const p = c.f.properties || {}; n = p.name || p.asset_id || p.tree_name || (typeof title_i18n === "function" ? title_i18n(c.t, c.t) : c.t); } } }catch(e){}
  try{ if(!n && window.edrEdit && edrEdit.feats){ const f = edrEdit.feats().find(x => x.properties && x.properties.id === ref); if(f){ const p = f.properties; n = p.name || p.tipo_livre || p.preset || ref; } } }catch(e){}
  if(n) S.names.set(ref, n); return n || ref.replace(/^u:/, "").slice(0, 8);
}
function stateOf(ref){
  const hit = S.status.get(ref); if(hit && (hit.v || Date.now() - hit.at < 15000)) return hit.v;
  if(!hit || Date.now() - hit.at > 15000){ S.status.set(ref, {at:Date.now(), v:hit ? hit.v : null}); if(window.edrZones && !ref.startsWith("task:")) edrZones.status(ref).then(v => S.status.set(ref, {at:Date.now(), v})).catch(() => {}); }
  return hit ? hit.v : null;
}
/* read the frame (throttled, off the draw path) */
async function scan(video, now){
  if(S.busy || now - S.last < 250 || !video || video.readyState < 2 || !video.videoWidth) return; S.busy = true; S.last = now;
  try{
    const det = await reader(); if(!det) return;
    const vw = video.videoWidth, vh = video.videoHeight, sc = Math.min(1, 960 / Math.max(vw, vh));
    if(!S.work) S.work = document.createElement("canvas"); const w = S.work; w.width = Math.round(vw * sc); w.height = Math.round(vh * sc);
    const g = w.getContext("2d", {willReadFrequently:true}); g.drawImage(video, 0, 0, w.width, w.height);
    const found = await det.detect(S.kind === "native" ? w : g.getImageData(0, 0, w.width, w.height));
    const t = performance.now();
    for(const f of found || []){ const ref = refOf(f.rawValue); if(!ref || !f.cornerPoints || f.cornerPoints.length < 4) continue;
      const pts = f.cornerPoints.map(p => [p.x / w.width, p.y / w.height]); const prev = S.seen.get(ref);
      // smooth the corners a little so the label does not shake with every read
      const sm = prev && t - prev.t < HOLD ? pts.map((p, i) => [prev.pts[i][0] * 0.35 + p[0] * 0.65, prev.pts[i][1] * 0.35 + p[1] * 0.65]) : pts;
      S.seen.set(ref, {pts:sm, t});
      if(!S.announced.has(ref)){ S.announced.add(ref); say(`🏷 ${nameOf(ref)}`); if(navigator.vibrate) try{ navigator.vibrate(30); }catch(e){} }
    }
  }catch(e){} finally{ S.busy = false; }
}
/* draw every sticker seen in the last moment, anchored on the sticker; returns tap targets */
function draw(ctx, W, H, dpr, video, now, font){
  scan(video, now); const out = []; if(!S.seen.size || !video || !video.videoWidth) return out;
  const vw = video.videoWidth, vh = video.videoHeight, s = Math.max(W / vw, H / vh), ox = (W - vw * s) / 2, oy = (H - vh * s) / 2;   // video is object-fit: cover
  const t = performance.now(); const placed = []; const gap = 6 * dpr;
  const items = [...S.seen.entries()].filter(([, v]) => t - v.t < HOLD).map(([ref, v]) => { const q = v.pts.map(p => [ox + p[0] * vw * s, oy + p[1] * vh * s]); const cx = q.reduce((a, p) => a + p[0], 0) / 4, cy = q.reduce((a, p) => a + p[1], 0) / 4; const side = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]); return {ref, q, cx, cy, side, age:t - v.t}; })
    .filter(it => it.cx >= 0 && it.cx <= W && it.cy >= 0 && it.cy <= H)   // the frame is cropped to fill the screen: only stickers you can see
    .sort((a, b) => b.side - a.side);   // nearest (biggest) sticker first
  S.vis = items.length;
  for(const it of items){
    const st = stateOf(it.ref); const lv = st ? st.level : "none"; const edge = LEVEL[lv] || LEVEL.none; const fade = it.age > 300 ? 1 - (it.age - 300) / (HOLD - 300) : 1;
    ctx.globalAlpha = Math.max(0.15, fade);
    ctx.strokeStyle = edge; ctx.lineWidth = 3 * dpr; ctx.beginPath(); it.q.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke();
    const name = nameOf(it.ref); const sub = st ? (st.summary || (EN ? "no record yet" : "sem registo")) : "…";
    ctx.font = `700 ${15 * dpr}px ${font}`; const w1 = ctx.measureText(name).width; ctx.font = `600 ${12 * dpr}px ${font}`; const w2 = ctx.measureText(sub).width;
    const w = Math.min(W - 16 * dpr, Math.max(w1, w2) + 24 * dpr), h = 48 * dpr; const top = Math.min(...it.q.map(p => p[1]));
    let box = null; for(const k of [0, -1, -2, 1, 2]){ const b = {x:Math.min(Math.max(it.cx - w / 2, 8 * dpr), W - w - 8 * dpr), y:top - h - 10 * dpr + k * (h + gap), w, h}; if(b.y < 64 * dpr) b.y = Math.max(...it.q.map(p => p[1])) + 10 * dpr + Math.max(0, k) * (h + gap);
      if(b.y + h <= H && !placed.some(q => b.x < q.x + q.w + gap && b.x + b.w + gap > q.x && b.y < q.y + q.h + gap && b.y + b.h + gap > q.y)){ box = b; break; } }
    if(!box){ ctx.globalAlpha = 1; out.push({x:it.cx / dpr, y:it.cy / dpr, w:Math.max(44, it.side / dpr), h:Math.max(44, it.side / dpr), tag:it.ref}); continue; }
    placed.push(box);
    ctx.strokeStyle = edge; ctx.lineWidth = 1.5 * dpr; ctx.beginPath(); ctx.moveTo(it.cx, top); ctx.lineTo(box.x + w / 2, box.y + h); ctx.stroke();
    ctx.fillStyle = "rgba(20,17,13,.9)"; ctx.lineWidth = (lv === "problem" ? 2.5 : 1.5) * dpr; ctx.beginPath(); ctx.roundRect(box.x, box.y, w, h, 10 * dpr); ctx.fill(); ctx.stroke();
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff"; ctx.font = `700 ${15 * dpr}px ${font}`; ctx.fillText(name, box.x + w / 2, box.y + 17 * dpr, w - 16 * dpr);
    ctx.fillStyle = edge; ctx.font = `600 ${12 * dpr}px ${font}`; ctx.fillText(sub, box.x + w / 2, box.y + 35 * dpr, w - 16 * dpr); ctx.globalAlpha = 1;
    out.push({x:(box.x + w / 2) / dpr, y:(box.y + h / 2) / dpr, w:w / dpr, h:h / dpr, tag:it.ref});
    out.push({x:it.cx / dpr, y:it.cy / dpr, w:Math.max(44, it.side / dpr), h:Math.max(44, it.side / dpr), tag:it.ref});
  }
  return out;
}
function count(){ return S.vis || 0; }
function reset(){ S.seen.clear(); S.announced.clear(); S.vis = 0; }
window.edrCamTags = {draw, count, reset, refOf, _state:S};
})();
