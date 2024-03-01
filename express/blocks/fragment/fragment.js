import {
  decorateMain,
  loadSections,
  removeIrrelevantSections,
} from '../../scripts/utils.js';

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
      removeIrrelevantSections(main);
      const sections = await decorateMain(main);
      await loadSections(sections, false);
      return main;
    }
  }
  return null;
}

export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  const fragment = await loadFragment(path);

  if (fragment) {
    const fragmentSections = fragment.querySelectorAll(':scope .section');

    const blockSection = block.closest('.section');

    if (blockSection) {
      let currentNode = blockSection;
      fragmentSections.forEach((fragmentSection, idx) => {
        if (idx < 1) {
          blockSection.classList.add(...fragmentSection.classList);
          if (block.closest('.fragment-wrapper')) {
            block.closest('.fragment-wrapper').replaceWith(...fragmentSection.childNodes);
          } else {
            block.replaceWith(...fragmentSection.childNodes);
          }
        } else {
          currentNode.after(fragmentSection);
          currentNode = fragmentSection;
        }
      });
    }
  }
}
