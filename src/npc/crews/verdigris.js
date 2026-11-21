/**
 * verdigris.js — the people of the radio fort in the acid marsh (Verdigris, unit09). Pure data, no THREE.
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
  'capacity-1': { pos: [-41.25, -56.25], look: [63, 42] },
  'scale-2': { pos: [86.75, 70.25], look: [63, 42] },
  'weak-3': { pos: [10.25, 19.75], look: [0, 0] },
  'structure-4': { pos: [-58.25, 30.25], look: [63, 42] },
  'titrate-5': { pos: [22.75, -42.25], look: [63, 42] },
  'scale-6': { pos: [48.75, 45.25], look: [63, 42] },
  'salts-7': { pos: [-37.25, -14.25], look: [0, 0] },
  'handover-8': { pos: [12.25, 53.75], look: [63, 42] },
  'titrate-9': { pos: [-7.25, -28.25], look: [0, 0] },
  'buffer-10': { pos: [-11.25, -68.25], look: [63, 42] },
  'scale-11': { pos: [80.75, 39.25], look: [63, 42] },
  'titrate-12': { pos: [13.75, -7.25], look: [0, 0] },
  'scale-13': { pos: [59.25, 70.25], look: [63, 42] },
  'structure-14': { pos: [-54.25, 5.25], look: [63, 42] },
  'weak-15': { pos: [-13.75, -4.75], look: [0, 0] },
  'salts-16': { pos: [-20.25, -46.75], look: [63, 42] },
  'scale-17': { pos: [44.75, 24.25], look: [63, 42] },
  'buffer-18': { pos: [1.75, -46.75], look: [63, 42] }
});

export const CREW = Object.freeze([
  {
    id: 'verdigris-radio', name: 'Delphine Aske', role: 'Radio operator', model: 'pilot-f168',
    schedule: [
      { post: 'scale-6', act: 'look', for: [20, 30] },
      { post: 'scale-17', act: 'idle', for: [15, 25] },
      { post: 'scale-13', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['This radio fort relays messages across the entire marsh. If our antenna towers collapse, three towns lose contact.'],
        ['Acid runoff from the Fifth Guild plant upstream is eating right through the copper and steel bases of our towers.'],
        ['Late at night I pick up strange coded radio chatter in the static, coming from somewhere upstream.']
      ],
      afterClue: {
        clue_verdigris_leach: [
          ['That strong acid waste comes from washing heavy metal ore. Nobody sets up a plant like that unless they are mining something rare.']
        ]
      }
    }
  },
  {
    id: 'verdigris-intake', name: 'Kofi Mensah', role: 'Intake engineer', model: 'crew-m108',
    schedule: [
      { post: 'capacity-1', act: 'idle', for: [20, 30] },
      { post: 'salts-16', act: 'idleShift', for: [15, 25] },
      { post: 'buffer-10', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['Our fort pumps drinking water straight from the marsh. If the acid runoff reaches our intake pipe, we have no clean water.'],
        ['I inspect the water intake twice a day, and the marsh reeds around it are already turning yellow from acid.'],
        ['Clear water can still be dangerously acidic, so we test every sample with meters instead of trusting our eyes.']
      ],
      afterBench: {
        'q2-scale': [
          ['Now that we know how fast acidity jumps with each step on the scale, I will watch our water meter closely.']
        ]
      }
    }
  },
  {
    id: 'verdigris-medic', name: 'Rhea Lund', role: 'Fort medic', model: 'medic-f154',
    schedule: [
      { post: 'structure-4', act: 'idleShift', for: [20, 30] },
      { post: 'structure-14', act: 'look', for: [15, 25] },
      { post: 'salts-7', act: 'idle', for: [20, 30] }
    ],
    talk: {
      default: [
        ['Acid splashes can burn before you even feel them, so rinse skin with clean water right away if you get splashed.'],
        ['I keep jugs of clean rinse water beside every door in the fort just in case someone tracks acid inside.'],
        ['Two of our guards got chemical burns wading through the marsh this week, so keep your boots on dry boards.']
      ]
    }
  },
  {
    id: 'verdigris-rigger', name: 'Matthias Kern', role: 'Mast rigger', model: 'crew-m103',
    schedule: [
      { post: 'titrate-12', act: 'look', for: [20, 30] },
      { post: 'weak-3', act: 'idle', for: [15, 25] },
      { post: 'weak-15', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I climb the radio towers to tighten the support cables, and the acid fumes rising from the marsh are awful.'],
        ['The green rust coating all the copper out here is called verdigris. That is how this marsh got its name.'],
        ['Our tower bases are steel bolted into concrete, and the acid runoff seeps right into the cracks.']
      ]
    }
  },
  {
    id: 'verdigris-guide', name: 'Tobiah Reed', role: 'Marsh guide', model: 'hand-m112',
    schedule: [
      { post: 'titrate-5', act: 'idle', for: [20, 30] },
      { post: 'buffer-18', act: 'idleShift', for: [15, 25] },
      { post: 'titrate-9', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I know every safe dry trail across this marsh, though the rising acid water swallows more paths every week.'],
        ['The fish and frogs vanished from these pools as soon as the Fifth Guild started dumping waste upstream.'],
        ['Their ore-washing plant upstream runs bright lights all night, and nobody from our fort is allowed anywhere near it.']
      ]
    }
  },
  {
    id: 'verdigris-sentry', name: 'Sigurd Vale', role: 'Fort sentry', model: 'watch-m171',
    schedule: [
      { post: 'handover-8', act: 'idleShift', for: [40, 60] },
      { post: 'scale-11', act: 'look', for: [15, 25] },
      { post: 'scale-2', act: 'idle', for: [20, 30] }
    ],
    task: 'verdigris-glove',
    talk: {
      default: [
        ['I watch the fort wall at night, and crews have been hauling heavy chemical barrels along the marsh road.']
      ]
    }
  }
]);

/** The side task: no XP and nothing gated; the reward is the thanks and a note on the Case Board. */
export const TASKS = Object.freeze({
  'verdigris-glove': {
    id: 'verdigris-glove',
    worldId: 'unit09',
    giver: 'verdigris-sentry',
    item: { label: 'Eaten Work Glove', kind: 'glove', pos: [1.25, -4.75] },
    ask: [
      'Last night a barrel fell off a cart on the middle marsh road, and the Fifth Guild crew dropped a work glove.',
      'Could you bring it in carefully? Make sure you do not touch whatever leaked inside it.'
    ],
    remind: [
      'Look near the middle of the marsh beside the road for a dropped work glove.'
    ],
    thanks: [
      'Thick rubber, eaten straight through at the fingertips. Whatever acid was in those barrels is seriously harsh.',
      'I will pass this straight to the fort medic.'
    ],
    note: {
      title: 'Verdigris · Sentry Report',
      speaker: 'Sigurd Vale',
      text: 'A thick rubber work glove dropped by the barrel crew, eaten right through at the fingertips by strong acid.'
    }
  }
});
