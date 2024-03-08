import { addTempWrapper } from '../../utils/decorate.js';
import {
  createTag,
  toClassName,
  getIconElement,

} from '../../utils/utils.js';

import {
  displayVideoModal,
  hideVideoModal,
} from '../../components/video.js';

function createTutorialCard(title, url, time, $picture) {
  const $card = createTag('a', { class: 'tutorial-card', title, tabindex: 0 });
  const $cardTop = createTag('div', { class: 'tutorial-card-top' });
  $cardTop.innerHTML = `<div class="tutorial-card-overlay"><div class="tutorial-card-play"></div>
  <div class="tutorial-card-duration">${time}</div></div>`;
  $cardTop.querySelector(':scope .tutorial-card-play').appendChild(getIconElement('play', 44));
  $cardTop.prepend($picture);
  const $cardBottom = createTag('div', { class: 'tutorial-card-text' });
  $cardBottom.innerHTML = `<h3>${title}</h3>`;
  $card.addEventListener('click', () => {
    displayVideoModal(url, title, true);
  });
  $card.addEventListener('keyup', ({ key }) => {
    if (key === 'Enter') {
      displayVideoModal(url, title);
    }
  });
  $card.appendChild($cardTop);
  $card.appendChild($cardBottom);
  const linksPopulated = new CustomEvent('linkspopulated', { detail: [$card] });
  document.dispatchEvent(linksPopulated);
  return ($card);
}

export function handlePopstate(event) {
  const { state } = event;
  hideVideoModal();
  const { url, title } = state || {};
  if (url) {
    displayVideoModal(url, title);
  }
}

function decorateTutorials($block) {
  const $tutorials = [...$block.children];
  $tutorials.forEach(($tutorial) => {
    const [$link, $time, $picture] = [...$tutorial.children];
    const $a = $link.querySelector('a');
    const url = $a && $a.href;
    const title = $link.textContent.trim();
    const time = $time.textContent.trim();
    const $card = createTutorialCard(title, url, time, $picture);
    $block.appendChild($card);
    $tutorial.remove();
    // autoplay if hash matches title
    if (toClassName(title) === window.location.hash.substr(1)) {
      displayVideoModal(url, title);
    }
  });
  // handle history events
  window.addEventListener('popstate', handlePopstate);
}

export default function decorate($block) {
  addTempWrapper($block, 'tutorials');

  decorateTutorials($block);
}
