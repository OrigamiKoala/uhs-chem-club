/**
 * foes.js — The foe model: what a bench stage looks like as a fight.
 *
 * PURE. No DOM, no canvas, no three.js, so `verify:learn` can import it in
 * plain Node and press every foe it plans.
 *
 * WHY THIS FILE EXISTS (docs/plans/storyline-and-combat.md, section 4)
 *   Every Learn stage already has the shape of a fight: something on the bench
 *   you do not understand, tools that reveal how it behaves, one committed
 *   answer, a reason when you are wrong. A stage declares an `encounter` and
 *   this file resolves it. NOTHING HERE GRADES. `check()` stays the quest's and
 *   never sees any of this.
 *
 * THE TEST A FOE HAS TO PASS
 *   If you can delete the monster and the stage is unchanged, the combat is
 *   decoration. So a foe carries EVIDENCE: what it does when the player works
 *   the bench (`planFoe`) is derived from the SAME planner the instrument uses
 *   (`planCut`, `planSettle`, `planPhotocell`), never authored. A husk that
 *   falls into layers does so because the sample it is made of settles into
 *   layers; a moth sheds because the photocell says electrons leave. A foe that
 *   did something the bench would not do would be lying, in the same way a
 *   scanner that invented a reading would be.
 *
 * THE RULES (CLAUDE.md, "Spoil")
 *   - There is no magic: every pose comes from `planFoe`.
 *   - Foes are DISPERSED, never killed.
 *   - Species names are the plainest English there is (salt husk, lamp moth).
 *   - Nothing here can block a correct answer. The fight state only counts
 *     misses and refills; it has no veto and `check()` never reads it.
 */

import { buildUnits, planCut, planSettle } from './scope.js';
import { planPhotocell } from './lightdata.js';
import { planCurve, PAIRS, LATTICES } from './bonddata.js';
import { planDomains, planDipole, planTwist, planMix } from './vsepr.js';
import { planGas, planMixture, mixtureState, leftAfter, front } from './gasdata.js';

/**
 * How a bladder answers a push, as a ratio of the push now to the push the stage
 * began with. Below `SLACK` it sags; up to `TAUT` it holds its size; past that it
 * swells, and past `STRAIN` it strains at its seams. These are the bladder's own
 * thresholds, and `verify:learn` reads the same figures independently.
 */
export const BLADDER = { SLACK: 0.8, TAUT: 1.25, STRAIN: 2.2, EMPTY: 0.4, FULL: 0.85 };

/**
 * What a gas plate reads, from the instrument's own planner: its push (kPa) and its room (L).
 * A mixture's room is its tank's.
 */
function readingOf(probe) {
  const it = probe.item;
  if (it.head === 'mixture') {
    const m = mixtureState(it, probe.cfg || {});
    return { P: planMixture(it.parts, m.T, m.V).P, V: m.V };
  }
  const r = planGas(it, probe.cfg || {});
  return { P: r.P, V: r.V };
}

/**
 * How much a plate has changed since the stage began, as a ratio. A free piston holds
 * its push steady and gives its room instead, so a bladder on one swells with the
 * ROOM; on anything else it swells with the PUSH.
 */
function changeOf(probe) {
  const now = readingOf(probe);
  const rest = probe.rest || now;
  const free = probe.item.hold === 'P';
  // An empty free-piston cylinder has no room to be a ratio of: any gas in it at all is a swelling.
  const ratio = free
    ? (rest.V > 1e-6 ? now.V / rest.V : now.V > 1e-6 ? BLADDER.TAUT + 0.5 : 1)
    : now.P / rest.P;
  return { ratio: Number.isFinite(ratio) ? ratio : 1, P: now.P, V: now.V };
}

/** The pose a push ratio puts a bladder in. */
export function bladderPose(ratio) {
  if (ratio < BLADDER.SLACK) return 'slack';
  if (ratio <= BLADDER.TAUT) return 'rest';
  if (ratio <= BLADDER.STRAIN) return 'swollen';
  return 'straining';
}

/** Hits the rig can take on one stage before it is knocked back. */
export const INTEGRITY = 3;

/** How long the counter waits so the miss's REASON is on screen first, in ms. */
export const COUNTER_DELAY_MS = 450;

/* ------------------------------------------------------------------
   BENCH ITEMS
   A foe maps one-to-one onto the things on the bench a stage grades
   against: a sample on the scope, a plate on the photocell.
   ------------------------------------------------------------------ */

/** What a stage puts on the bench, in the order it prints it. */
export function benchItems(stage) {
  return stage.samples || stage.specimens || stage.rigs || stage.pairs || stage.slabs || stage.clouds || stage.hoppers || stage.foes || [];
}

/* ------------------------------------------------------------------
   SPECIES
   ------------------------------------------------------------------ */

