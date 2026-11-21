// Tick deadlines are derived from wall time on every callback, so timer latency
// cannot accumulate. Smooth frames use the same grid at the selected rate.
export function nextDelay(now, movement, fps = 30) {
    const period = movement === 'tick' ? 1000 : 1000 / fps;
    return Math.max(1, Math.ceil(period - ((now % period + period) % period)));
}
