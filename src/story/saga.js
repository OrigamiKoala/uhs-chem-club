/**
 * saga.js — Main storyline spine, acts, clue registry, and world episodes.
 *
 * PURE DATA & LOGIC. Importable in Node, browser, and verifier tools.
 *
 * Governs the 14-world storyline:
 *   - 4 Acts: The Charter, Pressure, Balance, The Core.
 *   - Spine beats played aboard the Avalon in road order.
 *   - Clue registry for the Case File.
 *   - World episode data (arrival, closing, spoil family, clue, boss).
 */

export const ACTS = [
  {
    id: 'act1',
    order: 1,
    title: 'Act I: The Charter',
    worlds: ['unit01', 'unit02', 'unit03'],
    summary: 'Routine surveys uncover mobile spoil and unmarked stencils across frontier extraction zones.'
  },
  {
    id: 'act2',
    order: 2,
    title: 'Act II: Pressure',
    worlds: ['unit04', 'unit05', 'unit06', 'unit07'],
    summary: 'The Fifth recruits active crews as impossible refinery ledgers violate the conservation of mass.'
  },
  {
    id: 'act3',
    order: 3,
    title: 'Act III: Balance',
    worlds: ['unit08', 'unit09', 'unit10', 'unit11'],
    summary: 'Planetary equilibrium falters, unveiling the true title of the Fifth: The Catalyst.'
  },
  {
    id: 'act4',
    order: 4,
    title: 'Act IV: The Core',
    worlds: ['unit12', 'unit13', 'unit14'],
    summary: 'Tracing subatomic thermal plumes to the ancient transmutation works on Cinder Halo.'
  }
];

export const CLUES = {
  clue_erebus_mark: {
    id: 'clue_erebus_mark',
    act: 'act1',
    source: 'Erebus Contract · Pylon 20',
    name: 'Unliveried Stencil',
    summary: 'A weathered delta mark stamped behind the perimeter housing with no guild seal.',
    note: 'The old crew did not just abandon the gardens; they signed the housing before they walked.'
  },
  clue_tallow_slag: {
    id: 'clue_tallow_slag',
    act: 'act1',
    source: 'Tallow Boss · The Hopper',
    name: 'Transmuted Slag',
    summary: 'Refined ore slag from a pure sodium chloride salt pan carrying heavy bismuth.',
    note: 'Bismuth was never in the bedrock. Ordinary chemistry cannot turn sodium into heavy metals.'
  },
  clue_lantern_lens: {
    id: 'clue_lantern_lens',
    act: 'act1',
    source: 'Lanternfall Boss · The Lantern-Eater',
    name: 'Non-Standard Optical Lens',
    summary: 'A precision prism ground for deep ultraviolet frequencies far past guild lamp ratings.',
    note: 'Someone tuned this lens to drive photoelectric emission on metals the guilds leave buried.'
  },
  clue_ligar_scorch: {
    id: 'clue_ligar_scorch',
    act: 'act1',
    source: 'Ligar Elite · Basalt Warden',
    name: 'Arc-Sheared Basalt',
    summary: 'A quarry face cut cleanly through mineral lattices by heat hotter than any smelter torch.',
    note: 'No chemical flame reaches that temperature without melting the quarry cutters.'
  },
  clue_kettle_ledger: {
    id: 'clue_kettle_ledger',
    act: 'act2',
    source: 'Kettle Elite · Recipe Golem',
    name: 'Over-Mass Recipe Ledger',
    summary: 'Refinery accounts where total output mass exceeds reactant inputs by thirty percent.',
    note: 'Every recipe obeys mass balance. If mass is appearing from nowhere, this is not a reaction.'
  },
  clue_bellows_warm: {
    id: 'clue_bellows_warm',
    act: 'act2',
    source: 'Bellows Boss · The Compressor',
    name: 'The Warm Cylinder',
    summary: 'A sealed gas cylinder logged at one pressure for twelve days while the deck froze fifty degrees around it.',
    note: 'A sealed gas that cools must fall in pressure, and this one did not. Something inside was giving off heat, and no chemical reaction does that for twelve days.'
  }
};

