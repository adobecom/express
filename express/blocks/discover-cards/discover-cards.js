import { createTag, yieldToMain } from '../../scripts/utils.js';
import buildGallery from '../../features/gallery/gallery.js';

async function syncMinHeights(groups) {
  const maxHeights = groups.map((els) => els
    .filter((e) => !!e)
    .reduce((max, e) => Math.max(max, e.offsetHeight), 0));
  await yieldToMain();
  maxHeights.forEach((maxHeight, i) => groups[i].forEach((e) => {
    if (e) e.style.minHeight = `${maxHeight}px`;
  }));
}

export default async function decorate(block) {
  const firstChild = block.querySelector(':scope > div:first-child');

  if (firstChild && firstChild.querySelector('h3')) {
    firstChild.classList.add('center-title');
    block.insertBefore(firstChild, block.firstChild);
  }

  const cardsWrapper = createTag('div', {
    class: 'cards-container',
  });

  const cards = block.querySelectorAll(':scope > div:not(:first-child)');
  const cardParagraphs = [[]];
  cards.forEach((card) => {
    card.classList.add('card');

    cardsWrapper.appendChild(card);
    const cardDivs = [...card.children];

    cardDivs.forEach((element) => {
      const textHeader = element.querySelector('h4');
      const textBody = element.querySelector('p');
      if (textHeader && textBody) {
        textHeader.classList.add('header');
        textBody.classList.add('body');
        element.classList.add('text-content');
        cardParagraphs[0].push(element);
      }

      element.querySelector('picture img')?.classList.add('short');
      if (element.tagName === 'H2') {
        element.classList.add('card-title');
      } else if (element.querySelector('a.button')) {
        element.classList.add('cta-section');
      }
    });
  });

  block.appendChild(cardsWrapper);
  await buildGallery(cards, cardsWrapper);
  new IntersectionObserver((entries, obs) => {
    obs.unobserve(block);
    syncMinHeights(cardParagraphs);
  }).observe(block);

  const imageSize = document.body.dataset.device === 'desktop' ? 'large' : 'small';
  block.style.backgroundImage = `
        linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 20%),
        linear-gradient(to top, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 20%),
        url(/express/blocks/discover-cards/img/cards-bg-${imageSize}.webp)
      `;
}
