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
  const dimColor = isAmber ? 'rgba(255, 159, 28, 0.22)' : 'rgba(56, 176, 0, 0.22)';

  // Dark phosphor cathode tube base
  ctx.fillStyle = isAmber ? '#160f05' : '#051408';
  ctx.fillRect(0, 0, 256, 256);

  // Phosphor scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  for (let y = 0; y < 256; y += 3) {
    ctx.fillRect(0, y, 256, 1.2);
  }

  // CRT curvature vignette
  const grad = ctx.createRadialGradient(128, 128, 80, 128, 128, 150);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Header readout
  ctx.font = 'bold 15px monospace';
  ctx.fillStyle = primaryColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 4;
  ctx.fillText(`[ ${title.toUpperCase()} ]`, 14, 26);
  ctx.shadowBlur = 0;

  // Horizontal separator
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(14, 34);
  ctx.lineTo(242, 34);
  ctx.stroke();

  if (title.toUpperCase().includes('RADAR')) {
    // Radar concentric rings & sweep
    const cx = 128;
    const cy = 115;
    ctx.strokeStyle = dimColor;
    ctx.lineWidth = 1;
    for (let r of [25, 50, 75]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - 80, cy);
    ctx.lineTo(cx + 80, cy);
    ctx.moveTo(cx, cy - 80);
    ctx.lineTo(cx, cy + 80);
    ctx.stroke();

    // Radar sweep sector
    ctx.fillStyle = isAmber ? 'rgba(255, 159, 28, 0.15)' : 'rgba(56, 176, 0, 0.15)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 75, 0.8, 1.6);
    ctx.closePath();
    ctx.fill();

    // Contact blips
    ctx.fillStyle = primaryColor;
    for (const [bx, by] of [[cx + 35, cy - 22], [cx - 42, cy + 30], [cx + 15, cy + 50]]) {
      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = '10px monospace';
    ctx.fillText('TRACK: 03 CONTACTS   RANGE: 120 KM', 16, 215);
    ctx.fillText('STATUS: PASSIVE SWEEP // AZ: 044°', 16, 235);
  } else if (title.toUpperCase().includes('REACTOR')) {
    // Reactor bar meters
    const labels = ['CORE TEMP', 'MAG FLUX', 'COOLANT', 'PURGE'];
    const values = [0.72, 0.88, 0.65, 0.3];
    ctx.font = '11px monospace';
    for (let i = 0; i < 4; i++) {
      const y = 60 + i * 32;
      ctx.fillStyle = primaryColor;
      ctx.fillText(labels[i], 16, y);

      // Meter frame
      ctx.strokeStyle = dimColor;
      ctx.strokeRect(100, y - 10, 136, 12);

      // Meter fill
      ctx.fillStyle = i === 0 && values[i] > 0.8 ? '#ff3b30' : primaryColor;
      ctx.fillRect(102, y - 8, Math.round(132 * values[i]), 8);
    }
    ctx.font = '10px monospace';
    ctx.fillStyle = primaryColor;
    ctx.fillText('OUTPUT: 4.8 GW   EFFICIENCY: 94.2%', 16, 215);
    ctx.fillText('CONTAINMENT: STABLE // SYS OK', 16, 235);
  } else if (title.toUpperCase().includes('SPECTRUM') || title.toUpperCase().includes('ANALYSIS')) {
    // Frequency spectrum bars
    const barCount = 18;
    const barW = 10;
    const startX = 22;
    for (let b = 0; b < barCount; b++) {
      const h = 20 + Math.sin(b * 0.45) * 35 + Math.cos(b * 0.9) * 25 + (b % 3 === 0 ? 30 : 0);
      const clampedH = Math.max(8, Math.min(110, h));
      ctx.fillStyle = primaryColor;
      ctx.fillRect(startX + b * 12, 175 - clampedH, barW, clampedH);
    }
    // Baseline
    ctx.strokeStyle = dimColor;
    ctx.beginPath();
    ctx.moveTo(18, 176);
    ctx.lineTo(238, 176);
    ctx.stroke();

    ctx.font = '10px monospace';
    ctx.fillStyle = primaryColor;
    ctx.fillText('BAND: 1420.4 MHz // CH-9 SUB-C', 16, 215);
    ctx.fillText('SNR: +24.6 dB    MOD: FREQ-SHIFT', 16, 235);
  } else {
    // Standard Telemetry & Oscilloscope
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

    ctx.font = '11px monospace';
    ctx.fillStyle = primaryColor;
    ctx.fillText('SYS: AVALON-HELM   ORBIT: EREBUS', 16, 205);
    ctx.fillText('VECTOR: 044-STABLE WARP: STANDBY', 16, 224);
    ctx.fillText('STATUS: LOCKED // CALIB OK', 16, 242);
  }

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

/**
 * Creates 3D Holographic mission projection texture for Star Map holo-table
 */
export function createQuestHoloTexture(cleared = 0, total = 20, transmission = '') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Dark holo emitter ground
  ctx.fillStyle = '#0e0c08';
  ctx.fillRect(0, 0, 512, 256);

  // Scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  for (let y = 0; y < 256; y += 3) {
    ctx.fillRect(0, y, 512, 1.2);
  }

  // Border & corner clips
  ctx.strokeStyle = '#d99423';
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 12, 488, 232);

  // Eyebrow
  ctx.font = 'bold 13px monospace';
  ctx.fillStyle = '#d99423';
  ctx.fillText('// PRIMARY OBJECTIVE · SECTOR 01 //', 24, 36);

  // Title
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#e8e0d0';
  ctx.fillText('EREBUS · THE CHARGE GARDENS', 24, 68);

  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#c39a63';
  ctx.fillText('"Find what pulls. Draw the line."', 24, 88);

  // Status & Pylon progress
  ctx.strokeStyle = '#2e2a26';
  ctx.beginPath();
  ctx.moveTo(24, 102);
  ctx.lineTo(488, 102);
  ctx.stroke();

  ctx.font = 'bold 15px monospace';
  ctx.fillStyle = cleared >= total ? '#6f8f3f' : '#d99423';
  ctx.fillText(`PYLON GRID STATUS: ${cleared} / ${total} RESTORED`, 24, 126);

  // Mini pylon bar
  const barW = 464;
  const step = barW / total;
  for (let i = 0; i < total; i++) {
    const isLit = i < cleared;
    ctx.fillStyle = isLit ? '#6f8f3f' : '#2a2724';
    ctx.fillRect(24 + i * step + 1, 136, step - 3, 10);
  }

  // Transmission excerpt
  const msg = transmission || 'Pylons await connection. Check gauges before committing.';
  ctx.font = 'italic 12px monospace';
  ctx.fillStyle = '#8f8678';
  const truncated = msg.length > 58 ? msg.slice(0, 56) + '…' : msg;
  ctx.fillText(`VESS: "${truncated}"`, 24, 175);

  // CTA
  ctx.fillStyle = '#1f1d1a';
  ctx.fillRect(24, 192, 464, 38);
  ctx.strokeStyle = '#d99423';
  ctx.strokeRect(24, 192, 464, 38);

  ctx.font = 'bold 13px monospace';
  ctx.fillStyle = '#d99423';
  ctx.textAlign = 'center';
  ctx.fillText('[E] / CLICK HOLO-TABLE TO DISEMBARK', 256, 216);
  ctx.textAlign = 'left';

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Creates 3D CRT Monitor texture for Comms room displaying live Standings & intercepted chatter
 */
