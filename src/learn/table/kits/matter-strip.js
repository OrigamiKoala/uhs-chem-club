/**
 * kits/matter-strip.js — the instruments and pieces of Mirrowen's q7 bench (Pulling Apart), registered on the matter kit.
 *
 * Five instruments, one family: the PAPER STRIP (a drawn ruler, a solvent that climbs, spots that stop where the model puts them),
 * the FILTER (paper, cup and a dried drop of the cup), the STILL (a flask, a column and a receiver that fills cut by cut), the
 * BOILING FLASK (a thermometer that reads where a salted pot boils) and the PLAN BOARD (where sand, salt and water end up for a list of
 * steps). One piece, the sample card (`smp`). Every figure is `engine/matterdata-strip.js` asked about what the table holds; a painter
 * decides nothing. The strip is a SIMULATION and the bench says so on the plate.
 *
 * What a run leaves is written on the card that was run (`stamp`), as the probe's card keeps its reading, or in a dial with no control of
 * its own (`props.hidden`), so a table is plain data and an undo gives back the bench exactly.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { contentTop } from './heat-draw.js';
import { seatedIn } from './heat-read.js';
import { say, slab, frameOf } from './matter-draw.js';
import { registerFixture, registerPiece } from './matter-registry.js';
import { addTourText } from '../tour.js';
import {
  FRONT_CM, SOLVENT_ORDER, SOLVENT_LABEL, SOLVENT_SHORT, DYE_COLOUR, DYE_NAME, INKS, spotCm,
  MIXTURES, pourThrough, STILL_LIQUIDS, STILL_NAME, STILL_INK, STILL_CUTS, COLUMN_STAGES, stillCuts,
  KB_WATER, WATER_BP, BOIL_AMOUNTS, BOIL_SOLUTES, boilingRise, PLAN_PARTS, PLAN_INK, planSeparation
} from '../../engine/matterdata-strip.js';

const AMBER = PLATE_COLORS.amber;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const TEXT = PLATE_COLORS.text;
const GLASS = 'rgba(111,143,176,0.22)';
const r1 = v => Math.round(v * 10) / 10;

const rect = (ctx, F, x, y, w, h, fill, stroke = null) => {
  if (fill) { ctx.fillStyle = fill; ctx.fillRect(F.x(x), F.y(y), F.len(w), F.len(h)); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(w)), Math.round(F.len(h))); }
};
const disc = (ctx, F, x, y, r, fill, stroke = null) => {
  ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(F.x(x), F.y(y), Math.max(1, F.len(r)), 0, Math.PI * 2); ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
};
const seg = (ctx, F, x0, y0, x1, y1, color) => { ctx.strokeStyle = color; ctx.beginPath(); ctx.moveTo(F.x(x0), F.y(y0)); ctx.lineTo(F.x(x1), F.y(y1)); ctx.stroke(); };
const word = (ctx, F, t, x, y, k, o = {}) => say(ctx, t, F.x(x), F.y(y), F.size(k, 6), { color: DIM, ...o, ...(o.maxW ? { maxW: F.len(o.maxW) } : {}) });
/** A dial's value, counted from 1. */
const dialAt = (state, fid, name) => Math.round(state.fixtures[fid].dials[name].value);

/* ==================================================================
   THE PAPER STRIP
   ================================================================== */

const STRIP_K = 2.6; // table units to a centimetre of paper

/** The strip: a slot for the ink, a ruler, one lane of paper per solvent. With more than one solvent, a Solvent dial picks the lane the Run key fills. */
export function stripFixture(id, at, { solvents = ['water'], title = 'Paper strip' } = {}) {
  const multi = solvents.length > 1;
  const top = contentTop(multi ? 1 : 0);
  const h = r1(top + 5 + 11 * STRIP_K + 8.5);
  const w = 38 + solvents.length * 12 + 3;
  const slotId = `${id}.ink`;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  const dials = multi ? { solvent: { min: 1, max: solvents.length, step: 1, value: 1, label: 'Solvent', labels: solvents.map(s => SOLVENT_LABEL[s]) } } : {};
  return {
    fixture: { id, kind: 'strip', label: title, at: { ...at }, size: { w, h }, dials, runLabel: 'Run Strip', props: { backdrop: true, slot: slotId, solvents: [...solvents], ctop: top } },
    slot: { id: slotId, label: ' ', at: { x: x0 + 15, y: y0 + top + 11 }, size: { w: 24, h: 20 } },
    slotId, size: { w, h }
  };
}

