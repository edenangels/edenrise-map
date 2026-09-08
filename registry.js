// Shared layer registry for the 2D map (index.html) and the 3D twin (3d.html): GROUPS (category → layers), G_EN / T_EN (English names), data merges.
// Keep this the single source of truth — both maps build their category trees from it.
const GROUPS = [
 ["10 · Cadastro & Legal", true, [
   ["cadastre_parcels","Parcelas","pg","#ffffff",{fill:"rgba(0,0,0,0)",w:2.5}],
   ["cadastre_boundaries_ln","Limites (partilha)","ln","#ffffff",{dash:"6 5",w:2}],
   ["subsidy_parcels","Parcelas de subsídio","pg","#76ff03",{fill:"rgba(118,255,3,.10)",w:2}]]],
 ["20 · Edifícios", true, [
   ["buildings_pt","Edifícios (licenciamento)","pt","#4caf50",{cat:"status",colors:{registado:"#4caf50",nao_registado_licenciado:"#ff3d3d",por_classificar:"#ffc107"},r:7}]]],
 ["30 · Água", true, [
   ["water_sources_pt","Furos & poços","pt","#03a9f4",{r:6}],
   ["water_storage_pt","Tanques & charcas","pt","#00bcd4",{r:6}],
   ["water_network_pt","Rede água — pontos","pt","#81d4fa",{r:4}],
   ["water_network_ln","Condutas de água","ln","#29b6f6",{w:2.2}],
   ["wastewater_pt","Fossas","pt","#8d6e63",{r:6}]]],
 ["40 · Energia & Telecom", true, [
   ["power_pt","Eletricidade — pontos","pt","#ffab00",{r:5}],
   ["power_ln","Eletricidade — linhas","ln","#ffd600",{w:2.4}],
   ["power_pg","Eletricidade — áreas","pg","#ffd600",{fill:"rgba(255,214,0,.12)",w:1.6}],
   ["telecom_pt","Telecom — pontos","pt","#e040fb",{r:4}],
   ["telecom_ln","Telecom — linhas","ln","#e040fb",{dash:"5 5",w:1.8}]]],
 ["50 · Agricultura", true, [
   ["agri_features_pt","Produção — pontos","pt","#a5d6a7",{r:4}],
   ["agri_features_ln","Produção — linhas","ln","#66bb66",{w:1.8}],
   ["agri_features_pg","Produção — zonas","pg","#66bb6a",{fill:"rgba(102,187,106,.30)",w:1.6}],
   ["orchards_ln","Pomares — linhas","ln","#9ccc65",{w:1.8}],
   ["orchards_pg","Pomares — zonas","pg","#9ccc65",{fill:"rgba(156,204,101,.30)",w:1.6}],
   ["irrigation_pt","Rega — pontos","pt","#00e5ff",{r:3.5}],
   ["irrigation_ln","Rega — linhas","ln","#00e5ff",{dash:"4 4",w:1.6}],
   ["irrigation_pg","Rega — zonas","pg","#00e5ff",{fill:"rgba(0,229,255,.15)",w:1.4,dash:"4 4"}],
   ["grazing_parks_pg","Parques de pastoreio","pg","#d4e157",{fill:"rgba(212,225,87,.22)",w:2}]]],
 ["60 · Floresta & Ecologia", true, [
   ["tree_actions_pt","Cortes de árvores (ano)","pt","#ff9800",{cat:"year",colors:{2024:"#bdbdbd",2025:"#ff9800",2026:"#ffeb3b"},other:"#eceff1",r:6}],
   ["tree_actions_ln","Cortes — linhas","ln","#ff9800",{dash:"5 4",w:2}],
   ["hedges_pt","Sebes — pontos","pt","#2e7d32",{r:5}],
   ["hedges_ln","Sebes — linhas","ln","#2e7d32",{w:2.6}],
   ["hedges_pg","Sebes — zonas","pg","#2e7d32",{fill:"rgba(46,125,50,.35)",w:1.6}],
   ["species_inventory_pt","Espécies — pontos","pt","#ba68c8",{r:5}],
   ["species_inventory_ln","Espécies — linhas","ln","#ba68c8",{w:1.8}],
   ["species_inventory_pg","Espécies — zonas","pg","#ba68c8",{fill:"rgba(186,104,200,.25)",w:1.4}],
   ["beekeeping_pt","Apicultura — pontos","pt","#ffb300",{r:5}],
   ["beekeeping_ln","Apicultura — linhas","ln","#ffb300",{w:1.8}],
   ["beekeeping_pg","Apicultura — zonas","pg","#ffb300",{fill:"rgba(255,179,0,.10)",w:1.2}],
   ["fire_mgmt_pt","Gestão fogo — pontos","pt","#ff7043",{r:6}],
   ["fire_mgmt_pg","Gestão fogo — zonas","pg","#ff7043",{fill:"rgba(255,112,67,.18)",w:1.8,dash:"6 4"}],
   ["paths_ln","Caminhos","ln","#d7ccc8",{dash:"6 4",w:2}]]],
 ["70 · Propostas", false, [
   ["prop_etar_pt","ETAR & duches — pontos","pt","#80deea",{r:5}],
   ["prop_etar_ln","ETAR & duches — linhas","ln","#26a69a",{dash:"5 4",w:2}],
   ["prop_etar_pg","ETAR & duches — zonas","pg","#4db6ac",{fill:"rgba(77,182,172,.22)",w:1.8,dash:"6 4"}],
   ["prop_water_deposits_pt","Depósitos futuros — pontos","pt","#40c4ff",{r:5}],
   ["prop_water_deposits_ln","Depósitos futuros — linhas","ln","#40c4ff",{dash:"5 4",w:1.8}],
   ["prop_water_deposits_pg","Depósitos futuros — zonas","pg","#40c4ff",{fill:"rgba(64,196,255,.18)",w:1.6,dash:"6 4"}],
   ["prop_reforestation_ln","Reflorestação — linhas","ln","#aed581",{dash:"5 4",w:2}],
   ["prop_reforestation_pg","Reflorestação — zonas","pg","#aed581",{fill:"rgba(174,213,129,.18)",w:1.6,dash:"6 4"}]]],
 ["00 · Notas", false, [
   ["notes_pt","Notas / informações","pt","#ffffff",{r:5}]]],
 ["OPS · Conformidade & Ativos", false, [
   ["asset_registry","Ativos (EDR-…)","pt","#4caf50",{cat:"category",colors:{BLD:"#4caf50",WTR:"#03a9f4",STO:"#0288d1",WWT:"#8d6e63",PWR:"#ffab00",TLC:"#e040fb",IRR:"#00e5ff"},r:6}],
   ["fire_fuel_strips","Faixas combustível (DL 82/2021)","pg","#ff5722",{fill:"rgba(255,87,34,.14)",w:1.8}],
   ["boundary_deviations","Desvios de limite (vs cadastro)","pg","#e91e63",{fill:"rgba(233,30,99,.30)",w:1.4}],
   ["tree_permits","Cortes a licenciar (ICNF)","pt","#f44336",{r:6}]]],
 ["LiDAR 2024 · Terreno & árvores", false, [
   ["hydro_streams","Linhas de água (LiDAR 0,5 m, por ordem)","ln","#40c4ff",{cat:"order",colors:{1:"#80deea",2:"#40c4ff",3:"#2196f3",4:"#1565c0",5:"#0d47a1"},other:"#40c4ff",w:2}],
   ["hydro_catchments","Sub-bacias (LiDAR 0,5 m) — escoamento","pg","#80deea",{fill:"rgba(128,222,234,.10)",w:1.2}],
   ["wet_zones_50cm","Zonas húmidas (TWI 0,5 m)","pg","#29b6f6",{fill:"rgba(41,182,246,.35)",w:.8}],
   ["dam_sites","Barragens/charcas candidatas (modelo)","pt","#00e5ff",{cat:"order",colors:{2:"#80deea",3:"#00e5ff",4:"#00b8d4",5:"#0097a7"},other:"#00e5ff",r:7}],
   ["dam_walls","Muros candidatos","ln","#ffeb3b",{w:3}],
   ["dam_pools","Albufeiras candidatas (cota recomendada)","pg","#29b6f6",{fill:"rgba(41,182,246,.45)",w:1}],
   ["tree_tops","Árvores individuais","pt","#2e7d32",{r:2.5}],
   ["tree_crowns","Copas — vigor 2025","pg","#43a047",{cat:"vigour",colors:{vigoroso:"#43a047",moderado:"#fdd835",stressado:"#e53935"},other:"#9e9e9e",fill:"rgba(67,160,71,.45)",w:.6}],
   ["tree_health","Copas — tendência NDVI 2018–26 (declínio)","pg","#e53935",{cat:"health",colors:{declining:"#e53935",improving:"#43a047",stable:"rgba(158,158,158,.35)"},other:"rgba(0,0,0,0)",fill:"rgba(229,57,53,.45)",w:.6}]]],
 ["🏗️ Edifícios & planeamento", false, [
   ["building_footprints","Implantações de edifícios (LiDAR)","pg","#ffcc80",{cat:"status",colors:{registado:"#66bb6a",nao_registado_licenciado:"#ef5350",por_classificar:"#ffca28"},fill:"rgba(255,204,128,.55)",w:1.4}],
   ["suitability_zones","Zonas aptas para construir (score ≥65)","pg","#ff8f00",{fill:"rgba(255,213,79,.45)",w:1.8}]]],
 ["🔥💧🌿 Análises", false, [
   ["defensible_space","Espaço defensável (30 m) — fraca/moderada/boa","pg","#ff7043",{cat:"classe",colors:{fraca:"#e53935",moderada:"#ffb300",boa:"#43a047"},fill:"rgba(255,112,67,.25)",w:1.4}],
   ["wet_zones","Zonas de acumulação de água (TWI)","pg","#29b6f6",{fill:"rgba(41,182,246,.35)",w:1.2}],
   ["track_crossings","Travessias caminho×linha de água (risco)","pt","#ff5252",{cat:"risco",colors:{alto:"#e53935",medio:"#ffb300",baixo:"#8bc34a"},r:6}],
   ["catchments_runoff","Bacias — escoamento a 50 mm","pg","#80deea",{fill:"rgba(128,222,234,.12)",w:1.2}],
   ["habitat_cos2025","Ocupação do solo COS 2025","pg","#a1887f",{fill:"rgba(161,136,127,.30)",w:.8}]]],
];
Object.assign(DATA, typeof DEFDATA !== "undefined" ? DEFDATA : {});
Object.assign(DATA, typeof WATERDATA !== "undefined" ? WATERDATA : {});
if (typeof HABDATA !== "undefined") DATA.habitat_cos2025 = HABDATA.habitat_cos2025;
Object.assign(DATA, typeof OPSDATA !== "undefined" ? OPSDATA : {});
Object.assign(DATA, typeof HYDRODATA !== "undefined" ? HYDRODATA : {});
Object.assign(DATA, typeof DAMDATA !== "undefined" ? DAMDATA : {});
Object.assign(DATA, typeof TREEDATA !== "undefined" ? TREEDATA : {});
window.edrAlias = d => { if(d && d.tree_crowns && !d.tree_health) d.tree_health = d.tree_crowns; return d; }; edrAlias(DATA);
Object.assign(DATA, typeof BUILDINGDATA !== "undefined" ? BUILDINGDATA : {});
Object.assign(DATA, typeof SUITDATA !== "undefined" ? SUITDATA : {});
// ── bilingual UI ──────────────────────────────────────────────
const G_EN = {"10 · Cadastro & Legal":"10 · Cadastre & Legal","20 · Edifícios":"20 · Buildings",
 "30 · Água":"30 · Water","40 · Energia & Telecom":"40 · Energy & Telecom",
 "50 · Agricultura":"50 · Agriculture","60 · Floresta & Ecologia":"60 · Forestry & Ecology",
 "70 · Propostas":"70 · Proposals","00 · Notas":"00 · Notes",
 "OPS · Conformidade & Ativos":"OPS · Compliance & Assets",
 "LiDAR 2024 · Terreno & árvores":"LiDAR 2024 · Terrain & trees",
 "🏗️ Edifícios & planeamento":"🏗️ Buildings & planning",
 "🔥💧🌿 Análises":"🔥💧🌿 Analyses"};
