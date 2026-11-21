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
        ['The Fifth Guild set up a giant magnet right in our iron canyon to sort our metal drums and haul away specific ones.'],
        ['This canyon has supplied iron and rare metals for a century, and nobody ever hijacked our sorting line before.'],
        ['Keep metal tools off your belt near that giant magnet, because it rips wrenches right out of your hand.']
      ],
      afterClue: {
        clue_lodestone_coil: [
          ['Every single sorted metal drum is being shipped straight to Cinder Halo. That must be where the Fifth Guild\'s main base is.']
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
        ['I count every metal drum leaving the canyon, and lately dozens of drums disappear every night without a record.'],
        ['Every sealed ore drum looks identical on the outside until you test what metal is actually inside.'],
        ['The Fifth Guild only loaded the drums that their huge magnet lifted, leaving all the other drums sitting untouched.']
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
        ['I test our canyon metals in the lab because several different transition metals look almost identical as raw powders.'],
        ['Red iron dust blows into everything down here, so I wash every test flask three times before running a sample.'],
        ['The Fifth Guild only stole very specific metals from our yard, which tells me they are building something specialized.']
      ],
      afterBench: {
        'q1-dblock': [
          ['Testing the drums yourself shows why we never trust burned-off shipping labels down in this canyon.']
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
        ['I hook heavy drums onto our cranes, and whenever the Fifth Guild\'s magnet powers up, every steel chain swings toward it.'],
        ['That giant sorting magnet hums so loud you can feel the vibration right through your boots.'],
        ['Stay alert on the canyon floor, because loose rocks break off the cliff walls whenever the heavy trucks roll by.']
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
        ['I drive heavy ore trucks down to the cargo landing pads along the steep canyon road.'],
        ['Unmarked cargo trucks rolled in and out at night with their headlights off, using a hidden side trail.'],
        ['In ten years driving this canyon, I have never seen anyone haul away this much metal in secret.']
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
        ['I guard the main canyon gate, yet none of the metal drums stolen at night ever passed my checkpoint.']
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
      'A night crew dropped a shipping tag near the middle of the canyon floor while loading drums.',
      'Could you bring it to me so I can figure out where all those stolen drums are going?'
    ],
    remind: [
      'Look near the middle of the canyon floor for a torn scrap of shipping label.'
    ],
    thanks: [
      'The planet name is torn off, yet the shipping code matches every single drum taken at night.',
      'They have been shipping our metals to one secret destination for months.'
    ],
    note: {
      title: 'Lodestone · Gate Guard\'s Find',
      speaker: 'Pavel Oster',
      text: 'Half a shipping label from a stolen drum. The destination is torn off, though the route code matches every night shipment.'
    }
  }
});
