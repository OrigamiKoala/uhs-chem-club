# Thornmere (`unit13`): organic chemistry

Read with `docs/teaching-pass/BRIEF.md` and `PATTERNS.md`. This world is **not built**. The file is a lesson plan for a first build, written 2026-11-12 by a plan session to the same standard as the ten live worlds. No code was changed.

- **Session:** build session. One new fixture (the mirror) needs a strong model; the rest is reuse.
- **What exists:** the chart `src/learn/worlds/unit13-organic.js` (four placeholder quests); a stage list in `docs/plans/learn-quests.md` ("World 13", six quests of eight). No quest files, bank, glossary or checks.
- **Exam:** beyond the AP exam throughout. It must be followable by a 13-year-old, and "beyond the exam" appears nowhere in play text.
- **Boundary with the campaign:** reaction mechanisms (nucleophile, SN1, SN2) are taught by the Charge Gardens. This world names kinds of reaction and stops there.
- **To create:** `src/learn/quests/unit13/` (five benches and a boss), `src/learn/bank/unit13.json`, `src/learn/glossary/thornmere.js`, a `verify:thornmere` check, story animations, the 3D site.

## How this plan differs from the earlier stage list

- Six quests of eight become five benches and 28 stages plus a five-phase boss.
- "Structure and Properties" is folded into the benches where each property is met (a boiling point beside the isomer that has it, acidity beside the group that causes it), so a property is never a separate list.
- Substitution of a haloalkane is left to the campaign.

## Instruments

| Need | Source | Size |
| --- | --- | --- |
| Atoms that join by dragging, single, double and triple, with a formula read off the cluster | atom kit `atom` pieces, `formulaOf`, `moleculesOf` (Tallow `q1`, Ligar `q1`) | reuse |
| A 3D model on a central atom, turned with a joystick | Ligar `hubplate`, `turner` | reuse |
| A bond whose far end is turned | Ligar `twist` (`q8` stage 6) | reuse |
| A label built from word cards, with an example plate | pot kit `labelerFixture` (Kettle `q2`) | reuse |
| Heat to separate a mole, with a view of two molecules | matter kit `probe` (Mirrowen `q2`, as redesigned) | reuse |
| A particle window on a reaction, before and after | pot kit kinds `windowFixture` (Kettle `q8`) | reuse |
| A test that changes colour or not | pot kit `gasrig` pattern (Kettle `q8` stage 2) | reuse with a bromine-water test (M) |
| A bond-length meter | Ligar `gauge` (`q5` stage 2) | reuse |
| A pH meter on a flask | pH kit `phflask`, `phmeter` (Verdigris) | reuse |
| A maker that copies a unit from a supply into a chain | heap kit `maker` (Kettle) | reuse; units link end to end (M) |
| Tap a part of a drawn molecule | `kit.hotspots` (`gestures.js`) | reuse |
| **Mirror** | new: a 3D model beside its mirror image; the student turns the image with the joystick and a counter reports how many of its four groups coincide with the original's | **L** |

## Bench-level sequence

| Bench | Idea | Terms it introduces (gloss) |
| --- | --- | --- |
| `q1-chains` Carbon Chains (6) | Carbon forms four bonds, so it builds chains; a chain's formula and name follow from its length and branches. | hydrocarbon, alkane, skeletal formula, cycloalkane |
| `q2-unsat` Double Bonds (5) | Two carbons that share two pairs hold fewer hydrogens and can add more atoms across the bond. | alkene, saturated, unsaturated, addition reaction, aromatic |
| `q3-isomers` Isomers (6) | The same atoms can be joined in different orders, held on different sides of a double bond, or be mirror images that cannot be turned to match. | structural isomer, cis and trans isomer, chiral, enantiomer, stereocentre |
| `q4-groups` Functional Groups (6) | A small group of atoms on a carbon chain decides how the molecule behaves. | functional group, alcohol, aldehyde, ketone, carboxylic acid, amine, ester, condensation reaction |
| `q5-polymers` Long Chains (5) | Small molecules join end to end into very long ones, by adding across a double bond or by losing water at each link. | monomer, polymer, addition polymer, condensation polymer, amino acid, amide link |
| `boss` (5 phases) | Re-test. No new idea. | none |

