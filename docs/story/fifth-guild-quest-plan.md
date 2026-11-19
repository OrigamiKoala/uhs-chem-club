# The Fifth Guild — Low-Text Quest Integration Plan

**Status:** Implemented (2026-11-19). All 6 code/doc workstreams below are complete and verified via `verify:story`, `verify:learn`, `verify:stages`, and world verifiers.

**Goal:** Make every quest in Avalon feel like part of one clear, grounded investigation into the **Fifth Guild**—using **video-game-level text** (short, punchy, visual) and **zero vague jargon** so the story pulls the player forward without ever getting in the way of learning chemistry.

---

## 1. Diagnosis: Why the Current Story Feels Disconnected *and* Confusing

Auditing `src/story/saga.js`, `src/learn/engine/stage-story.js`, `src/story/quest-story.js`, and user playtest feedback (`docs/feedback-11-15.md`) reveals four specific problems:

1. **Two conflicting stories in the same game.**
   - `saga.js` uses a cartoon-action tone (*"walking machines made of salt"*, *"robotic soldiers"*, *"giant magnetic cannon"*, *"military-grade synthetic fluid"*).
   - `stage-story.js` and `quest-story.js` use a dry lab-audit tone (*"The Fifth called the water acid and measured nothing"*, *"The Fifth filed these pans as finished"*).
   - Players bounce between fighting sci-fi supervillains and grading sloppy lab reports.
2. **Unexplained nouns and vague terminology.**
   - Stages drop objects the player was never shown: *"grey powder"*, *"the cutter"*, *"the records tent's board"*, *"the sluice"*, *"the pan"*, *"the Fifth's hand"*, *"sealed canister with lost papers"*. When a student doesn't know what the object is, the story actively blocks the chemistry.
3. **Contrived Fifth Guild excuses on foundational quests.**
   - Example: Lanternfall `q5-numbers` says *"The Fifth scrambled the records tent's board."* Why would raiders sneak into a tent to scramble quantum numbers? Contrived hooks break immersion instantly.
   - Units 8–10 (Teeter, Verdigris, Brinewire) repeat the same weak pattern (*"The Fifth said X; Vess wants to check"*), which makes the Fifth sound incompetent rather than mysterious.
4. **Too much text, and vague `Filed:` lines.**
   - Each world has an `arrival`, 3 full `paragraphs`, an `incident`, an `objective`, a `closing`, and a `caseFileNote`—plus per-quest leads, multi-beat debriefs, and `Filed:` lines.
   - Most `Filed:` lines just restate the textbook definition (*"Filed: elements, mixtures and compounds all come down to how atoms sit together"*) instead of giving a real clue.

---

## 2. Design Rules for the Rewrite

### Rule A — Strict Video-Game Text Budget
Cut ~65% of current story prose:
- **World arrival (1 line, ≤15 words):** State the single weird thing happening here. *Delete* the 3-paragraph `EPISODES.paragraphs` walls.
- **Quest hook (1 line, ≤12 words, Stage 1 only):** Name a concrete thing the player can see on the bench or in the world. Never introduce an unseen prop.
- **Case Pin (replaces `Filed:`, ≤10 words):** A short stamp pinned to the Case Board when a quest ends—only on quests that actually produce a clue or unlock the next step. (No `"Filed:"` prefix.)
- **Debrief animations:** Keep visual-first, 1 short plain sentence per beat, no forward spoilers.

### Rule B — Plain, Concrete Nouns Only
| Retire (vague / unintroduced) | Use instead (concrete / visible) |
|---|---|
| grey powder, the cutter, the spoil | salt chunk, metal scrap, sample |
| the ledger, the manifest, records board | shipping log, crate label, chart |
| the sluice, the pan, the siphon | drain valve, salt tank, heat pipe |
| the Fifth's hand, unliveried stencil | triangle mark, Fifth Guild stamp |
| *"The Fifth said X and never measured it"* | State what the Fifth *built*, *stole*, or *left behind* |

### Rule C — Four Honest Quest Roles (Never Force a Contrived Plot)
Every quest is tagged with one of four roles so foundational math/theory benches are never saddled with fake spy plots:
1. **`Direct Clue`** — The bench directly tests physical evidence left by the Fifth.
2. **`Station Fix`** — The Fifth damaged or hijacked local hardware; the chemistry fixes it.
3. **`Toolkit`** — A pure skill/concept bench needed before the next clue or fix. Gets a clean, honest 1-line practical hook (*"Calibrate the spectrometer before testing the Fifth's sample"*)—never a contrived villain excuse.
4. **`Boss Payoff`** — Combines the world's chemistry to shut down the Fifth's local rig and claim the world's main Case Board clue.

### Rule D — One Visual Case Board (4 Questions, 4 Acts)
Instead of long text logs, the Case File is a simple **4-Question Board** that stamps answers as you play:
1. **Act I (Units 1–3) — Are they using alchemy?**
   *Clues:* Bismuth in pure salt (Tallow), UV stealth lens (Lanternfall), laser-melted basalt (Ligar) → **Rumor tested: chemistry can't turn salt into heavy metal.**
2. **Act II (Units 4–7) — Where is the impossible heat & extra metal coming from?**
   *Clues:* Tank hot for 12 days in freezing air (Bellows), megawatts of heat piped underground (Ember Reach), lab-made coolant (Mirrowen), 50 tons of iron logged from 40 tons of ore (Kettle) → **Not alchemy. Not ordinary chemistry. Something inside the atom.**
