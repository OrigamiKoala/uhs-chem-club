/**
 * kettle.js — the foundry crews whose iron ledger does not add up (Kettle, unit07). Pure data, no THREE.
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
  'kinds-1': { pos: [22.25, -76.75], look: [0, 76] },
  'names-2': { pos: [72.25, 94.75], look: [0, 76] },
  'change-3': { pos: [-39.75, 33.75], look: [0, 76] },
  'titrate-4': { pos: [47.25, 9.25], look: [0, 76] },
  'hsab-5': { pos: [-48.25, -44.75], look: [0, 76] },
  'names-6': { pos: [-0.75, 94.75], look: [0, 76] },
  'balance-7': { pos: [3.25, -24.25], look: [0, 0] },
  'names-8': { pos: [35.25, 58.75], look: [0, 76] },
  'names-9': { pos: [4.75, 24.75], look: [0, 0] },
  'kinds-10': { pos: [41.25, -40.25], look: [0, 76] },
  'hsab-11': { pos: [-18.75, -73.75], look: [0, 76] },
  'ionic-12': { pos: [-33.25, -6.25], look: [0, 0] },
  'change-13': { pos: [-11.75, 58.75], look: [0, 76] },
  'names-14': { pos: [35.75, 94.75], look: [0, 76] },
  'names-15': { pos: [70.75, 59.75], look: [0, 76] },
  'stoich-16': { pos: [19.75, -0.25], look: [0, 0] },
  'hsab-17': { pos: [-19.25, -44.75], look: [0, 76] },
  'change-18': { pos: [-26.25, 83.25], look: [0, 76] }
});

export const CREW = Object.freeze([
  {
    id: 'kettle-boss', name: 'Magda Rusk', role: 'Furnace boss', model: 'crew-f101',
    schedule: [
      { post: 'names-6', act: 'look', for: [20, 30] },
      { post: 'change-18', act: 'idle', for: [15, 25] },
      { post: 'names-14', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['The furnaces never stopped while the Fifth held the works. They kept pouring iron day and night.'],
        ['A furnace is a hungry thing. Feed it ore and fuel and air, and it gives you iron and slag.'],
        ['My crew was locked out of our own foundry for a week. Somebody ran it without us.']
      ],
      afterClue: {
        clue_kettle_ledger: [
          ['The numbers never added up because the iron never came from our ore.', 'So where did it come from? That is the real question.']
        ]
      }
    }
  },
  {
    id: 'kettle-weigh', name: 'Aurelio Benn', role: 'Weighmaster', model: 'town-m007',
    schedule: [
      { post: 'kinds-1', act: 'idle', for: [20, 30] },
      { post: 'hsab-11', act: 'idleShift', for: [15, 25] },
      { post: 'kinds-10', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['Every load in and every load out crosses my scale. My numbers have always balanced. Until now.'],
        ['A scale is only honest if someone checks it. I check mine every morning with a test weight.'],
        ['The shipping log claims more iron left than ore came in. My scale never saw that iron arrive.']
      ],
      afterBench: {
        'q6-stoich': [
          ['You worked out what the ore can really make. I have been saying that for weeks.']
        ]
      }
    }
  },
  {
    id: 'kettle-furnace', name: 'Toma Grieg', role: 'Furnace hand', model: 'fire-m134',
    schedule: [
      { post: 'ionic-12', act: 'idleShift', for: [20, 30] },
      { post: 'change-3', act: 'look', for: [15, 25] },
      { post: 'balance-7', act: 'idle', for: [20, 30] }
    ],
    talk: {
      default: [
        ['The heat at the tap hole would cook you in a minute. That is why we wear suits like this.'],
        ['Slag floats on top of the molten iron. We skim it off and it cools into grey glass.'],
        ['The Fifth ran the furnaces hotter than we ever do. The bricks inside are scorched.']
      ]
    }
  },
  {
    id: 'kettle-loader', name: 'Nils Corran', role: 'Ore loader', model: 'crew-m103',
    schedule: [
      { post: 'titrate-4', act: 'look', for: [20, 30] },
      { post: 'stoich-16', act: 'idle', for: [15, 25] },
      { post: 'names-9', act: 'idleShift', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I shovel ore into the charging carts. You know you are working when your arms stop hurting and go numb.'],
        ['Ore is mostly rock. The iron is a part of it, never all of it.'],
        ['Some of the carts that came in that week were not from our mine. Different colour dust.']
      ]
    }
  },
  {
    id: 'kettle-assayer', name: 'Hana Ostrova', role: 'Assayer', model: 'lab-f153',
    schedule: [
      { post: 'names-15', act: 'idle', for: [20, 30] },
      { post: 'names-2', act: 'idleShift', for: [15, 25] },
      { post: 'names-8', act: 'look', for: [20, 30] }
    ],
    talk: {
      default: [
        ['I test every batch of ore before it goes in the furnace. Batches from the same seam test the same.'],
        ['A recipe in a foundry is like one in a kitchen. Get the amounts wrong and nothing comes out right.'],
        ['I wrote my findings down twice and locked one copy away. After this, I will always do that.']
      ],
      afterBench: {
        'q4-balance': [
          ['You balanced the equations by counting atoms, the way a weighmaster counts loads.']
        ]
      }
    }
  },
  {
    id: 'kettle-clerk', name: 'Felix Ambry', role: 'Night clerk', model: 'town-m009',
    schedule: [
      { post: 'hsab-5', act: 'idleShift', for: [40, 60] },
      { post: 'hsab-17', act: 'look', for: [15, 25] },
      { post: 'change-13', act: 'idle', for: [20, 30] }
    ],
    task: 'kettle-page',
    talk: {
      default: [
        ['I kept the night log while the Fifth ran the works. They made me write what they said.']
      ]
    }
  }
]);

/** The side task: no XP and nothing gated; the reward is the thanks and a note on the Case Board. */
export const TASKS = Object.freeze({
  'kettle-page': {
    id: 'kettle-page',
    worldId: 'unit07',
    giver: 'kettle-clerk',
    item: { label: 'Torn Log Page', kind: 'paper', pos: [0.25, 4.75] },
    ask: [
      'Before they took my log away, I tore out the page with the real tally and threw it out the window.',
      'It should still be somewhere in the yard by the roads. Will you look?'
    ],
    remind: [
      'Somewhere near the middle of the yard. A crumpled page with my handwriting.'
    ],
    thanks: [
      'My real tally. Then someone crossed it out and wrote a bigger number over the top.',
      'The weighmaster needs to see this.'
    ],
    note: {
      title: 'Kettle · Night Clerk\'s Page',
      speaker: 'Felix Ambry',
      text: 'A page torn from the foundry\'s night log. The real tally is crossed out and a bigger number written over it.'
    }
  }
});
