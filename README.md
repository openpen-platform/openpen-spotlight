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

1. Click the **Spotlight** button in the control bar's tools group to turn the
   spotlight on. The button is highlighted while the spotlight is on.
2. Move the cursor. The screen is dimmed except for a circle around it.
3. Click the button again to turn the spotlight off. While it is off the plugin
   does not track the cursor.

The spotlight starts at the center of the screen until the cursor first moves.
The spotlight is off until you turn it on, and the on/off state is saved with the other settings.

## Settings

Open OpenPen's settings and choose the **Spotlight** panel.

| Setting | Values | Default | Description |
| --- | --- | --- | --- |
| **Radius** | 60 to 400 | 150 | Radius of the spotlight in pixels, including the soft edge |
| **Dim level** | 10% to 95% | 80% | How dark the dimmed area is (stored as 0.1 to 0.95) |
| **Soft edge** | on, off | on | Fade the edge of the spotlight; when off, the edge is hard |

The on/off state is also stored as a setting (`enabled`, default off). It is
changed with the control bar button rather than in the settings panel.

## License

MIT
