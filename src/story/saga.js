/**
 * saga.js — Main storyline spine, acts, clue registry, and world episodes.
 *
 * PURE DATA & LOGIC. Importable in Node, browser, and verifier tools.
 *
 * Governs the 14-world Fifth Guild mystery:
 *   - 4 Acts, each framed around one plain question for the Case Board.
 *   - 5 Spine beats played aboard the Avalon in road order.
 *   - 15 Clues recovered from Erebus and the 14 world bosses.
 *   - Low-text World Episodes (no 3-paragraph walls; plain, concrete language).
 */

export const ACTS = [
  {
    id: 'act1',
    order: 1,
    title: 'Act I: The Alchemy Rumor',
    question: 'Can the Fifth Guild really turn salt into heavy metal?',
    answer: 'No. Ordinary chemistry cannot turn one element into another, so something else is going on.',
    worlds: ['unit01', 'unit02', 'unit03'],
    summary: 'Heavy metal showed up inside pure salt, lighthouses went dark, and volcanic rock was sliced smooth like glass.'
  },
  {
    id: 'act2',
    order: 2,
    title: 'Act II: Impossible Heat and Metal',
    question: 'Where is the extra heat and extra metal coming from?',
    answer: 'Ordinary chemical reactions cannot make this much heat or extra metal. Something inside the atom itself is doing it.',
    worlds: ['unit04', 'unit05', 'unit06', 'unit07'],
    summary: 'A sealed tank stayed hot for 12 days in freezing air, volcano heat vanished underground, and a foundry logged more iron than its ore could hold.'
  },
  {
    id: 'act3',
    order: 3,
    title: 'Act III: Who Is the Fifth Guild?',
    question: 'Who is behind the Fifth Guild?',
    answer: 'They are the old outpost crews the Four Guilds abandoned thirty years ago, led by someone called The Catalyst.',
    worlds: ['unit08', 'unit09', 'unit10', 'unit11'],
    summary: 'Hidden chemical ponds, acid runoff, stolen copper, and spiked fuel all point to a huge secret project and the people running it.'
  },
  {
    id: 'act4',
    order: 4,
    title: 'Act IV: What Are They Building?',
    question: 'What is the Fifth Guild building, and where is it?',
    answer: 'An old nuclear power plant on Cinder Halo. Splitting uranium atoms explains every clue.',
    worlds: ['unit12', 'unit13', 'unit14'],
    summary: 'Sorted metal ships to Cinder Halo, plastic armor hides lead shields, and an old nuclear reactor is running hot.'
  }
];

