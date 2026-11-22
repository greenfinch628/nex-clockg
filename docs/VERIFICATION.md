# Verification record

Date: November 21, 2026. Initial release: 1.0.0 (unpublished).

The sections through “Remaining checks” record the historical 1.0.0 baseline.
See the 1.1.0 section below for the current compatibility declaration and results.

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


## 1.1.0 Always on Top verification — November 21, 2026

Inspected the installed GNOME Shell 50.6 `layout.js` resource in
`/usr/lib64/gnome-shell/libshell-18.so`: `uiGroup` contains `window_group`,
and `Meta.BackgroundGroup` is the bottom child of `window_group`. Off nests the clock inside that background group, above its wallpaper actors
and below application actors. On inserts into `uiGroup`
immediately above `window_group`, below Shell chrome and top/modal windows.
The clock remains nonreactive, and existing overview/session hiding is retained.
No stacking polling, new timers, or new signal connections are added.

The development repository was found at `/home/rczys/Applications/nex-clockg`,
branch `main`, commit `87aff9f`, with existing uncommitted corner-placement work.
That work was preserved. Contrary to the work order's initial assumption, both
that commit and the installed extension already use desktop-level placement.
On introduces the requested above-normal-windows mode; Off retains that placement.

Focused automated checks on Fedora 44 / GNOME 50.6:

- Strict schema compilation, JS syntax, clock math, renderer previews and ZIP build.
- Fresh private settings default Off. Existing theme/size/movement settings and
  the new On value survive separate processes and two private dconf sessions.
- Real GTK application window in normal and maximized states: scene graph ordering
  places Off above wallpaper and below the window, and On above the window group.
- Twenty immediate Off/On changes preserve one actor, its identity, geometry and
  active animation source. Workspace switching retains the mapped desktop widget.
- Five disable/enable cycles retain On and clean actors, timers and signal handlers.
- Smooth/tick animation, appearance changes, overview hiding and native preferences
  construction remain covered by the integration suite. The new switch is checked
  in both GSettings binding directions.

GNOME 51 APIs have not been verified at runtime. Metadata allows GNOME 50 and 51
at the user’s explicit request; GNOME 51 verification remains outstanding.
Physical login/logout, lock/unlock, mixed-monitor behavior and long-running CPU
profiling remain untested. No updated preferences screenshot was captured.
The isolated session may report service/portal warnings unrelated to the extension;
no extension GJS lifecycle/rendering errors were observed.


### Window-restacking correction

A user reported the desktop clock returning above windows after moving them.
The initial direct-child placement in `window_group` was insufficient: Mutter
can reorder those children during window restacking. Off now nests the clock
inside `Meta.BackgroundGroup`, which remains below normal windows. Shell keeps
replacement wallpaper actors at the bottom of that stable group. No recurring
stacking timer or additional signal handler is needed.

The regression test moves, raises and focuses a real window after toggling, and
captures maximized-window screenshots for both modes. Visual inspection confirms
Off is covered and On remains visible. Background replacement and an uncovered
Off-mode desktop capture verify that the clock remains above the wallpaper.

The user confirmed that the window-restacking correction fixed the reported
behavior in their desktop session. Version 1.1.0 includes the pre-existing corner
placement changes and the supplied README screenshots.


## 1.2.0 second-hand toggle — November 21, 2026

- Show Second Hand defaults to true, preserving the existing smooth/tick appearance.
- Disabled rendering draws just the hour/minute hands and black center pivot; it
  does not read seconds/milliseconds or calculate a second-hand angle. Tests cover
  both face themes and verify two hand rotations with no red draw operations.
- The single owned GLib timeout is removed before mode changes. Off replaces it
  with a minute-aligned hour/minute timeout (1–60000 ms); there is no concurrent
  smooth/tick source. Hand angles advance at minute granularity in this mode.
- Isolated GNOME 50.6 tests toggle the hand twenty times in smooth/tick modes,
  check removal of each old source, inspect actual minute-source deadlines, verify
  no high-frequency repaints, and trigger the minute source early to check redraw
  and rearming without a lengthy wait. Disable/enable retains the Off setting.
- Preferences tests verify the new two-way switch binding, disabled movement/rate
  controls, and preservation of the saved movement mode. Private dconf sessions
  verify default On and persistence of Off alongside existing settings.
- Direct actor destruction removes the update source and all registered handlers.
  Existing stacking, workspace, overview and lifecycle regression tests pass.
- Syntax, strict schemas, clock math, rendering tests, previews and ZIP validation
  pass. No extension GJS lifecycle/rendering errors appear in the isolated run.

GNOME 50 and 51 remain allowed in metadata. GNOME 51 runtime, physical logout/login
and direct CPU/power measurements remain unavailable or unperformed; no measured
power-saving claim is made. Minute-boundary math is tested independently, and the
integration check accelerates its source rather than waiting a full minute.
