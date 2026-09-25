/**
 * field-manual.js — The Field Manual: vocabulary as a collection.
 * Pure data registry of earned terms, status computation, and 2D overlay component.
 */

import { esc } from './layout.js';

export const FIELD_MANUAL_TERMS = [
  // --- Campaign (Charge Gardens of Erebus) ---
  {
    id: 'camp_0',
    term: 'Electron',
    road: 'campaign',
    stageLabel: 'Pylon 1',
    stageIndex: 0,
    route: '#/quest',
    title: 'Electrons Move, Bonds Form',
    body: 'The negative region carries mobile electrons that flow toward the electron-poor positive center to forge a covalent bond.'
  },
  {
    id: 'camp_1',
    term: 'Displacement',
    road: 'campaign',
    stageLabel: 'Pylon 2',
    stageIndex: 1,
    route: '#/quest',
    title: 'Nucleophilic Displacement',
    body: 'An incoming group with lone-pair density attacks a saturated center, displacing the attached leaving group.'
  },
  {
    id: 'camp_2',
    term: 'Nucleophile & Electrophile',
    road: 'campaign',
    stageLabel: 'Pylon 3',
    stageIndex: 2,
    route: '#/quest',
    title: 'Charges and Affinity',
    body: 'A nucleophile seeks a positive center to share electrons; an electrophile accepts electron density to complete its shell.'
  },
  {
    id: 'camp_3',
    term: 'Steric Hindrance',
    road: 'campaign',
    stageLabel: 'Pylon 4',
    stageIndex: 3,
    route: '#/quest',
    title: 'Spatial Crowding',
    body: 'Bulky substituents surrounding a reactive carbon hinder incoming trajectory and dictate reaction rate.'
  },
  {
    id: 'camp_4',
    term: 'Regioselectivity',
    road: 'campaign',
    stageLabel: 'Pylon 5',
    stageIndex: 4,
    route: '#/quest',
    title: 'Steric Pathway Selection',
    body: 'When multiple electrophilic sites are accessible, attack occurs selectively at the least sterically hindered position.'
  },
  {
    id: 'camp_5',
    term: 'Carbocation',
    road: 'campaign',
    stageLabel: 'Pylon 6',
    stageIndex: 5,
    route: '#/quest',
    title: 'Trivalent Carbon Intermediate',
    body: 'A positively charged carbon with six valence electrons that acts as a powerful electrophile.'
  },
  {
    id: 'camp_6',
    term: 'Proton Transfer',
    road: 'campaign',
    stageLabel: 'Pylon 7',
    stageIndex: 6,
    route: '#/quest',
    title: 'Brønsted Acid-Base Relay',
    body: 'A hydrogen ion moves between basic and acidic sites, establishing rapid thermodynamic equilibrium.'
  },
  {
    id: 'camp_10',
    term: 'SN2 Mechanism',
    road: 'campaign',
    stageLabel: 'Pylon 11',
    stageIndex: 10,
    route: '#/quest',
    title: 'Bimolecular Substitution',
    body: 'A concerted backside displacement where bond formation and bond cleavage occur simultaneously.'
  },
  {
    id: 'camp_18',
    term: 'SN1 Mechanism',
    road: 'campaign',
    stageLabel: 'Pylon 19',
    stageIndex: 18,
    route: '#/quest',
    title: 'Stepwise Dissociation',
    body: 'Rate-determining departure of the leaving group yields a planar carbocation, followed by rapid nucleophilic capture.'
  },

  // --- Learn Unit 1: Tallow (Atoms, Elements, Core) ---
  {
    id: 'u1_atom',
    term: 'Atom',
    road: 'unit01',
    questKey: 'unit01/q1-grain',
    stageLabel: 'Bench 1, Stage 1',
    stageIndex: 0,
    route: '#/learn/unit01/q1-grain',
    title: 'The Discrete Floor of Matter',
    body: 'The indivisible building block of ordinary matter, retaining chemical identity.'
  },
  {
    id: 'u1_element',
    term: 'Element',
    road: 'unit01',
    questKey: 'unit01/q1-grain',
    stageLabel: 'Bench 1, Stage 2',
    stageIndex: 1,
    route: '#/learn/unit01/q1-grain',
    title: 'Single-Kind Substance',
    body: 'A pure chemical substance composed entirely of atoms having the same atomic number.'
  },
  {
    id: 'u1_mixture',
    term: 'Mixture',
    road: 'unit01',
    questKey: 'unit01/q1-grain',
    stageLabel: 'Bench 1, Stage 2',
    stageIndex: 1,
    route: '#/learn/unit01/q1-grain',
    title: 'Physical Combination',
    body: 'Two or more distinct substances mingled without forming chemical bonds, separable by physical means.'
  },
  {
    id: 'u1_molecule',
    term: 'Molecule',
    road: 'unit01',
    questKey: 'unit01/q1-grain',
    stageLabel: 'Bench 1, Stage 5',
    stageIndex: 4,
    route: '#/learn/unit01/q1-grain',
    title: 'Bonded Atomic Cluster',
    body: 'An electrically neutral group of two or more atoms held together by covalent chemical bonds.'
  },
  {
    id: 'u1_compound',
    term: 'Compound',
    road: 'unit01',
    questKey: 'unit01/q1-grain',
    stageLabel: 'Bench 1, Stage 6',
    stageIndex: 5,
    route: '#/learn/unit01/q1-grain',
    title: 'Fixed Stoichiometric Substance',
    body: 'A chemical substance composed of atoms from two or more elements joined in fixed proportions.'
  },
  {
    id: 'u1_nucleus',
    term: 'Nucleus',
    road: 'unit01',
    questKey: 'unit01/q2-core',
    stageLabel: 'Bench 2, Stage 1',
    stageIndex: 0,
    route: '#/learn/unit01/q2-core',
    title: 'Dense Atomic Center',
    body: 'The small, heavy, positively charged core of an atom containing protons and neutrons.'
  },
  {
    id: 'u1_proton',
    term: 'Proton',
    road: 'unit01',
    questKey: 'unit01/q2-core',
    stageLabel: 'Bench 2, Stage 2',
    stageIndex: 1,
    route: '#/learn/unit01/q2-core',
    title: 'Positive Nuclear Grain',
    body: 'A subatomic particle bearing a positive unit charge, defining the elemental identity of the atom.'
  },
  {
    id: 'u1_neutron',
    term: 'Neutron',
    road: 'unit01',
    questKey: 'unit01/q2-core',
    stageLabel: 'Bench 2, Stage 2',
    stageIndex: 1,
    route: '#/learn/unit01/q2-core',
    title: 'Neutral Nuclear Mass',
    body: 'An uncharged subatomic particle present in atomic nuclei, contributing mass without changing charge.'
  },
  {
    id: 'u1_shell',
    term: 'Electron Shell',
    road: 'unit01',
    questKey: 'unit01/q2-core',
    stageLabel: 'Bench 2, Stage 4',
    stageIndex: 3,
    route: '#/learn/unit01/q2-core',
    title: 'Quantized Orbit Levels',
    body: 'Concentric energy levels surrounding the nucleus populated by orbiting electrons.'
  },
  {
    id: 'u1_valence',
    term: 'Valence Electron',
    road: 'unit01',
    questKey: 'unit01/q2-core',
    stageLabel: 'Bench 2, Stage 5',
    stageIndex: 4,
    route: '#/learn/unit01/q2-core',
    title: 'Outermost Reactive Shell',
    body: 'Electrons in the outermost shell that participate in chemical bond formation.'
  },
  {
    id: 'u1_isotope',
    term: 'Isotope',
    road: 'unit01',
    questKey: 'unit01/q2-core',
    stageLabel: 'Bench 2, Stage 6',
    stageIndex: 5,
    route: '#/learn/unit01/q2-core',
    title: 'Varying Neutron Count',
    body: 'Forms of the same chemical element having identical proton counts but different mass numbers.'
  },
  {
    id: 'u1_ion',
    term: 'Ion',
    road: 'unit01',
    questKey: 'unit01/q2-core',
    stageLabel: 'Bench 2, Stage 7',
    stageIndex: 6,
    route: '#/learn/unit01/q2-core',
    title: 'Charged Particle',
    body: 'An atom or group of atoms that has gained or lost one or more valence electrons, carrying a net electric charge.'
  },

  // --- Learn Unit 2: Ligar (Bonds, Lattices, Moles) ---
  {
    id: 'u2_bond',
    term: 'Chemical Bond',
    road: 'unit02',
    questKey: 'unit02/q1-joins',
    stageLabel: 'Bench 1, Stage 1',
    stageIndex: 0,
    route: '#/learn/unit02/q1-joins',
    title: 'Attractive Force',
    body: 'An enduring attractive interaction between atoms, ions, or molecules enabling formation of chemical compounds.'
  },
  {
    id: 'u2_covalent',
    term: 'Covalent Bond',
    road: 'unit02',
    questKey: 'unit02/q1-joins',
    stageLabel: 'Bench 1, Stage 2',
    stageIndex: 1,
    route: '#/learn/unit02/q1-joins',
    title: 'Shared Electron Pair',
    body: 'A chemical linkage formed by the mutual sharing of one or more pairs of electrons between atoms.'
  },
  {
    id: 'u2_ionic',
    term: 'Ionic Bond',
    road: 'unit02',
    questKey: 'unit02/q1-joins',
    stageLabel: 'Bench 1, Stage 4',
    stageIndex: 3,
    route: '#/learn/unit02/q1-joins',
    title: 'Electrostatic Attraction',
    body: 'A chemical bond formed through electrostatic attraction between oppositely charged ions.'
  },
  {
    id: 'u2_lattice',
    term: 'Crystal Lattice',
    road: 'unit02',
    questKey: 'unit02/q2-lattice',
    stageLabel: 'Bench 2, Stage 1',
    stageIndex: 0,
    route: '#/learn/unit02/q2-lattice',
    title: 'Ordered 3D Framework',
    body: 'A symmetrical, repeating three-dimensional arrangement of atoms, ions, or molecules in a crystalline solid.'
  },
  {
    id: 'u2_mole',
    term: 'The Mole',
    road: 'unit02',
    questKey: 'unit02/q4-weigh',
    stageLabel: 'Bench 4, Stage 1',
    stageIndex: 0,
    route: '#/learn/unit02/q4-weigh',
    title: 'Counting by Mass',
    body: 'The SI unit of amount of substance containing exactly 6.02214076 × 10²³ elementary entities.'
  }
];

