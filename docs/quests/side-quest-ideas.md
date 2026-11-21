# Side Quest Ideas

Candidate ideas for future Avalon side quests (paid Contracts like Quest 1, The Charge Gardens of Erebus).

## Shared Bar

Every side quest is built so **everyone has fun—from complete beginners (ages 12–17) to Chemistry Olympiad competitors**:

- **Outside AP & Chemistry Olympiad curricula:** explores real chemistry beyond standard AP Chemistry and Chemistry Olympiad (USNCO/IChO) syllabi—soft matter, materials science, supramolecular chemistry, nanotech, photochemistry, biophysical folding, nonlinear systems—so experienced students encounter genuinely new science alongside beginners.
- **Zero prior chemistry assumed:** no memorized symbols, no formulas, no arithmetic beyond counting.
- **Plain, direct language:** real chemistry terms glossed simply where first needed—no wacky euphemisms, cutesy nicknames, or anthropomorphic atom motives (`PRODUCT.md` Principle 1).
- **Physical rule as mechanic:** a 5-second verb where playing well *is* applying the chemistry rule (not a reskinned block puzzle).
- **Three-movement curve:** Movement 1 teaches the base rule; Movement 2 introduces a twist where the base rule alone fails; Movement 3 combines rules into multi-step puzzles.
- **Own walkable 3D world** with visible progress on the ground and a full `3D Off` twin.

---

## Ideas Fitting Sealed Contract Board Slots

These three map directly to the sealed postings currently listed in `src/screens/contracts.js`, using non-AP / non-Olympiad chemistry.

### 1. The Deep Vent Rig (`CON-04`) — Amphiphile Self-Assembly, Packing Geometry & Marangoni Flow

- **Setting / Guild:** Thalassa Deep Rig (Moisture Extraction / Water).
- **Core verb:** Choose amphiphile molecules with different head-to-tail shapes (cone, cylinder, or wide-tail wedge) and drop surfactants onto brine–oil interfaces to build self-assembling capsules, seal leaks, or steer slicks across fluid tanks.
- **3-movement arc:**
  1. **Molecular shape sets the architecture:** Drop amphiphiles into water; cone-shaped molecules (wide head, narrow tail) curve into tight spherical micelles, while cylinder-shaped molecules (matched head and tail) assemble into flat bilayers and hollow vesicles that encapsulate cargo.
  2. **The twist — inverted curvature & Marangoni pull:** Swapping to narrow-head, bulky-tail wedges curves the layer *backward* into inverted water-in-oil traps; meanwhile, dropping surfactant on one side of a floating slick lowers local surface tension so the higher-tension side pulls the film away (Marangoni flow).
  3. **Salt-triggered shape switching:** Adding salt screens electrostatic repulsion between charged heads, shrinking effective head size and flipping spheres into worm-like tubes or bilayers on command to haul and release cargo across oil–water barriers.
- **Concepts covered:** Amphiphile packing parameter, self-assembly (micelles, bilayers, vesicles, inverted phases), Marangoni surface-tension flow, and electrostatic headgroup screening.

### 2. The Siphon Drift (`CON-02`) — Cloud Nucleation, Kelvin Curvature & Ostwald Ripening

- **Setting / Guild:** Zephyr League (Atmospheric Harvesters / Air).
- **Core verb:** Seed supersaturated vapor chambers with dust, salt, and ice-nucleating particles of different sizes and wetting properties to condense water on demand, grow harvestable rain droplets, or clear blinding fog.
- **3-movement arc:**
  1. **Nucleation seeds beat clean air:** Pure supersaturated vapor refuses to condense on its own because microscopic droplets have high surface curvature and immediately evaporate (Kelvin effect); dropping solid seed particles gives vapor a flatter surface to start growing.
  2. **The twist — Ostwald ripening (big eats small):** Over-seeding a chamber creates thousands of tiny fog droplets that never fall; large droplets have lower vapor pressure than tiny ones, so vapor steadily migrates off small droplets onto bigger ones—meaning *fewer*, well-spaced hygroscopic seeds yield faster rain than flooding the chamber.
  3. **Ice-crystal scavenging (Bergeron process):** In sub-zero clouds, ice crystals hold water more tightly than supercooled liquid droplets; injecting a few ice-nucleating mineral grains lets ice crystals pull vapor straight off surrounding liquid droplets and grow into heavy hail or snow.