export function createCommsStandingsTexture(teams = [], chatter = '') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Cathode phosphor background
  ctx.fillStyle = '#061208';
  ctx.fillRect(0, 0, 512, 256);

  // Scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  for (let y = 0; y < 256; y += 3) {
    ctx.fillRect(0, y, 512, 1.2);
  }

  // CRT bezel border
  ctx.strokeStyle = '#38b000';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(10, 10, 492, 236);

  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = '#38b000';
  ctx.fillText('[ FLEET COMMS // GUILD STANDINGS ]', 22, 34);

  // Guild leaderboard rows
  const defaultTeams = [
    { rank: 1, name: 'THERMAL SMELTERS', score: 1840 },
    { rank: 2, name: 'MINERAL MINING', score: 1620 },
    { rank: 3, name: 'MOISTURE RIGS', score: 1450 },
    { rank: 4, name: 'ATMOSPHERIC HARVESTERS', score: 1290 }
  ];
  const list = (teams && teams.length > 0) ? teams : defaultTeams;

  ctx.font = '12px monospace';
  let yPos = 62;
  list.slice(0, 4).forEach((t, idx) => {
    const r = String(t.rank || idx + 1).padStart(2, '0');
    const nm = (t.name || t.team_id || 'GUILD').toUpperCase();
    const sc = `${t.team_score || t.score || 0} XP`;
    ctx.fillStyle = idx === 0 ? '#ff9f1c' : '#8fb055';
    ctx.fillText(`${r}  ${nm.padEnd(28, '.')} ${sc}`, 22, yPos);
    yPos += 22;
  });

  // Divider
  ctx.strokeStyle = 'rgba(56, 176, 0, 0.3)';
  ctx.beginPath();
  ctx.moveTo(22, 158);
  ctx.lineTo(490, 158);
  ctx.stroke();

  // Chatter snippet
  ctx.font = '11px monospace';
  ctx.fillStyle = '#6f8f3f';
  ctx.fillText('INTERCEPTED FLEET TRAFFIC:', 22, 178);
  ctx.fillStyle = '#ff9f1c';
  const chat = chatter || 'Thermal Smelters: "Core temp nominal on Pylon 12. Transfer arc locked."';
  const truncatedChat = chat.length > 56 ? chat.slice(0, 54) + '…' : chat;
  ctx.fillText(truncatedChat, 22, 198);

  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = '#38b000';
  ctx.fillText('PRESS [E] / CLICK CONSOLE TO ACCESS FULL FLEET COMMS', 22, 226);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Creates 3D Cargo Manifest texture for Cargo Hold containers & terminals
 */
