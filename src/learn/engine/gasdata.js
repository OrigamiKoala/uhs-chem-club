/**
 * gasdata.js — The gas rig's tables and planners: every figure Bellows reads.
 *
 * PURE. No DOM, no canvas, no three.js, so `verify:learn` can import it in plain
 * Node and recompute every number a Bellows stage grades against. The drawn gas
 * rig (`gasrig.js`), the built one (`gasrig3d.js`), the foe model (`foes.js`) and
 * the quests all ask THIS file, which is what makes "the picture is what the
 * quest grades" true by construction.
 *
 * UNITS, ALL INTERNAL. Pressure in kPa, volume in litres, amount in moles,
 * temperature in kelvin. One litre-kilopascal is one joule, so the gas constant
 * is 8.314 in these units and the ideal law needs no conversion factor. A stage
 * declares its temperatures in the unit the bench prints them in (`toKelvin`).
 *
 * EVERY GAS IS A REAL ONE. Molar masses are the periodic table's, and the two
 * van der Waals constants are the standard measured pair (L^2 atm / mol^2 and
 * L / mol). The real-gas stages (q6-real) read `pressureVdw`; everything else
 * reads `pressureIdeal`, and a stage that is about a gas behaving ideally says so.
 */

/** The gas constant in L kPa / (mol K), which is J / (mol K). */
export const R = 8.314;
/** The same constant for a gauge that reads atmospheres. */
export const R_ATM = 0.08206;
/** One standard atmosphere, in kPa and in mmHg. */
export const ATM_KPA = 101.325;
export const ATM_MMHG = 760;
/** Boltzmann's constant, J / K, and Avogadro's number. */
export const K_B = 1.380649e-23;
export const N_A = 6.02214076e23;
/** 0 degrees C in kelvin. */
export const ZERO_C = 273.15;

/**
 * The gases the rig can hold. `M` is the molar mass in g/mol; `a` (L^2 atm /
 * mol^2) and `b` (L / mol) are the van der Waals constants. `sym` is the
 * formula the plate prints, `name` the plain English.
 */
export const GASES = {
  He: { sym: 'He', name: 'helium', M: 4.003, a: 0.0346, b: 0.0238 },
  Ne: { sym: 'Ne', name: 'neon', M: 20.18, a: 0.211, b: 0.0171 },
  Ar: { sym: 'Ar', name: 'argon', M: 39.95, a: 1.355, b: 0.0320 },
  Kr: { sym: 'Kr', name: 'krypton', M: 83.80, a: 2.325, b: 0.0396 },
  Xe: { sym: 'Xe', name: 'xenon', M: 131.3, a: 4.250, b: 0.0510 },
  H2: { sym: 'H₂', name: 'hydrogen', M: 2.016, a: 0.2476, b: 0.0266 },
  N2: { sym: 'N₂', name: 'nitrogen', M: 28.01, a: 1.370, b: 0.0387 },
  O2: { sym: 'O₂', name: 'oxygen', M: 32.00, a: 1.382, b: 0.0319 },
  CO2: { sym: 'CO₂', name: 'carbon dioxide', M: 44.01, a: 3.658, b: 0.0429 },
  CH4: { sym: 'CH₄', name: 'methane', M: 16.04, a: 2.300, b: 0.0430 },
  NH3: { sym: 'NH₃', name: 'ammonia', M: 17.03, a: 4.225, b: 0.0371 },
  HCl: { sym: 'HCl', name: 'hydrogen chloride', M: 36.46, a: 3.667, b: 0.0408 },
  Cl2: { sym: 'Cl₂', name: 'chlorine', M: 70.90, a: 6.343, b: 0.0542 },
  CO: { sym: 'CO', name: 'carbon monoxide', M: 28.01, a: 1.472, b: 0.0395 }
};

export const gasOf = key => GASES[key] || null;

/** Degrees C or kelvin to kelvin. */
export function toKelvin(value, unit = 'K') {
  return unit === 'C' ? value + ZERO_C : value;
}
export const toCelsius = K => K - ZERO_C;

/** kPa in the other two units a gauge can read. */
export const kPaToAtm = P => P / ATM_KPA;
export const kPaToMmHg = P => (P / ATM_KPA) * ATM_MMHG;

