/**
 * cutscene/worlds-c.js — arrival cutscenes for Brinewire, Quicklight, Lodestone, Thornmere and Cinder Halo.
 */

import { C, W, H, TAU, win, span, lerp, alpha, rng, person, fifthMark, block, heatLines, drift, held, shake } from './kit.js';
import { scape, at } from './scape.js';

const GY = 560;

// ---------------------------------------------------------------- Brinewire: power taps on the salt pools

const BRINE = {
  sky: [[0, '#0a0c0e'], [0.45, '#1a1e22'], [0.8, '#4a4640'], [1, '#7a6a56']], far: '#181a1a', mid: '#202222', ground: ['#5a5650', '#1d1b18'],
  gy: GY, seed: 111, stars: 70, farAmp: 14, midAmp: 8,
  light: { x: 700, y: 420, color: '226, 196, 150', power: 0.75, sun: 40 }, clouds: 9, rays: 0.05
};

function pylon(ctx, x, gy) {
  ctx.strokeStyle = '#2a2826';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 30, gy); ctx.lineTo(x - 6, gy - 240); ctx.lineTo(x + 6, gy - 240); ctx.lineTo(x + 30, gy);
  ctx.moveTo(x - 40, gy - 220); ctx.lineTo(x + 40, gy - 220);
  ctx.moveTo(x - 24, gy - 60); ctx.lineTo(x + 20, gy - 140); ctx.moveTo(x + 24, gy - 60); ctx.lineTo(x - 20, gy - 140);
  ctx.stroke();
}

function cable(ctx, x0, x1, y) {
  ctx.strokeStyle = '#3a3836';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo((x0 + x1) / 2, y + 50, x1, y); ctx.stroke();
}

function sparks(ctx, x, y, clock, a = 1) {
  const r = rng(Math.floor(clock * 12));
  alpha(ctx, a, () => {
    ctx.strokeStyle = C.amber;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) { const ang = r() * TAU; const l = 6 + r() * 14; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * l, y + Math.sin(ang) * l); }
    ctx.stroke();
  });
}

function copperBars(ctx, x, y, n) {
  for (let i = 0; i < n; i++) block(ctx, x + (i % 4) * 30 - 45, y - Math.floor(i / 4) * 14, 26, '#d8a070', '#6a3a20', '#a0603a');
}

const brinewire = {
  id: 'unit10', name: 'Brinewire', sub: 'Salt marsh grid', groundY: GY, lamp: true, guide: 'local', evidenceX: 1400,
  backdrop(ctx, camX, T, clock) {
    scape(ctx, camX, BRINE, clock);
    ctx.fillStyle = '#2a2e2e';
    ctx.fillRect(0, GY + 20, W, 30);
    pylon(ctx, at(800, camX, 0.7), GY - 6);
    pylon(ctx, at(1600, camX), GY);
    cable(ctx, at(800, camX, 0.7) - 40, at(1600, camX) - 40, GY - 226);
    sparks(ctx, at(1420, camX), GY - 70, clock, 0.6);
  },
  incident(ctx, t, clock) {
    scape(ctx, 0, BRINE, clock);
    ctx.fillStyle = '#2a2e2e';
    ctx.fillRect(0, GY + 20, W, 30);
    pylon(ctx, 260, GY);
    pylon(ctx, 1020, GY);
    cable(ctx, 220, 980, GY - 226);
    // A clamp box goes on the pylon's feed; sparks; copper bars stack on a sled that lifts away.
    const on = win(t, 1.2, 1.5);
    alpha(ctx, on, () => {
      ctx.fillStyle = '#4a453e'; ctx.fillRect(1010, GY - 90, 26, 34);
      ctx.strokeStyle = '#3a3836'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(1023, GY - 56); ctx.lineTo(1023, GY - 20); ctx.lineTo(760, GY - 20); ctx.stroke();
    });
    sparks(ctx, 1023, GY - 74, clock, on);
    const lift = span(t, 3.6, 5.0);
    const sy = GY - 6 - lift * 380;
    const sxx = 700 + lift * 300;
    ctx.fillStyle = '#26221e';
    ctx.fillRect(sxx - 80, sy, 160, 14);
    copperBars(ctx, sxx, sy, Math.round(lerp(0, 12, span(t, 1.6, 3.4))));
    person(ctx, t < 3.6 ? 980 : lerp(980, 1360, win(t, 3.6, 5)), GY, 0.6, { kind: 'hood', pose: t < 1.4 ? 'point' : t < 3.6 ? 'stand' : 'run', phase: t * 12, f: t < 3.6 ? 1 : 1, clock });
    person(ctx, t < 3.6 ? 620 : lerp(620, 1300, win(t, 3.6, 5)), GY, 0.6, { kind: 'hood', pose: t < 3.6 ? 'stand' : 'run', phase: t * 12 + 2, f: 1, clock });
  },
  evidence(ctx, sx, gy, rev, clock) {
    ctx.fillStyle = '#4a453e';
    ctx.fillRect(sx - 18, gy - 90, 36, 44);
    ctx.strokeStyle = '#3a3836';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(sx, gy - 46); ctx.lineTo(sx, gy); ctx.stroke();
    alpha(ctx, rev, () => fifthMark(ctx, sx, gy - 68, 9, C.rust, 2));
  }
};

