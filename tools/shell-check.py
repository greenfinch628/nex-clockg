import json, os, time
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
        "actors:global.window_group.get_children().filter(a=>a.has_style_class_name?.('nex-clockg')).length})")
# Eval JSON-encodes the returned string, decode its content as well.
def state():
    s = snapshot()
    return json.loads(s) if isinstance(s, str) else s
s = state()
assert s['state'] == 1 and s['mapped'] and s['actors'] == 1 and s['timer'] > 0, s
print('PASS: GNOME 50.6 loads desktop clock, maps actor, schedules animation.')
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
for i in range(5):
    evaluate(f"Main.extensionManager.disableExtension('{uuid}'); true")
    time.sleep(.3)
    s = state()
    assert s['actors'] == 0 and s['timer'] == 0 and s['signals'] == 0, s
    evaluate(f"Main.extensionManager.enableExtension('{uuid}'); true")
    time.sleep(.4)
    s = state()
    assert s['actors'] == 1 and s['timer'] > 0, s
assert evaluate("global.clockTest._settings.get_string('numerals') === 'all'")
print('PASS: five enable/disable cycles leave zero actors, sources and handlers on disable; settings survive.')
evaluate("global.clockTest._settings.reset('theme'); global.clockTest._settings.reset('diameter'); global.clockTest._settings.reset('minute-markers'); true")
# Export a real compositor screenshot in addition to the renderer preview images.
path = os.path.join(os.environ['CLOCK_TEST_ROOT'], 'desktop.png')
evaluate("global.clockShotDone = false; global.clockShotError = null; Promise.all([import('gi://Shell'),import('gi://Gio')]).then(async ([{default:Shell},{default:Gio}]) => { const stream=Gio.File.new_for_path(" + json.dumps(path) + ").replace(null,false,Gio.FileCreateFlags.REPLACE_DESTINATION,null); await new Shell.Screenshot().screenshot(false,stream); stream.close(null); global.clockShotDone=true; }).catch(e=>{global.clockShotError=String(e);}); true")
for _ in range(30):
    if evaluate('global.clockShotDone'):
        break
    time.sleep(.1)
assert evaluate('global.clockShotDone') and os.path.exists(path), evaluate('global.clockShotError')
print('PASS: compositor screenshot:', path)
