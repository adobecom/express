import { createTag } from '../../scripts/utils.js';

let spans = [];

export default function init() {
  const blocks = document.querySelectorAll('.section > div > div[class]');
  if (spans.length) {
    spans.forEach((span) => span.remove());
    spans = [];
  } else {
    blocks.forEach((block) => {
      const blockVals = [...block.classList];
      const blockName = blockVals.shift();
      const span = createTag('span', { class: 'display-block-name' }, `${blockName} (${[...blockVals]})`);
      block.prepend(span);
      spans.push(span);
    });
  }
}
