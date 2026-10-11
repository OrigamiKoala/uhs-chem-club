/**
 * learn-world.js — One Learn world: its quests, in the order they are played.
 *
 * A quest here is a game with its own module. This screen only decides which are
 * open and hands the player into them.
 */

import { stage } from '../three/stage.js';
import { pageHeader, esc } from '../ui/layout.js';
import { getWorld, ARENAS } from '../learn/curriculum.js';
import { worldStatus, worldProgress, questStatus, questProgress, nextQuest, isQuestComplete } from '../learn/progress.js';
import { canWalk, world3dFor } from '../learn/worlds3d.js';
import { openWorldPractice, worldHasPractice, practiceOfferedFlag } from '../learn/practice.js';
import { openWorldStoryModal } from '../story/story-modal.js';
import { getEpisode } from '../story/saga.js';
import { session } from '../session.js';

const STATUS_TAG = {
  open: { label: 'Open', cls: 'live' },
  complete: { label: 'Complete', cls: 'live' },
  locked: { label: 'Locked', cls: 'warn' },
  charted: { label: 'Coming soon', cls: 'locked' }
};

/**
 * Walking to a bench and pressing [E] opens that quest.
 *
 * Installed once, at module scope, and guarded on the current hash — a listener
 * added per render would have to be torn down per navigation, and the world
 * screen has no dispose hook to do it in.
 */
let siteListenerInstalled = false;
function installSiteListener() {
  if (siteListenerInstalled) return;
  siteListenerInstalled = true;
  window.addEventListener('learn-site:interact', e => {
    const site = e.detail;
    if (!site || !site.questId) return;
    const hash = window.location.hash.slice(1).replace(/^\/+/, '');
    const parts = hash.split('/').filter(Boolean);
    // Only while standing on a Learn world's ground, never from anywhere else.
    if (parts[0] !== 'learn' || parts.length !== 2) return;
    const worldId = parts[1];
    if (!canWalk(worldId)) return;
    // A charted site with no module opens nothing. The world does not pretend.
    if (site.built === false) return;
    window.location.hash = `#/learn/${worldId}/${site.questId}`;
  });
}

/**
 * Offer the world's problem set the first time the player comes back here with
 * every bench in it worked.
 *
 * It is an offer and not a gate: the next world has ALREADY opened by the time
 * this runs (gating is `worldProgress`, which knows nothing about practice), the
 * screen behind it is already drawn, and Close is the first key on the card.
 * Once offered it never auto-opens again — the Problems key is how it comes back.
 */
function maybeOfferStory() {
  // Storyline is delivered before takeoff aboard the Avalon, never after landing.
}

/**
 * Offer the world's problem set the first time the player comes back here with
 * every bench in it worked.
 *
 * It is an offer and not a gate: the next world has ALREADY opened by the time
 * this runs (gating is `worldProgress`, which knows nothing about practice), the
 * screen behind it is already drawn, and Close is the first key on the card.
 * Once offered it never auto-opens again — the Problems key is how it comes back.
 */
function maybeOfferPractice(world) {
  if (!worldHasPractice(world)) return;
  if (session.hasFlag(practiceOfferedFlag(world.id))) return;
  openWorldPractice(world);
}

/** The key that reopens a finished world's problem set, or nothing. */
export function practiceKey(world, cls = 'btn-secondary quest-btn-sm') {
  if (!worldHasPractice(world)) return '';
  return `<button type="button" class="${cls} m-tap" data-practice-world="${esc(world.id)}">Problems</button>`;
}

/** Wire every Problems key inside `root`. Safe to call on a root with none. */
export function bindPracticeKeys(root) {
  root.querySelectorAll('[data-practice-world]').forEach(btn => {
    btn.addEventListener('click', () => {
      const w = getWorld(btn.dataset.practiceWorld);
      if (w) openWorldPractice(w);
    });
  });
}