export const SPINE_BEATS = [
  {
    id: 'beat_tallow_slag',
    act: 'act1',
    order: 1,
    title: 'The Slag Reading',
    prereq: { bosses: ['unit01/boss-hopper'] },
    speaker: 'VESS // QUARTERMASTER',
    transmission: 'I ran the mass spec on that hopper slag three times. There is bismuth in that salt, and no mine on Tallow ever held a trace of it.',
    onScreen: 'Vess sets a heavy lead-lined specimen tube on the plotting table beside the periodic chart.'
  },
  {
    id: 'beat_guild_inquiry',
    act: 'act1',
    order: 2,
    title: 'The Guild Inquiry',
    prereq: {
      bosses: ['unit01/boss-hopper', 'unit03/boss-warden'],
      contracts: ['contract_erebus_01']
    },
    speaker: 'GUILD ENVOY // COMMS',
    transmission: 'The Four Guilds advise all survey teams to ignore non-standard stencils and mobile spoil. Scavenger groups are fabricating ore anomalies, and your logs are now sequestered.',
    onScreen: 'The Imperial envoy transmission cuts to static. Vess quietly locks the local backup drive.'
  },
  {
    id: 'beat_impossible_ledger',
    act: 'act2',
    order: 3,
    title: 'The Broken Balance',
    prereq: { bosses: ['unit07/boss-golem'] },
    speaker: 'VESS // QUARTERMASTER',
    transmission: 'Kettle’s ledger cannot lie: forty tons of reagent in, fifty-two tons of product out. Someone aboard this hauler has been relaying our coordinates to the Fifth.',
    onScreen: 'The mass ledger glows amber on the bridge terminal, highlighted against stoichiometric balance formulas.'
  },
  {
    id: 'beat_the_catalyst',
    act: 'act3',
    order: 4,
    title: 'The Catalyst',
    prereq: { clues: ['clue_kettle_ledger'] },
    speaker: 'VESS // QUARTERMASTER',
    transmission: 'The Fifth calls itself The Catalyst. They are the survey hands the Guilds wrote off twenty seasons ago, and they survived on the rim.',
    onScreen: 'A personnel manifest unspools across the console, matching casualty lists to active signals.'
  },
  {
    id: 'beat_cinder_halo',
    act: 'act4',
    order: 5,
    title: 'The Core Transmutation',
    prereq: { clues: ['clue_tallow_slag', 'clue_kettle_ledger'] },
    speaker: 'VESS // QUARTERMASTER',
    transmission: 'The thermal signatures lead straight to Cinder Halo. They are not breaking bonds out there; they are splitting and forging the atomic nucleus itself.',
    onScreen: 'The star chart locks onto Cinder Halo, where subatomic decay rings glow against deep space.'
  }
];

