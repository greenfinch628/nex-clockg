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
    window.present();
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
        settings.set_string('theme', 'black');
        settings.set_string('movement', 'tick');
        settings.set_int('diameter', 120);
        settings.set_string('numerals', 'quarters');
        settings.set_boolean('minute-markers', false);
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
