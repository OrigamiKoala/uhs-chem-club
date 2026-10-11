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

export const CAMPAIGN_STORY = [
  {
    speaker: 'NARRATIVE LOG // DEEP RIM',
    text: 'The hull plates of the Avalon groan with every orbital burn. Out here past the charted lanes, four industrial monopolies carve up the rim under a brittle peace treaty—stripping barren crusts, harvesting storm gas, and smelting armor plates. We survive on what they discard.'
  },
  {
    speaker: 'VESS // QUARTERMASTER',
    text: 'Then the automated distress beacons started dying. Unchartered frigates with scorched hulls have been ambushing remote depots, leaving behind crawler husks made of salt and slag that march across the sand under their own power.'
  },
  {
    speaker: 'NARRATIVE LOG // OUTPOST RUMORS',
    text: 'Frontier canteens whisper of a ghost armada: the Fifth Guild. The superstitious call it alchemy—swearing the raiders conjure legions out of empty dust and bleed heat from stone without consuming fuel.'
  },
  {
    speaker: 'VESS // QUARTERMASTER',
    text: '"Alchemy is a coward\'s fairytale," Vess muttered, slamming a scorched alloy sample onto the plotting table. "Matter does not bargain. Mass is conserved to the final microgram, and every chemical bond has a breaking point. That is where we strike."'
  },
  {
    speaker: 'TACTICAL DISPATCH // STANDING ORDERS',
    text: 'Fourteen worlds. A trail of stolen matter leading straight into the radioactive core of Cinder Halo. We trace their sabotage, dismantle their machines, and uncover who abandoned them before their reactor tears the rim apart.'
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
    paragraphs: [
      'The sirens tripped the moment our landing thrusters bit into the iron sand. Out across the Charge Gardens, the perimeter shields are flickering—twenty high-voltage relay pylons cut down in the dark.',
      'Vess threw open the junction housing with a crowbar, his breath frosting in the cabin air. The copper traces weren\'t torn by weapons; they were bridged with calculated precision, left cold to bleed our batteries into the sand.',
      'Shadows are already cutting through the cloud ceiling above. If those twenty junctions aren\'t rewired before the vanguard fleet breaches orbit, Erebus falls without firing a single defensive shot.'
    ],
    incident: 'The sirens tripped the moment our landing thrusters bit into the iron sand. Out across the Charge Gardens, the perimeter shields are flickering—twenty high-voltage relay pylons cut down in the dark.',
    objective: 'Shadows are already cutting through the cloud ceiling above. If those twenty junctions aren\'t rewired before the vanguard fleet breaches orbit, Erebus falls without firing a single defensive shot.',
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
    paragraphs: [
      'The refinery on Tallow is bleeding white dust into the gale. When our boots hit the catwalk, the guard post was empty—no bodies, only bootprints leading out toward the desert dunes.',
      'Then the salt mounds began to twitch. Scraps of ore and jagged crystal knit together into crawling husks, hissing as static arced through their joints. The raiders left them behind to bury their retreat.',
      'Vess scooped a palm of heavy black slag from the intake trench. "Common brine doesn\'t crystallize bismuth," he muttered, watching the sand writhe in the distance. "Whatever they raided this plant for, they left the proof behind."'
    ],
    incident: 'The refinery on Tallow is bleeding white dust into the gale. When our boots hit the catwalk, the guard post was empty—no bodies, only bootprints leading out toward the desert dunes.',
    objective: 'Scraps of ore and jagged crystal knit together into crawling husks, hissing as static arced through their joints. We break their formations and recover the stolen sample before the storm swallows their tracks.',
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
    paragraphs: [
      'Lanternfall is blind. The glacial beacon towers that guide our convoy through the ice shelf have gone black, plunging miles of frozen rift into suffocating dark.',
      'A low, metallic hum vibrates through the frost. Thousands of light-starved moths cling to the power lines, drinking the high-voltage discharge and scattering blinding interference across our scopes.',
      'High in the beacon array, a stolen ultraviolet lens turns slowly in the cold, focusing unseen beams into the void. The Fifth Guild didn\'t just cause a blackout—they\'re hiding a fleet moving under our noses.'
    ],
    incident: 'Lanternfall is blind. The glacial beacon towers that guide our convoy through the ice shelf have gone black, plunging miles of frozen rift into suffocating dark.',
    objective: 'Tune frequencies to burn through the swarm, relight the planetary beacons, and seize the enemy\'s ultraviolet spy prism.',
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
    paragraphs: [
      'The canyon walls on Ligar are still groaning from the blast. Seismic charges shattered the high ridges, choking the extraction pass under ten thousand tons of smoking basalt.',
      'Across the rubble, heavy wardens carved from tectonic rock stand guard, their crystal seams glowing red with stored heat. The miners trapped in the lower drift are running out of clean oxygen.',
      'Vess ran a gauntlet along the severed rock face. The cut was glass-smooth—sliced by plasma temperatures no industrial mining torch could ever reach. We break through these stone sentinels now, or the quarry becomes a tomb.'
    ],
    incident: 'The canyon walls on Ligar are still groaning from the blast. Seismic charges shattered the high ridges, choking the extraction pass under ten thousand tons of smoking basalt.',
    objective: 'Test mineral hardness and cleave planes across the quarry stations to shatter the barricade and reach the trapped survivors.',
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
    paragraphs: [
      'The deck tilts forty degrees as the winds of Bellows slam the floating skimmer. Down in the pressure wells, the gauge needles are pinned against the red stops, vibrating toward blowout.',
      'Masked hijackers stormed the compressor platforms an hour ago, jamming the relief vents to overload the gas bladders. The bulkheads groan like dying whales under the rising atmosphere.',
      'Behind the hijackers\' locked blast hatch, telemetry detects an impossible thermal signature—a sealed cylinder that has stayed scalding hot in sub-zero winds for nearly two weeks. We vent these tanks, or the whole station plunges into the abyss.'
    ],
    incident: 'The deck tilts forty degrees as the winds of Bellows slam the floating skimmer. Down in the pressure wells, the gauge needles are pinned against the red stops, vibrating toward blowout.',
    objective: 'Balance pressure and volume across the compressor stations to vent the over-pressured mains and keep the sky-station aloft.',
    caseFileNote: 'The warm cylinder seized from the hijackers stayed hot for twelve days in freezing air—a direct sign of secret radioactive power cells.'
  },
  unit05: {
    worldId: 'unit05',
    worldName: 'Ember Reach',
    act: 'act2',
    arrival: 'Fifth Guild siphons are draining volcanic thermal plants on Ember Reach. Rogue molten crucibles are marching on the command post.',
    closing: 'Crucibles shattered and thermal conduits saved. Siphon logs reveal the Fifth Guild diverted gigawatts of heat to a hidden bunker.',
    spoilFamily: 'Slag crucibles',
    paragraphs: [
      'The geothermal crucibles of Ember Reach are choking on their own slag. River-beds of molten silicate that once powered three frontier colonies are freezing over in gray crusts.',
      'The Fifth Guild tapped the subterranean conduits directly, bleeding gigawatts of heat away from civilian domes and routing it straight down into an unmapped fault line.',
      'Automated molten sentinels patrol the rim of the caldera, spitting burning cinder at anything that approaches the flow controls. If we don\'t break their thermal siphons, half a million colonists will freeze before sunrise.'
    ],
    incident: 'The geothermal crucibles of Ember Reach are choking on their own slag. River-beds of molten silicate that once powered three frontier colonies are freezing over in gray crusts.',
    objective: 'Disrupt the thermal siphons across the smelting stations to restore power before the civilian outposts freeze over.',
    caseFileNote: 'The power drain confirms the Fifth Guild is building a subterranean staging base somewhere in the deep rim.'
  },
  unit06: {
    worldId: 'unit06',
    worldName: 'Mirrowen',
    act: 'act2',
    arrival: 'Fifth Guild saboteurs froze the canal locks on Mirrowen into razor-sharp crystal reefs. Allied supply ships are pinned in the harbor.',
    closing: 'Canal barriers dissolved and the fleet freed. The chemical ice left behind matches synthetic compounds from the Fifth Guild\'s fleet.',
    spoilFamily: 'Brine crawlers',
    paragraphs: [
      'Mirrowen’s harbor was supposed to be open water. Instead, our prow ground against jagged spires of chemical ice that shot upward from the canal beds like rows of teeth.',
      'The supply transports are wedged tight in the frozen locks, listing under the weight of creeping frost while predatory brine crawlers clamber up their mooring chains.',
      'Vess tested a needle of the ice against our heater coil. It didn\'t melt like water—it fractured along unnatural polymer chains. The Fifth Guild froze this entire bay on purpose, and they\'re waiting for the hulls to buckle.'
    ],
    incident: 'Mirrowen’s harbor was supposed to be open water. Instead, our prow ground against jagged spires of chemical ice that shot upward from the canal beds like rows of teeth.',
    objective: 'Analyze intermolecular forces to dissolve the synthetic ice reefs and open an escape channel for the trapped transports.',
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
    paragraphs: [
      'The foundries of Kettle never sleep, but tonight the assembly lines are stamping out nightmares. The automated presses are forging armor plates without human operators in sight.',
      'Heavy recipe golems stalk the catwalks, feeding raw alloy ingots into the crucible maw to replicate their own mechanical ranks at breakneck speed.',
      'On the terminal desk lies a captured production manifest that defies the universe: forty tons of raw scrap fed into the hoppers, fifty-two tons of finished warplate rolling out. The balance of matter is broken, and Kettle is ground zero.'
    ],
    incident: 'The foundries of Kettle never sleep, but tonight the assembly lines are stamping out nightmares. The automated presses are forging armor plates without human operators in sight.',
    objective: 'Starve the automated assembly lines by cutting off limiting reagents across the foundry stations and take down the golem overseer.',
    caseFileNote: 'The captured enemy ledger shows 30% more material produced than raw ore input—the Fifth Guild is transmuting matter from a forbidden nuclear core.'
  },
  unit08: {
    worldId: 'unit08',
    worldName: 'Teeter',
    act: 'act3',
    arrival: 'Fifth Guild infiltrators rigged the chemical reactors on Teeter, swinging pressure valves to trigger a catastrophic chain reaction.',
    closing: 'Reactor balance restored and disaster averted. Security black boxes confirm the Fifth Guild used the chaos to plunder secret vaults.',
    spoilFamily: 'Balance husks',
    paragraphs: [
      'The pressure bells inside Teeter’s chemical refinery are ringing a steady death knell. The equilibrium valves are swinging wildly between acid and alkali, rocking the foundation pilings.',
      'Infiltrators cut the stabilizer feeds before slipping into the primary security vault. They didn\'t want the fuel—they wanted the distraction while they stripped the high-purity catalysts.',
      'Vess gripped the emergency bypass wheel, coughing through the rising vapor. "Three more minutes of this imbalance and the catalytic chambers tear themselves apart. Rebalance the lines, or we all go up in smoke."'
    ],
    incident: 'The pressure bells inside Teeter’s chemical refinery are ringing a steady death knell. The equilibrium valves are swinging wildly between acid and alkali, rocking the foundation pilings.',
    objective: 'Counter the chemical swings using Le Chatelier\'s principle across the balance stations before the plant tears itself apart.',
    caseFileNote: 'Security logs show the sabotage was an inside job coordinated by Fifth Guild sleeper agents within the allied ranks.'
  },
  unit09: {
    worldId: 'unit09',
    worldName: 'Verdigris',
    act: 'act3',
    arrival: 'The Fifth Guild breached the chemical reservoirs on Verdigris, flooding base pilings with acid to collapse our frontier fortress.',
    closing: 'Acid torrents neutralized and structural pilings secured. The weaponized acid matches formulas used by forgotten pioneer crews.',
    spoilFamily: 'Caustic leaches',
    paragraphs: [
      'Green mist boils off the swamp water around Verdigris. The fortress pilings are hissing as thousand-gallon tanks of industrial acid pour down through the concrete footings.',
      'Caustic leaches swarm the submerged braces, stripping zinc plating and chewing through rebar with terrifying speed. The main communications mast is already leaning into the sludge.',
      'Vess tested the chemical residue against the ship\'s archives. "This isn\'t raider weaponry," he said, his face hardening. "This is military-grade solvent from thirty seasons ago—the kind the High Council issued to frontier scouts before they abandoned them to starve."'
    ],
    incident: 'Green mist boils off the swamp water around Verdigris. The fortress pilings are hissing as thousand-gallon tanks of industrial acid pour down through the concrete footings.',
    objective: 'Run precision neutralization reactions to buffer the acid torrents and save the fortress foundations from collapsing.',
    caseFileNote: 'The acid attack used vintage formulas from thirty years ago, confirming the Fifth Guild was formed by military crews abandoned by the high council.'
  },
  unit10: {
    worldId: 'unit10',
    worldName: 'Brinewire',
    act: 'act3',
    arrival: 'Fifth Guild energy parasites drained Brinewire’s power grid to zero, diverting all electricity to an off-world beam weapon.',
    closing: 'Grid repolarized and parasitic nodes burned out. Decrypted transmission cables lead straight toward the Fifth Guild\'s secret fleet.',
    spoilFamily: 'Galvanic ticks',
    paragraphs: [
      'The salt flats of Brinewire are completely dark. A grid that once lit an entire hemisphere has gone dead, its generator coils silent beneath inches of caustic brine.',
      'Galvanic ticks the size of landmines have latched onto every substation conduit, humming with stolen wattage as they siphon the planet\'s pulse into the mud.',
      'Subterranean cables hum under our feet, vibrating with pulses hot enough to boil the marsh. The Fifth Guild is channeling an ocean of power somewhere off-world—into the black emptiness beyond the rim.'
    ],
    incident: 'The salt flats of Brinewire are completely dark. A grid that once lit an entire hemisphere has gone dead, its generator coils silent beneath inches of caustic brine.',
    objective: 'Build electrochemical cells and reverse the polarity across the substation lines to fry the parasitic drain nodes.',
    caseFileNote: 'Heavy copper cables beneath the mud were transmitting planet-busting electrical pulses directly toward the outer exclusion zone.'
  },
  unit11: {
    worldId: 'unit11',
    worldName: 'Quicklight',
    act: 'act3',
    arrival: 'Fifth Guild bombers hit the cracking towers on Quicklight with instantaneous flash-explosives, wiping out the scout perimeter.',
    closing: 'Explosive chain reactions halted. We captured the Fifth Guild\'s secret chemical trigger and learned their true title: The Catalyst.',
    spoilFamily: 'Kinetic flares',
    paragraphs: [
      'The horizon on Quicklight erupted in violet fire before our retros even fired. A shockwave rattled our heat shields as another cracking tower collapsed in a heap of burning steel.',
      'The fuel vapors in the air are on a knife-edge. The Fifth Guild dropped micro-dosed kinetic flares that accelerate reaction rates tenfold, threatening to ignite the entire upper atmosphere.',
      'In the telemetry chatter, we caught the voice directing the strikes—a ghost transponder calling itself The Catalyst. They aren\'t trying to loot Quicklight. They\'re lighting a fuse across the sector.'
    ],
    incident: 'The horizon on Quicklight erupted in violet fire before our retros even fired. A shockwave rattled our heat shields as another cracking tower collapsed in a heap of burning steel.',
    objective: 'Measure kinetics and activation barriers across the refinery towers to isolate the chemical accelerator before the atmosphere ignites.',
    caseFileNote: 'The Fifth Guild calls itself The Catalyst. They ignite rapid rebellions across star systems without ever being caught on official records.'
  },
  unit12: {
    worldId: 'unit12',
    worldName: 'Lodestone',
    act: 'act4',
    arrival: 'The Fifth Guild built a massive magnetic beam-cannon on Lodestone, pulling allied vessels out of orbit and crushing their hulls.',
    closing: 'Magnetic array neutralized and beam targeting decoded. Radar vectors point straight to the Fifth Guild\'s dreadnought base on Cinder Halo.',
    spoilFamily: 'Coordination sentinels',
    paragraphs: [
      'Our control thrusters locked the moment we crossed Lodestone\'s jagged ridgeline. A brutal magnetic field gripped the hull, dragging our ship down toward the black canyon floor.',
      'Deep in the chasms, the Fifth Guild has linked dozens of natural lodestone veins into an unholy rail cannon, wrenching allied ships out of orbit to smash them against the cliffs.',
      'Vess wrestled the manual steering linkage while the rivets sheared along the port bulkhead. "Dismantle their coordination array," he shouted over the howling wind, "or we join the graveyard at the bottom of the gorge!"'
    ],
    incident: 'Our control thrusters locked the moment we crossed Lodestone\'s jagged ridgeline. A brutal magnetic field gripped the hull, dragging our ship down toward the black canyon floor.',
    objective: 'Disrupt the magnetic crystal coordination nodes across the canyon stations to shut down the gravity rail and free incoming transports.',
    caseFileNote: 'Decoded radar vectors pinpoint the Fifth Guild\'s supreme command base inside the radioactive exclusion zone of Cinder Halo.'
  },
  unit13: {
    worldId: 'unit13',
    worldName: 'Thornmere',
    act: 'act4',
    arrival: 'The Fifth Guild constructed an impenetrable swamp fortress on Thornmere, wrapped in heavy armor plating to shield their war fleet.',
    closing: 'Armor plating dissolved and fortress breached. The protective shell was designed to withstand extreme atomic radiation.',
    spoilFamily: 'Polymer carapaces',
    paragraphs: [
      'The tar swamps of Thornmere smell of scorched resin and heavy ozone. Out in the black marsh stands an iron fortress, wrapped in thick plates of synthetic polymer that deflect heavy rounds like rain.',
      'Behind that armor shell, the Fifth Guild\'s invasion armada is fueling up in silence, their engine vents glowing behind rows of barbed barricades.',
      'Vess scraped a shard of the carapace from an unexploded torpedo. His hand trembled. "Lead-impregnated polymer. This armor isn\'t meant for stopping cannon fire. It\'s built to survive lethal, unshielded nuclear radiation."'
    ],
    incident: 'The tar swamps of Thornmere smell of scorched resin and heavy ozone. Out in the black marsh stands an iron fortress, wrapped in thick plates of synthetic polymer that deflect heavy rounds like rain.',
    objective: 'Target polymer linkages and cross-links across the swamp stations to dissolve the radiation carapace and breach the blast doors.',
    caseFileNote: 'The armor was infused with radiation shielding, revealing the Fifth Guild is preparing their troops to operate inside a lethal radioactive core.'
  },
  unit14: {
    worldId: 'unit14',
    worldName: 'Cinder Halo',
    act: 'act4',
    arrival: 'Final battle: The Fifth Guild has activated an ancient doomsday transmutation core on Cinder Halo, threatening to reshape reality!',
    closing: 'Transmutation core stabilized and the Fifth Guild brought to terms. Corporate abandonment is exposed and peace is restored to the stars.',
    spoilFamily: 'Transmutation core',
    paragraphs: [
      'Cinder Halo hangs in the void like a shattered eye, bathed in the sickly green halo of ancient atomic decay. Our radiation alarms have not stopped screaming since we dropped out of warp.',
      'At the center of the derelict station spins the forbidden core. The Fifth Guild is feeding millions of tons of asteroid rock into its corona, warping nuclei and forging entire armadas from thin air.',
      'The Catalyst stands at the console of the dying sun. Chemistry ends here, at the threshold of nuclear destruction. We shut this runaway reactor down now, or the entire frontier burns in its flash.'
    ],
    incident: 'Cinder Halo hangs in the void like a shattered eye, bathed in the sickly green halo of ancient atomic decay. Our radiation alarms have not stopped screaming since we dropped out of warp.',
    objective: 'Calculate nuclear decay rates and binding energies to breach the containment seal, shut down the core, and end the war.',
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
