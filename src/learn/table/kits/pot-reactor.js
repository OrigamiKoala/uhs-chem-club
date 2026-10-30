/**
 * kits/pot-reactor.js — Kettle's reaction pot, its jars and its balance (bench `q6-stoich`, and the pot every later bench reuses).
 *
 * THE JAR (piece `jar`): a labelled jar of one species. A reagent jar prints what it holds and how much (the amount fed is the
 * experiment's setting, so it is printed). A CATCH jar starts empty; the pot's key fills it, and a filled jar prints only its name:
 * how much it holds is read by the BALANCE, never printed, so a product's mass is something you measure.
 *
 * THE REACTOR (fixture `reactor`): seats for up to two reagent jars (or a dial that pours a set amount of one reagent), reagents it
 * supplies in plenty (printed on the pot), a seat for the catch jar, a key, and a window of particles (one disc per `unitMol` moles)
 * showing what is in the pot before the key and what is in it after. The pot's chemistry is `reactdata.js` `reactPlan` and nothing
 * else: the smallest ratio of moles fed to coefficient sets how far the reaction goes. A furnace may lose some product
 * (`yieldFrac`), and a gas product may be shown filling a syringe (`gas`).
 *
 * THE BALANCE (fixture `weigh`): a pan (a seat) and a reading in grams. The jar's own weight is left out.
 *
 * A THIN WRAPPER over `engine/reactdata.js`; it authors nothing.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { addTourText } from '../tour.js';
import { registerFixture, registerPiece } from './pot-registry.js';
import { frameOf, topOf, say, slab } from './pot-draw.js';
import { reactorRead, weighRead, nameOfSpecies, inkOfSpecies } from './pot-read.js';
import { pretty, molarMass } from '../../engine/reactdata.js';
import { contentTop } from './heat-draw.js';

const AMBER = PLATE_COLORS.amber;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;

/* ------------------------------------------------------------------
   THE JAR
   ------------------------------------------------------------------ */

export const JAR_RECT = Object.freeze({ hw: 8.5, hh: 6.6 });

/**
 * A jar. `species` is a formula (`H2`, `Fe2O3`); give its `grams` or its `mol` (`pure`: the share of the grams that is that species, for a sample that is not pure); `shown` is the amount line printed on it (a reagent's
 * setting). A catch jar is `jar(id, '', at, { catchFor: 'H2O' })`: empty until the pot's key fills it.
 */
export const jar = (id, label, at, { species = null, grams = null, mol = null, pure = null, shown = null, catchFor = null } = {}, extra = {}) => ({
  id, kind: 'jar', label, at, props: { ...(species ? { species } : {}), ...(grams != null ? { grams } : {}), ...(mol != null ? { mol } : {}), ...(pure != null ? { pure } : {}), ...(shown ? { shown } : {}), ...(catchFor ? { catchFor, empty: true } : {}) }, ...extra
});

function paintJar(ctx, p, state, o) {
  const box = slab(ctx, o, JAR_RECT, '#1d1a16');
  const sc = o.sc;
  const pr = p.props;
  const empty = pr.empty && !pr.filled;
  const f = pr.species;
  // The body: a glass with a lid band; filled to a level in the species' ink, or left bare.
  const bx = o.x - 3.4 * sc; const by = box.y0 + 1.6 * sc; const bw = 6.8 * sc; const bh = 4.4 * sc;
  ctx.strokeStyle = DUST; ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(bx) + 0.5, Math.round(by) + 0.5, Math.round(bw), Math.round(bh));
  if (!empty && f) { ctx.fillStyle = inkOfSpecies(f); ctx.globalAlpha = 0.65; ctx.fillRect(bx + 1, by + bh * 0.35, bw - 2, bh * 0.65 - 1); ctx.globalAlpha = 1; }
  ctx.fillStyle = STEEL; ctx.fillRect(bx - 0.4 * sc, by - 0.9 * sc, bw + 0.8 * sc, 0.9 * sc);
  const size = Math.max(6.2, 1.95 * sc);
  const name = p.label || (f ? nameOfSpecies(f) : '');
  let y = box.y0 + box.h - 5.1 * sc;
  if (name) say(ctx, name, o.x, y, size, { align: 'center', weight: 700, maxW: box.w - 1.4 * sc });
  y += 2.5 * sc;
  const line = pr.shown ?? (f && !empty ? pretty(f) : '');
  if (line) say(ctx, line, o.x, y, Math.max(5.8, 1.8 * sc), { align: 'center', color: pr.shown ? AMBER : DUST, weight: pr.shown ? 700 : 500, maxW: box.w - 1.4 * sc });
}

