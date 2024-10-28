
import { addTempWrapper } from '../../scripts/decorate.js';
import {
  createTag,
  getIconElement,
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

function toggleMultifunctionToolBox(wrapper, lottie, data) {
  wrapper.classList.add('with-transition');
  if (wrapper.classList.contains('toolbox-opened')) {
    openToolBox(wrapper, lottie, data);
  } else {
    closeToolBox(wrapper, lottie);
  }
}

function initNotchDragAction(wrapper, data) {
  const $body = document.querySelector('body');
  const notch = wrapper.querySelector('.notch');
  const toolBox = wrapper.querySelector('.toolbox');
  const lottie = wrapper.querySelector('.floating-button-lottie');
  let touchStart = 0;
  const initialHeight = toolBox.clientHeight;
  notch.addEventListener('touchstart', (e) => {
    $body.style.overflow = 'hidden';
    toolBox.style.transition = 'none';
    touchStart = e.changedTouches[0].clientY;
  }, { passive: true });

  notch.addEventListener('touchmove', (e) => {
    toolBox.style.maxHeight = `${(initialHeight - 56) - (e.changedTouches[0].clientY - touchStart)}px`;
  }, { passive: true });

  notch.addEventListener('touchend', (e) => {
    $body.style.removeProperty('overflow');

    if (e.changedTouches[0].clientY - touchStart > 100) {
      toggleMultifunctionToolBox(wrapper, lottie, data);
    } else {
      toolBox.style.maxHeight = `${initialHeight}px`;
    }

    toolBox.removeAttribute('style');
  }, { passive: true });
}

function buildMultifunctionToolBox(wrapper, data) {
  buildToolBoxStructure(wrapper, data);

  const lottie = wrapper.querySelector('.floating-button-lottie');
  const boxTop = wrapper.querySelector('.toolbox-top');
  const boxBottom = wrapper.querySelector('.toolbox-bottom');

  data.tools.forEach((tool, index) => {
    const $tool = createTag('div', { class: 'tool' });
    $tool.append(tool.icon, tool.anchor);

    if (index < data.toolsToStash) {
      boxTop.append($tool);
    } else {
      boxBottom.append($tool);
    }
  });

  hideScrollArrow(wrapper, lottie);
  initToolBox(wrapper, data, toggleMultifunctionToolBox);
  initNotchDragAction(wrapper, data);
}

function buildDualAction(block, data) {
  block.children[0].remove()
  const header = createTag('div', {
    class:
      'dual-action-header'
  })
  header.textContent = "Header"
  block.append(header)
  block.append(buildAction(data))
  block.append(buildAction(data))
}

function buildAction() {
  const wrapper = createTag('div', { class: "floating-button-inner-row dual-action-row" })

  const text = createTag('div', { class: 'dual-action-text' })
  text.textContent = 'ABC'
  const a = createTag('a', { class: 'button dual-action-link' })
  a.textContent = 'DEF'
  a.href = 'www.adobe.com'
  wrapper.append(getIconElement('download-app-icon-22', 22))
  wrapper.append(text)
  wrapper.append(a)
  console.log(wrapper)
  return wrapper

}

export function createMultiFunctionButton(block, data, audience) {
  const buttonWrapper = createFloatingButton(block, audience, data);
  buttonWrapper.classList.add('multifunction');
  buttonWrapper.classList.add('dual-action-button')
  buildDualAction(buttonWrapper.querySelector('.floating-button'), data)
  return buttonWrapper;
}

export default async function decorate(block) {
  addTempWrapper(block, 'multifunction-button');

  if (!block.classList.contains('meta-powered')) return;

  const audience = block.querySelector(':scope > div').textContent.trim();
  if (audience === 'mobile') {
    block.closest('.section').remove();
  }

  const data = collectFloatingButtonData();
  const blockWrapper = createMultiFunctionButton(block, data, audience);
  const blockLinks = blockWrapper.querySelectorAll('a');
  if (blockLinks && blockLinks.length > 0) {
    const linksPopulated = new CustomEvent('linkspopulated', { detail: blockLinks });
    document.dispatchEvent(linksPopulated);
  }
}
