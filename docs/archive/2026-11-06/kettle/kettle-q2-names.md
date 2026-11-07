# Kettle bench 2: `q2-names` (Names and Formulas)

Status: design written before the code (2026-10-30, branch `world/unit07-q2`). The quest module, kit (`pot-names.js`), data (`reactdata-names.js`), checks and story hold the facts; this file holds the reasoning.

**CED honesty.** Names and formulas are not a CED topic; every AP unit assumes them (the chart and `docs/AP-coverage-audit.md` say "assumed"). The bench says so in the chart line only; nothing on the bench claims exam coverage.

**The setting.** The labelling shed of the foundry. Crates carry labels nobody can read; the player writes the labels. Lead line: *The foundry's crates carry labels nobody can read.* Filed: the manifest's ore is iron(III) oxide, Fe2O3 (so it is a compound with a fixed share of metal).

**The clicks.** (1) "A formula is the symbols side by side, one of each" (MgCl, AlO). Predicted on stage 1, tested on stage 2 in a cell whose needle reads the charge. (2) "The Roman numeral is the subscript" (FeO would be iron(I), Fe2O3 iron(II)): the numeral is the charge of one iron ion, and the cell's needle shows what the oxide ions add to.

**Deviations from the seed table (and why).** The seed's eight stages become: a predict/test pair on the click (stages 1 and 2, as the doctrine asks), naming with -ide (3), the numeral (4), the dissolving experiment merged with formula writing (5: the four-salt sort became a two-sample experiment whose answer is a written formula, so the polyatomic ion is discovered and used in one stage), prefixes (6), acid names (7) and a sealed crate (8). Stage count stays 8.

## Kit (all in `pot-names.js`, names chosen not to collide with Tallow's `ion`/`needle` or Optics' `cell`)

- piece `ionchip` (a square slab with a round ion drawn on it; a polyatomic ion is its atoms joined inside one outline). It may hide its charge.
- fixture `ionneedle` (a charge needle reading one tray: the sum of the charges PRINTED on the pieces in it; a piece that hides its charge adds nothing). A cell is a plain tray plus this gauge.
- fixture `labeler` (backdrop): a label strip with N slots; frame words printed round the slots (e.g. "iron ( ) oxide"). It reads what stands in the slots and prints the label it spells.
- fixture `window` (backdrop, has a Run key "Dissolve" or "Look"): one seat for a crate; Run draws what is in the water (atoms labelled, a polyatomic ion joined) or the molecule's atoms. A crate is a piece `crate` (a box with a printed name or none).
- Name tiles are the heat kit's `tag` cards; formula tokens are `chip` cards.

All readings come from `reactdata.js` (`IONS`, `ionicFormula`, `netCharge`, `nameIonic`, `nameMolecular`, `nameAcid`, `parseFormula`) and `reactdata-names.js` (ion atom layouts, molecule atom layouts, salt and crate tables, token joining).

## Stages

Answers are in the quest's `SOLUTIONS`; every refusal names what the table shows and never the rule or the answer.

