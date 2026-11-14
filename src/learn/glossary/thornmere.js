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
  { id: 'aromatic', term: 'aromatic', gloss: 'a ring, like benzene\'s, whose second pairs are shared round the whole ring', quest: 'q2-unsat', stage: 7, re: /\baromatic\b/i },
  // q3-isomers
  { id: 'structural-isomer', term: 'structural isomer', gloss: 'one of two or more molecules with the same formula whose atoms are joined in a different order', quest: 'q3-isomers', stage: 1, re: /\bstructural isomers?\b/i },
  { id: 'cis-trans', term: 'cis and trans', gloss: 'the two forms of a molecule whose groups are on the same side (cis) or opposite sides (trans) of a double bond', quest: 'q3-isomers', stage: 4, re: /\b(cis|trans)\b/i },
  { id: 'chiral', term: 'chiral', gloss: 'not able to be turned to match its own mirror image, as a left hand cannot match a right', quest: 'q3-isomers', stage: 6, re: /\bchiral\b/i },
  { id: 'enantiomer', term: 'enantiomer', gloss: 'one of a chiral molecule and its mirror image', quest: 'q3-isomers', stage: 6, re: /\benantiomers?\b/i },
  { id: 'stereocentre', term: 'stereocentre', gloss: 'a carbon bonded to four different groups', quest: 'q3-isomers', stage: 8, re: /\bstereocentres?\b/i },
  // q4-groups
  { id: 'functional-group', term: 'functional group', gloss: 'a small group of atoms on a carbon chain that decides much of how the molecule behaves', quest: 'q4-groups', stage: 1, re: /\bfunctional groups?\b/i },
  { id: 'alcohol', term: 'alcohol', gloss: 'a carbon chain carrying an –OH group', quest: 'q4-groups', stage: 1, re: /\balcohols?\b/i },
  { id: 'carbonyl', term: 'carbonyl group', gloss: 'a carbon double-bonded to an oxygen, C=O', quest: 'q4-groups', stage: 4, re: /\bcarbonyl\b/i },
  { id: 'carboxylic-acid', term: 'carboxylic acid', gloss: 'a molecule with the group –COOH, which gives a proton to water', quest: 'q4-groups', stage: 5, re: /\bcarboxylic acids?\b/i },
  { id: 'amine', term: 'amine', gloss: 'a carbon chain with a nitrogen bonded into it, whose lone pair takes a proton', quest: 'q4-groups', stage: 7, re: /\bamines?\b/i },
  // q5-reactions
  { id: 'substitution', term: 'substitution reaction', gloss: 'a reaction in which one group arrives at a carbon and another leaves it', quest: 'q5-reactions', stage: 2, re: /\bsubstitution\b/i },
  { id: 'ester', term: 'ester', gloss: 'the product of a carboxylic acid and an alcohol, joined by a C–O link', quest: 'q5-reactions', stage: 5, re: /\besters?\b/i },
  { id: 'condensation', term: 'condensation reaction', gloss: 'a reaction that joins two molecules while a small one, often water, leaves', quest: 'q5-reactions', stage: 5, re: /\bcondensation\b/i },
  { id: 'hydrolysis', term: 'hydrolysis', gloss: 'breaking a link by adding water (or hydroxide) back across it', quest: 'q5-reactions', stage: 6, re: /\bhydrolysis\b/i }
  // q6-polymers
];

export const BANNED = [
  { re: /\bbackbones?\b/i, use: 'chain', why: 'stand-in word' },
  { re: /\bsticks?\b/i, use: 'bond', why: 'stand-in word' },
  { re: /\barms?\b/i, use: 'bond / group', why: 'stand-in word' },
  { re: /\brecipes?\b/i, use: 'formula', why: 'stand-in word' },
  { re: /\bsticky\b/i, use: 'attraction', why: 'vague word' },
  { re: /\bwants?\b/i, use: 'attraction / lower energy', why: 'anthropomorphic motive' },
  { re: /\blikes\b/i, use: 'is attracted to', why: 'anthropomorphic motive' },
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
  'q2-unsat:4': ['pairmove'],
  // q3-isomers
  'q3-isomers:3': ['imforces'],
  // q4-groups
  'q4-groups:1': ['imforces'],
  'q4-groups:2': ['acidbase'],
  'q4-groups:4': ['pairmove'],
  // q5-reactions
  'q5-reactions:1': ['pairmove']
  // q6-polymers
};