/* ------------------------------------------------------------------
   THE LAWS
   ------------------------------------------------------------------ */

/** P = nRT / V, in kPa. */
export function pressureIdeal(n, T, V) {
  if (!(V > 0)) return 0;
  return (n * R * T) / V;
}

/** V = nRT / P, in litres. */
export function volumeIdeal(n, T, P) {
  if (!(P > 0)) return 0;
  return (n * R * T) / P;
}

/** n = PV / RT, in moles. */
export function molesIdeal(P, V, T) {
  return (P * V) / (R * T);
}

/**
 * The van der Waals pressure, in kPa. The two corrections are returned too:
 * `pull` is the pressure the attraction between particles takes OFF, `room` is
 * the pressure the particles' own size puts ON (the ideal pressure at the room
 * that is actually left, minus the ideal pressure at the whole volume).
 */
export function pressureVdw(gas, n, T, V) {
  const g = GASES[gas];
  const a = g.a * ATM_KPA;        // L^2 kPa / mol^2
  const free = V - n * g.b;
  if (!(free > 0)) return { P: Infinity, pull: 0, room: Infinity, ideal: pressureIdeal(n, T, V) };
  const hard = (n * R * T) / free;
  const pull = (a * n * n) / (V * V);
  const ideal = pressureIdeal(n, T, V);
  return { P: hard - pull, pull, room: hard - ideal, ideal };
}

/** PV / nRT, the compression factor: one for an ideal gas. */
export function compression(P, n, T, V) {
  const denom = n * R * T;
  return denom > 0 ? (P * V) / denom : 1;
}

/* ------------------------------------------------------------------
   THE PARTICLES
   ------------------------------------------------------------------ */

const molKg = gas => GASES[gas].M / 1000;

/** The mean speed, root-mean-square speed and most probable speed, in m/s. */
export function speeds(gas, T) {
  const m = molKg(gas);
  return {
    mean: Math.sqrt((8 * R * T) / (Math.PI * m)),
    rms: Math.sqrt((3 * R * T) / m),
    peak: Math.sqrt((2 * R * T) / m)
  };
}

/** Average kinetic energy of one particle, in 10^-21 J: (3/2) k T. */
export function energyOf(T) {
  return (1.5 * K_B * T) / 1e-21;
}

/**
 * The knock counter: wall hits per square centimetre per second, in units of
 * 10^21. It is (1/4) (particles per volume) (mean speed), which is why it
 * climbs with the amount of gas, falls with the room and climbs only as the
 * square root of the temperature while the pressure climbs with the whole of it.
 */
export function knocks(gas, n, T, V) {
  if (!(V > 0)) return 0;
  const density = n / V;                      // mol per litre
  return 15.055 * density * speeds(gas, T).mean;
}

/**
 * Speed distribution as bin fractions: the share of particles with speed in
 * each of `bins` equal bins from 0 to `vmax` m/s. The fractions sum to the share
 * of the distribution inside the axis (1, to a rounding error, if vmax is wide).
 */
export function speedBins(gas, T, bins = 24, vmax = 2400) {
  const m = molKg(gas);
  const A = 4 * Math.PI * Math.pow(m / (2 * Math.PI * R * T), 1.5);
  const B = m / (2 * R * T);
  const pdf = v => A * v * v * Math.exp(-B * v * v);
  const dv = vmax / bins;
  const out = [];
  for (let i = 0; i < bins; i++) {
    // Simpson over the bin: the distribution is smooth, three points are plenty.
    const a = i * dv; const b = a + dv;
    out.push(((b - a) / 6) * (pdf(a) + 4 * pdf((a + b) / 2) + pdf(b)));
  }
  return out;
}

