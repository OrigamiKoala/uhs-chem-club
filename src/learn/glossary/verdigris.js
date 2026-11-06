/**
 * glossary/verdigris.js — the words of Verdigris (Unit 9, acids and bases): one term per concept, a one-clause gloss, and the stage where it is
 * first used (`quest`, `stage` 1-based). Prompts, hints, misses, rewards, captions, the Tour and the bank use these terms and no synonym of them.
 * `recap: <world>` marks a term from an earlier world, re-glossed here because nothing guarantees that world was played.
 * `verify:teaching` (Verdigris section) holds it.
 */

export const QUESTS = ['q1-handover', 'q2-scale', 'q3-weak', 'q4-structure', 'q5-salts', 'q6-titrate', 'q7-buffer', 'q8-capacity', 'boss-leach'];

export const TERMS = [
  { id: 'proton', term: 'proton', gloss: 'a hydrogen ion, H⁺: a hydrogen atom that has lost its electron', quest: 'q1-handover', stage: 1, recap: 'Tallow', re: /\bprotons?\b/i },
  { id: 'acid', term: 'acid', gloss: 'a substance that hands a proton to another substance', quest: 'q1-handover', stage: 1, re: /\bacids?\b/i },
  { id: 'base', term: 'base', gloss: 'a substance that takes a proton from another substance', quest: 'q1-handover', stage: 1, re: /\bbases?\b/i },
  { id: 'hydronium', term: 'hydronium', gloss: 'H₃O⁺: a water molecule that has taken a proton', quest: 'q1-handover', stage: 1, re: /\bhydronium\b|H₃O⁺/i },
  { id: 'hydroxide', term: 'hydroxide', gloss: 'OH⁻: what is left of a water molecule that has given a proton away', quest: 'q1-handover', stage: 2, re: /\bhydroxide\b|OH⁻/i },
  { id: 'conjugate', term: 'conjugate pair', gloss: 'an acid and the base it becomes when it hands over its proton', quest: 'q1-handover', stage: 4, re: /\bconjugate\b/i },
  { id: 'concentration', term: 'concentration', gloss: 'how many moles of a substance are in each litre of solution, in mol/L (M)', quest: 'q2-scale', stage: 1, recap: 'Tallow', re: /\bconcentrations?\b/i },
  { id: 'dilution', term: 'dilution', gloss: 'adding water, which lowers the concentration', quest: 'q2-scale', stage: 1, re: /\bdilut(ion|ed|e)\b/i },
  { id: 'ph', term: 'pH', gloss: 'a number for how acidic a solution is: the negative logarithm of the hydronium concentration', quest: 'q2-scale', stage: 1, re: /\bpH\b/ },
  { id: 'poh', term: 'pOH', gloss: 'the same scale for hydroxide: the negative logarithm of the hydroxide concentration', quest: 'q2-scale', stage: 3, re: /\bpOH\b/ },
  { id: 'ionize', term: 'ionize', gloss: 'hand a proton to water (an acid) or take one from it (a base), forming ions', quest: 'q3-weak', stage: 2, re: /\bioniz(e|es|ed|ation)\b/i },
  { id: 'strong-weak', term: 'strong and weak', gloss: 'a strong acid hands over nearly all its protons; a weak acid hands over only a small share', quest: 'q3-weak', stage: 2, re: /\b(weak|strong|strongest|weakest)\b/i },
  { id: 'ka', term: 'Ka', gloss: 'the acid constant: how far an acid hands over its protons, as a fixed ratio of products to reactant', quest: 'q3-weak', stage: 5, re: /\bK[ab]\b/ },
  { id: 'electronegativity', term: 'electronegativity', gloss: 'how strongly an atom pulls on the electrons it shares', quest: 'q4-structure', stage: 3, recap: 'Ligar', re: /\belectronegativ/i },
  { id: 'salt', term: 'salt', gloss: 'an ionic compound made of the positive ion of a base and the negative ion of an acid', quest: 'q5-salts', stage: 1, re: /\bsalts?\b/i },
  { id: 'neutralization', term: 'neutralization', gloss: 'an acid and a base reacting until neither is left over', quest: 'q5-salts', stage: 1, re: /\bneutrali[sz]/i },
  { id: 'titration', term: 'titration', gloss: 'adding a solution of known concentration, a little at a time, until a reaction is just complete', quest: 'q6-titrate', stage: 1, re: /\btitrat/i },
  { id: 'equivalence', term: 'equivalence point', gloss: 'the moment the added base has exactly used up the acid', quest: 'q6-titrate', stage: 1, re: /\bequivalence point\b/i },
  { id: 'indicator', term: 'indicator', gloss: 'a dye that changes colour at a particular pH', quest: 'q6-titrate', stage: 5, re: /\b(indicator|dye)s?\b/i },
  { id: 'pka', term: 'pKa', gloss: 'the negative logarithm of Ka; the pH at which an acid is half handed over', quest: 'q6-titrate', stage: 4, re: /\bpKa\b/ },
  { id: 'buffer', term: 'buffer', gloss: 'a mixture of a weak acid and its conjugate base that keeps the pH almost steady', quest: 'q7-buffer', stage: 1, re: /\bbuffers?\b/i },
  { id: 'solubility', term: 'solubility', gloss: 'how much of a solid dissolves in a litre of water', quest: 'q8-capacity', stage: 7, re: /\bsolubility\b/i }
];

/** Words that must not stand in for a glossary term inside Verdigris's play text (`verify:teaching`). Story and bosses are exempt. */
export const BANNED = [
  { re: /\brigs?\b/i, use: 'expression board', why: 'fiction name' },
  { re: /\btiles?\b/i, use: 'card', why: 'fiction name' },
  { re: /\bchips?\b/i, use: 'formula card', why: 'fiction name' },
  { re: /\blens\b/i, use: 'counter', why: 'fiction name' },
  { re: /\bstrengths?\b/i, use: 'concentration (or strong/weak)', why: 'two meanings in one word', skip: /acid strength|What Sets Strength|whose strength/ },
  { re: /\b(push|pushes|knock|knocks|squeeze)\b/i, use: 'real term', why: 'vague word' },
  { re: /\bcrates?\b|\bdrums?\b|\bholders?\b|\bslates?\b/i, use: 'a real lab name', why: 'fiction name' }
];

/** What each stage assumes the student can do, and the primer (`engine/primers.js`) that teaches it. Keyed `<quest>:<stage number>`. */
export const NEEDS = {
  'q2-scale:1': ['log'],
  'q2-scale:2': ['log'],
  'q2-scale:4': ['log'],
  'q3-weak:4': ['ratio'],
  'q3-weak:5': ['log', 'ratio'],
  'q5-salts:6': ['amount'],
  'q6-titrate:7': ['amount'],
  'q6-titrate:8': ['log'],
  'q7-buffer:5': ['log', 'ratio'],
  'q7-buffer:6': ['log', 'ratio']
};
