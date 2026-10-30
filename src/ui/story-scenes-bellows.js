/**
 * story-scenes-bellows.js — the pictures behind Bellows' seven story animations.
 *
 * Same contract as `story-scenes.js`: each painter draws one frame of a scene from a progress `t` in [0, 1] on a canvas of `w` x `h`, a pure
 * function of `t`, so reduced motion and `3D Off` show the last frame and lose nothing. Painters draw in the SCOURED PLATE palette. Every
 * figure on a frame is the bench's own, read from `gasdata.js`, never a number made up for the picture.
 *
 * The pictures show the mechanism: particles move, every knock on a wall is counted from that motion (`story-sim.js` `wallHits`), and a
 * gauge reads those knocks, so squeezing, heating and cooling change the reading for the reason they change it on the bench.
 *
 * Kept in its own file so the world-by-world rollout does not collide in `story-scenes.js`, which spreads `BELLOWS_SCENES` into `SCENES`.
 * Pure over a 2D context: importable in Node (`verify:story` draws every scene on a stub context).
 */

import {
  GASES, pressureIdeal, planMixture, leftAfter, halfTime, pressureVdw, speeds
} from '../learn/engine/gasdata.js';
import { C as KIT, disc, line, legacyText as text, ground } from './story-kit.js';
import { win, ease, hash, tri, integrate, crowdOf, placeOf, wallHits, lerp } from './story-sim.js';
const C = KIT;

/** A point bouncing between 0 and 1: the same `u` and `t` always give the same place. */
const bounce = (u, speed, t) => tri(u + speed * t);

const frame = (ctx, x, y, w, h, color = C.steel) => {
  ctx.fillStyle = '#100f0c';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
};

/** A dial: a ring, a needle at `frac` of its sweep, and a figure under it. */
function dial(ctx, cx, cy, r, frac, label, value, color = C.amber) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 0.8, Math.PI * 2.2);
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = 2;
  ctx.stroke();
  const a = Math.PI * 0.8 + Math.PI * 1.4 * Math.max(0, Math.min(1, frac));
  line(ctx, cx, cy, cx + Math.cos(a) * r * 0.85, cy + Math.sin(a) * r * 0.85, color, 3);
  disc(ctx, cx, cy, r * 0.1, C.dust);
  text(ctx, label, cx, cy + r * 1.35, { size: Math.max(10, r * 0.34), color: C.dim });
  if (value != null) text(ctx, value, cx, cy + r * 1.8, { size: Math.max(11, r * 0.4), color: C.text, weight: 700 });
}

/** The knocks of a crowd, drawn where they landed on a box at (x, y, bw, bh): a short bright tick on the wall that fades. */
function drawHits(ctx, hits, x, y, bw, bh, color = C.amber, size = 9) {
  for (const k of hits) {
    const a = 1 - k.age;
    if (a <= 0) continue;
    ctx.globalAlpha = Math.min(1, a * 1.3);
    ctx.fillStyle = color;
    const len = size * (0.6 + 0.8 * a);
    if (k.wall === 'L') ctx.fillRect(x - 3, y + k.along * bh - len / 2, 6, len);
    else if (k.wall === 'R') ctx.fillRect(x + bw - 3, y + k.along * bh - len / 2, 6, len);
    else if (k.wall === 'T') ctx.fillRect(x + k.along * bw - len / 2, y - 3, len, 6);
    else ctx.fillRect(x + k.along * bw - len / 2, y + bh - 3, len, 6);
  }
  ctx.globalAlpha = 1;
}

/** Particles of a crowd on a box. */
function drawCrowd(ctx, crowd, tau, x, y, bw, bh, r, color = C.pale) {
  for (const p of crowd) {
    const [u, v] = placeOf(p, tau);
    disc(ctx, x + r + u * (bw - 2 * r), y + r + v * (bh - 2 * r), r, color);
  }
}

