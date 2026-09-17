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

  briefing: {
    title: 'Mission Comms · The Charge Gardens',
    speaker: 'VESS // COMMS',
    badge: 'PRIORITY TRANSMISSION',
    subtitle: 'SECTOR 01 · EREBUS // CHARGE GARDENS',
    message: 'We are down on Erebus — a scorched desert world scoured by iron-dust storms and abandoned refineries. The twenty relay pylons across the Charge Gardens went dark forty years ago. Your mission is to restore the power grid across the basin. Connect the circuit components inside each junction: drag a line from the glowing red power feed to the hungry blue receiver. If you connect them successfully, current surges through the junction and the pylons will turn back on.',
    transmission: 'Down on Erebus. Twenty relay pylons in the Charge Gardens went dark decades ago. Connect the circuit components in each junction to turn them back on.'
  },

  // Stage 1 opening transmission per guild; neutral used for demo / unassigned
  guildOpeners: {
    earth: 'Mineral Mining brought you to Erebus. Connect the circuit components in this junction to turn Pylon 1 back on.',
    air: 'Thin air on Erebus today. Connect the circuit components in this junction to turn Pylon 1 back on.',
    fire: 'Thermal crew, Erebus is ice cold. Connect the circuit components in this junction to turn Pylon 1 back on.',
    water: 'Welcome to the dunes of Erebus. Connect the circuit components in this junction to turn Pylon 1 back on.',
    neutral: 'Welcome to Erebus. Connect the circuit components in this junction to turn Pylon 1 back on.'
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
    speaker: 'VESS // QUARTERMASTER',
    badge: 'MISSION COMPLETE · SECTOR 01',
    subtitle: 'THE CHARGE GARDENS // RESTORATION CONFIRMED',
    message: 'The entire field is singing in key — all twenty pylons are burning bright across the dunes. Outstanding work restoring the grid. The Avalon owes you for this one. Thank you for completing the mission.',
    sections: [
      {
        title: 'Mission Complete',
        speaker: 'VESS // QUARTERMASTER',
        badge: 'DEBRIEF 1/5 · MISSION COMPLETE',
        subtitle: 'EREBUS // CHARGE GARDENS RESTORATION',
        text: 'The entire field is singing in key — all twenty pylons are burning bright across the dunes. Outstanding work out there restoring the grid. The Avalon and the guilds owe you for this one. Thank you for completing the mission.'
      },
      {
        title: 'The Real Science',
        speaker: 'VESS // SCIENCE DEBRIEF',
        badge: 'DEBRIEF 2/5 · THE REAL SCIENCE',
        subtitle: 'ANALYSIS // CHARGE & ELECTRONS',
        text: 'Now let me tell you the chemistry you were actually doing in those junction boxes. Every red cloud was a spot with extra electrons — a region of negative charge. Every blue spot was electron-poor and positively charged. Opposite charges attract, so reactions start where the reddest region meets the bluest one.'
      },
      {
        title: 'Curved Arrows',
        speaker: 'VESS // SCIENCE DEBRIEF',
        badge: 'DEBRIEF 3/5 · CURVED ARROWS',
        subtitle: 'NOTATION // ELECTRON TRANSFERS',
        text: 'Those lines you drew across the contacts are called curved arrows, and real-world chemists use exactly this notation. An arrow shows a pair of electrons moving from where they are to where they are going.'
      },
      {
        title: 'Steric Hindrance',
        speaker: 'VESS // SCIENCE DEBRIEF',
        badge: 'DEBRIEF 4/5 · STERIC HINDRANCE',
        subtitle: 'GEOMETRY // OBSTRUCTION & CLEARANCE',
        text: 'When two blue targets competed for the line, geometry decided the winner: bulky groups physically block incoming molecules, so reactions take the open route. Chemists call that steric hindrance.'
      },
      {
        title: 'Reaction Mechanisms',
        speaker: 'VESS // SCIENCE DEBRIEF',
        badge: 'DEBRIEF 5/5 · REACTION MECHANISMS',
        subtitle: 'SYNTHESIS // ORGANIC CHEMISTRY',
        text: 'In those multi-step stages, you were writing a full reaction mechanism — the exact order in which bonds form and break. That is the core skill of organic chemistry, and you just solved twenty of them. Outstanding work, recruit.'
      }
    ],
    lines: [
      'The entire field is singing in key.',
      'Check the cargo hold. The quartermaster left a crate for you.'
    ]
  }
};
