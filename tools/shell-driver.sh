#!/usr/bin/env bash
set -euo pipefail
uuid=nex-clockg@greenfinch628.github.io
export GSETTINGS_SCHEMA_DIR="$XDG_DATA_HOME/gnome-shell/extensions/$uuid/schemas"
helper="$XDG_DATA_HOME/gnome-shell/extensions/clock-test@local"
mkdir -p "$helper"
cat > "$helper/metadata.json" <<'JSON'
{"uuid":"clock-test@local","name":"Isolated test helper","description":"Temporary test instrumentation","shell-version":["50"]}
JSON
cat > "$helper/extension.js" <<'JS'
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
export default class Helper extends Extension {
    enable() { global.context.unsafe_mode = true; }
    disable() { global.context.unsafe_mode = false; }
}
JS
gsettings set org.gnome.shell enabled-extensions "['clock-test@local', '$uuid']"
gsettings set org.gnome.shell welcome-dialog-last-shown-version '50.6'
gnome-shell --headless --virtual-monitor 1280x800 --no-x11 > "$CLOCK_TEST_ROOT/shell.log" 2>&1 &
shell_pid=$!
trap 'kill "$shell_pid" 2>/dev/null || true' EXIT
for attempt in $(seq 1 60); do
    result=$(gdbus call --timeout 2 --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval 'global.context.unsafe_mode' 2>/dev/null || true)
    if [[ "$result" == "(true, 'true')" ]]; then break; fi
    sleep 0.5
done
python3 "$(dirname -- "$0")/shell-check.py"
export WAYLAND_DISPLAY=wayland-0
GTK_A11Y=none G_DEBUG=fatal-warnings gjs -m "$(dirname -- "$0")/../tests/preferences.js"
if rg -n 'JS ERROR|JS CRITICAL|Object .* has been already disposed|Source ID .* not found' "$CLOCK_TEST_ROOT/shell.log"; then
    exit 1
fi
printf '%s\n' "PASS: no GJS lifecycle or rendering errors. Logs: $CLOCK_TEST_ROOT"
