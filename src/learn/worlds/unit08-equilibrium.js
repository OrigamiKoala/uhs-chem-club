/**
 * unit08-equilibrium.js — Learn world 8: Equilibrium.
 *
 * Teeter. Eight benches on the pans kit (`table/kits/pans.js`) and the Tipper, a boss at the salt pans:
 *   1. q1-both       — Running Both Ways (CED 7.1, 7.2, 7.8)
 *   2. q2-k          — The Number That Holds (CED 7.3 to 7.5)
 *   3. q3-q          — Which Way It Goes (CED 7.2, 7.3, 7.7)
 *   4. q4-properties — Combining K (CED 7.6)
 *   5. q5-ice        — Equilibrium Concentrations (CED 7.7)
 *   6. q6-lean       — Le Chatelier's Principle (CED 7.9, 7.10)
 *   7. q7-dissolve   — Solubility Equilibria (CED 7.11, 7.12)
 *   8. q8-free       — Free Energy and K (CED 9.5, 9.7)
 *   9. boss-tipper   — The Tipper
 * Spec and build record: docs/plans/teeter-world.md.
 */

export const UNIT_08 = {
  id: 'unit08',
  order: 8,
  code: '08',
  unit: 'Unit 8',
  world: 'Teeter',
  place: 'Salt pans',
  title: 'Equilibrium',
  line: 'Dynamic equilibrium, equilibrium constants, Le Chatelier’s principle, solubility and free energy.',
  brief: 'Reversible reactions settle at a fixed ratio that depends on the reaction and the temperature. In Teeter, run salt pans from either end, find the equilibrium constant, predict which way a mixture moves, and push a settled pan to see how it answers.',

  quests: [
    {
      id: 'q1-both',
      title: 'Running Both Ways',
      line: 'A pan stops changing; find out whether its particles do.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit08/q1-both.js')
    },
    {
      id: 'q2-k',
      title: 'The Number That Holds',
      line: 'Pans that begin differently settle at different amounts; find what they share.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit08/q2-k.js')
    },
    {
      id: 'q3-q',
      title: 'Which Way It Goes',
      line: 'A pan is mixed to a recipe; say which way it will move before it does.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit08/q3-q.js')
    },
    {
      id: 'q4-properties',
      title: 'Combining K',
      line: 'Rewrite a reaction and its K changes by rule; find how.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit08/q4-properties.js')
    },
    {
      id: 'q5-ice',
      title: 'Equilibrium Concentrations',
      line: 'The ledger gives a pan\u2019s start and K; work out what is left.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit08/q5-ice.js')
    },
    {
      id: 'q6-lean',
      title: 'Le Chatelier\u2019s Principle',
      line: 'The Fifth added a drop to a settled vessel; see where the amounts go.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit08/q6-lean.js')
    },
    {
      id: 'q7-dissolve',
      title: 'Solubility Equilibria',
      line: 'Salt dissolves and comes back out; find how much a beaker can hold.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit08/q7-dissolve.js')
    },
    {
      id: 'q8-free',
      title: 'Free Energy and K',
      line: 'The lower the free energy, the more product a pan holds when it settles.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit08/q8-free.js')
    }
  ]
};