export function createCargoManifestTexture(itemCount = 0, maxSlots = 8, trinketName = '') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Industrial durasteel amber terminal background
  ctx.fillStyle = '#15130f';
  ctx.fillRect(0, 0, 512, 256);

  // Scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  for (let y = 0; y < 256; y += 3) {
    ctx.fillRect(0, y, 512, 1.2);
  }

  // Border
  ctx.strokeStyle = '#c89218';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 492, 236);

  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = '#ff9f1c';
  ctx.fillText('[ CARGO HOLD 04 // SPICE & REFINERY SALVAGE ]', 22, 34);

  // Stats
  ctx.font = '13px monospace';
  ctx.fillStyle = '#e8e0d0';
  ctx.fillText(`CAPACITY: ${itemCount} / ${maxSlots} SLOTS OCCUPIED`, 22, 68);

  const tName = trinketName || 'Standard Cadet Issue';
  ctx.fillStyle = '#c39a63';
  ctx.fillText(`PERSONAL LOCKER: ${tName.toUpperCase()}`, 22, 94);

  ctx.strokeStyle = '#2e2a26';
  ctx.beginPath();
  ctx.moveTo(22, 110);
  ctx.lineTo(490, 110);
  ctx.stroke();

  // Manifest items list
  ctx.font = '12px monospace';
  ctx.fillStyle = '#8f8678';
  ctx.fillText('• SPICE RESONANCE MATRIX [EPIC] — PRIMARY HOUSING', 22, 134);
  ctx.fillText('• REFINERY SENSOR ARRAYS & LOGIC CORES [COMMON]', 22, 156);
  ctx.fillText('• ABLATIVE CRYO-COOLANT CANISTERS [TROPHY]', 22, 178);

  // CTA
  ctx.fillStyle = '#1f1d1a';
  ctx.fillRect(22, 196, 468, 34);
  ctx.strokeStyle = '#c89218';
  ctx.strokeRect(22, 196, 468, 34);

  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = '#ff9f1c';
  ctx.textAlign = 'center';
  ctx.fillText('[E] / CLICK TERMINAL TO DEPLOY SALVAGE & VIEW LOCKER', 256, 218);
  ctx.textAlign = 'left';

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Creates tangent-space normal map for durasteel armor plating with seams & rivets
 */