3. **Act III (Units 8–11) — Who is the Fifth Guild?**
   *Clues:* Continuous chemical plant (Teeter), huge acid ore-leaching plant (Verdigris), copper stolen by electrolysis to wire a massive grid (Brinewire), catalytic fuel spike + intercepted callsign **"The Catalyst"** (Quicklight) → **They are the stranded crews the Four Guilds left behind to die.**
4. **Act IV (Units 12–14) — What are they building, and where?**
   *Clues:* Iron-ore sorting logs routed to Cinder Halo (Lodestone), polymer armor lined with **lead** radiation shielding (Thornmere), runaway uranium fission reactor (Cinder Halo) → **An ancient nuclear reactor on Cinder Halo—not alchemy, nuclear fission.**

---

## 3. Campaign Quest (Side Contract)

### Quest 1 — The Charge Gardens of Erebus (`q1`, 20 stages)
- **Current issue:** Good standalone puzzle, but its tie to the Fifth is just *"raiders cut power to test our response time."*
- **World Mystery (1 line):** *"Someone cut all 20 shield towers on Erebus and left a triangle mark nobody recognizes."*
- **Edits:**
  - Keep the playful, jargon-free gameplay copy untouched.
  - Tighten arrival/debrief to 1–2 short lines.
  - **Boss/Final Payoff (Pylon 20):** Reveals the **Triangle Mark**—the player's very first encounter with the Fifth Guild symbol, kicking off the Case Board.
  - **Case Pin:** *"Unknown triangle mark found on sabotaged shield tower."*

---

## 4. World-by-World & Quest-by-Quest Edit Plan (All 113 Learn Quests)

### Unit 01 — Tallow (Atoms) · *Act I*
- **World Mystery (1 line):** *"Heavy metal showed up inside Tallow's pure salt—rumor says the Fifth turned salt into gold."*
- **Canon fix:** Drop "walking salt machines" from `saga.js` and "grey powder / cutter" from `stage-story.js`. Ground Tallow as a raided salt refinery where strange metal chunks were found in the salt bins.
- **World Clue:** *Bismuth Chunk* — heavy metal found in pure NaCl salt that cannot be made by ordinary chemistry.

| Quest | Role | Current Problem | New 1-Line Hook (Stage 1) | New Case Pin (replaces `Filed:`) |
|---|---|---|---|---|
| `q1-grain` Atoms, Elements and Mixtures | `Direct Clue` | Mentions unintroduced "grey powder" & "cutter"; `Filed:` is a textbook summary. | *"Test the mixed sample pulled from the raided salt bin."* | *"Pure elements cannot be split into new ones."* |
| `q2-core` Inside an Atom | `Direct Clue` | Good core premise; keep it tighter. | *"Can anyone turn salt into gold? Look inside the atom."* | *"Protons set an element's identity—chemistry never changes them."* |
| `q3-catalogue` The Periodic Table | `Toolkit` | Slightly wordy lead and `Filed:` repeats `q2`. | *"Check the periodic table to see what belongs in salt."* | *"Salt is only sodium and chlorine."* |
| `q4-ledger` Isotopes and Ions | `Direct Clue` | "Sealed canister" and "ledger" are vague. | *"Read the proton and neutron counts on this unlabeled tank."* | *"Neutrons change weight, not which element it is."* |
| `q5-assay` Atomic Mass | `Direct Clue` | Playtest flagged confusing chlorine sabotage line in debrief. | *"Weigh the salt sample's isotopes to check its atomic mass."* | *"Tallow's salt is normal chlorine—not altered."* |
| `q6-weigh` Counting By Weight | `Station Fix` | "Sealed crates with lost papers" is generic. | *"Weigh the raided salt drums to see how much was taken."* | *"Tons of raw salt are missing from Tallow."* |
| `boss-hopper` The Hopper | `Boss Payoff` | Solid; align with new bismuth clue. | *(Boss nameplate + intent only)* | **Board Pin:** *"Bismuth found in pure salt. Chemistry can't make it."* |

---

### Unit 02 — Lanternfall (Light and Electrons) · *Act I*
- **World Mystery (1 line):** *"The Fifth blacked out Lanternfall's lighthouse towers using light our sensors can't see."*
- **Canon fix:** Drop "moth drones" from `saga.js` and "Fifth scrambled the records tent's board" from `q5-numbers`. Keep it focused on the blacked-out glacier beacons and the Fifth's invisible UV optics.
- **World Clue:** *Ultraviolet Lens* — a lens ground for short-wavelength UV light to guide stealth ships in the dark.

