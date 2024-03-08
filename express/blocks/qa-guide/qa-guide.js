import { createTag, getIconElement } from '../../utils/utils.js';

export default async function init(el) {
  let audienceIcon;

  if (el.classList.contains('desktop')) {
    audienceIcon = createTag('div', { class: 'audience-icon' }, getIconElement('desktop'));
  }

  if (el.classList.contains('mobile')) {
    audienceIcon = createTag('div', { class: 'audience-icon' }, getIconElement('ios'));
  }

  el.prepend(audienceIcon);
}