const T_EN = {cadastre_parcels:"Land parcels",cadastre_boundaries_ln:"Boundary lines (partilha)",
 subsidy_parcels:"Subsidy parcels",buildings_pt:"Buildings (licensing status)",
 water_sources_pt:"Boreholes & wells",water_storage_pt:"Tanks, ponds & dams",
 water_network_pt:"Water network — points",water_network_ln:"Water pipes",
 wastewater_pt:"Septic tanks",power_pt:"Electricity — points",power_ln:"Electricity — lines",
 power_pg:"Electricity — areas",telecom_pt:"Telecom — points",telecom_ln:"Telecom — lines",
 agri_features_pt:"Crops — points",agri_features_ln:"Crops — lines",agri_features_pg:"Crops — zones",
 orchards_ln:"Orchards — lines",orchards_pg:"Orchards — zones",
 irrigation_pt:"Irrigation — points",irrigation_ln:"Irrigation — lines",irrigation_pg:"Irrigation — zones",
 grazing_parks_pg:"Grazing parks",tree_actions_pt:"Tree cuts (by year)",tree_actions_ln:"Tree cuts — lines",
 hedges_pt:"Hedges — points",hedges_ln:"Hedges — lines",hedges_pg:"Hedges — zones",
 species_inventory_pt:"Species inventory — points",species_inventory_ln:"Species inventory — lines",
 species_inventory_pg:"Species inventory — zones",beekeeping_pt:"Beekeeping — points",
 beekeeping_ln:"Beekeeping — lines",beekeeping_pg:"Beekeeping — zones",
 fire_mgmt_pt:"Fire & compost mgmt — points",fire_mgmt_pg:"Fire & compost mgmt — zones",
 paths_ln:"Paths",notes_pt:"Notes / information",
 prop_etar_pt:"WWTP & showers — points",prop_etar_ln:"WWTP & showers — lines",
 prop_etar_pg:"WWTP & showers — zones",prop_water_deposits_pt:"Future water deposits — points",
 prop_water_deposits_ln:"Future water deposits — lines",prop_water_deposits_pg:"Future water deposits — zones",
 prop_reforestation_ln:"Reforestation infra — lines",prop_reforestation_pg:"Reforestation infra — zones",
 asset_registry:"Assets (EDR-…)",fire_fuel_strips:"Fuel-management strips (DL 82/2021)",
 boundary_deviations:"Boundary deviations (vs cadastre)",tree_permits:"Cuts needing ICNF permit",
 hydro_streams:"Streams (LiDAR 0.5 m, by order)",hydro_catchments:"Sub-basins (LiDAR 0.5 m) — runoff",wet_zones_50cm:"Wet zones (TWI 0.5 m)",dam_sites:"Candidate dams / ponds (model)",dam_walls:"Candidate dam walls",dam_pools:"Candidate pools (recommended crest)",tree_tops:"Individual trees",tree_crowns:"Tree crowns — 2025 vigour",tree_health:"Tree crowns — NDVI trend 2018–26 (decline)",
 building_footprints:"Building footprints (LiDAR)",suitability_zones:"Build-suitable zones (score ≥65)",
 defensible_space:"Defensible space (30 m) — poor/moderate/good",wet_zones:"Water pooling zones (TWI)",track_crossings:"Track × stream crossings (risk)",catchments_runoff:"Catchments — runoff at 50 mm",habitat_cos2025:"Land cover COS 2025"};
