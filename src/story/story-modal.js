/**
 * story-modal.js — Storyline onboarding and sector briefing modals.
 *
 * Provides:
 *   - openWorldStoryModal(world, opts): Tactical world mission briefing modal in novelistic paragraph form.
 *   - openCampaignStoryModal(opts): Full campaign storyline modal in novelistic paragraph form.
 */

import { showModal, closeModal } from '../ui/modal.js';
import { soundscape } from '../audio/soundscape.js';
import { getEpisode, CAMPAIGN_STORY } from './saga.js';
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
    arrival: 'Hostile Fifth Guild units detected in sector.',
    closing: 'Sector secured and Fifth Guild saboteurs repelled.',
    spoilFamily: 'Infiltration units',
    paragraphs: [
      'The outer rim sirens tripped as our thrusters bit into the atmosphere. Hostile transponders are moving along the ridges, and the defense grid is flickering in the dark.',
      'Vess checked the perimeter telemetry with a grim nod. The raiders didn\'t leave by accident; they left behind automated guardians designed to bury their trail.',
      'We break through their blockade now and secure the sector before their vanguard armada enters high orbit.'
    ]
  };

  const paragraphs = (episode.paragraphs && episode.paragraphs.length > 0)
    ? episode.paragraphs
    : [episode.arrival, episode.incident, episode.objective].filter(Boolean);

  const worldName = episode.worldName || (typeof worldOrId === 'object' ? worldOrId.world : worldId);
  const worldTitle = typeof worldOrId === 'object' ? worldOrId.title : 'Tactical Mission';
  const worldUnit = typeof worldOrId === 'object' ? worldOrId.unit : 'Sector';
  const isPreLaunch = Boolean(opts.isPreLaunch || opts.onLaunch);

  session.setFlag(`story_world_seen_${worldId}`, true);

  let activeTab = 'sector'; // 'sector' | 'campaign'
  let sectorIndex = 0;
  let campaignIndex = 0;

  function getSpeaker(idx, isCamp) {
    if (isCamp) {
      return CAMPAIGN_STORY[idx]?.speaker || 'AVALON LOG // COMMS';
    }
    const speakers = [
      `AVALON TELEMETRY // ${worldName.toUpperCase()}`,
      'VESS // QUARTERMASTER',
      `TACTICAL DISPATCH // ${worldUnit.toUpperCase()}`
    ];
    return speakers[idx % speakers.length];
  }

  function renderModalBody() {
    const isCamp = activeTab === 'campaign';
    const currentList = isCamp ? CAMPAIGN_STORY.map(s => s.text) : paragraphs;
    const currentIdx = isCamp ? campaignIndex : sectorIndex;
    const currentText = currentList[currentIdx] || '';
    const currentSpeaker = getSpeaker(currentIdx, isCamp);
    const total = currentList.length;
    const isLast = currentIdx === total - 1;

    return `
      <div class="story-briefing-modal" style="max-width: 660px; margin: 0 auto; text-align: left;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.85rem; border-bottom: 1px solid var(--border-durasteel); padding-bottom: 0.6rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 2px;">
              <span class="eyebrow lit" style="color: var(--accent-amber); font-size: 0.68rem; letter-spacing: 0.14em;">THE FIFTH GUILD // LOG ENTRY</span>
              <span class="tag live" style="font-size: 0.58rem; padding: 1px 6px;">${esc((episode.spoilFamily || 'RAID').toUpperCase())}</span>
            </div>
            <h2 style="font-family: var(--font-imperial); font-size: 1.25rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-bright); margin: 0;">
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
            Sector Story · ${esc(worldName)}
          </button>
          <button type="button" id="tab-btn-campaign" class="map-tab btn-secondary ${activeTab === 'campaign' ? 'active' : ''}" style="flex: 1; padding: 6px 10px; font-family: var(--font-mono); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em;">
            The Campaign Saga
          </button>
        </div>

        <!-- Novelistic Story Card (Paragraph Form) -->
        <div class="story-novel-box" id="story-box-interactive" role="button" tabindex="0" title="Click or press Space to advance">
          <div>
            <div class="story-novel-header">
              <div class="story-novel-speaker">
                <span style="display: inline-block; width: 6px; height: 6px; background: var(--accent-gold); border-radius: 50%; box-shadow: 0 0 6px var(--accent-gold);"></span>
                ${esc(currentSpeaker)}
              </div>
              <div class="story-novel-step-badge">
                ${currentIdx + 1} / ${total}
              </div>
            </div>

            <p class="story-novel-text">
              ${esc(currentText)}
            </p>
          </div>

          <div>
            <div class="story-novel-footer">
              <div class="story-novel-dots">
                ${Array.from({ length: total }, (_, i) => `
                  <span class="story-novel-dot ${i === currentIdx ? 'active' : ''}"></span>
                `).join('')}
              </div>
              <div class="story-novel-hint">
                ${isLast ? 'LOG COMPLETE' : 'CLICK OR PRESS SPACE TO ADVANCE ▶'}
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.15rem; padding-top: 0.75rem; border-top: 1px solid var(--border-durasteel);">
          <div>
            ${currentIdx > 0 ? `
              <button type="button" id="story-prev-btn" class="btn-secondary" style="padding: 7px 14px; font-size: 0.8rem;">
                ◀ Back
              </button>
            ` : `
              <div style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-muted);">
                HAULER AVALON // LOG ARCHIVE
              </div>
            `}
          </div>

          <div style="display: flex; gap: 0.5rem; align-items: center;">
            ${!isLast ? `
              <button type="button" id="story-next-btn" class="btn-primary" style="padding: 8px 18px; font-size: 0.85rem; letter-spacing: 0.08em;">
                Continue ▶
              </button>
            ` : `
              <button type="button" id="story-modal-dismiss-btn" class="btn-primary" style="padding: 8px 20px; font-size: 0.85rem; letter-spacing: 0.08em; background: var(--accent-gold); color: #000; font-weight: 700;">
                ${isPreLaunch ? `Take Off & Deploy to ${esc(worldName)} ▶` : 'Return to Mission ▶'}
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  function advance() {
    const isCamp = activeTab === 'campaign';
    const total = isCamp ? CAMPAIGN_STORY.length : paragraphs.length;
    const current = isCamp ? campaignIndex : sectorIndex;

    if (current < total - 1) {
      if (isCamp) campaignIndex++;
      else sectorIndex++;
      soundscape.playToggleClack();
      refreshModal();
    } else {
      soundscape.playBondSnap();
      cleanupAndClose(true);
    }
  }

  function regress() {
    const isCamp = activeTab === 'campaign';
    const current = isCamp ? campaignIndex : sectorIndex;

    if (current > 0) {
      if (isCamp) campaignIndex--;
      else sectorIndex--;
      soundscape.playToggleClack();
      refreshModal();
    }
  }

  function handleKeyDown(e) {
    if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.code === 'Space' || e.code === 'ArrowRight' || e.code === 'Enter') {
      e.preventDefault();
      advance();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      regress();
    }
  }

  function bindEvents() {
    const modalEl = document.getElementById('modal-container');
    if (!modalEl) return;

    modalEl.querySelector('#story-modal-close-x')?.addEventListener('click', () => {
      soundscape.playToggleClack();
      cleanupAndClose(false);
    });

    modalEl.querySelector('#story-prev-btn')?.addEventListener('click', () => {
      regress();
    });

    modalEl.querySelector('#story-next-btn')?.addEventListener('click', () => {
      advance();
    });

    modalEl.querySelector('#story-box-interactive')?.addEventListener('click', () => {
      advance();
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
    window.removeEventListener('keydown', handleKeyDown);
    closeModal(() => {
      if (triggerLaunch && opts.onLaunch) {
        opts.onLaunch();
      } else if (opts.onClose) {
        opts.onClose();
      }
    });
  }

  function refreshModal() {
    const modalEl = document.getElementById('modal-container');
    if (!modalEl) return;
    const card = modalEl.querySelector('.modal-card');
    if (card) {
      card.innerHTML = renderModalBody();
      bindEvents();
    }
  }

  showModal(renderModalBody(), {
    dismissible: true,
    onClose: () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (opts.onLaunch) opts.onLaunch();
      else if (opts.onClose) opts.onClose();
    }
  });

  window.addEventListener('keydown', handleKeyDown);
  bindEvents();
}

