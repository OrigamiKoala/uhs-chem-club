/**
 * feed.js — Progression event presentation queue.
 * Holds events (xp, level, commendation, requisition, watch) until safe narrative moments.
 */

import { showModal, closeModal } from '../ui/modal.js';
import { renderRankPlate } from '../ui/rank-plate.js';
import { renderCommendationPlate } from '../ui/commendation-plate.js';
import { LEVEL_TRANSMISSIONS, COMMENDATION_TRANSMISSIONS } from '../story/progression.js';
import { nextLevelRequisition } from './requisitions.js';
import { soundscape } from '../audio/soundscape.js';
import { esc } from '../ui/layout.js';

class ProgressionFeed {
  constructor() {
    this.queue = [];
    this.isFlushing = false;
    this.safeToFlush = true;
  }

  enqueue(event) {
    if (!event || !event.type) return;
    this.queue.push(event);
  }

  enqueueLevelUp(level, requisition) {
    this.enqueue({ type: 'level', level, requisition });
  }

  enqueueCommendation(commendation) {
    this.enqueue({ type: 'commendation', commendation });
  }

  enqueueWatch(watchCount) {
    this.enqueue({ type: 'watch', watchCount });
  }

  setSafe(isSafe) {
    this.safeToFlush = Boolean(isSafe);
    if (this.safeToFlush && this.queue.length > 0 && !this.isFlushing) {
      this.flush();
    }
  }

  async flush() {
    if (!this.safeToFlush || this.isFlushing || this.queue.length === 0) return;
    this.isFlushing = true;

    while (this.queue.length > 0) {
      const ev = this.queue.shift();
      await this.presentEvent(ev);
    }

    this.isFlushing = false;
  }

  presentEvent(ev) {
    return new Promise((resolve) => {
      if (ev.type === 'level') {
        soundscape.playStamp?.();
        const lvl = ev.level;
        const story = LEVEL_TRANSMISSIONS[lvl] || {
          speaker: 'Vess',
          text: `Level ${lvl} confirmed. Report to your station.`
        };
        const req = ev.requisition || null;

        const markup = `
          <div class="progression-moment-modal">
            ${renderRankPlate({ level: lvl, subtext: req ? `Requisition: ${req.name}` : '' })}
            <div class="glass-panel" style="margin-top: 1.25rem; text-align: left; border-left: 2px solid var(--accent-amber); padding: 0.9rem 1.15rem;">
              <div class="eyebrow lit" style="color: var(--accent-gold); margin-bottom: 0.35rem;">TRANSMISSION · ${esc(story.speaker || 'Vess')}</div>
              <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-bright); line-height: 1.5;">
                "${esc(story.text)}"
              </div>
            </div>
            <div class="progression-moment-dismiss">
              <button type="button" id="dismiss-progression-btn" class="btn-primary" style="min-width: 140px;">
                Acknowledge
              </button>
            </div>
          </div>
        `;

        showModal(markup, {
          onClose: () => resolve()
        });

        // Safe auto-advance / keyboard listener
        const btn = document.getElementById('dismiss-progression-btn');
        btn?.focus();
        btn?.addEventListener('click', () => {
          closeModal();
          resolve();
        }, { once: true });

      } else if (ev.type === 'commendation') {
        soundscape.playStamp?.();
        const c = ev.commendation;
        const story = COMMENDATION_TRANSMISSIONS[c.id] || null;

        const markup = `
          <div class="progression-moment-modal">
            <div class="eyebrow lit" style="color: var(--accent-gold); margin-bottom: 0.75rem;">COMMENDATION CONFERRED</div>
            ${renderCommendationPlate({ commendation: c, earned: true })}
            ${story ? `
              <div class="glass-panel" style="margin-top: 1.25rem; text-align: left; border-left: 2px solid var(--accent-amber); padding: 0.85rem 1rem;">
                <div class="eyebrow lit" style="color: var(--accent-gold); margin-bottom: 0.25rem;">TRANSMISSION · ${esc(story.speaker || 'Vess')}</div>
                <div style="font-family: var(--font-mono); font-size: 0.82rem; color: var(--text-bright);">
                  "${esc(story.text)}"
                </div>
              </div>
            ` : ''}
            <div class="progression-moment-dismiss">
              <button type="button" id="dismiss-commendation-btn" class="btn-primary" style="min-width: 140px;">
                Pin Plate
              </button>
            </div>
          </div>
        `;

        showModal(markup, {
          onClose: () => resolve()
        });

        const btn = document.getElementById('dismiss-commendation-btn');
        btn?.focus();
        btn?.addEventListener('click', () => {
          closeModal();
          resolve();
        }, { once: true });

      } else if (ev.type === 'watch') {
        const markup = `
          <div class="progression-moment-modal">
            <div class="eyebrow lit" style="color: var(--accent-gold); margin-bottom: 0.5rem;">WEEKLY WATCH STANDING</div>
            <div class="stat-tile" style="display: inline-block; padding: 1.25rem 2rem; background: var(--plate-200); border: 1px solid var(--border-durasteel);">
              <div class="stat-label">Consecutive Weeks</div>
              <div class="stat-value" style="font-size: 2.2rem; color: var(--accent-amber);">WATCH ${ev.watchCount}</div>
            </div>
            <p style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.9rem;">
              You have stood active watch this week.
            </p>
            <div class="progression-moment-dismiss">
              <button type="button" id="dismiss-watch-btn" class="btn-primary" style="min-width: 140px;">
                Dismiss
              </button>
            </div>
          </div>
        `;

        showModal(markup, {
          onClose: () => resolve()
        });

        const btn = document.getElementById('dismiss-watch-btn');
        btn?.focus();
        btn?.addEventListener('click', () => {
          closeModal();
          resolve();
        }, { once: true });

      } else {
        resolve();
      }
    });
  }
}

export const progressionFeed = new ProgressionFeed();
