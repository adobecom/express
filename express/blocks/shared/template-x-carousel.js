import buildCarousel from './carousel.js';

export default async function buildTemplateXCarousel(selector, parent, options = {}) {
  const {
    platform, faderLeft, faderRight,
  } = await buildCarousel(selector, parent, options);

  const moveCarouselToCenter = (direction) => {
    const elements = platform.querySelectorAll('.template.carousel-element');

    const visibleElement = Array.from(elements).find((el) => {
      const elRect = el.getBoundingClientRect();
      return elRect.left >= 0 && elRect.right <= window.innerWidth;
    });

    const targetElement = direction === 'next'
      ? visibleElement?.nextElementSibling
      : visibleElement?.previousElementSibling;

    if (targetElement) {
      window.innerWidth < 600 && elements.forEach((el) => {
        el.style.opacity = el === targetElement ? '1' : '0.5';
      });

      const viewportWidth = window.innerWidth;
      const cardWidth = targetElement.offsetWidth;
      const dynamicMarginLeft = (viewportWidth - cardWidth) / 2 - 12;

      targetElement.style.scrollMarginLeft = `${dynamicMarginLeft}px`;
      const newScrollPos = targetElement.offsetLeft - dynamicMarginLeft;

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

  return {
    platform,
    faderLeft: newFaderLeft,
    faderRight: newFaderRight,
  };
}
