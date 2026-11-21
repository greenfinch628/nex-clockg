#!/usr/bin/env bash
set -euo pipefail
source_dir=$(cd -- "$(dirname -- "$0")/.." && pwd)
test_root=$(mktemp -d /tmp/nex-clockg-shell.XXXXXX)
printf '%s\n' "$test_root"
export XDG_DATA_HOME="$test_root/data"
export XDG_CONFIG_HOME="$test_root/config"
export XDG_CACHE_HOME="$test_root/cache"
export XDG_STATE_HOME="$test_root/state"
export XDG_RUNTIME_DIR="$test_root/runtime"
export LIBGL_ALWAYS_SOFTWARE=1
mkdir -p "$XDG_RUNTIME_DIR" "$XDG_DATA_HOME/gnome-shell/extensions"
chmod 700 "$XDG_RUNTIME_DIR"
cp -a "$source_dir" "$XDG_DATA_HOME/gnome-shell/extensions/nex-clockg@greenfinch628.github.io"
export CLOCK_TEST_ROOT="$test_root"
exec dbus-run-session -- bash "$source_dir/tools/shell-driver.sh"
