/**
 * quest-story.js — the one story animation a quest ends on, and only that one. It is Vess's debrief.
 *
 * PURE DATA. Each entry carries:
 *   - scene: a 2D canvas scene painter in ui/story-scenes.js
 *   - role: 'Direct Clue' | 'Station Fix' | 'Toolkit' | 'Boss Payoff'
 *   - mystery (omitted on Toolkit quests): the question the quest answers, put to the player by Vess on a card when the
 *     quest opens and kept as the lead line on its stage 1 card. It sets the scene (what was found, what is wrong) and ends
 *     on a question; it never gives the answer.
 *   - beats: 3 to 5 short lines reviewing what the bench showed (to rises from 0 to < 1)
 *   - pin (omitted on Toolkit quests): the answer to `mystery`, a short Case Pin stamped to the Case Board. The debrief
 *     shows the mystery again above it, so it reads as the answer to a question the player was given at the start.
 *
 * Rules, held by `verify:story`:
 *   - at most ONE animation per quest, keyed `<world>/<quest>`;
 *   - 3 to 5 beats, each at most 2 sentences and 36 words, no emoji, no "!";
 *   - non-Toolkit quests carry a `mystery` (at most 2 sentences and 25 words, ending on "?") and a concise `pin`
 *     (at most 16 words, no "Filed:" prefix); neither carries an emoji or "!";
 *   - Toolkit quests omit both;
 *   - beats and pin use only words the quest itself has earned, and none introduced by a later bench of the world; the
 *     mystery is read before the bench, so it uses none of the quest's own new terms either.
 */

