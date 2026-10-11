/**
 * story-modal.js — Storyline onboarding and sector briefing modals.
 *
 * Provides:
 *   - openWorldStoryModal(world, opts): Tactical world mission briefing modal.
 *     Shown before takeoff/landing so the player knows the stakes against
 *     the Fifth Guild before flight.
 *   - openCampaignStoryModal(opts): Full campaign storyline onboarding modal
 *     covering the Quad-Guild Truce, the rogue Fifth Guild, and forensic science.
 */

import { showModal, closeModal } from '../ui/modal.js';
import { createTransmissionElement } from '../ui/transmission.js';
import { soundscape } from '../audio/soundscape.js';
import { getEpisode, getAct, ACTS } from './saga.js';
import { session } from '../session.js';
import { esc } from '../ui/layout.js';

/**
 * Open the mission briefing modal for a specific world.
 * @param {object|string} worldOrId
 * @param {{ isPreLaunch?: boolean, onLaunch?: Function, onClose?: Function }} opts
 */
export function openWorldStoryModal(worldOrId, opts = {}) {
  const worldId = typeof worldOrId === 'string' ? worldOrId : worldOrId?.id;
  const episode = getEpisode(worldId) || {
    worldId,
    worldName: typeof worldOrId === 'object' ? worldOrId.world : worldId,
    act: 'act1',
    arrival: 'Hostile Fifth Guild units detected in sector. Research stations ready for tactical deployment.',
    closing: 'Sector secured and Fifth Guild saboteurs repelled. Forensic evidence logged to the Avalon.',
    spoilFamily: 'Enemy units',
    incident: 'The Fifth Guild has launched a raid on this sector, sabotaging local equipment and threatening the outpost.',
    objective: 'Apply the chemical principles of this unit across the stations to neutralize enemy machines and recover stolen intel.',
    caseFileNote: 'Every clue recovered from the Fifth Guild exposes their secret plan on the rim.'
  };

  const act = getAct(episode.act) || ACTS[0];
  const worldName = episode.worldName || (typeof worldOrId === 'object' ? worldOrId.world : worldId);
  const worldTitle = typeof worldOrId === 'object' ? worldOrId.title : 'Tactical Mission';
  const worldUnit = typeof worldOrId === 'object' ? worldOrId.unit : 'Sector';
  const isPreLaunch = Boolean(opts.isPreLaunch || opts.onLaunch);

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
              <span class="eyebrow lit" style="color: var(--accent-amber); font-size: 0.68rem; letter-spacing: 0.14em;">ENEMY // THE FIFTH GUILD</span>
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
            Sector Mission · ${esc(worldName)}
          </button>
          <button type="button" id="tab-btn-campaign" class="map-tab btn-secondary ${activeTab === 'campaign' ? 'active' : ''}" style="flex: 1; padding: 6px 10px; font-family: var(--font-mono); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em;">
            War Report · The Fifth Guild
          </button>
        </div>

        <!-- Content Area -->
        <div id="story-modal-tab-content">
          ${activeTab === 'sector' ? renderSectorTab() : renderCampaignTab()}
        </div>

        <!-- Footer Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.15rem; padding-top: 0.75rem; border-top: 1px solid var(--border-durasteel);">
          <div style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-muted);">
            TACTICAL COMMS // SALVAGE HAULER AVALON
          </div>
          <button type="button" id="story-modal-dismiss-btn" class="btn-primary" style="padding: 8px 18px; font-size: 0.85rem; letter-spacing: 0.08em;">
            ${isPreLaunch ? `Take Off & Deploy to ${esc(worldName)} ▶` : 'Return to Mission ▶'}
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
            [ ⚠ ENEMY INCIDENT // THE FIFTH GUILD STRIKES ]
          </div>
          <p style="font-family: var(--font-sans); font-size: 0.82rem; line-height: 1.45; color: var(--text-bright); margin: 0;">
            ${esc(episode.incident)}
          </p>
        </div>

        <!-- Your Tactical Objective -->
        <div class="holo-card" style="padding: 0.75rem 0.9rem; background: var(--plate-200); border: 1px solid var(--border-durasteel); border-left: 2px solid var(--accent-gold);">
          <div class="eyebrow lit" style="color: var(--accent-gold); font-size: 0.64rem; margin-bottom: 0.25rem; letter-spacing: 0.12em;">
            [ 🎯 MISSION OBJECTIVE // HOW TO WIN ]
          </div>
          <p style="font-family: var(--font-sans); font-size: 0.82rem; line-height: 1.45; color: var(--text-bright); margin: 0;">
            ${esc(episode.objective)}
          </p>
        </div>

        <!-- Case File Connection -->
        <div class="holo-card" style="padding: 0.75rem 0.9rem; background: var(--plate-100); border: 1px solid var(--border-durasteel); border-left: 2px solid var(--accent-bronze);">
          <div class="eyebrow" style="color: var(--accent-bronze); font-size: 0.64rem; margin-bottom: 0.25rem; letter-spacing: 0.12em;">
            [ 📂 ENEMY INTEL // CASE FILE DOSSIER ]
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
            01 · THE FRONTIER ALLIANCE & THE AVALON
          </div>
          <p style="font-family: var(--font-sans); font-size: 0.82rem; line-height: 1.45; color: var(--text-bright); margin: 0;">
            Four industrial Guilds divide the frontier: Earth Mining, Air Harvesters, Fire Smelters, and Water Extraction. You serve as a survey specialist aboard the forty-year-old salvage hauler <em>Avalon</em> under Quartermaster Vess.
          </p>
        </div>

        <div class="holo-card" style="padding: 0.75rem 0.9rem; background: var(--plate-200); border: 1px solid var(--border-durasteel); border-left: 2px solid var(--accent-gold);">
          <div class="eyebrow lit" style="color: var(--accent-gold); font-size: 0.64rem; margin-bottom: 0.25rem;">
            02 · THE ENEMY: THE FIFTH GUILD
          </div>
          <p style="font-family: var(--font-sans); font-size: 0.82rem; line-height: 1.45; color: var(--text-bright); margin: 0;">
            A ruthless rogue army—<strong>The Fifth Guild</strong>—is attacking frontier outposts, raiding fuel depots, and building animated war machines from scrap. They claim to possess magical alchemy, but they are secretly building a forbidden doomsday weapon.
          </p>
        </div>

        <div class="holo-card" style="padding: 0.75rem 0.9rem; background: var(--plate-200); border: 1px solid var(--border-durasteel); border-left: 2px solid var(--accent-bronze);">
          <div class="eyebrow lit" style="color: var(--accent-bronze); font-size: 0.64rem; margin-bottom: 0.25rem;">
            03 · YOUR WEAPON: SCIENCE
          </div>
          <p style="font-family: var(--font-sans); font-size: 0.82rem; line-height: 1.45; color: var(--text-bright); margin: 0;">
            You defeat the enemy by mastering the physical laws of chemistry: mass is strictly conserved, molecules break at their weakest bonds, and energy follows exact rules. Real science is your weapon to shatter enemy armor, neutralize their traps, and stop their armada.
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
      speaker: 'VESS // TACTICAL DISPATCH',
      badge: `${worldUnit.toUpperCase()} · ENEMY ALERT`,
      subtitle: `${worldName.toUpperCase()} // HOSTILE INCIDENT`,
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
      cleanupAndClose(true);
    });

    modalEl.querySelector('#story-modal-dismiss-btn')?.addEventListener('click', () => {
      soundscape.playBondSnap();
      cleanupAndClose(true);
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

  function cleanupAndClose(triggerLaunch = false) {
    if (transmissionEl?.destroy) transmissionEl.destroy();
    transmissionEl = null;
    closeModal(() => {
      if (triggerLaunch && opts.onLaunch) {
        opts.onLaunch();
      } else if (opts.onClose) {
        opts.onClose();
      }
    });
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
      if (opts.onLaunch) opts.onLaunch();
      else if (opts.onClose) opts.onClose();
    }
  });

  mountTransmission();
  bindEvents();
}