export function renderLearnWorld(container, params = {}) {
  const world = getWorld(params.worldId);

  if (!world) {
    window.location.hash = '#/learn';
    return;
  }

  // On a world that is built as a place, the player walks it. The quest list is
  // still here, as the terminal on the bench rail — nothing is unreachable.
  if (canWalk(world.id)) {
    installSiteListener();
    const w3d = world3dFor(world.id);
    // Coming back out of a bench puts you in front of it, not at the pad.
    const fromQuest = sessionStorage.getItem('avalon_learn_last_site');
    // Walked here down the Avalon's ramp: stay where the ramp left them.
    const flewIn = Boolean(stage.consumeVoyageArrival?.());
    w3d.enter(stage, flewIn ? null : (fromQuest || null));
    sessionStorage.removeItem('avalon_learn_last_site');
    w3d.syncProgress(stage, questId => {
      const q = world.quests.find(x => x.id === questId);
      return q ? isQuestComplete(q) : false;
    });
    if (flewIn || !fromQuest) {
      const nq = nextQuest(world) || world.quests[0];
      const targetSite = nq ? w3d.siteForQuest(nq.id) : null;
      if (targetSite) {
        const at = targetSite.approachPos || targetSite.pos;
        stage.setWorldWaypoint({ x: at[0], z: at[2], label: targetSite.label });
      }
    }
    renderWalkHud(container, world);
    bindPracticeKeys(container);
    maybeOfferPractice(world);
    maybeOfferStory(world);
    return;
  }

  if (stage.cameraRig) {
    stage.cameraRig.moveTo('starmap');
  }

  const wStatus = worldStatus(world);
  const prog = worldProgress(world);
  const resume = nextQuest(world);

  container.innerHTML = `
    <div class="screen-container m-screen m-learn-world">
      ${pageHeader({
        art: '/art/crucible.jpg',
        video: '/video/crucible_loop.webm',
        artAlt: '',
        eyebrow: esc(world.unit),
        title: esc(world.world),
        subtitle: esc(world.line),
        actions: `
          <button type="button" class="btn-secondary quest-btn-sm learn-story-trigger m-tap" style="margin-right: 0.5rem;" title="Review Sector Storyline">Storyline</button>
          <a href="#/learn" class="btn-secondary" style="text-decoration: none;">All Worlds</a>
        `
      })}

      <section class="glass-panel learn-world-brief">
        <div class="m-head learn-brief-head">
          <span class="eyebrow lit">${esc(world.title)}</span>
          <div style="display: flex; gap: 0.4rem; align-items: center;">
            <button type="button" class="btn-secondary quest-btn-sm learn-story-trigger m-tap" title="Review Sector Storyline">Storyline</button>
            <span class="tag ${(STATUS_TAG[wStatus] || STATUS_TAG.charted).cls}">${(STATUS_TAG[wStatus] || STATUS_TAG.charted).label}</span>
          </div>
        </div>
        <p class="learn-brief-body">${esc(world.brief)}</p>
        <div class="learn-brief-foot">
          <div class="eyebrow learn-brief-count">
            ${world.questCount} quests${prog.liveTotal ? ` · ${prog.questsComplete} of ${prog.liveTotal} complete` : ''}
          </div>
          <div style="display: flex; gap: 0.4rem; align-items: center;">
            <button type="button" class="btn-secondary quest-btn-sm learn-story-trigger m-tap" title="Review Sector Storyline">Storyline</button>
            ${practiceKey(world)}
          </div>
        </div>
      </section>

      <div class="learn-quest-list">
        ${world.quests.map(q => {
          const st = questStatus(world, q);
          const tag = STATUS_TAG[st] || STATUS_TAG.charted;
          const qp = questProgress(q);
          const enterable = st === 'open' || st === 'complete';
          return `
            <article class="plate learn-quest-row learn-${st}">
              <div class="learn-quest-index">${String(q.index + 1).padStart(2, '0')}</div>

              <div class="learn-quest-body">
                <div class="m-head learn-quest-head">
                  <h2 class="learn-quest-title">${esc(q.title)}</h2>
                  <span class="tag ${tag.cls}">${tag.label}</span>
                </div>
                <p class="learn-quest-line">${esc(q.line)}</p>
                <div class="eyebrow learn-quest-meta">
                  ${q.stageCount ? `${q.stageCount} stages` : ''}${qp.complete ? ' · Cleared' : qp.cleared ? ` · ${qp.cleared}/${qp.total}` : ''}
                </div>
              </div>

              <div class="learn-quest-action">
                ${enterable
                  ? `<a href="#/learn/${esc(world.id)}/${esc(q.id)}" class="btn-primary learn-enter m-tap" style="text-decoration: none;">${qp.complete ? 'Replay' : 'Play'}</a>`
                  : `<span class="eyebrow learn-quest-blocked">${st === 'locked' ? 'Locked' : 'Coming soon'}</span>`}
              </div>
            </article>
          `;
        }).join('')}
      </div>
    </div>
  `;

  bindPracticeKeys(container);
  maybeOfferPractice(world);
  container.querySelectorAll('.learn-story-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      openWorldStoryModal(world);
    });
  });
}

