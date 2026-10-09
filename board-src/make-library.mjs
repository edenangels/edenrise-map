// The estate's own symbol library + board templates for the Quadro, as Excalidraw element skeletons
// (converted at load time with convertToExcalidrawElements). Clean schematic style: no roughness, estate palette.
import fs from "node:fs";
const C = { water:"#5b8fb9", waterL:"#03a9f4", power:"#ffab00", earth:"#b58b5a", moss:"#7f9a6a", straw:"#c9a227", clay:"#e07b39", ember:"#d9534f", ink:"#1c1813", paper:"#f1e9d8", grey:"#6b6157", white:"#ffffff" };
const base = { roughness:0, strokeWidth:2, opacity:100 };
const R = (x,y,w,h,o={}) => ({ type:"rectangle", x,y,width:w,height:h, ...base, ...o });
const E = (x,y,w,h,o={}) => ({ type:"ellipse", x,y,width:w,height:h, ...base, ...o });
const D = (x,y,w,h,o={}) => ({ type:"diamond", x,y,width:w,height:h, ...base, ...o });
const L = (x,y,pts,o={}) => ({ type:"line", x,y, points:pts, ...base, ...o });
const A = (x,y,pts,o={}) => ({ type:"arrow", x,y, points:pts, ...base, endArrowhead:"arrow", ...o });
const Tx = (x,y,text,o={}) => ({ type:"text", x,y, text, fontSize:14, fontFamily:2, textAlign:"center", ...o });
const lab = (text,x,y,w) => Tx(x,y,text,{ width:w, fontSize:12, strokeColor:C.ink });

