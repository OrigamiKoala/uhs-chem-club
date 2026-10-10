/**
 * unit13-organic.js — Learn world 13: Organic Chemistry.
 *
 * CHART ONLY. Placeholder quests; not yet planned in detail.
 * See unit01-atoms.js for how a quest is built and flipped live.
 */

export const UNIT_13 = {
  id: 'unit13',
  order: 13,
  code: '13',
  unit: 'Unit 13',
  world: 'Thornmere',
  place: 'Fen forest',
  title: 'Organic Chemistry',
  line: 'Carbon chains, functional groups, and isomers.',
  brief: 'Build molecules on carbon backbones, name them, and see how a small group of atoms decides how a whole molecule behaves.',

  quests: [
    { id: 'q1-chains', title: 'Carbon Chains', line: 'Hydrocarbons and how they are named.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q2-isomers', title: 'Isomers', line: 'Same atoms, different molecules.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q3-groups', title: 'Functional Groups', line: 'The small parts that decide behaviour.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q4-reactions', title: 'Organic Reactions', line: 'Adding, swapping, and joining.', arena: 'chamber', stageCount: 8, status: 'draft', module: null }
  ]
};