- **Concepts covered:** Heterogeneous nucleation, Kelvin curvature effect, hygroscopic aerosols, Ostwald ripening, supercooled clouds, and the Wegener–Bergeron–Findeisen process.

### 3. Cinder Gate Purge (`CON-03`) — Supercooling, Glass Transition & Zone Refining

- **Setting / Guild:** Ignis Foundry (Thermal Smelters / Fire).
- **Core verb:** Sweep a narrow mobile heater ring, cooling jets, and seed crystals along a molten 3D mineral rod to control whether atoms lock into a crystal, freeze into disordered glass, or push impurities out one end.
- **3-movement arc:**
  1. **Cooling speed decides crystal vs. glass:** Cooling slowly gives atoms time to settle into an ordered crystal; quenching rapidly freezes them in place as disordered *glass* (no crystal grain boundaries, totally different strength and clarity).
  2. **The twist — supercooling & nucleation fronts:** A pure melt cooled below its freezing point stays stubbornly liquid until you touch it with a seed crystal or surface nick, triggering a fast crystallization wave that releases stored heat as it sweeps the bar.
  3. **Zone refining:** Impurity atoms fit poorly inside a growing crystal lattice and stay in the liquid slice; sweeping a narrow molten zone slowly down the rod snowplows impurities to the far end, leaving an ultra-pure single-crystal ingot behind.
- **Concepts covered:** Nucleation barriers, supercooling, glass transition (amorphous vs. crystalline solids), crystal growth fronts, impurity segregation, and zone refining.

---

## Fresh Original Concepts

### 4. The Link Loom — Polymer Physics, Cross-Linking & Viscoelasticity

- **Core verb:** Feed 2-bond monomers, 3-bond cross-linkers, flexible/rigid units, and chain-terminating caps into a 3D loom to weave a hull patch that survives live slow-pull, fast-impact, bend, or heat tests.
- **3-movement arc:**
  1. **Chain length & entanglement:** Short chains slide apart and tear under tension; long chains tangle (reptation) and hold together—yet still creep slowly if pulled gently.
  2. **The twist — melting vs. brittleness:** Unlinked chains soften and melt under heat, so you add 3-bond cross-linkers to tie chains into a network—but too many cross-links make the network rigid and brittle so it snaps when bent.
  3. **Viscoelasticity & tuning:** Combine flexible and rigid segments, controlled cross-link density, and chain caps to build materials that flex under slow loads yet stiffen on sudden impact, hitting target elasticity and heat resistance.
- **Concepts covered:** Chain entanglement and reptation, cross-link density, glass transition in polymers, thermoplastics vs. thermosets, elastomers, and viscoelasticity.

### 5. The Fold Dock — Protein Folding, Hydrophobic Collapse & Chaperones

- **Core verb:** Arrange water-attracted (polar) and water-avoiding (nonpolar) segments along a flexible 3D chain and route it through water or shielded cages so it collapses into a working 3D pocket without clumping into a tangle.
- **3-movement arc:**
  1. **Hydrophobic collapse:** In water, nonpolar segments tuck inward while polar segments face the water; pattern the sequence so the chain naturally folds into the target 3D binding pocket.
  2. **The twist — kinetic traps & clumping:** A long chain with exposed sticky nonpolar patches gets stuck in a misfolded knot or glues onto neighboring chains (aggregation). Route it into an isolated **chaperone chamber** that unfolds and shields one chain at a time so it folds cleanly.
  3. **Allosteric switches:** Build a two-state folded hinge where a small signal molecule docking at a *distant* side pocket shifts the 3D backbone to open or close the main working site.
- **Concepts covered:** Hydrophobic collapse, native vs. misfolded states, kinetic folding traps, protein aggregation, molecular chaperones, and allostery.

### 6. The Nematic Lens — Liquid Crystals, Polarization & Chiral Pitch

