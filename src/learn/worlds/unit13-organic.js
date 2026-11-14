/**
 * unit13-organic.js — Learn world 13: Thornmere (organic chemistry). Spec and build record: `docs/plans/thornmere-world.md`.
 */

export const UNIT_13 = {
  id: 'unit13',
  order: 13,
  code: '13',
  unit: 'Unit 13',
  world: 'Thornmere',
  place: 'Tar swamps',
  title: 'Organic Chemistry',
  line: 'Carbon chains, double bonds, isomers, functional groups, reactions and polymers.',
  brief: 'Build carbon chains and rings, find where a molecule reacts by following its electron pairs, tell isomers apart, and take a polymer chain apart at its links.',

  quests: [
    { id: 'q1-chains', title: 'Carbon Chains', line: 'The tar under the swamp is chains of carbon.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q2-unsat', title: 'Double Bonds', line: 'The still changes the tar into something that reacts.', arena: 'bench', stageCount: 8, status: 'live', module: () => import('../quests/unit13/q2-unsat.js') },
    { id: 'q3-isomers', title: 'Isomers', line: 'Two drums carry one formula and behave differently.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q4-groups', title: 'Functional Groups', line: 'One of the still\'s clear liquids is eating its drum.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q5-reactions', title: 'Making and Breaking', line: 'Two liquids are joined into the links of the armour.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q6-polymers', title: 'Long Chains', line: 'The fortress plates are one molecule repeated.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'boss-carapace', title: 'The Carapace', line: 'Open the Fifth\'s armoured gate.', arena: 'boss', stageCount: 5, status: 'draft', module: null }
  ]
};
