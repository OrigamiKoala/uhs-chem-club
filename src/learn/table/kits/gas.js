/**
 * kits/gas.js — The gas kit: cylinders with a piston you set by hand, tanks you put on a scale or open into a common tank, a
 * pinhole, a tube, and the cards that name what you found.
 *
 * BELLOWS' SIX BENCHES, WORKED WITH THE HANDS (plan `bench-tabletop.md`, T5): the gas rig stops being a screen that is read and
 * becomes a table. A CYLINDER (`rig`) has a piston on a dial, a heater on a dial and a gas-in dial, a gauge, a thermometer, the
 * counters a stage turns on, and a Record key that drops a point on the paper strip; the straightedge laid across the points is how
 * a line is carried on to where it meets zero. A TANK is a piece with its own gauge: put on the SCALE it is weighed, dropped in the
 * COMMON TANK's place its valve is open and its gas is in the room (each gas pushes as it would alone; the gauge shows the sum),
 * dropped in a tray or on the rail it is sorted or ranked. A PINHOLE lets a chamber's gas out for as many seconds as its dial says;
 * a TUBE lets two gases in from its two ends and rings white where they meet; a WALK follows one particle through a crowd.
 *
 * A THIN WRAPPER over `gasdata.js` (`planGas`, `planMixture`, `speedBins`, `fractionAbove`, `leftAfter`, `halfTime`, `front`), the
 * planners the old gas rig drew from, and it authors nothing: the pressure a cylinder reads, the share of a gas's push in a common
 * tank, the share of a chamber left after four seconds, the place a ring forms are the planners' answers, shown as the picture.
 * A stage declares what stands on the table and what to look for; it never declares what the table will read.
 *
 * Pieces never JOIN here (`nojoin`; the one exception is a trap laid on a tank): they are put in slots, trays and on the rail, and the fixture that owns a place reads whatever
 * stands in it (`gas-read.js`).
 */

import { registerKit } from './registry.js';
import { paintPiece, paintFixture, faceKey, RECTS, paintLegend, rigGeometry, tankFace, wrap } from './gas-draw.js';
import {
  rigRun, pinholeRead, tubeRead, secondsOf, seatedIn, GASES, tankRead, commonRead
} from './gas-read.js';
import { buildTank, buildPelletDish, buildBarrel, buildLid } from '../../engine/gas-props.js';
import { buildSocket } from '../../engine/lab-props.js';

export const GAS_KIT_ID = 'gas';
export const GAS_BOUNDS = Object.freeze({ w: 150, h: 64 });
/** Where the paper strip parks on a table that never prints on it. */
export const GAS_RECORDER = Object.freeze({ at: { x: 147.4, y: 61.6 }, size: { w: 5, h: 3.4 } });

/* ------------------------------------------------------------------
   THE KIT
   ------------------------------------------------------------------ */

function run(state, fixtureId) {
  const f = state.fixtures[fixtureId];
  if (!f || f.noRun) return null;
  if (f.kind === 'rig') return rigRun(state, fixtureId);
  if (f.kind === 'pinhole') {
    const r = pinholeRead(state, fixtureId);
    const c = r.chambers[f.props.recordIndex || 0];
    return { x: r.seconds, y: Math.round(c.left * 1000) / 10, label: c.label };
  }
  if (f.kind === 'common') {
    const r = commonRead(state, fixtureId);
    return { x: Math.round(r.n * 1e6) / 1e6, y: Math.round(r.P * 1e6) / 1e6, label: 'common tank' };
  }
  if (f.kind === 'tube') {
    const r = tubeRead(state, fixtureId);
    return { x: r.seconds, y: r.met ? Math.round(r.ringFromLeft * 10) / 10 : NaN, label: 'ring' };
  }
  return null;
}

const rect = (r, kind, extra = {}) => ({ r, rect: RECTS[kind], ...(extra.tool ? {} : { nojoin: true }), ...extra });