/**
 * Open the campaign storyline modal.
 * @param {{ onComplete?: Function, onClose?: Function }} opts
 */
export function openCampaignStoryModal(opts = {}) {
  let currentIdx = 0;
  const total = CAMPAIGN_STORY.length;

  function renderModalBody() {
    const item = CAMPAIGN_STORY[currentIdx];
    const isLast = currentIdx === total - 1;

    return `
      <div class="campaign-story-modal" style="max-width: 660px; margin: 0 auto; text-align: left;">
        <!-- Topbar -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; border-bottom: 1px solid var(--border-durasteel); padding-bottom: 0.5rem;">
          <div style="display: flex; align-items: baseline; gap: 0.6rem;">
            <span class="eyebrow lit" style="color: var(--accent-gold); font-size: 0.68rem; letter-spacing: 0.12em;">CAMPAIGN STORYLINE DOSSIER</span>
            <span style="font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; text-transform: uppercase; color: var(--text-bright);">THE FIFTH GUILD</span>
          </div>
          <button type="button" id="campaign-modal-skip-btn" class="eyebrow" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; text-decoration: underline;">
            Skip Briefing
          </button>
        </div>

        <!-- Novelistic Story Card (Paragraph Form) -->
        <div class="story-novel-box" id="campaign-story-box-interactive" role="button" tabindex="0" title="Click or press Space to advance">
          <div>
            <div class="story-novel-header">
              <div class="story-novel-speaker">
                <span style="display: inline-block; width: 6px; height: 6px; background: var(--accent-gold); border-radius: 50%; box-shadow: 0 0 6px var(--accent-gold);"></span>
                ${esc(item.speaker)}
              </div>
              <div class="story-novel-step-badge">
                ${currentIdx + 1} / ${total}
              </div>
            </div>

            <p class="story-novel-text">
              ${esc(item.text)}
            </p>
          </div>

          <div>
            <div class="story-novel-footer">
              <div class="story-novel-dots">
                ${Array.from({ length: total }, (_, i) => `
                  <span class="story-novel-dot ${i === currentIdx ? 'active' : ''}"></span>
                `).join('')}
              </div>
              <div class="story-novel-hint">
                ${isLast ? 'FINAL LOG · ORDERS CONFIRMED' : 'CLICK OR PRESS SPACE TO ADVANCE ▶'}
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Footer -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.15rem; padding-top: 0.75rem; border-top: 1px solid var(--border-durasteel);">
          <div>
            ${currentIdx > 0 ? `
              <button type="button" id="campaign-slide-prev" class="btn-secondary" style="padding: 7px 14px; font-size: 0.8rem;">
                ◀ Back
              </button>
            ` : `
              <div style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-muted);">
                HAULER AVALON // CREW DISPATCH
              </div>
            `}
          </div>

          <div style="display: flex; gap: 0.5rem; align-items: center;">
            ${!isLast ? `
              <button type="button" id="campaign-slide-next" class="btn-primary" style="padding: 8px 18px; font-size: 0.85rem; letter-spacing: 0.08em;">
                Continue ▶
              </button>
            ` : `
              <button type="button" id="campaign-slide-finish" class="btn-primary" style="padding: 8px 20px; font-size: 0.85rem; letter-spacing: 0.08em; background: var(--accent-gold); color: #000; font-weight: 700;">
                Acknowledge Orders & Disembark ▶
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  function advance() {
    if (currentIdx < total - 1) {
      currentIdx++;
      soundscape.playToggleClack();
      refresh();
    } else {
      soundscape.playBondSnap();
      finish();
    }
  }

  function regress() {
    if (currentIdx > 0) {
      currentIdx--;
      soundscape.playToggleClack();
      refresh();
    }
  }

  function handleKeyDown(e) {
    if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.code === 'Space' || e.code === 'ArrowRight' || e.code === 'Enter') {
      e.preventDefault();
      advance();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      regress();
    }
  }

  function bindEvents() {
    const modalEl = document.getElementById('modal-container');
    if (!modalEl) return;

    modalEl.querySelector('#campaign-modal-skip-btn')?.addEventListener('click', () => {
      soundscape.playToggleClack();
      finish();
    });

    modalEl.querySelector('#campaign-slide-prev')?.addEventListener('click', () => {
      regress();
    });

    modalEl.querySelector('#campaign-slide-next')?.addEventListener('click', () => {
      advance();
    });

    modalEl.querySelector('#campaign-story-box-interactive')?.addEventListener('click', () => {
      advance();
    });

    modalEl.querySelector('#campaign-slide-finish')?.addEventListener('click', () => {
      soundscape.playBondSnap();
      finish();
    });
  }

  function refresh() {
    const modalEl = document.getElementById('modal-container');
    if (!modalEl) return;
    const card = modalEl.querySelector('.modal-card');
    if (card) {
      card.innerHTML = renderModalBody();
      bindEvents();
    }
  }

  function finish() {
    window.removeEventListener('keydown', handleKeyDown);
    session.setFlag('story_onboarding_completed', true);
    closeModal(() => {
      if (opts.onComplete) opts.onComplete();
      else if (opts.onClose) opts.onClose();
    });
  }

  showModal(renderModalBody(), {
    dismissible: true,
    onClose: () => {
      window.removeEventListener('keydown', handleKeyDown);
      session.setFlag('story_onboarding_completed', true);
      if (opts.onClose) opts.onClose();
    }
  });

  window.addEventListener('keydown', handleKeyDown);
  bindEvents();
}