// ---------------------------------------------------------------- Quicklight: dust in the vents, towers running hot

const QUICK = {
  sky: [[0, '#0e0c0a'], [0.45, '#2a2018'], [0.8, '#6a4a2a'], [1, '#9a6a3a']], far: '#1a1612', mid: '#221d18', ground: ['#3a342e', '#14120f'],
  gy: GY, seed: 121, stars: 40, farAmp: 30, midAmp: 14,
  light: { x: 350, y: 400, color: '236, 172, 100', power: 0.9, sun: 36 }, clouds: 9, rays: 0.055
};

function fuelTower(ctx, x, gy, heat, clock) {
  ctx.fillStyle = '#26221e';
  ctx.fillRect(x - 40, gy - 300, 80, 300);
  ctx.fillStyle = '#1d1b18';
  ctx.fillRect(x - 50, gy - 316, 100, 20);
  // A temperature column down its side.
  ctx.fillStyle = '#0c0b09';
  ctx.fillRect(x + 48, gy - 260, 14, 220);
  ctx.fillStyle = heat > 0.75 ? C.danger : C.amber;
  ctx.fillRect(x + 50, gy - 42 - 216 * heat, 10, 216 * heat);
  // Vent smoke, heavier as it runs hotter.
  ctx.fillStyle = `rgba(110, 100, 90, ${0.15 + 0.3 * heat})`;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(x + Math.sin(clock + i) * 10, gy - 330 - i * 30 - ((clock * 20) % 30), 30 + heat * 30 + i * 6, 14 + i * 3, 0, 0, TAU);
    ctx.fill();
  }
  if (heat > 0.5) heatLines(ctx, x, gy - 300, 80, 80, clock, 0.3 * heat);
}

const quicklight = {
  id: 'unit11', name: 'Quicklight', sub: 'Fuel towers', groundY: GY, lamp: true, guide: 'local', evidenceX: 1380,
  backdrop(ctx, camX, T, clock) {
    scape(ctx, camX, QUICK, clock);
    fuelTower(ctx, at(820, camX, 0.6), GY - 10, 0.9, clock);
    fuelTower(ctx, at(1560, camX), GY, 0.85, clock);
  },
  incident(ctx, t, clock) {
    scape(ctx, 0, QUICK, clock);
    // A hooded figure on the tower top shakes dust into the vent; the tower's heat climbs fast.
    fuelTower(ctx, 360, GY, lerp(0.25, 0.95, span(t, 2.0, 4.0)), clock);
    fuelTower(ctx, 820, GY, 0.25, clock);
    const fx = t < 2.4 ? 360 : lerp(360, 500, win(t, 2.4, 3.6));
    person(ctx, fx, GY - 316, 0.5, { kind: 'hood', pose: t < 2.4 ? 'point' : 'walk', phase: t * 7, f: 1, clock });
    for (let i = 0; i < 12; i++) {
      const u = win(t, 0.8 + i * 0.1, 1.5 + i * 0.1);
      if (u > 0 && u < 1) { ctx.fillStyle = '#8a8274'; ctx.fillRect(386 + Math.sin(i * 3) * 8, GY - 352 + u * 40, 3, 3); }
    }
  },
  evidence(ctx, sx, gy, rev) {
    // A small grey drift of dust swept out of a vent grate.
    ctx.fillStyle = '#26221e';
    ctx.fillRect(sx - 40, gy - 30, 80, 30);
    ctx.fillStyle = '#3c3833';
    for (let i = 0; i < 5; i++) ctx.fillRect(sx - 34 + i * 15, gy - 26, 8, 22);
    alpha(ctx, 0.5 + 0.5 * rev, () => {
      ctx.fillStyle = '#8a8274';
      ctx.beginPath(); ctx.ellipse(sx + 50, gy - 2, 34, 8, 0, Math.PI, TAU); ctx.fill();
    });
  }
};

