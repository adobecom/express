import { createTag, loadStyle } from '../../scripts/utils.js';

function initializeCarousel(selector, parent) {
  let currentIndex = 1;
  let scrollCount = 1;
  const carouselContent = selector
    ? parent.querySelectorAll(selector)
    : parent.querySelectorAll(':scope > *');

  carouselContent.forEach((el) => el.classList.add('basic-carousel-element'));

  const container = createTag('div', { class: 'basic-carousel-container' });
  const platform = createTag('div', { class: 'basic-carousel-platform' });

  const faderLeft = createTag('div', { class: 'basic-carousel-fader-left arrow-hidden' });
  const faderRight = createTag('div', { class: 'basic-carousel-fader-right arrow-hidden' });

  const arrowLeft = createTag('a', { class: 'button basic-carousel-arrow basic-carousel-arrow-left' });
  const arrowRight = createTag('a', { class: 'button basic-carousel-arrow basic-carousel-arrow-right' });
  arrowLeft.title = 'Carousel Left';
  arrowRight.title = 'Carousel Right';

  platform.append(...carouselContent);

  container.append(platform, faderLeft, faderRight);
  faderLeft.append(arrowLeft);
  faderRight.append(arrowRight);
  parent.append(container);

  const elements = platform.querySelectorAll('.basic-carousel-element');

  const determineScrollCount = () => {
    if (platform.closest('.four')) return 4;
    if (platform.closest('.three')) return 3;
    if (platform.closest('.two')) return 2;
    return 1;
  };
  scrollCount = window.innerWidth <= 600 ? 1 : determineScrollCount();

  const updateCarousel = () => {
    const elementWidth = elements[0].offsetWidth;
    const newScrollPos = currentIndex * elementWidth;

    platform.scrollTo({
      left: newScrollPos,
      behavior: 'smooth',
    });

    if (window.innerWidth <= 600) {
      elements.forEach((el, index) => {
        if (index === currentIndex) {
          el.style.opacity = '1';
        } else if (index === currentIndex - 1 || index === currentIndex + 1) {
          el.style.opacity = '0.5';
        } else {
          el.style.opacity = '0.2';
        }
      });
    } else {
      elements.forEach((el) => {
        el.style.opacity = '';
      });
    }

    faderLeft.classList.toggle('arrow-hidden', currentIndex === 0);
    faderRight.classList.toggle('arrow-hidden', currentIndex + scrollCount >= elements.length);
  };

  faderLeft.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex -= scrollCount;
      currentIndex = Math.max(0, currentIndex);
      updateCarousel();
    }
  });

  faderRight.addEventListener('click', () => {
    if (currentIndex + scrollCount < elements.length) {
      currentIndex += scrollCount;
      updateCarousel();
    }
  });

  window.addEventListener('resize', () => {
    const newScrollCount = determineScrollCount();
    if (newScrollCount !== scrollCount) {
      scrollCount = newScrollCount;
      updateCarousel();
    }
  });

  window.addEventListener('resize', updateCarousel);
  updateCarousel();
}

const isStyleSheetPresent = (stylesheetHref) => {
  for (const sheet of document.styleSheets) {
    try {
      if (sheet.href && sheet.href.includes(stylesheetHref)) {
        return true;
      }
    } catch (e) {
      console.error('Stylesheet loading error:', e);
    }
  }
  return false;
};

export function onBasicCarouselCSSLoad(selector, parent) {
  const stylesheetHref = '/express/blocks/shared/basic-carousel.css';

  const waitForCSS = () => new Promise((resolve) => {
    const interval = setInterval(() => {
      if (isStyleSheetPresent(stylesheetHref)) {
        clearInterval(interval);
        resolve();
      }
    }, 50);
  });

  waitForCSS().then(() => {
    initializeCarousel(selector, parent);
  });
}

export default async function buildBasicCarousel(selector, parent, options = {}) {
  loadStyle('/express/blocks/shared/basic-carousel.css', () => {
    onBasicCarouselCSSLoad(selector, parent, options);
  });
}