| Quest | Role | Current Problem | New 1-Line Hook (Stage 1) | New Case Pin |
|---|---|---|---|---|
| `q1-wave` Light as a Wave | `Station Fix` | Debrief spoiled photoelectric mystery early (flagged in playtest). | *"Measure the wavelengths of the surviving beacon lamps."* | *"Short wavelengths carry the beacon signal."* |
| `q2-photon` Photons | `Direct Clue` | Good hook; tighten copy. | *"The beacon solar plates ignore red light—find out why."* | *"Only high-frequency light knocks electrons loose."* |
| `q3-lines` Line Spectra | `Direct Clue` | Good concrete hook! | *"Identify the gas inside the sealed tube left at the tower."* | *"The Fifth's beacon tube uses helium gas."* |
| `q4-cloud` Orbitals | `Toolkit` | Weak tie ("beacon lamps are tuned to electrons"). | *"Map where an atom's electrons actually live."* | *(Toolkit — no pin needed)* |
| `q5-numbers` Quantum Numbers *(opt)* | `Toolkit` | Very contrived ("Fifth scrambled the records tent's board"). | *"Learn the four-number address for every electron slot."* | *(Toolkit — no pin needed)* |
| `q6-filling` Electron Configuration | `Toolkit` | Contrived ("records tent's board"). | *"Fill each atom's electron levels from lowest energy up."* | *(Toolkit — no pin needed)* |
| `q7-pes` Photoelectron Spectroscopy | `Direct Clue` | Good hook! Keep concrete. | *"Identify the unlabeled powder from the tower using its spectrum."* | *"The tower residue is pure oxygen-rich oxide."* |
| `q8-trends` Periodic Trends | `Station Fix` | Disconnected ("sort camp's metal stock"). | *"Pick the best metal to rebuild the damaged beacon plate."* | *"Low-ionization metals trigger the beacon easily."* |
| `q9-absorb` Spectroscopy | `Direct Clue` | Good concrete hook! | *"Use light absorption to measure what is in the fouled coolant tank."* | *"Copper leaked into the beacon coolant tank."* |
| `q10-wavefunctions` Wavefunctions | `Toolkit` | Vague ("where beacon electrons hide"). | *"Map the peaks and zero-nodes of an electron wave."* | *(Toolkit — no pin needed)* |
| `boss-eater` The Lantern-Eater | `Boss Payoff` | Solid; keep concise. | *(Boss nameplate + intent only)* | **Board Pin:** *"UV lens found—Fifth ships fly blind in ultraviolet."* |

---

### Unit 03 — Ligar (Bonding) · *Act I*
- **World Mystery (1 line):** *"A Fifth Guild blast trapped Ligar's miners—and sliced solid basalt glass-smooth."*
- **Canon fix:** Drop "giant stone guardians" from `saga.js` (keep the Basalt Warden as a rogue quarry rig/crystal mass at the boss). Every bench either helps rescue the miners or explains how the Fifth cut rock no normal torch can melt.
- **World Clue:** *Glass-Cut Basalt* — volcanic stone sliced cleanly by heat far beyond any guild torch.

| Quest | Role | Current Problem | New 1-Line Hook (Stage 1) | New Case Pin |
|---|---|---|---|---|
| `q1-joins` What Holds | `Station Fix` | Good concrete hook; drop extra stage-4 clutter. | *"Test what kind of bonds hold the tunnel rubble together."* | *"Different bonds need different ways to break."* |
| `q2-lattice` Stone and Wire | `Station Fix` | Good concrete rescue hook! | *"Find a mineral liner that resists heat without conducting electricity."* | *"Covalent networks survive extreme heat."* |
| `q3-distance` Bond Energy | `Direct Clue` | Good hook; tie directly to the impossible cut. | *"Measure how much energy it takes to break strong bonds apart."* | *"Breaking basalt's bonds takes extreme energy."* |
| `q4-dots` Lewis Structures | `Station Fix` | Good rescue hook (unknown tunnel gases). | *"Map the bonds of the unknown gases leaking in the tunnel."* | *"Electron counts predict how tunnel gases bond."* |
| `q5-resonance` Resonance | `Toolkit` | Vague ("cutters will trust only the drawing"). | *"Some tunnel gases share electrons across multiple bonds—map them."* | *(Toolkit — no pin needed)* |
| `q6-shape` Molecular Shape | `Toolkit` | Contrived ("breakers cannot cut until they know shape"). | *"Predict the 3D shape of each gas molecule."* | *(Toolkit — no pin needed)* |
| `q7-polarity` Polarity | `Station Fix` | Good hook! | *"Find out why some tunnel gases stick to the rescue gear."* | *"Polar gases cling; nonpolar gases vent clean."* |
| `q8-hybrid` Hybridization | `Toolkit` | Currently has no lead line at all. | *"See how atom orbitals mix to form 3D bond shapes."* | *(Toolkit — no pin needed)* |
| `q9-orbitals` Molecular Orbitals *(opt)* | `Station Fix` | Good concrete hook (magnet finds oxygen for miners). | *"Use a magnet to spot breathable oxygen in the tunnel air."* | *"Oxygen is magnetic—air supply confirmed."* |
| `boss-warden` Basalt Warden | `Boss Payoff` | Solid! | *(Boss nameplate + intent only)* | **Board Pin:** *"Basalt melted glass-smooth. The Fifth has extreme heat."* |

---

### Unit 04 — Bellows (Gases) · *Act II*
- **World Mystery (1 line):** *"The Fifth jammed Bellows' fuel tanks—and left a sealed cylinder that stays hot in freezing air."*
- **Canon fix:** Bellows is already one of the strongest story worlds! Just tighten the copy and remove "needles / push" leftover phrasing.
- **World Clue:** *The Warm Cylinder* — a sealed gas tank that held high pressure for 12 days in sub-zero wind, proving an internal non-chemical heat source.

