# Image Upload or Camera

Odoo 19 backend addon that changes the standard `image` field edit button into a source-selection popup:

- **Upload image** opens the browser file explorer.
- **Use camera** requests browser camera permission, shows a live preview, and captures the image directly into the image field.

## Installation

1. Add `custom_addons` to `addons_path` in `odoo.conf` if it is not already there.
2. Restart Odoo.
3. Update the Apps list.
4. Install **Image Upload or Camera**.
5. Upgrade the module after code changes with `-u image_camera_upload`.

The addon applies to Odoo's standard `image` field in backend forms, so any calculator or custom model using an image field receives the behavior automatically.

## Browser requirements

Camera capture requires browser permission and a secure context. Use HTTPS in production. `localhost` is also treated as secure by modern browsers. If permission is denied or the browser has no camera API, the popup shows an error and the existing upload option remains available.
