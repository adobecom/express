import { createTag, loadStyle } from '../../scripts/utils.js';

function correctCenterAlignment(plat) {
  if (plat.parentElement.offsetWidth <= plat.offsetWidth) return;
  plat.parentElement.style.maxWidth = `${plat.offsetWidth}px`;
}

export function toggleFader(fader, show = fader.classList.contains('arrow-hidden')) {
  if (!fader) return;
  const platform = fader.parentElement.querySelector('.carousel-platform');
  const faderClass = fader.classList.contains('carousel-fader-left') ? 'left-fader' : 'right-fader';
  if (show) {
    platform.classList.add(faderClass);
    fader.classList.remove('arrow-hidden');
  } else {
    platform.classList.remove(faderClass);
    fader.classList.add('arrow-hidden');
  }
}

function initToggleTriggers(parent) {
  if (!parent) return;

  const isInHiddenSection = () => {
    const parentSection = parent.closest('.section');
    if (!parentSection) return false;
    return parentSection.dataset.toggle && parentSection.style.display === 'none';
  };

  const platform = parent.querySelector('.carousel-platform');
  const leftControl = parent.querySelector('.carousel-fader-left');
  const rightControl = parent.querySelector('.carousel-fader-right');

  const leftTrigger = createTag('div', { class: 'carousel-left-trigger' });
  const rightTrigger = createTag('div', { class: 'carousel-right-trigger' });

  const gap = window.getComputedStyle(platform, null).getPropertyValue('gap');
  if (gap !== 'normal') {
    const gapInt = parseInt(gap.replace('px', ''), 10);
    leftTrigger.style.marginRight = `-${gapInt + 1}px`;
    rightTrigger.style.marginLeft = `-${gapInt + 1}px`;
  }

  platform.prepend(leftTrigger);
  platform.append(rightTrigger);

  const slideIntersect = (entries) => {
    if (isInHiddenSection()) return;
    entries.forEach((entry) => {
      if (entry.target.classList.contains('carousel-left-trigger')) toggleFader(leftControl, !entry.isIntersecting);
      else if (entry.target.classList.contains('carousel-right-trigger')) toggleFader(rightControl, !entry.isIntersecting);
    });
  };
  const slideObserver = new IntersectionObserver(slideIntersect, { threshold: 0, root: parent });
  slideObserver.observe(leftTrigger);
  slideObserver.observe(rightTrigger);
}

export function onCarouselCSSLoad(selector, parent, options) {
  const carouselContent = selector ? parent.querySelectorAll(selector) : parent.querySelectorAll(':scope > *');
  carouselContent.forEach((el) => el.classList.add('carousel-element'));

  const container = createTag('div', { class: 'carousel-container' });
  const platform = createTag('div', { class: 'carousel-platform' });

  platform.append(...carouselContent);
  container.append(platform);

  // Scroll the carousel by clicking on the controls
  const moveCarousel = (increment) => {
    platform.scrollLeft -= increment;
  };

  if (!options.fadersDisabled) {
    const faderLeft = createTag('div', { class: 'carousel-fader-left arrow-hidden' });
    const arrowLeft = createTag('a', { class: 'button carousel-arrow carousel-arrow-left' });
    faderLeft.append(arrowLeft);
    faderLeft.addEventListener('click', () => {
      const increment = Math.max((platform.offsetWidth / 4) * 3, 300);
      moveCarousel(increment);
    });

    const faderRight = createTag('div', { class: 'carousel-fader-right arrow-hidden' });
    const arrowRight = createTag('a', { class: 'button carousel-arrow carousel-arrow-right' });
    faderRight.append(arrowRight);
    faderRight.addEventListener('click', () => {
      const increment = Math.max((platform.offsetWidth / 4) * 3, 300);
      moveCarousel(-increment);
    });

    if (options.infinityScrollEnabled) {
      platform.classList.add('left-fader', 'right-fader');
      faderLeft.classList.remove('arrow-hidden');
      faderRight.classList.remove('arrow-hidden');
    }

    container.append(faderLeft, faderRight);
  }

  parent.append(container);

  // Carousel loop functionality (if enabled)
  const stopScrolling = () => { // To prevent safari shakiness
    platform.style.overflowX = 'hidden';
    setTimeout(() => {
      platform.style.removeProperty('overflow-x');
    }, 20);
  };

  const moveToCenterIfNearTheEdge = (e = null) => {
    // Start at the center and snap back to center if the user scrolls to the edges
    const scrollPos = platform.scrollLeft;
    const maxScroll = platform.scrollWidth;
    if ((scrollPos > (maxScroll / 5) * 4) || scrollPos < 30) {
      if (e) e.preventDefault();
      stopScrolling();
      platform.scrollTo({
        left: ((maxScroll / 5) * 2),
        behavior: 'instant',
      });
    }
  };

  const infinityScroll = (children) => {
    const duplicateContent = () => {
      [...children].forEach((child) => {
        const duplicate = child.cloneNode(true);
        const duplicateLinks = duplicate.querySelectorAll('a');
        platform.append(duplicate);
        if (duplicate.tagName.toLowerCase() === 'a') {
          const linksPopulated = new CustomEvent('linkspopulated', { detail: [duplicate] });
          document.dispatchEvent(linksPopulated);
        }
        if (duplicateLinks) {
          const linksPopulated = new CustomEvent('linkspopulated', { detail: duplicateLinks });
          document.dispatchEvent(linksPopulated);
        }
      });
    };

    // Duplicate children to simulate smooth scrolling
    for (let i = 0; i < 4; i += 1) {
      duplicateContent();
    }

    platform.addEventListener('scroll', (e) => {
      moveToCenterIfNearTheEdge(e);
    }, { passive: false });
  };

  // set initial states
  const setInitialState = (scrollable, opts) => {
    if (opts.infinityScrollEnabled) infinityScroll([...carouselContent]);
    if (!opts.infinityScrollEnabled && !opts.fadersDisabled) initToggleTriggers(container);
    const onCarouselIntersect = ([entry], observer) => {
      if (!entry.isIntersecting) return;
      if (opts.centerAlign) correctCenterAlignment(scrollable);
      if (opts.startPosition === 'right') moveCarousel(-scrollable.scrollWidth);
      observer.unobserve(scrollable);
    };
    const carouselObserver = new IntersectionObserver(onCarouselIntersect, { rootMargin: '1000px', threshold: 0, root: container });
    carouselObserver.observe(scrollable);
  };
  setInitialState(platform, options);
}

export default async function buildCarousel(selector, parent, options = {}) {
  // Load CSS then build carousel
  return new Promise((resolve) => {
    loadStyle('/express/blocks/shared/carousel.css', () => {
      onCarouselCSSLoad(selector, parent, options);
      resolve();
    });
  });
}
