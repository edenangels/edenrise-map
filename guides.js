/* Guides — step-by-step procedures for online jobs (ICNF, IFAP, Finanças…) built from screenshots, with choices that
   branch to different screens. A fork can be a single choice or a "tick all that apply" (each ticked part is followed
   in turn, then the guide continues). Library → player (screenshot, the spot to click, the instruction, choices,
   tickable "you'll need" list, overview of all screens, presentation mode, PowerPoint with clickable choice links, PDF,
   share link, works without signal once opened) → editor (paste a screenshot; private data — NIF, IBAN, e-mails,
   phones, postcodes, names and addresses next to their labels — is found by reading the screen ON THIS DEVICE and
   blurred before anything is uploaded; drag the click spot; link choices to screens). Every save keeps the previous
   version. Opens from the nav (#guides); a shared guide opens with #guide=<link code>, read-only, without sign-in. */
(function(){
const API = "https://edenrise-brain.edenrise.workers.dev";
const EN = (typeof LANG !== "undefined" && LANG === "en");
const T = EN ? {
  title:"Guides", sub:"Step-by-step procedures for online jobs — follow the screenshots, pick your case, and the guide shows the right screens.",
  search:"Search guides…", all:"All", newG:"+ New guide", none:"No guides yet. Create the first one — paste screenshots as you go through the procedure.", signin:"Sign in to see and make guides.", signBtn:"Sign in",
  steps:"steps", choices:"choices", draft:"draft", pub:"published", by:"by", edit:"Edit", back:"Back", next:"Next", restart:"Start again", cont:"Continue",
  need:"You'll need", ready:"ready", portal:"Open the portal", done:"Done", doneSub:"You reached the end of this procedure. Your path:", copyPath:"Copy the path", copied:"Copied",
  stepOf:"Step", noShot:"Screenshot still to capture", tapZoom:"Tap to enlarge", close:"Close", lib:"All guides", tickAll:"Tick everything that applies — the guide takes you through each one, then carries on.", part:"Part", of:"of",
  overview:"All screens", present:"Present", exitPresent:"Exit", share:"Share", exportB:"Export", pdf:"PDF / print", pptx:"PowerPoint", making:"Preparing…", offlineOk:"saved for no signal", offlineLib:"No signal — showing the guides saved on this device.",
  shareT:"Share this guide", shareSub:"Anyone with the link can follow the guide (read-only, no sign-in). Names of who wrote it are not shown.", copyLink:"Copy link", stop:"Stop sharing", stopped:"Sharing stopped — the old link no longer opens", shared:"shared",
  publicNote:"Shared guide · read-only", manual:"Official manual for this step", login:"Behind the sign-in — screenshot to capture the first time someone does it", pubGone:"This guide is no longer shared.", page:"page", slide:"slide", ifChoose:"If", afterAll:"After all ticked parts", builtin:"built in", copyEdit:"Copy to edit", copyShort:"Copy", delG:"Delete this guide", delQ:"Delete this guide? It can be recovered from the library (Deleted guides).", deletedOk:"Deleted — recover it any time under Deleted guides in the library", haveCopy:(by, when) => `There is already a copy of this guide (${by}, ${when}). Open that one instead of making another?\n\nOK = open it · Cancel = make another copy`,
  ed:{guide:"Guide", agency:"Agency", titlePt:"Title (PT)", titleEn:"Title (EN, optional)", summary:"What this is for", portal:"Portal address", needs:"You'll need (one per line)", links:"Show on the card of these map layers", status:"Status", draft:"Draft", pub:"Published — the team sees it",
    addStep:"+ Step", addChoice:"+ Choice", addMulti:"+ Tick several", addEnd:"+ End", type:"Type", step:"Step", choice:"Choice (one answer)", multi:"Tick several (all that apply)", end:"End",
    text:"Instruction (PT)", textEn:"Instruction (EN, optional)", link:"Official page for this step (optional)", next:"Then go to", option:"Option", goes:"goes to", addOpt:"+ Option", after:"After all ticked parts, go to", newStep:"＋ new step", startHere:"Start here", isStart:"First screen", del:"Remove this screen", delQ:"Remove this screen? It stays in the previous version.",
    shot:"Screenshot", paste:"Paste a screenshot (Ctrl/⌘+V), drop it here, or", choose:"choose a file", blur:"Blur", spot:"Click spot", undo:"Undo", use:"Save screenshot", uploading:"Saving screenshot…", replace:"Replace", saveV:"Save version", saving:"Saving…", saved:"Saved", preview:"Preview",
    conflict:"Someone saved this guide meanwhile. Their version is loaded — your changes are kept on this device; re-apply them and save.",
    blurHint:"Drag over anything private to blur it. Blurring happens here, on this device, before upload.", spotHint:"Drag a box over what to click.", unsaved:"Unsaved changes on this device", retire:"Delete guide", retireQ:"Delete this guide? It can be recovered.", restoreNote:"Deleted guides can be recovered from the library.", deleted:"Deleted guides", restore:"Restore",
    scan:"Find private data", scanning:"Reading the screen on this device…", loadingOcr:"Getting the reader ready (first time only)…", found:n => `${n} private item${n === 1 ? "" : "s"} found — they will be blurred. Tap one to keep it visible.`, foundNone:"Nothing private found automatically — check the screen and blur by hand if needed.", ocrFail:"Couldn't read the screen here — blur by hand.", blurAll:"Blur all found"}
} : {
  title:"Guias", sub:"Procedimentos passo a passo para tarefas online — siga as capturas, escolha o seu caso e o guia mostra os ecrãs certos.",
  search:"Procurar guias…", all:"Todas", newG:"+ Novo guia", none:"Ainda não há guias. Crie o primeiro — cole capturas de ecrã enquanto faz o procedimento.", signin:"Entre para ver e criar guias.", signBtn:"Entrar",
  steps:"passos", choices:"escolhas", draft:"rascunho", pub:"publicado", by:"por", edit:"Editar", back:"Voltar", next:"Seguinte", restart:"Recomeçar", cont:"Continuar",
  need:"Vai precisar de", ready:"prontos", portal:"Abrir o portal", done:"Concluído", doneSub:"Chegou ao fim deste procedimento. O seu percurso:", copyPath:"Copiar o percurso", copied:"Copiado",
  stepOf:"Passo", noShot:"Captura de ecrã por fazer", tapZoom:"Toque para ampliar", close:"Fechar", lib:"Todos os guias", tickAll:"Marque tudo o que se aplica — o guia leva-o por cada parte e depois continua.", part:"Parte", of:"de",
  overview:"Todos os ecrãs", present:"Apresentar", exitPresent:"Sair", share:"Partilhar", exportB:"Exportar", pdf:"PDF / imprimir", pptx:"PowerPoint", making:"A preparar…", offlineOk:"guardado para usar sem rede", offlineLib:"Sem rede — a mostrar os guias guardados neste aparelho.",
  shareT:"Partilhar este guia", shareSub:"Quem tiver o link pode seguir o guia (só leitura, sem entrar). Não mostra quem o escreveu.", copyLink:"Copiar link", stop:"Deixar de partilhar", stopped:"Partilha terminada — o link antigo deixa de abrir", shared:"partilhado",
  publicNote:"Guia partilhado · só leitura", manual:"Manual oficial deste passo", login:"Depois de entrar — captura a fazer da primeira vez que alguém fizer o procedimento", pubGone:"Este guia já não está partilhado.", page:"página", slide:"diapositivo", ifChoose:"Se", afterAll:"Depois de todas as partes marcadas", builtin:"incluído", copyEdit:"Copiar para editar", copyShort:"Copiar", delG:"Apagar este guia", delQ:"Apagar este guia? Pode ser recuperado na biblioteca (Guias apagados).", deletedOk:"Apagado — pode recuperá-lo em Guias apagados, na biblioteca", haveCopy:(by, when) => `Já existe uma cópia deste guia (${by}, ${when}). Abrir essa em vez de criar outra?\n\nOK = abrir essa · Cancelar = criar outra cópia`,
  ed:{guide:"Guia", agency:"Entidade", titlePt:"Título (PT)", titleEn:"Título (EN, opcional)", summary:"Para que serve", portal:"Endereço do portal", needs:"Vai precisar de (um por linha)", links:"Mostrar no cartão destas camadas do mapa", status:"Estado", draft:"Rascunho", pub:"Publicado — a equipa vê",
    addStep:"+ Passo", addChoice:"+ Escolha", addMulti:"+ Marcar várias", addEnd:"+ Fim", type:"Tipo", step:"Passo", choice:"Escolha (uma resposta)", multi:"Marcar várias (todas as que se aplicam)", end:"Fim",
    text:"Instrução (PT)", textEn:"Instrução (EN, opcional)", link:"Página oficial deste passo (opcional)", next:"Depois vai para", option:"Opção", goes:"vai para", addOpt:"+ Opção", after:"Depois de todas as partes marcadas, vai para", newStep:"＋ novo passo", startHere:"Começar aqui", isStart:"Primeiro ecrã", del:"Remover este ecrã", delQ:"Remover este ecrã? Fica na versão anterior.",
    shot:"Captura de ecrã", paste:"Cole uma captura (Ctrl/⌘+V), arraste para aqui, ou", choose:"escolha um ficheiro", blur:"Desfocar", spot:"Onde clicar", undo:"Desfazer", use:"Guardar captura", uploading:"A guardar a captura…", replace:"Substituir", saveV:"Guardar versão", saving:"A guardar…", saved:"Guardado", preview:"Pré-visualizar",
    conflict:"Alguém guardou este guia entretanto. A versão dessa pessoa foi carregada — as suas alterações ficam neste aparelho; volte a aplicá-las e guarde.",
    blurHint:"Arraste sobre o que for privado para desfocar. O desfoque é feito aqui, neste aparelho, antes de enviar.", spotHint:"Arraste uma caixa sobre o que clicar.", unsaved:"Alterações por guardar neste aparelho", retire:"Apagar guia", retireQ:"Apagar este guia? Pode ser recuperado.", restoreNote:"Os guias apagados podem ser recuperados na biblioteca.", deleted:"Guias apagados", restore:"Recuperar",
    scan:"Procurar dados privados", scanning:"A ler o ecrã neste aparelho…", loadingOcr:"A preparar o leitor (só da primeira vez)…", found:n => `${n} dado${n === 1 ? "" : "s"} privado${n === 1 ? "" : "s"} encontrado${n === 1 ? "" : "s"} — ${n === 1 ? "vai ser desfocado" : "vão ser desfocados"}. Toque num para o deixar visível.`, foundNone:"Não foi encontrado nada privado automaticamente — confirme o ecrã e desfoque à mão se for preciso.", ocrFail:"Não foi possível ler o ecrã aqui — desfoque à mão.", blurAll:"Desfocar todos"}
};
const AGENCIES = ["ICNF", "IFAP", "AT · Finanças", "Segurança Social", "Câmara", "DGT", "APA", "Interno", "Outro"];
const AG_COL = {"ICNF":"#2f7d4f", "IFAP":"#c9a227", "AT · Finanças":"#1f5fa8", "Segurança Social":"#8a4fbf", "Câmara":"#b4552d", "DGT":"#3b8f8f", "APA":"#2f6fa8", "Interno":"#6b6157", "Outro":"#6b6157"};
const auth = () => window.edrAuth || {role:"viewer", key:"", actor:""};
const esc = t => String(t == null ? "" : t).replace(/[<>&"]/g, c => ({"<":"&lt;", ">":"&gt;", "&":"&amp;", '"':"&quot;"}[c]));
const say = m => { if(window.toast) toast(m); };
const L = (o, k) => (EN && o[k + "_en"]) ? o[k + "_en"] : (o[k] || "");
const imgURL = v => !v ? "" : (/^MED-/.test(v) ? `${API}/media/${v}` : v);
const nid = () => "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const slug = t => String(t || "guia").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 60) || "guia";
async function api(method, path, body){
  try{
    const r = await fetch(API + path, {method, headers:{"Content-Type":"application/json", "X-Role-Key":auth().key || "", ...(method !== "GET" ? {"X-Idem":"g-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)} : {})}, body:body ? JSON.stringify(body) : undefined});
    let j = {}; try{ j = await r.json(); }catch(e){} j.__status = r.status; return j;
  }catch(e){ return {error:"offline", __status:0}; } }
const loadScript = src => new Promise((res, rej) => { if(document.querySelector(`script[src="${src}"]`)) return res(); const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });

const css = document.createElement("style"); css.textContent = `
#gdx{position:fixed;inset:0;z-index:2600;background:var(--bark,#14110d);color:var(--linen,#ece4d2);display:none;flex-direction:column;font:14px/1.5 var(--ui,sans-serif)}
#gdx.on{display:flex}
#gdx [hidden]{display:none!important}
body:has(#gdx.on) #tour{display:none}
#gdx .sm{display:none}
#gdx .gh{display:flex;align-items:center;gap:8px;padding:10px 16px;border-bottom:1px solid var(--line,#332c22);min-height:56px}
#gdx .gh h2{margin:0;font:600 18px var(--display,sans-serif);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#gdx .gh button,#gdx .btn{height:36px;border-radius:18px;border:1px solid var(--line-2,#47402f);background:transparent;color:var(--linen,#ece4d2);font:600 13px var(--ui);padding:0 14px;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px;text-decoration:none}
#gdx .btn.pri{background:var(--straw,#c9a227);border-color:var(--straw,#c9a227);color:#14110d}
#gdx .btn.ok{background:var(--oak,#7f9a6a);border-color:var(--oak,#7f9a6a);color:#14110d}
#gdx .btn:disabled{opacity:.45;cursor:default}
#gdx button:focus-visible,#gdx a:focus-visible,#gdx input:focus-visible,#gdx select:focus-visible,#gdx textarea:focus-visible,#gdx .gcard:focus-visible{outline:2px solid var(--straw,#c9a227);outline-offset:2px}
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
#gdx .note{font-size:12.5px;color:#e8a35a}
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
#gdx .crumb i{width:22px;height:5px;border-radius:3px;background:var(--straw,#c9a227)}
#gdx .eyb{font:600 11px var(--mono,monospace);letter-spacing:.1em;text-transform:uppercase;color:var(--straw,#c9a227)}
#gdx h3{margin:0;font:600 21px/1.25 var(--display,sans-serif);text-wrap:balance}
#gdx .say{white-space:pre-wrap;font-size:15px;line-height:1.6}
#gdx .needs{background:var(--night,#1c1813);border:1px solid var(--line,#332c22);border-radius:12px;padding:10px 14px}
#gdx .needs label{display:flex;gap:10px;align-items:flex-start;padding:5px 0;font-size:14.5px;cursor:pointer}
#gdx .needs input{width:20px;height:20px;margin-top:2px;accent-color:#7f9a6a;flex:none}
#gdx .needs label.ok span{color:var(--muted,#8f8676);text-decoration:line-through}
#gdx .opts{display:flex;flex-direction:column;gap:8px}
#gdx .opts button,#gdx .opts label{min-height:52px;text-align:left;border-radius:12px;border:1px solid var(--line-2,#47402f);background:var(--night,#1c1813);color:var(--linen);font:600 14.5px var(--ui);padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:10px}
#gdx .opts button:hover,#gdx .opts label:hover{border-color:var(--straw,#c9a227)}
#gdx .opts span{flex:1}
#gdx .opts input{width:22px;height:22px;accent-color:#c9a227;flex:none}
#gdx .opts label:has(input:checked){border-color:var(--straw,#c9a227)}
#gdx .side .ft{display:flex;gap:8px;padding:12px 18px calc(12px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--line,#332c22)}
#gdx .side .ft .btn{flex:1;height:48px;border-radius:12px;justify-content:center}
#gdx .lbx{position:fixed;inset:0;z-index:2700;background:rgba(0,0,0,.92);overflow:auto;display:flex;align-items:flex-start;justify-content:center;padding:20px;cursor:zoom-out}
#gdx .lbx .frame{cursor:zoom-out} #gdx .lbx .frame img{max-height:none;max-width:none;width:min(1800px,180vw)}
#gdx .menu{position:relative} #gdx .menu .pop{position:absolute;right:0;top:42px;z-index:5;background:var(--night,#1c1813);border:1px solid var(--line-2,#47402f);border-radius:12px;padding:6px;display:flex;flex-direction:column;min-width:180px;box-shadow:0 12px 30px rgba(0,0,0,.5)}
#gdx .menu .pop[hidden]{display:none} #gdx .menu .pop button{border:0;border-radius:8px;height:40px;justify-content:flex-start;width:100%}
#gdx .menu .pop button:hover{background:var(--bark,#14110d)}
#gdx .ovw{max-width:1200px;margin:0 auto;padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
#gdx .ovw button{all:unset;cursor:pointer;background:var(--night,#1c1813);border:1px solid var(--line,#332c22);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
#gdx .ovw button:hover,#gdx .ovw button:focus-visible{border-color:var(--straw,#c9a227)}
#gdx .ovw .im{aspect-ratio:4/3;background:#0e0c09 center top/cover no-repeat;position:relative}
#gdx .ovw .nb{position:absolute;left:8px;top:8px;font:700 11px var(--mono,monospace);background:#ffcc33;color:#14110d;border-radius:999px;padding:2px 8px}
#gdx .ovw .tt{padding:8px 10px;font:600 13px var(--ui)} #gdx .ovw small{display:block;color:var(--muted,#8f8676);font-weight:500}
#gdx .dlg{position:fixed;inset:0;z-index:2750;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px}
#gdx .dlg .bx{background:var(--night,#1c1813);border:1px solid var(--line-2,#47402f);border-radius:16px;max-width:480px;width:100%;padding:18px;display:flex;flex-direction:column;gap:12px}
#gdx .dlg input{height:40px;border-radius:9px;border:1px solid var(--line-2,#47402f);background:var(--bark,#14110d);color:var(--linen);padding:0 10px;font:13px var(--mono,monospace)}
#gdx .dlg .row{display:flex;gap:8px;flex-wrap:wrap}
#gdx.present .gh .hide-p{display:none}
#gdx.present .play{grid-template-columns:minmax(0,1.8fr) minmax(360px,1fr)} #gdx.present h3{font-size:28px} #gdx.present .say{font-size:19px} #gdx.present .opts button,#gdx.present .opts label{font-size:17px;min-height:60px}
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
#gdx .cv .sg{position:absolute;border:2px solid #e8a35a;background:rgba(232,163,90,.28);border-radius:3px;cursor:pointer;line-height:normal}
#gdx .cv .sg.off{background:transparent;border-style:dashed;opacity:.7}
#gdx .cvtools{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
#gdx .cvtools .chip.blur.on{background:#e8a35a;border-color:#e8a35a}
#gdx .cvtools .chip.spot.on{background:#ffcc33;border-color:#ffcc33}
#gdx .hint{font-size:12px;color:var(--muted,#8f8676)}
#gdx .scanmsg{font-size:12.5px;color:#e8a35a}
#gdx .bar2{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
#gdx .dirty{font-size:12px;color:#e8a35a}
#gdx .lnk{display:flex;flex-wrap:wrap;gap:6px}
@media (max-width:820px){
  #gdx .play{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}
  #gdx .play .shot{max-height:52vh;padding:8px} #gdx .frame img{max-height:calc(52vh - 16px)}
  #gdx .side{border-left:0;border-top:1px solid var(--line,#332c22)}
  #gdx .edit{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}
  #gdx .tree{border-right:0;border-bottom:1px solid var(--line,#332c22);flex-direction:row;overflow-x:auto}
  #gdx .tree .nd{min-width:170px} #gdx .tree .add{flex-wrap:nowrap}
  #gdx .row2{grid-template-columns:1fr} #gdx .optrow{grid-template-columns:1fr}
}
@media (max-width:600px){ #gdx .lg{display:none} #gdx .sm{display:inline} #gdx .gh{gap:6px;padding:8px 10px} #gdx .gh button,#gdx .gh .btn{padding:0 11px} #gdx .gh h2{font-size:16px} }
#gdprint{display:none}
@media print{
  @page{size:A4 landscape;margin:11mm}
  html.gdprinting{color-scheme:light!important;background:#fff!important}
  body.gdprinting{background:#fff!important}
  body.gdprinting > *:not(#gdprint){display:none!important}
  body.gdprinting #gdprint{display:block;color:#111;font:11pt/1.45 Arial,Helvetica,sans-serif;background:#fff}
  #gdprint .pg{display:grid;grid-template-columns:auto minmax(70mm,1fr);gap:8mm;align-items:start;break-inside:avoid}
  #gdprint .pg + .pg{break-before:page;page-break-before:always}
  #gdprint .pg.cover{display:block}
  #gdprint h1{font-size:22pt;margin:0 0 4mm} #gdprint h2{font-size:15pt;margin:0 0 3mm}
  #gdprint .eyb{font:bold 8.5pt Arial;letter-spacing:.08em;text-transform:uppercase;color:#7a5c00}
  #gdprint .fig{position:relative;display:inline-block;line-height:0;border:1px solid #ccc;max-width:180mm}
  #gdprint .fig img{display:block;max-width:180mm;max-height:172mm;width:auto;height:auto}
  #gdprint .hot{position:absolute;border:2.5pt solid #e0a800;border-radius:4px}
  #gdprint ul{margin:2mm 0 0;padding-left:5mm} #gdprint li{margin:1.5mm 0}
  #gdprint .box{display:inline-block;width:3.5mm;height:3.5mm;border:1px solid #333;margin-right:2mm;vertical-align:-0.5mm}
  #gdprint .pgno{font:bold 9pt Arial;color:#777}
}`;
document.head.appendChild(css);

/* ---------- state, built-ins, offline cache ---------- */
let BUILTIN = null;
async function builtins(){ if(BUILTIN) return BUILTIN; try{ BUILTIN = await fetch("guides/builtin.json").then(r => r.json()); }catch(e){ BUILTIN = []; } BUILTIN.forEach(stats); return BUILTIN; }
function stats(g){ const ns = Object.values((g.tree || {}).nodes || {}); g.steps = ns.filter(n => n.type === "step").length; g.choices = ns.filter(n => n.type === "choice" || n.type === "multi").length; g.shots = ns.filter(n => n.img).length; return g; }
const CK = "edr_gcache", IMGC = "edr-guides-v1";
function cacheAll(){ try{ return JSON.parse(localStorage.getItem(CK) || "{}"); }catch(e){ return {}; } }
function cachePut(g){ if(!g || g.builtin) return; try{ const all = cacheAll(); all[g.id] = {...g, __at:Date.now()}; const keep = Object.values(all).sort((a, b) => b.__at - a.__at).slice(0, 25); localStorage.setItem(CK, JSON.stringify(Object.fromEntries(keep.map(x => [x.id, x])))); }catch(e){} cacheImages(g); }
function cacheImages(g){ try{ if(!window.caches) return; const urls = Object.values((g.tree || {}).nodes || {}).map(n => imgURL(n.img)).filter(Boolean); caches.open(IMGC).then(c => Promise.all(urls.map(u => c.match(u).then(hit => hit || c.add(u)).catch(() => null)))).catch(() => {}); }catch(e){} }
function hydrate(root){ root.querySelectorAll("img[data-src]").forEach(im => { const u = im.dataset.src; im.removeAttribute("data-src"); im.onerror = async () => { im.onerror = null; try{ const r = window.caches && await caches.match(u); if(r) im.src = URL.createObjectURL(await r.blob()); }catch(e){} }; im.src = u; }); }
const S = {list:[], deleted:[], filter:"", ag:"", g:null, path:[], ed:null, cur:null, dirty:false, view:"lib", pub:null, offline:false};
const ui = document.createElement("div"); ui.id = "gdx"; ui.setAttribute("role", "dialog"); ui.setAttribute("aria-label", T.title);
document.body.appendChild(ui);
const head = (title, extra) => `<div class="gh"><button data-a="close" aria-label="${T.close}">✕</button><h2>${title}</h2>${extra || ""}</div>`;
function wire(){ ui.querySelectorAll('[data-a="close"]').forEach(b => b.onclick = close); ui.querySelectorAll('[data-a="lib"]').forEach(b => b.onclick = () => library()); }

/* ---------- library ---------- */
async function library(){
  S.view = "lib"; S.g = null; S.pub = null;
  if(auth().role === "viewer"){ ui.innerHTML = head(T.title) + `<div class="gb"><div class="lib"><p class="sub">${T.sub}</p><div class="empty">${T.signin}<br><br><button class="btn pri" data-a="si">${T.signBtn}</button></div></div></div>`; wire();
    ui.querySelector('[data-a="si"]').onclick = async () => { if(window.edrSignIn) await edrSignIn.open(); library(); }; return; }
  ui.innerHTML = head(T.title, `<button class="btn pri" data-a="new">${T.newG}</button>`) + `<div class="gb"><div class="lib"><p class="sub">${T.sub}</p><div class="note" hidden></div><div class="tools"><input data-f="q" placeholder="${T.search}" value="${esc(S.filter)}"></div><div class="tools" data-f="ag"></div><div class="grid"></div><div class="del"></div></div></div>`;
  wire(); ui.querySelector('[data-a="new"]').onclick = newGuide;
  ui.querySelector('[data-f="q"]').oninput = e => { S.filter = e.target.value; drawLib(); };
  const d = await api("GET", "/guides"); const b = await builtins();
  S.offline = d.__status === 0; const cached = cacheAll();
  if(S.offline){ S.list = [...b, ...Object.values(cached).map(stats)]; const n = ui.querySelector(".note"); n.hidden = false; n.textContent = T.offlineLib; S.deleted = []; }
  else { S.list = [...b, ...(d.guides || [])]; const dd = await api("GET", "/guides?deleted=1"); S.deleted = dd.guides || []; }
  drawLib(); }
function drawLib(){
  const box = ui.querySelector(".grid"); if(!box) return; const q = S.filter.trim().toLowerCase(); const cached = cacheAll();
  const ags = [...new Set(S.list.map(g => g.agency).filter(Boolean))];
  ui.querySelector('[data-f="ag"]').innerHTML = ags.length > 1 ? [`<button class="chip ${!S.ag ? "on" : ""}" data-ag="">${T.all}</button>`, ...ags.map(a => `<button class="chip ${S.ag === a ? "on" : ""}" data-ag="${esc(a)}">${esc(a)}</button>`)].join("") : "";
  ui.querySelectorAll("[data-ag]").forEach(b => b.onclick = () => { S.ag = b.dataset.ag; drawLib(); });
  const rows = S.list.filter(g => (!S.ag || g.agency === S.ag) && (!q || [g.title, g.title_en, g.summary, g.agency].join(" ").toLowerCase().includes(q)));
  box.innerHTML = rows.length ? rows.map(g => `<div class="gcard" tabindex="0" data-id="${g.id}"><div class="th" data-th="${g.id}">${g.agency ? `<span class="ag" style="background:${AG_COL[g.agency] || "#6b6157"}">${esc(g.agency)}</span>` : ""}<span class="st">${g.builtin ? T.builtin : g.status === "publicado" ? T.pub : T.draft}${g.shared ? " · " + T.shared : ""}</span></div>
    <div class="tx"><b>${esc(L(g, "title"))}</b>${g.summary ? `<small>${esc(g.summary).slice(0, 140)}</small>` : ""}<small>${g.steps} ${T.steps} · ${g.choices} ${T.choices}${g.builtin ? "" : ` · ${T.by} ${esc(g.updated_by || g.created_by || "—")} · ${String(g.updated_at || "").slice(0, 16).replace("T", " ")}`}${cached[g.id] ? ` · ✓ ${T.offlineOk}` : ""}</small></div></div>`).join("") : `<div class="empty">${T.none}</div>`;
  box.querySelectorAll(".gcard").forEach(c => { const go = () => play(c.dataset.id); c.onclick = go; c.onkeydown = e => { if(e.key === "Enter") go(); }; });
  rows.forEach(async g => { const th = box.querySelector(`[data-th="${g.id}"]`); if(!th || !g.shots) return; const full = g.builtin ? g : (cached[g.id] && cached[g.id].version === g.version ? cached[g.id] : await api("GET", `/guides/${g.id}`)); const ns = (full.tree || {}).nodes || {}; const n = ns[full.tree.start] && ns[full.tree.start].img ? ns[full.tree.start] : Object.values(ns).find(x => x.img); if(n) th.style.backgroundImage = `url("${imgURL(n.img)}")`; });
  const del = ui.querySelector(".del"); del.innerHTML = S.deleted.length ? `<details><summary class="hint">${T.ed.deleted} · ${S.deleted.length}</summary><div class="tools" style="margin-top:8px">${S.deleted.map(g => `<button class="chip" data-rs="${g.id}">↶ ${T.ed.restore}: ${esc(g.title)}</button>`).join("")}</div></details>` : "";
  del.querySelectorAll("[data-rs]").forEach(b => b.onclick = async () => { await api("POST", `/guides/${b.dataset.rs}/restore`, {actor:auth().actor}); library(); });
}
/* ---------- the path through a guide ----------
   Each place in the path is {n: screen, q: [{todo:[next parts], after}]}. A "tick several" screen pushes a frame with the
   ticked parts; when a part runs out (a screen with no next, or one that reaches the frame's "after"), the next ticked
   part starts; when none are left the guide carries on to "after". */
function advance(to, q){ q = JSON.parse(JSON.stringify(q || []));
  for(let i = 0; i < 50; i++){ const top = q[q.length - 1]; if(top && (!to || to === top.after)){ if(top.todo.length){ to = top.todo.shift(); break; } q.pop(); to = top.after || ""; continue; } break; }
  return {n:to || "", q}; }
const PK = id => "edr_gp_" + id, NK = id => "edr_gn_" + id;
async function play(id, fromEditor){
  let g = fromEditor ? S.g : null;
  if(!g){ if(/^builtin-/.test(id)) g = (await builtins()).find(x => x.id === id); else { g = await api("GET", `/guides/${id}`); if(g.__status === 0 || g.error){ const c = cacheAll()[id]; if(c) g = c; } } }
  if(!g || g.error){ say(g && g.error || "?"); return; }
  S.g = g; S.view = "play"; if(!fromEditor) cachePut(g);
  let saved = null; try{ saved = JSON.parse(localStorage.getItem(PK(g.id)) || "null"); }catch(e){}
  const ok = !fromEditor && saved && saved.path && saved.path.length > 1 && saved.v === g.version;
  S.path = ok ? saved.path.map(x => typeof x === "string" ? {n:x, q:[]} : x) : [{n:g.tree.start, q:[]}]; show(); }
function saveProg(){ if(S.pub) return; try{ localStorage.setItem(PK(S.g.id), JSON.stringify({path:S.path, v:S.g.version, at:Date.now()})); }catch(e){} }
function pathText(g){ const tr = g.tree; return S.path.map((p, i) => { const nd = tr.nodes[p.n]; if(!nd) return ""; const nx = S.path[i + 1]; let extra = "";
    if(nd.type === "choice" && nx){ const o = (nd.options || []).find(o => o.next === nx.n); if(o) extra = " → " + L(o, "label"); }
    if(nd.type === "multi" && p.pick) extra = " → " + p.pick.join(" + ");
    return `${i + 1}. ${L(nd, "title")}${extra}`; }).join("\n"); }
function show(){
  const g = S.g, tr = g.tree || {nodes:{}}, here = S.path[S.path.length - 1] || {}, cur = tr.nodes[here.n];
  const canEdit = !S.pub && auth().role !== "viewer";
  const tools = `<span class="menu hide-p"><button class="btn" data-a="more" aria-haspopup="true"><span class="lg">${T.exportB}</span><span class="sm">⋯</span></button><span class="pop" hidden><button data-x="ovw">▦ ${T.overview}</button><button data-x="present">▶ ${T.present}</button><button data-x="pdf">⎙ ${T.pdf}</button><button data-x="pptx">▣ ${T.pptx}</button>${canEdit && !g.builtin ? `<button data-x="share">↗ ${T.share}</button><button data-x="del" style="color:#e07b39">🗑 ${T.delG}</button>` : ""}</span></span>`;
  ui.innerHTML = head(esc(L(g, "title")), `${g.portal_url ? `<a class="btn hide-p" href="${esc(g.portal_url)}" target="_blank" rel="noopener"><span class="lg">${T.portal} </span>↗</a>` : ""}${tools}${canEdit ? `<button class="btn hide-p" data-a="edit">${g.builtin ? `<span class="lg">${T.copyEdit}</span><span class="sm">${T.copyShort}</span>` : T.edit}</button>` : ""}${S.pub ? "" : `<button class="btn hide-p" data-a="lib"><span class="lg">${T.lib}</span><span class="sm">☰</span></button>`}<button class="btn" data-a="exitp" hidden>${T.exitPresent}</button>`) + `<div class="gb"></div>`;
  wire(); wireTools();
  const eb = ui.querySelector('[data-a="edit"]'); if(eb) eb.onclick = async () => { if(!g.builtin) return editor(g.id); const mine = (S.list || []).filter(x => !x.builtin && (x.title === g.title || x.title === g.title_en)).sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))[0];
    if(mine && confirm(T.haveCopy(mine.updated_by || mine.created_by || "—", String(mine.updated_at || "").slice(0, 16).replace("T", " ")))) return editor(mine.id);
    const r = await api("POST", "/guides", {title:g.title, title_en:g.title_en, agency:g.agency, summary:g.summary, portal_url:g.portal_url, links:g.links, tree:g.tree, actor:auth().actor}); if(r.error){ say(r.error); return; } editor(r.id); };
  const body = ui.querySelector(".gb");
  if(!cur){ body.innerHTML = `<div class="lib"><div class="empty">${T.none}</div></div>`; return; }
  const n = S.path.length, first = n === 1;
  const frame = (here.q || [])[(here.q || []).length - 1];
  const needList = (EN && tr.needs_en && tr.needs_en.length) ? tr.needs_en : (tr.needs || []);
  let ticks = []; try{ ticks = JSON.parse(localStorage.getItem(NK(g.id)) || "[]"); }catch(e){}
  const needs = first && needList.length ? `<div class="needs"><div class="eyb">${T.need} · <span data-cnt>${needList.filter((x, i) => ticks[i]).length}/${needList.length}</span> ${T.ready}</div>${needList.map((x, i) => `<label class="${ticks[i] ? "ok" : ""}"><input type="checkbox" data-nk="${i}" ${ticks[i] ? "checked" : ""}><span>${esc(x)}</span></label>`).join("")}</div>` : "";
  const shot = cur.img ? `<div class="frame" tabindex="0" aria-label="${T.tapZoom}"><img alt="" data-src="${imgURL(cur.img)}">${cur.hot ? `<span class="hot" style="left:${cur.hot.x * 100}%;top:${cur.hot.y * 100}%;width:${cur.hot.w * 100}%;height:${cur.hot.h * 100}%"></span>` : ""}</div>` : `<div class="noshot">📷 ${cur.login ? T.login : T.noShot}</div>`;
  const manual = cur.link ? `<a class="btn" href="${esc(cur.link)}" target="_blank" rel="noopener">📘 ${T.manual} ↗</a>` : "";
  let act = "";
  if(cur.type === "choice") act = `<div class="opts">${(cur.options || []).map((o, i) => `<button data-o="${i}"><span>${esc(L(o, "label"))}</span>→</button>`).join("")}</div>`;
  if(cur.type === "multi") act = `<div class="hint">${T.tickAll}</div><div class="opts">${(cur.options || []).map((o, i) => `<label><input type="checkbox" data-m="${i}"><span>${esc(L(o, "label"))}</span></label>`).join("")}</div>`;
  const nxt = cur.type === "step" ? advance(cur.next, here.q) : null;
  const end = cur.type === "end" || (cur.type === "step" && !nxt.n);
  const partInfo = frame && frame.total ? ` · ${T.part} ${frame.total - frame.todo.length} ${T.of} ${frame.total}` : "";
  body.innerHTML = `<div class="play"><div class="shot">${shot}</div><div class="side"><div class="in"><div class="crumb">${S.path.map(() => "<i></i>").join("")}</div><div class="eyb">${end ? T.done : `${T.stepOf} ${n}`}${g.agency ? " · " + esc(g.agency) : ""}${partInfo}</div><h3>${esc(L(cur, "title"))}</h3>${L(cur, "text") ? `<div class="say">${esc(L(cur, "text"))}</div>` : ""}${manual}${needs}${act}
    ${end ? `<div class="needs"><div class="eyb">${T.doneSub}</div><div class="say" style="font-size:13px;margin-top:6px">${esc(pathText(g))}</div></div>` : ""}</div>
    <div class="ft"><button class="btn" data-a="back" ${n === 1 ? "disabled" : ""}>← ${T.back}</button>${cur.type === "step" && nxt.n ? `<button class="btn pri" data-a="next">${T.next} →</button>` : ""}${cur.type === "multi" ? `<button class="btn pri" data-a="mgo">${T.cont} →</button>` : ""}${end ? `<button class="btn" data-a="copy">${T.copyPath}</button><button class="btn ok" data-a="again">${T.restart}</button>` : ""}</div></div></div>`;
  hydrate(body);
  const go = (pos, pick) => { if(!pos.n || !tr.nodes[pos.n]) return; if(pick) S.path[S.path.length - 1].pick = pick; S.path.push(pos); saveProg(); show(); const si = ui.querySelector(".side .in"); if(si) si.scrollTop = 0; };
  body.querySelectorAll("[data-o]").forEach(b => b.onclick = () => go(advance((cur.options || [])[+b.dataset.o].next, here.q)));
  const mg = body.querySelector('[data-a="mgo"]'); if(mg) mg.onclick = () => { const picked = [...body.querySelectorAll("[data-m]")].filter(x => x.checked).map(x => cur.options[+x.dataset.m]).filter(o => o.next);
    const labels = picked.map(o => L(o, "label")); if(!picked.length) return go(advance(cur.after, here.q), labels);
    const q = JSON.parse(JSON.stringify(here.q || [])); q.push({todo:picked.slice(1).map(o => o.next), after:cur.after || "", total:picked.length}); go({n:picked[0].next, q}, labels); };
  const nx = body.querySelector('[data-a="next"]'); if(nx) nx.onclick = () => go(nxt);
  const bk = body.querySelector('[data-a="back"]'); if(bk) bk.onclick = () => { if(S.path.length > 1){ S.path.pop(); delete S.path[S.path.length - 1].pick; saveProg(); show(); } };
  const ag = body.querySelector('[data-a="again"]'); if(ag) ag.onclick = () => { S.path = [{n:tr.start, q:[]}]; saveProg(); show(); };
  const cp = body.querySelector('[data-a="copy"]'); if(cp) cp.onclick = () => { try{ navigator.clipboard.writeText(`${L(g, "title")}\n${pathText(g)}`); }catch(e){} say(T.copied); };
  body.querySelectorAll("[data-nk]").forEach(c => c.onchange = () => { ticks[+c.dataset.nk] = c.checked; try{ localStorage.setItem(NK(g.id), JSON.stringify(ticks)); }catch(e){} c.closest("label").classList.toggle("ok", c.checked); const k = body.querySelector("[data-cnt]"); if(k) k.textContent = `${needList.filter((x, i) => ticks[i]).length}/${needList.length}`; });
  const fr = body.querySelector(".frame"); if(fr){ const zoom = () => { const lb = document.createElement("div"); lb.className = "lbx"; lb.innerHTML = fr.outerHTML; lb.onclick = () => lb.remove(); ui.appendChild(lb); }; fr.onclick = zoom; fr.onkeydown = e => { if(e.key === "Enter") zoom(); }; }
  if(document.fullscreenElement === ui){ ui.classList.add("present"); const ex = ui.querySelector('[data-a="exitp"]'); ex.hidden = false; ex.onclick = () => document.exitFullscreen && document.exitFullscreen(); }
}
function wireTools(){
  const more = ui.querySelector('[data-a="more"]'); if(!more) return; const pop = more.nextElementSibling;
  more.onclick = e => { e.stopPropagation(); pop.hidden = !pop.hidden; };
  ui.addEventListener("click", () => { if(pop) pop.hidden = true; }, {once:true});
  pop.querySelectorAll("[data-x]").forEach(b => b.onclick = e => { e.stopPropagation(); pop.hidden = true; ({ovw:overview, present, pdf:printPDF, pptx:exportPPTX, share:shareDlg, del:delGuide})[b.dataset.x](); });
}
/* overview: every screen at a glance, tap one to jump there */
function overview(){
  const g = S.g, tr = g.tree, order = nodeOrder(tr);
  ui.querySelector(".gb").innerHTML = `<div class="ovw">${order.map((k, i) => { const n = tr.nodes[k]; return `<button data-k="${k}"><span class="im" ${n.img ? `style="background-image:url('${imgURL(n.img)}')"` : ""}><span class="nb">${i + 1}</span></span><span class="tt">${esc(L(n, "title") || "—")}<small>${n.type === "choice" ? "◇ " + T.ed.choice : n.type === "multi" ? "☑ " + T.ed.multi : n.type === "end" ? "■ " + T.ed.end : T.ed.step}</small></span></button>`; }).join("")}</div>`;
  ui.querySelectorAll(".ovw [data-k]").forEach(b => b.onclick = () => { S.path = [{n:b.dataset.k, q:[]}]; show(); });
}
/* presentation: full screen, larger text; ← → and 1–9 to answer */
function present(){ if(ui.requestFullscreen) ui.requestFullscreen().then(() => show()).catch(() => { ui.classList.add("present"); show(); }); else { ui.classList.add("present"); show(); } }
document.addEventListener("fullscreenchange", () => { if(document.fullscreenElement !== ui){ ui.classList.remove("present"); if(S.view === "play") show(); } });
document.addEventListener("keydown", e => { if(!ui.classList.contains("on") || S.view !== "play" || /input|textarea|select/i.test(e.target.tagName || "")) return;
  const b = k => ui.querySelector(k);
  if(e.key === "ArrowRight" || e.key === " "){ const x = b('[data-a="next"]') || b('[data-a="mgo"]'); if(x){ e.preventDefault(); x.click(); } }
  else if(e.key === "ArrowLeft"){ const x = b('[data-a="back"]'); if(x && !x.disabled){ e.preventDefault(); x.click(); } }
  else if(/^[1-9]$/.test(e.key)){ const o = b(`[data-o="${+e.key - 1}"]`); const m = b(`[data-m="${+e.key - 1}"]`); if(o) o.click(); else if(m){ m.checked = !m.checked; } } });
/* page / slide numbers in tree order, shared by the PDF and the PowerPoint */
function numbering(tr){ const order = nodeOrder(tr); const no = {}; order.forEach((k, i) => no[k] = i + 2); return {order, no}; }
function routeLines(n, no, unit){ const out = [];
  if(n.type === "step" && n.next && no[n.next]) out.push({t:`${T.next} → ${unit} ${no[n.next]}`, to:no[n.next]});
  if(n.type === "choice") (n.options || []).forEach(o => { if(o.next && no[o.next]) out.push({t:`${T.ifChoose} «${L(o, "label")}» → ${unit} ${no[o.next]}`, to:no[o.next]}); });
  if(n.type === "multi"){ (n.options || []).forEach(o => { if(o.next && no[o.next]) out.push({t:`☐ ${L(o, "label")} → ${unit} ${no[o.next]}`, to:no[o.next]}); }); if(n.after && no[n.after]) out.push({t:`${T.afterAll} → ${unit} ${no[n.after]}`, to:no[n.after]}); }
  return out; }
async function printPDF(){
  const g = S.g, tr = g.tree, {order, no} = numbering(tr); let el = document.getElementById("gdprint"); if(!el){ el = document.createElement("div"); el.id = "gdprint"; document.body.appendChild(el); }
  const needList = (EN && tr.needs_en && tr.needs_en.length) ? tr.needs_en : (tr.needs || []);
  el.innerHTML = `<section class="pg cover"><div class="eyb">${esc(g.agency || "")} · EdenRise</div><h1>${esc(L(g, "title"))}</h1>${g.summary ? `<p>${esc(g.summary)}</p>` : ""}${g.portal_url ? `<p>${T.portal}: ${esc(g.portal_url)}</p>` : ""}${needList.length ? `<h2>${T.need}</h2><ul style="list-style:none;padding:0">${needList.map(x => `<li><span class="box"></span>${esc(x)}</li>`).join("")}</ul>` : ""}<p class="pgno">${order.length} ${T.page}s · ${new Date().toLocaleDateString(EN ? "en-GB" : "pt-PT")}</p></section>` +
    order.map(k => { const n = tr.nodes[k]; const lines = routeLines(n, no, T.page); return `<section class="pg"><div>${n.img ? `<div class="fig"><img src="${imgURL(n.img)}" alt="">${n.hot ? `<span class="hot" style="left:${n.hot.x * 100}%;top:${n.hot.y * 100}%;width:${n.hot.w * 100}%;height:${n.hot.h * 100}%"></span>` : ""}</div>` : `<div class="fig" style="padding:30mm;text-align:center;line-height:1.4">📷 ${T.noShot}</div>`}</div><div><div class="pgno">${T.page} ${no[k]}</div><div class="eyb">${n.type === "end" ? T.done : n.type === "choice" ? T.ed.choice : n.type === "multi" ? T.ed.multi : T.stepOf}</div><h2>${esc(L(n, "title"))}</h2>${L(n, "text") ? `<p>${esc(L(n, "text"))}</p>` : ""}${n.link ? `<p>📘 ${T.manual}: ${esc(n.link)}</p>` : ""}${lines.length ? `<ul>${lines.map(l => `<li>${esc(l.t)}</li>`).join("")}</ul>` : ""}</div></section>`; }).join("");
  await Promise.all([...el.querySelectorAll("img")].map(im => im.decode ? im.decode().catch(() => {}) : null));
  document.body.classList.add("gdprinting"); document.documentElement.classList.add("gdprinting"); const done = () => { document.body.classList.remove("gdprinting"); document.documentElement.classList.remove("gdprinting"); removeEventListener("afterprint", done); }; addEventListener("afterprint", done); window.print(); setTimeout(done, 1500); }
/* PowerPoint: one slide per screen, the click spot drawn on the picture, and each choice is a link to its slide */
async function shotWithSpot(n){ if(!n.img) return null; try{
  const blob = await (await fetch(imgURL(n.img))).blob(); const bm = await createImageBitmap(blob); const c = document.createElement("canvas"); c.width = bm.width; c.height = bm.height; const x = c.getContext("2d"); x.drawImage(bm, 0, 0);
  if(n.hot){ x.strokeStyle = "#ffcc33"; x.lineWidth = Math.max(4, c.width / 200); x.strokeRect(n.hot.x * c.width, n.hot.y * c.height, n.hot.w * c.width, n.hot.h * c.height); }
  return {data:c.toDataURL("image/jpeg", .86), w:c.width, h:c.height}; }catch(e){ return null; } }
async function exportPPTX(){
  const g = S.g, tr = g.tree, {order, no} = numbering(tr); say(T.making);
  try{ await loadScript("https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js"); }catch(e){ say("PowerPoint: " + (EN ? "could not load — check the connection" : "não carregou — verifique a ligação")); return; }
  const p = new PptxGenJS(); p.layout = "LAYOUT_16x9"; p.title = L(g, "title"); const F = "Arial", INK = "1C1813", MUT = "6B6157", GOLD = "B88A00";
  const s0 = p.addSlide(); s0.background = {color:"FAF8F3"};
  s0.addText(`${g.agency || ""} · EdenRise`.toUpperCase(), {x:.6, y:.5, w:8.8, h:.35, fontFace:F, fontSize:11, bold:true, color:GOLD, charSpacing:2});
  s0.addText(L(g, "title"), {x:.6, y:.9, w:8.8, h:1.1, fontFace:F, fontSize:30, bold:true, color:INK, valign:"top"});
  if(g.summary) s0.addText(g.summary, {x:.6, y:2.0, w:8.8, h:.7, fontFace:F, fontSize:14, color:MUT, valign:"top"});
  const needList = (EN && tr.needs_en && tr.needs_en.length) ? tr.needs_en : (tr.needs || []);
  if(needList.length) s0.addText([{text:T.need, options:{bold:true, color:INK, breakLine:true}}, ...needList.map(x => ({text:"☐  " + x, options:{color:INK, breakLine:true}}))], {x:.6, y:2.8, w:8.8, h:2.2, fontFace:F, fontSize:14, valign:"top"});
  s0.addText(EN ? "Click a choice to jump to its slide." : "Clique numa escolha para saltar para o diapositivo certo.", {x:.6, y:5.0, w:8.8, h:.35, fontFace:F, fontSize:11, italic:true, color:MUT});
  for(const k of order){ const n = tr.nodes[k], s = p.addSlide(); s.background = {color:"FAF8F3"};
    const pic = await shotWithSpot(n);
    if(pic){ const bw = 5.9, bh = 4.75; const r = Math.min(bw / pic.w, bh / pic.h); const w = pic.w * r, h = pic.h * r; s.addImage({data:pic.data, x:.35 + (bw - w) / 2, y:.45 + (bh - h) / 2, w, h}); }
    else s.addText("📷 " + T.noShot, {x:.35, y:.45, w:5.9, h:4.75, align:"center", valign:"middle", fontFace:F, fontSize:14, color:MUT, line:{color:"C9C2B4", dashType:"dash"}});
    s.addText(`${T.slide} ${no[k]} · ${n.type === "end" ? T.done : n.type === "choice" ? T.ed.choice : n.type === "multi" ? T.ed.multi : T.stepOf}`.toUpperCase(), {x:6.5, y:.45, w:3.2, h:.3, fontFace:F, fontSize:9, bold:true, color:GOLD});
    s.addText(L(n, "title") || "—", {x:6.5, y:.8, w:3.2, h:1.0, fontFace:F, fontSize:18, bold:true, color:INK, valign:"top"});
    if(L(n, "text")) s.addText(L(n, "text"), {x:6.5, y:1.8, w:3.2, h:1.7, fontFace:F, fontSize:L(n, "text").length > 260 ? 10 : 12, color:INK, valign:"top", fit:"shrink"});
    if(n.link) s.addText([{text:"📘 " + T.manual, options:{hyperlink:{url:n.link}, color:"1F5FA8", underline:{style:"sng"}}}], {x:6.5, y:5.15, w:3.2, h:.3, fontFace:F, fontSize:10});
    const lines = routeLines(n, no, T.slide);
    if(lines.length) s.addText(lines.map(l => ({text:l.t, options:{hyperlink:{slide:l.to}, color:"1F5FA8", underline:{style:"sng"}, breakLine:true, paraSpaceAfter:6}})), {x:6.5, y:3.5, w:3.2, h:1.8, fontFace:F, fontSize:12, valign:"top"});
  }
  await p.writeFile({fileName:slug(L(g, "title")) + ".pptx"}); }
/* share: a read-only link anyone can open without signing in; it can be switched off */
async function shareDlg(){
  const g = S.g; const r = await api("POST", `/guides/${g.id}/share`, {actor:auth().actor}); if(r.error){ say(r.error); return; }
  const link = `${location.origin}${location.pathname}#guide=${r.token}`;
  const d = document.createElement("div"); d.className = "dlg"; d.innerHTML = `<div class="bx" role="dialog" aria-label="${T.shareT}"><h3>${T.shareT}</h3><div class="hint">${T.shareSub}</div><input readonly value="${esc(link)}"><div class="row"><button class="btn pri" data-a="c">${T.copyLink}</button><a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(L(g, "title") + " — " + link)}">WhatsApp</a><button class="btn" data-a="s" style="color:#e07b39">${T.stop}</button><span style="flex:1"></span><button class="btn" data-a="x">${T.close}</button></div></div>`;
  ui.appendChild(d); d.onclick = e => { if(e.target === d) d.remove(); };
  d.querySelector('[data-a="x"]').onclick = () => d.remove(); d.querySelector('[data-a="c"]').onclick = () => { try{ navigator.clipboard.writeText(link); }catch(e){} d.querySelector("input").select(); say(T.copied); };
  d.querySelector('[data-a="s"]').onclick = async () => { await api("DELETE", `/guides/${g.id}/share?actor=${encodeURIComponent(auth().actor)}`); d.remove(); say(T.stopped); };
}
async function delGuide(){ const g = S.g; if(!g || g.builtin || !confirm(T.delQ)) return; const r = await api("DELETE", `/guides/${g.id}?actor=${encodeURIComponent(auth().actor)}`); if(r.error){ say(r.error); return; } try{ localStorage.removeItem("edr_gd_" + g.id); localStorage.removeItem(PK(g.id)); const c = cacheAll(); delete c[g.id]; localStorage.setItem(CK, JSON.stringify(c)); }catch(e){} say(T.deletedOk); library(); }
async function openPublic(tok){
  ui.classList.add("on"); S.pub = tok; const r = await api("GET", `/guides/public/${encodeURIComponent(tok)}`);
  if(r.error || !r.tree){ ui.innerHTML = head(T.title) + `<div class="gb"><div class="lib"><div class="empty">${r.__status === 0 ? T.offlineLib : T.pubGone}</div></div></div>`; wire(); return; }
  S.g = r; S.view = "play"; S.path = [{n:r.tree.start, q:[]}]; show(); const h = ui.querySelector(".gh h2"); if(h) h.insertAdjacentHTML("afterend", `<span class="hint">${T.publicNote}</span>`); }
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
const ICON = {choice:"◇", multi:"☑", end:"■"};
function drawEditor(){
  const E = T.ed, g = S.ed, tr = g.tree; const order = nodeOrder(tr);
  ui.innerHTML = head(`${E.guide}: ${esc(g.title)}`, `<span class="dirty" ${S.dirty ? "" : "hidden"}>● ${E.unsaved}</span><button class="btn" data-a="prev">${E.preview}</button><button class="btn ok" data-a="save">${E.saveV}</button><button class="btn" data-a="lib"><span class="lg">${T.lib}</span><span class="sm">☰</span></button>`) +
    `<div class="gb"><div class="edit"><div class="tree"><button class="nd ${S.cur === "guide" ? "on" : ""}" data-n="guide"><i>⚙</i><span>${E.guide}</span><small>${esc(g.agency || "")} · v${S.base}</small></button>
    ${order.map((k, i) => { const n = tr.nodes[k]; return `<button class="nd ${S.cur === k ? "on" : ""}" data-n="${k}"><i>${ICON[n.type] || i + 1}</i><span>${esc(n.title || "—")}</span><small class="${n.type !== "end" && !n.img ? "warn" : ""}">${tr.start === k ? E.isStart + " · " : ""}${n.type === "choice" || n.type === "multi" ? (n.options || []).length + " " + T.choices : n.type === "end" ? E.end : (n.img ? "📷" : "📷 " + T.noShot)}</small></button>`; }).join("")}
    <div class="add"><button class="chip" data-add="step">${E.addStep}</button><button class="chip" data-add="choice">${E.addChoice}</button><button class="chip" data-add="multi">${E.addMulti}</button><button class="chip" data-add="end">${E.addEnd}</button></div></div><div class="form"></div></div></div>`;
  wire();
  ui.querySelectorAll("[data-n]").forEach(b => b.onclick = () => { S.cur = b.dataset.n; drawEditor(); });
  ui.querySelectorAll("[data-add]").forEach(b => b.onclick = () => { const k = nid(), t = b.dataset.add; tr.nodes[k] = {id:k, type:t, title:t === "end" ? (EN ? "Done" : "Concluído") : "", text:"", ...(t === "choice" || t === "multi" ? {options:[{label:"", next:""}, {label:"", next:""}]} : {})}; if(!tr.start) tr.start = k; S.cur = k; markDirty(); drawEditor(); });
  ui.querySelector('[data-a="prev"]').onclick = () => { S.g = S.ed; S.path = [{n:S.cur !== "guide" && tr.nodes[S.cur] ? S.cur : tr.start, q:[]}]; S.view = "play"; show(); const gh = ui.querySelector(".gh"); const b = document.createElement("button"); b.className = "btn"; b.textContent = "✎ " + T.edit; b.onclick = () => { S.view = "edit"; drawEditor(); }; gh.insertBefore(b, gh.children[2]); const e2 = gh.querySelector('[data-a="edit"]'); if(e2) e2.remove(); };
  ui.querySelector('[data-a="save"]').onclick = saveVersion;
  const f = ui.querySelector(".form");
  if(S.cur === "guide") return guideForm(f);
  nodeForm(f, tr.nodes[S.cur], order);
}
function nodeOrder(tr){ const seen = [], walk = k => { if(!k || seen.includes(k) || !tr.nodes[k]) return; seen.push(k); const n = tr.nodes[k]; if(n.type === "choice" || n.type === "multi"){ (n.options || []).forEach(o => walk(o.next)); if(n.type === "multi") walk(n.after); } else walk(n.next); }; walk(tr.start); Object.keys(tr.nodes).forEach(k => { if(!seen.includes(k)) seen.push(k); }); return seen; }
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
  const sel = v => `<option value="">—</option>${order.filter(k => k !== n.id).map(k => `<option value="${k}" ${v === k ? "selected" : ""}>${esc((ICON[tr.nodes[k].type] ? ICON[tr.nodes[k].type] + " " : "") + (tr.nodes[k].title || k))}</option>`).join("")}<option value="__new">${E.newStep}</option>`;
  const opts = n.type === "choice" || n.type === "multi";
  f.innerHTML = `<div class="row2"><label>${E.type}<select data-t>${["step", "choice", "multi", "end"].map(t => `<option value="${t}" ${n.type === t ? "selected" : ""}>${E[t]}</option>`).join("")}</select></label><label>&nbsp;<span class="bar2">${tr.start === n.id ? `<span class="hint">★ ${E.isStart}</span>` : `<button class="chip" data-a="start">★ ${E.startHere}</button>`}<button class="chip" data-a="del" style="color:#e07b39">${E.del}</button></span></label></div>
    <div class="row2"><label>${E.titlePt}<input data-k="title" value="${esc(n.title || "")}"></label><label>${E.titleEn}<input data-k="title_en" value="${esc(n.title_en || "")}"></label></div>
    <div class="row2"><label>${E.text}<textarea data-k="text">${esc(n.text || "")}</textarea></label><label>${E.textEn}<textarea data-k="text_en">${esc(n.text_en || "")}</textarea></label></div>
    <label>${E.link}<input data-k="link" placeholder="https://" value="${esc(n.link || "")}"></label>
    ${n.type === "step" ? `<label>${E.next}<select data-next>${sel(n.next)}</select></label>` : ""}
    ${opts ? `<fieldset><legend>${n.type === "multi" ? E.multi : E.choice}</legend>${(n.options || []).map((o, i) => `<div class="optrow"><label>${E.option} ${i + 1}<input data-ol="${i}" value="${esc(o.label || "")}" placeholder="PT"></label><label>${E.goes}<select data-on="${i}">${sel(o.next)}</select></label><button class="chip" data-od="${i}" aria-label="remove">✕</button></div><label style="margin-top:-4px"><input data-oe="${i}" value="${esc(o.label_en || "")}" placeholder="EN (optional)"></label>`).join("")}<button class="chip" data-a="addopt">${E.addOpt}</button>${n.type === "multi" ? `<label>${E.after}<select data-after>${sel(n.after)}</select></label>` : ""}</fieldset>` : ""}
    <fieldset><legend>${E.shot}</legend><div data-shot></div></fieldset>`;
  f.querySelectorAll("[data-k]").forEach(i => i.oninput = () => { n[i.dataset.k] = i.value; markDirty(); const t = ui.querySelector(`.tree [data-n="${n.id}"] span`); if(t && i.dataset.k === "title") t.textContent = i.value || "—"; });
  f.querySelector("[data-t]").onchange = e => { n.type = e.target.value; if((n.type === "choice" || n.type === "multi") && !n.options) n.options = [{label:"", next:""}, {label:"", next:""}]; markDirty(); drawEditor(); };
  const linkNew = setter => { const k = nid(); tr.nodes[k] = {id:k, type:"step", title:"", text:""}; setter(k); S.cur = k; markDirty(); drawEditor(); };
  const nx = f.querySelector("[data-next]"); if(nx) nx.onchange = e => { if(e.target.value === "__new") return linkNew(k => n.next = k); n.next = e.target.value; markDirty(); };
  const af = f.querySelector("[data-after]"); if(af) af.onchange = e => { if(e.target.value === "__new") return linkNew(k => n.after = k); n.after = e.target.value; markDirty(); };
  f.querySelectorAll("[data-ol]").forEach(i => i.oninput = () => { n.options[+i.dataset.ol].label = i.value; markDirty(); });
  f.querySelectorAll("[data-oe]").forEach(i => i.oninput = () => { n.options[+i.dataset.oe].label_en = i.value; markDirty(); });
  f.querySelectorAll("[data-on]").forEach(s => s.onchange = e => { const i = +s.dataset.on; if(e.target.value === "__new") return linkNew(k => n.options[i].next = k); n.options[i].next = e.target.value; markDirty(); });
  f.querySelectorAll("[data-od]").forEach(b => b.onclick = () => { n.options.splice(+b.dataset.od, 1); markDirty(); drawEditor(); });
  const ao = f.querySelector('[data-a="addopt"]'); if(ao) ao.onclick = () => { n.options.push({label:"", next:""}); markDirty(); drawEditor(); };
  const st = f.querySelector('[data-a="start"]'); if(st) st.onclick = () => { tr.start = n.id; markDirty(); drawEditor(); };
  f.querySelector('[data-a="del"]').onclick = () => { if(!confirm(E.delQ)) return; delete tr.nodes[n.id]; for(const m of Object.values(tr.nodes)){ if(m.next === n.id) m.next = ""; if(m.after === n.id) m.after = ""; (m.options || []).forEach(o => { if(o.next === n.id) o.next = ""; }); } if(tr.start === n.id) tr.start = Object.keys(tr.nodes)[0] || null; S.cur = "guide"; markDirty(); drawEditor(); };
  shotEditor(f.querySelector("[data-shot]"), n);
}
/* reading the screen on the device to find private data (Tesseract, loaded only when needed; the picture never leaves the device) */
let OCR = null;
async function ocrWorker(progress){
  if(OCR) return OCR;
  await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js");
  OCR = await Tesseract.createWorker(["por", "eng"], 1, {logger:m => { if(progress && m && typeof m.progress === "number") progress(m.status, m.progress); }});
  return OCR; }
const PRIV = [/\b\d{3}[ .]?\d{3}[ .]?\d{3}\b/, /\b\d{11}\b/, /\bPT\s?50(?:\s?\d){10,}/i, /[\w.+-]+@[\w-]+\.[\w.-]+/, /(?:\+351\s?)?\b[29]\d{2}\s?\d{3}\s?\d{3}\b/, /\b\d{4}\s?-\s?\d{3}\b/, /\b\d{8}\s?\d?\s?[A-Z]{2}\d\b/, /\b\d{1,2}[\/.-]\d{1,2}[\/.-](?:19|20)\d{2}\b/];
const LABEL = /^(nome|name|requerente|titular|morada|endere[çc]o|resid[êe]ncia|contribuinte|nif|nipc|niss|e-?mail|telefone|telem[óo]vel|phone|address|representante|propriet[áa]rio|owner|utilizador|user|cart[ãa]o de cidad[ãa]o|cc|bi)\b/i;
function findPrivate(data, W, H){
  const lines = (data.lines && data.lines.length) ? data.lines : (data.blocks || []).flatMap(b => (b.paragraphs || []).flatMap(p => p.lines || []));
  const boxes = [];
  const add = ws => { if(!ws.length) return; const x0 = Math.min(...ws.map(w => w.bbox.x0)), y0 = Math.min(...ws.map(w => w.bbox.y0)), x1 = Math.max(...ws.map(w => w.bbox.x1)), y1 = Math.max(...ws.map(w => w.bbox.y1)); const p = 4; boxes.push({x:Math.max(0, (x0 - p) / W), y:Math.max(0, (y0 - p) / H), w:Math.min(1, (x1 - x0 + 2 * p) / W), h:Math.min(1, (y1 - y0 + 2 * p) / H), on:true}); };
  for(const ln of lines){ const ws = (ln.words || []).filter(w => w.text && w.text.trim()); if(!ws.length) continue; const txt = ws.map(w => w.text).join(" ");
    const li = ws.findIndex(w => LABEL.test(w.text.replace(/[:：]+$/, "")));
    if(li >= 0 && li < ws.length - 1){ add(ws.slice(li + 1)); continue; }
    if(PRIV.some(r => r.test(txt))){ const hit = ws.filter(w => /\d{3,}|@/.test(w.text) || PRIV.some(r => r.test(w.text))); add(hit.length ? hit : ws); } }
  return boxes; }
/* the screenshot: paste / drop / choose → private data found and pre-marked → adjust → click spot → upload */
function shotEditor(box, n){
  const E = T.ed; let base = null, blurs = [], sugg = [], hot = n.hot ? {...n.hot} : null, mode = n.img ? "spot" : "blur", fresh = false, scanMsg = "";
  const render = () => {
    box.innerHTML = `${!base && !n.img ? `<div class="drop" tabindex="0">${E.paste} <a data-a="pick">${E.choose}</a><input type="file" accept="image/*" hidden></div>` : `<div class="cvtools"><button class="chip blur ${mode === "blur" ? "on" : ""}" data-m="blur">▦ ${E.blur}</button><button class="chip spot ${mode === "spot" ? "on" : ""}" data-m="spot">◎ ${E.spot}</button><button class="chip" data-a="scan">🔎 ${E.scan}</button><button class="chip" data-a="undo">↶ ${E.undo}</button><span style="flex:1"></span><button class="chip" data-a="rep">${E.replace}</button><input type="file" accept="image/*" hidden></div>
      <div class="hint">${mode === "blur" ? E.blurHint : E.spotHint}</div><div class="scanmsg" ${scanMsg ? "" : "hidden"}>${esc(scanMsg)}</div><div class="cv"><canvas></canvas>${sugg.map((s, i) => `<span class="sg ${s.on ? "" : "off"}" data-sg="${i}" style="left:${s.x * 100}%;top:${s.y * 100}%;width:${s.w * 100}%;height:${s.h * 100}%"></span>`).join("")}<span class="box" hidden></span></div><div class="bar2"><button class="btn pri" data-a="use">${E.use}</button></div>`}`;
    const file = box.querySelector('input[type="file"]'); if(file) file.onchange = e => { const f = e.target.files[0]; if(f) load(f); };
    const pick = box.querySelector('[data-a="pick"]'); if(pick) pick.onclick = () => file.click();
    const rep = box.querySelector('[data-a="rep"]'); if(rep) rep.onclick = () => file.click();
    const drop = box.querySelector(".drop"); if(drop){ drop.ondragover = e => { e.preventDefault(); drop.classList.add("over"); }; drop.ondragleave = () => drop.classList.remove("over"); drop.ondrop = e => { e.preventDefault(); drop.classList.remove("over"); const f = [...e.dataTransfer.files].find(x => x.type.startsWith("image/")); if(f) load(f); }; }
    box.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { mode = b.dataset.m; render(); });
    box.querySelectorAll("[data-sg]").forEach(s => s.onpointerdown = e => { e.stopPropagation(); const i = +s.dataset.sg; sugg[i].on = !sugg[i].on; fresh = true; render(); });
    const sc = box.querySelector('[data-a="scan"]'); if(sc) sc.onclick = scan;
    const un = box.querySelector('[data-a="undo"]'); if(un) un.onclick = () => { if(mode === "blur" && blurs.length) blurs.pop(); else hot = null; paint(); };
    const use = box.querySelector('[data-a="use"]'); if(use) use.onclick = commit;
    if(base || n.img) setupCanvas();
  };
  const load = file => { const im = new Image(); im.onload = () => { base = im; blurs = []; sugg = []; hot = null; fresh = true; mode = "blur"; scanMsg = ""; render(); scan(); }; im.src = URL.createObjectURL(file); };
  const onPaste = e => { if(!box.isConnected){ document.removeEventListener("paste", onPaste); return; } const it = [...((e.clipboardData || {}).items || [])].find(x => x.type.startsWith("image/")); if(it){ e.preventDefault(); load(it.getAsFile()); } };
  document.addEventListener("paste", onPaste);
  async function scan(){
    const cv = box.querySelector("canvas"); if(!cv || !base){ setTimeout(scan, 300); return; }
    const setMsg = m => { scanMsg = m; const el = box.querySelector(".scanmsg"); if(el){ el.hidden = !m; el.textContent = m; } };
    setMsg(E.loadingOcr);
    try{ const w = await ocrWorker((st, p) => setMsg(/recogniz/i.test(st) ? `${E.scanning} ${Math.round(p * 100)}%` : E.loadingOcr));
      const clean = document.createElement("canvas"); clean.width = cv.width; clean.height = cv.height; clean.getContext("2d").drawImage(base, 0, 0, cv.width, cv.height);
      const {data} = await w.recognize(clean, {}, {blocks:true, text:true});
      if(!box.isConnected) return; sugg = findPrivate(data, clean.width, clean.height); fresh = true; scanMsg = sugg.length ? E.found(sugg.length) : E.foundNone; render(); }
    catch(e){ setMsg(E.ocrFail); }
  }
  function setupCanvas(){
    const cv = box.querySelector("canvas"), bx = box.querySelector(".box"), wrap = box.querySelector(".cv");
    if(!base && n.img){ const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => { base = im; setupCanvas(); }; im.src = imgURL(n.img); return; }
    const W = Math.min(1600, base.naturalWidth), H = Math.round(base.naturalHeight * W / base.naturalWidth); cv.width = W; cv.height = H; paint();
    let start = null;
    const at = e => { const r = cv.getBoundingClientRect(); return {x:Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y:Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))}; };
    wrap.onpointerdown = e => { start = at(e); wrap.setPointerCapture(e.pointerId); };
    wrap.onpointermove = e => { if(!start) return; const p = at(e); const x = Math.min(start.x, p.x), y = Math.min(start.y, p.y), w = Math.abs(p.x - start.x), h = Math.abs(p.y - start.y); bx.hidden = false; Object.assign(bx.style, {left:x * 100 + "%", top:y * 100 + "%", width:w * 100 + "%", height:h * 100 + "%", borderColor:mode === "blur" ? "#e8a35a" : "#ffcc33"}); };
    wrap.onpointerup = e => { if(!start) return; const p = at(e); const r = {x:Math.min(start.x, p.x), y:Math.min(start.y, p.y), w:Math.abs(p.x - start.x), h:Math.abs(p.y - start.y)}; start = null; bx.hidden = true; if(r.w < .01 || r.h < .008) return; if(mode === "blur"){ blurs.push(r); fresh = true; } else hot = r; paint(); };
  }
  function pix(c, cv, r){ const W = cv.width, H = cv.height; const x = Math.round(r.x * W), y = Math.round(r.y * H), w = Math.max(2, Math.round(r.w * W)), h = Math.max(2, Math.round(r.h * H)); const b = Math.max(12, Math.round(Math.min(w, h) / 3)); const t = document.createElement("canvas"); t.width = Math.max(1, Math.round(w / b)); t.height = Math.max(1, Math.round(h / b)); t.getContext("2d").drawImage(cv, x, y, w, h, 0, 0, t.width, t.height); c.imageSmoothingEnabled = false; c.drawImage(t, 0, 0, t.width, t.height, x, y, w, h); c.imageSmoothingEnabled = true; }
  function paint(){
    const cv = box.querySelector("canvas"); if(!cv || !base) return; const c = cv.getContext("2d"), W = cv.width, H = cv.height;
    c.drawImage(base, 0, 0, W, H);
    for(const r of [...blurs, ...sugg.filter(s => s.on)]) pix(c, cv, r);
    if(hot){ c.save(); c.strokeStyle = "#ffcc33"; c.lineWidth = Math.max(3, W / 300); c.setLineDash([10, 6]); c.strokeRect(hot.x * W, hot.y * H, hot.w * W, hot.h * H); c.restore(); }
  }
  async function commit(){
    const btn = box.querySelector('[data-a="use"]');
    if(!fresh && n.img){ n.hot = hot; markDirty(); say(T.ed.saved); drawEditor(); return; }
    /* the uploaded picture carries the blur but not the click-spot box (the player draws that live) */
    const cv = box.querySelector("canvas"); const keepHot = hot; hot = null; paint();
    const out = document.createElement("canvas"); out.width = cv.width; out.height = cv.height; out.getContext("2d").drawImage(cv, 0, 0); hot = keepHot; paint();
    btn.disabled = true; btn.textContent = T.ed.uploading;
    out.toBlob(async blob => { try{ const r = await window.edrUpload(blob, {feature_id:"guide:" + S.ed.id, caption:"[guia] " + (n.title || n.id), actor:auth().actor}, null, "m-g" + Date.now().toString(36)); n.img = r.id; n.hot = hot; fresh = false; base = null; blurs = []; sugg = []; scanMsg = ""; markDirty(); say(T.ed.saved); drawEditor(); }
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
/* ---------- open / close, nav entry, shared links, map cards ---------- */
function open(id){ ui.classList.add("on"); if(id) play(id); else library(); }
function close(){ if(document.fullscreenElement === ui && document.exitFullscreen) document.exitFullscreen(); ui.classList.remove("on", "present"); S.pub = null; if(/^#guides?(=|$)/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search); }
function route(){ const m = location.hash.match(/^#guide=([A-Za-z0-9]{16,40})$/); if(m) return openPublic(m[1]); if(location.hash === "#guides" && !ui.classList.contains("on")) open(); }
addEventListener("hashchange", () => { if(ui.classList.contains("on") && !/^#guides?(=|$)/.test(location.hash) && S.view !== "edit") { ui.classList.remove("on", "present"); return; } route(); });
/* the menu link opens the guides straight away — no page reload, and it works even when the address already ends in #guides */
document.addEventListener("click", e => { const a = e.target.closest && e.target.closest('a[href$="#guides"]'); if(!a) return; e.preventDefault(); if(location.hash !== "#guides") history.pushState(null, "", location.pathname + location.search + "#guides"); open(); }, true);
/* opened by address (#guides): open at once; when the sign-in is confirmed a moment later, the library refreshes */
if(/^#guides?(=|$)/.test(location.hash)) route();
document.addEventListener("edr-auth", () => { if(ui.classList.contains("on") && S.view === "lib") library(); });
document.addEventListener("keydown", e => { if(e.key === "Escape" && ui.classList.contains("on") && !ui.querySelector(".lbx, .dlg") && !document.fullscreenElement) close(); });
let LINKS = null, linksAt = 0;
async function cacheLinks(force){ if(auth().role === "viewer") return []; if(!force && LINKS && Date.now() - linksAt < 300000) return LINKS; const d = await api("GET", "/guides"); LINKS = (d.guides || []).filter(g => (g.links || []).length); linksAt = Date.now(); return LINKS; }
const prevShow = window.showCard;
if(prevShow){ window.showCard = function(...a){ const r = prevShow.apply(this, a); const layer = a[3]; if(layer && auth().role !== "viewer") cacheLinks().then(list => { const hits = (list || []).filter(g => g.links.some(l => l.layer === layer)); if(!hits.length) return; const pp = document.querySelector("#cbody .pp"); if(!pp) return;
  document.querySelectorAll("#cbody .gdlink").forEach(x => x.remove()); for(const g of hits.slice(0, 3)){ const b = document.createElement("button"); b.className = "gdlink"; b.style.cssText = "display:block;width:100%;margin:8px 0 2px;padding:9px 12px;border-radius:9px;border:1px solid var(--line-2,#47402f);background:transparent;color:var(--linen,#ece4d2);font:600 13px var(--ui,sans-serif);cursor:pointer;text-align:left"; b.textContent = `📘 ${L(g, "title")}${g.agency ? " · " + g.agency : ""}`; b.onclick = () => open(g.id); pp.after(b); } }); return r; }; }
window.edrGuides = {open, close, state:S, advance, findPrivate};
})();
