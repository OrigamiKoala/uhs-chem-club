/**
 * kits/atoms.js — The atom kit: particles, atoms and what holds them.
 *
 * ONE KIT, TWO SCALES, ONE SET OF RULES.
 *
 *   PARTICLE SCALE (Tallow `q2-core`): protons, neutrons and electrons are pieces you
 *   drag. A nucleus is built, or given as one fixed lump; electrons go onto shell
 *   trays; a gauge fixture reads the net charge off whatever is on the table.
 *
 *   BOND SCALE (Tallow `q1-grain` s5 and s6, and Ligar `q1-joins` and `q4-dots` in T1b):
 *   `atom` pieces. Dropping one on another ASKS THE PLANNER what happens. Nothing here
 *   decides an outcome. A join is `joinbench.js` `planJoin` (the join bench's own pure
 *   planner), read against the atoms' CURRENT shells, which are derived from the
 *   links that already stand; a drawing of pairs is `lewis.js` `planLewis`. A pair that
 *   holds stays; a pair that does not (a full shell, two metals) drifts apart on release
 *   and the planner's reason is shown. Any join may be attempted (plan §2.3).
 *
 * THE BOND-SCALE API T1b BUILDS ON
 *   piece kind `atom`, `props {el: 'Na'}`; optional `props.shells` (a prefilled stack),
 *   `props.mask` (the symbol is withheld, the face is only a tint), `props.lone`, `props.dots`
 *   (electrons drawn on it, for the Lewis reading). `state.opts.words` is 'plain' (no shell
 *   talk in a reason) or 'shells'; `state.opts.shells` draws the outer electrons on a face.
 *   A link is `{type: 'transfer'|'share', giver, moved, pairs, a, b}`:
 *     transfer  `giver` (an atom id) hands `moved` electrons to the other; both end charged
 *     share     `pairs` shared pairs sit between them (1 single, 2 double, 3 triple)
 *   Readings, all DERIVED from the structure so a split undoes a join by itself:
 *     readPiece(id, state)      {shells, outer, cap, room, full, lamp ('room'|'full'|'over'), charge}
 *     chargeOf(ids, state)      net charge of a cluster (the charge needle)
 *     closureOf(ids, state)     {closed, open}: has every atom nothing left to give or take (MgCl is open, MgCl₂ closed)
 *     formulaOf(ids, state)     'H₂O', 'MgCl₂', 'NaCl' ...
 *     countsOf(ids, state)      {H: 2, O: 1}
 *     lewisOf(ids, state)       `planLewis` of the cluster as drawn (bonds from the links)
 *     moleculesOf(state)        every cluster of two or more atoms off the scratch corner
 *   `SCRATCH` and `scratchCorner()` give every atom-kit table its play corner.
 *
 * THE OTHER PIECES (the Tallow benches): dish, lens, cutter, shaker (the sampler scope's
 * three tools, laid on a dish by dragging), nucleus, specimen, detector, card, and the
 * fixtures `scope` (a power dial), `needle`, `beam`, `tester` and `reader`.
 *
 * The scope's picture on a lens or a dish is `scope.js` `drawScopeField` itself; the cut
 * and the shake are its `planCut` / `planSettle`. The beam is `corebench.js` `planBeam`.
 */

import { registerKit } from './registry.js';
import { planJoin as planPair, shellPlan } from '../../engine/joinbench.js';
import { VALENCE, planLewis, linkKey as lewisKey } from '../../engine/lewis.js';
import { buildUnits, drawScopeField, planSettle, planCut, TINTS } from '../../engine/scope.js';
import { planBeam, packCore, CORE_TINTS } from '../../engine/corebench.js';
import { zOf, nameOf } from '../../engine/electrons.js';
import { PLATE_COLORS, plateText, mulberry32, hashId, lampMark } from '../../engine/plates.js';

export const ATOMS_KIT_ID = 'atoms';

/* ------------------------------------------------------------------
   THE ELEMENTS
   ------------------------------------------------------------------ */

const METALS = new Set(['Li', 'Be', 'Na', 'Mg', 'Al', 'K', 'Ca']);

const TINT_OF = {
  H: 'bone', He: 'pale', Li: 'pale', Be: 'bone', B: 'iron', C: 'iron', N: 'pale', O: 'rust', F: 'sand',
  Ne: 'pale', Na: 'pale', Mg: 'bone', Al: 'iron', Si: 'iron', P: 'sand', S: 'sand', Cl: 'sand', Ar: 'pale',
  K: 'pale', Ca: 'bone'
};

/** Printed ink that reads on each tint's fill. */
const INK = { bone: '#2b2620', sand: '#2b2316', pale: '#1d1a16', iron: '#dcd6cc', rust: '#e8dccb' };

/** The innermost shell holds two and every shell after it holds eight (the join bench's own rule). */
export function shellsFor(z) {
  const caps = [2, 8, 8, 18];
  const out = [];
  let left = z;
  for (const cap of caps) {
    if (left <= 0) break;
    const take = Math.min(left, cap);
    out.push(take);
    left -= take;
  }
  return out;
}

export function elementOf(sym) {
  const z = zOf(sym);
  if (z < 1) throw new Error(`atoms kit: "${sym}" is not an element`);
  return {
    sym, z, name: nameOf(sym), kind: METALS.has(sym) ? 'metal' : 'nonmetal',
    shells: shellsFor(z), tint: TINT_OF[sym] || 'pale'
  };
}

