import { createTag } from '../../scripts/utils.js';
import buildGallery from '../../features/gallery/gallery.js';

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

export default async function init(bl) {
  const heading = bl.querySelector('h3, h4, h5, h6');
  const cardsContainer = createTag('ol', { class: 'cards-container' });
  let steps = [...bl.querySelectorAll(':scope > div')];
  if (steps[0].querySelector('h2')) {
    const text = steps[0];
    steps = steps.slice(1);
    text.classList.add('text');
  }
  const cards = steps.map((div, index) => {
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

  await buildGallery(cards, cardsContainer, bl);
  if (bl.classList.contains('schema')) {
    addSchema(bl, heading);
  }
  return bl;
}
