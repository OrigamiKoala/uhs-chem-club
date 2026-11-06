/**
 * glossary/brinewire.js — the words of Brinewire (Unit 10, electrochemistry): one term per concept, a one-clause gloss, and the stage where
 * it is first used (`quest`, `stage` 1-based). Prompts, hints, misses, rewards, captions, the Tour and the bank use these terms and no
 * synonym of them. `re` finds the term in text; `synonyms` are words that must NOT be used for it (`verify:teaching`).
 * `recap: true` marks a term from an earlier world, re-glossed here because nothing guarantees that world was played.
 */

export const QUESTS = ['q1-halves', 'q2-activity', 'q3-galvanic', 'q4-potential', 'q5-load', 'q6-electrolysis', 'boss-clamp'];

export const TERMS = [
  { id: 'electron', term: 'electron', gloss: 'a tiny particle with a negative charge, found in every atom', quest: 'q1-halves', stage: 1, recap: 'Tallow', re: /\belectrons?\b/i },
  { id: 'ion', term: 'ion', gloss: 'an atom or group of atoms with a charge, because it has lost or gained electrons', quest: 'q1-halves', stage: 1, recap: 'Tallow', re: /\bions?\b/i },
  { id: 'charge', term: 'charge', gloss: 'plus or minus: what an atom has when its electrons and protons are not equal in number', quest: 'q1-halves', stage: 1, recap: 'Tallow', re: /\bcharges?\b/i },
  { id: 'oxidation-number', term: 'oxidation number', gloss: 'an atom\'s electron bookkeeping: plus for each electron lost, minus for each gained', quest: 'q1-halves', stage: 1, re: /\boxidation numbers?\b/i },
  { id: 'half-reaction', term: 'half-reaction', gloss: 'one half of a reaction: the part where electrons are lost, or the part where they are gained', quest: 'q1-halves', stage: 3, re: /\bhalf-reactions?\b/i },
  { id: 'oxidation', term: 'oxidation', gloss: 'losing electrons', quest: 'q1-halves', stage: 3, re: /\boxidation\b(?! numbers?)/i },
  { id: 'reduction', term: 'reduction', gloss: 'gaining electrons', quest: 'q1-halves', stage: 3, re: /\breduction\b/i },
  { id: 'redox', term: 'redox', gloss: 'a reaction in which one thing loses electrons and another gains them', quest: 'q1-halves', stage: 3, re: /\bredox\b/i },
  { id: 'reducing-agent', term: 'reducing agent', gloss: 'the substance that gives up the electrons', quest: 'q1-halves', stage: 5, re: /\breducing agents?\b/i },
  { id: 'oxidizing-agent', term: 'oxidizing agent', gloss: 'the substance that takes the electrons', quest: 'q1-halves', stage: 5, re: /\boxidi[sz]ing agents?\b/i },
  { id: 'displacement', term: 'displacement', gloss: 'a metal pushing another metal out of its solution and taking its place', quest: 'q2-activity', stage: 1, re: /\bdisplacement\b/i },
  { id: 'activity-series', term: 'activity series', gloss: 'metals listed from most to least ready to give up electrons', quest: 'q2-activity', stage: 2, re: /\bactivity series\b/i },
  { id: 'sacrificial-anode', term: 'sacrificial anode', gloss: 'a metal that corrodes in place of the one it protects', quest: 'q2-activity', stage: 6, re: /\bsacrificial anode\b/i },
  { id: 'salt-bridge', term: 'salt bridge', gloss: 'a path for ions between two beakers, which keeps the charge in each beaker even', quest: 'q3-galvanic', stage: 2, re: /\bsalt bridges?\b/i },
  { id: 'anode', term: 'anode', gloss: 'the electrode where oxidation happens', quest: 'q3-galvanic', stage: 4, re: /\banodes?\b/i },
  { id: 'cathode', term: 'cathode', gloss: 'the electrode where reduction happens', quest: 'q3-galvanic', stage: 4, re: /\bcathodes?\b/i },
  { id: 'galvanic-cell', term: 'galvanic cell', gloss: 'two half-cells joined so a redox reaction pushes electrons through a wire', quest: 'q3-galvanic', stage: 4, re: /\bgalvanic cells?\b/i },
  { id: 'cell-notation', term: 'cell notation', gloss: 'a line of symbols that lists the anode half, the salt bridge and the cathode half', quest: 'q3-galvanic', stage: 7, re: /\bcell notation\b/i },
  { id: 'volt', term: 'volt', gloss: 'the unit of voltage: how hard a cell pushes on electrons', quest: 'q4-potential', stage: 1, re: /\bvolts?\b/i },
  { id: 'standard-reduction-potential', term: 'standard reduction potential', gloss: 'a half-reaction\'s voltage against the hydrogen reference, in standard conditions', quest: 'q4-potential', stage: 1, re: /\bstandard reduction potentials?\b/i },
  { id: 'e-cell', term: 'E°cell', gloss: 'the standard voltage of a whole cell: cathode potential minus anode potential', quest: 'q4-potential', stage: 2, re: /\bE°cell\b/ },
  { id: 'faraday-constant', term: 'Faraday constant', gloss: 'the charge of one mole of electrons, 96 485 coulombs', quest: 'q4-potential', stage: 6, re: /\bFaraday constant\b/i },
  { id: 'reaction-quotient', term: 'reaction quotient', gloss: 'Q: products over reactants, counted with the amounts present right now', quest: 'q5-load', stage: 4, re: /\breaction quotients?\b/i },
  { id: 'concentration-cell', term: 'concentration cell', gloss: 'a cell whose two halves are the same metal, in solutions of different concentration', quest: 'q5-load', stage: 5, re: /\bconcentration cells?\b/i },
  { id: 'nernst', term: 'Nernst equation', gloss: 'the equation that gives a cell\'s voltage from E°cell and Q', quest: 'q5-load', stage: 6, re: /\bNernst\b/ },
  { id: 'electrolysis', term: 'electrolysis', gloss: 'using an outside source of electricity to force a reaction that would not run by itself', quest: 'q6-electrolysis', stage: 1, re: /\belectroly(sis|tic)\b/i },
  { id: 'coulomb', term: 'coulomb', gloss: 'the unit of charge: the charge that 1 ampere carries in 1 second', quest: 'q6-electrolysis', stage: 3, re: /\bcoulombs?\b/i },
  { id: 'faraday-law', term: 'Faraday\'s law', gloss: 'the mass deposited is proportional to the charge passed', quest: 'q6-electrolysis', stage: 4, re: /\bFaraday's law\b/i },
  { id: 'overpotential', term: 'overpotential', gloss: 'extra voltage a reaction needs beyond the textbook value', quest: 'q6-electrolysis', stage: 7, re: /\boverpotential\b/i }
];

/**
 * Words that are not glossary terms and must not stand in for one inside Brinewire's play text. Each is a fiction name or a vague
 * synonym of a real thing (`verify:teaching`).
 */
export const BANNED = [
  { re: /\bledgers?\b/i, use: 'half-reaction card', why: 'fiction name' },
  { re: /\b(push|pushes)\b/i, use: 'voltage / pressure', why: 'vague word' },
  { re: /\bknock(s|ed)?\b/i, use: 'collision', why: 'vague word' },
  { re: /\bstrengths?\b/i, use: 'concentration', why: 'vague word' },
  { re: /\bchips?\b/i, use: 'card / token', why: 'fiction name' },
  { re: /\bcrates?\b|\bdrums?\b|\bholders?\b|\bslates?\b/i, use: 'a real lab name', why: 'fiction name' }
];

/** Words allowed in the story files and bosses only. */
export const STORY_ALLOW = ['rig'];

/**
 * What each stage assumes the student can do, and the primer (`engine/primers.js`) that teaches it, offered by the Primer key on that stage.
 * Keyed `<quest>:<stage number>`. `verify:teaching` fails a need that names no primer.
 */
export const NEEDS = {
  'q1-halves:1': ['ions'],
  'q4-potential:6': ['ladder'],
  'q4-potential:7': ['log'],
  'q5-load:4': ['ratio'],
  'q5-load:6': ['log', 'ratio'],
  'q5-load:7': ['log'],
  'q6-electrolysis:3': ['ladder'],
  'q6-electrolysis:4': ['ladder'],
  'q6-electrolysis:5': ['ladder'],
  'q6-electrolysis:8': ['ladder']
};
