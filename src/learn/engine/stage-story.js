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
    'To take the salt guards apart, the crew first has to learn how far a solid sample can be broken down.',
    'The refinery cannot tell guard material from clean stock, so the crew has to find which of these two is made of one kind of atom.',
    'A guard is made of mixed material, so the crew has to learn how many kinds go into a single sample.',
    'The guards shrug off most tools, so the crew has to find what the cutter cannot split.',
    'To understand how guard material is put together, the crew has to copy its smallest repeating piece exactly.',
    'Two guard parts use the same ingredients and still behave differently, so the crew has to see what sets them apart.',
    'The raiders blended their material into pure stock, so the crew has to shake each sample to catch the blend.',
    'Nothing on the dock can be shelved or burned until it is sorted, so the crew has to file all four samples.'
  ],
  'q2-core': [
    'The guards stand up to every cutter, so the crew fires a beam through a sample to see what an atom is made of inside.',
    'Every guard part is a particular kind of atom, so the crew has to learn what in the middle of an atom fixes its kind.',
    'A sealed canister was pulled from a guard, and the crew has to learn what is in it without breaking it open.',
    'How a guard part behaves depends on where its electrons sit, so the crew has to place them.',
    'To switch a guard part off, the crew has to know whether it gives up electrons, takes them on, or refuses to trade.',
    'Two salvaged scraps weigh the same, so the crew has to find which one is the same kind of atom as the reference.',
    'The crew can only match a guard part\'s charge by stripping electrons, so they have to bring a sample to exactly plus two.',
    'Three scraps came out of the wreckage, and the crew has to check each against the standard before trusting it.'
  ],
  'q3-catalogue': [
    'The raiders scrambled the refinery\'s reference cards, so the crew has to put them back in order before they can identify any guard material.',
    'The chart only works if its pattern is clear, so the crew has to find where the pattern starts over.',
    'The raiders tore off the bottom of the chart, so the crew has to put the loose cards back where they belong.',
    'A column on the chart tells the crew what its atoms have in common, so they have to read one properly.',
    'Some guard material will not react with anything, so the crew has to find which cards behave that way.',
    'There is no time to test every guard part, so the crew has to sort cards by how they will act from where they sit.',
    'The raiders took a card out of the chart, so the crew has to work out what it was and how it behaves.',
    'Four unmarked samples came out of the wreckage, so the crew has to file each by its proton count to finish the chart.'
  ],
  'q4-ledger': [
    'To read the raiders\' scrap, the crew has to learn the three numbers that describe any atom.',
    'A sealed sample came out of a guard, so the crew has to read its label to work out what is inside.',
    'Guard parts that react the same way can be shut down the same way, so the crew has to find which samples match.',
    'The needle on one sample is off zero, so the crew has to work out what that says about its particles.',
    'To match a guard part\'s charge, the crew has to drive a sample to plus two and count the electrons that took.',
    'Some atoms behave differently once their outer shell is full, so the crew has to fill one completely.',
    'Charged pieces only hold together when their charges cancel, so the crew has to find the fewest of each that do.',
    'Four sealed samples came off the dock, so the crew has to say how each differs from the standard before it goes near the refinery.'
  ],
  'q5-assay': [
    'The listed mass of the raiders\' metal does not match what the scale shows, so the crew has to explain why it splits across two bins.',
    'To trace the metal, the crew has to find how many pieces in every hundred are the lighter kind.',
    'The label lists a mass between the two bins, so the crew has to find where that figure sits.',
    'The crew needs one trusted weight for a piece of the metal, so they have to work out the average.',
    'A second sample lists a whole number where the last did not, so the crew has to find out why.',
    'A sealed sample could be the raiders\' cargo, so the crew has to work out its mix of weights without opening it.',
    'The crew has three samples and a list of masses, so they have to name each sample from its weight.',
    'The raiders say these samples are natural material, so the crew has to find which claims are false.'
  ],
  'q6-weigh': [
    'Sample B is too full to tip out and count, so the crew has to find how many atoms it holds some other way.',
    'To estimate how much cargo the raiders took, the crew has to find what one molecule of Sample B weighs.',
    'The crew cannot count atoms one by one, so they have to see what equal counts have in common when weighed.',
    'To measure out matching amounts of two materials, the crew has to find the weight of the second that holds the same count as 12.0 grams of the first.',
    'Shipments are sold by weight, so the crew has to find how many grams of Sample A make one mole.',
    'A drum was left on the dock, so the crew has to find how many moles it holds.',
    'The crew has to know how much of one element is locked in two moles of Sample A.',
    'Three drums are waiting for the furnace, so the crew has to find which one holds the most atoms.'
  ],
  'boss-hopper': [
    'The Hopper is shielded by plated armour, so the crew has to file each plate into its class to break the outer layer.',
    'The Hopper\'s core is a single kind of atom, so the crew has to enter its proton count to lock the probe.',
    'The Hopper is running hot, so the crew has to name the unreactive gas that can cool it.',
    'The Hopper is holding a charged sodium atom, so the crew has to find how many electrons would neutralise it.',
    'The Hopper has dumped carbon down the chute, so the crew has to find the mass of two moles to clear the refinery.'
  ],

  /* ---- Lanternfall: relight the beacon towers ---- */
  'q1-wave': [
    'To relight the beacons, the crew first has to learn what changes in light from red to violet.',
    'Each tower is tuned to a wavelength, so the crew has to find the setting that is twice another.',
    'The towers send light across the ice, so the crew has to find how fast light from these lamps travels.',
    'A tower fitted with a lamp that is not on the bench still has to be tuned, so the crew has to work out its frequency.',
    'The beacons switch on in order, so the crew has to line up four lamps from lowest frequency to highest.',
    'The drones give off light the eye cannot see, so the crew has to find which detector picks it up.',
    'Every tower carries a different source, so the crew has to match each one to its frequency.',
    'The sodium lamp is the first beacon to relight, so the crew has to find its frequency.'
  ],
  'q2-photon': [
    'The drones drain the beacons by freeing electrons from their plates, so the crew has to learn how to free them.',
    'A plate only wakes above a certain frequency, so the crew has to find where it starts.',
    'The crew can run a lamp harder, so they have to see what brighter light does to a plate.',
    'The crew can change the light itself, so they have to see what a higher frequency does.',
    'To size the power a beacon needs, the crew has to find the energy of one photon of 500 nm light.',
    'Three plates are being drained, so the crew has to rank them by how tightly they hold their electrons.',
    'The zinc plate in the next beacon is dark, so the crew has to pick the lamp that wakes it.',
    'A brighter red beam would be easiest to fit, so the crew has to find why it will never wake zinc.'
  ],
  'q3-lines': [
    'A beacon is identified by the light it gives off, so the crew has to learn how a filament differs from a gas tube.',
    'A sealed tube was found at a dead tower, so the crew has to name the gas inside from its light.',
    'The drones block the beacons, so the crew has to see what cool gas does to light passing through it.',
    'The red line is the first beacon\'s signal, so the crew has to find which jump on the ladder makes it.',
    'A tower is tuned to a 486 nm line, so the crew has to find how much energy that line carries.',
    'The next beacon\'s line has not been seen yet, so the crew has to predict it from the ladder formula.',
    'The drones overcharge the plates, so the crew has to find what happens to an electron given more than the ladder holds.',
    'The ladder worked for hydrogen, so the crew has to find out why it fails for helium.'
  ],
  'q4-cloud': [
    'To relight a beacon, the crew has to know where its electron is, so they start with a single shot.',
    'One shot is only a dot, so the crew has to build up five hundred and describe what forms.',
    'Beacon rings only form at certain wavelengths, so the crew has to pick the waves that fit.',
    'The next beacon is larger, so the crew has to compare its cloud with the first.',
    'One beacon\'s cloud has two lobes, so the crew has to describe where it has dots and where it has none.',
    'The two-lobed cloud can be mounted more than one way, so the crew has to count the ways it can point.',
    'The crew has five clouds from five beacons, so they have to sort them by shape.',
    'The drones want a flight path to follow, so the crew has to learn why the bench never draws one.'
  ],
  'q5-numbers': [
    'Each beacon needs an exact address for its electron, so the crew starts with the first number on every box.',
    'The second number picks the shape, so the crew has to find which shapes the second shell offers.',
    'The third number picks the direction, so the crew has to find how many boxes a d row has.',
    'A box can hold two electrons, so the crew has to put two in one.',
    'The drones are sending impossible addresses, so the crew has to find which two electrons cannot share an atom.',
    'The rack has a fixed size, so the crew has to find how many electrons the third shell holds.',
    'The next beacon needs a full address, so the crew has to pick the four numbers for one of nitrogen\'s 2p electrons.',
    'The drones are sending fake addresses, so the crew has to spot every set of numbers that cannot name an electron.'
  ],
  'q6-filling': [
    'Relighting a beacon means knowing how an atom\'s electrons fill in, so the crew starts with carbon\'s six.',
    'A beacon\'s signal depends on how electrons sit in their boxes, so the crew has to see how carbon\'s two p electrons sit.',
    'The next beacon is built on oxygen, so the crew has to find what the rack reads for it.',
    'Potassium is the next beacon\'s metal, so the crew has to place its nineteenth electron.',
    'The tower log lists iron in long form, so the crew has to write its arrangement in short form.',
    'Beacons are sorted by where the last electron went, so the crew has to file six elements by that row.',
    'The beacon runs on iron that has lost two electrons, so the crew has to take them off the rack.',
    'The last beacon\'s rack disagrees with the rule, so the crew has to place chromium\'s electrons to match the sample.'
  ],
  'q7-pes': [
    'The drones swapped a sample on the tower, so the crew has to compare two spectra to tell them apart.',
    'A spectrum is a count, so the crew has to find what the height of a peak counts.',
    'Lithium gives a short peak far to the left, so the crew has to find why.',
    'Boron\'s second shell splits into two peaks, so the crew has to find why.',
    'A sealed specimen is plugged into the tower, so the crew has to name it from its spectrum alone.',
    'Neon and fluorine sit side by side, so the crew has to find why neon\'s innermost peak is further along.',
    'Three neighbours were swapped on the tower, so the crew has to match each spectrum to sodium, magnesium or aluminum.',
    'The last sealed specimen holds the tower\'s power source, so the crew has to write its configuration from its spectrum.'
  ],
  'q8-trends': [
    'The beacons depend on how hard an atom holds its electrons, so the crew has to find what makes the pull stronger.',
    'Sodium\'s outer electron should feel a huge pull but barely does, so the crew has to find why it feels about +1.',
    'The drones scrambled a row of atoms, so the crew has to order lithium to carbon by size.',
    'The next beacon is a bigger atom, so the crew has to find why potassium is bigger than sodium.',
    'The drones have charged a sample, so the crew has to order Na⁺, Na and Cl⁻ by size.',
    'Stripping an electron costs energy, so the crew has to order three atoms by that cost.',
    'The next beacon is magnesium, so the crew has to find which charge it takes as an ion.',
    'The last beacon\'s wiring has to hold, so the crew has to order four atoms by how hard they pull on shared electrons.'
  ],
  'q9-absorb': [
    'The drones have fouled the beacon glass, so the crew has to find what each kind of light does to a molecule.',
    'The glass returned three readings, so the crew has to match each one to the light that caused it.',
    'The coolant looks blue, so the crew has to find why copper solutions look that colour.',
    'A reading is only as good as the light used, so the crew has to pick the best wavelength.',
    'The drones thicken the solution, so the crew has to see what doubling the concentration does.',
    'The crew can also lengthen the path through the glass, so they have to see what doubling it does.',
    'The crew needs one rule tying absorbance, path and concentration together, so they have to write it down.',
    'The last sealed sample holds the drones\' fouling, so the crew has to find its concentration.'
  ],
  'boss-eater': [
    'The Lantern-Eater is swallowing the beacons\' red light, so the crew has to find the electron drop that makes the 656 nm line.',
    'The Lantern-Eater hides behind a barrier, so the crew has to pick the beam that frees electrons from a plate with a green threshold.',
    'The Lantern-Eater feeds on magnetism, so the crew has to find how many unpaired electrons a carbon atom holds.',
    'The Lantern-Eater has anchored itself to a core, so the crew has to name the element behind a peak that shows ten protons.',
    'The Lantern-Eater clouds the glass to hide, so the crew has to calculate the absorbance of its solution.'
  ],

  /* ---- Ligar: break the boulders and clear the rescue pass ---- */
  'q1-joins': [
    'To free the trapped miners, the crew has to break boulders, so they start by seeing which pairs of atoms hold together.',
    'The rockslide held in some places and not others, so the crew has to find why Pair B will not hold.',
    'Rock holds together in more than one way, so the crew has to see how the two joins differ.',
    'The crew has to know what happens to the electrons in a join before they can predict how stone will break.',
    'A giver with two to give needs takers, so the crew has to find how many it takes.',
    'Some joins are stronger than others, so the crew has to count the pairs of electrons held between two atoms.',
    'There is no time to press every pair, so the crew has to predict each join from the catalogue alone.',
    'A recipe tells the crew what a mineral is, so they have to find how many atoms one can hold.'
  ],
  'q2-lattice': [
    'To clear the pass, the crew has to know which boulders will give, so they heat three blocks to see which is held together hardest.',
    'Some blocks split along a flat face and some do not, so the crew has to find why Block A comes apart that way.',
    'The crew has to know which rock carries a current before they use it near the rescue wiring.',
    'A blow shows what a block is made of, so the crew has to find what actually gives way in Block A.',
    'One boulder will not cut, so the crew has to find what is different about how Block A is built.',
    'Some blocks hold separate molecules, so the crew has to pick the one a single molecule can be lifted out of.',
    'Three sealed blocks came out of the slide, so the crew has to file each by how it is built.',
    'The rescue vessel runs at 900 degrees and must never pass a current, so the crew has to pick the block that will do it.'
  ],
  'q3-distance': [
    'Boulders break when their bonds are pulled apart, so the crew has to find where two atoms hold the least energy.',
    'To break a bond the crew has to supply energy, so they have to find how much it takes to pull one pair apart.',
    'The slide squeezed atoms together, so the crew has to see what pushing them closer does.',
    'Bonds differ in size, so the crew has to find why chlorine bottoms out further out than hydrogen.',
    'The rock contains several carbon bonds, so the crew has to put three in order by length.',
    'The crew needs to know which bonds are hardest to break, so they have to see how length goes with energy.',
    'Salt crystals hold the pass together, so the crew has to rank three salts by how strongly their ions are held.',
    'Charges and size decide which salt is hardest to melt, so the crew has to pick the one that melts higher.'
  ],
  'q4-dots': [
    'To predict how minerals break, the crew has to draw molecules, starting with all of water\'s electrons.',
    'Lone pairs shape a molecule, so the crew has to file three molecules by how many sit on their heaviest atom.',
    'Carbon dioxide needs two more pairs, so the crew has to place all of its electrons.',
    'The middle atom decides how a molecule is built, so the crew has to find which atom sits in the middle of HOF.',
    'A charged ion needs a different count, so the crew has to draw the ammonium ion.',
    'Some atoms do not fill their shell, so the crew has to find why boron stays amber.',
    'Some molecules have an odd number of electrons, so the crew has to draw NO.',
    'Some atoms hold more than eight, so the crew has to draw SF₆.'
  ],
  'q5-resonance': [
    'Charge tells the crew where a molecule is weak, so they start by finding the atom that owns one electron too few.',
    'Some drawings are better than others, so the crew has to pick the better one for carbon dioxide.',
    'The minus has to go on the right atom, so the crew has to pick the better drawing of SCN⁻.',
    'Measured bonds do not always match the drawing, so the crew has to compare the two bonds in ozone.',
    'One drawing is not enough for nitrate, so the crew has to file every place its double bond can sit.',
    'Nitrate bonds are neither single nor double, so the crew has to give each bond\'s order.',
    'Carbonate has several equal drawings, so the crew has to find which counts most.',
    'Not every molecule has more than one drawing, so the crew has to find why water has none.'
  ],
  'q6-shape': [
    'Shape decides how a rock breaks, so the crew starts with the angle between two arms on the hub.',
    'The crew has to predict four-armed shapes, so they have to find the angle between any two arms.',
    'Lone pairs take room too, so the crew has to find how the atoms of NH₃ are arranged.',
    'Water is also bent, so the crew has to find the angle between its two hydrogen atoms.',
    'A double bond pushes like a single one, so the crew has to count the domains on carbon in CO₂.',
    'The crew has to know where a lone pair settles, so they have to place it on the SF₄ hub.',
    'The crew has to know where two lone pairs settle, so they have to place them on the XeF₄ hub.',
    'The crew has to name the shape the atoms make, so they have to name it in three molecules.'
  ],
  'q7-polarity': [
    'Polarity decides what a mineral sticks to, so the crew has to find which end of H–Cl is more negative.',
    'Bonds share unevenly, so the crew has to file three bonds from even to handed over.',
    'Two pulls can cancel, so the crew has to find whether carbon dioxide turns between the plates.',
    'Shape decides whether pulls cancel, so the crew has to find why water turns and CO₂ does not.',
    'One atom changes everything, so the crew has to find which of CCl₄ and CHCl₃ turns.',
    'Flat and pyramid shapes behave differently, so the crew has to find which of NH₃ and BF₃ turns.',
    'There are many molecules in the slide, so the crew has to file three as polar or nonpolar.',
    'Wet rock moves with the field, so the crew has to pick every liquid a charged rod will bend.'
  ],
  'q8-hybrid': [
    'To understand why bonds point where they do, the crew has to see what carbon\'s orbitals would allow and what methane actually has.',
    'Methane has four arms, so the crew has to blend carbon\'s orbitals until the lobes match.',
    'Ethene has three arms on each carbon, so the crew has to blend until the lobes match.',
    'HCN has two arms on its carbon, so the crew has to blend until the lobes match.',
    'Double bonds are not two of the same, so the crew has to find how ethene\'s second bond is built.',
    'The crew has to count what holds a molecule together, so they have to count the sigma and pi bonds in HCN.',
    'Some bonds turn and some do not, so the crew has to find which of two molecules turns freely.',
    'Some hubs need more than four, so the crew has to find how many orbitals PCl₅ and SF₆ need.'
  ],
  'q9-orbitals': [
    'The strongest bonds decide what the crew can break, so they start by seeing what two 1s boxes become when atoms join.',
    'Electrons fill the lowest box first, so the crew has to place the two of H₂ where they have the least energy.',
    'Not every molecule holds, so the crew has to place He₂\'s electrons and say whether it does.',
    'Bond order measures strength, so the crew has to find it for N₂.',
    'Oxygen is the odd one out, so the crew has to find whether O₂ is pulled toward the magnet.',
    'The crew has to rank three oxygen species, so they have to put them in order of length.',
    'F₂ is a weaker bond than O₂, so the crew has to find why.',
    'B₂ fills in the other order, so the crew has to fill it and say why it is magnetic.'
  ],
  'boss-warden': [
    'The Basalt Warden is plated in three salts, so the crew has to pick the one whose ions need the most heat to move.',
    'The Warden\'s vent is drawn as SF₄, so the crew has to use every electron in the tray so every lamp is lit.',
    'The Warden\'s joints are drawn as XeF₄, so the crew has to find the angle between neighbouring fluorine atoms.',
    'The Warden\'s coolant has to be turned from the plates, so the crew has to pick every molecule that turns.',
    'The Warden\'s core is a gas, so the crew has to pick the one the magnet pulls.'
  ],

  /* ---- Bellows: let the pressure out of the fuel station ---- */
  'q1-knocks': [
    'The fuel tanks are over-inflating, so the crew first has to learn what the gauge is measuring.',
    'More gas in a tank means more pressure, so the crew has to see what doubling the gas does.',
    'The saboteurs are heating the vents, so the crew has to see what heat does to the particles.',
    'The particles in a tank are not all the same speed, so the crew has to compare their speeds.',
    'Different gases fill the tanks, so the crew has to compare helium and carbon dioxide at one temperature.',
    'The station uses more than one gauge scale, so the crew has to read Cylinder A on the middle ring.',
    'The cold end of the scale matters, so the crew has to find the temperature at which the pressure would fall to zero.',
    'The crew has to be sure of what the bench has shown, so they have to pick every statement it supports.'
  ],
  'q2-laws': [
    'To release the pressure safely, the crew has to know the gas laws, starting with a quarter of the room.',
    'The crew has to explain the law and not just use it, so they have to say why half the room doubles the pressure.',
    'A tank under a weight can change size, so the crew has to find what tripling the kelvin temperature does to the volume.',
    'Temperature scales matter, so the crew has to find why the volume line meets zero at 0 K but not at 0 °C.',
    'The saboteurs are heating a sealed tank, so the crew has to find how much its pressure rises from 300 K to 450 K.',
    'More gas under a weight means more room, so the crew has to see what doubling the amount does.',
    'The station changes pressure and temperature together, so the crew has to find the volume of Cylinder A at half its pressure and 450 K.',
    'Four gauge records came off the station, so the crew has to file each by the quantity held fixed.'
  ],
  'q3-ideal': [
    'To judge how much gas is in a tank, the crew first has to know the volume of one mole at 0 °C and one atmosphere.',
    'The station\'s log has four readings at four states, so the crew has to find the one number they share.',
    'A sealed tank is over-inflating, so the crew has to find how many moles it holds.',
    'The gauge reads in atmospheres, so the crew has to find which value of R goes with it.',
    'An unmarked tank is leaking, so the crew has to name its gas from the readings.',
    'Three gases are in the same conditions, so the crew has to put them in order of density.',
    'A limestone pellet is giving off gas into the tank, so the crew has to find the volume at 25 °C and one atmosphere.',
    'The crew has to explain why the ideal gas law works, so they have to say why every gas fills the same volume.'
  ],
  'q4-mixtures': [
    'The station\'s tanks hold mixtures, so the crew starts by comparing a tank after a pour with the readings before it.',
    'A gas in a mixture pushes alone, so the crew has to compare it with the same gas alone in an identical tank.',
    'The crew has to know the mix, so they have to give the fraction of the particles that are helium.',
    'The crew has to know the push of one gas, so they have to give oxygen\'s partial pressure in kilopascals.',
    'The station\'s crew work high up where the air is thin, so the crew has to give oxygen\'s partial pressure at 5500 m.',
    'The saboteurs add argon, so the crew has to find what it does to the oxygen already in the tank.',
    'The knock counters can mislead, so the crew has to put three gases in order of partial pressure.',
    'A trap has pulled one gas out of a sealed tank, so the crew has to find the moles of carbon dioxide.'
  ],
  'q5-speed': [
    'The saboteurs are heating the vents, so the crew has to see what heat does to the speed screen.',
    'Gases leak at different rates, so the crew has to put three in order of particle speed.',
    'Only the fast particles matter in a collision, so the crew has to see how many more clear the bar at 227 °C than at 27 °C.',
    'A pinhole is leaking one tank, so the crew has to find which gas runs out first and why.',
    'Hydrogen and oxygen leak at different rates, so the crew has to give how many times faster hydrogen leaks.',
    'An unmarked chamber is leaking, so the crew has to name its gas.',
    'A smell crosses a room slowly, so the crew has to find why when particles move at hundreds of metres a second.',
    'Two tubes are leaking different gases, so the crew has to find which reaches the far end first.'
  ],
  'q6-real': [
    'The tanks are packed so tight that the ideal gas law may fail, so the crew has to see what PV over nRT does as helium is squeezed.',
    'Real particles take up room, so the crew has to find what their size does to the pressure.',
    'The coolant is nearing its liquid point, so the crew has to see what PV over nRT does as carbon dioxide cools.',
    'Particles pull on each other, so the crew has to find what that pull does to a cold gas.',
    'Three gases are in the station, so the crew has to put them in order of how far they stray from ideal.',
    'The crew has to know where the gas laws are safe, so they have to pick the cylinder that behaves most ideally.',
    'There are two corrections, so the crew has to find which does more when the gas is cold and only a little squeezed.',
    'The crew has to know why the coolant can liquefy, so they have to say why a real gas can condense and an ideal gas never could.'
  ],
  'boss-compressor': [
    'The Compressor is overpressuring the intake, so the crew has to bring the gauge to four times its first reading.',
    'The Compressor\'s heater is running at 750 K, so the crew has to give the volume the helium fills.',
    'The Compressor\'s sealed tank is filling with oxygen, so the crew has to give its mass in grams.',
    'The Compressor is feeding a blend, so the crew has to give the partial pressure of helium in kilopascals.',
    'The Compressor has an unmarked seal leaking, so the crew has to name the escaping gas.'
  ],

  /* ---- Kettle: halt the robot assembly lines ---- */
  'q1-recipe': [
    'To halt the foundry, the crew has to know the recipe each molecule follows, starting with three samples from three places.',
    'The raiders swapped some feedstock, so the crew has to find which of two samples is not a compound.',
    'Two compounds share the same ingredients, so the crew has to find how much of each goes into the two recipes.',
    'The crew has to size up the feed, so they have to find what one whole molecule weighs.',
    'A buyer asks for the share of one ingredient, so the crew has to work out how much of the weight is CAT 08.',
    'A sealed drum came off the vent line, so the crew has to pick the recipe a 3 to 8 weight ratio must hold.',
    'Three samples are waiting at the line, so the crew has to file each under the recipe it matches.',
    'The raiders sold three samples as the same compound, so the crew has to catch the fakes.'
  ],
  'boss-golem': [
    'The Recipe Golem feeds on one ingredient, so the crew has to find how many units of iron sulfide it can make before it starves.',
    'The Recipe Golem\'s steam vents have to balance the mass going in, so the crew has to find the mass of water vapour from four grams of hydrogen and thirty-two grams of oxygen.'
  ]
};

/** The one line that says what this stage does for the mission, or '' when none is written. */
export function storyFor(questId, stageIndex) {
  const id = String(questId || '').replace(/^.*\//, '');
  return STAGE_STORY[id]?.[stageIndex] || '';
}
