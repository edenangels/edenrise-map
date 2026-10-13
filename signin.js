// EdenRise map — signing in: your full name and a short PIN, once per device.
//
// The team does not handle keys. Leadership adds each member (full name, PIN made up or chosen), the member signs in
// once with name + PIN, and the device stays signed in. A forgotten PIN is shown again after typing the full name —
// simple on purpose; every time it happens the team channel says so. Leadership manages members here too: add, new
// PIN, make leadership, remove (signs their devices out). The old team keys still work ("Use a team key").
(function(){
const EN = (typeof LANG !== "undefined") && LANG === "en";
const API = "https://edenrise-brain.edenrise.workers.dev"; const SITE = (typeof SITE_ID !== "undefined") ? SITE_ID : "edenrise";
const T = EN ? {title:"Sign in", sub:"Your full name and your PIN. This device remembers you. First time? Type your name and press Sign in — you choose your PIN.", choose:"Choose your PIN", chooseSub:"4 to 6 digits, only you need to know it. You type it once per device.", again:"Type it again", mismatch:"The two PINs are not the same.", pinFmt:"Use 4 to 6 digits.", set:"Save my PIN", change:"Change my PIN", changed:"PIN changed", pinSet:"PIN chosen", pinWaiting:"waiting to choose their PIN", resetPin:"Reset PIN", resetQ:"Reset this PIN? They choose a new one the next time they sign in, and their devices are signed out.", addedChoose:"Added. They choose their own PIN the first time they sign in.", name:"Full name", pin:"PIN", go:"Sign in", forgot:"Forgot your PIN?", key:"Use a team key", bad:"Name or PIN not right. Check both and try again.", wait:"Too many tries from here. Wait an hour, or ask leadership.", net:"No connection. Try again with signal.", recT:"Forgot your PIN", recSub:"Type your full name, first and last, as leadership added it.", show:"Show my PIN", yours:"Your PIN", useIt:"Sign in with it", unknown:"No member with that name. Check the spelling, or ask leadership to add you.", back:"Back", me:"Signed in as", out:"Sign out", outQ:"Sign out on this device?", members:"Team members", close:"Close", member:"member", leader:"leadership", add:"Add member", addName:"Full name (first and last)", addPin:"PIN (4–6 digits, empty = made up)", added:"Added. Their PIN:", newPin:"New PIN", makeLeader:"Make leadership", makeMember:"Make member", remove:"Remove", removeQ:"Remove this member? Their devices are signed out. You can add them back.", restore:"Add back", lastSeen:"last seen", never:"not signed in yet", devices:"devices", removed:"removed", fullname:"Use first and last name.", exists:"There is already a member with that name.", pinShown:"PIN", copy:"Copy", copied:"Copied", rights:"Members can view, change, move and delete team items. Approving and rejecting stays with leadership.", fieldKey:"Signed in with a team key", notYet:"Signing in by name is not switched on yet. Use a team key for now."}
             : {title:"Entrar", sub:"O teu nome completo e o teu PIN. Este aparelho lembra-se de ti. Primeira vez? Escreve o nome e carrega em Entrar — escolhes o teu PIN.", choose:"Escolhe o teu PIN", chooseSub:"4 a 6 dígitos, só tu precisas de o saber. Escreves uma vez por aparelho.", again:"Escreve outra vez", mismatch:"Os dois PIN não são iguais.", pinFmt:"Usa 4 a 6 dígitos.", set:"Guardar o meu PIN", change:"Mudar o meu PIN", changed:"PIN mudado", pinSet:"PIN escolhido", pinWaiting:"à espera de escolher o PIN", resetPin:"Repor PIN", resetQ:"Repor este PIN? Escolhe um novo da próxima vez que entrar, e os aparelhos dele saem.", addedChoose:"Adicionado. Escolhe o seu próprio PIN da primeira vez que entrar.", name:"Nome completo", pin:"PIN", go:"Entrar", forgot:"Esqueceste o PIN?", key:"Usar uma chave de equipa", bad:"Nome ou PIN errado. Confirma os dois e tenta outra vez.", wait:"Demasiadas tentativas daqui. Espera uma hora, ou fala com a liderança.", net:"Sem ligação. Tenta outra vez com rede.", recT:"Esqueci o PIN", recSub:"Escreve o teu nome completo, primeiro e último, como a liderança o registou.", show:"Mostrar o meu PIN", yours:"O teu PIN", useIt:"Entrar com ele", unknown:"Nenhum membro com esse nome. Confirma a escrita, ou pede à liderança para te adicionar.", back:"Voltar", me:"Entraste como", out:"Sair", outQ:"Sair neste aparelho?", members:"Membros da equipa", close:"Fechar", member:"membro", leader:"liderança", add:"Adicionar membro", addName:"Nome completo (primeiro e último)", addPin:"PIN (4–6 dígitos, vazio = inventado)", added:"Adicionado. O PIN é:", newPin:"Novo PIN", makeLeader:"Passar a liderança", makeMember:"Passar a membro", remove:"Remover", removeQ:"Remover este membro? Os aparelhos dele saem. Podes voltar a adicioná-lo.", restore:"Voltar a adicionar", lastSeen:"visto", never:"ainda não entrou", devices:"aparelhos", removed:"removido", fullname:"Usa o primeiro e o último nome.", exists:"Já existe um membro com esse nome.", pinShown:"PIN", copy:"Copiar", copied:"Copiado", rights:"Os membros podem ver, alterar, mover e apagar itens da equipa. Aprovar e rejeitar fica com a liderança.", fieldKey:"Entraste com uma chave de equipa", notYet:"Entrar com o nome ainda não está ligado. Usa uma chave de equipa por agora."};
const auth = () => window.edrAuth || {key:"", role:"viewer", actor:""};
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));
const hdr = () => ({"Content-Type":"application/json", ...(auth().key ? {"X-Role-Key":auth().key} : {})});
async function call(method, path, body){ const r = await fetch(API + path, {method, headers:hdr(), body:body ? JSON.stringify(body) : undefined}); let d = {}; try{ d = await r.json(); }catch(e){} return {status:r.status, ...d}; }