registerPiece('jar', {
  kind: { r: 7, rect: JAR_RECT, nojoin: true },
  paint: paintJar,
  faceKey: p => `jar|${p.label}|${p.props.species ?? ''}|${p.props.shown ?? ''}|${p.props.filled ? 1 : 0}|${p.props.empty ? 1 : 0}`,
  printed: p => String(p.label || p.props.species || '')
});

/* ------------------------------------------------------------------
   THE REACTOR
   ------------------------------------------------------------------ */

const SEAT = { w: 18, h: 13 };

/**
 * The pot. `eq` is the balanced equation (`'2 H2 + O2 -> 2 H2O'`). `seats` is how many reagent seats it has (0 to 2); `pour` is
 * `{ species, unit: 'g'|'mol', list }` for a dial that pours a set amount of one reagent instead; `plenty` lists reagents it supplies
 * without limit (printed on the pot); `out` is the formula the catch jar collects (omit for no catch jar); `unitMol` is the moles one
 * disc stands for; `window` false leaves the particles off; `yieldFrac` the share of the product the furnace keeps; `gas` draws a
 * syringe `{ species, tC, atm, maxL }`. Returns the fixture, its seat slots and its size (stand the slots where it says).
 */
export function reactorFixture(id, at, o = {}) {
  const { eq, seats = 0, pour = null, plenty = [], out = null, unitMol = 1, window = true, yieldFrac = 1, gas = null, title = 'Pot', runLabel = 'Run', w = 84, pourLabel = 'Fed' } = o;
  const dials = {};
  if (pour) dials.pour = { min: 1, max: pour.list.length, step: 1, value: pour.start ?? 1, label: pourLabel, labels: pour.list.map(v => `${v} ${pour.unit}`) };
  const nd = Object.keys(dials).length;
  const top = contentTop(nd);
  const seatH = seats || out ? 16.4 : 2.4;
  const h = Math.round((top + seatH + (window || gas ? (seats || out ? 19 : 27) : 10.6) + 7) * 10) / 10;
  const x0 = at.x - w / 2;
  const y0 = at.y - h / 2;
  const slotY = y0 + top + 7.5;
  const slots = [];
  const ins = [];
  for (let i = 0; i < seats; i++) {
    const sid = `${id}.in${i + 1}`;
    ins.push(sid);
    slots.push({ id: sid, label: ' ', at: { x: x0 + 11 + i * (SEAT.w + 3), y: slotY }, size: { ...SEAT } });
  }
  let outId = null;
  if (out) {
    outId = `${id}.out`;
    slots.push({ id: outId, label: ' ', at: { x: x0 + w - 11, y: slotY }, size: { ...SEAT } });
  }
  return {
    fixture: {
      id, kind: 'reactor', label: title, at: { ...at }, size: { w, h }, dials, runLabel,
      props: { backdrop: true, eq, ins, out: outId, outSpecies: out, pour: pour ? { ...pour, label: pourLabel } : null, plenty, unitMol, window, yieldFrac, gas, top, panelTop: Math.round((top + seatH) * 10) / 10 }
    },
    slots, ins, outSlot: outId, size: { w, h }
  };
}

const DISC_MAX = 12;

/** One row of discs: a species' name and as many discs as it has `unitMol` units of moles. */
function row(ctx, F, label, mol, unitMol, ink, x0, x1, y, size) {
  say(ctx, label, F.x(x0), F.y(y), size, { color: DUST, weight: 700 });
  const n = Math.round(mol / unitMol);
  const r = F.len(0.95);
  const step = F.len(Math.min(2.6, (x1 - x0 - 9.5) / DISC_MAX));
  ctx.fillStyle = ink;
  for (let i = 0; i < Math.min(n, DISC_MAX); i++) {
    ctx.beginPath(); ctx.arc(F.x(x0 + 9.4) + i * step + r, F.y(y), r, 0, Math.PI * 2); ctx.fill();
  }
  if (n > DISC_MAX) say(ctx, `+${n - DISC_MAX}`, F.x(x1), F.y(y), size, { align: 'right', color: DIM });
}

