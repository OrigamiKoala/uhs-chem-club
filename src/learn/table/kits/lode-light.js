/**
 * kits/lode-light.js — Lodestone's light and d-orbital instruments (unit12, q5-colour, q6-spin, the Coil).
 *
 *   spec    white light from a lamp through the vial in its holder, then a prism: a strip of the six colours with the ones the solution
 *           took out drawn dark. Options: tap a colour on the strip to answer; "Add Ammonia" (the vial's complex changes); a small
 *           ladder whose gap is the energy of the light taken out; a cursor that reads the wavelength at the middle of the dark band;
 *           a cover (sealed: only the vial's own colour is seen).
 *   wheel   the six-colour wheel: each colour opposite its complementary colour; tap a colour to answer.
 *   cfield  the five d orbitals of a metal ion, each drawn in the plane it lies in, with the ligands' lone pairs on the axes closing in
 *           as the "Ligands" dial turns; an unlabelled ladder beside them shows two levels rise and three fall. Tap an orbital to mark it.
 *   dsplit  the d orbitals split by six ligands: three lower, two upper, the gap between them drawn to an energy scale. Options: tap
 *           orbitals to place electrons and "Test Energy" (with a pairing cost drawn as a bar); a "d electrons" dial and a "Gap" dial with
 *           "Fill Lowest"; a ruler of photon energies, one bar per colour, to tap the colour whose photons match the gap; a vial slot that
 *           loads a complex's d electrons, with "Shine Light" showing whether an electron can be lifted.
 *   vial    a sample tube of one complex, coloured as its solution, that keeps what an instrument read from it (its pull, its band).
 *
 * Every number is `lodedata.js`'s (COMPLEXES, BANDS, photonKJ, splitLevels, GAPS, PAIR_KJ, fillSplit, testEnergy).
 */

import { registerFixture, registerPiece } from './lode-registry.js';
import { C, frameOf, say, title, orbital, glide, since, paintPick } from './lode-draw.js';
import { COMPLEXES, BANDS, COMPLEMENT, photonKJ, splitLevels, GAPS, PAIR_KJ, fillSplit, testEnergy, unpaired, total, fillLevel } from '../../engine/lodedata.js';

const seated = (state, slot) => (slot ? Object.values(state.pieces).find(p => !p.hidden && p.zone === `slot:${slot}`) || null : null);
const bandE = b => ({ lo: photonKJ(b.hi), hi: photonKJ(b.lo) });

/* ================================================================== vial */

export const VIAL_RECT = Object.freeze({ hw: 4.6, hh: 7.2 });
export const vial = (id, cx, at, props = {}) => ({ id, kind: 'vial', label: props.name || COMPLEXES[cx].formula, at: { ...at }, props: { cx, ...props } });

registerPiece('vial', {
  kind: { r: 6.4, rect: VIAL_RECT },
  paint(ctx, p, state, o) {
    const { x, y, sc, lit } = o;
    const c = COMPLEXES[p.props.cx];
    const w = VIAL_RECT.hw * 2 * sc * 0.62; const h = VIAL_RECT.hh * 2 * sc * 0.72;
    const tint = p.props.sealedTint ? '#7a7466' : c.tint;
    ctx.fillStyle = tint; ctx.globalAlpha = 0.9; ctx.fillRect(x - w / 2, y - h * 0.15, w, h * 0.62); ctx.globalAlpha = 1;
    ctx.strokeStyle = lit ? C.amber : '#cfd8de'; ctx.lineWidth = lit ? 2.5 : 1.5;
    ctx.beginPath(); ctx.moveTo(x - w / 2, y - h * 0.5); ctx.lineTo(x - w / 2, y + h * 0.42); ctx.quadraticCurveTo(x, y + h * 0.62, x + w / 2, y + h * 0.42); ctx.lineTo(x + w / 2, y - h * 0.5); ctx.stroke();
    ctx.lineWidth = 1;
    say(ctx, p.props.name || c.formula, x, y - h * 0.62, Math.max(6, 1.55 * sc), { align: 'center', color: C.text, weight: 700, sans: true, maxW: VIAL_RECT.hw * 2 * sc * 1.25 });
    if (p.props.pull != null) say(ctx, `pull ${p.props.pull}`, x, y + h * 0.78, Math.max(6, 1.45 * sc), { align: 'center', color: C.amber, weight: 700 });
  },
  faceKey: p => `vial:${p.props.cx}:${p.props.pull ?? ''}:${p.props.name || ''}`,
  printed: p => p.props.name || COMPLEXES[p.props.cx].formula
});

/* ================================================================== spec */

/**
 * `slot` true gives the holder a slot (returned) for a vial; `taps` answers by tapping the strip; `ammonia` adds the key; `gap` draws the
 * small ladder; `cursor` prints the wavelength at the middle of the dark band; `sealed` covers the strip. `fixed` a complex held in the
 * holder with no vial piece.
 */