export const CLUES = {
  clue_erebus_mark: {
    id: 'clue_erebus_mark',
    act: 'act1',
    source: 'Erebus · Tower 20',
    name: 'Triangle Mark',
    summary: 'An unknown triangle mark stamped inside a sabotaged shield tower.',
    note: 'None of the Four Guilds use this mark. Someone new cut all twenty shield towers on purpose.'
  },
  clue_tallow_slag: {
    id: 'clue_tallow_slag',
    act: 'act1',
    source: 'Tallow · The Hopper',
    name: 'Bismuth Chunk',
    summary: 'A lump of heavy bismuth metal found inside pure salt.',
    note: 'Pure salt has only sodium and chlorine. Ordinary chemistry can never turn salt into heavy metal.'
  },
  clue_lantern_lens: {
    id: 'clue_lantern_lens',
    act: 'act1',
    source: 'Lanternfall · The Lantern-Eater',
    name: 'Ultraviolet Lens',
    summary: 'A glass lens made for invisible ultraviolet light.',
    note: 'The Fifth Guild blacked out the regular lighthouses so their own ships could fly unseen using invisible UV light.'
  },
  clue_ligar_scorch: {
    id: 'clue_ligar_scorch',
    act: 'act1',
    source: 'Ligar · Basalt Warden',
    name: 'Glass-Cut Rock',
    summary: 'Hard volcanic rock sliced as smooth as glass.',
    note: 'No normal torch can get hot enough to cut rock this cleanly. The Fifth Guild has an extreme heat source.'
  },
  clue_bellows_warm: {
    id: 'clue_bellows_warm',
    act: 'act2',
    source: 'Bellows · The Compressor',
    name: 'The Warm Tank',
    summary: 'A sealed gas tank that stayed hot for 12 days in freezing air.',
    note: 'Normal gas cools down fast in the cold. Something inside this tank kept making heat on its own.'
  },
  clue_ember_siphon: {
    id: 'clue_ember_siphon',
    act: 'act2',
    source: 'Ember Reach · The Crucible',
    name: 'Underground Heat Pipe',
    summary: 'A huge pipe pulling volcano heat straight down under the ground.',
    note: 'They drained huge amounts of heat away from the shelters to run a hidden rig underground.'
  },
  clue_mirrowen_agent: {
    id: 'clue_mirrowen_agent',
    act: 'act2',
    source: 'Mirrowen · The Undertow',
    name: 'Lab-Made Canal Chemical',
    summary: 'A sample of the chemical dumped into the canals to freeze the supply boats.',
    note: 'This chemical does not come from nature. Someone built a real chemical factory to make it.'
  },
  clue_kettle_ledger: {
    id: 'clue_kettle_ledger',
    act: 'act2',
    source: 'Kettle · Recipe Golem',
    name: 'The 50-Ton Shipping Log',
    summary: 'A factory log claiming 50 tons of iron came from just 40 tons of rock.',
    note: 'Forty tons of ore can make at most 28 tons of iron. The extra 22 tons had to come from somewhere else.'
  },
  clue_teeter_pan: {
    id: 'clue_teeter_pan',
    act: 'act3',
    source: 'Teeter · The Tipper',
    name: 'Hidden Salt Plant',
    summary: 'Salt ponds that looked dead on top, but were still pumping out chemicals nonstop.',
    note: 'By draining product out as fast as it formed, the Fifth Guild turned an old salt flat into a hidden factory.'
  },
  clue_verdigris_leach: {
    id: 'clue_verdigris_leach',
    act: 'act3',
    source: 'Verdigris · The Leach',
    name: 'Acid Ore Waste',
    summary: 'Heavy acid runoff dumped into the marsh around the radio fort.',
    note: 'This kind of strong acid waste comes from washing heavy metal ore, not normal mining.'
  },
  clue_brinewire_clamp: {
    id: 'clue_brinewire_clamp',
    act: 'act3',
    source: 'Brinewire · The Clamp',
    name: 'Stolen Copper Bars',
    summary: 'Pure copper bars pulled straight out of the salty marsh using electricity.',
    note: 'The Fifth Guild stole tons of pure copper from these pools. They are wiring something huge.'
  },
  clue_quicklight_flare: {
    id: 'clue_quicklight_flare',
    act: 'act3',
    source: 'Quicklight · The Flare',
    name: 'Vent Dust & Callsign',
    summary: 'A pinch of catalyst dust from the fuel vent, plus a message signed "The Catalyst."',
    note: 'The dust speeds up the fuel without getting used up. Their leader is one of the crews the Four Guilds left behind.'
  },
  clue_lodestone_coil: {
    id: 'clue_lodestone_coil',
    act: 'act4',
    source: 'Lodestone · The Coil',
    name: 'Shipping Route Chip',
    summary: 'A memory chip from the giant magnet sorting metal drums in the iron canyon.',
    note: 'Every sorted metal drum is being shipped straight to one place: Cinder Halo.'
  },
  clue_thornmere_carapace: {
    id: 'clue_thornmere_carapace',
    act: 'act4',
    source: 'Thornmere · The Carapace',
    name: 'Lead-Lined Armor Plate',
    summary: 'Tough plastic armor with a thick layer of heavy lead hidden underneath.',
    note: 'You do not line armor with lead for normal fights. Lead is used to block dangerous nuclear radiation.'
  },
  clue_cinderhalo_core: {
    id: 'clue_cinderhalo_core',
    act: 'act4',
    source: 'Cinder Halo · The Transmutation Core',
    name: 'The Control-Rod Log',
    summary: 'The logbook from an old nuclear reactor, showing all the safety rods pulled out.',
    note: 'They restarted an old uranium nuclear reactor. Splitting uranium atoms explains the heat, the lead armor, and the strange metals.'
  }
};

