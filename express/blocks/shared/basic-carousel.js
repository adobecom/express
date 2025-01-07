import { createTag, loadStyle } from '../../scripts/utils.js';

function initializeCarousel(selector, parent) {
  let currentIndex = window.innerWidth <= 600 ? 1 : 0;
  let scrollCount = 1;
  let touchStartX = 0;
  let touchEndX = 0;
  let scrolling = false;
  const carouselContent = selector
    ? parent.querySelectorAll(selector)
    : parent.querySelectorAll(':scope > *');

  carouselContent.forEach((el, index) => {
    el.classList.add('basic-carousel-element');
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', `Item ${index + 1} of ${carouselContent.length}`);

    el.addEventListener('focus', () => {
      currentIndex = index;
    });
    el.addEventListener('mouseleave', () => {
      if (window.innerWidth > 600) {
        const isHover = el.querySelector('.button-container.singleton-hover');
        if (isHover) {
          isHover.classList.remove('singleton-hover');
          isHover.classList.remove('hovering');
        }
      }
    });
  });

  const platform = createTag('div', { class: 'basic-carousel-platform' });
  const isTemplateXCarousel = platform.closest('.template-x');
  const container = createTag('div', {
    class: 'basic-carousel-container',
    role: 'region',
    'aria-label': isTemplateXCarousel ? 'Template-X Carousel' : 'Blog Carousel',
  });

  const faderLeft = createTag('div', { class: 'basic-carousel-fader-left arrow-hidden' });
  const faderRight = createTag('div', { class: 'basic-carousel-fader-right arrow-hidden' });
  const arrowLeft = createTag('a', {
    class: 'button basic-carousel-arrow basic-carousel-arrow-left',
    'aria-label': 'Scroll carousel left',
  });
  const arrowRight = createTag('a', {
    class: 'button basic-carousel-arrow basic-carousel-arrow-right',
    'aria-label': 'Scroll carousel right',
  });

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

    if (window.innerWidth <= 600) {
      for (const element of elements) {
        const buttonContainer = element.querySelector('.button-container.singleton-hover');
        if (buttonContainer) {
          buttonContainer.classList.remove('singleton-hover');
          break;
        }
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
        if (platform.closest('.one')) {
          if (index !== 1) {
            el.style.visibility = 'hidden';
          }
        }
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

    elements.forEach((el, index) => {
      el.addEventListener('focus', () => {
        currentIndex = index;
        updateCarousel();
      });
    });

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
      return;
    }
    const tappedElement = document.elementFromPoint(
      e.changedTouches[0].clientX,
      e.changedTouches[0].clientY,
    );
    const isBtn = tappedElement.querySelector('.button-container.singleton-hover');
    const isCard = tappedElement.closest('.template.basic-carousel-element');
    if (tappedElement) {
      const shareIconWrapper = tappedElement.closest('.share-icon-wrapper');
      const linkHref = isCard?.querySelector('a')?.href || isBtn?.querySelector('a')?.href;
      if (linkHref && shareIconWrapper) {
        e.stopPropagation();
        navigator.clipboard.writeText(linkHref).then(() => {
          const tooltip = shareIconWrapper.querySelector('.shared-tooltip');
          if (tooltip) {
            tooltip.classList.add('display-tooltip');
            setTimeout(() => tooltip.classList.remove('display-tooltip'), 2000);
          }
        }).catch((err) => {
          window.lana?.log('Failed to copy link:', err);
        });
        return;
      }
      if (isCard && linkHref) {
        const isHoverActive = isCard?.querySelector('.button-container.singleton-hover');
        if (isHoverActive && linkHref) {
          window.location.href = linkHref;
        }
        const tappedIndex = Array.from(elements).indexOf(isCard);
        if (tappedIndex !== -1) {
          if (tappedIndex < currentIndex) {
            currentIndex = Math.max(0, tappedIndex);
            updateCarousel();
          } else if (tappedIndex > currentIndex) {
            currentIndex = Math.min(elements.length - 1, tappedIndex);
            updateCarousel();
          } else {
            const btnContainer = isCard.querySelector('.button-container');
            if (btnContainer) {
              btnContainer.dispatchEvent(new Event('carouseltapstart'));
              setTimeout(() => {
                btnContainer.dispatchEvent(new Event('carouseltapend'));
              }, 0);
            }
          }
        }
      } else if (isBtn && linkHref) {
        window.location.href = linkHref;
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
