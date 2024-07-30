import { createTag } from '../../scripts/utils.js';

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

const nextStepSVGHTML = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g id="Slider Button - Arrow - Right">
    <circle id="Ellipse 24477" cx="16" cy="16" r="16" fill="#E1E1E1"/>
    <path id="chevron-right" d="M14.6016 21.1996L19.4016 16.3996L14.6016 11.5996" stroke="#292929" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
`;
const prevStepSVGHTML = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g id="Slider Button - Arrow - Left">
    <circle id="Ellipse 24477" cx="16" cy="16" r="16" transform="matrix(-1 0 0 1 32 0)" fill="#E1E1E1"/>
    <path id="chevron-right" d="M17.3984 21.1996L12.5984 16.3996L17.3984 11.5996" stroke="#292929" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
export function addSlider(bl, cards) {
  const dots = [];
  let curr = 0;
  const cnt = cards.length;
  const control = createTag('div', { class: 'page-control' });
  const pageStatus = createTag('div', { class: 'page-status' });
  const prev = createTag('div', { class: 'prev' }, prevStepSVGHTML);
  const next = createTag('div', { class: 'next' }, nextStepSVGHTML);
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

async function syncMinHeights(groups) {
  const maxHeights = groups.map((els) => els
    .filter(Boolean)
    .reduce((max, e) => Math.max(max, e.offsetHeight), 0));
  maxHeights.forEach((maxHeight, i) => groups[i].forEach((e) => {
    if (e) e.style.minHeight = `${maxHeight}px`;
  }));
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

  addSlider(bl, cards);
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        syncMinHeights([cards]);
        bl.style.visibility = 'visible';
      }
    });
  });
  bl.style.visibility = 'hidden';
  observer.observe(bl);

  if (bl.classList.contains('schema')) {
    addSchema(bl, heading);
  }
}