/**
 * Checks whether a term is earned based on session state.
 */
export function isTermEarned(term, sessionState = {}) {
  if (term.road === 'campaign') {
    const q1Prog = (sessionState.progress || []).find(p => p.quest_id === 'q1');
    const reached = q1Prog ? Number(q1Prog.stage_reached || 0) : 0;
    return reached > term.stageIndex;
  }
  if (term.questKey && sessionState.learn) {
    const rec = sessionState.learn[term.questKey];
    if (!rec) return false;
    if (rec.completedAt) return true;
    return Array.isArray(rec.stages) && rec.stages.includes(term.stageIndex);
  }
  return false;
}

/**
 * Computes logged term stats for the player.
 */
export function getFieldManualStats(sessionState = {}) {
  let earnedCount = 0;
  const byRoad = {
    campaign: { total: 0, earned: 0 },
    unit01: { total: 0, earned: 0 },
    unit02: { total: 0, earned: 0 }
  };

  for (const t of FIELD_MANUAL_TERMS) {
    const r = byRoad[t.road] || byRoad.campaign;
    r.total++;
    if (isTermEarned(t, sessionState)) {
      earnedCount++;
      r.earned++;
    }
  }

  return {
    total: FIELD_MANUAL_TERMS.length,
    earned: earnedCount,
    byRoad
  };
}

