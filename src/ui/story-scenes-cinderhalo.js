/**
 * story-scenes-cinderhalo.js — Vess's debrief painters for Cinder Halo (unit14), authored on 960 × 540 and registered in `story-scenes.js`
 * through `legacy()`. Each scene redraws the bench's own picture with the kit's own drawing helpers (`nuke-draw.js`) and the planners in
 * `nucdata.js`, so every number Vess talks over is counted from what is drawn. Each bench adds its painter under its own marker.
 */

import { C as K, text, ground, win, ease } from './story-kit.js';
import { C, drawNucleus, protonSlots, nucleon, gammaWave, lepton, commas, nucSym } from '../learn/table/kits/nuke-draw.js';
import { countsOf, decayOf, symbolOf, nameOf, leftAt, generations, BE_PER_NUCLEON, stableOf as STABLE_OF, decayTimes, gridLeft } from '../learn/engine/nucdata.js';

/** The bench helpers draw in fixture units; on the story plate one unit is one pixel. */
export const PX = Object.freeze({ x: d => d, y: d => d, len: d => d, size: (k, min = 6.5) => Math.max(min, k) });

const head = (ctx, s) => text(ctx, s, 480, 56, { size: 26, color: K.text, align: 'center', weight: 700 });

/** Tracks from a sample block at (x0, y) toward a tube at x1; `n` tracks, `k` 0..1 how far they have gone. */
function stream(ctx, x0, y, x1, n, k, color = C.alpha) {
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  for (let i = 0; i < n; i++) {
    const yy = y + ((i * 37) % 60) - 30;
    const reach = Math.min(1, k * 1.4 - i / n * 0.4);
    if (reach <= 0) continue;
    ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + (x1 - x0) * reach, yy + (y - yy) * reach * 0.6); ctx.stroke();
  }
  ctx.lineWidth = 1;
}

/* ---- q1-still-warm: two ores counted; one nucleus becomes thorium; the count that cold does not change ---- */
function warm(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t < 0.33) {
    head(ctx, 'Two ores on the counter');
    const k = win(t, 0.03, 0.28);
    const a = countsOf('oreU', { run: 1 }); const b = countsOf('oreFe', { run: 1 });
    [[220, 'Ore A', a, true], [740, 'Ore B', b, false]].forEach(([x, label, c, hot]) => {
      ctx.fillStyle = '#7b6a52'; ctx.fillRect(x - 90, 220, 50, 90);
      ctx.fillStyle = '#2b2925'; ctx.fillRect(x + 60, 245, 50, 40);
      if (hot) stream(ctx, x - 40, 265, x + 60, 10, k);
      text(ctx, label, x, 350, { size: 22, color: K.text, align: 'center' });
      text(ctx, `${commas(Math.round(c * k))} counts in a minute`, x, 390, { size: 20, color: hot ? K.amber : K.dim, align: 'center' });
    });
  } else if (t < 0.66) {
    head(ctx, 'One uranium nucleus decays');
    const k = ease(win(t, 0.36, 0.6));
    const isP = protonSlots(92, 146, 'story-u');
    drawNucleus(ctx, PX, 360, 280, 120, isP, { skip: k > 0.05 ? new Set([0, 1, 2, 3].map(i => isP.length - 1 - i)) : null });
    const ox = 480 + k * 300;
    [[-9, -9, 'p'], [9, 9, 'p'], [9, -9, 'n'], [-9, 9, 'n']].forEach(([dx, dy, kind]) => nucleon(ctx, PX, ox + dx, 280 + dy, 9, kind));
    const after = decayOf(92, 238, 'alpha');
    text(ctx, k < 1 ? '92 protons · 146 neutrons: uranium' : `${after.Z} protons · ${after.A - after.Z} neutrons: ${nameOf(after.Z)}`, 360, 440, { size: 22, color: k < 1 ? K.text : K.amber, align: 'center' });
    if (k > 0.3) text(ctx, '2 protons + 2 neutrons', ox, 320, { size: 18, color: K.amber, align: 'center' });
  } else {
    head(ctx, 'Cold, warm, hot: one count');
    const k = win(t, 0.68, 0.78);
    [[-40, 200, 1.5, 18], [20, 480, 5.5, 55], [300, 760, 12, 120]].forEach(([T, x, amp, freq], i) => {
      const c = countsOf('oreU', { temp: T, run: 4 + i });
      for (let j = 0; j < 12; j++) {
        const px = x - 40 + (j % 4) * 26 + Math.sin(t * freq + j * 1.9) * amp; const py = 210 + Math.floor(j / 4) * 26 + Math.cos(t * (freq * 0.85) + j * 2.7) * amp;
        ctx.fillStyle = '#9a8260'; ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill();
      }
      text(ctx, `${T === -40 ? '−40' : T} °C`, x, 330, { size: 24, color: K.text, align: 'center' });
      text(ctx, `${commas(Math.round(c * k))} counts/min`, x, 372, { size: 22, color: K.amber, align: 'center' });
    });
  }
}

