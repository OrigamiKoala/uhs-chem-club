/**
 * kits/matter-flask.js — the FLASK BENCH of Mirrowen's q6 bench (Taken Into Solution), registered on the matter kit (`matter-registry.js`).
 *
 * ONE INSTRUMENT, three parts, any of which a stage may leave off:
 *   a BALANCE pan (a slot) that reads the grams of the sample seated on it;
 *   a volumetric FLASK (a slot at its mouth) with a mark on its neck, a "Flask" dial for its size or a "Stock taken" dial for how much stock
 *     is poured in, and a "Liquid" dial for what the sample goes into;
 *   a WINDOW that draws a small drop of what is in the flask: every particle of the dissolved sample, each ion wrapped in water, or the
 *     sample's lumps if it does not go in.
 * Nothing here has a key: the flask answers a card seated in its mouth or a dial turned, at once, and a card that has been in keeps what
 * the window showed (`props.saw_<liquid>`) and what the pan read (`props.weighed`), as a tin keeps its rise.
 *
 * A painter prints what `matterdata-flask.js` says and decides nothing: the molarity under the window is `molarityOf`, the particles
 * are `dropOf`, and the count a stage may print is counted off the drawn drop.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture, registerPiece } from './matter-registry.js';
import { say, slab, frameOf, paintGlyph } from './matter-draw.js';
import { seatedIn } from './matter-read.js';
import { addTourText } from '../tour.js';
import { SUBSTANCES } from '../../engine/matterdata.js';
import {
  STUFF, ASPECT, dissolves, molarityOf, dilutedTo, unitsFor, dropOf, countsOf
} from '../../engine/matterdata-flask.js';

const AMBER = PLATE_COLORS.amber;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const CATION = '#9bb0c4';
const ANION = '#7f9d58';

/** What the "Liquid" dial's positions are called on the bench, by liquid id. */
export const LIQUIDS = Object.freeze({ water: { label: 'Water', caption: 'WATER' }, hexane: { label: 'Oil (hexane)', caption: 'OIL' } });

/* ------------------------------------------------------------------
   READING THE FLASK (pure)
   ------------------------------------------------------------------ */

const dialIdx = (f, name) => (f.dials[name] ? Math.round(f.dials[name].value) - 1 : null);

/**
 * What the flask holds and what the window shows: the card seated in its mouth, the liquid, the flask's volume, the molarity and the
 * number of formula units in the drop. A card that is a made flask (`props.made`) is already a solution: its molarity is its own
 * (grams over its mL), or, for a stock, its molarity times the stock poured in over the volume it is made up to.
 */
export function flaskRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const item = seatedIn(state, p.slot);
  const panItem = p.pan ? seatedIn(state, p.pan) : null;
  const liquid = p.liquids ? p.liquids[dialIdx(f, 'solvent')] : 'water';
  const volume = p.fills ? p.fills[dialIdx(f, 'fill')] : p.volume;
  const stockVol = p.stocks ? p.stocks[dialIdx(f, 'stock')] : null;
  const out = { item, panItem, liquid, volume, stockVol, c: null, units: 0, spreads: false, sub: item?.props.sub ?? null, drop: null, grams: panItem?.props.grams ?? null };
  if (!item) return out;
  const pr = item.props;
  out.spreads = pr.made ? true : dissolves(pr.sub, liquid);
  if (pr.made) out.c = pr.stock ? dilutedTo(pr.M, stockVol, volume) : molarityOf(pr.sub, pr.grams, pr.mL);
  else if (volume && (pr.grams != null || pr.moles != null)) out.c = (pr.moles ?? pr.grams / STUFF[pr.sub].M) / (volume / 1000);
  out.units = pr.units ?? unitsFor(out.c ?? 0);
  return out;
}

const dropCache = new Map();
/** The drop for a flask's reading, remembered (the picture is a pure function of its four arguments). */
export function dropFor(read) {
  if (!read.item) return null;
  const key = `${read.sub}|${read.liquid}|${read.units}|${read.spreads ? 1 : 0}`;
  let d = dropCache.get(key);
  if (!d) {
    d = dropOf({ sub: read.sub, solvent: read.liquid, units: read.units, spreads: read.spreads });
    if (dropCache.size > 60) dropCache.clear();
    dropCache.set(key, d);
  }
  return d;
}

/** What the window shows of a card, in words: 'spreads' if its particles are apart through the liquid, 'lumps' if they are packed together. */
export const sawOf = read => (read.spreads ? 'spreads' : 'lumps');

/* ------------------------------------------------------------------
   THE FIXTURE
   ------------------------------------------------------------------ */

