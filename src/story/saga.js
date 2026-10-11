/**
 * saga.js — Main storyline spine, acts, clue registry, and world episodes.
 *
 * PURE DATA & LOGIC. Importable in Node, browser, and verifier tools.
 *
 * Governs the 14-world storyline:
 *   - 4 Acts: Strike on the Frontier, Stolen Convoys, Total Sabotage, The Doomsday Core.
 *   - Spine beats played aboard the Avalon in road order.
 *   - Clue registry for the Case File.
 *   - World episode data (arrival, closing, spoil family, clue, boss, incident, objective).
 */

export const ACTS = [
  {
    id: 'act1',
    order: 1,
    title: 'Act I: Strike on the Frontier',
    worlds: ['unit01', 'unit02', 'unit03'],
    summary: 'The rogue Fifth Guild launches surprise raids across frontier extraction worlds, deploying animated war machines.'
  },
  {
    id: 'act2',
    order: 2,
    title: 'Act II: Stolen Power & Sabotage',
    worlds: ['unit04', 'unit05', 'unit06', 'unit07'],
    summary: 'The Fifth Guild hijacks orbital refineries and steals fuel convoys, violating the physical laws of mass balance.'
  },
  {
    id: 'act3',
    order: 3,
    title: 'Act III: The Catalyst Revealed',
    worlds: ['unit08', 'unit09', 'unit10', 'unit11'],
    summary: 'Planetary defense grids collapse under coordinated sabotage as the enemy commander emerges: The Catalyst.'
  },
  {
    id: 'act4',
    order: 4,
    title: 'Act IV: The Doomsday Core',
    worlds: ['unit12', 'unit13', 'unit14'],
    summary: 'Following enemy thermal signatures into the exclusion zone of Cinder Halo to stop their forbidden transmutation core.'
  }
];

export const CLUES = {
  clue_erebus_mark: {
    id: 'clue_erebus_mark',
    act: 'act1',
    source: 'Erebus Contract · Pylon 20',
    name: 'Fifth Guild Infiltration Mark',
    summary: 'A covert delta symbol stamped behind the pylon power housing with no imperial seal.',
    note: 'The Fifth Guild deliberately sabotaged the defense grid before our arrival. They signed the housing to taunt the garrison.'
  },
  clue_tallow_slag: {
    id: 'clue_tallow_slag',
    act: 'act1',
    source: 'Tallow Boss · The Hopper',
    name: 'Transmuted Heavy Slag',
    summary: 'Refined ore slag from a pure salt flat carrying heavy bismuth.',
    note: 'Bismuth was never in the local bedrock. Chemical reactions cannot create heavy elements from common salt.'
  },
  clue_lantern_lens: {
    id: 'clue_lantern_lens',
    act: 'act1',
    source: 'Lanternfall Boss · The Lantern-Eater',
    name: 'Fifth Guild Military Prism',
    summary: 'A high-precision optical lens ground for deep ultraviolet beam frequencies.',
    note: 'The Fifth Guild tuned this lens to blind our navigation beacons. They used it to mask an armada moving through the dark.'
  },
  clue_ligar_scorch: {
    id: 'clue_ligar_scorch',
    act: 'act1',
    source: 'Ligar Elite · Basalt Warden',
    name: 'Arc-Sheared Basalt',
    summary: 'A quarry wall sliced cleanly through solid rock by extreme plasma heat.',
    note: 'No industrial mining torch reaches that temperature. The Fifth Guild is field-testing experimental heavy weapons.'
  },
  clue_kettle_ledger: {
    id: 'clue_kettle_ledger',
    act: 'act2',
    source: 'Kettle Elite · Recipe Golem',
    name: 'Forged Mass Ledger',
    summary: 'Captured enemy accounts showing refinery output exceeding raw materials by thirty percent.',
    note: 'Chemical reactions strictly conserve mass. The Fifth Guild is creating metal using forbidden nuclear restructuring.'
  },
  clue_bellows_warm: {
    id: 'clue_bellows_warm',
    act: 'act2',
    source: 'Bellows Boss · The Compressor',
    name: 'The Warm Cylinder',
    summary: 'A sealed gas tank recovered from enemy hijackers that stayed hot for twelve days in freezing air.',
    note: 'A normal gas drops in pressure when cooled. The Fifth Guild hid a radioactive power cell inside.'
  }
};

