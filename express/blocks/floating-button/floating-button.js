import { addTempWrapper } from '../../scripts/utils/decorate.js';
import {
  createFloatingButton,
  collectFloatingButtonData,
} from '../shared/floating-cta.js';
import {
  formatDynamicCartLink,
} from '../../scripts/utils/pricing.js';

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
      formatDynamicCartLink(blockLinks[0]);
      const linksPopulated = new CustomEvent('linkspopulated', {
        detail: blockLinks,
      });
      document.dispatchEvent(linksPopulated);
    }
  } else {
    block.parentElement.remove();
  }
}
