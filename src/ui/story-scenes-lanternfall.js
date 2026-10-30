/**
 * story-scenes-lanternfall.js — the pictures behind Lanternfall's quest animations (`story/quest-story.js`, keys `unit02/...`).
 *
 * Same contract as `story-scenes.js`: each painter draws one frame from a progress `t` in [0, 1] on a canvas of `w` x `h`, as a pure
 * function of `t`, in the SCOURED PLATE palette (obsidian, titanium, one amber signal, no glow). Each is drawn from the numbers its bench
 * measured (`lightdata.js`, `orbitals.js`, `electrons.js`), never from a figure typed here. `story-scenes.js` spreads `LANTERNFALL_SCENES`
 * into `SCENES`.
 */

import { mulberry32 } from '../learn/engine/plates.js';
import { planTrace, wavelengthRgb, planPhotocell, planAbsorb, planJump, LINES } from '../learn/engine/lightdata.js';
import { sampleOrbital } from '../learn/engine/orbitals.js';
import { planPES, rackFor, groundConfig, LADDER, boxesOf, RADIUS as ATOM_RADIUS } from '../learn/engine/electrons.js';
import { C as KIT, disc, line, legacyText as text, ground } from './story-kit.js';
const C = KIT;


const clamp01 = v => Math.max(0, Math.min(1, v));
const win = (t, a, b) => clamp01((t - a) / (b - a));
const lerp = (a, b, v) => a + (b - a) * v;
const ease = v => v * v * (3 - 2 * v);
const css = rgb => (rgb ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : C.pale);

const label = (ctx, w, h, str, color = C.dust) => text(ctx, str, w / 2, h * 0.93, { size: Math.max(11, h * 0.04), color });

/* ---- q1-wave: two waves slide past a counter at one speed; the shorter wave puts more crests through it, and a pulse of each crosses the gap together ---- */
function waveBeacon(ctx, w, h, t) {
  ground(ctx, w, h);
  const x0 = w * 0.1;
  const L = w * 0.8;
  const draw = ease(win(t, 0.03, 0.2));
  // Both waves slide right at the same speed; the counter stands at the far end and counts the crests that cross it.
  const slide = L * 1.4 * win(t, 0.22, 0.6);
  const xd = x0 + L * 0.92;
  line(ctx, xd, h * 0.14, xd, h * 0.7, C.dim, 1, [4, 5]);
  [[700, 0.3, 'red'], [400, 0.55, 'violet']].forEach(([nm, yy, name]) => {
    const per = (nm / planTrace(nm).span) * L;
    ctx.beginPath();
    for (let i = 0; i <= 240; i++) {
      const x = (i / 240) * L * draw;
      const y = h * yy - Math.cos((2 * Math.PI * (x - slide)) / per) * h * 0.07;
      if (i === 0) ctx.moveTo(x0 + x, y); else ctx.lineTo(x0 + x, y);
    }
    ctx.strokeStyle = css(wavelengthRgb(nm));
    ctx.lineWidth = 2;
    ctx.stroke();
    // One wavelength, crest to crest.
    const c0 = x0 + per * 0.5 + (slide % per);
    if (draw > 0.9) {
      const by = h * yy - h * 0.12;
      line(ctx, c0, by, c0 + per, by, C.amber, 2);
      line(ctx, c0, by - 5, c0, by + 5, C.amber, 2);
      line(ctx, c0 + per, by - 5, c0 + per, by + 5, C.amber, 2);
      text(ctx, 'wavelength', c0 + per / 2, by - 14, { size: Math.max(10, h * 0.034), color: C.amber });
    }
    const passed = Math.floor(Math.max(0, slide - L * 0.08) / per);
    text(ctx, `${name}: ${passed} crests counted`, x0 - 4, h * yy + h * 0.15, { size: Math.max(11, h * 0.04), color: css(wavelengthRgb(nm)), align: 'left' });
  });
  // A pulse of each colour sets off together and arrives together: the speed does not depend on the colour.
  const p = ease(win(t, 0.62, 0.95));
  [h * 0.8, h * 0.86].forEach((y, i) => {
    line(ctx, x0, y, x0 + L, y, C.dim, 1);
    disc(ctx, x0 + L * p, y, 5, css(wavelengthRgb(i ? 400 : 700)));
  });
  if (p >= 1) text(ctx, 'same time', w / 2, h * 0.94, { size: Math.max(11, h * 0.04), color: C.amber });
}