/* ---- q1-knocks: a sealed box, every knock on a wall counted, and the same count on every wall; more gas, less room or more heat raises it ---- */
const KNOCK_CROWD = crowdOf(40, 11);
function gaugeWalls(ctx, w, h, t) {
  ground(ctx, w, h);
  // The room shrinks (0.28 to 0.45) and then the gas is heated (0.5 to 0.7); a particle crosses a smaller box sooner, so the phase runs faster.
  const room = t => 1 - 0.42 * ease(win(t, 0.28, 0.45));
  const heat = t => 1 + 0.7 * ease(win(t, 0.52, 0.7));
  const rate = t => 7 * heat(t) / room(t);
  const tau = integrate(rate, t);
  const win0 = 0.06;
  const tau0 = integrate(rate, Math.max(0, t - win0));
  const hits = wallHits(KNOCK_CROWD, tau0, tau);
  const bw = 330 * room(t); const bh = 250; const bx = 120; const by = 150;
  frame(ctx, bx, by, bw, bh);
  drawCrowd(ctx, KNOCK_CROWD, tau, bx, by, bw, bh, 4);
  drawHits(ctx, hits, bx, by, bw, bh, C.amber, 7 + 6 * (heat(t) - 1));
  // A gauge on the roof, the side and the floor: each reads the knocks it received in the last moment, per length of wall.
  const per = wall => hits.filter(k => k.wall === wall).length / ((wall === 'L' || wall === 'R' ? bh : bw) / 100);
  const top = per('T'); const side = per('R'); const floor = per('B');
  const scale = 1 / 12;
  const rows = [['roof', top], ['side wall', side], ['floor', floor]];
  rows.forEach(([name, v], i) => {
    const y = 170 + i * 70;
    text(ctx, name, 560, y, { size: 20, color: C.dust, align: 'left' });
    ctx.fillStyle = C.rim;
    ctx.fillRect(560, y + 14, 300, 14);
    ctx.fillStyle = C.amber;
    ctx.fillRect(560, y + 14, Math.min(300, 300 * v * scale * 0.8), 14);
    text(ctx, `${v.toFixed(1)}`, 880, y + 21, { size: 20, color: C.text, align: 'left', weight: 700 });
  });
  text(ctx, 'knocks per length of wall', 560, 140, { size: 18, color: C.dim, align: 'left' });
  if (t > 0.3 && t < 0.5) text(ctx, 'less room', bx + bw / 2, by + bh + 36, { size: 22, color: C.amber });
  if (t > 0.55) text(ctx, 'hotter', bx + bw / 2, by + bh + 36, { size: 22, color: C.amber });
  if (t < 0.25) text(ctx, 'the same on every wall', bx + bw / 2, by + bh + 36, { size: 22, color: C.dust });
}

