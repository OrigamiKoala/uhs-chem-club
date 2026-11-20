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
        ['The marsh grid powers every town on the coast. The clamps the Fifth hung on it drain power day and night.'],
        ['We built the grid on the salt pools because brine carries current well. Somebody else noticed that too.'],
        ['I have lines down in four places and nobody to fix them. Everyone is busy chasing clamps.']
      ],
      afterClue: {
        clue_brinewire_clamp: [
          ['Tonnes of pure copper, pulled out of our pools. That is enough wire to build something enormous.', 'What are they building?']
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
        ['Never touch a line until you have tested it, grounded it and tested it again.'],
        ['The clamps bite right through the insulation into the wire. Neat, fast work.'],
        ['Up a pole in a marsh wind, you learn to hold on with your knees.']
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
        ['My pools used to be blue-green. Now the edges are bare, like something stripped them.'],
        ['Copper sulfate turns the brine blue. The Fifth\'s clamps are drinking the blue right out of it.'],
        ['I rake the pool edges every morning. This week the rake comes up coated in bright copper.']
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
        ['I maintain the marsh batteries. Each one is a row of tanks, and every tank is checked by hand.'],
        ['The batteries hum when they are healthy. A silent one needs me.'],
        ['The stolen current was not wasted. They used it for something, very deliberately.']
      ],
      afterBench: {
        'q3-galvanic': [
          ['You built a cell that runs by itself. That is my whole job, done on a table.']
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
        ['I read the meters at every substation. The readings dropped the same night across the whole grid.'],
        ['A meter does not lie, but it can be fooled. These were not fooled. They were bypassed.'],
        ['I walk twenty kilometres of boardwalk a week. My boots are on their third soles.']
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
        ['I patrol the pools at night. Last week I chased off a clamp crew. They ran faster than I did.']
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
      'When the clamp crew ran, one of them hacked a clamp off the line and dropped half of it.',
      'It landed somewhere near the middle boardwalks. Find it for me?'
    ],
    remind: [
      'Near the middle boardwalks. A heavy steel jaw with teeth.'
    ],
    thanks: [
      'Bright copper crusted in the teeth. They were pulling metal from the pools straight onto these.',
      'I will hand it to the supervisor.'
    ],
    note: {
      title: 'Brinewire · Night Patrol Report',
      speaker: 'Ambrose Tull',
      text: 'Half a power clamp cut loose by a fleeing crew, its teeth crusted with bright copper from the pools.'
    }
  }
});
