import { addTempWrapper } from '../../scripts/decorate.js';
import {
  createTag, getMetadata
} from '../../scripts/utils.js';

import {
  collectFloatingButtonData,
  createFloatingButton,
} from '../shared/floating-cta.js';

function buildAction(entry, buttonType) {
  const wrapper = createTag('div', { class: 'floating-button-inner-row dual-action-row' });
  const text = createTag('div', { class: 'dual-action-text' });
  text.textContent = entry.iconText;
  const a = entry.anchor;
  a.classList.add(buttonType);
  a.classList.add('button');
  a.classList.add('dual-action-link');
  wrapper.append(entry.icon);
  wrapper.append(text);
  wrapper.append(a);
  return wrapper;
}

function buildDualAction(block, data) {
  console.log(data)
  block.children[0].remove();
  const header = createTag('div', {
    class:
      'dual-action-header',
  });
  header.textContent = data.mainCta.text;
  block.append(header);
  block.append(buildAction(data.tools[0], 'accent'));
  block.append(buildAction(data.tools[1], 'outline'));
}

export function createMultiFunctionButton(block, data, audience) {
  const buttonWrapper = createFloatingButton(block, audience, data);
  buttonWrapper.classList.add('multifunction');
  buttonWrapper.classList.add('dual-action-button');
  buildDualAction(buttonWrapper.querySelector('.floating-button'), data);
  return buttonWrapper;
}

function deviceCheck() {
  var ua = navigator.userAgent.toLowerCase();
  var isAndroid = ua.indexOf("android") > -1;
  if (getMetadata('device-check') === 'yes' && getMetadata('ram-check') === 'yes') {
    if (navigator.deviceMemory <= 4 && isAndroid) {
      return true
    } 
  }
  return false
}

export default async function decorate(block) {
 

  if (!deviceCheck()) {
    const {default : decorate} = await import ('../floating-button/floating-button.js')
    decorate(block)
    return
  }
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