- **Core verb:** Comb alignment grooves onto glass plates and switch local electric fields across rod-shaped molecules so light passing through crossed polarizing filters twists through the stack—or gets blocked.
- **3-movement arc:**
  1. **Groove alignment & light twisting:** Rod-shaped molecules line up along rubbed surface grooves; setting the top and bottom grooves at 90° twists the stack into a spiral that rotates polarized light straight through crossed filters.
  2. **The twist — field untwisting:** Switching on an electric field stands the rods upright along the field, erasing the spiral so light no longer twists and the cell snaps dark—letting you build optical shutters and signal gates.
  3. **Chiral pitch & structural color:** Mixing in handed (chiral) dopant rods locks in a tight natural helix whose pitch reflects one specific color of light—shifting color with temperature unless topological defects scramble the alignment.
- **Concepts covered:** Nematic and cholesteric liquid crystals, optical anisotropy, twisted-nematic light valves (LCDs), topological defects, and helical structural color.

### 7. The Pore Sieve — Zeolites, MOFs & Shape-Selective Catalysis

- **Core verb:** Assemble 3D nanoporous frameworks from metal corner nodes and organic strut linkers of different lengths, then flow mixed molecular streams through the tunnels to trap or convert only one specific molecular shape.
- **3-movement arc:**
  1. **Molecular sieving:** Strut length sets the exact window width of a 3D cage; build a pore wide enough for straight chains to pass through while bulky branched molecules bounce off outside.
  2. **The twist — product-shape selectivity:** Two isomers can enter a wide internal cavern and react into both bulky and slim products, but only the slim product fits back out the narrow exit tunnel—forcing bulky products to rearrange inside until they escape.
  3. **Breathing frameworks & gate-opening:** Flexible framework hinges stay collapsed at low pressure and swing open only when a specific guest molecule matches the internal wall interactions, selectively capturing one target from mixed exhaust.
- **Concepts covered:** Metal–Organic Frameworks (MOFs) and zeolites, reticular pore tuning, molecular sieving, product-shape-selective catalysis, and flexible "breathing" crystals.

### 8. The Ratchet Track — Molecular Machines & Brownian Ratchets

- **Core verb:** Thread rings onto molecular axles fitted with switchable blocker stations and flash light or chemical pulses in sequence to walk a ring one-way along a track despite constant random thermal shaking.
- **3-movement arc:**
  1. **Random shaking goes nowhere:** At the molecular scale, thermal jiggling (Brownian motion) kicks rings equally forward and backward; unblocked tracks or symmetric pushes yield zero net travel.
  2. **The twist — information ratchets:** Flash light pulses to toggle station stickiness and raise or lower bulky gate groups *in sequence*—waiting for a random forward hop and snapping the gate shut behind the ring so thermal motion drives one-way progress.
  3. **Molecular muscles & cargo walkers:** Synchronize interlocked rings sliding past each other to contract a molecular cable, or step a two-footed walker hand-over-hand across a branching track without letting both feet detach at once.
- **Concepts covered:** Brownian motion, rotaxanes and catenanes, Brownian/information ratchets, photo-switching, and synthetic molecular motors.

### 9. The Click-Snap Bay — Bioorthogonal Click Chemistry & Self-Healing Vitrimers

- **Core verb:** Tag specific targets inside a crowded reactive fluid using selective lock-and-key "click" connectors—and weave reversible dynamic bonds into cracked hull panels so they heal seamlessly under gentle heat.
- **3-movement arc:**
  1. **Selective snapping in a crowd:** Ordinary reactive groups stick randomly to everything in a cluttered soup; pair orthogonal click connectors that ignore bystanders and lock cleanly only onto their matching partner.
  2. **The twist — strain-promoted snapping:** Early click pairs need a copper catalyst that damages sensitive zones; swap to a bent, spring-loaded ring connector whose built-in ring strain drives the snap on contact with zero catalyst.
  3. **Reversible dynamic networks (vitrimers):** Permanent click locks cannot repair a cracked panel; replace a fraction of permanent cross-links with bond-swapping dynamic links so warming a crack lets broken chains trade partners and weld back together without melting the panel.
- **Concepts covered:** Click chemistry, bioorthogonality, strain-promoted reactions (SPAAC), dynamic covalent chemistry, and self-healing vitrimers.

### 10. The Belousov Basin — Chemical Oscillators & Reaction–Diffusion Patterns