export function specFixture(id, at, { w = 100, h = 44, taps = false, ammonia = false, gap = false, cursor = false, sealed = false, fixed = null, title: ttl = 'Lamp, sample and prism' } = {}) {
  const dials = taps ? { band: { min: 0, max: 6, step: 1, value: 0, label: 'Colour' } } : {};
  const slotId = `${id}.holder`;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  return {
    fixture: {
      id, kind: 'spec', label: ttl, at: { ...at }, size: { w, h }, dials, ...(ammonia ? { runLabel: 'Add Ammonia' } : { noRun: true }),
      props: { hidden: Object.keys(dials), slot: fixed ? null : slotId, fixed, gap, cursor, sealed, ammonia: Boolean(ammonia), added: false, tapBands: taps }
    },
    slot: fixed ? null : { id: slotId, label: 'Sample', at: { x: x0 - 8, y: y0 + h / 2 }, size: { w: 13, h: 18 } }
  };
}

/** What the instrument reads: the complex in the holder (after any ammonia), the bands it takes out, the colour chosen. */
export function specRead(state, id) {
  const f = state.fixtures[id];
  const p = f.props;
  const v = p.fixed ? null : seated(state, p.slot);
  let cx = p.fixed || (v && v.props.cx) || null;
  if (cx === 'cu-aq' && p.added) cx = 'cu-nh3';
  const c = cx ? COMPLEXES[cx] : null;
  const chosenBand = f.dials.band ? BANDS[Math.round(f.dials.band.value) - 1]?.id || null : null;
  return { cx, complex: c, absorb: c ? c.absorb : [], nm: c?.nm ?? null, chosen: chosenBand, added: p.added, vial: v };
}

const stripGeom = f => ({ x0: f.props.fixed ? 34 : 14, x1: f.size.w - (f.props.gap ? 26 : 4), y0: 14, y1: 24 });

