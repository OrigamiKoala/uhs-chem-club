/**
 * glossary/mirrowen.js — the words of Mirrowen (Unit 06, states of matter and intermolecular forces): one term per concept, a one-clause
 * gloss, and the stage where it is first used (`quest`, `stage` 1-based). Prompts, hints, misses, rewards, captions, the Tour and the bank use
 * these terms and no synonym of them. `re` finds the term in play text; `BANNED` lists the vague words and fiction names that must not stand
 * in for one (`verify:teaching:mirrowen`). `recap` marks a term from an earlier world, re-glossed because nothing guarantees that world was played.
 */

export const QUESTS = ['q1-states', 'q2-grip', 'q3-boil', 'q4-solids', 'q5-crossing', 'q6-solution', 'q7-separate', 'boss-undertow'];

export const TERMS = [
  { id: 'molecule', term: 'molecule', gloss: 'a group of atoms joined by bonds, moving as one', quest: 'q1-states', stage: 2, recap: 'Tallow', re: /\bmolecules?\b/i },
  { id: 'solid', term: 'solid', gloss: 'a state of matter that keeps its own shape', quest: 'q1-states', stage: 1, re: /\bsolids?\b/i },
  { id: 'liquid', term: 'liquid', gloss: 'a state of matter that keeps its volume but takes the shape of its container', quest: 'q1-states', stage: 1, re: /\bliquids?\b/i },
  { id: 'gas', term: 'gas', gloss: 'a state of matter that fills its container and can be compressed', quest: 'q1-states', stage: 1, re: /\bgas(es)?\b/i },
  { id: 'volume', term: 'volume', gloss: 'the space a sample takes up', quest: 'q1-states', stage: 1, re: /\bvolumes?\b/i },
  { id: 'pressure', term: 'pressure', gloss: 'the force on each unit of area of a wall; 1 atm is the pressure of the air at sea level', quest: 'q1-states', stage: 1, recap: 'Bellows', re: /\bpressures?\b|\batm\b|\bkPa\b/ },
  { id: 'piston', term: 'piston', gloss: 'a plug that slides in a tube and compresses what is inside', quest: 'q1-states', stage: 1, re: /\bpiston\b/i },
  { id: 'phase-change', term: 'phase change', gloss: 'melting, boiling or the reverse: the molecules stay whole and only change their arrangement', quest: 'q1-states', stage: 4, re: /\bphase changes?\b/i },
  { id: 'intermolecular', term: 'intermolecular force', gloss: 'an attraction between one molecule and the next, separate from the bonds inside a molecule', quest: 'q1-states', stage: 5, re: /\bintermolecular forces?\b/i },
  { id: 'density', term: 'density', gloss: 'the mass in a given volume', quest: 'q1-states', stage: 6, re: /\bdensity\b|\bdense\b/i },
  { id: 'mole', term: 'mole (mol)', gloss: 'a fixed number of particles, 6.02 × 10²³ of them', quest: 'q2-grip', stage: 1, recap: 'Tallow', re: /\bmoles?\b|\bmol\b/i },
  { id: 'kilojoule', term: 'kilojoule (kJ)', gloss: 'a unit of energy: 1000 joules', quest: 'q2-grip', stage: 1, re: /\bkJ\b|\bkilojoules?\b/ },
  { id: 'dispersion', term: 'London dispersion force', gloss: 'the attraction between brief, shifting uneven charges in neighbouring electron clouds', quest: 'q2-grip', stage: 1, re: /\bdispersion\b/i },
  { id: 'polar', term: 'polar', gloss: 'having a positive end and a negative end', quest: 'q2-grip', stage: 2, recap: 'Ligar', re: /\bpolar\b|\bpolarizable\b|\bdipole\b/i },
  { id: 'hydrogen-bond', term: 'hydrogen bond', gloss: 'the strongest attraction between neutral molecules: a hydrogen on N, O or F drawn to a lone pair on the next molecule', quest: 'q2-grip', stage: 4, re: /\bhydrogen bonds?\b|\bhydrogen bonded\b/i },
  { id: 'ion-dipole', term: 'ion–dipole force', gloss: 'the attraction between an ion and the partial charges of water', quest: 'q2-grip', stage: 5, re: /\bion.dipole\b/i },
  { id: 'vapor-pressure', term: 'vapor pressure', gloss: 'the pressure of a liquid\'s own vapor above it in a sealed flask', quest: 'q3-boil', stage: 1, re: /\bvapou?r pressure\b/i },
  { id: 'boiling-point', term: 'boiling point', gloss: 'the temperature at which a liquid\'s vapor pressure equals the pressure outside it', quest: 'q3-boil', stage: 4, re: /\bboiling points?\b/i },
  { id: 'surface-tension', term: 'surface tension', gloss: 'the inward pull on molecules at the surface of a liquid', quest: 'q3-boil', stage: 6, re: /\bsurface tension\b/i },
  { id: 'viscosity', term: 'viscosity', gloss: 'how slowly a liquid pours', quest: 'q3-boil', stage: 6, re: /\bviscosity\b/i },
  { id: 'molecular-solid', term: 'molecular solid', gloss: 'a solid of whole molecules held by weak attractions', quest: 'q4-solids', stage: 1, re: /\bmolecular solids?\b/i },
  { id: 'crystalline', term: 'crystalline', gloss: 'having particles in a pattern that repeats in every direction', quest: 'q4-solids', stage: 3, re: /\bcrystalline\b/i },
  { id: 'amorphous', term: 'amorphous', gloss: 'having particles with no repeating pattern', quest: 'q4-solids', stage: 3, re: /\bamorphous\b/i },
  { id: 'heating-curve', term: 'heating curve', gloss: 'a graph of temperature against the heat added', quest: 'q5-crossing', stage: 1, re: /\bheating curve\b/i },
  { id: 'heat-of-fusion', term: 'heat of fusion', gloss: 'the heat needed to melt one mole of a solid at its melting point', quest: 'q5-crossing', stage: 4, recap: 'Ember Reach', re: /\bheat of fusion\b/i },
  { id: 'heat-of-vaporization', term: 'heat of vaporization', gloss: 'the heat needed to boil one mole of a liquid at its boiling point', quest: 'q5-crossing', stage: 5, recap: 'Ember Reach', re: /\bheat of vaporization\b/i },
  { id: 'solution', term: 'solution', gloss: 'a mixture that is the same all the way through', quest: 'q6-solution', stage: 1, re: /\bsolutions?\b/i },
  { id: 'solute', term: 'solute', gloss: 'the part of a solution that dissolves', quest: 'q6-solution', stage: 1, re: /\bsolutes?\b/i },
  { id: 'solvent', term: 'solvent', gloss: 'the liquid a solute dissolves in', quest: 'q6-solution', stage: 1, re: /\bsolvents?\b/i },
  { id: 'molarity', term: 'molarity (M)', gloss: 'the moles of solute in each litre of solution', quest: 'q6-solution', stage: 2, re: /\bmolarity\b/i },
  { id: 'dilution', term: 'dilution', gloss: 'adding solvent so the same moles share more litres', quest: 'q6-solution', stage: 3, re: /\bdilution\b/i },
  { id: 'ion', term: 'ion', gloss: 'an atom or group of atoms with an electric charge', quest: 'q2-grip', stage: 5, recap: 'Tallow', re: /\bions?\b/i },
  { id: 'filtrate', term: 'filtrate', gloss: 'the liquid that passes through filter paper', quest: 'q7-separate', stage: 2, re: /\bfiltrate\b/i },
  { id: 'chromatography', term: 'chromatography', gloss: 'separating a mixture as a liquid climbs paper that holds each part differently', quest: 'q7-separate', stage: 3, re: /\bchromatography\b/i },
  { id: 'rf', term: 'retention factor (Rf)', gloss: 'how far a dye travelled divided by how far the liquid travelled', quest: 'q7-separate', stage: 3, re: /\bretention factor\b|\bRf\b/ },
  { id: 'distillation', term: 'distillation', gloss: 'separating liquids by boiling them off one after another and cooling the vapor', quest: 'q7-separate', stage: 5, re: /\bdistillation\b/i }
];

