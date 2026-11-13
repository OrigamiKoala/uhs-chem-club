/**
 * glossary/ember.js — the words of Ember Reach (Unit 05, thermodynamics): one term per concept, a one-clause gloss, and the stage where it
 * is first used (`quest`, `stage` 1-based). Prompts, hints, misses, rewards, captions, the Tour and the bank use these terms and no synonym
 * of them. `re` finds the term in play text; `BANNED` lists the vague words and fiction names that must not stand in for one
 * (`verify:teaching:ember`). `recap` marks a term from an earlier world, re-glossed because nothing guarantees that world was played.
 */

export const QUESTS = ['q1-flow', 'q2-calorimetry', 'q3-enthalpy', 'q4-bonds', 'q5-hess', 'q6-entropy', 'q7-gibbs', 'boss-crucible'];

export const TERMS = [
  { id: 'temperature', term: 'temperature', gloss: 'how hot something is: the average motion of its particles', quest: 'q1-flow', stage: 1, re: /\btemperatures?\b/i },
  { id: 'heat', term: 'heat', gloss: 'energy passing from a hotter thing to a colder one', quest: 'q1-flow', stage: 1, re: /\bheat\b(?! of)/i },
  { id: 'joule', term: 'joule (J)', gloss: 'the unit of energy; a kilojoule (kJ) is 1000 J', quest: 'q2-calorimetry', stage: 2, re: /\bjoules?\b|\bkJ\b/ },
  { id: 'thermal-equilibrium', term: 'thermal equilibrium', gloss: 'the state in which touching things have reached the same temperature', quest: 'q1-flow', stage: 1, re: /\bthermal equilibrium\b/i },
  { id: 'system', term: 'system', gloss: 'the chemicals being studied', quest: 'q1-flow', stage: 4, re: /\bsystem\b/i },
  { id: 'surroundings', term: 'surroundings', gloss: 'everything outside the system, such as the water around it', quest: 'q1-flow', stage: 4, re: /\bsurroundings\b/i },
  { id: 'exothermic', term: 'exothermic', gloss: 'giving heat out to the surroundings', quest: 'q1-flow', stage: 4, re: /\bexothermic\b/i },
  { id: 'endothermic', term: 'endothermic', gloss: 'taking heat in from the surroundings', quest: 'q1-flow', stage: 4, re: /\bendothermic\b/i },
  { id: 'specific-heat-capacity', term: 'specific heat capacity (c)', gloss: 'the heat needed to warm 1 g of a substance by 1 °C', quest: 'q2-calorimetry', stage: 2, re: /\bspecific heat capacity\b/i },
  { id: 'calorimeter', term: 'calorimeter', gloss: 'an insulated cup of water with a thermometer, used to measure heat', quest: 'q2-calorimetry', stage: 4, re: /\bcalorimeters?\b/i },
  { id: 'heat-of-fusion', term: 'heat of fusion', gloss: 'the heat needed to melt 1 g of a solid at its melting point', quest: 'q2-calorimetry', stage: 6, re: /\bheat of fusion\b/i },
  { id: 'heat-of-vaporization', term: 'heat of vaporization', gloss: 'the heat needed to boil 1 g of a liquid at its boiling point', quest: 'q2-calorimetry', stage: 7, re: /\bheat of vaporization\b/i },
  { id: 'mole', term: 'mole (mol)', gloss: 'a fixed number of particles, 6.02 × 10²³ of them', quest: 'q3-enthalpy', stage: 1, recap: 'Tallow', re: /\bmoles?\b|\bmol\b/i },
  { id: 'enthalpy', term: 'enthalpy change (ΔH)', gloss: 'the heat a reaction gives out or takes in, for each mole of reaction, at constant pressure', quest: 'q3-enthalpy', stage: 1, re: /\benthalpy\b|ΔH/i },
  { id: 'bond-enthalpy', term: 'bond enthalpy', gloss: 'the energy needed to pull apart one mole of a bond', quest: 'q4-bonds', stage: 2, re: /\bbond enthalpy\b/i },
  { id: 'hess', term: 'Hess\'s law', gloss: 'the heat of a reaction is the same whichever steps it takes', quest: 'q5-hess', stage: 2, re: /\bHess/i },
  { id: 'formation', term: 'enthalpy of formation', gloss: 'the heat of making one mole of a compound from its elements', quest: 'q5-hess', stage: 4, re: /\benthalpy of formation\b|\bformation\b/i },
  { id: 'entropy', term: 'entropy (S)', gloss: 'how many ways the particles and their energy can be arranged', quest: 'q6-entropy', stage: 3, re: /\bentropy\b|ΔS/i },
  { id: 'kelvin', term: 'kelvin (K)', gloss: 'the temperature scale that starts at absolute zero: K = °C + 273', quest: 'q6-entropy', stage: 5, recap: 'Bellows', re: /\bkelvin\b|\d\s?K\b/ },
  { id: 'spontaneous', term: 'spontaneous', gloss: 'happening on its own, without anything keeping it going', quest: 'q7-gibbs', stage: 2, re: /\bspontaneous\b/i },
  { id: 'free-energy', term: 'free energy change (ΔG)', gloss: 'ΔH − TΔS: negative means the change happens on its own', quest: 'q7-gibbs', stage: 2, re: /\bfree energy\b|ΔG/i },
  { id: 'reactant', term: 'reactant', gloss: 'a starting substance on the left of the arrow', quest: 'q3-enthalpy', stage: 1, re: /\breactants?\b/i },
  { id: 'product', term: 'product', gloss: 'a substance formed on the right of the arrow', quest: 'q3-enthalpy', stage: 1, re: /\bproducts?\b/i }
];

/** Words that are not glossary terms and must not stand in for one inside Ember Reach's play text (the Crucible and the story keep their fiction). */
export const BANNED = [
  { re: /\b(push|pushes|pushed)\b/i, use: 'pressure, or a plain verb', why: 'vague word' },
  { re: /\bknock(s|ed)?\b/i, use: 'collision', why: 'vague word' },
  { re: /\bsqueez(e|es|ed|ing)\b/i, use: 'compress', why: 'vague word' },
  { re: /\broom\b(?! temperature)/i, use: 'volume', why: 'vague word' },
  { re: /\btins?\b/i, use: 'sample', why: 'fiction name' },
  { re: /\bshel(f|ves)\b/i, use: 'energy level', why: 'fiction name' },
  { re: /\bledgers?\b/i, use: 'bond table', why: 'fiction name' },
  { re: /\bcranks?\b/i, use: 'pull the atoms apart', why: 'fiction name' },
  { re: /\bchips?\b|\btiles?\b/i, use: 'card', why: 'fiction name' },
  { re: /\bmarkers?\b/i, use: 'dial', why: 'fiction name' },
  { re: /\b(pans?|rigs?|crates?|drums?|holders?|slates?)\b/i, use: 'a real lab name', why: 'fiction name' }
];

export const STORY_ALLOW = ['marker', 'ledger', 'room', 'push'];

/** What each stage assumes the student can do, and the primer (`engine/primers.js`) offered by the Primer key on that stage. */
export const NEEDS = {
  'q3-enthalpy:1': ['amount'],
  'q3-enthalpy:2': ['ratio'],
  'q3-enthalpy:3': ['ratio'],
  'q3-enthalpy:4': ['amount', 'ratio'],
  'q3-enthalpy:6': ['amount'],
  'q5-hess:3': ['ratio']
};
