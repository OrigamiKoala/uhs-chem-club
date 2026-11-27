/**
 * learn.js — The Learn road: every AP Chemistry unit as a world, in order.
 *
 * This screen is a map, not a syllabus. It shows where a world is, what it is
 * called, the one line that says what it teaches, and whether it is open. The
 * teaching happens inside the quests, which are games.
 *
 * Nothing here mentions XP, because the Learn track pays none and never appears
 * in Standings.
 */

import { stage } from '../three/stage.js';
import { pageHeader, esc } from '../ui/layout.js';
import { WORLDS } from '../learn/curriculum.js';
import { worldStatus, worldProgress, isQuestComplete, nextQuest, currentWorld, trackProgress } from '../learn/progress.js';
import { practiceKey, bindPracticeKeys } from './learn-world.js';
import { openCampaignStoryModal } from '../story/story-modal.js';
import { getEpisode } from '../story/saga.js';

const STATUS_TAG = {
  open: { label: 'Open', cls: 'live' },
  complete: { label: 'Complete', cls: 'live' },
  locked: { label: 'Locked', cls: 'warn' },
  charted: { label: 'Coming soon', cls: 'locked' }
};

export function renderLearn(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('starmap');
  }

  const track = trackProgress();
  const resume = currentWorld();
  const resumeStatus = resume ? worldStatus(resume) : 'charted';
  const resumeQuest = resumeStatus === 'open' ? nextQuest(resume) : null;

  container.innerHTML = `
    <div class="screen-container m-screen m-learn">
      ${pageHeader({
        art: '/art/starmap.jpg',
        video: '/video/starmap_loop.webm',
        artAlt: '',
        title: 'Learn',
        actions: `
          <a href="#/briefing" class="btn-secondary quest-btn-sm m-tap learn-head-link">Briefing</a>
          <button type="button" class="btn-secondary quest-btn-sm m-tap learn-head-link" id="learn-campaign-story-btn">Prologue</button>
          ${resumeQuest
            ? `<a href="#/learn/${esc(resume.id)}" class="btn-primary learn-continue">Continue · ${esc(resume.world)}</a>`
            : ''}
        `
      })}

      <div class="learn-road">
        ${WORLDS.map(w => {
          const st = worldStatus(w);
          const tag = STATUS_TAG[st] || STATUS_TAG.charted;
          const prog = worldProgress(w);
          const enterable = st === 'open' || st === 'complete';
          // Only the world the player is on gets the painted key; the rest are
          // bare switches, so the eye lands on where they left off.
          const isResume = enterable && resume && resume.id === w.id;
          const arrival = getEpisode(w.id)?.arrival;
          return `
            <article class="plate learn-world-row learn-${st}${isResume ? ' is-resume' : ''}">
              <div class="learn-world-code">
                <span class="eyebrow">Unit</span>
                <span class="learn-code-num">${esc(w.code)}</span>
              </div>

              <div class="learn-world-body">
                <div class="learn-world-head">
                  <h2 class="learn-world-name">${esc(w.world)}</h2>
                  ${w.beyondAp || st !== 'open' ? `
                    <div class="learn-world-tags">
                      ${w.beyondAp ? '<span class="tag tag-dim">Beyond AP</span>' : ''}
                      ${st !== 'open' ? `<span class="tag ${tag.cls}">${tag.label}</span>` : ''}
                    </div>` : ''}
                </div>
                <p class="learn-world-line">${esc(w.line)}</p>
                ${arrival ? `<p class="learn-world-story">${esc(arrival)}</p>` : ''}
              </div>

              <div class="learn-world-meta">
                <div class="learn-meter" aria-hidden="true">
                  ${w.quests.map(q => {
                    const built = q.status === 'live';
                    const done = built && isQuestComplete(q);
                    return `<span class="learn-pip ${done ? 'done' : built ? 'built' : ''}" title="${esc(q.title)}${q.beyondAp ? ' (Beyond AP)' : ''}"></span>`;
                  }).join('')}
                </div>
                <div class="eyebrow learn-world-count">
                  ${prog.liveTotal ? `${prog.questsComplete} / ${prog.liveTotal} quests done` : `${w.questCount} quests`}
                </div>
                <div class="learn-world-keys">
                  ${enterable
                    ? `<a href="#/learn/${esc(w.id)}" class="${isResume ? 'btn-primary' : 'btn-secondary'} learn-enter m-tap learn-enter-btn" data-world-id="${esc(w.id)}">Enter</a>`
                    : `<span class="eyebrow learn-world-blocked">${st === 'locked' ? 'Locked' : 'Coming soon'}</span>`}
                  ${practiceKey(w)}
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    </div>
  `;

  bindPracticeKeys(container);

  container.querySelector('#learn-campaign-story-btn')?.addEventListener('click', () => {
    openCampaignStoryModal();
  });
}
