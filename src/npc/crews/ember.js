/**
 * ember.js — the colonists who keep the volcano shelters warm (Ember Reach, unit05). Pure data, no THREE.
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
  'comms-mast-1': { pos: [83.75, 90.75], look: [84, 98] },
  'transformer-1': { pos: [-45.25, -12.75], look: [-44, -22] },
  'siphon-manifold-1': { pos: [-22.75, -54.25], look: [-31.5, -54] },
  'wellhead-1': { pos: [90.75, 65.75], look: [96, 66] },
  'gibbs-1': { pos: [74.75, -33.25], look: [86, -40] },
  'flow-2': { pos: [-1.25, 64.25], look: [26, 66] },
  'enthalpy-3': { pos: [33.25, 12.75], look: [26, 66] },
  'enthalpy-4': { pos: [85.75, 15.75], look: [96, 14] },
  'gibbs-5': { pos: [24.75, -37.75], look: [32, -56] },
  'calorimetry-6': { pos: [44.75, 61.75], look: [26, 66] },
  'bonds-7': { pos: [-11.25, 16.75], look: [-42, 38] },
  'hess-8': { pos: [-66.75, 16.75], look: [-78, 18] },
  'gibbs-9': { pos: [9.75, -70.75], look: [34, -64] },
  'calorimetry-10': { pos: [23.25, 89.75], look: [26, 66] },
  'flow-11': { pos: [-28.75, 45.75], look: [-42, 38] },
  'entropy-12': { pos: [3.25, -12.75], look: [26, 66] },
  'gibbs-13': { pos: [56.75, -7.75], look: [86, -10] },
  'calorimetry-14': { pos: [18.75, 40.25], look: [26, 66] }
});

export const CREW = Object.freeze([
  {
    id: 'ember-warden', name: 'Agnes Thorne', role: 'Shelter warden', model: 'town-f018',
    schedule: [
      { post: 'calorimetry-6', act: 'look', for: [20, 30] },
      { post: 'calorimetry-14', act: 'idle', for: [15, 25] },
      { post: 'calorimetry-10', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['The shelters run on volcano heat piped up from below. When the pipes were tapped, the cold came in fast.'],
        ['We doubled up families in the warmest shelters. Nobody slept alone that week.'],
        ['Ember Reach was settled for the heat. Without it, this is just a cold mountain.']
      ],
      afterClue: {
        clue_ember_siphon: [
          ['A hidden rig, drinking our heat underground. All that warmth, and they used it to run machines.', 'We will not forget that.']
        ]
      }
    }
  },
  {
    id: 'ember-fitter', name: 'Ruben Acker', role: 'Pipe fitter', model: 'crew-m102',
    schedule: [
      { post: 'gibbs-9', act: 'idle', for: [20, 30] },
      { post: 'gibbs-5', act: 'idleShift', for: [15, 25] },
      { post: 'siphon-manifold-1', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['The heat pipes are older than I am. I patch them, and they keep going.'],
        ['Somebody spliced a second line into the main. Neat work, done fast, in the dark.'],
        ['Steam pipes sing when the pressure is right. These have been quiet for days.']
      ],
      afterBench: {
        'q1-flow': [
          ['You followed the heat from hot to cold. That is what my pipes do, all day, every day.']
        ]
      }
    }
  },
  {
    id: 'ember-geologist', name: 'Theo Mbeki', role: 'Vent geologist', model: 'lab-m162',
    schedule: [
      { post: 'hess-8', act: 'idleShift', for: [20, 30] },
      { post: 'transformer-1', act: 'look', for: [15, 25] },
      { post: 'flow-11', act: 'idle', for: [20, 30] }
    ],
    talk: {
      default: [
        ['The volcano breathes through these vents. I listen to it with instruments, and it has been quieter since the tap.'],
        ['Yellow crust around a vent is sulfur. It forms where hot gas meets cold air.'],
        ['The terraces here are old lava flows, one on top of the other, like the pages of a book.']
      ]
    }
  },
  {
    id: 'ember-heatcrew', name: 'Lars Brennan', role: 'Heat crew', model: 'fire-m138',
    schedule: [
      { post: 'enthalpy-4', act: 'look', for: [20, 30] },
      { post: 'gibbs-13', act: 'idle', for: [15, 25] },
      { post: 'gibbs-1', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['My job is to get close to things that are too hot, and fix them before they get hotter.'],
        ['The lava lobes still glow at night. Do not let that fool you into thinking they are soft.'],
        ['Heat suits are heavy. Climbing the terraces in one is the hardest part of the job.']
      ]
    }
  },
  {
    id: 'ember-cook', name: 'Wren Oduya', role: 'Shelter cook', model: 'town-f004',
    schedule: [
      { post: 'comms-mast-1', act: 'idle', for: [20, 30] },
      { post: 'wellhead-1', act: 'idleShift', for: [15, 25] },
      { post: 'flow-2', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['Soup keeps people warm from the inside. I have made more soup this week than all last year.'],
        ['I cook on a vent stove. Free heat, if you do not mind the smell of sulfur in your bread.'],
        ['The children think the Fifth are ghosts in the pipes. I tell them ghosts do not need heat.']
      ]
    }
  },
  {
    id: 'ember-pumps', name: 'Silas Grey', role: 'Pump keeper', model: 'yard-m106',
    schedule: [
      { post: 'bonds-7', act: 'idleShift', for: [40, 60] },
      { post: 'entropy-12', act: 'look', for: [15, 25] },
      { post: 'enthalpy-3', act: 'idle', for: [20, 30] }
    ],
    task: 'ember-bolt',
    talk: {
      default: [
        ['I keep the pumps by the wellheads. The night they tapped the line, the main pump nearly ran dry.']
      ]
    }
  }
]);

/** The side task: no XP and nothing gated; the reward is the thanks and a note on the Case Board. */
export const TASKS = Object.freeze({
  'ember-bolt': {
    id: 'ember-bolt',
    worldId: 'unit05',
    giver: 'ember-pumps',
    item: { label: 'Sheared Pipe Bolt', kind: 'bolt', pos: [90.75, 70.75] },
    ask: [
      'Whoever tapped the main line threw the old fittings aside in a hurry.',
      'One bolt went over by the far wellhead. Find it and I will tell you how they did it.'
    ],
    remind: [
      'The wellhead at the east end of the field. A short steel bolt, cut clean.'
    ],
    thanks: [
      'Cut with a tool, not melted. They opened our main line on purpose, with time to spare.',
      'I will keep this for the warden.'
    ],
    note: {
      title: 'Ember Reach · Pump Keeper\'s Note',
      speaker: 'Silas Grey',
      text: 'A pipe bolt cut clean by a tool near the east wellhead. The main heat line was opened on purpose.'
    }
  }
});
