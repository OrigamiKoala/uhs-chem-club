/**
 * kits/mass.js — The mass kit: samples tipped into weight bins, a fulcrum, and a balance.
 *
 * WEIGHING IS THE WHOLE KIT. Tallow's last two benches (`q5-assay`, `q6-weigh`) and the Hopper
 * boss's last two phases are about what a pile of atoms WEIGHS and how many atoms that is. The kit
 * has three instruments, one rule: an instrument reports what a real one would, and never divides.
 *
 *   THE ASSAY (fixture `assay`). A sample card (`sample`, `props.bins [{mass, n}]`) is dropped in the
 *   chute slot and "Tip Sample" (the fixture's Run key) pours it: `assay.js` `planPour` says how many
 *   landed in each bin, the sample is stamped with what landed (`landed`), and the piles stand in the
 *   bins along a ruler of masses, drawn through `assay.js` `packBin` (every atom that landed is drawn;
 *   the tally and the heap are the same measurement). A BEAM lies under the piles on a FULCRUM the
 *   player slides along the ruler (the `pivot` dial). The beam tilts by the moment of the piles about
 *   the fulcrum, `sum n (m - pivot)`, and lies LEVEL exactly where the pivot is at the weighted average:
 *   the balance point of the piles IS the average mass, found by the hand and never printed.
 *   A `coder` fixture reads the element of the bin the `bin` dial names (the old "Read Code").
 *
 *   THE BALANCE (fixture `balance`). Two pans, each a container (`container:ID`) that holds pieces
 *   (a sealed crate, a drum) and poured contents. The beam tilts toward the heavier pan; level means
 *   equal weight. It never reports a number: the pans' totals are what was put there. A pan may carry
 *   an ATOM COUNTER (`props.counters`): a counter counts atoms, it does not weigh (a real one clicks
 *   as atoms pass). The right pan of `q5-assay` stage 6 may be a `mixer` instead: a dial that makes up
 *   a pile of a fixed number of light and heavy atoms, to be matched against a sealed canister.
 *   A `scale` fixture weighs what stands in one pan (`slot:ID` or `container:ID`), and its Run key
 *   drops a row on the recorder: the listed mass of one particle against what the pan reads.
 *
 *   UNITS. A balance's `props.unit` is `'u'` (atomic mass units: poured amounts and crates are
 *   COUNTS of particles, so a weight is count x mass of one) or `'g'` (grams: poured amounts and
 *   crates are grams, and the atom counter reads grams / molar mass x Avogadro's number). The masses
 *   of one particle are the listed masses the scope weighed (`atoms.js` `SCOPE_KINDS`) added up over
 *   a formula: the sum IS the formula mass, which is what `q6-weigh` stage 2 is about.
 *
 * The kit is the atom kit with these on top (an atom piece joins exactly as `atoms.js` says), so a
 * stage can build a molecule and carry it to a pan. NOTHING HERE DECIDES WHAT A STAGE WANTS: every
 * reading is derived from the pieces, the contents and the dials, and a stage's `check` reads them
 * through the functions exported here.
 */

import { registerKit } from './registry.js';
import { ATOMS_KIT, SCOPE_KINDS, symOfKind } from './atoms.js';
import { planPour, packBin } from '../../engine/assay.js';
import { PLATE_COLORS, plateText } from '../../engine/plates.js';
import { BUILTIN_TOOLS } from '../tools.js';

export const MASS_KIT_ID = 'mass';
const AMBER = PLATE_COLORS.amber;

/** The count a mole is named for. Printed on a counter; never a word until a stage has earned it. */
export const AVOGADRO = 6.02e23;

/* ------------------------------------------------------------------
   WHAT THINGS WEIGH
   ------------------------------------------------------------------ */

/** The listed mass of one atom of an element: the scope's own table, then the three the assay bench lists. */
const LISTED = Object.fromEntries(Object.keys(SCOPE_KINDS).map(k => [symOfKind(k), SCOPE_KINDS[k].mass]));
const MORE_LISTED = { B: 10.8, F: 19.0, Ne: 20.2 };
export function listedMass(sym) {
  const m = LISTED[sym] ?? MORE_LISTED[sym];
  if (m == null) throw new Error(`mass kit: no listed mass for "${sym}"`);
  return m;
}