/** The ink in the strip's slot, the solvents on the paper and what has run. */
export function stripRead(state, fid) {
  const f = state.fixtures[fid];
  const item = seatedIn(state, f.props.slot);
  const solvents = f.props.solvents;
  const selected = solvents.length > 1 ? solvents[dialAt(state, fid, 'solvent') - 1] : solvents[0];
  return { item, solvents, selected, ran: item?.props.ran || {} };
}

function runStrip(state, fid) {
  const r = stripRead(state, fid);
  if (!r.item) return { noop: 'Put an ink in the strip first.' };
  return { stamp: { [r.item.id]: { ran: { ...r.ran, [r.selected]: FRONT_CM } } } };
}

function paintStrip(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props; const r = stripRead(state, f.id);
  const top = p.ctop; const k = STRIP_K;
  const cmY = cm => top + 5 + (11 - cm) * k;
  const multi = r.solvents.length > 1;
  // The ruler: millimetres where the picture is big enough to tell them apart, else half centimetres.
  const rx = 35;
  const fine = F.len(k) / 10 >= 2.2;
  seg(ctx, F, rx, cmY(0), rx, cmY(11), DUST);
  for (let mm = 0; mm <= 110; mm++) {
    const cm = mm / 10;
    const major = mm % 10 === 0; const half = mm % 5 === 0;
    if (!major && !(fine || half)) continue;
    seg(ctx, F, rx, cmY(cm), rx - (major ? 2.2 : half ? 1.5 : 0.9), cmY(cm), major ? DUST : STEEL);
  }
  const every = F.len(k) >= 8 ? 1 : 2;
  for (let cm = 0; cm <= 11; cm += every) word(ctx, F, String(cm), rx - 2.8, cmY(cm), 2.0, { align: 'right', color: DUST });
  word(ctx, F, 'cm', rx - 1, top + 2.2, 2.0, { align: 'right', color: DUST });
  r.solvents.forEach((s, i) => {
    const xc = 38 + 6 + 12 * i;
    const lit = multi && s === r.selected;
    word(ctx, F, SOLVENT_SHORT[s], xc, top + 2.2, 2.0, { align: 'center', color: lit ? AMBER : DUST, maxW: 11, weight: lit ? 700 : 500 });
    rect(ctx, F, xc - 4, cmY(11.2), 8, cmY(0) + 1 - cmY(11.2), '#1c1a16', STEEL);
    const did = r.item && r.ran[s] != null;
    if (did) {
      const fy = cmY(r.ran[s]);
      rect(ctx, F, xc - 3.6, fy, 7.2, cmY(0) + 0.8 - fy, 'rgba(111,143,176,0.18)');
      seg(ctx, F, xc - 4, fy, xc + 4, fy, DUST);
    }
    seg(ctx, F, xc - 4, cmY(0), xc + 4, cmY(0), DIM);
    if (!r.item) return;
    const dyes = INKS[r.item.props.ink]?.dyes || [];
    if (!did) { disc(ctx, F, xc, cmY(0), 1.3, '#2a2620', STEEL); return; }
    for (const d of dyes) {
      const y = cmY(spotCm(d, s, r.ran[s]));
      ctx.fillStyle = DYE_COLOUR[d];
      ctx.beginPath(); ctx.ellipse(F.x(xc), F.y(y), F.len(2.0), F.len(1.3), 0, 0, Math.PI * 2); ctx.fill();
    }
  });
  word(ctx, F, 'A SIMULATION', 3, top + 25, 2.0, { maxW: 26 });
}

/* ==================================================================
   THE FILTER
   ================================================================== */

/** The filter: a slot for a mixture, paper in a funnel, a cup under it and a slide with a dried drop of the cup. */
export function filterFixture(id, at, { title = 'Filter' } = {}) {
  const top = contentTop(0);
  const h = r1(top + 40); const w = 62;
  const slotId = `${id}.mix`;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  return {
    fixture: { id, kind: 'filter', label: title, at: { ...at }, size: { w, h }, dials: {}, runLabel: 'Pour Through', props: { backdrop: true, slot: slotId, ctop: top } },
    slot: { id: slotId, label: ' ', at: { x: x0 + 15, y: y0 + top + 11 }, size: { w: 24, h: 20 } },
    slotId, size: { w, h }
  };
}

