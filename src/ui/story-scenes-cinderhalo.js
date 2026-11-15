/**
 * story-scenes-cinderhalo.js — Vess's debrief painters for Cinder Halo (unit14), authored on 960 × 540 and registered in `story-scenes.js`
 * through `legacy()`. Each scene redraws the bench's own picture with the kit's own drawing helpers (`nuke-draw.js`) and the planners in
 * `nucdata.js`, so every number Vess talks over is counted from what is drawn. Each bench adds its painter under its own marker.
 */

import { C as K, text, ground, win, ease } from './story-kit.js';
import { C, drawNucleus, protonSlots, nucleon, gammaWave, lepton, commas, nucSym } from '../learn/table/kits/nuke-draw.js';
import { countsOf, decayOf, symbolOf, nameOf, leftAt, generations, BE_PER_NUCLEON } from '../learn/engine/nucdata.js';

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
    const k = win(t, 0.69, 0.95);
    [[-40, 200], [20, 480], [300, 760]].forEach(([T, x], i) => {
      const c = countsOf('oreU', { temp: T, run: 4 + i });
      const amp = 4 * Math.sqrt((T + 273) / 293);
      for (let j = 0; j < 12; j++) {
        const px = x - 40 + (j % 4) * 26 + Math.sin(t * 90 + j * 1.9) * amp; const py = 210 + Math.floor(j / 4) * 26 + Math.cos(t * 80 + j * 2.7) * amp;
        ctx.fillStyle = '#7b6a52'; ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill();
      }
      text(ctx, `${T === -40 ? '−40' : T} °C`, x, 330, { size: 22, color: K.text, align: 'center' });
      text(ctx, `${commas(Math.round(c * k))} counts`, x, 370, { size: 20, color: K.amber, align: 'center' });
    });
  }
}

/* ---- q2-what-comes-off: three tracks between the plates; three shields; alpha's dense trail in the cells ---- */
function rays(ctx, w, h, t) {
  ground(ctx, w, h);
  const track = (x0, y0, len, bend, color, wide, k) => {
    ctx.strokeStyle = color; ctx.lineWidth = wide; ctx.beginPath();
    for (let s = 0; s <= len * k; s += 6) { const y = y0 + bend * s * s; if (s === 0) ctx.moveTo(x0 + s, y); else ctx.lineTo(x0 + s, y); }
    ctx.stroke(); ctx.lineWidth = 1;
  };
  if (t < 0.33) {
    head(ctx, 'Between the charged plates');
    const k = win(t, 0.03, 0.28);
    ctx.fillStyle = '#7a4a32'; ctx.fillRect(200, 150, 560, 10); ctx.fillStyle = '#3e5470'; ctx.fillRect(200, 410, 560, 10);
    text(ctx, '+', 780, 158, { size: 26, color: K.amber, align: 'center' }); text(ctx, '−', 780, 418, { size: 26, color: K.text, align: 'center' });
    track(200, 285, 520, 0.00018, C.alpha, 3, k); track(200, 285, 380, -0.0009, C.beta, 1.5, k);
    gammaWave(ctx, PX, 200, 285, 0, 540 * k, t * 40);
    if (k > 0.9) { text(ctx, 'alpha', 730, 345, { size: 18, color: K.amber }); text(ctx, 'beta', 560, 170, { size: 18, color: K.text }); text(ctx, 'gamma', 760, 290, { size: 18, color: K.text }); }
  } else if (t < 0.66) {
    head(ctx, 'Paper, aluminium, lead');
    const k = win(t, 0.36, 0.62);
    ctx.fillStyle = C.shield.paper; ctx.fillRect(350, 160, 4, 260);
    ctx.fillStyle = C.shield.aluminium; ctx.fillRect(520, 160, 16, 260);
    ctx.fillStyle = C.shield.lead; ctx.fillRect(690, 160, 40, 260);
    track(180, 220, Math.min(170, 600 * k), 0, C.alpha, 3, 1);
    track(180, 290, Math.min(345, 600 * k), 0, C.beta, 1.5, 1);
    gammaWave(ctx, PX, 180, 360, 0, 600 * k, t * 40);
    text(ctx, 'paper', 352, 445, { size: 18, color: K.dim, align: 'center' }); text(ctx, 'aluminium', 528, 445, { size: 18, color: K.dim, align: 'center' }); text(ctx, 'lead', 710, 445, { size: 18, color: K.dim, align: 'center' });
  } else {
    head(ctx, 'Inside the body');
    const k = win(t, 0.69, 0.92);
    for (let i = 0; i < 12; i++) for (let j = 0; j < 3; j++) { ctx.strokeStyle = '#5a4038'; ctx.strokeRect(180 + i * 50, 200 + j * 50, 48, 48); }
    track(160, 275, 100 * k, 0, C.alpha, 3, 1);
    ctx.fillStyle = C.ion;
    for (let n = 0; n < 26; n++) { const x = 180 + (n % 13) * 7.5; if (x - 160 < 100 * k) ctx.fillRect(x, 230 + ((n * 37) % 90), 6, 6); }
    text(ctx, `${Math.round(26 * k)} broken molecules in the first two cells`, 480, 400, { size: 20, color: K.amber, align: 'center' });
  }
}

