/**
 * unit07-stoichiometry.js — Learn world 7: Stoichiometry and Reactions.
 *
 * See unit01-atoms.js for how a quest is built and flipped live.
 *
 * THE FIRST BENCH CAME FROM LIGAR. `q1-recipe` (fixed composition, percent
 * composition, empirical formula) was built as Ligar's bench three and moved here
 * when the road was reordered. Ligar's bench four, the mole, went on to Tallow
 * (`unit01/q6-weigh`), because the worlds between Ligar and Kettle need it.
 */

export const UNIT_07 = {
  id: 'unit07',
  order: 7,
  code: '07',
  unit: 'Unit 7',
  world: 'Kettle',
  place: 'Soda lake',
  title: 'Stoichiometry and Reactions',
  line: 'Nothing is lost in the pot.',
  brief: 'Kettle is one shallow lake that has been boiling for as long as anyone has records of. Whatever goes into it comes back out, rearranged and counted to the last piece.',

  quests: [
    {
      id: 'q1-recipe',
      title: 'The Same Recipe',
      line: 'Definite proportions and percent composition in compounds.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit07/q1-recipe.js')
    },
    {
      id: 'q2-ledger',
      title: 'The Ledger Balances',
      line: 'Count what went in. It is all still there.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q3-ratios',
      title: 'Two Bolts Per Bracket',
      line: 'The recipe fixes how much of each you need.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q4-shortfall',
      title: 'What Runs Out First',
      line: 'The smallest pile decides the size of the batch.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q5-kinds',
      title: 'Kinds of Change',
      line: 'Swap, split, join, or burn.',
      arena: 'chamber',
      stageCount: 8,
      status: 'draft',
      module: null
    }
  ]
};
