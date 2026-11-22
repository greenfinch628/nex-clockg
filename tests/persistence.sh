#!/usr/bin/env bash
set -euo pipefail
project_dir=$(cd -- "$(dirname -- "$0")/.." && pwd)
test_config=$(mktemp -d /tmp/nex-clockg-persistence.XXXXXX)
export XDG_CONFIG_HOME="$test_config"
export GSETTINGS_SCHEMA_DIR="$project_dir/schemas"
unset GSETTINGS_BACKEND
# Each invocation uses its own GSettings process; the second session also starts
# a new dconf service, proving the values were persisted rather than cached.
dbus-run-session -- bash -c '
    set -euo pipefail
    [[ $(gsettings get org.gnome.shell.extensions.nex-clockg always-on-top) == false ]]
    [[ $(gsettings get org.gnome.shell.extensions.nex-clockg show-second-hand) == true ]]
    gsettings set org.gnome.shell.extensions.nex-clockg show-second-hand false
    gsettings set org.gnome.shell.extensions.nex-clockg always-on-top true
    gsettings set org.gnome.shell.extensions.nex-clockg theme black
    gsettings set org.gnome.shell.extensions.nex-clockg diameter 300
    gsettings set org.gnome.shell.extensions.nex-clockg movement tick
'
dbus-run-session -- bash -c '
    set -euo pipefail
    [[ $(gsettings get org.gnome.shell.extensions.nex-clockg theme) == "'"'"'black'"'"'" ]]
    [[ $(gsettings get org.gnome.shell.extensions.nex-clockg always-on-top) == true ]]
    [[ $(gsettings get org.gnome.shell.extensions.nex-clockg show-second-hand) == false ]]
    [[ $(gsettings get org.gnome.shell.extensions.nex-clockg diameter) == 300 ]]
    [[ $(gsettings get org.gnome.shell.extensions.nex-clockg movement) == "'"'"'tick'"'"'" ]]
'
printf '%s\n' 'PASS: settings survive separate GSettings processes and D-Bus/dconf sessions.'