/** The scope's own table of what it has weighed (the sampler scope's `kinds`). `q1-grain` re-exports it. */
export const SCOPE_KINDS = {
  k01: { code: 'hydrogen (H)', mass: 1.0, size: 0.30, tint: 'bone', note: 'The lightest atom the scope has ever weighed.' },
  k02: { code: 'helium (He)', mass: 4.0, size: 0.38, tint: 'pale', note: 'Light and unreactive. Floats free as lone atoms.' },
  k06: { code: 'carbon (C)', mass: 12.0, size: 0.56, tint: 'iron', note: 'Dark and dry. Leaves a mark on anything it touches.' },
  k08: { code: 'oxygen (O)', mass: 16.0, size: 0.52, tint: 'rust', note: 'Small but heavy. Turns up in almost every sample here.' },
  k11: { code: 'sodium (Na)', mass: 23.0, size: 0.74, tint: 'pale', note: 'Large, soft and dull. Joins with almost anything.' },
  k12: { code: 'magnesium (Mg)', mass: 24.3, size: 0.72, tint: 'pale', note: 'Lightweight, pale metal.' },
  k16: { code: 'sulfur (S)', mass: 32.1, size: 0.64, tint: 'sand', note: 'Yellow. Slightly lighter than the chlorine it looks like.' },
  k17: { code: 'chlorine (Cl)', mass: 35.5, size: 0.66, tint: 'sand', note: 'Yellow and heavy. Sharp smell.' }
};

/** The symbol a scope kind id stands for ('k11' -> 'Na'). */
export function symOfKind(kindId) {
  return SCOPE_KINDS[kindId]?.code.match(/\(([A-Za-z]+)\)/)?.[1] || null;
}

const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
const subscript = n => String(n).split('').map(c => SUB[c]).join('');
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

/** How a formula writes its elements: a metal first, then the order that reads right for what these benches build. */
const FORMULA_ORDER = ['C', 'N', 'H', 'S', 'O', 'F', 'Cl', 'Br', 'I'];

/* ------------------------------------------------------------------
   WHAT AN ATOM IS, RIGHT NOW
   ------------------------------------------------------------------ */

const isAtom = p => p && p.kind === 'atom';

/**
 * The atom as the join bench's planner reads it: its kind and its shells as they stand,
 * which is its element's shells with every link it is in applied in order. Derived each
 * time, so splitting a join undoes it.
 */
export function atomView(piece, state) {
  const el = elementOf(piece.props.el);
  const shells = (piece.props.shells || el.shells).slice();
  for (const link of Object.values(state.links)) {
    if (link.a !== piece.id && link.b !== piece.id) continue;
    if (link.type === 'share') {
      shells[shells.length - 1] += link.pairs;
    } else if (link.type === 'transfer') {
      if (link.giver === piece.id) {
        shells[shells.length - 1] -= link.moved;
        if (shells[shells.length - 1] <= 0) shells.pop();
      } else {
        shells[shells.length - 1] += link.moved;
      }
    }
  }
  return { kind: el.kind, shells };
}

/** The charge an atom carries from the links it is in. */
function atomCharge(piece, state) {
  let q = 0;
  for (const link of Object.values(state.links)) {
    if (link.type !== 'transfer' || (link.a !== piece.id && link.b !== piece.id)) continue;
    q += link.giver === piece.id ? link.moved : -link.moved;
  }
  return q;
}

function readAtom(piece, state) {
  const view = atomView(piece, state);
  const plan = shellPlan(view);
  const over = plan.outer > plan.cap;
  return {
    shells: view.shells, outer: plan.outer, cap: plan.cap, room: Math.max(0, plan.room), full: plan.full,
    lamp: over ? 'over' : plan.full ? 'full' : 'room',
    charge: atomCharge(piece, state)
  };
}

/** An atom's reading: `{shells, outer, cap, room, full, lamp, charge}` ({} for anything that is not an atom). */
export function readPiece(id, state) {
  const p = state.pieces[id];
  return isAtom(p) ? readAtom(p, state) : {};
}

const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);

/** Why a pair does not hold, in the words the stage's wording mode allows. */
function whyNot(plan, a, b, state) {
  const shells = state.opts?.words === 'shells';
  const va = atomView(a, state);
  const vb = atomView(b, state);
  const fa = shellPlan(va).full;
  const fb = shellPlan(vb).full;
  const na = nameOf(a.props.el);
  const nb = nameOf(b.props.el);
  if (plan.reason === 'both-give') {
    return shells ? 'Two metals both hand electrons away, so neither takes any.' : 'Both of these give and neither will take.';
  }
  if (fa && fb) return shells ? 'Both outer shells are already full.' : 'Neither has room for anything more.';
  if (fa) return shells ? `${cap1(na)}'s outer shell is already full.` : `${cap1(na)} has no room left.`;
  if (fb) return shells ? `${cap1(nb)}'s outer shell is already full.` : `${cap1(nb)} has no room left.`;
  return 'Nothing holds between those two.';
}

/** Hold or not: the join bench's planner against the atoms' shells as they stand. */
function planBond(a, b, state) {
  const plan = planPair({ left: atomView(a, state), right: atomView(b, state) });
  if (plan.type === 'none') return { holds: false, reason: whyNot(plan, a, b, state) };
  const giver = plan.type === 'transfer' ? (plan.giverSide === 'left' ? a.id : b.id) : null;
  const link = { type: plan.type, giver, moved: plan.moved || 0, pairs: plan.pairs || 0, a: a.id, b: b.id };
  const shells = state.opts?.words === 'shells';
  let reason;
  if (plan.type === 'transfer') {
    const g = nameOf((giver === a.id ? a : b).props.el);
    reason = shells ? `${cap1(g)} hands its outer electron${plan.moved > 1 ? 's' : ''} over.` : `${cap1(g)} gives and the other takes.`;
  } else {
    reason = shells ? `They share ${plan.pairs === 1 ? 'a pair' : `${plan.pairs} pairs`} of electrons.` : 'They hold.';
  }
  return { holds: true, reason, link };
}

/* ------------------------------------------------------------------
   CLUSTERS: FORMULA, COUNTS, CHARGE, LEWIS
   ------------------------------------------------------------------ */

