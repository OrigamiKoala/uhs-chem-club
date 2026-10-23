/**
 * commendations.js — Commendation badge plates and pure predicate evaluation.
 * Pure data and pure functions; importable in Node and browser.
 */

import { getWorld } from '../learn/curriculum.js';
import { getFieldManualStats } from '../ui/field-manual.js';
import { practiceFacts } from '../learn/drills.js';

export const COMMENDATION_ROADS = ['campaign', 'craft', 'learn', 'crew', 'season'];
export const COMMENDATION_TIERS = ['painted', 'brass', 'etched'];

/**
 * Every term of a road's Field Manual is logged. Read off the registry rather than
 * a stored flag, so the plate cannot drift from the terms the Manual holds.
 */
function manualComplete(s, road) {
  const r = getFieldManualStats({ learn: s.learn || {}, progress: s.progress || [] }).byRoad[road];
  return Boolean(r && r.total > 0 && r.earned === r.total);
}

export const COMMENDATIONS = [
  // ===================== CAMPAIGN =====================
  {
    id: 'first_pylon',
    name: 'First Pylon',
    line: 'Lit your first pylon in the Charge Gardens.',
    tier: 'painted',
    road: 'campaign',
    hidden: false,
    earnedBy: (s) => (s.clearedStagesCount || s.stageReached || 0) >= 1
  },
  {
    id: 'pylons_5',
    name: 'Garden Tender',
    line: 'Restored power through Pylon 5.',
    tier: 'painted',
    road: 'campaign',
    hidden: false,
    earnedBy: (s) => (s.clearedStagesCount || s.stageReached || 0) >= 5
  },
  {
    id: 'pylons_10',
    name: 'Circuit Restorer',
    line: 'Brought ten pylons back to life.',
    tier: 'brass',
    road: 'campaign',
    hidden: false,
    earnedBy: (s) => (s.clearedStagesCount || s.stageReached || 0) >= 10
  },
  {
    id: 'pylons_15',
    name: 'Grid Builder',
    line: 'Rebuilt the line through Pylon 15.',
    tier: 'brass',
    road: 'campaign',
    hidden: false,
    earnedBy: (s) => (s.clearedStagesCount || s.stageReached || 0) >= 15
  },
  {
    id: 'pylons_20',
    name: 'Master of the Gardens',
    line: 'Restored all twenty pylons in the Charge Gardens.',
    tier: 'etched',
    road: 'campaign',
    hidden: false,
    earnedBy: (s) => (s.clearedStagesCount || s.stageReached || 0) >= 20
  },
  {
    id: 'clean_streak_5',
    name: 'Sure Hand',
    line: 'Solved five stages in a row on the first attempt without rungs.',
    tier: 'brass',
    road: 'campaign',
    hidden: false,
    earnedBy: (s) => (s.cleanStreak || 0) >= 5 || (s.maxCleanStreak || 0) >= 5
  },
  {
    id: 'clean_streak_10',
    name: 'Steady Eye',
    line: 'Solved ten stages in a row on the first attempt without rungs.',
    tier: 'etched',
    road: 'campaign',
    hidden: false,
    earnedBy: (s) => (s.cleanStreak || 0) >= 10 || (s.maxCleanStreak || 0) >= 10
  },
  {
    id: 'clean_quest_q1',
    name: 'Flawless Transmission',
    line: 'Completed every stage of Quest 1 clean on the first try.',
    tier: 'etched',
    road: 'campaign',
    hidden: false,
    earnedBy: (s) => {
      const cleans = Array.isArray(s.cleanStages) ? s.cleanStages.length : 0;
      return cleans >= 20;
    }
  },

  // ===================== CRAFT =====================
  {
    id: 'craft_scanned_all',
    name: 'Thorough Survey',
    line: 'Scanned every site on a stage before committing an arrow.',
    tier: 'painted',
    road: 'campaign',
    hidden: false,
    earnedBy: (s) => Boolean(s.flags && s.flags.scanned_all_sites)
  },
  {
    id: 'craft_chamber_rotated',
    name: 'Wide View',
    line: 'Solved a blocked-path stage after rotating the chamber.',
    tier: 'painted',
    road: 'campaign',
    hidden: false,
    earnedBy: (s) => Boolean(s.flags && s.flags.rotated_chamber_solve)
  },
  {
    id: 'craft_t1',
    name: 'Manual Control',
    line: 'Cleared a stage using the terminal fallback inputs.',
    tier: 'brass',
    road: 'campaign',
    hidden: false,
    earnedBy: (s) => Boolean(s.flags && s.flags.cleared_t1)
  },
  {
    id: 'craft_all_concepts',
    name: 'Field Scholar',
    line: 'Opened every concept card across the campaign.',
    tier: 'brass',
    road: 'campaign',
    hidden: false,
    earnedBy: (s) => Boolean(s.flags && s.flags.all_concepts_opened)
  },

  // ===================== LEARN =====================
  {
    id: 'learn_q1_grain',
    name: 'Grain Separator',
    line: 'Worked through the counting bench on Tallow.',
    tier: 'painted',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => Boolean(s.learn && s.learn['unit01/q1-grain']?.completedAt)
  },
  {
    id: 'learn_q2_core',
    name: 'Core Prober',
    line: 'Probed the inner core on Tallow.',
    tier: 'painted',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => Boolean(s.learn && s.learn['unit01/q2-core']?.completedAt)
  },
  {
    id: 'learn_q3_catalogue',
    name: 'Catalogue Archivist',
    line: 'Classified specimens on the catalogue board.',
    tier: 'painted',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => Boolean(s.learn && s.learn['unit01/q3-catalogue']?.completedAt)
  },
  {
    id: 'learn_q4_ledger',
    name: 'Ledger Clerk',
    line: 'Balanced the mass ledger on Tallow.',
    tier: 'brass',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => Boolean(s.learn && s.learn['unit01/q4-ledger']?.completedAt)
  },
  {
    id: 'learn_q5_assay',
    name: 'Master Assayer',
    line: 'Completed the assay works on Tallow.',
    tier: 'brass',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => Boolean(s.learn && s.learn['unit01/q5-assay']?.completedAt)
  },
  {
    id: 'tallow_surveyed',
    name: 'Tallow Surveyed',
    line: 'Completed every bench across the salt flats of Tallow.',
    tier: 'etched',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => {
      if (!s.learn) return false;
      const q = (getWorld('unit01')?.quests || []).filter(x => x.status === 'live').map(x => x.id);
      return q.length > 0 && q.every(id => Boolean(s.learn[`unit01/${id}`]?.completedAt));
    }
  },
  {
    id: 'tallow_practice',
    name: 'Salt Drills',
    line: 'Worked through the revision problem set on Tallow.',
    tier: 'painted',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => Boolean(s.flags && s.flags.unit01_practice_done)
  },
  {
    id: 'manual_unit01',
    name: 'Unit 1 Field Log',
    line: 'Logged every vocabulary term across Tallow.',
    tier: 'etched',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => manualComplete(s, 'unit01')
  },
  {
    id: 'learn_q1_joins',
    name: 'Joint Stamper',
    line: 'Tested bonded pairs on the join bench of Ligar.',
    tier: 'painted',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => Boolean(s.learn && s.learn['unit03/q1-joins']?.completedAt)
  },
  {
    id: 'learn_q2_lattice',
    name: 'Lattice Forger',
    line: 'Formed crystalline slabs on Ligar.',
    tier: 'painted',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => Boolean(s.learn && s.learn['unit03/q2-lattice']?.completedAt)
  },
  {
    id: 'learn_q3_recipe',
    name: 'Recipe Keeper',
    line: 'Measured definite proportions at the soda lake of Kettle.',
    tier: 'brass',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => Boolean(s.learn && s.learn['unit07/q1-recipe']?.completedAt)
  },
  {
    id: 'learn_q4_weigh',
    name: 'Molar Scale',
    line: 'Counted by weighing on the salt flats of Tallow.',
    tier: 'brass',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => Boolean(s.learn && s.learn['unit01/q6-weigh']?.completedAt)
  },
  {
    id: 'lanternfall_surveyed',
    name: 'Lanternfall Surveyed',
    line: 'Completed every built bench round the frozen lake of Lanternfall.',
    tier: 'etched',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => {
      if (!s.learn) return false;
      // Read off the chart, so the plate keeps meaning "every bench" as more are built.
      const q = (getWorld('unit02')?.quests || []).filter(x => x.status === 'live').map(x => x.id);
      return q.length > 0 && q.every(id => Boolean(s.learn[`unit02/${id}`]?.completedAt));
    }
  },
  {
    id: 'lanternfall_practice',
    name: 'Lantern Drills',
    line: 'Worked through the revision problem set on Lanternfall.',
    tier: 'painted',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => Boolean(s.flags && s.flags.unit02_practice_done)
  },
  {
    id: 'manual_unit02',
    name: 'Unit 2 Field Log',
    line: 'Logged every vocabulary term across Lanternfall.',
    tier: 'etched',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => manualComplete(s, 'unit02')
  },
  {
    id: 'ligar_surveyed',
    name: 'Ligar Surveyed',
    line: 'Completed every built bench across the basalt arches of Ligar.',
    tier: 'etched',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => {
      if (!s.learn) return false;
      // Read off the chart, so the plate keeps meaning "every bench" as more are built.
      const q = (getWorld('unit03')?.quests || []).filter(x => x.status === 'live').map(x => x.id);
      return q.length > 0 && q.every(id => Boolean(s.learn[`unit03/${id}`]?.completedAt));
    }
  },
  {
    id: 'ligar_practice',
    name: 'Quarry Drills',
    line: 'Worked through the revision problem set on Ligar.',
    tier: 'painted',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => Boolean(s.flags && s.flags.unit03_practice_done)
  },
  {
    id: 'manual_unit03',
    name: 'Unit 3 Field Log',
    line: 'Logged every vocabulary term across Ligar.',
    tier: 'etched',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => manualComplete(s, 'unit03')
  },

  {
    id: 'bellows_surveyed',
    name: 'Bellows Surveyed',
    line: 'Completed every built bench across the cloud deck of Bellows.',
    tier: 'etched',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => {
      if (!s.learn) return false;
      // Read off the chart, so the plate keeps meaning "every bench" as more are built.
      const q = (getWorld('unit04')?.quests || []).filter(x => x.status === 'live' && x.arena !== 'boss').map(x => x.id);
      return q.length > 0 && q.every(id => Boolean(s.learn[`unit04/${id}`]?.completedAt));
    }
  },
  {
    id: 'bellows_practice',
    name: 'Gauge Drills',
    line: 'Worked through the revision problem set on Bellows.',
    tier: 'painted',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => Boolean(s.flags && s.flags.unit04_practice_done)
  },
  {
    id: 'manual_unit04',
    name: 'Unit 4 Field Log',
    line: 'Logged every vocabulary term across Bellows.',
    tier: 'etched',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => manualComplete(s, 'unit04')
  },
  {
    id: 'ember_surveyed',
    name: 'Ember Reach Surveyed',
    line: 'Completed every built bench across the volcanic caldera of Ember Reach.',
    tier: 'etched',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => {
      if (!s.learn) return false;
      const q = (getWorld('unit05')?.quests || []).filter(x => x.status === 'live' && x.arena !== 'boss').map(x => x.id);
      return q.length > 0 && q.every(id => Boolean(s.learn[`unit05/${id}`]?.completedAt));
    }
  },
  {
    id: 'ember_practice',
    name: 'Calorimeter Drills',
    line: 'Worked through the revision problem set on Ember Reach.',
    tier: 'painted',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => Boolean(s.flags && s.flags.unit05_practice_done)
  },
  {
    id: 'manual_unit05',
    name: 'Unit 5 Field Log',
    line: 'Logged every vocabulary term across Ember Reach.',
    tier: 'etched',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => manualComplete(s, 'unit05')
  },

  // ===================== DRILL DECK =====================
  // Cosmetic only, like every plate here: a drill pays no XP and never reaches Standings.
  {
    id: 'first_drill',
    name: 'Warm-Up',
    line: 'Finished a round in the Drill Deck.',
    tier: 'painted',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => practiceFacts(s.practice).runs >= 1
  },
  {
    id: 'drill_perfect',
    name: 'Clean Sheet',
    line: 'Earned three stars on a ten-question run.',
    tier: 'brass',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => practiceFacts(s.practice).perfectRun
  },
  {
    id: 'drill_streak_7',
    name: 'Weekly Discipline',
    line: 'Finished a drill in four weeks in a row.',
    tier: 'brass',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => practiceFacts(s.practice).streak >= 4
  },
  {
    id: 'drill_sprint_15',
    name: 'Quick Hands',
    line: 'Answered fifteen questions correctly in one timed round.',
    tier: 'brass',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => practiceFacts(s.practice).bestSprint >= 15
  },
  {
    id: 'drill_gold_world',
    name: 'Gold Standard',
    line: 'Mastered nine in ten of the questions from a single world.',
    tier: 'etched',
    road: 'learn',
    hidden: false,
    earnedBy: (s) => practiceFacts(s.practice).goldWorld
  },

  // ===================== CREW =====================
  {
    id: 'guild_joined',
    name: 'Sworn Crew',
    line: 'Signed on with one of the four salvage guilds.',
    tier: 'painted',
    road: 'crew',
    hidden: false,
    earnedBy: (s) => Boolean(s.teamId || s.team_id || s.player?.team_id)
  },
  {
    id: 'ship_walked',
    name: 'Deck Walker',
    line: 'Visited every compartment aboard the Avalon.',
    tier: 'brass',
    road: 'crew',
    hidden: false,
    earnedBy: (s) => Boolean(s.flags && s.flags.walked_all_rooms)
  },
  {
    id: 'suit_customized',
    name: 'Fitted Out',
    line: 'Equipped custom suit gear in your quarters.',
    tier: 'painted',
    road: 'crew',
    hidden: false,
    earnedBy: (s) => Boolean(s.flags && s.flags.suit_customized)
  },
  {
    id: 'role_chosen',
    name: 'Duty Assigned',
    line: 'Selected an operational specialty aboard ship.',
    tier: 'painted',
    road: 'crew',
    hidden: false,
    earnedBy: (s) => Boolean(s.role || s.player?.role)
  },
  {
    id: 'tallow_hidden_1',
    name: 'Turned Bearing',
    line: 'Inspected the idle drive shaft behind the refinery.',
    tier: 'brass',
    road: 'crew',
    hidden: true,
    clue: 'Something on Tallow is still turning.',
    earnedBy: (s) => Boolean(s.flags && s.flags.found_tallow_spindle)
  },
  {
    id: 'tallow_hidden_2',
    name: 'Salt Stencil',
    line: 'Found the old surveyor mark on the eastern lip.',
    tier: 'brass',
    road: 'crew',
    hidden: true,
    clue: 'A painted numeral fades against the salt.',
    earnedBy: (s) => Boolean(s.flags && s.flags.found_tallow_marker)
  },
  {
    id: 'ligar_hidden_1',
    name: 'Basalt Echo',
    line: 'Discovered the discarded amplifier deep in the quarry cut.',
    tier: 'brass',
    road: 'crew',
    hidden: true,
    clue: 'A cold tube sits unlit under the quarry arch.',
    earnedBy: (s) => Boolean(s.flags && s.flags.found_ligar_tube)
  },
  {
    id: 'ship_hidden_1',
    name: 'Furnace Grate',
    line: 'Examined the inspection stamp on the firebox door.',
    tier: 'brass',
    road: 'crew',
    hidden: true,
    clue: 'Old heat lingers behind the boiler.',
    earnedBy: (s) => Boolean(s.flags && s.flags.found_ship_firebox)
  },

  // ===================== SEASON =====================
  {
    id: 'watch_4',
    name: 'Fourth Watch',
    line: 'Stood active watch for four calendar weeks.',
    tier: 'painted',
    road: 'season',
    hidden: false,
    earnedBy: (s) => (s.watchCount || 0) >= 4
  },
  {
    id: 'watch_8',
    name: 'Eighth Watch',
    line: 'Stood active watch for eight calendar weeks.',
    tier: 'brass',
    road: 'season',
    hidden: false,
    earnedBy: (s) => (s.watchCount || 0) >= 8
  },
  {
    id: 'watch_12',
    name: 'Twelfth Watch',
    line: 'Stood active watch for twelve calendar weeks.',
    tier: 'etched',
    road: 'season',
    hidden: false,
    earnedBy: (s) => (s.watchCount || 0) >= 12
  },
  {
    id: 'contract_completed',
    name: 'Contract Fulfilled',
    line: 'Contributed to a completed weekly guild contract.',
    tier: 'brass',
    road: 'season',
    hidden: false,
    earnedBy: (s) => Boolean(s.flags && s.flags.contract_contributed)
  },
  {
    id: 'contract_three',
    name: 'Contractor',
    line: 'Helped your guild complete three weekly contracts.',
    tier: 'etched',
    road: 'season',
    hidden: false,
    earnedBy: (s) => (s.contractsCompletedCount || 0) >= 3
  },

  // ===================== CRAFT =====================
  {
    id: 'first_salvage',
    name: 'Scavenger',
    title: 'Scavenger',
    line: 'Recovered your first piece of expedition salvage.',
    tier: 'painted',
    road: 'craft',
    icon: '⚙',
    hidden: false,
    earnedBy: (s) => (s.inventory && s.inventory.some(i => String(i.item_id).startsWith('salvage_'))) || (s.progress && s.progress.some(p => p.items_awarded))
  },
  {
    id: 'finish_equipped',
    name: 'Custom Fit',
    title: 'Custom Fit',
    line: 'Equipped a custom plate finish in the Locker.',
    tier: 'brass',
    road: 'craft',
    icon: '✦',
    hidden: false,
    earnedBy: (s) => s.loadout && s.loadout.nameplate && s.loadout.nameplate !== 'default'
  },
  {
    id: 'clean_salvage',
    name: 'Precision Recovery',
    title: 'Precision Recovery',
    line: 'Recovered salvage from five clean expedition stages.',
    tier: 'etched',
    road: 'craft',
    icon: '★',
    hidden: false,
    earnedBy: (s) => (s.cleanStagesCount || (s.cleanStages ? s.cleanStages.length : 0)) >= 5
  }
];

// Ensure title, icon, and lore properties on every commendation for UI compatibility
COMMENDATIONS.forEach(c => {
  if (!c.title) c.title = c.name;
  if (!c.lore) c.lore = c.line;
  if (!c.icon) {
    c.icon = c.tier === 'etched' ? '★' : (c.tier === 'brass' ? '✦' : '◆');
  }
});

export const ALL_COMMENDATIONS = COMMENDATIONS;
export const COMMENDATION_MAP = new Map(COMMENDATIONS.map(c => [c.id, c]));
export const COMMENDATIONS_BY_ID = Object.fromEntries(COMMENDATIONS.map(c => [c.id, c]));

/**
 * Returns all commendations earned by given state.
 * @param {object} state
 * @returns {typeof COMMENDATIONS}
 */
export function evaluateCommendations(state = {}) {
  return COMMENDATIONS.filter(c => {
    try {
      return Boolean(c.earnedBy(state));
    } catch (e) {
      return false;
    }
  });
}