/* ---- q2-photon: single packets reach a metal plate; a packet frees an electron only if its own energy clears the work function, and no pile of weaker ones does ---- */
function photonPlate(ctx, w, h, t) {
  ground(ctx, w, h);
  const plateX = 470;
  const WORK = 2.3;
  const rows = [{ nm: 650, y: 190, n: 5 }, { nm: 400, y: 360, n: 3 }];
  const run = win(t, 0.04, 0.8);
  // The energy scale on the right: the plate's work function is a line, and each colour's packet energy is a tick against it.
  const sx = 700; const sw = 160; const top = 110; const bot = 470;
  const Y = e => bot - (e / 3.6) * (bot - top);
  line(ctx, sx, top, sx, bot, C.steel, 2);
  text(ctx, 'energy of one packet (eV)', sx - 10, top - 28, { size: 18, color: C.dim, align: 'left' });
  line(ctx, sx - 12, Y(WORK), sx + sw, Y(WORK), C.amber, 2, [8, 6]);
  text(ctx, `work function ${WORK}`, sx + sw, Y(WORK) - 14, { size: 18, color: C.amber, align: 'right' });
  ctx.fillStyle = C.iron;
  ctx.fillRect(plateX - 7, 100, 14, 380);
  ctx.strokeStyle = C.steel;
  ctx.strokeRect(plateX - 6.5, 100.5, 13, 379);
  text(ctx, 'sodium', plateX, 500, { size: 18, color: C.dim });
  rows.forEach(({ nm, y, n }) => {
    const plan = planPhotocell('Na', nm, 3);
    const colour = css(wavelengthRgb(nm));
    const E = plan.photonEv;
    // The packet's energy on the scale.
    line(ctx, sx - 12, Y(E), sx + 40, Y(E), colour, 4);
    text(ctx, `${E.toFixed(1)}`, sx + 52, Y(E), { size: 22, color: colour, align: 'left', weight: 700 });
    if (plan.freed) {
      line(ctx, sx + 24, Y(WORK), sx + 24, Y(E), C.text, 1.5);
      text(ctx, `left over ${plan.ke.toFixed(1)}`, sx + 100, (Y(WORK) + Y(E)) / 2, { size: 16, color: C.text, align: 'left' });
    }
    let freed = 0;
    for (let i = 0; i < n; i++) {
      const at = clamp01(run * (n + 1.2) / 1.0 - i);
      const x = 70 + (plateX - 12 - 70) * clamp01(at);
      const py = y + (i - (n - 1) / 2) * 16;
      if (at < 1) {
        disc(ctx, x, py, 8, colour);
        if (at > 0.02) text(ctx, E.toFixed(1), x, py - 16, { size: 13, color: colour });
      } else if (plan.freed) {
        // The packet is gone and an electron leaves the far side carrying what was left over.
        freed++;
        const d = clamp01((run * (n + 1.2) - i - 1) / 0.6);
        disc(ctx, plateX + 20 + d * (60 + 70 * plan.ke), py, 5, C.text);
      } else {
        // Too little: the packet gives up nothing and is turned back.
        const d = clamp01((run * (n + 1.2) - i - 1) / 0.6);
        ctx.globalAlpha = 1 - d;
        disc(ctx, plateX - 12 - d * 60, py, 8, colour);
        ctx.globalAlpha = 1;
      }
    }
    text(ctx, `${n} packets`, 70, y - 54, { size: 20, color: C.dust, align: 'left' });
    if (run > 0.9) text(ctx, plan.freed ? `${n} electrons leave` : 'no electron leaves', plateX - 6, y + 56, { size: 20, color: plan.freed ? C.amber : C.dim, align: 'right', weight: 700 });
    void freed;
  });
}

