// EdenRise Edit mode — add / modify / retire anything on the map: points, lines, areas, rectangles, circles;
// live measurements (length, width, area, orientation, elevation + slope from the LiDAR terrain), typed presets,
// review workflow (proposto → aprovado), versions + changesets, offline queue. Gated by the team keys.
(function(){
const API="https://edenrise-brain.edenrise.workers.dev";
const L_=(typeof LANG!=="undefined")?LANG:"pt"; const EN=L_==="en";
const T=EN?{edit:"EDIT",editing:"Editing",exit:"Exit edit mode",point:"Point",line:"Line",area:"Area",rect:"Rectangle",circle:"Circle",select:"Select / edit",move:"Move",rotate:"Rotate",undo:"Undo",save:"Save",cancel:"Cancel",del:"Retire",type:"Type",name:"Name",status:"Status",note:"Note",photo:"Photo link",measures:"Measurements",len:"Length",wid:"Width",lon:"Long side",area_:"Area",per:"Perimeter",az:"Orientation",radius:"Radius",diam:"Diameter",elev:"Elevation",slope:"Slope",aspect:"Aspect",drop:"Drop",dims:"Set dimensions",apply:"Apply",saved:"Saved",queued:"Saved on this device — will send when online",need:"Sign in with a team key to edit.",pick:"Tap an existing item to edit it, or draw a new one",existing:"Existing item",editgeom:"Edit shape",editattr:"Edit details",retire:"Retire from map",why:"Reason",csq:"What is this round of edits about? (optional)",approve:"Approve",reject:"Reject",hist:"History",by:"by",v:"v",pending:"pending",prop:"proposed",appr:"approved",rej:"rejected",rep:"reported",res:"resolved",modified:"modified",retired:"retired",drawHint:"Draw on the map · tap first point again to finish",sel:"Tap a drawn item to edit it",snap:"Snapping on",noelev:"no terrain here",deg:"°",rot:"Rotation",shape:"Exact shape",shapes:"Exact shapes",sq:"Square",ellipse:"Ellipse",ngon:"Regular polygon",sides:"Sides",side:"Side",a:"Length (a)",b:"Width (b)",unit:"Unit",grid:"Grid",off:"off",snapc:"Snap centre to the grid",place:"Place on the map (tap where it goes)",gps:"At my position (GPS)",dragA:"Drag an area on the map",dragH:"Press and drag on the map to define the area",gpsH:"Locating…",gpsE:"GPS unavailable — allow location or place by tapping",acc:"accuracy",p1:"Point 1 — tap the first corner / start point",p1c:"Tap the centre",p2:"Point 2 — move to orient, tap to confirm",gridBtn:"Grid"}
:{edit:"EDITAR",editing:"A editar",exit:"Sair do modo edição",point:"Ponto",line:"Linha",area:"Área",rect:"Retângulo",circle:"Círculo",select:"Selecionar / editar",move:"Mover",rotate:"Rodar",undo:"Anular",save:"Guardar",cancel:"Cancelar",del:"Retirar",type:"Tipo",name:"Nome",status:"Estado",note:"Nota",photo:"Ligação de foto",measures:"Medidas",len:"Comprimento",wid:"Largura",lon:"Lado maior",area_:"Área",per:"Perímetro",az:"Orientação",radius:"Raio",diam:"Diâmetro",elev:"Cota",slope:"Declive",aspect:"Exposição",drop:"Desnível",dims:"Definir dimensões",apply:"Aplicar",saved:"Guardado",queued:"Guardado neste aparelho — envia quando houver rede",need:"Entre com a chave da equipa para editar.",pick:"Toque num item existente para o editar, ou desenhe um novo",existing:"Item existente",editgeom:"Editar forma",editattr:"Editar dados",retire:"Retirar do mapa",why:"Motivo",csq:"Sobre o que é esta ronda de edições? (opcional)",approve:"Aprovar",reject:"Rejeitar",hist:"Histórico",by:"por",v:"v",pending:"pendentes",prop:"proposto",appr:"aprovado",rej:"rejeitado",rep:"reportado",res:"resolvido",modified:"modificado",retired:"retirado",drawHint:"Desenhe no mapa · toque no primeiro ponto para terminar",sel:"Toque num item desenhado para o editar",snap:"Encaixe ligado",noelev:"sem terreno aqui",deg:"°",rot:"Rotação",shape:"Forma exata",shapes:"Formas exatas",sq:"Quadrado",ellipse:"Elipse",ngon:"Polígono regular",sides:"Lados",side:"Lado",a:"Comprimento (a)",b:"Largura (b)",unit:"Unidade",grid:"Grelha",off:"desligada",snapc:"Encaixar o centro na grelha",place:"Colocar no mapa (toque onde fica)",gps:"Na minha posição (GPS)",dragA:"Arrastar uma área no mapa",dragH:"Pressione e arraste no mapa para definir a área",gpsH:"A localizar…",gpsE:"GPS indisponível — permita a localização ou coloque por toque",acc:"precisão",p1:"Ponto 1 — toque no primeiro canto / início",p1c:"Toque no centro",p2:"Ponto 2 — mova para orientar, toque para confirmar",gridBtn:"Grelha"};
const PRESETS=[
 {id:"edificio",pt:"Edifício",en:"Building",geom:["polygon","rect"],color:"#c9a227",fields:["altura_m","pisos","uso"]},
 {id:"tanque",pt:"Tanque de água",en:"Water tank",geom:["circle","rect","point"],color:"#5b8fb9",fields:["capacidade_m3","altura_m"]},
 {id:"furo",pt:"Furo / poço",en:"Borehole / well",geom:["point"],color:"#5b8fb9",fields:["profundidade_m","caudal_m3h"]},
 {id:"fossa",pt:"Fossa",en:"Septic tank",geom:["point","rect"],color:"#8a6d4b",fields:["capacidade_m3"]},
 {id:"conduta",pt:"Conduta de água",en:"Water pipe",geom:["line"],color:"#5b8fb9",fields:["diametro_mm","material","enterrada"]},
 {id:"eletrica",pt:"Linha elétrica",en:"Power line",geom:["line"],color:"#d9534f",fields:["tensao","enterrada"]},
 {id:"vedacao",pt:"Vedação",en:"Fence",geom:["line"],color:"#b58b5a",fields:["altura_m","tipo"]},
 {id:"caminho",pt:"Caminho",en:"Track",geom:["line"],color:"#e0d3b8",fields:["largura_m","piso"]},
 {id:"arvore",pt:"Árvore",en:"Tree",geom:["point"],color:"#7f9a6a",fields:["especie","altura_m","dap_cm"]},
 {id:"pasto",pt:"Parque de pasto",en:"Grazing park",geom:["polygon","rect"],color:"#9fb789",fields:["animais","capacidade"]},
 {id:"faixa",pt:"Faixa de combustível",en:"Fuel strip",geom:["polygon","line"],color:"#e07b39",fields:["largura_m","estado"]},
 {id:"zona",pt:"Zona / área",en:"Zone / area",geom:["polygon","rect","circle"],color:"#c9a227",fields:["uso"]},
 {id:"atencao",pt:"Ponto de atenção",en:"Point of attention",geom:["point"],color:"#d9534f",fields:["urgencia"]},
 {id:"outro",pt:"Outro",en:"Other",geom:["point","line","polygon","rect","circle"],color:"#e8e0d0",fields:[]}];
const FL={altura_m:["Altura (m)","Height (m)"],pisos:["Pisos","Floors"],uso:["Uso","Use"],capacidade_m3:["Capacidade (m³)","Capacity (m³)"],profundidade_m:["Profundidade (m)","Depth (m)"],caudal_m3h:["Caudal (m³/h)","Flow (m³/h)"],diametro_mm:["Diâmetro (mm)","Diameter (mm)"],material:["Material","Material"],enterrada:["Enterrada (sim/não)","Buried (yes/no)"],tensao:["Tensão","Voltage"],tipo:["Tipo","Type"],largura_m:["Largura (m)","Width (m)"],piso:["Piso","Surface"],especie:["Espécie","Species"],dap_cm:["DAP (cm)","DBH (cm)"],animais:["Animais","Animals"],capacidade:["Capacidade","Capacity"],estado:["Estado","Condition"],urgencia:["Urgência (baixa/média/alta)","Urgency (low/medium/high)"]};
const STATUS_COL={proposto:"#c9a227",aprovado:"#7f9a6a",rejeitado:"#6b6157",reportado:"#e07b39",resolvido:"#7f9a6a"};
const auth=()=>window.edrAuth||{key:"",role:"viewer",actor:""};
const hdr=()=>({"Content-Type":"application/json",...(auth().key?{"X-Role-Key":auth().key}:{})});
const fmt=(n,d=1)=>Number(n).toLocaleString(EN?"en-GB":"pt-PT",{maximumFractionDigits:d});
const CARD=(EN?["N","NE","E","SE","S","SW","W","NW"]:["N","NE","E","SE","S","SO","O","NO"]);
/* ---------- geometry maths (local metres around a centre) ---------- */
function proj(c){ const kx=111320*Math.cos(c.lat*Math.PI/180), ky=110540; return {to:ll=>[(ll.lng-c.lng)*kx,(ll.lat-c.lat)*ky], from:(x,y)=>L.latLng(c.lat+y/ky,c.lng+x/kx)}; }
const flat=a=>Array.isArray(a)&&a.length&&Array.isArray(a[0])?flat(a[0]):a;      // first ring / first line
function centre(pts){ const b=L.latLngBounds(pts); return b.getCenter(); }
function az(p,q){ return (Math.atan2(q[0]-p[0],q[1]-p[1])*180/Math.PI+360)%360; }
function measure(layer){
  if(layer instanceof L.Circle){ const r=layer.getRadius(); return {kind:"circle",raio_m:+r.toFixed(2),diametro_m:+(2*r).toFixed(2),area_m2:+(Math.PI*r*r).toFixed(1),centre:layer.getLatLng()}; }
  if(layer instanceof L.Marker||layer instanceof L.CircleMarker) return {kind:"point",centre:layer.getLatLng()};
  const pts=flat(layer.getLatLngs()); if(!pts||pts.length<2) return {kind:"point",centre:pts&&pts[0]};
  const c=centre(pts), P=proj(c), xy=pts.map(P.to);
  if(layer instanceof L.Polygon){
    let A=0,per=0,best=0,bAz=0; for(let i=0;i<xy.length;i++){ const p=xy[i],q=xy[(i+1)%xy.length]; A+=p[0]*q[1]-q[0]*p[1]; const d=Math.hypot(q[0]-p[0],q[1]-p[1]); per+=d; if(d>best){best=d;bAz=az(p,q)%180;} }
    A=Math.abs(A)/2; const t=bAz*Math.PI/180, rx=xy.map(([x,y])=>[x*Math.cos(t)-y*Math.sin(t), x*Math.sin(t)+y*Math.cos(t)]);
    const xs=rx.map(p=>p[0]),ys=rx.map(p=>p[1]); const along=Math.max(...ys)-Math.min(...ys), across=Math.max(...xs)-Math.min(...xs);
    return {kind:"polygon",area_m2:+A.toFixed(1),area_ha:+(A/1e4).toFixed(3),perimetro_m:+per.toFixed(1),comprimento_m:+Math.max(along,across).toFixed(2),largura_m:+Math.min(along,across).toFixed(2),orientacao_deg:+bAz.toFixed(0),n:xy.length,centre:c};
  }
  let len=0; for(let i=1;i<xy.length;i++) len+=Math.hypot(xy[i][0]-xy[i-1][0],xy[i][1]-xy[i-1][1]);
  return {kind:"line",comprimento_m:+len.toFixed(1),orientacao_deg:+az(xy[0],xy[xy.length-1]).toFixed(0),n:xy.length,centre:c,pts};
}
function setRect(layer,len,wid,rot){ const m=measure(layer), P=proj(m.centre); const t=rot*Math.PI/180, u=[Math.sin(t),Math.cos(t)], v=[Math.cos(t),-Math.sin(t)];
  const cs=[[1,1],[1,-1],[-1,-1],[-1,1]].map(([a,b])=>P.from(a*u[0]*len/2+b*v[0]*wid/2, a*u[1]*len/2+b*v[1]*wid/2)); layer.setLatLngs([cs]); }
/* ---------- elevation + slope from the local LiDAR terrain tiles (mapbox encoding, z16) ---------- */
const tcache={};
function elev(ll){ const z=16,n=2**z; const xf=(ll.lng+180)/360*n, lr=ll.lat*Math.PI/180, yf=(1-Math.log(Math.tan(lr)+1/Math.cos(lr))/Math.PI)/2*n; const x=Math.floor(xf),y=Math.floor(yf),k=x+"/"+y;
  tcache[k]=tcache[k]||new Promise(res=>{ const im=new Image(); im.onload=()=>{ const c=document.createElement("canvas"); c.width=c.height=256; const g=c.getContext("2d"); g.drawImage(im,0,0); res(g.getImageData(0,0,256,256).data); }; im.onerror=()=>res(null); im.src=`terrain/${z}/${x}/${y}.png`; });
  return tcache[k].then(d=>{ if(!d) return null; const px=Math.min(255,Math.floor((xf-x)*256)),py=Math.min(255,Math.floor((yf-y)*256)),i=(py*256+px)*4; return -10000+(d[i]*65536+d[i+1]*256+d[i+2])*0.1; }); }
async function terrain(m){
  const out={}; const P=proj(m.centre); const at=(dx,dy)=>elev(P.from(dx,dy));
  if(m.kind==="line"&&m.pts){ const xy=m.pts.map(P.to); const samples=[]; for(let i=1;i<xy.length;i++){ const [x0,y0]=xy[i-1],[x1,y1]=xy[i]; const d=Math.hypot(x1-x0,y1-y0), n=Math.max(1,Math.round(d/10)); for(let s=(i===1?0:1);s<=n;s++) samples.push([x0+(x1-x0)*s/n, y0+(y1-y0)*s/n]); }
    const hs=await Promise.all(samples.map(([x,y])=>at(x,y))); if(hs.some(h=>h==null)) return out; let maxs=0,sum=0,cnt=0; for(let i=1;i<samples.length;i++){ const d=Math.hypot(samples[i][0]-samples[i-1][0],samples[i][1]-samples[i-1][1]); if(d<0.5) continue; const s=Math.abs(hs[i]-hs[i-1])/d*100; maxs=Math.max(maxs,s); sum+=s; cnt++; }
    out.cota_inicio_m=+hs[0].toFixed(1); out.cota_fim_m=+hs[hs.length-1].toFixed(1); out.desnivel_m=+(hs[hs.length-1]-hs[0]).toFixed(1); out.declive_medio_pct=+(cnt?sum/cnt:0).toFixed(1); out.declive_max_pct=+maxs.toFixed(1); return out; }
  const R=15; const dirs=[[0,R],[R*.707,R*.707],[R,0],[R*.707,-R*.707],[0,-R],[-R*.707,-R*.707],[-R,0],[-R*.707,R*.707]];
  const [h0,...hs]=await Promise.all([at(0,0),...dirs.map(([x,y])=>at(x,y))]); if(h0==null||hs.some(h=>h==null)) return out;
  let steep=0,dir=0; hs.forEach((h,i)=>{ const s=(h0-h)/R*100; if(s>steep){steep=s;dir=i;} });
  out.cota_m=+h0.toFixed(1); out.declive_pct=+steep.toFixed(1); out.exposicao=steep>1?CARD[dir]:"—"; return out;
}
/* ---------- UI ---------- */
const css=document.createElement("style"); css.textContent=`
#editbtn{position:absolute;right:14px;bottom:76px;z-index:1400;display:flex;align-items:center;gap:8px;background:var(--night-2);color:var(--linen);border:1px solid var(--line-2);border-radius:999px;padding:10px 15px;font:700 12.5px var(--display);letter-spacing:.06em;cursor:pointer;box-shadow:var(--sh)} #editbtn.on{background:var(--straw);color:var(--bark);border-color:var(--straw)} #editbtn svg{width:14px;height:14px}
#etools{position:absolute;left:50%;transform:translateX(-50%);top:58px;z-index:1450;display:flex;gap:4px;background:rgba(28,24,19,.94);backdrop-filter:blur(10px);border:1px solid var(--line-2);border-radius:14px;padding:6px;box-shadow:var(--sh)} #etools[hidden]{display:none}
#etools button{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:56px;padding:7px 6px;border:0;border-radius:10px;background:transparent;color:var(--linen-2);font:500 10px var(--ui);cursor:pointer} #etools button svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round} #etools button:hover{background:var(--night-2);color:var(--linen)} #etools button.on{background:var(--straw);color:var(--bark)} #etools .sep{width:1px;background:var(--line-2);margin:4px 2px} #etools button.x{color:var(--ember)}
#ehint{position:absolute;left:50%;transform:translateX(-50%);top:150px;z-index:1440;background:var(--straw);color:var(--bark);font:600 12px var(--ui);padding:6px 12px;border-radius:999px;box-shadow:var(--sh)} #ehint[hidden]{display:none}
#eform{position:absolute;right:14px;top:58px;bottom:26px;width:min(380px,calc(100vw - 28px));z-index:1470;background:rgba(28,24,19,.97);backdrop-filter:blur(12px);border:1px solid var(--line-2);border-radius:14px;box-shadow:var(--sh);display:flex;flex-direction:column;overflow:hidden} #eform[hidden]{display:none}
#eform .hd{padding:12px 14px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:10px} #eform .hd h3{margin:0;font:600 15px var(--display);flex:1} #eform .hd .st{font:600 10px var(--mono);letter-spacing:.08em;text-transform:uppercase;padding:2px 8px;border-radius:999px;color:var(--bark)}
#eform .bd{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:10px} #eform label{display:flex;flex-direction:column;gap:4px;font:500 11px var(--ui);color:var(--muted);letter-spacing:.02em} #eform input,#eform select,#eform textarea{padding:9px 10px;background:var(--bark);color:var(--linen);border:1px solid var(--line-2);border-radius:9px;font:13.5px var(--ui)} #eform textarea{min-height:56px;resize:vertical}
#eform .presets{display:grid;grid-template-columns:repeat(3,1fr);gap:5px} #eform .presets button{padding:8px 6px;border-radius:9px;border:1px solid var(--line-2);background:transparent;color:var(--linen-2);font:500 11px var(--ui);cursor:pointer;display:flex;align-items:center;gap:6px} #eform .presets button i{width:9px;height:9px;border-radius:50%;flex:none} #eform .presets button.on{border-color:var(--straw);color:var(--linen);background:var(--night-2)}
#eform .meas{background:var(--bark);border:1px solid var(--line);border-radius:10px;padding:8px 10px;display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font:12px var(--ui)} #eform .meas div{display:flex;justify-content:space-between;gap:8px} #eform .meas span{color:var(--muted)} #eform .meas b{font:600 12px var(--mono);color:var(--linen)} #eform .meas .t{grid-column:1/-1;font:600 10px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--straw);margin-top:2px}
#eform .dims{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:5px;align-items:end} #eform .dims input{width:100%;box-sizing:border-box} #eform .dims button{padding:9px 10px;border-radius:9px;border:1px solid var(--line-2);background:var(--night-2);color:var(--linen);font:600 12px var(--ui);cursor:pointer}
#eform .grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#eform .ft{padding:10px 14px;border-top:1px solid var(--line);display:flex;gap:6px} #eform .ft button{flex:1;padding:11px;border-radius:10px;border:0;font:700 13px var(--ui);cursor:pointer;background:var(--night-2);color:var(--linen)} #eform .ft button.ok{background:var(--oak);color:var(--bark)} #eform .ft button.x{background:transparent;color:var(--ember);flex:0 0 auto;padding:11px 12px}
#eform .rows{display:flex;flex-direction:column;gap:4px} #eform .rows button{text-align:left;padding:10px 12px;border-radius:9px;border:1px solid var(--line-2);background:transparent;color:var(--linen);font:500 13px var(--ui);cursor:pointer} #eform .rows button:hover{border-color:var(--straw)} #eform .hist{font:11.5px var(--ui);color:var(--linen-2);display:flex;flex-direction:column;gap:4px} #eform .hist div{padding:6px 8px;background:var(--bark);border-radius:7px}
.ed-pin{width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center} .ed-pin i{transform:rotate(45deg);font:700 11px var(--mono);color:#111;font-style:normal}
.leaflet-container.ed-draw{cursor:crosshair!important}
.dim{background:rgba(201,162,39,.95);color:#1c1813;font:600 11px var(--mono);padding:2px 6px;border-radius:4px;white-space:nowrap;pointer-events:none;transform:translate(-50%,-50%);box-shadow:0 1px 4px rgba(0,0,0,.45);letter-spacing:.02em} .dim.live{background:rgba(241,233,216,.96)} .dim.area{background:rgba(28,24,19,.9);color:var(--straw);border:1px solid var(--straw);font-size:11.5px}
@media(max-width:700px){ #eform{left:8px;right:8px;top:auto;bottom:8px;width:auto;max-height:68vh} #etools{top:auto;bottom:88px;flex-wrap:wrap;justify-content:center;max-width:calc(100vw - 20px)} #ehint{top:auto;bottom:160px} #editbtn{bottom:64px;right:10px} }
@media(pointer:coarse){ #etools button{min-width:60px;padding:9px 6px} #eform input,#eform select{font-size:16px} }`;
document.head.appendChild(css);
const I={point:'<svg viewBox="0 0 24 24"><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/></svg>',line:'<svg viewBox="0 0 24 24"><path d="M4 19 10 8l4 6 6-11"/><circle cx="4" cy="19" r="1.5"/><circle cx="20" cy="3" r="1.5"/></svg>',area:'<svg viewBox="0 0 24 24"><path d="M5 5l9-2 5 8-3 9-11-3z"/></svg>',rect:'<svg viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="1"/></svg>',circle:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>',select:'<svg viewBox="0 0 24 24"><path d="M5 3l14 8-6 2-3 6z"/></svg>',move:'<svg viewBox="0 0 24 24"><path d="M12 2v20M2 12h20M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4M18 8l4 4-4 4"/></svg>',rotate:'<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/></svg>',shape:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="1"/><circle cx="17" cy="7" r="4"/><path d="M3 21l4-8 4 8zM13 14h8v7h-8z"/></svg>',grid:'<svg viewBox="0 0 24 24"><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>',undo:'<svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5M4 9h9a6 6 0 0 1 0 12h-3"/></svg>',x:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>'};
const mapEl=document.getElementById("map");
const btn=document.createElement("button"); btn.id="editbtn"; btn.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>${T.edit}`; mapEl.appendChild(btn);
const tools=document.createElement("div"); tools.id="etools"; tools.hidden=true;
const TOOLS=[["point",T.point],["line",T.line],["area",T.area],["rect",T.rect],["circle",T.circle],["shape",T.shape],["grid",T.gridBtn],null,["select",T.select],["move",T.move],["rotate",T.rotate],["undo",T.undo],null,["x",T.exit]];
tools.innerHTML=TOOLS.map(t=>t?`<button data-t="${t[0]}" class="${t[0]==="x"?"x":""}" title="${t[1]}">${I[t[0]]}<span>${t[1]}</span></button>`:`<span class="sep"></span>`).join(""); mapEl.appendChild(tools);
const hint=document.createElement("div"); hint.id="ehint"; hint.hidden=true; mapEl.appendChild(hint);
const form=document.createElement("div"); form.id="eform"; form.hidden=true; mapEl.appendChild(form);
const showHint=t=>{ hint.textContent=t; hint.hidden=!t; };
[form,tools,btn,hint].forEach(el=>{ L.DomEvent.disableClickPropagation(el); L.DomEvent.disableScrollPropagation(el); });
/* ---------- state ---------- */
const E={on:false,tool:null,cur:null,undo:[],changeset:null,csAsked:false};
const drawn=L.featureGroup().addTo(map);             // features from the brain (all statuses)
const work=L.featureGroup().addTo(map);              // the item being drawn/edited
const dim={};                                        // core layers dimmed by overrides
/* ---------- offline queue ---------- */
const Q="edr_edit_queue"; const qget=()=>{ try{ return JSON.parse(localStorage.getItem(Q)||"[]"); }catch(e){ return []; } }; const qset=a=>{ try{ localStorage.setItem(Q,JSON.stringify(a)); }catch(e){} };
async function send(method,path,body){ try{ const r=await fetch(API+path,{method,headers:hdr(),body:body?JSON.stringify(body):undefined}); if(r.status>=500||r.status===503){ qset([...qget(),{method,path,body}]); return {queued:true}; } return await r.json(); }catch(e){ qset([...qget(),{method,path,body}]); return {queued:true}; } }
async function flush(){ const q=qget(); if(!q.length||!auth().key) return; const left=[]; for(const it of q){ try{ const r=await fetch(API+it.path,{method:it.method,headers:hdr(),body:JSON.stringify(it.body)}); if(r.status>=500) left.push(it); }catch(e){ left.push(it); } } qset(left); if(left.length<q.length){ toast&&toast(`${q.length-left.length} ${EN?"queued edits sent":"edições enviadas"}`); loadFeatures(); } }
window.addEventListener("online",flush); setTimeout(flush,4000);
/* ---------- features from the brain ---------- */
function pin(color,txt){ return L.divIcon({className:"",html:`<div class="ed-pin" style="background:${color}"><i>${txt||""}</i></div>`,iconSize:[26,26],iconAnchor:[13,26]}); }
function styleFor(p){ const c=STATUS_COL[p.status]||"#c9a227"; const pr=PRESETS.find(x=>x.id===p.preset); return {color:pr?pr.color:c, weight:p.op==="modify"?3:2.5, dashArray:p.status==="proposto"?"6 5":null, fillColor:pr?pr.color:c, fillOpacity:.18, opacity:.95}; }
function render(f){ const p=f.properties, g=f.geometry; let l;
  if(g.type==="Point"){ const ll=L.latLng(g.coordinates[1],g.coordinates[0]); l=(p.measures&&p.measures.kind==="circle")? L.circle(ll,{radius:p.measures.raio_m,...styleFor(p)}) : L.marker(ll,{icon:pin(styleFor(p).color, p.layer==="ocorrencias"?"!":(p.op==="modify"?"✎":p.op==="retire"?"×":"+"))}); }
  else if(g.type==="LineString") l=L.polyline(g.coordinates.map(c=>[c[1],c[0]]),styleFor(p));
  else if(g.type==="Polygon") l=L.polygon(g.coordinates.map(r=>r.map(c=>[c[1],c[0]])),styleFor(p));
  else return; l.feature=f; l.__ed=true; l.on("click",e=>{ L.DomEvent.stop(e); openInfo(l); }); if(p.name) l.bindTooltip(`${p.name} · ${T[({proposto:"prop",aprovado:"appr",rejeitado:"rej",reportado:"rep",resolvido:"res"})[p.status]]||p.status}`); drawn.addLayer(l); }
async function loadFeatures(){ try{ const d=await fetch(API+"/features").then(r=>r.json()); drawn.clearLayers(); (d.features||[]).forEach(render); applyOverrides(d.features||[]); }catch(e){} }
window.renderFeatures=loadFeatures;
function coreRef(t,f){ const p=f.properties||{}; const idx=(DATA[t]&&DATA[t].features)?DATA[t].features.indexOf(f):-1; return `${t}:${p.asset_id||p.name||idx}`; }
function applyOverrides(feats){ for(const l of Object.values(dim)){ try{ l.setStyle&&l.setStyle(l.__orig); l.setOpacity&&l.setOpacity(1); }catch(e){} } for(const k in dim) delete dim[k];
  const refs=new Map(feats.filter(f=>f.properties.ref_id&&f.properties.status!=="rejeitado").map(f=>[f.properties.ref_id,f.properties.op]));
  if(!refs.size||typeof layerObjs==="undefined") return;
  for(const [t,o] of Object.entries(layerObjs)){ const geo=o.geo; if(!geo||!geo.eachLayer) continue; geo.eachLayer(l=>{ if(!l.feature) return; const r=coreRef(t,l.feature); const op=refs.get(r); if(!op) return; dim[r]=l; l.__orig=l.options; try{ if(l.setStyle) l.setStyle({opacity:.35,fillOpacity:.05,dashArray:"3 6"}); else if(l.setOpacity) l.setOpacity(.35); }catch(e){} }); } }
/* ---------- enter / exit ---------- */
function ensureGeoman(){ if(!map.pm && window.L && L.PM && L.PM.Map){ try{ map.pm=new L.PM.Map(map); }catch(e){} } if(map.pm) return true; showHint(EN?"Edit tools failed to load — check the connection.":"As ferramentas de edição não carregaram — verifique a ligação."); return false; }
async function toggle(){ if(E.on) return exit(); const a=auth(); if(a.role==="viewer"){ if(a.signIn) await a.signIn(); if(auth().role==="viewer"){ toast&&toast(T.need); return; } }
  if(!ensureGeoman()) return; E.on=true; btn.classList.add("on"); btn.hidden=false; tools.hidden=false; refreshBtn(); showHint(T.pick);
  map.pm.setGlobalOptions({snappable:true,snapDistance:14,allowSelfIntersection:false,pathOptions:{color:"#c9a227",weight:3,fillColor:"#c9a227",fillOpacity:.15},templineStyle:{color:"#c9a227"},hintlineStyle:{color:"#c9a227",dashArray:"5 5"},markerStyle:{icon:pin("#c9a227","+")}});
  hookCore(true); if(!E.changeset){ E.changeset="CS-"+Date.now().toString(36).toUpperCase(); } setGrid(gridSp||1); }
function exit(){ if(typeof endPlace==="function") endPlace(); if(map.hasLayer(grid)) map.removeLayer(grid); gridOn=false; dims.clearLayers(); setTool(null); E.on=false; btn.classList.remove("on"); tools.hidden=true; refreshBtn(); showHint(null); closeForm(); hookCore(false); }
btn.onclick=toggle;
function refreshBtn(){ const a=auth(); const roleTxt=a.role==="leader"?(EN?"LEADERSHIP":"LIDERANÇA"):a.role==="field"?(EN?"FIELD":"TERRENO"):""; btn.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>${E.on?T.editing:T.edit}${roleTxt&&!E.on?` <span style="opacity:.7;font-weight:500">· ${roleTxt}</span>`:""}`; const nb=document.getElementById("nav-edit"); if(nb){ nb.classList.toggle("on",E.on); nb.title=roleTxt||(EN?"Sign in with a team key":"Entre com a chave da equipa"); } }
setInterval(refreshBtn,1500);
// keep the floating button clear of the Brain chat panel
new MutationObserver(()=>{ const b=document.getElementById("brain"); btn.hidden=!!(b&&!b.hidden)&&!E.on; }).observe(document.getElementById("map"),{attributes:true,subtree:true,attributeFilter:["hidden"]});
/* intercept clicks on core items while editing */
const origShow=window.showCard; let pickBlock=false;
window.showCard=function(p,ll,t){ if(E.on) return; return origShow&&origShow(p,ll,t); };
function onCore(e){ if(!E.on||E.tool||placeMode) return; if(E.cur&&!form.hidden) return; openExisting(e.target); }
function hookCore(on){ if(typeof layerObjs==="undefined") return; for(const [t,o] of Object.entries(layerObjs)){ const geo=o.geo; if(!geo||!geo.eachLayer) continue; geo.eachLayer(l=>{ l.__t=t; l.off("click",onCore); if(on) l.on("click",onCore); }); } }
map.on("layeradd",e=>{ if(E.on&&e.layer&&e.layer.feature&&!e.layer.__ed&&e.layer.__t===undefined){ for(const [t,o] of Object.entries(layerObjs||{})) if(o.geo&&o.geo.hasLayer&&o.geo.hasLayer(e.layer)){ e.layer.__t=t; e.layer.on("click",onCore); } } });
/* ---------- tools ---------- */
const SHAPE={point:"Marker",line:"Line",area:"Polygon",rect:"Rectangle",circle:"Circle"};
function setTool(t){ if(!map.pm) return; map.pm.disableDraw(); map.dragging.enable(); if(E.cur&&E.cur.pm){ E.cur.pm.disable(); E.cur.pm.disableLayerDrag&&E.cur.pm.disableLayerDrag(); E.cur.pm.disableRotate&&E.cur.pm.disableRotate(); }
  E.tool=t; tools.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.t===t)); mapEl.classList.toggle("ed-draw",!!(t&&SHAPE[t]));
  if(t&&SHAPE[t]){ map.dragging.disable(); map.pm.enableDraw(SHAPE[t],{finishOn:"dblclick",continueDrawing:false}); showHint(t==="point"?(EN?"Tap where it goes":"Toque onde fica"):T.drawHint); }
  else if(t==="select"){ showHint(T.sel); if(E.cur){ E.cur.pm.enable({allowSelfIntersection:false}); } }
  else if(t==="move"&&E.cur){ E.cur.pm.enableLayerDrag(); showHint(EN?"Drag the item":"Arraste o item"); }
  else if(t==="rotate"&&E.cur&&E.cur.pm.enableRotate){ E.cur.pm.enableRotate(); showHint(EN?"Drag to rotate":"Arraste para rodar"); }
  else showHint(E.cur?T.sel:T.pick); }
