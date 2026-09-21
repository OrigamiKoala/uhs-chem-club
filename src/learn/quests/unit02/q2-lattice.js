/**
 * q2-lattice.js — Ligar, bench two: STONE AND WIRE.
 *
 * The same bench as `q1-joins`, loaded with whole blocks instead of pairs. Bench
 * one settled what a bond IS; this one asks what a block of each kind actually
 * DOES — because that is the only reason a bond type matters to anybody holding
 * a piece of salvage.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  heat three blocks until each comes apart  -> the melting point measures the hold
 *   2  strike the salt block and read the face   -> a lattice, and why it shatters
 *   3  current, cold and molten, on two blocks   -> what it takes to conduct
 *   4  strike and melt the vent block            -> molecules, and the weak pull between them
 *   5  the block the blade will not cut          -> a network of covalent bonds
 *   6  which block holds a molecule you can lift -> not everything is made of molecules
 *   7  three sealed blocks, tests only           -> the tests name the build
 *   8  pick a liner for a 900 degree vessel      -> why the arches are still standing
 *   -- debrief: what a bond type decides about a material, and what is next.
 *
 * WHAT THIS BENCH DOES NOT DO. It never weighs a block and never counts what is
 * in one. Recipes are bench three and counting by weight is bench four.
 *
 * `q1-joins` earned bond, ionic and covalent, so those are plain words here.
 * What this quest has to earn is on `VOCABULARY`.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { JoinBench } from '../../engine/joinbench.js';
import { LearnFrame, toolNotes } from '../../engine/frame.js';
import { esc } from '../../../ui/layout.js';
import { soundscape } from '../../../audio/soundscape.js';

export const meta = { stageCount: 8 };

/**
 * When each withheld word is earned. Specific terms first: the schedule is
 * searched in order and the first match decides when a word becomes sayable.
 */
export const VOCABULARY = [
  { term: /\bmelting points?\b/i, introducedAt: 1 },
  { term: /\blattices?\b/i, introducedAt: 2 },
  { term: /\bbrittle\b/i, introducedAt: 2 },
  { term: /\bconduct\w*\b/i, introducedAt: 3 }
];

const SPEAKER = 'Vess';

/* ------------------------------------------------------------------
   THE KEY LEGEND
   Nothing on this bench is named without being explained.
   ------------------------------------------------------------------ */
const TOOL_TEXT = {
  strike: [{
    from: 1,
    key: 'Strike It',
    what: 'Hits the selected block once with the hammer and reports how it broke.'
  }],
  heat: [{
    from: 1,
    key: 'Heat It',
    what: 'Raises the heat until the selected block comes apart, and reports the temperature that took.'
  }],
  current: [{
    from: 3,
    key: 'Test Current',
    what: 'Puts a current through the selected block as it is right now and reports whether anything flows.'
  }],
  cool: [{
    from: 1,
    key: 'Let It Cool',
    what: 'Lets the selected block set solid again after it has been melted.'
  }]
};

export function toolNoteFor(controlId, stageNumber) {
  const rows = TOOL_TEXT[controlId];
  if (!rows) return null;
  let out = null;
  for (const r of rows) if (stageNumber >= r.from) out = r;
  return out ? { key: out.key, what: out.what } : null;
}

/**
 * A block plate.
 *
 * `build` is how its pieces are arranged and it decides the whole picture;
 * `melt` is the one thing the bench is simply told, because a temperature is a
 * measurement and the instrument reports exactly the figure it was given.
 */
const slab = (id, label, note, build, melt, tint, extra = {}) =>
  ({ id, label, note, build, melt, tint, ...extra });