| Quest | Role | Current Problem | New 1-Line Hook (Stage 1) | New Case Pin |
|---|---|---|---|---|
| `q1-knocks` What Pressure Is | `Station Fix` | Uses "needles" (euphemism). | *"Check why pressure is spiking in the jammed fuel tanks."* | *"Pressure comes from gas particles hitting walls."* |
| `q2-laws` The Gas Laws | `Direct Clue` | Great hook! Keep it crisp. | *"Test how freezing wind should change a sealed tank's pressure."* | *"A sealed tank staying hot in cold air has an inside heat source."* |
| `q3-ideal` The Ideal Gas Law | `Station Fix` | Good hook; slightly wordy. | *"Calculate how much gas is trapped inside each sealed tank."* | *"Tank amounts counted without opening a valve."* |
| `q4-mixtures` Partial Pressures | `Direct Clue` | Good hook; `Filed:` uses euphemism "push". | *"The Fifth pumped a second gas into the fuel line—measure both."* | *"Each gas adds its own partial pressure."* |
| `q5-speed` Speed and Escape | `Direct Clue` | Good hook! | *"Identify the gas leaking from the Fifth's damaged vent."* | *"The Fifth's vent is leaking heavy krypton gas."* *(Nice nuclear fission foreshadowing!)* |
| `q6-real` Real Gases | `Station Fix` | Good hook! | *"See what happens when the Fifth over-packs a tank past ideal limits."* | *"Extreme pressure forces gas particles to attract and crowd."* |
| `boss-compressor` The Compressor | `Boss Payoff` | Excellent clue! | *(Boss nameplate + intent only)* | **Board Pin:** *"Sealed tank stayed hot 12 days in freezing air. Not chemical."* |

---

### Unit 05 — Ember Reach (Thermodynamics) · *Act II*
- **World Mystery (1 line):** *"The Fifth tapped Ember Reach's volcano pipes, draining megawatts of heat straight underground."*
- **Canon fix:** Tie every quest cleanly to restoring shelter heat and tracing where the stolen thermal energy went.
- **World Clue:** *Underground Heat Siphon* — megawatts of heat routed below the crust to drive an endothermic refining process.

| Quest | Role | Current Problem | New 1-Line Hook (Stage 1) | New Case Pin |
|---|---|---|---|---|
| `q1-flow` Heat and Temperature | `Station Fix` | Good hook; simplify stage-4 extra line. | *"Thaw the frozen shelter valve and track which way heat flows."* | *"The Fifth's pipe is absorbing heat—an endothermic draw."* |
| `q2-calorimetry` Calorimetry | `Direct Clue` | Good concrete hook! | *"Pick the best cooling fluid, then identify the Fifth's unlabeled pipe metal."* | *"Specific heat identifies the Fifth's alloy."* |
| `q3-enthalpy` Enthalpy of Reaction | `Station Fix` | Good hook (fuel for rescue skiff). | *"Measure how much heat each fuel releases per gram."* | *"Fuel output calculated before burning."* |
| `q4-bonds` Bond Enthalpies | `Direct Clue` | Good hook! | *"Calculate how much energy the Fifth's cracking coil spends breaking bonds."* | *"Bond energies show the Fifth's coil costs huge heat."* |
| `q5-hess` Hess's Law and Formation | `Direct Clue` | Great hook! | *"The main shaft is sealed—calculate its heat from open side pipes."* | *"Total heat is the same by any route."* |
| `q6-entropy` Entropy | `Toolkit` | Good concrete visual hook. | *"Watch how gas and heat naturally spread out when a valve opens."* | *(Toolkit — no pin needed)* |
| `q7-gibbs` Free Energy | `Direct Clue` | Good hook; connect to the underground siphon. | *"Find the temperature where the Fifth's heat-hungry process turns on."* | *"The underground process only runs at extreme heat."* |
| `boss-crucible` The Crucible | `Boss Payoff` | Solid! | *(Boss nameplate + intent only)* | **Board Pin:** *"Stolen volcano heat powered a hidden underground rig."* |

---

### Unit 06 — Mirrowen (States of Matter) · *Act II*
- **World Mystery (1 line):** *"A strange chemical froze Mirrowen's shipping canals solid—trapping every supply boat."*
- **Canon fix:** Drop "military-grade synthetic polymers" from `saga.js` (contradicts `q6-solution` dissolved salt/liquid). Keep it simple: the Fifth dumped a lab-made chemical into the canals to freeze out guild shipping; testing it proves they have a full chemical plant somewhere.
- **World Clue:** *Lab-Made Canal Agent* — a synthetic compound poured into the waterways, proving the Fifth operates real chemical factories.

| Quest | Role | Current Problem | New 1-Line Hook (Stage 1) | New Case Pin |
|---|---|---|---|---|
| `q1-states` Three States | `Direct Clue` | Slightly wordy. | *"Check if the canal ice is still water or something new."* | *"Same molecules—just locked in place."* |
| `q2-grip` The Grip Between | `Direct Clue` | Wordy lead and `Filed:`. | *"Measure how strongly water molecules pull on each other."* | *"Strong hydrogen bonds hold water tight."* |
| `q3-boil` Liquids and Vapour | `Toolkit` | Slightly wordy. | *"See why canal water evaporates even below its boiling point."* | *(Toolkit — no pin needed)* |
| `q4-solids` Kinds of Solid | `Direct Clue` | Good hook! | *"Test if the canal ice is a crystal or a glass."* | *"Sharp melting point—the ice is crystalline."* |
| `q5-crossing` The Crossing | `Station Fix` | Good hook! | *"Find out how much heat it takes to melt the canal barrier."* | *"Melting energy breaks attractions without raising temperature."* |
| `q6-solution` Taken Into Solution | `Direct Clue` | Clean and concrete! | *"Measure how much of the Fifth's chemical is dissolved per liter."* | *"Canal concentration measured in moles per liter."* |
| `q7-separate` Pulling Apart | `Station Fix` | Good hook! | *"Separate the Fifth's chemical out of the canal water."* | *"Boiling off the water leaves the Fifth's agent behind."* |
| `boss-undertow` The Undertow | `Boss Payoff` | Solid! | *(Boss nameplate + intent only)* | **Board Pin:** *"Canal chemical was lab-made—the Fifth has a factory."* |

