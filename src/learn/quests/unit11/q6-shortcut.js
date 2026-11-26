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
import { remember } from '../../engine/predict.js';
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
  body: 'A catalyst opens a new pathway with a lower activation energy. It comes out unchanged and does not change ΔH.',
  filed: 'Filed: the vent powder is a catalyst that lowers the activation barrier and comes back unchanged after every cycle.'
};

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-lead',
    title: 'The Shortcut Path',
    predict: true,
    briefing: {
      speaker: SPEAKER,
      body: 'Reactants are the starting substances. An added substance like this yellow dust that speeds up a reaction is called a catalyst.'
    },
    prompt: 'What is the yellow dust doing to speed up the burn?',
    widget,
    table: rateTable({
      pieces: [
        stmt('shortcut', 'It lowers the energy hill', { x: 114, y: 10 }),
        stmt('usedUp', 'It adds energy to the reactants', { x: 114, y: 24 }),
        stmt('warms', 'It makes the products lower in energy', { x: 114, y: 38 })
      ],
      fixtures: [
        rateLeadFixture('lead', { x: 44, y: 28 }, {
          scene: 'catalyst',
          title: 'No dust vs yellow dust',
          w: 74,
          h: 40
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'How it works', at: { x: 114, y: 52 }, size: { w: 46, h: 12 } }]
      }
    }),
    hints: [
      'Compare the two vessels in the preview; the yellow rings are the added dust.',
      'Notice whether the yellow rings get used up while blue product forms faster.',
      'Think about what slows a reaction down and how a shortcut could make it easier to cross.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place one prediction card in "How it works".' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (card) remember('unit11/q6-shortcut', card.id);
    },
    reward: {
      log: 'Prediction locked for the catalyst tests.',
      title: 'Prediction Locked',
      body: 'Prediction locked. The next stages test what a catalyst changes and what it leaves alone.'
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
        stmt('unchanged', 'Unchanged', { x: 120, y: 10 }),
        stmt('usedUp', 'Used up', { x: 120, y: 24 }),
        stmt('doubled', 'Doubled', { x: 120, y: 38 })
      ],
      fixtures: [
        kvesselFixture('v1', { x: 26, y: 28 }, {
          title: 'No catalyst',
          order: 1,
          k: 0.03,
          a0: 1.0,
          tMax: 40,
          showCounts: true,
          catalystCount: 0,
          w: 42,
          h: 42
        }),
        kvesselFixture('v2', { x: 71, y: 28 }, {
          title: 'With 6 catalyst',
          order: 1,
          k: 0.12,
          a0: 1.0,
          tMax: 40,
          showCounts: true,
          catalystCount: 6,
          w: 42,
          h: 42
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Catalyst at end', at: { x: 120, y: 52 }, size: { w: 44, h: 12 } }]
      }
    }),
    hints: [
      'Press "Run" on both vessels and watch the Catalyst counter under "With 6 catalyst".',
      'Compare the Catalyst counter at the start and at the end of the run.',
      'Watch whether any catalyst rings permanently disappear during the run.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "Catalyst at end".' };
      if (card.id === 'usedUp') return { ok: false, msg: 'Check the Catalyst counter under Vessel 2 at the start and at the end.' };
      if (card.id === 'doubled') return { ok: false, msg: 'Catalyst particles are given back unchanged, not newly created.' };
      return { ok: true };
    },
    reward: {
      log: 'Catalyst amount is unchanged at the end of the reaction.',
      title: 'Regenerated, Not Consumed',
      body: 'The catalyst participates in a step and comes right back out, so all 6 particles remain when the run finishes.'
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
          noProgress: true,
          tapZones: [
            { id: 'rp', label: 'Reactants level', x0: 0.0, x1: 0.26 },
            { id: 'cat', label: 'Activation barrier', x0: 0.30, x1: 0.66 },
            { id: 'end', label: 'Products level', x0: 0.72, x1: 1.0 }
          ],
          w: 104,
          h: 44
        })
      ]
    }),
    hints: [
      'Compare the solid curve with the dashed green catalysed curve.',
      'Check the reactant level, the product level, and the peak height on both curves.',
      'Both paths share the same start and end; see which feature moves.'
    ],
    check(state) {
      const z = Math.round(state.table.fixtures.prof?.dials?.zone?.value ?? 4);
      if (z === 4) return { ok: false, notYet: true, msg: 'Tap the part of the energy profile that changes with the catalyst.' };
      if (z === 1) return { ok: false, msg: 'The starting reactants level (R: 40) is identical with or without a catalyst.' };
      if (z === 3) return { ok: false, msg: 'The products level (P: 15) and energy released are unchanged by a catalyst.' };
      return { ok: true };
    },
    reward: {
      log: 'A catalyst lowers Ea without changing R, P, or ΔH.',
      title: 'Lower Barrier, Same Energy Released',
      body: 'The catalyst lowers the peak from 110 to 70 kJ/mol while leaving reactants, products, and energy released unchanged.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-catalyst-in-steps',
    title: 'Catalyst vs Intermediate',
    briefing: {
      speaker: SPEAKER,
      body: 'A catalyst enters one step and comes back out in a later step. An intermediate is made in one step and used up in a later step.'
    },
    prompt: 'Which species is the catalyst in this two-step mechanism?',
    widget,
    table: rateTable({
      pieces: [
        stmt('Cl', 'Cl', { x: 114, y: 10 }),
        stmt('ClO', 'ClO', { x: 114, y: 24 }),
        stmt('O3', 'O₃', { x: 114, y: 38 })
      ],
      fixtures: [
        plaqueFixture('mech', 'Catalysed breakdown', { x: 46, y: 28 }, [
          'Step 1: Cl + O₃ → ClO + O₂',
          'Step 2: ClO + O → Cl + O₂',
          'Overall: O₃ + O → 2 O₂'
        ], { w: 78 })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Catalyst', at: { x: 114, y: 52 }, size: { w: 46, h: 12 } }]
      }
    }),
    hints: [
      'Check which species each step uses up and which it produces.',
      'A catalyst goes in during Step 1 and comes back out in Step 2.',
      'Look for the species missing from the overall equation that is used in Step 1.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "Catalyst".' };
      if (card.id === 'ClO') return { ok: false, msg: 'ClO is made in Step 1 and used up in Step 2, which makes it an intermediate, not a catalyst.' };
      if (card.id === 'O3') return { ok: false, msg: 'O₃ is consumed permanently to form O₂.' };
      return { ok: true };
    },
    reward: {
      log: 'Cl is the catalyst; ClO is the intermediate.',
      title: 'Spotting the Catalyst',
      body: 'Cl enters Step 1 and is regenerated in Step 2, so Cl is the catalyst. ClO is made in Step 1 and used in Step 2, so it is the intermediate.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-surface',
    title: 'On the Solid Surface',
    briefing: {
      speaker: SPEAKER,
      body: 'Some catalysts are solid metals instead of powders mixed into a gas. Watch where the gas molecule lands and breaks apart.'
    },
    prompt: 'Where do gas molecules stick to the surface and react on a solid catalyst?',
    widget,
    table: rateTable({
      fixtures: [
        collviewFixture('view', { x: 75, y: 28 }, {
          title: 'Solid catalyst',
          mode: 'surface',
          tapZones: [
            { id: 'gas', label: 'Gas above', y0: 0.0, y1: 0.44 },
            { id: 'surf', label: 'Top layer of solid', y0: 0.45, y1: 0.72 },
            { id: 'bulk', label: 'Deep inside solid', y0: 0.73, y1: 1.0 }
          ],
          w: 96,
          h: 46
        })
      ]
    }),
    hints: [
      'Press "Play" below the view and watch where the gas molecule lands and stretches.',
      'Gas molecules cannot reach deep inside the solid metal.',
      'Look at where the gas can touch the solid and weaken its bond.'
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
      body: 'Gas molecules stick to (adsorb onto) the exposed surface of a solid catalyst, weakening their bonds so products can form and leave.'
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
  [],
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
