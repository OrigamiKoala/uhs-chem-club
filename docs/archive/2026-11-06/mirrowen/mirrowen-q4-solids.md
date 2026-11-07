# Mirrowen `q4-solids` — Kinds of Solid (CED 3.2, 3.3.A.1) — stage table

Six stages (a recap). Ligar's `unit03/q2-lattice` already teaches ionic, metallic and network solids, alloys, conduction and brittleness, so
this bench adds only **molecular solids** (the grips of `q2-grip`) and **crystalline against amorphous**, then uses all of it in two sealed
sorts. `BUILDS_ON`: `unit03/q2-lattice`, `unit06/q2-grip`. Vocabulary earned here: *molecular solid* (stage 1), *crystalline* and
*amorphous* (stage 3).

**The click.** "A solid is a solid: the same arrangement, only harder or softer." Stage 2 offers it as a card; stage 3 overturns it with
quartz and fused silica glass, which are the same atoms and give way differently.

**Instrument: the tester** (`kits/matter-tester.js`, fixture kind `solidtest`, piece kind `solid`). A slot for a sample card, a "Test" dial
(Melt, Strike, Current; a stage may offer one test, which has no dial and a key named for it) and a key. The panel shows the dial's test:
Melt, a trace of how rigid the sample stays from `T0` to `maxT` °C; Strike, one hammer blow and what is left; Current, two lamps (cold,
molten). A stage may swap the panel for a **window** that draws the particles of the sample (no dial, no key). A card keeps what each
test showed (`props.melt`, `strike`, `cur`), so readings can be compared in trays.
All figures: `engine/matterdata-tester.js` (sources and rounding in its header). Flat only: a trace, a hammer picture, two lamps and a
particle picture are flat things, and the window is a labelled cartoon, so `3D On` draws the same panel on the plate (no `dress3d`).

**Substitutions from the seeds.** Paraffin wax is a mixture and melts over 47 to 64 °C, which would blur the very click this bench is about
(a range means glass); **naphthalene** (CRC 80 °C, a pure molecular solid) stands in for it. Iodine sits in a sealed tester so it melts at
114 °C and does not sublime. The "job" stage is dropped: Ligar's `q2-lattice` stage 5 already picks a liner from tested properties.

## Stages

| # | Prompt | Evidence | Prints (and why it is not the answer) |
| - | --- | --- | --- |
| 1 | Sort the solids by whether melting each one only has to overcome grips between molecules. | Melt only, heater −40 to 200 °C; ice, iodine, naphthalene, salt, copper | Axis ticks and the trace; the card keeps `0 °C`, `114 °C`, `80 °C`, `> 200 °C`. No picture, no formula |
| 2 | (predict) Quartz and fused silica glass are both made only of silicon and oxygen: how will each give way as it is heated? | none (three cards and a slot) | Cards: both melt at one temperature (the held belief); quartz at one, glass gradually; glass holds longer |
| 3 | `You guessed …: heat each solid and file it by how it gives way.` | Melt only, 0 to 2000 °C; quartz, fused silica, salt, copper | The trace, the card (`1713 °C` against `1040–1585 °C`). Tray names state two observations, not the explanation |
| 4 | File each sample as crystalline or amorphous. | The window only, no heater; samples A to E: window glass, copper, fused silica, ice, quartz | The window's picture of the sample in the slot; letters, no names |
| 5 | Sort the four sealed solids into the tray for the kind of solid each is. | Melt, Strike, Current, 0 to 2000 °C; X1 quartz, X2 copper, X3 naphthalene, X4 salt | Traces, hammer pictures, lamps; letters only, no window |
| 6 | Sort the five sealed solids into the tray for the kind of solid each is. | As 5; X1 window glass, X2 iodine, X3 iron, X4 quartz, X5 potassium chloride | As 5. The glass matches the salt on the hammer and on both lamps; only the trace differs |

### Wrong answers and the message each gets (the reading the table shows, never the rule)

1. Salt in "Only grips between molecules": *Salt's trace stayed rigid to the top of the heater's range, 200 °C, and it sits in the "…" tray.* (An untested sample: *X has not been in the tester yet.*)
2. (A card in the slot passes; the guess is never graded.)
3. Fused silica in "Gives way at one temperature": *Fused silica's trace fell a little at a time from 1040 °C to 1585 °C, and it sits in the "…" tray.* The same for quartz: *stood flat to 1713 °C and fell at once*.
4. A crystal in "Amorphous": *The picture of sample B does not look like the picture of sample A, which is filed with it* (the mate is always of the other class; with none, *Look at the picture of sample B again beside the pictures of the other samples*).
5. and 6. X filed wrongly: *X1 showed 1713 °C, shatters, lamp cold: no, lamp molten: no, and it sits in the "Ionic" tray.* (the whole record the card kept).