---

### Unit 07 — Kettle (Stoichiometry and Reactions) · *Act II*
- **World Mystery (1 line):** *"Kettle's foundry logs claim 50 tons of iron came from 40 tons of ore—which is impossible."*
- **Canon fix:** Drop "robotic soldiers" from `saga.js`. Keep Kettle focused on the hijacked iron foundry and the **Impossible Shipping Log** (the smoking gun of Act II).
- **World Clue:** *The 50-Ton Shipping Log* — chemistry strictly conserves mass; 40 tons of ore can make at most 28 tons of iron, so 22 tons came from an outside source.

| Quest | Role | Current Problem | New 1-Line Hook (Stage 1) | New Case Pin |
|---|---|---|---|---|
| `q2-names` Names and Formulas | `Direct Clue` | Good hook; make it punchier. | *"Decode the chemical labels on the Fifth's ore crates."* | *"The crates hold iron(III) oxide, Fe₂O₃."* |
| `q3-change` Physical or Chemical | `Direct Clue` | Good hook! | *"Test whether a chemical reaction can ever create extra mass."* | *"Mass never changes in a sealed reaction."* |
| `q4-balance` Balancing Equations | `Station Fix` | Good hook! | *"Balance the foundry's furnace equation so every atom counts."* | *"Furnace recipe balanced: Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂."* |
| `q5-ionic` Net Ionic Equations | `Station Fix` | Good hook! | *"Find which ions turned the foundry's waste pond cloudy."* | *"One ion pair precipitated out; the rest stayed dissolved."* |
| `q6-stoich` How Much Is Made | `Direct Clue` | Best hook in the world! | *"Check the Fifth's claim: can 40 tons of ore yield 50 tons of iron?"* | *"Max yield is 28 tons—22 tons of metal came from elsewhere."* |
| `q7-titrate` Titration | `Station Fix` | Slightly disconnected. | *"Measure the acid strength in the foundry's metal-cleaning tank."* | *"Acid tank strength checked against the Fifth's log."* |
| `q8-kinds` Kinds of Reaction | `Toolkit` | Generic ("reactions nobody has named"). | *"Sort the foundry's furnace logs by reaction type."* | *(Toolkit — no pin needed)* |
| `q9-hsab` Hard and Soft | `Station Fix` | Good hook; `Filed:` invents a new "30 tons of silver" subplot—remove that! | *"Separate the mixed metals in the foundry's waste vat."* | *"Metal waste separated cleanly by sulfide affinity."* |
| `boss-golem` Recipe Golem | `Boss Payoff` | Solid! | *(Boss nameplate + intent only)* | **Board Pin:** *"50 tons from 40 tons is impossible. Extra metal was smuggled or transmuted."* |

---

### Unit 08 — Teeter (Equilibrium) · *Act III*
- **World Mystery (1 line):** *"The Fifth's salt ponds on Teeter look dead, yet their chemical pumps are still pulling product."*
- **Canon fix:** **Major tone fix.** Right now *every single quest* says *"The Fifth said the pan was finished / reported K / said it can't happen."* That's repetitive and makes no sense. Instead: **the Fifth built a secret continuous chemical-refining pond on Teeter, disguised as an abandoned salt flat.** You are learning how they keep the reaction running nonstop to feed their operation.
- **World Clue:** *Hidden Continuous Refinery* — the "abandoned" ponds are actively shifting equilibrium to harvest fuel/salt nonstop.

| Quest | Role | Current Problem | New 1-Line Hook (Stage 1) | New Case Pin |
|---|---|---|---|---|
| `q1-both` Running Both Ways | `Direct Clue` | "Fifth says pan is finished" is flat. | *"Check if the Fifth's 'abandoned' salt pond is actually still reacting."* | *"The pond is still reacting in both directions at once."* |
| `q2-k` The Number That Holds | `Direct Clue` | Repetitive Vess-checks-Fifth framing. | *"Test three ponds with different starts to see where they settle."* | *"Every pond settles to the same ratio, K."* |
| `q3-q` Which Way It Goes | `Direct Clue` | Vague ("mixed to a recipe"). | *"Predict which way this fresh tank mixture will run."* | *"Comparing Q to K predicts the reaction's direction."* |
| `q4-properties` Combining K | `Toolkit` | Contrived ("Fifth says one K covers three ways"). | *"See how K changes when you flip or combine equations."* | *(Toolkit — no pin needed)* |
| `q5-ice` Equilibrium Concentrations | `Direct Clue` | Contrived ("not found in the pan"). | *"Calculate how much product the Fifth's pond makes once settled."* | *"Calculated exact output of the Fifth's ponds."* |
| `q6-lean` Le Chatelier's Principle | `Direct Clue` | Weak ("Fifth added a drop"). | *"See how the Fifth's drain pump forces the pond to make more product."* | *"Removing product keeps the pond making more nonstop."* |
| `q7-dissolve` Solubility Equilibria | `Station Fix` | Disconnected. | *"Find how much salt dissolves before it clogs the pond pipes."* | *"A shared ion forces salt out of solution."* |
| `q8-free` Free Energy and K | `Toolkit` | Contrived ("Fifth says some changes cannot happen"). | *"Link free energy to K to see how far a reaction goes."* | *(Toolkit — no pin needed)* |
| `boss-tipper` The Tipper | `Boss Payoff` | Weak `Filed:` line. | *(Boss nameplate + intent only)* | **Board Pin:** *"Abandoned salt ponds are a hidden Fifth Guild chemical plant."* |