function paintSpec(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = specRead(state, f.id);
  title(ctx, f, F, b);
  // The lamp shines white light through the sample (in the holder on the left, or held here) and on into the prism.
  const ly = 16 + 9;
  if (p.fixed) {
    ctx.fillStyle = '#e9e1cc'; ctx.beginPath(); ctx.arc(F.x(6), F.y(ly), F.len(2.6), 0, Math.PI * 2); ctx.fill();
    say(ctx, 'white lamp', F.x(6), F.y(ly + 5), F.size(1.7, 6), { align: 'center', color: C.dust });
    ctx.strokeStyle = 'rgba(233,225,204,0.7)'; ctx.lineWidth = Math.max(2, F.len(0.9));
    ctx.beginPath(); ctx.moveTo(F.x(9), F.y(ly)); ctx.lineTo(F.x(16), F.y(ly)); ctx.stroke(); ctx.lineWidth = 1;
  } else say(ctx, 'white light through the sample', F.x(2.2), F.y(f.size.h - 3.4), F.size(1.7, 6), { color: C.dim });
  if (p.fixed) {
    ctx.fillStyle = r.complex.tint; ctx.globalAlpha = 0.85; ctx.fillRect(F.x(16), F.y(ly - 6), F.len(10), F.len(12)); ctx.globalAlpha = 1;
    say(ctx, r.complex.formula, F.x(21), F.y(ly + 9), F.size(1.7, 6), { align: 'center', color: C.text, sans: true });
  }
  const g = stripGeom(f);
  // What gets through: the beam from the holder to the prism, tinted by the solution.
  if (r.complex) {
    ctx.strokeStyle = r.complex.tint; ctx.lineWidth = Math.max(2, F.len(0.9));
    ctx.beginPath(); ctx.moveTo(F.x(p.fixed ? 28 : 1), F.y(p.fixed ? ly : (g.y0 + g.y1) / 2)); ctx.lineTo(F.x(g.x0 - 1), F.y((g.y0 + g.y1) / 2)); ctx.stroke(); ctx.lineWidth = 1;
  }
  // The strip, violet to red.
  const bw = (g.x1 - g.x0) / 6;
  say(ctx, 'light that got through, by colour', F.x(g.x0), F.y(g.y0 - 2.4), F.size(1.7, 6), { color: C.dust });
  if (p.sealed) {
    ctx.fillStyle = '#2a2620'; ctx.fillRect(F.x(g.x0), F.y(g.y0), F.len(g.x1 - g.x0), F.len(g.y1 - g.y0));
    say(ctx, 'covered', F.x((g.x0 + g.x1) / 2), F.y((g.y0 + g.y1) / 2), F.size(2, 6.5), { align: 'center', color: C.dim });
  } else {
    BANDS.forEach((band, i) => {
      const dark = r.complex ? r.absorb.includes(band.id) : false;
      const shown = glide(`${f.id}:b${i}:${r.cx}`, b, dark ? 1 : 0, dark ? 1 : 0, 1.2);
      ctx.fillStyle = band.css; ctx.globalAlpha = r.complex ? 1 - 0.85 * shown : 0.25;
      ctx.fillRect(F.x(g.x0 + i * bw), F.y(g.y0), F.len(bw), F.len(g.y1 - g.y0));
      ctx.globalAlpha = 1;
      const chosen = r.chosen === band.id;
      if (chosen) { ctx.strokeStyle = C.amber; ctx.lineWidth = 2.5; ctx.strokeRect(F.x(g.x0 + i * bw) + 1, F.y(g.y0) + 1, F.len(bw) - 2, F.len(g.y1 - g.y0) - 2); ctx.lineWidth = 1; }
      say(ctx, band.name, F.x(g.x0 + (i + 0.5) * bw), F.y(g.y1 + 2.2), F.size(1.7, 6), { align: 'center', color: chosen ? C.amber : C.dust, weight: chosen ? 700 : 500, maxW: F.len(bw) });
    });
    say(ctx, '400 nm', F.x(g.x0), F.y(g.y1 + 5.2), F.size(1.5, 5.5), { color: C.dim });
    say(ctx, '700 nm', F.x(g.x1), F.y(g.y1 + 5.2), F.size(1.5, 5.5), { align: 'right', color: C.dim });
    if (r.complex && r.nm > 700) say(ctx, 'the dark band reaches past the red end', F.x(g.x1), F.y(g.y1 + 8.2), F.size(1.6, 5.8), { align: 'right', color: C.dust });
    if (!r.complex) say(ctx, 'Put a sample in the holder', F.x((g.x0 + g.x1) / 2), F.y((g.y0 + g.y1) / 2), F.size(1.9, 6.2), { align: 'center', color: C.text });
    if (p.cursor && r.complex && r.nm && r.nm <= 700) {
      const x = g.x0 + ((r.nm - 400) / 300) * (g.x1 - g.x0);
      ctx.strokeStyle = C.text; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(F.x(x), F.y(g.y0 - 1)); ctx.lineTo(F.x(x), F.y(g.y1 + 1)); ctx.stroke(); ctx.lineWidth = 1;
      say(ctx, `middle of the dark band: ${r.nm} nm`, F.x(g.x0), F.y(f.size.h - 3.4), F.size(2.1, 7), { color: C.amber, weight: 700 });
    }
  }
  // The gap: an electron's two levels, as far apart as the energy of the light taken out.
  if (p.gap && r.complex && r.nm) {
    const E = photonKJ(r.nm);
    const shownE = glide(`${f.id}:gap`, b, E, E, 1.4);
    const gx = f.size.w - 22; const base = f.size.h - 6; const k = 0.09;
    say(ctx, 'the gap', F.x(gx), F.y(12), F.size(1.8, 6), { color: C.dust });
    ctx.strokeStyle = C.d3; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(F.x(gx), F.y(base)); ctx.lineTo(F.x(gx + 12), F.y(base)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(F.x(gx), F.y(base - shownE * k)); ctx.lineTo(F.x(gx + 12), F.y(base - shownE * k)); ctx.stroke(); ctx.lineWidth = 1;
    ctx.strokeStyle = C.amber; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(F.x(gx + 15), F.y(base)); ctx.lineTo(F.x(gx + 15), F.y(base - shownE * k)); ctx.stroke(); ctx.setLineDash([]);
    if (p.cursor) say(ctx, '?', F.x(gx + 17), F.y(base - shownE * k / 2), F.size(2, 6.5), { color: C.amber, weight: 700 });
  }
  paintPick(ctx, f, state, b);
}

function specTaps(f) {
  if (!f.props.tapBands) return [];
  const g = stripGeom(f);
  const bw = (g.x1 - g.x0) / 6;
  return BANDS.map((_, i) => ({ x0: g.x0 + i * bw, x1: g.x0 + (i + 1) * bw, y0: g.y0, y1: g.y1 + 3.5, dial: 'band', value: i + 1 }));
}

function runSpec(state, fid) {
  const f = state.fixtures[fid];
  const r = specRead(state, fid);
  if (!r.complex) return { noop: 'There is no sample in the holder.' };
  if (f.props.added) return { noop: 'Ammonia has already been added.' };
  if (r.cx !== 'cu-aq') return { noop: 'Ammonia changes nothing in this sample.' };
  f.props.added = true;
  return { stamp: {} };
}

registerFixture('spec', { paint: paintSpec, run: runSpec, tapZones: specTaps, live: () => true });

/* ================================================================== wheel */

export function wheelFixture(id, at, { size = 30, taps = false, title: ttl = 'Colour wheel' } = {}) {
  const dials = taps ? { colour: { min: 0, max: 6, step: 1, value: 0, label: 'Colour' } } : {};
  return { id, kind: 'wheel', label: ttl, at: { ...at }, size: { w: size, h: size + 4 }, dials, noRun: true, props: { hidden: Object.keys(dials), tapColours: taps } };
}
export const wheelRead = (state, id) => { const v = Math.round(state.fixtures[id].dials.colour?.value ?? 0); return v ? BANDS[v - 1].id : null; };

const WHEEL_ORDER = ['red', 'orange', 'yellow', 'green', 'blue', 'violet'];
function wheelGeom(f) { return { cx: f.size.w / 2, cy: 4 + (f.size.h - 4) / 2, R: Math.min(f.size.w, f.size.h - 4) * 0.42 }; }

function paintWheel(ctx, f, state, b) {
  const F = frameOf(b);
  title(ctx, f, F, b);
  const G = wheelGeom(f);
  const chosen = f.props.tapColours ? wheelRead(state, f.id) : null;
  WHEEL_ORDER.forEach((id, i) => {
    const band = BANDS.find(x => x.id === id);
    const a0 = -Math.PI / 2 + (i - 0.5) * (Math.PI / 3); const a1 = a0 + Math.PI / 3;
    ctx.fillStyle = band.css; ctx.beginPath(); ctx.moveTo(F.x(G.cx), F.y(G.cy)); ctx.arc(F.x(G.cx), F.y(G.cy), F.len(G.R), a0, a1); ctx.closePath(); ctx.fill();
    if (chosen === id) { ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.stroke(); ctx.lineWidth = 1; }
    const am = (a0 + a1) / 2;
    say(ctx, band.name, F.x(G.cx + Math.cos(am) * G.R * 0.64), F.y(G.cy + Math.sin(am) * G.R * 0.64), F.size(1.6, 6), { align: 'center', color: '#14100c', weight: 700 });
  });
  say(ctx, 'opposite colours are complementary', F.x(f.size.w / 2), F.y(f.size.h - 1.8), F.size(1.45, 5.5), { align: 'center', color: C.dim, maxW: F.len(f.size.w - 2) });
}

function wheelTaps(f) {
  if (!f.props.tapColours) return [];
  const G = wheelGeom(f);
  return WHEEL_ORDER.map((id, i) => {
    const am = -Math.PI / 2 + i * (Math.PI / 3);
    const x = G.cx + Math.cos(am) * G.R * 0.6; const y = G.cy + Math.sin(am) * G.R * 0.6; const s = G.R * 0.3;
    return { x0: x - s, x1: x + s, y0: y - s, y1: y + s, dial: 'colour', value: BANDS.findIndex(bd => bd.id === id) + 1 };
  });
}

registerFixture('wheel', { paint: paintWheel, tapZones: wheelTaps });

/* ================================================================== cfield */

const ORBITALS = [
  { id: 'xy', name: 'dxy', plane: 'x and y', lobes: 'between', points: false },
  { id: 'x2y2', name: 'dx²−y²', plane: 'x and y', lobes: 'on', points: true },
  { id: 'z2', name: 'dz²', plane: 'x and z', lobes: 'z', points: true },
  { id: 'xz', name: 'dxz', plane: 'x and z', lobes: 'between', points: false },
  { id: 'yz', name: 'dyz', plane: 'y and z', lobes: 'between', points: false }
];
export const CF_ORBITALS = ORBITALS;

export function cfieldFixture(id, at, { w = 140, h = 52, title: ttl = 'The five d orbitals of Ti³⁺ and six ligands' } = {}) {
  const dials = { near: { min: 0, max: 4, step: 1, value: 0, label: 'Ligands', labels: ['Far', '', '', '', 'Bonded'] } };
  const hidden = [];
  ORBITALS.forEach((_, i) => { dials[`o${i}`] = { min: 0, max: 1, step: 1, value: 0, label: `Orbital ${i + 1}` }; hidden.push(`o${i}`); });
  return { id, kind: 'cfield', label: ttl, at: { ...at }, size: { w, h }, dials, noRun: true, props: { hidden } };
}
export const cfieldRead = (state, id) => { const f = state.fixtures[id]; return { near: Math.round(f.dials.near.value), marked: ORBITALS.filter((_, i) => Math.round(f.dials[`o${i}`].value) === 1).map(o => o.id) }; };

function cfGeom(f) {
  const top = 15; const ladderW = 22; const iw = (f.size.w - ladderW - 6) / 5;
  return { top, iw, ih: f.size.h - top - 9, ladderX: f.size.w - ladderW - 1, ladderW };
}

/** One orbital in its plane: two or four lobes, the axes, and the ligands' lone pairs on the axes at the distance the dial sets. */
function drawOrbital(ctx, F, o, x0, y0, w, h, near, marked) {
  const cx = F.x(x0 + w / 2); const cy = F.y(y0 + h / 2 - 1); const R = F.len(Math.min(w, h) * 0.3);
  ctx.strokeStyle = C.dim; ctx.beginPath(); ctx.moveTo(cx - R * 1.6, cy); ctx.lineTo(cx + R * 1.6, cy); ctx.moveTo(cx, cy - R * 1.6); ctx.lineTo(cx, cy + R * 1.6); ctx.stroke();
  const lobe = (ang, len, wid) => {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
    ctx.fillStyle = marked ? 'rgba(217,148,35,0.55)' : 'rgba(111,143,176,0.55)'; ctx.strokeStyle = marked ? C.amber : C.d3;
    ctx.beginPath(); if (ctx.ellipse) ctx.ellipse(len * 0.55, 0, len * 0.5, wid, 0, 0, Math.PI * 2); else ctx.arc(len * 0.55, 0, wid, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  };
  if (o.lobes === 'on') for (let k = 0; k < 4; k++) lobe(k * Math.PI / 2, R * 1.1, R * 0.28);
  else if (o.lobes === 'between') for (let k = 0; k < 4; k++) lobe(Math.PI / 4 + k * Math.PI / 2, R * 1.1, R * 0.28);
  else { lobe(-Math.PI / 2, R * 1.25, R * 0.3); lobe(Math.PI / 2, R * 1.25, R * 0.3); ctx.strokeStyle = marked ? C.amber : C.d3; ctx.beginPath(); if (ctx.ellipse) ctx.ellipse(cx, cy, R * 0.55, R * 0.18, 0, 0, Math.PI * 2); ctx.stroke(); }
  // Lone pairs on the four axes drawn in this plane.
  const d = R * (2.2 - near * 0.24);
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    ctx.fillStyle = C.nIn; ctx.beginPath(); ctx.arc(cx + dx * d, cy + dy * d, Math.max(2.4, F.len(0.85)), 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d8e4f0'; ctx.stroke();
  }
  say(ctx, o.name, cx, F.y(y0 + h - 3.2), F.size(2.1, 7), { align: 'center', color: marked ? C.amber : C.text, weight: 700, sans: true });
  say(ctx, `drawn in ${o.plane}`, cx, F.y(y0 + h - 0.6), F.size(1.5, 5.5), { align: 'center', color: C.dim });
}

function paintCfield(ctx, f, state, b) {
  const F = frameOf(b);
  const r = cfieldRead(state, f.id);
  const G = cfGeom(f);
  const near = glide(`${f.id}:near`, b, r.near, r.near, 0.9);
  ORBITALS.forEach((o, i) => {
    const x0 = 2 + i * G.iw;
    ctx.strokeStyle = r.marked.includes(o.id) ? C.amber : C.rim; ctx.strokeRect(Math.round(F.x(x0 + 0.4)) + 0.5, Math.round(F.y(G.top)) + 0.5, Math.round(F.len(G.iw - 0.8)), Math.round(F.len(G.ih)));
    drawOrbital(ctx, F, o, x0, G.top, G.iw, G.ih, near, r.marked.includes(o.id));
  });
  // The ladder: the five levels, unlabelled; as the ligands close in, two rise and three fall.
  const lx = G.ladderX; const mid = G.top + G.ih / 2; const spread = near * 2.6;
  say(ctx, 'Energy of each', F.x(lx), F.y(G.top - 1.5), F.size(1.6, 6), { color: C.dust });
  say(ctx, 'orbital', F.x(lx), F.y(G.top + 1.2), F.size(1.6, 6), { color: C.dust });
  const up = [0, 1].map(k => ({ y: mid - spread * 0.6 * 1.6, x: lx + 2 + k * 9 }));
  const down = [0, 1, 2].map(k => ({ y: mid + spread * 0.4 * 1.6, x: lx + 1 + k * 6.6 }));
  ctx.strokeStyle = C.d3; ctx.lineWidth = 2.4;
  for (const l of up) { ctx.beginPath(); ctx.moveTo(F.x(l.x), F.y(l.y)); ctx.lineTo(F.x(l.x + 7.5), F.y(l.y)); ctx.stroke(); }
  for (const l of down) { ctx.beginPath(); ctx.moveTo(F.x(l.x), F.y(l.y)); ctx.lineTo(F.x(l.x + 5.4), F.y(l.y)); ctx.stroke(); }
  ctx.lineWidth = 1;
  if (r.near > 0) { ctx.strokeStyle = C.amber; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(F.x(lx + 21), F.y(up[0].y)); ctx.lineTo(F.x(lx + 21), F.y(down[0].y)); ctx.stroke(); ctx.setLineDash([]); }
  say(ctx, 'Tap an orbital to mark it', F.x(2.2), F.y(f.size.h - 3), F.size(1.8, 6), { color: C.dim });
}

function cfieldTaps(f) {
  const G = cfGeom(f);
  return ORBITALS.map((_, i) => ({ x0: 2 + i * G.iw, x1: 2 + (i + 1) * G.iw, y0: G.top, y1: G.top + G.ih, dial: `o${i}`, step: 1, wrap: true }));
}

registerFixture('cfield', { paint: paintCfield, tapZones: cfieldTaps, live: () => true });

/* ================================================================== dsplit */

/**
 * The split ladder. `mode` 'build' (tap orbitals, "Test Energy") | 'fill' ("Fill Lowest" for the dials' count and gap) | 'ruler' (a
 * fixed complex and a ruler of photon energies to tap) | 'vial' (a slot loads a vial's complex; "Shine Light"). `gap` kJ/mol, or `gapDial`
 * with narrow and wide; `count` the d electrons, or `countDial` options; `pair` draws the pairing cost; `cx` a complex for ruler mode.
 */
export function dsplitFixture(id, at, { mode = 'build', gap = GAPS.wide, gapDial = false, count = 6, countDial = null, pair = false, cx = null, w = 76, h = 50, title: ttl = 'd orbitals split by six ligands' } = {}) {
  const dials = {}; const hidden = [];
  if (countDial) dials.count = { min: 1, max: countDial.length, step: 1, value: 1, label: 'd electrons', labels: countDial.map(String) };
  if (gapDial) dials.gap = { min: 1, max: 2, step: 1, value: 1, label: 'Gap', labels: ['Narrow', 'Wide'] };
  if (mode === 'build') for (let i = 0; i < 5; i++) { dials[`b${i}`] = { min: 0, max: 2, step: 1, value: 0, label: `Orbital ${i + 1}` }; hidden.push(`b${i}`); }
  if (mode === 'ruler') { dials.band = { min: 0, max: 6, step: 1, value: 0, label: 'Colour' }; hidden.push('band'); }
  const runLabel = mode === 'build' ? 'Test Energy' : mode === 'fill' ? 'Fill Lowest' : mode === 'vial' ? 'Shine Light' : null;
  const slotId = `${id}.vial`;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  return {
    fixture: {
      id, kind: 'dsplit', label: ttl, at: { ...at }, size: { w, h }, dials, ...(runLabel ? { runLabel } : { noRun: true }),
      props: { mode, gap, gapDial, count, countDial, pair, cx, hidden, slot: mode === 'vial' ? slotId : null, test: null, filled: null, shone: null }
    },
    slot: mode === 'vial' ? { id: slotId, label: 'Sample', at: { x: x0 - 9, y: y0 + h / 2 }, size: { w: 13, h: 18 } } : null
  };
}

const gapOf = f => (f.props.gapDial ? (Math.round(f.dials.gap.value) === 2 ? GAPS.wide : GAPS.narrow) : f.props.gap);
const countOf = f => (f.props.countDial ? f.props.countDial[Math.round(f.dials.count.value) - 1] : f.props.count);

/** What the split ladder holds: the boxes (t2g then eg), its gap and count, and the last test or fill. */
export function dsplitRead(state, id) {
  const f = state.fixtures[id];
  const p = f.props;
  let occ; let cxId = p.cx; let d = countOf(f);
  if (p.mode === 'build') occ = Array.from({ length: 5 }, (_, i) => Math.round(f.dials[`b${i}`].value));
  else if (p.mode === 'vial') {
    const v = seated(state, p.slot); cxId = v ? v.props.cx : null; d = cxId ? COMPLEXES[cxId].d : 0;
    occ = cxId ? fillSplit(d, GAPS.narrow) : [0, 0, 0, 0, 0];
  } else if (p.mode === 'ruler') { d = COMPLEXES[cxId].d; occ = fillSplit(d, gapOf(f)); } else {
    const key = `${d}|${gapOf(f)}`;
    occ = p.filled && p.filled.key === key ? p.filled.occ : [0, 0, 0, 0, 0];
  }
  const band = f.dials.band ? BANDS[Math.round(f.dials.band.value) - 1]?.id || null : null;
  return { occ, n: total(occ), unpaired: unpaired(occ), gap: p.mode === 'ruler' ? photonKJ(COMPLEXES[cxId].nm) : gapOf(f), count: d, cx: cxId, band, test: p.test, filled: p.filled, shone: p.shone };
}

function dsGeom(f) {
  const top = Object.keys(f.dials).filter(n => !f.props.hidden.includes(n)).length ? 9.6 + 5 * (Object.keys(f.dials).filter(n => !f.props.hidden.includes(n)).length - 1) + 4.5 : 6;
  const bottom = f.size.h - 9;
  const bw = 7; const gapX = 2;
  const lowerX = 10; const upperX = lowerX + (bw + gapX) * 0.5;
  return { top, bottom, bw, gapX, lowerX, upperX, bh: 5.5 };
}

function paintDsplit(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = dsplitRead(state, f.id);
  title(ctx, f, F, b);
  const G = dsGeom(f);
  if (p.mode === 'vial' && !r.cx) { say(ctx, 'Load a sample', F.x(f.size.w / 2), F.y((G.top + G.bottom) / 2), F.size(2, 6.5), { align: 'center', color: C.dim }); return; }
  // Energy scale: the gap is drawn to scale, 0.09 units per kJ/mol at most, fitted to the height.
  const span = G.bottom - G.top - G.bh * 2 - 2;
  const k = Math.min(0.09, span / 320);
  const gapShown = glide(`${f.id}:gap`, b, r.gap, r.gap, 1.0);
  const yLow = G.bottom - G.bh; const yUp = yLow - gapShown * k - G.bh;
  ctx.strokeStyle = C.steel;
  ctx.beginPath(); ctx.moveTo(F.x(3), F.y(G.bottom)); ctx.lineTo(F.x(3), F.y(G.top)); ctx.stroke();
  say(ctx, 'Energy', F.x(4), F.y(G.top + 1), F.size(1.7, 6), { color: C.steel });
  const test = p.test && p.test.key === r.occ.join() ? p.test : null;
  for (let i = 0; i < 3; i++) orbital(ctx, F, G.lowerX + i * (G.bw + G.gapX), yLow, G.bw, G.bh, r.occ[i], { colour: C.d3, lit: Boolean(test && test.moves.some(m => m.from === i || m.to === i)) });
  for (let i = 0; i < 2; i++) orbital(ctx, F, G.upperX + i * (G.bw + G.gapX), yUp, G.bw, G.bh, r.occ[3 + i], { colour: C.d3, lit: Boolean(test && test.moves.some(m => m.from === 3 + i || m.to === 3 + i)) });
  // The gap, with its size.
  const gx = G.lowerX + 3 * (G.bw + G.gapX) + 2;
  ctx.strokeStyle = C.amber; ctx.setLineDash([2, 2]);
  ctx.beginPath(); ctx.moveTo(F.x(gx), F.y(yLow)); ctx.lineTo(F.x(gx), F.y(yUp + G.bh)); ctx.stroke(); ctx.setLineDash([]);
  if (p.mode !== 'ruler' || p.showGap) say(ctx, `gap ${Math.round(r.gap)} kJ/mol`, F.x(gx + 1.5), F.y((yLow + yUp + G.bh) / 2), F.size(1.9, 6.2), { color: C.amber, weight: 700 });
  else say(ctx, 'gap', F.x(gx + 1.5), F.y((yLow + yUp + G.bh) / 2), F.size(1.9, 6.2), { color: C.amber, weight: 700 });
  // The pairing cost, drawn to the same scale.
  if (p.pair) {
    const px = gx + 20;
    ctx.fillStyle = C.p3; ctx.fillRect(F.x(px), F.y(yLow - PAIR_KJ * k), F.len(3), F.len(PAIR_KJ * k));
    say(ctx, `pairing cost ${PAIR_KJ} kJ/mol`, F.x(px + 4), F.y(yLow - PAIR_KJ * k / 2), F.size(1.8, 6.2), { color: C.text, maxW: F.len(f.size.w - px - 5) });
  }
  // Test Energy's moves.
  if (test && !test.lowest) {
    const ph = ((b.clock || 0) % 1.6) / 1.6;
    const posOf = i => (i < 3 ? { x: G.lowerX + i * (G.bw + G.gapX) + G.bw / 2, y: yLow + G.bh / 2 } : { x: G.upperX + (i - 3) * (G.bw + G.gapX) + G.bw / 2, y: yUp + G.bh / 2 });
    for (const m of test.moves) {
      const a = posOf(m.from); const z = posOf(m.to);
      ctx.strokeStyle = C.amber; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(F.x(a.x), F.y(a.y)); ctx.lineTo(F.x(z.x), F.y(z.y)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.amber; ctx.beginPath(); ctx.arc(F.x(a.x + (z.x - a.x) * ph), F.y(a.y + (z.y - a.y) * ph), Math.max(2, F.len(0.6)), 0, Math.PI * 2); ctx.fill();
    }
  }
  const foot = f.size.h - 3.4;
  if (test) say(ctx, test.lowest ? 'Lowest energy' : `${test.moves.length} electron${test.moves.length > 1 ? 's' : ''} can move lower`, F.x(2.2), F.y(foot), F.size(2, 6.5), { color: test.lowest ? C.phosphor : C.amber, weight: 600, maxW: F.len(f.size.w * 0.55) });
  if (p.mode === 'build') say(ctx, `Electrons: ${r.n} of ${r.count}`, F.x(f.size.w - 2.2), F.y(G.top - 1), F.size(2, 6.5), { align: 'right', color: C.text, weight: 600 });
  if (p.mode === 'fill' && !r.filled?.occ) say(ctx, 'Press "Fill Lowest"', F.x(G.lowerX), F.y(foot), F.size(1.9, 6.2), { color: C.dim });
  // The ruler: one bar per colour, spanning the energies of that colour's photons, to the same scale.
  if (p.mode === 'ruler') {
    const rx = gx + 20; const bw = (f.size.w - rx - 3) / 6;
    say(ctx, 'photon energy of each colour', F.x(rx), F.y(G.top - 1), F.size(1.7, 6), { color: C.dust });
    BANDS.forEach((band, i) => {
      const e = bandE(band);
      const x = rx + i * bw;
      ctx.fillStyle = band.css; ctx.fillRect(F.x(x + 0.4), F.y(yLow - e.hi * k), F.len(bw - 0.8), F.len((e.hi - e.lo) * k));
      ctx.strokeStyle = 'rgba(184,175,160,0.35)'; ctx.beginPath(); ctx.moveTo(F.x(x + bw / 2), F.y(yLow)); ctx.lineTo(F.x(x + bw / 2), F.y(yLow - e.lo * k)); ctx.stroke();
      const on = r.band === band.id;
      if (on) { ctx.strokeStyle = C.amber; ctx.lineWidth = 2.5; ctx.strokeRect(F.x(x + 0.4), F.y(yLow - e.hi * k), F.len(bw - 0.8), F.len((e.hi - e.lo) * k)); ctx.lineWidth = 1; }
      say(ctx, band.name, F.x(x + bw / 2), F.y(yLow + 2.2), F.size(1.55, 5.5), { align: 'center', color: on ? C.amber : C.dust, maxW: F.len(bw) });
    });
    // The gap's height carried across the ruler as a line.
    ctx.strokeStyle = C.amber; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(F.x(gx), F.y(yUp + G.bh)); ctx.lineTo(F.x(f.size.w - 2), F.y(yUp + G.bh)); ctx.stroke(); ctx.setLineDash([]);
  }
  // Shine Light: whether an electron in the lower set can be lifted into a free place above.
  if (p.mode === 'vial' && r.shone && r.shone.cx === r.cx) {
    const can = r.occ.slice(0, 3).some(o => o > 0) && r.occ.slice(3).some(o => o < 2);
    say(ctx, can ? 'An electron is lifted: light is taken out' : 'No electron can be lifted: the light passes', F.x(2.2), F.y(foot), F.size(1.9, 6.2), { color: can ? C.amber : C.phosphor, weight: 700, maxW: F.len(f.size.w - 26) });
    if (can) {
      const ph = ((b.clock || 0) % 1.4) / 1.4;
      const from = r.occ.slice(0, 3).findIndex(o => o > 0); const to = 3 + r.occ.slice(3).findIndex(o => o < 2);
      const ax = G.lowerX + from * (G.bw + G.gapX) + G.bw / 2; const zx = G.upperX + (to - 3) * (G.bw + G.gapX) + G.bw / 2;
      ctx.fillStyle = C.amber; ctx.beginPath(); ctx.arc(F.x(ax + (zx - ax) * ph), F.y(yLow + G.bh / 2 + (yUp - yLow) * ph), Math.max(2.2, F.len(0.7)), 0, Math.PI * 2); ctx.fill();
    }
  }
  if (p.mode === 'vial' && r.cx) say(ctx, `${COMPLEXES[r.cx].formula}: ${r.count} d electron${r.count === 1 ? '' : 's'}`, F.x(f.size.w - 2.2), F.y(G.top - 1), F.size(1.9, 6.2), { align: 'right', color: C.text, weight: 600, sans: true, maxW: F.len(f.size.w * 0.6) });
}

function dsplitTaps(f, state) {
  const p = f.props;
  const G = dsGeom(f);
  if (p.mode === 'build') {
    const out = [];
    for (let i = 0; i < 3; i++) out.push({ x0: G.lowerX + i * (G.bw + G.gapX) - 0.4, x1: G.lowerX + i * (G.bw + G.gapX) + G.bw + 0.4, y0: G.bottom - G.bh - 1, y1: G.bottom + 0.6, dial: `b${i}`, step: 1, wrap: true });
    const r = dsplitRead(state, f.id);
    const span = G.bottom - G.top - G.bh * 2 - 2; const k = Math.min(0.09, span / 320);
    const yUp = G.bottom - G.bh - r.gap * k - G.bh;
    for (let i = 0; i < 2; i++) out.push({ x0: G.upperX + i * (G.bw + G.gapX) - 0.4, x1: G.upperX + i * (G.bw + G.gapX) + G.bw + 0.4, y0: yUp - 1, y1: yUp + G.bh + 1, dial: `b${3 + i}`, step: 1, wrap: true });
    return out;
  }
  if (p.mode === 'ruler') {
    const gx = G.lowerX + 3 * (G.bw + G.gapX) + 2; const rx = gx + 20; const bw = (f.size.w - rx - 3) / 6;
    return BANDS.map((_, i) => ({ x0: rx + i * bw, x1: rx + (i + 1) * bw, y0: G.top, y1: G.bottom + 3, dial: 'band', value: i + 1 }));
  }
  return [];
}

function runDsplit(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const r = dsplitRead(state, fid);
  if (p.mode === 'build') {
    const t = testEnergy(splitLevels(r.gap), r.occ, PAIR_KJ);
    p.test = { key: r.occ.join(), lowest: t.lowest, moves: t.moves };
    return { stamp: {} };
  }
  if (p.mode === 'fill') { p.filled = { key: `${r.count}|${r.gap}`, occ: fillSplit(r.count, r.gap) }; return { stamp: {} }; }
  if (p.mode === 'vial') { if (!r.cx) return { noop: 'There is no sample on the ladder.' }; p.shone = { cx: r.cx }; return { stamp: {} }; }
  return null;
}

registerFixture('dsplit', { paint: paintDsplit, run: runDsplit, tapZones: dsplitTaps, live: () => true });

export { COMPLEMENT, fillLevel };
