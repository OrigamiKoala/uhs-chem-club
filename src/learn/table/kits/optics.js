/**
 * kits/optics.js — The optics kit: lamps in screens, plates in a photocell, tubes in a spectrograph, an electron on a ladder.
 *
 * LANTERNFALL'S FIRST THREE BENCHES, WORKED WITH THE HANDS (plan `bench-tabletop.md`, T4a): `q1-wave` (a lamp put in a screen
 * draws its wave; the colour dial tunes it; a pulse is timed between two detectors set a measured distance apart; lamps are
 * arranged on a rail by frequency), `q2-photon` (metal plates dragged into a holder, the colour and the brightness set, the
 * electrons that leave counted into a cup) and `q3-lines` (tubes plugged into a socket, a reference strip slid alongside the
 * band, an electron dragged down the rungs of a ladder, each drop giving out its own line).
 *
 * A THIN WRAPPER OVER `lightdata.js` (`planTrace`, `planPrism`, `planPhotocell`, `planJump`, `jumpsForLine`, `pulseNs`), the
 * planners the light bench draws from, and it authors nothing: how many crests fit the ruler, which lines a gas gives, how many
 * electrons a plate frees and how fast, which line a drop makes and how long a pulse takes are the planner's answers, shown as
 * the picture. A stage declares what stands on the table and what to look for; it never declares what the table will read.
 *
 * Pieces never JOIN here (`nojoin`): they are put in slots, trays and on the rail, and the fixture that owns a slot reads
 * whatever stands in it (`optics-read.js`). Fixtures: `wave` (a screen), `ruler` (the log ruler), `pulse` (the timer), `band`
 * (the spectrograph), `cell` (the photocell), `ladder` and `lines` (the energy ladder and the strip its drops write on),
 * `plaque` (printed reference lines) and `marker` (a dial set to a figure the player has read off the table).
 */

import { registerKit } from './registry.js';
import { pulseNs, nmToHz } from '../../engine/lightdata.js';
import { detectorsOn, pulseRead, cellRead, settleLadder, TOP, seated, waveRead } from './optics-read.js';
import { wavelengthRgb } from '../../engine/lightdata.js';
import { buildWaveRibbon, buildPhotonRow } from '../../engine/lab-props-lanternfall.js';
import { paintPiece, faceKey, paintFixture, RECTS, lampLook } from './optics-draw.js';
import { litSource } from './optics-read.js';
import {
  buildElectronBall, buildGlassDome, buildUprights, buildTrack, buildLamp, buildEmitter, buildPlateSample, buildGasTube, buildBulb, buildGasCell, buildSlideStrip, buildDetectorHead
} from '../../engine/lab-props.js';

export const OPTICS_KIT_ID = 'optics';

/** An optics table is 150 x 64 units: screens and fixtures in the middle, loose pieces, trays and a rail round them. */
export const OPTICS_BOUNDS = Object.freeze({ w: 150, h: 64 });
/** Where the paper strip parks on a table that never prints on it. */
export const OPTICS_RECORDER = Object.freeze({ at: { x: 147.4, y: 61.6 }, size: { w: 5, h: 3.4 } });

/* ------------------------------------------------------------------
   THE KIT
   ------------------------------------------------------------------ */

function run(state, fixtureId) {
  const f = state.fixtures[fixtureId];
  if (!f || f.noRun) return null;
  if (f.kind === 'pulse') {
    const d = detectorsOn(state, f.id);
    if (d.length < 2) return { noop: 'Both detectors have to stand on the rail before a pulse can be timed.' };
    // A rail with a lamp holder (`props.lamp`) times the lamp that stands in it, so the same gap can be timed for two colours.
    const src = f.props.lamp ? seated(state, f.props.lamp) : null;
    if (f.props.lamp && !src) return { noop: 'A lamp has to stand in the holder before a pulse can be sent.' };
    const read = pulseRead(state, f.id);
    return { x: read.gap, y: read.ns, label: src ? src.label : 'pulse', dials: { [f.id]: { gap: read.gap, ns: read.ns } } };
  }
  if (f.kind === 'cell') {
    const read = cellRead(state, f.id);
    if (!read.plate) return { noop: 'There is no plate in the holder to read.' };
    if (read.nm == null) return { noop: 'There is no light on the plate to read.' };
    return { x: read.f14, y: read.speed, label: read.metal };
  }
  return null;
}

