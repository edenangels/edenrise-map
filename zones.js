// EdenRise map — zones: the camera knows where you are standing.
//
// A building footprint, a paddock, a fenced area or any team-drawn zone is a place with things inside it: pumps,
// valves, meters, tanks, gates. Outside the pump room those things are noise; inside it they are the whole point.
// So the camera view switches modes by GPS: in the open it shows the estate's items with full labels; inside a zone it
// shows only that zone's items, each with its live state — last service, parts on order, open problems — and a tap
// opens the item's card, where the team records what they did. Problems become tasks, and tasks are what ClickUp
// mirrors (scripts/clickup_sync.py), so the field, the map and ClickUp tell one story.
(function(){
const EN = (typeof LANG !== "undefined") && LANG === "en";
const API = "https://edenrise-brain.edenrise.workers.dev"; const SITE = (typeof SITE_ID !== "undefined") ? SITE_ID : "edenrise";
const T = EN ? {service:"Service done", part:"Part ordered", problem:"Problem", reading:"Reading", askService:"What was done?", askPart:"Which part, from whom?", askProblem:"What is wrong?", askReading:"Reading (number)", saved:"Recorded", err:"Could not record", problemTask:"Problem", open:"open", days:"d", noState:"no record yet", parts:"part", partsP:"parts", problems:"problem", problemsP:"problems", service:"service", serviceL:"last service", never:"never serviced"}
             : {service:"Serviço feito", part:"Peça encomendada", problem:"Problema", reading:"Leitura", askService:"O que foi feito?", askPart:"Que peça, a quem?", askProblem:"O que está mal?", askReading:"Leitura (número)", saved:"Registado", err:"Não consegui registar", problemTask:"Problema", open:"aberto", days:"d", noState:"sem registo", parts:"peça", partsP:"peças", problems:"problema", problemsP:"problemas", service:"serviço", serviceL:"último serviço", never:"nunca revisto"};
const auth = () => window.edrAuth || {key:"", role:"viewer", actor:""};
const say = m => window.toast && toast(m);
/* the layers whose areas count as places you can be inside */
const ZONE_LAYERS = ["building_footprints", "grazing_parks_pg", "agri_features_pg", "power_pg", "prop_etar_pg", "orchards_pg"];
const ZONE_PRESETS = ["edificio", "zona", "pasto", "infraestrutura", "tanque"];
function coreRef(t, f){ if(window.edrRefOf) return edrRefOf(t, f.properties || {}).ref; const p = f.properties || {}; return p.asset_id ? ("asset:" + p.asset_id) : (p.uid ? "u:" + p.uid : `${t}:${p.key || p.name || p.tree_name || "?"}`); }
function nameOf(f, t){ const p = f.properties || {}; return p.name || p.asset_id || p.tree_name || (typeof title_i18n === "function" ? title_i18n(t, t) : t); }
function fidOf(t, f){ return t === "propostas" ? (f.properties || {}).id : coreRef(t, f); }
function polyOf(f){ const g = f.geometry; if(!g) return null; if(g.type === "Polygon") return f; if(g.type === "MultiPolygon") return {type:"Feature", properties:f.properties, geometry:{type:"Polygon", coordinates:g.coordinates[0]}}; return null; }
/* zones at a position: inside first, then within `near` metres of the edge */
function zonesAt(ll, near){
  if(!window.turf || !ll) return []; near = near == null ? 15 : near; const pt = turf.point([ll[1], ll[0]]); const out = [];
  const consider = (t, f) => { const pf = polyOf(f); if(!pf) return; let inside = false, d = Infinity; try{ inside = turf.booleanPointInPolygon(pt, pf); if(!inside) d = turf.pointToLineDistance(pt, turf.polygonToLine(pf).features ? turf.polygonToLine(pf).features[0] : turf.polygonToLine(pf), {units:"meters"}); }catch(e){ return; }
    if(inside || d <= near) out.push({t, f, fid:fidOf(t, f), name:nameOf(f, t), inside, d:inside ? 0 : d, poly:pf}); };
  try{ for(const t of ZONE_LAYERS){ const fc = typeof DATA !== "undefined" && DATA[t]; if(!fc || !fc.features) continue; const bb = [ll[1] - 0.002, ll[0] - 0.002, ll[1] + 0.002, ll[0] + 0.002]; for(const f of fc.features){ try{ const b = turf.bbox(f); if(b[2] < bb[0] || b[0] > bb[2] || b[3] < bb[1] || b[1] > bb[3]) continue; }catch(e){ continue; } consider(t, f); } } }catch(e){}
  try{ for(const f of (window.edrEdit && edrEdit.feats ? edrEdit.feats() : [])){ const p = f.properties || {}; if(p.op === "retire" || p.status === "rejeitado") continue; if(!ZONE_PRESETS.includes(p.preset)) continue; consider("propostas", f); } }catch(e){}
  return out.sort((a, b) => (a.inside === b.inside ? a.d - b.d : a.inside ? -1 : 1));
}
/* what belongs to a zone: items marked in it, and points that sit inside it */
function children(zone){
  const out = []; const seen = new Set();
  const push = (t, f) => { const fid = fidOf(t, f); if(!fid || seen.has(fid) || fid === zone.fid) return; seen.add(fid); const g = f.geometry; const c = g.type === "Point" ? [g.coordinates[1], g.coordinates[0]] : (window.turf ? (() => { const q = turf.centroid(f).geometry.coordinates; return [q[1], q[0]]; })() : null); if(c) out.push({t, f, fid, name:nameOf(f, t), c}); };
  try{ for(const f of (window.edrEdit && edrEdit.feats ? edrEdit.feats() : [])){ const p = f.properties || {}; if(p.op === "retire" || p.status === "rejeitado") continue; if(p.zone === zone.fid) push("propostas", f); else if(f.geometry && f.geometry.type === "Point" && window.turf && turf.booleanPointInPolygon(f.geometry.coordinates, zone.poly)) push("propostas", f); } }catch(e){}
  try{ for(const t in DATA){ const fc = DATA[t]; if(!fc || !fc.features || ZONE_LAYERS.includes(t)) continue; for(const f of fc.features){ if(!f.geometry || f.geometry.type !== "Point") continue; try{ if(turf.booleanPointInPolygon(f.geometry.coordinates, zone.poly)) push(t, f); }catch(e){} } } }catch(e){}
  return out;
}
/* ---------- the item's live state, from its timeline ---------- */
const cache = new Map(); const TTL = 60000;
async function status(fid){
  const hit = cache.get(fid); if(hit && Date.now() - hit.at < TTL) return hit.v;
  let notes = []; try{ const d = await fetch(`${API}/item/${encodeURIComponent(fid)}`).then(r => r.json()); notes = d.notes || []; }catch(e){}
  const v = derive(notes); cache.set(fid, {at:Date.now(), v}); return v;
}
function derive(notes){
  const byT = [...notes].sort((a, b) => String(a.at).localeCompare(String(b.at))); const now = Date.now(); const day = 86400000;
  const last = k => { const n = byT.filter(x => x.kind === k).pop(); return n ? new Date(n.at).getTime() : null; };
  const lastService = last("servico"); const problems = byT.filter(x => x.kind === "problema" && (!lastService || new Date(x.at).getTime() > lastService)).length;
  const parts = byT.filter(x => x.kind === "peca" && now - new Date(x.at).getTime() < 90 * day && (!lastService || new Date(x.at).getTime() > lastService)).length;
  const reading = byT.filter(x => x.kind === "leitura").pop();
  const bits = []; if(problems) bits.push(`⚠${problems}`); if(parts) bits.push(`📦${parts}`); if(lastService) bits.push(`🔧${Math.round((now - lastService) / day)}${T.days}`); if(reading) bits.push(`${reading.text.split(":").pop().trim()}`);
  const level = problems ? "problem" : parts ? "waiting" : lastService ? "ok" : "none";
  return {lastService, problems, parts, reading:reading ? reading.text : null, summary:bits.join(" · "), level, n:notes.length};
}
function invalidate(fid){ cache.delete(fid); }
/* ---------- recording: one tap each, into the item's timeline; a problem also becomes a task ---------- */
const NQ = "edr_note_q"; const nqget = () => { try{ return JSON.parse(localStorage.getItem(NQ) || "[]"); }catch(e){ return []; } }; const nqset = a => { try{ localStorage.setItem(NQ, JSON.stringify(a)); }catch(e){} };
async function sendNote(it){ const r = await fetch(`${API}/item/${encodeURIComponent(it.fid)}/notes`, {method:"POST", headers:{"Content-Type":"application/json", "X-Role-Key":auth().key}, body:JSON.stringify({text:it.text, kind:it.kind, actor:it.actor, site:SITE, ...(it.extra || {})})}); if(!r.ok) throw new Error(r.status); }
async function flushNotes(){ const q = nqget(); if(!q.length || !navigator.onLine || !auth().key) return; const left = []; for(const it of q){ try{ await sendNote(it); invalidate(it.fid); }catch(e){ left.push(it); } } nqset(left); if(left.length < q.length) say(`${q.length - left.length} ${EN ? "field records sent" : "registos de campo enviados"}`); }
window.addEventListener("online", flushNotes); setTimeout(flushNotes, 6000);
async function record(fid, kind, text, extra){
  const a = auth(); if(!a.key){ say(EN ? "Sign in first" : "Entra primeiro"); return false; }
  const it = {fid, kind, text, actor:a.actor, extra, at:new Date().toISOString()};
  try{ await sendNote(it); invalidate(fid); say(T.saved); document.dispatchEvent(new CustomEvent("edr-item-note", {detail:{fid, kind}})); return true; }
  catch(e){ nqset([...nqget(), it]); say(EN ? "No signal — saved on this device, will send later" : "Sem rede — guardado neste aparelho, envia depois"); return true; }
}
async function act(kind, fid, name, latlng){
  const q = kind === "servico" ? T.askService : kind === "peca" ? T.askPart : kind === "problema" ? T.askProblem : T.askReading; const v = prompt(q, ""); if(v === null || !v.trim()) return;
  const text = kind === "leitura" ? `${name}: ${v.trim()}` : v.trim(); const ok = await record(fid, kind, text);
  if(ok && kind === "problema" && window.edrTasks){ edrTasks.newTask({feature_id:fid, latlng, title:`⚠ ${name}: ${v.trim().slice(0, 60)}`, detail:`${EN ? "Problem reported" : "Problema reportado"} ${new Date().toLocaleString(EN ? "en-GB" : "pt-PT")} · ${auth().actor}:\n${v.trim()}`}); }
}
/* the quick-action row for an item card */
function actionsHTML(){ return `<button data-za="servico">🔧 ${T.service}</button><button data-za="peca">📦 ${T.part}</button><button data-za="problema" style="border-color:var(--ember)">⚠ ${T.problem}</button><button data-za="leitura">🔢 ${T.reading}</button>`; }
function bindActions(box, fid, name, latlng, refresh){ box.querySelectorAll("[data-za]").forEach(b => b.onclick = async () => { await act(b.dataset.za, fid, name, latlng); refresh && refresh(); }); }
window.edrZones = {queued:nqget, flushNotes, zonesAt, children, status, derive, record, act, actionsHTML, bindActions, fidOf, invalidate, ZONE_LAYERS};
})();
