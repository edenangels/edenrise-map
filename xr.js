// EdenRise map — WebXR world tracking for the camera view (Android Chrome; iPhone Safari has no WebXR AR).
//
// Without it the camera view leans on compass + GPS and every label wobbles with them. With it the browser runs ARCore's
// visual-inertial tracking: the phone knows its own motion at 60 Hz to centimetres over tens of metres, so labels stay
// nailed to real places while you walk, and "Marcar" hits the real ground plane the camera sees instead of a model of it.
//
// The XR world starts with an arbitrary yaw and origin. We align it to the estate the same way the native app does:
//   p_xr = T + Ry(ψ)·(e, u, −n)      — ENU of a fixed origin (first GPS fix) into XR space
// ψ comes from the compass (heading vs the camera's XR azimuth) and, better, from walking: the bearing between two GPS
// fixes vs the XR displacement between them. T is re-estimated on each GPS fix against the XR camera position, weighted
// by accuracy — the GPS re-anchors, the tracking carries the motion in between.
(function(){
const X = {session:null, ref:null, viewer:null, hits:null, active:false, pose:null, proj:null, viewInv:null, hit:null,
  origin:null, originZ:0, yaw:0, yawW:0, T:[0,0,0], TW:0, aligned:false, lastFix:null, lastCam:null, src:null, gl:null, onEnd:null};
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI, wrap = a => ((a + 540) % 360) - 180;
function scale(lat){ return {kx:111320 * Math.cos(rad(lat)), ky:110540}; }
function toENU(o, p){ const {kx, ky} = scale(o[0]); return {e:(p[1] - o[1]) * kx, n:(p[0] - o[0]) * ky}; }
function fromENU(o, e, n){ const {kx, ky} = scale(o[0]); return [o[0] + n / ky, o[1] + e / kx]; }
async function supported(){ try{ return !!(navigator.xr && await navigator.xr.isSessionSupported("immersive-ar")); }catch(e){ return false; } }

/* ---------- session ---------- */
async function start(overlayRoot, src){
  // src: {fix:()=>({pos:[lat,lon],acc}), heading:()=>deg|null, elev:async ll=>z|null, onEnd:fn}
  X.src = src; X.onEnd = src.onEnd;
  const cv = document.createElement("canvas"); X.gl = cv.getContext("webgl", {xrCompatible:true, alpha:true});
  X.session = await navigator.xr.requestSession("immersive-ar", {requiredFeatures:["local-floor", "hit-test"], optionalFeatures:["dom-overlay"], domOverlay:{root:overlayRoot}});
  await X.gl.makeXRCompatible();
  X.session.updateRenderState({baseLayer:new XRWebGLLayer(X.session, X.gl)});
  X.ref = await X.session.requestReferenceSpace("local-floor"); X.viewer = await X.session.requestReferenceSpace("viewer");
  try{ X.hits = await X.session.requestHitTestSource({space:X.viewer}); }catch(e){ X.hits = null; }
  X.session.addEventListener("end", () => { X.active = false; X.session = null; X.aligned = false; X.TW = 0; X.yawW = 0; X.onEnd && X.onEnd(); });
  X.active = true; X.session.requestAnimationFrame(frame); return true;
}
function stop(){ try{ X.session && X.session.end(); }catch(e){} }
function frame(t, f){
  if(!X.session) return; X.session.requestAnimationFrame(frame);
  const pose = f.getViewerPose(X.ref); if(!pose) return;
  const layer = X.session.renderState.baseLayer; const gl = X.gl;
  gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  const v = pose.views[0]; X.pose = pose.transform.matrix; X.proj = v.projectionMatrix; X.viewInv = v.transform.inverse.matrix;
  if(X.hits){ const r = f.getHitTestResults(X.hits); X.hit = r.length ? r[0].getPose(X.ref).transform.position : null; }
  align();
}

/* ---------- alignment ---------- */
const camPos = () => X.pose ? [X.pose[12], X.pose[13], X.pose[14]] : null;
const camFwd = () => X.pose ? [-X.pose[8], -X.pose[9], -X.pose[10]] : null;   // −Z column of the camera pose
function azOf(vx, vz){ const h = Math.hypot(vx, vz); return h < 0.2 ? null : (deg(Math.atan2(vx, -vz)) + 360) % 360; }
function align(){
  const f = X.src.fix(); const c = camPos(); if(!f || !f.pos || !c) return;
  if(!X.origin){ X.origin = f.pos; X.src.elev({lat:f.pos[0], lng:f.pos[1]}).then(z => { X.originZ = z == null ? 0 : z; }); }
  // ψ from the compass (only when the phone is roughly level: the azimuth of a downward camera is meaningless)
  const h = X.src.heading(); const fw = camFwd(); const az = fw && azOf(fw[0], fw[2]);
  if(h != null && az != null && Math.abs(fw[1]) < 0.7){ const psi = wrap(h - az); const w = 0.1;
    if(X.yawW === 0){ X.yaw = psi; X.yawW = w; } else { const g = Math.min(0.05, w / (X.yawW + w)); X.yaw = wrap(X.yaw + g * wrap(psi - X.yaw)); X.yawW = Math.min(X.yawW + w, 40); } }
  // ψ from walking: GPS course vs XR displacement (much better than a compass once you have moved a few metres)
  if(X.lastFix && X.lastCam && f.at !== X.lastFix.at){
    const d = toENU(X.lastFix.pos, f.pos); const dg = Math.hypot(d.e, d.n); const dx = c[0] - X.lastCam[0], dz = c[2] - X.lastCam[2]; const dxr = Math.hypot(dx, dz);
    if(dg > Math.max(4, 1.5 * (f.acc + X.lastFix.acc)) && dxr > 3){ const bg = (deg(Math.atan2(d.e, d.n)) + 360) % 360; const bx = azOf(dx, dz);
      if(bx != null){ const psi = wrap(bg - bx); const w = Math.min(10, dg / (f.acc + X.lastFix.acc + 0.5)); const g = Math.min(0.6, w / (X.yawW + w)); X.yaw = X.yawW ? wrap(X.yaw + g * wrap(psi - X.yaw)) : psi; X.yawW = Math.min(X.yawW + w, 60); }
      X.lastFix = {pos:f.pos, acc:f.acc, at:f.at}; X.lastCam = c; }
  } else if(!X.lastFix || f.at !== X.lastFix.at){ if(!X.lastFix || !X.lastCam){ X.lastFix = {pos:f.pos, acc:f.acc, at:f.at}; X.lastCam = c; } }
  // T from this fix vs the camera (eye 1.55 m above the ground at the fix)
  if(X.yawW === 0 || !f.at || (X.lastT && X.lastT === f.at)) return; X.lastT = f.at;
  const p = toENU(X.origin, f.pos); const cs = Math.cos(rad(X.yaw)), sn = Math.sin(rad(X.yaw)); const x = p.e, z = -p.n;
  X.src.elev({lat:f.pos[0], lng:f.pos[1]}).then(zg => {
    const u = (zg == null ? 0 : zg - X.originZ) + 1.55;
    const tx = c[0] - (x * cs + z * sn), ty = c[1] - u, tz = c[2] - (-x * sn + z * cs); const w = 1 / (f.acc * f.acc);
    if(X.TW === 0){ X.T = [tx, ty, tz]; X.TW = w; } else { const g = Math.min(0.5, w / (X.TW + w)); X.T = [X.T[0] + g * (tx - X.T[0]), X.T[1] + g * (ty - X.T[1]), X.T[2] + g * (tz - X.T[2])]; X.TW = Math.min(X.TW * 0.9 + w, 1e4); }
    X.aligned = true; });
}
function toXR(e, n, u){ const c = Math.cos(rad(X.yaw)), s = Math.sin(rad(X.yaw)); const x = e, z = -n; return [X.T[0] + x * c + z * s, X.T[1] + u, X.T[2] - x * s + z * c]; }
function fromXR(v){ const c = Math.cos(rad(X.yaw)), s = Math.sin(rad(X.yaw)); const x = v[0] - X.T[0], z = v[2] - X.T[2]; return {e:x * c - z * s, u:v[1] - X.T[1], n:-(x * s + z * c)}; }
function mulv(m, v){ return [m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12], m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13], m[2]*v[0]+m[6]*v[1]+m[10]*v[2]+m[14], m[3]*v[0]+m[7]*v[1]+m[11]*v[2]+m[15]]; }

