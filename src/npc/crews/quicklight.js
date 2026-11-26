/**
 * quicklight.js — the crews of the storm-belt fuel refinery (Quicklight, unit11). Pure data, no THREE.
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
  'steps-1': { pos: [79.25, 88.75], look: [-63, -68.5] },
  'watch-2': { pos: [-90.75, -89.25], look: [-63, -68.5] },
  'shortcut-3': { pos: [-49.25, 42.75], look: [-63, -68.5] },
  'law-4': { pos: [16.75, -66.25], look: [-63, -68.5] },
  'steps-5': { pos: [32.25, 27.25], look: [-63, -68.5] },
  'time-6': { pos: [-55.25, -27.75], look: [-63, -68.5] },
  'steps-7': { pos: [17.75, 85.75], look: [-63, -68.5] },
  'law-8': { pos: [-7.75, -25.25], look: [0, 0] },
  'watch-9': { pos: [-39.25, -70.75], look: [-63, -68.5] },
  'collide-10': { pos: [-6.75, 43.25], look: [-63, -68.5] },
  'steps-11': { pos: [62.25, 53.25], look: [-63, -68.5] },
  'shortcut-12': { pos: [-22.25, 78.75], look: [-63, -68.5] },
  'watch-13': { pos: [-74.25, -57.75], look: [-63, -68.5] },
  'time-14': { pos: [-35.75, -0.25], look: [0, 0] },
  'steps-15': { pos: [48.75, 82.25], look: [-63, -68.5] },
  'collide-16': { pos: [-7.75, 12.75], look: [0, 0] },
  'watch-17': { pos: [-61.25, -90.25], look: [-63, -68.5] },
  'law-18': { pos: [-8.75, -53.75], look: [-63, -68.5] }
});

export const CREW = Object.freeze([
  {
    id: 'quicklight-chief', name: 'Ottavio Brask', role: 'Tower chief', model: 'fire-m138',
    schedule: [
      { post: 'watch-13', act: 'look', for: [20, 30] },
      { post: 'watch-17', act: 'idle', for: [15, 25] },
      { post: 'time-6', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['Our fuel refinery towers are meant to burn at a slow, steady pace. When they spiked, we barely had minutes to cool them.'],
        ['Each tower has an exhaust vent, a heat gauge, and an operator watching both around the clock.'],
        ['These towers are built to survive lightning strikes during storms, though they were never built to survive sabotage.']
      ],
      afterClue: {
        clue_quicklight_flare: [
          ['So the Fifth Guild\'s leader goes by The Catalyst. That means an experienced chemist is running this whole operation.']
        ]
      }
    }
  },
  {
    id: 'quicklight-sweeper', name: 'Lio Danek', role: 'Vent sweeper', model: 'crew-m108',
    schedule: [
      { post: 'steps-1', act: 'idle', for: [20, 30] },
      { post: 'steps-15', act: 'idleShift', for: [15, 25] },
      { post: 'steps-11', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I sweep black soot out of the fuel vents every week, yet this time I found a fine yellow-grey dust I never saw before.'],
        ['Always wear a respirator near the vents so you do not breathe in that strange chemical dust.'],
        ['One vent was wiped spotless right before the overheating started, like someone climbed inside to plant that powder.']
      ]
    }
  },
  {
    id: 'quicklight-control', name: 'Mirela Pask', role: 'Control operator', model: 'lab-f153',
    schedule: [
      { post: 'law-4', act: 'idleShift', for: [20, 30] },
      { post: 'law-18', act: 'look', for: [15, 25] },
      { post: 'law-8', act: 'idle', for: [20, 30] }
    ],
    talk: {
      default: [
        ['From the control room I monitor every fuel tower at once. When the spike hit, every heat needle shot straight into red.'],
        ['We record how fast the fuel burns every minute, which is how we spotted the sudden jump immediately.'],
        ['The fuel started burning ten times faster than normal. I checked our sensors three times before I believed it.']
      ],
      afterBench: {
        'q1-watch': [
          ['Timing how fast the fuel burns on your bench matches our control room logs minute by minute.']
        ]
      }
    }
  },
  {
    id: 'quicklight-weather', name: 'June Arkwright', role: 'Weather watch', model: 'pilot-f168',
    schedule: [
      { post: 'shortcut-12', act: 'look', for: [20, 30] },
      { post: 'collide-10', act: 'idle', for: [15, 25] },
      { post: 'steps-7', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['Storms roll across this refinery region almost nonstop, so my job is tracking when lightning will hit the towers.'],
        ['A heavy storm hit the exact night someone spiked our vents, giving the Fifth Guild perfect cover to climb unseen.'],
        ['If you smell sharp ozone in the rain, a lightning storm is right overhead.']
      ]
    }
  },
  {
    id: 'quicklight-tanker', name: 'Bastian Rowe', role: 'Tanker driver', model: 'hand-m112',
    schedule: [
      { post: 'shortcut-3', act: 'idle', for: [20, 30] },
      { post: 'time-14', act: 'idleShift', for: [15, 25] },
      { post: 'collide-16', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['Normally I drive fuel tankers from the towers to our storage yard. Since the spike, I have been hauling cooling water instead.'],
        ['Storm water floods these roads fast, which is why our fuel trucks ride so high off the ground.'],
        ['Two unmarked trucks parked near our storage yard a week before the sabotage, then vanished overnight.']
      ]
    }
  },
  {
    id: 'quicklight-radio', name: 'Caspar Lind', role: 'Radio clerk', model: 'town-m009',
    schedule: [
      { post: 'steps-5', act: 'idleShift', for: [40, 60] },
      { post: 'watch-9', act: 'look', for: [15, 25] },
      { post: 'watch-2', act: 'idle', for: [20, 30] }
    ],
    task: 'quicklight-casing',
    talk: {
      default: [
        ['I monitor our radio shack through every storm, and lately I keep catching secret Fifth Guild broadcasts in the static.']
      ]
    }
  }
]);

/** The side task: no XP and nothing gated; the reward is the thanks and a note on the Case Board. */
export const TASKS = Object.freeze({
  'quicklight-casing': {
    id: 'quicklight-casing',
    worldId: 'unit11',
    giver: 'quicklight-radio',
    item: { label: 'Spent Flare Casing', kind: 'bolt', pos: [-4.25, 2.25] },
    ask: [
      'The night our vents were spiked, someone shot a signal flare right over the middle of the refinery.',
      'Its empty metal tube should still be lying where it landed. Could you bring it to me?'
    ],
    remind: [
      'Look near the middle of the refinery yard for a blackened metal flare tube.'
    ],
    thanks: [
      'This is an off-world signal flare, nothing our refinery uses. Someone was signaling their crew that the sabotage was done.',
      'I will keep listening to the radio tonight.'
    ],
    note: {
      title: 'Quicklight · Radio Clerk\'s Note',
      speaker: 'Caspar Lind',
      text: 'A burned-out signal flare tube from the night the vents were spiked. Someone signaled their crew that the sabotage was done.'
    }
  }
});
