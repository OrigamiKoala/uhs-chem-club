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
    summary: 'The rogue Fifth Guild launches surprise raids across frontier worlds, using animated machines to guard their sabotage.'
  },
  {
    id: 'act2',
    order: 2,
    title: 'Act II: Stolen Power & Sabotage',
    worlds: ['unit04', 'unit05', 'unit06', 'unit07'],
    summary: 'The raiders hijack fuel stations and steal power, breaking the laws of science by trying to create matter from nothing.'
  },
  {
    id: 'act3',
    order: 3,
    title: 'Act III: The Catalyst Revealed',
    worlds: ['unit08', 'unit09', 'unit10', 'unit11'],
    summary: 'Defense networks fall under coordinated attacks as the mastermind behind the raiders emerges: The Catalyst.'
  },
  {
    id: 'act4',
    order: 4,
    title: 'Act IV: The Doomsday Core',
    worlds: ['unit12', 'unit13', 'unit14'],
    summary: 'We follow the enemy fleet into the radioactive core of Cinder Halo to shut down an unstable nuclear reactor before it explodes.'
  }
];

export const CLUES = {
  clue_erebus_mark: {
    id: 'clue_erebus_mark',
    act: 'act1',
    source: 'Erebus Contract · Pylon 20',
    name: 'Fifth Guild Infiltration Mark',
    summary: 'A covert triangle symbol stamped behind the power tower casing.',
    note: 'The raiders deliberately disconnected the power circuits before we arrived. They left their mark behind to taunt us.'
  },
  clue_tallow_slag: {
    id: 'clue_tallow_slag',
    act: 'act1',
    source: 'Tallow Boss · The Hopper',
    name: 'Strange Heavy Metal Slag',
    summary: 'Refined metal slag containing heavy bismuth found on a pure salt flat.',
    note: 'Bismuth does not occur naturally in salt flats. Chemical reactions between salts cannot produce heavy metals out of thin air.'
  },
  clue_lantern_lens: {
    id: 'clue_lantern_lens',
    act: 'act1',
    source: 'Lanternfall Boss · The Lantern-Eater',
    name: 'Ultraviolet Spy Lens',
    summary: 'A precision glass lens tuned for invisible ultraviolet light beams.',
    note: 'The raiders used this lens to blind our navigation beacons and guide their own ships secretly through the dark.'
  },
  clue_ligar_scorch: {
    id: 'clue_ligar_scorch',
    act: 'act1',
    source: 'Ligar Elite · Basalt Warden',
    name: 'Melted Basalt Rock',
    summary: 'A quarry boulder sliced glass-smooth by extreme heat.',
    note: 'Normal mining torches can never cut rock that cleanly. The raiders are testing powerful experimental heat weapons.'
  },
  clue_kettle_ledger: {
    id: 'clue_kettle_ledger',
    act: 'act2',
    source: 'Kettle Elite · Recipe Golem',
    name: 'Forged Production Ledger',
    summary: 'Factory logs claiming fifty tons of metal from forty tons of ore.',
    note: 'Real chemical reactions strictly conserve mass—you cannot get more metal out than ore put in. The raiders must be using hidden nuclear energy.'
  },
  clue_bellows_warm: {
    id: 'clue_bellows_warm',
    act: 'act2',
    source: 'Bellows Boss · The Compressor',
    name: 'The Warm Gas Tank',
    summary: 'A sealed tank from enemy hijackers that stayed hot for nearly two weeks in sub-zero winds.',
    note: 'Normal gases cool down in cold air. The only way this tank stayed hot is if a radioactive heat cell was hidden inside.'
  },
  clue_ember_siphon: {
    id: 'clue_ember_siphon',
    act: 'act2',
    source: 'Ember Reach Boss · The Crucible',
    name: 'The Siphon Manifold',
    summary: 'A high-capacity geothermal heat exchanger tapped into the caldera main.',
    note: 'The siphon routed megawatts of thermal energy away from the shelters without venting any steam to the sky. The raiders were feeding a hidden endothermic process below the crust.'
  },
  clue_mirrowen_agent: {
    id: 'clue_mirrowen_agent',
    act: 'act2',
    source: 'Mirrowen Boss · The Undertow',
    name: 'The Canal Sample',
    summary: 'A sealed sample of the fluid the raiders poured into the canal.',
    note: 'The freezing agent was a synthetic fluid. It was made, not mined, so somebody built a plant to make it.'
  }
};

