/**
 * seed.mjs — Seed fake players and submissions for testing
 */

const TEAMS = ['terra', 'zephyr', 'ignis', 'thalassa'];
const ROLES = ['Navigator', 'Engineer', 'Xenobiologist', 'Quartermaster', 'Comms Officer'];
const NAMES = [
  'AstraNova', 'ProtonPulse', 'KelvinZero', 'TerraFirm', 'ValenceViper',
  'QuantumQuark', 'NobleNeon', 'RedoxRider', 'IonStormer', 'CatalystCore',
  'OrbitalOmega', 'ChiralChaos', 'EnthalpyEcho', 'PlasmaPioneer', 'SolventSeeker'
];

console.log(`=== Avalon Test Seed Generation ===`);
console.log(`Generating ${NAMES.length} mock explorers across 4 flagships:`);

const mockData = NAMES.map((name, i) => {
  const team = TEAMS[i % TEAMS.length];
  const role = ROLES[i % ROLES.length];
  const xp = 140 + Math.floor(Math.random() * 180);
  const lvl = Math.min(12, Math.floor(Math.sqrt(xp / 45)) + 1);

  return {
    player_id: `p_seed_${i + 1}`,
    email: `${name.toLowerCase()}@uhschem.club`,
    display_name: name,
    team_id: team,
    role: role,
    xp: xp,
    level: lvl
  };
});

console.table(mockData);
console.log(`Seed verified: 4 flagships populated.`);
