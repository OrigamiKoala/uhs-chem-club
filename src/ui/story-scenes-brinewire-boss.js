/**
 * story-scenes-brinewire-boss.js — the finale painter of `boss-clamp` (Brinewire), spread into `SCENES` (`story-scenes.js`) through
 * `legacy()`. A 960-wide plate, a pure function of `t`; every number printed is measured from what is drawn.
 *
 * `clamp-open`: beat one fills a grid of dips (a square is filled when the planner says that strip coats in that solution) and counts the
 * filled squares of each row; beat two sends electron discs from the magnesium beaker to the silver one and reads the ammeter from its
 * needle's angle; beat three sets iron and silver on a voltage axis and reads the cell from the distance between the markers; beat four
 * draws the two zinc strengths as log bars and reads the voltage from the ratio of their lengths; beat five draws current against time as a
 * rectangle, reads the charge from its area, then the moles of electrons and the grams of zinc from the bars that follow.
 */

import { METALS, cellE0, activityOrder, FARADAY, RT_F, fmt } from '../learn/engine/celldata.js';
import { dipResult } from '../learn/engine/celldata-q2-activity.js';
import { loopCurrent } from '../learn/engine/celldata-galvanic.js';
import { C, text, ground, win, ease, disc, line, ring } from './story-kit.js';

const cap = s => s[0].toUpperCase() + s.slice(1);

function rect(ctx, x, y, w, h, fill, edge = null) {
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  if (edge) { ctx.strokeStyle = edge; ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w), Math.round(h)); }
}

function beaker(ctx, x, y, w, h, liquid) {
  ctx.fillStyle = liquid; ctx.fillRect(x + 1, y + h * 0.25, w - 2, h * 0.75 - 1);
  ctx.strokeStyle = C.steel; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y); ctx.stroke();
  ctx.lineWidth = 1;
}

/* ---------------------------------------------------------------- beat 1 */

const P1 = ['fe', 'ni', 'sn', 'ag'];

function dips(ctx, w, h, t) {
  text(ctx, 'Four strips dipped in four solutions', w / 2, 34, { size: 24, color: C.dust });
  const order = activityOrder(P1);
  const x0 = 300; const y0 = 110; const cw = 120; const ch = 70;
  order.forEach((ion, c) => text(ctx, METALS[ion].ion, x0 + c * cw + cw / 2, y0 - 20, { size: 20, color: C.dust, weight: 700 }));
  let step = 0;
  order.forEach((strip, r) => {
    text(ctx, cap(METALS[strip].name), x0 - 16, y0 + r * ch + ch / 2, { size: 22, color: C.text, weight: 700, align: 'right' });
    let filled = 0;
    order.forEach((ion, c) => {
      const cx = x0 + c * cw; const cy = y0 + r * ch;
      rect(ctx, cx + 6, cy + 6, cw - 12, ch - 12, C.bg1, C.dim);
      if (strip === ion) { line(ctx, cx + 14, cy + 14, cx + cw - 14, cy + ch - 14, C.dim, 2); return; }
      const coats = dipResult(strip, ion).coats.length > 0;
      const p = ease(win(t, 0.02 + step * 0.012, 0.05 + step * 0.012));
      step++;
      if (coats && p > 0) { rect(ctx, cx + 6, cy + 6, (cw - 12) * p, ch - 12, C.amber); if (p > 0.95) filled++; }
    });
    const lastP = ease(win(t, 0.02 + (step - 1) * 0.012, 0.05 + (step - 1) * 0.012));
    if (lastP > 0.95) text(ctx, `coated in ${filled}`, x0 + order.length * cw + 20, y0 + r * ch + ch / 2, { size: 22, color: C.amber, weight: 700, align: 'left' });
  });
}

/* ---------------------------------------------------------------- beat 2 */

const NEEDLE_MAX_A = 1.5;