// ---------------------------------------------------------------- Lodestone: the sorting magnet and the drums

const LODE = {
  sky: [[0, '#120a08'], [0.4, '#341a10'], [0.75, '#7a3a1e'], [1, '#b2582a']], far: '#2a1610', mid: '#351c12', ground: ['#4a2c1e', '#1a100a'],
  gy: GY, seed: 131, stars: 30, jag: 1.0, farAmp: 160, midAmp: 60,
  light: { x: 640, y: 330, color: '244, 140, 76', power: 0.95, sun: 40 }, clouds: 7, rays: 0.06
};

function drum(ctx, x, gy, iron) {
  ctx.fillStyle = iron ? '#4a453e' : '#6a5a40';
  ctx.fillRect(x - 16, gy - 44, 32, 44);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x - 16, gy - 30, 32, 3);
  ctx.fillRect(x - 16, gy - 14, 32, 3);
}

function crane(ctx, x, gy, armX, hook) {
  ctx.fillStyle = '#26201a';
  ctx.fillRect(x - 14, gy - 360, 28, 360);
  ctx.fillRect(x - 14, gy - 372, armX - x + 60, 18);
  ctx.strokeStyle = '#3c3833';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(armX, gy - 354); ctx.lineTo(armX, hook - 20); ctx.stroke();
  ctx.fillStyle = '#5b554c';
  ctx.fillRect(armX - 44, hook - 22, 88, 22);
  ctx.fillStyle = C.amber;
  ctx.fillRect(armX - 4, hook - 18, 8, 6);
}

const lodestone = {
  id: 'unit12', name: 'Lodestone', sub: 'Iron canyon', groundY: GY, guide: 'local', evidenceX: 1400,
  backdrop(ctx, camX, T, clock) {
    scape(ctx, camX, LODE, clock);
    crane(ctx, at(900, camX, 0.6), GY - 10, at(1100, camX, 0.6), GY - 130);
    for (let i = 0; i < 4; i++) drum(ctx, at(1600 + i * 40, camX), GY, i % 2);
  },
  incident(ctx, t, clock) {
    scape(ctx, 0, LODE, clock);
    // The magnet swings over a row of drums, lifts the iron ones, drops them in a crate; the crate goes up and away.
    const armX = lerp(420, 860, span(t, 1.8, 2.8));
    const hook = t < 1.0 ? GY - 300 : t < 1.8 ? lerp(GY - 300, GY - 48, win(t, 1.0, 1.4)) - (t > 1.4 ? win(t, 1.4, 1.8) * 200 : 0) : GY - 248 + (t > 2.8 ? win(t, 2.8, 3.2) * 120 : 0);
    crane(ctx, 200, GY, armX, hook);
    const lifted = t > 1.4;
    const dropped = t > 3.2;
    [0, 1, 2, 3, 4, 5].forEach(i => {
      const iron = i % 2 === 0;
      if (iron && lifted && !dropped) drum(ctx, armX - 30 + (i / 2) * 30, hook + 44, true);
      else if (!(iron && lifted)) drum(ctx, 340 + i * 36, GY, iron);
    });
    const up = span(t, 3.6, 5.0);
    ctx.fillStyle = '#3a2e22';
    ctx.fillRect(800, GY - 70 - up * 500, 120, 70);
    ctx.strokeStyle = '#5b4a36';
    ctx.strokeRect(800, GY - 70 - up * 500, 120, 70);
  },
  evidence(ctx, sx, gy, rev) {
    // A drum that fell from a crate, its shipping tag hanging off it.
    ctx.save();
    ctx.translate(sx, gy - 16);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#4a453e';
    ctx.fillRect(-16, -22, 32, 44);
    ctx.restore();
    alpha(ctx, 0.4 + 0.6 * rev, () => {
      ctx.fillStyle = '#cfc8b8'; ctx.fillRect(sx + 26, gy - 20, 18, 12);
      ctx.fillStyle = C.amber; ctx.fillRect(sx + 30, gy - 16, 10, 4);
    });
  }
};

