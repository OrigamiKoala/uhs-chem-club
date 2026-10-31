/**
 * quest-story.js — the one story animation a quest ends on, and only that one. It is Vess's debrief.
 *
 * PURE DATA. A quest's animation is a scene (drawn by `ui/story-scenes.js`, from the same numbers the bench measured)
 * and the few lines Vess says over it. It replaces the debrief card: each `beats[i].say` is the part of the old debrief
 * that reviews an idea the quest worked out, said while the scene shows that idea, and the last line, `filed`, is the one
 * thing the quest adds to the case against the Fifth (the rumour of alchemy, the Case File), so the animation always
 * reviews the lesson AND moves the investigation on. A beat's `to` is where in the scene (`t`, 0..1) its picture ends; the
 * filed line runs from the last `to` to 1. It plays whenever the quest's last stage is cleared, is skippable, and never plays
 * before or between stages. A quest with no animation here still ends on its debrief card (`DEBRIEF` in the quest file).
 *
 * Rules, held by `verify:story`:
 *   - at most ONE animation per quest, keyed `<world>/<quest>`;
 *   - 3 to 5 beats, each at most 2 sentences and 36 words, no emoji, no "!"; `to` rises from 0 to under 1;
 *   - one `filed` line ("Filed: ...", one sentence, 24 words) that says what the quest has just added to the case;
 *   - the scene names a painter that exists;
 *   - it uses only words the quest itself has earned by its last reward card, and none that a later bench of the world
 *     introduces: Vess reviews what the player has just learned, in the words they now have.
 */

