import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk?version=4.0';

export function buildPreferences(window, settings) {
    const page = new Adw.PreferencesPage({title: 'Clock', icon_name: 'preferences-system-time-symbolic'});
    window.add(page);
    const appearance = new Adw.PreferencesGroup({title: 'Appearance'});
    page.add(appearance);
    const diameter = new Adw.SpinRow({title: 'Clock diameter', subtitle: 'Logical pixels',
        adjustment: new Gtk.Adjustment({lower: 120, upper: 400, step_increment: 10, page_increment: 40})});
    appearance.add(diameter);
    settings.bind('diameter', diameter, 'value', Gio.SettingsBindFlags.DEFAULT);
    const signals = [];
    function choice(group, key, title, values, labels) {
        const row = new Adw.ComboRow({title, model: Gtk.StringList.new(labels)});
        row.selected = Math.max(0, values.indexOf(settings.get_string(key)));
        row.connect('notify::selected', () => settings.set_string(key, values[row.selected]));
        signals.push(settings.connect(`changed::${key}`, () => {
            row.selected = Math.max(0, values.indexOf(settings.get_string(key)));
        }));
        group.add(row);
        return row;
    }
    choice(appearance, 'theme', 'Clock face', ['white', 'black'], ['White', 'Black']);
    choice(appearance, 'numerals', 'Numerals', ['all', 'quarters'], ['All 12', '12, 3, 6 and 9']);
    const markers = new Adw.SwitchRow({title: 'Minute markers'});
    appearance.add(markers);
    settings.bind('minute-markers', markers, 'active', Gio.SettingsBindFlags.DEFAULT);
    const placement = new Adw.PreferencesGroup({title: 'Desktop position',
        description: 'Choose a corner of the primary monitor and padding from its edges.'});
    page.add(placement);
    const onTop = new Adw.SwitchRow({title: 'Always on Top',
        subtitle: 'Keep the clock visible above application windows.'});
    placement.add(onTop);
    settings.bind('always-on-top', onTop, 'active', Gio.SettingsBindFlags.DEFAULT);
    choice(placement, 'corner', 'Location',
        ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        ['Top Left', 'Top Right', 'Bottom Left', 'Bottom Right']);
    const paddingRows = [];
    for (const [key, title] of [['horizontal-offset', 'Distance from right edge'],
        ['vertical-offset', 'Distance from top edge']]) {
        const row = new Adw.SpinRow({title, subtitle: 'Logical pixels',
            adjustment: new Gtk.Adjustment({lower: 0, upper: 4000, step_increment: 10, page_increment: 100})});
        placement.add(row);
        settings.bind(key, row, 'value', Gio.SettingsBindFlags.DEFAULT);
        paddingRows.push(row);
    }
    const updatePaddingLabels = () => {
        const corner = settings.get_string('corner');
        paddingRows[0].title = corner.endsWith('left') ? 'Distance from left edge' : 'Distance from right edge';
        paddingRows[1].title = corner.startsWith('top') ? 'Distance from top edge' : 'Distance from bottom edge';
    };
    signals.push(settings.connect('changed::corner', updatePaddingLabels));
    updatePaddingLabels();
    const animation = new Adw.PreferencesGroup({title: 'Seconds hand'});
    page.add(animation);
    choice(animation, 'movement', 'Movement', ['smooth', 'tick'], ['Smooth sweep', 'Tick']);
    const rate = new Adw.SpinRow({title: 'Smooth refresh rate', subtitle: '15–30 frames per second',
        adjustment: new Gtk.Adjustment({lower: 15, upper: 30, step_increment: 1, page_increment: 5})});
    animation.add(rate);
    settings.bind('refresh-rate', rate, 'value', Gio.SettingsBindFlags.DEFAULT);
    const update = () => { rate.sensitive = settings.get_string('movement') === 'smooth'; };
    signals.push(settings.connect('changed::movement', update));
    update();
    window.connect('close-request', () => {
        for (const id of signals)
            settings.disconnect(id);
        return false;
    });
}

