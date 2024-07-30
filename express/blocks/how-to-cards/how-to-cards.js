import {
  createTag,
} from '../../scripts/utils.js';

export function addSchema(bl, heading) {
  const schema = {
    '@context': 'http://schema.org',
    '@type': 'HowTo',
    name: (heading && heading.textContent.trim()) || document.title,
    step: [],
  };

  bl.querySelectorAll('.content').forEach((step, i) => {
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

export function removePages(bl, cards) {}

export function addPages(bl, cards) {
  if (bl.querySelector('.page-control')) {
    
  }
  const dots = [];
  let curr = 0;
  const cnt = cards.length;
  const control = createTag('div', { class: 'page-control' });
  const pageStatus = createTag('div', { class: 'page-status' });
  const prev = createTag('div', { class: 'prev' }, 'p');
  const next = createTag('div', { class: 'next' }, 'n');
  const changePage = (target) => {
    cards[curr].classList.add('hide');
    cards[target].classList.remove('hide');
    dots[curr].classList.remove('curr');
    dots[target].classList.add('curr');
    curr = target;
  };
  prev.addEventListener('click', () => {
    changePage((curr - 1 + cnt) % cnt);
  });
  next.addEventListener('click', () => {
    changePage((curr + 1) % cnt);
  });
  cards.forEach((card, i) => {
    if (i > 0) card.classList.add('hide');
    const dot = createTag('div', { class: `dot${i === 0 ? ' curr' : ''}` });
    dots.push(dot);
    pageStatus.append(dot);
  });
  control.append(pageStatus, prev, next);
  bl.append(control);
}

export default function decorate(bl) {
  const section = bl.closest('.section');
  const heading = section.querySelector('h2, h3, h4');

  const cards = [...bl.querySelectorAll(':scope > div')];

  cards.forEach((div, index) => {
    div.classList.add('card');
    const content = div.querySelector('div');
    const tipNumber = createTag('div', { class: 'number' });
    tipNumber.append(
      createTag('span', { class: 'number-txt' }, index + 1),
      createTag('div', { class: 'number-bg' }),
    );
    content.prepend(tipNumber);
    content.classList.add('content');
  });

  const mediaQuery = window.matchMedia('(min-width: 900px)');
  // const cardCnt = cards.length;
  const needsPage = true || mediaQuery.match;

  if (needsPage) {
    addPages(bl, cards);
  }

  if (bl.classList.contains('schema')) {
    addSchema(bl, heading);
  }
}

decorate(document.querySelector('.how-to-cards'));