export const SPINE_BEATS = [
  {
    id: 'beat_tallow_slag',
    act: 'act1',
    order: 1,
    title: 'The Enemy Sample',
    prereq: { bosses: ['unit01/boss-hopper'] },
    speaker: 'Vess',
    transmission: 'I ran tests on the metal slag left behind by the raiders. There is bismuth in that salt, and no mine on Tallow has ever held a trace of it.',
    onScreen: 'Vess sets a heavy specimen tube on the table beside the star chart.'
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
    speaker: 'Imperial Envoy',
    transmission: 'The high council orders all crews to ignore rumors of the Fifth Guild. They want us looking the other way.',
    onScreen: 'The council transmission cuts to static. Vess quietly locks our encrypted local logs.'
  },
  {
    id: 'beat_impossible_ledger',
    act: 'act2',
    order: 3,
    title: 'The Broken Balance',
    prereq: { bosses: ['unit07/boss-golem'] },
    speaker: 'Vess',
    transmission: 'Kettle’s factory ledger shows fifty tons of metal produced from forty tons of ore. Real chemistry never creates matter from nothing.',
    onScreen: 'The seized enemy ledger glows amber on the bridge terminal.'
  },
  {
    id: 'beat_the_catalyst',
    act: 'act3',
    order: 4,
    title: 'The Enemy Revealed',
    prereq: { clues: ['clue_kettle_ledger'] },
    speaker: 'Vess',
    transmission: 'The raider commander calls themselves The Catalyst. They are the soldiers the old guilds abandoned thirty years ago on the rim.',
    onScreen: 'A recovered personnel record appears on the screen, matching casualty lists to active raider signals.'
  },
  {
    id: 'beat_cinder_halo',
    act: 'act4',
    order: 5,
    title: 'The Doomsday Reactor',
    prereq: { clues: ['clue_tallow_slag', 'clue_kettle_ledger'] },
    speaker: 'Vess',
    transmission: 'All enemy power cables lead straight to Cinder Halo. The Fifth Guild is preparing to ignite an ancient nuclear reactor.',
    onScreen: 'The star chart locks onto Cinder Halo, where dangerous radiation warnings flash.'
  }
];

export const CAMPAIGN_STORY = [
  {
    speaker: 'Vess',
    text: 'Welcome aboard the Avalon, recruit. I am Vess, your quartermaster. Our ship travels the frontier between star systems, salvaging supplies and keeping independent colonies alive. Out here, help is very far away, so we have to look out for each other.'
  },
  {
    speaker: 'Vess',
    text: 'Recently, our distress sensors started picking up emergency signals across the rim. A rogue fleet calling itself the Fifth Guild has attacked our remote outposts. They left behind hostile automated machines that guard the damaged stations and block our workers from repairing them.'
  },
  {
    speaker: 'Vess',
    text: 'Rumors are spreading that these raiders have supernatural powers, because their machines move on their own and survive extreme conditions. But that is superstition. There is no magic in this universe—only the laws of nature and chemistry.'
  },
  {
    speaker: 'Vess',
    text: 'Everything in space is made of atoms and basic chemical elements. When you understand how matter behaves—how parts fit together, how heat moves, and how reactions work—their machines stop being frightening. Science is how we fight back.'
  },
  {
    speaker: 'Vess',
    text: 'We have fourteen worlds to visit. On each world, we will stop their sabotage, restore power to the stations, and trace their trail back to their secret base. Keep your communication link open and stay alert.'
  }
];

