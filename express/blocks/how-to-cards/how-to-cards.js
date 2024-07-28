import {
  createTag,
} from '../../scripts/utils.js';

export default function decorate(block) {
  const section = block.closest('.section');
  const heading = section.querySelector('h2, h3, h4');

  const includeSchema = block.classList.contains('schema');
  const cards = [...block.querySelectorAll(':scope > div')];
  const mediaQuery = window.matchMedia('(min-width: 900px)');
  // if (mediaQuery.matches) {
    
  // }
  cards.forEach((div, index) => {
    div.classList.add('card');
    const content = div.querySelector('div');
    const tipNumber = createTag('div', { class: 'number' });
    tipNumber.append(createTag('span', { class: 'number-txt' }, index + 1));
    tipNumber.append(createTag('div', { class: 'number-bg' }));
    content.prepend(tipNumber);
    content.classList.add('content');
  });

  const schema = {
    '@context': 'http://schema.org',
    '@type': 'HowTo',
    name: (heading && heading.textContent.trim()) || document.title,
    step: [],
  };

  block.querySelectorAll('.content').forEach((step, i) => {
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

  if (includeSchema) {
    const $schema = createTag('script', { type: 'application/ld+json' });
    $schema.innerHTML = JSON.stringify(schema);
    const $head = document.head;
    $head.append($schema);
  }
}