/**
 * The one join on this table: a trap laid on a tank of several gases takes one of them out (the gas the trap is for), and the trap goes
 * back where it hangs. What is left is what the tank's own gauge reads from then on.
 */
function planJoin(a, b) {
  if (a.kind === 'trap' && b.kind === 'tank') {
    const parts = b.props.parts;
    if (!Array.isArray(parts)) return { holds: false, home: true, reason: 'That tank holds one gas, so there is nothing to trap out of it.' };
    const keep = parts.filter(p => p.gas !== a.props.gas);
    if (keep.length === parts.length) return { holds: false, home: true, reason: 'That tank holds none of the gas this trap takes out.' };
    return { holds: true, once: true, set: { b: { parts: keep } }, reason: 'Trapped.' };
  }
  return { holds: false, home: true, reason: 'Nothing here joins: put a piece in a place.' };
}

/** A tank and a pellet are solid things; the cards are cards. */
function piece3d(p, state, c) {
  if (p.kind === 'tank') {
    const legend = c.paint(c.hw * 1.5, c.hw * 1.5, (ctx, W, H) => paintLegend(ctx, p, W, H), { seed: `${p.id}|${faceKey(p)}`, px: 256 });
    return buildTank(c, { legend, open: p.zone != null });
  }
  if (p.kind === 'pellet') {
    const legend = c.paint(c.hw * 1.6, 0.03, (ctx, W, H) => {
      ctx.font = `700 ${Math.round(H * 0.7)}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#d6cfb8';
      ctx.fillText(p.label, W / 2, H / 2, W - 6);
    }, { seed: `${p.id}|${p.label}`, px: 256 });
    return buildPelletDish(c, { legend });
  }
  return null;
}

/** A glass barrel over every cylinder's picture, a lid over the chambers and the common tank, a tube over the tube: the glass is solid, the gas is the picture. */
function dress3d(f, state, c) {
  const { scale: s, toPlate, box } = c;
  const group = new c.THREE.Group();
  const put = (obj, ux, uy, y = 0) => { const p = toPlate({ x: ux, y: uy }); obj.position.set(p.x, c.ground + y, p.z); group.add(obj); return obj; };
  if (f.kind === 'rig') {
    const g = rigGeometry(f, { box, dials: Object.keys(f.dials).filter(n => !f.props.hidden?.includes(n)).map((n, i) => ({ y: box.y0 + 8 + i * 5 })) });
    for (const cj of g.cyls) {
      const b = cj.barrel;
      const len = (b.x1 - b.x0) * s;
      put(buildBarrel(len, (b.y1 - b.y0) * s * 1.05, { mats: c.mats }), (b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, 0.002);
    }
  } else if (f.kind === 'pinhole') {
    const n = (f.props.chambers || []).length;
    const lastDial = Object.keys(f.dials).length ? box.y0 + 8 + (Object.keys(f.dials).length - 1) * 5 : box.y0 + 8;
    const cw = (f.size.w - 4) / n;
    const h = f.props.chamberH ?? 12;
    for (let i = 0; i < n; i++) put(buildLid((cw - 2) * s, h * s, 0.03, { mats: c.mats }), box.x0 + 2 + i * cw + (cw - 2) / 2, lastDial + 4 + h / 2, 0.002);
  } else if (f.kind === 'tube') {
    const lastDial = Object.keys(f.dials).length ? box.y0 + 8 + (Object.keys(f.dials).length - 1) * 5 : box.y0 + 8;
    put(buildLid((f.size.w - 8) * s, 5.6 * s, 0.026, { mats: c.mats }), box.x0 + f.size.w / 2, lastDial + 5 + 2.7, 0.002);
  } else if (f.kind === 'common') {
    const w = f.size.w * 0.44;
    put(buildLid(w * s, (f.props.tankH ?? 17) * s, 0.04, { mats: c.mats }), box.x0 + f.size.w * 0.52 + w / 2, box.y0 + 8.5 + (f.props.tankH ?? 17) / 2, 0.002);
  }
  return group.children.length ? group : null;
}

function slotRole(zone, state) {
  return Object.values(state.fixtures).some(f => f.kind === 'scale' && f.props.slot === zone.id) ? 'well'
    : Object.values(state.fixtures).some(f => f.kind === 'rig' && f.props.pellet === zone.id) ? 'cradle' : null;
}
void buildSocket;

export const GAS_KIT = {
  id: GAS_KIT_ID,
  kinds: {
    tank: { r: 7 },
    stmt: rect(9, 'stmt'),
    num: rect(7, 'num'),
    curve: rect(10, 'curve'),
    hist: rect(11, 'hist'),
    pellet: rect(7, 'pellet'),
    chip: rect(6.3, 'chip'),
    trap: rect(7, 'chip', { tool: true })
  },
  planJoin,
  pairable: (a, b) => a.kind === 'trap' && b.kind === 'tank',
  run,
  paintPiece,
  paintFixture,
  piece3d,
  dress3d,
  slot3d: slotRole,
  deckStyle: () => 'instrument',
  // What a piece's face prints as one line of words: a tank its name, a card its first line (long statements break in two).
  printed: p => (p.kind === 'tank' ? `${tankFace(p).name}` : p.kind === 'stmt' ? wrap(p.label)[0] : String(p.label)),
  faceKey
};

registerKit(GAS_KIT);

/** A stage's declaration with the gas kit's defaults: the kit, the bounds, a parked recorder strip. */
export function gasTable(spec, { w = GAS_BOUNDS.w, recorder = null } = {}) {
  return { kit: GAS_KIT_ID, bounds: { w, h: GAS_BOUNDS.h }, tools: [], recorder: recorder || { ...GAS_RECORDER }, ...spec };
}

/* ------------------------------------------------------------------
   PIECES
   ------------------------------------------------------------------ */

const piece = (kind, id, label, at, props = {}, extra = {}) => ({ id, kind, label, at, props, ...extra });

/**
 * A tank. Give it its gas and either its amount (`n`) or what its gauge reads (`P`), with its room (`V`, litres) and temperature (`T`,
 * kelvin). `parts` makes it a tank of several gases. `sealed` prints a question mark where the gas goes.
 */
export const tank = (id, label, at, { gas, n, P, V = 10, T = 300, parts, sealed = false, plate = false, gaugeMax = 600, showAmount = false, noGauge = false, hidden = false, zone = null, fetchFrom = null, fixed = false } = {}) =>
  piece('tank', id, label, at, { ...(parts ? { parts } : { gas }), ...(n != null ? { n } : {}), ...(P != null ? { P } : {}), V, T, sealed, plate, gaugeMax, showAmount, noGauge },
    { ...(hidden ? { hidden: true } : {}), ...(zone ? { zone } : {}), ...(fetchFrom ? { fetchFrom } : {}), ...(fixed ? { fixed: true } : {}), r: 7 });
/** A card with a statement or a reading printed on it. */
export const stmt = (id, label, at, extra = {}) => piece('stmt', id, label, at, {}, extra);
/** A card with a number on it: an answer a stage cannot build. */
export const numCard = (id, label, at, value, extra = {}) => piece('num', id, label, at, { value }, extra);
/** A card with a curve of the ideal law on it, `spec` being `{x, y, fixed, xmin, xmax, ymax, xName, yName}`. */
export const curveCard = (id, label, at, spec, extra = {}) => piece('curve', id, label, at, { curve: spec }, extra);
/** A trap: laid on a tank of several gases it takes `gas` out of it. */
export const trapTool = (id, label, at, gas, extra = {}) => piece('trap', id, label, at, { gas }, { caption: 'Takes the gas out', ...extra });
/** A chip with a short word on it (a gas's name, a scale). */
export const chip = (id, label, at, extra = {}) => piece('chip', id, label, at, {}, extra);
/** A snapshot of a gas's speeds at `T` kelvin; `ref` fixes the vertical scale so snapshots on one table compare. */
export const histCard = (id, label, at, gas, T, ref = null, extra = {}) => piece('hist', id, label, at, { gas, T, ...(ref ? { ref } : {}) }, extra);
/** A card the player taps to mark (a statement the bench has shown): marked cards are flipped. */
export const markCard = (id, label, at, extra = {}) => piece('stmt', id, label, at, { markable: true }, extra);
/** A pellet of calcium carbonate in its dish. */
export const pelletPiece = (id, at, grams = 5.0, extra = {}) => piece('pellet', id, `${grams.toFixed(2)} g CaCO₃`, at, { grams }, { caption: 'Pellet', ...extra });

/* ------------------------------------------------------------------
   FIXTURES
   ------------------------------------------------------------------ */

const tempLabel = (t, list) => (list === 'C' ? `${t} °C` : `${t} K`);

/**
 * A cylinder rig. `cyls` are its cylinders (`{id, label, gas, n, hold, V, P0, T, vdw}`): `hold` is what a cylinder keeps steady when something
 * else moves ('V' a rigid tank, 'P' a free piston under a steady weight, 'dial' a piston the volume dial drives). The dials it has are the
 * lists it is given: `volumes` (litres), `temps` (`tempList` 'C' or 'K') and `amounts` (moles). `show` turns readouts on (`knocks`, `speed`,
 * `energy`, `kelvin`, `z`, `mass`, `room`, `pull`, `pullShare`). `plot` is what Record writes: `{x, y, cyl?}`, each one of V P atm T TC n
 * knocks speed Z PV nT invV. `speedScreen` adds the histogram of speeds (`bar` a threshold in m/s, `target` a mark).
 */
export function rig(id, at, o = {}) {
  const {
    cyls, volumes = null, volumeStart = 1, temps = null, tempList = 'K', tempStart = 1, amounts = null, amountStart = 1,
    show = {}, plot = null, vmax = 40, units = 'kpa', compact = false, w = null, h = null, speedScreen = false, bar = null, target = null,
    words = null, pellet = null, label = 'Cylinder', runLabel = 'Record', rowH = null, screenH = null, speedMax = 2400, screenRef = null, T = null
  } = o;
  const dials = {};
  if (volumes) dials.volume = { min: 1, max: volumes.length, step: 1, value: volumeStart, label: 'Piston', labels: volumes.map(v => `${v} L`) };
  if (temps) dials.temp = { min: 1, max: temps.length, step: 1, value: tempStart, label: 'Heater', labels: temps.map(t => tempLabel(t, tempList)) };
  if (amounts) dials.amount = { min: 1, max: amounts.length, step: 1, value: amountStart, label: 'Gas in', labels: amounts.map(n => `${n} mol`) };
  const nd = Object.keys(dials).length;
  const key = ['gauge', 'volume', 'temperature', 'amount', 'knocks', 'speed', 'energy', 'kelvin', 'z', 'mass', 'room', 'pull', 'pullShare'];
  const on = k => (['gauge', 'volume', 'temperature', 'amount'].includes(k) ? show[k] !== false : Boolean(show[k]));
  const lines = key.filter(on).length;
  const cols = o.cols ?? (compact || speedScreen ? 1 : 2);
  const rows = Math.ceil(lines / cols);
  const topRel = Math.max(8 + Math.max(0, nd - 1) * 5 + 3.6, 10.5);
  const BH = compact ? 5.6 : 7;
  const block = BH + 3.4 + rows * 3.3;
  const pitch = rowH ?? (block + 2.6);
  const n = cyls.length;
  const runKey = Boolean(plot);
  const height = h ?? Math.max(topRel + (n - 1) * pitch + block + (runKey ? 6.4 : 2.6), speedScreen ? topRel + (screenH ?? 15) + 8 : 0);
  const width = w ?? (compact ? 36 : 62);
  const props = {
    cyls: cyls.map((c, i) => ({ id: c.id || String.fromCharCode(97 + i), ...c, label: c.label || `${label} ${String.fromCharCode(65 + i)}` })),
    ...(volumes ? { volumes } : {}), ...(temps ? { temps, tempList } : {}), ...(amounts ? { amounts } : {}),
    show, vmax, units, compact, speedScreen, speedMax, rowH: pitch, cols,
    ...(plot ? { plot } : {}), ...(bar != null ? { bar } : {}), ...(target != null ? { target } : {}), ...(words ? { words } : {}),
    ...(pellet ? { pellet } : {}), ...(screenH ? { screenH } : {}), ...(screenRef != null ? { screenRef } : {}), ...(T != null ? { T } : {})
  };
  return {
    id, kind: 'rig', label: o.title || (compact ? ' ' : 'Cylinder and piston'), at: { ...at }, size: { w: width, h: Math.round(height * 10) / 10 }, dials,
    ...(runKey ? { runLabel } : { noRun: true }), props
  };
}

/**
 * The scale: a pan with a place in it for a tank, and what the tank in the pan weighs. Returns the fixture and the pan's slot (stand it
 * where the pan is: the slot is `{ id, at, size }`).
 */
export function scaleFixture(id, at, { w = 42, h = 34 } = {}) {
  const slotId = `${id}.pan`;
  const x0 = at.x - w / 2;
  const y0 = at.y - h / 2;
  return {
    fixture: { id, kind: 'scale', label: 'Scale', at: { ...at }, size: { w, h }, noRun: true, dials: {}, props: { backdrop: true, slot: slotId } },
    slots: [{ id: slotId, label: '', at: { x: x0 + w / 2, y: y0 + h - 12 }, size: { w: 18, h: 17 } }],
    slotId
  };
}

/**
 * The common tank: a room (`V` litres, `T` kelvin, or dials for them) that every tank standing in its place has opened into. Returns the
 * fixture and the place (`tray`) to put the tanks in. `show.partials` prints each gas's own push, `show.fraction` its share of the particles.
 */
export function commonTank(id, at, { of = `${id}.valves`, V = 10, T = 300, volumes = null, volumeStart = 1, volumeNames = null, volumeLabel = 'Room', temps = null, tempList = 'C', tempStart = 1, show = {}, w = 64, cap = null, label = 'Common tank', words = 3, record = false, runLabel = 'Record' } = {}) {
  const dials = {};
  if (volumes) dials.volume = { min: 1, max: volumes.length, step: 1, value: volumeStart, label: volumeLabel, labels: volumeNames || volumes.map(v => `${v} L`) };
  if (temps) dials.temp = { min: 1, max: temps.length, step: 1, value: tempStart, label: 'Heater', labels: temps.map(t => tempLabel(t, tempList)) };
  const nd = Object.keys(dials).length;
  const top = nd ? 8 + (nd - 1) * 5 + 3.6 : 8.5;
  const tankH = 17;
  const trayH = 17;
  const trayY = top + (show.partials ? 14.2 + 3.4 * words + 2.5 : tankH + 3.5);
  const h = Math.round((trayY + trayH + 3 + (record ? 6.4 : 0)) * 10) / 10;
  const x0 = at.x - w / 2;
  const y0 = at.y - h / 2;
  return {
    fixture: {
      id, kind: 'common', label, at: { ...at }, size: { w, h }, ...(record ? { runLabel } : { noRun: true }), dials,
      props: { backdrop: true, of, V, T, ...(volumes ? { volumes } : {}), ...(temps ? { temps, tempList } : {}), show, tankH, top }
    },
    tray: { id: of, label: 'Valves open into the tank', at: { x: x0 + w / 2, y: y0 + trayY + trayH / 2 }, size: { w: w - 4, h: trayH }, cell: 15, ...(cap ? { cap } : {}) },
    size: { w, h }
  };
}

/**
 * A pinhole: chambers of gas, each with a hole in its wall, and a stopwatch dial. `chambers` are `{id, gas, label, sealed}`; `times` the
 * seconds the dial steps through. `showHalf` prints the time each takes to half-empty. Record writes the share left of chamber `recordIndex`.
 */
export function pinhole(id, at, { chambers, times, timeStart = 1, showHalf = false, w = null, h = null, recordIndex = 0, record = true, runLabel = 'Record', chamberH = 12 } = {}) {
  const dials = { time: { min: 1, max: times.length, step: 1, value: timeStart, label: 'Stopwatch', labels: times.map(t => `${t} s`) } };
  const width = w ?? (chambers.length > 1 ? 66 : 44);
  const height = h ?? (8 + 3.6 + 4 + chamberH + 6 + (showHalf ? 4.5 : 0) + (record ? 6.4 : 2.4));
  return {
    id, kind: 'pinhole', label: 'Pinhole', at: { ...at }, size: { w: width, h: Math.round(height * 10) / 10 }, dials,
    ...(record ? { runLabel } : { noRun: true }),
    props: { chambers, times, showHalf, recordIndex, chamberH, T: 300 }
  };
}

/** A tube of still air with a gas let in at each end and a stopwatch dial; a white ring forms where the two meet. */
export function tube(id, at, { ends, times, timeStart = 1, length = 100, w = 66, record = true, runLabel = 'Check' } = {}) {
  const dials = { time: { min: 1, max: times.length, step: 1, value: timeStart, label: 'Stopwatch', labels: times.map(t => `${t} s`) } };
  return {
    id, kind: 'tube', label: 'Tube', at: { ...at }, size: { w, h: 8 + 3.6 + 5 + 5.4 + 8 + (record ? 6.4 : 2.4) }, dials,
    ...(record ? { runLabel } : { noRun: true }),
    props: { ends, times, length }
  };
}

/** One particle's walk through a crowd of still ones, and a clock to run it for. */
export function walk(id, at, { times, timeStart = 1, seed = id, w = 62, h = 40, stepsPerSecond = 6 } = {}) {
  const dials = { time: { min: 1, max: times.length, step: 1, value: timeStart, label: 'Clock', labels: times.map(t => `${t} s`) } };
  return { id, kind: 'walk', label: 'One particle', at: { ...at }, size: { w, h }, noRun: true, dials, props: { times, seed, stepsPerSecond } };
}

/** A pressure gauge with three rings, turned by hand to a pressure (`atms`, in atmospheres). */
export function rings(id, at, { atms, start = 1, w = 56, h = 32 } = {}) {
  return {
    id, kind: 'rings', label: 'Reference gauge', at: { ...at }, size: { w, h }, noRun: true,
    dials: { pressure: { min: 1, max: atms.length, step: 1, value: start, label: 'Set to', labels: atms.map(a => `${a} atm`) } },
    props: { atms, max: Math.max(...atms) * 1.1, ringsAt: 22 }
  };
}

/** A printed reference: lines of text on a plate. */
export function plaqueFixture(id, label, at, lines, { w = 44 } = {}) {
  return { id, kind: 'plaque', label, at: { ...at }, size: { w, h: 8.4 + lines.length * 3.8 }, noRun: true, dials: {}, props: { lines: lines.slice() } };
}

/** A number to set: a marker the player sets to what they have read. */
export function markerFixture(id, label, at, { min = 0, max = 8, step = 0.5, w = 44, start = null, unit = '' } = {}) {
  return {
    id, kind: 'marker', label, at: { ...at }, size: { w, h: 16 }, noRun: true,
    dials: { value: { min, max, step, value: start ?? min, label: 'Set' } },
    props: { ...(unit ? { unit } : {}) }
  };
}

export * from './gas-read.js';
export { tankRead, seatedIn, secondsOf, GASES };
