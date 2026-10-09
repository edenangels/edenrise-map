#!/usr/bin/env python3
"""data/edenrise.gpkg → webmap/data.js, reproducibly. Same shape the map has always had (name, status, year, system,
category, alternative, spec, cadastral_article, areas_doc_m2, notes_text, site; m for lines, m2 for areas; Multi*
geometries in EPSG:4326 at 6 decimals) plus the permanent `uid` every base feature now carries.
Run with the ops venv:  ~/edenrise-ops-gis/.venv/bin/python webmap/export-data.py"""
import sqlite3, json, os, struct
from shapely import wkb
from shapely.ops import transform
from pyproj import Transformer
HERE=os.path.dirname(os.path.abspath(__file__)); GPKG=os.path.join(HERE,"..","data","edenrise.gpkg"); OUT=os.path.join(HERE,"data.js")
KEEP=["fid","name","status","year","system","category","alternative","spec","cadastral_article","areas_doc_m2","notes_text","site","uid"]
to4326=Transformer.from_crs(3763,4326,always_xy=True).transform
def gpkg_geom(blob):
    # GeoPackage binary header: magic 'GP', version, flags, srs_id, envelope → then WKB
    flags=blob[3]; env=(flags>>1)&7; envlen={0:0,1:32,2:48,3:48,4:64}[env]
    return wkb.loads(bytes(blob[8+envlen:]))
def multi(g):
    t=g.geom_type
    if t=="Point": return {"type":"MultiPoint","coordinates":[list(g.coords[0])]}
    if t=="LineString": return {"type":"MultiLineString","coordinates":[list(map(list,g.coords))]}
    if t=="Polygon": return {"type":"MultiPolygon","coordinates":[[list(map(list,r.coords)) for r in [g.exterior,*g.interiors]]]}
    return json.loads(json.dumps(g.__geo_interface__))
def rnd(c):
    return [rnd(x) for x in c] if isinstance(c,list) and c and isinstance(c[0],(list,tuple)) else [round(float(v),6) for v in c[:2]]
con=sqlite3.connect(GPKG); con.row_factory=sqlite3.Row
tables=[r[0] for r in con.execute("select table_name from gpkg_contents where data_type='features' order by table_name")]
out={}; n=0
for t in tables:
    feats=[]
    for r in con.execute(f'select * from "{t}" order by fid'):
        if r["geom"] is None: continue
        g3763=gpkg_geom(r["geom"]); g=transform(to4326,g3763)
        p={k:r[k] for k in KEEP if k in r.keys() and r[k] not in (None,"")}
        if t!="buildings_pt": p.pop("fid",None)   # only buildings need it (footprints point at them)
        if g3763.geom_type.endswith("LineString"): p["m"]=round(g3763.length)
        elif g3763.geom_type.endswith("Polygon"): p["m2"]=round(g3763.area)
        gj=multi(g); gj["coordinates"]=rnd(gj["coordinates"])
        feats.append({"type":"Feature","properties":p,"geometry":gj}); n+=1
    out[t]={"type":"FeatureCollection","features":feats}
open(OUT,"w").write("const DATA = "+json.dumps(out,ensure_ascii=False,separators=(",",":"))+";\n")
print(f"{len(tables)} layers · {n} features → data.js ({os.path.getsize(OUT)//1024} kB)")