/** What a particle of each species is made of. The mass of one is the listed masses added up. */
const FORMULA = {
  carbon: { C: 1 }, oxygen: { O: 1 }, hydrogen: { H: 1 }, neon: { Ne: 1 }, chlorine: { Cl: 1 }, fluorine: { F: 1 }, sodium: { Na: 1 },
  water: { H: 2, O: 1 }, methane: { C: 1, H: 4 }, 'carbon dioxide': { C: 1, O: 2 }
};
export function formulaOfSpecies(name) {
  const f = FORMULA[name];
  if (!f) throw new Error(`mass kit: no species "${name}"`);
  return f;
}
const round6 = v => Math.round(v * 1e6) / 1e6;
/** The mass of one particle of a species (a formula mass for a compound). */
export function speciesMass(name) {
  return round6(Object.entries(formulaOfSpecies(name)).reduce((m, [el, n]) => m + n * listedMass(el), 0));
}

/* ------------------------------------------------------------------
   READINGS (pure; a stage's check and both views read these)
   ------------------------------------------------------------------ */

const live = p => p && !p.hidden;
const pieceIn = (state, zone, kind) => Object.values(state.pieces).find(p => live(p) && p.zone === zone && (!kind || p.kind === kind)) || null;
const piecesAt = (state, zone) => Object.values(state.pieces).filter(p => live(p) && p.zone === zone);

/** The sample card standing in a slot (`'slot:chute'` or just `'chute'`), or null. */
export function sampleIn(state, slot) {
  return pieceIn(state, String(slot).includes(':') ? slot : `slot:${slot}`, 'sample');
}

/** A sample's bins as declared, lightest first. */
export function binsOf(sample) {
  return (sample?.props.bins || []).slice().sort((a, b) => a.mass - b.mass);
}

/** How many atoms a sample holds in all (the sealed canister's label says; the chute counts). */
export function countOfSample(sample) {
  return binsOf(sample).reduce((n, b) => n + b.n, 0);
}

/** What a sample weighs in all, in atomic mass units: the sum of what it holds. */
export function massOfSample(sample) {
  return binsOf(sample).reduce((m, b) => m + b.mass * b.n, 0);
}

/** The pour the planner made for a sample: `planPour`'s totals, bin by bin. */
export function pourOf(sample) {
  return planPour({ id: sample.id, bins: binsOf(sample) });
}

/**
 * The assay fixture's reading: the sample in the chute, whether it has been tipped, the piles that landed
 * (from the planner), the fulcrum, the moment of the piles about it and whether the beam lies level.
 * `average` is for a stage's check; no picture prints it.
 */
export function assayRead(state, fixtureId) {
  const f = state.fixtures[fixtureId];
  const sample = sampleIn(state, f.props.slot);
  // A fixture with no `pivot` dial has no beam yet (the first stages only tip and count).
  const dial = f.dials.pivot || null;
  if (!sample) return { sample: null, poured: false, bins: [], piles: [], pivot: dial ? dial.value : null, net: 0, level: false, average: null, total: 0, beam: Boolean(dial) };
  const bins = binsOf(sample);
  const poured = Boolean(sample.props.poured);
  const piles = poured ? sample.props.landed.slice() : bins.map(() => 0);
  const pivot = dial ? dial.value : null;
  const total = piles.reduce((a, n) => a + n, 0);
  const net = dial ? round6(bins.reduce((m, b, i) => m + piles[i] * (b.mass - pivot), 0)) : 0;
  const average = total ? bins.reduce((m, b, i) => m + piles[i] * b.mass, 0) / total : null;
  return { sample, poured, bins, piles, pivot, net, level: Boolean(dial) && poured && total > 0 && Math.abs(net) <= 1e-6 * total, average, total, beam: Boolean(dial) };
}

/** The mix a `mixer` fixture has made up: `heavy` of the heavy atom, the rest of the light, `total` in all. */
export function mixRead(state, mixerId) {
  const f = state.fixtures[mixerId];
  const total = f.props.total;
  const heavy = f.dials.heavy.value;
  const light = total - heavy;
  const mass = light * f.props.light.mass + heavy * f.props.heavy.mass;
  return { light, heavy, total, mass };
}

/** The contents a zone holds (a container's poured amounts), or {}. */
function contentsOf(state, zone) {
  if (!zone.startsWith('container:')) return {};
  return state.zones.containers[zone.slice(10)]?.contents || {};
}

/** How many particles a crate stands for, in a balance's unit, and what it weighs. */
function crateLoad(p, unit) {
  const species = p.props.species;
  const m = speciesMass(species);
  if (unit === 'g') {
    const g = p.props.grams ?? 0;
    return { species, grams: g, particles: g / m * AVOGADRO, weight: g, sealed: Boolean(p.props.sealed) };
  }
  const n = p.props.n ?? 0;
  return { species, particles: n, weight: n * m, sealed: Boolean(p.props.sealed) };
}

