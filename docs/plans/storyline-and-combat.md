# The Fifth Guild: storyline and combat

**Status (2026-10-10):** Phases 0-2 are built. The §9 decisions are settled (D3b, whether
Vess was one of the abandoned crew, is deliberately left open; D8, the playtest, is
pending). **Phase 2's playtest is the go / no-go gate: nothing from Phase 3 on is started.**
The rest of the plan can be revised as we go.

| Phase | State |
|---|---|
| 0. Doctrine | **Done.** `docs/story/bible.md`; PRODUCT.md (purpose, principle 5 note, principle 10); CLAUDE.md (the encounter doctrine, the engine bullet, the `verify:learn` description). |
| 1. Encounter layer, 2D | **Done.** `src/learn/engine/foes.js` (pure) and `encounter.js`; hooks in `frame.js` and `stagerunner.js`; `.lq-foe` styles in `learn.css`; the `verify:learn` encounter checks. Stages declare `encounter`; no `check()` changed. |
| 2. Pilot | **Done.** `unit01/q1-grain` (8 stages, salt husks) and `unit02/q2-photon` (8 stages, lamp moths). |
| 5. Combat at T4 | **Done.** `src/learn/engine/foebody.js` (procedural body kit), `encounter3d.js` (foe layer on `BenchViewer3D`), snapshot hook in `encounter.js` and `bench-host.js`. |
| 6. Built road combat | **Done.** Unit 1 (`q1`–`q6`, `boss-hopper`), Unit 2 (`q1`–`q9`, `boss-eater`), Unit 3 (`q1-joins`, `q2-lattice`, `boss-warden`), Unit 7 (`q1-recipe`, `boss-golem`). Procedural geometries (`basalt warden`, `recipe golem`), 3D FPS kinematics and camera trauma. |

### Built differently from §4 and §8 (and why)
- **Bin stages keep their bins.** §4's table says stages 6-8 of `q1-grain` assign Seal /
  Shake / Cut. The bins and their ids are the graded answer and are unchanged; only stage 8
  names a move per category (`moves`: Contain / Split / Shake), shown beside each key.
  Stage 7 has only "single substance" and "mixture", and a single substance is not one
  move, so it carries none.
- **The Commit key is renamed for the attack** (`act`), per stage, one or two plain words.
- **Foes are made from the bench, not declared.** One per sample or plate; `verify:learn`
  checks the mapping anyway.
