# Kettle `q5-ionic` — Net Ionic Equations (CED 4.2) — design

Files: `src/learn/quests/unit07/q5-ionic.js`, kit `src/learn/table/kits/pot-ionic.js`, planner `src/learn/engine/reactdata-ionic.js` (on `reactdata.js` `planMix`, `solubility`; nothing there changed),
story painter `src/ui/story-scenes-kettle-q5.js` (`cloudy-pond`), checks `tools/lib/kettle-q5-ionic-checks.mjs`, bank `bench.q5-ionic` (two problems, no worked problem: not computational).

**The click.** Students hold "when two solutions are mixed, everything in them reacts" (and, extended, "no cloud means no reaction"). Stage 2 puts that model on the table as cards
("No ions are left in the water"), stage 7 attacks the extension (clear solutions that still react).

**The kit.** The pot (`ionpot`) pours two solution jars together with just enough of each that neither is left over (`mixUnits`), so the water afterwards holds exactly the spectators.
Its WINDOW draws BEFORE (jar 1's ions on the left half, jar 2's on the right) and AFTER (ions still dissolved, loose; ions that left the water packed together at the bottom), one disc per ion with its charge printed
and a key under BEFORE. Its LAMP has two bulbs whose brightness is the number of dissolved ions / 8 (no number printed). The FILTER lifts the solid onto a paper. All of it is `mixOutcome`; painters decide nothing.
Equations are built from **counted ion pucks** (one puck per ion, so a coefficient is a count of pucks) and **formula chips** (`PbI₂(s)`). Pucks are 12.6 units across (the 28 px finger floor at 340 px).
Flat only: the picture is complete and no `dress3d`/`piece3d` was built (3D On falls back to the kit's default pieces and the flat fixture picture).

Words earned: precipitate (1), spectator ions (3), net ionic equation (4), solubility rules (6), complete ionic equation (8). `BUILDS_ON`: `unit01/q4-ledger` (ion, cation, anion).
Deviations from the seeds: the FILTER is on stage 1 only (on stage 3 the window already separates dissolved from packed ions, so a filter key would be a control the answer does not use);
stage 5/6 became predict then test of the four always-soluble ions (the seed's "predict three mixtures" would need a third predict/test pair and drop the acid-base stage); stage 8 asks for the
complete ionic equation only (the net ionic equation is stage 4's skill and the molecular equation is balancing's, `q4-balance`, so three slots would be three decisions).

## Stages

| n | Prompt | Evidence on the bench | Printed (and why not the answer) | Wrong answer and its refusal | Idea · mode |
| --- | --- | --- | --- | --- | --- |
| 1 | Pour the two solutions together and collect on the paper what forms. | Pb(NO₃)₂ and KI jars, pot (glass goes cloudy), filter paper | jar formulas and names; the glass says CLOUDY/CLEAR | mixed, not filtered → "The glass of the pot is cloudy and the paper is still empty." (blank: not yet) | precipitate · flat |
| 2 | PREDICT: Choose which ions are still in the water after the lead nitrate and potassium iodide solutions are mixed and the cloud settles. | none: five cards and a slot | cards only | none (never graded; held model = "No ions are left", "All four ions") | the click |
| 3 | Put in the tray each ion that is still dissolved in the water (the prompt quotes the player's guess). | pot, window, lamp (7 → 4 ions), four ion pucks | window discs and key; bulbs without numbers | all four in the tray → "There are no Pb²⁺ discs loose in the water of AFTER."; short → "AFTER still shows K⁺ discs loose in the water, and the tray has none." | spectator ions · flat |
| 4 | Build the equation for only the ions that reacted. | pot + window, seven counted pucks, three formula chips, tray + "Solid formed" slot | window; nothing of the equation | K⁺ in the tray → "K⁺ is in the window both before and after."; one I⁻ → "2 I⁻ discs left the water, and the tray holds 1."; wrong chip → "The packed discs at the bottom of AFTER do not match the chip in the slot." | net ionic equation (counts: 1 Pb²⁺, 2 I⁻) |
| 5 | PREDICT: Choose the ions you think stay in the water, whatever solution they are mixed with. | eight pucks (Na⁺ K⁺ NH₄⁺ NO₃⁻ Ag⁺ Pb²⁺ Cl⁻ SO₄²⁻) and a tray | pucks | none | new case |
| 6 | Put in the tray the ions that stayed in the water in every mixture (quotes the guess). | pot with a "Mixture" dial of four ready mixtures (AgNO₃+NaCl, Pb(NO₃)₂+K₂SO₄, NH₄Cl+KNO₃, (NH₄)₂SO₄+NaCl), window, eight pucks | formulas of the two jars | Cl⁻ in the tray → "Cl⁻ was packed into a solid in mixture 1."; a mixture not run → "Mixture 3 has not been poured together yet." Cl⁻ and SO₄²⁻ stay dissolved in two mixtures each, so a halide/sulfate shortcut fails | solubility rules |
| 7 | Build the equation for only what reacted when these two clear solutions were mixed. | HCl + NaOH jars, window (H₂O drawn as a new particle), lamp 4 → 2 (dimmer, not dark), pucks H⁺ OH⁻ Na⁺ Cl⁻, chips H₂O(l) and NaCl(aq) | window | Na⁺ and Cl⁻ in the tray → "Na⁺ is in the window both before and after." | H⁺ + OH⁻ → H₂O; clear is not "no reaction" |
| 8 | Build the equation for the sealed jars with every dissolved ion shown, before and after the mixing. | Jar A, Jar B (AgNO₃, KBr, names hidden), window, six pucks, chips AgBr(s), KNO₃(aq), AgNO₃(aq), trays Before / After / Solid formed | window | Ag⁺ in the After tray → "Ag⁺ discs are packed together at the bottom of AFTER, not loose in the water."; counts → "BEFORE shows 4 discs, and the first tray holds 3." | complete ionic equation |

## Hints (three each, in the module) and rewards
Rung 1 names controls (`"Mix"`, `"Filter"`, `"Mixture"`), rung 2 says what to compare (BEFORE with AFTER, the bulbs), rung 3 the structure (an ion belongs in the tray only if…); none gives the answer.
Rewards: Precipitate; Spectator Ions (quotes the guess verdict); Net Ionic Equation; Solubility Rules; Clear Does Not Mean Nothing Happened; Complete Ionic Equation. Stages 2 and 5 are "Now Test It" prediction cards.
No ramp (nothing numeric is typed); the counts are the quantity ramp: pictures (window), prediction, counted pucks, new cases.

## What is weak (for the owner to judge)
- Stage 1 is an operating stage (mix and filter), easy by design; it earns a word.
- Stage 6 has a hunt of four dial settings, bounded, and the rule is induced from four mixtures (the reward states the AP rule).
- The window keeps discs of a jar to six per half; every case in the bench fits (checked in Node).
- Stage 4's solid chip choice (3 chips) is a 1-in-3 guess on its own, but passes only together with the exact puck counts.
- The lamp compares ion counts, not conductivities (charge and size ignored): fine for this bench, said nowhere.
- Pucks/chips at 3D On use the kit's default piece bodies; not looked at in the browser.
