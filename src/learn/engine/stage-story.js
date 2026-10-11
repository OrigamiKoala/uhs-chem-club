/**
 * stage-story.js — the problem each stage solves, in one sentence.
 *
 * The game is: find a piece of chemistry out at the bench, then use it on a
 * problem the crew actually has (the Fifth Guild is raiding and fouling the
 * supply lines). The prompt says what to find; this line says why the crew
 * needs it. It never states the route and never carries the answer, and it
 * obeys the same withheld-vocabulary gate as a prompt (`verify:learn`).
 *
 * Indexed by quest id, then by stage index (0-based).
 */
export const STAGE_STORY = {
  'q1-grain': [
    'A smelter crate looks like one smooth block, and the crew has to know what it is really made of before it goes in the fire.',
    'The Fifth Guild swapped one of two grey shipments for filler, and the reactor will only take the pure one.',
    'Gravel from the salt pan is headed for the smelter, and the crew has to know how many different things are mixed into it.',
    'A saboteur claims one crate cannot be broken down any further, and the cutter will show whether that is true.',
    'The synthesizer fails unless it is calibrated on the exact building block the fuel is made of.',
    'Two fuel batches use the same ingredients in different recipes, and the wrong one stalls an engine.',
    'A dealer swears his powder is one pure substance, and the crew has to catch him if it is only blended.',
    'Four crates have landed on the dock, and the warehouse cannot shelve any of them until each is classified.'
  ],
  'q2-core': [
    'The Guild\'s ore scanner says atoms are solid, and a beam through this sample will show whether it is right.',
    'Every kind of atom is defined by one count in its middle, and the crew needs it to name this sample.',
    'Sample D arrived sealed, and the crew has to learn what is inside it without opening it.',
    'The power cell can only be charged if its electrons are placed where they actually sit.',
    'The generator only works with atoms that will trade electrons, and the tester has just two charges left.',
    'Two ore samples weigh the same, but only one is the metal the crew ordered.',
    'The battery needs a plasma at a precise charge, and the only way there is to take electrons off one at a time.',
    'Three salvaged samples have to be checked against the standard before any of them touches the reactor.'
  ],
  'q3-catalogue': [
    'Six cards were salvaged from the Guild\'s raid, and the crew has to put them back in a working order.',
    'The reference chart is missing its logic, and the crew needs the repeat that makes it a chart.',
    'The bottom row of the reference chart was torn off, and every loose card has to go back where it belongs.',
    'A fire on the dock started because someone grouped cards by the wrong rule, so the crew needs to know what a column really means.',
    'The reactor needs atoms that will never trade an electron, and the chart should show which ones they are.',
    'The supply officer has to sort the cards by how each atom will act, without testing every one.',
    'The Guild stole a card from the chart, and the crew has to work out what it was and how it behaves.',
    'Four unmarked cards are all that is left of the archive, and the crew has to file them with nothing but a count.'
  ],
  'q4-ledger': [
    'Every atom in the cargo log needs three numbers, and the clerk quit before filling them in.',
    'Sample B is sealed with only half its label left, and the crew needs the rest of its numbers.',
    'Three samples were tested for reaction speed, and the crew has to find the one that matches the standard.',
    'The needle on Sample B is off zero, and the crew has to find out what has gone wrong inside it.',
    'The plating tank needs atoms at a precise positive charge, and the crew has to build one.',
    'A water-purifier needs atoms with a full outer shell, and the crew has to give one what it lacks.',
    'A crystal will only grow when its charges cancel exactly, so the crew has to find the smallest mix that balances.',
    'Four sealed crates came off the Guild\'s ship, and the crew needs to know how each differs from the standard.'
  ],
  'q5-assay': [
    'A merchant swears his sample is pure, yet it drops into two different bins.',
    'Two crates claim to be the same material, and their makeup has to match before the trade goes through.',
    'The invoice lists a weight that no single piece on the sorter actually has.',
    'The quartermaster wants to know what one piece of this sample weighs in a typical crate.',
    'A buyer asks why this shipment\'s listed weight is a round number when the last two were not.',
    'The engine sensors for the fuel feed need to be tuned to the mix that is really inside a sealed sample.',
    'Three crates arrived unlabelled, and the weights alone have to tell the crew what each one is.',
    'The Guild sold three crates as natural stock, and the crew has to catch which ones are fake.'
  ],
  'q6-weigh': [
    'A crate too full to tip has to be counted without opening it.',
    'The fuel trader quotes a price per piece, so the crew needs to know what one of his pieces weighs.',
    'A pilot says three crates feel different even though each holds the same number of pieces, and the crew should find out why.',
    'The reactor needs exactly matching amounts of two ingredients, and the scale is the only tool the crew has.',
    'Life support needs a precise amount of water, and the only way to measure it is by weight.',
    'A drum of carbon came in marked in grams, and the quartermaster wants the stores log in moles.',
    'The crew needs hydrogen from water, and the stores log says how much water is on hand.',
    'A trader insists the heaviest drum is the best deal, but the crew pays for atoms and not for grams.'
  ],
  'boss-hopper': [
    'Plates are jamming the hopper\'s feeder, and each one has to be sorted before the sorter will pass it.',
    'The hopper\'s injector locks until it is told exactly what kind of atom is at its core.',
    'The cooling manifold is overheating, and only a gas that reacts with nothing will quench it.',
    'Static from an ore burst is clinging to the chute, and the sodium ions have to be neutralized.',
    'The last chamber needs an exact amount of carbon, and the only gauge on the hopper is its scale.'
  ],

  'q1-wave': [
    'A beacon dial turns from red to violet, and the crew has to learn what that does to the light itself.',
    'Relay Tower Beta needs a channel with its crests spread twice as far apart as Channel A\'s.',
    'A technician says blue signals cross the valley faster than red ones, and the crew has to settle it.',
    'An emergency beacon is broadcasting on a lamp the bench does not have, and the receiver has to be tuned to it.',
    'Four lamps have to be lined up from lowest to highest for the scanner to calibrate.',
    'Something invisible crossed the perimeter fence, and the crew has to find which detector caught it.',
    'The comms bay holds radio, radar and X-ray emitters, and each needs the right channel.',
    'The perimeter\'s sodium lamps have to be tuned to exactly the right frequency to cut through the fog.'
  ],
  'q2-photon': [
    'A bright red lamp is shining on the sensor plate and nothing comes off, and the crew has to find out why.',
    'Stray heat keeps tripping the sensor, so its cutoff has to be set exactly.',
    'The relay circuit needs more current, and the crew has to find what the lamp controls.',
    'Electrons have to cross a gap against a voltage, so the crew needs to know what sets their speed.',
    'The optical sensor\'s gain depends on the energy of a single packet of light from a green laser.',
    'The crew is rebuilding the sensor and needs the plate that gives up its electrons most easily.',
    'The hull sensor on the outside is made of zinc, and only the right lamp will wake it.',
    'A crewmate wants to power the zinc sensor with a giant red spotlight, and the crew has to explain why it cannot work.'
  ],
  'q3-lines': [
    'The crew has a hot wire and a glowing gas tube, and the spectroscope shows they give off light very differently.',
    'The salvage team found a sealed gas canister and has no idea what is in it.',
    'Light is passing through a cool gas, and something is taking pieces out of it.',
    'Hydrogen glows with a bright red line, and the crew needs to know what the atom is doing to make it.',
    'The blue-green line has to be turned into an energy for the instrument\'s calibration.',
    'The crew wants to predict a line the spectroscope has not yet shown.',
    'A strong ultraviolet pulse hit a hydrogen atom, and the crew has to know what happened to its electron.',
    'A student tried to use the hydrogen rules on helium and got nonsense, and the crew has to find out why.'
  ],
  'q4-cloud': [
    'A sensor ping finds an electron in one place, and the next ping finds it somewhere else.',
    'The containment coils need the actual shape of the lowest-energy electron\'s space.',
    'The guide ring must be tuned so the electron\'s wave closes on itself instead of cancelling.',
    'A second sample shows an empty ring between two layers of dots, and the crew has to learn what that gap means.',
    'Sample C shows two separate lobes, and the crew has to know what kind it is and where it is empty.',
    'The magnetic coils have to steer every direction this shape can point.',
    'Five complicated scans came in at once, and the crew has to sort them by shape.',
    'An operator asks why the screen shows a fuzzy cloud and never a path, and the crew needs a real answer.'
  ],
  'q5-numbers': [
    'The rack is addressed with numbers, and the first one has to be decoded before anything else can be loaded.',
    'The allocation routine needs every shape the second shell can offer.',
    'The storage count for a d row has to be right before any electrons go in.',
    'Two electrons have to be loaded into one box without the rack rejecting them.',
    'Two electrons in the atom carry the same address, and one pair is impossible.',
    'The buffer has to be sized for the third shell before it can be filled.',
    'The crew has to write the exact address of one of nitrogen\'s outer electrons.',
    'The diagnostics scrub has to flag every address that nature does not allow.'
  ],
  'q6-filling': [
    'A pure carbon lattice has to be built, and the rack needs all of carbon\'s electrons in place.',
    'The magnet will show how carbon\'s outer electrons sit, and the lattice needs to know.',
    'Life support needs oxygen\'s electron code written down exactly.',
    'The electrolyte needs potassium, and the rack is missing its last electron.',
    'The metallurgy ledger needs iron\'s long code in a short form.',
    'Six reactor elements have to be sorted by where their last electron went.',
    'Iron has been oxidized in the pipeline, and the crew has to find what it lost.',
    'Chromium pulls on the magnet harder than the rules predict, and the crew has to build the arrangement that matches.'
  ],
  'q7-pes': [
    'Two alloy drill samples look alike, and their spectra should show how they differ.',
    'The spectrometer\'s peaks must be calibrated to say how many electrons are there.',
    'The geology crew wants to know why lithium has one tall peak and one short one far away.',
    'Boron has two peaks in its second shell, and the crew has to explain why the electrons there are not equal.',
    'A sealed sample must be identified before anyone touches it.',
    'The sensor needs calibrating on the innermost electrons of neon and fluorine.',
    'Three light plates must be verified as sodium, magnesium or aluminum before they are used in construction.',
    'The alloy synthesizer will only start once the sealed sample\'s full electron code has been read off its spectrum.'
  ],
  'q8-trends': [
    'The turbine alloys depend on how hard the middle of an atom pulls on its electrons, and the crew wants to know what makes that pull stronger.',
    'Sodium corrodes quickly, and the pull its outer electron really feels is far weaker than it should be.',
    'A filter mesh needs large atoms, so the crew has to rank four neighbours by size.',
    'Potassium swells the crystals in the battery electrodes, and sodium does not.',
    'An ion-exchange membrane for water purification depends on how big each ion is.',
    'The sacrificial anodes wear at a rate that depends on what it costs to strip an electron off each metal.',
    'Magnesium takes one charge in the minerals and never another, and the crew wants to know why.',
    'The sealant resin needs two atoms that pull unevenly on a shared pair, and the crew has to find the strongest puller.'
  ],
  'q9-absorb': [
    'Contaminants in the reservoir can only be seen by the right kind of light, and the crew has to find which.',
    'Three sensor channels logged the water line, and each reading belongs to a different light.',
    'Copper runoff in the drainage trench is bright blue, and the crew wants to know why.',
    'The spectrophotometer has to be tuned to the best wavelength for measuring copper in the water.',
    'The crew has three calibration tubes of different strength and needs to know how the light dims.',
    'The lab ran out of standard cells and has only a longer one, so the crew has to know what that does to the reading.',
    'The water-testing spectrophotometer follows one exact rule, and the crew has to write it down.',
    'An unmarked sample from Reservoir Tank 4 has to be measured against the calibration the crew just built.'
  ],
  'boss-eater': [
    'The entity glows red, and the crew has to know which electron drop makes that light.',
    'Its barrier only breaks for a beam of the right frequency.',
    'It anchors a magnetic shield on carbon, and the crew has to find how many electrons feed it.',
    'A scan of its core shows an anchor atom, and the crew has to name it from the spectrum.',
    'The last pulse has to be tuned to exactly how much light the solution will absorb.'
  ],

  'q1-joins': [
    'The forge press has three pairs of metals and gases, and the crew has to see which ones stay together.',
    'One pair springs apart the moment it is released, and the crew has to find out why.',
    'Two pairs both held, but they hold in different ways, and the engineers need to know how.',
    'The foreman wants every pair filed by what happens to its electrons.',
    'A giver with two electrons to spare needs takers, and the crew has to know how many.',
    'Some pairs hold more tightly than others, and the crew has to see how many pairs of electrons sit between them.',
    'The Guild stole the test results, and the crew has to predict each pair from the catalogue alone.',
    'The recipe sheet for a new fuel is blank, and the crew has to find how many of one atom another can hold.'
  ],
  'q2-lattice': [
    'The yard has three blocks and one furnace, and the crew needs the block that holds on hardest.',
    'A block of salt breaks cleanly along a flat face, and a second block does not.',
    'A current has to pass through a block, and the crew has to know what makes that possible.',
    'A blow cracked Block A, and the crew has to find what actually gave way.',
    'The cutting blade is useless against one block, and the crew has to learn how it is built.',
    'The crew needs a block that comes apart into whole pieces they can lift out.',
    'Three sealed blocks came off the Guild\'s ship, and the crew has to identify each from tests alone.',
    'A vessel running at 900 degrees must never pass a current, and the crew has to pick its liner.'
  ],
  'q3-distance': [
    'The crew needs the exact spacing where two atoms sit most comfortably.',
    'A reactor operator asks how much energy it takes to part this pair entirely.',
    'The press squeezed these atoms together, and the crew has to see what happens to their energy.',
    'The chlorine pair settles further apart than the hydrogen pair, and the crew has to know why.',
    'Three carbon links are in the stores, and the crew has to line them up by length.',
    'The crew is checking whether the shorter links are also the stronger ones.',
    'Three salts line the storeroom, and the crew has to rank them by how firmly their ions are held.',
    'The furnace has to be set for the higher-melting of two salts.'
  ],
  'q4-dots': [
    'The water recycler stalls unless every atom has the electrons it needs.',
    'The coolant chemists need to know how many pairs each molecule leaves unused.',
    'Carbon dioxide leaks through the scrubber, and the crew has to draw its electrons correctly.',
    'HOF is unstable and the crew has to find which atom holds the others together.',
    'The ammonium ion carries a charge, so its drawing has to change.',
    'Boron trifluoride will not light every lamp, and the crew has to find out why.',
    'Nitric oxide has an odd number of electrons, so the usual drawing cannot work.',
    'Sulfur hexafluoride needs more room than most atoms allow.'
  ],
  'q5-resonance': [
    'A molecule on the bench has an atom that owns one electron too few.',
    'Two drawings of carbon dioxide exist, and the crew has to decide which is the better.',
    'The thiocyanate ion carries a charge, and the crew has to put the minus where it belongs.',
    'Ozone has two bonds, and the gauge says something odd about them.',
    'A nitrate ion has several ways to place its double bond, and the crew has to list all of them.',
    'The crew needs the real strength of each bond in nitrate.',
    'Carbonate has several drawings, and the crew has to weigh which count.',
    'Water has nothing to move, and the crew has to find out why.'
  ],
  'q6-shape': [
    'The arm rig is bolted to the hub, and the crew has to measure how far apart two arms settle.',
    'A hub with four arms is part of every fuel line, and its angle has to be right.',
    'Ammonia\'s three atoms do not lie flat, and the crew has to find what pushes them out.',
    'Water\'s hydrogen atoms sit at an odd angle, and the crew has to measure it.',
    'Carbon dioxide has a double bond, and the crew has to know how many arms it counts for.',
    'Sulfur tetrafluoride has a gap in its shape, and the crew has to find where the extra pair sits.',
    'Xenon tetrafluoride has two extra pairs, and the crew has to find how they arrange.',
    'Three molecules have different shapes, and the crew has to name them.'
  ],
  'q7-polarity': [
    'One end of this molecule is more negative than the other, and the crew has to find which.',
    'Three bonds share their electrons very differently, and the crew has to sort them.',
    'Carbon dioxide has two strong pulls, yet it does not turn between the plates.',
    'Water turns between the plates and carbon dioxide does not, and the crew has to find why.',
    'One of two nearly identical molecules turns between the plates.',
    'Ammonia and boron trifluoride look alike, but only one of them turns.',
    'Three molecules came off the Guild\'s ship, and each needs to be filed.',
    'A charged rod bends some liquid streams and not others, and the crew has to pick which.'
  ],
  'q8-hybrid': [
    'Carbon has two single electrons, yet it makes four bonds in methane.',
    'The orbitals have to be mixed until the lobes match methane\'s four arms.',
    'Each carbon in ethene has three arms, so the mix has to change.',
    'The carbon in HCN has only two arms, so its mix must change again.',
    'Ethene\'s second bond is built differently from the first.',
    'The crew has to count all the bonds in HCN.',
    'One of these two molecules turns freely at the bond and the other does not.',
    'Phosphorus pentachloride and sulfur hexafluoride need more orbitals than the usual four.'
  ],
  'q9-orbitals': [
    'When two atoms join, their boxes turn into new ones, and the crew has to see what happens.',
    'The two electrons of hydrogen have to sit at the lowest energy.',
    'Helium wants to bind, and the crew has to find out whether it can.',
    'Nitrogen is the strongest gas bond the crew has met, and its strength is in its count.',
    'Oxygen is pulled toward a magnet, and the crew has to find out why.',
    'Three forms of oxygen differ by charge, and the crew has to rank their bonds.',
    'Fluorine is weaker than oxygen, and the crew has to find out why.',
    'Boron has the boxes in a different order, and the crew has to find what that does.'
  ],
  'boss-warden': [
    'The warden\'s plating holds only as long as its ions stay locked, so the crew needs the plate that takes the most heat.',
    'Its vent runs on sulfur tetrafluoride, and every lamp has to be lit to open it.',
    'Its joints are set at one angle, and the crew has to find it from the molecule.',
    'Its coolant turns between charged plates only for some molecules.',
    'Its core is a gas that the magnet pulls toward it.'
  ],

  'q1-knocks': [
    'The cylinder gauge rises and falls, and the crew has to know what it is actually reading.',
    'A pilot wants to double the gas in a tank, and the crew has to know what that does to the pressure.',
    'Heating the tank changes the gas, and the crew has to see how.',
    'The particles in the cylinder do not all move at the same speed, and the crew needs to see how they differ.',
    'Helium and carbon dioxide share a tank, and the crew has to see how they compare.',
    'The reference gauge reads in three scales, and the crew has to convert a reading from one to another.',
    'The pressure should reach zero at some point, and the crew has to find where.',
    'The crew has to pick what the bench has really shown about gases.'
  ],
  'q2-laws': [
    'A cylinder is squeezed to a quarter of its room, and the crew has to predict the gauge.',
    'The same particles are given half the room, and the crew has to know why the pressure doubles.',
    'A free piston rides on a heated gas, and the crew has to predict how far it moves.',
    'The volume line meets zero on one scale and not on the other, and the crew has to find why.',
    'A sealed tank is heated, and the safety valve is set for a specific rise.',
    'Gas is being added under a weight, and the crew has to predict the volume.',
    'Pressure and temperature both change, and the crew has to find the new volume.',
    'Four gauge records came in without labels, and the crew has to find what each held fixed.'
  ],
  'q3-ideal': [
    'The first thing a gas engineer asks is how much room one mole of gas takes up.',
    'A log has four readings at four states, and one number is hidden in all of them.',
    'The crew has a sealed tank and needs to know how much gas is in it.',
    'The gauge reads in atmospheres, and the constant has to match.',
    'The sealed tank can be named from its weight and its readings.',
    'Three gases share one room, and the crew has to line them up by density.',
    'A limestone pellet gives off gas in the furnace, and the crew has to find the volume.',
    'The crew has to explain why light and heavy gases take up the same room.'
  ],
  'q4-mixtures': [
    'Two tanks are poured into one, and the crew has to predict the new gauge reading.',
    'One gas in a mixture is compared with the same gas on its own.',
    'The fraction of particles that are helium has to be known to blend the gas.',
    'The oxygen\'s share of the push is needed for the life-support schedule.',
    'The crew is climbing a mountain, and the air gets thinner.',
    'Argon is added to a tank, and the crew has to see what it does to the oxygen already there.',
    'Three gases share a tank, and the counters rank them wrongly.',
    'A trap pulls carbon dioxide out of a sealed tank, and the drop in the gauge shows how much was there.'
  ],
  'q5-speed': [
    'The speed screen shows the whole crowd, and the crew has to see what heat does to it.',
    'Three gases share a temperature, and the crew has to line them up by speed.',
    'The fast tail of the crowd drives reactions, and the crew has to see how much it grows with heat.',
    'A pinhole leaks one chamber before another, and the crew has to find which.',
    'The leak rates of hydrogen and oxygen have to be compared.',
    'An unmarked chamber is leaking, and the crew has to name its gas by its rate.',
    'A smell takes seconds to cross a room, yet the particles are very fast.',
    'Two gases race down two tubes, and the crew has to call the winner.'
  ],
  'q6-real': [
    'Squeezed hard, a real gas stops obeying the rule, and the crew has to see how.',
    'The particles have a size, and the crew has to find what that does to the push.',
    'Cooled toward a liquid, the gas strays the other way.',
    'The pull between particles matters more in the cold.',
    'Three gases stray from the rule by different amounts, and the crew has to rank them.',
    'Some cylinders hold gas that behaves, and the crew has to find which.',
    'The two corrections compete, and the crew has to find which wins.',
    'Compressor stores need to know why a gas can be made a liquid.'
  ],
  'boss-compressor': [
    'The intake is jammed, and the crew has to push the gauge to four times its first reading.',
    'The heater is running, and the piston has to land at the right volume.',
    'The tank is sealed, and the crew has to find how much oxygen it holds.',
    'The blend is filling the chamber, and the helium\'s share of the push has to be known.',
    'A seal is leaking, and the crew has to name the gas by how fast it escapes.'
  ],

  'q1-recipe': [
    'Three samples came from three places, and the crew has to find the recipe every molecule is built to.',
    'One of two samples is not the compound the label says.',
    'Two compounds share the same two ingredients in different amounts.',
    'The crew needs what one whole molecule weighs.',
    'A buyer asks how much of a sample\'s weight is one ingredient.',
    'A sealed drum has a weight ratio, and the crew has to find the recipe it must hold.',
    'Three samples need to be filed under the recipe each matches.',
    'The Guild sold three samples as the same compound, and the crew has to catch the fakes.'
  ],
  'boss-golem': [
    'The golem feeds on its supply of one ingredient, and the crew has to find when it runs out.',
    'The golem\'s steam vents have to be balanced against the mass that goes in.'
  ]
};

/** The one line that says why the crew needs this stage, or '' when none is written. */
export function storyFor(questId, stageIndex) {
  const id = String(questId || '').replace(/^.*\//, '');
  return STAGE_STORY[id]?.[stageIndex] || '';
}
