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
  beyondAp: true,
  line: 'Carbon chains, double bonds, isomers, functional groups, reactions, and polymers.',
  brief: 'Build carbon chains and rings, follow electron pairs to see where molecules react, tell isomers apart, and break polymer chains at their weak links.',

  quests: [
    { id: 'q1-chains', title: 'Alkanes', line: 'The black swamp tar is made of carbon-and-hydrogen chains.', arena: 'bench', stageCount: 8, status: 'live', module: () => import('../quests/unit13/q1-chains.js') },
    { id: 'q2-unsat', title: 'Alkenes and Alkynes', line: 'Heating the tar creates double bonds that react.', arena: 'bench', stageCount: 8, status: 'live', module: () => import('../quests/unit13/q2-unsat.js') },
    { id: 'q3-isomers', title: 'Isomers', line: 'Two drums share one formula yet behave differently.', arena: 'bench', stageCount: 8, status: 'live', module: () => import('../quests/unit13/q3-isomers.js') },
    { id: 'q4-groups', title: 'Functional Groups', line: 'One clear liquid from the plant is eating through its steel drum.', arena: 'bench', stageCount: 8, status: 'live', module: () => import('../quests/unit13/q4-groups.js') },
    { id: 'q5-reactions', title: 'Organic Reactions', line: 'Two liquids join into the chemical links of the armor.', arena: 'bench', stageCount: 8, status: 'live', module: () => import('../quests/unit13/q5-reactions.js') },
    { id: 'q6-polymers', title: 'Polymers', line: 'The armor plates are long chains built from one repeating molecule.', arena: 'bench', stageCount: 8, status: 'live', module: () => import('../quests/unit13/q6-polymers.js') },
    { id: 'boss-carapace', title: 'The Carapace', line: 'Break through the Fifth\'s armored gate.', arena: 'boss', stageCount: 5, status: 'live', module: () => import('../quests/unit13/boss-carapace.js') }
  ]
};
