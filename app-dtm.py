#!/usr/bin/env python3
"""LiDAR ground grid for the field app: samples the terrain-RGB tiles (z16) on an 8 m grid over the estate (+200 m),
writes app-dtm.json = {lon0, lat0, dx, dy, cols, rows, scale, nodata, data(base64 int16, decimetres)}.
The app reads heights fully offline from this (eye height, label elevation angles, point-to-mark ray casting)."""
import json, math, base64, struct, os
from PIL import Image
W,S,E,N = -8.656285,37.501572,-8.63293,37.521766
PAD=200; STEP=8.0; Z=16
kx=111320*math.cos(math.radians((S+N)/2)); ky=110540
lon0=W-PAD/kx; lat0=S-PAD/ky; cols=int(((E-W)*kx+2*PAD)/STEP)+1; rows=int(((N-S)*ky+2*PAD)/STEP)+1
cache={}
def tile(x,y):
    k=(x,y)
    if k not in cache:
        p=f"terrain/{Z}/{x}/{y}.png"; cache[k]=Image.open(p).convert("RGB").load() if os.path.exists(p) else None
    return cache[k]
def elev(lon,lat):
    n=2**Z; xf=(lon+180)/360*n; lr=math.radians(lat); yf=(1-math.log(math.tan(lr)+1/math.cos(lr))/math.pi)/2*n
    px=tile(int(xf),int(yf))
    if px is None: return None
    r,g,b=px[int((xf%1)*256),int((yf%1)*256)]; return -10000+(r*65536+g*256+b)*0.1
vals=[]; miss=0
for j in range(rows):
    lat=lat0+j*STEP/ky
    for i in range(cols):
        z=elev(lon0+i*STEP/kx,lat)
        if z is None: miss+=1; vals.append(-32768)
        else: vals.append(max(-32767,min(32767,int(round(z*10)))))
buf=struct.pack("<%dh"%len(vals),*vals)
json.dump({"lon0":lon0,"lat0":lat0,"dx":STEP/kx,"dy":STEP/ky,"step_m":STEP,"cols":cols,"rows":rows,"scale":0.1,"nodata":-32768,"data":base64.b64encode(buf).decode()},open("app-dtm.json","w"))
good=[v for v in vals if v!=-32768]
print("grid",cols,"x",rows,"missing",miss,"min",min(good)/10,"max",max(good)/10,"bytes",os.path.getsize("app-dtm.json"))
