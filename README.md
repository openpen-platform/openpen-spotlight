# @openpen/spotlight

A spotlight for [OpenPen](https://github.com/openpen-platform/openpen).

Dims the screen and keeps a soft circular spotlight following the cursor, so
the audience looks where you are pointing.

## Install

Requires OpenPen 1.0.0 or later.

Install from the plugin catalog, then restart OpenPen:

```bash
npx openpen-cli plugin install @openpen/spotlight
```

To install a build from source instead, build the plugin, then add the
directory to OpenPen and restart it:

```bash
npm install
npm run build
npx openpen-cli plugin add .
```

## Usage

1. Click the **Spotlight** button in the control bar's tools group, or press
   **Ctrl+Alt+S** (**⌘⌥S** on macOS), to turn the spotlight on. The button is
   highlighted while the spotlight is on. The shortcut is not available on
   Linux Wayland sessions; use the button there.
2. Move the cursor. The screen is dimmed except for a circle around it.
3. To adjust it on the spot, click the small caret next to the **Spotlight**
   button (this also turns the spotlight on) and use the panel: drag
   **Radius** and **Dim level**, or switch **Soft edge** on or off. Changes
   apply immediately and are kept across restarts.
4. Click the button or press the shortcut again to turn the spotlight off.
   While it is off the plugin does not track the cursor.

The spotlight starts at the center of the screen until the cursor first moves.
The spotlight is off until you turn it on, and the on/off state is saved with the other settings.

## Settings

The same options are in the control-bar panel described above, and in
OpenPen's settings under the **Spotlight** panel.

| Setting | Values | Default | Description |
| --- | --- | --- | --- |
| **Radius** | 60 to 400 | 150 | Radius of the spotlight in pixels, including the soft edge |
| **Dim level** | 10% to 95% | 80% | How dark the dimmed area is (stored as 0.1 to 0.95) |
| **Soft edge** | on, off | on | Fade the edge of the spotlight; when off, the edge is hard |

A saved value outside the allowed range is clamped back into it.

The on/off state is also stored as a setting (`enabled`, default off). It is
changed with the control bar button or the shortcut rather than in the settings
panel. The shortcut can be rebound under **Settings → Shortcuts**.

## License

MIT
