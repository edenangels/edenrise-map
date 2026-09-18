// EdenRise map — external RTK receiver over Web Bluetooth (Android Chrome, desktop Chrome; iPhone Safari has no Web Bluetooth).
// A u-blox F9P / ArduSimple / Emlid board streaming NMEA over the Nordic UART service becomes the map's position source:
// every module that watches the GPS (survey, camera view, "where am I") receives centimetre fixes instead, with no
// mock-location app. Fix quality (RTK fixed / float / DGPS / GPS), satellites and HDOP are shown; the phone's own GPS
// takes over again the moment the receiver disconnects.
(function(){
const EN = (typeof LANG !== "undefined") && LANG === "en";
const T = EN ? {btn:"RTK", no:"This browser has no Web Bluetooth (use Chrome on Android or a computer; iPhone Safari cannot).", pick:"Choose the receiver in the list", on:n=>`RTK receiver connected: ${n}`, off:"RTK receiver disconnected — back to the phone's GPS", nofix:"Receiver connected, waiting for a fix…", q:{0:"no fix",1:"GPS",2:"DGPS",4:"RTK fixed",5:"RTK float",6:"estimated"}}
             : {btn:"RTK", no:"Este browser não tem Web Bluetooth (usa o Chrome no Android ou num computador; o Safari do iPhone não consegue).", pick:"Escolhe o recetor na lista", on:n=>`Recetor RTK ligado: ${n}`, off:"Recetor RTK desligado — de volta ao GPS do telemóvel", nofix:"Recetor ligado, à espera de posição…", q:{0:"sem fix",1:"GPS",2:"DGPS",4:"RTK fixo",5:"RTK flutuante",6:"estimado"}};
const NUS = "6e400001-b5a3-f393-e0a9-e50e24dcca9e", TX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
const R = {dev:null, ch:null, fix:null, buf:"", listeners:new Set(), chip:null};
const say = m => window.toast && toast(m);

/* ---------- NMEA GGA ---------- */
function dm(v, h){ if(!v) return NaN; const d = Math.floor(+v / 100), m = +v - d * 100; const x = d + m / 60; return (h === "S" || h === "W") ? -x : x; }
function parseGGA(line){
  if(!/^\$(GP|GN|GA|GL|GB)GGA,/.test(line)) return null;
  const star = line.indexOf("*"); const body = star > 0 ? line.slice(1, star) : line.slice(1);
  if(star > 0){ let cs = 0; for(let i = 0; i < body.length; i++) cs ^= body.charCodeAt(i); if(cs !== parseInt(line.slice(star + 1, star + 3), 16)) return null; }
  const f = body.split(","); const lat = dm(f[2], f[3]), lon = dm(f[4], f[5]); if(!isFinite(lat) || !isFinite(lon)) return null;
  const q = +f[6] || 0, hdop = +f[8] || 99; const base = q === 4 ? 0.02 : q === 5 ? 0.3 : q === 2 ? 1.0 : 2.5;
  return {lat, lon, alt:+f[9] || 0, quality:q, sats:+f[7] || 0, hdop, acc:base * Math.max(1, hdop), at:Date.now()};
}
function feed(chunk){ R.buf += chunk; const parts = R.buf.split(/\r?\n/); R.buf = parts.pop() || ""; for(const l of parts){ const g = parseGGA(l); if(g && g.quality > 0) onFix(g); } }

/* ---------- the position override: everyone who watches the GPS gets the receiver instead ---------- */
const geo = navigator.geolocation; const watchers = new Map(); let nextId = 100000;
if(geo){
  const origWatch = geo.watchPosition.bind(geo), origClear = geo.clearWatch.bind(geo);
  geo.watchPosition = function(ok, err, opts){
    const id = nextId++; const native = origWatch(p => { if(!active()) ok(p); }, err, opts);
    watchers.set(id, {ok, native}); if(active() && R.fix) ok(toPosition(R.fix)); return id;
  };
  geo.clearWatch = function(id){ const w = watchers.get(id); if(w){ origClear(w.native); watchers.delete(id); } else origClear(id); };
}
const active = () => !!R.ch && !!R.fix && Date.now() - R.fix.at < 5000;
function toPosition(g){ return {coords:{latitude:g.lat, longitude:g.lon, accuracy:g.acc, altitude:g.alt, altitudeAccuracy:g.acc * 2, heading:null, speed:null}, timestamp:g.at, rtk:g}; }
function onFix(g){ R.fix = g; const p = toPosition(g); watchers.forEach(w => { try{ w.ok(p); }catch(e){} }); R.listeners.forEach(l => { try{ l(g); }catch(e){} }); paint(); }

/* ---------- Bluetooth ---------- */
async function connect(){
  if(!navigator.bluetooth){ say(T.no); return false; }
  try{
    say(T.pick);
    R.dev = await navigator.bluetooth.requestDevice({filters:[{services:[NUS]}], optionalServices:[NUS]});
    R.dev.addEventListener("gattserverdisconnected", () => { R.ch = null; R.fix = null; paint(); say(T.off); });
    const srv = await (await R.dev.gatt.connect()).getPrimaryService(NUS);
    R.ch = await srv.getCharacteristic(TX); const dec = new TextDecoder();
    R.ch.addEventListener("characteristicvaluechanged", e => feed(dec.decode(e.target.value)));
    await R.ch.startNotifications(); say(T.on(R.dev.name || R.dev.id)); setTimeout(() => { if(!R.fix) say(T.nofix); }, 4000); paint(); return true;
  }catch(e){ R.ch = null; paint(); if(e && e.name !== "NotFoundError") say(String(e.message || e)); return false; }
}
function disconnect(){ try{ R.dev && R.dev.gatt.connected && R.dev.gatt.disconnect(); }catch(e){} R.ch = null; R.fix = null; paint(); }

/* ---------- one chip, wherever the GPS matters ---------- */
const css = document.createElement("style"); css.textContent = `
.rtkchip{height:36px;border-radius:18px;border:1px solid rgba(255,255,255,.35);background:rgba(20,17,13,.7);color:#fff;font:700 12px var(--mono);padding:0 12px;cursor:pointer}
.rtkchip.on{background:#5be0a0;color:#1c1813;border-color:#5be0a0}
#svsheet .rtkchip{position:absolute;right:14px;top:12px}`; document.head.appendChild(css);
function label(){ if(!R.ch) return T.btn; if(!R.fix) return "RTK …"; return `${T.q[R.fix.quality] || R.fix.quality} · ±${R.fix.acc < 1 ? R.fix.acc.toFixed(2) : Math.round(R.fix.acc)} m · ${R.fix.sats}sat`; }
function paint(){ document.querySelectorAll(".rtkchip").forEach(b => { b.textContent = label(); b.classList.toggle("on", active()); }); }
function chip(){ const b = document.createElement("button"); b.className = "rtkchip"; b.type = "button"; b.textContent = label(); b.title = "RTK"; b.onclick = () => R.ch ? disconnect() : connect(); return b; }
function place(){
  const sv = document.getElementById("svsheet"); if(sv && !sv.querySelector(".rtkchip")) sv.appendChild(chip());
  const ar = document.querySelector("#arview .top .r"); if(ar && !ar.querySelector(".rtkchip")) ar.prepend(chip());
}
new MutationObserver(place).observe(document.body, {childList:true}); place();
if(!navigator.bluetooth){ document.head.appendChild(Object.assign(document.createElement("style"), {textContent:".rtkchip{opacity:.45}"})); }

window.edrRTK = {connect, disconnect, active, fix:() => R.fix, on:l => { R.listeners.add(l); return () => R.listeners.delete(l); }, _parse:parseGGA, _feed:feed, _sim:o => Object.assign(R, o)};
})();
