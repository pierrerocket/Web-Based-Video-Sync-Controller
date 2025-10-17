const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'video-sync.log', maxsize: 5242880, maxFiles: 3 })
  ]
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public', 'videos');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename, sanitize it
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, Date.now() + '-' + sanitized);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    // Accept video files only
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'));
    }
  }
});

// URL rewrites for clean screen URLs
app.get('/1', (req, res) => res.redirect('/player.html?screen=1'));
app.get('/2', (req, res) => res.redirect('/player.html?screen=2'));
app.get('/3', (req, res) => res.redirect('/player.html?screen=3'));
app.get('/4', (req, res) => res.redirect('/player.html?screen=4'));

// Choose screen landing page
app.get('/choose', (req, res) => res.sendFile(path.join(__dirname, 'public', 'choose.html')));

// Serve static files from public directory
app.use(express.static('public'));
app.use(express.json());

// Profiles file path
const profilesPath = path.join(__dirname, 'profiles.json');
const currentConfigPath = path.join(__dirname, 'current-config.json');

// Load profiles from file
function loadProfiles() {
  if (fs.existsSync(profilesPath)) {
    try {
      const data = fs.readFileSync(profilesPath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error loading profiles:', err);
      return {};
    }
  }
  return {};
}

// Save profiles to file
function saveProfiles(profiles) {
  try {
    fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving profiles:', err);
    return false;
  }
}

// Load current configuration from file
function loadCurrentConfig() {
  if (fs.existsSync(currentConfigPath)) {
    try {
      const data = fs.readFileSync(currentConfigPath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error loading current config:', err);
      return null;
    }
  }
  return null;
}

// Save current configuration to file
function saveCurrentConfig(config) {
  try {
    fs.writeFileSync(currentConfigPath, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving current config:', err);
    return false;
  }
}

// Get list of all videos in the bucket
app.get('/list-videos', (req, res) => {
  const videosDir = path.join(__dirname, 'public', 'videos');

  // Ensure directory exists
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
    return res.json({ videos: [] });
  }

  try {
    const files = fs.readdirSync(videosDir);
    const videos = files
      .filter(file => {
        const filePath = path.join(videosDir, file);
        return fs.statSync(filePath).isFile();
      })
      .map(file => {
        const filePath = path.join(videosDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          url: `/videos/${file}`,
          size: stats.size,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.modified - a.modified); // Most recent first

    res.json({ videos });
  } catch (err) {
    console.error('Error listing videos:', err);
    res.status(500).json({ error: 'Error listing videos' });
  }
});

// Video upload endpoint
app.post('/upload-video', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file uploaded' });
  }

  // Return the public URL path for the uploaded video
  const videoUrl = `/videos/${req.file.filename}`;
  res.json({
    success: true,
    url: videoUrl,
    filename: req.file.filename,
    originalName: req.file.originalname
  });
});

// Get all profiles
app.get('/profiles', (req, res) => {
  const profiles = loadProfiles();
  res.json({ profiles });
});

// Save a profile
app.post('/profiles', (req, res) => {
  const { name, profile } = req.body;

  if (!name || !profile) {
    return res.status(400).json({ error: 'Profile name and data required' });
  }

  const profiles = loadProfiles();
  profiles[name] = {
    ...profile,
    savedAt: new Date().toISOString()
  };

  if (saveProfiles(profiles)) {
    res.json({ success: true, message: 'Profile saved' });
  } else {
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// Delete a profile
app.delete('/profiles/:name', (req, res) => {
  const { name } = req.params;
  const profiles = loadProfiles();

  if (profiles[name]) {
    delete profiles[name];
    if (saveProfiles(profiles)) {
      res.json({ success: true, message: 'Profile deleted' });
    } else {
      res.status(500).json({ error: 'Failed to delete profile' });
    }
  } else {
    res.status(404).json({ error: 'Profile not found' });
  }
});

// Get current configuration
app.get('/current-config', (req, res) => {
  const config = loadCurrentConfig();
  if (config) {
    res.json({ config });
  } else {
    // Return default config
    res.json({
      config: {
        gridRows: 2,
        gridCols: 2,
        displayCount: 4,
        assignments: {}
      }
    });
  }
});

// Save current configuration
app.post('/current-config', (req, res) => {
  const { config } = req.body;

  if (!config) {
    return res.status(400).json({ error: 'Configuration data required' });
  }

  if (saveCurrentConfig(config)) {
    res.json({ success: true, message: 'Configuration saved' });
  } else {
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

// Track connected clients
let connectedClients = new Map();

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Register client with their role and screen number
  socket.on('register', (data) => {
    connectedClients.set(socket.id, {
      role: data.role, // 'controller' or 'player'
      screen: data.screen || null,
      readyState: false,
      videoName: null,
      duration: null,
      estimatedFrames: null
    });
    console.log(`Registered ${data.role}${data.screen ? ` - Screen ${data.screen}` : ''}`);

    // Broadcast updated client list to all controllers
    broadcastClientStatus();
  });

  // Player ready state
  socket.on('player-ready', (data) => {
    const client = connectedClients.get(socket.id);
    if (client) {
      client.readyState = true;
      console.log(`Screen ${data.screen} is ready`);
      broadcastClientStatus();
    }
  });

  // Video metadata from player
  socket.on('video-metadata', (data) => {
    const client = connectedClients.get(socket.id);
    if (client) {
      client.duration = data.duration;
      client.estimatedFrames = data.estimatedFrames;
      console.log(`Screen ${data.screen} metadata: ${data.duration}s, ~${data.estimatedFrames} frames`);
      broadcastClientStatus();
    }
  });

  // Load video on specific screen
  socket.on('load-screen', (data) => {
    console.log(`Loading video on screen ${data.screen}: ${data.videoName}`);

    // Update client video name
    connectedClients.forEach((client, id) => {
      if (client.role === 'player' && client.screen === data.screen) {
        client.videoName = data.videoName;
        client.readyState = false;
      }
    });

    // Send to specific screen only
    io.emit('load-screen', data);
    broadcastClientStatus();
  });

  // Play all screens
  socket.on('play-all', (data) => {
    console.log('Broadcasting PLAY ALL command');
    io.emit('play-all', data);
  });

  // Pause all screens
  socket.on('pause-all', () => {
    console.log('Broadcasting PAUSE ALL command');
    io.emit('pause-all');
  });

  // Stop all screens
  socket.on('stop-all', () => {
    console.log('Broadcasting STOP ALL command');
    io.emit('stop-all');

    // Reset all client states
    connectedClients.forEach((client) => {
      if (client.role === 'player') {
        client.readyState = false;
        client.videoName = null;
      }
    });
    broadcastClientStatus();
  });

  // Sync all screens
  socket.on('sync-all', (data) => {
    console.log('Broadcasting SYNC ALL command');
    io.emit('sync-all', data);
  });

  // Seek all screens
  socket.on('seek-all', (data) => {
    console.log(`Broadcasting SEEK ALL command to ${data.time}s`);
    io.emit('seek-all', data);
  });

  // Set loop duration for all screens
  socket.on('set-loop-duration', (data) => {
    console.log(`Setting loop duration: ${data.duration ? data.duration + 's' : 'natural'}`);
    io.emit('set-loop-duration', data);
  });

  // Show/hide screen labels
  socket.on('toggle-labels', (data) => {
    const msg = `Setting screen labels visibility: ${data.show ? 'visible' : 'hidden'}`;
    console.log(msg);
    logger.info(msg);
    io.emit('toggle-labels', data);
    logger.info(`Broadcasted toggle-labels to all clients: ${JSON.stringify(data)}`);
  });

  // Client log forwarding
  socket.on('client-log', (data) => {
    logger.info(`[CLIENT ${data.clientType}-${data.screen || 'unknown'}] ${data.message}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    connectedClients.delete(socket.id);
    broadcastClientStatus();
  });
});

function broadcastClientStatus() {
  const status = Array.from(connectedClients.values()).filter(c => c.role === 'player');
  io.emit('client-status', status);
}

const PORT = process.env.PORT || 8080;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log(`🎬 Video Sync Server Running`);
  console.log('='.repeat(50));
  console.log(`\n📺 Choose Screen (Start Here!):`);
  console.log(`   http://localhost:${PORT}/choose`);
  console.log(`\n📺 Direct TV Links:`);
  console.log(`   TV 1: http://localhost:${PORT}/1`);
  console.log(`   TV 2: http://localhost:${PORT}/2`);
  console.log(`   TV 3: http://localhost:${PORT}/3`);
  console.log(`   TV 4: http://localhost:${PORT}/4`);
  console.log(`\n🎮 Controller:`);
  console.log(`   http://localhost:${PORT}/controller.html`);
  console.log('\n' + '='.repeat(50));
  console.log(`💡 Use your local IP for Samsung TVs on the network`);
  console.log('='.repeat(50) + '\n');
});
