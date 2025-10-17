# Office Video Player - Synchronized Multi-TV Playback System

A browser-based synchronized video playback system designed for Samsung Smart TVs and other displays. Control multiple screens simultaneously with sub-second synchronization using WebSocket technology.

## Features

- **Synchronized Playback**: Control 4+ TVs simultaneously with ~100-300ms sync accuracy
- **WebSocket Control**: Real-time communication using Socket.IO
- **Browser-Based**: Works with Samsung Smart TV built-in browsers (no additional hardware needed)
- **Central Controller**: Single web interface to control all displays
- **Video Preloading**: Buffer videos before playback for better synchronization
- **Real-time Status**: See which TVs are connected and ready to play
- **Multiple Videos**: Switch between different videos easily

## System Requirements

- Node.js 14+ installed on your server/laptop
- Samsung Smart TVs with web browser capability
- All devices on the same local network (LAN)

## Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Find your computer's local IP address**:

**On Mac/Linux**:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**On Windows**:
```bash
ipconfig
```

Look for your IPv4 address (usually starts with 192.168.x.x or 10.0.x.x)

## Running the Server

Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

You'll see output like:
```
==================================================
🎬 Video Sync Server Running
==================================================

📺 TV Players:
   TV 1: http://localhost:3000/tv1.html
   TV 2: http://localhost:3000/tv2.html
   TV 3: http://localhost:3000/tv3.html
   TV 4: http://localhost:3000/tv4.html

🎮 Controller:
   http://localhost:3000/controller.html

==================================================
💡 Use your local IP for Samsung TVs on the network
==================================================
```

## Setup Instructions

### 1. Open Controller Page

On your laptop/phone:
- Open `http://YOUR_LOCAL_IP:3000/controller.html`
- Example: `http://192.168.1.100:3000/controller.html`

### 2. Open Player Pages on Each TV

On each Samsung TV:
1. Open the web browser app
2. Navigate to the appropriate URL:
   - **TV 1**: `http://YOUR_LOCAL_IP:3000/tv1.html`
   - **TV 2**: `http://YOUR_LOCAL_IP:3000/tv2.html`
   - **TV 3**: `http://YOUR_LOCAL_IP:3000/tv3.html`
   - **TV 4**: `http://YOUR_LOCAL_IP:3000/tv4.html`

3. The TV will show "Connected - Waiting for video..."

### 3. Load and Play Videos

From the controller page:
1. Select a video from the dropdown
2. Click **"Load Video"** to send the video to all TVs
3. Wait for all TVs to show "Ready to play" (green checkmark)
4. Click **"Preload Video"** (optional but recommended for better sync)
5. Click **"▶️ Play"** to start synchronized playback

## Using Your Own Videos

### Option 1: Modify the Controller HTML

Edit `public/controller.html` and update the `videos` array (around line 64):

```javascript
const videos = [
    { name: 'Your Video 1', url: 'http://yourserver.com/video1.mp4' },
    { name: 'Your Video 2', url: 'http://yourserver.com/video2.mp4' },
    // Add more videos here
];
```

### Option 2: Host Videos Locally

1. Create a `videos` folder in the project root:
```bash
mkdir videos
```

2. Place your .mp4 files in the `videos` folder

3. Add this line to `server.js` after line 8:
```javascript
app.use('/videos', express.static('videos'));
```

4. Update the controller to reference local videos:
```javascript
const videos = [
    { name: 'Local Video 1', url: 'http://YOUR_LOCAL_IP:3000/videos/video1.mp4' },
    { name: 'Local Video 2', url: 'http://YOUR_LOCAL_IP:3000/videos/video2.mp4' }
];
```

## Controller Features

### Playback Controls

- **Load Video**: Loads selected video on all TVs
- **Preload Video**: Buffers video before playing (recommended)
- **Play**: Starts synchronized playback on all TVs
- **Pause**: Pauses all TVs simultaneously
- **Stop**: Stops and resets all TVs
- **Re-Sync**: Resynchronizes playback if TVs drift apart
- **Seek**: Jump to specific time (in seconds)

### Status Indicators

- ✅ Green checkmark: TV is connected and ready
- ⏳ Hourglass: TV is loading/buffering
- Activity log shows all commands sent to TVs

## Troubleshooting

### TVs won't connect
- Ensure all devices are on the same network
- Check firewall settings allow port 3000
- Verify you're using the correct local IP address
- Try disabling VPN if active

### Video won't play
- Check video format (MP4 with H.264 codec works best)
- Ensure video URL is publicly accessible
- Try the "Preload Video" button before playing
- Check TV browser console for errors

### Poor synchronization
- Use the "Preload Video" feature before playing
- Ensure good network connection to all TVs
- Use lower resolution videos if network is slow
- Click "Re-Sync" button to resynchronize playback

### Video format issues
Samsung TV browsers support:
- ✅ MP4 with H.264 video codec
- ✅ AAC audio codec
- ❌ VP9, AV1 (may not work)
- ❌ HEVC/H.265 (limited support)

## Advanced Configuration

### Add More TVs

To add a 5th TV:

1. Create `public/tv5.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=player.html?screen=5">
    <title>TV 5</title>
</head>
<body>
    <p>Redirecting to TV 5 player...</p>
</body>
</html>
```

2. Update `server.js` to show the new URL in the startup message

### Change Port

Set the PORT environment variable:
```bash
PORT=8080 npm start
```

Or edit `server.js` line 71 to change the default port.

## Technical Details

### Architecture
- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: Vanilla JavaScript + HTML5 Video API
- **Communication**: WebSocket bidirectional communication
- **Sync Method**: Timestamp-based synchronization with network delay compensation

### Synchronization Accuracy
- Typical sync: 100-300ms between displays
- Factors affecting sync:
  - Network latency (WiFi vs Ethernet)
  - TV processing speed
  - Video buffering state
  - Video codec and resolution

### Network Requirements
- All devices must be on same LAN
- Minimum 5 Mbps per TV for HD video
- Lower latency networks = better sync

## License

MIT License - Feel free to modify and use for your projects!

## Support

For issues or questions:
1. Check the troubleshooting section
2. Verify all URLs are correct
3. Check browser console for errors
4. Ensure network connectivity between all devices
