import { createTag, loadStyle } from '../../scripts/utils.js';

function initializeCarousel(selector, parent) {
  let currentIndex = 1;
  let scrollCount = 1;
  let touchStartX = 0;
  let touchEndX = 0;
  let scrolling = false;
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

  const determineScrollCount = () => {
    if (platform.closest('.four')) return 4;
    if (platform.closest('.three')) return 3;
    if (platform.closest('.two')) return 2;
    return 1;
  };
  scrollCount = window.innerWidth <= 600 ? 1 : determineScrollCount();

  const updateCarousel = () => {
    if (scrolling) return;
    scrolling = true;

    const elementWidth = elements[0].offsetWidth;
    const platformWidth = platform.offsetWidth;

    for (const element of elements) {
      const buttonContainer = element.querySelector('.button-container.singleton-hover');
      if (buttonContainer) {
        buttonContainer.classList.remove('singleton-hover');
        break;
      }
    }

    const newScrollPos = window.innerWidth <= 600
      ? currentIndex * elementWidth - (platformWidth - elementWidth) / 2
      : currentIndex * elementWidth;

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
        }
      });
    } else {
      elements.forEach((el) => {
        el.style.opacity = '';
      });
    }

    setTimeout(() => {
      scrolling = false;
    }, 300);

    faderLeft.classList.toggle('arrow-hidden', currentIndex === 0);
    faderRight.classList.toggle('arrow-hidden', currentIndex + scrollCount >= elements.length);
  };

  faderLeft.addEventListener('click', () => {
    if (scrolling || currentIndex === 0) return;
    currentIndex -= scrollCount;
    currentIndex = Math.max(0, currentIndex);
    updateCarousel();
  });

  faderRight.addEventListener('click', () => {
    if (scrolling || currentIndex + scrollCount >= elements.length) return;
    currentIndex += scrollCount;
    updateCarousel();
  });

  platform.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchEndX = touchStartX;
    e.preventDefault();
  });

  platform.addEventListener('touchmove', (e) => {
    touchEndX = e.touches[0].clientX;
    e.preventDefault();
  });

  platform.addEventListener('touchend', (e) => {
    const swipeDistance = touchEndX - touchStartX;
    if (Math.abs(swipeDistance) > 50) {
      if (swipeDistance > 0) {
        if (currentIndex > 0) {
          currentIndex -= 1;
          updateCarousel();
        }
      } else if (currentIndex + 1 < elements.length) {
        currentIndex += 1;
        updateCarousel();
      }
    } else {
      const tappedElement = document.elementFromPoint(
        e.changedTouches[0].clientX,
        e.changedTouches[0].clientY,
      );
      if (tappedElement) {
        const parentElement = tappedElement.closest('.template.basic-carousel-element');
        if (parentElement === elements[currentIndex]) {
          const btnContainer = parentElement.querySelector('.button-container');
          if (btnContainer) {
            btnContainer.dispatchEvent(new Event('carouseltapstart'));
            setTimeout(() => {
              btnContainer.dispatchEvent(new Event('carouseltapend'));
            }, 0);
          }
        }
      }
    }
  });

  window.addEventListener('resize', () => {
    const newScrollCount = window.innerWidth <= 600 ? 1 : determineScrollCount();
    if (newScrollCount !== scrollCount) {
      scrollCount = newScrollCount;
      updateCarousel();
    }
  });

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
    }, 0);
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
