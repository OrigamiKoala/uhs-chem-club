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
    captions: [
      'Every pair that held filled both outer shells, and a pair with a full shell already came apart.',
      'The rubble round the tunnel mouth is only atoms held together this way.'
    ],
    filed: 'Filed: the blast broke the rock apart, but every bond in the rubble is an ordinary one.'
  },
  'unit03/q2-lattice': {
    scene: 'liner-heat',
    captions: [
      'Salt gave way at 801 degrees and passed a current only once it was molten.',
      'Only the covalent network stayed solid at 900 degrees and passed none, so it makes the liner.'
    ],
    filed: 'Filed: a liner of covalent network will hold the trapped miners\' vessel at 900 degrees without passing a current.'
  },
  'unit03/q3-distance': {
    scene: 'well-depth',
    captions: [
      'A bond is a well, and the deeper it is, the more energy it takes to pull the atoms apart.',
      'A breaker charge has to carry more than the bond it must break.'
    ],
    filed: 'Filed: the breaker charges are sized to the strongest bond in the pass.'
  },
  'unit03/q7-polarity': {
    scene: 'field-swing',
    captions: [
      'Water swung round in the field and carbon dioxide stayed put, however polar its bonds.',
      'A charged rod bent the stream of water too, so a whole liquid shows what its molecules do.'
    ],
    filed: 'Filed: the gases that cling to the rescue gear are the polar ones, and a charged rod can pick them out.'
  },
  'unit03/q9-orbitals': {
    scene: 'magnet-pull',
    captions: [
      'A magnet pulled on oxygen because two of its electrons stand alone, and no drawing of pairs shows that.',
      'Nitrogen, with every electron paired, was left where it was.'
    ],
    filed: 'Filed: a magnet can find the oxygen in the pass, however it is hidden among the other gases.'
  },
  'unit03/boss-warden': {
    scene: 'warden-cut',
    captions: [
      'The warden settles back into quarry stone, and the slab behind it has been cut clean through.',
      'The cut runs through ionic and covalent rock alike, and no bond in Ligar gives way so evenly.'
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
    captions: [
      'A gauge on the floor, on the side wall and on the roof of a sealed box all read the same.',
      'The gas is not pressing down with its weight: its particles are knocking on every wall alike.'
    ],
    filed: 'Filed: the station\'s gauges read true, so the pressure in the jammed holders is genuine and not a faulty needle.'
  },
  'unit04/q2-laws': {
    scene: 'cold-tank',
    captions: [
      'A sealed tank left out in the cold must lose pressure in step with its kelvin temperature.',
      'Cool one by fifty degrees and its gauge falls by about a sixth.'
    ],
    filed: 'Filed: a sealed tank that keeps its pressure through the cold must have something inside it giving off heat.'
  },
  'unit04/q3-ideal': {
    scene: 'equal-rooms',
    captions: [
      'A mole of helium and a mole of carbon dioxide fill the same room, though one weighs eleven times the other.',
      'So a gauge, a room and a temperature are enough to count what is inside a sealed tank.'
    ],
    filed: 'Filed: every sealed tank on the station can now be counted from its plate without opening it.'
  },
  'unit04/q4-mixtures': {
    scene: 'mix-share',
    captions: [
      'In a mixture each gas pushes as if it were alone, and the gauge simply adds the pushes together.',
      'Whatever the Fifth added to the fuel line will show up as a push of its own.'
    ],
    filed: 'Filed: any gas the Fifth has added to a tank can be read off its own share of the push.'
  },
  'unit04/q5-speed': {
    scene: 'leak-race',
    captions: [
      'Lighter gases leak first, so how fast a gas escapes tells you how heavy its particles are.',
      'The leak at the vent stack emptied at the same pace as krypton.'
    ],
    filed: 'Filed: the leak at the vent stack is krypton.'
  },
  'unit04/q6-real': {
    scene: 'crowd-and-pull',
    captions: [
      'Squeezed hard, a gas pushes harder than the gas law says, because its particles take up room.',
      'Cooled, it pushes less, because its particles pull on each other, and that pull is what makes a liquid.'
    ],
    filed: 'Filed: the Fifth packed the tanks past where the gas law holds, and only the compressor at the heart of the deck could.'
  },
  'unit04/boss-compressor': {
    scene: 'warm-cylinder',
    captions: [
      'The Compressor settles, and in its vault stands a sealed cylinder logged at one pressure for twelve days.',
      'The deck froze fifty degrees around it, but a sealed gas cannot hold its pressure through that unless something inside is giving off heat.'
    ],
    filed: 'Filed: a heat source ran inside the Fifth\'s cylinder for twelve days, and no chemical reaction lasts that long.'
  },
  /* ---- Ember Reach: the Fifth's manifold is frosted over, so what runs inside it takes heat in ---- */
  'unit05/q1-flow': {
    scene: 'frost-manifold',
    captions: [
      'On the overlook, the Fifth\'s manifold is furred with frost in the middle of a hot caldera.',
      'A bath that cools means heat is going into the chemicals, so frost on the pipes means heat is going into the manifold.'
    ],
    filed: 'Filed: the manifold is taking heat in, so something inside it is running an endothermic change.'
  },
  'unit05/q5-hess': {
    scene: 'two-routes',
    captions: [
      'The straight shaft at the separator is sealed, but the stepped pipe beside it starts and ends in the same two places.',
      'Heat counts only those two places, so the open pipe gives the same total as the shaft nobody can open.'
    ],
    filed: 'Filed: the sealed shaft carries the same heat as the open pipe, so no route can hide it.'
  },
  'unit05/q7-gibbs': {
    scene: 'seal-crossing',
    captions: [
      'Ice melts at 273 K because that is where the heat it costs and the spreading it gains are equal.',
      'The limestone seal on the Fifth\'s siphon core is a change of the same kind, and it gives way only above its own crossing.'
    ],
    filed: 'Filed: the siphon core is sealed until it is hot enough, and Vess can now find that temperature.'
  },
  'unit05/boss-crucible': {
    scene: 'crucible-open',
    captions: [
      'The Crucible splits along its firebrick seams, and inside is a heat exchanger that carried megawatts away without a wisp of steam.',
      'Below the exchanger, a pipe runs down into the crust.'
    ],
    filed: 'Filed: the raiders were feeding an endothermic process far below the crust, and no thermometer at the surface could have seen it.'
  },
  /* ---- Lanternfall (unit02): who dimmed the beacons, and what is the Fifth lighting with a lens no guild lamp can make? ---- */
  'unit02/q1-wave': {
    scene: 'wave-beacon',
    captions: [
      'Red and violet light cross the same gap in the same time, so a lamp can be told apart only by its wavelength.',
      'Vess lays the camp\'s radio mast, oven and X-ray tube on the same scale as the beacon lamps.'
    ],
    filed: 'Filed: the beacons\' light can be told from any other wave by its wavelength alone.'
  },
  'unit02/q2-photon': {
    scene: 'photon-plate',
    captions: [
      'Each photon of red carries too little energy to free an electron, however many arrive.',
      'One photon of violet is enough, so a dim violet lamp wakes a plate that the brightest red leaves dark.'
    ],
    filed: 'Filed: the beacon plates still answer, but only to violet; red at any strength leaves them dark.'
  },
  'unit02/q3-lines': {
    scene: 'line-gas',
    captions: [
      'A glowing gas gives only a few exact lines, and no other gas gives the same few.',
      'The sealed tube found among the beacons gives helium\'s lines, and no other strip fits it.'
    ],
    filed: 'Filed: the sealed tube among the beacons holds helium, named by its lines alone.'
  },
  'unit02/q4-cloud': {
    scene: 'cloud-ball',
    captions: [
      'Five hundred shots find the electron in five hundred places, and together they make a ball, not a ring.',
      'No path can be drawn through the dots, only a cloud with a shape.'
    ],
    filed: 'Filed: the beacon gases are lit by electrons that have no path, only clouds with a shape.'
  },
  'unit02/q5-numbers': {
    scene: 'rack-address',
    captions: [
      'Every box on the records board has an address, and a box takes two electrons pointing opposite ways at most.',
      'No two electrons in an atom share all four numbers.'
    ],
    filed: 'Filed: the records board is sorted by address again, and no electron on it shares all four numbers with another.'
  },
  'unit02/q6-filling': {
    scene: 'rack-fill',
    captions: [
      'Carbon\'s rack pulls on the magnet as the real sample does once its last two electrons stand alone.',
      'Potassium\'s last electron settles in the fourth shell while the third is still not full.'
    ],
    filed: 'Filed: the board now matches the magnet for carbon, oxygen and potassium, so its rows can be trusted.'
  },
  'unit02/q7-pes': {
    scene: 'peak-rows',
    captions: [
      'Each peak on a spectrum is a row of electrons, and its height counts how many are in it.',
      'The specimen left at the tower shows peaks of two, two and four.'
    ],
    filed: 'Filed: the unlabelled specimen at the tower has peaks of two, two and four, so it is oxygen.'
  },
  'unit02/q8-trends': {
    scene: 'radii-row',
    captions: [
      'Across a row each atom has more protons and is smaller, because the extra charge pulls the same shell in.',
      'Vess sorts the camp\'s metal stock by size and by what it costs to strip an electron.'
    ],
    filed: 'Filed: the camp\'s metals can be sorted by size and by what it costs to strip an electron.'
  },
  'unit02/q9-absorb': {
    scene: 'beam-dim',
    captions: [
      'Copper takes orange out of white light and leaves blue, and the more copper there is, the more orange it takes out.',
      'Three standards draw the calibration line, and the sealed tank sample\'s reading is read back off it.'
    ],
    filed: 'Filed: the sealed tank water holds copper at 5 millimoles a litre, read from the calibration line.'
  },
  'unit02/boss-eater': {
    scene: 'eater-lens',
    captions: [
      'The Lantern-Eater settles into cold ice, and in its core lies a lens ground for light shorter than violet.',
      'No guild lamp gives light that short.'
    ],
    filed: 'Filed: a lens ground for ultraviolet was feeding the Eater, and no guild lamp can make light that short.'
  }
};

/** The story animation a quest ends on, or null. */
export const storyFor = key => QUEST_STORY[key] || null;

/** The session flag that records an animation as seen. It gates nothing: a quest ends on it every time. */
export const storyFlag = key => `storyAnim:${key}`;

/** The lines Vess says over a quest's scene, in order, each with the scene time its picture ends on: the beats, then the filed line. */
export function storyLines(story) {
  return [...story.beats.map(b => ({ say: b.say, to: b.to })), { say: story.filed, to: 1, filed: true }];
}
