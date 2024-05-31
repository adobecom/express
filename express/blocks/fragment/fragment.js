import {
  decorateMain,
  loadSections,
  removeIrrelevantSections,
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
      const html = await resp.text();
      const main = document.createElement('main');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      main.append(...doc.body.children);

      removeIrrelevantSections(main);
      const sections = await decorateMain(main, false);
      await loadSections(sections, false);
      return main;
    }
  }
  return null;
}

export default async function decorate(block) {
  if (block.tagName === 'A') {
    const { default: init } = await import('./milo-fragment.js');
    init(block);
    return;
  }
  addTempWrapper(block, 'fragment');

  const link = block.querySelector('a');
  const path = link?.getAttribute('href') ?? block.textContent.trim();
  const fragment = await loadFragment(path);

  if (fragment) {
    const fragmentSections = fragment.querySelectorAll(':scope .section');

    const blockSection = block.closest('.section');

    let currentNode = blockSection;
    fragmentSections.forEach((fragmentSection, idx) => {
      if (idx < 1) {
        blockSection?.classList.add(...fragmentSection.classList);
        if (block.closest('.fragment-wrapper')) {
          block.closest('.fragment-wrapper').replaceWith(...fragmentSection.childNodes);
        } else {
          block.replaceWith(...fragmentSection.childNodes);
        }
      } else if (currentNode) {
        currentNode.after(fragmentSection);
        currentNode = fragmentSection;
      }
    });
  }
}
