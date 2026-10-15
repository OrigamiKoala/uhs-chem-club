/**
 * lightdata.js — The real numbers behind Lanternfall's light bench, and the pure
 * functions that turn a declaration into a reading.
 *
 * PURE, NODE-IMPORTABLE, NO DOM. The drawn bench (`lightbench.js`) and the built
 * one (`lightbench3d.js`) both draw from these, and `verify:learn` imports them to
 * hold every stage's figures to the real tables below. A stage that is graded on
 * a number graded against THIS file, so the screen and the answer cannot drift.
 *
 * Every constant is a measured one, to the figures AP chemistry uses:
 *   h = 6.626 x 10^-34 J s,  c = 3.00 x 10^8 m/s,  1 eV = 1.602 x 10^-19 J.
 */

export const PLANCK = 6.626e-34;
export const LIGHT_SPEED = 3.00e8;
export const EV = 1.602e-19;
export const ELECTRON_MASS = 9.109e-31;
/** The Bohr constant: E_n = -RYDBERG_J / n^2. */
export const RYDBERG_J = 2.18e-18;

/** The band the eye answers to, in nm. */
export const VISIBLE = { min: 380, max: 750 };

/** Frequency, in Hz, of light of wavelength `nm`. */
export function nmToHz(nm) { return LIGHT_SPEED / (nm * 1e-9); }

/** Energy, in joules, of one photon of wavelength `nm`. */
export function photonJoules(nm) { return PLANCK * nmToHz(nm); }

/** The same energy in electron volts. */
export function photonEv(nm) { return photonJoules(nm) / EV; }

/** Wavelength, in nm, of a photon carrying `joules`. */
export function joulesToNm(joules) { return (PLANCK * LIGHT_SPEED) / joules * 1e9; }

/** Is this wavelength one the eye answers to? */
export function isVisible(nm) { return nm >= VISIBLE.min && nm <= VISIBLE.max; }

/**
 * Frequency as a mantissa over 10^14 per second, rounded to `digits` decimals.
 * Every readout on the bench quotes frequency in this unit.
 */
export function freqE14(nm, digits = 2) {
  return Number((nmToHz(nm) / 1e14).toFixed(digits));
}

/**
 * A wavelength as light, the way a screen would paint it: an sRGB triple 0..255,
 * or null outside the visible band. The usual piecewise spectral ramp with the
 * ends dimmed, because the eye answers weakly there.
 */
export function wavelengthRgb(nm) {
  if (!isVisible(nm)) return null;
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else { r = 1; }
  let k = 1;
  if (nm < 420) k = 0.35 + 0.65 * (nm - 380) / 40;
  else if (nm > 700) k = 0.35 + 0.65 * (750 - nm) / 50;
  const f = v => Math.round(255 * Math.pow(Math.max(0, v * k), 0.8));
  return [f(r), f(g), f(b)];
}

/** Which part of the electromagnetic spectrum a wavelength belongs to. */
export function regionOf(nm) {
  if (nm < 0.01) return 'gamma';
  if (nm < 10) return 'x-ray';
  if (nm < VISIBLE.min) return 'ultraviolet';
  if (nm <= VISIBLE.max) return 'visible';
  if (nm < 1e6) return 'infrared';
  if (nm < 1e9) return 'microwave';
  return 'radio';
}

/* ------------------------------------------------------------------
   THE TRACE HEAD
   ------------------------------------------------------------------ */

/**
 * What the trace screen shows for a lamp: how many crests fit across the ruler,
 * and what the timing gate counts. The ruler's span is a property of the screen,
 * not of the light, so the same span is used for every lamp and a short
 * wavelength simply crowds more crests into it.
 */
export const TRACE_SPAN_NM = 2400;

export function planTrace(nm, span = TRACE_SPAN_NM) {
  return {
    nm,
    crests: span / nm,
    hz: nmToHz(nm),
    e14: freqE14(nm),
    rgb: wavelengthRgb(nm),
    span
  };
}

/* ------------------------------------------------------------------
   THE PRISM HEAD
   ------------------------------------------------------------------ */

/** Real emission lines, in nm. */
export const LINES = {
  H: [656, 486, 434, 410],
  He: [588, 502, 447],
  Na: [589],
  Hg: [405, 436, 546, 578],
  // Neon has many lines, mostly 585-703 nm.
  Ne: [585, 588, 594, 597, 603, 607, 609, 614, 616, 621, 626, 633, 638, 640, 650, 653, 659, 667, 692, 703]
};

/** What a symbol stands for. */
export const GASES = {
  H: { name: 'hydrogen', symbol: 'H' },
  He: { name: 'helium', symbol: 'He' },
  Ne: { name: 'neon', symbol: 'Ne' },
  Na: { name: 'sodium', symbol: 'Na' },
  Hg: { name: 'mercury', symbol: 'Hg' }
};

/** The scale the prism lays its band on. */
export const PRISM_RANGE = { lo: 380, hi: 750 };

/**
 * What the prism shows for a rig:
 *   - `lines` of bright lines on a dark band (a gas tube glowing),
 *   - a continuous band (a hot filament),
 *   - a continuous band with dark lines cut out of it (filament light through
 *     cool gas).
 * Anything past the band is reported in `beyond`, where the detector strips read.
 */
