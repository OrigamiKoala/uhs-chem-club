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
        ['Our colony shelters stay warm using heat piped up from the volcano below. When someone tapped the pipes, the shelters froze fast.'],
        ['We moved families together into the warmest buildings so everyone stayed safe while the heat was down.'],
        ['People only settled Ember Reach for the volcano heat. Without those pipes, this mountain is freezing.']
      ],
      afterClue: {
        clue_ember_siphon: [
          ['They built a hidden rig underground to steal our colony\'s volcano heat. That takes huge amounts of energy.']
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
        ['These volcano heat pipes are older than I am, so I spend every day patching leaks to keep the shelters warm.'],
        ['Someone cut into our main heat pipe and attached a side branch in the dark. It was fast, professional work.'],
        ['Normally these steam pipes hum loudly with pressure. Since the Fifth Guild tapped them, they have gone dead quiet.']
      ],
      afterBench: {
        'q1-flow': [
          ['Frost on the Fifth Guild\'s pipe proves it is pulling heat inward, straight out of our volcano line.']
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
        ['My sensors track the heat rising through these volcanic vents. The heat flow dropped sharply the night the pipe was tapped.'],
        ['That bright yellow crust around the volcanic vents is sulfur, left behind when hot gas cools in the air.'],
        ['These stepped rock ridges are ancient lava flows stacked on top of each other.']
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
        ['My crew works right beside the hottest volcano vents to repair valves before they fail.'],
        ['The dark lava pools still glow at night, so watch your step near the edges.'],
        ['We wear heavy insulated suits out here because the rock vents can burn straight through normal boots.']
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
        ['With the shelter heaters struggling, I have been cooking hot soup nonstop for the whole colony.'],
        ['Our kitchen stoves run straight off volcanic steam, which saves fuel even if everything smells faintly of sulfur.'],
        ['The kids think ghosts stole our heat, though ghosts do not build heavy steel pipes into a volcano.']
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
        ['I run the steam pumps at the volcano wells. The night the Fifth Guild tapped our line, the main pump nearly stalled.']
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
      'Whoever tapped our main heat pipe tossed the old pipe bolts aside in a hurry.',
      'One bolt landed near the far east steam well. Bring it to me so I can see how they cut it.'
    ],
    remind: [
      'Check near the steam well at the east end of the field for a short cut steel bolt.'
    ],
    thanks: [
      'This bolt was sliced cleanly with a heavy cutter. They opened our main heat pipe deliberately.',
      'I will hand this over to the shelter warden.'
    ],
    note: {
      title: 'Ember Reach · Pump Keeper\'s Note',
      speaker: 'Silas Grey',
      text: 'A steel pipe bolt cut cleanly with a tool near the east steam well, proving the main heat line was tapped on purpose.'
    }
  }
});
