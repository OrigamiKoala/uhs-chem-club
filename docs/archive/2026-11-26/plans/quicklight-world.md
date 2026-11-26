# Quicklight (`unit11`): Kinetics — World Spec & Build Record

**World:** Quicklight (`unit11`, World 11 in road order)  
**Subject:** Chemical Kinetics (AP Chemistry Unit 5, Topics 5.1–5.11, plus Topic 9.4 kinetic control)  
**Place:** Storm belt — high-altitude fuel cracking towers and catalyst decks  
**Target audience:** Students aged 12–17, first-time chemistry learners  
**Structure:** 6 benches (35 stages) + 1 boss (`boss-flare`, 5 phases) = 40 stages total  
**Status:** Phase 0 Spec (2026-11-12); site rebuilt 2026-11-17 (section 7)

---

## 1. CED Map (AP Chemistry Unit 5 + 9.4)

| CED Topic | Title | Bench & Stage | Notes / Calculation |
| --- | --- | --- | --- |
| **5.1** | Reaction Rates | `q1-watch` s1–s6, `boss-flare` p1 | Rate as $\Delta[\text{product}]/\Delta t$ (steepness of curve); typed average rate (s3, boss p1); stoichiometry tie $2\,\text{A} \to \text{B}$ (s5); concentration, temperature, surface area, volume effects (s6). |
| **5.2** | Introduction to Rate Law | `q2-law` s1–s5, `boss-flare` p2 | Initial rates method (s1–s2); orders & rate law $\text{rate} = k[\text{A}]^m[\text{B}]^n[\text{C}]^p$ (s3, boss p2); typed rate constant $k$ with units shown on field (s4); typed predicted rate for unmeasured run (s5). |
| **5.3** | Concentration Changes Over Time | `q3-time` s1–s5, `boss-flare` p3 | Constant half-life for first order (s1); typed fraction left $(1/2)^n$ after $n$ half-lives (s2, boss p3); linear plotter $[A]$, $\ln[A]$, $1/[A]$ vs $t$ for 0th/1st/2nd order (s3–s4); typed $k = 0.693 / t_{1/2}$ (s5). Slope-to-$k$ for 0th/2nd order reinforced in `unit11.json` bank. |
| **5.4** | Elementary Reactions | `q5-steps` s4 | Molecularity of elementary steps; rate law directly from colliding particles in one elementary step ($A + B \to C$ vs $2A \to C$). |
| **5.5** | Collision Model | `q4-collide` s1–s4 | Prediction (s1); kinetic energy threshold (s2); orientation requirement (s3); Maxwell–Boltzmann distribution shift with $T$ and $E_a$ threshold bar (s4). |
| **5.6** | Reaction Energy Profile | `q4-collide` s5–s6, `boss-flare` p4 | Activation energy $E_a$ from reactants to transition state (s5, boss p4); typed reverse $E_a = E_a - \Delta H$ (s6). Arrhenius equation calculations excluded per CED 5.6 Exclusion Statement. |
| **5.7** | Introduction to Reaction Mechanisms | `q5-steps` s1–s2 | Elementary steps sum to overall equation (s1); intermediate formed and consumed (s2). |
| **5.8** | Reaction Mechanism and Rate Law | `q5-steps` s3, s5, `boss-flare` p5 | Slowest step is rate-determining step (s3); testing proposed mechanism against measured rate law (s5, boss p5). |
| **5.9** | Pre-Equilibrium Approximation | `q5-steps` s6 | Fast reversible step before slow step; substituting intermediate concentration into rate law. |
| **5.10** | Multistep Reaction Energy Profile | `q5-steps` s7 | Two-humped energy profile; intermediate in valley; higher hill is rate-determining step. |
| **5.11** | Catalysis | `q6-shortcut` s1–s5 | Catalyst speeds reaction and is regenerated unchanged (s1–s2); lowers $E_a$ without changing $\Delta H$ (s3); catalyst vs intermediate in mechanism stack (s4); heterogeneous surface catalysis & enzyme active site (s5). |
| **9.4** | Thermodynamic vs Kinetic Control | `q4-collide` s7 | Downhill $\Delta H < 0$ reaction (diamond $\to$ graphite) that does not proceed at room temperature due to huge $E_a$. |

---

## 2. Bench List (Teaching Order)

| # | Quest ID & Title | Idea Thread | Instrument Family | The One Click (Wrong Model Contradicted) | Story Stake, Lead Line & `Filed:` | `BUILDS_ON` | Words Earned (`VOCABULARY`) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `q1-watch` · How Fast (6) | Reaction rate is how fast concentration changes; it slows as reactant is consumed; concentration, temperature, and surface area speed it up. | Kinetic vessel + curve + `tapZones` | **s1–s2:** Students think a faster reaction *ends higher* (makes more product). The clip & two vessels end at the exact same product level; the faster one is *steeper*. | **Stake:** Cracking tower vents are spiking early. **Lead:** "Two feed lines yield the same fuel, yet one tower is already overheating." **Filed:** "Filed: the overheated tower makes the same product, just faster in the first seconds." | `[]` | `reaction rate` (s2) |
| 2 | `q2-law` · The Rate Law (5) | Doubling a concentration multiplies the rate by a measured factor; those powers form the rate law with rate constant $k$. | Kinetic vessel + `rateslog` + `rateboard` | **s2:** Students think stoichiometric coefficients equal rate-law orders. Doubling $B$ quadruples rate while doubling $C$ does nothing, even though $C$ is in the equation. | **Stake:** Adding inhibitor or changing one feed doesn't always slow the spike. **Lead:** "Three feeds enter the manifold, yet only two change how fast the tank heats." **Filed:** "Filed: changing one feed left the rate flat; the equation alone never tells the orders." | `['unit11/q1-watch']` | `rate law` (s3), `order` (s3), `rate constant` (s3) |
| 3 | `q3-time` · Concentration Over Time (5) | A first-order reaction halves in equal intervals ($t_{1/2} = 0.693/k$); which plot ($[A]$, $\ln[A]$, $1/[A]$) is straight identifies the order. | Kinetic vessel + `plotter` (3 keys + straightedge) | **s1:** Students think the second halving takes longer because the reaction has slowed down. Markers on the curve show the second halving takes the *exact same time*. | **Stake:** Unchecked decomposition in the reserve tanks. **Lead:** "Half the peroxide broke down in twenty seconds; how long until half of what remains is gone?" **Filed:** "Filed: first-order decay halves in equal intervals; a straight ln[A] line gives k." | `['unit11/q2-law']` | `half-life` (s1), `first order` (s3), `zero order` (s4), `second order` (s4) |
| 4 | `q4-collide` · Collisions and the Hill (7) | Particles react only when they collide with enough energy ($E_a$) and proper orientation; $T$ raises the fraction above $E_a$; $E_a$ is the barrier height. | `collview` + `mbhist` (with $E_a$ bar) + `kprofile` | **s1–s2:** Students think every collision (or half of them) reacts. Slow-motion pairs bounce unless speed *and* orientation meet; $10\text{ K}$ warming nearly doubles the tail past $E_a$. | **Stake:** Why cold storage stops a reaction that releases huge heat. **Lead:** "Fuel vapour sits in the cold tank without burning, even though burning releases energy." **Filed:** "Filed: collisions need enough energy and the right orientation to clear the activation barrier." | `['unit11/q1-watch']` | `collision model` (s3), `activation energy` (s4), `energy profile` (s5), `transition state` (s5) |
| 5 | `q5-steps` · Steps (7) | Most reactions proceed in elementary steps; the slowest step sets the rate; a rate law tests a mechanism (including pre-equilibrium). | `stack` + `kvessel` (2-step) + `collview` + `rateboard` + `kprofile` (2-hump) | **s3 & s5:** Students think speeding *any* step speeds the reaction, or that the overall equation gives the rate law. Speeding the fast step changes nothing; only the slow step's collision counts. | **Stake:** Finding which step in the Fifth's additive chain drives the spike. **Lead:** "The additive runs in two steps, and only one of them controls how fast the tank burns." **Filed:** "Filed: the slowest elementary step sets the rate law and builds the highest hill." | `['unit11/q2-law', 'unit11/q4-collide']` | `elementary step` (s1), `mechanism` (s1), `intermediate` (s2), `rate-determining step` (s3) |
| 6 | `q6-shortcut` · Catalysts (5) | A catalyst provides an alternate path with a lower activation energy and is regenerated unchanged. | `kvessel` (catalyst) + `kprofile` (2-path) + `stack` + `collview` (surface) | **s1–s2:** Students think an accelerator is used up like a reactant, or lowers $\Delta H$. The catalyst count is identical at the end, and $\Delta H$ never moves. | **Stake:** Identifying the Fifth's catalytic dust in the vents. **Lead:** "A trace of powder in the vent speeds the burn tenfold and never runs out." **Filed:** "Filed: the Fifth's dust is a catalyst; it lowers the activation barrier and comes out unchanged." | `['unit11/q4-collide', 'unit11/q5-steps']` | `catalyst` (s2), `heterogeneous catalyst` (s5), `enzyme` (s5), `active site` (s5) |
| B | `boss-flare` · The Flare (5 phases) | Re-tests `q1`–`q5` on a fresh refinery case; no new ideas. | Same kit fixtures + Flare foe | — | No lead line. Finale: Flare dispersed, case filed to Act III. | `['unit11/q1-watch'..'unit11/q6-shortcut']` | none |

---

## 3. Stage Tables (Held to the 7 Standards)

### `q1-watch` · How Fast (6 stages)

