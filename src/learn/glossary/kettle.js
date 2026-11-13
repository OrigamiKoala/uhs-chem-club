/**
 * glossary/kettle.js — the words of Kettle (Unit 07, stoichiometry and reactions): one term per concept, a one-clause gloss,
 * and the stage where it is first used (`quest`, `stage` 1-based). Prompts, hints, misses, rewards, captions, the Tour and
 * the bank use these terms and no synonym of them. `re` finds the term in play text; `BANNED` lists the vague words and
 * stand-in names that must not stand in for one (`verify:teaching:kettle`). `recap` marks a term from an earlier world,
 * re-glossed because nothing guarantees that world was played.
 */

export const QUESTS = ['q2-names', 'q3-change', 'q4-balance', 'q5-ionic', 'q6-stoich', 'q7-titrate', 'q8-kinds', 'q9-hsab', 'boss-golem'];

export const TERMS = [
  { id: 'ionic-compound', term: 'ionic compound', gloss: 'a compound made of positive and negative ions held together, with no net charge', quest: 'q2-names', stage: 1, re: /\bionic compounds?\b/i },
  { id: 'charge-meter', term: 'charge meter', gloss: 'an instrument that adds up the charges of the ions in the tray', quest: 'q2-names', stage: 2, re: /\bcharge meters?\b/i },
  { id: 'roman-numeral', term: 'Roman numeral', gloss: 'the number in brackets after a metal\'s name that gives the charge of one metal ion', quest: 'q2-names', stage: 4, re: /\bRoman numerals?\b/i },
  { id: 'polyatomic-ion', term: 'polyatomic ion', gloss: 'a group of atoms that stays together and carries one charge', quest: 'q2-names', stage: 5, re: /\bpolyatomic ions?\b/i },

  { id: 'physical-change', term: 'physical change', gloss: 'a change in which the substance is the same afterwards', quest: 'q3-change', stage: 1, re: /\bphysical changes?\b/i },
  { id: 'chemical-change', term: 'chemical change', gloss: 'a change in which a new substance forms', quest: 'q3-change', stage: 1, re: /\bchemical changes?\b/i },
  { id: 'conservation-of-mass', term: 'conservation of mass', gloss: 'mass is neither created nor destroyed when nothing enters or leaves', quest: 'q3-change', stage: 6, re: /\bconservation of mass\b|\bmass is conserved\b/i },

  { id: 'chemical-equation', term: 'chemical equation', gloss: 'a written record of a chemical change, with reactants before the arrow and products after it', quest: 'q4-balance', stage: 1, re: /\bchemical equations?\b/i },
  { id: 'reactant', term: 'reactant', gloss: 'a starting substance before the arrow in a chemical equation', quest: 'q4-balance', stage: 1, re: /\breactants?\b/i },
  { id: 'product', term: 'product', gloss: 'a substance formed in a reaction, written after the arrow', quest: 'q4-balance', stage: 1, re: /\bproducts?\b/i },
  { id: 'coefficient', term: 'coefficient', gloss: 'the number in front of a formula that counts molecules or formula units', quest: 'q4-balance', stage: 3, re: /\bcoefficients?\b/i },
  { id: 'subscript', term: 'subscript', gloss: 'the small number inside a formula that says how many atoms of that element are in one unit', quest: 'q4-balance', stage: 3, re: /\bsubscripts?\b/i },
  { id: 'state-symbol', term: 'state symbol', gloss: 'a letter in brackets — (s), (l), (g) or (aq) — showing solid, liquid, gas or dissolved in water', quest: 'q4-balance', stage: 5, re: /\bstate symbols?\b/i },

  { id: 'solution', term: 'solution', gloss: 'a mixture of one substance dissolved evenly in another, usually water', quest: 'q5-ionic', stage: 1, re: /\bsolutions?\b/i },
  { id: 'precipitate', term: 'precipitate', gloss: 'a solid that forms when two solutions are mixed', quest: 'q5-ionic', stage: 1, re: /\bprecipitates?\b/i },
  { id: 'spectator-ion', term: 'spectator ion', gloss: 'an ion that stays dissolved and unchanged during a reaction', quest: 'q5-ionic', stage: 3, re: /\bspectator ions?\b|\bspectators\b/i },
  { id: 'net-ionic-equation', term: 'net ionic equation', gloss: 'an equation showing only the ions that reacted and the product they formed', quest: 'q5-ionic', stage: 4, re: /\bnet ionic equations?\b/i },
  { id: 'solubility-rules', term: 'solubility rules', gloss: 'patterns saying which pairs of ions stay dissolved and which form a solid', quest: 'q5-ionic', stage: 6, re: /\bsolubility rules\b/i },
  { id: 'complete-ionic-equation', term: 'complete ionic equation', gloss: 'an equation showing every dissolved ion on both sides and any solid as one formula', quest: 'q5-ionic', stage: 8, re: /\bcomplete ionic equations?\b/i },

  { id: 'mole', term: 'mole (mol)', gloss: 'a fixed number of particles, 6.02 × 10²³ of them', quest: 'q6-stoich', stage: 3, recap: 'Tallow', re: /\bmoles?\b|\bmol\b/i },
  { id: 'mole-ratio', term: 'mole ratio', gloss: 'the ratio of moles in which substances react, given by the coefficients of a balanced equation', quest: 'q6-stoich', stage: 3, re: /\bmole ratios?\b/i },
  { id: 'limiting-reactant', term: 'limiting reactant', gloss: 'the reactant that runs out first and stops the reaction', quest: 'q6-stoich', stage: 5, re: /\blimiting reactants?\b/i },
  { id: 'excess', term: 'excess', gloss: 'what is left over of a reactant after the limiting reactant runs out', quest: 'q6-stoich', stage: 5, re: /\bexcess\b/i },
  { id: 'theoretical-yield', term: 'theoretical yield', gloss: 'the most product a balanced equation allows from the reactants used', quest: 'q6-stoich', stage: 8, re: /\btheoretical yield\b/i },
  { id: 'percent-yield', term: 'percent yield', gloss: 'the mass actually made divided by the theoretical yield, times 100', quest: 'q6-stoich', stage: 8, re: /\bpercent yield\b/i },

  { id: 'concentration', term: 'concentration (mol/L)', gloss: 'how many moles of solute are dissolved in each litre of solution', quest: 'q7-titrate', stage: 1, recap: 'Mirrowen', re: /\bconcentrations?\b|\bconcentrated\b/i },
  { id: 'titration', term: 'titration', gloss: 'adding a measured volume of one solution to another until they have exactly reacted', quest: 'q7-titrate', stage: 2, re: /\btitrations?\b/i },
  { id: 'burette', term: 'burette', gloss: 'a tall glass tube marked in millilitres for adding a measured volume of solution', quest: 'q7-titrate', stage: 2, re: /\bburettes?\b/i },
  { id: 'indicator', term: 'indicator', gloss: 'a dye that changes colour when a reaction reaches a certain point', quest: 'q7-titrate', stage: 2, re: /\bindicators?\b/i },
  { id: 'equivalence-point', term: 'equivalence point', gloss: 'the point in a titration where the moles of base added have exactly used up the acid', quest: 'q7-titrate', stage: 3, re: /\bequivalence point\b/i },
  { id: 'endpoint', term: 'endpoint', gloss: 'the point in a titration where the indicator changes colour', quest: 'q7-titrate', stage: 6, re: /\bendpoint\b/i },

  { id: 'synthesis', term: 'synthesis', gloss: 'a reaction in which two or more substances join into one', quest: 'q8-kinds', stage: 1, re: /\bsynthesis\b/i },
  { id: 'decomposition', term: 'decomposition', gloss: 'a reaction in which one substance breaks into two or more', quest: 'q8-kinds', stage: 1, re: /\bdecomposition\b/i },
  { id: 'combustion', term: 'combustion', gloss: 'burning a fuel in oxygen to make carbon dioxide and water', quest: 'q8-kinds', stage: 3, re: /\bcombustion\b/i },
  { id: 'acid', term: 'acid', gloss: 'a substance that passes a proton (H⁺) to another molecule', quest: 'q8-kinds', stage: 4, re: /\bacids?\b/i },
  { id: 'base', term: 'base', gloss: 'a substance that takes a proton (H⁺) from an acid', quest: 'q8-kinds', stage: 4, re: /\bbases?\b/i },
  { id: 'oxidation', term: 'oxidation', gloss: 'losing electrons (a rise in oxidation number)', quest: 'q8-kinds', stage: 5, re: /\boxidation\b(?! number)/i },
  { id: 'reduction', term: 'reduction', gloss: 'gaining electrons (a fall in oxidation number)', quest: 'q8-kinds', stage: 5, re: /\breduction\b/i },
  { id: 'redox-reaction', term: 'redox reaction', gloss: 'a reaction in which electrons move from one species to another', quest: 'q8-kinds', stage: 5, re: /\bredox\b/i },
  { id: 'oxidation-number', term: 'oxidation number', gloss: 'the charge an atom would have if every shared electron went to the atom that pulls harder', quest: 'q8-kinds', stage: 6, re: /\boxidation numbers?\b/i },

  { id: 'electron-cloud', term: 'electron cloud', gloss: 'the region around a nucleus where an ion\'s electrons sit', quest: 'q9-hsab', stage: 1, re: /\belectron clouds?\b/i },
  { id: 'hard-ion', term: 'hard ion', gloss: 'a small, often highly charged ion whose electron cloud keeps its shape near another charge', quest: 'q9-hsab', stage: 1, re: /\bhard ions?\b/i },
  { id: 'soft-ion', term: 'soft ion', gloss: 'a large ion, or one with many outer electrons, whose electron cloud is easily pulled out of shape', quest: 'q9-hsab', stage: 1, re: /\bsoft ions?\b/i }
];

