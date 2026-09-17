/**
 * textures.js — Procedural canvas-based PBR textures for Star Wars / Dune 'Used Universe' aesthetic
 */

import * as THREE from 'three';

/**
 * Creates weathered durasteel armor plating with panel seams, rivets, and grime
 */
export function createDurasteelTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Base metal gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#262930');
  grad.addColorStop(0.5, '#1b1d22');
  grad.addColorStop(1, '#141619');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Surface noise / scratches / grunge
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 22;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Panel seams
  ctx.strokeStyle = '#0a0b0e';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, width - 8, height - 8);
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  // Subtle bevel highlights
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.strokeRect(6, 6, width / 2 - 8, height / 2 - 8);
  ctx.strokeRect(width / 2 + 2, 6, width / 2 - 8, height / 2 - 8);
  ctx.strokeRect(6, height / 2 + 2, width / 2 - 8, height / 2 - 8);
  ctx.strokeRect(width / 2 + 2, height / 2 + 2, width / 2 - 8, height / 2 - 8);

  // Rivets at panel corners
  ctx.fillStyle = '#3a404c';
  const rivetCoords = [
    [16, 16], [width / 2 - 12, 16], [width / 2 + 12, 16], [width - 16, 16],
    [16, height / 2 - 12], [width - 16, height / 2 - 12],
    [16, height / 2 + 12], [width - 16, height / 2 + 12],
    [16, height - 16], [width / 2 - 12, height - 16], [width / 2 + 12, height - 16], [width - 16, height - 16]
  ];
  for (const [rx, ry] of rivetCoords) {
    ctx.beginPath();
    ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.stroke();
  }

  // Rust / dust streaks
  ctx.fillStyle = 'rgba(180, 110, 50, 0.09)';
  for (let s = 0; s < 6; s++) {
    const sx = Math.random() * width;
    const sy = Math.random() * (height * 0.4);
    const sw = 10 + Math.random() * 30;
    const sh = 40 + Math.random() * 120;
    ctx.fillRect(sx, sy, sw, sh);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Creates heavy industrial floor grating with drainage slots
 */
export function createFloorGrateTexture(width = 256, height = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Dark oily under-deck
  ctx.fillStyle = '#111317';
  ctx.fillRect(0, 0, width, height);

  // Grate bars
  ctx.fillStyle = '#262a33';
  ctx.strokeStyle = '#0e1014';
  ctx.lineWidth = 2;

  const barCount = 16;
  const step = width / barCount;
  for (let i = 0; i < barCount; i++) {
    const x = i * step;
    ctx.fillRect(x + 2, 0, step - 4, height);
    ctx.strokeRect(x + 2, 0, step - 4, height);
  }

  // Cross-brace slats
  for (let y = 0; y < height; y += step * 2) {
    ctx.fillStyle = '#1c1f26';
    ctx.fillRect(0, y, width, 4);
  }

  // Dust and grease patina
  ctx.fillStyle = 'rgba(140, 90, 40, 0.12)';
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

/**
 * Creates yellow/black industrial hazard chevrons
 */
export function createHazardStripesTexture(width = 256, height = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Weathered yellow background
  ctx.fillStyle = '#c89218';
  ctx.fillRect(0, 0, width, height);

  // Black stripes at 45 degrees
  ctx.fillStyle = '#141518';
  const stripeWidth = 24;
  for (let x = -height; x < width + height; x += stripeWidth * 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + stripeWidth, 0);
    ctx.lineTo(x + stripeWidth + height, height);
    ctx.lineTo(x + height, height);
    ctx.closePath();
    ctx.fill();
  }

  // Grime and scratches
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  for (let i = 0; i < 20; i++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    ctx.fillRect(rx, ry, Math.random() * 8, Math.random() * 3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Creates an analog CRT monitor texture with amber or green phosphor scanlines
 */
export function createCrtScreenTexture(title = 'TELEMETRY', type = 'amber') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const isAmber = type === 'amber';
  const primaryColor = isAmber ? '#ff9f1c' : '#38b000';
  const glowColor = isAmber ? 'rgba(255, 159, 28, 0.4)' : 'rgba(56, 176, 0, 0.4)';
  const dimColor = isAmber ? 'rgba(255, 159, 28, 0.25)' : 'rgba(56, 176, 0, 0.25)';

  // Dark phosphor cathode tube base
  ctx.fillStyle = isAmber ? '#160f05' : '#051408';
  ctx.fillRect(0, 0, 256, 256);

  // Phosphor scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  for (let y = 0; y < 256; y += 3) {
    ctx.fillRect(0, y, 256, 1.2);
  }

  // Header readout
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = primaryColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 4;
  ctx.fillText(`[ ${title.toUpperCase()} ]`, 14, 28);
  ctx.shadowBlur = 0;

  // Horizontal separator
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(14, 36);
  ctx.lineTo(242, 36);
  ctx.stroke();

  // Grid lines
  ctx.strokeStyle = dimColor;
  ctx.lineWidth = 0.5;
  for (let gx = 20; gx < 240; gx += 30) {
    ctx.beginPath();
    ctx.moveTo(gx, 45);
    ctx.lineTo(gx, 180);
    ctx.stroke();
  }
  for (let gy = 45; gy < 180; gy += 25) {
    ctx.beginPath();
    ctx.moveTo(20, gy);
    ctx.lineTo(236, gy);
    ctx.stroke();
  }

  // Oscilloscope wave or chemical spectrum
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(20, 110);
  for (let x = 20; x < 236; x += 4) {
    const y = 110 + Math.sin(x * 0.08) * 28 + Math.cos(x * 0.15) * 14;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Status telemetry readouts
  ctx.font = '11px monospace';
  ctx.fillStyle = primaryColor;
  ctx.fillText('SYS: AVALON-HELM   ORBIT: EREBUS', 16, 205);
  ctx.fillText('VECTOR: 044-STABLE WARP: STANDBY', 16, 224);
  ctx.fillText('STATUS: LOCKED // CALIB OK', 16, 242);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Creates an analog control panel texture with toggle switches and dial gauges
 */
export function createControlPanelTexture(width = 512, height = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Dark olive-charcoal chassis
  ctx.fillStyle = '#1c2024';
  ctx.fillRect(0, 0, width, height);

  // Surface texture
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 16;
    data[i] += n;
    data[i + 1] += n;
    data[i + 2] += n;
  }
  ctx.putImageData(imgData, 0, 0);

  // Dial Gauges
  const dials = [80, 180, 280];
  for (const dx of dials) {
    // Dial bezel
    ctx.beginPath();
    ctx.arc(dx, 70, 36, 0, Math.PI * 2);
    ctx.fillStyle = '#101215';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3e4552';
    ctx.stroke();

    // Dial face
    ctx.beginPath();
    ctx.arc(dx, 70, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#e8dec8';
    ctx.fill();

    // Ticks
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1.5;
    for (let angle = Math.PI * 0.75; angle <= Math.PI * 2.25; angle += Math.PI * 0.15) {
      const x1 = dx + Math.cos(angle) * 24;
      const y1 = 70 + Math.sin(angle) * 24;
      const x2 = dx + Math.cos(angle) * 30;
      const y2 = 70 + Math.sin(angle) * 30;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Needle
    const needleAngle = Math.PI * (1.1 + Math.random() * 0.8);
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(dx, 70);
    ctx.lineTo(dx + Math.cos(needleAngle) * 26, 70 + Math.sin(needleAngle) * 26);
    ctx.stroke();

    // Center pin
    ctx.beginPath();
    ctx.arc(dx, 70, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#333';
    ctx.fill();
  }

  // Switch bank
  ctx.fillStyle = '#121417';
  ctx.fillRect(40, 140, 432, 80);
  ctx.strokeStyle = '#323640';
  ctx.strokeRect(40, 140, 432, 80);

  // Individual toggle switches & lamps
  for (let s = 0; s < 8; s++) {
    const sx = 70 + s * 52;
    // Indicator lamp
    ctx.beginPath();
    ctx.arc(sx, 160, 6, 0, Math.PI * 2);
    ctx.fillStyle = s % 3 === 0 ? '#ff3b30' : s % 2 === 0 ? '#ff9f1c' : '#34c759';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.stroke();

    // Toggle switch base
    ctx.fillStyle = '#3a404a';
    ctx.fillRect(sx - 4, 178, 8, 26);
    // Switch lever
    ctx.fillStyle = '#b0b8c4';
    ctx.beginPath();
    ctx.arc(sx, s % 2 === 0 ? 184 : 198, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
