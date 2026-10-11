/**
 * story-modal.js — Storyline onboarding and sector briefing modals.
 *
 * Provides:
 *   - openWorldStoryModal(world, opts): Diegetic world mission briefing modal.
 *     Automatically triggered on first visit to a world, and re-opened via the
 *     "Storyline" button on the HUD or world overview.
 *   - openCampaignStoryModal(opts): Full campaign storyline onboarding modal
 *     covering the Quad-Guild Truce, the Avalon, living spoil, and the chemistry
 *     detective kit.
 */

import { showModal, closeModal } from '../ui/modal.js';
import { createTransmissionElement } from '../ui/transmission.js';
import { soundscape } from '../audio/soundscape.js';
import { getEpisode, getAct, ACTS } from './saga.js';
import { session } from '../session.js';
import { esc } from '../ui/layout.js';

/**
 * Open the mission briefing modal for a specific Learn world.
 * @param {object|string} worldOrId
 * @param {{ onClose?: Function }} opts
 */
export function openWorldStoryModal(worldOrId, opts = {}) {
  const worldId = typeof worldOrId === 'string' ? worldOrId : worldOrId?.id;
  const episode = getEpisode(worldId) || {
    worldId,
    worldName: typeof worldOrId === 'object' ? worldOrId.world : worldId,
    act: 'act1',
    arrival: 'Sensor telemetry active across the sector. Survey benches ready for deployment.',
    closing: 'Sector survey logged in the ledger. Telematic data filed to the Avalon.',
    spoilFamily: 'Anomalous spoil',
    incident: 'Extraction installations have reported erratic automated behavior and unchartered mineral movements.',
    objective: 'Apply the chemical principles of this unit across the benches to neutralize anomalies and recover forensic evidence.',
    caseFileNote: 'Every reading logged here adds to the ongoing investigation into the ghost charter on the rim.'
  };

  const act = getAct(episode.act) || ACTS[0];
  const worldName = episode.worldName || (typeof worldOrId === 'object' ? worldOrId.world : worldId);
  const worldTitle = typeof worldOrId === 'object' ? worldOrId.title : 'Sector Survey';
  const worldUnit = typeof worldOrId === 'object' ? worldOrId.unit : 'Unit';

  session.setFlag(`story_world_seen_${worldId}`, true);

  let activeTab = 'sector'; // 'sector' | 'campaign'
  let transmissionEl = null;

  function renderModalBody() {
    return `
      <div class="story-briefing-modal" style="max-width: 660px; margin: 0 auto; text-align: left;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.85rem; border-bottom: 1px solid var(--border-durasteel); padding-bottom: 0.6rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 2px;">
              <span class="eyebrow lit" style="color: var(--accent-gold); font-size: 0.68rem; letter-spacing: 0.14em;">${esc(act.title.toUpperCase())} // ${esc(worldUnit.toUpperCase())}</span>
              <span class="tag live" style="font-size: 0.58rem; padding: 1px 6px;">${esc(episode.spoilFamily.toUpperCase())}</span>
            </div>
            <h2 style="font-family: var(--font-imperial); font-size: 1.3rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-bright); margin: 0;">
              ${esc(worldName)} · ${esc(worldTitle)}
            </h2>
          </div>
          <button type="button" id="story-modal-close-x" class="terminal-close-btn" aria-label="Close briefing" style="padding: 4px 10px; font-family: var(--font-mono); font-size: 0.72rem; border: 1px solid var(--border-durasteel); background: transparent; color: var(--text-muted); cursor: pointer;">
            ✕ CLOSE
          </button>
        </div>

        <!-- Mode Toggle Tabs -->
        <div class="map-tabs" role="tablist" style="display: flex; gap: 0.4rem; margin-bottom: 0.9rem;">
          <button type="button" id="tab-btn-sector" class="map-tab btn-secondary ${activeTab === 'sector' ? 'active' : ''}" style="flex: 1; padding: 6px 10px; font-family: var(--font-mono); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em;">
            Sector Dossier · ${esc(worldName)}
          </button>
          <button type="button" id="tab-btn-campaign" class="map-tab btn-secondary ${activeTab === 'campaign' ? 'active' : ''}" style="flex: 1; padding: 6px 10px; font-family: var(--font-mono); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em;">
            Campaign Saga · The Ghost Charter
          </button>
        </div>

        <!-- Content Area -->
        <div id="story-modal-tab-content">
          ${activeTab === 'sector' ? renderSectorTab() : renderCampaignTab()}
        </div>

        <!-- Footer Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.15rem; padding-top: 0.75rem; border-top: 1px solid var(--border-durasteel);">
          <div style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-muted);">
            STATION: SALVAGE HAULER AVALON // TACTICAL COMMS
          </div>
          <button type="button" id="story-modal-dismiss-btn" class="btn-primary" style="padding: 8px 18px; font-size: 0.85rem; letter-spacing: 0.1em;">
            Acknowledge & Deploy ▶
          </button>
        </div>
      </div>
    `;
  }

  function renderSectorTab() {
    return `
      <!-- Transmission CRT Slot -->
      <div id="story-transmission-slot" style="margin-bottom: 0.9rem;"></div>

      <!-- Dossier Intel Grid -->
      <div style="display: grid; grid-template-columns: 1fr; gap: 0.65rem;">
        <!-- Why You Are Here -->
        <div class="holo-card" style="padding: 0.75rem 0.9rem; background: var(--plate-200); border: 1px solid var(--border-durasteel); border-left: 2px solid var(--accent-amber);">
          <div class="eyebrow lit" style="color: var(--accent-amber); font-size: 0.64rem; margin-bottom: 0.25rem; letter-spacing: 0.12em;">
            [ ⚠ SECTOR INCIDENT // WHY YOU ARE HERE ]
          </div>
          <p style="font-family: var(--font-sans); font-size: 0.82rem; line-height: 1.45; color: var(--text-bright); margin: 0;">
            ${esc(episode.incident)}
          </p>
        </div>

        <!-- Your Forensic Objective -->
        <div class="holo-card" style="padding: 0.75rem 0.9rem; background: var(--plate-200); border: 1px solid var(--border-durasteel); border-left: 2px solid var(--accent-gold);">
          <div class="eyebrow lit" style="color: var(--accent-gold); font-size: 0.64rem; margin-bottom: 0.25rem; letter-spacing: 0.12em;">
            [ 🎯 FORENSIC MISSION // YOUR GOAL ]
          </div>
          <p style="font-family: var(--font-sans); font-size: 0.82rem; line-height: 1.45; color: var(--text-bright); margin: 0;">
            ${esc(episode.objective)}
          </p>
        </div>

        <!-- Case File Connection -->
        <div class="holo-card" style="padding: 0.75rem 0.9rem; background: var(--plate-100); border: 1px solid var(--border-durasteel); border-left: 2px solid var(--accent-bronze);">
          <div class="eyebrow" style="color: var(--accent-bronze); font-size: 0.64rem; margin-bottom: 0.25rem; letter-spacing: 0.12em;">
            [ 📂 CASE FILE CONNECTION // THE MYSTERY ]
          </div>
          <p style="font-family: var(--font-mono); font-size: 0.76rem; line-height: 1.45; color: var(--text-secondary); margin: 0;">
            ${esc(episode.caseFileNote)}
          </p>
        </div>
      </div>
    `;
  }

  function renderCampaignTab() {
    return `
      <div style="display: grid; grid-template-columns: 1fr; gap: 0.65rem;">
        <div class="holo-card" style="padding: 0.75rem 0.9rem; background: var(--plate-200); border: 1px solid var(--border-durasteel); border-left: 2px solid var(--accent-amber);">
          <div class="eyebrow lit" style="color: var(--accent-amber); font-size: 0.64rem; margin-bottom: 0.25rem;">
            01 · THE QUAD-GUILD TRUCE & THE AVALON
          </div>
          <p style="font-family: var(--font-sans); font-size: 0.82rem; line-height: 1.45; color: var(--text-bright); margin: 0;">
            Four extractive monopolies divide the rim: Mineral Mining (Earth), Atmospheric Harvesters (Air), Thermal Smelters (Fire), and Moisture Extraction (Water). You are a junior survey hand aboard the forty-year-old salvage hauler <em>Avalon</em>, answering to Quartermaster Vess.
          </p>
        </div>

        <div class="holo-card" style="padding: 0.75rem 0.9rem; background: var(--plate-200); border: 1px solid var(--border-durasteel); border-left: 2px solid var(--accent-gold);">
          <div class="eyebrow lit" style="color: var(--accent-gold); font-size: 0.64rem; margin-bottom: 0.25rem;">
            02 · THE GHOST CHARTER & LIVING SPOIL
          </div>
          <p style="font-family: var(--font-sans); font-size: 0.82rem; line-height: 1.45; color: var(--text-bright); margin: 0;">
            Extraction installations across the frontier are abandoning operations overnight. Slag heaps and mineral tailings are twitching and walking as <strong>living spoil</strong>, while impossible refinery ledgers record mass appearing from nowhere. Mess decks whisper of an unchartered fifth power practicing alchemy.
          </p>
        </div>

        <div class="holo-card" style="padding: 0.75rem 0.9rem; background: var(--plate-200); border: 1px solid var(--border-durasteel); border-left: 2px solid var(--accent-bronze);">
          <div class="eyebrow lit" style="color: var(--accent-bronze); font-size: 0.64rem; margin-bottom: 0.25rem;">
            03 · FORENSIC CHEMISTRY: YOUR DETECTIVE KIT
          </div>
          <p style="font-family: var(--font-sans); font-size: 0.82rem; line-height: 1.45; color: var(--text-bright); margin: 0;">
            Alchemy is physically impossible: chemical reactions strictly conserve mass and combine in discrete integer ratios. Chemistry is your detective kit to dismantle the spoil, prove what is happening, and gather clues in the <strong>Case File</strong> to uncover The Catalyst and the transmutation core on Cinder Halo.
          </p>
        </div>
      </div>
    `;
  }

  function mountTransmission() {
    if (activeTab !== 'sector') return;
    const slot = document.getElementById('story-transmission-slot');
    if (!slot) return;
    if (transmissionEl?.destroy) transmissionEl.destroy();

    transmissionEl = createTransmissionElement({
      speaker: 'VESS // SECTOR DISPATCH',
      badge: `${worldUnit.toUpperCase()} · DISPATCH`,
      subtitle: `${worldName.toUpperCase()} // SECTOR TELEMETRY`,
      text: episode.arrival,
      accentColor: 'var(--accent-amber)',
      speed: 'normal'
    });
    slot.innerHTML = '';
    slot.appendChild(transmissionEl.element);
  }

  function bindEvents() {
    const modalEl = document.getElementById('modal-container');
    if (!modalEl) return;

    modalEl.querySelector('#story-modal-close-x')?.addEventListener('click', () => {
      soundscape.playToggleClack();
      cleanupAndClose();
    });

    modalEl.querySelector('#story-modal-dismiss-btn')?.addEventListener('click', () => {
      soundscape.playBondSnap();
      cleanupAndClose();
    });

    modalEl.querySelector('#tab-btn-sector')?.addEventListener('click', () => {
      if (activeTab === 'sector') return;
      activeTab = 'sector';
      soundscape.playToggleClack();
      refreshModal();
    });

    modalEl.querySelector('#tab-btn-campaign')?.addEventListener('click', () => {
      if (activeTab === 'campaign') return;
      activeTab = 'campaign';
      soundscape.playToggleClack();
      refreshModal();
    });
  }

  function cleanupAndClose() {
    if (transmissionEl?.destroy) transmissionEl.destroy();
    transmissionEl = null;
    closeModal(opts.onClose);
  }

  function refreshModal() {
    const modalContent = document.getElementById('story-modal-tab-content');
    const tabSector = document.getElementById('tab-btn-sector');
    const tabCamp = document.getElementById('tab-btn-campaign');

    if (tabSector && tabCamp) {
      tabSector.classList.toggle('active', activeTab === 'sector');
      tabCamp.classList.toggle('active', activeTab === 'campaign');
    }

    if (modalContent) {
      modalContent.innerHTML = activeTab === 'sector' ? renderSectorTab() : renderCampaignTab();
      if (activeTab === 'sector') {
        mountTransmission();
      } else if (transmissionEl?.destroy) {
        transmissionEl.destroy();
        transmissionEl = null;
      }
    }
  }

  showModal(renderModalBody(), {
    dismissible: true,
    onClose: () => {
      if (transmissionEl?.destroy) transmissionEl.destroy();
      transmissionEl = null;
      if (opts.onClose) opts.onClose();
    }
  });

  mountTransmission();
  bindEvents();
}

