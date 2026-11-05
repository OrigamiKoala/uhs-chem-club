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
    }
  ]
};
