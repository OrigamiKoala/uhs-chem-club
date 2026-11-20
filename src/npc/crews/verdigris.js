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
        ['This fort relays every message across the marsh. If the masts fall, three settlements go silent.'],
        ['The acid is eating the mast footings. Green crust on copper, rust on steel.'],
        ['At night I hear voices in the static. Mostly it is weather. Mostly.']
      ],
      afterClue: {
        clue_verdigris_leach: [
          ['Waste from washing heavy ore. Nobody mines like that unless they are after something rare.', 'What are they digging for?']
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
        ['Our drinking water comes through the marsh intake. If the runoff reaches it, we stop drinking.'],
        ['I check the intake screens twice a day. The reeds near them have started to yellow.'],
        ['Clean water looks the same as bad water. That is why we test, not look.']
      ],
      afterBench: {
        'q2-scale': [
          ['You read the marsh on the scale. I will be watching that number at the intake every day.']
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
        ['Acid burns are slow. You do not feel them until it is too late. Rinse first, ask questions after.'],
        ['I keep big jugs of clean water by every door. Splashes happen.'],
        ['Two of the garrison got burns wading the marsh. Boots, please, always.']
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
        ['I climb the masts to fix the cables. The view is good. The smell from the marsh is not.'],
        ['Copper turns green out here. That green is called verdigris. The marsh is named for it.'],
        ['The footings are steel in concrete. The acid gets into the cracks and works its way in.']
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
        ['I know every dry path through this marsh. Fewer of them every week.'],
        ['The fish went first. Then the frogs. The reeds are going now.'],
        ['The ore plant upstream lights up at night. Nobody from the fort has been invited in.']
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
        ['I walk the fort wall at night. Something has been moving barrels along the old marsh road.']
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
      'Last night a barrel rolled off a cart near the middle of the marsh road. The crew left something behind.',
      'Bring it in. Carefully. Touch nothing inside it.'
    ],
    remind: [
      'Near the middle of the marsh, by the road. A work glove.'
    ],
    thanks: [
      'Rubber, eaten through at the fingertips. Whatever was in those barrels went straight through it.',
      'The medic should see this.'
    ],
    note: {
      title: 'Verdigris · Sentry Report',
      speaker: 'Sigurd Vale',
      text: 'A rubber work glove dropped by the barrel crew, eaten through at the fingertips by what they carried.'
    }
  }
});
