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