/**
 * The HUD worn while walking a Learn world.
 * Matches Erebus HUD look and positioning (bottom-left corner, easily collapsible,
 * with popup modal for sites directory).
 */
function renderWalkHud(container, world) {
  const prog = worldProgress(world);
  const total = prog.liveTotal || world.questCount;
  const isCollapsed = sessionStorage.getItem('avalon_learn_hud_collapsed') === '1';
  const ep = getEpisode(world.id);

  container.innerHTML = `
    <div class="learn-walk-hud${isCollapsed ? ' collapsed' : ''}" data-world="${esc(world.id)}">
      <!-- Expanded HUD card (Erebus aesthetic) -->
      <div class="learn-walk-card learn-walk-card-expanded">
        <div class="learn-walk-header">
          <a href="#/learn" class="btn-secondary quest-btn-sm learn-walk-back" style="text-decoration: none;">
            ← All Worlds
          </a>
          <span class="eyebrow lit">${esc(world.unit.toUpperCase())}</span>
          <button type="button" class="btn-secondary quest-btn-sm learn-walk-toggle" aria-label="Collapse HUD" title="Collapse HUD">
            −
          </button>
        </div>

        <div class="learn-walk-name">${esc(world.world)}</div>
        <p class="learn-walk-line">${esc(world.line)}</p>

        <div class="learn-walk-threat" style="margin: 0.35rem 0 0.5rem; padding: 0.35rem 0.55rem; background: rgba(217, 148, 35, 0.12); border-left: 2px solid var(--accent-amber); border-radius: 2px;">
          <div class="eyebrow lit" style="color: var(--accent-amber); font-size: 0.6rem; letter-spacing: 0.1em; margin-bottom: 2px;">ENEMY // THE FIFTH GUILD</div>
          <div style="font-family: var(--font-sans); font-size: 0.72rem; color: var(--text-bright); line-height: 1.25;">
            ${esc(ep?.incident ? ep.incident.split('.')[0] + '.' : 'Hostile saboteurs active in sector.')}
          </div>
        </div>

        <div class="learn-walk-prog">
          Quests: ${prog.questsComplete} of ${total} Cleared
        </div>

        <div class="learn-walk-hint">
          WASD: Move · Drag: Look · E: Interact
        </div>

        <div class="learn-walk-keys">
          <button type="button" class="btn-secondary quest-btn-sm learn-story-trigger m-tap" id="learn-story-trigger" title="Sector Storyline Briefing">
            Storyline
          </button>
          <button type="button" class="btn-secondary quest-btn-sm learn-sites-trigger m-tap" id="learn-sites-trigger">
            Sites (${prog.questsComplete}/${total})
          </button>
          ${practiceKey(world)}
        </div>
      </div>

      <!-- Collapsed mini-chip -->
      <div class="learn-walk-card learn-walk-card-collapsed">
        <button type="button" class="btn-secondary quest-btn-sm learn-walk-expand m-tap" id="learn-walk-expand" aria-label="Expand HUD" title="Expand HUD">
          + ${esc(world.world)} · ${prog.questsComplete}/${total}
        </button>
      </div>

      <!-- Sites Popup Modal -->
      <div class="learn-sites-popup-scrim hidden" id="learn-sites-popup-scrim">
        <div class="in-world-terminal learn-sites-terminal" role="dialog" aria-modal="true" aria-labelledby="learn-sites-popup-title">
          <div class="terminal-header">
            <div>
              <span class="eyebrow lit">${esc(world.unit.toUpperCase())}</span>
              <h2 id="learn-sites-popup-title" class="section-title" style="font-size: 1.1rem; margin-top: 2px;">
                ${esc(world.world.toUpperCase())} — EXPLORATION SITES
              </h2>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <button type="button" id="sites-story-popup-btn" class="btn-secondary quest-btn-sm m-tap" style="font-size: 0.72rem; padding: 2px 8px;">Storyline</button>
              ${total ? `<span class="tag ${prog.questsComplete >= total ? 'live' : 'warn'}">${prog.questsComplete} / ${total} CLEARED</span>` : ''}
              <button type="button" id="close-sites-popup-btn" class="terminal-close-btn" aria-label="Close sites panel">✕ CLOSE</button>
            </div>
          </div>

          <div style="margin-bottom: 0.85rem; padding: 0.45rem 0.65rem; background: var(--plate-200); border: 1px solid var(--border-durasteel); border-left: 2px solid var(--accent-gold);">
            <div class="eyebrow lit" style="color: var(--accent-gold); font-size: 0.6rem; margin-bottom: 2px;">TACTICAL MISSION // RECLAIM STATIONS</div>
            <p style="font-family: var(--font-sans); font-size: 0.73rem; line-height: 1.35; color: var(--text-bright); margin: 0;">
              ${esc(ep?.objective || 'Dismantle the Fifth Guild\'s sabotage across all research stations in this sector.')}
            </p>
          </div>

          <p style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.85rem;">
            Walk to any bench on ${esc(world.world)} and press [E], or select an exploration site below.
          </p>

          <ul class="learn-site-list">
            ${world.quests.map(q => {
              const st = questStatus(world, q);
              const tag = STATUS_TAG[st] || STATUS_TAG.charted;
              const qp = questProgress(q);
              const enterable = st === 'open' || st === 'complete';
              return `
                <li class="learn-site-row learn-${st}">
                  <span class="learn-site-index">${String(q.index + 1).padStart(2, '0')}</span>
                  <span class="learn-site-body">
                    <span class="learn-site-title">${esc(q.title)}</span>
                    <span class="learn-site-line" style="font-size: 0.72rem; color: var(--text-secondary);">${esc(q.line)}</span>
                    <span class="eyebrow learn-site-meta">
                      ${q.stageCount ? `${q.stageCount} stages` : ''}${qp.complete ? ' · Cleared' : qp.cleared ? ` · ${qp.cleared}/${qp.total}` : ''}
                    </span>
                  </span>
                  ${enterable
                    ? `<a href="#/learn/${esc(world.id)}/${esc(q.id)}" class="btn-primary quest-btn-sm learn-site-open m-tap" style="text-decoration: none;">${qp.complete ? 'Replay' : 'Play'}</a>`
                    : `<span class="tag ${tag.cls}">${tag.label}</span>`}
                </li>
              `;
            }).join('')}
          </ul>

          ${worldHasPractice(world) ? `
            <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-durasteel); display: flex; justify-content: space-between; align-items: center;">
              <span class="eyebrow">WORLD PROBLEM SET</span>
              ${practiceKey(world)}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  // Wire up collapsing
  const hud = container.querySelector('.learn-walk-hud');
  const toggleBtn = container.querySelector('.learn-walk-toggle');
  const expandBtn = container.querySelector('#learn-walk-expand');

  const setCollapsed = (collapsed) => {
    hud?.classList.toggle('collapsed', collapsed);
    sessionStorage.setItem('avalon_learn_hud_collapsed', collapsed ? '1' : '0');
  };

  toggleBtn?.addEventListener('click', () => setCollapsed(true));
  expandBtn?.addEventListener('click', () => setCollapsed(false));

  // Wire up popup
  const scrim = container.querySelector('#learn-sites-popup-scrim');
  const openSitesBtn = container.querySelector('#learn-sites-trigger');
  const closeSitesBtn = container.querySelector('#close-sites-popup-btn');

  const openSitesPopup = () => {
    if (scrim) {
      scrim.classList.remove('hidden');
      closeSitesBtn?.focus?.();
    }
  };

  const closeSitesPopup = () => {
    if (scrim) {
      scrim.classList.add('hidden');
      openSitesBtn?.focus?.();
    }
  };

  openSitesBtn?.addEventListener('click', openSitesPopup);
  closeSitesBtn?.addEventListener('click', closeSitesPopup);

  scrim?.addEventListener('click', (e) => {
    if (e.target === scrim) closeSitesPopup();
  });

  container.querySelector('#learn-story-trigger')?.addEventListener('click', () => {
    openWorldStoryModal(world);
  });
  container.querySelector('#sites-story-popup-btn')?.addEventListener('click', () => {
    openWorldStoryModal(world);
  });

  const onKeydown = (e) => {
    if (e.key === 'Escape' && scrim && !scrim.classList.contains('hidden')) {
      closeSitesPopup();
    }
  };
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('hashchange', () => window.removeEventListener('keydown', onKeydown), { once: true });
}