const SYMBOLS = [
 ["Válvula (aberta)", [L(0,0,[[0,0],[40,24],[40,0],[0,24],[0,0]],{strokeColor:C.water, customData:{smart:"valve", state:"open", tag:""}}), L(20,12,[[0,0],[0,-14]],{strokeColor:C.water}), L(10,-14,[[0,0],[20,0]],{strokeColor:C.water}), lab("Válvula",-10,30,60)]],
 ["Válvula (fechada)", [L(0,0,[[0,0],[40,24],[40,0],[0,24],[0,0]],{strokeColor:C.ember, backgroundColor:C.ember, fillStyle:"solid", customData:{smart:"valve", state:"closed", tag:""}}), L(20,12,[[0,0],[0,-14]],{strokeColor:C.ember}), L(10,-14,[[0,0],[20,0]],{strokeColor:C.ember}), lab("Fechada",-10,30,60)]],
 ["Bomba", [E(0,0,48,48,{strokeColor:C.water, backgroundColor:C.white, fillStyle:"solid", customData:{smart:"pump", state:"off", tag:""}}), L(14,36,[[0,0],[20,0],[10,-24],[0,0]],{strokeColor:C.water, backgroundColor:C.water, fillStyle:"solid"}), lab("Bomba",-6,54,60)]],
 ["Tanque / depósito", [R(0,0,80,56,{strokeColor:C.water, backgroundColor:"#dbe9f3", fillStyle:"solid", roundness:{type:3}, customData:{smart:"tank", tag:"", capacity:""}}), L(6,22,[[0,0],[12,-6],[24,0],[36,-6],[48,0],[60,-6],[68,0]],{strokeColor:C.water}), lab("Depósito",0,62,80)]],
 ["Furo / poço", [E(8,0,32,16,{strokeColor:C.water}), L(24,16,[[0,0],[0,48]],{strokeColor:C.water, strokeWidth:3}), L(12,64,[[0,0],[24,0]],{strokeColor:C.water}), lab("Furo",-6,70,60)]],
 ["Conduta de água", [A(0,0,[[0,0],[120,0]],{strokeColor:C.water, strokeWidth:4, endArrowhead:"triangle"}), lab("Conduta",30,-24,60)]],
 ["Rega (gota a gota)", [L(0,0,[[0,0],[120,0]],{strokeColor:C.waterL, strokeWidth:2, strokeStyle:"dashed"}), ...[20,50,80,110].map(x=>E(x-3,-3,6,6,{strokeColor:C.waterL, backgroundColor:C.waterL, fillStyle:"solid"})), lab("Rega",30,-26,60)]],
 ["Contador", [E(0,0,40,40,{strokeColor:C.ink, backgroundColor:C.white, fillStyle:"solid", customData:{smart:"meter", tag:"", reading:""}}), Tx(8,10,"m³",{fontSize:14}), L(-14,20,[[0,0],[14,0]],{strokeColor:C.water}), L(40,20,[[0,0],[14,0]],{strokeColor:C.water})]],
 ["Filtro", [R(0,0,48,36,{strokeColor:C.water, backgroundColor:C.white, fillStyle:"solid"}), L(4,32,[[0,0],[40,-28]],{strokeColor:C.water}), L(4,18,[[0,0],[18,-14]],{strokeColor:C.water}), lab("Filtro",-6,42,60)]],
 ["Ponto de água", [L(0,0,[[0,0],[0,28]],{strokeColor:C.water, strokeWidth:3}), L(0,0,[[0,0],[18,0],[18,8]],{strokeColor:C.water, strokeWidth:3}), E(14,10,8,10,{strokeColor:C.waterL, backgroundColor:C.waterL, fillStyle:"solid"}), lab("Torneira",-24,34,60)]],
 ["Fossa", [R(0,0,56,40,{strokeColor:C.earth, backgroundColor:"#e9dfd1", fillStyle:"solid"}), Tx(20,11,"F",{fontSize:18, strokeColor:C.earth}), lab("Fossa",-2,46,60)]],
 ["Quadro elétrico", [R(0,0,44,56,{strokeColor:C.power, backgroundColor:"#fff4d6", fillStyle:"solid", customData:{smart:"power", state:"on", tag:""}}), Tx(12,16,"⚡",{fontSize:20}), lab("Quadro",-8,62,60)]],
 ["Linha elétrica", [L(0,0,[[0,0],[120,0]],{strokeColor:C.power, strokeWidth:3, strokeStyle:"dashed"}), lab("Elétrica",30,-26,60)]],
 ["Painel solar", [R(0,0,72,44,{strokeColor:C.ink, backgroundColor:"#2b3f6b", fillStyle:"solid"}), L(24,0,[[0,0],[0,44]],{strokeColor:C.white}), L(48,0,[[0,0],[0,44]],{strokeColor:C.white}), L(0,22,[[0,0],[72,0]],{strokeColor:C.white}), lab("Solar",6,50,60)]],
 ["Árvore", [E(0,0,44,44,{strokeColor:C.moss, backgroundColor:"#9fb789", fillStyle:"solid"}), L(22,44,[[0,0],[0,18]],{strokeColor:C.earth, strokeWidth:4}), lab("Árvore",-8,66,60)]],
 ["Vedação", [L(0,0,[[0,0],[120,0]],{strokeColor:C.earth, strokeWidth:2}), ...[0,30,60,90,120].map(x=>L(x,-8,[[0,0],[0,16]],{strokeColor:C.earth, strokeWidth:3})), lab("Vedação",30,-30,60)]],
 ["Portão", [R(0,0,60,36,{strokeColor:C.earth}), L(0,0,[[0,0],[60,36]],{strokeColor:C.earth}), L(0,36,[[0,0],[60,-36]],{strokeColor:C.earth}), lab("Portão",0,42,60)]],
 ["Edifício", [R(0,20,72,48,{strokeColor:C.ink, backgroundColor:C.paper, fillStyle:"solid"}), L(-4,20,[[0,0],[40,-20],[80,0]],{strokeColor:C.ink, strokeWidth:3}), R(30,46,14,22,{strokeColor:C.ink}), lab("Edifício",6,74,60)]],
 ["Caminho", [L(0,0,[[0,0],[60,-10],[120,0]],{strokeColor:C.grey, strokeWidth:6, strokeStyle:"dotted"}), lab("Caminho",30,-30,60)]],
 ["Nota", [R(0,0,140,90,{strokeColor:C.straw, backgroundColor:"#fff2bf", fillStyle:"solid", label:{text:"Nota…", fontSize:14, fontFamily:2, textAlign:"left", verticalAlign:"top"}})]],
 ["Feito ✓", [R(0,0,120,34,{strokeColor:C.moss, backgroundColor:"#dfe9d6", fillStyle:"solid", roundness:{type:3}, label:{text:"Feito ✓", fontSize:14, fontFamily:2}})]],
 ["A fazer", [R(0,0,120,34,{strokeColor:C.clay, backgroundColor:"#f7dfd0", fillStyle:"solid", roundness:{type:3}, label:{text:"A fazer", fontSize:14, fontFamily:2}})]],
 ["Atenção", [D(0,0,44,44,{strokeColor:C.ember, backgroundColor:C.ember, fillStyle:"solid"}), Tx(17,10,"!",{fontSize:20, strokeColor:C.white}), lab("Atenção",-8,50,60)]],
 ["Legenda", [R(0,0,180,110,{strokeColor:C.grey, backgroundColor:C.white, fillStyle:"solid"}), Tx(8,6,"Legenda",{fontSize:14, textAlign:"left"}), L(10,40,[[0,0],[30,0]],{strokeColor:C.water, strokeWidth:4}), Tx(48,32,"água",{fontSize:12, textAlign:"left"}), L(10,64,[[0,0],[30,0]],{strokeColor:C.power, strokeWidth:3, strokeStyle:"dashed"}), Tx(48,56,"eletricidade",{fontSize:12, textAlign:"left"}), L(10,88,[[0,0],[30,0]],{strokeColor:C.grey, strokeWidth:6, strokeStyle:"dotted"}), Tx(48,80,"caminho",{fontSize:12, textAlign:"left"})]],
];
const library = { type:"edenrise-library-skel", version:1, items: SYMBOLS.map(([name, elements]) => ({ name, elements })) };
fs.writeFileSync("vendor/excalidraw/edenrise-library.json", JSON.stringify(library));

