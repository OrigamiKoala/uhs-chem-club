/**
 * stage-story.js — why this stage matters to the world's mission, in one sentence.
 *
 * Every world has one job (Tallow: take apart the raiders' salt guards and
 * save the refinery; Lanternfall: relight the beacon towers; Ligar: clear the
 * rescue pass; Bellows: let the pressure out of the fuel station; Kettle: halt
 * the robot foundry). The prompt says what to find at the bench; this line
 * says what that finding does for the job. It names the mission, never the
 * route, never the answer, and it invents no fact about the world that the
 * chemistry does not support. It obeys the same withheld-vocabulary gate as
 * a prompt (`verify:learn`).
 *
 * Indexed by quest id, then by stage index (0-based).
 */
export const STAGE_STORY = {
  /* ---- Tallow: take the salt guards apart and save the refinery ---- */
  'q1-grain': [
    'Raiders scattered grey powder across the refinery yard during the attack.',
    'Two powder jars look identical, but only one holds the pure element the repairs need.',
    'An unsorted ore shipment must be counted out before the smelter accepts it.',
    'Salt husks shrug off the cutter, so Vess tests what the blade can and cannot split.',
    'The refinery runs on water, and Vess needs the exact recipe for one molecule of it.',
    'Two clear liquids share the same atoms, yet only one is safe for the coolant lines.',
    'Shaking settles the argument over which powders are pure and which are mixed.',
    'The sorted crates go back on the shelves, and the yard ledger finally balances.'
  ],
  'q2-core': [
    'A strange atom from the wreckage hides something tiny and heavy at its center.',
    'Vess counts the crossed particles in the middle to learn what the center holds.',
    'A sealed canister from the raiders refuses to open, but its charge gives it away.',
    'The electrons around the center sit in shells, and Vess maps where each one sits.',
    'The outer shell decides how an atom trades, which explains the scorch marks on the raider wreckage.',
    'Two samples weigh the same, yet only one matches the refinery standard.',
    'Vess strips electrons off a sample to charge the cell that will crack a salt husk.',
    'Three mystery canisters wait at the bench, each different from the standard in one way.'
  ],
  'q3-catalogue': [
    'Vess spreads the element cards across the table to lay them in proton order.',
    'The proton order repeats every eight cards, and the pattern demands an explanation.',
    'The old chart takes shape as the third row slides into place.',
    'Reading down a column shows atoms that behave like siblings.',
    'One column refuses every trade, and Vess wants to know why nothing touches it.',
    'The left side gives electrons away while the right side takes them.',
    'An empty slot in the chart describes an element nobody has measured.',
    'Four unmarked cards find their homes, and the whole chart stands complete.'
  ],
  'q4-ledger': [
    'Vess opens the ledger on a single carbon atom and counts its three numbers.',
    'A sealed chlorine canister from the raid must be read without opening it.',
    'Heavy chlorine reacts just like light chlorine, and the smelter can use either.',
    'One sample pulls the needle off zero, and the missing electron must be found.',
    'The husks run on stolen charge, so Vess drives a sample positive to study it.',
    'Filling a shell past neutral builds the negative ion the coolant recipe needs.',
    'Positive and negative must cancel in whole numbers to mix a neutral salt.',
    'Four sealed samples face the ledger, and each differs from oxygen in one way.'
  ],
  'q5-assay': [
    'A chlorine shipment splits across two bins, and the mix needs an explanation.',
    'Two scoops of different sizes split the same way, so the ratio belongs to chlorine itself.',
    'The listed mass 35.5 sits off-center, leaning toward the common isotope.',
    'Vess weighs a boron sample to work out its average atom from scratch.',
    'A fluorine sample lands in a single bin, leaving the average with nowhere to lean.',
    'A sealed neon tank gives up its isotope ratio without ever being opened.',
    'Three unmarked drums wait to be named by weight alone.',
    'Three sellers claim natural chlorine, but only one tells the truth.'
  ],
  'q6-weigh': [
    'One crate is too full to tip, so its atoms must be counted another way.',
    'Estimating the stolen cargo starts with what one molecule of it weighs.',
    'Equal counts of different elements meet on the pan for the first time.',
    'Vess needs the weight of oxygen that holds the same count as 12.0 grams of carbon.',
    'Shipments sell by weight, so one mole of molecules gets a price in grams.',
    'A sealed drum waits on the dock with its papers lost.',
    'Two moles of water hide hydrogen worth counting.',
    'Three drums wait for the furnace, and only one holds the most atoms.'
  ],
  'boss-hopper': [
    'The Hopper braces its plated hull across the refinery gate.',
    'Vess tunes the probe to the carbon heart beating inside the machine.',
    'Overheating coils demand a gas that refuses to react with anything.',
    'Stolen charge crackles across the chassis until Vess grounds it out.',
    'The Hopper collapses into cold slag with something foreign shining in the chute.'
  ],

  /* ---- Lanternfall: relight the beacon towers ---- */
  'q1-wave': [
    'Vess lights a spare lamp on the bench for testing.',
    'The Fifth Guild dimmed the beacons, so every spare lamp must be measured.',
    'Vess clocks all light at one fixed speed.',
    'The crew finds one missing lamp by arithmetic alone.',
    'The beacons are sorted from red to violet.',
    'The moths feed past the edges of sight.',
    'Vess stretches one scale from radio masts to X-ray tubes.',
    'The lamp tags resolve into names of true elements.'
  ],
  'q2-photon': [
    'A sodium plate refuses red light at full brightness.',
    'Vess hunts the exact frequency where the plate wakes.',
    'The moths crowd the violet lamp and shun the red one.',
    'Vess pushes the frequency higher and watches the speed meter.',
    'A single worked plate unlocks the energy of every photon.',
    'Three metals wake in turn, loosest first.',
    'The zinc beacon answers only invisible light.',
    'Bright red can never wake zinc, and Vess logs why for the crew.'
  ],
  'q3-lines': [
    'Vess sets a hot wire beside a glowing gas tube.',
    'A sealed tube hides its gas behind bright lines.',
    'Cool gas drinks the same colours the hot gas spills.',
    'The red beacon line traces to one rung pair.',
    'Vess weighs the blue line against a worked red one.',
    'The ladder calls out a line nobody has tapped.',
    'The ladder runs out above the top rung.',
    'Helium breaks the ladder built for hydrogen.'
  ],
  'q4-cloud': [
    'Vess fires one shot and marks where the electron lands.',
    'Five hundred shots bloom into a round cloud.',
    'Only whole waves survive the ring.',
    'The second cloud grows larger and hollower.',
    'A new cloud splits into two lobes.',
    'Vess turns four samples to map every pointing direction.',
    'Five clouds sort by shape alone.',
    'The bench refuses to draw any path.'
  ],
  'q5-numbers': [
    'Vess reads the first number printed on every box.',
    'The second shell opens its rows for inspection.',
    'A d row waits with its boxes uncounted.',
    'Vess crowds a second arrow into a filled box.',
    'Two electrons claim the same four numbers.',
    'The third shell fills to its limit.',
    'One nitrogen electron gives up its four numbers.',
    'Vess strikes every address that names no box.'
  ],
  'q6-filling': [
    'Vess lays six electrons into carbon from the bottom.',
    'The magnet weighs each seating of the p electrons.',
    'Oxygen reads out row by row.',
    'Potassium skips a shell for a lower rung.',
    'Iron folds its closed core into one symbol.',
    'Six elements file by their last electron.',
    'Vess lifts two electrons off the iron rack.',
    'Chromium defies the ladder and the magnet proves it.'
  ],
  'q7-pes': [
    'Hydrogen and helium print their first spectra.',
    'Vess stacks every peak height against its electron count.',
    'Lithium hides one electron far from the nucleus.',
    'Boron splits its second shell in two.',
    'A sealed specimen waits to be named.',
    'Neon grips harder than fluorine with the same shell.',
    'Three neighbours line up by outer peak.',
    'The sealed spectrum spells its own arrangement.'
  ],
  'q8-trends': [
    'Vess taps electrons near and far to feel the pull.',
    'Sodium hides its core behind inner electrons.',
    'Four atoms stand side by side for sizing.',
    'Potassium towers over sodium.',
    'Three ions queue from smallest up.',
    'Three stripping costs refuse to climb in order.',
    'Vess strips magnesium until the cost leaps.',
    'Four atoms tug one shared pair.'
  ],
  'q9-absorb': [
    'Three lights stir one molecule three ways.',
    'Three readings wait for their lights.',
    'The copper tank glows blue against white light.',
    'Vess sweeps the dial for the strongest dimming.',
    'Three brews of rising strength face the beam.',
    'Vess stretches the light path through one brew.',
    'One rule binds dimming, path and strength.',
    'The sealed tank gives up its strength.'
  ],
  'boss-eater': [
    'The red moth light traces to one rung pair.',
    'Vess picks the beam that bites the green plate.',
    'The magnet weighs the lonely electrons in carbon.',
    'Ten protons betray the anchor element.',
    'The quenching math exposes the ultraviolet lens.'
  ],

  /* ---- Ligar: break the boulders and clear the rescue pass ---- */
  'q1-joins': [
    'The Fifth blast scattered rubble across the rescue tunnel mouth.',
    'Vess wants to know why some wall held while other wall fell.',
    'The miners need to hear how the two joins differ before they swing hammers.',
    'The wardens wear both joins as armor over the buried tunnel.',
    'The salt in the slide follows a fixed recipe the drillers must learn.',
    'The quarry master grades warden stone by the pairs its atoms share.',
    'The next wall must be predicted before the miners touch it.',
    'The trapped miners ration air while the tunnel gas keeps its recipe.'
  ],
  'q2-lattice': [
    'The rescue tunnel needs the toughest boulder marked before the breakers start.',
    'Some blocks split along a flat face while others crumble apart.',
    'The miners will wire the tunnel through rock that never carries a current.',
    'The vent crust and the salt block answer the hammer differently.',
    'One boulder turns the blade aside, and the miners ask what makes it different.',
    'The crushers sort rubble by which blocks hide whole molecules inside.',
    'Three sealed blocks from the slide wait beside the rescue path.',
    'The trapped miners need a liner that holds at 900 degrees without shocking anyone.'
  ],
  'q3-distance': [
    'The breakers mark where each bond sits before the charges are set.',
    'Vess sizes the charge that will part one pair of atoms.',
    'The slide squeezed atoms closer than their easiest distance.',
    'Two pairs bottom out in different places along the crank.',
    'The cutters follow the longest carbon seam through the quarry wall.',
    'The miners ask which seam will fight the drill the hardest.',
    'The pass walls rank by how hard their ions grip.',
    'Vess chooses the wall the tunnel avoids by which salt melts higher.'
  ],
  'q4-dots': [
    'The rescue rock gives up its first true drawing in the hands of Vess.',
    'The miners map lone pairs to find where each molecule can break.',
    'The breakers wait on the carbon drawing before they swing.',
    'The keystone atom of the tunnel gas decides where the cutters split.',
    'The tunnel air carries a charged dust the drawings must name.',
    'A pale seam keeps the miners guessing until boron is drawn.',
    'The blast released an odd-electron gas the slate must still draw.',
    'A heavy gas pools at the tunnel floor where the miners kneel.'
  ],
  'q5-resonance': [
    'One weak atom hides in the warden plating.',
    'The cutters trust only the better drawing of the tunnel gas.',
    'Vess must put the minus on the right atom of the tunnel gas.',
    'The measured rock disagrees with the drawing in the hands of the miners.',
    'The warden stone shows every face its double bond can wear.',
    'The drill follows the seam the bond orders grade.',
    'The tunnel wall weighs each equal drawing the same.',
    'The map closes on water, the last molecule on the slate.'
  ],
  'q6-shape': [
    'The breakers meet their first shape at the tunnel mouth.',
    'The most common rock shape waits to be measured.',
    'A pyramid of atoms blocks the side tunnel.',
    'The wet rock bends above the rescue path.',
    'The straight strut in the arch counts its domains for the cutters.',
    'The warden joint hides one lone pair the miners must place.',
    'Two lone pairs wait on the breakthrough plate.',
    'The last three seams file under the shapes their atoms make.'
  ],
  'q7-polarity': [
    'The rescue gear drags on the more negative end of the tunnel gas.',
    'The Fifth left bonds the miners must rank by how unevenly they share.',
    'The straight tunnel air faces the charged plates tonight.',
    'Vess separates the wet seam from the dry one by how their pulls add.',
    'Two drums of tunnel liquid face the charged plates tonight.',
    'The pyramid and the flat sheet face the plates side by side.',
    'The vents filter dust by which molecules the field sorts.',
    'The wash water waits while the charged rod tests each stream.'
  ],
  'q8-hybrid': [
    'The tunnel map stalls on what the carbon orbitals allow.',
    'The roof rock waits for its lobes to match its four arms.',
    'The cut edge waits for three lobes on each carbon of ethene.',
    'The tunnel gas waits for two lobes on its carbon.',
    'The rigid seam and the free one are built differently.',
    'The tunnel gas map finishes with a count of sigma and pi.',
    'Two joints face the twist, and the miners watch which one gives.',
    'The deep wardens brace on the largest hubs in the quarry.'
  ],
  'q9-orbitals': [
    'The last map of the bond opens with two boxes becoming two.',
    'The first bond waits for its two electrons to be seated.',
    'Four electrons wait on the rack while the miners judge whether the seam holds.',
    'The strongest seam in the pass gets its bond order tonight.',
    'The air the miners breathe faces the magnet tonight.',
    'The breathing air ranks three oxygen species by length.',
    'The pale gas and the tunnel air compare their upper boxes.',
    'Vess reads the last warden plate in the final rack.'
  ],
  'boss-warden': [
    'The warden stands plated in three salts over the buried tunnel.',
    'Vess seals the vent the warden breathes through.',
    'The warden joints lock square over the rescue path.',
    'The warden cools itself one molecule at a time.',
    'The warden core hides in the one gas the magnet loves, behind the glass-smooth cut.'
  ],

  /* ---- Bellows: let the pressure out of the fuel station ---- */
  'q1-knocks': [
    'Vess asks what the swelling tanks gauge is really counting.',
    'The Fifth jammed extra gas into the tanks, and the needles climbed.',
    'The vents are running hot, so the particles themselves need watching.',
    'A speed screen flickers beside the hot tank, waiting to be read.',
    'Two tanks breathe different gases at one shared warmth.',
    'The station gauges speak three scales for one push.',
    'The cold pipes point toward a temperature where pushing stops.',
    'The logbook gathers every bench reading into one picture of a gas.'
  ],
  'q2-laws': [
    'The valves will only open for a crew that knows the squeeze law.',
    'Vess asks why less room means a harder push.',
    'A free piston rides the heat above the deck.',
    'The Fifth forged its thermometers in a shifting scale.',
    'A sealed tank bakes in the sun with nowhere to swell.',
    'Fresh gas feeds in under the floating weights.',
    'Pressure and heat strike one cylinder together.',
    'The paper records of the station wait to be filed by what each held still.'
  ],
  'q3-ideal': [
    'Vess meters one mole to learn the room it claims.',
    'The station log hides one number inside four readings.',
    'A sealed tank swells with no label to trust.',
    'The gauges argue in atmospheres while the plate speaks kilopascals.',
    'A hiss sounds behind an unmarked hatch.',
    'Three cylinders float side by side in the same air.',
    'A limestone pellet drops and breathes out gas.',
    'The Fifth wonders why every gas claims the same room.'
  ],
  'q4-mixtures': [
    'Two tanks share one room behind the jammed vents.',
    'Vess asks whether gases notice each other at all.',
    'The ledger needs the share of helium of the whole.',
    'The slice of oxygen of the push must be measured.',
    'Thin air waits above the clouds for its reading.',
    'The Fifth slips quiet argon into the blend.',
    'Three gases press in one tank, and only one ranking holds.',
    'A trap snaps shut on one gas inside a sealed tank.'
  ],
  'q5-speed': [
    'The vents run hotter while the speed screen watches.',
    'Three chambers breathe three gases side by side.',
    'Vess marks one speed bar high on the glass.',
    'A pinhole sighs in the wall of two chambers.',
    'Hydrogen and oxygen race through matched holes.',
    'The unknown ticks beside a known chamber.',
    'A smell wanders the hallways far too slowly.',
    'Two tubes carry two gases down still air.'
  ],
  'q6-real': [
    'The tanks are packed past where the old law holds.',
    'Vess eyes the crowded window as the piston sinks.',
    'Cold creeps toward the misting point of the coolant.',
    'The cold tank reading drifts while its particles slow.',
    'Three gases stand in the cold for comparison.',
    'The crew may use the old law once on this deck.',
    'Two corrections tug the needle opposite ways.',
    'The Fifth wants its vapor to rain into tanks.'
  ],
  'boss-compressor': [
    'The Compressor strains against its own intake.',
    'Its heater breathes at a heat the dials skip.',
    'A sealed tank keeps its count from every eye.',
    'The blending drum hums with two gases at once.',
    'A pinhole seal sings where no label hangs.'
  ],

  /* ---- Kettle: halt the robot assembly lines ---- */
  'q1-recipe': [
    'Vess holds three scoops from three foundry floors.',
    'Loose feed glints where no molecule would take it.',
    'Two bins share two ingredients in different builds.',
    'The scales wait for one molecule to give its true weight.',
    'A buyer haggles over the heavy share in a hundred.',
    'A sealed drum rattles with an unknown blend.',
    'Three haulers idle with their papers lost.',
    'Three claims in the ledger cannot all be true.'
  ],
  'boss-golem': [
    'The twin hoppers of the golem run toward empty together.',
    'Its boiler seals for one weighed charge.'
  ]
};

/** The one line that says what this stage does for the mission, or '' when none is written. */
export function storyFor(questId, stageIndex) {
  const id = String(questId || '').replace(/^.*\//, '');
  return STAGE_STORY[id]?.[stageIndex] || '';
}
