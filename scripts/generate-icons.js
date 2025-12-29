// Script to generate PWA icons using canvas
// Run with: node scripts/generate-icons.js
// Requires: npm install canvas

const fs = require('fs');
const path = require('path');

try {
  const { createCanvas } = require('canvas');
  
  function drawIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background gradient (blue)
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#2563eb');
    gradient.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Draw graduation cap icon
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = size / 20;
    
    // Cap base (trapezoid)
    const baseY = size * 0.6;
    ctx.beginPath();
    ctx.moveTo(size * 0.15, baseY);
    ctx.lineTo(size * 0.35, size * 0.4);
    ctx.lineTo(size * 0.65, size * 0.4);
    ctx.lineTo(size * 0.85, baseY);
    ctx.closePath();
    ctx.fill();
    
    // Cap top (square)
    const squareSize = size * 0.25;
    const squareX = size * 0.375;
    const squareY = size * 0.35;
    ctx.fillRect(squareX, squareY, squareSize, squareSize);
    
    // Tassel
    ctx.beginPath();
    ctx.moveTo(size * 0.5, size * 0.6);
    ctx.lineTo(size * 0.5, size * 0.75);
    ctx.lineTo(size * 0.45, size * 0.8);
    ctx.lineTo(size * 0.5, size * 0.75);
    ctx.lineTo(size * 0.55, size * 0.8);
    ctx.stroke();
    
    return canvas;
  }
  
  // Create public directory if it doesn't exist
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Generate 192x192 icon
  const icon192 = drawIcon(192);
  const icon192Path = path.join(publicDir, 'icon-192.png');
  const icon192Buffer = icon192.toBuffer('image/png');
  fs.writeFileSync(icon192Path, icon192Buffer);
  console.log('✓ Generated icon-192.png');
  
  // Generate 512x512 icon
  const icon512 = drawIcon(512);
  const icon512Path = path.join(publicDir, 'icon-512.png');
  const icon512Buffer = icon512.toBuffer('image/png');
  fs.writeFileSync(icon512Path, icon512Buffer);
  console.log('✓ Generated icon-512.png');
  
  console.log('\n✅ Icons generated successfully!');
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.log('❌ Canvas module not found. Installing...');
    console.log('Please run: npm install canvas');
    console.log('\nOr use the HTML generator:');
    console.log('1. Open generate-icons.html in your browser');
    console.log('2. Right-click each canvas and save as PNG');
    console.log('3. Save as icon-192.png and icon-512.png in public/ folder');
  } else {
    console.error('Error:', error.message);
  }
}

