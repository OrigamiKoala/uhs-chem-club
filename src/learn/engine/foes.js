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
      conductive: () => 'Current flows through mobile ions.'
    },
    plan(enc, foe, probe) {
      return { pose: probe?.pose || 'unmoved' };
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

/** The portrait of a species in a pose, as an SVG string. */
export function portraitSvg(species, pose = 'idle', plan = {}) {
  if (species === 'lamp moth') return mothArt(pose, plan);
  if (species === 'the hopper') return hopperArt(pose, plan);
  if (species === 'basalt warden') return wardenArt(pose, plan);
  if (species === 'recipe golem') return golemArt(pose, plan);
  if (species === 'the lantern-eater') return lanternEaterArt(pose, plan);
  return huskArt(pose, plan);
}
