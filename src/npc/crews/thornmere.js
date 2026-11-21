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
        ['Stay on the dry earth mounds while crossing this swamp so you do not sink into the mud.'],
        ['The Fifth Guild built their armored swamp outpost on the only solid patch of ground for miles.'],
        ['At night you can hear heavy chemical machines humming loudly behind those plastic armor walls.']
      ],
      afterClue: {
        clue_thornmere_carapace: [
          ['Heavy lead plates hidden underneath the plastic armor. You only shield a building with lead if something inside gives off radiation.']
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
        ['I harvest marsh reeds for roofing, and the reeds growing near the Fifth Guild outpost have turned grey and brittle.'],
        ['Healthy marsh reeds bend easily in the wind, yet the plants near their drainage pipes snap right in half.'],
        ['Watch out for the thick thorn bushes around the trails because they shred jackets fast.']
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
        ['The Fifth Guild\'s outpost armor is made of super-tough plastic. I tried slicing a scrap piece and bent my knife blade.'],
        ['I test the swamp pools for natural oils and black tar, which the Fifth Guild hauls into their plant every night.'],
        ['Flammable swamp gas bubbles up wherever you step, so keep open flames far away from the mud.']
      ],
      afterBench: {
        'q1-chains': [
          ['Now that you tested the swamp tar\'s carbon chains, you can see what raw material they use to build that plastic armor.']
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
        ['I salvage old pumps and steel pipes from the marsh, and the Fifth Guild dumps expensive gear right in the mud.'],
        ['Those plastic armor panels are way too heavy to be plain plastic. I could barely lift one corner off the ground.'],
        ['Whatever the Fifth Guild is hiding inside that outpost, they spent a fortune sealing it up.']
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
        ['Usually I treat thorn scratches and swamp colds, so keep any cuts clean and bandaged out here.'],
        ['Two salvagers came back from the Fifth Guild\'s fence feeling deeply sick even with zero fever or injury.'],
        ['Always boil swamp water before drinking it, especially anywhere downstream of the Fifth Guild\'s plant.']
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
        ['I watch the Fifth Guild outpost from the high ridge, and hooded crews keep hauling heavy drums inside every night.']
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
      'Last night one of the hooded Fifth Guild workers snagged their cloak on the thorns near the outpost gate.',
      'Could you grab that torn cloth for me? Just stay clear of the gate itself.'
    ],
    remind: [
      'Check the thorn bushes near the outpost gate for a snag of dark grey cloth.'
    ],
    thanks: [
      'Heavy dark grey fabric, the exact same cloak cloth the night watch on Tallow described.',
      'It really is the same Fifth Guild crew operating across every world.'
    ],
    note: {
      title: 'Thornmere · Lookout\'s Find',
      speaker: 'Gideon Marsh',
      text: 'Dark grey cloak cloth torn on the thorns near the outpost gate, matching the cloaks seen during the raid on Tallow.'
    }
  }
});