/* ---- q3-lines: an electron drops between two levels and gives out a packet of exactly that energy; the drops add up to a few exact lines, which identify the gas ---- */
function lineGas(ctx, w, h, t) {
  if (t >= 0.4) { lineCompare(ctx, w, h, (t - 0.4) / 0.6); return; }
  ground(ctx, w, h);
  const lo = 380; const hi = 750;
  const bx = w * 0.46; const bw = w * 0.46;
  const xOf = nm => bx + ((nm - lo) / (hi - lo)) * bw;
  // The levels of hydrogen, 1 to 5, spaced by energy, with the electron on level 5, 4 or 3 dropping to level 2.
  const lx = w * 0.06; const lw = w * 0.26; const top = h * 0.18; const bot = h * 0.84;
  const E = n => -1 / (n * n);
  const Y = n => bot - ((E(n) - E(1)) / (E(5) - E(1))) * (bot - top);
  for (let n = 1; n <= 5; n++) {
    line(ctx, lx, Y(n), lx + lw, Y(n), n === 2 ? C.pale : C.steel, 2);
    text(ctx, `${n}`, lx - 14, Y(n), { size: Math.max(11, h * 0.04), color: C.dim });
  }
  const drops = [{ from: 3, a: 0.02 }, { from: 4, a: 0.12 }, { from: 5, a: 0.22 }, { from: 6, a: 0.31 }].filter(d => d.from <= 5 || true);
  const levelY = n => (n <= 5 ? Y(n) : top - 10);
  const band = [h * 0.3, h * 0.5];
  ctx.fillStyle = '#16140f';
  ctx.fillRect(bx, band[0], bw, band[1] - band[0]);
  text(ctx, 'light given out', bx + bw / 2, band[0] - 18, { size: Math.max(11, h * 0.036), color: C.dim });
  drops.forEach((d, i) => {
    const jump = planJump(d.from, 2);
    const col = css(wavelengthRgb(jump.nm));
    const u = win(t, d.a, d.a + 0.07);
    const x = lx + lw * (0.3 + 0.12 * i);
    // The electron falls; the packet leaves and lands as a line at its wavelength.
    if (u > 0 && u < 1) disc(ctx, x, lerp(levelY(d.from), Y(2), ease(u)), 7, C.amber);
    else if (u <= 0) disc(ctx, x, levelY(d.from), 7, C.amber);
    else disc(ctx, x, Y(2), 7, C.amber);
    const v = win(t, d.a + 0.06, d.a + 0.12);
    if (v > 0) {
      ctx.globalAlpha = v;
      line(ctx, x, Y(2) - 10, xOf(jump.nm), band[1], col, 1);
      line(ctx, xOf(jump.nm), band[0], xOf(jump.nm), band[1], col, 3);
      text(ctx, `${d.from}→2`, xOf(jump.nm), band[1] + 20, { size: Math.max(10, h * 0.032), color: col });
      ctx.globalAlpha = 1;
    }
  });
  if (t > 0.34) text(ctx, 'each line is one exact drop', bx + bw / 2, h * 0.74, { size: Math.max(11, h * 0.04), color: C.amber });
}
function lineCompare(ctx, w, h, t) {
  ground(ctx, w, h);
  const lo = 380;
  const hi = 750;
  const bx = w * 0.1;
  const bw = w * 0.8;
  const xOf = nm => bx + ((nm - lo) / (hi - lo)) * bw;
  ctx.fillStyle = '#16140f';
  ctx.fillRect(bx, h * 0.25, bw, h * 0.2);
  const on = ease(win(t, 0.05, 0.4));
  for (const nm of LINES.He) { ctx.globalAlpha = on; line(ctx, xOf(nm), h * 0.25, xOf(nm), h * 0.45, css(wavelengthRgb(nm)), 3); ctx.globalAlpha = 1; }
  text(ctx, 'sealed tube', bx, h * 0.2, { size: Math.max(10, h * 0.036), color: C.dim, align: 'left' });
  const slide = 1 - ease(win(t, 0.4, 0.8));
  for (const [gas, y] of [['He', 0.6], ['H', 0.72]]) {
    const dx = gas === 'He' ? slide * w * 0.18 : 0;
    ctx.fillStyle = C.iron;
    ctx.fillRect(bx, h * (y - 0.04), bw, h * 0.08);
    for (const nm of LINES[gas]) line(ctx, xOf(nm) + dx, h * (y - 0.04), xOf(nm) + dx, h * (y + 0.04), C.pale, 2);
    text(ctx, gas === 'He' ? 'helium' : 'hydrogen', bx - 8, h * y, { size: Math.max(10, h * 0.036), align: 'right' });
  }
  if (slide <= 0.02) text(ctx, 'every line lands', w / 2, h * 0.9, { size: Math.max(11, h * 0.04), color: C.amber });
}

