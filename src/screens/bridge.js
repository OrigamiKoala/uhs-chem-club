/**
 * bridge.js — Command Bridge dashboard & 3D Helm Terminal (T4)
 *
 * Implements:
 * - In T4: in-world tactical helm terminal overlay with 3D bridge view and Star Map integration.
 * - In lower tiers: full-screen bridge dashboard page.
 */

import { session, levelProgress, levelTitle } from "../session.js";
import { stage } from "../three/stage.js";
import { pageHeader, statRow, esc } from "../ui/layout.js";
import { TOTAL_STAGES, TOTAL_QUEST_XP } from "../quest3d/evaluator.js";
import { renderGardensMap } from "../ui/gardens-map.js";
import { QUEST1_STORY } from "../story/quest1.js";
import { tierManager } from "../three/tier.js";

let unsubscribeBridge = null;

export function renderBridge(container) {
  if (unsubscribeBridge) {
    unsubscribeBridge();
    unsubscribeBridge = null;
  }

  if (stage.cameraRig && tierManager.currentTier !== "T4") {
    stage.cameraRig.moveTo("bridge");
  }

  function stagesCleared() {
    const prog = (session.progress || []).find(p => p.quest_id === "q1");
    let reached = prog && typeof prog.stage_reached === "number" ? Number(prog.stage_reached) : 0;
    try {
      const local = parseInt(localStorage.getItem("avalon_q1_stage_reached"), 10);
      if (!isNaN(local)) reached = Math.max(reached, local);
    } catch (e) {}
    return Math.max(0, Math.min(reached, TOTAL_STAGES));
  }

  function getBridgeTransmission(cleared) {
    if (cleared >= TOTAL_STAGES) {
      return QUEST1_STORY.debrief.lines[0];
    }
    if (cleared === 0) {
      const tid = session.teamId || "neutral";
      return QUEST1_STORY.guildOpeners[tid] || QUEST1_STORY.guildOpeners.neutral;
    }
    const pylon = QUEST1_STORY.pylons[cleared];
    return pylon?.transmission || "Pylon " + (cleared + 1) + " awaits connection. Check the gauges before you commit.";
  }

  function render() {
    const p = session.player || {};
    const t = session.team || {};
    const activeEv = session.events ? session.events[session.teamId] : null;
    const prog = levelProgress(session.xp || 0);
    const cleared = stagesCleared();
    const isComplete = cleared >= TOTAL_STAGES;
    const currentPylonNum = Math.min(cleared + 1, TOTAL_STAGES);
    const transmissionText = getBridgeTransmission(cleared);
    const isT4 = tierManager.currentTier === "T4";

    if (isT4) {
      container.innerHTML = `
        <div class="in-world-terminal bridge-terminal">
          <div class="terminal-header">
            <div>
              <span class="eyebrow lit">// STARSHIP HELM //</span>
              <h2 class="section-title" style="font-size: 1.15rem; margin-top: 2px;">COMMAND BRIDGE TERMINAL</h2>
            </div>
            <button type="button" id="close-bridge-terminal-btn" class="terminal-close-btn">[X] FREE WALK</button>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
            <div>
              <div style="font-family: var(--font-imperial); font-size: 1.1rem; color: var(--text-bright); text-transform: uppercase;">
                ${esc(p.display_name || "Cadet")}
              </div>
              <div class="eyebrow" style="font-size: 0.68rem;">${esc(t.name || t.team_id || "Unassigned")} GUILD · LVL ${prog.level} ${levelTitle(prog.level).toUpperCase()}</div>
            </div>
            <div class="tag live">${session.xp || 0} XP</div>
          </div>

          <!-- Transmission Box -->
          <div style="padding: 0.75rem 0.9rem; background: var(--plate-100); border: 1px solid var(--border-durasteel); border-left: 2px solid var(--accent-amber); margin-bottom: 1.1rem;">
            <div class="eyebrow lit" style="font-size: 0.6rem; margin-bottom: 0.25rem;">VESS // BRIDGE TRANSMISSION</div>
            <p style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--accent-gold); margin: 0; line-height: 1.45;">
              "${esc(transmissionText)}"
            </p>
          </div>

          <!-- Mission Hub Pointer -->
          <div class="glass-panel" style="margin-bottom: 1.1rem; padding: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
              <span class="eyebrow lit">MISSION HUB</span>
              <span class="tag ${isComplete ? "live" : "warn"}">${cleared} / ${TOTAL_STAGES} PYLONS</span>
            </div>
            <div style="font-size: 0.9rem; font-weight: 700; color: var(--text-bright); margin-bottom: 0.4rem;">
              SECTOR 01 · THE CHARGE GARDENS
            </div>
            <p style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 0.8rem;">
              All mission briefings and cartography are integrated into the Star Map holo-table.
            </p>
            <a href="#/starmap" class="btn-primary" style="display: block; text-align: center; text-decoration: none; font-size: 0.78rem; padding: 9px 12px;">
              ACCESS STAR MAP (MISSION CARTOGRAPHY)
            </a>
          </div>

          <!-- Compartment Decks Quick Access -->
          <div style="border-top: 1px solid var(--border-durasteel); padding-top: 0.8rem;">
            <div class="eyebrow" style="margin-bottom: 0.5rem;">COMPARTMENTS</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              <a href="#/starmap" class="btn-secondary" style="font-size: 0.7rem; text-decoration: none; text-align: center;">Star Map</a>
              <a href="#/leaderboard" class="btn-secondary" style="font-size: 0.7rem; text-decoration: none; text-align: center;">Fleet Comms</a>
              <a href="#/inventory" class="btn-secondary" style="font-size: 0.7rem; text-decoration: none; text-align: center;">Cargo Hold</a>
              <a href="#/quarters" class="btn-secondary" style="font-size: 0.7rem; text-decoration: none; text-align: center;">Quarters</a>
            </div>
          </div>
        </div>
      `;

      container.querySelector("#close-bridge-terminal-btn")?.addEventListener("click", () => {
        const term = container.querySelector(".in-world-terminal");
        if (term) term.style.display = "none";
      });
      return;
    }

    container.innerHTML = `
      <div class="screen-container m-screen m-bridge">
        ${pageHeader({
          art: "/art/bridge.jpg",
          video: "/video/cockpit_loop.webm",
          eyebrow: esc(t.name || t.team_id || "Unassigned") + " Guild",
          title: esc(p.display_name || "Explorer"),
          actions: statRow([
            { label: "Total XP", value: `${session.xp || 0}` },
            { label: "Level", value: `${prog.level} · ${levelTitle(prog.level)}`, plain: true },
            { label: "To next level", value: `${Math.max(0, prog.needed - prog.into)} XP`, plain: true }
          ])
        })}

        <div class="m-grid-1 bridge-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.5rem;">
          <section class="glass-panel">
            <div class="panel-banner bridge-quest-banner" style="height: 130px;">
              <video class="banner-video" poster="/art/crucible.jpg" playsinline autoplay loop muted preload="none">
                <source src="/video/crucible_loop.webm" type="video/webm">
              </video>
              <img src="/art/crucible.jpg" alt="The reaction chamber" loading="lazy" />
            </div>

            <div class="m-head" style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <span class="eyebrow lit">Sector 01 · Erebus</span>
              <span class="tag ${isComplete ? "live" : "warn"}">${isComplete ? "Complete" : cleared > 0 ? "Underway" : "Sealed"}</span>
            </div>

            <h2 class="section-title">The Charge Gardens</h2>
            <p class="page-sub" style="margin-bottom: 1.1rem;">Find what pulls. Draw the line.</p>

            <div class="cold-open-box m-inset" style="margin-bottom: 1.25rem; padding: 0.85rem 1rem; background: var(--plate-100); border: 1px solid var(--border-durasteel); border-left: 2px solid var(--accent-amber);">
              <div class="m-head" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <span class="eyebrow lit">VESS // TRANSMISSION</span>
                <span class="tag live" style="font-size: 0.58rem;">COMMS</span>
              </div>
              <p style="font-family: var(--font-mono); font-size: 0.78rem; line-height: 1.45; color: var(--accent-gold); margin: 0;">
                "${esc(transmissionText)}"
              </p>
            </div>

            <div style="margin-bottom: 1.25rem;">
              ${renderGardensMap({ clearedCount: cleared, currentStageIdx: isComplete ? null : cleared })}
            </div>

            ${statRow([
              { label: "Pylons", value: `${cleared} / ${TOTAL_STAGES}`, plain: true },
              { label: "Quest XP", value: TOTAL_QUEST_XP },
              { label: "Run time", value: "~30 min", plain: true }
            ])}

            <a href="#/quest" class="btn-primary bridge-quest-cta" style="width: 100%; text-decoration: none; margin-top: 1.25rem;">
              ${isComplete ? "Replay Gardens" : cleared > 0 ? `Pylon ${currentPylonNum} awaits` : "Begin · Pylon 1 awaits"}
            </a>
          </section>

          <section class="glass-panel">
            <span class="eyebrow">Guild Conditions</span>
            <h2 class="section-title" style="margin-top: 0.4rem;">
              ${activeEv ? esc(activeEv.name) : "All Clear"}
            </h2>
            ${activeEv && activeEv.description ? `<p class="page-sub" style="margin-bottom: 1rem;">${esc(activeEv.description)}</p>` : '<div style="margin-bottom: 1rem;"></div>'}

            ${activeEv ? `
              <div style="margin-bottom: 1.25rem;">
                <span class="tag ${activeEv.polarity === "bad" ? "danger" : activeEv.polarity === "good" ? "live" : ""}">
                  ${esc(String(activeEv.polarity || "neutral").toUpperCase())}
                </span>
              </div>
            ` : ""}

            <div style="border-top: 1px solid var(--border-durasteel); padding-top: 1.25rem; margin-top: 1.25rem;">
              <div class="eyebrow" style="margin-bottom: 0.8rem;">Decks</div>
              <div class="bridge-decks" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <a href="#/starmap" class="btn-secondary" style="font-size: 0.72rem; text-decoration: none;">Star Map</a>
                <a href="#/leaderboard" class="btn-secondary" style="font-size: 0.72rem; text-decoration: none;">Fleet Comms</a>
                <a href="#/inventory" class="btn-secondary" style="font-size: 0.72rem; text-decoration: none;">Inventory</a>
                <a href="#/quarters" class="btn-secondary" style="font-size: 0.72rem; text-decoration: none;">Crew</a>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;
  }

  render();

  unsubscribeBridge = session.subscribe(() => {
    if (!window.location.hash.includes("bridge")) {
      if (unsubscribeBridge) unsubscribeBridge();
      unsubscribeBridge = null;
      return;
    }
    render();
  });
}