const TOP_DIALS = 13.4;
const TOP_BARE = 10;
const WIN = Object.freeze({ w: 36, h: 26 });

/**
 * The flask bench, its top-left corner at (x0, y0). Options:
 *   pan        a balance pan beside the flask (a slot `<id>.pan`)
 *   volume     the flask's size in mL when it has no "Flask" dial (the mark reads it)
 *   fills      a "Flask" dial: the sizes in mL (100, 250, 500)
 *   stocks     a "Stock taken" dial: the mL of stock poured in; `volume` is what it is made up to
 *   liquids    a "Liquid" dial: the liquids ids ('water', 'hexane')
 *   showM      print the molarity under the window;  count  print the number of particles in the drop
 *   keep       a dry card that goes in keeps a line for what the window showed (`saw_water`, `saw_hexane`)
 * Returns the fixture, the mouth slot (and the pan slot) to stand where they say, and the box it fills.
 */
export function flaskFixture(id, x0, y0, o = {}) {
  const { pan = false, volume = 250, fills = null, stocks = null, liquids = null, showM = false, count = false, keep = false, fillStart = 1, stockStart = 1, liquidStart = 1, title = 'Flask bench' } = o;
  const dials = {};
  if (fills) dials.fill = { min: 1, max: fills.length, step: 1, value: fillStart, label: 'Flask', labels: fills.map(v => `${v} mL`) };
  if (stocks) dials.stock = { min: 1, max: stocks.length, step: 1, value: stockStart, label: 'Stock poured in', labels: stocks.map(v => `${v} mL`) };
  if (liquids) dials.solvent = { min: 1, max: liquids.length, step: 1, value: liquidStart, label: 'Liquid', labels: liquids.map(l => LIQUIDS[l].label) };
  const top = Object.keys(dials).length ? TOP_DIALS : TOP_BARE;
  const fx0 = pan ? 24 : 2;
  const w = fx0 + 22 + WIN.w + 2;
  const h = Math.round((top + 37.2) * 10) / 10;
  const at = { x: x0 + w / 2, y: y0 + h / 2 };
  const mouth = { id: `${id}.mouth`, label: ' ', at: { x: x0 + fx0 + 10, y: y0 + top + 11 }, size: { w: 18, h: 20 } };
  const panSlot = pan ? { id: `${id}.pan`, label: ' ', at: { x: x0 + 11, y: y0 + top + 11 }, size: { w: 18, h: 20 } } : null;
  return {
    fixture: {
      id, kind: 'flask', label: title, at, size: { w, h }, dials, noRun: true,
      props: { backdrop: true, slot: mouth.id, ...(pan ? { pan: panSlot.id } : {}), volume, ...(fills ? { fills } : {}), ...(stocks ? { stocks } : {}), ...(liquids ? { liquids } : {}), showM, count, keep, top, fx0 }
    },
    mouth, pan: panSlot, slotId: mouth.id, panId: panSlot?.id ?? null, size: { w, h }
  };
}

/* ------------------------------------------------------------------
   THE PICTURE
   ------------------------------------------------------------------ */

function waterGlyph(ctx, x, y, unit, alpha = 0.55) {
  paintGlyph(ctx, 'H2O', x, y, unit, { alpha });
}

/** One particle of the drop, at pixel (x, y) with radius `rad` pixels. */
function paintPart(ctx, part, x, y, rad, hpx) {
  ctx.lineWidth = 1;
  if (part.k === 'cation' || part.k === 'anion') {
    ctx.fillStyle = part.k === 'cation' ? CATION : ANION;
    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = STEEL; ctx.stroke();
    if (rad >= 5) say(ctx, part.sign, x, y + 0.5, Math.max(6.5, rad * 1.15), { align: 'center', weight: 700, color: '#15130f' });
  } else if (part.k === 'molecule') {
    ctx.fillStyle = '#cfc8b8';
    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = STEEL; ctx.stroke();
    ctx.strokeStyle = '#8c8376';
    ctx.beginPath(); ctx.arc(x, y, rad * 0.5, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#a0522d';
    ctx.beginPath(); ctx.arc(x + rad * 0.5, y - rad * 0.2, Math.max(1.4, rad * 0.16), 0, Math.PI * 2); ctx.fill();
  } else if (part.k === 'grain') {
    ctx.fillStyle = '#8a8274';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = part.a + (i / 6) * Math.PI * 2;
      const r = rad * (0.78 + 0.22 * Math.sin(part.u * 40 + i * 2.1));
      if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3c3833'; ctx.stroke();
  } else if (part.k === 'chain') {
    // A long hydrocarbon: a zigzag of carbons along its own direction.
    const n = 8; const len = rad * 2.6; const step = len / (n - 1);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const along = (i - (n - 1) / 2) * step; const across = (i % 2 ? 1 : -1) * step * 0.28;
      pts.push([x + Math.cos(part.a) * along - Math.sin(part.a) * across, y + Math.sin(part.a) * along + Math.cos(part.a) * across]);
    }
    ctx.strokeStyle = DUST; ctx.lineWidth = Math.max(1.2, rad * 0.08);
    ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke(); ctx.lineWidth = 1;
    ctx.fillStyle = '#6a655b';
    for (const [px, py] of pts) { ctx.beginPath(); ctx.arc(px, py, Math.max(1.6, rad * 0.1), 0, Math.PI * 2); ctx.fill(); }
  } else if (part.k === 'small') {
    paintGlyph(ctx, 'acetone', x, y, rad * 0.95);
  }
  void hpx;
}

