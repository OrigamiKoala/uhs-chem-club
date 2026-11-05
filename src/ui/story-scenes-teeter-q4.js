/**
 * story-scenes-teeter-q4.js — the story painter of Teeter's bench 4 (`q4-properties`), spread into `TEETER_SCENES` (`story-scenes-teeter.js`).
 * A 960-wide plate, a pure function of `t`. Every K printed is the ratio of the bar heights drawn, read with the powers of the reaction
 * written beside them (`kOfNet`, `engine/eqdata.js`); the bars are the amounts of the sealed mixtures the bench uses (`Q4.mixP`, `Q4.mixChain`).
 *
 * `k-rewrite`: 0 to 0.3 a card is flipped and the same bars give 1 over the K; 0.3 to 0.58 it is written twice as large and the same bars
 * give the square; 0.58 to 1 two cards in a row: the bars of a chain give each card's K and the K of the pair.
 */

import { Q4, kOfNet, fmtK, netOfCards, netSides } from '../learn/engine/eqdata.js';
import { C, text, ground, win, ease } from './story-kit.js';

const INK = ['#c0652b', '#6f8fb0', '#8a9a5b'];
const fs = h => Math.max(13, h * 0.042);
const coef = n => (n === 1 ? '' : `${n} `);
const side = l => l.map(([n, s]) => `${coef(n)}${s}`).join(' + ');
const eq = card => { const s = netSides(netOfCards([card])); return `${side(s.lhs)} ⇌ ${side(s.rhs)}`; };
const kOf = card => kOfNet(netOfCards([card]), card.mix);

function bars(ctx, x, y, w, h, mix, names) {
  const max = Math.max(...names.map(n => mix[n])) * 1.15;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.steel; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const cw = w / names.length;
  names.forEach((n, i) => {
    const bh = (mix[n] / max) * (h - 60);
    ctx.fillStyle = INK[i % 3];
    ctx.fillRect(x + i * cw + cw * 0.25, y + h - 30 - bh, cw * 0.5, bh);
    text(ctx, n, x + i * cw + cw / 2, y + h - 14, { size: 22, weight: 700 });
    text(ctx, (mix[n] + 1e-9).toFixed(2), x + i * cw + cw / 2, y + h - 30 - bh - 14, { size: 18, color: C.dust });
  });
}

function kRewrite(ctx, w, h, t) {
  ground(ctx, w, h);
  const chain = t > 0.58;
  const mix = chain ? Q4.mixChain : Q4.mixP;
  bars(ctx, w * 0.06, h * 0.14, w * 0.3, h * 0.62, mix, ['A', 'B', 'C']);
  const rows = [];
  if (!chain) {
    const base = { lhs: Q4.P.lhs, rhs: Q4.P.rhs, mix };
    rows.push({ card: base, at: 0 });
    if (t <= 0.3) rows.push({ card: { ...base, flipped: true }, at: 0.06 });
    else rows.push({ card: { ...base, scale: 2 }, at: 0.3 });
  } else {
    rows.push({ card: { lhs: Q4.chain1.lhs, rhs: Q4.chain1.rhs, mix }, at: 0.58 });
    rows.push({ card: { lhs: Q4.chain2.lhs, rhs: Q4.chain2.rhs, mix }, at: 0.66 });
    const sum = netOfCards([{ lhs: Q4.chain1.lhs, rhs: Q4.chain1.rhs }, { lhs: Q4.chain2.lhs, rhs: Q4.chain2.rhs }]);
    rows.push({ pair: sum, at: 0.76 });
  }
  rows.forEach((r, i) => {
    const a = ease(win(t, r.at, r.at + 0.06));
    if (a <= 0) return;
    const y = h * (0.26 + i * 0.2);
    ctx.globalAlpha = a;
    const e = r.pair ? (() => { const s = netSides(r.pair); return `${side(s.lhs)} ⇌ ${side(s.rhs)}`; })() : eq(r.card);
    const k = r.pair ? kOfNet(r.pair, mix) : kOf(r.card);
    text(ctx, e, w * 0.68, y, { size: fs(h) * 1.4, weight: 700 });
    text(ctx, `K ${fmtK(k)}`, w * 0.68, y + h * 0.075, { size: fs(h) * 1.3, color: C.amber, weight: 700 });
    ctx.globalAlpha = 1;
  });
  text(ctx, 'K read from the bars', w * 0.5, h * 0.07, { size: fs(h), color: C.dust });
}

export const TEETER_Q4_SCENES = { 'k-rewrite': kRewrite };