| # | Stage | Briefing (≤2 sent.) | Objective / Prompt (≤25 words) | Evidence on Bench | Printed Text & Leak Check | Wrong Answers & Miss Messages | Hints (1: control, 2: notice, 3: reason) | Reward (≤40 words) | 2D/3D & Ramp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Fast and Slow (`predict: true`) | — | Two reactions end with the same amount of product: how does the faster one's graph differ? | `lead` clip showing a reaction vessel starting to form product over time, plus 3 prediction cards. | Only card choices ("It climbs more steeply", "It ends higher", "It starts later"). No answer printed. | Any guess accepted (predict stage, ungraded). | 1. Watch how the curve in the preview climbs as product forms. 2. A faster reaction makes more product in each second. 3. Reaching the same final amount in less time changes the slope, not the height. | **Prediction Locked.** You locked in your prediction. Now run two vessels side by side to test it. | Flat (`lead` + cards) |
| 2 | Two Vessels | Reaction rate is how fast the concentration of a substance changes, in moles per litre (mol/L) each second. | Which reaction has the higher rate? | Two `kvessel`s side by side, both starting at $0.40\text{ mol/L}$ reactant and ending at $0.40\text{ mol/L}$ product. Clicking "Run" animates particles changing colour and plots both product curves. | Vessel labels "Vessel 1" and "Vessel 2", "Run" button, curve axes `Product (mol/L)` vs `Time (s)`. No rate number printed. | Vessel 1 (slower): "Vessel 2 reached 0.40 mol/L product in 10 s while Vessel 1 took 25 s." Blank: "Press Run on both vessels, then tap the faster one." | 1. Press "Run" on both vessels and tap the one that finishes sooner. 2. Compare how steeply the two product lines climb. 3. Both end at 0.40 mol/L, so the steeper line made product faster. | **Reaction Rate.** Vessel 2's product rose faster, so its line is steeper. The steepness of the concentration-time line is the reaction rate. | Flat (`kvessel` × 2, `choice`) |
| 3 | Putting a Number on It (`entry`) | Reaction rate equals change in concentration divided by time. For a run that drops from 0.40 to 0.10 mol/L in 20 s, the change is 0.30 mol/L and the rate is 0.015 mol/L each second. | What is the average rate of this reaction over its first 10 seconds, in mol/L each second? | One `kvessel` run ($0.60\text{ mol/L}$ at $0\text{ s}$ to $0.20\text{ mol/L}$ at $10\text{ s}$, so $\Delta c / \Delta t = 0.40 / 10 = 0.04\text{ mol/(L}\cdot\text{s)}$). Two points marked on the curve with their values. | Coordinates `(0 s, 0.60 mol/L)` and `(10 s, 0.20 mol/L)`. Answer `0.04` is never printed. | `0.40` (forgot to divide by 10): "At 0.40 mol/L each second, 10 s would use 4.00 mol/L, more than the 0.60 mol/L present." `0.02` (used final conc / 10): "At 0.02 mol/L each second, 10 s would leave 0.40 mol/L, not 0.20 mol/L." `0.06` (used initial conc / 10): "At 0.06 mol/L each second, 10 s would use all 0.60 mol/L." | 1. Press "Run" to trace the curve and read the two marked points. 2. Find how much the reactant concentration dropped between 0 s and 10 s. 3. Divide that concentration change by the 10 s time interval. | **Average Rate.** Over 10 seconds the concentration fell 0.40 mol/L, giving an average rate of 0.04 mol/L each second. | Flat (`kvessel` + `entry`), **Ramp:** worked case in briefing → typed new case |
| 4 | Slowing Down | — | Where on this curve is the reaction fastest? | One `kvessel` with a first-order curve that starts steep and flattens out as reactant particles are used up. Three `tapZones` along the curve: Start (`0–5 s`), Middle (`10–15 s`), End (`20–30 s`). | Zone labels `0–5 s`, `10–15 s`, `20–30 s`. No instantaneous rate printed. | Middle: "Between 10 s and 15 s the line is already gentler than at 0–5 s." End: "Between 20 s and 30 s the line is nearly flat and few reactant particles remain." | 1. Press "Run", watch the particles, and tap one of the three stretches on the curve. 2. Compare how steep the curve is at the start versus the end. 3. The reaction is fastest where the curve is steepest and most reactant remains. | **Rate Over Time.** At the start, most reactant is present and the curve is steepest. As reactant is used up, the curve flattens and the rate falls. | Flat (`kvessel` + `tapZones`) |
| 5 | Two for One | — | For 2 A → B, how does the rate at which A is used compare with the rate at which B forms? | One `kvessel` running `2 A → B` with live particle change counts (`A used`, `B formed`) and two concentration curves (A falling twice as steeply as B rises). | Equation `2 A → B`, live counts `A used: 12`, `B formed: 6` (never prints "twice as fast"). | "The same": "The counter shows 12 A used while only 6 B formed." "Half as fast": "The counter shows more A used than B formed in the same time." | 1. Press "Run" and watch the counts of A used and B formed. 2. Compare the number of A particles lost with the number of B particles gained. 3. Two A must react for every one B made, so A changes faster by that ratio. | **Stoichiometry and Rate.** Two A particles are used for each B formed, so A disappears twice as fast as B appears. | Flat (`kvessel` + cards) |
| 6 | Three Changes | — | Which changes make this reaction faster? | One `kvessel` with a "Change" selector dial (`Baseline`, `More A`, `Higher T`, `Powdered solid`, `Larger vessel`). Each run overlays its curve against the dashed Baseline curve. Four change cards + 3 trays (`Faster`, `Slower`, `No change`). | Change names only; no "faster/slower" labels on the dial. | Placing `Larger vessel` in `Faster`: "In the larger vessel, the curve climbs more gently than the dashed baseline." Placing `Higher T` in `Slower`: "At higher temperature, the curve climbs more steeply than the dashed baseline." | 1. Pick each setting on the "Change" dial, press "Run", and compare its curve with the dashed baseline. 2. See which changes give a steeper curve than the baseline. 3. More particles in the same volume, faster particles, and more exposed surface all speed collisions; a larger volume spreads them out. | **Factors Affecting Rate.** Higher concentration, higher temperature, and smaller pieces (more surface area) all gave steeper lines. A larger vessel spread particles out and slowed the rate. | Flat (`kvessel` + dial + cards) |

### `q2-law` · The Rate Law (5 stages)

| # | Stage | Briefing (≤2 sent.) | Objective / Prompt (≤25 words) | Evidence on Bench | Printed Text & Leak Check | Wrong Answers & Miss Messages | Hints (1: control, 2: notice, 3: reason) | Reward (≤40 words) | 2D/3D & Ramp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Doubling A | The initial-rates log records the starting concentrations you set and the initial rate measured for each run. | When the concentration of A doubles, what happens to the rate? | `kvessel` with `[A]` dial (`0.10`, `0.20`, `0.40 mol/L`), `[B]` and `[C]` fixed, and `rateslog` recording each run (`[A]`, `[B]`, `[C]`, `Initial rate`). Four cards (`No change`, `Doubles`, `Four times`, `Halves`). | Log headers and numbers (`0.10 → 0.005`, `0.20 → 0.010`, `0.40 → 0.020`). Never prints "Doubles" or "order 1". | `Four times`: "From [A] = 0.10 to 0.20, the logged rate rose from 0.005 to 0.010, a factor of 2." `No change`: "Doubling [A] from 0.10 to 0.20 changed the rate from 0.005 to 0.010." | 1. Set "[A]" to 0.10 and 0.20 mol/L, press "Run" for each, and read the log. 2. Compare the two initial rates in the log when [A] doubles. 3. Dividing the second rate by the first gives the factor. | **First Order in A.** Doubling [A] doubled the initial rate. Rate is directly proportional to [A]. | Flat (`kvessel` + `rateslog` + cards) |
| 2 | B and C | — | What does doubling B do to the rate, and what does doubling C do? | `kvessel` with `[B]` dial (`0.10`, `0.20`) and `[C]` dial (`0.10`, `0.20`) + `rateslog`. Two cards (`B`, `C`) sorted into 3 trays (`No change`, `Doubles`, `Four times`). | Reaction `A + 2 B + C → products` printed on vessel; log records runs. Never prints orders. | `B` in `Doubles`: "When [B] doubled from 0.10 to 0.20 with [A] and [C] fixed, the rate rose from 0.010 to 0.040." `C` in `Doubles`: "When [C] doubled from 0.10 to 0.20 with [A] and [B] fixed, the rate stayed 0.010." | 1. Run two trials changing only "[B]", then two trials changing only "[C]". 2. Check how much the logged rate changes when each concentration doubles. 3. A rate that becomes four times as large is 2²; an unchanged rate means that reactant has zero effect. | **Each Reactant's Order.** Doubling B made the rate four times as large and doubling C changed nothing. The equation never tells you this; only the runs do. | Flat (`kvessel` + `rateslog` + cards) |
| 3 | Writing the Law | A rate law writes the rate as a constant, k, times each concentration raised to a power called its order: 1 if doubling doubles the rate, 2 if four times, 0 if no change. | What is the rate law for this reaction? | Filled `rateslog` from stages 1–2 (`[A]` doubles → 2×, `[B]` doubles → 4×, `[C]` doubles → 1×) beside `rateboard` (`rate = k[A]^?[B]^?[C]^?` with power dials `0, 1, 2, 3`). | Log rows and `rate = k[A][B][C]` template. Answers `1, 2, 0` not printed. | `k[A]¹[B]¹[C]¹`: "In the log, doubling [B] multiplied the rate by 4, and doubling [C] left it unchanged." `k[A]¹[B]²[C]¹`: "In the log, doubling [C] from 0.10 to 0.20 left the rate at 0.010." | 1. Turn the power dials on the rate-law board to match the log. 2. Match each reactant's doubling factor to its power: 1× → 0, 2× → 1, 4× → 2. 3. Use 2¹ = 2, 2² = 4, and 2⁰ = 1 to set the powers on A, B, and C. | **Rate Law & Orders.** rate = k[A][B]². The reaction is first order in A, second order in B, and zero order in C, with rate constant k. | Flat (`rateslog` + `rateboard`) |
| 4 | Finding k (`entry`) | To find k, plug one row from the log into the rate law. For rate = 0.020 = k × 0.10 × 0.20², k = 0.020 ÷ 0.0040 = 5.0. | What is the rate constant k for this reaction? | `rateslog` with two rows for `2 NO + O₂ → 2 NO₂` (`rate = k[NO]²[O₂]`: Row 1: `[NO]=0.10, [O₂]=0.10, rate=0.0020`; Row 2: `[NO]=0.20, [O₂]=0.10, rate=0.0080`; so $k = 0.0020 / (0.01 \times 0.10) = 2.0\text{ L}^2/(\text{mol}^2\cdot\text{s})$). | Rate law `rate = k[NO]²[O₂]` and 2-row log; field carries unit `L²/(mol²·s)`. Answer `2.0` not printed. | `0.2` (forgot to square `[NO]`): "With k = 0.2, row 1 gives 0.2 × 0.10² × 0.10 = 0.00020, not 0.0020." `0.002` (copied rate): "With k = 0.002, row 1 gives 0.0000020, not 0.0020." | 1. Read row 1's concentrations and initial rate from the log, then type k. 2. Square [NO] before multiplying by [O₂]. 3. Divide the measured rate by [NO]² × [O₂] to isolate k. | **Rate Constant k.** Dividing row 1's rate by 0.10² × 0.10 gives k = 2.0 L²/(mol²·s). Row 2 gives the exact same k. | Flat (`rateslog` + `entry`), **Ramp:** worked in briefing → typed new case |
| 5 | A Run Not Made (`entry`) | — | What will the rate be in run 3? | Same `rateslog` (`rate = k[NO]²[O₂]`, $k = 2.0\text{ L}^2/(\text{mol}^2\cdot\text{s})$) with Row 3 (`[NO]=0.30, [O₂]=0.20, rate = ?`). Vessel can run Rows 1–2 only; Row 3 unlocks after grading. | `rate = 2.0 [NO]²[O₂]`, Row 3 `[NO]=0.30, [O₂]=0.20`. Answer `0.036` not printed. | `0.12` (forgot to square `[NO]`): "0.12 treats [NO] as first order instead of squared." `0.018` (used `[O₂]=0.10`): "0.018 uses [O₂] = 0.10 rather than 0.20." | 1. Use the rate law and k from runs 1–2 with run 3's concentrations, then type the rate. 2. Remember [NO] is squared while [O₂] is to the first power. 3. Multiply 2.0 × 0.30² × 0.20. | **Predicting a Rate.** With k = 2.0, run 3 gives 0.036 mol/(L·s). A rate law summarizes the runs so you can predict unmeasured ones. | Flat (`rateslog` + `kvessel` + `entry`) |