/** After every action the ladder writes down the move the electron made, if it made one. */
function settle(s) {
  for (const f of Object.values(s.fixtures)) if (f.kind === 'ladder') settleLadder(s, f);
}

const rect = (r, kind) => ({ r, rect: RECTS[kind], nojoin: true });

/** What a slot is for, so the built table stands the right socket in it: the fixture that owns the slot knows. */
function slotRole(zone, state) {
  const id = zone.id;
  for (const f of Object.values(state.fixtures)) {
    const pr = f.props || {};
    if (f.kind === 'wave' && pr.slot === id) return 'lamp';
    if (f.kind === 'ruler' && pr.slot === id) return 'lamp';
    if (f.kind === 'pulse' && pr.marks?.some(m => m.slot === id)) return 'mark';
    if (f.kind === 'pulse' && pr.lamp === id) return 'lamp';
    if (f.kind === 'band') {
      if (pr.src === id || pr.cell === id) return 'cradle';
      if (pr.ref === id) return 'holder';
    }
    if (f.kind === 'cell') {
      if (pr.holder === id) return 'holder';
      if (pr.lamp === id) return 'lamp';
    }
    if (f.kind === 'ladder') {
      if (Object.values(pr.rungs || {}).includes(id)) return 'rung';
      if (pr.probe === id) return 'well';
    }
  }
  return null;
}

/** A piece as the solid thing it is (a lamp housing, a glass tube, a metal coupon); a card for the rest. */
function piece3d(p, state, c) {
  const text = String(p.label);
  switch (p.kind) {
    case 'lamp': {
      const look = lampLook(state, p);
      return buildLamp(c, { lit: look.lit, rgb: look.rgb || [196, 186, 164], text });
    }
    case 'source': return buildEmitter(c, { text });
    case 'plate': return buildPlateSample(c, { sym: p.props.metal, text });
    case 'tube': return buildGasTube(c, { lit: litSource(state, p), text });
    case 'filament': return buildBulb(c, { lit: litSource(state, p), text });
    case 'cell': return buildGasCell(c, { text });
    case 'strip': return buildSlideStrip(c, { face: c.face() });
    case 'detector': return buildDetectorHead(c, { text });
    case 'electron': return buildElectronBall(c);
    default: return null;
  }
}

/**
 * Solid parts for an instrument, over the flat picture the table prints for it: a glass dome over the photocell's tube, a track under the
 * pulse timer's marks, the uprights a ladder's rungs are fixed in. The picture stays the table's own; these only stand round it.
 */