/** Words that are not glossary terms and must not stand in for one inside Kettle's play text (the Golem and the story keep their fiction). */
export const BANNED = [
  { re: /\bpots?\b/i, use: 'vessel', why: 'stand-in name' },
  { re: /\bwindows?\b/i, use: 'particle view', why: 'stand-in name' },
  { re: /\bheaps?\b/i, use: 'supply', why: 'stand-in name' },
  { re: /\brecipes?\b/i, use: 'formula, equation or ratio', why: 'stand-in name' },
  { re: /\b(chips?|pucks?|discs?)\b/i, use: 'ions, molecules, cards or circles', why: 'stand-in name' },
  { re: /\bneedles?\b/i, use: 'charge meter', why: 'stand-in name' },
  { re: /\blamps?\b/i, use: 'signs', why: 'stand-in name' },
  { re: /\bweights?\b|\bweighs\b/i, use: 'mass or has a mass of', why: 'vague word' },
  { re: /\b(firmness|squishy|rigid|prefers?)\b/i, use: 'hard/soft electron cloud', why: 'stand-in or motive word' }
];

export const STORY_ALLOW = ['pot', 'recipe', 'heap'];

/** What each stage assumes the student can do, and the primer (`engine/primers.js`) offered by the Primer key on that stage. */
export const NEEDS = {
  'q6-stoich:3': ['amount'],
  'q6-stoich:4': ['amount', 'ratio'],
  'q6-stoich:6': ['amount', 'ratio'],
  'q6-stoich:7': ['amount', 'ratio'],
  'q6-stoich:8': ['ratio'],
  'q7-titrate:1': ['ratio'],
  'q7-titrate:4': ['amount', 'ratio'],
  'q7-titrate:5': ['amount', 'ratio']
};
