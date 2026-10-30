/**
 * THE VAPOUR-FLASK TABLES — Mirrowen, bench q3-boil (Liquids and Vapour)
 *
 * Everything the flask, the surface-and-pour plate, the equal boxes and the gas jar read, beyond `matterdata.js` (whose `ANTOINE`,
 * `vaporPressure`, `boilingPoint`, `LIQUID_PROPS` and `WATER_DENSITY` this file asks and never repeats). PURE, Node-importable.
 *
 * SOURCES. Densities of the three liquids at 20 °C: CRC Handbook of Chemistry and Physics (water 0.9982, ethanol 0.7893, n-hexane 0.6603
 * g/cm³). Ice at 0 °C 0.9168 g/cm³ and liquid water at 0 °C 0.99984 g/cm³ are `WATER_DENSITY`. Vapour pressures of water, for the jar:
 * the same Antoine row as the flask (it agrees with the CRC steam table to 0.5 %).
 *
 * TWO INSTRUMENT CONSTANTS (not data, and said on the plate's Tour words): the pour time of water is fixed at 10.0 s (a stopwatch
 * convention), and every other liquid takes that time times the ratio of its kinematic viscosity (viscosity over density) to water's,
 * which is how a narrow-tube viscometer behaves. The ring that lifts off a surface is read as the surface tension itself (mN/m).
 */

import { vaporPressure, boilingPoint, LIQUID_PROPS, WATER_DENSITY, SUBSTANCES } from './matterdata.js';

/** Liquids the flask holds: the ones with an Antoine row, by their `SUBSTANCES` id. */
export const FLASK_LIQUIDS = Object.freeze(['ether', 'acetone', 'ethanol', 'H2O']);

/** The heater's steps, °C, and the outside pressures the flask can be opened to, kPa (`null` is sealed). */
export const HEATER_STEPS = Object.freeze([20, 30, 40, 50, 60, 70, 80, 90, 100]);
export const OUTSIDE_STEPS = Object.freeze([null, 101.3, 65, 45]);

/** Densities at 20 °C, g/cm³ (CRC). */
export const DENSITY_20 = Object.freeze({ H2O: 0.9982, ethanol: 0.7893, hexane: 0.6603 });
/** The pour time of water through the narrow tube, seconds (the instrument's convention). */
export const POUR_WATER_S = 10;

/** Surface tension of a liquid at 20 °C, mN/m (CRC): the pull on the ring. */
export const surfacePull = id => LIQUID_PROPS[id].tension;
/** The time, s, for 5 mL of a liquid to run through the tube: water's 10.0 s times the ratio of kinematic viscosities. */
export const pourTime = id => POUR_WATER_S * (LIQUID_PROPS[id].viscosity / DENSITY_20[id]) / (LIQUID_PROPS.H2O.viscosity / DENSITY_20.H2O);

/** Mass of one cubic centimetre of ice and of liquid water at 0 °C, g (CRC). */
export const BOX_MASS = Object.freeze({ ice: WATER_DENSITY.ice0, water: WATER_DENSITY.water0 });
/** The molecules drawn in one picture box of each: the counts stand in the ratio of the densities (11 : 12 = 0.9167; 0.9168 : 0.99984 = 0.9170). */
export const PICTURE_COUNT = Object.freeze({ ice: 11, water: 12 });

/** The pressure around the water in the mountain stage and the jar's gauge and temperature in the last. */
export const MOUNTAIN_KPA = 65;
export const JAR = Object.freeze({ total: 101.3, T: 35 });
/** The pressure of the gas alone in the jar: the gauge less the water's own vapor pressure at the jar's temperature (Dalton). */
export const gasAlone = (total = JAR.total, T = JAR.T) => total - vaporPressure('H2O', T);

/** The piece of a straight line between the two readings either side of `x`, where `points` is [{x, y}] in x order: y at x. */
export function between(points, x) {
  const pts = [...points].sort((a, b) => a.x - b.x);
  for (let i = 1; i < pts.length; i++) {
    if (x >= pts[i - 1].x && x <= pts[i].x) return pts[i - 1].y + ((x - pts[i - 1].x) / (pts[i].x - pts[i - 1].x)) * (pts[i].y - pts[i - 1].y);
  }
  return NaN;
}
/** The temperature at which a straight line through two readings reaches `y`. */
export function crossing(points, y) {
  const pts = [...points].sort((a, b) => a.x - b.x);
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]; const b = pts[i];
    if (a.y <= y && b.y >= y) return a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x);
  }
  return NaN;
}

/** The plateau a liquid's flask settles at, kPa, rounded to the 0.01 the gauge keeps. */
export const plateau = (id, T) => Math.round(vaporPressure(id, T) * 100) / 100;

/** How many vapor molecules a flask draws: the number density goes as P over T (kelvin), 14 for ether at 25 °C. */
export function vaporDots(id, T) {
  const ref = vaporPressure('ether', 25) / 298.15;
  return Math.max(1, Math.min(20, Math.round(14 * (vaporPressure(id, T) / (T + 273.15)) / ref)));
}

export { vaporPressure, boilingPoint, SUBSTANCES };