tools.addEventListener("click",e=>{ const b=e.target.closest("button"); if(!b) return; const t=b.dataset.t; if(t==="x") return exit(); if(t==="undo") return undo(); if(t==="shape") return openShapes(); if(t==="grid") return setGrid(gridOn?0:gridSp||1); setTool(E.tool===t&&SHAPE[t]?null:t); });
function snapshot(){ if(!E.cur) return; E.undo.push(E.cur.toGeoJSON().geometry); if(E.undo.length>25) E.undo.shift(); }
function undo(){ if(!E.cur||!E.undo.length) return; const g=E.undo.pop(); if(E.cur instanceof L.Circle||E.cur instanceof L.Marker) E.cur.setLatLng([g.coordinates[1],g.coordinates[0]]); else if(g.type==="LineString") E.cur.setLatLngs(g.coordinates.map(c=>[c[1],c[0]])); else E.cur.setLatLngs(g.coordinates.map(r=>r.map(c=>[c[1],c[0]]))); refreshMeasures(); }
let drawing=null;
map.on("pm:drawstart",e=>{ drawing=e.workingLayer; const d=map.pm.Draw[e.shape]; if(d){ if(d._startMarker) d._startMarker.__snapped=false; if(d._centerMarker) d._centerMarker.__snapped=false; } e.workingLayer.on("pm:vertexadded",ev=>{ if(!gridOn||!SH.snap) return; const sn=snapLL(ev.latlng); const ll=e.workingLayer.getLatLngs(); const arr=flat(ll); if(arr&&arr.length){ arr[arr.length-1]=sn; e.workingLayer.setLatLngs(ll); } if(ev.marker) ev.marker.setLatLng(sn); }); });
map.on("pm:drawend",()=>{ drawing=null; dims.clearLayers(); map.dragging.enable(); });
function cursorMove(ll){ if(!E.on) return;
  if(placeMode==="tap"&&anchor){ onMovePreview({latlng:ll}); return; }
  if(placeMode==="drag"&&dragA){ dragMove({latlng:ll}); return; }
  if(!E.tool||!SHAPE[E.tool]||!map.pm||!map.pm.Draw) return; const d=map.pm.Draw[SHAPE[E.tool]]; const sn=(gridOn&&SH.snap)?snapLL(ll):ll;
  if(d&&d._hintMarker) d._hintMarker.setLatLng(sn);                                   // moves Geoman
  if(gridOn&&SH.snap&&d){ const sm=d._startMarker||d._centerMarker; if(sm&&!sm.__snapped){ sm.setLatLng(snapLL(sm.getLatLng())); sm.__snapped=true; } }   // first corner / centre on the grid while previewing's hint line / rectangle / circle with the finger or mouse
  if(!drawing){ if(E.tool==="point") { dims.clearLayers(); dimLabel(sn, `${sn.lat.toFixed(5)}, ${sn.lng.toFixed(5)}`, "live"); } return; }
  if(drawing instanceof L.Circle){ dimsFor(drawing); return; } const pts=flat(drawing.getLatLngs())||[]; if(E.tool==="rect"){ if(pts.length>=4) showDims(pts,true); } else showDims(pts, E.tool==="area", sn); }