export const SPINE_BEATS = [
  {
    id: 'beat_tallow_slag',
    act: 'act1',
    order: 1,
    title: 'The Enemy Sample',
    prereq: { bosses: ['unit01/boss-hopper'] },
    speaker: 'VESS // QUARTERMASTER',
    transmission: 'I ran the spectrometer on the slag left by the Fifth Guild raiders. There is bismuth in that salt, and no mine on Tallow ever held a trace of it.',
    onScreen: 'Vess sets a heavy lead-lined specimen tube on the plotting table beside the star chart.'
  },
  {
    id: 'beat_guild_inquiry',
    act: 'act1',
    order: 2,
    title: 'The Council Warning',
    prereq: {
      bosses: ['unit01/boss-hopper', 'unit03/boss-warden'],
      contracts: ['contract_erebus_01']
    },
    speaker: 'IMPERIAL ENVOY // COMMS',
    transmission: 'The Four Guilds order all survey crews to ignore rumors of the Fifth Guild. Their attacks are classified as unauthorized civil unrest.',
    onScreen: 'The high council transmission cuts to harsh static. Vess quietly locks our encrypted local logs.'
  },
  {
    id: 'beat_impossible_ledger',
    act: 'act2',
    order: 3,
    title: 'The Broken Balance',
    prereq: { bosses: ['unit07/boss-golem'] },
    speaker: 'VESS // QUARTERMASTER',
    transmission: 'Kettle’s ledger cannot lie: forty tons of reagent in, fifty-two tons of product out. The Fifth Guild is restructuring matter itself, and they have spies in our ranks.',
    onScreen: 'The seized enemy ledger glows amber on the bridge terminal against strict conservation formulas.'
  },
  {
    id: 'beat_the_catalyst',
    act: 'act3',
    order: 4,
    title: 'The Enemy Revealed',
    prereq: { clues: ['clue_kettle_ledger'] },
    speaker: 'VESS // QUARTERMASTER',
    transmission: 'The leader of the Fifth Guild calls itself The Catalyst. They are the veteran survey crews the Four Guilds abandoned thirty seasons ago on the rim.',
    onScreen: 'A recovered personnel manifest unspools across the console, matching casualty lists to active enemy signals.'
  },
  {
    id: 'beat_cinder_halo',
    act: 'act4',
    order: 5,
    title: 'The Doomsday Reactor',
    prereq: { clues: ['clue_tallow_slag', 'clue_kettle_ledger'] },
    speaker: 'VESS // QUARTERMASTER',
    transmission: 'All enemy power conduits lead straight to Cinder Halo. The Fifth Guild is preparing to ignite an ancient nuclear transmutation core.',
    onScreen: 'The star chart locks onto Cinder Halo, where dangerous atomic decay rings glow in deep space.'
  }
];

