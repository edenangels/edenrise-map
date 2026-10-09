// Side card (desktop) / bottom sheet (mobile) replacing popups — with actions: ClickUp, navigate, copy, share
(function(){
  const el = document.createElement("aside"); el.id = "card"; el.hidden = true;
  el.innerHTML = `<div class="ch"><div id="cbadge"></div><button id="cclose" aria-label="close">✕</button></div><div id="cbody"></div><div id="cacts"></div>`;
  document.body.appendChild(el);
  const css = document.createElement("style"); css.textContent = `
    #card{position:fixed;right:14px;top:56px;width:350px;max-height:calc(100vh - 76px);overflow-y:auto;z-index:1500;background:var(--night,#1c1813);color:var(--linen,#ece4d2);border:1px solid var(--line-2,#47402f);border-radius:12px;box-shadow:var(--sh,0 12px 34px rgba(0,0,0,.45));padding:14px 16px 16px;font:13px var(--ui,sans-serif);animation:cardin .18s cubic-bezier(.2,.8,.2,1)}
    @keyframes cardin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    #card .ch{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px} #cbadge{font-family:var(--mono,monospace);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#8f8676)}
    #cclose{background:transparent;border:0;color:var(--muted,#8f8676);font-size:16px;cursor:pointer;padding:2px 4px;border-radius:6px} #cclose:hover{color:var(--linen);background:var(--night-2)}
    #card .pp h3{font-family:var(--display,sans-serif);font-size:19px;font-weight:600;margin:2px 0 10px;letter-spacing:-.01em} #card .pp table{font-size:12.5px} #card .pp td{padding:3px 8px 3px 0;border-bottom:1px solid var(--line,#332c22)} #card .pp td:first-child{color:var(--muted,#8f8676)}
    #cacts{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;border-top:1px solid var(--line,#332c22);padding-top:12px}
    #cacts a,#cacts button{font:600 11.5px var(--ui,sans-serif);padding:7px 10px;border-radius:6px;border:1px solid var(--line-2,#47402f);background:var(--night-2,#241f18);color:var(--linen,#ece4d2);text-decoration:none;cursor:pointer;transition:border-color .15s} #cacts a:hover,#cacts button:hover{border-color:var(--oak,#7f9a6a)}
    #cacts a.primary{background:var(--linen,#ece4d2);color:var(--bark,#14110d);border-color:var(--linen,#ece4d2)}
    @media(max-width:700px){ #card{left:8px;right:8px;top:auto;bottom:8px;width:auto;max-height:55vh;border-radius:12px} }`;
  document.head.appendChild(css);
  document.getElementById("cclose").onclick = ()=>{ el.hidden = true; };
  /* The identity of a map item, everywhere: asset id › permanent uid › (footprint → its building's uid) › layer:name.
     Aliases are every key the item was ever filed under, so older records still attach — including the
     translated-title keys written before 2026-10-10, when a wrapper dropped the layer key. */
  function ptTitle(t){ try{ for(const [, , layers] of GROUPS) for(const l of layers) if(l[0] === t) return l[1]; }catch(e){} return null; }
  function enTitle(t){ try{ return (typeof T_EN !== "undefined" && T_EN[t]) || null; }catch(e){ return null; } }
  function buildingOf(props){ try{ if(props.core_fid == null) return null; return DATA.buildings_pt.features.find(f => f.properties && +f.properties.fid === +props.core_fid) || null; }catch(e){ return null; } }
  window.edrRefOf = function(t, props, title){ props = props || {};
    if(props.asset_id) return {ref:"asset:" + props.asset_id, aliases:[]};
    const nm = props.key || props.name || props.tree_name || "?"; const legacy = new Set([`${t}:${nm}`]); const pt = ptTitle(t), en = enTitle(t); if(pt) legacy.add(`${pt}:${nm}`); if(en) legacy.add(`${en}:${nm}`); if(title) legacy.add(`${title}:${nm}`);
    let uid = props.uid; if(!uid && t === "building_footprints"){ const b = buildingOf(props); if(b){ uid = b.properties.uid; const bn = b.properties.name || "?"; legacy.add(`buildings_pt:${bn}`); const bpt = ptTitle("buildings_pt"), ben = enTitle("buildings_pt"); if(bpt) legacy.add(`${bpt}:${bn}`); if(ben) legacy.add(`${ben}:${bn}`); } }
    const ref = uid ? "u:" + uid : `${t}:${nm}`; legacy.delete(ref); return {ref, aliases:[...legacy]}; };
  window.showCard = function(props, latlng, layerTitle, layerKey){
    const L = (typeof LANG!=="undefined" && LANG==="en");
    document.getElementById("cbadge").textContent = layerTitle || "";
    document.getElementById("cbody").innerHTML = popup(props);
    { const id = edrRefOf(layerKey||layerTitle||"item", props, layerTitle); const ref = id.ref, aliases = id.aliases; const holder=document.createElement("div"); document.getElementById("cbody").appendChild(holder); let tries=0; const go=()=>{ if(window.edrItem) edrItem(ref, holder, {latlng, aliases, name:(props.name||props.asset_id||props.tree_name||layerTitle||"")}); else if(tries++<25) setTimeout(go,200); }; go(); }
    const lat = latlng ? latlng.lat.toFixed(6) : null, lon = latlng ? latlng.lng.toFixed(6) : null;
    const key = props.asset_id ? `#asset=${props.asset_id}` : (props.key ? `#work=${props.key}` : (lat ? `#at=${lat},${lon}` : ""));
    const link = `${location.origin}${location.pathname}${key}`;
    let cu = null; if(typeof WORKDATA!=="undefined"){ const ks=[props.key].concat((props.inspections||[]).map(i=>i.key)).filter(Boolean); for(const k of ks){ if(WORKDATA.items[k] && WORKDATA.items[k].url){ cu = WORKDATA.items[k].url; break; } } }
    const acts = [];
    if(cu) acts.push(`<a class="primary" href="${cu}" target="_blank">ClickUp ↗</a>`);
    if(lat) acts.push(`<a href="https://maps.apple.com/?daddr=${lat},${lon}" target="_blank">${L?"Navigate":"Navegar"} ↗</a>`);
    if(lat) acts.push(`<button data-copy="${lat}, ${lon}">${L?"Copy coords":"Copiar coords"}</button>`);
    acts.push(`<button data-copy="${link}">${L?"Share link":"Partilhar link"}</button>`);
    if(props.asset_id) acts.push(`<a href="labels.html#${props.asset_id}" target="_blank">QR</a>`);
    document.getElementById("cacts").innerHTML = acts.join("");
    document.querySelectorAll("#cacts [data-copy]").forEach(b=>b.onclick=()=>{ try{ navigator.clipboard.writeText(b.dataset.copy); }catch(e){} const t=b.textContent; b.textContent="✓"; setTimeout(()=>b.textContent=t,1000); });
    el.hidden = false;
  };
})();