map.on("mousemove",e=>cursorMove(e.latlng));
map.getContainer().addEventListener("touchmove",e=>{ if(!E.on) return; const t=e.touches&&e.touches[0]; if(!t||e.touches.length>1) return; cursorMove(map.mouseEventToLatLng(t)); },{passive:true});
map.getContainer().addEventListener("touchstart",e=>{ if(!E.on) return; const t=e.touches&&e.touches[0]; if(!t||e.touches.length>1) return; cursorMove(map.mouseEventToLatLng(t)); },{passive:true});
map.on("pm:create",e=>{ map.pm.disableDraw(); let l=e.layer; if(e.shape==="Rectangle"){ const ll=flat(l.getLatLngs()).map(snapLL); map.removeLayer(l); l=L.polygon(ll,{color:"#c9a227",weight:3,fillColor:"#c9a227",fillOpacity:.15}); } else snapLayer(l);
  if(!work.hasLayer(l)) work.addLayer(l); startEdit(l,{preset:null,shape:e.shape.toLowerCase()}); });
function startEdit(l,ctx){ if(E.cur&&E.cur!==l&&work.hasLayer(E.cur)&&!E.cur.__keep) work.removeLayer(E.cur); E.cur=l; E.undo=[]; E.ctx=ctx; E.tool=null; tools.querySelectorAll("button").forEach(b=>b.classList.remove("on")); mapEl.classList.remove("ed-draw");
  ["pm:edit","pm:rotateend","pm:vertexremoved"].forEach(ev=>l.on(ev,refreshMeasures)); ["pm:markerdrag","pm:drag","pm:rotate"].forEach(ev=>l.on(ev,()=>dimsFor(l)));
  l.on("pm:markerdragend",ev=>{ if(gridOn&&SH.snap&&!(l instanceof L.Circle)&&ev.indexPath){ const ll=l.getLatLngs(); const setAt=(arr,path,val)=>{ if(path.length===1) arr[path[0]]=val; else setAt(arr[path[0]],path.slice(1),val); }; const cur=ev.markerEvent&&ev.markerEvent.target?ev.markerEvent.target.getLatLng():null; if(cur){ setAt(ll,ev.indexPath,snapLL(cur)); l.setLatLngs(ll); l.pm.disable(); l.pm.enable({allowSelfIntersection:false}); } } else if(gridOn&&SH.snap&&l instanceof L.Circle){ snapLayer(l); l.pm.disable(); l.pm.enable(); } refreshMeasures(); });
  l.on("pm:dragend",()=>{ if(gridOn&&SH.snap){ if(l instanceof L.Circle||l instanceof L.Marker){ l.setLatLng(snapLL(l.getLatLng())); } else { const pts=flat(l.getLatLngs()); if(pts&&pts.length){ const P=proj(pts[0]); const [dx,dy]=P.to(snapLL(pts[0])); const mv=a=>Array.isArray(a)&&a.length&&Array.isArray(a[0])?a.map(mv):a.map(q=>{ const Q=proj(q); return Q.from(dx,dy); }); l.setLatLngs(mv(l.getLatLngs())); } } if(l.pm.enabled&&l.pm.enabled()){ l.pm.disable(); l.pm.enable({allowSelfIntersection:false}); } } refreshMeasures(); }); ["pm:dragstart","pm:rotatestart","pm:vertexadded","pm:markerdragstart"].forEach(ev=>l.on(ev,snapshot));
  if(l.pm) l.pm.enable({allowSelfIntersection:false}); openForm(); }