/** {H: 2, O: 1} for the atoms among `ids`. */
export function countsOf(ids, state) {
  const out = {};
  for (const id of ids) {
    const p = state.pieces[id];
    if (isAtom(p)) out[p.props.el] = (out[p.props.el] || 0) + 1;
  }
  return out;
}

export function formulaFrom(counts) {
  const syms = Object.keys(counts);
  if (!syms.length) return null;
  const rank = s => (METALS.has(s) ? -1000 + zOf(s) : (FORMULA_ORDER.indexOf(s) >= 0 ? FORMULA_ORDER.indexOf(s) : 100 + zOf(s)));
  syms.sort((x, y) => rank(x) - rank(y));
  return syms.map(s => s + (counts[s] > 1 ? subscript(counts[s]) : '')).join('');
}

export function formulaOf(ids, state) {
  return formulaFrom(countsOf(ids, state));
}

export function chargeOf(ids, state) {
  let q = 0;
  for (const id of ids) {
    const p = state.pieces[id];
    if (!p) continue;
    if (isAtom(p)) q += atomCharge(p, state);
    else if (p.kind === 'proton') q += 1;
    else if (p.kind === 'electron') q -= 1;
  }
  return q;
}

/**
 * Is every atom in the cluster finished: nothing left to give or take (a full outer shell; a metal that has
 * handed its last shell over is left with a full one beneath)? `MgCl` is not (the magnesium still holds one to give); `MgCl₂` is.
 * `open` lists the atoms that still have room or a spare. Derived, so a split reopens it.
 */
export function closureOf(ids, state) {
  const open = [];
  for (const id of ids) {
    const p = state.pieces[id];
    if (!isAtom(p)) continue;
    if (!shellPlan(atomView(p, state)).full) open.push(id);
  }
  return { closed: open.length === 0, open };
}

/**
 * `planLewis` of a cluster as it is drawn: the shared pairs on its links, the lone pairs and
 * dots on its atoms (`props.lone`, `props.dots`, which T1b's slate drops set). The molecule is
 * built from the cluster, so a stage can ask any structure the player made.
 */
export function lewisOf(ids, state) {
  const atoms = ids.filter(id => isAtom(state.pieces[id])).sort();
  const index = Object.fromEntries(atoms.map((id, i) => [id, i]));
  const links = [];
  const placed = { bonds: {}, lone: {}, dots: {} };
  for (const link of Object.values(state.links)) {
    if (!(link.a in index) || !(link.b in index)) continue;
    const i = index[link.a];
    const j = index[link.b];
    links.push([Math.min(i, j), Math.max(i, j)]);
    if (link.type === 'share') placed.bonds[lewisKey(i, j)] = link.pairs;
  }
  atoms.forEach((id, i) => {
    const p = state.pieces[id];
    if (p.props.lone) placed.lone[i] = p.props.lone;
    if (p.props.dots) placed.dots[i] = p.props.dots;
  });
  const mol = { id: 'built', syms: atoms.map(id => state.pieces[id].props.el), pos: atoms.map(() => [0.5, 0.5]), links, charge: chargeOf(atoms, state) };
  return { mol, placed, read: planLewis(mol, placed) };
}

/** Every cluster of two or more atoms that is not scratch, as `{ids, counts, formula, charge}`. */
export function moleculesOf(state) {
  const seen = new Set();
  const out = [];
  for (const id of Object.keys(state.pieces).sort()) {
    const p = state.pieces[id];
    if (seen.has(id) || !isAtom(p) || p.props.scratch || p.hidden) continue;
    const ids = [];
    const queue = [id];
    seen.add(id);
    while (queue.length) {
      const cur = queue.pop();
      ids.push(cur);
      for (const n of state.pieces[cur].joinedTo) if (!seen.has(n) && isAtom(state.pieces[n])) { seen.add(n); queue.push(n); }
    }
    if (ids.length < 2) continue;
    ids.sort();
    out.push({ ids, counts: countsOf(ids, state), formula: formulaOf(ids, state), charge: chargeOf(ids, state) });
  }
  return out;
}

/* ------------------------------------------------------------------
   THE PARTICLE SCALE: READINGS
   ------------------------------------------------------------------ */

/**
 * The charge needle: protons against electrons. `fixture.props = {zones: [zone keys of the atom],
 * nucleus: id of a fixed nucleus lump}`. Whatever is not in those zones is not on the atom.
 */
export function needleReading(state, fixtureId) {
  const f = state.fixtures[fixtureId];
  if (!f) return 0;
  const zones = new Set(f.props.zones || []);
  let q = 0;
  const lump = f.props.nucleus && state.pieces[f.props.nucleus];
  if (lump && !lump.hidden) q += lump.props.p || 0;
  for (const p of Object.values(state.pieces)) {
    if (p.hidden || !p.zone || !zones.has(p.zone)) continue;
    if (p.kind === 'proton') q += 1;
    else if (p.kind === 'electron') q -= 1;
  }
  return q;
}

/** How many pieces of a kind stand in a zone. */
export function countIn(state, zone, kind) {
  return Object.values(state.pieces).filter(p => !p.hidden && p.zone === zone && (!kind || p.kind === kind)).length;
}

/**
 * What the tester does when it pushes a partner at a sample: a ring with one spare gives that
 * spare away, a ring one short of full takes one on, a full ring does neither. It is the tester's
 * model, run only against the clean cases a stage sets out.
 */
export function behaviourOf(rings) {
  if (!rings || !rings.length) return 'inert';
  const outer = rings[rings.length - 1];
  const room = rings.length === 1 ? 2 : 8;
  if (outer === room) return 'inert';
  if (outer <= 2) return 'gives';
  return 'takes';
}

/** The shots the beam sends a specimen: through, turned aside, straight back (the core bench's own planner). */
export function beamCounts(specimenId) {
  const plan = planBeam(specimenId);
  return { shots: plan.shots, wide: plan.wide, back: plan.back, through: plan.shots - plan.wide - plan.back };
}