/**
 * What a pan holds: its weight in the balance's unit, and the particle count of an element ('H') or of
 * the particles themselves (`of` null). A pan is `'container:ID'`, `'slot:ID'`, or `{mix: mixerId}`.
 * Sealed crates weigh but are never counted (a counter cannot see through a gate shut).
 */
export function panLoad(state, pan, unit, of = null) {
  if (pan && typeof pan === 'object') {
    const mix = mixRead(state, pan.mix);
    return { weight: mix.mass, particles: mix.total, mix };
  }
  let weight = 0;
  let particles = 0;
  const per = species => (of ? (formulaOfSpecies(species)[of] || 0) : 1);
  for (const [what, amount] of Object.entries(contentsOf(state, pan))) {
    if (unit === 'g') { weight += amount; particles += amount / speciesMass(what) * AVOGADRO * per(what); }
    else { weight += amount * speciesMass(what); particles += amount * per(what); }
  }
  for (const p of piecesAt(state, pan)) {
    if (p.kind === 'crate') {
      const c = crateLoad(p, unit);
      weight += c.weight;
      if (!c.sealed) particles += c.particles * per(c.species);
    } else if (p.kind === 'sample') {
      weight += massOfSample(p);
    } else if (p.kind === 'atom') {
      weight += listedMass(p.props.el);
      particles += (!of || of === p.props.el) ? 1 : 0;
    }
  }
  return { weight: round6(weight), particles };
}

/**
 * The balance's reading: each pan's weight, which way the beam goes and whether it lies level. `lean` is
 * -1 when the left pan is heavier, +1 when the right is, 0 when level. A balance only compares.
 */
export function balanceRead(state, fixtureId) {
  const f = state.fixtures[fixtureId];
  const unit = f.props.unit || 'u';
  const L = panLoad(state, f.props.pans.L, unit, f.props.counters?.L?.of || null);
  const R = panLoad(state, f.props.pans.R, unit, f.props.counters?.R?.of || null);
  const scale = Math.max(L.weight, R.weight, 1e-9);
  const diff = R.weight - L.weight;
  const level = Math.abs(diff) <= 1e-9 * scale;
  return { unit, L, R, diff, level, lean: level ? 0 : (diff > 0 ? 1 : -1), tilt: level ? 0 : Math.max(-1, Math.min(1, diff / scale)) };
}

/** What a scale reads: the weight of what stands in its pan and the one crate there (if any). */
export function scaleRead(state, fixtureId) {
  const f = state.fixtures[fixtureId];
  const unit = f.props.unit || 'u';
  const load = panLoad(state, f.props.pan, unit, f.props.of || null);
  const crate = piecesAt(state, f.props.pan).find(p => p.kind === 'crate') || null;
  return { unit, weight: load.weight, particles: load.particles, crate, empty: load.weight === 0 };
}

/** The particles in a pan's counter, or null when the stage shows no counter there. */
export function counterOf(state, fixtureId, side) {
  const f = state.fixtures[fixtureId];
  const c = f.props.counters?.[side];
  if (!c) return null;
  return panLoad(state, f.props.pans[side], f.props.unit || 'u', c.of || null).particles;
}

/* ------------------------------------------------------------------
   PRINTING
   ------------------------------------------------------------------ */

const SUPER = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = n => String(n).split('').map(c => (c === '-' ? '⁻' : SUPER[Number(c)])).join('');

/** A big count the way a counter prints it: plain up to five figures, then `m.mm × 10ⁿ`. */
export function countText(n) {
  if (!Number.isFinite(n)) return '0';
  if (n < 1e5) return String(Math.round(n * 100) / 100);
  let e = Math.floor(Math.log10(n));
  let m = n / Math.pow(10, e);
  if (m.toFixed(2) === '10.00') { m = 1; e += 1; }
  return `${m.toFixed(2)} × 10${sup(e)}`;
}

const weightText = w => (Number.isInteger(w) ? String(w) : w.toFixed(1));

/* ------------------------------------------------------------------
   PIECES: SAMPLES AND CRATES (cards, painted by one function in both views)
   ------------------------------------------------------------------ */

export const SAMPLE_RECT = Object.freeze({ hw: 8.5, hh: 7.2 });
export const CRATE_RECT = Object.freeze({ hw: 8.5, hh: 7.2 });
export const CARD_R = 7.2;

