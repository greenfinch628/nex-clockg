import Cairo from 'cairo';

const TAU = 2 * Math.PI;

export function handAngles(date, smooth = true, showSecondHand = true) {
    if (!showSecondHand) {
        const minutes = date.getMinutes();
        return [(date.getHours() % 12 + minutes / 60) * TAU / 12,
            minutes * TAU / 60];
    }
    const seconds = date.getSeconds() + (smooth ? date.getMilliseconds() / 1000 : 0);
    const minutes = date.getMinutes() + seconds / 60;
    return [(date.getHours() % 12 + minutes / 60) * TAU / 12,
        minutes * TAU / 60, seconds * TAU / 60];
}

// St.DrawingArea already supplies a scale-aware Cairo context. Coordinates here
// are logical pixels; do not multiply them by the monitor scale a second time.
export function drawClock(cr, width, height, options, date = new Date()) {
    const size = Math.min(width, height);
    if (size <= 0)
        return;
    const dark = options.theme === 'black';
    const ink = dark ? 0.96 : 0.06;
    const circle = (radius) => cr.arc(0, 0, radius, 0, TAU);
    cr.save();
    cr.translate(width / 2, height / 2);
    cr.scale(size / 200, size / 200);
    cr.setAntialias(Cairo.Antialias.BEST);

    const bezel = new Cairo.LinearGradient(0, -100, 0, 100);
    bezel.addColorStopRGB(0, 0.34, 0.35, 0.37);
    bezel.addColorStopRGB(1, 0.13, 0.14, 0.15);
    cr.setSource(bezel);
    circle(99);
    cr.fill();
    const face = new Cairo.RadialGradient(-25, -35, 0, 0, 0, 96);
    face.addColorStopRGB(0, dark ? 0.085 : 1, dark ? 0.09 : 1, dark ? 0.10 : 1);
    face.addColorStopRGB(1, dark ? 0.015 : 0.94, dark ? 0.018 : 0.95, dark ? 0.025 : 0.96);
    cr.setSource(face);
    circle(94);
    cr.fill();
    cr.setSourceRGBA(dark ? 1 : 0, dark ? 1 : 0, dark ? 1 : 0, 0.14);
    cr.setLineWidth(0.8);
    circle(93.5);
    cr.stroke();

    if (options.minuteMarkers) {
        cr.setSourceRGBA(ink, ink, ink, 0.75);
        for (let i = 0; i < 60; i++) {
            const angle = i * TAU / 60;
            const major = i % 5 === 0;
            cr.setLineWidth(major ? 1.6 : 0.8);
            cr.moveTo(Math.sin(angle) * (major ? 83 : 86), -Math.cos(angle) * (major ? 83 : 86));
            cr.lineTo(Math.sin(angle) * 89, -Math.cos(angle) * 89);
            cr.stroke();
        }
    }

    cr.selectFontFace('Sans', Cairo.FontSlant.NORMAL, Cairo.FontWeight.NORMAL);
    let fontSize = 19;
    // Bound every label to its angular sector and keep it clear of tick marks.
    const labels = options.numerals === 'quarters' ? [12, 3, 6, 9] : Array.from({length: 12}, (_, i) => i + 1);
    cr.setFontSize(fontSize);
    const maxWidth = Math.max(...labels.map(n => cr.textExtents(String(n)).width));
    fontSize *= Math.min(1, 27 / maxWidth);
    cr.setFontSize(fontSize);
    cr.setSourceRGB(ink, ink, ink);
    for (const n of labels) {
        const angle = n * TAU / 12;
        const ext = cr.textExtents(String(n));
        cr.moveTo(Math.sin(angle) * 70 - ext.width / 2 - ext.xBearing,
            -Math.cos(angle) * 70 - ext.height / 2 - ext.yBearing);
        cr.showText(String(n));
    }

    const showSecondHand = options.showSecondHand !== false;
    const angles = handAngles(date, options.movement !== 'tick', showSecondHand);
    function hand(angle, length, tail, width, red = false) {
        cr.save();
        cr.rotate(angle);
        cr.setLineCap(Cairo.LineCap.ROUND);
        cr.setLineWidth(width);
        cr.setSourceRGB(red ? 0.88 : ink, red ? 0.10 : ink, red ? 0.13 : ink);
        cr.moveTo(0, tail);
        cr.lineTo(0, -length);
        cr.stroke();
        cr.restore();
    }
    hand(angles[0], 44, 6, 5.4);
    hand(angles[1], 61, 8, 3.5);
    if (showSecondHand)
        hand(angles[2], 78, 17, 1.4, true);
    cr.setSourceRGB(ink, ink, ink);
    circle(4.6);
    cr.fill();
    if (showSecondHand) {
        cr.setSourceRGB(0.88, 0.10, 0.13);
        circle(2.5);
        cr.fill();
    }
    cr.restore();
}
