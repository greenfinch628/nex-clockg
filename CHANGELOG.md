# Changelog

## 1.3.0 — 2026-11-21

- Document disabling Show Second Hand to minimize performance impact by stopping
  second-hand animation and using minute-aligned hour/minute updates.
- Bump extension metadata to 1.3.0; clock behavior is unchanged from 1.2.0.

## 1.2.0 — 2026-11-21

- Add a persistent Show Second Hand switch, enabled by default. Disable it to hide
  the red hand and stop all smooth/tick updates and second-hand calculations.
- Keep hour and minute hands current using one minute-aligned timeout while the
  second hand is off. Replace the old timeout immediately on each mode change.
- Gray out movement and refresh-rate controls while the hand is hidden, preserving
  their selected values for re-enabling. Retain all existing clock settings.
- Stop the update source when the clock actor is destroyed.

## 1.1.0 — 2026-11-21

- Allow GNOME Shell 50 and 51 in metadata; GNOME 51 runtime testing is outstanding.
- Fix desktop stacking after application windows move or raise by nesting the
  Off-mode clock inside the background group.
- Add a persistent Always on Top switch, Off by default for new and existing
  installations. Switch layers immediately using the same clock actor.
- Preserve overview/lock hiding, click-through behavior, position and animation.
- Add a desktop corner selector while preserving existing horizontal and vertical
  padding settings. Padding labels follow the selected corner.

- Add desktop and preferences screenshots with descriptions in the README.
- Verify window movement/restacking, live mode changes, preferences binding,
  background replacement, settings persistence and actor/timer cleanup on GNOME
  50.6. The user also confirmed the stacking fix in their desktop session.

## 1.0.0 — Unreleased

- Add an unbranded Cairo desktop analog clock with white and black faces.
- Add all twelve numerals or a quarters-only layout, optional minute markers,
  dark gray bezel, and red seconds hand.
- Add fractional-second smooth movement at 30 FPS by default and wall-clock-aligned
  ticking; allow a lower smooth refresh rate of 15–30 FPS.
- Add persistent GTK4/libadwaita preferences for appearance, size and position.
- Handle monitor/work-area changes and hide during overview and lock screen.
- Clean up actors, settings handlers and timers on disable.
- Provide installation, update backups, reproducible ZIP packaging and test tools.
- Verify against GNOME Shell 50.6. GNOME 51 remains unverified and is not yet
  declared in extension metadata.