function frame(ctx, x0, y0, w, h, fill, lit) {
  ctx.fillStyle = fill;
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = lit ? AMBER : PLATE_COLORS.dust;
  ctx.lineWidth = lit ? 2 : 1;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
  ctx.lineWidth = 1;
}

function fitted(ctx, text, x, y, maxW, o) {
  ctx.font = `${o.weight || 500} ${o.size}px "JetBrains Mono", "Quantico", monospace`;
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = o.color || PLATE_COLORS.text;
  ctx.fillText(text, x, y, maxW);
}

function paintSample(ctx, p, state, o) {
  const hw = SAMPLE_RECT.hw * o.sc;
  const hh = SAMPLE_RECT.hh * o.sc;
  const x0 = o.x - hw;
  const y0 = o.y - hh;
  const w = hw * 2;
  const h = hh * 2;
  frame(ctx, x0, y0, w, h, p.props.sealed ? '#1d1b17' : '#2a2620', o.lit);
  const small = Math.max(7, Math.round(h * 0.15));
  fitted(ctx, p.label, o.x, y0 + h * 0.16, w * 0.94, { size: Math.max(8, Math.round(h * 0.19)), weight: 700, color: PLATE_COLORS.text });
  if (p.props.note) fitted(ctx, p.props.note, o.x, y0 + h * 0.36, w * 0.94, { size: small, color: PLATE_COLORS.dust });
  if (p.props.poured && !p.props.sealed) {
    // What landed in each bin, a line a bin: the sample remembers its own tally.
    binsOf(p).forEach((b, i) => fitted(ctx, `${b.mass} x ${p.props.landed[i]}`, o.x, y0 + h * (0.58 + i * 0.19), w * 0.94, { size: small, weight: 700, color: PLATE_COLORS.phosphor }));
  } else if (p.props.sealed) {
    fitted(ctx, 'sealed', o.x, y0 + h * 0.62, w * 0.94, { size: small, color: PLATE_COLORS.dim });
  }
}

function paintCrate(ctx, p, state, o) {
  const hw = CRATE_RECT.hw * o.sc;
  const hh = CRATE_RECT.hh * o.sc;
  const x0 = o.x - hw;
  const y0 = o.y - hh;
  const w = hw * 2;
  const h = hh * 2;
  frame(ctx, x0, y0, w, h, '#1d1b17', o.lit);
  // The gate: a crate is shut, and the lid is the only thing a player sees of what is in it.
  ctx.strokeStyle = PLATE_COLORS.dim;
  ctx.beginPath();
  ctx.moveTo(x0 + 2, y0 + h * 0.42);
  ctx.lineTo(x0 + w - 2, y0 + h * 0.42);
  ctx.stroke();
  fitted(ctx, p.label, o.x, y0 + h * 0.22, w * 0.94, { size: Math.max(8, Math.round(h * 0.2)), weight: 700, color: PLATE_COLORS.text });
  if (p.props.note) fitted(ctx, p.props.note, o.x, y0 + h * 0.66, w * 0.94, { size: Math.max(7, Math.round(h * 0.16)), color: PLATE_COLORS.dust });
}

const PAINTERS = { sample: paintSample, crate: paintCrate };

function paintPiece(ctx, p, state, o) {
  const fn = PAINTERS[p.kind];
  if (fn) { fn(ctx, p, state, o); return true; }
  return ATOMS_KIT.paintPiece(ctx, p, state, o);
}

function printed(p, state) {
  if (PAINTERS[p.kind]) return String(p.label);
  return ATOMS_KIT.printed(p, state);
}

function faceKey(p, state) {
  if (p.kind === 'sample') return `${p.label}|${p.props.note || ''}|${p.props.sealed ? 1 : 0}|${p.props.poured ? 1 : 0}|${(p.props.landed || []).join()}`;
  if (p.kind === 'crate') return `${p.label}|${p.props.note || ''}`;
  return ATOMS_KIT.faceKey(p, state);
}

/* ------------------------------------------------------------------
   FIXTURES: PAINTING (flat; the built table paints the same picture on the plate)
   ------------------------------------------------------------------ */

/** A pile of dots standing on a base line `(x, y)` that is `wide` across: every atom that landed, drawn. */
function pile(ctx, x, y, wide, tall, count, slope = 0) {
  const { cells, r } = packBin(count, wide, tall);
  ctx.fillStyle = PLATE_COLORS.dust;
  for (const [dx, dy] of cells) {
    ctx.beginPath();
    ctx.arc(x + dx, y + dx * slope - dy, Math.max(0.8, r), 0, Math.PI * 2);
    ctx.fill();
  }
  return r;
}

