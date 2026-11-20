/**
 * cutscene/worlds-a.js — arrival cutscenes for Erebus, Tallow, Lanternfall, Ligar and Bellows.
 * Each is a spec for `arrivalScene` (see `arrival.js`): the ground, what happened, and what was left behind.
 */

import {
  C, W, H, TAU, win, span, lerp, clamp01, alpha, rng, person, fifthMark, block, heatLines, shake, drift, shade, held, keyLight
} from './kit.js';
import { scape, at } from './scape.js';

const GY = 560;

// ---------------------------------------------------------------- Erebus: twenty shield towers go dark

const EREBUS = {
  sky: [[0, '#05060a'], [0.45, '#0d0f16'], [0.8, '#1a1a22'], [1, '#2a2622']], far: '#121318', mid: '#17171b', ground: ['#24221f', '#0e0d0b'],
  gy: GY, seed: 11, stars: 180, jag: 0.4, moon: [1040, 150, 46, '#6b625a', '#15130f'],
  light: { x: 1040, y: 150, color: '196, 200, 212', power: 0.45 }, clouds: 6, nebula: '120, 104, 140', rays: 0.025
};

function tower(ctx, x, gy, s, lit, n) {
  const h = 230 * s;
  const L = keyLight();
  const ld = L.x < x ? -1 : 1;
  const g = ctx.createLinearGradient(x + ld * 16 * s, 0, x - ld * 16 * s, 0);
  g.addColorStop(0, '#4a453e');
  g.addColorStop(0.45, '#2a2622');
  g.addColorStop(1, '#100e0c');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - 16 * s, gy); ctx.lineTo(x - 6 * s, gy - h); ctx.lineTo(x + 6 * s, gy - h); ctx.lineTo(x + 16 * s, gy);
  ctx.closePath();
  ctx.fill();
  // The edge that faces the light.
  ctx.strokeStyle = `rgba(${L.color}, ${0.25 + 0.4 * L.power})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + ld * 16 * s, gy); ctx.lineTo(x + ld * 6 * s, gy - h);
  ctx.stroke();
  // The shield's amber light falling down the tower while it runs.
  if (lit > 0.5) {
    const sg = ctx.createLinearGradient(0, gy - h, 0, gy - h * 0.55);
    sg.addColorStop(0, 'rgba(229, 155, 36, 0.35)');
    sg.addColorStop(1, 'rgba(229, 155, 36, 0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(x - 6 * s, gy - h); ctx.lineTo(x + 6 * s, gy - h); ctx.lineTo(x + 10.5 * s, gy - h * 0.55); ctx.lineTo(x - 10.5 * s, gy - h * 0.55);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = '#3c3833';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 1; i < 6; i++) { const y = gy - (h * i) / 6; ctx.moveTo(x - 14 * s + i * 1.6 * s, y); ctx.lineTo(x + 14 * s - i * 1.6 * s, y); }
  ctx.stroke();
  // The emitter on top: amber when the shield runs, dead iron when cut.
  ctx.fillStyle = lit > 0.5 ? C.amber : '#3c3833';
  ctx.fillRect(x - 7 * s, gy - h - 12 * s, 14 * s, 12 * s);
  if (n != null) {
    ctx.fillStyle = C.dim;
    ctx.font = `700 ${Math.round(14 * s)}px Quantico, monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(String(n), x, gy - h * 0.45);
  }
}

function shieldArc(ctx, x0, x1, gy, a) {
  if (a <= 0.01) return;
  alpha(ctx, a, () => {
    ctx.strokeStyle = 'rgba(229, 155, 36, 0.35)';
    ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.ellipse((x0 + x1) / 2, gy, (x1 - x0) / 2 + k * 14, 300 + k * 18, 0, Math.PI, TAU);
      ctx.stroke();
    }
  });
}

