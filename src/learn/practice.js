/**
 * practice.js — The problem set a Learn world ends on.
 *
 * WHY IT IS AT THE END OF THE WORLD AND NOT THE END OF A QUEST
 * The quests are the teaching. A quest ends on its debrief, the player walks out
 * onto the flat, and the next bench is open — putting a quiz between those two
 * moments turns a road into a gate. So the problems wait at the end of the
 * WORLD: five per quest, all of them together, once every bench in that unit has
 * been worked. By then the player has met every idea the set asks about.
 *
 * THREE RULES, AND THEY ARE THE PRODUCT
 *   1. The problems are OPTIONAL. Nothing is locked behind them: the next world
 *      opens on the last quest's completion, whether or not a single question is
 *      answered. A study aid that gates the road is a test, and this is not one.
 *   2. They are SKIPPABLE at every point — a question at a time, or the whole set.
 *   3. They COME BACK. Once a world is complete its row carries a Problems key on
 *      the star map and on the Learn road, for as long as the account exists.
 *
 * They are a 2D overlay on every tier, including T4. A player standing on Tallow
 * reads them on a card over the world, not on a screen bolted to a bench: these
 * are the player's own revision, not a transmission from anybody, and there is no
 * instrument in the fiction that asks multiple-choice questions.
 *
 * NO XP, EVER. Like the rest of the Learn track, nothing here calls session.addXp
 * or touches progress — `verify:learn` fails the build if it does.
 */

import { showModal, closeModal } from '../ui/modal.js';
import { esc } from '../ui/layout.js';
import { soundscape } from '../audio/soundscape.js';
import { loadQuestModule, PROBLEMS_PER_QUEST } from './curriculum.js';
import { isQuestComplete } from './progress.js';
import { session } from '../session.js';

/* Re-exported so a caller that has the problem screen does not also need the
   registry just to know how long a set is. */
export { PROBLEMS_PER_QUEST };

/** The flag that records "this world's set has been offered once already". */
export function practiceOfferedFlag(worldId) {
  return `learnPracticeOffered:${worldId}`;
}

/**
 * Every problem in a world, in road order, each stamped with the quest it came
 * from. Quests that are still charts contribute nothing — the set is as long as
 * the world is built, never padded.
 *
 * @param {object} world a world from `curriculum.WORLDS`
 * @returns {Promise<Array<{question, options, answer, explanation, questTitle, questId}>>}
 */
export async function loadWorldPractice(world) {
  if (!world) return [];
  const live = world.quests.filter(q => q.status === 'live');
  const mods = await Promise.all(live.map(q => loadQuestModule(q)));
  const out = [];
  live.forEach((quest, i) => {
    const set = mods[i] && Array.isArray(mods[i].PRACTICE) ? mods[i].PRACTICE : [];
    for (const p of set) {
      out.push({ ...p, questId: quest.id, questTitle: quest.title });
    }
  });
  return out;
}

/**
 * True when this world has a problem set worth opening: it is finished, and at
 * least one of its quests shipped one.
 */
export function worldHasPractice(world) {
  if (!world) return false;
  const live = world.quests.filter(q => q.status === 'live');
  return live.length > 0 && live.every(isQuestComplete);
}

/**
 * Run the set.
 *
 * @param {object} world
 * @param {{onDone?: Function}} [opts]
 */
export async function openWorldPractice(world, opts = {}) {
  const problems = await loadWorldPractice(world);
  if (!problems.length) {
    opts.onDone?.();
    return;
  }
  session.setFlag(practiceOfferedFlag(world.id), true);
  runSet(world, problems, opts.onDone);
}

/* ------------------------------------------------------------------
   THE OVERLAY
   ------------------------------------------------------------------ */

