import { createTag } from '../../scripts/utils.js';
import buildGallery from '../../features/gallery/gallery.js';

export default async function decorate(block) {
  const firstChild = block.querySelector(':scope > div:first-child');
  if (firstChild && firstChild.querySelector('h3')) {
    firstChild.classList.add('centered-title');
    block.insertBefore(firstChild, block.firstChild);
  }

  const cardsWrapper = createTag('div', {
    class: 'cards-container',
  });

  const cards = block.querySelectorAll(':scope > div');

  cards.forEach((card, index) => {
    if (index === 0 && firstChild) return;
    card.classList.add('card');
    cardsWrapper.appendChild(card);

    const cardDivs = [...card.children];
    cardDivs.forEach((element) => {
      if (element.tagName === 'H2') {
        element.classList.add('card-title');
      } else if (element.querySelector('a.button')) {
        element.classList.add('cta-section');

        const h4Element = element.querySelector('h4');
        if (h4Element) {
          const pTagAfterH4 = h4Element.nextElementSibling;
          if (pTagAfterH4 && pTagAfterH4.tagName === 'P') {
            pTagAfterH4.classList.add('cta-section-text');
          }
        }
      } else if (element.tagName === 'P') {
        element.classList.add('card-text');
      }
    });
  });

  block.appendChild(cardsWrapper);

  await buildGallery(cards, cardsWrapper);
}
