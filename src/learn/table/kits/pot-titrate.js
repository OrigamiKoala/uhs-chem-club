/**
 * kits/pot-titrate.js — the instruments and pieces of Kettle's q7-titrate: a BURETTE over a FLASK with a WINDOW, and the INDICATOR card.
 * Registered on the pot kit (`pot-registry.js`); the planners are `engine/reactdata-titrate.js` (and `titrate` in `reactdata.js`).
 *
 * THE TITRATOR (fixture `titrator`): a burette of base (a tall tube with a scale and a reading), a dial that sets how much one press
 * lets out, a key that lets it out, a flask of acid under the tip, a slot for an indicator card beside the flask, and (where a stage
 * asks for it) a window drawing the ions in the flask that have not yet met. The burette only gives out: every press adds to what
 * has gone in (the recorder keeps each press as one row, `x` the total in mL), and Undo is the way back. The flask's colour is the
 * indicator's colour at the flask's own state; the window's discs are counted from the same state. A painter decides nothing.
 *
 * `perm` is the permanganate flask: iron(II) in acid, no indicator, purple once permanganate is left over.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { addTourText } from '../tour.js';
import { registerFixture, registerPiece } from './pot-registry.js';
import { frameOf, say, slab } from './pot-draw.js';
import { seatedIn, dialAt } from './pot-read.js';
import { contentTop } from './heat-draw.js';
import { ionText } from '../../engine/reactdata.js';
import { flaskAt, permanganateAt, BURETTE_ML } from '../../engine/reactdata-titrate.js';

const AMBER = PLATE_COLORS.amber;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const WARM = '#c0652b';
const COLD = '#6f8fb0';

const round = (x, d = 4) => Math.round(x * 10 ** d) / 10 ** d;

/* ------------------------------------------------------------------
   COLOURS
   ------------------------------------------------------------------ */

/** The ink a colour word is drawn in (the planner says the word; this is only how it looks). */
export const COLOUR_INK = Object.freeze({
  colourless: '#9fb4c0', pink: '#d94a8c', red: '#c0392b', orange: '#d9822b', yellow: '#d8c43a', pale: '#b8c4a8', purple: '#8a3fb0'
});

/** The colours each indicator can show, for the card's swatches (the colour words are `indicatorColour`'s). */
export const INDICATORS = Object.freeze({
  phenolphthalein: { name: 'Phenolphthalein', colours: ['colourless', 'pink'] },
  'methyl orange': { name: 'Methyl orange', colours: ['red', 'orange', 'yellow'] }
});

/* ------------------------------------------------------------------
   THE INDICATOR CARD
   ------------------------------------------------------------------ */

export const INDICATOR_RECT = Object.freeze({ hw: 11, hh: 6 });

/** An indicator card: `indicator` is a key of `INDICATORS`. */
export const indicatorCard = (id, indicator, at, extra = {}) => ({
  id, kind: 'indicator', label: INDICATORS[indicator].name, at, props: { indicator }, ...extra
});

function paintIndicator(ctx, p, state, o) {
  const box = slab(ctx, o, INDICATOR_RECT, '#1d1a16');
  const sc = o.sc;
  const def = INDICATORS[p.props.indicator];
  say(ctx, def.name, o.x, box.y0 + 3.3 * sc, Math.max(6.2, 2.0 * sc), { align: 'center', weight: 700, maxW: box.w - 2 * sc });
  const n = def.colours.length;
  const sw = (box.w - 3 * sc) / n;
  def.colours.forEach((c, i) => {
    const x = box.x0 + 1.5 * sc + i * sw;
    const y = box.y0 + 6.2 * sc;
    ctx.fillStyle = c === 'colourless' ? '#16140f' : COLOUR_INK[c];
    ctx.fillRect(x, y, sw - 1, 3.4 * sc);
    ctx.strokeStyle = DUST; ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(sw - 1), Math.round(3.4 * sc));
  });
}

registerPiece('indicator', {
  kind: { r: 8, rect: INDICATOR_RECT, nojoin: true },
  paint: paintIndicator,
  faceKey: p => `indicator|${p.props.indicator}`,
  printed: p => String(p.label)
});

/* ------------------------------------------------------------------
   THE TITRATOR
   ------------------------------------------------------------------ */

const SLOT = { w: 18, h: 13 };
/** The window's discs go this many to a line. */
const PER_LINE = 13;

/**
 * The burette-and-flask. `sys` is `{ acid: {M, mL, nH}, base: {M, nOH} }` (see `reactdata-titrate.js`); `perm` is `{ fe: {M, mL}, mn: {M} }`
 * for the permanganate flask instead; `presses` the mL each setting of the "Per press" dial lets out; `window` draws the ions that have
 * not met, one disc a `unit` of moles; `indicator` false leaves the indicator slot off. The acid's own strength is never printed
 * (only its volume). Returns the fixture, its slots and its size.
 */
