import {
  createFloatingButton,
  collectFloatingButtonData,
} from '../shared/floating-cta.js';

// floating-button-wrapper's style is defined in app-banner.css,
//   branch-io.css, bubble-ui-button.css and toc.css
function addTempWrapper($block, blockName) {
  const div = document.createElement('div');
  const parent = $block.parentElement;
  div.append($block);
  div.classList.add(`${blockName}-wrapper`);
  parent.append(div);
}

export default async function decorate(block) {
  addTempWrapper(block, 'floating-button');

  if (block.classList.contains('spreadsheet-powered')) {
    const audience = block.querySelector(':scope > div').textContent.trim();
    if (audience === 'mobile') {
      block.closest('.section')?.remove();
    }

    const parentSection = block.closest('.section');
    const data = await collectFloatingButtonData(block);

    const blockWrapper = await createFloatingButton(
      block,
      parentSection ? audience : null,
      data,
    );

    const blockLinks = blockWrapper.querySelectorAll('a');
    if (blockLinks && blockLinks.length > 0) {
      const linksPopulated = new CustomEvent('linkspopulated', { detail: blockLinks });
      document.dispatchEvent(linksPopulated);
    }
  } else {
    block.parentElement.remove();
  }
}