/** The share of all particles moving faster than `v` m/s. */
export function fractionAbove(gas, T, v) {
  const m = molKg(gas);
  const A = 4 * Math.PI * Math.pow(m / (2 * Math.PI * R * T), 1.5);
  const B = m / (2 * R * T);
  const pdf = u => A * u * u * Math.exp(-B * u * u);
  const top = Math.max(v, 0) + 8 * Math.sqrt(1 / (2 * B)) + 1;
  const steps = 2000;
  const dv = (top - v) / steps;
  let s = 0;
  for (let i = 0; i < steps; i++) {
    const a = v + i * dv; const b = a + dv;
    s += ((b - a) / 6) * (pdf(a) + 4 * pdf((a + b) / 2) + pdf(b));
  }
  return Math.min(1, Math.max(0, s));
}

/* ------------------------------------------------------------------
   LEAKING AND SPREADING
   ------------------------------------------------------------------ */

/**
 * Effusion: the rate a gas leaks through a pinhole goes as its mean speed,
 * which goes as one over the square root of its molar mass. `rate` is relative
 * to a gas of molar mass 28 (so nitrogen is 1) at the same temperature and
 * density, in "emptyings per second" scaled so the stages read in whole seconds.
 */
export function leakRate(gas, T = 300) {
  return speeds(gas, T).mean / speeds('N2', 300).mean;
}

/** The share of a chamber's particles still inside after `t` seconds with the hole open. */
export function leftAfter(gas, t, T = 300, k0 = Math.LN2) {
  // Calibrated so that hydrogen is half empty after one second, and every other
  // gas is slower by the ratio of the speeds: the root of the mass.
  const k = k0 * (speeds(gas, T).mean / speeds('H2', T).mean);
  return Math.exp(-k * t);
}

/** Seconds until half the gas has left, with the same calibration. */
export function halfTime(gas, T = 300) {
  return Math.LN2 / (Math.LN2 * (speeds(gas, T).mean / speeds('H2', T).mean));
}

/**
 * Diffusion across a tube: how far a gas front has crept in `t` seconds. Lighter
 * gases are quicker (Graham), but the whole scale is collisions with the air that
 * is already there, so the front moves in centimetres where the particles move in
 * hundreds of metres a second. `front` is in cm. It is calibrated so ammonia
 * moves at 1 cm a second.
 */
export function front(gas, t) {
  const rel = Math.sqrt(GASES.NH3.M / GASES[gas].M);
  return rel * t;
}

/* ------------------------------------------------------------------
   THE STATE OF A PLATE
   ------------------------------------------------------------------ */

/**
 * What a cylinder plate reads under the bench's present settings.
 *
 * A plate declares its gas and a starting state; the bench's dials and keys move
 * it. `item.hold` says what the cylinder keeps steady when something else moves:
 *   'V'     a rigid tank. The room is fixed at `item.V`.
 *   'P'     a free piston under a steady weight. The pressure is fixed at
 *           `item.P0` kPa, and the room is whatever the gas needs.
 *   'dial'  (default) the piston is driven by the volume dial; with no volume
 *           dial on the stage it is simply held at `item.V`.
 * The temperature is the temperature dial's when the stage has one and the
 * plate follows it, otherwise the plate's own `item.T` (kelvin).
 *
 * @param {object} item  the plate, with its live amount `item.n`
 * @param {object} cfg   the bench's dials: `volumes`, `volume`, `temps`, `temp`, `tempUnit`
 */
export function stateOf(item, cfg = {}) {
  const gas = item.gas;
  const n = item.n ?? 1;
  let T = item.T ?? 298.15;
  if (cfg.temps?.length && item.follow !== false) {
    // The list is in the unit the stage declared it in, whatever the thermometer prints.
    T = toKelvin(cfg.temps[(cfg.temp || 1) - 1], cfg.tempList || (cfg.tempUnit === 'K' ? 'K' : 'C'));
  }
  let V = item.V ?? 24.8;
  let P;
  if (item.hold === 'P') {
    P = item.P0 ?? ATM_KPA;
    V = volumeIdeal(n, T, P);
  } else {
    if (cfg.volumes?.length && item.hold !== 'V' && item.follow !== false) V = cfg.volumes[(cfg.volume || 1) - 1];
    if (item.vdw) {
      const r = pressureVdw(gas, n, T, V);
      P = r.P;
    } else {
      P = pressureIdeal(n, T, V);
    }
  }
  return { gas, n, T, V, P, Z: compression(P, n, T, V) };
}