function dress3d(f, state, c) {
  const { THREE, scale: s, toPlate, box } = c;
  const group = new THREE.Group();
  const put = (obj, ux, uy, y = 0) => { const p = toPlate({ x: ux, y: uy }); obj.position.set(p.x, c.ground + y, p.z); group.add(obj); return obj; };
  if (f.kind === 'wave') {
    // The wave itself, standing over its screen: a ribbon with as many crests as the lamp's light has along the ruler (Lanternfall, 2026-10-23).
    const x0f = f.props.left ?? 24;
    const rw = f.size.w - x0f - 2;
    const top = f.dials.colour ? 13 : 6;
    const wy0 = top + 9 + 2;
    const wy1 = f.size.h - 7;
    const rib = buildWaveRibbon(c, { len: rw * s * 0.94, rise: (wy1 - wy0) * s * 0.75 });
    put(rib, box.x0 + x0f + rw / 2, box.y0 + (wy0 + wy1) / 2, 0.006);
    const sync = (fx, st) => {
      const r = waveRead(st, fx.id);
      rib.userData.set(r && r.kind === 'light' ? r.plan.crests : null, r && r.kind === 'light' ? wavelengthRgb(r.nm) : null);
    };
    group.userData.sync = sync;
    sync(f, state);
  } else if (f.kind === 'cell') {
    // Packets of light in the tube: as many as the lamp's brightness, as big as the colour's frequency (a brighter lamp is more packets, never bigger).
    const tx0c = f.props.tx0 ?? 20;
    const tx1c = f.size.w - 24;
    const topc = f.props.tubeTop ?? 12;
    const tubeHc = f.props.tubeH ?? 15;
    const row = buildPhotonRow(c, { len: (tx1c - tx0c) * s * 0.8, max: 5 });
    put(row, box.x0 + (tx0c + tx1c) / 2, box.y0 + topc + tubeHc / 2, 0.026);
    const sync = (fx, st) => {
      const r = cellRead(st, fx.id);
      row.userData.set(r.nm != null ? r.brightness : 0, r.nm != null ? wavelengthRgb(r.nm) : null, r.f14 != null ? Math.min(1, r.f14 / 12) : 0.5);
    };
    group.userData.sync = sync;
    sync(f, state);
  }
  if (f.kind === 'cell') {
    const tx0 = f.props.tx0 ?? 20;
    const tx1 = f.size.w - 24;
    const top = f.props.tubeTop ?? 12;
    const tubeH = f.props.tubeH ?? 15;
    const dome = buildGlassDome((tx1 - tx0) * s, tubeH * s, 0.05, { mats: c.mats });
    put(dome, box.x0 + (tx0 + tx1) / 2, box.y0 + top + tubeH / 2, 0.004);
  } else if (f.kind === 'pulse') {
    const marks = f.props.marks || [];
    const lastDx = marks.length ? Math.max(...marks.map(m => m.dx)) : f.size.w - 24;
    const lineY = f.props.lineY ?? 12;
    const len = (lastDx + 8 - 2) * s;
    const track = buildTrack(len, { mats: c.mats });
    put(track, box.x0 + 2 + (lastDx + 8 - 2) / 2, box.y0 + lineY, 0.002);
  } else if (f.kind === 'ladder') {
    const ys = Object.values(f.props.rungs || {}).map(id => state.zones.slots[id]?.at.y).filter(v => v != null);
    if (ys.length) {
      const lo = Math.min(...ys) - 4;
      const hi = Math.max(...ys) + 4;
      put(buildUprights(32 * s, (hi - lo) * s, { mats: c.mats }), f.at.x, (lo + hi) / 2, 0.002);
    }
  }
  return group.children.length ? group : null;
}

export const OPTICS_KIT = {
  id: OPTICS_KIT_ID,
  kinds: {
    lamp: rect(8.5, 'lamp'),
    water: rect(8.5, 'water'),
    source: rect(9, 'source'),
    plate: rect(8, 'plate'),
    tube: rect(9, 'tube'),
    filament: rect(8.5, 'filament'),
    cell: rect(8.5, 'cell'),
    strip: rect(10.5, 'strip'),
    chip: rect(7, 'chip'),
    detector: rect(8.5, 'detector'),
    electron: { r: 6.3, rect: RECTS.electron, nojoin: true }
  },
  run,
  settle,
  paintPiece,
  paintFixture,
  piece3d,
  dress3d,
  slot3d: slotRole,
  deckStyle: () => 'instrument',
  printed: p => String(p.label),
  faceKey
};

registerKit(OPTICS_KIT);

/** A stage's declaration with the optics kit's defaults: the kit, the bounds, a parked recorder strip. */
export function opticsTable(spec) {
  return { kit: OPTICS_KIT_ID, bounds: { ...OPTICS_BOUNDS }, tools: [], recorder: OPTICS_RECORDER, ...spec };
}

/* ------------------------------------------------------------------
   PIECES
   ------------------------------------------------------------------ */

const piece = (kind, id, label, at, props = {}, extra = {}) => ({ id, kind, label, at, props, ...extra });