/* ---------- form ---------- */
function shapeOf(l){ return l instanceof L.Circle?"circle":(l instanceof L.Marker||l instanceof L.CircleMarker)?"point":l instanceof L.Polygon?"polygon":"line"; }
let M={};
function openForm(){ const l=E.cur, ctx=E.ctx, p=(ctx.props||{}); const shape=shapeOf(l); const allowed=PRESETS.filter(x=>x.geom.includes(shape)||(shape==="polygon"&&x.geom.includes("rect"))); const cur=p.preset||ctx.preset||(ctx.existing?"outro":allowed[0].id);
  const leader=auth().role==="leader"; form.hidden=false; form.innerHTML=`<div class="hd"><h3>${ctx.existing?`${T.existing}: ${ctx.existing.name||""}`:(ctx.id?`${EN?"Edit":"Editar"} ${ctx.id}`:(EN?"New item":"Novo item"))}</h3><span class="st" style="background:${STATUS_COL[p.status||"proposto"]}">${T[({proposto:"prop",aprovado:"appr",rejeitado:"rej",reportado:"rep",resolvido:"res"})[p.status||"proposto"]]}</span></div>
  <div class="bd"><label>${T.type}<div class="presets" id="epre">${allowed.map(x=>`<button data-p="${x.id}" class="${x.id===cur?"on":""}"><i style="background:${x.color}"></i>${EN?x.en:x.pt}</button>`).join("")}</div></label>
  <label>${T.name}<input id="ename" value="${(p.name||ctx.existing?.name||"").replace(/"/g,"&quot;")}"></label>
  <div id="efields" class="grid2"></div>
  <div class="meas" id="emeas"></div><div id="edims"></div>
  ${leader?`<label>${T.status}<select id="estatus">${["proposto","aprovado","rejeitado"].map(s=>`<option value="${s}" ${(p.status||"proposto")===s?"selected":""}>${T[({proposto:"prop",aprovado:"appr",rejeitado:"rej"})[s]]}</option>`).join("")}</select></label>`:""}
  <label>${T.note}<textarea id="enote">${p.note||""}</textarea></label><label>${T.photo}<input id="ephoto" value="${p.photo||""}" placeholder="https://…"></label></div>
  <div class="ft"><button class="ok" id="esave">${T.save}</button><button id="ecancel">${T.cancel}</button>${ctx.id?`<button class="x" id="edel" title="${T.del}">${I.x}</button>`:""}</div>`;
  const setPre=id=>{ form.querySelectorAll("#epre button").forEach(b=>b.classList.toggle("on",b.dataset.p===id)); const pr=PRESETS.find(x=>x.id===id); const ef=form.querySelector("#efields"); ef.innerHTML=pr.fields.map(f=>`<label>${FL[f]?FL[f][EN?1:0]:f}<input data-f="${f}" value="${p[f]??""}"></label>`).join(""); if(l.setStyle&&!ctx.existing) l.setStyle({color:pr.color,fillColor:pr.color}); };
  form.querySelectorAll("#epre button").forEach(b=>b.onclick=()=>setPre(b.dataset.p)); setPre(cur);
  form.querySelector("#esave").onclick=save; form.querySelector("#ecancel").onclick=()=>{ cancelEdit(); }; const del=form.querySelector("#edel"); if(del) del.onclick=()=>retire(ctx.id);
  refreshMeasures(); }