/* ------------------------------------------------------------------
   THE SCOPE'S PICTURE OF A DISH
   ------------------------------------------------------------------ */

const PICTURES = new Map();

/** The units a dish holds, fresh, after whatever has been done to it (a cut, a shake). */
function dishSample(dish) {
  const s = dish.props.sample;
  const key = `${s.id}|${JSON.stringify(s.particles)}|${dish.props.cut || ''}|${dish.props.settled ? 1 : 0}`;
  if (!PICTURES.has(key)) {
    let units = buildUnits(s, SCOPE_KINDS);
    if (dish.props.cut === 'broke') {
      const res = planCut(units, s.id);
      units = (res.units || units).map(u => ({ ...u, x: u.tx, y: u.ty }));
    } else if (dish.props.cut === 'scatter') {
      planCut(units, s.id);
      units = units.map(u => ({ ...u, x: u.tx, y: u.ty }));
    }
    if (dish.props.settled) {
      planSettle(units, SCOPE_KINDS);
      units = units.map(u => ({ ...u, x: u.tx, y: u.ty }));
    }
    PICTURES.set(key, units);
  }
  return { ...s, units: PICTURES.get(key) };
}

/** What a cutter does to a dish's sample, by the scope's planner: 'none', 'broke' or 'scatter'. */
export function cutResult(sample) {
  return planCut(buildUnits(sample, SCOPE_KINDS), sample.id).result;
}

/** How many separate layers the shaker leaves a sample in (the scope's planner). */
export function layersOf(sample) {
  return new Set(buildUnits(sample, SCOPE_KINDS).map(u => u.signature)).size;
}

/** The power the scope's dial stands at. */
function scopePower(state) {
  const f = Object.values(state.fixtures).find(x => x.kind === 'scope');
  return f ? f.dials.power.value : 1;
}

/** The dish a lens lies on, or null. */
export function dishUnder(lensId, state) {
  const lens = state.pieces[lensId];
  if (!lens) return null;
  for (const n of lens.joinedTo) if (state.pieces[n]?.kind === 'dish') return state.pieces[n];
  return null;
}

/** The picture a dish shows right now, as `{units, power, resolved}` for the scope's drawing. */
export function dishPicture(dish, power) {
  const sample = dishSample(dish);
  return { sample, power, detail: Math.max(0, Math.min(3, power - (sample.floorPower - 3))) };
}

/* ------------------------------------------------------------------
   PAINTING (the drawn table and the built table's faces call the same functions)
   ------------------------------------------------------------------ */

const AMBER = PLATE_COLORS.amber;

function disc(ctx, x, y, r, fill, stroke, lw = 1) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.stroke();
}

/** A plus or a minus, stencilled; a charged piece is told apart by the mark, never by a colour. */
function stencil(ctx, x, y, r, sign) {
  const a = r * 0.52;
  ctx.strokeStyle = 'rgba(16, 15, 13, 0.85)';
  ctx.lineWidth = Math.max(1.4, r * 0.24);
  ctx.beginPath();
  ctx.moveTo(x - a, y);
  ctx.lineTo(x + a, y);
  if (sign === '+') { ctx.moveTo(x, y - a); ctx.lineTo(x, y + a); }
  ctx.stroke();
}

function clipDisc(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
}

/** The scope's drawing, into a disc of radius `r` at (x, y), clipped so nothing outside is touched. */
function scopePicture(ctx, x, y, r, dish, power) {
  const pic = dishPicture(dish, power);
  const s = r * 2;
  ctx.save();
  clipDisc(ctx, x, y, r);
  ctx.translate(x - r, y - r);
  drawScopeField(ctx, { w: s, h: s, sample: pic.sample, kinds: SCOPE_KINDS, power: pic.power });
  ctx.restore();
}

/** A strip of printed text along the foot of a disc, on a dark ground, so a picture never hides its name. */
function footLabel(ctx, x, y, r, text, size) {
  const h = size * 1.35;
  ctx.fillStyle = 'rgba(13, 12, 10, 0.78)';
  ctx.fillRect(x - r * 0.86, y + r * 0.58 - h / 2, r * 1.72, h);
  plateText(ctx, text, x, y + r * 0.58, { size, align: 'center', base: 'middle', color: PLATE_COLORS.text });
}