/** A lamp at `nm` (or, tuned, wherever the screen it stands in has its colour dial). */
export const lamp = (id, label, at, nm, extra = {}) => piece('lamp', id, label, at, { nm }, extra);
export const tunedLamp = (id, label, at, extra = {}) => piece('lamp', id, label, at, { tuned: true }, extra);
/** A strip of the flume's own chart: crest to crest in metres and crests a second. */
export const waterStrip = (id, label, at, metres, hz, extra = {}) => piece('water', id, label, at, { water: { metres, hz } }, extra);
/** A source that is not a lamp (a mast, an oven, a tube), read on the log ruler by its wavelength in nm. */
export const radiator = (id, label, at, nm, extra = {}) => piece('source', id, label, at, { nm }, extra);
export const metalPlate = (id, label, at, metal, extra = {}) => piece('plate', id, label, at, { metal }, extra);
/** A gas tube; `label` is what is printed on it ("Hydrogen", or "Sealed tube" for a gas that is not named). */
export const gasTube = (id, label, at, gas, extra = {}) => piece('tube', id, label, at, { gas }, extra);
export const filament = (id, label, at, extra = {}) => piece('filament', id, label, at, {}, extra);
/** A cell of cool gas, put in front of the filament. */
export const coolCell = (id, label, at, gas, extra = {}) => piece('cell', id, label, at, { gas }, extra);
/** A strip of glass with a gas's lines printed on it. */
export const refStrip = (id, label, at, gas, extra = {}) => piece('strip', id, label, at, { gas }, extra);
/** A line, written on a chip: asked of the ladder by putting it in the probe slot. */
export const lineChip = (id, nm, at, extra = {}) => piece('chip', id, `${nm} nm`, at, { nm }, extra);
export const detector = (id, label, at, extra = {}) => piece('detector', id, label, at, {}, extra);

/* ------------------------------------------------------------------
   FIXTURES (each builder returns the fixture and the slots it owns)
   ------------------------------------------------------------------ */

/** A slot is as wide as the widest thing that stands in it (a lamp is 21 units across, a source 26): a piece never overhangs its place. */
const slot = (id, at, size = { w: 22, h: 14 }, label = '') => ({ id, label, at, size });

/**
 * A screen: a lamp put in its slot draws its wave, with its wavelength and (unless `rate: false`) the crests that pass each
 * second. `settings` gives a colour dial for a TUNED lamp, red end first (the dial's value is the position, 1 to n).
 */
export function waveScreen(id, label, at, { settings = null, start = 1, rate = true, size = null, plain = false } = {}) {
  const sz = size || { w: 70, h: settings ? 40 : 33 };
  const x0 = at.x - sz.w / 2;
  const y0 = at.y - sz.h / 2;
  const slotId = `${id}.lamp`;
  return {
    fixture: {
      id, kind: 'wave', label, at: { ...at }, size: sz, noRun: true,
      dials: settings ? { colour: { min: 1, max: settings.length, step: 1, value: start, label: 'Colour', labels: settings.map(n => `${n} nm`) } } : {},
      props: { backdrop: true, slot: slotId, settings, rate, left: 24, ...(plain ? { plain: true } : {}) }
    },
    slots: [slot(slotId, { x: x0 + 12.5, y: y0 + sz.h - 9.5 }, { w: 22, h: 14 })]
  };
}

/** The log ruler, from a tenth of a nanometre to ten metres: a source put in its slot is laid against it. */
export function logRuler(id, label, at, { size = { w: 76, h: 34 } } = {}) {
  const x0 = at.x - size.w / 2;
  const y0 = at.y - size.h / 2;
  const slotId = `${id}.src`;
  return {
    fixture: { id, kind: 'ruler', label, at: { ...at }, size, noRun: true, dials: {}, props: { backdrop: true, slot: slotId, left: 31 } },
    slots: [slot(slotId, { x: x0 + 14.5, y: y0 + size.h - 9.5 }, { w: 28, h: 14 })]
  };
}

/**
 * The pulse timer: a rail with marks at known distances from the lamp, a slot at each, and a Run key that fires a pulse down it.
 * Detectors stood on two marks are timed against each other; the timer prints the gap and the time, never the speed.
 */