const css = document.createElement("style"); css.textContent = `
#signin{position:fixed;inset:0;z-index:7200;display:none;align-items:center;justify-content:center;background:rgba(10,9,7,.55);padding:16px}
#signin.on{display:flex}
#signin .sp{width:min(420px,100%);max-height:calc(100% - 8px);overflow:auto;background:#1c1813;color:#f1e9d8;border:1px solid rgba(241,233,216,.16);border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.5);padding:22px;display:flex;flex-direction:column;gap:12px;font:500 14px/1.5 var(--ui,system-ui)}
#signin.wide .sp{width:min(680px,100%)}
#signin h2{margin:0;font:700 20px var(--ui,system-ui)} #signin p{margin:0;opacity:.78;font-size:13.5px}
#signin label{display:flex;flex-direction:column;gap:5px;font:600 12px var(--ui,system-ui);letter-spacing:.02em;opacity:.95}
#signin input,#signin select{height:46px;border-radius:12px;border:1px solid rgba(241,233,216,.22);background:rgba(0,0,0,.3);color:#f1e9d8;padding:0 14px;font:500 16px var(--ui,system-ui)}
#signin input.pinbox{letter-spacing:.4em;font:600 22px var(--mono,monospace);text-align:center}
#signin input:focus-visible,#signin button:focus-visible{outline:2px solid #c9a227;outline-offset:2px}
#signin button{min-height:44px;border-radius:12px;border:1px solid rgba(241,233,216,.25);background:transparent;color:#f1e9d8;font:600 14px var(--ui,system-ui);padding:0 14px;cursor:pointer}
#signin button.ok{background:#c9a227;color:#1c1813;border-color:#c9a227} #signin button.link{border:0;min-height:32px;padding:0;text-decoration:underline;opacity:.85;align-self:flex-start;font-weight:500}
#signin button.x{border-color:#e5484d;color:#ff8f8f}
#signin .err{color:#ff8f8f;font-size:13px;min-height:1em} #signin .msg{color:#5be0a0;font-size:13px}
#signin .row{display:flex;gap:8px;flex-wrap:wrap} #signin .row > *{flex:1 1 auto}
#signin .big{font:700 40px var(--mono,monospace);letter-spacing:.3em;text-align:center;padding:10px;border:1px dashed #c9a227;border-radius:14px;color:#c9a227}
#signin .who{display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;background:rgba(255,255,255,.05)} #signin .who b{font-size:16px} #signin .who small{display:block;opacity:.7}
#signin .mlist{display:flex;flex-direction:column;gap:6px}
#signin .m{display:grid;grid-template-columns:1fr auto;gap:6px 10px;align-items:center;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(241,233,216,.1)}
#signin .m.off{opacity:.55} #signin .m small{display:block;opacity:.7;font-size:12px} #signin .m .acts{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
#signin .m .acts button{min-height:34px;font-size:12.5px;padding:0 10px}
#signin .pinv{font:700 15px var(--mono,monospace);letter-spacing:.15em;color:#c9a227}
@media (max-width:520px){ #signin .m{grid-template-columns:1fr} #signin .m .acts{justify-content:flex-start} }`;
document.head.appendChild(css);
const box = document.createElement("div"); box.id = "signin"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", T.title);
box.innerHTML = `<div class="sp"></div>`; document.body.appendChild(box);
const sp = box.querySelector(".sp");
box.addEventListener("click", e => { if(e.target === box) close(); });
document.addEventListener("keydown", e => { if(e.key === "Escape" && box.classList.contains("on")) close(); });
let waiters = []; function close(){ box.classList.remove("on", "wide"); const w = waiters; waiters = []; w.forEach(f => f()); }
function show(html){ box.classList.add("on"); sp.innerHTML = html; const f = sp.querySelector("input"); if(f && !matchMedia("(pointer:coarse)").matches) f.focus(); }