- **Core verb:** Couple fast self-amplifying (activator) steps with slower shut-off (inhibitor) steps inside a shallow 3D dish and tune their spread speeds to create pulsing chemical clocks, traveling waves, and self-forming stripes or spots.
- **3-movement arc:**
  1. **Feedback builds a clock:** Ordinary reactions run one way and stop. Pairing a fast self-amplifying reaction with a delayed inhibitor makes the dish pulse rhythmically between two states with no external timer.
  2. **The twist — diffusion speed makes Turing patterns:** When activator and inhibitor spread at the same speed, waves wash out evenly; making the *inhibitor* diffuse faster than the *activator* locks the dish into sharp, stationary spots or stripes.
  3. **Colliding waves & chemical logic:** Unlike light or water waves, chemical excitation waves annihilate on collision; place narrow channels and obstacles in the dish to steer wave fronts into working timers and logic switches.
- **Concepts covered:** Autocatalysis, chemical oscillators (Belousov–Zhabotinsky reaction), reaction–diffusion systems, Turing patterns, and excitable media.

### 11. The Phosphor Vault — Photochemistry, Triplet Traps, FRET & Upconversion

- **Core verb:** Aim colored light beams into 3D dye crystals and position donor/acceptor molecules at precise nanometer spacings to shift wavelengths, store delayed glow, or fuse two weak red photons into one strong blue photon.
- **3-movement arc:**
  1. **Stokes shift (down-conversion):** Absorbed light loses a bit of energy to molecular vibration before re-emitting, so a single dye always shifts light to a lower-energy color (blue to green or red), never higher.
  2. **The twist — triplet traps & nanoscale energy relays (FRET):** Route excitation into a long-lived trapped state (phosphorescence) to hold glow after the lamp shuts off, or place an acceptor dye nanometers away so energy hops directly without emitting light—cutting off sharply if spaced slightly too far.
  3. **Photon upconversion:** Pack two long-lived excited molecules so they collide and pool their energy onto one partner, emitting a *higher-energy* blue photon from two low-energy red photons to trigger a sensor behind a red-only filter.
- **Concepts covered:** Fluorescence vs. phosphorescence, Stokes shift, intersystem crossing (triplet states), Förster resonance energy transfer (FRET), and triplet–triplet annihilation upconversion.

### 12. The Wetting Plate — Superhydrophobicity, Wetting States & Gecko Dry Adhesion

- **Core verb:** Sculpt microscopic 3D pillars, mushroom overhangs, and chemical coatings on hull plates to make water bead and roll off, repel oily liquids, or grip and peel dry surfaces cleanly.
- **3-movement arc:**
  1. **Flat coatings hit a ceiling:** Water spreads flat on high-energy polar plates and beads modestly on waxy coatings, but flat chemistry alone cannot make droplets roll cleanly off shallow tilts.
  2. **The twist — air-cushion pillars vs. pinned collapse:** Carving microscopic pillars into a waxy plate traps air pockets under the drop so it rolls like a marble (Cassie–Baxter state)—*unless* high impact pressure or oil pushes liquid down between the pillars (Wenzel state), pinning it even stickier than a flat plate.
  3. **Re-entrant overhangs & directional dry grip:** Add mushroom-shaped overhang pillars to suspend even low-surface-tension oils (omniphobic surfaces), and angle split micro-fibers so pulling one way multiplies tiny contact attractions (gecko adhesion) while peeling the other way detaches smoothly.
- **Concepts covered:** Surface energy and contact angle, Cassie–Baxter vs. Wenzel wetting states (Lotus effect), re-entrant omniphobic textures, and van der Waals dry adhesion.

### 13. The Carbon Mesh — Graphene Curvature Defects, Nanotube Chirality & Intercalation

