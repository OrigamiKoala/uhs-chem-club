/**
 * brinewire.js — the crews who keep the copper marsh grid running (Brinewire, unit10). Pure data, no THREE.
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
  'galvanic-1': { pos: [8.25, 76.75], look: [-29, -67] },
  'halves-2': { pos: [-50.75, -93.75], look: [-29, -67] },
  'electrolysis-3': { pos: [44.75, -47.75], look: [-29, -67] },
  'activity-4': { pos: [-32.75, -3.25], look: [0, 0] },
  'electrolysis-5': { pos: [6.75, -90.25], look: [-29, -67] },
  'galvanic-6': { pos: [8.75, 26.25], look: [0, 0] },
  'halves-7': { pos: [-25.25, -51.75], look: [-29, -67] },
  'galvanic-8': { pos: [-32.75, 51.75], look: [-29, -67] },
  'load-9': { pos: [8.75, -20.25], look: [0, 0] },
  'electrolysis-10': { pos: [44.75, -86.25], look: [-29, -67] },
  'electrolysis-11': { pos: [10.25, -55.25], look: [-29, -67] },
  'electrolysis-12': { pos: [-22.75, -82.25], look: [-29, -67] },
  'galvanic-13': { pos: [-25.25, 24.25], look: [0, 0] },
  'galvanic-14': { pos: [-19.75, 76.75], look: [-29, -67] },
  'potential-15': { pos: [-6.25, 3.25], look: [0, 0] },
  'halves-16': { pos: [-47.25, -67.25], look: [-29, -67] },
  'galvanic-17': { pos: [5.25, 51.25], look: [-29, -67] },
  'halves-18': { pos: [-32.75, -28.25], look: [-29, -67] }
});

export const CREW = Object.freeze([
  {
    id: 'brinewire-super', name: 'Ilse Varga', role: 'Grid supervisor', model: 'town-f018',
    schedule: [
      { post: 'halves-7', act: 'look', for: [20, 30] },
      { post: 'halves-18', act: 'idle', for: [15, 25] },
      { post: 'halves-16', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['Our marsh power grid supplies electricity to every coastal town, and the Fifth Guild\'s illegal clamps are draining it nonstop.'],
        ['We built our power lines across these salty pools because salt water carries electricity well. Now raiders are using that against us.'],
        ['Four power lines are down right now because my whole crew is busy hunting down illegal power taps.']
      ],
      afterClue: {
        clue_brinewire_clamp: [
          ['Tons of pure copper pulled straight out of our pools. That is enough copper wire to power something huge.']
        ]
      }
    }
  },
  {
    id: 'brinewire-lineman', name: 'Dorian Platt', role: 'Lineman', model: 'crew-m101',
    schedule: [
      { post: 'galvanic-1', act: 'idle', for: [20, 30] },
      { post: 'galvanic-17', act: 'idleShift', for: [15, 25] },
      { post: 'galvanic-14', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['Always test a power line and shut off the breaker before touching it. Marsh water makes shocks twice as dangerous.'],
        ['The Fifth Guild\'s clamps bite right through the rubber coating into the live copper wire. Whoever built them knew power grids.'],
        ['We also found pylons rusting badly wherever two different metals were bolted together in the salty air.']
      ]
    }
  },
  {
    id: 'brinewire-pools', name: 'Wendel Graf', role: 'Pool keeper', model: 'yard-m106',
    schedule: [
      { post: 'electrolysis-10', act: 'idleShift', for: [20, 30] },
      { post: 'electrolysis-5', act: 'look', for: [15, 25] },
      { post: 'electrolysis-3', act: 'idle', for: [20, 30] }
    ],
    talk: {
      default: [
        ['These marsh pools used to glow rich blue-green, and now they are turning pale and empty.'],
        ['Dissolved copper gives the salt pools that bright blue color, so someone is pulling the copper right out of the water.'],
        ['Whenever I pull a metal tool out of the pools this week, it comes up coated in shiny red copper.']
      ]
    }
  },
  {
    id: 'brinewire-cells', name: 'Arun Sethi', role: 'Cell technician', model: 'lab-m162',
    schedule: [
      { post: 'load-9', act: 'look', for: [20, 30] },
      { post: 'potential-15', act: 'idle', for: [15, 25] },
      { post: 'electrolysis-11', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I keep the marsh\'s backup batteries running. Each battery is a row of chemical tanks I inspect by hand.'],
        ['When the Fifth Guild cut our connecting salt bridges, every backup battery on the grid died at once.'],
        ['They did not steal our electricity just to cause a blackout. They were powering something inside those pools.']
      ],
      afterBench: {
        'q3-galvanic': [
          ['Building a working chemical battery on your bench shows exactly how our marsh power stations run.']
        ]
      }
    }
  },
  {
    id: 'brinewire-meter', name: 'Noor Haddad', role: 'Meter reader', model: 'town-f004',
    schedule: [
      { post: 'electrolysis-12', act: 'idle', for: [20, 30] },
      { post: 'halves-2', act: 'idleShift', for: [15, 25] },
      { post: 'activity-4', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I check the power meters at every station across the marsh, and every reading plunged on the exact same night.'],
        ['The raiders bypassed our meters completely by clamping cables straight onto the overhead lines.'],
        ['Walking twenty kilometers of wooden boardwalk every week means I spot any new wire running into the pools.']
      ]
    }
  },
  {
    id: 'brinewire-patrol', name: 'Ambrose Tull', role: 'Night patrol', model: 'hand-m110',
    schedule: [
      { post: 'galvanic-13', act: 'idleShift', for: [40, 60] },
      { post: 'galvanic-8', act: 'look', for: [15, 25] },
      { post: 'galvanic-6', act: 'idle', for: [20, 30] }
    ],
    task: 'brinewire-jaw',
    talk: {
      default: [
        ['I patrol the wooden walkways at night. Last week I caught a Fifth Guild crew clamping the lines, though they outran me.']
      ]
    }
  }
]);

/** The side task: no XP and nothing gated; the reward is the thanks and a note on the Case Board. */
export const TASKS = Object.freeze({
  'brinewire-jaw': {
    id: 'brinewire-jaw',
    worldId: 'unit10',
    giver: 'brinewire-patrol',
    item: { label: 'Cut Clamp Jaw', kind: 'metal', pos: [-4.25, -1.75] },
    ask: [
      'When that Fifth Guild crew bolted, one of them chopped their power clamp loose and dropped half of it.',
      'It fell somewhere near the middle boardwalks. Could you grab it for me?'
    ],
    remind: [
      'Check near the middle boardwalks for a heavy steel clamp jaw with teeth.'
    ],
    thanks: [
      'Look at the bright copper crusted right onto the steel teeth. They were using stolen power to plate copper from our pools.',
      'I will hand this straight to the grid supervisor.'
    ],
    note: {
      title: 'Brinewire · Night Patrol Report',
      speaker: 'Ambrose Tull',
      text: 'Half a power clamp dropped by a fleeing Fifth Guild crew, with bright copper plated directly onto its steel teeth.'
    }
  }
});
