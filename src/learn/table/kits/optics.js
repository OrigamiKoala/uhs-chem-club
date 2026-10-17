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
import { detectorsOn, pulseRead, cellRead, settleLadder, TOP } from './optics-read.js';
import { paintPiece, faceKey, paintFixture, RECTS } from './optics-draw.js';

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
    const read = pulseRead(state, f.id);
    return { x: read.gap, y: read.ns, label: 'pulse', dials: { [f.id]: { gap: read.gap, ns: read.ns } } };
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
    strip: rect(11, 'strip'),
    chip: rect(7, 'chip'),
    detector: rect(8.5, 'detector'),
    electron: { r: 6.3, nojoin: true }
  },
  run,
  settle,
  paintPiece,
  paintFixture,
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

const slot = (id, at, size = { w: 14, h: 13 }, label = '') => ({ id, label, at, size });

/**
 * A screen: a lamp put in its slot draws its wave, with its wavelength and (unless `rate: false`) the crests that pass each
 * second. `settings` gives a colour dial for a TUNED lamp, red end first (the dial's value is the position, 1 to n).
 */
export function waveScreen(id, label, at, { settings = null, start = 1, rate = true, size = null } = {}) {
  const sz = size || { w: 70, h: settings ? 40 : 33 };
  const x0 = at.x - sz.w / 2;
  const y0 = at.y - sz.h / 2;
  const slotId = `${id}.lamp`;
  return {
    fixture: {
      id, kind: 'wave', label, at: { ...at }, size: sz, noRun: true,
      dials: settings ? { colour: { min: 1, max: settings.length, step: 1, value: start, label: 'Colour', labels: settings.map(n => `${n} nm`) } } : {},
      props: { backdrop: true, slot: slotId, settings, rate, left: 24 }
    },
    slots: [slot(slotId, { x: x0 + 12, y: y0 + sz.h - 9.5 })]
  };
}

/** The log ruler, from a tenth of a nanometre to ten metres: a source put in its slot is laid against it. */
export function logRuler(id, label, at, { size = { w: 76, h: 34 } } = {}) {
  const x0 = at.x - size.w / 2;
  const y0 = at.y - size.h / 2;
  const slotId = `${id}.src`;
  return {
    fixture: { id, kind: 'ruler', label, at: { ...at }, size, noRun: true, dials: {}, props: { backdrop: true, slot: slotId, left: 24 } },
    slots: [slot(slotId, { x: x0 + 12, y: y0 + size.h - 9.5 })]
  };
}

/**
 * The pulse timer: a rail with marks at known distances from the lamp, a slot at each, and a Run key that fires a pulse down it.
 * Detectors stood on two marks are timed against each other; the timer prints the gap and the time, never the speed.
 */
export function pulseRail(id, label, at, { marks, size = { w: 132, h: 36 }, runLabel = 'Fire Pulse' }) {
  const x0 = at.x - size.w / 2;
  const y0 = at.y - size.h / 2;
  const lineY = 12;
  const placed = marks.map((m, i) => ({ slot: `${id}.m${i}`, metres: m.metres, dx: 14 + i * 20, label: m.label }));
  return {
    fixture: {
      id, kind: 'pulse', label, at: { ...at }, size, runLabel,
      dials: { gap: { min: 0, max: 12, step: 0.1, value: 0 }, ns: { min: 0, max: 100, step: 0.1, value: 0 } },
      props: { backdrop: true, hidden: ['gap', 'ns'], lineY, marks: placed.map(({ slot: s, metres, dx }) => ({ slot: s, metres, dx })) }
    },
    slots: placed.map(m => slot(m.slot, { x: x0 + m.dx, y: y0 + lineY + 12 }, { w: 13, h: 13 }, m.label))
  };
}

/**
 * The spectrograph: a socket for the source (a filament, a gas tube, a lamp), and when asked a place for a cell of cool gas in
 * front of the filament and a place for a reference strip slid alongside the band. `detectors` lights the strips past the
 * band's ends for light the eye cannot see.
 */
export function spectrograph(id, label, at, { cell = false, ref = false, detectors = false, size = null } = {}) {
  const full = cell || ref;
  const sz = size || { w: 100, h: full ? 52 : 42 };
  const x0 = at.x - sz.w / 2;
  const y0 = at.y - sz.h / 2;
  const dy = full ? 40 : 30.5;
  const slotY = y0 + dy;
  const slots = [slot(`${id}.src`, { x: x0 + 12, y: slotY }, { w: 14, h: 13 })];
  const captions = [{ dx: 12, dy: dy + 9.8, text: 'SOCKET' }];
  if (cell) { slots.push(slot(`${id}.cell`, { x: x0 + 32, y: slotY }, { w: 14, h: 13 })); captions.push({ dx: 32, dy: dy + 9.8, text: 'CELL' }); }
  if (ref) { slots.push(slot(`${id}.ref`, { x: x0 + 66, y: slotY }, { w: 38, h: 13 })); captions.push({ dx: 66, dy: dy + 9.8, text: 'ALONGSIDE' }); }
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
  const tubeH = compact ? 13 : 15;
  const meterH = compact ? 9 : 10;
  const sz = size || { w: 100, h: tubeTop + tubeH + 3 + meterH + 3 };
  const x0 = at.x - sz.w / 2;
  const y0 = at.y - sz.h / 2;
  const holder = `${id}.holder`;
  const lampId = `${id}.lamp`;
  const dials = {};
  if (settings) dials.colour = { min: 1, max: settings.length, step: 1, value: start, label: 'Colour', labels: settings.map(n => `${n} nm`) };
  if (typeof brightness === 'object') dials.brightness = { min: 1, max: 5, step: 1, value: brightness.start ?? 3, label: 'Brightness' };
  const slots = [slot(holder, { x: x0 + (lampSlot ? 31 : 28), y: y0 + tubeTop + tubeH / 2 }, { w: 14, h: Math.min(14, tubeH) })];
  if (lampSlot) slots.push(slot(lampId, { x: x0 + 11, y: y0 + tubeTop + tubeH / 2 }, { w: 14, h: Math.min(14, tubeH) }));
  return {
    fixture: {
      id, kind: 'cell', label, at: { ...at }, size: sz, dials,
      ...(record ? { runLabel: typeof record === 'string' ? record : 'Record' } : { noRun: true }),
      props: {
        backdrop: true, holder, ...(lampSlot ? { lamp: lampId } : {}), ...(settings ? { settings } : {}),
        ...(typeof brightness === 'number' ? { brightness } : {}), rowPitch: 6, tubeTop, tubeH, meterH
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
export function energyLadder(id, label, at, { top = false, probeAt = null, size = { w: 56, h: 62 } } = {}) {
  const x0 = at.x - size.w / 2;
  const y0 = at.y - size.h / 2;
  const rungs = {};
  const slots = [];
  const order = top ? [TOP, 6, 5, 4, 3, 2, 1] : [6, 5, 4, 3, 2, 1];
  order.forEach((n, i) => {
    const sid = `${id}.r${n === TOP ? 'top' : n}`;
    rungs[n] = sid;
    const y = y0 + (top ? 6 + i * 8 : 14 + i * 8);
    slots.push(slot(sid, { x: at.x, y }, { w: 28, h: 6.4 }));
  });
  const probeId = probeAt ? `${id}.probe` : null;
  if (probeAt) slots.push(slot(probeId, probeAt, { w: 20, h: 12 }, 'Line to match'));
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