export function createDurasteelNormalTexture(width = 256, height = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  // Flat normal is RGB(128, 128, 255)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 128;
    data[i + 1] = 128;
    data[i + 2] = 255;
    data[i + 3] = 255;
  }

  // Panel seam depressions (beveled normals)
  const drawSeam = (x0, y0, x1, y1) => {
    if (x0 === x1) {
      // Vertical seam
      const x = Math.round(x0);
      for (let y = Math.max(0, y0); y < Math.min(height, y1); y++) {
        if (x > 0) {
          const idx = (y * width + (x - 1)) * 4;
          data[idx] = 90; // Left bevel points left
        }
        if (x < width - 1) {
          const idx = (y * width + (x + 1)) * 4;
          data[idx] = 165; // Right bevel points right
        }
      }
    } else {
      // Horizontal seam
      const y = Math.round(y0);
      for (let x = Math.max(0, x0); x < Math.min(width, x1); x++) {
        if (y > 0) {
          const idx = ((y - 1) * width + x) * 4;
          data[idx + 1] = 90; // Top bevel points up
        }
        if (y < height - 1) {
          const idx = ((y + 1) * width + x) * 4;
          data[idx + 1] = 165; // Bottom bevel points down
        }
      }
    }
  };

  drawSeam(width / 2, 0, width / 2, height);
  drawSeam(0, height / 2, width, height / 2);
  drawSeam(4, 0, 4, height);
  drawSeam(width - 4, 0, width - 4, height);
  drawSeam(0, 4, width, 4);
  drawSeam(0, height - 4, width, height - 4);

  // Rivet dome bumps
  const rivetCoords = [
    [16, 16], [width / 2 - 12, 16], [width / 2 + 12, 16], [width - 16, 16],
    [16, height / 2 - 12], [width - 16, height / 2 - 12],
    [16, height / 2 + 12], [width - 16, height / 2 + 12],
    [16, height - 16], [width / 2 - 12, height - 16], [width / 2 + 12, height - 16], [width - 16, height - 16]
  ];
  const rRad = 4;
  for (const [rx, ry] of rivetCoords) {
    for (let dy = -rRad; dy <= rRad; dy++) {
      for (let dx = -rRad; dx <= rRad; dx++) {
        const d = Math.hypot(dx, dy);
        if (d <= rRad && d > 0) {
          const px = Math.round(rx + dx);
          const py = Math.round(ry + dy);
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const idx = (py * width + px) * 4;
            const nx = (dx / rRad) * 0.7;
            const ny = (dy / rRad) * 0.7;
            const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
            data[idx] = Math.round((nx * 0.5 + 0.5) * 255);
            data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
            data[idx + 2] = Math.round(nz * 255);
          }
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Creates heavy blast door texture matching airlock.jpg
 */
export function createBlastDoorTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Weathered dark olive/durasteel base
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#22252a');
  grad.addColorStop(0.5, '#191b20');
  grad.addColorStop(1, '#131518');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Surface grunge
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 20;
    data[i] = Math.min(255, Math.max(0, data[i] + n));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
  }
  ctx.putImageData(imgData, 0, 0);

  // Outer chamfered blast frame
  ctx.strokeStyle = '#0e1014';
  ctx.lineWidth = 8;
  ctx.strokeRect(12, 12, width - 24, height - 24);

  // Top & bottom hazard chevron borders
  const hH = 32;
  for (const yOff of [16, height - 48]) {
    ctx.fillStyle = '#c89218';
    ctx.fillRect(16, yOff, width - 32, hH);
    ctx.fillStyle = '#141518';
    for (let x = -hH; x < width + hH; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, yOff);
      ctx.lineTo(x + 18, yOff);
      ctx.lineTo(x + 18 + hH, yOff + hH);
      ctx.lineTo(x + hH, yOff + hH);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Central reinforced view glass frame
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 76, 0, Math.PI * 2);
  ctx.fillStyle = '#121418';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#383e4c';
  ctx.stroke();

  // Glass pane
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 64, 0, Math.PI * 2);
  ctx.fillStyle = '#0a1014';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 159, 28, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Hex bolts around window
  for (let a = 0; a < 8; a++) {
    const angle = a * (Math.PI * 2 / 8);
    const bx = width / 2 + Math.cos(angle) * 70;
    const by = height / 2 + Math.sin(angle) * 70;
    ctx.beginPath();
    ctx.arc(bx, by, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#5c667a';
    ctx.fill();
  }

  // Stenciled Door Markings
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#d99423';
  ctx.textAlign = 'center';
  ctx.fillText('// AIRLOCK BAY 01 //', width / 2, 80);

  ctx.font = '11px monospace';
  ctx.fillStyle = '#8f8678';
  ctx.fillText('DANGER: RAPID DECOMPRESSION RISK', width / 2, 102);
  ctx.fillText('SEAL INTEGRITY: MONITORED // AUTO-LOCK ON VACUUM', width / 2, 120);

  ctx.fillText('DO NOT CYCLE WITHOUT EVA GEAR', width / 2, height - 88);
  ctx.fillText('HYDRAULIC DOGGING LOCK: ENGAGED', width / 2, height - 68);
  ctx.textAlign = 'left';

  // Heavy reinforcement cross seams
  ctx.strokeStyle = '#101216';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(32, height / 2);
  ctx.lineTo(width / 2 - 80, height / 2);
  ctx.moveTo(width / 2 + 80, height / 2);
  ctx.lineTo(width - 32, height / 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Creates 19-inch equipment rack panel face for Comms & Bridge
 */
export function createRackPanelTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Dark anodized plate
  ctx.fillStyle = '#16181c';
  ctx.fillRect(0, 0, width, height);

  // 4 modular rack units (4U)
  const unitH = height / 4;
  for (let u = 0; u < 4; u++) {
    const uy = u * unitH;

    // Unit panel border
    ctx.strokeStyle = '#2a2e38';
    ctx.lineWidth = 2;
    ctx.strokeRect(12, uy + 4, width - 24, unitH - 8);

    // Corner thumbscrews
    ctx.fillStyle = '#3f4552';
    for (const [sx, sy] of [[18, uy + 12], [width - 18, uy + 12], [18, uy + unitH - 12], [width - 18, uy + unitH - 12]]) {
      ctx.beginPath();
      ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cooling louvers on right half
    ctx.fillStyle = '#0a0b0e';
    for (let l = 0; l < 8; l++) {
      ctx.fillRect(width - 160, uy + 20 + l * 10, 130, 4);
    }

    // Stencil header
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#d99423';
    const titles = ['CH-01 // COMM RECEIVER', 'CH-02 // SUB-CARRIER RX', 'CH-03 // RELAY BUS MATRIX', 'CH-04 // RF DEMODULATOR'];
    ctx.fillText(titles[u], 32, uy + 26);

    // Jack socket matrix (for patch cables)
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 6; col++) {
        const jx = 36 + col * 28;
        const jy = uy + 50 + row * 26;
        ctx.beginPath();
        ctx.arc(jx, jy, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#0c0e11';
        ctx.fill();
        ctx.strokeStyle = '#5a6275';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(jx, jy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#1c2028';
        ctx.fill();
      }
    }

    // LED status dots
    for (let d = 0; d < 3; d++) {
      ctx.beginPath();
      ctx.arc(220 + d * 16, uy + 22, 3, 0, Math.PI * 2);
      ctx.fillStyle = d === 0 ? '#ff3b30' : (d === 1 ? '#ff9f1c' : '#38b000');
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Creates stenciled metal footlocker texture for Crew Quarters
 */
export function createFootlockerTexture(width = 512, height = 256, label = 'CREW 12 // J. ORTEGA') {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Weathered military olive/durasteel casing
  ctx.fillStyle = '#262923';
  ctx.fillRect(0, 0, width, height);

  // Surface noise & scratches
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 16;
    data[i] += n;
    data[i + 1] += n;
    data[i + 2] += n;
  }
  ctx.putImageData(imgData, 0, 0);

  // Heavy metal reinforcement corner brackets
  ctx.fillStyle = '#181a17';
  const cSize = 40;
  ctx.fillRect(8, 8, cSize, cSize);
  ctx.fillRect(width - 8 - cSize, 8, cSize, cSize);
  ctx.fillRect(8, height - 8 - cSize, cSize, cSize);
  ctx.fillRect(width - 8 - cSize, height - 8 - cSize, cSize, cSize);

  // Rivets on corners
  ctx.fillStyle = '#454a40';
  for (const [rx, ry] of [[18, 18], [width - 18, 18], [18, height - 18], [width - 18, height - 18]]) {
    ctx.beginPath();
    ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Recessed central latch handle
  ctx.fillStyle = '#121411';
  ctx.fillRect(width / 2 - 45, height / 2 - 25, 90, 50);
  ctx.strokeStyle = '#3e423a';
  ctx.lineWidth = 2;
  ctx.strokeRect(width / 2 - 45, height / 2 - 25, 90, 50);

  // Brass handle bar
  ctx.fillStyle = '#826732';
  ctx.fillRect(width / 2 - 30, height / 2 - 6, 60, 12);

  // Stenciled crew name & serial
  ctx.font = 'bold 15px monospace';
  ctx.fillStyle = '#d99423';
  ctx.fillText(`[ ${label.toUpperCase()} ]`, 54, 50);

  ctx.font = '11px monospace';
  ctx.fillStyle = '#8f8678';
  ctx.fillText('AVALON DEEP SALVAGE // BERTH 02', 54, 72);
  ctx.fillText('PERSONAL LOCKER · AUTH ID REQUIRED', 54, height - 38);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Creates industrial shipping container panel texture for Cargo Hold
 */
export function createContainerStencilTexture(width = 512, height = 512, guildCode = 'MM', serial = '44-B') {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Weathered sand-brown/durasteel paint
  ctx.fillStyle = '#2d2822';
  ctx.fillRect(0, 0, width, height);

  // Vertical corrugation ribs
  for (let x = 20; x < width - 20; x += 32) {
    ctx.fillStyle = '#1a1714';
    ctx.fillRect(x, 10, 16, height - 20);
    ctx.fillStyle = '#3a342c';
    ctx.fillRect(x + 16, 10, 16, height - 20);
  }

  // Stencil plate plaque in center
  ctx.fillStyle = '#161411';
  ctx.fillRect(40, 140, width - 80, 230);
  ctx.strokeStyle = '#c89218';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 140, width - 80, 230);

  // Guild Header
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#d99423';
  ctx.fillText(`GUILD FREIGHT // ${guildCode}`, 60, 180);

  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = '#e8dec8';
  ctx.fillText(`CONTAINER UNIT: ${serial}`, 60, 215);

  ctx.font = '12px monospace';
  ctx.fillStyle = '#8f8678';
  ctx.fillText('CONTENTS: REFINERY SALVAGE & CORES', 60, 245);
  ctx.fillText('MAX TARE: 1,450 KG   NET: 5,200 KG', 60, 270);
  ctx.fillText('SEAL PROTOCOL: IMPERIAL-STANDARD', 60, 295);

  ctx.fillStyle = '#c92a2a';
  ctx.fillText('// NON-PRESSURIZED CARGO UNIT //', 60, 335);

  // Corner hazard chevrons
  for (const yOff of [10, height - 38]) {
    ctx.fillStyle = '#c89218';
    ctx.fillRect(width - 120, yOff, 100, 26);
    ctx.fillStyle = '#141518';
    for (let x = width - 120; x < width - 20; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, yOff);
      ctx.lineTo(x + 10, yOff);
      ctx.lineTo(x + 24, yOff + 26);
      ctx.lineTo(x + 14, yOff + 26);
      ctx.closePath();
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Creates mechanical terminal keyboard texture for Bridge and Helm consoles
 */
export function createKeyboardTexture(width = 512, height = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Dark chassis well
  ctx.fillStyle = '#121417';
  ctx.fillRect(0, 0, width, height);

  // Recessed frame
  ctx.strokeStyle = '#282c36';
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, width - 12, height - 12);

  // Key rows
  const rowCount = 5;
  const keyH = 34;
  for (let r = 0; r < rowCount; r++) {
    const y = 16 + r * 44;
    const colCount = r === 4 ? 8 : 14;
    for (let c = 0; c < colCount; c++) {
      let keyW = 28;
      let x = 16 + c * 33;
      if (r === 4 && c === 3) {
        keyW = 120; // Spacebar
      } else if (r === 4 && c > 3) {
        x += 92;
      }
      // Key body
      ctx.fillStyle = '#1f2228';
      ctx.fillRect(x, y, keyW, keyH);

      // Key top bevel
      ctx.strokeStyle = '#383e4c';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, keyW, keyH);

      // Keycap surface
      ctx.fillStyle = '#2b2f38';
      ctx.fillRect(x + 2, y + 2, keyW - 4, keyH - 8);
    }
  }

  // Status LED lamps
  for (let l = 0; l < 3; l++) {
    ctx.beginPath();
    ctx.arc(width - 35 + l * 10, 12, 2, 0, Math.PI * 2);
    ctx.fillStyle = l === 0 ? '#38b000' : '#ff9f1c';
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Creates circular analog dial gauge texture
 */
export function createDialGaugeTexture(width = 256, height = 256, title = 'PSI') {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const cx = width / 2;
  const cy = height / 2;
  const radius = width / 2 - 12;

  // Outer bezel
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#181a1e';
  ctx.fill();
  ctx.strokeStyle = '#4b5363';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Faceplate
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 8, 0, Math.PI * 2);
  ctx.fillStyle = '#ded6c0';
  ctx.fill();

  // Warning danger red arc (from angle 0.1 to 0.45 * PI)
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 16, Math.PI * 0.1, Math.PI * 0.45);
  ctx.strokeStyle = '#c92a2a';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Calibration ticks
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  for (let a = Math.PI * 0.75; a <= Math.PI * 2.25; a += Math.PI * 0.1) {
    const x1 = cx + Math.cos(a) * (radius - 28);
    const y1 = cy + Math.sin(a) * (radius - 28);
    const x2 = cx + Math.cos(a) * (radius - 12);
    const y2 = cy + Math.sin(a) * (radius - 12);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Dial title
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.fillText(title.toUpperCase(), cx, cy + 35);
  ctx.fillText('PRESSURE', cx, cy + 50);

  // Pivot Needle
  const needleAngle = Math.PI * 1.35;
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(needleAngle) * (radius - 18), cy + Math.sin(needleAngle) * (radius - 18));
  ctx.stroke();

  // Center cap
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#111';
  ctx.fill();

  // Subtle glass highlight
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 12, Math.PI * 1.1, Math.PI * 1.6);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 4;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Creates vacuum tube glow texture for Comms array
 */
export function createVacuumTubeTexture(width = 128, height = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Dark glass envelope
  ctx.fillStyle = 'rgba(10, 12, 16, 0.7)';
  ctx.fillRect(0, 0, width, height);

  // Internal anode plates
  ctx.fillStyle = '#22262e';
  ctx.fillRect(34, 40, 60, 160);

  // Glowing orange/amber filament coil
  ctx.strokeStyle = '#ff9f1c';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#d99423';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  for (let y = 60; y < 180; y += 12) {
    ctx.moveTo(44, y);
    ctx.lineTo(84, y + 6);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Glass reflection highlights
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.fillRect(16, 30, 8, 190);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