/* ---------- templates: a starting layout for the kinds of place the team documents ---------- */
const title = (t, sub) => [ Tx(0,0,t,{fontSize:28, textAlign:"left", fontFamily:2}), Tx(0,40,sub,{fontSize:14, textAlign:"left", strokeColor:C.grey}) ];
const zone = (x,y,w,h,name,col) => [ R(x,y,w,h,{strokeColor:col, backgroundColor:col+"22", fillStyle:"solid", strokeStyle:"dashed", roundness:{type:3}}), Tx(x+12,y+10,name,{fontSize:16, textAlign:"left", strokeColor:col}) ];
const TEMPLATES = [
 { id:"blank", name:"Em branco", en:"Blank", elements:[] },
 { id:"pump", name:"Casa das bombas", en:"Pump room", elements:[
   ...title("Casa das bombas","Entrada → bombas → filtragem → saída. Cada válvula: nome, estado, para onde vai."),
   ...zone(0,90,260,260,"Entrada de água",C.water), ...zone(300,90,320,260,"Bombas & quadro",C.power), ...zone(660,90,260,260,"Filtragem",C.waterL), ...zone(960,90,260,260,"Saída / rede",C.water),
   A(260,220,[[0,0],[40,0]],{strokeColor:C.water, strokeWidth:4}), A(620,220,[[0,0],[40,0]],{strokeColor:C.water, strokeWidth:4}), A(920,220,[[0,0],[40,0]],{strokeColor:C.water, strokeWidth:4}),
   ...zone(0,390,600,220,"Estado atual · o que está feito",C.moss), ...zone(640,390,580,220,"Propostas · o que podemos fazer",C.clay),
   R(0,650,1220,80,{strokeColor:C.straw, backgroundColor:"#fff2bf", fillStyle:"solid", label:{text:"Notas: horários de rega, pressões, quem fecha o quê no inverno…", fontSize:14, fontFamily:2, textAlign:"left", verticalAlign:"top"}}) ] },
 { id:"water", name:"Sistema de água", en:"Water system", elements:[
   ...title("Sistema de água","Origem → bombagem → armazenamento → distribuição → consumos"),
   ...zone(0,90,240,200,"Origem (furos, charcas)",C.water), ...zone(290,90,240,200,"Bombagem",C.power), ...zone(580,90,240,200,"Depósitos",C.water), ...zone(870,90,240,200,"Rede & consumos",C.waterL),
   A(240,190,[[0,0],[50,0]],{strokeColor:C.water, strokeWidth:4}), A(530,190,[[0,0],[50,0]],{strokeColor:C.water, strokeWidth:4}), A(820,190,[[0,0],[50,0]],{strokeColor:C.water, strokeWidth:4}),
   ...zone(0,330,1110,200,"Problemas conhecidos · medições · propostas",C.clay) ] },
 { id:"building", name:"Edifício", en:"Building", elements:[
   ...title("Edifício","Planta esquemática: divisões, entradas de água e luz, estado, obras propostas"),
   R(0,90,720,420,{strokeColor:C.ink, strokeWidth:3}), L(360,90,[[0,0],[0,420]],{strokeColor:C.ink}), L(0,300,[[0,0],[720,0]],{strokeColor:C.ink}),
   Tx(20,100,"Divisão 1",{fontSize:14, textAlign:"left"}), Tx(380,100,"Divisão 2",{fontSize:14, textAlign:"left"}), Tx(20,310,"Divisão 3",{fontSize:14, textAlign:"left"}), Tx(380,310,"Divisão 4",{fontSize:14, textAlign:"left"}),
   ...zone(760,90,420,200,"Estado · licenciamento",C.moss), ...zone(760,310,420,200,"Obras propostas",C.clay) ] },
 { id:"paddock", name:"Parque de pasto", en:"Grazing paddock", elements:[
   ...title("Parque de pasto","Limites, portões, água, sombra, rotação"),
   R(0,90,900,420,{strokeColor:C.earth, strokeWidth:3, backgroundColor:"#eef3e4", fillStyle:"solid", roundness:{type:3}}),
   Tx(20,100,"Portões · pontos de água · sombra: arrasta os símbolos da biblioteca",{fontSize:13, textAlign:"left", strokeColor:C.grey}),
   ...zone(940,90,300,200,"Animais · rotação",C.moss), ...zone(940,310,300,200,"A fazer",C.clay) ] },
];
fs.writeFileSync("vendor/excalidraw/edenrise-templates.json", JSON.stringify({ version:1, templates:TEMPLATES }));
console.log("library", SYMBOLS.length, "symbols ·", TEMPLATES.length, "templates");