export const QUEST_STORY = {
  /* ---- Tallow: is the Fifth's alchemy rumour true, and what are they putting in the salt? ---- */
  'unit01/q1-grain': {
    scene: 'grain-resolve',
    beats: [
      { to: 0.22, say: 'Zoom in far enough and the grey powder stops being smooth. It is atoms of carbon and sodium, lying loose beside each other.' },
      { to: 0.46, say: 'A substance made of one kind of atom is an element. Different atoms sitting together without joining make a mixture, and that is all this powder is.' },
      { to: 0.70, say: 'Atoms that are joined make a molecule. The cutter splits a molecule into its atoms, but a single atom never splits.' },
      { to: 0.90, say: 'Join atoms of different elements and you have a compound, a new substance. Loose atoms never become one, so anything new would have to be inside the atoms.' }
    ],
    filed: 'Filed: the powder is ordinary and nothing in it is new.'
  },
  'unit01/q2-core': {
    scene: 'beam-foil',
    beats: [
      { to: 0.24, say: 'Fire a beam at a thin foil and nearly every shot goes straight through. An atom is mostly empty space, with a tiny dense center, the nucleus.' },
      { to: 0.50, say: 'The nucleus holds protons, each +1, and neutrons, which carry no charge. The electrons, each -1, sit far outside it in shells.' },
      { to: 0.74, say: 'The protons decide which element an atom is. The electrons in the outer shell, the valence electrons, decide how it reacts.' },
      { to: 0.90, say: 'To turn salt into gold you would have to change the protons inside the nucleus. Nothing on these benches can reach that deep.' }
    ],
    filed: 'Filed: if gold turns up in a salt pan, someone brought it.'
  },
  'unit01/q3-catalogue': {
    scene: 'chart-fill',
    beats: [
      { to: 0.24, say: 'Put the atoms in order of their protons, the atomic number, and the same pattern keeps repeating. Laid out in rows, that is the periodic table.' },
      { to: 0.48, say: 'A row, a period, ends when a shell fills up. A column, a group, shares one outer-shell count, so its atoms behave alike.' },
      { to: 0.74, say: 'Metals on the left hand electrons over, and nonmetals on the right take them on. The noble gases at the edge want nothing.' },
      { to: 0.90, say: 'That is why salt is sodium and chlorine: one gives and one takes. With the chart I can check any manifest, one element at a time.' }
    ],
    filed: 'Filed: a salt flat holds sodium, chlorine and little else, so anything more was brought in.'
  },
  'unit01/q4-ledger': {
    scene: 'three-numbers',
    beats: [
      { to: 0.24, say: 'Three numbers describe any atom: its protons, its neutrons and its charge. Protons plus neutrons is the mass number.' },
      { to: 0.48, say: 'Change the protons and it is a different element. Change only the neutrons and it is an isotope, which behaves exactly the same.' },
      { to: 0.74, say: 'Take electrons off and the atom is a cation; add some and it is an anion. One magnesium and two chlorines cancel to zero.' },
      { to: 0.90, say: 'A label can claim anything, but the counts cannot be argued with. I will run the raiders\' sealed canisters through the same ledger.' }
    ],
    filed: 'Filed: no raider label can disguise an atom from the ledger.'
  },
  'unit01/q5-assay': {
    scene: 'balance-bins',
    beats: [
      { to: 0.24, say: 'A real sample of an element is a mixture of isotopes, in proportions that are fixed. Here, three chlorine atoms in four are chlorine-35.' },
      { to: 0.50, say: 'The listed mass is an average over that mixture, weighted by how common each isotope is, so it leans toward the common one.' },
      { to: 0.74, say: 'Any single atom has a whole-number mass, but an average rarely does. The decimal tells you how the mix sits: 35.5 is nearer 35 than 37.' },
      { to: 0.90, say: 'Natural chlorine balances at 35.5, however much of it is weighed. Of the three samples sold as natural, only one did.' }
    ],
    filed: 'Filed: two of the raiders\' samples had been tampered with.'
  },
  'unit01/q6-weigh': {
    scene: 'scale-count',
    beats: [
      { to: 0.24, say: 'Nobody can count atoms, so we weigh them. Atoms of one kind all weigh the same, so a pan that balances the crate holds the same number.' },
      { to: 0.50, say: 'The listed mass of a substance, in grams, is one mole of it. One mole always holds 6.02 × 10²³ atoms or molecules, whatever it is made of.' },
      { to: 0.76, say: 'The molar mass is the bridge: divide grams by it to get moles, multiply moles by it to get grams. A formula is a count, and a balance reads a mass.' },
      { to: 0.90, say: 'So a sealed crate can be counted without opening it, and nothing in the stores can hide inside one. The sealed drums on the dock are next.' }
    ],
    filed: 'Filed: every sealed drum in the stores can now be counted without opening it.'
  },
  /* ---- Ligar (2026-10-23 rollout): the blast at the rescue pass, and what held the rock together ---- */
  'unit03/q1-joins': {
    scene: 'bond-pairs',
    beats: [
      { to: 0.2, say: 'Atoms join to fill their outer shells, and there are only two ways to do it: hand electrons over, or hold pairs between you.' },
      { to: 0.4, say: 'A metal with a nonmetal hands electrons over and makes an ionic bond; two nonmetals hold pairs and make a covalent bond.' },
      { to: 0.6, say: 'How many electrons each outer shell has to move is a count, not a preference, which is why one compound only ever has one recipe.' },
      { to: 0.8, say: 'The rubble round the tunnel mouth is made of joins like these. Next I hit, heat and charge a whole block of each kind.' }
    ],
    filed: 'Filed: the blast broke the rock apart, but every bond in the rubble is an ordinary one.'
  },
  'unit03/q2-lattice': {
    scene: 'liner-heat',
    beats: [
      { to: 0.25, say: 'Salt gave way at 801 degrees and passed a current only once it was molten, as ions in a lattice do. Separate molecules melt easily and never conduct.' },
      { to: 0.5, say: 'A network bonded all the way through barely melts at all, and a metal carries a current cold.' },
      { to: 0.75, say: 'Nothing you measured belongs to an atom: it belongs to how atoms are held together. So the bond type tells you what a material will do before you test it.' }
    ],
    filed: 'Filed: a liner of covalent network will hold the trapped miners\' vessel at 900 degrees without passing a current.'
  },
  'unit03/q3-distance': {
    scene: 'well-depth',
    beats: [
      { to: 0.4, say: 'Two atoms settle where the pull between them and the push between their nuclei balance. That sets how long the bond is and how much it costs to break.' },
      { to: 0.65, say: 'A bond is a well: the deeper it is, the more energy it takes to pull the atoms apart. More shared pairs sit closer and hold harder.' },
      { to: 0.85, say: 'Every bond length and bond energy in a table is a point on one of these curves, so a breaker charge can be loaded for the bond it has to beat.' }
    ],
    filed: 'Filed: the breaker charges are sized to the strongest bond in the pass.'
  },
  'unit03/q4-dots': {
    scene: 'lewis-count',
    beats: [
      { to: 0.26, say: 'Count first: carbon brings 4 valence electrons and each oxygen 6, so the Lewis structure of carbon dioxide has 16 to place.' },
      { to: 0.48, say: 'Bonds go in first and use 4 of them. Lone pairs then fill each outer oxygen to an octet, and the 12 that are left are all used.' },
      { to: 0.72, say: 'The central atom has only four electrons around it, short of an octet, and none are left to give it.' },
      { to: 0.92, say: 'So each oxygen shares one of its lone pairs. Both single bonds become double bonds, and every atom counts eight.' }
    ],
    filed: 'Filed: any molecule in the pass can be drawn from its formula by counting valence electrons first.'
  },
  'unit03/q5-resonance': {
    scene: 'resonance-hybrid',
    beats: [
      { to: 0.28, say: 'Ozone can be drawn with a double bond on the left and a single bond on the right. Drawn that way, one bond would be short and the other long.' },
      { to: 0.52, say: 'The other drawing swaps them, and it fits the formula just as well. Neither one matches what is measured.' },
      { to: 0.78, say: 'Both bonds measure 128 pm, between a double bond and a single: a bond order of 1.5. The molecule is not flipping between drawings.' },
      { to: 0.92, say: 'Each end carries a formal charge of half a minus. The structures exist on paper, and the real molecule is their average.' }
    ],
    filed: 'Filed: where one drawing cannot fit the measured bonds, resonance structures averaged together can.'
  },
  'unit03/q6-shape': {
    scene: 'domain-shapes',
    beats: [
      { to: 0.27, say: 'Electron domains repel, so they settle as far apart as they can. Four of them point to the corners of a tetrahedron, 109.5° apart.' },
      { to: 0.5, say: 'Swap one bonded atom for a lone pair and the shape is trigonal pyramidal. A lone pair pushes harder, so the bond angle closes to 107°.' },
      { to: 0.76, say: 'With two lone pairs the shape is bent and the angle closes to 104.5°. Count the domains, then the lone pairs, and the shape follows.' }
    ],
    filed: 'Filed: any molecule in the pass can be given a shape from its formula alone.'
  },
  'unit03/q8-hybrid': {
    scene: 'hybrid-mix',
    beats: [
      { to: 0.26, say: 'A carbon atom has one s orbital and three p orbitals: four orbitals of two different shapes.' },
      { to: 0.5, say: 'Mixed, they become four equal sp³ hybrid orbitals, 109.5° apart. That is the angle carbon\'s bonds make in methane.' },
      { to: 0.76, say: 'In a double bond one overlap lies along the axis, a sigma bond, and a second lies above and below it, a pi bond.' },
      { to: 0.92, say: 'Turn one end of the bond and the pi overlap shrinks to nothing, so a double bond has restricted rotation. The sigma bond is unchanged.' }
    ],
    filed: 'Filed: sigma and pi overlap can be counted from a molecule\'s structure alone.'
  },
  'unit03/q7-polarity': {
    scene: 'field-swing',
    beats: [
      { to: 0.25, say: 'A bond is polar when its atoms pull the pair unequally, and a molecule is polar when those pulls do not cancel.' },
      { to: 0.8, say: 'Shape decides: water swung round in the field, while carbon dioxide stayed put, however polar its bonds.' },
      { to: 0.9, say: 'Whether a molecule is polar decides what it dissolves in and how it behaves near a charge. A charged rod bent the stream of water too, so a whole liquid shows what its molecules do.' }
    ],
    filed: 'Filed: the gases that cling to the rescue gear are the polar ones, and a charged rod can pick them out.'
  },
  'unit03/q9-orbitals': {
    scene: 'magnet-pull',
    beats: [
      { to: 0.25, say: 'Atomic boxes combine into molecular orbitals, half of them bonding and half antibonding, and electrons fill them from the bottom up, one to a box before any pair up.' },
      { to: 0.5, say: 'Oxygen\'s last two electrons stand alone, and that is why a magnet pulled on it. Nitrogen, with every electron paired, was left where it was.' },
      { to: 0.75, say: 'Where a Lewis structure fails, as with oxygen\'s magnetism, the boxes still work, which is why chemists keep both models. Ligar\'s last guard stands at the end of the cut.' }
    ],
    filed: 'Filed: a magnet can find the oxygen in the pass, however it is hidden among the other gases.'
  },
  'unit03/boss-warden': {
    scene: 'warden-cut',
    beats: [
      { to: 0.25, say: 'Every phase was a bench you had already worked, with a new case on it: a salt, a drawing, a shape, a field and a magnet. That was enough to read the guard.' },
      { to: 0.5, say: 'The warden settles back into quarry stone, and the slab behind it has been cut clean through, ionic and covalent rock alike.' },
      { to: 0.75, say: 'No chartered refinery torch makes heat like that, and whoever made the cut was not working with bonds at all. The slab goes into the Case File.' }
    ],
    filed: 'Filed: the slab was cut with heat no ordinary bond survives, and no bench in Ligar can make it.'
  },

  'unit01/boss-hopper': {
    scene: 'hopper-fall',
    beats: [
      { to: 0.26, say: 'Each phase of that fight was a bench you had already worked: matter, the atom, the chart, isotopes and the mole. That was enough to read the machine.' },
      { to: 0.50, say: 'The Hopper has collapsed into cold slag. Its chute holds a lump that nobody mined.' },
      { to: 0.74, say: 'It is bismuth. No salt flat makes bismuth on its own, and nothing we weighed or counted could have made it here.' },
      { to: 0.90, say: 'The ingot goes into the Case File. The next world asks why the electrons in every atom you have weighed sit only where they do.' }
    ],
    filed: 'Filed: someone is putting heavy metal into Tallow\'s salt, and no bench here can make it.'
  },

  /* ---- Bellows: the Fifth jammed the station's holders; the chemistry reads what a gauge counts and ends on a sealed tank that stayed warm ---- */
  'unit04/q1-knocks': {
    scene: 'gauge-walls',
    beats: [
      { to: 0.25, say: 'A gauge on the floor, on the side wall and on the roof of a sealed box all read the same, because a gauge counts knocks and counts them alike on every wall.' },
      { to: 0.5, say: 'The gas is not pressing down with its weight: more gas, less room or more heat all make the knocks harder or more frequent.' },
      { to: 0.75, say: 'Temperature measures the average kinetic energy of the particles, and pressure reflects how frequently and forcefully they collide with walls.' }
    ],
    filed: 'Filed: the station\'s gauges read true, so the pressure in the jammed holders is genuine and not a faulty needle.'
  },
  'unit04/q2-laws': {
    scene: 'cold-tank',
    beats: [
      { to: 0.25, say: 'A gas does not care about the number on a Celsius thermometer. Its room, and its pressure in a sealed tank, follow the kelvin temperature, counted up from absolute zero.' },
      { to: 0.5, say: 'So a sealed tank left out in the cold must lose pressure in step with its kelvin temperature: cool one by fifty degrees and its gauge falls by about a sixth.' },
      { to: 0.75, say: 'Every cold-weather check on the station comes down to this, and a tank that does not follow it has something wrong inside.' }
    ],
    filed: 'Filed: a sealed tank that keeps its pressure through the cold must have something inside it giving off heat.'
  },
  'unit04/q3-ideal': {
    scene: 'equal-rooms',
    beats: [
      { to: 0.25, say: 'A gas takes up room according to how many particles it has, not what they are.' },
      { to: 0.5, say: 'A mole of helium and a mole of carbon dioxide fill the same room, though one weighs eleven times the other.' },
      { to: 0.75, say: 'So a pressure, a room and a temperature are enough to count a sealed tank without opening it, which is the first check when a holder reads too high.' }
    ],
    filed: 'Filed: every sealed tank on the station can now be counted from its plate without opening it.'
  },
  'unit04/q4-mixtures': {
    scene: 'mix-share',
    beats: [
      { to: 0.25, say: 'Every gas in a tank pushes as if it were alone, and the gauge adds the pushes up. Each gas\'s share of the push is its share of the particles.' },
      { to: 0.5, say: 'The moles, not the weight, decide who pushes hardest. Splitting a tank\'s push gas by gas is how a crew sees what has been added to it.' },
      { to: 0.75, say: 'The station\'s air is a mixture, and so is the fuel in its lines, so whatever the Fifth added will show up as a push of its own.' }
    ],
    filed: 'Filed: any gas the Fifth has added to a tank can be read off its own share of the push.'
  },
  'unit04/q5-speed': {
    scene: 'leak-race',
    beats: [
      { to: 0.25, say: 'The lighter the gas, the faster its particles go, so the sooner it leaks through a hole and the further it spreads in the same time.' },
      { to: 0.5, say: 'The leak at the vent stack emptied at the same pace as krypton, and a leak that matches a known gas has the same kind of particle.' },
      { to: 0.75, say: 'Graham\'s law connects effusion and diffusion rates inversely to the square root of molar mass.' }
    ],
    filed: 'Filed: the leak at the vent stack is krypton.'
  },
  'unit04/q6-real': {
    scene: 'crowd-and-pull',
    beats: [
      { to: 0.25, say: 'A real gas reads above the gas law where its particles crowd, because they take up room.' },
      { to: 0.5, say: 'It reads below it where they cling, because they pull on each other, and that same pull is what turns a gas into a liquid.' },
      { to: 0.75, say: 'So a gas is closest to ideal when it is thin and warm, and every pressure vessel on the cloud deck is designed knowing exactly where the gas law stops being true.' }
    ],
    filed: 'Filed: the Fifth packed the tanks past where the gas law holds, and only the compressor at the heart of the deck could.'
  },
  'unit04/boss-compressor': {
    scene: 'warm-cylinder',
    beats: [
      { to: 0.25, say: 'The compressor has ceased operation after each gas subsystem was stabilized.' },
      { to: 0.5, say: 'The Compressor stands cold in its housing. In its vault is a sealed cylinder logged at one pressure for twelve days while the deck froze fifty degrees around it.' },
      { to: 0.75, say: 'Gay-Lussac\'s law says no sealed gas can do that unless something inside is giving off heat. The cylinder goes into the Case File.' }
    ],
    filed: 'Filed: a heat source ran inside the Fifth\'s cylinder for twelve days, and no chemical reaction lasts that long.'
  },
  /* ---- Ember Reach: the Fifth's manifold is frosted over, so what runs inside it takes heat in ---- */
  /* ---- Kettle: the forged ledger ---- */
  'unit07/q1-recipe': {
    scene: 'three-scoops',
    beats: [
      { to: 0.22, say: 'Three scoops from three floors, and every molecule in them is the same: two hydrogens joined to one oxygen.' },
      { to: 0.5, say: 'Loose atoms stirred in beside them do not change the molecule. A compound keeps its recipe, and the extras just sit there.' },
      { to: 0.74, say: 'Joining only rearranges atoms, so the atoms weigh the same loose or joined.' },
      { to: 0.94, say: 'The recipe fixes the shares too: oxygen is 16.0 of every 18.0, the same in every scoop.' }
    ],
    filed: 'Filed: a compound holds the same share of each element every time, so ore\'s share of metal can be worked out.'
  },
  'unit07/boss-golem': {
    scene: 'golem-vault',
    beats: [
      { to: 0.22, say: 'Every phase was a bench you had already worked: a heap, a recipe board, a pot, a furnace and a ledger. That was enough to read the golem.' },
      { to: 0.5, say: 'Its valves close and the steam stops. A recipe with nothing left to run on has nothing left to make.' },
      { to: 0.7, say: 'Behind it is a vault, and in the vault is the ledger: ore in, metal out.' },
      { to: 0.92, say: 'The ore in the ledger can give at most 27.9 tons of iron. The ledger claims 50.0, so 22.1 tons of it came from nowhere the ore could supply.' }
    ],
    filed: 'Filed: the ledger claims 22.1 tons of iron that its ore cannot give, so something else supplied it.'
  },
  'unit07/q4-balance': {
    scene: 'recipe-board',
    beats: [
      { to: 0.26, say: 'The furnace recipe lists the reactants, Fe₂O₃ and CO, and the products, Fe and CO₂. Count the atoms and the sides disagree: oxygen is 4 on the left and 2 on the right.' },
      { to: 0.6, say: 'A coefficient in front of a formula counts molecules, so it changes the atom counts and leaves each substance alone. Raise them one at a time and the rows come closer.' },
      { to: 0.94, say: 'At 1, 3, 2 and 3 every row agrees: 2 iron, 3 carbon and 6 oxygen on each side.' }
    ],
    filed: 'Filed: the furnace recipe, Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂, is balanced: every atom of the ore is accounted for.'
  },
  'unit07/q2-names': {
    scene: 'crate-labels',
    beats: [
      { to: 0.3, say: 'Ions carry charges and a compound carries none. One magnesium ion cancels two chlorine ions, so the formula counts the ions in that smallest group: MgCl₂.' },
      { to: 0.6, say: 'A name says the same in words. The metal keeps its name and the other ion takes the ending -ide, so Mg²⁺ with O²⁻ is magnesium oxide.' },
      { to: 0.94, say: 'In Fe₂O₃ the three oxide ions hold 6− between them, so each of the two irons is 3+. The Roman numeral is that charge, not a count: iron(III) oxide.' }
    ],
    filed: 'Filed: the manifest\'s ore is iron(III) oxide, Fe₂O₃, a compound with a fixed share of metal.'
  },
  'unit07/q3-change': {
    scene: 'sealed-pot',
    beats: [
      { to: 0.27, say: 'In an open pot, burning iron takes oxygen from the air, so the balance counts more atoms and reads more.' },
      { to: 0.52, say: 'The gases a burn makes float out of an open pot, so the balance counts fewer atoms and reads less.' },
      { to: 0.77, say: 'Seal the lid and nothing gets in or out. The atoms only join up differently, so the balance reads the same before and after.' },
      { to: 0.94, say: 'The balance changes only when atoms cross the lid. A sealed pot makes nothing and loses nothing.' }
    ],
    filed: 'Filed: a sealed pot weighs the same before and after, so the ledger\'s extra metal came from somewhere.'
  },
  'unit07/q6-stoich': {
    scene: 'furnace-ledger',
    beats: [
      { to: 0.24, say: 'An equation counts molecules, not grams. Two hydrogens and one oxygen make two waters, and the weights still add to 36.0 on both sides.' },
      { to: 0.5, say: 'So grams reach grams through moles. Three hydrogens to two ammonias is a ratio of moles, whatever they weigh.' },
      { to: 0.72, say: 'Feed two reactants and the pot stops when one runs out. What is left of the other is the excess.' },
      { to: 0.94, say: 'Forty tons of ore can give at most 28.0 tons of iron. A real furnace keeps only a part of that.' }
    ],
    filed: 'Filed: forty tons of ore can give at most 28 tons of iron, so a ledger that shows fifty is forged.'
  },
  'unit07/q7-titrate': {
    scene: 'burette-count',
    beats: [
      { to: 0.24, say: 'A burette lets base into the acid in measured drops, and its reading is the drops counted. Here each drop is half a millilitre.' },
      { to: 0.5, say: 'Every drop holds the same moles of base, and each mole of base uses up a mole of acid. The flask is counted against the drops, disc for disc.' },
      { to: 0.74, say: 'When the discs match, that is the equivalence point. The dye turns on the very next drop, which is the endpoint.' },
      { to: 0.95, say: 'So the acid\'s strength is the base\'s strength times the volume counted, over the volume in the flask.' }
    ],
    filed: 'Filed: the pickling bath is 0.450 mol/L sulfuric acid, so the foundry\'s acid use can be checked against its ledger.'
  },
  'unit07/q8-kinds': {
    scene: 'furnace-log',
    beats: [
      { to: 0.24, say: 'The furnace log lists the ore reaction. In Fe₂O₃ each iron atom carries +3 and each oxygen −2, and all together they add up to the charge of the ore, 0.' },
      { to: 0.5, say: 'The other reactant is CO. Its carbon carries +2 and its oxygen −2, worked the same way.' },
      { to: 0.78, say: 'Six electrons move, two from each carbon to three on each iron. Iron falls from +3 to 0, so it gained electrons and was reduced; carbon rises to +4 and is oxidised.' },
      { to: 0.97, say: 'The oxygen leaves the ore for the carbon. That is a redox reaction, and what stays behind is iron.' }
    ],
    filed: 'Filed: the furnace log shows the ore giving up its oxygen to carbon, so the ore was reduced, not made from nothing.'
  },
  'unit05/q1-flow': {
    scene: 'frost-manifold',
    beats: [
      { to: 0.25, say: 'Heat is energy crossing from a hotter body to a colder one until both read the same. A temperature says how fast the particles move, not how much energy a body can hand over.' },
      { to: 0.5, say: 'A thermometer in a bath reports on the surroundings of whatever is reacting: a bath that cools means heat is going into the chemicals, which is endothermic.' },
      { to: 0.75, say: 'On the overlook, the Fifth\'s manifold is furred with frost in the middle of a hot caldera. Frost on the pipes means heat is going into the manifold.' }
    ],
    filed: 'Filed: the manifold is taking heat in, so something inside it is running an endothermic change.'
  },
  'unit05/q2-calorimetry': {
    scene: 'heat-swap',
    beats: [
      { to: 0.3, say: 'Drop a hot block into cool water and the block cools while the water warms. Heat moves until the two read the same temperature.' },
      { to: 0.64, say: 'They meet where the heat the block lost has gone into the water. Nothing is made or lost on the way.' },
      { to: 0.86, say: 'Heat follows q = m × c × ΔT, and the two sides come to the same number of joules. A calorimeter measures one side to learn the other.' }
    ],
    filed: 'Filed: a calorimeter reads a reaction\'s heat from the temperature change of a known mass of water.'
  },
  'unit05/q3-enthalpy': {
    scene: 'fuel-bars',
    beats: [
      { to: 0.3, say: 'The heat a reaction gives out grows in step with how much reacts: twice the moles, twice the heat.' },
      { to: 0.6, say: 'Per mole, methane gives out the most of these four fuels and hydrogen the least.' },
      { to: 0.85, say: 'Per gram the order turns over, and hydrogen leads by a wide margin. A mole of hydrogen weighs so little that its mass carries a lot of heat.' }
    ],
    filed: 'Filed: a fuel\'s heat can be worked out from its moles or its grams before any of it is burned.'
  },
  'unit05/q4-bonds': {
    scene: 'bond-ledger',
    beats: [
      { to: 0.2, say: 'Breaking a bond takes energy in. Pulling the hydrogen pair apart costs 436 kJ for every mole.' },
      { to: 0.4, say: 'Splitting chlorine costs another 242, so four separate atoms stand 678 kJ above where the reaction began.' },
      { to: 0.78, say: 'Forming a bond gives energy back, 431 for each H–Cl. Two of them return 862, more than was paid, so the reaction gives out 184 kJ.' }
    ],
    filed: 'Filed: adding the bonds broken and the bonds formed predicts a reaction\'s heat without running it.'
  },
  'unit05/q6-entropy': {
    scene: 'spread-count',
    beats: [
      { to: 0.4, say: 'Lift the partition and the gas spreads through the whole box, though nothing pushes it there.' },
      { to: 0.7, say: 'Count the ways eight particles can split between the halves. An even split can happen in 70 ways, and all eight on one side in just 1.' },
      { to: 0.9, say: 'That count of ways is what entropy measures. A gas spreads out because spread-out arrangements are overwhelmingly the most numerous.' }
    ],
    filed: 'Filed: a change can now be scored by how many more ways it opens up, as well as by its heat.'
  },
  'unit05/q5-hess': {
    scene: 'two-routes',
    beats: [
      { to: 0.25, say: 'The heat of a reaction depends only on where it starts and where it finishes. So steps can be added, turned round and doubled.' },
      { to: 0.5, say: 'A reaction nobody can run can still be worked out from ones that were measured, because measured from the elements, every compound sits at a height of its own.' },
      { to: 0.75, say: 'The straight shaft at the separator is sealed, but the stepped pipe beside it starts and ends in the same two places. Heat counts only those two places, so the open pipe gives the same total.' }
    ],
    filed: 'Filed: the sealed shaft carries the same heat as the open pipe, so no route can hide it.'
  },
  'unit05/q7-gibbs': {
    scene: 'seal-crossing',
    beats: [
      { to: 0.25, say: 'Two pulls decide whether a change runs on its own: the heat it gives out or takes in, and the spreading it gains.' },
      { to: 0.5, say: 'The free energy, ΔG = ΔH − TΔS, sets them against each other, and temperature turns up the spreading until a change that takes heat in can still run.' },
      { to: 0.75, say: 'Ice melts at 273 K because that is where the heat it costs and the spreading it gains are equal, and the limestone seal on the Fifth\'s siphon core gives way only above its own crossing.' }
    ],
    filed: 'Filed: the siphon core is sealed until it is hot enough, and I can now find that temperature.'
  },
  'unit05/boss-crucible': {
    scene: 'crucible-open',
    beats: [
      { to: 0.25, say: 'Every phase was a bench you had already worked: a bath, a ledger of bonds, a stack of steps, a table of entropies and a balance of two terms. That was enough to read the machine.' },
      { to: 0.5, say: 'The Crucible splits along its firebrick seams. Inside is a heat exchanger that carried megawatts away from the shelters without a wisp of steam reaching the sky.' },
      { to: 0.75, say: 'Below the exchanger, a pipe runs down into the crust. The siphon manifold goes into the Case File.' }
    ],
    filed: 'Filed: the raiders were feeding an endothermic process far below the crust, and no thermometer at the surface could have seen it.'
  },
  /* ---- Lanternfall (unit02): who dimmed the beacons, and what is the Fifth lighting with a lens no guild lamp can make? ---- */
  'unit02/q1-wave': {
    scene: 'wave-beacon',
    beats: [
      { to: 0.25, say: 'Light is a wave, and every wave has a wavelength and a frequency that trade against each other through one fixed speed, 3.00 × 10⁸ metres per second.' },
      { to: 0.5, say: 'What the eye calls colour is a thin slice of the electromagnetic spectrum. A radio mast, an oven and an X-ray tube sit on the same scale, at other wavelengths.' },
      { to: 0.75, say: 'Red and violet cross the same gap in the same time. Next I want to know why a bright red lamp cannot knock an electron loose when a faint violet one can.' }
    ],
    filed: 'Filed: the beacons\' light can be told from any other wave by its wavelength alone.'
  },
  'unit02/q2-photon': {
    scene: 'photon-plate',
    beats: [
      { to: 0.25, say: 'Light comes in packets called photons, and each photon\'s energy is set by its frequency. An electron leaves a metal only if one photon carries more than the metal\'s work function.' },
      { to: 0.5, say: 'No number of weaker photons can add up to it. A photon of red carries too little, however many arrive, while one photon of violet is enough.' },
      { to: 0.75, say: 'Energy comes in amounts, not smooth slopes, so electrons can only hold certain energies. The sky over this ice glows in a few sharp colours, and I want to know why.' }
    ],
    filed: 'Filed: the beacon plates still answer, but only to violet; red at any strength leaves them dark.'
  },
  'unit02/q3-lines': {
    scene: 'line-gas',
    beats: [
      { to: 0.2, say: 'An atom\'s electrons sit only on certain energy levels, in the ground state or in an excited state. Light is given out or taken in exactly when an electron moves between two levels.' },
      { to: 0.4, say: 'So a glowing gas gives an emission spectrum of a few exact lines that no other gas shares, where a hot solid gives a continuous spectrum.' },
      { to: 0.6, say: 'Every aurora, neon sign and star is read this way: the colours say which atoms are there, and the dark lines of an absorption spectrum say which cool atoms lie in front.' },
      { to: 0.8, say: 'The ladder only fits hydrogen, because an electron is not a bead on a rung. I want to know where an electron actually is.' }
    ],
    filed: 'Filed: the sealed tube among the beacons holds helium, named by its lines alone.'
  },
  'unit02/q4-cloud': {
    scene: 'cloud-ball',
    beats: [
      { to: 0.25, say: 'An electron has no path. Five hundred shots find it in five hundred places, and together they make a ball, not a ring.' },
      { to: 0.5, say: 'What it has is an orbital, a cloud of probability: round for s, two-lobed for p, four-lobed or ringed for d. Each orbital holds a standing wave that fits its shell.' },
      { to: 0.75, say: 'Every bond is made of these clouds overlapping, and every shape a molecule takes follows from how they point. Next, every electron gets an address.' }
    ],
    filed: 'Filed: the beacon gases are lit by electrons that have no path, only clouds with a shape.'
  },
  'unit02/q5-numbers': {
    scene: 'rack-address',
    beats: [
      { to: 0.25, say: 'Numbers name every box: n for its shell, l for its shape and ml for its orientation.' },
      { to: 0.5, say: 'A box holds two electrons that point opposite ways, and no two electrons in an atom share all four numbers. From that one rule the capacity of every shell follows.' },
      { to: 0.75, say: 'The rows of the periodic table are those shells counted out loud: two, eight, eighteen. Next I fill the boxes in the order an atom actually does.' }
    ],
    filed: 'Filed: the records board is sorted by address again, and no electron on it shares all four numbers with another.'
  },
  'unit02/q6-filling': {
    scene: 'rack-fill',
    beats: [
      { to: 0.25, say: 'Electrons fill the lowest rows first and spread across a row before pairing, so carbon\'s last two stand alone.' },
      { to: 0.5, say: 'The ladder is ordered by energy and not by shell, so potassium\'s last electron settles in the fourth shell while the third is still not full.' },
      { to: 0.75, say: 'Nearly everything an element does follows from its outer rows, written down in energy order. Next I measure what each electron costs.' }
    ],
    filed: 'Filed: the board fills from lowest energy up, so its rows can be trusted.'
  },
  'unit02/q7-pes': {
    scene: 'peak-rows',
    beats: [
      { to: 0.25, say: 'A photoelectron spectrum has one peak for every row of electrons. Its height is how many electrons the row holds, and its position is how tightly they are held.' },
      { to: 0.5, say: 'It is the configuration measured instead of written, and the experiment that proved the rows you filled on the rack are real. Nobody drew the ladder in; the spectrum shows it.' },
      { to: 0.75, say: 'The specimen left at the tower shows peaks of two, two and four. Binding energy has a pattern across the whole table, and the next bench follows it.' }
    ],
    filed: 'Filed: the unlabelled specimen at the tower has peaks of two, two and four, so it is oxygen.'
  },
  'unit02/q8-trends': {
    scene: 'radii-row',
    beats: [
      { to: 0.25, say: 'One law explains the table: charge pulls, distance weakens the pull, and the electrons in between cancel some of the charge.' },
      { to: 0.5, say: 'Across a row each atom has more protons and is smaller, because the extra charge pulls the same shell in. Radius and ionization energy are that law measured two ways.' },
      { to: 0.75, say: 'Nearly every property a chemist predicts starts from where an element sits on the table. I sort the camp\'s metal stock by size and by what it costs to strip an electron.' }
    ],
    filed: 'Filed: the camp\'s metals can be sorted by size and by what it costs to strip an electron.'
  },
  'unit02/q9-absorb': {
    scene: 'beam-dim',
    beats: [
      { to: 0.25, say: 'A solution looks the colour of the light it leaves behind: copper takes orange out of white light and leaves blue, its complementary colour.' },
      { to: 0.5, say: 'The absorbance of a coloured solution rises in step with its concentration, so a reading of light measures an amount of matter.' },
      { to: 0.75, say: 'Three standards draw the calibration line, and the sealed tank sample\'s reading is read back off it. Pharmacies, water labs and hospitals measure what is dissolved the same way.' },
      { to: 0.9, say: 'One feeder still haunts the ice: the Lantern-Eater, made of everything you have measured here.' }
    ],
    filed: 'Filed: the sealed tank water holds copper at 5 millimoles a litre, read from the calibration line.'
  },
  'unit02/boss-eater': {
    scene: 'eater-lens',
    beats: [
      { to: 0.25, say: 'Every phase of that fight was a bench you had already worked: a line, a photon, a magnet, a spectrum and a beam.' },
      { to: 0.5, say: 'The Lantern-Eater has collapsed into shimmering ice. In its core lies a precision lens ground from fluorite, for light shorter than violet.' },
      { to: 0.75, say: 'No guild lamp gives light that short. Someone put high-energy optics here on purpose.' },
      { to: 0.9, say: 'The lens goes into the Case File. Across the fog rise the crystal lattices of Ligar, held together by the very electron pairs you have mapped.' }
    ],
    filed: 'Filed: a lens ground for ultraviolet was feeding the Eater, and no guild lamp can make light that short.'
  },

  /* ---- Mirrowen: what is the canal ice made of, and why does it stay solid when the water beside it does not? ---- */
  'unit06/q2-grip': {
    scene: 'grip-bars',
    beats: [
      { to: 0.3, say: 'A bigger cloud holds its neighbours harder. Helium needs 0.08 kJ a mole to pull apart and xenon 12.6.' },
      { to: 0.64, say: 'Water weighs 18 g a mole and hydrogen sulfide 34, yet water needs 40.7 kJ and hydrogen sulfide 18.7. A hydrogen bond beats weight.' },
      { to: 0.9, say: 'Even so, breaking every O–H bond in a mole of water takes 926 kJ. The forces between molecules are a sliver of the bonds inside them.' }
    ],
    filed: 'Filed: water grips twice as hard as a molecule nearly twice its weight, so the canal ice is held by more than size.'
  },
  'unit06/q1-states': {
    scene: 'states-three',
    beats: [
      { to: 0.28, say: 'A solid keeps its shape, a liquid keeps its volume and a gas fills its jar. Each jar holds the same eight molecules of water.' },
      { to: 0.62, say: 'Carry the jar from solid to liquid to gas and the reader names H₂O the whole way. The molecules only change places, so no bond breaks.' },
      { to: 0.9, say: 'A litre of liquid water weighs about 1,700 times a litre of steam, so a gas is mostly empty space. Melting and boiling overcome the intermolecular forces between molecules, never the bonds inside them.' }
    ],
    filed: 'Filed: ice and water are one molecule, so ice is water held still by what lies between its molecules.'
  },
  'unit06/q3-boil': {
    scene: 'boil-flask',
    beats: [
      { to: 0.32, say: 'In a sealed flask molecules leave the liquid and come back to it. The gauge stops rising when the leaving and the returning match, and that steady pressure is the vapor pressure.' },
      { to: 0.66, say: 'Warming the liquid sends more molecules into the vapor, so its vapor pressure climbs: water pushes at 3.2 kPa at 25 °C and at 47.3 kPa at 80 °C.' },
      { to: 0.92, say: 'A liquid boils when its vapor pressure reaches the pressure outside it. Water does that at 100 °C at sea level, and at 88 °C where the outside pressure is 65 kPa.' }
    ],
    filed: 'Filed: the canal water leaves as vapor at any temperature, faster when warm, and boils where its vapor pressure meets the air\'s.'
  },
  'unit06/q4-solids': {
    scene: 'solid-order',
    beats: [
      { to: 0.32, say: 'Iodine, naphthalene and ice all melt below 115 °C, and their molecules are still whole afterwards. Only the grips between the molecules gave way.' },
      { to: 0.7, say: 'Quartz held its shape to 1713 °C and then ran. Fused silica, made of the same atoms, went soft a little at a time from 1040 to 1585 °C.' },
      { to: 0.9, say: 'In the crystal every silicon has the same angles, so every bond gives way together. In glass the angles differ, so the bonds give way a few at a time.' }
    ],
    filed: 'Filed: ice melts at one temperature where glass softens over a range, so the ice sheets are crystals and not glass.'
  },
  'unit06/q5-crossing': {
    scene: 'crossing-curve',
    beats: [
      { to: 0.3, say: 'A heating curve climbs while heat warms the ice, then stands still at 0 °C while 6.01 kJ a mole goes in.' },
      { to: 0.62, say: 'The heat is not lost. It frees the molecules, from the ice and then from the liquid, and boiling a mole takes 40.65 kJ.' },
      { to: 0.9, say: 'Run it back and the steam condenses and the water freezes, giving out the same heat. The way down totals −54.9 kJ.' }
    ],
    filed: 'Filed: ice took 6.01 kJ a mole at 0 °C without warming, so the heat went into the grip between its molecules.'
  },
  'unit06/q6-solution': {
    scene: 'solution-drop',
    beats: [
      { to: 0.28, say: 'Dissolved salt is not gone. Its ions leave the crystal one by one and spread through the water, each with water molecules wrapped round it.' },
      { to: 0.54, say: 'Four pieces of sodium chloride make eight particles, four of calcium chloride make twelve, and four of sugar make four. Molarity counts the pieces, not the particles.' },
      { to: 0.8, say: 'Topping a flask up with water leaves the moles alone and spreads them over more litres. Twenty-five mL of 2.00 M stock made up to 100 mL is 0.500 M.' },
      { to: 0.96, say: 'Dissolving also moves heat. Calcium chloride warmed the bath, and sodium chloride, potassium chloride and ammonium nitrate cooled it.' }
    ],
    filed: 'Filed: a dissolved salt stays in the canal as separate ions, so the agent can be counted in moles for each litre.'
  },
  'unit06/q7-separate': {
    scene: 'pull-apart',
    beats: [
      { to: 0.34, say: 'Filter paper stops what is too big for its pores, but dissolved salt passes through with the water. The filtrate is as salty as what went in, so the agent cannot be filtered out.' },
      { to: 0.66, say: 'On paper, each dye climbs as far as its grip on the paper and on the liquid allow, so water and hexane with acetone put the same three dyes in opposite orders.' },
      { to: 0.9, say: 'In the still the liquid held least tightly comes over first: acetone, then ethanol, then water, each vial richer in one but never pure. Boiling the water off leaves the dissolved agent in the flask.' }
    ],
    filed: 'Filed: filter paper cannot take the dissolved agent out of the canal water, but boiling the water off leaves it behind.'
  },
  'unit06/boss-undertow': {
    scene: 'undertow-finale',
    beats: [
      { to: 0.3, say: 'Every phase of that fight was a bench you had worked: a jar sorted by state, liquids ranked by grip, a boiling point, a heat counted stretch by stretch and a brine thinned.' },
      { to: 0.6, say: 'The Undertow let go when the readings stopped agreeing with its hold. It slumps back into grey brine along the quay.' },
      { to: 0.85, say: 'What it was drawing on has a grip on water and thins like any solution. It was made to be taken out again.' }
    ],
    filed: 'Filed: the freezing agent behaves like a made liquid and not a mined salt: it dissolves, it thins and it boils off.'
  },
};

/** The story animation a quest ends on, or null. */
export const storyFor = key => QUEST_STORY[key] || null;

/** The session flag that records an animation as seen. It gates nothing: a quest ends on it every time. */
export const storyFlag = key => `storyAnim:${key}`;

/** The lines Vess says over a quest's scene, in order, each with the scene time its picture ends on: the beats, then the filed line. */
export function storyLines(story) {
  return [...story.beats.map(b => ({ say: b.say, to: b.to })), { say: story.filed, to: 1, filed: true }];
}