const erebus = {
  id: 'erebus', name: 'Erebus', sub: 'Charge Gardens', groundY: GY, lamp: true, guide: 'local', evidenceX: 1470,
  backdrop(ctx, camX, T, clock) {
    scape(ctx, camX, EREBUS, clock);
    for (let i = 0; i < 6; i++) tower(ctx, at(820 + i * 230, camX, 0.6), GY - 30, 0.7, 0);
    tower(ctx, at(1470, camX), GY, 1.1, 0, 20);
  },
  incident(ctx, t, clock) {
    scape(ctx, 0, EREBUS, clock);
    // A row of towers under one shield; they go dark from the far end, one after another.
    const n = 10;
    const out = i => win(t, 1.0 + i * 0.22, 1.1 + i * 0.22);
    shieldArc(ctx, 120, 1160, GY, 1 - win(t, 1.0, 3.2));
    for (let i = 0; i < n; i++) tower(ctx, 140 + i * 112, GY, 0.85, 1 - out(n - 1 - i));
    // A hooded figure at the nearest tower runs off into the dark.
    const fx = t < 3.3 ? 1040 : lerp(1040, 1420, win(t, 3.3, 4.8));
    person(ctx, fx, GY, 0.62, { kind: 'hood', pose: t < 3.3 ? 'crouch' : 'run', phase: t * 12, f: 1, clock });
    if (t < 3.3) alpha(ctx, held(t, 0.5, 3.2) * (0.5 + 0.5 * Math.sin(clock * 30)), () => {
      ctx.fillStyle = C.amber;
      ctx.fillRect(1062, GY - 70, 4, 4);
    });
  },
  evidence(ctx, sx, gy, rev) {
    // Tower 20's access panel, opened, with the mark scratched inside.
    ctx.fillStyle = '#1d1b18';
    ctx.fillRect(sx - 34, gy - 92, 68, 74);
    ctx.strokeStyle = C.rim;
    ctx.strokeRect(sx - 34, gy - 92, 68, 74);
    alpha(ctx, rev, () => fifthMark(ctx, sx, gy - 52, 20, C.rust, 3));
  }
};

// ---------------------------------------------------------------- Tallow: heavy metal in the salt bins

const TALLOW = {
  sky: [[0, '#1a1410'], [0.35, '#3a2a1e'], [0.7, '#7a5232'], [0.9, '#b07a44'], [1, '#c99a60']], far: '#2a2420', mid: '#3a332c', ground: ['#a69e90', '#4a453e'],
  gy: GY, seed: 21, stars: 30, farAmp: 40, midAmp: 18, haze: 'rgba(214, 196, 168, 0.12)',
  light: { x: 260, y: 400, color: '246, 196, 128', power: 1, sun: 38 }, clouds: 9, rays: 0.06
};

function refinery(ctx, x, gy, a = 1) {
  alpha(ctx, a, () => {
    ctx.fillStyle = '#231e1a';
    ctx.fillRect(x, gy - 160, 90, 160);
    ctx.fillRect(x + 100, gy - 110, 140, 110);
    ctx.fillRect(x + 30, gy - 250, 22, 100);
    ctx.beginPath();
    ctx.ellipse(x + 300, gy - 70, 50, 70, 0, 0, TAU);
    ctx.fill();
    ctx.fillRect(x + 250, gy - 70, 100, 70);
    // A conveyor up to the hopper.
    ctx.strokeStyle = '#231e1a';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(x + 240, gy - 40); ctx.lineTo(x + 420, gy - 160);
    ctx.stroke();
    ctx.fillStyle = 'rgba(229, 190, 120, 0.7)';
    ctx.fillRect(x + 14, gy - 130, 10, 8);
    ctx.fillRect(x + 130, gy - 80, 10, 8);
  });
}

/** An open bin heaped with salt cubes. */
function saltBin(ctx, x, gy, seed, metal = 0, clock = 0) {
  ctx.fillStyle = '#3a332c';
  ctx.fillRect(x - 70, gy - 46, 140, 46);
  const r = rng(seed);
  for (let i = 0; i < 26; i++) {
    const bx = x - 60 + r() * 120;
    const by = gy - 44 - Math.sin(((bx - x + 60) / 120) * Math.PI) * 22 + r() * 6;
    block(ctx, bx, by, 9 + r() * 5, '#ece6d8', '#a69e90', '#cfc8b8');
  }
  if (metal > 0) alpha(ctx, metal, () => hopperCrystal(ctx, x + 6, gy - 58, 18, clock));
  ctx.strokeStyle = '#544e46';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 70, gy - 46, 140, 46);
}