/* ---------- sign in ---------- */
function signInView(prefill){
  show(`<h2>${T.title}</h2><p>${T.sub}</p>
    <form id="sif" class="col" style="display:flex;flex-direction:column;gap:12px" autocomplete="on">
      <label>${T.name}<input id="sin" name="name" autocomplete="name" autocapitalize="words" required value="${esc(prefill && prefill.name || auth().actor || "")}"></label>
      <label>${T.pin}<input id="sip" class="pinbox" name="pin" type="password" inputmode="numeric" pattern="[0-9]{4,6}" maxlength="6" autocomplete="current-password" value="${esc(prefill && prefill.pin || "")}"></label>
      <div class="err" id="sie" role="alert"></div>
      <button class="ok" type="submit">${T.go}</button>
    </form>
    <button class="link" data-a="forgot">${T.forgot}</button><button class="link" data-a="key">${T.key}</button>`);
  sp.querySelector("#sif").onsubmit = async e => { e.preventDefault(); const name = sp.querySelector("#sin").value, pin = sp.querySelector("#sip").value.trim(); const er = sp.querySelector("#sie"); er.textContent = "";
    try{ const d = await call("POST", "/auth/pin", {name, pin}); if(d.needsPin) return choosePinView(d.name, "first"); if(d.ok){ auth().use(d.token, d.role, d.name); window.toast && toast(`${T.me} ${d.name}`); close(); return; }
      er.textContent = d.status === 429 ? T.wait : (d.status === 404 && d.error !== "nomatch") ? T.notYet : T.bad; const pi = sp.querySelector("#sip"); pi.value = ""; pi.focus(); }catch(err){ er.textContent = T.net; } };
  sp.querySelector('[data-a="forgot"]').onclick = () => forgotView(sp.querySelector("#sin").value);
  sp.querySelector('[data-a="key"]').onclick = () => { close(); auth().legacyKey && auth().legacyKey(); };
}
function forgotView(name){
  show(`<h2>${T.recT}</h2><p>${T.recSub}</p><form id="rf" style="display:flex;flex-direction:column;gap:12px"><label>${T.name}<input id="rn" autocomplete="name" autocapitalize="words" required value="${esc(name || "")}"></label><div class="err" id="re" role="alert"></div><button class="ok" type="submit">${T.show}</button></form><button class="link" data-a="back">${T.back}</button>`);
  sp.querySelector('[data-a="back"]').onclick = () => signInView({name:sp.querySelector("#rn").value});
  sp.querySelector("#rf").onsubmit = async e => { e.preventDefault(); const n = sp.querySelector("#rn").value; const er = sp.querySelector("#re"); er.textContent = "";
    try{ const d = await call("POST", "/auth/recover", {name:n, site:SITE});
      if(d.needsPin) return choosePinView(d.name, "first");
      if(d.ok){ show(`<h2>${T.yours}</h2><p>${esc(d.name)}</p><div class="big" aria-label="${T.yours}">${esc(d.pin)}</div><button class="ok" data-a="use">${T.useIt}</button><button class="link" data-a="back">${T.back}</button>`);
        sp.querySelector('[data-a="use"]').onclick = () => signInView({name:d.name, pin:d.pin}); sp.querySelector('[data-a="back"]').onclick = () => signInView({name:d.name}); return; }
      er.textContent = d.status === 429 ? T.wait : (d.status === 404 && d.error === "unknown") ? T.unknown : d.status === 404 ? T.notYet : T.net; }catch(err){ er.textContent = T.net; } };
}
/* ---------- choosing a PIN: first sign-in, after a reset, or a member changing it ---------- */
function choosePinView(name, mode){
  show(`<h2>${T.choose}</h2><p>${esc(name || "")}</p><p>${T.chooseSub}</p>
    <form id="cf" style="display:flex;flex-direction:column;gap:12px" autocomplete="off">
      <label>${T.pin}<input id="cp1" class="pinbox" type="password" inputmode="numeric" pattern="[0-9]{4,6}" maxlength="6" autocomplete="new-password" required></label>
      <label>${T.again}<input id="cp2" class="pinbox" type="password" inputmode="numeric" pattern="[0-9]{4,6}" maxlength="6" autocomplete="new-password" required></label>
      <div class="err" id="ce" role="alert"></div><button class="ok" type="submit">${T.set}</button></form>
    <button class="link" data-a="back">${T.back}</button>`);
  sp.querySelector('[data-a="back"]').onclick = () => mode === "change" ? meView() : signInView({name});
  sp.querySelector("#cf").onsubmit = async e => { e.preventDefault(); const a1 = sp.querySelector("#cp1").value.trim(), a2 = sp.querySelector("#cp2").value.trim(); const er = sp.querySelector("#ce"); er.textContent = "";
    if(!/^\d{4,6}$/.test(a1)){ er.textContent = T.pinFmt; return; } if(a1 !== a2){ er.textContent = T.mismatch; sp.querySelector("#cp2").value = ""; sp.querySelector("#cp2").focus(); return; }
    try{
      if(mode === "change"){ const d = await call("POST", "/auth/changepin", {pin:a1}); if(d.ok){ window.toast && toast(T.changed); meView(); } else er.textContent = T.net; return; }
      const d = await call("POST", "/auth/setpin", {name, pin:a1}); if(d.ok){ auth().use(d.token, d.role, d.name); window.toast && toast(`${T.me} ${d.name}`); close(); return; }
      er.textContent = d.status === 429 ? T.wait : d.status === 409 ? T.bad : T.net; }catch(err){ er.textContent = T.net; } };
}
/* ---------- signed in ---------- */
function meView(){
  const a = auth(); const member = a.key && a.key.startsWith("mt_"); const roleL = a.role === "leader" ? T.leader : a.role === "team" ? T.member : a.role;
  show(`<h2>${T.title}</h2><div class="who"><div><small>${member ? T.me : T.fieldKey}</small><b>${esc(a.actor || "—")}</b><small>${esc(roleL)}</small></div></div>
    ${a.role === "team" ? `<p>${T.rights}</p>` : ""}
    <div class="row">${member ? `<button data-a="chg">🔑 ${T.change}</button>` : ""}${a.role === "leader" ? `<button data-a="members">👥 ${T.members}</button>` : ""}<button class="x" data-a="out">${T.out}</button><button data-a="close">${T.close}</button></div>`);
  sp.querySelector('[data-a="close"]').onclick = close;
  sp.querySelector('[data-a="out"]').onclick = async () => { if(!confirm(T.outQ)) return; if(member){ try{ await call("POST", "/auth/signout"); }catch(e){} } a.out(); close(); };
  const mb = sp.querySelector('[data-a="members"]'); if(mb) mb.onclick = membersView;
  const cg = sp.querySelector('[data-a="chg"]'); if(cg) cg.onclick = () => choosePinView(a.actor, "change");
}
/* ---------- leadership: the members list ---------- */
async function membersView(){
  box.classList.add("wide"); show(`<h2>${T.members}</h2><p>${T.rights}</p><div class="mlist"><p>…</p></div>
    <form id="mf" style="display:flex;flex-direction:column;gap:10px;border-top:1px solid rgba(241,233,216,.12);padding-top:12px"><b>${T.add}</b>
      <label>${T.addName}<input id="mn" autocomplete="off" autocapitalize="words" required></label>
      <div class="err" id="me" role="alert"></div><div class="msg" id="mm" role="status"></div><button class="ok" type="submit">＋ ${T.add}</button></form>
    <button data-a="close">${T.close}</button>`);
  sp.querySelector('[data-a="close"]').onclick = close;
  sp.querySelector("#mf").onsubmit = async e => { e.preventDefault(); const er = sp.querySelector("#me"), mm = sp.querySelector("#mm"); er.textContent = ""; mm.textContent = "";
    const d = await call("POST", "/members", {name:sp.querySelector("#mn").value, actor:auth().actor});
    if(d.ok){ mm.textContent = `${d.name} · ${T.addedChoose}`; sp.querySelector("#mn").value = ""; paintMembers(); }
    else er.textContent = d.error === "fullname" ? T.fullname : d.error === "exists" ? T.exists : T.net; };
  paintMembers();
}
async function paintMembers(){
  const host = sp.querySelector(".mlist"); if(!host) return; let d; try{ d = await call("GET", "/members"); }catch(e){ host.innerHTML = `<p>${T.net}</p>`; return; }
  const ms = d.members || [];
  host.innerHTML = ms.map(m => `<div class="m ${m.active ? "" : "off"}" data-id="${m.id}"><div><b>${esc(m.name)}</b> <small>${m.role === "leader" ? T.leader : T.member}${m.active ? "" : " · " + T.removed} · ${m.last_seen ? `${T.lastSeen} ${new Date(m.last_seen).toLocaleString(EN ? "en-GB" : "pt-PT", {day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit"})} · ${m.devices} ${T.devices}` : T.never}</small>
      <small>${m.pin_set ? "🔑 " + T.pinSet : "⏳ " + T.pinWaiting}</small></div>
    <div class="acts">${m.active ? `<button data-x="pin">${T.resetPin}</button><button data-x="role">${m.role === "leader" ? T.makeMember : T.makeLeader}</button><button class="x" data-x="remove">${T.remove}</button>` : `<button data-x="restore">${T.restore}</button>`}</div></div>`).join("") || `<p>—</p>`;
  host.querySelectorAll(".m").forEach(row => row.querySelectorAll("[data-x]").forEach(b => b.onclick = async () => {
    const id = row.dataset.id, x = b.dataset.x, m = ms.find(z => String(z.id) === id);
    if(x === "remove" && !confirm(T.removeQ)) return; if(x === "pin" && !confirm(T.resetQ)) return;
    const body = x === "pin" ? {pin:"reset"} : x === "role" ? {role:m.role === "leader" ? "team" : "leader", signout:true} : x === "remove" ? {active:false} : {active:true};
    await call("PATCH", `/members/${id}`, {...body, actor:auth().actor}); paintMembers(); }));
}
function open(){ const a = auth(); if(a.key) meView(); else signInView(); return new Promise(res => waiters.push(res)); }   // resolves when the sheet closes, so "Edit" can continue straight after signing in
/* the sign-in button says who is here: a member's first name, otherwise the role */
function badge(){ const el = document.getElementById("brole"); const a = auth(); if(!el) return; if(a.key && a.key.startsWith("mt_") && a.actor){ el.textContent = "👤 " + a.actor.split(" ")[0]; el.title = `${a.actor} · ${a.role === "leader" ? T.leader : T.member}`; } }
document.addEventListener("edr-auth", () => setTimeout(badge, 0)); setTimeout(badge, 1500);
window.edrSignIn = {open, close};
})();
