/* eslint-disable import/named, import/extensions */

/*
 * Fragment Block
 * Include content from one Helix page in another.
 * https://www.hlx.live/developer/block-collection/fragment
 */

import {
  decorateMain,
  loadSections,
} from '../../scripts/utils.js';
import { addTempWrapper } from '../../scripts/decorate.js';

/**
 * Loads a fragment.
 * @param {string} path The path to the fragment
 * @returns {HTMLElement} The root element of the fragment
 */
async function loadFragment(path) {
  if (path && path.startsWith('/')) {
    const resp = await fetch(`${path}.plain.html`);
    if (resp.ok) {
      const main = document.createElement('main');
      main.innerHTML = await resp.text();
      const sections = await decorateMain(main);
      await loadSections(sections);
      return main;
    }
  }
  return null;
}

export default async function decorate(block) {
  addTempWrapper(block, 'fragment');

  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  const fragment = await loadFragment(path);

  if (fragment) {
    const fragmentSection = fragment.querySelector(':scope .section');

    if (fragmentSection) {
      const audience = fragmentSection.dataset?.audience;
      if (audience) {
        if (audience !== document.body.dataset?.device) {
          block.closest('.section').remove();
          return;
        }
        block.closest('.section').dataset.audience = audience;
      }

      block.closest('.section')?.classList.add(...fragmentSection.classList);
      if (block.closest('.fragment-wrapper')) {
        block.closest('.fragment-wrapper').replaceWith(...fragmentSection.childNodes);
      } else {
        block.replaceWith(...fragmentSection.childNodes);
      }
    }
  }
}