---

### Unit 09 — Verdigris (Acids and Bases) · *Act III*
- **World Mystery (1 line):** *"Toxic acid runoff from a Fifth Guild ore-washing plant is eating through Verdigris's radio fort."*
- **Canon fix:** **Major tone fix.** Drop the repetitive *"The Fifth wrote 'acid' on a sign and never measured it"* gimmick. Ground Verdigris in a real crisis: **the Fifth dumped chemical waste from ore processing into the marsh, and you must identify, measure, neutralize, and buffer it to save the fort's water and radio gear.**
- **World Clue:** *Ore-Leaching Acid Waste* — heavy industrial acid runoff matching uranium/metal ore processing.

| Quest | Role | Current Problem | New 1-Line Hook (Stage 1) | New Case Pin |
|---|---|---|---|---|
| `q1-handover` The Handover | `Direct Clue` | "Fifth calls water acid" gimmick. | *"Test what the marsh runoff is actually doing to the water."* | *"Acids pass protons to water."* |
| `q2-scale` Reading the Scale | `Direct Clue` | "Fifth gives one number" gimmick. | *"Measure how acidic each marsh tank really is on the pH scale."* | *"Each pH step is a 10× jump in strength."* |
| `q3-weak` Weak Acids and Bases | `Direct Clue` | Repetitive gimmick. | *"Two tanks hold the same amount of acid—find why one is far harsher."* | *"Strong acids split completely; weak ones barely do."* |
| `q4-structure` Acid Strength and Structure | `Toolkit` | Contrived ("Fifth ranked its tanks"). | *"See how a molecule's structure makes an acid strong or weak."* | *(Toolkit — no pin needed)* |
| `q5-salts` Neutralization and Salts | `Station Fix` | Good chemistry, repetitive framing. | *"We neutralized a waste tank—check if the water is actually safe."* | *"Neutralizing can still leave acidic or basic salts."* |
| `q6-titrate` Titration Curves | `Station Fix` | Repetitive framing. | *"Track the pH curve as you neutralize the marsh's worst tank."* | *"Exact neutralization point found for the waste tank."* |
| `q7-buffer` Buffers | `Station Fix` | Uses unexplained "sluice". | *"Build a buffer mix that protects the fort's intake from acid spikes."* | *"A weak acid plus its conjugate base resists pH swings."* |
| `q8-capacity` pKa, Protonation and Capacity | `Station Fix` | Uses unexplained "sluice". | *"Test how much runoff the fort's buffer tank can absorb before failing."* | *"Fort's water intake shielded with measured buffer capacity."* |
| `boss-leach` The Leach | `Boss Payoff` | Weak `Filed:` line. | *(Boss nameplate + intent only)* | **Board Pin:** *"Acid waste matches heavy ore leaching—not normal mining."* |

---

### Unit 10 — Brinewire (Electrochemistry) · *Act III*
- **World Mystery (1 line):** *"The Fifth clamped illegal power taps onto Brinewire's salt pools—draining the grid and stripping copper."*
- **Canon fix:** Drop the repetitive *"The Fifth posted notices saying the cells failed"* gimmick. Make it direct: **the Fifth is stealing electricity AND electroplating pure copper out of the marsh to wire a massive facility.**
- **World Clue:** *Plated Copper Bars* — hundreds of kilograms of pure copper pulled from the marsh by electrolysis, wired to ship out.

| Quest | Role | Current Problem | New 1-Line Hook (Stage 1) | New Case Pin |
|---|---|---|---|---|
| `q1-halves` Half-Reactions | `Direct Clue` | "Fifth says pylons are rotting." | *"Find out what is moving inside the corroded power pylons."* | *"Corrosion is electrons moving from one metal to another."* |
| `q2-activity` Which Metal Gives | `Direct Clue` | Good concrete hook! | *"Two metals are bolted together on the pylon—find which one gives electrons."* | *"More active metals lose electrons first."* |
| `q3-galvanic` Galvanic Cells | `Station Fix` | Good concrete hook! | *"The Fifth cut the salt bridges—rebuild a working marsh battery."* | *"A salt bridge completes the circuit so ions can flow."* |
| `q4-potential` Cell Potential | `Station Fix` | Good hook; drop "Fifth's big cell" phrasing. | *"Measure which metal pair gives the highest voltage for the grid."* | *"Voltage depends on the metals, not tank size."* |
| `q5-load` Under Load | `Station Fix` | Good hook! | *"Track why the marsh's backup batteries lose voltage as they run."* | *"Batteries fade as concentrations shift toward equilibrium."* |
| `q6-electrolysis` Electrolysis | `Direct Clue` | Great hook! Keep it punchy. | *"The Fifth is forcing current into the pool—see what they are making."* | *"They are electroplating pure copper straight out of the marsh."* |
| `boss-clamp` The Clamp | `Boss Payoff` | Solid! | *(Boss nameplate + intent only)* | **Board Pin:** *"Fifth stole tons of plated copper—wiring something huge."* |

