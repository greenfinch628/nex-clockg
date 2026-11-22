#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")/.."
glib-compile-schemas --strict schemas
for file in extension.js prefs.js lib/*.js; do node --input-type=module --check < "$file"; done
gjs -m tests/core.js
gjs -m tests/rendering.js
gjs -m tools/render.js docs/screenshots
bash scripts/package.sh
