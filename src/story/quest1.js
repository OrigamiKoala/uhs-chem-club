/**
 * quest1.js — Campaign fiction and narrative single source of truth for Quest 1.
 *
 * Sector 01 — Erebus · The Charge Gardens.
 * The twenty relay pylons went dark when the old crew abandoned the refinery.
 * Every stage wakes one pylon.
 *
 * Discipline rules (CLAUDE.md §7):
 * - Diegetic: Vess speaking over comms, or ship telemetry reporting.
 * - At most 2 sentences per transmission.
 * - Zero withheld vocabulary (electron, nucleophile, electrophile, carbonyl,
 *   carbocation, alkyl, ester, epoxide, isopropyl).
 * - Never states a route (which site gives, which takes).
 */

export const QUEST1_STORY = {
  arrival: {
    cinematic: 'erebus_descent',
    lines: [
      'Atmospheric entry sealed. Hold your harness.',
      'Charge Gardens dead ahead across the dune line.'
    ]
  },

  // Stage 1 opening transmission per guild; neutral used for demo / unassigned
  guildOpeners: {
    earth: 'Mineral Mining brought you aboard to dig out heavy iron. Start by waking Pylon 1.',
    air: 'Atmospheric crew reads thin pressure on the surface. Find the live seam and trip Pylon 1.',
    fire: 'Thermal crew, the coils are cold out here. Fire up the first contact on Pylon 1.',
    water: 'Moisture rigs need pressure before the suns rise. Wake Pylon 1 to start the feed.',
    neutral: 'Signal is holding through the dust. Wake the first pylon to light the field.'
  },

  pylons: [
    {
      stage: 1,
      transmission: null, // resolved dynamically from guildOpeners
      onClear: 'Relay filament catches. First circuit hums in the sand.'
    },
    {
      stage: 2,
      transmission: 'Second pylon has a split housing. Check the gauges before you commit.',
      onClear: 'Power transfers clean. The dune rim glows amber.'
    },
    {
      stage: 3,
      transmission: 'Internal pressure is drifting on this junction. Watch the clearance.',
      onClear: 'Lock rings engaged. Pressure needle holds steady.'
    },
    {
      stage: 4,
      transmission: 'Two contact points competing for the feed. Pick the hungry one.',
      onClear: 'Current snaps into the conduit without backfire.'
    },
    {
      stage: 5,
      transmission: 'Scanners show a blocked flank on the housing. Swing your angle around.',
      onClear: 'Obstruction bypassed. Coil filament warms to life.'
    },
    {
      stage: 6,
      transmission: 'Another shielded post in the sand. Rotate the view until the path clears.',
      onClear: 'Clear arc established. Static discharges through the base.'
    },
    {
      stage: 7,
      transmission: 'Last node in the inner cluster. Light this and the first ring wakes.',
      onClear: 'First cluster online. Sand shudders across the inner ring.'
    },
    {
      stage: 8,
      transmission: 'Cold tank sitting beside the junction. Ignore the idle bystander.',
      onClear: 'Bystander ignored. Primary conduit pulls the load.'
    },
    {
      stage: 9,
      transmission: 'Three housings in close quarters. Read their meters before you bridge.',
      onClear: 'Right line drawn. Stray vessel stays inert.'
    },
    {
      stage: 10,
      transmission: 'Heavy relay tower ahead. Clear this link to trip the middle breaker.',
      onClear: 'Middle breaker trips. Deep chime echoes across the basin.'
    },
    {
      stage: 11,
      transmission: 'Dual-action valve on this head. Number your sequence or it jams.',
      onClear: 'Sequence clicks in order. Dual pistons latch tight.'
    },
    {
      stage: 12,
      transmission: 'Piston fires first, then the seal vents. Match the steps.',
      onClear: 'Smooth transfer. Exhaust puff kicks up rust dust.'
    },
    {
      stage: 13,
      transmission: 'The mechanism is a two-handed latch. Order matters when the springs load.',
      onClear: 'Spring tension equalized. Twin relays lock shut.'
    },
    {
      stage: 14,
      transmission: 'Tough casing on this junction. Drive the first line deep so the seal pops.',
      onClear: 'Seal releases clean. Warm exhaust whistles through the vent.'
    },
    {
      stage: 15,
      transmission: 'Deep field sector. Two lines to link, with sand scouring the lens.',
      onClear: 'Both paths sealed. Outer relay array starts to chime.'
    },
    {
      stage: 16,
      transmission: 'Chamber geometry is tight here. Check both paths before locking in.',
      onClear: 'Perfect tolerance. Heat sink hums a steady tone.'
    },
    {
      stage: 17,
      transmission: 'Tension is climbing across the bus bar. Run the pair in rhythm.',
      onClear: 'Bus bar takes the charge without a spark.'
    },
    {
      stage: 18,
      transmission: 'High-power branch nearing peak load. Keep your steps clean.',
      onClear: 'Sub-station breaker resets. Turbine spins up.'
    },
    {
      stage: 19,
      transmission: 'Nineteenth pylon. One more link after this and the full basin wakes.',
      onClear: 'Nineteen lamps burning amber against the dusk.'
    },
    {
      stage: 20,
      transmission: 'Master breaker on the perimeter. Trip this pylon and the Gardens live.',
      onClear: 'Master circuit closes. The entire field roars to life.'
    }
  ],

  milestones: {
    7: {
      cinematic: 'pylon_wake',
      line: 'Inner cluster powered. The first ring of lamps burns through the dust.'
    },
    10: {
      cinematic: 'pylon_wake',
      line: 'Sub-station online. Deep harmonic pulse travels out to the perimeter.'
    },
    20: {
      cinematic: 'gardens_restored',
      line: 'All twenty pylons ignited. The Charge Gardens are fully awake.'
    }
  },

  debrief: {
    cinematic: 'gardens_restored',
    lines: [
      'The entire field is singing in key.',
      'Check the cargo hold. The quartermaster left a crate for you.'
    ]
  }
};
