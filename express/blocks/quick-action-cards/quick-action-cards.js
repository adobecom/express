import { addTempWrapper } from '../../scripts/decorate.js';
import {
  createTag,
  getIconElement,
  fetchPlaceholders,
  // eslint-disable-next-line import/no-unresolved
} from '../../scripts/utils.js';

export default function decorate($block) {
  addTempWrapper($block, 'quick-action-cards');

  const $cards = Array.from($block.querySelectorAll(':scope>div'));
  const chevron = getIconElement('chevron');
  $cards.forEach(($card) => {
    $card.classList.add('quick-action-card');
    const $cardDivs = Array.from($card.children);
    $cardDivs.forEach(($div) => {
      if ($div.querySelector(':scope > picture:first-child')) {
        $div.classList.add('quick-action-card-image');
        const $a = $div.querySelector('a');
        if ($a && $a.textContent.trim().startsWith('https://')) {
          const contents = Array.from($card.children);
          const $wrapper = createTag('a', { href: $a.href });
          $a.remove();
          $card.appendChild($wrapper);
          contents.forEach((child) => {
            $wrapper.appendChild(child);
          });
        }
      } else {
        const $buttons = $div.querySelectorAll(':scope a');
        $buttons.forEach(($button, index) => {
          if (index > 0) {
            const chevronClone = chevron.cloneNode(true);
            $button.appendChild(chevronClone);
            $button.classList.remove('button', 'primary', 'secondary', 'accent');
          }
        });
      }
    });
  });

  if ($cards.length > 3) {
    let $top = $block.previousElementSibling;
    if ($top && $top.tagName === 'P') {
      $top = $top.previousElementSibling;
    }
    if ($top && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes($top.tagName)) {
      $top = $block;
    }
    const $seeMore = document.createElement('a');
    $seeMore.classList.add('quick-action-card--open', 'button', 'secondary');
    const $seeLess = document.createElement('a');
    $seeLess.classList.add('quick-action-card--close', 'button', 'secondary');
    fetchPlaceholders().then((placeholders) => {
      $seeMore.innerText = placeholders['see-more'];
      $seeLess.innerText = placeholders['see-less'];
      $seeMore.appendChild(chevron.cloneNode(true));
      $seeLess.appendChild(chevron.cloneNode(true));
    });

    $seeMore.setAttribute('href', '');
    $seeMore.addEventListener('click', (event) => {
      event.preventDefault();
    });
    $seeMore.addEventListener('click', () => {
      $block.classList.add('quick-action-cards--expanded');
    });

    $seeLess.setAttribute('href', '#');
    $seeLess.addEventListener('click', (event) => {
      event.preventDefault();
    });
    $seeLess.addEventListener('click', () => {
      $block.classList.remove('quick-action-cards--expanded');
      window.scrollTo(0, $top.offsetTop);
    });

    const $pButton = document.createElement('p');
    $pButton.classList.add('quick-action-cards--buttons');
    $pButton.appendChild($seeMore);
    $pButton.appendChild($seeLess);
    if ($block.nextElementSibling) {
      $block.parentNode.insertBefore($pButton, $block.nextElementSibling);
    } else {
      $block.parentNode.appendChild($pButton);
    }
  }
}
