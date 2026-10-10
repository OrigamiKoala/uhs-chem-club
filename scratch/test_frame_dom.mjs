import { LearnFrame } from '../src/learn/engine/frame.js';

// Setup minimal document
const container = document.createElement('div');
container.className = 'learn-quest-overworld';
document.body.appendChild(container);

const mount = document.createElement('div');
container.appendChild(mount);

const frame = new LearnFrame(mount, {
  stageCount: 8,
  onSubmit: () => {},
  onNext: () => {},
  onJump: () => {},
  onExit: () => {}
});

frame.setStage({
  index: 0,
  title: 'Red to Violet',
  prompt: 'Say what changes on the screen as the dial turns from red to violet.',
  hints: [],
  commitLabel: 'Commit'
});

frame.setWidget('<div class="test-widget">QUESTION CHOICES HERE</div>');

console.log('--- MOUNT INNER HTML ---');
console.log(mount.innerHTML);
