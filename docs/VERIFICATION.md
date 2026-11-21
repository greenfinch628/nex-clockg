# Verification record

Date: November 21, 2026. Initial release: 1.0.0 (unpublished).

## Environment

- Fedora Linux 44, GNOME Shell / Mutter 50.6, GJS 1.88.1.
- Isolated headless Wayland compositor, virtual 1280 × 800 monitor.
- Separate D-Bus session and temporary XDG configuration; existing extensions untouched.

## Passed checks

- Strict GSettings schema compilation and JavaScript syntax validation.
- Accurate hour/minute interpolation and fractional-second angles.
- Tick deadlines on exact second boundaries, including synthetic wall-clock jumps.
- Cairo previews for both themes at 120, 160, 200, 300 and 400 logical pixels,
  at 1× and 2× scale (20 images).
- GNOME 50.6 loads and maps exactly one desktop actor and starts its timer.
- Live theme, size, movement, numeral-layout and marker changes.
- Actual measured repaint cadence over 2.2 seconds: 2–3 tick repaints and 66 smooth
  repaints (30 FPS). This is a cadence measurement, not a CPU/power benchmark.
- Overview hides the widget and removes its timer; returning restores animation.
- Five disable/enable cycles: zero actors, timers and registered extension
  handlers after each disable; one actor and active timer after each enable.
- Changed settings survive those extension disable/enable cycles.
- Settings survive separate GSettings processes and two D-Bus/dconf sessions.
- Actual compositor screenshot generation.
- Native GTK4/libadwaita preferences construct, present, update and close with
  fatal GTK warnings enabled (accessibility disabled only inside the test).
- No GJS rendering, disposed-object or missing-source errors in the passing session.

## Remaining checks

- GNOME 51 / Fedora 45: no runtime available; metadata lists GNOME 50 only.
- Physical suspend/resume and changing the host system clock were not performed.
  Each redraw uses current wall time and scheduler math is tested independently.
- Physical HiDPI / mixed-monitor changes and lock/unlock require a normal desktop
  session check. Cairo previews exercise 2× rendering, not physical monitor changes.
- Log out/in persistence should be confirmed in the user's normal desktop session;
  settings use the persistent GSettings/dconf backend.
- No long-running power/CPU profile or comparative 60 FPS test has been performed.

Do not publish until the remaining release checks have been reviewed and explicit
publication approval has been obtained.