export function filterRead(state, fid) {
  const f = state.fixtures[fid];
  const item = seatedIn(state, f.props.slot);
  return { item, poured: item?.props.poured || null };
}

function runFilter(state, fid) {
  const r = filterRead(state, fid);
  if (!r.item) return { noop: 'Put a mixture in the filter first.' };
  const res = pourThrough(r.item.props.mix);
  return { stamp: { [r.item.id]: { poured: { onPaper: res.onPaper, dried: res.dried, cup: res.cup } } } };
}

function paintFilter(ctx, f, state, b) {
  const F = frameOf(b);
  const top = f.props.ctop; const r = filterRead(state, f.id);
  const pr = r.poured;
  word(ctx, F, 'PAPER', 58, top + 2.2, 2.0, { align: 'right' });
  // The funnel and its paper.
  ctx.lineWidth = 1;
  seg(ctx, F, 35, top + 4, 45, top + 16, STEEL); seg(ctx, F, 55, top + 4, 45, top + 16, STEEL);
  seg(ctx, F, 36.5, top + 4.5, 45, top + 14.5, DUST); seg(ctx, F, 53.5, top + 4.5, 45, top + 14.5, DUST);
  if (pr?.onPaper) {
    const col = MIXTURES[r.item.props.mix].id === 'sand' ? '#b79a5f' : '#8a6a3f';
    for (let i = 0; i < 9; i++) {
      const t = (i + 0.5) / 9; const side = i % 2 ? 1 : -1;
      const yy = top + 6 + t * 8; const xx = 45 + side * (8.5 - t * 7.5) * (1 - t * 0.1);
      rect(ctx, F, xx - 0.6, yy - 0.6, 1.2, 1.2, col);
    }
  }
  // The cup under it.
  word(ctx, F, 'CUP', 58, top + 17, 2.0, { align: 'right' });
  rect(ctx, F, 36, top + 18, 18, 13, '#100f0c', STEEL);
  if (pr) {
    rect(ctx, F, 36.6, top + 22, 16.8, 8.4, pr.cup ? `${pr.cup}66` : GLASS);
    for (let i = 0; i < 3; i++) disc(ctx, F, 45, top + 16.6 + i * 0.1, 0.35, TEXT);
  }
  // The slide with a dried drop of the cup.
  rect(ctx, F, 3, top + 23, 24, 10, '#100f0c', STEEL);
  if (pr?.dried === 'crust') {
    for (let i = 0; i < 16; i++) rect(ctx, F, 8 + (i % 8) * 1.9 + ((i * 7) % 3) * 0.3, top + 25.4 + Math.floor(i / 8) * 2.6 + ((i * 5) % 3) * 0.4, 0.9, 0.9, '#e6e0d0');
  } else if (pr?.dried === 'stain') {
    ctx.fillStyle = `${pr.cup || '#b8382c'}99`; ctx.beginPath(); ctx.ellipse(F.x(15), F.y(top + 28), F.len(5), F.len(2.8), 0, 0, Math.PI * 2); ctx.fill();
  }
  word(ctx, F, 'CUP DROP, DRIED', 3, top + 36.4, 2.0, { maxW: 24 });
}

/* ==================================================================
   THE STILL
   ================================================================== */

/** The still: a flask of three liquids, a column of three steps and a receiver that fills one vial at a time. The cut count is a dial with no control. */
export function stillFixture(id, at, { title = 'Still' } = {}) {
  const top = contentTop(0);
  const h = r1(top + 44); const w = 82;
  return {
    fixture: { id, kind: 'still', label: title, at: { ...at }, size: { w, h }, dials: { cuts: { min: 0, max: STILL_CUTS, step: 1, value: 0, label: 'Cuts' } }, runLabel: 'Collect Cut', props: { backdrop: true, ctop: top, hidden: ['cuts'] } },
    size: { w, h }
  };
}

export function stillRead(state, fid) {
  const f = state.fixtures[fid];
  const cuts = Math.round(f.dials.cuts.value);
  return { cuts, all: stillCuts(), done: stillCuts().slice(0, cuts) };
}