/* ---- q2-laws: a sealed tank cooled by fifty degrees; its knocks fall, and the gauge follows the kelvin line to zero ---- */
const COLD_CROWD = crowdOf(30, 21);
function coldTank(ctx, w, h, t) {
  ground(ctx, w, h);
  const cool = ease(win(t, 0.12, 0.5));
  const T0 = 293.15;
  const Tk = t2 => T0 - 50 * ease(win(t2, 0.12, 0.5));
  const T = Tk(t);
  const tau = integrate(s => 6 * Math.sqrt(Tk(s) / T0), t);
  const tau0 = integrate(s => 6 * Math.sqrt(Tk(s) / T0), Math.max(0, t - 0.06));
  const P = pressureIdeal(1, T, 10);
  const P0 = pressureIdeal(1, T0, 10);
  const bx = 70; const by = 170; const bw = 240; const bh = 240;
  ctx.fillStyle = C.iron;
  ctx.fillRect(bx - 8, by - 8, bw + 16, bh + 16);
  frame(ctx, bx, by, bw, bh);
  drawCrowd(ctx, COLD_CROWD, tau, bx, by, bw, bh, 4, C.pale);
  drawHits(ctx, wallHits(COLD_CROWD, tau0, tau), bx, by, bw, bh, C.amber, 6);
  dial(ctx, bx + bw / 2, 100, 38, (P / P0) * 0.72, 'gauge', `${Math.round(P)}`);
  text(ctx, `${Math.round(T - 273.15)} °C   ${Math.round(T)} K`, bx + bw / 2, by + bh + 46, { size: 24, color: C.text, weight: 700 });
  // The line: pressure against the kelvin temperature. A dot rides it; the line carries on down to zero kelvin.
  const gx = 430; const gy = 110; const gw = 440; const gh = 320;
  const X = k => gx + (k / 320) * gw;
  const Y = p => gy + gh - (p / (P0 * 1.15)) * gh;
  line(ctx, gx, gy, gx, gy + gh, C.steel, 2);
  line(ctx, gx, gy + gh, gx + gw, gy + gh, C.steel, 2);
  text(ctx, 'pressure', gx + 4, gy - 14, { size: 18, color: C.dim, align: 'left' });
  text(ctx, 'kelvin', gx + gw, gy + gh + 30, { size: 18, color: C.dim, align: 'right' });
  text(ctx, '0', gx, gy + gh + 22, { size: 16, color: C.dim });
  const ext = ease(win(t, 0.55, 0.8));
  line(ctx, X(T0 - 50), Y(pressureIdeal(1, T0 - 50, 10)), X(T0), Y(P0), C.text, 3);
  const fromK = lerp(T0 - 50, 0, ext);
  if (ext > 0) line(ctx, X(fromK), Y(pressureIdeal(1, fromK, 10)), X(T0 - 50), Y(pressureIdeal(1, T0 - 50, 10)), C.amber, 2, [6, 6]);
  const dx = X(T); const dy = Y(P);
  line(ctx, dx, dy, dx, gy + gh, C.dim, 1, [3, 4]);
  line(ctx, gx, dy, dx, dy, C.dim, 1, [3, 4]);
  disc(ctx, dx, dy, 8, C.amber);
  if (ext > 0.9) {
    text(ctx, '0 K: no knocks', gx + 70, gy + gh - 22, { size: 18, color: C.amber });
    disc(ctx, X(0), Y(0), 5, C.amber);
  }
  if (t > 0.45) text(ctx, `${Math.round((1 - P / P0) * 100)} % lower`, dx + 16, dy - 20, { size: 20, color: C.text, align: 'left', weight: 700 });
}

/* ---- q3-ideal: a mole of a light gas and a mole of a heavy one: the same count of particles, the same room, the same gauge, very different weights ---- */
function equalRooms(ctx, w, h, t) {
  ground(ctx, w, h);
  const bw = 270; const bh = 200; const by = 130;
  const shown = Math.round(14 * ease(win(t, 0.1, 0.55)));
  const P = pressureIdeal(1, 300, 10);
  [[130, 'He'], [560, 'CO2']].forEach(([x, gas], k) => {
    frame(ctx, x, by, bw, bh);
    const heavy = gas === 'CO2';
    const r = heavy ? 11 : 5;
    const sp = (speeds(gas, 300).mean / speeds('CO2', 300).mean) * 0.7;
    // A light particle is quick and small, a heavy one slow and big; there are as many of one as of the other.
    const px = Array.from({ length: shown }, (_, i) => [
      x + r + bounce(hash(i, 5 + k), sp * (0.6 + hash(i, 6)), t * 2.4) * (bw - 2 * r),
      by + r + bounce(hash(i, 7 + k), sp * (0.6 + hash(i, 8)), t * 2.4) * (bh - 2 * r)]);
    px.forEach(([cx, cy]) => disc(ctx, cx, cy, r, heavy ? C.steel : C.pale));
    text(ctx, GASES[gas].name, x + bw / 2, by + bh + 28, { size: 20, color: C.dust });
    // The weight of a mole of it, as a bar standing on the floor.
    const m = GASES[gas].M;
    ctx.fillStyle = heavy ? C.steel : C.pale;
    const bar = 130 * (m / GASES.CO2.M) * ease(win(t, 0.5, 0.75));
    ctx.fillRect(x + bw / 2 - 40, by + bh + 120 - bar, 80, bar);
    if (t > 0.6) text(ctx, `${GASES[gas].M.toFixed(1)} g`, x + bw / 2, by + bh + 142, { size: 22, color: C.amber, weight: 700 });
    if (t > 0.78) dial(ctx, x + bw / 2, by - 54, 28, (P / 300) * 0.9, '', null);
  });
  text(ctx, `${shown} particles in each`, w / 2, 60, { size: 26, color: C.text });
  if (t > 0.78) text(ctx, `same room, same temperature, same gauge: ${Math.round(P)} kPa`, w / 2, 96, { size: 20, color: C.amber });
}

