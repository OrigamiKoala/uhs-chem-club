// Dumps a unit's stages as JSON lines for the audit: node tools/lib/teaching-dump.mjs unit09
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readdirSync } from 'node:fs';
const memory = new Map(); const noop = () => {};
globalThis.localStorage = { getItem: k => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, String(v)), removeItem: k => memory.delete(k), clear: () => memory.clear() };
globalThis.window = { addEventListener: noop, removeEventListener: noop, matchMedia: () => ({ matches: false, addEventListener: noop }), location: { hash: '' }, devicePixelRatio: 1 };
globalThis.document = { addEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ style: {}, classList: { add: noop }, appendChild: noop, addEventListener: noop, getContext: () => null, setAttribute: noop }) };
const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const unit = process.argv[2] || 'unit09';
await import(pathToFileURL(join(root, 'src/learn/table/kits/ph.js')));
const out = [];
for (const f of readdirSync(join(root, 'src/learn/quests', unit)).filter(x => x.endsWith('.js')).sort()) {
  const m = await import(pathToFileURL(join(root, 'src/learn/quests', unit, f)));
  (m.STAGES || []).forEach((st, i) => {
    let reward = null; try { reward = st.reward; } catch { /* getter */ }
    let prompt = null; try { prompt = st.prompt; } catch { /* getter */ }
    out.push({ quest: f.replace('.js', ''), no: i + 1, id: st.id, title: st.title, predict: !!st.predict, prompt, hints: st.hints, reward: reward && { title: reward.title, body: reward.body, model: !!reward.model }, fixtures: (st.table?.fixtures || []).map(x => x.kind + (x.label ? `:${x.label}` : '')), pieces: [...new Set((st.table?.pieces || []).map(x => x.kind))], labels: [...(st.table?.fixtures || []), ...(st.table?.pieces || [])].map(x => x.label).filter(Boolean) });
  });
}
console.log(JSON.stringify(out));
