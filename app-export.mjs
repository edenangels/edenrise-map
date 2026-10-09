// Exports the map's feature data for the field app (field-app/): one JSON with every core + ops feature and the registry.
// Run after data.js / ops-data.js / buildings-data.js change:  node app-export.mjs
import fs from "node:fs"; import vm from "node:vm";
const ctx = {document:{}}; ctx.window = ctx; vm.createContext(ctx);
for(const f of ["data.js","ops-data.js","buildings-data.js","registry.js"]) vm.runInContext(fs.readFileSync(f,"utf8").replace(/^const /gm,"var ")+"\n", ctx, {filename:f});
const GROUPS = ctx.GROUPS, T_EN = ctx.T_EN, G_EN = ctx.G_EN;
const src = Object.assign({}, ctx.DATA, ctx.OPSDATA, ctx.BUILDINGDATA);
const layers = [], features = [];
/* the item's identity, same rule as the web card (card.js edrRefOf): asset id › uid › footprint → its building's uid › layer:name,
   plus every older key it was filed under, so the phone opens the very same record the web does */
const ptTitle = t => { for(const [, , ls] of GROUPS) for(const l of ls) if(l[0] === t) return l[1]; return null; };
const bfid = new Map(); for(const f of ((src.buildings_pt || {}).features || [])) if(f.properties && f.properties.fid != null) bfid.set(+f.properties.fid, f);
function refOf(t, p){
  if(p.asset_id) return {ref:"asset:" + p.asset_id, aliases:[]};
  const nm = p.key || p.name || p.tree_name || "?"; const legacy = new Set([`${t}:${nm}`]); const pt = ptTitle(t), en = T_EN[t]; if(pt) legacy.add(`${pt}:${nm}`); if(en) legacy.add(`${en}:${nm}`);
  let uid = p.uid; if(!uid && t === "building_footprints" && p.core_fid != null){ const b = bfid.get(+p.core_fid); if(b){ uid = b.properties.uid; const bn = b.properties.name || "?"; legacy.add(`buildings_pt:${bn}`); const bpt = ptTitle("buildings_pt"), ben = T_EN.buildings_pt; if(bpt) legacy.add(`${bpt}:${bn}`); if(ben) legacy.add(`${ben}:${bn}`); } }
  const ref = uid ? "u:" + uid : `${t}:${nm}`; legacy.delete(ref); return {ref, aliases:[...legacy]};
}
for(const [group, , items] of GROUPS){
  for(const [key, title, kind, color, opt] of items){
    layers.push({key, title, title_en:T_EN[key]||title, group, group_en:G_EN[group]||group, kind, color, cat:(opt&&opt.cat)||null, colors:(opt&&opt.colors)||null});
    const fc = src[key]; if(!fc||!fc.features) continue;
    for(const f of fc.features){ if(!f.geometry) continue; const p = f.properties||{};
      const keep = {}; for(const k of ["uid","name","asset_id","status","category","year","species","note","notes","tipo","uso","estado","capacity_m3","m","area_ha","site"]) if(p[k]!=null) keep[k]=p[k];
      const id = refOf(key, p); features.push({l:key, n:p.name||p.asset_id||"", p:keep, g:f.geometry, r:id.ref, ...(id.aliases.length ? {a:id.aliases} : {})}); }
  }
}
const out = {generated:new Date().toISOString(), site:"edenrise", layers, features};
fs.writeFileSync("app-data.json", JSON.stringify(out));
console.log("layers", layers.length, "features", features.length, "bytes", fs.statSync("app-data.json").size);