/* ---- q3-equations: the alpha equation balanced; a neutron turning; the walk from uranium to lead ---- */
function equations(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t < 0.33) {
    head(ctx, 'Both numbers balance');
    const k = ease(win(t, 0.03, 0.25));
    let x = 250;
    x += nucSym(ctx, PX, x, 270, 238, 92, 'U', 40) + 20;
    text(ctx, '→', x, 270, { size: 40, color: K.text }); x += 60;
    x += nucSym(ctx, PX, x, 270, 234, 90, 'Th', 40, { color: K.amber }) + 20;
    text(ctx, '+', x, 270, { size: 40, color: K.text }); x += 40;
    nucSym(ctx, PX, x, 270, 4, 2, 'He', 40);
    if (k > 0.5) text(ctx, '238 = 234 + 4      92 = 90 + 2', 480, 400, { size: 24, color: K.amber, align: 'center' });
  } else if (t < 0.66) {
    head(ctx, 'A neutron becomes a proton');
    const k = win(t, 0.36, 0.62);
    const isP = protonSlots(12, 14, 'story-b');
    const turn = new Map([[0, { to: isP[0] ? 'n' : 'p', k: Math.min(1, k * 2) }]]);
    drawNucleus(ctx, PX, 400, 280, 90, isP, { turn });
    if (k > 0.4) lepton(ctx, PX, 500 + (k - 0.4) * 500, 270, 7);
    text(ctx, k < 0.5 ? '90 protons · 144 neutrons' : '91 protons · 143 neutrons: protactinium-234', 480, 440, { size: 22, color: k < 0.5 ? K.text : K.amber, align: 'center' });
  } else {
    head(ctx, 'Uranium-238 down to lead-206');
    const k = win(t, 0.69, 0.95);
    const seq = 'abbaaaaabbabba'; let Z = 92; let N = 146;
    const X = z => 160 + (z - 80) * 50; const Y = n => 120 + (147 - n) * 13;
    ctx.strokeStyle = K.amber; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(Z), Y(N));
    const upto = Math.round(seq.length * k);
    for (let i = 0; i < upto; i++) { if (seq[i] === 'a') { Z -= 2; N -= 2; } else { Z += 1; N -= 1; } ctx.lineTo(X(Z), Y(N)); }
    ctx.stroke(); ctx.lineWidth = 1;
    const a = [...seq.slice(0, upto)].filter(c => c === 'a').length;
    text(ctx, `${a} alpha, ${upto - a} beta: ${nameOf(Z)}-${Z + N}`, 480, 470, { size: 22, color: K.amber, align: 'center' });
  }
}

export const CINDERHALO_SCENES = {
  'ch-warm': warm,
  // q2-what-comes-off
  'ch-rays': rays,
  // q3-equations
  'ch-equations': equations,
  // q4-stability
  // q5-half-gone
  // q6-shortfall
  // boss-core
};

export { gammaWave, lepton, nucSym, symbolOf, leftAt, generations, BE_PER_NUCLEON };
