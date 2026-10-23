/**
 * kits/gas-read.js — What the gas kit's rigs, tanks and holes read.
 *
 * PURE, NODE-IMPORTABLE, NO DOM. Every figure is `gasdata.js` asked about what the table holds: `planGas` for a cylinder (the
 * ideal law, or van der Waals when a stage says its gas is real), `planMixture` for the gases in a common tank, `speedBins` and
 * `fractionAbove` for the crowd of speeds, `leftAfter` and `halfTime` for a pinhole, `front` for a tube. This file only reads
 * what the table holds: the settings of the dials (indexes into the stage's own lists), the tanks standing in a place, the
 * pellet in the acid dish. A stage declares what stands on the table and what to look for; it never declares what a reading is.
 *
 * `gasdata.js` and its planners are the single implementation of every gas figure (the drawn bench, the foe model and the
 * quests all ask it); nothing here is a second one.
 */

import {
  GASES, planGas, planMixture, stateOf, speedBins, fractionAbove, leftAfter, halfTime, front, kPaToAtm, kPaToMmHg, AIR, airPressureAt,
  toKelvin, toCelsius, R, R_ATM, ATM_KPA, pressureIdeal, volumeIdeal, molesIdeal, dotsFor, speeds, knocks, energyOf, sig, litres, ZERO_C, recordCurve, pressureVdw, compression
} from '../../engine/gasdata.js';

export {
  GASES, planGas, planMixture, stateOf, speedBins, fractionAbove, leftAfter, halfTime, front, kPaToAtm, kPaToMmHg, AIR, airPressureAt,
  toKelvin, toCelsius, R, R_ATM, ATM_KPA, pressureIdeal, volumeIdeal, molesIdeal, dotsFor, speeds, knocks, energyOf, sig, litres, ZERO_C, recordCurve, pressureVdw, compression
};

/** What a pellet of calcium carbonate is: its molar mass, and one mole of gas for each mole of solid. */
export const CACO3_M = 100.09;
export const PELLET_G = 5.0;
export const pelletMoles = (grams = PELLET_G) => grams / CACO3_M;

const live = p => p && !p.hidden;
export const seatedIn = (state, slotId) => (slotId ? Object.values(state.pieces).find(p => live(p) && p.zone === `slot:${slotId}`) || null : null);
export const whereIs = (state, id) => (state.pieces[id]?.zone || '').replace(/^(tray|slot|container):/, '');
export const piecesInTray = (state, trayId) => Object.values(state.pieces).filter(p => live(p) && p.zone === `tray:${trayId}`);

/* ------------------------------------------------------------------
   THE RIG: a cylinder with a piston, a gauge and a thermometer
   ------------------------------------------------------------------ */

/** The bench configuration a rig's dials stand at, in the shape `gasdata.stateOf` reads. */
export function rigCfg(f) {
  const p = f.props;
  const d = f.dials;
  return {
    volumes: p.volumes || [], volume: d.volume ? Math.round(d.volume.value) : 1,
    temps: p.temps || [], temp: d.temp ? Math.round(d.temp.value) : 1,
    tempList: p.tempList || 'K',
    tempUnit: p.tempUnit || 'both'
  };
}

/** The amount of gas in cylinder `c` of rig `f`: the amount dial's, the pellet's, or the cylinder's own. */
export function amountOf(state, f, c) {
  const p = f.props;
  if (p.pellet && c.pellet !== false) {
    const dish = seatedIn(state, p.pellet);
    return dish && dish.kind === 'pellet' ? pelletMoles(dish.props.grams ?? PELLET_G) : 0;
  }
  if (f.dials.amount && p.amounts) return p.amounts[Math.round(f.dials.amount.value) - 1];
  return c.n ?? 1;
}

/** Every cylinder a rig holds, read: `planGas` plus the figures a plate prints beside it. */
export function rigRead(state, id) {
  const f = state.fixtures[id];
  const cfg = rigCfg(f);
  return (f.props.cyls || []).map(c => {
    const n = amountOf(state, f, c);
    const item = { gas: c.gas, n, T: c.T ?? 300, V: c.V ?? 20, hold: c.hold || 'dial', P0: c.P0, vdw: c.vdw, follow: c.follow };
    const q = planGas(item, cfg);
    // `ideal` is what the plain gas law says the gauge should read at this room, amount and temperature: the real gas (`vdw`) is held to it.
    return { ...q, id: c.id, label: c.label || c.id, sym: GASES[c.gas].sym, name: GASES[c.gas].name, n, dots: dotsFor(n || 0.0001), pelletDish: f.props.pellet || null, ideal: pressureIdeal(n, q.T, q.V), gasKey: c.gas };
  });
}

/**
 * The readings a rig WOULD give with some of its dials turned to other settings: `set` is `{volume: 3, temp: 5}` (indexes into the stage's
 * own lists). It changes nothing on the table; a stage's `check` uses it to ask what moves when a dial does, instead of declaring it.
 */
