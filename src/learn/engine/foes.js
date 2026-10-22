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
 *   (`planDomains`, `planDipole`, `planGas`...), never authored. A foe that
 *   did something the bench would not do would be lying, in the same way a
 *   scanner that invented a reading would be.
 *
 * THE RULES (CLAUDE.md, "Spoil")
 *   - There is no magic: every pose comes from `planFoe`.
 *   - Foes are DISPERSED, never killed.
 *   - Species names are the plainest English there is (basalt warden, recipe golem).
 *   - Nothing here can block a correct answer. The fight state only counts
 *     misses and refills; it has no veto and `check()` never reads it.
 */

import { LATTICES } from './bonddata.js';
import { planDomains, planDipole, planTwist, planMix } from './vsepr.js';
import { planGas, planMixture, mixtureState, leftAfter } from './gasdata.js';
import { gibbsFreeEnergy, hessStackEnthalpy, bondEnthalpySum } from './thermodata.js';

/**
 * How the Compressor answers a push, as a ratio of the push now to the push the stage
 * began with. Below `SLACK` it sags; up to `TAUT` it holds its size; past that it
 * swells, and past `STRAIN` it strains at its seams. These are its own
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
 * its push steady and gives its room instead, so the Compressor on one eases with the
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
  'the hopper': {
    name: 'The Hopper',
    counter: 'Trial missed: the core charge or mass balance was not satisfied.',
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
    counter: 'Trial missed: the mineral crystal structure does not match that configuration.',
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

  'recipe golem': {
    name: 'Recipe golem',
    counter: 'Trial missed: the reactant mole ratio is unbalanced.',
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

  'the compressor': {
    name: 'The Compressor',
    counter: 'Trial missed: the cylinder compression cycle does not match the target.',
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
     * @param {object} probe `{ kind: 'gas', item, cfg, rest }` as the Compressor reads it, or
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
    counter: 'The aurora pulses and drains the glow from your lamp.',
    knockback: 'Knocked back. The cloud closes up again, but the readings you took are still on the bench.',
    hit: 'The cloud thins and scatters into cold aurora.',
    lines: {
      unmoved: () => 'The eater does not flinch.',
      absorbed: () => 'The eater dims where the light is taken in.',
      ionized: () => 'The eater flickers as electrons are knocked loose.'
    },
    plan(enc, foe, probe) {
      return { pose: probe?.pose || 'unmoved' };
    }
  },

  'the crucible': {
    name: 'The Crucible',
    counter: 'Trial missed: the furnace heat or free-energy balance does not match that setting.',
    knockback: 'Knocked back. The furnace vessel seals again, but every enthalpy and entropy reading on your bench remains.',
    hit: 'The crucible splits along its firebrick seams and cools into dark slag.',
    lines: {
      idle: () => 'The firebrick shell holds its heat.',
      unmoved: () => 'The crucible shell holds steady.',
      heated: () => 'Heat surges across the vessel wall.',
      cracked: () => 'A hairline seam opens across the firebrick.',
      vented: () => 'Steam and flue gas pour from the top vent.'
    },
    plan(enc, foe, probe) {
      if (probe?.kind === 'thermo') {
        const it = probe.item || {};
        const cfg = probe.cfg || {};
        if (it.head === 'gibbs') {
          const T = (cfg.dialKey === 'temp' && cfg.dialValue != null) ? cfg.dialValue : (it.T ?? 298);
          const coupledOn = it.coupled && (it.coupled.active || cfg.toggled);
          const dG = gibbsFreeEnergy(it.dH ?? 6.01, it.dS ?? 22.0, T) + (coupledOn ? (it.coupled.dG2 ?? 0) : 0);
          return { pose: dG < 0 ? 'vented' : 'heated', dG, T };
        }
        if (it.head === 'hess') {
          const cardState = cfg.cardState || {};
          const steps = (it.cards || []).map(c => ({
            dH: c.dH,
            flip: cardState[c.id]?.flip ?? Boolean(c.flip),
            mult: cardState[c.id]?.mult ?? (c.mult ?? 1)
          }));
          const dH = hessStackEnthalpy(steps);
          return { pose: dH < 0 ? 'heated' : 'cracked', dH };
        }
        if (it.head === 'bonds') {
          const sums = bondEnthalpySum(it.broken || [], it.formed || []);
          return { pose: sums.net < 0 ? 'heated' : 'cracked', dH: sums.net };
        }
        if (it.head === 'cup' || it.head === 'contact' || it.head === 'diagram') {
          return { pose: cfg.toggled ? 'vented' : 'heated' };
        }
        return { pose: 'unmoved' };
      }
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
 *     species: 'basalt warden',
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
 */
export function resolveEncounter(stage) {
  const e = stage?.encounter;
  if (!e) return null;
  const species = SPECIES[e.species];
  if (!species) return null;
  return {
    species: e.species,
    speciesName: species.name,
    act: e.act || 'Submit',
    intent: e.intent || '',
    hit: e.hit || species.hit,
    counter: e.counter || species.counter,
    knockback: species.knockback,
    moves: e.moves || null,
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


function svg(inner, label) {
  return `<svg class="lq-foe-art" viewBox="0 0 64 52" width="64" height="52" role="img" aria-label="${label}" focusable="false">${inner}</svg>`;
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

function crucibleArt(pose, plan = {}) {
  const bowl = `<polygon points="16,14 48,14 42,42 22,42" fill="${BODY}" stroke="${EDGE}" stroke-width="1.5" stroke-linejoin="round"/>`;
  const rim = `<rect x="14" y="10" width="36" height="5" rx="1" fill="${EDGE}" stroke="${INK}" stroke-width="0.9"/>`;
  const trunnions = `<rect x="10" y="22" width="6" height="6" fill="${EDGE}"/><rect x="48" y="22" width="6" height="6" fill="${EDGE}"/>`;
  const legs = `<path d="M24 42 L20 48 M40 42 L44 48" stroke="${EDGE}" stroke-width="2"/>`;
  if (pose === 'heated') return svg(bowl + rim + trunnions + legs + `<circle cx="32" cy="28" r="7" fill="${LIT}" opacity="0.7"/>`, 'The Crucible, heated');
  if (pose === 'cracked') return svg(bowl + rim + trunnions + legs + `<path d="M26 16 L33 28 L29 40" stroke="${LIT}" stroke-width="1.8" fill="none"/>`, 'The Crucible, cracked');
  if (pose === 'vented') return svg(bowl + rim + trunnions + legs + `<path d="M26 10 q2 -5 6 -6 M36 10 q3 -4 6 -5" stroke="${LIT}" stroke-width="1.5" fill="none"/>`, 'The Crucible, venting');
  if (pose === 'dispersed') return svg(`<g opacity="0.35">${bowl + rim + trunnions + legs}</g>`, 'The Crucible, cooled');
  return svg(bowl + rim + trunnions + legs, 'The Crucible');
}

/** The portrait of a species in a pose, as an SVG string. */
export function portraitSvg(species, pose = 'idle', plan = {}) {
  if (species === 'the crucible') return crucibleArt(pose, plan);
  if (species === 'the compressor') return compressorArt(pose, plan);
  if (species === 'the hopper') return hopperArt(pose, plan);
  if (species === 'basalt warden') return wardenArt(pose, plan);
  if (species === 'recipe golem') return golemArt(pose, plan);
  if (species === 'the lantern-eater') return lanternEaterArt(pose, plan);
  return hopperArt(pose, plan);
}
