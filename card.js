// Side card (desktop) / bottom sheet (mobile) replacing popups — with actions: ClickUp, navigate, copy, share
(function(){
  const el = document.createElement("aside"); el.id = "card"; el.hidden = true;
  el.innerHTML = `<div class="ch"><div id="cbadge"></div><button id="cclose" aria-label="close">✕</button></div><div id="cbody"></div><div id="cacts"></div>`;
  document.body.appendChild(el);
  const css = document.createElement("style"); css.textContent = `
    #card{position:fixed;right:12px;top:50px;width:340px;max-height:calc(100vh - 70px);overflow-y:auto;z-index:1500;background:rgba(29,36,27,.97);color:#e6e3d4;border:1px solid #333b2f;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.45);padding:12px 14px 14px;font-size:13px}
    #card .ch{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px} #cbadge{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#9ba391}
    #cclose{background:transparent;border:0;color:#9ba391;font-size:16px;cursor:pointer}
    #card .pp h3{font-size:16px;margin:2px 0 8px} #card .pp table{font-size:12.5px} #card .pp td{padding:2px 8px 2px 0} #card .pp td:first-child{color:#9ba391}
    #cacts{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;border-top:1px solid #333b2f;padding-top:10px}
    #cacts a,#cacts button{font-size:11.5px;padding:6px 9px;border-radius:6px;border:1px solid #333b2f;background:#141a15;color:#e6e3d4;text-decoration:none;cursor:pointer}
    #cacts a.primary{background:#8fae7e;color:#111;border-color:#8fae7e}
    @media(max-width:700px){ #card{left:8px;right:8px;top:auto;bottom:8px;width:auto;max-height:55vh;border-radius:12px} }`;
  document.head.appendChild(css);
  document.getElementById("cclose").onclick = ()=>{ el.hidden = true; };
  window.showCard = function(props, latlng, layerTitle){
    const L = (typeof LANG!=="undefined" && LANG==="en");
    document.getElementById("cbadge").textContent = layerTitle || "";
    document.getElementById("cbody").innerHTML = popup(props);
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
