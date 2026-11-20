/**
 * mirrowen.js — the harbour crews whose canals froze (Mirrowen, unit06). Pure data, no THREE.
 *
 * Read by the world (`three/npc/attach.js` builds a `three/npc/crew.js` from it), the talk card
 * (`src/npc/talk.js`) and the checks (`tools/verify-npc.mjs`). Shapes as in `src/npc/tallow-crew.js`.
 * Posts are world [x, z], proposed by `tools/npc/pick-posts.mjs` and held by `verify:npc`: clear ground,
 * reachable from the spawn, outside every bench's bay and off the boss arena.
 *
 * WHAT THEY SAY. The work here and the night the Fifth came. Lines never answer a bench; a line that
 * follows a bench (`afterBench`) speaks only once that bench is cleared, and only about what it meant here.
 */

export const POSTS = Object.freeze({
  'gantry-crane-1': { pos: [35.25, 32.75], look: [32, 26.5] },
  'shed-1': { pos: [-70.75, -83.75], look: [-82, -84] },
  'bollard-1': { pos: [-13.25, 23.25], look: [-12, 22.9] },
  'ice-wall-1': { pos: [-44.75, -55.75], look: [-51, -56] },
  'shed-2': { pos: [-81.75, -55.75], look: [-82, -66] },
  'bollard-2': { pos: [5.25, 23.25], look: [4, 22.9] },
  'ice-wall-2': { pos: [-44.75, -41.75], look: [-51, -42] },
  'shed-3': { pos: [-70.75, -24.25], look: [-82, -24] },
  'bollard-3': { pos: [25.25, 23.25], look: [24, 22.9] },
  'boil-1': { pos: [79.25, -94.75], look: [24, 50] },
  'states-2': { pos: [90.25, 92.75], look: [86, 104] },
  'boil-3': { pos: [12.75, -89.75], look: [24, 50] },
  'grip-4': { pos: [66.25, -29.25], look: [51.1, -30] },
  'states-5': { pos: [9.75, 92.75], look: [22, 104] },
  'separate-6': { pos: [-62.75, 42.75], look: [-82, 12] },
  'states-7': { pos: [49.75, 74.25], look: [44, 104] },
  'boil-8': { pos: [47.75, -66.75], look: [51.1, -30] },
  'crossing-9': { pos: [-28.75, -94.25], look: [24, 50] }
});

export const CREW = Object.freeze([
  {
    id: 'mirrowen-harbour', name: 'Lise Arden', role: 'Harbourmaster', model: 'town-f019',
    schedule: [
      { post: 'gantry-crane-1', act: 'look', for: [20, 30] },
      { post: 'bollard-3', act: 'idle', for: [15, 25] },
      { post: 'bollard-2', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['Every supply boat in Mirrowen is locked in the ice. Food, fuel, medicine, all of it, stuck in the canals.'],
        ['The tide still rises and falls under the ice. You can hear it groan at night.'],
        ['Mirrowen has never frozen in living memory. Not once. Not like this.']
      ],
      afterClue: {
        clue_mirrowen_agent: [
          ['Made in a factory, not in nature. Somebody built that chemical to shut our harbour.', 'That is a lot of trouble to stop a few boats.']
        ]
      }
    }
  },
  {
    id: 'mirrowen-barge', name: 'Pim Doorn', role: 'Bargeman', model: 'hand-m112',
    schedule: [
      { post: 'shed-1', act: 'idle', for: [20, 30] },
      { post: 'shed-2', act: 'idleShift', for: [15, 25] },
      { post: 'ice-wall-1', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['My barge has been stuck in the same spot for days. I walk out every morning to check her.'],
        ['The ice came in one night, from the inner canals outward. Water does not freeze from the middle like that.'],
        ['Before the freeze, I could run the whole canal loop by lunch.']
      ]
    }
  },
  {
    id: 'mirrowen-crane', name: 'Joss Kell', role: 'Crane driver', model: 'crew-m108',
    schedule: [
      { post: 'boil-1', act: 'idleShift', for: [20, 30] },
      { post: 'boil-8', act: 'look', for: [15, 25] },
      { post: 'boil-3', act: 'idle', for: [20, 30] }
    ],
    talk: {
      default: [
        ['The gantry crane lifts cargo off the boats. With the boats locked in, I lift nothing.'],
        ['From the crane cab you can see the whole shelf. The ice is clearer in some canals than others.'],
        ['I have been oiling the crane every day so it is ready the moment the canals open.']
      ]
    }
  },
  {
    id: 'mirrowen-cutter', name: 'Ragna Holt', role: 'Ice cutter', model: 'crew-f101',
    schedule: [
      { post: 'states-2', act: 'look', for: [20, 30] },
      { post: 'states-7', act: 'idle', for: [15, 25] },
      { post: 'states-5', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I cut channels with a saw. The ice closes them again overnight, faster than ordinary ice should.'],
        ['The ice wall in the west canal is thick enough to stand on. Do not.'],
        ['Ice saws dull fast on this stuff. I sharpen mine twice a shift.']
      ],
      afterBench: {
        'q5-crossing': [
          ['You watched the ice cross over, step by step. Now I know what my saw is fighting.']
        ]
      }
    }
  },
  {
    id: 'mirrowen-chemist', name: 'Elif Sander', role: 'Water chemist', model: 'lab-f152',
    schedule: [
      { post: 'separate-6', act: 'idle', for: [20, 30] },
      { post: 'bollard-1', act: 'idleShift', for: [15, 25] },
      { post: 'shed-3', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I test the canal water every week. This week, the samples did not behave like water at all.'],
        ['I keep every sample labelled and cold. A mixed-up jar is worse than no jar.'],
        ['Whatever was poured into the canals, there was a great deal of it. Tonnes, not buckets.']
      ],
      afterBench: {
        'q6-solution': [
          ['You saw what happens when something is taken into water. My samples make more sense to me now.']
        ]
      }
    }
  },
  {
    id: 'mirrowen-dockwatch', name: 'Bertil Moss', role: 'Dock watch', model: 'watch-m171',
    schedule: [
      { post: 'grip-4', act: 'idleShift', for: [40, 60] },
      { post: 'ice-wall-2', act: 'look', for: [15, 25] },
      { post: 'crossing-9', act: 'idle', for: [20, 30] }
    ],
    task: 'mirrowen-seal',
    talk: {
      default: [
        ['I walk the docks all night. The night of the freeze, I heard drums rolling by the bollards.']
      ]
    }
  }
]);

/** The side task: no XP and nothing gated; the reward is the thanks and a note on the Case Board. */
export const TASKS = Object.freeze({
  'mirrowen-seal': {
    id: 'mirrowen-seal',
    worldId: 'unit06',
    giver: 'mirrowen-dockwatch',
    item: { label: 'Drum Seal', kind: 'bolt', pos: [-8.75, 25.75] },
    ask: [
      'The drums I heard that night were tipped into the canal and dragged off empty.',
      'One of them lost its seal by the bollards on the near quay. Bring it here.'
    ],
    remind: [
      'By the bollards on the near quay. A metal drum seal, about the size of a fist.'
    ],
    thanks: [
      'Stamped with a batch number. Nothing on Mirrowen comes in drums like this.',
      'This came from a factory somewhere far away.'
    ],
    note: {
      title: 'Mirrowen · Dock Watch Log',
      speaker: 'Bertil Moss',
      text: 'A metal drum seal found by the quay bollards, stamped with a factory batch number. No business on Mirrowen uses drums like it.'
    }
  }
});