### `q3-time` · Concentration Over Time (5 stages)

| # | Stage | Briefing (≤2 sent.) | Objective / Prompt (≤25 words) | Evidence on Bench | Printed Text & Leak Check | Wrong Answers & Miss Messages | Hints (1: control, 2: notice, 3: reason) | Reward (≤40 words) | 2D/3D & Ramp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Half, Then Half Again | — | How does the time for the second halving compare with the first? | `kvessel` running first-order `2 N₂O₅ → 4 NO₂ + O₂` from `0.80 mol/L`. As it runs, markers drop at `0.40 mol/L` (`t = 20 s`) and `0.20 mol/L` (`t = 40 s`), printing `1st halving: 20 s` and `2nd halving: 20 s`. Three cards (`Longer`, `The same`, `Shorter`). | Curve + halving markers (`20 s`, `20 s`). Answer "The same" not printed as a verdict. | `Longer`: "The markers on the curve show 20 s for the first halving and 20 s for the second." `Shorter`: "Both halvings took 20 s on the curve." | 1. Press "Run" and watch the halving markers appear on the curve. 2. Compare the time marked for the first halving with the second. 3. When both intervals are equal, the halving time is constant. | **Half-Life.** Each halving took 20 s. That constant interval is the half-life of a first-order reaction. | Flat (`kvessel` + cards) |
| 2 | After Three Half-Lives (`entry`) | After 2 half-lives, half of a half remains: ½ × ½ = ¼ (0.25). | What fraction of the reactant is left after three half-lives? | Same `kvessel` curve showing `t = 0 s (1.00)`, `t = 20 s (0.50)`, `t = 40 s (0.25)`, with `t = 60 s` past the plot's right edge. | Plot ends at `45 s`. Answer `0.125` / `1/8` not printed. | `0.25` (2 half-lives): "0.25 is the fraction left after 2 half-lives (40 s), not 3." `0.333` (1/3): "Each half-life multiplies the remaining amount by ½, not 1/3." | 1. Read the remaining fractions at 1 and 2 half-lives on the curve, then type the fraction at 3. 2. Each half-life cuts the remaining amount in half again. 3. Multiply ½ × ½ × ½ (or divide 0.25 by 2). | **Repeated Halving.** After three half-lives, ½ × ½ × ½ = ⅛ (0.125) remains. Each half-life multiplies what is left by one-half. | Flat (`kvessel` + `entry`), **Ramp:** worked in briefing → typed past plot |
| 3 | Which Plot Is Straight | The plotter redraws the same concentration readings three ways: [A], ln[A], or 1/[A] against time. Here ln is the natural logarithm key on your calculator, used to straighten a curve. | Which plot of this reaction's readings is a straight line? | `plotter` loaded with first-order `N₂O₅` readings (`0.80, 0.40, 0.20, 0.10 mol/L` at `0, 20, 40, 60 s`), three mode keys (`[A]`, `ln[A]`, `1/[A]`), and a straightedge line showing fit. Three cards (`[A] vs t`, `ln[A] vs t`, `1/[A] vs t`). | Three mode keys and straightedge. Never prints "first order" or which is straight. | `[A] vs t`: "Against the straightedge, [A] vs time curves downward." `1/[A] vs t`: "Against the straightedge, 1/[A] vs time curves upward." | 1. Tap each of the three plotter keys ("[A]", "ln[A]", "1/[A]") and check against the straightedge. 2. See which set of points lies directly on the straight line. 3. A first-order exponential decay becomes linear when you plot ln[A] against time. | **First-Order Plot.** Plotting ln[A] against time gives a straight line. That straight line is the signature of a first-order reaction. | Flat (`plotter` + cards) |
| 4 | Three Reactions | — | What is the order of each reaction? | `plotter` with a Reaction selector (`R1`, `R2`, `R3` — zero, first, and second order) and the 3 plot keys (`[A]`, `ln[A]`, `1/[A]`). Three cards (`R1`, `R2`, `R3`) sorted into 3 trays (`Zero order`, `First order`, `Second order`). | Tray labels name only the order (`Zero order`, `First order`, `Second order`), NOT which plot is straight! | Placing zero-order `R1` in `First order`: "For R1, [A] vs time is straight, while ln[A] vs time curves." Placing second-order `R3` in `First order`: "For R3, 1/[A] vs time is straight, while ln[A] vs time curves." | 1. Select each reaction ("R1", "R2", "R3") and tap "[A]", "ln[A]", and "1/[A]" to find which plot is straight. 2. Remember: straight [A] is zero order, straight ln[A] is first order, straight 1/[A] is second order. 3. Match each reaction's straight plot to its order tray. | **Integrated Rate Laws.** Zero-order gives a straight [A] plot, first-order gives a straight ln[A] plot, and second-order gives a straight 1/[A] plot. | Flat (`plotter` + cards) |
| 5 | k From the Half-Life (`entry`) | For a first-order reaction, k = 0.693 ÷ half-life. A reaction with a 10 s half-life has k = 0.693 ÷ 10 = 0.0693 each second. | What is k for this first-order reaction? | `kvessel` run showing `t½ = 15 s` (`0.80 → 0.40` at `15 s`), plus a `plaque` showing `t½ = 0.693 / k`. Entry unit: `1/s`. Answer: `0.693 / 15 = 0.0462`. | Plaque `t½ = 0.693 / k` and `t½ = 15 s` on curve. Answer `0.0462` not printed. | `10.4` (`0.693 × 15`): "0.693 × 15 gives 10.4, which would give a half-life under 0.1 s." `21.6` (`15 / 0.693`): "Dividing 15 by 0.693 inverts the formula." | 1. Read the half-life from the curve markers, then type k. 2. Use the relation on the plaque: k = 0.693 ÷ half-life. 3. Divide 0.693 by 15 s. | **Half-Life and k.** A half-life of 15 s gives k = 0.693 ÷ 15 = 0.0462 each second. Shorter half-lives mean larger k. | Flat (`kvessel` + `plaque` + `entry`), **Ramp:** worked in briefing → typed |

### `q4-collide` · Collisions and the Hill (7 stages)