const SALT = (id, label) => slab(id, label, 'cut from the salt pan', 'grid', 801, 'bone');
const VENT = (id, label) => slab(id, label, 'scraped off the vent crust', 'clusters', 115, 'sand', { cluster: 3, groups: 8 });
const ARCH = (id, label) => slab(id, label, 'cut from a fallen arch', 'web', 1710, 'iron');

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Heat All Three',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench takes a whole block of finished material and does three things to it: hits it, heats it until it comes apart, and puts a current through it. Tap a block to select it, then press one of the keys.'
    },
    prompt: 'Heat each of the three blocks until it comes apart, then pick the one whose pieces are being held together hardest.',
    controls: ['strike', 'heat', 'cool'],
    slabs: [SALT('s1', 'BLOCK A'), VENT('s2', 'BLOCK B'), ARCH('s3', 'BLOCK C')],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: 's1', label: 'Block A', note: 'The block cut from the salt pan.' },
        { id: 's2', label: 'Block B', note: 'The block scraped off the vent crust.' },
        { id: 's3', label: 'Block C', note: 'The block cut from a fallen arch.' }
      ]
    },
    hints: [
      'Tap a block to select it, press "Heat It", and do the same for the other two.',
      'Each block reports the temperature it came apart at. The harder its pieces are held, the more heat it takes to pull them apart.',
      'Block B went at 115 degrees, Block A at 801 and Block C at 1710, so Block C is held hardest.'
    ],
    check(state) {
      if (state.heated.size < 3) {
        return { ok: false, notYet: true, msg: 'Heat all three blocks before you answer.' };
      }
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the three blocks.' };
      }
      if (state.choice === 's2') {
        return { ok: false, msg: 'Block B came apart at 115 degrees, the lowest of the three, so it is the one held least.' };
      }
      if (state.choice === 's1') {
        return { ok: false, msg: 'Block A came apart at 801 degrees, and one of the others held out past that.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Block A 801 C. Block B 115 C. Block C 1710 C.',
      title: 'The Melting Point Measures the Hold',
      body: 'The temperature a solid comes apart at is its melting point, and it is a direct measure of how hard the whole block is being held together. These three went at 115, 801 and 1710 degrees, so whatever is doing the holding is not the same thing in each of them. The rest of this bench is finding out what the difference is.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Hit the Salt',
    prompt: 'Strike both blocks, look at what each blow left behind, and say why Block A came apart along one flat face.',
    controls: ['strike', 'heat', 'cool'],
    slabs: [SALT('s1', 'BLOCK A'), VENT('s2', 'BLOCK B')],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: 'grid', label: 'Its pieces sit in a repeating pattern of alternating charges, so a blow slides one whole layer and puts like against like', note: 'The pattern decides where it breaks.' },
        { id: 'crack', label: 'The block was already cracked along that face', note: 'A flaw was there before the blow.' },
        { id: 'soft', label: 'The material is soft, so the hammer cut straight through it', note: 'Softness decides it.' },
        { id: 'weak', label: 'Its joins are the weakest on the bench', note: 'It is the easiest of the two to break.' }
      ]
    },
    hints: [
      'Tap a block, press "Strike It", and do the same for the other one.',
      'Look at what the picture shows in Block A before the blow: every piece marked plus has pieces marked minus all round it, in a pattern that repeats.',
      'Slide one layer of that pattern sideways by a single step and every plus lands beside a plus. They push each other apart, and the block splits straight along that plane.'
    ],
    check(state) {
      if (state.struck.size < 2) {
        return { ok: false, notYet: true, msg: 'Strike both blocks before you answer.' };
      }
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the four answers.' };
      }
      if (state.choice === 'crack') {
        return { ok: false, msg: 'Nothing in the picture showed a flaw before the blow, and the face it left runs straight along the pattern.' };
      }
      if (state.choice === 'soft') {
        return { ok: false, msg: 'Block A needed 801 degrees to come apart and Block B only 115, so Block A is not the soft one.' };
      }
      if (state.choice === 'weak') {
        return { ok: false, msg: 'Block B gave way at 115 degrees and crumbled rather than splitting, so Block A holds the stronger joins of the two.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Block A cleaved along one flat face. Block B crumbled.',
      title: 'A Lattice, and Why It Shatters',
      body: 'An ionic solid is not a heap: its ions sit in a repeating three-dimensional grid called a lattice, with every plus surrounded by minuses and every minus by pluses. Knock one layer sideways by a single step and every pair that was pulling is suddenly pushing, so the whole block splits clean along that plane. That is why ionic solids are hard and yet brittle.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Put a Current Through It',
    prompt: 'Test the current through both blocks cold, heat them both, test both again, then say what a current needs in order to pass.',
    controls: ['heat', 'current', 'cool'],
    slabs: [SALT('s1', 'BLOCK A'), VENT('s2', 'BLOCK B')],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: 'free', label: 'Charged pieces, and room for them to move', note: 'Both have to be true at once.' },
        { id: 'hot', label: 'The block has to be hot', note: 'Heat on its own does it.' },
        { id: 'metal', label: 'The block has to be a metal', note: 'Nothing else passes a current.' },
        { id: 'solid', label: 'The block has to be solid, so its pieces touch', note: 'A liquid breaks the path.' }
      ]
    },
    hints: [
      'Test each block cold first, then press "Heat It" on it and test the same block again.',
      'Block A passes nothing cold and passes a current once it is molten. Block B is molten too, and just as hot, and passes nothing at all.',
      'Block A holds charged pieces, locked in place while it is solid and loose once it is melted. Block B has no charged pieces to move, hot or cold.'
    ],
    check(state) {
      if (!state.tested.has('s1:solid') || !state.tested.has('s1:molten')) {
        return { ok: false, notYet: true, msg: 'Test Block A both cold and melted before you answer.' };
      }
      if (!state.tested.has('s2:molten')) {
        return { ok: false, notYet: true, msg: 'Melt Block B and test that one too.' };
      }
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the four answers.' };
      }
      if (state.choice === 'hot') {
        return { ok: false, msg: 'Block B was molten at 115 degrees and passed nothing, so heat on its own is not enough.' };
      }
      if (state.choice === 'metal') {
        return { ok: false, msg: 'Neither block is a metal, and one of them passed a current, so that is not the rule.' };
      }
      if (state.choice === 'solid') {
        return { ok: false, msg: 'Block A passed nothing while it was solid and passed a current once it was melted, which is the wrong way round for that.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Block A cold: nothing. Block A molten: current. Block B molten: nothing.',
      title: 'What It Takes to Conduct',
      body: 'A current is charge on the move, so a material only conducts if it holds charged pieces and those pieces can travel. In the lattice the ions are pinned in the grid and nothing flows; melt it and the very same ions are free, so it conducts. Block B was molten too and passed nothing, because what it is built of carries no charge at all.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'What Survives the Blow',
    prompt: 'Strike Block B and then melt it, watch the picture each time, and say what actually gives way when it comes apart.',
    controls: ['strike', 'heat', 'cool'],
    slabs: [VENT('s2', 'BLOCK A'), SALT('s1', 'BLOCK B')],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: 'between', label: 'The pull between whole groups gives way, and the groups themselves stay in one piece', note: 'Nothing inside a group breaks.' },
        { id: 'inside', label: 'The joins inside each group break first', note: 'The groups come apart into single atoms.' },
        { id: 'all', label: 'Everything gives way at once', note: 'Nothing survives it.' },
        { id: 'layer', label: 'One flat layer slides off the rest', note: 'It splits the way Block B does.' }
      ]
    },
    hints: [
      'Tap Block A, press "Strike It", then press "Heat It" on the same block and look at the picture after each.',
      'Count the pieces in one of the small groups before the blow and count them again afterwards.',
      'The groups drift apart from each other but every one of them is still whole, with its own joins still drawn. Only the pull between groups gave way.'
    ],
    check(state) {
      if (!state.struck.has('s2')) {
        return { ok: false, notYet: true, msg: 'Strike Block A before you answer.' };
      }
      if (!state.heated.has('s2')) {
        return { ok: false, notYet: true, msg: 'Melt Block A as well, and watch what happens to the groups.' };
      }
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the four answers.' };
      }
      if (state.choice === 'inside') {
        return { ok: false, msg: 'Every group in Block A still has the same pieces in it after the blow and after the melt, so nothing inside one broke.' };
      }
      if (state.choice === 'all') {
        return { ok: false, msg: 'The groups are still drawn whole after both tests, so not everything gave way.' };
      }
      if (state.choice === 'layer') {
        return { ok: false, msg: 'Block B splits along a flat face. Block A has no pattern to split along and simply comes apart into its groups.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Block A: the groups came apart from each other, never from themselves.',
      title: 'Molecules, and the Weak Pull Between Them',
      body: 'This block is built of separate molecules, and the covalent bonds inside each one are strong, but what holds one molecule to the next is a far weaker pull. Melting it only has to beat that weaker pull, which is why 115 degrees was enough where the lattice needed 801. The molecules themselves come through both tests unchanged.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'The Block the Blade Will Not Cut',
    prompt: 'Strike Block A, heat it and put a current through it, then say what is different about the way it is built.',
    controls: ['strike', 'heat', 'current', 'cool'],
    slabs: [ARCH('s3', 'BLOCK A'), VENT('s2', 'BLOCK B')],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: 'through', label: 'Every piece is joined on to the next all the way through, so there is no plane you can break without cutting joins', note: 'The whole block is one connected piece.' },
        { id: 'groups', label: 'It is separate groups, packed much more tightly than Block B', note: 'Tighter packing, same build.' },
        { id: 'charged', label: 'It is held by charges, the way the salt block is', note: 'The pull between charges is doing it.' },
        { id: 'layers', label: 'It is stacked in flat layers that grip each other', note: 'Friction between layers holds it.' }
      ]
    },
    hints: [
      'Tap Block A and press all three keys on it, one after the other.',
      'The hammer does nothing to Block A, it needs 1710 degrees, and it passes no current even when it is molten. Then look at how its pieces are drawn.',
      'Every piece in Block A has lines running from it to its neighbours, right across the picture, with no gaps and no separate groups anywhere.'
    ],
    check(state) {
      if (!state.struck.has('s3') || !state.heated.has('s3') || !state.tested.has('s3:molten')) {
        return { ok: false, notYet: true, msg: 'Strike, heat and test Block A before you answer.' };
      }
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the four answers.' };
      }
      if (state.choice === 'groups') {
        return { ok: false, msg: 'Block B is separate groups and it crumbled into them. Block A did not come apart at all, and the picture shows no gaps anywhere in it.' };
      }
      if (state.choice === 'charged') {
        return { ok: false, msg: 'Block A passed no current even molten, and nothing in it is marked plus or minus, so there are no charges in there.' };
      }
      if (state.choice === 'layers') {
        return { ok: false, msg: 'Layers that only grip each other would slide apart under the hammer. The hammer did nothing to Block A.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Block A: the blade stopped, 1710 degrees, no current.',
      title: 'A Network of Covalent Bonds',
      body: 'Some covalent solids are not built of separate molecules at all: every atom is bonded on to its neighbours in one continuous network, so the whole block is effectively a single molecule. Breaking it or melting it means breaking covalent bonds themselves, which is why the hammer failed and it took 1710 degrees. Nothing in it carries a charge, so nothing conducts through it either.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Lift One Out',
    prompt: 'Strike all three blocks, then pick the one you could lift a single whole molecule out of.',
    controls: ['strike', 'heat', 'cool'],
    slabs: [SALT('s1', 'BLOCK A'), VENT('s2', 'BLOCK B'), ARCH('s3', 'BLOCK C')],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: 's1', label: 'Block A', note: 'The block cut from the salt pan.' },
        { id: 's2', label: 'Block B', note: 'The block scraped off the vent crust.' },
        { id: 's3', label: 'Block C', note: 'The block cut from a fallen arch.' }
      ]
    },
    hints: [
      'Strike each block, then look at what the picture leaves you holding.',
      'A molecule is a group of atoms joined to each other and to nothing else. Look for a picture with gaps in it.',
      'Block B is the only one drawn as separate groups with space between them. Block A repeats without a break and Block C is joined right across.'
    ],
    check(state) {
      if (state.struck.size < 3) {
        return { ok: false, notYet: true, msg: 'Strike all three blocks before you answer.' };
      }
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the three blocks.' };
      }
      if (state.choice === 's1') {
        return { ok: false, msg: 'Block A is one repeating grid with nothing separate anywhere in it, so there is no single group to lift out.' };
      }
      if (state.choice === 's3') {
        return { ok: false, msg: 'Block C is joined all the way through, so lifting anything out of it means cutting joins.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Only Block B holds separate molecules.',
      title: 'Not Everything Is Made of Molecules',
      body: 'Only a molecular solid is built from separate molecules you could actually pick one of. An ionic solid has none, because the grid simply repeats — so the formula written for it is just the smallest whole-number ratio of its ions, which is called a formula unit. A covalent network has none either, because the whole block is connected.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Three Sealed Blocks',
    prompt: 'Run the tests on all three sealed blocks and file each one by how it is built.',
    controls: ['strike', 'heat', 'current', 'cool'],
    slabs: [
      slab('x1', 'BLOCK A', 'sealed at the mine, cased shut', 'grid', 1074, 'bone', { sealed: true }),
      slab('x2', 'BLOCK B', 'sealed at the mine, cased shut', 'clusters', 80, 'sand', { sealed: true, cluster: 3, groups: 8 }),
      slab('x3', 'BLOCK C', 'sealed at the mine, cased shut', 'web', 3550, 'iron', { sealed: true })
    ],
    widget: {
      type: 'bins',
      rows: ['x1', 'x2', 'x3'],
      bins: [
        { id: 'ionic', label: 'Ionic lattice', note: 'Ions in a repeating grid.' },
        { id: 'molecular', label: 'Separate molecules', note: 'Small groups, weak pull between them.' },
        { id: 'network', label: 'Covalent network', note: 'Joined all the way through.' }
      ]
    },
    hints: [
      'Nothing resolves inside a cased block, so heat each one, test each one molten, and hit each one.',
      'A block that comes apart low and crumbles is one build; a block that comes apart high, splits flat and conducts once molten is another; a block that will not break at all is the third.',
      'Block A went at 1074, cleaved flat and conducted molten. Block B went at 80 and crumbled. Block C went at 3550, would not break and never conducted.'
    ],
    check(state) {
      for (const id of ['x1', 'x2', 'x3']) {
        if (!state.heated.has(id)) {
          return { ok: false, notYet: true, msg: 'Heat all three blocks before you answer.' };
        }
      }
      for (const id of ['x1', 'x2', 'x3']) {
        if (!state.tested.has(`${id}:molten`)) {
          return { ok: false, notYet: true, msg: 'Test the current through all three blocks once they are molten.' };
        }
      }
      const labels = { x1: 'Block A', x2: 'Block B', x3: 'Block C' };
      for (const id of ['x1', 'x2', 'x3']) {
        if (!state.bins[id]) return { ok: false, notYet: true, msg: `${labels[id]} has no answer yet.` };
      }
      const reasons = {
        x1: 'Block A conducted once it was molten, and only ions loose in a melt do that.',
        x2: 'Block B came apart at 80 degrees and crumbled into whole groups, which is far too easy for anything held by bonds all the way through.',
        x3: 'Block C would not break, needed 3550 degrees and never conducted, so it holds no ions and no separate groups.'
      };
      const want = { x1: 'ionic', x2: 'molecular', x3: 'network' };
      for (const id of ['x1', 'x2', 'x3']) {
        if (state.bins[id] !== want[id]) return { ok: false, msg: reasons[id] };
      }
      return { ok: true };
    },
    reward: {
      log: 'One lattice, one molecular, one network.',
      title: 'The Tests Name the Build',
      body: 'A block that melts low and crumbles into whole groups is molecular; one that melts high, cleaves flat and conducts once molten is an ionic lattice; one that melts higher still, will not cleave and never conducts is a covalent network. You never opened any of the three. How a material behaves is a direct report of how its atoms are joined.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Pick the Liner',
    prompt: 'The yard needs a liner for a vessel that runs at 900 degrees and must never pass a current. Run the tests and pick the block that will do it.',
    controls: ['strike', 'heat', 'current', 'cool'],
    slabs: [SALT('s1', 'BLOCK A'), VENT('s2', 'BLOCK B'), ARCH('s3', 'BLOCK C')],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: 's1', label: 'Block A', note: 'The block cut from the salt pan.' },
        { id: 's2', label: 'Block B', note: 'The block scraped off the vent crust.' },
        { id: 's3', label: 'Block C', note: 'The block cut from a fallen arch.' }
      ]
    },
    hints: [
      'Heat all three and write down the three temperatures, then test each one after it has melted.',
      'Anything that comes apart below 900 degrees is out before you even reach the current test.',
      'Block B goes at 115 and Block A at 801, both under 900. Block C holds to 1710 and passes nothing even molten.'
    ],
    check(state) {
      if (state.heated.size < 3) {
        return { ok: false, notYet: true, msg: 'Heat all three blocks before you answer.' };
      }
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the three blocks.' };
      }
      if (state.choice === 's1') {
        return { ok: false, msg: 'Block A comes apart at 801 degrees, below the 900 the vessel runs at, and once it is molten it passes a current as well.' };
      }
      if (state.choice === 's2') {
        return { ok: false, msg: 'Block B comes apart at 115 degrees. The vessel runs at eight times that.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Block C: 1710 degrees, no current, holds.',
      title: 'Why the Arches Are Still Standing',
      body: 'The only block that clears 900 degrees and still passes nothing is the covalent network, because coming apart at all means breaking its bonds one by one. The arches outside are built the same way, which is why a thousand years of weather has not brought one of them down. What a material is good for is decided by what kind of bond is holding it.',
      last: true
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'What You Found',
      body: 'Three blocks, three builds. Ions in a repeating grid are hard, brittle and pass a current only once they are melted; separate molecules melt easily and never conduct; a network joined all the way through barely melts at all.'
    },
    {
      heading: 'Why It Works',
      body: 'Nothing you measured was a property of an atom. Every one of them was a property of the joins between atoms, which is why knowing the bond type tells you what a material will do before you have tested anything.'
    },
    {
      heading: 'Next',
      body: 'Every block on this bench had one recipe and stuck to it. The next bench asks how fixed that really is, and whether the same compound from two different places comes out the same.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Solid sodium chloride does not conduct electricity, but molten sodium chloride does. Why?',
    options: [
      { id: 'a', label: 'Melting turns the ions into metal atoms' },
      { id: 'b', label: 'Its ions are locked in the lattice when solid and free to move when molten' },
      { id: 'c', label: 'Heat itself carries the current' },
      { id: 'd', label: 'Melting adds electrons to the sample' }
    ],
    answer: 'b',
    explanation: 'A current is charge on the move. Sodium chloride has charges either way, but in the solid lattice they are pinned in place; melting frees them, so the charge can travel.'
  },
  {
    question: 'Sugar melts at about 186 degrees and salt at 801. What does that difference tell you?',
    options: [
      { id: 'a', label: 'Sugar molecules are held to each other by a much weaker pull than the one between ions' },
      { id: 'b', label: 'The bonds inside a sugar molecule are weaker than the bonds inside salt' },
      { id: 'c', label: 'Sugar is a smaller molecule than salt' },
      { id: 'd', label: 'Salt has more electrons' }
    ],
    answer: 'a',
    explanation: 'Melting sugar only separates whole molecules from each other, and the pull between molecules is weak. Melting salt has to pull apart an ionic lattice, where every ion is gripped by the ions all round it.'
  },
  {
    question: 'Why is an ionic solid hard but brittle — strong to press on, yet it shatters when struck?',
    options: [
      { id: 'a', label: 'Its bonds are weak in one direction only' },
      { id: 'b', label: 'Striking it slides one layer by a step, so like charges meet and repel' },
      { id: 'c', label: 'It is full of trapped air' },
      { id: 'd', label: 'The hammer adds charge to it' }
    ],
    answer: 'b',
    explanation: 'In the lattice every ion is surrounded by ions of opposite charge, which is a strong grip. Shift one plane by one ion and all those attractions become repulsions at once, and the crystal splits along that plane.'
  },
  {
    question: 'Diamond melts above 3500 degrees; iodine melts at 114. Both are made only of nonmetals. Why the enormous difference?',
    options: [
      { id: 'a', label: 'Diamond is ionic and iodine is covalent' },
      { id: 'b', label: 'Iodine atoms are heavier, so they need less heat' },
      { id: 'c', label: 'Diamond is one covalent network, so melting it breaks covalent bonds; iodine is separate molecules held by a weak pull' },
      { id: 'd', label: 'Diamond conducts heat away faster' }
    ],
    answer: 'c',
    explanation: 'Both are covalent, but they are built differently. Every carbon in diamond is bonded on to its neighbours right through the crystal, so melting it means breaking those bonds; melting iodine only separates I2 molecules that were barely holding on to each other.'
  },
  {
    question: 'An unknown solid melts at 60 degrees, does not conduct as a solid, and still does not conduct once it is molten. How is it built?',
    options: [
      { id: 'a', label: 'An ionic lattice' },
      { id: 'b', label: 'A covalent network' },
      { id: 'c', label: 'Separate molecules' },
      { id: 'd', label: 'A metal' }
    ],
    answer: 'c',
    explanation: 'A low melting point rules out both a lattice and a network, which need hundreds or thousands of degrees. Failing to conduct even when molten rules out ions, so what melted was the weak pull between separate molecules.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState() {
  return {
    choice: null,
    bins: {},
    plate: null,
    struck: new Set(),
    heated: new Set(),
    /** `${id}:solid` / `${id}:molten` — a current test is only as good as the state it was run in. */
    tested: new Set()
  };
}

/** The bench state that solves each stage, in order. Checked by verify:learn. */
export const SOLUTIONS = [
  { heated: new Set(['s1', 's2', 's3']), choice: 's3' },
  { struck: new Set(['s1', 's2']), choice: 'grid' },
  {
    heated: new Set(['s1', 's2']),
    tested: new Set(['s1:solid', 's1:molten', 's2:solid', 's2:molten']),
    choice: 'free'
  },
  { struck: new Set(['s2']), heated: new Set(['s2']), choice: 'between' },
  {
    struck: new Set(['s3']),
    heated: new Set(['s3']),
    tested: new Set(['s3:solid', 's3:molten']),
    choice: 'through'
  },
  { struck: new Set(['s1', 's2', 's3']), choice: 's2' },
  {
    struck: new Set(['x1', 'x2', 'x3']),
    heated: new Set(['x1', 'x2', 'x3']),
    tested: new Set(['x1:molten', 'x2:molten', 'x3:molten']),
    bins: { x1: 'ionic', x2: 'molecular', x3: 'network' }
  },
  { heated: new Set(['s1', 's2', 's3']), choice: 's3' }
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  { heated: new Set(['s1', 's2', 's3']), choice: 's1' },
  { struck: new Set(['s1', 's2']), choice: 'soft' },
  {
    heated: new Set(['s1', 's2']),
    tested: new Set(['s1:solid', 's1:molten', 's2:molten']),
    choice: 'hot'
  },
  { struck: new Set(['s2']), heated: new Set(['s2']), choice: 'inside' },
  {
    struck: new Set(['s3']),
    heated: new Set(['s3']),
    tested: new Set(['s3:molten']),
    choice: 'charged'
  },
  { struck: new Set(['s1', 's2', 's3']), choice: 's1' },
  {
    heated: new Set(['x1', 'x2', 'x3']),
    tested: new Set(['x1:molten', 'x2:molten', 'x3:molten']),
    bins: { x1: 'network', x2: 'molecular', x3: 'ionic' }
  },
  { heated: new Set(['s1', 's2', 's3']), choice: 's1' }
];

/** Build a full bench state for stage `i` from one of the sets above. */
export function stateFor(i, overrides) {
  return { ...blankState(), ...overrides };
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  const frame = new LearnFrame(container, {
    stageCount: STAGES.length,
    onSubmit: () => submit(),
    onNext: () => next(),
    onJump: i => loadStage(i),
    onExit: () => ctx.exit()
  });

  const bench = new JoinBench(frame.instrumentHost, {
    onProbe: hit => onProbe(hit),
    onSelect: id => onSelect(id)
  });

  let index = ctx.isComplete ? 0 : Math.min(ctx.stagesCleared, STAGES.length - 1);
  let cleared = ctx.isComplete ? STAGES.length : ctx.stagesCleared;
  let state = null;
  let busy = false;
  let disposed = false;

  /* ---------------- stage lifecycle ---------------- */

  function loadStage(i) {
    index = i;
    const stage = STAGES[i];
    state = blankState();

    frame.setCleared(cleared);
    frame.setStage({
      index: i,
      title: stage.title,
      prompt: stage.prompt,
      briefing: stage.briefing,
      hints: stage.hints,
      commitLabel: 'Commit'
    });

    bench.setPlates(stage.slabs);
    bench.setSelectable(stage.slabs.length > 1);
    if (stage.slabs.length === 1) onSelect(stage.slabs[0].id);

    renderControls();
    renderWidget();
    renderReadout(null);

    if (stage.briefing && !ctx.isComplete && cleared <= i) frame.showBriefing();
  }

  function next() {
    if (index >= STAGES.length - 1) {
      frame.showDebrief(DEBRIEF, () => ctx.exit());
      return;
    }
    loadStage(index + 1);
  }

  function submit() {
    if (busy) return;
    const stage = STAGES[index];
    const result = stage.check(state);
    if (!result.ok) {
      if (result.notYet) frame.note(result.msg);
      else frame.miss(result.msg);
      return;
    }
    frame.clearBanner();
    if (index + 1 > cleared) {
      cleared = index + 1;
      ctx.reportStage(index);
    }
    frame.setCleared(cleared);
    frame.clear(stage.reward);
    if (index === STAGES.length - 1) ctx.reportComplete();
  }

  /* ---------------- bench controls ---------------- */

  function renderControls() {
    const stage = STAGES[index];
    const parts = [];

    if (stage.controls.includes('strike')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="strike">Strike It</button>');
    }
    if (stage.controls.includes('heat')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="heat">Heat It</button>');
    }
    if (stage.controls.includes('current')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="current">Test Current</button>');
    }
    if (stage.controls.includes('cool')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="cool">Let It Cool</button>');
    }

    parts.push(toolNotes(
      stage.controls.map(id => toolNoteFor(id, index + 1)).filter(Boolean)
    ));

    frame.setControls(parts.join(''));
    frame.el.controls.querySelectorAll('[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => runTool(btn.dataset.tool));
    });
  }

  function plateFor(id) {
    return STAGES[index].slabs.find(s => s.id === id) || null;
  }

  async function runTool(tool) {
    if (busy) return;
    if (!state.plate) {
      frame.note('No block selected. Tap one of the blocks first.');
      return;
    }
    const id = state.plate;
    const item = plateFor(id);
    busy = true;
    frame.clearBanner();
    frame.setCommitEnabled(false);

    if (tool === 'strike') {
      const out = await bench.strike(id);
      state.struck.add(id);
      soundscape.playBondSnap?.();
      renderReadout(null, { head: `Hammer // ${item.label}`, body: strikeLine(out, item) });
    } else if (tool === 'heat') {
      const already = bench.molten(id);
      const out = await bench.heat(id);
      state.heated.add(id);
      soundscape.playPylonWake?.();
      renderReadout(null, {
        head: `Furnace // ${item.label}`,
        body: already
          ? `${item.label} is already molten. It came apart at ${out.temp} degrees.`
          : `The block holds, then gives way at ${out.temp} degrees and runs molten.`
      });
    } else if (tool === 'cool') {
      const out = await bench.cool(id);
      soundscape.playToggleClack?.();
      renderReadout(null, {
        head: `Furnace // ${item.label}`,
        body: out.already
          ? `${item.label} is already solid, so there is nothing to cool.`
          : 'The furnace goes off and the block sets solid again, exactly as it came in.'
      });
    } else if (tool === 'current') {
      const out = await bench.test(id);
      state.tested.add(`${id}:${out.molten ? 'molten' : 'solid'}`);
      soundscape.playScanSweep?.();
      renderReadout(null, {
        head: `Probes // ${item.label}`,
        body: `${out.molten ? 'Molten' : 'Solid'}. ${out.flows
          ? 'The lamp lights: a current is passing through it.'
          : 'The lamp stays dark: nothing is passing through it.'}`
      });
    }

    busy = false;
    frame.setCommitEnabled(true);
  }

  /** What the hammer found, read off the plan and nothing else. */
  function strikeLine(out, item) {
    if (out.result === 'molten') {
      return `${item.label} is already molten, so there is nothing solid left to hit.`;
    }
    if (out.result === 'cleaved') {
      return 'The block splits in one go, along a single flat face, and the two halves come away clean.';
    }
    if (out.result === 'crumbled') {
      return 'The block gives way at once and crumbles into small groups, none of which the blow broke open.';
    }
    return 'The hammer rings off it and stops. Nothing moves, and nothing comes away.';
  }

  /* ---------------- readout ---------------- */

  function onProbe(hit) {
    state.plate = hit.plateId;
    bench.setSelected(hit.plateId);
    soundscape.playToggleClack?.();
    const item = plateFor(hit.plateId);
    renderReadout(null, { head: `Bench // ${item.label}`, body: standingLine(item) });
  }

  function onSelect(id) {
    state.plate = id;
    bench.setSelected(id);
  }

  /** Where this block stands right now: only what has actually been measured. */
  function standingLine(item) {
    const parts = [];
    parts.push(bench.molten(item.id)
      ? `Molten. It came apart at ${item.melt} degrees.`
      : 'Solid, and nothing has melted it yet.');
    if (bench.struck(item.id)) parts.push('It has been struck once.');
    if (item.sealed) parts.push('The case is welded shut, so nothing resolves inside it.');
    return parts.join(' ');
  }

  function renderReadout(hit, message) {
    if (message) {
      frame.setReadout(`
        <div class="lq-readout-card">
          <div class="lq-readout-head">${esc(message.head)}</div>
          <p class="lq-readout-line">${esc(message.body)}</p>
        </div>
      `);
      return;
    }
    frame.setReadout(`
      <div class="lq-readout-card lq-readout-idle">
        <div class="lq-readout-head">Bench // standby</div>
        <p class="lq-readout-line">Each plate holds one block. Tap a block to select it, then use the keys on it.</p>
      </div>
    `);
  }

  /* ---------------- answer widgets ---------------- */

  function renderWidget() {
    const stage = STAGES[index];
    const w = stage.widget;

    if (w.type === 'choice') {
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">${esc(w.label)}</span>
          <div class="lq-bin-keys">
            ${w.options.map(o => `
              <button type="button" class="choice-option lq-bin-key" data-choice="${o.id}">
                <span class="lq-bin-label">${esc(o.label)}</span>
                <span class="lq-bin-note">${esc(o.note)}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `);
      frame.el.widget.querySelectorAll('[data-choice]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.choice = btn.dataset.choice;
          frame.el.widget.querySelectorAll('[data-choice]')
            .forEach(o => o.classList.toggle('selected', o === btn));
          soundscape.playToggleClack?.();
        });
      });
      return;
    }

    if (w.type === 'bins') {
      const rows = w.rows || stage.slabs.map(s => s.id);
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">Your answer</span>
          <div class="lq-bins">
            ${rows.map(id => `
              <div class="lq-bin-row" data-plate="${id}">
                <span class="lq-bin-sample">${esc(plateFor(id)?.label || id)}</span>
                <div class="lq-bin-keys">
                  ${w.bins.map(b => `
                    <button type="button" class="choice-option lq-bin-key" data-bin="${b.id}">
                      <span class="lq-bin-label">${esc(b.label)}</span>
                      <span class="lq-bin-note">${esc(b.note)}</span>
                    </button>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `);
      frame.el.widget.querySelectorAll('[data-bin]').forEach(btn => {
        btn.addEventListener('click', () => {
          const row = btn.closest('[data-plate]');
          const pid = row.dataset.plate;
          state.bins[pid] = btn.dataset.bin;
          row.querySelectorAll('[data-bin]').forEach(o => o.classList.toggle('selected', o === btn));
          const bin = w.bins.find(b => b.id === btn.dataset.bin);
          bench.setPlateTag(pid, bin ? bin.label : '');
          soundscape.playToggleClack?.();
        });
      });
    }
  }

  /* ---------------- go ---------------- */

  loadStage(index);

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      bench.dispose();
      frame.dispose();
    }
  };
}