function paintAtom(ctx, p, state, o) {
  const el = elementOf(p.props.el);
  const tintName = p.props.tint || el.tint;
  const tint = TINTS[tintName];
  const rd = readAtom(p, state);
  disc(ctx, o.x, o.y, o.r, tint.fill, o.lit ? AMBER : tint.rim, o.lit ? 2 : 1);
  if (!p.props.mask) {
    plateText(ctx, el.sym, o.x, o.y + o.r * 0.04, { size: Math.max(9, Math.round(o.r * (el.sym.length > 1 ? 0.84 : 1.0))), weight: 700, align: 'center', base: 'middle', color: INK[tintName] });
  }
  if (state.opts?.shells) {
    // The outer electrons, as dots on the rim: the picture of what a join fills.
    const n = Math.min(rd.outer, 12);
    ctx.fillStyle = INK[tintName];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(n, 1);
      ctx.beginPath();
      ctx.arc(o.x + Math.cos(a) * o.r * 0.78, o.y + Math.sin(a) * o.r * 0.78, Math.max(1.1, o.r * 0.09), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (rd.charge) {
    const t = `${Math.abs(rd.charge) > 1 ? Math.abs(rd.charge) : ''}${rd.charge > 0 ? '+' : '−'}`;
    plateText(ctx, t, o.x + o.r * 0.62, o.y - o.r * 0.62, { size: Math.max(8, Math.round(o.r * 0.6)), weight: 700, align: 'center', base: 'middle', color: AMBER });
  }
  if (rd.lamp === 'over') lampMark(ctx, o.x - o.r * 0.7, o.y - o.r * 0.7, Math.max(9, o.r * 0.7));
}

function paintParticle(ctx, p, state, o) {
  const sign = p.kind === 'proton' ? '+' : p.kind === 'electron' ? '−' : '';
  const fill = p.kind === 'proton' ? CORE_TINTS.marked : p.kind === 'neutron' ? CORE_TINTS.blank : CORE_TINTS.light;
  disc(ctx, o.x, o.y, o.r, fill.fill, o.lit ? AMBER : fill.rim, o.lit ? 2 : 1);
  if (sign) stencil(ctx, o.x, o.y, o.r, sign);
}

/** The lump at the middle of an atom, to scale: a huddle with a stencilled plus on every proton. */
function paintNucleus(ctx, p, state, o) {
  const marked = p.props.p || 0;
  const blank = p.props.n || 0;
  const total = marked + blank;
  disc(ctx, o.x, o.y, o.r, '#1a1814', o.lit ? AMBER : PLATE_COLORS.rim, o.lit ? 2 : 1);
  if (!total) return;
  const rand = mulberry32(hashId(p.id) ^ 0x7a31);
  const pack = packCore(total, rand);
  const spread = Math.max(1, ...pack.map(([x, y]) => Math.hypot(x, y))) + 1;
  const unit = (o.r * 0.9) / spread;
  const r = unit * 0.88;
  const order = [];
  let m = marked;
  let b = blank;
  for (let i = 0; i < total; i++) {
    const takeMarked = b === 0 || (m > 0 && (i % 2 === 0 ? m >= b : m > b));
    if (takeMarked) { order.push('marked'); m--; } else { order.push('blank'); b--; }
  }
  const idx = pack.map((_, i) => i).sort((a, c) => Math.hypot(...pack[c]) - Math.hypot(...pack[a]));
  for (const i of idx) {
    const [ox, oy] = pack[i];
    const t = CORE_TINTS[order[i]];
    disc(ctx, o.x + ox * unit, o.y + oy * unit, r, t.fill, t.rim, 1);
    if (order[i] === 'marked' && r >= 2.4) stencil(ctx, o.x + ox * unit, o.y + oy * unit, r, '+');
  }
  if (p.label) footLabel(ctx, o.x, o.y, o.r, p.label, Math.max(8, Math.round(o.r * 0.36)));
}

/**
 * A mounted specimen: its rings with their electrons, a dot for its middle, and (when the stage
 * says so) the counts of what is in the middle, printed. A casing hides all of it.
 */
function paintSpecimen(ctx, p, state, o) {
  const base = '#2a2620';
  disc(ctx, o.x, o.y, o.r, base, o.lit ? AMBER : PLATE_COLORS.steel, o.lit ? 2 : 1);
  const cy = o.y - o.r * 0.12;
  const R = o.r * 0.74;
  if (p.props.casing) {
    ctx.strokeStyle = 'rgba(184, 175, 160, 0.3)';
    ctx.lineWidth = 1;
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      ctx.moveTo(o.x - R + k * R * 0.5, cy + R);
      ctx.lineTo(o.x + R + k * R * 0.5, cy - R);
      ctx.stroke();
    }
  } else {
    const rings = p.props.rings || [];
    rings.forEach((n, ri) => {
      const rr = R * (0.3 + 0.7 * ((ri + 1) / Math.max(rings.length, 1)));
      ctx.strokeStyle = PLATE_COLORS.dim;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(o.x, cy, rr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = CORE_TINTS.light.fill;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / n + ri * 0.4;
        ctx.beginPath();
        ctx.arc(o.x + Math.cos(a) * rr, cy + Math.sin(a) * rr, Math.max(1.2, o.r * 0.075), 0, Math.PI * 2);
        ctx.fill();
      }
    });
    const total = (p.props.p || 0) + (p.props.n || 0);
    if (total) disc(ctx, o.x, cy, Math.max(1.6, R * 0.06 * Math.sqrt(total)), CORE_TINTS.marked.fill, CORE_TINTS.marked.rim, 1);
    if (p.props.counts) {
      // What is in the middle, printed in the upper half on a dark ground, above the ring dots.
      const size = Math.max(6, Math.round(o.r * 0.27));
      const y1 = o.y - o.r * 0.58;
      const y2 = y1 + size * 1.2;
      ctx.fillStyle = 'rgba(13, 12, 10, 0.72)';
      ctx.fillRect(o.x - o.r * 0.7, y1 - size * 0.62, o.r * 1.4, size * 2.5);
      plateText(ctx, `${p.props.p} protons`, o.x, y1, { size, align: 'center', base: 'middle', color: PLATE_COLORS.text });
      plateText(ctx, `${p.props.n} neutrons`, o.x, y2, { size, align: 'center', base: 'middle', color: PLATE_COLORS.text });
    }
  }
  if (p.props.needle || p.props.tested) {
    ctx.fillStyle = 'rgba(13, 12, 10, 0.72)';
    ctx.fillRect(o.x - o.r * 0.7, o.y - o.r * 0.97, o.r * 1.4, o.r * 0.32);
  }
  if (p.props.needle) {
    const q = (p.props.p || 0) - (p.props.rings || []).reduce((a, b) => a + b, 0);
    plateText(ctx, `needle ${q === 0 ? '0' : `${q > 0 ? '+' : '−'}${Math.abs(q)}`}`, o.x, o.y - o.r * 0.8, { size: Math.max(7, Math.round(o.r * 0.3)), weight: 700, align: 'center', base: 'middle', color: q === 0 ? PLATE_COLORS.dust : AMBER });
  }
  if (p.props.tested) {
    const t = { gives: 'gives one', takes: 'takes one', inert: 'no trade' }[p.props.tested] || '';
    plateText(ctx, t, o.x, o.y - o.r * 0.8, { size: Math.max(7, Math.round(o.r * 0.32)), weight: 700, align: 'center', base: 'middle', color: AMBER });
  }
  footLabel(ctx, o.x, o.y, o.r, p.label, Math.max(7, Math.round(o.r * 0.36)));
}

function paintDish(ctx, p, state, o) {
  const s = p.props.sample;
  const open = p.props.view != null;
  const power = open ? p.props.view : Math.max(1, s.floorPower - 3);
  scopePicture(ctx, o.x, o.y, o.r * 0.94, p, power);
  ctx.strokeStyle = o.lit ? AMBER : PLATE_COLORS.steel;
  ctx.lineWidth = o.lit ? 2 : 1.5;
  ctx.beginPath();
  ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
  ctx.stroke();
  if (p.props.cut === 'none') plateText(ctx, 'unchanged', o.x, o.y - o.r * 0.58, { size: Math.max(7, Math.round(o.r * 0.3)), weight: 700, align: 'center', base: 'middle', color: AMBER });
  footLabel(ctx, o.x, o.y, o.r, p.label, Math.max(8, Math.round(o.r * 0.38)));
}

function paintLens(ctx, p, state, o) {
  const dish = dishUnder(p.id, state);
  disc(ctx, o.x, o.y, o.r, '#0d0c0a', o.lit ? AMBER : PLATE_COLORS.dust, o.lit ? 2.5 : 2);
  if (dish) scopePicture(ctx, o.x, o.y, o.r * 0.9, dish, scopePower(state));
  else {
    ctx.strokeStyle = PLATE_COLORS.dim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r * 0.55, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (!dish) footLabel(ctx, o.x, o.y, o.r, p.label, Math.max(8, Math.round(o.r * 0.36)));
}

function paintTool(ctx, p, state, o) {
  disc(ctx, o.x, o.y, o.r, PLATE_COLORS.steel, o.lit ? AMBER : PLATE_COLORS.dust, o.lit ? 2 : 1);
  ctx.strokeStyle = '#16140f';
  ctx.lineWidth = Math.max(1.5, o.r * 0.14);
  ctx.beginPath();
  if (p.kind === 'cutter') {
    // A blade across the face.
    ctx.moveTo(o.x - o.r * 0.6, o.y + o.r * 0.1);
    ctx.lineTo(o.x + o.r * 0.6, o.y - o.r * 0.34);
  } else {
    // A shaker's zigzag.
    ctx.moveTo(o.x - o.r * 0.62, o.y - o.r * 0.1);
    for (let i = 1; i <= 5; i++) ctx.lineTo(o.x - o.r * 0.62 + i * o.r * 0.248, o.y - o.r * 0.1 + (i % 2 ? o.r * 0.26 : -o.r * 0.1));
  }
  ctx.stroke();
  plateText(ctx, p.label, o.x, o.y + o.r * 0.58, { size: Math.max(8, Math.round(o.r * 0.34)), weight: 700, align: 'center', base: 'middle', color: PLATE_COLORS.text });
}

function paintDetector(ctx, p, state, o) {
  ctx.fillStyle = '#2a2620';
  ctx.fillRect(o.x - o.r, o.y - o.r, o.r * 2, o.r * 2);
  ctx.strokeStyle = o.lit ? AMBER : PLATE_COLORS.dust;
  ctx.lineWidth = o.lit ? 2 : 1;
  ctx.strokeRect(o.x - o.r + 0.5, o.y - o.r + 0.5, o.r * 2 - 1, o.r * 2 - 1);
  ctx.strokeStyle = PLATE_COLORS.dim;
  for (let k = -1; k <= 1; k++) {
    ctx.beginPath();
    ctx.moveTo(o.x - o.r * 0.6, o.y + k * o.r * 0.28 - o.r * 0.12);
    ctx.lineTo(o.x + o.r * 0.6, o.y + k * o.r * 0.28 - o.r * 0.12);
    ctx.stroke();
  }
  if (p.props.count != null) {
    plateText(ctx, String(p.props.count), o.x, o.y + o.r * 0.1, { size: Math.max(9, Math.round(o.r * 0.7)), weight: 700, align: 'center', base: 'middle', color: AMBER });
  }
  plateText(ctx, p.label, o.x, o.y + o.r * 0.72, { size: Math.max(7, Math.round(o.r * 0.34)), align: 'center', base: 'middle', color: PLATE_COLORS.text });
}

const PAINTERS = {
  atom: paintAtom, proton: paintParticle, neutron: paintParticle, electron: paintParticle,
  nucleus: paintNucleus, specimen: paintSpecimen, dish: paintDish, lens: paintLens,
  cutter: paintTool, shaker: paintTool, detector: paintDetector
};

function paintPiece(ctx, p, state, o) {
  const fn = PAINTERS[p.kind];
  if (!fn) return false;
  fn(ctx, p, state, o);
  return true;
}

/** What a piece prints on its face, so a test can tell it was drawn. Empty when it prints nothing. */
function printed(p, state) {
  switch (p.kind) {
    case 'lens': return dishUnder(p.id, state) ? '' : p.label;
    case 'atom': return p.props.mask ? '' : p.props.el;
    case 'proton': return '';
    case 'neutron': return '';
    case 'electron': return '';
    default: return p.label;
  }
}

function faceKey(p, state) {
  switch (p.kind) {
    case 'atom': {
      const r = readAtom(p, state);
      return `${p.props.el}|${p.props.tint || ''}|${r.charge}|${r.lamp}|${r.outer}|${p.props.mask ? 1 : 0}|${state.opts?.shells ? 1 : 0}`;
    }
    case 'dish': return `${p.props.sample.id}|${p.props.cut || ''}|${p.props.settled ? 1 : 0}|${p.props.view ?? ''}`;
    case 'lens': {
      const d = dishUnder(p.id, state);
      return d ? `${d.id}|${d.props.sample.id}|${scopePower(state)}|${d.props.cut || ''}|${d.props.settled ? 1 : 0}` : '';
    }
    case 'specimen': return JSON.stringify(p.props);
    case 'nucleus': return `${p.props.p}|${p.props.n}`;
    case 'detector': return `${p.props.count ?? ''}`;
    default: return '';
  }
}

/* ---- fixtures ---- */

function paintNeedle(ctx, f, state, b) {
  const q = needleReading(state, f.id);
  const range = f.props.range || 4;
  const w = b.x1 - b.x0;
  const h = b.y1 - b.y0;
  const cx = (b.x0 + b.x1) / 2;
  const cy = b.y0 + h * 0.86;
  const R = Math.min(w * 0.42, h * 0.62);
  const sweep = 0.55 * Math.PI;
  ctx.strokeStyle = PLATE_COLORS.steel;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, R, -Math.PI / 2 - sweep, -Math.PI / 2 + sweep);
  ctx.stroke();
  for (let t = -range; t <= range; t++) {
    const a = -Math.PI / 2 + (t / range) * sweep;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R * (t === 0 ? 0.78 : 0.88), cy + Math.sin(a) * R * (t === 0 ? 0.78 : 0.88));
    ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.stroke();
  }
  const clamped = Math.max(-range, Math.min(range, q));
  const a = -Math.PI / 2 + (clamped / range) * sweep;
  ctx.strokeStyle = q === 0 ? PLATE_COLORS.dust : AMBER;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(a) * R * 0.92, cy + Math.sin(a) * R * 0.92);
  ctx.stroke();
  const text = q === 0 ? '0' : `${q > 0 ? '+' : '−'}${Math.abs(q)}`;
  plateText(ctx, text, b.x1 - 4, b.y0 + h * 0.3, { size: Math.max(10, Math.round(h * 0.26)), weight: 700, align: 'right', base: 'middle', color: q === 0 ? PLATE_COLORS.dust : AMBER });
}

