import { addTempWrapper } from '../../scripts/decorate.js';
import {
  createTag,
  toClassName,
  getIconElement,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/utils.js';

import {
  displayVideoModal,
  hideVideoModal,
} from '../shared/video.js';

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

  const tryEl = createTag('div', { class: '', tabindex: 0 });
  // tryEl.innerHTML = "<h1>Hello World</h1>";
  tryEl.innerHTML = `<h1>Hello World</h1><iframe title="Adobe Video Publishing Cloud Player" width="640" height="360" src="https://images-tv.adobe.com/mpcv3/8112/2c506a6a-e54c-42fb-869d-3bba4b133d0a_1718031054.854x480at800_h264.mp4" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen scrolling="no"></iframe>`;

  tryEl.innerHTML = `<h1>Hello World</h1>
  <iframe title="Adobe Video Publishing Cloud Player"
    width="640" height="360"
    src="https://images-tv.adobe.com/mpcv3/8112/2c506a6a-e54c-42fb-869d-3bba4b133d0a_1718031054.854x480at800_h264.mp4"
    frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen scrolling="no">
  </iframe>
  <div>
    <video controls width="640" src="https://images-tv.adobe.com/mpcv3/8112/2c506a6a-e54c-42fb-869d-3bba4b133d0a_1718031054.854x480at800_h264.mp4"></video>
  </div>
  `;


  // Inline video good URL - https://video.tv.adobe.com/v/332632
  // Inline video bad URL - https://images-tv.adobe.com/mpcv3/1384/b50a7a5f-3010-4e7b-bdc1-2f315711e508_1618253276.854x480at800_h264.mp4
  // https://images-tv.adobe.com/mpcv3/8112/2c506a6a-e54c-42fb-869d-3bba4b133d0a_1718031054.854x480at800_h264.mp4

  // https://images-tv.adobe.com/mpcv3/8112/2c506a6a-e54c-42fb-869d-3bba4b133d0a_1718031054.854x480at800_h264.mp4
  // https://video.tv.adobe.com/v/332632


// <iframe title="Adobe Video Publishing Cloud Player" width="640" height="360" src="https://video.tv.adobe.com/v/346121/" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen scrolling="no"></iframe>


  $block.append(tryEl);
}
