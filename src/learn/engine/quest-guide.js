/**
 * quest-guide.js — Clear, elementary-school-friendly Chemistry & Mission Guides.
 *
 * Explains:
 * 1. The core chemistry concept being taught (atoms, isotopes, bonds, etc.)
 * 2. The storyline mission context (why our research crew is testing this)
 * 3. What each stage is asking in plain, simple English
 * 4. Step-by-step how to explore with the bench instruments
 *
 * RULE: NEVER tells the user what to do, NEVER gives away any answers or clues.
 * The student must use the scientific method to test, observe, and figure it out!
 */

export const QUEST_GUIDES = {
  "q1-grain": {
    "title": "Atoms, Elements and Mixtures",
    "concept": "Atoms & Matter Classification",
    "overview": "Everything in the universe is made of tiny building blocks called ATOMS. When all atoms in a material are identical, it is a pure ELEMENT. When different kinds of atoms are combined without being chemically glued together, it is a MIXTURE that can be physically separated.",
    "storyline": "Our expedition is surveying raw mineral shipments on Tallow. A supplier claims their ore crates are pure refined element, but unbonded dirt or physical mixtures will jam the smelter. We use the microscope, cutter, and settling tank to classify each sample so we only load pure materials!",
    "vocab": [
      {
        "word": "Atom",
        "meaning": "The smallest individual particle of ordinary matter."
      },
      {
        "word": "Element",
        "meaning": "A pure substance made of only one kind of atom."
      },
      {
        "word": "Mixture",
        "meaning": "A blend of different substances that can be separated by physical sorting, cutting, or settling."
      },
      {
        "word": "Molecule",
        "meaning": "Two or more atoms bonded together in a fixed recipe."
      },
      {
        "word": "Compound",
        "meaning": "A substance formed when two or more DIFFERENT elements bond together."
      },
      {
        "word": "Power Dial",
        "meaning": "Turns the microscope magnification up or down."
      }
    ],
    "stages": {
      "0": {
        "goal": "Find the lowest microscope magnification power where the solid material stops looking smooth and reveals separate individual grains.",
        "science": "Matter is particulate: even solids that look completely smooth to our eyes are made of distinct individual particles (atoms).",
        "storyProblem": "A raw ore crate looks like a solid smooth metal block to the naked eye. We need to find the magnification where separate particle grains appear to verify if it is particulate matter.",
        "howToTest": "Turn the Power dial to increase magnification step by step. Watch how the appearance changes, and select the first power where separate grains clearly appear.",
        "visualFormula": "Matter is Particulate: Continuous Bulk Surface ➔ Magnified Individual Atoms"
      },
      "1": {
        "goal": "Examine two grey powder samples under the microscope and determine which one is made from only one kind of atom.",
        "science": "A pure element contains only one kind of atom, while a mixture contains two or more different kinds.",
        "storyProblem": "Two grey powder shipments arrived. Our reactor requires a pure element. We must look at the particles to determine which shipment is a single pure element and which is an unsorted mixture.",
        "howToTest": "Select each sample and zoom in with the Power dial to observe the particles. Compare their colors, shapes, and kinds.",
        "visualFormula": "Pure Element (1 Particle Kind) vs Mixture (2+ Particle Kinds)"
      },
      "2": {
        "goal": "Count how many different kinds of atom are in this unsorted ore sample.",
        "science": "Elements each have distinct properties like atomic mass. Counting distinct particle types reveals how many elements are present.",
        "storyProblem": "An unsorted planetary gravel sample was brought in. Before smelting, we must count how many distinct chemical elements are mixed in the rock.",
        "howToTest": "Zoom in with the Power dial. Tap various atoms across the picture to read their properties and count how many unique kinds exist.",
        "visualFormula": "Count Unique Particle Types = Number of Elements Present"
      },
      "3": {
        "goal": "Test which of the four samples cannot be cut or split apart by the cutter blade.",
        "science": "Chemical tools and physical blades cannot divide a single atom into smaller pieces.",
        "storyProblem": "The cutter blade cuts through chunks of rock, but cannot slice an individual atom. Test which sample consists of indivisible fundamental atoms.",
        "howToTest": "Select each sample in turn and press \"Run Cutter\". Observe which sample remains completely unchanged before and after cutting.",
        "visualFormula": "Atoms Cannot Be Cut: Cutter Slices Rocks ➔ Single Atoms Remain Intact"
      },
      "4": {
        "goal": "This sample is made of repeating identical molecules. Build an exact copy of one molecule in the tray.",
        "science": "A molecule is a fixed group of bonded atoms. Its formula specifies the exact number of each atom.",
        "storyProblem": "A fuel canister holds identical repeating molecules. Replicate one molecule's exact atomic blueprint in the assembly tray to calibrate the synthesizer.",
        "howToTest": "Zoom in on Sample A. Tap the middle atom and the attached atoms to check their codes, then use the + buttons in the tray to add the matching atoms.",
        "visualFormula": "Molecule Formula: Fixed Ratio of Bonded Atoms"
      },
      "5": {
        "goal": "Both samples are made from the same kinds of atoms. File each sample under the recipe that matches its molecules.",
        "science": "Chemical compounds: different proportions of the same elements create entirely different chemical substances (like water H2O vs hydrogen peroxide H2O2).",
        "storyProblem": "Two fuel batches have the same elements, but in different ratios (like CO vs CO2). File each sample into the correct recipe bin to avoid engine misfires.",
        "howToTest": "Zoom in and inspect molecules in Sample A and Sample B. Count how many atoms of each kind are in one molecule, and match to the recipe bins.",
        "visualFormula": "Different Atom Ratios = Completely Different Chemical Compounds"
      },
      "6": {
        "goal": "Use the shaker to settle the samples and classify each as either a single pure substance or a mixture.",
        "science": "Physical separation: mixtures of unbonded substances separate into layers when shaken/settled, while pure substances remain in one even layer.",
        "storyProblem": "A dealer claims their mineral powder is a single dissolved substance. Shake and settle the samples to see if layers form, exposing an unbonded physical mixture!",
        "howToTest": "Select each sample and press \"Settle\". Watch how the particles settle into layers, then assign each sample to its bin.",
        "visualFormula": "Settling Test: Pure Substance = 1 Layer · Mixture = Multiple Settled Layers"
      },
      "7": {
        "goal": "Classify all four unknown samples as an element, a compound, or a mixture.",
        "science": "Classification of matter: elements have one kind of atom; compounds have different bonded atoms; mixtures have unbonded different substances.",
        "storyProblem": "Four mystery crates arrived at the loading dock. Fully classify each crate as an element, compound, or mixture so the warehouse files them correctly.",
        "howToTest": "Use the Power dial, Cutter, and Settle tools on each sample. Observe the particle structure and file each sample into its proper category.",
        "visualFormula": "Matter Classification: Element (1 Atom) | Compound (Bonded) | Mixture (Unbonded)"
      }
    }
  },
  "q2-core": {
    "title": "Inside an Atom",
    "concept": "Subatomic Particles (Protons, Neutrons, Electrons)",
    "overview": "An atom has a tiny, dense core called the NUCLEUS containing positive PROTONS and neutral NEUTRONS. Surrounding the nucleus are light, negative ELECTRONS orbiting in rings called SHELLS.",
    "storyline": "Unidentified salvaged specimens were recovered from the salt flats. Without knowing their proton count and net electrical charge, engineers cannot predict how the metal will react in the reactor. We probe the nucleus and electron shells to determine atomic identity and net charge!",
    "vocab": [
      {
        "word": "Proton",
        "meaning": "Heavy particle in the nucleus with a positive (+) electric charge."
      },
      {
        "word": "Neutron",
        "meaning": "Heavy particle in the nucleus with zero (neutral) electric charge."
      },
      {
        "word": "Electron",
        "meaning": "Very light particle orbiting outside the nucleus with a negative (-) charge."
      },
      {
        "word": "Nucleus (Core)",
        "meaning": "The dense center of the atom containing protons and neutrons."
      },
      {
        "word": "Shells (Rings)",
        "meaning": "The energy levels or tracks where electrons orbit outside the core."
      },
      {
        "word": "Valence Electrons",
        "meaning": "Electrons in the outermost shell that determine how the atom reacts."
      }
    ],
    "stages": {
      "0": {
        "goal": "Fire probe particles through Sample A to determine what the inside of an atom is like.",
        "science": "Rutherford scattering: most of an atom is empty space, so most probes fly straight through; only probes hitting the tiny dense center bounce back.",
        "storyProblem": "An unknown specimen is placed in the chamber. Fire probe particles to verify that atoms are mostly empty space with a tiny positive nucleus at the center.",
        "howToTest": "Press \"Fire Beam\" to shoot probe particles through the atom and observe how many pass straight through versus bounce back.",
        "visualFormula": "Rutherford Discovery: Most Probes Pass Through ➔ Tiny Dense Nucleus Deflects"
      },
      "1": {
        "goal": "Count how many positively charged particles (protons, marked with a cross) are inside Sample A's nucleus.",
        "science": "Atomic nucleus: protons and neutrons are packed tightly in the center. Protons carry positive charge (+1).",
        "storyProblem": "The nucleus contains positive protons that define the element. Count the protons in Sample A to find its atomic number.",
        "howToTest": "Press \"The middle\" to view the nucleus flat. Tally the grains that carry a cross.",
        "visualFormula": "Atomic Number = Number of Protons in the Nucleus"
      },
      "2": {
        "goal": "Sample D is sealed so its electrons cannot be seen. Deduce how many electrons it has from its charge needle and protons.",
        "science": "Electrical neutrality: in a neutral atom, positive protons and negative electrons cancel out (net charge = protons - electrons = 0).",
        "storyProblem": "Sample D's electron shells are shielded. Use its proton count and charge needle to deduce how many electrons orbit inside.",
        "howToTest": "Check the reference samples: compare their protons, electrons, and charge needles. Then read Sample D's needle and protons to find its electron count.",
        "visualFormula": "Neutral Atom: Net Charge = Protons - Electrons = 0 ➔ Electrons = Protons"
      },
      "3": {
        "goal": "Sample D has 11 electrons. Place all 11 electrons onto its orbital rings according to shell rules.",
        "science": "Bohr shell model: electron shells fill from inside out (shell 1 holds max 2; shell 2 holds max 8).",
        "storyProblem": "Sample D has 11 electrons. Load them onto the orbital rings in order: inner shell holds 2, second shell holds 8, outer shell holds 1.",
        "howToTest": "Inspect open reference samples A, B, and C in \"Outside\" view to see how many electrons each shell holds. Use the + buttons to place Sample D's electrons in order.",
        "visualFormula": "Bohr Electron Shell Capacity: Shell 1 (max 2) ➔ Shell 2 (max 8) ➔ Shell 3"
      },
      "4": {
        "goal": "Examine four sample atoms and predict whether each gives an electron away, takes one on, or will not trade.",
        "science": "Valence stability (octet rule): atoms tend to lose, gain, or share electrons to reach a full outer shell (usually 8).",
        "storyProblem": "Our power generator needs to know which atoms want to give or take electrons. Count valence electrons on the outside ring to predict reactivity.",
        "howToTest": "Press \"Outside\" and count the valence electrons on the outermost ring of each sample. Compare each to a full shell of 8.",
        "visualFormula": "Octet Rule: 1-3 Valence = Gives Electrons · 5-7 Valence = Takes Electrons"
      },
      "5": {
        "goal": "Samples B and C weigh the same as each other. Determine which one is the same element as Sample A.",
        "science": "Atomic number: element identity depends strictly on the number of PROTONS, not on total weight or neutrons.",
        "storyProblem": "Samples B and C have identical mass, but only one is the same chemical element as Sample A. Check protons and valence electrons to find the true match.",
        "howToTest": "Compare the proton count (\"The middle\") and outer shell electrons (\"Outside\") of Sample A with Samples B and C.",
        "visualFormula": "Element Identity = Protons (Atomic Number), NOT Total Weight"
      },
      "6": {
        "goal": "Remove outer electrons from Sample A until it reaches a net charge of +2, and record how many electrons were removed.",
        "science": "Ion formation: removing negative electrons leaves unbalanced positive protons, creating a positive ion (cation).",
        "storyProblem": "An electrical battery needs an ionized plasma with net charge +2. Strip electrons one by one until the needle reads +2.",
        "howToTest": "Press \"Fire Stripper\" to remove electrons one by one. Check \"Read Needle\" after each removal until it reads +2.",
        "visualFormula": "Cation Formation: Net Charge (+2) = Protons - (Electrons - 2)"
      },
      "7": {
        "goal": "Compare three unknown samples against the standard reference (7 protons, 7 neutrons, neutral) and classify how each differs.",
        "science": "Isotopes have different neutrons; ions have different electrons (charge); different elements have different protons.",
        "storyProblem": "Three salvage samples must be classified against standard Nitrogen (7 protons, 7 neutrons). Identify which is an isotope, an ion, or a different element.",
        "howToTest": "Use \"The middle\" and \"Read Needle\" on each sample. Compare proton, neutron, and electron counts against the standard reference.",
        "visualFormula": "Different Neutrons = Isotope · Different Electrons = Ion · Different Protons = New Element"
      }
    }
  },
  "q3-catalogue": {
    "title": "The Periodic Table",
    "concept": "Periodic Organization & Atomic Numbers",
    "overview": "The PERIODIC TABLE arranges all chemical elements in order of their ATOMIC NUMBER (the number of protons in their nucleus). Elements in the same column (group) share similar chemical properties because they have the same number of outer valence electrons.",
    "storyline": "Refinery coolant pipes are corroding in harsh chemical brine. We must explore the periodic table to find elements with the exact reactivity needed: unreactive noble gases for protective atmosphere, or specific metal families that resist acid corrosion!",
    "vocab": [
      {
        "word": "Atomic Number",
        "meaning": "The number of protons in an atom's nucleus. This identifies the element!"
      },
      {
        "word": "Period",
        "meaning": "A horizontal row on the periodic table."
      },
      {
        "word": "Group (Column)",
        "meaning": "A vertical column of elements that share similar chemical properties."
      },
      {
        "word": "Valence Electrons",
        "meaning": "Electrons in the outermost shell that determine how an element reacts."
      }
    ],
    "stages": {
      "0": {
        "goal": "Arrange six element cards in the slots from left to right in order of increasing proton count (atomic number).",
        "science": "The periodic table is ordered strictly by atomic number (proton count), not by atomic mass.",
        "storyProblem": "Six salvaged element cards must be arranged in order. Order them strictly by increasing proton count (atomic number).",
        "howToTest": "Tap each card in the drawer to read its proton count. Sort them from fewest to most protons, and place them into the slots.",
        "visualFormula": "Periodic Order = Increasing Atomic Number (Proton Count)"
      },
      "1": {
        "goal": "Examine outer electron shells across the row of elements and count how many elements pass before the valence count restarts at 1.",
        "science": "Periods represent electron shells filling up. Once a shell is full (e.g. 8 electrons), the count resets to 1 as a new shell starts.",
        "storyProblem": "Observe how valence electrons repeat across a row. When a shell fills with 8 electrons, the pattern resets to 1 in the next period.",
        "howToTest": "Tap the cards along the row and read their outer-shell electron counts. Find where the count drops back to 1 and count the interval.",
        "visualFormula": "Periodicity: Valence Resets Every 8 Elements as New Shell Starts"
      },
      "2": {
        "goal": "File cards into the third row of the periodic table grid based on atomic number and electron patterns.",
        "science": "Row structure (periods): row 1 has 2 elements, row 2 has 8 elements, row 3 has 8 elements.",
        "storyProblem": "File cards into row 3 of the periodic grid by matching their atomic number and electron shell capacity.",
        "howToTest": "Read each card's proton and valence counts, and match each card to its coordinate on the grid.",
        "visualFormula": "Period 3: Fills Shell 3 (Elements 11 through 18)"
      },
      "3": {
        "goal": "Test reactive behavior across different columns to discover why elements in the same vertical column behave similarly.",
        "science": "Chemical families (groups): elements in the same column have the same number of valence electrons, giving them similar chemical reactions.",
        "storyProblem": "Compare cards in the same vertical column. Notice that every element in column 1 has 1 valence electron and reacts violently with water.",
        "howToTest": "Compare the properties and outer electron counts of cards in the same column.",
        "visualFormula": "Chemical Family (Group): Same Valence Electrons = Identical Chemical Behavior"
      },
      "4": {
        "goal": "Determine how many electrons are held in the outer shell of elements located in column 6.",
        "science": "Group valence correspondence: the group number (or units digit) corresponds to the number of outer valence electrons.",
        "storyProblem": "Find the valence electron count for elements in column 6 (Chalcogens). Confirm they all have 6 outer electrons and seek 2 more.",
        "howToTest": "Tap cards in column 6 and check their outer-shell electron count.",
        "visualFormula": "Group 6 (16): Exactly 6 Valence Electrons"
      },
      "5": {
        "goal": "Deduce the missing element card on the grid using period and group trends.",
        "science": "Periodic predictability: Mendeleev used periodic gaps to accurately predict properties of undiscovered elements.",
        "storyProblem": "A card is missing from the periodic grid. Use the properties of its neighbours above, below, left, and right to deduce its atomic number and properties.",
        "howToTest": "Look at the cards directly above, below, left, and right of the empty space to deduce the missing card's values.",
        "visualFormula": "Periodic Predictability: Middle Value = Average of Surrounding Group & Period"
      },
      "6": {
        "goal": "Sort elements into metals and nonmetals based on conductivity and electron behavior.",
        "science": "Metals tend to lose electrons and conduct electricity; nonmetals tend to gain or share electrons.",
        "storyProblem": "Sort elements into metals (conductive, lose electrons) and nonmetals (insulating, gain electrons) for refinery wiring.",
        "howToTest": "Test each element on the bench for conductivity and electron transfer behavior.",
        "visualFormula": "Metals (Left: Conductors, Lose e⁻) vs Nonmetals (Right: Insulators, Gain e⁻)"
      },
      "7": {
        "goal": "Place all remaining unfiled element cards into their correct slots on the full periodic table.",
        "science": "The complete periodic table organizes all known elements systematically by atomic number and valence structure.",
        "storyProblem": "Complete the master periodic table filing so all planetary exploration teams can access certified element data.",
        "howToTest": "Examine each card's atomic number and valence shell, and place it into its matching grid position.",
        "visualFormula": "Complete Periodic Table: Group Trends + Period Shell Levels"
      }
    }
  },
  "q4-ledger": {
    "title": "Isotopes and Ions",
    "concept": "Mass Variations (Isotopes) and Electrical Charges (Ions)",
    "overview": "Adding or removing NEUTRONS changes an atom's mass without changing its element identity—these are ISOTOPES. Adding or removing ELECTRONS creates an electric charge (+ or -)—these are IONS.",
    "storyline": "Auditing refinery cargo logs. Dishonest traders claim chemical reactions created extra mass from nothing, or hid missing metal. By balancing the subatomic ledger—comparing protons, neutrons, electrons, and total mass—we expose fraudulent accounting and verify genuine chemical transformations!",
    "vocab": [
      {
        "word": "Isotope",
        "meaning": "Atoms of the same element with different numbers of neutrons (different weights)."
      },
      {
        "word": "Ion",
        "meaning": "An atom with an electrical charge due to having unequal numbers of protons and electrons."
      },
      {
        "word": "Mass Number",
        "meaning": "Total number of protons plus neutrons in the nucleus."
      },
      {
        "word": "Net Charge",
        "meaning": "Protons minus electrons: 0 is neutral, positive is a cation, negative is an anion."
      }
    ],
    "stages": {
      "0": {
        "goal": "Count the protons, neutrons, and electrons of Sample A, and determine its total mass number.",
        "science": "Mass number = protons + neutrons. Electrons contribute almost no mass.",
        "storyProblem": "Inspect Sample A's core and shells. Calculate its total mass number by adding protons and neutrons.",
        "howToTest": "Use \"The middle\" to count protons (marked) and neutrons (blank), and \"Outside\" to count electrons.",
        "visualFormula": "Mass Number (A) = Protons (Z) + Neutrons (N)"
      },
      "1": {
        "goal": "Sample B is sealed. Use the atomic number and mass number on its label to calculate its neutrons and electrons.",
        "science": "Neutrons = mass number - atomic number (protons). In a neutral atom, electrons = protons.",
        "storyProblem": "Sample B's label lists mass number 23 and atomic number 11. Calculate how many neutrons are packed in its nucleus.",
        "howToTest": "Observe the relationship on open Sample A, then apply the calculation to Sample B's label values.",
        "visualFormula": "Neutrons = Mass Number (A) - Atomic Number (Z)"
      },
      "2": {
        "goal": "Determine which of the three mystery samples will react the same way as Sample A.",
        "science": "Chemical reactivity is determined by valence electrons, not neutrons. Isotopes react identically.",
        "storyProblem": "Three mystery samples are tested for reaction speed. Identify which sample reacts identically to Sample A based on valence electrons.",
        "howToTest": "Compare the outermost electron shells of all samples in \"Outside\" view.",
        "visualFormula": "Chemical Reactivity = Governed by Outer Valence Electrons (Isotopes React Identically)"
      },
      "3": {
        "goal": "Sample B has a needle that does not sit on zero. Calculate its protons and electrons from its label and charge reading.",
        "science": "Net charge = protons - electrons. Electrons = protons - net charge.",
        "storyProblem": "Sample B's charge needle reads -1. Use its atomic number to calculate its true electron count.",
        "howToTest": "Read the charge meter on Sample B and combine with its atomic number to deduce electron count.",
        "visualFormula": "Electrons = Protons - Net Charge ➔ For Charge -1, Electrons = Protons + 1"
      },
      "4": {
        "goal": "Knock electrons off Sample A until it reaches a charge of +2, and log how many electrons that required.",
        "science": "Cations: removing negative electrons increases positive net charge.",
        "storyProblem": "Strip electrons from Sample A until it reaches a stable +2 cation for electroplating.",
        "howToTest": "Press \"Fire Stripper\" and observe the charge meter climb. Stop when it reaches +2.",
        "visualFormula": "Positive Ion (Cation): Protons > Electrons · Charge = +2"
      },
      "5": {
        "goal": "Add electrons to Sample A until its outer shell is completely full, and observe the resulting charge.",
        "science": "Anions: nonmetals gain electrons to complete an octet, forming negative ions.",
        "storyProblem": "Add electrons to Sample A until its valence shell has 8 electrons, and record its resulting negative anion charge.",
        "howToTest": "Use the + buttons to fill Shell 1 (2), Shell 2 (8), and Shell 3 (8), then check the charge needle.",
        "visualFormula": "Negative Ion (Anion): Electrons > Protons · Full Octet (8)"
      },
      "6": {
        "goal": "Find the smallest whole-number ratio of Sample A and Sample B atoms that cancel out to a net charge of zero.",
        "science": "Neutral ionic compounds: positive and negative charges must balance to zero in whole-number atom ratios.",
        "storyProblem": "Find the neutral whole-number formula ratio between a +2 cation and a -1 anion to form a stable crystal lattice.",
        "howToTest": "Read the charge on Sample A (+2) and Sample B (-1), and find how many of each are needed to balance to 0.",
        "visualFormula": "Neutral Salt: (+2) × 1 + (-1) × 2 = Net Charge 0 ➔ Ratio 1:2"
      },
      "7": {
        "goal": "Classify four mystery samples by whether each is an isotope, an ion, identical, or a different element compared to Sample A.",
        "science": "Subatomic rules: different protons = different element; different neutrons = isotope; different electrons = ion.",
        "storyProblem": "Classify four mystery crates against standard Sample A: identify which is an isotope, an ion, an identical atom, or a different element.",
        "howToTest": "Compare proton counts, neutron counts, and charge readings of each sample against Sample A.",
        "visualFormula": "Subatomic Classification: ΔNeutrons = Isotope | ΔElectrons = Ion | ΔProtons = New Element"
      }
    }
  },
  "q5-assay": {
    "title": "Atomic Mass & Isotopes",
    "concept": "Average Atomic Mass & Mass Spectrometry",
    "overview": "In nature, elements exist as a mixture of different ISOTOPES (atoms of the same element with different neutron counts and different masses). The ATOMIC MASS on the periodic table is not the weight of any single atom—it is the WEIGHTED AVERAGE of the natural isotopes mixed together! We use this to analyze real materials and detect counterfeit metal shipments.",
    "storyline": "A salvage merchant on Tallow is trying to sell our expedition what they claim is high-grade structural metal. But dishonest traders often cut shipments with cheaper lighter metal. By using the mass sorter to measure the exact isotope split and calculate the average atomic mass, we verify whether the cargo is authentic or expose a merchant trying to pass off cheaper metal!",
    "vocab": [
      {
        "word": "Sample",
        "meaning": "A batch of atom pieces being tested on the bench."
      },
      {
        "word": "Bins",
        "meaning": "Numbered collection trays that catch pieces according to their measured weight."
      },
      {
        "word": "Isotopes",
        "meaning": "Atoms of the same element that have different masses because they contain different numbers of neutrons."
      },
      {
        "word": "Atomic Mass (Average)",
        "meaning": "The weighted average mass of all the natural isotope pieces mixed together."
      }
    ],
    "stages": {
      "0": {
        "goal": "Sample A drops down the sorting chute and divides into two separate bins instead of landing in one bin. Explain the scientific reason why this split occurs.",
        "science": "Isotopes: atoms of the same element have the same number of protons, but different numbers of neutrons give them different masses.",
        "storyProblem": "A merchant sells Sample A as a pure element, yet the chute drops atoms into two separate bins. We must verify if the sample is contaminated or if this is the natural isotope split of a genuine element.",
        "howToTest": "Press \"Tip Sample\" to pour pieces down the sorter. Tap each bin and press \"Read Code\" to confirm both bins hold the exact same element code.",
        "visualFormula": "Same Protons (Same Element) + Different Neutrons = Isotopes with Different Weights"
      },
      "1": {
        "goal": "Compare Sample A and Sample B. Determine what percentage (how many out of every 100 pieces) lands in the lighter weight bin.",
        "science": "Isotope abundance: in any genuine batch of an element, the proportion of each isotope is constant.",
        "storyProblem": "Two cargo crates from different supply ships claim to be the same element. We calculate the percentage in the lighter bin to ensure the isotopic abundance matches the standard.",
        "howToTest": "Tip Sample A, then tip Sample B. Count how many pieces landed in the lighter bin out of 100 total atoms.",
        "visualFormula": "Isotope Abundance % = (Lighter Bin Atoms / Total Atoms) × 100%"
      },
      "2": {
        "goal": "Sample A has a catalog mass of 35.5, but its pieces weigh 35 and 37. Explain where 35.5 sits between the two weights and why.",
        "science": "Weighted average: the average mass leans towards whichever isotope is more common in the natural mixture (35.5 is closer to 35 because ~75% of pieces weigh 35).",
        "storyProblem": "The merchant's invoice lists atomic mass 35.5, but no individual atom weighs 35.5! We must prove to the quartermaster why 35.5 reflects the true weighted average.",
        "howToTest": "Tip the sample and observe that the 35 bin catches far more pieces than the 37 bin. Compare 35.5 to the midpoint 36.0.",
        "visualFormula": "Weighted Average: (75% × 35) + (25% × 37) = 26.25 + 9.25 = 35.5"
      },
      "3": {
        "goal": "Calculate the average weight of one piece of Sample A based on the counts in its two collection bins.",
        "science": "Average atomic mass formula: multiply each isotope mass by its fraction of the total, then sum them.",
        "storyProblem": "The merchant claims this sample is genuine Chlorine (CAT 17). Calculate the weighted average mass from the sorter counts to verify whether the cargo is authentic.",
        "howToTest": "Tip Sample A, note the atom count in each bin, multiply each mass by its fraction of the total, and sum the results.",
        "visualFormula": "Average Atomic Mass = Σ (Isotope Mass × Fractional Abundance)"
      },
      "4": {
        "goal": "Sample A has an average mass of 19.0 (an exact whole number). Explain why this element's mass has no decimal when previous samples did.",
        "science": "Monomultiple elements: some elements exist in nature as only one isotope (100% abundance), so their average mass is a whole number.",
        "storyProblem": "A buyer questions why a Fluorine shipment (19.0) has no decimal while Chlorine does. Prove that all atoms landed in a single bin because Fluorine has only one isotope.",
        "howToTest": "Tip Sample A and observe that 100% of the pieces land in the 19 bin.",
        "visualFormula": "Single Isotope: 100% × 19.0 = 19.0 (No decimal split)"
      },
      "5": {
        "goal": "An element has an average mass of 7.02 with isotopes at 6 and 7. Determine which isotope is rare and which is common.",
        "science": "Proximity rule: since 7.02 is extremely close to 7, the isotope with mass 7 must make up nearly 98% of the mixture.",
        "storyProblem": "To calibrate our engine sensors for Lithium fuel, we need to know which isotope dominates the fuel feed.",
        "howToTest": "Compare the distance of 7.02 to 7 (0.02) vs to 6 (1.02). The average leans heavily toward 7.",
        "visualFormula": "7.02 is close to 7.0 ➔ Mass 7 is ~98% abundant, Mass 6 is ~2%"
      },
      "6": {
        "goal": "Two samples are sorted: one is a pure element with isotopes, and one contains an impurity. Identify which sample is impure.",
        "science": "Isotopes share the exact same element code (protons); foreign impurities have a different element code.",
        "storyProblem": "A merchant tries to sell two alloy crates. One is genuine multiple-isotope metal; the other is secretly cut with cheap scrap metal. Use the code reader to catch the fraud!",
        "howToTest": "Tip both samples. Tap each bin and use \"Read Code\" to check element IDs in each bin.",
        "visualFormula": "Genuine Isotopes = Same Code · Fake Mixture = Different Element Codes"
      },
      "7": {
        "goal": "Predict and confirm the isotope split and average mass of a newly surveyed planetary sample.",
        "science": "Mass spectrometry assay: measuring isotope masses and relative percentages gives the official atomic mass of a newly discovered element.",
        "storyProblem": "Our survey team found an uncatalogued mineral vein. Calculate its true atomic mass to register the new element in the galactic catalogue!",
        "howToTest": "Use the bench controls to tip the sample, inspect the bins and meters, and calculate the weighted average.",
        "visualFormula": "Mass Spectrometry: Measure Peaks ➔ Calculate Weighted Average"
      }
    }
  },
  "q6-weigh": {
    "title": "Counting By Weight",
    "concept": "The Mole & Molar Mass",
    "overview": "Atoms are far too small and numerous to count individually. Chemists count atoms by WEIGHING them on a balance using a special unit called the MOLE (Avogadro's number: 6.022 × 10²³). If you know the formula mass of a substance, taking that number in grams gives exactly 1 mole of particles (molar mass g/mol)!",
    "storyline": "The outpost trading depot sells fuel drums and synthesis reagents by bulk weight, but our expedition's chemical engines require exact molecule counts. If we don't convert grams to moles accurately, the station will either run out of fuel mid-flight or overpay for underfilled drums!",
    "vocab": [
      {
        "word": "The Mole",
        "meaning": "The chemist's counting unit for huge collections of atoms or molecules (6.022 × 10²³)."
      },
      {
        "word": "Molar Mass",
        "meaning": "The mass in grams of one mole of a substance (matches its formula mass number!)."
      },
      {
        "word": "Formula Mass",
        "meaning": "The sum of atomic masses of all atoms in a chemical formula."
      },
      {
        "word": "Balance / Scale",
        "meaning": "The bench instrument used to weigh samples."
      }
    ],
    "stages": {
      "0": {
        "goal": "Sample B is too full to tip. Use the weight of known standard Sample A to determine how many atoms Sample B holds.",
        "science": "Counting by weighing: total mass divided by single-particle mass yields the particle count.",
        "storyProblem": "A merchant brings a sealed heavy cargo crate. We cannot open it to count atoms individually. By weighing it against a known 40-atom sample, we determine the exact count!",
        "howToTest": "Weigh Sample A (40 atoms) to find the weight per atom, then weigh Sample B and divide total weight by single-atom weight.",
        "visualFormula": "Total Atom Count = Total Mass / Mass per Atom"
      },
      "1": {
        "goal": "Calculate the weight of one molecule of Sample B from its chemical formula.",
        "science": "Formula mass: add up the atomic masses of each atom in the molecule.",
        "storyProblem": "A trader offers a fuel compound. To know how much it will weigh per mole, calculate its formula mass from the periodic table.",
        "howToTest": "Check the reference plate for the mass of each element in Sample B's recipe, and sum them up.",
        "visualFormula": "Formula Mass = Σ (Atoms of Element × Atomic Mass)"
      },
      "2": {
        "goal": "Three samples each contain 60 atoms of different elements. Discover what relationship exists between their total weights.",
        "science": "Relative mass ratios: equal numbers of atoms always weigh in the exact ratio of their atomic masses.",
        "storyProblem": "A transport pilot wonders why three equal-count containers feel so different in cargo hold balance. Prove that equal counts have weights proportional to their atomic mass.",
        "howToTest": "Tip and weigh each 60-atom sample. Divide each total weight by 60 and compare to the listed atomic masses.",
        "visualFormula": "Equal Count Ratio: Weight(A) / Weight(B) = Mass(A) / Mass(B)"
      },
      "3": {
        "goal": "You have weighed out 12.0 grams of CAT 06. Determine how many grams of CAT 08 contain the exact same number of atoms.",
        "science": "Avogadro's principle: taking the atomic mass of any element in grams gives the exact same number of atoms (1 mole).",
        "storyProblem": "A chemical synthesis reactor requires a 1:1 atom ratio of Carbon and Oxygen. How many grams of Oxygen must we weigh to match 12 grams of Carbon?",
        "howToTest": "Compare the listed atomic masses of CAT 06 and CAT 08 on the reference plate.",
        "visualFormula": "12.0 g Carbon = 16.0 g Oxygen = 1 Mole of Atoms (6.022 × 10²³)"
      },
      "4": {
        "goal": "Calculate how many grams of a compound you must weigh out to have one mole of its molecules.",
        "science": "Molar mass of compounds: one mole in grams equals the formula mass of the molecule.",
        "storyProblem": "Life support needs 1 mole of water (H₂O) for the hydroponics chamber. Weighing grams is our only way to measure it out.",
        "howToTest": "Sum the listed atomic masses for all atoms in one molecule of the compound.",
        "visualFormula": "1 Mole of Compound = Formula Mass in Grams (Molar Mass g/mol)"
      },
      "5": {
        "goal": "A storage drum reads 72 grams on the scale. Convert this mass into the number of moles of compound inside.",
        "science": "Mass to moles conversion: moles = mass in grams / molar mass (g/mol).",
        "storyProblem": "A supply drum arrived marked 72 grams of Carbon (molar mass 12 g/mol). The quartermaster needs the inventory recorded in moles.",
        "howToTest": "Weigh the drum, find the molar mass of the compound from its recipe, and divide measured grams by molar mass.",
        "visualFormula": "Moles (n) = Mass (m) / Molar Mass (M)"
      },
      "6": {
        "goal": "You have two moles of a compound. Determine how many moles of a constituent element are contained inside.",
        "science": "Mole ratios in formulas: chemical formulas apply directly to mole quantities (e.g. 1 mole H2O contains 2 moles H).",
        "storyProblem": "We need to extract pure hydrogen from 2 moles of water. How many moles of hydrogen atoms can we produce?",
        "howToTest": "Check the subscript count of the element in one molecule, and multiply by the total moles of compound.",
        "visualFormula": "Moles of Element = (Moles of Compound) × (Subscript in Formula)"
      },
      "7": {
        "goal": "Determine which of three storage drums holds the greatest total number of atoms.",
        "science": "Mass vs count: heavier atoms mean fewer particles per gram. Converting grams to moles reveals the true particle count.",
        "storyProblem": "A trader claims Drum C is the best deal because it is the heaviest drum. But we need the most atoms! Convert each drum's weight to moles to find the true count.",
        "howToTest": "Weigh each drum and divide its weight by the molar mass of its element to compare mole counts.",
        "visualFormula": "Heaviest Drum ≠ Most Atoms! Compare: Moles = Mass / Molar Mass"
      }
    }
  },
  "boss-hopper": {
    "title": "The Sifter Challenge",
    "concept": "Comprehensive Unit 1 Review",
    "overview": "Apply your core chemistry mastery: matter classification, atomic numbers, noble gases, ion neutralization, and molar mass conversions. Each calibration phase directly solves an industrial processing challenge at the refinery hopper.",
    "storyline": "The automated sifting hopper on Tallow is malfunctioning and threatening to dump raw unseparated mineral sludge into the main smelter. By correctly applying chemical classification, charge balance, and molar calculations, you will recalibrate each system and prevent a catastrophic smelter jam!",
    "vocab": [
      {
        "word": "Matter Types",
        "meaning": "Elements (pure atoms), Compounds (bonded different atoms), and Mixtures (unbonded blends)."
      },
      {
        "word": "Atomic Number",
        "meaning": "The fundamental proton count (Z) that uniquely identifies every element."
      },
      {
        "word": "Noble Gas",
        "meaning": "Inert Group 18 element with full valence shell, ideal for non-reactive purging."
      },
      {
        "word": "Charge Neutralization",
        "meaning": "Balancing protons and electrons so net charge equals zero."
      },
      {
        "word": "Molar Mass",
        "meaning": "Mass in grams of one mole (6.022 × 10²³ particles) of an element or substance."
      }
    ],
    "stages": {
      "0": {
        "goal": "Phase 1: Classify three conveyor plates as an element, a compound, or a mixture.",
        "science": "Classification of Matter: Pure elements have one kind of atom; compounds have bonded different elements in fixed ratios; mixtures have unbonded blends that can physically separate.",
        "storyProblem": "Unsorted conveyor plates are jamming the hopper feeder. File each plate into element, compound, or mixture bins so the automated sorter routes them safely.",
        "howToTest": "Inspect the particle drawing on each plate: check if atoms are all identical (element), bonded in uniform clusters (compound), or loose mixed grains (mixture).",
        "visualFormula": "Element (1 type of atom) · Compound (bonded ratio) · Mixture (loose physical blend)"
      },
      "1": {
        "goal": "Phase 2: Enter the atomic number of the element that has six protons in its nucleus.",
        "science": "Atomic Number Identity: The atomic number (Z) is strictly equal to the number of protons in the nucleus. Carbon has 6 protons, so Z = 6.",
        "storyProblem": "The furnace fuel injector requires the exact atomic number for a sample with 6 protons in its nucleus to set the ignition temperature.",
        "howToTest": "Recall the fundamental identity rule: atomic number equals the number of protons in the nucleus.",
        "visualFormula": "Atomic Number (Z) = Proton Count in Nucleus = 6 (Carbon)"
      },
      "2": {
        "goal": "Phase 3: Identify the atomic number of the inert noble gas in period 2 needed to quench cooling manifolds.",
        "science": "Periodic Table Architecture: Period 2 ends at Group 18 with Neon, which has 10 protons and a full valence octet.",
        "storyProblem": "Cooling manifolds are overheating and need a non-reactive noble gas quench gas from Period 2. Enter its atomic number to release the valve.",
        "howToTest": "Locate Group 18 (noble gases) and row 2 (Period 2) on the periodic table to find its proton count.",
        "visualFormula": "Period 2 Noble Gas = Group 18, Row 2 ➔ Neon (Z = 10)"
      },
      "3": {
        "goal": "Phase 4: Determine the number of electrons needed to neutralize a sodium cation with 11 protons and 10 electrons.",
        "science": "Ion Neutralization: A cation with 11 protons (+) and 10 electrons (−) has a net charge of +1. Neutralizing it requires adding 1 electron (−1) to reach zero charge.",
        "storyProblem": "Electrical static from an ore burst created sodium ions (11 protons, 10 electrons) that are sticking to the hopper chute. How many electrons must be supplied per ion to neutralize the static?",
        "howToTest": "Calculate net charge: Charge = Protons − Electrons = 11 − 10 = +1. Add negative electrons until charge is 0.",
        "visualFormula": "Net Charge = 11 p⁺ + 10 e⁻ = +1 ➔ Add 1 e⁻ for Neutral Atom (Charge 0)"
      },
      "4": {
        "goal": "Phase 5: Calculate the total mass in grams of two moles of carbon atoms (atomic mass 12.0 g/mol).",
        "science": "Molar Mass Conversion: Total mass equals moles multiplied by molar mass: Mass = n × M = 2.0 mol × 12.0 g/mol = 24.0 g.",
        "storyProblem": "The final calibration chamber requires exactly two moles of pure carbon reagent. Compute the total mass in grams needed on the hopper load scale.",
        "howToTest": "Multiply the requested mole count (2 mol) by carbon's molar mass (12.0 g/mol).",
        "visualFormula": "Mass (m) = Moles (n) × Molar Mass (M) = 2.0 mol × 12.0 g/mol = 24.0 g"
      }
    }
  },
  "q1-wave": {
    "title": "Light as a Wave",
    "concept": "Wave Nature of Light (λ, ν, and c)",
    "overview": "Light travels across space as an oscillating electromagnetic wave. The crest-to-crest distance is wavelength (λ) and the number of wave cycles per second is frequency (ν). Because all electromagnetic waves travel at the speed of light c = 3.00 × 10⁸ m/s, wavelength and frequency are inversely related: shorter waves oscillate faster.",
    "storyline": "Lanternfall's communications array is receiving scrambled optical signals across planetary valleys. Sensor towers rely on precise wavelength and frequency matching to decode telemetry. By understanding light's wave mechanics, you will align receiver frequencies and restore clear communication across the research base.",
    "vocab": [
      {
        "word": "Wavelength (λ)",
        "meaning": "The physical distance between two consecutive wave peaks, measured in metres or nanometres (nm)."
      },
      {
        "word": "Frequency (ν)",
        "meaning": "The number of wave oscillations passing a point each second, measured in Hertz (Hz = 1/s)."
      },
      {
        "word": "Speed of Light (c)",
        "meaning": "Universal speed of all electromagnetic radiation: c = 3.00 × 10⁸ m/s."
      },
      {
        "word": "Visible Spectrum",
        "meaning": "The narrow slice of frequencies detectable by human vision (roughly 400 nm violet to 700 nm red)."
      },
      {
        "word": "Electromagnetic Spectrum",
        "meaning": "The complete spectrum of radiant energy: radio, microwaves, infrared, visible, UV, X-rays, gamma."
      }
    ],
    "stages": {
      "0": {
        "goal": "Say what changes on the screen as the dial turns from red to violet.",
        "science": "Wavelength and Frequency Inverse Trade: Turning from red to violet shortens the wavelength and raises the frequency. The two properties always move in opposite directions.",
        "storyProblem": "A communication beacon dial is rotated from red to violet. Watch the oscilloscope to see how crest spacing and cycle frequency shift.",
        "howToTest": "Rotate the color dial between red and violet. Watch the crest spacing shrink while the oscillation count rises.",
        "visualFormula": "Red (Long λ, Low ν) ➔ Violet (Short λ, High ν)"
      },
      "1": {
        "goal": "Find the lamp setting whose wavelength is twice Sample A's.",
        "science": "Inverse Frequency Ratio: Doubling the wavelength cuts the frequency in half because light moves at constant speed c.",
        "storyProblem": "Relay Tower Beta needs a carrier channel with crests twice as far apart as Channel A to avoid valley atmospheric scattering.",
        "howToTest": "Inspect Sample A's wavelength, then adjust the lamp setting until the measured crest spacing is exactly double.",
        "visualFormula": "λ₂ = 2 × λ₁ ➔ ν₂ = ½ × ν₁ (Wavelength Doubles = Frequency Halves)"
      },
      "2": {
        "goal": "Say how fast the light from each of these three lamps travels.",
        "science": "Universal Constant Speed of Light: All electromagnetic radiation travels at exactly c = 3.00 × 10⁸ m/s in vacuum or air, regardless of color or frequency.",
        "storyProblem": "A technician questions whether blue laser signals travel across the valley faster than red beams. Measure the speed of each beam.",
        "howToTest": "Multiply wavelength by frequency for each lamp: λ × ν = c. Compare the resulting speeds across all lamps.",
        "visualFormula": "Universal Constant: c = λ × ν = 3.00 × 10⁸ m/s (Identical for ALL Light)"
      },
      "3": {
        "goal": "Give the frequency of a 600 nm lamp.",
        "science": "Frequency Calculation: Frequency equals speed of light divided by wavelength: ν = c / λ. Convert 600 nm to 6.00 × 10⁻⁷ m.",
        "storyProblem": "An auxiliary emergency beacon broadcasts at 600 nm. Calculate its operating frequency to program our receiver filters.",
        "howToTest": "Divide c (3.00 × 10⁸ m/s) by 600 nm (6.00 × 10⁻⁷ m): ν = 3.00e8 / 6.00e-7 = 5.00 × 10¹⁴ Hz.",
        "visualFormula": "ν = c / λ ➔ (3.00 × 10⁸ m/s) / (600 × 10⁻⁹ m) = 5.00 × 10¹⁴ Hz"
      },
      "4": {
        "goal": "Order the four lamps from the lowest frequency to the highest.",
        "science": "Visible Spectrum Energy Order: Red has the longest wavelength and lowest frequency, running up through orange, yellow, green, blue, to violet (highest frequency).",
        "storyProblem": "Four diagnostic transmitter lamps must be sorted from lowest frequency to highest frequency to calibrate the multichannel scanner.",
        "howToTest": "Compare the colors and wavelengths: order from longest wavelength (lowest frequency) to shortest wavelength (highest frequency).",
        "visualFormula": "Lowest ν [Red ➔ Yellow ➔ Green ➔ Violet] Highest ν"
      },
      "5": {
        "goal": "Say which detector responds to Sample B, which the eye cannot see.",
        "science": "Invisible Electromagnetic Spectrum: Radiation with wavelengths longer than red (>700 nm) is Infrared (IR); wavelengths shorter than violet (<400 nm) are Ultraviolet (UV).",
        "storyProblem": "An unseen beam crosses the perimeter fence. Use the multi-spectrum sensor to find which non-visible detector channel registers a signal.",
        "howToTest": "Switch between infrared, visible, and ultraviolet sensor heads to detect where Sample B triggers an electrical current.",
        "visualFormula": "Infrared (λ > 700 nm) · Visible (400–700 nm) · Ultraviolet (λ < 400 nm)"
      },
      "6": {
        "goal": "Match each source to its frequency.",
        "science": "Electromagnetic Spectrum Span: Radio waves have long wavelengths and low frequencies; X-rays have tiny wavelengths and extremely high frequencies.",
        "storyProblem": "The comms bay has radio antennas, radar microwave horns, and inspection X-ray tubes. Match each emitter to its characteristic frequency.",
        "howToTest": "Remember that longer wavelengths correspond to lower frequencies across the full spectrum.",
        "visualFormula": "Radio (10⁴–10⁸ Hz) < Microwaves (10⁹–10¹¹ Hz) < X-rays (10¹⁶–10¹⁸ Hz)"
      },
      "7": {
        "goal": "Give the frequency of the sodium lamp.",
        "science": "Characteristic Elemental Frequencies: Sodium emits yellow light at 589 nm. Every element possesses unique spectral lines governed by ν = c / λ.",
        "storyProblem": "The perimeter boundary markers use sodium vapor lamps (Na, CAT 11). Determine their exact frequency to calibrate the fog penetrator lens.",
        "howToTest": "Read sodium's emission wavelength from the bench chart and calculate ν = c / λ.",
        "visualFormula": "ν = c / λ ➔ (3.00 × 10⁸ m/s) / (5.89 × 10⁻⁷ m) = 5.09 × 10¹⁴ Hz"
      }
    }
  },
  "q2-photon": {
    "title": "Photons",
    "concept": "Photons & Photoelectric Effect (E = h·ν)",
    "overview": "Light behaves not just as waves, but as discrete energy packets called photons. Each photon carries energy proportional to its frequency: E = h·ν. Striking a metal surface, a photon liberates an electron only if its energy overcomes the metal's work function (Φ). Higher intensity means more photons; higher frequency means more energetic photons.",
    "storyline": "Lanternfall's auxiliary solar batteries and UV sensors rely on photoelectric cathodes. A technician installed high-power red lamps, but no electric current flowed—while a tiny UV diode immediately drove the ammeter! To repair the power grid, we must determine the exact threshold frequencies and work functions of our collector metals.",
    "vocab": [
      {
        "word": "Photon",
        "meaning": "An individual quantum packet of electromagnetic radiation."
      },
      {
        "word": "Photoelectric Effect",
        "meaning": "The ejection of electrons from a metal plate when struck by photons with sufficient frequency."
      },
      {
        "word": "Work Function (Φ)",
        "meaning": "The minimum energy barrier needed to eject an electron from a specific metal."
      },
      {
        "word": "Threshold Frequency (ν₀)",
        "meaning": "The cutoff frequency where photon energy equals the work function: h·ν₀ = Φ."
      },
      {
        "word": "Planck's Constant (h)",
        "meaning": "Proportionality constant between energy and frequency: h = 6.626 × 10⁻³⁴ J·s."
      }
    ],
    "stages": {
      "0": {
        "goal": "Get electrons off the plate.",
        "science": "Quantum Photon Nature: Classical waves predict bright red light should shake electrons free, but only photons with sufficient individual frequency (blue/UV) can eject electrons.",
        "storyProblem": "A bright red lamp shines on the photocathode but the detector needle reads zero. Find the light frequency that successfully liberates electrons.",
        "howToTest": "Shift the lamp wavelength control from red towards violet and ultraviolet until electrons fly off the target plate.",
        "visualFormula": "Red (Low ν) ➔ 0 Electrons · Violet/UV (High ν) ➔ Electrons Ejected!"
      },
      "1": {
        "goal": "Find the lowest frequency that frees any electron from this plate.",
        "science": "Threshold Frequency Cutoff: Below threshold frequency ν₀, no electrons leave regardless of brightness. At or above ν₀, electrons eject immediately.",
        "storyProblem": "Calibrate the sensor's cutoff frequency so stray heat radiation does not trigger false circuit trips.",
        "howToTest": "Slowly dial frequency upwards until the very first electrons break free from the cathode plate.",
        "visualFormula": "Threshold: h·ν ≥ Φ (Work Function)"
      },
      "2": {
        "goal": "Say what turning up the brightness does, with the lamp set above the threshold.",
        "science": "Intensity Equals Photon Quantity: Brightness changes the number of photons hitting per second, increasing electron count without altering individual electron speed.",
        "storyProblem": "The sensor array needs more current output to power relay circuits. Test if increasing lamp intensity increases electron count.",
        "howToTest": "Hold frequency fixed above threshold and turn up the brightness slider. Observe the number of emitted electrons.",
        "visualFormula": "Brightness ↑ = Number of Photons ↑ = Number of Ejected Electrons ↑"
      },
      "3": {
        "goal": "Say what raising the frequency does, with the brightness held where it is.",
        "science": "Frequency Equals Photon Energy: Raising frequency gives each photon more excess kinetic energy (KE = h·ν − Φ), making electrons fly faster.",
        "storyProblem": "Electrons must cross a collector gap against a retarding voltage. Test how raising frequency affects electron speed.",
        "howToTest": "Keep brightness constant and increase frequency. Observe that electron speed increases while total electron count stays steady.",
        "visualFormula": "Kinetic Energy: KE_max = h·ν − Φ (Higher ν ➔ Faster Electrons)"
      },
      "4": {
        "goal": "Give the energy of one photon from a 500 nm lamp.",
        "science": "Planck Energy Formula: E = h·ν = h·c / λ. With h = 6.626 × 10⁻³⁴ J·s and λ = 500 × 10⁻⁹ m, E = 3.98 × 10⁻¹⁹ J.",
        "storyProblem": "A diagnostic green laser transmits at 500 nm. Calculate the energy of a single photon to calibrate our optical sensor gain.",
        "howToTest": "Divide c by 500 nm to find frequency (6.00 × 10¹⁴ Hz), then multiply by Planck's constant h.",
        "visualFormula": "E = (h × c) / λ = (6.626e-34 × 3.00e8) / (500e-9) = 3.98 × 10⁻¹⁹ J"
      },
      "5": {
        "goal": "Order the three plates by how tightly each holds its electrons, loosest first.",
        "science": "Work Function Variations: Cesium holds electrons loosest (~3.4 × 10⁻¹⁹ J), Sodium moderately (~3.7 × 10⁻¹⁹ J), and Zinc tightest (~6.9 × 10⁻¹⁹ J).",
        "storyProblem": "Three salvage plates are available for sensor rebuilding. Order them from easiest to ionize to hardest to select the most sensitive plate.",
        "howToTest": "Measure the threshold frequency required to eject electrons from each metal: lower threshold frequency means a looser work function.",
        "visualFormula": "Work Function: Cesium (Loosest) < Sodium < Zinc (Tightest)"
      },
      "6": {
        "goal": "Pick the lamp that frees electrons from the zinc plate.",
        "science": "High Work Function Requirements: Zinc holds electrons so tightly that visible light photons lack the required energy; only ultraviolet photons can eject electrons.",
        "storyProblem": "An outdoor hull sensor made of zinc must be tested. Select the lamp source that carries enough energy to overcome zinc's work function.",
        "howToTest": "Compare photon energies of the available lamps against zinc's work function (6.9 × 10⁻¹⁹ J).",
        "visualFormula": "Zinc Work Function (6.9 × 10⁻¹⁹ J) Requires Ultraviolet Light (λ < 290 nm)"
      },
      "7": {
        "goal": "Say why a brighter red lamp will never work on zinc.",
        "science": "One-on-One Quantum Interaction: Energy cannot accumulate over time across multiple low-energy photons. If an individual photon's energy is below Φ, zero electrons eject.",
        "storyProblem": "A crew member asks if a 10,000-watt red spotlight could trigger the zinc sensor. Explain why quantum mechanics forbids this.",
        "howToTest": "Recall the 1-photon : 1-electron rule. Sub-threshold photons cannot combine to overcome the work function.",
        "visualFormula": "Quantized Rule: If h·ν < Φ, Ejection = 0 (Regardless of Lamp Power)"
      }
    }
  },
  "q3-lines": {
    "title": "Line Spectra",
    "concept": "Atomic Spectra & Bohr Energy Levels (ΔE = h·ν)",
    "overview": "Excited gaseous atoms emit light only at specific, discrete wavelengths forming a unique line spectrum rather than a continuous rainbow. Electrons exist in quantized energy levels; when an electron drops from a higher level to a lower level, it emits a single photon whose energy matches the gap: ΔE = h·ν = h·c / λ.",
    "storyline": "An unmarked gas canister was salvaged from a sealed research cache on Lanternfall. Venting unknown gas could poison the outpost atmospheric scrubber! By hooking the canister to our electrical discharge tube and reading its line spectrum fingerprint against atomic databases, we can safely identify the element.",
    "vocab": [
      {
        "word": "Emission Spectrum",
        "meaning": "Discrete bright lines emitted by excited atoms as electrons fall to lower energy levels."
      },
      {
        "word": "Absorption Spectrum",
        "meaning": "Dark bands produced when cool gas absorbs specific photon frequencies from continuous light."
      },
      {
        "word": "Ground State",
        "meaning": "The lowest, most stable electron energy level in an atom (n = 1)."
      },
      {
        "word": "Excited State",
        "meaning": "Any higher energy level occupied by an electron after absorbing energy (n > 1)."
      },
      {
        "word": "Bohr Formula",
        "meaning": "Hydrogen energy level equation: E_n = −2.18 × 10⁻¹⁸ J / n²."
      }
    ],
    "stages": {
      "0": {
        "goal": "Say how the hot filament's light differs from the gas tube's.",
        "science": "Continuous Spectrum vs Line Spectrum: A hot solid produces an unbroken continuous rainbow of all wavelengths, while an excited gas emits only isolated sharp lines.",
        "storyProblem": "Compare light from a standard halogen filament bulb against an energized planetary gas tube on the spectroscope.",
        "howToTest": "Observe the spectroscope display: notice the smooth continuous color smear of the filament versus the sharp discrete spikes of the gas tube.",
        "visualFormula": "Hot Solid = Continuous Rainbow · Glowing Gas = Discrete Line Spectrum"
      },
      "1": {
        "goal": "Identify the gas in the sealed tube.",
        "science": "Spectral Fingerprinting: Every chemical element has a unique arrangement of energy levels, giving it a distinctive set of emission lines that no other element shares.",
        "storyProblem": "The salvaged gas canister is energized in the discharge chamber. Match its emission line positions to the database to identify the mystery gas.",
        "howToTest": "Note the exact wavelength positions of the bright lines on the scale and match them against reference element cards.",
        "visualFormula": "Unique Spectral Lines = Elemental Atomic Fingerprint"
      },
      "2": {
        "goal": "Say what the cool gas in front of the filament does to its light.",
        "science": "Atomic Absorption: Cool gas atoms absorb precisely the same photon wavelengths that they emit when hot, leaving dark absorption lines across the continuous spectrum.",
        "storyProblem": "A beam of light shines through an unheated hydrogen vapor cloud. Observe what happens to the transmitted spectrum.",
        "howToTest": "Compare the positions of the dark lines created by the cold gas with the bright lines emitted by the hot gas.",
        "visualFormula": "Absorption Lines (Dark Gaps) Appear at the EXACT SAME λ as Emission Lines"
      },
      "3": {
        "goal": "Say which jump on the ladder gives the red line.",
        "science": "Hydrogen Balmer Transitions: The red line (656 nm) has the lowest energy in the visible Balmer series, corresponding to the smallest jump down from n = 3 to n = 2.",
        "storyProblem": "Hydrogen emits a prominent red spectral line. Identify which electron energy level drop generates this photon.",
        "howToTest": "Look at the energy ladder diagram: the smallest downward transition into n = 2 is n = 3 ➔ n = 2.",
        "visualFormula": "Red Line (656 nm, Lowest Energy): Transition n = 3 ➔ n = 2"
      },
      "4": {
        "goal": "Give the energy of the 486 nm line.",
        "science": "Photon Energy Calculation: ΔE = h·c / λ. For the blue-green 486 nm line: ΔE = (6.626e-34 × 3.00e8) / (486e-9) = 4.09 × 10⁻¹⁹ J.",
        "storyProblem": "Hydrogen's blue-green emission line sits at 486 nm. Compute the energy carried by each emitted photon.",
        "howToTest": "Calculate ΔE = (h × c) / λ using 486 × 10⁻⁹ m.",
        "visualFormula": "ΔE = (6.626e-34 × 3.00e8) / (486e-9) = 4.09 × 10⁻¹⁹ J"
      },
      "5": {
        "goal": "Using the ladder formula, say which line the jump from the fifth rung to the second makes.",
        "science": "Bohr Formula Precision: E_n = −2.18 × 10⁻¹⁸ J / n². The transition from n = 5 to n = 2 releases ΔE = 4.58 × 10⁻¹⁹ J, producing the 434 nm violet line.",
        "storyProblem": "Predict which spectral line in the hydrogen emissions is produced by an electron falling from n = 5 to n = 2.",
        "howToTest": "Calculate ΔE = E₅ − E₂ and convert energy to wavelength: λ = h·c / ΔE = 434 nm.",
        "visualFormula": "Transition n = 5 ➔ n = 2: ΔE = 4.58 × 10⁻¹⁹ J ➔ Violet Line (434 nm)"
      },
      "6": {
        "goal": "Say what happens to an electron given more than 2.18 x 10^-18 J while it sits in the ground state.",
        "science": "Ionization Energy: Hydrogen's ground state binding energy is 2.18 × 10⁻¹⁸ J. Providing this energy frees the electron entirely from the nucleus, ionizing the atom.",
        "storyProblem": "A high-energy UV pulse strikes a hydrogen atom with more than 2.18 × 10⁻¹⁸ J. What happens to the atom's electron?",
        "howToTest": "Trace the energy ladder to the top limit (n = ∞): exceeding this threshold frees the electron into an unbound free state.",
        "visualFormula": "Energy Input ≥ 2.18 × 10⁻¹⁸ J ➔ Electron Escapes ➔ Ionization (H ➔ H⁺ + e⁻)"
      },
      "7": {
        "goal": "Say why the ladder works for hydrogen but not for helium.",
        "science": "Electron-Electron Repulsion: Bohr's simple 1-electron formula assumes only electron-nucleus attraction. In multi-electron atoms like Helium (2 electrons), inter-electron repulsions distort the energy levels.",
        "storyProblem": "A lab student attempts to calculate Helium's spectral lines using Bohr's hydrogen formula and gets incorrect answers. Explain the physical reason.",
        "howToTest": "Compare atomic structures: Hydrogen has 1 electron (no repulsion). Helium has 2 electrons that repel each other, breaking the simple model.",
        "visualFormula": "Hydrogen: 1 Electron (Simple Bohr Holds) · Helium: Multi-Electron Repulsion (Distorts Levels)"
      }
    }
  },
  "q4-cloud": {
    "title": "Orbitals",
    "concept": "Atomic Orbitals & Electron Probability (s, p, d)",
    "overview": "Electrons do not orbit the nucleus on fixed planetary tracks. Instead, an electron behaves as a 3D standing matter wave. An orbital is a probability distribution map showing where an electron is likely to be located. Spherical s orbitals, dumbbell-shaped p orbitals, and four-lobed d orbitals reflect different quantum wave states.",
    "storyline": "Lanternfall's magnetic containment bubble protects the research colony from solar particle wind. The magnetic coils must be tuned to match the exact 3D probability geometry and nodal planes of orbital clouds. By discovering the shapes of s, p, and d orbitals, you will balance the containment field.",
    "vocab": [
      {
        "word": "Orbital",
        "meaning": "A 3D region of space where there is a 90% probability of finding an electron."
      },
      {
        "word": "Node",
        "meaning": "A point, plane, or spherical surface where the probability of finding an electron is exactly zero."
      },
      {
        "word": "s Orbital",
        "meaning": "A spherically symmetrical orbital present in every shell (l = 0)."
      },
      {
        "word": "p Orbital",
        "meaning": "A dumbbell-shaped orbital with two lobes and one planar node (l = 1; px, py, pz)."
      },
      {
        "word": "Uncertainty Principle",
        "meaning": "Heisenberg's principle: position and velocity of an electron cannot both be precisely known simultaneously."
      }
    ],
    "stages": {
      "0": {
        "goal": "Say where Sample A's electron is.",
        "science": "Probability Nature of Electrons: Individual measurements find the electron at single random points. Only repeated measurements reveal a statistical probability cloud.",
        "storyProblem": "A single sensor ping detects an electron at one spot, but the next ping finds it elsewhere. Determine how to describe its location.",
        "howToTest": "Fire test pings on the bench. Observe how single dots scatter across the display into a probabilistic pattern.",
        "visualFormula": "Single Ping = Random Point · Many Pings = 3D Probability Density Cloud"
      },
      "1": {
        "goal": "Describe the shape after 500 shots.",
        "science": "Spherical s Orbital: After hundreds of measurements, the lowest energy state forms a dense sphere centered on the nucleus: a 1s orbital.",
        "storyProblem": "The containment computer requires the 3D geometry of the lowest energy electron state to set the coil field shape.",
        "howToTest": "Accumulate 500 pings on the display and observe the circular spherical outline.",
        "visualFormula": "1s Orbital Shape: Spherically Symmetrical (Densest at Nucleus)"
      },
      "2": {
        "goal": "Pick the wavelengths that fit on the ring.",
        "science": "Standing Wave Quantization: An electron wave around a circular circumference must fit an integer number of wavelengths (n·λ = 2πr) to avoid destructive self-cancellation.",
        "storyProblem": "Calibrate the magnetic guide ring so the electron matter wave forms a constructive standing wave without canceling itself out.",
        "howToTest": "Adjust wavelength until the wave ends meet smoothly without self-interference.",
        "visualFormula": "Standing Wave Condition: n × λ = 2πr (Must Be Whole Integer n)"
      },
      "3": {
        "goal": "Compare Sample A's cloud with Sample B's.",
        "science": "Radial Nodes in Higher Shells: The 2s orbital is larger than 1s and contains a spherical radial node where the probability of finding the electron drops to zero.",
        "storyProblem": "A second, higher energy sample shows an empty ring between an inner and outer sphere of dots. Identify what this empty shell represents.",
        "howToTest": "Compare Sample A (1s) and Sample B (2s) dot distributions. Look for the empty ring where no dots appear.",
        "visualFormula": "2s Orbital: Larger Diameter + 1 Spherical Radial Node (Zero Probability)"
      },
      "4": {
        "goal": "Describe Sample C's shape and where it has no dots.",
        "science": "p Orbital Geometry: A p orbital has two lobes separated by a flat nodal plane passing directly through the nucleus where electron probability is zero.",
        "storyProblem": "Sample C displays two separated teardrop lobes. Identify its orbital type and locate where no dots land.",
        "howToTest": "Inspect Sample C on the scope: observe the two lobes and the nodal plane cutting through the center.",
        "visualFormula": "p Orbital: 2 Lobes + 1 Planar Node Through Nucleus"
      },
      "5": {
        "goal": "Say how many different ways the two-lobed shape can point.",
        "science": "Three Degenerate p Orbitals: In 3D space, dumbbell lobes can align along the x, y, or z Cartesian axes, creating three distinct orbitals: px, py, and pz.",
        "storyProblem": "Determine how many magnetic coils are required to steer all possible orientations of the p subshell.",
        "howToTest": "Rotate the 3D viewer along the 3 axes: count the mutually perpendicular orientations (px, py, pz).",
        "visualFormula": "Three p Orbitals: px (horizontal), py (vertical), pz (depth)"
      },
      "6": {
        "goal": "Sort the five clouds by shape.",
        "science": "d Orbital Sets: The third shell introduces five d orbitals: four cloverleaf four-lobed shapes and one dumbbell with a doughnut ring (dz²).",
        "storyProblem": "Categorize five complex transition metal orbital scans by their geometric lobe structures.",
        "howToTest": "Group the four cloverleaf shapes together and isolate the unique doughnut-collar orbital (dz²).",
        "visualFormula": "Five d Orbitals: 4 Four-Lobed Clovers + 1 Doughnut Ring (dz²)"
      },
      "7": {
        "goal": "Say why the bench never draws a path for the electron.",
        "science": "Heisenberg Uncertainty Principle: It is impossible to simultaneously measure an electron's precise position and momentum (Δx · Δp ≥ h/4π).",
        "storyProblem": "An operator asks why the display draws a fuzzy cloud rather than an orbit line. Explain the fundamental physical law.",
        "howToTest": "Recall the uncertainty principle: measuring exact position destroys momentum knowledge, ruling out fixed classical trajectories.",
        "visualFormula": "Δx × Δp ≥ h / (4π) ➔ Probability Cloud, NOT a Planetary Orbit"
      }
    }
  },
  "q5-numbers": {
    "title": "Quantum Numbers",
    "concept": "Quantum Addresses (n, l, ml, ms) & Pauli Exclusion",
    "overview": "Every electron in an atom is uniquely identified by four quantum numbers: n (principal shell energy), l (subshell shape: 0=s, 1=p, 2=d), ml (spatial orientation: −l to +l), and ms (spin: +½ or −½). The Pauli Exclusion Principle mandates that no two electrons in an atom share all four identical numbers.",
    "storyline": "Lanternfall's optical quantum memory buffers store data in electron states. To prevent buffer overflows and data collisions, the storage compiler must assign valid quantum address coordinates that satisfy quantum mechanical selection rules.",
    "vocab": [
      {
        "word": "Principal (n)",
        "meaning": "Shell level (n = 1, 2, 3...) determining average distance from the nucleus and energy."
      },
      {
        "word": "Angular Momentum (l)",
        "meaning": "Orbital shape index: l = 0 (s), 1 (p), 2 (d), up to n − 1."
      },
      {
        "word": "Magnetic (ml)",
        "meaning": "Orientation index in space: integers from −l to +l (total 2l + 1 orbitals)."
      },
      {
        "word": "Spin (ms)",
        "meaning": "Intrinsic angular momentum: either +½ (spin-up ↑) or −½ (spin-down ↓)."
      },
      {
        "word": "Pauli Principle",
        "meaning": "Rule that no two electrons in an atom can have the exact same four quantum numbers."
      }
    ],
    "stages": {
      "0": {
        "goal": "Say what the first number on every box tracks.",
        "science": "Principal Quantum Number n: Sets the electron's main energy level and shell distance. Higher n values indicate larger, more distant shells.",
        "storyProblem": "Examine memory address blocks on the rack. Identify what the leading integer n represents.",
        "howToTest": "Observe how higher n values correspond to higher energy positions on the rack.",
        "visualFormula": "Principal Quantum Number n: Shell Size & Energy (n = 1, 2, 3...)"
      },
      "1": {
        "goal": "Say which shapes the second shell offers.",
        "science": "Subshell Range l: For shell n, orbital shape l ranges from 0 to n − 1. For n = 2, l can be 0 (s orbital) and 1 (p orbital).",
        "storyProblem": "A memory allocation routine requires all valid subshell shapes available in Shell 2.",
        "howToTest": "Apply the rule l < n: for n = 2, l can be 0 (s) or 1 (p).",
        "visualFormula": "For Shell n = 2: Allowed l = 0 (s subshell) and l = 1 (p subshell)"
      },
      "2": {
        "goal": "Say how many boxes a d row has.",
        "science": "Orbital Multiplicity: ml ranges from −l to +l, giving 2l + 1 distinct orbitals. For a d subshell (l = 2), ml = −2, −1, 0, +1, +2 (5 orbitals).",
        "storyProblem": "Count how many independent storage registers exist in a d-subshell block.",
        "howToTest": "Count the boxes across the d row: 2(2) + 1 = 5 boxes.",
        "visualFormula": "ml Count = 2l + 1 ➔ For d (l = 2): 2(2) + 1 = 5 Orbitals"
      },
      "3": {
        "goal": "Put two electrons in one box.",
        "science": "Opposite Electron Spins: A single orbital box can hold at most two electrons, and they must have opposite spins (+½ up, −½ down).",
        "storyProblem": "Load two electrons into a single register cell without triggering a quantum rejection fault.",
        "howToTest": "Flip the spin arrow of the second electron so one arrow points up (+½) and one points down (−½).",
        "visualFormula": "Orbital Pairing: 1 Box Holds [↑ (+½)] and [↓ (−½)]"
      },
      "4": {
        "goal": "Say which two of these four electrons cannot be in the same atom.",
        "science": "Pauli Exclusion Principle: No two electrons in an atom can have the exact same set of four quantum numbers (n, l, ml, ms).",
        "storyProblem": "Two memory addresses in the register have identical quantum coordinates. Identify the pair that violates physical law.",
        "howToTest": "Compare all four numbers across the four candidates: identify which two have identical values for n, l, ml, and ms.",
        "visualFormula": "Pauli Exclusion: (n, l, ml, ms) Must Be Unique For Every Electron"
      },
      "5": {
        "goal": "Say how many electrons the third shell holds.",
        "science": "Shell Electron Capacity: Maximum electrons per shell equals 2n². For n = 3: 2(3²) = 2(9) = 18 electrons (2 in 3s, 6 in 3p, 10 in 3d).",
        "storyProblem": "Calculate the total storage capacity of Shell 3 before the buffer fills.",
        "howToTest": "Sum the capacities of 3s (2), 3p (6), and 3d (10), or use the formula 2n².",
        "visualFormula": "Max Shell Electrons = 2n² ➔ For n = 3: 2 × (3²) = 18 Electrons"
      },
      "6": {
        "goal": "Pick the four numbers that name one of the 2p electrons of Sample A.",
        "science": "Complete Quantum Address: A 2p electron has n = 2, l = 1, ml in {−1, 0, +1}, and ms in {+½, −½}.",
        "storyProblem": "Trace the exact hardware coordinate address of an outer 2p electron in a Nitrogen sample.",
        "howToTest": "Confirm n = 2 (second shell), l = 1 (p orbital), and select valid matching ml and ms.",
        "visualFormula": "2p Electron Address: n = 2, l = 1, ml ∈ {−1, 0, +1}, ms ∈ {+½, −½}"
      },
      "7": {
        "goal": "Pick every set of numbers that cannot name an electron.",
        "science": "Quantum Number Rules: n ≥ 1, l must be 0 to n − 1, |ml| ≤ l, and ms must be ±½. Sets violating these rules are forbidden.",
        "storyProblem": "Run the memory diagnostics scrub: flag every invalid quantum address that violates quantum boundaries.",
        "howToTest": "Check each set: flag any where l ≥ n, |ml| > l, or ms is not ±½.",
        "visualFormula": "Rules: n ≥ 1 · 0 ≤ l ≤ n−1 · −l ≤ ml ≤ +l · ms = ±½"
      }
    }
  },
  "q6-filling": {
    "title": "Electron Configuration",
    "concept": "Electron Configurations (Aufbau, Hund, Pauli)",
    "overview": "Electrons fill atomic subshells according to three physical laws: Aufbau (lowest energy subshells fill first), Hund's Rule (orbitals of equal energy are occupied singly with parallel spins before pairing), and Pauli Exclusion (max 2 electrons per orbital with opposite spins). Periodic table structure mirrors these exact filling sequences.",
    "storyline": "Lanternfall's magnetic shielding alloys and superconductor cables depend on the electron spin configurations of transition metal elements. Unpaired electrons make materials magnetic (paramagnetic), while fully paired configurations make them diamagnetic. Configure electron racks to synthesize specialized alloys.",
    "vocab": [
      {
        "word": "Aufbau Principle",
        "meaning": "Electrons fill the lowest available energy orbital before occupying higher ones."
      },
      {
        "word": "Hund's Rule",
        "meaning": "Electrons singly occupy degenerate orbitals with parallel spins before pairing up."
      },
      {
        "word": "Paramagnetic",
        "meaning": "An atom with one or more unpaired electrons, drawn into magnetic fields."
      },
      {
        "word": "Diamagnetic",
        "meaning": "An atom where all electrons are paired up, weakly repelled by magnetic fields."
      },
      {
        "word": "Noble Gas Shorthand",
        "meaning": "Abbreviating full inner core shells with the preceding noble gas symbol in brackets (e.g., [Ar])."
      }
    ],
    "stages": {
      "0": {
        "goal": "Place carbon's six electrons.",
        "science": "Aufbau Filling Order: Lowest energy fills first: 1s takes 2 electrons, 2s takes 2 electrons, and 2p takes the remaining 2 electrons (1s² 2s² 2p²).",
        "storyProblem": "Synthesize a pure carbon lattice by filling the energy rack with its 6 electrons from ground level up.",
        "howToTest": "Fill the 1s box with 2 electrons, the 2s box with 2 electrons, and place the last 2 into 2p.",
        "visualFormula": "Aufbau Sequence: 1s² ➔ 2s² ➔ 2p² (Total 6 Electrons)"
      },
      "1": {
        "goal": "Say how carbon's two p electrons sit.",
        "science": "Hund's Rule of Maximum Multiplicity: Carbon's two 2p electrons sit in separate boxes with parallel up-spins (↑  ↑  _ ) to minimize electron repulsion.",
        "storyProblem": "Test the magnetic pull on carbon to determine whether its 2p electrons pair up in one box or spread out singly.",
        "howToTest": "Observe the paramagnetic pull from the magnet: unpaired electrons confirm they occupy separate boxes with parallel spins.",
        "visualFormula": "Hund's Rule: Separate Boxes First ( [↑] [↑] [ ] ) = Paramagnetic"
      },
      "2": {
        "goal": "Say what the rack reads for oxygen.",
        "science": "Electron Configuration Notation: Oxygen has 8 electrons: 1s² 2s² 2p⁴. The 2p subshell has 1 paired box and 2 half-filled boxes.",
        "storyProblem": "Record oxygen's full electron configuration code for the atmospheric life support synthesizer.",
        "howToTest": "Count electrons in each subshell: 2 in 1s, 2 in 2s, and 4 in 2p.",
        "visualFormula": "Oxygen (Z = 8): 1s² 2s² 2p⁴"
      },
      "3": {
        "goal": "Place potassium's nineteenth electron.",
        "science": "Subshell Energy Overlap: The 4s subshell is lower in energy than 3d, so Potassium's 19th electron enters 4s, not 3d: [Ar] 4s¹.",
        "storyProblem": "Potassium is needed for electrolyte fluid. Configure its 19th electron on the energy rack.",
        "howToTest": "Look at energy levels: 4s sits below 3d on the energy ladder. Place the electron in 4s.",
        "visualFormula": "Energy Filling: 1s < 2s < 2p < 3s < 3p < 4s < 3d (4s Fills BEFORE 3d)"
      },
      "4": {
        "goal": "Write iron's arrangement in short form.",
        "science": "Noble Gas Shorthand Notation: Iron (Z = 26) uses the Argon core ([Ar], 18 electrons) plus valence electrons: [Ar] 4s² 3d⁶.",
        "storyProblem": "Compress Iron's long configuration string to standard noble-gas notation for the metallurgy ledger.",
        "howToTest": "Substitute the completed 18-electron core with [Ar], then append the remaining 4s² 3d⁶ electrons.",
        "visualFormula": "Iron (Z = 26): [Ar] 4s² 3d⁶"
      },
      "5": {
        "goal": "Sort the six elements by the row their last electron went into.",
        "science": "Periodic Table Blocks: Elements belong to the s-block (groups 1-2), p-block (groups 13-18), d-block (transition metals), or f-block (lanthanides/actinides).",
        "storyProblem": "Classify six unknown reactor elements into their structural periodic blocks (s, p, d).",
        "howToTest": "Check the subshell containing the element's outermost valence electron.",
        "visualFormula": "Blocks: s-block (Groups 1-2) · p-block (Groups 13-18) · d-block (Transition Metals)"
      },
      "6": {
        "goal": "Remove two electrons from iron.",
        "science": "Transition Metal Ionization: When transition metals form cations, electrons are removed from the outermost 4s subshell first before 3d: Fe²⁺ is [Ar] 3d⁶.",
        "storyProblem": "An iron alloy undergoes oxidation to Fe²⁺. Determine which electrons are lost first.",
        "howToTest": "Remove the two electrons from the outer 4s subshell, leaving the 3d⁶ subshell intact.",
        "visualFormula": "Fe ([Ar] 4s² 3d⁶) ➔ Lose 4s Electrons First ➔ Fe²⁺ ([Ar] 3d⁶)"
      },
      "7": {
        "goal": "Place chromium's electrons so the rack's pull matches the sample's.",
        "science": "Half-Filled Subshell Stability: Chromium promotes a 4s electron to 3d to achieve half-filled stability: [Ar] 4s¹ 3d⁵ (6 unpaired electrons).",
        "storyProblem": "Chromium displays unusually high magnetic attraction. Configure its valence shell to match its 6 unpaired spins.",
        "howToTest": "Move one electron from 4s into 3d, leaving each 3d box and the 4s box with exactly one electron.",
        "visualFormula": "Chromium Exception: [Ar] 4s¹ 3d⁵ (Half-Filled Stability with 6 Unpaired Spins)"
      }
    }
  },
  "q7-pes": {
    "title": "Photoelectron Spectroscopy",
    "concept": "Photoelectron Spectroscopy & Subshell Binding Energies",
    "overview": "Photoelectron Spectroscopy (PES) uses high-energy X-rays to knock electrons out of atomic subshells. By measuring the kinetic energy of ejected electrons, the instrument determines their binding energies (how tightly the nucleus holds them). Each peak represents a distinct subshell (1s, 2s, 2p, etc.); peak location shows binding energy, and peak height is proportional to the number of electrons in that subshell.",
    "storyline": "Geothermal drill bits on Lanternfall hit unidentifiable hard mineral nodules. Chemical acids cannot dissolve them, but X-ray PES probing knocks core electrons free to map the subshell architecture. Reading these spectra identifies unknown elements and explains their extreme hardness.",
    "vocab": [
      {
        "word": "PES Spectrum",
        "meaning": "Graph of electron signal intensity (height = electron count) vs binding energy."
      },
      {
        "word": "Binding Energy",
        "meaning": "The energy holding an electron to the nucleus; electrons closer to the nucleus have higher binding energy."
      },
      {
        "word": "Peak Height",
        "meaning": "Directly proportional to the number of electrons occupying that specific subshell."
      },
      {
        "word": "Subshell Peaks",
        "meaning": "Distinct signals corresponding to 1s, 2s, 2p, 3s subshells ordered by distance from nucleus."
      },
      {
        "word": "Nuclear Charge Shift",
        "meaning": "More protons in the nucleus pull all subshells tighter, shifting peaks to higher binding energies."
      }
    ],
    "stages": {
      "0": {
        "goal": "Say how Sample B's spectrum differs from Sample A's, and what that says about them.",
        "science": "PES Peak Interpretation: Peak position indicates binding energy (closeness to nucleus), while peak height indicates the number of electrons in that subshell.",
        "storyProblem": "Compare two mystery alloy drill samples on the PES detector to determine what difference in peak heights and positions reveals.",
        "howToTest": "Examine the two spectra: compare horizontal peak positions (energy required) and vertical peak heights (electron count).",
        "visualFormula": "PES Graph: X-Axis = Binding Energy (Tightness) · Y-Axis = Peak Height (Electron Count)"
      },
      "1": {
        "goal": "Say what the height of a peak counts.",
        "science": "Peak Height Conservation: Peak height is strictly proportional to the number of electrons in that subshell. The sum of all peak heights equals the atom's total electron count.",
        "storyProblem": "Calibrate the spectrometer detector so that peak heights reliably count electron populations in unknown samples.",
        "howToTest": "Count the vertical grid units of each peak and sum them together to match total electron counts.",
        "visualFormula": "Total Electrons = Sum of All PES Peak Heights"
      },
      "2": {
        "goal": "Say why lithium has a short peak far to the left of its tall one.",
        "science": "Core vs Valence Binding Energies: Lithium's 1s subshell holds 2 electrons very close to the nucleus (high binding energy), while its 2s valence shell holds 1 electron much farther out (low binding energy).",
        "storyProblem": "Explain Lithium's PES scan (1s² 2s¹) to the geology crew to verify why one peak requires drastically higher ionization energy.",
        "howToTest": "Identify the 1s peak (high energy, 2 electrons tall) and the 2s peak (low energy, 1 electron tall).",
        "visualFormula": "Lithium (1s² 2s¹): 1s Peak (Height 2, High Energy) + 2s Peak (Height 1, Low Energy)"
      },
      "3": {
        "goal": "Say why boron's second shell shows two peaks.",
        "science": "Subshell Energy Splitting: In multi-electron atoms, the 2s subshell penetrates closer to the nucleus than 2p, giving 2s electrons a higher binding energy than 2p electrons.",
        "storyProblem": "Boron (1s² 2s² 2p¹) has two separate peaks in Shell 2. Explain why electrons in the same shell don't have identical binding energies.",
        "howToTest": "Observe the 2s peak (height 2, higher binding energy) versus the 2p peak (height 1, slightly lower binding energy).",
        "visualFormula": "Boron Shell 2 Split: 2s² (Higher Binding Energy) vs 2p¹ (Lower Binding Energy)"
      },
      "4": {
        "goal": "Identify the sealed specimen from its spectrum.",
        "science": "Elemental Identification from PES: Peak heights of 2, 2, and 4 correspond to 1s² 2s² 2p⁴, representing a total of 8 electrons: neutral Oxygen (Z = 8).",
        "storyProblem": "A sealed geological sample shows three peaks with heights 2, 2, and 4. Identify the element to ensure safe handling.",
        "howToTest": "Add the peak heights (2 + 2 + 4 = 8 electrons) and match with atomic number 8 on the periodic table.",
        "visualFormula": "Heights 2 + 2 + 4 = 8 Electrons ➔ 1s² 2s² 2p⁴ ➔ Oxygen (O, Z = 8)"
      },
      "5": {
        "goal": "Say why neon's innermost peak sits further along than fluorine's.",
        "science": "Nuclear Charge Effect on Binding Energy: Neon has 10 protons pulling on its 1s electrons compared to Fluorine's 9 protons. Greater nuclear charge binds core electrons tighter, shifting the 1s peak to higher energy.",
        "storyProblem": "Compare core 1s binding energies between Fluorine and Neon gas seals to calibrate sensor voltage thresholds.",
        "howToTest": "Note that Neon's 10 protons pull harder than Fluorine's 9 protons, shifting the entire spectrum toward higher binding energy.",
        "visualFormula": "Higher Nuclear Charge (10 p⁺ > 9 p⁺) ➔ Tighter Pull ➔ Higher 1s Binding Energy"
      },
      "6": {
        "goal": "Match each spectrum to sodium, magnesium or aluminum.",
        "science": "Period 3 Valence Filling in PES: Sodium has 3s¹ (height 1), Magnesium has 3s² (height 2), and Aluminum has 3s² (height 2) plus a new 3p¹ peak (height 1).",
        "storyProblem": "Three lightweight construction alloy plates must be verified as pure Na, Mg, or Al from their valence PES peaks.",
        "howToTest": "Check the outermost peaks: Na has one 3s¹ peak, Mg has a taller 3s² peak, and Al has 3s² plus a separate 3p¹ peak.",
        "visualFormula": "Na (3s¹) · Mg (3s²) · Al (3s² 3p¹: New Subshell Peak)"
      },
      "7": {
        "goal": "Write the configuration that the sealed specimen's spectrum shows.",
        "science": "Translating PES Directly to Electron Configuration: Reading peaks in order of decreasing binding energy gives the exact electron configuration subshell by subshell.",
        "storyProblem": "Decode the complete electron configuration string directly from the spectrum peaks to program the alloy synthesizer.",
        "howToTest": "Read each peak from highest energy (core) to lowest energy (valence), writing subshell label and electron count.",
        "visualFormula": "PES Peaks ➔ Direct Configuration: 1s² 2s² 2p⁶ 3s²..."
      }
    }
  },
  "q8-trends": {
    "title": "Periodic Trends",
    "concept": "Periodic Trends & Coulomb's Law (Radius, IE, Electronegativity)",
    "overview": "Periodic trends reflect Coulomb's Law: electrostatic attraction depends on effective nuclear charge (Z_eff) and distance (r²). Across a period, increasing Z_eff pulls the valence shell closer, shrinking atomic radius and increasing ionization energy and electronegativity. Down a group, adding principal shells increases distance, causing atoms to grow larger and hold outer electrons more loosely.",
    "storyline": "Lanternfall's geothermal power turbines suffer extreme corrosion and heat stress. To engineer durable turbine blades, we need alloys with high ionization energy (resistance to oxidation) and optimal atomic radii for tight metallic crystal packing. Explore periodic trends to select the best metallurgy candidates.",
    "vocab": [
      {
        "word": "Coulomb's Law",
        "meaning": "Attractive force between opposite charges: F ∝ (q₁ × q₂) / r²."
      },
      {
        "word": "Effective Nuclear Charge (Z_eff)",
        "meaning": "The net positive charge experienced by valence electrons: Z_eff = Z − Shielding."
      },
      {
        "word": "Atomic Radius",
        "meaning": "Distance from nucleus to valence electron shell; shrinks across periods, grows down groups."
      },
      {
        "word": "Ionization Energy (IE)",
        "meaning": "Minimum energy needed to remove an electron from a gaseous atom (rises across periods)."
      },
      {
        "word": "Electronegativity",
        "meaning": "The relative ability of an atom in a covalent bond to attract shared electron pairs."
      }
    ],
    "stages": {
      "0": {
        "goal": "Say what makes the pull on an electron stronger.",
        "science": "Coulomb's Law Attraction: Electrostatic attraction increases with greater nuclear charge and decreases with greater distance between nucleus and electron (F ∝ q/r²).",
        "storyProblem": "The metallurgy team needs to predict bond strength in heat-resistant turbine alloys. Identify what factors increase nuclear pull on electrons.",
        "howToTest": "Vary charge and distance on the pull meter: observe that higher charge and smaller distance maximize electrostatic force.",
        "visualFormula": "Coulomb's Law: F ∝ (Z_eff × e) / r² (Higher Charge + Closer Distance = Stronger Pull)"
      },
      "1": {
        "goal": "Say why sodium's outer electron feels a pull of about +1, not +11.",
        "science": "Electron Shielding and Z_eff: Sodium has 11 protons, but its 10 core inner electrons (1s² 2s² 2p⁶) shield the valence electron, leaving Z_eff ≈ 11 − 10 = +1.",
        "storyProblem": "Calculate the effective nuclear charge felt by Sodium's valence electron to explain why it is easily lost in corrosion reactions.",
        "howToTest": "Subtract inner core shielding electrons from total nuclear protons: Z_eff = Z − Core = 11 − 10 = +1.",
        "visualFormula": "Z_eff = Z (11 protons) − Shielding (10 core electrons) = +1 Net Pull"
      },
      "2": {
        "goal": "Order lithium, beryllium, boron and carbon by size, largest first.",
        "science": "Atomic Radius Period Trend: Across Period 2, protons increase while electrons enter the same shell (constant shielding). Z_eff increases, pulling the shell inward: Li > Be > B > C.",
        "storyProblem": "Select elements with large atomic radii to create porous filter meshes. Rank Period 2 elements from largest to smallest atom.",
        "howToTest": "Compare atomic radii across Period 2: radius decreases from left to right as Z_eff pulls electrons tighter.",
        "visualFormula": "Atomic Radius Across Period: Lithium (Largest) > Beryllium > Boron > Carbon (Smallest)"
      },
      "3": {
        "goal": "Say why potassium is bigger than sodium.",
        "science": "Group Radius Expansion: Potassium (Period 4, 4 shells) has its valence electron in n = 4, outside one more full principal shell than Sodium (Period 3, 3 shells).",
        "storyProblem": "Determine why Potassium atoms expand crystal lattice volume compared to Sodium atoms in battery electrodes.",
        "howToTest": "Compare shell counts: Potassium has an additional principal energy shell, placing its valence electrons much farther from the nucleus.",
        "visualFormula": "Down a Group: Additional Energy Shells (n=4 vs n=3) ➔ Atomic Radius Grows"
      },
      "4": {
        "goal": "Order Na⁺, Na and Cl⁻ by size, smallest first.",
        "science": "Ionic Radii Comparisons: Cations lose outer shells and contract (Na⁺ smallest); neutral atoms are intermediate (Na); anions gain electrons, increasing repulsion and expanding (Cl⁻ largest).",
        "storyProblem": "Order ionic species by size to design a selective ion exchange membrane for water purification.",
        "howToTest": "Compare cation (lost shell = tiny), neutral atom, and anion (extra electron repulsion = swollen): Na⁺ < Na < Cl⁻.",
        "visualFormula": "Ionic Radius: Cation (Na⁺, Smallest) < Neutral (Na) < Anion (Cl⁻, Largest)"
      },
      "5": {
        "goal": "Order lithium, beryllium and boron by what it costs to strip the outer electron, and say what the order shows.",
        "science": "First Ionization Energy Anomaly: IE generally rises across Period 2 (Li < Be), but Boron dips below Beryllium because Boron's 2p¹ electron is shielded by 2s² and held less tightly.",
        "storyProblem": "Measure energy required to ionize lithium, beryllium, and boron to calibrate sacrificial anode corrosion rates.",
        "howToTest": "Measure ionization energies: Be (2s² full subshell) holds electrons tighter than B (2p¹ single electron in higher subshell): Li < B < Be.",
        "visualFormula": "IE Trend Anomaly: Li < B < Be (2p¹ in Boron is Easier to Remove than 2s² in Beryllium)"
      },
      "6": {
        "goal": "Say which charge magnesium takes when it forms an ion.",
        "science": "Successive Ionization Energies: Removing Magnesium's two 3s valence electrons requires moderate energy, but removing a 3rd electron requires stripping the closed 2p core, causing an enormous energy jump. Hence Mg forms Mg²⁺.",
        "storyProblem": "Examine the successive ionization energy graph of Magnesium to explain why it forms stable Mg²⁺ and never Mg³⁺ in minerals.",
        "howToTest": "Look at the energy jumps: IE₁ and IE₂ are moderate; IE₃ shows a massive leap into the inner core.",
        "visualFormula": "IE₁ (Moderate) + IE₂ (Moderate) ➔ Huge Spike at IE₃ (Core Breach) ➔ Forms Mg²⁺"
      },
      "7": {
        "goal": "Order sodium, carbon, nitrogen and fluorine by how hard each pulls on a pair of electrons it shares, weakest first.",
        "science": "Electronegativity Trend: The pull on shared bond electrons increases across the periodic table with increasing Z_eff and decreasing radius: Na (0.9) < C (2.5) < N (3.0) < F (4.0).",
        "storyProblem": "Select bond partners for synthetic sealant resins. Order elements by bond polarity pull from weakest to strongest.",
        "howToTest": "Check electronegativity values: nonmetals with high Z_eff pull hardest on shared bonding pairs.",
        "visualFormula": "Electronegativity: Na (Weakest, 0.9) < Carbon (2.5) < Nitrogen (3.0) < Fluorine (Strongest, 4.0)"
      }
    }
  },
  "q9-absorb": {
    "title": "Spectroscopy",
    "concept": "Beer-Lambert Law & Spectrophotometry (A = ε·b·c)",
    "overview": "When light passes through a colored solution, dissolved solute molecules absorb photons of specific wavelengths. The Beer-Lambert Law states that Absorbance (A) is directly proportional to path length (b) and molar concentration (c): A = ε·b·c, where ε is molar absorptivity. Preparing known standards creates a calibration curve to quantify unknown solution concentrations.",
    "storyline": "Following an earthquake on Lanternfall, corrosive copper sulfate leaked into the outpost's drinking reservoir. Visual inspection alone cannot confirm safe contaminant levels. By measuring light absorbance at peak wavelength (635 nm) on a spectrophotometer and plotting a calibration curve, you will determine the exact contamination concentration.",
    "vocab": [
      {
        "word": "Beer-Lambert Law",
        "meaning": "Absorbance equation: A = ε × b × c (Absorbance = molar absorptivity × path length × concentration)."
      },
      {
        "word": "Absorbance (A)",
        "meaning": "A dimensionless measure of the fraction of incident light absorbed by the sample."
      },
      {
        "word": "Molar Absorptivity (ε)",
        "meaning": "A constant describing how strongly a chemical species absorbs light at a given wavelength."
      },
      {
        "word": "Path Length (b)",
        "meaning": "The internal width of the cuvette sample holder through which light passes (typically 1.0 cm)."
      },
      {
        "word": "Calibration Curve",
        "meaning": "A standard linear plot of absorbance versus known concentration used to determine unknown samples."
      }
    ],
    "stages": {
      "0": {
        "goal": "Say what each kind of light does to the molecule in the cuvette.",
        "science": "Molecular Energy Transitions: Microwaves stimulate molecular rotation; Infrared (IR) stimulates molecular bond vibration; Ultraviolet/Visible (UV-Vis) excites valence electrons to higher energy levels.",
        "storyProblem": "Test which electromagnetic radiation band is needed to monitor dissolved chemical contaminants in the reservoir cuvette.",
        "howToTest": "Examine the instrument response under microwave, IR, and UV-Vis beams: note molecular rotation, vibration, and electronic excitation.",
        "visualFormula": "Microwave = Molecular Rotation · Infrared = Bond Vibration · UV-Vis = Electron Excitation"
      },
      "1": {
        "goal": "Match each reading to the light that caused it.",
        "science": "Photon Energy and Transitions: Rotational transitions require lowest energy (microwaves, long λ), vibrational transitions require intermediate energy (IR), and electronic transitions require highest energy (UV-Vis, short λ).",
        "storyProblem": "Three separate sensor channels record energy absorption from the water line. Match each signal to its wavelength band.",
        "howToTest": "Remember the photon energy scale: longer wavelength means lower energy quantum transition.",
        "visualFormula": "Energy Scale: Rotation (Microwave, Low E) < Vibration (IR) < Electronic (UV-Vis, High E)"
      },
      "2": {
        "goal": "Say why the copper solution looks blue.",
        "science": "Complementary Colors: A solution appears the complementary color of the light it absorbs. Copper(II) sulfate strongly absorbs orange/red light (~635 nm) and transmits blue light to your eyes.",
        "storyProblem": "Explain why contaminated copper runoff appears intense blue in the settlement drainage trench.",
        "howToTest": "Look at the color wheel: orange light is absorbed by copper ions, leaving blue light transmitted to the observer.",
        "visualFormula": "Solution Absorbs Orange Light (635 nm) ➔ Transmits Complementary Blue Light to Eye"
      },
      "3": {
        "goal": "Pick the best wavelength to measure this solution at.",
        "science": "Wavelength of Maximum Absorbance (λ_max): Measuring at the peak absorbance wavelength maximizes sensitivity and provides the most reliable linear Beer's law response.",
        "storyProblem": "Tune the spectrophotometer detector to the optimum wavelength for measuring copper contamination at parts-per-million levels.",
        "howToTest": "Locate the highest peak on the absorbance vs wavelength spectrum curve.",
        "visualFormula": "Optimal Measurement: Tune to λ_max (Peak Absorbance for Maximum Sensitivity)"
      },
      "4": {
        "goal": "Say what doubling the concentration does to the absorbance.",
        "science": "Direct Proportionality with Concentration: Absorbance is directly proportional to solute concentration: doubling the concentration doubles the number of absorbing particles in the beam path, doubling absorbance.",
        "storyProblem": "Test standard calibration tubes with 1x, 2x, and 4x copper concentrations to determine how absorbance scales.",
        "howToTest": "Compare absorbance readings across known standard tubes: notice the exact linear doubling (A ∝ c).",
        "visualFormula": "Linear Relation: Concentration × 2 ➔ Absorbance × 2 (A ∝ c)"
      },
      "5": {
        "goal": "Say what doubling the path does to the absorbance.",
        "science": "Direct Proportionality with Path Length: Doubling cuvette path length doubles the distance light travels through the solution, doubling the number of photon-molecule collisions and doubling absorbance (A ∝ b).",
        "storyProblem": "The lab ran out of standard 1 cm cuvettes and only has a 2 cm cell. Determine how the wider cuvette alters absorbance.",
        "howToTest": "Double the cuvette width setting: observe that light encounters twice as many molecules, doubling absorbance.",
        "visualFormula": "Path Length Relation: Path Length × 2 ➔ Absorbance × 2 (A ∝ b)"
      },
      "6": {
        "goal": "Write the rule that connects absorbance, path and concentration.",
        "science": "Beer-Lambert Law Formula: A = ε·b·c, where A is absorbance, ε is molar absorptivity (L/(mol·cm)), b is path length (cm), and c is molarity (mol/L).",
        "storyProblem": "Formulate the exact mathematical equation governing the water testing spectrophotometer.",
        "howToTest": "Combine the proportional relationships into the standard formula: A = ε·b·c.",
        "visualFormula": "Beer-Lambert Law: A = ε × b × c"
      },
      "7": {
        "goal": "Find the concentration of the sealed sample.",
        "science": "Calibration Curve Interpolation: Plotting absorbance of known standards yields a straight line (A = slope × c). An unknown sample's concentration is interpolated directly from its measured absorbance.",
        "storyProblem": "An unknown water sample from Reservoir Tank 4 reads A = 0.40. Calculate its exact molar concentration using the calibration curve.",
        "howToTest": "Find A = 0.40 on the vertical absorbance axis, trace across to the calibration line, and read down to find concentration c = A / (ε·b).",
        "visualFormula": "Unknown Concentration: c = A / (ε × b)"
      }
    }
  },
  "boss-eater": {
    "title": "The Lantern-Eater",
    "concept": "Comprehensive Unit 2 Review",
    "overview": "Synthesize all Unit 2 chemistry concepts to overcome the Lantern-Eater anomaly: identify hydrogen spectral transitions, determine photoelectric thresholds, calculate ground-state unpaired spins, identify elements from PES binding peaks, and compute solution concentration using Beer's Law.",
    "storyline": "A rogue energy anomaly nicknamed the Lantern-Eater has engulfed the main power relay on Lanternfall! Its protective energy shroud operates through quantum resonance fields. To neutralize the creature and restore base power, you must calculate its precise spectral, photoelectric, and chemical parameters to dismantle its harmonic shield layer by layer!",
    "vocab": [
      {
        "word": "Optical Resonance",
        "meaning": "Disruption of spectral emission lines to destabilize energy fields."
      },
      {
        "word": "Photoelectric Threshold",
        "meaning": "Stripping protective surface charges using threshold-tuned photons."
      },
      {
        "word": "Paramagnetic Field",
        "meaning": "Neutralizing magnetic shielding fields using electron spin counts."
      },
      {
        "word": "Core Binding Peak",
        "meaning": "Identifying elemental anchor nuclei via PES binding peak signatures."
      },
      {
        "word": "Spectrophotometric Quench",
        "meaning": "Calculating quenching laser absorption via Beer-Lambert Law."
      }
    ],
    "stages": {
      "0": {
        "goal": "Phase 1: Identify the electron drop that produces the red 656 nm line emitted by the entity.",
        "science": "Hydrogen Balmer Red Emission: The 656 nm red line is produced by the transition from n = 3 to n = 2 in hydrogen. Targeting this exact wavelength disrupts the entity's optical cloak.",
        "storyProblem": "The entity emits a pulsing 656 nm red shroud. Identify the electron quantum transition that produces this photon to destabilize its optical field.",
        "howToTest": "Recall the Balmer series visible transitions: the red line is the smallest visible jump down to n = 2 (transition n = 3 ➔ n = 2).",
        "visualFormula": "Red Balmer Line (656 nm): Electron Transition n = 3 ➔ n = 2"
      },
      "1": {
        "goal": "Phase 2: Select which incident photon beam frees electrons when the photocathode threshold lies in the green band.",
        "science": "Photoelectric Frequency Cutoff: Photons with frequencies equal to or greater than the threshold (higher frequency, shorter wavelength: blue/violet/UV) eject electrons; lower frequencies (red) cannot.",
        "storyProblem": "The creature's electrostatic barrier has a threshold cutoff in the green spectrum. Select a beam with high enough frequency to strip its surface charge.",
        "howToTest": "Choose light with higher frequency and shorter wavelength than green (e.g. blue, violet, or UV).",
        "visualFormula": "Ejection Condition: Frequency ν ≥ ν_threshold (Shorter λ = Higher ν)"
      },
      "2": {
        "goal": "Phase 3: Enter the number of unpaired electrons in a neutral carbon atom in its ground state.",
        "science": "Hund's Rule Paramagnetism: Carbon (1s² 2s² 2p²) has two unpaired electrons in separate 2p orbitals ( [↑] [↑] [ ] ). Neutralizing these two unpaired spins collapses the magnetic field.",
        "storyProblem": "The entity projects a paramagnetic magnetic shield anchored by carbon atoms. Determine the number of unpaired electrons in ground-state carbon.",
        "howToTest": "Draw carbon's valence rack: 2s holds 2 paired electrons; 2p holds 2 unpaired electrons in separate boxes.",
        "visualFormula": "Carbon Configuration: 1s² 2s² 2p² ➔ 2 Unpaired Electrons in 2p"
      },
      "3": {
        "goal": "Phase 4: A photoelectron peak reveals ten protons binding the innermost electrons. Identify the anchor element.",
        "science": "Nuclear Charge and Identity: Ten protons in the nucleus uniquely identify Neon (Ne, atomic number 10). Targeting Neon core vibrations dissolves its central binding matrix.",
        "storyProblem": "A PES scan of the anomaly core reveals a binding peak corresponding to an element with 10 nuclear protons. Identify the anchor element.",
        "howToTest": "Match the proton count (Z = 10) to the periodic table: atomic number 10 is Neon.",
        "visualFormula": "Z = 10 Nuclear Protons ➔ Neon (Ne, Noble Gas)"
      },
      "4": {
        "goal": "Phase 5: Calculate the absorbance of a 0.010 mol/L solution with path length 1.0 cm and molar absorptivity 40 L/(mol cm).",
        "science": "Beer-Lambert Law Calculation: A = ε·b·c = (40 L/(mol·cm)) × (1.0 cm) × (0.010 mol/L) = 0.40. Tuning the neutralization laser to A = 0.40 disperses the entity.",
        "storyProblem": "Calculate the exact quenching laser absorbance for a 0.010 mol/L solution with 1.0 cm path and ε = 40 to complete the final neutralization pulse.",
        "howToTest": "Multiply ε by path length b and molarity c: A = 40 × 1.0 × 0.010 = 0.40.",
        "visualFormula": "Absorbance A = ε × b × c = 40 × 1.0 × 0.010 = 0.40"
      }
    }
  },
  "q1-joins": {
    "title": "What Holds",
    "concept": "Chemical Bonds (Ionic, Covalent & The Octet Rule)",
    "overview": "Atoms form chemical bonds to achieve stable full valence electron shells (the octet rule). When a metal transfers electrons to a nonmetal, opposite electrostatic charges form an IONIC bond. When two nonmetals share electron pairs, they form a COVALENT bond (single, double, or triple). Noble gases already have complete octets and remain unbonded.",
    "storyline": "On the high-gravity forge world of Ligar, structural hull plates and pneumatic seals are failing under extreme tectonic pressures. Gasket seals require flexible covalent molecules, while load-bearing pylons require rigid ionic matrices. By testing electron transfer and sharing, you will select the proper bonding class for each structural component.",
    "vocab": [
      {
        "word": "Chemical Bond",
        "meaning": "An electrostatic attraction holding atoms or ions together to achieve stable electron configurations."
      },
      {
        "word": "Ionic Bond",
        "meaning": "Electrostatic attraction between oppositely charged ions formed by electron transfer (metal + nonmetal)."
      },
      {
        "word": "Covalent Bond",
        "meaning": "Chemical bond formed when two nonmetal atoms share one or more pairs of valence electrons."
      },
      {
        "word": "Octet Rule",
        "meaning": "Principle that atoms tend to gain, lose, or share electrons until they have 8 valence electrons."
      },
      {
        "word": "Bond Multiplicity",
        "meaning": "Single bond (1 shared pair), double bond (2 shared pairs), or triple bond (3 shared pairs)."
      }
    ],
    "stages": {
      "0": {
        "goal": "File each of the three pairs by whether its two atoms hold together.",
        "science": "Chemical Bonding Principle: When atoms interact, they form a stable bond only if doing so lowers their potential energy by filling outer valence shells.",
        "storyProblem": "Test three metal and gas pairings in the forge press to determine which pairs form durable structural bonds and which separate.",
        "howToTest": "Clamp the atom pairs together in the press and observe if they remain bonded when clamps release.",
        "visualFormula": "Stable Bond (Lower Energy, Held Together) vs Non-Bonding (Separates)"
      },
      "1": {
        "goal": "Say why Pair B will not hold when the other two do.",
        "science": "Noble Gas Inertness: Atoms bond to achieve full valence shells (octet of 8). Atoms that already possess complete outer shells (noble gases) have no thermodynamic drive to bond.",
        "storyProblem": "Pair B releases immediately after pressing. Explain why its atoms refuse to form a chemical bond.",
        "howToTest": "Count valence electrons on each atom in Pair B: full outer shells mean zero bonding valence.",
        "visualFormula": "Full Valence Shell (Noble Gas Octet) = Chemically Inert (No Bond Formed)"
      },
      "2": {
        "goal": "Say how the two joins differ.",
        "science": "Ionic vs Covalent Mechanisms: Pair A transfers an electron (forming cation and anion held by electrostatic charge); Pair B shares a pair of electrons between both nuclei.",
        "storyProblem": "Analyze the microscopic electron behavior in the two successful welds to classify their bond mechanisms.",
        "howToTest": "Observe electron positions: check if electrons transferred completely (ionic) or are shared in between nuclei (covalent).",
        "visualFormula": "Ionic = Electron Transfer (Opposite Charges) · Covalent = Electron Sharing"
      },
      "3": {
        "goal": "File every pair by what happens to its electrons.",
        "science": "Metal-Nonmetal vs Nonmetal-Nonmetal: Metal + Nonmetal transfers electrons to form ionic bonds; Nonmetal + Nonmetal shares electrons to form covalent bonds.",
        "storyProblem": "Sort incoming raw material pairs into ionic weld or covalent weld bins based on their constituent elements.",
        "howToTest": "Check element categories on the catalogue: metal + nonmetal = ionic; nonmetal + nonmetal = covalent.",
        "visualFormula": "Metal + Nonmetal ➔ Ionic Bond · Nonmetal + Nonmetal ➔ Covalent Bond"
      },
      "4": {
        "goal": "Say how many CAT 17 atoms one CAT 12 atom needs in order to give away everything it has.",
        "science": "Ionic Charge Neutrality: Magnesium (CAT 12, Group 2) loses 2 electrons to form Mg²⁺. Chlorine (CAT 17, Group 17) accepts 1 electron (Cl⁻). Therefore, 1 Mg requires 2 Cl atoms: MgCl₂.",
        "storyProblem": "Calculate the stoichiometric atom ratio needed to synthesize neutral magnesium chloride de-icing salt.",
        "howToTest": "Balance valence charges: Mg gives up 2 electrons; each Cl accepts 1 electron. Ratio = 1 Mg : 2 Cl.",
        "visualFormula": "Mg²⁺ (+2) + 2 Cl⁻ (−1 each) ➔ MgCl₂ (Net Charge = 0)"
      },
      "5": {
        "goal": "File each of the three pairs by how many pairs of electrons it holds between its two atoms.",
        "science": "Bond Multiplicity: Single bond shares 1 electron pair (2 e⁻), double bond shares 2 pairs (4 e⁻), triple bond shares 3 pairs (6 e⁻). More shared pairs mean shorter, stronger bonds.",
        "storyProblem": "Classify nitrogen, oxygen, and fluorine molecular joins by their shared electron pair counts.",
        "howToTest": "Count the number of shared electron pairs between nuclei: 1 pair (single), 2 pairs (double), 3 pairs (triple).",
        "visualFormula": "Single (1 Pair = 2 e⁻) · Double (2 Pairs = 4 e⁻) · Triple (3 Pairs = 6 e⁻)"
      },
      "6": {
        "goal": "File every pair by what it will do, from the two atoms alone.",
        "science": "Predicting Bond Type from Periodic Table: Identify metals, nonmetals, and noble gases to predict bond outcomes without testing.",
        "storyProblem": "Predict the bonding behavior of four mystery alloy pairings strictly from their periodic positions.",
        "howToTest": "Look up positions: full octet = no bond; metal + nonmetal = ionic; two nonmetals = covalent.",
        "visualFormula": "Periodic Prediction: Noble Gas = None · Metal + Nonmetal = Ionic · Nonmetals = Covalent"
      },
      "7": {
        "goal": "Say how many CAT 01 atoms one CAT 06 atom can hold.",
        "science": "Valence Capacity in Covalent Compounds: Carbon (CAT 06) has 4 valence electrons and needs 4 more to complete its octet. Hydrogen (CAT 01) shares 1 electron, so Carbon bonds with exactly 4 Hydrogens: CH₄.",
        "storyProblem": "Determine the maximum hydrogen holding capacity of a single carbon atom to synthesize synthetic methane fuel.",
        "howToTest": "Calculate needed electrons for octet: Carbon needs 4 electrons, bonding with 4 individual hydrogen atoms.",
        "visualFormula": "Carbon (Needs 4 e⁻ for Octet) + 4 H (Share 1 e⁻ each) ➔ CH₄ (Methane)"
      }
    }
  },
  "q2-lattice": {
    "title": "Stone and Wire",
    "concept": "Solid Structures (Molecular, Ionic & Network Covalent)",
    "overview": "Solid materials fall into three distinct structural classes: Molecular solids (discrete molecules held by weak intermolecular forces; low melting, soft, non-conducting), Ionic crystal lattices (repeating 3D grid of alternating ions; high melting, hard, brittle, conduct electricity ONLY when molten/dissolved), and Network covalent solids (unbroken covalent web; ultra-high melting, extremely hard, non-conducting).",
    "storyline": "Ligar's subterranean magma foundry runs high-voltage arc furnaces at 900°C. Standard rubber liners melt immediately, and metal conduits short-circuit. We must evaluate solid materials across melting points, mechanical cleavage, and electrical conductivity to identify a refractory insulator liner.",
    "vocab": [
      {
        "word": "Ionic Lattice",
        "meaning": "A 3D repeating grid of alternating positive and negative ions held by Coulombic attractions."
      },
      {
        "word": "Molecular Solid",
        "meaning": "A solid composed of discrete covalent molecules held together by weak intermolecular attractions."
      },
      {
        "word": "Network Covalent",
        "meaning": "A giant macromolecular structure where every atom is covalently bonded throughout the entire crystal."
      },
      {
        "word": "Electrical Conductivity",
        "meaning": "Requires mobile charged particles (free electrons or mobile dissolved/molten ions)."
      },
      {
        "word": "Lattice Cleavage",
        "meaning": "Clean fracturing of ionic crystals along planes when sheared like-charges repel."
      }
    ],
    "stages": {
      "0": {
        "goal": "Pick the block that is held together hardest.",
        "science": "Melting Point as a Measure of Bond Strength: Melting point directly reflects the energy required to overcome cohesive forces. High melting points (1710°C) indicate strong continuous bonding.",
        "storyProblem": "Three candidate foundry blocks melt at 115°C, 801°C, and 1710°C. Identify which block possesses the strongest cohesive bonding.",
        "howToTest": "Measure melting temperatures on the heat stage: the highest melting temperature indicates the strongest internal bonding.",
        "visualFormula": "Melting Point: Molecular (115°C) < Ionic Lattice (801°C) < Network Covalent (1710°C)"
      },
      "1": {
        "goal": "Say why Block A comes apart along one flat face and Block B does not.",
        "science": "Ionic Cleavage Planes: In an ionic crystal, shear forces shift adjacent ion layers by one position. Like charges (+/+ and −/−) align, creating violent electrostatic repulsion that cleaves the crystal cleanly.",
        "storyProblem": "A hammer blow fractures Block A along an atomically smooth plane, while Block B deforms. Explain why the crystal cleaved.",
        "howToTest": "Observe the crystal lattice under shear stress: shifting ion layers align identical charges, causing rapid cleavage splitting.",
        "visualFormula": "Shear Force ➔ (+ aligns with + / − aligns with −) ➔ Repulsion ➔ Clean Cleavage Fracture"
      },
      "2": {
        "goal": "Say what a current needs in order to pass through a block.",
        "science": "Conditions for Electrical Conduction: Conduction requires mobile charged particles. Solid ionic lattices pin ions in place (insulator); melting liberates ions to move freely and conduct current.",
        "storyProblem": "Test solid vs molten electrical conductivity in salt crucibles to determine why solid salt does not conduct.",
        "howToTest": "Apply voltage to solid salt (no current) and molten salt (lamp lights up as molten ions travel freely).",
        "visualFormula": "Solid Lattice: Pinned Ions (No Conduction) · Molten: Mobile Ions (Conducts Current!)"
      },
      "3": {
        "goal": "Say what actually gives way when Block A comes apart.",
        "science": "Intermolecular Forces in Molecular Solids: Melting a molecular solid overcomes only weak intermolecular forces between molecules; the strong covalent bonds inside each molecule remain completely intact.",
        "storyProblem": "A molecular wax block melts at only 115°C. Determine whether covalent bonds or intermolecular forces broke.",
        "howToTest": "Inspect molecules before and after melting: individual covalent molecules remain intact while intermolecular spacing widens.",
        "visualFormula": "Melting Molecular Solid: Breaks WEAK Intermolecular Forces (Covalent Bonds Remain Intact)"
      },
      "4": {
        "goal": "Say what is different about the way Block A is built.",
        "science": "Continuous Network Covalent Bonding: In quartz or diamond, every single atom is bonded directly to neighbors in a continuous 3D web. Melting requires breaking covalent bonds directly.",
        "storyProblem": "Explain why the silica crucible withstands 1710°C heat without melting or conducting electricity.",
        "howToTest": "Examine structural scan: observe that the entire block is one continuous covalent macromolecule with no separate molecules.",
        "visualFormula": "Network Covalent: Giant 3D Matrix of Covalent Bonds (Extreme Melting Point > 1700°C)"
      },
      "5": {
        "goal": "Pick the block you could lift a single whole molecule out of.",
        "science": "Discrete Molecules vs Continuous Lattices: Only molecular solids consist of isolated discrete molecules. Ionic and network solids repeat indefinitely in all directions.",
        "storyProblem": "Select which material contains individual chemical molecules that could be isolated in a gas chamber.",
        "howToTest": "Check bonding geometry: look for distinct separate molecular clusters versus continuous repeating lattices.",
        "visualFormula": "Molecular Solid = Individual Molecules · Ionic/Network = Continuous Repeating Lattice"
      },
      "6": {
        "goal": "File each of the three sealed blocks by how it is built.",
        "science": "Diagnostic Classification of Solids: Low melting = Molecular; High melting + conducts when molten = Ionic; Ultra-high melting + non-conductive = Network Covalent.",
        "storyProblem": "Identify three mystery material containers for furnace construction using their test properties.",
        "howToTest": "Synthesize the three diagnostic tests: melting point, cleavage behavior, and molten conductivity.",
        "visualFormula": "Molecular (Melts Low) · Ionic Lattice (Cleaves, Conducts Molten) · Network Covalent (Refractory)"
      },
      "7": {
        "goal": "The yard needs a liner for a vessel that runs at 900 degrees and must never pass a current. Pick the block that will do it.",
        "science": "Refractory Electrical Insulator: The network covalent solid survives above 900°C without melting and contains no mobile ions or electrons, making it the ideal high-temp electrical insulator.",
        "storyProblem": "Select the correct foundry liner material that survives 900°C furnace heat without conducting electric arcs.",
        "howToTest": "Eliminate molecular (melts low) and ionic (melts/conducts at 801°C). Select network covalent solid.",
        "visualFormula": "Foundry Liner: Network Covalent Solid (Melts > 1700°C, Zero Molten Conductivity)"
      }
    }
  },
  "q3-distance": {
    "title": "Bond Energy",
    "concept": "Bond Length, Bond Energy & Potential Energy Curves",
    "overview": "As two atoms approach, attractive and repulsive forces reach a balance at a potential energy minimum. The internuclear distance at this minimum is the BOND LENGTH, and the depth of the well is the BOND ENERGY (energy required to break the bond). Higher bond order (single < double < triple) pulls atoms closer (shorter bond) and deepens the energy well (stronger bond). In ionic crystals, lattice energy scales with ion charges (q₁·q₂) and inversely with ionic radius.",
    "storyline": "Excavation drills on Ligar rapidly shatter when cutting through diamond-veined bedrock. To synthesize hyper-hard drill bits, the forge masters must maximize covalent bond energy and minimize bond length, while formulating refractory crystal binders with peak lattice energy.",
    "vocab": [
      {
        "word": "Potential Energy Curve",
        "meaning": "Graph of system energy versus internuclear distance between two interacting atoms."
      },
      {
        "word": "Bond Length",
        "meaning": "The equilibrium distance between nuclei at minimum potential energy."
      },
      {
        "word": "Bond Energy",
        "meaning": "The energy required to break one mole of chemical bonds into neutral separated atoms."
      },
      {
        "word": "Bond Order",
        "meaning": "The number of shared electron pairs; higher bond order produces shorter, stronger bonds."
      },
      {
        "word": "Lattice Energy",
        "meaning": "Energy released when gaseous ions form an ionic solid: Lattice Energy ∝ (q₁ × q₂) / r."
      }
    ],
    "stages": {
      "0": {
        "goal": "Find the separation at which the two atoms hold the least energy.",
        "science": "Equilibrium Bond Length: Two approaching atoms attract until electron-nucleus attraction balances nuclear-nuclear repulsion at the bottom of the potential energy well.",
        "storyProblem": "Calibrate the molecular tractor beam to position two hydrogen atoms at their minimum potential energy separation.",
        "howToTest": "Move the distance slider across the potential energy curve to locate the bottom of the energy valley.",
        "visualFormula": "Bond Length = Internuclear Distance at Minimum Potential Energy Well"
      },
      "1": {
        "goal": "Give the energy it takes to pull this pair completely apart.",
        "science": "Bond Energy as Well Depth: The bond dissociation energy equals the depth of the potential energy well measured from zero (separated atoms) to the minimum.",
        "storyProblem": "Measure the energy barrier needed to dissociate the diatomic bond during plasma cutting.",
        "howToTest": "Read the vertical distance from the energy baseline (0 kJ/mol) down to the bottom of the curve.",
        "visualFormula": "Bond Energy (D) = 0 − E_minimum = Depth of Potential Well"
      },
      "2": {
        "goal": "Say what happens to the energy when the atoms are pushed closer than the lowest point.",
        "science": "Nuclear-Nuclear Repulsion: Forcing nuclei closer than equilibrium bond length causes positive nuclei to violently repel, sending potential energy climbing sharply.",
        "storyProblem": "Explain what happens when high compressive shockwaves squeeze atoms closer than their natural bond length.",
        "howToTest": "Slide distance left past the minimum: observe the steep exponential climb in repulsive potential energy.",
        "visualFormula": "Distance < Bond Length ➔ Nuclear Repulsion Dominates (Energy Climbs Sharply)"
      },
      "3": {
        "goal": "Say why the chlorine pair bottoms out further out than the hydrogen pair.",
        "science": "Atomic Size and Bond Length: Chlorine atoms have 3 electron shells compared to Hydrogen's 1 shell. Larger electron clouds prevent nuclei from getting as close, increasing bond length.",
        "storyProblem": "Explain why a Cl–Cl bond is significantly longer than an H–H bond in drill bit coatings.",
        "howToTest": "Compare atomic radii: larger atoms have larger core shells that keep nuclei further apart.",
        "visualFormula": "Larger Atomic Radius (More Shells) ➔ Greater Internuclear Distance ➔ Longer Bond Length"
      },
      "4": {
        "goal": "Put the three carbon–carbon bonds in order, longest first.",
        "science": "Bond Order vs Bond Length: Single bonds (order 1) are longest, double bonds (order 2) are intermediate, and triple bonds (order 3) are shortest: C–C > C=C > C≡C.",
        "storyProblem": "Order single, double, and triple carbon-carbon linkages from longest to shortest to design synthetic polymers.",
        "howToTest": "Compare bond orders: more shared electron pairs pull the nuclei tighter together.",
        "visualFormula": "Bond Length: C–C (Single, Longest) > C=C (Double) > C≡C (Triple, Shortest)"
      },
      "5": {
        "goal": "Say how bond length goes with bond energy across those three bonds.",
        "science": "Inverse Relationship of Length and Energy: Shorter bonds with higher bond order have significantly higher bond energies: triple bonds are shortest and strongest.",
        "storyProblem": "Determine the trade-off between bond length and bond strength when selecting reinforcing fibers.",
        "howToTest": "Compare bond lengths to well depths: shorter bonds consistently have deeper energy wells.",
        "visualFormula": "General Rule: Shorter Bond Length ➔ Higher Bond Energy (Shorter = Stronger)"
      },
      "6": {
        "goal": "Put the three salts in order of how strongly their ions are held, strongest first.",
        "science": "Lattice Energy Determinants: Lattice energy increases with higher ion charges and smaller ionic radii: Lattice Energy ∝ (q₁·q₂) / (r₁ + r₂).",
        "storyProblem": "Rank three ionic flux salts by lattice binding energy to formulate heat-resistant crucible slag.",
        "howToTest": "Examine ion charges and sizes: higher charges (+2/−2 > +1/−1) and smaller ions produce strongest lattices.",
        "visualFormula": "Lattice Energy ∝ (q₁ × q₂) / (r⁺ + r⁻) (Higher Charges & Smaller Radii = Stronger Lattice)"
      },
      "7": {
        "goal": "Say which of the two salts melts at the higher temperature.",
        "science": "Ionic Size and Melting Point: Fluoride (F⁻) is smaller than Chloride (Cl⁻). Therefore, NaF has a smaller internuclear distance, higher lattice energy, and higher melting point than NaCl.",
        "storyProblem": "Select whether NaF or NaCl flux will survive higher temperature refining without melting.",
        "howToTest": "Compare anion radii: smaller F⁻ allows closer approach to Na⁺, increasing lattice attraction and melting point.",
        "visualFormula": "Smaller Ion (F⁻ < Cl⁻) ➔ Stronger Lattice Energy ➔ Higher Melting Point (NaF > NaCl)"
      }
    }
  },
  "q4-dots": {
    "title": "Lewis Structures",
    "concept": "Lewis Structures & Octet Rules (Lone Pairs, Polyatomics & Exceptions)",
    "overview": "Lewis dot structures map all valence electrons in a molecule into shared covalent bonds (lines) or nonbonding lone pairs (dots). Most nonmetals bond to achieve an octet of 8 valence electrons (2 for hydrogen). When single bonds leave atoms short of an octet, multiple bonds (double/triple) form. Polyatomic ions add electrons for negative charge or subtract for positive charge. Exceptions include incomplete octets (BF₃), odd-electron radicals (NO), and expanded octets (SF₆) on Period 3+ central atoms.",
    "storyline": "Borehole gas vents on Ligar release pressurized toxic gas mixtures into the research tunnels. Habitat catalytic scrubbers must recognize incoming molecular species—from odd-electron nitrogen oxide radicals to expanded-octet sulfur fluorides. By constructing complete Lewis diagrams, you will ensure scrubber filters target the correct chemical bonds.",
    "vocab": [
      {
        "word": "Lewis Structure",
        "meaning": "2D diagram showing how valence electrons are distributed as bonding pairs and lone pairs."
      },
      {
        "word": "Lone Pair",
        "meaning": "A pair of valence electrons localized on one atom that is not involved in bonding."
      },
      {
        "word": "Central Atom",
        "meaning": "The least electronegative atom (excluding H) that bonds to surrounding terminal atoms."
      },
      {
        "word": "Polyatomic Ion",
        "meaning": "A covalently bonded group of atoms that carries an overall net positive or negative charge."
      },
      {
        "word": "Expanded Octet",
        "meaning": "Period 3 or heavier central atoms using d-orbitals to hold 10 or 12 valence electrons."
      }
    ],
    "stages": {
      "0": {
        "goal": "Place all of water's electrons so that every lamp is lit.",
        "science": "Water Lewis Structure: Oxygen brings 6 valence electrons and each Hydrogen brings 1 (total 8 e⁻). Forming two O–H single bonds (4 e⁻) leaves two nonbonding lone pairs (4 e⁻) on oxygen, completing its octet.",
        "storyProblem": "Reconstruct water's valence electron map in the scrubber synthesizer to confirm all 8 valence electrons are accounted for.",
        "howToTest": "Place single bonds between O and each H, then assign remaining electrons as two lone pairs on oxygen until lamps light up.",
        "visualFormula": "H₂O: 2 Single Bonds (4 e⁻) + 2 Lone Pairs on O (4 e⁻) = 8 Total Valence Electrons"
      },
      "1": {
        "goal": "File each molecule by how many lone pairs sit on its heaviest atom.",
        "science": "Nonbonding Lone Pair Counting: Carbon in CH₄ uses all 4 valence electrons in bonds (0 lone pairs); Nitrogen in NH₃ forms 3 bonds (1 lone pair); Oxygen in H₂O forms 2 bonds (2 lone pairs); Fluorine in HF forms 1 bond (3 lone pairs).",
        "storyProblem": "Categorize four exhaust gases by the number of unshared lone pairs on their central atoms to predict catalytic reactivity.",
        "howToTest": "Calculate remaining valence electrons on the central atom after subtracting bonding electrons.",
        "visualFormula": "Lone Pairs: CH₄ (0 pairs) · NH₃ (1 pair) · H₂O (2 pairs) · HF (3 pairs on F)"
      },
      "2": {
        "goal": "Place all of carbon dioxide's electrons so that every lamp is lit.",
        "science": "Multiple Bonds for Octet Completion: Total valence = 4 (C) + 2×6 (O) = 16 e⁻. Single bonds leave Carbon with only 4 electrons; forming two C=O double bonds gives Carbon and both Oxygens full octets (O=C=O).",
        "storyProblem": "Calibrate the greenhouse CO₂ intake filter by assembling carbon dioxide's dual double-bond structure.",
        "howToTest": "Share a second pair of electrons with each oxygen atom, then place two lone pairs on each oxygen.",
        "visualFormula": "CO₂ (16 e⁻): ::O = C = O:: (Two Double Bonds + 4 Lone Pairs Total)"
      },
      "3": {
        "goal": "Say which atom sits in the middle of HOF.",
        "science": "Central Atom Selection: The central atom is the one that can form multiple bonds. Hydrogen can only form 1 bond, and Fluorine can only form 1 bond. Oxygen forms 2 bonds and must sit in the center (H–O–F).",
        "storyProblem": "Determine the structural skeleton of hypofluorous acid (HOF) to prevent piping corrosive gas in the wrong order.",
        "howToTest": "Evaluate bonding capacities: H and F are strictly terminal atoms; Oxygen must bridge them in the center.",
        "visualFormula": "Skeleton: H – O – F (Oxygen is Central; H and F Cannot Bridge)"
      },
      "4": {
        "goal": "Draw the NH₄ ion so that every lamp is lit.",
        "science": "Polyatomic Cation Electron Count: Nitrogen brings 5, four Hydrogens bring 4 (total 9 e⁻). The +1 charge removes 1 electron, leaving exactly 8 valence electrons: four N–H single bonds.",
        "storyProblem": "Synthesize ammonium fertilizer ions (NH₄⁺) by adjusting total electron count for its positive charge.",
        "howToTest": "Subtract 1 electron for the +1 charge (5 + 4 − 1 = 8 e⁻), then place four single bonds around Nitrogen.",
        "visualFormula": "NH₄⁺ Total e⁻ = 5 (N) + 4 (H) − 1 (Charge) = 8 e⁻ (4 Single Bonds, 0 Lone Pairs)"
      },
      "5": {
        "goal": "Say why the lamp on boron stays amber in BF₃.",
        "science": "Incomplete Octet Exception: Boron brings 3 valence electrons and forms three B–F single bonds (total 6 e⁻). Fluorine is too electronegative to form a double bond, leaving Boron stable with an incomplete octet (sextet).",
        "storyProblem": "The diagnostic monitor warns that BF₃ has only 6 electrons around Boron. Determine why this incomplete octet is physically stable.",
        "howToTest": "Count electrons on Boron: 3 single bonds = 6 electrons. Fluorine will not share a lone pair to make a double bond.",
        "visualFormula": "BF₃: Boron Has 6 Valence Electrons (Stable Incomplete Octet Exception)"
      },
      "6": {
        "goal": "Use up every electron in the tray for NO.",
        "science": "Odd-Electron Free Radicals: Nitrogen (5) + Oxygen (6) = 11 valence electrons. An odd count makes an exact octet on both atoms impossible; one electron must remain unpaired, creating a highly reactive free radical.",
        "storyProblem": "A sensor detects nitrogen monoxide (NO) emissions. Explain why one electron indicator remains unpaired.",
        "howToTest": "Sum valence electrons: 5 + 6 = 11 electrons. Place 10 into pairs, leaving 1 single unpaired electron.",
        "visualFormula": "Odd Electron Total (11 e⁻) ➔ Unpaired Electron (Free Radical •N=O)"
      },
      "7": {
        "goal": "Use up every electron in the tray for SF₆.",
        "science": "Expanded Octet Exception: Sulfur is in Period 3 and has accessible d-orbitals. It accommodates 12 valence electrons across six S–F single bonds in an expanded octet.",
        "storyProblem": "Configure the ultra-stable insulator gas sulfur hexafluoride (SF₆) using its 48 valence electrons.",
        "howToTest": "Form six single bonds from Sulfur to the six Fluorine atoms (12 e⁻ on S), then surround each F with 3 lone pairs.",
        "visualFormula": "SF₆: Sulfur Holds 12 Electrons (Period 3 Expanded Octet with 6 S–F Bonds)"
      }
    }
  },
  "q5-resonance": {
    "title": "Charge and Resonance",
    "concept": "Formal Charge & Resonance Hybrids",
    "overview": "When multiple valid Lewis structures can be drawn for a molecule, the true structure is a quantum RESONANCE HYBRID with delocalized electrons spread across several bonds. Resonance produces fractional bond orders and equal bond lengths. Formal Charge evaluates relative stability: FC = Valence e⁻ − Nonbonding e⁻ − ½(Bonding e⁻). The most stable resonance contributor minimizes formal charges and places negative charges on the most electronegative atoms.",
    "storyline": "Ligar's smelter flux uses nitrate (NO₃⁻) and carbonate (CO₃²⁻) salts to bind heavy metal slag. Slag binding depends on which oxygen atoms carry negative charge and whether bonds are single or double. By evaluating formal charges and resonance hybrids, you will predict which oxyanions form the strongest binding complexes.",
    "vocab": [
      {
        "word": "Formal Charge",
        "meaning": "Apparent atomic charge: FC = Valence e⁻ − Lone Pair e⁻ − (Bonding e⁻ / 2)."
      },
      {
        "word": "Resonance Structures",
        "meaning": "Two or more valid Lewis formulas for the same molecule differing only in electron positions."
      },
      {
        "word": "Resonance Hybrid",
        "meaning": "The actual molecular structure, which is a weighted average of all resonance contributors."
      },
      {
        "word": "Delocalized Electrons",
        "meaning": "Pi electrons shared across three or more atoms rather than confined to a single bond."
      },
      {
        "word": "Fractional Bond Order",
        "meaning": "Average bond strength (e.g. 4 shared pairs across 3 bonds = 1.33 bond order)."
      }
    ],
    "stages": {
      "0": {
        "goal": "Find the atom in this drawing that owns one electron too few.",
        "science": "Formal Charge Calculation: FC = Valence − Lone Pair e⁻ − (Bonds). In carbon monoxide with a triple bond (:C≡O:), Carbon owns 2 lone + 3 bond = 5 (FC = 4 − 5 = −1); Oxygen owns 2 lone + 3 bond = 5 (FC = 6 − 5 = +1).",
        "storyProblem": "A carbon monoxide test drawing shows charge imbalance. Calculate formal charges to locate which atom carries the +1 charge.",
        "howToTest": "Count electrons owned by each atom: Oxygen brings 6 and owns 5, giving it a +1 formal charge.",
        "visualFormula": "Formal Charge: FC = Valence − Lone e⁻ − (Bonds) ➔ Oxygen: 6 − 2 − 3 = +1"
      },
      "1": {
        "goal": "Pick the better drawing of carbon dioxide.",
        "science": "Minimizing Formal Charges: The symmetric structure O=C=O gives every atom a formal charge of 0. An asymmetric structure (:O≡C–O:::) has FC of +1, 0, and −1, which is less stable.",
        "storyProblem": "Select the dominant resonance structure of CO₂ to calibrate the infrared greenhouse monitor.",
        "howToTest": "Calculate formal charges for both drawings: choose the symmetric structure where all formal charges are zero.",
        "visualFormula": "Best Structure: Formal Charges Closest to Zero (O=C=O has FC = 0 on all atoms)"
      },
      "2": {
        "goal": "Pick the better drawing of the SCN⁻ ion.",
        "science": "Electronegative Charge Placement: When choosing between structures with equal formal charge magnitudes, the more stable structure places the negative charge on the more electronegative atom (N > S).",
        "storyProblem": "Evaluate two resonance contributors for the thiocyanate ligand (SCN⁻) to predict where metals coordinate.",
        "howToTest": "Compare electronegativities: Nitrogen (3.0) is more electronegative than Sulfur (2.5), so Nitrogen should carry the −1 formal charge.",
        "visualFormula": "Negative Formal Charge Belongs on More Electronegative Atom: [S=C=N]⁻ with N (−1)"
      },
      "3": {
        "goal": "Say how the two bonds in ozone compare in length.",
        "science": "Resonance Hybrid Equivalence: Ozone (O₃) has two resonance structures: O=O–O and O–O=O. Experimental measurements show both bonds are identical in length (intermediate between single and double).",
        "storyProblem": "Explain why both oxygen-oxygen bonds in atmospheric ozone measure exactly the same length in the spectroscope.",
        "howToTest": "Measure both O–O bond lengths: observe that resonance blends them into two identical 1.5-order bonds.",
        "visualFormula": "Resonance Hybrid: Both Bonds are Identical in Length (Bond Order = 1.5)"
      },
      "4": {
        "goal": "File every arrangement of nitrate's double bond.",
        "science": "Equivalent Resonance Forms: Nitrate (NO₃⁻) has three equivalent resonance structures, each with the N=O double bond drawn to a different oxygen atom.",
        "storyProblem": "Generate all three valid resonance contributors for the nitrate fertilizer ion to map its electron delocalization.",
        "howToTest": "Draw the double bond to top oxygen, bottom-left oxygen, and bottom-right oxygen.",
        "visualFormula": "Nitrate (NO₃⁻): 3 Equivalent Resonance Structures (Double Bond Rotates Through 3 Positions)"
      },
      "5": {
        "goal": "Give the bond order of each bond in nitrate.",
        "science": "Fractional Bond Order Calculation: Nitrate shares 4 bonding pairs (1 double + 2 single) across 3 bond locations: Bond Order = 4 / 3 = 1.33 (one and one-third).",
        "storyProblem": "Calculate the effective bond order of N–O bonds in nitrate to determine their resistance to thermal decomposition.",
        "howToTest": "Divide total shared electron pairs (4) by the number of bond positions (3): 4 / 3 = 1.33.",
        "visualFormula": "Bond Order = Total Shared Pairs / Bond Locations = 4 / 3 = 1.33"
      },
      "6": {
        "goal": "Say which of carbonate's drawings counts most.",
        "science": "Equal Contribution of Delocalized Pi Electrons: Carbonate (CO₃²⁻) has three identical resonance drawings. Because all three have identical formal charges, they contribute equally to the delocalized pi cloud.",
        "storyProblem": "Determine which oxygen atom in limestone carbonate (CO₃²⁻) carries the negative charge when binding calcium.",
        "howToTest": "Compare formal charges across all three drawings: identical stability means all three contribute equally, spreading the −2 charge over all three oxygens (−⅔ each).",
        "visualFormula": "Three Equivalent Drawings = Equal Contribution (Charge Delocalized as −⅔ per Oxygen)"
      },
      "7": {
        "goal": "Say why water has no resonance.",
        "science": "Conditions for Resonance: Resonance requires delocalizable pi electrons (multiple bonds) or conjugated lone pairs. Water has only localized single sigma bonds and cannot shift electrons without breaking bonds.",
        "storyProblem": "A student asks if water has resonance structures. Explain why resonance is absent in H₂O.",
        "howToTest": "Inspect water's bonds: all bonds are localized single bonds. No multiple bonds exist to shift without breaking the molecule.",
        "visualFormula": "Water: Only Localized Single Bonds (No Pi Bonds to Delocalize ➔ No Resonance)"
      }
    }
  },
  "q6-shape": {
    "title": "Molecular Shape",
    "concept": "VSEPR Theory & Molecular Geometry",
    "overview": "Valence Shell Electron Pair Repulsion (VSEPR) theory determines molecular 3D shapes: electron domains (bonding pairs and lone pairs) repel each other and adopt geometry maximizing separation. Domain counts dictate electron geometry: 2 = Linear (180°), 3 = Trigonal Planar (120°), 4 = Tetrahedral (109.5°), 5 = Trigonal Bipyramidal (90°/120°), 6 = Octahedral (90°). Nonbonding lone pairs occupy more space and repel harder than bonding pairs, compressing bond angles.",
    "storyline": "Ligar's automated molecular forge synthesizes chelation cages to extract dissolved metals from volcanic springs. The cage receptor teeth must match the exact 3D bond angles of target molecules. Predict molecular geometries and lone pair compressions to calibrate the assembler's micro-clamps.",
    "vocab": [
      {
        "word": "VSEPR Theory",
        "meaning": "Electron domains repel each other, dictating molecular 3D geometry."
      },
      {
        "word": "Electron Domain",
        "meaning": "Any bond (single, double, or triple counts as 1 domain) or nonbonding lone pair on the central atom."
      },
      {
        "word": "Electron Geometry",
        "meaning": "Spatial arrangement of all electron domains (e.g. tetrahedral for 4 domains)."
      },
      {
        "word": "Molecular Geometry",
        "meaning": "Spatial arrangement of the bonded atoms only (e.g. bent for H₂O, trigonal pyramidal for NH₃)."
      },
      {
        "word": "Lone Pair Repulsion",
        "meaning": "Unshared pairs exert greater repulsive force, reducing adjacent bond angles below ideal values."
      }
    ],
    "stages": {
      "0": {
        "goal": "Say the angle between two arms on the hub.",
        "science": "Linear Geometry (2 Domains): Two electron domains repel each other to opposite sides of the central atom, forming a 180° linear bond angle (e.g. BeCl₂, CO₂).",
        "storyProblem": "Align the robotic gripper arms for a 2-domain central atom to maximize geometric separation.",
        "howToTest": "Measure the angle between the two arms: two domains settle directly opposite at 180°.",
        "visualFormula": "2 Electron Domains ➔ Linear Electron Geometry ➔ 180° Bond Angle"
      },
      "1": {
        "goal": "Say the angle between any two arms when the hub holds four.",
        "science": "Tetrahedral Geometry (4 Domains): Four electron domains spread into 3D space toward the vertices of a tetrahedron, producing ideal bond angles of 109.5° (e.g. CH₄).",
        "storyProblem": "Configure the 4-arm assembly cradle for synthetic methane (CH₄) to match its tetrahedral geometry.",
        "howToTest": "Measure angles between any two arms in 3D: four domains settle at exactly 109.5°.",
        "visualFormula": "4 Electron Domains ➔ Tetrahedral Geometry ➔ 109.5° Bond Angle"
      },
      "2": {
        "goal": "Say how the atoms of NH₃ are arranged.",
        "science": "Trigonal Pyramidal Molecular Geometry: Ammonia has 4 electron domains (3 single bonds + 1 lone pair). Its electron geometry is tetrahedral, but the 3 bonded atoms form a trigonal pyramid.",
        "storyProblem": "Model ammonia (NH₃) in the fertilizer synthesizer: differentiate between its electron geometry and molecular shape.",
        "howToTest": "Observe the 3 hydrogen atoms and the top lone pair: the atoms form a 3-legged pyramid (trigonal pyramidal).",
        "visualFormula": "NH₃ (3 Bonds + 1 Lone Pair) ➔ Electron: Tetrahedral · Molecular: Trigonal Pyramidal"
      },
      "3": {
        "goal": "Say the angle between the two hydrogen atoms of water.",
        "science": "Lone Pair Angle Compression in Bent Geometry: Water has 4 domains (2 bonds + 2 lone pairs). Two bulky lone pairs squeeze the bonding pairs, compressing the H–O–H angle from 109.5° down to 104.5°.",
        "storyProblem": "Calibrate water's bond angle in the ice crystallization engine to account for lone pair repulsion.",
        "howToTest": "Measure the H–O–H angle: observe that two lone pairs compress the angle down to 104.5°.",
        "visualFormula": "H₂O (2 Bonds + 2 Lone Pairs) ➔ Bent Geometry ➔ 104.5° Angle (Compressed from 109.5°)"
      },
      "4": {
        "goal": "Say how many domains the carbon in CO₂ has.",
        "science": "Multiple Bonds Count as One Domain: A double or triple bond contains multiple shared electron pairs, but all occupy the same spatial region and act as a single electron domain. CO₂ has 2 domains (linear, 180°).",
        "storyProblem": "Determine the effective domain count for Carbon in CO₂ to program the molecular modeling simulator.",
        "howToTest": "Count regions of electron density around Carbon: two double bonds = 2 electron domains.",
        "visualFormula": "Carbon Dioxide (O=C=O): 2 Double Bonds = 2 Electron Domains ➔ Linear (180°)"
      },
      "5": {
        "goal": "Say where the lone pair settles on the SF₄ hub.",
        "science": "Trigonal Bipyramidal Lone Pair Placement: Five domains form a trigonal bipyramid (3 equatorial positions at 120°, 2 axial positions at 90°). Lone pairs always occupy equatorial positions to minimize 90° repulsions, creating a seesaw molecular shape.",
        "storyProblem": "Position the lone pair on sulfur tetrafluoride (SF₄) to minimize repulsive strain.",
        "howToTest": "Place lone pair in equatorial vs axial site: equatorial placement provides 120° clearance, forming a seesaw shape.",
        "visualFormula": "SF₄ (4 Bonds + 1 Lone Pair) ➔ Lone Pair in Equatorial Site ➔ Seesaw Molecular Geometry"
      },
      "6": {
        "goal": "Say where the two lone pairs settle on the XeF₄ hub.",
        "science": "Octahedral Domain Geometry (Square Planar): Six domains form an octahedron. Two lone pairs minimize repulsion by sitting directly opposite each other (axial positions, 180° apart), leaving the four fluorines in a flat square planar arrangement (90°).",
        "storyProblem": "Assemble xenon tetrafluoride (XeF₄) in the high-density refrigerant cooler.",
        "howToTest": "Place two lone pairs 180° opposite on the octahedron: the four bonded atoms form a flat square planar shape.",
        "visualFormula": "XeF₄ (4 Bonds + 2 Lone Pairs) ➔ Lone Pairs Opposite (180°) ➔ Square Planar Geometry"
      },
      "7": {
        "goal": "Name the shape the atoms make in each molecule.",
        "science": "Distinguishing Electron vs Molecular Geometry: Electron geometry includes all domains; molecular geometry describes only nuclear positions. For example, XeF₂ has 5 domains (trigonal bipyramidal electron geometry) with 3 equatorial lone pairs, yielding a linear molecular shape.",
        "storyProblem": "Classify five complex unknown industrial compounds by their final molecular geometry names.",
        "howToTest": "Count bonding pairs and lone pairs: deduce electron geometry, then name the shape outlined strictly by the atoms.",
        "visualFormula": "Geometry Rule: Electron Geometry = All Domains · Molecular Geometry = Atom Positions Only"
      }
    }
  },
  "q7-polarity": {
    "title": "Polarity",
    "concept": "Bond Dipoles & Molecular Polarity (3D Vector Dipoles)",
    "overview": "When two atoms with different electronegativities share electrons, unequal pull creates a POLAR COVALENT BOND with partial charges (δ+ and δ−). Molecular polarity depends on both bond polarity and 3D molecular symmetry. In highly symmetric shapes (linear CO₂, tetrahedral CCl₄, trigonal planar BF₃), opposing dipole vectors cancel completely to zero (nonpolar). In asymmetric shapes with lone pairs or different atoms (bent H₂O, pyramidal NH₃, CHCl₃), dipole vectors sum to a net molecular dipole moment that rotates in an electric field.",
    "storyline": "Ligar's automated fluid distribution conduits must separate nonpolar hydrocarbon lubricants from polar aqueous cooling solutions. Routing polar water into high-voltage capacitor lines causes explosive short circuits, while nonpolar oils fail to cool heat exchangers. By evaluating 3D bond dipole cancellation, you will safely route all plant fluids.",
    "vocab": [
      {
        "word": "Electronegativity Difference",
        "meaning": "ΔEN: Nonpolar (<0.4), Polar Covalent (0.4–1.7), Ionic (>1.7)."
      },
      {
        "word": "Bond Dipole",
        "meaning": "Separation of partial charges (δ+ and δ−) across a bond, represented as a vector pointing toward more electronegative atom."
      },
      {
        "word": "Molecular Dipole Moment",
        "meaning": "Vector sum of all individual bond dipoles in 3D space (μ > 0 = polar)."
      },
      {
        "word": "Dipole Cancellation",
        "meaning": "High geometric symmetry causes equal opposing bond dipoles to cancel to zero net dipole."
      },
      {
        "word": "Capacitor Deflection",
        "meaning": "Polar molecules orient their partial charges between charged electrical plates, causing a fluid stream to bend."
      }
    ],
    "stages": {
      "0": {
        "goal": "Say which end of the H–Cl bond is more negative.",
        "science": "Electronegativity and Bond Dipoles: Chlorine (EN = 3.0) pulls shared electrons much harder than Hydrogen (EN = 2.1). The electron cloud shifts toward chlorine, giving it a partial negative charge (δ−) and hydrogen a partial positive charge (δ+).",
        "storyProblem": "Determine the charge orientation across an HCl cleaning vapor molecule to set electrostatic precipitator polarity.",
        "howToTest": "Compare electronegativities: Chlorine is more electronegative, carrying the negative end (δ−) of the bond dipole.",
        "visualFormula": "H (δ+, EN 2.1) ➔—+—➔ Cl (δ−, EN 3.0) : Polar Covalent Bond"
      },
      "1": {
        "goal": "File each bond by how unevenly its atoms share the pair.",
        "science": "Bond Polarity Classification: Equal sharing (ΔEN < 0.4) = Nonpolar covalent; Unequal sharing (0.4 ≤ ΔEN ≤ 1.7) = Polar covalent; Complete transfer (ΔEN > 1.7) = Ionic.",
        "storyProblem": "Classify chemical bonds in four incoming fluid samples into nonpolar, polar, and ionic categories.",
        "howToTest": "Calculate electronegativity difference (ΔEN) between bonded atoms: 0 (nonpolar), intermediate (polar), large (ionic).",
        "visualFormula": "Nonpolar (ΔEN < 0.4) · Polar Covalent (0.4–1.7) · Ionic (ΔEN > 1.7)"
      },
      "2": {
        "goal": "Say whether carbon dioxide turns between the plates.",
        "science": "Linear Dipole Cancellation: Carbon dioxide has two polar C=O double bonds, but because the molecule is linear (180°), the two identical dipole vectors point in opposite directions and cancel completely (net μ = 0).",
        "storyProblem": "Test whether carbon dioxide gas deflects when passed through high-voltage capacitor plates.",
        "howToTest": "Apply an electric field to CO₂: observe that opposing bond dipoles cancel out, so the molecule does not align or turn.",
        "visualFormula": "CO₂: ←—+— C —+—→ (Opposing Equal Vectors Cancel ➔ Net Dipole μ = 0)"
      },
      "3": {
        "goal": "Say why H₂O turns between the plates and CO₂ does not.",
        "science": "Bent Geometry and Non-Canceling Vectors: Water's bent shape (104.5°) prevents its two O–H bond dipoles from canceling. Their vector components add upward, creating a strong permanent molecular dipole that aligns with electric plates.",
        "storyProblem": "Explain why a stream of liquid water bends toward a charged rod while liquid carbon dioxide flows straight down.",
        "howToTest": "Add bond vectors in 3D: in bent water, both bond dipoles point upward toward oxygen, giving a strong net molecular dipole.",
        "visualFormula": "Bent Shape (104.5°) ➔ Dipole Vectors Add Upward ➔ Permanent Polar Dipole"
      },
      "4": {
        "goal": "Say which of CCl₄ and CHCl₃ turns between the plates.",
        "science": "Tetrahedral Symmetry vs Asymmetry: CCl₄ has four identical C–Cl bonds arranged symmetrically in a tetrahedron, canceling to net zero. In CHCl₃ (chloroform), the three C–Cl dipoles and one C–H dipole do not balance, leaving a net dipole that turns in the field.",
        "storyProblem": "Select which chlorinated solvent will orient between electrostatic condenser plates.",
        "howToTest": "Evaluate tetrahedral symmetry: CCl₄ has 4 identical bonds (cancels to 0); CHCl₃ has an asymmetric C–H bond (polar, aligns).",
        "visualFormula": "CCl₄ (Symmetric Tetrahedral = Nonpolar) vs CHCl₃ (Asymmetric = Polar Dipole)"
      },
      "5": {
        "goal": "Say which of NH₃ and BF₃ turns between the plates.",
        "science": "Trigonal Pyramidal vs Trigonal Planar Symmetry: BF₃ is flat trigonal planar (120°), canceling all three B–F dipoles. NH₃ is trigonal pyramidal with a lone pair, causing all three N–H dipoles to reinforce upward into a strong net dipole.",
        "storyProblem": "Determine which industrial gas (ammonia vs boron trifluoride) interacts with electrostatic air cleaners.",
        "howToTest": "Compare 3D geometries: planar BF₃ cancels to nonpolar; pyramidal NH₃ reinforces into a polar molecule.",
        "visualFormula": "BF₃ (Flat Planar 120° = Nonpolar) vs NH₃ (Pyramidal + Lone Pair = Polar)"
      },
      "6": {
        "goal": "File each molecule as polar or nonpolar.",
        "science": "Predicting Molecular Polarity from Shape and Dipoles: A molecule is polar only if it contains polar bonds AND has asymmetric geometry that does not cancel them.",
        "storyProblem": "Sort six refinery solvents into polar and nonpolar storage tanks based on their molecular formulas and VSEPR geometries.",
        "howToTest": "Determine molecular geometry for each molecule: if symmetrical with identical terminal atoms, nonpolar; if lone pairs or mixed atoms, polar.",
        "visualFormula": "Polar: Asymmetric Shapes (Bent, Pyramidal) · Nonpolar: Symmetric (Linear, Planar, Tetrahedral)"
      },
      "7": {
        "goal": "Pick every liquid whose stream a charged rod will bend.",
        "science": "Macroscopic Physical Demonstration of Polarity: A continuous stream of polar liquid is attracted and bent toward an electrically charged rod because its permanent dipoles rotate to face the opposite charge.",
        "storyProblem": "Use the charged wand test to identify which pipeline fluid streams carry polar molecules.",
        "howToTest": "Bring a charged electrode near each liquid stream: only polar liquids (like water and ethanol) deflect toward the wand.",
        "visualFormula": "Charged Electrode ➔ Bends Streams of Polar Liquids (Attracted by Molecular Dipoles)"
      }
    }
  },
  "q8-hybrid": {
    "title": "Hybridization",
    "concept": "Orbital Hybridization & Sigma/Pi Bonding (sp, sp², sp³)",
    "overview": "To form equivalent bonds matching observed VSEPR geometry, atomic valence orbitals mix into HYBRID ORBITALS: 1s + 1p ➔ two sp hybrids (180° linear, 2 leftover p orbitals); 1s + 2p ➔ three sp² hybrids (120° trigonal planar, 1 leftover p); 1s + 3p ➔ four sp³ hybrids (109.5° tetrahedral, 0 leftover p). Head-on overlap creates strong SIGMA (σ) bonds with free rotation; side-to-side overlap of leftover p orbitals creates PI (π) bonds with locked rotation.",
    "storyline": "High-temperature lubricant polymers in Ligar's deep drills suffer mechanical shear. Single sigma bonds rotate freely to absorb twisting torque, while double bonds with rigid pi overlap lock rotation, snapping if forced. By calculating hybridization states and sigma/pi counts, you will formulate shear-resistant synthetic lubricants.",
    "vocab": [
      {
        "word": "Hybridization",
        "meaning": "The mathematical mixing of atomic orbitals (s and p) into identical hybrid orbitals."
      },
      {
        "word": "sp Hybridization",
        "meaning": "Mixing 1s + 1p produces 2 linear hybrid orbitals (180°) with 2 unhybridized p orbitals."
      },
      {
        "word": "sp² Hybridization",
        "meaning": "Mixing 1s + 2p produces 3 trigonal planar hybrid orbitals (120°) with 1 unhybridized p orbital."
      },
      {
        "word": "sp³ Hybridization",
        "meaning": "Mixing 1s + 3p produces 4 tetrahedral hybrid orbitals (109.5°)."
      },
      {
        "word": "Sigma (σ) Bond",
        "meaning": "Head-to-head orbital overlap along the internuclear axis; allows free rotation."
      },
      {
        "word": "Pi (π) Bond",
        "meaning": "Side-to-side overlap of parallel p orbitals above and below the axis; restricts rotation."
      }
    ],
    "stages": {
      "0": {
        "goal": "Say what carbon's orbitals, as they stand, would allow, and what methane actually has.",
        "science": "Need for Orbital Hybridization: Ground state carbon (2s² 2p²) has only 2 unpaired electrons at 90° angles, which cannot explain methane's four identical C–H bonds oriented at 109.5°.",
        "storyProblem": "Explain why unhybridized carbon orbitals fail to account for the tetrahedral geometry of methane in the lubricant synthesizer.",
        "howToTest": "Compare atomic orbitals (2 unpaired p electrons at 90°) with methane's observed structure (4 identical bonds at 109.5°).",
        "visualFormula": "Ground Carbon: 2s² 2p² (2 Unpaired at 90°) vs Methane: 4 Equivalent Bonds at 109.5°"
      },
      "1": {
        "goal": "Blend carbon's orbitals until the lobes match the four arms of methane.",
        "science": "sp³ Hybridization: Mixing one 2s orbital with three 2p orbitals generates four identical degenerate sp³ hybrid orbitals directed toward the vertices of a tetrahedron (109.5°).",
        "storyProblem": "Synthesize four equivalent bonding arms for methane by blending carbon's valence orbitals on the orbital mixer.",
        "howToTest": "Combine 1s + 3p orbitals: observe the formation of 4 equivalent sp³ hybrid lobes pointing at 109.5°.",
        "visualFormula": "1s + 3p ➔ 4 Equivalent sp³ Hybrid Orbitals (Tetrahedral, 109.5°)"
      },
      "2": {
        "goal": "Blend carbon's orbitals until the lobes match the three arms on each carbon of ethene.",
        "science": "sp² Hybridization: Mixing one 2s orbital with two 2p orbitals generates three sp² hybrid orbitals at 120° in a plane, leaving one unhybridized 2p orbital perpendicular to the plane.",
        "storyProblem": "Formulate planar ethylene (C₂H₄) monomers by creating three trigonal planar bonding lobes per carbon.",
        "howToTest": "Combine 1s + 2p orbitals: observe 3 planar sp² lobes (120°) plus 1 vertical unhybridized p orbital.",
        "visualFormula": "1s + 2p ➔ 3 sp² Hybrid Orbitals (120° Trigonal Planar) + 1 Unhybridized p Orbital"
      },
      "3": {
        "goal": "Blend carbon's orbitals until the lobes match the two arms on the carbon of HCN.",
        "science": "sp Hybridization: Mixing one 2s orbital with one 2p orbital produces two sp hybrid orbitals at 180° (linear), leaving two unhybridized 2p orbitals at right angles.",
        "storyProblem": "Configure the linear carbon in hydrogen cyanide (HCN) to form its triple bond framework.",
        "howToTest": "Combine 1s + 1p orbitals: observe 2 collinear sp hybrid lobes (180°) plus 2 unhybridized p orbitals.",
        "visualFormula": "1s + 1p ➔ 2 sp Hybrid Orbitals (180° Linear) + 2 Unhybridized p Orbitals"
      },
      "4": {
        "goal": "Say how the second bond of ethene is built.",
        "science": "Sigma vs Pi Bond Overlap: Ethene's double bond consists of one strong sigma (σ) bond formed by head-on sp²–sp² overlap, and one pi (π) bond formed by side-to-side overlap of the unhybridized p orbitals.",
        "storyProblem": "Analyze the microscopic structure of ethylene's carbon-carbon double bond on the molecular scanner.",
        "howToTest": "Inspect the two components of the double bond: one cylindrical head-on σ bond plus parallel π lobes above and below.",
        "visualFormula": "Double Bond = 1 Head-on Sigma (σ) Bond + 1 Side-to-side Pi (π) Bond"
      },
      "5": {
        "goal": "Count the sigma bonds and the pi bonds in HCN.",
        "science": "Sigma and Pi Counting Rules: Every single bond is 1 σ; a double bond is 1 σ + 1 π; a triple bond is 1 σ + 2 π. In H–C≡N: H–C is 1 σ, and C≡N is 1 σ + 2 π (total 2 σ and 2 π).",
        "storyProblem": "Count total sigma and pi bonds in hydrogen cyanide (HCN) to assess resistance to high-shear cleavage.",
        "howToTest": "Count bonds: 1 σ for the H–C single bond, and 1 σ + 2 π for the C≡N triple bond.",
        "visualFormula": "H–C≡N: 2 Sigma (σ) Bonds + 2 Pi (π) Bonds"
      },
      "6": {
        "goal": "Say which of the two molecules has a bond that turns freely.",
        "science": "Restricted Rotation in Pi Bonds: Cylindrical sigma bonds allow free rotation of attached groups. Pi bonds require parallel p-orbital overlap; rotating twists the p orbitals out of alignment, breaking the pi bond. Hence double bonds have restricted rotation.",
        "storyProblem": "Select which lubricant molecule allows free rotational flex without breaking chemical bonds under stress.",
        "howToTest": "Attempt to rotate the C–C bond: single-bonded ethane rotates freely (σ symmetry); double-bonded ethene resists rotation.",
        "visualFormula": "Single Bond (σ): Free Rotation · Double Bond (σ + π): Rigid Locked Rotation"
      },
      "7": {
        "goal": "Say how many orbitals the hub of PCl₅ and the hub of SF₆ each need to blend.",
        "science": "Expanded Octet Hybridization: Five electron domains blend s + 3p + d ➔ five sp³d hybrid orbitals (trigonal bipyramidal). Six electron domains blend s + 3p + 2d ➔ six sp³d² hybrid orbitals (octahedral).",
        "storyProblem": "Determine the hybrid orbital counts required for phosphorus pentachloride (PCl₅) and sulfur hexafluoride (SF₆).",
        "howToTest": "Match domain count to hybrid orbitals: 5 domains = 5 orbitals (sp³d); 6 domains = 6 orbitals (sp³d²).",
        "visualFormula": "5 Domains (PCl₅) ➔ sp³d Hybridization · 6 Domains (SF₆) ➔ sp³d² Hybridization"
      }
    }
  },
  "q9-orbitals": {
    "title": "Molecular Orbitals",
    "concept": "Molecular Orbital Theory & Paramagnetism (Bonding, Antibonding & Bond Order)",
    "overview": "Molecular Orbital (MO) theory combines atomic orbitals into delocalized molecular orbitals spread over the entire molecule. Constructive wave interference forms lower-energy BONDING orbitals (σ, π) that stabilize the molecule; destructive interference forms higher-energy ANTIBONDING orbitals (σ*, π*) with nodal planes that destabilize it. Bond Order = ½(Bonding e⁻ − Antibonding e⁻). MO theory explains why liquid O₂ is paramagnetic: its two valence electrons sit unpaired in separate π* antibonding orbitals.",
    "storyline": "Cryogenic liquid fuel lines on Ligar pump liquid oxygen and nitrogen through magnetic induction coils. While classical Lewis structures predict oxygen is nonmagnetic with all paired electrons, liquid oxygen is violently attracted to magnetic poles, while nitrogen flows straight. By solving Molecular Orbital diagrams, you will predict bond stability and magnetic response.",
    "vocab": [
      {
        "word": "Molecular Orbital (MO)",
        "meaning": "Delocalized quantum wave function describing electron distribution over the entire molecule."
      },
      {
        "word": "Bonding Orbital",
        "meaning": "Low-energy orbital with electron density between nuclei that stabilizes the bond."
      },
      {
        "word": "Antibonding Orbital (σ*, π*)",
        "meaning": "High-energy orbital with a nodal plane between nuclei that weakens the bond."
      },
      {
        "word": "Bond Order",
        "meaning": "Measure of bond strength: Bond Order = ½(Bonding electrons − Antibonding electrons)."
      },
      {
        "word": "Paramagnetism in O₂",
        "meaning": "Oxygen has 2 unpaired electrons in degenerate π*2p orbitals, causing magnetic attraction."
      }
    ],
    "stages": {
      "0": {
        "goal": "Say what becomes of the two 1s boxes when the atoms join.",
        "science": "Orbital Conservation in MO Theory: Combining two 1s atomic orbitals creates exactly two molecular orbitals: one lower-energy bonding orbital (σ1s) and one higher-energy antibonding orbital (σ*1s).",
        "storyProblem": "Observe what happens when two atomic hydrogen 1s orbitals combine in the diatomic synthesizer.",
        "howToTest": "Watch the energy diagram split: one bonding box drops below the atomic level, and one antibonding box rises above it.",
        "visualFormula": "2 Atomic Orbitals (1s + 1s) ➔ 1 Bonding (σ1s, Lower Energy) + 1 Antibonding (σ*1s, Higher Energy)"
      },
      "1": {
        "goal": "Place the two electrons of H₂ where they have the least energy.",
        "science": "Aufbau Filling in H₂ MO: Both electrons fill the lower-energy bonding orbital (σ1s) with opposite spins, lowering the total system energy and creating a stable H–H single bond (Bond Order = 1).",
        "storyProblem": "Place the two electrons of diatomic hydrogen into the lowest available molecular orbitals.",
        "howToTest": "Drop both electrons into the lower bonding σ1s box: observe the energy drop confirming stable bond formation.",
        "visualFormula": "H₂: 2 Electrons in Bonding σ1s ➔ Bond Order = ½(2 − 0) = 1 (Stable Single Bond)"
      },
      "2": {
        "goal": "Place all four electrons of He₂ and say whether the molecule would hold together.",
        "science": "Zero Bond Order in Dihelium: He₂ has 4 electrons: 2 enter bonding σ1s and 2 enter antibonding σ*1s. Bond Order = ½(2 − 2) = 0. The antibonding cancellation means He₂ cannot form a stable bond.",
        "storyProblem": "Attempt to synthesize diatomic helium (He₂) in the cryogenic gas compressor. Explain why the atoms separate.",
        "howToTest": "Fill MO boxes with 4 electrons (2 in σ, 2 in σ*): calculate Bond Order = ½(2 − 2) = 0.",
        "visualFormula": "He₂: 2 Bonding e⁻ + 2 Antibonding e⁻ ➔ Bond Order = ½(2 − 2) = 0 (Unstable, Does Not Form)"
      },
      "3": {
        "goal": "Give the bond order of N₂.",
        "science": "Triple Bond in Nitrogen MO: N₂ has 8 valence electrons in bonding orbitals and 2 in antibonding orbitals: Bond Order = ½(8 − 2) = 3 (matches the stable N≡N triple bond).",
        "storyProblem": "Calculate the molecular bond order of atmospheric nitrogen (N₂) to verify its extreme chemical inertness.",
        "howToTest": "Count valence electrons: 8 in bonding MOs, 2 in antibonding MOs. Compute BO = ½(8 − 2) = 3.",
        "visualFormula": "N₂: Bond Order = ½(8 Bonding − 2 Antibonding) = 3 (Triple Bond)"
      },
      "4": {
        "goal": "Say whether O₂ is pulled toward the magnet.",
        "science": "Paramagnetism of O₂: In O₂, the last two electrons enter degenerate π*2p antibonding orbitals singly with parallel spins (Hund's rule). Two unpaired electrons make oxygen paramagnetic, attracted to magnets.",
        "storyProblem": "Explain why liquid oxygen is trapped between magnetic pole pieces while Lewis structures show all paired electrons.",
        "howToTest": "Inspect the π*2p antibonding level: observe two separate boxes each holding one unpaired electron.",
        "visualFormula": "O₂ MO: [↑ ] [↑ ] in Degenerate π*2p Orbitals ➔ 2 Unpaired Electrons ➔ Paramagnetic!"
      },
      "5": {
        "goal": "Put O₂⁺, O₂ and O₂⁻ in order of bond length, shortest first.",
        "science": "Antibonding Electrons and Bond Length: Removing an antibonding electron (O₂⁺) raises bond order to 2.5 (shorter bond); adding an antibonding electron (O₂⁻) lowers bond order to 1.5 (longer bond). Order: O₂⁺ < O₂ < O₂⁻.",
        "storyProblem": "Rank neutral oxygen, dioxygen cation, and superoxide anion by bond length for the combustion chamber.",
        "howToTest": "Compare bond orders: O₂⁺ (BO = 2.5, shortest), O₂ (BO = 2.0), O₂⁻ (BO = 1.5, longest).",
        "visualFormula": "Bond Length (Shortest to Longest): O₂⁺ (BO 2.5) < O₂ (BO 2.0) < O₂⁻ (BO 1.5)"
      },
      "6": {
        "goal": "Say why F₂ is a weaker bond than O₂.",
        "science": "Antibonding Electron Accumulation: F₂ has 14 valence electrons, filling all four π*2p antibonding orbitals: Bond Order = ½(8 − 6) = 1. The high antibonding population weakens and lengthens the F–F bond compared to O₂ (BO = 2).",
        "storyProblem": "Explain why diatomic fluorine (F₂) is much more reactive and fragile than diatomic oxygen.",
        "howToTest": "Calculate bond order: F₂ has 6 antibonding electrons, reducing bond order to 1.",
        "visualFormula": "F₂ Bond Order = ½(8 − 6) = 1 (More Antibonding Electrons ➔ Weaker Single Bond)"
      },
      "7": {
        "goal": "Fill B₂ on this rack and say why it is magnetic.",
        "science": "s-p Mixing in Early Diatomics: For B₂, C₂, and N₂, 2s-2p mixing pushes the σ2p orbital above the π2p orbitals. B₂'s two valence electrons occupy separate π2p bonding orbitals with parallel spins, making B₂ paramagnetic.",
        "storyProblem": "Model diatomic boron (B₂) to predict its magnetic response in high-temperature vapor.",
        "howToTest": "Notice the π2p orbitals sit below σ2p: place boron's 2 valence electrons singly into the two π2p boxes.",
        "visualFormula": "B₂: s-p Orbital Mixing Places π2p Below σ2p ➔ 2 Unpaired Electrons ➔ Paramagnetic"
      }
    }
  },
  "boss-warden": {
    "title": "Basalt Warden",
    "concept": "Comprehensive Unit 3 Review",
    "overview": "Apply complete mastery of chemical bonding, solid structures, VSEPR geometries, molecular polarity, and molecular orbital theory to dismantle the Basalt Warden colossus: target weak lattice energies to breach armor, assemble expanded octet vents, identify square planar angles, ground coolant dipoles, and expose its paramagnetic core.",
    "storyline": "An ancient volcanic construct—the Basalt Warden—guards the geothermal generator vault on Ligar. Its crystalline basalt plating, hydraulic cooling channels, and magnetic induction core operate via intricate chemical bonding matrices. By systematically discovering and exploiting its chemical vulnerabilities, you will deactivate the colossus and secure base power!",
    "vocab": [
      {
        "word": "Lattice Vulnerability",
        "meaning": "Identifying low lattice energy salts to crack refractory armor."
      },
      {
        "word": "Expanded Octet Seal",
        "meaning": "Assembling 10-electron sulfur fluoride Lewis structures to plug pressure vents."
      },
      {
        "word": "Square Planar Joint",
        "meaning": "Locking 90° articulation joints using 6-domain VSEPR geometries."
      },
      {
        "word": "Dielectric Grounding",
        "meaning": "Deflecting hydraulic lines by isolating polar vs nonpolar fluids."
      },
      {
        "word": "Paramagnetic Core",
        "meaning": "Targeting unpaired electron spins in oxygen MO antibonding orbitals."
      }
    ],
    "stages": {
      "0": {
        "goal": "Phase 1: Pick the plate whose ions need the most heat before they can move.",
        "science": "Lattice Energy Exploitation: Higher charges on smaller ions create maximum lattice energy (e.g. MgO with +2/−2 is far stronger than NaCl with +1/−1). Striking the plate with lower lattice energy shatters the Warden's outer armor.",
        "storyProblem": "The Warden's armor consists of two salt alloys: one held by high-charge ions and one by low-charge ions. Target the plate that requires the most heat to melt to find the master anchor point.",
        "howToTest": "Compare ion charges and sizes: higher charges produce the highest melting point and hardest lattice.",
        "visualFormula": "Maximum Lattice Energy: Higher Ion Charges (±2 > ±1) & Smaller Radii = Highest Melting Point"
      },
      "1": {
        "goal": "Phase 2: Use up every electron in the tray for SF₄ so that every lamp is lit.",
        "science": "Expanded Octet Geometry: Sulfur in SF₄ has 34 valence electrons: four S–F single bonds (8 e⁻), one equatorial lone pair on sulfur (2 e⁻), and three lone pairs on each fluorine (24 e⁻), totaling 34 electrons. Completing this Lewis structure seals the cooling vent.",
        "storyProblem": "The Warden vents superheated sulfur tetrafluoride gas. Assemble SF₄'s complete 34-electron expanded octet to close the emergency vent valve.",
        "howToTest": "Place 4 single bonds around Sulfur, add 1 lone pair on Sulfur (10 e⁻ total on S), and fill octets on all four Fluorines.",
        "visualFormula": "SF₄: 4 Bonds + 1 Lone Pair on S (10 e⁻ Expanded Octet) + 24 e⁻ on Fluorines = 34 e⁻"
      },
      "2": {
        "goal": "Phase 3: Say the angle between neighbouring fluorine atoms on the XeF₄ hub.",
        "science": "Square Planar Bond Angles: XeF₄ has 6 electron domains (4 bonds + 2 lone pairs opposite at 180°). The four fluorine atoms lie in a flat plane with 90° bond angles. Entering 90° locks the joint servos.",
        "storyProblem": "The Warden's leg joints articulate via xenon tetrafluoride hydraulic hinges. Enter the exact bond angle between adjacent fluorine atoms to lock the joint.",
        "howToTest": "Recall square planar molecular geometry: the four planar bonds are separated by 90° angles.",
        "visualFormula": "XeF₄ Square Planar Geometry: Adjacent F–Xe–F Angle = 90°"
      },
      "3": {
        "goal": "Phase 4: Pick every molecule that turns between the plates.",
        "science": "Molecular Polarity and Dipole Alignment: Asymmetric molecules with net dipoles (like SF₄ seesaw and NH₃ pyramidal) rotate and align between charged capacitor plates; symmetric molecules like linear CO₂ cancel to zero and do not turn.",
        "storyProblem": "The Warden pumps dielectric coolant through high-voltage plates. Identify every fluid molecule that rotates in the electric field to ground the coolant system.",
        "howToTest": "Select molecules with asymmetric shapes and uncancelled dipole moments (SF₄ and NH₃).",
        "visualFormula": "Net Dipole μ > 0: SF₄ (Seesaw) & NH₃ (Pyramidal) Turn in Electric Field"
      },
      "4": {
        "goal": "Phase 5: Pick the gas that the magnet pulls toward it.",
        "science": "Paramagnetism of O₂ in MO Theory: Only oxygen (O₂) has two unpaired electrons in separate π* antibonding orbitals, causing it to be drawn toward magnetic poles. Nitrogen and fluorine have all paired electrons. Exposing the paramagnetic core collapses the Warden.",
        "storyProblem": "The Warden's final core shield is held by an electromagnetic containment field. Select the gas that is pulled into the magnetic field to breach the core.",
        "howToTest": "Identify the paramagnetic gas with unpaired MO electrons: O₂ is strongly attracted to magnets.",
        "visualFormula": "Paramagnetic Gas: O₂ (2 Unpaired Electrons in π*2p) is Drawn to Magnet"
      }
    }
  },
  "q1-knocks": {
    "title": "Pressure and Temperature",
    "concept": "Gas Pressure, Temperature & Kinetic Molecular Theory",
    "overview": "Gas is a crowd of particles in constant random motion. Pressure is the combined force of particle collisions against container walls, and temperature measures the particles' average kinetic energy. At absolute zero (0 K or −273.15 °C), particle motion completely ceases.",
    "storyline": "The Cloud Deck pneumatic systems and airlocks on Bellows are powered by pressurized gas cylinders. To regulate ballast tanks and stabilize the platform, we must determine what pressure meters actually measure, how heating energizes particles, and where molecular motion ceases at absolute zero.",
    "vocab": [
      {
        "word": "Pressure",
        "meaning": "The continuous force exerted by gas particle collisions per unit area of container wall."
      },
      {
        "word": "Kinetic Energy",
        "meaning": "The energy of motion of gas particles (KE = ½ m v²)."
      },
      {
        "word": "Temperature",
        "meaning": "The direct measure of the average kinetic energy of the particles in a substance."
      },
      {
        "word": "Maxwell-Boltzmann Distribution",
        "meaning": "The spread of molecular speeds in a gas, with a peak at the most probable speed."
      },
      {
        "word": "Absolute Zero",
        "meaning": "The lowest possible temperature (0 K or −273.15 °C) where all particle kinetic motion ceases."
      },
      {
        "word": "Kinetic Molecular Theory",
        "meaning": "The model explaining gas behavior as tiny, widely separated particles in constant random elastic motion."
      }
    ],
    "stages": {
      "0": {
        "goal": "Say what the gauge is measuring.",
        "science": "Pressure: The gauge reads pressure: the combined push of all the particles knocking on the wall. Squeeze the same particles into less room and they knock more often, so the pressure climbs.",
        "storyProblem": "The compressor manifold gauge needle twitches when the piston moves. Determine what physical phenomenon the sensor is recording inside the cylinder wall.",
        "howToTest": "Slide the piston to compress the gas: notice the particle counter and needle move together while temperature and particle count stay constant.",
        "visualFormula": "Gas Pressure (P) = Total Particle Collisions per Second on Cylinder Wall Surface"
      },
      "1": {
        "goal": "Say what doubling the amount of gas does to the pressure.",
        "science": "Pressure Follows the Amount: Twice the particles in the same room knock twice as often, so the pressure doubles. At a fixed volume and temperature the pressure is proportional to the amount of gas.",
        "storyProblem": "The cloud platform auxiliary tank needs a recharge. Predict how the wall pressure changes when injection pumps double the number of gas particles in the fixed volume.",
        "howToTest": "Double the gas quantity in the cylinder while keeping temperature and volume steady: observe how the collision rate and gauge respond.",
        "visualFormula": "P ∝ n (At Constant V and T: Doubling Gas Particles 'n' Exactly Doubles Pressure 'P')"
      },
      "2": {
        "goal": "Say what heating does to the particles.",
        "science": "Kinetic Energy: Heated particles move faster, and the energy of that motion is their kinetic energy. Temperature measures the average kinetic energy of the particles.",
        "storyProblem": "Thermal heaters warm the pneumatic lines during a high-altitude frost. Explain what heat energy actually does to the trapped gas particles.",
        "howToTest": "Raise the temperature dial on the heat coil: observe the speed of the dots in the inspection window and watch the wall collisions increase.",
        "visualFormula": "Temperature (T) ∝ Average Kinetic Energy (KE_avg = ½ m v_avg²)"
      },
      "3": {
        "goal": "Say how the speeds of the particles in one cylinder compare with one another.",
        "science": "Maxwell–Boltzmann Distribution: The speeds follow a Maxwell–Boltzmann distribution: a spread of speeds with a peak. Heating moves the peak to higher speeds and flattens the spread.",
        "storyProblem": "A technician asks if every gas particle in a warm cylinder flies at identical velocity. Analyze the particle velocity monitor.",
        "howToTest": "Examine the particle speed distribution curve: look for a spread of speeds with a characteristic peak rather than a single uniform velocity.",
        "visualFormula": "Maxwell-Boltzmann Curve: Broad Distribution of Particle Speeds Peaking at Most Probable Speed (v_mp)"
      },
      "4": {
        "goal": "Say how helium and carbon dioxide compare at one temperature.",
        "science": "Same Temperature, Same Energy: At one temperature every gas has the same average kinetic energy, so the lighter particles must move faster. The temperature fixes the energy, never the speed.",
        "storyProblem": "A ballast system balances light helium against dense carbon dioxide at 300 K. Compare their particle velocities and kinetic energies.",
        "howToTest": "Compare helium (light) and CO₂ (heavy) at the same temperature: notice average kinetic energy is identical, but light helium particles move much faster.",
        "visualFormula": "At Same Temperature: KE(He) = KE(CO₂), but Average Speed v(He) > v(CO₂) Because Mass m(He) < m(CO₂)"
      },
      "5": {
        "goal": "Give the reading Cylinder A would show on the middle ring.",
        "science": "Atmospheres, Kilopascals, mmHg: The three rings are three units for the same pressure: one atmosphere (atm) is 101.3 kilopascals (kPa) is 760 millimetres of mercury (mmHg). Any reading in one unit can be turned into either of the others.",
        "storyProblem": "A supplier's pressure dial is calibrated in atmospheres, but the manifold requires readings in kilopascals and millimeters of mercury. Convert between the three unit rings.",
        "howToTest": "Read the reference dial that shows all three concentric rings: align 1.0 atm with 101.3 kPa and 760 mmHg to find the conversion ratio.",
        "visualFormula": "1.00 atm = 101.3 kPa = 760 mmHg = 760 Torr"
      },
      "6": {
        "goal": "Find the temperature at which the pressure would fall to zero.",
        "science": "Absolute Zero: Carried back, the line reaches zero pressure at −273 °C. Nothing can be colder, because the particles would have no motion left to lose. That point is absolute zero, and the kelvin scale starts counting from it.",
        "storyProblem": "Cryogenic cooling coils chill gas toward thermal standstill. Extrapolate the pressure-versus-temperature graph to find where particle collisions completely cease.",
        "howToTest": "Follow the linear pressure vs Celsius line backward to zero pressure: note where it crosses the horizontal temperature axis.",
        "visualFormula": "Zero Pressure (Zero Kinetic Motion) ➔ Absolute Zero = 0 K = −273.15 °C"
      },
      "7": {
        "goal": "Pick every statement the bench has shown to be true.",
        "science": "Kinetic Molecular Theory: Everything the bench has shown fits one picture, the kinetic molecular theory. A gas is a crowd of tiny particles in constant random motion, far apart, and its pressure is their knocking on the walls.",
        "storyProblem": "Compile the operational flight manual for the Cloud Deck pressure system. Select every validated principle of the Kinetic Molecular Theory.",
        "howToTest": "Review your experimental findings: constant random motion, negligible particle volume compared to container, elastic collisions, and temperature measuring kinetic energy.",
        "visualFormula": "Kinetic Molecular Theory (KMT): Particles in Constant Random Motion; P = Collisions; T = Average KE"
      }
    }
  },
  "q2-laws": {
    "title": "The Gas Laws",
    "concept": "Empirical Gas Laws (Boyle, Charles, Gay-Lussac, Avogadro & Combined)",
    "overview": "Gases respond predictably to physical changes. Boyle's law links pressure and volume inversely; Charles's law links volume and absolute temperature directly; Gay-Lussac's law links pressure and temperature; Avogadro's law links volume and mole count. Together they form the Combined Gas Law.",
    "storyline": "The pneumatic compression lines across Bellows must survive extreme altitude swings and temperature drops over the cloud sea. To keep pipelines from collapsing or bursting, we must calibrate volume valves, heating elements, and pressure regulators using the empirical gas laws.",
    "vocab": [
      {
        "word": "Boyle's Law",
        "meaning": "Pressure and volume are inversely proportional at constant temperature (P₁ · V₁ = P₂ · V₂)."
      },
      {
        "word": "Charles's Law",
        "meaning": "Volume and absolute temperature are directly proportional at constant pressure (V₁ / T₁ = V₂ / T₂)."
      },
      {
        "word": "Gay-Lussac's Law",
        "meaning": "Pressure and absolute temperature are directly proportional at constant volume (P₁ / T₁ = P₂ / T₂)."
      },
      {
        "word": "Avogadro's Law",
        "meaning": "Equal volumes of gases at identical temperature and pressure contain equal numbers of particles (V₁ / n₁ = V₂ / n₂)."
      },
      {
        "word": "Combined Gas Law",
        "meaning": "Combines Boyle's, Charles's, and Gay-Lussac's laws for a fixed amount of gas ((P₁ · V₁) / T₁ = (P₂ · V₂) / T₂)."
      }
    ],
    "stages": {
      "0": {
        "goal": "Say what happens to the pressure when the gas is given a quarter of the room at the same temperature.",
        "science": "Boyle's Law: At a fixed temperature, the pressure of a gas rises as its volume falls, and pressure times volume stays the same. This is Boyle's law.",
        "storyProblem": "An intake ram compresses ballast gas into one-fourth its initial chamber volume at constant temperature. Determine the resulting pressure rise.",
        "howToTest": "Slide the volume slider from 4 units down to 1 unit at constant temperature: observe the pressure gauge multiply by four.",
        "visualFormula": "Boyle's Law (Constant T): P₁ · V₁ = P₂ · V₂ ➔ Squeezing to ¼ Volume Produces 4× Pressure"
      },
      "1": {
        "goal": "Say why the pressure doubles when the same particles are given half the room.",
        "science": "Inversely Proportional: With the same particles in half the room, each one reaches the wall twice as often, so the knocks double. Pressure and volume are inversely proportional: as one falls the other rises by the same factor.",
        "storyProblem": "Explain why compressing a piston to half its stroke doubles the push on the pneumatic seal.",
        "howToTest": "Halve the container volume while monitoring collision frequency: particles travel half the round-trip distance between walls, doubling collision rate.",
        "visualFormula": "Inversely Proportional: Volume ÷ 2 ➔ Distance to Wall ÷ 2 ➔ Collisions × 2 ➔ Pressure × 2"
      },
      "2": {
        "goal": "Say what happens to the volume when the temperature in kelvin is tripled and the pressure is kept steady.",
        "science": "Charles's Law: At a steady pressure, the volume of a gas is proportional to its kelvin temperature: three times the kelvin, three times the volume. This is Charles's law.",
        "storyProblem": "A thermal expansion balloon over the cloud sea is heated from 100 K to 300 K while internal pressure matches atmospheric pressure. Calculate its volume change.",
        "howToTest": "Increase absolute temperature threefold while allowing the piston to move freely to maintain steady pressure: record the expansion.",
        "visualFormula": "Charles's Law (Constant P): V₁ / T₁ = V₂ / T₂ ➔ Tripling Kelvin Temperature (3× T) Exactly Triples Volume (3× V)"
      },
      "3": {
        "goal": "Say why the volume line meets zero at 0 K but not at 0 °C.",
        "science": "Why Kelvin: Volume at a steady pressure is proportional to the temperature only when the temperature is counted from absolute zero, as kelvin is. The zero of the Celsius scale is just where water freezes, so the same line does not pass through it.",
        "storyProblem": "A flight cadet asks why gas law calculations fail when using Celsius instead of Kelvin. Clarify the origin of the temperature scale.",
        "howToTest": "Inspect the V vs T plot: the linear trend intercepts zero volume only at absolute zero (0 K = −273 °C), not at the freezing point of water (0 °C = 273 K).",
        "visualFormula": "Absolute Temperature: V ∝ T_Kelvin (Where T_K = T_°C + 273.15; Volume Proportionality Requires 0 K Intercept)"
      },
      "4": {
        "goal": "Give the factor by which the pressure rises when this sealed tank is heated from 300 K to 450 K.",
        "science": "Gay-Lussac's Law: At a fixed volume, the pressure of a gas is proportional to its kelvin temperature, so heating a sealed tank raises the pressure in step. This is Gay-Lussac's law.",
        "storyProblem": "A rigid, unyielding gas canister is heated from 300 K to 450 K by engine exhaust. Determine the pressure multiplication factor.",
        "howToTest": "Heat a fixed-volume cylinder from 300 K to 450 K: divide the final pressure by the initial pressure to find the ratio (450 / 300 = 1.5).",
        "visualFormula": "Gay-Lussac's Law (Constant V): P₁ / T₁ = P₂ / T₂ ➔ Ratio = T₂ / T₁ = 450 K / 300 K = 1.5× Pressure"
      },
      "5": {
        "goal": "Say what happens to the volume when the amount of gas is doubled at the same temperature and under the same weight.",
        "science": "Avogadro's Law: At the same temperature and pressure, the volume of a gas is proportional to the amount of gas: equal amounts fill equal volumes. This is Avogadro's law.",
        "storyProblem": "Injecting fresh reserve gas into an elastic fuel bladder at constant temperature and pressure. Determine how volume scales with particle count.",
        "howToTest": "Pump double the moles of gas into the expandable chamber while keeping temperature and load weight constant: observe the volume double.",
        "visualFormula": "Avogadro's Law (Constant P, T): V₁ / n₁ = V₂ / n₂ ➔ Doubling Moles (2× n) Exactly Doubles Volume (2× V)"
      },
      "6": {
        "goal": "Give the volume Cylinder A would have at half its pressure and a temperature of 450 K.",
        "science": "Combined Gas Law: When pressure, volume and temperature all change, the quantity pressure times volume over kelvin temperature stays the same for a fixed amount of gas. This is the combined gas law, and the laws before it are the cases where one quantity is held fixed.",
        "storyProblem": "A high-altitude probe rises into thin air where pressure is halved and heating coils warm the chamber to 450 K. Calculate the new volume.",
        "howToTest": "Set up the combined gas ratio ((P₁ · V₁) / T₁ = (P₂ · V₂) / T₂) and solve for V₂ using the initial cylinder readings.",
        "visualFormula": "Combined Gas Law: (P₁ · V₁) / T₁ = (P₂ · V₂) / T₂ ➔ V₂ = V₁ · (P₁ / P₂) · (T₂ / T₁)"
      },
      "7": {
        "goal": "File each gauge record under the quantity that was held fixed while it was taken.",
        "science": "One Gas, Four Changes: Each record is the same gas answering a different change: a curve when only the volume and pressure move, and straight lines through zero when the pressure or the volume is held. Together they are one relation between pressure, volume, temperature and amount.",
        "storyProblem": "Sort four flight recorder telemetry charts by identifying which physical variable was held constant during each flight experiment.",
        "howToTest": "Inspect the curves: a hyperbola shows constant temperature (Boyle), a straight line through zero on V vs T shows constant pressure (Charles), and on P vs T shows constant volume (Gay-Lussac).",
        "visualFormula": "Constant T ➔ P vs V Curve; Constant P ➔ V vs T Line; Constant V ➔ P vs T Line; Constant P, T ➔ V vs n Line"
      }
    }
  },
  "q3-ideal": {
    "title": "The Ideal Gas Law",
    "concept": "The Ideal Gas Law (PV = nRT), Molar Volume & Gas Stoichiometry",
    "overview": "Unifying pressure, volume, temperature, and moles into a single fundamental relationship: PV = nRT. At standard temperature and pressure (STP), one mole of any ideal gas occupies 22.4 liters. This allows measuring gas quantities, molar mass, and gas density directly from pressure and temperature gauges.",
    "storyline": "The cloud deck station's atmospheric synthesizers and life-support scrubbers process thousands of liters of volatile gas daily. To calculate oxygen reserves, detect pipeline leaks, and identify mystery gas cylinders without opening them, we apply the Ideal Gas Law equation of state.",
    "vocab": [
      {
        "word": "Ideal Gas Law",
        "meaning": "The equation of state relating pressure, volume, moles, and temperature: PV = nRT."
      },
      {
        "word": "Gas Constant (R)",
        "meaning": "Universal constant linking gas variables (8.314 kPa·L/(mol·K); 0.0821 L·atm/(mol·K))."
      },
      {
        "word": "Molar Volume",
        "meaning": "The volume occupied by one mole of any ideal gas at STP (22.4 L at 0 °C and 1.00 atm)."
      },
      {
        "word": "STP",
        "meaning": "Standard Temperature and Pressure (0 °C / 273.15 K and 1.00 atm / 101.3 kPa)."
      },
      {
        "word": "Gas Density",
        "meaning": "Mass per unit volume of a gas, proportional to molar mass and pressure (d = (P · M) / (R · T))."
      }
    ],
    "stages": {
      "0": {
        "goal": "Say what volume one mole of gas fills at 0 °C and a pressure of one atmosphere.",
        "science": "Molar Volume: One mole of any gas fills about 22.4 litres at 0 °C and one atmosphere. This volume is the molar volume of a gas, and the two cylinders show it is the same for light helium and heavy carbon dioxide.",
        "storyProblem": "Calibrate standard volumetric dispensers at STP (0 °C and 1 atm). Determine the universal volume occupied by exactly one mole of any ideal gas.",
        "howToTest": "Test 1 mole of light helium and 1 mole of heavy CO₂ in STP cylinders: notice both occupy the identical 22.4-liter volume.",
        "visualFormula": "Molar Volume at STP (0 °C, 1 atm): 1.00 mol Gas = 22.4 Liters (Identical for All Ideal Gases)"
      },
      "1": {
        "goal": "Find the number that every reading in the log gives.",
        "science": "The Gas Constant: Pressure times volume, divided by amount times temperature, comes to 8.31 for every reading in these units. That number is the gas constant R, and the whole relation, PV = nRT, is the ideal gas law.",
        "storyProblem": "Compute the ratio (P·V) / (n·T) across all manifold test logs in kPa and liters to determine the universal gas constant.",
        "howToTest": "Multiply pressure (kPa) by volume (L), then divide by moles (n) and temperature (K) for each row in the test log.",
        "visualFormula": "Ideal Gas Law: PV = nRT ➔ Universal Gas Constant R = (P · V) / (n · T) = 8.314 kPa·L / (mol·K)"
      },
      "2": {
        "goal": "Give the amount of gas in the sealed tank, in moles.",
        "science": "Counting From a Gauge: Rearranged, the law gives the amount of gas: n equals PV over RT. A sealed tank can be counted with nothing but its gauge, its volume and its thermometer.",
        "storyProblem": "A storage sphere of known volume has a pressure gauge and thermometer. Count the exact number of moles inside without breaching the hull.",
        "howToTest": "Rearrange the ideal gas equation: solve n = (P · V) / (R · T) using the tank's pressure, volume, and temperature.",
        "visualFormula": "Counting Moles in Tank: n = (P · V) / (R · T)"
      },
      "3": {
        "goal": "Say which value of R goes with a gauge that reads in atmospheres.",
        "science": "R Follows the Unit: R has a different value for each unit of pressure: 8.31 with kilopascals and 0.0821 with atmospheres. Use the value whose units match the gauge, or the answer is out by the conversion factor.",
        "storyProblem": "An avionics pressure dial displays atmospheres (atm) while volume is in liters. Select the proper universal gas constant value.",
        "howToTest": "Check the units of R: when pressure is in atmospheres and volume in liters, use R = 0.0821 L·atm/(mol·K); when in kPa, use 8.314.",
        "visualFormula": "Matching Units of R: Use R = 0.0821 L·atm/(mol·K) for atm; Use R = 8.314 kPa·L/(mol·K) for kPa"
      },
      "4": {
        "goal": "Name the gas in the sealed tank.",
        "science": "Molar Mass From a Gas: The amount of gas comes from the gas law, and the molar mass is the mass on the scale divided by that amount. Pressure, volume, temperature and mass are enough to name a gas.",
        "storyProblem": "A mystery salvage canister is found on the landing deck. Identify the gas inside by measuring its mass on a scale and using gas law telemetry.",
        "howToTest": "Calculate moles n = PV/(RT), weigh the gas mass (m), then compute molar mass M = m / n to match the element on the periodic table.",
        "visualFormula": "Molar Mass: M = mass / moles = m / (PV / RT) = (m · R · T) / (P · V)"
      },
      "5": {
        "goal": "Put the three gases in order of density, densest first.",
        "science": "Gas Density: At the same temperature and pressure, equal amounts of any gas fill the same volume, so the heavier the particles the denser the gas. Gas density rises with molar mass and with pressure, and falls as the temperature rises.",
        "storyProblem": "Rank three gases by density at identical temperature and pressure to determine which will sink to the bottom of the cloud deck trenches.",
        "howToTest": "Compare molar masses: since density d = (P·M)/(R·T), at equal P and T the gas with the highest molar mass has the highest density.",
        "visualFormula": "Gas Density: d = (P · M) / (R · T) ➔ Density is Directly Proportional to Molar Mass (M)"
      },
      "6": {
        "goal": "Give the volume of gas this pellet gives off at 25 °C and one atmosphere.",
        "science": "Gas From a Reaction: The balanced equation gives the moles of gas for each mole of solid, and the gas law turns those moles into a volume at the conditions you choose. The same pellet fills a different volume at a different temperature or pressure.",
        "storyProblem": "An emergency oxygen generation pellet decomposes during life-support testing. Calculate the gas volume released at 25 °C and 1.0 atm.",
        "howToTest": "Use reaction stoichiometry to find moles of gas generated from pellet mass, then compute V = (n·R·T) / P.",
        "visualFormula": "Reaction Gas Volume: Moles Reactant ➔ Moles Gas (n) ➔ Volume V = (n · R · T) / P"
      },
      "7": {
        "goal": "Say why one mole of any gas fills the same volume at one temperature and pressure.",
        "science": "Why the Volume Is Shared: Gas particles are so far apart that the room is almost all empty space, so the volume depends on how many particles there are and not on what they are. That is why one mole of any gas fills the same volume at the same temperature and pressure.",
        "storyProblem": "Explain to flight engineers why a mole of heavy, bulky gas occupies the exact same chamber volume as a mole of tiny helium atoms at STP.",
        "howToTest": "Consider the distance between gas particles: individual particle volume is less than 0.1% of the total space, so particle identity does not affect total volume.",
        "visualFormula": "Universal Gas Volume: Container Space >> Particle Size ➔ Volume Governed Solely by Particle Count (n)"
      }
    }
  },
  "q4-mixtures": {
    "title": "Partial Pressures",
    "concept": "Dalton's Law of Partial Pressures & Gas Mixtures",
    "overview": "In a mixture of unreacting gases, each gas exerts pressure independently as if it occupied the entire container alone. The total pressure is the sum of all individual partial pressures. Each gas's partial pressure is equal to its mole fraction multiplied by the total pressure: P_i = X_i · P_total.",
    "storyline": "The breathable atmosphere of the Bellows habitation dome is an engineered mixture of nitrogen, oxygen, and trace gases. When pressure drops at high altitude or contaminants enter the ducts, we use Dalton's law to monitor individual oxygen partial pressures and keep the crew alive.",
    "vocab": [
      {
        "word": "Partial Pressure",
        "meaning": "The pressure that an individual gas in a mixture would exert if it alone occupied the entire volume."
      },
      {
        "word": "Dalton's Law",
        "meaning": "The total pressure of a gas mixture is the sum of the partial pressures of each component gas (P_total = P₁ + P₂ + ...)."
      },
      {
        "word": "Mole Fraction (X)",
        "meaning": "The ratio of the moles of one component to the total moles in the mixture (X_i = n_i / n_total)."
      },
      {
        "word": "Gas Mixture",
        "meaning": "A blend of two or more unreacting gases expanding uniformly to fill a container."
      }
    ],
    "stages": {
      "0": {
        "goal": "Say how the reading on Tank A after the pour compares with the two readings before it.",
        "science": "Partial Pressure and Dalton's Law: Each gas in a mixture pushes as hard as it would if it were alone in the tank, and that share is its partial pressure. The total pressure is the sum of the partial pressures, which is Dalton's law.",
        "storyProblem": "Gas from two separate supply cylinders is pumped together into Tank A. Compare the final tank pressure to the initial cylinder pressures.",
        "howToTest": "Check the initial pressures of the two source cylinders: observe that the gauge on the combined tank equals their exact sum.",
        "visualFormula": "Dalton's Law: P_total = P_Gas1 + P_Gas2 + P_Gas3 + ... (Sum of Partial Pressures)"
      },
      "1": {
        "goal": "Say how a gas in the mixture pushes compared with the same amount of that gas alone in an identical tank.",
        "science": "Each Gas Alone: A gas in a mixture knocks on the walls exactly as often as it would alone, because the particles are so far apart that they hardly notice one another. That is why the partial pressures simply add.",
        "storyProblem": "Explain why adding a second gas into a habitat tank does not reduce the wall collisions of the first gas.",
        "howToTest": "Watch the particle window: particles of gas A collide with the container walls at the exact same frequency whether gas B is present or absent.",
        "visualFormula": "Independent Particle Collisions: P_A(Mixture) = P_A(Alone in Same Volume at Same Temp)"
      },
      "2": {
        "goal": "Give the fraction of the particles in the tank that are helium.",
        "science": "Mole Fraction: The fraction of the moles in a mixture that belong to one gas is its mole fraction: the moles of the gas over the total moles. The mole fractions in a mixture always add up to one.",
        "storyProblem": "Determine the mole fraction of helium in a breathable deep-dive atmosphere blend containing helium, nitrogen, and oxygen.",
        "howToTest": "Divide the moles of helium by the total moles of all gases in the tank: verify the sum of all fractions equals 1.00.",
        "visualFormula": "Mole Fraction: X_He = n_He / n_total (Where ∑ X_i = 1.00)"
      },
      "3": {
        "goal": "Give the partial pressure of oxygen in the tank, in kilopascals.",
        "science": "Partial Pressure From a Share: The partial pressure of a gas is its mole fraction times the total pressure. A gas that makes up a quarter of the moles makes up a quarter of the push.",
        "storyProblem": "The life support habitat total pressure is 100 kPa. If oxygen makes up 21% of the particles, compute the oxygen partial pressure.",
        "howToTest": "Multiply the mole fraction of oxygen by the total measured pressure on the master gauge.",
        "visualFormula": "Partial Pressure: P_O2 = X_O2 · P_total"
      },
      "4": {
        "goal": "Give the partial pressure of oxygen in the air 5500 m up, in kilopascals.",
        "science": "Thin Air: At altitude the air is the same mixture but its total pressure is lower, so the partial pressure of oxygen falls with it. A climber is short of oxygen because its partial pressure is low, not because its mole fraction has changed.",
        "storyProblem": "A survey team ascends to 5,500 meters where total atmospheric pressure drops to 50 kPa. Explain why breathing becomes difficult even though air is still 21% oxygen.",
        "howToTest": "Calculate P(O₂) = 0.21 × 50 kPa = 10.5 kPa: note that hypoxia occurs because oxygen partial pressure drops by half, not because the percentage changed.",
        "visualFormula": "Altitude Hypoxia: P_O2 = X_O2 · P_atmospheric (Total Pressure Drops ➔ Oxygen Partial Pressure Drops)"
      },
      "5": {
        "goal": "Say what adding argon does to the push of the oxygen already in the tank.",
        "science": "Gases Ignore One Another: A gas that reacts with nothing adds its own partial pressure to the total and leaves every other partial pressure where it was. Each gas in a mixture behaves as if it had the whole tank to itself.",
        "storyProblem": "An engineer injects inert argon gas into a sealed welding bay containing oxygen and nitrogen. Predict the change in oxygen's partial pressure.",
        "howToTest": "Inject argon into the closed tank: observe total pressure rises, but oxygen's collision rate and partial pressure remain completely unchanged.",
        "visualFormula": "Inert Gas Addition (Constant V, T): P_total Increases, but P_O2 Remains Constant"
      },
      "6": {
        "goal": "Put the three gases in the tank in order of partial pressure, largest first.",
        "science": "Moles Decide the Push: At one temperature in one tank, the gas with the most moles has the largest partial pressure, whatever its particles weigh. Light particles knock more often and heavy ones knock harder, and the two balance out.",
        "storyProblem": "Rank three gases in a ballast tank by partial pressure when given their respective mole counts and atomic masses.",
        "howToTest": "Compare mole quantities (n): the component with the greatest number of moles exerts the greatest partial pressure, regardless of particle weight.",
        "visualFormula": "P_i ∝ n_i (Partial Pressure Depends Exclusively on Mole Count, Not Atomic Weight)"
      },
      "7": {
        "goal": "Give the moles of carbon dioxide in the sealed tank.",
        "science": "Counting One Gas: Taking one gas out of a mixture and watching the gauge fall gives that gas's partial pressure, and the gas law turns that into moles. Partial pressures let you count each gas in a tank you cannot see into.",
        "storyProblem": "A chemical scrubber selectively absorbs carbon dioxide from a sealed breathing compartment. Determine moles of CO₂ from the pressure drop.",
        "howToTest": "Record initial and final pressure: the pressure drop ΔP equals P(CO₂). Use n = (ΔP · V) / (R · T) to find moles of scrubbed gas.",
        "visualFormula": "Counting Scrubbed Gas: ΔP = P_CO2 ➔ n_CO2 = (ΔP · V) / (R · T)"
      }
    }
  },
  "q5-speed": {
    "title": "Speed and Escape",
    "concept": "Molecular Speeds, Effusion (Graham's Law) & Diffusion",
    "overview": "Gas particles move at high velocities governed by temperature and mass. Root-mean-square speed is inversely proportional to the square root of molar mass: lighter particles move faster at the same temperature. Graham's law governs effusion through small openings and diffusion across space.",
    "storyline": "High-pressure gas manifolds on Bellows can develop microscopic pinhole leaks or valve seals. By measuring how fast gas escapes through tiny orifices, we can identify hazardous unknown vapors and predict toxic diffusion rates across the decks.",
    "vocab": [
      {
        "word": "Root-Mean-Square Speed (v_rms)",
        "meaning": "The average velocity metric of gas particles: v_rms = √(3RT / M)."
      },
      {
        "word": "Effusion",
        "meaning": "The escape of gas particles through a tiny pinhole into an evacuated chamber."
      },
      {
        "word": "Diffusion",
        "meaning": "The gradual spreading of gas particles through another gas via random molecular collisions."
      },
      {
        "word": "Graham's Law",
        "meaning": "The rate of effusion or diffusion of a gas is inversely proportional to the square root of its molar mass."
      },
      {
        "word": "Mean Free Path",
        "meaning": "The average distance a gas particle travels between successive collisions with other particles."
      }
    ],
    "stages": {
      "0": {
        "goal": "Say what happens to the speed screen as the gas is heated.",
        "science": "Hotter, Faster, Wider: Heating moves the peak of the speed distribution to higher speeds and spreads it out, so a hotter gas has a higher typical speed and a longer tail of very fast particles.",
        "storyProblem": "Heat the gas cylinder and observe how the particle speed distribution profile shifts on the diagnostic monitor.",
        "howToTest": "Raise the temperature: notice the peak of the Maxwell-Boltzmann curve shifts right toward higher speeds and becomes flatter and broader.",
        "visualFormula": "Heating Gas (Higher T): Peak Shifts Right (Higher v_mp) and Distribution Broadens"
      },
      "1": {
        "goal": "Put the three gases in order of the speed of their particles, fastest first.",
        "science": "Lighter, Faster: At one temperature every gas has the same average kinetic energy, so the lighter the particles the faster they move. Speed goes as one over the square root of the molar mass.",
        "storyProblem": "Rank three gases at 300 K from fastest to slowest particle velocity for the pneumatic transfer tube.",
        "howToTest": "Compare molar masses: because KE = ½ m v² is identical at equal temperature, the gas with the lowest molar mass has the highest particle speed.",
        "visualFormula": "Molecular Speed: v_rms = √(3RT / M) ➔ Lower Molar Mass (M) = Higher Average Velocity"
      },
      "2": {
        "goal": "Say roughly how many times more of the particles clear the bar at 227 °C than at 27 °C.",
        "science": "The Fast Tail: Only the fastest particles clear a high bar, and a modest rise in temperature multiplies their number several times over. Where a collision needs a minimum energy to count, it is this tail that does the work.",
        "storyProblem": "A catalyst bed requires particles with activation energy E_a to trigger reaction. See how heating multiplies particles in the high-energy tail.",
        "howToTest": "Raise temperature from 27 °C (300 K) to 227 °C (500 K): observe that the fraction of particles above the threshold energy bar increases exponentially.",
        "visualFormula": "High-Energy Tail: Modest Temperature Rise Dramatically Multiplies Particles Exceeding Threshold Energy (E ≥ E_a)"
      },
      "3": {
        "goal": "Say which gas runs out of its chamber first, and why.",
        "science": "Effusion: A gas leaking through a pinhole is effusing, and the lighter gas effuses faster because its particles move faster and reach the hole more often.",
        "storyProblem": "Helium and nitrogen are placed in twin chambers with identical microscopic pinholes. Determine which chamber empties first.",
        "howToTest": "Open the pinhole shutters simultaneously: observe the lighter helium particles reach the opening much more frequently and escape first.",
        "visualFormula": "Effusion Rate ∝ Collision Frequency with Hole ∝ Particle Speed ∝ 1 / √M"
      },
      "4": {
        "goal": "Give how many times faster hydrogen leaks than oxygen.",
        "science": "Graham's Law: The rate of effusion is inversely proportional to the square root of the molar mass, so hydrogen, about sixteen times lighter than oxygen, leaks four times as fast. This is Graham's law, which goes beyond the exam.",
        "storyProblem": "Calculate the effusion rate ratio of hydrogen gas (M = 2.0 g/mol) versus oxygen gas (M = 32.0 g/mol) through a microscopic hull fracture.",
        "howToTest": "Compute the square root of the inverse molar mass ratio: √(32 / 2) = √16 = 4.",
        "visualFormula": "Graham's Law: Rate₁ / Rate₂ = √(M₂ / M₁) ➔ Rate(H₂) / Rate(O₂) = √(32 / 2) = √16 = 4.0× Faster"
      },
      "5": {
        "goal": "Name the gas in the unmarked chamber.",
        "science": "Naming by Leak: Squaring the ratio of the leak times gives the ratio of the molar masses, so an unknown gas can be named by racing it against a gas whose molar mass is known.",
        "storyProblem": "An unmarked gas cylinder leaks through an effusion pinhole in 200 seconds, while helium leaks in 100 seconds. Identify the unknown gas.",
        "howToTest": "Use Graham's law with leak times: t₁ / t₂ = √(M₁ / M₂). Square both sides to find the unknown molar mass: M_unknown = M_known · (t_unknown / t_known)².",
        "visualFormula": "Identifying Unknown Gas: M_unknown = M_known · (t_unknown / t_known)²"
      },
      "6": {
        "goal": "Say why a smell takes seconds to cross a room when its particles move at hundreds of metres a second.",
        "science": "Diffusion: Particles spread by diffusion, a random walk of collisions: the distance run is large but the distance from the start grows slowly. That is why a gas takes seconds to cross a room its particles could cross in a fraction of a second.",
        "storyProblem": "A technician asks why a scent takes 15 seconds to drift across the hangar deck even though gas particles fly at 500 meters per second.",
        "howToTest": "Trace a particle's trajectory in the simulator: observe millions of collisions per second forcing it into a zigzag random walk that slows net forward progress.",
        "visualFormula": "Diffusion Random Walk: Net Displacement d ∝ √(Number of Steps) << Total Distance Traveled"
      },
      "7": {
        "goal": "Say which gas reaches the far end of its tube first.",
        "science": "The Lighter Gas Arrives First: Spreading is quicker for the lighter gas, as leaking is: ammonia arrives before hydrogen chloride in tubes of equal length. The same square-root relation to the molar mass governs both.",
        "storyProblem": "Ammonia vapor (NH₃, M = 17 g/mol) and hydrogen chloride vapor (HCl, M = 36.5 g/mol) are released into opposite ends of a sealed glass diffusion tube. Determine which reaches the center first.",
        "howToTest": "Observe the diffusion front: lighter ammonia particles diffuse faster and travel further before meeting HCl to form a white ammonium chloride ring.",
        "visualFormula": "Diffusion Rate ∝ 1 / √M ➔ Lighter Gas (NH₃, 17 g/mol) Diffuses Faster than Heavier Gas (HCl, 36.5 g/mol)"
      }
    }
  },
  "q6-real": {
    "title": "Real Gases",
    "concept": "Real Gases vs Ideal Gases (Van der Waals Equation & Intermolecular Forces)",
    "overview": "Real gases deviate from ideal behavior because particles have finite physical volume and exert intermolecular attractions on one another. The compressibility factor Z = PV/(nRT) reveals deviations: Z > 1 when particle volume dominates at high pressure; Z < 1 when attractive forces dominate at low temperatures. The Van der Waals equation corrects both effects.",
    "storyline": "Cryogenic condensation systems and ultra-high-pressure fuel injectors on Bellows push gases to extreme physical limits where the Ideal Gas Law breaks down. To prevent pipeline ruptures and liquefy propellant gases safely, we must account for molecular volume and intermolecular attractions.",
    "vocab": [
      {
        "word": "Real Gas",
        "meaning": "An actual gas whose particles have finite volume and experience intermolecular forces of attraction."
      },
      {
        "word": "Compressibility Factor (Z)",
        "meaning": "The ratio (P · V) / (n · R · T); equals 1.0 for an ideal gas, deviates for real gases."
      },
      {
        "word": "Van der Waals Equation",
        "meaning": "Modified gas equation correcting for molecular attraction (a) and excluded volume (b): (P + a·n²/V²)(V − n·b) = nRT."
      },
      {
        "word": "Intermolecular Attractions",
        "meaning": "Weak forces pulling gas particles toward one another, softening their impacts against container walls."
      },
      {
        "word": "Excluded Volume",
        "meaning": "The physical space occupied by the gas particles themselves that is unavailable for other particles to move in."
      }
    ],
    "stages": {
      "0": {
        "goal": "Say what the reading PV over nRT does as the helium is squeezed into less and less room.",
        "science": "Above One: Squeezed hard, helium reads above one: it pushes harder than the gas law says it should. The law counts on the particles being points, and these are not.",
        "storyProblem": "High-pressure compressors squeeze helium into an ultra-dense storage sphere. Watch how the compressibility factor Z = PV/(nRT) behaves.",
        "howToTest": "Crank the pressure slider upward to hundreds of atmospheres: notice Z rises steadily above 1.00 because helium atoms occupy physical space.",
        "visualFormula": "High-Pressure Real Gas: Z = (P · V) / (n · R · T) > 1.0 (Finite Particle Volume Dominates)"
      },
      "1": {
        "goal": "Say what the size of the particles does to the pressure when the gas is squeezed hard.",
        "science": "Particles Take Room: At high pressure the size of the particles is no longer small next to the space between them. They take room themselves, so the room left to move in is less than the volume, and the pressure comes out higher than the gas law says.",
        "storyProblem": "Explain to the engineering team why real gas pressure exceeds ideal gas predictions at extreme compression.",
        "howToTest": "Examine the container volume: particles themselves occupy volume 'nb', so free volume is (V − nb), resulting in more frequent wall collisions.",
        "visualFormula": "Excluded Volume: Free Volume V_free = (V − n·b) < V ➔ Measured Pressure Higher than Ideal"
      },
      "2": {
        "goal": "Say what PV over nRT does as the carbon dioxide is cooled toward the point where it would condense.",
        "science": "Below One: Cooled toward its condensing point, carbon dioxide reads below one: its pressure is lower than the gas law says. Something other than size is acting on the particles.",
        "storyProblem": "Carbon dioxide gas in the liquefaction pre-cooler is chilled near condensation. Observe the compressibility factor Z.",
        "howToTest": "Lower the temperature dial toward condensation: observe Z dips well below 1.00 as attractive forces pull particles together and soften wall strikes.",
        "visualFormula": "Moderate Pressure / Low Temperature: Z = (P · V) / (n · R · T) < 1.0 (Intermolecular Attractions Dominate)"
      },
      "3": {
        "goal": "Say what the pull between the particles does to a cold gas.",
        "science": "Ideal Gas, Real Gas: A gas of particles with no size and no pull, which the gas law describes exactly, is an ideal gas. Every actual gas is a real gas: it drifts from the law where its particles are crowded, and where they are cold enough to cling a little.",
        "storyProblem": "Explain why chilling a gas reduces wall collision force more than predicted by temperature drop alone.",
        "howToTest": "Inspect particle trajectories at low temperature: particles traveling toward the wall feel the inward pull of neighboring particles behind them.",
        "visualFormula": "Intermolecular Attractions Pull Particles Inward ➔ Softer Collisions on Wall ➔ Lower Measured Pressure"
      },
      "4": {
        "goal": "Put the three gases in order of how far their reading strays from one, furthest first.",
        "science": "Strong Pulls Stray Furthest: Gases whose particles pull harder on one another stray furthest from the gas law: ammonia far more than nitrogen, and helium, whose particles barely attract at all, hardly any.",
        "storyProblem": "Rank ammonia (NH₃), nitrogen (N₂), and helium (He) by their degree of deviation from ideal gas behavior under moderate pressure.",
        "howToTest": "Compare intermolecular forces: polar ammonia has strong dipole-dipole attractions and strays furthest; nonpolar N₂ has moderate dispersion; helium has weakest dispersion and strays least.",
        "visualFormula": "Deviation from Ideal Gas (Furthest to Least): Polar NH₃ (Strong IMFs) > Nonpolar N₂ > Noble Gas He (Minimal IMFs)"
      },
      "5": {
        "goal": "Pick the cylinder whose gas behaves most like an ideal gas.",
        "science": "When a Gas Behaves: A real gas comes closest to ideal at low pressure and high temperature: its particles are far apart and moving too fast for their pulls to matter.",
        "storyProblem": "Identify the operating conditions where gas in a piping system behaves virtually identically to an ideal gas.",
        "howToTest": "Select high temperature (fast motion overcomes attractions) and low pressure (large distance makes particle volume negligible).",
        "visualFormula": "Ideal Gas Conditions: High Temperature (Fast Motion Beats IMFs) & Low Pressure (Large Spacing Ignores Particle Size)"
      },
      "6": {
        "goal": "Say which correction does more to the reading when the gas is cold and only a little squeezed.",
        "science": "The van der Waals Equation: Two corrections turn the gas law into the van der Waals equation: the pull between particles takes pressure off, and the room the particles take puts pressure on. In a cold, roomy gas the pull matters more, and in a hot, crushed one the size does, which goes beyond the exam.",
        "storyProblem": "In a cool, moderate-pressure intake chamber, determine whether the attraction term (a) or the volume term (b) dominates the Van der Waals correction.",
        "howToTest": "Evaluate the two terms in (P + a·n²/V²)(V − n·b) = nRT: when room is large and temperature is low, attraction correction 'a' dominates.",
        "visualFormula": "Van der Waals: (P + a·n²/V²)(V − n·b) = nRT ➔ Cold & Roomy = Attraction 'a'; Hot & Crushed = Volume 'b'"
      },
      "7": {
        "goal": "Say why a real gas can be made into a liquid and an ideal gas never could.",
        "science": "From Gas to Liquid: Where the pull between particles beats their motion, they stay together and the gas becomes a liquid. An ideal gas has no pull, so it could be cooled for ever and stay a gas.",
        "storyProblem": "Explain to the propulsion crew why ideal gas models cannot simulate rocket fuel condensation.",
        "howToTest": "Cool a real gas until kinetic energy drops below the attraction potential well: particles stick together to form liquid droplets. Without attractions, particles would never condense.",
        "visualFormula": "Condensation into Liquid: Requires Intermolecular Attractions (KE_avg < IMF Attraction Well)"
      }
    }
  },
  "boss-compressor": {
    "title": "The Compressor",
    "concept": "Comprehensive Unit 4 Gas Laws Review",
    "overview": "Apply the complete suite of gas laws and kinetic principles to master the pneumatic compressor tower on Bellows: starve intake lines with Boyle's compression, calibrate Charles's thermal expansion heaters, weigh sealed tanks using the Ideal Gas Law, isolate gas mixtures with Dalton's partial pressures, and identify hazardous pinhole leaks using Graham's effusion.",
    "storyline": "The central gas compressor tower on the Cloud Deck is overheating and surging out of control, threatening to vent the station's entire atmospheric reserve over the cloud sea. By applying the gas laws across five diagnostic stages, you will throttle runaway lines, rebalance gas mixtures, and restore safe station pressure!",
    "vocab": [
      {
        "word": "Pneumatic Compression",
        "meaning": "Reducing gas volume to multiply pressure according to Boyle's law."
      },
      {
        "word": "Thermal Expansion",
        "meaning": "Increasing gas volume through heating according to Charles's law."
      },
      {
        "word": "Tank Telemetry",
        "meaning": "Calculating gas mass without breaching hull containment via PV = nRT."
      },
      {
        "word": "Dalton Blend",
        "meaning": "Isolating individual gas components in a mixture via partial pressures."
      },
      {
        "word": "Effusion Pinpoint",
        "meaning": "Identifying unknown escaping gas by comparing leak time ratios via Graham's law."
      }
    ],
    "stages": {
      "0": {
        "goal": "Bring the gauge to four times what it read when the phase began.",
        "science": "Intake Choked: A quarter of the room gives four times the pressure: Boyle's law, with the temperature held. The compressor's intake can be starved by the same law that fills it.",
        "storyProblem": "Compress the runaway intake chamber volume to starve the pressure surge and reach exactly 4× starting pressure.",
        "howToTest": "Use Boyle's law P₁V₁ = P₂V₂: to quadruple the pressure at constant temperature, reduce container volume to one-fourth (¼ V₁).",
        "visualFormula": "Boyle's Compression: P₂ = 4 · P₁ ➔ Set Volume V₂ = ¼ · V₁"
      },
      "1": {
        "goal": "Give the volume the helium fills at 750 K, to the nearest five litres.",
        "science": "Heater Choked: At a steady pressure the volume goes in step with the kelvin temperature, so a volume at a temperature the dial lacks follows from any one it has. The compressor's heater was running to a formula.",
        "storyProblem": "The compressor thermal jacket heats helium to 750 K at constant line pressure. Calculate the final expanded volume.",
        "howToTest": "Use Charles's law V₁/T₁ = V₂/T₂: multiply initial volume by the temperature ratio (750 K / T₁).",
        "visualFormula": "Charles's Expansion: V₂ = V₁ · (T₂ / T₁) = V₁ · (750 K / T₁)"
      },
      "2": {
        "goal": "Give the mass of oxygen in the sealed tank, in grams.",
        "science": "Tank Weighed: The gas law gives the moles in a sealed tank from its gauge, and the molar mass turns the moles into grams. The compressor's tank was weighed without being opened.",
        "storyProblem": "Determine the mass of pure oxygen gas trapped in a sealed auxiliary reservoir using pressure, volume, and temperature telemetry.",
        "howToTest": "Calculate moles n = (P · V) / (R · T), then multiply by oxygen's molar mass (32.00 g/mol for O₂).",
        "visualFormula": "Mass in Sealed Tank: n = (P · V) / (R · T) ➔ Mass m = n · M(O₂) = n · 32.0 g/mol"
      },
      "3": {
        "goal": "Give the partial pressure of helium in the blend, in kilopascals.",
        "science": "Blend Split: Each gas in a blend pushes as if alone, so its partial pressure is its mole fraction times the total. The compressor's blend was read gas by gas.",
        "storyProblem": "A helium-nitrogen blend powers the pneumatic brake lines. Determine the partial pressure of helium in the mixture.",
        "howToTest": "Find the mole fraction of helium X_He = n_He / n_total, then multiply by total line pressure P_total.",
        "visualFormula": "Dalton's Partial Pressure: P_He = X_He · P_total = (n_He / n_total) · P_total"
      },
      "4": {
        "goal": "Name the gas escaping from the unmarked seal.",
        "science": "Compressor Still: Racing an unknown gas against a known one through a pinhole names it: the square of the ratio of the leak times is the ratio of the molar masses. The seal gave the compressor away, and it stands still.",
        "storyProblem": "An emergency relief seal has ruptured and is effusing an unknown gas into the tower. Identify the escaping gas by its effusion leak time.",
        "howToTest": "Compare leak time to known reference gas using Graham's law: M_unknown = M_known · (t_unknown / t_known)², then check periodic table.",
        "visualFormula": "Graham's Effusion Identification: M_unknown = M_known · (t_unknown / t_known)²"
      }
    }
  },
  "q1-recipe": {
    "title": "The Same Recipe",
    "concept": "Definite Proportions, Multiple Proportions & Percent Composition",
    "overview": "Chemical compounds are defined by fixed, unvarying atom ratios (Law of Definite Proportions), unlike mixtures which can blend in any proportion. Adding unbonded atoms merely creates a mixture. The mass of a molecule is the sum of its atomic masses, giving rise to fixed percent composition and empirical formulas.",
    "storyline": "Mineral cargo shipments arriving at the Ligar refining facility claim to be pure chemical compounds for metallurgical processing. Unscrupulous brokers sometimes blend cheaper unbonded filler into the crates. We use the analytical scope and balance to determine fixed recipes, calculate percent compositions, and expose counterfeit compounds!",
    "vocab": [
      {
        "word": "Fixed Composition",
        "meaning": "The constant, unchanging ratio of elements bonded in a specific chemical compound."
      },
      {
        "word": "Law of Definite Proportions",
        "meaning": "A given chemical compound always contains its component elements in fixed ratio by mass."
      },
      {
        "word": "Law of Multiple Proportions",
        "meaning": "When two elements form more than one compound, the mass ratios of the second element are small whole numbers."
      },
      {
        "word": "Percent Composition",
        "meaning": "The percentage by mass of each element in a compound (% = (mass of element / molar mass) × 100%)."
      },
      {
        "word": "Empirical Formula",
        "meaning": "The simplest whole-number ratio of atoms of each element in a compound."
      }
    ],
    "stages": {
      "0": {
        "goal": "Set the tray to the recipe one molecule in these samples is built to.",
        "science": "A Compound Has a Fixed Composition: Three samples from three places at three different sizes, and every molecule in all of them holds the same one CAT 08 and two CAT 01. A compound is not a blend you can mix to taste: it has a fixed composition, the same ratio of elements every time, wherever it came from. That is exactly what makes it a compound and not a mixture.",
        "storyProblem": "Analyze three mineral samples from different mining sites to verify if they share an identical molecular recipe.",
        "howToTest": "Examine molecules across all three samples in the scope: count the exact number of CAT 08 and CAT 01 atoms in each bonded unit.",
        "visualFormula": "Law of Definite Proportions: Every Molecule Shares Exactly 1 CAT 08 : 2 CAT 01 (Fixed Ratio)"
      },
      "1": {
        "goal": "Say which of the two samples is not a compound.",
        "science": "Extra Atoms Make a Mixture: Sample B holds exactly the same molecules as Sample A, plus CAT 01 atoms sitting loose that no molecule would take in. Adding more of one element does not shift a compound to a new recipe; it leaves the extra alongside as a mixture, which is why the shaker found two layers in it. A compound takes exactly as many of each element as its bonds allow and not one more.",
        "storyProblem": "A supplier claims Sample B is an enriched compound. Test both samples in the shaker to see if the extra atoms are bonded or loose filler.",
        "howToTest": "Run the shaker test on both samples: notice Sample B separates into two layers because excess unbonded atoms form a physical mixture.",
        "visualFormula": "Compound vs Mixture: Bonded Molecules Only = Pure Compound; Molecules + Loose Unbonded Atoms = Physical Mixture"
      },
      "2": {
        "goal": "Say how much CAT 08 goes with one CAT 06 in each of the two samples.",
        "science": "Two Compounds, Whole Numbers Apart: The same two elements can make more than one compound, but not any compound at all: for the same one CAT 06, Sample B holds exactly twice the CAT 08 that Sample A does. The ratios always come out as small whole numbers, because there is no such thing as half an atom to put into a molecule. Two different recipes of the same two elements are two different substances.",
        "storyProblem": "Two distinct black oxides are synthesized from CAT 06 and CAT 08. Determine the relative ratio of CAT 08 bonded to CAT 06 in each sample.",
        "howToTest": "Count atoms in both samples: Sample A has 1 CAT 08 per CAT 06, while Sample B has 2 CAT 08 per CAT 06 (small whole-number ratio: 1:2).",
        "visualFormula": "Law of Multiple Proportions: Sample A (1:1 Ratio) vs Sample B (1:2 Ratio) ➔ Ratio of CAT 08 = 2 : 1"
      },
      "3": {
        "goal": "Set the counter to what one whole molecule in this sample weighs.",
        "science": "A Molecule Weighs What Its Atoms Weigh: Adding up the listed mass of every atom in one molecule gives what that whole molecule weighs: 16.0 for the CAT 08 plus 1.0 for each of the two CAT 01 is 18.0. Nothing is lost when atoms bond and nothing is gained. That figure is as fixed for a compound as its recipe is, because it comes straight out of it.",
        "storyProblem": "Calculate the exact molecular mass of a single molecule of the solvent compound to calibrate the electronic balance.",
        "howToTest": "Sum the atomic masses from the catalog: add the mass of one CAT 08 (16.0) and two CAT 01 atoms (1.0 each).",
        "visualFormula": "Molecular Mass = Sum of Atomic Masses: 1 × (16.0) + 2 × (1.0) = 18.0 u"
      },
      "4": {
        "goal": "Work out how much of this sample's weight is CAT 08, out of every hundred.",
        "science": "Percent Composition: The share of a compound's mass that comes from each element is its percent composition, and it falls straight out of the recipe: 16.0 of every 18.0 of mass here is CAT 08, which is 89 percent. Notice how far that is from the share of the ATOMS, which is one in three. Count and weight are two different questions, and a compound answers both with fixed numbers.",
        "storyProblem": "Determine the mass percentage of CAT 08 in the solvent compound for the cargo manifest.",
        "howToTest": "Divide the mass contributed by CAT 08 (16.0) by total molecular mass (18.0) and multiply by 100%.",
        "visualFormula": "Percent Composition: % CAT 08 = (16.0 / 18.0) × 100% = 88.9% (≈ 89%)"
      },
      "5": {
        "goal": "A sealed drum off the vent line runs 3 parts CAT 06 to 8 parts CAT 08 by weight. Pick the recipe it must hold.",
        "science": "The Empirical Formula: Dividing each element's share of the mass by what one of its atoms weighs turns a weight ratio into a count ratio, and reducing that to the smallest whole numbers gives the empirical formula. Three parts CAT 06 to eight parts CAT 08 comes to 0.25 against 0.5, which is one to two. This is how a compound is identified out of a drum nobody can see inside.",
        "storyProblem": "A waste reclamation drum contains 3 parts CAT 06 (mass 12) to 8 parts CAT 08 (mass 16) by mass. Derive its empirical formula.",
        "howToTest": "Convert mass parts to moles: 3 / 12 = 0.25 mol CAT 06; 8 / 16 = 0.50 mol CAT 08. Divide by smallest (0.25) to find mole ratio: 1 : 2.",
        "visualFormula": "Empirical Formula: (3 / 12.0) : (8 / 16.0) = 0.25 : 0.50 = 1 CAT 06 : 2 CAT 08"
      },
      "6": {
        "goal": "File each of the three samples under the recipe it matches.",
        "science": "The Recipe Is the Identity: All three of those samples are mostly CAT 01 and all three look identical at low power, but their recipes are different and so is everything else about them. A compound is named by what it holds and in what ratio, not by what the crate looks like. Two substances with different recipes are never the same substance.",
        "storyProblem": "Three white powder samples look identical under visual inspection. Classify each by its bonded formula.",
        "howToTest": "Analyze the atomic ratios under high power: sort each sample by its exact bonded formula rather than superficial physical appearance.",
        "visualFormula": "Chemical Identity: Unique Element Ratio = Unique Chemical Substance with Distinct Properties"
      },
      "7": {
        "goal": "All three samples are sold as the same compound. Say which of them really are what the label says.",
        "science": "A Recipe Is a Test You Can Run: Sample B held the right molecules with loose CAT 01 alongside them, and Sample C held the same two elements in a different ratio, so neither is what its label says. Counting one molecule settles it either way, because a compound has exactly one recipe and no room to argue. That is the whole reason a formula is worth writing down.",
        "storyProblem": "Audit a merchant's three shipment crates sold under the same compound certificate to identify fraudulent adulterations.",
        "howToTest": "Inspect molecular compositions: reject samples with loose unbonded atoms (mixtures) or wrong stoichiometry (different compounds).",
        "visualFormula": "Purity Audit: Authentic Compound Must Have 100% Matching Molecules with Zero Loose Unbonded Filler"
      }
    }
  },
  "boss-golem": {
    "title": "Recipe Golem",
    "concept": "Limiting Reactants & Conservation of Mass",
    "overview": "Chemical reactions are strictly governed by stoichiometry and mass balance: reactions can only proceed until the limiting reactant is completely consumed, and the total mass of products must equal the total mass of reactants.",
    "storyline": "An automated maintenance automaton—the Recipe Golem—patrols the synthesis yard on Ligar. It synthesizes structural materials by consuming elemental hoppers in strict stoichiometric ratios. By calculating limiting reagent boundaries and enforcing conservation of mass, you will overload its feed controllers and deactivate the construct!",
    "vocab": [
      {
        "word": "Limiting Reagent",
        "meaning": "The reactant that is completely consumed first in a chemical reaction, limiting the amount of product formed."
      },
      {
        "word": "Excess Reagent",
        "meaning": "The reactant present in a quantity greater than necessary to react with the limiting reagent."
      },
      {
        "word": "Law of Conservation of Mass",
        "meaning": "Mass is neither created nor destroyed during a chemical reaction (Mass of Reactants = Mass of Products)."
      },
      {
        "word": "Stoichiometric Yield",
        "meaning": "The calculated maximum amount of product that can be synthesized from given reactant amounts."
      }
    ],
    "stages": {
      "0": {
        "goal": "Enter the maximum number of iron sulfide units the golem can synthesize before starving its limiting reagent.",
        "science": "Intake Starved: The limiting reagent dictates the maximum possible yield. Iron is exhausted after eight units, stalling the golem synthesis feed.",
        "storyProblem": "The golem draws from twin feed hoppers containing 8 iron atoms and 12 sulfur atoms (Fe + S ➔ FeS). Determine how many units it can synthesize before the limiting feed starves.",
        "howToTest": "Compare available reactant counts: each FeS unit requires 1 Fe and 1 S. With only 8 Fe atoms available, iron runs out first, capping total product yield at 8 units.",
        "visualFormula": "Limiting Reactant: 8 Fe + 12 S ➔ 8 FeS (Product Capped by Iron) + 4 S (Excess Remaining)"
      },
      "1": {
        "goal": "Calculate the total mass of water vapor produced in grams when four grams of hydrogen reacts with thirty-two grams of oxygen.",
        "science": "Golem Dispersed: Mass is strictly conserved: four grams of hydrogen plus thirty-two grams of oxygen yields exactly thirty-six grams of water. The pressure valve pops and the golem shuts down.",
        "storyProblem": "The golem's emergency steam venting reaction consumes 4 grams of hydrogen and 32 grams of oxygen (2 H₂ + O₂ ➔ 2 H₂O). Calculate the exact mass of water vapor produced.",
        "howToTest": "Apply the Law of Conservation of Mass: add the masses of all consumed reactants (4 g H₂ + 32 g O₂ = 36 g H₂O).",
        "visualFormula": "Conservation of Mass: Mass Products = Mass Reactants ➔ 4 g H₂ + 32 g O₂ = 36 g H₂O"
      }
    }
  }
};

