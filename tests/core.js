import {handAngles} from '../lib/clockRenderer.js';
import {nextDelay} from '../lib/timing.js';
function assert(ok, message) { if (!ok) throw new Error(message); }
const tau = Math.PI * 2;
let a = handAngles(new Date(2026, 0, 1, 3, 15, 30, 500));
assert(Math.abs(a[2] - 30.5 * tau / 60) < 1e-10, 'Fractional seconds');
assert(Math.abs(a[1] - (15 + 30.5 / 60) * tau / 60) < 1e-10, 'Minute interpolation');
a = handAngles(new Date(2026, 0, 1, 12, 0, 0, 999), false);
assert(a.every(v => v === 0), 'Tick mode freezes within second');
assert(nextDelay(1999, 'tick') === 1, 'Next second boundary');
assert(nextDelay(2000, 'tick') === 1000, 'Exact second boundary');
for (const time of [1234567890123, 17, 999, 0, -1]) {
    const delay = nextDelay(time, 'tick');
    assert((time + delay) % 1000 === 0, 'Tick alignment after wall clock changes');
    assert(nextDelay(time, 'smooth') >= 1 && nextDelay(time, 'smooth') <= 34, 'Smooth cadence');
}
print('PASS: hand interpolation, tick alignment, wall-clock jumps, smooth cadence.');

// A hidden second hand must not even read seconds or milliseconds.
const minuteOnly = {
    getHours: () => 3, getMinutes: () => 15,
    getSeconds: () => { throw new Error('Hidden seconds calculated'); },
    getMilliseconds: () => { throw new Error('Hidden fractional seconds calculated'); },
};
a = handAngles(minuteOnly, true, false);
assert(a.length === 2, 'Only hour/minute angles when hidden');
assert(Math.abs(a[0] - 3.25 * tau / 12) < 1e-10, 'Minute-only hour interpolation');
assert(Math.abs(a[1] - 15 * tau / 60) < 1e-10, 'Minute-only minute angle');
for (const now of [0, 59999, 60000, 60001, 1234567890123, -1]) {
    for (const mode of ['tick', 'smooth']) {
        const delay = nextDelay(now, mode, 30, false);
        assert(delay >= 1 && delay <= 60000, 'Minute-only timeout range');
        assert((now + delay) % 60000 === 0, 'Minute-only boundary alignment');
    }
}
assert(handAngles(new Date(2026, 0, 1, 3, 16), true, false)[1] > a[1],
    'Minute hand advances without second hand');
print('PASS: hidden hand skips seconds calculations; hour/minute advance; minute deadlines.');
