/**
 * glossary/bellows.js — the words of Bellows (Unit 04, gases): one term per concept, a one-clause gloss, and the stage where it
 * is first used (`quest`, `stage` 1-based). `BANNED` lists the vague stand-in words that must not replace real terms.
 */

export const QUESTS = ['q1-knocks', 'q2-laws', 'q3-ideal', 'q4-mixtures', 'q5-speed', 'q6-real', 'boss-compressor'];

export const TERMS = [
  { id: 'pressure', term: 'pressure', gloss: 'how hard a gas presses on each bit of wall, measured in kilopascals (kPa)', quest: 'q1-knocks', stage: 1, re: /\bpressures?\b/i },
  { id: 'collision', term: 'collision', gloss: 'one particle striking a wall or another particle', quest: 'q1-knocks', stage: 2, re: /\bcollisions?\b/i },
  { id: 'absolute-zero', term: 'absolute zero', gloss: '−273 °C, the temperature where an ideal gas\'s pressure heads to zero', quest: 'q1-knocks', stage: 3, re: /\babsolute zero\b/i },
  { id: 'kelvin', term: 'kelvin (K)', gloss: 'the temperature scale starting at absolute zero: K = °C + 273', quest: 'q1-knocks', stage: 3, re: /\bkelvin\b|\d\s?K\b/ },
  { id: 'boyle', term: 'Boyle\'s law', gloss: 'at one temperature, pressure × volume stays constant', quest: 'q1-knocks', stage: 4, re: /\bboyle.?s law\b/i },
  { id: 'kinetic-energy', term: 'kinetic energy', gloss: 'energy of motion; temperature measures the average kinetic energy of particles', quest: 'q1-knocks', stage: 7, re: /\bkinetic energy\b/i },
  { id: 'charles', term: 'Charles\'s law', gloss: 'at constant pressure, volume is in step with kelvin temperature', quest: 'q2-laws', stage: 2, re: /\bcharles.?s law\b/i },
  { id: 'gay-lussac', term: 'Gay-Lussac\'s law', gloss: 'at constant volume, pressure is in step with kelvin temperature', quest: 'q2-laws', stage: 5, re: /\bgay.lussac.?s law\b/i },
  { id: 'mole', term: 'mole (mol)', gloss: 'a fixed number of particles, 6.02 × 10²³ of them', quest: 'q3-ideal', stage: 1, recap: 'Tallow', re: /\bmoles?\b|\bmol\b/i },
  { id: 'avogadro', term: 'Avogadro\'s law', gloss: 'equal moles of any gas fill equal volumes at the same temperature and pressure', quest: 'q3-ideal', stage: 2, re: /\bavogadro.?s law\b/i },
  { id: 'gas-constant', term: 'gas constant (R)', gloss: '8.31 L·kPa/(mol·K), or 0.0821 L·atm/(mol·K)', quest: 'q3-ideal', stage: 3, re: /\bgas constant\b/i },
  { id: 'ideal-gas-law', term: 'ideal gas law', gloss: 'PV = nRT, linking pressure, volume, moles and kelvin temperature', quest: 'q3-ideal', stage: 3, re: /\bideal gas law\b/i },
  { id: 'atmosphere', term: 'atmosphere (atm)', gloss: 'a unit of pressure equal to 101.3 kPa', quest: 'q3-ideal', stage: 6, re: /\batmospheres?\b|\batm\b/i },
  { id: 'partial-pressure', term: 'partial pressure', gloss: 'the pressure one gas in a mixture would have if it were alone', quest: 'q4-mixtures', stage: 2, re: /\bpartial pressures?\b/i },
  { id: 'dalton', term: 'Dalton\'s law', gloss: 'the total pressure of a gas mixture is the sum of its partial pressures', quest: 'q4-mixtures', stage: 2, re: /\bdalton.?s law\b/i },
  { id: 'mole-fraction', term: 'mole fraction', gloss: 'one gas\'s moles divided by all the moles in the mixture', quest: 'q4-mixtures', stage: 3, re: /\bmole fractions?\b/i },
  { id: 'effusion', term: 'effusion', gloss: 'gas escaping through a tiny pinhole into a vacuum', quest: 'q5-speed', stage: 2, re: /\beffus(e|es|ed|ing|ion)\b/i },
  { id: 'diffusion', term: 'diffusion', gloss: 'one gas spreading through another gas by random motion and collisions', quest: 'q5-speed', stage: 5, re: /\bdiffus(e|es|ed|ing|ion)\b/i },
  { id: 'graham', term: 'Graham\'s law', gloss: 'effusion rate is inversely proportional to the square root of molar mass', quest: 'q5-speed', stage: 6, re: /\bgraham.?s law\b/i },
  { id: 'ideal-gas', term: 'ideal gas', gloss: 'a gas that obeys the ideal gas law at every temperature and volume', quest: 'q6-real', stage: 3, re: /\bideal gas(?:es)?\b/i },
  { id: 'real-gas', term: 'real gas', gloss: 'a gas whose pressure deviates from the ideal gas law due to particle size and attractions', quest: 'q6-real', stage: 3, re: /\breal gas(?:es)?\b/i }
];

/** Words that must not stand in for real gas terms in Bellows' play text. */
export const BANNED = [
  { re: /\broom\b(?! temperature)/i, use: 'volume', why: 'vague word' },
  { re: /\b(push|pushes|pushed)\b/i, use: 'pressure or presses', why: 'vague word' },
  { re: /\bknock(s|ed)?\b/i, use: 'collision', why: 'vague word' },
  { re: /\bsqueez(e|es|ed|ing)\b/i, use: 'compress', why: 'vague word' },
  { re: /\bholders?\b/i, use: 'cylinder or tank', why: 'fiction name' }
];

export const STORY_ALLOW = ['room', 'push', 'holder'];

export const NEEDS = {};