export const EPISODES = {
  erebus: {
    worldId: 'erebus',
    worldName: 'Erebus',
    act: 'act1',
    arrival: 'Recruit, we have dropped into the atmosphere over Erebus. The raiders cut power to the Charge Gardens, and our planetary defense shields are completely dark.',
    closing: 'All twenty power towers are back online. The defense shield has restarted, and the enemy raiders have fled into deep space.',
    spoilFamily: 'Infiltration units',
    bossId: 'pylon-20',
    clueId: 'clue_erebus_mark',
    paragraphs: [
      'Recruit, listen up. We just landed in the desert of Erebus, right outside the Charge Gardens. This facility is a power station that powers the defensive energy shield for the entire region.',
      'The raiders broke in before we arrived and deliberately disconnected the main power circuits across twenty towers. Without power running through these circuits, the protective shield cannot turn on, leaving every nearby town open to attack.',
      'Your job is to walk through the station, inspect each broken connection, and bridge the power line from the energy source to the receiver. Once all twenty towers are relit, our defenses will be secure.'
    ],
    incident: 'The raiders cut the main circuits across all twenty power towers, disabling the regional defense shield.',
    objective: 'Reconnect the power line from the energy source to the receiver in every tower to reboot the shield.',
    caseFileNote: 'The disconnected circuits were sabotaged deliberately to test our response time. The raiders knew exactly which power lines to cut.'
  },
  unit01: {
    worldId: 'unit01',
    worldName: 'Tallow',
    act: 'act1',
    arrival: 'We are over the salt flats of Tallow. The raiders attacked the mineral refinery and left behind strange walking machines made of salt and stone.',
    closing: 'The salt machines are dismantled and the refinery is safe. We recovered a strange piece of heavy black metal that the raiders left behind.',
    spoilFamily: 'Salt husks',
    bossId: 'boss-hopper',
    clueId: 'clue_tallow_slag',
    paragraphs: [
      'This is Tallow, a desert world covered in vast salt flats. Workers here refine natural minerals and salts from the dry lake beds to send supplies to other colonies.',
      'When the raiders struck, they scattered the sorted minerals and used electric charges to form walking machines out of salt crust. These machines are roaming the dunes, keeping workers away from the equipment.',
      'We need to identify the basic elements in the dirt, sort the pure substances from the mixtures, and break their salt guards apart. Look for any strange metal scraps they dropped during the raid.'
    ],
    incident: 'The raiders attacked the mineral refinery and formed animated guard machines out of salt and dust.',
    objective: 'Sort the raw elements and pure minerals across the workstations to disable the salt guards and secure the refinery.',
    caseFileNote: 'The metal scrap we recovered contains bismuth, an element that does not belong in natural salt. Someone brought heavy metals here from another star system.'
  },
  unit02: {
    worldId: 'unit02',
    worldName: 'Lanternfall',
    act: 'act1',
    arrival: 'Lanternfall is experiencing a total blackout. The raiders disabled the giant light towers that guide our ships safely through the polar ice shelf.',
    closing: 'The light towers are burning bright again across the ice. We cleared the insect swarms and captured an optical lens the raiders dropped.',
    spoilFamily: 'Lamp moths',
    bossId: 'boss-eater',
    clueId: 'clue_lantern_lens',
    paragraphs: [
      'We have reached Lanternfall, a frozen world covered in thick glaciers. Because it is always dark here, ships rely on massive light towers to navigate between the mountains of ice.',
      'The raiders knocked out the beacon frequencies, plunging the shipping lanes into total darkness. Swarms of small electronic drones that look like moths have gathered around the power cables, feeding on the stray energy.',
      'We need to tune each lamp to the correct color of light so the beams can cut through the fog and scatter the swarms. Once the beacons are relit, our supply ships will be able to fly safely again.'
    ],
    incident: 'The raiders shut off the light towers across the glacier and left energy-draining drones to maintain the blackout.',
    objective: 'Tune the light wavelengths and match the energy levels at each tower to relight the planetary beacons.',
    caseFileNote: 'The optical lens we recovered was designed to filter invisible ultraviolet light. The raiders were using it to guide stealth ships through the dark.'
  },
  unit03: {
    worldId: 'unit03',
    worldName: 'Ligar',
    act: 'act1',
    arrival: 'We have arrived at the rock quarries of Ligar. The raiders blasted the canyon walls, and giant stone guardians are blocking the path to the trapped miners.',
    closing: 'The canyon pass is cleared and the miners are safe. The cut marks on the stone show the raiders used weapons far hotter than normal mining lasers.',
    spoilFamily: 'Basalt wardens',
    bossId: 'boss-warden',
    clueId: 'clue_ligar_scorch',
    paragraphs: [
      'Ligar is a volcanic world known for its deep rock quarries. The miners here cut heavy stone blocks that are used to build bases and heat-resistant hulls for our ships.',
      'The raiders detonated explosives along the canyon ridges, burying the main rescue tunnel under thousands of tons of hard volcanic rock. They also left heavy stone sentinels standing guard over the rubble.',
      'Every rock is held together by chemical bonds between atoms. By finding the natural cleavage planes and weak spots in the mineral crystal, you can break the blocks cleanly and clear the path before the miners run out of air.'
    ],
    incident: 'A rockslide triggered by enemy explosives has trapped miners beneath the quarry cliffs.',
    objective: 'Analyze the bonds holding the mineral crystals together to break the boulders and clear the rescue pass.',
    caseFileNote: 'The boulders were sliced with glass-smooth cuts. Only extremely powerful heat weapons, far beyond ordinary mining gear, could melt stone like that.'
  },
  unit04: {
    worldId: 'unit04',
    worldName: 'Bellows',
    act: 'act2',
    arrival: 'We are docking at the floating sky station of Bellows. Raiders have jammed the gas valves, and rising air pressure threatens to crush the outer hull.',
    closing: 'The gas tanks have returned to safe pressure levels and the station is stable. In the raiders\' cargo pod, we found a sealed tank that stays unnaturally warm.',
    spoilFamily: 'Gas bladders',
    bossId: 'boss-compressor',
    clueId: 'clue_bellows_warm',
    paragraphs: [
      'Welcome to Bellows. This station floats high above the clouds of a giant gas planet, harvesting clean fuel from the atmosphere to keep our fleet flying.',
      'A group of raiders boarded the platform and locked the pressure relief valves. When you trap too much gas in a tight space or heat it up, the pressure rises until the walls rupture.',
      'The dials on the gas tanks are dangerously close to exploding. You need to adjust the volume and cool the tanks down to balance the pressure before the metal hulls buckle under the strain.'
    ],
    incident: 'Enemy saboteurs jammed the pressure vents on the floating fuel station, causing the storage tanks to over-inflate.',
    objective: 'Balance the temperature and gas volume at each compressor to release trapped pressure and prevent a hull blowout.',
    caseFileNote: 'We found a sealed gas cylinder in the enemy vault that stays scalding hot in freezing air. That steady heat is a clear sign of radioactive material inside.'
  },
  unit05: {
    worldId: 'unit05',
    worldName: 'Ember Reach',
    act: 'act2',
    arrival: 'We have dropped over the volcanic plants of Ember Reach. The raiders are siphoning underground heat, leaving the civilian shelters without warmth.',
    closing: 'The heat lines are restored and the shelters are warm again. Our telemetry shows the raiders pumped the stolen heat down into an underground bunker.',
    spoilFamily: 'Slag crucibles',
    bossId: 'boss-crucible',
    clueId: 'clue_ember_siphon',
    paragraphs: [
      'Ember Reach is an active volcanic world. Colonies here survive by tapping the heat from underground magma pools to generate electricity and keep their homes warm.',
      'The raiders attached giant cooling siphons to the main heat pipes, stealing energy and routing it away from the towns. If the heat stops flowing, the power generators will shut down and the colonies will freeze.',
      'Heat naturally moves from hotter objects to colder ones. You need to redirect the thermal flow, clear the frozen valves, and make sure every watt of heat reaches the generators where people need it.'
    ],
    incident: 'The raiders tapped into geothermal energy pipes, draining essential heat away from civilian outposts.',
    objective: 'Redirect thermal energy and balance heat transfers across the geothermal stations to restore colony power.',
    caseFileNote: 'The stolen heat was channeled deep into an unmapped cave system. The raiders are powering a hidden underground base somewhere nearby.'
  },
  unit06: {
    worldId: 'unit06',
    worldName: 'Mirrowen',
    act: 'act2',
    arrival: 'We are approaching the waterways of Mirrowen. Raiders dumped artificial freezing chemicals into the shipping canals, trapping our supply boats in solid ice.',
    closing: 'The chemical ice has melted and the waterways are flowing freely. Laboratory tests show the freezing chemical was military-grade synthetic fluid.',
    spoilFamily: 'Brine crawlers',
    bossId: 'boss-undertow',
    clueId: 'clue_mirrowen_agent',
    paragraphs: [
      'Mirrowen is a watery ocean world where cargo ships travel through deep canal networks to move food and clean water between island cities.',
      'The raiders released chemical agents into the water that forced it to freeze into sharp crystal walls at normal temperatures. Our cargo ships are stuck in the ice, and the creeping frost is crushing their hulls.',
      'Substances stay solid or melt based on the attractive forces between their molecules. You need to test the ice samples, find what disrupts the bonds between the molecules, and melt the barriers to free the fleet.'
    ],
    incident: 'Chemical freezing agents have locked the water canals in artificial ice, trapping transport ships in the harbor.',
    objective: 'Break the molecular attractions in the synthetic ice to clear the shipping channels and save the trapped vessels.',
    caseFileNote: 'The freezing chemical was made from advanced synthetic polymers. Only specialized naval warships carry compounds capable of freezing water like that.'
  },
  unit07: {
    worldId: 'unit07',
    worldName: 'Kettle',
    act: 'act2',
    arrival: 'We are over the automated metal factories of Kettle. The raiders reprogrammed the smelting machines to build robotic soldiers around the clock.',
    closing: 'The rogue factory lines are turned off and the robotic overseer is stopped. We found a forged production ledger that shows an impossible amount of metal.',
    spoilFamily: 'Recipe golems',
    bossId: 'boss-golem',
    clueId: 'clue_kettle_ledger',
    paragraphs: [
      'Kettle is a manufacturing world with giant automated foundries. Raw ores go into the furnaces, and finished steel plates come out to build tools, pipes, and spacecraft.',
      'The raiders hijacked the factory computers and set them to assemble armed combat robots using our stored metal. If these assembly lines keep running, they will produce an army before tomorrow morning.',
      'In any chemical recipe, a reaction stops when you run out of the first ingredient. By calculating the exact amount of raw materials needed and cutting off the key ingredient, you can shut down the robot lines for good.'
    ],
    incident: 'Automated foundries have been reprogrammed by raiders to mass-produce mechanical combat units from raw metal.',
    objective: 'Cut off the limiting materials and balance the factory recipes to halt the robot assembly lines.',
    caseFileNote: 'The captured factory log claims fifty tons of metal came out of forty tons of ore. Real chemistry never creates matter from nothing—the raiders must be hiding a nuclear energy source.'
  },
  unit08: {
    worldId: 'unit08',
    worldName: 'Teeter',
    act: 'act3',
    arrival: 'Alarms are sounding across the chemical refinery on Teeter. Raiders pushed the balance valves out of alignment, threatening to trigger a runaway chemical explosion.',
    closing: 'The reaction tanks are back in balance and the refinery is safe. Security logs reveal the raiders caused this panic to sneak into the high-security storage rooms.',
    spoilFamily: 'Balance husks',
    paragraphs: [
      'Teeter houses a massive chemical processing plant that produces clean fertilizers and medical fluids for dozens of surrounding farming worlds.',
      'The reactions inside these tanks are two-way streets that need a delicate balance between forward and backward flow. The raiders tampered with the controls, pushing the chemicals to one side so the tanks are shaking violently.',
      'When you push a balanced reaction by changing temperature or pressure, it pushes back in the opposite direction. You need to adjust the conditions to steer the reaction back to the center before the pipes burst.'
    ],
    incident: 'Saboteurs altered the control valves on reversible chemical tanks, pushing the plant toward a dangerous explosion.',
    objective: 'Counter the pressure and temperature shifts to guide the chemical reactions back into stable balance.',
    caseFileNote: 'The raiders deliberately caused this emergency as a distraction while their agents stole high-grade purification filters from the central vault.'
  },
  unit09: {
    worldId: 'unit09',
    worldName: 'Verdigris',
    act: 'act3',
    arrival: 'Emergency call from the swamp fortress on Verdigris. Raiders ruptured industrial acid tanks, and the corrosive liquid is eating through the building foundations.',
    closing: 'The acid spills have been safely neutralized and the fortress walls are secure. Chemical analysis shows the acid came from old government supplies abandoned decades ago.',
    spoilFamily: 'Caustic leaches',
    paragraphs: [
      'Verdigris is a humid wetland world built around an old communications fortress that keeps our emergency radios connected across the sector.',
      'The raiders blasted the storage vats, dumping thousands of gallons of strong acid into the shallow water around the support pillars. The acid is dissolving the steel beams and concrete footings beneath our feet.',
      'Acids can be safely disarmed by adding the right amount of a basic substance to turn them into harmless water and salt. You need to measure how strong the acid is and mix the exact neutralizer needed to protect the fortress.'
    ],
    incident: 'Industrial acid tanks were ruptured around the fortress support pillars, rapidly corroding the metal structure.',
    objective: 'Measure the strength of the spilled acid and apply basic neutralizers to save the fortress foundations.',
    caseFileNote: 'The acid barrels carried military markings from thirty years ago. The raiders are using gear left behind when the old government abandoned frontier garrisons to fend for themselves.'
  },
  unit10: {
    worldId: 'unit10',
    worldName: 'Brinewire',
    act: 'act3',
    arrival: 'The power grid across the salt flats of Brinewire is dead. Raiders attached parasitic battery drain devices to the main cables, stealing all electrical current.',
    closing: 'The electrical grid has been repolarized and the drain devices are destroyed. Decrypted signals show the stolen power was beamed to an off-world fleet.',
    spoilFamily: 'Galvanic ticks',
    paragraphs: [
      'Brinewire is a shallow saltwater marsh where natural chemical pools are connected to generate electricity for homes and hospital wards across the continent.',
      'The raiders clamped heavy metal drain nodes onto the power cables under the water. These clamps act like reverse batteries, pulling every amp of electricity out of the wires and leaving the towns completely dark.',
      'Electricity flows when electrons move between two different metals in a salty liquid. You need to assemble the correct metal electrodes to reverse the current, burn out the parasite nodes, and get the lights back on.'
    ],
    incident: 'Heavy electrical siphon clamps have drained the regional power grid, plunging towns into complete darkness.',
    objective: 'Connect the right metal plates and salt solutions to build opposing electrical cells that fry the enemy siphon nodes.',
    caseFileNote: 'The stolen power was being transmitted into deep space by a high-powered beam antenna. The raiders are charging the weapons of a hidden battle armada.'
  },
  unit11: {
    worldId: 'unit11',
    worldName: 'Quicklight',
    act: 'act3',
    arrival: 'Explosions are rocking the fuel cracking towers on Quicklight. The raiders dropped chemical accelerators into the storage tanks, speeding up combustion to explosive levels.',
    closing: 'The runaway reactions are halted and the fuel depot is safe. We intercepted an enemy transmission from their supreme leader, who calls themselves \'The Catalyst\'.',
    spoilFamily: 'Kinetic flares',
    paragraphs: [
      'Quicklight is a high-altitude refinery station that purifies aviation fuel. The vapors in the air here are combustible, so workers are normally very careful to keep temperatures low.',
      'The raiders dropped microscopic catalyst powders into the storage vents. A catalyst speeds up chemical reactions without being consumed, causing the fuel to ignite ten times faster than normal.',
      'You need to measure how fast the heat is climbing and use cooling agents and inhibitor chemicals to slow the reaction down. If we do not stop the acceleration, the entire fuel depot will blow.'
    ],
    incident: 'Enemy agents dropped chemical accelerators into fuel storage tanks, causing violent chain reactions.',
    objective: 'Measure reaction speeds and apply chemical inhibitors to slow down combustion before the refinery explodes.',
    caseFileNote: 'The enemy commander calls themselves \'The Catalyst.\' Just like a chemical catalyst, they ignite rapid rebellions across star systems while staying hidden in the background.'
  },
  unit12: {
    worldId: 'unit12',
    worldName: 'Lodestone',
    act: 'act4',
    arrival: 'Our navigation instruments are failing as we approach Lodestone. The raiders built a giant magnetic cannon in the canyon, pulling supply ships out of the sky.',
    closing: 'The magnetic cannon is disabled and allied ships can fly safely again. Decoded flight coordinates show the raider fleet is based at Cinder Halo.',
    spoilFamily: 'Coordination sentinels',
    paragraphs: [
      'Lodestone is a dark, rocky world rich in natural magnetic iron ores. The deep canyons here are naturally magnetic, but usually gentle enough for ships to navigate safely.',
      'The raiders wired the canyon\'s iron veins together into an enormous magnetic rail cannon. When our supply transports try to fly over the ridge, the cannon pulls on their steel hulls and drags them into the cliff walls.',
      'Certain metal atoms align their electrons to produce strong magnetic forces. By rearranging the metal complexes at each substation, you can cancel out the magnetic pull and shut down the cannon.'
    ],
    incident: 'A giant magnetic field weapon built from natural iron veins is pulling transport ships out of the sky.',
    objective: 'Disrupt the alignment of the metal nodes across the canyon stations to dismantle the magnetic weapon.',
    caseFileNote: 'The computer inside the magnetic cannon was receiving orders from Cinder Halo, a dangerous radioactive star system deep in the forbidden zone.'
  },
  unit13: {
    worldId: 'unit13',
    worldName: 'Thornmere',
    act: 'act4',
    arrival: 'We are over the tar swamps of Thornmere. The raiders built an armored fortress behind thick plastic plates that our standard tools cannot pierce.',
    closing: 'The polymer armor is dissolved and the fortress gates are open. The armor was packed with heavy lead to protect against lethal nuclear radiation.',
    spoilFamily: 'Polymer carapaces',
    paragraphs: [
      'Thornmere is a dense marsh world rich in natural hydrocarbons and organic oils, which colonies use to manufacture tough protective plastics and clothing.',
      'The raiders built an advance staging fortress in the middle of the swamp, wrapping the walls in thick layers of interlocking plastic polymers that deflect laser fire and physical impacts.',
      'Plastics and polymers are long chains of carbon atoms linked together like chains of paperclips. By targeting the chemical links between the chains, you can dissolve the outer armor and open the fortress doors.'
    ],
    incident: 'An enemy staging fortress has been sealed behind heavy interlocking polymer armor plates.',
    objective: 'Target the cross-links holding the carbon chains together to dissolve the protective armor and breach the fortress.',
    caseFileNote: 'The plastic armor was infused with heavy lead. The raiders were not preparing for a conventional gunfight—they were shielding their soldiers to survive inside a radioactive nuclear reactor.'
  },
  unit14: {
    worldId: 'unit14',
    worldName: 'Cinder Halo',
    act: 'act4',
    arrival: 'This is our final mission. We have tracked the Fifth Guild to Cinder Halo, where they have started an unstable nuclear core that threatens to destroy the entire sector.',
    closing: 'The nuclear core is stabilized and the war is over. We have stopped the disaster and brought the forgotten crews to the negotiating table.',
    spoilFamily: 'Transmutation core',
    paragraphs: [
      'We have arrived at Cinder Halo, an abandoned space station built around an ancient nuclear reactor. Radiation sirens are ringing across our bridge—this is the heart of the enemy operation.',
      'Ordinary chemistry rearranges the bonds between atoms, but inside this reactor, the raiders are splitting atomic nuclei themselves. The core is overheating, and if the chain reaction runs wild, the entire station will detonate in a nuclear blast.',
      'The leader of the raiders—The Catalyst—is standing by the reactor controls. They are the soldiers the old guilds abandoned to starve thirty years ago. We need to calculate the atomic decay rates, lower the control rods to cool the core, and end this conflict with truth instead of destruction.'
    ],
    incident: 'The raiders have started an ancient nuclear transmutation reactor that is rapidly overheating toward a catastrophic explosion.',
    objective: 'Balance the nuclear decay rates and insert control rods to stabilize the atomic core and end the war.',
    caseFileNote: 'The Fifth Guild was formed by forgotten soldiers abandoned thirty years ago. By understanding real science, we prevented a catastrophe and gave them a peaceful voice.'
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
