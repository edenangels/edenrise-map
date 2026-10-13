/* One panel at a time: opening an item, the team, tasks, the brain or the proposals list
   closes whichever of the others is open, so sheets never stack on top of each other.
   An item that is being edited is never closed from here. */
(function(){
  const $ = id => document.getElementById(id);
  const editing = () => { const b = $("editbtn"); return !!(b && b.classList.contains("on")); };
  const PANELS = [
    {id:"card",   open: e => !e.hidden,                close: () => { const x = $("cclose"); if(x) x.click(); }},
    {id:"eform",  open: e => !e.hidden,                close: () => { if(editing()) return false; const x = $("ecancel"); if(x) x.click(); }},
    {id:"tpanel", open: e => !e.hidden,                close: e => { e.hidden = true; }},
    {id:"brain",  open: e => !e.hidden,                close: () => { const x = $("bclose"); if(x) x.click(); }},
    {id:"teamp",  open: e => e.classList.contains("on"), close: e => { const x = e.querySelector("[data-x]"); if(x) x.click(); else e.classList.remove("on"); }},
    {id:"propc",  open: e => e.classList.contains("on"), close: () => { if(window.edrProposals) edrProposals.close(); }}
  ];
  const was = {}; let busy = false;
  function check(){
    if(busy) return; busy = true;
    try{
      const now = {}; for(const p of PANELS){ const e = $(p.id); now[p.id] = !!(e && p.open(e)); }
      const fresh = PANELS.filter(p => now[p.id] && !was[p.id]);
      if(fresh.length){ const keep = fresh[fresh.length - 1].id;
        for(const p of PANELS){ if(p.id === keep || !now[p.id]) continue; const e = $(p.id); if(p.close(e) !== false) now[p.id] = !!(e && p.open(e)); } }
      Object.assign(was, now);
      document.body.classList.toggle("sheet-open", PANELS.some(p => now[p.id]));
    } finally { busy = false; }
  }
  const mo = new MutationObserver(check); const watched = new Set();
  function watch(){ for(const p of PANELS){ const e = $(p.id); if(e && !watched.has(e)){ watched.add(e); mo.observe(e, {attributes:true, attributeFilter:["hidden","class"]}); } } check(); }
  /* panels are created lazily by their own scripts, so look again when the page grows */
  new MutationObserver(() => { if(watched.size < PANELS.length) watch(); }).observe(document.body, {childList:true, subtree:true});
  watch(); window.edrSheets = {check};
})();
