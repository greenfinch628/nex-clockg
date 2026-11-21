#!/usr/bin/env bash
set -euo pipefail
project_dir=$(cd -- "$(dirname -- "$0")/.." && pwd)
uuid=nex-clockg@greenfinch628.github.io
extensions_dir="${XDG_DATA_HOME:-$HOME/.local/share}/gnome-shell/extensions"
target="$extensions_dir/$uuid"
bash "$project_dir/scripts/package.sh"
mkdir -p "$extensions_dir"
stage_dir=$(mktemp -d "$extensions_dir/.nex-clockg-install.XXXXXX")
trap 'rm -rf -- "$stage_dir"' EXIT
python3 - "$project_dir/dist/$uuid.shell-extension.zip" "$stage_dir" <<'PY'
import sys, zipfile
with zipfile.ZipFile(sys.argv[1]) as archive:
    archive.extractall(sys.argv[2])
PY
if [[ -e "$target" || -L "$target" ]]; then
    # Updates are recoverable, and only this extension's UUID is replaced.
    backup_dir="${XDG_DATA_HOME:-$HOME/.local/share}/nex-clockg/backups"
    mkdir -p "$backup_dir"
    backup=$(mktemp -d "$backup_dir/previous.XXXXXX")
    mv -- "$target" "$backup/$uuid"
    printf 'Previous installation saved at %s\n' "$backup/$uuid"
fi
mv -- "$stage_dir" "$target"
trap - EXIT
printf 'Installed %s\nLog out and back in, then run:\n  gnome-extensions enable %s\n  gnome-extensions prefs %s\n' "$target" "$uuid" "$uuid"