- **Intent is a posture, not a spoiler.** §4 floats intent as evidence ("its layers
  shuffling"); on a classification stage that line IS the answer. The evidence is the
  foe's *reaction* to a tool the player chose to use (`planFoe`), and the intent only
  sets the scene.
- **§5 `q2-photon` stages 3-4 describe a red lamp; the built stage 3 fixes a violet one.**
  The encounters follow the built stages.
- **Flawless** is shown on the plate when a stage is won with no Integrity lost. It does
  not write a Clean mark; that wiring is deferred to the progression pass.

This plan turns Avalon into a story-driven RPG. The fourteen Learn worlds become the
**main storyline**. The campaign sectors (Erebus first) become **side contracts** that turn
up between chapters. Every bench stage becomes an **encounter with a monster**, and the
chemistry is how you win it.

It does not throw away what is built. The 18 built Learn quests keep their stage tables,
`check()` functions, instruments, hint ladders, reward cards and verifiers. Combat is a
layer that goes on top of the stage loop, and the chemistry underneath doesn't move. That
is a design choice, explained in §4.

---

## 1. The premise, refined

### What we start from
Avalon already has a lot of fiction in place: the four Imperial Guilds, the salvage hauler
*Avalon*, the quartermaster Vess (only ever a voice and a silhouette), Session Zero, and
Erebus, whose relay pylons "went dark when the old crew left". The refinement keeps all of
that and gives it a direction.

### The pitch (one paragraph, in plain words)
The four Guilds own the frontier. Mineral Mining, the Atmospheric Harvesters, the Thermal
Smelters and Moisture Extraction hold every *charter*, the legal right to survey and work
a new world, and nobody lands anywhere without one. You are a junior **survey hand** for
one of them, posted to the *Avalon*, a forty-year-old hauler that all four guilds share
under an old truce. The work is routine. Then a fifth outfit appears on the frontier with
no charter, no livery and no name. People call it **the Fifth**. Survey crews come back
from worlds it has visited with stories that don't add up: refineries stripped overnight,
crews gone silent, and spoil heaps that **get up and walk**. One rumour goes round every
mess deck: the Fifth can turn one kind of stuff into another.

### Why this premise fits a chemistry game
**The main mystery is a chemistry question, and the curriculum answers it.** Tallow
teaches early on that an element cannot be split or turned into another one by any
ordinary means (`q1-grain` stage 4, the sample that will not divide), and that the core
decides which element an atom is (`q2-core`). So the rumour is impossible, and a player who
has done Tallow can say why. The story then hands out clues world by world: a slag heap
holding an element that was never in the ore, a recipe ledger whose outputs outweigh its
inputs (Kettle teaches that this can't happen), and a world whose rocks are slowly getting
warmer. The answer arrives at **Cinder Halo**, the last world, which is nuclear chemistry.
The Fifth isn't doing chemistry. It is changing the **nucleus** itself, which is real and
possible, and it burns through worlds to do it. A sharp student could guess the answer
after Tallow, from the clues and what they know. That is the experience we want:
**the curriculum is the detective kit.**

### The Fifth's true name, and the reveal it allows
The Fifth calls itself **the Catalyst**. The players learn that name in **Quicklight**
(kinetics, world 11), on the same stage whose reward card teaches what a catalyst is:
something that makes a change happen faster and comes out the other end unchanged. That
is how the Fifth works inside the four guilds. It makes things happen and is never the
one left holding the result. This follows the vocabulary schedule exactly. The word is
withheld until it has been earned, and once earned it pays off in the story. Before that,
every line says "the Fifth", which is the plainest English available (CLAUDE.md: the
fallback is never a coinage).

### Who the Fifth are (recommended twist, see D3)
The Fifth is made of **crews the Guilds abandoned.** Erebus is the first clue: the
Charge Gardens "went dark when the old crew left", and nobody asks where that crew went.
Over the years the Guilds have written off survey crews when a charter stopped paying.
Those crews survived, found each other, and found the old transmutation works at Cinder
Halo. The dark rumours about the Fifth come from the Guilds themselves. That gives the
story a moral question that teenagers will take seriously. The Fifth is doing real harm
(burning worlds, setting spoil loose), but the Guilds are not innocent either. The ending
(D3) chooses between exposing the Guilds, bringing the crews home, or both.

### Vess
Vess stays the narrator and the Dungeon Master, and stays a voice and a silhouette. As
an option (D3b), the Act III reveal could show that Vess served on one of the abandoned
crews and has been steering the *Avalon* toward the Fifth's worlds on purpose. That twist
is strong, but it changes the voice the whole game is narrated in, so it is a decision
for you to make, not a default.

### The player
The player stays a silent, unnamed survey hand. Their guild flavours a line or two per
world (as `guildOpeners` already do on Erebus), but it never changes the plot. Guild
rivalry stays in Standings, where it already works.

---

## 2. The shape of the story

### Two roads, renamed for the fiction
| Road | Today | Becomes | Pays |
|---|---|---|---|
| Learn worlds (`#/learn`) | study road | **The main story**: fourteen chapters, one per world | No XP (see D1) |
| Campaign sectors (`#/quest`) | Charge Gardens etc. | **Contracts**: side jobs posted to the guild board | XP, as now |

The star map's two tabs, `Active Quests` / `Learn Quests`, become **`Story`** and
**`Contracts`**. The LEARN nav tab keeps its label for now (nav labels must match page
titles), and §8 Phase 4 decides whether it becomes STORY.

### Acts
The worlds stay **open from the start** (PRODUCT.md, so a student can play the unit their
class is on). Each world is therefore a **self-contained episode**: arrive, find what
the Fifth left, fight through the benches, beat the world's boss, pick up a clue. The
**spine** (the act-ending scenes aboard the *Avalon*) plays in road order. A spine beat
plays once its world's boss is down *and* every earlier spine beat has played. A player
who starts with Teeter gets the Teeter episode and its clue, and the spine catches up as
they fill in the earlier worlds. Nobody gets spoiled, and nothing gets locked.

| Act | Worlds | Episode thread | Spine beat at the end |
|---|---|---|---|
| **I. The Charter** | Tallow, Lanternfall, Ligar | Routine surveys go wrong. Spoil walks. The first sign of the Fifth (a stencilled mark with no guild livery). | A Guild inquiry aboard the *Avalon* tells the crew the Fifth are scavengers and to stay away. The clues don't fit that story. |
| **II. Pressure** | Bellows, Ember Reach, Mirrowen, Kettle | The Fifth recruits from guild crews. Kettle turns up its **recipe ledger**: the outputs outweigh the inputs. | The ledger is impossible by any recipe. Someone aboard has been passing the *Avalon*'s survey logs to the Fifth. |
| **III. Balance** | Teeter, Verdigris, Brinewire, Quicklight | Teeter: a Fifth machine holds a world off balance. Quicklight: **the name, the Catalyst**, and the abandoned crews. | The Guilds wrote these crews off. (The optional Vess reveal goes here.) |
| **IV. The Core** | Lodestone, Thornmere, Cinder Halo | Follow the warm rocks to Cinder Halo. | The finale: the transmutation works, the last boss, and the ending (D3). |

### What each world episode needs (the "chapter kit")
1. **Arrival**: one transmission from Vess, at most two sentences (the existing story-copy
   limit). It says what went wrong here, not what to do.
2. **The spoil**: one monster family per world, built from that world's own chemistry
   (§3).
3. **Encounters**: every bench stage, reframed (§4).
4. **The boss**: one per world, multi-phase, drawing on every bench in the world (§5).
5. **The clue**: one item for the Case File (§6), handed over by the boss.
6. **Closing line**: one transmission.

All story copy keeps to the existing rules: diegetic, at most two sentences per
transmission, no withheld vocabulary *for that world's schedule*, and never a hint at a
stage's route.

---

## 3. The monsters: spoil

### What they are
**Spoil** is what the Fifth leaves behind: waste from its works that has been stirred
into motion. Each family is **made of the chemistry its world teaches**. That one rule
lets a fight teach chemistry, because the monster's body obeys the same laws the bench
measures:

- A Tallow **salt husk** is a lump of matter. Some husks are mixtures, some compounds, some
  pure elements. Shake a mixture and it falls into layers. Cut a compound and it splits.
  An element can't be broken any further.
- A Lanternfall **lamp moth** is a metal-shelled thing that feeds on light. Knock enough
  electrons off its shell and it drops, but only light above its threshold frequency does
  that, however bright you make it.
- A Ligar **basalt warden** is held together by bonds. An ionic plate shatters along a flat
  face. A molecular plate melts low. A molten ionic core carries current.

### Rules for spoil (to go into CLAUDE.md, enforced by the verifier)
1. **A monster obeys chemistry. There is no magic.** Everything it does on screen comes
   from the stage's own declaration through a pure planner, like the honest-picture rule
   for the benches. If a husk falls into layers when shaken, that is because the sample
   it is made of is a mixture. A monster that does something the bench wouldn't is lying,
   the same way a scanner that invented a reading would be.
2. **Monsters are dispersed, never killed.** A husk crumbles into salt. A moth goes dark
   and drifts. A warden settles back into stone. There is no gore and no death. This is a
   school club.
3. **Species names are plain English** (*salt husk*, *lamp moth*, *basalt warden*), never
   a coined word the player has to memorise alongside the chemistry. That's the
   "light piece" failure mode, and CLAUDE.md already bans it.
4. **They fit SCOURED PLATE.** Spoil is matter, lit by filament or by its own *honest*
   light (a Lanternfall moth glows at its real emission lines, because that is
   chemistry). No neon, no bloom, no glowing eyes for effect.

### Families for the built worlds
| World | Spoil | Made of | Weak to |
|---|---|---|---|
| Tallow | salt husks, a swarm of grit | mixtures, compounds, elements; ions; counted swarms | separating, splitting, reading the core, weighing the swarm |
| Lanternfall | lamp moths, frost wraiths | metal shells (photoelectric), gas clouds (line spectra), cloud bodies (orbitals) | the right frequency, the right line, the right configuration |
| Ligar | basalt wardens, slag crawlers | ionic, covalent, molecular and network solids | strike, heat, cool, current: chosen by how the body is built |
| Kettle | recipe golems | compounds with fixed composition | the exact recipe |

Unbuilt worlds get their families when they are built (§7 gives one line each, so the
idea is clear).

---

## 4. Combat: how a fight teaches the same content

### What was asked
> Right now, a lot of the learning parts involve sitting there and fiddling with tools —
> is there some way to make a battle with monsters teach the same content?

Yes, and the reason it works is that **every Learn stage already has the shape of a
fight.** There is something on the bench you don't understand (an enemy). There are
tools that reveal how it behaves (scouting). There is one committed answer that is right
or wrong (an attack). There is a reason given when you are wrong (the enemy's
counter-move). And there is a card explaining what you just did (the loot). What's missing
is a body to fight, stakes, and a sense that something happened when you got it right.

### The test that separates real combat from a quiz in costume
> **If you can delete the monster and the stage is unchanged, the combat is decoration.**

A health bar stuck on a multiple-choice question is still a multiple-choice question, and
students can tell. So the monster has to carry **evidence**: its behaviour is how you learn
what it is made of. And the attack has to **be the answer**, not a button that submits an
answer you worked out somewhere else.

### The core loop: turn-based, scouting is free
```
the foe appears ─▶ SCOUT (bench tools, free, unlimited) ─▶ ACT (commit) ─▶ resolve
                         ▲                                                   │
                         └──────── miss: reason shown, foe counters ◀────────┘
                                   hit: foe staggers / disperses, field note (reward card)
```
- **Scouting is free.** Using the instrument (power dial, cutter, beam, lamp) never costs
  a turn. If looking cost something, the game would punish the curiosity it exists to
  build.
- **Only a commit is a turn.** On a miss, the reason appears *first* (the existing rule:
  nothing comes between a miss and its diagnosis), and then the foe makes its move.
- **The foe telegraphs its next move** (the "intent" mechanic from Slay the Spire).
  Where it fits, the intent *is* evidence: "the husk is drawing in, its layers shuffling"
  tells you it's a mixture.
- **Turn-based on purpose.** Real-time action is rejected (§10): it tests reflexes, not
  chemistry, it fails at 375 px and on T1, and it would eventually block a player who
  knows the answer but is slow with their thumbs. That breaks the rule that outranks the
  rest of the Learn doctrine.

### Every answer widget is already an attack verb
The stage runner and the Unit 1 quests already use these widget types. Each maps to one
combat action, so **no stage's `check()` has to change**:

| Widget | Attack | Example |
|---|---|---|
| `choice` / `choice-row` | **Choose a move** from a move set | lowest power that breaks the husk into grains |
| `sample` / `pick` | **Target**: which foe, or which weak point | the one husk of four that won't split |
| `number` / `decimal` | **Charge a shot** to an exact amount; too much and too little get different misses | strip electrons until the core reads +2 |
| `bins` | **Assign a move to each foe** in a pack | shake the mixtures, split the compounds, contain the element |
| `order` | **A combo**: the moves in sequence | order three plates by how tightly they hold, loosest first |
| `multi` | **Hit every weak point** | all the lines a wraith absorbs |
| `build` | **Forge**: make the exact piece that jams the foe | copy the repeating cluster to lure the husk |

A stage with four samples is a fight with **four foes**, and filing them into bins means
choosing a move for each. That is a pack fight, and it is the same stage.

### Stakes without punishing learning
Misses are how the current game teaches: hint rung 2 opens after one miss and rung 3
after two. So **losing has to cost nothing that matters**, or we punish exactly the
players we are building for.

- The player's rig has **Integrity** (a shield bar). A foe's counter takes some of it.
- At zero, the player is **knocked back**: the encounter resets with the foe whole again,
  and **everything learned is kept**. Hint rungs stay open, instrument readings stay,
  the miss count stays. Nothing outside the stage is lost. Being knocked back is a
  breather, not a game over.
- **A flawless win** (no Integrity lost) is the existing **Clean mark**: it pays nothing,
  and players can show it off.
- Integrity is never a timer, and nothing drains it except a committed miss.
- **Nothing ever blocks a correct answer.** A player who commits the right attack on turn
  one, without touching a tool, wins. The rule is untouched.

### What stays exactly as it is
The prompt still **states the objective in one plain sentence and never the route**. The
fiction is not allowed to make the player decode the task. This is the lesson Tallow's
old per-stage typewriter modals taught, and CLAUDE.md records it. An encounter adds a foe
nameplate and an intent line. It never adds a modal. Also unchanged: one briefing per
quest, three one-sentence hint rungs, reward cards of at most three sentences, the
vocabulary schedule and its verifier, T1 parity, the 375 px floor and local grading at
0 ms.

### Worked example: Tallow `q1-grain`, all eight stages
| # | Stage today | Encounter | Attack (widget) | Evidence the foe shows | On a hit |
|---|---|---|---|---|---|
| 1 | lowest power where the solid stops looking solid | one salt husk, looks like a solid lump | **choose** the beam power (`choice-row`) | at too low a power the strike bounces off a solid face | the husk breaks into grains. Card: *atom* |
| 2 | pick the one built from one kind of atom | two husks that look identical | **target** (`sample`) | under the scope, one is all one kind | the decoy falls apart. Card: *element*, *mixture* |
| 3 | count the kinds of atom | one husk | **charge** to the count (`number`) | its grains in the picture | it splits into its kinds |
| 4 | the one of four that cannot be split | a pack of four | **target** (`sample`) | the cutter splits three and glances off one | the core husk is pinned |
| 5 | build a copy of the repeating cluster | a husk that regrows | **forge** the cluster (`build`) | it regrows the same cluster each time | the copy jams its regrowth. Card: *molecule* |
| 6 | file two samples by recipe | two husks, same two kinds | **assign** a seal to each (`bins`) | different molecules under the scope | both sealed. Card: *compound* |
| 7 | substance or mixture, three samples | a pack of three | **assign** Shake or Cut (`bins`) | shaken, a mixture falls into layers | each one dispersed |
| 8 | element, compound or mixture, four samples | a pack of four | **assign** Shake / Split / Contain (`bins`) | the three moves *are* the three categories | the pack is cleared |

Stage 8 is the strongest case. In the fight, *element / compound / mixture* is no longer a
filing exercise. Each category is the move that works on that kind of matter: a mixture
separates, a compound splits, an element can only be contained. The player is doing the
classification with their hands.

### The second worked example: Lanternfall `q2-photon` (photoelectric effect)
This bench fits combat best, because the physics *is* a combat surprise: **more power
doesn't work.** A lamp moth's shell holds its electrons. The player's lamp has two dials,
brightness and frequency.
- Stage 1: get electrons off the plate → drive the moth's shell to shed electrons.
- Stage 2: lowest frequency that frees any → find its threshold.
- Stages 3–4: brightness vs frequency → a brighter red lamp makes the moth *brighter*, and
  that's all (a miss with a reason). A violet lamp at low brightness makes it shed.
- Stage 8: "why a brighter red lamp will never work on zinc". In the fight, a zinc-shelled
  elite shrugs off a red lamp at full brightness. The player has seen it happen before
  being asked why.

Every kid's instinct is "turn it up". The fight makes them watch that fail and work out
why. This is the bench to pilot second.

---

## 5. Bosses

One boss per world. It is a **multi-phase fight**, and each phase is one stage-shaped
question with its own `SOLUTIONS`, `MISSES`, hint ladder and reward card. It draws on
**every bench in the world**, which makes it the world's synthesis.

- **Each phase is a checkpoint.** A knock-back in phase 3 restarts phase 3.
- **A boss uses only words the world has already earned.** By the end of a world, that is
  all of them.
- **A boss gates only the story**: the clue and the spine beat. It never gates access to
  a world, a bench or the practice set.
- **A boss ships when its world's last bench ships.** Until a world is complete, it ends on
  an **elite** (a one- or two-phase fight over the built benches only). Ligar gets an
  elite now.
- Bosses are modules on the quest contract (`mount(container, ctx)`), charted as the
  world's last entry with `arena: 'boss'`, and graded by `verify:learn` like any quest.

| World | Boss | Phases (one idea each) | Clue it gives up |
|---|---|---|---|
| Tallow | **The Hopper**: the refinery's ore hopper, risen | classify its armour plates (`q1`) → read its core (`q2`) → find its missing element on the board (`q3`) → strip its core to neutral (`q4`) → weigh the swarm it sheds (`q5`/`q6`) | a slag sample holding an element that was never in the ore |
| Lanternfall | **The Lantern-Eater**: a cloud that drinks the lantern road | name it by the lines it absorbs (`q3`) → the frequency that breaks its shell (`q2`) → its configuration and the magnet (`q6`) → identify its core by PES (`q7`) → how much is left, by absorbance (`q9`) | a Fifth lens ground for wavelengths no guild instrument uses |
| Ligar (elite for now) | **Basalt warden** | strike, heat, current: decide how its body is built (`q1`/`q2`) | a quarry face cut by something hotter than any forge |
| Kettle | **Recipe golem** (elite until more benches are built) | the fixed recipe (`q1-recipe`) | **the ledger** (Act II's key clue) |

---

## 6. Where the story lives

### Data (pure, Node-importable like `curriculum.js`)
- `src/story/saga.js`: the spine. Acts, spine beats in road order, the Fifth, the Case
  File clue registry, and the ending.
- `src/story/worlds/unitNN.js`: one episode per world. Arrival line, spoil family, foe
  nameplates, boss phase lines, clue, closing line, and guild flavour lines.
- `src/learn/engine/foes.js`: foe declarations and `planFoe(stage, state)`, the pure
  function that decides what a foe does from the stage's own samples. This is the
  honest-picture rule for monsters.

### The Case File
A new terminal aboard the *Avalon* at T4 (the comms room already has a rack and a
console), and a page on every lower tier. It holds every clue found so far, pinned up.
Each clue is an object with a one-line note in Vess's voice. Clues are **collected, not
graded**: the board never asks a question. A student who has done Tallow and is looking at
"an element that was never in the ore" can work it out alone, and that's the payoff.

### Progress (no XP, see D1)
`session.learn` gains `saga: { beatsSeen: [], clues: [] }`, merged by union like the rest
of `setLearnState`. The `LearnProgress` tab gains a row kind for beats and clues.
`Scoring.computePlayerTotalXp` still doesn't read that tab.

---

## 7. The remaining worlds, in one line each
So that every future world is designed **encounter-first** (§8 Phase 7). These are seeds,
not specs.
- **Bellows** (gases): **built** (`bellows-world.md`). Gas bladders. They sag, hold, swell and strain
  with the push (or with the room, on a free piston), and are dispersed, never burst; the boss is a
  rogue compressor. (First imagined as pressure bladders that burst when squeezed; spoil is never
  killed, and the name would have spent stage one's word.)
- **Ember Reach** (thermodynamics): ember beasts that steal heat from whatever they
  touch. Calorimetry measures how much they took.
- **Mirrowen** (states, IMFs): mirror-skins that only hold together by the grip between
  their molecules. Break the grip, don't break the molecule.
- **Kettle** (stoichiometry): recipe golems, and a **limiting-reagent ammo craft**: the
  number of shots you can make is set by whatever runs out first.
- **Teeter** (equilibrium): **the regenerating boss.** Push it and it pushes back. Le
  Châtelier is how you beat a foe that heals: take away what it makes.
- **Verdigris** (acids and bases): acid slimes, neutralised by adding exactly the right
  amount of base. A titration *is* the fight, and the equivalence point is the killing
  blow.
- **Brinewire** (electrochemistry): **build your own weapon**, a cell, picking electrodes
  by their potentials.
- **Quicklight** (kinetics): the fastest foes. Temperature and concentration decide their
  speed, and the reveal of **the Catalyst** comes here.
- **Lodestone** (transition metals): coloured, magnetic foes. Read their colour and their
  pull to find out what they are.
- **Thornmere** (organic): overgrowth. The Charge Gardens' curved arrows return as the
  attack: draw the line from giver to taker.
- **Cinder Halo** (nuclear): the transmutation works and the last boss. Its phases
  include half-life countdowns and balancing what decays into what. The rumour is answered.

---

## 8. Implementation plan

Order matters. **Nothing gets converted in bulk before one quest has been played by real
students.** The product is pre-launch, and this is the cheapest moment to find out that
combat is a distraction rather than a draw.

### Phase 0: settle the doctrine (docs only)
- Decide D1–D8 (§9). **Done by the user**
- Write the story bible: `docs/story/bible.md` (premise, the Fifth, acts, ending, voice).
- Amend **PRODUCT.md** (Product Purpose, Two roads, a new principle for combat: *the
  monster carries evidence, the attack is the answer*) and **CLAUDE.md** (the spoil rules
  of §3, the encounter rules of §4, and a note that "Story is a frame, not a puzzle"
  still holds).

### Phase 1: the encounter layer, in 2D
- `src/learn/engine/encounter.js`: wraps the frame and the stage runner. It draws foe
  plates (an SVG portrait, nameplate, intent line and Integrity bar), maps each widget to
  its attack verb (§4 table), turns `check()` results into hit/miss/counter beats, and
  handles knock-back and reset. On T1 it is DOM only, and it works at 375 px.
- Stages gain an optional `encounter` declaration: `{ foes, moves, intent }`. **No
  `check()` changes.** A stage with no `encounter` plays exactly as today, so conversion
  can be gradual.
- `src/learn/engine/foes.js`: `planFoe()` (pure).
- Reduced motion: hits and counters become a held frame and a line of text.
- **`verify:learn` additions:** foes map one-to-one onto the stage's samples or rows; every
  move label and intent line passes that stage's vocabulary gate; a foe's behaviour comes
  only from `planFoe()`; the encounter never puts anything between a miss and its reason;
  a correct commit on turn one wins.

### Phase 2: the pilot (Tallow `q1-grain`, then Lanternfall `q2-photon`)
- Convert both by declaration (§4 worked examples). Re-voice prompts only where needed.
  The task stays plainly stated.
- **Playtest with five to ten students** (D8). Questions to answer: do they scout, or just
  guess-attack? Does Integrity make them more careful or more anxious? Can they still say
  the chemistry afterwards? **This is the go / no-go gate for everything after it.**

### Phase 3: bosses [BUILT]
- A boss module on the quest contract (`arena: 'boss'`). A phase runner (checkpointed
  phases on the encounter layer), and the charting and gating rule: it opens once every
  bench in the world is complete, and gates only story.
- Built **The Hopper** (Tallow `boss-hopper.js`), **Basalt Warden** (Ligar `boss-warden.js`),
  and **Recipe Golem** (Kettle `boss-golem.js`).
- `verify:learn`: every phase has a solution, a miss with a reason, hint rungs and a
  card. Boss copy uses only the world's earned vocabulary.

### Phase 4: the story spine [BUILT]
- `saga.js` with 4 acts, clue registry, spine beats, and episode data.
- Spine beats in road order (§2) and the queueing rule (`getNextPendingBeat`).
- The Case File: `src/screens/casefile.js` (`#/casefile`), comms terminal view, evidence dossier, Vess marginalia.
- `session.learn.saga` with union merge in `setLearnState`, `recordClue`, and `recordSagaBeat`.
- Star map tabs `Story` / `Contracts`.
- **`verify:story`** (joins `npm run verify`): verifies 4 acts, clues, spine order, transmissions <= 2 sentences, clue wiring.

### Phase 5: combat at T4
- `src/learn/engine/encounter3d.js`: foes as built bodies at the bench site, standing where
  the samples' wells are, so "four samples" really is four foes in front of the player.
  The instrument stays the player's rig, and its screens stay the flat picture (the
  honest-picture rule).
- Bodies are procedural from a small kit, the way `basalt.js` builds rock (a husk is a
  fractured salt lump, a moth a lofted shell). The Hunyuan3D notebook is there for hero
  bosses.
- `verify:bench` measures foes like any body: not overlapping the world, inside the glass at
  six aspects, clear of the HUD, and pressed through the real pointer path.
- Spoil wandering the walkable ground between benches is **out of scope here** (see D5).

**As built.** `foebody.js` builds a husk as one instanced aggregate of 34 chamfered halite
crystals (so one body can idle, split, scatter, settle into n layers, or crumble, and puffs
fines when it breaks) and a moth as a lofted shell (ribbed carapace, cambered veined wings,
six wire legs, no eyes) perched on the photocell's tube, with amber streaks that are the
planner's `dots` and `speed`. `encounter3d.js` (`FoeLayer3D`, built by every `BenchViewer3D`)
stands one body per bench item in the well of the station holding it, and only OBSERVES: the
2D `Encounter` hands it a snapshot (`{ enc, fight, poses }`) on every paint, so a body's pose
is `planFoe`'s pose and nothing else. A committed miss makes every body lunge (with a thump),
a clear disperses them (husks are swept off the plate, moths go dark and drift), a knock-back
makes them whole, and reduced motion snaps every pose. Foes turn slowly to face the player's
eye. A press on a body is a press on its station (`stationUnderRay`). `verify:bench` builds
every fighting stage of `q1-grain` and `q2-photon` on the real benches and holds the bodies to
the tray, the glass at six aspects, the world (no body stands in the bench's clutter), and the
**honest-picture rule**: a ray from the camera to a grid across every screen must clear every
foe in every pose. A species with no body yet is listed in `PLATE_ONLY` and fights on the
plate alone, as it does below T4.

### Phase 6: convert the rest of the built road
Tallow `q2`–`q6`, Lanternfall `q1`, `q3`–`q9`, Ligar `q1`–`q2`, Kettle `q1-recipe`. Each
gets encounter declarations, foe families and re-voiced prompts where needed, then the
Lanternfall boss. Do this one world at a time, with `npm run verify` green after each.

**3D cost of this phase.** Converting a quest is declarations, not modelling: its stages gain
`encounter` blocks and the existing layer stands the foes. The 3D work is only what a NEW
species needs: one `foes.js` entry (planner and lines) and one body builder in `foebody.js`
(plus a `PERCH` entry in `encounter3d.js` if it stands anywhere but the well's centre). A
quest that reuses the husk or the moth costs no 3D work at all.

### Phase 7: contracts (side quests) [BUILT]
- Reframed **Erebus** as a contract in `src/story/quest1.js`. Stage 20 debrief awards
  Act I clue (`clue_erebus_mark`) into the Case File.
- Contract Board screen (`src/screens/contracts.js` at `#/contracts`), bridge deck links,
  and posting metadata.
- Campaign XP rules unchanged: paid once per stage, flat, idempotent.

### Phase 8: new worlds are written encounter-first [BUILT]
- `src/learn/quests/_template.js` updated with default `encounter` block, foe intent,
  chemical core, hint ladders, refusal rules, and practice set.
- `docs/plans/learn-quests.md` updated with encounter-first architecture principle.

---

## 9. Decisions for you

| # | Question | Options | Decision |
|---|---|---|---|
| **D1** | The main story pays no XP, and the side contracts do. Is that OK? | (a) keep the Learn XP wall, and the story earns ranks, plates and cosmetics; (b) story stages pay a flat, once-only XP like the campaign | **(a), but it's close.** It's odd for a game's main road to pay nothing, but Standings is a guild competition, and a student whose class is further ahead would out-earn everyone on the study road. If (b), PRODUCT.md principle 5 and `verify:learn` have to change first. |
| **D2** | Combat stakes | (a) Integrity plus a knock-back that keeps everything learned; (b) no player health at all, the foe only advances its attack | **(a)**: it gives the feel of stakes with no real cost. Playtest it (Phase 2). |
| **D3** | Who the Fifth are, and how it ends | (a) abandoned crews (§1); (b) a plain villain guild; endings: expose the Guilds / bring the crews home / both | **(a), ending "both".** The moral grey is the strongest idea here. |
| **D3b** | Vess was one of them? | yes / no | Your call. It's strong, but it changes the narrator. |
| **D4** | Linear story, or open worlds | (a) worlds open, episodes self-contained, spine in road order (§2); (b) lock worlds in story order | **(a)**: it keeps "go to the unit your class is on". |
| **D5** | Roaming spoil on the walkable ground | (a) none for now; (b) optional wild fights between benches, drawn from the world's practice set | **(a) for now.** (b) would reverse "no instrument in the fiction asks multiple-choice questions", which is its own decision. |
| **D6** | Names | the Fifth / the Catalyst; *spoil*; *survey hand*; *Case File*; boss names | Provisional. Rename freely. |
| **D7** | Rename LEARN to STORY in the nav | yes / not yet | Not until Phase 4 ships. |
| **D8** | Pilot playtest | who, and when | Five to ten students at a club meeting, after Phase 2. |

---

## 10. Considered and rejected
- **Real-time action combat** (dodge, aim, cooldowns). It tests reflexes, fails at 375 px
  and on T1, and would block players who know the answer but are slow on a touch screen.
- **Gear that makes fights easier.** It would break "nothing a player unlocks may make a
  stage easier" (the engagement pass). Gear is cosmetic, and a player's strength is what
  they know.
- **Rewriting the stages as new combat content.** The stage tables are verified, the
  vocabulary schedules are exact, and the evidence is on the bench. Combat goes on top of
  them.
- **Story modals before every stage.** This is exactly what was removed from Tallow. A
  foe nameplate and an intent line are the whole per-stage story budget.
- **Killing monsters.** They are dispersed.