/** The masses the ruler spans: the fulcrum's own range, else the bins' range with room at either end. */
function rulerOf(f, read) {
  if (f.dials.pivot) return { min: f.dials.pivot.min, max: f.dials.pivot.max };
  const ms = read.bins.length ? read.bins.map(x => x.mass) : [0, 1];
  const lo = Math.min(...ms);
  const hi = Math.max(...ms);
  const pad = Math.max(0.5, (hi - lo) * 0.35);
  return { min: lo - pad, max: hi + pad };
}

function paintAssay(ctx, f, state, b) {
  const sc = b.sc;
  const w = b.x1 - b.x0;
  const h = b.y1 - b.y0;
  const read = assayRead(state, f.id);
  const ruler = rulerOf(f, read);
  // The ruler runs the length of the fulcrum's own track, so the knob and the fulcrum are one thing.
  const xOf = m => b.x0 + 3 * sc + ((m - ruler.min) / (ruler.max - ruler.min)) * (w - 6 * sc);
  const beamY = b.y0 + h * 0.66;
  const size = Math.max(8, Math.round(2.3 * sc));
  if (!read.sample) {
    plateText(ctx, 'chute empty', b.x0 + 2 * sc, b.y0 + h * 0.36, { size, color: PLATE_COLORS.dim });
  }
  const px = read.beam ? xOf(read.pivot) : (b.x0 + b.x1) / 2;
  const span = ruler.max - ruler.min;
  const half = Math.max(1, read.total) * span * 0.5;
  const tilt = read.poured && read.beam ? Math.max(-1, Math.min(1, read.net / half)) : 0;
  const slope = Math.tan(tilt * 0.34);
  const yAt = x => beamY + (x - px) * slope;

  // The beam (a plain base line while there is no fulcrum), on its fulcrum.
  ctx.strokeStyle = read.level ? PLATE_COLORS.phosphor : (read.beam ? PLATE_COLORS.dust : PLATE_COLORS.rim);
  ctx.lineWidth = read.beam ? 2 : 1;
  ctx.beginPath();
  ctx.moveTo(b.x0 + 3 * sc, yAt(b.x0 + 3 * sc));
  ctx.lineTo(b.x1 - 3 * sc, yAt(b.x1 - 3 * sc));
  ctx.stroke();
  ctx.lineWidth = 1;
  if (read.beam) {
    ctx.fillStyle = PLATE_COLORS.steel;
    ctx.beginPath();
    ctx.moveTo(px, beamY);
    ctx.lineTo(px - 2.2 * sc, beamY + 4.2 * sc);
    ctx.lineTo(px + 2.2 * sc, beamY + 4.2 * sc);
    ctx.closePath();
    ctx.fill();
  }

  // The bins and their piles, standing on the beam at their masses, with the weight stencilled under each.
  const gap = read.bins.length > 1 ? Math.min(...read.bins.slice(1).map((bn, i) => xOf(bn.mass) - xOf(read.bins[i].mass))) : w * 0.3;
  const wide = Math.min(gap * 0.88, 13 * sc);
  const tall = h * 0.4;
  read.bins.forEach((bn, i) => {
    const x = xOf(bn.mass);
    if (read.poured) pile(ctx, x, yAt(x) - 1, wide, tall, read.piles[i], slope);
    ctx.strokeStyle = PLATE_COLORS.rim;
    ctx.strokeRect(Math.round(x - wide / 2) + 0.5, Math.round(yAt(x) - tall) + 0.5, Math.round(wide), Math.round(tall));
    plateText(ctx, String(bn.mass), x, beamY + 8.4 * sc + (i % 2) * 0, { size, align: 'center', weight: 700, color: PLATE_COLORS.dust });
    if (read.poured) plateText(ctx, String(read.piles[i]), x, yAt(x) - tall - 1.2 * sc, { size, align: 'center', color: PLATE_COLORS.text });
  });
  if (read.level) plateText(ctx, 'LEVEL', b.x0 + 2 * sc, b.y1 - 1.6 * sc, { size, weight: 700, color: PLATE_COLORS.phosphor });
}