---

### Unit 11 — Quicklight (Kinetics) · *Act III (The Big Reveal)*
- **World Mystery (1 line):** *"Fuel towers on Quicklight are overheating ten times too fast—someone spiked the vents with a mystery dust."*
- **Canon fix:** Quicklight is already super cohesive and lands the best chemistry-story pun in the entire game (**The Catalyst**). Just tighten the wording and make sure the leader's identity lands cleanly at the boss.
- **World Clue:** *The Vent Catalyst & Callsign* — an unconsumed catalyst powder, plus an intercepted transmission signed **The Catalyst** (revealing the Fifth are the abandoned frontier crews).

| Quest | Role | Current Problem | New 1-Line Hook (Stage 1) | New Case Pin |
|---|---|---|---|---|
| `q1-watch` How Fast | `Direct Clue` | Clean! | *"Two fuel lines make the same fuel, but one is overheating—time them."* | *"Same reaction, much faster rate."* |
| `q2-law` The Rate Law | `Direct Clue` | Clean! | *"Test which of the three fuel feeds actually speeds up the tank."* | *"Only two feeds control the reaction rate."* |
| `q3-time` Concentration Over Time | `Direct Clue` | Clean! | *"Time how fast the spiked fuel breaks down by half."* | *"First-order decay drops by half in equal steps."* |
| `q4-collide` Collisions and the Hill | `Toolkit` | Clean! | *"See why cold fuel sits safely until collisions clear the energy hill."* | *(Toolkit — no pin needed)* |
| `q5-steps` Steps | `Direct Clue` | Clean! | *"Find which step of the fuel reaction controls the overheating spike."* | *"The slowest step sets the speed of the whole reaction."* |
| `q6-shortcut` Catalysts | `Direct Clue` | Clean! | *"Test the dust found in the vent—it speeds the burn without running out."* | *"The dust is a catalyst—it lowers the energy hill."* |
| `boss-flare` The Flare | `Boss Payoff` | Great climax for Act III! | *(Boss nameplate + intent only)* | **Board Pin:** *"Their leader is 'The Catalyst'—the crews the Guilds left behind."* |

---

