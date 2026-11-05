/**
 * story-scenes-verdigris-q4q5.js — the story painters of Verdigris benches 4 and 5, spread into `SCENES` (`story-scenes.js`) through
 * `legacy()`: a 960-wide plate, a pure function of `t`, every number on screen counted from what is drawn or read from the planners.
 *
 * `race-pairs` (q4-structure): each race is a window of 100 sites; the sites that hold a proton are drawn grey and counted as they are
 * drawn, the count being `phdata.js` `raceCount` for the pair (the same count the bench's race window shows).
 */

import { RACE, raceCount } from '../learn/engine/phdata.js';
import { ionText, cellGrid, ionizedCells, ACID_INK, BASE_INK, mixOf, flaskSol } from '../learn/table/kits/ph-read.js';
import { C, text, ground, win, ease, disc } from './story-kit.js';

/** One race: acid X against the base left by Y. Draws the window filled to the share `p` of the protons that crossed; returns the number drawn. */
function racePic(ctx, x, y, size, idX, idY, p) {
  const n = raceCount(idX, idY);
  const shown = Math.round(n * p);
  ctx.fillStyle = '#100f0c'; ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = C.steel; ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  const cells = cellGrid(100, 10, x + 4, y + 4, size - 8, size - 8);
  const crossed = [...ionizedCells(100, n, 5 + n)].slice(0, shown);
  const set = new Set(crossed);
  cells.forEach((c, i) => disc(ctx, c.x, c.y, Math.min(c.cw, c.ch) * 0.4, set.has(i) ? ACID_INK : BASE_INK));
  text(ctx, ionText(`${RACE[idX].acid} + ${RACE[idY].base}`), x + size / 2, y - 18, { size: 21, color: C.dust, weight: 700 });
  text(ctx, `${shown} of 100 reached the base`, x + size / 2, y + size + 24, { size: 19, color: C.amber, weight: 700 });
  return shown;
}

function row(ctx, w, y, size, pairs, p) {
  const gap = (w - size * pairs.length) / (pairs.length + 1);
  pairs.forEach(([a, b], i) => racePic(ctx, gap + i * (size + gap), y, size, a, b, p));
}

function racePairs(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t < 0.28) {
    text(ctx, 'Hydrogen fluoride and hydrogen chloride, raced both ways', w / 2, 34, { size: 24, color: C.dust });
    row(ctx, w, 130, 250, [['hf', 'hcl'], ['hcl', 'hf']], ease(win(t, 0.02, 0.22)));
    return;
  }
  if (t < 0.54) {
    text(ctx, 'Hydrogen bromide and hydrogen chloride, raced both ways', w / 2, 34, { size: 24, color: C.dust });
    row(ctx, w, 130, 250, [['hbr', 'hcl'], ['hcl', 'hbr']], ease(win(t, 0.3, 0.5)));
    return;
  }
  if (t < 0.78) {
    text(ctx, 'Each chlorine acid against the base left by HClO', w / 2, 34, { size: 24, color: C.dust });
    row(ctx, w, 150, 200, [['hclo2', 'hclo'], ['hclo3', 'hclo'], ['hclo4', 'hclo']], ease(win(t, 0.56, 0.74)));
    return;
  }
  text(ctx, 'Acetic acid and ethanol, each against the other\'s base', w / 2, 34, { size: 24, color: C.dust });
  row(ctx, w, 130, 250, [['acetic', 'ethanol'], ['ethanol', 'acetic']], ease(win(t, 0.8, 0.92)));
}

/* ---- q5-salts: `salt-reads`. A pH scale from 0 to 14; each marker is a flask's reading, read from the planner that the bench's meter used. ---- */

const NEUT = (type, id, c, V, ct, step, k) => mixOf({ props: { neut: { type, id, c, V, ct, step, max: 6 } }, dials: { poured: { value: k } } });
export const SALT_READS = {
  strong: NEUT('strongAcid', 'hcl', 0.10, 50, 0.10, 10, 5).pH,
  acetic: NEUT('weakAcid', 'acetic', 0.10, 50, 0.10, 10, 5).pH,
  ammonia: NEUT('weakBase', 'nh3', 0.10, 50, 0.10, 10, 5).pH,
  naf: flaskSol({ solute: { id: 'fluoride', c: 0.10 } }).pH,
  nh4cl: flaskSol({ solute: { id: 'nh4', c: 0.10 } }).pH,
  nacl: flaskSol({ solute: { id: 'nacl', c: 0.10 } }).pH,
  excess: NEUT('strongAcid', 'hcl', 0.10, 30, 0.10, 20, 1)
};

function scale(ctx, w, y, marks, p) {
  const x0 = 80; const x1 = w - 80;
  const X = pH => x0 + (pH / 14) * (x1 - x0);
  ctx.strokeStyle = C.dust; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.lineWidth = 1;
  for (let i = 0; i <= 14; i += 7) text(ctx, String(i), X(i), y + 30, { size: 20, color: C.dim });
  marks.forEach(([name, pH], i) => {
    const px = X(pH); const up = i % 2 === 0;
    const k = ease(win(p, i * 0.25, i * 0.25 + 0.5));
    ctx.fillStyle = C.amber; ctx.globalAlpha = k; ctx.fillRect(px - 3, y - 14, 6, 28);
    text(ctx, ionText(name), px, y + (up ? -60 : 70), { size: 20, color: C.dust, weight: 700 });
    text(ctx, fmt0(pH), px, y + (up ? -34 : 96), { size: 24, color: C.amber, weight: 700 });
    ctx.globalAlpha = 1;
  });
}
const fmt0 = v => (Math.round(v * 100 + 1e-9) / 100).toFixed(2).replace('-', '−');

function saltReads(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t < 0.3) {
    text(ctx, 'Acid and base used up exactly, read by the meter', w / 2, 34, { size: 24, color: C.dust });
    scale(ctx, w, 250, [['HCl + NaOH', SALT_READS.strong], ['CH₃COOH + NaOH', SALT_READS.acetic], ['NH₃ + HCl', SALT_READS.ammonia]], ease(win(t, 0.02, 0.28)));
    return;
  }
  if (t < 0.62) {
    text(ctx, 'Four salt solutions, each 0.10 M', w / 2, 34, { size: 24, color: C.dust });
    scale(ctx, w, 250, [['NaCl', SALT_READS.nacl], ['NaF', SALT_READS.naf], ['NH₄Cl', SALT_READS.nh4cl]], ease(win(t, 0.34, 0.6)));
    return;
  }
  text(ctx, '30.0 mL of 0.10 M acid and 20.0 mL of 0.10 M base', w / 2, 34, { size: 24, color: C.dust });
  const e = SALT_READS.excess; const p = ease(win(t, 0.64, 0.9));
  const size = 300; const x = 140; const y = 120;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(x, y, size, size); ctx.strokeStyle = C.steel; ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  const cells = cellGrid(100, 10, x + 6, y + 6, size - 12, size - 12);
  const used = new Set([...ionizedCells(100, e.used, 17)].slice(0, Math.round(e.used * p)));
  cells.forEach((c, i) => disc(ctx, c.x, c.y, Math.min(c.cw, c.ch) * 0.4, used.has(i) ? BASE_INK : ACID_INK));
  text(ctx, `${100 - used.size} of 100 acid units left`, x + size / 2, y + size + 30, { size: 22, color: C.amber, weight: 700 });
  text(ctx, `pH ${fmt0(e.pH)}`, 640, 260, { size: 44, color: C.text, weight: 700 });
}

export const VERDIGRIS_Q4Q5_SCENES = { 'race-pairs': racePairs, 'salt-reads': saltReads };