| # | Stage | Briefing (≤2 sent.) | Objective / Prompt (≤25 words) | Evidence on Bench | Printed Text & Leak Check | Wrong Answers & Miss Messages | Hints (1: control, 2: notice, 3: reason) | Reward (≤40 words) | 2D/3D & Ramp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Every Collision? (`predict: true`) | — | Of the collisions between reactant particles, how many lead to reaction? | `lead` clip of particles bouncing in a vessel with occasional flashes. Three cards (`All of them`, `About half`, `A small share`). | Only card choices. | Any guess accepted (ungraded). | 1. Watch the preview vessel carefully as particles collide. 2. Count how many collisions just bounce apart compared with how many change colour. 3. Most collisions lack the right energy or angle, so only a small fraction react. | **Prediction Locked.** You locked in your prediction. Now test individual collisions in slow motion. | Flat (`lead` + cards) |
| 2 | Hard and Soft | — | Which collisions will react? | `collview` with 6 head-on collision pairs (`Pair 1`..`Pair 6`), each showing speed arrows (short/slow vs long/fast). Pairs 1–4 can be played right away (`Play`); pairs 5–6 (`Pair 5` fast, `Pair 6` slow) are sorted into `Reacts` / `Bounces apart` before pressing `Play` to verify. | Speed arrow lengths only; no energy number printed. | `Pair 5` in `Bounces apart`: "Pair 5 has long speed arrows, just like the fast pairs that reacted." `Pair 6` in `Reacts`: "Pair 6 has short speed arrows, like the slow pairs that bounced apart." | 1. Press "Play" on pairs 1–4, then sort pairs 5 and 6 into the trays. 2. Compare the speed arrow lengths of pairs that reacted vs bounced. 3. Only collisions with enough kinetic energy break old bonds and react. | **Energy Threshold.** The fast pairs reacted and the slow pairs bounced. Colliding particles need a minimum kinetic energy to react. | Flat (`collview` + cards) |
| 3 | The Right Way Round | — | Two equally fast collisions: why does only one react? | `collview` showing two equally fast pairs (tinted reactive ends): Pair A meets reactive-end to reactive-end and reacts; Pair B meets reactive-end to back-end and bounces. Three cards. | Speed arrows identical on both pairs; reactive atoms tinted. | "One was hotter": "Both pairs have identical speed arrows." "Chance alone": "Repeating Pair B with the same angle always bounces." | 1. Press "Play" to watch both slow-motion collisions. 2. Watch which tinted atoms touch at the moment of impact. 3. Particles must collide in an orientation that brings the reacting atoms together; this is the collision model. | **Collision Model.** Particles must collide with enough energy and the right orientation so the reacting atoms meet. | Flat (`collview` + cards) |
| 4 | Over the Bar | The minimum energy a collision needs in order to react is the activation energy, Ea. | The temperature rises by 10 K: what happens to the share of collisions with at least the activation energy? | `mbhist` (Maxwell–Boltzmann speed/energy distribution) with a Temperature dial (`290 K`, `300 K`, `310 K`) and a vertical `Ea` threshold bar. Shaded area past `Ea` updates (`4.2% → 7.9% → 14.3%`). Three cards (`Hardly changes`, `Rises in step with T`, `Rises steeply`). | `T` in K, `Ea` bar, shaded `% ≥ Ea`. Never prints "doubles" or "steeply". | `Hardly changes`: "From 300 K to 310 K, the shaded share above Ea jumped from 7.9% to 14.3%, nearly double." `Rises in step with T`: "Temperature rose by 3% (300 to 310 K), while the share above Ea nearly doubled." | 1. Turn the "Temperature" dial from 290 K to 300 K and 310 K. 2. Watch the shaded share past the Ea bar at each temperature. 3. Raising T by 10 K shifts the curve slightly, which nearly doubles the high-energy tail. | **Activation Energy.** Raising temperature by 10 K shifted the curve slightly and nearly doubled the share above Ea, speeding the reaction sharply. | Flat (`mbhist` + cards) |
| 5 | The Hill | An energy profile plots energy as reactants rearrange to products; ΔH is the overall energy drop or rise, and the arrangement at the top of the barrier is the transition state. | Which height on the profile is the activation energy? | `kprofile` (one-humped curve: Reactants at `40 kJ/mol`, Transition State at `110 kJ/mol`, Products at `10 kJ/mol`) with a draggable progress ball and 3 `tapZones` (`Reactants → Top`, `Reactants → Products`, `Products → Top`). | Curve levels (`40`, `110`, `10 kJ/mol`) and progress ball. No `Ea` or `ΔH` arrow labels printed. | `Reactants → Products`: "That height is ΔH, the overall energy drop from reactants to products." `Products → Top`: "That height climbs from products, which is the reverse direction." | 1. Drag the ball along the energy profile and tap one of the three height brackets. 2. Notice how high the reactants must climb to reach the transition state. 3. Activation energy is the energy difference from reactants up to the transition state. | **Energy Profile & Transition State.** Activation energy is the climb from reactants to the transition state at the top. ΔH is the difference between reactants and products. | Flat (`kprofile` + `tapZones`) |
| 6 | The Way Back (`entry`) | — | What is the activation energy of the reverse reaction? | `kprofile` with Reactants `50 kJ/mol`, Transition State `120 kJ/mol`, Products `20 kJ/mol` (so forward $E_a = 70$, $\Delta H = -30$, reverse $E_a = 120 - 20 = 100\text{ kJ/mol}$). Entry unit: `kJ/mol`. | Three level numbers (`50`, `120`, `20 kJ/mol`) and progress ball. Answer `100` not printed. | `70` (forward $E_a$): "70 kJ/mol is the climb from reactants (50) to the top (120), the forward direction." `30` ($|\Delta H|$): "30 kJ/mol is the gap between reactants (50) and products (20)." | 1. Read the product level and transition-state level on the profile, then type the reverse activation energy. 2. The reverse reaction starts at products and climbs to the same transition state. 3. Subtract the product energy (20) from the top (120). | **Reverse Activation Energy.** Starting from products at 20 kJ/mol, the reverse reaction must climb 100 kJ/mol to reach the 120 kJ/mol transition state. | Flat (`kprofile` + `entry`) |
| 7 | Downhill and Not Moving | — | Diamond turning to graphite releases energy: why is it never seen to happen? | Two `kprofile` + `kvessel` pairs side by side: Left (`Low Ea = 25 kJ/mol`, $\Delta H = -30$) reacts briskly; Right (`High Ea = 250 kJ/mol`, $\Delta H = -30$, labeled `Diamond → Graphite`) sits motionless at 298 K. Three cards. | Both profiles show products lower than reactants ($\Delta H < 0$). | "Its ΔH is too small": "Both reactions release energy (products sit below reactants)." "It has already finished": "The right vessel still holds 100% reactant and no product." | 1. Press "Run" on both vessels and compare their energy profiles. 2. Compare the height of the barrier on the right profile with the left. 3. Even when products are lower in energy, a huge activation energy keeps the reaction from starting. | **Kinetic Control.** ΔH tells whether energy is released, not whether a reaction is fast. A high activation energy can keep a favourable change from happening. | Flat (`kprofile` × 2 + `kvessel` × 2 + cards) |

### `q5-steps` · Steps (7 stages)