/* ---- q4-cloud: shots land one by one, and five hundred of them make a ball, with no ring through it ---- */
function cloudBall(ctx, w, h, t) {
  ground(ctx, w, h);
  const pts = sampleOrbital('1s', 500, 1);
  const n = Math.round(ease(win(t, 0.05, 0.8)) * pts.length);
  const cx = w / 2;
  const cy = h * 0.46;
  const k = Math.min(w, h) * 0.075;
  for (let i = 0; i < n; i++) disc(ctx, cx + pts[i].x * k, cy - pts[i].y * k, 1.8, C.amber);
  if (t > 0.8) { ctx.setLineDash?.([6, 6]); ctx.beginPath(); ctx.arc(cx, cy, k * 3.2, 0, Math.PI * 2); ctx.strokeStyle = C.dim; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash?.([]); }
  text(ctx, `${n} shots`, w / 2, h * 0.9, { size: Math.max(11, h * 0.04), color: n >= 500 ? C.amber : C.dust });
}

/* ---- q5-numbers: every electron has four numbers; the rack hands them out box by box, and a third electron with a full box's numbers has nowhere to go ---- */
function rackAddress(ctx, w, h, t) {
  ground(ctx, w, h);
  const rows = [['1s', 1], ['2s', 1], ['2p', 3]];
  const fill = rackFor(8);
  const on = win(t, 0.05, 0.62);
  const list = [];
  rows.forEach(([id, count], r) => {
    const y = h * (0.7 - r * 0.18);
    for (let b = 0; b < count; b++) {
      const cx = w / 2 + (b - (count - 1) / 2) * w * 0.12;
      ctx.strokeStyle = C.steel;
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - w * 0.04, y - h * 0.06, w * 0.08, h * 0.12);
      const here = fill[`${id}:${b}`] || '';
      const shown = on > (r * 3 + b + 1) / 9;
      const nn = Number(id[0]); const ll = id[1] === 's' ? 0 : 1; const ml = ll ? b - 1 : 0;
      if (here.includes('u')) list.push({ cx, y, up: true, n: nn, l: ll, ml, shown, at: (r * 3 + b + 1) / 9 });
      if (here.includes('d')) list.push({ cx, y, up: false, n: nn, l: ll, ml, shown, at: (r * 3 + b + 1) / 9 + 0.001 });
      if (shown && here.includes('u')) { line(ctx, cx - w * 0.012, y + h * 0.04, cx - w * 0.012, y - h * 0.04, C.amber, 3); disc(ctx, cx - w * 0.012, y - h * 0.045, 4, C.amber); }
      if (shown && here.includes('d')) { line(ctx, cx + w * 0.012, y - h * 0.04, cx + w * 0.012, y + h * 0.04, C.pale, 3); disc(ctx, cx + w * 0.012, y + h * 0.045, 4, C.pale); }
      if (ll) text(ctx, `ml ${ml > 0 ? '+' : ''}${ml}`, cx, y + h * 0.1, { size: Math.max(10, h * 0.032), color: C.dim });
    }
    text(ctx, id, w * 0.22, y, { size: Math.max(11, h * 0.04) });
    text(ctx, `n = ${id[0]}   l = ${id[1] === 's' ? 0 : 1}`, w * 0.78, y, { size: Math.max(11, h * 0.036), color: C.dim, align: 'left' });
  });
  // The electron just placed shows all four of its numbers: its box (n, l, ml) and which way it points (ms).
  const shownList = list.filter(e => e.shown);
  const cur = shownList[shownList.length - 1];
  if (cur && t < 0.66) {
    const ex = cur.cx + (cur.up ? -1 : 1) * w * 0.012;
    ctx.strokeStyle = C.amber; ctx.lineWidth = 2;
    ctx.strokeRect(ex - 14, cur.y - h * 0.075, 28, h * 0.15);
    text(ctx, `n ${cur.n}   l ${cur.l}   ml ${cur.ml >= 0 ? (cur.ml ? '+' : '') : ''}${cur.ml}   ms ${cur.up ? '+½' : '−½'}`, w / 2, h * 0.08, { size: Math.max(12, h * 0.05), color: C.amber, weight: 700 });
  }
  // A ninth electron tries for the full 1s box: the same four numbers as one already there, so it is turned away.
  const tryU = win(t, 0.68, 0.84);
  if (tryU > 0) {
    const tx = w / 2; const ty = h * 0.7;
    const out = tryU < 0.5 ? ease(tryU / 0.5) : 1 - ease((tryU - 0.5) / 0.5);
    disc(ctx, w * 0.86 + (tx + w * 0.07 - w * 0.86) * out, ty - h * 0.04, 6, C.amber);
    if (tryU > 0.45) text(ctx, 'same four numbers: refused', w / 2, h * 0.08, { size: Math.max(12, h * 0.046), color: C.amber, weight: 700 });
  }
  if (t > 0.88) text(ctx, 'two to a box, no more', w / 2, h * 0.93, { size: Math.max(11, h * 0.04), color: C.amber });
}