/** A stepped, hollow square crystal, with the muted oxide tints that metal grows. */
function hopperCrystal(ctx, x, y, s, clock = 0) {
  const tints = ['#7a6a86', '#5e7a6c', '#8a6a4a', '#6a6a86'];
  for (let i = 0; i < 4; i++) {
    const k = s * (1 - i * 0.22);
    ctx.fillStyle = tints[(i + Math.floor(clock * 0.8)) % 4];
    ctx.fillRect(x - k, y - k * 0.7, k * 2, k * 1.4);
    ctx.fillStyle = '#2a2622';
    ctx.fillRect(x - k * 0.78, y - k * 0.5, k * 1.56, k * 1.0);
  }
  ctx.fillStyle = 'rgba(255, 250, 240, 0.6)';
  ctx.fillRect(x - s, y - s * 0.7, s * 0.8, 2);
}

const tallow = {
  id: 'unit01', name: 'Tallow', sub: 'Salt refinery', groundY: GY, guide: 'cloak', evidenceX: 1380,
  backdrop(ctx, camX, T, clock) {
    scape(ctx, camX, TALLOW, clock);
    refinery(ctx, at(620, camX, 0.5), GY - 6);
    saltBin(ctx, at(980, camX), GY, 5);
    saltBin(ctx, at(1700, camX), GY, 9);
    drift(ctx, 211, 40, clock, { color: '236, 230, 216', a: 0.2, vx: 30, vy: 2, y0: GY - 120, y1: GY + 40 });
  },
  front(ctx, camX) {
    saltBin(ctx, at(1180, camX), GY + 60, 13);
  },
  incident(ctx, t, clock) {
    scape(ctx, 0, { ...TALLOW, sky: [[0, '#06070a'], [0.6, '#12121a'], [1, '#2a2220']], stars: 120, nebula: '120, 104, 120', rays: 0.02, light: { x: 980, y: 130, color: '200, 200, 214', power: 0.4 }, moon: [980, 130, 30, '#8f887b', '#15130f'] }, clock);
    refinery(ctx, 140, GY - 6, 0.9);
    saltBin(ctx, 820, GY, 5, win(t, 2.6, 3.0), clock);
    // Two hooded figures carry a dark crate to the bin, tip it, and go.
    const carry = t < 2.2 ? lerp(1360, 900, win(t, 0.2, 2.2)) : t < 3.2 ? 900 : lerp(900, 1400, win(t, 3.2, 4.8));
    const moving = t < 2.2 || t > 3.2;
    const f = t > 3.2 ? 1 : -1;
    person(ctx, carry, GY, 0.6, { kind: 'hood', pose: moving ? 'walk' : 'stand', phase: t * 7, f, clock });
    person(ctx, carry + 70, GY, 0.6, { kind: 'hood', pose: moving ? 'walk' : 'stand', phase: t * 7 + 1.4, f, clock });
    if (t < 3.2) {
      const tip = win(t, 2.2, 2.8);
      ctx.save();
      ctx.translate(carry + 34, GY - 70);
      ctx.rotate(-tip * 1.1);
      ctx.fillStyle = '#15130f';
      ctx.fillRect(-30, -18, 60, 36);
      ctx.strokeStyle = '#3c3833';
      ctx.strokeRect(-30, -18, 60, 36);
      ctx.restore();
      // Dark chunks falling into the white salt.
      for (let i = 0; i < 5; i++) {
        const u = win(t, 2.4 + i * 0.06, 2.85 + i * 0.06);
        if (u > 0 && u < 1) {
          ctx.fillStyle = '#3c3833';
          ctx.fillRect(lerp(870, 830 + i * 6, u), lerp(GY - 80, GY - 56, u * u), 7, 7);
        }
      }
    }
    // The night lamp at the refinery door comes on as they leave.
    alpha(ctx, win(t, 3.8, 4.2), () => {
      ctx.fillStyle = 'rgba(229, 190, 120, 0.9)';
      ctx.fillRect(160, GY - 120, 10, 10);
    });
  },
  evidence(ctx, sx, gy, rev, clock) { saltBin(ctx, sx, gy, 17, rev, clock); }
};

