/**
 * kits/domain-orbitals.js — The domain kit's orbitals: a bowl they are mixed in, bonds made by overlapping them, and a
 * bond that is turned.
 *
 * AN ORBITAL (piece `orb`) is one of an atom's: `props {type, atom, e, axis?, to?, dir?}`. `type` is 's', 'p', 'd' or
 * a hybrid ('sp', 'sp2', 'sp3'); `e` the electrons in it (a box holds 2; one is a single electron, free to bond); a p orbital
 * has an `axis`; `to` names the atom its lobe points at (a lobe points where the planner put the arm).
 *
 * THE BOWL (fixture `mixbowl`, with a still container for the orbitals dropped in it). What comes out is whatever went
 * in: `vsepr.planBlend` of the s, p and d orbitals in the bowl. One s with p p orbitals gives p + 1 lobes (a bowl with no
 * s gives nothing), the lobes point where `planDomains` puts that many arms, and the p orbitals NOT put in the bowl are
 * the ones left over. The picture is drawn from the bowl's contents and nothing else.
 *
 * AN OVERLAP (`planJoin`): two orbitals on different atoms, each with a single electron, that point at each other make
 * a sigma bond (end to end); two p orbitals of the same axis side by side make a pi bond. A pair, an empty box, two
 * lobes pointing away from each other, p orbitals on different axes: nothing joins, and the reason is the picture.
 *
 * A TWIST (fixture `twist`, one dial): the far end of a bond turned by hand. `vsepr.planTwist` says whether it will
 * turn; if it will not, `settle` sends the knob back and says why.
 */

import { planBlend, planTwist, planDomains } from '../../engine/vsepr.js';
import { PLATE_COLORS, plateText } from '../../engine/plates.js';
import { rectOf, SIZES } from '../snap.js';
import { AMBER, project, arrow, disc, atomDisc } from './domain-draw.js';

export const ORB_R = 6.3;
const live = p => p && !p.hidden;
const SUP = { sp: 'sp', sp2: 'sp²', sp3: 'sp³', sp3d: 'sp³d', sp3d2: 'sp³d²' };

/* ------------------------------------------------------------------
   READING THE BOWL
   ------------------------------------------------------------------ */

export const orbIn = (state, zone) => Object.values(state.pieces).filter(p => p.kind === 'orb' && live(p) && p.zone === zone);

/** What a bowl fixture holds and what comes out of it. */
export function bowlRead(state, fid) {
  const f = state.fixtures[fid];
  const held = orbIn(state, `container:${f.props.zone}`);
  const count = t => held.filter(p => p.props.type === t).length;
  const s = count('s');
  const p = count('p');
  const d = count('d');
  const blend = planBlend(s, p, d);
  return { id: fid, held, s, p, d, blend, lobes: blend.lobes, hybrid: blend.hybrid, leftoverP: blend.leftoverP };
}

/* ------------------------------------------------------------------
   OVERLAPS
   ------------------------------------------------------------------ */

const isOrb = p => p && p.kind === 'orb';
export const bondedOrb = (state, p) => p.joinedTo.some(id => state.pieces[id]?.kind === 'orb');

const noElectron = p => (p.props.e >= 2
  ? 'That orbital already holds a pair, so it has no single electron to share.'
  : 'That orbital is empty, so it has no electron to share.');

export function planOrbJoin(a, b, state) {
  if (!isOrb(a) || !isOrb(b)) return undefined;
  if (a.props.atom === b.props.atom) return { holds: false, reason: 'Those two belong to one atom. A bond is made between two atoms.' };
  for (const x of [a, b]) {
    if (x.props.type === 'd') return { holds: false, reason: 'A d orbital takes no part in these bonds.' };
    if (x.props.e !== 1) return { holds: false, reason: noElectron(x) };
    if (bondedOrb(state, x) && !a.joinedTo.includes(b.id)) return { holds: false, reason: 'One of those orbitals is already in a bond.' };
  }
  const facing = (!a.props.to || a.props.to === b.props.atom) && (!b.props.to || b.props.to === a.props.atom);
  if (!facing) return { holds: false, reason: 'Those two orbitals do not point at each other.' };
  if (a.props.type === 'p' && b.props.type === 'p') {
    if (a.props.axis !== b.props.axis) return { holds: false, reason: 'Those p orbitals point different ways, so they cannot overlap side by side.' };
    return { holds: true, link: { type: 'pi' }, reason: 'The p orbitals overlap side by side, above and below the line between the atoms.' };
  }
  return { holds: true, link: { type: 'sigma' }, reason: 'The orbitals overlap end to end, along the line between the atoms.' };
}