`LEAKS` (`tools/lib/mirrowen/q4-solids.mjs`): no refusal may carry *amorphous, crystal, pattern, order, jumbled, glass* (3), *pattern, repeat, regular, rows, jumbled, glass* (4), *because, conduct, brittle, malleable, metal* (5 and 6).

### Hints (control / what to look at / method) and rewards

1. Use the tester, its "Heat" key and the two trays. / Compare how far up the heater's range each sample held its shape before it ran. / The weaker the hold between particles, the less heat it takes to loosen them, and the grips between molecules are weak holds. — *Molecular Solids*: whole molecules held by weak grips; melting moves them apart and leaves each whole.
2. Use the three cards and the slot. / Think about what the two solids share and what could still be different. / Commit to the way you expect each to give way as the temperature climbs. — *Now Test It* (the guess comes back in stage 3's prompt and reward).
3. Use the tester, its "Heat" key and the two trays. / Compare the shape of each trace as the temperature climbs. / Some samples lose their stiffness at a single temperature, and others a little at a time. — *Crystalline and Amorphous*.
4. Use the window: drag a sample into the slot, then into a tray. / Compare whether the particles of each sample sit in a pattern that repeats. / A pattern that repeats in every direction is crystalline, and particles with no repeating pattern are amorphous. — *Reading the Picture* (metals, molecules and quartz are crystalline; glass has no pattern).
5. Use the tester: drag a sample in, turn the "Test" dial, press "Test" for each test. / Compare the melt trace, the hammer result and the two lamps of each sample with the others. / Ask which solid lights the lamp cold, which only molten, which melts lowest and which holds out longest. — *Four Records*.
6. As 5. / Two solids can agree on most tests, so compare every reading of every sample. / A trace that falls at one temperature and a trace that falls over a range mean different things about the particles. — *The Whole Record*.

## What the data says

Melting points (CRC, rounded): ice 0, naphthalene 80, iodine 114, potassium chloride 770, sodium chloride 801, copper 1085, iron 1538, SiO₂
1713 °C. Glass has no melting point; the two ends given are the standard annealing and softening points: fused silica 1040 and 1585 °C
(Corning 7980), soda-lime window glass 510 and 700 °C (Corning 0080). The trace between the two ends is a smoothstep: **a model**, not a
measurement (the plate shows only the shape). Hammer outcomes and the two lamps are the textbook behaviour of each solid; molten
soda-lime glass lights the lamp because its sodium ions move.

## Form, flat or 3D

Flat. A trace, a hammer picture, two lamps and a particle picture are flat things, and `3D Off` draws the same plate. The window is a 2D
cartoon (a silicon with three bonds, an oxygen at the middle of each bond, so the network is a plane picture of SiO₂). The amorphous
networks are the same number of silicons scattered at random, each joined to its nearest neighbours up to three, with arms at least 70°
apart; the crystal is a honeycomb. Both come from seeded functions, so a picture never changes between visits.

## Story

Lead (stage 1): *The ice sheets shatter like glass, and Vess wants to know whether that is what they are.* The animation (`solid-order`):
iodine heats in a lattice and its molecules loosen and stay whole (a count of whole molecules, from the drawn pairs); quartz and fused
silica are heated together and each draws its own trace from `stiffness`; the angles at every silicon are counted from the drawn picture
(one angle in the crystal, many in the glass). Filed: *ice melts at one temperature where glass softens over a range, so the ice sheets
are crystals and not glass.* (The bench's ice melted at 0 °C in stage 1; the claim about the sheets is Vess's inference.)

## What is weak (honest)

- Stage 1 is nearly a lookup once the player has heated the five samples: the answer is "melted low or not". It is the on-ramp that teaches
  the tester and earns *molecular solid*, and it is not trying to be deep.
- Stage 4 reads a picture. It is the CED's own objective (represent the difference), but the picture is the answer once it is seen; the
  discovery is in stage 3 and stage 6.
- The stage 3 traces for glass are a model between two real fixed points (see above). A glass trace is not a measured heating curve.
- Quartz is shown melting at 1713 °C without following its changes of crystal form on the way up (stated in the data header).
- Stages 5 and 6 reuse quartz; there is no second network solid the tester can honestly melt (diamond graphitises, silicon carbide
  sublimes, silicon is a semiconductor).
- The bench tables are full, so only the prediction carries a printed how-to line; the tester's own plate and its Tour step say how it works.
- Not looked at by eye: the window pictures were plotted flat in Node (`matterdata-tester.js`) and judged there, not at `3D On` on the table.
