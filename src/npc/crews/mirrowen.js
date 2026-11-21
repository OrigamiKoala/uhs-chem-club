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
        ['Every supply boat in Mirrowen is trapped in solid ice, along with our food, fuel, and medicine.'],
        ['The ocean tide still rises and falls under the frozen canals. You can hear the ice groaning at night.'],
        ['Mirrowen\'s harbor has never frozen before in living memory. Something unnatural locked these canals up overnight.']
      ],
      afterClue: {
        clue_mirrowen_agent: [
          ['So that freezing chemical was made in a factory. Someone went to huge lengths just to shut down our harbor.']
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
        ['My cargo boat has been frozen in the same spot for days. I walk out every morning to check the hull.'],
        ['The canals froze from the middle outward in a single night. Normal winter ice never forms like that.'],
        ['Before the Fifth Guild froze the harbor, I could deliver cargo across every canal before lunch.']
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
        ['My dock crane unloads crates off the supply boats. With every boat stuck in ice, the crane sits idle.'],
        ['From up in the crane cab, you can see that the ice looks cloudy in some canals and clear in others.'],
        ['I keep the crane oiled every day so we can start unloading supplies the second the canals thaw.']
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
        ['I try to saw open channels for the boats, yet the ice freezes right back over by morning.'],
        ['That thick ice barrier in the west canal looks solid enough to walk on, though I would stay off it.'],
        ['This ice is strangely hard and dulls my saw blades twice as fast as normal canal ice.']
      ],
      afterBench: {
        'q5-crossing': [
          ['Seeing how much heat it takes to melt this barrier explains why our saws barely make a dent.']
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
        ['I test the canal water every week. Since the freeze, the water samples have not behaved like pure water at all.'],
        ['I label every water jar carefully so we can track where the mystery chemical is most concentrated.'],
        ['Whoever dumped that chemical into the canals poured in tons of it, enough to fill whole cargo drums.']
      ],
      afterBench: {
        'q6-solution': [
          ['Measuring how much chemical dissolved in each liter of canal water makes my lab tests much clearer.']
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
        ['I patrol the docks every night. The evening the canals froze, I heard heavy metal drums rolling along the pier.']
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
      'The raiders dumped those drums into the canal and dragged the empties away in the dark.',
      'One drum dropped its metal cap near the mooring posts on the near dock. Could you bring it to me?'
    ],
    remind: [
      'Look by the mooring posts along the near dock for a fist-sized metal drum seal.'
    ],
    thanks: [
      'It is stamped with an industrial batch number. Nobody on Mirrowen ships chemicals in drums like this.',
      'The Fifth Guild must have a real chemical factory somewhere off-world.'
    ],
    note: {
      title: 'Mirrowen · Dock Watch Log',
      speaker: 'Bertil Moss',
      text: 'A metal drum seal found on the dock, stamped with a factory batch number. No local business uses drums like it.'
    }
  }
});