function paintReactor(ctx, f, state, b) {
  const F = frameOf(b);
  const r = reactorRead(state, f.id);
  const p = f.props;
  const top = topOf(f, b.lay);
  const px = 2.5; const pw = f.size.w - 5; const py = p.panelTop - 1.4 + 1.4; const ph = f.size.h - py - 7;
  // The pot's glass.
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(px), F.y(py), F.len(pw), F.len(ph));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(px)) + 0.5, Math.round(F.y(py)) + 0.5, Math.round(F.len(pw)), Math.round(F.len(ph)));
  const size = F.size(2.3, 6.5);
  // What it supplies on its own.
  const supplied = p.plenty.length ? `SUPPLIED: ${p.plenty.map(pretty).join(', ')}` : '';
  if (supplied) say(ctx, supplied, F.x(px + 1.5), F.y(py + ph - 1.8), F.size(1.9, 5.8), { color: DIM });
  if (p.gas) {
    // A syringe: the barrel stands as long as the gas fills, between 0 and its top mark.
    const gx = px + 3; const gw = pw - 8; const gy = py + ph * 0.5 - 2.2; const gh = 4.4;
    ctx.strokeStyle = DUST; ctx.strokeRect(Math.round(F.x(gx)) + 0.5, Math.round(F.y(gy)) + 0.5, Math.round(F.len(gw)), Math.round(F.len(gh)));
    const L = r.ran && r.gas ? r.gas.L : 0;
    ctx.fillStyle = inkOfSpecies(p.gas.species); ctx.globalAlpha = 0.7;
    ctx.fillRect(F.x(gx) + 1, F.y(gy) + 1, Math.max(0, F.len(gw * Math.min(1, L / p.gas.maxL)) - 2), F.len(gh) - 2); ctx.globalAlpha = 1;
    for (let t = 0; t <= p.gas.maxL; t += 1) {
      const tx = F.x(gx + gw * (t / p.gas.maxL));
      ctx.strokeStyle = DIM; ctx.beginPath(); ctx.moveTo(tx, F.y(gy + gh)); ctx.lineTo(tx, F.y(gy + gh + 1)); ctx.stroke();
      say(ctx, String(t), tx, F.y(gy + gh + 3), F.size(1.9, 6), { align: 'center', color: DIM });
    }
    say(ctx, 'litres', F.x(gx + gw), F.y(gy - 2.2), F.size(1.9, 6), { align: 'right', color: DIM });
    say(ctx, r.ran && r.gas ? `${r.gas.L.toFixed(2)} L` : 'not run', F.x(gx), F.y(gy - 2.2), F.size(2.6, 6.5), { color: r.ran ? AMBER : DIM, weight: 700 });
    say(ctx, `${pretty(p.gas.species)} collected at ${p.gas.tC} °C, ${p.gas.atm.toFixed(2)} atm`, F.x(px + 1.5), F.y(py + ph - 1.8), F.size(1.9, 5.8), { color: DIM, maxW: F.len(pw - 3) });
    return;
  }
  if (!p.window) {
    say(ctx, r.ran ? 'DONE' : r.fed ? 'READY' : 'EMPTY', F.x(px + pw / 2), F.y(py + ph / 2 - 1.2), F.size(3, 7.5), { align: 'center', color: r.ran ? AMBER : DIM, weight: 700 });
    return;
  }
  // Before on the left, after on the right.
  const midx = px + pw / 2;
  ctx.strokeStyle = STEEL; ctx.beginPath(); ctx.moveTo(F.x(midx), F.y(py + 1)); ctx.lineTo(F.x(midx), F.y(py + ph - 1)); ctx.stroke();
  say(ctx, 'BEFORE', F.x(px + 1.5), F.y(py + 2.1), F.size(2.1, 6), { color: DIM });
  say(ctx, 'AFTER', F.x(midx + 1.5), F.y(py + 2.1), F.size(2.1, 6), { color: DIM });
  const left = Object.entries(r.feeds);
  left.forEach(([sp, mol], i) => row(ctx, F, pretty(sp), mol, p.unitMol, inkOfSpecies(sp), px + 1.5, midx - 1.5, py + 6.4 + i * 6, size));
  if (r.ran && r.plan) {
    const right = [
      ...Object.entries(r.plan.left).filter(([, mol]) => mol > 1e-9),
      ...Object.entries(r.plan.made)
    ];
    right.forEach(([sp, mol], i) => row(ctx, F, pretty(sp), mol, p.unitMol, inkOfSpecies(sp), midx + 1.5, px + pw - 1.5, py + 6.4 + i * 6, size));
  } else if (!r.ran) {
    say(ctx, r.fed ? 'press Run' : 'nothing fed', F.x(midx + pw / 4), F.y(py + ph / 2), F.size(2.1, 6), { align: 'center', color: DIM });
  }
  say(ctx, `one disc is ${p.unitMol} mol`, F.x(px + pw - 1.5), F.y(py + ph - 1.8), F.size(1.8, 5.6), { align: 'right', color: DIM });
}