function paintWindow(ctx, F, f, R, wx, wy) {
  const p = f.props;
  const ww = WIN.w; const wh = WIN.h;
  ctx.fillStyle = '#0f0e0b'; ctx.fillRect(F.x(wx), F.y(wy), F.len(ww), F.len(wh));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(wx)) + 0.5, Math.round(F.y(wy)) + 0.5, Math.round(F.len(ww)), Math.round(F.len(wh)));
  // The picture: ASPECT wide by 1 high, centred in the glass.
  const pw = ww - 2; const ph = pw / ASPECT;
  const ox = F.x(wx + 1); const oy = F.y(wy + (wh - ph) / 2);
  const hpx = F.len(ph);
  const U = u => ox + (u / ASPECT) * F.len(pw);
  const V = v => oy + v * hpx;
  const drop = dropFor(R);
  const liquid = R.liquid;
  // The liquid's own molecules, faint, behind everything.
  const solventUnit = Math.max(3.4, hpx * 0.035);
  const sol = drop ? drop.solvent : dropOf({ sub: 'NaCl', solvent: liquid, units: 0, spreads: true }).solvent;
  for (const m of sol) {
    if (liquid === 'water') waterGlyph(ctx, U(m.u), V(m.v), solventUnit, 0.32);
    else paintGlyph(ctx, 'hexane', U(m.u), V(m.v), solventUnit * 0.62, { alpha: 0.32 });
  }
  if (drop) {
    // A wrapped ion: three waters touching it. (Drawn under the ion itself.)
    if (drop.shellOn) {
      for (const q of drop.parts) {
        const rad = Math.max(q.rad * hpx, 4.2);
        for (let k = 0; k < 3; k++) {
          const a = (q.a || 0) + (k / 3) * Math.PI * 2;
          const d = rad * 1.7;
          waterGlyph(ctx, U(q.u) + Math.cos(a) * d, V(q.v) + Math.sin(a) * d, Math.max(3.6, rad * 0.55), 0.9);
        }
      }
    }
    for (const q of drop.parts) paintPart(ctx, q, U(q.u), V(q.v), Math.max(q.rad * hpx, q.k === 'cation' || q.k === 'anion' ? 5.2 : 3), hpx);
  }
  // The rows under the glass: what the drop is of, and what a stage chooses to print.
  const cap = `A DROP, IN ${LIQUIDS[liquid]?.caption ?? 'WATER'}`;
  say(ctx, cap, F.x(wx), F.y(wy + wh + 3.4), F.size(2.0, 6), { color: DIM });
  const reads = [];
  if (p.showM && R.item && R.c != null) reads.push(`MOLARITY ${R.c >= 1 ? R.c.toFixed(2) : R.c.toFixed(3)} M`);
  if (p.count && drop) reads.push(`${countsOf(drop).total} PARTICLES`);
  reads.forEach((t, i) => say(ctx, t, F.x(wx + ww), F.y(wy + wh + 7.4 + i * 3), F.size(2.6, 6.5), { color: AMBER, weight: 700, align: 'right', maxW: F.len(ww) }));
}