export function titratorFixture(id, at, o = {}) {
  const {
    sys = null, perm = null, presses = [0.5, 1, 2, 5, 10], pressStart = 1, window: win = false, unit = 0.00025, indicator = true,
    named = true, title = named ? 'Burette and flask' : 'Tube and flask', runLabel = 'Open Tap', baseName = 'Base', acidName = 'acid'
  } = o;
  const dials = { press: { min: 1, max: presses.length, step: 1, value: pressStart, label: 'Per press', labels: presses.map(v => `${v} mL`) } };
  const top = contentTop(1);
  const w = win ? 96 : 54;
  const h = 56;
  const x0 = at.x - w / 2;
  const y0 = at.y - h / 2;
  const c0 = top + 3.5;
  const slots = [];
  let mouth = null;
  if (indicator) {
    mouth = `${id}.mouth`;
    slots.push({ id: mouth, label: ' ', at: { x: x0 + 32.5, y: y0 + c0 + 27 }, size: { ...SLOT } });
  }
  return {
    fixture: {
      id, kind: 'titrator', label: title, at: { ...at }, size: { w, h }, dials, runLabel,
      props: { backdrop: true, named, top, c0, mode: perm ? 'perm' : 'acid', sys, perm, presses: presses.slice(), window: win, unit, mouth, baseName, acidName }
    },
    slots, mouth, size: { w, h }
  };
}

/** What the titrator reads: the total let out so far, the press the dial is set to, the indicator in the flask, and the flask's state. */
export function titratorRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const rows = state.recorder.rows.filter(r => r.label.startsWith(`${fid}|`));
  const vMl = rows.length ? rows[rows.length - 1].x : 0;
  const press = p.presses[dialAt(state, fid, 'press') - 1];
  const card = p.mouth ? seatedIn(state, p.mouth) : null;
  const indicator = card?.props?.indicator || null;
  const flask = p.mode === 'perm' ? permanganateAt(p.perm.fe, p.perm.mn, vMl) : flaskAt(p.sys, vMl, indicator);
  return { f, rows, presses: rows.length, vMl, press, indicator, flask, colour: flask.colour };
}

/** The key: one press lets `press` mL out of the burette, which only gives out. */
function runTitrator(state, fid) {
  const r = titratorRead(state, fid);
  const v = round(r.vMl + r.press, 4);
  if (v > BURETTE_ML + 1e-9) return { noop: `The burette holds ${BURETTE_ML.toFixed(1)} mL and has ${(BURETTE_ML - r.vMl).toFixed(1)} mL left.` };
  return { x: v, y: round(r.flask.acidLeft ?? r.flask.feLeft ?? 0, 9), label: `${fid}|${r.presses + 1}` };
}