// ---------------------------------------------------------------- Thornmere: the outpost behind plastic armour

const THORN = {
  sky: [[0, '#0a0c0a'], [0.45, '#181c18'], [0.8, '#323a30'], [1, '#4a5244']], far: '#141812', mid: '#1a2016', ground: ['#262c20', '#0e100c'],
  gy: GY, seed: 141, stars: 20, farAmp: 30, midAmp: 20, haze: 'rgba(184, 190, 170, 0.14)',
  light: { x: 300, y: 260, color: '214, 218, 196', power: 0.6, sun: 28 }, clouds: 12, rays: 0.06
};

function outpost(ctx, x, gy, plates) {
  ctx.fillStyle = '#1a1d18';
  ctx.fillRect(x, gy - 200, 340, 200);
  ctx.fillRect(x + 140, gy - 260, 60, 60);
  for (let i = 0; i < 12; i++) {
    if (i >= plates) break;
    const px = x + (i % 6) * 57;
    const py = gy - 200 + Math.floor(i / 6) * 100;
    ctx.fillStyle = '#5a5a4e';
    ctx.fillRect(px + 2, py + 2, 53, 96);
    ctx.fillStyle = 'rgba(255, 250, 240, 0.1)';
    ctx.fillRect(px + 2, py + 2, 53, 4);
    ctx.fillStyle = '#2a2a24';
    [[8, 8], [45, 8], [8, 88], [45, 88]].forEach(([bx, by]) => ctx.fillRect(px + bx, py + by, 4, 4));
  }
}

const thornmere = {
  id: 'unit13', name: 'Thornmere', sub: 'Swamp outpost', groundY: GY, lamp: true, guide: 'cloak', evidenceX: 1380,
  backdrop(ctx, camX, T, clock) {
    scape(ctx, camX, THORN, clock);
    outpost(ctx, at(1320, camX), GY, 12);
    drift(ctx, 1411, 30, clock, { color: '184, 190, 170', a: 0.12, vx: 10, vy: 0, size: 40, y0: GY - 80, y1: GY + 40 });
  },
  incident(ctx, t, clock) {
    scape(ctx, 0, THORN, clock);
    // Hooded figures bolt plate after plate over the outpost walls until it is sealed.
    outpost(ctx, 470, GY, Math.round(lerp(0, 12, span(t, 0.6, 4.2))));
    person(ctx, 420, GY, 0.6, { kind: 'hood', pose: 'point', f: 1, clock });
    person(ctx, 860, GY, 0.6, { kind: 'hood', pose: Math.sin(clock * 3) > 0 ? 'point' : 'stand', f: -1, clock });
    drift(ctx, 1412, 30, clock, { color: '184, 190, 170', a: 0.12, vx: 10, vy: 0, size: 40, y0: GY - 80, y1: GY + 40 });
  },
  evidence(ctx, sx, gy, rev) {
    // A plate prised off the wall, lying against it: plastic outside, a dull grey core showing at its broken edge.
    ctx.save();
    ctx.translate(sx, gy);
    ctx.rotate(-0.25);
    ctx.fillStyle = '#5a5a4e';
    ctx.fillRect(-26, -90, 52, 90);
    alpha(ctx, rev, () => { ctx.fillStyle = '#7a7c80'; ctx.fillRect(-26, -90, 52, 8); ctx.fillStyle = '#4a4c50'; ctx.fillRect(-20, -84, 40, 2); });
    ctx.restore();
  }
};

// ---------------------------------------------------------------- Cinder Halo: the old reactor running hot

