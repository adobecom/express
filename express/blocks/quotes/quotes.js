// eslint-disable-next-line import/no-unresolved
import { createTag } from '../../scripts/utils.js';

export default function decorate($block) {
  $block.querySelectorAll(':scope>div').forEach(($card) => {
    $card.classList.add('quote');
    if ($card.children.length > 1) {
      const $author = $card.children[1];
      $author.classList.add('author');
      if ($author.querySelector('picture')) {
        const $authorImg = createTag('div', { class: 'image' });
        $authorImg.appendChild($author.querySelector('picture'));
        $author.appendChild($authorImg);
      }
      const $authorSummary = createTag('div', { class: 'summary' });
      Array.from($author.querySelectorAll('p'))
        .filter(($p) => !!$p.textContent.trim())
        .forEach(($p) => $authorSummary.appendChild($p));
      $author.appendChild($authorSummary);
    }
    $card.firstElementChild.classList.add('content');
  });
}
