import { addTempWrapper } from '../../scripts/decorate.js';
import {
  createTag, getMetadata, getMobileOperatingSystem,
} from '../../scripts/utils.js';

import {
  collectFloatingButtonData,
  createFloatingButton,
} from '../shared/floating-cta.js';

function buildAction(entry, buttonType) {
  const wrapper = createTag('div', { class: 'floating-button-inner-row mobile-gating-row' });
  const text = createTag('div', { class: 'mobile-gating-text' });
  text.textContent = entry.iconText;
  const a = entry.anchor;
  a.classList.add(buttonType, 'button', 'mobile-gating-link');
  wrapper.append(entry.icon, text, a);
  return wrapper;
}

function buildMobileGating(block, data) {
  block.children[0].remove();
  const header = createTag('div', {
    class:
      'mobile-gating-header',
  });
  header.textContent = data.mainCta.text;
  block.append(header, buildAction(data.tools[0], 'accent'), buildAction(data.tools[1], 'outline'));
}

export function createMultiFunctionButton(block, data, audience) {
  const buttonWrapper = createFloatingButton(block, audience, data);
  buttonWrapper.classList.add('multifunction', 'mobile-gating-button');
  buildMobileGating(buttonWrapper.querySelector('.floating-button'), data);
  return buttonWrapper;
}

// Checks if the device is an android and has sufficient RAM, enables the mobile gating if it is.
// If there is no metadata check enabled, still enable the gating block in case authors want it.

function androidDeviceAndRamCheck() {
  const isAndroid = getMobileOperatingSystem() === 'Android';
  if (getMetadata('floating-cta-device-and-ram-check') === 'yes') {
    if (navigator.deviceMemory >= 4 && isAndroid) {
      return true;
    } else {
      return false;
    }
  }
  return true;
}

export default async function decorate(block) {
  if (!androidDeviceAndRamCheck()) {
    const { default: decorateNormal } = await import('../floating-button/floating-button.js');
    decorateNormal(block);
    return;
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