1. **Predict** (`s1-predict`): choose the formula for Mg2+ and Cl-. Cards MgCl, MgCl2, Mg2Cl, Mg2Cl2, Mg3Cl2 and a slot; no instrument. Never graded; recalled by stage 2.
2. **Build the group** (`s2-group`): a supply tray (3 Mg2+, 5 Cl-) and a cell with a needle. Answer: 1 Mg and 2 Cl in the cell. Prints: disc charges, the needle total; never a ratio. Slip: 1 Mg + 1 Cl ("The needle reads +1 with 1 Mg and 1 Cl in the cell"); 2 Mg + 4 Cl ("The needle reads 0, and the cell holds one group twice"). Earns *ionic formula*. Flat. Ramp: picture.
3. **Name the compound** (`s3-ide`): a cell holds Mg2+ and O2-; labeler with two slots; tiles sodium, magnesium, chlorine, chloride, oxygen, oxide. Answer: magnesium oxide. Plate: an example (K+ with Br- is potassium bromide), the convention. Slip: "magnesium oxygen" ("The label has the element name oxygen; the cell holds an O disc that carries 2-"). Earns *naming ionic compounds* (-ide).
4. **The numeral** (`s4-numeral`): two cells, FeO and Fe2O3, the Fe chips hide their charge, each needle adds the printed charges (-2, -6); a labeler per cell with one slot in "iron ( ) oxide"; tiles (I)-(IV). Answer: (II) and (III). Slip: (I) and (II) (the count of iron in the cell). Earns *Roman numeral*.
5. **Write the formula** (`s5-dissolve`): two crates (A holds NaCl, B holds Ca(NO3)2) go in the window, Dissolve shows what is in the water; the formula of crate B is written with chip tokens in a row of slots. Answer: Ca ( NO3 ) 2. Slips: CaNO32 (no brackets), CaN2O6 (atoms apart). Earns *polyatomic ion*.
6. **Name the molecule** (`s6-prefix`): crate A (printed "carbon dioxide" = CO2) and crate B (N2O4) in a window that draws the molecules' atoms; a labeler with four slots (prefix, element, prefix, ending); plate of prefixes. Answer: dinitrogen tetroxide. Slips: "nitrogen tetroxide" (no first prefix), "dinitrogen dioxide" (counted the wrong atom). Earns *molecular prefixes*.
7. **Acid names** (`s7-acid`): two cells (H+ with Cl-, H+ with NO3-), a labeler each with one slot in "( ) acid"; plate with two examples (hydrobromic, sulfuric). Answer: hydrochloric, nitric. Earns *acid names*.
8. **The unmarked crate** (`s8-sealed`): a crate with no label in the window (Dissolve): 2 Fe with hidden charge and 3 SO4 groups carrying 2-; plate of polyatomic names; labeler with three slots (metal, numeral, ion). Answer: iron(III) sulfate.

## Weak points

Naming is convention, so the rule is printed on the object (an example or a prefix plate); the discovery is only in what to apply it to (the charge arithmetic, the atom counts, which ions are joined). Stage 6 is the weakest: counting atoms in a picture is reading, kept because the prefix IS the count. The numeral stage hides the iron charge but the oxide charge is printed, so the arithmetic is two steps.

## Build record (as built)

- Files: `src/learn/quests/unit07/q2-names.js`, `src/learn/table/kits/pot-names.js`, `src/learn/engine/reactdata-names.js`, `src/ui/story-scenes-kettle-q2.js` (scene `crate-labels`), `tools/lib/kettle-q2-names-checks.mjs`; edits to `unit07-stoichiometry.js` (live), `stage-story.js`, `quest-story.js`, `bank/unit07.json` (`bench.q2-names.problems`, two items; no worked problem: the bench is not computational).
- Layout as built: stage 2 has a supply tray and a cell with a needle; stages 3 and 7 need no needle (the chips print their charges and the ions are the evidence); stage 4 carries the convention ("the number in brackets is the charge of one iron ion") as a printed how-to line, because it is how to answer, not which move solves; stage 5's formula strip has five slots with six cards (one spare); the cards for stages 5, 6 and 8 start in a tray so the 150 x 64 table stays clear.
- Piece and fixture kinds are `ionchip`, `crate`, `ionneedle`, `labeler`, `window`; the names `ion`, `needle` and `cell` are not used because Tallow's atom kit, Tallow's tour and the optics kit already own them. Every piece is a rectangular slab so it builds as a card at `3D On`; there is no `piece3d`/`dress3d`, so `3D Off` and `3D On` show the same picture.
- Tour: pieces `pot:ionchip`, `pot:crate`; fixtures `pot:ionneedle`, `pot:window`. The `labeler` is a backdrop with no key, so the Tour skips it (as it skips the slice's balance: `tour.js` passes over a backdrop fixture with no key and no dial); the slots are explained by the how-to lines and by the card and chip steps.
- Graded by: stage 1 a card in the slot (never graded); 2 chips in the `cell` tray; 3 to 8 the words in the label's slots read in order (`labelWords`), compared with `nameIonic` / `nameMolecular` / `acidWord` / `ionicFormula` and the `spell` of the formula cards.
- Checks (Node, independent literals): the graded names and formula, the roman numerals, the needle on every table the stages build (stage 2 four ways, stage 4 -2 and -6, hidden iron adds nothing), the atoms each window draws, the predict stage holds no instrument, a blank table never passes, no plaque prints an answer, no refusal carries the method or the answer.
- Words printed that are, strictly, answer material and why they stay: the cards and chips carry the candidate words (a naming bench has to offer words); stage 6's plaque pairs each count word with its number and stage 8's plaque lists ion names (SO4 is sulfate), because both are conventions that cannot be discovered; the discovery left is which tile fits (the charge arithmetic, the atoms drawn, which atoms are joined).