function paintCoder(ctx, f, state, b) {
  const sc = b.sc;
  const size = Math.max(8, Math.round(2.3 * sc));
  const sample = sampleIn(state, state.fixtures[f.props.assay].props.slot);
  const read = sample?.props.read || {};
  const bins = binsOf(sample);
  if (!sample || !sample.props.poured) {
    plateText(ctx, 'nothing tipped', b.x0 + 2 * sc, b.y0 + 12 * sc, { size, color: PLATE_COLORS.dim });
    return;
  }
  bins.forEach((bn, i) => {
    const code = read[i];
    plateText(ctx, code ? `bin ${i + 1}: ${code}` : `bin ${i + 1}`, b.x0 + 2 * sc, b.y0 + (11.4 + i * 3.2) * sc, { size, weight: code ? 700 : 500, color: code ? PLATE_COLORS.phosphor : PLATE_COLORS.dim });
  });
}

/** What stands on a pan, as a block whose height is its weight against the heaviest pan: a picture, never a reading. */
function loadBlock(ctx, x, y, share, sc) {
  if (share <= 0) return;
  const h = Math.max(1.2, share * 6 * sc);
  ctx.fillStyle = PLATE_COLORS.dim;
  ctx.fillRect(x - 3.2 * sc, y - h, 6.4 * sc, h);
  ctx.strokeStyle = PLATE_COLORS.dust;
  ctx.strokeRect(Math.round(x - 3.2 * sc) + 0.5, Math.round(y - h) + 0.5, Math.round(6.4 * sc), Math.round(h));
}

function beamPicture(ctx, b, y0, tilt, level, ends) {
  const sc = b.sc;
  const cx = (b.x0 + b.x1) / 2;
  const lift = tilt * 3.2 * sc;
  ctx.strokeStyle = level ? PLATE_COLORS.phosphor : PLATE_COLORS.dust;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ends.l, y0 - lift);
  ctx.lineTo(ends.r, y0 + lift);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = PLATE_COLORS.steel;
  ctx.beginPath();
  ctx.moveTo(cx, y0);
  ctx.lineTo(cx - 2.4 * sc, y0 + 5 * sc);
  ctx.lineTo(cx + 2.4 * sc, y0 + 5 * sc);
  ctx.closePath();
  ctx.fill();
  // The pans hang from the ends of the beam.
  ctx.strokeStyle = PLATE_COLORS.steel;
  for (const [x, y] of [[ends.l, y0 - lift], [ends.r, y0 + lift]]) {
    ctx.beginPath();
    ctx.moveTo(x - 4 * sc, y + 4 * sc);
    ctx.lineTo(x, y);
    ctx.lineTo(x + 4 * sc, y + 4 * sc);
    ctx.moveTo(x - 4 * sc, y + 4 * sc);
    ctx.lineTo(x + 4 * sc, y + 4 * sc);
    ctx.stroke();
  }
}

function paintBalance(ctx, f, state, b) {
  const sc = b.sc;
  const w = b.x1 - b.x0;
  const h = b.y1 - b.y0;
  const read = balanceRead(state, f.id);
  const size = Math.max(8, Math.round(2.3 * sc));
  const y0 = b.y0 + h * 0.42;
  const ends = { l: b.x0 + w * 0.16, r: b.x1 - w * 0.16 };
  beamPicture(ctx, b, y0, read.tilt, read.level, ends);
  const heavy = Math.max(read.L.weight, read.R.weight, 1e-9);
  const lift = read.tilt * 3.2 * sc;
  loadBlock(ctx, ends.l, y0 - lift, read.L.weight / heavy, sc);
  loadBlock(ctx, ends.r, y0 + lift, read.R.weight / heavy, sc);
  if (read.level && (read.L.weight > 0 || read.R.weight > 0)) plateText(ctx, 'LEVEL', (b.x0 + b.x1) / 2, b.y1 - 1.8 * sc, { size, align: 'center', weight: 700, color: PLATE_COLORS.phosphor });
  // The atom counters, where the stage fits one: a count of atoms, and nothing else.
  for (const side of ['L', 'R']) {
    const c = f.props.counters?.[side];
    if (!c) continue;
    const text = `${c.label || 'ATOMS'} ${countText(counterOf(state, f.id, side))}`;
    plateText(ctx, text, side === 'L' ? b.x0 + 2 * sc : b.x1 - 2 * sc, b.y0 + h * 0.88, { size: Math.max(7, Math.round(2.1 * sc)), align: side === 'L' ? 'left' : 'right', weight: 700, color: PLATE_COLORS.text });
  }
  if (f.props.pans.R && typeof f.props.pans.R === 'object') {
    // The made-up pile on the right pan: every atom of it, light and heavy.
    const mix = read.R.mix;
    const px = b.x1 - w * 0.16;
    const yy = y0 + read.tilt * 3.2 * sc - 1;
    pile(ctx, px - 3 * sc, yy, 5.4 * sc, 5 * sc, mix.light);
    pile(ctx, px + 3 * sc, yy, 5.4 * sc, 5 * sc, mix.heavy);
  }
}