Recaps at first use: covalent bond and the octet (`q1` stage 1, from Ligar `q4`); hydrogen bond and dispersion force (`q3` stage 2, `q4` stage 1, from Mirrowen `q2`); pi bond and restricted rotation (`q3` stage 3, from Ligar `q8`); weak acid and conjugate base (`q4` stage 3, from Verdigris); resonance (`q2` stage 4).

## Plan rows

"Texts" gives the final prompt (P), the briefing (B) where the stage needs one, and the reward (R).

### `q1-chains` Carbon Chains (6 stages)

| # | Stage | Idea | What the student does; what responds | Texts | Built from |
| --- | --- | --- | --- | --- | --- |
| 1 | Four Bonds Each | Carbon forms four bonds and hydrogen one. | Loose C and H atoms; a carbon's full-shell light comes on at four bonds. Build a molecule with two carbons. | B: "A carbon atom has four valence electrons and forms four bonds. A compound of only carbon and hydrogen is a hydrocarbon." P: "How many hydrogen atoms can two carbon atoms hold when they are joined by a single bond?" (the built molecule is the answer). R: "Six: each carbon uses one bond for the other carbon and three for hydrogens. This is ethane, C₂H₆." | atom kit |
| 2 | The Pattern | Each added carbon brings two more hydrogens: CₙH₂ₙ₊₂. | Methane, ethane and propane stand built with their formulas printed. A marker for the next. | P: "How many hydrogen atoms does a chain of five carbons hold?" R: "Twelve. Each carbon in the chain adds two hydrogens, and the two ends add one each: CₙH₂ₙ₊₂. Hydrocarbons with only single bonds are alkanes." | atom kit, `marker` |
| 3 | Naming the Chain | An alkane's name is a prefix for its number of carbons and the ending -ane. | Example plate: methane, ethane, propane with their models. A model of four carbons; prefix cards meth-, eth-, prop-, but-, pent- and the ending. | P: "What is the alkane with four carbons in its chain called?" R: "Butane. The prefixes run meth-, eth-, prop-, but-, then pent-, hex-, hept-, oct- for five to eight." | `labelerFixture`, plate |
| 4 | Drawing It Quickly | A skeletal formula draws only the carbon chain: each corner and each end is a carbon. | A model of pentane beside three zigzag cards of three, five and six corners-and-ends. | B: "A skeletal formula draws a zigzag line. Every corner and every end is a carbon atom, and the hydrogens are left out." P: "Which skeletal formula shows pentane?" | model, cards |
| 5 | A Branch | A branched alkane is named from its longest chain, with the branch's position as a number. | A 3D model of 2-methylbutane, turned with the joystick. Label slots for a number, a branch name and a chain name; an example plate (2-methylpropane). | P: "What is this branched alkane called?" R: "Its longest chain has four carbons, so it is a butane, and a one-carbon branch on the second carbon makes it 2-methylbutane." | `hubplate` view, `labelerFixture` |
| 6 | Closing the Ring | Joining the ends of a chain into a ring costs two hydrogens. | Hexane's six carbons with their ends free; joining the end carbons pushes off one hydrogen from each. | P: "How many hydrogen atoms does a ring of six carbons hold?" R: "Twelve, two fewer than the open chain, because each end carbon gave up one bond to close the ring. A ring alkane is a cycloalkane: this is cyclohexane." | atom kit |

### `q2-unsat` Double Bonds (5 stages)