function runStill(state, fid) {
  const r = stillRead(state, fid);
  if (r.cuts >= STILL_CUTS) return { noop: 'The flask is empty.' };
  return { dials: { [fid]: { cuts: r.cuts + 1 } } };
}

function paintStill(ctx, f, state, b) {
  const F = frameOf(b);
  const top = f.props.ctop; const r = stillRead(state, f.id);
  // The flask: its level falls by a third of the liquid with every cut.
  const level = 1 - r.cuts / STILL_CUTS;
  ctx.strokeStyle = STEEL;
  seg(ctx, F, 12, top + 1, 12, top + 8, STEEL); seg(ctx, F, 18, top + 1, 18, top + 8, STEEL);
  seg(ctx, F, 12, top + 8, 5, top + 26, STEEL); seg(ctx, F, 18, top + 8, 25, top + 26, STEEL); seg(ctx, F, 5, top + 26, 25, top + 26, STEEL);
  if (level > 0) {
    const yl = top + 26 - 14 * level;
    const w2 = 3 + (yl - (top + 8)) / 18 * 10;
    ctx.fillStyle = 'rgba(160,150,120,0.35)';
    ctx.beginPath(); ctx.moveTo(F.x(15 - w2), F.y(yl)); ctx.lineTo(F.x(15 + w2), F.y(yl)); ctx.lineTo(F.x(25), F.y(top + 26)); ctx.lineTo(F.x(5), F.y(top + 26)); ctx.closePath(); ctx.fill();
  }
  STILL_LIQUIDS.forEach((id, i) => {
    const y = top + 30.2 + i * 3.4;
    rect(ctx, F, 3, y - 1, 2, 2, STILL_INK[id]);
    word(ctx, F, STILL_NAME[id], 6.5, y, 2.0, { color: DUST, maxW: 20 });
  });
  word(ctx, F, 'SIMPLE MODEL', 3, top + 42.2, 2.0, { maxW: 26 });
  // The column: three steps in a tube, and the thermometer reading at its top.
  rect(ctx, F, 35, top + 3, 6, 27, '#100f0c', STEEL);
  for (let i = 1; i <= COLUMN_STAGES; i++) seg(ctx, F, 35, top + 3 + i * 6.75, 41, top + 3 + i * 6.75, DIM);
  seg(ctx, F, 38, top + 30, 38, top + 33, STEEL);
  const last = r.done[r.done.length - 1];
  word(ctx, F, last ? `TOP ${last.T.toFixed(1)} °C` : 'TOP —', 31, top + 34.5, 2.2, { color: last ? AMBER : DIM, weight: 700, maxW: 24 });
  // The receiver: one vial per cut, ten cells to a vial, each cell one tenth of what was collected.
  [0, 1, 2].forEach(i => {
    const xv = 52.5 + i * 10;
    word(ctx, F, String(i + 1), xv + 3.5, top + 4.5, 2.0, { align: 'center' });
    rect(ctx, F, xv, top + 7, 7, 22, null, STEEL);
    const cut = r.done[i];
    if (!cut) return;
    let cell = 0;
    STILL_LIQUIDS.forEach((id, j) => {
      for (let c = 0; c < cut.cells[j]; c++) { rect(ctx, F, xv + 0.5, top + 28.5 - (cell + 1) * 2.1, 6, 1.9, STILL_INK[id]); cell++; }
    });
    word(ctx, F, cut.T.toFixed(1), xv + 3.5, top + 32.3, 2.0, { align: 'center', color: DUST, maxW: 9 });
  });
}

/* ==================================================================
   THE BOILING FLASK (beyond the exam)
   ================================================================== */

/** The boiling flask: a slot for what is dissolved, an Amount dial (mol in 1.00 kg of water), a thermometer. */
export function boilerFixture(id, at, { title = 'Boiling flask' } = {}) {
  const top = contentTop(1);
  const h = r1(top + 36); const w = 82;
  const slotId = `${id}.pot`;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  return {
    fixture: {
      id, kind: 'boiler', label: title, at: { ...at }, size: { w, h },
      dials: { amount: { min: 1, max: BOIL_AMOUNTS.length, step: 1, value: 1, label: 'Dissolved', labels: BOIL_AMOUNTS.map(a => `${a.toFixed(2)} mol`) } },
      runLabel: 'Boil', props: { backdrop: true, slot: slotId, ctop: top }
    },
    slot: { id: slotId, label: ' ', at: { x: x0 + 15, y: y0 + top + 11 }, size: { w: 24, h: 20 } },
    slotId, size: { w, h }
  };
}