/* ---- q2-what-comes-off: three tracks between the plates; three shields + ionization; alpha's dense trail in the cells ---- */
function rays(ctx, w, h, t) {
  ground(ctx, w, h);
  const track = (x0, y0, len, bend, color, wide, k) => {
    ctx.strokeStyle = color; ctx.lineWidth = wide; ctx.beginPath();
    for (let s = 0; s <= len * k; s += 6) { const y = y0 + bend * s * s; if (s === 0) ctx.moveTo(x0 + s, y); else ctx.lineTo(x0 + s, y); }
    ctx.stroke(); ctx.lineWidth = 1;
  };
  if (t < 0.33) {
    head(ctx, 'Between the charged plates');
    const k = win(t, 0.03, 0.25);
    ctx.fillStyle = '#9a5832'; ctx.fillRect(200, 150, 560, 12); ctx.fillStyle = '#44658c'; ctx.fillRect(200, 410, 560, 12);
    text(ctx, '+', 784, 160, { size: 30, color: K.amber, align: 'center', weight: 700 }); text(ctx, '−', 784, 420, { size: 30, color: K.text, align: 'center', weight: 700 });
    track(200, 285, 520, 0.00018, C.alpha, 3.5, k); track(200, 285, 380, -0.0009, C.beta, 2, k);
    gammaWave(ctx, PX, 200, 285, 0, 540 * k, t * 40);
    if (k > 0.7) { text(ctx, 'alpha (+2, heavy)', 720, 355, { size: 20, color: K.amber }); text(ctx, 'beta (−1, light)', 540, 182, { size: 20, color: K.text }); text(ctx, 'gamma (no charge)', 740, 290, { size: 20, color: K.text }); }
  } else if (t < 0.66) {
    head(ctx, 'Paper, aluminium, lead');
    const k = win(t, 0.36, 0.58);
    ctx.fillStyle = C.shield.paper; ctx.fillRect(350, 160, 6, 250);
    ctx.fillStyle = C.shield.aluminium; ctx.fillRect(520, 160, 18, 250);
    ctx.fillStyle = C.shield.lead; ctx.fillRect(690, 160, 46, 250);
    // Alpha stops at paper with a dense trail of ions; beta stops in aluminium; gamma stops deep in lead.
    const aLen = Math.min(170, 550 * k);
    const bLen = Math.min(345, 550 * k);
    const gLen = Math.min(540, 560 * k);
    track(180, 215, aLen, 0, C.alpha, 3.5, 1);
    ctx.fillStyle = C.ion;
    for (let x = 195; x < 180 + aLen; x += 12) ctx.fillRect(x, 208 + ((x * 7) % 14), 5, 5);
    track(180, 290, bLen, 0, C.beta, 2, 1);
    for (let x = 210; x < 180 + bLen; x += 48) ctx.fillRect(x, 284 + ((x * 5) % 12), 4, 4);
    gammaWave(ctx, PX, 180, 365, 0, gLen, t * 40);
    text(ctx, 'paper', 353, 442, { size: 20, color: K.text, align: 'center' });
    text(ctx, 'aluminium', 529, 442, { size: 20, color: K.text, align: 'center' });
    text(ctx, 'lead', 713, 442, { size: 20, color: K.text, align: 'center' });
    text(ctx, 'Charged particles tear off electrons (ions) and lose energy fast', 480, 488, { size: 19, color: K.amber, align: 'center' });
  } else {
    head(ctx, 'Inside the body');
    const k = win(t, 0.69, 0.90);
    for (let i = 0; i < 12; i++) for (let j = 0; j < 3; j++) { ctx.strokeStyle = '#6e4e44'; ctx.strokeRect(180 + i * 50, 200 + j * 50, 48, 48); }
    track(160, 275, 100 * k, 0, C.alpha, 3.5, 1);
    ctx.strokeStyle = K.amber; ctx.lineWidth = 2;
    for (let n = 0; n < 26; n++) {
      const x = 184 + (n % 13) * 7.5; const y = 225 + ((n * 37) % 100);
      if (x - 160 < 100 * k) { ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4); ctx.stroke(); }
    }
    ctx.lineWidth = 1;
    text(ctx, `${Math.round(26 * k)} broken molecules in the first two cells`, 480, 405, { size: 22, color: K.amber, align: 'center' });
  }
}

