/**
 * cutscene/worlds-b.js — arrival cutscenes for Ember Reach, Mirrowen, Kettle, Teeter and Verdigris.
 */

import { C, W, H, TAU, win, span, lerp, alpha, rng, person, fifthMark, block, heatLines, drift, held } from './kit.js';
import { scape, at } from './scape.js';

const GY = 560;

// ---------------------------------------------------------------- Ember Reach: the volcano heat is drained away

const EMBER = {
  sky: [[0, '#0e0808'], [0.45, '#2a1410'], [0.8, '#5a2414'], [1, '#8a3618']], far: '#1a120e', mid: '#221812', ground: ['#2a221c', '#0e0c0a'],
  gy: GY, seed: 61, stars: 50, farAmp: 30, midAmp: 22, haze: 'rgba(154, 74, 46, 0.14)',
  light: { x: 1000, y: 540, color: '236, 110, 46', power: 1 }, clouds: 8, rays: 0.03
};

function volcano(ctx, x, gy, clock) {
  ctx.fillStyle = '#1d1512';
  ctx.beginPath();
  ctx.moveTo(x - 360, gy); ctx.lineTo(x - 60, gy - 300); ctx.lineTo(x + 60, gy - 300); ctx.lineTo(x + 360, gy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(200, 96, 40, ${0.6 + 0.15 * Math.sin(clock * 1.3)})`;
  ctx.fillRect(x - 50, gy - 304, 100, 6);
  ctx.fillStyle = 'rgba(90, 70, 60, 0.35)';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(x + Math.sin(clock * 0.3 + i) * 20, gy - 340 - i * 34, 50 + i * 16, 20 + i * 4, 0, 0, TAU);
    ctx.fill();
  }
}

function shelter(ctx, x, gy, lit) {
  ctx.fillStyle = '#2a2420';
  ctx.beginPath(); ctx.ellipse(x, gy, 70, 56, 0, Math.PI, TAU); ctx.fill();
  ctx.fillStyle = `rgba(229, 190, 120, ${0.15 + 0.7 * lit})`;
  ctx.fillRect(x - 30, gy - 30, 14, 10);
  ctx.fillRect(x + 12, gy - 30, 14, 10);
}

/** The heat pipe along the ground, with pulses of heat running along it from x0 toward x1. */
function heatPipe(ctx, x0, x1, y, flow, clock, stopAt = Infinity) {
  ctx.fillStyle = '#3c3833';
  ctx.fillRect(x0, y - 10, x1 - x0, 12);
  ctx.fillStyle = '#26221e';
  for (let x = x0; x < x1; x += 90) ctx.fillRect(x, y - 13, 6, 18);
  if (flow <= 0) return;
  for (let i = 0; i < 10; i++) {
    const px = x0 + (((clock * 160 + i * 110) % (x1 - x0)) + (x1 - x0)) % (x1 - x0);
    if (px > stopAt) continue;
    ctx.fillStyle = `rgba(229, 155, 36, ${0.7 * flow})`;
    ctx.fillRect(px, y - 7, 24, 6);
  }
}

const ember = {
  id: 'unit05', name: 'Ember Reach', sub: 'Volcano heat pipes', groundY: GY, lamp: true, guide: 'cloak', evidenceX: 1380,
  backdrop(ctx, camX, T, clock) {
    scape(ctx, camX, EMBER, clock);
    volcano(ctx, at(1500, camX, 0.25), GY - 40, clock);
    heatPipe(ctx, at(-200, camX), at(2400, camX), GY + 40, 0, clock);
    shelter(ctx, at(900, camX, 0.8), GY - 4, 0.1);
    drift(ctx, 612, 40, clock, { color: '120, 100, 90', a: 0.3, vx: 8, vy: 6 });
  },
  incident(ctx, t, clock) {
    scape(ctx, 0, EMBER, clock);
    volcano(ctx, 220, GY - 20, clock);
    const tapped = win(t, 2.0, 2.4);
    // Heat runs along the pipe to the shelters until the tap is set; after that it turns down into the ground.
    heatPipe(ctx, 300, 1280, GY + 20, 1, clock, tapped > 0.5 ? 720 : Infinity);
    for (let i = 0; i < 3; i++) shelter(ctx, 900 + i * 150, GY + 10, 1 - win(t, 2.6 + i * 0.5, 3.0 + i * 0.5));
    // The tap: a valve with a pipe going straight down.
    alpha(ctx, tapped, () => {
      ctx.fillStyle = '#5b554c';
      ctx.fillRect(712, GY + 2, 22, 30);
      ctx.fillStyle = '#3c3833';
      ctx.fillRect(717, GY + 30, 12, H);
      for (let i = 0; i < 4; i++) {
        const py = GY + 40 + ((clock * 120 + i * 30) % 100);
        ctx.fillStyle = 'rgba(229, 155, 36, 0.7)';
        ctx.fillRect(718, py, 10, 14);
      }
    });
    const fx = t < 2.5 ? lerp(-60, 700, win(t, 0.3, 1.7)) : lerp(700, -80, win(t, 2.6, 4.6));
    person(ctx, fx, GY, 0.62, { kind: 'hood', pose: t > 1.7 && t < 2.5 ? 'crouch' : 'walk', phase: t * 7, f: t < 2.5 ? 1 : -1, clock });
  },
  evidence(ctx, sx, gy, rev, clock) {
    ctx.fillStyle = '#5b554c';
    ctx.fillRect(sx - 20, gy - 40, 40, 40);
    ctx.fillStyle = '#3c3833';
    ctx.fillRect(sx - 60, gy - 28, 40, 14);
    ctx.fillRect(sx + 20, gy - 28, 40, 14);
    ctx.strokeStyle = '#8a8274';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(sx, gy - 52, 14, 0, TAU); ctx.stroke();
    heatLines(ctx, sx, gy - 4, 60, 40, clock, 0.12 + 0.25 * rev);
    alpha(ctx, rev, () => fifthMark(ctx, sx, gy - 22, 10, C.rust, 2));
  }
};

// ---------------------------------------------------------------- Mirrowen: the canals freeze round the boats

const MIRR = {
  sky: [[0, '#121418'], [0.5, '#2c3036'], [0.85, '#4e5258'], [1, '#64666a']], far: '#1e2226', mid: '#262a2e', ground: ['#4a453e', '#1d1b18'],
  gy: GY, seed: 71, stars: 0, farAmp: 20, midAmp: 10,
  light: { x: 400, y: 180, color: '222, 222, 226', power: 0.6, sun: 26 }, clouds: 11, rays: 0.045
};

function town(ctx, x, gy) {
  const r = rng(717);
  for (let i = 0; i < 12; i++) {
    const w = 50 + r() * 40;
    const h = 60 + r() * 90;
    const bx = x + i * 70;
    ctx.fillStyle = i % 2 ? '#1a1d20' : '#202428';
    ctx.fillRect(bx, gy - h, w, h);
    ctx.beginPath(); ctx.moveTo(bx - 4, gy - h); ctx.lineTo(bx + w / 2, gy - h - 26); ctx.lineTo(bx + w + 4, gy - h); ctx.fill();
    if (r() > 0.4) { ctx.fillStyle = 'rgba(229, 190, 120, 0.55)'; ctx.fillRect(bx + 10, gy - h + 20, 8, 10); }
  }
}

/** The canal: water from y to y + 56, with ice spreading from the left to `ice` (a screen x). */
function canal(ctx, y, ice, clock) {
  ctx.fillStyle = '#1e2428';
  ctx.fillRect(0, y, W, 56);
  ctx.strokeStyle = 'rgba(200, 206, 210, 0.14)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const x = ((i * 170 + clock * 20) % (W + 100)) - 50;
    if (x < ice) continue;
    ctx.beginPath(); ctx.moveTo(x, y + 18 + (i % 3) * 12); ctx.lineTo(x + 50, y + 18 + (i % 3) * 12); ctx.stroke();
  }
  if (ice > 0) {
    ctx.fillStyle = '#b4bcc2';
    ctx.fillRect(0, y, Math.min(W, ice), 56);
    ctx.strokeStyle = 'rgba(40, 46, 50, 0.6)';
    ctx.lineWidth = 1;
    const r = rng(733);
    ctx.beginPath();
    for (let i = 0; i < 30; i++) { const x = r() * Math.min(W, ice); ctx.moveTo(x, y + r() * 56); ctx.lineTo(x + 20 - r() * 40, y + r() * 56); }
    ctx.stroke();
  }
  ctx.fillStyle = '#3a3631';
  ctx.fillRect(0, y - 4, W, 4);
}

function boat(ctx, x, y, bobbing, clock) {
  const b = bobbing ? Math.sin(clock * 2 + x) * 3 : 0;
  const tilt = bobbing ? 0 : 0.06;
  ctx.save();
  ctx.translate(x, y + b);
  ctx.rotate(tilt);
  ctx.fillStyle = '#3a2e24';
  ctx.beginPath(); ctx.moveTo(-60, -10); ctx.lineTo(60, -10); ctx.lineTo(44, 12); ctx.lineTo(-44, 12); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(-20, -40, 36, 30);
  ctx.fillStyle = '#26221e';
  ctx.fillRect(-2, -70, 4, 30);
  ctx.restore();
}

const mirrowen = {
  id: 'unit06', name: 'Mirrowen', sub: 'Shipping canals', groundY: GY, guide: 'local', evidenceX: 1400,
  backdrop(ctx, camX, T, clock) {
    scape(ctx, camX, MIRR, clock);
    town(ctx, at(200, camX, 0.3), GY - 90);
    canal(ctx, GY - 76, W, clock);
    boat(ctx, at(900, camX, 0.8), GY - 50, false, clock);
    boat(ctx, at(1500, camX, 0.8), GY - 50, false, clock);
  },
  incident(ctx, t, clock) {
    scape(ctx, 0, MIRR, clock);
    town(ctx, 80, GY - 90);
    const ice = lerp(-10, W + 20, span(t, 1.6, 4.4));
    canal(ctx, GY - 76, ice, clock);
    [260, 640, 1000].forEach(bx => boat(ctx, bx, GY - 50, bx > ice, clock));
    // On the quay a hooded figure tips a canister into the water, then walks off.
    const fx = t < 2.0 ? 160 : lerp(160, -100, win(t, 2.4, 4.2));
    person(ctx, fx, GY + 40, 0.62, { kind: 'hood', pose: t < 2.0 ? 'stand' : 'walk', phase: t * 7, f: t < 2.0 ? 1 : -1, clock });
    if (t < 2.2) {
      ctx.save();
      ctx.translate(200, GY - 40);
      ctx.rotate(win(t, 0.6, 1.2) * 1.6);
      ctx.fillStyle = '#6b625a';
      ctx.fillRect(-10, -22, 20, 34);
      ctx.restore();
      alpha(ctx, held(t, 1.0, 2.0, 0.2), () => { ctx.fillStyle = 'rgba(200, 206, 210, 0.7)'; ctx.fillRect(214, GY - 40, 4, 40); });
    }
  },
  evidence(ctx, sx, gy, rev) {
    // The empty canister on its side, the quay frosted where it spilled.
    ctx.fillStyle = 'rgba(200, 210, 216, 0.55)';
    ctx.beginPath(); ctx.ellipse(sx + 10, gy - 2, 70, 9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6b625a';
    ctx.fillRect(sx - 34, gy - 28, 56, 26);
    ctx.fillStyle = '#3c3833';
    ctx.fillRect(sx + 22, gy - 22, 10, 14);
    alpha(ctx, rev, () => fifthMark(ctx, sx - 6, gy - 15, 8, C.rust, 2));
  }
};

// ---------------------------------------------------------------- Kettle: more iron out than ore went in

const KETTLE = {
  sky: [[0, '#0c0a0a'], [0.5, '#1e1612'], [0.85, '#3e2a1e'], [1, '#5a3a24']], far: '#17120f', mid: '#1d1713', ground: ['#2e2924', '#100e0c'],
  gy: GY, seed: 81, stars: 20, farAmp: 18, midAmp: 12,
  light: { x: 820, y: 440, color: '229, 160, 96', power: 0.75 }, clouds: 6, nebula: '140, 100, 80', rays: 0.03
};

function foundry(ctx, x, gy, clock) {
  ctx.fillStyle = '#1d1916';
  ctx.fillRect(x, gy - 200, 360, 200);
  for (let i = 0; i < 3; i++) ctx.fillRect(x + 40 + i * 110, gy - 320, 34, 130);
  ctx.fillStyle = `rgba(200, 96, 40, ${0.7 + 0.15 * Math.sin(clock * 3)})`;
  ctx.fillRect(x + 140, gy - 110, 80, 110);
  ctx.fillStyle = 'rgba(90, 80, 70, 0.3)';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.ellipse(x + 57 + i * 110 + Math.sin(clock + i) * 6, gy - 350 - ((clock * 12) % 40), 30, 16, 0, 0, TAU); ctx.fill();
  }
}

function counter(ctx, x, y, label, val, a = 1) {
  alpha(ctx, a, () => {
    ctx.fillStyle = '#0c0b09';
    ctx.fillRect(x - 70, y - 30, 140, 60);
    ctx.strokeStyle = C.rim;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 70, y - 30, 140, 60);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = C.dust;
    ctx.font = '400 15px Quantico, monospace';
    ctx.fillText(label, x, y - 14);
    ctx.fillStyle = C.amber;
    ctx.font = '700 26px Quantico, monospace';
    ctx.fillText(val, x, y + 10);
  });
}

function ingots(ctx, x, gy, n) {
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / 5);
    const col = i % 5;
    block(ctx, x + col * 34 + (row % 2) * 17 - 70, gy - row * 16, 30, '#d9d0bd', '#5b554c', '#8d8579');
  }
}

const kettle = {
  id: 'unit07', name: 'Kettle', sub: 'Iron foundry', groundY: GY, lamp: true, guide: 'local', evidenceX: 1380,
  backdrop(ctx, camX, T, clock) {
    scape(ctx, camX, KETTLE, clock);
    foundry(ctx, at(600, camX, 0.6), GY - 10, clock);
    ingots(ctx, at(1650, camX), GY, 14);
  },
  incident(ctx, t, clock) {
    scape(ctx, 0, KETTLE, clock);
    foundry(ctx, 460, GY - 10, clock);
    // Ore goes in on the left and is counted; iron bars stack up on the right and are counted.
    const r = rng(818);
    for (let i = 0; i < 16; i++) block(ctx, 160 + r() * 140, GY - r() * 10, 18 + r() * 10, '#5a4a3a', '#2a2018', '#4a3a2c');
    const n = Math.round(lerp(0, 20, span(t, 1.0, 4.2)));
    ingots(ctx, 1000, GY, n);
    counter(ctx, 240, GY - 210, 'ORE IN', '40 t', win(t, 0.4, 0.8));
    const out = Math.round(lerp(0, 50, span(t, 1.0, 4.2)));
    counter(ctx, 1040, GY - 210, 'IRON OUT', `${out} t`, win(t, 0.9, 1.3));
    alpha(ctx, win(t, 4.2, 4.5) * (0.6 + 0.4 * Math.sin(clock * 8)), () => {
      ctx.strokeStyle = C.danger; ctx.lineWidth = 3; ctx.strokeRect(966, GY - 244, 148, 68);
    });
  },
  evidence(ctx, sx, gy, rev) {
    // The foundry's shipping log, open on a crate.
    ctx.fillStyle = '#3a3128';
    ctx.fillRect(sx - 44, gy - 40, 88, 40);
    ctx.fillStyle = '#cfc8b8';
    ctx.fillRect(sx - 36, gy - 54, 34, 14);
    ctx.fillRect(sx + 2, gy - 54, 34, 14);
    alpha(ctx, rev, () => {
      ctx.fillStyle = C.danger;
      ctx.fillRect(sx + 8, gy - 49, 22, 3);
      ctx.fillStyle = '#544e46';
      for (let i = 0; i < 3; i++) ctx.fillRect(sx - 32, gy - 52 + i * 4, 26, 1);
    });
  }
};

// ---------------------------------------------------------------- Teeter: dead ponds that are still pumping

const TEETER = {
  sky: [[0, '#1a1814'], [0.45, '#3e382e'], [0.8, '#7a705e'], [1, '#a29682']], far: '#2a2620', mid: '#34302a', ground: ['#8a8274', '#3a3631'],
  gy: GY, seed: 91, stars: 0, farAmp: 16, midAmp: 8, haze: 'rgba(220, 214, 204, 0.12)',
  light: { x: 500, y: 190, color: '246, 230, 196', power: 0.85, sun: 32 }, clouds: 10, rays: 0.06
};

function pond(ctx, x, gy, w) {
  ctx.fillStyle = '#4a4e50';
  ctx.fillRect(x, gy - 8, w, 10);
  ctx.fillStyle = 'rgba(236, 230, 216, 0.7)';
  ctx.fillRect(x, gy - 9, w, 2);
  ctx.fillStyle = '#5b554c';
  ctx.fillRect(x - 6, gy - 12, 6, 14);
  ctx.fillRect(x + w, gy - 12, 6, 14);
}

/** The cut-away under the ground: a buried pipe with product pulsing along it to a pump. */
function underground(ctx, gy, a, clock, x0 = 120, x1 = 1160) {
  alpha(ctx, a, () => {
    ctx.fillStyle = 'rgba(12, 11, 9, 0.85)';
    ctx.fillRect(0, gy + 14, W, H);
    ctx.fillStyle = '#3c3833';
    ctx.fillRect(x0, gy + 60, x1 - x0, 14);
    for (let i = 0; i < 9; i++) {
      const px = x0 + ((clock * 140 + i * 120) % (x1 - x0));
      ctx.fillStyle = 'rgba(207, 200, 184, 0.75)';
      ctx.fillRect(px, gy + 63, 22, 8);
    }
    const k = 1 + 0.06 * Math.max(0, Math.sin(clock * 6));
    ctx.fillStyle = '#5b554c';
    ctx.fillRect(x1 - 20, gy + 40 - 10 * (k - 1) * 10, 60 * k, 50 * k);
    ctx.fillStyle = C.amber;
    ctx.fillRect(x1 + 4, gy + 50, 8, 8);
  });
}

const teeter = {
  id: 'unit08', name: 'Teeter', sub: 'Salt ponds', groundY: GY, guide: 'local', evidenceX: 1400,
  backdrop(ctx, camX, T, clock) {
    scape(ctx, camX, TEETER, clock);
    for (let i = 0; i < 4; i++) pond(ctx, at(560 + i * 300, camX, 0.9), GY + 30, 220);
  },
  incident(ctx, t, clock) {
    scape(ctx, 0, TEETER, clock);
    for (let i = 0; i < 4; i++) pond(ctx, 80 + i * 300, GY - 4, 240);
    // Above, nothing moves. Below, the ground falls away to show the pipe still running.
    underground(ctx, GY, span(t, 1.6, 2.6), clock);
    person(ctx, 1150, GY - 4, 0.5, { kind: 'hood', pose: 'stand', f: -1, clock });
  },
  evidence(ctx, sx, gy, rev, clock) {
    // A drain valve coming out of the ground, shuddering with the pump below.
    const j = Math.sin(clock * 30) * 1.5 * rev;
    ctx.fillStyle = '#3c3833';
    ctx.fillRect(sx - 8 + j, gy - 46, 16, 46);
    ctx.fillStyle = '#5b554c';
    ctx.fillRect(sx - 22 + j, gy - 54, 44, 10);
    ctx.strokeStyle = '#8a8274';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(sx + j, gy - 64, 12, 0, TAU); ctx.stroke();
  }
};

// ---------------------------------------------------------------- Verdigris: acid runoff creeps toward the radio fort

const VERD = {
  sky: [[0, '#0a0c0a'], [0.45, '#1a1e16'], [0.8, '#3a3e24'], [1, '#5a5a30']], far: '#161a12', mid: '#1c2016', ground: ['#2e3424', '#10120c'],
  gy: GY, seed: 101, stars: 60, farAmp: 18, midAmp: 12, haze: 'rgba(120, 161, 66, 0.08)',
  light: { x: 900, y: 400, color: '200, 196, 120', power: 0.7, sun: 30 }, clouds: 8, rays: 0.04
};

function fort(ctx, x, gy, clock) {
  ctx.fillStyle = '#1d201a';
  ctx.fillRect(x, gy - 110, 220, 110);
  ctx.fillRect(x + 90, gy - 300, 10, 200);
  ctx.strokeStyle = '#1d201a';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x + 95, gy - 300); ctx.lineTo(x + 30, gy - 110); ctx.moveTo(x + 95, gy - 300); ctx.lineTo(x + 160, gy - 110); ctx.stroke();
  ctx.fillStyle = Math.sin(clock * 3) > 0 ? C.amber : '#3c3833';
  ctx.fillRect(x + 91, gy - 308, 8, 8);
  ctx.fillStyle = 'rgba(229, 190, 120, 0.5)';
  ctx.fillRect(x + 20, gy - 70, 16, 10);
}

function reeds(ctx, x0, x1, gy, seed, clock) {
  const r = rng(seed);
  ctx.strokeStyle = '#2a3020';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = x0; x < x1; x += 7) {
    const h = 20 + r() * 40;
    const sway = Math.sin(clock * 1.2 + x * 0.05) * 4;
    ctx.moveTo(x, gy); ctx.lineTo(x + sway, gy - h);
  }
  ctx.stroke();
}

const verdigris = {
  id: 'unit09', name: 'Verdigris', sub: 'Marsh radio fort', groundY: GY, lamp: true, guide: 'local', evidenceX: 1380,
  backdrop(ctx, camX, T, clock) {
    scape(ctx, camX, VERD, clock);
    fort(ctx, at(1500, camX, 0.5), GY - 10, clock);
    reeds(ctx, at(0, camX), at(2400, camX), GY + 4, 1011, clock);
  },
  incident(ctx, t, clock) {
    scape(ctx, 0, VERD, clock);
    // Upstream a washing plant spills; the stain spreads across the marsh toward the fort; fence posts darken.
    ctx.fillStyle = '#1d201a';
    ctx.fillRect(60, GY - 150, 180, 150);
    ctx.fillRect(100, GY - 220, 26, 80);
    fort(ctx, 980, GY - 10, clock);
    const reach = lerp(240, 1000, span(t, 0.8, 4.6));
    const g = ctx.createLinearGradient(240, 0, reach, 0);
    g.addColorStop(0, 'rgba(120, 161, 66, 0.55)');
    g.addColorStop(1, 'rgba(120, 161, 66, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse((240 + reach) / 2, GY + 14, (reach - 240) / 2 + 1, 18, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 6; i++) {
      const px = 400 + i * 100;
      const eaten = win(reach, px, px + 140);
      ctx.fillStyle = eaten > 0.5 ? '#3a4a2a' : '#5a4a3a';
      ctx.fillRect(px, GY - 40 + eaten * 18, 8, 40 - eaten * 18);
    }
    reeds(ctx, 0, W, GY + 4, 1012, clock);
  },
  evidence(ctx, sx, gy, rev) {
    // A drain pipe from the plant's side, its mouth crusted green, a pool spreading under it.
    ctx.fillStyle = 'rgba(120, 161, 66, 0.5)';
    ctx.beginPath(); ctx.ellipse(sx + 20, gy, 70, 10, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3c3833';
    ctx.fillRect(sx - 60, gy - 40, 70, 22);
    alpha(ctx, 0.4 + 0.6 * rev, () => {
      ctx.fillStyle = '#5e7a3a';
      ctx.fillRect(sx + 4, gy - 42, 10, 26);
      ctx.fillRect(sx + 8, gy - 16, 4, 16);
    });
  }
};

export const WORLDS_B = { unit05: ember, unit06: mirrowen, unit07: kettle, unit08: teeter, unit09: verdigris };
export { W, H, drift, fifthMark };
/** Props and settings the story shots (`plots-b.js`) reuse. */
export const PROPS_B = { EMBER, volcano, shelter, heatPipe, MIRR, town, canal, boat, KETTLE, foundry, ingots, counter, TEETER, pond, underground, VERD, fort, reeds };
