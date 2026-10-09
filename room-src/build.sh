#!/bin/bash
# Builds the 3D room island → ../vendor/spark/room3d.js. Run after `npm install` in this folder.
set -euo pipefail; cd "$(dirname "$0")"
OUT=../vendor/spark; mkdir -p $OUT
npx esbuild entry.js --bundle --minify --format=iife --target=es2020 --legal-comments=none --outfile=$OUT/room3d.js
cp node_modules/@sparkjsdev/spark/LICENSE $OUT/LICENSE-spark 2>/dev/null || true; cp node_modules/three/LICENSE $OUT/LICENSE-three
ls -la $OUT | awk '{print $5, $9}'