function paintScale(ctx, f, state, b) {
  const sc = b.sc;
  const h = b.y1 - b.y0;
  const read = scaleRead(state, f.id);
  const size = Math.max(8, Math.round(2.4 * sc));
  const unit = read.unit === 'g' ? 'g' : '';
  plateText(ctx, read.empty ? 'WEIGHT 0' : `WEIGHT ${weightText(read.weight)}${unit ? ` ${unit}` : ''}`, b.x0 + 2 * sc, b.y0 + h * 0.5, { size, weight: 700, color: read.empty ? PLATE_COLORS.dim : PLATE_COLORS.text });
  if (f.props.counter) {
    plateText(ctx, `${f.props.counter.label || 'ATOMS'} ${read.empty || read.crate?.props.sealed ? '—' : countText(read.particles)}`, b.x0 + 2 * sc, b.y0 + h * 0.74, { size: Math.max(7, Math.round(2.1 * sc)), weight: 700, color: PLATE_COLORS.dust });
  }
}

function paintFixture(ctx, f, state, b) {
  if (f.kind === 'assay') paintAssay(ctx, f, state, b);
  else if (f.kind === 'coder') paintCoder(ctx, f, state, b);
  else if (f.kind === 'balance') paintBalance(ctx, f, state, b);
  else if (f.kind === 'scale') paintScale(ctx, f, state, b);
  else if (f.kind === 'mixer' || f.kind === 'tally') paintMixer(ctx, f, state, b);
  else ATOMS_KIT.paintFixture?.(ctx, f, state, b);
}

function paintMixer(ctx, f, state, b) {
  if (f.kind !== 'mixer') return;
  const sc = b.sc;
  const mix = mixRead(state, f.id);
  plateText(ctx, `${mix.light} x ${f.props.light.mass}   ${mix.heavy} x ${f.props.heavy.mass}`, b.x0 + 2 * sc, b.y1 - 2 * sc, { size: Math.max(7, Math.round(2.1 * sc)), color: PLATE_COLORS.dust });
}

/* ------------------------------------------------------------------
   RUNS
   ------------------------------------------------------------------ */

/** "Tip Sample": the planner pours it, and the sample remembers what landed. */
function tip(state, f) {
  const sample = sampleIn(state, f.props.slot);
  if (!sample) return { noop: 'There is no sample in the chute.' };
  if (sample.props.sealed) return { noop: 'A sealed sample cannot be tipped.' };
  if (sample.props.poured) return { noop: 'That sample has been tipped already.' };
  return { stamp: { [sample.id]: { poured: true, landed: pourOf(sample).totals } } };
}

/** "Read Code": the element of the bin the dial names, written on the sample. */
function readCode(state, f) {
  const sample = sampleIn(state, state.fixtures[f.props.assay].props.slot);
  if (!sample || !sample.props.poured) return { noop: 'Tip a sample into the chute first.' };
  const i = f.dials.bin.value - 1;
  if (!sample.props.code) return { noop: 'No code comes back from this sample.' };
  return { stamp: { [sample.id]: { read: { ...(sample.props.read || {}), [i]: sample.props.code } } } };
}

/** "Weigh": a row for the strip, the listed mass of one particle against what the pan reads. */
function weigh(state, f) {
  if (f.noRun) return null;
  const read = scaleRead(state, f.id);
  if (!read.crate) return { noop: 'There is nothing on the scale to weigh.' };
  return { x: speciesMass(read.crate.props.species), y: read.weight, label: read.crate.label };
}

function run(state, fixtureId) {
  const f = state.fixtures[fixtureId];
  if (f?.kind === 'assay') return tip(state, f);
  if (f?.kind === 'coder') return readCode(state, f);
  if (f?.kind === 'scale') return weigh(state, f);
  return ATOMS_KIT.run(state, fixtureId);
}

function planJoin(a, b, state) {
  if (a.kind === 'atom' && b.kind === 'atom') return ATOMS_KIT.planJoin(a, b, state);
  return { holds: false, reason: 'Those two do not join.' };
}