/* ---- q4-mixtures: two gases in one tank, each pushing as if alone; the gauge is the two pushes added ---- */
function mixShare(ctx, w, h, t) {
  ground(ctx, w, h);
  const m = planMixture([{ gas: 'He', n: 1 }, { gas: 'Ne', n: 0.6 }], 300, 10);
  const nHe = 10; const nNe = 6;
  const bx = 70; const by = 130; const bw = 330; const bh = 280;
  frame(ctx, bx, by, bw, bh);
  const lit = [ease(win(t, 0.08, 0.3)), ease(win(t, 0.34, 0.56))];
  const tau = t * 10;
  // Each gas appears on its own first, so its own push can be seen, and then both are in the tank together.
  const cols = [C.pale, C.amber];
  const sets = [[nHe, 0, 1], [nNe, 1, 2]];
  sets.forEach(([n, k, seed]) => {
    const crowd = crowdOf(n, 30 + seed);
    const alone = k === 0 ? 1 : lit[1];
    ctx.globalAlpha = Math.max(0.15, alone);
    drawCrowd(ctx, crowd, tau, bx, by, bw, bh, 5, cols[k]);
    ctx.globalAlpha = 1;
  });
  text(ctx, 'tank', bx + bw / 2, by + bh + 34, { size: 20, color: C.dim });
  // The column of the gauge: helium's push, then neon's stacked on it, up to the reading.
  const cx = 560; const cw = 120; const top = 130; const colH = 280;
  ctx.strokeStyle = C.rim;
  ctx.lineWidth = 2;
  ctx.strokeRect(cx, top, cw, colH);
  let used = 0;
  m.rows.forEach((r, k) => {
    const seg = (r.P / m.P) * colH * (k === 0 ? lit[0] : lit[1]);
    ctx.fillStyle = cols[k];
    ctx.fillRect(cx, top + colH - used - seg, cw, seg);
    if (seg > 24) text(ctx, `${Math.round(r.P)}`, cx + cw / 2, top + colH - used - seg / 2, { size: 24, color: '#16140f', weight: 700 });
    if (seg > 24) text(ctx, GASES[r.gas].name, cx + cw + 16, top + colH - used - seg / 2, { size: 20, color: C.dust, align: 'left' });
    used += seg;
  });
  if (t > 0.7) {
    text(ctx, `gauge ${Math.round(m.P)}`, cx + cw / 2, top - 22, { size: 26, color: C.amber, weight: 700 });
    text(ctx, `${Math.round(m.rows[0].P)} + ${Math.round(m.rows[1].P)}`, cx + cw / 2, top + colH + 34, { size: 22, color: C.text });
  }
}