function dimsUI(shape,m){ const box=form.querySelector("#edims"); if(!box) return; if(shape==="polygon"&&m.n===4){ box.innerHTML=`<label>${T.dims}<div class="dims"><input id="dl" type="number" step="0.1" value="${m.comprimento_m}" placeholder="${T.len}"><input id="dw" type="number" step="0.1" value="${m.largura_m}" placeholder="${T.wid}"><input id="dr" type="number" step="1" value="${m.orientacao_deg}" placeholder="${T.rot}"><button id="dapply">${T.apply}</button></div></label>`;
    box.querySelector("#dapply").onclick=()=>{ snapshot(); setRect(E.cur,+box.querySelector("#dl").value,+box.querySelector("#dw").value,+box.querySelector("#dr").value); refreshMeasures(); }; }
  else if(shape==="circle"){ box.innerHTML=`<label>${T.dims}<div class="dims" style="grid-template-columns:1fr auto"><input id="dr" type="number" step="0.1" value="${m.raio_m}" placeholder="${T.radius}"><button id="dapply">${T.apply}</button></div></label>`; box.querySelector("#dapply").onclick=()=>{ snapshot(); E.cur.setRadius(+box.querySelector("#dr").value); refreshMeasures(); }; }
  else box.innerHTML=""; }
async function refreshMeasures(){ if(!E.cur||form.hidden) return; dimsFor(E.cur); const m=measure(E.cur); M=m; const el=form.querySelector("#emeas"); if(!el) return; const row=(k,v,u="")=>v==null?"":`<div><span>${k}</span><b>${typeof v==="number"?fmt(v,v>=100?0:v>=10?1:2):v}${u}</b></div>`;
  let h=`<div class="t">${T.measures}</div>`;
  if(m.kind==="line") h+=row(T.len,m.comprimento_m," m")+row(T.az,m.orientacao_deg,"°");
  if(m.kind==="polygon") h+=row(T.area_,m.area_m2<10000?m.area_m2:m.area_ha,m.area_m2<10000?" m²":" ha")+row(T.per,m.perimetro_m," m")+row(T.lon,m.comprimento_m," m")+row(T.wid,m.largura_m," m")+row(T.az,m.orientacao_deg,"°");
  if(m.kind==="circle") h+=row(T.radius,m.raio_m," m")+row(T.diam,m.diametro_m," m")+row(T.area_,m.area_m2," m²");
  h+=row(EN?"Centre":"Centro",`${m.centre.lat.toFixed(6)}, ${m.centre.lng.toFixed(6)}`); el.innerHTML=h; dimsUI(m.kind,m);
  const tr=await terrain(m); if(E.cur&&measure(E.cur).centre.equals(m.centre)||true){ M={...m,...tr}; let g=`<div class="t">${EN?"Terrain (LiDAR 2024)":"Terreno (LiDAR 2024)"}</div>`;
    if(tr.cota_m!=null) g+=row(T.elev,tr.cota_m," m")+row(T.slope,tr.declive_pct," %")+row(T.aspect,tr.exposicao);
    else if(tr.cota_inicio_m!=null) g+=row(T.elev+" A→B",`${fmt(tr.cota_inicio_m,0)}→${fmt(tr.cota_fim_m,0)} m`)+row(T.drop,tr.desnivel_m," m")+row(T.slope+" "+(EN?"avg":"méd."),tr.declive_medio_pct," %")+row(T.slope+" máx",tr.declive_max_pct," %");
    else g+=`<div><span>${T.elev}</span><b>${T.noelev}</b></div>`; el.innerHTML=h+g; } }