export const QUEST_STORY = {
  /* ---- Cinder Halo: what is the Fifth doing to the nucleus, and how is it powered? ---- */
  'unit14/q1-still-warm': {
    scene: 'ch-warm',
    role: 'Direct Clue',
    mystery: 'The Fifth\'s ore drums are warm in freezing air, and no fire is anywhere near them. What keeps them warm?',
    beats: [
      { to: 0.32, say: 'Ore A counted far above the empty counter and ore B did not: only ore A is radioactive.' },
      { to: 0.65, say: 'One of its uranium nuclei threw out two protons and two neutrons, and 90 protons left it thorium.' },
      { to: 0.96, say: 'Cold or hot, the ore counted the same. Heat and cold never reach the nucleus.' }
    ],
    pin: 'Their ore is radioactive: its nuclei decay, and each decay releases heat.'
  },
  'unit14/q2-what-comes-off': {
    scene: 'ch-rays',
    role: 'Direct Clue',
    mystery: 'The counter clicks fast beside the closed drums. What is coming out through the walls, and what would stop it?',
    beats: [
      { to: 0.32, say: 'The plates sorted three radiations: alpha bent a little toward negative, beta sharply toward positive, gamma straight on.' },
      { to: 0.65, say: 'Alpha stopped in paper and beta in aluminium. Gamma, with no charge, went on into the lead.' },
      { to: 0.96, say: 'Inside the body alpha spends itself in a few cells, so it does its harm there.' }
    ],
    pin: 'The drums leak gamma rays, which only lead stops: the reason Thornmere\'s armor hid lead plates.'
  },
  'unit14/q3-equations': {
    scene: 'ch-equations',
    role: 'Direct Clue',
    mystery: 'The reactor slag holds metals nobody fed the reactor, like thorium and lead. Where did they come from?',
    beats: [
      { to: 0.32, say: 'Uranium-238 threw out two protons and two neutrons: 238 is 234 plus 4, and 92 is 90 plus 2.' },
      { to: 0.65, say: 'In beta decay a neutron became a proton, so thorium became protactinium and the mass number stayed 234.' },
      { to: 0.96, say: 'Eight alpha steps and six beta steps walked uranium-238 all the way down to lead-206.' }
    ],
    pin: 'The uranium decayed into them, step by step, through alpha and beta decay.'
  },
  'unit14/q4-stability': {
    scene: 'ch-stability',
    role: 'Direct Clue',
    mystery: 'The Fifth\'s store holds many different nuclei. Which of them stay as they are, and which keep decaying?',
    beats: [
      { to: 0.32, say: 'Up to calcium the stable squares sit on the line: about as many neutrons as protons.' },
      { to: 0.65, say: 'Heavier, the band bends above it: lead-208 holds 126 neutrons with its 82 protons, because neutrons hold without repelling.' },
      { to: 0.96, say: 'Carbon-14, above the band, decays by beta decay onto nitrogen-14, a filled square.' }
    ],
    pin: 'Nuclei with the wrong neutron count keep decaying, and the Fifth\'s store is full of them.'
  },
  'unit14/q5-half-gone': {
    scene: 'ch-halflife',
    role: 'Direct Clue',
    mystery: 'The Fifth\'s crater camp left no records. Can the decay in its samples tell us how long they have worked here?',
    beats: [
      { to: 0.32, say: 'In 8 days half of the 256 iodine nuclei decayed, leaving 128.' },
      { to: 0.65, say: 'In the next 8 days half of those 128 decayed, leaving 64, or one quarter of the original amount.' },
      { to: 0.96, say: 'A fossil bone counted 1.9 compared to 15.3 in living tissue, which equals three half-lives, or about 17,190 years.' }
    ],
    pin: 'Counting half-lives in their samples shows the Fifth Guild has worked here for decades.'
  },
  'unit14/q6-shortfall': {
    scene: 'ch-shortfall',
    role: 'Direct Clue',
    mystery: 'The Fifth\'s reactor puts out huge amounts of energy, yet no fuel line runs into it. Where does the energy come from?',
    beats: [
      { to: 0.32, say: 'Helium-4 weighed 0.030376 u less than its four separate parts, a difference equal to 28.3 MeV of binding energy.' },
      { to: 0.65, say: 'When uranium-235 split after absorbing a neutron, the pieces weighed 0.186 u less, releasing that lost mass as energy.' },
      { to: 0.96, say: 'Each fission frees three neutrons. Absorbing two kept the chain reaction steady, while absorbing none tripled it every step.' }
    ],
    pin: 'Splitting uranium loses a tiny bit of mass, which turns into huge energy.'
  },
  'unit14/boss-core': {
    scene: 'ch-core',
    role: 'Boss Payoff',
    mystery: 'The Fifth claims it can turn one element into another. What is really happening inside the Cinder Halo core?',
    beats: [
      { to: 0.3, say: 'The frozen sample counted far above background, and the storage cask leaked both beta and gamma radiation.' },
      { to: 0.62, say: 'The sodium coolant had turned into magnesium, and the cobalt source dropped to one eighth after three half-lives.' },
      { to: 0.96, say: 'Each fission released 173 MeV. Lowering the control rods slowed the chain reaction until the reactor core cooled down.' }
    ],
    pin: 'It is nuclear fission, not alchemy. The Fifth Guild\'s reactor is now stable.'
  },
  /* ---- Thornmere: what is the Fifth's armour made of, and where can it be cut? ---- */
  'unit13/q1-chains': {
    scene: 'thorn-chains',
    role: 'Direct Clue',
    mystery: 'Black tar is dragged from the swamp to the Fifth\'s plant every night. What is the tar made of?',
    beats: [
      { to: 0.32, say: 'Two carbons held six hydrogens: each carbon used one of its four bonds on the other and three on hydrogens.' },
      { to: 0.66, say: 'Adding a third carbon replaced one hydrogen and brought three of its own, so the chain gained two hydrogens.' },
      { to: 0.96, say: 'When hexane\'s two ends joined into a ring, each end gave up a hydrogen, leaving twelve hydrogens.' }
    ],
    pin: 'The swamp tar is alkanes: simple chains of carbon and hydrogen atoms.'
  },
  'unit13/q2-unsat': {
    scene: 'thorn-unsat',
    role: 'Direct Clue',
    mystery: 'The Fifth heats the swamp tar before using it. What does the heater turn it into?',
    beats: [
      { to: 0.32, say: 'Bromine broke the double bond and attached to both carbons, turning the orange bromine water clear.' },
      { to: 0.66, say: 'With H-Br, the double bond\'s electrons grabbed the hydrogen atom, and bromine left carrying the extra electron pair.' },
      { to: 0.96, say: 'That bromide ion then bonded to the other carbon, completing an addition reaction with nothing left over.' }
    ],
    pin: 'The heater turns the tar into double-bonded molecules that can link together.'
  },
  'unit13/q3-isomers': {
    scene: 'thorn-isomers',
    role: 'Direct Clue',
    mystery: 'Two drums carry the same formula, but only one of them builds armor. How can they differ?',
    beats: [
      { to: 0.32, say: 'Butane and 2-methylpropane have the same atoms connected in a different order, making two distinct molecules with one formula.' },
      { to: 0.66, say: 'A double bond cannot rotate, so placing two chlorines on the same side or opposite sides makes two different molecules.' },
      { to: 0.96, say: 'No rotation could match CHFClBr to its mirror image. Four different groups around one carbon make it chiral.' }
    ],
    pin: 'The two drums hold the same atoms in different shapes, so only one works.'
  },
  'unit13/q4-groups': {
    scene: 'thorn-groups',
    role: 'Direct Clue',
    mystery: 'One drum\'s clear liquid is eating through its steel, and the drum beside it is fine. What is in the bad drum?',
    beats: [
      { to: 0.32, say: 'Ethanol\'s -OH groups pull strongly on neighboring molecules, so it boils much higher than methoxymethane despite having the same formula.' },
      { to: 0.66, say: 'Ethanoic acid gave a proton to water, and the negative charge it left behind spread evenly across two oxygens.' },
      { to: 0.96, say: 'Methylamine\'s nitrogen pulled a proton away from water, showing that an amine acts as a base.' }
    ],
    pin: 'The corrosive liquid is a carboxylic acid, while the safe drum holds an alcohol.'
  },
  'unit13/q5-reactions': {
    scene: 'thorn-reactions',
    role: 'Direct Clue',
    mystery: 'The Fifth joins that acid and an alcohol into links for its armor. How is each link made, and what could undo it?',
    beats: [
      { to: 0.32, say: 'Hydroxide attacked the electron-poor carbon next to bromine, pushing bromine off in a one-for-one swap.' },
      { to: 0.66, say: 'Ethanol\'s oxygen bonded to the acid\'s C=O carbon and released a water molecule, joining them into an ester.' },
      { to: 0.96, say: 'Hydroxide attacked that same carbon and split the ester back apart. Adding water reverses the link.' }
    ],
    pin: 'Each armor link forms by releasing water, so water can break the link apart.'
  },
  'unit13/q6-polymers': {
    scene: 'thorn-polymers',
    role: 'Station Fix',
    mystery: 'The outpost\'s plastic armor shrugs off an axe and a torch. Where is its weak point?',
    beats: [
      { to: 0.32, say: 'Each monomer opened its double bond to link with the next, building a long chain of single bonds with no leftover pieces.' },
      { to: 0.66, say: 'Two-ended monomers joined by releasing one water molecule at each link, so four monomers released three waters.' },
      { to: 0.96, say: 'Glycine molecules joined the same way through nitrogen and C=O carbons, forming the amide links found in proteins.' }
    ],
    pin: 'The armor breaks at its chemical links, and hydroxide cuts right through them.'
  },
  'unit13/boss-carapace': {
    scene: 'thorn-carapace',
    role: 'Boss Payoff',
    mystery: 'Thornmere\'s armor is far heavier than plastic should be. What is underneath it?',
    beats: [
      { to: 0.32, say: 'The wax was C₃₀H₆₂, and the seam that turned bromine water clear held the double bond.' },
      { to: 0.66, say: 'The filler\'s second carbon held four different groups, and the link\'s C=O carbon was the electron-poor target.' },
      { to: 0.96, say: 'Hydroxide attacked that carbon and broke every amide link, peeling the plastic armor right off the outpost.' }
    ],
    pin: 'Thick lead plates sit under the plastic to block nuclear radiation.'
  },
  /* ---- Quicklight: why are the storm-belt cracking towers spiking? ---- */
  'unit12/q1-dblock': {
    scene: 'lode-dblock',
    role: 'Toolkit',
    beats: [
      { to: 0.34, say: 'Iron took two electrons into 4s, then six into 3d: five alone, then one pair.' },
      { to: 0.7, say: 'With a charge on the atom, 3d dropped below 4s, so the two 4s electrons were the ones to leave Fe²⁺.' },
      { to: 0.97, say: 'One more 3d electron gone left Fe³⁺ with five, the ion in the sealed drum.' }
    ]
  },
  'unit12/q2-charges': {
    scene: 'lode-charges',
    role: 'Direct Clue',
    mystery: 'Two drums of the same metal are marked with different charges, plus two and plus three. Can one metal carry both?',
    beats: [
      { to: 0.32, say: 'Calcium gave up two electrons cheaply; the third came from the inner shell and cost four times as much.' },
      { to: 0.64, say: 'Manganese climbed in even steps through seven electrons, so it can carry any charge from +2 to +7.' },
      { to: 0.95, say: 'Fe²⁺ lost its third electron for 2,957 kJ/mol, less than Mn²⁺\'s 3,248, because that electron shared an orbital.' }
    ],
    pin: 'Yes. Transition metals can hold several different charges, so the labels can all be right.'
  },
  'unit12/q3-complex': {
    scene: 'lode-complex',
    role: 'Direct Clue',
    mystery: 'Ammonia spilled into a drum, and the pale blue inside turned deep blue. What did the ammonia do?',
    beats: [
      { to: 0.3, say: 'Ammonia replaced four water molecules around each copper ion, turning the pale blue solution deep blue.' },
      { to: 0.62, say: 'Copper kept its nine 3d electrons, while each nitrogen donated a lone pair to form a new bond.' },
      { to: 0.95, say: 'Six water molecules fit around Fe³⁺, only four chloride ions fit around Cu²⁺, and the drum\'s +1 charge meant two chloride ions on Cr³⁺.' }
    ],
    pin: 'Ammonia bound around the copper ions, creating a deep blue complex.'
  },
  'unit12/q4-shapes': {
    scene: 'lode-shapes',
    role: 'Direct Clue',
    mystery: 'Two drums share one formula but act differently. How can one formula be two different things?',
    beats: [
      { to: 0.3, say: 'Six ammonia ligands spread 90° apart around the metal: four in a flat square, one above, and one below.' },
      { to: 0.62, say: 'Around Pt²⁺, two NH₃ and two Cl⁻ formed two distinct shapes that no rotation could line up.' },
      { to: 0.95, say: 'With the two chlorines side by side the complex is cis; across from each other it is trans.' }
    ],
    pin: 'The groups around the metal sit in two different 3D arrangements.'
  },
  'unit12/q5-colour': {
    scene: 'lode-colour',
    role: 'Direct Clue',
    mystery: 'The drum labels burned off, but each drum holds a different colour. Can the colour tell us what is inside?',
    beats: [
      { to: 0.3, say: 'The blue copper solution absorbed orange and red from white light, letting only blue pass through.' },
      { to: 0.62, say: 'Six ligands raised the energy of two d orbitals, so the complex absorbed only light matching that energy gap.' },
      { to: 0.95, say: 'Swapping water for ammonia widened the gap to 199 kJ/mol, shifting the absorbed light from red to orange.' }
    ],
    pin: 'Yes. Each drum\'s color reveals which ligands are bound around its metal.'
  },
  'unit12/q6-spin': {
    scene: 'lode-spin',
    role: 'Direct Clue',
    mystery: 'The canyon magnet lifts some metal drums and leaves the rest on the line. Why does it grab only some?',
    beats: [
      { to: 0.32, say: 'Water left iron(II) with four unpaired electrons, pulling it to the magnet; cyanide paired all six, leaving no pull.' },
      { to: 0.65, say: 'When the energy gap exceeds the cost of pairing, all six d electrons pair in the lower three orbitals as low spin.' },
      { to: 0.95, say: 'More unpaired electrons mean a stronger magnetic pull, and both color and magnetism come from the same orbital gap.' }
    ],
    pin: 'The magnet lifts only drums whose metal has unpaired d electrons.'
  },
  'unit12/boss-coil': {
    scene: 'lode-coil',
    role: 'Boss Payoff',
    mystery: 'The sorting magnet decides where every metal drum goes. Where is it sending them?',
    beats: [
      { to: 0.35, say: 'We unlocked the first coil by tracking Mn²⁺ losing its 4s electrons and reading vanadium\'s +5 jump.' },
      { to: 0.70, say: 'We checked [Co(NH₃)₅Cl]²⁺ at +2 and matched [Co(NH₃)₆]³⁺\'s absorbed blue light to its orange color.' },
      { to: 0.95, say: 'High-spin [Fe(H₂O)₆]³⁺ pulled harder than low-spin [Fe(CN)₆]³⁻, shutting down the Coil and revealing the route to Cinder Halo.' }
    ],
    pin: 'Its shipping chip routes every Fifth Guild metal drum straight to Cinder Halo.'
  },
  'unit11/q1-watch': {
    scene: 'rate-watch',
    role: 'Direct Clue',
    mystery: 'Two lines burn the same fuel, yet one tower finished much sooner and overheated. What was different?',
    beats: [
      { to: 0.35, say: 'Both vessels ended at 0.40 mol/L of product, yet Vessel 2 climbed steeper and finished sooner.' },
      { to: 0.70, say: 'Every run starts steepest and slows as reactant runs low. For 2 A → B, A drops twice as fast as B rises.' },
      { to: 0.95, say: 'More A, higher temperature, and powdered solid speed up a reaction; a larger vessel slows it down.' }
    ],
    pin: 'The tower flared because the same fuel burned faster, releasing its heat all at once.'
  },
  'unit11/q2-law': {
    scene: 'rate-law',
    role: 'Direct Clue',
    mystery: 'Three feeds (A, B, and C) pour into the overheating tank. Which of them change how fast it burns?',
    beats: [
      { to: 0.35, say: 'Doubling A doubled the initial rate, doubling B made it four times as fast, and doubling C changed nothing.' },
      { to: 0.70, say: 'Those measured powers give rate = k[A][B]², showing that equation numbers do not have to match the rate law.' },
      { to: 0.95, say: 'With k = 2.0 from runs 1 and 2, the rate law predicted 0.036 mol/(L·s) for run 3.' }
    ],
    pin: 'Only feeds A and B change the rate; feed C makes no difference.'
  },
  'unit11/q3-time': {
    scene: 'rate-time',
    role: 'Direct Clue',
    mystery: 'The fuel in the tank breaks down over time. Does it take the same time to lose each half of what is left?',
    beats: [
      { to: 0.35, say: 'In the first-order tank, losing the first half took 20 s and losing the next half also took 20 s.' },
      { to: 0.70, say: 'Equal halving times match a straight ln[A] plot. A straight [A] plot is zero order, and a straight 1/[A] plot is second order.' },
      { to: 0.95, say: 'Only first-order reactions have a constant half-life. In second-order reactions, each halving takes longer.' }
    ],
    pin: 'Yes. It loses half in equal times (first order), so the half-life stays constant.'
  },
  'unit11/q4-collide': {
    scene: 'rate-collide',
    role: 'Direct Clue',
    mystery: 'Why does cold fuel sit safely while hot fuel burns?',
    beats: [
      { to: 0.35, say: 'Particles react only when they collide with at least the activation energy and with their reactive ends lined up.' },
      { to: 0.70, say: 'Warming leaves the activation energy hill in the same place, while moving a larger share of particles past it.' },
      { to: 0.95, say: 'The transition state sits at the top of the hill, and a lower hill always forms product faster.' }
    ],
    pin: 'Cold fuel sits safely because few collisions clear the energy hill; warming lifts more over.'
  },
  'unit11/q5-steps': {
    scene: 'rate-steps',
    role: 'Direct Clue',
    mystery: 'The fuel burns in several steps, one after another. Which step decides how fast the whole burn goes?',
    beats: [
      { to: 0.35, say: 'Elementary steps add up to the overall equation, and intermediates like NO₃ cancel out between steps.' },
      { to: 0.70, say: 'The slowest step sets the overall speed, and its colliding particles give the measured rate law.' },
      { to: 0.95, say: 'On a two-step energy profile, the tallest climb marks the slowest step and the valley holds the intermediate.' }
    ],
    pin: 'The slowest step sets the pace of the whole burn.'
  },
  'unit11/q6-shortcut': {
    scene: 'rate-shortcut',
    role: 'Direct Clue',
    mystery: 'Yellow dust in the vents makes the fuel burn faster. What is it doing?',
    beats: [
      { to: 0.35, say: 'A catalyst speeds up a reaction by opening a new path with a lower activation energy hill.' },
      { to: 0.70, say: 'All six catalyst particles remained at the end, and the start and end energy levels did not change.' },
      { to: 0.95, say: 'A catalyst enters one step and comes back in the next. Solid catalysts work on their exposed surface.' }
    ],
    pin: 'The yellow dust is a catalyst: it lowers the energy hill and comes back unchanged.'
  },
  'unit11/boss-flare': {
    scene: 'rate-flare',
    role: 'Boss Payoff',
    mystery: 'Someone tampered with Quicklight\'s fuel to make the tower run away. What drove the flare, and who is behind it?',
    beats: [
      { to: 0.35, say: 'The tower surged at 0.030 mol/(L·s), and the feed manifold followed rate = k[A]²[B].' },
      { to: 0.70, say: 'Four 12 s half-lives left 0.0625 of the fuel core behind an 80 kJ/mol ignition hill.' },
      { to: 0.95, say: 'Fast 2 X ⇌ X₂ followed by slow X₂ + Y → Z matched rate = k[X]²[Y] and shut the flare down.' }
    ],
    pin: 'The yellow dust was a catalyst, which is also the callsign of the Fifth Guild\'s leader.'
  },
  /* ---- Brinewire: the Fifth cut the marsh's power; what do its cells actually do? ---- */
  'unit10/q5-load': {
    scene: 'load-down',
    role: 'Station Fix',
    mystery: 'The marsh\'s backup batteries lose voltage the longer they run. Why do they fade?',
    beats: [
      { to: 0.26, say: 'Under load, the tin and lead cell dropped from 0.012 V to 0 V as tin ions built up and lead ions ran low.' },
      { to: 0.5, say: 'It stopped with 72 tin ions and 28 lead ions still left. A dead battery has reached balance, even before running empty.' },
      { to: 0.74, say: 'Tin ions divided by lead ions was 2.6, matching K = 2.5. As Q rises toward K, cell voltage drops to 0 V.' },
      { to: 0.94, say: 'Zinc at 1.0 M with copper at 0.0010 M has Q = 1000 and reads 1.01 V. Copper at 0.010 M against 1.0 M has Q = 0.01 and reads 0.059 V.' }
    ],
    pin: 'As they run, their ion concentrations shift toward balance, and the voltage falls.'
  },
  'unit10/q6-electrolysis': {
    scene: 'electrolysis-push',
    role: 'Direct Clue',
    mystery: 'The Fifth is running cables from the power line into a pool. What is that current making in there?',
    beats: [
      { to: 0.22, say: 'Driven at 1.50 V against its own 1.10 V, the zinc–copper cell ran backwards and plated 4.1 mg onto the zinc strip. Electrolysis forces a reaction in reverse.' },
      { to: 0.44, say: 'In molten sodium chloride, 6 sodium ions took 6 electrons at the cathode to form sodium, while chloride ions gave electrons at the anode to form chlorine.' },
      { to: 0.64, say: 'One ampere for 30 s passed 30 C and 2 A for 10 s passed 20 C, while 0.5 A for 100 s passed 50 C and plated the most silver.' },
      { to: 0.80, say: 'Two cells in series split water into hydrogen and oxygen gas; in salty brine, chloride reacts instead of oxygen to make chlorine gas.' },
      { to: 0.94, say: '2.00 A for 1800 s passed 3600 C, or 0.0373 mol of electrons. At two electrons per copper atom, that makes 0.0187 mol, or 1.19 g of copper by Faraday\'s law.' }
    ],
    pin: 'The stolen electricity is plating pure copper out of the marsh pools.'
  },
  'unit10/q2-activity': {
    scene: 'dip-order',
    role: 'Direct Clue',
    mystery: 'Two different metals are bolted to every pylon. Which one gives up its electrons?',
    beats: [
      { to: 0.26, say: 'Both zinc and copper were coated in the silver solution, only zinc in the copper solution, and neither in the zinc solution. A coating means one metal took the place of another: displacement.' },
      { to: 0.52, say: 'Zinc coated in 3 of the other solutions, iron in 2, lead in 1 and copper in none. That order, from most ready to lose electrons to least, is the activity series.' },
      { to: 0.76, say: 'A copper strip in zinc solution stayed clean: the swap runs one way only. In acid, magnesium, zinc and iron bubbled while copper and silver did not, placing hydrogen after iron.' },
      { to: 0.94, say: 'Nails wired to zinc or magnesium had no blue spots, and nails wired to copper or tin had 5. The more active metal in the activity series gives its electrons first, so it is used up.' }
    ],
    pin: 'The more active metal gives up its electrons first.'
  },
  'unit10/q1-halves': {
    scene: 'half-join',
    role: 'Direct Clue',
    mystery: 'Look where two metals are bolted together on the pylon—it is rotting right at the joint. What is passing between them?',
    beats: [
      { to: 0.26, say: 'In the zinc and copper beaker, zinc went from 0 to +2 and copper from +2 to 0. An atom\'s oxidation number counts the electrons it has lost or gained.' },
      { to: 0.5, say: 'Written as half-reactions, zinc loses 2 electrons in oxidation and copper gains 2 in reduction—together a redox reaction. The electrons lost equal the electrons gained.' },
      { to: 0.76, say: 'Aluminium gives 3 electrons and copper takes 2, so the halves are scaled 2 and 3 times: 6 electrons given and 6 taken.' },
      { to: 0.94, say: 'Permanganate takes 5 electrons from 5 iron(II) ions, balancing atoms and charge (+17 on each side).' }
    ],
    pin: 'Electrons are moving between the two metals, and that is what corrodes the pylons.'
  },
  'unit10/q3-galvanic': {
    scene: 'cell-open',
    role: 'Station Fix',
    mystery: 'The Fifth cut the tube between the two beakers, and every marsh battery died. What does a battery need that bridge for?',
    beats: [
      { to: 0.24, say: 'With a wire alone the current fell from 0.50 A to zero at 3 s. A salt bridge held it at 0.50 A for the whole 10 s.' },
      { to: 0.48, say: 'In the zinc and copper cell, 4 electrons crossed the wire as Zn²⁺ rose from 8 to 10 and Cu²⁺ fell from 8 to 6. Oxidation happens at the anode and reduction at the cathode.' },
      { to: 0.72, say: 'Each electron through the wire sends one charge through the bridge: 4 negative ions moved toward the anode and 4 positive ions toward the cathode. The electrons never enter the bridge.' },
      { to: 0.94, say: 'After an hour the iron anode had lost 0.37 g and the copper cathode had gained 0.42 g. The mass follows the atoms.' }
    ],
    pin: 'The salt bridge lets ions flow. Replacing it brings the marsh batteries back.'
  },
  'unit10/q4-potential': {
    scene: 'cell-gap',
    role: 'Station Fix',
    mystery: 'The grid needs its strongest cells back. Which pair of metals gives the most voltage?',
    beats: [
      { to: 0.22, say: 'Against the hydrogen reference (0 V), magnesium read −2.37 V, zinc −0.76 V, copper +0.34 V, and silver +0.80 V. Each reading is that metal\'s E°.' },
      { to: 0.44, say: 'A cell takes its voltage from the gap between two readings: silver minus magnesium is 3.17 V. A positive gap lights the lamp.' },
      { to: 0.66, say: 'Doubled, the zinc and copper cell moved twice as many electrons and released twice the energy, yet the voltmeter still read 1.10 V.' },
      { to: 0.82, say: 'Energy released follows ΔG° = −nFE°. For zinc with silver (n = 2, E° = 1.56 V), ΔG° = −301 kJ.' },
      { to: 0.95, say: 'Equilibrium follows log K = nE° ÷ 0.0592. For zinc with silver, log K = 52.7, so K is near 10⁵³.' }
    ],
    pin: 'Magnesium paired with silver gives the highest voltage (3.17 V) for Brinewire\'s grid.'
  },
  /* ---- Brinewire: the Clamp's five cells, read the way every cell on the road was ---- */
  'unit10/boss-clamp': {
    scene: 'clamp-open',
    role: 'Boss Payoff',
    mystery: 'The Fifth has been plating copper out of Brinewire\'s pools. How much has it taken?',
    beats: [
      { to: 0.2, say: 'Iron got coated in 3 of the other 3 solutions, nickel in 2, tin in 1, and silver in none. More coatings mean a metal gives electrons more readily.' },
      { to: 0.4, say: 'The ammeter read 1.44 A and electrons moved toward the silver beaker, so they left through magnesium. Magnesium is the anode.' },
      { to: 0.6, say: 'Iron read −0.44 V and silver +0.80 V, giving a gap of 1.24 V. Voltage is energy per electron, so scaling the equation does not change it.' },
      { to: 0.78, say: 'Beakers of 0.010 M and 1.0 M zinc read 0.059 V, with electrons leaving the electrode in the dilute beaker—the anode.' },
      { to: 0.94, say: '1.50 A for 1200 s passed 1800 C, or 0.0187 mol of electrons. At two electrons per copper atom, that plated 0.59 g of pure copper from the pool.' }
    ],
    pin: 'Each clamp plates 0.59 g of copper per 20 minutes; they are wiring something huge.'
  },
  /* ---- Verdigris: the Fifth calls the marsh water acid; what kind, and how much? ---- */
  'unit09/q2-scale': {
    scene: 'scale',
    role: 'Direct Clue',
    mystery: 'The acid meters on the marsh tanks read numbers only a few steps apart. How much more acidic is a tank one step lower?',
    beats: [
      { to: 0.26, say: 'Each tenfold dilution of hydrochloric acid raised the pH by 1: 1.00, 2.00, 3.00. Each step down on the pH scale is ten times more acidic.' },
      { to: 0.52, say: 'On sodium hydroxide, pOH measures hydroxide the way pH measures hydronium. At 25 °C the two always add up to 14.00.' },
      { to: 0.78, say: 'Diluting 1.0 × 10⁻⁶ M hydrochloric acid gave pH 6.00, 6.79, 6.98 and 7.00. Water’s own hydronium ions keep the pH from rising past 7.' },
      { to: 0.94, say: 'Water at 50 °C reads 6.63 yet still holds equal H₃O⁺ and OH⁻. Neutral means equal amounts of both ions, which equals pH 7 only at 25 °C.' }
    ],
    pin: 'Each pH step is a tenfold change in acidity.'
  },
  'unit09/q1-handover': {
    scene: 'handover',
    role: 'Direct Clue',
    mystery: 'The runoff from the Fifth\'s plant is eating through the fort\'s pipes. What is it doing to the water it reaches?',
    beats: [
      { to: 0.26, say: 'When HCl meets water, 8 of 8 hydrogens leave as protons and join water molecules to make hydronium. A proton donor like HCl is a Brønsted-Lowry acid.' },
      { to: 0.52, say: 'Ammonia has no OH group, yet it took a proton from water in 3 of 8 pairs. A proton acceptor is a Brønsted-Lowry base.' },
      { to: 0.78, say: 'An acid and what it leaves behind differ by one proton, forming a conjugate pair. Water acts as both acid and base, so it is amphoteric.' },
      { to: 0.94, say: 'Even pure water forms a few ions—1.0 × 10⁻⁷ mol/L of each. Multiplied together, they give Kw = 1.0 × 10⁻¹⁴ at 25 °C.' }
    ],
    pin: 'The runoff donates protons to the water: it is acid waste.'
  },
  'unit09/q8-capacity': {
    scene: 'capacity-limit',
    role: 'Station Fix',
    mystery: 'How does pH shift a buffer\'s two forms, and how much acid can the fort\'s buffer take before failing?',
    beats: [
      { to: 0.26, say: 'At pH 3 the strip showed 98 acetic acid to 2 acetate, and at pH 6 it showed 5 to 95. An acid keeps its H⁺ below its pKa and loses its H⁺ above it.' },
      { to: 0.5, say: 'The same pour moved the 0.010 M buffer from 4.75 to 4.27 and the 0.10 M buffer only from 4.74 to 4.70. Buffer capacity grows with concentration.' },
      { to: 0.76, say: 'Flask 1 held 40 spheres of acetate and each pour used 5. After 8 pours its acetate was nearly used up (2 left) and the pH dropped from 4.75 to 3.05.' },
      { to: 0.94, say: 'One pour of 10 acid spheres dissolved 5 units of magnesium hydroxide, because acid reacts with its OH⁻, but none of the silver chloride. Salts whose ions react with acid dissolve more in acid.' }
    ],
    pin: 'The larger buffer holds 120 spheres of acetate—about 24 pours before protection fails.'
  },
  'unit09/q7-buffer': {
    scene: 'buffer-catch',
    role: 'Station Fix',
    mystery: 'Acid from the marsh keeps splashing into the fort\'s drinking water. What can we add to keep the water steady?',
    beats: [
      { to: 0.28, say: 'The same pour of acid dropped plain water from 7.00 to 2.04, while the mixture moved only from 4.74 to 4.66. A weak acid with its conjugate base is a buffer.' },
      { to: 0.52, say: 'In the buffer, acetate caught the added acid: acetate fell from 100 spheres to 90 and acetic acid rose from 100 to 110.' },
      { to: 0.76, say: 'Added base works the other way: acetic acid fell from 100 to 90 and acetate rose to 110, so the pH rose only from 4.74 to 4.83.' },
      { to: 0.94, say: 'Buffer pH equals pKa + log(acetate ÷ acetic acid): 100 to 100 reads 4.74, 150 to 50 reads 5.22, and 100 to 10 reads 5.74.' }
    ],
    pin: 'A weak acid with its conjugate base holds intake pH steady against acid and base.'
  },
  'unit09/q3-weak': {
    scene: 'weak-windows',
    role: 'Direct Clue',
    mystery: 'Two waste tanks hold the same amount of acid, yet one eats through steel and the other barely stains it. Why?',
    beats: [
      { to: 0.26, say: 'At the same 0.10 M concentration, hydrochloric acid donated every proton while acetic acid donated only a few: pH 1.00 against 2.88.' },
      { to: 0.54, say: 'Diluting acetic acid causes a larger fraction of it to ionize: 3 of 200 units at 0.10 M, 8 at 0.010 M and 25 at 0.0010 M.' },
      { to: 0.76, say: '[H₃O⁺][CH₃COO⁻] ÷ [CH₃COOH] equals the same constant Ka in every flask, at every concentration.' },
      { to: 0.94, say: 'For any conjugate acid–base pair, Ka × Kb = 1.0 × 10⁻¹⁴, so a larger Ka always means a smaller Kb.' }
    ],
    pin: 'The harsh tank holds a strong acid (ionizes completely); weak acids ionize only partly.'
  },
  'unit09/q6-titrate': {
    scene: 'titration-reads',
    role: 'Station Fix',
    mystery: 'The worst waste tank must be neutralized exactly. How much base does it take?',
    beats: [
      { to: 0.28, say: 'Adding base to 25.0 mL of hydrochloric acid raised the pH slowly until it jumped steeply through 7.00 at 25.0 mL. That jump is the equivalence point.' },
      { to: 0.54, say: 'Acetic acid took the same 25.0 mL of base, yet its equivalence point was pH 8.72 instead of 7.00. Equivalence pH depends on the acid.' },
      { to: 0.78, say: 'Halfway to equivalence, the pH matched each acid’s pKa: 4.75 for acetic acid and 3.75 for formic acid. That is the half-equivalence point.' },
      { to: 0.94, say: 'Sulfurous acid jumped steeply twice, at 10.0 mL and 20.0 mL. A polyprotic acid gives up its protons one at a time.' }
    ],
    pin: 'The pH curve pinpointed neutralization: 25.0 mL of 0.100 M base for 25.0 mL acid.'
  },
  'unit09/q4-structure': {
    scene: 'race-pairs',
    role: 'Direct Clue',
    mystery: 'Why does one tank\'s acid eat through steel faster than another\'s?',
    beats: [
      { to: 0.28, say: 'In the proton race, HF kept all 100 protons against chloride, while HCl gave all 100 to fluoride. Across a row, electronegativity wins; down a column, atom size wins.' },
      { to: 0.54, say: 'HBr gave 96 of 100 protons to chloride (while HCl gave only 4 to bromide). Down a column, the larger atom stabilizes negative charge better, making a stronger acid.' },
      { to: 0.78, say: 'Each extra oxygen on chlorine pulls electron density through the bonds (the inductive effect), stabilizing the conjugate base and strengthening the acid.' },
      { to: 0.94, say: 'Resonance spreads acetate’s negative charge across two oxygens, making acetic acid far stronger than ethanol.' }
    ],
    pin: 'An acid is stronger when its conjugate base stabilizes negative charge better.'
  },
  'unit09/q5-salts': {
    scene: 'salt-reads',
    role: 'Station Fix',
    mystery: 'The worst waste tank has been neutralized. Is its water safe now?',
    beats: [
      { to: 0.3, say: 'Neutralization ended at pH 7.00 only when both acid and base were strong. Acetic acid with NaOH ended at 8.72, and ammonia with HCl ended at 5.28.' },
      { to: 0.62, say: 'Sodium chloride read 7.00, sodium fluoride 8.09, and ammonium chloride 5.13. Ions from weak acids or bases react with water; ions from strong ones do not.' },
      { to: 0.94, say: 'When acid or base is left over, the excess sets the pH. After 20.0 mL of base met 30.0 mL of acid, 33 of 100 acid units remained and the flask read 1.70.' }
    ],
    pin: 'Not always: neutralizing the waste tank\'s weak acid still leaves a basic salt behind.'
  },
  /* ---- Verdigris: the Fifth called the marsh water acid and measured nothing ---- */
  'unit09/boss-leach': {
    scene: 'leach-open',
    role: 'Boss Payoff',
    mystery: 'The Leach labels all five intake vats "acid" without measuring them. What is really in each vat?',
    beats: [
      { to: 0.20, say: 'At 60 °C, water splits into more ions so neutral water reads pH 6.51 with equal H₃O⁺ and OH⁻, while a dilute base at 60 °C reads 7.00 with far more OH⁻.' },
      { to: 0.40, say: 'Formic acid read 2.54, acetic acid 2.88, and hydrofluoric acid 3.26. The pH depended on total H₃O⁺ made, not just the share of molecules split.' },
      { to: 0.60, say: 'Ammonium nitrate read 4.98 (acidic), potassium chloride 7.00 (neutral), and sodium carbonate 11.65 (basic). Only ions from weak parents react with water.' },
      { to: 0.80, say: 'Ammonia reached equivalence at 25.0 mL of acid and pH 5.28. Methyl red changed colour right across that jump, while the other indicators did not.' },
      { to: 0.94, say: '100 acetic acid spheres with 227 acetate spheres read pH 5.10. Choosing the buffer ratio sets the target pH.' }
    ],
    pin: 'Each vat differed: warm neutral water, weak acids, reactive salts, ammonia, and a 2.27:1 buffer.'
  },
  /* ---- Teeter: is a pan the Fifth calls finished really finished? ---- */
  'unit08/boss-tipper': {
    scene: 'tipper-open',
    role: 'Boss Payoff',
    mystery: 'Teeter\'s salt ponds are supposed to be abandoned, yet they never stop running. What is really happening?',
    beats: [
      { to: 0.25, say: 'On every test vessel, the ratio Q compared to K showed which way the mixture would move.' },
      { to: 0.5, say: 'As the mixture settled, Q reached K and the amounts leveled off, even when the two sides held different amounts.' },
      { to: 0.76, say: 'Behind the Tipper sits the Fifth Guild\'s final pond. Started from butane alone or isobutane alone, a reversible vessel settles to the same ratio.' },
      { to: 0.94, say: 'Its particles keep reacting in both directions at equal rates, and a drain pump pulling product out keeps it making more.' }
    ],
    pin: 'A pond that looks still can run both ways; a drain pump keeps it making product.'
  },
  'unit08/q4-properties': {
    scene: 'k-rewrite',
    role: 'Direct Clue',
    mystery: 'How does K change when you flip, double, or combine equations?',
    beats: [
      { to: 0.3, say: 'Flip a reaction around and the same settled vessel gives 1 over the old K. The constant depends on how the equation is written.' },
      { to: 0.58, say: 'Double every coefficient in the equation and K gets squared, because every amount in the ratio is raised to the power of two.' },
      { to: 0.92, say: 'When two reactions add up to a third, the shared substance cancels out and the overall K equals the product of both constants.' }
    ],
    pin: 'Flipping inverts K, doubling squares K, and adding reactions multiplies their K values.'
  },
  'unit08/q5-ice': {
    scene: 'ice-bars',
    role: 'Direct Clue',
    mystery: 'Once a vessel settles, how much product does it hold?',
    beats: [
      { to: 0.32, say: 'In an ICE table, each substance changes by x times its coefficient, so HI rises twice as much as H₂ falls.' },
      { to: 0.64, say: 'With a small K, very little reactant turns into product. K is a ratio of equilibrium amounts, not a fixed percentage.' },
      { to: 0.94, say: 'When the starting concentration is very small, a larger fraction reacts, so the small-x shortcut fails (over 5%) and you need the full equation.' }
    ],
    pin: 'Tracking initial, change, and equilibrium amounts shows how much product each settled vessel holds.'
  },
  'unit08/q1-both': {
    scene: 'pan-both-ways',
    role: 'Direct Clue',
    mystery: 'This pond looks dead and still, yet someone came to sample it. Is anything still happening inside?',
    beats: [
      { to: 0.3, say: 'Start a vessel with only butane and the amounts level off with some butane still left. The flat graph looks like the reaction stopped.' },
      { to: 0.66, say: 'Ring a few particles and they keep switching between butane and isobutane at about the same rate. That steady two-way traffic is dynamic equilibrium.' },
      { to: 0.9, say: 'Start from isobutane alone and the vessel settles at about the same amounts, because a reversible reaction reaches balance from either side.' }
    ],
    pin: 'Yes. A pond that looks still can keep reacting both ways at equal rates.'
  },
  'unit08/q6-lean': {
    scene: 'lean-push',
    role: 'Direct Clue',
    mystery: 'Every pond on the flats has stopped making salt except the one with the pump. Why does that one keep going?',
    beats: [
      { to: 0.25, say: 'Add H₂ to a settled vessel and Q drops below K, so the reaction uses up N₂ and makes more NH₃ until Q returns to K.' },
      { to: 0.48, say: 'Compress the vessel and Q drops below K again, shifting the reaction to make more NH₃ and fewer total gas molecules.' },
      { to: 0.68, say: 'Add inert argon and total pressure rises, but the amount of each reacting gas stays the same, so Q stays on K.' },
      { to: 0.88, say: 'Heat the vessel and K itself changes—only temperature changes K. Taking NH₃ out lowers Q below K, so the vessel keeps making more.' }
    ],
    pin: 'The drain pump keeps removing product, lowering Q below K so the pond keeps making more.'
  },
  'unit08/q2-k': {
    scene: 'ratio-holds',
    role: 'Direct Clue',
    mystery: 'Three vessels started with different amounts. What do they share once each one settles?',
    beats: [
      { to: 0.33, say: 'Three vessels of butane and isobutane started with different amounts and finished with different amounts, yet isobutane over butane matched on all three.' },
      { to: 0.68, say: 'When H₂ and I₂ form 2 HI, the 2 becomes an exponent, so HI squared divided by H₂ times I₂ matches on every vessel.' },
      { to: 0.92, say: 'That fixed ratio is K. A large K means mostly products at balance, and a small K means mostly reactants.' }
    ],
    pin: 'Every vessel of the same reaction settles to the same product-to-reactant ratio, K.'
  },
  'unit08/q3-q': {
    scene: 'needle-to-k',
    role: 'Direct Clue',
    mystery: 'A fresh brine mix has just been poured into a tank. Which way will it react?',
    beats: [
      { to: 0.33, say: 'A mixture with too much isobutane has a current ratio Q above K, so it shifts toward butane until Q drops to K.' },
      { to: 0.66, say: 'For K = 2.0, equal amounts give Q = 1.0, below K, so the vessel shifts toward isobutane. The ratio, not which pile is bigger, sets the direction.' },
      { to: 0.92, say: 'When Q already equals K, nothing shifts. With Q below K a reaction makes products; with Q above K it makes reactants.' }
    ],
    pin: 'Comparing the current ratio Q to K shows which way the tank mix will move.'
  },
  'unit08/q8-free': {
    scene: 'free-k',
    role: 'Direct Clue',
    mystery: 'Why do some reactions stop with mostly reactants while others make mostly product?',
    beats: [
      { to: 0.26, say: 'Settle three vessels and the more negative ΔG° is, the more product each holds. Even a vessel with positive ΔG° holds a little product.' },
      { to: 0.52, say: 'Graphing product against ΔG° gives one smooth curve: ΔG° = 0 means K = 1 (equal amounts), and negative ΔG° means K > 1.' },
      { to: 0.76, say: 'A salt can dissolve even while cooling the water: ΔG = ΔH − TΔS turns negative whenever entropy (TΔS) outweighs the heat absorbed (ΔH).' },
      { to: 0.92, say: 'Pair a reaction that cannot run alone with one that can, and their ΔG° values add. When the sum is negative, the coupled pair runs.' }
    ],
    pin: 'Free energy ΔG° sets K; coupling a positive-ΔG° step with a negative one makes it run.'
  },
  'unit08/q7-dissolve': {
    scene: 'solubility-trade',
    role: 'Station Fix',
    mystery: 'Mineral scale keeps crusting inside the pond pipes. Can we make it come out of the water before it gets there?',
    beats: [
      { to: 0.26, say: 'Add solid CaF₂ to water and the ion meters rise, until one more scoop changes nothing. The water is saturated, and extra solid stays on the bottom.' },
      { to: 0.5, say: 'Even then, ions keep leaving the solid and returning at about the same rate. That balance is why Ksp, the product of ion concentrations, stays fixed.' },
      { to: 0.76, say: 'Ksp alone does not rank solubility across different formulas. Ag₂CrO₄ has a smaller Ksp yet dissolves more: 6.5 × 10⁻⁵ mol/L vs 1.3 × 10⁻⁵ mol/L for AgCl.' },
      { to: 0.94, say: 'Adding a common ion dramatically lowers solubility: with 0.10 mol/L chloride already in the water, only 1.8 × 10⁻⁹ mol/L of AgCl dissolves instead of 1.3 × 10⁻⁵ mol/L.' }
    ],
    pin: 'Adding a common ion raises Q above Ksp, forcing scale to precipitate before the pipes.'
  },
  /* ---- Tallow: is the Fifth's alchemy rumour true, and what are they putting in the salt? ---- */
  'unit01/q1-grain': {
    scene: 'grain-resolve',
    role: 'Direct Clue',
    mystery: 'The raided salt bin has dark grit mixed through the white salt. Up close, what is this sample actually made of?',
    beats: [
      { to: 0.22, say: 'Zoom in on the sample from Tallow\'s raided salt bin and it stops being smooth. Matter is made of tiny atoms.' },
      { to: 0.46, say: 'A substance made of one kind of atom is an element. Different atoms sitting together without joining make a mixture.' },
      { to: 0.70, say: 'Atoms that are joined make a molecule. The bonds in a molecule can break, but a single atom never splits.' },
      { to: 0.90, say: 'Join different atoms and you get a compound, like Tallow\'s salt. None of this explains how a heavy chunk showed up in the bin.' }
    ],
    pin: 'The sample is pure salt with a separate heavy substance mixed in, not bonded.'
  },
  'unit01/q2-core': {
    scene: 'beam-foil',
    role: 'Direct Clue',
    mystery: 'The raiders bragged that they can turn salt into gold. What decides whether an atom is gold or something else?',
    beats: [
      { to: 0.24, say: 'Fire a beam at a thin foil and nearly every shot goes straight through. An atom is mostly empty space, with a tiny dense center, the nucleus.' },
      { to: 0.50, say: 'The nucleus holds protons, each +1, and neutrons, which carry no charge. The electrons, each -1, sit far outside it in shells.' },
      { to: 0.74, say: 'The protons decide which element an atom is. The electrons in the outer shell, the valence electrons, decide how it reacts.' },
      { to: 0.90, say: 'To turn salt into gold, the Fifth Guild would have to change the protons in the nucleus. Ordinary chemistry cannot reach that deep.' }
    ],
    pin: 'Its proton count. Ordinary chemistry cannot change protons, so salt stays salt.'
  },
  'unit01/q3-catalogue': {
    scene: 'chart-fill',
    role: 'Toolkit',
    beats: [
      { to: 0.24, say: 'Line up atoms by their proton count, the atomic number, and their properties repeat in a steady pattern: the periodic table.' },
      { to: 0.48, say: 'Each row, or period, ends when a shell fills up. Each column, or group, shares the same outer-shell count and behaves alike.' },
      { to: 0.74, say: 'Metals on the left give up electrons, and nonmetals on the right take them. Noble gases on the far right have full shells and rarely react.' },
      { to: 0.90, say: 'That is why salt pairs sodium with chlorine: one gives an electron and one takes it. With this chart we can check any shipping log.' }
    ]
  },
  'unit01/q4-ledger': {
    scene: 'three-numbers',
    role: 'Direct Clue',
    mystery: 'Someone scraped the label off this tank. How can we tell what is inside without trusting a label?',
    beats: [
      { to: 0.24, say: 'Three numbers describe any atom: its protons, its neutrons and its charge. Protons plus neutrons is the mass number.' },
      { to: 0.48, say: 'Change the protons and it is a different element. Change only the neutrons and it is an isotope, which behaves exactly the same.' },
      { to: 0.74, say: 'Take electrons off and the atom is a cation; add some and it is an anion. One magnesium and two chlorines cancel to zero.' },
      { to: 0.90, say: 'A label can claim anything, but the counts cannot be argued with. I will run the unlabeled salt tanks through the same check.' }
    ],
    pin: 'Neutrons change an atom\'s mass, not its element: the tank still holds sodium chloride.'
  },
  'unit01/q5-assay': {
    scene: 'balance-bins',
    role: 'Direct Clue',
    mystery: 'If the raiders had swapped Tallow\'s chlorine for something else, its average mass would change. Has it?',
    beats: [
      { to: 0.24, say: 'A real sample of an element is a mixture of isotopes, in proportions that are fixed. Here, three chlorine atoms in four are chlorine-35.' },
      { to: 0.50, say: 'The listed mass is an average over that mixture, weighted by how common each isotope is, so it leans toward the common one.' },
      { to: 0.74, say: 'Any single atom has a whole-number mass, but an average rarely does. The decimal tells you how the mix sits: 35.5 is nearer 35 than 37.' },
      { to: 0.90, say: 'Natural chlorine always balances at 35.5, because three quarters of its atoms have mass 35 and one quarter have mass 37.' }
    ],
    pin: 'No. Its chlorine averages 35.5, the same as natural chlorine.'
  },
  'unit01/q6-weigh': {
    scene: 'scale-count',
    role: 'Station Fix',
    mystery: 'The raided drums are lighter, and they are still sealed. How can we count what is left inside without opening them?',
    beats: [
      { to: 0.24, say: 'Nobody can count atoms, so we weigh them. Atoms of one kind all weigh the same, so a pan that balances the crate holds the same number.' },
      { to: 0.50, say: 'The listed mass of a substance, in grams, is one mole of it. One mole always holds 6.02 × 10²³ atoms or molecules, whatever it is made of.' },
      { to: 0.76, say: 'If there are 72 grams of water and each mole weighs 18 grams, then there are 4 moles of water.' },
      { to: 0.90, say: 'So a sealed crate can be counted without opening it, and nothing in the stores can hide inside one. The sealed drums on the dock are next.' }
    ],
    pin: 'Weighing a sealed drum gives its moles, so we can count what is inside.'
  },
  /* ---- Ligar (2026-10-23 rollout): the blast at the rescue pass, and what held the rock together ---- */
  'unit03/q1-joins': {
    scene: 'bond-pairs',
    role: 'Station Fix',
    mystery: 'Some of the rubble crumbles at a touch and some will not even chip. Why does it hold together so differently?',
    beats: [
      { to: 0.25, say: 'Two atoms bond when coming together lowers their energy. For most atoms, a full outer shell means a full s and p subshell (8 electrons).' },
      { to: 0.55, say: 'When electronegativities differ greatly, one atom takes electrons and the oppositely charged ions attract in an ionic bond. When electronegativities are similar, atoms share electron pairs in a covalent bond.' },
      { to: 0.85, say: 'Ionic bonds between attracting ions hold solids together much more strongly than separate covalent molecules, which is why some rubble will not chip while other pieces crumble.' }
    ],
    pin: 'Ionic bonds hold far more strongly than separate covalent molecules, explaining the mixed rubble.'
  },
  'unit03/q2-lattice': {
    scene: 'liner-heat',
    role: 'Station Fix',
    mystery: 'The tunnel lining must stay solid in great heat and carry no electricity to the miners. Which kind of solid can do both?',
    beats: [
      { to: 0.25, say: 'Molecular solids are held together by weak forces between molecules, so they melt at low temperatures and never conduct electricity.' },
      { to: 0.5, say: 'Ionic solids lock ions in a rigid lattice, so they melt at high temperatures and conduct only when melted.' },
      { to: 0.75, say: 'Metals have free-moving outer electrons, so they conduct electricity even when cold.' },
      { to: 0.95, say: 'Covalent networks are bonded all the way through, so they survive 900 °C and carry no current.' }
    ],
    pin: 'A covalent network survives the heat and carries no current.'
  },
  'unit03/q3-distance': {
    scene: 'well-depth',
    role: 'Direct Clue',
    mystery: 'The Fifth Guild sliced straight through solid rock in seconds. How much energy does it take to pull bonded atoms apart?',
    beats: [
      { to: 0.4, say: 'Two atoms settle where attraction and repulsion balance, at the lowest point of their potential energy curve. That distance is the bond length.' },
      { to: 0.65, say: 'Pulling bonded atoms completely apart means lifting them from the bottom of the curve back up to zero. That depth is the bond energy.' },
      { to: 0.85, say: 'Stronger bonds hold atoms closer together and have deeper energy wells, so slicing straight through rock packed with strong bonds takes enormous energy.' }
    ],
    pin: 'Stronger bonds hold atoms closer and require enormous energy to pull apart.'
  },
  'unit03/q4-dots': {
    scene: 'lewis-count',
    role: 'Station Fix',
    mystery: 'The gas from the crack is carbon dioxide: one carbon and two oxygens. How do they share electrons so every outer shell is full?',
    beats: [
      { to: 0.26, say: 'Count first: carbon brings 4 valence electrons and each oxygen brings 6, giving 16 electrons to place.' },
      { to: 0.48, say: 'Two single bonds use 4 electrons. Filling each oxygen to 8 with lone pairs uses the remaining 12.' },
      { to: 0.72, say: 'Carbon then has only 4 electrons in its outer shell, and none are left to give it.' },
      { to: 0.92, say: 'So each oxygen shares one of its lone pairs with carbon. Both bonds become double bonds, and every atom has 8.' }
    ],
    pin: 'Carbon dioxide is O=C=O: each oxygen shares two pairs with carbon, so every atom has 8.'
  },
  'unit03/q5-resonance': {
    scene: 'resonance-hybrid',
    role: 'Toolkit',
    beats: [
      { to: 0.28, say: 'Ozone can be drawn with a double bond on the left and a single bond on the right. Drawn that way, one bond would be short and the other long.' },
      { to: 0.52, say: 'The other drawing swaps them, and it fits the formula just as well. Neither drawing matches what is measured.' },
      { to: 0.78, say: 'Both bonds measure 128 pm, halfway between a double bond and a single bond (bond order 1.5). The molecule is not flipping between drawings.' },
      { to: 0.92, say: 'Each outer oxygen carries a formal charge of −1/2. The individual drawings only exist on paper; the real molecule is their average.' }
    ]
  },
  'unit03/q6-shape': {
    scene: 'domain-shapes',
    role: 'Toolkit',
    beats: [
      { to: 0.27, say: 'Electron domains repel, so they spread as far apart as they can. Four domains point to the corners of a tetrahedron, 109.5° apart.' },
      { to: 0.5, say: 'Replace one bonded atom with a lone pair and the shape becomes trigonal pyramidal. Because a lone pair repels more strongly than a bond, the bond angle narrows to 107°.' },
      { to: 0.76, say: 'With two lone pairs, the shape is bent and the angle narrows to 104.5°. Count total domains first, then lone pairs, to predict the shape.' }
    ]
  },
  'unit03/q8-hybrid': {
    scene: 'hybrid-mix',
    role: 'Toolkit',
    beats: [
      { to: 0.26, say: 'A carbon atom has one s orbital and three p orbitals: four orbitals of two different shapes.' },
      { to: 0.5, say: 'Mixed together, they form four identical sp³ hybrid orbitals, 109.5° apart. That is the angle of carbon\'s bonds in methane.' },
      { to: 0.76, say: 'A double bond has two parts: a sigma bond overlapping head-on between the nuclei, and a pi bond overlapping side-by-side above and below them.' },
      { to: 0.92, say: 'Twisting one end breaks the side-by-side pi overlap, so a double bond cannot rotate freely without breaking. A single sigma bond can rotate freely.' }
    ]
  },
  'unit03/q7-polarity': {
    scene: 'field-swing',
    role: 'Station Fix',
    mystery: 'Some tunnel gases cling to the rescuers\' charged gear, and others drift straight past. Why do only some cling?',
    beats: [
      { to: 0.25, say: 'A bond is polar when its atoms share electrons unequally, and a molecule is polar when its bond dipoles do not cancel.' },
      { to: 0.8, say: 'Shape decides: water turned in the electric field, while linear carbon dioxide did not, even though its individual bonds are polar.' },
      { to: 0.9, say: 'Polarity determines what a molecule dissolves in and how it behaves near electric charge. In hydrogen chloride, the shared electrons shift only about 18% of the way toward chlorine.' }
    ],
    pin: 'Polar gases cling to the gear, and nonpolar gases vent away.'
  },
  'unit03/q9-orbitals': {
    scene: 'magnet-pull',
    role: 'Station Fix',
    mystery: 'This pipe carries air to the trapped miners. How can a magnet show whether that air still has oxygen in it?',
    beats: [
      { to: 0.25, say: 'When two atoms meet, their orbitals combine into molecular orbitals. Like signs add between the nuclei to make a bonding orbital; opposite signs cancel there to make an antibonding orbital.' },
      { to: 0.5, say: 'Electrons fill from the lowest energy level up. Oxygen\'s last two electrons remain unpaired, so a magnet attracts it; nitrogen has all electrons paired and is not attracted.' },
      { to: 0.75, say: 'Molecular orbitals explain oxygen\'s magnetism where Lewis structures cannot, which is why chemists use both models. Ligar\'s final guard waits at the end of the cut.' }
    ],
    pin: 'Oxygen is pulled toward a magnet and nitrogen is not, so the magnet finds it.'
  },
  'unit03/boss-warden': {
    scene: 'warden-cut',
    role: 'Boss Payoff',
    mystery: 'Ligar\'s basalt walls were melted glass-smooth. What could make that much heat?',
    beats: [
      { to: 0.25, say: 'Testing its crystals, bond shapes, polarity, and magnetism took the Basalt Warden apart step by step.' },
      { to: 0.5, say: 'The warden crumbled back into ordinary rock, revealing a quarry slab sliced completely smooth through every crystal bond.' },
      { to: 0.75, say: 'No normal torch gets hot enough to melt solid volcanic rock like glass. We logged the slab in the Case File.' }
    ],
    pin: 'No normal torch could cut volcanic rock like that. The Fifth has extreme heat.'
  },

  'unit01/boss-hopper': {
    scene: 'hopper-fall',
    role: 'Boss Payoff',
    mystery: 'Tallow\'s salt was pure, yet something heavy turned up inside it. What is it?',
    beats: [
      { to: 0.26, say: 'Using everything from the refinery benches, we broke the Hopper down and shut off its sorting chute.' },
      { to: 0.50, say: 'The machine collapsed into cold metal, leaving behind a heavy grey lump that nobody on Tallow mined.' },
      { to: 0.74, say: 'Tests show it is bismuth. Salt holds only sodium and chlorine, so ordinary chemistry could never create bismuth here.' },
      { to: 0.90, say: 'The metal chunk goes into the Case File. Next, Lanternfall\'s dark towers await.' }
    ],
    pin: 'It is bismuth, a heavy metal that ordinary chemistry cannot make from salt.'
  },

  /* ---- Bellows: gas pressure, gas laws, ideal gas law, mixtures, speed/effusion, real gases, and the Compressor ---- */
  'unit04/q1-knocks': {
    scene: 'gauge-walls',
    role: 'Station Fix',
    mystery: 'A sealed tank\'s reading keeps climbing even though no gas was added. What is happening inside?',
    beats: [
      { to: 0.25, say: 'Pressure meters on the roof, side wall, and floor of a sealed box all read the same because gas particles collide equally with every wall.' },
      { to: 0.5, say: 'Shrinking the volume or heating the gas makes particles hit the walls harder and more often, raising the pressure.' },
      { to: 0.75, say: 'Temperature measures the average kinetic energy of the particles, so higher temperature means faster collisions and higher pressure.' }
    ],
    pin: 'Particles hitting tank walls cause pressure; heat makes them hit harder and faster.'
  },
  'unit04/q2-laws': {
    scene: 'cold-tank',
    role: 'Direct Clue',
    mystery: 'This sealed tank sat in freezing wind all night, and its pressure never dropped. What should the cold have done to it?',
    beats: [
      { to: 0.25, say: 'A gas\'s volume and pressure follow kelvin temperature (counted from absolute zero), not Celsius.' },
      { to: 0.5, say: 'Cool a sealed tank by 50 degrees from 293 K to 243 K and its kelvin temperature drops by about a sixth (17%), so its pressure drops by about a sixth too.' },
      { to: 0.75, say: 'When both volume and kelvin temperature change at once, their pressure factors multiply.' }
    ],
    pin: 'Cold drops a sealed tank\'s pressure; steady pressure means something inside makes heat.'
  },
  'unit04/q3-ideal': {
    scene: 'equal-rooms',
    role: 'Station Fix',
    mystery: 'Opening a sealed tank to look inside could burst it. How can we find the amount of gas inside from the outside?',
    beats: [
      { to: 0.25, say: 'At the same temperature and pressure, a gas\'s volume depends on how many moles of particles it holds, not which gas it is.' },
      { to: 0.5, say: 'One mole of helium and one mole of carbon dioxide fill the same volume (22.4 L at 0 °C and 1 atm), even though carbon dioxide weighs eleven times as much.' },
      { to: 0.75, say: 'So pressure, volume, and kelvin temperature are enough to calculate the moles inside any sealed tank with PV = nRT without opening it.' }
    ],
    pin: 'Finding the pressure, volume, and kelvin temperature gives the moles of gas without opening the tank.'
  },
  'unit04/q4-mixtures': {
    scene: 'mix-share',
    role: 'Direct Clue',
    mystery: 'A second gas was added to the tank and the pressure rose. How much of the total pressure is from the new gas?',
    beats: [
      { to: 0.25, say: 'Each gas in a mixture produces the same pressure as if it were alone, and the total pressure is the sum of those partial pressures.' },
      { to: 0.5, say: 'Each gas\'s share of the total pressure equals its mole fraction (its moles divided by total moles), not its mass in grams.' },
      { to: 0.75, say: 'When a gas is collected over water, subtracting the water vapor\'s partial pressure leaves the pressure of the gas alone.' }
    ],
    pin: 'Each gas adds its own partial pressure: its mole fraction times the total.'
  },
  'unit04/q5-speed': {
    scene: 'leak-race',
    role: 'Direct Clue',
    mystery: 'Gas is leaking through a tiny hole in a tank vent. How can we tell which gas is escaping?',
    beats: [
      { to: 0.25, say: 'Lighter gas particles move faster at the same temperature, so they escape faster through a pinhole (effusion) and spread faster through air (diffusion).' },
      { to: 0.5, say: 'The stack leak emptied at the same rate as krypton, showing the leaking gas has krypton\'s molar mass (84 g/mol).' },
      { to: 0.75, say: 'Half-empty time scales with the square root of molar mass (Graham\'s law): twice the time means four times the molar mass.' }
    ],
    pin: 'The vent is leaking a gas with krypton\'s molar mass (84 g/mol).'
  },
  'unit04/q6-real': {
    scene: 'crowd-and-pull',
    role: 'Station Fix',
    mystery: 'A tank was compressed to a tiny volume. Does the gas law still give the right pressure?',
    beats: [
      { to: 0.25, say: 'At high pressure, real gas particles take up a noticeable share of the volume, leaving less empty space and raising the pressure above the ideal gas law.' },
      { to: 0.5, say: 'When a real gas is cold, attractions between particles pull them slightly away from the walls, lowering the pressure below the ideal gas law.' },
      { to: 0.75, say: 'A gas behaves closest to ideal at low pressure and high temperature, where particle volume and attractions barely matter.' }
    ],
    pin: 'No. Compressed gas reads high from particle volume; cold gas reads low from attractions.'
  },
  'unit04/boss-compressor': {
    scene: 'warm-cylinder',
    role: 'Boss Payoff',
    mystery: 'A sealed tank has stayed at high pressure for 12 days in freezing air. What could keep it warm that long?',
    beats: [
      { to: 0.25, say: 'With every gas tank balanced and vented, the Compressor finally shut down.' },
      { to: 0.5, say: 'Inside its vault sits a sealed cylinder that held steady pressure for twelve days while the air outside stayed freezing.' },
      { to: 0.75, say: 'Gay-Lussac\'s law shows a sealed gas would lose pressure in the cold unless something inside keeps making heat. We logged the cylinder in the Case File.' }
    ],
    pin: 'No ordinary gas stays hot 12 days in freezing air. Something inside makes heat.'
  },
  /* ---- Ember Reach: the Fifth's manifold is frosted over, so what runs inside it takes heat in ---- */
  /* ---- Kettle: the forged ledger ---- */
  'unit07/q5-ionic': {
    scene: 'cloudy-pond',
    role: 'Station Fix',
    mystery: 'Two clear waste streams run into the pond, and where they meet the water turns cloudy yellow. What is forming?',
    beats: [
      { to: 0.2, say: 'One jar holds dissolved lead and nitrate ions; the other holds potassium and iodide ions. Pour them together and a yellow solid forms.' },
      { to: 0.5, say: 'Only lead and iodide ions lock together into a solid precipitate (PbI₂); potassium and nitrate ions stay dissolved as spectators.' },
      { to: 0.74, say: 'Solubility rules track which ions stay dissolved (like Na⁺, K⁺, NH₄⁺, NO₃⁻). Clear solutions can still react, like H⁺ and OH⁻ forming water.' },
      { to: 0.94, say: 'A complete ionic equation lists every dissolved ion; canceling the spectators on both sides leaves the net ionic equation.' }
    ],
    pin: 'Lead and iodide ions formed lead iodide (PbI₂), a yellow solid that clouds the pond.'
  },
  'unit07/boss-golem': {
    scene: 'golem-vault',
    role: 'Boss Payoff',
    mystery: 'Kettle\'s log records a 50-ton iron haul from 39.9 tons of ore. Where did all that metal really come from?',
    beats: [
      { to: 0.22, say: 'We checked all five of the Recipe Golem\'s tests: limiting feed, compound labels, balanced equations, percent yield, and the shipping log.' },
      { to: 0.5, say: 'Every reaction obeyed conservation of mass and stoichiometry — once a limiting reactant runs out, production stops.' },
      { to: 0.7, say: 'With the golem dispersed, we compared the foundry\'s shipping log against the iron ore equation: 39.9 tons of ore in, 50.0 tons of iron claimed out.' },
      { to: 0.92, say: '39.9 tons of Fe₂O₃ ore can produce at most 27.9 tons of iron. Claiming 50.0 tons leaves 22.1 tons that could never have come from that ore.' }
    ],
    pin: '39.9 tons of ore give at most 27.9 tons; 22.1 tons came from outside scrap iron.'
  },
  'unit07/q4-balance': {
    scene: 'recipe-board',
    role: 'Station Fix',
    mystery: 'The furnace turns ore into iron. How do we count atoms in a recipe so no atom is lost?',
    beats: [
      { to: 0.22, say: 'The furnace equation lists the reactants, Fe₂O₃ and CO, and the products, Fe and CO₂. Count the atoms and the sides disagree: oxygen is 4 on the left and 2 on the right.' },
      { to: 0.48, say: 'A coefficient in front of a formula counts molecules, changing the atom counts while keeping each substance the same. Raise them one at a time until every row matches.' },
      { to: 0.72, say: 'At 1, 3, 2, and 3, every row matches: 2 iron, 3 carbon, and 6 oxygen on each side. State symbols — (s), (l), (g), (aq) — record each substance\'s state.' },
      { to: 0.94, say: 'Groups that stay intact (like PO₄) can be counted as one piece, and conserving atoms even reveals the formula hidden inside sealed product bags.' }
    ],
    pin: 'Every atom must match on both sides; coefficients are how you change the count.'
  },
  'unit07/q2-names': {
    scene: 'crate-labels',
    role: 'Direct Clue',
    mystery: 'The foundry crates are stencilled with formulas like Fe₂O₃ instead of names. How do formulas and names match the ions inside?',
    beats: [
      { to: 0.2, say: 'Ions carry charges and a compound carries none. One Mg²⁺ cancels two Cl⁻, so the ionic formula is MgCl₂.' },
      { to: 0.4, say: 'A two-element name keeps the metal and ends the nonmetal in -ide, as in magnesium oxide. In Fe₂O₃, three O²⁻ carry 6−, so each iron is 3+: iron(III) oxide.' },
      { to: 0.62, say: 'A polyatomic ion stays together with parentheses when repeated, as in Ca(NO₃)₂. In the shed drum, three SO₄²⁻ carry 6−, giving iron(III) sulfate.' },
      { to: 0.8, say: 'Two nonmetals form molecules, so molecular prefixes count atoms instead of charges: N₂O₄ is dinitrogen tetroxide.' },
      { to: 0.96, say: 'An acid releases H⁺ in water. Ions ending in -ide take hydro- and -ic, as in hydrochloric acid; ions ending in -ate drop hydro-, as in nitric acid.' }
    ],
    pin: 'The ore crates hold iron(III) oxide, Fe₂O₃, matching the foundry\'s iron ore.'
  },
  'unit07/q3-change': {
    scene: 'sealed-pot',
    role: 'Direct Clue',
    mystery: 'The foundry log says the furnace put out more metal than went into it. Can a reaction ever make mass?',
    beats: [
      { to: 0.3, say: 'In an open vessel, burning iron pulls in oxygen from the air, so the balance counts more atoms and reads higher.' },
      { to: 0.62, say: 'When burning produces gases that escape from an open vessel, the balance counts fewer atoms and reads lower.' },
      { to: 0.94, say: 'Seal the lid and nothing enters or leaves. The same iron and oxygen atoms form iron oxide, so the balance reads the same.' }
    ],
    pin: 'A sealed reaction never creates mass. Either air entered the furnace, or the log is wrong.'
  },
  'unit07/q6-stoich': {
    scene: 'furnace-ledger',
    role: 'Direct Clue',
    mystery: 'The foundry log says 40 tons of ore made 50 tons of iron. How do balanced equations predict product mass, and is that log possible?',
    beats: [
      { to: 0.24, say: 'An equation counts molecules, not grams. Two H₂ molecules and one O₂ molecule make two H₂O molecules, and the masses still add to 36.0 g on both sides.' },
      { to: 0.5, say: 'To go from grams of one substance to grams or gas volume of another, convert through moles using molar mass and the equation\'s mole ratio.' },
      { to: 0.72, say: 'Feed two reactants and the reaction stops when the limiting reactant runs out; what remains is excess. Impurities also lower the measured element percent.' },
      { to: 0.94, say: 'Forty tons of ore can give at most 28.0 tons of iron (the theoretical yield), and a real furnace keeps only part of that.' }
    ],
    pin: '40 tons of ore make at most 28 tons; someone added 22 tons of outside iron.'
  },
  'unit07/q7-titrate': {
    scene: 'burette-count',
    role: 'Station Fix',
    mystery: 'The foundry\'s cleaning tank holds an acid of unknown strength. How can we measure its concentration?',
    beats: [
      { to: 0.24, say: 'A burette adds a known base to the acid in measured amounts. Its reading tracks the volume added.' },
      { to: 0.5, say: 'Each mole of OH⁻ neutralizes one mole of H⁺ — so an acid like H₂SO₄ that releases two H⁺ needs twice as much base.' },
      { to: 0.74, say: 'When all the acid has reacted, that is the equivalence point. Where the indicator changes color is the endpoint; a good indicator changes close to the equivalence point.' },
      { to: 0.95, say: 'Dividing the moles of acid neutralized by the acid\'s volume in liters gives its concentration: 0.180 mol/L for the tank.' }
    ],
    pin: 'Titration showed the cleaning tank\'s HCl acid is 0.180 mol/L.'
  },
  'unit07/q8-kinds': {
    scene: 'furnace-log',
    role: 'Station Fix',
    mystery: 'How can we classify the reactions in the foundry\'s furnace logs?',
    beats: [
      { to: 0.24, say: 'Reactions sort by what changes: synthesis joins substances into one, decomposition splits one into several, and combustion burns fuel in oxygen to make CO₂ and H₂O.' },
      { to: 0.5, say: 'In an acid-base reaction, a proton (H⁺) moves from an acid to a base. In a redox reaction, electrons transfer and oxidation numbers change.' },
      { to: 0.78, say: 'In Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂, six electrons move from carbon to iron: iron drops +3 to 0 (reduced) and carbon rises +2 to +4 (oxidized).' },
      { to: 0.97, say: 'One reaction can belong to several kinds at once because each kind tracks a different feature; the ore reaction is redox, leaving pure iron behind.' }
    ],
    pin: 'Reactions sort by joining, splitting, burning, proton transfer, or electron transfer; ore smelting is redox.'
  },
  'unit07/q9-hsab': {
    scene: 'hsab-vat',
    role: 'Station Fix',
    mystery: 'The foundry\'s waste vat holds several metals mixed together. Metals dissolve as ions — what property lets us pull them apart?',
    beats: [
      { to: 0.25, say: 'Hard ions are small and compact with tightly held electron clouds, while soft ions are large with clouds easily pulled out of shape.' },
      { to: 0.5, say: 'In the four test pairs, hard Ca²⁺ paired with hard F⁻ to form a solid, while the mismatched pairs stayed dissolved.' },
      { to: 0.75, say: 'Soft ions like Ag⁺ and Pb²⁺ pair with soft sulfide (S²⁻) — held by attraction plus overlapping clouds — forming dark solids.' },
      { to: 0.95, say: 'That hard-versus-soft guide lets the foundry drop soft lead out of wastewater as PbS while leaving hard magnesium dissolved.' }
    ],
    pin: 'Add sulfide: soft lead (Pb²⁺) drops out as a solid, while hard magnesium (Mg²⁺) stays dissolved.'
  },
  'unit05/q1-flow': {
    scene: 'frost-manifold',
    role: 'Station Fix',
    mystery: 'People live beside a hot volcano, yet their homes are freezing and the pipes are frosted. Why is warmth leaving?',
    beats: [
      { to: 0.34, say: 'Heat always flows from a hotter object to a colder one until both reach the same temperature.' },
      { to: 0.66, say: 'A thermometer measures the surroundings: when a water bath cools down, heat is flowing into the process, making it endothermic.' },
      { to: 0.95, say: 'Just like the cold pack in your cup, an endothermic process inside the Fifth Guild\'s pipe is pulling heat away from the colony shelters.' }
    ],
    pin: 'An endothermic process inside the Fifth Guild\'s pipe is pulling heat away from the shelters.'
  },
  'unit05/q2-calorimetry': {
    scene: 'heat-swap',
    role: 'Direct Clue',
    mystery: 'We found an unmarked metal pipe fitting near the shelters. How can we figure out which metal it is made of just by measuring temperature?',
    beats: [
      { to: 0.3, say: 'Drop a hot copper fitting into cool water, and heat flows from the metal into the water until both reach the same temperature.' },
      { to: 0.64, say: 'The heat lost by the metal equals the heat gained by the water. No energy is created or lost.' },
      { to: 0.86, say: 'Using q = C × ΔT (with C = m × c), the water\'s temperature rise identifies the metal, while melting and boiling absorb heat without raising temperature.' }
    ],
    pin: 'Heat capacity identifies the metal: the pipe fitting\'s specific heat capacity (0.385 J/(g·°C)) matches copper.'
  },
  'unit05/q3-enthalpy': {
    scene: 'fuel-bars',
    role: 'Station Fix',
    mystery: 'A rescue craft can only carry a limited weight of fuel. Which fuel gives the most heat for every gram you load on board?',
    beats: [
      { to: 0.3, say: 'The heat a reaction releases scales directly with the amount reacting: twice the moles, twice the heat.' },
      { to: 0.6, say: 'Per mole, methane releases the most heat of these four fuels and hydrogen releases the least.' },
      { to: 0.85, say: 'Per gram, hydrogen wins by a wide margin. Because one mole of hydrogen weighs only 2 g, every gram packs far more moles.' }
    ],
    pin: 'Hydrogen powers the rescue craft because it releases the most heat per gram.'
  },
  'unit05/q4-bonds': {
    scene: 'bond-ledger',
    role: 'Direct Clue',
    mystery: 'Why do some chemical reactions release heat while others absorb heat when atoms rearrange into new molecules?',
    beats: [
      { to: 0.2, say: 'Breaking a bond always absorbs energy. Pulling H–H apart costs 436 kJ per mole.' },
      { to: 0.4, say: 'Splitting Cl–Cl costs another 242 kJ, bringing the total energy put in to 678 kJ.' },
      { to: 0.78, say: 'Forming two H–Cl bonds releases 862 kJ, giving 184 kJ extra overall. In nitric oxide, new bonds returned less than breaking cost, making it endothermic.' }
    ],
    pin: 'Breaking bonds absorbs energy and forming bonds releases it: HCl releases 184 kJ overall.'
  },
  'unit05/q5-hess': {
    scene: 'two-routes',
    role: 'Direct Clue',
    mystery: 'We need to design chemical steps to warm the community shelters. Can we combine measured reactions to predict a new process?',
    beats: [
      { to: 0.25, say: 'A reaction\'s total enthalpy change depends only on its reactants and products, never the steps in between: this is Hess\'s Law.' },
      { to: 0.5, say: 'Because enthalpy is a state function, you can reverse, duplicate, and add known reactions together to find an unmeasured reaction\'s ΔH.' },
      { to: 0.75, say: 'Whether carbon burns directly to CO₂ or goes through CO in two steps, both routes release the exact same total heat: −393.5 kJ per mole.' }
    ],
    pin: 'By Hess\'s Law, combining measured steps gives the exact total enthalpy (−393.5 kJ/mol).'
  },
  'unit05/q6-entropy': {
    scene: 'spread-count',
    role: 'Station Fix',
    mystery: 'Open a container of gas into an empty room and it fills the whole space, never gathering back. Why?',
    beats: [
      { to: 0.35, say: 'Remove the barrier and the gas spreads across the entire box, even though no force pushes it.' },
      { to: 0.65, say: 'There are 70 ways for 8 particles to split evenly (4 left, 4 right), compared to only 1 way for all 8 to stay on one side — so statistically, spreading out is far more likely.' },
      { to: 0.92, say: 'Entropy tracks how many ways particles and their energy can be arranged. With billions of real-world molecules, the odds of them all gathering back on one side are effectively zero.' }
    ],
    pin: 'Gas spreads out because spread-out arrangements overwhelmingly outnumber crowded ones.'
  },
  'unit05/q7-gibbs': {
    scene: 'seal-crossing',
    role: 'Direct Clue',
    mystery: 'Ice melts on a warm table even though melting absorbs heat, yet water freezes in a freezer. What decides?',
    beats: [
      { to: 0.25, say: 'Two factors compete to decide whether a process happens on its own: heat change (ΔH) and entropy change (ΔS).' },
      { to: 0.5, say: 'Gibbs free energy (ΔG = ΔH − TΔS) combines both. Raising the temperature makes the TΔS term larger until even an endothermic process happens on its own.' },
      { to: 0.75, say: 'Ice melts above 273 K (0 °C) where TΔS overtakes ΔH, and heating limestone (ΔH +178.3 kJ, ΔS +160.2 J/K) starts above 1,113 K.' }
    ],
    pin: 'Gibbs free energy decides spontaneity: limestone decomposes above 1,113 K, where TΔS overtakes ΔH.'
  },
  'unit05/boss-crucible': {
    scene: 'crucible-open',
    role: 'Boss Payoff',
    mystery: 'Ember Reach\'s volcano heat is draining underground. What is using it?',
    beats: [
      { to: 0.25, say: 'Measuring the jacket\'s heat, the coil\'s bond energies, the exchanger\'s Hess steps, the vent\'s entropy, and the seal\'s free energy broke the Crucible\'s grip.' },
      { to: 0.5, say: 'The Crucible split open to reveal the siphon manifold, a giant heat exchanger draining volcano heat away from the shelters.' },
      { to: 0.75, say: 'Below the manifold, a heavy pipe runs straight down into the crust. We logged the underground pipe in the Case File.' }
    ],
    pin: 'The Fifth Guild is draining volcano heat to power an underground siphon manifold.'
  },
  /* ---- Lanternfall (unit02): who dimmed the beacons, and what is the Fifth lighting with a lens no guild lamp can make? ---- */
  'unit02/q1-wave': {
    scene: 'wave-beacon',
    role: 'Station Fix',
    mystery: 'Red and violet beacons flash at the same moment. Does one colour of light reach the ships sooner than the other?',
    beats: [
      { to: 0.25, say: 'Light is a wave, and every wave has a wavelength and a frequency that trade against each other through one fixed speed, 3.00 × 10⁸ metres per second.' },
      { to: 0.5, say: 'What the eye calls colour is a thin slice of the electromagnetic spectrum. A radio mast, an oven and an X-ray tube sit on the same scale, at other wavelengths.' },
      { to: 0.75, say: 'Red and violet cross the same gap in the same time: every colour of light travels at the same speed.' }
    ],
    pin: 'No. Every colour of light travels at the same speed, 3.00 × 10⁸ metres per second.'
  },
  'unit02/q2-photon': {
    scene: 'photon-plate',
    role: 'Direct Clue',
    mystery: 'A bright red lamp shines straight on the solar plate, and the plate makes no power at all. Why does the red light do nothing?',
    beats: [
      { to: 0.25, say: 'Light comes in packets called photons, and each photon\'s energy is set by its frequency. An electron leaves a metal only if one photon carries more than the metal\'s work function.' },
      { to: 0.5, say: 'No number of weaker photons can add up to it. A photon of red carries too little, however many arrive, while one photon of violet is enough.' },
      { to: 0.75, say: 'Energy comes in fixed packets, so electrons can only hold specific energies. Next, let us see why glowing gases shine in sharp colors.' }
    ],
    pin: 'One red photon carries too little energy to free an electron, however many arrive.'
  },
  'unit02/q3-lines': {
    scene: 'line-gas',
    role: 'Direct Clue',
    mystery: 'The tube the Fifth left glows in only a few sharp colours. Which gas is inside it?',
    beats: [
      { to: 0.2, say: 'An atom\'s electrons sit only on certain energy levels, in the ground state or in an excited state. Light is given out or taken in exactly when an electron moves between two levels.' },
      { to: 0.4, say: 'So a glowing gas gives an emission spectrum of a few exact lines that no other gas shares, while a hot solid gives a continuous rainbow.' },
      { to: 0.6, say: 'Every aurora, neon sign and star is read this way: bright lines show which atoms are glowing, and dark lines show which cool atoms sit in front.' },
      { to: 0.8, say: 'This simple ring model only fits hydrogen, because electrons do not travel on fixed tracks. Next we map where an electron actually lives.' }
    ],
    pin: 'The glowing tube\'s spectrum lines match helium.'
  },
  'unit02/q4-cloud': {
    scene: 'cloud-ball',
    role: 'Toolkit',
    beats: [
      { to: 0.25, say: 'An electron has no path. Five hundred shots find it in five hundred places, and together they make a ball, not a ring.' },
      { to: 0.5, say: 'What it has is an orbital, a cloud of probability: round for s, two-lobed for p, four-lobed or ringed for d. Each orbital holds a standing wave that fits its shell.' },
      { to: 0.75, say: 'Every bond is made of these clouds overlapping, and every shape a molecule takes follows from how they point. Next, every electron gets an address.' }
    ]
  },
  'unit02/q5-numbers': {
    scene: 'rack-address',
    role: 'Toolkit',
    beats: [
      { to: 0.25, say: 'Numbers name every box: n for its shell, l for its shape and ml for its orientation.' },
      { to: 0.5, say: 'A box holds two electrons that point opposite ways, and no two electrons in an atom share all four numbers. From that one rule the capacity of every shell follows.' },
      { to: 0.75, say: 'Shell 1 holds 1 orbital (2 electrons), shell 2 holds 4 orbitals (8 electrons), and shell 3 holds 9 orbitals (18 electrons). Those capacities match the lengths of the rows on the periodic table.' }
    ]
  },
  'unit02/q6-filling': {
    scene: 'rack-fill',
    role: 'Toolkit',
    beats: [
      { to: 0.25, say: 'Electrons fill the lowest rows first and spread across a row before pairing, so carbon\'s last two stand alone.' },
      { to: 0.5, say: 'The ladder is ordered by energy and not by shell, so potassium\'s last electron settles in the fourth shell while the third is still not full.' },
      { to: 0.75, say: 'Nearly everything an element does follows from its outer rows, written down in energy order. Next I measure what each electron costs.' }
    ]
  },
  'unit02/q7-pes': {
    scene: 'peak-rows',
    role: 'Direct Clue',
    mystery: 'A grey powder was left at the tower with no label. Which element is it built from?',
    beats: [
      { to: 0.25, say: 'A photoelectron spectrum shows one peak for each electron subshell. Peak height counts how many electrons sit there, and position shows how tightly they are held.' },
      { to: 0.5, say: 'This experiment measures electron shells directly instead of just drawing them, proving those energy levels are real.' },
      { to: 0.75, say: 'The powder from the tower shows peaks of 2, 2, and 4 electrons, which matches oxygen. Next we trace how binding energy changes across the periodic table.' }
    ],
    pin: 'Its spectrum shows 2, 2, and 4 electrons in its shells, matching oxygen.'
  },
  'unit02/q8-trends': {
    scene: 'radii-row',
    role: 'Station Fix',
    mystery: 'The tower\'s last solar plate has cracked and needs a new metal. Which metal gives up its electrons most easily?',
    beats: [
      { to: 0.25, say: 'One rule explains periodic trends: more protons pull harder, greater distance weakens the pull, and inner electrons shield some of the charge.' },
      { to: 0.5, say: 'Across a row, extra protons pull the same shell closer, making atoms smaller. Atomic radius and ionization energy both follow that pull.' },
      { to: 0.75, say: 'Knowing where an element sits on the periodic table lets us pick a metal that gives up electrons easily for the tower\'s solar plate.' }
    ],
    pin: 'A metal with low ionization energy gives up electrons easily to rebuild the plate.'
  },
  'unit02/q9-absorb': {
    scene: 'beam-dim',
    role: 'Direct Clue',
    mystery: 'The coolant should run clear, and it runs blue. What leaked into it, and how much?',
    beats: [
      { to: 0.25, say: 'A solution looks the color of the light it lets through: copper absorbs orange light and leaves blue, its complementary color.' },
      { to: 0.5, say: 'Higher concentration absorbs more light in a straight line, so measuring light lets us measure how much substance is dissolved.' },
      { to: 0.75, say: 'Three known samples set the calibration line, and the coolant sample\'s reading fell right on it. Labs and hospitals measure dissolved substances the same way.' },
      { to: 0.9, say: 'Only the Lantern-Eater remains on the ice, feeding on the light from the glacier towers.' }
    ],
    pin: 'The blue tint is copper, and its light absorbance tells us how much leaked.'
  },
  'unit02/q10-wavefunctions': {
    scene: 'cloud-ball',
    role: 'Toolkit',
    beats: [
      { to: 0.3, say: 'An orbital comes from a wavefunction, ψ, with + crests and − troughs.' },
      { to: 0.65, say: 'The chance of finding the electron goes as ψ², so + and − lobes hold dots alike, while zero crossings leave empty nodes.' },
      { to: 0.9, say: 'Radial nodes are empty shells and angular nodes are empty planes; every orbital in shell n has n − 1 nodes in all.' }
    ]
  },
  'unit02/boss-eater': {
    scene: 'eater-lens',
    role: 'Boss Payoff',
    mystery: 'Fifth Guild ships keep reaching Lanternfall without anyone seeing them. How?',
    beats: [
      { to: 0.25, say: 'Testing its light waves, photons, and spectra broke the Lantern-Eater\'s hold on the glacier towers.' },
      { to: 0.5, say: 'The Lantern-Eater collapsed into ice, leaving behind a fluorite lens built for invisible ultraviolet light.' },
      { to: 0.75, say: 'No regular lighthouse uses light that short. The Fifth Guild installed these lenses so their ships could fly unseen.' },
      { to: 0.9, say: 'The UV lens goes into the Case File. Next, we head to Ligar\'s rock quarry.' }
    ],
    pin: 'The recovered lens works in ultraviolet light, letting Fifth Guild ships fly unseen.'
  },

  /* ---- Mirrowen: what is the canal ice made of, and why does it stay solid when the water beside it does not? ---- */
  'unit06/q2-grip': {
    scene: 'grip-bars',
    role: 'Direct Clue',
    mystery: 'Water molecules are light, yet the canal ice grips like stone. What holds water molecules to each other so hard?',
    beats: [
      { to: 0.3, say: 'Larger electron clouds attract their neighbors more strongly: helium needs 0.08 kJ per mole to separate, while xenon needs 12.6 kJ.' },
      { to: 0.64, say: 'Water weighs 18 g per mole and hydrogen sulfide weighs 34 g, yet water needs 40.7 kJ to separate versus 18.7 kJ. Hydrogen bonds outweigh mass.' },
      { to: 0.9, say: 'Even so, breaking every O-H bond inside a mole of water takes 926 kJ. Forces between molecules are much weaker than bonds inside them.' }
    ],
    pin: 'Strong hydrogen bonds between water molecules hold the ice together.'
  },
  'unit06/q1-states': {
    scene: 'states-three',
    role: 'Direct Clue',
    mystery: 'Someone poured something on the canal, and it froze hard overnight. Is the ice still water, or something new?',
    beats: [
      { to: 0.28, say: 'A solid keeps its shape, a liquid keeps its volume and a gas fills its jar. Each jar holds the same eight molecules of water.' },
      { to: 0.62, say: 'Carry the jar from solid to liquid to gas and the analyzer names H₂O the whole way. The molecules only rearrange, so no bond breaks.' },
      { to: 0.9, say: 'A litre of liquid water weighs about 1,700 times a litre of steam, so a gas is mostly empty space. Melting and boiling overcome the intermolecular forces between molecules, never the bonds inside them.' }
    ],
    pin: 'It is still water—the molecules stayed whole and were only locked in place.'
  },
  'unit06/q3-boil': {
    scene: 'boil-flask',
    role: 'Station Fix',
    mystery: 'Why does canal water evaporate even when it is far below 100 °C?',
    beats: [
      { to: 0.32, say: 'In a sealed flask molecules leave the liquid and come back to it. The pressure reading stops rising when the leaving and returning rates match, and that steady pressure is the vapor pressure.' },
      { to: 0.66, say: 'Warming the liquid sends more molecules into the vapor, so its vapor pressure climbs: water reaches 3.2 kPa at 25 °C and 47.3 kPa at 80 °C.' },
      { to: 0.92, say: 'A liquid boils when its vapor pressure reaches the pressure outside it. Water does that at 100 °C at sea level, and at 88 °C where the outside pressure is 65 kPa.' }
    ],
    pin: 'Water leaves the surface at any temperature; boiling is only when vapor pressure reaches outside pressure.'
  },
  'unit06/q4-solids': {
    scene: 'solid-order',
    role: 'Direct Clue',
    mystery: 'The canal barrier looks like ice. How can you tell ice from glass or quartz?',
    beats: [
      { to: 0.32, say: 'Iodine, naphthalene, and ice all melt below 115 °C while their molecules stay intact. Only the forces between molecules give way.' },
      { to: 0.7, say: 'Quartz stayed solid up to 1713 °C and then melted all at once. Fused silica glass, made of the same atoms, softened gradually from 1040 to 1585 °C.' },
      { to: 0.9, say: 'In a crystal every bond sits in a repeating pattern and breaks together. In glass the arrangement varies, so bonds give way gradually.' }
    ],
    pin: 'A crystal melts at one sharp temperature, whereas glass softens over a range.'
  },
  'unit06/q5-crossing': {
    scene: 'crossing-curve',
    role: 'Station Fix',
    mystery: 'The canal barrier has to be melted. Where does the heat go while it melts?',
    beats: [
      { to: 0.3, say: 'A heating curve climbs as heat warms the ice, then stays flat at 0 °C while 6.01 kJ per mole goes into melting.' },
      { to: 0.62, say: 'That heat frees molecules from their fixed crystal spots, and boiling a mole of liquid water takes 40.65 kJ.' },
      { to: 0.9, say: 'Cool it back down and steam condenses and freezes, releasing the exact same 54.9 kJ of heat.' }
    ],
    pin: 'Melting uses heat to free the molecules, even while the temperature holds steady.'
  },
  'unit06/q6-solution': {
    scene: 'solution-drop',
    role: 'Direct Clue',
    mystery: 'The drums on the quay are empty, and their chemical is in the canal water. Did it dissolve, and how much is in each litre?',
    beats: [
      { to: 0.33, say: 'Dissolved salt does not vanish. Its ions leave the crystal one by one and spread through the water, each surrounded by water molecules.' },
      { to: 0.66, say: 'Four units of sodium chloride split into 8 ions, four of calcium chloride into 12 ions, and four of sugar stay 4 molecules. Molarity counts formula units, not split ions.' },
      { to: 0.94, say: 'Adding water leaves the moles unchanged and spreads them over more liters: 25 mL of 2.00 M stock diluted to 100 mL becomes 0.500 M.' }
    ],
    pin: 'It dissolved into ions, and we measured its molarity (0.250 M) in moles per litre.'
  },
  'unit06/q7-separate': {
    scene: 'pull-apart',
    role: 'Station Fix',
    mystery: 'A chemical is dissolved in the canal water. Can we get it back out, and how?',
    beats: [
      { to: 0.34, say: 'Filter paper traps solid chunks, but dissolved salt passes right through with the water. Filtering cannot remove a dissolved chemical.' },
      { to: 0.66, say: 'In paper chromatography, each dye climbs according to how strongly it clings to the paper versus the solvent, so different solvents separate dyes in opposite orders.' },
      { to: 0.9, say: 'In distillation, the liquid with the lowest boiling point boils off first: acetone, then ethanol, then water. Boiling the water away leaves the dissolved chemical behind.' }
    ],
    pin: 'Filtering fails, but boiling the water off leaves the dissolved chemical behind in the flask.'
  },
  'unit06/boss-undertow': {
    scene: 'undertow-finale',
    role: 'Boss Payoff',
    mystery: 'Something keeps Mirrowen\'s canals in its grip. Where did the chemical behind it come from?',
    beats: [
      { to: 0.3, say: 'Testing the ice\'s states, intermolecular forces, boiling points, and solutions broke the Undertow\'s hold on the canals.' },
      { to: 0.6, say: 'The Undertow slumped back into grey brine along the docks, freeing the trapped supply boats.' },
      { to: 0.85, say: 'The freezing chemical left behind does not occur naturally. Someone built a real chemical factory to make it.' }
    ],
    pin: 'The freezing chemical was made in a lab. The Fifth Guild has a real factory.'
  },
};

/** The question a quest opens on (`mystery`), or ''. */
export const mysteryFor = key => QUEST_STORY[key]?.mystery || '';

/** The story animation a quest ends on, or null. */
export const storyFor = key => QUEST_STORY[key] || null;

/** The session flag that records an animation as seen. It gates nothing: a quest ends on it every time. */
export const storyFlag = key => `storyAnim:${key}`;

/** The lines Vess says over a quest's scene, in order, each with the scene time its picture ends on. */
export function storyLines(story) {
  const base = story.beats.map((b, idx, arr) => ({
    say: b.say,
    to: (!story.pin && idx === arr.length - 1) ? 1 : b.to
  }));
  if (story.pin) base.push({ say: story.pin, to: 1, pin: true, ask: story.mystery || '' });
  return base;
}