function discs(ctx, F, n, x, y, ink) {
  const full = Math.floor(n + 1e-9);
  const frac = n - full;
  const r = F.len(0.85);
  const pitch = 2.3;
  const at = i => ({ cx: F.x(x + 0.9 + (i % PER_LINE) * pitch), cy: F.y(y + Math.floor(i / PER_LINE) * pitch) });
  ctx.fillStyle = ink;
  for (let i = 0; i < full; i++) { const q = at(i); ctx.beginPath(); ctx.arc(q.cx, q.cy, r, 0, Math.PI * 2); ctx.fill(); }
  if (frac > 1e-6) {
    const q = at(full);
    ctx.beginPath(); ctx.moveTo(q.cx, q.cy); ctx.arc(q.cx, q.cy, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.closePath(); ctx.fill();
  }
}

function paintTitrator(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = titratorRead(state, f.id);
  const c0 = p.c0;
  const small = F.size(2.0, 6);
  // The burette: a tube 50 mL long, the base in it standing from the surface down to the tip, and a scale on its left.
  const tx = 8; const tw = 6; const th = 16;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(tx), F.y(c0), F.len(tw), F.len(th));
  const level = th * (r.vMl / BURETTE_ML);
  ctx.fillStyle = '#8aa0b8'; ctx.globalAlpha = 0.6;
  ctx.fillRect(F.x(tx) + 1, F.y(c0 + level), F.len(tw) - 2, F.len(th - level));
  ctx.globalAlpha = 1;
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(tx)) + 0.5, Math.round(F.y(c0)) + 0.5, Math.round(F.len(tw)), Math.round(F.len(th)));
  for (let m = 0; m <= BURETTE_ML; m += 10) {
    const yy = c0 + (m / BURETTE_ML) * th;
    ctx.strokeStyle = DIM; ctx.beginPath(); ctx.moveTo(F.x(tx - 1.2), F.y(yy)); ctx.lineTo(F.x(tx), F.y(yy)); ctx.stroke();
    say(ctx, String(m), F.x(tx - 1.8), F.y(yy), small, { align: 'right', color: DIM });
  }
  ctx.strokeStyle = AMBER; ctx.beginPath(); ctx.moveTo(F.x(tx - 1.6), F.y(c0 + level)); ctx.lineTo(F.x(tx + tw), F.y(c0 + level)); ctx.stroke();
  // The tap and the tip.
  ctx.fillStyle = STEEL; ctx.fillRect(F.x(tx + 1), F.y(c0 + th), F.len(tw - 2), F.len(1.6));
  ctx.fillRect(F.x(tx + tw / 2 - 0.4), F.y(c0 + th + 1.6), F.len(0.8), F.len(2.2));
  // Its name, its strength and the total let out.
  say(ctx, p.baseName, F.x(17), F.y(c0 + 1.6), small, { color: DIM });
  const strength = p.mode === 'perm' ? p.perm.mn.M : p.sys.base.M;
  say(ctx, `${strength} mol/L`, F.x(17), F.y(c0 + 4.6), F.size(2.4, 6.5), { color: DUST, weight: 700 });
  say(ctx, 'reading', F.x(17), F.y(c0 + 8.4), small, { color: DIM });
  say(ctx, `${r.vMl.toFixed(1)} mL`, F.x(17), F.y(c0 + 11.8), F.size(3.2, 7.5), { color: AMBER, weight: 700 });
  // The flask under the tip: a neck and a body, filled with the colour the planner gives.
  const fx = tx + tw / 2;
  const neckY = c0 + 20.5; const bodyY = c0 + 24; const baseY = c0 + 35;
  const poly = (pts, fill, stroke) => {
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(F.x(x), F.y(y)) : ctx.moveTo(F.x(x), F.y(y)))); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
  };
  const ink = COLOUR_INK[r.colour] || COLOUR_INK.colourless;
  poly([[fx - 3, neckY], [fx + 3, neckY], [fx + 3, bodyY], [fx + 11, baseY], [fx - 11, baseY], [fx - 3, bodyY]], '#100f0c', STEEL);
  ctx.save();
  ctx.globalAlpha = r.colour === 'colourless' ? 0.35 : 0.8;
  poly([[fx + 3, bodyY + 1.2], [fx + 10.4, baseY - 0.4], [fx - 10.4, baseY - 0.4], [fx - 3, bodyY + 1.2]], ink, null);
  ctx.restore();
  const flaskMl = p.mode === 'perm' ? p.perm.fe.mL : p.sys.acid.mL;
  say(ctx, `${flaskMl.toFixed(1)} mL ${p.acidName}`, F.x(1.5), F.y(c0 + 37.2), small, { color: DIM });
  say(ctx, r.colour, F.x(1.5), F.y(c0 + 40.2), F.size(2.4, 6.5), { color: ink, weight: 700 });
  if (p.mouth) say(ctx, 'Indicator', F.x(32.5), F.y(c0 + 19.4), small, { align: 'center', color: DIM });
  // The window: the ions that have not yet met, one disc a `unit` of moles.
  if (p.window) {
    const wx = 47; const ww = 46;
    ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(wx), F.y(c0), F.len(ww), F.len(34));
    ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(wx)) + 0.5, Math.round(F.y(c0)) + 0.5, Math.round(F.len(ww)), Math.round(F.len(34)));
    const left = r.flask;
    say(ctx, `${ionText('H')} in the flask`, F.x(wx + 1.6), F.y(c0 + 3), F.size(2.3, 6.5), { color: WARM, weight: 700 });
    discs(ctx, F, left.acidLeft / p.unit, wx + 0.8, c0 + 7, WARM);
    say(ctx, `${ionText('OH')} in the flask`, F.x(wx + 1.6), F.y(c0 + 16.6), F.size(2.3, 6.5), { color: COLD, weight: 700 });
    discs(ctx, F, left.baseLeft / p.unit, wx + 0.8, c0 + 20.6, COLD);
    say(ctx, `one disc is ${p.unit} mol`, F.x(wx + 1.6), F.y(c0 + 31.2), F.size(1.9, 5.8), { color: DIM });
  }
}

registerFixture('titrator', { paint: paintTitrator, run: runTitrator });

/* ------------------------------------------------------------------
   TOUR WORDS
   ------------------------------------------------------------------ */

const TITRATOR_TEXT = f => {
  const p = f.props;
  const bits = [`The tall tube${p.named ? ' (a burette)' : ''} holds the base, and its scale and "reading" show how much has run out in all.`];
  bits.push(`The "Per press" dial sets how much one press lets out. Press "${f.runLabel}" to let that much run into the flask below; the base only runs out, so each press adds to the last, and Undo takes a press back.`);
  if (p.mouth) bits.push('Drag a dye card into the slot beside the flask to put the dye in the flask.');
  if (p.mode !== 'perm' && p.window) bits.push(`The flask shows its colour, and the window beside it shows a disc for each ${p.unit} mol of ${ionText('H')} and of ${ionText('OH')} left in the flask.`);
  else bits.push('The flask shows the colour of what is in it.');
  return bits.join(' ');
};

addTourText({
  'pot:titrator': { title: f => f.label, dials: false, text: TITRATOR_TEXT }
}, {
  indicator: ['Dye cards', 'Each card is a dye that changes colour. The swatches on the card show the colours it can have. Drag the card into the slot beside the flask; the flask then shows the dye\'s colour.']
});
