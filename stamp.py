#!/usr/bin/env python3
"""Stamp local js/css references with a content hash (?v=) so GitHub Pages caches never serve stale code. Run before every commit."""
import re,hashlib,os,glob
def stamp(html):
    def rep(m):
        f=m.group(2); fp=os.path.join(os.path.dirname(os.path.abspath(__file__)),f)
        if not os.path.exists(fp): return m.group(0)
        return f'{m.group(1)}{f}?v={hashlib.md5(open(fp,"rb").read()).hexdigest()[:8]}{m.group(3)}'
    return re.sub(r'((?:src|href)=")([A-Za-z0-9_\-]+\.(?:js|css))(?:\?v=[0-9a-f]+)?(")', rep, html)
for page in glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)),"*.html")):
    h=open(page).read(); n=stamp(h)
    if n!=h: open(page,"w").write(n); print("stamped", os.path.basename(page))
