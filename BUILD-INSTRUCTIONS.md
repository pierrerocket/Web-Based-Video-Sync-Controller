# Video Sync - Build Instructions for Mac App

**Created by: Pierre R. Balian**

This guide explains how to build and distribute the Video Sync application as a standalone Mac app.

## Prerequisites

- macOS computer (for building Mac apps)
- Node.js installed (tested with v18+)
- All dependencies installed: `npm install`

## Quick Start

### 1. Test the Electron App Locally

```bash
npm run electron:dev
```

This opens the app with dev tools. You should see:
- The admin interface load in a window
- Console showing "Server started successfully"
- Menu bar with "Video Sync" menu

### 2. Build the Mac App

```bash
npm run build:mac
```

This creates a distributable Mac application in the `dist/` folder:
- `Video Sync.app` - The application bundle
- `Video Sync-1.0.0.dmg` - Drag-to-install disk image
- `Video Sync-1.0.0-mac.zip` - Compressed app archive

**Build time:** 2-5 minutes depending on your Mac

### 3. Test the Built App

```bash
open "dist/Video Sync.app"
```

The app should:
1. Launch and show a window with "Video Sync Controller"
2. Start the server automatically
3. Load the admin interface at http://localhost:8080/admin

## What Gets Packaged

The Mac app includes everything needed to run:

✅ Node.js runtime (bundled, ~80MB)
✅ Chromium browser engine (~120MB)
✅ Express server + Socket.IO
✅ All web interface files (HTML, CSS, JS)
✅ All npm dependencies

**Users don't need to install anything!**

## Distribution Options

### Option 1: DMG File (Recommended)
**File:** `dist/Video Sync-1.0.0.dmg`

**How users install:**
1. Download the DMG
2. Double-click to open
3. Drag "Video Sync" to Applications folder
4. Eject the DMG
5. Open from Applications

**Pros:** Professional, familiar to Mac users
**Cons:** Larger download (~200MB)

### Option 2: ZIP File
**File:** `dist/Video Sync-1.0.0-mac.zip`

**How users install:**
1. Download and extract the ZIP
2. Copy "Video Sync.app" to Applications
3. Open from Applications

**Pros:** Slightly smaller download
**Cons:** Extra extraction step

### Option 3: Direct App Bundle
**File:** Copy `dist/Video Sync.app`

**How to share:**
- USB drive
- Network share
- Cloud storage (Dropbox, Google Drive, etc.)

**Pros:** No installer needed
**Cons:** May show security warning

## Handling Security Warnings

Since the app isn't signed with an Apple Developer certificate, macOS will show a security warning.

### For Users

If they see "Video Sync is damaged and can't be opened":

**Option A: Remove quarantine attribute (easiest)**
```bash
xattr -cr "/Applications/Video Sync.app"
```

**Option B: System Preferences**
1. Try to open the app
2. Go to System Preferences > Security & Privacy
3. Click "Open Anyway" for Video Sync
4. Confirm in the next dialog

**Option C: Right-click method**
1. Right-click "Video Sync.app"
2. Click "Open"
3. Click "Open" in the security dialog

### For Distribution (Optional)

To avoid security warnings, you can sign the app:

**Requirements:**
- Apple Developer Program membership ($99/year)
- Developer ID Application certificate

**Steps:**
1. Get a Developer ID certificate from Apple
2. Update `package.json`:
```json
"mac": {
  "identity": "Developer ID Application: Pierre R. Balian (TEAM_ID)",
  "hardenedRuntime": true,
  "gatekeeperAssess": false
}
```
3. Build: `npm run build:mac`

Signed apps open without warnings on any Mac.

## Building Universal Apps

To create an app that works on both Intel and Apple Silicon Macs:

```bash
npm run build:mac:universal
```

**Trade-offs:**
- ✅ Works on all Macs (Intel & M1/M2/M3)
- ❌ Larger file size (~400MB vs ~200MB)
- ❌ Longer build time (~5-10 minutes)

**When to use:**
- You want maximum compatibility
- Users might have either Intel or Apple Silicon Macs
- File size isn't a concern

**When to skip:**
- You know all users have the same CPU type
- Want smaller downloads
- Want faster builds

## Customizing the App

### Change App Name
Edit `package.json`:
```json
{
  "name": "video-sync",
  "productName": "My Custom Name"
}
```

### Change Version
Edit `package.json`:
```json
{
  "version": "1.0.0"
}
```

### Add Custom Icon

1. Create a 1024x1024px PNG icon
2. Convert to ICNS:
   - Use online converter (CloudConvert, etc.)
   - Or use `iconutil` on Mac
3. Save as `build/icon.icns`
4. Rebuild: `npm run build:mac`

### Change Server Port

Edit `electron-main.js`:
```javascript
const SERVER_PORT = 8080; // Change this
```

## Troubleshooting Builds

### "Cannot find module 'electron'"
```bash
npm install
```

### "SCSS files not found"
```bash
npm run sass:build
```

### Build fails with "EACCES"
```bash
sudo chown -R $USER node_modules
npm run build:mac
```

### App won't start after building
Check the console logs:
```bash
open ~/Library/Logs/Video\ Sync/
```

### Port 8080 already in use
Close any other apps using port 8080, or change the port in `electron-main.js`.

## File Sizes

Expected sizes for built apps:

| Build Type | Size | Platforms |
|------------|------|-----------|
| Intel Mac | ~220 MB | Intel Macs only |
| Apple Silicon | ~210 MB | M1/M2/M3 Macs only |
| Universal | ~430 MB | All Macs |

The size includes:
- Electron framework (~120MB)
- Node.js runtime (~80MB)
- Your app code + dependencies (~20MB)

## Development Workflow

1. **Make changes** to HTML, CSS, JS, or server code
2. **Test in Electron:** `npm run electron:dev`
3. **Build when ready:** `npm run build:mac`
4. **Test the built app:** `open "dist/Video Sync.app"`
5. **Distribute:** Share the DMG or ZIP file

## CI/CD Automation (Advanced)

To automate builds with GitHub Actions:

```yaml
name: Build Mac App
on: [push]
jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build:mac
      - uses: actions/upload-artifact@v3
        with:
          name: mac-app
          path: dist/*.dmg
```

## Support

For issues with the Electron build:
1. Check `ELECTRON.md` for detailed Electron documentation
2. Verify all files exist: `./.electron-test.sh`
3. Check build logs in terminal
4. Search electron-builder documentation

## Created By

Pierre R. Balian

This build system makes Video Sync easy to distribute as a professional Mac application without requiring users to have Node.js or technical knowledge.
