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
  place: 'Foundry works',
  title: 'Stoichiometry and Reactions',
  line: 'Nothing is lost in the furnace.',
  brief: 'Kettle is an automated foundry works on a dry soda flat. Ore goes into the furnace, metal and slag come out, and every ton has to be accounted for.',

  quests: [
    {
      id: 'q1-recipe',
      title: 'The Same Recipe',
      line: "Read each molecule's fixed recipe by weight.",
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit07/q1-recipe.js')
    },
    {
      id: 'q2-names',
      title: 'Names and Formulas',
      line: "Read the labels on the foundry's crates.",
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit07/q2-names.js')
    },
    {
      id: 'q3-change',
      title: 'Physical or Chemical',
      line: "Does the ore turn into something new?",
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit07/q3-change.js')
    },
    {
      id: 'q4-balance',
      title: 'Balancing Equations',
      line: "Count the atoms on both sides of the furnace recipe.",
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit07/q4-balance.js')
    },
    {
      id: 'q5-ionic',
      title: 'Net Ionic Equations',
      line: "Find which ions in the cloudy pond reacted.",
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit07/q5-ionic.js')
    },
    {
      id: 'q6-stoich',
      title: 'How Much Is Made',
      line: 'Forty tons of ore: how much iron can it give?',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit07/q6-stoich.js')
    },
    {
      id: 'q7-titrate',
      title: 'Titration',
      line: "Count the acid in the pickling tank.",
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit07/q7-titrate.js')
    },
    {
      id: 'q8-kinds',
      title: 'Kinds of Reaction',
      line: "Say what each reaction on the furnace log is doing.",
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'boss-golem',
      title: 'Recipe Golem',
      line: 'Starve the foundry golem and weigh its recipe.',
      arena: 'boss',
      stageCount: 3,
      status: 'live',
      module: () => import('../quests/unit07/boss-golem.js')
    }
  ]
};