function paintBeam(ctx, f, state, b) {
  const w = b.x1 - b.x0;
  const h = b.y1 - b.y0;
  const y = b.y0 + h * 0.56;
  ctx.fillStyle = PLATE_COLORS.steel;
  ctx.fillRect(b.x0 + 3, y - h * 0.1, w * 0.1, h * 0.2);
  ctx.strokeStyle = PLATE_COLORS.dust;
  ctx.lineWidth = 1;
  ctx.setLineDash?.([3, 3]);
  ctx.beginPath();
  ctx.moveTo(b.x0 + 3 + w * 0.1, y);
  ctx.lineTo(b.x0 + w * 0.62, y);
  ctx.stroke();
  ctx.setLineDash?.([]);
  // The foil, edge on.
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(b.x0 + w * 0.66, y - h * 0.24);
  ctx.lineTo(b.x0 + w * 0.66, y + h * 0.24);
  ctx.stroke();
}

function paintReader(ctx, f, state, b) {
  const slot = f.props.slot && state.zones.slots[f.props.slot];
  const held = slot && Object.values(state.pieces).find(p => p.zone === `slot:${slot.id}` && !p.hidden);
  const size = Math.max(9, Math.round((b.y1 - b.y0) * 0.22));
  if (!held || !isAtom(held)) {
    plateText(ctx, 'empty', b.x0 + 4, b.y1 - 5, { size, color: PLATE_COLORS.dim });
    return;
  }
  const el = elementOf(held.props.el);
  const mass = SCOPE_KINDS[Object.keys(SCOPE_KINDS).find(k => symOfKind(k) === el.sym)]?.mass;
  plateText(ctx, `${el.name} (${el.sym})`, b.x0 + 4, b.y0 + (b.y1 - b.y0) * 0.55, { size, weight: 700, color: PLATE_COLORS.text });
  plateText(ctx, mass != null ? `mass ${mass.toFixed(1)}` : '', b.x0 + 4, b.y1 - 5, { size, color: PLATE_COLORS.dust });
}

