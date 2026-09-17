// Exports the map's feature data for the field app (field-app/): one JSON with every core + ops feature and the registry.
// Run after data.js / ops-data.js / buildings-data.js change:  node app-export.mjs
import fs from "node:fs"; import vm from "node:vm";
const ctx = {document:{}}; ctx.window = ctx; vm.createContext(ctx);
for(const f of ["data.js","ops-data.js","buildings-data.js","registry.js"]) vm.runInContext(fs.readFileSync(f,"utf8").replace(/^const /gm,"var ")+"\n", ctx, {filename:f});
const GROUPS = ctx.GROUPS, T_EN = ctx.T_EN, G_EN = ctx.G_EN;
const src = Object.assign({}, ctx.DATA, ctx.OPSDATA, ctx.BUILDINGDATA);
const layers = [], features = [];
for(const [group, , items] of GROUPS){
  for(const [key, title, kind, color, opt] of items){
    layers.push({key, title, title_en:T_EN[key]||title, group, group_en:G_EN[group]||group, kind, color, cat:(opt&&opt.cat)||null, colors:(opt&&opt.colors)||null});
    const fc = src[key]; if(!fc||!fc.features) continue;
    for(const f of fc.features){ if(!f.geometry) continue; const p = f.properties||{};
      const keep = {}; for(const k of ["name","asset_id","status","category","year","species","note","notes","tipo","uso","estado","capacity_m3","m","area_ha","site"]) if(p[k]!=null) keep[k]=p[k];
      features.push({l:key, n:p.name||p.asset_id||"", p:keep, g:f.geometry}); }
  }
}
const out = {generated:new Date().toISOString(), site:"edenrise", layers, features};
fs.writeFileSync("app-data.json", JSON.stringify(out));
console.log("layers", layers.length, "features", features.length, "bytes", fs.statSync("app-data.json").size);