/**
 * A species is plain data plus one planner. `lines` are the reaction sentences
 * the planner's poses print; each is a function of the plan so a figure on a
 * line is the planner's own.
 */
export const SPECIES = {
  'salt husk': {
    name: 'Salt husk',
    counter: 'The husk lunges and your rig takes the hit.',
    knockback: 'Knocked back. The husk is whole again, but everything you found is still on the bench.',
    hit: 'The husk crumbles into salt.',
    lines: {
      unmoved: () => 'The blade glances off. The husk is unmarked.',
      split: () => 'The husk splits apart into smaller parts.',
      scattered: () => 'The husk scatters into loose grains and nothing more.',
      layered: () => 'The husk settles into separate layers.',
      even: () => 'The husk settles into one even layer.'
    },
    /** @param {object} probe `{ tool: 'cut' | 'settle' }` */
    plan(enc, foe, probe) {
      const kinds = enc.env?.kinds || {};
      if (probe?.tool === 'cut') {
        const found = planCut(buildUnits(foe.item, kinds), foe.id).result;
        const pose = found === 'none' ? 'unmoved' : found === 'broke' ? 'split' : 'scattered';
        return { pose, found };
      }
      if (probe?.tool === 'settle') {
        const units = buildUnits(foe.item, kinds);
        planSettle(units, kinds);
        const layers = new Set(units.map(u => u.signature)).size;
        return { pose: layers > 1 ? 'layered' : 'even', layers };
      }
      return null;
    }
  },

  'lamp moth': {
    name: 'Lamp moth',
    counter: 'The moth beats its wings and your rig takes the hit.',
    knockback: 'Knocked back. The moth is whole again, but everything you found is still on the bench.',
    hit: 'The moth goes dark and drifts away.',
    lines: {
      shedding: () => 'Electrons are leaving its shell.',
      still: () => 'Its shell holds on to every electron.'
    },
    /** @param {object} probe `{ nm, brightness }` — the lamp as the bench has it set */
    plan(enc, foe, probe) {
      if (!probe || typeof probe.nm !== 'number') return null;
      const cell = planPhotocell(foe.item.metal, probe.nm, probe.brightness);
      // The picture shows what the counter counts: as many streaks as the
      // brightness, as long as the electrons are fast.
      return cell.freed
        ? { pose: 'shedding', dots: Math.max(1, Math.round(cell.count / 20)), speed: cell.speed, count: cell.count }
        : { pose: 'still', dots: 0, speed: 0, count: 0 };
    }
  },

  'the hopper': {
    name: 'The Hopper',
    counter: 'The hopper shudders and vents a spray of crushed slag at your rig.',
    knockback: 'Knocked back. The hopper resets its plating, but your telemetry on its core holds steady.',
    hit: 'The hopper collapses under its own weight, leaving cold slag across the salt.',
    lines: {
      unmoved: () => 'Its heavy armour plate shrugs off the strike.',
      cracked: () => 'The outer plating fractures and gives way.',
      neutral: () => 'Charge balance restored across the core.'
    },
    plan(enc, foe, probe) {
      return { pose: probe?.pose || 'unmoved' };
    }
  },

  'basalt warden': {
    name: 'Basalt warden',
    counter: 'The warden swings a heavy stone arm and your rig takes the shock.',
    knockback: 'Knocked back. The stone settles, but the mineral structure you measured remains charted.',
    hit: 'The warden shatters along its cleavage planes and settles into quarry stone.',
    lines: {
      unmoved: () => 'The stone framework holds rigid.',
      cleaved: () => 'The crystal cleaves along flat planes.',
      conductive: () => 'Current flows through mobile ions.',
      // The rig benches (q6 to q8): the warden shows what the hub, the field or the bond does.
      splayed: p => `Its columns spread to ${p.arms === 1 ? 'one arm' : `${p.arms} arms`} and stop.`,
      turned: () => 'The warden swings round and comes to rest facing the plate.',
      still: () => 'The warden does not turn. It only shivers.',
      locked: () => 'The warden\'s upper blocks will not turn against its lower ones.',
      free: () => 'The warden\'s upper blocks turn on their lower ones.',
      gripped: p => (p.grip > 0.6 ? 'Its columns clamp together hard.' : p.grip > 0.2 ? 'Its columns draw close.' : 'Its columns hold loosely.')
    },
    /**
     * @param {object} probe `{ pose }` (the older benches), or `{ rig }` from the domain rig:
     *   `{ rig: 'arms', arms }`, `{ rig: 'field', mol, on }`, `{ rig: 'twist', bond }`, `{ rig: 'mix', p }`
     */
    plan(enc, foe, probe) {
      if (probe?.rig === 'arms') {
        const plan = planDomains(probe.arms || []);
        return plan.n ? { pose: 'splayed', arms: plan.n, lone: plan.lone } : { pose: 'unmoved' };
      }
      if (probe?.rig === 'field') {
        if (!probe.on) return { pose: 'unmoved' };
        return planDipole(probe.mol).polar ? { pose: 'turned' } : { pose: 'still' };
      }
      if (probe?.rig === 'twist') {
        return planTwist(probe.bond).free ? { pose: 'free' } : { pose: 'locked' };
      }
      // The boss: a lattice's hold, the pair board's lamps and the molecular rack's magnet.
      if (probe?.rig === 'hold') {
        const grip = LATTICES[probe.lattice].energy / 3795;
        return { pose: 'gripped', grip: Math.round(grip * 100) / 100 };
      }
      if (probe?.rig === 'lamps') return probe.lit > 0 && probe.lit === probe.of ? { pose: 'cleaved' } : { pose: 'unmoved' };
      if (probe?.rig === 'pull') return probe.unpaired > 0 ? { pose: 'turned' } : { pose: 'still' };
      if (probe?.rig === 'mix') {
        const m = planMix(probe.p);
        return { pose: 'splayed', arms: m.lobes, lone: m.leftoverP };
      }
      return { pose: probe?.pose || 'unmoved' };
    }
  },

  'slag crawler': {
    name: 'Slag crawler',
    counter: 'The crawler lashes its plated tail and your rig takes the hit.',
    knockback: 'Knocked back. The crawler is whole again, but everything you found is still on the bench.',
    hit: 'The crawler breaks into slag and settles into the dust.',
    lines: {
      rest: () => 'The crawler lies at its natural length.',
      stretched: () => 'The crawler is drawn out and thins.',
      squeezed: () => 'The crawler is crushed short and bulges.',
      parted: () => 'The crawler comes apart in two.',
      unmoved: () => 'None of its plates have closed.',
      plated: p => (p.sealed === p.of ? 'Every plate on its back has closed.' : 'Some of the plates on its back have closed.'),
      held: () => 'The crawler holds together.',
      lost: () => 'The crawler falls apart where it stands.'
    },
    /**
     * @param {object} probe `{ kind: 'curve', pair, r }` from the bond bench,
     *   `{ kind: 'lamps', lit, of }` from the pair board, `{ kind: 'order', order }` from the MO rack
     */
    plan(enc, foe, probe) {
      if (probe?.kind === 'curve') {
        const c = planCurve(probe.pair, probe.r);
        return { pose: c.state === 'rest' ? 'rest' : c.state, r: c.r, stretch: c.r / PAIRS[probe.pair].r0 };
      }
      if (probe?.kind === 'lamps') {
        return probe.lit > 0 ? { pose: 'plated', sealed: probe.lit, of: probe.of } : { pose: 'unmoved', sealed: 0, of: probe.of };
      }
      if (probe?.kind === 'charges') {
        // The charge tool is on: a plate closes for every atom whose charge reads zero.
        return probe.zero > 0 ? { pose: 'plated', sealed: probe.zero, of: probe.of } : { pose: 'unmoved', sealed: 0, of: probe.of };
      }
      if (probe?.kind === 'order') {
        // Nothing placed yet says nothing: an empty rack is not a molecule that failed.
        if (!probe.placed) return null;
        return probe.order > 0 ? { pose: 'held' } : { pose: 'lost' };
      }
      return null;
    }
  },

  'recipe golem': {
    name: 'Recipe golem',
    counter: 'The golem vents high-pressure steam and drives your rig back.',
    knockback: 'Knocked back. The golem draws fresh mass, but the stoichiometry you proved is still logged.',
    hit: 'The golem starves for unbonded reagents and disperses into inert powder.',
    lines: {
      unmoved: () => 'The reaction vessel holds pressure.',
      balanced: () => 'The stoichiometry balances without excess.',
      starved: () => 'Limiting reagent exhausted.'
    },
    plan(enc, foe, probe) {
      return { pose: probe?.pose || 'unmoved' };
    }
  },

  'gas bladder': {
    name: 'Gas bladder',
    counter: 'The bladder heaves against the rig and your rig takes the hit.',
    knockback: 'Knocked back. The bladder settles to its own size, but everything you found is still on the bench.',
    hit: 'The bladder vents and lies slack.',
    lines: {
      rest: () => 'The bladder lies at its own size.',
      slack: () => 'The bladder sags and wrinkles.',
      swollen: () => 'The bladder swells and its skin draws tight.',
      straining: () => 'The bladder strains at its seams.',
      flat: () => 'The bladder is nearly flat.',
      shaken: () => 'The bladder shivers with every knock it takes.'
    },
    /**
     * @param {object} probe one of
     *   `{ kind: 'gas', item, cfg, rest }`   a cylinder or a tank; `rest` is `{ P, V }` as the stage began
     *   `{ kind: 'leak', gas, seconds }`     a chamber with its pinhole open
     *   `{ kind: 'tube', gas, seconds, length }`  a gas creeping down a tube
     *   `{ kind: 'path', hits }`             a particle being knocked about in a crowd
     */
    plan(enc, foe, probe) {
      if (probe?.kind === 'gas') {
        const { ratio, P } = changeOf(probe);
        return { pose: bladderPose(ratio), ratio, P };
      }
      if (probe?.kind === 'leak') {
        const left = leftAfter(probe.gas, probe.seconds);
        return { pose: left >= BLADDER.FULL ? 'rest' : left >= BLADDER.EMPTY ? 'slack' : 'flat', left };
      }
      if (probe?.kind === 'tube') {
        const frac = Math.min(1, front(probe.gas, probe.seconds) / (probe.length || 8));
        return { pose: frac >= 1 ? 'swollen' : 'rest', frac };
      }
      if (probe?.kind === 'path') {
        return probe.hits > 0 ? { pose: 'shaken', hits: probe.hits } : { pose: 'rest', hits: 0 };
      }
      return null;
    }
  },

  'the compressor': {
    name: 'The Compressor',
    counter: 'The compressor slams a piston stroke through the rig and your rig takes the hit.',
    knockback: 'Knocked back. The compressor cycles again, but every reading you took is still on the bench.',
    hit: 'The compressor vents its last charge and its pistons stand still.',
    lines: {
      idle: () => 'Its pistons run at their old stroke.',
      laboured: () => 'Its pistons labour against a rising push.',
      easy: () => 'Its pistons run light.',
      venting: () => 'A pinhole hisses in its flank and its tank sinks.',
      steady: () => 'Its tank holds the push it was filled to.'
    },
    /**
     * @param {object} probe `{ kind: 'gas', item, cfg, rest }` as the bladder reads it, or
     *   `{ kind: 'leak', gas, seconds }`
     */
    plan(enc, foe, probe) {
      if (probe?.kind === 'gas') {
        const { ratio, P } = changeOf(probe);
        return { pose: ratio > BLADDER.TAUT ? 'laboured' : ratio < BLADDER.SLACK ? 'easy' : 'steady', ratio, P };
      }
      if (probe?.kind === 'leak') {
        const left = leftAfter(probe.gas, probe.seconds);
        return { pose: left >= BLADDER.FULL ? 'idle' : 'venting', left };
      }
      return null;
    }
  },

  'the lantern-eater': {
    name: 'The Lantern-Eater',
    counter: 'The auroral cloud pulses and drains telemetry from your optical rig.',
    knockback: 'Knocked back. The cloud recondenses, but the spectral lines you logged remain charted.',
    hit: 'The optical cloud collapses and scatters into cold aurora trails.',
    lines: {
      unmoved: () => 'The energy barrier reflects your probe beam.',
      absorbed: () => 'Absorption confirmed at resonant frequency.',
      ionized: () => 'Outer electron envelope stripped by targeted photons.'
    },
    plan(enc, foe, probe) {
      return { pose: probe?.pose || 'unmoved' };
    }
  }
};

