/**
 * glossary/thornmere.js — the words of Thornmere (unit13, organic chemistry): one term per concept, a one-clause gloss, and the stage
 * (1-based) whose briefing or reward first uses it. Prompts, hints, misses, rewards, captions, the Tour and the bank use these terms and no
 * banned stand-in for them.
 */

export const QUESTS = ['q1-chains', 'q2-unsat', 'q3-isomers', 'q4-groups', 'q5-reactions', 'q6-polymers', 'boss-carapace'];

export const TERMS = [
  { id: 'hydrocarbon', term: 'hydrocarbon', gloss: 'a compound of carbon and hydrogen only', quest: 'q1-chains', stage: 1, re: /\bhydrocarbons?\b/i },
  { id: 'alkane', term: 'alkane', gloss: 'a hydrocarbon with single bonds only', quest: 'q1-chains', stage: 3, re: /\balkanes?\b/i },
  { id: 'skeletal-formula', term: 'skeletal formula', gloss: 'a drawing of only the bonds between carbons: every corner and every end is a carbon', quest: 'q1-chains', stage: 5, re: /\bskeletal formulas?\b/i },
  { id: 'branch', term: 'branch', gloss: 'a carbon or short chain joined to the side of a longer chain', quest: 'q1-chains', stage: 6, re: /\bbranch(es|ed)?\b/i },
  { id: 'cycloalkane', term: 'cycloalkane', gloss: 'an alkane whose chain is closed into a ring', quest: 'q1-chains', stage: 7, re: /\bcycloalkanes?\b/i },
  { id: 'alkene', term: 'alkene', gloss: 'a hydrocarbon with a carbon–carbon double bond', quest: 'q2-unsat', stage: 1, re: /\balkenes?\b/i },
  { id: 'electron-rich', term: 'electron-rich site', gloss: 'a place in a molecule with a pair of electrons that another molecule can reach', quest: 'q2-unsat', stage: 3, re: /\belectron-rich\b/i },
  { id: 'curved-arrow', term: 'curved arrow', gloss: 'an arrow that shows one pair of electrons moving, from where it is to where it goes', quest: 'q2-unsat', stage: 4, re: /\bcurved arrows?\b/i },
  { id: 'electron-poor', term: 'electron-poor site', gloss: 'an atom that is short of electrons, because a shared pair is held nearer its neighbour or it has a positive charge', quest: 'q2-unsat', stage: 4, re: /\belectron-poor\b/i },
  { id: 'addition', term: 'addition reaction', gloss: 'a reaction in which atoms add across a double bond and nothing leaves', quest: 'q2-unsat', stage: 5, re: /\baddition reactions?\b/i },
  { id: 'unsaturated', term: 'unsaturated', gloss: 'holding fewer hydrogens than the carbon chain could, because of a double bond', quest: 'q2-unsat', stage: 6, re: /\bunsaturated\b/i },
  { id: 'aromatic', term: 'aromatic', gloss: 'a ring, like benzene\'s, whose second pairs are shared round the whole ring', quest: 'q2-unsat', stage: 7, re: /\baromatic\b/i }
  // q3-isomers
  // q4-groups
  // q5-reactions
  // q6-polymers
];

export const BANNED = [
  { re: /\bbackbones?\b/i, use: 'chain', why: 'stand-in word' },
  { re: /\bsticks?\b/i, use: 'bond', why: 'stand-in word' },
  { re: /\barms?\b/i, use: 'bond / group', why: 'stand-in word' },
  { re: /\brecipes?\b/i, use: 'formula', why: 'stand-in word' },
  { re: /\bsticky\b/i, use: 'attraction', why: 'vague word' },
  { re: /\bwants?\b/i, use: 'attraction / lower energy', why: 'anthropomorphic motive' },
  { re: /\blikes?\b/i, use: 'is attracted to', why: 'anthropomorphic motive' },
  { re: /\bprefers?\b/i, use: 'lower energy', why: 'anthropomorphic motive' },
  { re: /\bhappy\b/i, use: 'lower energy', why: 'anthropomorphic motive' },
  { re: /\battacks?\b/i, use: 'moves to', why: 'a pair of electrons moves; nothing attacks' },
  { re: /\bnucleophiles?\b/i, use: 'electron-rich site', why: 'college term' },
  { re: /\belectrophiles?\b/i, use: 'electron-poor site', why: 'college term' },
  { re: /\bleaving groups?\b/i, use: 'the group that leaves', why: 'college term' },
  { re: /\bcarbocations?\b/i, use: 'a carbon with three bonds and a positive charge', why: 'college term' },
  { re: /\bmechanisms?\b/i, use: 'the steps of the reaction', why: 'college term' },
  { re: /\bS[Nn][12]\b/, use: 'substitution', why: 'college term' }
];

export const STORY_ALLOW = ['tar', 'still', 'drum', 'armour', 'plate', 'plates', 'fortress', 'gate', 'Carapace'];

/** Recaps a stage offers (`engine/primers.js`): carbon's four bonds from Ligar, and the Charge Gardens' moving pair of electrons. */
export const NEEDS = {
  'q1-chains:1': ['fourbonds'],
  'q2-unsat:1': ['fourbonds'],
  'q2-unsat:4': ['pairmove']
  // q3-isomers
  // q4-groups
  // q5-reactions
  // q6-polymers
};
