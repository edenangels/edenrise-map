/* Guides — step-by-step procedures for online jobs (ICNF, IFAP, Finanças…) built from screenshots, with choices that
   branch to different screens depending on the case. Library → player (screenshot, the spot to click, the instruction,
   choices) → editor (paste a screenshot, blur personal data ON THIS DEVICE before anything is uploaded, drag the click
   spot, link choices to steps). Every save keeps the previous version; a guide can be linked to map layers so the
   item's card offers "Open the procedure". Opens from the nav (#guides). */
(function(){
const API = "https://edenrise-brain.edenrise.workers.dev";
const EN = (typeof LANG !== "undefined" && LANG === "en");
const T = EN ? {
  title:"Guides", sub:"Step-by-step procedures for online jobs — follow the screenshots, pick your case, and the guide shows the right screens.",
  search:"Search guides…", all:"All", newG:"+ New guide", none:"No guides yet. Create the first one — paste screenshots as you go through the procedure.", signin:"Sign in to see and make guides.", signBtn:"Sign in",
  steps:"steps", choices:"choices", draft:"draft", pub:"published", by:"by", open:"Open", edit:"Edit", back:"Back", next:"Next", start:"Start", restart:"Start again", resume:"Continue where you stopped",
  need:"You'll need", portal:"Open the portal", done:"Done", doneSub:"You reached the end of this procedure. Your path:", copyPath:"Copy the path", copied:"Copied",
  stepOf:"Step", noShot:"Screenshot still to capture", tapZoom:"Tap to enlarge", close:"Close", lib:"All guides",
  ed:{guide:"Guide", agency:"Agency", titlePt:"Title (PT)", titleEn:"Title (EN, optional)", summary:"What this is for", portal:"Portal address", needs:"You'll need (one per line)", links:"Show on the card of these map layers", status:"Status", draft:"Draft", pub:"Published — the team sees it",
    nodes:"Screens", addStep:"+ Step", addChoice:"+ Choice", addEnd:"+ End", type:"Type", step:"Step", choice:"Choice", end:"End",
    text:"Instruction (PT)", textEn:"Instruction (EN, optional)", next:"Then go to", option:"Option", goes:"goes to", addOpt:"+ Option", newStep:"＋ new step", startHere:"Start here", isStart:"First screen", del:"Remove this screen", delQ:"Remove this screen? It stays in the previous version.",
    shot:"Screenshot", paste:"Paste a screenshot (Ctrl/⌘+V), drop it here, or", choose:"choose a file", blur:"Blur private data", spot:"Mark the click spot", undo:"Undo", use:"Save screenshot", uploading:"Saving screenshot…", replace:"Replace", saveV:"Save version", saving:"Saving…", saved:"Saved", preview:"Preview", versions:"Versions", conflict:"Someone saved this guide meanwhile. Their version is loaded — your changes are kept on this device; re-apply them and save.",
    blurHint:"Drag over names, NIF, addresses, numbers — they are pixelated here, on this device, before upload.", spotHint:"Drag a box over what to click.", unsaved:"Unsaved changes on this device", retire:"Delete guide", retireQ:"Delete this guide? It can be recovered.", restoreNote:"Deleted guides can be recovered from the library.", deleted:"Deleted guides", restore:"Restore"}
} : {
  title:"Guias", sub:"Procedimentos passo a passo para tarefas online — siga as capturas, escolha o seu caso e o guia mostra os ecrãs certos.",
  search:"Procurar guias…", all:"Todas", newG:"+ Novo guia", none:"Ainda não há guias. Crie o primeiro — cole capturas de ecrã enquanto faz o procedimento.", signin:"Entre para ver e criar guias.", signBtn:"Entrar",
  steps:"passos", choices:"escolhas", draft:"rascunho", pub:"publicado", by:"por", open:"Abrir", edit:"Editar", back:"Voltar", next:"Seguinte", start:"Começar", restart:"Recomeçar", resume:"Continuar onde parou",
  need:"Vai precisar de", portal:"Abrir o portal", done:"Concluído", doneSub:"Chegou ao fim deste procedimento. O seu percurso:", copyPath:"Copiar o percurso", copied:"Copiado",
  stepOf:"Passo", noShot:"Captura de ecrã por fazer", tapZoom:"Toque para ampliar", close:"Fechar", lib:"Todos os guias",
  ed:{guide:"Guia", agency:"Entidade", titlePt:"Título (PT)", titleEn:"Título (EN, opcional)", summary:"Para que serve", portal:"Endereço do portal", needs:"Vai precisar de (um por linha)", links:"Mostrar no cartão destas camadas do mapa", status:"Estado", draft:"Rascunho", pub:"Publicado — a equipa vê",
    nodes:"Ecrãs", addStep:"+ Passo", addChoice:"+ Escolha", addEnd:"+ Fim", type:"Tipo", step:"Passo", choice:"Escolha", end:"Fim",
    text:"Instrução (PT)", textEn:"Instrução (EN, opcional)", next:"Depois vai para", option:"Opção", goes:"vai para", addOpt:"+ Opção", newStep:"＋ novo passo", startHere:"Começar aqui", isStart:"Primeiro ecrã", del:"Remover este ecrã", delQ:"Remover este ecrã? Fica na versão anterior.",
    shot:"Captura de ecrã", paste:"Cole uma captura (Ctrl/⌘+V), arraste para aqui, ou", choose:"escolha um ficheiro", blur:"Desfocar dados privados", spot:"Marcar onde clicar", undo:"Desfazer", use:"Guardar captura", uploading:"A guardar a captura…", replace:"Substituir", saveV:"Guardar versão", saving:"A guardar…", saved:"Guardado", preview:"Pré-visualizar", versions:"Versões", conflict:"Alguém guardou este guia entretanto. A versão dessa pessoa foi carregada — as suas alterações ficam neste aparelho; volte a aplicá-las e guarde.",
    blurHint:"Arraste sobre nomes, NIF, moradas, números — ficam pixelizados aqui, neste aparelho, antes de enviar.", spotHint:"Arraste uma caixa sobre o que clicar.", unsaved:"Alterações por guardar neste aparelho", retire:"Apagar guia", retireQ:"Apagar este guia? Pode ser recuperado.", restoreNote:"Os guias apagados podem ser recuperados na biblioteca.", deleted:"Guias apagados", restore:"Recuperar"}
};
const AGENCIES = ["ICNF", "IFAP", "AT · Finanças", "Segurança Social", "Câmara", "DGT", "APA", "Interno", "Outro"];
const AG_COL = {"ICNF":"#2f7d4f", "IFAP":"#c9a227", "AT · Finanças":"#1f5fa8", "Segurança Social":"#8a4fbf", "Câmara":"#b4552d", "DGT":"#3b8f8f", "APA":"#2f6fa8", "Interno":"#6b6157", "Outro":"#6b6157"};
const auth = () => window.edrAuth || {role:"viewer", key:"", actor:""};
const esc = t => String(t == null ? "" : t).replace(/[<>&"]/g, c => ({"<":"&lt;", ">":"&gt;", "&":"&amp;", '"':"&quot;"}[c]));
const say = m => { if(window.toast) toast(m); };
const L = (o, k) => (EN && o[k + "_en"]) ? o[k + "_en"] : (o[k] || "");
const imgURL = v => !v ? "" : (/^MED-/.test(v) ? `${API}/media/${v}` : v);
const nid = () => "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
async function api(method, path, body){
  const r = await fetch(API + path, {method, headers:{"Content-Type":"application/json", "X-Role-Key":auth().key || "", ...(method !== "GET" ? {"X-Idem":"g-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)} : {})}, body:body ? JSON.stringify(body) : undefined});
  let j = {}; try{ j = await r.json(); }catch(e){} j.__status = r.status; return j; }

const css = document.createElement("style"); css.textContent = `
#gdx{position:fixed;inset:0;z-index:2600;background:var(--bark,#14110d);color:var(--linen,#ece4d2);display:none;flex-direction:column;font:14px/1.5 var(--ui,sans-serif)}
#gdx.on{display:flex}
#gdx .sm{display:none}
@media (max-width:600px){ #gdx .lg{display:none} #gdx .sm{display:inline} #gdx .gh{gap:6px;padding:8px 10px} #gdx .gh button,#gdx .gh .btn{padding:0 11px} #gdx .gh h2{font-size:16px} }
body:has(#gdx.on) #tour{display:none}
#gdx .gh{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--line,#332c22);min-height:56px}
#gdx .gh h2{margin:0;font:600 18px var(--display,sans-serif);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#gdx .gh button,#gdx .btn{height:36px;border-radius:18px;border:1px solid var(--line-2,#47402f);background:transparent;color:var(--linen,#ece4d2);font:600 13px var(--ui);padding:0 14px;cursor:pointer;white-space:nowrap}
#gdx .btn.pri{background:var(--straw,#c9a227);border-color:var(--straw,#c9a227);color:#14110d}
#gdx .btn.ok{background:var(--oak,#7f9a6a);border-color:var(--oak,#7f9a6a);color:#14110d}
#gdx .btn:disabled{opacity:.45;cursor:default}
#gdx button:focus-visible,#gdx input:focus-visible,#gdx select:focus-visible,#gdx textarea:focus-visible,#gdx .gcard:focus-visible{outline:2px solid var(--straw,#c9a227);outline-offset:2px}
#gdx .gb{flex:1;overflow:auto;min-height:0}
#gdx .lib{max-width:1100px;margin:0 auto;padding:18px 16px 40px;display:flex;flex-direction:column;gap:14px}
#gdx .lib p.sub{margin:0;color:var(--muted,#8f8676);max-width:70ch}
#gdx .tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
#gdx .tools input{flex:1;min-width:180px;height:38px;border-radius:10px;border:1px solid var(--line-2,#47402f);background:var(--night,#1c1813);color:var(--linen);padding:0 12px;font:14px var(--ui)}
#gdx .chip{height:32px;border-radius:16px;border:1px solid var(--line-2,#47402f);background:transparent;color:var(--linen-2,#d8cfbd);font:600 12px var(--ui);padding:0 12px;cursor:pointer}
#gdx .chip.on{background:var(--linen,#ece4d2);color:#14110d;border-color:var(--linen,#ece4d2)}
#gdx .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
#gdx .gcard{background:var(--night,#1c1813);border:1px solid var(--line,#332c22);border-radius:14px;overflow:hidden;cursor:pointer;display:flex;flex-direction:column}
#gdx .gcard:hover{border-color:var(--line-2,#47402f)}
#gdx .gcard .th{aspect-ratio:16/9;background:#0e0c09 center/cover no-repeat;position:relative}
#gdx .gcard .ag{position:absolute;left:10px;top:10px;font:700 10.5px var(--mono,monospace);letter-spacing:.06em;padding:3px 8px;border-radius:999px;color:#fff}
#gdx .gcard .st{position:absolute;right:10px;top:10px;font:600 10.5px var(--mono,monospace);padding:3px 8px;border-radius:999px;background:rgba(20,17,13,.8);color:var(--muted,#8f8676)}
#gdx .gcard .tx{padding:12px 14px;display:flex;flex-direction:column;gap:4px}
#gdx .gcard b{font:600 15px var(--display,sans-serif);line-height:1.3}
#gdx .gcard small{color:var(--muted,#8f8676);font-size:12px}
#gdx .empty{color:var(--muted,#8f8676);padding:30px 0;text-align:center;line-height:1.6}
#gdx .play{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(300px,1fr);height:100%;min-height:0}
#gdx .play .shot{background:#0e0c09;overflow:auto;display:flex;align-items:flex-start;justify-content:center;padding:14px;min-height:0}
#gdx .frame{position:relative;max-width:100%;cursor:zoom-in;line-height:0}
#gdx .frame img{max-width:100%;max-height:calc(100vh - 110px);border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,.5)}
#gdx .hot{position:absolute;border:3px solid #ffcc33;border-radius:8px;box-shadow:0 0 0 9999px rgba(0,0,0,.25),0 0 18px rgba(255,204,51,.8);animation:gdpulse 1.6s ease-in-out infinite;pointer-events:none}
@keyframes gdpulse{50%{box-shadow:0 0 0 9999px rgba(0,0,0,.25),0 0 4px rgba(255,204,51,.3)}}
@media (prefers-reduced-motion:reduce){#gdx .hot{animation:none}}
#gdx .noshot{width:min(640px,100%);aspect-ratio:16/10;border:2px dashed var(--line-2,#47402f);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--muted,#8f8676);font-size:13px;line-height:1.4;text-align:center;padding:20px}
#gdx .side{border-left:1px solid var(--line,#332c22);display:flex;flex-direction:column;min-height:0}
#gdx .side .in{flex:1;overflow:auto;padding:18px 18px 10px;display:flex;flex-direction:column;gap:12px}
#gdx .crumb{display:flex;gap:4px;flex-wrap:wrap}
#gdx .crumb i{width:22px;height:5px;border-radius:3px;background:var(--line-2,#47402f)}
#gdx .crumb i.on{background:var(--straw,#c9a227)}
#gdx .eyb{font:600 11px var(--mono,monospace);letter-spacing:.1em;text-transform:uppercase;color:var(--straw,#c9a227)}
#gdx h3{margin:0;font:600 21px/1.25 var(--display,sans-serif);text-wrap:balance}
#gdx .say{white-space:pre-wrap;font-size:15px;line-height:1.6}
#gdx .needs{background:var(--night,#1c1813);border:1px solid var(--line,#332c22);border-radius:12px;padding:10px 14px}
#gdx .needs ul{margin:6px 0 0;padding-left:18px}
#gdx .opts{display:flex;flex-direction:column;gap:8px}
#gdx .opts button{min-height:52px;text-align:left;border-radius:12px;border:1px solid var(--line-2,#47402f);background:var(--night,#1c1813);color:var(--linen);font:600 14.5px var(--ui);padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:10px}
#gdx .opts button:hover{border-color:var(--straw,#c9a227)}
#gdx .opts button span{flex:1}
#gdx .side .ft{display:flex;gap:8px;padding:12px 18px calc(12px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--line,#332c22)}
#gdx .side .ft .btn{flex:1;height:48px;border-radius:12px}
#gdx .lbx{position:fixed;inset:0;z-index:2700;background:rgba(0,0,0,.92);overflow:auto;display:flex;align-items:flex-start;justify-content:center;padding:20px;cursor:zoom-out}
#gdx .lbx .frame{cursor:zoom-out} #gdx .lbx .frame img{max-height:none;max-width:none;width:min(1800px,180vw)}
#gdx .edit{display:grid;grid-template-columns:260px minmax(0,1fr);height:100%;min-height:0}
#gdx .tree{border-right:1px solid var(--line,#332c22);overflow:auto;padding:12px;display:flex;flex-direction:column;gap:6px}
#gdx .tree .nd{display:grid;grid-template-columns:auto 1fr;gap:2px 8px;align-items:center;text-align:left;border:1px solid var(--line,#332c22);border-radius:10px;padding:8px 10px;background:transparent;color:var(--linen);cursor:pointer;font:13px var(--ui)}
#gdx .tree .nd.on{border-color:var(--straw,#c9a227);background:var(--night,#1c1813)}
#gdx .tree .nd i{font-style:normal;font:700 10px var(--mono,monospace);padding:2px 6px;border-radius:6px;background:var(--line-2,#47402f)}
#gdx .tree .nd small{grid-column:2;color:var(--muted,#8f8676);font-size:11px}
#gdx .tree .nd small.warn{color:#e8a35a}
#gdx .tree .add{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}
#gdx .form{overflow:auto;padding:16px 18px 40px;display:flex;flex-direction:column;gap:12px;max-width:980px}
#gdx .form label{display:flex;flex-direction:column;gap:4px;font:600 11.5px var(--ui);color:var(--muted,#8f8676)}
#gdx .form input,#gdx .form select,#gdx .form textarea{background:var(--night,#1c1813);color:var(--linen);border:1px solid var(--line-2,#47402f);border-radius:9px;padding:9px 10px;font:14px var(--ui)}
#gdx .form textarea{min-height:70px;resize:vertical}
#gdx .row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
#gdx fieldset{border:1px solid var(--line,#332c22);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:10px;margin:0}
#gdx legend{font:600 11px var(--mono,monospace);letter-spacing:.1em;text-transform:uppercase;color:var(--straw,#c9a227);padding:0 6px}
#gdx .optrow{display:grid;grid-template-columns:1fr 1fr auto;gap:6px;align-items:end}
#gdx .drop{border:2px dashed var(--line-2,#47402f);border-radius:12px;padding:18px;text-align:center;color:var(--muted,#8f8676)}
#gdx .drop.over{border-color:var(--straw,#c9a227);color:var(--linen)}
#gdx .drop a{color:var(--straw,#c9a227);cursor:pointer;text-decoration:underline}
#gdx .cv{position:relative;line-height:0;max-width:100%;touch-action:none;user-select:none}
#gdx .cv canvas{max-width:100%;border-radius:8px;display:block}
#gdx .cv .box{position:absolute;border:2px dashed #ffcc33;pointer-events:none}
#gdx .cvtools{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
#gdx .cvtools .chip.blur.on{background:#e8a35a;border-color:#e8a35a}
#gdx .cvtools .chip.spot.on{background:#ffcc33;border-color:#ffcc33}
#gdx .hint{font-size:12px;color:var(--muted,#8f8676)}
#gdx .bar2{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
#gdx .dirty{font-size:12px;color:#e8a35a}
#gdx .lnk{display:flex;flex-wrap:wrap;gap:6px}
@media (max-width:820px){
  #gdx .play{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}
  #gdx .play .shot{max-height:52vh;padding:8px} #gdx .frame img{max-height:calc(52vh - 16px)}
  #gdx .side{border-left:0;border-top:1px solid var(--line,#332c22)}
  #gdx .edit{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}
  #gdx .tree{border-right:0;border-bottom:1px solid var(--line,#332c22);flex-direction:row;overflow-x:auto;max-height:none}
  #gdx .tree .nd{min-width:170px} #gdx .tree .add{flex-wrap:nowrap}
  #gdx .row2{grid-template-columns:1fr} #gdx .optrow{grid-template-columns:1fr}
}`;
document.head.appendChild(css);

/* guides that ship with the app (read-only; "Copy to edit" makes an editable copy on the server) */
let BUILTIN = null; async function builtins(){ if(BUILTIN) return BUILTIN; try{ BUILTIN = await fetch("guides/builtin.json").then(r => r.json()); }catch(e){ BUILTIN = []; } BUILTIN.forEach(g => { const ns = Object.values(g.tree.nodes); g.steps = ns.filter(n => n.type === "step").length; g.choices = ns.filter(n => n.type === "choice").length; g.shots = ns.filter(n => n.img).length; }); return BUILTIN; }
const S = {list:[], deleted:[], filter:"", ag:"", g:null, path:[], node:null, ed:null, cur:null, dirty:false, view:"lib"};
const ui = document.createElement("div"); ui.id = "gdx"; ui.setAttribute("role", "dialog"); ui.setAttribute("aria-label", T.title);
document.body.appendChild(ui);
const head = (title, extra) => `<div class="gh"><button data-a="close" aria-label="${T.close}">✕</button><h2>${title}</h2>${extra || ""}</div>`;
function wire(){ ui.querySelectorAll('[data-a="close"]').forEach(b => b.onclick = close); ui.querySelectorAll('[data-a="lib"]').forEach(b => b.onclick = () => library()); }

/* ---------- library ---------- */
async function library(){
  S.view = "lib"; S.g = null;
  if(auth().role === "viewer"){ ui.innerHTML = head(T.title) + `<div class="gb"><div class="lib"><p class="sub">${T.sub}</p><div class="empty">${T.signin}<br><br><button class="btn pri" data-a="si">${T.signBtn}</button></div></div></div>`; wire();
    ui.querySelector('[data-a="si"]').onclick = async () => { if(window.edrSignIn) await edrSignIn.open(); library(); }; return; }
  ui.innerHTML = head(T.title, `<button class="btn pri" data-a="new">${T.newG}</button>`) + `<div class="gb"><div class="lib"><p class="sub">${T.sub}</p><div class="tools"><input data-f="q" placeholder="${T.search}" value="${esc(S.filter)}"></div><div class="tools" data-f="ag"></div><div class="grid"></div><div class="del"></div></div></div>`;
  wire(); ui.querySelector('[data-a="new"]').onclick = newGuide;
  ui.querySelector('[data-f="q"]').oninput = e => { S.filter = e.target.value; drawLib(); };
  const d = await api("GET", "/guides"); S.list = [...(await builtins()), ...(d.guides || [])]; const dd = await api("GET", "/guides?deleted=1"); S.deleted = dd.guides || []; drawLib(); }
function drawLib(){
  const box = ui.querySelector(".grid"); if(!box) return; const q = S.filter.trim().toLowerCase();
  const ags = [...new Set(S.list.map(g => g.agency).filter(Boolean))];
  ui.querySelector('[data-f="ag"]').innerHTML = ags.length > 1 ? [`<button class="chip ${!S.ag ? "on" : ""}" data-ag="">${T.all}</button>`, ...ags.map(a => `<button class="chip ${S.ag === a ? "on" : ""}" data-ag="${esc(a)}">${esc(a)}</button>`)].join("") : "";
  ui.querySelectorAll("[data-ag]").forEach(b => b.onclick = () => { S.ag = b.dataset.ag; drawLib(); });
  const rows = S.list.filter(g => (!S.ag || g.agency === S.ag) && (!q || [g.title, g.title_en, g.summary, g.agency].join(" ").toLowerCase().includes(q)));
  box.innerHTML = rows.length ? rows.map(g => `<div class="gcard" tabindex="0" data-id="${g.id}"><div class="th" data-th="${g.id}">${g.agency ? `<span class="ag" style="background:${AG_COL[g.agency] || "#6b6157"}">${esc(g.agency)}</span>` : ""}<span class="st">${g.builtin ? (EN ? "built in" : "incluído") : g.status === "publicado" ? T.pub : T.draft}</span></div>
    <div class="tx"><b>${esc(L(g, "title"))}</b>${g.summary ? `<small>${esc(g.summary).slice(0, 140)}</small>` : ""}<small>${g.steps} ${T.steps} · ${g.choices} ${T.choices} · ${T.by} ${esc(g.updated_by || g.created_by || "—")} · ${String(g.updated_at || "").slice(0, 10)}</small></div></div>`).join("") : `<div class="empty">${T.none}</div>`;
  box.querySelectorAll(".gcard").forEach(c => { const go = () => play(c.dataset.id); c.onclick = go; c.onkeydown = e => { if(e.key === "Enter") go(); }; });
  rows.forEach(async g => { const th = box.querySelector(`[data-th="${g.id}"]`); if(!th || !g.shots) return; const full = g.builtin ? g : await api("GET", `/guides/${g.id}`); const n = full.tree && full.tree.nodes && (full.tree.nodes[full.tree.start] || Object.values(full.tree.nodes).find(x => x.img)); const first = n && n.img ? n : full.tree && Object.values(full.tree.nodes || {}).find(x => x.img); if(first) th.style.backgroundImage = `url("${imgURL(first.img)}")`; });
  const del = ui.querySelector(".del"); del.innerHTML = S.deleted.length ? `<details><summary class="hint">${T.ed.deleted} · ${S.deleted.length}</summary><div class="tools" style="margin-top:8px">${S.deleted.map(g => `<button class="chip" data-rs="${g.id}">↶ ${T.ed.restore}: ${esc(g.title)}</button>`).join("")}</div></details>` : "";
  del.querySelectorAll("[data-rs]").forEach(b => b.onclick = async () => { await api("POST", `/guides/${b.dataset.rs}/restore`, {actor:auth().actor}); library(); });
}
/* ---------- player ---------- */
const PK = id => "edr_gp_" + id;
async function play(id, fromEditor){
  const g = fromEditor ? S.g : (/^builtin-/.test(id) ? (await builtins()).find(x => x.id === id) : await api("GET", `/guides/${id}`)); if(!g || g.error){ say(g && g.error || "?"); return; } S.g = g; S.view = "play";
  let saved = null; try{ saved = JSON.parse(localStorage.getItem(PK(g.id)) || "null"); }catch(e){}
  S.path = (!fromEditor && saved && saved.path && saved.path.length > 1 && saved.v === g.version) ? saved.path : [g.tree.start]; show(); }
function save(){ try{ localStorage.setItem(PK(S.g.id), JSON.stringify({path:S.path, v:S.g.version, at:Date.now()})); }catch(e){} }
function show(){
  const g = S.g, tr = g.tree || {nodes:{}}, cur = tr.nodes[S.path[S.path.length - 1]];
  const canEdit = auth().role !== "viewer";
  ui.innerHTML = head(esc(L(g, "title")), `${g.portal_url ? `<a class="btn" href="${esc(g.portal_url)}" target="_blank" rel="noopener"><span class="lg">${T.portal} </span>↗</a>` : ""}${canEdit ? `<button class="btn" data-a="edit">${g.builtin ? `<span class="lg">${EN ? "Copy to edit" : "Copiar para editar"}</span><span class="sm">${EN ? "Copy" : "Copiar"}</span>` : T.edit}</button>` : ""}<button class="btn" data-a="lib"><span class="lg">${T.lib}</span><span class="sm">☰</span></button>`) + `<div class="gb"></div>`;
  wire(); const eb = ui.querySelector('[data-a="edit"]'); if(eb) eb.onclick = async () => { if(!g.builtin) return editor(g.id); const r = await api("POST", "/guides", {title:g.title, title_en:g.title_en, agency:g.agency, summary:g.summary, links:g.links, tree:g.tree, actor:auth().actor}); if(r.error){ say(r.error); return; } editor(r.id); };
  const body = ui.querySelector(".gb");
  if(!cur){ body.innerHTML = `<div class="lib"><div class="empty">${T.none}</div></div>`; return; }
  const n = S.path.length, first = n === 1;
  const crumb = `<div class="crumb">${S.path.map((x, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</div>`;
  const needList = (EN && tr.needs_en && tr.needs_en.length) ? tr.needs_en : (tr.needs || []);
  const needs = first && needList.length ? `<div class="needs"><div class="eyb">${T.need}</div><ul>${needList.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : "";
  const shot = cur.img ? `<div class="frame" tabindex="0" aria-label="${T.tapZoom}"><img alt="" src="${imgURL(cur.img)}">${cur.hot ? `<span class="hot" style="left:${cur.hot.x * 100}%;top:${cur.hot.y * 100}%;width:${cur.hot.w * 100}%;height:${cur.hot.h * 100}%"></span>` : ""}</div>` : `<div class="noshot">📷 ${T.noShot}</div>`;
  let act = "";
  if(cur.type === "choice") act = `<div class="opts">${(cur.options || []).map((o, i) => `<button data-o="${i}"><span>${esc(L(o, "label"))}</span>→</button>`).join("")}</div>`;
  const end = cur.type === "end" || (cur.type === "step" && !cur.next);
  const pathTxt = end ? S.path.map((x, i) => { const nd = tr.nodes[x]; if(!nd) return ""; const nx = S.path[i + 1]; const o = nd.type === "choice" && nx ? (nd.options || []).find(o => o.next === nx) : null; return `${i + 1}. ${L(nd, "title")}${o ? " → " + L(o, "label") : ""}`; }).join("\n") : "";
  body.innerHTML = `<div class="play"><div class="shot">${shot}</div><div class="side"><div class="in">${crumb}<div class="eyb">${end ? T.done : `${T.stepOf} ${n}`}${g.agency ? " · " + esc(g.agency) : ""}</div><h3>${esc(L(cur, "title"))}</h3>${L(cur, "text") ? `<div class="say">${esc(L(cur, "text"))}</div>` : ""}${needs}${act}
    ${end ? `<div class="needs"><div class="eyb">${T.doneSub}</div><div class="say" style="font-size:13px;margin-top:6px">${esc(pathTxt)}</div></div>` : ""}</div>
    <div class="ft"><button class="btn" data-a="back" ${n === 1 ? "disabled" : ""}>← ${T.back}</button>${cur.type === "step" && cur.next ? `<button class="btn pri" data-a="next">${T.next} →</button>` : ""}${end ? `<button class="btn" data-a="copy">${T.copyPath}</button><button class="btn ok" data-a="again">${T.restart}</button>` : ""}</div></div></div>`;
  const go = to => { if(!tr.nodes[to]) return; S.path.push(to); save(); show(); ui.querySelector(".side .in").scrollTop = 0; };
  body.querySelectorAll("[data-o]").forEach(b => b.onclick = () => go((cur.options || [])[+b.dataset.o].next));
  const nx = body.querySelector('[data-a="next"]'); if(nx) nx.onclick = () => go(cur.next);
  const bk = body.querySelector('[data-a="back"]'); if(bk) bk.onclick = () => { if(S.path.length > 1){ S.path.pop(); save(); show(); } };
  const ag = body.querySelector('[data-a="again"]'); if(ag) ag.onclick = () => { S.path = [tr.start]; save(); show(); };
  const cp = body.querySelector('[data-a="copy"]'); if(cp) cp.onclick = () => { try{ navigator.clipboard.writeText(`${L(g, "title")}\n${pathTxt}`); }catch(e){} say(T.copied); };
  const fr = body.querySelector(".frame"); if(fr){ const zoom = () => { const lb = document.createElement("div"); lb.className = "lbx"; lb.innerHTML = fr.outerHTML; lb.onclick = () => lb.remove(); ui.appendChild(lb); }; fr.onclick = zoom; fr.onkeydown = e => { if(e.key === "Enter") zoom(); }; }
}
/* ---------- editor ---------- */
const DK = id => "edr_gd_" + id;
function layerOptions(){ const out = []; try{ for(const k in DATA){ if(!DATA[k] || !DATA[k].features) continue; out.push([k, typeof title_i18n === "function" ? title_i18n(k, k) : k]); } }catch(e){} return out.sort((a, b) => a[1].localeCompare(b[1])); }
async function newGuide(){
  const s1 = nid(), s2 = nid();
  const tree = {start:s1, needs:[], nodes:{[s1]:{id:s1, type:"step", title:EN ? "Open the portal and sign in" : "Abrir o portal e entrar", text:"", next:s2}, [s2]:{id:s2, type:"end", title:EN ? "Submitted" : "Submetido", text:""}}};
  const r = await api("POST", "/guides", {title:EN ? "New guide" : "Novo guia", agency:"ICNF", tree, actor:auth().actor});
  if(r.error){ say(r.error); return; } editor(r.id); }
async function editor(id){
  const g = await api("GET", `/guides/${id}`); if(!g || g.error){ say(g && g.error || "?"); return; }
  let draft = null; try{ draft = JSON.parse(localStorage.getItem(DK(id)) || "null"); }catch(e){}
  S.ed = draft && draft.base === g.version ? draft.g : g; S.base = g.version; S.dirty = !!(draft && draft.base === g.version); S.g = S.ed; S.view = "edit";
  S.cur = S.cur && S.ed.tree.nodes[S.cur] ? S.cur : "guide"; drawEditor(); }
function markDirty(){ S.dirty = true; try{ localStorage.setItem(DK(S.ed.id), JSON.stringify({base:S.base, g:S.ed})); }catch(e){} const d = ui.querySelector(".dirty"); if(d) d.hidden = false; }
function drawEditor(){
  const E = T.ed, g = S.ed, tr = g.tree; const order = nodeOrder(tr);
  ui.innerHTML = head(`${E.guide}: ${esc(g.title)}`, `<span class="dirty" ${S.dirty ? "" : "hidden"}>● ${E.unsaved}</span><button class="btn" data-a="prev">${E.preview}</button><button class="btn ok" data-a="save">${E.saveV}</button><button class="btn" data-a="lib">${T.lib}</button>`) +
    `<div class="gb"><div class="edit"><div class="tree"><button class="nd ${S.cur === "guide" ? "on" : ""}" data-n="guide"><i>⚙</i><span>${E.guide}</span><small>${esc(g.agency || "")} · v${S.base}</small></button>
    ${order.map((k, i) => { const n = tr.nodes[k]; return `<button class="nd ${S.cur === k ? "on" : ""}" data-n="${k}"><i>${n.type === "choice" ? "◇" : n.type === "end" ? "■" : i + 1}</i><span>${esc(n.title || "—")}</span><small class="${n.type !== "end" && !n.img ? "warn" : ""}">${tr.start === k ? E.isStart + " · " : ""}${n.type === "choice" ? (n.options || []).length + " " + T.choices : n.type === "end" ? E.end : (n.img ? "📷" : "📷 " + T.noShot)}</small></button>`; }).join("")}
    <div class="add"><button class="chip" data-add="step">${E.addStep}</button><button class="chip" data-add="choice">${E.addChoice}</button><button class="chip" data-add="end">${E.addEnd}</button></div></div><div class="form"></div></div></div>`;
  wire();
  ui.querySelectorAll("[data-n]").forEach(b => b.onclick = () => { S.cur = b.dataset.n; drawEditor(); });
  ui.querySelectorAll("[data-add]").forEach(b => b.onclick = () => { const k = nid(); tr.nodes[k] = {id:k, type:b.dataset.add, title:b.dataset.add === "end" ? (EN ? "Done" : "Concluído") : "", text:"", ...(b.dataset.add === "choice" ? {options:[{label:"", next:""}, {label:"", next:""}]} : {})}; if(!tr.start) tr.start = k; S.cur = k; markDirty(); drawEditor(); });
  ui.querySelector('[data-a="prev"]').onclick = () => { S.g = S.ed; S.path = [S.cur !== "guide" && tr.nodes[S.cur] ? S.cur : tr.start]; S.view = "play"; show(); const b = document.createElement("button"); b.className = "btn"; b.textContent = "✎ " + T.edit; b.onclick = () => { S.view = "edit"; drawEditor(); }; ui.querySelector(".gh").insertBefore(b, ui.querySelector(".gh").children[2]); const e2 = ui.querySelector('.gh [data-a="edit"]'); if(e2) e2.remove(); };
  ui.querySelector('[data-a="save"]').onclick = saveVersion;
  const f = ui.querySelector(".form");
  if(S.cur === "guide") return guideForm(f);
  nodeForm(f, tr.nodes[S.cur], order);
}
function nodeOrder(tr){ const seen = [], walk = k => { if(!k || seen.includes(k) || !tr.nodes[k]) return; seen.push(k); const n = tr.nodes[k]; if(n.type === "choice") (n.options || []).forEach(o => walk(o.next)); else walk(n.next); }; walk(tr.start); Object.keys(tr.nodes).forEach(k => { if(!seen.includes(k)) seen.push(k); }); return seen; }
function guideForm(f){
  const E = T.ed, g = S.ed, tr = g.tree, lay = layerOptions(); const links = new Set((g.links || []).map(x => x.layer).filter(Boolean));
  f.innerHTML = `<div class="row2"><label>${E.titlePt}<input data-k="title" value="${esc(g.title)}"></label><label>${E.titleEn}<input data-k="title_en" value="${esc(g.title_en || "")}"></label></div>
    <div class="row2"><label>${E.agency}<select data-k="agency">${AGENCIES.map(a => `<option ${g.agency === a ? "selected" : ""}>${a}</option>`).join("")}</select></label><label>${E.status}<select data-k="status"><option value="rascunho" ${g.status !== "publicado" ? "selected" : ""}>${E.draft}</option><option value="publicado" ${g.status === "publicado" ? "selected" : ""}>${E.pub}</option></select></label></div>
    <label>${E.portal}<input data-k="portal_url" placeholder="https://" value="${esc(g.portal_url || "")}"></label>
    <label>${E.summary}<textarea data-k="summary">${esc(g.summary || "")}</textarea></label>
    <label>${E.needs}<textarea data-needs>${esc((tr.needs || []).join("\n"))}</textarea></label>
    <fieldset><legend>${E.links}</legend><div class="lnk">${lay.map(([k, t]) => `<button class="chip ${links.has(k) ? "on" : ""}" data-l="${esc(k)}">${esc(t)}</button>`).join("")}</div></fieldset>
    <div class="bar2"><button class="btn" data-a="retire" style="color:#e07b39">${E.retire}</button><span class="hint">${E.restoreNote}</span></div>`;
  f.querySelectorAll("[data-k]").forEach(i => i.oninput = i.onchange = () => { g[i.dataset.k] = i.value; markDirty(); });
  f.querySelector("[data-needs]").oninput = e => { tr.needs = e.target.value.split("\n").map(s => s.trim()).filter(Boolean); markDirty(); };
  f.querySelectorAll("[data-l]").forEach(b => b.onclick = () => { const k = b.dataset.l; if(links.has(k)) links.delete(k); else links.add(k); g.links = [...links].map(layer => ({layer})); b.classList.toggle("on"); markDirty(); });
  f.querySelector('[data-a="retire"]').onclick = async () => { if(!confirm(E.retireQ)) return; await api("DELETE", `/guides/${g.id}?actor=${encodeURIComponent(auth().actor)}`); try{ localStorage.removeItem(DK(g.id)); }catch(e){} library(); };
}
function nodeForm(f, n, order){
  const E = T.ed, tr = S.ed.tree;
  const sel = (v, extra) => `<option value="">—</option>${order.filter(k => k !== n.id).map(k => `<option value="${k}" ${v === k ? "selected" : ""}>${esc((tr.nodes[k].type === "choice" ? "◇ " : tr.nodes[k].type === "end" ? "■ " : "") + (tr.nodes[k].title || k))}</option>`).join("")}<option value="__new">${E.newStep}</option>`;
  f.innerHTML = `<div class="row2"><label>${E.type}<select data-t>${["step", "choice", "end"].map(t => `<option value="${t}" ${n.type === t ? "selected" : ""}>${E[t]}</option>`).join("")}</select></label><label>&nbsp;<span class="bar2">${tr.start === n.id ? `<span class="hint">★ ${E.isStart}</span>` : `<button class="chip" data-a="start">★ ${E.startHere}</button>`}<button class="chip" data-a="del" style="color:#e07b39">${E.del}</button></span></label></div>
    <div class="row2"><label>${E.titlePt}<input data-k="title" value="${esc(n.title || "")}"></label><label>${E.titleEn}<input data-k="title_en" value="${esc(n.title_en || "")}"></label></div>
    <div class="row2"><label>${E.text}<textarea data-k="text">${esc(n.text || "")}</textarea></label><label>${E.textEn}<textarea data-k="text_en">${esc(n.text_en || "")}</textarea></label></div>
    ${n.type === "step" ? `<label>${E.next}<select data-next>${sel(n.next)}</select></label>` : ""}
    ${n.type === "choice" ? `<fieldset><legend>${T.choices}</legend>${(n.options || []).map((o, i) => `<div class="optrow"><label>${E.option} ${i + 1}<input data-ol="${i}" value="${esc(o.label || "")}" placeholder="PT"></label><label>${E.goes}<select data-on="${i}">${sel(o.next)}</select></label><button class="chip" data-od="${i}" aria-label="remove">✕</button></div><label style="margin-top:-4px"><input data-oe="${i}" value="${esc(o.label_en || "")}" placeholder="EN (optional)"></label>`).join("")}<button class="chip" data-a="addopt">${E.addOpt}</button></fieldset>` : ""}
    ${n.type !== "end" || n.img ? `<fieldset><legend>${E.shot}</legend><div data-shot></div></fieldset>` : `<fieldset><legend>${E.shot}</legend><div data-shot></div></fieldset>`}`;
  f.querySelectorAll("[data-k]").forEach(i => i.oninput = () => { n[i.dataset.k] = i.value; markDirty(); const t = ui.querySelector(`.tree [data-n="${n.id}"] span`); if(t && i.dataset.k === "title") t.textContent = i.value || "—"; });
  f.querySelector("[data-t]").onchange = e => { n.type = e.target.value; if(n.type === "choice" && !n.options) n.options = [{label:"", next:""}, {label:"", next:""}]; markDirty(); drawEditor(); };
  const linkNew = (setter) => { const k = nid(); tr.nodes[k] = {id:k, type:"step", title:"", text:""}; setter(k); S.cur = k; markDirty(); drawEditor(); };
  const nx = f.querySelector("[data-next]"); if(nx) nx.onchange = e => { if(e.target.value === "__new") return linkNew(k => n.next = k); n.next = e.target.value; markDirty(); };
  f.querySelectorAll("[data-ol]").forEach(i => i.oninput = () => { n.options[+i.dataset.ol].label = i.value; markDirty(); });
  f.querySelectorAll("[data-oe]").forEach(i => i.oninput = () => { n.options[+i.dataset.oe].label_en = i.value; markDirty(); });
  f.querySelectorAll("[data-on]").forEach(s => s.onchange = e => { const i = +s.dataset.on; if(e.target.value === "__new") return linkNew(k => n.options[i].next = k); n.options[i].next = e.target.value; markDirty(); });
  f.querySelectorAll("[data-od]").forEach(b => b.onclick = () => { n.options.splice(+b.dataset.od, 1); markDirty(); drawEditor(); });
  const ao = f.querySelector('[data-a="addopt"]'); if(ao) ao.onclick = () => { n.options.push({label:"", next:""}); markDirty(); drawEditor(); };
  const st = f.querySelector('[data-a="start"]'); if(st) st.onclick = () => { tr.start = n.id; markDirty(); drawEditor(); };
  f.querySelector('[data-a="del"]').onclick = () => { if(!confirm(E.delQ)) return; delete tr.nodes[n.id]; for(const m of Object.values(tr.nodes)){ if(m.next === n.id) m.next = ""; (m.options || []).forEach(o => { if(o.next === n.id) o.next = ""; }); } if(tr.start === n.id) tr.start = Object.keys(tr.nodes)[0] || null; S.cur = "guide"; markDirty(); drawEditor(); };
  shotEditor(f.querySelector("[data-shot]"), n);
}
/* the screenshot: paste / drop / choose, blur private data on the device, mark the click spot, upload */
function shotEditor(box, n){
  const E = T.ed; let base = null, blurs = [], hot = n.hot ? {...n.hot} : null, mode = n.img ? "spot" : "blur", fresh = false;
  const render = () => {
    box.innerHTML = `${!base && !n.img ? `<div class="drop" tabindex="0">${E.paste} <a data-a="pick">${E.choose}</a><input type="file" accept="image/*" hidden></div>` : `<div class="cvtools"><button class="chip blur ${mode === "blur" ? "on" : ""}" data-m="blur">▦ ${E.blur}</button><button class="chip spot ${mode === "spot" ? "on" : ""}" data-m="spot">◎ ${E.spot}</button><button class="chip" data-a="undo">↶ ${E.undo}</button><span style="flex:1"></span><button class="chip" data-a="rep">${E.replace}</button><input type="file" accept="image/*" hidden></div>
      <div class="hint">${mode === "blur" ? E.blurHint : E.spotHint}</div><div class="cv"><canvas></canvas><span class="box" hidden></span></div><div class="bar2"><button class="btn pri" data-a="use" ${fresh || hot ? "" : ""}>${E.use}</button></div>`}`;
    const file = box.querySelector('input[type="file"]'); if(file) file.onchange = e => { const f = e.target.files[0]; if(f) load(f); };
    const pick = box.querySelector('[data-a="pick"]'); if(pick) pick.onclick = () => file.click();
    const rep = box.querySelector('[data-a="rep"]'); if(rep) rep.onclick = () => file.click();
    const drop = box.querySelector(".drop"); if(drop){ drop.ondragover = e => { e.preventDefault(); drop.classList.add("over"); }; drop.ondragleave = () => drop.classList.remove("over"); drop.ondrop = e => { e.preventDefault(); drop.classList.remove("over"); const f = [...e.dataTransfer.files].find(x => x.type.startsWith("image/")); if(f) load(f); }; }
    box.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { mode = b.dataset.m; render(); });
    const un = box.querySelector('[data-a="undo"]'); if(un) un.onclick = () => { if(mode === "blur" && blurs.length) blurs.pop(); else hot = null; paint(); };
    const use = box.querySelector('[data-a="use"]'); if(use) use.onclick = commit;
    if(base || n.img) setupCanvas();
  };
  const load = async file => { const im = new Image(); im.onload = () => { base = im; blurs = []; hot = null; fresh = true; mode = "blur"; render(); }; im.src = URL.createObjectURL(file); };
  const onPaste = e => { if(!box.isConnected){ document.removeEventListener("paste", onPaste); return; } const it = [...(e.clipboardData || {}).items || []].find(x => x.type.startsWith("image/")); if(it){ e.preventDefault(); load(it.getAsFile()); } };
  document.addEventListener("paste", onPaste);
  function setupCanvas(){
    const cv = box.querySelector("canvas"), bx = box.querySelector(".box"), wrap = box.querySelector(".cv");
    if(!base && n.img){ const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => { base = im; setupCanvas(); }; im.src = imgURL(n.img); return; }
    const W = Math.min(1600, base.naturalWidth), H = Math.round(base.naturalHeight * W / base.naturalWidth); cv.width = W; cv.height = H; paint();
    let start = null;
    const at = e => { const r = cv.getBoundingClientRect(); return {x:Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y:Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))}; };
    wrap.onpointerdown = e => { start = at(e); wrap.setPointerCapture(e.pointerId); };
    wrap.onpointermove = e => { if(!start) return; const p = at(e), r = cv.getBoundingClientRect(); const x = Math.min(start.x, p.x), y = Math.min(start.y, p.y), w = Math.abs(p.x - start.x), h = Math.abs(p.y - start.y); bx.hidden = false; Object.assign(bx.style, {left:x * 100 + "%", top:y * 100 + "%", width:w * 100 + "%", height:h * 100 + "%", borderColor:mode === "blur" ? "#e8a35a" : "#ffcc33"}); };
    wrap.onpointerup = e => { if(!start) return; const p = at(e); const r = {x:Math.min(start.x, p.x), y:Math.min(start.y, p.y), w:Math.abs(p.x - start.x), h:Math.abs(p.y - start.y)}; start = null; bx.hidden = true; if(r.w < .01 || r.h < .008) return; if(mode === "blur"){ blurs.push(r); fresh = true; } else hot = r; paint(); };
  }
  function paint(){
    const cv = box.querySelector("canvas"); if(!cv || !base) return; const c = cv.getContext("2d"), W = cv.width, H = cv.height;
    c.drawImage(base, 0, 0, W, H);
    for(const r of blurs){ const x = Math.round(r.x * W), y = Math.round(r.y * H), w = Math.max(2, Math.round(r.w * W)), h = Math.max(2, Math.round(r.h * H)); const b = Math.max(12, Math.round(Math.min(w, h) / 3)); const t = document.createElement("canvas"); t.width = Math.max(1, Math.round(w / b)); t.height = Math.max(1, Math.round(h / b)); t.getContext("2d").drawImage(cv, x, y, w, h, 0, 0, t.width, t.height); c.imageSmoothingEnabled = false; c.drawImage(t, 0, 0, t.width, t.height, x, y, w, h); c.imageSmoothingEnabled = true; }
    if(hot){ c.save(); c.strokeStyle = "#ffcc33"; c.lineWidth = Math.max(3, W / 300); c.setLineDash([10, 6]); c.strokeRect(hot.x * W, hot.y * H, hot.w * W, hot.h * H); c.restore(); }
  }
  async function commit(){
    const btn = box.querySelector('[data-a="use"]');
    if(!fresh && n.img){ n.hot = hot; markDirty(); say(T.ed.saved); drawEditor(); return; }
    /* the uploaded picture carries the blur but not the click-spot box (the player draws that live) */
    const cv = box.querySelector("canvas"); const keepHot = hot; hot = null; paint();
    const out = document.createElement("canvas"); out.width = cv.width; out.height = cv.height; out.getContext("2d").drawImage(cv, 0, 0); hot = keepHot; paint();
    btn.disabled = true; btn.textContent = T.ed.uploading;
    out.toBlob(async blob => { try{ const r = await window.edrUpload(blob, {feature_id:"guide:" + S.ed.id, caption:"[guia] " + (n.title || n.id), actor:auth().actor}, null, "m-g" + Date.now().toString(36)); n.img = r.id; n.hot = hot; fresh = false; base = null; blurs = []; markDirty(); say(T.ed.saved); drawEditor(); }
      catch(e){ btn.disabled = false; btn.textContent = T.ed.use; say((e && e.error) || "upload failed"); } }, "image/jpeg", .88);
  }
  render();
}
async function saveVersion(){
  const E = T.ed, g = S.ed, btn = ui.querySelector('[data-a="save"]'); btn.disabled = true; btn.textContent = E.saving;
  const r = await api("PATCH", `/guides/${g.id}`, {title:g.title, title_en:g.title_en, agency:g.agency, summary:g.summary, portal_url:g.portal_url, links:g.links || [], status:g.status, tree:g.tree, base_version:S.base, actor:auth().actor});
  if(r.__status === 409){ alert(E.conflict); S.ed = r.current; S.base = r.current.version; S.dirty = false; drawEditor(); return; }
  if(r.error){ btn.disabled = false; btn.textContent = E.saveV; say(r.error); return; }
  S.base = r.version; S.ed.version = r.version; S.dirty = false; try{ localStorage.removeItem(DK(g.id)); }catch(e){} say(`${E.saved} · v${r.version}`); cacheLinks(true); drawEditor(); }
/* ---------- open / close, nav entry, map cards ---------- */
function open(id){ ui.classList.add("on"); if(id) play(id); else library(); }
function close(){ if(S.view === "edit" && S.dirty){ /* drafts stay on this device; reopening the editor brings them back */ } ui.classList.remove("on"); if(location.hash === "#guides") history.replaceState(null, "", location.pathname + location.search); }
addEventListener("hashchange", () => { if(location.hash === "#guides") open(); });
if(location.hash === "#guides") setTimeout(() => open(), 1500);
document.addEventListener("keydown", e => { if(e.key === "Escape" && ui.classList.contains("on") && !ui.querySelector(".lbx")) close(); });
let LINKS = null, linksAt = 0;
async function cacheLinks(force){ if(auth().role === "viewer") return []; if(!force && LINKS && Date.now() - linksAt < 300000) return LINKS; const d = await api("GET", "/guides"); LINKS = (d.guides || []).filter(g => (g.links || []).length); linksAt = Date.now(); return LINKS; }
const prevShow = window.showCard;
if(prevShow){ window.showCard = function(...a){ const r = prevShow.apply(this, a); const layer = a[3]; if(layer && auth().role !== "viewer") cacheLinks().then(list => { const hits = (list || []).filter(g => g.links.some(l => l.layer === layer)); if(!hits.length) return; const pp = document.querySelector("#cbody .pp"); if(!pp) return;
  document.querySelectorAll("#cbody .gdlink").forEach(x => x.remove()); for(const g of hits.slice(0, 3)){ const b = document.createElement("button"); b.className = "gdlink"; b.style.cssText = "display:block;width:100%;margin:8px 0 2px;padding:9px 12px;border-radius:9px;border:1px solid var(--line-2,#47402f);background:transparent;color:var(--linen,#ece4d2);font:600 13px var(--ui,sans-serif);cursor:pointer;text-align:left"; b.textContent = `📘 ${L(g, "title")}${g.agency ? " · " + g.agency : ""}`; b.onclick = () => open(g.id); pp.after(b); } }); return r; }; }
window.edrGuides = {open, close, state:S};
})();