export const SPINE_BEATS = [
  {
    id: 'beat_tallow_slag',
    act: 'act1',
    order: 1,
    title: 'Heavy Metal in Pure Salt',
    prereq: { bosses: ['unit01/boss-hopper'] },
    speaker: 'Vess',
    transmission: 'I tested the chunk from Tallow, and it is bismuth, a heavy metal that does not belong in salt. Ordinary chemistry cannot turn salt into bismuth.',
    onScreen: 'Vess sets a heavy metal chunk on the table beside the star map.'
  },
  {
    id: 'beat_guild_inquiry',
    act: 'act1',
    order: 2,
    title: 'The Council Says Stop',
    prereq: {
      bosses: ['unit01/boss-hopper', 'unit03/boss-warden'],
      contracts: ['contract_erebus_01']
    },
    speaker: 'Council Officer',
    transmission: 'Stop looking into the Fifth Guild and ignore the rumors. Stay on your normal route.',
    onScreen: 'The message cuts to static. Vess locks the case log so nobody can erase it.'
  },
  {
    id: 'beat_impossible_ledger',
    act: 'act2',
    order: 3,
    title: 'The Impossible Shipping Log',
    prereq: { bosses: ['unit07/boss-golem'] },
    speaker: 'Vess',
    transmission: 'Kettle\'s log claims 50 tons of iron came from 40 tons of ore. Chemistry never creates extra mass, so that extra iron came from somewhere else.',
    onScreen: 'The captured shipping log glows amber on the ship screen.'
  },
  {
    id: 'beat_the_catalyst',
    act: 'act3',
    order: 4,
    title: 'Who They Really Are',
    prereq: { clues: ['clue_kettle_ledger'] },
    speaker: 'Vess',
    transmission: 'Their leader goes by The Catalyst. They are the old outpost crews the Four Guilds abandoned thirty years ago.',
    onScreen: 'Old crew lists match the radio signals coming from the Fifth Guild.'
  },
  {
    id: 'beat_cinder_halo',
    act: 'act4',
    order: 5,
    title: 'The Trail Ends at Cinder Halo',
    prereq: { clues: ['clue_tallow_slag', 'clue_kettle_ledger'] },
    speaker: 'Vess',
    transmission: 'Every copper wire, sorted drum, and lead plate leads straight to Cinder Halo. They are running an old nuclear reactor there.',
    onScreen: 'The star map locks onto Cinder Halo as radiation warnings flash.'
  }
];

export const CAMPAIGN_STORY = [
  {
    speaker: 'Vess',
    text: 'Welcome aboard the Avalon. A mysterious group calling themselves the Fifth Guild is hitting Four Guilds outposts across the rim, and nobody knows who they are or what they are building.'
  },
  {
    speaker: 'Vess',
    text: 'Strange clues keep turning up: heavy metal inside pure salt, sealed tanks staying hot in freezing air, and factories logging more iron than their ore can hold. People whisper it is magic.'
  },
  {
    speaker: 'Vess',
    text: 'Every one of those clues has a real chemistry explanation. Visit each world, test the evidence yourself, and we will find out who the Fifth Guild is and what they are up to.'
  }
];

