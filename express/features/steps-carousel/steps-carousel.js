import { createTag, loadStyle } from '../../scripts/utils.js';

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

  const fullyVisibleHorizontally = elementRect.left >= containerRect.left
    && elementRect.right <= containerRect.right;

  const fullyVisibleVertically = elementRect.top >= containerRect.top
    && elementRect.bottom <= containerRect.bottom;

  return fullyVisibleHorizontally && fullyVisibleVertically;
}

const CURR = 'steps-carousel-curr';
let resStyle;
const styleLoaded = new Promise((res) => {
  resStyle = res;
});
// loadStyle('/express/features/steps-carousel/steps-carousel.css', resStyle);
setTimeout(() => loadStyle('/express/features/steps-carousel/steps-carousel.css', resStyle), 5000);

export default async function carouselize(
  items,
  container = items?.[0]?.parentNode,
  root = container?.parentNode,
) {
  if (!root) return;
  const dots = [];
  const control = createTag('div', { class: 'steps-carousel-control' });
  const status = createTag('div', { class: 'status' });
  const prevButton = createTag('button', { class: 'prev', title: 'carousel-prev', disabled: true }, prevStepSVGHTML);
  const nextButton = createTag('button', { class: 'next', title: 'carousel-next' }, nextStepSVGHTML);

  items[0].classList.add(CURR);
  const len = items.length;
  const pageInc = (inc) => {
    const curr = items.find((item) => item.classList.contains(CURR));
    curr.classList.remove(CURR);
    const target = items[(items.indexOf(curr) + inc + len) % len];
    target.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    target.classList.add(CURR);
  };
  prevButton.addEventListener('click', () => pageInc(-1));
  nextButton.addEventListener('click', () => pageInc(1));

  const firstDot = createTag('div', { class: 'dot curr' });
  dots.push(firstDot);
  status.append(firstDot);
  let fullyVisibleCnt = 0;
  items.forEach((item) => {
    if (isFullyVisible(item, container)) {
      fullyVisibleCnt += 1;
    }
  });
  const lastIndex = items.length - fullyVisibleCnt;
  for (let i = 0; i < lastIndex; i += 1) {
    const dot = createTag('div', { class: 'dot' });
    dots.push(dot);
    status.append(dot);
  }

  control.append(status, prevButton, nextButton);

  await styleLoaded;
  root.append(control);
  const changePage = (target) => {
    dots.forEach((dot) => dot.classList.remove('curr'));
    dots[target].classList.add('curr');
    prevButton.disabled = target === 0;
    nextButton.disabled = target === lastIndex;
  };
  const scrollObserver = new IntersectionObserver(() => {
    for (let i = 0; i < len; i += 1) {
      if (isFullyVisible(items[i], container)) {
        changePage(i);
        return;
      }
    }
  }, { root: container, threshold: 1 });
  items.forEach((item) => scrollObserver.observe(item));
  if (container.scrollWidth <= container.clientWidth) {
    control.classList.add('hide');
  }
}