export function boilerRead(state, fid) {
  const f = state.fixtures[fid];
  const item = seatedIn(state, f.props.slot);
  const idx = dialAt(state, fid, 'amount');
  const boiled = item?.props.boiled || {};
  return { item, idx, amount: BOIL_AMOUNTS[idx - 1], reading: boiled[idx] ?? null };
}

function runBoiler(state, fid) {
  const r = boilerRead(state, fid);
  if (!r.item) return { noop: 'Put something in the flask first.' };
  const rise = Math.round(boilingRise(r.item.props.solute, r.amount) * 1000) / 1000;
  return { stamp: { [r.item.id]: { boiled: { ...(r.item.props.boiled || {}), [r.idx]: rise } } } };
}

function paintBoiler(ctx, f, state, b) {
  const F = frameOf(b);
  const top = f.props.ctop; const r = boilerRead(state, f.id);
  word(ctx, F, 'IN 1.00 kg OF WATER', 3, top + 24.5, 2.0, { maxW: 26 });
  word(ctx, F, 'IDEAL SOLUTION', 3, top + 28, 2.0, { maxW: 26 });
  // The pot: bubbles once it has boiled.
  seg(ctx, F, 33, top + 6, 33, top + 22, STEEL); seg(ctx, F, 51, top + 6, 51, top + 22, STEEL); seg(ctx, F, 33, top + 22, 51, top + 22, STEEL);
  rect(ctx, F, 33.6, top + 12, 16.8, 9.8, r.item ? GLASS : 'rgba(111,143,176,0.1)');
  if (r.reading != null) for (let i = 0; i < 6; i++) disc(ctx, F, 36 + (i * 2.7) % 13, top + 19 - ((i * 5) % 7), 0.7, TEXT);
  // The thermometer: 99.5 to 103.5 °C, a mark at the boiling point of water alone, and a column that stands at the reading.
  const ty0 = top + 3; const ty1 = top + 30; const lo = 99.5; const hi = 103.5;
  const Y = T => ty1 - ((T - lo) / (hi - lo)) * (ty1 - ty0);
  rect(ctx, F, 60, ty0, 4, ty1 - ty0, '#100f0c', STEEL);
  for (let T = 100; T <= 103; T++) { seg(ctx, F, 58, Y(T), 60, Y(T), DUST); word(ctx, F, String(T), 57.5, Y(T), 2.0, { align: 'right', color: DUST }); }
  seg(ctx, F, 60, Y(WATER_BP), 66, Y(WATER_BP), AMBER);
  word(ctx, F, 'WATER ALONE', 66.5, Y(WATER_BP) + 2.2, 2.0, { maxW: 14 });
  if (r.reading != null) {
    const T = WATER_BP + r.reading;
    rect(ctx, F, 60.6, Y(T), 2.8, ty1 - Y(T) - 0.4, AMBER);
    word(ctx, F, `${T.toFixed(2)} °C`, 66.5, Y(T) - 1.2, 2.4, { color: AMBER, weight: 700, maxW: 14 });
  }
}

/* ==================================================================
   THE PLAN BOARD
   ================================================================== */

/** The board: the mixture at the start, and where sand, salt and water end for the steps standing on the rail. Nothing to press. */
export function planFixture(id, at, { title = 'What the plan does' } = {}) {
  const top = contentTop(0);
  return { id, kind: 'plan', label: title, at: { ...at }, size: { w: 60, h: r1(top + 30) }, noRun: true, dials: {}, props: { ctop: top } };
}

/** The steps (`props.step` of each piece) in the order they stand on the rail. */
export function planSteps(state) {
  return (state.zones.rail?.order || []).map(id => state.pieces[id]?.props.step).filter(Boolean);
}
export const planRead = state => planSeparation(planSteps(state));