| # | Stage | Briefing (≤2 sent.) | Objective / Prompt (≤25 words) | Evidence on Bench | Printed Text & Leak Check | Wrong Answers & Miss Messages | Hints (1: control, 2: notice, 3: reason) | Reward (≤40 words) | 2D/3D & Ramp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Adding the Steps | Most reactions happen as a series of simple collisions called elementary steps; together they form a reaction mechanism. | Which steps add up to 2 NO₂ + F₂ → 2 NO₂F? | `stack` fixture + 3 step cards (`Step A: NO₂ + F₂ → NO₂F + F`, `Step B: NO₂ + F → NO₂F`, `Step C: 2 NO₂ → N₂O₄`). Plotted net equation updates live as cards are stacked. | Step equations on cards, live net sum on stack. Never says which 2 cards to pick. | Stack with `Step C`: "Your stack's net equation includes N₂O₄, which is not in 2 NO₂ + F₂ → 2 NO₂F." Single card: "One step leaves F uncancelled." | 1. Place step cards onto the stack to see their net sum. 2. Species appearing on both sides of the stack cancel out. 3. Choose the two steps whose sum cancels F and leaves 2 NO₂ + F₂ → 2 NO₂F. | **Mechanism.** Elementary steps add together and cancel matching species on both sides to give the overall equation. | Flat (`stack` + cards) |
| 2 | Made and Used | — | Which substance is made in one step and used up in the next? | Filled `stack` from stage 1 (`NO₂ + F₂ → NO₂F + F` and `NO₂ + F → NO₂F`) with cancelled `F` struck through, plus 4 species cards (`NO₂`, `F₂`, `F`, `NO₂F`) and 1 slot. | Two steps + struck-through `F`. Never labels `F` as "intermediate". | `NO₂`: "NO₂ is a reactant present at the start in both steps." `NO₂F`: "NO₂F is the final product, not consumed in step 2." | 1. Look at the two steps in the stack and place one species card in the slot. 2. Find the species that appears as a product in step 1 and a reactant in step 2. 3. That species cancels out of the overall equation. | **Intermediate.** F is made in step 1 and used in step 2, so it never appears in the overall equation. It is an intermediate. | Flat (`stack` + slot + cards) |
| 3 | The Slow Step | — | Which step, made faster, speeds up the whole reaction? | Two-step `kvessel` (`Step 1: slow`, `Step 2: fast`) with a `Speed up` dial (`Baseline`, `Faster Step 1`, `Faster Step 2`). Curve overlays against dashed baseline. Two cards (`Step 1 (slow)`, `Step 2 (fast)`). | Dial labels `Baseline`, `Faster Step 1`, `Faster Step 2`. Never prints "rate-determining". | `Step 2 (fast)`: "Speeding Step 2 left the product curve right on top of the baseline." | 1. Try "Faster Step 1" and "Faster Step 2" on the dial, press "Run", and compare with the baseline. 2. See which change actually makes the product curve steeper. 3. Step 2 already uses up the intermediate as fast as Step 1 makes it, so only Step 1 sets the pace. | **Rate-Determining Step.** Only speeding the slow step changed the overall rate. The slowest elementary step is the rate-determining step. | Flat (`kvessel` + dial + cards) |
| 4 | One Step's Rate Law | For a single elementary step, and only for one, the rate law follows the colliding particles: each particle in the collision adds one to its order. | What is the rate law of the single step NO₂ + F₂ → NO₂F + F? | `collview` showing `NO₂ + F₂ → NO₂F + F` (1 `NO₂` + 1 `F₂` colliding) beside `rateboard` (`rate = k[NO₂]^?[F₂]^?`). | Step equation + collision animation + `rateboard`. Answer `1, 1` not printed. | `k[NO₂]²[F₂]¹`: "The collision shows only one NO₂ meeting one F₂, not two." `k[NO₂]¹[F₂]⁰`: "Both NO₂ and F₂ must collide in this elementary step." | 1. Press "Play" to watch the collision, then set the powers on the rate-law board. 2. Count how many NO₂ and how many F₂ particles collide in the step. 3. For an elementary step, each colliding particle gives an order of 1. | **Elementary Step Rate Law.** One NO₂ collides with one F₂, so the elementary step has rate = k[NO₂][F₂]. | Flat (`collview` + `rateboard`) |
| 5 | Does It Fit? | — | Which mechanism agrees with the measured rate law? | `plaque` showing `Measured: rate = k[NO₂][F₂]` + 2 mechanism cards (`Mech 1`: Step 1 slow `NO₂ + F₂ → NO₂F + F`, Step 2 fast `NO₂ + F → NO₂F`; `Mech 2`: Step 1 slow `2 NO₂ → N₂O₄`, Step 2 fast `N₂O₄ + F₂ → 2 NO₂F`) + 1 slot. | Plaque + 2 mechanism cards. Never prints which matches. | `Mech 2`: "Mechanism 2's slow step collides two NO₂ and no F₂, giving rate = k[NO₂]², which disagrees with the plaque." | 1. Compare the slow step of each mechanism card with the measured rate law on the plaque. 2. Write the rate law for each mechanism's slow step from its colliding particles. 3. Pick the mechanism whose slow-step rate law matches the measured one. | **Testing a Mechanism.** Mechanism 1's slow step collides one NO₂ and one F₂, matching the measured law. A rate law can rule out a mechanism, never prove it. | Flat (`plaque` + slot + cards) |
| 6 | A Fast Step First | A reversible step running fast both ways reaches equilibrium (equal forward and reverse rates), so its product concentration stays proportional to its reactants: [I] ∝ [A][B]. | What is the rate law for the overall reaction? | `kvessel` running `A + B ⇌ I` (fast, reversible) then `I + B → P` (slow), showing `I` staying small and steady while `P` grows. Four rate-law cards (`k[I][B]`, `k[A][B]²`, `k[A][B]`, `k[A]²[B]`). | Mechanism + steady `[I]` trace. Never prints `k[A][B]²` as the answer. | `k[I][B]`: "I is an intermediate, not a starting reactant, so it cannot stay in the final rate law." `k[A][B]`: "Substituting [I] ∝ [A][B] into k[I][B] brings in a second [B]." | 1. Press "Run" to watch intermediate I stay steady, then pick the overall rate-law card. 2. Start from the slow step (rate = k[I][B]) and replace [I] using the fast step. 3. Replace [I] with [A][B] and combine the two [B] factors. | **Pre-Equilibrium.** The slow step gives k[I][B], and [I] goes as [A][B], giving rate = k[A][B]². Intermediates never appear in an overall rate law. | Flat (`kvessel` + cards) |
| 7 | Two Hills | — | Which hill belongs to the rate-determining step? | Two-humped `kprofile` (Hill 1 higher at `110 kJ/mol`, valley intermediate at `55 kJ/mol`, Hill 2 lower at `80 kJ/mol`), draggable progress ball, and 3 `tapZones` (`Hill 1`, `Valley`, `Hill 2`). | Energy levels (`30`, `110`, `55`, `80`, `10 kJ/mol`). Never labels Hill 1 as "slow". | `Hill 2`: "Hill 2 climbs only 25 kJ/mol from the valley, while Hill 1 climbs 80 kJ/mol from reactants." `Valley`: "The valley is the intermediate sitting between the two steps, not a barrier." | 1. Drag the ball across both hills and tap the hill that controls the overall rate. 2. Compare the barrier heights of Hill 1 and Hill 2. 3. The taller barrier is harder to cross, so it is the slowest (rate-determining) step. | **Multistep Energy Profile.** The higher hill is the rate-determining step. Each hill is a transition state, and the valley between them is an intermediate. | Flat (`kprofile` + `tapZones`) |

### `q6-shortcut` · Catalysts (5 stages)

| # | Stage | Briefing (≤2 sent.) | Objective / Prompt (≤25 words) | Evidence on Bench | Printed Text & Leak Check | Wrong Answers & Miss Messages | Hints (1: control, 2: notice, 3: reason) | Reward (≤40 words) | 2D/3D & Ramp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Used Up? (`predict: true`) | — | A substance that speeds up a reaction is added: how much of it is left at the end? | `lead` clip of a reaction vessel with added catalyst particles glowing/staying distinct. Three cards (`None`, `Some`, `All of it`). | Only card choices. | Any guess accepted (ungraded). | 1. Watch the added particles in the preview as reactants turn to product. 2. Notice whether the added particles are converted into product or remain as themselves. 3. Think about how a trace of powder can keep speeding a reaction without running out. | **Prediction Locked.** You locked in your prediction. Now run two vessels side by side to check. | Flat (`lead` + cards) |
| 2 | With and Without | — | What happened to the amount of the added substance? | Two `kvessel`s side by side (`Uncatalysed`, `With added substance`: starts with 6 added particles, count stays 6 at end while reaction finishes twice as fast). `selector` with 3 options (`Used up completely`, `Partly used up`, `All still there`). | Particle count `6 → 6` after Run; curves end at same product level. Never prints "catalyst". | `Used up completely`: "The counter in the second vessel still reads 6 added particles at the end." `Partly used up`: "The counter started at 6 and ended at 6." | 1. Press "Run" on both vessels and choose the matching statement on the selector. 2. Compare the starting and ending counts of the added particles in vessel 2. 3. A substance that speeds a reaction without being consumed is a catalyst. | **Catalyst.** All 6 particles remained at the end while the reaction finished sooner. A substance that speeds a reaction without being used up is a catalyst. | Flat (`kvessel` × 2 + `selector`) |
| 3 | A Lower Hill | — | What does the catalyst change on the energy profile? | `kprofile` showing un-catalysed path (`Ea = 90`, $\Delta H = -40$) and a second dashed catalysed path (`Ea = 45`, same reactants and products). Three `tapZones`: `Barrier height (Ea)`, `Reactant level`, `Product level`. | Both curves on one plot. Never prints "lowers Ea" as an answer. | `Reactant level`: "Both curves start at the exact same reactant energy." `Product level`: "Both curves end at the exact same product energy, so ΔH is unchanged." | 1. Drag the ball along the catalysed path and tap what differs between the two curves. 2. Compare the peak height, start level, and end level of the two paths. 3. A catalyst provides a path with a lower activation energy and leaves ΔH alone. | **Lower Activation Energy.** The catalyst lowered the barrier height (Ea) and left both reactant and product levels—and ΔH—unchanged. | Flat (`kprofile` + `tapZones`) |
| 4 | A Different Path | — | Which substance is the catalyst and which is the intermediate? | `stack` showing `Step 1: H₂O₂ + I⁻ → H₂O + IO⁻` and `Step 2: H₂O₂ + IO⁻ → H₂O + O₂ + I⁻` (both `I⁻` and `IO⁻` cancel in net `2 H₂O₂ → 2 H₂O + O₂`). Two species cards (`I⁻`, `IO⁻`) sorted into `Catalyst` and `Intermediate` trays. | Two steps + net equation. Never labels `I⁻` or `IO⁻`. | Swapped: "IO⁻ is made in step 1 and used in step 2; I⁻ enters step 1 as a reactant and returns in step 2." | 1. Read both steps on the stack and sort the two species cards into the trays. 2. Check which species enters first as a reactant and which is made first as a product. 3. A catalyst is used and then regenerated; an intermediate is made and then used up. | **Catalyst vs Intermediate.** I⁻ is used in step 1 and returned in step 2 (catalyst); IO⁻ is made first and used later (intermediate). Both cancel from the overall equation. | Flat (`stack` + cards) |
| 5 | On a Surface | — | Where does the reaction happen when the catalyst is a solid? | `collview` in surface mode: gas molecules (`C₂H₄`, `H₂`) approach a solid metal lattice, bind to its top surface where bonds stretch and rearrange, and leave as `C₂H₆`. Three `tapZones`: `Gas space above`, `Metal surface`, `Deep inside metal`. | Animated surface binding. Never labels "active site" before reward. | `Gas space above`: "In the gas space above, the molecules bounce without breaking bonds." `Deep inside metal`: "Gas molecules cannot pass into the solid metal interior." | 1. Press "Play" to watch the molecules, then tap the zone where their bonds rearrange. 2. Watch where the molecules land and stretch before leaving as products. 3. Solid (heterogeneous) catalysts react on their surface; in living cells, enzymes bind reactants at an active site. | **Surface Catalysis & Enzymes.** Reaction happens on the surface, where bonds weaken. A catalyst in a different phase is a heterogeneous catalyst; biological catalysts are enzymes with an active site. | Flat (`collview` surface + `tapZones`) |

### `boss-flare` · The Flare (5 phases)

