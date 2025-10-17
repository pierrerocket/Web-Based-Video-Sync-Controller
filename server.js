const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Serve static files from public directory
app.use(express.static('public'));

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
      if (client.role === 'player' && client.screen == data.screen) {
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
  console.log(`\n📺 TV Players:`);
  console.log(`   TV 1: http://localhost:${PORT}/tv1.html`);
  console.log(`   TV 2: http://localhost:${PORT}/tv2.html`);
  console.log(`   TV 3: http://localhost:${PORT}/tv3.html`);
  console.log(`   TV 4: http://localhost:${PORT}/tv4.html`);
  console.log(`\n🎮 Controller:`);
  console.log(`   http://localhost:${PORT}/controller.html`);
  console.log('\n' + '='.repeat(50));
  console.log(`💡 Use your local IP for Samsung TVs on the network`);
  console.log('='.repeat(50) + '\n');
});