export const MASS_KIT = {
  ...ATOMS_KIT,
  id: MASS_KIT_ID,
  kinds: {
    ...ATOMS_KIT.kinds,
    sample: { r: CARD_R, nojoin: true, rect: SAMPLE_RECT },
    crate: { r: CARD_R, nojoin: true, rect: CRATE_RECT }
  },
  planJoin,
  run,
  tools: {
    // The straightedge lies across the readings a scale took: the probe weighs two crates and lays it.
    straightedge: {
      ...BUILTIN_TOOLS.straightedge,
      probe(state) {
        const f = Object.values(state.fixtures).find(x => x.kind === 'scale' && !x.noRun);
        const crates = Object.values(state.pieces).filter(p => p.kind === 'crate' && !p.hidden).slice(0, 2);
        const out = [];
        let rows = state.recorder.rows.length;
        if (rows < 2 && f) {
          for (const c of crates.slice(0, 2 - rows)) { out.push({ place: { piece: c.id, to: f.props.pan } }, { run: f.id }); rows++; }
        }
        out.push({ lay: { kind: 'straightedge', through: [0, rows - 1] } });
        return out;
      }
    }
  },
  paintPiece,
  printed,
  faceKey,
  paintFixture,
  /** One pour gesture: the scoop a stage hands out (`table.opts.steps[what]`, else `table.opts.step`, else 1). */
  pourStep(state, from, to, what) {
    return state.opts?.steps?.[what] ?? state.opts?.step ?? 1;
  }
};

registerKit(MASS_KIT);

/* ------------------------------------------------------------------
   TABLE FURNITURE
   ------------------------------------------------------------------ */

/** A mass table is the card table's size (150 x 72): a balance, its pans and a row of trays need the width, and a piece is still 28 px or more on a phone. */
export const MASS_BOUNDS = Object.freeze({ w: 150, h: 72 });
/** Where the paper strip parks on a mass table that never prints on it. */
export const MASS_RECORDER = Object.freeze({ at: { x: 149.5, y: 71.5 }, size: { w: 1, h: 1 } });

/** A stage's declaration with the mass kit's defaults: the kit, the bounds, a parked recorder strip. */
export function massTable(spec) {
  return { kit: MASS_KIT_ID, bounds: { ...MASS_BOUNDS }, tools: [], recorder: MASS_RECORDER, ...spec };
}

/** A crate or a drum: a rect piece standing in a pan, sealed or open (`props {species, n | grams, sealed?, note?}`). */
export const crate = (id, label, at, props) => ({ id, kind: 'crate', label, at, props });

const PANS_Y = 48;
const pan = (id, label, at, extra = {}) => ({ id, label, at, size: { w: 30, h: 24 }, cell: 30, ...extra });

/**
 * The two-pan table `q6-weigh` and the Hopper's last phase share: the balance across the top, a pan under each
 * end of its beam with the reference crate fixed in the left one, and the drum between them that pours into the
 * right one (`steps` is how much one pour gesture moves, by what is poured).
 */
export function balanceTable({ unit, counters = null, refCrate, drum, steps, capacity, balanceAt = { x: 75, y: 16 }, balanceW = 130, extra = {} }) {
  return massTable({
    pieces: [{ ...refCrate, fixed: true, zone: 'container:pan-l' }, ...(extra.pieces || [])],
    zones: {
      containers: [
        pan('pan-l', refCrate.props.sealed ? 'Crate pan' : 'Reference pan', { x: balanceAt.x - balanceW * 0.34, y: PANS_Y }),
        pan('pan-r', 'Pour pan', { x: balanceAt.x + balanceW * 0.34, y: PANS_Y }, { capacity }),
        { id: 'drum', label: drum.label, at: { x: balanceAt.x, y: PANS_Y }, size: { w: 34, h: 24 }, capacity: drum.amount, contents: { [drum.what]: drum.amount } }
      ],
      ...(extra.zones || {})
    },
    fixtures: [
      {
        id: 'balance', kind: 'balance', label: 'Balance', at: balanceAt, size: { w: balanceW, h: 28 }, noRun: true,
        props: { unit, pans: { L: 'container:pan-l', R: 'container:pan-r' }, ...(counters ? { counters } : {}) }
      },
      ...(extra.fixtures || [])
    ],
    opts: { steps },
    ...(extra.fetch ? { fetch: extra.fetch } : {}),
    ...(extra.recorder ? { recorder: extra.recorder } : {})
  });
}

/** `times` pours of `amount` from the drum to the right pan, as a script. */
export const pourSteps = (what, amount, times, from = 'drum', to = 'pan-r') =>
  Array.from({ length: times }, () => ({ pour: { from, to, what, amount } }));

export { piecesIn } from './atoms.js';