const CAT_ICON = {
 "10":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/></svg>',
 "20":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11.5 12 4l9 7.5V20H3z"/></svg>',
 "30":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12z"/></svg>',
 "40":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>',
 "50":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20c0-8 5-13 13-13-1 8-6 13-13 13z"/><path d="M4 20c3-4 6-7 10-9"/></svg>',
 "60":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2 6 11h3l-4 6h6v5h2v-5h6l-4-6h3z"/></svg>',
 "70":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="3 2"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>',
 "00":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>',
 "OPS":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l9 4.5v9L12 21l-9-4.5v-9z"/><path d="M12 12l9-4.5M12 12 3 7.5M12 12v9"/></svg>',
 "LiDAR":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 17l6-8 4 5 3-3 5 6z"/></svg>',
 "🏗️":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 21V10l8-6 8 6v11"/><path d="M9 21v-7h6v7"/></svg>',
 "🔥💧🌿":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19h16M4 15l4-4 4 3 4-6 4 4"/></svg>'};
function catIcon(name){ const k=Object.keys(CAT_ICON).find(k=>name.startsWith(k)); return CAT_ICON[k]||CAT_ICON["00"]; }
const LAZY = {tree_tops:{f:"trees-data.js",g:"TREEDATA",msg:["Loading 7,531 trees…","A carregar 7 531 árvores…"]}, tree_crowns:{f:"trees-data.js",g:"TREEDATA",msg:["Loading 7,531 trees…","A carregar 7 531 árvores…"]}, tree_health:{f:"trees-data.js",g:"TREEDATA",msg:["Loading 7,531 trees…","A carregar 7 531 árvores…"]},
  hydro_streams:{f:"hydro-data.js",g:"HYDRODATA"}, hydro_catchments:{f:"hydro-data.js",g:"HYDRODATA"}, wet_zones_50cm:{f:"hydro-data.js",g:"HYDRODATA"}, dam_sites:{f:"dam-data.js",g:"DAMDATA"}, dam_walls:{f:"dam-data.js",g:"DAMDATA"}, dam_pools:{f:"dam-data.js",g:"DAMDATA"}, wet_zones:{f:"water-data.js",g:"WATERDATA"}, track_crossings:{f:"water-data.js",g:"WATERDATA"}, catchments_runoff:{f:"water-data.js",g:"WATERDATA"}, habitat_cos2025:{f:"habitat-data.js",g:"HABDATA"}};