/** Everything the plate prints about a state, from the one function that decides it. */
export function planGas(item, cfg = {}) {
  const s = stateOf(item, cfg);
  const sp = speeds(s.gas, s.T);
  const vd = pressureVdw(s.gas, s.n, s.T, s.V);
  return {
    ...s,
    atm: kPaToAtm(s.P),
    mmHg: kPaToMmHg(s.P),
    tC: toCelsius(s.T),
    mass: s.n * GASES[s.gas].M,
    knocks: knocks(s.gas, s.n, s.T, s.V),
    energy: energyOf(s.T),
    mean: sp.mean, rms: sp.rms, peak: sp.peak,
    pull: vd.pull, room: vd.room,
    // The share of the push the pull takes off: it grows as a gas cools, though the pull itself does not.
    pullShare: Number.isFinite(vd.pull) && s.P + vd.pull > 0 ? vd.pull / (s.P + vd.pull) : 0,
    // How full the window looks: the particles' own share of the room.
    crowd: Math.min(0.6, (s.n * GASES[s.gas].b) / (4 * Math.max(s.V, 1e-6)))
  };
}

/** How many dots the window draws for an amount of gas: one dot is a twelfth of a mole. */
export const DOTS_PER_MOL = 12;
export const MAX_DOTS = 56;
export function dotsFor(n) {
  return Math.max(1, Math.min(MAX_DOTS, Math.round(n * DOTS_PER_MOL)));
}

/* ------------------------------------------------------------------
   MIXTURES (q4-mixtures)
   ------------------------------------------------------------------ */

/**
 * The room and temperature a mixture plate is at under the bench's dials: its
 * own declaration, or the dial's when the stage has one and the plate follows it.
 */
export function mixtureState(item, cfg = {}) {
  let T = item.T ?? 298.15;
  let V = item.V ?? 10;
  if (cfg.temps?.length && item.follow !== false) {
    T = toKelvin(cfg.temps[(cfg.temp || 1) - 1], cfg.tempList || (cfg.tempUnit === 'K' ? 'K' : 'C'));
  }
  if (cfg.volumes?.length && item.follow !== false) V = cfg.volumes[(cfg.volume || 1) - 1];
  return { T, V };
}

/**
 * A tank of mixed gas: `parts` is `[{ gas, n }]`. The total pressure is the sum
 * of what each part would read alone in the same room, because the particles do
 * not feel one another. Nothing here is a rule; it is the ideal law applied to
 * each part, and the sum is a result.
 */
export function planMixture(parts, T, V) {
  const nTotal = parts.reduce((s, p) => s + p.n, 0);
  const rows = parts.map(p => ({
    gas: p.gas,
    n: p.n,
    P: pressureIdeal(p.n, T, V),
    x: nTotal > 0 ? p.n / nTotal : 0,
    knocks: knocks(p.gas, p.n, T, V)
  }));
  return { nTotal, P: rows.reduce((s, r) => s + r.P, 0), rows, T, V };
}

/** Air, by moles in a hundred: nitrogen, oxygen, argon. */
export const AIR = [
  { gas: 'N2', n: 78.1 },
  { gas: 'O2', n: 20.9 },
  { gas: 'Ar', n: 0.9 }
];

/** The pressure of the air at a height, in kPa, from the isothermal barometric formula (scale height 8.4 km). */
export function airPressureAt(heightM) {
  return ATM_KPA * Math.exp(-heightM / 8400);
}

/* ------------------------------------------------------------------
   THE RECORD (a plotted curve of the ideal law)
   ------------------------------------------------------------------ */

/**
 * The curve a record plots: pairs of (x, y) from the ideal law with the other quantities held. `item.record` is
 * `{x, y, fixed: {n, T, V, P}, xmin, xmax}` where x and y are 'V', 'P', 'T' or 'n'. Whichever of P and V is not plotted and
 * not fixed is the one the law solves for.
 */
