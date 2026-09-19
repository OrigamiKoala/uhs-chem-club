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
  window.addEventListener('tallow:interact', e => {
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
    w3d.enter(stage, fromQuest || null);
    sessionStorage.removeItem('avalon_learn_last_site');
    w3d.syncProgress(stage, questId => {
      const q = world.quests.find(x => x.id === questId);
      return q ? isQuestComplete(q) : false;
    });
    renderWalkHud(container, world);
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
        actions: `<a href="#/learn" class="btn-secondary" style="text-decoration: none;">All Worlds</a>`
      })}

      <section class="glass-panel learn-world-brief">
        <div class="m-head learn-brief-head">
          <span class="eyebrow lit">${esc(world.title)}</span>
          <span class="tag ${(STATUS_TAG[wStatus] || STATUS_TAG.charted).cls}">${(STATUS_TAG[wStatus] || STATUS_TAG.charted).label}</span>
        </div>
        <p class="learn-brief-body">${esc(world.brief)}</p>
        <div class="eyebrow learn-brief-count">
          ${world.questCount} quests${prog.liveTotal ? ` · ${prog.questsComplete} of ${prog.liveTotal} complete` : ''}
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
}

/**
 * The HUD worn while walking a Learn world.
 */
function renderWalkHud(container, world) {
  const prog = worldProgress(world);

  container.innerHTML = `
    <div class="learn-walk-hud" data-world="${esc(world.id)}">
      <div class="learn-walk-card">
        <div class="eyebrow lit">${esc(world.unit)}</div>
        <div class="learn-walk-name">${esc(world.world)}</div>
        <p class="learn-walk-line">${esc(world.line)}</p>
        <a href="#/learn" class="btn-secondary quest-btn-sm learn-walk-back" style="text-decoration: none;">All Worlds</a>
      </div>

      <div class="learn-walk-card learn-walk-sites">
        <div class="eyebrow">Sites</div>
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
                  <span class="eyebrow learn-site-meta">
                    ${q.stageCount ? `${q.stageCount} stages` : ''}${qp.complete ? ' · Cleared' : qp.cleared ? ` · ${qp.cleared}/${qp.total}` : ''}
                  </span>
                </span>
                ${enterable
                  ? `<a href="#/learn/${esc(world.id)}/${esc(q.id)}" class="btn-primary quest-btn-sm learn-site-open" style="text-decoration: none;">${qp.complete ? 'Replay' : 'Play'}</a>`
                  : `<span class="tag ${tag.cls}">${tag.label}</span>`}
              </li>
            `;
          }).join('')}
        </ul>
      </div>
    </div>
  `;
}