/**
 * Returns comprehensive chemistry and stage mission information for any quest.
 */
export function getQuestScience(questId, stageIndex, stage) {
  const cleanId = String(questId || '').replace(/^.*\//, '');
  let qg = QUEST_GUIDES[questId] || QUEST_GUIDES[cleanId];

  if (!qg && stage?.title) {
    for (const [qid, guide] of Object.entries(QUEST_GUIDES)) {
      if (guide.title && (guide.title.toLowerCase().includes(stage.title.toLowerCase()) || stage.title.toLowerCase().includes(guide.title.toLowerCase()))) {
        qg = guide;
        break;
      }
    }
  }

  if (!qg) {
    qg = {
      title: stage?.title || 'Chemistry Laboratory',
      concept: 'Chemical Investigation',
      overview: 'Apply scientific reasoning and the scientific method on this bench to explore matter and reactions.',
      storyline: 'The Avalon research division is conducting experimental measurements.',
      vocab: []
    };
  }

  const sg = qg.stages?.[stageIndex] || {};

  // Build plain-English goal if not explicitly authored
  let goal = sg.goal;
  if (!goal) {
    if (stage?.prompt) {
      goal = stage.prompt;
    } else {
      goal = `Complete the scientific challenge for ${stage?.title || 'this stage'}.`;
    }
  }

  // Build science concept summary
  const science = sg.science || qg.concept || 'Chemistry Principles';

  // Build how to explore
  let howToExplore = sg.howToTest;
  if (!howToExplore) {
    const controls = stage?.controls || [];
    const parts = [];
    if (controls.includes('power')) parts.push('Use the Power dial to adjust magnification and view particles');
    if (controls.includes('pour')) parts.push('Use "Tip Sample" to test the sample in the sorter');
    if (controls.includes('balance')) parts.push('Use "Weigh Sample" to measure mass on the scale');
    if (controls.includes('code')) parts.push('Select bins and press "Read Code" to check element IDs');
    if (controls.includes('beam')) parts.push('Use "Fire Beam" to probe internal structure');
    if (controls.includes('field')) parts.push('Toggle views between Whole piece, The middle, and Outside');
    if (controls.includes('meter')) parts.push('Use "Read Needle" to check net electrical charge');
    if (controls.includes('cut')) parts.push('Use "Run Cutter" to test if pieces can be split');
    if (controls.includes('settle')) parts.push('Use "Settle" to shake and let samples settle into layers');
    if (parts.length) {
      howToExplore = `${parts.join('. ')}. Observe the measurements and compare the evidence to your answer choices!`;
    } else {
      howToExplore = 'Use the bench tools to run tests and collect evidence before selecting your answer.';
    }
  }

  const stageStoryProblem = sg.storyProblem || (qg.storyline ? `${qg.storyline} In this stage: ${goal}` : `Expedition challenge: apply ${science} to ${goal.toLowerCase()}`);
  const visualFormula = sg.visualFormula || null;

  return {
    questTitle: qg.title,
    conceptTitle: qg.concept,
    overview: qg.overview,
    storyline: qg.storyline,
    vocab: qg.vocab || [],
    stageGoal: goal,
    stageScience: science,
    stageStoryProblem,
    visualFormula,
    howToExplore
  };
}
