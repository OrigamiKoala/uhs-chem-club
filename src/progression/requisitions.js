/**
 * requisitions.js — Registry of quartermaster unlocks (requisitions) and derived ownership.
 * Pure data and pure functions; importable in Node and browser.
 */

export const REQUISITION_KINDS = [
  'visor',
  'suit-stencil',
  'nameplate',
  'title',
  'quarters',
  'holo-theme',
  'privilege'
];

export const REQUISITIONS = [
  // --- Level 1 Initial Commission ---
  {
    id: 'nameplate_default',
    kind: 'nameplate',
    name: 'Standard Durasteel Nameplate',
    line: 'Standard issue durasteel plate for all crew members.',
    finish: 'painted',
    source: { level: 1 },
    tokenColor: 'var(--text-muted)',
    apply: (state) => { state.loadout = state.loadout || {}; state.loadout.nameplate = 'default'; }
  },
  {
    id: 'title_cadet',
    kind: 'title',
    name: 'Cadet',
    line: 'Cadet rank title awarded upon commissioning.',
    finish: 'painted',
    source: { level: 1 },
    tokenColor: 'var(--text-muted)',
    apply: (state) => { state.loadout = state.loadout || {}; state.loadout.title = 'Cadet'; }
  },

  // --- Level-gated Requisitions (Levels 2-12 each issue at least one) ---
  {
    id: 'visor_smoked',
    kind: 'visor',
    name: 'Smoked Glass Visor',
    line: 'Dark-tinted polarized visor for harsh glare.',
    finish: 'painted',
    source: { level: 2 },
    tokenColor: 'var(--plate-300)',
    apply: (state) => { state.loadout = state.loadout || {}; state.loadout.visor = 'smoked'; }
  },
  {
    id: 'privilege_holo_memory',
    kind: 'privilege',
    name: 'Holo Memory',
    line: 'The bridge tactical console remembers your last active tab.',
    finish: 'brass',
    source: { level: 3 },
    tokenColor: 'var(--accent-amber)',
    apply: (state) => { state.privileges = state.privileges || {}; state.privileges.holo_memory = true; }
  },
  {
    id: 'nameplate_brass',
    kind: 'nameplate',
    name: 'Stamped Brass Nameplate',
    line: 'Heavy machined brass frame for your crew identification.',
    finish: 'brass',
    source: { level: 4 },
    tokenColor: 'var(--accent-gold)',
    apply: (state) => { state.loadout = state.loadout || {}; state.loadout.nameplate = 'brass'; }
  },
  {
    id: 'visor_brass',
    kind: 'visor',
    name: 'Polished Brass Visor',
    line: 'High-vacuum gold-brass sputtered faceplate coating.',
    finish: 'brass',
    source: { level: 5 },
    tokenColor: 'var(--accent-gold)',
    apply: (state) => { state.loadout = state.loadout || {}; state.loadout.visor = 'brass'; }
  },
  {
    id: 'privilege_survey_beacon',
    kind: 'privilege',
    name: 'Survey Beacon',
    line: 'Fast travel to any completed instrument bench across Learn worlds.',
    finish: 'brass',
    source: { level: 6 },
    tokenColor: 'var(--accent-green)',
    apply: (state) => { state.privileges = state.privileges || {}; state.privileges.survey_beacon = true; }
  },
  {
    id: 'stencil_hazard',
    kind: 'suit-stencil',
    name: 'Hazard Stripe Stencil',
    line: 'Industrial caution chevrons across the suit shoulder plates.',
    finish: 'painted',
    source: { level: 7 },
    tokenColor: 'var(--accent-amber)',
    apply: (state) => { state.loadout = state.loadout || {}; state.loadout.stencil = 'hazard'; }
  },
  {
    id: 'quarters_lamp_filament',
    kind: 'quarters',
    name: 'Amber Filament Lamp',
    line: 'Warm carbon filament desk lantern for your quarters.',
    finish: 'brass',
    source: { level: 8 },
    tokenColor: 'var(--accent-amber)',
    apply: (state) => { state.quarters = state.quarters || {}; state.quarters.lamp = 'amber'; }
  },
  {
    id: 'privilege_recall',
    kind: 'privilege',
    name: 'Direct Recall',
    line: 'Emergency transponder patch back to the Avalon from any world.',
    finish: 'etched',
    source: { level: 9 },
    tokenColor: 'var(--accent-blue)',
    apply: (state) => { state.privileges = state.privileges || {}; state.privileges.recall = true; }
  },
  {
    id: 'nameplate_etched',
    kind: 'nameplate',
    name: 'Acid-Etched Nameplate',
    line: 'Deep chemical relief border on tempered alloy plate.',
    finish: 'etched',
    source: { level: 10 },
    tokenColor: 'var(--accent-silver)',
    apply: (state) => { state.loadout = state.loadout || {}; state.loadout.nameplate = 'etched'; }
  },
  {
    id: 'holo_amber',
    kind: 'holo-theme',
    name: 'Amber Phosphor Grid',
    line: 'Long-persistence amber oscilloscope vector theme for bridge holos.',
    finish: 'brass',
    source: { level: 11 },
    tokenColor: 'var(--accent-amber)',
    apply: (state) => { state.holo = state.holo || {}; state.holo.theme = 'amber'; }
  },
  {
    id: 'title_starmarshal',
    kind: 'title',
    name: 'Starmarshal',
    line: 'Senior officer insignia worn under your crew name.',
    finish: 'etched',
    source: { level: 12 },
    tokenColor: 'var(--accent-gold)',
    apply: (state) => { state.loadout = state.loadout || {}; state.loadout.title = 'Starmarshal'; }
  },

  // --- Commendation-gated Requisitions ---
  {
    id: 'visor_oxidised',
    kind: 'visor',
    name: 'Oxidized Copper Visor',
    line: 'Verdigris-finished reflective faceplate hardened by atmospheric exposure.',
    finish: 'brass',
    source: { commendation: 'pylons_20' },
    tokenColor: 'var(--accent-copper)',
    apply: (state) => { state.loadout = state.loadout || {}; state.loadout.visor = 'oxidised'; }
  },
  {
    id: 'visor_salt_bleached',
    kind: 'visor',
    name: 'Salt-Bleached Visor',
    line: 'Mineral-cured optical surface from the salt flats of Tallow.',
    finish: 'painted',
    source: { commendation: 'tallow_surveyed' },
    tokenColor: 'var(--plate-100)',
    apply: (state) => { state.loadout = state.loadout || {}; state.loadout.visor = 'salt_bleached'; }
  },
  {
    id: 'visor_basalt_black',
    kind: 'visor',
    name: 'Basalt Black Visor',
    line: 'Obsidian-coated tinted shield tempered in the quarry of Ligar.',
    finish: 'etched',
    source: { commendation: 'ligar_surveyed' },
    tokenColor: 'var(--plate-400)',
    apply: (state) => { state.loadout = state.loadout || {}; state.loadout.visor = 'basalt_black'; }
  },
  {
    id: 'stencil_pylon_tally',
    kind: 'suit-stencil',
    name: 'Pylon Tally Stencil',
    line: 'Twenty-hash inspection tally stencilled across the breastplate.',
    finish: 'etched',
    source: { commendation: 'clean_streak_10' },
    tokenColor: 'var(--accent-gold)',
    apply: (state) => { state.loadout = state.loadout || {}; state.loadout.stencil = 'pylon_tally'; }
  },
  {
    id: 'stencil_guild_sigil',
    kind: 'suit-stencil',
    name: 'Guild Sigil Variant',
    line: 'High-contrast quartermaster issue stamp of your guild crest.',
    finish: 'painted',
    source: { commendation: 'guild_joined' },
    tokenColor: 'var(--accent-amber)',
    apply: (state) => { state.loadout = state.loadout || {}; state.loadout.stencil = 'guild_sigil'; }
  },
  {
    id: 'stencil_survey_mark',
    kind: 'suit-stencil',
    name: 'Survey Benchmark',
    line: 'Planetary survey triangulation mark stencilled in weather-resistant enamel.',
    finish: 'brass',
    source: { commendation: 'manual_unit01' },
    tokenColor: 'var(--accent-green)',
    apply: (state) => { state.loadout = state.loadout || {}; state.loadout.stencil = 'survey_mark'; }
  },
  {
    id: 'nameplate_riveted',
    kind: 'nameplate',
    name: 'Riveted Iron Nameplate',
    line: 'Heavy plate secured with eight counter-sunk boiler rivets.',
    finish: 'painted',
    source: { commendation: 'craft_t1' },
    tokenColor: 'var(--border-durasteel)',
    apply: (state) => { state.loadout = state.loadout || {}; state.loadout.nameplate = 'riveted'; }
  },
  {
    id: 'title_pylon_warden',
    kind: 'title',
    name: 'Pylon Warden',
    line: 'Granted to those who brought light back to the Charge Gardens.',
    finish: 'etched',
    source: { commendation: 'pylons_20' },
    tokenColor: 'var(--accent-gold)',
    apply: (state) => { state.loadout = state.loadout || {}; state.loadout.title = 'Pylon Warden'; }
  },
  {
    id: 'title_salt_walker',
    kind: 'title',
    name: 'Salt Walker',
    line: 'Granted to surveyors who completed all five stations on Tallow.',
    finish: 'brass',
    source: { commendation: 'tallow_surveyed' },
    tokenColor: 'var(--accent-amber)',
    apply: (state) => { state.loadout = state.loadout || {}; state.loadout.title = 'Salt Walker'; }
  },
  {
    id: 'title_rock_splitter',
    kind: 'title',
    name: 'Rock Splitter',
    line: 'Granted to surveyors who mastered the basalt benches of Ligar.',
    finish: 'brass',
    source: { commendation: 'ligar_surveyed' },
    tokenColor: 'var(--accent-gold)',
    apply: (state) => { state.loadout = state.loadout || {}; state.loadout.title = 'Rock Splitter'; }
  },
  {
    id: 'title_sharp_eye',
    kind: 'title',
    name: 'Sharp Eye',
    line: 'Awarded for thorough scanning before touching any controls.',
    finish: 'painted',
    source: { commendation: 'craft_scanned_all' },
    tokenColor: 'var(--accent-silver)',
    apply: (state) => { state.loadout = state.loadout || {}; state.loadout.title = 'Sharp Eye'; }
  },
  {
    id: 'quarters_insulator',
    kind: 'quarters',
    name: 'Pylon Insulator Relic',
    line: 'Ceramic high-voltage spool recovered from an offline pylon.',
    finish: 'painted',
    source: { commendation: 'first_pylon' },
    tokenColor: 'var(--plate-200)',
    apply: (state) => { state.quarters = state.quarters || {}; state.quarters.shelf_insulator = true; }
  },
  {
    id: 'quarters_tallow_jar',
    kind: 'quarters',
    name: 'Tallow Specimen Jar',
    line: 'Sealed glass cylinder of coarse sodium chloride precipitate.',
    finish: 'brass',
    source: { commendation: 'tallow_surveyed' },
    tokenColor: 'var(--accent-gold)',
    apply: (state) => { state.quarters = state.quarters || {}; state.quarters.jar_tallow = true; }
  },
  {
    id: 'quarters_ligar_jar',
    kind: 'quarters',
    name: 'Ligar Specimen Jar',
    line: 'Glass ampoule holding powdered basalt and crushed olivine.',
    finish: 'brass',
    source: { commendation: 'ligar_surveyed' },
    tokenColor: 'var(--accent-copper)',
    apply: (state) => { state.quarters = state.quarters || {}; state.quarters.jar_ligar = true; }
  },
  {
    id: 'privilege_comms_relay',
    kind: 'privilege',
    name: 'Comms Relay Feed',
    line: 'Unlocks real-time guild telemetry and activity log on Comms CRT.',
    finish: 'brass',
    source: { commendation: 'guild_joined' },
    tokenColor: 'var(--accent-gold)',
    apply: (state) => { state.privileges = state.privileges || {}; state.privileges.comms_relay = true; }
  }
];