function paintPlan(ctx, f, state, b) {
  const F = frameOf(b);
  const top = f.props.ctop; const r = planRead(state);
  word(ctx, F, 'START: ONE FLASK HOLDS', 3, top + 1.6, 2.0, { maxW: 54 });
  PLAN_PARTS.forEach((k, i) => { rect(ctx, F, 3 + i * 14, top + 4.2, 2, 2, PLAN_INK[k]); word(ctx, F, k, 6 + i * 14, top + 5.2, 2.0, { color: DUST, maxW: 10 }); });
  [['ON THE PAPER', 'paper'], ['IN THE FLASK', 'flask'], ['IN THE RECEIVER', 'receiver']].forEach(([label, key], i) => {
    const y = top + 11.5 + i * 6.6;
    seg(ctx, F, 3, y - 3.2, 57, y - 3.2, DIM);
    word(ctx, F, label, 3, y, 2.0, { maxW: 24 });
    if (!r[key].length) { word(ctx, F, '—', 29, y, 2.0); return; }
    r[key].forEach((k, j) => { rect(ctx, F, 29 + j * 10, y - 1, 2, 2, PLAN_INK[k]); word(ctx, F, k, 32 + j * 10, y, 2.0, { color: TEXT, maxW: 8 }); });
  });
}

/* ==================================================================
   THE SAMPLE CARD
   ================================================================== */

const piece = (id, label, at, props, extra = {}) => ({ id, kind: 'smp', label, at, props, ...extra });
/** Black ink for the strip. `ran` is kept on the card once it has been run. */
export const inkCard = (id, at, { ran = null } = {}, extra = {}) => piece(id, 'Black ink', at, { pic: 'ink', ink: 'black', shown: 'on paper', ...(ran ? { ran } : {}) }, extra);
/** A dye, for ranking: a swatch and its name. */
export const dyeCard = (id, dye, at, extra = {}) => piece(id, DYE_NAME[dye], at, { pic: 'dot', colour: DYE_COLOUR[dye], dye }, extra);
/** A solid in water for the filter. */
export const mixCard = (id, mix, at, extra = {}) => piece(id, MIXTURES[mix].name, at, { pic: 'mix', mix, shown: 'in water' }, extra);
/** A solute for the boiling flask: a picture of the particles one formula unit makes in water. */
export const soluteCard = (id, solute, at, extra = {}) => piece(id, BOIL_SOLUTES[solute].label, at, { pic: 'solute', solute, ...(BOIL_SOLUTES[solute].shown ? { shown: BOIL_SOLUTES[solute].shown } : {}) }, extra);

const RECT = { hw: 10.2, hh: 9.5 };

/** Text lines under a card's picture. */
function linesOf(p) {
  const pr = p.props;
  if (pr.pic === 'mix' && pr.poured) {
    return [pr.poured.onPaper ? 'paper: grains' : 'paper: clean', pr.poured.dried === 'crust' ? 'cup drop: crust' : pr.poured.dried === 'stain' ? 'cup drop: stain' : 'cup drop: clean'];
  }
  return pr.shown ? [pr.shown] : [];
}

function paintSmp(ctx, p, state, o) {
  const box = slab(ctx, o, RECT, '#1d1a16');
  const sc = o.sc; const pr = p.props;
  const cx = o.x; const cy = box.y0 + 4.8 * sc;
  const dot = (dx, dy, r, fill, stroke = null) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(cx + dx * sc, cy + dy * sc, Math.max(1, r * sc), 0, Math.PI * 2); ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); } };
  if (pr.pic === 'ink') dot(0, 0, 2.5, '#2a2620', STEEL);
  else if (pr.pic === 'dot') dot(0, 0, 2.6, pr.colour, STEEL);
  else if (pr.pic === 'mix') {
    const m = MIXTURES[pr.mix];
    ctx.fillStyle = m.colour ? `${m.colour}77` : GLASS; ctx.fillRect(cx - 5 * sc, cy - 2.6 * sc, 10 * sc, 5.8 * sc);
    ctx.strokeStyle = STEEL; ctx.strokeRect(cx - 5 * sc, cy - 2.6 * sc, 10 * sc, 5.8 * sc);
    if (m.sizeUm >= 11) for (let i = 0; i < 9; i++) { ctx.fillStyle = m.id === 'sand' ? '#b79a5f' : '#8a6a3f'; ctx.fillRect(cx + (-4 + (i % 5) * 1.9) * sc, cy + (0.9 + Math.floor(i / 5) * 1.3 - (i % 2) * 0.3) * sc, Math.max(1.5, 0.7 * sc), Math.max(1.5, 0.7 * sc)); }
  } else if (pr.pic === 'solute') {
    const i = BOIL_SOLUTES[pr.solute].i;
    const at = i === 1 ? [[0, 0, 1.7]] : i === 2 ? [[-1.7, 0, 1.2], [1.7, 0, 1.7]] : [[-3, 0.4, 1.3], [0, -0.4, 1.7], [3, 0.4, 1.3]];
    for (const [dx, dy, r] of at) dot(dx, dy, r, i === 1 ? '#b8afa0' : r > 1.5 ? '#5b7a32' : '#a39b8c', STEEL);
  }
  const lines = linesOf(p);
  const size = Math.max(6.2, 2.0 * sc);
  let y = box.y0 + box.h - (1.9 + lines.length * 3.1 + 1.2) * sc;
  say(ctx, p.label, o.x, y, size, { align: 'center', weight: 700, maxW: box.w - 2 * sc }); y += 3.4 * sc;
  for (const l of lines) { say(ctx, l, o.x, y, Math.max(5.8, 1.7 * sc), { align: 'center', color: DUST, maxW: box.w - 2 * sc }); y += 3.1 * sc; }
}