/* ---- q6-filling: the ladder fills from lowest energy up, demonstrating Aufbau, Hund's rule, and 4s below 3d ---- */
function rackFill(ctx, w, h, t) {
  ground(ctx, w, h);

  // Left Energy Axis
  const ax = w * 0.14;
  const ayTop = h * 0.14;
  const ayBot = h * 0.82;
  line(ctx, ax, ayBot, ax, ayTop, C.steel, 2);

  // Axis Arrowhead
  ctx.fillStyle = C.steel;
  ctx.beginPath();
  ctx.moveTo(ax, ayTop - 6);
  ctx.lineTo(ax - 4, ayTop + 2);
  ctx.lineTo(ax + 4, ayTop + 2);
  ctx.closePath();
  ctx.fill();

  text(ctx, 'ENERGY (E)', ax, ayTop - 12, { size: Math.max(9, h * 0.032), color: C.dust, align: 'center' });

  // Rows configuration & placement
  const yOf = {
    '1s': h * 0.78,
    '2s': h * 0.67,
    '2p': h * 0.56,
    '3s': h * 0.45,
    '3p': h * 0.35,
    '4s': h * 0.25,
    '3d': h * 0.17
  };

  const xOf = {
    '1s': w * 0.45,
    '2s': w * 0.45,
    '2p': w * 0.45,
    '3s': w * 0.45,
    '3p': w * 0.45,
    '4s': w * 0.34,
    '3d': w * 0.64
  };

  const boxW = Math.max(18, Math.min(26, w * 0.036));
  const boxH = Math.max(18, Math.min(26, h * 0.052));
  const gap = boxW + 4;

  // Bracket showing 4s < 3d
  const bktX = ax + 14;
  line(ctx, bktX + 4, yOf['3d'], bktX, yOf['3d'], C.amber, 1.5);
  line(ctx, bktX, yOf['3d'], bktX, yOf['4s'], C.amber, 1.5);
  line(ctx, bktX, yOf['4s'], bktX + 4, yOf['4s'], C.amber, 1.5);
  text(ctx, '4s < 3d', bktX + 8, (yOf['3d'] + yOf['4s']) / 2, { size: Math.max(9, h * 0.03), color: C.amber, align: 'left' });

  // Draw row guides and labels
  Object.entries(yOf).forEach(([id, y]) => {
    line(ctx, ax + 4, y, ax + 10, y, C.steel, 1);
    const lx = id === '4s' ? xOf['4s'] - boxW / 2 - 8 : (id === '3d' ? xOf['3d'] - 2 * gap - boxW / 2 - 8 : w * 0.30);
    text(ctx, id, lx, y, { size: Math.max(10, h * 0.036), color: (id === '4s' || id === '3d') ? C.amber : C.text, align: 'right' });
  });

  // Calculate electron counts at progress t
  const nTotal = t < 0.28
    ? Math.round(ease(win(t, 0.02, 0.25)) * 6)
    : t < 0.65
      ? 6 + Math.round(ease(win(t, 0.28, 0.60)) * 13)
      : 19 + Math.round(ease(win(t, 0.65, 0.85)) * 2);

  const fillState = {};
  const addE = (row, b, spin) => {
    const k = `${row}:${b}`;
    if (!fillState[k]) fillState[k] = { u: false, d: false };
    fillState[k][spin] = true;
  };

  if (nTotal >= 1) addE('1s', 0, 'u');
  if (nTotal >= 2) addE('1s', 0, 'd');
  if (nTotal >= 3) addE('2s', 0, 'u');
  if (nTotal >= 4) addE('2s', 0, 'd');
  if (nTotal >= 5) addE('2p', 0, 'u');
  if (nTotal >= 6) addE('2p', 1, 'u');
  if (nTotal >= 7) addE('2p', 2, 'u');
  if (nTotal >= 8) addE('2p', 0, 'd');
  if (nTotal >= 9) addE('2p', 1, 'd');
  if (nTotal >= 10) addE('2p', 2, 'd');
  if (nTotal >= 11) addE('3s', 0, 'u');
  if (nTotal >= 12) addE('3s', 0, 'd');
  if (nTotal >= 13) addE('3p', 0, 'u');
  if (nTotal >= 14) addE('3p', 1, 'u');
  if (nTotal >= 15) addE('3p', 2, 'u');
  if (nTotal >= 16) addE('3p', 0, 'd');
  if (nTotal >= 17) addE('3p', 1, 'd');
  if (nTotal >= 18) addE('3p', 2, 'd');
  if (nTotal >= 19) addE('4s', 0, 'u');
  if (nTotal >= 20) addE('4s', 0, 'd');
  if (nTotal >= 21) addE('3d', 0, 'u');

  // Draw boxes and arrows
  const drawRowBoxes = (row, count, cx, cy) => {
    for (let b = 0; b < count; b++) {
      const bx = cx + (b - (count - 1) / 2) * gap;
      ctx.strokeStyle = C.steel;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx - boxW / 2, cy - boxH / 2, boxW, boxH);

      const st = fillState[`${row}:${b}`];
      if (st?.u) {
        const ax = st.d ? bx - boxW * 0.22 : bx;
        line(ctx, ax, cy + boxH * 0.32, ax, cy - boxH * 0.32, C.amber, 2);
        line(ctx, ax - 3, cy - boxH * 0.32 + 4, ax, cy - boxH * 0.32, C.amber, 2);
      }
      if (st?.d) {
        const ax = bx + boxW * 0.22;
        line(ctx, ax, cy - boxH * 0.32, ax, cy + boxH * 0.32, C.pale, 2);
        line(ctx, ax + 3, cy + boxH * 0.32 - 4, ax, cy + boxH * 0.32, C.pale, 2);
      }
    }
  };

  drawRowBoxes('1s', 1, xOf['1s'], yOf['1s']);
  drawRowBoxes('2s', 1, xOf['2s'], yOf['2s']);
  drawRowBoxes('2p', 3, xOf['2p'], yOf['2p']);
  drawRowBoxes('3s', 1, xOf['3s'], yOf['3s']);
  drawRowBoxes('3p', 3, xOf['3p'], yOf['3p']);
  drawRowBoxes('4s', 1, xOf['4s'], yOf['4s']);
  drawRowBoxes('3d', 5, xOf['3d'], yOf['3d']);

  // Concept labels synchronized with Vess's spoken beats
  if (t < 0.28) {
    text(ctx, "Hund's rule: carbon's 2p electrons stand alone in separate boxes (parallel spins)", w / 2, h * 0.93, { size: Math.max(11, h * 0.038), color: C.amber });
  } else if (t < 0.65) {
    text(ctx, "4s sits below 3d on the ladder: potassium's 19th electron fills 4s first", w / 2, h * 0.93, { size: Math.max(11, h * 0.038), color: C.amber });
  } else if (t < 0.88) {
    text(ctx, "4s is full (4s²): scandium's 21st electron begins the 3d row ([Ar] 4s² 3d¹)", w / 2, h * 0.93, { size: Math.max(11, h * 0.038), color: C.amber });
  } else {
    text(ctx, "4s fills before 3d · [Ar] 4s² 3d¹", w / 2, h * 0.93, { size: Math.max(11, h * 0.038), color: C.amber });
  }
}

