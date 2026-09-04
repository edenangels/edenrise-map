// Shareable views: URL hash carries view (lat,lon,zoom), basemap and visible layers; restores on load.
(function(){
  const enc = ()=>{ const c=map.getCenter(); const on=Object.entries(layerObjs).filter(([t,o])=>map.hasLayer(o.lyr)).map(([t])=>t);
    return `#v=${c.lat.toFixed(5)},${c.lng.toFixed(5)},${map.getZoom().toFixed(1)}&b=${encodeURIComponent(curBase)}&l=${on.join(",")}`; };
  window.viewLink = ()=> location.origin + location.pathname + enc();
  let armed = false;
  function apply(){
    const m = location.hash.match(/#v=(-?[\d.]+),(-?[\d.]+),([\d.]+)(?:&b=([^&]+))?(?:&l=([^&]*))?/); if(!m) return false;
    const [_, la, lo, z, b, l] = m;
    if(b && bases[decodeURIComponent(b)] && decodeURIComponent(b)!==curBase){ document.querySelectorAll("#basemaps button").forEach(x=>{ if(x.textContent===decodeURIComponent(b)) x.click(); }); }
    if(l!==undefined){ const want = new Set(l.split(",").filter(Boolean)); for(const t in layerObjs){ const o=layerObjs[t]; const on = want.has(t); if(map.hasLayer(o.lyr)!==on){ if(o.box){ o.box.checked=on; o.box.onchange(); } else { on?o.lyr.addTo(map):map.removeLayer(o.lyr); } } } }
    map.setView([+la,+lo], +z); return true;
  }
  setTimeout(()=>{ if(apply()) clearInterval(window.fitTimer); armed = true; }, 700);
  map.on("moveend", ()=>{ if(!armed || /#(asset|work|at)=/.test(location.hash)) return; history.replaceState(null, "", enc()); });
})();
