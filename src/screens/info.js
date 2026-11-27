/**
 * info.js — The Info page: README.md, rendered as a plain reading column.
 *
 * The page text is README.md itself, imported raw at build time, so the two
 * never drift. Edit the README to change this page.
 */

import readme from '../../README.md?raw';
import { stage } from '../three/stage.js';
import { renderMarkdown } from '../ui/markdown.js';

export function renderInfo(container) {
  if (stage.cameraRig) stage.cameraRig.moveTo('bridge');

  const { html } = renderMarkdown(readme);

  container.innerHTML = `
    <div class="m-screen m-info">
      <article class="info-doc">${html}</article>
    </div>
  `;
}