function closeForm(){ form.hidden=true; dims.clearLayers(); if(E.cur){ try{ E.cur.pm&&E.cur.pm.disable(); }catch(e){} if(work.hasLayer(E.cur)) work.removeLayer(E.cur); if(E.cur.__origLayer){ try{ E.cur.__origLayer.setStyle(E.cur.__origLayer.__orig||{}); }catch(e){} } } E.cur=null; E.ctx=null; }
function cancelEdit(){ closeForm(); showHint(T.pick); }
async function askChangeset(){ if(E.csAsked) return; E.csAsked=true; const c=prompt(T.csq,""); await send("POST","/changesets",{id:E.changeset,comment:c||"",actor:auth().actor}); }
async function save(){ const ctx=E.ctx, l=E.cur; if(!l) return; await askChangeset(); const pre=form.querySelector("#epre .on")?.dataset.p||"outro"; const props={preset:pre,photo:form.querySelector("#ephoto").value.trim()}; form.querySelectorAll("#efields input").forEach(i=>{ if(i.value!=="") props[i.dataset.f]=i.value; });
  const m={...M}; delete m.centre; delete m.pts; const g=l.toGeoJSON().geometry; const st=form.querySelector("#estatus")?.value;
  const body={layer:ctx.layer||"propostas",name:form.querySelector("#ename").value.trim(),kind:pre,geometry:g,props,measures:m,note:form.querySelector("#enote").value.trim(),actor:auth().actor,changeset:E.changeset,...(st?{status:st}:{})};
  let r; if(ctx.id) r=await send("PATCH","/features/"+ctx.id,body); else { if(ctx.existing){ body.op=ctx.op||"modify"; body.ref_id=ctx.existing.ref; body.ref_layer=ctx.existing.t; body.ref_name=ctx.existing.name; } r=await send("POST","/features",body); }
  if(r.error){ toast&&toast((EN?"Not saved: ":"Não guardado: ")+(r.need||r.error)); return; }
  toast&&toast(r.queued?T.queued:`${T.saved} ${r.id||ctx.id||""}`); if(l.__origLayer) try{ l.__origLayer.setStyle({opacity:.35,fillOpacity:.05,dashArray:"3 6"}); }catch(e){}
  E.cur.__keep=false; closeForm(); showHint(T.pick); if(r.queued){ l.__ed=true; drawn.addLayer(l); } else loadFeatures(); }
async function retire(id){ const why=prompt(T.why,""); if(why===null) return; const r=await send("DELETE",`/features/${id}?actor=${encodeURIComponent(auth().actor)}&note=${encodeURIComponent(why)}`); toast&&toast(r.queued?T.queued:(EN?"Retired":"Retirado")); closeForm(); loadFeatures(); }
/* ---------- existing core item ---------- */
function openExisting(l){ const f=l.feature, t=l.__t, p=f.properties||{}; const name=p.name||p.asset_id||p.tree_name||"—"; const ref=coreRef(t,f); const title=(typeof title_i18n==="function"&&typeof layerObjs!=="undefined")?t:t;
  closeForm(); form.hidden=false; form.innerHTML=`<div class="hd"><h3>${T.existing}</h3><span class="st" style="background:var(--line-2);color:var(--linen)">${title}</span></div><div class="bd"><div style="font:600 15px var(--display)">${name}</div><div style="font:12px var(--ui);color:var(--muted)">${ref}</div>
  <div class="rows"><button id="xg">✎ ${T.editgeom}</button><button id="xa">☰ ${T.editattr}</button><button id="xr" style="color:var(--ember)">× ${T.retire}</button></div>
  <div style="font:11.5px var(--ui);color:var(--muted)">${EN?"The team's core map is never overwritten: your change is saved as a proposal on top of it, reviewed by leadership, then applied in QGIS.":"O mapa base da equipa nunca é reescrito: a alteração fica guardada como proposta por cima, é revista pela liderança e depois aplicada no QGIS."}</div></div><div class="ft"><button id="ecancel">${T.cancel}</button></div>`;
  form.querySelector("#ecancel").onclick=cancelEdit;
  const clone=()=>{ const gj=l.toGeoJSON(); let c; if(gj.geometry.type==="Point") c=L.marker([gj.geometry.coordinates[1],gj.geometry.coordinates[0]],{icon:pin("#c9a227","✎")}); else c=L.geoJSON(gj,{style:{color:"#c9a227",weight:3,fillColor:"#c9a227",fillOpacity:.15}}).getLayers()[0]; c.__origLayer=l; l.__orig=l.options; try{ l.setStyle&&l.setStyle({opacity:.35,fillOpacity:.05,dashArray:"3 6"}); }catch(e){} work.addLayer(c); return c; };
  form.querySelector("#xg").onclick=()=>{ const c=clone(); startEdit(c,{existing:{ref,t,name},op:"modify",props:{...p}}); setTool("select"); };
  form.querySelector("#xa").onclick=()=>{ const c=clone(); startEdit(c,{existing:{ref,t,name},op:"modify",props:{...p}}); };
  form.querySelector("#xr").onclick=async()=>{ const why=prompt(T.why,""); if(why===null) return; await askChangeset(); const gj=l.toGeoJSON(); const r=await send("POST","/features",{layer:"propostas",name,kind:"retire",op:"retire",ref_id:ref,ref_layer:t,ref_name:name,geometry:gj.geometry,props:{preset:"outro"},note:why,actor:auth().actor,changeset:E.changeset}); toast&&toast(r.queued?T.queued:(EN?"Retirement proposed":"Retirada proposta")); closeForm(); loadFeatures(); }; }
/* ---------- info on a brain feature ---------- */
async function openInfo(l){ const p=l.feature.properties; const a=auth(); const leader=a.role==="leader"; const own=a.role==="field"&&p.created_by===a.actor; const m=p.measures||{}; const sk=({proposto:"prop",aprovado:"appr",rejeitado:"rej",reportado:"rep",resolvido:"res"})[p.status];
  const row=(k,v,u="")=>v==null?"":`<div><span>${k}</span><b>${typeof v==="number"?fmt(v,v>=100?0:1):v}${u}</b></div>`;
  closeForm(); form.hidden=false; form.innerHTML=`<div class="hd"><h3>${p.name||p.kind||p.id}</h3><span class="st" style="background:${STATUS_COL[p.status]||"#c9a227"}">${T[sk]||p.status}</span></div><div class="bd">
  <div style="font:12px var(--ui);color:var(--muted)">${p.id} · ${T.v}${p.version} · ${(EN?PRESETS.find(x=>x.id===p.preset)?.en:PRESETS.find(x=>x.id===p.preset)?.pt)||p.kind||""} · ${p.op==="modify"?T.modified+" → "+(p.ref_name||p.ref_id):p.op==="retire"?T.retired+" → "+(p.ref_name||p.ref_id):""}</div>
  <div style="font:12px var(--ui);color:var(--linen-2)">${T.by} <b>${p.created_by||"—"}</b> · ${String(p.updated_at||p.created_at).slice(0,16).replace("T"," ")}${p.changeset?` · ${p.changeset}`:""}</div>
  ${Object.keys(p).filter(k=>FL[k]&&p[k]!=null&&p[k]!=="").length?`<div class="meas">${Object.keys(p).filter(k=>FL[k]&&p[k]!=null&&p[k]!=="").map(k=>row(FL[k][EN?1:0],p[k])).join("")}</div>`:""}
  <div class="meas"><div class="t">${T.measures}</div>${row(T.len,m.comprimento_m," m")}${row(T.wid,m.largura_m," m")}${row(T.area_,m.area_m2," m²")}${row(T.radius,m.raio_m," m")}${row(T.az,m.orientacao_deg,"°")}${row(T.elev,m.cota_m??m.cota_inicio_m," m")}${row(T.slope,m.declive_pct??m.declive_medio_pct," %")}${row(T.aspect,m.exposicao)}${row(T.drop,m.desnivel_m," m")}</div>
  ${p.note?`<div style="font:13px var(--ui);white-space:pre-wrap">${p.note}</div>`:""}${p.photo?`<a href="${p.photo}" target="_blank" style="color:var(--straw);font:12px var(--ui)">📷 ${T.photo}</a>`:""}
  <div class="rows">${(leader||own)?`<button id="ie">✎ ${EN?"Edit":"Editar"}</button>`:""}${leader&&p.status!=="aprovado"?`<button id="ia" style="color:var(--oak)">✓ ${T.approve}</button>`:""}${leader&&p.status!=="rejeitado"?`<button id="ir" style="color:var(--ember)">✗ ${T.reject}</button>`:""}<button id="ih">🕰 ${T.hist}</button></div><div class="hist" id="ihist"></div></div><div class="ft"><button id="ecancel">${EN?"Close":"Fechar"}</button></div>`;
  form.querySelector("#ecancel").onclick=closeForm;
  const ie=form.querySelector("#ie"); if(ie) ie.onclick=()=>{ if(!E.on) toggle(); const gj=l.toGeoJSON(); let c; if(gj.geometry.type==="Point") c=(m.kind==="circle")?L.circle(l.getLatLng(),{radius:m.raio_m,color:"#c9a227",weight:3,fillColor:"#c9a227",fillOpacity:.15}):L.marker(l.getLatLng(),{icon:pin("#c9a227","✎")}); else c=L.geoJSON(gj,{style:{color:"#c9a227",weight:3,fillColor:"#c9a227",fillOpacity:.15}}).getLayers()[0]; work.addLayer(c); drawn.removeLayer(l); startEdit(c,{id:p.id,layer:p.layer,props:{...p}}); };
  const st=async s=>{ const note=prompt(T.note,""); if(note===null) return; const r=await send("POST",`/features/${p.id}/status`,{status:s,note,actor:a.actor,changeset:E.changeset}); toast&&toast(r.queued?T.queued:(T[({aprovado:"appr",rejeitado:"rej"})[s]])); closeForm(); loadFeatures(); };
  const ia=form.querySelector("#ia"); if(ia) ia.onclick=()=>st("aprovado"); const ir=form.querySelector("#ir"); if(ir) ir.onclick=()=>st("rejeitado");
  form.querySelector("#ih").onclick=async()=>{ const d=await fetch(API+`/features/${p.id}/history`).then(r=>r.json()).catch(()=>({history:[]})); form.querySelector("#ihist").innerHTML=(d.history||[]).map(h=>`<div>${T.v}${h.version} · ${h.action} · ${h.actor||"—"} · ${String(h.at).slice(0,16).replace("T"," ")}${h.status?` · ${h.status}`:""}</div>`).join("")||`<div>${EN?"No earlier versions":"Sem versões anteriores"}</div>`; }; }

