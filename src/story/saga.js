/**
 * saga.js — Main storyline spine, acts, clue registry, and world episodes.
 *
 * PURE DATA & LOGIC. Importable in Node, browser, and verifier tools.
 *
 * Governs the 14-world storyline:
 *   - 4 Acts: The Charter, Pressure, Balance, The Core.
 *   - Spine beats played aboard the Avalon in road order.
 *   - Clue registry for the Case File.
 *   - World episode data (arrival, closing, spoil family, clue, boss).
 */

export const ACTS = [
  {
    id: 'act1',
    order: 1,
    title: 'Act I: The Charter',
    worlds: ['unit01', 'unit02', 'unit03'],
    summary: 'Routine surveys uncover mobile spoil and unmarked stencils across frontier extraction zones.'
  },
  {
    id: 'act2',
    order: 2,
    title: 'Act II: Pressure',
    worlds: ['unit04', 'unit05', 'unit06', 'unit07'],
    summary: 'The Fifth recruits active crews as impossible refinery ledgers violate the conservation of mass.'
  },
  {
    id: 'act3',
    order: 3,
    title: 'Act III: Balance',
    worlds: ['unit08', 'unit09', 'unit10', 'unit11'],
    summary: 'Planetary equilibrium falters, unveiling the true title of the Fifth: The Catalyst.'
  },
  {
    id: 'act4',
    order: 4,
    title: 'Act IV: The Core',
    worlds: ['unit12', 'unit13', 'unit14'],
    summary: 'Tracing subatomic thermal plumes to the ancient transmutation works on Cinder Halo.'
  }
];

export const CLUES = {
  clue_erebus_mark: {
    id: 'clue_erebus_mark',
    act: 'act1',
    source: 'Erebus Contract · Pylon 20',
    name: 'Unliveried Stencil',
    summary: 'A weathered delta mark stamped behind the perimeter housing with no guild seal.',
    note: 'The old crew did not just abandon the gardens; they signed the housing before they walked.'
  },
  clue_tallow_slag: {
    id: 'clue_tallow_slag',
    act: 'act1',
    source: 'Tallow Boss · The Hopper',
    name: 'Transmuted Slag',
    summary: 'Refined ore slag from a pure sodium chloride salt pan carrying heavy bismuth.',
    note: 'Bismuth was never in the bedrock. Ordinary chemistry cannot turn sodium into heavy metals.'
  },
  clue_lantern_lens: {
    id: 'clue_lantern_lens',
    act: 'act1',
    source: 'Lanternfall Boss · The Lantern-Eater',
    name: 'Non-Standard Optical Lens',
    summary: 'A precision prism ground for deep ultraviolet frequencies far past guild lamp ratings.',
    note: 'Someone tuned this lens to drive photoelectric emission on metals the guilds leave buried.'
  },
  clue_ligar_scorch: {
    id: 'clue_ligar_scorch',
    act: 'act1',
    source: 'Ligar Elite · Basalt Warden',
    name: 'Arc-Sheared Basalt',
    summary: 'A quarry face cut cleanly through mineral lattices by heat hotter than any smelter torch.',
    note: 'No chemical flame reaches that temperature without melting the quarry cutters.'
  },
  clue_kettle_ledger: {
    id: 'clue_kettle_ledger',
    act: 'act2',
    source: 'Kettle Elite · Recipe Golem',
    name: 'Over-Mass Recipe Ledger',
    summary: 'Refinery accounts where total output mass exceeds reactant inputs by thirty percent.',
    note: 'Every recipe obeys mass balance. If mass is appearing from nowhere, this is not a reaction.'
  }
};