/* ------------------------------------------------------------------
   RESOLVING A STAGE'S DECLARATION
   ------------------------------------------------------------------ */

/**
 * Resolve `stage.encounter` against the stage's own bench.
 *
 *   encounter: {
 *     species: 'salt husk',
 *     act: 'Strike',                // the Commit key's label: the attack verb
 *     intent: 'One sentence the foe telegraphs.',
 *     hit: 'One sentence on how it disperses.',   // optional, species default
 *     counter: 'One sentence on its answer to a miss.', // optional, species default
 *     moves: { binId: 'Verb' }      // optional, per-bin move for a `bins` widget
 *   }
 *
 * Foes are NOT declared: one is made for every item on the bench, which is what
 * makes "foes map one-to-one onto the stage's samples" true by construction
 * (and `verify:learn` checks it anyway). Returns null for a stage with no
 * encounter, which then plays exactly as it always has.
 *
 * @param {object} stage
 * @param {{ kinds?: object }} [env] what the species planner needs from the quest
 */
export function resolveEncounter(stage, env = {}) {
  const e = stage?.encounter;
  if (!e) return null;
  const species = SPECIES[e.species];
  if (!species) return null;
  return {
    species: e.species,
    speciesName: species.name,
    act: e.act || 'Commit',
    intent: e.intent || '',
    hit: e.hit || species.hit,
    counter: e.counter || species.counter,
    knockback: species.knockback,
    moves: e.moves || null,
    env,
    foes: benchItems(stage).map(item => ({ id: item.id, label: item.label || item.id, item }))
  };
}

