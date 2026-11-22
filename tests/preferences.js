import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {buildPreferences} from '../lib/preferences.js';
Adw.init();
const settings = new Gio.Settings({schema_id: 'org.gnome.shell.extensions.nex-clockg'});
const app = new Adw.Application({application_id: 'io.github.greenfinch628.NexClockTest',
    flags: Gio.ApplicationFlags.NON_UNIQUE});
app.connect('activate', () => {
    const window = new Adw.PreferencesWindow({application: app});
    buildPreferences(window, settings);
    function findSwitch(widget) {
        if (widget instanceof Adw.SwitchRow && widget.title === 'Always on Top')
            return widget;
        for (let child = widget.get_first_child(); child; child = child.get_next_sibling()) {
            const found = findSwitch(child);
            if (found) return found;
        }
        return null;
    }
    const onTop = findSwitch(window);
    if (!onTop) throw new Error('Missing Always on Top switch');
    settings.set_boolean('always-on-top', false);
    if (onTop.active) throw new Error('Settings to switch binding failed');
    onTop.active = true;
    if (!settings.get_boolean('always-on-top')) throw new Error('Switch to settings binding failed');
    window.present();
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
        settings.set_string('theme', 'black');
        settings.set_string('movement', 'tick');
        settings.set_int('diameter', 120);
        settings.set_string('numerals', 'quarters');
        settings.set_boolean('minute-markers', false);
        settings.set_boolean('always-on-top', true);
        return GLib.SOURCE_REMOVE;
    });
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
        window.close();
        app.quit();
        return GLib.SOURCE_REMOVE;
    });
});
app.run([]);
print('PASS: GTK4/libadwaita preferences construct, present, update and close.');
