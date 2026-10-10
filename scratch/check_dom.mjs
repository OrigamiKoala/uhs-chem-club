import { installDomShim } from '../tools/lib/dom-shim.mjs';
installDomShim({ tier: 'T4' });

const { renderLearnQuest } = await import('../src/screens/learn-quest.js');

const container = document.createElement('div');
document.body.appendChild(container);

await renderLearnQuest(container, { worldId: 'unit02', questId: 'q1-wave' });

console.log('Container HTML:');
console.log(container.innerHTML);
