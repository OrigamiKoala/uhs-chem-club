/**
 * glossary/lanternfall.js — the words of Lanternfall (Unit 02, light, electrons, orbitals, trends):
 * one term per concept, a one-clause gloss, and the stage where it is first used (`quest`, `stage` 1-based).
 * `BANNED` lists the stand-in words that must not replace real terms.
 */

export const QUESTS = [
  'q1-wave', 'q2-photon', 'q3-lines', 'q4-cloud', 'q5-numbers',
  'q6-filling', 'q7-pes', 'q8-trends', 'q9-absorb', 'q10-wavefunctions', 'boss-eater'
];

export const TERMS = [
  { id: 'wavelength', term: 'wavelength', gloss: 'the distance from one crest of a wave to the next', quest: 'q1-wave', stage: 1, re: /\bwavelengths?\b/i },
  { id: 'frequency', term: 'frequency', gloss: 'the number of crests that pass each second', quest: 'q1-wave', stage: 1, re: /\bfrequenc(?:y|ies)\b/i },
  { id: 'speed-of-light', term: 'speed of light', gloss: '3.00 × 10⁸ m/s, the one speed all light travels at in a vacuum', quest: 'q1-wave', stage: 3, re: /\bspeed of light\b/i },
  { id: 'em-spectrum', term: 'electromagnetic spectrum', gloss: 'the whole range of light, from radio waves to X-rays', quest: 'q1-wave', stage: 4, re: /\belectromagnetic spectrum\b/i },
  { id: 'photon', term: 'photon', gloss: 'one packet of light energy, set by its frequency', quest: 'q2-photon', stage: 2, re: /\bphotons?\b/i },
  { id: 'threshold-frequency', term: 'threshold frequency', gloss: 'the lowest frequency of light that removes an electron from a metal', quest: 'q2-photon', stage: 3, re: /\bthreshold frequenc(?:y|ies)\b/i },
  { id: 'work-function', term: 'work function', gloss: 'the least energy needed to remove an electron from a metal', quest: 'q2-photon', stage: 5, re: /\bwork functions?\b/i },
  { id: 'continuous-spectrum', term: 'continuous spectrum', gloss: 'an unbroken band containing every colour of light', quest: 'q3-lines', stage: 2, re: /\bcontinuous spectrum\b/i },
  { id: 'line-spectrum', term: 'line spectrum', gloss: 'a spectrum made of only separate bright or dark lines', quest: 'q3-lines', stage: 2, re: /\bline spectrum\b/i },
  { id: 'emission-spectrum', term: 'emission spectrum', gloss: 'the bright lines a glowing gas gives out', quest: 'q3-lines', stage: 3, re: /\bemission spectrum\b/i },
  { id: 'energy-level', term: 'energy level', gloss: 'one of the fixed energies an electron in an atom can have', quest: 'q3-lines', stage: 4, re: /\benergy levels?\b/i },
  { id: 'ground-state', term: 'ground state', gloss: 'the lowest energy level of an atom', quest: 'q3-lines', stage: 4, re: /\bground state\b/i },
  { id: 'excited-state', term: 'excited state', gloss: 'any energy level above the ground state', quest: 'q3-lines', stage: 4, re: /\bexcited states?\b/i },
  { id: 'absorption-spectrum', term: 'absorption spectrum', gloss: 'the dark lines where a cool gas takes light out of a continuous spectrum', quest: 'q3-lines', stage: 5, re: /\babsorption spectrum\b/i },
  { id: 'orbital', term: 'orbital', gloss: 'the region where an electron is likely to be found', quest: 'q4-cloud', stage: 2, re: /\borbitals?\b/i },
  { id: 'node', term: 'node', gloss: 'a place where the electron is never found and ψ crosses zero', quest: 'q4-cloud', stage: 4, re: /\bnodes?\b/i },
  { id: 'quantum-numbers', term: 'quantum numbers', gloss: 'the address (n, l, ml) that picks out each orbital', quest: 'q5-numbers', stage: 1, re: /\bquantum numbers?\b/i },
  { id: 'spin', term: 'spin', gloss: 'an electron\'s two-way property, drawn ↑ or ↓', quest: 'q5-numbers', stage: 3, re: /\bspins?\b/i },
  { id: 'pauli', term: 'Pauli exclusion principle', gloss: 'no two electrons in an atom share all four quantum numbers', quest: 'q5-numbers', stage: 4, re: /\bpauli exclusion principle\b/i },
  { id: 'subshell', term: 'subshell', gloss: 'a set of orbitals of one energy, such as 2s or 2p', quest: 'q6-filling', stage: 1, re: /\bsubshells?\b/i },
  { id: 'aufbau', term: 'aufbau principle', gloss: 'electrons fill the lowest-energy subshells first', quest: 'q6-filling', stage: 1, re: /\baufbau principle\b/i },
  { id: 'hund', term: 'Hund\'s rule', gloss: 'electrons take separate orbitals of the same energy with parallel spins before pairing', quest: 'q6-filling', stage: 2, re: /\bhund.?s rule\b/i },
  { id: 'configuration', term: 'electron configuration', gloss: 'a list of each subshell and how many electrons it holds', quest: 'q6-filling', stage: 3, re: /\belectron configurations?\b/i },
  { id: 'binding-energy', term: 'binding energy', gloss: 'the energy needed to remove an electron from an atom', quest: 'q7-pes', stage: 2, re: /\bbinding energ(?:y|ies)\b/i },
  { id: 'pes', term: 'photoelectron spectrum', gloss: 'a chart of how many electrons leave at each binding energy', quest: 'q7-pes', stage: 3, re: /\bphotoelectron spectrum\b/i },
  { id: 'ionization-energy', term: 'ionization energy', gloss: 'the energy needed to remove the outermost electron from an atom', quest: 'q7-pes', stage: 6, re: /\bionization energ(?:y|ies)\b/i },
  { id: 'shielding', term: 'shielding', gloss: 'inner electrons cancelling part of the nucleus\'s attraction on outer electrons', quest: 'q8-trends', stage: 2, re: /\bshield(?:ing|ed)\b/i },
  { id: 'zeff', term: 'effective nuclear charge', gloss: 'the nuclear charge left over after shielding by inner electrons', quest: 'q8-trends', stage: 2, re: /\beffective nuclear charge\b/i },
  { id: 'atomic-radius', term: 'atomic radius', gloss: 'the distance from the nucleus to the outermost electrons', quest: 'q8-trends', stage: 3, re: /\batomic radi(?:us|i)\b/i },
  { id: 'ionic-radius', term: 'ionic radius', gloss: 'the size of an ion compared with its neutral atom', quest: 'q8-trends', stage: 7, re: /\bionic radi(?:us|i)\b/i },
  { id: 'electron-affinity', term: 'electron affinity', gloss: 'the energy released when a neutral atom gains an electron', quest: 'q8-trends', stage: 8, re: /\belectron affinity\b/i },
  { id: 'electronegativity', term: 'electronegativity', gloss: 'how strongly an atom attracts the electrons it shares in a bond', quest: 'q8-trends', stage: 9, re: /\belectronegativity\b/i },
  { id: 'complementary', term: 'complementary colour', gloss: 'the colour seen when the opposite colour is absorbed from white light', quest: 'q9-absorb', stage: 2, re: /\bcomplementary colou?rs?\b/i },
  { id: 'absorbance', term: 'absorbance', gloss: 'how much of the light at one wavelength a solution absorbs', quest: 'q9-absorb', stage: 3, re: /\babsorbance\b/i },
  { id: 'calibration-line', term: 'calibration line', gloss: 'a line of absorbance against concentration through known standards', quest: 'q9-absorb', stage: 5, re: /\bcalibration (?:lines?|curves?)\b/i },
  { id: 'wavefunction', term: 'wavefunction (ψ)', gloss: 'the wave behind an orbital, with + crests and − troughs', quest: 'q10-wavefunctions', stage: 2, re: /\bwavefunctions?\b/i },
  { id: 'probability-density', term: 'probability density', gloss: 'the chance of finding the electron at each point, going as ψ × ψ', quest: 'q10-wavefunctions', stage: 2, re: /\bprobability densit(?:y|ies)\b/i },
  { id: 'radial-node', term: 'radial node', gloss: 'a spherical shell around the nucleus where ψ crosses zero', quest: 'q10-wavefunctions', stage: 3, re: /\bradial nodes?\b/i },
  { id: 'angular-node', term: 'angular node', gloss: 'a flat plane through the nucleus where ψ crosses zero', quest: 'q10-wavefunctions', stage: 4, re: /\bangular nodes?\b/i }
];

/** Stand-in words that must not replace real terms in Lanternfall's play text. */
export const BANNED = [
  { re: /\bpiles?\b/i, use: 'peaks', why: 'stand-in word' },
  { re: /\bshots?\b/i, use: 'measurements', why: 'stand-in word' },
  { re: /\bknocks? loose\b/i, use: 'removes', why: 'stand-in word' },
  { re: /\bgrips?\b/i, use: 'work function or binding energy', why: 'stand-in word' },
  { re: /\bstrings?\b/i, use: 'waves', why: 'stand-in word' },
  { re: /\bstrippers?\b/i, use: 'Remove an electron', why: 'stand-in word' }
];

export const STORY_ALLOW = ['shot', 'grip', 'string'];

export const NEEDS = {};
