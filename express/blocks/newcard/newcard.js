// eslint-disable-next-line import/no-unresolved
import { createTag } from '../../scripts/utils.js';

/**
 * @param {HTMLDivElement} $block
 */
export default function decorate($block) {
  $block.querySelectorAll(':scope>div').forEach(($card) => {
    $card.classList.add('card');
    const $cardDivs = [...$card.children];
    $cardDivs.forEach(($div) => {
      if ($div.querySelector('img')) {
        $div.classList.add('card-image');
      } else {
        $div.classList.add('card-content');
      }
      const $a = $div.querySelector('a');
      if ($a && $a.textContent.trim().startsWith('https://')) {
        const $wrapper = createTag('a', { href: $a.href, class: 'card' });
        $a.remove();
        $wrapper.innerHTML = $card.innerHTML;
        $block.replaceChild($wrapper, $card);
      }
    });
  });
}