/** The key: a catch jar (if the pot has one) is filled; every run is filed under its set-up so the pot knows it has been run. */
function runReactor(state, fid) {
  const r = reactorRead(state, fid);
  const p = r.f.props;
  if (!r.fed) return { noop: 'Nothing is fed to the pot yet.' };
  if (p.out && !r.outJar) return { noop: 'Put an empty jar under the pot to catch what is made.' };
  const row = { x: Math.round(Object.values(r.feeds).reduce((a, b) => a + b, 0) * 1e6) / 1e6, y: Math.round(r.outMol * 1e6) / 1e6, label: r.sig };
  if (p.out) {
    return { ...row, stamp: { [r.outJar.id]: { species: r.outSpecies, grams: r.outGrams, filled: true, empty: false } } };
  }
  return row;
}

registerFixture('reactor', { paint: paintReactor, run: runReactor });

/* ------------------------------------------------------------------
   THE BALANCE
   ------------------------------------------------------------------ */

/** A balance with a pan (a seat). Returns the fixture, its slot and its size. */
export function weighFixture(id, at, { title = 'Balance', w = 34, digits = 1 } = {}) {
  const top = 10;
  const h = Math.round((top + 26) * 10) / 10;
  const slotId = `${id}.pan`;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  return {
    fixture: { id, kind: 'weigh', label: title, at: { ...at }, size: { w, h }, dials: {}, noRun: true, props: { backdrop: true, slot: slotId, digits } },
    slot: { id: slotId, label: ' ', at: { x: x0 + w / 2, y: y0 + top + 10.5 }, size: { ...SEAT } },
    slotId, size: { w, h }
  };
}

function paintWeigh(ctx, f, state, b) {
  const F = frameOf(b);
  const r = weighRead(state, f.id);
  const w = f.size.w;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(3), F.y(5.4), F.len(w - 6), F.len(6.4));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(3)) + 0.5, Math.round(F.y(5.4)) + 0.5, Math.round(F.len(w - 6)), Math.round(F.len(6.4)));
  say(ctx, r.item ? `${r.grams.toFixed(f.props.digits ?? 1)} g` : '— g', F.x(w - 4.5), F.y(8.7), F.size(3.4, 8), { align: 'right', color: r.item ? AMBER : DIM, weight: 700 });
  say(ctx, 'jar weight left out', F.x(w / 2), F.y(f.size.h - 2.2), F.size(1.8, 5.6), { align: 'center', color: DIM });
}

registerFixture('weigh', { paint: paintWeigh });

/* ------------------------------------------------------------------
   TOUR WORDS
   ------------------------------------------------------------------ */

const REACTOR_TEXT = f => {
  const p = f.props;
  const bits = [];
  if (p.ins?.length) bits.push('Drag a jar into a seat at the top left. What is in the jar is what the pot is fed.');
  if (p.pour) bits.push(`The "${p.pour.label || 'Fed'}" dial sets how much of the ${nameOfSpecies(p.pour.species).toLowerCase()} is poured in.`);
  if (p.plenty?.length) bits.push(`The pot supplies ${p.plenty.map(s => nameOfSpecies(s).toLowerCase()).join(' and ')} on its own, as much as is needed.`);
  if (p.out) bits.push('Put an empty jar in the seat at the top right to catch what is made.');
  bits.push('Press "Run" to start the reaction.');
  if (p.gas) bits.push('The syringe fills with the gas that is made, and its top scale reads in litres.');
  else if (p.window) bits.push('The window shows the particles before the reaction on the left and after it on the right, one disc for each unit it says.');
  return bits.join(' ');
};

addTourText({
  'pot:reactor': { title: 'Pot', dials: false, text: REACTOR_TEXT },
  'pot:weigh': { title: 'Balance', text: 'Drag a jar onto the pan to read how much is in it, in grams. The weight of the jar itself is left out.' }
}, {
  jar: ['Jars', 'Each jar holds one substance. A jar that says an amount holds that much. An empty jar starts with nothing, and fills when the pot makes something. Drag a jar into a seat; to find out how much a filled jar holds, put it on the balance.']
});

export { molarMass };
