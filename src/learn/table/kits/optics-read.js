/**
 * kits/optics-read.js — What the optics kit's fixtures read, as pure functions of a table.
 *
 * LANTERNFALL'S FIRST THREE BENCHES, WORKED WITH THE HANDS (plan `bench-tabletop.md`, T4a). Nothing in this file decides
 * anything: every figure is a call to a planner in `lightdata.js` (`planTrace`, `planPrism`, `planPhotocell`, `planJump`,
 * `jumpsForLine`, `pulseNs`), the same ones the light bench draws from, over the same tables of lines, metals and rungs. The
 * kit only asks WHAT IS STANDING WHERE: the lamp in a screen's slot, the plate in the holder, the tube in the socket, the
 * electron on a rung. A stage's `check` and `verify:learn` read these, so what a picture shows, what the answer is graded on
 * and what the recomputation checks are one number.
 *
 * Pure: no DOM, no THREE, no state of its own.
 */

import {
  planTrace, planPrism, planPhotocell, planJump, jumpsForLine, pulseNs, nmToHz, isVisible, detectorFor,
  LINES, METALS, TRACE_SPAN_NM
} from '../../engine/lightdata.js';

/** A line on a reference strip sits on a line of the spectrum when the two are this close (nm): the prism's own resolution. */
export const LINE_TOL = 2;
/** The ruler a water wave is laid against, in metres. */
export const WATER_SPAN_M = 4.8;

/** The piece standing in slot `id`, or null. */
export function seated(state, id) {
  if (!id) return null;
  return Object.values(state.pieces).find(p => !p.hidden && p.zone === `slot:${id}`) ?? null;
}

/** Every piece standing in a slot of `ids`, as `{slot, piece}`. */
export function seatedAll(state, ids) {
  return ids.map(slot => ({ slot, piece: seated(state, slot) }));
}

/* ------------------------------------------------------------------
   THE WAVE SCREEN
   ------------------------------------------------------------------ */

/** The wavelength the colour dial of fixture `f` is at, in nm (null when it has no dial). */
export function dialNm(f) {
  const set = f.props.settings;
  const d = f.dials.colour;
  if (!set || !d) return null;
  return set[Math.round(d.value) - 1] ?? null;
}

/**
 * The wavelength a lamp piece shines at on the screen `f`: its own, or (a tuned lamp) wherever the screen's colour dial
 * has it. A water wave (the flume's strip) has a crest spacing in metres instead.
 */
export function lampNm(f, piece) {
  if (!piece) return null;
  if (piece.props.tuned) return dialNm(f);
  return piece.props.nm ?? null;
}

/**
 * What a wave screen reads: null when nothing stands in its slot, else
 * `{kind: 'light', piece, nm, plan, e14, crests}` or `{kind: 'water', piece, metres, hz, crests, speed}`.
 */
export function waveRead(state, fid) {
  const f = state.fixtures[fid];
  const piece = seated(state, f.props.slot);
  if (!piece) return null;
  if (piece.props.water) {
    const { metres, hz } = piece.props.water;
    return { kind: 'water', piece, metres, hz, crests: WATER_SPAN_M / metres, speed: Number((metres * hz).toFixed(2)) };
  }
  const nm = lampNm(f, piece);
  if (nm == null) return null;
  const plan = planTrace(nm);
  return { kind: 'light', piece, nm, plan, e14: plan.e14, crests: plan.crests };
}

/**
 * A lamp (or a tube, or a filament) is LIT while it stands in a source slot of some fixture: a screen's `slot`, a spectrograph's
 * `src`, a photocell's `lamp`. Out of one it is a dark piece on the table, so the colour of its glass is a reading it was put
 * in a screen to take.
 */
export function litSource(state, piece) {
  if (!piece || typeof piece.zone !== 'string' || !piece.zone.startsWith('slot:')) return false;
  const slot = piece.zone.slice(5);
  return Object.values(state.fixtures).some(f => f.props.slot === slot || f.props.src === slot || f.props.lamp === slot);
}

/** The frequency the stage's lamp makes, as the screen would print it. */
export function rateOf(nm) { return planTrace(nm).e14; }

/* ------------------------------------------------------------------
   THE LOG RULER (radio to X-ray)
   ------------------------------------------------------------------ */