/* ---- q5-speed: four chambers with a pinhole; the particles move, and a lighter one reaches the hole sooner ---- */
function exitTime(gas, rank) {
  // The time at which the share still inside has fallen to `rank`: leftAfter is a falling curve, so it is found by halving.
  let lo = 0; let hi = 40;
  for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (leftAfter(gas, mid, 300) > rank) lo = mid; else hi = mid; }
  return lo;
}
function leakRace(ctx, w, h, t) {
  ground(ctx, w, h);
  const gases = ['H2', 'He', 'N2', 'CO2'];
  const secs = ease(win(t, 0.08, 0.92)) * 4;
  const mean0 = speeds('N2', 300).mean;
  gases.forEach((g, i) => {
    const x = 50 + i * 225; const cw = 150; const ch = 240; const cy = 150;
    frame(ctx, x, cy, cw, ch);
    ctx.fillStyle = C.bg;
    ctx.fillRect(x + cw - 3, cy + ch * 0.4, 6, ch * 0.2);
    const sp = (speeds(g, 300).mean / mean0) * 0.9;
    const n = 24;
    for (let k = 0; k < n; k++) {
      const gone = exitTime(g, (k + 0.5) / n);
      const px = x + 5 + bounce(hash(k, i), sp * (0.6 + hash(k, i + 4)), secs * 1.2) * (cw - 10);
      const py = cy + 5 + bounce(hash(k, i + 9), sp * (0.6 + hash(k, i + 5)), secs * 1.2) * (ch - 10);
      if (secs < gone) disc(ctx, px, py, 4.5, C.pale);
      else if (secs - gone < 0.5) {
        // Through the hole and away.
        const f = (secs - gone) / 0.5;
        disc(ctx, x + cw + f * 40, cy + ch * (0.45 + 0.1 * hash(k, i + 2)), 4.5, C.amber);
      }
    }
    text(ctx, GASES[g].sym, x + cw / 2, cy + ch + 28, { size: 22, color: C.dust });
    text(ctx, `${Math.round(leftAfter(g, secs, 300) * 100)} % left`, x + cw / 2, cy + ch + 58, { size: 20, color: i === 0 ? C.amber : C.dim });
  });
  text(ctx, `${secs.toFixed(1)} s`, w / 2, 80, { size: 30, color: C.text, weight: 700 });
  if (t > 0.85) text(ctx, 'lighter gas, faster particles, sooner empty', w / 2, 116, { size: 20, color: C.amber });
}

/* ---- q6-real: a squeezed gas reads above the law, a cooled one below ---- */
function crowdAndPull(ctx, w, h, t) {
  ground(ctx, w, h);
  const sq = pressureVdw('He', 1, 300, 0.06);
  const co = pressureVdw('CO2', 1, 230, 0.5);
  const squeeze = ease(win(t, 0.1, 0.55));
  // Left: helium squeezed, its particles filling the room.
  const bw = 288 * (1 - 0.47 * squeeze);
  frame(ctx, 115, 160, bw, bw);
  const crowd = crowdOf(12, 41);
  drawCrowd(ctx, crowd, t * 9, 115, 160, bw, bw, bw * (0.07 + 0.08 * squeeze));
  text(ctx, 'squeezed', 255, 470, { size: 22, color: C.dust });
  if (t > 0.6) text(ctx, `${sq.P >= sq.ideal ? '+' : '−'}${Math.round(Math.abs(sq.P / sq.ideal - 1) * 100)} %`, 255, 505, { size: 26, color: C.amber, weight: 700 });
  // Right: carbon dioxide cooled, its particles slowing and sticking together.
  const cool = ease(win(t, 0.35, 0.85));
  const rx = 560; const ry = 160; const rw = 288;
  frame(ctx, rx, ry, rw, rw);
  for (let i = 0; i < 12; i++) {
    const free = bounce(hash(i, 3), 1.2, t * 9) * (rw - 14);
    const stuckX = rw * (0.35 + 0.3 * hash(i, 4)); const stuckY = rw * (0.7 + 0.2 * hash(i, 5));
    const px = 7 + free * (1 - cool) + stuckX * cool;
    const py = 7 + bounce(hash(i, 6), 1.1, t * 9) * (rw - 14) * (1 - cool) + stuckY * cool;
    disc(ctx, rx + Math.min(rw - 5, px), ry + Math.min(rw - 5, py), 8, C.steel);
  }
  text(ctx, 'cooled', rx + rw / 2, 470, { size: 22, color: C.dust });
  if (t > 0.9) text(ctx, `${co.P >= co.ideal ? '+' : '−'}${Math.round(Math.abs(co.P / co.ideal - 1) * 100)} %`, rx + rw / 2, 505, { size: 26, color: C.amber, weight: 700 });
}

export const BELLOWS_SCENES = {
  'gauge-walls': gaugeWalls,
  'cold-tank': coldTank,
  'equal-rooms': equalRooms,
  'mix-share': mixShare,
  'leak-race': leakRace,
  'crowd-and-pull': crowdAndPull,
};