| # | Phase | Re-tests | Prompt (≤25 words) | Evidence & Graded Act | Misses & Hints |
| --- | --- | --- | --- | --- | --- |
| 1 | Two Readings (`entry`) | `q1` s3 | What is the average rate between 5 s and 15 s, in mol/L each second? | `kvessel` curve with marked points `(5 s, 0.50 mol/L)` and `(15 s, 0.20 mol/L)` ($\Delta c / \Delta t = 0.30 / 10 = 0.030\text{ mol/(L}\cdot\text{s)}$). Typed entry. | Misses: `0.30` (forgot ÷ 10 s), `0.020` (used 15 s total). H1: Read both marked points. H2: Find the drop in concentration and the time elapsed. H3: Divide the concentration change by the 10 s interval. |
| 2 | The Log | `q2` s3 | What is the rate law for this reaction? | `rateslog` with 3 runs for `A + 2 B → P`: `[A]` doubles → 4×, `[B]` doubles → 2×. `rateboard` with powers on `[A]` and `[B]` (`2, 1`). | Misses: `1, 2` (copied coefficients!). H1: Set the powers on the rate-law board from the three runs. H2: Compare runs where only [A] doubles, then only [B] doubles. H3: A 4× rate jump when concentration doubles is order 2; 2× is order 1. |
| 3 | The Count Down (`entry`) | `q3` s2 | What fraction of the reactant is left after four half-lives? | `kvessel` with `t½ = 12 s` marked (`0 → 12 → 24 s`). Typed entry (`0.0625` or `1/16`). | Misses: `0.125` (3 half-lives), `0.25` (2 half-lives). H1: Count four halvings from 1.00 and type the remaining fraction. H2: Each half-life cuts the remaining fraction in half. H3: Multiply ½ four times: (½)⁴. |
| 4 | The Profile (`entry`) | `q4` s5–s6 | What is the activation energy of the forward reaction? | `kprofile` with Reactants `35 kJ/mol`, Transition State `115 kJ/mol`, Products `15 kJ/mol` ($E_a = 115 - 35 = 80\text{ kJ/mol}$). Typed entry. | Misses: `100` (reverse $E_a$), `20` ($|\Delta H|$), `115` (top level). H1: Read the reactant and transition-state levels, then type Ea. H2: Forward activation energy starts at reactants, not at zero or products. H3: Subtract the reactant energy from the transition-state energy. |
| 5 | The Proposal | `q5` s5 | Which mechanism agrees with the measured rate law? | `plaque` showing `Measured: rate = k[X]²[Y]` + 2 mechanism cards (`Mech 1`: slow `X + Y → XY`, fast `XY + X → X₂Y`; `Mech 2`: fast `2 X ⇌ X₂`, slow `X₂ + Y → X₂Y`) + 1 slot. | Miss: `Mech 1` ("Mechanism 1's slow step collides one X and one Y, giving rate = k[X][Y]."). H1: Compare both mechanism cards against the plaque. H2: Write the rate law from each mechanism's slow step. H3: For Mechanism 2, replace the intermediate [X₂] using the fast step before the slow step. |

---

## 4. Kit Plan (`rate` kit, extending `pans` / `heat`)

To keep `pans` (Teeter) and `heat` (Ember Reach) 100% isolated and zero-risk, we create a new kit `rate` (`src/learn/table/kits/rate.js` + modular files `rate-registry.js`, `rate-vessel.js`, `rate-log.js`, `rate-plotter.js`, `rate-collide.js`, `rate-mb.js`, `rate-profile.js`, `rate-tour.js`), registered in `src/learn/table/kits/registry.js` and `index.js`, and sharing `HEAT_KIT`'s card, rail, plaque, selector, and equation stack fixtures.

1. **Planners (`src/learn/engine/ratedata.js`):** Pure functions, deterministic, shared between 2D canvas and 3D tabletop:
   - `planKineticsRun({ order, k, a0, b0, c0, catalyst, dt, tMax, stoich, T, surfaceArea, volume })`: computes `[A](t)`, `[B](t)`, `[P](t)`, initial rate, half-lives, and particle counts.
   - `planTwoStepRun({ k1, k2, a0, fast1, fast2, tMax })`: Euler-integrated 2-step chain `A → I → P` for `q5` s3 and pre-equilibrium `A + B ⇌ I` → `P` for `q5` s6.
   - `planPlotTransform(points, mode)`: transforms `(t, [A])` to `[A]`, `ln[A]`, or `1/[A]` and computes least-squares straightedge fit.
   - `planMB(T, Ea)`: Maxwell–Boltzmann speed/energy distribution bins + exact fraction $\ge E_a$ (using Boltzmann tail / discrete energy bins).
   - `planFoe(phase)`: boss Flare phase data from the same planners.
2. **Fixtures:**
   - `kvessel`: kinetic reaction vessel (live animated particles changing colour on reaction, concentration/change/speed-up dials, live curve plot, `tapZones` support, `choice` pick mode).
   - `rateslog`: compact initial-rates log table (rows of `[A], [B], [C], Rate`) that fits beside `kvessel` at 340 px (`bounds: { w: 184, h: 92 }`).
   - `rateboard`: power-dial board (`rate = k[A]^?[B]^?[C]^?`), reusing `kspform` pattern.
   - `plotter`: 3-key (`[A]`, `ln[A]`, `1/[A]`) data plotter with straightedge line and reaction selector.
   - `collview`: slow-motion collision pairs (`Play` button, speed arrows, tinted reactive atoms, bounce/react animation) AND solid surface catalysis mode (`tapZones` for gas / surface / bulk).
   - `mbhist`: energy distribution histogram with `Temperature` dial and `Ea` threshold bar + live `% ≥ Ea` readout.
   - `kprofile`: 1- or 2-humped energy profile with optional catalysed dashed path, draggable reaction-progress ball, and `tapZones`.
3. **Tour steps (`rate-tour.js`):** Every new fixture and piece kind gets 3-beat Tour words in earned terms.

---

## 5. World Plan (Storm Belt — Quicklight)

- **Site:** rebuilt 2026-11-17 as a refinery on two lava flows; section 7 is the spec, the build record and the owner's viewing list. Layout: `tools/gen-quicklight-layout.mjs` → `src/three/world-data/quicklight.json`, on `src/three/quicklight/refinery-plan.js`.
- **Six hosts**, one per room: the analyser bunker, the control room, the pump cellar in the tank bund, inside the cracking reactor's skirt, under the reactor train's table, the catalyst bunker. The boss arena (`boss-flare`) is in the flare yard.
- **Textures & atmosphere:** storm dusk, lightning to the rod pylons; warm filament lamps (only lamps lit, from a pool of three lights); every room under the cover mask; checks in `tools/verify-quicklight.mjs`.

---

## 6. Pitfall Review (against `PRODUCT.md` Section 5 & Section 4)

- **Idea arrives in reward card:** Avoided — every stage has a live cause on the bench (steepness of curve, log rows, straightedge plot, slow-motion collision, Boltzmann tail, energy profile, catalyst count) and reward cards are ≤ 40 words confirming what was seen.
- **Moving model as decorative wallpaper:** Avoided — particles in `kvessel`, `collview`, and `mbhist` are directly acted on (`Run`, `Play`, dials) and directly show the cause (2 A used per 1 B formed, speed/orientation determining bounce vs react, fraction past `Ea` bar).
- **Black-box instrument printing the answer property:** Avoided — `kvessel` plots concentration vs time (never prints "rate = 0.04" on s3 or "first order" on `plotter`), `collview` shows arrows/atoms (no "reacts!" badge before Play).
- **Pure plate-and-type worksheet stages:** Avoided — every typed stage (`q1` s3, `q2` s4–s5, `q3` s2 & s5, `q4` s6, boss p1, p3, p4) has a live curve, log, or profile on the bench that the number describes, plus worked lines in briefings where first introduced.
- **Two bad voices / anthropomorphic motives:** Avoided — `glossary/quicklight.js` enforces real terms (`reaction rate`, `activation energy`, `catalyst`, etc.) and bans `knock`, `push`, `room`, `speed` (for rate), `hill` before `q4` s5, and `"wants to react"`.
- **Convoluted answer forms:** Avoided — direct quantities asked (`average rate`, `k`, `fraction`, `reverse Ea`).
- **Hint leaks:** Avoided — Rung 1 = control/where to look, Rung 2 = what to compare, Rung 3 = how to reason (never the answer or worked arithmetic).
- **Prerequisites out of order:** Avoided — `NEEDS` primers for `mol/L`, `ln`, `ΔH`, `equilibrium`; `BUILDS_ON` declared per bench.
- **Plate/header/dial prints the answer:** Checked — `q3` s2 plot ends at `45 s` (asked at `60 s`); `q4` s5–s6 hide `Ea`/`ΔH` labels; `q2` s3 rateboard starts at blank/0.
- **Two-tap twin, drop zones, phone floor (340 px / 375 px):** All pieces have `r >= 2.2`, `bounds` sized for 340 px, `tapZones` and two-tap placements everywhere.
- **3D On & `3D Off` parity:** Pure planners in `ratedata.js` drive both `Table2D` and `Table3D`.
- **Shared files & parallel safety:** All new kit fixtures live in `rate*.js` via `rate-registry.js`, leaving `pans.js` and `heat.js` untouched.

---

## 7. Site rebuild (2026-11-17)

The first site (a flat plate, six rigs in two columns either side of a spine road, the template shared with Brinewire) is in
`archive/2026-11-17/site-quicklight/`. This section is the spec the rebuild was held to, then the build record. The brief is
Quicklight's row in `docs/plans/world-distinction-plan.md` section 6. Nothing here was seen in a browser: every geometric claim is
a Node measurement, and 7.12 lists where the owner should stand to judge it.

### 7.1 The place

**A refinery crammed onto a black lava field under a standing storm, its alleys running under pipe racks between packed process
units, half of it on a lower flow and half up on the next flow's front.** In the first ten seconds after landing the player stands
in a fenced laydown yard on bare dark hardstanding, looking east down a 7 m alley roofed by two tiers of pipes on steel bents,
process units (columns, drums, exchanger banks, fin-fan coolers) close on both sides, the feed heater's stack and the reactor
train's three vessels above them, lattice rod pylons out on the lava, and now and then a bolt of lightning to one of the pylons.

