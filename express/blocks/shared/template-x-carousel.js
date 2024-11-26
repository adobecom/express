import buildCarousel from './carousel.js';

export default async function buildTemplateXCarousel(selector, parent, options = {}) {
  const {
    platform, faderLeft, faderRight, setInitialState,
  } = await buildCarousel(selector, parent, options);

  const moveCarouselToCenter = (direction) => {
    const elements = platform.querySelectorAll('.template.carousel-element');

    const visibleElement = Array.from(elements).find((el) => {
      const elRect = el.getBoundingClientRect();
      return elRect.left >= 0 && elRect.right <= window.innerWidth; // Fully visible
    });

    const targetElement = direction === 'next'
      ? visibleElement?.nextElementSibling || elements[0] // Wrap to first card
      : visibleElement?.previousElementSibling || elements[elements.length - 1];

    if (targetElement) {
      window.innerWidth < 600 && elements.forEach((el) => {
        el.style.opacity = el === targetElement ? '1' : '0.5';
      });

      const viewportWidth = window.innerWidth;
      const cardWidth = targetElement.offsetWidth;
      const dynamicMarginLeft = (viewportWidth - cardWidth) / 2;

      let newScrollPos = targetElement.offsetLeft - dynamicMarginLeft;

      // Clamp the scroll position
      newScrollPos = Math.max(0, newScrollPos);
      console.log('platofrm', platform.scrollLeft);
      console.log('Final Scroll Position:', newScrollPos);

      platform.scrollTo({
        left: newScrollPos,
        behavior: 'smooth',
      });
    }
  };

  const newFaderLeft = faderLeft.cloneNode(true);
  faderLeft.replaceWith(newFaderLeft);
  newFaderLeft.addEventListener('click', () => {
    const isMobileCenteredCarousel = document.querySelectorAll('.template-x');
    const isSmallScreen = window.innerWidth < 600;
    if (isMobileCenteredCarousel && isSmallScreen) {
      moveCarouselToCenter('prev');
    } else {
      const increment = Math.max((platform.offsetWidth / 4) * 3, 300);
      platform.scrollLeft -= increment;
    }
  });

  const newFaderRight = faderRight.cloneNode(true);
  faderRight.replaceWith(newFaderRight);
  newFaderRight.addEventListener('click', () => {
    const isMobileCenteredCarousel = document.querySelectorAll('.template-x');
    const isSmallScreen = window.innerWidth < 600;
    if (isMobileCenteredCarousel && isSmallScreen) {
      moveCarouselToCenter('next');
    } else {
      const increment = Math.max((platform.offsetWidth / 4) * 3, 300);
      platform.scrollLeft += increment;
    }
  });

  const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      if (!(mutation.target.classList && mutation.target.classList.contains('media-wrapper'))) {
        setInitialState(platform, options, moveCarouselToCenter);
      }
    });
  });
  observer.observe(platform, { childList: true, subtree: true });

  return {
    platform,
    faderLeft: newFaderLeft,
    faderRight: newFaderRight,
  };
}
