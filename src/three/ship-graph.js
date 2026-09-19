/**
 * ship-graph.js — Ship traversal graph and walkPath splines (pure data)
 *
 * WHAT CHANGED WHEN THE SHIP GREW WALLS.
 *
 * This graph used to describe a hub: every compartment was a marker in one
 * open room, so "adjacent" meant "you can see it from here" and a hatch
 * marker was wherever the two anchors happened to face.
 *
 * The Avalon is now a spine with compartments off it. Two nodes are adjacent
 * when **one corridor run joins them** — the bridge and its two other stations
 * share a room, and everything else is reached by walking the spine. A
 * `hatchPos` is no longer a guess: it is the DOORWAY a player actually passes
 * through, taken from `ship-rooms.js`, which is why `verify:ship` can now
 * assert that every one of them sits in a real opening instead of merely
 * inside somebody's view cone.
 *
 * Every `walkPath` follows the corridor. That is the point of the file: at T3
 * the camera is dollied along these splines, and a spline drawn straight from
 * one room to another would now be a camera passing through a bulkhead.
 */

export const SHIP_GRAPH = {
  nodes: {
    bridge: {
      name: 'Command Bridge',
      pos: [0, 1.55, 1.3],
      target: [0, 1.4, 4.6],
      adjacent: ['cockpit', 'starmap', 'quarters', 'cargo'],
      lookLimits: { yaw: 90, pitch: 30 },
      hatchPos: {
        cockpit: [0, 1.45, 2.4],
        starmap: [1.4, 1.55, 1.55],
        quarters: [-0.95, 1.5, -0.9],
        cargo: [0.95, 1.5, -1.2]
      },
      walkPath: {
        cockpit: [
          [0, 1.55, 1.3],
          [0, 1.50, 2.2],
          [0, 1.45, 3.05]
        ],
        starmap: [
          [0, 1.55, 1.3],
          [0.9, 1.55, 1.45],
          [1.9, 1.55, 1.6]
        ],
        quarters: [
          [0, 1.55, 1.3],
          [0, 1.52, -0.2],
          [-0.7, 1.52, -1.2],
          [-2.0, 1.54, -1.2],
          [-3.2, 1.55, -1.2]
        ],
        cargo: [
          [0, 1.55, 1.3],
          [0, 1.52, -0.2],
          [0.7, 1.52, -1.2],
          [1.9, 1.54, -1.1],
          [3.3, 1.55, -1.0]
        ]
      }
    },

    cockpit: {
      name: 'Flight Pods',
      pos: [0, 1.45, 3.05],
      target: [0, 1.4, 12],
      adjacent: ['bridge'],
      lookLimits: { yaw: 80, pitch: 25 },
      hatchPos: {
        bridge: [0, 1.5, 2.2]
      },
      walkPath: {
        bridge: [
          [0, 1.45, 3.05],
          [0, 1.50, 2.2],
          [0, 1.55, 1.3]
        ]
      }
    },

    starmap: {
      name: 'Star Map & Navigation',
      pos: [1.9, 1.55, 1.6],
      target: [3.5, 1.1, 2.1],
      adjacent: ['bridge'],
      lookLimits: { yaw: 90, pitch: 30 },
      hatchPos: {
        bridge: [0.9, 1.55, 1.45]
      },
      walkPath: {
        bridge: [
          [1.9, 1.55, 1.6],
          [0.9, 1.55, 1.45],
          [0, 1.55, 1.3]
        ]
      }
    },

    quarters: {
      name: 'Crew Berth A',
      pos: [-3.2, 1.55, -1.2],
      target: [-4.6, 1.2, -1.6],
      adjacent: ['bridge', 'comms', 'cargo'],
      lookLimits: { yaw: 90, pitch: 25 },
      hatchPos: {
        bridge: [-0.95, 1.5, -0.9],
        comms: [-0.95, 1.5, -0.9],
        cargo: [-0.95, 1.5, -0.9]
      },
      walkPath: {
        bridge: [
          [-3.2, 1.55, -1.2],
          [-2.0, 1.54, -1.2],
          [-0.7, 1.52, -1.2],
          [0, 1.52, -0.2],
          [0, 1.55, 1.3]
        ],
        comms: [
          [-3.2, 1.55, -1.2],
          [-0.7, 1.53, -0.9],
          [-0.7, 1.53, -3.6],
          [-0.7, 1.53, -6.45],
          [-3.3, 1.55, -6.3]
        ],
        cargo: [
          [-3.2, 1.55, -1.2],
          [-0.7, 1.53, -0.9],
          [0.7, 1.53, -1.1],
          [1.9, 1.54, -1.1],
          [3.3, 1.55, -1.0]
        ]
      }
    },

    cargo: {
      name: 'Storage',
      pos: [3.3, 1.55, -1.0],
      target: [4.9, 1.1, -1.2],
      adjacent: ['bridge', 'quarters', 'airlock'],
      lookLimits: { yaw: 95, pitch: 30 },
      hatchPos: {
        bridge: [0.95, 1.5, -1.2],
        quarters: [0.95, 1.5, -1.2],
        airlock: [0.95, 1.5, -1.2]
      },
      walkPath: {
        bridge: [
          [3.3, 1.55, -1.0],
          [1.9, 1.54, -1.1],
          [0.7, 1.52, -1.2],
          [0, 1.52, -0.2],
          [0, 1.55, 1.3]
        ],
        quarters: [
          [3.3, 1.55, -1.0],
          [1.9, 1.54, -1.1],
          [0.7, 1.53, -1.1],
          [-0.7, 1.53, -0.9],
          [-3.2, 1.55, -1.2]
        ],
        airlock: [
          [3.3, 1.55, -1.0],
          [1.9, 1.54, -1.1],
          [0.7, 1.53, -1.2],
          [0.7, 1.53, -4.2],
          [0.7, 1.55, -6.6],
          [3.4, 1.6, -6.6]
        ]
      }
    },

    comms: {
      name: 'Comms',
      pos: [-3.3, 1.55, -6.3],
      target: [-3.4, 1.1, -7.7],
      adjacent: ['quarters', 'airlock'],
      lookLimits: { yaw: 95, pitch: 30 },
      hatchPos: {
        quarters: [-0.95, 1.5, -6.45],
        airlock: [-0.95, 1.5, -6.45]
      },
      walkPath: {
        quarters: [
          [-3.3, 1.55, -6.3],
          [-0.7, 1.53, -6.45],
          [-0.7, 1.53, -3.6],
          [-0.7, 1.53, -0.9],
          [-3.2, 1.55, -1.2]
        ],
        airlock: [
          [-3.3, 1.55, -6.3],
          [-0.7, 1.53, -6.45],
          [0.7, 1.55, -6.6],
          [3.4, 1.6, -6.6]
        ]
      }
    },

    airlock: {
      name: 'Airlock & Departure',
      pos: [3.4, 1.6, -6.6],
      target: [5.6, 1.4, -6.6],
      adjacent: ['cargo', 'comms'],
      lookLimits: { yaw: 95, pitch: 25 },
      hatchPos: {
        cargo: [0.95, 1.55, -6.6],
        comms: [0.95, 1.55, -6.6]
      },
      walkPath: {
        cargo: [
          [3.4, 1.6, -6.6],
          [0.7, 1.55, -6.6],
          [0.7, 1.53, -4.2],
          [0.7, 1.53, -1.2],
          [1.9, 1.54, -1.1],
          [3.3, 1.55, -1.0]
        ],
        comms: [
          [3.4, 1.6, -6.6],
          [0.7, 1.55, -6.6],
          [-0.7, 1.53, -6.45],
          [-3.3, 1.55, -6.3]
        ]
      }
    }
  },

  routeBinding: {
    '#/bridge': 'bridge',
    '#/starmap': 'starmap',
    '#/quarters': 'quarters',
    '#/inventory': 'cargo',
    '#/leaderboard': 'comms',
    '#/settings': 'cockpit',
    '#/quest': 'airlock'
  }
};
