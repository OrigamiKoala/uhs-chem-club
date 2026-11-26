/**
 * glossary/thornmere.js — the words of Thornmere (unit13, organic chemistry): one term per concept, a one-clause gloss, and the stage
 * (1-based) whose briefing or reward first uses it. Prompts, hints, misses, rewards, captions, the Tour and the bank use these terms and no
 * banned stand-in for them.
 */

export const QUESTS = ['q1-chains', 'q2-unsat', 'q3-isomers', 'q4-groups', 'q5-reactions', 'q6-polymers', 'boss-carapace'];

export const TERMS = [
  { id: 'hydrocarbon', term: 'hydrocarbon', gloss: 'a molecule made of carbon and hydrogen only', quest: 'q1-chains', stage: 1, re: /\bhydrocarbons?\b/i },
  { id: 'alkane', term: 'alkane', gloss: 'a hydrocarbon with single bonds only', quest: 'q1-chains', stage: 3, re: /\balkanes?\b/i },
  { id: 'skeletal-formula', term: 'skeletal formula', gloss: 'a zigzag drawing showing only carbon–carbon bonds, where every corner and end is a carbon', quest: 'q1-chains', stage: 5, re: /\bskeletal formulas?\b/i },
  { id: 'branch', term: 'branch', gloss: 'a carbon or short chain attached to the side of a longer chain', quest: 'q1-chains', stage: 6, re: /\bbranch(es|ed)?\b/i },
  { id: 'cycloalkane', term: 'cycloalkane', gloss: 'an alkane whose carbon chain closes into a ring', quest: 'q1-chains', stage: 7, re: /\bcycloalkanes?\b/i },
  { id: 'alkene', term: 'alkene', gloss: 'a hydrocarbon with a carbon–carbon double bond', quest: 'q2-unsat', stage: 1, re: /\balkenes?\b/i },
  { id: 'electron-rich', term: 'electron-rich site', gloss: 'a spot in a molecule with an exposed pair of electrons that can form a new bond', quest: 'q2-unsat', stage: 3, re: /\belectron-rich\b/i },
  { id: 'curved-arrow', term: 'curved arrow', gloss: 'an arrow showing one pair of electrons moving from where it starts to where it goes', quest: 'q2-unsat', stage: 4, re: /\bcurved arrows?\b/i },
  { id: 'electron-poor', term: 'electron-poor site', gloss: 'an atom short of electrons because a neighbor pulls its shared electrons away or it carries a positive charge', quest: 'q2-unsat', stage: 4, re: /\belectron-poor\b/i },
  { id: 'addition', term: 'addition reaction', gloss: 'a reaction where atoms add across a double bond with nothing left over', quest: 'q2-unsat', stage: 5, re: /\baddition reactions?\b/i },
  { id: 'unsaturated', term: 'unsaturated', gloss: 'holding fewer hydrogens than a single-bond chain could, because of a double bond', quest: 'q2-unsat', stage: 6, re: /\bunsaturated\b/i },
  { id: 'aromatic', term: 'aromatic', gloss: 'a ring like benzene whose extra electron pairs are shared evenly all the way around', quest: 'q2-unsat', stage: 7, re: /\baromatic\b/i },
  // q3-isomers
  { id: 'structural-isomer', term: 'structural isomer', gloss: 'one of two or more molecules with the same formula but atoms connected in a different order', quest: 'q3-isomers', stage: 1, re: /\bstructural isomers?\b/i },
  { id: 'cis-trans', term: 'cis and trans', gloss: 'two isomers where groups are locked on the same side (cis) or opposite sides (trans) of a double bond', quest: 'q3-isomers', stage: 4, re: /\b(cis|trans)\b/i },
  { id: 'chiral', term: 'chiral', gloss: 'a molecule that cannot be rotated to match its mirror image, just like a left hand and a right hand', quest: 'q3-isomers', stage: 6, re: /\bchiral\b/i },
  { id: 'enantiomer', term: 'enantiomer', gloss: 'either member of a chiral molecule and its non-matching mirror image', quest: 'q3-isomers', stage: 6, re: /\benantiomers?\b/i },
  { id: 'stereocentre', term: 'stereocentre', gloss: 'a carbon bonded to four different groups', quest: 'q3-isomers', stage: 8, re: /\bstereocentres?\b/i },
  // q4-groups
  { id: 'functional-group', term: 'functional group', gloss: 'a small reactive group of atoms on a carbon chain that controls how the molecule behaves', quest: 'q4-groups', stage: 1, re: /\bfunctional groups?\b/i },
  { id: 'alcohol', term: 'alcohol', gloss: 'a carbon chain carrying an –OH group', quest: 'q4-groups', stage: 1, re: /\balcohols?\b/i },
  { id: 'carbonyl', term: 'carbonyl group', gloss: 'a carbon double-bonded to oxygen, C=O', quest: 'q4-groups', stage: 4, re: /\bcarbonyl\b/i },
  { id: 'carboxylic-acid', term: 'carboxylic acid', gloss: 'a molecule with a –COOH group, which releases a proton (H⁺) to water', quest: 'q4-groups', stage: 5, re: /\bcarboxylic acids?\b/i },
  { id: 'amine', term: 'amine', gloss: 'a carbon chain bonded to a nitrogen whose lone pair pulls a proton from water', quest: 'q4-groups', stage: 7, re: /\bamines?\b/i },
  // q5-reactions
  { id: 'substitution', term: 'substitution reaction', gloss: 'a reaction where one group bonds to a carbon and pushes another group out', quest: 'q5-reactions', stage: 2, re: /\bsubstitution\b/i },
  { id: 'ester', term: 'ester', gloss: 'the molecule formed when a carboxylic acid and an alcohol join through a C–O link', quest: 'q5-reactions', stage: 5, re: /\besters?\b/i },
  { id: 'condensation', term: 'condensation reaction', gloss: 'a reaction that joins two molecules while releasing a small molecule, usually water', quest: 'q5-reactions', stage: 5, re: /\bcondensation\b/i },
  { id: 'hydrolysis', term: 'hydrolysis', gloss: 'breaking a chemical link by adding water (or hydroxide) back across it', quest: 'q5-reactions', stage: 6, re: /\bhydrolysis\b/i },
  // q6-polymers
  { id: 'monomer', term: 'monomer', gloss: 'a small molecule that links repeatedly with others to build a chain', quest: 'q6-polymers', stage: 2, re: /\bmonomers?\b/i },
  { id: 'polymer', term: 'polymer', gloss: 'a long molecule built from many monomers linked end to end', quest: 'q6-polymers', stage: 2, re: /\bpolymers?\b/i },
  { id: 'addition-polymer', term: 'addition polymer', gloss: 'a polymer built by opening monomers\' double bonds so they link with nothing left over', quest: 'q6-polymers', stage: 2, re: /\baddition polymers?\b/i },
  { id: 'condensation-polymer', term: 'condensation polymer', gloss: 'a polymer built by linking monomers while releasing a small molecule, usually water, at each link', quest: 'q6-polymers', stage: 5, re: /\bcondensation polymers?\b/i },
  { id: 'amino-acid', term: 'amino acid', gloss: 'a molecule with an amine group at one end and a carboxylic acid group at the other', quest: 'q6-polymers', stage: 7, re: /\bamino acids?\b/i },
  { id: 'amide-link', term: 'amide link', gloss: 'the C–N bond formed when an amine group joins a carboxylic acid group and releases water', quest: 'q6-polymers', stage: 7, re: /\bamide links?\b/i },
  { id: 'protein', term: 'protein', gloss: 'a long chain of amino acids joined by amide links', quest: 'q6-polymers', stage: 7, re: /\bproteins?\b/i }
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