/** What the log ruler reads for the source in its slot: its wavelength in nm, or null. */
export function rulerRead(state, fid) {
  const f = state.fixtures[fid];
  const piece = seated(state, f.props.slot);
  if (!piece || piece.props.nm == null) return null;
  return { piece, nm: piece.props.nm };
}

/* ------------------------------------------------------------------
   THE PULSE TIMER
   ------------------------------------------------------------------ */

/** The marks along the timer's rail: each a slot and how far along the rail it is, in metres. */
export const marksOf = f => f.props.marks || [];

/** The detectors standing on the rail, nearest the lamp first, with how far from the lamp each is. */
export function detectorsOn(state, fid) {
  const f = state.fixtures[fid];
  return marksOf(f)
    .map(m => ({ slot: m.slot, metres: m.metres, piece: seated(state, m.slot) }))
    .filter(m => m.piece && m.piece.kind === 'detector')
    .sort((a, b) => a.metres - b.metres);
}

/** The gap between the two detectors in metres, and the time a pulse takes to cross it: null until both stand on the rail. */
export function pulseRead(state, fid) {
  const d = detectorsOn(state, fid);
  if (d.length < 2) return null;
  const gap = Number((d[d.length - 1].metres - d[0].metres).toFixed(3));
  return { gap, ns: pulseNs(gap), near: d[0], far: d[d.length - 1] };
}

/** The last timing the rail made (the hidden dials it keeps), or null when none has been taken. */
export function timedLast(state, fid) {
  const f = state.fixtures[fid];
  const ns = f.dials.ns?.value ?? 0;
  const gap = f.dials.gap?.value ?? 0;
  return ns > 0 ? { gap, ns } : null;
}

/* ------------------------------------------------------------------
   THE SPECTROGRAPH (prism, tubes, strips)
   ------------------------------------------------------------------ */

/** The rig `planPrism` wants for whatever stands in the socket (and the cell in front of it), or null for an empty socket. */
export function rigFor(src, cell) {
  if (!src) return null;
  if (src.kind === 'filament') {
    if (cell && cell.kind === 'cell') return { source: { type: 'cool', gas: cell.props.gas } };
    return { source: { type: 'filament' } };
  }
  if (src.kind === 'tube') return { source: { type: 'tube', gas: src.props.gas } };
  if (src.kind === 'lamp' && src.props.nm != null) return { source: { type: 'lamp', nm: src.props.nm } };
  return null;
}

/**
 * What the spectrograph shows: the prism's plan for the source, the lines of the reference strip beside it and which of
 * those fall on a line of the band (a bright line of a gas, or a dark one cut out of the filament's light), and whether
 * either detector strip past the band's ends is lit.
 */
export function bandRead(state, fid) {
  const f = state.fixtures[fid];
  const src = seated(state, f.props.src);
  const cell = f.props.cell ? seated(state, f.props.cell) : null;
  const ref = f.props.ref ? seated(state, f.props.ref) : null;
  const rig = rigFor(src, cell);
  const plan = rig ? planPrism(rig) : null;
  const seen = plan ? (plan.continuous ? plan.dark : plan.bright) : [];
  const refLines = ref ? (LINES[ref.props.gas] || []).filter(isVisible) : [];
  const matched = refLines.filter(n => seen.some(m => Math.abs(m - n) <= LINE_TOL));
  const uv = Boolean(plan && (plan.glowsBeyond || plan.beyond.some(n => detectorFor(n) === 'ultraviolet')));
  const ir = Boolean(plan && (plan.glowsBeyond || plan.beyond.some(n => detectorFor(n) === 'infrared')));
  // What the band is, in a word a tray can be named for: lit all the way across, a few exact lines, or nothing.
  const shape = !plan ? 'dark' : plan.continuous ? 'band' : plan.bright.length ? 'lines' : 'dark';
  return { src, cell, ref, plan, seen, refLines, matched, uv, ir, shape, whole: refLines.length > 0 && matched.length === refLines.length };
}

/** Which detector strip, or the eye, picks up the light of a lamp at `nm`. */
export function pickedUpBy(nm) {
  if (isVisible(nm)) return 'eye';
  return detectorFor(nm) === 'infrared' ? 'infrared' : 'ultraviolet';
}

/* ------------------------------------------------------------------
   THE PHOTOCELL
   ------------------------------------------------------------------ */

