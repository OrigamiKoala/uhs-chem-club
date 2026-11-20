/**
 * thornmere.js — the swamp folk around the Fifth's armoured outpost (Thornmere, unit13). Pure data, no THREE.
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
  'carapace-gate-1': { pos: [30.75, -76.25], look: [44, -83] },
  'chains-1': { pos: [-3.25, 93.25], look: [0, 46] },
  'groups-2': { pos: [-44.75, -11.75], look: [0, 46] },
  'isomers-3': { pos: [56.25, 16.75], look: [0, 46] },
  'polymers-4': { pos: [-40.25, -75.75], look: [0, 46] },
  'chains-5': { pos: [-37.25, 44.75], look: [0, 46] },
  'reactions-6': { pos: [5.75, -29.25], look: [0, 46] },
  'unsat-7': { pos: [5.25, 20.25], look: [0, 46] },
  'isomers-8': { pos: [20.25, 58.75], look: [0, 46] },
  'reactions-9': { pos: [46.75, -45.75], look: [44, -83] },
  'polymers-10': { pos: [-19.75, -49.75], look: [0, 46] },
  'reactions-11': { pos: [62.75, -73.75], look: [44, -83] },
  'chains-12': { pos: [-11.25, 62.25], look: [0, 46] },
  'unsat-13': { pos: [-14.25, -4.25], look: [0, 46] },
  'chains-14': { pos: [-35.25, 15.75], look: [0, 46] },
  'isomers-15': { pos: [31.75, 32.25], look: [0, 46] },
  'reactions-16': { pos: [7.75, -58.25], look: [0, 46] },
  'polymers-17': { pos: [-47.25, -49.25], look: [0, 46] }
});

export const CREW = Object.freeze([
  {
    id: 'thornmere-guide', name: 'Morwen Ashby', role: 'Swamp guide', model: 'town-f017',
    schedule: [
      { post: 'chains-12', act: 'look', for: [20, 30] },
      { post: 'chains-5', act: 'idle', for: [15, 25] },
      { post: 'isomers-8', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['The thorn swamp hides its paths. Stay on the mounds and you stay dry, mostly.'],
        ['The Fifth built their outpost on the only solid ground for miles. They chose well.'],
        ['At night the outpost hums. Not voices. Machines.']
      ],
      afterClue: {
        clue_thornmere_carapace: [
          ['Lead under the plastic. You only build like that if you fear what is inside.', 'So what is inside?']
        ]
      }
    }
  },
  {
    id: 'thornmere-reeds', name: 'Elias Fenn', role: 'Reed cutter', model: 'yard-m106',
    schedule: [
      { post: 'reactions-11', act: 'idle', for: [20, 30] },
      { post: 'carapace-gate-1', act: 'idleShift', for: [15, 25] },
      { post: 'reactions-9', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I cut reeds for thatch. The reeds by the outpost have gone grey and brittle.'],
        ['A good reed bends. A dead one snaps. More of them snap every week.'],
        ['Mind the thorns. They catch cloth and they do not let go.']
      ]
    }
  },
  {
    id: 'thornmere-chemist', name: 'Ivo Kalnins', role: 'Field chemist', model: 'lab-m154',
    schedule: [
      { post: 'polymers-17', act: 'idleShift', for: [20, 30] },
      { post: 'polymers-4', act: 'look', for: [15, 25] },
      { post: 'polymers-10', act: 'idle', for: [20, 30] }
    ],
    talk: {
      default: [
        ['The outpost armour is plastic, but tough. I tried a blade on an offcut and the blade bent.'],
        ['I test the swamp water for oils and gases. Thornmere has plenty of both.'],
        ['Swamp gas bubbles up wherever you step. It burns, so no open flames near the mounds.']
      ],
      afterBench: {
        'q1-chains': [
          ['You built carbon chains on the bench. The armour is made the same way, only much, much longer.']
        ]
      }
    }
  },
  {
    id: 'thornmere-salvage', name: 'Brann Hollow', role: 'Salvager', model: 'crew-m111',
    schedule: [
      { post: 'isomers-3', act: 'look', for: [20, 30] },
      { post: 'isomers-15', act: 'idle', for: [15, 25] },
      { post: 'unsat-7', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I pull useful things out of the swamp. Old pumps, old pipe. The Fifth throw away good gear.'],
        ['The armour plates are heavier than they look. I could barely lift a corner of one.'],
        ['Whatever they are hiding, they have spent a fortune keeping it hidden.']
      ]
    }
  },
  {
    id: 'thornmere-medic', name: 'Tamsin Orr', role: 'Outpost medic', model: 'medic-f154',
    schedule: [
      { post: 'groups-2', act: 'idle', for: [20, 30] },
      { post: 'chains-14', act: 'idleShift', for: [15, 25] },
      { post: 'unsat-13', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I treat thorn cuts and swamp fever, mostly. Keep your cuts clean and covered.'],
        ['Two of the salvage crew came back from the outpost fence feeling sick. No fever, no cut. Just sick.'],
        ['Boil the water. Then boil it again. The swamp is not kind to stomachs.']
      ]
    }
  },
  {
    id: 'thornmere-lookout', name: 'Gideon Marsh', role: 'Lookout', model: 'crew-m101',
    schedule: [
      { post: 'chains-1', act: 'idleShift', for: [40, 60] },
      { post: 'reactions-6', act: 'look', for: [15, 25] },
      { post: 'reactions-16', act: 'idle', for: [20, 30] }
    ],
    task: 'thornmere-thread',
    talk: {
      default: [
        ['I watch the outpost from the high mound. Hooded figures go in. Fewer come out.']
      ]
    }
  }
]);

/** The side task: no XP and nothing gated; the reward is the thanks and a note on the Case Board. */
export const TASKS = Object.freeze({
  'thornmere-thread': {
    id: 'thornmere-thread',
    worldId: 'unit13',
    giver: 'thornmere-lookout',
    item: { label: 'Torn Cloak Thread', kind: 'cloth', pos: [31.75, -70.25] },
    ask: [
      'Last night one of the hooded figures snagged a cloak on the thorns near the outpost gate.',
      'Pull what is left off the thorns and bring it here. Stay off the gate\'s ground.'
    ],
    remind: [
      'The thorns near the outpost gate. A tuft of dark cloth.'
    ],
    thanks: [
      'Dark grey, heavy weave. The watchman on Tallow described cloaks just like this.',
      'Same people, every world.'
    ],
    note: {
      title: 'Thornmere · Lookout\'s Find',
      speaker: 'Gideon Marsh',
      text: 'Dark grey cloak cloth torn on the thorns by the outpost gate. It matches the cloaks the Tallow night watch described.'
    }
  }
});
