import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import St from 'gi://St';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {drawClock} from './lib/clockRenderer.js';
import {nextDelay} from './lib/timing.js';
import {clockPosition} from './lib/placement.js';

export default class NexClock extends Extension {
    enable() {
        this._signals = [];
        this._timer = 0;
        try {
            this._settings = this.getSettings();
            this._actor = new St.DrawingArea({style_class: 'nex-clockg', reactive: false,
                accessible_name: 'Analog clock'});
            this._connect(this._actor, 'destroy', () => {
                this._actor = null;
                this.disable();
            });
            this._connect(this._actor, 'repaint', area => {
                const cr = area.get_context();
                try {
                    const [width, height] = area.get_surface_size();
                    drawClock(cr, width, height, this._options);
                } finally {
                    cr.$dispose();
                }
            });
            this._connect(this._settings, 'changed', () => this._configure());
            this._connect(Main.layoutManager, 'monitors-changed', () => this._position());
            this._connect(global.display, 'workareas-changed', () => this._position());
            this._connect(Main.overview, 'showing', () => this._visibility());
            this._connect(Main.overview, 'hidden', () => this._visibility());
            this._connect(Main.sessionMode, 'updated', () => this._visibility());
            this._connect(this._actor, 'notify::mapped', () => this._restart());
            this._configure();
        } catch (error) {
            this.disable();
            throw error;
        }
    }

    _connect(object, signal, callback) {
        this._signals.push([object, object.connect(signal, callback)]);
    }

    _configure() {
        this._options = {
            theme: this._settings.get_string('theme'),
            movement: this._settings.get_string('movement'),
            showSecondHand: this._settings.get_boolean('show-second-hand'),
            numerals: this._settings.get_string('numerals'),
            minuteMarkers: this._settings.get_boolean('minute-markers'),
        };
        const size = this._settings.get_int('diameter');
        this._actor.set_size(size, size);
        this._stack();
        this._position();
        this._visibility();
        this._restart();
    }

    _stack() {
        const onTop = this._settings.get_boolean('always-on-top');
        // Mutter restacks direct window_group children when windows move/raise.
        // Nest the desktop clock inside the stable background group instead.
        // Shell inserts replacement wallpaper actors at the bottom of this group.
        const background = global.window_group.get_children().find(a => a instanceof Meta.BackgroundGroup);
        if (!onTop && !background)
            throw new Error('nex-clockg: desktop background group is unavailable');
        const parent = onTop ? Main.layoutManager.uiGroup : background;
        if (this._actor.get_parent() === parent)
            return;
        this._actor.get_parent()?.remove_child(this._actor);
        if (onTop) {
            // Above normal windows, below Shell chrome and modal/top windows.
            parent.insert_child_above(this._actor, global.window_group);
        } else {
            parent.add_child(this._actor);
        }
    }

    _position() {
        const monitor = Main.layoutManager.primaryIndex;
        if (monitor < 0 || !this._actor)
            return;
        const area = Main.layoutManager.getWorkAreaForMonitor(monitor);
        const size = this._settings.get_int('diameter');
        const x = this._settings.get_int('horizontal-offset');
        const y = this._settings.get_int('vertical-offset');
        this._actor.set_position(...clockPosition(area, size,
            this._settings.get_string('corner'), x, y));
    }

    _visibility() {
        if (!this._actor)
            return;
        this._actor.visible = !Main.overview.visible && !Main.sessionMode.isLocked &&
            !Main.sessionMode.isGreeter;
        this._restart();
    }

    _stop() {
        if (this._timer) {
            GLib.Source.remove(this._timer);
            this._timer = 0;
        }
    }

    _restart() {
        this._stop();
        if (!this._options || !this._actor?.mapped || !this._actor.visible)
            return;
        this._actor.queue_repaint();
        this._schedule();
    }

    _schedule() {
        const delay = nextDelay(Date.now(), this._options.movement,
            this._settings.get_int('refresh-rate'), this._options.showSecondHand);
        this._timer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, () => {
            this._timer = 0;
            if (this._actor?.mapped && this._actor.visible) {
                this._actor.queue_repaint();
                // Re-evaluate wall time after every frame, including after resume
                // and clock changes. Never advance an accumulated hand position.
                this._schedule();
            }
            return GLib.SOURCE_REMOVE;
        });
    }

    disable() {
        this._stop();
        for (const [object, id] of this._signals ?? [])
            object.disconnect(id);
        this._signals = [];
        this._actor?.destroy();
        this._actor = null;
        this._settings = null;
        this._options = null;
    }
}