### 7.2 The signature

| | Quicklight | Checked against section 6 |
| :--- | :--- | :--- |
| Landform | A refinery packed onto two young basalt lava flows; the upper flow's front, 5 m high, crosses the site west to east | No other row is built plant on a lava field; Ligar's basalt is a columnar plateau with a quarry, and its benches are in rock, not plant |
| Walk shape | A grid of ten alleys under pipe racks meeting at eleven junctions, two grids (one per flow) joined by one ramp cut up through the flow's front | No other row is a grid: Kettle is one aisle, Teeter a comb, Verdigris a branching boardwalk, Brinewire a crest road and a ramp, Lodestone one canyon path |
| Bench housing | Two bunkers sunk under banked earth (the analyser bunker, the catalyst bunker), inside a reactor's skirt, under a reactor table, the control block, a pump cellar in a sunk tank bund | Kettle's rooms are bays of one building; Cinder Halo's cells are in crater walls entered by dog-legs; Teeter's are dug into terrace walls; none is earth-banked plant, a reactor skirt or a table |
| Light | Storm dusk (the built sky kept); lightning to the rod pylons, the sky and the hemisphere's fill rising with each strike; inside every room only its lamps | as the row |

Departure from the row: one bench (3) is in a pump cellar in the sunk tank bund, which the row does not name. The row's housings
cover five of six; the tank bund gives the world its lowest floor and fits bench 3's stake (decomposition in the reserve tanks).

### 7.3 Plan (north is -z; `quicklight/refinery-plan.js` holds every number)

