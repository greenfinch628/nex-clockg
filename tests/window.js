import Gtk from 'gi://Gtk?version=4.0';
const app = new Gtk.Application({application_id: 'io.github.greenfinch628.StackingTest'});
app.connect('activate', () => {
    const window = new Gtk.ApplicationWindow({application: app, title: 'Clock stacking test',
        default_width: 1000, default_height: 700});
    window.present();
});
app.run([]);
