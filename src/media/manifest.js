/**
 * manifest.js — Single registry of all video loops and cinematics.
 */

export const MEDIA_MANIFEST = {
  // --- Loops (8s, seamless, muted in use) ---
  cockpit_loop: {
    id: 'cockpit_loop',
    kind: 'loop',
    poster: '/art/cockpit.jpg',
    videoPoster: '/video/cockpit_loop.jpg',
    sources: [
      { src: '/video/cockpit_loop.webm', type: 'video/webm' },
      { src: '/video/cockpit_loop.mp4', type: 'video/mp4' }
    ]
  },
  crucible_loop: {
    id: 'crucible_loop',
    kind: 'loop',
    poster: '/art/crucible.jpg',
    videoPoster: '/video/crucible_loop.jpg',
    sources: [
      { src: '/video/crucible_loop.webm', type: 'video/webm' },
      { src: '/video/crucible_loop.mp4', type: 'video/mp4' }
    ]
  },
  starmap_loop: {
    id: 'starmap_loop',
    kind: 'loop',
    poster: '/art/starmap.jpg',
    videoPoster: '/video/starmap_loop.jpg',
    sources: [
      { src: '/video/starmap_loop.webm', type: 'video/webm' },
      { src: '/video/starmap_loop.mp4', type: 'video/mp4' }
    ]
  },
  comms_loop: {
    id: 'comms_loop',
    kind: 'loop',
    poster: '/art/comms.jpg',
    videoPoster: '/video/comms_loop.jpg',
    sources: [
      { src: '/video/comms_loop.webm', type: 'video/webm' },
      { src: '/video/comms_loop.mp4', type: 'video/mp4' }
    ]
  },
  cargo_loop: {
    id: 'cargo_loop',
    kind: 'loop',
    poster: '/art/cargo.jpg',
    videoPoster: '/video/cargo_loop.jpg',
    sources: [
      { src: '/video/cargo_loop.webm', type: 'video/webm' },
      { src: '/video/cargo_loop.mp4', type: 'video/mp4' }
    ]
  },
  quarters_loop: {
    id: 'quarters_loop',
    kind: 'loop',
    poster: '/art/quarters.jpg',
    videoPoster: '/video/quarters_loop.jpg',
    sources: [
      { src: '/video/quarters_loop.webm', type: 'video/webm' },
      { src: '/video/quarters_loop.mp4', type: 'video/mp4' }
    ]
  },
  airlock_loop: {
    id: 'airlock_loop',
    kind: 'loop',
    poster: '/art/airlock.jpg',
    videoPoster: '/video/airlock_loop.jpg',
    sources: [
      { src: '/video/airlock_loop.webm', type: 'video/webm' },
      { src: '/video/airlock_loop.mp4', type: 'video/mp4' }
    ]
  },
  vess_transmission: {
    id: 'vess_transmission',
    kind: 'loop',
    poster: '/art/comms.jpg',
    videoPoster: '/video/vess_transmission.jpg',
    sources: [
      { src: '/video/vess_transmission.webm', type: 'video/webm' },
      { src: '/video/vess_transmission.mp4', type: 'video/mp4' }
    ]
  },
  guild_mining: {
    id: 'guild_mining',
    kind: 'loop',
    poster: '/art/factions.jpg',
    videoPoster: '/video/guild_mining.jpg',
    sources: [
      { src: '/video/guild_mining.webm', type: 'video/webm' },
      { src: '/video/guild_mining.mp4', type: 'video/mp4' }
    ]
  },
  guild_air: {
    id: 'guild_air',
    kind: 'loop',
    poster: '/art/factions_fleet.jpg',
    videoPoster: '/video/guild_air.jpg',
    sources: [
      { src: '/video/guild_air.webm', type: 'video/webm' },
      { src: '/video/guild_air.mp4', type: 'video/mp4' }
    ]
  },
  guild_fire: {
    id: 'guild_fire',
    kind: 'loop',
    poster: '/art/factions.jpg',
    videoPoster: '/video/guild_fire.jpg',
    sources: [
      { src: '/video/guild_fire.webm', type: 'video/webm' },
      { src: '/video/guild_fire.mp4', type: 'video/mp4' }
    ]
  },
  guild_water: {
    id: 'guild_water',
    kind: 'loop',
    poster: '/art/hero_desert_outpost.jpg',
    videoPoster: '/video/guild_water.jpg',
    sources: [
      { src: '/video/guild_water.webm', type: 'video/webm' },
      { src: '/video/guild_water.mp4', type: 'video/mp4' }
    ]
  },

  // --- Cinematics (played once, with audio, click-to-skip) ---
  cold_open: {
    id: 'cold_open',
    kind: 'cinematic',
    poster: '/art/cockpit.jpg',
    videoPoster: '/video/cold_open.jpg',
    sources: [
      { src: '/video/cold_open.webm', type: 'video/webm' },
      { src: '/video/cold_open.mp4', type: 'video/mp4' }
    ],
    captions: [
      { start: 0, end: 4, text: '[Instrument relays click in sequence... Cockpit wakes]' },
      { start: 4, end: 8, text: 'Vess: "Signal\'s weak out here. The Avalon\'s still hiring."' }
    ]
  },
  launch: {
    id: 'launch',
    kind: 'cinematic',
    poster: '/art/bridge.jpg',
    videoPoster: '/video/launch.jpg',
    sources: [
      { src: '/video/launch.webm', type: 'video/webm' },
      { src: '/video/launch.mp4', type: 'video/mp4' }
    ],
    captions: [
      { start: 0, end: 4, text: '[Throttle levers thrust forward. Engines whine to life]' },
      { start: 4, end: 8, text: 'Vess: "Hang on to something solid. We\'re dropping into orbit."' }
    ]
  },
  erebus_descent: {
    id: 'erebus_descent',
    kind: 'cinematic',
    poster: '/art/hero_desert_outpost.jpg',
    videoPoster: '/video/erebus_descent.jpg',
    sources: [
      { src: '/video/erebus_descent.webm', type: 'video/webm' },
      { src: '/video/erebus_descent.mp4', type: 'video/mp4' }
    ],
    captions: [
      { start: 0, end: 5, text: '[Hull groans under atmospheric friction]' },
      { start: 5, end: 9, text: 'Vess: "Erebus below. The Charge Gardens went dark forty years ago."' },
      { start: 10, end: 14, text: '[Breaking through haze... desert wind howling over pylons]' },
      { start: 14, end: 19, text: 'Vess: "Charge Gardens dead ahead across the dune line."' }
    ]
  },
  gardens_reveal: {
    id: 'gardens_reveal',
    kind: 'cinematic',
    poster: '/art/hero_desert_outpost.jpg',
    videoPoster: '/video/gardens_reveal.jpg',
    sources: [
      { src: '/video/gardens_reveal.webm', type: 'video/webm' },
      { src: '/video/gardens_reveal.mp4', type: 'video/mp4' }
    ],
    captions: [
      { start: 0, end: 4, text: '[Desert wind scours the abandoned pylon field]' },
      { start: 4, end: 8, text: 'Vess: "Twenty relay pylons buried in the dust. Light the first one."' }
    ]
  },
  pylon_wake: {
    id: 'pylon_wake',
    kind: 'cinematic',
    poster: '/art/crucible.jpg',
    videoPoster: '/video/pylon_wake.jpg',
    sources: [
      { src: '/video/pylon_wake.webm', type: 'video/webm' },
      { src: '/video/pylon_wake.mp4', type: 'video/mp4' }
    ],
    captions: [
      { start: 0, end: 4, text: '[Heavy mechanical clank... filament warms from dull red to amber]' },
      { start: 4, end: 8, text: 'Vess: "Relay online. Sand is vibrating across the dune."' }
    ]
  },
  gardens_restored: {
    id: 'gardens_restored',
    kind: 'cinematic',
    poster: '/art/hero_desert_outpost.jpg',
    videoPoster: '/video/gardens_restored.jpg',
    sources: [
      { src: '/video/gardens_restored.webm', type: 'video/webm' },
      { src: '/video/gardens_restored.mp4', type: 'video/mp4' }
    ],
    captions: [
      { start: 0, end: 5, text: '[Pylon lamps ignite ring by ring across the desert field]' },
      { start: 5, end: 11, text: 'Vess: "The entire field is singing in key. Full grid restored."' },
      { start: 11, end: 18, text: 'Vess: "Check the cargo hold. The quartermaster left a crate for you."' }
    ]
  },
  item_award: {
    id: 'item_award',
    kind: 'cinematic',
    poster: '/art/cargo.jpg',
    videoPoster: '/video/item_award.jpg',
    sources: [
      { src: '/video/item_award.webm', type: 'video/webm' },
      { src: '/video/item_award.mp4', type: 'video/mp4' }
    ],
    captions: [
      { start: 0, end: 4, text: '[Cargo clamp snaps open... pneumatic hiss vents amber light]' },
      { start: 4, end: 8, text: 'Vess: "Quartermaster crate unsealed. You earned this."' }
    ]
  }
};