/* ---- q3-equations: the alpha equation balanced; a neutron turning; the walk from uranium to lead ---- */
function equations(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t < 0.33) {
    head(ctx, 'Both numbers balance');
    const k = ease(win(t, 0.02, 0.14));
    let x = 250;
    x += nucSym(ctx, PX, x, 260, 238, 92, 'U', 40) + 20;
    text(ctx, '→', x, 260, { size: 40, color: K.text }); x += 60;
    x += nucSym(ctx, PX, x, 260, 234, 90, 'Th', 40, { color: K.amber }) + 20;
    text(ctx, '+', x, 260, { size: 40, color: K.text }); x += 40;
    nucSym(ctx, PX, x, 260, 4, 2, 'He', 40);
    if (k > 0.2) text(ctx, '238 = 234 + 4      92 = 90 + 2', 480, 395, { size: 26, color: K.amber, align: 'center' });
  } else if (t < 0.66) {
    head(ctx, 'A neutron becomes a proton');
    const k = win(t, 0.36, 0.62);
    const isP = protonSlots(12, 14, 'story-b');
    const turn = new Map([[0, { to: isP[0] ? 'n' : 'p', k: Math.min(1, k * 2) }]]);
    drawNucleus(ctx, PX, 400, 280, 90, isP, { turn });
    if (k > 0.4) lepton(ctx, PX, 500 + (k - 0.4) * 500, 270, 8);
    text(ctx, k < 0.5 ? '90 protons · 144 neutrons' : '91 protons · 143 neutrons: protactinium-234', 480, 440, { size: 22, color: k < 0.5 ? K.text : K.amber, align: 'center' });
  } else {
    head(ctx, 'Uranium-238 down to lead-206');
    const k = win(t, 0.69, 0.92);
    const seq = 'abbaaaaabbabba'; let Z = 92; let N = 146;
    const X = z => 180 + (z - 80) * 50; const Y = n => 115 + (147 - n) * 13;
    // Grid lines and axis labels so the walk is readable.
    ctx.strokeStyle = '#2d2924'; ctx.lineWidth = 1;
    for (let z = 80; z <= 92; z += 2) { ctx.beginPath(); ctx.moveTo(X(z), 110); ctx.lineTo(X(z), 425); ctx.stroke(); text(ctx, String(z), X(z), 445, { size: 15, color: K.dim, align: 'center' }); }
    for (let n = 124; n <= 146; n += 4) { ctx.beginPath(); ctx.moveTo(175, Y(n)); ctx.lineTo(790, Y(n)); ctx.stroke(); text(ctx, String(n), 155, Y(n) + 5, { size: 15, color: K.dim, align: 'right' }); }
    text(ctx, 'Protons →', 790, 445, { size: 16, color: K.text, align: 'right' });
    text(ctx, 'Neutrons ↑', 140, 110, { size: 16, color: K.text, align: 'right' });
    ctx.strokeStyle = K.amber; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(X(Z), Y(N));
    const upto = Math.round(seq.length * k);
    for (let i = 0; i < upto; i++) { if (seq[i] === 'a') { Z -= 2; N -= 2; } else { Z += 1; N -= 1; } ctx.lineTo(X(Z), Y(N)); }
    ctx.stroke(); ctx.lineWidth = 1;
    text(ctx, 'U-238', X(92) + 12, Y(146) + 5, { size: 18, color: K.text });
    text(ctx, 'Pb-206', X(82) - 12, Y(124) + 5, { size: 18, color: K.amber, align: 'right' });
    const a = [...seq.slice(0, upto)].filter(c => c === 'a').length;
    text(ctx, `${a} alpha, ${upto - a} beta: ${nameOf(Z)}-${Z + N}`, 480, 490, { size: 22, color: K.amber, align: 'center' });
  }
}