- **Core verb:** Roll flat hexagonal carbon sheets along different angles, swap in 5-sided or 7-sided ring defects to curve the mesh into domes or saddles, and slide guest atoms between stacked layers to tune strength and conductivity.
- **3-movement arc:**
  1. **Ring defects build 3D curvature:** Pure 6-sided hexagons stay flat; inserting 5-sided pentagons bends the mesh inward into cones and closed domes (fullerenes), while 7-sided heptagons flare it outward into saddles and smooth tube junctions.
  2. **The twist — rolling angle decides metal vs. semiconductor:** Rolling the exact same hexagonal sheet straight across ("armchair") creates a conducting wire, whereas rolling it at a slight twist ("chiral" nanotube) opens an electronic gap—turning identical carbon bonds into either a conductor or a semiconductor purely by roll geometry.
  3. **Intercalation & welded junctions:** Slide lithium or potassium atoms between stacked graphene sheets to pry layers apart and store charge, or weld different tubes together using paired 5–7 ring defects to build nanoscale diodes.
- **Concepts covered:** Graphene, fullerenes, topological curvature defects (pentagons/heptagons), carbon nanotube chirality (metallic vs. semiconducting), and layer intercalation.

### 14. The Quasicrystal Floor — Aperiodic Tilings & Auxetic Molecular Metamaterials

- **Core verb:** Tile 3D molecular framework units with non-repeating 5-fold symmetry or hinged re-entrant struts, then stretch, compress, or strike the lattice to resist cracking or expand sideways under tension.
- **3-movement arc:**
  1. **Non-repeating order stops cracks:** Repeating crystal grids contain straight cleavage planes where cracks zip clean through; tiling two matching molecular units in a non-repeating 5-fold pattern (quasicrystal) stays tightly ordered with no straight slip planes.
  2. **The twist — pulling makes it wider (auxetics):** Ordinary frameworks get thinner when stretched; wiring hinged inward-pointing (re-entrant) struts makes the whole 3D lattice *expand sideways* when pulled—wedging tighter into a breach under tension instead of slipping out.
  3. **Bistable snap-through frames:** Combine stiff and flexible molecular hinges into a 3D frame that snaps cleanly between two locked geometries (stowed vs. expanded shield) without breaking a single bond.
- **Concepts covered:** Quasicrystals and aperiodic order, cleavage planes, auxetic materials (negative Poisson's ratio), and bistable mechanical metamaterials.

### 15. The Shear Vat — Non-Newtonian Colloids, Shear-Thickening & Gel Jamming

- **Core verb:** Mix suspended micro-spheres, aligned rods, and salt into a fluid damper chamber, then test it against slow steady pushes versus sudden high-speed impacts.
- **3-movement arc:**
  1. **Flow slow, jam fast:** Sparse spheres flow easily at any speed; pack spheres just below the jamming threshold and slow motion lets liquid lubricate around them, while a sudden slam locks the spheres into rigid force chains (shear-thickening armor).
  2. **The twist — shear-thinning & yield stress:** Swap spheres for weak gel networks or aligned rods that stay solid at rest (holding heavy ore suspended without settling), then thin out and flow smoothly the instant a pump shears them.
  3. **Electrostatic repulsion vs. salt-triggered gelling:** Charged colloid particles stay smoothly dispersed because they repel one another; adding multivalent salt screens that repulsion so particles clump into a load-bearing gel network on command.
- **Concepts covered:** Colloidal suspensions, shear-thickening and jamming, shear-thinning and yield stress, thixotropy, and DLVO electrostatic stabilization vs. flocculation.

### 16. The Strand Rig — DNA Origami & Toehold Strand Displacement

- **Core verb:** Clip short complementary "staple" strands onto a long flexible scaffold loop so matching base-pair addresses pull distant sections together, folding a loose strand into a rigid 3D box, truss, or triggered lock.
- **3-movement arc:**
  1. **Addressable staples fold the scaffold:** Each short staple matches two distant addresses on the long loop; placing the right staples pinches the floppy strand into a rigid 2D or 3D frame.
  2. **The twist — sequence crosstalk & misfolded knots:** If two staple addresses are too similar, staples grab the wrong spot and crumple the scaffold into a tangle; you must assign non-overlapping addresses and avoid accidental self-folding hairpins.
  3. **Toehold strand displacement:** Leave a short exposed overhang ("toehold") on a locking staple; adding a matching key strand grabs the overhang and peels the old staple off step-by-step, popping the 3D cage open on cue to release cargo.
- **Concepts covered:** Programmable self-assembly, DNA origami (scaffold and staple design), sequence orthogonality, and toehold-mediated strand displacement.
