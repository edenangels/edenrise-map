// LandFlow places — the estate's OPERATIONAL locations, published by the crew app.
//
// The GeoPackage knows what the land IS: parcels, buildings, water, power, tracks. It does not know
// where the crew WORKS — "Contentor 8 Direita", the machine yard, the workshop — because those are
// containers and corners that appear on no cadastral map and were, until now, carried in people's
// heads. LandFlow owns them: a manager standing at the place pins it, and the pin is attributed and
// timestamped. This layer is that list, on the map.
//
// ONE WAY, AND ONLY PLACES. LandFlow is the master of these; nothing is written back from here.
// The feed carries a name, a code, a kind and a coordinate — no person, no shift, no presence, no
// ticket, no custody. Crew positions live in LandFlow behind Telegram auth and are never drawn on
// this map, which is public. (This map's own "presence" is a different thing entirely: who is
// LOOKING at the map. The two must never be confused.)
(function () {
  if (typeof SITE_ID !== "undefined" && SITE_ID !== "edenrise") return;   // EdenRise's places only

  var FEED = "https://landflow.edenrise.workers.dev/gis/zones.geojson";
  var EN = (typeof LANG !== "undefined") && LANG === "en";
  var T = EN
    ? { cat: "Crew places", hint: "operational locations from the LandFlow app", none: "no places pinned yet",
        kind: { storage: "storage", building: "building", outdoor: "outdoor" }, pinned: "pinned in the app" }
    : { cat: "Locais da equipa", hint: "locais operacionais vindos da app LandFlow", none: "ainda sem locais marcados",
        kind: { storage: "arrumação", building: "edifício", outdoor: "exterior" }, pinned: "marcado na app" };

  var COL = { storage: "#c9a96a", building: "#8fa983", outdoor: "#6fa3c4" };

  var css = document.createElement("style");
  css.textContent =
    ".lf-pin{width:26px;height:26px;border-radius:7px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.55);" +
    "display:flex;align-items:center;justify-content:center;font:700 10px/1 var(--ui,system-ui);color:#1a1a1a}" +
    ".lf-lab{font:600 11px/1.2 var(--ui,system-ui);color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.9);white-space:nowrap;" +
    "transform:translateX(16px)}";
  document.head.appendChild(css);

  var layer = L.layerGroup();
  var loaded = false;

  function icon(z) {
    var c = COL[z.kind] || "#c9a96a";
    // The code, not the name: two letters read at any zoom, and the name is one tap away.
    return L.divIcon({
      className: "", iconSize: [26, 26], iconAnchor: [13, 13],
      html: '<div class="lf-pin" style="background:' + c + '">' + String(z.code || "").slice(0, 4) + "</div>",
    });
  }

  function draw(fc) {
    layer.clearLayers();
    (fc.features || []).forEach(function (f) {
      var p = f.properties || {}, g = f.geometry || {};
      if (!g.coordinates) return;
      var ll = [g.coordinates[1], g.coordinates[0]];
      L.marker(ll, { icon: icon(p), title: p.name })
        .bindPopup(
          "<b>" + esc(p.name || p.code) + "</b><br>" +
          esc(T.kind[p.kind] || p.kind || "") + " · <code>" + esc(p.code || "") + "</code><br>" +
          '<small style="opacity:.7">' + T.pinned + "</small>"
        )
        .addTo(layer);
      L.marker(ll, {
        interactive: false,
        icon: L.divIcon({ className: "", iconSize: [0, 0], html: '<div class="lf-lab">' + esc(p.name || "") + "</div>" }),
      }).addTo(layer);
    });
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function load() {
    if (loaded) return Promise.resolve();
    loaded = true;
    return fetch(FEED)
      .then(function (r) { return r.ok ? r.json() : { features: [] }; })
      .then(draw)
      // The crew app being unreachable must never break the estate map: the layer stays empty.
      .catch(function () { loaded = false; });
  }

  // The map's own category tree is built at boot from the registry; this layer arrives live, so
  // it appends its own category the way perma.js and edit.js do — same markup, same chevron, same
  // count badge, so it does not read as bolted on.
  function mount(n) {
    var tree = document.getElementById("tree");
    if (!tree || document.getElementById("lfcat")) {
      if (!tree && (n || 0) < 40) setTimeout(function () { mount((n || 0) + 1); }, 200);
      return;
    }
    var cat = document.createElement("div");
    cat.id = "lfcat"; cat.className = "cat";
    cat.innerHTML =
      '<div class="ch"><svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
      '<path d="m9 6 6 6-6 6"/></svg><span class="ico">📍</span><span class="cn">' + T.cat + '</span>' +
      '<span class="cc">0</span><span class="tg"><input type="checkbox" class="gc"><i></i></span></div>' +
      '<label class="lyr" data-k="places"><span class="sw" style="display:inline-block;width:10px;height:10px;' +
      'border-radius:3px;background:#c9a96a"></span><span class="nm">' + T.hint +
      '</span><span class="tg"><input type="checkbox"><i></i></span></label>';
    cat.querySelector(".ch").onclick = function (e) { if (e.target.closest(".tg")) return; cat.classList.toggle("open"); };
    var cc = cat.querySelector(".cc");
    var box = cat.querySelector("label.lyr input");
    box.onchange = function (e) {
      if (e.target.checked) { load().then(function () { layer.addTo(map); }); cc.textContent = "1"; cc.classList.add("on"); }
      else { map.removeLayer(layer); cc.textContent = "0"; cc.classList.remove("on"); }
    };
    cat.querySelector(".gc").onchange = function (e) {
      if (box.checked !== e.target.checked) { box.checked = e.target.checked; box.dispatchEvent(new Event("change")); }
    };
    tree.appendChild(cat);
  }
  mount(0);

  // A deep link straight to the places, so the app's "open the full map" can land on them.
  if (/[#&]lf=1/.test(location.hash)) {
    setTimeout(function () {
    load().then(function () {
      layer.addTo(map);
      var t = document.querySelector("#lfcat label.lyr input");
      if (t) { t.checked = true; var cc = document.querySelector("#lfcat .cc"); if (cc) { cc.textContent = "1"; cc.classList.add("on"); } }
      var cat = document.getElementById("lfcat"); if (cat) cat.classList.add("open");
    });
    }, 600);
  }

  window.edrLandFlow = { layer: layer, load: load, feed: FEED };
})();