/* ---- q4-stability: the band of stability, light and heavy; carbon-14 moved onto it ---- */
function stability(ctx, w, h, t) {
  ground(ctx, w, h);
  const draw = (z1, n1, k) => {
    const cell = Math.min(640 / z1, 360 / n1); const X = z => 160 + (z - 1) * cell; const Y = n => 460 - n * cell;
    ctx.strokeStyle = '#9aa3ab'; ctx.lineWidth = 2; ctx.setLineDash?.([6, 5]);
    ctx.beginPath(); ctx.moveTo(X(1), Y(1)); ctx.lineTo(X(Math.min(z1, n1)), Y(Math.min(z1, n1))); ctx.stroke();
    ctx.setLineDash?.([]); ctx.lineWidth = 1;
    for (let Z = 1; Z <= z1; Z++) for (const A of (STABLE_OF(Z))) {
      const N = A - Z; if (N > n1 || Z > z1 * k + 1) continue;
      ctx.fillStyle = '#c9933e'; ctx.fillRect(X(Z), Y(N) - cell, Math.max(3.5, cell - 0.8), Math.max(3.5, cell - 0.8));
    }
    text(ctx, 'Protons →', 800, 492, { size: 18, color: K.text, align: 'right' });
    text(ctx, 'Neutrons ↑', 145, 110, { size: 18, color: K.text, align: 'right' });
    return { X, Y, cell };
  };
  if (t < 0.33) { head(ctx, 'Up to calcium'); const g = draw(20, 28, win(t, 0.03, 0.25)); text(ctx, 'equal numbers (N = Z)', g.X(19), g.Y(17), { size: 18, color: '#b8c2cc' }); }
  else if (t < 0.66) {
    head(ctx, 'The whole band');
    const g = draw(83, 127, win(t, 0.36, 0.56));
    text(ctx, 'equal numbers', g.X(76), g.Y(68), { size: 18, color: '#b8c2cc' });
    text(ctx, 'stable nuclei', g.X(45), g.Y(84), { size: 19, color: K.amber });
    if (t > 0.52) text(ctx, 'lead-208: 82 protons, 126 neutrons', g.X(82) - 16, g.Y(126) - 18, { size: 20, color: K.amber, align: 'right' });
  } else {
    head(ctx, 'Carbon-14 decays onto the band');
    const g = draw(10, 12, 1); const k = win(t, 0.7, 0.88);
    const x0 = g.X(6) + g.cell / 2; const y0 = g.Y(8) - g.cell / 2; const x1 = g.X(7) + g.cell / 2; const y1 = g.Y(7) - g.cell / 2;
    ctx.strokeStyle = K.amber; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k); ctx.stroke(); ctx.lineWidth = 1;
    text(ctx, 'carbon-14 (6p, 8n)', 640, 180, { size: 20, color: K.text });
    if (k > 0.8) text(ctx, '→ nitrogen-14 (7p, 7n, stable)', 640, 220, { size: 20, color: K.amber });
  }
}

