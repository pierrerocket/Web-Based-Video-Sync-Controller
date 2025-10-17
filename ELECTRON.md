# Video Sync - Electron App

This branch contains the Electron-packaged version of Video Sync, which can be distributed as a standalone Mac application.

## Development

### Run the Electron app in development mode:

```bash
npm run electron:dev
```

This will:
1. Start the Express server on port 8080
2. Open the admin interface in an Electron window
3. Show dev tools for debugging

### Regular Electron mode:

```bash
npm run electron
```

## Building the Mac App

### Build for your Mac's architecture (Intel or Apple Silicon):

```bash
npm run build:mac
```

This creates:
- `dist/Video Sync.app` - The application bundle
- `dist/Video Sync-1.0.0.dmg` - Installer disk image
- `dist/Video Sync-1.0.0-mac.zip` - Compressed app

### Build Universal app (works on both Intel and Apple Silicon):

```bash
npm run build:mac:universal
```

Note: This creates a larger file but works on all Macs.

## Distribution

After building, you can distribute:
- **The DMG file** - Users drag the app to Applications folder
- **The ZIP file** - Users extract and copy to Applications
- **The .app directly** - Copy to a USB drive or share via cloud storage

## App Icons (Optional)

To add a custom icon:

1. Create a 1024x1024 PNG image
2. Convert to ICNS format using:
   ```bash
   # Install iconutil (comes with Xcode)
   # Or use online converters
   ```
3. Place `icon.icns` in the `build/` directory

## What's Included in the App

The packaged app includes:
- Node.js runtime (bundled)
- Express server
- Socket.IO server
- All web interface files
- All dependencies

Users don't need to install Node.js or run any commands!

## Usage

When users open the app:
1. Server starts automatically in the background
2. Admin interface opens in a window
3. Menu bar shows "Video Sync" with options
4. Help > Server URLs shows the network addresses for TVs

## Testing

Before distributing:
1. Run `npm run electron:dev` to test locally
2. Build the app with `npm run build:mac`
3. Test the built app from `dist/Video Sync.app`
4. Verify server starts and admin interface loads
5. Test accessing from another device on the network

## File Size

Expected app size:
- Intel Mac: ~200-250 MB
- Apple Silicon Mac: ~200-250 MB
- Universal: ~400-450 MB

The size is due to bundling Chromium and Node.js runtime.

## Troubleshooting

### "App is damaged" error on Mac
This happens when the app isn't signed. Users can:
```bash
xattr -cr "/Applications/Video Sync.app"
```

Or go to System Preferences > Security & Privacy and allow the app.

### Server doesn't start
Check Console.app for errors. The app logs to:
```
~/Library/Logs/Video Sync/
```

### Port already in use
The app uses port 8080. If another app is using it, close that app first.

## Code Signing (Optional)

For production distribution, you should sign the app:

1. Get an Apple Developer account ($99/year)
2. Get a Developer ID certificate
3. Update package.json build config:
```json
"mac": {
  "identity": "Developer ID Application: Your Name (TEAM_ID)"
}
```
4. Build: `npm run build:mac`

Signed apps don't show security warnings on macOS.

## Notarization (Optional)

For Gatekeeper approval:
1. Sign the app (above)
2. Add to package.json:
```json
"afterSign": "scripts/notarize.js"
```
3. Create notarize script with your Apple ID credentials
4. Build and upload to Apple for notarization

## Creating by Pierre R. Balian

This Electron wrapper was created to make Video Sync easy to distribute and use without requiring technical setup.
