import {
  createTag,
} from '../../scripts/utils.js';

import {
  createFloatingButton,
  hideScrollArrow,
  collectFloatingButtonData,
  buildToolBoxStructure,
  initToolBox,
  openToolBox,
  closeToolBox,
} from '../shared/floating-cta.js';

function toggleMultifunctionToolBox($wrapper, $lottie, data, userInitiated = true) {
  if (userInitiated) {
    $wrapper.classList.remove('initial-load');
  }

  if ($wrapper.classList.contains('toolbox-opened')) {
    openToolBox($wrapper, $lottie, data, userInitiated);
  } else {
    closeToolBox($wrapper, $lottie);
  }
}

function initNotchDragAction($wrapper, data) {
  const $body = document.querySelector('body');
  const $notch = $wrapper.querySelector('.notch');
  const $toolBox = $wrapper.querySelector('.toolbox');
  const $lottie = $wrapper.querySelector('.floating-button-lottie');
  let touchStart = 0;
  const initialHeight = $toolBox.clientHeight;
  $notch.addEventListener('touchstart', (e) => {
    $body.style.overflow = 'hidden';
    $toolBox.style.transition = 'none';
    touchStart = e.changedTouches[0].clientY;
  }, { passive: true });

  $notch.addEventListener('touchmove', (e) => {
    $toolBox.style.maxHeight = `${(initialHeight + 88) - (e.changedTouches[0].clientY - touchStart)}px`;
  }, { passive: true });

  $notch.addEventListener('touchend', (e) => {
    $body.style.removeProperty('overflow');

    if (e.changedTouches[0].clientY - touchStart > 100) {
      toggleMultifunctionToolBox($wrapper, $lottie, data);
    } else {
      $toolBox.style.maxHeight = `${initialHeight}px`;
    }

    $toolBox.removeAttribute('style');
  }, { passive: true });
}

function buildMultifunctionToolBox($wrapper, data) {
  buildToolBoxStructure($wrapper, data);

  const $lottie = $wrapper.querySelector('.floating-button-lottie');
  const $boxTop = $wrapper.querySelector('.toolbox-top');
  const $boxBottom = $wrapper.querySelector('.toolbox-bottom');

  data.tools.forEach((tool, index) => {
    const $tool = createTag('div', { class: 'tool' });
    $tool.append(tool.icon, tool.anchor);

    if (index < data.toolsToStash) {
      $boxTop.append($tool);
    } else {
      $boxBottom.append($tool);
    }
  });

  hideScrollArrow($wrapper, $lottie);
  initToolBox($wrapper, data, toggleMultifunctionToolBox);
  initNotchDragAction($wrapper, data);
}

export async function createMultiFunctionButton($block, data, audience) {
  const $buttonWrapper = await createFloatingButton($block, audience, data)
    .then(((result) => result));
  $buttonWrapper.classList.add('multifunction');
  buildMultifunctionToolBox($buttonWrapper, data);

  return $buttonWrapper;
}

export default async function decorate($block) {
  if ($block.classList.contains('spreadsheet-powered')) {
    const audience = $block.querySelector(':scope > div').textContent.trim();
    if (audience === 'mobile') {
      $block.closest('.section').remove();
    }

    const data = await collectFloatingButtonData();
    const blockWrapper = await createMultiFunctionButton($block, data, audience);
    const blockLinks = blockWrapper.querySelectorAll('a');
    if (blockLinks && blockLinks.length > 0) {
      const linksPopulated = new CustomEvent('linkspopulated', { detail: blockLinks });
      document.dispatchEvent(linksPopulated);
    }
  }
}
