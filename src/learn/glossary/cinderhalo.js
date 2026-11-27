/**
 * glossary/cinderhalo.js — the words of Cinder Halo (unit14, nuclear chemistry): one term per concept, a one-clause gloss, and the stage
 * (1-based) whose briefing, prompt or reward first uses it. Prompts, hints, misses, rewards, captions, the Tour and the bank use these
 * terms and no banned stand-in for them.
 */

export const QUESTS = ['q1-still-warm', 'q2-what-comes-off', 'q3-equations', 'q4-stability', 'q5-half-gone', 'q6-shortfall', 'boss-core'];

export const TERMS = [
  { id: 'radiation', term: 'radiation', gloss: 'energy or a particle thrown out of an atom', quest: 'q1-still-warm', stage: 1, re: /\bradiation\b/i },
  { id: 'radioactive', term: 'radioactive', gloss: 'giving off radiation on its own as unstable nuclei decay', quest: 'q1-still-warm', stage: 1, re: /\bradioactive\b/i },
  { id: 'background-radiation', term: 'background radiation', gloss: 'steady radiation from rock, air, and space included in every count', quest: 'q1-still-warm', stage: 2, re: /\bbackground radiation\b/i },
  { id: 'radioactive-decay', term: 'radioactive decay', gloss: 'a nucleus changing on its own and giving off radiation', quest: 'q1-still-warm', stage: 3, re: /\bradioactive decay\b/i },
  { id: 'count-rate', term: 'count rate', gloss: 'the number of radiation counts recorded per minute', quest: 'q1-still-warm', stage: 6, re: /\bcount rate\b/i },
  // q2-what-comes-off
  { id: 'gamma', term: 'gamma ray', gloss: 'high-energy light with no charge and no mass', quest: 'q2-what-comes-off', stage: 1, re: /\bgamma rays?\b/i },
  { id: 'beta', term: 'beta particle', gloss: 'a negatively charged electron ejected from a nucleus', quest: 'q2-what-comes-off', stage: 1, re: /\bbeta particles?\b/i },
  { id: 'alpha', term: 'alpha particle', gloss: 'two protons and two neutrons ejected together (a helium-4 nucleus)', quest: 'q2-what-comes-off', stage: 2, re: /\balpha particles?\b/i },
  { id: 'ionizing', term: 'ionizing radiation', gloss: 'radiation that knocks electrons off atoms, leaving ions behind', quest: 'q2-what-comes-off', stage: 4, re: /\bionizing\b/i },
  // q3-equations
  { id: 'nuclear-equation', term: 'nuclear equation', gloss: 'an equation where mass numbers and atomic numbers both balance on each side', quest: 'q3-equations', stage: 1, re: /\bnuclear equations?\b/i },
  { id: 'positron', term: 'positron', gloss: 'a particle like an electron, but with a positive charge', quest: 'q3-equations', stage: 4, re: /\bpositrons?\b/i },
  { id: 'positron-emission', term: 'positron emission', gloss: 'decay in which a proton turns into a neutron and ejects a positron', quest: 'q3-equations', stage: 4, re: /\bpositron emission\b/i },
  { id: 'electron-capture', term: 'electron capture', gloss: 'decay in which a nucleus pulls in an inner electron and turns a proton into a neutron', quest: 'q3-equations', stage: 5, re: /\belectron capture\b/i },
  { id: 'decay-series', term: 'decay series', gloss: 'a chain of nuclear decays ending in a stable nucleus', quest: 'q3-equations', stage: 7, re: /\bdecay series\b/i },
  // q4-stability
  { id: 'band', term: 'band of stability', gloss: 'the region of stable nuclei on a chart of protons versus neutrons', quest: 'q4-stability', stage: 1, re: /\bband of stability\b/i },
  { id: 'strong-force', term: 'strong nuclear force', gloss: 'the short-range force that holds touching protons and neutrons together', quest: 'q4-stability', stage: 3, re: /\bstrong nuclear force\b/i },
  { id: 'np-ratio', term: 'neutron-to-proton ratio', gloss: 'a nucleus\'s number of neutrons divided by its number of protons', quest: 'q4-stability', stage: 7, re: /\bneutron-to-proton ratio\b/i },
  // q5-half-gone
  { id: 'half-life', term: 'half-life', gloss: 'the time it takes for half of a radioactive sample\'s nuclei to decay', quest: 'q5-half-gone', stage: 1, re: /\bhalf-li(fe|ves)\b/i },
  { id: 'rate-constant', term: 'rate constant', gloss: 'k, a value measuring how fast an isotope decays (larger k means a shorter half-life)', quest: 'q5-half-gone', stage: 5, re: /\brate constant\b/i },
  { id: 'radiocarbon', term: 'radiocarbon dating', gloss: 'finding the age of once-living material from its remaining carbon-14', quest: 'q5-half-gone', stage: 6, re: /\bradiocarbon dating\b/i },
  // q6-shortfall
  { id: 'mass-defect', term: 'mass defect', gloss: 'how much less mass a nucleus has than its separate protons and neutrons', quest: 'q6-shortfall', stage: 2, re: /\bmass defect\b/i },
  { id: 'mev', term: 'MeV', gloss: 'one million electron volts, an energy unit sized for single nuclei (1.6 × 10⁻¹³ J)', quest: 'q6-shortfall', stage: 3, re: /\bMeV\b/i },
  { id: 'binding-energy', term: 'binding energy', gloss: 'the energy needed to pull a nucleus apart into separate protons and neutrons', quest: 'q6-shortfall', stage: 3, re: /\bbinding energy\b/i },
  { id: 'be-per-nucleon', term: 'binding energy per nucleon', gloss: 'a nucleus\'s total binding energy divided by its protons and neutrons', quest: 'q6-shortfall', stage: 4, re: /\bbinding energy per nucleon\b/i },
  { id: 'fission', term: 'fission', gloss: 'a heavy nucleus splitting into two lighter nuclei', quest: 'q6-shortfall', stage: 5, re: /\bfission\b/i },
  { id: 'chain-reaction', term: 'chain reaction', gloss: 'fissions whose released neutrons trigger further fissions on their own', quest: 'q6-shortfall', stage: 6, re: /\bchain reactions?\b/i },
  { id: 'critical', term: 'critical', gloss: 'a chain reaction where each fission triggers exactly one more', quest: 'q6-shortfall', stage: 6, re: /\bcritical\b/i },
  { id: 'fusion', term: 'fusion', gloss: 'light nuclei combining into a heavier nucleus', quest: 'q6-shortfall', stage: 7, re: /\bfusion\b/i }
];