// ---------------------------------------------------------------- Lanternfall: the lighthouses go dark

const LANTERN = {
  sky: [[0, '#04050a'], [0.5, '#0e1220'], [0.85, '#1e2432'], [1, '#2c3240']], far: '#1a1e24', mid: '#262b32', ground: ['#5a6068', '#1a1d22'],
  gy: GY, seed: 31, stars: 220, jag: 1.4, farAmp: 110, midAmp: 50,
  light: { x: 880, y: 120, color: '200, 206, 222', power: 0.5 }, clouds: 4, nebula: '110, 120, 150', rays: 0.02
};

function lighthouse(ctx, x, gy, s, beam, ang, clock) {
  const h = 260 * s;
  ctx.fillStyle = '#2a2e34';
  ctx.beginPath();
  ctx.moveTo(x - 26 * s, gy); ctx.lineTo(x - 16 * s, gy - h); ctx.lineTo(x + 16 * s, gy - h); ctx.lineTo(x + 26 * s, gy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1a1d22';
  for (let i = 1; i < 4; i++) ctx.fillRect(x - 22 * s, gy - (h * i) / 4, 44 * s, 6 * s);
  ctx.fillStyle = beam > 0.1 ? '#e8d8b0' : '#2a2622';
  ctx.fillRect(x - 14 * s, gy - h - 26 * s, 28 * s, 24 * s);
  ctx.fillStyle = '#1a1d22';
  ctx.fillRect(x - 20 * s, gy - h - 34 * s, 40 * s, 8 * s);
  if (beam > 0.01) {
    const by = gy - h - 14 * s;
    const len = 900;
    alpha(ctx, beam, () => {
      const g = ctx.createLinearGradient(x, by, x + Math.cos(ang) * len, by + Math.sin(ang) * len);
      g.addColorStop(0, 'rgba(240, 226, 196, 0.3)');
      g.addColorStop(1, 'rgba(240, 226, 196, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, by);
      ctx.lineTo(x + Math.cos(ang - 0.09) * len, by + Math.sin(ang - 0.09) * len);
      ctx.lineTo(x + Math.cos(ang + 0.09) * len, by + Math.sin(ang + 0.09) * len);
      ctx.closePath();
      ctx.fill();
    });
  }
}

const lanternfall = {
  id: 'unit02', name: 'Lanternfall', sub: 'Glacier lighthouses', groundY: GY, lamp: true, guide: 'cloak', evidenceX: 1400,
  backdrop(ctx, camX, T, clock) {
    scape(ctx, camX, LANTERN, clock);
    lighthouse(ctx, at(900, camX, 0.5), GY - 40, 0.55, 0, 0, clock);
    lighthouse(ctx, at(1560, camX), GY, 0.9, 0, 0, clock);
    drift(ctx, 312, 70, clock, { color: '220, 226, 232', a: 0.3, vx: -20, vy: 30 });
  },
  incident(ctx, t, clock) {
    scape(ctx, 0, LANTERN, clock);
    // The beam sweeps; a ship with no lights crosses the stars; the lamp dies as it passes.
    const beam = 1 - win(t, 2.8, 3.1);
    lighthouse(ctx, 300, GY, 0.9, beam, -0.15 + Math.sin(t * 1.1) * 0.35, clock);
    const sx = lerp(1500, -300, win(t, 0.6, 4.8));
    // The hull is unlit: it shows only as a shape where the stars go out.
    ctx.fillStyle = '#07080b';
    ctx.beginPath();
    ctx.moveTo(sx - 160, 200); ctx.lineTo(sx + 120, 180); ctx.lineTo(sx + 190, 205); ctx.lineTo(sx + 120, 228); ctx.lineTo(sx - 160, 222);
    ctx.closePath();
    ctx.fill();
    // Faint keepers' windows in the tower go dark too.
    alpha(ctx, beam, () => { ctx.fillStyle = 'rgba(229, 190, 120, 0.6)'; ctx.fillRect(296, GY - 120, 8, 10); });
  },
  evidence(ctx, sx, gy, rev) {
    // A thick round lens lying in the snow, clear but for a faint violet-grey cast.
    const g = ctx.createLinearGradient(sx - 30, gy - 40, sx + 30, gy);
    g.addColorStop(0, 'rgba(200, 196, 214, 0.9)');
    g.addColorStop(1, 'rgba(90, 86, 110, 0.9)');
    ctx.fillStyle = '#2a2e34';
    ctx.beginPath(); ctx.ellipse(sx, gy - 18, 36, 20, 0, 0, TAU); ctx.fill();
    alpha(ctx, 0.4 + 0.6 * rev, () => {
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(sx, gy - 20, 30, 16, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillRect(sx - 18, gy - 28, 14, 2);
    });
  }
};

// ---------------------------------------------------------------- Ligar: the rescue tunnel caves in

const LIGAR = {
  sky: [[0, '#120c0a'], [0.4, '#2e1a14'], [0.75, '#6a3420'], [1, '#a2522c']], far: '#1a1512', mid: '#211b17', ground: ['#2e2924', '#100e0c'],
  gy: GY, seed: 41, stars: 40, jag: 0.8, farAmp: 90, midAmp: 30, haze: 'rgba(154, 74, 46, 0.12)',
  light: { x: 980, y: 400, color: '236, 128, 72', power: 0.95, sun: 44 }, clouds: 10, rays: 0.05
};

/** A cliff of basalt columns with a tunnel mouth. `fill` 0..1 buries the mouth. */
function cliff(ctx, x, gy, fill = 0, lamps = 1, clock = 0) {
  for (let i = 0; i < 9; i++) {
    const h = 300 + ((i * 37) % 60);
    ctx.fillStyle = i % 2 ? '#1d1916' : '#25201c';
    ctx.fillRect(x + i * 46, gy - h, 46, h);
    ctx.fillStyle = 'rgba(214, 196, 168, 0.06)';
    ctx.fillRect(x + i * 46, gy - h, 2, h);
  }
  // Tunnel mouth.
  ctx.fillStyle = '#060504';
  ctx.beginPath();
  ctx.moveTo(x + 140, gy); ctx.lineTo(x + 140, gy - 90); ctx.quadraticCurveTo(x + 200, gy - 140, x + 260, gy - 90); ctx.lineTo(x + 260, gy);
  ctx.closePath();
  ctx.fill();
  // Miners' lamps inside.
  alpha(ctx, lamps, () => {
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = `rgba(229, 190, 120, ${0.6 + 0.3 * Math.sin(clock * 2 + i)})`;
      ctx.fillRect(x + 170 + i * 26, gy - 60 + (i % 2) * 6, 5, 5);
    }
  });
  // Rubble piled over the mouth.
  if (fill > 0) {
    const r = rng(404);
    for (let i = 0; i < 40; i++) {
      const u = r();
      const bx = x + 130 + r() * 140;
      const top = gy - 130 * fill * Math.sin(((bx - x - 130) / 140) * Math.PI);
      const by = lerp(gy, top, u);
      if (by < gy - 2) block(ctx, bx, by + 8, 12 + r() * 14, '#4a443d', '#25201c', '#3a342e');
    }
  }
}

const ligar = {
  id: 'unit03', name: 'Ligar', sub: 'Basalt quarry', groundY: GY, lamp: true, guide: 'local', evidenceX: 1360,
  backdrop(ctx, camX, T, clock) {
    scape(ctx, camX, LIGAR, clock);
    cliff(ctx, at(560, camX, 0.7), GY, 1, 0.5, clock);
    drift(ctx, 413, 50, clock, { color: '184, 160, 130', a: 0.18, vx: 10, vy: -4 });
  },
  incident(ctx, t, clock) {
    const [dx, dy] = shake(clock, held(t, 1.4, 3.0, 0.2));
    ctx.save();
    ctx.translate(dx, dy);
    scape(ctx, 0, LIGAR, clock);
    cliff(ctx, 360, GY, span(t, 1.5, 3.0), 1, clock);
    // A flash from the blast, then falling rock and dust.
    alpha(ctx, held(t, 1.3, 1.8, 0.15) * 0.6, () => { ctx.fillStyle = '#e8d8b0'; ctx.fillRect(0, 0, W, H); });
    const r = rng(77);
    for (let i = 0; i < 24; i++) {
      const u = win(t, 1.4 + r() * 0.8, 2.6 + r() * 0.6);
      if (u > 0 && u < 1) block(ctx, 380 + r() * 360, lerp(GY - 340, GY - 10, u * u), 10 + r() * 16, '#4a443d', '#25201c', '#3a342e');
    }
    alpha(ctx, held(t, 1.8, 5.2, 0.6) * 0.5, () => {
      ctx.fillStyle = 'rgba(120, 100, 80, 0.6)';
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.ellipse(420 + i * 40, GY - 40 - (t - 1.8) * 18, 60 + (t - 1.8) * 20, 30, 0, 0, TAU);
        ctx.fill();
      }
    });
    ctx.restore();
  },
  evidence(ctx, sx, gy, rev) {
    // A basalt boulder with one face cut flat and smooth as glass.
    ctx.fillStyle = '#25201c';
    ctx.beginPath();
    ctx.moveTo(sx - 60, gy); ctx.lineTo(sx - 54, gy - 50); ctx.lineTo(sx - 20, gy - 74); ctx.lineTo(sx + 10, gy - 70); ctx.lineTo(sx + 10, gy);
    ctx.closePath();
    ctx.fill();
    const g = ctx.createLinearGradient(sx + 10, gy - 70, sx + 56, gy);
    g.addColorStop(0, '#5a5650');
    g.addColorStop(0.5, '#1a1816');
    g.addColorStop(1, '#3a3632');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(sx + 10, gy - 70); ctx.lineTo(sx + 54, gy - 56); ctx.lineTo(sx + 54, gy); ctx.lineTo(sx + 10, gy);
    ctx.closePath();
    ctx.fill();
    alpha(ctx, rev, () => {
      ctx.strokeStyle = 'rgba(255, 250, 240, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx + 18, gy - 60); ctx.lineTo(sx + 46, gy - 14); ctx.stroke();
    });
  }
};

// ---------------------------------------------------------------- Bellows: jammed tanks and one that stays hot

const BELLOWS = {
  sky: [[0, '#1e2228'], [0.5, '#4a4e56'], [0.85, '#7a7c80'], [1, '#8e8c88']], far: '#4a4e54', mid: '#5a5e62', ground: ['#3c3833', '#15130f'],
  gy: GY, seed: 51, stars: 0, farAmp: 24, midAmp: 14, haze: 'rgba(220, 226, 232, 0.18)',
  light: { x: 620, y: 170, color: '236, 234, 228', power: 0.65 }, clouds: 14, rays: 0.04
};

function fuelTank(ctx, x, gy, s, needle, wobble = 0, clock = 0) {
  const w = 90 * s;
  const h = 150 * s;
  const b = 1 + wobble * 0.04 * Math.sin(clock * 40);
  ctx.fillStyle = '#2a2622';
  ctx.fillRect(x - w * 0.4, gy - 18 * s, w * 0.8, 18 * s);
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, '#8f887b');
  g.addColorStop(0.4, '#5b554c');
  g.addColorStop(1, '#26221e');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, gy - 18 * s - h / 2, (w / 2) * b, h / 2, 0, 0, TAU);
  ctx.fill();
  // Frost.
  const r = rng(Math.round(x));
  ctx.fillStyle = 'rgba(236, 240, 244, 0.5)';
  for (let i = 0; i < 18; i++) ctx.fillRect(x - w * 0.4 + r() * w * 0.8, gy - 18 * s - h + r() * h, 2, 2);
  // A gauge.
  const gx = x;
  const gyy = gy - 18 * s - h / 2;
  ctx.fillStyle = '#15130f';
  ctx.beginPath(); ctx.arc(gx, gyy, 16 * s, 0, TAU); ctx.fill();
  ctx.strokeStyle = C.danger;
  ctx.lineWidth = 3 * s;
  ctx.beginPath(); ctx.arc(gx, gyy, 13 * s, -0.6, 0.2); ctx.stroke();
  const a = lerp(Math.PI * 0.8, Math.PI * 2.05, needle);
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(gx, gyy); ctx.lineTo(gx + Math.cos(a) * 12 * s, gyy + Math.sin(a) * 12 * s); ctx.stroke();
}

