/**
 * learn-quest.js — Host for one Learn quest.
 *
 * The host does four things and nothing else: check the gating, load the quest's
 * game module, give it a container and a context, and record what it reports.
 * Everything a player sees inside the frame belongs to the quest module — each
 * Learn quest is a game, built the way the Charge Gardens was built.
 *
 * The host is also the wall between the Learn track and the campaign's XP rails.
 * It records stages and completions through `learn/progress.js` and the learn
 * endpoints, which pay nothing and never reach Standings.
 */

import { api } from '../api.js';
import { stage } from '../three/stage.js';
import { esc } from '../ui/layout.js';
import { getWorld, getQuest, loadQuestModule, ARENAS } from '../learn/curriculum.js';
import {
  isWorldOpen, isQuestOpen, isQuestComplete, questProgress,
  markStage, markQuestComplete
} from '../learn/progress.js';

/** The mounted game, so a navigation can tear it down. */
let active = null;

/** Called by the router whenever it leaves a learn quest route. */
export function disposeLearnQuest() {
  if (!active) return;
  try {
    active.mounted?.dispose?.();
  } catch (err) {
    console.error('Learn quest dispose failed:', err);
  }
  if (stage.mode === 'quest') stage.exitQuestScene();
  active = null;
}

function shell({ world, quest, body }) {
  const arena = ARENAS[quest.arena]?.label || '';
  return `
    <div class="screen-container m-screen m-learn-quest">
      <div class="learn-host-bar plate">
        <a href="#/learn/${esc(world.id)}" class="btn-secondary learn-host-back m-tap" style="text-decoration: none;">${esc(world.world)}</a>
        <div class="learn-host-id">
          <span class="eyebrow">${esc(world.unit)} · ${esc(arena)}</span>
          <span class="learn-host-title">${esc(quest.title)}</span>
        </div>
      </div>
      <div id="learn-quest-mount" class="learn-quest-mount">${body || ''}</div>
    </div>
  `;
}

/** Shown for a quest that is charted but has no game module yet. */
function buildPlate(world, quest) {
  return `
    <section class="glass-panel learn-build-plate">
      <div class="eyebrow">Charted</div>
      <h2 class="section-title">${esc(quest.title)}</h2>
      <p class="page-sub">${esc(quest.line)}</p>
      <div class="learn-build-note">
        <span class="banner-mark" aria-hidden="true">//</span>
        <span>This world is surveyed but the site is not built. ${esc(quest.stageCount ? `${quest.stageCount} stages planned.` : '')}</span>
      </div>
      <a href="#/learn/${esc(world.id)}" class="btn-secondary" style="text-decoration: none;">Back to ${esc(world.world)}</a>
    </section>
  `;
}

export function renderLearnQuest(container, params = {}) {
  disposeLearnQuest();

  const world = getWorld(params.worldId);
  if (!world) {
    window.location.hash = '#/learn';
    return;
  }

  const quest = getQuest(world.id, params.questId);
  if (!quest || !isWorldOpen(world)) {
    window.location.hash = `#/learn/${world.id}`;
    return;
  }

  // A quest that is sealed behind the one before it is never mounted. The world
  // screen is the only place that decides what a player may open.
  if (!isQuestOpen(world, quest) && !isQuestComplete(quest)) {
    window.location.hash = `#/learn/${world.id}`;
    return;
  }

  container.innerHTML = shell({ world, quest, body: '' });
  const mountPoint = container.querySelector('#learn-quest-mount');

  if (quest.status !== 'live') {
    mountPoint.innerHTML = buildPlate(world, quest);
    return;
  }

  const prog = questProgress(quest);

  const ctx = {
    world,
    quest,
    stagesCleared: prog.cleared,
    isComplete: prog.complete,

    /** One stage cleared. Local first; the server call is telemetry. */
    reportStage(stageIndex) {
      if (typeof stageIndex !== 'number') return;
      markStage(world.id, quest.id, stageIndex);
      api.learnStage(world.id, quest.id, stageIndex).catch(() => {});
    },

    /** The quest is finished. Idempotent — a replay records nothing new. */
    reportComplete() {
      markQuestComplete(world.id, quest.id);
      api.learnComplete(world.id, quest.id).catch(() => {});
    },

    exit() {
      window.location.hash = `#/learn/${world.id}`;
    }
  };

  const token = {};
  active = { world: world.id, quest: quest.id, token, mounted: null };

  loadQuestModule(quest).then(mod => {
    // The player may have navigated away while the module was in flight.
    if (!active || active.token !== token) return;
    if (!mod) {
      mountPoint.innerHTML = buildPlate(world, quest);
      return;
    }
    mountPoint.innerHTML = '';
    try {
      active.mounted = mod.mount(mountPoint, ctx) || null;
    } catch (err) {
      console.error(`Learn quest "${quest.key}" failed to mount:`, err);
      mountPoint.innerHTML = `
        <section class="glass-panel learn-build-plate">
          <div class="stage-error-banner">
            <span class="banner-mark" aria-hidden="true">!!</span>
            <span class="banner-body">This site would not come online. Try again, or take another quest.</span>
          </div>
          <a href="#/learn/${esc(world.id)}" class="btn-secondary" style="text-decoration: none;">Back to ${esc(world.world)}</a>
        </section>
      `;
    }
  });
}