export const BANNED = [
  { re: /\bglow(s|ing)?\b/i, use: 'gives off radiation', why: 'radiation is not a glow' },
  { re: /\bzap(s|ped)?\b/i, use: 'radiation', why: 'stand-in word' },
  { re: /\bnuke[sd]?\b/i, use: 'nucleus / fission', why: 'slang' },
  { re: /\bsmash(es|ed)?\b/i, use: 'split', why: 'stand-in word' },
  { re: /\bclicks per\b/i, use: 'counts per minute', why: 'stand-in word' },
  { re: /\bweight\b/i, use: 'mass', why: 'mass, not weight, is what is measured' },
  { re: /\bwants?\b/i, use: 'lower energy', why: 'anthropomorphic motive' },
  { re: /\bprefers?\b/i, use: 'lower energy', why: 'anthropomorphic motive' },
  { re: /\bhappy\b/i, use: 'stable', why: 'anthropomorphic motive' },
  { re: /\bunstable atoms?\b/i, use: 'a nucleus that decays', why: 'the nucleus decays, not the atom\'s electrons' },
  { re: /\bsplit(ting)? (the )?atoms?\b/i, use: 'split a nucleus', why: 'fission splits the nucleus' },
  { re: /\bhot sample\b/i, use: 'radioactive sample', why: 'radioactive is not hot' }
];

export const STORY_ALLOW = ['drum', 'drums', 'ore', 'crater', 'Core', 'slag', 'store', 'cask', 'works'];

/** Recaps a stage offers (`engine/primers.js`): the nucleus from Tallow, first-order change from Quicklight. */
export const NEEDS = {
  'q1-still-warm:1': ['nucleons'],
  'q1-still-warm:3': ['nucleons'],
  'q2-what-comes-off:4': ['ions'],
  'q3-equations:1': ['nucleons'],
  'q5-half-gone:1': ['firstorder'],
  'q5-half-gone:5': ['firstorder', 'log']
};