export function rigAt(state, id, set = {}) {
  const f = state.fixtures[id];
  const dials = { ...f.dials };
  for (const [name, v] of Object.entries(set)) if (dials[name]) dials[name] = { ...dials[name], value: v };
  return rigRead({ ...state, fixtures: { ...state.fixtures, [id]: { ...f, dials } } }, id);
}

/** The reading of cylinder `which` (an index or an id) of rig `id`. */
export function cylRead(state, id, which = 0) {
  const all = rigRead(state, id);
  return typeof which === 'number' ? all[which] : all.find(c => c.id === which);
}

/** A named quantity of a read cylinder, in the units its plate prints. */
export function valueOf(q, key) {
  switch (key) {
    case 'V': return q.V;
    case 'P': return q.P;
    case 'atm': return q.atm;
    case 'PVatm': return q.atm * q.V;
    case 'T': return q.T;
    case 'TC': return q.tC;
    case 'n': return q.n;
    case 'knocks': return q.knocks;
    case 'speed': return q.mean;
    case 'Z': return q.Z;
    case 'PV': return q.P * q.V;
    case 'nT': return q.n * q.T;
    case 'invV': return 1 / q.V;
    case 'pullShare': return q.pullShare * 100;
    case 'ideal': return q.ideal;
    default: return NaN;
  }
}

/** The speed screen of a read cylinder: the share of particles in each of 24 bars, 0 to `max` m/s. */
export function speedScreen(q, max = 2400) {
  return speedBins(q.gas, q.T, 24, max);
}

/** The bar a speed falls in, and the tallest bar's index. */
export const barOf = (v, max = 2400, bins = 24) => Math.min(bins - 1, Math.floor(v / (max / bins)));
export const tallestBar = (bins) => bins.indexOf(Math.max(...bins));

/** The share of a cylinder's particles moving faster than `v` m/s. */
export const shareAbove = (q, v) => fractionAbove(q.gas, q.T, v);

/** The compression factor and the two corrections of a real-gas cylinder. */
export const lawCheck = q => q.Z;

/** What a rig's `run` writes on the recorder: a row of the quantities the stage plots. */
export function rigRun(state, id) {
  const f = state.fixtures[id];
  const plot = f.props.plot;
  if (!plot) return null;
  const q = cylRead(state, id, plot.cyl || 0);
  const x = valueOf(q, plot.x);
  const y = valueOf(q, plot.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x: Math.round(x * 1e6) / 1e6, y: Math.round(y * 1e6) / 1e6, label: q.label };
}

/* ------------------------------------------------------------------
   THE SEALED BOX: one gas, a heater, and a gauge on each of three walls
   ------------------------------------------------------------------ */

/** The walls a box carries a gauge on, in the order the picture prints them. */
export const BOX_WALLS = Object.freeze([['roof', 'ROOF'], ['side', 'SIDE WALL'], ['floor', 'FLOOR']]);

/**
 * The box under its heater dial, read: the gas (`planGas`, one cylinder held at its room) and the push on each wall. The gas knocks every
 * wall the same, because its particles go every way alike, so the three gauges are one figure; nothing here chooses that, the planner's
 * single pressure is read at all three. (The weight of a gas is far too small to show on a gauge, which is why the floor is no different.)
 */
export function boxRead(state, id) {
  const f = state.fixtures[id];
  const p = f.props;
  const cfg = { temps: p.temps || [], temp: f.dials.temp ? Math.round(f.dials.temp.value) : 1, tempList: p.tempList || 'C', volumes: [], volume: 1 };
  const q = planGas({ gas: p.gas, n: p.n ?? 1, T: p.T ?? 300, V: p.V ?? 10, hold: 'V' }, cfg);
  return { ...q, id, sym: GASES[p.gas].sym, dots: dotsFor(q.n), gasKey: p.gas, walls: BOX_WALLS.map(([wid, label]) => ({ id: wid, label, P: q.P })) };
}

/* ------------------------------------------------------------------
   TANKS AND THE COMMON TANK
   ------------------------------------------------------------------ */

/** The amount of gas in a tank piece: its own (`n`), or what its gauge says (P, V, T). */
export function tankMoles(p) {
  const pr = p.props;
  if (Array.isArray(pr.parts)) return pr.parts.reduce((s, x) => s + x.n, 0);
  return pr.n != null ? pr.n : molesIdeal(pr.P, pr.V, pr.T);
}

/** A tank's reading: what its own gauge shows. */
export function tankRead(p) {
  const pr = p.props;
  const V = pr.V ?? 10;
  const T = pr.T ?? 300;
  if (Array.isArray(pr.parts)) {
    const m = planMixture(pr.parts, T, V);
    return { parts: pr.parts, n: m.nTotal, V, T, P: m.P, mass: pr.parts.reduce((s, x) => s + x.n * GASES[x.gas].M, 0), rows: m.rows };
  }
  const n = tankMoles(p);
  const P = pr.P != null ? pr.P : pressureIdeal(n, T, V);
  return { gas: pr.gas, n, V, T, P, mass: n * GASES[pr.gas].M, rows: [{ gas: pr.gas, n, P, x: 1 }] };
}

/** The grams of gas in a tank: what the scale reads for it. */
export const tankGrams = p => tankRead(p).mass;