export function recordCurve(item, points = 40) {
  const { x, y, fixed = {}, xmin, xmax } = item.record;
  const out = [];
  for (let i = 0; i <= points; i++) {
    const xv = xmin + ((xmax - xmin) * i) / points;
    const st = { n: fixed.n ?? 1, T: fixed.T ?? 300, V: fixed.V ?? 10, P: fixed.P ?? ATM_KPA };
    if (x === 'V') st.V = Math.max(xv, 1e-6);
    if (x === 'T') st.T = xv;
    if (x === 'n') st.n = xv;
    if (x === 'P') st.P = xv;
    if (y === 'P') st.P = pressureIdeal(st.n, st.T, st.V);
    else if (y === 'V') st.V = volumeIdeal(st.n, st.T, st.P);
    else if (y === 'T') st.T = (st.P * st.V) / (st.n * R);
    out.push({ x: xv, y: y === 'P' ? st.P : y === 'V' ? st.V : y === 'T' ? st.T : st.n });
  }
  return out;
}

/* ------------------------------------------------------------------
   FORMATTING THE PLATES SHARE
   ------------------------------------------------------------------ */

/** A reading to a number of significant figures, without a trailing exponent. */
export function sig(x, digits = 3) {
  if (!Number.isFinite(x)) return '—';
  if (x === 0) return '0';
  const mag = Math.floor(Math.log10(Math.abs(x)));
  const dec = Math.max(0, digits - 1 - mag);
  return x.toFixed(Math.min(dec, 6));
}

/** A volume in litres, kept short. */
export function litres(V) {
  return V >= 100 ? V.toFixed(0) : V >= 10 ? V.toFixed(1) : V >= 1 ? V.toFixed(2) : V.toFixed(3);
}

/* ------------------------------------------------------------------
   A STAGE, AS THE PLATES READ IT
   A quest's `check()` grades from the stage's declaration and the dials, and
   never from a figure typed beside it. These are the pure functions that turn
   a stage plus the quest's state into exactly what the bench would read.
   ------------------------------------------------------------------ */

/** The bench configuration a stage declares, with the dials where `state` has them. */
export function benchCfg(stage, state = {}) {
  return {
    volumes: stage.volumes || [], volume: state.volume ?? stage.volumeStart ?? 1,
    temps: stage.temps || [], temp: state.temp ?? stage.tempStart ?? 1,
    tempList: stage.tempList || 'C',
    tempUnit: stage.tempUnit || 'C',
    times: stage.times || [], time: state.time ?? stage.timeStart ?? 1,
    step: stage.step ?? 1, nMin: stage.nMin ?? 0.5, nMax: stage.nMax ?? 4,
    labels: stage.labels || {}, show: stage.show || {}, scale: stage.scale || 'plain',
    vmax: stage.vmax || 0, gaugeMax: stage.gaugeMax || 400,
    thermoLo: stage.thermoLo ?? -50, thermoHi: stage.thermoHi ?? 450,
    trace: stage.trace || null, inset: stage.inset || null, bar: stage.bar ?? null,
    speedMax: stage.speedMax || 2400, units: Boolean(stage.units),
    volumeNames: stage.volumeNames || null, volumeLabel: stage.volumeLabel || null
  };
}

/** A stage's plate as the bench holds it: the declaration, with the live amount of gas. */
export function itemFor(stage, id, state = {}) {
  const rig = (stage.rigs || []).find(r => r.id === id);
  if (!rig) return null;
  const live = state.amounts && state.amounts[id] !== undefined ? state.amounts[id] : rig.n;
  if (rig.head === 'mixture') {
    const parts = state.parts && state.parts[id] ? state.parts[id] : rig.parts;
    return { ...rig, parts };
  }
  return { ...rig, n: live ?? 1 };
}

/** What a stage's cylinder plate reads, from the stage's own declaration. */
export function readOf(stage, id, state = {}) {
  const it = itemFor(stage, id, state);
  if (!it) return null;
  if (it.head === 'mixture') {
    const m = mixtureState(it, benchCfg(stage, state));
    return { ...planMixture(it.parts, m.T, m.V), head: 'mixture' };
  }
  return planGas(it, benchCfg(stage, state));
}

/** The seconds a stage's time dial is at. */
export function secondsOf(stage, state = {}) {
  return (stage.times || [])[(state.time ?? stage.timeStart ?? 1) - 1] ?? 0;
}
