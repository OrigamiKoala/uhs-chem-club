/**
 * layout.js — Shared page furniture.
 *
 * Every screen builds its header, stat readouts and empty states from here so the
 * site reads as one continuous machine instead of seven separately-styled pages.
 */

/**
 * Standard screen header: banner art, kicker, title, one-line subtitle, actions.
 * @param {{art?: string, video?: string, artAlt?: string, eyebrow?: string, title: string, subtitle?: string, actions?: string, tall?: boolean}} opts
 */
export function pageHeader(opts = {}) {
  const { art, video, artAlt = '', eyebrow, title, subtitle, actions, tall } = opts;
  let videoSrcWebm = null;
  let videoSrcMp4 = null;
  if (video) {
    if (video.startsWith('/')) {
      videoSrcWebm = video.endsWith('.webm') ? video : video.replace(/\.[^.]+$/, '.webm');
      videoSrcMp4 = video.endsWith('.mp4') ? video : video.replace(/\.[^.]+$/, '.mp4');
    } else {
      videoSrcWebm = `/video/${video}.webm`;
      videoSrcMp4 = `/video/${video}.mp4`;
    }
  }

  return `
    <header class="glass-panel page-header">
      ${(art || video) ? `
        <div class="panel-banner ${tall ? 'tall' : ''}">
          ${video ? `
            <video class="banner-video" poster="${art || ''}" playsinline autoplay loop muted preload="auto">
              <source src="${videoSrcWebm}" type="video/webm">
              <source src="${videoSrcMp4}" type="video/mp4">
              ${art ? `<img src="${art}" alt="${artAlt}" loading="lazy" />` : ''}
            </video>
          ` : `
            <img src="${art}" alt="${artAlt}" loading="lazy" />
          `}
        </div>
      ` : ''}
      <div class="page-header-body">
        <div>
          ${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''}
          <h1 class="page-title">${title}</h1>
          ${subtitle ? `<p class="page-sub">${subtitle}</p>` : ''}
        </div>
        ${actions ? `<div class="page-actions">${actions}</div>` : ''}
      </div>
    </header>
  `;
}

/**
 * Readout strip of label/value pairs.
 * @param {Array<{label: string, value: string|number, plain?: boolean}>} tiles
 */
export function statRow(tiles = []) {
  return `
    <div class="stat-row">
      ${tiles.map(t => `
        <div class="stat-tile">
          <div class="stat-label">${t.label}</div>
          <div class="stat-value ${t.plain ? 'plain' : ''}">${t.value}</div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * The three-step signup journey rail, shared by register / onboarding.
 * @param {number} current 1 = account, 2 = team, 3 = bridge
 */
export function stepRail(current = 1) {
  const steps = [
    { n: 1, label: 'Account' },
    { n: 2, label: 'Guild' },
    { n: 3, label: 'Launch' }
  ];
  return `
    <nav class="step-rail" aria-label="Sign-up progress">
      ${steps.map((s, i) => `
        ${i > 0 ? '<span class="step-sep" aria-hidden="true">────</span>' : ''}
        <span class="step-node ${s.n === current ? 'active' : ''} ${s.n < current ? 'done' : ''}"
              ${s.n === current ? 'aria-current="step"' : ''}>
          <span class="step-num">${s.n < current ? '\u00b7' : s.n}</span>
          ${s.label}
        </span>
      `).join('')}
    </nav>
  `;
}

/**
 * Empty-state block for screens with nothing to show yet.
 */
export function emptyState({ icon = '[ ]', title, body, action = '' }) {
  return `
    <div class="glass-panel empty-state">
      <div class="empty-icon" aria-hidden="true">${icon}</div>
      <h2 class="section-title">${title}</h2>
      ${body ? `<p class="page-sub" style="margin: 0 auto 1.5rem;">${body}</p>` : ''}
      ${action}
    </div>
  `;
}

/** Escape untrusted text before inserting it into markup. */
export function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