/**
 * Open the 4-part campaign storyline onboarding modal (The Ghost Charter & The Avalon).
 * Can be explored after guild selection or reopened anytime from the Bridge or Star Map.
 * @param {{ onComplete?: Function, onClose?: Function }} opts
 */
export function openCampaignStoryModal(opts = {}) {
  let currentSlide = 0;
  let transmissionEl = null;

  const SLIDES = [
    {
      kicker: '01 / 04 · THE QUAD-GUILD TRUCE',
      title: 'Four Monopolies on the Rim',
      speaker: 'VESS // QUARTERMASTER',
      transmission: 'Four Imperial Guilds divide the frontier into extractive monopolies. The Avalon flies between them under an uneasy forty-year truce.',
      bullets: [
        { label: 'Mineral Mining Guild (Earth)', desc: 'Strip-mines iron, heavy silicates, and deep ores from dead asteroids and planetary crusts.' },
        { label: 'Atmospheric Harvesters (Air)', desc: 'Skims toxic gas giant envelopes and turbulent storm basins for noble gases and volatile propellants.' },
        { label: 'Thermal Smelters (Fire)', desc: 'Operates orbital crucibles and geothermal blast-wells that crack crude rock into working alloy.' },
        { label: 'Moisture Extraction (Water)', desc: 'Filters subterranean brine, heavy water, and industrial coolants from desiccated seabeds.' }
      ],
      note: 'Your Station: A junior survey hand aboard the salvage hauler Avalon, maintained by cold rivets, steam lines, and Quartermaster Vess.'
    },
    {
      kicker: '02 / 04 · THE GHOST CHARTER',
      title: 'Living Spoil & Broken Ledgers',
      speaker: 'VESS // QUARTERMASTER',
      transmission: 'Smelters are being abandoned with fireboxes burning. Slag heaps are twitching and walking under their own power across the perimeter.',
      bullets: [
        { label: 'The Fifth Presence', desc: 'Ships flying no imperial guild seal are transmitting on emergency transponder bands dead for thirty seasons.' },
        { label: 'Animated Spoil', desc: 'Refined tailings and mineral waste are crystallizing and crawling under electromagnetic radiation.' },
        { label: 'Impossible Inventories', desc: 'Forward refinery ledgers report output tonnage that exceeds the raw ore fed into the intake hoppers.' },
        { label: 'The Mess Deck Rumor', desc: 'Crews across every rim canteen whisper that an unchartered ghost fleet has discovered alchemy.' }
      ],
      note: 'The Reality: Alchemy is impossible. Ordinary electron chemistry cannot turn salt into heavy metals or create mass from nothing.'
    },
    {
      kicker: '03 / 04 · THE DETECTIVE KIT',
      title: 'Forensic Chemistry as Your Weapon',
      speaker: 'VESS // QUARTERMASTER',
      transmission: 'The chemistry is your detective kit. You do not fight with blasters; you fight by measuring what the laws of matter allow.',
      bullets: [
        { label: 'Definite Proportions & Conservation', desc: 'Every chemical reaction conserves mass and combines in whole-number ratios. An over-mass ledger is not chemistry.' },
        { label: 'Electronic & Molecular Structure', desc: 'Atomic numbers, emission spectra, bond angles, and kinetics explain how matter behaves under load.' },
        { label: 'Neutralizing the Spoil', desc: 'Spoil obeys the laws measured at the bench. A mixture separates; an ionic lattice cleaves; a moth disperses under tuned light.' },
        { label: 'The Case File Dossier', desc: 'Every world yields hard physical clues stored in the Case File terminal aboard the Avalon.' }
      ],
      note: 'Your Mission: Use the lab benches across the 14 worlds to analyze anomalous specimens, dismantle spoil, and document forensic evidence.'
    },
    {
      kicker: '04 / 04 · STANDING ORDERS',
      title: 'The Road Across Fourteen Worlds',
      speaker: 'VESS // QUARTERMASTER',
      transmission: 'Four acts across the rim. Follow the thermal plumes to Cinder Halo and uncover the truth behind the forgotten manifests.',
      bullets: [
        { label: 'Act I: The Charter (Units 1–3)', desc: 'Tallow, Lanternfall, and Ligar: survey mobile spoil, recover unliveried marks, and verify basic elements.' },
        { label: 'Act II: Pressure (Units 4–7)', desc: 'Bellows, Ember Reach, Mirrowen, and Kettle: trace recruitment of active crews and seize the impossible over-mass ledger.' },
        { label: 'Act III: Balance (Units 8–11)', desc: 'Teeter, Verdigris, Brinewire, and Quicklight: restore equilibrium, neutralize acid floods, and uncover the title: The Catalyst.' },
        { label: 'Act IV: The Core (Units 12–14)', desc: 'Lodestone, Thornmere, and Cinder Halo: trace subatomic plumes to the ancient transmutation works.' }
      ],
      note: 'The Reveal: The Fifth are the abandoned crews the Guilds wrote off. By mastering chemistry, you bridge corporate abandonment and justice.'
    }
  ];

  function renderModalBody() {
    const slide = SLIDES[currentSlide];
    const isLast = currentSlide === SLIDES.length - 1;

    return `
      <div class="campaign-story-modal" style="max-width: 680px; margin: 0 auto; text-align: left;">
        <!-- Topbar -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-durasteel); padding-bottom: 0.5rem;">
          <div style="display: flex; align-items: baseline; gap: 0.6rem;">
            <span class="eyebrow lit" style="color: var(--accent-gold); font-size: 0.68rem; letter-spacing: 0.12em;">${esc(slide.kicker)}</span>
            <span style="font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; text-transform: uppercase; color: var(--text-bright);">${esc(slide.title)}</span>
          </div>
          <button type="button" id="campaign-modal-skip-btn" class="eyebrow" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; text-decoration: underline;">
            Skip Briefing
          </button>
        </div>

        <!-- Transmission Slot -->
        <div id="campaign-transmission-slot" style="margin-bottom: 0.85rem;"></div>

        <!-- Bullets Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.6rem; margin-bottom: 0.85rem;">
          ${slide.bullets.map(b => `
            <div class="holo-card" style="padding: 0.65rem 0.8rem; background: var(--plate-200); border: 1px solid var(--border-durasteel);">
              <div style="font-family: var(--font-display); font-size: 0.78rem; font-weight: 700; color: var(--accent-amber); margin-bottom: 0.2rem; text-transform: uppercase; letter-spacing: 0.06em;">
                ${esc(b.label)}
              </div>
              <div style="font-family: var(--font-sans); font-size: 0.78rem; line-height: 1.4; color: var(--text-bright);">
                ${esc(b.desc)}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Callout Note -->
        <div class="holo-card" style="padding: 0.6rem 0.85rem; background: var(--plate-100); border: 1px solid var(--border-durasteel); border-left: 2px solid var(--accent-gold); margin-bottom: 1rem;">
          <div style="font-family: var(--font-mono); font-size: 0.74rem; line-height: 1.45; color: var(--text-bright);">
            ⚡ ${esc(slide.note)}
          </div>
        </div>

        <!-- Slide Navigation Footer -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-durasteel); padding-top: 0.75rem;">
          <!-- Slide Indicator Pips -->
          <div style="display: flex; gap: 0.4rem; align-items: center;">
            ${SLIDES.map((_, i) => `
              <span style="display: inline-block; width: ${i === currentSlide ? '22px' : '8px'}; height: 6px; background: ${i === currentSlide ? 'var(--accent-amber)' : 'var(--border-durasteel)'}; transition: all 0.2s ease;"></span>
            `).join('')}
          </div>

          <div style="display: flex; gap: 0.5rem; align-items: center;">
            ${currentSlide > 0 ? `
              <button type="button" id="campaign-slide-prev" class="btn-secondary" style="padding: 6px 14px; font-size: 0.8rem;">
                ◀ Back
              </button>
            ` : ''}

            <button type="button" id="campaign-slide-next" class="btn-primary" style="padding: 6px 18px; font-size: 0.8rem; letter-spacing: 0.08em;">
              ${isLast ? 'Acknowledge Orders & Disembark ▶' : 'Next Briefing ▶'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function mountTransmission() {
    const slot = document.getElementById('campaign-transmission-slot');
    if (!slot) return;
    if (transmissionEl?.destroy) transmissionEl.destroy();

    const slide = SLIDES[currentSlide];
    transmissionEl = createTransmissionElement({
      speaker: slide.speaker,
      badge: `BRIEFING · ${currentSlide + 1}/4`,
      subtitle: 'STATION: SALVAGE HAULER AVALON // MISSION ORIENTATION',
      text: slide.transmission,
      accentColor: 'var(--accent-amber)',
      speed: 'normal'
    });
    slot.innerHTML = '';
    slot.appendChild(transmissionEl.element);
  }

  function bindEvents() {
    const modalEl = document.getElementById('modal-container');
    if (!modalEl) return;

    modalEl.querySelector('#campaign-modal-skip-btn')?.addEventListener('click', () => {
      soundscape.playToggleClack();
      finish();
    });

    modalEl.querySelector('#campaign-slide-prev')?.addEventListener('click', () => {
      if (currentSlide > 0) {
        currentSlide--;
        soundscape.playToggleClack();
        refresh();
      }
    });

    modalEl.querySelector('#campaign-slide-next')?.addEventListener('click', () => {
      if (currentSlide < SLIDES.length - 1) {
        currentSlide++;
        soundscape.playToggleClack();
        refresh();
      } else {
        soundscape.playBondSnap();
        finish();
      }
    });
  }

  function refresh() {
    const modalEl = document.getElementById('modal-container');
    if (!modalEl) return;
    const card = modalEl.querySelector('.modal-card');
    if (card) {
      card.innerHTML = renderModalBody();
      mountTransmission();
      bindEvents();
    }
  }

  function finish() {
    session.setFlag('story_onboarding_completed', true);
    if (transmissionEl?.destroy) transmissionEl.destroy();
    transmissionEl = null;
    closeModal(() => {
      if (opts.onComplete) opts.onComplete();
      else if (opts.onClose) opts.onClose();
    });
  }

  showModal(renderModalBody(), {
    dismissible: true,
    onClose: () => {
      session.setFlag('story_onboarding_completed', true);
      if (transmissionEl?.destroy) transmissionEl.destroy();
      transmissionEl = null;
      if (opts.onClose) opts.onClose();
    }
  });

  mountTransmission();
  bindEvents();
}
