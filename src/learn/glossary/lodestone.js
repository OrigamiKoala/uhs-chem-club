/**
 * glossary/lodestone.js — the words of Lodestone (unit12, the transition metals): one term per concept, a one-clause gloss, and the stage
 * (1-based) whose briefing or reward first uses it. Prompts, hints, misses, rewards, captions, the Tour and the bank use these terms and no
 * banned stand-in for them.
 */

export const QUESTS = ['q1-dblock', 'q2-charges', 'q3-complex', 'q4-shapes', 'q5-colour', 'q6-spin', 'boss-coil'];

export const TERMS = [
  { id: 'subshell', term: '3d subshell', gloss: 'a set of five orbitals of the same energy, filled in the fourth row of the table', quest: 'q1-dblock', stage: 1, re: /\b3d subshell\b/i },
  { id: 'ionization-energy', term: 'ionization energy', gloss: 'the energy needed to remove one electron from an atom or ion', quest: 'q2-charges', stage: 1, re: /\bionization energ(y|ies)\b/i },
  { id: 'oxidation-state', term: 'oxidation state', gloss: 'the charge a metal takes in a compound, written as a Roman numeral in a name: iron(III)', quest: 'q2-charges', stage: 2, re: /\boxidation states?\b/i },
  { id: 'transition-metal', term: 'transition metal', gloss: 'an element that forms at least one ion with a partly filled 3d subshell', quest: 'q2-charges', stage: 5, re: /\btransition metals?\b/i },
  { id: 'ligand', term: 'ligand', gloss: 'a molecule or ion bonded to a metal ion through a lone pair', quest: 'q3-complex', stage: 1, re: /\bligands?\b/i },
  { id: 'complex-ion', term: 'complex ion', gloss: 'a metal ion together with the ligands bonded to it', quest: 'q3-complex', stage: 1, re: /\bcomplex(es| ions?)?\b/i },
  { id: 'coordinate-bond', term: 'coordinate bond', gloss: 'a bond whose two electrons both come from one particle, here a ligand\'s lone pair', quest: 'q3-complex', stage: 3, re: /\bcoordinate bonds?\b/i },
  { id: 'coordination-number', term: 'coordination number', gloss: 'the number of atoms bonded directly to the metal ion', quest: 'q3-complex', stage: 4, re: /\bcoordination numbers?\b/i },
  { id: 'chelate', term: 'chelate', gloss: 'a ligand that bonds to the metal ion through two or more atoms', quest: 'q3-complex', stage: 7, re: /\bchelates?\b/i },
  { id: 'octahedron', term: 'octahedron', gloss: 'six places round a centre: four in a square, one above, one below, 90° apart', quest: 'q4-shapes', stage: 1, re: /\boctahed(ron|ral)\b/i },
  { id: 'square-planar', term: 'square planar', gloss: 'four ligands in a flat square round the metal ion', quest: 'q4-shapes', stage: 2, re: /\bsquare planar\b/i },
  { id: 'tetrahedron', term: 'tetrahedron', gloss: 'four places round a centre, 109.5° apart', quest: 'q4-shapes', stage: 2, re: /\btetrahed(ron|ral)\b/i },
  { id: 'isomer', term: 'isomer', gloss: 'one of two or more substances with the same atoms arranged differently', quest: 'q4-shapes', stage: 3, re: /\bisomers?\b/i },
  { id: 'cis-trans', term: 'cis and trans', gloss: 'like ligands side by side (cis) or opposite each other (trans)', quest: 'q4-shapes', stage: 4, re: /\b(cis|trans)\b/i },
  { id: 'complementary', term: 'complementary colour', gloss: 'the colour opposite on the colour wheel: the one taken out of white light when a solution shows the other', quest: 'q5-colour', stage: 1, re: /\bcomplementary\b/i },
  { id: 'crystal-field', term: 'crystal field splitting', gloss: 'the gap that opens between the d orbitals that point at the ligands and those that point between them', quest: 'q5-colour', stage: 2, re: /\bcrystal field splitting\b/i },
  { id: 'paramagnetic', term: 'paramagnetic', gloss: 'pulled toward a magnet because it has unpaired electrons', quest: 'q6-spin', stage: 1, re: /\bparamagnetic\b/i },
  { id: 'pairing-cost', term: 'pairing cost', gloss: 'the energy it takes to put a second electron into an orbital, because the two repel', quest: 'q6-spin', stage: 3, re: /\bpairing cost\b/i },
  { id: 'spin', term: 'high spin and low spin', gloss: 'd electrons spread over both levels (high spin) or paired in the lower level (low spin)', quest: 'q6-spin', stage: 3, re: /\b(high|low) spin\b/i }
];

export const BANNED = [
  { re: /\bgrabs?\b/i, use: 'bonds to', why: 'vague word' },
  { re: /\bwants?\b/i, use: 'attraction / lower energy', why: 'anthropomorphic motive' },
  { re: /\bprefers?\b/i, use: 'lower energy', why: 'anthropomorphic motive' },
  { re: /\bhappy\b/i, use: 'lower energy', why: 'anthropomorphic motive' },
  { re: /\bpockets?\b/i, use: 'place', why: 'vague word' },
  { re: /\bslots? of (an|the) atom\b/i, use: 'orbital', why: 'vague word' }
];

export const STORY_ALLOW = ['drum', 'manifest', 'Coil'];

export const NEEDS = {};