/**
 * The common tank: every tank standing in its place (`props.of`, a tray) has opened its valve into it, so each gas in them is
 * in the room the common tank has, at its temperature. The pressure of each is its own amount's (the particles do not feel one
 * another); the total is the sum, which is a result and never a rule.
 */
export function commonRead(state, id) {
  const f = state.fixtures[id];
  const tanks = piecesInTray(state, f.props.of);
  const T = commonTemp(f);
  const V = commonVolume(f);
  const byGas = new Map();
  for (const t of tanks) {
    const pr = t.props;
    const parts = Array.isArray(pr.parts) ? pr.parts : [{ gas: pr.gas, n: tankMoles(t) }];
    for (const part of parts) byGas.set(part.gas, (byGas.get(part.gas) || 0) + part.n);
  }
  const parts = [...byGas.entries()].map(([gas, n]) => ({ gas, n }));
  const m = planMixture(parts, T, V);
  return { tanks, T, V, parts, ...m, n: m.nTotal };
}

function commonTemp(f) {
  const p = f.props;
  if (f.dials.temp && p.temps) return toKelvin(p.temps[Math.round(f.dials.temp.value) - 1], p.tempList || 'C');
  return p.T ?? 300;
}
function commonVolume(f) {
  const p = f.props;
  if (f.dials.volume && p.volumes) return p.volumes[Math.round(f.dials.volume.value) - 1];
  return p.V ?? 10;
}
export { commonTemp, commonVolume };

/** The partial pressure of `gas` in a common tank, or 0. */
export const partialOf = (read, gas) => read.rows.find(r => r.gas === gas)?.P ?? 0;

/** The scale: the tank in its pan, and what it weighs. */
export function scaleRead(state, id) {
  const f = state.fixtures[id];
  const tank = seatedIn(state, f.props.slot);
  if (!tank || tank.kind !== 'tank') return { tank: null, grams: null };
  return { tank, grams: tankGrams(tank) };
}

/* ------------------------------------------------------------------
   THE PINHOLE, THE TUBE AND THE WALK
   ------------------------------------------------------------------ */

/** The seconds a time dial stands at. */
export function secondsOf(f) {
  const times = f.props.times || [];
  return times[Math.round(f.dials.time.value) - 1] ?? 0;
}

/** The pinhole fixture: each chamber's share left after the dial's seconds, and the seconds it takes to half-empty. */
export function pinholeRead(state, id) {
  const f = state.fixtures[id];
  const t = secondsOf(f);
  const T = f.props.T ?? 300;
  return {
    seconds: t,
    chambers: (f.props.chambers || []).map(c => {
      // A chamber may carry a gas dial (`pick`): the gas is the one the dial stands at, so a reference can be set to match a sample.
      const gas = c.pick ? c.pick.gases[Math.round(f.dials[c.pick.dial].value) - 1] : c.gas;
      return { ...c, gas, sym: GASES[gas].sym, name: GASES[gas].name, left: leftAfter(gas, t, T), half: halfTime(gas, T) };
    })
  };
}

/** The tube: how far each gas has crept, and where the ring has formed (cm from the ammonia end) once the two have met. */
export function tubeRead(state, id) {
  const f = state.fixtures[id];
  const t = secondsOf(f);
  const L = f.props.length ?? 100;
  const a = f.props.ends[0];         // gas released at the left end
  const b = f.props.ends[1];         // gas released at the right end
  const fa = Math.min(L, front(a, t));
  const fb = Math.min(L, front(b, t));
  const met = fa + fb >= L - 1e-9;
  // The two fronts meet where the faster one has gone `ra / (ra + rb)` of the way.
  const ra = front(a, 1);
  const rb = front(b, 1);
  const ringFromLeft = (ra / (ra + rb)) * L;
  return { seconds: t, length: L, ends: [a, b], fronts: [fa, fb], met, ring: met ? ringFromLeft : null, ringFromLeft, rates: [ra, rb] };
}

/** One particle's track through a crowd of still ones: a random walk, seeded so it is the same track every time. */
export function walkTrack(seed, seconds, stepsPerSecond = 6, speed = 1) {
  let a = 0;
  for (const ch of String(seed)) a = (a * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const points = [{ x: 0, y: 0 }];
  const total = Math.max(0, Math.round(seconds * stepsPerSecond));
  let x = 0; let y = 0; let length = 0;
  for (let i = 0; i < total; i++) {
    const ang = rnd() * Math.PI * 2;
    const run = (10 + rnd() * 14) * speed;
    x += Math.cos(ang) * run; y += Math.sin(ang) * run;
    length += run;
    points.push({ x, y });
  }
  return { points, length, net: Math.hypot(x, y), hits: total };
}

export function walkRead(state, id) {
  const f = state.fixtures[id];
  const t = secondsOf(f);
  const w = walkTrack(f.props.seed || id, t, f.props.stepsPerSecond || 6);
  return { seconds: t, ...w };
}

/** The marker (a dial the player sets to a number they have read). */
export const markerRead = (state, id) => state.fixtures[id].dials.value.value;