| # | Stage | Idea | What the student does; what responds | Texts | Built from |
| --- | --- | --- | --- | --- | --- |
| 1 | Two Pairs Shared | Two carbons joined by a double bond hold four hydrogens. | Two carbons and loose hydrogens; a second drop of one carbon on the other makes a double bond. | P: "How many hydrogen atoms can two carbon atoms hold when they share two pairs of electrons?" R: "Four: ethene, C₂H₄. A hydrocarbon with a carbon–carbon double bond is an alkene." | atom kit |
| 2 | The Bromine Test | Bromine adds across a double bond and loses its colour. | Four sample jars tested with orange bromine water: two turn colourless. The window shows Br₂ adding across the double bond. | B: "Bromine water is orange. If bromine atoms bond to the molecules in a sample, the orange colour goes." P: "Which samples contain a carbon–carbon double bond?" R: "Bromine added across the double bond of two samples and its colour went. A reaction in which atoms add across a double bond is an addition reaction." | test rig (M), window |
| 3 | Adding Hydrogen | Hydrogen added across a double bond makes the alkane. | Ethene and an H₂ molecule; dropping H₂ on the double bond opens it. | B: "A molecule with only single bonds between its carbons holds as much hydrogen as it can: it is saturated. One with a double bond is unsaturated." P: "What does ethene become when hydrogen adds across its double bond?" (the built product is the answer). R: "Ethane. The double bond became a single bond and each carbon gained a hydrogen." | atom kit |
| 4 | Benzene | Benzene's six carbon–carbon bonds are equal, between single and double. | A ring drawn with alternating single and double bonds; the bond-length meter on each bond reads the same. | P: "How do the six carbon–carbon bonds of benzene compare?" Cards: "Three short and three long", "All the same length", "All single". R: "All six are the same, between a single and a double bond: the three extra pairs are shared round the whole ring. A ring like this is aromatic." | Ligar `gauge`, cards |
| 5 | Fats That Pack | Straight saturated chains pack closely; a cis double bond puts a bend in the chain and they pack less well. | Two pictures of chains lying together: straight chains side by side, bent chains with gaps. A melting trace for one. | P: "Which fat is solid at room temperature: the one with straight chains or the one with bent chains?" R: "The straight chains lie closer and attract each other more, so the saturated fat is solid. Bent, unsaturated chains make an oil." | matter kit pictures, `choice` |

### `q3-isomers` Isomers (6 stages)

| # | Stage | Idea | What the student does; what responds | Texts | Built from |
| --- | --- | --- | --- | --- | --- |
| 1 | One Formula, Two Molecules | The atoms of C₄H₁₀ can be joined in two different orders. | Four carbons and ten hydrogens; a second set beside it. The bench compares the two builds and says whether they are the same molecule. | B: "Molecules with the same formula but their atoms joined in a different order are structural isomers." P: "How many different molecules have the formula C₄H₁₀?" (two different builds is the answer). | atom kit, two trays |
| 2 | Which Boils Higher | The straight isomer touches its neighbours over more surface and boils higher. | Probe on butane; the view shows chains lying along each other. The branched isomer's card shows a compact shape. | P: "Which isomer of C₄H₁₀ has the higher boiling point?" R: "The straight chain: it lies along its neighbours and attracts them over its whole length. Isomers are different substances with different properties." | matter `probe`, cards |
| 3 | Fixed on One Side | A double bond cannot turn, so groups on the same side and on opposite sides give two molecules. | "Far end" dial on butane's single bond (turns freely) and on 2-butene's double bond (the side-by-side orbitals come apart and the dial springs back). | P: "Can the two forms of 2-butene turn into each other by twisting the middle bond?" `selector`: "Yes", "No". R: "No: twisting a double bond would break it. The form with both CH₃ groups on one side is cis; on opposite sides, trans." | Ligar `twist` |
| 4 | The Mirror | Some molecules cannot be turned to match their mirror image. | Three models, each beside its mirror image; the joystick turns the image and a counter shows how many groups coincide. | B: "An object is chiral if no turning makes it match its mirror image, as a left hand never matches a right." P: "Which of these molecules are chiral?" Trays: "Chiral", "Not chiral". R: "The carbon with four different groups could match only two at a time. A chiral molecule and its mirror image are enantiomers." | **mirror** |
| 5 | The Carbon That Does It | A carbon bonded to four different groups makes a molecule chiral. | A drawn molecule (alanine); tap a carbon. | P: "Which carbon atom makes this molecule chiral?" R: "The one bonded to four different groups: H, CH₃, NH₂ and COOH. Such a carbon is a stereocentre." | `hotspots` |
| 6 | A Pocket With a Shape | Mirror-image molecules behave differently where they meet something that is itself chiral. | A pocket with three shaped sites; each enantiomer is turned and dropped in; one seats on all three sites, the other on two. | P: "Which form fits the pocket?" R: "Only one enantiomer fits all three sites. Many medicines work in one mirror-image form and not the other, because the molecules of the body are chiral too." | mirror models, slot |

