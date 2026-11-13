/**
 * Unit 11 · Bench 6 — Catalysts (q6-shortcut)
 *
 * CED 5.11 (Catalysis).
 * Five stages teaching alternate lower-Ea pathway, catalyst regeneration,
 * unchanged ΔH, catalyst vs intermediate in a mechanism, and surface catalysis.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import {
  rateTable,
  rateLeadFixture,
  kvesselFixture,
  kprofileFixture,
  collviewFixture,
  plaqueFixture,
  stmt
} from '../../table/kits/rate.js';

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\bcatalyst\b/i, introducedAt: 1 },
  { term: /\badsorb\b/i, introducedAt: 5 }
];

const SPEAKER = 'Vess';

const widget = {
  type: 'table',
  inspect() { return []; }
};

function toolNoteFor() {
  return '';
}

const DEBRIEF = {
  title: 'Bench 6 cleared',
  body: 'A catalyst provides an alternate mechanism with a lower activation energy without being consumed or changing ΔH.',
  filed: 'Filed: the powder in the vent is a catalyst that opens a lower-Ea path and stays intact after every cycle.'
};

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-lead',
    title: 'The Shortcut Path',
    briefing: {
      speaker: SPEAKER,
      body: 'Compare the uncatalysed path and the catalysed path on the bench.'
    },
    prompt: 'How does the catalyst speed up the reaction?',
    widget,
    table: rateTable({
      pieces: [
        stmt('shortcut', 'Opens a lower-Ea path', { x: 112, y: 9 }),
        stmt('usedUp', 'Burns as extra fuel', { x: 112, y: 24 }),
        stmt('warms', 'Heats up the reactants', { x: 112, y: 39 })
      ],
      fixtures: [
        rateLeadFixture('lead', { x: 46, y: 28 }, {
          scene: 'catalyst',
          title: 'Uncatalysed vs catalysed',
          w: 78,
          h: 44
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'How it works', at: { x: 112, y: 52 }, size: { w: 46, h: 8 } }]
      }
    }),
    hints: [
      'Watch the two paths on the left fixture: one climbs high, one takes a lower curve.',
      'Both paths start at the same reactants and end at the same products.',
      'A catalyst lowers the activation energy barrier by opening a different path.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "How it works".' };
      if (card.id === 'usedUp') return { ok: false, msg: 'A catalyst is not a reactant fuel; it is still there at the end.' };
      if (card.id === 'warms') return { ok: false, msg: 'Both paths run at the same temperature; the hill height itself is lower.' };
      return { ok: true };
    },
    reward: {
      log: 'A catalyst opens a lower-Ea alternate pathway.',
      title: 'Catalyst Pathway',
      body: 'A catalyst speeds a reaction by providing a different pathway with a lower activation energy.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-not-consumed',
    title: 'Still There at the End',
    prompt: 'What happens to the amount of catalyst by the end of the run?',
    widget,
    table: rateTable({
      pieces: [
        stmt('unchanged', 'Unchanged (6 before, 6 after)', { x: 116, y: 9 }),
        stmt('usedUp', 'Consumed with reactant', { x: 116, y: 24 }),
        stmt('doubled', 'Doubled as product forms', { x: 116, y: 39 })
      ],
      fixtures: [
        kvesselFixture('v1', { x: 28, y: 28 }, {
          title: 'No catalyst',
          order: 1,
          k: 0.03,
          a0: 1.0,
          tMax: 40,
          showCounts: true,
          catalystCount: 0,
          w: 44,
          h: 40
        }),
        kvesselFixture('v2', { x: 74, y: 28 }, {
          title: 'With 6 catalyst',
          order: 1,
          k: 0.12,
          a0: 1.0,
          tMax: 40,
          showCounts: true,
          catalystCount: 6,
          w: 44,
          h: 40
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Catalyst at end', at: { x: 116, y: 52 }, size: { w: 46, h: 8 } }]
      }
    }),
    hints: [
      'Run both vessels and watch the catalyst dots inside "With 6 catalyst".',
      'Count how many catalyst particles remain after the reactant drops.',
      'A catalyst participates in one step and is regenerated in a later step, so its total amount stays unchanged.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "Catalyst at end".' };
      if (card.id === 'usedUp') return { ok: false, msg: 'Count the catalyst particles in Vessel 2: all 6 are still present at 40 s.' };
      if (card.id === 'doubled') return { ok: false, msg: 'Catalyst particles are regenerated, not newly created.' };
      return { ok: true };
    },
    reward: {
      log: 'Catalyst amount is unchanged at the end of the reaction.',
      title: 'Regenerated, Not Consumed',
      body: 'Because the catalyst is regenerated at the end of each cycle, the same 6 particles remain when the run finishes.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-lower-barrier',
    title: 'What Changes on the Hill',
    prompt: 'Which part of the energy profile does the catalyst change?',
    widget,
    table: rateTable({
      fixtures: [
        kprofileFixture('prof', { x: 75, y: 28 }, {
          title: 'Uncatalysed vs catalysed (kJ/mol)',
          reactants: 40,
          ts: 110,
          catTs: 70,
          products: 15,
          tapZones: [
            { id: 'rp', label: 'Reactants level', x0: 0.0, x1: 0.22 },
            { id: 'cat', label: 'Activation barrier', x0: 0.34, x1: 0.58 },
            { id: 'end', label: 'Products / ΔH', x0: 0.78, x1: 1.0 }
          ],
          w: 104,
          h: 44
        })
      ]
    }),
    hints: [
      'Compare the solid curve and the dashed green catalysed curve.',
      'R stays at 40 and P stays at 15, so ΔH does not change.',
      'Tap the peak where the catalysed curve drops below the uncatalysed peak.'
    ],
    check(state) {
      const z = Math.round(state.table.fixtures.prof?.dials?.zone?.value ?? 4);
      if (z === 4) return { ok: false, notYet: true, msg: 'Tap the part of the energy profile that the catalyst changes.' };
      if (z === 1) return { ok: false, msg: 'The starting reactants level (R: 40) is identical with or without a catalyst.' };
      if (z === 3) return { ok: false, msg: 'The products level (P: 15) and ΔH are unchanged by a catalyst.' };
      return { ok: true };
    },
    reward: {
      log: 'A catalyst lowers Ea without changing R, P, or ΔH.',
      title: 'Lower Barrier, Same ΔH',
      body: 'The catalyst lowers the transition state barrier from 110 to 70 kJ/mol while leaving reactants, products, and ΔH unchanged.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-catalyst-in-steps',
    title: 'Catalyst vs Intermediate',
    prompt: 'Which species is the catalyst in this two-step mechanism?',
    widget,
    table: rateTable({
      pieces: [
        stmt('Cl', 'Cl (used in 1, returned in 2)', { x: 112, y: 9 }),
        stmt('ClO', 'ClO (made in 1, used in 2)', { x: 112, y: 24 }),
        stmt('O3', 'O₃ (starting reactant)', { x: 112, y: 39 })
      ],
      fixtures: [
        plaqueFixture('mech', 'Ozone breakdown', { x: 46, y: 28 }, [
          'Step 1: Cl + O₃ → ClO + O₂',
          'Step 2: ClO + O → Cl + O₂',
          'Overall: O₃ + O → 2 O₂'
        ], { w: 78 })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Catalyst', at: { x: 112, y: 52 }, size: { w: 46, h: 8 } }]
      }
    }),
    hints: [
      'A catalyst is present at the start, consumed in an early step, and regenerated in a later step.',
      'An intermediate (like ClO) is made first and used up later; a catalyst is used first and returned later.',
      'Find the species on the left of Step 1 that reappears on the right of Step 2.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "Catalyst".' };
      if (card.id === 'ClO') return { ok: false, msg: 'ClO is made in Step 1 and used in Step 2 — that is an intermediate, not a catalyst.' };
      if (card.id === 'O3') return { ok: false, msg: 'O₃ is consumed permanently to form O₂.' };
      return { ok: true };
    },
    reward: {
      log: 'Cl is the catalyst; ClO is the intermediate.',
      title: 'Spotting the Catalyst',
      body: 'Cl enters Step 1 and is regenerated in Step 2, whereas intermediate ClO is created in Step 1 and destroyed in Step 2.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-surface',
    title: 'On the Solid Surface',
    prompt: 'Where do gas molecules adsorb and react on a solid catalyst?',
    widget,
    table: rateTable({
      fixtures: [
        collviewFixture('view', { x: 75, y: 28 }, {
          title: 'Solid catalyst',
          mode: 'surface',
          tapZones: [
            { id: 'gas', label: 'Gas above', y0: 0.0, y1: 0.45 },
            { id: 'surf', label: 'Catalyst surface', y0: 0.48, y1: 0.72 },
            { id: 'bulk', label: 'Deep inside solid', y0: 0.75, y1: 1.0 }
          ],
          w: 96,
          h: 44
        })
      ]
    }),
    hints: [
      'Press Play on the Solid catalyst view and watch where the gas molecule lands and stretches.',
      'Gas molecules cannot reach deep inside the solid metal lattice.',
      'Tap the exposed top layer where the gas molecule lands.'
    ],
    check(state) {
      const z = Math.round(state.table.fixtures.view?.dials?.zone?.value ?? 4);
      if (z === 4) return { ok: false, notYet: true, msg: 'Tap the region where the gas molecule lands and reacts.' };
      if (z === 1) return { ok: false, msg: 'In the gas phase above, the bond stays intact until it reaches the metal.' };
      if (z === 3) return { ok: false, msg: 'Deep inside the solid metal is blocked off from the gas.' };
      return { ok: true };
    },
    reward: {
      log: 'Gas molecules adsorb onto the solid catalyst surface.',
      title: 'Surface Catalysis',
      body: 'Reactants adsorb onto the exposed catalyst surface, weakening their bonds so new products form and leave.'
    }
  }
];

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const runFx = fixture => ({ run: { fixture } });

export const SOLUTIONS = [
  [put('shortcut', 'slot:ans')],
  [runFx('v1'), runFx('v2'), put('unchanged', 'slot:ans')],
  [dial('prof', 'zone', 2)],
  [put('Cl', 'slot:ans')],
  [runFx('view'), dial('view', 'zone', 2)]
];

export const MISSES = [
  [put('usedUp', 'slot:ans')],
  [put('usedUp', 'slot:ans')],
  [dial('prof', 'zone', 3)],
  [put('ClO', 'slot:ans')],
  [dial('view', 'zone', 3)]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() {}
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}