// Normalize properties for UI and test compatibility
REQUISITIONS.forEach(r => {
  if (r.source && r.source.level !== undefined && r.level === undefined) {
    r.level = r.source.level;
  }
  if (!r.label) r.label = r.name;
});

export const REQUISITION_TABLE = REQUISITIONS;
export const HELD_KINDS = REQUISITION_KINDS;
export const REQUISITION_MAP = new Map(REQUISITIONS.map(r => [r.id, r]));

/**
 * Returns all requisitions held by the player, derived from their level and earned commendations.
 * @param {number|{ level?: number, commendations?: string[]|Set<string> }} stateOrLevel
 * @returns {typeof REQUISITIONS}
 */
export function heldRequisitions(stateOrLevel = {}) {
  const state = typeof stateOrLevel === 'number' ? { level: stateOrLevel } : (stateOrLevel || {});
  const lvl = Number(state.level || 1);
  const commsSet = state.commendations instanceof Set
    ? state.commendations
    : new Set(Array.isArray(state.commendations) ? state.commendations : []);

  return REQUISITIONS.filter(req => {
    if (req.source?.level !== undefined) {
      return lvl >= req.source.level;
    }
    if (req.source?.commendation !== undefined) {
      return commsSet.has(req.source.commendation);
    }
    return false;
  });
}

/**
 * Finds next level-based unlock preview for the player's current level.
 */
export function nextLevelRequisition(currentLevel) {
  const nextLvl = Number(currentLevel || 1) + 1;
  return REQUISITIONS.find(r => r.source?.level === nextLvl) || null;
}