/** Words that are not glossary terms and must not stand in for one inside Mirrowen's play text (the Undertow and the story keep their fiction). */
export const BANNED = [
  { re: /\b(push|pushes|pushed)\b/i, use: 'pressure, or a plain verb', why: 'vague word' },
  { re: /\bknock(s|ed)?\b/i, use: 'collision', why: 'vague word' },
  { re: /\bsqueez(e|es|ed|ing)\b/i, use: 'compress', why: 'vague word' },
  { re: /\broom\b(?! temperature)/i, use: 'volume or space', why: 'vague word' },
  { re: /\bgrips?\b/i, use: 'attraction, or intermolecular force', why: 'vague word' },
  { re: /\breaders?\b/i, use: 'analyzer', why: 'fiction name' },
  { re: /\bcranks?\b/i, use: 'pull dial', why: 'fiction name' },
  { re: /\btins?\b/i, use: 'sample', why: 'fiction name' },
  { re: /\bmarkers?\b/i, use: 'number dial', why: 'fiction name' },
  { re: /\bchips?\b|\btiles?\b/i, use: 'card', why: 'fiction name' },
  { re: /\b(pans?|pots?|rigs?|crates?|drums?|holders?|slates?)\b/i, use: 'a real lab name', why: 'fiction name' },
  // "gauge" alone for a pressure gauge, and "the press" for the piston and tank.
  { re: /(?<![Pp]ressure )\bgauges?\b/, use: 'pressure gauge', why: 'vague word' },
  { re: /\bthe press\b/i, use: 'the piston', why: 'fiction name' }
];

export const STORY_ALLOW = ['grip', 'push', 'room', 'reader'];

/** What each stage assumes the student can do, and the primer (`engine/primers.js`) offered by the Primer key on that stage. */
export const NEEDS = {
  'q2-grip:7': ['ratio'],
  'q5-crossing:4': ['amount'],
  'q5-crossing:5': ['amount'],
  'q6-solution:2': ['amount'],
  'q6-solution:3': ['ratio'],
  'q6-solution:5': ['amount']
};
