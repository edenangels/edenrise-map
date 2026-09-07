// Live — real-time cursors and in-progress drawings between teammates (WebSocket to the estate room). Falls back silently to presence polling.
(function(){
const WS="wss://edenrise-brain.edenrise.workers.dev/live"; const EN=(typeof LANG!=="undefined")&&LANG==="en";
const auth=()=>window.edrAuth||{key:"",role:"viewer",actor:""};
const css=document.createElement("style"); css.textContent=`.lv-cur{position:relative;width:14px;height:14px} .lv-cur i{position:absolute;left:0;top:0;width:12px;height:12px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--water);border:2px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.5)} .lv-cur b{position:absolute;left:14px;top:-2px;background:var(--water);color:#fff;font:700 10.5px var(--ui);padding:2px 7px;border-radius:999px;white-space:nowrap;box-shadow:0 1px 6px rgba(0,0,0,.4)} #appnav .pres i.live{background:var(--water);box-shadow:0 0 0 3px rgba(91,143,185,.3)}`; document.head.appendChild(css);
const cursors=new Map(), ghosts=new Map(); const layer=L.layerGroup().addTo(map); let ws=null, open=false, lastSent=0, retry=2000;
function color(name){ let h=0; for(const c of name) h=(h*31+c.charCodeAt(0))%360; return `hsl(${h} 45% 52%)`; }
function connect(){ const a=auth(); if(!a.actor||ws) return; try{ ws=new WebSocket(`${WS}?actor=${encodeURIComponent(a.actor)}&role=${a.role}`); }catch(e){ ws=null; return; }
  ws.onopen=()=>{ open=true; retry=2000; mark(true); }; ws.onclose=()=>{ open=false; ws=null; mark(false); layer.clearLayers(); cursors.clear(); ghosts.clear(); setTimeout(connect,retry); retry=Math.min(30000,retry*2); }; ws.onerror=()=>{ try{ ws.close(); }catch(e){} };
  ws.onmessage=e=>{ let m; try{ m=JSON.parse(e.data); }catch(err){ return; } if(m.type==="hello"){ count(m.n-1); } else if(m.type==="join"||m.type==="leave"){ count(m.n-1); if(m.type==="leave"){ drop(m.actor); } if(window.toast&&m.actor) toast(`${m.actor} ${m.type==="join"?(EN?"joined the map":"entrou no mapa"):(EN?"left":"saiu")}`); }
    else if(m.type==="cursor") cursor(m); else if(m.type==="draw") ghost(m); else if(m.type==="drawend") { const g=ghosts.get(m.actor); if(g){ layer.removeLayer(g); ghosts.delete(m.actor); } } }; }
function mark(on){ const el=document.querySelector("#appnav .pres i"); if(el) el.classList.toggle("live",on); }
function count(n){ const el=document.querySelector("#appnav .pres"); if(el){ el.hidden=!(n>0); el.querySelector(".n").textContent=Math.max(0,n); } }
function drop(actor){ const c=cursors.get(actor); if(c){ layer.removeLayer(c); cursors.delete(actor); } const g=ghosts.get(actor); if(g){ layer.removeLayer(g); ghosts.delete(actor); } }
function cursor(m){ if(m.lat==null) return; let c=cursors.get(m.actor); const ll=[m.lat,m.lon]; if(!c){ c=L.marker(ll,{icon:L.divIcon({className:"",html:`<div class="lv-cur"><i style="background:${color(m.actor)}"></i><b style="background:${color(m.actor)}">${m.actor}</b></div>`,iconSize:[14,14],iconAnchor:[2,12]}),interactive:false,zIndexOffset:1200}); layer.addLayer(c); cursors.set(m.actor,c); } else c.setLatLng(ll); c.__at=Date.now(); }
function ghost(m){ if(!m.geometry) return; let g=ghosts.get(m.actor); if(g) layer.removeLayer(g); const col=color(m.actor); g=L.geoJSON({type:"Feature",geometry:m.geometry},{style:{color:col,weight:2.5,dashArray:"6 5",fillColor:col,fillOpacity:.08,interactive:false},pointToLayer:(f,ll)=>L.circleMarker(ll,{radius:7,color:col,fill:false,interactive:false})}); g.bindTooltip(`${m.actor} · ${EN?"drawing":"a desenhar"}`,{permanent:false}); layer.addLayer(g); ghosts.set(m.actor,g); }
setInterval(()=>{ const now=Date.now(); for(const [a,c] of cursors) if(now-(c.__at||0)>45000) drop(a); },10000);
function send(o){ if(open&&ws) try{ ws.send(JSON.stringify(o)); }catch(e){} }
map.on("mousemove",e=>{ const t=Date.now(); if(t-lastSent<150) return; lastSent=t; send({type:"cursor",lat:+e.latlng.lat.toFixed(6),lon:+e.latlng.lng.toFixed(6)}); });
map.getContainer().addEventListener("touchmove",e=>{ const t=e.touches&&e.touches[0]; if(!t) return; const now=Date.now(); if(now-lastSent<250) return; lastSent=now; const ll=map.mouseEventToLatLng(t); send({type:"cursor",lat:+ll.lat.toFixed(6),lon:+ll.lng.toFixed(6)}); },{passive:true});
let lastDraw=0; window.edrLive={ draw(geometry){ const t=Date.now(); if(t-lastDraw<300) return; lastDraw=t; send({type:"draw",geometry}); }, drawend(){ send({type:"drawend"}); }, connected:()=>open };
setTimeout(connect,3000); setInterval(()=>{ if(!ws) connect(); else send({type:"ping"}); },25000);
})();
