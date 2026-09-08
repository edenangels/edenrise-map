#!/usr/bin/env python3
"""Stamp local js/css references with a content hash (?v=) so GitHub Pages caches never serve stale code. Run before every commit."""
import re,hashlib,os,glob
def stamp(html):
    def rep(m):
        f=m.group(2); fp=os.path.join(os.path.dirname(os.path.abspath(__file__)),f)
        if not os.path.exists(fp): return m.group(0)
        return f'{m.group(1)}{f}?v={hashlib.md5(open(fp,"rb").read()).hexdigest()[:8]}{m.group(3)}'
    return re.sub(r'((?:src|href)=")([A-Za-z0-9_\-]+\.(?:js|css))(?:\?v=[0-9a-f]+)?(")', rep, html)
def stamp_list(text):
    # quoted local .js paths (inside edrLoadData([...]) lists and sites.js data entries) get the same ?v= hash
    def rep(m):
        f=m.group(1); fp=os.path.join(os.path.dirname(os.path.abspath(__file__)),f)
        if not os.path.exists(fp): return m.group(0)
        return f'"{f}?v={hashlib.md5(open(fp,"rb").read()).hexdigest()[:8]}"'
    return re.sub(r'"((?:sites/[A-Za-z0-9_\-/]+|[A-Za-z0-9_\-]+)\.js)(?:\?v=[0-9a-f]+)?"', rep, text)
def stamp_sites(text):
    # sites.js: stamp only path VALUES (sites/…/x.js and core:"data.js"); the file-name keys of data.files must stay bare
    return re.sub(r'(core:|f:|:)"((?:sites/[A-Za-z0-9_\-/]+\.js)|data\.js)(?:\?v=[0-9a-f]+)?"', lambda m: m.group(1)+stamp_list('"'+m.group(2)+'"'), text)
HERE=os.path.dirname(os.path.abspath(__file__))
for page in glob.glob(os.path.join(HERE,"*.html")):
    h=open(page).read(); n=stamp(h)
    n=re.sub(r'edrLoadData\((\[[^\]]*\])\)', lambda m: "edrLoadData("+stamp_list(m.group(1))+")", n)
    if n!=h: open(page,"w").write(n); print("stamped", os.path.basename(page))
sj=os.path.join(HERE,"sites.js")
if os.path.exists(sj):
    h=open(sj).read(); n=stamp_sites(h)
    if n!=h: open(sj,"w").write(n); print("stamped sites.js")
