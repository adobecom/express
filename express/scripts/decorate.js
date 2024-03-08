// eslint-disable-next-line import/prefer-default-export
import { createTag } from './utils.js';

export function addTempWrapper(block, blockName) {
  const wrapper = document.createElement('div');
  const parent = block.parentElement;
  wrapper.classList.add(`${blockName}-wrapper`);
  parent.insertBefore(wrapper, block);
  wrapper.append(block);
}

export function unwrapBlock(blockWrapper, blockName) {
  const section = blockWrapper.parentNode;
  const elems = [...section.children];

  if (elems.length <= 1) return;

  const blockSection = createTag('div');
  blockSection.className = `section section-wrapper ${blockName}-container`;
  const postBlockSection = createTag('div');
  postBlockSection.className = section.className;
  postBlockSection.classList.remove(`${blockName}-container`);
  const nextSection = section.nextElementSibling;

  section.classList.remove(`${blockName}-container`);
  section.parentNode.insertBefore(blockSection, nextSection);
  section.parentNode.insertBefore(postBlockSection, nextSection);

  let appendTo;
  elems.forEach((e) => {
    if (e === blockWrapper || e.className === 'section-metadata') {
      appendTo = blockSection;
    }

    if (appendTo) {
      appendTo.appendChild(e);
      appendTo = postBlockSection;
    }
  });

  if (!postBlockSection.hasChildNodes()) {
    postBlockSection.remove();
  }
}
