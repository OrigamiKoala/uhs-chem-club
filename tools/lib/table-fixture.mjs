/**
 * table-fixture.mjs — The throwaway kit and the one throwaway stage that prove
 * the tabletop pipeline (`src/learn/table/`, widget `type: 'table'`).
 *
 * NOT SHIPPED. Nothing under `src/` imports this file, no quest uses the kit,
 * and the stage is reachable only from `tools/verify-table.mjs`. It exists so
 * the reducer, the snaps, the rail, the recorder and the replay-by-drag and
 * by-two-tap machinery are exercised end to end BEFORE the first quest
 * converts (plan T0), and so a regression in any of them fails the build.
 *
 * THE KIT is "bars": a bar has a north or a south end (`props.pole`), and two
 * bars join only if their facing ends differ. Every outcome is the kit's
 * planner (`planJoin`); the stage declares none. A fixture "meter" with a
 * `turns` dial reads two numbers per run, from the table's own state.
 *
 * THE STAGE uses every verb: join, place (tray, rail, slot), fetch, pour,
 * setDial and run, the straightedge, and a prediction that Run then tests.
 */

import { registerKit } from '../../src/learn/table/kits/registry.js';

export const TEST_KIT = {
  id: 'bars',
  kinds: { bar: {}, card: {}, seal: {} },
  maxScale: 3,

  planJoin(a, b, state) {
    if (a.kind !== 'bar' || b.kind !== 'bar') return { holds: false, reason: 'only bars join' };
    if (a.props.pole === b.props.pole) return { holds: false, reason: 'two like ends push apart' };
    if (a.joinedTo.length >= 2 || b.joinedTo.length >= 2) return { holds: false, reason: 'that bar has both ends taken' };
    return { holds: true, reason: 'unlike ends hold', link: { poles: [a.props.pole, b.props.pole] } };
  },

  formulaOf(ids, state) {
    return ids.map(id => state.pieces[id].props.pole).sort().join('');
  },

  readPiece(id, state) {
    return { held: state.pieces[id].joinedTo.length };
  },

  run(state, fixtureId) {
    const turns = state.fixtures[fixtureId].dials.turns.value;
    return { x: turns, y: turns * 2 + Object.keys(state.links).length, label: `${turns} turns` };
  }
};

export function registerTestKit() { return registerKit(TEST_KIT); }

/** The declaration. The same shape a quest stage gives (`stage.table`). */
export const TEST_TABLE = {
  kit: 'bars',
  bounds: { w: 100, h: 80 },
  tools: ['straightedge'],
  pieces: [
    { id: 'b1', kind: 'bar', label: 'Bar 1', at: { x: 8, y: 8 }, props: { pole: 'N' } },
    { id: 'b2', kind: 'bar', label: 'Bar 2', at: { x: 24, y: 8 }, props: { pole: 'S' } },
    { id: 'b3', kind: 'bar', label: 'Bar 3', at: { x: 8, y: 22 }, props: { pole: 'N' } },
    { id: 'b4', kind: 'bar', label: 'Bar 4', at: { x: 24, y: 22 }, props: { pole: 'S' } },
    { id: 'c1', kind: 'card', label: 'Card 1', at: { x: 30, y: 40 } },
    { id: 'c2', kind: 'card', label: 'Card 2', at: { x: 40, y: 40 } },
    { id: 'c3', kind: 'card', label: 'Card 3', at: { x: 50, y: 40 } },
    { id: 'w1', kind: 'seal', label: 'Seal', at: { x: 76, y: 25 }, hidden: true, fetchFrom: 'shelf' }
  ],
  zones: {
    trays: [{ id: 'pairs', label: 'Pairs', at: { x: 46, y: 14 } }],
    slots: [{ id: 'lid', label: 'Lid', at: { x: 91, y: 42 } }],
    containers: [
      { id: 'A', label: 'Jar A', at: { x: 46, y: 42 }, capacity: 10, contents: { water: 6 } },
      { id: 'B', label: 'Jar B', at: { x: 70, y: 42 }, capacity: 10, contents: {} }
    ],
    rail: { at: { x: 50, y: 70 }, first: 'Smallest', last: 'Biggest', items: ['c1', 'c2', 'c3'] }
  },
  fixtures: [
    { id: 'meter', kind: 'meter', label: 'Meter', at: { x: 14, y: 46 }, dials: { turns: { min: 0, max: 10, step: 1, value: 0 } } }
  ],
  fetch: [{ id: 'shelf', label: 'Shelf' }],
  prediction: {
    slot: { id: 'predict', label: 'Prediction', at: { x: 90, y: 28 } },
    tokens: [{ id: 't-up', label: 'Rises', at: { x: 30, y: 59 } }, { id: 't-down', label: 'Falls', at: { x: 62, y: 59 } }]
  }
};