/** What the photocell reads: the plate in the holder, the lamp's colour and brightness, and `planPhotocell`'s answer. */
export function cellRead(state, fid) {
  const f = state.fixtures[fid];
  const plate = seated(state, f.props.holder);
  const metal = plate?.props.metal ?? null;
  let nm = null;
  if (f.props.lamp) nm = seated(state, f.props.lamp)?.props.nm ?? null;
  else nm = dialNm(f);
  const brightness = f.dials.brightness ? Math.round(f.dials.brightness.value) : (f.props.brightness ?? 3);
  const plan = metal && nm != null ? planPhotocell(metal, nm, brightness) : null;
  return {
    fixture: f, plate, metal, nm, brightness, plan,
    count: plan ? plan.count : 0,
    speed: plan ? plan.speed : 0,
    freed: Boolean(plan && plan.freed),
    f14: nm != null ? Number((nmToHz(nm) / 1e14).toFixed(2)) : null
  };
}

/** The lowest colour setting of a dial, in order, at which `metal` frees electrons at `brightness` (the threshold the stage means). */
export function firstFreeing(settings, metal, brightness = 3) {
  for (let i = 0; i < settings.length; i++) if (planPhotocell(metal, settings[i], brightness).freed) return i + 1;
  return null;
}

/* ------------------------------------------------------------------
   THE ENERGY LADDER
   ------------------------------------------------------------------ */

/** The rung number the ladder gives the open top: an electron there has left the atom. */
export const TOP = 7;

/** The slots of ladder `f`, rung number to slot id (the top's key is `TOP`). */
export const rungSlots = f => f.props.rungs || {};

/** The rung (1 to 6, or `TOP`) the electron of ladder `f` stands on, or null while it is off the ladder. */
export function rungOf(state, fid) {
  const f = state.fixtures[fid];
  const e = state.pieces[f.props.electron];
  if (!e || !e.zone || !e.zone.startsWith('slot:')) return null;
  const slot = e.zone.slice(5);
  for (const [n, id] of Object.entries(rungSlots(f))) if (id === slot) return Number(n);
  return null;
}

/** What the ladder's electron has done: the lines it has made (nm, in order), the last move, and whether it has left. */
export function ladderRead(state, fid) {
  const f = state.fixtures[fid];
  const e = state.pieces[f.props.electron];
  const lines = e?.props.lines || [];
  const last = e?.props.last || null;
  return {
    fixture: f, electron: e, rung: rungOf(state, fid),
    lines: lines.slice(), last, out: rungOf(state, fid) === TOP,
    // The probe slot: a line put there is asked of every pair of rungs.
    probe: f.props.probe ? seated(state, f.props.probe) : null
  };
}

/** The jumps that make the line a probe chip carries, from every pair of rungs. */
export function probeJumps(chip) {
  return chip && chip.props.nm != null ? jumpsForLine(chip.props.nm) : [];
}

/**
 * Write the electron's move into its own props (the kit's `settle` calls this after every action). A drop from rung `hi` to
 * rung `lo` gives out a line, `planJump(hi, lo).nm`, which is kept once; a climb takes a photon in and gives out nothing; the
 * open top is a climb that does not stop. Nothing here chooses an outcome: the move is where the hand put the electron.
 */
export function settleLadder(s, f) {
  const e = s.pieces[f.props.electron];
  if (!e) return;
  const n = rungOf(s, f.id);
  if (n === null) return;
  const prev = e.props.at ?? 1;
  if (n === prev) return;
  e.props.at = n;
  if (n === TOP) { e.props.last = { from: prev, to: 'top', up: true }; return; }
  if (prev === TOP) { e.props.last = { from: 'top', to: n, up: false, nm: null }; return; }
  if (n < prev) {
    const nm = Number(planJump(prev, n).nm.toFixed(1));
    e.props.last = { hi: prev, lo: n, nm, up: false };
    const lines = (e.props.lines || []).slice();
    if (!lines.includes(nm)) lines.push(nm);
    e.props.lines = lines;
  } else {
    e.props.last = { hi: n, lo: prev, nm: Number(planJump(n, prev).nm.toFixed(1)), up: true };
  }
}

/** Is `nm` a line the ladder has made? */
export function made(read, nm, tol = 3) { return read.lines.some(x => Math.abs(x - nm) < tol); }

export { TRACE_SPAN_NM, METALS, LINES };