export function pulseRail(id, label, at, { marks, size = { w: 132, h: 39 }, runLabel = 'Fire Pulse', lamp: lampHolder = false }) {
  const x0 = at.x - size.w / 2;
  const y0 = at.y - size.h / 2;
  const lineY = 12;
  // With a lamp holder at the near end the marks start further along the rail, so the lamp's holder is clear of them.
  const first = lampHolder ? 38 : 14;
  const placed = marks.map((m, i) => ({ slot: `${id}.m${i}`, metres: m.metres, dx: first + i * 20, label: m.label }));
  const lampId = `${id}.lamp`;
  return {
    fixture: {
      id, kind: 'pulse', label, at: { ...at }, size, runLabel,
      dials: { gap: { min: 0, max: 12, step: 0.1, value: 0 }, ns: { min: 0, max: 100, step: 0.1, value: 0 } },
      props: { backdrop: true, hidden: ['gap', 'ns'], lineY, ...(lampHolder ? { lamp: lampId } : {}), marks: placed.map(({ slot: s, metres, dx }) => ({ slot: s, metres, dx })) }
    },
    slots: [
      ...(lampHolder ? [slot(lampId, { x: x0 + 13, y: y0 + lineY + 12 }, { w: 22, h: 14 }, 'Lamp holder')] : []),
      ...placed.map(m => slot(m.slot, { x: x0 + m.dx, y: y0 + lineY + 12 }, { w: 20, h: 14 }, m.label))
    ]
  };
}

/**
 * The spectrograph: a socket for the source (a filament, a gas tube, a lamp), and when asked a place for a cell of cool gas in
 * front of the filament and a place for a reference strip slid alongside the band. `detectors` lights the strips past the
 * band's ends for light the eye cannot see.
 */
export function spectrograph(id, label, at, { cell = false, ref = false, detectors = false, size = null } = {}) {
  const full = cell || ref;
  const sz = size || { w: 100, h: full ? 52 : 40 };
  const x0 = at.x - sz.w / 2;
  const y0 = at.y - sz.h / 2;
  const dy = full ? 40 : 29;
  const slotY = y0 + dy;
  // Packed from the left, each slot as wide as what stands in it: a source 26, a cell 24, a strip 26, a gap of 2 between.
  const slots = [slot(`${id}.src`, { x: x0 + 14, y: slotY }, { w: 26, h: 14 })];
  const captions = [{ dx: 14, dy: dy + 9.8, text: 'SOCKET' }];
  let next = 14 + 13 + 2;
  if (cell) { slots.push(slot(`${id}.cell`, { x: x0 + next + 12, y: slotY }, { w: 24, h: 14 })); captions.push({ dx: next + 12, dy: dy + 9.8, text: 'CELL' }); next += 24 + 2; }
  if (ref) { slots.push(slot(`${id}.ref`, { x: x0 + next + 13, y: slotY }, { w: 26, h: 14 })); captions.push({ dx: next + 13, dy: dy + 9.8, text: 'ALONGSIDE' }); }
  return {
    fixture: {
      id, kind: 'band', label, at: { ...at }, size: sz, noRun: true, dials: {},
      props: { backdrop: true, src: `${id}.src`, ...(cell ? { cell: `${id}.cell` } : {}), ...(ref ? { ref: `${id}.ref` } : {}), detectors, captions }
    },
    slots
  };
}

/**
 * The photocell: a holder for a metal plate and a lamp that is either built in (a colour dial, `settings`) or a lamp piece put in
 * its slot (`lamp: true`). A brightness dial (`brightness: {start}`) or a fixed brightness (a number). The electrons it frees
 * run to a collector and into a counting cup, with the count and the speed of the fastest printed under them. `record` gives
 * the fixture a Run key that writes a reading on the recorder.
 */