/* ---- q5-half-gone: the grid halving, then halving again; the carbon clock ---- */
function halflife(ctx, w, h, t) {
  ground(ctx, w, h);
  const grid = (days, label) => {
    const left = gridLeft(decayTimes(256, 8.02, 7), days);
    const T = decayTimes(256, 8.02, 7);
    for (let i = 0; i < 256; i++) { ctx.fillStyle = T[i] <= days ? '#3a3630' : C.alpha; ctx.beginPath(); ctx.arc(330 + (i % 16) * 19, 130 + Math.floor(i / 16) * 19, 7, 0, Math.PI * 2); ctx.fill(); }
    text(ctx, `${label}: ${left} of 256 left`, 480, 470, { size: 24, color: K.amber, align: 'center' });
  };
  if (t < 0.33) { head(ctx, 'One half-life'); const d = Math.round(8 * win(t, 0.03, 0.28)); grid(d, `Day ${d}`); }
  else if (t < 0.66) { head(ctx, 'Half again'); const d = 8 + Math.round(8 * win(t, 0.36, 0.6)); grid(d, `Day ${d}`); }
  else {
    head(ctx, 'The carbon clock');
    const k = win(t, 0.69, 0.90); const steps = Math.min(3, Math.floor(k * 4));
    [15.3, 7.7, 3.8, 1.9].slice(0, steps + 1).forEach((v, i) => {
      const y = 160 + i * 74;
      const bw = (v / 15.3) * 420;
      ctx.fillStyle = i === 3 ? K.amber : '#7b6a52';
      ctx.fillRect(280, y - 16, bw, 28);
      text(ctx, `${(i * 5730).toLocaleString('en-US')} yr`, 262, y + 6, { size: 22, color: K.text, align: 'right' });
      text(ctx, `${v} /min/g`, 292 + bw, y + 6, { size: 22, color: i === 3 ? K.amber : K.text });
    });
  }
}

/* ---- q6-shortfall: the balance; the split; the chain ---- */
function shortfall(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t < 0.33) {
    head(ctx, 'Lighter together');
    const k = ease(win(t, 0.04, 0.22)); const a = 0.14 * k;
    ctx.strokeStyle = K.text; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(480 - 220 * Math.cos(a), 220 + 220 * Math.sin(a)); ctx.lineTo(480 + 220 * Math.cos(a), 220 - 220 * Math.sin(a)); ctx.stroke(); ctx.lineWidth = 1;
    text(ctx, '2 protons + 2 neutrons: 4.032 u', 250, 325, { size: 21, color: K.text, align: 'center' });
    text(ctx, 'helium-4: 4.002 u', 710, 285, { size: 21, color: K.amber, align: 'center' });
    if (k > 0.6) text(ctx, 'Missing 0.0304 u × 931.5 = 28.3 MeV', 480, 440, { size: 25, color: K.amber, align: 'center' });
  } else if (t < 0.66) {
    head(ctx, 'Splitting uranium-235');
    const k = ease(win(t, 0.36, 0.58));
    if (k < 0.25) drawNucleus(ctx, PX, 480, 265, 85, protonSlots(92, 143, 'su'));
    else {
      drawNucleus(ctx, PX, 480 - k * 170, 255, 70, protonSlots(56, 85, 'sb'));
      drawNucleus(ctx, PX, 480 + k * 170, 275, 60, protonSlots(36, 56, 'sk'));
      for (let i = -1; i <= 1; i++) nucleon(ctx, PX, 480 + k * 210, 265 + i * 55 * k, 8, 'n', C.e);
      text(ctx, '+ 173 MeV', 480, 155, { size: 26, color: K.amber, align: 'center', weight: 700 });
    }
    text(ctx, '236.053 u before   →   235.867 u after (−0.186 u)', 480, 465, { size: 22, color: K.amber, align: 'center' });
  } else {
    head(ctx, 'The chain');
    const k = win(t, 0.69, 0.92);
    [[0, 'none soaked up'], [2, 'two soaked up']].forEach(([ab, lab], row) => {
      const g = generations(ab, 4); const shown = Math.min(4, Math.floor(k * 4.5) + 1);
      const ry = 200 + row * 155;
      text(ctx, lab, 90, ry + 8, { size: 21, color: K.text });
      for (let i = 0; i < shown; i++) {
        const cx = 330 + i * 150;
        const n = g[i];
        const cols = Math.ceil(Math.sqrt(n));
        for (let d = 0; d < n; d++) {
          ctx.fillStyle = K.amber;
          ctx.beginPath(); ctx.arc(cx - (cols - 1) * 7 + (d % cols) * 14, ry - 26 + Math.floor(d / cols) * 14, 5, 0, Math.PI * 2); ctx.fill();
        }
        text(ctx, String(n), cx, ry + 56, { size: 24, color: K.amber, align: 'center' });
      }
    });
  }
}

