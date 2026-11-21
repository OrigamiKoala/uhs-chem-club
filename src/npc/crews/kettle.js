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
        ['While the Fifth Guild held our iron foundry, they ran the furnaces nonstop day and night.'],
        ['Our furnaces melt iron ore using fuel and hot air, separating pure liquid iron from leftover rock waste.'],
        ['They locked my entire crew out of our own foundry for a whole week and ran the machines themselves.']
      ],
      afterClue: {
        clue_kettle_ledger: [
          ['Our shipping numbers failed to add up because the extra iron never came from our ore.', 'Where did all that extra iron come from?']
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
        ['Every load of ore coming in and iron going out crosses my scale, and my numbers always matched until the Fifth Guild arrived.'],
        ['I test my scale with a standard iron weight every morning, so I know the scale itself is accurate.'],
        ['The shipping log claims more iron left the foundry than ore ever came in, which makes zero sense.']
      ],
      afterBench: {
        'q6-stoich': [
          ['Your math proved how much iron our ore can actually produce. I knew that shipping log was impossible.']
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
        ['The glowing spout where melted iron pours out is so hot we have to wear full heat suits near it.'],
        ['Leftover melted rock, called slag, floats on top of the liquid iron so we can skim it off.'],
        ['The Fifth Guild ran our furnaces way hotter than normal, scorching the firebricks right inside the walls.']
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
        ['My job is shoveling raw iron ore into the carts that feed the furnaces.'],
        ['Raw ore is mostly oxygen and rock mixed with iron, so you always get less iron out than the weight of ore put in.'],
        ['During the takeover, some ore carts rolled in covered in strange dark dust from outside our mine.']
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
        ['I test every batch of ore before it enters the furnace so we know exactly how much iron it holds.'],
        ['Smelting iron works like a kitchen recipe: if you get the ingredient amounts wrong, the batch fails.'],
        ['After the Fifth Guild altered our foundry records, I started locking a backup copy of my lab notes in a safe.']
      ],
      afterBench: {
        'q4-balance': [
          ['Counting atoms on both sides of the furnace recipe works just like checking the weighmaster\'s scale.']
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
        ['I kept the night logbook while the Fifth Guild ran our foundry. They forced me to write down fake numbers.']
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
      'Before they took my logbook, I tore out the page with the real iron weights and tossed it out the window.',
      'It should still be lying out in the yard near the roads. Could you grab it for me?'
    ],
    remind: [
      'Look near the middle of the foundry yard for a crumpled logbook page with my handwriting.'
    ],
    thanks: [
      'Here are my real weight numbers, with someone else\'s fake higher number scribbled right over the top.',
      'I need to show this to the weighmaster immediately.'
    ],
    note: {
      title: 'Kettle · Night Clerk\'s Page',
      speaker: 'Felix Ambry',
      text: 'A torn logbook page showing the foundry\'s real iron weights crossed out and replaced with a much larger fake number.'
    }
  }
});