export function photocell(id, label, at, { settings = null, start = 1, lamp: lampSlot = false, brightness = { start: 3 }, record = false, compact = false, size = null } = {}) {
  const rows = (settings ? 1 : 0) + (typeof brightness === 'object' ? 1 : 0);
  const tubeTop = compact ? 14 : rows >= 2 ? 23 : rows === 1 ? 17 : 12;
  const tubeH = 15;
  const meterH = compact ? 9 : 10;
  const sz = size || { w: 100, h: tubeTop + tubeH + 3 + meterH + 3 };
  const x0 = at.x - sz.w / 2;
  const y0 = at.y - sz.h / 2;
  const holder = `${id}.holder`;
  const lampId = `${id}.lamp`;
  const dials = {};
  if (settings) dials.colour = { min: 1, max: settings.length, step: 1, value: start, label: 'Colour', labels: settings.map(n => `${n} nm`) };
  if (typeof brightness === 'object') dials.brightness = { min: 1, max: 5, step: 1, value: brightness.start ?? 3, label: 'Brightness' };
  // The lamp stands in a slot of its own to the left of the tube (a lamp is 21 units across); the plate's holder is a slot in the tube.
  const slots = [slot(holder, { x: x0 + (lampSlot ? 38 : 28), y: y0 + tubeTop + tubeH / 2 }, { w: 15, h: tubeH })];
  if (lampSlot) slots.push(slot(lampId, { x: x0 + 13, y: y0 + tubeTop + tubeH / 2 }, { w: 22, h: 14 }));
  return {
    fixture: {
      id, kind: 'cell', label, at: { ...at }, size: sz, dials,
      ...(record ? { runLabel: typeof record === 'string' ? record : 'Record' } : { noRun: true }),
      props: {
        backdrop: true, holder, ...(lampSlot ? { lamp: lampId } : {}), ...(settings ? { settings } : {}),
        ...(typeof brightness === 'number' ? { brightness } : {}), rowPitch: 6, tubeTop, tubeH, meterH, ...(lampSlot ? { tx0: 27 } : {})
      }
    },
    slots
  };
}

/**
 * The energy ladder. Rungs 1 to 6 (and, with `top`, the open top) are slots one above another, evenly spaced and marked NOT TO
 * SCALE, and one electron stands on rung 1. Dragging it to another rung is the move: the kit writes down the line a drop gives
 * out. A `probe` slot, put where `probeAt` says, takes a line chip and asks the ladder which pair of rungs makes it.
 */
export function energyLadder(id, label, at, { top = false, probeAt = null, size = { w: 56, h: 64 } } = {}) {
  const x0 = at.x - size.w / 2;
  const y0 = at.y - size.h / 2;
  const rungs = {};
  const slots = [];
  const order = top ? [TOP, 6, 5, 4, 3, 2, 1] : [6, 5, 4, 3, 2, 1];
  order.forEach(n => {
    const sid = `${id}.r${n === TOP ? 'top' : n}`;
    rungs[n] = sid;
    const y = y0 + (n === TOP ? 9 : 17 + (6 - n) * 8);
    slots.push(slot(sid, { x: at.x, y }, { w: 28, h: 6.4 }));
    void y0;
  });
  const probeId = probeAt ? `${id}.probe` : null;
  if (probeAt) slots.push(slot(probeId, probeAt, { w: 20, h: 12 }));
  const electronId = `${id}.e`;
  return {
    fixture: {
      id, kind: 'ladder', label, at: { ...at }, size, noRun: true, dials: {},
      props: { backdrop: true, rungs, electron: electronId, ...(probeId ? { probe: probeId } : {}), ...(top ? { topLabel: 'top' } : {}) }
    },
    slots,
    electron: piece('electron', electronId, 'e-', { x: at.x, y: slots.find(s => s.id === rungs[1]).at.y }, { at: 1 }, { zone: `slot:${rungs[1]}` })
  };
}

/** The strip the ladder's drops write on: each line made, on the band's scale and in nm. */
export function linesStrip(id, label, at, ladderId, { size = { w: 84, h: 30 }, list = true } = {}) {
  return { id, kind: 'lines', label, at: { ...at }, size, noRun: true, dials: {}, props: { ladder: ladderId, list } };
}

/** Printed reference lines: figures a stage hands the player to work with. */
export function plaque(id, label, at, lines, size = { w: 84, h: 34 }) {
  return { id, kind: 'plaque', label, at: { ...at }, size, noRun: true, dials: {}, props: { lines } };
}

/** A plain dial a player sets to a figure they have worked out from the table. */
export function marker(id, label, at, { label: dialLabel = label, min = 0, max = 10, step = 1, value = 0, size = { w: 50, h: 16 } } = {}) {
  return { id, kind: 'marker', label, at: { ...at }, size, noRun: true, dials: { n: { min, max, step, value, label: dialLabel } }, props: {} };
}

export { pulseNs, nmToHz };
export * from './optics-read.js';
