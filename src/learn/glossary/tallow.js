/**
 * glossary/tallow.js — the words of Tallow (Unit 01, atoms, periodic table, isotopes, atomic mass, and the mole):
 * one term per concept, a one-clause gloss, and the stage where it is first used (`quest`, `stage` 1-based).
 */

export const QUESTS = ['q1-grain', 'q2-core', 'q3-catalogue', 'q4-ledger', 'q5-assay', 'q6-weigh', 'boss-hopper'];

export const TERMS = [
  { id: 'atom', term: 'atom', gloss: 'the smallest piece of an element that keeps its chemical identity', quest: 'q1-grain', stage: 1, re: /\batoms?\b/i },
  { id: 'element', term: 'element', gloss: 'a substance made of only one kind of atom', quest: 'q1-grain', stage: 2, re: /\belements?\b/i },
  { id: 'molecule', term: 'molecule', gloss: 'two or more atoms bonded together as one unit', quest: 'q1-grain', stage: 4, re: /\bmolecules?\b/i },
  { id: 'compound', term: 'compound', gloss: 'a substance made of two or more different elements bonded together', quest: 'q1-grain', stage: 6, re: /\bcompounds?\b/i },
  { id: 'mixture', term: 'mixture', gloss: 'two or more substances blended together without bonding', quest: 'q1-grain', stage: 7, re: /\bmixtures?\b/i },
  { id: 'nucleus', term: 'nucleus', gloss: 'the dense, positively charged centre of an atom', quest: 'q2-core', stage: 1, re: /\bnucle(us|i)\b/i },
  { id: 'proton', term: 'proton', gloss: 'a positively charged particle in the nucleus with a mass of 1 u', quest: 'q2-core', stage: 2, re: /\bprotons?\b/i },
  { id: 'neutron', term: 'neutron', gloss: 'an uncharged particle in the nucleus with a mass of 1 u', quest: 'q2-core', stage: 3, re: /\bneutrons?\b/i },
  { id: 'electron', term: 'electron', gloss: 'a negatively charged particle orbiting outside the nucleus', quest: 'q2-core', stage: 4, re: /\belectrons?\b/i },
  { id: 'atomic-number', term: 'atomic number', gloss: 'the number of protons in an atom, which sets which element it is', quest: 'q2-core', stage: 7, re: /\batomic numbers?\b/i },
  { id: 'valence-electron', term: 'valence electron', gloss: 'an electron in the outermost shell, which sets how the atom reacts', quest: 'q2-core', stage: 6, re: /\bvalence electrons?\b/i },
  { id: 'outer-shell', term: 'outer shell', gloss: 'the outermost ring of electrons around an atom', quest: 'q2-core', stage: 6, re: /\bouter shells?\b/i },
  { id: 'period', term: 'period', gloss: 'a horizontal row of elements on the periodic table', quest: 'q3-catalogue', stage: 1, re: /\bperiods?\b/i },
  { id: 'group', term: 'group', gloss: 'a vertical column of elements with the same valence electron count', quest: 'q3-catalogue', stage: 2, re: /\bgroups?\b/i },
  { id: 'noble-gas', term: 'noble gas', gloss: 'a group 18 element with a full outer shell that does not react', quest: 'q3-catalogue', stage: 4, re: /\bnoble gas(?:es)?\b/i },
  { id: 'mass-number', term: 'mass number', gloss: 'the total number of protons and neutrons in an atom\'s nucleus', quest: 'q4-ledger', stage: 1, re: /\bmass numbers?\b/i },
  { id: 'isotope', term: 'isotope', gloss: 'atoms of the same element with different numbers of neutrons', quest: 'q4-ledger', stage: 3, re: /\bisotopes?\b/i },
  { id: 'ion', term: 'ion', gloss: 'an atom with an electric charge because it lost or gained electrons', quest: 'q4-ledger', stage: 4, re: /\bions?\b/i },
  { id: 'cation', term: 'cation', gloss: 'a positively charged ion formed when an atom loses electrons', quest: 'q4-ledger', stage: 5, re: /\bcations?\b/i },
  { id: 'anion', term: 'anion', gloss: 'a negatively charged ion formed when an atom gains electrons', quest: 'q4-ledger', stage: 6, re: /\banions?\b/i },
  { id: 'abundance', term: 'abundance', gloss: 'the percentage of an element\'s atoms that belong to one isotope', quest: 'q5-assay', stage: 1, re: /\babundances?\b/i },
  { id: 'average-atomic-mass', term: 'average atomic mass', gloss: 'the average mass of one atom across an element\'s natural isotopes', quest: 'q5-assay', stage: 2, re: /\baverage atomic mass\b/i },
  { id: 'weighted-average', term: 'weighted average', gloss: 'an average where each value counts in proportion to its fraction of the whole', quest: 'q5-assay', stage: 3, re: /\bweighted average\b/i },
  { id: 'mass-spectrum', term: 'mass spectrum', gloss: 'a bar graph of each isotope\'s mass against its percent abundance', quest: 'q5-assay', stage: 4, re: /\bmass spectrum\b/i },
  { id: 'formula-mass', term: 'formula mass', gloss: 'the sum of the atomic masses of all atoms in a formula', quest: 'q6-weigh', stage: 1, re: /\bformula mass\b/i },
  { id: 'mole', term: 'mole (mol)', gloss: '6.02 × 10²³ particles of a substance', quest: 'q6-weigh', stage: 3, re: /\bmoles?\b|\bmol\b/i },
  { id: 'molar-mass', term: 'molar mass', gloss: 'the mass of one mole of a substance in grams, equal to its formula mass in u', quest: 'q6-weigh', stage: 3, re: /\bmolar mass\b/i },
  { id: 'percent-by-mass', term: 'percent by mass', gloss: 'one element\'s mass in a formula divided by the formula mass, times 100', quest: 'q6-weigh', stage: 6, re: /\bpercent by mass\b/i },
  { id: 'empirical-formula', term: 'empirical formula', gloss: 'the simplest whole-number ratio of atoms in a compound', quest: 'q6-weigh', stage: 7, re: /\bempirical formula\b/i },
  { id: 'molecular-formula', term: 'molecular formula', gloss: 'the actual number of each kind of atom in one molecule', quest: 'q6-weigh', stage: 8, re: /\bmolecular formula\b/i }
];

export const BANNED = [
  { re: /\bfastener\b/i, use: 'bond or join', why: 'stand-in word' },
  { re: /\bspeck\b/i, use: 'particle', why: 'stand-in word' },
  { re: /\bneedle\b/i, use: 'charge meter', why: 'stand-in word' },
  { re: /\bfulcrum\b/i, use: 'pivot', why: 'stand-in word' },
  { re: /\bcrate\b/i, use: 'drum', why: 'stand-in word' },
  { re: /\btrade\b/i, use: 'lose or gain electrons', why: 'stand-in word' }
];

export const STORY_ALLOW = ['crate', 'needle'];

export const NEEDS = {};
