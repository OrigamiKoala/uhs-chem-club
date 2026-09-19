/**
 * ship-graph.js — Ship traversal graph and walkPath splines (pure data)
 * Encodes adjacency, hatch picking positions, look limits, and continuous walk splines.
 */

export const SHIP_GRAPH = {
  nodes: {
    bridge: {
      name: 'Command Bridge',
      pos: [0, 1.55, 2.0],
      target: [0, 1.35, -20],
      adjacent: ['cockpit', 'starmap', 'quarters', 'comms', 'airlock'],
      lookLimits: { yaw: 85, pitch: 30 },
      hatchPos: {
        cockpit: [0, 1.45, 0.5],
        starmap: [1.8, 1.6, 0.8],
        quarters: [-1.8, 1.6, 0.8],
        comms: [-1.2, 1.6, 0.5],
        airlock: [0, 1.7, -1.0]
      },
      walkPath: {
        cockpit: [
          [0, 1.55, 2.0],
          [0, 1.50, 1.8],
          [0, 1.45, 1.6]
        ],
        starmap: [
          [0, 1.55, 2.0],
          [1.2, 1.60, 2.0],
          [2.2, 1.70, 1.9],
          [3.2, 1.80, 1.8]
        ],
        quarters: [
          [0, 1.55, 2.0],
          [-1.4, 1.58, 2.1],
          [-2.6, 1.60, 2.15],
          [-3.8, 1.60, 2.2]
        ],
        comms: [
          [0, 1.55, 2.0],
          [-1.0, 1.60, 1.0],
          [-1.8, 1.70, 0.0],
          [-2.4, 1.75, -1.0],
          [-2.8, 1.80, -2.0]
        ],
        airlock: [
          [0, 1.55, 2.0],
          [0, 1.60, 0.5],
          [0, 1.68, -1.5],
          [0, 1.74, -3.0],
          [0, 1.80, -4.5]
        ]
      }
    },
    cockpit: {
      name: 'Flight Cockpit',
      pos: [0, 1.45, 1.6],
      target: [0, 1.35, -20],
      adjacent: ['bridge'],
      lookLimits: { yaw: 70, pitch: 25 },
      hatchPos: {
        bridge: [0.6, 1.40, 0.8]
      },
      walkPath: {
        bridge: [
          [0, 1.45, 1.6],
          [0, 1.50, 1.8],
          [0, 1.55, 2.0]
        ]
      }
    },
    starmap: {
      name: 'Star Map & Navigation',
      pos: [3.2, 1.8, 1.8],
      target: [3.2, 0.9, 0],
      adjacent: ['bridge', 'cargo'],
      lookLimits: { yaw: 85, pitch: 30 },
      hatchPos: {
        bridge: [2.0, 1.6, 0.6],
        cargo: [3.8, 1.6, 0.4]
      },
      walkPath: {
        bridge: [
          [3.2, 1.80, 1.8],
          [2.2, 1.70, 1.9],
          [1.2, 1.60, 2.0],
          [0, 1.55, 2.0]
        ],
        cargo: [
          [3.2, 1.80, 1.8],
          [3.6, 1.75, 0.6],
          [3.9, 1.70, -0.8],
          [4.2, 1.60, -2.2]
        ]
      }
    },
    quarters: {
      name: 'Crew Quarters',
      pos: [-3.8, 1.6, 2.2],
      target: [-3.8, 1.2, 0],
      adjacent: ['bridge', 'comms'],
      lookLimits: { yaw: 80, pitch: 25 },
      hatchPos: {
        bridge: [-2.6, 1.6, 0.8],
        comms: [-3.2, 1.6, 0.6]
      },
      walkPath: {
        bridge: [
          [-3.8, 1.60, 2.2],
          [-2.6, 1.60, 2.15],
          [-1.4, 1.58, 2.1],
          [0, 1.55, 2.0]
        ],
        comms: [
          [-3.8, 1.60, 2.2],
          [-3.4, 1.65, 1.0],
          [-3.0, 1.72, -0.6],
          [-2.8, 1.80, -2.0]
        ]
      }
    },
    cargo: {
      name: 'Cargo Hold',
      pos: [4.2, 1.6, -2.2],
      target: [4.2, 1.0, -4.2],
      adjacent: ['starmap', 'comms', 'airlock'],
      lookLimits: { yaw: 90, pitch: 30 },
      hatchPos: {
        starmap: [4.6, 1.6, -3.2],
        comms: [2.6, 1.6, -3.4],
        airlock: [1.8, 1.7, -3.8]
      },
      walkPath: {
        starmap: [
          [4.2, 1.60, -2.2],
          [3.9, 1.70, -0.8],
          [3.6, 1.75, 0.6],
          [3.2, 1.80, 1.8]
        ],
        comms: [
          [4.2, 1.60, -2.2],
          [2.4, 1.65, -2.1],
          [0.0, 1.68, -2.1],
          [-1.5, 1.72, -2.05],
          [-2.8, 1.80, -2.0]
        ],
        airlock: [
          [4.2, 1.60, -2.2],
          [2.6, 1.68, -3.0],
          [1.2, 1.74, -3.8],
          [0, 1.80, -4.5]
        ]
      }
    },
    comms: {
      name: 'Comms Array',
      pos: [-2.8, 1.8, -2.0],
      target: [-2.8, 1.2, -3.8],
      adjacent: ['bridge', 'quarters', 'cargo'],
      lookLimits: { yaw: 85, pitch: 30 },
      hatchPos: {
        bridge: [-1.6, 1.6, -3.2],
        quarters: [-3.6, 1.6, -3.2],
        cargo: [-1.2, 1.6, -3.6]
      },
      walkPath: {
        bridge: [
          [-2.8, 1.80, -2.0],
          [-2.4, 1.75, -1.0],
          [-1.8, 1.70, 0.0],
          [-1.0, 1.60, 1.0],
          [0, 1.55, 2.0]
        ],
        quarters: [
          [-2.8, 1.80, -2.0],
          [-3.0, 1.72, -0.6],
          [-3.4, 1.65, 1.0],
          [-3.8, 1.60, 2.2]
        ],
        cargo: [
          [-2.8, 1.80, -2.0],
          [-1.5, 1.72, -2.05],
          [0.0, 1.68, -2.1],
          [2.4, 1.65, -2.1],
          [4.2, 1.60, -2.2]
        ]
      }
    },
    airlock: {
      name: 'Airlock & Departure',
      pos: [0, 1.8, -4.5],
      target: [0, 1.8, -8.0],
      adjacent: ['bridge', 'cargo'],
      lookLimits: { yaw: 80, pitch: 25 },
      hatchPos: {
        bridge: [-0.6, 1.7, -5.8],
        cargo: [0.8, 1.7, -5.8]
      },
      walkPath: {
        bridge: [
          [0, 1.80, -4.5],
          [0, 1.74, -3.0],
          [0, 1.68, -1.5],
          [0, 1.60, 0.5],
          [0, 1.55, 2.0]
        ],
        cargo: [
          [0, 1.80, -4.5],
          [1.2, 1.74, -3.8],
          [2.6, 1.68, -3.0],
          [4.2, 1.60, -2.2]
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
