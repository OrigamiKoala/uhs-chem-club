/**
 * markdown.js — A small Markdown renderer for prose pages (the Info page).
 *
 * Covers what README.md uses: #/##/### headings, paragraphs, "- " lists,
 * **bold**, *italic*, [links](url), `code` and ```code```, backslash escapes
 * and two-space hard line breaks. A paragraph whose every line opens with a
 * link is rendered as a link list (link, then the text after it).
 */

import { esc } from './layout.js';

const ESCAPABLE = /\\([\\`*_{}\[\]()#+\-.!:|>~])/g;

export function slugify(text) {
  return String(text).toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const EXT_ICON = '<svg class="md-ext" width="9" height="9" viewBox="0 0 10 10" aria-hidden="true"><path d="M3.5 1.5h5v5M8.5 1.5 2 8" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="square"/></svg>';

/** Inline markup. Escaped characters are parked as tokens so they never parse. */
function inline(src) {
  const parked = [];
  const park = html => `\u0000${parked.push(html) - 1}\u0000`;

  let s = src.replace(ESCAPABLE, (_, ch) => park(esc(ch)));
  s = s.replace(/```([^`]+)```|`([^`]+)`/g, (_, a, b) => park(`<code>${esc(a ?? b)}</code>`));
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, href) => {
    const url = href.replace(/\u0000(\d+)\u0000/g, (m, i) => parked[i]);
    const external = /^https?:/i.test(url);
    return park(`<a href="${url}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${emphasis(text)}${external ? EXT_ICON : ''}</a>`);
  });
  s = emphasis(s);
  while (/\u0000\d+\u0000/.test(s)) s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => parked[i]);
  return s;
}

function emphasis(s) {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

/** Lines joined with hard breaks where a line ends in two spaces. */
function joinLines(lines) {
  return lines.map((l, i) => {
    const hard = / {2,}$/.test(l) && i < lines.length - 1;
    return inline(l.trim()) + (hard ? '<br>' : (i < lines.length - 1 ? ' ' : ''));
  }).join('');
}

function linkRow(line) {
  const m = line.trim().match(/^(\[[^\]]+\]\([^)\s]+\))\s*(.*)$/);
  const rest = m[2].replace(/^\\?-\s*/, '').trim();
  return `<li><span class="md-linkrow-link">${inline(m[1])}</span>${rest ? `<span class="md-linkrow-desc">${inline(rest)}</span>` : ''}</li>`;
}

/**
 * @returns {{ html: string, headings: {level:number, id:string, text:string}[] }}
 */
export function renderMarkdown(md) {
  const lines = String(md).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  const headings = [];
  let para = [];
  let list = [];

  const flushPara = () => {
    if (!para.length) return;
    const solo = para.length === 1 && para[0].trim().match(/^```([^`]+)```$/);
    if (solo) {
      out.push(`<pre class="md-code"><code>${esc(solo[1])}</code></pre>`);
    } else if (para.every(l => /^\s*\[[^\]]+\]\([^)\s]+\)/.test(l))) {
      out.push(`<ul class="md-linkrows">${para.map(linkRow).join('')}</ul>`);
    } else if (para.length === 1 && /^\*\*[^*]+\*\*$/.test(para[0].trim())) {
      out.push(`<p class="md-label">${joinLines(para)}</p>`);
    } else {
      out.push(`<p>${joinLines(para)}</p>`);
    }
    para = [];
  };
  const flushList = () => {
    if (!list.length) return;
    out.push(`<ul class="md-list">${list.map(item => `<li>${joinLines([item])}</li>`).join('')}</ul>`);
    list = [];
  };

  for (const raw of lines) {
    const h = raw.match(/^(#{1,6})\s+(.*?)\s*$/);
    const li = raw.match(/^\s*[-*]\s+(.*)$/);
    if (h) {
      flushPara(); flushList();
      const level = h[1].length;
      const html = inline(h[2]);
      let id = slugify(html) || `section-${headings.length}`;
      while (headings.some(x => x.id === id)) id += '-x';
      headings.push({ level, id, text: html });
      out.push(`<h${level} id="${id}">${html}</h${level}>`);
    } else if (li) {
      flushPara();
      list.push(li[1]);
    } else if (!raw.trim()) {
      flushPara(); flushList();
    } else {
      flushList();
      para.push(raw);
    }
  }
  flushPara(); flushList();
  return { html: out.join('\n'), headings };
}
