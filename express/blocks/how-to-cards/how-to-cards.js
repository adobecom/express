import { createTag } from '../../scripts/utils.js';

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

function isFullyVisible(el, container) {
  const elementRect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  const fullyVisibleHorizontally = 
    elementRect.left >= containerRect.left && 
    elementRect.right <= containerRect.right;

  const fullyVisibleVertically = 
    elementRect.top >= containerRect.top && 
    elementRect.bottom <= containerRect.bottom;

  return fullyVisibleHorizontally && fullyVisibleVertically;
}

export function addSlider(bl, items, platform) {
  const dots = [];
  let curr = 0;
  const control = createTag('div', { class: 'page-control' });
  const pageStatus = createTag('div', { class: 'page-status' });
  const prev = createTag('button', { class: 'prev', title: 'carousel-prev' }, prevStepSVGHTML);
  prev.disabled = true;
  const next = createTag('button', { class: 'next', title: 'carousel-next' }, nextStepSVGHTML);
  const changePage = (target) => {
    dots[curr].classList.remove('curr');
    dots[target].classList.add('curr');
    curr = target;
  };
  prev.addEventListener('click', () => {
    next.disabled = false;
    platform.scrollLeft -= items[0].scrollWidth;
  });
  next.addEventListener('click', () => {
    prev.disabled = false;
    platform.scrollLeft += items[0].scrollWidth;
  });

  const firstDot = createTag('div', { class: 'dot curr' });
  dots.push(firstDot);
  pageStatus.append(firstDot);
  let fullyVisibleCnt = 0;
  items.forEach((item) => {
    if (isFullyVisible(item, platform)) {
      fullyVisibleCnt += 1;
    }
  });
  for (let i = 0; i < items.length - fullyVisibleCnt; i += 1) {
    const dot = createTag('div', { class: 'dot' });
    dots.push(dot);
    pageStatus.append(dot);
  }

  control.append(pageStatus, prev, next);
  bl.append(control);
  const handleProgress = (_) => {
    // console.log({entries});
    for (let i = 0; i < items.length; i += 1) {
      if (isFullyVisible(items[i], platform)) {
        console.log({i})
        changePage(i);
        return;
        // .--.. 1
        // --... 0
        // ..-- 2
        // first visible->non-visible: last is bar
        // last visible
      }
    }
  };
  const observer = new IntersectionObserver(handleProgress, { root: platform, threshold: 1 });
  items.forEach((item) => observer.observe(item));
}

export default function decorate(bl) {
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
    if (cardsContainer.scrollWidth > cardsContainer.clientWidth) {
      addSlider(bl, cards, cardsContainer);
    }
    observer.unobserve(bl);
  }).observe(bl);

  if (bl.classList.contains('schema')) {
    addSchema(bl, heading);
  }
}
