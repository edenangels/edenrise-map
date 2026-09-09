// Portfolio registry — one entry per property. Loaded first on every page (before any data file).
// SITE drives centre/zoom, local tile sets, data files, live feeds and the worker scope (every API call carries ?site=).
// Adding a property = one entry here + its sites/<id>/data.js (exported from that property's GeoPackage).
// The page URL selects the property: ?site=malhao. No parameter = EdenRise. Shared links keep the parameter.
(function(){
const SITES = {
  edenrise: {
    id:"edenrise", name:"EdenRise", place:{pt:"Herdade · Odemira",en:"Estate · Odemira"},
    ttl:{pt:"EdenRise — Herdade",en:"EdenRise — Estate"}, sub:{pt:"Mapa vivo da propriedade · dados 2026-09",en:"Living map of the property · data 2026-09"},
    ttl3d:{pt:"EdenRise — Herdade 3D",en:"EdenRise — Estate 3D"},
    centre:[37.512,-8.645], zoom:14.3, zoom3d:14.3, pitch:52, bearing:-20,
    bbox:[-8.65749,37.50061,-8.63173,37.52273], tileBounds:[-8.661,37.497,-8.628,37.526],
    data:{core:"data.js?v=0737499e"},                                   // EdenRise pages list their own analysis files inline (stamped)
    tiles:{ortho:"ortho2025", hillshade:"hillshade", terrain:"terrain", surface:"surface", contours:"contours"}, ortho:{label:"DGT 2025", year:"2025", attr:"Ortofotos 2025 © DGT", maxNative:20}, terrainEncoding:"mapbox", terrainMaxzoom:16,
    pointcloud:"https://edenangels.github.io/edenrise-3d/tiles/tileset.json", roofs:"roofs.json", permaBase:"perma/", contoursBase:"contours/", downloadsBase:"downloads/",
    ipma:"0211", concelho:"Odemira",
    flags:{perma:true, lidar:true, climate:true, labels:true},
    views3d:[["Casa","Main house",[-8.6412,37.5148],17.2,64,-30],["Moinhos","Mills",[-8.6455,37.5165],17,60,25],["Norte","North",[-8.6485,37.5205],16,58,-10],["Sul","South",[-8.6440,37.5040],16,58,160],["Vale","Valley",[-8.6395,37.5100],16.4,66,-70]],
    fly3d:[[[-8.652,37.508],15.2,65,-60],[[-8.641,37.516],15.4,62,40]],
    gridOrigin:[37.50061,-8.65749]
  },
  malhao: {
    id:"malhao", name:"Malhão Pardo", place:{pt:"Herdade · Odemira",en:"Estate · Odemira"},
    ttl:{pt:"Malhão Pardo — Herdade",en:"Malhão Pardo — Estate"}, sub:{pt:"Mapa vivo da propriedade · dados 2026-09",en:"Living map of the property · data 2026-09"},
    ttl3d:{pt:"Malhão Pardo — Herdade 3D",en:"Malhão Pardo — Estate 3D"},
    centre:[37.5939,-8.7019], zoom:16, zoom3d:15.6, pitch:55, bearing:-15,
    bbox:[-8.7069,37.5873,-8.6978,37.5951], tileBounds:[-8.7129,37.5813,-8.6918,37.6011],
    data:{core:"sites/malhao/data.js?v=23c6392b", files:{                 // this property's products (SITE=malhao engines); each page loads the ones it lists, as for EdenRise
      "sat-data.js":"sites/malhao/sat-data.js?v=107c40b0", "alerts-data.js":"sites/malhao/alerts-data.js?v=0d18897f", "habitat-data.js":"sites/malhao/habitat-data.js?v=58d66d7e",
      "ops-data.js":"sites/malhao/ops-data.js?v=8056c087", "buildings-data.js":"sites/malhao/buildings-data.js?v=e8b85609", "suitability-data.js":"sites/malhao/suitability-data.js?v=120e7fc4",
      "defensible-data.js":"sites/malhao/defensible-data.js?v=87fcc7b5", "water-data.js":"sites/malhao/water-data.js?v=f2856f92", "trees-data.js":"sites/malhao/trees-data.js?v=6efe2d6f",
      "hydro-data.js":"sites/malhao/hydro-data.js?v=b4a66d9c", "dam-data.js":"sites/malhao/dam-data.js?v=42a5fea3"}},
    climate:"sites/malhao/climate.json",
    tiles:{ortho:"sites/malhao/ortho2025", terrain:"sites/malhao/terrain50", hillshade:"sites/malhao/hillshade50", surface:"sites/malhao/surface", contours:"sites/malhao/contours"},
    ortho:{label:"DGT 2025", year:"2025", attr:"Ortofotos 2025 © DGT", maxNative:20}, terrainEncoding:"mapbox", terrainMaxzoom:16,
    pointcloud:"https://edenangels.github.io/edenrise-3d/tiles-malhao/tileset.json", roofs:"sites/malhao/roofs.json",
    permaBase:"sites/malhao/perma/", contoursBase:"sites/malhao/contours/", downloadsBase:"sites/malhao/downloads/",   // LiDAR 2024 + ORTOS-2025 products (SITE=malhao engines)
    ipma:"0211", concelho:"Odemira",
    flags:{climate:true, lidar:true, perma:true},
    views3d:[["Casa","Main house",[-8.7019,37.5939],17.2,62,-25],["Norte","North",[-8.7030,37.5960],16.4,58,10],["Sul","South",[-8.7010,37.5900],16.4,60,170]],
    fly3d:[[[-8.7060,37.5900],15.4,65,-60],[[-8.7005,37.5950],16,62,40]],
    gridOrigin:[37.5873,-8.7069]
  }
};
const q = new URLSearchParams(location.search).get("site");
const id = (q && SITES[q]) ? q : "edenrise";
window.SITES = SITES; window.SITE = SITES[id]; window.SITE_ID = id;
// hrefs between pages keep the property; the worker always receives the explicit scope
window.siteQ = (sep) => id === "edenrise" ? "" : (sep || "?") + "site=" + id;
window.siteHref = (page) => page + (id === "edenrise" ? "" : (page.includes("?") ? "&" : "?") + "site=" + id);
window.apiSite = (path) => path + (path.includes("?") ? "&" : "?") + "site=" + id;
// data loader: a page declares the EdenRise file list (kept stamped by stamp.py); another property gets its own core
// file in place of data.js and only the analysis files it actually has (SITE.data.files), so nothing foreign is drawn.
window.edrLoadData = function(list){
  const own = SITE.data || {}; const CORE = "data" + ".js";   // built at runtime so stamp.py never rewrites this comparison
  const seen = new Set();
  for(const f of list){
    const base = f.split("?")[0]; let src = null;
    if(id === "edenrise") src = f;
    else if(base === CORE) src = own.core;
    else if(own.files && own.files[base]) src = own.files[base];   // the page asked for it and this property has its own copy
    if(src && !seen.has(src)){ seen.add(src); document.write('<script src="' + src + '"><\/script>'); }
  }
};
// lazy table for the current property: its own map, or EdenRise's LAZY (LiDAR products) where those exist
window.edrLazy = (t) => {
  if(SITE.lazy && SITE.lazy[t]) return SITE.lazy[t];
  if(!(SITE.flags && SITE.flags.lidar) || typeof LAZY === "undefined" || !LAZY[t]) return undefined;
  if(id === "edenrise") return LAZY[t];
  const z = LAZY[t]; const base = String(z.f).split("?")[0]; const own = (SITE.data && SITE.data.files) || {};
  return Object.assign({}, z, {f: own[base] || ("sites/" + id + "/" + base), msg: undefined});   // same lazy table, this property's copy of the file; generic "Loading…" (counts are EdenRise's)
};
document.documentElement.dataset.site = id;
})();
