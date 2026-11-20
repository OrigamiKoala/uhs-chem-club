/**
 * lodestone.js — the crews of the iron canyon (Lodestone, unit12). Pure data, no THREE.
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
  'spin-1': { pos: [-37.75, -43.75], look: [44, 86] },
  'complex-2': { pos: [81.75, 91.75], look: [44, 86] },
  'dblock-3': { pos: [-25.75, 67.75], look: [44, 86] },
  'shapes-4': { pos: [39.75, 4.25], look: [0, 0] },
  'complex-5': { pos: [35.25, 60.75], look: [44, 86] },
  'colour-6': { pos: [-19.75, 1.75], look: [0, 0] },
  'charges-7': { pos: [1.75, 36.75], look: [0, 0] },
  'complex-8': { pos: [74.75, 53.25], look: [44, 86] },
  'complex-9': { pos: [47.75, 92.75], look: [44, 86] },
  'dblock-10': { pos: [5.25, 77.25], look: [44, 86] },
  'spin-11': { pos: [-9.25, -30.25], look: [0, 0] },
  'colour-12': { pos: [-48.25, -7.75], look: [44, 86] },
  'shapes-13': { pos: [10.25, 8.25], look: [0, 0] },
  'complex-14': { pos: [32.75, 32.25], look: [44, 86] },
  'complex-15': { pos: [57.75, 70.75], look: [44, 86] },
  'spin-16': { pos: [-30.75, -22.25], look: [0, 0] },
  'complex-17': { pos: [89.25, 70.25], look: [44, 86] },
  'dblock-18': { pos: [-6.25, 57.75], look: [44, 86] }
});

export const CREW = Object.freeze([
  {
    id: 'lodestone-foreman', name: 'Teodor Valk', role: 'Canyon foreman', model: 'crew-m107',
    schedule: [
      { post: 'complex-9', act: 'look', for: [20, 30] },
      { post: 'complex-15', act: 'idle', for: [15, 25] },
      { post: 'complex-2', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['The Fifth set up a magnet bigger than my house and started sorting our drums. Iron one way, the rest another.'],
        ['This canyon has given iron for a hundred years. It has never been sorted by anyone but us.'],
        ['Keep tools off your belt near the magnet. It will take them, and it does not give them back.']
      ],
      afterClue: {
        clue_lodestone_coil: [
          ['Every sorted drum shipped to one place. Cinder Halo.', 'That is where this ends, then.']
        ]
      }
    }
  },
  {
    id: 'lodestone-tally', name: 'Remy Osei', role: 'Drum tallyman', model: 'town-m007',
    schedule: [
      { post: 'spin-1', act: 'idle', for: [20, 30] },
      { post: 'spin-16', act: 'idleShift', for: [15, 25] },
      { post: 'spin-11', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I count every drum that leaves the canyon. Lately more leave than I count.'],
        ['A drum of ore looks like any other drum until you lift it.'],
        ['The drums the magnet sorted out were taken first. The ones it left were not touched.']
      ]
    }
  },
  {
    id: 'lodestone-assay', name: 'Saskia Imre', role: 'Ore assayer', model: 'lab-f152',
    schedule: [
      { post: 'dblock-3', act: 'idleShift', for: [20, 30] },
      { post: 'dblock-18', act: 'look', for: [15, 25] },
      { post: 'dblock-10', act: 'idle', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I sort ore by testing it, not by guessing. Some of these metals look alike until you look closely.'],
        ['Rock dust gets into every jar. I rinse my glassware three times before a test.'],
        ['The Fifth only took drums of certain metals. They knew exactly what they were looking for.']
      ],
      afterBench: {
        'q1-dblock': [
          ['You assayed the drums the way I do. Now you know why I never trust a label.']
        ]
      }
    }
  },
  {
    id: 'lodestone-crane', name: 'Hal Brody', role: 'Crane rigger', model: 'crew-m103',
    schedule: [
      { post: 'shapes-4', act: 'look', for: [20, 30] },
      { post: 'complex-14', act: 'idle', for: [15, 25] },
      { post: 'shapes-13', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I rig the drums for lifting. With the magnet running, every chain in the canyon swings toward it.'],
        ['The magnet hums all day. You feel it in your teeth.'],
        ['Nobody walks the canyon floor alone. Rockfall comes without warning.']
      ]
    }
  },
  {
    id: 'lodestone-hauler', name: 'Yara Solis', role: 'Hauler driver', model: 'town-f019',
    schedule: [
      { post: 'colour-6', act: 'idle', for: [20, 30] },
      { post: 'colour-12', act: 'idleShift', for: [15, 25] },
      { post: 'charges-7', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I drive the ore haulers down to the landing pads. The road through the canyon is narrow and steep.'],
        ['Haulers came and went at night, with no lights. They did not use our road.'],
        ['I have driven this canyon for ten years. I have never seen it so busy and so quiet at once.']
      ]
    }
  },
  {
    id: 'lodestone-guard', name: 'Pavel Oster', role: 'Gate guard', model: 'watch-m171',
    schedule: [
      { post: 'complex-5', act: 'idleShift', for: [40, 60] },
      { post: 'complex-8', act: 'look', for: [15, 25] },
      { post: 'complex-17', act: 'idle', for: [20, 30] }
    ],
    task: 'lodestone-label',
    talk: {
      default: [
        ['I guard the canyon gate. The drums that left at night never came past me.']
      ]
    }
  }
]);

/** The side task: no XP and nothing gated; the reward is the thanks and a note on the Case Board. */
export const TASKS = Object.freeze({
  'lodestone-label': {
    id: 'lodestone-label',
    worldId: 'unit12',
    giver: 'lodestone-guard',
    item: { label: 'Torn Shipping Label', kind: 'paper', pos: [-4.75, -1.25] },
    ask: [
      'A loader dropped something by the drum yard, near the middle of the canyon floor, and nobody went back for it.',
      'Bring it to me. I mean to find out where those drums went.'
    ],
    remind: [
      'Near the middle of the canyon floor. A scrap of shipping label.'
    ],
    thanks: [
      'Half a shipping label. The destination is torn off, but the route code matches every night drum.',
      'Someone has been planning this for a long time.'
    ],
    note: {
      title: 'Lodestone · Gate Guard\'s Find',
      speaker: 'Pavel Oster',
      text: 'Half a shipping label from a night drum. The destination is torn off; the route code matches every drum that left at night.'
    }
  }
});
