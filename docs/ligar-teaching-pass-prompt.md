# Prompt: Ligar, the remaining teaching pass

Do the whole job in one autonomous run: do not stop between tasks to ask me what is next. Ask only about a conflict with PRODUCT.md or a decision that is genuinely mine.

**Start by reading `docs/original-prompt.md`** (setup tricks for the browser, the audit and fix process, the rules and the traps; world = Ligar, unit = `unit03`) and follow it. This file adds only what is specific to where Ligar stands now. Then read `docs/Ligar-audit.md`, especially its work log, the teaching-quality section, and the open defects.

## What has been done (do not redo it, but do re-check it by playing it)

A previous agent audited Ligar, fixed operability bugs and rewrote or added these stages. **None of them has been played by a student, and most were checked only with scripted actions plus screenshots**, so treat them as unproven:

- `q2-lattice` 6, 7: alloys (hammer pure, substitutional and interstitial blocks; sort atoms by width).
- `q3-distance` 1 (pull and push traces), 2 (energy for 2 mol), 6 (Coulomb's law ranking of an unheated salt).
- `q4-dots` 1 (count the valence electrons; the slate hides its total).
- `q5-resonance` 4 to 8 (formal charge: stamp and mark, hand count, two drawings, where the minus goes; bond order 4/3).
- `q6-shape` 3 (add arms until the depth gauge leaves zero), 6, 7 (octahedral, square planar).
- `q7-polarity` 1 (electronegativity: Arrows readings sorted into three bands).
- `q8-hybrid` 3 (was black; fixed), 5 (objective prompt), 6 (count sigma and pi).
- `q1-joins` 2, 3, 5 (atoms in a grid; stage 5 now reasons from outer electrons).
- Fixed in shared code: orbital nameplates sized in metres; lean-in view kept on a slipped drag; lone-pair dots hidden behind far-side atoms; `nojoin` cards.

## What is still open (your work)

1. **Never played by an agent:** `q5` stages 1 to 3, the whole of `boss-warden`, `q2` stages 1 to 5 beyond a look, `q6` stages 1, 2, 4, 5, `q7` stages 2 to 5, `q8` stages 1, 2, 4, `q9` stages 1 and 2. Play every one of these and every stage listed above **with real gestures**, and fix what you find.
2. **Known weak stages:**
   - `q1-joins` stage 2 shows the outcome of a join only as a rod or a drift; stage 3 sorts by a charge seen on the atom faces; nothing yet makes "a full outer shell" feel necessary, and electronegativity (taught only in `q7`) arrives after the idea it explains.
   - `q2-lattice` stages 2 and 3 sort to a taxonomy (conducts cold / only molten / never; rank by melting point) without asking the student to reason about why; the electron sea is not drawn on the metal pictures; alloys' effect on conductivity and melting point is untested.
   - `q9-orbitals` stage 3 is overloaded (twelve electron pieces, a ladder, jargon labels "PUSHES" and "HOLDS", counters, a magnet at once) and is beyond AP; cut what the decision does not need.
   - `q8` stage 5 observes a refusal; look for a task that makes the student predict first.
   - `q8` stage 3's mixer readout ("NOTHING MIXED") is partly covered by the knob.
   - The Warden: phases should re-test earlier ideas, not introduce new ones; check it against the audit's teaching questions.
3. **Missing content:** five-domain shapes (trigonal bipyramidal, seesaw, T-shaped) are not built; hybridization read from a formula is thin; `q6` and `q7` have little quantitative content; the electron sea and metallic bonding as a topic are only implied. Add what AP Unit 2 needs, preferring stages on the bench the idea belongs to.
4. **Student-confusion risk you cannot measure:** list the stages where you suspect a first-time student gets lost but could not prove it, so I can play those first.

## Ligar-specific traps

- The two-sided `verify` hard-codes stage indices for several Ligar quests in `tools/verify-learn.mjs`; inserting a stage shifts them and the `NOTES` keys in the quest file.
- Chart and counts: `src/learn/worlds/unit03-bonding.js` and `PRODUCT.md` (currently 237 stages).
- A new bench needs a site in `tools/gen-ligar-layout.mjs` and `src/three/world-data/ligar.json`, and `verify:ligar` checks overlap and walkability. Prefer stages.
- `q7` Arrows tool: a card must be a field card (`molCard(..., { field: true })`) or a dropped tool will not join.

## Deliver

Everything in `docs/original-prompt.md` section 3, plus: in `docs/Ligar-audit.md`, mark each stage listed above as played-by-real-gesture or not, and finish with the short list of stages only I can judge by playing.