export const TEST_SOLUTION = [
  { join: ['b1', 'b2'] },
  { join: ['b3', 'b4'] },
  { place: { piece: 'b1', to: 'tray:pairs' } },
  { place: { piece: 'b3', to: 'tray:pairs' } },
  { place: { piece: 'c3', to: 'rail:0' } },
  { place: { piece: 'c1', to: 'rail:1' } },
  { fetch: 'shelf' },
  { place: { piece: 'w1', to: 'slot:lid' } },
  { pour: { from: 'A', to: 'B', what: 'water', amount: 4 } },
  { setDial: { fixture: 'meter', dial: 'turns', value: 2 } },
  { run: 'meter' },
  { setDial: { fixture: 'meter', dial: 'turns', value: 6 } },
  { run: 'meter' },
  { lay: { kind: 'straightedge', through: [0, 1] } },
  { predict: 't-up' },
  { run: 'meter' }
];

/** Scripts that must each FAIL the stage, with the reason `check` has to give. */
export const TEST_MISSES = [
  { script: [{ join: ['b1', 'b3'] }, { join: ['b2', 'b4'] }], says: /tray/i },
  { script: TEST_SOLUTION.slice(0, 2), says: /tray/i },
  { script: TEST_SOLUTION.filter(s => !s.pour), says: /jar/i },
  { script: TEST_SOLUTION.map(s => (s.predict ? { predict: 't-down' } : s)), says: /prediction/i }
];

export const TEST_STAGE = {
  title: 'Throwaway',
  prompt: 'Make the table agree with the notes.',
  widget: { type: 'table', label: 'The table' },
  table: TEST_TABLE,
  hints: ['One.', 'Two.', 'Three.'],
  check(state) {
    const t = state.table;
    const inTray = t && Object.values(t.pieces).filter(p => p.zone === 'tray:pairs').map(p => p.id).sort();
    if (!inTray) return { ok: false, notYet: true, msg: 'No table.' };
    if (inTray.join() !== 'b1,b2,b3,b4') return { ok: false, msg: 'Both pairs belong in the tray.' };
    if (t.zones.rail.order.join() !== 'c3,c1,c2') return { ok: false, msg: 'The cards are out of order on the rail.' };
    if (t.pieces.w1.zone !== 'slot:lid') return { ok: false, msg: 'The lid is open.' };
    if ((t.zones.containers.B.contents.water || 0) !== 4) return { ok: false, msg: 'Jar B holds the wrong amount.' };
    if (t.recorder.rows.length < 2 || !t.recorder.tool) return { ok: false, msg: 'Lay the straightedge across two readings.' };
    if (t.prediction.token !== 't-up' || !t.prediction.tested) return { ok: false, msg: 'The prediction did not survive the test.' };
    return { ok: true };
  },
  reward: { log: 'Throwaway.', title: 'Throwaway', body: 'This stage exists only to prove the pipeline end to end, so nothing here is taught.' }
};