/**
 * What a foe does in answer to something the player did at the bench.
 * `{ pose, line, ...figures }`, or null when the probe says nothing about this
 * species (a dial that the species does not react to).
 */
export function planFoe(enc, foe, probe) {
  const species = SPECIES[enc.species];
  const plan = species.plan(enc, foe, probe);
  if (!plan) return null;
  return { ...plan, line: species.lines[plan.pose]?.(plan) || '' };
}

/* ------------------------------------------------------------------
   THE FIGHT
   The only state an encounter keeps: how much Integrity the rig has left.
   It counts committed misses and nothing else — never a timer, never a
   hint, never a tool. It has no veto: a correct commit is a win on any
   turn, at any Integrity, knocked back or not.
   ------------------------------------------------------------------ */

export function newFight(max = INTEGRITY) {
  return { max, integrity: max, lost: 0, knockbacks: 0, won: false };
}

/**
 * A committed miss costs one Integrity. At zero the rig is KNOCKED BACK:
 * Integrity refills and the foe is whole again. Everything learned is kept,
 * because none of it lives here.
 */
export function afterMiss(fight) {
  if (fight.won) return { fight, knockedBack: false };
  const integrity = fight.integrity - 1;
  const lost = fight.lost + 1;
  if (integrity <= 0) {
    return {
      fight: { ...fight, integrity: fight.max, lost, knockbacks: fight.knockbacks + 1 },
      knockedBack: true
    };
  }
  return { fight: { ...fight, integrity, lost }, knockedBack: false };
}