function openCell(ctx, w, h, t) {
  text(ctx, 'Silver and magnesium, joined by a wire and a salt tube', w / 2, 34, { size: 24, color: C.dust });
  const p = ease(win(t, 0.22, 0.36));
  const lx = 150; const rx = 590; const by = 250; const bw = 220; const bh = 190;
  // Silver on the left, magnesium on the right.
  beaker(ctx, lx, by, bw, bh, '#2a3a36'); beaker(ctx, rx, by, bw, bh, '#2a3a36');
  rect(ctx, lx + bw / 2 - 12, by - 40, 24, 170, '#cfd0cc'); rect(ctx, rx + bw / 2 - 12, by - 40, 24, 170, '#b4b6b0');
  text(ctx, 'Silver', lx + bw / 2, by + bh + 30, { size: 22, color: C.text, weight: 700 });
  text(ctx, 'Magnesium', rx + bw / 2, by + bh + 30, { size: 22, color: C.text, weight: 700 });
  // The wire over the top, with the ammeter dial in the middle.
  const wy = 150; const sx = lx + bw / 2; const ex = rx + bw / 2;
  line(ctx, sx, by - 40, sx, wy, C.dust, 3); line(ctx, sx, wy, ex, wy, C.dust, 3); line(ctx, ex, by - 40, ex, wy, C.dust, 3);
  // The ammeter: a needle whose swing reads amperes.
  const cx = 480; const cy = 150; const R = 52;
  rect(ctx, cx - 70, cy - 56, 140, 100, C.bg0, C.steel);
  ring(ctx, cx, cy + 20, R, C.dim, 2);
  const swing = Math.sign(cellE0('ag', 'mg')) * -1;              // electrons run right to left: the needle swings left
  const angle = swing * (loopCurrent('ag', 'mg') / NEEDLE_MAX_A) * (Math.PI / 3) * p;
  line(ctx, cx, cy + 20, cx + Math.sin(angle) * R, cy + 20 - Math.cos(angle) * R, C.amber, 4);
  const read = Math.abs(angle) / (Math.PI / 3) * NEEDLE_MAX_A;
  text(ctx, `${fmt(read, 2)} A`, cx, cy - 36, { size: 26, color: C.amber, weight: 700 });
  // The electrons leave the magnesium strip and arrive at the silver one.
  for (let i = 0; i < 4; i++) {
    const q = (p * 3 + i * 0.25) % 1;
    const x = ex + (sx - ex) * q;
    if (p > 0.1) disc(ctx, x, wy, 10, C.pale);
  }
  if (p > 0.9) {
    text(ctx, 'electrons leave here', rx + bw / 2, by - 66, { size: 20, color: C.amber, weight: 700 });
    text(ctx, 'electrons arrive here', lx + bw / 2, by - 66, { size: 20, color: C.dust });
  }
  line(ctx, lx + bw, by + 60, rx, by + 60, C.steel, 8);
}

/* ---------------------------------------------------------------- beat 3 */

function gap(ctx, w, h, t) {
  text(ctx, 'Iron and silver against the same reference', w / 2, 34, { size: 24, color: C.dust });
  const x = 480; const Y0 = 380; const PY = 150; // y of 0 V, pixels per volt (up is positive)
  const yOf = v => Y0 - v * PY;
  line(ctx, x, yOf(1.0), x, yOf(-0.8), C.steel, 2);
  for (let v = -0.5; v <= 1.0001; v += 0.5) { line(ctx, x - 8, yOf(v), x + 8, yOf(v), C.steel, 2); text(ctx, `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}`, x - 40, yOf(v), { size: 18, color: C.dust }); }
  line(ctx, x - 150, yOf(0), x + 150, yOf(0), C.amber, 2, [4, 5]);
  text(ctx, 'reference', x + 200, yOf(0), { size: 18, color: C.amber });
  const a = ease(win(t, 0.42, 0.5)); const b = ease(win(t, 0.5, 0.56));
  const yFe = yOf(METALS.fe.E0); const yAg = yOf(METALS.ag.E0);
  if (a > 0) { disc(ctx, x + 90, yFe, 14 * a, C.pale); text(ctx, 'Iron', x + 130, yFe, { size: 22, color: C.text, weight: 700, align: 'left' }); }
  if (b > 0) { disc(ctx, x + 90, yAg, 14 * b, C.pale); text(ctx, 'Silver', x + 130, yAg, { size: 22, color: C.text, weight: 700, align: 'left' }); }
  const c = ease(win(t, 0.56, 0.6));
  if (c > 0) {
    const yTop = yFe + (yAg - yFe) * c;
    line(ctx, x - 90, yFe, x - 90, yTop, C.amber, 6);
    const V = (yFe - yTop) / PY;
    text(ctx, `${fmt(V, 2)} V`, x - 130, (yFe + yTop) / 2, { size: 34, color: C.amber, weight: 700, align: 'right' });
  }
}

/* ---------------------------------------------------------------- beat 4 */

const ZN = { dilute: 0.010, strong: 1.0 };
const DEC = 60;                                                  // pixels for one decade of strength