function paintFlaskBlock(ctx, F, f, R, fx0, top) {
  const p = f.props;
  const cx = fx0 + 10;
  const neckTop = top + 21; const markY = top + 22.8; const bulbY = top + 31.2; const bulbR = 6;
  const level = R.item || true;
  // The bulb and neck: glass outline; the liquid stands at the mark.
  ctx.fillStyle = 'rgba(111,143,176,0.26)';
  ctx.beginPath(); ctx.arc(F.x(cx), F.y(bulbY), F.len(bulbR - 0.4), 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(F.x(cx - 1.1), F.y(markY), F.len(2.2), F.len(bulbY - markY - 1));
  ctx.strokeStyle = STEEL; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(F.x(cx), F.y(bulbY), F.len(bulbR), -Math.PI * 0.42, Math.PI * 1.42); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(F.x(cx - 1.5), F.y(neckTop)); ctx.lineTo(F.x(cx - 1.5), F.y(bulbY - bulbR * 0.9)); ctx.moveTo(F.x(cx + 1.5), F.y(neckTop)); ctx.lineTo(F.x(cx + 1.5), F.y(bulbY - bulbR * 0.9)); ctx.stroke();
  ctx.lineWidth = 1;
  // The graduation mark round the neck, and what it reads.
  ctx.strokeStyle = AMBER; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(F.x(cx - 3.2), F.y(markY)); ctx.lineTo(F.x(cx + 3.2), F.y(markY)); ctx.stroke(); ctx.lineWidth = 1;
  say(ctx, `${R.volume} mL`, F.x(cx + 4), F.y(markY), F.size(2.0, 6), { color: DUST, weight: 700, maxW: F.len(8) });
  void level; void p;
}

function paintBalance(ctx, F, f, R, top) {
  const read = R.grams;
  ctx.strokeStyle = STEEL; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(F.x(1.5), F.y(top + 22)); ctx.lineTo(F.x(20.5), F.y(top + 22)); ctx.stroke(); ctx.lineWidth = 1;
  say(ctx, 'BALANCE', F.x(2), F.y(top + 25.4), F.size(2.0, 6), { color: DIM });
  say(ctx, read != null ? `${read < 10 ? read.toFixed(2) : read.toFixed(1)} g` : '—', F.x(2), F.y(top + 30.8), F.size(3.6, 8), { color: read != null ? AMBER : DUST, weight: 700, maxW: F.len(21) });
}

function paintFlaskFixture(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const R = flaskRead(state, f.id);
  const top = p.top;
  if (p.pan) paintBalance(ctx, F, f, R, top);
  paintFlaskBlock(ctx, F, f, R, p.fx0, top);
  paintWindow(ctx, F, f, R, p.fx0 + 22, top + 1);
}

/* ------------------------------------------------------------------
   THE SAMPLE CARD
   ------------------------------------------------------------------ */

const RECT = Object.freeze({ hw: 8.2, hh: 9.5 });

/**
 * A sample: a dry solid or liquid to stir in (`sub` a `STUFF` id; `grams` or `moles` or `units`), or a made flask (`made`: its `grams` and `mL`),
 * or a stock (`made`, `stock`, `M`). `shown` is a second line. A card keeps what the pan read and what the window showed.
 */
export const sample = (id, sub, label, at, props = {}, extra = {}) => ({ id, kind: 'sample', label, at, props: { sub, ...props }, ...extra });

function paintSample(ctx, p, state, o) {
  const box = slab(ctx, o, RECT, '#1d1a16');
  const sc = o.sc; const pr = p.props;
  const cx = o.x;
  // The picture: a heap of grains for a dry sample, a flask with its liquid for a made one.
  const iy = box.y0 + 4.2 * sc;
  if (pr.made) {
    ctx.strokeStyle = DUST; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx - 0.9 * sc, iy - 2.6 * sc); ctx.lineTo(cx - 0.9 * sc, iy - 0.8 * sc); ctx.lineTo(cx - 3 * sc, iy + 2.6 * sc); ctx.lineTo(cx + 3 * sc, iy + 2.6 * sc); ctx.lineTo(cx + 0.9 * sc, iy - 0.8 * sc); ctx.lineTo(cx + 0.9 * sc, iy - 2.6 * sc); ctx.stroke(); ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(111,143,176,0.4)';
    ctx.beginPath(); ctx.moveTo(cx - 2.2 * sc, iy + 0.7 * sc); ctx.lineTo(cx + 2.2 * sc, iy + 0.7 * sc); ctx.lineTo(cx + 3 * sc, iy + 2.6 * sc); ctx.lineTo(cx - 3 * sc, iy + 2.6 * sc); ctx.fill();
  } else if (STUFF[pr.sub]?.dry === 'liquid') {
    ctx.fillStyle = 'rgba(184,175,160,0.35)';
    ctx.beginPath(); ctx.arc(cx, iy + 0.4 * sc, 2.2 * sc, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = DUST; ctx.stroke();
  } else {
    ctx.fillStyle = '#d8d2c4';
    for (const [dx, dy] of [[-2.4, 2], [-0.8, 2], [0.8, 2], [2.4, 2], [-1.6, 0.6], [0, 0.6], [1.6, 0.6], [-0.8, -0.8], [0.8, -0.8], [0, -2]]) {
      ctx.beginPath(); ctx.arc(cx + dx * sc, iy + dy * sc, Math.max(1.3, 0.55 * sc), 0, Math.PI * 2); ctx.fill();
    }
  }
  let y = box.y0 + 10.2 * sc;
  say(ctx, p.label, cx, y, Math.max(6.2, 1.95 * sc), { align: 'center', weight: 700, maxW: box.w - 1.4 * sc });
  y += 2.5 * sc;
  const second = pr.weighed != null ? `${pr.weighed < 10 ? pr.weighed.toFixed(2) : pr.weighed.toFixed(1)} g` : pr.shown;
  if (second) { say(ctx, second, cx, y, Math.max(6, 1.7 * sc), { align: 'center', color: pr.weighed != null ? AMBER : DUST, weight: pr.weighed != null ? 700 : 500, maxW: box.w - 1.4 * sc }); y += 2.3 * sc; }
  for (const [key, name] of [['saw_water', 'water'], ['saw_hexane', 'oil']]) {
    if (pr[key]) { say(ctx, `${name}: ${pr[key]}`, cx, y, Math.max(6, 1.55 * sc), { align: 'center', color: AMBER, maxW: box.w - 1.2 * sc }); y += 2.1 * sc; }
  }
}

const sampleFaceKey = p => `sample|${p.label}|${p.props.sub}|${p.props.shown ?? ''}|${p.props.weighed ?? ''}|${p.props.saw_water ?? ''}|${p.props.saw_hexane ?? ''}|${p.props.made ? 1 : 0}`;

/* ------------------------------------------------------------------
   WHAT A CARD KEEPS (after every action)
   ------------------------------------------------------------------ */

/** A dry sample in a flask keeps whether it spread through the liquid; a sample on a pan keeps its grams. Read from the flask's own reading. */
function settle(state) {
  for (const f of Object.values(state.fixtures)) {
    if (f.kind !== 'flask') continue;
    const R = flaskRead(state, f.id);
    if (f.props.keep && R.item && !R.item.props.made) R.item.props[`saw_${R.liquid}`] = sawOf(R);
    if (R.panItem && R.panItem.props.grams != null) R.panItem.props.weighed = R.panItem.props.grams;
  }
}

registerFixture('flask', { paint: paintFlaskFixture, settle });
registerPiece('sample', { kind: { r: 7.5, rect: RECT, nojoin: true }, paint: paintSample, faceKey: sampleFaceKey, printed: p => String(p.label) });

/* ------------------------------------------------------------------
   THE TOUR
   ------------------------------------------------------------------ */

addTourText({
  'matter:flask': {
    title: 'Flask bench', dials: false,
    text: (f) => {
      const p = f.props;
      const bits = [];
      if (p.pan) bits.push('On the left is a balance pan. Drag a card onto the pan and it reads how many grams the card holds. The card keeps that weight.');
      bits.push(`${p.pan ? 'Next to it' : 'On the left'} is a flask with a mark round its neck. Drag a card onto the flask's mouth and the card goes into the water in the flask, filled up to the mark.`);
      bits.push('The window beside the flask shows a small drop of what is in the flask, close up. Water molecules are small and faint. Every other disc or blob is one particle, and a disc with a + or − on it carries that charge. The same size of drop is shown every time, so more particles in the window means more crowded.');
      if (f.dials.fill) bits.push('The "Flask" dial swaps in a bigger or smaller flask, always filled to its mark.');
      if (f.dials.stock) bits.push('The "Stock poured in" dial sets how much of the stock card goes in before the flask is filled to its mark with water.');
      if (f.dials.solvent) bits.push('The "Liquid" dial changes what is in the flask: water, or an oil. A card that has been in the flask keeps a line for what the window showed.');
      if (p.showM) bits.push('The number under the window is the molarity of what is in the flask.');
      if (p.count) bits.push('The count under the window is every particle in the drop.');
      return bits.join(' ');
    }
  }
}, {
  sample: ['Sample cards', 'Each card is one sample: a powder, a liquid, or a flask someone has already made up. Drag a card onto the balance pan or the flask\'s mouth, and then onto a tray or the strip if you want to file it. A card that has been on the pan keeps its weight, and a card that has been in the flask keeps what the window showed.']
});

void SUBSTANCES;