/* ---- q7-pes: light knocks electrons out of oxygen; each row's electrons leave with the same energy and pile into one peak, 2 and 2 and 4 ---- */
function peakRows(ctx, w, h, t) {
  ground(ctx, w, h);
  const peaks = planPES('O');
  const lo = Math.log10(0.3);
  const hi = Math.log10(260);
  const x0 = w * 0.1;
  const bw = w * 0.8;
  const base = h * 0.84;
  line(ctx, x0, base, x0 + bw, base, C.steel, 2);
  text(ctx, 'held tightly', x0, base + h * 0.08, { size: Math.max(10, h * 0.034), color: C.dim, align: 'left' });
  text(ctx, 'held loosely', x0 + bw, base + h * 0.08, { size: Math.max(10, h * 0.034), color: C.dim, align: 'right' });
  // The atom, on the left: its rows as rings, with the electrons that belong to each.
  const ax = w * 0.17; const ay = h * 0.26;
  const rings = [{ r: h * 0.06, n: 2, name: '1s' }, { r: h * 0.13, n: 2, name: '2s' }, { r: h * 0.13, n: 4, name: '2p' }];
  disc(ctx, ax, ay, h * 0.028, C.amber);
  ctx.strokeStyle = C.steel; ctx.lineWidth = 1;
  [h * 0.06, h * 0.13].forEach(r => { ctx.beginPath(); ctx.arc(ax, ay, r, 0, Math.PI * 2); ctx.stroke(); });
  peaks.forEach((p, i) => {
    const x = x0 + ((hi - Math.log10(p.energy)) / (hi - lo)) * bw;
    const grow = ease(win(t, 0.08 + i * 0.26, 0.34 + i * 0.26));
    const ring = rings[i] || rings[rings.length - 1];
    const shown = Math.ceil(p.height * grow - 1e-6);
    for (let e = 0; e < p.height; e++) {
      const ang = (e / p.height) * Math.PI * 2 + (i === 2 ? 0.6 : i * 1.1);
      const off = i === 2 ? 0.07 : 0;
      const ex = ax + Math.cos(ang) * (ring.r + off * h * 0.1); const ey = ay + Math.sin(ang) * (ring.r + off * h * 0.1);
      // Electrons not yet knocked out sit on their ring; each one that is has left a disc on its peak.
      if (e >= shown) disc(ctx, ex, ey, 5, i === 0 ? C.pale : i === 1 ? C.dust : C.steel);
      else disc(ctx, ex, ey, 5, 'rgba(84,78,70,0.5)');
      if (e < shown) {
        const u = clamp01((p.height * grow - e) * 1.6);
        disc(ctx, x, base - h * 0.04 - e * h * 0.07, 7, C.amber);
        if (u < 1) disc(ctx, lerp(ex, x, ease(u)), lerp(ey, base - h * 0.04 - e * h * 0.07, ease(u)), 5, C.text);
      }
    }
    text(ctx, `${ring.name}   ${p.height}`, x, base + h * 0.035, { size: Math.max(11, h * 0.042), color: C.text, weight: 700 });
  });
  text(ctx, 'light knocks electrons out', ax + h * 0.2, ay - h * 0.14, { size: Math.max(10, h * 0.034), color: C.dust, align: 'left' });
  if (t > 0.9) text(ctx, 'two, two and four: oxygen', w / 2, h * 0.95, { size: Math.max(11, h * 0.04), color: C.amber });
}