function paintFixture(ctx, f, state, b) {
  if (f.kind === 'needle') paintNeedle(ctx, f, state, b);
  else if (f.kind === 'beam') paintBeam(ctx, f, state, b);
  else if (f.kind === 'reader') paintReader(ctx, f, state, b);
}

/* ---- joins ---- */

function paintLink(ctx, link, o) {
  if (link?.tool) return true;   // a lens lying on a dish is not a rod
  if (!link || (link.type !== 'share' && link.type !== 'transfer')) return false;
  const dx = o.bx - o.ax;
  const dy = o.by - o.ay;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  if (link.type === 'share') {
    const n = Math.max(1, link.pairs);
    ctx.lineWidth = Math.max(1.6, 2.4 - n * 0.3);
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * 4;
      ctx.beginPath();
      ctx.moveTo(o.ax + nx * off, o.ay + ny * off);
      ctx.lineTo(o.bx + nx * off, o.by + ny * off);
      ctx.stroke();
    }
    return true;
  }
  // A hand-over: a thin line, and the electron nearer the atom that took it.
  ctx.lineWidth = 1.2;
  ctx.setLineDash?.([3, 3]);
  ctx.beginPath();
  ctx.moveTo(o.ax, o.ay);
  ctx.lineTo(o.bx, o.by);
  ctx.stroke();
  ctx.setLineDash?.([]);
  const takerIsA = link.giver === link.b;
  const t = takerIsA ? 0.3 : 0.7;
  ctx.fillStyle = CORE_TINTS.light.fill;
  ctx.beginPath();
  ctx.arc(o.ax + dx * t, o.ay + dy * t, Math.max(2, 0.8 * o.sc), 0, Math.PI * 2);
  ctx.fill();
  return true;
}

