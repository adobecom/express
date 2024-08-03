import { createTag } from '../../scripts/utils.js';
import carouselize from '../../features/steps-carousel/steps-carousel.js';

export function addSchema(bl, heading) {
  const schema = {
    '@context': 'http://schema.org',
    '@type': 'HowTo',
    name: (heading && heading.textContent.trim()) || document.title,
    step: [],
  };

  bl.querySelectorAll('li').forEach((step, i) => {
    const h = step.querySelector('h3, h4, h5, h6');
    const p = step.querySelector('p');

    if (h && p) {
      schema.step.push({
        '@type': 'HowToStep',
        position: i + 1,
        name: h.textContent.trim(),
        itemListElement: {
          '@type': 'HowToDirection',
          text: p.textContent.trim(),
        },
      });
    }
  });
  document.head.append(createTag('script', { type: 'application/ld+json' }, JSON.stringify(schema)));
}

export default async function decorate(bl) {
  const section = bl.closest('.section');
  const heading = section.querySelector('h2, h3, h4');
  const cardsContainer = createTag('ol', { class: 'cards-container' });

  const cards = [...bl.querySelectorAll(':scope > div')].map((div, index) => {
    const li = createTag('li', { class: 'card' });
    const tipNumber = createTag('div', { class: 'number' });
    tipNumber.append(
      createTag('span', { class: 'number-txt' }, index + 1),
      createTag('div', { class: 'number-bg' }),
    );
    li.append(tipNumber);
    const content = div.querySelector('div');
    while (content.firstChild) {
      li.append(content.firstChild);
    }
    div.remove();
    cardsContainer.append(li);
    return li;
  });
  bl.append(cardsContainer);

  new IntersectionObserver((_, observer) => {
    observer.unobserve(bl);
    if (cardsContainer.scrollWidth <= cardsContainer.clientWidth) {
      return;
    }
    bl.style.paddingBottom = '48px';
    // turn cards into horizontally scrollable and inject control
    carouselize(cards, cardsContainer, bl).then(() => {
      bl.style.paddingBottom = '0';
    });
  }).observe(bl);
  if (bl.classList.contains('schema')) {
    addSchema(bl, heading);
  }
}