/* ---- q8-trends: along a row each nucleus holds one more proton and pulls the same shell in harder, so the atom shrinks ---- */
const CHARGE = { Li: 3, Be: 4, B: 5, C: 6 };
function radiiRow(ctx, w, h, t) {
  ground(ctx, w, h);
  const items = ['Li', 'Be', 'B', 'C'];
  const k = (h * 0.26) / ATOM_RADIUS.Li;
  const cy = h * 0.46;
  items.forEach((s, i) => {
    const grow = ease(win(t, 0.05 + i * 0.12, 0.4 + i * 0.12));
    const r = ATOM_RADIUS[s] * k * grow;
    const x = w * (0.2 + i * 0.2);
    // The faint ring is lithium's size, so the shrinking can be seen against it.
    if (i) { ctx.setLineDash?.([5, 6]); ctx.beginPath(); ctx.arc(x, cy, ATOM_RADIUS.Li * k, 0, Math.PI * 2); ctx.strokeStyle = C.faint; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash?.([]); }
    disc(ctx, x, cy, r, C.iron, C.steel);
    // The pull on the outer shell: the nucleus's charge less the two inner electrons, drawn as that many arrows turning inward.
    const pull = CHARGE[s] - 2;
    const show = ease(win(t, 0.45 + i * 0.1, 0.6 + i * 0.1));
    for (let a = 0; a < pull; a++) {
      const ang = (a / pull) * Math.PI * 2 + 0.4;
      const x1 = x + Math.cos(ang) * r; const y1 = cy + Math.sin(ang) * r;
      const x2 = x + Math.cos(ang) * (r - 16 * show); const y2 = cy + Math.sin(ang) * (r - 16 * show);
      if (show > 0) { line(ctx, x1, y1, x2, y2, C.amber, 3); disc(ctx, x2, y2, 3, C.amber); }
    }
    disc(ctx, x, cy, 9 * grow, C.amber);
    text(ctx, `+${CHARGE[s]}`, x, cy + r + 24, { size: Math.max(11, h * 0.042), color: C.amber, weight: 700 });
    text(ctx, s, x, cy - r - 20, { size: Math.max(11, h * 0.045), color: C.text, weight: 700 });
    text(ctx, `${ATOM_RADIUS[s]} pm`, x, h * 0.84, { size: Math.max(10, h * 0.038), color: C.dust });
  });
  text(ctx, 'nuclear charge', w * 0.06, cy + h * 0.31, { size: Math.max(10, h * 0.032), color: C.dim, align: 'left' });
  if (t > 0.85) text(ctx, 'more protons, same shell, smaller atom', w / 2, h * 0.94, { size: Math.max(11, h * 0.04), color: C.amber });
}

export const LANTERNFALL_SCENES = {
  'wave-beacon': waveBeacon,
  'photon-plate': photonPlate,
  'line-gas': lineGas,
  'cloud-ball': cloudBall,
  'rack-address': rackAddress,
  'rack-fill': rackFill,
  'peak-rows': peakRows,
  'radii-row': radiiRow,
};
