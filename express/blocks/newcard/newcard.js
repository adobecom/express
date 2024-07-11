// eslint-disable-next-line import/no-unresolved
import { createTag } from '../../scripts/utils.js';

/**
 * @param {HTMLDivElement} $block
 */
export default function decorate($block) {
  console.log("NEW CARD");
  $block.querySelectorAll(':scope>div').forEach(($card) => {
    console.log("MAIN LOOP", $card)
    $card.classList.add('card');
    const $cardDivs = [...$card.children];
    $cardDivs.forEach(($div, i) => {
      console.log("INDEX", i, $div)
      if ($div.querySelector('img')) {
        $div.classList.add('card-image');
      } else {
        $div.classList.add('card-content');
      }
      const $a = $div.querySelector('a');
      console.log("THE ELEMENT", $a)
      console.log("THE STRING", $a?.textContent.trim())
      if ($a && $a.textContent.trim().startsWith('https://')) {
        console.log("CONDITION MATCHED")
        const $wrapper = createTag('a', { href: $a.href, class: 'card' });
        $a.remove();
        $wrapper.innerHTML = $card.innerHTML;
        $block.replaceChild($wrapper, $card);
      }
    });
  });
}