function runSet(world, problems, onDone) {
  let i = 0;
  let picked = null;
  let right = 0;
  let answered = 0;
  const total = problems.length;

  const finish = () => {
    closeModal();
    soundscape.playNavRelayClick?.();
    onDone?.();
  };

  const summary = () => {
    showModal(`
      <div class="quest-modal-head lq-modal-head" style="margin-bottom: 0.85rem;">
        <div>
          <div class="eyebrow lit">Practice · ${esc(world.world)}</div>
          <h2 id="lq-practice-title" class="section-title">Set Complete</h2>
        </div>
      </div>
      <p class="lq-practice-summary">
        ${answered
          ? `You answered ${right} of ${answered} correctly.`
          : 'You skipped every question. The set stays on the star map whenever you want it.'}
      </p>
      <p class="lq-practice-note">These problems pay no XP and never reach Standings. Open them again any time from the star map.</p>
      <div class="debrief-controls-left lq-modal-keys">
        <button type="button" class="btn-primary" data-practice="close">Close</button>
      </div>
    `, { dismissible: true, labelledBy: 'lq-practice-title', onClose: () => onDone?.() });
    document.querySelector('[data-practice="close"]')?.addEventListener('click', finish);
  };

  const advance = () => {
    i++;
    if (i >= total) summary();
    else render();
  };

  const render = () => {
    picked = null;
    const p = problems[i];

    showModal(`
      <div class="quest-modal-head lq-modal-head lq-practice-head">
        <div>
          <div class="eyebrow lit">Practice · ${esc(p.questTitle)}</div>
          <h2 id="lq-practice-title" class="section-title lq-practice-question">${esc(p.question)}</h2>
        </div>
        <div class="lq-practice-head-keys">
          <span class="tag">${i + 1} / ${total}</span>
          <button type="button" class="btn-secondary quest-btn-sm lq-practice-close"
                  data-practice="quit" title="Skip the rest of these problems"
                  aria-label="Skip the rest of these problems and close">Close</button>
        </div>
      </div>

      <div class="lq-practice-options">
        ${p.options.map(o => `
          <button type="button" class="choice-option lq-practice-opt" data-opt="${esc(o.id)}">
            ${esc(o.label)}
          </button>
        `).join('')}
      </div>

      <div id="lq-practice-feedback" class="lq-practice-feedback"></div>

      <div class="debrief-controls-left lq-modal-keys lq-practice-keys">
        <button type="button" class="btn-secondary" data-practice="quit">Skip All</button>
        <button type="button" class="btn-secondary" data-practice="skip">Skip This One</button>
        <button type="button" class="btn-primary" data-practice="next" disabled>
          ${i < total - 1 ? 'Next' : 'Finish'}
        </button>
      </div>
    `, { dismissible: false, labelledBy: 'lq-practice-title' });

    const modal = document.getElementById('modal-container');
    if (!modal) return;

    // BOTH close keys leave the WHOLE set, not just this question: the one in
    // the corner of the card and the one in the key row are the same action.
    // Practice gates nothing, so walking out of it costs the player nothing and
    // must never take more than one press.
    modal.querySelectorAll('[data-practice="quit"]')
      .forEach(btn => btn.addEventListener('click', finish));
    modal.querySelector('[data-practice="skip"]')?.addEventListener('click', () => {
      soundscape.playCrtTick?.();
      advance();
    });

    const nextBtn = modal.querySelector('[data-practice="next"]');
    const skipBtn = modal.querySelector('[data-practice="skip"]');

    modal.querySelectorAll('.lq-practice-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        if (picked) return;
        picked = btn.dataset.opt;
        answered++;
        const correct = picked === p.answer;
        if (correct) right++;

        modal.querySelectorAll('.lq-practice-opt').forEach(b => {
          if (b.dataset.opt === p.answer) b.classList.add('correct');
          else if (b.dataset.opt === picked) b.classList.add('incorrect');
          b.disabled = true;
        });

        const fb = modal.querySelector('#lq-practice-feedback');
        if (fb) {
          // The explanation is the reason the set exists: a wrong answer that is
          // only marked wrong teaches nothing.
          fb.innerHTML = `
            <div class="lq-practice-verdict ${correct ? 'correct' : 'incorrect'}">
              <span class="lq-practice-mark" aria-hidden="true">${correct ? '//' : '!!'}</span>
              <span class="lq-practice-verdict-body">
                <strong>${correct ? 'Correct.' : 'Not this one.'}</strong> ${esc(p.explanation)}
              </span>
            </div>
          `;
        }

        if (skipBtn) skipBtn.hidden = true;
        if (nextBtn) nextBtn.disabled = false;
        (correct ? soundscape.playBondSnap : soundscape.playMissBuzzer)?.call(soundscape);
      });
    });

    nextBtn?.addEventListener('click', () => {
      soundscape.playCrtTick?.();
      advance();
    });
  };

  render();
}
