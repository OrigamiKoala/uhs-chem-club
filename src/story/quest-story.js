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
    mystery: 'Two fuel lines burn the same fuel, but one tower just flared scorching hot. What is different about that one?',
    beats: [
      { to: 0.35, say: 'Both vessels ended at 0.40 mol/L of product, yet Vessel 2 climbed more steeply and finished sooner.' },
      { to: 0.70, say: 'Every run starts steepest and flattens as reactant is used up; for 2 A → B, A falls twice as fast as B rises.' },
      { to: 0.95, say: 'Higher concentration, higher temperature, and powdered solids all gave steeper lines; a larger vessel slowed the rate.' }
    ],
    pin: 'The spiked line runs the same reaction, only much faster.'
  },
  'unit11/q2-law': {
    scene: 'rate-watch',
    role: 'Direct Clue',
    mystery: 'Three feeds pour into the overheating tank. Which of them actually change how fast it burns?',
    beats: [
      { to: 0.35, say: 'Doubling A doubled the initial rate, doubling B made it four times as large, and doubling C changed nothing.' },
      { to: 0.70, say: 'Those measured powers give rate = k[A][B]², showing that stoichiometric coefficients never determine the rate law.' },
      { to: 0.95, say: 'With k = 2.0 from runs 1 and 2, the rate law predicted 0.036 mol/(L·s) for run 3.' }
    ],
    pin: 'Only two of the three feeds change the rate. The third makes no difference.'
  },
  'unit11/q3-time': {
    scene: 'rate-watch',
    role: 'Direct Clue',
    mystery: 'The spiked fuel breaks down as it sits. Does it take the same time to lose each half?',
    beats: [
      { to: 0.35, say: 'In the first-order tank, the first halving took 20 s and the second halving also took 20 s.' },
      { to: 0.70, say: 'Replotting the readings as ln[A] against time put every point on the straightedge, while 1/[A] straightened second-order data.' },
      { to: 0.95, say: 'From t½ = 15 s, the relation k = 0.693 ÷ t½ gave k = 0.0462 each second.' }
    ],
    pin: 'Yes. It loses half in equal times, so its breakdown is first order.'
  },
  'unit11/q4-collide': {
    scene: 'rate-watch',
    role: 'Toolkit',
    beats: [
      { to: 0.35, say: 'Particles only react when they collide with at least the activation energy and with their reactive ends aligned.' },
      { to: 0.70, say: 'Raising temperature leaves the activation energy barrier fixed, yet pushes a larger fraction of particles past it.' },
      { to: 0.95, say: 'The transition state sits at the energy peak, and the lower barrier sets which competing path forms product faster.' }
    ]
  },
  'unit11/q5-steps': {
    scene: 'rate-watch',
    role: 'Direct Clue',
    mystery: 'The fuel burns in several steps, one after another. Which step decides how fast the whole burn goes?',
    beats: [
      { to: 0.35, say: 'Elementary steps add to the overall equation, with intermediates like NO3 cancelling out between steps.' },
      { to: 0.70, say: 'The slowest step sets the pace, and only a slow step matching the measured rate law fits experiment.' },
      { to: 0.95, say: 'On a two-step energy profile, the highest climb marks the rate-determining step and the valley holds the intermediate.' }
    ],
    pin: 'The slowest step sets the rate of the whole reaction, and so of the spike.'
  },
  'unit11/q6-shortcut': {
    scene: 'rate-watch',
    role: 'Direct Clue',
    mystery: 'Yellow dust in the vents makes the fuel burn faster, and the dust never gets used up. What is it doing?',
    beats: [
      { to: 0.35, say: 'A catalyst speeds up a reaction by opening an alternate pathway with a lower activation energy.' },
      { to: 0.70, say: 'All six catalyst particles remained at the end, and the reactant and product energies did not move.' },
      { to: 0.95, say: 'A catalyst is consumed first and regenerated later, and solid catalysts work at their exposed surface.' }
    ],
    pin: 'The dust is a catalyst: it lowers the energy hill and is never used up.'
  },
  'unit11/boss-flare': {
    scene: 'rate-watch',
    role: 'Boss Payoff',
    mystery: 'Someone has been tampering with Quicklight\'s fuel from the start. Who leads the Fifth Guild?',
    beats: [
      { to: 0.35, say: 'Between 5 s and 15 s the tower fell 0.30 mol/L at 0.030 mol/(L·s), following rate = k[A]²[B].' },
      { to: 0.70, say: 'Four 12 s half-lives left 0.0625 of the peroxide core, behind an 80 kJ/mol ignition barrier.' },
      { to: 0.95, say: 'The pre-equilibrium mechanism 2 X ⇌ X₂ followed by slow X₂ + Y → Z matched rate = k[X]²[Y] and shut the flare down.' }
    ],
    pin: 'Their leader is The Catalyst. The Fifth are the crews the Four Guilds left behind.'
  },
  /* ---- Brinewire: the Fifth cut the marsh's power; what do its cells actually do? ---- */
  'unit10/q5-load': {
    scene: 'load-down',
    role: 'Station Fix',
    mystery: 'The marsh\'s backup batteries lose voltage the longer they run. Why do they fade?',
    beats: [
      { to: 0.26, say: 'Under load, the tin and lead cell dropped from 0.012 V to 0 V as tin ions built up and lead ions ran low.' },
      { to: 0.5, say: 'It stopped with 72 tin ions and 28 lead ions still left. A dead battery has reached balance, even before running empty.' },
      { to: 0.74, say: 'Tin over lead was 2.6, matching this cell\'s K of 2.5. As Q rises toward K, the cell\'s voltage falls to 0 V.' },
      { to: 0.94, say: 'Zinc at 1.0 M with copper at 0.0010 M has Q = 1000 and reads 1.01 V. Copper at 0.010 M against 1.0 M has Q = 0.01 and reads 0.059 V.' }
    ],
    pin: 'As batteries run, their ion concentrations shift toward balance, dropping the voltage.'
  },
  'unit10/q6-electrolysis': {
    scene: 'electrolysis-push',
    role: 'Direct Clue',
    mystery: 'The Fifth is running cables from the power line into a pool. What is that current making in there?',
    beats: [
      { to: 0.24, say: 'Pushed at 1.50 V against its own 1.10 V, the zinc-copper cell ran backwards and added 4.1 mg to the zinc strip. Electrolysis drives a cell in reverse.' },
      { to: 0.48, say: 'In molten sodium chloride, 6 sodium ions took 6 electrons at the cathode to form sodium, while chloride ions gave electrons at the anode to form chlorine.' },
      { to: 0.72, say: 'One ampere for 30 s passed 30 C and 2 A for 10 s passed 20 C, while 0.5 A for 100 s passed 50 C and plated the most silver.' },
      { to: 0.94, say: '2.00 A for 1800 s passed 3600 C, or 0.0373 mol of electrons. At two electrons per copper atom, Faraday\'s law gives 1.19 g of copper.' }
    ],
    pin: 'The stolen electricity is plating pure copper out of the marsh pools.'
  },
  'unit10/q2-activity': {
    scene: 'dip-order',
    role: 'Direct Clue',
    mystery: 'Two different metals are bolted to every pylon. Which one gives up its electrons?',
    beats: [
      { to: 0.26, say: 'Both zinc and copper were coated in the silver solution, only zinc in the copper solution, and neither in the zinc solution. A coating means one metal took the place of another: displacement.' },
      { to: 0.52, say: 'Zinc coated in 3 of the other solutions, iron in 2, lead in 1 and copper in none. That order, most readily giving to least, is the activity series.' },
      { to: 0.76, say: 'Magnesium, zinc and iron bubbled in acid and copper and silver did not, so hydrogen sits after iron. A copper strip in zinc stayed clean: the swap runs one way only.' },
      { to: 0.94, say: 'Nails wired to zinc or magnesium had no blue spots, and nails wired to copper or tin had 5. The more active partner gives its electrons first, so it is the one used up.' }
    ],
    pin: 'The more active metal gives up its electrons first.'
  },
  'unit10/q1-halves': {
    scene: 'half-join',
    role: 'Direct Clue',
    mystery: 'The pylon the Fifth tampered with is rotting where two metals are bolted together. What is passing between the metals?',
    beats: [
      { to: 0.26, say: 'In the zinc and copper beaker, zinc went from 0 to +2 and copper from +2 to 0. An atom\'s oxidation number counts the electrons it has lost or gained.' },
      { to: 0.5, say: 'Written as half-reactions, zinc loses 2 electrons in oxidation and copper gains 2 in reduction. The electrons lost are the electrons gained, so none vanish.' },
      { to: 0.76, say: 'Aluminium gives 3 electrons and copper takes 2, so the halves are written 2 and 3 times: 6 electrons given and 6 taken.' },
      { to: 0.94, say: 'Permanganate in acid takes 5 electrons from 5 iron(II) ions, with charge 17 on each side. A redox reaction is one where some oxidation number changes.' }
    ],
    pin: 'Electrons are moving between the two metals, and that is what corrodes the pylons.'
  },
  'unit10/q3-galvanic': {
    scene: 'cell-open',
    role: 'Station Fix',
    mystery: 'The Fifth cut the salt bridges, and every marsh battery died at once. What does a battery need the bridge for?',
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
      { to: 0.26, say: 'Against one reference, magnesium read −2.37 V, zinc −0.76 V, copper +0.34 V and silver +0.80 V. Each reading is that metal\'s E°.' },
      { to: 0.52, say: 'A cell takes its voltage from the gap between two readings: silver minus magnesium is 3.17 V. A positive gap lights the lamp.' },
      { to: 0.76, say: 'Written twice over, the zinc and copper cell moved twice the electrons and gave out twice the energy, yet the voltmeter still read 1.10 V.' },
      { to: 0.94, say: 'The energy follows ΔG° = −nFE°, and log K = nE° ÷ 0.0592. For zinc with silver, n = 2 and E° = 1.56 V.' }
    ],
    pin: 'The voltage depends on the metal pair, so we can pick the strongest cells for Brinewire.'
  },
  /* ---- Brinewire: the Clamp's five cells, read the way every cell on the road was ---- */
  'unit10/boss-clamp': {
    scene: 'clamp-open',
    role: 'Boss Payoff',
    mystery: 'The Fifth has been plating copper out of Brinewire\'s pools. How much has it taken?',
    beats: [
      { to: 0.2, say: 'Iron coated in 3 of the other 3 solutions, nickel in 2, tin in 1 and silver in none. The more solutions a strip coats in, the more readily it gives electrons.' },
      { to: 0.4, say: 'The ammeter read 1.44 A and the electrons moved toward the silver beaker, so they left through magnesium. Magnesium is the anode.' },
      { to: 0.6, say: 'Iron read −0.44 V and silver +0.80 V, and the gap between them is 1.24 V. A voltage is energy for each electron, so balancing the equation does not change it.' },
      { to: 0.78, say: 'Beakers of 0.010 M and 1.0 M zinc read 0.059 V, and the electrons left the bar in the dilute beaker. The dilute side is the anode.' },
      { to: 0.94, say: '1.50 A for 1200 s passed 1800 C, which is 0.0187 mol of electrons, and two electrons plate each zinc atom. That plated 0.61 g of zinc.' }
    ],
    pin: 'Tons of pure copper are gone. The Fifth is wiring something huge.'
  },
  /* ---- Verdigris: the Fifth calls the marsh water acid; what kind, and how much? ---- */
  'unit09/q2-scale': {
    scene: 'scale',
    role: 'Direct Clue',
    mystery: 'The acid meters on the marsh tanks read numbers only a few steps apart. How much more acidic is a tank one step lower?',
    beats: [
      { to: 0.26, say: 'Each tenfold dilution of hydrochloric acid raised the pH by 1: 1.00, 2.00, 3.00. Because pH is a log scale, one step is a factor of ten.' },
      { to: 0.52, say: 'On sodium hydroxide, pOH counts hydroxide the way pH counts hydronium. At 25 °C the two always add up to 14.00.' },
      { to: 0.78, say: 'Diluted repeatedly, hydrochloric acid read 6.00, 6.79, 6.98, and 7.00. Water\'s own hydronium ions stop the pH from rising past 7.' },
      { to: 0.94, say: 'Water at 50 °C reads 6.63 yet still holds equal H₃O⁺ and OH⁻. Neutral means equal amounts of both ions, which equals pH 7 only at 25 °C.' }
    ],
    pin: 'Each pH step is a tenfold change in acidity.'
  },
  'unit09/q1-handover': {
    scene: 'handover',
    role: 'Direct Clue',
    mystery: 'The runoff from the Fifth\'s plant is eating through the fort\'s pipes. What is it doing to the water it reaches?',
    beats: [
      { to: 0.26, say: 'When HCl meets water, its hydrogen leaves as a proton and joins a water molecule, forming hydronium. A proton donor like HCl is a Brønsted-Lowry acid.' },
      { to: 0.52, say: 'Ammonia has no OH group, yet it took a proton from water in 3 of 8 cells. A proton acceptor is a Brønsted-Lowry base.' },
      { to: 0.78, say: 'An acid and what it leaves behind differ by one proton, forming a conjugate pair. Water acts as both acid and base, so it is amphoteric.' },
      { to: 0.94, say: 'Even pure water forms a few ions, 1.0 × 10⁻⁷ mol/L of each. Multiplied together, they give Kw = 1.0 × 10⁻¹⁴ at 25 °C.' }
    ],
    pin: 'The runoff donates protons to the water: it is acid waste.'
  },
  'unit09/q8-capacity': {
    scene: 'capacity-limit',
    role: 'Station Fix',
    mystery: 'The fort\'s water is protected for now. How much more acid can it take before the protection fails?',
    beats: [
      { to: 0.26, say: 'At pH 3 the strip read 98 acetic acid to 2 acetate, and at pH 6 it read 5 to 95. An acid is mostly protonated below its pKa and mostly deprotonated above it.' },
      { to: 0.5, say: 'The same pour moved the 0.010 M buffer from 4.75 to 4.27 and the 0.10 M buffer from 4.74 to 4.70. Buffer capacity grows with the amount of each member.' },
      { to: 0.76, say: 'Flask 1 held 40 spheres of acetate and each pour used 5. After 8 pours 2 were left and the pH had fallen from 4.75 to 3.05.' },
      { to: 0.94, say: 'Two pours of acid dissolved 10 spheres of magnesium hydroxide, because the acid takes up its hydroxide, and none of the silver chloride. A basic anion makes a salt more soluble as the pH falls.' }
    ],
    pin: 'We measured the buffer\'s capacity, so we know how much runoff the intake can take.'
  },
  'unit09/q7-buffer': {
    scene: 'buffer-catch',
    role: 'Station Fix',
    mystery: 'Acid from the marsh keeps splashing into the fort\'s drinking water. What can we add to keep the water steady?',
    beats: [
      { to: 0.28, say: 'The same pour of acid took the water from 7.00 to 2.04 and the mixture only from 4.74 to 4.66. The mixture is a buffer.' },
      { to: 0.52, say: 'In the buffer each sphere of acid was caught by an acetate. Acetate fell from 100 spheres to 90 and acetic acid rose from 100 to 110.' },
      { to: 0.76, say: 'Base is caught the other way: acetic acid fell from 100 to 90 and acetate rose to 110, so the pH rose only from 4.74 to 4.83.' },
      { to: 0.94, say: 'The pH is the pKa plus the log of acetate over acetic acid. Acetate to acetic acid of 100 to 100 reads 4.74, 150 to 50 reads 5.22, and 100 to 10 reads 5.74.' }
    ],
    pin: 'A weak acid with its conjugate base holds the intake\'s pH steady against acid spikes.'
  },
  'unit09/q3-weak': {
    scene: 'weak-windows',
    role: 'Direct Clue',
    mystery: 'Two waste tanks hold the same amount of acid, yet one eats through steel and the other barely stains it. Why?',
    beats: [
      { to: 0.26, say: 'At the same concentration, 0.10 M, hydrochloric acid donated every proton while acetic acid donated only a few: pH 1.00 versus 2.88.' },
      { to: 0.54, say: 'Diluting acetic acid causes a larger fraction of it to ionize: 3 of 200 units at 0.10 M, 8 at 0.010 M, and 25 at 0.0010 M.' },
      { to: 0.76, say: 'H₃O⁺ times CH₃COO⁻ divided by CH₃COOH equals the same constant Ka in every flask, regardless of concentration.' },
      { to: 0.94, say: 'For any acid and its partner base, Ka times Kb equals 1.0 × 10⁻¹⁴, so a larger Ka always means a smaller Kb.' }
    ],
    pin: 'The harsh tank holds a strong acid that splits completely; the weak acid barely splits.'
  },
  'unit09/q6-titrate': {
    scene: 'titration-reads',
    role: 'Station Fix',
    mystery: 'The worst waste tank must be neutralized exactly. How much base does it take?',
    beats: [
      { to: 0.28, say: 'Poured into 25.0 mL of hydrochloric acid, the base moved the pH slowly, then at 25.0 mL it leapt through 7.00. That steep rise is the equivalence point.' },
      { to: 0.54, say: 'Acetic acid took the same 25.0 mL of base, yet it read 8.72 there while hydrochloric acid read 7.00. The equivalence point depends on the acid.' },
      { to: 0.78, say: 'Half way to each equivalence point the pH matched the acid\'s pKa: 4.75 for acetic acid and 3.75 for formic acid. That is the half-equivalence point.' },
      { to: 0.94, say: 'Sulfurous acid rose steeply twice, at 10.0 mL and 20.0 mL. A polyprotic acid gives up its protons one step at a time.' }
    ],
    pin: 'The pH curve pinpointed the exact neutralization point for the worst waste tank.'
  },
  'unit09/q4-structure': {
    scene: 'race-pairs',
    role: 'Toolkit',
    beats: [
      { to: 0.28, say: 'Raced against chloride, HF kept all 100 protons, while HCl gave all 100 to fluoride. Fluorine pulls hardest on electrons, yet HF is the weaker acid.' },
      { to: 0.54, say: 'HBr gave 96 of 100 protons to chloride, and HCl gave only 4 to bromide. Down a group the bond is longer and the acid stronger.' },
      { to: 0.78, say: 'Each extra oxygen on chlorine pulls charge toward itself, the inductive effect, so the leftover base holds its charge better and the acid is stronger.' },
      { to: 0.94, say: 'Resonance spreads the charge of acetate over two oxygens. Acetic acid gave up its protons to ethoxide; ethanol could not return the favour.' }
    ]
  },
  'unit09/q5-salts': {
    scene: 'salt-reads',
    role: 'Station Fix',
    mystery: 'The worst waste tank has been neutralized. Is its water safe now?',
    beats: [
      { to: 0.3, say: 'Acid and base used up exactly read 7.00 only when both were strong. Acetic acid with sodium hydroxide read 8.72, and ammonia with hydrochloric acid read 5.28.' },
      { to: 0.62, say: 'Sodium chloride read 7.00, sodium fluoride 8.09 and ammonium chloride 5.13. The ion of a weak parent reacts with water; the ions of strong parents do not.' },
      { to: 0.94, say: 'When one reagent is left over, it decides the pH. After 20.0 mL of base met 30.0 mL of acid, 33 of 100 acid units were left and the flask read 1.70.' }
    ],
    pin: 'Not always: neutralizing it can still leave an acidic or basic salt behind.'
  },
  /* ---- Verdigris: the Fifth called the marsh water acid and measured nothing ---- */
  'unit09/boss-leach': {
    scene: 'leach-open',
    role: 'Boss Payoff',
    mystery: 'The Fifth\'s acid runoff pours out at a huge rate. What kind of work makes that much acid?',
    beats: [
      { to: 0.25, say: 'Warm water read 6.51 and held equal H₃O⁺ and OH⁻, so it was neutral. The base that read 7.00 held far more OH⁻ than H₃O⁺.' },
      { to: 0.5, say: 'Formic acid read 2.54, acetic acid 2.88 and hydrofluoric acid 3.26. The pH followed the H₃O⁺ each flask held, not the share of its acid that had let go.' },
      { to: 0.76, say: 'Ammonia used up 25.0 mL of acid at a pH of 5.28. Methyl red changed within that volume, and the other dyes did not.' },
      { to: 0.94, say: '100 acetic acid spheres with 227 of acetate read 5.10. A pH comes from a ratio you can build.' }
    ],
    pin: 'The runoff matches heavy ore washing, far beyond ordinary mining.'
  },
  /* ---- Teeter: is a pan the Fifth calls finished really finished? ---- */
  'unit08/boss-tipper': {
    scene: 'tipper-open',
    role: 'Boss Payoff',
    mystery: 'Teeter\'s salt ponds are supposed to be abandoned, yet they never stop running. What are they really?',
    beats: [
      { to: 0.25, say: 'The Tipper\'s balance beam shifted with every test, tilting according to how the current ratio Q compared to K.' },
      { to: 0.5, say: 'As the mixture settled, the beam leveled off. Equilibrium is reached when Q equals K, even when the two sides hold different amounts.' },
      { to: 0.76, say: 'Behind the machine sits the Fifth Guild\'s final pond. Started from A alone or from B alone, it settles to the exact same ratio.' },
      { to: 0.94, say: 'Its particles are still reacting in both directions. The Fifth Guild marked the pond closed, but it is still running in balance.' }
    ],
    pin: 'The abandoned salt ponds are actually a hidden Fifth Guild chemical plant.'
  },
  'unit08/q4-properties': {
    scene: 'k-rewrite',
    role: 'Toolkit',
    beats: [
      { to: 0.3, say: 'Flip a reaction around and the same mixture gives 1 over the old K. The constant depends on how the equation is written.' },
      { to: 0.58, say: 'Double every coefficient in the equation and K gets squared, because every concentration in the ratio is raised to the power of two.' },
      { to: 0.92, say: 'When two reactions add up to a third, the shared intermediate cancels out and the overall K equals the product of both constants.' }
    ]
  },
  'unit08/q5-ice': {
    scene: 'ice-bars',
    role: 'Direct Clue',
    mystery: 'Once a pond settles, how much product does it hold?',
    beats: [
      { to: 0.32, say: 'A reactant drops by x and a product rises by x times its coefficient, so HI rises twice as far as H₂ falls.' },
      { to: 0.64, say: 'With a small K, very little reactant turns into product. K is a ratio of equilibrium amounts, not a fixed percentage.' },
      { to: 0.94, say: 'Starting from a tiny amount uses up a much larger share of reactant, so the shortcut fails and you need the quadratic formula.' }
    ],
    pin: 'Tracking initial, change, and equilibrium amounts shows how much product each pond holds.'
  },
  'unit08/q1-both': {
    scene: 'pan-both-ways',
    role: 'Direct Clue',
    mystery: 'This pond is marked dead and nothing in it moves, yet someone came to check it. Is anything still happening in there?',
    beats: [
      { to: 0.3, say: 'Start a pan with only A and the amounts level off with some A still left. The flat graph looks like the reaction stopped.' },
      { to: 0.66, say: 'Tag a few particles and they keep switching between A and B at equal rates. That steady two-way traffic is dynamic equilibrium.' },
      { to: 0.9, say: 'Start from B alone and the pan settles at the exact same amounts, because a reversible reaction can reach balance from either side.' }
    ],
    pin: 'Yes. The pond is still reacting forward and backward at equal rates.'
  },
  'unit08/q6-lean': {
    scene: 'lean-push',
    role: 'Direct Clue',
    mystery: 'Every pond on the flats has stopped making salt except the one with the pump. Why does that one keep going?',
    beats: [
      { to: 0.3, say: 'Add H₂ to a settled vessel and Q drops below K, so the reaction uses up N₂ and makes more product until Q returns to K.' },
      { to: 0.52, say: 'Squeeze the vessel and Q drops below K again, shifting the reaction to make more NH₃ and fewer total gas molecules.' },
      { to: 0.72, say: 'Add inert argon and total pressure rises, but the reacting gases\' partial pressures stay the same, so Q stays at K.' },
      { to: 0.92, say: 'Heat the vessel and K itself drops. Among all these stresses, only changing temperature changes the value of K.' }
    ],
    pin: 'The drain pump keeps removing product, forcing the pond to keep making more.'
  },
  'unit08/q2-k': {
    scene: 'ratio-holds',
    role: 'Direct Clue',
    mystery: 'Three ponds started with different amounts. Where does each one end up?',
    beats: [
      { to: 0.33, say: 'Three pans of A and B started with different amounts and finished with different amounts, yet the ratio B over A matched on all three.' },
      { to: 0.68, say: 'When H₂ and I₂ form 2 HI, the 2 becomes an exponent, so HI squared divided by H₂ times I₂ matches on every pan.' },
      { to: 0.92, say: 'That fixed ratio is K. A large K means mostly products at balance, and a small K means mostly reactants.' }
    ],
    pin: 'Every pond settles to the same product-to-reactant ratio, K.'
  },
  'unit08/q3-q': {
    scene: 'needle-to-k',
    role: 'Direct Clue',
    mystery: 'A fresh mix has just been poured into a tank. Which way will it react?',
    beats: [
      { to: 0.33, say: 'A mixture with too much B has a current ratio Q above K, so it reacts backward to make A until Q drops to K.' },
      { to: 0.66, say: 'A mixture with equal amounts has Q below K, so it reacts forward to make B. The ratio, not which pile is bigger, sets the direction.' },
      { to: 0.92, say: 'When Q already equals K, nothing shifts. Below K a reaction makes products; above K it makes reactants.' }
    ],
    pin: 'Comparing the current ratio Q to K shows which way the mix will react.'
  },
  'unit08/q8-free': {
    scene: 'free-k',
    role: 'Toolkit',
    beats: [
      { to: 0.26, say: 'Settle three pans and the lower the ΔG°, the more product each holds. Even the pan with a positive ΔG° holds some product.' },
      { to: 0.52, say: 'Product held against ΔG° is one smooth curve. At ΔG° = 0 the pan holds equal amounts and K is 1; below zero, K is above 1.' },
      { to: 0.76, say: 'Warm a pan and ΔG° = ΔH° − TΔS° moves along a line, taking K with it. For a reaction that takes in heat, K rises as it warms.' },
      { to: 0.92, say: 'Pair a reaction that cannot run alone with one that can, and their ΔG° values add. Here +13.8 and −30.5 leave −16.7 kJ/mol, so the pair runs.' }
    ]
  },
  'unit08/q7-dissolve': {
    scene: 'solubility-trade',
    role: 'Station Fix',
    mystery: 'Salt keeps crusting inside the pond pipes. Can we make it come out of the water before it gets there?',
    beats: [
      { to: 0.26, say: 'Add solid to water and the meters rise, until one more scoop changes nothing. The water is saturated, and the extra solid lies on the floor.' },
      { to: 0.5, say: 'Even then, units keep leaving the solid and coming back, at about the same rate. That balance is why the Ksp, a product of ion concentrations, stays fixed.' },
      { to: 0.76, say: 'Put the same ion in the water first and the solid gives up less. AgCl dissolves 1.3e−5 mol/L in water and 1.8e−9 mol/L with 0.10 mol/L chloride already there.' },
      { to: 0.94, say: 'Ksp alone does not rank salts. Ag₂CrO₄ has the smaller Ksp and still holds more dissolved, 6.5e−5 mol/L against 1.3e−5.' }
    ],
    pin: 'Adding a shared ion makes the salt come out of solution before it reaches the pipes.'
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
      { to: 0.2, say: 'Two atoms bond when being together lowers their energy: each nucleus attracts the other atom\'s electrons.' },
      { to: 0.4, say: 'When electronegativities differ greatly, one atom takes electrons and the ions attract in an ionic bond. When they are close, atoms share pairs in a covalent bond.' },
      { to: 0.6, say: 'Each atom loses, gains, or shares a fixed number of electrons, which is why every compound has a fixed formula.' },
      { to: 0.8, say: 'The rubble around the tunnel mouth mixes both bond types. Next we test how each solid handles force, heat, and electricity.' }
    ],
    pin: 'The rubble mixes ionic and covalent bonds, so its pieces hold together differently.'
  },
  'unit03/q2-lattice': {
    scene: 'liner-heat',
    role: 'Station Fix',
    mystery: 'The tunnel lining must stay solid in great heat and carry no electricity to the miners. Which kind of solid can do both?',
    beats: [
      { to: 0.25, say: 'Salt gave way at 801 degrees and passed a current only once it was molten, as ions in a lattice do. Separate molecules melt easily and never conduct.' },
      { to: 0.5, say: 'A network bonded all the way through barely melts at all, and a metal carries a current cold.' },
      { to: 0.75, say: 'Nothing you measured belongs to an atom: it belongs to how atoms are held together. So the bond type tells you what a material will do before you test it.' }
    ],
    pin: 'A covalent network survives the heat and carries no current.'
  },
  'unit03/q3-distance': {
    scene: 'well-depth',
    role: 'Direct Clue',
    mystery: 'The Fifth\'s cut went straight through solid basalt and left it smooth as glass. How much energy does it take to pull strong bonds apart?',
    beats: [
      { to: 0.4, say: 'Two atoms settle where attraction and repulsion balance, at the lowest point of their energy curve. That distance is the bond length.' },
      { to: 0.65, say: 'The deeper the curve, the more energy it takes to pull the atoms apart: the bond energy. More shared pairs sit closer and hold more strongly.' },
      { to: 0.85, say: 'Every bond length and bond energy in a table is a point on one of these curves, so a breaker charge can be loaded for the bond it has to beat.' }
    ],
    pin: 'Basalt\'s bonds take huge energy to break, far more heat than any torch gives.'
  },
  'unit03/q4-dots': {
    scene: 'lewis-count',
    role: 'Station Fix',
    mystery: 'A gas is seeping out of the cracked rock where the blast hit. How are its atoms joined together?',
    beats: [
      { to: 0.26, say: 'Count first: carbon brings 4 valence electrons and each oxygen 6, so the Lewis structure of carbon dioxide has 16 to place.' },
      { to: 0.48, say: 'Bonds go in first and use 4 of them. Lone pairs then fill each outer oxygen to an octet, and the 12 that are left are all used.' },
      { to: 0.72, say: 'The central atom has only four electrons around it, short of an octet, and none are left to give it.' },
      { to: 0.92, say: 'So each oxygen shares one of its lone pairs. Both single bonds become double bonds, and every atom counts eight.' }
    ],
    pin: 'It is carbon dioxide: each oxygen shares two pairs with carbon, so every atom has eight.'
  },
  'unit03/q5-resonance': {
    scene: 'resonance-hybrid',
    role: 'Toolkit',
    beats: [
      { to: 0.28, say: 'Ozone can be drawn with a double bond on the left and a single bond on the right. Drawn that way, one bond would be short and the other long.' },
      { to: 0.52, say: 'The other drawing swaps them, and it fits the formula just as well. Neither one matches what is measured.' },
      { to: 0.78, say: 'Both bonds measure 128 pm, between a double bond and a single: a bond order of 1.5. The molecule is not flipping between drawings.' },
      { to: 0.92, say: 'Each end carries a formal charge of half a minus. The structures exist on paper, and the real molecule is their average.' }
    ]
  },
  'unit03/q6-shape': {
    scene: 'domain-shapes',
    role: 'Toolkit',
    beats: [
      { to: 0.27, say: 'Electron domains repel, so they settle as far apart as they can. Four of them point to the corners of a tetrahedron, 109.5° apart.' },
      { to: 0.5, say: 'Swap one bonded atom for a lone pair and the shape is trigonal pyramidal. A lone pair repels more strongly, so the bond angle closes to 107°.' },
      { to: 0.76, say: 'With two lone pairs the shape is bent and the angle closes to 104.5°. Count the domains, then the lone pairs, and the shape follows.' }
    ]
  },
  'unit03/q8-hybrid': {
    scene: 'hybrid-mix',
    role: 'Toolkit',
    beats: [
      { to: 0.26, say: 'A carbon atom has one s orbital and three p orbitals: four orbitals of two different shapes.' },
      { to: 0.5, say: 'Mixed, they become four equal sp³ hybrid orbitals, 109.5° apart. That is the angle carbon\'s bonds make in methane.' },
      { to: 0.76, say: 'In a double bond one overlap lies along the axis, a sigma bond, and a second lies above and below it, a pi bond.' },
      { to: 0.92, say: 'Turn one end of the bond and the pi overlap shrinks to nothing, so a double bond cannot turn without breaking. The sigma bond is unchanged.' }
    ]
  },
  'unit03/q7-polarity': {
    scene: 'field-swing',
    role: 'Station Fix',
    mystery: 'Some tunnel gases cling to the rescuers\' charged gear, and others drift straight past. Why do only some cling?',
    beats: [
      { to: 0.25, say: 'A bond is polar when its atoms share the pair unequally, and a molecule is polar when its bond dipoles do not balance.' },
      { to: 0.8, say: 'Shape decides: water turned in the field, while carbon dioxide did not, however polar its bonds.' },
      { to: 0.9, say: 'Whether a molecule is polar decides what it dissolves in and how it behaves near a charge. In hydrogen chloride the shared pair is shifted only about 18% of the way to chlorine.' }
    ],
    pin: 'Polar gases cling to the gear, and nonpolar gases vent away.'
  },
  'unit03/q9-orbitals': {
    scene: 'magnet-pull',
    role: 'Station Fix',
    mystery: 'This pipe carries air to the trapped miners. How can a magnet show whether that air still has oxygen in it?',
    beats: [
      { to: 0.25, say: 'When two atoms meet, their orbitals combine into molecular orbitals. Like signs add between the nuclei and make a bonding orbital; unlike signs cancel there and make an antibonding one.' },
      { to: 0.5, say: 'Electrons fill them from the lowest up. Oxygen\'s last two stand unpaired, which is why a magnet attracted it, while nitrogen, with every electron paired, was not attracted.' },
      { to: 0.75, say: 'Where a Lewis structure fails, as with oxygen\'s magnetism, molecular orbitals still work, which is why chemists keep both models. Ligar\'s last guard stands at the end of the cut.' }
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

  /* ---- Bellows: the Fifth jammed the station's holders; the chemistry reads what a gauge counts and ends on a sealed tank that stayed warm ---- */
  'unit04/q1-knocks': {
    scene: 'gauge-walls',
    role: 'Station Fix',
    mystery: 'Nobody has touched the valves, and the gauge on the jammed tank keeps climbing. What is happening inside the tank?',
    beats: [
      { to: 0.25, say: 'A gauge on the floor, on the side wall and on the roof of a sealed box all read the same, because a gauge counts knocks and counts them alike on every wall.' },
      { to: 0.5, say: 'The gas is not pressing down with its weight: more gas, less room or more heat all make the knocks harder or more frequent.' },
      { to: 0.75, say: 'Temperature measures the average kinetic energy of the particles, and pressure reflects how frequently and forcefully they collide with walls.' }
    ],
    pin: 'Gas particles hitting the tank walls cause the pressure.'
  },
  'unit04/q2-laws': {
    scene: 'cold-tank',
    role: 'Direct Clue',
    mystery: 'This sealed tank sat in freezing wind all night, and its gauge never dropped. What should the cold have done to it?',
    beats: [
      { to: 0.25, say: 'A gas does not care about the number on a Celsius thermometer. Its room, and its pressure in a sealed tank, follow the kelvin temperature, counted up from absolute zero.' },
      { to: 0.5, say: 'So a sealed tank left out in the cold must lose pressure in step with its kelvin temperature: cool one by fifty degrees and its gauge falls by about a sixth.' },
      { to: 0.75, say: 'Every cold-weather check on the station comes down to this, and a tank that does not follow it has something wrong inside.' }
    ],
    pin: 'Cold should drop its pressure, so a tank that stays hot has a heat source inside.'
  },
  'unit04/q3-ideal': {
    scene: 'equal-rooms',
    role: 'Station Fix',
    mystery: 'Opening a jammed tank to look inside could burst it. How can we count the gas in it from the outside?',
    beats: [
      { to: 0.25, say: 'A gas takes up room according to how many particles it has, not what they are.' },
      { to: 0.5, say: 'A mole of helium and a mole of carbon dioxide fill the same room, though one weighs eleven times the other.' },
      { to: 0.75, say: 'So a pressure, a room and a temperature are enough to count a sealed tank without opening it, which is the first check when a holder reads too high.' }
    ],
    pin: 'Pressure, volume and temperature give the amount of gas without opening a valve.'
  },
  'unit04/q4-mixtures': {
    scene: 'mix-share',
    role: 'Direct Clue',
    mystery: 'The Fifth pumped a second gas into the fuel line, and the gauge reads higher. How much of that reading is the new gas?',
    beats: [
      { to: 0.25, say: 'Every gas in a tank pushes as if it were alone, and the gauge adds the pushes up. Each gas\'s share of the push is its share of the particles.' },
      { to: 0.5, say: 'The moles, not the weight, decide who pushes hardest. Splitting a tank\'s push gas by gas is how a crew sees what has been added to it.' },
      { to: 0.75, say: 'The station\'s air is a mixture, and so is the fuel in its lines, so whatever the Fifth added will show up as a push of its own.' }
    ],
    pin: 'Each gas adds its own partial pressure, and together they make the total.'
  },
  'unit04/q5-speed': {
    scene: 'leak-race',
    role: 'Direct Clue',
    mystery: 'Gas is hissing out of the damaged vent, and nobody can see it. Which gas is leaking?',
    beats: [
      { to: 0.25, say: 'The lighter the gas, the faster its particles go, so the sooner it leaks through a hole and the further it spreads in the same time.' },
      { to: 0.5, say: 'The leak at the vent stack emptied at the same pace as krypton, and a leak that matches a known gas has the same kind of particle.' },
      { to: 0.75, say: 'Graham\'s law connects effusion and diffusion rates inversely to the square root of molar mass.' }
    ],
    pin: 'The vent is leaking krypton, a heavy gas.'
  },
  'unit04/q6-real': {
    scene: 'crowd-and-pull',
    role: 'Station Fix',
    mystery: 'The Fifth packed one tank far past its limit. Do the usual gas rules still hold inside it?',
    beats: [
      { to: 0.25, say: 'A real gas reads above the gas law where its particles crowd, because they take up room.' },
      { to: 0.5, say: 'It reads below it where they cling, because they pull on each other, and that same pull is what turns a gas into a liquid.' },
      { to: 0.75, say: 'So a gas is closest to ideal when it is thin and warm, and every pressure vessel on the cloud deck is designed knowing exactly where the gas law stops being true.' }
    ],
    pin: 'No. Packed that tight, the particles crowd each other and the ideal gas law fails.'
  },
  'unit04/boss-compressor': {
    scene: 'warm-cylinder',
    role: 'Boss Payoff',
    mystery: 'The Fifth\'s sealed tank has stayed hot for 12 days in freezing air. What could keep it hot that long?',
    beats: [
      { to: 0.25, say: 'With every gas tank balanced and vented, the Compressor finally shut down.' },
      { to: 0.5, say: 'Inside its vault sits a sealed cylinder that held steady pressure for twelve days while the air outside stayed freezing.' },
      { to: 0.75, say: 'Gay-Lussac\'s law proves a sealed gas would lose pressure in the cold unless something inside keeps making heat. We logged the cylinder in the Case File.' }
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
      { to: 0.2, say: 'Two clear jars hold lead, nitrate, potassium and iodide ions. Pour them together and a cloud forms.' },
      { to: 0.5, say: 'Only one pair of ions meets and packs into a solid, the precipitate. The lead and iodide ions leave the water, and nothing else moves.' },
      { to: 0.74, say: 'The potassium and nitrate ions are spectator ions: the same discs stand in the water before and after the mixing.' },
      { to: 0.94, say: 'The net ionic equation keeps only what changed: the lead ion and two iodide ions packing into a solid.' }
    ],
    pin: 'One pair of ions formed a solid, and that solid clouds the pond.'
  },
  'unit07/boss-golem': {
    scene: 'golem-vault',
    role: 'Boss Payoff',
    mystery: 'Kettle\'s log records a 50-ton iron haul. Where did all that metal really come from?',
    beats: [
      { to: 0.22, say: 'We checked every reaction and weight reading until the Recipe Golem ran out of reactants to run on.' },
      { to: 0.5, say: 'Its valves sealed shut and the steam died down. Once a limiting reactant runs out, the reaction stops.' },
      { to: 0.7, say: 'Behind the golem sits a locked vault holding the foundry\'s shipping log: ore in, iron out.' },
      { to: 0.92, say: 'The ore in that log can produce at most 27.9 tons of iron. Claiming 50.0 tons means 22.1 tons came from somewhere else.' }
    ],
    pin: '22 of the 50 tons came from outside the ore. The shipping log is impossible.'
  },
  'unit07/q4-balance': {
    scene: 'recipe-board',
    role: 'Station Fix',
    mystery: 'The furnace turns ore into iron. How many of each molecule does the recipe need so no atom is lost?',
    beats: [
      { to: 0.26, say: 'The furnace equation lists the reactants, Fe₂O₃ and CO, and the products, Fe and CO₂. Count the atoms and the sides disagree: oxygen is 4 on the left and 2 on the right.' },
      { to: 0.6, say: 'A coefficient in front of a formula counts molecules, so it changes the atom counts and leaves each substance alone. Raise them one at a time and the rows come closer.' },
      { to: 0.94, say: 'At 1, 3, 2 and 3 every row agrees: 2 iron, 3 carbon and 6 oxygen on each side.' }
    ],
    pin: 'The furnace equation balances as Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂.'
  },
  'unit07/q2-names': {
    scene: 'crate-labels',
    role: 'Direct Clue',
    mystery: 'The ore crates are stencilled Fe₂O₃ and nothing else. What is that, in words?',
    beats: [
      { to: 0.3, say: 'Ions carry charges and a compound carries none. One magnesium ion cancels two chlorine ions, so the formula counts the ions in that smallest group: MgCl₂.' },
      { to: 0.6, say: 'A name says the same in words. The metal keeps its name and the other ion takes the ending -ide, so Mg²⁺ with O²⁻ is magnesium oxide.' },
      { to: 0.94, say: 'In Fe₂O₃ the three oxide ions hold 6− between them, so each of the two irons is 3+. The Roman numeral is that charge, not a count: iron(III) oxide.' }
    ],
    pin: 'The crates hold iron(III) oxide, Fe₂O₃.'
  },
  'unit07/q3-change': {
    scene: 'sealed-pot',
    role: 'Direct Clue',
    mystery: 'The foundry log says the furnace put out more metal than went into it. Can a reaction ever make mass?',
    beats: [
      { to: 0.27, say: 'In an open vessel, burning iron takes oxygen from the air, so the balance counts more atoms and reads more.' },
      { to: 0.52, say: 'The gases a burn makes float out of an open vessel, so the balance counts fewer atoms and reads less.' },
      { to: 0.77, say: 'Seal the lid and nothing gets in or out. The atoms only join up differently, so the balance reads the same before and after.' },
      { to: 0.94, say: 'The balance changes only when atoms cross the lid. A sealed vessel makes nothing and loses nothing.' }
    ],
    pin: 'No. A sealed reaction never creates mass, so something in the log is wrong.'
  },
  'unit07/q6-stoich': {
    scene: 'furnace-ledger',
    role: 'Direct Clue',
    mystery: 'The foundry log says 40 tons of ore made 50 tons of iron. Is that possible?',
    beats: [
      { to: 0.24, say: 'An equation counts molecules, not grams. Two hydrogens and one oxygen make two waters, and the masses still add to 36.0 on both sides.' },
      { to: 0.5, say: 'So grams reach grams through moles. Three hydrogens to two ammonias is a ratio of moles, whatever they weigh.' },
      { to: 0.72, say: 'Feed two reactants and the reaction stops when one runs out. What is left of the other is the excess.' },
      { to: 0.94, say: 'Forty tons of ore can give at most 28.0 tons of iron. A real furnace keeps only a part of that.' }
    ],
    pin: '40 tons of ore makes at most 28 tons of iron. 22 tons came from elsewhere.'
  },
  'unit07/q7-titrate': {
    scene: 'burette-count',
    role: 'Station Fix',
    mystery: 'The foundry\'s cleaning tank holds an acid of unknown strength. How strong is it?',
    beats: [
      { to: 0.24, say: 'A burette lets base into the acid in measured drops, and its reading is the drops counted. Here each drop is half a millilitre.' },
      { to: 0.5, say: 'Every drop holds the same moles of base, and each mole of base uses up a mole of acid. The flask is counted against the drops, particle for particle.' },
      { to: 0.74, say: 'When the particles match, that is the equivalence point. The indicator turns on the very next drop, which is the endpoint.' },
      { to: 0.95, say: 'So the acid\'s strength is the base\'s strength times the volume counted, over the volume in the flask.' }
    ],
    pin: 'Titration gave the exact concentration of the acid in the cleaning tank.'
  },
  'unit07/q8-kinds': {
    scene: 'furnace-log',
    role: 'Toolkit',
    beats: [
      { to: 0.24, say: 'The furnace log lists the ore reaction. In Fe₂O₃ each iron atom carries +3 and each oxygen −2, and all together they add up to the charge of the ore, 0.' },
      { to: 0.5, say: 'The other reactant is CO. Its carbon carries +2 and its oxygen −2, worked the same way.' },
      { to: 0.78, say: 'Six electrons move, two from each carbon to three on each iron. Iron falls from +3 to 0, so it gained electrons and was reduced; carbon rises to +4 and is oxidised.' },
      { to: 0.97, say: 'The oxygen leaves the ore for the carbon. That is a redox reaction, and what stays behind is iron.' }
    ]
  },
  'unit07/q9-hsab': {
    scene: 'hsab-vat',
    role: 'Station Fix',
    mystery: 'The foundry\'s waste vat holds several metals mixed together. How can we pull them apart?',
    beats: [
      { to: 0.25, say: 'Hard ions are small and compact with tightly held electron clouds, while soft ions are large with clouds easily pulled out of shape.' },
      { to: 0.5, say: 'Hard cations like calcium lock to hard fluoride with strong ionic attraction. Mismatched pairs stay dissolved in the water.' },
      { to: 0.75, say: 'Soft silver ions share electrons with soft sulfide through covalent overlap, forming an insoluble black precipitate.' },
      { to: 0.95, say: 'Hard soft acid base theory explains how the foundry selectively separates precious metals from furnace waste.' }
    ],
    pin: 'Each metal holds on to sulfide differently, and that difference separates them.'
  },
  'unit05/q1-flow': {
    scene: 'frost-manifold',
    role: 'Station Fix',
    mystery: 'The shelters are freezing on top of a volcano, and this pipe is furred with frost. Why is everything so cold?',
    beats: [
      { to: 0.25, say: 'Heat is energy flowing from a hotter object to a colder one until both reach the same temperature.' },
      { to: 0.5, say: 'A thermometer measures the surroundings: when a water bath cools down, heat is flowing into the reaction, making it endothermic.' },
      { to: 0.75, say: 'The Fifth Guild\'s volcano pipe is coated in frost because it is pulling heat inward, away from the colony shelters.' }
    ],
    pin: 'The Fifth Guild\'s volcano pipe is pulling heat away from the shelters.'
  },
  'unit05/q2-calorimetry': {
    scene: 'heat-swap',
    role: 'Direct Clue',
    mystery: 'The Fifth tapped an unmarked metal pipe into the volcano. How can we tell what metal it is without a label?',
    beats: [
      { to: 0.3, say: 'Drop a hot block into cool water and the block cools while the water warms. Heat moves until the two read the same temperature.' },
      { to: 0.64, say: 'They meet where the heat the block lost has gone into the water. Nothing is made or lost on the way.' },
      { to: 0.86, say: 'Heat follows q = m × c × ΔT, and the two sides come to the same number of joules. A calorimeter measures one side to learn the other.' }
    ],
    pin: 'The pipe\'s specific heat identifies its metal.'
  },
  'unit05/q3-enthalpy': {
    scene: 'fuel-bars',
    role: 'Station Fix',
    mystery: 'The rescue skiff can only lift so much weight. Which fuel gives the most heat for each gram it carries?',
    beats: [
      { to: 0.3, say: 'The heat a reaction gives out grows in step with how much reacts: twice the moles, twice the heat.' },
      { to: 0.6, say: 'Per mole, methane gives out the most of these four fuels and hydrogen the least.' },
      { to: 0.85, say: 'Per gram the order turns over, and hydrogen leads by a wide margin. A mole of hydrogen weighs so little that its mass carries a lot of heat.' }
    ],
    pin: 'Measuring heat per gram picked the fuel that gets the skiff off the ground.'
  },
  'unit05/q4-bonds': {
    scene: 'bond-ledger',
    role: 'Direct Clue',
    mystery: 'The Fifth\'s cracking coil breaks molecules apart. How much energy does that cost, and does any come back?',
    beats: [
      { to: 0.2, say: 'Breaking a bond takes energy in. Pulling the hydrogen pair apart costs 436 kJ for every mole.' },
      { to: 0.4, say: 'Splitting chlorine costs another 242 kJ, so four separate atoms stand 678 kJ above where the reaction began.' },
      { to: 0.78, say: 'Forming a bond gives energy back, 431 kJ for each H-Cl bond. Two of them return 862 kJ, releasing 184 kJ overall.' }
    ],
    pin: 'Breaking bonds costs energy and forming new ones pays back 184 kJ extra.'
  },
  'unit05/q6-entropy': {
    scene: 'spread-count',
    role: 'Toolkit',
    beats: [
      { to: 0.4, say: 'Lift the partition and the gas spreads through the whole box, though nothing pushes it there.' },
      { to: 0.7, say: 'Count the ways eight particles can split between the halves. An even split can happen in 70 ways, and all eight on one side in just 1.' },
      { to: 0.9, say: 'That count of ways is what entropy measures. A gas spreads out because spread-out arrangements are overwhelmingly the most numerous.' }
    ]
  },
  'unit05/q5-hess': {
    scene: 'two-routes',
    role: 'Direct Clue',
    mystery: 'The Fifth sealed its main shaft, so nobody can measure it directly. How much heat flows down it?',
    beats: [
      { to: 0.25, say: 'The heat of a reaction depends only on where it starts and where it finishes. So steps can be added, turned round and doubled.' },
      { to: 0.5, say: 'A reaction nobody can run can still be worked out from ones that were measured, because measured from the elements, every compound sits at a height of its own.' },
      { to: 0.75, say: 'The straight shaft at the separator is sealed, but the stepped pipe beside it starts and ends in the same two places. Heat counts only those two places, so the open pipe gives the same total.' }
    ],
    pin: 'Adding up the open side pipes gives the total heat flowing down the sealed shaft.'
  },
  'unit05/q7-gibbs': {
    scene: 'seal-crossing',
    role: 'Direct Clue',
    mystery: 'The Fifth\'s underground process takes in heat, yet it still runs. At what temperature can it start on its own?',
    beats: [
      { to: 0.25, say: 'Two factors decide whether a reaction runs on its own: how much heat it exchanges, and how much more spread out the particles become.' },
      { to: 0.5, say: 'Free energy, ΔG = ΔH − TΔS, weighs both together. High temperature boosts the spreading term until a heat-absorbing reaction can still run.' },
      { to: 0.75, say: 'Ice melts at 273 K where both terms balance, and the Fifth Guild\'s underground process only starts above extreme volcano temperatures.' }
    ],
    pin: 'The underground process absorbs heat, so it only runs at extreme volcano temperatures.'
  },
  'unit05/boss-crucible': {
    scene: 'crucible-open',
    role: 'Boss Payoff',
    mystery: 'Ember Reach\'s volcano heat is draining underground. What is using it?',
    beats: [
      { to: 0.25, say: 'Tracing the heat flow, bond energies, and free energy finally broke the Crucible\'s grip on the volcano pipes.' },
      { to: 0.5, say: 'The machine split open to reveal a giant heat exchanger pulling huge amounts of volcano heat away from the shelters.' },
      { to: 0.75, say: 'Below the exchanger, a heavy pipe runs straight down into the crust. We logged the underground pipe in the Case File.' }
    ],
    pin: 'The Fifth Guild is draining volcano heat to power a hidden underground rig.'
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
      { to: 0.3, say: 'Larger electron clouds pull harder on their neighbors: helium needs 0.08 kJ per mole to separate, while xenon needs 12.6 kJ.' },
      { to: 0.64, say: 'Water weighs 18 g per mole and hydrogen sulfide weighs 34 g, yet water needs 40.7 kJ to boil versus 18.7 kJ. Hydrogen bonds outweigh mass.' },
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
      { to: 0.62, say: 'Carry the jar from solid to liquid to gas and the reader names H₂O the whole way. The molecules only change places, so no bond breaks.' },
      { to: 0.9, say: 'A litre of liquid water weighs about 1,700 times a litre of steam, so a gas is mostly empty space. Melting and boiling overcome the intermolecular forces between molecules, never the bonds inside them.' }
    ],
    pin: 'It is still water. The Fifth only locked the molecules in place.'
  },
  'unit06/q3-boil': {
    scene: 'boil-flask',
    role: 'Toolkit',
    beats: [
      { to: 0.32, say: 'In a sealed flask molecules leave the liquid and come back to it. The gauge stops rising when the leaving and the returning match, and that steady pressure is the vapor pressure.' },
      { to: 0.66, say: 'Warming the liquid sends more molecules into the vapor, so its vapor pressure climbs: water pushes at 3.2 kPa at 25 °C and at 47.3 kPa at 80 °C.' },
      { to: 0.92, say: 'A liquid boils when its vapor pressure reaches the pressure outside it. Water does that at 100 °C at sea level, and at 88 °C where the outside pressure is 65 kPa.' }
    ]
  },
  'unit06/q4-solids': {
    scene: 'solid-order',
    role: 'Direct Clue',
    mystery: 'The canal barrier looks like ice, but glass looks like ice too. Which is it?',
    beats: [
      { to: 0.32, say: 'Iodine, naphthalene, and ice all melt below 115 °C while their molecules stay intact. Only the forces between molecules give way.' },
      { to: 0.7, say: 'Quartz stayed solid up to 1713 °C and then melted all at once. Fused silica, made of the same atoms, softened gradually from 1040 to 1585 °C.' },
      { to: 0.9, say: 'In a crystal every bond has the same angle and breaks together. In glass the angles vary, so bonds give way gradually.' }
    ],
    pin: 'The barrier melts at one sharp temperature, proving it is a crystal, not glass.'
  },
  'unit06/q5-crossing': {
    scene: 'crossing-curve',
    role: 'Station Fix',
    mystery: 'The canal barrier has to be melted. Where does the heat go while it melts?',
    beats: [
      { to: 0.3, say: 'A heating curve climbs as heat warms the ice, then stays flat at 0 °C while 6.01 kJ per mole goes into melting.' },
      { to: 0.62, say: 'That heat frees molecules from their fixed crystal spots, and boiling a mole of liquid water takes 40.65 kJ.' },
      { to: 0.9, say: 'Cool it back down and steam condenses and freezes, releasing the exact same heat: 54.9 kJ on the way down.' }
    ],
    pin: 'Melting uses heat to free the molecules, even while the temperature holds steady.'
  },
  'unit06/q6-solution': {
    scene: 'solution-drop',
    role: 'Direct Clue',
    mystery: 'The drums on the quay are empty, and their chemical is in the canal water. How much of it is in each litre?',
    beats: [
      { to: 0.28, say: 'Dissolved salt does not vanish. Its ions leave the crystal one by one and spread through the water, each surrounded by water molecules.' },
      { to: 0.54, say: 'Four units of sodium chloride split into 8 ions, four of calcium chloride into 12 ions, and four of sugar stay 4 molecules. Molarity counts formula units, not split ions.' },
      { to: 0.8, say: 'Adding water leaves the moles unchanged and spreads them over more liters: 25 mL of 2.00 M stock diluted to 100 mL becomes 0.500 M.' },
      { to: 0.96, say: 'Dissolving also moves heat: calcium chloride warmed the water, while sodium chloride, potassium chloride, and ammonium nitrate cooled it.' }
    ],
    pin: 'We measured its molarity: the moles of chemical in each liter of canal water.'
  },
  'unit06/q7-separate': {
    scene: 'pull-apart',
    role: 'Station Fix',
    mystery: 'The Fifth\'s chemical is dissolved in the canal water. Can we get it back out, and how?',
    beats: [
      { to: 0.34, say: 'Filter paper traps solid chunks, but dissolved salt passes right through with the water. Filtering cannot remove the Fifth Guild\'s chemical.' },
      { to: 0.66, say: 'In paper chromatography, each dye climbs according to how strongly it clings to the paper versus the solvent, so different solvents separate dyes in opposite orders.' },
      { to: 0.9, say: 'In distillation, the liquid with the lowest boiling point boils off first: acetone, then ethanol, then water. Boiling the water away leaves the dissolved chemical behind.' }
    ],
    pin: 'Filtering fails, but boiling the water off leaves the chemical behind in the flask.'
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