### Unit 12 — Lodestone (Transition Metals) · *Act IV*
- **World Mystery (1 line):** *"A massive Fifth Guild magnet in Lodestone's iron canyon is sorting metal drums—and shipping them somewhere."*
- **Canon fix:** Drop "giant magnetic cannon pulling ships out of the sky" from `saga.js` (it clashes completely with `stage-story.js`'s iron-drum sorting yard). Make both match: **the Fifth built a giant electromagnetic sorting coil in the canyon to separate specific transition-metal ores and ship them to Cinder Halo.**
- **World Clue:** *Sorting Coil Dispatch Log* — coordinates routing every sorted metal shipment straight to **Cinder Halo**.

| Quest | Role | Current Problem | New 1-Line Hook (Stage 1) | New Case Pin |
|---|---|---|---|---|
| `q1-dblock` The d-Block | `Toolkit` | Mentions "manifest". | *"Check iron's d-electrons before testing the Fifth's metal drums."* | *(Toolkit — no pin needed)* |
| `q2-charges` Many Charges | `Direct Clue` | Mentions "manifest". | *"Measure how many different charges these canyon metals can hold."* | *"Transition metals take multiple charges."* |
| `q3-complex` Complex Ions | `Direct Clue` | Great concrete hook! | *"Ammonia spilled on a drum and turned it deep blue—find out why."* | *"Ligands bind around the metal to form complex ions."* |
| `q4-shapes` Shapes and Isomers | `Direct Clue` | Good concrete hook! | *"Two drums share the same formula but act differently—check their shapes."* | *"Same formula, different 3D arrangement."* |
| `q5-colour` Colour | `Direct Clue` | Good concrete hook! | *"Labels are gone—use each drum's color to identify what's inside."* | *"Color reveals the ligands around the metal."* |
| `q6-spin` Magnetism | `Direct Clue` | Great hook! | *"The sorting coil grabs some drums and ignores others—find out why."* | *"Unpaired d-electrons make a metal magnetic."* |
| `boss-coil` The Coil | `Boss Payoff` | Solid! | *(Boss nameplate + intent only)* | **Board Pin:** *"All sorted ore shipments route straight to Cinder Halo."* |

---

### Unit 13 — Thornmere (Organic Chemistry) · *Act IV*
- **World Mystery (1 line):** *"The Fifth's swamp outpost on Thornmere is wrapped in tough plastic armor—find out what's under it."*
- **Canon fix:** Thornmere is ALREADY near-perfect! Every single quest flows into the next like a real investigation (tar → alkenes → isomers → acid → ester links → breaking the polymer → discovering lead shielding underneath). Just trim a few extra words.
- **World Clue:** *Lead-Lined Armor Plate* — polymer armor lined with heavy lead underneath, built to shield workers from nuclear radiation.

| Quest | Role | Current Problem | New 1-Line Hook (Stage 1) | New Case Pin |
|---|---|---|---|---|
| `q1-chains` Carbon Chains | `Direct Clue` | Clean! | *"Test the black swamp tar the Fifth pumps into their factory."* | *"The tar is carbon-hydrogen chains (alkanes)."* |
| `q2-unsat` Double Bonds | `Direct Clue` | Clean! | *"See what the Fifth's heater turns the tar into."* | *"Double bonds let molecules snap together."* |
| `q3-isomers` Isomers | `Direct Clue` | Clean! | *"Two drums share one formula, but only one works—find the difference."* | *"Different shapes make different molecules."* |
| `q4-groups` Functional Groups | `Direct Clue` | Clean! | *"One clear liquid is eating through its drum—identify it."* | *"It's a carboxylic acid, stored next to an alcohol."* |
| `q5-reactions` Making and Breaking | `Direct Clue` | Clean! | *"See how the Fifth joins those two liquids into armor links."* | *"They join by losing water—so water can break them."* |
| `q6-polymers` Long Chains | `Station Fix` | Clean! | *"Find the weak link in the fortress's plastic armor plates."* | *"Hydroxide cuts the polymer chains right at the links."* |
| `boss-carapace` The Carapace | `Boss Payoff` | Incredible twist! | *(Boss nameplate + intent only)* | **Board Pin:** *"Armor is lined with lead—they are shielding against radiation."* |

---

### Unit 14 — Cinder Halo (Nuclear Chemistry) · *Act IV (Finale)*
- **World Mystery (1 line):** *"We found the Fifth's base at Cinder Halo—an ancient nuclear reactor running hot with no fuel line."*
- **Canon fix:** Cinder Halo is ALREADY the gold standard for Avalon's story integration! Every single bench directly solves the mystery of the entire game (warm drums → gamma rays → transmutation of uranium → unstable waste → dating the crater → fission chain reaction → shutting down the Core). Keep it tight and punchy.
- **World Clue:** *The Control-Rod Log* — proves the Fifth didn't discover alchemy; they restarted a uranium fission reactor, which explains the bismuth on Tallow, the warm tank on Bellows, the krypton leak, the impossible iron log, and the lead armor on Thornmere.

| Quest | Role | Current Problem | New 1-Line Hook (Stage 1) | New Case Pin |
|---|---|---|---|---|
| `q1-still-warm` Still Warm | `Direct Clue` | Already great! | *"The Fifth's ore drums stay warm in freezing air—find out why."* | *"Decaying nuclei give off heat that cold can't stop."* |
| `q2-what-comes-off` What Comes Off | `Direct Clue` | Already great! | *"Something is leaking through the drum walls—find what blocks it."* | *"Gamma rays pass through metal; only thick lead stops them."* |
| `q3-equations` Balancing the Nucleus | `Direct Clue` | Already great! | *"The slag holds elements the ore never had—trace where they came from."* | *"Nuclear decay turns uranium step-by-step into new elements."* |
| `q4-stability` Which Nuclei Last | `Direct Clue` | Already great! | *"Check which of the Fifth's stored nuclei are stable and which decay."* | *"Their storage is full of unstable nuclei."* |
| `q5-half-gone` Half Gone, Then Half Again | `Direct Clue` | Already great! | *"Use half-life decay to measure how long the Fifth has worked here."* | *"They've been running this crater for decades."* |
| `q6-shortfall` The Missing Weight | `Direct Clue` | Already great! | *"The reactor has no fuel line—find where its huge energy comes from."* | *"Splitting uranium turns tiny lost mass into massive energy."* |
| `boss-core` The Transmutation Core | `Boss Payoff` | Grand finale! | *(Boss nameplate + intent only)* | **Board Pin:** *"Case Solved: Not alchemy—nuclear fission. Reactor stabilized."* |

---

## 5. Summary of What Changes in Code (When Implemented)

1. **`src/story/saga.js`**
   - Rewrite `EPISODES` to remove the 3-paragraph `paragraphs` walls (keep 1-sentence `arrival`, `incident`, `objective`, `closing`).
   - Align `unit01` (Tallow), `unit02` (Lanternfall), `unit03` (Ligar), `unit06` (Mirrowen), `unit07` (Kettle), `unit08` (Teeter), `unit09` (Verdigris), `unit10` (Brinewire), and `unit12` (Lodestone) to the single unified canon above.
2. **`src/learn/engine/stage-story.js`**
   - Replace every contrived or vague lead line with the crisp 6–12 word hooks in Section 4.
   - Add the missing lead line for `unit03/q8-hybrid`.
3. **`src/story/quest-story.js`**
   - Replace verbose/textbook `"Filed: ..."` lines with the short **Case Pins** (or omit pins on `Toolkit` quests so only real clues pin to the board).
   - Remove forward spoilers and confusing lore detours from debrief beats (e.g. Tallow `q5-assay`, Lanternfall `q1-wave`).
4. **Case File UI (`src/screens/casefile.js` or equivalent)**
   - Present the **4-Question Case Board** visually with short stamped answers per Act, instead of walls of text.
5. **Verification (`tools/verify-story.mjs`)**
   - Update `verify:story` if `"Filed:"` prefix is retired and `Toolkit` quests are allowed to omit a Case Pin.
6. **`docs/story/bible.md`**
   - Sync the Spoil Roster and Episode Kit sections so the Story Bible matches the unified low-text canon.