export function planPrism(rig) {
  const src = rig.source || {};
  if (src.type === 'tube') {
    const nms = (src.nm || LINES[src.gas] || []).slice();
    return {
      continuous: false,
      bright: nms.filter(isVisible),
      dark: [],
      beyond: nms.filter(n => !isVisible(n))
    };
  }
  if (src.type === 'cool') {
    const nms = (src.nm || LINES[src.gas] || []).slice();
    return { continuous: true, bright: [], dark: nms.filter(isVisible), beyond: [] };
  }
  if (src.type === 'lamp') {
    const nm = src.nm;
    return {
      continuous: false,
      bright: isVisible(nm) ? [nm] : [],
      dark: [],
      beyond: isVisible(nm) ? [] : [nm]
    };
  }
  // A hot filament: unbroken, and it glows past both ends of the band.
  return { continuous: true, bright: [], dark: [], beyond: [], glowsBeyond: true };
}

/** Which detector strip a wavelength outside the band lands on, or null. */
export function detectorFor(nm) {
  if (isVisible(nm)) return null;
  return nm > VISIBLE.max ? 'infrared' : 'ultraviolet';
}

/* ------------------------------------------------------------------
   THE PHOTOCELL HEAD
   ------------------------------------------------------------------ */

/** Work functions, in eV: the least energy that frees an electron from the metal. */
export const METALS = {
  Cs: { name: 'cesium', work: 2.1 },
  Na: { name: 'sodium', work: 2.3 },
  Zn: { name: 'zinc', work: 4.3 }
};

/** The longest wavelength that frees any electron from a metal, in nm. */
export function thresholdNm(metal) {
  return (PLANCK * LIGHT_SPEED) / (METALS[metal].work * EV) * 1e9;
}

/** Brightness settings the bench offers, lowest to highest. */
export const BRIGHTNESS = { min: 1, max: 5 };

/**
 * What the photocell reads: electrons freed per second (proportional to
 * brightness, and only when one photon carries enough), and the speed of the
 * fastest of them in units of 10^5 m/s (set by the photon's energy alone).
 */
export function planPhotocell(metal, nm, brightness) {
  const phi = METALS[metal].work;
  const eV = photonEv(nm);
  const ke = eV - phi;
  if (ke <= 0) {
    return { count: 0, speed: 0, ke: 0, photonEv: eV, freed: false };
  }
  const v = Math.sqrt((2 * ke * EV) / ELECTRON_MASS) / 1e5;
  return {
    count: brightness * 20,
    speed: Number(v.toFixed(1)),
    ke,
    photonEv: eV,
    freed: true
  };
}

/* ------------------------------------------------------------------
   BOHR'S LADDER (the energy-ladder plate)
   ------------------------------------------------------------------ */

/** Energy of level n of hydrogen, in joules (negative: bound). */
export function bohrJoules(n) { return -RYDBERG_J / (n * n); }

/** The jump from level `hi` down to `lo`: its energy and the line it makes. */
export function planJump(hi, lo) {
  const dE = bohrJoules(hi) - bohrJoules(lo);
  const joules = Math.abs(dE);
  return { hi, lo, joules, nm: joulesToNm(joules) };
}

/** Which jump onto level 2 makes the line at `nm`, or null. */
export function jumpForLine(nm) {
  for (const hi of [3, 4, 5, 6]) {
    if (Math.abs(planJump(hi, 2).nm - nm) < 3) return { hi, lo: 2 };
  }
  return null;
}

/* ------------------------------------------------------------------
   THE CUVETTE HEAD
   ------------------------------------------------------------------ */

/**
 * Solutions the cuvette holds. `peak` is where each absorbs most, `width` is
 * the half-width of its band (a Gaussian), and `eps` is its molar absorptivity
 * at the peak, in L per mole per cm. Copper(II) sulfate is blue because it takes
 * orange out of white light; permanganate is purple because it takes green.
 */
export const SOLUTES = {
  cuso4: { name: 'copper(II) sulfate', peak: 630, width: 90, eps: 25, looks: 'blue' },
  kmno4: { name: 'permanganate', peak: 525, width: 45, eps: 25, looks: 'purple' }
};

/** The lamp stops showing a number above this; a real instrument saturates. */
export const ABSORBANCE_CEILING = 3.0;

/**
 * Absorbance at `nm` through `pathCm` of a solution at `conc` mol/L:
 * A = epsilon(nm) x b x c — the quantity every stage of the cuvette quest is
 * about, computed with no shortcut.
 */
export function planAbsorb(solute, nm, pathCm, conc) {
  const s = SOLUTES[solute];
  const shape = Math.exp(-0.5 * Math.pow((nm - s.peak) / s.width, 2));
  const a = s.eps * shape * pathCm * conc;
  return Math.min(ABSORBANCE_CEILING, Number(a.toFixed(3)));
}

/** The colour that is missing from white light after `solute`, as a wavelength. */
export function missingNm(solute) { return SOLUTES[solute].peak; }

/* ------------------------------------------------------------------
   MOLECULAR SPECTROSCOPY REGIONS
   ------------------------------------------------------------------ */

export const REGIONS = ['microwave', 'infrared', 'uv-visible'];

/** What each kind of light does to the molecule in the cuvette. */
export function planRegion(molecule, region) {
  const diatomic = molecule === 'HCl';
  if (region === 'microwave') {
    return { motion: 'spins', detail: diatomic ? 'The whole molecule turns end over end.' : 'The whole molecule turns.' };
  }
  if (region === 'infrared') {
    return { motion: 'vibrates', detail: diatomic ? 'The bond stretches and shortens.' : 'The bonds stretch and bend.' };
  }
  return { motion: 'jumps', detail: 'An electron moves to a higher energy level.' };
}

/** Number formatting the bench uses: no trailing zeros past the figure shown. */
export function fmtSig(x, sig = 3) {
  if (!Number.isFinite(x)) return '--';
  return Number(x.toPrecision(sig)).toString();
}