export const EPISODES = {
  erebus: {
    worldId: 'erebus',
    worldName: 'Erebus',
    act: 'act1',
    arrival: 'Emergency drop on Erebus: Fifth Guild raiders disabled the Charge Gardens power pylons to collapse planetary defense shields.',
    closing: 'All 20 pylons relit and planetary defense shields online. The Fifth Guild\'s vanguard invasion fleet has been repelled.',
    spoilFamily: 'Infiltration units',
    bossId: 'pylon-20',
    clueId: 'clue_erebus_mark',
    incident: 'Fifth Guild commandos staged a surprise raid on Sector 01, sabotaging the twenty power relay pylons across the Charge Gardens to knock down regional defense shields ahead of an invasion.',
    objective: 'Bridge electrical feeds across all twenty pylons to restore power, reboot planetary shield generators, and push back the Fifth Guild\'s assault force.',
    caseFileNote: 'Markings on the pylon housings prove the Fifth Guild\'s vanguard has been tracking our fleet since the first charter was signed.'
  },
  unit01: {
    worldId: 'unit01',
    worldName: 'Tallow',
    act: 'act1',
    arrival: 'Red alert on Tallow: the Fifth Guild raided the refinery and fled into the dunes. Their animated salt war-machines have surrounded the outpost.',
    closing: 'Tallow perimeter secured. We crushed the enemy salt machines and secured the Fifth Guild\'s stolen heavy slag.',
    spoilFamily: 'Salt husks',
    bossId: 'boss-hopper',
    clueId: 'clue_tallow_slag',
    incident: 'The rogue Fifth Guild launched a surprise raid on Tallow\'s main refinery, stealing vital supplies before vanishing into the desert. To cover their retreat, they deployed animated salt war-machines that are tearing through perimeter defenses.',
    objective: 'Analyze atomic matter across six research stations to expose the enemy\'s escape route, dismantle their salt guardians, and recover the stolen ore sample.',
    caseFileNote: 'The Fifth Guild left heavy bismuth slag behind. They claim to possess alchemy, but real chemistry proves they are using hidden nuclear hardware.'
  },
  unit02: {
    worldId: 'unit02',
    worldName: 'Lanternfall',
    act: 'act1',
    arrival: 'The Fifth Guild knocked out Lanternfall’s optical beacon highway, blinding our orbital sensors. Swarms of energy-draining moths guard their blackout.',
    closing: 'Glacial beacons relit across the ice. We destroyed the enemy swarm and captured the Fifth Guild\'s military spy lens.',
    spoilFamily: 'Lamp moths',
    bossId: 'boss-eater',
    clueId: 'clue_lantern_lens',
    incident: 'Fifth Guild saboteurs knocked out the frozen beacon highway across Lanternfall, cutting off communications and blinding allied fleets. They unleashed swarms of light-eating moths across power cables to keep the entire sector in pitch darkness.',
    objective: 'Tune light frequencies and electron energy bands across nine optical stations to burn through the moths, relight the planetary beacons, and seize the enemy\'s spy lens.',
    caseFileNote: 'The captured prism was tuned for deep ultraviolet frequencies, proving the Fifth Guild was coordinating secret fleet movements in the dark.'
  },
  unit03: {
    worldId: 'unit03',
    worldName: 'Ligar',
    act: 'act1',
    arrival: 'The Fifth Guild blasted the volcanic gorge on Ligar with seismic explosives. Heavy stone wardens have blocked the only evacuation pass.',
    closing: 'Quarry pass cleared and enemy wardens shattered. Scorch marks show the Fifth Guild fired experimental plasma weapons through solid rock.',
    spoilFamily: 'Basalt wardens',
    bossId: 'boss-warden',
    clueId: 'clue_ligar_scorch',
    incident: 'Fifth Guild commandos blasted the mountain gorge on Ligar with seismic charges, collapsing the canyon to trap allied miners. Giant stone wardens and crystal crawlers have formed a heavy blockade across the blast gates.',
    objective: 'Test mineral hardness, bond strength, and cleave planes across nine quarry stations to shatter the enemy barricade and rescue the trapped garrison.',
    caseFileNote: 'Laser-smooth cuts through solid rock prove the Fifth Guild is testing experimental heavy energy weapons far beyond standard mining gear.'
  },
  unit04: {
    worldId: 'unit04',
    worldName: 'Bellows',
    act: 'act2',
    arrival: 'Fifth Guild hijackers boarded the floating skimmers of Bellows and over-pressured the gas mains. Over-inflated gas bladders are battering the hull.',
    closing: 'Sky-skimmer pressure stabilized and the hijackers repelled. In their locked vault is a warm cylinder radiating illegal energy.',
    spoilFamily: 'Gas bladders',
    bossId: 'boss-compressor',
    clueId: 'clue_bellows_warm',
    incident: 'Fifth Guild pirates hijacked the floating sky-stations above Bellows, tampering with the pressure valves to plunge the fleet into the clouds. Swollen gas bladders are hammering the station bulkheads toward critical blowout.',
    objective: 'Master gas pressure and volume across six stations to vent the over-pressured lines, disable the rogue Compressor, and stop the station from crashing.',
    caseFileNote: 'The warm cylinder seized from the hijackers stayed hot for twelve days in freezing air—a direct sign of secret radioactive power cells.'
  },
  unit05: {
    worldId: 'unit05',
    worldName: 'Ember Reach',
    act: 'act2',
    arrival: 'Fifth Guild siphons are draining volcanic thermal plants on Ember Reach. Rogue molten crucibles are marching on the command post.',
    closing: 'Crucibles shattered and thermal conduits saved. Siphon logs reveal the Fifth Guild diverted gigawatts of heat to a hidden bunker.',
    spoilFamily: 'Slag crucibles',
    incident: 'The Fifth Guild tapped the geothermal power plants on Ember Reach, siphoning volcanic heat to charge clandestine war gear while freezing out the civilian colonies.',
    objective: 'Calculate heat flow and energy barriers across the smelting stations to disrupt the enemy siphons and freeze out the molten guardians.',
    caseFileNote: 'The power drain confirms the Fifth Guild is building a subterranean staging base somewhere in the deep rim.'
  },
  unit06: {
    worldId: 'unit06',
    worldName: 'Mirrowen',
    act: 'act2',
    arrival: 'Fifth Guild saboteurs froze the canal locks on Mirrowen into razor-sharp crystal reefs. Allied supply ships are pinned in the harbor.',
    closing: 'Canal barriers dissolved and the fleet freed. The chemical ice left behind matches synthetic compounds from the Fifth Guild\'s fleet.',
    spoilFamily: 'Brine crawlers',
    incident: 'The Fifth Guild deployed fast-freezing chemical torpedoes into Mirrowen’s ocean channels, locking supply convoys in solid ice spikes and ambushing trapped cargo ships.',
    objective: 'Analyze liquid forces and boiling points across the harbor stations to dissolve the ice barricades and clear a lane for the escape convoy.',
    caseFileNote: 'The freezing agent was manufactured using military-grade polymers belonging to the Fifth Guild\'s private strike fleet.'
  },
  unit07: {
    worldId: 'unit07',
    worldName: 'Kettle',
    act: 'act2',
    arrival: 'The Fifth Guild hacked Kettle’s automated war factories, mass-producing armed golems from raw alloy stock.',
    closing: 'Factory assembly lines shut down. The enemy mainframe yielded an illegal logistics ledger recording stolen matter.',
    spoilFamily: 'Recipe golems',
    bossId: 'boss-golem',
    clueId: 'clue_kettle_ledger',
    incident: 'Fifth Guild cyber-agents hijacked the automated manufacturing foundries on Kettle, reprogramming the assembly lines to mass-produce heavy war-golems to reinforce their raiding forces.',
    objective: 'Balance chemical recipe formulas and cut off limiting reagents across the foundry stations to starve the production line and defeat the boss golem.',
    caseFileNote: 'The captured enemy ledger shows 30% more material produced than raw ore input—the Fifth Guild is transmuting matter from a forbidden nuclear core.'
  },
  unit08: {
    worldId: 'unit08',
    worldName: 'Teeter',
    act: 'act3',
    arrival: 'Fifth Guild infiltrators rigged the chemical reactors on Teeter, swinging pressure valves to trigger a catastrophic chain reaction.',
    closing: 'Reactor balance restored and disaster averted. Security black boxes confirm the Fifth Guild used the chaos to plunder secret vaults.',
    spoilFamily: 'Balance husks',
    incident: 'Enemy infiltrators sabotaged the stabilization valves on Teeter, triggering violent chemical swings to cause a total refinery meltdown and distract defense forces while they loot the central vault.',
    objective: 'Counter the chemical shifts across the balance stations using reaction laws to stabilize the reactors before critical explosion.',
    caseFileNote: 'Security logs show the sabotage was an inside job coordinated by Fifth Guild sleeper agents within the allied ranks.'
  },
  unit09: {
    worldId: 'unit09',
    worldName: 'Verdigris',
    act: 'act3',
    arrival: 'The Fifth Guild breached the chemical reservoirs on Verdigris, flooding base pilings with acid to collapse our frontier fortress.',
    closing: 'Acid torrents neutralized and structural pilings secured. The weaponized acid matches formulas used by forgotten pioneer crews.',
    spoilFamily: 'Caustic leaches',
    incident: 'Fifth Guild commandos breached the acid reservoirs on Verdigris, sending torrents of burning acid eating through the foundation pilings of our frontline command station.',
    objective: 'Run precision neutralization and mix chemical buffers across the swamp stations to quench the acid flood and save the fortress.',
    caseFileNote: 'The acid attack used vintage formulas from thirty years ago, confirming the Fifth Guild was formed by military crews abandoned by the high council.'
  },
  unit10: {
    worldId: 'unit10',
    worldName: 'Brinewire',
    act: 'act3',
    arrival: 'Fifth Guild energy parasites drained Brinewire’s power grid to zero, diverting all electricity to an off-world beam weapon.',
    closing: 'Grid repolarized and parasitic nodes burned out. Decrypted transmission cables lead straight toward the Fifth Guild\'s secret fleet.',
    spoilFamily: 'Galvanic ticks',
    incident: 'The Fifth Guild dropped electrical parasite-mines across Brinewire\'s salt flats, completely draining the planetary defense shields and piping terawatts of stolen power into orbit.',
    objective: 'Build electrochemical cells and reverse the current across the power stations to shock and fry the enemy drain-taps.',
    caseFileNote: 'Heavy copper cables beneath the mud were transmitting planet-busting electrical pulses directly toward the outer exclusion zone.'
  },
  unit11: {
    worldId: 'unit11',
    worldName: 'Quicklight',
    act: 'act3',
    arrival: 'Fifth Guild bombers hit the cracking towers on Quicklight with instantaneous flash-explosives, wiping out the scout perimeter.',
    closing: 'Explosive chain reactions halted. We captured the Fifth Guild\'s secret chemical trigger and learned their true title: The Catalyst.',
    spoilFamily: 'Kinetic flares',
    incident: 'The Fifth Guild detonated ultra-fast chemical flash-bombs across the fuel refineries of Quicklight, triggering explosive chain reactions that threaten to incinerate the planetary atmosphere.',
    objective: 'Measure reaction speeds and activation energies across the refinery stations to identify the enemy chemical accelerator and shut down the blasts.',
    caseFileNote: 'The Fifth Guild calls itself The Catalyst. They ignite rapid rebellions across star systems without ever being caught on official records.'
  },
  unit12: {
    worldId: 'unit12',
    worldName: 'Lodestone',
    act: 'act4',
    arrival: 'The Fifth Guild built a massive magnetic beam-cannon on Lodestone, pulling allied vessels out of orbit and crushing their hulls.',
    closing: 'Magnetic array neutralized and beam targeting decoded. Radar vectors point straight to the Fifth Guild\'s dreadnought base on Cinder Halo.',
    spoilFamily: 'Coordination sentinels',
    incident: 'The Fifth Guild fortified the magnetic canyons of Lodestone, erecting a giant magnetic array that is dragging allied transports down from orbit into the jagged canyon rocks.',
    objective: 'Manipulate magnetic crystal nodes and metal complexes across the canyon stations to dismantle the enemy cannon and decrypt their fleet radar.',
    caseFileNote: 'Decoded radar vectors pinpoint the Fifth Guild\'s supreme command base inside the radioactive exclusion zone of Cinder Halo.'
  },
  unit13: {
    worldId: 'unit13',
    worldName: 'Thornmere',
    act: 'act4',
    arrival: 'The Fifth Guild constructed an impenetrable swamp fortress on Thornmere, wrapped in heavy armor plating to shield their war fleet.',
    closing: 'Armor plating dissolved and fortress breached. The protective shell was designed to withstand extreme atomic radiation.',
    spoilFamily: 'Polymer carapaces',
    incident: 'The Fifth Guild transformed the tar marshes of Thornmere into a fortified staging ground, spraying bulletproof organic armor over their pillboxes to repel allied siege tanks.',
    objective: 'Target polymer chains and bond links across the swamp stations to dissolve the enemy fortifications and storm the command post.',
    caseFileNote: 'The armor was infused with radiation shielding, revealing the Fifth Guild is preparing their troops to operate inside a lethal radioactive core.'
  },
  unit14: {
    worldId: 'unit14',
    worldName: 'Cinder Halo',
    act: 'act4',
    arrival: 'Final battle: The Fifth Guild has activated an ancient doomsday transmutation core on Cinder Halo, threatening to reshape reality!',
    closing: 'Transmutation core stabilized and the Fifth Guild brought to terms. Corporate abandonment is exposed and peace is restored to the stars.',
    spoilFamily: 'Transmutation core',
    incident: 'The Fifth Guild has ignited an ancient forbidden transmutation core on Cinder Halo. They are restructuring atomic nuclei to forge whole fleets and weapons from asteroid scrap, risking a star-shattering cataclysm.',
    objective: 'Confront the boundary between chemistry and nuclear physics. Measure decay rates and atomic binding energy to shut down the runaway reactor and end the war.',
    caseFileNote: 'The Fifth Guild was born from forgotten soldiers left to die. Through true science, we stopped their doomsday machine and gave them their rightful voice.'
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
