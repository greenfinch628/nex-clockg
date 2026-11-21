#!/usr/bin/env bash
set -euo pipefail
project_dir=$(cd -- "$(dirname -- "$0")/.." && pwd)
output_dir=${1:-"$project_dir/dist"}
mkdir -p "$output_dir"
output_dir=$(cd -- "$output_dir" && pwd)
stage_dir=$(mktemp -d /tmp/nex-clockg-package.XXXXXX)
trap 'rm -rf -- "$stage_dir"' EXIT
cp "$project_dir/extension.js" "$project_dir/prefs.js" "$project_dir/metadata.json" "$project_dir/stylesheet.css" "$project_dir/LICENSE" "$stage_dir/"
cp -a "$project_dir/lib" "$project_dir/schemas" "$stage_dir/"
glib-compile-schemas --strict "$stage_dir/schemas"
python3 - "$stage_dir" "$output_dir/nex-clockg@greenfinch628.github.io.shell-extension.zip" <<'PY'
import pathlib, sys, zipfile
root, output = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(root.rglob('*')):
        if path.is_file():
            entry = zipfile.ZipInfo(str(path.relative_to(root)), (2026, 11, 21, 0, 0, 0))
            entry.external_attr = 0o100644 << 16
            archive.writestr(entry, path.read_bytes(), compress_type=zipfile.ZIP_DEFLATED)
print(output)
PY
