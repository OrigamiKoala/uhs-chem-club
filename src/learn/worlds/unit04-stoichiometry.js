/**
 * unit04-stoichiometry.js — Learn world 4: Stoichiometry and Reactions.
 *
 * CHART ONLY. See unit01-atoms.js for how a quest is built and flipped live.
 */

export const UNIT_04 = {
  id: 'unit04',
  order: 4,
  code: '04',
  unit: 'Unit 4',
  world: 'Kettle',
  place: 'Soda lake',
  title: 'Stoichiometry and Reactions',
  line: 'Nothing is lost in the pot.',
  brief: 'Kettle is one shallow lake that has been boiling for as long as anyone has records of. Whatever goes into it comes back out, rearranged and counted to the last piece.',

  quests: [
    {
      id: 'q1-ledger',
      title: 'The Ledger Balances',
      line: 'Count what went in. It is all still there.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q2-ratios',
      title: 'Two Bolts Per Bracket',
      line: 'The recipe fixes how much of each you need.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q3-shortfall',
      title: 'What Runs Out First',
      line: 'The smallest pile decides the size of the batch.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q4-kinds',
      title: 'Kinds of Change',
      line: 'Swap, split, join, or burn.',
      arena: 'chamber',
      stageCount: 8,
      status: 'draft',
      module: null
    }
  ]
};