registerPiece('smp', {
  kind: { r: 7.5, rect: RECT, nojoin: true },
  paint: paintSmp,
  faceKey: p => `smp|${p.label}|${p.props.pic}|${p.props.mix ?? ''}|${JSON.stringify(p.props.ran ?? '')}|${JSON.stringify(p.props.poured ?? '')}|${p.props.shown ?? ''}`,
  printed: p => String(p.label)
});

registerFixture('strip', { paint: paintStrip, run: runStrip });
registerFixture('filter', { paint: paintFilter, run: runFilter });
registerFixture('still', { paint: paintStill, run: runStill });
registerFixture('boiler', { paint: paintBoiler, run: runBoiler });
registerFixture('plan', { paint: paintPlan });

/* ------------------------------------------------------------------
   TOUR WORDS (three beats each: what it is, what to do with it, what it tells you)
   ------------------------------------------------------------------ */

addTourText({
  'matter:strip': {
    title: 'Paper strip', dials: false,
    text: 'A strip of paper stands in a jar of liquid, with a ruler beside it in centimetres and a pencil line at zero. Drag an ink card into the slot, then press the key: the liquid climbs the paper and carries the ink with it. Where a coloured mark ends up on the ruler, and how far the wet edge got, are the readings. Where a dial lists liquids, the dial picks which strip the key runs, and each strip keeps its own result. The strip is a simulation, drawn from a model.'
  },
  'matter:filter': {
    title: 'Filter', dials: false,
    text: 'A funnel holds a sheet of filter paper over a cup. Drag a mixture card into the slot and press the key to pour it through. The paper shows what it held back, the cup shows what came through, and the slide shows a drop of the cup after the water has dried off it. The card keeps what it showed.'
  },
  'matter:still': {
    title: 'Still', dials: false,
    text: 'A flask holds a mixture of three liquids, with a column above it and a receiver of three glass vials beside it. Press the key to heat the flask and collect the next third of the liquid into the next vial. Each vial is ten cells, coloured by the liquids in it, and the number under it is the temperature at the top of the column while it filled. The still is a simple model.'
  },
  'matter:boiler': {
    title: 'Boiling flask', dials: false,
    text: 'A flask of water, 1.00 kg of it, has a thermometer beside it with a line where plain water boils. Drag a card into the slot, set how much of it is dissolved with the dial, and press the key. The thermometer rises to where that solution boils. The card is a picture of the particles each formula makes in water.'
  },
  'matter:plan': {
    title: 'What the plan does', dials: false,
    text: 'The board starts with one flask holding sand, salt and water. Lay step cards on the row below, and the board shows where each of the three ends up: on the paper, in the flask or in the receiver. It changes as the cards change.'
  }
}, {
  smp: ['Sample cards', 'Each card is something to put in an instrument: an ink, a mixture, a swatch of dye or a particle picture. Drag one into a slot, onto the strip or into a tray. A card that has been through an instrument keeps what it showed, so you can compare cards after they are out again.']
});