/* ---- boss-core: the five phases; the rods dropping home ---- */
function core(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t < 0.31) {
    head(ctx, 'Frozen can and leaking cask');
    const k = win(t, 0.03, 0.25);
    ctx.fillStyle = '#4b4f56'; ctx.fillRect(180, 190, 120, 160);
    text(ctx, 'Can C (−40 °C)', 240, 385, { size: 20, color: K.amber, align: 'center' });
    ctx.fillStyle = '#5a4e3f'; ctx.fillRect(540, 190, 120, 160);
    stream(ctx, 660, 240, 820, 6, k, C.beta);
    gammaWave(ctx, PX, 660, 300, 0, 160 * k, t * 40);
    text(ctx, 'Cask: beta + gamma', 600, 385, { size: 20, color: K.amber, align: 'center' });
  } else if (t < 0.63) {
    head(ctx, 'Coolant and cobalt source');
    const k = win(t, 0.34, 0.56);
    let x = 150;
    x += nucSym(ctx, PX, x, 245, 24, 11, 'Na', 34) + 18;
    text(ctx, '→', x, 245, { size: 34, color: K.text }); x += 48;
    nucSym(ctx, PX, x, 245, 24, 12, 'Mg', 34, { color: K.amber });
    text(ctx, 'beta decay in coolant', 250, 320, { size: 20, color: K.text, align: 'center' });
    [3200, 1600, 800, 400].forEach((v, i) => {
      const bw = (v / 3200) * 260 * Math.min(1, k * 2);
      ctx.fillStyle = i === 3 ? K.amber : '#7b6a52';
      ctx.fillRect(540, 175 + i * 52, bw, 26);
      text(ctx, `${commas(v)}`, 548 + bw, 195 + i * 52, { size: 19, color: i === 3 ? K.amber : K.text });
    });
    text(ctx, 'Co-60: 3 half-lives (15.8 yr)', 670, 415, { size: 20, color: K.amber, align: 'center' });
  } else {
    head(ctx, 'Rods home');
    ctx.fillStyle = '#4b4f56'; ctx.fillRect(400, 210, 160, 190);
    const k = win(t, 0.65, 0.90);
    for (let i = 0; i < 7; i++) { const top = 130 + k * 90; ctx.fillStyle = '#d99e42'; ctx.fillRect(410 + i * 22, top, 8, 80); }
    const g = generations(2, 4);
    text(ctx, `173 MeV per fission · fissions per generation: ${g.join(', ')}`, 480, 465, { size: 22, color: K.amber, align: 'center' });
  }
}

export const CINDERHALO_SCENES = {
  'ch-warm': warm,
  // q2-what-comes-off
  'ch-rays': rays,
  // q3-equations
  'ch-equations': equations,
  // q4-stability
  'ch-stability': stability,
  // q5-half-gone
  'ch-halflife': halflife,
  // q6-shortfall
  'ch-shortfall': shortfall,
  // boss-core
  'ch-core': core
};

export { gammaWave, lepton, nucSym, symbolOf, leftAt, generations, BE_PER_NUCLEON };
