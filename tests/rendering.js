import Cairo from 'cairo';
import GLib from 'gi://GLib';
import {drawClock} from '../lib/clockRenderer.js';

const directory = GLib.dir_make_tmp('nex-clockg-render.XXXXXX');
try {
    for (const theme of ['white', 'black']) {
        for (const showSecondHand of [true, false]) {
            const path = `${directory}/${theme}-${showSecondHand}.png`;
            try {
                const surface = new Cairo.ImageSurface(Cairo.Format.ARGB32, 200, 200);
                const cr = new Cairo.Context(surface);
                let red = 0;
                let rotations = 0;
                const context = new Proxy(cr, {get(target, key) {
                    const value = target[key];
                    if (key === 'setSourceRGB') return (r, g, b) => {
                        if (r > g * 2 && r > b * 2) red++;
                        value.call(target, r, g, b);
                    };
                    if (key === 'rotate') return angle => { rotations++; value.call(target, angle); };
                    return typeof value === 'function' ? value.bind(target) : value;
                }});
                try {
                    const date = new Date(2026, 0, 1, 10, 9, 36, 500);
                    if (!showSecondHand) {
                        date.getSeconds = () => { throw new Error('Hidden seconds read during rendering'); };
                        date.getMilliseconds = () => { throw new Error('Hidden milliseconds read during rendering'); };
                    }
                    drawClock(context, 200, 200, {theme, showSecondHand, movement: 'smooth',
                        numerals: 'all', minuteMarkers: true}, date);
                    surface.writeToPNG(path);
                } finally {
                    cr.$dispose();
                }
                if (rotations !== (showSecondHand ? 3 : 2) || (showSecondHand ? red !== 2 : red !== 0))
                    throw new Error(`Unexpected hands: ${theme}, hand=${showSecondHand}, rotations=${rotations}, red=${red}`);
            } finally {
                GLib.unlink(path);
            }
        }
    }
} finally {
    GLib.rmdir(directory);
}
print('PASS: both themes render the red second hand only when enabled; no hidden seconds reads.');