/**
 * Renders the Field Manual overlay HTML markup.
 */
export function renderFieldManualModal(sessionState = {}, activeFilter = 'all') {
  const stats = getFieldManualStats(sessionState);

  const filtered = FIELD_MANUAL_TERMS.filter(t => {
    if (activeFilter === 'all') return true;
    return t.road === activeFilter;
  });

  return `
    <div class="field-manual-overlay">
      <div class="field-manual-header">
        <div>
          <span class="eyebrow lit" style="color: var(--accent-gold);">FIELD MANUAL</span>
          <h2 class="section-title" style="margin: 2px 0 0;">Collected Vocabulary</h2>
        </div>
        <div class="stat-tile" style="text-align: right;">
          <div class="stat-label">Terms Logged</div>
          <div class="stat-value">${stats.earned} / ${stats.total}</div>
        </div>
      </div>

      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button type="button" class="btn-chip fm-filter-btn ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">All (${stats.earned}/${stats.total})</button>
        <button type="button" class="btn-chip fm-filter-btn ${activeFilter === 'campaign' ? 'active' : ''}" data-filter="campaign">Campaign (${stats.byRoad.campaign.earned}/${stats.byRoad.campaign.total})</button>
        <button type="button" class="btn-chip fm-filter-btn ${activeFilter === 'unit01' ? 'active' : ''}" data-filter="unit01">Tallow (${stats.byRoad.unit01.earned}/${stats.byRoad.unit01.total})</button>
        <button type="button" class="btn-chip fm-filter-btn ${activeFilter === 'unit02' ? 'active' : ''}" data-filter="unit02">Ligar (${stats.byRoad.unit02.earned}/${stats.byRoad.unit02.total})</button>
      </div>

      <div class="field-manual-grid">
        ${filtered.map(t => {
          const earned = isTermEarned(t, sessionState);
          if (!earned) {
            return `
              <div class="field-manual-term-card unearned">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
                  <span class="term-blank"></span>
                  <span class="tag" style="font-size: 0.6rem;">${esc(t.stageLabel)}</span>
                </div>
                <div style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted); font-style: italic;">
                  // Withheld until stage complete
                </div>
              </div>
            `;
          }

          return `
            <div class="field-manual-term-card">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
                <span style="font-family: var(--font-display); font-size: 0.95rem; font-weight: 700; color: var(--accent-amber); letter-spacing: 0.08em; text-transform: uppercase;">
                  ${esc(t.term)}
                </span>
                <span class="tag live" style="font-size: 0.62rem;">${esc(t.stageLabel)}</span>
              </div>
              <div style="font-family: var(--font-mono); font-size: 0.76rem; font-weight: 600; color: var(--text-bright); margin-bottom: 0.3rem;">
                ${esc(t.title)}
              </div>
              <div style="font-family: var(--font-mono); font-size: 0.73rem; color: var(--text-secondary); line-height: 1.45; margin-bottom: 0.75rem;">
                ${esc(t.body)}
              </div>
              <div style="text-align: right;">
                <a href="${t.route}" class="btn-secondary fm-revisit-link" style="font-size: 0.68rem; padding: 4px 10px; text-decoration: none;">
                  Revisit Stage
                </a>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