/** Every bond built on the table: `{sigma, pi}` and the pairs. */
export function bondsBuilt(state) {
  const out = { sigma: 0, pi: 0, pairs: [] };
  for (const [key, link] of Object.entries(state.links)) {
    if (link.type !== 'sigma' && link.type !== 'pi') continue;
    out[link.type] += 1;
    const [x, y] = key.split('|').map(id => state.pieces[id]);
    out.pairs.push({ type: link.type, a: x.props.atom, b: y.props.atom, ids: [x.id, y.id] });
  }
  return out;
}

/* ------------------------------------------------------------------
   THE TWIST
   ------------------------------------------------------------------ */

/**
 * A twist as the hand has left it. `dial` is where the knob stands; `angle` is how far the far end of the bond has turned,
 * which is the knob's angle where the bond turns (`vsepr.planTwist`) and nothing where it holds, and `held` says the knob
 * is turned against a bond that will not let it follow.
 */
export const twistRead = (state, fid) => {
  const f = state.fixtures[fid];
  const plan = planTwist(f.props.order);
  const dial = f.dials.turn.value;
  return { id: fid, order: f.props.order, free: plan.free, dial, angle: plan.free ? dial : 0, tried: dial > 0, held: !plan.free && dial > 0, why: plan.why };
};

/* ------------------------------------------------------------------
   PAINTING
   ------------------------------------------------------------------ */

function lobePath(ctx, x, y, ang, len, wid) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(len * 0.25, -wid, len * 0.85, -wid, len, 0);
  ctx.bezierCurveTo(len * 0.85, wid, len * 0.25, wid, 0, 0);
  ctx.closePath();
  ctx.restore();
}

export function lobe(ctx, x, y, ang, len, wid, color, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.fillStyle = 'rgba(111, 143, 63, 0.2)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(len * 0.25, -wid, len * 0.85, -wid, len, 0);
  ctx.bezierCurveTo(len * 0.85, wid, len * 0.25, wid, 0, 0);
  ctx.closePath();
  if (filled) ctx.fill();
  ctx.stroke();
  ctx.restore();
}

const AXIS_ANGLE = { x: 0, y: -Math.PI / 2, z: -Math.PI / 4 };

function electrons(ctx, x, y, e, size, color) {
  const h = size;
  if (e >= 1) arrow(ctx, x - (e === 2 ? size * 0.35 : 0), y + h * 0.5, x - (e === 2 ? size * 0.35 : 0), y - h * 0.5, Math.max(1.2, size * 0.14), color, Math.max(2.5, size * 0.3));
  if (e >= 2) arrow(ctx, x + size * 0.35, y - h * 0.5, x + size * 0.35, y + h * 0.5, Math.max(1.2, size * 0.14), color, Math.max(2.5, size * 0.3));
}