export const EPISODES = {
  erebus: {
    worldId: 'erebus',
    worldName: 'Erebus',
    act: 'act1',
    arrival: 'Someone cut all 20 shield towers on Erebus and left a triangle mark nobody recognizes.',
    closing: 'All 20 shield towers are back on, and we logged the unknown triangle mark on Tower 20.',
    spoilFamily: 'Sabotaged towers',
    bossId: 'pylon-20',
    clueId: 'clue_erebus_mark',
    incident: 'All 20 shield towers went dark, and a strange triangle mark was left behind.',
    objective: 'Reconnect the power path in each tower to turn the shield back on.',
    caseFileNote: 'Unknown triangle mark found on sabotaged shield tower.'
  },
  unit01: {
    worldId: 'unit01',
    worldName: 'Tallow',
    act: 'act1',
    arrival: 'Heavy metal showed up inside Tallow\'s pure salt, and rumors say the Fifth Guild turned salt into gold.',
    closing: 'The salt refinery is safe, and we pulled a heavy bismuth chunk out of the pure salt.',
    spoilFamily: 'Salt husks',
    bossId: 'boss-hopper',
    clueId: 'clue_tallow_slag',
    incident: 'Strange heavy metal chunks turned up inside Tallow\'s pure salt bins.',
    objective: 'Test the salt and look inside the atom to see if chemistry can really make heavy metal from salt.',
    caseFileNote: 'Bismuth found in pure salt. Ordinary chemistry cannot make it.'
  },
  unit02: {
    worldId: 'unit02',
    worldName: 'Lanternfall',
    act: 'act1',
    arrival: 'The Fifth Guild blacked out Lanternfall\'s lighthouse towers using light our sensors cannot see.',
    closing: 'The glacier lighthouses are back on, and we found a lens made for invisible ultraviolet light.',
    spoilFamily: 'Lamp moths',
    bossId: 'boss-eater',
    clueId: 'clue_lantern_lens',
    incident: 'The lighthouse towers went dark after the Fifth Guild swapped out the lenses.',
    objective: 'Measure light and electrons to relight the towers and find how their ships fly in the dark.',
    caseFileNote: 'UV lens found. Fifth Guild ships fly unseen using ultraviolet light.'
  },
  unit03: {
    worldId: 'unit03',
    worldName: 'Ligar',
    act: 'act1',
    arrival: 'A Fifth Guild blast trapped Ligar\'s miners and sliced solid volcanic rock smooth like glass.',
    closing: 'The miners are out safe, and the glass-smooth rock proves the Fifth Guild has an extreme heat source.',
    spoilFamily: 'Basalt wardens',
    bossId: 'boss-warden',
    clueId: 'clue_ligar_scorch',
    incident: 'A blast buried the rescue tunnel and cut volcanic rock smooth like glass.',
    objective: 'Test how atoms bond in the rock and tunnel gases so we can clear the pass safely.',
    caseFileNote: 'Volcanic rock melted glass-smooth. The Fifth Guild has an extreme heat source.'
  },
  unit04: {
    worldId: 'unit04',
    worldName: 'Bellows',
    act: 'act2',
    arrival: 'The Fifth Guild jammed Bellows\' fuel tanks and left behind a sealed tank that stays hot in freezing air.',
    closing: 'The fuel tanks are safe, and the sealed tank stayed hot for 12 days in freezing air.',
    spoilFamily: 'Gas bladders',
    bossId: 'boss-compressor',
    clueId: 'clue_bellows_warm',
    incident: 'Pressure is spiking in the jammed tanks, and one sealed tank refuses to cool down.',
    objective: 'Use how gases behave to relieve the tanks and check why the sealed cylinder stays hot.',
    caseFileNote: 'Sealed tank stayed hot 12 days in freezing air with no normal fuel.'
  },
  unit05: {
    worldId: 'unit05',
    worldName: 'Ember Reach',
    act: 'act2',
    arrival: 'The Fifth Guild tapped Ember Reach\'s volcano pipes, draining huge amounts of heat straight underground.',
    closing: 'Shelter heat is back on, and we traced the stolen volcano heat to a hidden underground rig.',
    spoilFamily: 'Slag crucibles',
    bossId: 'boss-crucible',
    clueId: 'clue_ember_siphon',
    incident: 'Someone tapped the volcano pipes and drained heat away from the shelters.',
    objective: 'Track where the heat is going and restore warmth to the colony.',
    caseFileNote: 'Stolen volcano heat powered a hidden underground rig.'
  },
  unit06: {
    worldId: 'unit06',
    worldName: 'Mirrowen',
    act: 'act2',
    arrival: 'A strange chemical froze Mirrowen\'s shipping canals solid and trapped every supply boat.',
    closing: 'The canals are open again, and lab tests show the freezing chemical was made in a factory.',
    spoilFamily: 'Brine crawlers',
    bossId: 'boss-undertow',
    clueId: 'clue_mirrowen_agent',
    incident: 'A mystery chemical froze the shipping canals and trapped the supply boats.',
    objective: 'Test the ice, melt the barrier, and separate out the Fifth Guild\'s chemical.',
    caseFileNote: 'Canal chemical was lab-made. The Fifth Guild has a real factory.'
  },
  unit07: {
    worldId: 'unit07',
    worldName: 'Kettle',
    act: 'act2',
    arrival: 'Kettle\'s foundry logs claim 50 tons of iron came from 40 tons of ore, which is impossible.',
    closing: 'The hijacked foundry is shut down, and the math proves 22 tons of iron came from somewhere else.',
    spoilFamily: 'Recipe golems',
    bossId: 'boss-golem',
    clueId: 'clue_kettle_ledger',
    incident: 'The foundry logs claim more iron came out than the ore can possibly make.',
    objective: 'Check the recipes and mass balance to prove where the numbers break.',
    caseFileNote: '50 tons of iron from 40 tons of ore is impossible. Extra metal came from elsewhere.'
  },
  unit08: {
    worldId: 'unit08',
    worldName: 'Teeter',
    act: 'act3',
    arrival: 'The Fifth Guild\'s salt ponds on Teeter look dead on top, yet their pumps are still pulling product.',
    closing: 'The hidden pumps are stopped. Those abandoned ponds were actually a secret chemical plant.',
    spoilFamily: 'Balance husks',
    bossId: 'boss-tipper',
    clueId: 'clue_teeter_pan',
    incident: 'Ponds that look stopped are still pumping out chemicals.',
    objective: 'Test how the ponds settle and how the Fifth Guild\'s drain pump keeps them running nonstop.',
    caseFileNote: 'Abandoned salt ponds are a hidden Fifth Guild chemical plant.'
  },
  unit09: {
    worldId: 'unit09',
    worldName: 'Verdigris',
    act: 'act3',
    arrival: 'Strong acid runoff from a Fifth Guild ore-washing plant is eating through Verdigris\'s radio fort.',
    closing: 'The radio fort\'s water is safe, and the acid waste matches heavy ore processing.',
    spoilFamily: 'Acid leaches',
    bossId: 'boss-leach',
    clueId: 'clue_verdigris_leach',
    incident: 'Strong acid waste from ore washing is flooding the marsh around the radio fort.',
    objective: 'Measure the acid, neutralize the waste tanks, and protect the fort\'s water intake.',
    caseFileNote: 'Strong acid waste comes from washing heavy metal ore.'
  },
  unit10: {
    worldId: 'unit10',
    worldName: 'Brinewire',
    act: 'act3',
    arrival: 'The Fifth Guild clamped illegal power taps onto Brinewire\'s salt pools, draining the grid and stripping copper.',
    closing: 'The power taps are off, and we caught the Fifth Guild pulling tons of pure copper out of the marsh.',
    spoilFamily: 'Power clamps',
    bossId: 'boss-clamp',
    clueId: 'clue_brinewire_clamp',
    incident: 'Illegal clamps are draining the marsh power grid and pulling pure copper from the pools.',
    objective: 'Rebuild the marsh batteries and find out what the Fifth Guild is making with the stolen current.',
    caseFileNote: 'Fifth Guild stole tons of pure copper to wire something huge.'
  },
  unit11: {
    worldId: 'unit11',
    worldName: 'Quicklight',
    act: 'act3',
    arrival: 'Fuel towers on Quicklight are overheating ten times too fast after someone spiked the vents with a mystery dust.',
    closing: 'The fuel towers are cool, and an intercepted message names their leader: The Catalyst.',
    spoilFamily: 'Kinetic flares',
    bossId: 'boss-flare',
    clueId: 'clue_quicklight_flare',
    incident: 'A mystery dust in the fuel vents is making the towers overheat ten times too fast.',
    objective: 'Time the fuel burn, find what the dust is doing, and cool the towers down.',
    caseFileNote: 'Their leader is "The Catalyst," from the crews the Four Guilds left behind.'
  },
  unit12: {
    worldId: 'unit12',
    worldName: 'Lodestone',
    act: 'act4',
    arrival: 'A huge Fifth Guild magnet in Lodestone\'s iron canyon is sorting metal drums and shipping them off-world.',
    closing: 'The sorting magnet is off, and its shipping chip points straight to Cinder Halo.',
    spoilFamily: 'Sorting coils',
    bossId: 'boss-coil',
    clueId: 'clue_lodestone_coil',
    incident: 'A giant magnet in the canyon is sorting metal drums and shipping them off-world.',
    objective: 'Identify the metals in the drums and trace where the shipments are going.',
    caseFileNote: 'All sorted ore shipments route straight to Cinder Halo.'
  },
  unit13: {
    worldId: 'unit13',
    worldName: 'Thornmere',
    act: 'act4',
    arrival: 'The Fifth Guild\'s swamp outpost on Thornmere is wrapped in tough plastic armor. Find out what is under it.',
    closing: 'We cut through the plastic armor and found heavy lead plates underneath, built to block radiation.',
    spoilFamily: 'Armor plates',
    bossId: 'boss-carapace',
    clueId: 'clue_thornmere_carapace',
    incident: 'The swamp outpost is sealed behind tough plastic armor plates.',
    objective: 'Find how the plastic chains are built, cut their weak links, and see what they are hiding.',
    caseFileNote: 'Armor is lined with lead to block nuclear radiation.'
  },
  unit14: {
    worldId: 'unit14',
    worldName: 'Cinder Halo',
    act: 'act4',
    arrival: 'We found the Fifth Guild\'s base at Cinder Halo: an old nuclear reactor running hot with no fuel line.',
    closing: 'The nuclear reactor is cooled and safe. Splitting uranium atoms explains every clue.',
    spoilFamily: 'Reactor core',
    bossId: 'boss-core',
    clueId: 'clue_cinderhalo_core',
    incident: 'An old nuclear reactor at Cinder Halo is running hot with no fuel line.',
    objective: 'Measure the radiation, trace the splitting atoms, and lower the control rods to cool the core.',
    caseFileNote: 'Case solved: nuclear fission, not alchemy. Reactor stabilized.'
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

export function getEpisode(worldId) {
  return EPISODES[worldId] || null;
}

export function getAllEpisodes() {
  return Object.values(EPISODES);
}