/**
 * Open the 4-part campaign storyline onboarding modal.
 * @param {{ onComplete?: Function, onClose?: Function }} opts
 */
export function openCampaignStoryModal(opts = {}) {
  let currentSlide = 0;
  let transmissionEl = null;

  const SLIDES = [
    {
      kicker: '01 / 04 · THE QUAD-GUILD ALLIANCE',
      title: 'Four Monopolies on the Frontier',
      speaker: 'VESS // QUARTERMASTER',
      transmission: 'Four industrial Guilds divide the frontier. Your ship, the Avalon, operates between them under a shared peace treaty.',
      bullets: [
        { label: 'Mineral Mining (Earth)', desc: 'Strip-mines iron, heavy metals, and asteroid rock from barren planetary crusts.' },
        { label: 'Atmospheric Harvesters (Air)', desc: 'Skims high-altitude storm clouds and gas giants for volatile starship fuels.' },
        { label: 'Thermal Smelters (Fire)', desc: 'Operates orbital crucibles and blast-wells that melt raw stone into battle armor.' },
        { label: 'Moisture Extraction (Water)', desc: 'Filters heavy water and industrial coolants from subterranean ice reserves.' }
      ],
      note: 'Your Station: A junior survey specialist aboard the salvage hauler Avalon, answering to Quartermaster Vess.'
    },
    {
      kicker: '02 / 04 · THE ENEMY: THE FIFTH GUILD',
      title: 'Rogue Raiders & Sabotage',
      speaker: 'VESS // QUARTERMASTER',
      transmission: 'A hostile shadow faction has struck outposts across the rim. Frontier crews call them the Fifth Guild.',
      bullets: [
        { label: 'Coordinated Raids', desc: 'The Fifth Guild is attacking frontier outposts, raiding fuel supplies, and destroying defenses.' },
        { label: 'Rogue War Machines', desc: 'They deploy autonomous crawling war machines made from scrap and salt to guard their sabotage.' },
        { label: 'Impossible Ledgers', desc: 'Captured enemy logs claim they can create tons of metal out of thin air using magical alchemy.' },
        { label: 'The Dangerous Reality', desc: 'Alchemy is a lie. The Fifth Guild is secretly restructuring atomic nuclei with stolen military hardware.' }
      ],
      note: 'Enemy Alert: The Fifth Guild is actively terrorizing the frontier. We must expose their operations and protect the fleet.'
    },
    {
      kicker: '03 / 04 · YOUR WEAPON: SCIENCE',
      title: 'Dismantling Enemy Machines',
      speaker: 'VESS // QUARTERMASTER',
      transmission: 'You do not fight with clumsy blasters. You defeat the Fifth Guild by understanding how matter and energy actually work.',
      bullets: [
        { label: 'Exposing Their Frauds', desc: 'The law of conservation proves matter cannot be made from nothing. Every enemy machine has a physical flaw.' },
        { label: 'Crushing Enemy Armor', desc: 'Understanding bond strength and crystal cleave planes lets you shatter enemy stone golems and barricades.' },
        { label: 'Disabling Enemy Traps', desc: 'Tuning light frequencies and electrical circuits burns out their spy drones, power leeches, and light-moths.' },
        { label: 'The Case File Dossier', desc: 'Every defeated enemy commander and reclaimed station yields physical intel stored in your terminal.' }
      ],
      note: 'Mission Directive: Deploy to each attacked world, dismantle the Fifth Guild\'s machines, and collect evidence.'
    },
    {
      kicker: '04 / 04 · THE CAMPAIGN ROAD',
      title: 'Stop the Fifth Guild\'s Superweapon',
      speaker: 'VESS // QUARTERMASTER',
      transmission: 'Four acts across fourteen worlds. Trace the Fifth Guild\'s trail of sabotage to their secret command core on Cinder Halo.',
      bullets: [
        { label: 'Act I: Strike on the Frontier (Units 1–3)', desc: 'Defend Tallow, Lanternfall, and Ligar against sudden raids and autonomous stone war machines.' },
        { label: 'Act II: Stolen Power (Units 4–7)', desc: 'Stop hijacked gas skimmers, recover stolen heat energy, and seize an illegal golem factory.' },
        { label: 'Act III: Total Sabotage (Units 8–11)', desc: 'Neutralize acid weapons, fix sabotaged reactors, and unmask the enemy commander: The Catalyst.' },
        { label: 'Act IV: The Doomsday Core (Units 12–14)', desc: 'Destroy enemy magnetic beam-cannons, breach their swamp fortress, and shut down their nuclear superweapon on Cinder Halo.' }
      ],
      note: 'Final Objective: Master the laws of chemistry to defeat the Fifth Guild, protect the colonies, and uncover the truth behind the war.'
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