function paintOrb(ctx, p, state, o) {
  const t = p.props.type;
  const bonded = bondedOrb(state, p);
  disc(ctx, o.x, o.y, o.r, '#16140f', o.lit ? AMBER : bonded ? PLATE_COLORS.phosphor : PLATE_COLORS.steel, o.lit || bonded ? 2 : 1);
  const col = PLATE_COLORS.phosphor;
  if (t === 's') {
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(o.x, o.y - o.r * 0.1, o.r * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  } else if (t === 'p') {
    const a = AXIS_ANGLE[p.props.axis] ?? 0;
    for (const s of [0, Math.PI]) lobe(ctx, o.x, o.y - o.r * 0.1, a + s, o.r * 0.78, o.r * 0.2, col, false);
  } else if (t === 'd') {
    for (let k = 0; k < 4; k++) lobe(ctx, o.x, o.y - o.r * 0.1, Math.PI / 4 + (k * Math.PI) / 2, o.r * 0.7, o.r * 0.16, PLATE_COLORS.dust, false);
  } else {
    const a = p.props.dir ?? 0;
    lobe(ctx, o.x, o.y - o.r * 0.1, a, o.r * 0.82, o.r * 0.28, col, true);
    lobe(ctx, o.x, o.y - o.r * 0.1, a + Math.PI, o.r * 0.22, o.r * 0.09, PLATE_COLORS.dim, false);
  }
  if (p.props.e) electrons(ctx, o.x + o.r * 0.58, o.y + o.r * 0.5, p.props.e, o.r * 0.42, PLATE_COLORS.text);
  const label = p.props.atomLabel ? `${p.props.atomLabel} ${p.label}` : p.label;
  plateText(ctx, label, o.x - o.r * 0.1, o.y + o.r * 0.62, { size: Math.max(6, Math.round(o.r * 0.38)), weight: 700, align: 'center', base: 'middle', color: PLATE_COLORS.dust });
}

export function paintOrbLink(ctx, link, o) {
  if (link?.type !== 'sigma' && link?.type !== 'pi') return false;
  const dx = o.bx - o.ax;
  const dy = o.by - o.ay;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  ctx.strokeStyle = link.type === 'pi' ? AMBER : PLATE_COLORS.dust;
  ctx.lineWidth = 2;
  const offs = link.type === 'pi' ? [-o.sc * 1.4, o.sc * 1.4] : [0];
  for (const off of offs) {
    ctx.beginPath();
    ctx.moveTo(o.ax + nx * off, o.ay + ny * off);
    ctx.lineTo(o.bx + nx * off, o.by + ny * off);
    ctx.stroke();
  }
  return true;
}

export const orbLinkRods = link => (link?.type === 'pi' ? 2 : link?.type === 'sigma' ? 1 : undefined);

/** The hybrid lobes a bowl makes, pointing where that many arms settle, and the p orbitals left over. */
function paintBowl(ctx, f, state, b) {
  const read = bowlRead(state, f.id);
  const r = rectOf(f, SIZES.fixture);
  const bowl = state.zones.containers[f.props.zone];
  const spot = f.props.out;
  const out = spot ? { x: b.X(spot.x), y: b.Y(spot.y) } : { x: b.X((bowl.at.x + bowl.size.w / 2 + r.x1) / 2 + 1), y: b.Y(r.y0 + (r.y1 - r.y0) * 0.55) };
  const L = spot ? spot.L * b.sc : Math.min((r.x1 - (bowl.at.x + bowl.size.w / 2)) * b.sc * 0.36, (r.y1 - r.y0) * b.sc * 0.3);
  const size = Math.max(7, Math.round(2.2 * b.sc));
  const x = b.x1 - 1.5 * b.sc;
  plateText(ctx, read.blend.blends ? `LOBES ${read.lobes}` : 'LOBES', x, b.y0 + 3.6 * b.sc, { size, weight: 700, align: 'right', base: 'middle', color: read.blend.blends ? PLATE_COLORS.phosphor : PLATE_COLORS.dim });
  plateText(ctx, read.blend.blends ? `LEFT OVER ${read.leftoverP}` : 'LEFT OVER', x, b.y0 + 6.5 * b.sc, { size, weight: 700, align: 'right', base: 'middle', color: read.blend.blends ? PLATE_COLORS.dust : PLATE_COLORS.dim });
  if (!read.held.length) {
    plateText(ctx, 'NOTHING MIXED', out.x, out.y, { size, align: 'center', base: 'middle', color: PLATE_COLORS.dim });
    return;
  }
  atomDisc(ctx, out.x, out.y, Math.max(4, L * 0.16), f.props.hub || 'C');
  if (!read.blend.blends) {
    plateText(ctx, read.s ? 'NOTHING NEW' : 'NO s ORBITAL', out.x, out.y + L * 0.5, { size, align: 'center', base: 'middle', color: PLATE_COLORS.dim });
    return;
  }
  // The lobes point where that many arms settle (the planner's own), seen from the plate's usual view.
  const plan = planDomains(Array.from({ length: read.lobes }, () => ({ kind: 'atom', sym: 'X', mult: 1 })));
  for (const v of plan.vectors) {
    const p = project(v.v, 0.35, 0.3);
    const ang = Math.atan2(p.y, p.x);
    lobe(ctx, out.x, out.y, ang, L * Math.min(1, 0.45 + Math.hypot(p.x, p.y) * 0.55), L * 0.2, PLATE_COLORS.phosphor, true);
    lobe(ctx, out.x, out.y, ang + Math.PI, L * 0.16, L * 0.06, PLATE_COLORS.dim, false);
  }
  // A p orbital left out of the bowl stands at right angles to the lobes.
  for (let k = 0; k < Math.min(read.leftoverP, 2); k++) {
    const sgn = k ? -1 : 1;
    lobe(ctx, out.x + sgn * L * 0.05, out.y - L * 0.02, -Math.PI / 2 + sgn * 0.25, L * 0.55, L * 0.1, AMBER, false);
    lobe(ctx, out.x + sgn * L * 0.05, out.y - L * 0.02, Math.PI / 2 + sgn * 0.25, L * 0.55, L * 0.1, AMBER, false);
  }
  void lobePath;
}

function paintTwist(ctx, f, state, b) {
  const r = rectOf(f, SIZES.fixture);
  const read = twistRead(state, f.id);
  const cx = b.X((r.x0 + r.x1) / 2);
  const cy = b.Y(r.y0 + (r.y1 - r.y0) * 0.62);
  const L = Math.min((r.x1 - r.x0) * b.sc * 0.24, (r.y1 - r.y0) * b.sc * 0.22);
  const x0 = cx - L * 0.55;
  const x1 = cx + L * 0.55;
  const pegs = read.order === 'single' ? 3 : 2;
  const size = Math.max(7, Math.round(2.2 * b.sc));
  plateText(ctx, `TURN ${read.angle}°`, b.x1 - 1.5 * b.sc, b.y0 + 3.6 * b.sc, { size, weight: 700, align: 'right', base: 'middle', color: read.angle ? AMBER : PLATE_COLORS.dust });
  ctx.strokeStyle = PLATE_COLORS.steel;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0, cy);
  ctx.lineTo(x1, cy);
  ctx.stroke();
  if (read.held) plateText(ctx, 'HOLDS', b.x1 - 1.5 * b.sc, b.y0 + 6.5 * b.sc, { size, weight: 700, align: 'right', base: 'middle', color: AMBER });
  if (read.order !== 'single') {
    for (const sign of [-1, 1]) {
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse((x0 + x1) / 2, cy + sign * L * 0.2, L * 0.5, L * 0.07, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  atomDisc(ctx, x0, cy, L * 0.17, 'C');
  atomDisc(ctx, x1, cy, L * 0.17, 'C');
  const turn = (read.angle * Math.PI) / 180;
  const peg = (x, k, rot, dir) => {
    const ang = rot + (k / pegs) * Math.PI * 2;
    const py = cy + Math.sin(ang) * L * 0.4;
    const px = x + dir * (L * 0.2 + Math.cos(ang) * L * 0.08);
    ctx.strokeStyle = PLATE_COLORS.steel;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(px, py);
    ctx.stroke();
    atomDisc(ctx, px, py, L * 0.1, 'H');
  };
  for (let k = 0; k < pegs; k++) { peg(x0, k, 0, -1); peg(x1, k, turn, 1); }
}

const PAINTERS = { orb: paintOrb };

export function paintOrbKind(ctx, p, state, o) {
  const fn = PAINTERS[p.kind];
  if (!fn) return false;
  fn(ctx, p, state, o);
  return true;
}

export const printedOrb = p => (p.kind === 'orb' ? (p.props.atomLabel ? `${p.props.atomLabel} ${p.label}` : p.label) : undefined);
export const faceKeyOrb = (p, state) => (p.kind === 'orb' ? `${p.props.type}|${p.props.e}|${p.props.axis || ''}|${p.props.dir ?? ''}|${bondedOrb(state, p) ? 1 : 0}` : undefined);

export function paintOrbFixture(ctx, f, state, b) {
  if (f.kind === 'mixbowl') { paintBowl(ctx, f, state, b); return true; }
  if (f.kind === 'twist') { paintTwist(ctx, f, state, b); return true; }
  return false;
}

/* ------------------------------------------------------------------
   TABLE FURNITURE
   ------------------------------------------------------------------ */

/** An orbital piece. `type` is 's' | 'p' | 'd' | a hybrid; `atom` is the atom it belongs to (the other of two cannot be it). */
export const orbital = (id, type, atom, at, { e = 0, axis = null, to = null, dir = null, label = null, atomLabel = null } = {}) => ({
  id, kind: 'orb', label: label || (SUP[type] || type), at,
  props: { type, atom, e, ...(axis ? { axis } : {}), ...(to ? { to } : {}), ...(dir != null ? { dir } : {}), ...(atomLabel ? { atomLabel } : {}) }
});

/** A mixing bowl: the container the orbitals are dropped in, and the fixture that draws what comes out of it. */
export function mixbowl(id, at, { size = { w: 92, h: 42 }, hub = 'C', label = 'Mixer', bowlH = 26, cell = 13, dy = 4, out = null } = {}) {
  const bowlW = 48;
  const bowl = { id: `${id}-bowl`, label: '', at: { x: at.x - size.w / 2 + bowlW / 2 + 3, y: at.y + dy }, size: { w: bowlW, h: bowlH }, cell, props: { still: true } };
  return {
    bowl,
    fixture: { id, kind: 'mixbowl', label, at, size, noRun: true, dials: {}, props: { zone: bowl.id, hub, backdrop: true, ...(out ? { out } : {}) } }
  };
}

/** A twist: two ends of a bond and a knob that turns the far one. */
export function twist(id, at, order, { label = 'Bond', size = { w: 62, h: 42 } } = {}) {
  return {
    id, kind: 'twist', label, at, size, noRun: true,
    dials: { turn: { min: 0, max: 360, step: 15, value: 0, label: 'Far End' } },
    props: { order, margin: 4, top: 9 }
  };
}