export const SPINE_BEATS = [
  {
    id: 'beat_tallow_slag',
    act: 'act1',
    order: 1,
    title: 'The Slag Reading',
    prereq: { bosses: ['unit01/boss-hopper'] },
    speaker: 'VESS // QUARTERMASTER',
    transmission: 'I ran the mass spec on that hopper slag three times. There is bismuth in that salt, and no mine on Tallow ever held a trace of it.',
    onScreen: 'Vess sets a heavy lead-lined specimen tube on the plotting table beside the periodic chart.'
  },
  {
    id: 'beat_guild_inquiry',
    act: 'act1',
    order: 2,
    title: 'The Guild Inquiry',
    prereq: {
      bosses: ['unit01/boss-hopper', 'unit03/boss-warden'],
      contracts: ['contract_erebus_01']
    },
    speaker: 'GUILD ENVOY // COMMS',
    transmission: 'The Four Guilds advise all survey teams to ignore non-standard stencils and mobile spoil. Scavenger groups are fabricating ore anomalies, and your logs are now sequestered.',
    onScreen: 'The Imperial envoy transmission cuts to static. Vess quietly locks the local backup drive.'
  },
  {
    id: 'beat_impossible_ledger',
    act: 'act2',
    order: 3,
    title: 'The Broken Balance',
    prereq: { bosses: ['unit07/boss-golem'] },
    speaker: 'VESS // QUARTERMASTER',
    transmission: 'Kettle’s ledger cannot lie: forty tons of reagent in, fifty-two tons of product out. Someone aboard this hauler has been relaying our coordinates to the Fifth.',
    onScreen: 'The mass ledger glows amber on the bridge terminal, highlighted against stoichiometric balance formulas.'
  },
  {
    id: 'beat_the_catalyst',
    act: 'act3',
    order: 4,
    title: 'The Catalyst',
    prereq: { clues: ['clue_kettle_ledger'] },
    speaker: 'VESS // QUARTERMASTER',
    transmission: 'The Fifth calls itself The Catalyst. They are the survey hands the Guilds wrote off twenty seasons ago, and they survived on the rim.',
    onScreen: 'A personnel manifest unspools across the console, matching casualty lists to active signals.'
  },
  {
    id: 'beat_cinder_halo',
    act: 'act4',
    order: 5,
    title: 'The Core Transmutation',
    prereq: { clues: ['clue_tallow_slag', 'clue_kettle_ledger'] },
    speaker: 'VESS // QUARTERMASTER',
    transmission: 'The thermal signatures lead straight to Cinder Halo. They are not breaking bonds out there; they are splitting and forging the atomic nucleus itself.',
    onScreen: 'The star chart locks onto Cinder Halo, where subatomic decay rings glow against deep space.'
  }
];

export const EPISODES = {
  unit01: {
    worldId: 'unit01',
    worldName: 'Tallow',
    act: 'act1',
    arrival: 'Refinery intake on Tallow has frozen solid. The ore tailings are shifting across the salt flat on their own.',
    closing: 'Tallow sector secured. The hopper has settled into cold slag, but its core composition does not match the basin.',
    spoilFamily: 'Salt husks',
    bossId: 'boss-hopper',
    clueId: 'clue_tallow_slag'
  },
  unit02: {
    worldId: 'unit02',
    worldName: 'Lanternfall',
    act: 'act1',
    arrival: 'Lanternfall’s optical beacon road is dark. Photoelectric moths are drinking the filament power along the ice trail.',
    closing: 'Lantern beacons relit across the glacier. The lens salvaged from the swarm was ground for frequencies no guild uses.',
    spoilFamily: 'Lamp moths',
    bossId: 'boss-eater',
    clueId: 'clue_lantern_lens'
  },
  unit03: {
    worldId: 'unit03',
    worldName: 'Ligar',
    act: 'act1',
    arrival: 'Geothermal vents in the basalt quarry cracked wide. Crystalline wardens have fused across the foundry road.',
    closing: 'Basalt wardens shattered along their cleave planes. The stone was sheared with thermal output beyond any smelter charter.',
    spoilFamily: 'Basalt wardens',
    bossId: 'boss-warden',
    clueId: 'clue_ligar_scorch'
  },
  unit07: {
    worldId: 'unit07',
    worldName: 'Kettle',
    act: 'act2',
    arrival: 'Kettle’s automated cookers are running unmetered. Stoichiometric golems are feeding on unbonded raw stock.',
    closing: 'Golem intake starved of excess reagent. Their command vault yielded a recipe ledger that violates the laws of mass.',
    spoilFamily: 'Recipe golems',
    bossId: 'boss-golem',
    clueId: 'clue_kettle_ledger'
  }
};

export function getClue(clueId) {
  return CLUES[clueId] || null;
}

export function getAct(actId) {
  return ACTS.find(a => a.id === actId) || null;
}

export function getSpineBeat(beatId) {
  return SPINE_BEATS.find(b => b.id === beatId) || null;
}

/** Check if a spine beat's prerequisites are met. */
export function isBeatUnlocked(beat, state = {}) {
  if (!beat) return false;
  const prereq = beat.prereq || {};
  const clearedBosses = new Set(state.bosses || []);
  const clearedContracts = new Set(state.contracts || []);
  const collectedClues = new Set(state.clues || []);

  if (prereq.bosses && !prereq.bosses.every(b => clearedBosses.has(b))) return false;
  if (prereq.contracts && !prereq.contracts.every(c => clearedContracts.has(c))) return false;
  if (prereq.clues && !prereq.clues.every(c => collectedClues.has(c))) return false;
  return true;
}

/** Returns the next unlocked spine beat that has not yet been marked as seen. */
export function getNextPendingBeat(state = {}) {
  const seen = new Set(state.beatsSeen || []);
  for (const beat of SPINE_BEATS) {
    if (!seen.has(beat.id) && isBeatUnlocked(beat, state)) {
      return beat;
    }
  }
  return null;
}