function dilute(ctx, w, h, t) {
  text(ctx, 'Two zinc beakers at different strengths', w / 2, 34, { size: 24, color: C.dust });
  const p = ease(win(t, 0.62, 0.72));
  const base = 400;
  const barL = (Math.log10(ZN.dilute) + 3) * DEC * p; const barR = (Math.log10(ZN.strong) + 3) * DEC * p;
  [[220, barL, '0.010 M', 'left'], [620, barR, '1.0 M', 'right']].forEach(([x, len, name]) => {
    beaker(ctx, x, 150, 200, 250, '#2a3a36');
    rect(ctx, x + 70, 120, 60, 260, '#8f9ca4');
    rect(ctx, x + 215, base - len, 26, Math.max(1, len), C.amber);
    text(ctx, name, x + 100, 440, { size: 24, color: C.text, weight: 700 });
  });
  text(ctx, 'strength', 560, 490, { size: 18, color: C.dim });
  if (p > 0.95) {
    const ratio = 10 ** ((barR - barL) / DEC);
    const V = (RT_F / METALS.zn.n) * Math.log(ratio);
    text(ctx, `${Math.round(ratio)} to 1: ${fmt(V, 3)} V`, w / 2, 90, { size: 30, color: C.amber, weight: 700 });
    for (let i = 0; i < 4; i++) {
      const q = (t * 40 + i * 0.25) % 1;
      disc(ctx, 320 + (720 - 320) * q, 100, 8, C.pale);
    }
    text(ctx, 'electrons leave this bar', 320, 130, { size: 20, color: C.amber });
  }
}

/* ---------------------------------------------------------------- beat 5 */

const RUN = { I: 1.50, t: 1200 };
const PX_A = 110; const PX_S = 0.45;                             // pixels per ampere, per second
const MOLE_PX = 400;                                             // one mole of electrons = this many pixels

function plating(ctx, w, h, t) {
  text(ctx, '1.50 A for 20.0 minutes through a zinc bath', w / 2, 34, { size: 24, color: C.dust });
  const p = ease(win(t, 0.8, 0.88));
  const x0 = 120; const y0 = 280;
  const rw = RUN.t * PX_S * p; const rh = RUN.I * PX_A;
  rect(ctx, x0, y0 - rh, rw, rh, 'rgba(229,155,36,0.35)', C.amber);
  line(ctx, x0, y0, x0 + RUN.t * PX_S + 20, y0, C.steel, 2);
  text(ctx, 'time', x0 + RUN.t * PX_S + 40, y0, { size: 18, color: C.dim, align: 'left' });
  if (p > 0.95) {
    const q = (rw / PX_S) * (rh / PX_A);
    text(ctx, `${fmt(q, 0)} C`, x0 + rw / 2, y0 - rh / 2, { size: 30, color: C.amber, weight: 700 });
    const molE = q / FARADAY;
    const q2 = ease(win(t, 0.88, 0.94));
    const eLen = molE * MOLE_PX * 14 * q2;                       // electrons, drawn at 14 times the scale so the bar is legible
    const zLen = eLen / METALS.zn.n;
    text(ctx, 'electrons', x0 - 16, y0 + 70, { size: 20, color: C.dust, align: 'right' });
    rect(ctx, x0, y0 + 54, Math.max(1, eLen), 32, C.pale);
    if (q2 > 0.95) text(ctx, `${fmt(eLen / (MOLE_PX * 14), 4)} mol`, x0 + eLen + 14, y0 + 70, { size: 22, color: C.text, weight: 700, align: 'left' });
    text(ctx, 'zinc atoms', x0 - 16, y0 + 130, { size: 20, color: C.dust, align: 'right' });
    rect(ctx, x0, y0 + 114, Math.max(1, zLen), 32, C.green);
    if (q2 > 0.95) {
      const molZn = zLen / (MOLE_PX * 14);
      text(ctx, `${fmt(molZn, 4)} mol, ${fmt(molZn * METALS.zn.M, 2)} g`, x0 + zLen + 14, y0 + 130, { size: 22, color: C.text, weight: 700, align: 'left' });
    }
  }
}

function clampOpen(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t <= 0.2) return dips(ctx, w, h, t);
  if (t <= 0.4) return openCell(ctx, w, h, t);
  if (t <= 0.6) return gap(ctx, w, h, t);
  if (t <= 0.78) return dilute(ctx, w, h, t);
  return plating(ctx, w, h, t);
}

export const BRINEWIRE_BOSS_SCENES = { 'clamp-open': clampOpen };
