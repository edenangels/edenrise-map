#!/bin/bash
# Builds the board island → ../vendor/excalidraw/board.js (+ fonts). Run after `npm install` in this folder.
set -euo pipefail; cd "$(dirname "$0")"
OUT=../vendor/excalidraw
npx esbuild entry.jsx --bundle --minify --format=iife --target=es2020 --jsx=automatic --conditions=production --external:@excalidraw/mermaid-to-excalidraw --loader:.woff2=file --loader:.woff=file --loader:.ttf=file \
  --define:process.env.NODE_ENV=\"production\" --define:process.env.IS_PREACT=\"false\" --outfile=$OUT/board.js --asset-names=fonts/[name] --public-path=.
rm -rf $OUT/fonts && mkdir -p $OUT/fonts && cp -R node_modules/@excalidraw/excalidraw/dist/prod/fonts/. $OUT/fonts/ 2>/dev/null || true
ls -la $OUT | awk '{print $5, $9}'; du -sh $OUT/fonts | cut -f1
