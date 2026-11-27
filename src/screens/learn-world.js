/**
 * learn-world.js — One Learn world: its quests, in the order they are played.
 *
 * A quest here is a game with its own module. This screen only decides which are
 * open and hands the player into them.
 */

import { stage } from '../three/stage.js';
import { pageHeader, esc } from '../ui/layout.js';
import { getWorld, getQuest, WORLDS, ARENAS } from '../learn/curriculum.js';
import { benchWorked, worldDeepWorked, deepRefs } from '../learn/bank.js';
import { openWorkedProblem, isWorkedDone } from '../ui/worked-open.js';
import { worldStatus, worldProgress, questStatus, questProgress, nextQuest, isQuestComplete } from '../learn/progress.js';
import { canWalk, world3dFor } from '../learn/worlds3d.js';
import { openWorldPractice, worldHasPractice, practiceOfferedFlag } from '../learn/practice.js';
import { openWorldStoryModal } from '../story/story-modal.js';
import { getEpisode } from '../story/saga.js';
import { session } from '../session.js';
import { showToast } from '../ui/toast.js';

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
/**
 * Open a bench on a walkable world, playing its in-world opening scene first when it has one
 * (`three/mystery/director.js`). Shared by walking up with [E] and teleporting from the Sites list.
 */
function openSiteWithIntro(worldId, site) {
  const open = () => {
    if (window.location.hash.replace(/^#\/?/, '') === `learn/${worldId}`) {
      window.location.hash = `#/learn/${worldId}/${site.questId}`;
    }
  };
  const play = stage?.playIntro ? stage.playIntro(site, worldId) : Promise.resolve(false);
  play.catch(() => false).then(open);
}

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
    openSiteWithIntro(worldId, site);
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
function maybeOfferStory(world, { returningFromBench = false } = {}) {
  if (returningFromBench) return;
  // In 2D / non-voyage arrival (no pre-flight takeoff), show the world briefing on entry.
  openWorldStoryModal(world);
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
  // An offer, said once, in the corner. The questions are in the Drill Deck.
  session.setFlag(practiceOfferedFlag(world.id), true);
  showToast(`${world.world} is worked. Its questions are now in Practice.`, 'info');
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

/* ---------------------------------------------------------------
   WORKED PROBLEMS ON THE ROAD
   A bench's own worked problem reopens from its row once the bench is
   cleared. AP and Olympiad problems sit right after the last bench they
   draw on (`after` in bank/worked-deep.json) and open once every one of
   those benches is cleared.
   --------------------------------------------------------------- */

/** The worked problems this world's road shows: { bench: Map<questId, wk>, deep: Map<questId, wk[]>, byId }. */
function roadWorked(world) {
  const bench = new Map();
  const deep = new Map();
  const byId = new Map();
  for (const q of world.quests) {
    const wk = q.status === 'live' ? benchWorked(world, q.id) : null;
    if (wk) { bench.set(q.id, wk); byId.set(wk.id, wk); }
  }
  for (const wk of worldDeepWorked(world, WORLDS)) {
    if (!deep.has(wk.anchorQuestId)) deep.set(wk.anchorQuestId, []);
    deep.get(wk.anchorQuestId).push(wk);
    byId.set(wk.id, wk);
  }
  for (const list of deep.values()) list.sort((a, b) => (a.tier === b.tier ? 0 : a.tier === 'ap' ? -1 : 1));
  return { bench, deep, byId };
}

/** The benches a deep problem draws on, named for this world's reader, and whether all are cleared. */
function deepNeeds(wk, world) {
  const refs = deepRefs(wk).map(r => {
    const q = getQuest(r.worldId, r.questId);
    const w = getWorld(r.worldId);
    const name = q ? (r.worldId === world.id ? q.title : `${w?.world || r.worldId}: ${q.title}`) : r.questId;
    return { name, done: q ? isQuestComplete(q) : false };
  });
  return { refs, open: refs.length > 0 && refs.every(r => r.done) };
}

function andList(names) {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function workedTag(id) {
  const done = isWorkedDone(id);
  return `<span class="tag${done ? ' live' : ''}" data-worked-tag="${esc(id)}"${done ? '' : ' hidden'}>Worked</span>`;
}

/** One AP / Olympiad problem as a road row. `site` picks the Sites-list markup. */
function deepRowHtml(wk, world, { site = false } = {}) {
  const { refs, open } = deepNeeds(wk, world);
  const mark = wk.tier === 'olympiad' ? 'OLY' : 'AP';
  const line = open
    ? `${wk.steps.length} steps. Uses ${andList(refs.map(r => r.name))}.`
    : `Opens after ${andList(refs.filter(r => !r.done).map(r => r.name))}.`;
  const tags = `${wk.tier === 'olympiad' ? '<span class="tag tag-dim">Beyond AP</span>' : ''}${workedTag(wk.id)}`;
  const action = open
    ? `<button type="button" class="btn-secondary${site ? ' quest-btn-sm' : ''} learn-worked-open m-tap" data-open-worked="${esc(wk.id)}">Open</button>`
    : `<span class="tag locked">Locked</span>`;
  if (site) {
    return `
      <li class="learn-site-row learn-site-worked learn-worked-${wk.tier}${open ? '' : ' learn-locked'}">
        <span class="learn-site-index learn-worked-mark">${mark}</span>
        <span class="learn-site-body">
          <span class="learn-site-title">${esc(wk.title)}</span>
          <span class="learn-site-line">${esc(line)}</span>
        </span>
        <span class="learn-worked-actions">${tags}${action}</span>
      </li>`;
  }
  return `
    <article class="plate learn-worked-row learn-worked-${wk.tier}${open ? '' : ' learn-locked'}">
      <div class="learn-worked-mark">${mark}</div>
      <div class="learn-worked-body">
        <div class="learn-worked-head">
          <h3 class="learn-worked-title">${esc(wk.title)}</h3>
          <div class="learn-worked-tags">${tags}</div>
        </div>
        <p class="learn-worked-line">${esc(line)}</p>
      </div>
      <div class="learn-worked-action">${action}</div>
    </article>`;
}

/** The key on a cleared bench's row that reopens its own worked problem. */
function benchWorkedKey(wk, { site = false } = {}) {
  if (!wk) return '';
  return `<button type="button" class="btn-secondary${site ? ' quest-btn-sm' : ''} learn-worked-open m-tap" data-open-worked="${esc(wk.id)}" title="${esc(wk.title)}">Worked problem</button>`;
}

/** Wire every worked-problem key inside `root`. `before` and `after` hide and restore a covering panel. */
function bindWorkedKeys(root, road, { before, after } = {}) {
  root.querySelectorAll('[data-open-worked]').forEach(btn => {
    btn.addEventListener('click', () => {
      const wk = road.byId.get(btn.dataset.openWorked);
      if (!wk) return;
      before?.();
      openWorkedProblem(wk, {
        onClose: () => {
          if (isWorkedDone(wk.id)) {
            root.querySelectorAll(`[data-worked-tag="${CSS.escape(wk.id)}"]`).forEach(t => { t.hidden = false; t.classList.add('live'); });
          }
          after?.();
        }
      });
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
    const nq = nextQuest(world) || world.quests[0];
    const targetSite = nq ? w3d.siteForQuest(nq.id) : null;
    if (targetSite) {
      const at = targetSite.approachPos || targetSite.pos;
      stage.setWorldWaypoint({ x: at[0], z: at[2], label: targetSite.label, siteId: targetSite.id });
    }
    renderWalkHud(container, world);
    bindPracticeKeys(container);
    maybeOfferPractice(world);
    return;
  }

  if (stage.cameraRig) {
    stage.cameraRig.moveTo('starmap');
  }

  const wStatus = worldStatus(world);
  const prog = worldProgress(world);
  const resume = nextQuest(world);
  const road = roadWorked(world);

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
          <a href="#/learn" class="btn-secondary" style="text-decoration: none;">All Worlds</a>
        `
      })}

      <section class="glass-panel learn-world-brief">
        <div class="m-head learn-brief-head">
          <span class="eyebrow lit">${esc(world.title)}</span>
          <div style="display: flex; gap: 0.4rem; align-items: center;">
            ${world.beyondAp ? '<span class="tag tag-dim">Beyond AP</span>' : ''}
            <span class="tag ${(STATUS_TAG[wStatus] || STATUS_TAG.charted).cls}">${(STATUS_TAG[wStatus] || STATUS_TAG.charted).label}</span>
          </div>
        </div>
        ${getEpisode(world.id)?.arrival ? `<p style="font-size: 0.88rem; line-height: 1.45; color: var(--accent-amber); margin: 0 0 0.45rem;">${esc(getEpisode(world.id).arrival)}</p>` : ''}
        <p class="learn-brief-body">${esc(world.brief)}</p>
        <div class="learn-brief-foot">
          <div class="eyebrow learn-brief-count">
            ${world.questCount} quests${prog.liveTotal ? ` · ${prog.questsComplete} of ${prog.liveTotal} complete` : ''}
          </div>
          <div style="display: flex; gap: 0.4rem; align-items: center;">
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
                  <div style="display: flex; gap: 0.35rem; align-items: center;">
                    ${q.beyondAp ? '<span class="tag tag-dim">Beyond AP</span>' : ''}
                    <span class="tag ${tag.cls}">${tag.label}</span>
                  </div>
                </div>
                <p class="learn-quest-line">${esc(q.line)}</p>
                <div class="eyebrow learn-quest-meta">
                  ${q.stageCount ? `${q.stageCount} stages` : ''}${qp.complete ? ' · Cleared' : qp.cleared ? ` · ${qp.cleared}/${qp.total}` : ''}
                </div>
              </div>

              <div class="learn-quest-action" style="display: flex; gap: 0.4rem; align-items: center;">
                ${qp.complete ? benchWorkedKey(road.bench.get(q.id)) : ''}
                ${enterable
                  ? `<a href="#/learn/${esc(world.id)}/${esc(q.id)}" class="btn-primary learn-enter m-tap" style="text-decoration: none;">${qp.complete ? 'Replay' : 'Play'}</a>`
                  : `<span class="eyebrow learn-quest-blocked">${st === 'locked' ? 'Locked' : 'Coming soon'}</span>`}
              </div>
            </article>
            ${(road.deep.get(q.id) || []).map(wk => deepRowHtml(wk, world)).join('')}
          `;
        }).join('')}
      </div>
    </div>
  `;

  bindPracticeKeys(container);
  bindWorkedKeys(container, road);
  maybeOfferPractice(world);
  maybeOfferStory(world, { returningFromBench: Boolean(sessionStorage.getItem('avalon_learn_last_site')) });
}

/**
 * The HUD worn while walking a Learn world.
 * Matches Erebus HUD look and positioning (bottom-left corner, easily collapsible,
 * with popup modal for sites directory).
 */
function renderWalkHud(container, world) {
  const prog = worldProgress(world);
  const road = roadWorked(world);
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

        <div class="learn-walk-name" style="display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap;">
          <span>${esc(world.world)}</span>
          ${world.beyondAp ? '<span class="tag tag-dim" style="font-size: 0.58rem; padding: 1px 5px;">Beyond AP</span>' : ''}
        </div>
        <p class="learn-walk-line">${esc(world.line)}</p>
        ${ep?.arrival ? `<p class="learn-walk-mystery" style="font-size: 0.74rem; line-height: 1.35; color: var(--accent-amber); margin: 0.3rem 0 0.45rem;">${esc(ep.arrival)}</p>` : ''}

        <div class="learn-walk-prog">
          Quests: ${prog.questsComplete} of ${total} Cleared
        </div>

        <div class="learn-walk-hint">
          WASD: Move · Drag: Look · E: Interact
        </div>

        <div class="learn-walk-keys">
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
              <div style="display: flex; align-items: center; gap: 0.4rem;">
                <span class="eyebrow lit">${esc(world.unit.toUpperCase())}</span>
                ${world.beyondAp ? '<span class="tag tag-dim" style="font-size: 0.58rem; padding: 1px 5px;">Beyond AP</span>' : ''}
              </div>
              <h2 id="learn-sites-popup-title" class="section-title" style="font-size: 1.1rem; margin-top: 2px;">
                ${esc(world.world.toUpperCase())} — EXPLORATION SITES
              </h2>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              ${total ? `<span class="tag ${prog.questsComplete >= total ? 'live' : 'warn'}">${prog.questsComplete} / ${total} CLEARED</span>` : ''}
              <button type="button" id="close-sites-popup-btn" class="terminal-close-btn" aria-label="Close sites panel">✕ CLOSE</button>
            </div>
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
                    <span class="learn-site-title" style="display: inline-flex; align-items: center; gap: 0.4rem;">
                      ${esc(q.title)}
                      ${q.beyondAp ? '<span class="tag tag-dim" style="font-size: 0.58rem; padding: 1px 5px;">Beyond AP</span>' : ''}
                    </span>
                    <span class="learn-site-line" style="font-size: 0.72rem; color: var(--text-secondary);">${esc(q.line)}</span>
                    <span class="eyebrow learn-site-meta">
                      ${q.stageCount ? `${q.stageCount} stages` : ''}${qp.complete ? ' · Cleared' : qp.cleared ? ` · ${qp.cleared}/${qp.total}` : ''}
                    </span>
                  </span>
                  <span style="display: inline-flex; gap: 0.35rem; align-items: center;">
                    ${qp.complete ? benchWorkedKey(road.bench.get(q.id), { site: true }) : ''}
                    ${enterable
                      ? `<a href="#/learn/${esc(world.id)}/${esc(q.id)}" data-quest-id="${esc(q.id)}" class="btn-primary quest-btn-sm learn-site-open m-tap" style="text-decoration: none;">${qp.complete ? 'Replay' : 'Play'}</a>`
                      : `<span class="tag ${tag.cls}">${tag.label}</span>`}
                  </span>
                </li>
                ${(road.deep.get(q.id) || []).map(wk => deepRowHtml(wk, world, { site: true })).join('')}
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
    if (stage.director?.active) return;
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
  // A worked problem opened from the Sites list takes the whole view; the list comes back when it closes.
  bindWorkedKeys(container, road, {
    before: () => scrim?.classList.add('hidden'),
    after: () => { if (scrim) { scrim.classList.remove('hidden'); closeSitesBtn?.focus?.(); } }
  });
  closeSitesBtn?.addEventListener('click', closeSitesPopup);

  // Teleporting to a bench from the Sites list still plays its opening scene first.
  container.querySelectorAll('.learn-site-open').forEach(link => {
    link.addEventListener('click', (e) => {
      const questId = link.dataset.questId;
      if (!questId) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const w3d = world3dFor(world.id);
      const site = w3d?.siteForQuest(questId);
      if (!site || site.built === false) return;
      e.preventDefault();
      if (stage.director?.active) return;
      if (scrim) scrim.classList.add('hidden');
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      stage.setWorldWaypoint?.(null);
      if (site.approachPos && site.pos) w3d.enter(stage, null, site.approachPos, site.pos);
      else w3d.enter(stage, site.id);
      openSiteWithIntro(world.id, site);
    });
  });

  scrim?.addEventListener('click', (e) => {
    if (e.target === scrim) closeSitesPopup();
  });

  const onKeydown = (e) => {
    if (e.key === 'Escape' && scrim && !scrim.classList.contains('hidden')) {
      closeSitesPopup();
    }
  };
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('hashchange', () => window.removeEventListener('keydown', onKeydown), { once: true });
}
