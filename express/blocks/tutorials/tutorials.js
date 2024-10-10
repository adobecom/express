import { addTempWrapper } from '../../scripts/decorate.js';
import {
  createTag,
  toClassName,
  getIconElement,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/utils.js';

import {
  displayVideoModal,
  playPreloadedVideo,
  preloadVideoModal
} from '../shared/video.js';

function createTutorialCard(title, url, time, $picture, videoID) {
  const $card = createTag('a', { class: 'tutorial-card', title, tabindex: 0 });
  const $cardTop = createTag('div', { class: 'tutorial-card-top' });
  $cardTop.innerHTML = `<div class="tutorial-card-overlay"><div class="tutorial-card-play"></div>
  <div class="tutorial-card-duration">${time}</div></div>`;
  $cardTop.querySelector(':scope .tutorial-card-play').appendChild(getIconElement('play', 44));
  $cardTop.prepend($picture);
  const $cardBottom = createTag('div', { class: 'tutorial-card-text' });
  $cardBottom.innerHTML = `<h3>${title}</h3>`;
  $card.addEventListener('click', () => {
    playPreloadedVideo(videoID)
  });
  $card.addEventListener('keyup', ({ key }) => {
    if (key === 'Enter') {
      playPreloadedVideo(videoID)
    }
  });
  $card.appendChild($cardTop);
  $card.appendChild($cardBottom);
  const linksPopulated = new CustomEvent('linkspopulated', { detail: [$card] });
  document.dispatchEvent(linksPopulated);
  return ($card);
}

export function handlePopstate(event, videoID) {
  const { state } = event;
  const { url, title } = state || {};
  if (url) {
    playPreloadedVideo(videoID)
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
    const videoID = Date.now();
    const $card = createTutorialCard(title, url, time, $picture, videoID);
    $block.appendChild($card);
    $tutorial.remove();
    preloadVideoModal(url, title, undefined ,videoID);
    // autoplay if hash matches title
    // if (toClassName(title) === window.location.hash.substr(1)) {
    //   preloadVideoModal(url, title);
    // }
  });
  // handle history events
  window.addEventListener('popstate', (e) => handlePopstate(e,videoID));
}

export default function decorate($block) {
  addTempWrapper($block, 'tutorials');

  decorateTutorials($block);
}