function warmCyl(ctx, sx, gy, rev, clock) {
  // The ring of deck where the frost has melted round it.
  ctx.fillStyle = 'rgba(60, 56, 51, 1)';
  ctx.beginPath(); ctx.ellipse(sx, gy, 60, 10, 0, 0, TAU); ctx.fill();
  const g = ctx.createLinearGradient(sx - 20, 0, sx + 20, 0);
  g.addColorStop(0, '#9a8a74');
  g.addColorStop(1, '#3a3128');
  ctx.fillStyle = g;
  ctx.fillRect(sx - 18, gy - 80, 36, 80);
  ctx.fillStyle = '#26221e';
  ctx.fillRect(sx - 8, gy - 90, 16, 10);
  heatLines(ctx, sx, gy - 92, 40, 70, clock, 0.15 + 0.3 * rev);
}

const bellows = {
  id: 'unit04', name: 'Bellows', sub: 'Cloud-deck fuel rig', groundY: GY, guide: 'local', evidenceX: 1380,
  backdrop(ctx, camX, T, clock) {
    scape(ctx, camX, BELLOWS, clock);
    for (let i = 0; i < 3; i++) fuelTank(ctx, at(760 + i * 130, camX, 0.85), GY - 10, 0.7, 0.92);
    drift(ctx, 512, 90, clock, { color: '236, 240, 244', a: 0.35, vx: -40, vy: 14 });
  },
  incident(ctx, t, clock) {
    scape(ctx, 0, BELLOWS, clock);
    const press = span(t, 0.6, 3.6);
    for (let i = 0; i < 4; i++) fuelTank(ctx, 220 + i * 180, GY, 1, lerp(0.2, 0.95, press), press, clock);
    // A hooded figure jams the main valve wheel with a bar, then sets down a small cylinder and goes.
    const fx = t < 2.6 ? 1000 : lerp(1000, 1400, win(t, 2.6, 4.2));
    const vx = 960;
    ctx.strokeStyle = '#5b554c';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(vx, GY - 90, 22, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#2a2622';
    ctx.fillRect(vx - 4, GY - 90, 8, 90);
    alpha(ctx, win(t, 1.2, 1.5), () => { ctx.strokeStyle = '#8a8274'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(vx - 34, GY - 110); ctx.lineTo(vx + 34, GY - 70); ctx.stroke(); });
    alpha(ctx, win(t, 2.2, 2.5), () => warmCyl(ctx, 1060, GY, 0.6, clock));
    person(ctx, fx, GY, 0.62, { kind: 'hood', pose: t < 2.6 ? (t > 1.9 ? 'crouch' : 'point') : 'walk', phase: t * 7, f: t < 2.6 ? -1 : 1, clock });
    drift(ctx, 513, 90, clock, { color: '236, 240, 244', a: 0.35, vx: -40, vy: 14 });
  },
  evidence: warmCyl
};

export const WORLDS_A = { erebus, unit01: tallow, unit02: lanternfall, unit03: ligar, unit04: bellows };
export { GY, shade, clamp01 };
