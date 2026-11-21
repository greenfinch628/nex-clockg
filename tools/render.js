import Cairo from 'cairo';
import GLib from 'gi://GLib';
import {drawClock} from '../lib/clockRenderer.js';
const out = ARGV[0] ?? 'docs/screenshots';
GLib.mkdir_with_parents(out, 0o755);
for (const theme of ['white', 'black']) {
    for (const size of [120, 160, 200, 300, 400]) {
        for (const scale of [1, 2]) {
            const surface = new Cairo.ImageSurface(Cairo.Format.ARGB32, size * scale, size * scale);
            const cr = new Cairo.Context(surface);
            cr.scale(scale, scale);
            drawClock(cr, size, size, {theme, numerals: 'all', minuteMarkers: true, movement: 'smooth'},
                new Date(2026, 0, 1, 10, 9, 36, 500));
            surface.writeToPNG(`${out}/${theme}-${size}@${scale}x.png`);
            cr.$dispose();
        }
    }
}
print('Rendered 20 Cairo previews (both themes, five sizes, 1× and 2×).');
