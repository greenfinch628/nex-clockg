import json, os, time, subprocess
from gi.repository import Gio, GLib
bus = Gio.bus_get_sync(Gio.BusType.SESSION, None)
def evaluate(code):
    reply = bus.call_sync('org.gnome.Shell', '/org/gnome/Shell', 'org.gnome.Shell', 'Eval',
                          GLib.Variant('(s)', (code,)), None, Gio.DBusCallFlags.NONE, 5000, None)
    ok, result = reply.unpack()
    if not ok:
        raise RuntimeError(result)
    return json.loads(result) if result else None
uuid = 'nex-clockg@greenfinch628.github.io'
evaluate("global.clockTest = Main.extensionManager.lookup('" + uuid + "').stateObj; true")
evaluate("Main.overview.hide(); true")
time.sleep(1)
def snapshot():
    return evaluate("JSON.stringify({state:Main.extensionManager.lookup('" + uuid + "').state, "
        "error: Main.extensionManager.lookup('" + uuid + "').error, "
        "mapped:global.clockTest._actor?.mapped, visible:global.clockTest._actor?.visible, "
        "timer:global.clockTest._timer, signals:global.clockTest._signals.length, "
        "actors:(function count(a){return (a.has_style_class_name?.('nex-clockg') ? 1 : 0) + a.get_children().reduce((n,c)=>n+count(c),0)})(global.stage)})")
# Eval JSON-encodes the returned string, decode its content as well.
def state():
    s = snapshot()
    return json.loads(s) if isinstance(s, str) else s
s = state()
assert s['state'] == 1 and s['mapped'] and s['actors'] == 1 and s['timer'] > 0, s
print('PASS: GNOME 50.6 loads desktop clock, maps actor, schedules animation.')
# Check real normal/maximized windows and preserve actor identity and geometry.
assert evaluate("global.clockTest._settings.get_boolean('always-on-top') === false")
evaluate("global.savedClockActor=global.clockTest._actor; global.savedClockGeometry=[global.savedClockActor.x,global.savedClockActor.y,global.savedClockActor.width,global.savedClockActor.height]; true")
window = subprocess.Popen(['gjs', '-m', os.path.join(os.path.dirname(__file__), '../tests/window.js')],
                          env={**os.environ, 'WAYLAND_DISPLAY': 'wayland-0', 'GTK_A11Y': 'none'})
try:
    for _ in range(40):
        if evaluate("global.get_window_actors().some(a=>a.meta_window.get_title()==='Clock stacking test')"):
            break
        time.sleep(.1)
    assert evaluate("global.get_window_actors().some(a=>a.meta_window.get_title()==='Clock stacking test')")
    for maximized in [False, True]:
        evaluate("global.testWindow=global.get_window_actors().find(a=>a.meta_window.get_title()==='Clock stacking test'); true")
        if maximized:
            evaluate("global.testWindow.meta_window.maximize(); true")
        else:
            evaluate("global.testWindow.meta_window.move_resize_frame(false,0,0,1280,700); true")
        time.sleep(.3)
        for on_top in [True, False] * 5:
            evaluate(f"global.clockTest._settings.set_boolean('always-on-top',{str(on_top).lower()}); true")
            time.sleep(.08)
            assert evaluate("global.clockTest._actor === global.savedClockActor && JSON.stringify([global.savedClockActor.x,global.savedClockActor.y,global.savedClockActor.width,global.savedClockActor.height]) === JSON.stringify(global.savedClockGeometry)")
            s = state()
            assert s['actors'] == 1 and s['timer'] > 0 and s['mapped'], s
            if on_top:
                assert evaluate("global.savedClockActor.get_parent() === Main.layoutManager.uiGroup && Main.layoutManager.uiGroup.get_children().indexOf(global.savedClockActor) > Main.layoutManager.uiGroup.get_children().indexOf(global.window_group)")
            else:
                assert evaluate("global.savedClockActor.get_parent().get_parent() === global.window_group && global.window_group.get_children().indexOf(global.savedClockActor.get_parent()) < global.window_group.get_children().indexOf(global.testWindow)")
    # Reproduce the reported regression: move/raise an already mapped window
    # after switching Off, with no settings change to reapply actor placement.
    for on_top in [False, True]:
        evaluate(f"global.clockTest._settings.set_boolean('always-on-top',{str(on_top).lower()}); global.testWindow.meta_window.unmaximize(); true")
        time.sleep(.2)
        for x in [0, 200, 20]:
            evaluate(f"global.testWindow.meta_window.move_resize_frame(false,{x},30,1050,700); global.testWindow.meta_window.raise(); global.testWindow.meta_window.activate(global.get_current_time()); true")
            time.sleep(.2)
        if not on_top:
            assert evaluate("global.savedClockActor.get_parent().get_parent() === global.window_group && global.window_group.get_children().indexOf(global.savedClockActor.get_parent()) < global.window_group.get_children().indexOf(global.testWindow)")
        else:
            assert evaluate("global.savedClockActor.get_parent() === Main.layoutManager.uiGroup")
        evaluate("global.testWindow.meta_window.maximize(); true")
        time.sleep(.3)
        path = os.path.join(os.environ['CLOCK_TEST_ROOT'], 'stacking-' + ('on' if on_top else 'off') + '.png')
        evaluate("global.stackShotDone=false; global.stackShotError=null; Promise.all([import('gi://Shell'),import('gi://Gio')]).then(async ([{default:Shell},{default:Gio}])=>{const stream=Gio.File.new_for_path(" + json.dumps(path) + ").replace(null,false,Gio.FileCreateFlags.REPLACE_DESTINATION,null); await new Shell.Screenshot().screenshot(false,stream); stream.close(null); global.stackShotDone=true;}).catch(e=>{global.stackShotError=String(e)}); true")
        for _ in range(30):
            if evaluate('global.stackShotDone'): break
            time.sleep(.1)
        assert evaluate('global.stackShotDone'), evaluate('global.stackShotError')
    print('PASS: window move/raise/focus regression in both modes; captured stacking-off/on.png.')
    # Workspace changes retain the same global desktop widget.
    evaluate("global.workspace_manager.get_workspace_by_index(1)?.activate(global.get_current_time()); true")
    time.sleep(.3)
    assert state()['mapped']
    evaluate("global.workspace_manager.get_workspace_by_index(0).activate(global.get_current_time()); true")
    print('PASS: default Off, normal/maximized window stacking, 20 live switches, actor identity/geometry, workspace switch.')