### `q4-groups` Functional Groups (6 stages)

| # | Stage | Idea | What the student does; what responds | Texts | Built from |
| --- | --- | --- | --- | --- | --- |
| 1 | One Atom Changed | Replacing one hydrogen with –OH changes how the molecule behaves. | Ethane and ethanol cards; probe on both; the view shows ethanol's O–H drawn to the next molecule's oxygen. | B: "A functional group is a small group of atoms on a carbon chain that decides much of how the molecule behaves. The group –OH makes an alcohol." P: "Why does ethanol need far more heat to separate than ethane?" Cards: "Its –OH groups form hydrogen bonds", "It is much heavier", "Its chain is longer". | matter `probe`, cards |
| 2 | Carbon and Oxygen, Doubly Bonded | A C=O at the end of a chain makes an aldehyde; in the middle, a ketone. | Three-carbon chains and a double-bonded oxygen to place; two models. | B: "A carbon double-bonded to an oxygen is a carbonyl group. At the end of a chain it makes an aldehyde; inside the chain, a ketone." P: "Where can a C=O go on a chain of three carbons?" (one model of each is the answer). | atom kit |
| 3 | The Acid Group | –COOH donates its proton because the charge left behind is shared by two oxygens. | pH meter on ethanol and on acetic acid; the acid's card draws its conjugate base with the charge spread over both oxygens. | B: "The group –COOH makes a carboxylic acid." P: "Why is acetic acid an acid when ethanol is not?" Cards: "The charge left behind is shared by two oxygens", "It has more hydrogens", "It has a longer chain". | `phflask`, `phmeter`, cards |
| 4 | The Base Group | An amine's nitrogen has a lone pair that accepts a proton. | Window: methylamine poured into water; the white hydrogen of a water molecule ends on the nitrogen. | B: "A nitrogen bonded into a carbon chain makes an amine." P: "What does an amine do when it is poured into water?" Cards: "It accepts a proton from water", "It donates a proton to water", "Nothing". | `phpour`, cards |
| 5 | Acid Meets Alcohol | An acid and an alcohol join, and a water molecule leaves. | Acetic acid and ethanol models; dropping one on the other joins them and frees H₂O, which the bench names. | P: "Which small molecule is given off when a carboxylic acid joins an alcohol?" (drag the freed molecule to the slot). R: "Water: –OH from the acid and H from the alcohol. The product is an ester, and a reaction that joins two molecules and gives off a small one is a condensation reaction." | atom kit, slot |
| 6 | Finding the Groups | A large molecule is read by its functional groups. | A drawn molecule (aspirin); tap each functional group; name tags to lay. | P: "Which functional groups does aspirin contain?" R: "A carboxylic acid and an ester, on an aromatic ring. Its behaviour follows from those three parts." | `hotspots`, tags |

### `q5-polymers` Long Chains (5 stages)