const CINDER = {
  sky: [[0, '#060508'], [0.45, '#100e12'], [0.8, '#221c1a'], [1, '#3a2e26']], far: '#16130f', mid: '#1d1914', ground: ['#3a3631', '#100e0c'],
  gy: GY, seed: 151, stars: 90, farAmp: 24, midAmp: 12,
  light: { x: 1000, y: 140, color: '214, 196, 168', power: 0.45 }, clouds: 5, nebula: '150, 110, 96', rays: 0.02, moon: [1000, 140, 34, '#8f887b', '#15130f']
};

function reactor(ctx, x, gy, clock, hot = 1) {
  // A cooling tower and a domed hall.
  ctx.fillStyle = '#26221e';
  ctx.beginPath();
  ctx.moveTo(x, gy); ctx.quadraticCurveTo(x + 50, gy - 160, x + 20, gy - 280);
  ctx.lineTo(x + 160, gy - 280); ctx.quadraticCurveTo(x + 130, gy - 160, x + 180, gy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(200, 196, 186, ${0.12 + 0.22 * hot})`;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.ellipse(x + 90 + Math.sin(clock * 0.6 + i) * 16, gy - 300 - i * 34 - ((clock * 18) % 34), 60 + i * 14, 22 + i * 4, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#1d1b18';
  ctx.beginPath(); ctx.ellipse(x + 340, gy, 130, 130, 0, Math.PI, TAU); ctx.fill();
  ctx.fillRect(x + 210, gy - 40, 260, 40);
  heatLines(ctx, x + 340, gy - 130, 160, 60, clock, 0.25 * hot);
  ctx.fillStyle = 'rgba(229, 190, 120, 0.6)';
  ctx.fillRect(x + 300, gy - 30, 12, 12);
}

const cinderhalo = {
  id: 'unit14', name: 'Cinder Halo', sub: 'Old reactor station', groundY: GY, lamp: true, guide: 'cloak', evidenceX: 1400,
  backdrop(ctx, camX, T, clock) {
    scape(ctx, camX, CINDER, clock);
    reactor(ctx, at(1500, camX, 0.6), GY - 10, clock);
    drift(ctx, 1511, 60, clock, { color: '160, 150, 140', a: 0.25, vx: 12, vy: 10 });
  },
  incident(ctx, t, clock) {
    const [dx, dy] = shake(clock, 0.15 * held(t, 1.0, 5.0));
    ctx.save();
    ctx.translate(dx, dy);
    scape(ctx, 0, CINDER, clock);
    reactor(ctx, 380, GY, clock, lerp(0.4, 1, span(t, 0.5, 3)));
    // The fuel line that should feed it lies cut and dry.
    ctx.fillStyle = '#3c3833';
    ctx.fillRect(0, GY - 22, 260, 14);
    ctx.fillRect(300, GY - 22, 100, 14);
    // Hooded figures stand watch on the hall roof.
    person(ctx, 680, GY - 124, 0.42, { kind: 'hood', pose: 'stand', f: -1, clock });
    person(ctx, 760, GY - 122, 0.42, { kind: 'hood', pose: 'stand', f: 1, clock });
    ctx.restore();
  },
  evidence(ctx, sx, gy, rev) {
    // The cut end of the fuel line, its bore empty.
    ctx.fillStyle = '#3c3833';
    ctx.fillRect(sx - 90, gy - 24, 90, 16);
    ctx.fillStyle = '#5b554c';
    ctx.fillRect(sx - 4, gy - 30, 8, 28);
    alpha(ctx, 0.4 + 0.6 * rev, () => { ctx.fillStyle = '#0c0b09'; ctx.beginPath(); ctx.ellipse(sx + 2, gy - 16, 3, 7, 0, 0, TAU); ctx.fill(); });
  }
};

export const WORLDS_C = { unit10: brinewire, unit11: quicklight, unit12: lodestone, unit13: thornmere, unit14: cinderhalo };

/** Props and settings the story shots (`plots-c.js`) reuse. */
export const PROPS_C = { BRINE, pylon, cable, sparks, copperBars, QUICK, fuelTower, LODE, drum, crane, THORN, outpost, CINDER, reactor };
