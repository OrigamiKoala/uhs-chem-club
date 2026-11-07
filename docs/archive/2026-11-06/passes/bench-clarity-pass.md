# Bench Clarity Pass — making every bench graspable

Status: **built in part (see §7, the build record); decisions settled (§6).** Written 2026-10-14 after a stage-by-stage read of all 36 built
Learn quests (31 benches + 5 bosses, 270 stages): every prompt, briefing, hint rung, reward card,
bench declaration and solution, dumped from the live modules, plus the drawing code of the
instruments the complaints point at (`lightbench.js` `drawTrace`, `frame.js` `setReadout`).

**Who this is for.** Two players, and every recommendation has to work for both:

1. **The middle schooler getting ahead.** Curious, will not read a textbook, has never seen
   scientific notation, does not yet know that "inversely proportional" is a thing. Learns by
   pressing keys and watching what happens.
2. **The high schooler struggling in AP Chem.** Has heard every word and understood few of them.
   Needs the *picture* behind the formula the class gave them, and needs to finish a stage feeling
   that they worked it out.

Neither of them is helped by a bench that is correct but silent. The doctrine in `CLAUDE.md`
(discover, don't be told; never block a right answer; one sentence a hint; no unexplained word)
stays exactly as it is. This plan is about the bench actually *showing* the thing the stage is about.

---

## 1. What is wrong, in one paragraph

Most benches are scientifically sound and the stage order is usually right. What fails is that the
**relationship a stage is about is almost never drawn on screen.** The player sees one number at a
time, the previous number is wiped by the next reading (`setReadout` replaces, never appends), and
the hint ladder tells them to "write the three temperatures down". So the discovery happens in the
player's head or on scrap paper — which the target player does not have — and stages that were
designed as experiments play as arithmetic or reading. The light bench is the clearest case and is
the one you hit: the wave is drawn **static** (`drawTrace` strokes one cosine and stops), the
wavelength appears **only after you tap the wave**, and the frequency is a separate number in a box,
so turning the dial never shows the two moving against each other.

---

## 2. Cross-cutting problems (with evidence)

Each problem names where it shows up. Fixes are in §3 (shared work) and §4 (per bench).

### P1. Relationships are never drawn
Every "X goes up when Y goes down" / "this product stays fixed" / "this leans toward that" stage
asks the player to hold two readings in their head and compare.
- `q1-wave` 1–3: wavelength vs frequency, the inverse relationship and the constant product.
- `q2-laws` 1–3, 5–6: Boyle, Charles, Gay-Lussac, Avogadro (there is a trace inset, but no
  side-by-side of the two quantities and the product/ratio).
- `q5-assay` 3–6: "the average leans toward the common isotope" is never pictured.
- `q4-mixtures` 3–4: "share of the particles = share of the push" is two numbers in a prompt.
- `q9-absorb` 5–7: absorbance vs concentration and vs path.
- `q3-distance` 1–3: "lowest energy = most stable" with no sense of *why* low is stable.

### P2. The bench has no memory
`LearnFrame.setReadout` replaces the readout on every press and clamps each line to two
sentences. There is no log. Hints routinely say "write down", "note", "set beside" (q2-lattice 1, 7,
8; q5-assay 4; q3-catalogue 1; q1-wave 3; q2-photon 6; Bellows throughout). A comparison stage with
no record of the comparison is a memory test.

### P3. The arithmetic wall
Lanternfall and Bellows lean on multi-step scientific-notation arithmetic as the *only* way through
a stage, with the instrument doing nothing in it:
- `q1-wave` 3, 4, 7, 8 ("turn nm into metres with 10^-9, multiply by the frequency…").
- `q2-photon` 5 (find h from a worked figure, then E = hν).
- `q3-lines` 5, 6 (Bohr energies at 10^-18 J, then λ = hc/ΔE).
- `q3-ideal` 2–7, `q4-mixtures` 3, 4, 8, `q5-speed` 5, 6, `boss-compressor` 2–5.
- `q4-mixtures` 3 and 4 give every number in the prompt — the bench is decoration.

A middle schooler stops here; an AP student who cannot yet do it gets no help seeing *which* numbers
go *where*, which is the actual skill.

### P4. Catalogue codes after the names were taught
Tallow teaches real element names from stage one and Lanternfall `q1-wave` 8 announces "from here
on the benches print the symbol". Then:
- `unit03/q1-joins` prints `CAT 11`, `CAT 12`, `CAT 17`… **31 times**, including in prompts
  ("Magnesium (CAT 12)…").
- `unit07/q1-recipe` prints `CAT 01`/`CAT 06`/`CAT 08` **63 times**; its `KINDS` table is all codes.
- `quest-guide.js` 31, `q1-wave` 4, `q7-pes` 1, `lightdata.js` 5.
For the target player a code is one more thing to decode on top of the chemistry.

### P5. Prompts carry story, exclamation marks and sometimes the route
- 132 of 270 prompts contain "!"; average prompt is 24 words; 17 run over 30.
- 70 prompts open with a setting clause ("We're down in the Ligar basalt quarry testing rubble
  fragments!", "Quarry exhaust contains traces of…") that the `.lq-story` line directly above
  already supplies, and the overworld card is clamped to four sentences, so story spends the budget.
- Several prompts state the route, against "A prompt states the objective and never the route":
  `q3-distance` 1 ("Wind the separation crank…"), `q6-filling` 1 and 5 ("Add iron's remaining eight
  valence electrons and tap Collapse Core"), `q1-recipe` 1 and 7, `q2-core` 3 (the parenthetical
  states the needle rule that Sample C exists to let the player discover).
- Reading level: "fundamentally", "exert", "net torque", "intercepts", "deviation", "agitate",
  "theoretical snag" are prompt words a 12-year-old trips on before reaching the chemistry.

### P6. Stages that are reading, not finding
- `q3-catalogue` 5 and 6: each card's readout ends with a line saying what the element *does*;
  rung 2 of stage 6 literally says "match each card's last line to the bin whose note says the same
  thing". `q3-catalogue` 4 is "read the number on oxygen's card" (rung 3 says so).
- `q8-hybrid` 2–4: the plate says how many arms are needed; the blend keys say how many lobes they
  make; the stage is "press the key with the matching number" three times.
- `q5-numbers` 1–3 and 7–8: read the numbers printed on the rack.
- Bosses Hopper, Eater, Golem (P10).

### P7. Choice notes that carry the reasoning
`verify:learn` searches miss messages for the answer, not option notes. These hand it over:
- `q6-weigh` 5: "44.0 grams — One carbon plus two oxygen."
- `q1-recipe` 5: "About 89 out of 100 — 16.0 of the 18.0 is the one heavy atom."
- `boss-hopper` 1: plates named "Rock Salt" and "Salt Aggregate".

### P8. Chemistry that is wrong or teaches a misconception
All in `unit01/q1-grain` unless noted:
- **Stage 8 files loose sodium + chlorine atoms as a *mixture*** ("pale powder from the yard"). That
  is table salt drawn unbonded: the one sample on the bench most likely to plant "salt is a mixture".
- Stage 7 Sample A, "yellow powder from the mine", is `k17` **chlorine** (a yellow-green gas). Sulfur
  (`k16`) is the yellow powder.
- Stage 4 Sample A, "loose grey grit", is twenty loose **oxygen** atoms; Sample D, "a speck of
  reddish gas", is one lone oxygen atom. Neither exists. A helium atom is the real thing that exists
  as a lone atom; carbon or iron is real grit.
- Stage 4's reward is titled "Molecules" though the answer is the sample that *cannot* be cut (the
  lone atom), and it calls Sample A — one kind of atom — "a loose mixture of atoms".
- Stage 3's ore is loose chlorine, oxygen and sulfur atoms; and its reward ("Every element has its
  own unique atomic mass") pre-empts `q5-assay`'s whole point that a listed mass is an average.
- **Group numbering disagrees across the road.** `q3-catalogue` builds columns "1"–"8" and calls the
  noble gases Group 8; `boss-hopper` phase 3 says "group 18"; `q6-filling` 6 describes the 18-column
  table. The player is never shown where ten columns went.
- `q1-joins` 2 reward: "a full outer shell is eight electrons — two, on the innermost one" reads as
  garbled.

### P9. The same stage twice
- `q2-core` 7 (strip Na to +2) ≈ `q4-ledger` 5 (strip Mg to +2), same keys, same hint text.
- `q2-core` 6 and 8 ≈ `q4-ledger` 3 and 8 (isotope / ion / different element sorting).
- `q1-grain` 5–6 (water's recipe, H₂O vs H₂O₂) ≈ `q1-recipe` 1, 3, 4.
- `q6-weigh` 2 (what a molecule weighs) ≈ `q1-recipe` 4.
- `q1-wave` 4 and 8 are both "frequency from a wavelength".

### P10. Three bosses have no bench
`boss-hopper`, `boss-eater` and `boss-golem` import no instrument. Every phase is a recall question
("Enter the proton count of a carbon atom", "Recall that the proton count is the atomic number",
"Add the hydrogen grams to the oxygen grams"). That breaks the doctrine's own test — "if you can
delete the monster and the stage is unchanged, the combat is decoration" — and "a stage must be
solvable by somebody who does not already know". `boss-warden` and `boss-compressor` already do it
right (each phase on a real instrument with a fresh sample).

### P11. Abstract ideas with no picture
Potential-energy wells (`q3-distance`), formal charge (`q5-resonance`), hybridization (`q8-hybrid`),
the uncertainty principle (`q4-cloud` 8: the bench just refuses and the player reads why), quantum
numbers (`q5-numbers`), photons (`q2-photon` — the light is never drawn as packets, though that is
what every stage from 3 on is about).

### P12. Briefings and rewards written for someone who already knows
Briefings name the machine before saying what it is *for* ("Welcome to the photoelectron
spectroscopy bench, where intense light knocks electrons clean off atoms to plot how many fly out at
each energy level"). Rewards average 45 words and usually put the term before the idea. For this
audience the order is: plain idea → the word for it → (optionally) one consequence.

---

## 3. Shared work (build once, used by many benches)

Ordered by leverage. Each is engine-level; quest copy changes ride on top.

### W1. The Bench Log
A persistent, auto-filled table of every reading taken this stage — one row per press, columns set
by the instrument (`{ sample, dial, reading… }`). Cleared on `setStage`. Drawn as a collapsible strip
in the deck body (2D) and as a ruled "logbook" plate beside the key bank at T4, mirrored from the DOM
the way `bench-keys.js` mirrors keys.
- Lets every "compare" stage show the comparison. Hints stop saying "write down".
- Rows can be **tapped to pin** two of them side by side.
- Optional per stage: `log: { compute: ['x', '÷'] }` adds a two-operand calculator over logged
  values (see W3). Choosing *which* operation is the reasoning; the bench only does the digits.
- Honest-picture rule holds: the log records what the instrument already reported, never a new fact.
- `verify:run`: pressing every key on every stage must produce log rows whose values equal the
  readouts.

### W2. Paired readouts and the Trend Plot
For any instrument with a dial, an opt-in inset that drops a dot at (dial quantity, response) every
time the player visits a setting, building the curve by exploration (the gas rig's trace inset is
the model; generalise it). Paired with **big paired readouts**: the two quantities a stage is about
printed side by side, both updating the instant the dial moves.
- Used by: light bench (λ vs f), gas rig (P vs V, V vs T, P vs n), cuvette (A vs c, A vs path),
  bond bench (already does it), photocell (electron speed vs frequency).
- Never draws a fitted line or names the shape — the player's dots make the shape.

### W3. The Formula Slate (calculation support)
A small equation template the stage can declare, e.g. `n = (P × V) ÷ (R × T)`, with empty slots.
The player fills slots by tapping Bench Log rows or plate constants; units are carried and shown; the
slate evaluates and prints the result with units. The skill being taught — *which reading goes in
which slot, in which units* — is the player's; the digits are the bench's.
- Turns P3's wall into a step a middle schooler can take, and is exactly what an AP student needs
  to practise.
- A wrong slot assignment is a normal refusal *with a reason* ("R in kPa units with a pressure in
  atm"), routed through the existing miss path.
- Scientific notation is glossed once, on first appearance, inline: "10^14 means 1 followed by 14
  zeros".
- **D1 (settled): the slate computes.**

### W4. Visual devices (each is one small drawn component)
| Device | What it shows | Used by |
|---|---|---|
| **Seesaw / mass line** | Isotope tallies stacked at their masses on a ruler; a fulcrum marks the average | `q5-assay` 3–8, `boss-hopper` |
| **Share bars** | Two stacked bars per mixture: share of particles, share of push | `q4-mixtures` 2–7 |
| **Photon packets** | Beam drawn as packets, each with an energy bar; plate shows its "grip" line | `q2-photon` 3–8, `boss-eater` |
| **Marble in the well** | A ball riding the energy trace at the current separation; "Let Go" rolls it to the bottom | `q3-distance` 1–6 |
| **Ownership split** | Each bond cut in half, each atom's owned electrons ringed, "brought vs owns" counter | `q5-resonance` 1–3 |
| **Tug of war** | Shared pair drawn sliding toward the stronger puller, δ+/δ− appearing | `q7-polarity` 1–2, `q1-joins` 3 |
| **Full-shell lamp** | One lamp per atom on the core bench: lit when the outermost occupied shell is full | `q2-core` 5, `q4-ledger` 5–7, then same lamp as the pair board |
| **Trend map** | A mini periodic table whose cells fill (shade + number) as atoms are measured | `q8-trends`, `q7-pes`, `q6-filling` 6 |
| **Mole map** | grams ⇄ moles ⇄ particles, three boxes with ×/÷ arrows labelled by molar mass and 6.02 × 10²³ | `q6-weigh` 4–8, `q3-ideal`, Kettle |

All obey SCOURED PLATE (plate grey, amber only when lit, charge told by stencil not colour alone).

### W5. Copy rules, enforced
Add to `verify:learn` (warnings first, then failures once the copy pass lands):
1. **Prompt ≤ 25 words, one sentence, no "!"**, ending in "?" or a plain imperative.
2. **No setting clause in the prompt.** The `.lq-story` line carries the world (D4).
3. **No `CAT nn` code anywhere after `unit01`** except Lanternfall q1-wave stage 8's card.
4. **Option notes are answer-leak checked** the same way miss messages are (catches P7).
5. **Reading level**: flag prompt words outside a plain-English allow-list plus the earned
   vocabulary (a short list: fundamentally, exert, torque, intercept, deviation, agitate, isolate,
   theoretical…).
6. **Briefing template**: sentence 1 = what the instrument does in everyday words; sentence 2 = what
   the player will see. No "Welcome to".
7. **Reward template**: plain idea first, then "This is called *X*." Target ≤ 35 words (ceiling of
   three sentences unchanged).

### W6. Retire the CAT codes
Replace every post-Tallow code with name + symbol ("magnesium (Mg)"). `q1-recipe`'s `KINDS` takes
`q1-grain`'s. `verify:learn` rule W5.3 keeps them out.

---

## 4. Bench by bench

Verdicts: **Keep** (copy only) · **Tune** (copy + small bench additions) · **Rework** (stages or
the instrument change). Stage numbers are 1-based. Anything not mentioned for a stage is fine as is,
apart from the global copy pass (W5).

### Tallow — unit01

#### q1-grain · Atoms, Elements and Mixtures — **Tune + fix chemistry**
- **Fix P8 first.** Stage 8 Sample C → a real mixture (carbon + sulfur powder). Stage 7 Sample A →
  sulfur (`k16`). Stage 4 Sample A → carbon grit; Sample D → **one helium atom** ("a puff of gas
  from the vent lamp"), the honest lone atom. Stage 3 ore → two solid elements that look alike plus a
  third (e.g. sodium and magnesium, both "pale", plus carbon).
- Stage 4 reward: retitle "Atoms Do Not Split"; Sample D is an atom, B and C are molecules (name
  *molecule* here), A is many loose atoms of one element. Drop "loose mixture".
- Stage 3 reward: retitle "Every Element Has Its Own Atom" — say the atoms of different elements
  differ (mass, size), without "unique atomic mass", which `q5-assay` overturns.
- Stage 1: add a **scale readout** to the power dial ("field of view: 1 mm … 1 µm … 1 nm") so zooming
  feels like a journey down in size, not an abstract 1–6.
- Stage 3: probe readings go to the Bench Log (W1); counting distinct names becomes counting rows.
- Give each element a distinct drawn size and stencil (no colour-only tells).

#### q2-core · Inside an Atom — **Tune**
- Stage 2: stencil protons with **"+"** instead of a cross. The prompt asks "how many have a positive
  charge"; the picture should speak the same language, and the join bench already uses ± stencils.
- Stage 3: remove the parenthetical rule from the prompt; Sample C is the evidence and rung 2 already
  points at it.
- Stage 5: the two-charge tester is a gate on discovery. Rework: tester unlimited on three open
  samples (1, 7 and 8 outer electrons); two further samples (2,8,8,1 and 2,7) sit behind a casing the
  tester cannot reach, and the stage asks for those two. Observe → infer the rule → apply.
- Add the **full-shell lamp** (W4) here, so "atoms trade toward a full outer shell" is visible.

#### q3-catalogue · The Periodic Table — **Rework stages 2, 4, 5, 6**
- Stage 2: print each card's outer electrons as **dots on the card face** (a tiny shell drawing). The
  saw-tooth becomes visible across the row. Ask "Tap every card where the pattern starts over" (pick
  widget) instead of "skipping the first two cards, how many go by…".
- Stage 4: "read oxygen's number" is a lookup. Ask "What do the cards in one column have in common?"
  (choice: proton count / mass / outer-shell electrons / number of shells), evidence from comparing
  three columns.
- Stages 5–6: take the "what it does" line off the cards and put `q2-core`'s **reaction tester** on
  the board ("Test Card" presses the element against a partner: gives / takes / shares / nothing).
  Stage 5 observes; stage 6 tests some and predicts the rest from position.
- **Group numbers**: build the real 18-column layout with a marked gap ("ten more columns belong
  here") between columns 2 and 13, labels 1, 2, 13–18. Fixes the Group 8 / group 18 clash. (Default;
  see D-list §6.)

#### q4-ledger · Isotopes and Ions — **Tune, de-duplicate**
- Stage 5 (strip to +2) repeats `q2-core` 7. Replace with: "What charge does magnesium end up with
  when its outer shell is gone?" — the full-shell lamp lights at +2, and stripping a third electron
  is possible but the lamp goes out (and a meter shows the cost leap, previewing `q8-trends` 7).
- Stage 6: same lamp from the other side (chloride lights at −1) — prompt no longer has to assert
  "atoms love full outer shells".
- Stage 7: add a **charge tray** — tap ions into it, the running total shows; 1 Mg²⁺ + 2 Cl⁻ is found
  by building to zero, not by multiplying in the head.
- Stage 3: differentiate from `q2-core` 6 by working from *labels* (notation) rather than counting.

#### q5-assay · Atomic Mass — **Tune (add the seesaw)**
- Add the **mass line / seesaw** (W4) under the bins. Stage 3 ("where does 35.5 sit?") becomes
  visible: the fulcrum sits near the heavy stack. Stage 4's weighted average can be checked against
  the fulcrum.
- Stage 6 (abundance from a sealed weight) is algebra most middle schoolers cannot do. With the
  seesaw, add a **mix slider** ("try a mix") that moves the fulcrum; match it to the weighed average.
  AP students can still compute.
- Name the unit once: the bins' numbers are atomic mass units (u), on stage 1's or 4's card.

#### q6-weigh · Counting By Weight — **Rework stages 4–7**
- The jump from per-atom "weights" to **grams** at stage 4 is unexplained. Add a **count dial** to the
  balance (×60 → ×6,000 → … → ×6.02 × 10²³): at one mole the readout switches from u to g and the
  number does not change. That is the mole, discovered. Real-life anchor in the briefing: a dozen eggs
  and a dozen bowling balls weigh differently but count the same.
- Stage 5: remove the option notes; make it a number.
- Stages 6–7: the bench only repeats the prompt's number. Put the **mole map** (W4) on the plate;
  the stage is choosing the arrows.

#### boss-hopper · The Hopper — **Rebuild on instruments**
Five phases on the five Tallow instruments with fresh samples, the way `boss-warden` is built:
scope (classify three new samples), core bench (identify a sealed atom by its needle and outside),
catalogue (place a card that is not there), assay (name a sample by its average), weigh floor
(moles in a sealed drum). Current phases 2–5 are recall.

### Lanternfall — unit02

#### q1-wave · Light as a Wave — **Rework (the bench you flagged)**
The fix is in the instrument, so every stage benefits:
- **Animate the trace.** The wave moves left-to-right at **one fixed on-screen speed for every
  lamp**, so a short wavelength visibly sends more crests past the gate per second. The gate on the
  right flashes on each crest and a counter ticks.
- **Both numbers always on screen, side by side, large**: Wavelength (nm) | Frequency (per second),
  both changing the moment the dial turns. No tap needed to see the wavelength (keep the tap bracket
  as a ruler).
- **Trend Plot** (W2): each dial setting visited drops a dot at (wavelength, frequency). Sweep the
  dial and the falling curve is there. Stage 1's answer is in the plot; stage 2's "twice the
  wavelength, half the frequency" is two dots.
- Stage 2: stack Sample A and the tuned lamp on a **shared time base** so "half as many crests pass"
  is literally seen.
- Stage 3: Bench Log (W1) with the ×/÷ calculator over logged values: the player tries
  wavelength × frequency on each lamp and sees one number come out three times. The discovery
  (that the product is constant) survives; the 10^-9 bookkeeping is the slate's.
- Stage 4 and 8 duplicate each other. Make stage 8 the reverse: an unlabelled lamp's **frequency**
  is given, name its colour/wavelength (λ = c ÷ f). Keep the symbols card as its reward.
- Stage 7: label wavelengths in sensible units (radio 3 m, microwave 12 cm, X-ray 0.1 nm) and draw the
  spectrum as a log ruler with everyday-sized objects beside it (building, person, coin, cell, atom).
- Frequency box reads "× 10^14 per second", with the scientific-notation gloss once on stage 1.

#### q2-photon · Photons — **Tune (draw the photons)**
- From **stage 3** (when the card names the photon), a "Packet View" key appears: the beam is drawn
  as separate packets, each carrying an energy bar set by frequency; the plate shows a "grip" line
  (the work function, unnamed until stage 6). A packet whose bar clears the line knocks an electron
  out, with the leftover as its speed. Brightness = packets per second. Stages 1–2 stay wave-drawn so
  the puzzle is still a puzzle.
- Stage 8 analogy for the reward/rung 3: a machine that takes one coin per item — a sack of pennies
  never buys a dollar item.
- Stage 5 (E = hν) through the Formula Slate; afterwards the plate shows each packet's energy in zJ.
- Stage 6: Trend Plot of electron speed against frequency per metal makes "loosest grip wakes first"
  three offset lines.

#### q3-lines · Line Spectra — **Tune**
- Stage 2: a **reference strip slides over** the sealed tube's band (bar-code matching), instead of
  reading positions line by line.
- Stages 4–6: draw the ladder to energy scale; tapping a line draws its **drop arrow** whose length is
  the energy. Stage 6 becomes: lay the 5→2 arrow against the band's energy ruler and read where it
  lands; the Bohr arithmetic is available through the slate for the AP route, not required.
- Stage 5 through the slate.

#### q4-cloud · Orbitals — **Tune**
- Show each cloud as an **orbitable 3D point cloud** (T4 well, canvas drag-to-turn below T4)
  rather than three orthographic views; stages 5–7 ask the player to compare views, which is a
  spatial skill this audience does not have yet.
- Stage 8: replace "press Track and read the refusal" with a **precision dial**: tightening the
  position blur widens a speed blur, and their product never drops below a floor marked on the
  plate. The uncertainty principle becomes something you turn.
- Briefing analogy: a long-exposure photo of the moths round a lantern — you see where they spend
  time, not a path.

#### q5-numbers · Quantum Numbers — **Optional Deep Dive + Tune** (D2)
As built it is mostly reading numbers printed on the rack. Mark it optional, and rework stages 1–3
and 7–8 around an address analogy (floor → room type → room → bunk): the player *finds* a box from an
address and writes the address of a box, instead of reading numbers printed beside it. Stages 4–5
(spin, Pauli) keep — they are the two ideas `q6-filling` needs, and its card should say so.

#### q6-filling · Electron Configuration — **Tune**
- Add a **periodic-table strip** beside the rack that lights the element as each electron is added
  ("Add One Electron" walks across the table). Stage 4's 4s-before-3d and stage 6's blocks become
  table geography the player watches happen.
- Prompts 1, 3, 5 state the route; rewrite to objectives ("Build carbon as nature does").

#### q7-pes · Photoelectron Spectroscopy — **Tune (small)**
- Tapping a peak lights its subshell on a box/ring drawing beside the spectrum.
- Default the axis to the AP convention (binding energy increasing to the left) with a flip key,
  and say so on stage 1's card rather than in stage 3's.

#### q8-trends · Periodic Trends — **Tune**
- **Trend map** (W4): each atom measured fills its cell on a mini periodic table with its radius /
  ionization energy / pull. By stage 8 the across-and-down arrows are visible on a map the player
  made.
- Stage 1 analogy: two magnets — the pull grows with stronger magnets and drops off fast with
  distance.

#### q9-absorb · Spectroscopy — **Tune**
- Every cuvette shows **light in / light out** bars; absorbance is introduced as "how much it dims".
- Stages 5–6 feed one Trend Plot (A vs concentration, A vs path), so stage 7's rule is read off two
  straight lines through zero.

#### boss-eater · The Lantern-Eater — **Rebuild on instruments**
Phases on the light bench (a lamp the eater "drinks"), photocell, box rack + magnet, PES, cuvette —
each with a fresh specimen.

### Ligar — unit03

#### q1-joins · What Holds — **Tune**
- **Names, not codes** (W6) — 31 occurrences, prompts included.
- Animate the outcome: in an ionic press the electron **hops** across (± stencils appear); in a
  covalent press the pair **settles between** the atoms (tug of war, W4). Stage 3 is then a thing
  watched, not inferred from a needle.
- The full-shell lamp from `q2-core` on every atom (the pair board's octet lamp, introduced early).
- Stage 2 reward rewrite ("eight electrons — two, on the innermost one").

#### q2-lattice · Stone and Wire — **Tune + content decision**
- Stage 2: a **"Shift a Layer"** key slides one row of the lattice one place; like charges line up and
  the block springs apart. Rung 3's thought experiment becomes the experiment.
- **Metallic bonding is missing** though the quest is called "Stone and *Wire*" and AP Unit 2 covers
  metals and alloys. Default: add a copper block to stages 3 and 7 (conducts cold; bends under the
  hammer instead of shattering) and mention alloys on a card. See D-list.

#### q3-distance · Bond Energy — **Tune**
- **Marble in the well** (W4): a ball rides the trace at the current separation; a "Let Go" key
  releases the crank and the ball rolls to the bottom. "Lowest energy is where the pair settles" is
  then something seen.
- Stages 7–8 (lattice energy) are currently "read the ions and recall the rule". Put `q8-trends`'
  pull meter between the two ions so charge and distance are measured.
- Stage 1 prompt: remove the route.

#### q4-dots · Lewis Structures — **Tune**
- The tray shows **where electrons came from**: "O brings 6, H brings 1, H brings 1 = 8". Each lamp
  reads "needs 2 more" rather than just dark/lit.
- Stage 1 opens by having the player count the tray before drawing.

#### q5-resonance · Charge and Resonance — **Tune**
- **Ownership split** overlay (W4) for stages 1–3: formal charge stops being a formula and becomes
  counting what is on your side of the line.
- Stage 4 card analogy: a mule is not a horse half the time and a donkey the other half — it is
  always a blend. That is resonance.

#### q6-shape · Molecular Shape — **Keep**
Strong bench. Copy pass only; add the tied-balloons image to the briefing (the rig already uses
balloons for lone pairs).

#### q7-polarity · Polarity — **Keep (+ tug of war)**
Strong bench. Add the tug-of-war pair to stages 1–2 so "partial charge" has a picture before the
arrows do.

#### q8-hybrid · Hybridization — **Rework stages 2–4**
Stages 2–4 are three rounds of "press the key whose number matches". Rework: the player builds the
molecule on the **domain rig** (q6's instrument), the mixer sits beside it, and the stage asks for a
*sort*: CH₄, NH₃, H₂O, C₂H₄, CO₂, HCN into sp / sp² / sp³. The rule "domains = hybrid orbitals" is
found across six molecules, including two with lone pairs, which is the AP trap. Stages 5–7 (σ/π,
counting, twist) keep. Stage 8 is beyond the exam and keeps its tag (D2).

#### q9-orbitals · Molecular Orbitals — **Optional Deep Dive** (D2)
Bench is sound. Mark it optional; copy pass only.

#### boss-warden · Basalt Warden — **Keep**
Correct structure. Copy pass on phase prompts ("limb joints geared with square planar XeF₄
crystals" is noise).

### Bellows — unit04

#### q1-knocks · Pressure and Temperature — **Keep**
The best discovery bench on the road. Copy pass; flash each wall knock where it lands; Bench Log.

#### q2-laws · The Gas Laws — **Tune**
- Paired readouts + Trend Plot (W2) on every stage; the player's dots draw Boyle's curve and
  Charles's line.
- Stage 7 (combined) through the slate.

#### q3-ideal · The Ideal Gas Law — **Rework stages 2–7 onto the slate**
Every stage from 2 is a calculation the bench takes no part in. Each becomes a Formula Slate stage
fed from bench readings: the player picks P, V, n, T from the log and the right R for the gauge's
unit. Stage 7 needs the balanced equation **on a plate** (it is currently assumed).

#### q4-mixtures · Partial Pressures — **Rework stages 3–4**
- **Share bars** (W4). Merge stages 3 and 4 into one discovery: "Compare each gas's share of the
  particles with its share of the push." Use the freed stage for an AP-style "collect over water"
  reading (vapour pressure as a partial pressure), or keep stage 4 as a slate calculation.
- Stage 8 through the slate.

#### q5-speed · Speed and Escape — **Keep**
Copy pass. Stages 5–6 via the slate (Graham's law is beyond the exam and keeps its tag, D2).

#### q6-real · Real Gases — **Keep**
Name the meter in plain words on the plate: "Law check — reads 1 when the gas law is exact (PV ÷ nRT)".

#### boss-compressor · The Compressor — **Keep**
Phases 2–5 via the slate.

### Kettle — unit07

#### q1-recipe · The Same Recipe — **Rework**
- **Names, not codes** (W6) — 63 occurrences; `KINDS` is all codes.
- Stages 1, 3, 4 repeat `q1-grain` 5–6 and `q6-weigh` 2. Kettle is stoichiometry: rebuild those three
  around **mass conservation** (weigh before and after a joining on the balance) and **limiting
  reactant** on the scope (two heaps feeding a joiner until one runs out), which is what Kettle's later
  benches will need.
- Stage 5: remove option notes. Stage 6 (empirical formula) via the slate + mole map.

#### boss-golem · Recipe Golem — **Rebuild on instruments**
Scope + balance phases with fresh samples; phases 1–2 are currently arithmetic in the prompt.

---

## 5. Phasing

Each phase ends with `npm run verify` green. Browser testing is yours.

| Phase | What | Size |
|---|---|---|
| **0. Correctness** | P8 chemistry fixes in `q1-grain`; `q1-joins` 2 card; group numbering decision applied; P7 option notes removed; W6 CAT → names in `q1-joins`, `q1-recipe`, `quest-guide.js`, `lightdata.js`, `q7-pes` | S |
| **1. Copy pass** | Every prompt, briefing, reward to W5; route-giving prompts rewritten; `verify:learn` W5 rules as warnings, then failures | M |
| **2. Shared engine** | W1 Bench Log (2D + T4 plate), W2 Trend Plot + paired readouts, W3 Formula Slate | L |
| **3. Lanternfall wave + photon** | `q1-wave` rework (animated trace, paired readouts, plot, shared time base); `q2-photon` packet view | M |
| **4. Visual devices** | W4: seesaw, share bars, marble, ownership split, tug of war, full-shell lamp, trend map, mole map; wire into their benches | L |
| **5. Stage reworks** | `q2-core` 5, `q3-catalogue` 2/4/5/6, `q4-ledger` 5–7, `q6-weigh` 4–7, `q8-hybrid` 2–4, `q4-mixtures` 3–4, `q3-ideal` 2–7, `q1-recipe`, `q4-cloud` 8, `q3-lines` 2/6 | L |
| **6. Bosses** | Rebuild Hopper, Eater, Golem on instruments | M |
| **7. Deep Dives** | Optional flag in `curriculum.js` / `progress.js` and its tag in the three road screens; `q5-numbers` address rework | S–M |

Every reworked stage still exports `STAGES`/`SOLUTIONS`/`MISSES`/`stateFor` so `verify:learn` grades
it; every new instrument control goes through `verify:bench` and `verify:run`; `VOCABULARY` moves
with any stage that changes what its card teaches.

---

## 6. Decisions (settled 2026-10-14)

- **D1 — Calculation support: the slate computes.** The player chooses which reading goes in which
  slot, in which units; the bench does the digits and prints the result with its units. Practice
  problems (`practice.js`) still ask for hand calculation, so the AP skill is practised there.
- **D2 — Beyond-the-exam benches are kept and marked optional.** `q5-numbers` and `q9-orbitals` carry a
  "Deep Dive" tag on the road, the star map and the walk HUD, and the next bench in the world opens
  whether or not they are done (`progress.js` treats an optional quest like a charted one: it never
  holds the one after it shut). Single beyond-the-exam stages (`q8-hybrid` 8, `q5-speed` 5–6,
  `q6-real` 7, `q6-filling` 8) stay in their quests with the tag on their card, as now.
  `q5-numbers` still gets the address analogy and loses its read-the-rack stages.
- **D3 — Hopper, Lantern-Eater and Recipe Golem are rebuilt on instruments in this pass** (Phase 6).
- **D4 — Story lives in the `.lq-story` line only.** The prompt is one plain question or imperative,
  ≤ 25 words, no setting clause, no "!". `CLAUDE.md`'s objective paragraph was changed to say so.

Defaults taken (no objection raised):
- **Group numbering**: real 1–18 labels with a marked d-block gap in `q3-catalogue`.
- **Metallic bonding**: add a copper block to `q2-lattice` 3 and 7.
- **Predict-first**: not added (it would put a step in front of the bench on every stage).


---

## 7. Build record (audited 2026-10-15)

What stands, what parted from the plan, and what is still open. `npm run verify` is green with all of it.

**Built**
- **Copy (W5/W6).** Every prompt is one sentence of at most 25 words with no "!" and no setting clause; `CAT nn` codes survive
  only on `q1-wave` stage 8's card; briefings never open "Welcome to". `verify:learn` enforces prompt length, one sentence, no
  "!", the setting-clause check, the reading-level list, briefing rules, CAT codes, **a right option's note may not repeat its
  label, and hint rung 3 may not carry the answer** (it found real leaks, now fixed). Reward length over 45 words is a
  *warning* (55 cards), not a failure.
- **Engine.** `benchlog.js` (W1), `trendplot.js` + paired readouts (W2), `slate.js` (W3), `visual-devices.js` (W4) and
  `LearnFrame.setDevice(paint)`, a small canvas on the stage card that paints a device on every tier, built bench or drawn one.
- **Devices live:** seesaw (`q5-assay`, with a *Try a mix* dial on stage 6 and a "WEIGHED" mark; it prints no average), mole map
  (`q6-weigh` stages 6-8, no molar mass printed), share bars (`q4-mixtures` 3-4, drawn from the same planner as the gauge),
  trend map (`q8-trends` 3, 4, 8), periodic strip (`q6-filling`), tug of war (`q7-polarity`), marble (bond bench), full-shell
  lamp (core bench and join bench), ownership counts (pair board).
- **Instruments.** Animated light-bench trace with paired readouts and a trend plot (`q1-wave`), packet view (`q2-photon`),
  count dial (`q6-weigh` 4), axis flip (`q7-pes`, AP convention by default), reference strip, precision dial, shift-a-layer and
  a metallic block, bench log rows on `q1-grain` 3, `q1-wave` and the gas rig (`log: ['V', 'P']`), paired readouts + plot on
  `q2-laws` 1, 5, 6 and `q9-absorb` 5, 6 (`pair`, `trendPlot`), tray source line and "needs N" under dark lamps (`q4-dots`).
- **Stage reworks:** `q3-catalogue` 2/4/5/6 and the 1-18 group labels, `q4-ledger` 5-7 (charge tray), `q8-hybrid` 3-4 (a sort,
  lone pairs and multiple bonds), `q4-mixtures` 3-4, `q3-ideal` onto the slate, `q2-core` 5.
- **Bosses (D3).** Hopper, Lantern-Eater and Golem each run on the real instruments with fresh specimens; no phase prompt
  carries a figure the bench must give and no readout names an answer.

**Parted from the plan**
- Packet view is automatic from stage 3 (no key); the shift key and copper block are in `q2-lattice`.
- `q8-hybrid` stages 3-4 carry no mixer plate: five plates did not fit the glass at 4:3 (`verify:bench`).
- `q1-recipe` kept its spine (fixed composition); only its route-giving prompts were rewritten.

**Built after the audit (2026-10-15, second pass)**
- **The `.lq-story` line was cut back to a quiet lead** (decided 2026-10-15). It had been hidden by CSS; once shown, 270 one-per-stage
  lines proved mostly to restate the prompt or give away the finding (for example the isotope seesaw's "leaning toward the common
  isotope"). It is now sparse (about 40 lines, 1-based by stage number in `stage-story.js`), italic and muted above the prompt, written
  only where something is at stake, and absent on bosses. D4 now reads: the world lives in the saga, the briefings and the Case File,
  with at most this lead; the prompt carries none of it.
- **`q4-cloud` turning plates.** Stages 5-7 use `plane: 'turn'`: one square plate per sample showing the whole cloud in three
  dimensions, shared by every plate on the bench so two clouds are always compared from the same side. Keys `Turn Left / Turn Right /
  Tilt Up / Tilt Down / Reset View` step 30 degrees (so every axis-on view is reachable), and a drag on the plate turns it
  continuously on the drawn bench; dots nearer the eye are bigger and brighter, an x / y / z triad names the axes, and `Slice` cuts
  the slab across the line of sight. At T4 the glass block holds the same view. `projectDots` is the one projection; `verify:learn`
  checks that a plate turned to zero is the xy view, that a turn never changes a dot's distance from the nucleus, and that a slice is a
  slab across the view. Stage 8's precision dial and the long-exposure briefing were already in.
- **`q5-numbers` address finder.** The box rack's `address` layout carries a `finder`: tappable cells (floor n, suite type l with a drawn
  shape, room ml, bunk ms) and the box the address names lights on the rack, or the strip says no room has that address. Stages 1-3, 7
  and 8 no longer print any number beside a row: stage 1 lights a floor and its cloud, stage 2 lights a suite row (the options now
  differ in *which* shapes, not how many), stage 3 asks which box an address names, stage 7 asks the player to write the address of a
  ringed electron by setting cells until the lit box is the ringed one, and stage 8 is "which addresses light nothing". Stages 4-5 keep the
  labelled board. `findRoom` (`electrons.js`) is the one rule and `verify:learn` holds the finder to `validAddress` for every set.
  Set D of stage 8 moved from n = 4 to n = 3 so every address lands on a row the rack shows.
- **`q1-recipe` joiner and balance.** Stage 3 is now *Weigh Before and After* (conservation of mass; a molecule weighs what its atoms
  weigh) and stage 4 *One Heap Runs Out* (the limiting reactant). Both use two loose heaps, a **Join One Molecule** key and, on stage 3,
  a **Weigh Bench** key that writes the whole bench's weight into the bench log. The joiner and the balance live in the quest, not the
  engine: the joiner changes the counts the scope is re-poured from, the balance sums them. The two-oxides stage went; stage 7 now owns
  the cutter's briefing, and a practice problem on the limiting reactant replaced the CO / CO2 one. `verify:learn` runs each joiner to
  the end and holds the graded answer to what comes out.
- **Readings board at T4** (`bench-readings.js`, `BenchViewer3D.setReadings`). The bench log, the trend plot and the stage's device are
  mirrored onto one raked slate on the plate beside the key bank, so folding the plates away to look at the instrument no longer takes
  the readings with it. It is a read-only mirror of the frame's cards (`LearnFrame.readingsSnapshot`, polled four times a second) and
  keeps nothing; pinning stays on the card. `verify:bench` holds it to the plate, the glass, the instrument and the key bank. On the two
  fullest benches (the sampler scope and the ledger bench at their widest stages) there is no free plate beside the keys and the board
  is not shown; the cards still hold the readings there.

**Decided against**
- `q7-pes` tap-a-peak lighting a subshell (settled 2026-10-15): it would do stage 8's job of turning peaks into a configuration.

**Still open**
- Nothing from the original list. Two small things remain true of what was built: the readings board is absent on the two fullest benches
  (above), and `quest-guide.js` still describes `q1-recipe` by its old stages (the guide has no callers).
