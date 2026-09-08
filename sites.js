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
    tiles:{ortho:"ortho2025", hillshade:"hillshade", terrain:"terrain", surface:"surface", contours:"contours"},
    pointcloud:"https://edenangels.github.io/edenrise-3d/tiles/tileset.json", roofs:"roofs.json",
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
    bbox:[-8.7069,37.5873,-8.6978,37.5951], tileBounds:null,
    data:{core:"sites/malhao/data.js?v=23c6392b", files:{}},             // files: maps an EdenRise analysis file name to this property's own copy, when that product exists here
    tiles:{}, pointcloud:null, roofs:null,                    // no LiDAR / 2025 ortho yet → Terrarium terrain + live DGT 2023 ortho
    ipma:"0211", concelho:"Odemira",
    flags:{},
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
  const own = SITE.data || {};
  for(const f of list){
    const base = f.split("?")[0]; let src = null;   // CORE is built at runtime so stamp.py never rewrites this comparison
    const CORE = "data" + ".js";
    if(id === "edenrise") src = f;
    else if(base === CORE) src = own.core;
    else if(own.files && own.files[base]) src = own.files[base];
    if(src) document.write('<script src="' + src + '"><\/script>');
  }
};
document.documentElement.dataset.site = id;
})();