/* ---------- what ar.js asks ---------- */
/** screen position of a lon/lat at absolute height z (m), or null when off-screen / behind */
function project(ll, z, W, H){
  if(!X.aligned || !X.proj || !X.viewInv) return null;
  const p = toENU(X.origin, ll); const v = toXR(p.e, p.n, z - X.originZ);
  const eye = mulv(X.viewInv, v); const clip = mulv(X.proj, [eye[0], eye[1], eye[2], 1]); if(clip[3] <= 0.01) return null;
  const nx = clip[0] / clip[3], ny = clip[1] / clip[3]; if(Math.abs(nx) > 1.3 || Math.abs(ny) > 1.3) return null;
  return {x:(nx + 1) / 2 * W, y:(1 - ny) / 2 * H, d:Math.hypot(eye[0], eye[1], eye[2])};
}
/** where I am, carried by the tracking between fixes */
function here(){ const c = camPos(); if(!X.aligned || !c) return null; const e = fromXR(c); return fromENU(X.origin, e.e, e.n); }
function heading(){ const f = camFwd(); if(!f) return null; const az = azOf(f[0], f[2]); return az == null ? null : (az + X.yaw + 360) % 360; }
function pitch(){ const f = camFwd(); return f ? deg(Math.asin(Math.max(-1, Math.min(1, f[1])))) : 0; }
/** the ground point under the reticle: ARCore's hit test on the real surface, else the DTM ray */
async function hitGround(){
  if(!X.aligned) return null; const c = camPos();
  if(X.hit){ const e = fromXR([X.hit.x, X.hit.y, X.hit.z]); const ce = fromXR(c); return {ll:fromENU(X.origin, e.e, e.n), d:Math.hypot(e.e - ce.e, e.n - ce.n), real:true}; }
  const f = camFwd(); const eye = fromXR(c); const fe = fromXR([c[0] + f[0], c[1] + f[1], c[2] + f[2]]); const dir = {e:fe.e - eye.e, n:fe.n - eye.n, u:fe.u - eye.u}; if(dir.u > -0.03) return null;
  for(let s = 1; s <= 250; s += 1){ const ll = fromENU(X.origin, eye.e + dir.e * s, eye.n + dir.n * s); const z = await X.src.elev({lat:ll[0], lng:ll[1]}); if(z == null) return null; if(X.originZ + eye.u + dir.u * s <= z) return {ll, d:s, real:false}; }
  return null;
}
window.edrXR = {supported, start, stop, project, here, heading, pitch, hitGround, state:X, get active(){ return X.active; }, _sim:(o) => Object.assign(X, o), _align:align};
})();