export const EPISODES = {
  unit01: {
    worldId: 'unit01',
    worldName: 'Tallow',
    act: 'act1',
    arrival: 'Refinery intake on Tallow has frozen solid. The ore tailings are shifting across the salt flat on their own.',
    closing: 'Tallow sector secured. The hopper has settled into cold slag, but its core composition does not match the basin.',
    spoilFamily: 'Salt husks',
    bossId: 'boss-hopper',
    clueId: 'clue_tallow_slag',
    incident: 'Refinery intake operations on Tallow have frozen solid. Heavy salt tailings and unmetered slag heaps have crystallized and begun crawling across the pans under rogue electromagnetic currents.',
    objective: 'Investigate elemental matter versus mixtures across the six benches. Prove ordinary chemical reactions cannot turn common salt into heavy bismuth, neutralize the animated salt husks, and secure the hopper slag.',
    caseFileNote: 'Mess deck rumors claim the Fifth possesses alchemy. Forensic chemistry proves ordinary chemical reactions cannot transmute elements; the bismuth in the slag came from subatomic intervention.'
  },
  unit02: {
    worldId: 'unit02',
    worldName: 'Lanternfall',
    act: 'act1',
    arrival: 'Lanternfall’s optical beacon road is dark. Photoelectric moths are drinking the filament power along the ice trail.',
    closing: 'Lantern beacons relit across the glacier. The lens salvaged from the swarm was ground for frequencies no guild uses.',
    spoilFamily: 'Lamp moths',
    bossId: 'boss-eater',
    clueId: 'clue_lantern_lens',
    incident: 'The glacial beacon highway across Lanternfall has dropped offline. Swarms of photoelectric lamp moths have clustered along power cables, absorbing filament radiation and grounding transit lights in sub-zero blizzards.',
    objective: 'Calibrate frequencies, quantized energy transitions, and electron orbitals across nine optical benches. Match emission bands to disperse the moths, relight the beacons, and recover the rogue focusing optic.',
    caseFileNote: 'The salvaged prism is ground for deep ultraviolet bands far beyond guild lamps, confirming the Fifth uses high-energy electromagnetic emissions.'
  },
  unit03: {
    worldId: 'unit03',
    worldName: 'Ligar',
    act: 'act1',
    arrival: 'Geothermal vents in the basalt quarry cracked wide. Crystalline wardens have fused across the foundry road.',
    closing: 'Basalt wardens shattered along their cleave planes. The stone was sheared with thermal output beyond any smelter charter.',
    spoilFamily: 'Basalt wardens',
    bossId: 'boss-warden',
    clueId: 'clue_ligar_scorch',
    incident: 'Subterranean seismic shocks cracked geothermal vents across Ligar. Towering basalt wardens and crystalline crawlers have fused into massive barricades across the transport ramps, halting all ore deliveries.',
    objective: 'Exploit ionic, covalent, and metallic lattice structures across nine quarry benches. Test cleave planes, conductivity, and bond polarity to shatter the wardens and clear the road.',
    caseFileNote: 'Quarry cuts show laser-smooth thermal shear through solid rock lattices, exceeding the output of any known industrial smelting torch.'
  },
  unit04: {
    worldId: 'unit04',
    worldName: 'Bellows',
    act: 'act2',
    arrival: 'Skimming pumps on Bellows are stalling under gauge pulses that no pump should make. Gas bladders have swollen across the walkways and are hammering the bulkheads.',
    closing: 'The compressor stands still and the deck pressure holds. In its vault is a sealed cylinder that never cooled.',
    spoilFamily: 'Gas bladders',
    bossId: 'boss-compressor',
    clueId: 'clue_bellows_warm',
    incident: 'Floating skimmers on Bellows are losing altitude. Compressors are seizing under pulses of pressure, and gas bladders swollen tight as drums are buffeting the hull and the walkways between the decks.',
    objective: 'Work six benches of gas laws on the gas rig: what a gauge measures, the four laws, the ideal gas law, partial pressures, speed and escape, and real gases. Settle the bladders, then read the Compressor that is driving every pump at once.',
    caseFileNote: 'A sealed cylinder in the Compressor\'s vault held its pressure for twelve days while the deck froze around it. Gay-Lussac\'s law forbids that unless something inside was giving off heat.'
  },
  unit05: {
    worldId: 'unit05',
    worldName: 'Ember Reach',
    act: 'act2',
    arrival: 'Thermal crucibles on Ember Reach are bleeding heat into dormant bedrock. Slag constructs are absorbing enthalpy against the thermal gradient.',
    closing: 'Blast-wells brought back into thermodynamic balance. Heat drain logs show millions of joules siphoned into deep underground conduits.',
    spoilFamily: 'Slag crucibles',
    incident: 'High-temperature crucibles on Ember Reach are freezing over while dormant perimeter bedrock superheats, defying natural thermodynamic dissipation.',
    objective: 'Calculate enthalpy, entropy, and Gibbs free energy across the smelting benches. Rebalance directional heat transfer to disrupt rogue crucibles and stabilize the blast-wells.',
    caseFileNote: 'Refinery power logs show gigajoules of thermal energy being drawn into deep subterranean conduits toward an unmapped planetary facility.'
  },
  unit06: {
    worldId: 'unit06',
    worldName: 'Mirrowen',
    act: 'act2',
    arrival: 'Cooling canals on Mirrowen have seized into anomalous crystalline lattices. Solid phase spikes are puncturing the intake barges.',
    closing: 'Phase boundaries restored across the shallows. The crystalline residue contains synthetic compounds not found in guild manifests.',
    spoilFamily: 'Brine crawlers',
    incident: 'Industrial coolant canals across Mirrowen’s shallow brine seas have frozen into sharp crystalline lattices at temperatures that should keep them liquid, threatening cooling lines.',
    objective: 'Analyze intermolecular forces, vapor pressures, and phase diagrams. Manipulate dipole interactions and boiling points to melt the crystal barricades and flush the channels.',
    caseFileNote: 'Residue analysis reveals synthetic polar polymers and lubricants identical to equipment abandoned during historic guild pullouts.'
  },
  unit07: {
    worldId: 'unit07',
    worldName: 'Kettle',
    act: 'act2',
    arrival: 'Kettle’s automated cookers are running unmetered. Stoichiometric golems are feeding on unbonded raw stock.',
    closing: 'Golem intake starved of excess reagent. Their command vault yielded a recipe ledger that violates the laws of mass.',
    spoilFamily: 'Recipe golems',
    bossId: 'boss-golem',
    clueId: 'clue_kettle_ledger',
    incident: 'Autonomous synthesis cookers at Kettle have broken lockouts. Recipe golems have overrun the loading gantries, enforcing strict stoichiometric proportions with physical force.',
    objective: 'Master stoichiometric balance, limiting reagents, and percent yield across the hearth benches. Starve the limiting reagents powering the golem horde to shut down their production line.',
    caseFileNote: 'The seized logistics ledger records output masses exceeding reactant inputs by thirty percent—a physical impossibility under chemical conservation laws.'
  },
  unit08: {
    worldId: 'unit08',
    worldName: 'Teeter',
    act: 'act3',
    arrival: 'Buffer tanks across Teeter are violently rocking out of dynamic equilibrium. Chemical balances are swinging wildly along the gantry.',
    closing: 'Dynamic equilibrium re-established in the synthesis vats. Shift logs show intentional reactant stress designed to mask diverted product.',
    spoilFamily: 'Balance husks',
    incident: 'High-capacity buffer tanks along the Teeter balance gantry are oscillating out of control. Runaway reverse reactions threaten catastrophic pressure bursts across the refinery.',
    objective: 'Calculate equilibrium constants and apply Le Chatelier’s principle across the synthesis vats. Counter external stress to force reactions back into stable dynamic equilibrium.',
    caseFileNote: 'System stress logs show automated bleed valves deliberately destabilized equilibrium to mask covert diversions of refined reagents.'
  },
  unit09: {
    worldId: 'unit09',
    worldName: 'Verdigris',
    act: 'act3',
    arrival: 'Containment dikes on Verdigris are corroding under concentrated proton floods. Acidic spoil is eating through the station pilings.',
    closing: 'Leach basins buffered and stabilized against corrosion. The acid was weaponized using extraction formulas abandoned thirty seasons ago.',
    spoilFamily: 'Caustic leaches',
    incident: 'Tailings containment dikes on Verdigris have breached. Hyper-acidic proton floods are eating through station support pilings and threatening structural collapse.',
    objective: 'Measure hydronium concentrations, pH scales, and run precision titrations. Formulate chemical buffers to neutralize the acid floods and preserve station pilings.',
    caseFileNote: 'Chemical signatures match extraction formulas issued to guild survey crews left behind during corporate abandonment thirty seasons ago.'
  },
  unit10: {
    worldId: 'unit10',
    worldName: 'Brinewire',
    act: 'act3',
    arrival: 'Galvanic storage banks on Brinewire have been drained to zero potential. Parasitic electrochemical conduits are siphoning the entire grid.',
    closing: 'Power grid repolarized across the copper marsh. The tap lines lead toward a high-voltage relay pointing out-system.',
    spoilFamily: 'Galvanic ticks',
    incident: 'Deep electrochemical storage banks across Brinewire have collapsed to zero potential. Parasitic redox organisms have tapped the circuits, draining navigation power across the sector.',
    objective: 'Split and balance redox half-reactions, build galvanic cells, and compute cell potentials. Repolarize the circuit to drive electrolysis and burn out parasitic taps.',
    caseFileNote: 'Tracing the tapped power lines reveals massive copper conduits buried beneath the silt, channeling terawatts of electricity toward the outer rim.'
  },
  unit11: {
    worldId: 'unit11',
    worldName: 'Quicklight',
    act: 'act3',
    arrival: 'Atmospheric cracking towers on Quicklight are detonating in uncontrolled kinetic cascades. Reaction rates have spiked a thousandfold without heat.',
    closing: 'Reaction cascades suppressed by removing the foreign additive. The mysterious fifth presence is formally identified: The Catalyst.',
    spoilFamily: 'Kinetic flares',
    incident: 'Cracking towers on Quicklight are detonating in uncontrolled kinetic cascades. Stable reactions are completing in fractions of a second with no increase in thermal energy.',
    objective: 'Determine reaction orders, rate laws, and activation energies. Isolate the foreign additive lowering the barrier to halt runaway flashovers.',
    caseFileNote: 'The breakthrough: the substance lowering activation barriers without being consumed defines a catalyst. The Fifth’s true title is uncovered: The Catalyst.'
  },
  unit12: {
    worldId: 'unit12',
    worldName: 'Lodestone',
    act: 'act4',
    arrival: 'Magnetic fields across Lodestone are twisting navigation gyros into dead loops. Colored transition metal complexes are focusing orbital beams.',
    closing: 'Magnetic lattice array neutralized and decoded. Deep-space telemetry vectors lock onto the exclusion zone at Cinder Halo.',
    spoilFamily: 'Coordination sentinels',
    incident: 'Ferromagnetic canyons on Lodestone are projecting electromagnetic vortexes that disable ship thrusters. Crystalline transition metal complexes are focusing high-gain communications beams.',
    objective: 'Analyze d-orbital split geometries, coordination complexes, and magnetism across the canyon benches. Neutralize the crystal nodes to decode the transmission vector.',
    caseFileNote: 'Decrypted coordinates reveal the target of the stolen fuel and power conduits: the uncharted exclusion zone of Cinder Halo.'
  },
  unit13: {
    worldId: 'unit13',
    worldName: 'Thornmere',
    act: 'act4',
    arrival: 'Synthesis vats on Thornmere are spinning dense polymer armor across the fen. Organic hydrocarbon carapaces are repelling all salvage gear.',
    closing: 'Hydrocarbon polymers depolymerized at their functional bonds. The armor was built to shield human crews from heavy neutron flux.',
    spoilFamily: 'Polymer carapaces',
    incident: 'Automated synthesis vats in Thornmere’s tar pools have woven impenetrable polymer carapaces over the outposts, repelling mechanical cutters.',
    objective: 'Identify hydrocarbon chains, functional groups, and structural isomers. Synthesize targeted depolymerization reagents to dissolve the protective carapaces.',
    caseFileNote: 'Material analysis reveals the hydrocarbon armor contains boron doping, designed specifically to shield living crews from neutron radiation.'
  },
  unit14: {
    worldId: 'unit14',
    worldName: 'Cinder Halo',
    act: 'act4',
    arrival: 'Thermal plumes from Cinder Halo are radiating heat with no chemical flame. The forgotten crews have ignited the ancient subatomic core.',
    closing: 'The transmutation core brought under stable containment. The truth of the abandoned manifests is finally exposed to the fleet.',
    spoilFamily: 'Transmutation core',
    incident: 'The journey ends at Cinder Halo, where ancient subatomic transmutation reactors have been reignited. Abandoned guild crews are splitting and forging raw matter to survive on the rim.',
    objective: 'Confront the boundary where chemistry meets subatomic physics. Measure nuclear decay rates, mass defect, and binding energy to stabilize the reactor and broker peace with The Catalyst.',
    caseFileNote: 'The resolution: The Catalyst is composed of the forgotten workers written off by the Imperial Guilds. Mastery of chemistry exposes the truth and saves the crews.'
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


