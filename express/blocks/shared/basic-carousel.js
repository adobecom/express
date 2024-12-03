import { createTag, loadStyle } from '../../scripts/utils.js';

let currentIndex = 1;

const getVisibleCount = (platform, elements) => {
  const platformRect = platform.getBoundingClientRect();
  return Array.from(elements).filter((el) => {
    const elRect = el.getBoundingClientRect();
    return (
      elRect.left >= platformRect.left && elRect.right <= platformRect.right
    );
  }).length;
};

function initializeCarousel(selector, parent) {
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
  arrowLeft.title = 'Basic Carousel Left';
  arrowRight.title = 'Basic Carousel Right';

  platform.append(...carouselContent);

  container.append(platform, faderLeft, faderRight);
  faderLeft.append(arrowLeft);
  faderRight.append(arrowRight);
  parent.append(container);

  const leftTrigger = createTag('div', { class: 'basic-carousel-left-trigger' });
  const rightTrigger = createTag('div', { class: 'basic-carousel-right-trigger' });

  platform.prepend(leftTrigger);
  platform.append(rightTrigger);
  const elements = platform.querySelectorAll('.template.basic-carousel-element');

  const updateCarousel = () => {
    const visibleCount = window.innerWidth <= 600 ? 1 : getVisibleCount(platform, elements);
    const elementWidth = elements[0].offsetWidth;
    const platformWidth = platform.offsetWidth;

    const newScrollPos = currentIndex * elementWidth - (platformWidth - elementWidth) / 2;
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
    faderRight.classList.toggle(
      'arrow-hidden',
      currentIndex + visibleCount >= elements.length,
    );
  };

  faderLeft.addEventListener('click', () => {
    const visibleCount = window.innerWidth <= 600 ? 1 : getVisibleCount(platform, elements);
    if (currentIndex > 0) {
      currentIndex -= visibleCount;
      currentIndex = Math.max(0, currentIndex);
      updateCarousel();
    }
  });

  faderRight.addEventListener('click', () => {
    const visibleCount = window.innerWidth <= 600 ? 1 : getVisibleCount(platform, elements);
    if (currentIndex < elements.length - visibleCount) {
      currentIndex += visibleCount;
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
      console.error('stylesheet loading error: ', e);
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