| # | Stage | Idea | What the student does; what responds | Texts | Built from |
| --- | --- | --- | --- | --- | --- |
| 1 | Ethene Into a Chain | Alkene molecules join end to end as each double bond opens. | One ethene in the dock; "Make" copies it from the supply onto the growing chain; each double bond is drawn opening into two single bonds. | B: "A small molecule that joins to others of its kind is a monomer, and the long chain they make is a polymer." P: "What happens to ethene's double bond when its molecules join into a chain?" Cards: "It becomes a single bond, and each carbon bonds to the next molecule", "It stays double", "It breaks the molecule in two". R: "Each double bond opened to link the next unit. Nothing is given off: this is an addition polymer, polyethene." | heap `maker` (M), cards |
| 2 | A Link That Loses Water | Monomers with a reacting group at each end join by condensation. | Two kinds of two-ended monomer; each join frees one H₂O, which collects in a counted tray. | P: "How many water molecules are given off when four monomers join into one chain?" (marker). R: "Three: one at each link. A polymer made this way is a condensation polymer; polyester and nylon are two." | `maker`, `marker` |
| 3 | Amino Acids | Amino acids join through an amide link between the acid group of one and the amine group of the next. | Two amino acid models; tap the two groups that will react; the join frees water. | B: "An amino acid has an amine group at one end and a carboxylic acid group at the other." P: "Which two groups react when two amino acids join?" R: "The –COOH of one and the –NH₂ of the next, giving off water. The link is an amide link, and a long chain of amino acids is a protein." | `hotspots`, atom kit |
| 4 | Longer Chains | The longer the chains, the more they attract and tangle. | Probe on chains of 2 and 20 units; a card for 2,000. | P: "Which sample needs the most heat to separate its molecules?" R: "The longest chains: every unit adds to the attraction between neighbours. This is why polyethene is a solid and ethene a gas." | matter `probe`, cards |
| 5 | Which Monomer | A polymer's repeating unit shows what it was made from. | A drawn stretch of chain; three monomer cards. | P: "Which monomer made this chain?" | cards, slot |

### Boss (5 phases)

| # | Phase | Re-tests | Design |
| --- | --- | --- | --- |
| 1 | The Name | `q1` stage 5 | A model of 2-methylpentane. P: "What is this alkane called?" |
| 2 | The Test | `q2` stage 2 | Three sealed jars and bromine water. P: "Which jar holds an unsaturated compound?" |
| 3 | The Count | `q3` stage 1 | Five carbons, twelve hydrogens. P: "How many structural isomers does C₅H₁₂ have?" (marker, with builds as the check). |
| 4 | The Groups | `q4` stage 6 | A drawn molecule. P: "Which functional groups does this molecule contain?" |
| 5 | The Chain | `q5` stage 5 | A stretch of condensation polymer. P: "Which two monomers made this chain?" |

## Glossary (`src/learn/glossary/thornmere.js`)

`TERMS` as in the sequence table. `BANNED`: *backbone*, *stick*, *arm*, *hand* outside the one gloss of chiral, *recipe*, *wants*, *likes* ("like dissolves like" is not used here), *sticky*. `NEEDS`: covalent bond, hydrogen bond, dispersion force, pi bond, weak acid, lone pair.

## Chemistry to verify and record

- C₄H₁₀ has two structural isomers; C₅H₁₂ has three. Butane boils at −0.5 °C and 2-methylpropane at −11.7 °C.
- Cyclohexane is C₆H₁₂; benzene's C–C bonds are all 139 pm.
- Cis fats are bent; trans fats are nearly straight. Say "a cis double bond" in `q2` stage 5.
- Aspirin: a carboxylic acid, an ester, a benzene ring.
- Honest clause for `q3` stage 6: "many medicines", not all.

## Open for the builder

- The mirror fixture is the one new piece: two views of one model sharing a joystick, with a match counter that is the instrument's read, not the answer.
- Whether the atom kit's `planJoin` allows a ring to close and an H₂ or Br₂ molecule to add across a double bond. Both are needed (`q1` stage 6, `q2` stages 2 and 3, `q4` stage 5). If not, these stages need a planner extension, which is the largest hidden cost in this world.
- `maker` linking units end to end and counting water given off.
- `labelerFixture` with three slots (number, branch, chain).
- Chart: replace the four placeholder quests with the five bench ids above.

## Hand-back (plan)

- 28 stages and 5 boss phases, all new: 17 on reused fixtures unchanged, 9 with a new option (M), 2 on the one new fixture (L; `q3` stages 4 and 6).
- Most likely to go wrong in the build: `q3-isomers` stage 4 (a new 3D fixture whose whole point is something the student must see by turning); the atom kit joins that organic molecules need (rings, additions, condensation), which no live world has asked of it; `q1-chains` stage 5 (naming with three label slots inside the phone-size floors).