finally:
    window.terminate()
    window.wait(timeout=5)

for theme in ['black', 'white']:
    for size in [120, 160, 200, 300, 400]:
        evaluate(f"global.clockTest._settings.set_string('theme','{theme}'); global.clockTest._settings.set_int('diameter',{size}); true")
        time.sleep(.12)
        assert evaluate(f"global.clockTest._actor.width === {size} && global.clockTest._options.theme === '{theme}'")
for mode in ['tick', 'smooth']:
    evaluate(f"global.clockTest._settings.set_string('movement','{mode}'); true")
    time.sleep(1.1)
    assert evaluate(f"global.clockTest._options.movement === '{mode}' && global.clockTest._timer > 0")
for layout in ['quarters', 'all']:
    evaluate(f"global.clockTest._settings.set_string('numerals','{layout}'); global.clockTest._settings.set_boolean('minute-markers',false); true")
    time.sleep(.1)
    assert evaluate(f"global.clockTest._options.numerals === '{layout}' && !global.clockTest._options.minuteMarkers")
print('PASS: live themes, sizes, movement, numeral layouts and marker changes.')
# Measure actual repaint cadence without adding production instrumentation.
counts = {}
for mode in ['tick', 'smooth']:
    evaluate(f"global.clockTest._settings.set_string('movement','{mode}'); true")
    time.sleep(.1)
    evaluate("global.clockPaintCount=0; global.clockPaintSignal=global.clockTest._actor.connect('repaint',()=>global.clockPaintCount++); true")
    time.sleep(2.2)
    counts[mode] = evaluate('global.clockPaintCount')
    evaluate('global.clockTest._actor.disconnect(global.clockPaintSignal); true')
assert 1 <= counts['tick'] <= 3 and counts['smooth'] > 35, counts
print('PASS: measured repaint counts over 2.2 seconds:', counts)
# Exercise actual overview visibility; the animation source must be removed.
evaluate('Main.overview.show(); true')
time.sleep(.8)
assert evaluate('!global.clockTest._actor.visible && global.clockTest._timer === 0')
evaluate('Main.overview.hide(); true')
time.sleep(.8)
assert evaluate('global.clockTest._actor.visible && global.clockTest._timer > 0')
print('PASS: overview hides widget and pauses animation, desktop restores it.')
evaluate("global.clockTest._settings.set_boolean('always-on-top',true); true")
for i in range(5):
    evaluate(f"Main.extensionManager.disableExtension('{uuid}'); true")
    time.sleep(.3)
    s = state()
    assert s['actors'] == 0 and s['timer'] == 0 and s['signals'] == 0, s
    evaluate(f"Main.extensionManager.enableExtension('{uuid}'); true")
    time.sleep(.4)
    s = state()
    assert s['actors'] == 1 and s['timer'] > 0, s
    assert evaluate("global.clockTest._settings.get_boolean('always-on-top') && global.clockTest._actor.get_parent() === Main.layoutManager.uiGroup")
assert evaluate("global.clockTest._settings.get_string('numerals') === 'all'")
print('PASS: five enable/disable cycles leave zero actors, sources and handlers on disable; settings survive.')
evaluate("global.clockTest._settings.reset('theme'); global.clockTest._settings.reset('diameter'); global.clockTest._settings.reset('minute-markers'); true")
# Off must stay visible above wallpaper even after Shell rebuilds backgrounds.
evaluate("global.clockTest._settings.set_boolean('always-on-top',false); global.clockBgDone=false; Main.layoutManager._updateBackgrounds().then(()=>global.clockBgDone=true); true")
for _ in range(30):
    if evaluate('global.clockBgDone'): break
    time.sleep(.1)
assert evaluate("global.clockBgDone && global.clockTest._actor.mapped && global.clockTest._actor.get_parent().get_children().at(-1) === global.clockTest._actor")
print('PASS: Off remains above wallpaper after background replacement.')
# Export a real compositor screenshot in addition to the renderer preview images.
path = os.path.join(os.environ['CLOCK_TEST_ROOT'], 'desktop.png')
evaluate("global.clockShotDone = false; global.clockShotError = null; Promise.all([import('gi://Shell'),import('gi://Gio')]).then(async ([{default:Shell},{default:Gio}]) => { const stream=Gio.File.new_for_path(" + json.dumps(path) + ").replace(null,false,Gio.FileCreateFlags.REPLACE_DESTINATION,null); await new Shell.Screenshot().screenshot(false,stream); stream.close(null); global.clockShotDone=true; }).catch(e=>{global.clockShotError=String(e);}); true")
for _ in range(30):
    if evaluate('global.clockShotDone'):
        break
    time.sleep(.1)
assert evaluate('global.clockShotDone') and os.path.exists(path), evaluate('global.clockShotError')
print('PASS: compositor screenshot:', path)