function linkRods(link) {
  if (link?.tool) return 0;
  if (link?.type === 'share') return Math.max(1, link.pairs);
  return 1;
}

/* ------------------------------------------------------------------
   THE KIT
   ------------------------------------------------------------------ */

const R = 5;

function planJoin(a, b, state) {
  // A tool laid on a dish.
  if (a.kind === 'lens' || a.kind === 'cutter' || a.kind === 'shaker') {
    if (b.kind !== 'dish') return { holds: false, reason: 'That goes on a sample dish.' };
    if (a.kind === 'lens') return { holds: true, link: { tool: 'lens' }, rest: { x: 5, y: 0 }, reason: 'The lens lies over the dish.' };
    const s = b.props.sample;
    if (a.kind === 'cutter') {
      if (b.props.cut) return { holds: true, once: true, reason: 'The dish has been cut already.' };
      const result = cutResult(s);
      return { holds: true, once: true, set: { b: { cut: result } }, reason: 'The blade passes across the dish.' };
    }
    if (b.props.settled) return { holds: true, once: true, reason: 'The dish has settled already.' };
    return { holds: true, once: true, set: { b: { settled: true } }, reason: 'The shaker passes under the dish.' };
  }
  if (isAtom(a) && isAtom(b)) return planBond(a, b, state);
  return { holds: false, reason: 'Those two do not join.' };
}

function run(state, fixtureId) {
  const f = state.fixtures[fixtureId];
  if (!f) return null;
  if (f.kind === 'beam') {
    const det = Object.values(state.pieces).find(p => p.kind === 'detector' && p.zone && p.zone.startsWith('slot:') && !p.hidden);
    if (!det) return null;
    const slot = det.zone.slice(5);
    const angle = f.props.angles?.[slot];
    if (angle == null) return null;
    const c = beamCounts(f.props.specimen);
    const count = angle === 0 ? c.through : angle === 180 ? c.back : c.wide;
    return { x: angle, y: count, label: `${count} of ${c.shots}`, stamp: { [det.id]: { count } } };
  }
  if (f.kind === 'tester') {
    const held = Object.values(state.pieces).find(p => p.kind === 'specimen' && p.zone === `slot:${f.props.slot}` && !p.hidden);
    if (!held) return null;
    return { stamp: { [held.id]: { tested: behaviourOf(held.props.rings) } } };
  }
  return null;
}

export const ATOMS_KIT = {
  id: ATOMS_KIT_ID,
  joinGap: 1.28,
  kinds: {
    atom: { r: R, split: true },
    proton: { r: R, nojoin: true },
    neutron: { r: R, nojoin: true },
    electron: { r: R, nojoin: true },
    nucleus: { r: 9, nojoin: true },
    specimen: { r: 9, nojoin: true },
    detector: { r: R, nojoin: true },
    card: { r: R, nojoin: true },
    dish: { r: 9 },
    lens: { r: 9, tool: true },
    cutter: { r: 6.5, tool: true },
    shaker: { r: 6.5, tool: true }
  },
  planJoin,
  formulaOf,
  chargeOf,
  readPiece,
  run,
  paintPiece,
  printed,
  faceKey,
  paintFixture,
  paintLink,
  linkRods
};

registerKit(ATOMS_KIT);

/* ------------------------------------------------------------------
   THE SCRATCH CORNER
   A few loose atoms and a bin, on every atom-kit table, never graded. It is where a
   player plays with joining before anything asks about it.
   ------------------------------------------------------------------ */

/** The ids a stage's `check` must ignore: every scratch piece carries `props.scratch`. */
export const isScratch = p => Boolean(p?.props?.scratch);

/** The atoms in the corner. Hydrogen is one only: a loose player cannot make water by accident. */
const SCRATCH_ATOMS = ['H', 'O', 'Na', 'Cl'];

/**
 * The corner as table-spec pieces and a tray, to be spread into a stage's declaration:
 * `{pieces, tray}`. It occupies x 2..46, y 47..62 of a 120 x 64 table (the bottom left).
 */
export function scratchCorner({ x = 0, y = 0 } = {}) {
  const pieces = SCRATCH_ATOMS.map((el, i) => ({
    id: `scr-${i + 1}`, kind: 'atom', label: el, at: { x: x + 31 + (i % 2) * 11, y: y + 49 + Math.floor(i / 2) * 10 },
    props: { el, scratch: true }
  }));
  const tray = { id: 'scr-bin', label: 'Bin', at: { x: x + 13, y: y + 55 }, size: { w: 22, h: 14 } };
  return { pieces, tray };
}

export const TABLE_BOUNDS = Object.freeze({ w: 120, h: 64 });

/**
 * A stage's declaration with the atom kit's furniture added: the kit, the standard bounds, the
 * scratch corner and a parked recorder strip. A stage that prints on the strip passes its own
 * `recorder` and keeps it.
 */
export function atomTable(spec) {
  const scratch = scratchCorner();
  const z = spec.zones || {};
  return {
    kit: ATOMS_KIT_ID,
    bounds: { ...TABLE_BOUNDS },
    tools: [],
    recorder: PARKED_RECORDER,
    ...spec,
    pieces: [...(spec.pieces || []), ...scratch.pieces],
    zones: { ...z, trays: [...(z.trays || []), scratch.tray] }
  };
}

/** The pieces standing in a zone (`'tray:one'`, `'slot:rd'`), off the scratch corner, as records. */
export function piecesIn(state, zone, kind = null) {
  return Object.values(state.pieces).filter(p => !p.hidden && !isScratch(p) && p.zone === zone && (!kind || p.kind === kind));
}

/** Where the paper strip parks on a table that never prints on it: a corner nothing else uses. */
export const PARKED_RECORDER = Object.freeze({ at: { x: 117, y: 61 }, size: { w: 6, h: 4 } });

export { VALENCE };
