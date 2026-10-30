/**
 * unit06-states-of-matter.js — Learn world 6: States of Matter.
 *
 * Mirrowen. Seven benches on the matter kit (`table/kits/matter.js`, which extends the heat kit) and The Undertow, a boss encounter:
 *   1. q1-states    — Three States (CED 3.3)
 *   2. q2-grip      — The Grip Between (CED 3.1)
 *   3. q3-boil      — Liquids and Vapour (CED 3.1, 3.2)
 *   4. q4-solids    — Kinds of Solid (CED 3.2, 3.3)
 *   5. q5-crossing  — The Crossing (CED 6.5)
 *   6. q6-solution  — Taken Into Solution (CED 3.7, 3.8, 3.10, 6.1, 6.4)
 *   7. q7-separate  — Pulling Apart (CED 3.9)
 *   8. boss-undertow — The Undertow (CED 3.1, 3.3, 3.10, 6.5)
 *
 * The spec and the build record are `docs/plans/mirrowen-world.md`.
 */

export const UNIT_06 = {
  id: 'unit06',
  order: 6,
  code: '06',
  unit: 'Unit 6',
  world: 'Mirrowen',
  place: 'Tidal shelf',
  title: 'States of Matter',
  line: 'Same stuff, three tempers.',
  brief: 'Mirrowen has a tide that comes in as ice and leaves as steam. Nothing on the shelf changes what it is made of, only how tightly it is holding on.',

  quests: [
    {
      id: 'q1-states',
      title: 'Three States',
      line: 'Solid, liquid or gas: what the molecules are doing, and what they are not.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit06/q1-states.js')
    },
    {
      id: 'q2-grip',
      title: 'The Grip Between',
      line: 'What one molecule does to the molecule beside it.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit06/q2-grip.js')
    },
    {
      id: 'q3-boil',
      title: 'Liquids and Vapour',
      line: 'A sealed flask rises to a pressure and stops. Find out why, and when it boils.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit06/q3-boil.js')
    },
    {
      id: 'q4-solids',
      title: 'Kinds of Solid',
      line: 'Glass shatters and quartz does not. Same silicon, different order.',
      arena: 'bench',
      stageCount: 6,
      status: 'live',
      module: () => import('../quests/unit06/q4-solids.js')
    },
    {
      id: 'q5-crossing',
      title: 'The Crossing',
      line: 'Pour heat in and the temperature stops moving. Find out where it went.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit06/q5-crossing.js')
    },
    {
      id: 'q6-solution',
      title: 'Taken Into Solution',
      line: 'A solid goes missing and is still in the jar.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit06/q6-solution.js')
    },
    {
      id: 'q7-separate',
      title: 'Pulling Apart',
      line: 'Get one thing out of another without changing either.',
      arena: 'bench',
      stageCount: 7,
      status: 'live',
      module: () => import('../quests/unit06/q7-separate.js')
    },
    {
      id: 'boss-undertow',
      title: 'The Undertow',
      line: 'A brine crawler drags the harbour toward the freeze.',
      arena: 'boss',
      stageCount: 5,
      status: 'draft',
      module: null
    }
  ]
};
