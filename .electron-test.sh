#!/bin/bash
# Test script for Electron app
# Created by: Pierre R. Balian

echo "Testing Electron setup..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Run 'npm install' first."
    exit 1
fi

# Check if Electron is installed
if [ ! -d "node_modules/electron" ]; then
    echo "❌ Electron not installed. Run 'npm install' first."
    exit 1
fi

echo "✅ Dependencies installed"

# Check if electron-main.js exists
if [ ! -f "electron-main.js" ]; then
    echo "❌ electron-main.js not found"
    exit 1
fi

echo "✅ Electron main file exists"

# Check if server.js exists
if [ ! -f "server.js" ]; then
    echo "❌ server.js not found"
    exit 1
fi

echo "✅ Server file exists"

# Check if public directory exists
if [ ! -d "public" ]; then
    echo "❌ public directory not found"
    exit 1
fi

echo "✅ Public directory exists"

# Check if CSS is compiled
if [ ! -f "public/css/style.css" ]; then
    echo "⚠️  CSS not compiled. Running sass:build..."
    npm run sass:build
fi

echo "✅ CSS compiled"

echo ""
echo "🎉 Electron setup is complete!"
echo ""
echo "To run the app:"
echo "  npm run electron:dev    (with dev tools)"
echo "  npm run electron        (normal mode)"
echo ""
echo "To build Mac app:"
echo "  npm run build:mac"
echo ""
