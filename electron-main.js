/**
 * Video Sync Application - Electron Main Process
 * Created by: Pierre R. Balian
 */

const { app, BrowserWindow, Menu, Tray, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let tray = null;
let serverProcess = null;
const SERVER_PORT = 8080;

// Start the Express server
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting Express server...');

    serverProcess = spawn('node', ['server.js'], {
      cwd: __dirname,
      env: { ...process.env, PORT: SERVER_PORT }
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });

    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
      reject(error);
    });

    // Give server a moment to start
    setTimeout(() => {
      console.log('Server started successfully');
      resolve();
    }, 2000);
  });
}

// Stop the Express server
function stopServer() {
  if (serverProcess) {
    console.log('Stopping Express server...');
    serverProcess.kill();
    serverProcess = null;
  }
}

// Create the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'Video Sync Controller',
    icon: path.join(__dirname, 'icon.png') // Optional: add an icon
  });

  // Load the controller interface
  mainWindow.loadURL(`http://localhost:${SERVER_PORT}/admin`);

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'Video Sync',
      submenu: [
        {
          label: 'About Video Sync',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Video Sync',
              message: 'Video Sync Application',
              detail: 'Created by: Pierre R. Balian\n\nSynchronized video playback system for multiple displays.'
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Open Admin Interface',
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(`http://localhost:${SERVER_PORT}/admin`);
            } else {
              createWindow();
            }
          }
        },
        {
          label: 'Open Choose Screen',
          click: () => {
            const chooseWindow = new BrowserWindow({
              width: 800,
              height: 600,
              webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
              }
            });
            chooseWindow.loadURL(`http://localhost:${SERVER_PORT}/choose`);
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Server URLs',
          click: () => {
            const networkInterfaces = require('os').networkInterfaces();
            let localIP = 'localhost';

            // Try to find local IP
            for (const name of Object.keys(networkInterfaces)) {
              for (const iface of networkInterfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                  localIP = iface.address;
                  break;
                }
              }
            }

            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Server URLs',
              message: 'Access these URLs from your devices:',
              detail: `Admin Interface:\nhttp://${localIP}:${SERVER_PORT}/admin\n\nChoose Screen:\nhttp://${localIP}:${SERVER_PORT}/choose\n\nDirect TV Links:\nTV 1: http://${localIP}:${SERVER_PORT}/1\nTV 2: http://${localIP}:${SERVER_PORT}/2\nTV 3: http://${localIP}:${SERVER_PORT}/3\nTV 4: http://${localIP}:${SERVER_PORT}/4`
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Create system tray icon (optional)
function createTray() {
  // Note: You'll need to add a tray icon image
  // tray = new Tray(path.join(__dirname, 'tray-icon.png'));

  // const contextMenu = Menu.buildFromTemplate([
  //   { label: 'Show App', click: () => { if (mainWindow) mainWindow.show(); } },
  //   { label: 'Quit', click: () => { app.quit(); } }
  // ]);

  // tray.setToolTip('Video Sync');
  // tray.setContextMenu(contextMenu);
}

// App lifecycle events
app.on('ready', async () => {
  try {
    await startServer();
    createWindow();
    // createTray(); // Uncomment if you add tray icons
  } catch (error) {
    console.error('Failed to start application:', error);
    dialog.showErrorBox('Startup Error', 'Failed to start the server. Please try again.');
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even if all windows are closed
  if (process.platform !== 'darwin') {
    stopServer();
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, recreate window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  stopServer();
});

// Handle any uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  dialog.showErrorBox('Application Error', error.message);
});