/** A correct commit. A flawless win is one that cost no Integrity. */
export function afterWin(fight) {
  return { fight: { ...fight, won: true }, flawless: fight.lost === 0 };
}

/* ------------------------------------------------------------------
   PORTRAITS
   Flat plate-grey silhouettes in the SCOURED PLATE palette: matter, lit
   by nothing of its own but the honest filament amber of a real event
   (a blade striking, an electron leaving). No eyes, no glow, no bloom.
   Pure strings, so they draw the same in a test as on the glass.
   ------------------------------------------------------------------ */

const INK = 'var(--text-muted, #8c8376)';
const BODY = 'var(--plate-400, #29282f)';
const EDGE = 'var(--plate-600, #4a4854)';
const LIT = 'var(--accent-amber, #e59b24)';

const LUMP = 'M10 36 L15 21 L27 14 L43 15 L54 25 L52 39 L36 44 L18 44 Z';

function svg(inner, label) {
  return `<svg class="lq-foe-art" viewBox="0 0 64 52" width="64" height="52" role="img" aria-label="${label}" focusable="false">${inner}</svg>`;
}

function huskArt(pose, plan = {}) {
  const hull = (d, extra = '') =>
    `<path d="${d}" fill="${BODY}" stroke="${EDGE}" stroke-width="1.5" stroke-linejoin="round"${extra}/>`;
  const facets = `<path d="M15 21 L27 30 L43 15 M27 30 L36 44 M27 30 L10 36 M43 15 L54 25" fill="none" stroke="${EDGE}" stroke-width="1" opacity="0.7"/>`;
  if (pose === 'split') {
    return svg(
      hull('M8 36 L12 22 L24 15 L29 24 L24 33 L27 44 L16 44 Z') +
      hull('M37 18 L47 18 L56 27 L54 40 L42 45 L36 36 L40 27 Z'),
      'Salt husk, split in two');
  }
  if (pose === 'scattered') {
    const dots = [[12, 38], [20, 44], [28, 36], [36, 43], [44, 37], [52, 42], [17, 29], [33, 28], [48, 29], [24, 22], [41, 21]];
    return svg(dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${BODY}" stroke="${EDGE}" stroke-width="1"/>`).join(''),
      'Salt husk, scattered into grains');
  }
  if (pose === 'layered') {
    const n = Math.max(2, Math.min(4, plan.layers || 2));
    const h = 30 / n;
    return svg(Array.from({ length: n }, (_, i) =>
      `<rect x="10" y="${14 + i * (h + 2)}" width="44" height="${h}" fill="${BODY}" stroke="${EDGE}" stroke-width="1.5" opacity="${1 - i * 0.18}"/>`).join(''),
      `Salt husk, settled into ${n} layers`);
  }
  if (pose === 'even') {
    return svg(`<rect x="10" y="24" width="44" height="18" fill="${BODY}" stroke="${EDGE}" stroke-width="1.5"/>`,
      'Salt husk, settled into one layer');
  }
  if (pose === 'unmoved') {
    return svg(hull(LUMP) + facets +
      `<path d="M2 18 L12 28" stroke="${LIT}" stroke-width="2" stroke-linecap="round" fill="none"/>`,
      'Salt husk, unmarked by the blade');
  }
  if (pose === 'dispersed') {
    const dots = [[14, 44], [22, 46], [30, 43], [38, 46], [46, 44], [26, 40], [34, 40]];
    return svg(dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="${INK}" opacity="0.5"/>`).join(''),
      'Salt husk, dispersed');
  }
  return svg(hull(LUMP) + facets, 'Salt husk');
}

function mothArt(pose, plan = {}) {
  const plate = `<rect x="8" y="42" width="48" height="4" fill="${EDGE}"/>`;
  const body = `<ellipse cx="32" cy="30" rx="3.2" ry="9" fill="${BODY}" stroke="${EDGE}" stroke-width="1.2"/>`;
  const folded = `<path d="M29 24 L20 40 L30 38 Z M35 24 L44 40 L34 38 Z" fill="${BODY}" stroke="${EDGE}" stroke-width="1.2" stroke-linejoin="round"/>`;
  const spread = `<path d="M29 24 L8 16 L12 36 L29 36 Z M35 24 L56 16 L52 36 L35 36 Z" fill="${BODY}" stroke="${EDGE}" stroke-width="1.2" stroke-linejoin="round"/>`;
  if (pose === 'shedding') {
    // As many streaks as the counter counts, as long as the fastest electron is quick.
    const n = Math.max(1, Math.min(5, plan.dots || 1));
    const len = 4 + Math.min(12, (plan.speed || 0) / 2);
    const streaks = Array.from({ length: n }, (_, i) => {
      const x = 16 + ((i + 0.5) / n) * 32;
      return `<path d="M${x.toFixed(1)} 41 L${x.toFixed(1)} ${(41 - len).toFixed(1)}" stroke="${LIT}" stroke-width="1.6" stroke-linecap="round"/>`;
    }).join('');
    return svg(plate + spread + body + streaks, 'Lamp moth, electrons leaving its shell');
  }
  if (pose === 'dispersed') {
    return svg(`<g opacity="0.45">${plate + folded + body}</g>`, 'Lamp moth, gone dark');
  }
  return svg(plate + folded + body, 'Lamp moth');
}

function hopperArt(pose, plan = {}) {
  const gantry = `<path d="M12 48 L18 16 L46 16 L52 48 M22 48 L22 30 L42 30 L42 48" fill="${BODY}" stroke="${EDGE}" stroke-width="1.5" stroke-linejoin="round"/>`;
  const chute = `<polygon points="20,16 44,16 38,32 26,32" fill="${BODY}" stroke="${EDGE}" stroke-width="1.2"/>`;
  const slag = `<rect x="24" y="34" width="16" height="8" fill="${EDGE}" stroke="${INK}" stroke-width="1"/>`;
  if (pose === 'cracked') {
    return svg(gantry + chute + `<path d="M24 20 L32 28 L40 22" stroke="${LIT}" stroke-width="1.8" fill="none"/>`, 'The Hopper, plating fractured');
  }
  if (pose === 'dispersed') {
    return svg(`<g opacity="0.4">${gantry + chute}</g>`, 'The Hopper, collapsed');
  }
  return svg(gantry + chute + slag, 'The Hopper');
}

function wardenArt(pose, plan = {}) {
  const pillars = `<polygon points="14,48 18,18 28,14 24,48" fill="${BODY}" stroke="${EDGE}" stroke-width="1.5"/>` +
    `<polygon points="26,48 30,10 42,12 38,48" fill="${BODY}" stroke="${EDGE}" stroke-width="1.5"/>` +
    `<polygon points="40,48 44,22 52,26 48,48" fill="${BODY}" stroke="${EDGE}" stroke-width="1.5"/>`;
  if (pose === 'cleaved') {
    return svg(pillars + `<path d="M12 28 L52 32" stroke="${LIT}" stroke-width="2" stroke-dasharray="4 2"/>`, 'Basalt warden, cleaved along lattice');
  }
  if (pose === 'conductive') {
    return svg(pillars + `<circle cx="34" cy="24" r="6" fill="${LIT}" opacity="0.6"/>`, 'Basalt warden, conducting current');
  }
  if (pose === 'splayed') {
    const lean = Math.min(10, (plan.arms || 2) * 1.6);
    return svg(`<polygon points="${14 - lean},48 ${18 - lean},18 ${28 - lean},14 ${24 - lean},48" fill="${BODY}" stroke="${EDGE}" stroke-width="1.5"/>` +
      `<polygon points="26,48 30,10 42,12 38,48" fill="${BODY}" stroke="${EDGE}" stroke-width="1.5"/>` +
      `<polygon points="${40 + lean},48 ${44 + lean},22 ${52 + lean},26 ${48 + lean},48" fill="${BODY}" stroke="${EDGE}" stroke-width="1.5"/>`, 'Basalt warden, columns spread');
  }
  if (pose === 'turned') return svg(pillars + `<path d="M8 8 L56 8" stroke="${LIT}" stroke-width="2"/>`, 'Basalt warden, turned in the field');
  if (pose === 'still') return svg(pillars + `<path d="M30 52 l4 0" stroke="${EDGE}" stroke-width="2"/>`, 'Basalt warden, unmoved by the field');
  if (pose === 'locked') return svg(pillars + `<path d="M12 28 L52 28" stroke="${EDGE}" stroke-width="2"/>`, 'Basalt warden, joints locked');
  if (pose === 'free') return svg(pillars + `<path d="M12 28 L52 28" stroke="${LIT}" stroke-width="2" stroke-dasharray="3 2"/>`, 'Basalt warden, joints turning');
  if (pose === 'dispersed') {
    return svg(`<g opacity="0.4">${pillars}</g>`, 'Basalt warden, settled into stone');
  }
  return svg(pillars, 'Basalt warden');
}

function crawlerArt(pose, plan = {}) {
  const seg = (x, w, extra = '') => `<rect x="${x}" y="24" width="${w}" height="14" rx="3" fill="${BODY}" stroke="${EDGE}" stroke-width="1.5"${extra}/>`;
  const legs = (x0, x1) => [x0 + 4, (x0 + x1) / 2, x1 - 4].map(x => `<path d="M${x} 38 L${x - 2} 46 M${x} 38 L${x + 2} 46" stroke="${EDGE}" stroke-width="1.4"/>`).join('');
  const plates = (n, closed) => Array.from({ length: n }, (_, k) => {
    const x = 10 + k * (44 / n);
    return `<path d="M${x} ${closed > k ? 22 : 14} l${44 / n - 3} 0" stroke="${closed > k ? LIT : EDGE}" stroke-width="2.2" stroke-linecap="round"/>`;
  }).join('');
  if (pose === 'stretched') return svg(seg(4, 56) + legs(4, 60) + plates(4, 0), 'Slag crawler, drawn out');
  if (pose === 'squeezed') return svg(seg(18, 28, ' transform="translate(0 -3)"') + `<rect x="18" y="21" width="28" height="18" rx="4" fill="${BODY}" stroke="${EDGE}" stroke-width="1.5"/>` + legs(18, 46), 'Slag crawler, crushed short');
  if (pose === 'parted' || pose === 'lost') return svg(seg(4, 22) + seg(38, 22) + legs(4, 26) + legs(38, 60), 'Slag crawler, in two parts');
  if (pose === 'plated') {
    const n = Math.max(1, Math.min(6, plan.of || 4));
    return svg(seg(8, 48) + legs(8, 56) + plates(n, Math.min(n, plan.sealed || 0)), 'Slag crawler, plates closing');
  }
  if (pose === 'dispersed') {
    return svg(`<g opacity="0.4">${seg(8, 48) + legs(8, 56)}</g>`, 'Slag crawler, dispersed');
  }
  return svg(seg(8, 48) + legs(8, 56) + plates(4, 0), 'Slag crawler');
}

function golemArt(pose, plan = {}) {
  const vessel = `<rect x="18" y="16" width="28" height="26" rx="4" fill="${BODY}" stroke="${EDGE}" stroke-width="1.5"/>`;
  const valve = `<circle cx="32" cy="29" r="6" fill="${EDGE}" stroke="${LIT}" stroke-width="1.5"/>`;
  const pipes = `<path d="M22 16 L22 10 M42 16 L42 10 M18 36 L12 36 M46 36 L52 36" stroke="${EDGE}" stroke-width="2"/>`;
  if (pose === 'balanced') {
    return svg(vessel + valve + pipes + `<circle cx="32" cy="29" r="3" fill="${LIT}"/>`, 'Recipe golem, balanced reaction');
  }
  if (pose === 'dispersed') {
    return svg(`<g opacity="0.4">${vessel + valve + pipes}</g>`, 'Recipe golem, dispersed');
  }
  return svg(vessel + valve + pipes, 'Recipe golem');
}

function lanternEaterArt(pose, plan = {}) {
  const halo = `<circle cx="32" cy="26" r="18" fill="${BODY}" stroke="${EDGE}" stroke-width="1.5" stroke-dasharray="3 3"/>`;
  const core = `<circle cx="32" cy="26" r="8" fill="${EDGE}" stroke="${LIT}" stroke-width="1.2"/>`;
  const rays = `<path d="M32 6 L32 14 M32 38 L32 46 M12 26 L20 26 M44 26 L52 26" stroke="${LIT}" stroke-width="1.5"/>`;
  if (pose === 'ionized') {
    return svg(halo + core + `<circle cx="32" cy="26" r="14" fill="none" stroke="${LIT}" stroke-width="2"/>`, 'The Lantern-Eater, ionized envelope');
  }
  if (pose === 'dispersed') {
    return svg(`<g opacity="0.3">${halo + core}</g>`, 'The Lantern-Eater, dispersed');
  }
  return svg(halo + core + rays, 'The Lantern-Eater');
}

function bladderArt(pose, plan = {}) {
  // A bag on a plate: a skin, two seams, a tied neck and a brass valve. It sags, holds,
  // swells or strains with the push; the only amber is a seam near to giving way.
  const bag = (rx, ry, extra = '') => `<ellipse cx="32" cy="${46 - ry}" rx="${rx}" ry="${ry}" fill="${BODY}" stroke="${EDGE}" stroke-width="1.5"${extra}/>`;
  const seams = (rx, ry) => `<path d="M${32 - rx * 0.45} ${46 - ry * 1.8} Q${32 - rx * 0.2} ${46 - ry} ${32 - rx * 0.45} ${46 - ry * 0.2} M${32 + rx * 0.45} ${46 - ry * 1.8} Q${32 + rx * 0.2} ${46 - ry} ${32 + rx * 0.45} ${46 - ry * 0.2}" fill="none" stroke="${EDGE}" stroke-width="1" opacity="0.8"/>`;
  const neck = `<path d="M29 ${12} L35 ${12} L34 ${17} L30 ${17} Z" fill="${EDGE}"/><circle cx="32" cy="10" r="2.4" fill="${EDGE}" stroke="${INK}" stroke-width="0.8"/>`;
  const plate = `<rect x="8" y="46" width="48" height="3" fill="${EDGE}"/>`;
  if (pose === 'slack') {
    return svg(plate + bag(20, 7) + `<path d="M16 41 Q22 38 28 41 Q34 44 40 41 Q46 38 50 41" fill="none" stroke="${EDGE}" stroke-width="1"/>`, 'Gas bladder, slack');
  }
  if (pose === 'swollen') {
    return svg(plate + neck + bag(22, 16) + seams(22, 16), 'Gas bladder, swollen');
  }
  if (pose === 'straining') {
    return svg(plate + neck + bag(26, 20) + seams(26, 20) + `<path d="M26 31 L29 36 M38 31 L35 36" stroke="${LIT}" stroke-width="2" stroke-linecap="round"/>`, 'Gas bladder, straining at its seams');
  }
  if (pose === 'flat') {
    return svg(plate + `<ellipse cx="32" cy="43" rx="22" ry="3" fill="${BODY}" stroke="${EDGE}" stroke-width="1.5"/>`, 'Gas bladder, nearly flat');
  }
  if (pose === 'shaken') {
    return svg(plate + neck + bag(20, 13) + seams(20, 13) + `<path d="M6 30 l3 -2 l-3 -2 M58 30 l-3 -2 l3 -2" stroke="${INK}" stroke-width="1.2" fill="none"/>`, 'Gas bladder, shaken');
  }
  if (pose === 'dispersed') {
    return svg(`<g opacity="0.4">${plate}<ellipse cx="32" cy="44" rx="20" ry="2.6" fill="${BODY}" stroke="${EDGE}" stroke-width="1"/></g>`, 'Gas bladder, vented');
  }
  return svg(plate + neck + bag(20, 13) + seams(20, 13), 'Gas bladder');
}

function compressorArt(pose, plan = {}) {
  // A cylinder block on legs with a flywheel: a rogue compressor, plate grey.
  const block = `<rect x="14" y="14" width="30" height="22" rx="3" fill="${BODY}" stroke="${EDGE}" stroke-width="1.5"/>`;
  const head = `<rect x="18" y="8" width="22" height="7" fill="${EDGE}" stroke="${INK}" stroke-width="0.8"/>`;
  const wheel = `<circle cx="50" cy="28" r="8" fill="${BODY}" stroke="${EDGE}" stroke-width="1.5"/><circle cx="50" cy="28" r="2" fill="${EDGE}"/>`;
  const legs = `<path d="M17 36 L15 46 M41 36 L43 46 M10 46 L48 46" stroke="${EDGE}" stroke-width="2"/>`;
  if (pose === 'laboured') return svg(block + head + wheel + legs + `<path d="M20 22 L38 22" stroke="${LIT}" stroke-width="2"/>`, 'The Compressor, labouring');
  if (pose === 'venting') return svg(block + head + wheel + legs + `<path d="M44 18 q6 -2 9 -6 M44 21 q7 0 11 -3" stroke="${INK}" stroke-width="1.2" fill="none"/>`, 'The Compressor, venting');
  if (pose === 'dispersed') return svg(`<g opacity="0.35">${block + head + wheel + legs}</g>`, 'The Compressor, still');
  return svg(block + head + wheel + legs, 'The Compressor');
}

/** The portrait of a species in a pose, as an SVG string. */
export function portraitSvg(species, pose = 'idle', plan = {}) {
  if (species === 'gas bladder') return bladderArt(pose, plan);
  if (species === 'the compressor') return compressorArt(pose, plan);
  if (species === 'lamp moth') return mothArt(pose, plan);
  if (species === 'the hopper') return hopperArt(pose, plan);
  if (species === 'basalt warden') return wardenArt(pose, plan);
  if (species === 'recipe golem') return golemArt(pose, plan);
  if (species === 'slag crawler') return crawlerArt(pose, plan);
  if (species === 'the lantern-eater') return lanternEaterArt(pose, plan);
  return huskArt(pose, plan);
}