/* ---------- exact shapes: pick a shape, type real-world dimensions (m/cm), rotate, snap to a metre grid, place by tap / drag / GPS ---------- */
const GRID_ORIGIN=L.latLng(37.50061,-8.65749);                      // SW corner of the parcels — grid is stable across sessions
const grid=L.layerGroup(); let gridSp=1, gridOn=false;
function drawGrid(){ grid.clearLayers(); if(!gridOn||map.getZoom()<16) return; const P=proj(GRID_ORIGIN); const b=map.getBounds(); const sw=P.to(b.getSouthWest()), ne=P.to(b.getNorthEast());
  let sp=gridSp; const mpp=40075016.686*Math.cos(map.getCenter().lat*Math.PI/180)/Math.pow(2,map.getZoom()+8); while(sp/mpp<12) sp*=2;   // keep lines ≥12 px apart
  const x0=Math.floor(sw[0]/sp)*sp, x1=Math.ceil(ne[0]/sp)*sp, y0=Math.floor(sw[1]/sp)*sp, y1=Math.ceil(ne[1]/sp)*sp; if((x1-x0)/sp>400||(y1-y0)/sp>400) return;
  for(let x=x0;x<=x1;x+=sp){ const major=Math.round(x/sp)%5===0; grid.addLayer(L.polyline([P.from(x,y0),P.from(x,y1)],{color:"#f1e9d8",weight:major?1:.6,opacity:major?.45:.22,interactive:false})); }
  for(let y=y0;y<=y1;y+=sp){ const major=Math.round(y/sp)%5===0; grid.addLayer(L.polyline([P.from(x0,y),P.from(x1,y)],{color:"#f1e9d8",weight:major?1:.6,opacity:major?.45:.22,interactive:false})); }
  grid.__sp=sp; }
map.on("moveend zoomend",drawGrid);
function snapLL(ll){ if(!gridOn||!SH.snap) return ll; const P=proj(GRID_ORIGIN), sp=gridSp; const [x,y]=P.to(ll); return P.from(Math.round(x/sp)*sp, Math.round(y/sp)*sp); }
function setGrid(v){ gridOn=v>0; if(gridOn){ gridSp=v; if(!map.hasLayer(grid)) grid.addTo(map); } else if(map.hasLayer(grid)) map.removeLayer(grid); drawGrid(); const gb=tools.querySelector('[data-t=grid]'); if(gb){ gb.classList.toggle("on",gridOn); gb.querySelector("span").textContent=gridOn?`${T.gridBtn} ${gridSp} m`:T.gridBtn; } if(!form.hidden&&form.querySelector("#sgrid")) openShapes(); }
const snapRing=a=>Array.isArray(a)&&a.length&&Array.isArray(a[0])?a.map(snapRing):a.map(snapLL);
function snapLayer(l){ if(!gridOn||!SH.snap) return l; if(l instanceof L.Circle){ l.setLatLng(snapLL(l.getLatLng())); l.setRadius(Math.max(gridSp/2,Math.round(l.getRadius()/gridSp)*gridSp)); } else if(l instanceof L.Marker||l instanceof L.CircleMarker){ l.setLatLng(snapLL(l.getLatLng())); } else l.setLatLngs(snapRing(l.getLatLngs())); return l; }
/* ---------- live dimensions between the main points ---------- */
const dims=L.layerGroup().addTo(map);
function dimLabel(ll,txt,cls){ dims.addLayer(L.marker(ll,{icon:L.divIcon({className:"",html:`<div class="dim ${cls||""}">${txt}</div>`,iconSize:[0,0]}),interactive:false,keyboard:false})); }
function showDims(pts,closed,cursor){ dims.clearLayers(); if(!pts||!pts.length) return; const all=cursor?[...pts,cursor]:pts.slice(); if(all.length<2) return; const c=centre(all), P=proj(c), xy=all.map(P.to), n=all.length; const segs=(closed&&n>2)?n:n-1;
  for(let i=0;i<segs;i++){ const a=xy[i],b=xy[(i+1)%n]; const d=Math.hypot(b[0]-a[0],b[1]-a[1]); if(d<0.05) continue; dimLabel(P.from((a[0]+b[0])/2,(a[1]+b[1])/2), fmt(d,2)+" m", (cursor&&i>=segs-(closed?2:1))?"live":""); }
  if(closed&&n>2){ let A=0; for(let i=0;i<n;i++){ const p=xy[i],q=xy[(i+1)%n]; A+=p[0]*q[1]-q[0]*p[1]; } A=Math.abs(A)/2; if(A>0.5) dimLabel(c, A<10000?fmt(A,1)+" m²":fmt(A/1e4,3)+" ha", "area"); } }
function dimsFor(layer,cursor){ if(!layer){ dims.clearLayers(); return; } if(layer instanceof L.Circle){ dims.clearLayers(); const r=layer.getRadius(); dimLabel(layer.getLatLng(),`r ${fmt(r,2)} m · Ø ${fmt(2*r,2)} m · ${fmt(Math.PI*r*r,1)} m²`,"area"); return; } if(layer instanceof L.Marker||layer instanceof L.CircleMarker){ dims.clearLayers(); return; } showDims(flat(layer.getLatLngs()), layer instanceof L.Polygon, cursor); }
const SH={kind:"rect",a:10,b:6,r:2.5,n:6,side:3,len:20,rot:0,unit:"m",snap:true};
function buildShape(c,extra){ const P=proj(c), t=SH.rot*Math.PI/180, u=[Math.sin(t),Math.cos(t)], v=[Math.cos(t),-Math.sin(t)]; const st={color:"#c9a227",weight:3,fillColor:"#c9a227",fillOpacity:.15,...(extra||{})};
  const at=(x,y)=>P.from(x*u[0]+y*v[0], x*u[1]+y*v[1]);                     // x along the rotated axis, y across
  if(SH.kind==="rect"||SH.kind==="sq"){ const a=SH.a, b=SH.kind==="sq"?SH.a:SH.b; return L.polygon([[1,1],[1,-1],[-1,-1],[-1,1]].map(([p,q])=>at(p*a/2,q*b/2)),st); }
  if(SH.kind==="circle") return L.circle(c,{radius:SH.r,...st});
  if(SH.kind==="ellipse"){ const pts=[]; for(let i=0;i<64;i++){ const th=i/64*2*Math.PI; pts.push(at(SH.a/2*Math.cos(th), SH.b/2*Math.sin(th))); } return L.polygon(pts,st); }
  if(SH.kind==="ngon"){ const n=Math.max(3,Math.min(24,SH.n|0)), R=SH.side/(2*Math.sin(Math.PI/n)); const pts=[]; for(let i=0;i<n;i++){ const th=i/n*2*Math.PI; pts.push(at(R*Math.sin(th),R*Math.cos(th))); } return L.polygon(pts,st); }
  return L.polyline([at(-SH.len/2,0),at(SH.len/2,0)],st); }
function shapeMeasures(){ if(SH.kind==="rect") return {a:SH.a,b:SH.b,area:SH.a*SH.b,per:2*(SH.a+SH.b)}; if(SH.kind==="sq") return {a:SH.a,b:SH.a,area:SH.a*SH.a,per:4*SH.a}; if(SH.kind==="circle") return {area:Math.PI*SH.r*SH.r,per:2*Math.PI*SH.r};
  if(SH.kind==="ellipse"){ const a=SH.a/2,b=SH.b/2,h=((a-b)**2)/((a+b)**2); return {area:Math.PI*a*b,per:Math.PI*(a+b)*(1+3*h/(10+Math.sqrt(4-3*h)))}; } if(SH.kind==="ngon"){ const n=Math.max(3,SH.n|0); return {area:n*SH.side*SH.side/(4*Math.tan(Math.PI/n)),per:n*SH.side}; } return {len:SH.len}; }
let preview=null, placeMode=null;
function endPlace(){ map.dragging.enable(); if(placeMode==="tap") map.off("click",onTapPlace); map.off("mousemove",onMovePreview); if(placeMode==="drag"){ map.dragging.enable(); const el=map.getContainer(); el.removeEventListener("touchstart",dragStart); el.removeEventListener("touchmove",dragMove); el.removeEventListener("touchend",dragEnd); map.off("mousedown",dragStart); map.off("mousemove",dragMove); map.off("mouseup",dragEnd); }
  if(preview){ map.removeLayer(preview); preview=null; } anchor=null; placeMode=null; mapEl.classList.remove("ed-draw"); }
function drop(c){ endPlace(); const l=buildShape(c); work.addLayer(l); startEdit(l,{preset:null,shape:SH.kind}); showHint(null); }
let anchor=null;                                                       // point 1 of the two-click insert
function centreFrom(A,azd){ const P=proj(A), t=azd*Math.PI/180, u=[Math.sin(t),Math.cos(t)], v=[Math.cos(t),-Math.sin(t)];
  if(SH.kind==="rect"||SH.kind==="sq"){ const a=SH.a, b=SH.kind==="sq"?SH.a:SH.b; return P.from(u[0]*a/2+v[0]*b/2, u[1]*a/2+v[1]*b/2); }   // A = first corner, long side towards the cursor
  if(SH.kind==="line") return P.from(u[0]*SH.len/2, u[1]*SH.len/2);                                                                      // A = start
  return A; }                                                                                                                              // circle / ellipse / polygon: A = centre