- **The walk** stays in x -92 to 86, z -92 to 90 (the stage's square is ±96).
- **Levels.** `GRADE` 0 (the lower flow), `PLOT` 5 (the upper flow, south of its front at z 7 to 9), and three sunk floors:
  the analyser bunker -3.5, the tank bund -4, the catalyst bunker +2.
- **The lower grid (grade):** the laydown yard x -92 to -60, z -92 to -56 (the pad at (-78, -78), the spawn at (-63, -68.5)
  looking east); alley b1 along z -72 to -65 from x -60 to 60; alleys a1, a2, a3 running south from it (x -60 to -53, -10 to -3,
  53 to 60) to alley b2 (z -26 to -19); a2s on south from b2 to the flow's front at z 8.
- **The rise:** one ramp x -10 to -3 from z 8 (grade) to z 38 (plot), 1 in 6, in a cutting through the flow's front.
- **The plot grid:** alley c1 along z 38 to 45 (x -60 to 60); d1 and d2 south from it (x -60 to -53, 7 to 14) to c2 (z 80 to 87,
  x -60 to 40); c2's east end is the gate into the fenced flare yard (x 40 to 86, z 52 to 90).
- **Closed high ground and drops.** Every side of every volume that is not a doorway is a collider (`lib/workings.js`). Units fill
  every block between the alleys; earth is banked over the two bunkers; the tank bund is a 4 m pit with tanks in it; outside the
  fence (x -78 to 98, z -100 to 104, and the yard's corner) is the lava field. No reachable cell is any of these (flood fill).
- **The route, bench by bench** (the guide's way, `routeTo`): spawn → b1 east → down the ramp `down-1` (z -65 to -44, 0 to -3.5)
  → `court-1` → Bench 1 (72 m); back up, b1 east to a2, a2 south → Bench 2 off a2's east side (86 m); a2 to b2, b2 to a2s, west
  down `down-3` (x -10 to -34, 0 to -4) between the bund's tanks → `court-3` → Bench 3 (163 m); back up, a2s south, up the rise
  → c1 west → Bench 4 off c1's north side (192 m); c1 east → Bench 5 off c1's north side (203 m); c1 to d2, d2 south to c2, c2
  west, down `down-6` (z 80 to 62, 5 to 2) → `court-6` → Bench 6 (322 m); c2 east through the gate → the flare yard.
- **The boss's ground:** the flare yard, the player's mark (68, 6.6, 56) by its north fence, the Flare at (68, 5, 72), the stack
  at (80, 82) beyond it to the south-east (`BOSS_ARENA_SPOTS['boss-flare']` moved there).

### 7.4 Section along the main route

| Along the way | Floor (m) |
| :--- | :--- |
| Spawn, yard, b1 | 0.0 |
| Down `down-1` to `court-1`, Bench 1 | 0.0 → -3.5 |
| b1, a2, Bench 2 | 0.0 |
| b2, a2s, down `down-3` to `court-3`, Bench 3 | 0.0 → -4.0 |
| a2s, up the rise | -4.0 → 0.0 → 5.0 |
| c1, Benches 4 and 5 | 5.0 |
| d2, c2, down `down-6` to `court-6`, Bench 6 | 5.0 → 2.0 |
| c2, the flare yard | 5.0 |

Bench ground: -4.0 to 5.0 m (9.0 m), on five levels.

### 7.5 The benches and their rooms

1. **`q1-watch` How Fast (Watching the Speed): the analyser bunker.** Rate as the change of concentration over time; the bunker
   is where the product stream is sampled and analysed again and again, so its make-up can be watched as it changes. A corrugated
   steel arch (12.4 by 12 m, 5.2 m at the crown) over 2 m concrete stem walls, sunk to -3.5 under 3 m of banked earth; closed on
   every side, the concrete headwall with the door facing east onto a sunk court. The player comes off b1 down a 21 m ramp between
   retaining walls and sees the headwall and the earth heap over it. Lamps: two pendants from the ribs over the plate and by the
   door, two over the side walls. Behind the plate three analyser ovens and their controllers and a clock; the sample-conditioning
   panel with glass flow meters on the left; carrier-gas cylinders chained in a rack on the right.
2. **`q2-law` The Rate Law (Feed Manifold): the control room in the control block.** The rate law is found by changing one feed
   at a time; the control room is where the feeds are set. A 13 by 13 m room with metre-thick blast walls in a windowless concrete
   block (33 by 29 m, 7.2 m high), entered from a2; a slab roof on downstand beams, cable trays at 4.7 m. Lamps: six pendants.
   Behind the plate the mimic board of the three feed lines meeting at the reactor; the operators' console and chairs on the left;
   marshalling cabinets and the shift desk on the right.
3. **`q3-time` Concentration Over Time: the pump cellar in the tank bund.** Decay over time, the half-life; the cellar is where
   the reserve tanks' product is pumped and their samples drawn day by day. 12 by 12 m, floor -4, concrete walls, a slab on rolled
   steel beams (4.7 m clear) carrying the tank manifold's deck. The player walks down a ramp between four tanks into the bund and
   across its court to the door. Lamps: four pendants. The valve manifold across the back wall; two transfer pumps on plinths on
   the left; the sample cooler and a rack of thirty sample bottles on the right.
4. **`q4-collide` Collisions and the Hill: inside the cracking reactor's skirt.** Only collisions with enough energy react, and
   heat raises their share; the reactor is where the heated feed meets. A 12.4 by 12.8 m room walled to 3 m in blockwork inside
   the reactor's round fireproofed skirt (9.1 m radius, 8 m high), the vessel's bottom head overhead (6.8 m at its lowest), the
   vessel itself 22 m tall above it. Entered from c1 by a 4 m access way through the skirt. Lamps: four pendants from the head.
   The feed nozzles' four lines dropping from the head to valves; a steam ring at 3.65 m; thermocouple heads and the temperature
   recorder on the left; refractory brick on pallets and a tub of castable on the right.
5. **`q5-steps` Steps: under the reactor train's table.** A mechanism runs in steps; the train is three reactors in series, the
   product of one fed to the next. An 18 by 12.2 m room under a concrete table on columns, block infill between them, the table's
   slab 5.5 m over the floor, the three vessels (12, 15 and 11 m) standing on it with their transfer lines. Entered from c1. Lamps:
   four pendants. Behind the plate the three reactors' bottom outlets, each with its valve and sample point; a chain hoist on a
   runway; the dosing skid on the left; three racks of sample bombs, one per reactor, on the right.
6. **`q6-shortcut` Catalysts: the catalyst bunker.** A catalyst is not used up; the bunker is where the catalyst is kept, new in
   sealed drums and spent in open ones. 12 by 12 m, sunk to +2 under 2.7 m of earth on the plot, metre-thick concrete walls, the
   headwall with its door facing east onto a sunk court reached down a ramp from c2. Lamps: four pendants. The loading hopper
   coming down through the roof in the back-left corner over a drum; spent catalyst in open drums on the left; the sieve behind the
   plate; new catalyst on pallets and a part-emptied bulk bag on the right; the hopper's hatch stands on top of the heap outside.

No two rooms share a size or a shell (`arch`, `block`, `cellar`, `skirt`, `table`, `magazine`; `verify:quicklight` holds both).

### 7.6 How it differs from each other world

| World | What a player would point at |
| :--- | :--- |
| Tallow | Tallow is flat white salt to a mirror horizon with a few buildings; Quicklight is black lava, crammed with plant, under storm cloud |
| Lanternfall | Ice and a frozen lake in polar night; here no ice, and a grid of pipe-racked alleys |
| Ligar | Ligar's benches are in a quarry and mine drifts in columnar rock; here they are in plant (bunkers, a reactor skirt, a control block), the rock is young flow lava |
| Bellows | Platforms over a cloud sea; here solid ground on two levels |
| Ember Reach | One switchback down a caldera wall to a lava lake; here a grid on flat flows, no molten lava |
| Mirrowen | Quays, hulls and sea ice; here no water at all |
| Kettle | Inside one foundry building; here outdoors in alleys between many units, under racks |
| Teeter | Salt terraces down a hillside, one stair; here two flat grids and one ramp |
| Verdigris | Boardwalks over a reedy flooded fort; here dry concrete alleys |
| Brinewire | One concrete wall with a lagoon and a drop; here a dense plant and no water |
| Lodestone | One canyon path between rust-red walls; here a grid, open sky over the racks |
| Thornmere | Tar lake and tree mounds; here steel plant on lava |
| Cinder Halo | Craters and cells in crater walls under a ring; here a refinery grid, rooms in plant |

### 7.7 The far country

North: rod pylons out on the lava field and the field rising to old cones. East: the shield volcano the flows came from, low and
broad, with a notched summit. South: the export tank farm, six floating-roof tanks 44 m across. West: three pressure spheres on
legs and the line to them on sleepers. On every side: the rod pylons (six beyond the fence, three on the plant) that the lightning
strikes. All `phys: 'ambient'`.

### 7.8 The numbers held (`verify:quicklight`)

Bench ground at least 8 m on at least four levels; six of six housed, each R6 or better; no plate in view from the spawn or from
any bench's mark; at least nine alleys and eight junctions; every alley under a rack over most of its length; from every alley at
least three in five sightlines into the blocks beside it meet plant within 25 m at the eye; the budget (566 draws, 900k
triangles). The packing threshold (three in five) was set after the first measurement: the sightlines that miss pass under fin-fan
banks and over pump rows, which a player would see through too.

### 7.9 Kept, rebuilt, archived

| File | |
| :--- | :--- |
| `src/three/quicklight/refinery-plan.js` | new: the pure plan (levels, volumes, rooms, land, cover, route, its own consistency checks) |
| `src/three/quicklight/host-plan.js` | rebuilt: each host names its room; quest ids, labels, plates and kinds unchanged |
| `src/three/quicklight/terrain.js` | rebuilt: ground mesh, paving, walls, the bund, room shells, the control block, the reactor and the reactor train |
| `src/three/quicklight/stations.js` | rebuilt: six hosts that furnish their rooms; the old lettered tags are gone |
| `src/three/quicklight/plant.js` | rebuilt: racks and their lamps, ramp lamps, the unit packer, the bund's tanks, the feed heater, rod pylons, the flare stack, the far country |
| `src/three/quicklight/atmosphere.js` | kept; the lightning and a flash uniform added |
| `src/three/quicklight.js` | rebuilt on Brinewire's pattern (cover mask, plan colliders, `routeTo`) |
| `tools/gen-quicklight-layout.mjs`, `tools/verify-quicklight.mjs`, `world-data/quicklight.json` | rebuilt / regenerated |
| `src/learn/engine/boss-arena.js` | `boss-flare`'s spot moved to the flare yard |
| `src/three/materials/quicklight-textures.js` | kept (`stormBasalt`, `pourConcrete`) |

The old `quicklight.js`, `terrain.js`, `stations.js`, `plant.js`, `host-plan.js`, generator, verify script and JSON are in
`archive/2026-11-17/site-quicklight/` with a README.

### 7.10 Build record

Built as 7.1 to 7.9 say. Shared code changed: none (`lib/workings.js`, `lib/cover.js` and `tools/lib/world-shape-checks.mjs`
were used as they are; `outdoorDoors: true`; 12 cover boxes, no openings). Measurements, before and after:

| | Before | After |
| :--- | :--- | :--- |
| `world-shape.mjs` ground under benches | 0.00 to 0.00 m | -4.00 to 5.00 m (9.0 m, five levels) |
| relief on the way | 0.10 m | 13.60 m |
| housed | 0 of 6 (`-1 -1 -0 -1 -1 -1`) | 6 of 6 (`R8 R7 R7 R7 R7 R8`) |
| plates in view from the spawn | not measured (the first script had no such check) | none |
| `perf-worlds.mjs` draws / triangles | 116 / 163k | 268 / 662k |
| shadow casters (triangles) | 30 (4k) | 128 (312k) |
| lamps / real lights | 3 real lights | 111 lamps on 3 real lights |
| Ligar (reference, unchanged) | 566 / 867k | 566 / 867k |

`perf-bench-rest.mjs` after: 684 of 689 deployed table stages come to rest untouched (unit11's six benches all rest); the site
does not change a table.

Where the build parted from the spec as first drawn, and why:

- The Flare's mark is due north of the boss (player (68, 56), boss (68, 72)), not on a diagonal: `verify:arena` measures the
  arena table's collider as an axis-aligned box and holds it to the plate's width along x, which only a mark due north or south
  of the boss meets.
- The pump cellar's clear height went from 4.5 to 4.7 m: its beams run across the plate's line, and at 4.5 they would have stood
  inside the lean-in camera's box (to 4.6 m).
- The plant's fence was moved out (x -78 to 98, z -100 to 104) so the units pack the outer alleys' far sides too; units stand
  beyond the walk's square, which only bounds the walk.
- The racks' bents stand on whatever is beside the kerb: on the earth by a bunker (a step further out, behind its retaining
  wall), or with their beam ends in shoes on the control block's face where a leg cannot stand.
- One extra lamp post in the flare yard at (55, 67): the way from the gate to the player's mark ran more than 12 m from a lamp.

What is still weak: the units are a packer's work, chosen from eight kinds on a lattice; a hand would place a unit's parts as one
process (a column with its own reflux drum, its own pumps). The steam plume over the shield and rain are not built. The reactor's
shell is not in view from the spawn (columns on the lower grid stand in front of it); it is from the top of the rise, c2, the bund
and the flare yard.

### 7.11 Checks run

`verify:quicklight` (109 checks), `verify:bench`, `verify:arena`, `verify:voyage`, `verify:learn`, `verify:table`, `verify:docs`,
and every other world's script (`tallow`, `lanternfall`, `ligar`, `bellows`, `ember`, `mirrowen`, `kettle`, `teeter`,
`verdigris`, `brinewire`, `lodestone`, `thornmere`, `cinderhalo`): all green. `tools/glsl-check.mjs quicklight`: the patched
material program compiles.

### 7.12 The owner's viewing list

Nothing here has been seen in a browser. Stand where each entry says and judge.

1. **The landing (spawn, on the laydown yard, facing east).** In view: the fenced yard, b1 ahead as a 7 m alley roofed by two
   tiers of pipes on steel bents, units close on both sides, the feed heater's stack and the reactor train's vessels over the
   roofs, rod pylons out on the lava. No bench. *Failed if* it reads as an open plate, if a bench plate is in view, or if the
   rack reads as a tunnel with no sky.
2. **At the head of `down-1` (b1 at x -27, facing south).** A 21 m ramp down between rising retaining walls to a sunk court and
   the analyser bunker's concrete headwall at its foot (the earth heap over the bunker is behind units from here; it shows over
   the court's west wall once you are down the ramp). *Failed if* the bunker reads as a shed standing on the ground, or the
   ramp's walls look like floating slabs.
3. **At Bench 1's plate, facing the door.** The corrugated arch overhead on its ribs, the door's light at the far end, the
   flow-meter panel on the left wall, the cylinders on the right; dark but for the pendants. *Failed if* the arch is lit by the sky
   or the room feels cramped at the plate.
4. **In a2 opposite the control block's door (facing east).** A windowless concrete block filling the side of the alley, the
   rack's beams ending in shoes on its face. At Bench 2's plate: the mimic board across the back wall, consoles left, cabinets
   right. *Failed if* the block reads as a plain box with nothing round it.
5. **At the head of `down-3` (a2s at x -9, z -6, facing west).** The ramp running 24 m down into the tank bund between parapets,
   the bund's court at its foot, the cellar's deck and manifold at the far side; walking down, the four tanks rise either side.
   (From b2 the bund wall hides the bund's floor; only the tanks' roofs show over it.) *Failed if* the bund's floor is not seen
   from the ramp or the tanks float.
6. **At Bench 3's plate (the lowest ground, -4 m), facing the door.** Beams overhead, pumps left, sample rack right; through the
   door the bund court. *Failed if* the beams sit in the camera when leaning in.
7. **At the foot of the rise (a2s at z 6, facing south).** A ramp cut up through the lava flow's front between retaining walls,
   the reactor's shell rising beyond its top. *Failed if* the flow's front does not read as a step in the land.
8. **At the top of the rise (c1 at x -6.5, facing west).** c1 under its rack on the plot; the cracking reactor's round skirt and
   22 m vessel on the right, its access way opening off the alley. *Failed if* the reactor does not dominate the plot.
9. **At Bench 4's plate, looking up.** The square block walls to 3 m, the round skirt above them, the vessel's dished bottom head
   over the room, the feed lines dropping to their valves. *Failed if* the square walls and the round skirt read as a mistake
   rather than a room built inside the skirt.
10. **At Bench 5's plate, facing the door.** A long low room under a concrete table, three outlets with valves behind the plate.
    The three reactors standing on the table are seen from the flare yard's mark (to the west) and their tops from the spawn; from
    c1 right in front of the room the table's edge and c1's own rack hide them. *Failed if* the room reads as a tunnel.
11. **At the head of `down-6` (c2 at x -21, facing north).** A ramp down 3 m to a court, the catalyst bunker's earth heap on the
    left rising to about 5 m over the plot (the hopper's hatch on its top is behind the heap's shoulder from here). At Bench 6's
    plate: the hopper coming through the roof in the back corner. *Failed if* the heap reads as a hill with nothing in it.
12. **In the flare yard at the player's mark (68, 56), facing south.** Open crushed-basalt ground, the Flare's place 16 m ahead,
    the flare stack in its three-legged derrick beyond, the knock-out drum outside the east fence. Wait a minute: lightning
    should strike a rod pylon and the sky brighten with it. *Failed if* the yard is cluttered, the stack is hidden, or the
    lightning reads as a glow or a neon line.