function azTo(A,ll){ const P=proj(A); const [x,y]=P.to(ll); return Math.hypot(x,y)<0.3?SH.rot:(Math.atan2(x,y)*180/Math.PI+360)%360; }
function onMovePreview(e){ if(!anchor) return; const azd=azTo(anchor,e.latlng); const c=centreFrom(anchor,azd); const keep=SH.rot; SH.rot=azd; if(preview) map.removeLayer(preview); preview=buildShape(c,{dashArray:"6 5",fillOpacity:.08,interactive:false}); preview.addTo(map); dimsFor(preview); SH.rot=keep;
  showHint(`${T.p2} · ${fmt(azd,0)}°`); }
function onTapPlace(e){ const ll=snapLL(e.latlng);
  if(!anchor){ anchor=ll; if(preview) map.removeLayer(preview); preview=L.circleMarker(anchor,{radius:5,color:"#c9a227",weight:2,fillColor:"#c9a227",fillOpacity:1,interactive:false}).addTo(map);
    if(SH.kind==="circle"){ drop(anchor); anchor=null; return; }                                                  // a circle needs only its centre
    showHint(T.p2); map.on("mousemove",onMovePreview); map.once("click",onTapPlace); return; }
  const azd=azTo(anchor,e.latlng); const c=centreFrom(anchor,azd); SH.rot=Math.round(azd); const A=anchor; anchor=null; drop(c); }
let dragA=null;
function evLL(e){ if(e.latlng) return e.latlng; const t=(e.touches&&e.touches[0])||(e.changedTouches&&e.changedTouches[0]); return t?map.mouseEventToLatLng(t):null; }
function dragStart(e){ const ll=evLL(e); if(!ll) return; dragA=snapLL(ll); if(e.preventDefault) e.preventDefault(); }
function dragMove(e){ if(!dragA) return; const ll=evLL(e); if(!ll) return; const B=snapLL(ll); const P=proj(dragA); const [dx,dy]=P.to(B); SH.a=Math.abs(dx); SH.b=Math.abs(dy); SH.rot=0; if(preview) map.removeLayer(preview); preview=L.rectangle(L.latLngBounds(dragA,B),{color:"#c9a227",weight:2,dashArray:"6 5",fillColor:"#c9a227",fillOpacity:.08,interactive:false}).addTo(map); dimsFor(preview); showHint(`${fmt(SH.a,2)} × ${fmt(SH.b,2)} m · ${fmt(SH.a*SH.b,1)} m²`); if(e.preventDefault) e.preventDefault(); }
function dragEnd(e){ if(!dragA) return; const ll=evLL(e)||map.getCenter(); const B=snapLL(ll); const P=proj(dragA); const [dx,dy]=P.to(B); if(Math.abs(dx)<0.2||Math.abs(dy)<0.2){ dragA=null; return; } SH.kind="rect"; SH.a=+Math.abs(dx).toFixed(2); SH.b=+Math.abs(dy).toFixed(2); SH.rot=0; const c=P.from(dx/2,dy/2); dragA=null; drop(c); }
function openShapes(){ setTool(null); closeForm(); form.hidden=false; const u=SH.unit, k=u==="cm"?100:1, U=u; const num=(id,v,lab)=>`<label>${lab} (${U})<input id="${id}" type="number" step="${u==="cm"?1:0.01}" value="${+(v*k).toFixed(2)}"></label>`;
  const dims=SH.kind==="rect"?num("sa",SH.a,T.a)+num("sb",SH.b,T.b):SH.kind==="sq"?num("sa",SH.a,T.side):SH.kind==="circle"?num("sr",SH.r,T.radius):SH.kind==="ellipse"?num("sa",SH.a,T.a)+num("sb",SH.b,T.b):SH.kind==="ngon"?`<label>${T.sides}<input id="sn" type="number" min="3" max="24" value="${SH.n}"></label>`+num("ss",SH.side,T.side):num("sl",SH.len,T.len);
  const m=shapeMeasures(); const KINDS=[["rect",T.rect],["sq",T.sq],["circle",T.circle],["ellipse",T.ellipse],["ngon",T.ngon],["line",T.line]];
  form.innerHTML=`<div class="hd"><h3>${T.shapes}</h3><span class="st" style="background:var(--straw)">${gridOn?`${T.grid} ${grid.__sp||gridSp} m`:T.grid+" "+T.off}</span></div><div class="bd">
  <label>${T.type}<div class="presets" id="shk">${KINDS.map(([id,l])=>`<button data-k="${id}" class="${id===SH.kind?"on":""}">${l}</button>`).join("")}</div></label>
  <div class="grid2" id="shd">${dims}</div>
  <div class="grid2"><label>${T.rot} (°)<input id="srot" type="number" step="1" value="${SH.rot}"></label><label>${T.unit}<select id="sunit"><option value="m" ${u==="m"?"selected":""}>m</option><option value="cm" ${u==="cm"?"selected":""}>cm</option></select></label></div>
  <div class="grid2"><label>${T.grid}<select id="sgrid"><option value="0" ${!gridOn?"selected":""}>${T.off}</option>${[0.5,1,2,5,10].map(v=>`<option value="${v}" ${gridOn&&gridSp===v?"selected":""}>${v} m</option>`).join("")}</select></label><label style="justify-content:end;flex-direction:row;align-items:center;gap:8px;padding-top:18px"><input id="ssnap" type="checkbox" ${SH.snap?"checked":""} style="width:18px;height:18px">${T.snapc}</label></div>
  <div class="meas"><div class="t">${T.measures}</div>${m.area!=null?`<div><span>${T.area_}</span><b>${fmt(m.area,2)} m²</b></div><div><span>${T.per}</span><b>${fmt(m.per,2)} m</b></div>`:`<div><span>${T.len}</span><b>${fmt(m.len,2)} m</b></div>`}</div>
  <div class="rows"><button id="splace">📍 ${T.place}</button><button id="sdrag">⬚ ${T.dragA}</button><button id="sgps">🛰 ${T.gps}</button></div></div><div class="ft"><button id="ecancel">${T.cancel}</button></div>`;
  const rd=()=>{ const g=id=>{ const el=form.querySelector("#"+id); return el?+el.value:null; }; const kk=SH.unit==="cm"?1/100:1; if(g("sa")!=null) SH.a=g("sa")*kk; if(g("sb")!=null) SH.b=g("sb")*kk; if(g("sr")!=null) SH.r=g("sr")*kk; if(g("ss")!=null) SH.side=g("ss")*kk; if(g("sl")!=null) SH.len=g("sl")*kk; if(g("sn")!=null) SH.n=g("sn"); SH.rot=g("srot")||0; SH.snap=form.querySelector("#ssnap").checked; };
  form.querySelectorAll("#shk button").forEach(b=>b.onclick=()=>{ rd(); SH.kind=b.dataset.k; openShapes(); });
  form.querySelector("#sunit").onchange=e=>{ rd(); SH.unit=e.target.value; openShapes(); };
  form.querySelector("#sgrid").onchange=e=>{ rd(); setGrid(+e.target.value); };
  form.querySelectorAll("#shd input,#srot").forEach(i=>i.onchange=()=>{ rd(); openShapes(); });
  form.querySelector("#ecancel").onclick=()=>{ endPlace(); closeForm(); showHint(T.pick); };
  form.querySelector("#splace").onclick=()=>{ rd(); endPlace(); placeMode="tap"; mapEl.classList.add("ed-draw"); map.dragging.disable(); showHint(SH.kind==="circle"?T.p1c:T.p1); setTimeout(()=>map.once("click",onTapPlace),0); };
  form.querySelector("#sdrag").onclick=()=>{ rd(); endPlace(); placeMode="drag"; mapEl.classList.add("ed-draw"); showHint(T.dragH); map.dragging.disable(); const el=map.getContainer(); el.addEventListener("touchstart",dragStart,{passive:false}); el.addEventListener("touchmove",dragMove,{passive:false}); el.addEventListener("touchend",dragEnd); map.on("mousedown",dragStart); map.on("mousemove",dragMove); map.on("mouseup",dragEnd); };
  form.querySelector("#sgps").onclick=()=>{ rd(); if(!navigator.geolocation) return toast&&toast(T.gpsE); showHint(T.gpsH); navigator.geolocation.getCurrentPosition(pos=>{ const c=L.latLng(pos.coords.latitude,pos.coords.longitude); const acc=L.circle(c,{radius:pos.coords.accuracy||10,color:"#5b8fb9",weight:1,fillOpacity:.08,interactive:false}).addTo(map); setTimeout(()=>map.removeLayer(acc),6000); map.setView(c,Math.max(map.getZoom(),19)); toast&&toast(`GPS ±${Math.round(pos.coords.accuracy||0)} m ${T.acc}`); drop(snapLL(c)); },()=>{ showHint(T.pick); toast&&toast(T.gpsE); },{enableHighAccuracy:true,timeout:12000,maximumAge:0}); };
}

/* ---------- boot ---------- */
loadFeatures();
if(/[#&]edit\b/.test(location.hash)) setTimeout(toggle,800);
window.edrEdit={toggle,reload:loadFeatures,PRESETS};
})();
